/**
 * Recovery Manager
 *
 * Handles failed task recovery with intelligent strategy selection.
 * Uses synthesized feedback to determine the best recovery approach:
 * - retry-same: Retry unchanged (transient errors)
 * - retry-with-feedback: Retry with improvement guidance
 * - decompose-further: Break task into smaller subtasks
 * - escalate-model: Try with a more powerful model
 * - human-intervention: Request human assistance
 * - skip-with-fallback: Skip and use default/fallback output
 *
 * @module dag/feedback/recovery-manager
 */

import type { NodeId, TaskResult, TaskError, TaskErrorCode } from '../types';
import type { ExecutionRequest, ExecutionResponse, Executor } from '../executors/types';
import type { SynthesizedFeedback, FeedbackAssessment } from './feedback-synthesizer';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Recovery strategy types
 */
export type RecoveryStrategy =
  | 'retry-same'           // Just retry (transient error)
  | 'retry-with-feedback'  // Retry with improvement guidance
  | 'decompose-further'    // Break task into smaller pieces
  | 'escalate-model'       // Try with a more powerful model
  | 'human-intervention'   // Ask for human help
  | 'skip-with-fallback';  // Skip and use default output

/**
 * Recovery attempt record
 */
export interface RecoveryAttempt {
  /** Attempt number (1-based) */
  attemptNumber: number;

  /** Strategy used */
  strategy: RecoveryStrategy;

  /** When the attempt started */
  startedAt: Date;

  /** When the attempt completed */
  completedAt?: Date;

  /** Whether the attempt succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Modified prompt used (if different from original) */
  modifiedPrompt?: string;

  /** Model used for this attempt */
  model?: string;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  /** Whether recovery ultimately succeeded */
  success: boolean;

  /** The final node ID */
  nodeId: NodeId;

  /** Final output (if successful) */
  output?: unknown;

  /** Final confidence score */
  confidence?: number;

  /** All recovery attempts */
  attempts: RecoveryAttempt[];

  /** Total time spent recovering */
  totalDurationMs: number;

  /** Final strategy that worked (or last tried) */
  finalStrategy: RecoveryStrategy;

  /** Why recovery stopped */
  terminationReason: 'success' | 'max-attempts' | 'human-required' | 'unrecoverable' | 'skipped';

  /** Token usage across all attempts */
  totalTokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Recovery context
 */
export interface RecoveryContext {
  /** The original request */
  originalRequest: ExecutionRequest;

  /** The failed response */
  failedResponse: ExecutionResponse;

  /** Synthesized feedback (if available) */
  feedback?: SynthesizedFeedback;

  /** Previous recovery attempts */
  previousAttempts: RecoveryAttempt[];

  /** Maximum retry attempts allowed */
  maxAttempts: number;

  /** Available model escalation path */
  modelEscalation: ('haiku' | 'sonnet' | 'opus')[];
}

/**
 * Strategy selection result
 */
export interface StrategySelection {
  /** The selected strategy */
  strategy: RecoveryStrategy;

  /** Confidence in this selection (0-1) */
  confidence: number;

  /** Reasoning for selection */
  reasoning: string;

  /** Modified request (if applicable) */
  modifiedRequest?: Partial<ExecutionRequest>;
}

/**
 * Recovery manager configuration
 */
export interface RecoveryConfig {
  /** Maximum recovery attempts (default: 3) */
  maxAttempts?: number;

  /** Model escalation path (default: ['haiku', 'sonnet', 'opus']) */
  modelEscalation?: ('haiku' | 'sonnet' | 'opus')[];

  /** Default fallback output for skip strategy */
  defaultFallback?: unknown;

  /** Callback when human intervention is needed */
  onHumanRequired?: (context: RecoveryContext) => Promise<ExecutionResponse | null>;

  /** Callback to decompose a task further */
  onDecompose?: (request: ExecutionRequest) => Promise<ExecutionRequest[]>;

  /** Enable verbose logging */
  verbose?: boolean;
}

// =============================================================================
// RECOVERY MANAGER CLASS
// =============================================================================

/**
 * RecoveryManager handles intelligent task recovery after failures.
 *
 * @example
 * ```typescript
 * const recoveryManager = new RecoveryManager({
 *   maxAttempts: 3,
 *   modelEscalation: ['haiku', 'sonnet', 'opus'],
 * });
 *
 * const result = await recoveryManager.recover(
 *   executor,
 *   failedResponse,
 *   originalRequest,
 *   synthesizedFeedback
 * );
 *
 * if (result.success) {
 *   console.log('Recovered successfully:', result.output);
 * } else {
 *   console.log('Recovery failed:', result.terminationReason);
 * }
 * ```
 */
export class RecoveryManager {
  private config: Required<RecoveryConfig>;

  constructor(config: RecoveryConfig = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      modelEscalation: config.modelEscalation ?? ['haiku', 'sonnet', 'opus'],
      defaultFallback: config.defaultFallback ?? null,
      onHumanRequired: config.onHumanRequired ?? (async () => null),
      onDecompose: config.onDecompose ?? (async () => []),
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Attempt to recover from a failed task execution
   */
  async recover(
    executor: Executor,
    failedResponse: ExecutionResponse,
    originalRequest: ExecutionRequest,
    feedback?: SynthesizedFeedback
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const attempts: RecoveryAttempt[] = [];
    let totalTokenUsage = { inputTokens: 0, outputTokens: 0 };

    const context: RecoveryContext = {
      originalRequest,
      failedResponse,
      feedback,
      previousAttempts: [],
      maxAttempts: this.config.maxAttempts,
      modelEscalation: this.config.modelEscalation,
    };

    while (attempts.length < this.config.maxAttempts) {
      // Update context with previous attempts
      context.previousAttempts = [...attempts];

      // Select best strategy
      const selection = this.selectStrategy(context);

      if (this.config.verbose) {
        console.log(`[RecoveryManager] Attempt ${attempts.length + 1}: ${selection.strategy} (${selection.reasoning})`);
      }

      // Handle human intervention
      if (selection.strategy === 'human-intervention') {
        const humanResponse = await this.config.onHumanRequired(context);
        if (humanResponse?.success) {
          attempts.push({
            attemptNumber: attempts.length + 1,
            strategy: 'human-intervention',
            startedAt: new Date(),
            completedAt: new Date(),
            success: true,
          });
          return this.buildResult(true, humanResponse, attempts, startTime, 'success', totalTokenUsage);
        }
        return this.buildResult(false, failedResponse, attempts, startTime, 'human-required', totalTokenUsage);
      }

      // Handle skip with fallback
      if (selection.strategy === 'skip-with-fallback') {
        attempts.push({
          attemptNumber: attempts.length + 1,
          strategy: 'skip-with-fallback',
          startedAt: new Date(),
          completedAt: new Date(),
          success: true,
        });
        const fallbackResponse: ExecutionResponse = {
          success: true,
          nodeId: originalRequest.nodeId,
          output: this.config.defaultFallback,
          confidence: 0.3,
          metadata: {
            executor: executor.type,
            durationMs: 0,
          },
        };
        return this.buildResult(true, fallbackResponse, attempts, startTime, 'skipped', totalTokenUsage);
      }

      // Handle decompose further
      if (selection.strategy === 'decompose-further') {
        const subtasks = await this.config.onDecompose(originalRequest);
        if (subtasks.length === 0) {
          // Can't decompose, try next strategy
          attempts.push({
            attemptNumber: attempts.length + 1,
            strategy: 'decompose-further',
            startedAt: new Date(),
            completedAt: new Date(),
            success: false,
            error: 'Unable to decompose task further',
          });
          continue;
        }

        // Execute subtasks (simplified - in practice would be more sophisticated)
        // For now, just mark as needing decomposition and continue
        attempts.push({
          attemptNumber: attempts.length + 1,
          strategy: 'decompose-further',
          startedAt: new Date(),
          completedAt: new Date(),
          success: false,
          error: 'Decomposition requires external orchestration',
        });
        continue;
      }

      // Build modified request based on strategy
      const modifiedRequest = this.buildModifiedRequest(originalRequest, selection, context);

      // Execute retry
      const attemptStart = new Date();
      const response = await executor.execute(modifiedRequest);
      const attemptEnd = new Date();

      // Track token usage
      if (response.tokenUsage) {
        totalTokenUsage.inputTokens += response.tokenUsage.inputTokens;
        totalTokenUsage.outputTokens += response.tokenUsage.outputTokens;
      }

      const attempt: RecoveryAttempt = {
        attemptNumber: attempts.length + 1,
        strategy: selection.strategy,
        startedAt: attemptStart,
        completedAt: attemptEnd,
        success: response.success,
        modifiedPrompt: modifiedRequest.prompt !== originalRequest.prompt ? modifiedRequest.prompt : undefined,
        model: modifiedRequest.model,
        error: response.error?.message,
      };
      attempts.push(attempt);

      if (response.success) {
        return this.buildResult(true, response, attempts, startTime, 'success', totalTokenUsage);
      }

      // Update context with the new failed response for next iteration
      context.failedResponse = response;
    }

    // Max attempts reached
    return this.buildResult(false, failedResponse, attempts, startTime, 'max-attempts', totalTokenUsage);
  }

  /**
   * Select the best recovery strategy based on context
   */
  selectStrategy(context: RecoveryContext): StrategySelection {
    const { failedResponse, feedback, previousAttempts, modelEscalation } = context;
    const error = failedResponse.error;
    const attemptCount = previousAttempts.length;

    // If no error info, try retry-same first
    if (!error) {
      return {
        strategy: 'retry-same',
        confidence: 0.5,
        reasoning: 'No error details, attempting simple retry',
      };
    }

    // Check error type
    const errorBehavior = this.classifyError(error.code);

    // Transient errors → retry-same
    if (errorBehavior === 'transient' && attemptCount < 2) {
      return {
        strategy: 'retry-same',
        confidence: 0.8,
        reasoning: `Transient error (${error.code}), attempting retry`,
      };
    }

    // Check if feedback suggests critical issues
    if (feedback) {
      const hasChriticalIssues = feedback.criticalItems.length > 0;
      const assessment = feedback.assessment;

      // Critical issues → retry with feedback
      if (hasChriticalIssues && attemptCount === 0) {
        return {
          strategy: 'retry-with-feedback',
          confidence: 0.85,
          reasoning: `${feedback.criticalItems.length} critical issues identified, retry with guidance`,
        };
      }

      // Low grade + already tried feedback → escalate model
      if (assessment.grade === 'F' || assessment.grade === 'D') {
        const currentModelIndex = modelEscalation.indexOf(
          context.originalRequest.model || 'sonnet'
        );
        if (currentModelIndex < modelEscalation.length - 1) {
          return {
            strategy: 'escalate-model',
            confidence: 0.75,
            reasoning: `Quality too low (${assessment.grade}), escalating to more capable model`,
          };
        }
      }
    }

    // Model errors → escalate model (if not already at highest)
    if (errorBehavior === 'model-limitation') {
      const usedStrategies = new Set(previousAttempts.map(a => a.strategy));
      if (!usedStrategies.has('escalate-model')) {
        const currentModelIndex = modelEscalation.indexOf(
          context.originalRequest.model || 'sonnet'
        );
        if (currentModelIndex < modelEscalation.length - 1) {
          return {
            strategy: 'escalate-model',
            confidence: 0.7,
            reasoning: `Model limitation detected, escalating`,
          };
        }
      }
    }

    // Complex task detection → decompose
    if (errorBehavior === 'complexity' || this.isComplexTask(context.originalRequest)) {
      const usedStrategies = new Set(previousAttempts.map(a => a.strategy));
      if (!usedStrategies.has('decompose-further')) {
        return {
          strategy: 'decompose-further',
          confidence: 0.6,
          reasoning: 'Task appears too complex, attempting decomposition',
        };
      }
    }

    // Unrecoverable errors → human intervention
    if (errorBehavior === 'unrecoverable') {
      return {
        strategy: 'human-intervention',
        confidence: 0.9,
        reasoning: `Unrecoverable error (${error.code}), human assistance required`,
      };
    }

    // If we've tried multiple strategies without success → fallback
    if (attemptCount >= 2) {
      const usedStrategies = new Set(previousAttempts.map(a => a.strategy));
      if (usedStrategies.size >= 2) {
        return {
          strategy: 'skip-with-fallback',
          confidence: 0.7,
          reasoning: 'Multiple strategies failed, using fallback',
        };
      }
    }

    // Default: retry with feedback if we have it, otherwise retry same
    if (feedback && feedback.revisionPrompt) {
      return {
        strategy: 'retry-with-feedback',
        confidence: 0.6,
        reasoning: 'Using feedback for improved retry',
      };
    }

    return {
      strategy: 'retry-same',
      confidence: 0.4,
      reasoning: 'No better strategy identified, attempting retry',
    };
  }

  /**
   * Classify error type into behavioral categories
   */
  private classifyError(code: TaskErrorCode): 'transient' | 'model-limitation' | 'complexity' | 'unrecoverable' | 'unknown' {
    switch (code) {
      // Transient errors (worth retrying as-is)
      case 'TIMEOUT':
      case 'RATE_LIMITED':
        return 'transient';

      // Model limitations (escalate)
      case 'MODEL_ERROR':
      case 'TOOL_ERROR':
        return 'model-limitation';

      // Complexity issues (decompose)
      case 'INVALID_OUTPUT':
      case 'SCHEMA_MISMATCH':
        return 'complexity';

      // Unrecoverable (human needed)
      case 'PERMISSION_DENIED':
      case 'SCOPE_VIOLATION':
      case 'ISOLATION_BREACH':
      case 'CYCLE_DETECTED':
      case 'MISSING_DEPENDENCY':
        return 'unrecoverable';

      // Unknown (try retry with feedback)
      default:
        return 'unknown';
    }
  }

  /**
   * Detect if a task is likely too complex for single execution
   */
  private isComplexTask(request: ExecutionRequest): boolean {
    // Heuristics for complexity
    const promptLength = request.prompt.length;
    const hasManyDependencies = (request.dependencyResults?.size || 0) > 5;
    const hasCodeGenMarkers = /implement|create|build|develop/.test(request.prompt.toLowerCase());
    const hasMultipleSteps = /\d\.\s|\bfirst\b|\bthen\b|\bfinally\b/i.test(request.prompt);

    return (
      promptLength > 5000 ||
      (hasManyDependencies && hasCodeGenMarkers) ||
      hasMultipleSteps
    );
  }

  /**
   * Build a modified request based on selected strategy
   */
  private buildModifiedRequest(
    original: ExecutionRequest,
    selection: StrategySelection,
    context: RecoveryContext
  ): ExecutionRequest {
    const modified = { ...original };

    switch (selection.strategy) {
      case 'retry-same':
        // No modifications
        break;

      case 'retry-with-feedback':
        if (context.feedback?.revisionPrompt) {
          modified.prompt = this.augmentPromptWithFeedback(
            original.prompt,
            context.feedback
          );
        }
        break;

      case 'escalate-model':
        const currentModelIndex = this.config.modelEscalation.indexOf(
          original.model || 'sonnet'
        );
        if (currentModelIndex < this.config.modelEscalation.length - 1) {
          modified.model = this.config.modelEscalation[currentModelIndex + 1];
        }
        break;

      default:
        break;
    }

    // Apply any modifications from selection
    if (selection.modifiedRequest) {
      Object.assign(modified, selection.modifiedRequest);
    }

    return modified;
  }

  /**
   * Augment prompt with feedback for retry
   */
  private augmentPromptWithFeedback(
    originalPrompt: string,
    feedback: SynthesizedFeedback
  ): string {
    const parts = [
      '=== PREVIOUS ATTEMPT FEEDBACK ===',
      feedback.summary,
      '',
      feedback.revisionPrompt,
      '',
      '=== ORIGINAL TASK ===',
      originalPrompt,
    ];

    return parts.join('\n');
  }

  /**
   * Build the final recovery result
   */
  private buildResult(
    success: boolean,
    response: ExecutionResponse,
    attempts: RecoveryAttempt[],
    startTime: number,
    terminationReason: RecoveryResult['terminationReason'],
    tokenUsage: { inputTokens: number; outputTokens: number }
  ): RecoveryResult {
    const finalStrategy = attempts.length > 0
      ? attempts[attempts.length - 1].strategy
      : 'retry-same';

    return {
      success,
      nodeId: response.nodeId,
      output: response.output,
      confidence: response.confidence,
      attempts,
      totalDurationMs: Date.now() - startTime,
      finalStrategy,
      terminationReason,
      totalTokenUsage: tokenUsage.inputTokens > 0 ? tokenUsage : undefined,
    };
  }

  /**
   * Get a summary of recovery capabilities
   */
  getCapabilities(): {
    maxAttempts: number;
    availableStrategies: RecoveryStrategy[];
    modelEscalation: string[];
  } {
    return {
      maxAttempts: this.config.maxAttempts,
      availableStrategies: [
        'retry-same',
        'retry-with-feedback',
        'decompose-further',
        'escalate-model',
        'human-intervention',
        'skip-with-fallback',
      ],
      modelEscalation: this.config.modelEscalation,
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/** Default recovery manager instance */
export const recoveryManager = new RecoveryManager();

/**
 * Quick recovery attempt with default settings
 */
export async function attemptRecovery(
  executor: Executor,
  failedResponse: ExecutionResponse,
  originalRequest: ExecutionRequest,
  feedback?: SynthesizedFeedback
): Promise<RecoveryResult> {
  return recoveryManager.recover(executor, failedResponse, originalRequest, feedback);
}

/**
 * Create a configured recovery manager
 */
export function createRecoveryManager(config: RecoveryConfig): RecoveryManager {
  return new RecoveryManager(config);
}

/**
 * Iteration Detector
 *
 * Analyzes task execution results to determine when iteration is needed.
 * Detects failures, low-quality outputs, and situations requiring retry.
 */

import type { NodeId, TaskResult, TaskError } from '../types';

export interface IterationSignal {
  /** Node that needs iteration */
  nodeId: NodeId;

  /** Why iteration is needed */
  reason: IterationReason;

  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Should this block dependent tasks? */
  blocking: boolean;

  /** Suggested retry strategy */
  retryStrategy: RetryStrategy;

  /** Additional context for retry */
  context?: Record<string, unknown>;
}

export type IterationReason =
  | 'task-failed'
  | 'low-confidence'
  | 'validation-failed'
  | 'hallucination-detected'
  | 'incomplete-output'
  | 'timeout'
  | 'dependency-failed';

export interface RetryStrategy {
  maxRetries: number;
  promptModification: 'add-context' | 'simplify' | 'be-specific' | 'change-approach';
  tryDifferentSkill?: boolean;
  tryDifferentModel?: 'haiku' | 'sonnet' | 'opus';
  delayMs?: number;
}

export interface DetectorConfig {
  minConfidence: number;
  maxRetries: number;
  detectHallucinations: boolean;
  validators?: Map<NodeId, (result: TaskResult) => boolean>;
}

export class IterationDetector {
  private config: DetectorConfig;
  private retryCount: Map<NodeId, number>;

  constructor(config: Partial<DetectorConfig> = {}) {
    this.config = {
      minConfidence: config.minConfidence ?? 0.7,
      maxRetries: config.maxRetries ?? 3,
      detectHallucinations: config.detectHallucinations ?? true,
      validators: config.validators ?? new Map(),
    };
    this.retryCount = new Map();
  }

  analyzeResult(
    nodeId: NodeId,
    result: TaskResult | null,
    error: TaskError | null
  ): IterationSignal | null {
    if (error) {
      return this.handleError(nodeId, error);
    }

    if (!result) {
      return {
        nodeId,
        reason: 'task-failed',
        severity: 'critical',
        blocking: true,
        retryStrategy: {
          maxRetries: this.config.maxRetries,
          promptModification: 'add-context',
          delayMs: 1000,
        },
      };
    }

    if (result.confidence < this.config.minConfidence) {
      return this.handleLowConfidence(nodeId, result);
    }

    if (this.config.detectHallucinations && this.detectHallucination(result)) {
      return this.handleHallucination(nodeId, result);
    }

    const validator = this.config.validators.get(nodeId);
    if (validator && !validator(result)) {
      return this.handleValidationFailure(nodeId, result);
    }

    if (this.isIncomplete(result)) {
      return this.handleIncompleteOutput(nodeId, result);
    }

    return null;
  }

  shouldRetry(nodeId: NodeId): boolean {
    const retries = this.retryCount.get(nodeId) ?? 0;
    return retries < this.config.maxRetries;
  }

  recordRetry(nodeId: NodeId): void {
    const retries = this.retryCount.get(nodeId) ?? 0;
    this.retryCount.set(nodeId, retries + 1);
  }

  getRetryCount(nodeId: NodeId): number {
    return this.retryCount.get(nodeId) ?? 0;
  }

  resetRetryCount(nodeId: NodeId): void {
    this.retryCount.delete(nodeId);
  }

  private handleError(nodeId: NodeId, error: TaskError): IterationSignal {
    const retries = this.getRetryCount(nodeId);
    let severity: IterationSignal['severity'] = 'high';
    
    if (retries >= this.config.maxRetries - 1) {
      severity = 'critical';
    } else if (error.retryable === false) {
      severity = 'critical';
    }

    return {
      nodeId,
      reason: 'task-failed',
      severity,
      blocking: true,
      retryStrategy: {
        maxRetries: this.config.maxRetries,
        promptModification: this.getPromptModificationForError(error),
        tryDifferentSkill: retries >= 2,
        delayMs: Math.min(1000 * Math.pow(2, retries), 10000),
      },
      context: {
        error: error.message,
        code: error.code,
        retryCount: retries,
      },
    };
  }

  private handleLowConfidence(nodeId: NodeId, result: TaskResult): IterationSignal {
    return {
      nodeId,
      reason: 'low-confidence',
      severity: 'medium',
      blocking: false,
      retryStrategy: {
        maxRetries: this.config.maxRetries,
        promptModification: 'be-specific',
        tryDifferentModel: 'opus',
      },
      context: {
        confidence: result.confidence,
        threshold: this.config.minConfidence,
      },
    };
  }

  private handleHallucination(nodeId: NodeId, result: TaskResult): IterationSignal {
    return {
      nodeId,
      reason: 'hallucination-detected',
      severity: 'high',
      blocking: true,
      retryStrategy: {
        maxRetries: this.config.maxRetries,
        promptModification: 'be-specific',
        tryDifferentSkill: true,
      },
      context: { output: result.output },
    };
  }

  private handleValidationFailure(nodeId: NodeId, result: TaskResult): IterationSignal {
    return {
      nodeId,
      reason: 'validation-failed',
      severity: 'high',
      blocking: true,
      retryStrategy: {
        maxRetries: this.config.maxRetries,
        promptModification: 'add-context',
      },
      context: { output: result.output },
    };
  }

  private handleIncompleteOutput(nodeId: NodeId, result: TaskResult): IterationSignal {
    return {
      nodeId,
      reason: 'incomplete-output',
      severity: 'medium',
      blocking: false,
      retryStrategy: {
        maxRetries: this.config.maxRetries,
        promptModification: 'be-specific',
      },
      context: { output: result.output },
    };
  }

  private getPromptModificationForError(error: TaskError): RetryStrategy['promptModification'] {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('timeout') || errorMsg.includes('time')) {
      return 'simplify';
    } else if (errorMsg.includes('permission') || errorMsg.includes('access')) {
      return 'change-approach';
    }
    return 'add-context';
  }

  private detectHallucination(result: TaskResult): boolean {
    const output = result.output;
    if (typeof output === 'string') {
      const suspiciousPatterns = [
        /definitely.*without any doubt/i,
        /absolutely certain.*always/i,
        /proven fact that.*100%/i,
      ];
      return suspiciousPatterns.some(pattern => pattern.test(output));
    }
    return false;
  }

  private isIncomplete(result: TaskResult): boolean {
    const output = result.output;
    if (typeof output === 'string') {
      if (output.trim().length < 50) return true;
      const incompletePatterns = [
        /\.\.\.\s*$/,
        /to be continued/i,
        /\[truncated\]/i,
        /\[incomplete\]/i,
      ];
      return incompletePatterns.some(pattern => pattern.test(output));
    }
    if (typeof output === 'object' && output !== null) {
      const obj = output as Record<string, unknown>;
      if (Object.keys(obj).length < 2) return true;
    }
    return false;
  }
}

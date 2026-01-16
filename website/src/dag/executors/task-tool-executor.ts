/**
 * Task Tool Executor - In-Session Execution via Claude Code Task Tool
 *
 * This executor uses Claude Code's Task tool to spawn sub-agents.
 * It maintains backward compatibility with the original DAG execution approach.
 *
 * Key characteristics:
 * - ~20k token overhead per task (system prompt, tool definitions)
 * - Maximum 10 parallel tasks (hard limit)
 * - Shared context with parent session
 * - Full Claude Code capabilities (all tools available)
 *
 * When to use:
 * - Tasks that need to reference parent conversation
 * - Tasks that need full tool access
 * - When token cost is not a concern
 *
 * When NOT to use:
 * - Cost-sensitive applications (use ProcessExecutor instead)
 * - Need >10 parallel tasks (use ProcessExecutor)
 * - Need true isolation (use WorktreeExecutor)
 */

import type {
  Executor,
  ExecutorType,
  ExecutorCapabilities,
  ExecutionRequest,
  ExecutionResponse,
  ExecutionProgress,
  TaskToolExecutorConfig,
} from './types';
import type { NodeId, TaskResult, TaskError } from '../types';

/**
 * Task tool call structure (matches Claude Code's Task tool)
 */
export interface TaskToolCall {
  description: string;
  prompt: string;
  subagent_type: string;
  model?: 'haiku' | 'sonnet' | 'opus';
  max_turns?: number;
  run_in_background?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<TaskToolExecutorConfig, 'type'>> = {
  defaultModel: 'sonnet',
  defaultTimeoutMs: 300000, // 5 minutes
  verbose: false,
  maxParallel: 10, // Hard limit in Claude Code
  runInBackground: false, // Broken in current version
};

/**
 * Task Tool Executor Implementation
 *
 * IMPORTANT: This executor generates Task tool call structures but cannot
 * actually execute them directly. The calls must be made by the parent
 * Claude Code session. This is a limitation of the architecture.
 *
 * For actual parallel execution, use ProcessExecutor or WorktreeExecutor.
 */
export class TaskToolExecutor implements Executor {
  readonly type: ExecutorType = 'task-tool';
  readonly name = 'Claude Code Task Tool Executor';

  private config: Required<Omit<TaskToolExecutorConfig, 'type'>>;

  constructor(config: TaskToolExecutorConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Task tool is always available in Claude Code sessions
   */
  async isAvailable(): Promise<boolean> {
    // Task tool is available if we're running in Claude Code
    // We can't actually detect this, so we return true and let it fail
    return true;
  }

  /**
   * Get executor capabilities
   */
  getCapabilities(): ExecutorCapabilities {
    return {
      maxParallelism: this.config.maxParallel,
      tokenOverheadPerTask: 20000, // ~20k tokens per task!
      sharedContext: true, // Key benefit of Task tool
      supportsStreaming: false,
      efficientDependencyPassing: true, // Can reference parent context
      trueIsolation: false,
    };
  }

  /**
   * Generate a Task tool call for a single request
   *
   * NOTE: This generates the call structure but does not execute it.
   * The parent session must make the actual Task tool call.
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const taskCall = this.buildTaskCall(request);

    // We can't actually execute Task calls from within code
    // This returns the call structure for the parent to execute
    return {
      success: true,
      nodeId: request.nodeId,
      output: {
        _type: 'task-tool-call',
        _note: 'This is a Task tool call structure. Execute via Claude Code.',
        call: taskCall,
      },
      confidence: 1.0,
      metadata: {
        executor: 'task-tool',
        durationMs: 0,
      },
    };
  }

  /**
   * Generate parallel Task tool calls
   *
   * This generates all the Task calls that would be made in a single message
   * to achieve parallel execution in Claude Code.
   */
  async executeParallel(
    requests: ExecutionRequest[],
    onProgress?: (progress: ExecutionProgress) => void
  ): Promise<Map<NodeId, ExecutionResponse>> {
    const results = new Map<NodeId, ExecutionResponse>();

    // Check parallelism limit
    if (requests.length > this.config.maxParallel) {
      console.warn(
        `[TaskToolExecutor] Requested ${requests.length} parallel tasks, ` +
        `but limit is ${this.config.maxParallel}. Tasks will be batched.`
      );
    }

    // Generate all task calls
    const taskCalls: Array<{ nodeId: NodeId; call: TaskToolCall }> = [];

    for (const request of requests) {
      onProgress?.({
        nodeId: request.nodeId,
        status: 'starting',
        message: 'Generating Task tool call',
      });

      const call = this.buildTaskCall(request);
      taskCalls.push({ nodeId: request.nodeId, call });

      // Each call is "completed" in the sense that we generated it
      const response: ExecutionResponse = {
        success: true,
        nodeId: request.nodeId,
        output: {
          _type: 'task-tool-call',
          _note: 'Execute via Claude Code Task tool',
          call,
        },
        confidence: 1.0,
        metadata: {
          executor: 'task-tool',
          durationMs: 0,
        },
      };

      results.set(request.nodeId, response);

      onProgress?.({
        nodeId: request.nodeId,
        status: 'completed',
      });
    }

    // Log the parallel execution format
    if (this.config.verbose) {
      console.log('[TaskToolExecutor] Generated parallel Task calls:');
      console.log(this.formatParallelMessage(taskCalls.map(t => t.call)));
    }

    return results;
  }

  /**
   * Build a Task tool call from an ExecutionRequest
   */
  private buildTaskCall(request: ExecutionRequest): TaskToolCall {
    return {
      description: this.truncate(request.description, 50),
      prompt: this.buildPrompt(request),
      subagent_type: request.agentType || 'general-purpose',
      model: request.model || this.config.defaultModel,
      max_turns: 10,
      run_in_background: this.config.runInBackground,
    };
  }

  /**
   * Build the prompt for a Task call
   */
  private buildPrompt(request: ExecutionRequest): string {
    const parts: string[] = [];

    // Task description
    parts.push(`## Task: ${request.description}`);
    parts.push('');

    // Skill instructions
    if (request.skillId) {
      parts.push(`Execute the ${request.skillId} skill.`);
      parts.push('');
    }

    // Dependency context (efficiently passed via shared context)
    if (request.dependencyResults && request.dependencyResults.size > 0) {
      parts.push('## Results from Dependencies');
      for (const [depId, result] of request.dependencyResults) {
        parts.push(`### ${depId}`);
        parts.push('```json');
        parts.push(JSON.stringify(result.output, null, 2));
        parts.push('```');
        parts.push('');
      }
    }

    // Additional context
    if (request.context && Object.keys(request.context).length > 0) {
      parts.push('## Context');
      parts.push('```json');
      parts.push(JSON.stringify(request.context, null, 2));
      parts.push('```');
      parts.push('');
    }

    // Main instructions
    parts.push('## Instructions');
    parts.push(request.prompt);
    parts.push('');

    // Output format
    parts.push('## Output Format');
    parts.push('Return: {output: <result>, confidence: 0-1}');

    return parts.join('\n');
  }

  /**
   * Format multiple Task calls for parallel execution in Claude Code
   *
   * When you include multiple Task calls in a single message, Claude Code
   * executes them in parallel (up to the limit).
   */
  formatParallelMessage(calls: TaskToolCall[]): string {
    const parts = ['Execute these tasks in parallel:\n'];

    for (const call of calls) {
      parts.push(`\n### ${call.description}\n`);
      parts.push('```json');
      parts.push(JSON.stringify(call, null, 2));
      parts.push('```\n');
    }

    return parts.join('\n');
  }

  /**
   * Truncate string to max length
   */
  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
  }
}

/**
 * Factory function
 */
export function createTaskToolExecutor(
  config?: Partial<TaskToolExecutorConfig>
): TaskToolExecutor {
  return new TaskToolExecutor({
    type: 'task-tool',
    ...config,
  });
}

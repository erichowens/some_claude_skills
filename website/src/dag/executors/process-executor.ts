/**
 * Process Executor - Parallel Execution via claude -p
 *
 * This executor spawns independent Claude CLI processes for each task.
 * Key benefits:
 * - ZERO token overhead (no Task tool context loading)
 * - TRUE parallel execution (limited by machine, not API)
 * - Complete isolation between tasks
 *
 * Tradeoffs:
 * - No shared context (must pass everything in prompt)
 * - Requires output parsing (JSON format recommended)
 * - Each process starts fresh (no conversation history)
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import type {
  Executor,
  ExecutorType,
  ExecutorCapabilities,
  ExecutionRequest,
  ExecutionResponse,
  ExecutionProgress,
  ProcessExecutorConfig,
} from './types';
import type { NodeId, TaskError } from '../types';

const execAsync = promisify(exec);

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<ProcessExecutorConfig, 'type'>> = {
  defaultModel: 'sonnet',
  defaultTimeoutMs: 300000, // 5 minutes
  verbose: false,
  claudePath: 'claude',
  outputFormat: 'json',
  maxProcesses: 10,
  cwd: process.cwd(),
};

/**
 * Process Executor Implementation
 *
 * Executes DAG nodes by spawning claude -p processes.
 * Each process is completely independent - no shared state.
 */
export class ProcessExecutor implements Executor {
  readonly type: ExecutorType = 'process';
  readonly name = 'Claude CLI Process Executor';

  private config: Required<Omit<ProcessExecutorConfig, 'type'>>;
  private activeProcesses: Map<NodeId, ReturnType<typeof spawn>> = new Map();

  constructor(config: ProcessExecutorConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Check if claude CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync(`${this.config.claudePath} --version`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get executor capabilities
   */
  getCapabilities(): ExecutorCapabilities {
    return {
      maxParallelism: this.config.maxProcesses,
      tokenOverheadPerTask: 0, // No Task tool overhead!
      sharedContext: false,
      supportsStreaming: true,
      efficientDependencyPassing: false, // Must serialize in prompt
      trueIsolation: true,
    };
  }

  /**
   * Execute a single task via claude -p
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
      // Build the prompt with dependency context baked in
      const fullPrompt = this.buildPromptWithContext(request);

      // Escape the prompt for shell
      const escapedPrompt = this.escapeForShell(fullPrompt);

      // Build claude command
      const model = request.model || this.config.defaultModel;
      const cmd = `${this.config.claudePath} -p "${escapedPrompt}" --output-format ${this.config.outputFormat} --model ${model}`;

      if (this.config.verbose) {
        console.log(`[ProcessExecutor] Running: ${request.nodeId}`);
      }

      // Execute with timeout
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: this.config.cwd,
        timeout: request.timeoutMs || this.config.defaultTimeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Parse output
      const result = this.parseOutput(stdout, request.nodeId);

      return {
        success: true,
        nodeId: request.nodeId,
        output: result.output,
        confidence: result.confidence || 0.9,
        metadata: {
          executor: 'process',
          durationMs: Date.now() - startTime,
          rawOutput: stdout,
        },
      };
    } catch (error: unknown) {
      const err = error as Error & { code?: string; killed?: boolean };

      return {
        success: false,
        nodeId: request.nodeId,
        error: {
          code: err.killed ? 'TIMEOUT' : 'TOOL_ERROR',
          message: err.message,
          sourceNodeId: request.nodeId,
          retryable: !err.killed,
        } as TaskError,
        metadata: {
          executor: 'process',
          durationMs: Date.now() - startTime,
          exitCode: err.code ? parseInt(err.code) : undefined,
        },
      };
    }
  }

  /**
   * Execute multiple tasks in parallel
   *
   * This is where ProcessExecutor shines - TRUE parallelism
   * without the Task tool's 10-task limit or token overhead.
   */
  async executeParallel(
    requests: ExecutionRequest[],
    onProgress?: (progress: ExecutionProgress) => void
  ): Promise<Map<NodeId, ExecutionResponse>> {
    const results = new Map<NodeId, ExecutionResponse>();

    // Batch if exceeding maxProcesses
    const batches = this.batchRequests(requests, this.config.maxProcesses);

    for (const batch of batches) {
      // Notify starting
      for (const req of batch) {
        onProgress?.({
          nodeId: req.nodeId,
          status: 'starting',
          message: `Spawning claude process for ${req.nodeId}`,
        });
      }

      // Execute batch in parallel
      const batchPromises = batch.map(async (req) => {
        onProgress?.({
          nodeId: req.nodeId,
          status: 'running',
        });

        const result = await this.execute(req);

        onProgress?.({
          nodeId: req.nodeId,
          status: result.success ? 'completed' : 'failed',
          message: result.error?.message,
        });

        return result;
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Collect results
      for (const result of batchResults) {
        results.set(result.nodeId, result);
      }
    }

    return results;
  }

  /**
   * Clean up any running processes
   */
  async cleanup(): Promise<void> {
    for (const [nodeId, proc] of this.activeProcesses) {
      try {
        proc.kill('SIGTERM');
        console.log(`[ProcessExecutor] Killed process for ${nodeId}`);
      } catch {
        // Process may already be dead
      }
    }
    this.activeProcesses.clear();
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Build prompt with dependency results baked in
   *
   * Since processes don't share context, we must include
   * all dependency results in the prompt itself.
   */
  private buildPromptWithContext(request: ExecutionRequest): string {
    const parts: string[] = [];

    // Task description
    parts.push(`# Task: ${request.description}`);
    parts.push('');

    // Skill/agent context
    if (request.skillId) {
      parts.push(`You are executing the "${request.skillId}" skill.`);
      parts.push('');
    }

    // Dependency results (compact format to minimize tokens)
    if (request.dependencyResults && request.dependencyResults.size > 0) {
      parts.push('## Context from Previous Steps');
      for (const [depId, result] of request.dependencyResults) {
        // Only include essential output, not full result
        const output = this.summarizeOutput(result.output);
        parts.push(`- ${depId}: ${output}`);
      }
      parts.push('');
    }

    // Additional context
    if (request.context && Object.keys(request.context).length > 0) {
      parts.push('## Additional Context');
      parts.push(JSON.stringify(request.context, null, 2));
      parts.push('');
    }

    // Main prompt
    parts.push('## Instructions');
    parts.push(request.prompt);
    parts.push('');

    // Output format
    parts.push('## Output Format');
    parts.push('Respond with valid JSON: {"output": <your result>, "confidence": 0.0-1.0}');

    return parts.join('\n');
  }

  /**
   * Summarize output for context passing
   * Keep it minimal to avoid token bloat
   */
  private summarizeOutput(output: unknown): string {
    if (output === null || output === undefined) {
      return 'completed';
    }

    if (typeof output === 'string') {
      return output.length > 200 ? output.slice(0, 200) + '...' : output;
    }

    if (typeof output === 'object') {
      const str = JSON.stringify(output);
      return str.length > 200 ? str.slice(0, 200) + '...' : str;
    }

    return String(output);
  }

  /**
   * Escape prompt for shell execution
   */
  private escapeForShell(prompt: string): string {
    // Replace double quotes with escaped quotes
    // Replace newlines with literal \n
    return prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
  }

  /**
   * Parse output from claude -p
   */
  private parseOutput(
    stdout: string,
    nodeId: NodeId
  ): { output: unknown; confidence?: number } {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(stdout.trim());

      // Handle wrapped format
      if (parsed.output !== undefined) {
        return {
          output: parsed.output,
          confidence: parsed.confidence,
        };
      }

      // Handle raw format
      return { output: parsed };
    } catch {
      // If not JSON, treat as text output
      return {
        output: stdout.trim(),
        confidence: 0.7, // Lower confidence for unparsed output
      };
    }
  }

  /**
   * Split requests into batches
   */
  private batchRequests(
    requests: ExecutionRequest[],
    batchSize: number
  ): ExecutionRequest[][] {
    const batches: ExecutionRequest[][] = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    return batches;
  }
}

/**
 * Factory function
 */
export function createProcessExecutor(
  config?: Partial<ProcessExecutorConfig>
): ProcessExecutor {
  return new ProcessExecutor({
    type: 'process',
    ...config,
  });
}

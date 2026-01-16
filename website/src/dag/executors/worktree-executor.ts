/**
 * Worktree Executor - True Parallel Isolation via Git Worktrees
 *
 * This executor creates separate git worktrees for each task,
 * running fully independent Claude sessions.
 *
 * Key benefits:
 * - UNLIMITED parallelism (limited only by machine resources)
 * - ZERO token overhead (each session starts fresh)
 * - TRUE file isolation (no conflicts possible)
 * - Full Claude sessions (not just prompts)
 *
 * Tradeoffs:
 * - Requires git repository
 * - Creates branches that need merging
 * - Higher setup/teardown cost
 * - More complex coordination
 *
 * Inspired by:
 * - Crystal (github.com/stravu/crystal)
 * - Claude Squad
 * - GitButler hooks
 */

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import type {
  Executor,
  ExecutorType,
  ExecutorCapabilities,
  ExecutionRequest,
  ExecutionResponse,
  ExecutionProgress,
  WorktreeExecutorConfig,
} from './types';
import type { NodeId, TaskError } from '../types';

const execAsync = promisify(exec);

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<WorktreeExecutorConfig, 'type'>> = {
  defaultModel: 'sonnet',
  defaultTimeoutMs: 600000, // 10 minutes (longer for full sessions)
  verbose: false,
  worktreeBaseDir: '../.dag-worktrees',
  branchPrefix: 'dag/',
  autoMerge: false,
  maxWorktrees: 5, // Conservative default
};

/**
 * Worktree state tracking
 */
interface WorktreeState {
  nodeId: NodeId;
  worktreePath: string;
  branchName: string;
  process?: ChildProcess;
  status: 'creating' | 'running' | 'completed' | 'failed' | 'merging';
}

/**
 * Worktree Executor Implementation
 *
 * Creates isolated git worktrees and runs Claude sessions in each.
 */
export class WorktreeExecutor implements Executor {
  readonly type: ExecutorType = 'worktree';
  readonly name = 'Git Worktree Executor';

  private config: Required<Omit<WorktreeExecutorConfig, 'type'>>;
  private worktrees: Map<NodeId, WorktreeState> = new Map();
  private repoRoot: string | null = null;

  constructor(config: WorktreeExecutorConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Check if git worktrees are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if we're in a git repo
      await execAsync('git rev-parse --git-dir');

      // Check if git worktree command exists
      await execAsync('git worktree --help');

      // Check if claude CLI is available
      await execAsync('claude --version');

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
      maxParallelism: this.config.maxWorktrees,
      tokenOverheadPerTask: 0, // No Task tool overhead!
      sharedContext: false,
      supportsStreaming: false, // Could implement with file watching
      efficientDependencyPassing: false, // Must write to files
      trueIsolation: true,
    };
  }

  /**
   * Execute a single task in a worktree
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    let worktreeState: WorktreeState | null = null;

    try {
      // Ensure we know the repo root
      await this.findRepoRoot();

      // Create worktree for this task
      worktreeState = await this.createWorktree(request.nodeId);
      this.worktrees.set(request.nodeId, worktreeState);

      // Write task instructions to worktree
      await this.writeTaskInstructions(worktreeState, request);

      // Run Claude in worktree
      const result = await this.runClaudeInWorktree(worktreeState, request);

      // Read results
      const output = await this.readResults(worktreeState);

      worktreeState.status = 'completed';

      return {
        success: true,
        nodeId: request.nodeId,
        output: output.output,
        confidence: output.confidence || 0.9,
        metadata: {
          executor: 'worktree',
          durationMs: Date.now() - startTime,
          branch: worktreeState.branchName,
        },
      };
    } catch (error: unknown) {
      const err = error as Error;

      if (worktreeState) {
        worktreeState.status = 'failed';
      }

      return {
        success: false,
        nodeId: request.nodeId,
        error: {
          code: 'TOOL_ERROR',
          message: err.message,
          sourceNodeId: request.nodeId,
          retryable: true,
        } as TaskError,
        metadata: {
          executor: 'worktree',
          durationMs: Date.now() - startTime,
          branch: worktreeState?.branchName,
        },
      };
    }
  }

  /**
   * Execute multiple tasks in parallel worktrees
   */
  async executeParallel(
    requests: ExecutionRequest[],
    onProgress?: (progress: ExecutionProgress) => void
  ): Promise<Map<NodeId, ExecutionResponse>> {
    const results = new Map<NodeId, ExecutionResponse>();

    // Batch if exceeding maxWorktrees
    const batches = this.batchRequests(requests, this.config.maxWorktrees);

    for (const batch of batches) {
      // Create all worktrees in parallel
      const createPromises = batch.map(async (req) => {
        onProgress?.({
          nodeId: req.nodeId,
          status: 'starting',
          message: `Creating worktree for ${req.nodeId}`,
        });

        try {
          const state = await this.createWorktree(req.nodeId);
          this.worktrees.set(req.nodeId, state);
          await this.writeTaskInstructions(state, req);
          return { req, state, error: null };
        } catch (error) {
          return { req, state: null, error };
        }
      });

      const created = await Promise.all(createPromises);

      // Run Claude in all worktrees in parallel
      const runPromises = created.map(async ({ req, state, error }) => {
        if (error || !state) {
          return {
            nodeId: req.nodeId,
            success: false,
            error: error as Error,
          };
        }

        onProgress?.({
          nodeId: req.nodeId,
          status: 'running',
          message: `Running Claude in ${state.branchName}`,
        });

        try {
          await this.runClaudeInWorktree(state, req);
          const output = await this.readResults(state);
          state.status = 'completed';

          onProgress?.({
            nodeId: req.nodeId,
            status: 'completed',
          });

          return {
            nodeId: req.nodeId,
            success: true,
            output,
          };
        } catch (error) {
          state.status = 'failed';

          onProgress?.({
            nodeId: req.nodeId,
            status: 'failed',
            message: (error as Error).message,
          });

          return {
            nodeId: req.nodeId,
            success: false,
            error: error as Error,
          };
        }
      });

      const runResults = await Promise.all(runPromises);

      // Collect results
      for (const result of runResults) {
        const state = this.worktrees.get(result.nodeId);

        if (result.success && result.output) {
          results.set(result.nodeId, {
            success: true,
            nodeId: result.nodeId,
            output: result.output.output,
            confidence: result.output.confidence || 0.9,
            metadata: {
              executor: 'worktree',
              durationMs: 0, // TODO: track per-task
              branch: state?.branchName,
            },
          });
        } else {
          results.set(result.nodeId, {
            success: false,
            nodeId: result.nodeId,
            error: {
              code: 'TOOL_ERROR',
              message: result.error?.message || 'Unknown error',
              sourceNodeId: result.nodeId,
              retryable: true,
            },
            metadata: {
              executor: 'worktree',
              durationMs: 0,
              branch: state?.branchName,
            },
          });
        }
      }
    }

    return results;
  }

  /**
   * Clean up all worktrees
   */
  async cleanup(): Promise<void> {
    for (const [nodeId, state] of this.worktrees) {
      try {
        // Kill any running processes
        if (state.process) {
          state.process.kill('SIGTERM');
        }

        // Remove worktree
        await execAsync(`git worktree remove --force "${state.worktreePath}"`, {
          cwd: this.repoRoot!,
        });

        // Delete branch (optional)
        await execAsync(`git branch -D "${state.branchName}"`, {
          cwd: this.repoRoot!,
        }).catch(() => {
          // Branch may not exist or be checked out
        });

        if (this.config.verbose) {
          console.log(`[WorktreeExecutor] Cleaned up ${nodeId}`);
        }
      } catch (error) {
        console.warn(`[WorktreeExecutor] Failed to cleanup ${nodeId}:`, error);
      }
    }

    this.worktrees.clear();
  }

  /**
   * Merge all completed worktrees back to main branch
   */
  async mergeAll(targetBranch: string = 'main'): Promise<Map<NodeId, boolean>> {
    const mergeResults = new Map<NodeId, boolean>();

    for (const [nodeId, state] of this.worktrees) {
      if (state.status !== 'completed') {
        mergeResults.set(nodeId, false);
        continue;
      }

      try {
        state.status = 'merging';

        // Checkout target branch
        await execAsync(`git checkout ${targetBranch}`, {
          cwd: this.repoRoot!,
        });

        // Merge worktree branch
        await execAsync(`git merge ${state.branchName} --no-edit`, {
          cwd: this.repoRoot!,
        });

        mergeResults.set(nodeId, true);

        if (this.config.verbose) {
          console.log(`[WorktreeExecutor] Merged ${state.branchName}`);
        }
      } catch (error) {
        console.warn(`[WorktreeExecutor] Merge failed for ${nodeId}:`, error);
        mergeResults.set(nodeId, false);
      }
    }

    return mergeResults;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Find git repository root
   */
  private async findRepoRoot(): Promise<void> {
    if (this.repoRoot) return;

    const { stdout } = await execAsync('git rev-parse --show-toplevel');
    this.repoRoot = stdout.trim();
  }

  /**
   * Create a worktree for a node
   */
  private async createWorktree(nodeId: NodeId): Promise<WorktreeState> {
    const branchName = `${this.config.branchPrefix}${nodeId}-${Date.now()}`;
    const worktreePath = path.resolve(
      this.repoRoot!,
      this.config.worktreeBaseDir,
      nodeId
    );

    // Ensure base directory exists
    await fs.mkdir(path.dirname(worktreePath), { recursive: true });

    // Create worktree with new branch
    await execAsync(
      `git worktree add -b "${branchName}" "${worktreePath}"`,
      { cwd: this.repoRoot! }
    );

    return {
      nodeId,
      worktreePath,
      branchName,
      status: 'creating',
    };
  }

  /**
   * Write task instructions to worktree
   */
  private async writeTaskInstructions(
    state: WorktreeState,
    request: ExecutionRequest
  ): Promise<void> {
    // Create a TASK.md file with instructions
    const taskContent = this.buildTaskFile(request);
    const taskPath = path.join(state.worktreePath, 'TASK.md');

    await fs.writeFile(taskPath, taskContent, 'utf-8');

    // Create results directory
    const resultsDir = path.join(state.worktreePath, '.dag-results');
    await fs.mkdir(resultsDir, { recursive: true });
  }

  /**
   * Build TASK.md content
   */
  private buildTaskFile(request: ExecutionRequest): string {
    const lines: string[] = [];

    lines.push(`# Task: ${request.description}`);
    lines.push('');
    lines.push(`**Node ID:** ${request.nodeId}`);
    lines.push(`**Skill:** ${request.skillId || 'general'}`);
    lines.push(`**Model:** ${request.model || this.config.defaultModel}`);
    lines.push('');

    lines.push('## Instructions');
    lines.push('');
    lines.push(request.prompt);
    lines.push('');

    if (request.dependencyResults && request.dependencyResults.size > 0) {
      lines.push('## Context from Dependencies');
      lines.push('');
      for (const [depId, result] of request.dependencyResults) {
        lines.push(`### ${depId}`);
        lines.push('```json');
        lines.push(JSON.stringify(result.output, null, 2));
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('## Output');
    lines.push('');
    lines.push('When complete, write your results to `.dag-results/output.json`:');
    lines.push('```json');
    lines.push('{"output": <your result>, "confidence": 0.0-1.0}');
    lines.push('```');

    return lines.join('\n');
  }

  /**
   * Run Claude in a worktree
   */
  private async runClaudeInWorktree(
    state: WorktreeState,
    request: ExecutionRequest
  ): Promise<void> {
    state.status = 'running';

    // Use claude -p with the TASK.md content
    const taskPath = path.join(state.worktreePath, 'TASK.md');
    const taskContent = await fs.readFile(taskPath, 'utf-8');

    const prompt = `Read and execute the task in TASK.md. Write your results to .dag-results/output.json.\n\n${taskContent}`;

    await execAsync(
      `claude -p "${this.escapeForShell(prompt)}" --output-format json`,
      {
        cwd: state.worktreePath,
        timeout: request.timeoutMs || this.config.defaultTimeoutMs,
      }
    );
  }

  /**
   * Read results from worktree
   */
  private async readResults(
    state: WorktreeState
  ): Promise<{ output: unknown; confidence?: number }> {
    const outputPath = path.join(
      state.worktreePath,
      '.dag-results',
      'output.json'
    );

    try {
      const content = await fs.readFile(outputPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // If no output file, check if there are code changes
      const { stdout } = await execAsync('git diff --stat', {
        cwd: state.worktreePath,
      });

      return {
        output: {
          changes: stdout.trim() || 'No changes detected',
          branch: state.branchName,
        },
        confidence: 0.7,
      };
    }
  }

  /**
   * Escape prompt for shell
   */
  private escapeForShell(prompt: string): string {
    return prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
  }

  /**
   * Batch requests
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
export function createWorktreeExecutor(
  config?: Partial<WorktreeExecutorConfig>
): WorktreeExecutor {
  return new WorktreeExecutor({
    type: 'worktree',
    ...config,
  });
}

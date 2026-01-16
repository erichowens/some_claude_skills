/**
 * Pluggable Executor System for DAG Framework
 *
 * This module defines the abstraction layer that allows the DAG framework
 * to execute tasks via different mechanisms:
 * - Task tool (current, in-session)
 * - Git worktrees (parallel isolated sessions)
 * - claude -p processes (parallel stateless)
 * - MCP coordinators (future, lightweight)
 *
 * The key insight: All executors take prompts and produce results.
 * The differences are in isolation, overhead, and coordination.
 */

import type { NodeId, TaskResult, TaskError, TokenUsage } from '../types';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * What we send to an executor
 */
export interface ExecutionRequest {
  /** Unique identifier for this execution */
  nodeId: NodeId;

  /** The prompt/instructions for the task */
  prompt: string;

  /** Short description (for Task tool, logging) */
  description: string;

  /** Which skill/agent type to use */
  skillId?: string;
  agentType?: string;

  /** Model preference */
  model?: 'haiku' | 'sonnet' | 'opus';

  /** Results from dependency nodes (for context) */
  dependencyResults?: Map<NodeId, TaskResult>;

  /** Additional context/variables */
  context?: Record<string, unknown>;

  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * What we get back from an executor
 */
export interface ExecutionResponse {
  /** Whether execution succeeded */
  success: boolean;

  /** The node that was executed */
  nodeId: NodeId;

  /** Output data (if successful) */
  output?: unknown;

  /** Confidence score (0-1) */
  confidence?: number;

  /** Error details (if failed) */
  error?: TaskError;

  /** Token usage (if available) */
  tokenUsage?: TokenUsage;

  /** Executor-specific metadata */
  metadata?: {
    /** Which executor ran this */
    executor: ExecutorType;
    /** Execution duration in ms */
    durationMs: number;
    /** For worktrees: which branch */
    branch?: string;
    /** For processes: exit code */
    exitCode?: number;
    /** Raw output before parsing */
    rawOutput?: string;
  };
}

/**
 * Progress update during execution
 */
export interface ExecutionProgress {
  nodeId: NodeId;
  status: 'queued' | 'starting' | 'running' | 'completed' | 'failed';
  message?: string;
  /** For streaming executors: partial output */
  partialOutput?: string;
}

/**
 * Executor types
 */
export type ExecutorType = 'task-tool' | 'worktree' | 'process' | 'mcp';

// ============================================================================
// EXECUTOR INTERFACE
// ============================================================================

/**
 * The core executor interface
 *
 * All executors must implement this interface. The DAG runtime
 * doesn't care HOW tasks are executed, only that they follow
 * this contract.
 */
export interface Executor {
  /** Executor type identifier */
  readonly type: ExecutorType;

  /** Human-readable name */
  readonly name: string;

  /**
   * Execute a single task
   *
   * @param request - What to execute
   * @returns Promise resolving to execution result
   */
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;

  /**
   * Execute multiple tasks in parallel
   *
   * This is the key method for parallelization. Each executor
   * implements this differently:
   * - TaskToolExecutor: Multiple Task calls in one message
   * - WorktreeExecutor: Multiple git worktrees
   * - ProcessExecutor: Multiple claude -p processes
   *
   * @param requests - Array of tasks to execute in parallel
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to map of results
   */
  executeParallel(
    requests: ExecutionRequest[],
    onProgress?: (progress: ExecutionProgress) => void
  ): Promise<Map<NodeId, ExecutionResponse>>;

  /**
   * Check if this executor is available/configured
   *
   * @returns true if executor can be used
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get executor capabilities
   */
  getCapabilities(): ExecutorCapabilities;

  /**
   * Clean up resources (worktrees, processes, etc.)
   */
  cleanup?(): Promise<void>;
}

/**
 * Executor capabilities - what this executor can do
 */
export interface ExecutorCapabilities {
  /** Maximum parallel tasks (undefined = unlimited) */
  maxParallelism?: number;

  /** Token overhead per task (0 for out-of-process executors) */
  tokenOverheadPerTask: number;

  /** Whether tasks share context/memory */
  sharedContext: boolean;

  /** Whether executor supports streaming output */
  supportsStreaming: boolean;

  /** Whether executor can pass dependency results efficiently */
  efficientDependencyPassing: boolean;

  /** Whether executor provides true isolation */
  trueIsolation: boolean;
}

// ============================================================================
// EXECUTOR CONFIGURATION
// ============================================================================

/**
 * Base configuration for all executors
 */
export interface ExecutorConfig {
  /** Default model to use */
  defaultModel?: 'haiku' | 'sonnet' | 'opus';

  /** Default timeout in ms */
  defaultTimeoutMs?: number;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Task tool executor configuration
 */
export interface TaskToolExecutorConfig extends ExecutorConfig {
  type: 'task-tool';

  /** Maximum parallel tasks (default: 10, hard limit) */
  maxParallel?: number;

  /** Run tasks in background (default: false - broken!) */
  runInBackground?: boolean;
}

/**
 * Worktree executor configuration
 */
export interface WorktreeExecutorConfig extends ExecutorConfig {
  type: 'worktree';

  /** Base directory for worktrees */
  worktreeBaseDir?: string;

  /** Branch prefix for auto-created branches */
  branchPrefix?: string;

  /** Whether to auto-merge on completion */
  autoMerge?: boolean;

  /** Maximum concurrent worktrees */
  maxWorktrees?: number;
}

/**
 * Process executor configuration (claude -p)
 */
export interface ProcessExecutorConfig extends ExecutorConfig {
  type: 'process';

  /** Path to claude CLI */
  claudePath?: string;

  /** Output format (json recommended) */
  outputFormat?: 'json' | 'text';

  /** Maximum concurrent processes */
  maxProcesses?: number;

  /** Working directory for processes */
  cwd?: string;
}

/**
 * MCP executor configuration (future)
 */
export interface MCPExecutorConfig extends ExecutorConfig {
  type: 'mcp';

  /** MCP server name */
  serverName: string;

  /** Tool name to use for execution */
  toolName: string;
}

/**
 * Union type for all executor configs
 */
export type AnyExecutorConfig =
  | TaskToolExecutorConfig
  | WorktreeExecutorConfig
  | ProcessExecutorConfig
  | MCPExecutorConfig;

// ============================================================================
// EXECUTOR FACTORY
// ============================================================================

/**
 * Factory function type for creating executors
 */
export type ExecutorFactory = (config: AnyExecutorConfig) => Executor;

/**
 * Registry of available executors
 */
export interface ExecutorRegistry {
  /** Register an executor factory */
  register(type: ExecutorType, factory: ExecutorFactory): void;

  /** Create an executor by type */
  create(config: AnyExecutorConfig): Executor;

  /** List available executor types */
  listTypes(): ExecutorType[];

  /** Get default executor */
  getDefault(): Executor;
}

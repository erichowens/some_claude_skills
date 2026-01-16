/**
 * Pluggable Executor System
 *
 * This module provides multiple execution strategies for DAG nodes:
 *
 * 1. ProcessExecutor (claude -p)
 *    - Zero token overhead
 *    - True parallel execution
 *    - Complete isolation
 *    - Best for: Most use cases
 *
 * 2. WorktreeExecutor (git worktrees)
 *    - Zero token overhead
 *    - Unlimited parallelism
 *    - Full file isolation + branching
 *    - Best for: Code generation tasks that need merging
 *
 * 3. TaskToolExecutor (Claude Code Task tool)
 *    - 20k token overhead per task
 *    - Limited to 10 parallel
 *    - Shared context with parent session
 *    - Best for: Tasks needing conversation history or full tool access
 *
 * Usage:
 * ```typescript
 * import { executorRegistry, selectBestExecutor } from './dag/executors';
 *
 * // Get default executor
 * const executor = executorRegistry.getDefault();
 *
 * // Or select based on requirements
 * const executor = await selectBestExecutor({
 *   needsIsolation: true,
 *   parallelTasks: 5,
 *   minimizeTokens: true,
 * });
 *
 * // Execute tasks
 * const results = await executor.executeParallel(requests);
 * ```
 */

// Types
export type {
  Executor,
  ExecutorType,
  ExecutorCapabilities,
  ExecutorConfig,
  ExecutionRequest,
  ExecutionResponse,
  ExecutionProgress,
  TaskToolExecutorConfig,
  WorktreeExecutorConfig,
  ProcessExecutorConfig,
  MCPExecutorConfig,
  AnyExecutorConfig,
  ExecutorRegistry,
  ExecutorFactory,
} from './types';

// Process Executor (RECOMMENDED - zero token overhead)
export { ProcessExecutor, createProcessExecutor } from './process-executor';

// Worktree Executor (full file isolation via git)
export { WorktreeExecutor, createWorktreeExecutor } from './worktree-executor';

// Task Tool Executor (shared context, 20k token overhead)
export { TaskToolExecutor, createTaskToolExecutor } from './task-tool-executor';

// Registry
export {
  executorRegistry,
  selectBestExecutor,
  compareExecutors,
  type ExecutorRequirements,
  type ExecutorComparison,
} from './registry';

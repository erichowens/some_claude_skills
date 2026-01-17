"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareExecutors = exports.selectBestExecutor = exports.executorRegistry = exports.createTaskToolExecutor = exports.TaskToolExecutor = exports.createWorktreeExecutor = exports.WorktreeExecutor = exports.createProcessExecutor = exports.ProcessExecutor = void 0;
// Process Executor (RECOMMENDED - zero token overhead)
var process_executor_1 = require("./process-executor");
Object.defineProperty(exports, "ProcessExecutor", { enumerable: true, get: function () { return process_executor_1.ProcessExecutor; } });
Object.defineProperty(exports, "createProcessExecutor", { enumerable: true, get: function () { return process_executor_1.createProcessExecutor; } });
// Worktree Executor (full file isolation via git)
var worktree_executor_1 = require("./worktree-executor");
Object.defineProperty(exports, "WorktreeExecutor", { enumerable: true, get: function () { return worktree_executor_1.WorktreeExecutor; } });
Object.defineProperty(exports, "createWorktreeExecutor", { enumerable: true, get: function () { return worktree_executor_1.createWorktreeExecutor; } });
// Task Tool Executor (shared context, 20k token overhead)
var task_tool_executor_1 = require("./task-tool-executor");
Object.defineProperty(exports, "TaskToolExecutor", { enumerable: true, get: function () { return task_tool_executor_1.TaskToolExecutor; } });
Object.defineProperty(exports, "createTaskToolExecutor", { enumerable: true, get: function () { return task_tool_executor_1.createTaskToolExecutor; } });
// Registry
var registry_1 = require("./registry");
Object.defineProperty(exports, "executorRegistry", { enumerable: true, get: function () { return registry_1.executorRegistry; } });
Object.defineProperty(exports, "selectBestExecutor", { enumerable: true, get: function () { return registry_1.selectBestExecutor; } });
Object.defineProperty(exports, "compareExecutors", { enumerable: true, get: function () { return registry_1.compareExecutors; } });

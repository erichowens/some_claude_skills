/**
 * Executor Registry
 *
 * Central registry for all available executors.
 * Allows dynamic selection based on task requirements and environment.
 */

import type {
  Executor,
  ExecutorType,
  ExecutorRegistry,
  ExecutorFactory,
  AnyExecutorConfig,
  ExecutorCapabilities,
} from './types';
import { ProcessExecutor, createProcessExecutor } from './process-executor';
import { WorktreeExecutor, createWorktreeExecutor } from './worktree-executor';
import { TaskToolExecutor, createTaskToolExecutor } from './task-tool-executor';

/**
 * Default executor registry implementation
 */
class DefaultExecutorRegistry implements ExecutorRegistry {
  private factories: Map<ExecutorType, ExecutorFactory> = new Map();
  private defaultType: ExecutorType = 'process';

  constructor() {
    // Register built-in executors
    this.register('process', (config) =>
      createProcessExecutor(config as any)
    );
    this.register('worktree', (config) =>
      createWorktreeExecutor(config as any)
    );
    this.register('task-tool', (config) =>
      createTaskToolExecutor(config as any)
    );
  }

  register(type: ExecutorType, factory: ExecutorFactory): void {
    this.factories.set(type, factory);
  }

  create(config: AnyExecutorConfig): Executor {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`Unknown executor type: ${config.type}`);
    }
    return factory(config);
  }

  listTypes(): ExecutorType[] {
    return Array.from(this.factories.keys());
  }

  getDefault(): Executor {
    return this.create({ type: this.defaultType } as AnyExecutorConfig);
  }

  setDefault(type: ExecutorType): void {
    if (!this.factories.has(type)) {
      throw new Error(`Unknown executor type: ${type}`);
    }
    this.defaultType = type;
  }

  /**
   * Create an executor by type (convenience method)
   */
  createByType(type: ExecutorType): Executor {
    return this.create({ type } as AnyExecutorConfig);
  }
}

// Singleton registry instance
export const executorRegistry = new DefaultExecutorRegistry();

/**
 * Smart executor selector
 *
 * Chooses the best executor based on requirements.
 */
export async function selectBestExecutor(
  requirements: ExecutorRequirements
): Promise<Executor> {
  const candidates: Array<{ executor: Executor; score: number }> = [];

  for (const type of executorRegistry.listTypes()) {
    const executor = executorRegistry.createByType(type);

    // Check availability
    if (!(await executor.isAvailable())) {
      continue;
    }

    const caps = executor.getCapabilities();
    let score = 0;

    // Score based on requirements
    if (requirements.needsIsolation && caps.trueIsolation) {
      score += 30;
    }

    if (requirements.parallelTasks) {
      if (!caps.maxParallelism || caps.maxParallelism >= requirements.parallelTasks) {
        score += 20;
      }
    }

    if (requirements.minimizeTokens && caps.tokenOverheadPerTask === 0) {
      score += 25;
    }

    if (requirements.needsSharedContext && caps.sharedContext) {
      score += 20;
    }

    if (requirements.needsStreaming && caps.supportsStreaming) {
      score += 10;
    }

    candidates.push({ executor, score });
  }

  if (candidates.length === 0) {
    throw new Error('No available executor meets requirements');
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0].executor;
}

/**
 * Requirements for executor selection
 */
export interface ExecutorRequirements {
  /** Tasks need true file isolation */
  needsIsolation?: boolean;

  /** Number of tasks to run in parallel */
  parallelTasks?: number;

  /** Minimize token costs */
  minimizeTokens?: boolean;

  /** Tasks need to share context/memory */
  needsSharedContext?: boolean;

  /** Need streaming output */
  needsStreaming?: boolean;
}

/**
 * Get comparison of all available executors
 */
export async function compareExecutors(): Promise<ExecutorComparison[]> {
  const comparisons: ExecutorComparison[] = [];

  for (const type of executorRegistry.listTypes()) {
    const executor = executorRegistry.createByType(type);
    const available = await executor.isAvailable();
    const caps = executor.getCapabilities();

    comparisons.push({
      type,
      name: executor.name,
      available,
      capabilities: caps,
    });
  }

  return comparisons;
}

export interface ExecutorComparison {
  type: ExecutorType;
  name: string;
  available: boolean;
  capabilities: ExecutorCapabilities;
}

/**
 * Checkpoint Manager for DAG Persistence
 *
 * Manages saving, loading, and resuming DAG execution state.
 * Enables recovery from interrupted executions.
 *
 * @module dag/persistence/checkpoint-manager
 */

import type { StorageAdapter } from './storage-adapters';
import { autoDetectStorage } from './storage-adapters';
import type { DAG, NodeId, TaskResult, TaskError, ExecutionSnapshot } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Checkpoint data for a DAG execution
 */
export interface Checkpoint {
  /** Unique checkpoint ID */
  id: string;

  /** The DAG being executed */
  dag: DAGCheckpointData;

  /** Current execution state */
  execution: ExecutionCheckpointData;

  /** When the checkpoint was created */
  createdAt: string;

  /** When the checkpoint was last updated */
  updatedAt: string;

  /** Checkpoint version for compatibility */
  version: number;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Minimal DAG data for checkpointing
 */
export interface DAGCheckpointData {
  /** DAG ID */
  id: string;

  /** Node IDs in execution order */
  nodeIds: string[];

  /** Node dependencies (adjacency list) */
  dependencies: Record<string, string[]>;

  /** Node configurations */
  nodeConfigs: Record<string, NodeCheckpointData>;
}

/**
 * Minimal node data for checkpointing
 */
export interface NodeCheckpointData {
  id: string;
  type: string;
  skillId?: string;
  description?: string;
}

/**
 * Execution state for checkpointing
 */
export interface ExecutionCheckpointData {
  /** Execution ID */
  executionId: string;

  /** Current wave number */
  currentWave: number;

  /** Node states */
  nodeStates: Record<string, NodeExecutionState>;

  /** Completed node results */
  results: Record<string, TaskResult>;

  /** Failed node errors */
  errors: Record<string, TaskError>;

  /** Execution start time */
  startedAt: string;

  /** Total token usage so far */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * State of a single node in execution
 */
export type NodeExecutionState =
  | 'pending'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'skipped';

/**
 * Checkpoint manager configuration
 */
export interface CheckpointManagerConfig {
  /** Storage adapter to use */
  storage?: StorageAdapter;

  /** Auto-save interval in ms (0 to disable) */
  autoSaveIntervalMs?: number;

  /** Maximum checkpoints to keep per DAG */
  maxCheckpointsPerDAG?: number;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Resume options
 */
export interface ResumeOptions {
  /** Whether to retry failed nodes */
  retryFailed?: boolean;

  /** Whether to re-execute completed nodes */
  reExecuteCompleted?: boolean;

  /** Specific nodes to re-execute */
  reExecuteNodes?: NodeId[];
}

/**
 * Checkpoint listing options
 */
export interface ListCheckpointsOptions {
  /** Filter by DAG ID */
  dagId?: string;

  /** Maximum results */
  limit?: number;

  /** Sort order */
  sortBy?: 'createdAt' | 'updatedAt';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// CHECKPOINT MANAGER CLASS
// =============================================================================

/**
 * CheckpointManager handles DAG execution persistence.
 *
 * @example
 * ```typescript
 * const checkpointManager = new CheckpointManager();
 *
 * // Save checkpoint during execution
 * await checkpointManager.save(checkpoint);
 *
 * // List available checkpoints
 * const checkpoints = await checkpointManager.list({ dagId: 'my-dag' });
 *
 * // Load and resume
 * const checkpoint = await checkpointManager.load(checkpointId);
 * const resumeState = checkpointManager.prepareResume(checkpoint);
 * ```
 */
export class CheckpointManager {
  private storage: StorageAdapter;
  private config: Required<CheckpointManagerConfig>;
  private autoSaveTimer?: NodeJS.Timeout;

  static readonly CURRENT_VERSION = 1;
  private static readonly KEY_PREFIX = 'checkpoint:';

  constructor(config: CheckpointManagerConfig = {}) {
    this.storage = config.storage || autoDetectStorage();
    this.config = {
      storage: this.storage,
      autoSaveIntervalMs: config.autoSaveIntervalMs ?? 0,
      maxCheckpointsPerDAG: config.maxCheckpointsPerDAG ?? 10,
      verbose: config.verbose ?? false,
    };
  }

  // ===========================================================================
  // CORE OPERATIONS
  // ===========================================================================

  /**
   * Save a checkpoint
   */
  async save(checkpoint: Checkpoint): Promise<void> {
    const key = this.getKey(checkpoint.id);
    const data = JSON.stringify(checkpoint);

    await this.storage.set(key, data);

    if (this.config.verbose) {
      console.log(`[CheckpointManager] Saved checkpoint: ${checkpoint.id}`);
    }

    // Cleanup old checkpoints if needed
    await this.cleanupOldCheckpoints(checkpoint.dag.id);
  }

  /**
   * Load a checkpoint by ID
   */
  async load(checkpointId: string): Promise<Checkpoint | null> {
    const key = this.getKey(checkpointId);
    const data = await this.storage.get(key);

    if (!data) {
      if (this.config.verbose) {
        console.log(`[CheckpointManager] Checkpoint not found: ${checkpointId}`);
      }
      return null;
    }

    const checkpoint = JSON.parse(data) as Checkpoint;

    // Version check
    if (checkpoint.version !== CheckpointManager.CURRENT_VERSION) {
      console.warn(
        `[CheckpointManager] Checkpoint version mismatch: ` +
        `expected ${CheckpointManager.CURRENT_VERSION}, got ${checkpoint.version}`
      );
    }

    return checkpoint;
  }

  /**
   * Delete a checkpoint
   */
  async delete(checkpointId: string): Promise<boolean> {
    const key = this.getKey(checkpointId);
    return this.storage.delete(key);
  }

  /**
   * Check if a checkpoint exists
   */
  async exists(checkpointId: string): Promise<boolean> {
    const key = this.getKey(checkpointId);
    return this.storage.has(key);
  }

  /**
   * List available checkpoints
   */
  async list(options: ListCheckpointsOptions = {}): Promise<CheckpointSummary[]> {
    const keys = await this.storage.keys(CheckpointManager.KEY_PREFIX);
    const summaries: CheckpointSummary[] = [];

    for (const key of keys) {
      const data = await this.storage.get(key);
      if (!data) continue;

      try {
        const checkpoint = JSON.parse(data) as Checkpoint;

        // Filter by DAG ID if specified
        if (options.dagId && checkpoint.dag.id !== options.dagId) {
          continue;
        }

        summaries.push({
          id: checkpoint.id,
          dagId: checkpoint.dag.id,
          executionId: checkpoint.execution.executionId,
          currentWave: checkpoint.execution.currentWave,
          completedNodes: Object.values(checkpoint.execution.nodeStates)
            .filter(s => s === 'completed').length,
          totalNodes: Object.keys(checkpoint.execution.nodeStates).length,
          createdAt: new Date(checkpoint.createdAt),
          updatedAt: new Date(checkpoint.updatedAt),
        });
      } catch (err) {
        console.warn(`[CheckpointManager] Invalid checkpoint data: ${key}`);
      }
    }

    // Sort
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'desc';
    summaries.sort((a, b) => {
      const aVal = a[sortBy].getTime();
      const bVal = b[sortBy].getTime();
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Limit
    if (options.limit) {
      return summaries.slice(0, options.limit);
    }

    return summaries;
  }

  // ===========================================================================
  // CHECKPOINT CREATION
  // ===========================================================================

  /**
   * Create a checkpoint from current execution state
   */
  createCheckpoint(
    dag: DAG,
    snapshot: ExecutionSnapshot,
    metadata?: Record<string, unknown>
  ): Checkpoint {
    const now = new Date().toISOString();
    const checkpointId = this.generateCheckpointId(dag.id, snapshot.executionId);

    // Extract minimal DAG data
    const dagData: DAGCheckpointData = {
      id: dag.id,
      nodeIds: Object.keys(dag.nodes),
      dependencies: {},
      nodeConfigs: {},
    };

    for (const [nodeId, node] of Object.entries(dag.nodes)) {
      dagData.dependencies[nodeId] = node.dependencies;
      dagData.nodeConfigs[nodeId] = {
        id: node.id,
        type: node.type,
        skillId: node.skillId,
        description: node.description,
      };
    }

    // Extract execution state
    const executionData: ExecutionCheckpointData = {
      executionId: snapshot.executionId,
      currentWave: snapshot.currentWave,
      nodeStates: { ...snapshot.nodeStates },
      results: {},
      errors: {},
      startedAt: snapshot.startedAt.toISOString(),
      tokenUsage: snapshot.totalTokenUsage ? {
        inputTokens: snapshot.totalTokenUsage.inputTokens,
        outputTokens: snapshot.totalTokenUsage.outputTokens,
      } : undefined,
    };

    // Copy results and errors
    for (const [nodeId, result] of snapshot.results) {
      executionData.results[nodeId] = result;
    }
    for (const [nodeId, error] of snapshot.errors) {
      executionData.errors[nodeId] = error;
    }

    return {
      id: checkpointId,
      dag: dagData,
      execution: executionData,
      createdAt: now,
      updatedAt: now,
      version: CheckpointManager.CURRENT_VERSION,
      metadata,
    };
  }

  /**
   * Update an existing checkpoint
   */
  async updateCheckpoint(
    checkpointId: string,
    snapshot: ExecutionSnapshot
  ): Promise<void> {
    const existing = await this.load(checkpointId);
    if (!existing) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    // Update execution state
    existing.execution.currentWave = snapshot.currentWave;
    existing.execution.nodeStates = { ...snapshot.nodeStates };

    // Update results and errors
    for (const [nodeId, result] of snapshot.results) {
      existing.execution.results[nodeId] = result;
    }
    for (const [nodeId, error] of snapshot.errors) {
      existing.execution.errors[nodeId] = error;
    }

    if (snapshot.totalTokenUsage) {
      existing.execution.tokenUsage = {
        inputTokens: snapshot.totalTokenUsage.inputTokens,
        outputTokens: snapshot.totalTokenUsage.outputTokens,
      };
    }

    existing.updatedAt = new Date().toISOString();

    await this.save(existing);
  }

  // ===========================================================================
  // RESUME OPERATIONS
  // ===========================================================================

  /**
   * Prepare resume state from a checkpoint
   */
  prepareResume(
    checkpoint: Checkpoint,
    options: ResumeOptions = {}
  ): ResumeState {
    const { retryFailed = true, reExecuteCompleted = false, reExecuteNodes = [] } = options;

    const nodesToExecute: string[] = [];
    const completedResults = new Map<NodeId, TaskResult>();

    for (const [nodeId, state] of Object.entries(checkpoint.execution.nodeStates)) {
      if (reExecuteNodes.includes(nodeId as NodeId)) {
        // Explicitly marked for re-execution
        nodesToExecute.push(nodeId);
      } else if (state === 'completed') {
        if (reExecuteCompleted) {
          nodesToExecute.push(nodeId);
        } else {
          // Preserve completed results
          const result = checkpoint.execution.results[nodeId];
          if (result) {
            completedResults.set(nodeId as NodeId, result);
          }
        }
      } else if (state === 'failed') {
        if (retryFailed) {
          nodesToExecute.push(nodeId);
        }
      } else if (state === 'pending' || state === 'ready' || state === 'executing') {
        // These need to be (re-)executed
        nodesToExecute.push(nodeId);
      }
    }

    return {
      checkpointId: checkpoint.id,
      dagId: checkpoint.dag.id,
      executionId: checkpoint.execution.executionId,
      startFromWave: this.calculateStartWave(checkpoint, nodesToExecute),
      nodesToExecute,
      completedResults,
      previousTokenUsage: checkpoint.execution.tokenUsage,
    };
  }

  /**
   * Calculate which wave to start from based on nodes to execute
   */
  private calculateStartWave(
    checkpoint: Checkpoint,
    nodesToExecute: string[]
  ): number {
    // Simple approach: if any node from wave N needs execution,
    // start from wave N
    // For now, just start from wave 0 if there are nodes to execute
    return nodesToExecute.length > 0 ? 0 : checkpoint.execution.currentWave;
  }

  // ===========================================================================
  // AUTO-SAVE
  // ===========================================================================

  /**
   * Start auto-saving at configured interval
   */
  startAutoSave(
    getSnapshot: () => { dag: DAG; snapshot: ExecutionSnapshot } | null
  ): void {
    if (this.config.autoSaveIntervalMs <= 0) return;

    this.stopAutoSave();

    this.autoSaveTimer = setInterval(async () => {
      const state = getSnapshot();
      if (state) {
        try {
          const checkpoint = this.createCheckpoint(state.dag, state.snapshot);
          await this.save(checkpoint);
        } catch (err) {
          console.error('[CheckpointManager] Auto-save failed:', err);
        }
      }
    }, this.config.autoSaveIntervalMs);
  }

  /**
   * Stop auto-saving
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Clean up old checkpoints for a DAG
   */
  private async cleanupOldCheckpoints(dagId: string): Promise<void> {
    const checkpoints = await this.list({
      dagId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    if (checkpoints.length <= this.config.maxCheckpointsPerDAG) {
      return;
    }

    // Delete oldest checkpoints
    const toDelete = checkpoints.slice(this.config.maxCheckpointsPerDAG);
    for (const checkpoint of toDelete) {
      await this.delete(checkpoint.id);
      if (this.config.verbose) {
        console.log(`[CheckpointManager] Deleted old checkpoint: ${checkpoint.id}`);
      }
    }
  }

  /**
   * Clear all checkpoints
   */
  async clearAll(): Promise<void> {
    await this.storage.clear(CheckpointManager.KEY_PREFIX);
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private getKey(checkpointId: string): string {
    return CheckpointManager.KEY_PREFIX + checkpointId;
  }

  private generateCheckpointId(dagId: string, executionId: string): string {
    const timestamp = Date.now();
    return `${dagId}-${executionId}-${timestamp}`;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<CheckpointStats> {
    const storageStats = await this.storage.getStats();
    const checkpoints = await this.list();

    const dagCounts: Record<string, number> = {};
    for (const cp of checkpoints) {
      dagCounts[cp.dagId] = (dagCounts[cp.dagId] || 0) + 1;
    }

    return {
      totalCheckpoints: checkpoints.length,
      checkpointsByDAG: dagCounts,
      storageUsedBytes: storageStats.totalSize,
      storageType: this.storage.type,
    };
  }
}

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

/**
 * Summary of a checkpoint (for listing)
 */
export interface CheckpointSummary {
  id: string;
  dagId: string;
  executionId: string;
  currentWave: number;
  completedNodes: number;
  totalNodes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * State for resuming execution
 */
export interface ResumeState {
  checkpointId: string;
  dagId: string;
  executionId: string;
  startFromWave: number;
  nodesToExecute: string[];
  completedResults: Map<NodeId, TaskResult>;
  previousTokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Checkpoint statistics
 */
export interface CheckpointStats {
  totalCheckpoints: number;
  checkpointsByDAG: Record<string, number>;
  storageUsedBytes: number;
  storageType: string;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/** Default checkpoint manager instance */
export const checkpointManager = new CheckpointManager();

/**
 * Create a configured checkpoint manager
 */
export function createCheckpointManager(
  config: CheckpointManagerConfig
): CheckpointManager {
  return new CheckpointManager(config);
}

/**
 * Quick save a checkpoint
 */
export async function saveCheckpoint(
  dag: DAG,
  snapshot: ExecutionSnapshot,
  storage?: StorageAdapter
): Promise<string> {
  const manager = storage
    ? new CheckpointManager({ storage })
    : checkpointManager;

  const checkpoint = manager.createCheckpoint(dag, snapshot);
  await manager.save(checkpoint);
  return checkpoint.id;
}

/**
 * Quick load and prepare resume
 */
export async function loadAndPrepareResume(
  checkpointId: string,
  options?: ResumeOptions & { storage?: StorageAdapter }
): Promise<ResumeState | null> {
  const manager = options?.storage
    ? new CheckpointManager({ storage: options.storage })
    : checkpointManager;

  const checkpoint = await manager.load(checkpointId);
  if (!checkpoint) return null;

  return manager.prepareResume(checkpoint, options);
}

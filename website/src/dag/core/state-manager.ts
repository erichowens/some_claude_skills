/**
 * DAG State Manager
 *
 * Manages state transitions for DAG nodes during execution.
 * Enforces valid state transitions and emits events.
 */

import type {
  DAG,
  DAGNode,
  NodeId,
  ExecutionId,
  TaskState,
  TaskResult,
  TaskError,
  SkipReason,
  TokenUsage,
  ExecutionSnapshot,
  ExecutionWave,
  ExecutionEvent,
  ExecutionEventListener,
} from '../types';
import { ExecutionId as createExecutionId } from '../types';
import { topologicalSort } from './topology';

// =============================================================================
// State Transition Validation
// =============================================================================

/**
 * Valid state transitions for a task.
 * Key is source state, value is array of allowed target states.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'skipped', 'cancelled'],
  ready: ['running', 'skipped', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  completed: [], // Terminal state
  failed: ['ready'], // Can retry (back to ready)
  skipped: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Checks if a state transition is valid.
 */
export function isValidTransition(from: TaskState, to: TaskState): boolean {
  const fromStatus = from.status;
  const toStatus = to.status;
  const allowed = VALID_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

/**
 * Error thrown when an invalid state transition is attempted.
 */
export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly nodeId: NodeId,
    public readonly from: TaskState,
    public readonly to: TaskState
  ) {
    super(
      `Invalid state transition for node ${nodeId}: ${from.status} -> ${to.status}`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

// =============================================================================
// State Manager
// =============================================================================

/**
 * Options for creating a StateManager
 */
export interface StateManagerOptions {
  /** The DAG being executed */
  dag: DAG;

  /** Optional execution ID (generated if not provided) */
  executionId?: ExecutionId;

  /** Whether to validate all state transitions */
  validateTransitions?: boolean;

  /** Whether to emit events */
  emitEvents?: boolean;
}

/**
 * Manages state for DAG execution.
 * Handles state transitions, event emission, and snapshot management.
 */
export class StateManager {
  private readonly dag: DAG;
  private readonly executionId: ExecutionId;
  private readonly validateTransitions: boolean;
  private readonly emitEvents: boolean;

  // State tracking
  private nodeStates: Map<NodeId, TaskState>;
  private nodeOutputs: Map<NodeId, TaskResult>;
  private waves: ExecutionWave[];
  private currentWave: number;

  // Metrics
  private startedAt?: Date;
  private completedAt?: Date;
  private totalTokenUsage: TokenUsage;
  private errors: TaskError[];

  // Event listeners
  private listeners: Set<ExecutionEventListener>;

  constructor(options: StateManagerOptions) {
    this.dag = options.dag;
    this.executionId = options.executionId || createExecutionId(crypto.randomUUID());
    this.validateTransitions = options.validateTransitions ?? true;
    this.emitEvents = options.emitEvents ?? true;

    this.nodeStates = new Map();
    this.nodeOutputs = new Map();
    this.waves = [];
    this.currentWave = 0;
    this.totalTokenUsage = { inputTokens: 0, outputTokens: 0 };
    this.errors = [];
    this.listeners = new Set();

    this.initialize();
  }

  /**
   * Initialize state for all nodes.
   */
  private initialize(): void {
    // Set all nodes to pending
    for (const [nodeId] of this.dag.nodes) {
      this.nodeStates.set(nodeId, { status: 'pending' });
    }

    // Compute execution waves
    const sortResult = topologicalSort(this.dag);
    if (sortResult.success) {
      this.waves = sortResult.waves;
    }
  }

  // ===========================================================================
  // Event Management
  // ===========================================================================

  /**
   * Subscribe to execution events.
   */
  addEventListener(listener: ExecutionEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove event listener.
   */
  removeEventListener(listener: ExecutionEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners.
   */
  private emit(event: ExecutionEvent): void {
    if (!this.emitEvents) return;

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    }
  }

  // ===========================================================================
  // State Transitions
  // ===========================================================================

  /**
   * Get current state of a node.
   */
  getNodeState(nodeId: NodeId): TaskState | undefined {
    return this.nodeStates.get(nodeId);
  }

  /**
   * Get output of a completed node.
   */
  getNodeOutput(nodeId: NodeId): TaskResult | undefined {
    return this.nodeOutputs.get(nodeId);
  }

  /**
   * Transition a node to a new state.
   */
  private transitionNode(nodeId: NodeId, newState: TaskState): void {
    const currentState = this.nodeStates.get(nodeId);
    if (!currentState) {
      throw new Error(`Unknown node: ${nodeId}`);
    }

    if (this.validateTransitions && !isValidTransition(currentState, newState)) {
      throw new InvalidStateTransitionError(nodeId, currentState, newState);
    }

    this.nodeStates.set(nodeId, newState);
  }

  /**
   * Mark execution as started.
   */
  startExecution(): void {
    this.startedAt = new Date();
    this.emit({
      type: 'dag_started',
      dagId: this.dag.id,
      executionId: this.executionId,
      timestamp: this.startedAt,
    });

    // Mark ready nodes
    this.updateReadyNodes();
  }

  /**
   * Mark a node as ready for execution.
   */
  markNodeReady(nodeId: NodeId): void {
    this.transitionNode(nodeId, {
      status: 'ready',
      becameReadyAt: new Date(),
    });
  }

  /**
   * Mark a node as started.
   */
  markNodeStarted(nodeId: NodeId, attempt: number = 1): void {
    const timestamp = new Date();
    this.transitionNode(nodeId, {
      status: 'running',
      startedAt: timestamp,
      attempt,
    });

    this.emit({
      type: 'node_started',
      nodeId,
      timestamp,
    });
  }

  /**
   * Mark a node as completed successfully.
   */
  markNodeCompleted(nodeId: NodeId, result: TaskResult): void {
    const state = this.nodeStates.get(nodeId);
    if (!state || state.status !== 'running') {
      throw new Error(`Cannot complete node ${nodeId} - not running`);
    }

    const startedAt = state.startedAt;
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    this.transitionNode(nodeId, {
      status: 'completed',
      result,
      completedAt,
      durationMs,
    });

    this.nodeOutputs.set(nodeId, result);

    // Update token usage
    if (result.tokenUsage) {
      this.totalTokenUsage.inputTokens += result.tokenUsage.inputTokens;
      this.totalTokenUsage.outputTokens += result.tokenUsage.outputTokens;
      if (result.tokenUsage.cacheReadTokens) {
        this.totalTokenUsage.cacheReadTokens =
          (this.totalTokenUsage.cacheReadTokens || 0) + result.tokenUsage.cacheReadTokens;
      }
      if (result.tokenUsage.cacheWriteTokens) {
        this.totalTokenUsage.cacheWriteTokens =
          (this.totalTokenUsage.cacheWriteTokens || 0) + result.tokenUsage.cacheWriteTokens;
      }
    }

    this.emit({
      type: 'node_completed',
      nodeId,
      timestamp: completedAt,
      result,
    });

    // Update ready nodes (dependents may now be ready)
    this.updateReadyNodes();
  }

  /**
   * Mark a node as failed.
   */
  markNodeFailed(nodeId: NodeId, error: TaskError): void {
    const state = this.nodeStates.get(nodeId);
    if (!state || state.status !== 'running') {
      throw new Error(`Cannot fail node ${nodeId} - not running`);
    }

    const failedAt = new Date();
    const attempts = state.attempt;

    this.transitionNode(nodeId, {
      status: 'failed',
      error,
      failedAt,
      attempts,
    });

    this.errors.push(error);

    this.emit({
      type: 'node_failed',
      nodeId,
      timestamp: failedAt,
      error,
    });

    // Update ready nodes (dependents should be skipped)
    this.updateReadyNodes();
  }

  /**
   * Mark a node as skipped.
   */
  markNodeSkipped(nodeId: NodeId, reason: SkipReason): void {
    const skippedAt = new Date();

    this.transitionNode(nodeId, {
      status: 'skipped',
      reason,
      skippedAt,
    });

    this.emit({
      type: 'node_skipped',
      nodeId,
      timestamp: skippedAt,
      reason,
    });
  }

  /**
   * Mark a node as cancelled.
   */
  markNodeCancelled(nodeId: NodeId, reason: string): void {
    this.transitionNode(nodeId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      reason,
    });
  }

  /**
   * Mark a node for retry (back to ready state).
   */
  markNodeRetrying(nodeId: NodeId, nextAttempt: number): void {
    const timestamp = new Date();

    this.transitionNode(nodeId, {
      status: 'ready',
      becameReadyAt: timestamp,
    });

    this.emit({
      type: 'node_retrying',
      nodeId,
      timestamp,
      attempt: nextAttempt,
    });
  }

  /**
   * Update all nodes that should be marked ready.
   * A node is ready when all dependencies are completed.
   */
  updateReadyNodes(): NodeId[] {
    const newlyReady: NodeId[] = [];

    for (const [nodeId, node] of this.dag.nodes) {
      const state = this.nodeStates.get(nodeId);
      if (!state || state.status !== 'pending') continue;

      const allDepsCompleted = node.dependencies.every(depId => {
        const depState = this.nodeStates.get(depId);
        return depState?.status === 'completed';
      });

      const anyDepFailed = node.dependencies.some(depId => {
        const depState = this.nodeStates.get(depId);
        return depState?.status === 'failed' || depState?.status === 'skipped';
      });

      if (anyDepFailed) {
        this.markNodeSkipped(nodeId, 'dependency_failed');
      } else if (allDepsCompleted) {
        this.markNodeReady(nodeId);
        newlyReady.push(nodeId);
      }
    }

    return newlyReady;
  }

  // ===========================================================================
  // Wave Management
  // ===========================================================================

  /**
   * Start a new wave of execution.
   */
  startWave(waveNumber: number): void {
    if (waveNumber >= this.waves.length) return;

    const wave = this.waves[waveNumber];
    wave.status = 'running';
    wave.startedAt = new Date();
    this.currentWave = waveNumber;

    this.emit({
      type: 'wave_started',
      waveNumber,
      nodeIds: wave.nodeIds,
      timestamp: wave.startedAt,
    });
  }

  /**
   * Complete a wave of execution.
   */
  completeWave(waveNumber: number): void {
    if (waveNumber >= this.waves.length) return;

    const wave = this.waves[waveNumber];
    wave.status = 'completed';
    wave.completedAt = new Date();

    const durationMs = wave.startedAt
      ? wave.completedAt.getTime() - wave.startedAt.getTime()
      : 0;

    this.emit({
      type: 'wave_completed',
      waveNumber,
      timestamp: wave.completedAt,
      durationMs,
    });
  }

  /**
   * Get nodes ready for execution in a specific wave.
   */
  getReadyNodesInWave(waveNumber: number): NodeId[] {
    if (waveNumber >= this.waves.length) return [];

    const wave = this.waves[waveNumber];
    return wave.nodeIds.filter(nodeId => {
      const state = this.nodeStates.get(nodeId);
      return state?.status === 'ready';
    });
  }

  /**
   * Check if a wave is complete (all nodes finished).
   */
  isWaveComplete(waveNumber: number): boolean {
    if (waveNumber >= this.waves.length) return true;

    const wave = this.waves[waveNumber];
    return wave.nodeIds.every(nodeId => {
      const state = this.nodeStates.get(nodeId);
      return (
        state?.status === 'completed' ||
        state?.status === 'failed' ||
        state?.status === 'skipped' ||
        state?.status === 'cancelled'
      );
    });
  }

  // ===========================================================================
  // Execution Completion
  // ===========================================================================

  /**
   * Mark entire execution as completed.
   */
  completeExecution(): void {
    this.completedAt = new Date();
    const durationMs = this.startedAt
      ? this.completedAt.getTime() - this.startedAt.getTime()
      : 0;

    this.emit({
      type: 'dag_completed',
      dagId: this.dag.id,
      executionId: this.executionId,
      timestamp: this.completedAt,
      durationMs,
    });
  }

  /**
   * Mark execution as failed.
   */
  failExecution(error: TaskError): void {
    this.completedAt = new Date();

    this.emit({
      type: 'dag_failed',
      dagId: this.dag.id,
      executionId: this.executionId,
      timestamp: this.completedAt,
      error,
    });
  }

  /**
   * Check if execution is complete (all nodes finished).
   */
  isExecutionComplete(): boolean {
    for (const [, state] of this.nodeStates) {
      if (
        state.status === 'pending' ||
        state.status === 'ready' ||
        state.status === 'running'
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if execution was successful (all nodes completed or skipped).
   */
  isExecutionSuccessful(): boolean {
    for (const [, state] of this.nodeStates) {
      if (state.status === 'failed' || state.status === 'cancelled') {
        return false;
      }
    }
    return this.isExecutionComplete();
  }

  // ===========================================================================
  // Snapshots
  // ===========================================================================

  /**
   * Get a snapshot of current execution state.
   */
  getSnapshot(): ExecutionSnapshot {
    const status = this.isExecutionComplete()
      ? this.isExecutionSuccessful()
        ? 'completed'
        : 'failed'
      : this.startedAt
        ? 'running'
        : 'pending';

    return {
      executionId: this.executionId,
      dagId: this.dag.id,
      nodeStates: new Map(this.nodeStates),
      nodeOutputs: new Map(this.nodeOutputs),
      currentWave: this.currentWave,
      totalWaves: this.waves.length,
      status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      totalTokenUsage: { ...this.totalTokenUsage },
      errors: [...this.errors],
    };
  }

  /**
   * Restore state from a snapshot (for resumption).
   */
  restoreFromSnapshot(snapshot: ExecutionSnapshot): void {
    this.nodeStates = new Map(snapshot.nodeStates);
    this.nodeOutputs = new Map(snapshot.nodeOutputs);
    this.currentWave = snapshot.currentWave;
    this.startedAt = snapshot.startedAt;
    this.completedAt = snapshot.completedAt;
    this.totalTokenUsage = { ...snapshot.totalTokenUsage };
    this.errors = [...snapshot.errors];
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  getExecutionId(): ExecutionId {
    return this.executionId;
  }

  getWaves(): ExecutionWave[] {
    return this.waves;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getTotalTokenUsage(): TokenUsage {
    return { ...this.totalTokenUsage };
  }

  getErrors(): TaskError[] {
    return [...this.errors];
  }

  getAllNodeStates(): Map<NodeId, TaskState> {
    return new Map(this.nodeStates);
  }

  getAllNodeOutputs(): Map<NodeId, TaskResult> {
    return new Map(this.nodeOutputs);
  }

  /**
   * Get all nodes in a particular state.
   */
  getNodesInState(status: TaskState['status']): NodeId[] {
    const nodes: NodeId[] = [];
    for (const [nodeId, state] of this.nodeStates) {
      if (state.status === status) {
        nodes.push(nodeId);
      }
    }
    return nodes;
  }

  /**
   * Get count of nodes by state.
   */
  getStateCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      pending: 0,
      ready: 0,
      running: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      cancelled: 0,
    };

    for (const [, state] of this.nodeStates) {
      counts[state.status]++;
    }

    return counts;
  }
}

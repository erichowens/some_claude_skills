/**
 * DAG Executor
 *
 * Executes DAGs using wave-based parallel execution.
 * Integrates with the state manager and supports multiple runtimes.
 */

import type {
  DAG,
  DAGNode,
  NodeId,
  ExecutionId,
  DAGConfig,
  TaskState,
  TaskResult,
  TaskError,
  TaskErrorCode,
  ExecutionSnapshot,
  ExecutionEvent,
  ExecutionEventListener,
  TokenUsage,
} from '../types';
import { DEFAULT_DAG_CONFIG } from '../types';
import { topologicalSort, validateDAG } from './topology';
import { StateManager } from './state-manager';

// =============================================================================
// Node Executor Interface
// =============================================================================

/**
 * Context provided to node executors
 */
export interface NodeExecutionContext {
  /** The DAG being executed */
  dag: DAG;

  /** The node being executed */
  node: DAGNode;

  /** Execution ID */
  executionId: ExecutionId;

  /** Outputs from dependency nodes */
  dependencyOutputs: Map<NodeId, TaskResult>;

  /** DAG-level input */
  dagInput: unknown;

  /** Signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Interface for executing individual nodes.
 * Different runtimes implement this interface.
 */
export interface NodeExecutor {
  /**
   * Execute a single node.
   *
   * @param context - Execution context
   * @returns Task result
   * @throws TaskError on failure
   */
  execute(context: NodeExecutionContext): Promise<TaskResult>;

  /**
   * Check if this executor can handle a node type.
   */
  canExecute(node: DAGNode): boolean;
}

// =============================================================================
// Executor Options
// =============================================================================

/**
 * Options for DAG execution
 */
export interface DAGExecutorOptions {
  /** Node executors for different node types */
  executors: NodeExecutor[];

  /** Override DAG config */
  configOverrides?: Partial<DAGConfig>;

  /** Input to the DAG */
  input?: unknown;

  /** Event listener for execution events */
  onEvent?: ExecutionEventListener;

  /** Progress callback */
  onProgress?: (snapshot: ExecutionSnapshot) => void;

  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Result of DAG execution
 */
export interface DAGExecutionResult {
  /** Whether execution succeeded */
  success: boolean;

  /** Final snapshot of execution state */
  snapshot: ExecutionSnapshot;

  /** DAG outputs (as defined in DAG.outputs) */
  outputs: Map<string, unknown>;

  /** Total token usage */
  totalTokenUsage: TokenUsage;

  /** Total execution time (ms) */
  totalTimeMs: number;

  /** Errors encountered */
  errors: TaskError[];
}

// =============================================================================
// DAG Executor
// =============================================================================

/**
 * Executes DAGs using wave-based parallel execution.
 */
export class DAGExecutor {
  private readonly dag: DAG;
  private readonly config: DAGConfig;
  private readonly executors: NodeExecutor[];
  private readonly stateManager: StateManager;
  private readonly input: unknown;
  private readonly onProgress?: (snapshot: ExecutionSnapshot) => void;
  private readonly abortController: AbortController;

  private startTime?: Date;
  private endTime?: Date;

  constructor(dag: DAG, options: DAGExecutorOptions) {
    // Validate DAG
    const validationErrors = validateDAG(dag);
    if (validationErrors.length > 0) {
      throw new Error(
        `Invalid DAG: ${validationErrors.map(e => e.message).join(', ')}`
      );
    }

    this.dag = dag;
    this.config = { ...DEFAULT_DAG_CONFIG, ...dag.config, ...options.configOverrides };
    this.executors = options.executors;
    this.input = options.input;
    this.onProgress = options.onProgress;

    // Set up abort handling
    this.abortController = new AbortController();
    if (options.abortSignal) {
      options.abortSignal.addEventListener('abort', () => {
        this.abortController.abort();
      });
    }

    // Initialize state manager
    this.stateManager = new StateManager({
      dag,
      validateTransitions: true,
      emitEvents: true,
    });

    // Forward events
    if (options.onEvent) {
      this.stateManager.addEventListener(options.onEvent);
    }
  }

  /**
   * Execute the DAG.
   */
  async execute(): Promise<DAGExecutionResult> {
    this.startTime = new Date();

    try {
      // Check abort before starting
      if (this.abortController.signal.aborted) {
        throw this.createError('INTERNAL_ERROR', 'Execution aborted before start');
      }

      // Start execution
      this.stateManager.startExecution();

      // Get execution waves
      const sortResult = topologicalSort(this.dag);
      if (!sortResult.success) {
        throw this.createError(
          'CYCLE_DETECTED',
          `Cycle detected in DAG: ${sortResult.cycle?.join(' -> ')}`
        );
      }

      // Execute waves
      await this.executeWaves(sortResult.waves.length);

      // Complete execution
      this.stateManager.completeExecution();

      // Build outputs
      const outputs = this.buildOutputs();

      this.endTime = new Date();

      return {
        success: this.stateManager.isExecutionSuccessful(),
        snapshot: this.stateManager.getSnapshot(),
        outputs,
        totalTokenUsage: this.stateManager.getTotalTokenUsage(),
        totalTimeMs: this.endTime.getTime() - this.startTime.getTime(),
        errors: this.stateManager.getErrors(),
      };
    } catch (error) {
      this.endTime = new Date();

      const taskError = this.toTaskError(error);
      this.stateManager.failExecution(taskError);

      return {
        success: false,
        snapshot: this.stateManager.getSnapshot(),
        outputs: new Map(),
        totalTokenUsage: this.stateManager.getTotalTokenUsage(),
        totalTimeMs: this.endTime.getTime() - this.startTime.getTime(),
        errors: [...this.stateManager.getErrors(), taskError],
      };
    }
  }

  /**
   * Execute all waves sequentially.
   */
  private async executeWaves(totalWaves: number): Promise<void> {
    for (let waveNum = 0; waveNum < totalWaves; waveNum++) {
      // Check for abort
      if (this.abortController.signal.aborted) {
        throw this.createError('INTERNAL_ERROR', 'Execution aborted');
      }

      // Check for timeout
      if (this.isTimedOut()) {
        throw this.createError('TIMEOUT', 'DAG execution timed out');
      }

      // Start wave
      this.stateManager.startWave(waveNum);

      // Get ready nodes in this wave
      const readyNodes = this.stateManager.getReadyNodesInWave(waveNum);

      if (readyNodes.length === 0) {
        // All nodes in this wave were skipped
        this.stateManager.completeWave(waveNum);
        continue;
      }

      // Execute nodes in parallel (respecting maxParallelism)
      await this.executeNodesInParallel(readyNodes);

      // Complete wave
      this.stateManager.completeWave(waveNum);

      // Update ready nodes for next wave (marks skipped if dependencies failed)
      this.stateManager.updateReadyNodes();

      // Report progress
      this.reportProgress();

      // Check for fail-fast
      if (this.config.failFast && this.stateManager.getErrors().length > 0) {
        throw this.createError('INTERNAL_ERROR', 'Fail-fast triggered');
      }
    }
  }

  /**
   * Execute multiple nodes in parallel.
   */
  private async executeNodesInParallel(nodeIds: NodeId[]): Promise<void> {
    // Limit parallelism
    const chunks = this.chunkArray(nodeIds, this.config.maxParallelism);

    for (const chunk of chunks) {
      if (this.abortController.signal.aborted) {
        throw this.createError('INTERNAL_ERROR', 'Execution aborted');
      }

      // Execute chunk in parallel
      const promises = chunk.map(nodeId => this.executeNode(nodeId));
      await Promise.all(promises);
    }
  }

  /**
   * Execute a single node with retry logic.
   */
  private async executeNode(nodeId: NodeId): Promise<void> {
    const node = this.dag.nodes.get(nodeId);
    if (!node) {
      throw this.createError('INTERNAL_ERROR', `Node not found: ${nodeId}`);
    }

    const retryPolicy = node.retryPolicy || this.config.defaultRetryPolicy;
    let attempt = 0;
    let lastError: TaskError | undefined;

    while (attempt < retryPolicy.maxAttempts) {
      attempt++;

      try {
        // Mark as started
        this.stateManager.markNodeStarted(nodeId, attempt);

        // Find executor
        const executor = this.findExecutor(node);
        if (!executor) {
          throw this.createError(
            'INTERNAL_ERROR',
            `No executor found for node type: ${node.type}`
          );
        }

        // Build context
        const context = this.buildExecutionContext(node);

        // Execute with timeout
        const result = await this.executeWithTimeout(
          executor.execute(context),
          node.config.timeoutMs
        );

        // Mark as completed
        this.stateManager.markNodeCompleted(nodeId, result);
        return;
      } catch (error) {
        lastError = this.toTaskError(error);

        // Check if retryable
        if (
          !lastError.retryable ||
          retryPolicy.nonRetryableErrors.includes(lastError.code) ||
          attempt >= retryPolicy.maxAttempts
        ) {
          break;
        }

        // Mark as failed first (running -> failed)
        this.stateManager.markNodeFailed(nodeId, lastError);

        // Calculate delay
        const delay = this.calculateRetryDelay(attempt, retryPolicy);
        await this.sleep(delay);

        // Mark for retry (failed -> ready)
        this.stateManager.markNodeRetrying(nodeId, attempt + 1);
      }
    }

    // Mark as failed
    this.stateManager.markNodeFailed(nodeId, lastError!);
  }

  /**
   * Find an executor that can handle a node.
   */
  private findExecutor(node: DAGNode): NodeExecutor | undefined {
    return this.executors.find(e => e.canExecute(node));
  }

  /**
   * Build execution context for a node.
   */
  private buildExecutionContext(node: DAGNode): NodeExecutionContext {
    // Gather dependency outputs
    const dependencyOutputs = new Map<NodeId, TaskResult>();
    for (const depId of node.dependencies) {
      const output = this.stateManager.getNodeOutput(depId);
      if (output) {
        dependencyOutputs.set(depId, output);
      }
    }

    return {
      dag: this.dag,
      node,
      executionId: this.stateManager.getExecutionId(),
      dependencyOutputs,
      dagInput: this.input,
      abortSignal: this.abortController.signal,
    };
  }

  /**
   * Execute a promise with timeout.
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(this.createError('TIMEOUT', `Node execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Calculate retry delay with exponential backoff.
   */
  private calculateRetryDelay(
    attempt: number,
    policy: typeof this.config.defaultRetryPolicy
  ): number {
    const delay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
    return Math.min(delay, policy.maxDelayMs);
  }

  /**
   * Build DAG outputs from completed nodes.
   */
  private buildOutputs(): Map<string, unknown> {
    const outputs = new Map<string, unknown>();

    for (const dagOutput of this.dag.outputs) {
      const nodeResult = this.stateManager.getNodeOutput(dagOutput.sourceNodeId);
      if (nodeResult) {
        let value = nodeResult.output;

        // Apply output path if specified
        if (dagOutput.outputPath) {
          value = this.extractPath(value, dagOutput.outputPath);
        }

        outputs.set(dagOutput.name, value);
      }
    }

    return outputs;
  }

  /**
   * Extract a value from an object using a path.
   */
  private extractPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Check if execution has timed out.
   */
  private isTimedOut(): boolean {
    if (!this.startTime) return false;
    const elapsed = Date.now() - this.startTime.getTime();
    return elapsed > this.config.maxExecutionTimeMs;
  }

  /**
   * Report progress via callback.
   */
  private reportProgress(): void {
    if (this.onProgress) {
      this.onProgress(this.stateManager.getSnapshot());
    }
  }

  /**
   * Create a TaskError.
   */
  private createError(code: TaskErrorCode, message: string): TaskError {
    const retryable = ['TIMEOUT', 'RATE_LIMITED', 'MODEL_ERROR'].includes(code);
    return { code, message, retryable };
  }

  /**
   * Convert an error to TaskError.
   */
  private toTaskError(error: unknown): TaskError {
    if (this.isTaskError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack,
        retryable: false,
        cause: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      retryable: false,
    };
  }

  /**
   * Type guard for TaskError.
   */
  private isTaskError(error: unknown): error is TaskError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'retryable' in error
    );
  }

  /**
   * Split array into chunks.
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sleep for a duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // Public Getters
  // ===========================================================================

  /**
   * Get current execution snapshot.
   */
  getSnapshot(): ExecutionSnapshot {
    return this.stateManager.getSnapshot();
  }

  /**
   * Get execution ID.
   */
  getExecutionId(): ExecutionId {
    return this.stateManager.getExecutionId();
  }

  /**
   * Cancel execution.
   */
  cancel(): void {
    this.abortController.abort();
  }
}

// =============================================================================
// Default Node Executor (Stub)
// =============================================================================

/**
 * A no-op executor for testing.
 * Real executors are implemented in the runtimes module.
 */
export class NoOpExecutor implements NodeExecutor {
  async execute(context: NodeExecutionContext): Promise<TaskResult> {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      output: {
        nodeId: context.node.id,
        nodeName: context.node.name,
        executed: true,
        timestamp: new Date().toISOString(),
      },
      confidence: 1.0,
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
      },
    };
  }

  canExecute(_node: DAGNode): boolean {
    return true;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Execute a DAG with default options.
 */
export async function executeDAG(
  dag: DAG,
  options?: Partial<DAGExecutorOptions>
): Promise<DAGExecutionResult> {
  const executor = new DAGExecutor(dag, {
    executors: options?.executors || [new NoOpExecutor()],
    ...options,
  });

  return executor.execute();
}

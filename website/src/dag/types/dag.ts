/**
 * DAG (Directed Acyclic Graph) Type Definitions
 *
 * Core types for representing task execution graphs in the
 * Dynamic Skill Agent Graph System.
 */

// =============================================================================
// Primitive Types
// =============================================================================

/** Unique identifier for a DAG */
export type DAGId = string & { readonly __brand: 'DAGId' };

/** Unique identifier for a node within a DAG */
export type NodeId = string & { readonly __brand: 'NodeId' };

/** Unique identifier for an execution run */
export type ExecutionId = string & { readonly __brand: 'ExecutionId' };

/** Factory functions for branded types */
export const DAGId = (id: string): DAGId => id as DAGId;
export const NodeId = (id: string): NodeId => id as NodeId;
export const ExecutionId = (id: string): ExecutionId => id as ExecutionId;

// =============================================================================
// Node Types
// =============================================================================

/**
 * The type of work a node performs
 */
export type NodeType =
  | 'skill'       // Executes a Claude Code skill
  | 'agent'       // Spawns a sub-agent with its own context
  | 'mcp-tool'    // Calls an MCP server tool directly
  | 'composite'   // Contains a sub-DAG
  | 'conditional' // Branches based on runtime condition
  | 'aggregator'  // Combines results from multiple nodes
  | 'transformer' // Transforms data between nodes
  | 'checkpoint'; // Saves state for resumption

/**
 * Configuration for how a node should execute
 */
export interface TaskConfig {
  /** Maximum time to wait for completion (ms) */
  timeoutMs: number;

  /** Number of retry attempts on failure */
  maxRetries: number;

  /** Delay between retries (ms) */
  retryDelayMs: number;

  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;

  /** Model to use for agent/skill execution */
  model?: 'haiku' | 'sonnet' | 'opus';

  /** Maximum tokens for this task */
  maxTokens?: number;

  /** Custom metadata for the task */
  metadata?: Record<string, unknown>;
}

/**
 * Default task configuration
 */
export const DEFAULT_TASK_CONFIG: TaskConfig = {
  timeoutMs: 120_000,      // 2 minutes
  maxRetries: 2,
  retryDelayMs: 1000,
  exponentialBackoff: true,
};

/**
 * Retry policy for failed nodes
 */
export interface RetryPolicy {
  /** Maximum retry attempts */
  maxAttempts: number;

  /** Base delay between retries (ms) */
  baseDelayMs: number;

  /** Maximum delay cap (ms) */
  maxDelayMs: number;

  /** Multiplier for exponential backoff */
  backoffMultiplier: number;

  /** Error types that should trigger retry */
  retryableErrors: string[];

  /** Error types that should NOT retry */
  nonRetryableErrors: string[];
}

// =============================================================================
// Task State Machine
// =============================================================================

/**
 * Discriminated union representing all possible task states.
 * State transitions follow: pending -> ready -> running -> completed|failed|skipped
 */
export type TaskState =
  | { status: 'pending' }
  | { status: 'ready'; becameReadyAt: Date }
  | { status: 'running'; startedAt: Date; attempt: number }
  | { status: 'completed'; result: TaskResult; completedAt: Date; durationMs: number }
  | { status: 'failed'; error: TaskError; failedAt: Date; attempts: number }
  | { status: 'skipped'; reason: SkipReason; skippedAt: Date }
  | { status: 'cancelled'; cancelledAt: Date; reason: string };

/**
 * Reasons a task might be skipped
 */
export type SkipReason =
  | 'dependency_failed'      // A required dependency failed
  | 'condition_not_met'      // Conditional node's condition was false
  | 'manual_skip'            // User requested skip
  | 'timeout_propagation'    // Parent DAG timed out
  | 'already_satisfied';     // Result already available (caching)

/**
 * Result of a successfully completed task
 */
export interface TaskResult {
  /** The output data from the task */
  output: unknown;

  /** Confidence score (0-1) if applicable */
  confidence?: number;

  /** Token usage statistics */
  tokenUsage?: TokenUsage;

  /** Any warnings generated during execution */
  warnings?: string[];

  /** Metadata about the execution */
  executionMetadata?: {
    model?: string;
    totalTurns?: number;
    toolCallCount?: number;
  };
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

/**
 * Error information for failed tasks
 */
export interface TaskError {
  /** Error code for categorization */
  code: TaskErrorCode;

  /** Human-readable error message */
  message: string;

  /** Stack trace if available */
  stack?: string;

  /** The node that caused the error */
  sourceNodeId?: NodeId;

  /** Whether this error is retryable */
  retryable: boolean;

  /** Original error if this is a wrapped error */
  cause?: unknown;
}

/**
 * Categorized error codes
 */
export type TaskErrorCode =
  // Execution errors
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'MODEL_ERROR'
  | 'TOOL_ERROR'
  | 'MCP_ERROR'
  // Validation errors
  | 'INVALID_INPUT'
  | 'INVALID_OUTPUT'
  | 'SCHEMA_MISMATCH'
  // Permission errors
  | 'PERMISSION_DENIED'
  | 'SCOPE_VIOLATION'
  | 'ISOLATION_BREACH'
  // Graph errors
  | 'CYCLE_DETECTED'
  | 'MISSING_DEPENDENCY'
  | 'ORPHAN_NODE'
  // Runtime errors
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

// =============================================================================
// DAG Node Definition
// =============================================================================

/**
 * A single node in the DAG representing one unit of work
 */
export interface DAGNode {
  /** Unique identifier within the DAG */
  id: NodeId;

  /** Human-readable name */
  name: string;

  /** Description of what this node does */
  description?: string;

  /** The type of work this node performs */
  type: NodeType;

  /** Skill ID if type is 'skill' */
  skillId?: string;

  /** Agent definition if type is 'agent' */
  agentId?: string;

  /** MCP tool reference if type is 'mcp-tool' */
  mcpTool?: {
    server: string;
    tool: string;
  };

  /** Sub-DAG if type is 'composite' */
  subDAG?: DAG;

  /** Condition function if type is 'conditional' */
  condition?: NodeCondition;

  /** Node IDs that must complete before this node can run */
  dependencies: NodeId[];

  /** Current execution state */
  state: TaskState;

  /** Configuration for this task */
  config: TaskConfig;

  /** Retry policy (overrides DAG-level policy) */
  retryPolicy?: RetryPolicy;

  /** Input mapping: how to derive inputs from dependency outputs */
  inputMapping?: InputMapping;

  /** Output schema for validation */
  outputSchema?: JSONSchema;

  /** Tags for categorization and filtering */
  tags?: string[];

  /** Priority for scheduling (higher = sooner) */
  priority?: number;
}

/**
 * Condition for conditional nodes
 */
export interface NodeCondition {
  /** The type of condition */
  type: 'expression' | 'dependency_output' | 'custom';

  /** Expression to evaluate (for 'expression' type) */
  expression?: string;

  /** Dependency to check (for 'dependency_output' type) */
  dependencyId?: NodeId;

  /** Path in dependency output to check */
  outputPath?: string;

  /** Expected value for comparison */
  expectedValue?: unknown;

  /** Comparison operator */
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'matches';
}

/**
 * Mapping of how inputs are derived from dependency outputs
 */
export interface InputMapping {
  [inputName: string]: {
    /** Source node ID */
    sourceNodeId: NodeId;

    /** Path in source output (JSONPath-like) */
    outputPath: string;

    /** Transformation to apply */
    transform?: 'identity' | 'stringify' | 'parse' | 'extract' | 'template';

    /** Default value if source is missing */
    defaultValue?: unknown;

    /** Whether this input is required */
    required?: boolean;
  };
}

/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: unknown[];
  description?: string;
  [key: string]: unknown;
}

// =============================================================================
// DAG Definition
// =============================================================================

/**
 * Input definition for a DAG
 */
export interface DAGInput {
  /** Name of the input */
  name: string;

  /** Description of what this input is for */
  description?: string;

  /** JSON Schema for validation */
  schema?: JSONSchema;

  /** Whether this input is required */
  required: boolean;

  /** Default value if not provided */
  defaultValue?: unknown;
}

/**
 * Output definition for a DAG
 */
export interface DAGOutput {
  /** Name of the output */
  name: string;

  /** Description of what this output contains */
  description?: string;

  /** Node ID that produces this output */
  sourceNodeId: NodeId;

  /** Path in node output to extract */
  outputPath?: string;

  /** JSON Schema for validation */
  schema?: JSONSchema;
}

/**
 * DAG-level configuration
 */
export interface DAGConfig {
  /** Maximum total execution time (ms) */
  maxExecutionTimeMs: number;

  /** Maximum parallel nodes at once */
  maxParallelism: number;

  /** Default retry policy for all nodes */
  defaultRetryPolicy: RetryPolicy;

  /** Whether to fail fast on first error */
  failFast: boolean;

  /** Whether to enable checkpointing */
  enableCheckpoints: boolean;

  /** Checkpoint interval (ms) */
  checkpointIntervalMs?: number;

  /** Whether to cache results */
  enableCaching: boolean;

  /** Cache TTL (ms) */
  cacheTtlMs?: number;

  /** Execution mode */
  executionMode: 'sequential' | 'parallel' | 'wave';
}

/**
 * Default DAG configuration
 */
export const DEFAULT_DAG_CONFIG: DAGConfig = {
  maxExecutionTimeMs: 600_000,  // 10 minutes
  maxParallelism: 5,
  defaultRetryPolicy: {
    maxAttempts: 2,
    baseDelayMs: 1000,
    maxDelayMs: 30_000,
    backoffMultiplier: 2,
    retryableErrors: ['TIMEOUT', 'RATE_LIMITED', 'MODEL_ERROR'],
    nonRetryableErrors: ['PERMISSION_DENIED', 'INVALID_INPUT'],
  },
  failFast: false,
  enableCheckpoints: true,
  checkpointIntervalMs: 60_000,
  enableCaching: true,
  cacheTtlMs: 3600_000,  // 1 hour
  executionMode: 'wave',
};

/**
 * The complete DAG structure
 */
export interface DAG {
  /** Unique identifier */
  id: DAGId;

  /** Human-readable name */
  name: string;

  /** Version of this DAG definition */
  version: string;

  /** Description of what this DAG accomplishes */
  description?: string;

  /** All nodes in the graph */
  nodes: Map<NodeId, DAGNode>;

  /** Adjacency list: nodeId -> dependent nodeIds */
  edges: Map<NodeId, NodeId[]>;

  /** DAG-level configuration */
  config: DAGConfig;

  /** Expected inputs to the DAG */
  inputs: DAGInput[];

  /** Outputs produced by the DAG */
  outputs: DAGOutput[];

  /** Tags for categorization */
  tags?: string[];

  /** When this DAG was created */
  createdAt: Date;

  /** When this DAG was last modified */
  updatedAt: Date;

  /** Author/owner information */
  author?: string;
}

// =============================================================================
// Execution Types
// =============================================================================

/**
 * Snapshot of DAG execution state at a point in time
 */
export interface ExecutionSnapshot {
  /** Execution identifier */
  executionId: ExecutionId;

  /** DAG being executed */
  dagId: DAGId;

  /** Current state of all nodes */
  nodeStates: Map<NodeId, TaskState>;

  /** Outputs from completed nodes */
  nodeOutputs: Map<NodeId, TaskResult>;

  /** Current wave being executed */
  currentWave: number;

  /** Total waves in the DAG */
  totalWaves: number;

  /** Overall execution status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

  /** When execution started */
  startedAt?: Date;

  /** When execution completed */
  completedAt?: Date;

  /** Total token usage across all nodes */
  totalTokenUsage: TokenUsage;

  /** Errors encountered */
  errors: TaskError[];
}

/**
 * A wave is a group of nodes that can execute in parallel
 */
export interface ExecutionWave {
  /** Wave number (0-indexed) */
  waveNumber: number;

  /** Nodes in this wave */
  nodeIds: NodeId[];

  /** Status of the wave */
  status: 'pending' | 'running' | 'completed' | 'failed';

  /** When this wave started */
  startedAt?: Date;

  /** When this wave completed */
  completedAt?: Date;
}

/**
 * Event emitted during DAG execution
 */
export type ExecutionEvent =
  | { type: 'dag_started'; dagId: DAGId; executionId: ExecutionId; timestamp: Date }
  | { type: 'dag_completed'; dagId: DAGId; executionId: ExecutionId; timestamp: Date; durationMs: number }
  | { type: 'dag_failed'; dagId: DAGId; executionId: ExecutionId; timestamp: Date; error: TaskError }
  | { type: 'wave_started'; waveNumber: number; nodeIds: NodeId[]; timestamp: Date }
  | { type: 'wave_completed'; waveNumber: number; timestamp: Date; durationMs: number }
  | { type: 'node_started'; nodeId: NodeId; timestamp: Date }
  | { type: 'node_completed'; nodeId: NodeId; timestamp: Date; result: TaskResult }
  | { type: 'node_failed'; nodeId: NodeId; timestamp: Date; error: TaskError }
  | { type: 'node_retrying'; nodeId: NodeId; timestamp: Date; attempt: number }
  | { type: 'node_skipped'; nodeId: NodeId; timestamp: Date; reason: SkipReason }
  | { type: 'checkpoint_saved'; executionId: ExecutionId; timestamp: Date };

/**
 * Listener for execution events
 */
export type ExecutionEventListener = (event: ExecutionEvent) => void;

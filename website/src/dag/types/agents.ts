/**
 * Agent Type Definitions
 *
 * Defines spawnable agent structures, resource limits,
 * and context bridging for the DAG execution system.
 */

import type { PermissionMatrix, IsolationLevel } from './permissions';
import type { NodeId, ExecutionId, TaskResult, TaskError } from './dag';

// =============================================================================
// Agent Identity
// =============================================================================

/** Unique identifier for an agent definition */
export type AgentDefinitionId = string & { readonly __brand: 'AgentDefinitionId' };

/** Unique identifier for a spawned agent instance */
export type AgentInstanceId = string & { readonly __brand: 'AgentInstanceId' };

/** Factory functions */
export const AgentDefinitionId = (id: string): AgentDefinitionId => id as AgentDefinitionId;
export const AgentInstanceId = (id: string): AgentInstanceId => id as AgentInstanceId;

// =============================================================================
// Resource Limits
// =============================================================================

/**
 * Resource constraints for agent execution
 */
export interface ResourceLimits {
  /** Maximum agentic turns (API round-trips) */
  maxTurns: number;

  /** Maximum tokens per turn */
  maxTokensPerTurn: number;

  /** Maximum total tokens across all turns */
  maxTotalTokens: number;

  /** Maximum execution time (ms) */
  timeoutMs: number;

  /** Maximum memory usage (bytes) - for runtime enforcement */
  maxMemoryBytes?: number;

  /** Maximum tool calls per turn */
  maxToolCallsPerTurn: number;

  /** Maximum total tool calls */
  maxTotalToolCalls: number;

  /** Maximum depth of recursive agent spawning */
  maxSpawnDepth: number;

  /** Maximum concurrent sub-agents */
  maxConcurrentSubAgents: number;
}

/**
 * Default resource limits (conservative)
 */
export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  maxTurns: 10,
  maxTokensPerTurn: 8192,
  maxTotalTokens: 50_000,
  timeoutMs: 120_000,  // 2 minutes
  maxToolCallsPerTurn: 10,
  maxTotalToolCalls: 50,
  maxSpawnDepth: 3,
  maxConcurrentSubAgents: 3,
};

/**
 * Minimal resource limits (for quick tasks)
 */
export const MINIMAL_RESOURCE_LIMITS: ResourceLimits = {
  maxTurns: 3,
  maxTokensPerTurn: 4096,
  maxTotalTokens: 10_000,
  timeoutMs: 30_000,  // 30 seconds
  maxToolCallsPerTurn: 5,
  maxTotalToolCalls: 15,
  maxSpawnDepth: 1,
  maxConcurrentSubAgents: 0,
};

/**
 * Extended resource limits (for complex tasks)
 */
export const EXTENDED_RESOURCE_LIMITS: ResourceLimits = {
  maxTurns: 30,
  maxTokensPerTurn: 16384,
  maxTotalTokens: 200_000,
  timeoutMs: 600_000,  // 10 minutes
  maxToolCallsPerTurn: 20,
  maxTotalToolCalls: 200,
  maxSpawnDepth: 5,
  maxConcurrentSubAgents: 5,
};

// =============================================================================
// Model Selection
// =============================================================================

/**
 * Available Claude models for agent execution
 */
export type ClaudeModel = 'haiku' | 'sonnet' | 'opus';

/**
 * Model selection strategy based on task complexity
 */
export interface ModelSelectionStrategy {
  /** Default model if complexity is unknown */
  default: ClaudeModel;

  /** Model mappings by complexity */
  complexity: {
    /** Simple, straightforward tasks */
    simple: ClaudeModel;
    /** Tasks requiring moderate reasoning */
    moderate: ClaudeModel;
    /** Complex, multi-step reasoning */
    complex: ClaudeModel;
  };

  /** Allow automatic escalation to more capable model */
  autoEscalate: boolean;

  /** Escalation threshold (failure rate or confidence threshold) */
  escalationThreshold?: number;
}

/**
 * Default model selection (cost-optimized)
 */
export const COST_OPTIMIZED_MODEL_SELECTION: ModelSelectionStrategy = {
  default: 'haiku',
  complexity: {
    simple: 'haiku',
    moderate: 'haiku',
    complex: 'sonnet',
  },
  autoEscalate: true,
  escalationThreshold: 0.5,
};

/**
 * Quality model selection
 */
export const QUALITY_OPTIMIZED_MODEL_SELECTION: ModelSelectionStrategy = {
  default: 'sonnet',
  complexity: {
    simple: 'haiku',
    moderate: 'sonnet',
    complex: 'opus',
  },
  autoEscalate: true,
  escalationThreshold: 0.7,
};

// =============================================================================
// Context Bridging
// =============================================================================

/**
 * Configuration for passing context between parent and child agents
 */
export interface ContextBridgingConfig {
  /** Whether child inherits parent conversation context */
  inheritParentContext: boolean;

  /** Maximum tokens of parent context to pass */
  maxContextTokens: number;

  /** Token threshold to trigger summarization */
  summarizeThreshold: number;

  /** What to include from parent context */
  contextInclusions: ContextInclusion[];

  /** What to exclude from parent context */
  contextExclusions: ContextExclusion[];

  /** How to format the inherited context */
  contextFormat: 'raw' | 'summary' | 'structured';

  /** Whether to pass tool results from parent */
  inheritToolResults: boolean;

  /** Whether to pass previous errors/failures */
  inheritErrors: boolean;
}

/**
 * What to include in context bridging
 */
export type ContextInclusion =
  | 'system_prompt'
  | 'conversation_history'
  | 'tool_results'
  | 'file_contents'
  | 'dag_state'
  | 'sibling_outputs';

/**
 * What to exclude from context bridging
 */
export type ContextExclusion =
  | 'sensitive_data'
  | 'large_files'
  | 'binary_content'
  | 'raw_errors'
  | 'debug_info';

/**
 * Default context bridging (moderate)
 */
export const DEFAULT_CONTEXT_BRIDGING: ContextBridgingConfig = {
  inheritParentContext: true,
  maxContextTokens: 4096,
  summarizeThreshold: 2048,
  contextInclusions: ['system_prompt', 'dag_state'],
  contextExclusions: ['sensitive_data', 'large_files'],
  contextFormat: 'structured',
  inheritToolResults: false,
  inheritErrors: true,
};

/**
 * Minimal context bridging (isolated)
 */
export const MINIMAL_CONTEXT_BRIDGING: ContextBridgingConfig = {
  inheritParentContext: false,
  maxContextTokens: 1024,
  summarizeThreshold: 512,
  contextInclusions: [],
  contextExclusions: ['sensitive_data', 'large_files', 'raw_errors', 'debug_info'],
  contextFormat: 'summary',
  inheritToolResults: false,
  inheritErrors: false,
};

/**
 * Full context bridging (shared context)
 */
export const FULL_CONTEXT_BRIDGING: ContextBridgingConfig = {
  inheritParentContext: true,
  maxContextTokens: 16384,
  summarizeThreshold: 8192,
  contextInclusions: ['system_prompt', 'conversation_history', 'tool_results', 'dag_state', 'sibling_outputs'],
  contextExclusions: ['sensitive_data'],
  contextFormat: 'raw',
  inheritToolResults: true,
  inheritErrors: true,
};

// =============================================================================
// Spawnable Agent Definition
// =============================================================================

/**
 * Complete definition of a spawnable agent
 */
export interface SpawnableAgentDefinition {
  /** Unique identifier for this agent definition */
  id: AgentDefinitionId;

  /** Human-readable name */
  name: string;

  /** Semantic version */
  version: string;

  /** Description of agent's purpose */
  description: string;

  /** The system prompt for this agent */
  systemPrompt: string;

  /** Skills this agent can use */
  skillIds?: string[];

  /** Permission matrix defining what agent can do */
  permissions: PermissionMatrix;

  /** Isolation level (convenience for permission presets) */
  isolationLevel: IsolationLevel;

  /** Resource constraints */
  resourceLimits: ResourceLimits;

  /** Model selection strategy */
  modelSelection: ModelSelectionStrategy;

  /** Context bridging configuration */
  contextBridging: ContextBridgingConfig;

  /** Tags for categorization */
  tags?: string[];

  /** Example use cases */
  examples?: AgentExample[];

  /** Input schema this agent expects */
  inputSchema?: Record<string, unknown>;

  /** Output schema this agent produces */
  outputSchema?: Record<string, unknown>;

  /** Custom metadata */
  metadata?: Record<string, unknown>;

  /** When this definition was created */
  createdAt: Date;

  /** When this definition was last updated */
  updatedAt: Date;
}

/**
 * Example of how to use an agent
 */
export interface AgentExample {
  /** Name of the example */
  name: string;

  /** Description of what the example demonstrates */
  description: string;

  /** Example input */
  input: unknown;

  /** Expected output (or output pattern) */
  expectedOutput?: unknown;
}

// =============================================================================
// Agent Instance (Runtime)
// =============================================================================

/**
 * A spawned instance of an agent
 */
export interface AgentInstance {
  /** Unique instance identifier */
  instanceId: AgentInstanceId;

  /** Definition this instance is based on */
  definitionId: AgentDefinitionId;

  /** DAG execution context */
  executionId: ExecutionId;

  /** Node that spawned this agent */
  parentNodeId: NodeId;

  /** Parent agent instance (if nested spawning) */
  parentInstanceId?: AgentInstanceId;

  /** Depth in spawn hierarchy (0 = root) */
  spawnDepth: number;

  /** Current state of the instance */
  state: AgentInstanceState;

  /** Resource usage so far */
  resourceUsage: ResourceUsage;

  /** When this instance was spawned */
  spawnedAt: Date;

  /** When this instance completed (if finished) */
  completedAt?: Date;

  /** The final result (if completed successfully) */
  result?: TaskResult;

  /** The error (if failed) */
  error?: TaskError;

  /** Child instances spawned by this agent */
  childInstanceIds: AgentInstanceId[];
}

/**
 * State of an agent instance
 */
export type AgentInstanceState =
  | { status: 'initializing' }
  | { status: 'running'; currentTurn: number }
  | { status: 'waiting_for_child'; childId: AgentInstanceId }
  | { status: 'completed'; result: TaskResult }
  | { status: 'failed'; error: TaskError }
  | { status: 'cancelled'; reason: string }
  | { status: 'resource_exhausted'; limitHit: keyof ResourceLimits };

/**
 * Current resource usage for an agent instance
 */
export interface ResourceUsage {
  /** Turns used */
  turnsUsed: number;

  /** Total tokens consumed */
  totalTokens: number;

  /** Tokens by category */
  tokenBreakdown: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };

  /** Elapsed time (ms) */
  elapsedMs: number;

  /** Tool calls made */
  toolCalls: number;

  /** Sub-agents spawned */
  subAgentsSpawned: number;

  /** Current spawn depth */
  currentSpawnDepth: number;
}

// =============================================================================
// Agent Spawning
// =============================================================================

/**
 * Request to spawn a new agent
 */
export interface SpawnAgentRequest {
  /** Definition to spawn */
  definitionId: AgentDefinitionId;

  /** Or inline definition */
  inlineDefinition?: Partial<SpawnableAgentDefinition>;

  /** Input to pass to the agent */
  input: unknown;

  /** Context from parent */
  parentContext?: ParentContext;

  /** Override resource limits */
  resourceLimitOverrides?: Partial<ResourceLimits>;

  /** Override permissions (must be more restrictive) */
  permissionOverrides?: Partial<PermissionMatrix>;

  /** Callback for progress updates */
  onProgress?: (update: AgentProgressUpdate) => void;
}

/**
 * Context passed from parent to child agent
 */
export interface ParentContext {
  /** Parent execution ID */
  executionId: ExecutionId;

  /** Parent node ID */
  parentNodeId: NodeId;

  /** Parent instance ID (if nested) */
  parentInstanceId?: AgentInstanceId;

  /** Current spawn depth */
  currentDepth: number;

  /** Summarized parent context */
  contextSummary?: string;

  /** Relevant outputs from sibling nodes */
  siblingOutputs?: Map<NodeId, TaskResult>;

  /** DAG-level configuration */
  dagConfig?: Record<string, unknown>;
}

/**
 * Progress update from a running agent
 */
export interface AgentProgressUpdate {
  /** Instance ID */
  instanceId: AgentInstanceId;

  /** Current turn number */
  turn: number;

  /** Resource usage so far */
  resourceUsage: ResourceUsage;

  /** What the agent is currently doing */
  currentActivity?: string;

  /** Partial results if available */
  partialResult?: unknown;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Result of spawning an agent
 */
export interface SpawnAgentResult {
  /** The spawned instance */
  instance: AgentInstance;

  /** Final result if completed */
  result?: TaskResult;

  /** Error if failed */
  error?: TaskError;

  /** Total resource usage */
  totalResourceUsage: ResourceUsage;

  /** Child instance results */
  childResults?: Map<AgentInstanceId, SpawnAgentResult>;
}

// =============================================================================
// Agent Registry
// =============================================================================

/**
 * Registry of available agent definitions
 */
export interface AgentRegistry {
  /** Get agent definition by ID */
  get(id: AgentDefinitionId): SpawnableAgentDefinition | undefined;

  /** Register a new agent definition */
  register(definition: SpawnableAgentDefinition): void;

  /** List all registered agents */
  list(): SpawnableAgentDefinition[];

  /** Search agents by criteria */
  search(criteria: AgentSearchCriteria): SpawnableAgentDefinition[];

  /** Check if an agent exists */
  has(id: AgentDefinitionId): boolean;
}

/**
 * Criteria for searching agents
 */
export interface AgentSearchCriteria {
  /** Search by name (partial match) */
  name?: string;

  /** Search by tags */
  tags?: string[];

  /** Filter by isolation level */
  isolationLevel?: IsolationLevel;

  /** Filter by required permissions */
  requiredPermissions?: Partial<PermissionMatrix>;

  /** Filter by model support */
  supportedModels?: ClaudeModel[];
}

// =============================================================================
// Built-in Agent Presets
// =============================================================================

/**
 * Preset configurations for common agent types
 */
export const AGENT_PRESETS = {
  /** Simple task executor - minimal permissions */
  simpleExecutor: {
    isolationLevel: 'strict' as const,
    resourceLimits: MINIMAL_RESOURCE_LIMITS,
    modelSelection: COST_OPTIMIZED_MODEL_SELECTION,
    contextBridging: MINIMAL_CONTEXT_BRIDGING,
  },

  /** Code analyzer - read-only with moderate resources */
  codeAnalyzer: {
    isolationLevel: 'moderate' as const,
    resourceLimits: DEFAULT_RESOURCE_LIMITS,
    modelSelection: COST_OPTIMIZED_MODEL_SELECTION,
    contextBridging: DEFAULT_CONTEXT_BRIDGING,
  },

  /** Code modifier - write access, extended resources */
  codeModifier: {
    isolationLevel: 'moderate' as const,
    resourceLimits: EXTENDED_RESOURCE_LIMITS,
    modelSelection: QUALITY_OPTIMIZED_MODEL_SELECTION,
    contextBridging: FULL_CONTEXT_BRIDGING,
  },

  /** Research agent - network access, extended resources */
  researcher: {
    isolationLevel: 'permissive' as const,
    resourceLimits: EXTENDED_RESOURCE_LIMITS,
    modelSelection: QUALITY_OPTIMIZED_MODEL_SELECTION,
    contextBridging: FULL_CONTEXT_BRIDGING,
  },

  /** Orchestrator - can spawn sub-agents */
  orchestrator: {
    isolationLevel: 'permissive' as const,
    resourceLimits: {
      ...EXTENDED_RESOURCE_LIMITS,
      maxSpawnDepth: 5,
      maxConcurrentSubAgents: 5,
    },
    modelSelection: QUALITY_OPTIMIZED_MODEL_SELECTION,
    contextBridging: FULL_CONTEXT_BRIDGING,
  },
} as const;

/**
 * DAG Framework Type Exports
 *
 * Central export point for all DAG-related types.
 */

// DAG Types
export {
  // Re-export branded type constructors (which are both types and values)
  DAGId,
  NodeId,
  ExecutionId,
  // Re-export constants
  DEFAULT_TASK_CONFIG,
  DEFAULT_DAG_CONFIG,
} from './dag';

export type {
  NodeType,
  TaskConfig,
  RetryPolicy,
  TaskState,
  SkipReason,
  TaskResult,
  TokenUsage,
  TaskError,
  TaskErrorCode,
  DAGNode,
  NodeCondition,
  InputMapping,
  JSONSchema,
  DAGInput,
  DAGOutput,
  DAGConfig,
  DAG,
  ExecutionSnapshot,
  ExecutionWave,
  ExecutionEvent,
  ExecutionEventListener,
} from './dag';

// Permission Types
export type {
  CoreToolPermissions,
  BashPermissions,
  FileSystemPermissions,
  MCPToolPermissions,
  NetworkPermissions,
  ModelPermissions,
  PermissionMatrix,
  IsolationLevel,
  PermissionValidationResult,
  // Note: PermissionValidationError interface renamed to avoid conflict with class from permissions module
  PermissionValidationError as PermissionValidationErrorItem,
} from './permissions';

export {
  DENY_ALL_CORE_TOOLS,
  ALLOW_ALL_CORE_TOOLS,
  READ_ONLY_CORE_TOOLS,
  DENY_BASH,
  READ_ONLY_BASH,
  DEV_BASH,
  DENY_FILESYSTEM,
  PROJECT_FILESYSTEM,
  DENY_MCP,
  READ_ONLY_MCP,
  DENY_NETWORK,
  PUBLIC_API_NETWORK,
  DEFAULT_MODEL_PERMISSIONS,
  STRICT_ISOLATION,
  MODERATE_ISOLATION,
  PERMISSIVE_ISOLATION,
  getPermissionMatrixForLevel,
  validatePermissionInheritance,
  restrictPermissions,
} from './permissions';

// Agent Types - branded types are both types and values, so only use export { }
export {
  AgentDefinitionId,
  AgentInstanceId,
  DEFAULT_RESOURCE_LIMITS,
  MINIMAL_RESOURCE_LIMITS,
  EXTENDED_RESOURCE_LIMITS,
  COST_OPTIMIZED_MODEL_SELECTION,
  QUALITY_OPTIMIZED_MODEL_SELECTION,
  DEFAULT_CONTEXT_BRIDGING,
  MINIMAL_CONTEXT_BRIDGING,
  FULL_CONTEXT_BRIDGING,
  AGENT_PRESETS,
} from './agents';

export type {
  ResourceLimits,
  ClaudeModel,
  ModelSelectionStrategy,
  ContextBridgingConfig,
  ContextInclusion,
  ContextExclusion,
  SpawnableAgentDefinition,
  AgentExample,
  AgentInstance,
  AgentInstanceState,
  ResourceUsage,
  SpawnAgentRequest,
  ParentContext,
  AgentProgressUpdate,
  SpawnAgentResult,
  AgentRegistry,
  AgentSearchCriteria,
} from './agents';

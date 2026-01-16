/**
 * DAG Core Module Exports
 *
 * Core functionality for DAG execution.
 */

// Topology
export {
  topologicalSort,
  isAcyclic,
  getCycle,
  findCriticalPath,
  extractSubgraph,
  findTransitiveDependents,
  findTransitiveDependencies,
  validateDAG,
} from './topology';

export type {
  TopologicalSortResult,
  DAGStats,
  CriticalPathResult,
  DAGValidationError,
} from './topology';

// State Manager
export { StateManager, InvalidStateTransitionError, isValidTransition } from './state-manager';
export type { StateManagerOptions } from './state-manager';

// Executor
export {
  DAGExecutor,
  NoOpExecutor,
  executeDAG,
} from './executor';

export type {
  NodeExecutionContext,
  NodeExecutor,
  DAGExecutorOptions,
  DAGExecutionResult,
} from './executor';

// Builder
export {
  DAGBuilder,
  NodeBuilder,
  ConditionalNodeBuilder,
  DAGBuilderError,
  dag,
  linearDag,
  fanOutFanInDag,
} from './builder';

export type { ValidationResult } from './builder';

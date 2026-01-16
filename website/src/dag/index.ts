/**
 * DAG Framework
 *
 * Dynamic Skill Agent Graph System for Claude Code.
 * Provides DAG-based task execution with parallel support.
 *
 * @module dag
 */

// Re-export all types
export * from './types';

// Re-export core functionality
// Note: ValidationResult from core is for DAG builder validation
export {
  topologicalSort,
  isAcyclic,
  getCycle,
  findCriticalPath,
  extractSubgraph,
  findTransitiveDependents,
  findTransitiveDependencies,
  validateDAG,
  StateManager,
  InvalidStateTransitionError,
  isValidTransition,
  DAGExecutor,
  NoOpExecutor,
  executeDAG,
  DAGBuilder,
  NodeBuilder,
  ConditionalNodeBuilder,
  DAGBuilderError,
  dag,
  linearDag,
  fanOutFanInDag,
} from './core';

// Re-export task decomposer
export { TaskDecomposer } from './core/task-decomposer';
export type {
  Subtask,
  DecompositionResult,
  SkillMatch,
  DecomposerConfig,
} from './core/task-decomposer';

// Re-export skill matcher
export { SkillMatcher, matchAllSkills } from './core/skill-matcher';
export type {
  MatchingStrategy,
  MatcherConfig,
} from './core/skill-matcher';

// Re-export embedding service
export { EmbeddingService } from './core/embedding-service';
export type {
  Embedding,
  EmbeddingConfig,
  EmbeddingResult,
} from './core/embedding-service';

// Re-export embedding cache
export { EmbeddingCache } from './core/embedding-cache';
export type {
  CachedEmbedding,
  EmbeddingCacheData,
  EmbeddingCacheConfig,
} from './core/embedding-cache';

// Re-export skill registry
export {
  loadAvailableSkills,
  getSkillsByCategory,
  getSkillsByTags,
  searchSkills,
  getSkillById,
  createDecomposerConfig,
} from './registry/skill-loader';
export type { SkillInfo } from './registry/skill-loader';

export type {
  TopologicalSortResult,
  DAGStats,
  CriticalPathResult,
  DAGValidationError,
  StateManagerOptions,
  NodeExecutionContext,
  NodeExecutor,
  DAGExecutorOptions,
  DAGExecutionResult,
  ValidationResult as DAGValidationResult, // Renamed to avoid conflict with permission validation
} from './core';

// Re-export permissions
// Note: ValidationResult from permissions is for permission validation
// Note: PermissionValidationError from permissions is a class (types has an interface)
export {
  PermissionValidator,
  PermissionValidationError, // Class from permissions/validator
  createValidator,
  validatePermissions,
  validateInheritance,
  PermissionEnforcer,
  PermissionDeniedError,
  createEnforcer,
  createStrictEnforcer,
  createPermissiveEnforcer,
  MINIMAL_PERMISSIONS,
  READ_ONLY_PERMISSIONS,
  STANDARD_PERMISSIONS,
  FULL_PERMISSIONS,
  CI_CD_PERMISSIONS,
  RESEARCH_PERMISSIONS,
  CODE_GENERATION_PERMISSIONS,
  getPreset,
  getRecommendedPreset,
  getIsolationLevel,
  createCustomPreset,
  listPresets,
} from './permissions';

export type {
  ValidationResult as PermissionsValidationResult, // Renamed to avoid conflict with DAG validation
  PermissionError,
  PermissionWarning,
  PermissionErrorCode,
  PermissionWarningCode,
  EnforcementResult,
  Violation,
  ViolationType,
  PermissionRequest,
  RequestType,
  AuditEntry,
  EnforcerOptions,
  PresetName,
  TaskType,
} from './permissions';

// Re-export coordination utilities
export {
  FileLockManager,
  getSharedLockManager,
  resetSharedLockManager,
} from './coordination/file-lock-manager';
export type {
  FileLock,
  LockResult,
  FileLockConfig,
} from './coordination/file-lock-manager';

export {
  SingletonTaskCoordinator,
  getSharedSingletonCoordinator,
  resetSharedSingletonCoordinator,
  SINGLETON_TASKS,
} from './coordination/singleton-task-coordinator';
export type {
  SingletonTask,
  SingletonAcquisitionResult,
  SingletonTaskType,
  SingletonCoordinatorConfig,
} from './coordination/singleton-task-coordinator';

export {
  ConflictDetector,
} from './coordination/conflict-detector';
export type {
  NodeConflict,
  WaveConflictAnalysis,
} from './coordination/conflict-detector';

// Re-export runtimes
export * from './runtimes';

// Re-export registry layer
export * from './registry';

// Re-export quality assurance layer
export * from './quality';

// Re-export feedback & learning layer
export * from './feedback';

// Re-export observability layer
export * from './observability';

// Version
export const DAG_FRAMEWORK_VERSION = '1.0.0';

/**
 * Quick start example:
 *
 * ```typescript
 * import { dag, ClaudeCodeRuntime, STANDARD_PERMISSIONS } from './dag';
 *
 * // Build a simple DAG
 * const myDag = dag('research-and-summarize')
 *   .skillNode('research', 'comprehensive-researcher')
 *     .prompt('Research the topic: {{topic}}')
 *     .done()
 *   .skillNode('summarize', 'technical-writer')
 *     .dependsOn('research')
 *     .prompt('Summarize the research findings')
 *     .done()
 *   .inputs('topic')
 *   .outputs({ name: 'summary', from: 'summarize' })
 *   .build();
 *
 * // Execute with Claude Code runtime
 * const runtime = new ClaudeCodeRuntime({
 *   permissions: STANDARD_PERMISSIONS,
 *   defaultModel: 'sonnet',
 * });
 *
 * const result = await runtime.execute(myDag, { topic: 'AI safety' });
 * ```
 */

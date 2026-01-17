"use strict";
/**
 * DAG Framework
 *
 * Dynamic Skill Agent Graph System for Claude Code.
 * Provides DAG-based task execution with parallel support.
 *
 * @module dag
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreset = exports.CODE_GENERATION_PERMISSIONS = exports.RESEARCH_PERMISSIONS = exports.CI_CD_PERMISSIONS = exports.FULL_PERMISSIONS = exports.STANDARD_PERMISSIONS = exports.READ_ONLY_PERMISSIONS = exports.MINIMAL_PERMISSIONS = exports.createPermissiveEnforcer = exports.createStrictEnforcer = exports.createEnforcer = exports.PermissionDeniedError = exports.PermissionEnforcer = exports.validateInheritance = exports.validatePermissions = exports.createValidator = exports.PermissionValidationError = exports.PermissionValidator = exports.createDecomposerConfig = exports.getSkillById = exports.searchSkills = exports.getSkillsByTags = exports.getSkillsByCategory = exports.loadAvailableSkills = exports.EmbeddingCache = exports.EmbeddingService = exports.matchAllSkills = exports.SkillMatcher = exports.TaskDecomposer = exports.fanOutFanInDag = exports.linearDag = exports.dag = exports.DAGBuilderError = exports.ConditionalNodeBuilder = exports.NodeBuilder = exports.DAGBuilder = exports.executeDAG = exports.NoOpExecutor = exports.DAGExecutor = exports.isValidTransition = exports.InvalidStateTransitionError = exports.StateManager = exports.validateDAG = exports.findTransitiveDependencies = exports.findTransitiveDependents = exports.extractSubgraph = exports.findCriticalPath = exports.getCycle = exports.isAcyclic = exports.topologicalSort = void 0;
exports.DAG_FRAMEWORK_VERSION = exports.ConflictDetector = exports.SINGLETON_TASKS = exports.resetSharedSingletonCoordinator = exports.getSharedSingletonCoordinator = exports.SingletonTaskCoordinator = exports.resetSharedLockManager = exports.getSharedLockManager = exports.FileLockManager = exports.listPresets = exports.createCustomPreset = exports.getIsolationLevel = exports.getRecommendedPreset = void 0;
// Re-export all types
__exportStar(require("./types"), exports);
// Re-export core functionality
// Note: ValidationResult from core is for DAG builder validation
var core_1 = require("./core");
Object.defineProperty(exports, "topologicalSort", { enumerable: true, get: function () { return core_1.topologicalSort; } });
Object.defineProperty(exports, "isAcyclic", { enumerable: true, get: function () { return core_1.isAcyclic; } });
Object.defineProperty(exports, "getCycle", { enumerable: true, get: function () { return core_1.getCycle; } });
Object.defineProperty(exports, "findCriticalPath", { enumerable: true, get: function () { return core_1.findCriticalPath; } });
Object.defineProperty(exports, "extractSubgraph", { enumerable: true, get: function () { return core_1.extractSubgraph; } });
Object.defineProperty(exports, "findTransitiveDependents", { enumerable: true, get: function () { return core_1.findTransitiveDependents; } });
Object.defineProperty(exports, "findTransitiveDependencies", { enumerable: true, get: function () { return core_1.findTransitiveDependencies; } });
Object.defineProperty(exports, "validateDAG", { enumerable: true, get: function () { return core_1.validateDAG; } });
Object.defineProperty(exports, "StateManager", { enumerable: true, get: function () { return core_1.StateManager; } });
Object.defineProperty(exports, "InvalidStateTransitionError", { enumerable: true, get: function () { return core_1.InvalidStateTransitionError; } });
Object.defineProperty(exports, "isValidTransition", { enumerable: true, get: function () { return core_1.isValidTransition; } });
Object.defineProperty(exports, "DAGExecutor", { enumerable: true, get: function () { return core_1.DAGExecutor; } });
Object.defineProperty(exports, "NoOpExecutor", { enumerable: true, get: function () { return core_1.NoOpExecutor; } });
Object.defineProperty(exports, "executeDAG", { enumerable: true, get: function () { return core_1.executeDAG; } });
Object.defineProperty(exports, "DAGBuilder", { enumerable: true, get: function () { return core_1.DAGBuilder; } });
Object.defineProperty(exports, "NodeBuilder", { enumerable: true, get: function () { return core_1.NodeBuilder; } });
Object.defineProperty(exports, "ConditionalNodeBuilder", { enumerable: true, get: function () { return core_1.ConditionalNodeBuilder; } });
Object.defineProperty(exports, "DAGBuilderError", { enumerable: true, get: function () { return core_1.DAGBuilderError; } });
Object.defineProperty(exports, "dag", { enumerable: true, get: function () { return core_1.dag; } });
Object.defineProperty(exports, "linearDag", { enumerable: true, get: function () { return core_1.linearDag; } });
Object.defineProperty(exports, "fanOutFanInDag", { enumerable: true, get: function () { return core_1.fanOutFanInDag; } });
// Re-export task decomposer
var task_decomposer_1 = require("./core/task-decomposer");
Object.defineProperty(exports, "TaskDecomposer", { enumerable: true, get: function () { return task_decomposer_1.TaskDecomposer; } });
// Re-export skill matcher
var skill_matcher_1 = require("./core/skill-matcher");
Object.defineProperty(exports, "SkillMatcher", { enumerable: true, get: function () { return skill_matcher_1.SkillMatcher; } });
Object.defineProperty(exports, "matchAllSkills", { enumerable: true, get: function () { return skill_matcher_1.matchAllSkills; } });
// Re-export embedding service
var embedding_service_1 = require("./core/embedding-service");
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return embedding_service_1.EmbeddingService; } });
// Re-export embedding cache
var embedding_cache_1 = require("./core/embedding-cache");
Object.defineProperty(exports, "EmbeddingCache", { enumerable: true, get: function () { return embedding_cache_1.EmbeddingCache; } });
// Re-export skill registry
var skill_loader_1 = require("./registry/skill-loader");
Object.defineProperty(exports, "loadAvailableSkills", { enumerable: true, get: function () { return skill_loader_1.loadAvailableSkills; } });
Object.defineProperty(exports, "getSkillsByCategory", { enumerable: true, get: function () { return skill_loader_1.getSkillsByCategory; } });
Object.defineProperty(exports, "getSkillsByTags", { enumerable: true, get: function () { return skill_loader_1.getSkillsByTags; } });
Object.defineProperty(exports, "searchSkills", { enumerable: true, get: function () { return skill_loader_1.searchSkills; } });
Object.defineProperty(exports, "getSkillById", { enumerable: true, get: function () { return skill_loader_1.getSkillById; } });
Object.defineProperty(exports, "createDecomposerConfig", { enumerable: true, get: function () { return skill_loader_1.createDecomposerConfig; } });
// Re-export permissions
// Note: ValidationResult from permissions is for permission validation
// Note: PermissionValidationError from permissions is a class (types has an interface)
var permissions_1 = require("./permissions");
Object.defineProperty(exports, "PermissionValidator", { enumerable: true, get: function () { return permissions_1.PermissionValidator; } });
Object.defineProperty(exports, "PermissionValidationError", { enumerable: true, get: function () { return permissions_1.PermissionValidationError; } });
Object.defineProperty(exports, "createValidator", { enumerable: true, get: function () { return permissions_1.createValidator; } });
Object.defineProperty(exports, "validatePermissions", { enumerable: true, get: function () { return permissions_1.validatePermissions; } });
Object.defineProperty(exports, "validateInheritance", { enumerable: true, get: function () { return permissions_1.validateInheritance; } });
Object.defineProperty(exports, "PermissionEnforcer", { enumerable: true, get: function () { return permissions_1.PermissionEnforcer; } });
Object.defineProperty(exports, "PermissionDeniedError", { enumerable: true, get: function () { return permissions_1.PermissionDeniedError; } });
Object.defineProperty(exports, "createEnforcer", { enumerable: true, get: function () { return permissions_1.createEnforcer; } });
Object.defineProperty(exports, "createStrictEnforcer", { enumerable: true, get: function () { return permissions_1.createStrictEnforcer; } });
Object.defineProperty(exports, "createPermissiveEnforcer", { enumerable: true, get: function () { return permissions_1.createPermissiveEnforcer; } });
Object.defineProperty(exports, "MINIMAL_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.MINIMAL_PERMISSIONS; } });
Object.defineProperty(exports, "READ_ONLY_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.READ_ONLY_PERMISSIONS; } });
Object.defineProperty(exports, "STANDARD_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.STANDARD_PERMISSIONS; } });
Object.defineProperty(exports, "FULL_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.FULL_PERMISSIONS; } });
Object.defineProperty(exports, "CI_CD_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.CI_CD_PERMISSIONS; } });
Object.defineProperty(exports, "RESEARCH_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.RESEARCH_PERMISSIONS; } });
Object.defineProperty(exports, "CODE_GENERATION_PERMISSIONS", { enumerable: true, get: function () { return permissions_1.CODE_GENERATION_PERMISSIONS; } });
Object.defineProperty(exports, "getPreset", { enumerable: true, get: function () { return permissions_1.getPreset; } });
Object.defineProperty(exports, "getRecommendedPreset", { enumerable: true, get: function () { return permissions_1.getRecommendedPreset; } });
Object.defineProperty(exports, "getIsolationLevel", { enumerable: true, get: function () { return permissions_1.getIsolationLevel; } });
Object.defineProperty(exports, "createCustomPreset", { enumerable: true, get: function () { return permissions_1.createCustomPreset; } });
Object.defineProperty(exports, "listPresets", { enumerable: true, get: function () { return permissions_1.listPresets; } });
// Re-export coordination utilities
var file_lock_manager_1 = require("./coordination/file-lock-manager");
Object.defineProperty(exports, "FileLockManager", { enumerable: true, get: function () { return file_lock_manager_1.FileLockManager; } });
Object.defineProperty(exports, "getSharedLockManager", { enumerable: true, get: function () { return file_lock_manager_1.getSharedLockManager; } });
Object.defineProperty(exports, "resetSharedLockManager", { enumerable: true, get: function () { return file_lock_manager_1.resetSharedLockManager; } });
var singleton_task_coordinator_1 = require("./coordination/singleton-task-coordinator");
Object.defineProperty(exports, "SingletonTaskCoordinator", { enumerable: true, get: function () { return singleton_task_coordinator_1.SingletonTaskCoordinator; } });
Object.defineProperty(exports, "getSharedSingletonCoordinator", { enumerable: true, get: function () { return singleton_task_coordinator_1.getSharedSingletonCoordinator; } });
Object.defineProperty(exports, "resetSharedSingletonCoordinator", { enumerable: true, get: function () { return singleton_task_coordinator_1.resetSharedSingletonCoordinator; } });
Object.defineProperty(exports, "SINGLETON_TASKS", { enumerable: true, get: function () { return singleton_task_coordinator_1.SINGLETON_TASKS; } });
var conflict_detector_1 = require("./coordination/conflict-detector");
Object.defineProperty(exports, "ConflictDetector", { enumerable: true, get: function () { return conflict_detector_1.ConflictDetector; } });
// Re-export runtimes
__exportStar(require("./runtimes"), exports);
// Re-export registry layer
__exportStar(require("./registry"), exports);
// Re-export quality assurance layer
__exportStar(require("./quality"), exports);
// Re-export feedback & learning layer
__exportStar(require("./feedback"), exports);
// Re-export observability layer
__exportStar(require("./observability"), exports);
// Version
exports.DAG_FRAMEWORK_VERSION = '1.0.0';
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

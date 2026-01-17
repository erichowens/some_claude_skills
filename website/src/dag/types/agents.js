"use strict";
/**
 * Agent Type Definitions
 *
 * Defines spawnable agent structures, resource limits,
 * and context bridging for the DAG execution system.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_PRESETS = exports.FULL_CONTEXT_BRIDGING = exports.MINIMAL_CONTEXT_BRIDGING = exports.DEFAULT_CONTEXT_BRIDGING = exports.QUALITY_OPTIMIZED_MODEL_SELECTION = exports.COST_OPTIMIZED_MODEL_SELECTION = exports.EXTENDED_RESOURCE_LIMITS = exports.MINIMAL_RESOURCE_LIMITS = exports.DEFAULT_RESOURCE_LIMITS = exports.AgentInstanceId = exports.AgentDefinitionId = void 0;
/** Factory functions */
var AgentDefinitionId = function (id) { return id; };
exports.AgentDefinitionId = AgentDefinitionId;
var AgentInstanceId = function (id) { return id; };
exports.AgentInstanceId = AgentInstanceId;
/**
 * Default resource limits (conservative)
 */
exports.DEFAULT_RESOURCE_LIMITS = {
    maxTurns: 10,
    maxTokensPerTurn: 8192,
    maxTotalTokens: 50000,
    timeoutMs: 120000, // 2 minutes
    maxToolCallsPerTurn: 10,
    maxTotalToolCalls: 50,
    maxSpawnDepth: 3,
    maxConcurrentSubAgents: 3,
};
/**
 * Minimal resource limits (for quick tasks)
 */
exports.MINIMAL_RESOURCE_LIMITS = {
    maxTurns: 3,
    maxTokensPerTurn: 4096,
    maxTotalTokens: 10000,
    timeoutMs: 30000, // 30 seconds
    maxToolCallsPerTurn: 5,
    maxTotalToolCalls: 15,
    maxSpawnDepth: 1,
    maxConcurrentSubAgents: 0,
};
/**
 * Extended resource limits (for complex tasks)
 */
exports.EXTENDED_RESOURCE_LIMITS = {
    maxTurns: 30,
    maxTokensPerTurn: 16384,
    maxTotalTokens: 200000,
    timeoutMs: 600000, // 10 minutes
    maxToolCallsPerTurn: 20,
    maxTotalToolCalls: 200,
    maxSpawnDepth: 5,
    maxConcurrentSubAgents: 5,
};
/**
 * Default model selection (cost-optimized)
 */
exports.COST_OPTIMIZED_MODEL_SELECTION = {
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
exports.QUALITY_OPTIMIZED_MODEL_SELECTION = {
    default: 'sonnet',
    complexity: {
        simple: 'haiku',
        moderate: 'sonnet',
        complex: 'opus',
    },
    autoEscalate: true,
    escalationThreshold: 0.7,
};
/**
 * Default context bridging (moderate)
 */
exports.DEFAULT_CONTEXT_BRIDGING = {
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
exports.MINIMAL_CONTEXT_BRIDGING = {
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
exports.FULL_CONTEXT_BRIDGING = {
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
// Built-in Agent Presets
// =============================================================================
/**
 * Preset configurations for common agent types
 */
exports.AGENT_PRESETS = {
    /** Simple task executor - minimal permissions */
    simpleExecutor: {
        isolationLevel: 'strict',
        resourceLimits: exports.MINIMAL_RESOURCE_LIMITS,
        modelSelection: exports.COST_OPTIMIZED_MODEL_SELECTION,
        contextBridging: exports.MINIMAL_CONTEXT_BRIDGING,
    },
    /** Code analyzer - read-only with moderate resources */
    codeAnalyzer: {
        isolationLevel: 'moderate',
        resourceLimits: exports.DEFAULT_RESOURCE_LIMITS,
        modelSelection: exports.COST_OPTIMIZED_MODEL_SELECTION,
        contextBridging: exports.DEFAULT_CONTEXT_BRIDGING,
    },
    /** Code modifier - write access, extended resources */
    codeModifier: {
        isolationLevel: 'moderate',
        resourceLimits: exports.EXTENDED_RESOURCE_LIMITS,
        modelSelection: exports.QUALITY_OPTIMIZED_MODEL_SELECTION,
        contextBridging: exports.FULL_CONTEXT_BRIDGING,
    },
    /** Research agent - network access, extended resources */
    researcher: {
        isolationLevel: 'permissive',
        resourceLimits: exports.EXTENDED_RESOURCE_LIMITS,
        modelSelection: exports.QUALITY_OPTIMIZED_MODEL_SELECTION,
        contextBridging: exports.FULL_CONTEXT_BRIDGING,
    },
    /** Orchestrator - can spawn sub-agents */
    orchestrator: {
        isolationLevel: 'permissive',
        resourceLimits: __assign(__assign({}, exports.EXTENDED_RESOURCE_LIMITS), { maxSpawnDepth: 5, maxConcurrentSubAgents: 5 }),
        modelSelection: exports.QUALITY_OPTIMIZED_MODEL_SELECTION,
        contextBridging: exports.FULL_CONTEXT_BRIDGING,
    },
};

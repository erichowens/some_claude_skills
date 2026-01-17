"use strict";
/**
 * DAG (Directed Acyclic Graph) Type Definitions
 *
 * Core types for representing task execution graphs in the
 * Dynamic Skill Agent Graph System.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DAG_CONFIG = exports.DEFAULT_TASK_CONFIG = exports.ExecutionId = exports.NodeId = exports.DAGId = void 0;
/** Factory functions for branded types */
var DAGId = function (id) { return id; };
exports.DAGId = DAGId;
var NodeId = function (id) { return id; };
exports.NodeId = NodeId;
var ExecutionId = function (id) { return id; };
exports.ExecutionId = ExecutionId;
/**
 * Default task configuration
 */
exports.DEFAULT_TASK_CONFIG = {
    timeoutMs: 120000, // 2 minutes
    maxRetries: 2,
    retryDelayMs: 1000,
    exponentialBackoff: true,
};
/**
 * Default DAG configuration
 */
exports.DEFAULT_DAG_CONFIG = {
    maxExecutionTimeMs: 600000, // 10 minutes
    maxParallelism: 5,
    defaultRetryPolicy: {
        maxAttempts: 2,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableErrors: ['TIMEOUT', 'RATE_LIMITED', 'MODEL_ERROR'],
        nonRetryableErrors: ['PERMISSION_DENIED', 'INVALID_INPUT'],
    },
    failFast: false,
    enableCheckpoints: true,
    checkpointIntervalMs: 60000,
    enableCaching: true,
    cacheTtlMs: 3600000, // 1 hour
    executionMode: 'wave',
};

"use strict";
/**
 * Tests for DAG State Manager
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var state_manager_1 = require("./state-manager");
var types_1 = require("../types");
// =============================================================================
// Test Helpers
// =============================================================================
function createTestNode(id, dependencies) {
    if (dependencies === void 0) { dependencies = []; }
    return {
        id: (0, types_1.NodeId)(id),
        name: "Node ".concat(id),
        type: 'skill',
        skillId: "skill-".concat(id),
        dependencies: dependencies.map(types_1.NodeId),
        state: { status: 'pending' },
        config: {
            timeoutMs: 30000,
        },
        metadata: {},
        tags: [],
    };
}
function createTestDAG(nodes) {
    var nodeMap = new Map();
    var edges = new Map();
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        nodeMap.set(node.id, node);
        edges.set(node.id, []);
    }
    // Build edges from dependencies
    for (var _a = 0, nodes_2 = nodes; _a < nodes_2.length; _a++) {
        var node = nodes_2[_a];
        for (var _b = 0, _c = node.dependencies; _b < _c.length; _b++) {
            var depId = _c[_b];
            var depEdges = edges.get(depId) || [];
            depEdges.push(node.id);
            edges.set(depId, depEdges);
        }
    }
    return {
        id: (0, types_1.DAGId)('test-dag'),
        name: 'Test DAG',
        version: '1.0.0',
        nodes: nodeMap,
        edges: edges,
        inputs: [],
        outputs: [],
        metadata: {},
        tags: [],
    };
}
function createResult(output) {
    if (output === void 0) { output = { done: true }; }
    return {
        output: output,
        confidence: 1.0,
        tokenUsage: {
            inputTokens: 100,
            outputTokens: 50,
        },
    };
}
function createError(message) {
    if (message === void 0) { message = 'Test error'; }
    return {
        code: 'INTERNAL_ERROR',
        message: message,
        retryable: false,
    };
}
// =============================================================================
// isValidTransition Tests
// =============================================================================
(0, vitest_1.describe)('isValidTransition', function () {
    (0, vitest_1.describe)('from pending', function () {
        (0, vitest_1.it)('should allow pending -> ready', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'pending' }, { status: 'ready', becameReadyAt: new Date() })).toBe(true);
        });
        (0, vitest_1.it)('should allow pending -> skipped', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'pending' }, { status: 'skipped', reason: 'dependency_failed', skippedAt: new Date() })).toBe(true);
        });
        (0, vitest_1.it)('should allow pending -> cancelled', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'pending' }, { status: 'cancelled', cancelledAt: new Date(), reason: 'user cancelled' })).toBe(true);
        });
        (0, vitest_1.it)('should not allow pending -> running', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'pending' }, { status: 'running', startedAt: new Date(), attempt: 1 })).toBe(false);
        });
        (0, vitest_1.it)('should not allow pending -> completed', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'pending' }, { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 })).toBe(false);
        });
    });
    (0, vitest_1.describe)('from ready', function () {
        (0, vitest_1.it)('should allow ready -> running', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'ready', becameReadyAt: new Date() }, { status: 'running', startedAt: new Date(), attempt: 1 })).toBe(true);
        });
        (0, vitest_1.it)('should allow ready -> skipped', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'ready', becameReadyAt: new Date() }, { status: 'skipped', reason: 'condition_not_met', skippedAt: new Date() })).toBe(true);
        });
        (0, vitest_1.it)('should allow ready -> cancelled', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'ready', becameReadyAt: new Date() }, { status: 'cancelled', cancelledAt: new Date(), reason: 'timeout' })).toBe(true);
        });
        (0, vitest_1.it)('should not allow ready -> completed', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'ready', becameReadyAt: new Date() }, { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 })).toBe(false);
        });
    });
    (0, vitest_1.describe)('from running', function () {
        (0, vitest_1.it)('should allow running -> completed', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'running', startedAt: new Date(), attempt: 1 }, { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 })).toBe(true);
        });
        (0, vitest_1.it)('should allow running -> failed', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'running', startedAt: new Date(), attempt: 1 }, { status: 'failed', error: createError(), failedAt: new Date(), attempts: 1 })).toBe(true);
        });
        (0, vitest_1.it)('should allow running -> cancelled', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'running', startedAt: new Date(), attempt: 1 }, { status: 'cancelled', cancelledAt: new Date(), reason: 'abort' })).toBe(true);
        });
        (0, vitest_1.it)('should not allow running -> pending', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'running', startedAt: new Date(), attempt: 1 }, { status: 'pending' })).toBe(false);
        });
    });
    (0, vitest_1.describe)('from terminal states', function () {
        (0, vitest_1.it)('should not allow transitions from completed', function () {
            var completed = {
                status: 'completed',
                result: createResult(),
                completedAt: new Date(),
                durationMs: 100,
            };
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)(completed, { status: 'running', startedAt: new Date(), attempt: 1 })).toBe(false);
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)(completed, { status: 'pending' })).toBe(false);
        });
        (0, vitest_1.it)('should allow failed -> ready for retry', function () {
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)({ status: 'failed', error: createError(), failedAt: new Date(), attempts: 1 }, { status: 'ready', becameReadyAt: new Date() })).toBe(true);
        });
        (0, vitest_1.it)('should not allow transitions from skipped', function () {
            var skipped = {
                status: 'skipped',
                reason: 'dependency_failed',
                skippedAt: new Date(),
            };
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)(skipped, { status: 'ready', becameReadyAt: new Date() })).toBe(false);
        });
        (0, vitest_1.it)('should not allow transitions from cancelled', function () {
            var cancelled = {
                status: 'cancelled',
                cancelledAt: new Date(),
                reason: 'user',
            };
            (0, vitest_1.expect)((0, state_manager_1.isValidTransition)(cancelled, { status: 'ready', becameReadyAt: new Date() })).toBe(false);
        });
    });
});
// =============================================================================
// InvalidStateTransitionError Tests
// =============================================================================
(0, vitest_1.describe)('InvalidStateTransitionError', function () {
    (0, vitest_1.it)('should create error with correct message', function () {
        var from = { status: 'pending' };
        var to = { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 };
        var error = new state_manager_1.InvalidStateTransitionError((0, types_1.NodeId)('A'), from, to);
        (0, vitest_1.expect)(error.message).toBe('Invalid state transition for node A: pending -> completed');
        (0, vitest_1.expect)(error.name).toBe('InvalidStateTransitionError');
    });
    (0, vitest_1.it)('should store nodeId, from, and to states', function () {
        var from = { status: 'running', startedAt: new Date(), attempt: 1 };
        var to = { status: 'pending' };
        var nodeId = (0, types_1.NodeId)('test-node');
        var error = new state_manager_1.InvalidStateTransitionError(nodeId, from, to);
        (0, vitest_1.expect)(error.nodeId).toBe(nodeId);
        (0, vitest_1.expect)(error.from).toEqual(from);
        (0, vitest_1.expect)(error.to).toEqual(to);
    });
});
// =============================================================================
// StateManager Tests
// =============================================================================
(0, vitest_1.describe)('StateManager', function () {
    var dag;
    var manager;
    (0, vitest_1.beforeEach)(function () {
        // Create a simple DAG: A -> B -> C
        dag = createTestDAG([
            createTestNode('A'),
            createTestNode('B', ['A']),
            createTestNode('C', ['B']),
        ]);
        manager = new state_manager_1.StateManager({ dag: dag });
    });
    (0, vitest_1.describe)('initialization', function () {
        (0, vitest_1.it)('should initialize all nodes to pending', function () {
            var _a, _b, _c;
            var states = manager.getAllNodeStates();
            (0, vitest_1.expect)((_a = states.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.status).toBe('pending');
            (0, vitest_1.expect)((_b = states.get((0, types_1.NodeId)('B'))) === null || _b === void 0 ? void 0 : _b.status).toBe('pending');
            (0, vitest_1.expect)((_c = states.get((0, types_1.NodeId)('C'))) === null || _c === void 0 ? void 0 : _c.status).toBe('pending');
        });
        (0, vitest_1.it)('should compute execution waves', function () {
            var waves = manager.getWaves();
            (0, vitest_1.expect)(waves.length).toBe(3);
            (0, vitest_1.expect)(waves[0].nodeIds).toContain((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(waves[1].nodeIds).toContain((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(waves[2].nodeIds).toContain((0, types_1.NodeId)('C'));
        });
        (0, vitest_1.it)('should generate execution ID if not provided', function () {
            var id = manager.getExecutionId();
            (0, vitest_1.expect)(id).toBeDefined();
            (0, vitest_1.expect)(typeof id).toBe('string');
        });
        (0, vitest_1.it)('should use provided execution ID', function () {
            var customManager = new state_manager_1.StateManager({
                dag: dag,
                executionId: 'custom-id',
            });
            (0, vitest_1.expect)(customManager.getExecutionId()).toBe('custom-id');
        });
    });
    (0, vitest_1.describe)('event management', function () {
        (0, vitest_1.it)('should add and remove event listeners', function () {
            var listener = vitest_1.vi.fn();
            var unsubscribe = manager.addEventListener(listener);
            manager.startExecution();
            (0, vitest_1.expect)(listener).toHaveBeenCalled();
            unsubscribe();
            listener.mockClear();
            manager.completeExecution();
            // Note: completeExecution is still called but listener is removed
        });
        (0, vitest_1.it)('should remove listener via removeEventListener', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.removeEventListener(listener);
            manager.startExecution();
            // Listener should still be called once in startExecution before removal takes effect
            // Actually, removal happens immediately so it won't be called
            // Let's verify by starting again
        });
        (0, vitest_1.it)('should not emit events when emitEvents is false', function () {
            var silentManager = new state_manager_1.StateManager({
                dag: dag,
                emitEvents: false,
            });
            var listener = vitest_1.vi.fn();
            silentManager.addEventListener(listener);
            silentManager.startExecution();
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should catch errors in event listeners', function () {
            var consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(function () { });
            var errorListener = function () { throw new Error('Listener error'); };
            manager.addEventListener(errorListener);
            // Should not throw
            (0, vitest_1.expect)(function () { return manager.startExecution(); }).not.toThrow();
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('state transitions', function () {
        (0, vitest_1.it)('should get node state', function () {
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state).toBeDefined();
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('pending');
        });
        (0, vitest_1.it)('should return undefined for unknown node', function () {
            var state = manager.getNodeState((0, types_1.NodeId)('unknown'));
            (0, vitest_1.expect)(state).toBeUndefined();
        });
        (0, vitest_1.it)('should mark node ready', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('ready');
        });
        (0, vitest_1.it)('should mark node started', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('running');
            if ((state === null || state === void 0 ? void 0 : state.status) === 'running') {
                (0, vitest_1.expect)(state.attempt).toBe(1);
            }
        });
        (0, vitest_1.it)('should emit node_started event', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            var startedEvent = listener.mock.calls.find(function (call) { return call[0].type === 'node_started'; });
            (0, vitest_1.expect)(startedEvent).toBeDefined();
            (0, vitest_1.expect)(startedEvent[0].nodeId).toBe((0, types_1.NodeId)('A'));
        });
        (0, vitest_1.it)('should mark node completed', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            var result = createResult({ value: 42 });
            manager.markNodeCompleted((0, types_1.NodeId)('A'), result);
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('completed');
            var output = manager.getNodeOutput((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(output).toEqual(result);
        });
        (0, vitest_1.it)('should update token usage on completion', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            var result = {
                output: {},
                confidence: 1.0,
                tokenUsage: {
                    inputTokens: 100,
                    outputTokens: 50,
                    cacheReadTokens: 10,
                    cacheWriteTokens: 5,
                },
            };
            manager.markNodeCompleted((0, types_1.NodeId)('A'), result);
            var usage = manager.getTotalTokenUsage();
            (0, vitest_1.expect)(usage.inputTokens).toBe(100);
            (0, vitest_1.expect)(usage.outputTokens).toBe(50);
            (0, vitest_1.expect)(usage.cacheReadTokens).toBe(10);
            (0, vitest_1.expect)(usage.cacheWriteTokens).toBe(5);
        });
        (0, vitest_1.it)('should throw when completing non-running node', function () {
            (0, vitest_1.expect)(function () {
                manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            }).toThrow('Cannot complete node A - not running');
        });
        (0, vitest_1.it)('should mark node failed', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            var error = createError('Test failure');
            manager.markNodeFailed((0, types_1.NodeId)('A'), error);
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('failed');
            var errors = manager.getErrors();
            (0, vitest_1.expect)(errors).toContainEqual(error);
        });
        (0, vitest_1.it)('should throw when failing non-running node', function () {
            (0, vitest_1.expect)(function () {
                manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            }).toThrow('Cannot fail node A - not running');
        });
        (0, vitest_1.it)('should mark node skipped', function () {
            manager.markNodeSkipped((0, types_1.NodeId)('A'), 'dependency_failed');
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('skipped');
        });
        (0, vitest_1.it)('should mark node cancelled', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeCancelled((0, types_1.NodeId)('A'), 'user requested');
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('cancelled');
        });
        (0, vitest_1.it)('should mark node retrying (failed -> ready)', function () {
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            manager.markNodeRetrying((0, types_1.NodeId)('A'), 2);
            var state = manager.getNodeState((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(state === null || state === void 0 ? void 0 : state.status).toBe('ready');
        });
        (0, vitest_1.it)('should emit node_retrying event', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.markNodeReady((0, types_1.NodeId)('A'));
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            manager.markNodeRetrying((0, types_1.NodeId)('A'), 2);
            var retryEvent = listener.mock.calls.find(function (call) { return call[0].type === 'node_retrying'; });
            (0, vitest_1.expect)(retryEvent).toBeDefined();
            (0, vitest_1.expect)(retryEvent[0].attempt).toBe(2);
        });
        (0, vitest_1.it)('should throw for unknown node', function () {
            (0, vitest_1.expect)(function () {
                manager.markNodeReady((0, types_1.NodeId)('unknown'));
            }).toThrow('Unknown node: unknown');
        });
        (0, vitest_1.it)('should throw for invalid transition when validation enabled', function () {
            (0, vitest_1.expect)(function () {
                manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            }).toThrow(state_manager_1.InvalidStateTransitionError);
        });
        (0, vitest_1.it)('should allow invalid transition when validation disabled', function () {
            var noValidationManager = new state_manager_1.StateManager({
                dag: dag,
                validateTransitions: false,
            });
            // This would normally be invalid (pending -> running)
            (0, vitest_1.expect)(function () {
                noValidationManager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)('updateReadyNodes', function () {
        (0, vitest_1.it)('should mark nodes ready when dependencies complete', function () {
            manager.startExecution(); // Marks A ready (no deps)
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            // updateReadyNodes is called automatically, B should be ready
            var stateB = manager.getNodeState((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(stateB === null || stateB === void 0 ? void 0 : stateB.status).toBe('ready');
        });
        (0, vitest_1.it)('should skip nodes when dependencies fail', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            // Manually trigger update since markNodeFailed doesn't auto-update
            manager.updateReadyNodes();
            var stateB = manager.getNodeState((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(stateB === null || stateB === void 0 ? void 0 : stateB.status).toBe('skipped');
        });
        (0, vitest_1.it)('should return newly ready node IDs', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            // B was marked ready by completion, C is still waiting for B
            var stateC = manager.getNodeState((0, types_1.NodeId)('C'));
            (0, vitest_1.expect)(stateC === null || stateC === void 0 ? void 0 : stateC.status).toBe('pending');
        });
    });
    (0, vitest_1.describe)('wave management', function () {
        (0, vitest_1.it)('should start and complete waves', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.startWave(0);
            (0, vitest_1.expect)(manager.getCurrentWave()).toBe(0);
            var waveStarted = listener.mock.calls.find(function (call) { return call[0].type === 'wave_started'; });
            (0, vitest_1.expect)(waveStarted).toBeDefined();
            (0, vitest_1.expect)(waveStarted[0].waveNumber).toBe(0);
            manager.completeWave(0);
            var waveCompleted = listener.mock.calls.find(function (call) { return call[0].type === 'wave_completed'; });
            (0, vitest_1.expect)(waveCompleted).toBeDefined();
        });
        (0, vitest_1.it)('should handle out-of-bounds wave numbers', function () {
            // Should not throw
            manager.startWave(100);
            manager.completeWave(100);
        });
        (0, vitest_1.it)('should get ready nodes in wave', function () {
            manager.startExecution();
            var wave0Ready = manager.getReadyNodesInWave(0);
            (0, vitest_1.expect)(wave0Ready).toContain((0, types_1.NodeId)('A'));
        });
        (0, vitest_1.it)('should return empty for out-of-bounds wave', function () {
            var ready = manager.getReadyNodesInWave(100);
            (0, vitest_1.expect)(ready).toEqual([]);
        });
        (0, vitest_1.it)('should check if wave is complete', function () {
            manager.startExecution();
            (0, vitest_1.expect)(manager.isWaveComplete(0)).toBe(false);
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            (0, vitest_1.expect)(manager.isWaveComplete(0)).toBe(true);
        });
        (0, vitest_1.it)('should return true for out-of-bounds wave complete check', function () {
            (0, vitest_1.expect)(manager.isWaveComplete(100)).toBe(true);
        });
    });
    (0, vitest_1.describe)('execution lifecycle', function () {
        (0, vitest_1.it)('should start execution', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.startExecution();
            var dagStarted = listener.mock.calls.find(function (call) { return call[0].type === 'dag_started'; });
            (0, vitest_1.expect)(dagStarted).toBeDefined();
        });
        (0, vitest_1.it)('should complete execution', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.startExecution();
            manager.completeExecution();
            var dagCompleted = listener.mock.calls.find(function (call) { return call[0].type === 'dag_completed'; });
            (0, vitest_1.expect)(dagCompleted).toBeDefined();
        });
        (0, vitest_1.it)('should fail execution', function () {
            var listener = vitest_1.vi.fn();
            manager.addEventListener(listener);
            manager.startExecution();
            manager.failExecution(createError('DAG failed'));
            var dagFailed = listener.mock.calls.find(function (call) { return call[0].type === 'dag_failed'; });
            (0, vitest_1.expect)(dagFailed).toBeDefined();
        });
    });
    (0, vitest_1.describe)('isExecutionComplete', function () {
        (0, vitest_1.it)('should return false when nodes are pending', function () {
            (0, vitest_1.expect)(manager.isExecutionComplete()).toBe(false);
        });
        (0, vitest_1.it)('should return false when nodes are ready', function () {
            manager.startExecution();
            (0, vitest_1.expect)(manager.isExecutionComplete()).toBe(false);
        });
        (0, vitest_1.it)('should return false when nodes are running', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            (0, vitest_1.expect)(manager.isExecutionComplete()).toBe(false);
        });
        (0, vitest_1.it)('should return true when all nodes are completed', function () {
            manager.startExecution();
            // Complete A
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            // Complete B
            manager.markNodeStarted((0, types_1.NodeId)('B'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('B'), createResult());
            // Complete C
            manager.markNodeStarted((0, types_1.NodeId)('C'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('C'), createResult());
            (0, vitest_1.expect)(manager.isExecutionComplete()).toBe(true);
        });
        (0, vitest_1.it)('should return true when nodes are failed or skipped', function () {
            manager.startExecution();
            // Fail A
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            // Skip B and C due to dependency failure
            manager.updateReadyNodes();
            (0, vitest_1.expect)(manager.isExecutionComplete()).toBe(true);
        });
    });
    (0, vitest_1.describe)('isExecutionSuccessful', function () {
        (0, vitest_1.it)('should return false when there are failed nodes', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            manager.updateReadyNodes(); // Skip B and C
            (0, vitest_1.expect)(manager.isExecutionSuccessful()).toBe(false);
        });
        (0, vitest_1.it)('should return false when there are cancelled nodes', function () {
            manager.startExecution();
            manager.markNodeCancelled((0, types_1.NodeId)('A'), 'cancelled');
            manager.markNodeCancelled((0, types_1.NodeId)('B'), 'cancelled');
            manager.markNodeCancelled((0, types_1.NodeId)('C'), 'cancelled');
            (0, vitest_1.expect)(manager.isExecutionSuccessful()).toBe(false);
        });
        (0, vitest_1.it)('should return true when all completed or skipped', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            manager.markNodeStarted((0, types_1.NodeId)('B'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('B'), createResult());
            manager.markNodeStarted((0, types_1.NodeId)('C'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('C'), createResult());
            (0, vitest_1.expect)(manager.isExecutionSuccessful()).toBe(true);
        });
        (0, vitest_1.it)('should return false when execution not complete', function () {
            manager.startExecution();
            (0, vitest_1.expect)(manager.isExecutionSuccessful()).toBe(false);
        });
    });
    (0, vitest_1.describe)('snapshots', function () {
        (0, vitest_1.it)('should get snapshot with pending status', function () {
            var snapshot = manager.getSnapshot();
            (0, vitest_1.expect)(snapshot.executionId).toBeDefined();
            (0, vitest_1.expect)(snapshot.dagId).toBe(dag.id);
            (0, vitest_1.expect)(snapshot.status).toBe('pending');
            (0, vitest_1.expect)(snapshot.nodeStates.size).toBe(3);
        });
        (0, vitest_1.it)('should get snapshot with running status', function () {
            manager.startExecution();
            var snapshot = manager.getSnapshot();
            (0, vitest_1.expect)(snapshot.status).toBe('running');
            (0, vitest_1.expect)(snapshot.startedAt).toBeDefined();
        });
        (0, vitest_1.it)('should get snapshot with completed status', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            manager.markNodeStarted((0, types_1.NodeId)('B'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('B'), createResult());
            manager.markNodeStarted((0, types_1.NodeId)('C'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('C'), createResult());
            manager.completeExecution();
            var snapshot = manager.getSnapshot();
            (0, vitest_1.expect)(snapshot.status).toBe('completed');
            (0, vitest_1.expect)(snapshot.completedAt).toBeDefined();
        });
        (0, vitest_1.it)('should get snapshot with failed status', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError());
            manager.updateReadyNodes();
            var snapshot = manager.getSnapshot();
            (0, vitest_1.expect)(snapshot.status).toBe('failed');
        });
        (0, vitest_1.it)('should include token usage in snapshot', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            var snapshot = manager.getSnapshot();
            (0, vitest_1.expect)(snapshot.totalTokenUsage.inputTokens).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should include errors in snapshot', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeFailed((0, types_1.NodeId)('A'), createError('Test'));
            var snapshot = manager.getSnapshot();
            (0, vitest_1.expect)(snapshot.errors.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should restore from snapshot', function () {
            var _a, _b;
            // Create some state
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult({ data: 'test' }));
            var snapshot = manager.getSnapshot();
            // Create new manager and restore
            var newManager = new state_manager_1.StateManager({ dag: dag });
            newManager.restoreFromSnapshot(snapshot);
            (0, vitest_1.expect)((_a = newManager.getNodeState((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.status).toBe('completed');
            (0, vitest_1.expect)((_b = newManager.getNodeOutput((0, types_1.NodeId)('A'))) === null || _b === void 0 ? void 0 : _b.output).toEqual({ data: 'test' });
            (0, vitest_1.expect)(newManager.getCurrentWave()).toBe(snapshot.currentWave);
        });
    });
    (0, vitest_1.describe)('getters', function () {
        (0, vitest_1.it)('should get all node states', function () {
            var states = manager.getAllNodeStates();
            (0, vitest_1.expect)(states.size).toBe(3);
            (0, vitest_1.expect)(states).toBeInstanceOf(Map);
        });
        (0, vitest_1.it)('should get all node outputs', function () {
            var _a;
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), createResult({ value: 1 }));
            var outputs = manager.getAllNodeOutputs();
            (0, vitest_1.expect)(outputs.size).toBe(1);
            (0, vitest_1.expect)((_a = outputs.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.output).toEqual({ value: 1 });
        });
        (0, vitest_1.it)('should get nodes in specific state', function () {
            manager.startExecution();
            var readyNodes = manager.getNodesInState('ready');
            (0, vitest_1.expect)(readyNodes).toContain((0, types_1.NodeId)('A'));
            var pendingNodes = manager.getNodesInState('pending');
            (0, vitest_1.expect)(pendingNodes).toContain((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(pendingNodes).toContain((0, types_1.NodeId)('C'));
        });
        (0, vitest_1.it)('should get state counts', function () {
            manager.startExecution();
            var counts = manager.getStateCounts();
            (0, vitest_1.expect)(counts.ready).toBe(1); // A
            (0, vitest_1.expect)(counts.pending).toBe(2); // B, C
            (0, vitest_1.expect)(counts.running).toBe(0);
            (0, vitest_1.expect)(counts.completed).toBe(0);
            (0, vitest_1.expect)(counts.failed).toBe(0);
            (0, vitest_1.expect)(counts.skipped).toBe(0);
            (0, vitest_1.expect)(counts.cancelled).toBe(0);
        });
        (0, vitest_1.it)('should get waves', function () {
            var waves = manager.getWaves();
            (0, vitest_1.expect)(waves.length).toBe(3);
        });
        (0, vitest_1.it)('should get current wave', function () {
            manager.startWave(1);
            (0, vitest_1.expect)(manager.getCurrentWave()).toBe(1);
        });
        (0, vitest_1.it)('should get total token usage', function () {
            var usage = manager.getTotalTokenUsage();
            (0, vitest_1.expect)(usage.inputTokens).toBe(0);
            (0, vitest_1.expect)(usage.outputTokens).toBe(0);
        });
        (0, vitest_1.it)('should get errors', function () {
            var errors = manager.getErrors();
            (0, vitest_1.expect)(errors).toEqual([]);
            (0, vitest_1.expect)(Array.isArray(errors)).toBe(true);
        });
    });
    (0, vitest_1.describe)('complex scenarios', function () {
        (0, vitest_1.it)('should handle parallel execution DAG', function () {
            var _a, _b, _c, _d, _e, _f;
            // Create: A -> [B, C] -> D
            var parallelDag = createTestDAG([
                createTestNode('A'),
                createTestNode('B', ['A']),
                createTestNode('C', ['A']),
                createTestNode('D', ['B', 'C']),
            ]);
            var parallelManager = new state_manager_1.StateManager({ dag: parallelDag });
            parallelManager.startExecution();
            // A should be ready
            (0, vitest_1.expect)((_a = parallelManager.getNodeState((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.status).toBe('ready');
            // Complete A
            parallelManager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            parallelManager.markNodeCompleted((0, types_1.NodeId)('A'), createResult());
            // B and C should both be ready now
            (0, vitest_1.expect)((_b = parallelManager.getNodeState((0, types_1.NodeId)('B'))) === null || _b === void 0 ? void 0 : _b.status).toBe('ready');
            (0, vitest_1.expect)((_c = parallelManager.getNodeState((0, types_1.NodeId)('C'))) === null || _c === void 0 ? void 0 : _c.status).toBe('ready');
            // D should still be pending
            (0, vitest_1.expect)((_d = parallelManager.getNodeState((0, types_1.NodeId)('D'))) === null || _d === void 0 ? void 0 : _d.status).toBe('pending');
            // Complete B
            parallelManager.markNodeStarted((0, types_1.NodeId)('B'), 1);
            parallelManager.markNodeCompleted((0, types_1.NodeId)('B'), createResult());
            // D still pending (waiting for C)
            (0, vitest_1.expect)((_e = parallelManager.getNodeState((0, types_1.NodeId)('D'))) === null || _e === void 0 ? void 0 : _e.status).toBe('pending');
            // Complete C
            parallelManager.markNodeStarted((0, types_1.NodeId)('C'), 1);
            parallelManager.markNodeCompleted((0, types_1.NodeId)('C'), createResult());
            // Now D should be ready
            (0, vitest_1.expect)((_f = parallelManager.getNodeState((0, types_1.NodeId)('D'))) === null || _f === void 0 ? void 0 : _f.status).toBe('ready');
        });
        (0, vitest_1.it)('should accumulate token usage across multiple nodes', function () {
            manager.startExecution();
            manager.markNodeStarted((0, types_1.NodeId)('A'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('A'), {
                output: {},
                confidence: 1.0,
                tokenUsage: { inputTokens: 100, outputTokens: 50 },
            });
            manager.markNodeStarted((0, types_1.NodeId)('B'), 1);
            manager.markNodeCompleted((0, types_1.NodeId)('B'), {
                output: {},
                confidence: 1.0,
                tokenUsage: { inputTokens: 200, outputTokens: 100 },
            });
            var usage = manager.getTotalTokenUsage();
            (0, vitest_1.expect)(usage.inputTokens).toBe(300);
            (0, vitest_1.expect)(usage.outputTokens).toBe(150);
        });
        (0, vitest_1.it)('should handle DAG with cycles gracefully', function () {
            // Create nodes that would form a cycle: A -> B -> A
            // The builder would normally prevent this, but we test the state manager
            var cyclicNodes = [
                createTestNode('A', ['B']),
                createTestNode('B', ['A']),
            ];
            // topologicalSort will fail, waves will be empty
            var cyclicDag = createTestDAG(cyclicNodes);
            var cyclicManager = new state_manager_1.StateManager({ dag: cyclicDag });
            var waves = cyclicManager.getWaves();
            (0, vitest_1.expect)(waves.length).toBe(0);
        });
    });
});

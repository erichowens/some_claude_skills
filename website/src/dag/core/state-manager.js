"use strict";
/**
 * DAG State Manager
 *
 * Manages state transitions for DAG nodes during execution.
 * Enforces valid state transitions and emits events.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = exports.InvalidStateTransitionError = void 0;
exports.isValidTransition = isValidTransition;
var types_1 = require("../types");
var topology_1 = require("./topology");
// =============================================================================
// State Transition Validation
// =============================================================================
/**
 * Valid state transitions for a task.
 * Key is source state, value is array of allowed target states.
 */
var VALID_TRANSITIONS = {
    pending: ['ready', 'skipped', 'cancelled'],
    ready: ['running', 'skipped', 'cancelled'],
    running: ['completed', 'failed', 'cancelled'],
    completed: [], // Terminal state
    failed: ['ready'], // Can retry (back to ready)
    skipped: [], // Terminal state
    cancelled: [], // Terminal state
};
/**
 * Checks if a state transition is valid.
 */
function isValidTransition(from, to) {
    var fromStatus = from.status;
    var toStatus = to.status;
    var allowed = VALID_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
}
/**
 * Error thrown when an invalid state transition is attempted.
 */
var InvalidStateTransitionError = /** @class */ (function (_super) {
    __extends(InvalidStateTransitionError, _super);
    function InvalidStateTransitionError(nodeId, from, to) {
        var _this = _super.call(this, "Invalid state transition for node ".concat(nodeId, ": ").concat(from.status, " -> ").concat(to.status)) || this;
        _this.nodeId = nodeId;
        _this.from = from;
        _this.to = to;
        _this.name = 'InvalidStateTransitionError';
        return _this;
    }
    return InvalidStateTransitionError;
}(Error));
exports.InvalidStateTransitionError = InvalidStateTransitionError;
/**
 * Manages state for DAG execution.
 * Handles state transitions, event emission, and snapshot management.
 */
var StateManager = /** @class */ (function () {
    function StateManager(options) {
        var _a, _b;
        this.dag = options.dag;
        this.executionId = options.executionId || (0, types_1.ExecutionId)(crypto.randomUUID());
        this.validateTransitions = (_a = options.validateTransitions) !== null && _a !== void 0 ? _a : true;
        this.emitEvents = (_b = options.emitEvents) !== null && _b !== void 0 ? _b : true;
        this.nodeStates = new Map();
        this.nodeOutputs = new Map();
        this.waves = [];
        this.currentWave = 0;
        this.totalTokenUsage = { inputTokens: 0, outputTokens: 0 };
        this.errors = [];
        this.listeners = new Set();
        this.initialize();
    }
    /**
     * Initialize state for all nodes.
     */
    StateManager.prototype.initialize = function () {
        // Set all nodes to pending
        for (var _i = 0, _a = this.dag.nodes; _i < _a.length; _i++) {
            var nodeId = _a[_i][0];
            this.nodeStates.set(nodeId, { status: 'pending' });
        }
        // Compute execution waves
        var sortResult = (0, topology_1.topologicalSort)(this.dag);
        if (sortResult.success) {
            this.waves = sortResult.waves;
        }
    };
    // ===========================================================================
    // Event Management
    // ===========================================================================
    /**
     * Subscribe to execution events.
     */
    StateManager.prototype.addEventListener = function (listener) {
        var _this = this;
        this.listeners.add(listener);
        return function () { return _this.listeners.delete(listener); };
    };
    /**
     * Remove event listener.
     */
    StateManager.prototype.removeEventListener = function (listener) {
        this.listeners.delete(listener);
    };
    /**
     * Emit an event to all listeners.
     */
    StateManager.prototype.emit = function (event) {
        if (!this.emitEvents)
            return;
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            try {
                listener(event);
            }
            catch (error) {
                console.error('Event listener error:', error);
            }
        }
    };
    // ===========================================================================
    // State Transitions
    // ===========================================================================
    /**
     * Get current state of a node.
     */
    StateManager.prototype.getNodeState = function (nodeId) {
        return this.nodeStates.get(nodeId);
    };
    /**
     * Get output of a completed node.
     */
    StateManager.prototype.getNodeOutput = function (nodeId) {
        return this.nodeOutputs.get(nodeId);
    };
    /**
     * Transition a node to a new state.
     */
    StateManager.prototype.transitionNode = function (nodeId, newState) {
        var currentState = this.nodeStates.get(nodeId);
        if (!currentState) {
            throw new Error("Unknown node: ".concat(nodeId));
        }
        if (this.validateTransitions && !isValidTransition(currentState, newState)) {
            throw new InvalidStateTransitionError(nodeId, currentState, newState);
        }
        this.nodeStates.set(nodeId, newState);
    };
    /**
     * Mark execution as started.
     */
    StateManager.prototype.startExecution = function () {
        this.startedAt = new Date();
        this.emit({
            type: 'dag_started',
            dagId: this.dag.id,
            executionId: this.executionId,
            timestamp: this.startedAt,
        });
        // Mark ready nodes
        this.updateReadyNodes();
    };
    /**
     * Mark a node as ready for execution.
     */
    StateManager.prototype.markNodeReady = function (nodeId) {
        this.transitionNode(nodeId, {
            status: 'ready',
            becameReadyAt: new Date(),
        });
    };
    /**
     * Mark a node as started.
     */
    StateManager.prototype.markNodeStarted = function (nodeId, attempt) {
        if (attempt === void 0) { attempt = 1; }
        var timestamp = new Date();
        this.transitionNode(nodeId, {
            status: 'running',
            startedAt: timestamp,
            attempt: attempt,
        });
        this.emit({
            type: 'node_started',
            nodeId: nodeId,
            timestamp: timestamp,
        });
    };
    /**
     * Mark a node as completed successfully.
     */
    StateManager.prototype.markNodeCompleted = function (nodeId, result) {
        var state = this.nodeStates.get(nodeId);
        if (!state || state.status !== 'running') {
            throw new Error("Cannot complete node ".concat(nodeId, " - not running"));
        }
        var startedAt = state.startedAt;
        var completedAt = new Date();
        var durationMs = completedAt.getTime() - startedAt.getTime();
        this.transitionNode(nodeId, {
            status: 'completed',
            result: result,
            completedAt: completedAt,
            durationMs: durationMs,
        });
        this.nodeOutputs.set(nodeId, result);
        // Update token usage
        if (result.tokenUsage) {
            this.totalTokenUsage.inputTokens += result.tokenUsage.inputTokens;
            this.totalTokenUsage.outputTokens += result.tokenUsage.outputTokens;
            if (result.tokenUsage.cacheReadTokens) {
                this.totalTokenUsage.cacheReadTokens =
                    (this.totalTokenUsage.cacheReadTokens || 0) + result.tokenUsage.cacheReadTokens;
            }
            if (result.tokenUsage.cacheWriteTokens) {
                this.totalTokenUsage.cacheWriteTokens =
                    (this.totalTokenUsage.cacheWriteTokens || 0) + result.tokenUsage.cacheWriteTokens;
            }
        }
        this.emit({
            type: 'node_completed',
            nodeId: nodeId,
            timestamp: completedAt,
            result: result,
        });
        // Update ready nodes (dependents may now be ready)
        this.updateReadyNodes();
    };
    /**
     * Mark a node as failed.
     */
    StateManager.prototype.markNodeFailed = function (nodeId, error) {
        var state = this.nodeStates.get(nodeId);
        if (!state || state.status !== 'running') {
            throw new Error("Cannot fail node ".concat(nodeId, " - not running"));
        }
        var failedAt = new Date();
        var attempts = state.attempt;
        this.transitionNode(nodeId, {
            status: 'failed',
            error: error,
            failedAt: failedAt,
            attempts: attempts,
        });
        this.errors.push(error);
        this.emit({
            type: 'node_failed',
            nodeId: nodeId,
            timestamp: failedAt,
            error: error,
        });
        // Update ready nodes (dependents should be skipped)
        this.updateReadyNodes();
    };
    /**
     * Mark a node as skipped.
     */
    StateManager.prototype.markNodeSkipped = function (nodeId, reason) {
        var skippedAt = new Date();
        this.transitionNode(nodeId, {
            status: 'skipped',
            reason: reason,
            skippedAt: skippedAt,
        });
        this.emit({
            type: 'node_skipped',
            nodeId: nodeId,
            timestamp: skippedAt,
            reason: reason,
        });
    };
    /**
     * Mark a node as cancelled.
     */
    StateManager.prototype.markNodeCancelled = function (nodeId, reason) {
        this.transitionNode(nodeId, {
            status: 'cancelled',
            cancelledAt: new Date(),
            reason: reason,
        });
    };
    /**
     * Mark a node for retry (back to ready state).
     */
    StateManager.prototype.markNodeRetrying = function (nodeId, nextAttempt) {
        var timestamp = new Date();
        this.transitionNode(nodeId, {
            status: 'ready',
            becameReadyAt: timestamp,
        });
        this.emit({
            type: 'node_retrying',
            nodeId: nodeId,
            timestamp: timestamp,
            attempt: nextAttempt,
        });
    };
    /**
     * Update all nodes that should be marked ready.
     * A node is ready when all dependencies are completed.
     */
    StateManager.prototype.updateReadyNodes = function () {
        var _this = this;
        var newlyReady = [];
        for (var _i = 0, _a = this.dag.nodes; _i < _a.length; _i++) {
            var _b = _a[_i], nodeId = _b[0], node = _b[1];
            var state = this.nodeStates.get(nodeId);
            if (!state || state.status !== 'pending')
                continue;
            var allDepsCompleted = node.dependencies.every(function (depId) {
                var depState = _this.nodeStates.get(depId);
                return (depState === null || depState === void 0 ? void 0 : depState.status) === 'completed';
            });
            var anyDepFailed = node.dependencies.some(function (depId) {
                var depState = _this.nodeStates.get(depId);
                return (depState === null || depState === void 0 ? void 0 : depState.status) === 'failed' || (depState === null || depState === void 0 ? void 0 : depState.status) === 'skipped';
            });
            if (anyDepFailed) {
                this.markNodeSkipped(nodeId, 'dependency_failed');
            }
            else if (allDepsCompleted) {
                this.markNodeReady(nodeId);
                newlyReady.push(nodeId);
            }
        }
        return newlyReady;
    };
    // ===========================================================================
    // Wave Management
    // ===========================================================================
    /**
     * Start a new wave of execution.
     */
    StateManager.prototype.startWave = function (waveNumber) {
        if (waveNumber >= this.waves.length)
            return;
        var wave = this.waves[waveNumber];
        wave.status = 'running';
        wave.startedAt = new Date();
        this.currentWave = waveNumber;
        this.emit({
            type: 'wave_started',
            waveNumber: waveNumber,
            nodeIds: wave.nodeIds,
            timestamp: wave.startedAt,
        });
    };
    /**
     * Complete a wave of execution.
     */
    StateManager.prototype.completeWave = function (waveNumber) {
        if (waveNumber >= this.waves.length)
            return;
        var wave = this.waves[waveNumber];
        wave.status = 'completed';
        wave.completedAt = new Date();
        var durationMs = wave.startedAt
            ? wave.completedAt.getTime() - wave.startedAt.getTime()
            : 0;
        this.emit({
            type: 'wave_completed',
            waveNumber: waveNumber,
            timestamp: wave.completedAt,
            durationMs: durationMs,
        });
    };
    /**
     * Get nodes ready for execution in a specific wave.
     */
    StateManager.prototype.getReadyNodesInWave = function (waveNumber) {
        var _this = this;
        if (waveNumber >= this.waves.length)
            return [];
        var wave = this.waves[waveNumber];
        return wave.nodeIds.filter(function (nodeId) {
            var state = _this.nodeStates.get(nodeId);
            return (state === null || state === void 0 ? void 0 : state.status) === 'ready';
        });
    };
    /**
     * Check if a wave is complete (all nodes finished).
     */
    StateManager.prototype.isWaveComplete = function (waveNumber) {
        var _this = this;
        if (waveNumber >= this.waves.length)
            return true;
        var wave = this.waves[waveNumber];
        return wave.nodeIds.every(function (nodeId) {
            var state = _this.nodeStates.get(nodeId);
            return ((state === null || state === void 0 ? void 0 : state.status) === 'completed' ||
                (state === null || state === void 0 ? void 0 : state.status) === 'failed' ||
                (state === null || state === void 0 ? void 0 : state.status) === 'skipped' ||
                (state === null || state === void 0 ? void 0 : state.status) === 'cancelled');
        });
    };
    // ===========================================================================
    // Execution Completion
    // ===========================================================================
    /**
     * Mark entire execution as completed.
     */
    StateManager.prototype.completeExecution = function () {
        this.completedAt = new Date();
        var durationMs = this.startedAt
            ? this.completedAt.getTime() - this.startedAt.getTime()
            : 0;
        this.emit({
            type: 'dag_completed',
            dagId: this.dag.id,
            executionId: this.executionId,
            timestamp: this.completedAt,
            durationMs: durationMs,
        });
    };
    /**
     * Mark execution as failed.
     */
    StateManager.prototype.failExecution = function (error) {
        this.completedAt = new Date();
        this.emit({
            type: 'dag_failed',
            dagId: this.dag.id,
            executionId: this.executionId,
            timestamp: this.completedAt,
            error: error,
        });
    };
    /**
     * Check if execution is complete (all nodes finished).
     */
    StateManager.prototype.isExecutionComplete = function () {
        for (var _i = 0, _a = this.nodeStates; _i < _a.length; _i++) {
            var _b = _a[_i], state = _b[1];
            if (state.status === 'pending' ||
                state.status === 'ready' ||
                state.status === 'running') {
                return false;
            }
        }
        return true;
    };
    /**
     * Check if execution was successful (all nodes completed or skipped).
     */
    StateManager.prototype.isExecutionSuccessful = function () {
        for (var _i = 0, _a = this.nodeStates; _i < _a.length; _i++) {
            var _b = _a[_i], state = _b[1];
            if (state.status === 'failed' || state.status === 'cancelled') {
                return false;
            }
        }
        return this.isExecutionComplete();
    };
    // ===========================================================================
    // Snapshots
    // ===========================================================================
    /**
     * Get a snapshot of current execution state.
     */
    StateManager.prototype.getSnapshot = function () {
        var status = this.isExecutionComplete()
            ? this.isExecutionSuccessful()
                ? 'completed'
                : 'failed'
            : this.startedAt
                ? 'running'
                : 'pending';
        return {
            executionId: this.executionId,
            dagId: this.dag.id,
            nodeStates: new Map(this.nodeStates),
            nodeOutputs: new Map(this.nodeOutputs),
            currentWave: this.currentWave,
            totalWaves: this.waves.length,
            status: status,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            totalTokenUsage: __assign({}, this.totalTokenUsage),
            errors: __spreadArray([], this.errors, true),
        };
    };
    /**
     * Restore state from a snapshot (for resumption).
     */
    StateManager.prototype.restoreFromSnapshot = function (snapshot) {
        this.nodeStates = new Map(snapshot.nodeStates);
        this.nodeOutputs = new Map(snapshot.nodeOutputs);
        this.currentWave = snapshot.currentWave;
        this.startedAt = snapshot.startedAt;
        this.completedAt = snapshot.completedAt;
        this.totalTokenUsage = __assign({}, snapshot.totalTokenUsage);
        this.errors = __spreadArray([], snapshot.errors, true);
    };
    // ===========================================================================
    // Getters
    // ===========================================================================
    StateManager.prototype.getExecutionId = function () {
        return this.executionId;
    };
    StateManager.prototype.getWaves = function () {
        return this.waves;
    };
    StateManager.prototype.getCurrentWave = function () {
        return this.currentWave;
    };
    StateManager.prototype.getTotalTokenUsage = function () {
        return __assign({}, this.totalTokenUsage);
    };
    StateManager.prototype.getErrors = function () {
        return __spreadArray([], this.errors, true);
    };
    StateManager.prototype.getAllNodeStates = function () {
        return new Map(this.nodeStates);
    };
    StateManager.prototype.getAllNodeOutputs = function () {
        return new Map(this.nodeOutputs);
    };
    /**
     * Get all nodes in a particular state.
     */
    StateManager.prototype.getNodesInState = function (status) {
        var nodes = [];
        for (var _i = 0, _a = this.nodeStates; _i < _a.length; _i++) {
            var _b = _a[_i], nodeId = _b[0], state = _b[1];
            if (state.status === status) {
                nodes.push(nodeId);
            }
        }
        return nodes;
    };
    /**
     * Get count of nodes by state.
     */
    StateManager.prototype.getStateCounts = function () {
        var counts = {
            pending: 0,
            ready: 0,
            running: 0,
            completed: 0,
            failed: 0,
            skipped: 0,
            cancelled: 0,
        };
        for (var _i = 0, _a = this.nodeStates; _i < _a.length; _i++) {
            var _b = _a[_i], state = _b[1];
            counts[state.status]++;
        }
        return counts;
    };
    return StateManager;
}());
exports.StateManager = StateManager;

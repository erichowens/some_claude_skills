"use strict";
/**
 * DAG Executor
 *
 * Executes DAGs using wave-based parallel execution.
 * Integrates with the state manager and supports multiple runtimes.
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.NoOpExecutor = exports.DAGExecutor = void 0;
exports.executeDAG = executeDAG;
var types_1 = require("../types");
var topology_1 = require("./topology");
var state_manager_1 = require("./state-manager");
// =============================================================================
// DAG Executor
// =============================================================================
/**
 * Executes DAGs using wave-based parallel execution.
 */
var DAGExecutor = /** @class */ (function () {
    function DAGExecutor(dag, options) {
        var _this = this;
        // Validate DAG
        var validationErrors = (0, topology_1.validateDAG)(dag);
        if (validationErrors.length > 0) {
            throw new Error("Invalid DAG: ".concat(validationErrors.map(function (e) { return e.message; }).join(', ')));
        }
        this.dag = dag;
        this.config = __assign(__assign(__assign({}, types_1.DEFAULT_DAG_CONFIG), dag.config), options.configOverrides);
        this.executors = options.executors;
        this.input = options.input;
        this.onProgress = options.onProgress;
        // Set up abort handling
        this.abortController = new AbortController();
        if (options.abortSignal) {
            options.abortSignal.addEventListener('abort', function () {
                _this.abortController.abort();
            });
        }
        // Initialize state manager
        this.stateManager = new state_manager_1.StateManager({
            dag: dag,
            validateTransitions: true,
            emitEvents: true,
        });
        // Forward events
        if (options.onEvent) {
            this.stateManager.addEventListener(options.onEvent);
        }
    }
    /**
     * Execute the DAG.
     */
    DAGExecutor.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sortResult, outputs, error_1, taskError;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.startTime = new Date();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        // Check abort before starting
                        if (this.abortController.signal.aborted) {
                            throw this.createError('INTERNAL_ERROR', 'Execution aborted before start');
                        }
                        // Start execution
                        this.stateManager.startExecution();
                        sortResult = (0, topology_1.topologicalSort)(this.dag);
                        if (!sortResult.success) {
                            throw this.createError('CYCLE_DETECTED', "Cycle detected in DAG: ".concat((_a = sortResult.cycle) === null || _a === void 0 ? void 0 : _a.join(' -> ')));
                        }
                        // Execute waves
                        return [4 /*yield*/, this.executeWaves(sortResult.waves.length)];
                    case 2:
                        // Execute waves
                        _b.sent();
                        // Complete execution
                        this.stateManager.completeExecution();
                        outputs = this.buildOutputs();
                        this.endTime = new Date();
                        return [2 /*return*/, {
                                success: this.stateManager.isExecutionSuccessful(),
                                snapshot: this.stateManager.getSnapshot(),
                                outputs: outputs,
                                totalTokenUsage: this.stateManager.getTotalTokenUsage(),
                                totalTimeMs: this.endTime.getTime() - this.startTime.getTime(),
                                errors: this.stateManager.getErrors(),
                            }];
                    case 3:
                        error_1 = _b.sent();
                        this.endTime = new Date();
                        taskError = this.toTaskError(error_1);
                        this.stateManager.failExecution(taskError);
                        return [2 /*return*/, {
                                success: false,
                                snapshot: this.stateManager.getSnapshot(),
                                outputs: new Map(),
                                totalTokenUsage: this.stateManager.getTotalTokenUsage(),
                                totalTimeMs: this.endTime.getTime() - this.startTime.getTime(),
                                errors: __spreadArray(__spreadArray([], this.stateManager.getErrors(), true), [taskError], false),
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute all waves sequentially.
     */
    DAGExecutor.prototype.executeWaves = function (totalWaves) {
        return __awaiter(this, void 0, void 0, function () {
            var waveNum, readyNodes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        waveNum = 0;
                        _a.label = 1;
                    case 1:
                        if (!(waveNum < totalWaves)) return [3 /*break*/, 4];
                        // Check for abort
                        if (this.abortController.signal.aborted) {
                            throw this.createError('INTERNAL_ERROR', 'Execution aborted');
                        }
                        // Check for timeout
                        if (this.isTimedOut()) {
                            throw this.createError('TIMEOUT', 'DAG execution timed out');
                        }
                        // Start wave
                        this.stateManager.startWave(waveNum);
                        readyNodes = this.stateManager.getReadyNodesInWave(waveNum);
                        if (readyNodes.length === 0) {
                            // All nodes in this wave were skipped
                            this.stateManager.completeWave(waveNum);
                            return [3 /*break*/, 3];
                        }
                        // Execute nodes in parallel (respecting maxParallelism)
                        return [4 /*yield*/, this.executeNodesInParallel(readyNodes)];
                    case 2:
                        // Execute nodes in parallel (respecting maxParallelism)
                        _a.sent();
                        // Complete wave
                        this.stateManager.completeWave(waveNum);
                        // Update ready nodes for next wave (marks skipped if dependencies failed)
                        this.stateManager.updateReadyNodes();
                        // Report progress
                        this.reportProgress();
                        // Check for fail-fast
                        if (this.config.failFast && this.stateManager.getErrors().length > 0) {
                            throw this.createError('INTERNAL_ERROR', 'Fail-fast triggered');
                        }
                        _a.label = 3;
                    case 3:
                        waveNum++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute multiple nodes in parallel.
     */
    DAGExecutor.prototype.executeNodesInParallel = function (nodeIds) {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, _i, chunks_1, chunk, promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chunks = this.chunkArray(nodeIds, this.config.maxParallelism);
                        _i = 0, chunks_1 = chunks;
                        _a.label = 1;
                    case 1:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 4];
                        chunk = chunks_1[_i];
                        if (this.abortController.signal.aborted) {
                            throw this.createError('INTERNAL_ERROR', 'Execution aborted');
                        }
                        promises = chunk.map(function (nodeId) { return _this.executeNode(nodeId); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a single node with retry logic.
     */
    DAGExecutor.prototype.executeNode = function (nodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var node, retryPolicy, attempt, lastError, executor, context, result, error_2, delay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        node = this.dag.nodes.get(nodeId);
                        if (!node) {
                            throw this.createError('INTERNAL_ERROR', "Node not found: ".concat(nodeId));
                        }
                        retryPolicy = node.retryPolicy || this.config.defaultRetryPolicy;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < retryPolicy.maxAttempts)) return [3 /*break*/, 7];
                        attempt++;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        // Mark as started
                        this.stateManager.markNodeStarted(nodeId, attempt);
                        executor = this.findExecutor(node);
                        if (!executor) {
                            throw this.createError('INTERNAL_ERROR', "No executor found for node type: ".concat(node.type));
                        }
                        context = this.buildExecutionContext(node);
                        return [4 /*yield*/, this.executeWithTimeout(executor.execute(context), node.config.timeoutMs)];
                    case 3:
                        result = _a.sent();
                        // Mark as completed
                        this.stateManager.markNodeCompleted(nodeId, result);
                        return [2 /*return*/];
                    case 4:
                        error_2 = _a.sent();
                        lastError = this.toTaskError(error_2);
                        // Check if retryable
                        if (!lastError.retryable ||
                            retryPolicy.nonRetryableErrors.includes(lastError.code) ||
                            attempt >= retryPolicy.maxAttempts) {
                            return [3 /*break*/, 7];
                        }
                        // Mark as failed first (running -> failed)
                        this.stateManager.markNodeFailed(nodeId, lastError);
                        delay = this.calculateRetryDelay(attempt, retryPolicy);
                        return [4 /*yield*/, this.sleep(delay)];
                    case 5:
                        _a.sent();
                        // Mark for retry (failed -> ready)
                        this.stateManager.markNodeRetrying(nodeId, attempt + 1);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7:
                        // Mark as failed
                        this.stateManager.markNodeFailed(nodeId, lastError);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find an executor that can handle a node.
     */
    DAGExecutor.prototype.findExecutor = function (node) {
        return this.executors.find(function (e) { return e.canExecute(node); });
    };
    /**
     * Build execution context for a node.
     */
    DAGExecutor.prototype.buildExecutionContext = function (node) {
        // Gather dependency outputs
        var dependencyOutputs = new Map();
        for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
            var depId = _a[_i];
            var output = this.stateManager.getNodeOutput(depId);
            if (output) {
                dependencyOutputs.set(depId, output);
            }
        }
        return {
            dag: this.dag,
            node: node,
            executionId: this.stateManager.getExecutionId(),
            dependencyOutputs: dependencyOutputs,
            dagInput: this.input,
            abortSignal: this.abortController.signal,
        };
    };
    /**
     * Execute a promise with timeout.
     */
    DAGExecutor.prototype.executeWithTimeout = function (promise, timeoutMs) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.race([
                        promise,
                        new Promise(function (_, reject) {
                            setTimeout(function () {
                                reject(_this.createError('TIMEOUT', "Node execution timed out after ".concat(timeoutMs, "ms")));
                            }, timeoutMs);
                        }),
                    ])];
            });
        });
    };
    /**
     * Calculate retry delay with exponential backoff.
     */
    DAGExecutor.prototype.calculateRetryDelay = function (attempt, policy) {
        var delay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
        return Math.min(delay, policy.maxDelayMs);
    };
    /**
     * Build DAG outputs from completed nodes.
     */
    DAGExecutor.prototype.buildOutputs = function () {
        var outputs = new Map();
        for (var _i = 0, _a = this.dag.outputs; _i < _a.length; _i++) {
            var dagOutput = _a[_i];
            var nodeResult = this.stateManager.getNodeOutput(dagOutput.sourceNodeId);
            if (nodeResult) {
                var value = nodeResult.output;
                // Apply output path if specified
                if (dagOutput.outputPath) {
                    value = this.extractPath(value, dagOutput.outputPath);
                }
                outputs.set(dagOutput.name, value);
            }
        }
        return outputs;
    };
    /**
     * Extract a value from an object using a path.
     */
    DAGExecutor.prototype.extractPath = function (obj, path) {
        var parts = path.split('.');
        var current = obj;
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }
        return current;
    };
    /**
     * Check if execution has timed out.
     */
    DAGExecutor.prototype.isTimedOut = function () {
        if (!this.startTime)
            return false;
        var elapsed = Date.now() - this.startTime.getTime();
        return elapsed > this.config.maxExecutionTimeMs;
    };
    /**
     * Report progress via callback.
     */
    DAGExecutor.prototype.reportProgress = function () {
        if (this.onProgress) {
            this.onProgress(this.stateManager.getSnapshot());
        }
    };
    /**
     * Create a TaskError.
     */
    DAGExecutor.prototype.createError = function (code, message) {
        var retryable = ['TIMEOUT', 'RATE_LIMITED', 'MODEL_ERROR'].includes(code);
        return { code: code, message: message, retryable: retryable };
    };
    /**
     * Convert an error to TaskError.
     */
    DAGExecutor.prototype.toTaskError = function (error) {
        if (this.isTaskError(error)) {
            return error;
        }
        if (error instanceof Error) {
            return {
                code: 'UNKNOWN_ERROR',
                message: error.message,
                stack: error.stack,
                retryable: false,
                cause: error,
            };
        }
        return {
            code: 'UNKNOWN_ERROR',
            message: String(error),
            retryable: false,
        };
    };
    /**
     * Type guard for TaskError.
     */
    DAGExecutor.prototype.isTaskError = function (error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            'message' in error &&
            'retryable' in error);
    };
    /**
     * Split array into chunks.
     */
    DAGExecutor.prototype.chunkArray = function (array, size) {
        var chunks = [];
        for (var i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };
    /**
     * Sleep for a duration.
     */
    DAGExecutor.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    // ===========================================================================
    // Public Getters
    // ===========================================================================
    /**
     * Get current execution snapshot.
     */
    DAGExecutor.prototype.getSnapshot = function () {
        return this.stateManager.getSnapshot();
    };
    /**
     * Get execution ID.
     */
    DAGExecutor.prototype.getExecutionId = function () {
        return this.stateManager.getExecutionId();
    };
    /**
     * Cancel execution.
     */
    DAGExecutor.prototype.cancel = function () {
        this.abortController.abort();
    };
    return DAGExecutor;
}());
exports.DAGExecutor = DAGExecutor;
// =============================================================================
// Default Node Executor (Stub)
// =============================================================================
/**
 * A no-op executor for testing.
 * Real executors are implemented in the runtimes module.
 */
var NoOpExecutor = /** @class */ (function () {
    function NoOpExecutor() {
    }
    NoOpExecutor.prototype.execute = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate some work
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        // Simulate some work
                        _a.sent();
                        return [2 /*return*/, {
                                output: {
                                    nodeId: context.node.id,
                                    nodeName: context.node.name,
                                    executed: true,
                                    timestamp: new Date().toISOString(),
                                },
                                confidence: 1.0,
                                tokenUsage: {
                                    inputTokens: 0,
                                    outputTokens: 0,
                                },
                            }];
                }
            });
        });
    };
    NoOpExecutor.prototype.canExecute = function (_node) {
        return true;
    };
    return NoOpExecutor;
}());
exports.NoOpExecutor = NoOpExecutor;
// =============================================================================
// Convenience Functions
// =============================================================================
/**
 * Execute a DAG with default options.
 */
function executeDAG(dag, options) {
    return __awaiter(this, void 0, void 0, function () {
        var executor;
        return __generator(this, function (_a) {
            executor = new DAGExecutor(dag, __assign({ executors: (options === null || options === void 0 ? void 0 : options.executors) || [new NoOpExecutor()] }, options));
            return [2 /*return*/, executor.execute()];
        });
    });
}

"use strict";
/**
 * DAG Executor Tests
 *
 * Comprehensive test suite for the DAG execution engine.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var executor_1 = require("./executor");
var builder_1 = require("./builder");
// =============================================================================
// Test Utilities
// =============================================================================
/**
 * Create a mock executor that records calls and returns custom results
 */
function createMockExecutor(options) {
    if (options === void 0) { options = {}; }
    var calls = [];
    var _a = options.delay, delay = _a === void 0 ? 10 : _a, results = options.results, errors = options.errors, _b = options.canExecuteTypes, canExecuteTypes = _b === void 0 ? ['skill', 'agent', 'mcp-tool', 'composite', 'conditional'] : _b;
    return {
        calls: calls,
        execute: function (context) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            calls.push(context);
                            // Simulate some async work
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                        case 1:
                            // Simulate some async work
                            _a.sent();
                            // Check for errors
                            if (errors === null || errors === void 0 ? void 0 : errors.has(context.node.id)) {
                                throw errors.get(context.node.id);
                            }
                            // Return custom result if provided
                            if (results === null || results === void 0 ? void 0 : results.has(context.node.id)) {
                                return [2 /*return*/, results.get(context.node.id)];
                            }
                            // Default result
                            return [2 /*return*/, {
                                    output: { nodeId: context.node.id, executed: true },
                                    confidence: 1.0,
                                    tokenUsage: { inputTokens: 100, outputTokens: 50 },
                                }];
                    }
                });
            });
        },
        canExecute: function (node) {
            return canExecuteTypes.includes(node.type);
        },
    };
}
/**
 * Create a simple test DAG with the builder
 */
function createSimpleDAG(name) {
    if (name === void 0) { name = 'test-dag'; }
    return (0, builder_1.dag)(name)
        .skillNode('node-1', 'skill-a')
        .prompt('Do task 1')
        .done()
        .skillNode('node-2', 'skill-b')
        .dependsOn('node-1')
        .prompt('Do task 2')
        .done()
        .outputs({ name: 'result', from: 'node-2' })
        .build();
}
// =============================================================================
// Basic Execution Tests
// =============================================================================
(0, vitest_1.describe)('DAGExecutor', function () {
    (0, vitest_1.describe)('basic execution', function () {
        (0, vitest_1.it)('should execute a single-node DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('single-node')
                            .skillNode('only-node', 'test-skill')
                            .prompt('Do the thing')
                            .done()
                            .outputs({ name: 'output', from: 'only-node' })
                            .build();
                        executor = createMockExecutor();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(executor.calls).toHaveLength(1);
                        (0, vitest_1.expect)(executor.calls[0].node.id).toBe('only-node');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should execute a linear DAG in order', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result, executionOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.linearDag)('linear-test', 'skill-1', 'skill-2', 'skill-3');
                        executor = createMockExecutor();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(executor.calls).toHaveLength(3);
                        executionOrder = executor.calls.map(function (c) { return c.node.id; });
                        (0, vitest_1.expect)(executionOrder).toEqual(['node-0', 'node-1', 'node-2']);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should pass dependency outputs to dependent nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, customResults, executor, secondNodeContext, depOutput;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createSimpleDAG();
                        customResults = new Map([
                            ['node-1', { output: { data: 'from-node-1' }, confidence: 1.0 }],
                        ]);
                        executor = createMockExecutor({ results: customResults });
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        _a.sent();
                        secondNodeContext = executor.calls.find(function (c) { return c.node.id === 'node-2'; });
                        (0, vitest_1.expect)(secondNodeContext === null || secondNodeContext === void 0 ? void 0 : secondNodeContext.dependencyOutputs.size).toBe(1);
                        depOutput = secondNodeContext === null || secondNodeContext === void 0 ? void 0 : secondNodeContext.dependencyOutputs.get('node-1');
                        (0, vitest_1.expect)(depOutput === null || depOutput === void 0 ? void 0 : depOutput.output).toEqual({ data: 'from-node-1' });
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should build outputs from completed nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, customResults, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('output-test')
                            .skillNode('producer', 'test-skill')
                            .done()
                            .outputs({ name: 'final', from: 'producer' })
                            .build();
                        customResults = new Map([
                            ['producer', { output: { answer: 42 }, confidence: 1.0 }],
                        ]);
                        executor = createMockExecutor({ results: customResults });
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.outputs.get('final')).toEqual({ answer: 42 });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Parallel Execution Tests
    // ===========================================================================
    (0, vitest_1.describe)('parallel execution', function () {
        (0, vitest_1.it)('should execute independent nodes in parallel', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, startTimes, executor, startTime, result, times, maxDiff, totalTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('parallel-test')
                            .skillNode('a', 'skill-a').done()
                            .skillNode('b', 'skill-b').done()
                            .skillNode('c', 'skill-c').done()
                            .build();
                        startTimes = new Map();
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                startTimes.set(context.node.id, Date.now());
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        startTime = Date.now();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        // All nodes should have started nearly simultaneously
                        (0, vitest_1.expect)(result.success).toBe(true);
                        times = Array.from(startTimes.values());
                        maxDiff = Math.max.apply(Math, times) - Math.min.apply(Math, times);
                        (0, vitest_1.expect)(maxDiff).toBeLessThan(30); // All should start within 30ms
                        totalTime = Date.now() - startTime;
                        (0, vitest_1.expect)(totalTime).toBeLessThan(150);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should execute fan-out/fan-in DAG correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executionLog, executor, result, startEndIndex, parallelStartIndices, _i, parallelStartIndices_1, idx, endStartIndex, parallelEndIndices, _a, parallelEndIndices_1, idx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        testDAG = (0, builder_1.fanOutFanInDag)('fan-test', 'start-skill', ['parallel-1', 'parallel-2', 'parallel-3'], 'end-skill');
                        executionLog = [];
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                executionLog.push("start:".concat(context.node.id));
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 20); })];
                                            case 1:
                                                _a.sent();
                                                executionLog.push("end:".concat(context.node.id));
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        startEndIndex = executionLog.indexOf('end:start');
                        parallelStartIndices = [
                            executionLog.indexOf('start:parallel-0'),
                            executionLog.indexOf('start:parallel-1'),
                            executionLog.indexOf('start:parallel-2'),
                        ];
                        for (_i = 0, parallelStartIndices_1 = parallelStartIndices; _i < parallelStartIndices_1.length; _i++) {
                            idx = parallelStartIndices_1[_i];
                            (0, vitest_1.expect)(idx).toBeGreaterThan(startEndIndex);
                        }
                        endStartIndex = executionLog.indexOf('start:end');
                        parallelEndIndices = [
                            executionLog.indexOf('end:parallel-0'),
                            executionLog.indexOf('end:parallel-1'),
                            executionLog.indexOf('end:parallel-2'),
                        ];
                        for (_a = 0, parallelEndIndices_1 = parallelEndIndices; _a < parallelEndIndices_1.length; _a++) {
                            idx = parallelEndIndices_1[_a];
                            (0, vitest_1.expect)(endStartIndex).toBeGreaterThan(idx);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should respect maxParallelism config', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, currentRunning, maxRunning, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('parallelism-test')
                            .config({ maxParallelism: 2 })
                            .skillNode('a', 'skill').done()
                            .skillNode('b', 'skill').done()
                            .skillNode('c', 'skill').done()
                            .skillNode('d', 'skill').done()
                            .build();
                        currentRunning = 0;
                        maxRunning = 0;
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                currentRunning++;
                                                maxRunning = Math.max(maxRunning, currentRunning);
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                                            case 1:
                                                _a.sent();
                                                currentRunning--;
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(maxRunning).toBeLessThanOrEqual(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Retry Logic Tests
    // ===========================================================================
    (0, vitest_1.describe)('retry logic', function () {
        (0, vitest_1.it)('should retry failed nodes up to maxAttempts', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, attempts, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('retry-test')
                            .skillNode('flaky-node', 'skill')
                            .retryTimes(3, 10)
                            .done()
                            .build();
                        attempts = 0;
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    var error;
                                    return __generator(this, function (_a) {
                                        attempts++;
                                        if (attempts < 3) {
                                            error = {
                                                code: 'MODEL_ERROR',
                                                message: 'Transient error',
                                                retryable: true,
                                            };
                                            throw error;
                                        }
                                        return [2 /*return*/, { output: { succeeded: true }, confidence: 1.0 }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(attempts).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should not retry non-retryable errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, attempts, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('no-retry-test')
                            .skillNode('fail-node', 'skill')
                            .retryTimes(5, 10)
                            .done()
                            .build();
                        attempts = 0;
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    var error;
                                    return __generator(this, function (_a) {
                                        attempts++;
                                        error = {
                                            code: 'PERMISSION_DENIED',
                                            message: 'Not allowed',
                                            retryable: false,
                                        };
                                        throw error;
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(attempts).toBe(1); // Should not retry
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should apply exponential backoff between retries', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, attemptTimes, attempts, executor, firstDelay, secondDelay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('backoff-test')
                            .skillNode('slow-retry', 'skill')
                            .retry({
                            maxAttempts: 3,
                            baseDelayMs: 50,
                            maxDelayMs: 1000,
                            backoffMultiplier: 2,
                            retryableErrors: ['TIMEOUT'],
                            nonRetryableErrors: [],
                        })
                            .done()
                            .build();
                        attemptTimes = [];
                        attempts = 0;
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    var error;
                                    return __generator(this, function (_a) {
                                        attemptTimes.push(Date.now());
                                        attempts++;
                                        if (attempts < 3) {
                                            error = {
                                                code: 'TIMEOUT',
                                                message: 'Timed out',
                                                retryable: true,
                                            };
                                            throw error;
                                        }
                                        return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        _a.sent();
                        // First retry delay should be ~50ms, second ~100ms
                        if (attemptTimes.length >= 2) {
                            firstDelay = attemptTimes[1] - attemptTimes[0];
                            (0, vitest_1.expect)(firstDelay).toBeGreaterThanOrEqual(40); // Some tolerance
                        }
                        if (attemptTimes.length >= 3) {
                            secondDelay = attemptTimes[2] - attemptTimes[1];
                            (0, vitest_1.expect)(secondDelay).toBeGreaterThanOrEqual(80);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Timeout Tests
    // ===========================================================================
    (0, vitest_1.describe)('timeout handling', function () {
        (0, vitest_1.it)('should timeout individual nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('node-timeout-test')
                            .skillNode('slow-node', 'skill')
                            .timeout(100) // 100ms timeout
                            .done()
                            .build();
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: 
                                            // This will take longer than the timeout
                                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                                            case 1:
                                                // This will take longer than the timeout
                                                _a.sent();
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors.some(function (e) { return e.code === 'TIMEOUT'; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should timeout entire DAG execution', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('dag-timeout-test')
                            .timeout(150) // 150ms total timeout
                            .skillNode('node-1', 'skill').done()
                            .skillNode('node-2', 'skill').dependsOn('node-1').done()
                            .skillNode('node-3', 'skill').dependsOn('node-2').done()
                            .build();
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors.some(function (e) { return e.code === 'TIMEOUT'; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Cancellation Tests
    // ===========================================================================
    (0, vitest_1.describe)('cancellation', function () {
        (0, vitest_1.it)('should cancel execution when abort signal is triggered', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, abortController, nodesExecuted, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('cancel-test')
                            .skillNode('node-1', 'skill').done()
                            .skillNode('node-2', 'skill').dependsOn('node-1').done()
                            .skillNode('node-3', 'skill').dependsOn('node-2').done()
                            .build();
                        abortController = new AbortController();
                        nodesExecuted = 0;
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                nodesExecuted++;
                                                if (nodesExecuted === 2) {
                                                    // Cancel after second node starts
                                                    abortController.abort();
                                                }
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, {
                                executors: [executor],
                                abortSignal: abortController.signal,
                            })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(nodesExecuted).toBeLessThan(3);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should respect abort signal passed to node context', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, abortController, receivedSignal, executor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('abort-context-test')
                            .skillNode('test-node', 'skill').done()
                            .build();
                        abortController = new AbortController();
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        receivedSignal = context.abortSignal;
                                        return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, {
                                executors: [executor],
                                abortSignal: abortController.signal,
                            })];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(receivedSignal).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should support cancel() method on executor instance', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, nodeStarted, executor, dagExecutor, executePromise, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('cancel-method-test')
                            .skillNode('node-1', 'skill').done()
                            .skillNode('node-2', 'skill').dependsOn('node-1').done()
                            .build();
                        nodeStarted = false;
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(context.node.id === 'node-1')) return [3 /*break*/, 2];
                                                nodeStarted = true;
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2: return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        dagExecutor = new executor_1.DAGExecutor(testDAG, { executors: [executor] });
                        executePromise = dagExecutor.execute();
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30); })];
                    case 1:
                        _a.sent();
                        dagExecutor.cancel();
                        return [4 /*yield*/, executePromise];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(nodeStarted).toBe(true);
                        (0, vitest_1.expect)(result.success).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Error Handling Tests
    // ===========================================================================
    (0, vitest_1.describe)('error handling', function () {
        (0, vitest_1.it)('should mark dependent nodes as skipped when dependency fails', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result, dependentState;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('skip-test')
                            .skillNode('failing', 'skill').done()
                            .skillNode('dependent', 'skill').dependsOn('failing').done()
                            .build();
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        if (context.node.id === 'failing') {
                                            throw { code: 'MODEL_ERROR', message: 'Oops', retryable: false };
                                        }
                                        return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        dependentState = result.snapshot.nodeStates.get('dependent');
                        (0, vitest_1.expect)(dependentState === null || dependentState === void 0 ? void 0 : dependentState.status).toBe('skipped');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should fail fast when failFast is enabled', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, nodesStarted, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('fail-fast-test')
                            .failFast(true)
                            .skillNode('a', 'skill').done()
                            .skillNode('b', 'skill').done() // Independent, runs in parallel
                            .skillNode('c', 'skill').done()
                            .build();
                        nodesStarted = 0;
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                nodesStarted++;
                                                if (!(context.node.id === 'a')) return [3 /*break*/, 2];
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10); })];
                                            case 1:
                                                _a.sent();
                                                throw { code: 'MODEL_ERROR', message: 'Fail fast', retryable: false };
                                            case 2: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        // With fail fast, execution should stop quickly
                        (0, vitest_1.expect)(result.totalTimeMs).toBeLessThan(200);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should collect all errors in the result', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('multi-error-test')
                            .failFast(false)
                            .skillNode('fail-1', 'skill').done()
                            .skillNode('fail-2', 'skill').done()
                            .build();
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        throw {
                                            code: 'MODEL_ERROR',
                                            message: "Error from ".concat(context.node.id),
                                            retryable: false,
                                        };
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors.length).toBeGreaterThanOrEqual(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle missing executor for node type', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('missing-executor-test')
                            .mcpNode('mcp-node', 'server', 'tool')
                            .done()
                            .build();
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                    });
                                });
                            },
                            canExecute: function (node) { return node.type === 'skill'; }, // Only handles skill nodes
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors.some(function (e) { return e.message.includes('No executor found'); })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Token Usage Tests
    // ===========================================================================
    (0, vitest_1.describe)('token tracking', function () {
        (0, vitest_1.it)('should aggregate token usage across all nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('token-test')
                            .skillNode('a', 'skill').done()
                            .skillNode('b', 'skill').dependsOn('a').done()
                            .build();
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        return [2 /*return*/, {
                                                output: {},
                                                confidence: 1.0,
                                                tokenUsage: { inputTokens: 100, outputTokens: 50 },
                                            }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.totalTokenUsage.inputTokens).toBe(200);
                        (0, vitest_1.expect)(result.totalTokenUsage.outputTokens).toBe(100);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Progress Callback Tests
    // ===========================================================================
    (0, vitest_1.describe)('progress reporting', function () {
        (0, vitest_1.it)('should call onProgress callback after each wave', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, progressSnapshots, executor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.linearDag)('progress-test', 'skill-1', 'skill-2', 'skill-3');
                        progressSnapshots = [];
                        executor = createMockExecutor();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, {
                                executors: [executor],
                                onProgress: function (snapshot) {
                                    progressSnapshots.push({
                                        currentWave: snapshot.currentWave,
                                        status: snapshot.status,
                                    });
                                },
                            })];
                    case 1:
                        _a.sent();
                        // Should have progress updates for each completed wave
                        (0, vitest_1.expect)(progressSnapshots.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Snapshot Tests
    // ===========================================================================
    (0, vitest_1.describe)('execution snapshot', function () {
        (0, vitest_1.it)('should return final snapshot with all node states', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createSimpleDAG();
                        executor = createMockExecutor();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.snapshot.nodeStates.size).toBe(2);
                        (0, vitest_1.expect)(result.snapshot.nodeOutputs.size).toBe(2);
                        (0, vitest_1.expect)(result.snapshot.status).toBe('completed');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should provide execution ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, dagExecutor, executionId;
            return __generator(this, function (_a) {
                testDAG = createSimpleDAG();
                executor = createMockExecutor();
                dagExecutor = new executor_1.DAGExecutor(testDAG, { executors: [executor] });
                executionId = dagExecutor.getExecutionId();
                (0, vitest_1.expect)(executionId).toBeDefined();
                (0, vitest_1.expect)(typeof executionId).toBe('string');
                return [2 /*return*/];
            });
        }); });
        (0, vitest_1.it)('should expose getSnapshot() during execution', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, midExecutionSnapshot, executor, dagExecutor, executePromise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.linearDag)('snapshot-during-exec', 'skill-1', 'skill-2');
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(context.node.id === 'node-0')) return [3 /*break*/, 2];
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2: return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                        }
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        dagExecutor = new executor_1.DAGExecutor(testDAG, { executors: [executor] });
                        executePromise = dagExecutor.execute();
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 25); })];
                    case 1:
                        _a.sent();
                        midExecutionSnapshot = dagExecutor.getSnapshot();
                        return [4 /*yield*/, executePromise];
                    case 2:
                        _a.sent();
                        (0, vitest_1.expect)(midExecutionSnapshot).toBeDefined();
                        (0, vitest_1.expect)(midExecutionSnapshot.status).toBe('running');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // NoOpExecutor Tests
    // ===========================================================================
    (0, vitest_1.describe)('NoOpExecutor', function () {
        (0, vitest_1.it)('should execute any node type', function () {
            var executor = new executor_1.NoOpExecutor();
            var skillNode = { type: 'skill' };
            var agentNode = { type: 'agent' };
            var mcpNode = { type: 'mcp-tool' };
            (0, vitest_1.expect)(executor.canExecute(skillNode)).toBe(true);
            (0, vitest_1.expect)(executor.canExecute(agentNode)).toBe(true);
            (0, vitest_1.expect)(executor.canExecute(mcpNode)).toBe(true);
        });
        (0, vitest_1.it)('should return result with node metadata', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = new executor_1.NoOpExecutor();
                        context = {
                            dag: {},
                            node: {
                                id: 'test-node',
                                name: 'Test Node',
                                type: 'skill',
                                dependencies: [],
                                state: { status: 'running', startedAt: new Date(), attempt: 1 },
                                config: { timeoutMs: 1000, maxRetries: 0, retryDelayMs: 0, exponentialBackoff: false },
                            },
                            executionId: 'exec-123',
                            dependencyOutputs: new Map(),
                            dagInput: {},
                        };
                        return [4 /*yield*/, executor.execute(context)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.output).toHaveProperty('nodeId', 'test-node');
                        (0, vitest_1.expect)(result.output).toHaveProperty('nodeName', 'Test Node');
                        (0, vitest_1.expect)(result.output).toHaveProperty('executed', true);
                        (0, vitest_1.expect)(result.confidence).toBe(1.0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // executeDAG Convenience Function Tests
    // ===========================================================================
    (0, vitest_1.describe)('executeDAG convenience function', function () {
        (0, vitest_1.it)('should use NoOpExecutor by default', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createSimpleDAG();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should accept partial options', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createSimpleDAG();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, {
                                input: { topic: 'test' },
                            })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // Edge Cases
    // ===========================================================================
    (0, vitest_1.describe)('edge cases', function () {
        (0, vitest_1.it)('should handle empty input DAG gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('minimal')
                            .skillNode('only', 'skill')
                            .done()
                            .build();
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle DAG input being passed to nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, receivedInput, executor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createSimpleDAG();
                        executor = {
                            execute: function (context) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        receivedInput = context.dagInput;
                                        return [2 /*return*/, { output: {}, confidence: 1.0 }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, {
                                executors: [executor],
                                input: { topic: 'AI safety', depth: 'comprehensive' },
                            })];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(receivedInput).toEqual({ topic: 'AI safety', depth: 'comprehensive' });
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle output path extraction', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, executor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = (0, builder_1.dag)('path-extraction-test')
                            .skillNode('producer', 'skill')
                            .done()
                            .output({
                            name: 'nested',
                            sourceNodeId: 'producer',
                            outputPath: 'data.nested.value',
                        })
                            .build();
                        executor = {
                            execute: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        return [2 /*return*/, {
                                                output: {
                                                    data: {
                                                        nested: {
                                                            value: 'extracted!',
                                                        },
                                                    },
                                                },
                                                confidence: 1.0,
                                            }];
                                    });
                                });
                            },
                            canExecute: function () { return true; },
                        };
                        return [4 /*yield*/, (0, executor_1.executeDAG)(testDAG, { executors: [executor] })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.outputs.get('nested')).toBe('extracted!');
                        return [2 /*return*/];
                }
            });
        }); });
    });
});

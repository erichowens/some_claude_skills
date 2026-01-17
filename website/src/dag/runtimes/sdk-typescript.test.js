"use strict";
/**
 * Tests for SDK TypeScript Runtime
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
var sdk_typescript_1 = require("./sdk-typescript");
var builder_1 = require("../core/builder");
var presets_1 = require("../permissions/presets");
// =============================================================================
// Test Helpers
// =============================================================================
function createTestDAG() {
    return (0, builder_1.dag)('test-dag')
        .description('Test DAG for SDK runtime')
        .skillNode('node-a', 'test-skill')
        .name('Node A')
        .prompt('Execute task A')
        .done()
        .skillNode('node-b', 'test-skill')
        .name('Node B')
        .prompt('Execute task B')
        .dependsOn('node-a')
        .done()
        .build();
}
function createParallelDAG() {
    return (0, builder_1.dag)('parallel-dag')
        .description('Parallel test DAG')
        .skillNode('start', 'init-skill')
        .name('Start')
        .prompt('Initialize')
        .done()
        .skillNode('task-a', 'worker-skill')
        .name('Task A')
        .prompt('Do task A')
        .dependsOn('start')
        .done()
        .skillNode('task-b', 'worker-skill')
        .name('Task B')
        .prompt('Do task B')
        .dependsOn('start')
        .done()
        .skillNode('task-c', 'worker-skill')
        .name('Task C')
        .prompt('Do task C')
        .dependsOn('start')
        .done()
        .skillNode('merge', 'aggregator-skill')
        .name('Merge')
        .prompt('Combine results')
        .dependsOn('task-a', 'task-b', 'task-c')
        .done()
        .build();
}
// =============================================================================
// Basic Functionality Tests
// =============================================================================
(0, vitest_1.describe)('SDKTypescriptRuntime', function () {
    (0, vitest_1.describe)('constructor', function () {
        (0, vitest_1.it)('creates runtime with default config', function () {
            var runtime = new sdk_typescript_1.SDKTypescriptRuntime();
            (0, vitest_1.expect)(runtime).toBeInstanceOf(sdk_typescript_1.SDKTypescriptRuntime);
        });
        (0, vitest_1.it)('creates runtime with custom config', function () {
            var mockClient = (0, sdk_typescript_1.createMockClient)();
            var runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                client: mockClient,
                maxParallelCalls: 3,
                defaultModel: 'claude-3-haiku-20240307',
            });
            (0, vitest_1.expect)(runtime).toBeInstanceOf(sdk_typescript_1.SDKTypescriptRuntime);
        });
        (0, vitest_1.it)('creates runtime with permissions', function () {
            var permissions = (0, presets_1.getPreset)('standard');
            var runtime = new sdk_typescript_1.SDKTypescriptRuntime({ permissions: permissions });
            (0, vitest_1.expect)(runtime).toBeInstanceOf(sdk_typescript_1.SDKTypescriptRuntime);
        });
    });
    (0, vitest_1.describe)('execute', function () {
        (0, vitest_1.it)('executes a simple linear DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createTestDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime();
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.snapshot.nodeStates.size).toBe(2);
                        (0, vitest_1.expect)(result.totalTimeMs).toBeGreaterThanOrEqual(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('executes a parallel DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var parallelDAG, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parallelDAG = createParallelDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime();
                        return [4 /*yield*/, runtime.execute(parallelDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.snapshot.nodeStates.size).toBe(5);
                        (0, vitest_1.expect)(result.snapshot.totalWaves).toBe(3); // start, parallel, merge
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('passes inputs as variables', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, mockClient, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createTestDAG();
                        mockClient = (0, sdk_typescript_1.createMockClient)();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({ client: mockClient });
                        return [4 /*yield*/, runtime.execute(testDAG, {
                                topic: 'Test Topic',
                                count: 5,
                            })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('tracks token usage', function () { return __awaiter(void 0, void 0, void 0, function () {
            var testDAG, mockClient, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testDAG = createTestDAG();
                        mockClient = (0, sdk_typescript_1.createMockClient)({
                            usage: { input_tokens: 150, output_tokens: 75 },
                        });
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({ client: mockClient });
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.totalTokenUsage.inputTokens).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.totalTokenUsage.outputTokens).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('callbacks', function () {
        (0, vitest_1.it)('calls onNodeStart for each node', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onNodeStart, testDAG, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onNodeStart = vitest_1.vi.fn();
                        testDAG = createTestDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({ onNodeStart: onNodeStart });
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onNodeStart).toHaveBeenCalledTimes(2);
                        (0, vitest_1.expect)(onNodeStart).toHaveBeenCalledWith('node-a', vitest_1.expect.objectContaining({ id: 'node-a' }));
                        (0, vitest_1.expect)(onNodeStart).toHaveBeenCalledWith('node-b', vitest_1.expect.objectContaining({ id: 'node-b' }));
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onNodeComplete for successful nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onNodeComplete, testDAG, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onNodeComplete = vitest_1.vi.fn();
                        testDAG = createTestDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({ onNodeComplete: onNodeComplete });
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onNodeComplete).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onWaveStart and onWaveComplete', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onWaveStart, onWaveComplete, parallelDAG, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onWaveStart = vitest_1.vi.fn();
                        onWaveComplete = vitest_1.vi.fn();
                        parallelDAG = createParallelDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({ onWaveStart: onWaveStart, onWaveComplete: onWaveComplete });
                        return [4 /*yield*/, runtime.execute(parallelDAG)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onWaveStart).toHaveBeenCalledTimes(3); // 3 waves
                        (0, vitest_1.expect)(onWaveComplete).toHaveBeenCalledTimes(3);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onAPICall and onAPIResponse', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onAPICall, onAPIResponse, testDAG, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onAPICall = vitest_1.vi.fn();
                        onAPIResponse = vitest_1.vi.fn();
                        testDAG = createTestDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({ onAPICall: onAPICall, onAPIResponse: onAPIResponse });
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onAPICall).toHaveBeenCalledTimes(2);
                        (0, vitest_1.expect)(onAPIResponse).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('error handling', function () {
        (0, vitest_1.it)('handles API errors gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var errorClient, onNodeError, testDAG, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errorClient = {
                            messages: {
                                create: function () {
                                    return __awaiter(this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            throw new Error('API rate limit exceeded');
                                        });
                                    });
                                },
                            },
                        };
                        onNodeError = vitest_1.vi.fn();
                        testDAG = createTestDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                            client: errorClient,
                            onNodeError: onNodeError,
                        });
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(onNodeError).toHaveBeenCalled();
                        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('detects cycles in DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var cyclicDAG, nodeA, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cyclicDAG = (0, builder_1.dag)('cyclic-dag')
                            .skillNode('node-a', 'test')
                            .name('A')
                            .prompt('A')
                            .done()
                            .build();
                        nodeA = cyclicDAG.nodes.get('node-a');
                        nodeA.dependencies.push('node-a'); // Self-reference
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime();
                        return [4 /*yield*/, runtime.execute(cyclicDAG)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors[0].code).toBe('CYCLE_DETECTED');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('model selection', function () {
        (0, vitest_1.it)('uses default model when not specified', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onAPICall, testDAG, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onAPICall = vitest_1.vi.fn();
                        testDAG = createTestDAG();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                            defaultModel: 'claude-3-haiku-20240307',
                            onAPICall: onAPICall,
                        });
                        return [4 /*yield*/, runtime.execute(testDAG)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onAPICall).toHaveBeenCalledWith(vitest_1.expect.anything(), vitest_1.expect.objectContaining({ model: 'claude-3-haiku-20240307' }));
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('uses node-specific model when configured', function () { return __awaiter(void 0, void 0, void 0, function () {
            var onAPICall, dagWithModel, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        onAPICall = vitest_1.vi.fn();
                        dagWithModel = (0, builder_1.dag)('model-dag')
                            .skillNode('node-a', 'test')
                            .name('A')
                            .prompt('Test')
                            .model('haiku')
                            .done()
                            .build();
                        runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                            defaultModel: 'claude-sonnet-4-20250514',
                            onAPICall: onAPICall,
                        });
                        return [4 /*yield*/, runtime.execute(dagWithModel)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onAPICall).toHaveBeenCalledWith(vitest_1.expect.anything(), vitest_1.expect.objectContaining({ model: 'claude-3-haiku-20240307' }));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
// =============================================================================
// generateExecutionPlan Tests
// =============================================================================
(0, vitest_1.describe)('generateExecutionPlan', function () {
    (0, vitest_1.it)('generates plan for simple DAG', function () {
        var testDAG = createTestDAG();
        var runtime = new sdk_typescript_1.SDKTypescriptRuntime();
        var plan = runtime.generateExecutionPlan(testDAG);
        (0, vitest_1.expect)(plan.dagId).toBe(testDAG.id);
        (0, vitest_1.expect)(plan.dagName).toBe('test-dag');
        (0, vitest_1.expect)(plan.totalNodes).toBe(2);
        (0, vitest_1.expect)(plan.totalWaves).toBe(2);
        (0, vitest_1.expect)(plan.waves[0].nodes[0].nodeId).toBe('node-a');
        (0, vitest_1.expect)(plan.waves[1].nodes[0].nodeId).toBe('node-b');
    });
    (0, vitest_1.it)('generates plan for parallel DAG', function () {
        var parallelDAG = createParallelDAG();
        var runtime = new sdk_typescript_1.SDKTypescriptRuntime();
        var plan = runtime.generateExecutionPlan(parallelDAG);
        (0, vitest_1.expect)(plan.totalWaves).toBe(3);
        (0, vitest_1.expect)(plan.waves[1].parallelizable).toBe(true);
        (0, vitest_1.expect)(plan.waves[1].nodes.length).toBe(3); // task-a, task-b, task-c
    });
    (0, vitest_1.it)('includes dependency information', function () {
        var testDAG = createTestDAG();
        var runtime = new sdk_typescript_1.SDKTypescriptRuntime();
        var plan = runtime.generateExecutionPlan(testDAG);
        var nodeBPlan = plan.waves[1].nodes.find(function (n) { return n.nodeId === 'node-b'; });
        (0, vitest_1.expect)(nodeBPlan === null || nodeBPlan === void 0 ? void 0 : nodeBPlan.dependencies).toContain('node-a');
    });
    (0, vitest_1.it)('includes skill information', function () {
        var testDAG = createTestDAG();
        var runtime = new sdk_typescript_1.SDKTypescriptRuntime();
        var plan = runtime.generateExecutionPlan(testDAG);
        var nodeAPlan = plan.waves[0].nodes[0];
        (0, vitest_1.expect)(nodeAPlan.skillId).toBe('test-skill');
    });
});
// =============================================================================
// Mock Client Tests
// =============================================================================
(0, vitest_1.describe)('createMockClient', function () {
    (0, vitest_1.it)('creates a working mock client', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockClient, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockClient = (0, sdk_typescript_1.createMockClient)();
                    return [4 /*yield*/, mockClient.messages.create({
                            model: 'claude-sonnet-4-20250514',
                            max_tokens: 1000,
                            messages: [{ role: 'user', content: 'Test' }],
                        })];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.id).toMatch(/^msg_mock_/);
                    (0, vitest_1.expect)(response.type).toBe('message');
                    (0, vitest_1.expect)(response.content[0].type).toBe('text');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('allows response override', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockClient, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockClient = (0, sdk_typescript_1.createMockClient)({
                        usage: { input_tokens: 500, output_tokens: 250 },
                    });
                    return [4 /*yield*/, mockClient.messages.create({
                            model: 'claude-sonnet-4-20250514',
                            max_tokens: 1000,
                            messages: [{ role: 'user', content: 'Test' }],
                        })];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.usage.input_tokens).toBe(500);
                    (0, vitest_1.expect)(response.usage.output_tokens).toBe(250);
                    return [2 /*return*/];
            }
        });
    }); });
});
// =============================================================================
// Factory Function Tests
// =============================================================================
(0, vitest_1.describe)('createSDKRuntime', function () {
    (0, vitest_1.it)('creates runtime with factory function', function () {
        var runtime = (0, sdk_typescript_1.createSDKRuntime)();
        (0, vitest_1.expect)(runtime).toBeInstanceOf(sdk_typescript_1.SDKTypescriptRuntime);
    });
    (0, vitest_1.it)('passes config to runtime', function () {
        var mockClient = (0, sdk_typescript_1.createMockClient)();
        var runtime = (0, sdk_typescript_1.createSDKRuntime)({ client: mockClient });
        (0, vitest_1.expect)(runtime).toBeInstanceOf(sdk_typescript_1.SDKTypescriptRuntime);
    });
});
// =============================================================================
// Integration Tests
// =============================================================================
(0, vitest_1.describe)('SDK Runtime Integration', function () {
    (0, vitest_1.it)('executes a complex research workflow', function () { return __awaiter(void 0, void 0, void 0, function () {
        var researchDAG, runtime, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    researchDAG = (0, builder_1.dag)('research-workflow')
                        .description('Research workflow')
                        .skillNode('research', 'researcher')
                        .name('Research')
                        .prompt('Research the topic')
                        .done()
                        .skillNode('analyze', 'analyst')
                        .name('Analyze')
                        .prompt('Analyze findings')
                        .dependsOn('research')
                        .done()
                        .skillNode('report', 'writer')
                        .name('Report')
                        .prompt('Write report')
                        .dependsOn('analyze')
                        .done()
                        .output({
                        name: 'report',
                        sourceNodeId: 'report',
                        outputPath: 'output',
                    })
                        .build();
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime();
                    return [4 /*yield*/, runtime.execute(researchDAG, { topic: 'AI Testing' })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.success).toBe(true);
                    (0, vitest_1.expect)(result.snapshot.totalWaves).toBe(3);
                    (0, vitest_1.expect)(result.outputs.has('report')).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('respects maxParallelCalls setting', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manyNodesDAG, i, callTimes, runtime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manyNodesDAG = (0, builder_1.dag)('many-nodes')
                        .skillNode('start', 'init')
                        .name('Start')
                        .prompt('Init')
                        .done()
                        .build();
                    // Add 10 parallel nodes
                    for (i = 0; i < 10; i++) {
                        manyNodesDAG.nodes.set("task-".concat(i), {
                            id: "task-".concat(i),
                            name: "Task ".concat(i),
                            type: 'skill',
                            skillId: 'worker',
                            dependencies: ['start'],
                            state: { status: 'pending' },
                            config: {
                                timeoutMs: 30000,
                                maxRetries: 0,
                                retryDelayMs: 0,
                                exponentialBackoff: false,
                            },
                        });
                    }
                    callTimes = [];
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                        maxParallelCalls: 3,
                        onAPICall: function () {
                            callTimes.push(Date.now());
                        },
                    });
                    return [4 /*yield*/, runtime.execute(manyNodesDAG)];
                case 1:
                    _a.sent();
                    // Verify execution completed
                    (0, vitest_1.expect)(callTimes.length).toBe(11); // start + 10 tasks
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('passes dependency results to downstream nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var capturedParams, mockClient, testDAG, runtime, nodeBMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    capturedParams = [];
                    mockClient = {
                        messages: {
                            create: function (params) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        capturedParams.push(params);
                                        return [2 /*return*/, {
                                                id: "msg_".concat(Date.now()),
                                                type: 'message',
                                                role: 'assistant',
                                                content: [
                                                    {
                                                        type: 'text',
                                                        text: JSON.stringify({
                                                            output: { result: 'test-result' },
                                                            confidence: 0.9,
                                                        }),
                                                    },
                                                ],
                                                model: params.model,
                                                stop_reason: 'end_turn',
                                                stop_sequence: null,
                                                usage: { input_tokens: 100, output_tokens: 50 },
                                            }];
                                    });
                                });
                            },
                        },
                    };
                    testDAG = createTestDAG();
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime({ client: mockClient });
                    return [4 /*yield*/, runtime.execute(testDAG)];
                case 1:
                    _a.sent();
                    // Second call (node-b) should include results from node-a
                    (0, vitest_1.expect)(capturedParams.length).toBe(2);
                    nodeBMessage = capturedParams[1].messages[0].content;
                    (0, vitest_1.expect)(nodeBMessage).toContain('node-a');
                    (0, vitest_1.expect)(nodeBMessage).toContain('test-result');
                    return [2 /*return*/];
            }
        });
    }); });
});

"use strict";
/**
 * Tests for SDK TypeScript Runtime Demo
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
var sdk_typescript_demo_1 = require("./sdk-typescript-demo");
(0, vitest_1.describe)('SDK TypeScript Demo', function () {
    (0, vitest_1.describe)('buildResearchDAG', function () {
        (0, vitest_1.it)('creates a DAG with correct structure', function () {
            var dag = (0, sdk_typescript_demo_1.buildResearchDAG)('Test Topic');
            (0, vitest_1.expect)(dag.name).toBe('sdk-research-workflow');
            (0, vitest_1.expect)(dag.nodes.size).toBe(5);
            (0, vitest_1.expect)(dag.outputs.length).toBe(2);
        });
        (0, vitest_1.it)('sets up correct dependencies', function () {
            var dag = (0, sdk_typescript_demo_1.buildResearchDAG)('Test Topic');
            // Wave 0 nodes have no dependencies
            var researchNode = dag.nodes.get('research-topic');
            var examplesNode = dag.nodes.get('gather-examples');
            (0, vitest_1.expect)(researchNode === null || researchNode === void 0 ? void 0 : researchNode.dependencies).toHaveLength(0);
            (0, vitest_1.expect)(examplesNode === null || examplesNode === void 0 ? void 0 : examplesNode.dependencies).toHaveLength(0);
            // Wave 1 depends on both Wave 0 nodes
            var analyzeNode = dag.nodes.get('analyze-findings');
            (0, vitest_1.expect)(analyzeNode === null || analyzeNode === void 0 ? void 0 : analyzeNode.dependencies).toHaveLength(2);
            (0, vitest_1.expect)(analyzeNode === null || analyzeNode === void 0 ? void 0 : analyzeNode.dependencies).toContain('research-topic');
            (0, vitest_1.expect)(analyzeNode === null || analyzeNode === void 0 ? void 0 : analyzeNode.dependencies).toContain('gather-examples');
            // Wave 2 depends on Wave 1
            var reportNode = dag.nodes.get('generate-report');
            (0, vitest_1.expect)(reportNode === null || reportNode === void 0 ? void 0 : reportNode.dependencies).toContain('analyze-findings');
            // Wave 3 depends on Wave 2
            var summaryNode = dag.nodes.get('create-summary');
            (0, vitest_1.expect)(summaryNode === null || summaryNode === void 0 ? void 0 : summaryNode.dependencies).toContain('generate-report');
        });
        (0, vitest_1.it)('configures outputs correctly', function () {
            var dag = (0, sdk_typescript_demo_1.buildResearchDAG)('Test Topic');
            var reportOutput = dag.outputs.find(function (o) { return o.name === 'report'; });
            var summaryOutput = dag.outputs.find(function (o) { return o.name === 'summary'; });
            (0, vitest_1.expect)(reportOutput === null || reportOutput === void 0 ? void 0 : reportOutput.sourceNodeId).toBe('generate-report');
            (0, vitest_1.expect)(summaryOutput === null || summaryOutput === void 0 ? void 0 : summaryOutput.sourceNodeId).toBe('create-summary');
        });
    });
    (0, vitest_1.describe)('createEventLogger', function () {
        (0, vitest_1.it)('logs with timestamps in verbose mode', function () {
            var consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
            var _a = (0, sdk_typescript_demo_1.createEventLogger)(true), log = _a.log, logs = _a.logs;
            log('Test message');
            (0, vitest_1.expect)(logs).toHaveLength(1);
            (0, vitest_1.expect)(logs[0]).toMatch(/\[\d+\.\d+s\] Test message/);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('does not console.log in non-verbose mode', function () {
            var consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
            var _a = (0, sdk_typescript_demo_1.createEventLogger)(false), log = _a.log, logs = _a.logs;
            log('Test message');
            (0, vitest_1.expect)(logs).toHaveLength(1);
            (0, vitest_1.expect)(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('createCustomResponseClient', function () {
        (0, vitest_1.it)('creates a working custom client', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = (0, sdk_typescript_demo_1.createCustomResponseClient)();
                        return [4 /*yield*/, client.messages.create({
                                model: 'claude-sonnet-4-20250514',
                                max_tokens: 1000,
                                messages: [{ role: 'user', content: 'Test' }],
                            })];
                    case 1:
                        response = _a.sent();
                        (0, vitest_1.expect)(response.id).toMatch(/^msg_sdk_demo_/);
                        (0, vitest_1.expect)(response.type).toBe('message');
                        (0, vitest_1.expect)(response.content[0].type).toBe('text');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('supports custom response generator', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client, response, text, parsed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = (0, sdk_typescript_demo_1.createCustomResponseClient)(function (nodeId, prompt) {
                            return JSON.stringify({ custom: true, nodeId: nodeId, promptLength: prompt.length });
                        });
                        return [4 /*yield*/, client.messages.create({
                                model: 'claude-sonnet-4-20250514',
                                max_tokens: 1000,
                                messages: [{ role: 'user', content: 'Node ID: test-node\nTest prompt' }],
                            })];
                    case 1:
                        response = _a.sent();
                        text = response.content[0].type === 'text' ? response.content[0].text : '';
                        parsed = JSON.parse(text);
                        (0, vitest_1.expect)(parsed.custom).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('runSimpleSDKDemo', function () {
        (0, vitest_1.it)('executes a simple linear DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var consoleSpy, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
                        return [4 /*yield*/, (0, sdk_typescript_demo_1.runSimpleSDKDemo)()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.snapshot.nodeStates.size).toBe(3);
                        consoleSpy.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('runParallelSDKDemo', function () {
        (0, vitest_1.it)('executes a fan-out/fan-in DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var consoleSpy, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
                        return [4 /*yield*/, (0, sdk_typescript_demo_1.runParallelSDKDemo)()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.snapshot.nodeStates.size).toBe(5);
                        (0, vitest_1.expect)(result.snapshot.totalWaves).toBe(3);
                        consoleSpy.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('tracks token usage', function () { return __awaiter(void 0, void 0, void 0, function () {
            var consoleSpy, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
                        return [4 /*yield*/, (0, sdk_typescript_demo_1.runParallelSDKDemo)()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.totalTokenUsage.inputTokens).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.totalTokenUsage.outputTokens).toBeGreaterThan(0);
                        consoleSpy.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('runSDKTypescriptDemo', function () {
        (0, vitest_1.it)('executes the full research workflow', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, result, logs, metrics;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                            topic: 'Test topic for demo',
                            verbose: false,
                        })];
                    case 1:
                        _a = _b.sent(), result = _a.result, logs = _a.logs, metrics = _a.metrics;
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(metrics.totalNodes).toBe(5);
                        (0, vitest_1.expect)(metrics.completedNodes).toBe(5);
                        (0, vitest_1.expect)(metrics.failedNodes).toBe(0);
                        (0, vitest_1.expect)(logs.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('captures execution metrics', function () { return __awaiter(void 0, void 0, void 0, function () {
            var metrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                            verbose: false,
                        })];
                    case 1:
                        metrics = (_a.sent()).metrics;
                        (0, vitest_1.expect)(metrics.totalTimeMs).toBeGreaterThanOrEqual(0);
                        (0, vitest_1.expect)(metrics.tokensUsed).toBeGreaterThan(0);
                        (0, vitest_1.expect)(metrics.apiCalls).toBe(5); // One per node
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('respects permission settings', function () { return __awaiter(void 0, void 0, void 0, function () {
            var minimalResult, standardResult, fullResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                            verbose: false,
                            permissions: 'minimal',
                        })];
                    case 1:
                        minimalResult = (_a.sent()).result;
                        (0, vitest_1.expect)(minimalResult.success).toBe(true); // SDK doesn't need Task tool
                        return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                                verbose: false,
                                permissions: 'standard',
                            })];
                    case 2:
                        standardResult = (_a.sent()).result;
                        (0, vitest_1.expect)(standardResult.success).toBe(true);
                        return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                                verbose: false,
                                permissions: 'full',
                            })];
                    case 3:
                        fullResult = (_a.sent()).result;
                        (0, vitest_1.expect)(fullResult.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('respects maxParallelCalls setting', function () { return __awaiter(void 0, void 0, void 0, function () {
            var metrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                            verbose: false,
                            maxParallelCalls: 1,
                        })];
                    case 1:
                        metrics = (_a.sent()).metrics;
                        // Should still complete all nodes, just potentially slower
                        (0, vitest_1.expect)(metrics.completedNodes).toBe(5);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('uses specified default model', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                            verbose: false,
                            defaultModel: 'haiku',
                        })];
                    case 1:
                        result = (_a.sent()).result;
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
(0, vitest_1.describe)('SDK Demo Integration', function () {
    (0, vitest_1.it)('demonstrates wave-based execution order', function () { return __awaiter(void 0, void 0, void 0, function () {
        var consoleSpy, result, nodeStates, _i, nodeStates_1, _a, nodeId, state;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
                    return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                            verbose: false,
                        })];
                case 1:
                    result = (_b.sent()).result;
                    nodeStates = result.snapshot.nodeStates;
                    // All nodes should be completed
                    for (_i = 0, nodeStates_1 = nodeStates; _i < nodeStates_1.length; _i++) {
                        _a = nodeStates_1[_i], nodeId = _a[0], state = _a[1];
                        (0, vitest_1.expect)(state.status).toBe('completed');
                    }
                    consoleSpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('handles DAG with complex dependencies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var consoleSpy, result, mergeState;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(function () { });
                    return [4 /*yield*/, (0, sdk_typescript_demo_1.runParallelSDKDemo)()];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.success).toBe(true);
                    mergeState = result.snapshot.nodeStates.get('merge');
                    (0, vitest_1.expect)(mergeState === null || mergeState === void 0 ? void 0 : mergeState.status).toBe('completed');
                    consoleSpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('API calls match node count', function () { return __awaiter(void 0, void 0, void 0, function () {
        var metrics;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, sdk_typescript_demo_1.runSDKTypescriptDemo)({
                        verbose: false,
                    })];
                case 1:
                    metrics = (_a.sent()).metrics;
                    // SDK runtime makes one API call per node
                    (0, vitest_1.expect)(metrics.apiCalls).toBe(metrics.totalNodes);
                    return [2 /*return*/];
            }
        });
    }); });
});

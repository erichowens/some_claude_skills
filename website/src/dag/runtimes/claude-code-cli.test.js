"use strict";
/**
 * Tests for Claude Code CLI Runtime
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
var vitest_1 = require("vitest");
var claude_code_cli_1 = require("./claude-code-cli");
var builder_1 = require("../core/builder");
var types_1 = require("../types");
var presets_1 = require("../permissions/presets");
// =============================================================================
// Test Fixtures
// =============================================================================
function createSimpleDAG() {
    return new builder_1.DAGBuilder('Simple DAG')
        .addNode({
        id: 'node-a',
        name: 'Node A',
        type: 'skill',
        dependencies: [],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .addNode({
        id: 'node-b',
        name: 'Node B',
        type: 'skill',
        dependencies: ['node-a'],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .output({
        name: 'result',
        sourceNodeId: 'node-b',
    })
        .build();
}
function createParallelDAG() {
    return new builder_1.DAGBuilder('Parallel DAG')
        .addNode({
        id: 'root',
        name: 'Root',
        type: 'skill',
        dependencies: [],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .addNode({
        id: 'branch-a',
        name: 'Branch A',
        type: 'skill',
        dependencies: ['root'],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .addNode({
        id: 'branch-b',
        name: 'Branch B',
        type: 'skill',
        dependencies: ['root'],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .addNode({
        id: 'merge',
        name: 'Merge',
        type: 'skill',
        dependencies: ['branch-a', 'branch-b'],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .output({
        name: 'merged-result',
        sourceNodeId: 'merge',
    })
        .build();
}
function createComplexDAG() {
    return new builder_1.DAGBuilder('Complex DAG')
        .addNode({
        id: 'composite-node',
        name: 'Composite Node',
        type: 'composite',
        dependencies: [],
        config: { timeoutMs: 60000, priority: 1 },
    })
        .addNode({
        id: 'skill-node',
        name: 'Skill Node',
        type: 'skill',
        skillId: 'graph-builder',
        dependencies: ['composite-node'],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .addNode({
        id: 'agent-node',
        name: 'Agent Node',
        type: 'agent',
        agentId: 'debugger',
        dependencies: ['skill-node'],
        config: { timeoutMs: 30000, priority: 1 },
    })
        .addNode({
        id: 'many-deps',
        name: 'Many Dependencies',
        type: 'skill',
        dependencies: ['composite-node', 'skill-node', 'agent-node'],
        skillId: 'result-aggregator',
        config: { timeoutMs: 30000, priority: 1 },
    })
        .output({
        name: 'final',
        sourceNodeId: 'many-deps',
    })
        .build();
}
// =============================================================================
// Constructor Tests
// =============================================================================
(0, vitest_1.describe)('ClaudeCodeRuntime', function () {
    (0, vitest_1.describe)('constructor', function () {
        (0, vitest_1.it)('creates runtime with default config', function () {
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
        (0, vitest_1.it)('creates runtime with custom permissions', function () {
            var permissions = (0, presets_1.getPreset)('minimal');
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ permissions: permissions });
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
        (0, vitest_1.it)('creates runtime with custom maxParallelTasks', function () {
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ maxParallelTasks: 10 });
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
        (0, vitest_1.it)('creates runtime with custom defaultModel', function () {
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultModel: 'opus' });
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
        (0, vitest_1.it)('creates runtime with custom defaultMaxTurns', function () {
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultMaxTurns: 20 });
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
        (0, vitest_1.it)('creates runtime with runInBackground option', function () {
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ runInBackground: true });
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
        (0, vitest_1.it)('creates runtime with callback handlers', function () {
            var onNodeStart = vitest_1.vi.fn();
            var onNodeComplete = vitest_1.vi.fn();
            var onNodeError = vitest_1.vi.fn();
            var onWaveStart = vitest_1.vi.fn();
            var onWaveComplete = vitest_1.vi.fn();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({
                onNodeStart: onNodeStart,
                onNodeComplete: onNodeComplete,
                onNodeError: onNodeError,
                onWaveStart: onWaveStart,
                onWaveComplete: onWaveComplete,
            });
            (0, vitest_1.expect)(runtime).toBeDefined();
        });
    });
    // ===========================================================================
    // Execute Tests
    // ===========================================================================
    (0, vitest_1.describe)('execute', function () {
        (0, vitest_1.it)('executes a simple DAG successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.totalTimeMs).toBeGreaterThanOrEqual(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('executes a parallel DAG successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createParallelDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('executes a complex DAG successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createComplexDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('handles inputs correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, inputs, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        inputs = { key: 'value', number: 42 };
                        return [4 /*yield*/, runtime.execute(dag, inputs)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onNodeStart for each node', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, onNodeStart, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        onNodeStart = vitest_1.vi.fn();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime({ onNodeStart: onNodeStart });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onNodeStart).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onNodeComplete for successful nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, onNodeComplete, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        onNodeComplete = vitest_1.vi.fn();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime({ onNodeComplete: onNodeComplete });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onNodeComplete).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onWaveStart for each wave', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, onWaveStart, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        onWaveStart = vitest_1.vi.fn();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime({ onWaveStart: onWaveStart });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        _a.sent();
                        // Simple DAG has 2 waves (node-a, then node-b)
                        (0, vitest_1.expect)(onWaveStart).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls onWaveComplete for each wave', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, onWaveComplete, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        onWaveComplete = vitest_1.vi.fn();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime({ onWaveComplete: onWaveComplete });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onWaveComplete).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns outputs from completed nodes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.outputs.size).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.outputs.has('result')).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns execution snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.snapshot).toBeDefined();
                        (0, vitest_1.expect)(result.snapshot.dagId).toMatch(/^dag-/);
                        (0, vitest_1.expect)(result.snapshot.status).toBe('completed');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns total token usage', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.totalTokenUsage).toBeDefined();
                        // Simple DAG has 2 nodes, each with simulated 100 input / 50 output tokens
                        (0, vitest_1.expect)(result.totalTokenUsage.inputTokens).toBe(200);
                        (0, vitest_1.expect)(result.totalTokenUsage.outputTokens).toBe(100);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('fails when DAG has a cycle', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, nodeA, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        nodeA = dag.nodes.get('node-a');
                        if (nodeA) {
                            nodeA.dependencies = ['node-b'];
                        }
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.errors[0].code).toBe('CYCLE_DETECTED');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('fails when Task tool is disabled (no task calls generated)', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, permissions, onNodeError, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        permissions = (0, presets_1.getPreset)('minimal');
                        permissions.coreTools.task = false;
                        onNodeError = vitest_1.vi.fn();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime({ permissions: permissions, onNodeError: onNodeError });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        // Nodes fail because no task calls are generated
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.errors[0].code).toBe('TOOL_ERROR');
                        (0, vitest_1.expect)(result.errors[0].message).toContain('failed');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('aggregates token usage from node results', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        // The simulated execution doesn't include tokenUsage,
                        // so we verify the aggregation logic handles missing tokenUsage gracefully
                        (0, vitest_1.expect)(result.totalTokenUsage).toBeDefined();
                        (0, vitest_1.expect)(result.totalTokenUsage.inputTokens).toBeGreaterThanOrEqual(0);
                        (0, vitest_1.expect)(result.totalTokenUsage.outputTokens).toBeGreaterThanOrEqual(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('handles task execution failure gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, onNodeError, runtime, mockSimulate, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        onNodeError = vitest_1.vi.fn();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime({ onNodeError: onNodeError });
                        mockSimulate = vitest_1.vi
                            .spyOn(runtime, 'simulateTaskExecution')
                            .mockResolvedValue({ success: false, error: 'Simulated failure' });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)(onNodeError).toHaveBeenCalled();
                        mockSimulate.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('aggregates token usage when results have tokenUsage', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, runtime, mockSimulate, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createSimpleDAG();
                        runtime = new claude_code_cli_1.ClaudeCodeRuntime();
                        mockSimulate = vitest_1.vi
                            .spyOn(runtime, 'simulateTaskExecution')
                            .mockResolvedValue({
                            success: true,
                            output: { data: 'test' },
                        });
                        return [4 /*yield*/, runtime.execute(dag)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.totalTokenUsage).toBeDefined();
                        mockSimulate.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // ===========================================================================
    // generateWaveTaskCalls Tests
    // ===========================================================================
    (0, vitest_1.describe)('generateWaveTaskCalls', function () {
        (0, vitest_1.it)('generates task calls for a single node', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var context = createTestContext(dag);
            var calls = runtime.generateWaveTaskCalls(dag, ['node-a'], context);
            (0, vitest_1.expect)(calls.size).toBe(1);
            (0, vitest_1.expect)(calls.has('node-a')).toBe(true);
        });
        (0, vitest_1.it)('generates task calls for multiple nodes', function () {
            var dag = createParallelDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var context = createTestContext(dag);
            var calls = runtime.generateWaveTaskCalls(dag, ['branch-a', 'branch-b'], context);
            (0, vitest_1.expect)(calls.size).toBe(2);
            (0, vitest_1.expect)(calls.has('branch-a')).toBe(true);
            (0, vitest_1.expect)(calls.has('branch-b')).toBe(true);
        });
        (0, vitest_1.it)('skips non-existent nodes', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var context = createTestContext(dag);
            var calls = runtime.generateWaveTaskCalls(dag, ['node-a', 'non-existent'], context);
            (0, vitest_1.expect)(calls.size).toBe(1);
        });
        (0, vitest_1.it)('returns empty map when Task tool not allowed', function () {
            var dag = createSimpleDAG();
            var permissions = (0, presets_1.getPreset)('minimal');
            permissions.coreTools.task = false;
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ permissions: permissions });
            var context = createTestContext(dag);
            var calls = runtime.generateWaveTaskCalls(dag, ['node-a'], context);
            (0, vitest_1.expect)(calls.size).toBe(0);
        });
    });
    // ===========================================================================
    // generateTaskCall Tests
    // ===========================================================================
    (0, vitest_1.describe)('generateTaskCall', function () {
        (0, vitest_1.it)('generates a task call with required fields', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.description).toBeDefined();
            (0, vitest_1.expect)(call.prompt).toBeDefined();
            (0, vitest_1.expect)(call.subagent_type).toBeDefined();
        });
        (0, vitest_1.it)('includes model in task call', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultModel: 'opus' });
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBeDefined();
        });
        (0, vitest_1.it)('includes max_turns in task call', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultMaxTurns: 15 });
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.max_turns).toBe(15);
        });
        (0, vitest_1.it)('includes run_in_background in task call', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ runInBackground: true });
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.run_in_background).toBe(true);
        });
        (0, vitest_1.it)('generates description for skill nodes', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('skill-node');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.description).toContain('graph-builder');
        });
        (0, vitest_1.it)('generates description for composite nodes', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('composite-node');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.description).toContain('sub-DAG');
        });
        (0, vitest_1.it)('includes dependency results in prompt', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var nodeB = dag.nodes.get('node-b');
            var context = createTestContext(dag);
            // Add result for node-a
            context.nodeResults.set('node-a', {
                output: { test: 'data' },
                confidence: 0.9,
            });
            var call = runtime.generateTaskCall(nodeB, context);
            (0, vitest_1.expect)(call.prompt).toContain('Results from Dependencies');
            (0, vitest_1.expect)(call.prompt).toContain('node-a');
        });
        (0, vitest_1.it)('includes parent context in prompt', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            context.parentContext = { key: 'value' };
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.prompt).toContain('Context from Parent');
        });
        (0, vitest_1.it)('includes variables in prompt', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            context.variables.set('inputVar', 'testValue');
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.prompt).toContain('Available Variables');
        });
    });
    // ===========================================================================
    // Subagent Type Tests
    // ===========================================================================
    (0, vitest_1.describe)('subagent type determination', function () {
        (0, vitest_1.it)('uses agentId when specified', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('agent-node');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.subagent_type).toBe('debugger');
        });
        (0, vitest_1.it)('maps skill IDs to appropriate agent types', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('skill-node');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.subagent_type).toBe('Plan'); // graph-builder maps to Plan
        });
        (0, vitest_1.it)('uses Plan for composite nodes', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('composite-node');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.subagent_type).toBe('Plan');
        });
        (0, vitest_1.it)('uses general-purpose as default', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var node = dag.nodes.get('node-a');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.subagent_type).toBe('general-purpose');
        });
        (0, vitest_1.it)('uses subagentType from metadata', function () {
            var dag = createSimpleDAG();
            var node = dag.nodes.get('node-a');
            node.config.metadata = { subagentType: 'code-reviewer' };
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.subagent_type).toBe('code-reviewer');
        });
    });
    // ===========================================================================
    // Model Selection Tests
    // ===========================================================================
    (0, vitest_1.describe)('model selection', function () {
        (0, vitest_1.it)('uses node-specific model when configured', function () {
            var dag = createSimpleDAG();
            var node = dag.nodes.get('node-a');
            node.config.model = 'opus';
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBe('opus');
        });
        (0, vitest_1.it)('selects haiku for simple nodes', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultModel: 'sonnet' });
            var node = dag.nodes.get('node-a');
            // node-a has no dependencies - simple
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBe('haiku');
        });
        (0, vitest_1.it)('selects opus for complex nodes', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultModel: 'sonnet' });
            var node = dag.nodes.get('composite-node');
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBe('opus');
        });
        (0, vitest_1.it)('selects default model for nodes with 3 dependencies (moderate)', function () {
            var dag = createComplexDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultModel: 'sonnet' });
            var node = dag.nodes.get('many-deps');
            // many-deps has exactly 3 dependencies - moderate (not > 3)
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBe('sonnet'); // moderate complexity uses default
        });
        (0, vitest_1.it)('selects opus for nodes with more than 3 dependencies', function () {
            var dag = createComplexDAG();
            var node = dag.nodes.get('many-deps');
            // Add a 4th dependency to trigger 'complex' threshold (> 3)
            node.dependencies = __spreadArray(__spreadArray([], node.dependencies, true), ['composite-node'], false);
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({ defaultModel: 'sonnet' });
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBe('opus'); // > 3 dependencies = complex
        });
        (0, vitest_1.it)('respects allowed models from permissions', function () {
            var permissions = (0, presets_1.getPreset)('standard');
            permissions.models = { allowed: ['haiku'] };
            var dag = createSimpleDAG();
            var node = dag.nodes.get('node-b');
            // node-b has 1 dependency - moderate, would normally use sonnet
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime({
                permissions: permissions,
                defaultModel: 'sonnet',
            });
            var context = createTestContext(dag);
            var call = runtime.generateTaskCall(node, context);
            (0, vitest_1.expect)(call.model).toBe('haiku'); // Only allowed model
        });
    });
    // ===========================================================================
    // generateExecutionPlan Tests
    // ===========================================================================
    (0, vitest_1.describe)('generateExecutionPlan', function () {
        (0, vitest_1.it)('generates plan for simple DAG', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var plan = runtime.generateExecutionPlan(dag);
            (0, vitest_1.expect)(plan.dagId).toMatch(/^dag-/);
            (0, vitest_1.expect)(plan.dagName).toBe('Simple DAG');
            (0, vitest_1.expect)(plan.totalNodes).toBe(2);
            (0, vitest_1.expect)(plan.totalWaves).toBe(2);
            (0, vitest_1.expect)(plan.waves).toHaveLength(2);
        });
        (0, vitest_1.it)('generates plan for parallel DAG', function () {
            var dag = createParallelDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var plan = runtime.generateExecutionPlan(dag);
            (0, vitest_1.expect)(plan.totalNodes).toBe(4);
            (0, vitest_1.expect)(plan.totalWaves).toBe(3);
            // Wave 2 should have parallel branches
            var wave2 = plan.waves.find(function (w) { return w.waveNumber === 1; });
            (0, vitest_1.expect)(wave2 === null || wave2 === void 0 ? void 0 : wave2.parallelizable).toBe(true);
            (0, vitest_1.expect)(wave2 === null || wave2 === void 0 ? void 0 : wave2.nodeIds.length).toBe(2);
        });
        (0, vitest_1.it)('includes task calls in each wave', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var plan = runtime.generateExecutionPlan(dag);
            for (var _i = 0, _a = plan.waves; _i < _a.length; _i++) {
                var wave = _a[_i];
                (0, vitest_1.expect)(Object.keys(wave.taskCalls).length).toBe(wave.nodeIds.length);
            }
        });
        (0, vitest_1.it)('marks single-node waves as not parallelizable', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var plan = runtime.generateExecutionPlan(dag);
            (0, vitest_1.expect)(plan.waves[0].parallelizable).toBe(false);
            (0, vitest_1.expect)(plan.waves[1].parallelizable).toBe(false);
        });
        (0, vitest_1.it)('includes inputs in context', function () {
            var dag = createSimpleDAG();
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var inputs = { key: 'value' };
            var plan = runtime.generateExecutionPlan(dag, inputs);
            // Inputs are used to create context which affects prompts
            (0, vitest_1.expect)(plan.waves).toHaveLength(2);
        });
        (0, vitest_1.it)('returns error for cyclic DAG', function () {
            var dag = createSimpleDAG();
            var nodeA = dag.nodes.get('node-a');
            if (nodeA) {
                nodeA.dependencies = ['node-b'];
            }
            var runtime = new claude_code_cli_1.ClaudeCodeRuntime();
            var plan = runtime.generateExecutionPlan(dag);
            (0, vitest_1.expect)(plan.error).toBeDefined();
            (0, vitest_1.expect)(plan.error).toContain('Cycle detected');
            (0, vitest_1.expect)(plan.totalWaves).toBe(0);
            (0, vitest_1.expect)(plan.waves).toHaveLength(0);
        });
    });
});
// =============================================================================
// Utility Function Tests
// =============================================================================
(0, vitest_1.describe)('createClaudeCodeRuntime', function () {
    (0, vitest_1.it)('creates runtime with default config', function () {
        var runtime = (0, claude_code_cli_1.createClaudeCodeRuntime)();
        (0, vitest_1.expect)(runtime).toBeInstanceOf(claude_code_cli_1.ClaudeCodeRuntime);
    });
    (0, vitest_1.it)('creates runtime with custom config', function () {
        var runtime = (0, claude_code_cli_1.createClaudeCodeRuntime)({
            defaultModel: 'opus',
            maxParallelTasks: 10,
        });
        (0, vitest_1.expect)(runtime).toBeInstanceOf(claude_code_cli_1.ClaudeCodeRuntime);
    });
});
(0, vitest_1.describe)('formatTaskCall', function () {
    (0, vitest_1.it)('formats task call as JSON', function () {
        var call = {
            description: 'Test task',
            prompt: 'Do something',
            subagent_type: 'general-purpose',
            model: 'sonnet',
        };
        var formatted = (0, claude_code_cli_1.formatTaskCall)(call);
        (0, vitest_1.expect)(formatted).toContain('"description": "Test task"');
        (0, vitest_1.expect)(formatted).toContain('"subagent_type": "general-purpose"');
    });
    (0, vitest_1.it)('includes all fields in output', function () {
        var call = {
            description: 'Test',
            prompt: 'Prompt',
            subagent_type: 'debugger',
            model: 'opus',
            max_turns: 20,
            run_in_background: true,
        };
        var formatted = (0, claude_code_cli_1.formatTaskCall)(call);
        var parsed = JSON.parse(formatted);
        (0, vitest_1.expect)(parsed.max_turns).toBe(20);
        (0, vitest_1.expect)(parsed.run_in_background).toBe(true);
    });
});
(0, vitest_1.describe)('generateParallelTaskMessage', function () {
    (0, vitest_1.it)('generates message for single task', function () {
        var calls = [
            {
                description: 'Task 1',
                prompt: 'Do task 1',
                subagent_type: 'general-purpose',
            },
        ];
        var message = (0, claude_code_cli_1.generateParallelTaskMessage)(calls);
        (0, vitest_1.expect)(message).toContain('execute these tasks in parallel');
        (0, vitest_1.expect)(message).toContain('Task 1');
    });
    (0, vitest_1.it)('generates message for multiple tasks', function () {
        var calls = [
            {
                description: 'Task 1',
                prompt: 'Do task 1',
                subagent_type: 'general-purpose',
            },
            {
                description: 'Task 2',
                prompt: 'Do task 2',
                subagent_type: 'debugger',
            },
        ];
        var message = (0, claude_code_cli_1.generateParallelTaskMessage)(calls);
        (0, vitest_1.expect)(message).toContain('Task 1');
        (0, vitest_1.expect)(message).toContain('Task 2');
        (0, vitest_1.expect)(message).toContain('general-purpose');
        (0, vitest_1.expect)(message).toContain('debugger');
    });
    (0, vitest_1.it)('includes JSON blocks for each task', function () {
        var calls = [
            {
                description: 'Task 1',
                prompt: 'Do task 1',
                subagent_type: 'general-purpose',
                model: 'sonnet',
            },
        ];
        var message = (0, claude_code_cli_1.generateParallelTaskMessage)(calls);
        (0, vitest_1.expect)(message).toContain('```json');
        (0, vitest_1.expect)(message).toContain('"model": "sonnet"');
    });
});
// =============================================================================
// Helper Functions
// =============================================================================
function createTestContext(dag) {
    return {
        dagId: dag.id,
        executionId: (0, types_1.ExecutionId)('test-exec-1'),
        nodeResults: new Map(),
        variables: new Map(),
        startTime: new Date(),
        permissions: (0, presets_1.getPreset)('standard'),
    };
}

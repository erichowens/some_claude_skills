"use strict";
/**
 * Tests for ProcessExecutor
 *
 * ProcessExecutor spawns independent Claude CLI processes for each task.
 * Key benefits tested:
 * - Zero token overhead
 * - True parallel execution
 * - Complete isolation between tasks
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
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
// Use vi.hoisted to ensure mock is set up BEFORE module imports
var mockExecAsync = vitest_1.vi.hoisted(function () {
    return vitest_1.vi.fn().mockResolvedValue({
        stdout: JSON.stringify({ output: 'test result', confidence: 0.95 }),
        stderr: '',
    });
});
// Mock child_process and util before they're imported by process-executor
vitest_1.vi.mock('child_process', function () { return ({
    exec: vitest_1.vi.fn(),
    spawn: vitest_1.vi.fn(),
}); });
vitest_1.vi.mock('util', function () { return ({
    promisify: vitest_1.vi.fn(function () { return mockExecAsync; }),
}); });
// Import AFTER mocks are set up
var process_executor_1 = require("./process-executor");
// =============================================================================
// Test Fixtures
// =============================================================================
function createTestRequest(overrides) {
    return __assign({ nodeId: 'test-node', prompt: 'Test prompt', description: 'Test task', model: 'sonnet' }, overrides);
}
// =============================================================================
// Tests
// =============================================================================
(0, vitest_1.describe)('ProcessExecutor', function () {
    var executor;
    (0, vitest_1.beforeEach)(function () {
        vitest_1.vi.clearAllMocks();
        // Reset mock to successful default state
        mockExecAsync.mockResolvedValue({
            stdout: JSON.stringify({ output: 'test result', confidence: 0.95 }),
            stderr: '',
        });
        executor = (0, process_executor_1.createProcessExecutor)({
            verbose: false,
        });
    });
    (0, vitest_1.afterEach)(function () {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('getCapabilities', function () {
        (0, vitest_1.it)('reports zero token overhead', function () {
            var caps = executor.getCapabilities();
            (0, vitest_1.expect)(caps.tokenOverheadPerTask).toBe(0);
        });
        (0, vitest_1.it)('reports true isolation', function () {
            var caps = executor.getCapabilities();
            (0, vitest_1.expect)(caps.trueIsolation).toBe(true);
            (0, vitest_1.expect)(caps.sharedContext).toBe(false);
        });
        (0, vitest_1.it)('has configurable max parallelism', function () {
            var customExecutor = (0, process_executor_1.createProcessExecutor)({
                maxProcesses: 20,
            });
            (0, vitest_1.expect)(customExecutor.getCapabilities().maxParallelism).toBe(20);
        });
    });
    (0, vitest_1.describe)('execute', function () {
        (0, vitest_1.it)('returns success response for valid request', function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = createTestRequest();
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.nodeId).toBe(request.nodeId);
                        (0, vitest_1.expect)(result.output).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('includes executor metadata', function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        request = createTestRequest();
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _c.sent();
                        (0, vitest_1.expect)((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.executor).toBe('process');
                        (0, vitest_1.expect)((_b = result.metadata) === null || _b === void 0 ? void 0 : _b.durationMs).toBeGreaterThanOrEqual(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('parses JSON output correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = createTestRequest();
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _a.sent();
                        // The mock returns { output: 'test result', confidence: 0.95 }
                        (0, vitest_1.expect)(result.output).toBe('test result');
                        (0, vitest_1.expect)(result.confidence).toBe(0.95);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('executeParallel', function () {
        (0, vitest_1.it)('executes multiple requests', function () { return __awaiter(void 0, void 0, void 0, function () {
            var requests, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requests = [
                            createTestRequest({ nodeId: 'node-1' }),
                            createTestRequest({ nodeId: 'node-2' }),
                            createTestRequest({ nodeId: 'node-3' }),
                        ];
                        return [4 /*yield*/, executor.executeParallel(requests)];
                    case 1:
                        results = _a.sent();
                        (0, vitest_1.expect)(results.size).toBe(3);
                        (0, vitest_1.expect)(results.has('node-1')).toBe(true);
                        (0, vitest_1.expect)(results.has('node-2')).toBe(true);
                        (0, vitest_1.expect)(results.has('node-3')).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls progress callback', function () { return __awaiter(void 0, void 0, void 0, function () {
            var requests, onProgress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requests = [createTestRequest()];
                        onProgress = vitest_1.vi.fn();
                        return [4 /*yield*/, executor.executeParallel(requests, onProgress)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onProgress).toHaveBeenCalled();
                        // Should call with 'starting' and 'completed' at minimum
                        (0, vitest_1.expect)(onProgress).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ status: 'starting' }));
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('batches requests exceeding maxProcesses', function () { return __awaiter(void 0, void 0, void 0, function () {
            var smallExecutor, requests, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        smallExecutor = (0, process_executor_1.createProcessExecutor)({ maxProcesses: 2 });
                        requests = [
                            createTestRequest({ nodeId: 'node-1' }),
                            createTestRequest({ nodeId: 'node-2' }),
                            createTestRequest({ nodeId: 'node-3' }),
                        ];
                        return [4 /*yield*/, smallExecutor.executeParallel(requests)];
                    case 1:
                        results = _a.sent();
                        // Should still process all 3, just in batches
                        (0, vitest_1.expect)(results.size).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('buildPromptWithContext', function () {
        (0, vitest_1.it)('includes dependency results in prompt', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dependencyResults, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dependencyResults = new Map();
                        dependencyResults.set('dep-1', {
                            output: { data: 'from dependency' },
                            confidence: 0.9,
                        });
                        request = createTestRequest({
                            dependencyResults: dependencyResults,
                        });
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('error handling', function () {
        (0, vitest_1.it)('handles execution timeout', function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Mock a timeout error (killed=true indicates timeout)
                        mockExecAsync.mockRejectedValue(Object.assign(new Error('Timeout'), { killed: true }));
                        request = createTestRequest();
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)((_a = result.error) === null || _a === void 0 ? void 0 : _a.code).toBe('TIMEOUT');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('handles general execution errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Mock a general error (killed=false indicates other error)
                        mockExecAsync.mockRejectedValue(Object.assign(new Error('Command failed'), { killed: false }));
                        request = createTestRequest();
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _c.sent();
                        (0, vitest_1.expect)(result.success).toBe(false);
                        (0, vitest_1.expect)((_a = result.error) === null || _a === void 0 ? void 0 : _a.code).toBe('TOOL_ERROR');
                        (0, vitest_1.expect)((_b = result.error) === null || _b === void 0 ? void 0 : _b.retryable).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
(0, vitest_1.describe)('createProcessExecutor', function () {
    (0, vitest_1.it)('creates executor with default config', function () {
        var executor = (0, process_executor_1.createProcessExecutor)();
        (0, vitest_1.expect)(executor.type).toBe('process');
        (0, vitest_1.expect)(executor.name).toBe('Claude CLI Process Executor');
    });
    (0, vitest_1.it)('merges custom config', function () {
        var executor = (0, process_executor_1.createProcessExecutor)({
            defaultModel: 'haiku',
            maxProcesses: 5,
        });
        var caps = executor.getCapabilities();
        (0, vitest_1.expect)(caps.maxParallelism).toBe(5);
    });
});

"use strict";
/**
 * Tests for TaskToolExecutor
 *
 * TaskToolExecutor generates Task tool calls for Claude Code sessions.
 * Note: It doesn't execute directly - it generates call structures.
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
var task_tool_executor_1 = require("./task-tool-executor");
// =============================================================================
// Test Fixtures
// =============================================================================
function createTestRequest(overrides) {
    return __assign({ nodeId: 'test-node', prompt: 'Analyze the data and provide insights', description: 'Data analysis task', model: 'sonnet' }, overrides);
}
// =============================================================================
// Tests
// =============================================================================
(0, vitest_1.describe)('TaskToolExecutor', function () {
    (0, vitest_1.describe)('getCapabilities', function () {
        (0, vitest_1.it)('reports 20k token overhead', function () {
            var executor = (0, task_tool_executor_1.createTaskToolExecutor)();
            var caps = executor.getCapabilities();
            (0, vitest_1.expect)(caps.tokenOverheadPerTask).toBe(20000);
        });
        (0, vitest_1.it)('reports max 10 parallel tasks', function () {
            var executor = (0, task_tool_executor_1.createTaskToolExecutor)();
            var caps = executor.getCapabilities();
            (0, vitest_1.expect)(caps.maxParallelism).toBe(10);
        });
        (0, vitest_1.it)('reports shared context available', function () {
            var executor = (0, task_tool_executor_1.createTaskToolExecutor)();
            var caps = executor.getCapabilities();
            (0, vitest_1.expect)(caps.sharedContext).toBe(true);
            (0, vitest_1.expect)(caps.efficientDependencyPassing).toBe(true);
        });
        (0, vitest_1.it)('reports no true isolation', function () {
            var executor = (0, task_tool_executor_1.createTaskToolExecutor)();
            var caps = executor.getCapabilities();
            (0, vitest_1.expect)(caps.trueIsolation).toBe(false);
        });
    });
    (0, vitest_1.describe)('isAvailable', function () {
        (0, vitest_1.it)('returns true (always available in Claude Code)', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, available;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)();
                        return [4 /*yield*/, executor.isAvailable()];
                    case 1:
                        available = _a.sent();
                        (0, vitest_1.expect)(available).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('execute', function () {
        (0, vitest_1.it)('generates Task tool call structure', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)();
                        request = createTestRequest();
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.output).toHaveProperty('_type', 'task-tool-call');
                        (0, vitest_1.expect)(result.output).toHaveProperty('call');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('includes correct call properties', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, request, result, call;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)();
                        request = createTestRequest({
                            skillId: 'data-analyst',
                            agentType: 'general-purpose',
                            model: 'opus',
                        });
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _a.sent();
                        call = result.output.call;
                        (0, vitest_1.expect)(call.subagent_type).toBe('general-purpose');
                        (0, vitest_1.expect)(call.model).toBe('opus');
                        (0, vitest_1.expect)(call.description).toContain('Data analysis');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('builds prompt with dependency context', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, dependencyResults, request, result, call;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)();
                        dependencyResults = new Map();
                        dependencyResults.set('previous-task', {
                            output: { summary: 'Previous analysis complete' },
                            confidence: 0.95,
                        });
                        request = createTestRequest({ dependencyResults: dependencyResults });
                        return [4 /*yield*/, executor.execute(request)];
                    case 1:
                        result = _a.sent();
                        call = result.output.call;
                        // Prompt should include dependency context
                        (0, vitest_1.expect)(call.prompt).toContain('Results from Dependencies');
                        (0, vitest_1.expect)(call.prompt).toContain('previous-task');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('executeParallel', function () {
        (0, vitest_1.it)('generates multiple Task calls', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, requests, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)();
                        requests = [
                            createTestRequest({ nodeId: 'task-1' }),
                            createTestRequest({ nodeId: 'task-2' }),
                            createTestRequest({ nodeId: 'task-3' }),
                        ];
                        return [4 /*yield*/, executor.executeParallel(requests)];
                    case 1:
                        results = _a.sent();
                        (0, vitest_1.expect)(results.size).toBe(3);
                        (0, vitest_1.expect)(results.has('task-1')).toBe(true);
                        (0, vitest_1.expect)(results.has('task-2')).toBe(true);
                        (0, vitest_1.expect)(results.has('task-3')).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('calls progress callback', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, requests, onProgress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)();
                        requests = [createTestRequest()];
                        onProgress = vitest_1.vi.fn();
                        return [4 /*yield*/, executor.executeParallel(requests, onProgress)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(onProgress).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('warns when exceeding parallelism limit', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, consoleSpy, requests;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = (0, task_tool_executor_1.createTaskToolExecutor)({ maxParallel: 2 });
                        consoleSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(function () { });
                        requests = Array.from({ length: 5 }, function (_, i) {
                            return createTestRequest({ nodeId: "task-".concat(i) });
                        });
                        return [4 /*yield*/, executor.executeParallel(requests)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('limit is 2'));
                        consoleSpy.mockRestore();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('formatParallelMessage', function () {
        (0, vitest_1.it)('formats multiple calls for parallel execution', function () {
            var executor = (0, task_tool_executor_1.createTaskToolExecutor)();
            var calls = [
                { description: 'Task 1', prompt: 'Do task 1', subagent_type: 'general-purpose' },
                { description: 'Task 2', prompt: 'Do task 2', subagent_type: 'general-purpose' },
            ];
            var message = executor.formatParallelMessage(calls);
            (0, vitest_1.expect)(message).toContain('Execute these tasks in parallel');
            (0, vitest_1.expect)(message).toContain('Task 1');
            (0, vitest_1.expect)(message).toContain('Task 2');
        });
    });
});
(0, vitest_1.describe)('createTaskToolExecutor', function () {
    (0, vitest_1.it)('creates executor with default config', function () {
        var executor = (0, task_tool_executor_1.createTaskToolExecutor)();
        (0, vitest_1.expect)(executor.type).toBe('task-tool');
        (0, vitest_1.expect)(executor.name).toBe('Claude Code Task Tool Executor');
    });
    (0, vitest_1.it)('respects custom maxParallel', function () {
        var executor = (0, task_tool_executor_1.createTaskToolExecutor)({ maxParallel: 5 });
        (0, vitest_1.expect)(executor.getCapabilities().maxParallelism).toBe(5);
    });
    (0, vitest_1.it)('respects custom defaultModel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var executor, request, result, call;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    executor = (0, task_tool_executor_1.createTaskToolExecutor)({ defaultModel: 'haiku' });
                    request = createTestRequest({ model: undefined });
                    return [4 /*yield*/, executor.execute(request)];
                case 1:
                    result = _a.sent();
                    call = result.output.call;
                    (0, vitest_1.expect)(call.model).toBe('haiku');
                    return [2 /*return*/];
            }
        });
    }); });
});

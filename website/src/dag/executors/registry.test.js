"use strict";
/**
 * Tests for Executor Registry
 *
 * The registry manages executor factories and enables smart selection
 * based on task requirements.
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
var registry_1 = require("./registry");
// Mock the executors to avoid actual CLI checks
vitest_1.vi.mock('./process-executor', function () { return ({
    ProcessExecutor: /** @class */ (function () {
        function class_1() {
            this.type = 'process';
            this.name = 'Mock Process Executor';
        }
        class_1.prototype.isAvailable = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, true];
                });
            });
        };
        class_1.prototype.getCapabilities = function () {
            return {
                maxParallelism: 10,
                tokenOverheadPerTask: 0,
                sharedContext: false,
                supportsStreaming: true,
                trueIsolation: true,
            };
        };
        return class_1;
    }()),
    createProcessExecutor: vitest_1.vi.fn(function () { return ({
        type: 'process',
        name: 'Mock Process Executor',
        isAvailable: vitest_1.vi.fn().mockResolvedValue(true),
        getCapabilities: vitest_1.vi.fn().mockReturnValue({
            maxParallelism: 10,
            tokenOverheadPerTask: 0,
            sharedContext: false,
            supportsStreaming: true,
            trueIsolation: true,
        }),
    }); }),
}); });
vitest_1.vi.mock('./worktree-executor', function () { return ({
    WorktreeExecutor: /** @class */ (function () {
        function class_2() {
            this.type = 'worktree';
            this.name = 'Mock Worktree Executor';
        }
        return class_2;
    }()),
    createWorktreeExecutor: vitest_1.vi.fn(function () { return ({
        type: 'worktree',
        name: 'Mock Worktree Executor',
        isAvailable: vitest_1.vi.fn().mockResolvedValue(true),
        getCapabilities: vitest_1.vi.fn().mockReturnValue({
            maxParallelism: 5,
            tokenOverheadPerTask: 0,
            sharedContext: false,
            supportsStreaming: false,
            trueIsolation: true,
        }),
    }); }),
}); });
vitest_1.vi.mock('./task-tool-executor', function () { return ({
    TaskToolExecutor: /** @class */ (function () {
        function class_3() {
            this.type = 'task-tool';
            this.name = 'Mock Task Tool Executor';
        }
        return class_3;
    }()),
    createTaskToolExecutor: vitest_1.vi.fn(function () { return ({
        type: 'task-tool',
        name: 'Mock Task Tool Executor',
        isAvailable: vitest_1.vi.fn().mockResolvedValue(true),
        getCapabilities: vitest_1.vi.fn().mockReturnValue({
            maxParallelism: 10,
            tokenOverheadPerTask: 20000,
            sharedContext: true,
            supportsStreaming: false,
            trueIsolation: false,
        }),
    }); }),
}); });
// =============================================================================
// Tests
// =============================================================================
(0, vitest_1.describe)('ExecutorRegistry', function () {
    (0, vitest_1.describe)('listTypes', function () {
        (0, vitest_1.it)('lists all registered executor types', function () {
            var types = registry_1.executorRegistry.listTypes();
            (0, vitest_1.expect)(types).toContain('process');
            (0, vitest_1.expect)(types).toContain('worktree');
            (0, vitest_1.expect)(types).toContain('task-tool');
        });
    });
    (0, vitest_1.describe)('getDefault', function () {
        (0, vitest_1.it)('returns the default executor (process)', function () {
            var executor = registry_1.executorRegistry.getDefault();
            (0, vitest_1.expect)(executor.type).toBe('process');
        });
    });
    (0, vitest_1.describe)('setDefault', function () {
        (0, vitest_1.it)('changes the default executor', function () {
            // Save original default
            var original = registry_1.executorRegistry.getDefault().type;
            registry_1.executorRegistry.setDefault('worktree');
            (0, vitest_1.expect)(registry_1.executorRegistry.getDefault().type).toBe('worktree');
            // Restore
            registry_1.executorRegistry.setDefault(original);
        });
        (0, vitest_1.it)('throws for unknown type', function () {
            (0, vitest_1.expect)(function () {
                registry_1.executorRegistry.setDefault('unknown');
            }).toThrow('Unknown executor type');
        });
    });
    (0, vitest_1.describe)('createByType', function () {
        (0, vitest_1.it)('creates executor by type string', function () {
            var executor = registry_1.executorRegistry.createByType('process');
            (0, vitest_1.expect)(executor.type).toBe('process');
        });
    });
});
(0, vitest_1.describe)('selectBestExecutor', function () {
    (0, vitest_1.it)('selects zero-overhead executor when minimizeTokens is true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requirements, executor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requirements = {
                        minimizeTokens: true,
                    };
                    return [4 /*yield*/, (0, registry_1.selectBestExecutor)(requirements)];
                case 1:
                    executor = _a.sent();
                    // Should prefer process or worktree (both have 0 overhead)
                    (0, vitest_1.expect)(executor.getCapabilities().tokenOverheadPerTask).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('selects isolated executor when needsIsolation is true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requirements, executor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requirements = {
                        needsIsolation: true,
                    };
                    return [4 /*yield*/, (0, registry_1.selectBestExecutor)(requirements)];
                case 1:
                    executor = _a.sent();
                    (0, vitest_1.expect)(executor.getCapabilities().trueIsolation).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('selects shared context executor when needed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requirements, executor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requirements = {
                        needsSharedContext: true,
                    };
                    return [4 /*yield*/, (0, registry_1.selectBestExecutor)(requirements)];
                case 1:
                    executor = _a.sent();
                    (0, vitest_1.expect)(executor.getCapabilities().sharedContext).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('considers parallelism requirements', function () { return __awaiter(void 0, void 0, void 0, function () {
        var requirements, executor, caps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requirements = {
                        parallelTasks: 8,
                    };
                    return [4 /*yield*/, (0, registry_1.selectBestExecutor)(requirements)];
                case 1:
                    executor = _a.sent();
                    caps = executor.getCapabilities();
                    // Should select one that supports 8+ parallel tasks
                    (0, vitest_1.expect)(caps.maxParallelism).toBeGreaterThanOrEqual(8);
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('compareExecutors', function () {
    (0, vitest_1.it)('returns comparison for all registered executors', function () { return __awaiter(void 0, void 0, void 0, function () {
        var comparisons, _i, comparisons_1, comp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, registry_1.compareExecutors)()];
                case 1:
                    comparisons = _a.sent();
                    (0, vitest_1.expect)(comparisons.length).toBeGreaterThanOrEqual(3);
                    // Each comparison should have required fields
                    for (_i = 0, comparisons_1 = comparisons; _i < comparisons_1.length; _i++) {
                        comp = comparisons_1[_i];
                        (0, vitest_1.expect)(comp.type).toBeDefined();
                        (0, vitest_1.expect)(comp.name).toBeDefined();
                        (0, vitest_1.expect)(typeof comp.available).toBe('boolean');
                        (0, vitest_1.expect)(comp.capabilities).toBeDefined();
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('includes capability details', function () { return __awaiter(void 0, void 0, void 0, function () {
        var comparisons, processComp, taskToolComp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, registry_1.compareExecutors)()];
                case 1:
                    comparisons = _a.sent();
                    processComp = comparisons.find(function (c) { return c.type === 'process'; });
                    (0, vitest_1.expect)(processComp === null || processComp === void 0 ? void 0 : processComp.capabilities.tokenOverheadPerTask).toBe(0);
                    taskToolComp = comparisons.find(function (c) { return c.type === 'task-tool'; });
                    (0, vitest_1.expect)(taskToolComp === null || taskToolComp === void 0 ? void 0 : taskToolComp.capabilities.tokenOverheadPerTask).toBe(20000);
                    return [2 /*return*/];
            }
        });
    }); });
});

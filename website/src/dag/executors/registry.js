"use strict";
/**
 * Executor Registry
 *
 * Central registry for all available executors.
 * Allows dynamic selection based on task requirements and environment.
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
exports.executorRegistry = void 0;
exports.selectBestExecutor = selectBestExecutor;
exports.compareExecutors = compareExecutors;
var process_executor_1 = require("./process-executor");
var worktree_executor_1 = require("./worktree-executor");
var task_tool_executor_1 = require("./task-tool-executor");
/**
 * Default executor registry implementation
 */
var DefaultExecutorRegistry = /** @class */ (function () {
    function DefaultExecutorRegistry() {
        this.factories = new Map();
        this.defaultType = 'process';
        // Register built-in executors
        this.register('process', function (config) {
            return (0, process_executor_1.createProcessExecutor)(config);
        });
        this.register('worktree', function (config) {
            return (0, worktree_executor_1.createWorktreeExecutor)(config);
        });
        this.register('task-tool', function (config) {
            return (0, task_tool_executor_1.createTaskToolExecutor)(config);
        });
    }
    DefaultExecutorRegistry.prototype.register = function (type, factory) {
        this.factories.set(type, factory);
    };
    DefaultExecutorRegistry.prototype.create = function (config) {
        var factory = this.factories.get(config.type);
        if (!factory) {
            throw new Error("Unknown executor type: ".concat(config.type));
        }
        return factory(config);
    };
    DefaultExecutorRegistry.prototype.listTypes = function () {
        return Array.from(this.factories.keys());
    };
    DefaultExecutorRegistry.prototype.getDefault = function () {
        return this.create({ type: this.defaultType });
    };
    DefaultExecutorRegistry.prototype.setDefault = function (type) {
        if (!this.factories.has(type)) {
            throw new Error("Unknown executor type: ".concat(type));
        }
        this.defaultType = type;
    };
    /**
     * Create an executor by type (convenience method)
     */
    DefaultExecutorRegistry.prototype.createByType = function (type) {
        return this.create({ type: type });
    };
    return DefaultExecutorRegistry;
}());
// Singleton registry instance
exports.executorRegistry = new DefaultExecutorRegistry();
/**
 * Smart executor selector
 *
 * Chooses the best executor based on requirements.
 */
function selectBestExecutor(requirements) {
    return __awaiter(this, void 0, void 0, function () {
        var candidates, _i, _a, type, executor, caps, score;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    candidates = [];
                    _i = 0, _a = exports.executorRegistry.listTypes();
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    type = _a[_i];
                    executor = exports.executorRegistry.createByType(type);
                    return [4 /*yield*/, executor.isAvailable()];
                case 2:
                    // Check availability
                    if (!(_b.sent())) {
                        return [3 /*break*/, 3];
                    }
                    caps = executor.getCapabilities();
                    score = 0;
                    // Score based on requirements
                    if (requirements.needsIsolation && caps.trueIsolation) {
                        score += 30;
                    }
                    if (requirements.parallelTasks) {
                        if (!caps.maxParallelism || caps.maxParallelism >= requirements.parallelTasks) {
                            score += 20;
                        }
                    }
                    if (requirements.minimizeTokens && caps.tokenOverheadPerTask === 0) {
                        score += 25;
                    }
                    if (requirements.needsSharedContext && caps.sharedContext) {
                        score += 20;
                    }
                    if (requirements.needsStreaming && caps.supportsStreaming) {
                        score += 10;
                    }
                    candidates.push({ executor: executor, score: score });
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (candidates.length === 0) {
                        throw new Error('No available executor meets requirements');
                    }
                    // Sort by score descending
                    candidates.sort(function (a, b) { return b.score - a.score; });
                    return [2 /*return*/, candidates[0].executor];
            }
        });
    });
}
/**
 * Get comparison of all available executors
 */
function compareExecutors() {
    return __awaiter(this, void 0, void 0, function () {
        var comparisons, _i, _a, type, executor, available, caps;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    comparisons = [];
                    _i = 0, _a = exports.executorRegistry.listTypes();
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    type = _a[_i];
                    executor = exports.executorRegistry.createByType(type);
                    return [4 /*yield*/, executor.isAvailable()];
                case 2:
                    available = _b.sent();
                    caps = executor.getCapabilities();
                    comparisons.push({
                        type: type,
                        name: executor.name,
                        available: available,
                        capabilities: caps,
                    });
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, comparisons];
            }
        });
    });
}

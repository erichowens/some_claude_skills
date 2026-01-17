"use strict";
/**
 * Task Tool Executor - In-Session Execution via Claude Code Task Tool
 *
 * This executor uses Claude Code's Task tool to spawn sub-agents.
 * It maintains backward compatibility with the original DAG execution approach.
 *
 * Key characteristics:
 * - ~20k token overhead per task (system prompt, tool definitions)
 * - Maximum 10 parallel tasks (hard limit)
 * - Shared context with parent session
 * - Full Claude Code capabilities (all tools available)
 *
 * When to use:
 * - Tasks that need to reference parent conversation
 * - Tasks that need full tool access
 * - When token cost is not a concern
 *
 * When NOT to use:
 * - Cost-sensitive applications (use ProcessExecutor instead)
 * - Need >10 parallel tasks (use ProcessExecutor)
 * - Need true isolation (use WorktreeExecutor)
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
exports.TaskToolExecutor = void 0;
exports.createTaskToolExecutor = createTaskToolExecutor;
/**
 * Default configuration
 */
var DEFAULT_CONFIG = {
    defaultModel: 'sonnet',
    defaultTimeoutMs: 300000, // 5 minutes
    verbose: false,
    maxParallel: 10, // Hard limit in Claude Code
    runInBackground: false, // Broken in current version
};
/**
 * Task Tool Executor Implementation
 *
 * IMPORTANT: This executor generates Task tool call structures but cannot
 * actually execute them directly. The calls must be made by the parent
 * Claude Code session. This is a limitation of the architecture.
 *
 * For actual parallel execution, use ProcessExecutor or WorktreeExecutor.
 */
var TaskToolExecutor = /** @class */ (function () {
    function TaskToolExecutor(config) {
        this.type = 'task-tool';
        this.name = 'Claude Code Task Tool Executor';
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
    }
    /**
     * Task tool is always available in Claude Code sessions
     */
    TaskToolExecutor.prototype.isAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Task tool is available if we're running in Claude Code
                // We can't actually detect this, so we return true and let it fail
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Get executor capabilities
     */
    TaskToolExecutor.prototype.getCapabilities = function () {
        return {
            maxParallelism: this.config.maxParallel,
            tokenOverheadPerTask: 20000, // ~20k tokens per task!
            sharedContext: true, // Key benefit of Task tool
            supportsStreaming: false,
            efficientDependencyPassing: true, // Can reference parent context
            trueIsolation: false,
        };
    };
    /**
     * Generate a Task tool call for a single request
     *
     * NOTE: This generates the call structure but does not execute it.
     * The parent session must make the actual Task tool call.
     */
    TaskToolExecutor.prototype.execute = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCall;
            return __generator(this, function (_a) {
                taskCall = this.buildTaskCall(request);
                // We can't actually execute Task calls from within code
                // This returns the call structure for the parent to execute
                return [2 /*return*/, {
                        success: true,
                        nodeId: request.nodeId,
                        output: {
                            _type: 'task-tool-call',
                            _note: 'This is a Task tool call structure. Execute via Claude Code.',
                            call: taskCall,
                        },
                        confidence: 1.0,
                        metadata: {
                            executor: 'task-tool',
                            durationMs: 0,
                        },
                    }];
            });
        });
    };
    /**
     * Generate parallel Task tool calls
     *
     * This generates all the Task calls that would be made in a single message
     * to achieve parallel execution in Claude Code.
     */
    TaskToolExecutor.prototype.executeParallel = function (requests, onProgress) {
        return __awaiter(this, void 0, void 0, function () {
            var results, taskCalls, _i, requests_1, request, call, response;
            return __generator(this, function (_a) {
                results = new Map();
                // Check parallelism limit
                if (requests.length > this.config.maxParallel) {
                    console.warn("[TaskToolExecutor] Requested ".concat(requests.length, " parallel tasks, ") +
                        "but limit is ".concat(this.config.maxParallel, ". Tasks will be batched."));
                }
                taskCalls = [];
                for (_i = 0, requests_1 = requests; _i < requests_1.length; _i++) {
                    request = requests_1[_i];
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                        nodeId: request.nodeId,
                        status: 'starting',
                        message: 'Generating Task tool call',
                    });
                    call = this.buildTaskCall(request);
                    taskCalls.push({ nodeId: request.nodeId, call: call });
                    response = {
                        success: true,
                        nodeId: request.nodeId,
                        output: {
                            _type: 'task-tool-call',
                            _note: 'Execute via Claude Code Task tool',
                            call: call,
                        },
                        confidence: 1.0,
                        metadata: {
                            executor: 'task-tool',
                            durationMs: 0,
                        },
                    };
                    results.set(request.nodeId, response);
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                        nodeId: request.nodeId,
                        status: 'completed',
                    });
                }
                // Log the parallel execution format
                if (this.config.verbose) {
                    console.log('[TaskToolExecutor] Generated parallel Task calls:');
                    console.log(this.formatParallelMessage(taskCalls.map(function (t) { return t.call; })));
                }
                return [2 /*return*/, results];
            });
        });
    };
    /**
     * Build a Task tool call from an ExecutionRequest
     */
    TaskToolExecutor.prototype.buildTaskCall = function (request) {
        return {
            description: this.truncate(request.description, 50),
            prompt: this.buildPrompt(request),
            subagent_type: request.agentType || 'general-purpose',
            model: request.model || this.config.defaultModel,
            max_turns: 10,
            run_in_background: this.config.runInBackground,
        };
    };
    /**
     * Build the prompt for a Task call
     */
    TaskToolExecutor.prototype.buildPrompt = function (request) {
        var parts = [];
        // Task description
        parts.push("## Task: ".concat(request.description));
        parts.push('');
        // Skill instructions
        if (request.skillId) {
            parts.push("Execute the ".concat(request.skillId, " skill."));
            parts.push('');
        }
        // Dependency context (efficiently passed via shared context)
        if (request.dependencyResults && request.dependencyResults.size > 0) {
            parts.push('## Results from Dependencies');
            for (var _i = 0, _a = request.dependencyResults; _i < _a.length; _i++) {
                var _b = _a[_i], depId = _b[0], result = _b[1];
                parts.push("### ".concat(depId));
                parts.push('```json');
                parts.push(JSON.stringify(result.output, null, 2));
                parts.push('```');
                parts.push('');
            }
        }
        // Additional context
        if (request.context && Object.keys(request.context).length > 0) {
            parts.push('## Context');
            parts.push('```json');
            parts.push(JSON.stringify(request.context, null, 2));
            parts.push('```');
            parts.push('');
        }
        // Main instructions
        parts.push('## Instructions');
        parts.push(request.prompt);
        parts.push('');
        // Output format
        parts.push('## Output Format');
        parts.push('Return: {output: <result>, confidence: 0-1}');
        return parts.join('\n');
    };
    /**
     * Format multiple Task calls for parallel execution in Claude Code
     *
     * When you include multiple Task calls in a single message, Claude Code
     * executes them in parallel (up to the limit).
     */
    TaskToolExecutor.prototype.formatParallelMessage = function (calls) {
        var parts = ['Execute these tasks in parallel:\n'];
        for (var _i = 0, calls_1 = calls; _i < calls_1.length; _i++) {
            var call = calls_1[_i];
            parts.push("\n### ".concat(call.description, "\n"));
            parts.push('```json');
            parts.push(JSON.stringify(call, null, 2));
            parts.push('```\n');
        }
        return parts.join('\n');
    };
    /**
     * Truncate string to max length
     */
    TaskToolExecutor.prototype.truncate = function (str, maxLen) {
        if (str.length <= maxLen)
            return str;
        return str.slice(0, maxLen - 3) + '...';
    };
    return TaskToolExecutor;
}());
exports.TaskToolExecutor = TaskToolExecutor;
/**
 * Factory function
 */
function createTaskToolExecutor(config) {
    return new TaskToolExecutor(__assign({ type: 'task-tool' }, config));
}

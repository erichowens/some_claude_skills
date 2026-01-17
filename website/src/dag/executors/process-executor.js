"use strict";
/**
 * Process Executor - Parallel Execution via claude -p
 *
 * This executor spawns independent Claude CLI processes for each task.
 * Key benefits:
 * - ZERO token overhead (no Task tool context loading)
 * - TRUE parallel execution (limited by machine, not API)
 * - Complete isolation between tasks
 *
 * Tradeoffs:
 * - No shared context (must pass everything in prompt)
 * - Requires output parsing (JSON format recommended)
 * - Each process starts fresh (no conversation history)
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
exports.ProcessExecutor = void 0;
exports.createProcessExecutor = createProcessExecutor;
var child_process_1 = require("child_process");
var util_1 = require("util");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Default configuration
 */
var DEFAULT_CONFIG = {
    defaultModel: 'sonnet',
    defaultTimeoutMs: 300000, // 5 minutes
    verbose: false,
    claudePath: 'claude',
    outputFormat: 'json',
    maxProcesses: 10,
    cwd: process.cwd(),
};
/**
 * Process Executor Implementation
 *
 * Executes DAG nodes by spawning claude -p processes.
 * Each process is completely independent - no shared state.
 */
var ProcessExecutor = /** @class */ (function () {
    function ProcessExecutor(config) {
        this.type = 'process';
        this.name = 'Claude CLI Process Executor';
        this.activeProcesses = new Map();
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
    }
    /**
     * Check if claude CLI is available
     */
    ProcessExecutor.prototype.isAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, execAsync("".concat(this.config.claudePath, " --version"))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get executor capabilities
     */
    ProcessExecutor.prototype.getCapabilities = function () {
        return {
            maxParallelism: this.config.maxProcesses,
            tokenOverheadPerTask: 0, // No Task tool overhead!
            sharedContext: false,
            supportsStreaming: true,
            efficientDependencyPassing: false, // Must serialize in prompt
            trueIsolation: true,
        };
    };
    /**
     * Execute a single task via claude -p
     */
    ProcessExecutor.prototype.execute = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, fullPrompt, escapedPrompt, model, cmd, _a, stdout, stderr, result, error_1, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        fullPrompt = this.buildPromptWithContext(request);
                        escapedPrompt = this.escapeForShell(fullPrompt);
                        model = request.model || this.config.defaultModel;
                        cmd = "".concat(this.config.claudePath, " -p \"").concat(escapedPrompt, "\" --output-format ").concat(this.config.outputFormat, " --model ").concat(model);
                        if (this.config.verbose) {
                            console.log("[ProcessExecutor] Running: ".concat(request.nodeId));
                        }
                        return [4 /*yield*/, execAsync(cmd, {
                                cwd: this.config.cwd,
                                timeout: request.timeoutMs || this.config.defaultTimeoutMs,
                                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                            })];
                    case 2:
                        _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                        result = this.parseOutput(stdout, request.nodeId);
                        return [2 /*return*/, {
                                success: true,
                                nodeId: request.nodeId,
                                output: result.output,
                                confidence: result.confidence || 0.9,
                                metadata: {
                                    executor: 'process',
                                    durationMs: Date.now() - startTime,
                                    rawOutput: stdout,
                                },
                            }];
                    case 3:
                        error_1 = _b.sent();
                        err = error_1;
                        return [2 /*return*/, {
                                success: false,
                                nodeId: request.nodeId,
                                error: {
                                    code: err.killed ? 'TIMEOUT' : 'TOOL_ERROR',
                                    message: err.message,
                                    sourceNodeId: request.nodeId,
                                    retryable: !err.killed,
                                },
                                metadata: {
                                    executor: 'process',
                                    durationMs: Date.now() - startTime,
                                    exitCode: err.code ? parseInt(err.code) : undefined,
                                },
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute multiple tasks in parallel
     *
     * This is where ProcessExecutor shines - TRUE parallelism
     * without the Task tool's 10-task limit or token overhead.
     */
    ProcessExecutor.prototype.executeParallel = function (requests, onProgress) {
        return __awaiter(this, void 0, void 0, function () {
            var results, batches, _i, batches_1, batch, _a, batch_1, req, batchPromises, batchResults, _b, batchResults_1, result;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = new Map();
                        batches = this.batchRequests(requests, this.config.maxProcesses);
                        _i = 0, batches_1 = batches;
                        _c.label = 1;
                    case 1:
                        if (!(_i < batches_1.length)) return [3 /*break*/, 4];
                        batch = batches_1[_i];
                        // Notify starting
                        for (_a = 0, batch_1 = batch; _a < batch_1.length; _a++) {
                            req = batch_1[_a];
                            onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                nodeId: req.nodeId,
                                status: 'starting',
                                message: "Spawning claude process for ".concat(req.nodeId),
                            });
                        }
                        batchPromises = batch.map(function (req) { return __awaiter(_this, void 0, void 0, function () {
                            var result;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                            nodeId: req.nodeId,
                                            status: 'running',
                                        });
                                        return [4 /*yield*/, this.execute(req)];
                                    case 1:
                                        result = _b.sent();
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                            nodeId: req.nodeId,
                                            status: result.success ? 'completed' : 'failed',
                                            message: (_a = result.error) === null || _a === void 0 ? void 0 : _a.message,
                                        });
                                        return [2 /*return*/, result];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(batchPromises)];
                    case 2:
                        batchResults = _c.sent();
                        // Collect results
                        for (_b = 0, batchResults_1 = batchResults; _b < batchResults_1.length; _b++) {
                            result = batchResults_1[_b];
                            results.set(result.nodeId, result);
                        }
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Clean up any running processes
     */
    ProcessExecutor.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, nodeId, proc;
            return __generator(this, function (_c) {
                for (_i = 0, _a = this.activeProcesses; _i < _a.length; _i++) {
                    _b = _a[_i], nodeId = _b[0], proc = _b[1];
                    try {
                        proc.kill('SIGTERM');
                        console.log("[ProcessExecutor] Killed process for ".concat(nodeId));
                    }
                    catch (_d) {
                        // Process may already be dead
                    }
                }
                this.activeProcesses.clear();
                return [2 /*return*/];
            });
        });
    };
    // ===========================================================================
    // PRIVATE HELPERS
    // ===========================================================================
    /**
     * Build prompt with dependency results baked in
     *
     * Since processes don't share context, we must include
     * all dependency results in the prompt itself.
     */
    ProcessExecutor.prototype.buildPromptWithContext = function (request) {
        var parts = [];
        // Task description
        parts.push("# Task: ".concat(request.description));
        parts.push('');
        // Skill/agent context
        if (request.skillId) {
            parts.push("You are executing the \"".concat(request.skillId, "\" skill."));
            parts.push('');
        }
        // Dependency results (compact format to minimize tokens)
        if (request.dependencyResults && request.dependencyResults.size > 0) {
            parts.push('## Context from Previous Steps');
            for (var _i = 0, _a = request.dependencyResults; _i < _a.length; _i++) {
                var _b = _a[_i], depId = _b[0], result = _b[1];
                // Only include essential output, not full result
                var output = this.summarizeOutput(result.output);
                parts.push("- ".concat(depId, ": ").concat(output));
            }
            parts.push('');
        }
        // Additional context
        if (request.context && Object.keys(request.context).length > 0) {
            parts.push('## Additional Context');
            parts.push(JSON.stringify(request.context, null, 2));
            parts.push('');
        }
        // Main prompt
        parts.push('## Instructions');
        parts.push(request.prompt);
        parts.push('');
        // Output format
        parts.push('## Output Format');
        parts.push('Respond with valid JSON: {"output": <your result>, "confidence": 0.0-1.0}');
        return parts.join('\n');
    };
    /**
     * Summarize output for context passing
     * Keep it minimal to avoid token bloat
     */
    ProcessExecutor.prototype.summarizeOutput = function (output) {
        if (output === null || output === undefined) {
            return 'completed';
        }
        if (typeof output === 'string') {
            return output.length > 200 ? output.slice(0, 200) + '...' : output;
        }
        if (typeof output === 'object') {
            var str = JSON.stringify(output);
            return str.length > 200 ? str.slice(0, 200) + '...' : str;
        }
        return String(output);
    };
    /**
     * Escape prompt for shell execution
     */
    ProcessExecutor.prototype.escapeForShell = function (prompt) {
        // Replace double quotes with escaped quotes
        // Replace newlines with literal \n
        return prompt
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\$/g, '\\$')
            .replace(/`/g, '\\`');
    };
    /**
     * Parse output from claude -p
     */
    ProcessExecutor.prototype.parseOutput = function (stdout, nodeId) {
        try {
            // Try to parse as JSON
            var parsed = JSON.parse(stdout.trim());
            // Handle wrapped format
            if (parsed.output !== undefined) {
                return {
                    output: parsed.output,
                    confidence: parsed.confidence,
                };
            }
            // Handle raw format
            return { output: parsed };
        }
        catch (_a) {
            // If not JSON, treat as text output
            return {
                output: stdout.trim(),
                confidence: 0.7, // Lower confidence for unparsed output
            };
        }
    };
    /**
     * Split requests into batches
     */
    ProcessExecutor.prototype.batchRequests = function (requests, batchSize) {
        var batches = [];
        for (var i = 0; i < requests.length; i += batchSize) {
            batches.push(requests.slice(i, i + batchSize));
        }
        return batches;
    };
    return ProcessExecutor;
}());
exports.ProcessExecutor = ProcessExecutor;
/**
 * Factory function
 */
function createProcessExecutor(config) {
    return new ProcessExecutor(__assign({ type: 'process' }, config));
}

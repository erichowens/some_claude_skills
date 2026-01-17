"use strict";
/**
 * Worktree Executor - True Parallel Isolation via Git Worktrees
 *
 * This executor creates separate git worktrees for each task,
 * running fully independent Claude sessions.
 *
 * Key benefits:
 * - UNLIMITED parallelism (limited only by machine resources)
 * - ZERO token overhead (each session starts fresh)
 * - TRUE file isolation (no conflicts possible)
 * - Full Claude sessions (not just prompts)
 *
 * Tradeoffs:
 * - Requires git repository
 * - Creates branches that need merging
 * - Higher setup/teardown cost
 * - More complex coordination
 *
 * Inspired by:
 * - Crystal (github.com/stravu/crystal)
 * - Claude Squad
 * - GitButler hooks
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
exports.WorktreeExecutor = void 0;
exports.createWorktreeExecutor = createWorktreeExecutor;
var child_process_1 = require("child_process");
var util_1 = require("util");
var path = require("path");
var fs = require("fs/promises");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Default configuration
 */
var DEFAULT_CONFIG = {
    defaultModel: 'sonnet',
    defaultTimeoutMs: 600000, // 10 minutes (longer for full sessions)
    verbose: false,
    worktreeBaseDir: '../.dag-worktrees',
    branchPrefix: 'dag/',
    autoMerge: false,
    maxWorktrees: 5, // Conservative default
};
/**
 * Worktree Executor Implementation
 *
 * Creates isolated git worktrees and runs Claude sessions in each.
 */
var WorktreeExecutor = /** @class */ (function () {
    function WorktreeExecutor(config) {
        this.type = 'worktree';
        this.name = 'Git Worktree Executor';
        this.worktrees = new Map();
        this.repoRoot = null;
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
    }
    /**
     * Check if git worktrees are available
     */
    WorktreeExecutor.prototype.isAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        // Check if we're in a git repo
                        return [4 /*yield*/, execAsync('git rev-parse --git-dir')];
                    case 1:
                        // Check if we're in a git repo
                        _b.sent();
                        // Check if git worktree command exists
                        return [4 /*yield*/, execAsync('git worktree --help')];
                    case 2:
                        // Check if git worktree command exists
                        _b.sent();
                        // Check if claude CLI is available
                        return [4 /*yield*/, execAsync('claude --version')];
                    case 3:
                        // Check if claude CLI is available
                        _b.sent();
                        return [2 /*return*/, true];
                    case 4:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get executor capabilities
     */
    WorktreeExecutor.prototype.getCapabilities = function () {
        return {
            maxParallelism: this.config.maxWorktrees,
            tokenOverheadPerTask: 0, // No Task tool overhead!
            sharedContext: false,
            supportsStreaming: false, // Could implement with file watching
            efficientDependencyPassing: false, // Must write to files
            trueIsolation: true,
        };
    };
    /**
     * Execute a single task in a worktree
     */
    WorktreeExecutor.prototype.execute = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, worktreeState, result, output, error_1, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        worktreeState = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        // Ensure we know the repo root
                        return [4 /*yield*/, this.findRepoRoot()];
                    case 2:
                        // Ensure we know the repo root
                        _a.sent();
                        return [4 /*yield*/, this.createWorktree(request.nodeId)];
                    case 3:
                        // Create worktree for this task
                        worktreeState = _a.sent();
                        this.worktrees.set(request.nodeId, worktreeState);
                        // Write task instructions to worktree
                        return [4 /*yield*/, this.writeTaskInstructions(worktreeState, request)];
                    case 4:
                        // Write task instructions to worktree
                        _a.sent();
                        return [4 /*yield*/, this.runClaudeInWorktree(worktreeState, request)];
                    case 5:
                        result = _a.sent();
                        return [4 /*yield*/, this.readResults(worktreeState)];
                    case 6:
                        output = _a.sent();
                        worktreeState.status = 'completed';
                        return [2 /*return*/, {
                                success: true,
                                nodeId: request.nodeId,
                                output: output.output,
                                confidence: output.confidence || 0.9,
                                metadata: {
                                    executor: 'worktree',
                                    durationMs: Date.now() - startTime,
                                    branch: worktreeState.branchName,
                                },
                            }];
                    case 7:
                        error_1 = _a.sent();
                        err = error_1;
                        if (worktreeState) {
                            worktreeState.status = 'failed';
                        }
                        return [2 /*return*/, {
                                success: false,
                                nodeId: request.nodeId,
                                error: {
                                    code: 'TOOL_ERROR',
                                    message: err.message,
                                    sourceNodeId: request.nodeId,
                                    retryable: true,
                                },
                                metadata: {
                                    executor: 'worktree',
                                    durationMs: Date.now() - startTime,
                                    branch: worktreeState === null || worktreeState === void 0 ? void 0 : worktreeState.branchName,
                                },
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute multiple tasks in parallel worktrees
     */
    WorktreeExecutor.prototype.executeParallel = function (requests, onProgress) {
        return __awaiter(this, void 0, void 0, function () {
            var results, batches, _i, batches_1, batch, createPromises, created, runPromises, runResults, _a, runResults_1, result, state;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = new Map();
                        batches = this.batchRequests(requests, this.config.maxWorktrees);
                        _i = 0, batches_1 = batches;
                        _c.label = 1;
                    case 1:
                        if (!(_i < batches_1.length)) return [3 /*break*/, 5];
                        batch = batches_1[_i];
                        createPromises = batch.map(function (req) { return __awaiter(_this, void 0, void 0, function () {
                            var state, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                            nodeId: req.nodeId,
                                            status: 'starting',
                                            message: "Creating worktree for ".concat(req.nodeId),
                                        });
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, this.createWorktree(req.nodeId)];
                                    case 2:
                                        state = _a.sent();
                                        this.worktrees.set(req.nodeId, state);
                                        return [4 /*yield*/, this.writeTaskInstructions(state, req)];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/, { req: req, state: state, error: null }];
                                    case 4:
                                        error_2 = _a.sent();
                                        return [2 /*return*/, { req: req, state: null, error: error_2 }];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(createPromises)];
                    case 2:
                        created = _c.sent();
                        runPromises = created.map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var output, error_3;
                            var req = _b.req, state = _b.state, error = _b.error;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (error || !state) {
                                            return [2 /*return*/, {
                                                    nodeId: req.nodeId,
                                                    success: false,
                                                    error: error,
                                                }];
                                        }
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                            nodeId: req.nodeId,
                                            status: 'running',
                                            message: "Running Claude in ".concat(state.branchName),
                                        });
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, this.runClaudeInWorktree(state, req)];
                                    case 2:
                                        _c.sent();
                                        return [4 /*yield*/, this.readResults(state)];
                                    case 3:
                                        output = _c.sent();
                                        state.status = 'completed';
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                            nodeId: req.nodeId,
                                            status: 'completed',
                                        });
                                        return [2 /*return*/, {
                                                nodeId: req.nodeId,
                                                success: true,
                                                output: output,
                                            }];
                                    case 4:
                                        error_3 = _c.sent();
                                        state.status = 'failed';
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                            nodeId: req.nodeId,
                                            status: 'failed',
                                            message: error_3.message,
                                        });
                                        return [2 /*return*/, {
                                                nodeId: req.nodeId,
                                                success: false,
                                                error: error_3,
                                            }];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(runPromises)];
                    case 3:
                        runResults = _c.sent();
                        // Collect results
                        for (_a = 0, runResults_1 = runResults; _a < runResults_1.length; _a++) {
                            result = runResults_1[_a];
                            state = this.worktrees.get(result.nodeId);
                            if (result.success && result.output) {
                                results.set(result.nodeId, {
                                    success: true,
                                    nodeId: result.nodeId,
                                    output: result.output.output,
                                    confidence: result.output.confidence || 0.9,
                                    metadata: {
                                        executor: 'worktree',
                                        durationMs: 0, // TODO: track per-task
                                        branch: state === null || state === void 0 ? void 0 : state.branchName,
                                    },
                                });
                            }
                            else {
                                results.set(result.nodeId, {
                                    success: false,
                                    nodeId: result.nodeId,
                                    error: {
                                        code: 'TOOL_ERROR',
                                        message: ((_b = result.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error',
                                        sourceNodeId: result.nodeId,
                                        retryable: true,
                                    },
                                    metadata: {
                                        executor: 'worktree',
                                        durationMs: 0,
                                        branch: state === null || state === void 0 ? void 0 : state.branchName,
                                    },
                                });
                            }
                        }
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Clean up all worktrees
     */
    WorktreeExecutor.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, nodeId, state, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = this.worktrees;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        _b = _a[_i], nodeId = _b[0], state = _b[1];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, , 6]);
                        // Kill any running processes
                        if (state.process) {
                            state.process.kill('SIGTERM');
                        }
                        // Remove worktree
                        return [4 /*yield*/, execAsync("git worktree remove --force \"".concat(state.worktreePath, "\""), {
                                cwd: this.repoRoot,
                            })];
                    case 3:
                        // Remove worktree
                        _c.sent();
                        // Delete branch (optional)
                        return [4 /*yield*/, execAsync("git branch -D \"".concat(state.branchName, "\""), {
                                cwd: this.repoRoot,
                            }).catch(function () {
                                // Branch may not exist or be checked out
                            })];
                    case 4:
                        // Delete branch (optional)
                        _c.sent();
                        if (this.config.verbose) {
                            console.log("[WorktreeExecutor] Cleaned up ".concat(nodeId));
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_4 = _c.sent();
                        console.warn("[WorktreeExecutor] Failed to cleanup ".concat(nodeId, ":"), error_4);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7:
                        this.worktrees.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Merge all completed worktrees back to main branch
     */
    WorktreeExecutor.prototype.mergeAll = function () {
        return __awaiter(this, arguments, void 0, function (targetBranch) {
            var mergeResults, _i, _a, _b, nodeId, state, error_5;
            if (targetBranch === void 0) { targetBranch = 'main'; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        mergeResults = new Map();
                        _i = 0, _a = this.worktrees;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        _b = _a[_i], nodeId = _b[0], state = _b[1];
                        if (state.status !== 'completed') {
                            mergeResults.set(nodeId, false);
                            return [3 /*break*/, 6];
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, , 6]);
                        state.status = 'merging';
                        // Checkout target branch
                        return [4 /*yield*/, execAsync("git checkout ".concat(targetBranch), {
                                cwd: this.repoRoot,
                            })];
                    case 3:
                        // Checkout target branch
                        _c.sent();
                        // Merge worktree branch
                        return [4 /*yield*/, execAsync("git merge ".concat(state.branchName, " --no-edit"), {
                                cwd: this.repoRoot,
                            })];
                    case 4:
                        // Merge worktree branch
                        _c.sent();
                        mergeResults.set(nodeId, true);
                        if (this.config.verbose) {
                            console.log("[WorktreeExecutor] Merged ".concat(state.branchName));
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_5 = _c.sent();
                        console.warn("[WorktreeExecutor] Merge failed for ".concat(nodeId, ":"), error_5);
                        mergeResults.set(nodeId, false);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, mergeResults];
                }
            });
        });
    };
    // ===========================================================================
    // PRIVATE HELPERS
    // ===========================================================================
    /**
     * Find git repository root
     */
    WorktreeExecutor.prototype.findRepoRoot = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stdout;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.repoRoot)
                            return [2 /*return*/];
                        return [4 /*yield*/, execAsync('git rev-parse --show-toplevel')];
                    case 1:
                        stdout = (_a.sent()).stdout;
                        this.repoRoot = stdout.trim();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a worktree for a node
     */
    WorktreeExecutor.prototype.createWorktree = function (nodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var branchName, worktreePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        branchName = "".concat(this.config.branchPrefix).concat(nodeId, "-").concat(Date.now());
                        worktreePath = path.resolve(this.repoRoot, this.config.worktreeBaseDir, nodeId);
                        // Ensure base directory exists
                        return [4 /*yield*/, fs.mkdir(path.dirname(worktreePath), { recursive: true })];
                    case 1:
                        // Ensure base directory exists
                        _a.sent();
                        // Create worktree with new branch
                        return [4 /*yield*/, execAsync("git worktree add -b \"".concat(branchName, "\" \"").concat(worktreePath, "\""), { cwd: this.repoRoot })];
                    case 2:
                        // Create worktree with new branch
                        _a.sent();
                        return [2 /*return*/, {
                                nodeId: nodeId,
                                worktreePath: worktreePath,
                                branchName: branchName,
                                status: 'creating',
                            }];
                }
            });
        });
    };
    /**
     * Write task instructions to worktree
     */
    WorktreeExecutor.prototype.writeTaskInstructions = function (state, request) {
        return __awaiter(this, void 0, void 0, function () {
            var taskContent, taskPath, resultsDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        taskContent = this.buildTaskFile(request);
                        taskPath = path.join(state.worktreePath, 'TASK.md');
                        return [4 /*yield*/, fs.writeFile(taskPath, taskContent, 'utf-8')];
                    case 1:
                        _a.sent();
                        resultsDir = path.join(state.worktreePath, '.dag-results');
                        return [4 /*yield*/, fs.mkdir(resultsDir, { recursive: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build TASK.md content
     */
    WorktreeExecutor.prototype.buildTaskFile = function (request) {
        var lines = [];
        lines.push("# Task: ".concat(request.description));
        lines.push('');
        lines.push("**Node ID:** ".concat(request.nodeId));
        lines.push("**Skill:** ".concat(request.skillId || 'general'));
        lines.push("**Model:** ".concat(request.model || this.config.defaultModel));
        lines.push('');
        lines.push('## Instructions');
        lines.push('');
        lines.push(request.prompt);
        lines.push('');
        if (request.dependencyResults && request.dependencyResults.size > 0) {
            lines.push('## Context from Dependencies');
            lines.push('');
            for (var _i = 0, _a = request.dependencyResults; _i < _a.length; _i++) {
                var _b = _a[_i], depId = _b[0], result = _b[1];
                lines.push("### ".concat(depId));
                lines.push('```json');
                lines.push(JSON.stringify(result.output, null, 2));
                lines.push('```');
                lines.push('');
            }
        }
        lines.push('## Output');
        lines.push('');
        lines.push('When complete, write your results to `.dag-results/output.json`:');
        lines.push('```json');
        lines.push('{"output": <your result>, "confidence": 0.0-1.0}');
        lines.push('```');
        return lines.join('\n');
    };
    /**
     * Run Claude in a worktree
     */
    WorktreeExecutor.prototype.runClaudeInWorktree = function (state, request) {
        return __awaiter(this, void 0, void 0, function () {
            var taskPath, taskContent, prompt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        state.status = 'running';
                        taskPath = path.join(state.worktreePath, 'TASK.md');
                        return [4 /*yield*/, fs.readFile(taskPath, 'utf-8')];
                    case 1:
                        taskContent = _a.sent();
                        prompt = "Read and execute the task in TASK.md. Write your results to .dag-results/output.json.\n\n".concat(taskContent);
                        return [4 /*yield*/, execAsync("claude -p \"".concat(this.escapeForShell(prompt), "\" --output-format json"), {
                                cwd: state.worktreePath,
                                timeout: request.timeoutMs || this.config.defaultTimeoutMs,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Read results from worktree
     */
    WorktreeExecutor.prototype.readResults = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            var outputPath, content, _a, stdout;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        outputPath = path.join(state.worktreePath, '.dag-results', 'output.json');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, fs.readFile(outputPath, 'utf-8')];
                    case 2:
                        content = _b.sent();
                        return [2 /*return*/, JSON.parse(content)];
                    case 3:
                        _a = _b.sent();
                        return [4 /*yield*/, execAsync('git diff --stat', {
                                cwd: state.worktreePath,
                            })];
                    case 4:
                        stdout = (_b.sent()).stdout;
                        return [2 /*return*/, {
                                output: {
                                    changes: stdout.trim() || 'No changes detected',
                                    branch: state.branchName,
                                },
                                confidence: 0.7,
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Escape prompt for shell
     */
    WorktreeExecutor.prototype.escapeForShell = function (prompt) {
        return prompt
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\$/g, '\\$')
            .replace(/`/g, '\\`');
    };
    /**
     * Batch requests
     */
    WorktreeExecutor.prototype.batchRequests = function (requests, batchSize) {
        var batches = [];
        for (var i = 0; i < requests.length; i += batchSize) {
            batches.push(requests.slice(i, i + batchSize));
        }
        return batches;
    };
    return WorktreeExecutor;
}());
exports.WorktreeExecutor = WorktreeExecutor;
/**
 * Factory function
 */
function createWorktreeExecutor(config) {
    return new WorktreeExecutor(__assign({ type: 'worktree' }, config));
}

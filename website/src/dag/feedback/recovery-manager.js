"use strict";
/**
 * Recovery Manager
 *
 * Handles failed task recovery with intelligent strategy selection.
 * Uses synthesized feedback to determine the best recovery approach:
 * - retry-same: Retry unchanged (transient errors)
 * - retry-with-feedback: Retry with improvement guidance
 * - decompose-further: Break task into smaller subtasks
 * - escalate-model: Try with a more powerful model
 * - human-intervention: Request human assistance
 * - skip-with-fallback: Skip and use default/fallback output
 *
 * @module dag/feedback/recovery-manager
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
exports.recoveryManager = exports.RecoveryManager = void 0;
exports.attemptRecovery = attemptRecovery;
exports.createRecoveryManager = createRecoveryManager;
// =============================================================================
// RECOVERY MANAGER CLASS
// =============================================================================
/**
 * RecoveryManager handles intelligent task recovery after failures.
 *
 * @example
 * ```typescript
 * const recoveryManager = new RecoveryManager({
 *   maxAttempts: 3,
 *   modelEscalation: ['haiku', 'sonnet', 'opus'],
 * });
 *
 * const result = await recoveryManager.recover(
 *   executor,
 *   failedResponse,
 *   originalRequest,
 *   synthesizedFeedback
 * );
 *
 * if (result.success) {
 *   console.log('Recovered successfully:', result.output);
 * } else {
 *   console.log('Recovery failed:', result.terminationReason);
 * }
 * ```
 */
var RecoveryManager = /** @class */ (function () {
    function RecoveryManager(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.config = {
            maxAttempts: (_a = config.maxAttempts) !== null && _a !== void 0 ? _a : 3,
            modelEscalation: (_b = config.modelEscalation) !== null && _b !== void 0 ? _b : ['haiku', 'sonnet', 'opus'],
            defaultFallback: (_c = config.defaultFallback) !== null && _c !== void 0 ? _c : null,
            onHumanRequired: (_d = config.onHumanRequired) !== null && _d !== void 0 ? _d : (function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, null];
            }); }); }),
            onDecompose: (_e = config.onDecompose) !== null && _e !== void 0 ? _e : (function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, []];
            }); }); }),
            verbose: (_f = config.verbose) !== null && _f !== void 0 ? _f : false,
        };
    }
    /**
     * Attempt to recover from a failed task execution
     */
    RecoveryManager.prototype.recover = function (executor, failedResponse, originalRequest, feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, attempts, totalTokenUsage, context, selection, humanResponse, fallbackResponse, subtasks, modifiedRequest, attemptStart, response, attemptEnd, attempt;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        attempts = [];
                        totalTokenUsage = { inputTokens: 0, outputTokens: 0 };
                        context = {
                            originalRequest: originalRequest,
                            failedResponse: failedResponse,
                            feedback: feedback,
                            previousAttempts: [],
                            maxAttempts: this.config.maxAttempts,
                            modelEscalation: this.config.modelEscalation,
                        };
                        _b.label = 1;
                    case 1:
                        if (!(attempts.length < this.config.maxAttempts)) return [3 /*break*/, 7];
                        // Update context with previous attempts
                        context.previousAttempts = __spreadArray([], attempts, true);
                        selection = this.selectStrategy(context);
                        if (this.config.verbose) {
                            console.log("[RecoveryManager] Attempt ".concat(attempts.length + 1, ": ").concat(selection.strategy, " (").concat(selection.reasoning, ")"));
                        }
                        if (!(selection.strategy === 'human-intervention')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.config.onHumanRequired(context)];
                    case 2:
                        humanResponse = _b.sent();
                        if (humanResponse === null || humanResponse === void 0 ? void 0 : humanResponse.success) {
                            attempts.push({
                                attemptNumber: attempts.length + 1,
                                strategy: 'human-intervention',
                                startedAt: new Date(),
                                completedAt: new Date(),
                                success: true,
                            });
                            return [2 /*return*/, this.buildResult(true, humanResponse, attempts, startTime, 'success', totalTokenUsage)];
                        }
                        return [2 /*return*/, this.buildResult(false, failedResponse, attempts, startTime, 'human-required', totalTokenUsage)];
                    case 3:
                        // Handle skip with fallback
                        if (selection.strategy === 'skip-with-fallback') {
                            attempts.push({
                                attemptNumber: attempts.length + 1,
                                strategy: 'skip-with-fallback',
                                startedAt: new Date(),
                                completedAt: new Date(),
                                success: true,
                            });
                            fallbackResponse = {
                                success: true,
                                nodeId: originalRequest.nodeId,
                                output: this.config.defaultFallback,
                                confidence: 0.3,
                                metadata: {
                                    executor: executor.type,
                                    durationMs: 0,
                                },
                            };
                            return [2 /*return*/, this.buildResult(true, fallbackResponse, attempts, startTime, 'skipped', totalTokenUsage)];
                        }
                        if (!(selection.strategy === 'decompose-further')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.config.onDecompose(originalRequest)];
                    case 4:
                        subtasks = _b.sent();
                        if (subtasks.length === 0) {
                            // Can't decompose, try next strategy
                            attempts.push({
                                attemptNumber: attempts.length + 1,
                                strategy: 'decompose-further',
                                startedAt: new Date(),
                                completedAt: new Date(),
                                success: false,
                                error: 'Unable to decompose task further',
                            });
                            return [3 /*break*/, 1];
                        }
                        // Execute subtasks (simplified - in practice would be more sophisticated)
                        // For now, just mark as needing decomposition and continue
                        attempts.push({
                            attemptNumber: attempts.length + 1,
                            strategy: 'decompose-further',
                            startedAt: new Date(),
                            completedAt: new Date(),
                            success: false,
                            error: 'Decomposition requires external orchestration',
                        });
                        return [3 /*break*/, 1];
                    case 5:
                        modifiedRequest = this.buildModifiedRequest(originalRequest, selection, context);
                        attemptStart = new Date();
                        return [4 /*yield*/, executor.execute(modifiedRequest)];
                    case 6:
                        response = _b.sent();
                        attemptEnd = new Date();
                        // Track token usage
                        if (response.tokenUsage) {
                            totalTokenUsage.inputTokens += response.tokenUsage.inputTokens;
                            totalTokenUsage.outputTokens += response.tokenUsage.outputTokens;
                        }
                        attempt = {
                            attemptNumber: attempts.length + 1,
                            strategy: selection.strategy,
                            startedAt: attemptStart,
                            completedAt: attemptEnd,
                            success: response.success,
                            modifiedPrompt: modifiedRequest.prompt !== originalRequest.prompt ? modifiedRequest.prompt : undefined,
                            model: modifiedRequest.model,
                            error: (_a = response.error) === null || _a === void 0 ? void 0 : _a.message,
                        };
                        attempts.push(attempt);
                        if (response.success) {
                            return [2 /*return*/, this.buildResult(true, response, attempts, startTime, 'success', totalTokenUsage)];
                        }
                        // Update context with the new failed response for next iteration
                        context.failedResponse = response;
                        return [3 /*break*/, 1];
                    case 7: 
                    // Max attempts reached
                    return [2 /*return*/, this.buildResult(false, failedResponse, attempts, startTime, 'max-attempts', totalTokenUsage)];
                }
            });
        });
    };
    /**
     * Select the best recovery strategy based on context
     */
    RecoveryManager.prototype.selectStrategy = function (context) {
        var failedResponse = context.failedResponse, feedback = context.feedback, previousAttempts = context.previousAttempts, modelEscalation = context.modelEscalation;
        var error = failedResponse.error;
        var attemptCount = previousAttempts.length;
        // If no error info, try retry-same first
        if (!error) {
            return {
                strategy: 'retry-same',
                confidence: 0.5,
                reasoning: 'No error details, attempting simple retry',
            };
        }
        // Check error type
        var errorBehavior = this.classifyError(error.code);
        // Transient errors → retry-same
        if (errorBehavior === 'transient' && attemptCount < 2) {
            return {
                strategy: 'retry-same',
                confidence: 0.8,
                reasoning: "Transient error (".concat(error.code, "), attempting retry"),
            };
        }
        // Check if feedback suggests critical issues
        if (feedback) {
            var hasChriticalIssues = feedback.criticalItems.length > 0;
            var assessment = feedback.assessment;
            // Critical issues → retry with feedback
            if (hasChriticalIssues && attemptCount === 0) {
                return {
                    strategy: 'retry-with-feedback',
                    confidence: 0.85,
                    reasoning: "".concat(feedback.criticalItems.length, " critical issues identified, retry with guidance"),
                };
            }
            // Low grade + already tried feedback → escalate model
            if (assessment.grade === 'F' || assessment.grade === 'D') {
                var currentModelIndex = modelEscalation.indexOf(context.originalRequest.model || 'sonnet');
                if (currentModelIndex < modelEscalation.length - 1) {
                    return {
                        strategy: 'escalate-model',
                        confidence: 0.75,
                        reasoning: "Quality too low (".concat(assessment.grade, "), escalating to more capable model"),
                    };
                }
            }
        }
        // Model errors → escalate model (if not already at highest)
        if (errorBehavior === 'model-limitation') {
            var usedStrategies = new Set(previousAttempts.map(function (a) { return a.strategy; }));
            if (!usedStrategies.has('escalate-model')) {
                var currentModelIndex = modelEscalation.indexOf(context.originalRequest.model || 'sonnet');
                if (currentModelIndex < modelEscalation.length - 1) {
                    return {
                        strategy: 'escalate-model',
                        confidence: 0.7,
                        reasoning: "Model limitation detected, escalating",
                    };
                }
            }
        }
        // Complex task detection → decompose
        if (errorBehavior === 'complexity' || this.isComplexTask(context.originalRequest)) {
            var usedStrategies = new Set(previousAttempts.map(function (a) { return a.strategy; }));
            if (!usedStrategies.has('decompose-further')) {
                return {
                    strategy: 'decompose-further',
                    confidence: 0.6,
                    reasoning: 'Task appears too complex, attempting decomposition',
                };
            }
        }
        // Unrecoverable errors → human intervention
        if (errorBehavior === 'unrecoverable') {
            return {
                strategy: 'human-intervention',
                confidence: 0.9,
                reasoning: "Unrecoverable error (".concat(error.code, "), human assistance required"),
            };
        }
        // If we've tried multiple strategies without success → fallback
        if (attemptCount >= 2) {
            var usedStrategies = new Set(previousAttempts.map(function (a) { return a.strategy; }));
            if (usedStrategies.size >= 2) {
                return {
                    strategy: 'skip-with-fallback',
                    confidence: 0.7,
                    reasoning: 'Multiple strategies failed, using fallback',
                };
            }
        }
        // Default: retry with feedback if we have it, otherwise retry same
        if (feedback && feedback.revisionPrompt) {
            return {
                strategy: 'retry-with-feedback',
                confidence: 0.6,
                reasoning: 'Using feedback for improved retry',
            };
        }
        return {
            strategy: 'retry-same',
            confidence: 0.4,
            reasoning: 'No better strategy identified, attempting retry',
        };
    };
    /**
     * Classify error type into behavioral categories
     */
    RecoveryManager.prototype.classifyError = function (code) {
        switch (code) {
            // Transient errors (worth retrying as-is)
            case 'TIMEOUT':
            case 'RATE_LIMITED':
                return 'transient';
            // Model limitations (escalate)
            case 'MODEL_ERROR':
            case 'TOOL_ERROR':
                return 'model-limitation';
            // Complexity issues (decompose)
            case 'INVALID_OUTPUT':
            case 'SCHEMA_MISMATCH':
                return 'complexity';
            // Unrecoverable (human needed)
            case 'PERMISSION_DENIED':
            case 'SCOPE_VIOLATION':
            case 'ISOLATION_BREACH':
            case 'CYCLE_DETECTED':
            case 'MISSING_DEPENDENCY':
                return 'unrecoverable';
            // Unknown (try retry with feedback)
            default:
                return 'unknown';
        }
    };
    /**
     * Detect if a task is likely too complex for single execution
     */
    RecoveryManager.prototype.isComplexTask = function (request) {
        var _a;
        // Heuristics for complexity
        var promptLength = request.prompt.length;
        var hasManyDependencies = (((_a = request.dependencyResults) === null || _a === void 0 ? void 0 : _a.size) || 0) > 5;
        var hasCodeGenMarkers = /implement|create|build|develop/.test(request.prompt.toLowerCase());
        var hasMultipleSteps = /\d\.\s|\bfirst\b|\bthen\b|\bfinally\b/i.test(request.prompt);
        return (promptLength > 5000 ||
            (hasManyDependencies && hasCodeGenMarkers) ||
            hasMultipleSteps);
    };
    /**
     * Build a modified request based on selected strategy
     */
    RecoveryManager.prototype.buildModifiedRequest = function (original, selection, context) {
        var _a;
        var modified = __assign({}, original);
        switch (selection.strategy) {
            case 'retry-same':
                // No modifications
                break;
            case 'retry-with-feedback':
                if ((_a = context.feedback) === null || _a === void 0 ? void 0 : _a.revisionPrompt) {
                    modified.prompt = this.augmentPromptWithFeedback(original.prompt, context.feedback);
                }
                break;
            case 'escalate-model':
                var currentModelIndex = this.config.modelEscalation.indexOf(original.model || 'sonnet');
                if (currentModelIndex < this.config.modelEscalation.length - 1) {
                    modified.model = this.config.modelEscalation[currentModelIndex + 1];
                }
                break;
            default:
                break;
        }
        // Apply any modifications from selection
        if (selection.modifiedRequest) {
            Object.assign(modified, selection.modifiedRequest);
        }
        return modified;
    };
    /**
     * Augment prompt with feedback for retry
     */
    RecoveryManager.prototype.augmentPromptWithFeedback = function (originalPrompt, feedback) {
        var parts = [
            '=== PREVIOUS ATTEMPT FEEDBACK ===',
            feedback.summary,
            '',
            feedback.revisionPrompt,
            '',
            '=== ORIGINAL TASK ===',
            originalPrompt,
        ];
        return parts.join('\n');
    };
    /**
     * Build the final recovery result
     */
    RecoveryManager.prototype.buildResult = function (success, response, attempts, startTime, terminationReason, tokenUsage) {
        var finalStrategy = attempts.length > 0
            ? attempts[attempts.length - 1].strategy
            : 'retry-same';
        return {
            success: success,
            nodeId: response.nodeId,
            output: response.output,
            confidence: response.confidence,
            attempts: attempts,
            totalDurationMs: Date.now() - startTime,
            finalStrategy: finalStrategy,
            terminationReason: terminationReason,
            totalTokenUsage: tokenUsage.inputTokens > 0 ? tokenUsage : undefined,
        };
    };
    /**
     * Get a summary of recovery capabilities
     */
    RecoveryManager.prototype.getCapabilities = function () {
        return {
            maxAttempts: this.config.maxAttempts,
            availableStrategies: [
                'retry-same',
                'retry-with-feedback',
                'decompose-further',
                'escalate-model',
                'human-intervention',
                'skip-with-fallback',
            ],
            modelEscalation: this.config.modelEscalation,
        };
    };
    return RecoveryManager;
}());
exports.RecoveryManager = RecoveryManager;
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/** Default recovery manager instance */
exports.recoveryManager = new RecoveryManager();
/**
 * Quick recovery attempt with default settings
 */
function attemptRecovery(executor, failedResponse, originalRequest, feedback) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.recoveryManager.recover(executor, failedResponse, originalRequest, feedback)];
        });
    });
}
/**
 * Create a configured recovery manager
 */
function createRecoveryManager(config) {
    return new RecoveryManager(config);
}

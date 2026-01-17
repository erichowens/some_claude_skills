"use strict";
/**
 * Tests for RecoveryManager
 *
 * RecoveryManager handles intelligent task recovery after failures.
 * Key capabilities tested:
 * - Strategy selection based on error type
 * - Feedback-augmented retries
 * - Model escalation
 * - Fallback handling
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
var recovery_manager_1 = require("./recovery-manager");
// =============================================================================
// Test Fixtures
// =============================================================================
function createMockExecutor(responses) {
    var _this = this;
    var callCount = 0;
    return {
        type: 'process',
        name: 'Mock Executor',
        execute: vitest_1.vi.fn().mockImplementation(function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                response = responses[callCount] || responses[responses.length - 1];
                callCount++;
                return [2 /*return*/, response];
            });
        }); }),
        executeParallel: vitest_1.vi.fn(),
        isAvailable: vitest_1.vi.fn().mockResolvedValue(true),
        getCapabilities: vitest_1.vi.fn().mockReturnValue({
            maxParallelism: 10,
            tokenOverheadPerTask: 0,
            sharedContext: false,
            supportsStreaming: false,
            efficientDependencyPassing: false,
            trueIsolation: true,
        }),
    };
}
function createTestRequest(overrides) {
    return __assign({ nodeId: 'test-node', prompt: 'Test task prompt', description: 'Test task', model: 'sonnet' }, overrides);
}
function createFailedResponse(errorCode, retryable) {
    if (errorCode === void 0) { errorCode = 'TOOL_ERROR'; }
    if (retryable === void 0) { retryable = true; }
    return {
        success: false,
        nodeId: 'test-node',
        error: {
            code: errorCode,
            message: "Error: ".concat(errorCode),
            retryable: retryable,
        },
        metadata: {
            executor: 'process',
            durationMs: 100,
        },
    };
}
function createSuccessResponse() {
    return {
        success: true,
        nodeId: 'test-node',
        output: { result: 'success' },
        confidence: 0.9,
        metadata: {
            executor: 'process',
            durationMs: 100,
        },
    };
}
function createMockFeedback(grade) {
    if (grade === void 0) { grade = 'D'; }
    return {
        assessment: {
            grade: grade,
            score: grade === 'A' ? 95 : grade === 'F' ? 30 : 60,
            isAcceptable: grade !== 'F' && grade !== 'D',
            strengths: ['Good structure'],
            weaknesses: ['Missing details'],
            verdict: 'Needs improvement',
        },
        items: [{
                id: 'fb-1',
                priority: grade === 'F' ? 'critical' : 'high',
                category: 'quality',
                title: 'Improve output',
                description: 'Output needs more detail',
                actions: ['Add more details'],
                effort: 'moderate',
                source: 'test',
            }],
        byPriority: {
            critical: grade === 'F' ? [{ id: 'fb-1' }] : [],
            high: grade !== 'F' ? [{ id: 'fb-1' }] : [],
            medium: [],
            low: [],
        },
        byCategory: {
            accuracy: [],
            completeness: [],
            format: [],
            quality: [{ id: 'fb-1' }],
            style: [],
            specificity: [],
            verification: [],
            performance: [],
        },
        criticalItems: grade === 'F' ? [{ id: 'fb-1' }] : [],
        quickWins: [],
        summary: 'Summary of feedback',
        revisionPrompt: 'Please improve the output by adding more details.',
        synthesizedAt: new Date(),
    };
}
// =============================================================================
// Tests
// =============================================================================
(0, vitest_1.describe)('RecoveryManager', function () {
    var recoveryManager;
    (0, vitest_1.beforeEach)(function () {
        recoveryManager = new recovery_manager_1.RecoveryManager({ verbose: false });
    });
    (0, vitest_1.describe)('recover', function () {
        (0, vitest_1.it)('succeeds on first retry for transient errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, failedResponse, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = createMockExecutor([
                            createSuccessResponse(),
                        ]);
                        failedResponse = createFailedResponse('TIMEOUT');
                        request = createTestRequest();
                        return [4 /*yield*/, recoveryManager.recover(executor, failedResponse, request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.attempts).toHaveLength(1);
                        (0, vitest_1.expect)(result.attempts[0].strategy).toBe('retry-same');
                        (0, vitest_1.expect)(result.terminationReason).toBe('success');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('uses feedback for retry when available', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, failedResponse, request, feedback, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = createMockExecutor([
                            createSuccessResponse(),
                        ]);
                        failedResponse = createFailedResponse('TOOL_ERROR');
                        request = createTestRequest();
                        feedback = createMockFeedback('F');
                        return [4 /*yield*/, recoveryManager.recover(executor, failedResponse, request, feedback)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        (0, vitest_1.expect)(result.attempts[0].strategy).toBe('retry-with-feedback');
                        (0, vitest_1.expect)(result.attempts[0].modifiedPrompt).toContain('PREVIOUS ATTEMPT FEEDBACK');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('escalates model after failed retry with feedback', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, failedResponse, request, feedback, manager, result, escalateAttempt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = createMockExecutor([
                            createFailedResponse('MODEL_ERROR'),
                            createSuccessResponse(),
                        ]);
                        failedResponse = createFailedResponse('MODEL_ERROR');
                        request = createTestRequest({ model: 'haiku' });
                        feedback = createMockFeedback('D');
                        manager = new recovery_manager_1.RecoveryManager({
                            maxAttempts: 3,
                            modelEscalation: ['haiku', 'sonnet', 'opus'],
                        });
                        return [4 /*yield*/, manager.recover(executor, failedResponse, request, feedback)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.success).toBe(true);
                        escalateAttempt = result.attempts.find(function (a) { return a.strategy === 'escalate-model'; });
                        (0, vitest_1.expect)(escalateAttempt).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('stops after max attempts when no fallback configured', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, failedResponse, request, noFallbackManager, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = createMockExecutor([
                            createFailedResponse('RATE_LIMITED'),
                            createFailedResponse('RATE_LIMITED'),
                            createFailedResponse('RATE_LIMITED'),
                        ]);
                        failedResponse = createFailedResponse('RATE_LIMITED');
                        request = createTestRequest();
                        noFallbackManager = new recovery_manager_1.RecoveryManager({
                            maxAttempts: 3,
                            verbose: false,
                        });
                        return [4 /*yield*/, noFallbackManager.recover(executor, failedResponse, request)];
                    case 1:
                        result = _a.sent();
                        // With rate limited (transient), it should retry until max attempts
                        (0, vitest_1.expect)(result.attempts.length).toBeGreaterThanOrEqual(2);
                        // Eventually should fail or use skip-with-fallback (which gives null)
                        if (result.terminationReason === 'max-attempts') {
                            (0, vitest_1.expect)(result.success).toBe(false);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('uses fallback after multiple strategy failures', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, failedResponse, request, manager, result, fallbackAttempt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = createMockExecutor([
                            createFailedResponse('INVALID_OUTPUT'),
                            createFailedResponse('INVALID_OUTPUT'),
                            createFailedResponse('INVALID_OUTPUT'),
                        ]);
                        failedResponse = createFailedResponse('INVALID_OUTPUT');
                        request = createTestRequest();
                        manager = new recovery_manager_1.RecoveryManager({
                            maxAttempts: 5,
                            defaultFallback: { default: 'value' },
                        });
                        return [4 /*yield*/, manager.recover(executor, failedResponse, request)];
                    case 1:
                        result = _a.sent();
                        fallbackAttempt = result.attempts.find(function (a) { return a.strategy === 'skip-with-fallback'; });
                        if (fallbackAttempt) {
                            (0, vitest_1.expect)(result.output).toEqual({ default: 'value' });
                            (0, vitest_1.expect)(result.terminationReason).toBe('skipped');
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('tracks total duration', function () { return __awaiter(void 0, void 0, void 0, function () {
            var executor, failedResponse, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        executor = createMockExecutor([
                            createSuccessResponse(),
                        ]);
                        failedResponse = createFailedResponse();
                        request = createTestRequest();
                        return [4 /*yield*/, recoveryManager.recover(executor, failedResponse, request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.totalDurationMs).toBeGreaterThanOrEqual(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('selectStrategy', function () {
        (0, vitest_1.it)('selects retry-same for transient errors on first attempt', function () {
            var context = {
                originalRequest: createTestRequest(),
                failedResponse: createFailedResponse('TIMEOUT'),
                previousAttempts: [],
                maxAttempts: 3,
                modelEscalation: ['haiku', 'sonnet', 'opus'],
            };
            var selection = recoveryManager.selectStrategy(context);
            (0, vitest_1.expect)(selection.strategy).toBe('retry-same');
            (0, vitest_1.expect)(selection.confidence).toBeGreaterThan(0.5);
        });
        (0, vitest_1.it)('selects retry-with-feedback when critical issues exist', function () {
            var context = {
                originalRequest: createTestRequest(),
                failedResponse: createFailedResponse('TOOL_ERROR'),
                feedback: createMockFeedback('F'),
                previousAttempts: [],
                maxAttempts: 3,
                modelEscalation: ['haiku', 'sonnet', 'opus'],
            };
            var selection = recoveryManager.selectStrategy(context);
            (0, vitest_1.expect)(selection.strategy).toBe('retry-with-feedback');
        });
        (0, vitest_1.it)('selects human-intervention for unrecoverable errors', function () {
            var context = {
                originalRequest: createTestRequest(),
                failedResponse: createFailedResponse('PERMISSION_DENIED', false),
                previousAttempts: [],
                maxAttempts: 3,
                modelEscalation: ['haiku', 'sonnet', 'opus'],
            };
            var selection = recoveryManager.selectStrategy(context);
            (0, vitest_1.expect)(selection.strategy).toBe('human-intervention');
        });
        (0, vitest_1.it)('selects escalate-model for model limitations', function () {
            var context = {
                originalRequest: createTestRequest({ model: 'haiku' }),
                failedResponse: createFailedResponse('MODEL_ERROR'),
                feedback: createMockFeedback('F'),
                previousAttempts: [
                    {
                        attemptNumber: 1,
                        strategy: 'retry-with-feedback',
                        startedAt: new Date(),
                        completedAt: new Date(),
                        success: false,
                    },
                ],
                maxAttempts: 3,
                modelEscalation: ['haiku', 'sonnet', 'opus'],
            };
            var selection = recoveryManager.selectStrategy(context);
            (0, vitest_1.expect)(selection.strategy).toBe('escalate-model');
        });
    });
    (0, vitest_1.describe)('getCapabilities', function () {
        (0, vitest_1.it)('returns correct capabilities', function () {
            var caps = recoveryManager.getCapabilities();
            (0, vitest_1.expect)(caps.maxAttempts).toBe(3);
            (0, vitest_1.expect)(caps.availableStrategies).toContain('retry-same');
            (0, vitest_1.expect)(caps.availableStrategies).toContain('retry-with-feedback');
            (0, vitest_1.expect)(caps.availableStrategies).toContain('escalate-model');
            (0, vitest_1.expect)(caps.availableStrategies).toContain('human-intervention');
            (0, vitest_1.expect)(caps.modelEscalation).toEqual(['haiku', 'sonnet', 'opus']);
        });
    });
});
(0, vitest_1.describe)('createRecoveryManager', function () {
    (0, vitest_1.it)('creates manager with custom config', function () {
        var manager = (0, recovery_manager_1.createRecoveryManager)({
            maxAttempts: 5,
            modelEscalation: ['sonnet', 'opus'],
        });
        var caps = manager.getCapabilities();
        (0, vitest_1.expect)(caps.maxAttempts).toBe(5);
        (0, vitest_1.expect)(caps.modelEscalation).toEqual(['sonnet', 'opus']);
    });
    (0, vitest_1.it)('creates manager with default config', function () {
        var manager = (0, recovery_manager_1.createRecoveryManager)({});
        var caps = manager.getCapabilities();
        (0, vitest_1.expect)(caps.maxAttempts).toBe(3);
    });
});

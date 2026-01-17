"use strict";
/**
 * Iteration Detector
 *
 * Analyzes task execution results to determine when iteration is needed.
 * Detects failures, low-quality outputs, and situations requiring retry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterationDetector = void 0;
var IterationDetector = /** @class */ (function () {
    function IterationDetector(config) {
        if (config === void 0) { config = {}; }
        var _a, _b, _c, _d;
        this.config = {
            minConfidence: (_a = config.minConfidence) !== null && _a !== void 0 ? _a : 0.7,
            maxRetries: (_b = config.maxRetries) !== null && _b !== void 0 ? _b : 3,
            detectHallucinations: (_c = config.detectHallucinations) !== null && _c !== void 0 ? _c : true,
            validators: (_d = config.validators) !== null && _d !== void 0 ? _d : new Map(),
        };
        this.retryCount = new Map();
    }
    IterationDetector.prototype.analyzeResult = function (nodeId, result, error) {
        if (error) {
            return this.handleError(nodeId, error);
        }
        if (!result) {
            return {
                nodeId: nodeId,
                reason: 'task-failed',
                severity: 'critical',
                blocking: true,
                retryStrategy: {
                    maxRetries: this.config.maxRetries,
                    promptModification: 'add-context',
                    delayMs: 1000,
                },
            };
        }
        if (result.confidence < this.config.minConfidence) {
            return this.handleLowConfidence(nodeId, result);
        }
        if (this.config.detectHallucinations && this.detectHallucination(result)) {
            return this.handleHallucination(nodeId, result);
        }
        var validator = this.config.validators.get(nodeId);
        if (validator && !validator(result)) {
            return this.handleValidationFailure(nodeId, result);
        }
        if (this.isIncomplete(result)) {
            return this.handleIncompleteOutput(nodeId, result);
        }
        return null;
    };
    IterationDetector.prototype.shouldRetry = function (nodeId) {
        var _a;
        var retries = (_a = this.retryCount.get(nodeId)) !== null && _a !== void 0 ? _a : 0;
        return retries < this.config.maxRetries;
    };
    IterationDetector.prototype.recordRetry = function (nodeId) {
        var _a;
        var retries = (_a = this.retryCount.get(nodeId)) !== null && _a !== void 0 ? _a : 0;
        this.retryCount.set(nodeId, retries + 1);
    };
    IterationDetector.prototype.getRetryCount = function (nodeId) {
        var _a;
        return (_a = this.retryCount.get(nodeId)) !== null && _a !== void 0 ? _a : 0;
    };
    IterationDetector.prototype.resetRetryCount = function (nodeId) {
        this.retryCount.delete(nodeId);
    };
    IterationDetector.prototype.handleError = function (nodeId, error) {
        var retries = this.getRetryCount(nodeId);
        var severity = 'high';
        if (retries >= this.config.maxRetries - 1) {
            severity = 'critical';
        }
        else if (error.retryable === false) {
            severity = 'critical';
        }
        return {
            nodeId: nodeId,
            reason: 'task-failed',
            severity: severity,
            blocking: true,
            retryStrategy: {
                maxRetries: this.config.maxRetries,
                promptModification: this.getPromptModificationForError(error),
                tryDifferentSkill: retries >= 2,
                delayMs: Math.min(1000 * Math.pow(2, retries), 10000),
            },
            context: {
                error: error.message,
                code: error.code,
                retryCount: retries,
            },
        };
    };
    IterationDetector.prototype.handleLowConfidence = function (nodeId, result) {
        return {
            nodeId: nodeId,
            reason: 'low-confidence',
            severity: 'medium',
            blocking: false,
            retryStrategy: {
                maxRetries: this.config.maxRetries,
                promptModification: 'be-specific',
                tryDifferentModel: 'opus',
            },
            context: {
                confidence: result.confidence,
                threshold: this.config.minConfidence,
            },
        };
    };
    IterationDetector.prototype.handleHallucination = function (nodeId, result) {
        return {
            nodeId: nodeId,
            reason: 'hallucination-detected',
            severity: 'high',
            blocking: true,
            retryStrategy: {
                maxRetries: this.config.maxRetries,
                promptModification: 'be-specific',
                tryDifferentSkill: true,
            },
            context: { output: result.output },
        };
    };
    IterationDetector.prototype.handleValidationFailure = function (nodeId, result) {
        return {
            nodeId: nodeId,
            reason: 'validation-failed',
            severity: 'high',
            blocking: true,
            retryStrategy: {
                maxRetries: this.config.maxRetries,
                promptModification: 'add-context',
            },
            context: { output: result.output },
        };
    };
    IterationDetector.prototype.handleIncompleteOutput = function (nodeId, result) {
        return {
            nodeId: nodeId,
            reason: 'incomplete-output',
            severity: 'medium',
            blocking: false,
            retryStrategy: {
                maxRetries: this.config.maxRetries,
                promptModification: 'be-specific',
            },
            context: { output: result.output },
        };
    };
    IterationDetector.prototype.getPromptModificationForError = function (error) {
        var errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('timeout') || errorMsg.includes('time')) {
            return 'simplify';
        }
        else if (errorMsg.includes('permission') || errorMsg.includes('access')) {
            return 'change-approach';
        }
        return 'add-context';
    };
    IterationDetector.prototype.detectHallucination = function (result) {
        var output = result.output;
        if (typeof output === 'string') {
            var suspiciousPatterns = [
                /definitely.*without any doubt/i,
                /absolutely certain.*always/i,
                /proven fact that.*100%/i,
            ];
            return suspiciousPatterns.some(function (pattern) { return pattern.test(output); });
        }
        return false;
    };
    IterationDetector.prototype.isIncomplete = function (result) {
        var output = result.output;
        if (typeof output === 'string') {
            if (output.trim().length < 50)
                return true;
            var incompletePatterns = [
                /\.\.\.\s*$/,
                /to be continued/i,
                /\[truncated\]/i,
                /\[incomplete\]/i,
            ];
            return incompletePatterns.some(function (pattern) { return pattern.test(output); });
        }
        if (typeof output === 'object' && output !== null) {
            var obj = output;
            if (Object.keys(obj).length < 2)
                return true;
        }
        return false;
    };
    return IterationDetector;
}());
exports.IterationDetector = IterationDetector;

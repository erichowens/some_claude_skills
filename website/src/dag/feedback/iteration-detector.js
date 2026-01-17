"use strict";
/**
 * Iteration Detector
 *
 * Identifies when a task output requires iteration or refinement.
 * Determines if the result meets quality thresholds or needs another pass.
 *
 * @module dag/feedback/iteration-detector
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
exports.iterationDetector = exports.IterationDetector = void 0;
exports.analyzeIteration = analyzeIteration;
exports.needsIteration = needsIteration;
exports.recommendedIterations = recommendedIterations;
// =============================================================================
// ITERATION DETECTOR CLASS
// =============================================================================
/**
 * IterationDetector determines when outputs need refinement.
 *
 * @example
 * ```typescript
 * const detector = new IterationDetector();
 *
 * const analysis = detector.analyze({
 *   output: agentResult,
 *   input: originalPrompt,
 *   quality: {
 *     confidence: confidenceScore,
 *     validation: validationResult,
 *   },
 *   iteration: 1,
 * });
 *
 * if (analysis.decision === 'iterate') {
 *   console.log('Needs iteration:', analysis.explanation);
 *   console.log('Strategy:', analysis.strategy);
 * }
 * ```
 */
var IterationDetector = /** @class */ (function () {
    function IterationDetector() {
        this.defaultWeights = {
            confidence: 0.25,
            validation: 0.25,
            hallucination: 0.20,
            completeness: 0.15,
            userFeedback: 0.10,
            improvement: 0.05,
        };
        this.customRules = [];
    }
    /**
     * Register a custom iteration rule
     */
    IterationDetector.prototype.registerRule = function (rule) {
        this.customRules.push(rule);
    };
    /**
     * Analyze whether iteration is needed
     */
    IterationDetector.prototype.analyze = function (input, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (options === void 0) { options = {}; }
        var weights = __assign(__assign({}, this.defaultWeights), options.weights);
        var factors = [];
        // Configuration
        var confidenceThreshold = (_a = options.confidenceThreshold) !== null && _a !== void 0 ? _a : 0.6;
        var hallucinationThreshold = (_b = options.hallucinationThreshold) !== null && _b !== void 0 ? _b : 0.4;
        var maxIterations = (_c = input.maxIterations) !== null && _c !== void 0 ? _c : 3;
        var currentIteration = (_d = input.iteration) !== null && _d !== void 0 ? _d : 1;
        // Analyze confidence
        if ((_e = input.quality) === null || _e === void 0 ? void 0 : _e.confidence) {
            var confidenceFactor = this.analyzeConfidence(input.quality.confidence, confidenceThreshold, weights.confidence);
            factors.push(confidenceFactor);
        }
        // Analyze validation
        if ((_f = input.quality) === null || _f === void 0 ? void 0 : _f.validation) {
            var validationFactor = this.analyzeValidation(input.quality.validation, (_g = options.requireValidation) !== null && _g !== void 0 ? _g : false, weights.validation);
            factors.push(validationFactor);
        }
        // Analyze hallucination risk
        if ((_h = input.quality) === null || _h === void 0 ? void 0 : _h.hallucination) {
            var hallucinationFactor = this.analyzeHallucination(input.quality.hallucination, hallucinationThreshold, weights.hallucination);
            factors.push(hallucinationFactor);
        }
        // Analyze completeness
        var completenessFactor = this.analyzeCompleteness(input, weights.completeness);
        factors.push(completenessFactor);
        // Analyze user feedback
        if (input.userFeedback) {
            var feedbackFactor = this.analyzeUserFeedback(input.userFeedback, weights.userFeedback);
            factors.push(feedbackFactor);
        }
        // Analyze improvement over iterations
        if (input.previousOutputs && input.previousOutputs.length > 0) {
            var improvementFactor = this.analyzeImprovement(input.output, input.previousOutputs, weights.improvement);
            factors.push(improvementFactor);
        }
        // Apply custom rules
        var allRules = __spreadArray(__spreadArray([], this.customRules, true), (options.customRules || []), true);
        for (var _i = 0, allRules_1 = allRules; _i < allRules_1.length; _i++) {
            var rule = allRules_1[_i];
            if (rule.condition(input)) {
                factors.push({
                    name: rule.name,
                    reason: rule.reason,
                    weight: rule.weight,
                    score: 1.0,
                    contribution: rule.weight,
                    details: "Custom rule triggered: ".concat(rule.name),
                });
            }
        }
        // Calculate overall iteration score
        var totalWeight = factors.reduce(function (sum, f) { return sum + f.weight; }, 0);
        var iterationScore = totalWeight > 0
            ? factors.reduce(function (sum, f) { return sum + f.contribution; }, 0) / totalWeight
            : 0;
        // Determine decision
        var _k = this.determineDecision(iterationScore, factors, currentIteration, maxIterations), decision = _k.decision, shouldPivot = _k.shouldPivot;
        // Find primary reason
        var primaryFactor = factors
            .filter(function (f) { return f.contribution > 0; })
            .sort(function (a, b) { return b.contribution - a.contribution; })[0];
        var primaryReason = (_j = primaryFactor === null || primaryFactor === void 0 ? void 0 : primaryFactor.reason) !== null && _j !== void 0 ? _j : null;
        // Build strategy if iterating
        var strategy = decision === 'iterate'
            ? this.buildStrategy(factors, input, currentIteration)
            : undefined;
        // Generate explanation
        var explanation = this.generateExplanation(decision, factors, currentIteration);
        return {
            decision: decision,
            primaryReason: primaryReason,
            factors: factors,
            decisionConfidence: this.calculateDecisionConfidence(factors, iterationScore),
            strategy: strategy,
            maxIterations: maxIterations,
            currentIteration: currentIteration,
            shouldPivot: shouldPivot,
            explanation: explanation,
            analyzedAt: new Date(),
        };
    };
    /**
     * Analyze confidence factor
     */
    IterationDetector.prototype.analyzeConfidence = function (confidence, threshold, weight) {
        var needsIteration = confidence.score < threshold;
        var score = needsIteration ? 1 - (confidence.score / threshold) : 0;
        return {
            name: 'confidence',
            reason: 'low-confidence',
            weight: weight,
            score: score,
            contribution: score * weight,
            details: "Confidence ".concat((confidence.score * 100).toFixed(0), "% vs threshold ").concat((threshold * 100).toFixed(0), "%"),
        };
    };
    /**
     * Analyze validation factor
     */
    IterationDetector.prototype.analyzeValidation = function (validation, required, weight) {
        var needsIteration = !validation.isValid;
        var score = needsIteration
            ? Math.min(1, validation.errorCount * 0.3 + (required ? 0.4 : 0))
            : 0;
        return {
            name: 'validation',
            reason: 'validation-failed',
            weight: weight,
            score: score,
            contribution: score * weight,
            details: "".concat(validation.errorCount, " errors, ").concat(validation.warningCount, " warnings"),
        };
    };
    /**
     * Analyze hallucination factor
     */
    IterationDetector.prototype.analyzeHallucination = function (hallucination, threshold, weight) {
        var needsIteration = hallucination.riskScore > threshold;
        var score = needsIteration
            ? (hallucination.riskScore - threshold) / (1 - threshold)
            : 0;
        return {
            name: 'hallucination',
            reason: 'hallucination-risk',
            weight: weight,
            score: score,
            contribution: score * weight,
            details: "Risk score ".concat((hallucination.riskScore * 100).toFixed(0), "%, ").concat(hallucination.highRiskCount, " high-risk detections"),
        };
    };
    /**
     * Analyze completeness factor
     */
    IterationDetector.prototype.analyzeCompleteness = function (input, weight) {
        var output = input.output;
        var score = 0;
        var details = '';
        if (!output) {
            score = 1.0;
            details = 'Output is empty';
        }
        else {
            var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
            // Check for incomplete markers
            if (/TODO|FIXME|incomplete|...$|etc\./i.test(outputStr)) {
                score += 0.5;
                details = 'Contains incomplete markers';
            }
            // Check for truncation
            if (/truncated|cut off|continued/i.test(outputStr)) {
                score += 0.3;
                details += (details ? ', ' : '') + 'Appears truncated';
            }
            // Very short output
            if (outputStr.length < 50) {
                score += 0.2;
                details += (details ? ', ' : '') + 'Very short output';
            }
        }
        return {
            name: 'completeness',
            reason: 'incomplete-output',
            weight: weight,
            score: Math.min(1, score),
            contribution: Math.min(1, score) * weight,
            details: details || 'Output appears complete',
        };
    };
    /**
     * Analyze user feedback factor
     */
    IterationDetector.prototype.analyzeUserFeedback = function (feedback, weight) {
        var _a;
        var score = 0;
        var details = '';
        switch (feedback.type) {
            case 'reject':
                score = 1.0;
                details = 'User rejected output';
                break;
            case 'revise':
                score = 0.7;
                details = "User requested revision: ".concat(((_a = feedback.issues) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'unspecified');
                break;
            case 'approve':
                score = 0;
                details = 'User approved output';
                break;
        }
        // Adjust based on satisfaction
        if (feedback.satisfaction !== undefined) {
            var satisfactionScore = 1 - (feedback.satisfaction / 5);
            score = (score + satisfactionScore) / 2;
        }
        return {
            name: 'user-feedback',
            reason: 'user-feedback',
            weight: weight,
            score: score,
            contribution: score * weight,
            details: details,
        };
    };
    /**
     * Analyze improvement over iterations
     */
    IterationDetector.prototype.analyzeImprovement = function (currentOutput, previousOutputs, weight) {
        // Simple heuristic: compare output lengths and complexity
        var current = typeof currentOutput === 'string'
            ? currentOutput
            : JSON.stringify(currentOutput);
        var previous = typeof previousOutputs[previousOutputs.length - 1] === 'string'
            ? previousOutputs[previousOutputs.length - 1]
            : JSON.stringify(previousOutputs[previousOutputs.length - 1]);
        // If current is same or shorter, might indicate stagnation
        var lengthRatio = current.length / Math.max(previous.length, 1);
        var isStagnating = lengthRatio < 1.05 && lengthRatio > 0.95;
        var score = isStagnating ? 0.5 : 0;
        return {
            name: 'improvement',
            reason: 'partial-success',
            weight: weight,
            score: score,
            contribution: score * weight,
            details: isStagnating
                ? 'Output appears similar to previous iteration'
                : 'Output shows variation from previous iteration',
        };
    };
    /**
     * Determine iteration decision
     */
    IterationDetector.prototype.determineDecision = function (iterationScore, factors, currentIteration, maxIterations) {
        // Check if we've exceeded max iterations
        if (currentIteration >= maxIterations) {
            // Even with issues, we need to make a decision
            var criticalFactors = factors.filter(function (f) {
                return f.contribution > 0.15 &&
                    (f.reason === 'validation-failed' || f.reason === 'hallucination-risk');
            });
            if (criticalFactors.length > 0) {
                return { decision: 'reject', shouldPivot: true };
            }
            return { decision: 'accept', shouldPivot: false };
        }
        // Strong indication to iterate
        if (iterationScore > 0.6) {
            var shouldPivot = currentIteration > 1 &&
                factors.some(function (f) { return f.name === 'improvement' && f.score > 0.4; });
            return { decision: 'iterate', shouldPivot: shouldPivot };
        }
        // Moderate issues
        if (iterationScore > 0.3) {
            // Check for critical issues
            var hasCritical = factors.some(function (f) {
                return f.reason === 'validation-failed' && f.score > 0.5;
            });
            if (hasCritical) {
                return { decision: 'iterate', shouldPivot: false };
            }
            // If user feedback is positive, accept
            var feedbackFactor = factors.find(function (f) { return f.name === 'user-feedback'; });
            if (feedbackFactor && feedbackFactor.score < 0.3) {
                return { decision: 'accept', shouldPivot: false };
            }
            return { decision: 'iterate', shouldPivot: false };
        }
        // Low issues - accept
        return { decision: 'accept', shouldPivot: false };
    };
    /**
     * Build iteration strategy
     */
    IterationDetector.prototype.buildStrategy = function (factors, input, currentIteration) {
        var _a;
        var focusAreas = [];
        var suggestedChanges = [];
        // Analyze factors to determine strategy type
        var strategyType = 'refine';
        // Sort factors by contribution
        var sortedFactors = __spreadArray([], factors, true).sort(function (a, b) { return b.contribution - a.contribution; });
        for (var _i = 0, sortedFactors_1 = sortedFactors; _i < sortedFactors_1.length; _i++) {
            var factor = sortedFactors_1[_i];
            if (factor.contribution < 0.05)
                continue;
            switch (factor.reason) {
                case 'low-confidence':
                    focusAreas.push('Improve response specificity');
                    suggestedChanges.push('Add more concrete details and examples');
                    break;
                case 'validation-failed':
                    focusAreas.push('Fix format/schema compliance');
                    suggestedChanges.push('Ensure output matches expected structure');
                    break;
                case 'hallucination-risk':
                    focusAreas.push('Verify factual claims');
                    suggestedChanges.push('Remove or verify questionable citations/data');
                    strategyType = 'refine';
                    break;
                case 'incomplete-output':
                    focusAreas.push('Complete all sections');
                    suggestedChanges.push('Expand on truncated or incomplete parts');
                    strategyType = 'expand';
                    break;
                case 'user-feedback':
                    if ((_a = input.userFeedback) === null || _a === void 0 ? void 0 : _a.improvements) {
                        focusAreas.push.apply(focusAreas, input.userFeedback.improvements);
                    }
                    break;
                case 'partial-success':
                    if (currentIteration > 2) {
                        strategyType = 'alternate';
                        suggestedChanges.push('Try a different approach');
                    }
                    break;
            }
        }
        // Determine creativity adjustment
        var creativityAdjustment = 'maintain';
        if (sortedFactors.some(function (f) { return f.reason === 'hallucination-risk'; })) {
            creativityAdjustment = 'decrease';
        }
        else if (sortedFactors.some(function (f) { return f.reason === 'incomplete-output'; })) {
            creativityAdjustment = 'increase';
        }
        return {
            type: strategyType,
            focusAreas: __spreadArray([], new Set(focusAreas), true),
            suggestedChanges: __spreadArray([], new Set(suggestedChanges), true),
            creativityAdjustment: creativityAdjustment,
        };
    };
    /**
     * Calculate confidence in the decision
     */
    IterationDetector.prototype.calculateDecisionConfidence = function (factors, iterationScore) {
        // High confidence if score is clearly in one direction
        if (iterationScore > 0.8 || iterationScore < 0.2) {
            return 0.9;
        }
        // Lower confidence in the middle
        var distance = Math.abs(iterationScore - 0.5);
        return 0.5 + distance;
    };
    /**
     * Generate explanation for the decision
     */
    IterationDetector.prototype.generateExplanation = function (decision, factors, currentIteration) {
        var topFactors = factors
            .filter(function (f) { return f.contribution > 0.05; })
            .sort(function (a, b) { return b.contribution - a.contribution; })
            .slice(0, 3);
        var explanation = '';
        switch (decision) {
            case 'accept':
                explanation = "Accepting output after ".concat(currentIteration, " iteration(s). ");
                if (topFactors.length > 0 && topFactors[0].contribution > 0) {
                    explanation += "Minor issues: ".concat(topFactors.map(function (f) { return f.name; }).join(', '), ".");
                }
                else {
                    explanation += 'Output meets quality thresholds.';
                }
                break;
            case 'iterate':
                explanation = "Iteration ".concat(currentIteration, " needs refinement. ");
                explanation += "Key issues: ".concat(topFactors.map(function (f) { return f.details || f.name; }).join('; '), ".");
                break;
            case 'reject':
                explanation = "Rejecting output after ".concat(currentIteration, " iteration(s). ");
                explanation += "Critical issues: ".concat(topFactors.map(function (f) { return f.name; }).join(', '), ".");
                break;
            case 'escalate':
                explanation = "Escalating for human review after ".concat(currentIteration, " iteration(s). ");
                explanation += "Unresolvable issues detected.";
                break;
        }
        return explanation;
    };
    /**
     * Quick check if iteration is needed
     */
    IterationDetector.prototype.needsIteration = function (input, options) {
        return this.analyze(input, options).decision === 'iterate';
    };
    /**
     * Get iteration count recommendation
     */
    IterationDetector.prototype.recommendedIterations = function (input, options) {
        var analysis = this.analyze(input, options);
        if (analysis.decision === 'accept')
            return 0;
        if (analysis.decision === 'reject')
            return 0;
        // Estimate needed iterations based on issue severity
        var avgContribution = analysis.factors
            .filter(function (f) { return f.contribution > 0; })
            .reduce(function (sum, f) { return sum + f.contribution; }, 0) / Math.max(analysis.factors.length, 1);
        if (avgContribution > 0.4)
            return 3;
        if (avgContribution > 0.2)
            return 2;
        return 1;
    };
    return IterationDetector;
}());
exports.IterationDetector = IterationDetector;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global iteration detector instance */
exports.iterationDetector = new IterationDetector();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Analyze if iteration is needed
 */
function analyzeIteration(input, options) {
    return exports.iterationDetector.analyze(input, options);
}
/**
 * Quick check if iteration is needed
 */
function needsIteration(input, options) {
    return exports.iterationDetector.needsIteration(input, options);
}
/**
 * Get recommended iteration count
 */
function recommendedIterations(input, options) {
    return exports.iterationDetector.recommendedIterations(input, options);
}

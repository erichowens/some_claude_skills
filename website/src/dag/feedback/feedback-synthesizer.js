"use strict";
/**
 * Feedback Synthesizer
 *
 * Creates actionable feedback from quality assessments and iteration analysis.
 * Generates specific, constructive guidance for improving outputs.
 *
 * @module dag/feedback/feedback-synthesizer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackSynthesizer = exports.FeedbackSynthesizer = void 0;
exports.synthesizeFeedback = synthesizeFeedback;
exports.quickSynthesizeFeedback = quickSynthesizeFeedback;
exports.getRevisionPrompt = getRevisionPrompt;
// =============================================================================
// FEEDBACK SYNTHESIZER CLASS
// =============================================================================
/**
 * FeedbackSynthesizer creates actionable feedback from assessments.
 *
 * @example
 * ```typescript
 * const synthesizer = new FeedbackSynthesizer();
 *
 * const feedback = synthesizer.synthesize({
 *   output: agentResult,
 *   input: originalPrompt,
 *   iteration: iterationAnalysis,
 *   confidence: confidenceScore,
 *   validation: validationResult,
 * });
 *
 * console.log('Assessment:', feedback.assessment.verdict);
 * console.log('Critical items:', feedback.criticalItems);
 * console.log('Revision prompt:', feedback.revisionPrompt);
 * ```
 */
var FeedbackSynthesizer = /** @class */ (function () {
    function FeedbackSynthesizer() {
        this.itemCounter = 0;
    }
    /**
     * Generate a unique feedback item ID
     */
    FeedbackSynthesizer.prototype.generateId = function () {
        return "fb-".concat(Date.now(), "-").concat(++this.itemCounter);
    };
    /**
     * Synthesize feedback from all inputs
     */
    FeedbackSynthesizer.prototype.synthesize = function (input, options) {
        if (options === void 0) { options = {}; }
        var items = [];
        // Synthesize from iteration analysis
        if (input.iteration) {
            items.push.apply(items, this.synthesizeFromIteration(input.iteration, options));
        }
        // Synthesize from confidence score
        if (input.confidence) {
            items.push.apply(items, this.synthesizeFromConfidence(input.confidence, options));
        }
        // Synthesize from validation
        if (input.validation) {
            items.push.apply(items, this.synthesizeFromValidation(input.validation, options));
        }
        // Synthesize from hallucination detection
        if (input.hallucination) {
            items.push.apply(items, this.synthesizeFromHallucination(input.hallucination, options));
        }
        // Synthesize from custom assessments
        if (input.customAssessments) {
            items.push.apply(items, this.synthesizeFromCustom(input.customAssessments, options));
        }
        // Filter by priority
        var filteredItems = items;
        if (options.minPriority) {
            var priorityOrder_1 = ['critical', 'high', 'medium', 'low'];
            var minIndex_1 = priorityOrder_1.indexOf(options.minPriority);
            filteredItems = items.filter(function (item) {
                return priorityOrder_1.indexOf(item.priority) <= minIndex_1;
            });
        }
        // Filter by category
        if (options.focusCategories && options.focusCategories.length > 0) {
            filteredItems = filteredItems.filter(function (item) {
                return options.focusCategories.includes(item.category);
            });
        }
        // Sort by priority
        var priorityWeight = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
        };
        filteredItems.sort(function (a, b) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });
        // Limit items
        if (options.maxItems) {
            filteredItems = filteredItems.slice(0, options.maxItems);
        }
        // Group by priority
        var byPriority = {
            critical: [],
            high: [],
            medium: [],
            low: [],
        };
        for (var _i = 0, filteredItems_1 = filteredItems; _i < filteredItems_1.length; _i++) {
            var item = filteredItems_1[_i];
            byPriority[item.priority].push(item);
        }
        // Group by category
        var byCategory = {
            accuracy: [],
            completeness: [],
            format: [],
            quality: [],
            style: [],
            specificity: [],
            verification: [],
            performance: [],
        };
        for (var _a = 0, filteredItems_2 = filteredItems; _a < filteredItems_2.length; _a++) {
            var item = filteredItems_2[_a];
            byCategory[item.category].push(item);
        }
        // Identify critical items
        var criticalItems = filteredItems.filter(function (i) { return i.priority === 'critical'; });
        // Identify quick wins
        var quickWins = filteredItems.filter(function (i) {
            return i.effort === 'trivial' || i.effort === 'minor';
        });
        // Generate assessment
        var assessment = this.generateAssessment(input, filteredItems);
        // Generate summary
        var summary = this.generateSummary(filteredItems, assessment);
        // Generate revision prompt
        var revisionPrompt = options.generateRevisionPrompt !== false
            ? this.generateRevisionPrompt(filteredItems, input.input, options.tone)
            : '';
        return {
            assessment: assessment,
            items: filteredItems,
            byPriority: byPriority,
            byCategory: byCategory,
            criticalItems: criticalItems,
            quickWins: quickWins,
            summary: summary,
            revisionPrompt: revisionPrompt,
            synthesizedAt: new Date(),
        };
    };
    /**
     * Synthesize feedback from iteration analysis
     */
    FeedbackSynthesizer.prototype.synthesizeFromIteration = function (iteration, options) {
        var items = [];
        for (var _i = 0, _a = iteration.factors; _i < _a.length; _i++) {
            var factor = _a[_i];
            if (factor.contribution < 0.05)
                continue;
            var item = this.factorToFeedback(factor, options);
            if (item)
                items.push(item);
        }
        // Add strategy-based feedback
        if (iteration.strategy) {
            for (var _b = 0, _c = iteration.strategy.suggestedChanges; _b < _c.length; _b++) {
                var change = _c[_b];
                items.push({
                    id: this.generateId(),
                    priority: 'medium',
                    category: 'quality',
                    title: 'Suggested improvement',
                    description: change,
                    actions: [change],
                    effort: 'moderate',
                    source: 'iteration-strategy',
                });
            }
        }
        return items;
    };
    /**
     * Convert iteration factor to feedback item
     */
    FeedbackSynthesizer.prototype.factorToFeedback = function (factor, options) {
        if (factor.score < 0.1)
            return null;
        var categoryMap = {
            confidence: 'quality',
            validation: 'format',
            hallucination: 'accuracy',
            completeness: 'completeness',
            'user-feedback': 'quality',
            improvement: 'quality',
        };
        var priority = this.scoreToPriority(factor.contribution);
        var category = categoryMap[factor.name] || 'quality';
        return {
            id: this.generateId(),
            priority: priority,
            category: category,
            title: this.formatFactorTitle(factor.name),
            description: factor.details || "Issue detected in ".concat(factor.name),
            actions: this.getActionsForFactor(factor),
            effort: this.getEffortForFactor(factor),
            source: "iteration-".concat(factor.name),
        };
    };
    /**
     * Synthesize feedback from confidence score
     */
    FeedbackSynthesizer.prototype.synthesizeFromConfidence = function (confidence, _options) {
        var items = [];
        // Add recommendations as feedback items
        for (var _i = 0, _a = confidence.recommendations; _i < _a.length; _i++) {
            var rec = _a[_i];
            items.push({
                id: this.generateId(),
                priority: 'medium',
                category: this.categorizeRecommendation(rec),
                title: 'Confidence improvement',
                description: rec,
                actions: [rec],
                effort: 'minor',
                source: 'confidence-scorer',
            });
        }
        // Add factor-specific feedback for low scores
        for (var _b = 0, _c = Object.entries(confidence.factors); _b < _c.length; _b++) {
            var _d = _c[_b], name_1 = _d[0], value = _d[1];
            if (typeof value !== 'number' || value >= 0.6)
                continue;
            items.push({
                id: this.generateId(),
                priority: value < 0.3 ? 'high' : 'medium',
                category: this.factorToCategory(name_1),
                title: "Improve ".concat(this.formatFactorTitle(name_1)),
                description: "".concat(this.formatFactorTitle(name_1), " score is ").concat((value * 100).toFixed(0), "%"),
                actions: this.getActionsForConfidenceFactor(name_1),
                effort: 'moderate',
                source: 'confidence-scorer',
            });
        }
        return items;
    };
    /**
     * Synthesize feedback from validation result
     */
    FeedbackSynthesizer.prototype.synthesizeFromValidation = function (validation, options) {
        var items = [];
        for (var _i = 0, _a = validation.issues; _i < _a.length; _i++) {
            var issue = _a[_i];
            items.push(this.validationIssueToFeedback(issue, options));
        }
        return items;
    };
    /**
     * Convert validation issue to feedback item
     */
    FeedbackSynthesizer.prototype.validationIssueToFeedback = function (issue, _options) {
        var priority = issue.severity === 'error'
            ? 'high'
            : issue.severity === 'warning' ? 'medium' : 'low';
        return {
            id: this.generateId(),
            priority: priority,
            category: 'format',
            title: "Validation: ".concat(issue.code),
            description: issue.message,
            actions: issue.suggestion ? [issue.suggestion] : ['Fix the validation error'],
            location: issue.path ? { type: 'field', reference: issue.path } : undefined,
            effort: 'minor',
            source: 'output-validator',
        };
    };
    /**
     * Synthesize feedback from hallucination detection
     */
    FeedbackSynthesizer.prototype.synthesizeFromHallucination = function (result, _options) {
        var items = [];
        for (var _i = 0, _a = result.detections; _i < _a.length; _i++) {
            var detection = _a[_i];
            items.push(this.hallucinationToFeedback(detection));
        }
        return items;
    };
    /**
     * Convert hallucination detection to feedback item
     */
    FeedbackSynthesizer.prototype.hallucinationToFeedback = function (detection) {
        var priority = detection.risk === 'high' ? 'critical' :
            detection.risk === 'medium' ? 'high' : 'medium';
        return {
            id: this.generateId(),
            priority: priority,
            category: 'accuracy',
            title: "Potential ".concat(this.formatHallucinationType(detection.type)),
            description: "".concat(detection.reason, ": \"").concat(detection.content.substring(0, 100)).concat(detection.content.length > 100 ? '...' : '', "\""),
            actions: detection.verification
                ? [detection.verification]
                : ['Verify this content for accuracy'],
            effort: 'moderate',
            source: 'hallucination-detector',
        };
    };
    /**
     * Synthesize feedback from custom assessments
     */
    FeedbackSynthesizer.prototype.synthesizeFromCustom = function (assessments, _options) {
        var items = [];
        for (var _i = 0, assessments_1 = assessments; _i < assessments_1.length; _i++) {
            var assessment = assessments_1[_i];
            if (assessment.score >= 0.7)
                continue; // Only include issues
            // Add issues
            if (assessment.issues) {
                for (var _a = 0, _b = assessment.issues; _a < _b.length; _a++) {
                    var issue = _b[_a];
                    items.push({
                        id: this.generateId(),
                        priority: assessment.score < 0.3 ? 'high' : 'medium',
                        category: assessment.category,
                        title: "".concat(assessment.name, ": Issue"),
                        description: issue,
                        actions: assessment.recommendations || ['Address this issue'],
                        effort: 'moderate',
                        source: "custom-".concat(assessment.name),
                    });
                }
            }
        }
        return items;
    };
    /**
     * Generate overall assessment
     */
    FeedbackSynthesizer.prototype.generateAssessment = function (input, items) {
        // Calculate score based on items
        var score = 100;
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            switch (item.priority) {
                case 'critical':
                    score -= 25;
                    break;
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 8;
                    break;
                case 'low':
                    score -= 3;
                    break;
            }
        }
        // Factor in confidence if available
        if (input.confidence) {
            score = (score + input.confidence.score * 100) / 2;
        }
        score = Math.max(0, Math.min(100, score));
        // Determine grade
        var grade = score >= 90 ? 'A' :
            score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                    score >= 60 ? 'D' : 'F';
        // Identify strengths and weaknesses
        var strengths = [];
        var weaknesses = [];
        if (input.confidence) {
            for (var _a = 0, _b = Object.entries(input.confidence.factors); _a < _b.length; _a++) {
                var _c = _b[_a], name_2 = _c[0], value = _c[1];
                if (typeof value !== 'number')
                    continue;
                if (value >= 0.7) {
                    strengths.push(this.formatFactorTitle(name_2));
                }
                else if (value < 0.5) {
                    weaknesses.push(this.formatFactorTitle(name_2));
                }
            }
        }
        // Verdict
        var isAcceptable = score >= 60 && items.filter(function (i) { return i.priority === 'critical'; }).length === 0;
        var verdict = isAcceptable
            ? score >= 80
                ? 'Output meets quality standards with minor improvements possible'
                : 'Output is acceptable but has room for improvement'
            : 'Output requires revision before acceptance';
        return {
            grade: grade,
            score: score,
            isAcceptable: isAcceptable,
            strengths: strengths.slice(0, 3),
            weaknesses: weaknesses.slice(0, 3),
            verdict: verdict,
        };
    };
    /**
     * Generate summary of feedback
     */
    FeedbackSynthesizer.prototype.generateSummary = function (items, assessment) {
        var criticalCount = items.filter(function (i) { return i.priority === 'critical'; }).length;
        var highCount = items.filter(function (i) { return i.priority === 'high'; }).length;
        var summary = "Grade: ".concat(assessment.grade, " (").concat(assessment.score.toFixed(0), "%). ");
        summary += "".concat(items.length, " feedback items: ");
        if (criticalCount > 0) {
            summary += "".concat(criticalCount, " critical, ");
        }
        if (highCount > 0) {
            summary += "".concat(highCount, " high priority. ");
        }
        summary += assessment.verdict;
        return summary;
    };
    /**
     * Generate revision prompt
     */
    FeedbackSynthesizer.prototype.generateRevisionPrompt = function (items, originalInput, tone) {
        if (tone === void 0) { tone = 'direct'; }
        var criticalItems = items.filter(function (i) { return i.priority === 'critical'; });
        var highItems = items.filter(function (i) { return i.priority === 'high'; });
        var prompt = '';
        // Tone-based intro
        switch (tone) {
            case 'formal':
                prompt = 'Please revise the output addressing the following items:\n\n';
                break;
            case 'friendly':
                prompt = 'Great start! Here are some improvements to make:\n\n';
                break;
            case 'direct':
                prompt = 'Revise with these fixes:\n\n';
                break;
        }
        // Critical items first
        if (criticalItems.length > 0) {
            prompt += '**CRITICAL (must fix):**\n';
            for (var _i = 0, criticalItems_1 = criticalItems; _i < criticalItems_1.length; _i++) {
                var item = criticalItems_1[_i];
                prompt += "- ".concat(item.title, ": ").concat(item.actions[0], "\n");
            }
            prompt += '\n';
        }
        // High priority items
        if (highItems.length > 0) {
            prompt += '**HIGH PRIORITY:**\n';
            for (var _a = 0, highItems_1 = highItems; _a < highItems_1.length; _a++) {
                var item = highItems_1[_a];
                prompt += "- ".concat(item.title, ": ").concat(item.actions[0], "\n");
            }
            prompt += '\n';
        }
        // Reference original input if available
        if (originalInput) {
            prompt += "\nOriginal request: \"".concat(originalInput.substring(0, 200)).concat(originalInput.length > 200 ? '...' : '', "\"\n");
        }
        return prompt;
    };
    // =============================================================================
    // HELPER METHODS
    // =============================================================================
    FeedbackSynthesizer.prototype.scoreToPriority = function (score) {
        if (score >= 0.3)
            return 'critical';
        if (score >= 0.2)
            return 'high';
        if (score >= 0.1)
            return 'medium';
        return 'low';
    };
    FeedbackSynthesizer.prototype.formatFactorTitle = function (name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/-/g, ' ')
            .toLowerCase()
            .replace(/^\w/, function (c) { return c.toUpperCase(); });
    };
    FeedbackSynthesizer.prototype.formatHallucinationType = function (type) {
        return type.replace(/-/g, ' ');
    };
    FeedbackSynthesizer.prototype.categorizeRecommendation = function (rec) {
        var lower = rec.toLowerCase();
        if (lower.includes('format') || lower.includes('structure'))
            return 'format';
        if (lower.includes('specific') || lower.includes('detail'))
            return 'specificity';
        if (lower.includes('source') || lower.includes('reference'))
            return 'verification';
        if (lower.includes('complete') || lower.includes('cover'))
            return 'completeness';
        return 'quality';
    };
    FeedbackSynthesizer.prototype.factorToCategory = function (name) {
        var map = {
            formatCompliance: 'format',
            completeness: 'completeness',
            inputAlignment: 'completeness',
            internalConsistency: 'accuracy',
            specificity: 'specificity',
            sourceAttribution: 'verification',
            skillReliability: 'performance',
        };
        return map[name] || 'quality';
    };
    FeedbackSynthesizer.prototype.getActionsForFactor = function (factor) {
        var actionMap = {
            confidence: ['Add more specific details', 'Include examples'],
            validation: ['Fix format errors', 'Match expected schema'],
            hallucination: ['Verify facts', 'Add sources'],
            completeness: ['Complete all sections', 'Expand on key points'],
            'user-feedback': ['Address user concerns', 'Incorporate feedback'],
        };
        return actionMap[factor.name] || ['Address the identified issue'];
    };
    FeedbackSynthesizer.prototype.getActionsForConfidenceFactor = function (name) {
        var actionMap = {
            formatCompliance: ['Ensure output matches expected format'],
            completeness: ['Cover all aspects of the request'],
            inputAlignment: ['Better address the original requirements'],
            internalConsistency: ['Remove contradictions', 'Ensure logical flow'],
            specificity: ['Add concrete details and examples'],
            sourceAttribution: ['Add references or documentation links'],
        };
        return actionMap[name] || ['Improve this aspect of the output'];
    };
    FeedbackSynthesizer.prototype.getEffortForFactor = function (factor) {
        if (factor.score > 0.7)
            return 'significant';
        if (factor.score > 0.4)
            return 'moderate';
        if (factor.score > 0.2)
            return 'minor';
        return 'trivial';
    };
    /**
     * Quick synthesis (returns just items)
     */
    FeedbackSynthesizer.prototype.quickSynthesize = function (input) {
        return this.synthesize(input, { generateRevisionPrompt: false }).items;
    };
    /**
     * Get revision prompt only
     */
    FeedbackSynthesizer.prototype.getRevisionPrompt = function (input, tone) {
        return this.synthesize(input, { generateRevisionPrompt: true, tone: tone }).revisionPrompt;
    };
    return FeedbackSynthesizer;
}());
exports.FeedbackSynthesizer = FeedbackSynthesizer;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global feedback synthesizer instance */
exports.feedbackSynthesizer = new FeedbackSynthesizer();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Synthesize feedback from inputs
 */
function synthesizeFeedback(input, options) {
    return exports.feedbackSynthesizer.synthesize(input, options);
}
/**
 * Quick synthesis
 */
function quickSynthesizeFeedback(input) {
    return exports.feedbackSynthesizer.quickSynthesize(input);
}
/**
 * Get revision prompt
 */
function getRevisionPrompt(input, tone) {
    return exports.feedbackSynthesizer.getRevisionPrompt(input, tone);
}

"use strict";
/**
 * Pattern Learner
 *
 * Learns from execution history, identifying successful patterns and
 * anti-patterns to improve future DAG execution and skill selection.
 *
 * @module dag/observability/pattern-learner
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternLearner = exports.PatternLearner = void 0;
exports.recordObservation = recordObservation;
exports.learnPatterns = learnPatterns;
exports.getApplicablePatterns = getApplicablePatterns;
exports.queryPatterns = queryPatterns;
exports.generateInsights = generateInsights;
exports.getLearnerStatistics = getLearnerStatistics;
exports.exportPatterns = exportPatterns;
// ============================================================================
// Default Values
// ============================================================================
var DEFAULT_OPTIONS = {
    minObservations: 5,
    minConfidence: 0.6,
    observationRetentionMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    autoPromote: true,
    maxPatterns: 1000,
    statisticalTesting: true,
};
var CONFIDENCE_THRESHOLDS = {
    high: 0.85,
    medium: 0.65,
    low: 0.45,
    experimental: 0,
};
// ============================================================================
// Pattern Learner Class
// ============================================================================
/**
 * Learns patterns from execution history
 */
var PatternLearner = /** @class */ (function () {
    function PatternLearner(options) {
        if (options === void 0) { options = {}; }
        this.patterns = new Map();
        this.observations = new Map();
        this.insights = [];
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), options);
    }
    /**
     * Record an execution observation
     */
    PatternLearner.prototype.recordObservation = function (observation) {
        var fullObservation = __assign(__assign({}, observation), { observationId: this.generateId('obs'), timestamp: new Date() });
        this.observations.set(fullObservation.observationId, fullObservation);
        // Trigger learning
        if (this.options.autoPromote) {
            this.learnFromObservation(fullObservation);
        }
        return fullObservation;
    };
    /**
     * Trigger learning from all observations
     */
    PatternLearner.prototype.learn = function () {
        var newPatterns = [];
        // Learn skill selection patterns
        newPatterns.push.apply(newPatterns, this.learnSkillSelectionPatterns());
        // Learn execution order patterns
        newPatterns.push.apply(newPatterns, this.learnExecutionOrderPatterns());
        // Learn model selection patterns
        newPatterns.push.apply(newPatterns, this.learnModelSelectionPatterns());
        // Learn failure prevention patterns
        newPatterns.push.apply(newPatterns, this.learnFailurePreventionPatterns());
        // Learn performance patterns
        newPatterns.push.apply(newPatterns, this.learnPerformancePatterns());
        // Add to pattern store
        for (var _i = 0, newPatterns_1 = newPatterns; _i < newPatterns_1.length; _i++) {
            var pattern = newPatterns_1[_i];
            this.patterns.set(pattern.patternId, pattern);
        }
        return newPatterns;
    };
    /**
     * Get applicable patterns for a task
     */
    PatternLearner.prototype.getApplicablePatterns = function (taskDescription, context) {
        var applicable = [];
        for (var _i = 0, _a = this.patterns.values(); _i < _a.length; _i++) {
            var pattern = _a[_i];
            var score = this.evaluatePatternApplicability(pattern, taskDescription, context);
            if (score > 0.5) {
                applicable.push({ pattern: pattern, score: score });
            }
        }
        return applicable
            .sort(function (a, b) { return b.score - a.score; })
            .map(function (a) { return a.pattern; });
    };
    /**
     * Query patterns
     */
    PatternLearner.prototype.queryPatterns = function (query) {
        var results = Array.from(this.patterns.values());
        if (query.type) {
            results = results.filter(function (p) { return p.type === query.type; });
        }
        if (query.minConfidence) {
            var threshold_1 = CONFIDENCE_THRESHOLDS[query.minConfidence];
            results = results.filter(function (p) { return p.confidenceScore >= threshold_1; });
        }
        if (query.tags && query.tags.length > 0) {
            results = results.filter(function (p) {
                return query.tags.some(function (tag) { return p.tags.includes(tag); });
            });
        }
        if (query.minSuccessRate !== undefined) {
            results = results.filter(function (p) { return p.successRate >= query.minSuccessRate; });
        }
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results;
    };
    /**
     * Get pattern by ID
     */
    PatternLearner.prototype.getPattern = function (patternId) {
        return this.patterns.get(patternId);
    };
    /**
     * Validate a pattern against new execution
     */
    PatternLearner.prototype.validatePattern = function (patternId, success, observationId) {
        var pattern = this.patterns.get(patternId);
        if (!pattern)
            return;
        pattern.validationCount++;
        pattern.evidence.observationCount++;
        if (success) {
            pattern.evidence.successCount++;
        }
        else {
            pattern.evidence.failureCount++;
        }
        if (observationId) {
            pattern.evidence.sampleExecutions.push(observationId);
            if (pattern.evidence.sampleExecutions.length > 20) {
                pattern.evidence.sampleExecutions.shift();
            }
        }
        // Update success rate
        pattern.successRate =
            pattern.evidence.successCount / pattern.evidence.observationCount;
        // Update confidence
        pattern.confidenceScore = this.calculateConfidence(pattern);
        pattern.confidence = this.confidenceLevel(pattern.confidenceScore);
        pattern.updatedAt = new Date();
    };
    /**
     * Generate insights from observations
     */
    PatternLearner.prototype.generateInsights = function () {
        var insights = [];
        // Correlation analysis
        insights.push.apply(insights, this.findCorrelations());
        // Trend analysis
        insights.push.apply(insights, this.findTrends());
        // Anomaly detection
        insights.push.apply(insights, this.findAnomalies());
        // Recommendations
        insights.push.apply(insights, this.generateRecommendations());
        this.insights = insights;
        return insights;
    };
    /**
     * Get all insights
     */
    PatternLearner.prototype.getInsights = function () {
        return this.insights;
    };
    /**
     * Export learned patterns
     */
    PatternLearner.prototype.exportPatterns = function (format) {
        if (format === void 0) { format = 'json'; }
        var patterns = Array.from(this.patterns.values());
        if (format === 'json') {
            return JSON.stringify(patterns, null, 2);
        }
        // Summary format
        var lines = [
            "# Learned Patterns Summary",
            "Total patterns: ".concat(patterns.length),
            '',
            '## By Type',
        ];
        var byType = this.groupBy(patterns, 'type');
        for (var _i = 0, _a = Object.entries(byType); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], typePatterns = _b[1];
            lines.push("- ".concat(type, ": ").concat(typePatterns.length, " patterns"));
        }
        lines.push('', '## Top Patterns by Success Rate');
        var topPatterns = patterns
            .sort(function (a, b) { return b.successRate - a.successRate; })
            .slice(0, 10);
        for (var _c = 0, topPatterns_1 = topPatterns; _c < topPatterns_1.length; _c++) {
            var pattern = topPatterns_1[_c];
            lines.push("- **".concat(pattern.name, "** (").concat((pattern.successRate * 100).toFixed(1), "% success)"));
            lines.push("  ".concat(pattern.description));
        }
        return lines.join('\n');
    };
    /**
     * Import patterns
     */
    PatternLearner.prototype.importPatterns = function (patternsJson) {
        try {
            var patterns = JSON.parse(patternsJson);
            var imported = 0;
            for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
                var pattern = patterns_1[_i];
                if (pattern.patternId && pattern.type) {
                    this.patterns.set(pattern.patternId, pattern);
                    imported++;
                }
            }
            return imported;
        }
        catch (_a) {
            return 0;
        }
    };
    /**
     * Clear old observations
     */
    PatternLearner.prototype.clearOldObservations = function () {
        var cutoff = new Date(Date.now() - (this.options.observationRetentionMs || 30 * 24 * 60 * 60 * 1000));
        var cleared = 0;
        for (var _i = 0, _a = this.observations; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], obs = _b[1];
            if (obs.timestamp < cutoff) {
                this.observations.delete(id);
                cleared++;
            }
        }
        return cleared;
    };
    /**
     * Get statistics
     */
    PatternLearner.prototype.getStatistics = function () {
        var patterns = Array.from(this.patterns.values());
        var observations = Array.from(this.observations.values());
        return {
            totalPatterns: patterns.length,
            totalObservations: observations.length,
            patternsByType: this.countBy(patterns, 'type'),
            patternsByConfidence: this.countBy(patterns, 'confidence'),
            avgSuccessRate: patterns.length > 0
                ? patterns.reduce(function (sum, p) { return sum + p.successRate; }, 0) / patterns.length
                : 0,
            observationSuccessRate: observations.length > 0
                ? observations.filter(function (o) { return o.success; }).length / observations.length
                : 0,
            topSkills: this.getTopSkills(observations),
            avgQualityScore: this.calculateAvgQualityScore(observations),
        };
    };
    // ============================================================================
    // Private Methods - Learning Algorithms
    // ============================================================================
    PatternLearner.prototype.generateId = function (prefix) {
        return "".concat(prefix, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    PatternLearner.prototype.learnFromObservation = function (observation) {
        // Quick incremental learning
        var relevantPatterns = this.findRelevantPatterns(observation);
        for (var _i = 0, relevantPatterns_1 = relevantPatterns; _i < relevantPatterns_1.length; _i++) {
            var pattern = relevantPatterns_1[_i];
            this.validatePattern(pattern.patternId, observation.success, observation.observationId);
        }
    };
    PatternLearner.prototype.findRelevantPatterns = function (observation) {
        var relevant = [];
        for (var _i = 0, _a = this.patterns.values(); _i < _a.length; _i++) {
            var pattern = _a[_i];
            if (this.matchesPatternConditions(pattern, observation)) {
                relevant.push(pattern);
            }
        }
        return relevant;
    };
    PatternLearner.prototype.matchesPatternConditions = function (pattern, observation) {
        for (var _i = 0, _a = pattern.conditions; _i < _a.length; _i++) {
            var condition = _a[_i];
            if (!this.evaluateCondition(condition, observation)) {
                return false;
            }
        }
        return true;
    };
    PatternLearner.prototype.evaluateCondition = function (condition, observation) {
        var value;
        switch (condition.type) {
            case 'task-type':
                value = observation.taskDescription;
                break;
            case 'input-size':
                value = observation.inputCharacteristics.size;
                break;
            case 'complexity':
                value = observation.inputCharacteristics.complexity;
                break;
            case 'skill':
                value = observation.skillsUsed;
                break;
            case 'context':
                value = condition.field ? observation.context[condition.field] : observation.context;
                break;
            default:
                return false;
        }
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                if (Array.isArray(value)) {
                    return value.includes(condition.value);
                }
                return String(value).includes(String(condition.value));
            case 'greater-than':
                return Number(value) > Number(condition.value);
            case 'less-than':
                return Number(value) < Number(condition.value);
            case 'matches':
                return new RegExp(String(condition.value), 'i').test(String(value));
            default:
                return false;
        }
    };
    PatternLearner.prototype.learnSkillSelectionPatterns = function () {
        var patterns = [];
        var observations = Array.from(this.observations.values());
        // Group by task keywords
        var taskKeywords = this.extractTaskKeywords(observations);
        for (var _i = 0, _a = Object.entries(taskKeywords); _i < _a.length; _i++) {
            var _b = _a[_i], keyword = _b[0], obs = _b[1];
            if (obs.length < (this.options.minObservations || 5))
                continue;
            // Find most successful skill combinations
            var skillCombos = this.groupBy(obs, function (o) { return o.skillsUsed.sort().join(','); });
            for (var _c = 0, _d = Object.entries(skillCombos); _c < _d.length; _c++) {
                var _e = _d[_c], combo = _e[0], comboObs = _e[1];
                var successRate = comboObs.filter(function (o) { return o.success; }).length / comboObs.length;
                if (successRate >= 0.7 && comboObs.length >= 3) {
                    patterns.push(this.createPattern({
                        type: 'skill-selection',
                        name: "Skills for \"".concat(keyword, "\" tasks"),
                        description: "Use skills [".concat(combo, "] for tasks involving \"").concat(keyword, "\""),
                        conditions: [
                            { type: 'task-type', operator: 'contains', value: keyword },
                        ],
                        recommendation: {
                            action: 'select-skills',
                            parameters: { skills: combo.split(',') },
                            expectedImprovement: { metric: 'success-rate', improvement: successRate, unit: '%' },
                        },
                        evidence: {
                            observationCount: comboObs.length,
                            successCount: comboObs.filter(function (o) { return o.success; }).length,
                            failureCount: comboObs.filter(function (o) { return !o.success; }).length,
                            sampleExecutions: comboObs.slice(0, 5).map(function (o) { return o.observationId; }),
                        },
                        successRate: successRate,
                        tags: ['skill-selection', keyword],
                    }));
                }
            }
        }
        return patterns;
    };
    PatternLearner.prototype.learnExecutionOrderPatterns = function () {
        var patterns = [];
        var observations = Array.from(this.observations.values());
        // Group by execution order
        var orderGroups = this.groupBy(observations, function (o) { return o.executionOrder.join('->'); });
        for (var _i = 0, _a = Object.entries(orderGroups); _i < _a.length; _i++) {
            var _b = _a[_i], order = _b[0], obs = _b[1];
            if (obs.length < (this.options.minObservations || 5))
                continue;
            var successRate = obs.filter(function (o) { return o.success; }).length / obs.length;
            var avgDuration = obs.reduce(function (sum, o) { return sum + o.metrics.durationMs; }, 0) / obs.length;
            if (successRate >= 0.8) {
                patterns.push(this.createPattern({
                    type: 'execution-order',
                    name: "Order: ".concat(order),
                    description: "Execute in order: ".concat(order.replace(/->/g, ' → ')),
                    conditions: [
                        { type: 'skill', operator: 'contains', value: obs[0].skillsUsed[0] },
                    ],
                    recommendation: {
                        action: 'set-execution-order',
                        parameters: { order: order.split('->') },
                        expectedImprovement: { metric: 'duration', improvement: avgDuration, unit: 'ms' },
                    },
                    evidence: {
                        observationCount: obs.length,
                        successCount: obs.filter(function (o) { return o.success; }).length,
                        failureCount: obs.filter(function (o) { return !o.success; }).length,
                        sampleExecutions: obs.slice(0, 5).map(function (o) { return o.observationId; }),
                        avgImprovement: avgDuration,
                    },
                    successRate: successRate,
                    tags: ['execution-order'],
                }));
            }
        }
        return patterns;
    };
    PatternLearner.prototype.learnModelSelectionPatterns = function () {
        var patterns = [];
        var observations = Array.from(this.observations.values()).filter(function (o) { return o.model; });
        // Group by complexity and model
        var complexityGroups = this.groupBy(observations, function (o) { var _a, _b; return (_b = (_a = o.inputCharacteristics) === null || _a === void 0 ? void 0 : _a.complexity) !== null && _b !== void 0 ? _b : 'unknown'; });
        for (var _i = 0, _a = Object.entries(complexityGroups); _i < _a.length; _i++) {
            var _b = _a[_i], complexity = _b[0], obs = _b[1];
            var modelGroups = this.groupBy(obs, 'model');
            // Find best model for this complexity
            var bestModel = '';
            var bestScore = 0;
            for (var _c = 0, _d = Object.entries(modelGroups); _c < _d.length; _c++) {
                var _e = _d[_c], model = _e[0], modelObs = _e[1];
                if (modelObs.length < 3)
                    continue;
                var avgQuality = modelObs
                    .filter(function (o) { return o.qualityScore !== undefined; })
                    .reduce(function (sum, o) { return sum + (o.qualityScore || 0); }, 0) /
                    modelObs.filter(function (o) { return o.qualityScore !== undefined; }).length;
                var successRate = modelObs.filter(function (o) { return o.success; }).length / modelObs.length;
                var score = avgQuality * 0.6 + successRate * 0.4;
                if (score > bestScore) {
                    bestScore = score;
                    bestModel = model;
                }
            }
            if (bestModel && bestScore > 0.7) {
                var modelObs = modelGroups[bestModel];
                patterns.push(this.createPattern({
                    type: 'model-selection',
                    name: "Model for ".concat(complexity, " complexity"),
                    description: "Use ".concat(bestModel, " for ").concat(complexity, " complexity tasks"),
                    conditions: [
                        { type: 'complexity', operator: 'equals', value: complexity },
                    ],
                    recommendation: {
                        action: 'select-model',
                        parameters: { model: bestModel },
                        expectedImprovement: { metric: 'quality', improvement: bestScore, unit: 'score' },
                    },
                    evidence: {
                        observationCount: modelObs.length,
                        successCount: modelObs.filter(function (o) { return o.success; }).length,
                        failureCount: modelObs.filter(function (o) { return !o.success; }).length,
                        sampleExecutions: modelObs.slice(0, 5).map(function (o) { return o.observationId; }),
                    },
                    successRate: modelObs.filter(function (o) { return o.success; }).length / modelObs.length,
                    tags: ['model-selection', complexity],
                }));
            }
        }
        return patterns;
    };
    PatternLearner.prototype.learnFailurePreventionPatterns = function () {
        var patterns = [];
        var failures = Array.from(this.observations.values()).filter(function (o) { return !o.success; });
        if (failures.length < (this.options.minObservations || 5)) {
            return patterns;
        }
        // Analyze common failure characteristics
        var inputSizeFailures = failures.filter(function (f) { return f.inputCharacteristics.size > 10000; });
        if (inputSizeFailures.length >= 3) {
            var avgSize = inputSizeFailures.reduce(function (sum, f) { return sum + f.inputCharacteristics.size; }, 0) /
                inputSizeFailures.length;
            patterns.push(this.createPattern({
                type: 'failure-prevention',
                name: 'Large input warning',
                description: "Inputs larger than ".concat(Math.round(avgSize), " bytes have higher failure rate"),
                conditions: [
                    { type: 'input-size', operator: 'greater-than', value: avgSize * 0.8 },
                ],
                recommendation: {
                    action: 'chunk-input',
                    parameters: { maxSize: Math.round(avgSize * 0.7) },
                    expectedImprovement: { metric: 'failure-rate', improvement: 0.5, unit: 'ratio' },
                },
                evidence: {
                    observationCount: inputSizeFailures.length,
                    successCount: 0,
                    failureCount: inputSizeFailures.length,
                    sampleExecutions: inputSizeFailures.slice(0, 5).map(function (f) { return f.observationId; }),
                },
                successRate: 0,
                tags: ['failure-prevention', 'input-size'],
            }));
        }
        // High retry count failures
        var highRetryFailures = failures.filter(function (f) { return f.metrics.retryCount >= 3; });
        if (highRetryFailures.length >= 3) {
            patterns.push(this.createPattern({
                type: 'failure-prevention',
                name: 'Retry exhaustion warning',
                description: 'Operations with 3+ retries often fail permanently',
                conditions: [
                    { type: 'context', operator: 'greater-than', value: 2, field: 'retryCount' },
                ],
                recommendation: {
                    action: 'adjust-retry-strategy',
                    parameters: { maxRetries: 2, backoffMultiplier: 2 },
                    expectedImprovement: { metric: 'resource-waste', improvement: 0.4, unit: 'ratio' },
                },
                evidence: {
                    observationCount: highRetryFailures.length,
                    successCount: 0,
                    failureCount: highRetryFailures.length,
                    sampleExecutions: highRetryFailures.slice(0, 5).map(function (f) { return f.observationId; }),
                },
                successRate: 0,
                tags: ['failure-prevention', 'retry'],
            }));
        }
        return patterns;
    };
    PatternLearner.prototype.learnPerformancePatterns = function () {
        var patterns = [];
        var successes = Array.from(this.observations.values()).filter(function (o) { return o.success; });
        if (successes.length < (this.options.minObservations || 5)) {
            return patterns;
        }
        // Find fast executions
        var durations = successes.map(function (s) { return s.metrics.durationMs; }).sort(function (a, b) { return a - b; });
        var p25 = durations[Math.floor(durations.length * 0.25)];
        var fastExecutions = successes.filter(function (s) { return s.metrics.durationMs <= p25; });
        if (fastExecutions.length >= 3) {
            // What do fast executions have in common?
            var commonSkills = this.findCommonElements(fastExecutions.map(function (f) { return f.skillsUsed; }));
            if (commonSkills.length > 0) {
                patterns.push(this.createPattern({
                    type: 'performance',
                    name: 'Fast execution pattern',
                    description: "Tasks with skills [".concat(commonSkills.join(', '), "] execute faster"),
                    conditions: [
                        { type: 'skill', operator: 'contains', value: commonSkills[0] },
                    ],
                    recommendation: {
                        action: 'prefer-skills',
                        parameters: { skills: commonSkills },
                        expectedImprovement: { metric: 'duration', improvement: p25, unit: 'ms' },
                    },
                    evidence: {
                        observationCount: fastExecutions.length,
                        successCount: fastExecutions.length,
                        failureCount: 0,
                        sampleExecutions: fastExecutions.slice(0, 5).map(function (f) { return f.observationId; }),
                        avgImprovement: p25,
                    },
                    successRate: 1,
                    tags: ['performance', 'latency'],
                }));
            }
        }
        return patterns;
    };
    PatternLearner.prototype.createPattern = function (params) {
        var confidenceScore = this.calculateInitialConfidence(params.evidence, params.successRate);
        return {
            patternId: this.generateId('pattern'),
            type: params.type,
            name: params.name,
            description: params.description,
            confidence: this.confidenceLevel(confidenceScore),
            confidenceScore: confidenceScore,
            conditions: params.conditions,
            recommendation: params.recommendation,
            evidence: params.evidence,
            learnedAt: new Date(),
            updatedAt: new Date(),
            validationCount: params.evidence.observationCount,
            successRate: params.successRate,
            tags: params.tags,
        };
    };
    PatternLearner.prototype.calculateInitialConfidence = function (evidence, successRate) {
        // Factors: observation count, success rate, consistency
        var countFactor = Math.min(1, evidence.observationCount / 20);
        var successFactor = successRate;
        var consistencyFactor = evidence.observationCount > 0
            ? 1 -
                Math.abs(evidence.successCount / evidence.observationCount - successRate)
            : 0.5;
        return countFactor * 0.3 + successFactor * 0.5 + consistencyFactor * 0.2;
    };
    PatternLearner.prototype.calculateConfidence = function (pattern) {
        var evidence = pattern.evidence;
        var countFactor = Math.min(1, evidence.observationCount / 30);
        var successFactor = pattern.successRate;
        var ageFactor = Math.min(1, (Date.now() - pattern.learnedAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return countFactor * 0.3 + successFactor * 0.5 + ageFactor * 0.2;
    };
    PatternLearner.prototype.confidenceLevel = function (score) {
        if (score >= CONFIDENCE_THRESHOLDS.high)
            return 'high';
        if (score >= CONFIDENCE_THRESHOLDS.medium)
            return 'medium';
        if (score >= CONFIDENCE_THRESHOLDS.low)
            return 'low';
        return 'experimental';
    };
    PatternLearner.prototype.evaluatePatternApplicability = function (pattern, taskDescription, context) {
        var score = pattern.confidenceScore * 0.5;
        // Check conditions
        var conditionsMet = 0;
        for (var _i = 0, _a = pattern.conditions; _i < _a.length; _i++) {
            var condition = _a[_i];
            if (condition.type === 'task-type') {
                if (taskDescription.toLowerCase().includes(String(condition.value).toLowerCase())) {
                    conditionsMet++;
                }
            }
            else if (condition.type === 'context' && condition.field) {
                var contextValue = context[condition.field];
                if (contextValue === condition.value) {
                    conditionsMet++;
                }
            }
        }
        if (pattern.conditions.length > 0) {
            score += (conditionsMet / pattern.conditions.length) * 0.5;
        }
        return score;
    };
    // ============================================================================
    // Private Methods - Insights
    // ============================================================================
    PatternLearner.prototype.findCorrelations = function () {
        var insights = [];
        var observations = Array.from(this.observations.values());
        // Correlation: success rate vs input size
        var smallInputs = observations.filter(function (o) { return o.inputCharacteristics.size < 1000; });
        var largeInputs = observations.filter(function (o) { return o.inputCharacteristics.size >= 10000; });
        if (smallInputs.length >= 5 && largeInputs.length >= 5) {
            var smallSuccess = smallInputs.filter(function (o) { return o.success; }).length / smallInputs.length;
            var largeSuccess = largeInputs.filter(function (o) { return o.success; }).length / largeInputs.length;
            if (smallSuccess - largeSuccess > 0.2) {
                insights.push({
                    insightId: this.generateId('insight'),
                    type: 'correlation',
                    title: 'Input size affects success rate',
                    description: "Small inputs have ".concat(((smallSuccess - largeSuccess) * 100).toFixed(1), "% higher success rate"),
                    confidence: 0.8,
                    data: { smallSuccess: smallSuccess, largeSuccess: largeSuccess },
                    suggestedAction: 'Consider chunking large inputs',
                    impactEstimate: "Could improve success rate by ".concat(((smallSuccess - largeSuccess) * 100).toFixed(1), "%"),
                });
            }
        }
        return insights;
    };
    PatternLearner.prototype.findTrends = function () {
        var insights = [];
        var observations = Array.from(this.observations.values())
            .sort(function (a, b) { return a.timestamp.getTime() - b.timestamp.getTime(); });
        if (observations.length < 10)
            return insights;
        // Split into halves
        var midpoint = Math.floor(observations.length / 2);
        var firstHalf = observations.slice(0, midpoint);
        var secondHalf = observations.slice(midpoint);
        var firstSuccess = firstHalf.filter(function (o) { return o.success; }).length / firstHalf.length;
        var secondSuccess = secondHalf.filter(function (o) { return o.success; }).length / secondHalf.length;
        if (Math.abs(secondSuccess - firstSuccess) > 0.1) {
            var trend = secondSuccess > firstSuccess ? 'improving' : 'declining';
            insights.push({
                insightId: this.generateId('insight'),
                type: 'trend',
                title: "Success rate is ".concat(trend),
                description: "Success rate changed from ".concat((firstSuccess * 100).toFixed(1), "% to ").concat((secondSuccess * 100).toFixed(1), "%"),
                confidence: 0.7,
                data: { firstSuccess: firstSuccess, secondSuccess: secondSuccess, trend: trend },
                suggestedAction: trend === 'declining'
                    ? 'Investigate recent failures'
                    : 'Continue current approach',
            });
        }
        return insights;
    };
    PatternLearner.prototype.findAnomalies = function () {
        var insights = [];
        var observations = Array.from(this.observations.values());
        // Find outlier durations
        var durations = observations.map(function (o) { return o.metrics.durationMs; });
        var mean = durations.reduce(function (a, b) { return a + b; }, 0) / durations.length;
        var stdDev = Math.sqrt(durations.reduce(function (sum, d) { return sum + Math.pow(d - mean, 2); }, 0) / durations.length);
        var outliers = observations.filter(function (o) { return Math.abs(o.metrics.durationMs - mean) > 2 * stdDev; });
        if (outliers.length > 0 && outliers.length < observations.length * 0.1) {
            insights.push({
                insightId: this.generateId('insight'),
                type: 'anomaly',
                title: 'Unusual execution times detected',
                description: "".concat(outliers.length, " executions had unusually long/short durations"),
                confidence: 0.6,
                data: {
                    outlierCount: outliers.length,
                    mean: mean,
                    stdDev: stdDev,
                    outlierIds: outliers.map(function (o) { return o.observationId; }),
                },
                suggestedAction: 'Investigate outlier executions for issues',
            });
        }
        return insights;
    };
    PatternLearner.prototype.generateRecommendations = function () {
        var insights = [];
        var stats = this.getStatistics();
        // Low overall success rate
        if (stats.observationSuccessRate < 0.7) {
            insights.push({
                insightId: this.generateId('insight'),
                type: 'recommendation',
                title: 'Improve overall success rate',
                description: "Current success rate (".concat((stats.observationSuccessRate * 100).toFixed(1), "%) is below target"),
                confidence: 0.9,
                data: { currentRate: stats.observationSuccessRate },
                suggestedAction: 'Review failure patterns and implement fixes',
                impactEstimate: 'Could improve to 80%+ success rate',
            });
        }
        return insights;
    };
    // ============================================================================
    // Private Methods - Utilities
    // ============================================================================
    PatternLearner.prototype.extractTaskKeywords = function (observations) {
        var keywords = {};
        var stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'to', 'for', 'and', 'or', 'of']);
        for (var _i = 0, observations_1 = observations; _i < observations_1.length; _i++) {
            var obs = observations_1[_i];
            var words = obs.taskDescription
                .toLowerCase()
                .split(/\s+/)
                .filter(function (w) { return w.length > 3 && !stopWords.has(w); });
            for (var _a = 0, words_1 = words; _a < words_1.length; _a++) {
                var word = words_1[_a];
                if (!keywords[word])
                    keywords[word] = [];
                keywords[word].push(obs);
            }
        }
        return keywords;
    };
    PatternLearner.prototype.groupBy = function (items, keyFn) {
        var groups = {};
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var key = typeof keyFn === 'function'
                ? keyFn(item)
                : String(item[keyFn]);
            if (!groups[key])
                groups[key] = [];
            groups[key].push(item);
        }
        return groups;
    };
    PatternLearner.prototype.countBy = function (items, key) {
        var counts = {};
        for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
            var item = items_2[_i];
            var value = String(item[key]);
            counts[value] = (counts[value] || 0) + 1;
        }
        return counts;
    };
    PatternLearner.prototype.findCommonElements = function (arrays) {
        if (arrays.length === 0)
            return [];
        var counts = new Map();
        for (var _i = 0, arrays_1 = arrays; _i < arrays_1.length; _i++) {
            var arr = arrays_1[_i];
            for (var _a = 0, arr_1 = arr; _a < arr_1.length; _a++) {
                var item = arr_1[_a];
                counts.set(item, (counts.get(item) || 0) + 1);
            }
        }
        var threshold = arrays.length * 0.7;
        return Array.from(counts.entries())
            .filter(function (_a) {
            var count = _a[1];
            return count >= threshold;
        })
            .map(function (_a) {
            var item = _a[0];
            return item;
        });
    };
    PatternLearner.prototype.getTopSkills = function (observations) {
        var counts = new Map();
        for (var _i = 0, observations_2 = observations; _i < observations_2.length; _i++) {
            var obs = observations_2[_i];
            for (var _a = 0, _b = obs.skillsUsed; _a < _b.length; _a++) {
                var skill = _b[_a];
                counts.set(skill, (counts.get(skill) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .map(function (_a) {
            var skill = _a[0], count = _a[1];
            return ({ skill: skill, count: count });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 10);
    };
    PatternLearner.prototype.calculateAvgQualityScore = function (observations) {
        var withQuality = observations.filter(function (o) { return o.qualityScore !== undefined; });
        if (withQuality.length === 0)
            return 0;
        return withQuality.reduce(function (sum, o) { return sum + (o.qualityScore || 0); }, 0) / withQuality.length;
    };
    return PatternLearner;
}());
exports.PatternLearner = PatternLearner;
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Global pattern learner instance
 */
exports.patternLearner = new PatternLearner();
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Record an execution observation
 */
function recordObservation(observation) {
    return exports.patternLearner.recordObservation(observation);
}
/**
 * Trigger learning from observations
 */
function learnPatterns() {
    return exports.patternLearner.learn();
}
/**
 * Get applicable patterns for a task
 */
function getApplicablePatterns(taskDescription, context) {
    if (context === void 0) { context = {}; }
    return exports.patternLearner.getApplicablePatterns(taskDescription, context);
}
/**
 * Query learned patterns
 */
function queryPatterns(query) {
    return exports.patternLearner.queryPatterns(query);
}
/**
 * Generate learning insights
 */
function generateInsights() {
    return exports.patternLearner.generateInsights();
}
/**
 * Get learner statistics
 */
function getLearnerStatistics() {
    return exports.patternLearner.getStatistics();
}
/**
 * Export patterns
 */
function exportPatterns(format) {
    return exports.patternLearner.exportPatterns(format);
}

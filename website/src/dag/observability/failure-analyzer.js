"use strict";
/**
 * Failure Analyzer
 *
 * Provides root cause analysis for DAG execution failures, categorizing
 * errors, identifying patterns, and suggesting remediation strategies.
 *
 * @module dag/observability/failure-analyzer
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
exports.failureAnalyzer = exports.FailureAnalyzer = void 0;
exports.recordFailure = recordFailure;
exports.analyzeFailure = analyzeFailure;
exports.findSimilarFailures = findSimilarFailures;
exports.generateFailureReport = generateFailureReport;
exports.getFailurePatterns = getFailurePatterns;
// ============================================================================
// Default Values
// ============================================================================
var DEFAULT_OPTIONS = {
    analyzeStackTrace: true,
    detectPatterns: true,
    maxRelatedFailures: 10,
    minPatternConfidence: 0.6,
    patternTimeWindowMs: 24 * 60 * 60 * 1000, // 24 hours
};
/**
 * Common error patterns and their categories
 */
var ERROR_PATTERNS = [
    {
        pattern: /rate.?limit|too.?many.?requests|429/i,
        category: 'rate-limit',
        severity: 'medium',
        description: 'API rate limit exceeded',
    },
    {
        pattern: /timeout|timed?.?out|deadline.?exceeded/i,
        category: 'timeout',
        severity: 'high',
        description: 'Operation timed out',
    },
    {
        pattern: /permission.?denied|unauthorized|403|forbidden/i,
        category: 'permission',
        severity: 'high',
        description: 'Permission denied',
    },
    {
        pattern: /not.?found|404|missing/i,
        category: 'input',
        severity: 'medium',
        description: 'Resource not found',
    },
    {
        pattern: /validation|invalid|malformed|schema/i,
        category: 'validation',
        severity: 'medium',
        description: 'Validation failed',
    },
    {
        pattern: /connection|network|dns|socket|econnrefused/i,
        category: 'network',
        severity: 'high',
        description: 'Network connectivity issue',
    },
    {
        pattern: /memory|heap|oom|out.?of.?memory/i,
        category: 'resource',
        severity: 'critical',
        description: 'Memory exhaustion',
    },
    {
        pattern: /token.?limit|context.?length|max.?tokens/i,
        category: 'resource',
        severity: 'high',
        description: 'Token/context limit exceeded',
    },
    {
        pattern: /config|configuration|setting|env/i,
        category: 'configuration',
        severity: 'high',
        description: 'Configuration error',
    },
    {
        pattern: /dependency|require|import|module/i,
        category: 'dependency',
        severity: 'high',
        description: 'Dependency issue',
    },
];
// ============================================================================
// Failure Analyzer Class
// ============================================================================
/**
 * Analyzes DAG execution failures
 */
var FailureAnalyzer = /** @class */ (function () {
    function FailureAnalyzer(options) {
        if (options === void 0) { options = {}; }
        this.failures = new Map();
        this.patterns = new Map();
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), options);
    }
    /**
     * Record a failure event
     */
    FailureAnalyzer.prototype.recordFailure = function (failure) {
        var event = __assign(__assign({}, failure), { failureId: this.generateId('fail'), timestamp: new Date() });
        this.failures.set(event.failureId, event);
        // Update patterns if enabled
        if (this.options.detectPatterns) {
            this.updatePatterns(event);
        }
        return event;
    };
    /**
     * Analyze a specific failure
     */
    FailureAnalyzer.prototype.analyze = function (failureId, options) {
        var failure = this.failures.get(failureId);
        if (!failure)
            return undefined;
        var opts = __assign(__assign({}, this.options), options);
        return this.performAnalysis(failure, opts);
    };
    /**
     * Analyze a failure event directly
     */
    FailureAnalyzer.prototype.analyzeEvent = function (failure, options) {
        var opts = __assign(__assign({}, this.options), options);
        return this.performAnalysis(failure, opts);
    };
    /**
     * Get failure by ID
     */
    FailureAnalyzer.prototype.getFailure = function (failureId) {
        return this.failures.get(failureId);
    };
    /**
     * Find similar failures
     */
    FailureAnalyzer.prototype.findSimilar = function (failureId, maxResults) {
        if (maxResults === void 0) { maxResults = 10; }
        var failure = this.failures.get(failureId);
        if (!failure)
            return [];
        return this.findRelatedFailures(failure, maxResults);
    };
    /**
     * Get all detected patterns
     */
    FailureAnalyzer.prototype.getPatterns = function () {
        return Array.from(this.patterns.values());
    };
    /**
     * Get pattern by ID
     */
    FailureAnalyzer.prototype.getPattern = function (patternId) {
        return this.patterns.get(patternId);
    };
    /**
     * Generate a failure report
     */
    FailureAnalyzer.prototype.generateReport = function (timeRange) {
        var now = new Date();
        var effectiveRange = timeRange || {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days
            end: now,
        };
        // Filter failures in time range
        var failuresInRange = Array.from(this.failures.values()).filter(function (f) { return f.timestamp >= effectiveRange.start && f.timestamp <= effectiveRange.end; });
        // Count by category
        var byCategory = {};
        for (var _i = 0, failuresInRange_1 = failuresInRange; _i < failuresInRange_1.length; _i++) {
            var failure = failuresInRange_1[_i];
            var category = this.categorize(failure).category;
            byCategory[category] = (byCategory[category] || 0) + 1;
        }
        // Count by severity
        var bySeverity = {};
        for (var _a = 0, failuresInRange_2 = failuresInRange; _a < failuresInRange_2.length; _a++) {
            var failure = failuresInRange_2[_a];
            var severity = this.assessSeverity(failure);
            bySeverity[severity] = (bySeverity[severity] || 0) + 1;
        }
        // Top failing operations
        var opCounts = new Map();
        for (var _b = 0, failuresInRange_3 = failuresInRange; _b < failuresInRange_3.length; _b++) {
            var failure = failuresInRange_3[_b];
            var existing = opCounts.get(failure.operationName) || { count: 0, total: 0 };
            existing.count++;
            existing.total++;
            opCounts.set(failure.operationName, existing);
        }
        var topFailingOperations = Array.from(opCounts.entries())
            .map(function (_a) {
            var operation = _a[0], _b = _a[1], count = _b.count, total = _b.total;
            return ({
                operation: operation,
                count: count,
                rate: total > 0 ? count / total : 0,
            });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 10);
        // Get patterns
        var patterns = Array.from(this.patterns.values()).filter(function (p) { return p.lastSeen >= effectiveRange.start && p.lastSeen <= effectiveRange.end; });
        // Trending analysis
        var trending = this.analyzeTrending(patterns, effectiveRange);
        // Generate recommendations
        var recommendations = this.generateReportRecommendations(byCategory, bySeverity, patterns);
        return {
            reportId: this.generateId('report'),
            generatedAt: now,
            timeRange: effectiveRange,
            totalFailures: failuresInRange.length,
            byCategory: byCategory,
            bySeverity: bySeverity,
            topFailingOperations: topFailingOperations,
            patterns: patterns,
            trending: trending,
            recommendations: recommendations,
        };
    };
    /**
     * Clear old failures
     */
    FailureAnalyzer.prototype.clearOldFailures = function (maxAgeMs) {
        var cutoff = new Date(Date.now() - maxAgeMs);
        var cleared = 0;
        for (var _i = 0, _a = this.failures; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], failure = _b[1];
            if (failure.timestamp < cutoff) {
                this.failures.delete(id);
                cleared++;
            }
        }
        return cleared;
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    FailureAnalyzer.prototype.generateId = function (prefix) {
        return "".concat(prefix, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    FailureAnalyzer.prototype.performAnalysis = function (failure, options) {
        // Categorize the failure
        var _a = this.categorize(failure), category = _a.category, catConfidence = _a.confidence;
        // Assess severity
        var severity = this.assessSeverity(failure);
        // Find evidence
        var evidence = this.gatherEvidence(failure, options);
        // Identify contributing factors
        var contributingFactors = this.identifyContributingFactors(failure);
        // Generate remediations
        var remediations = this.generateRemediations(failure, category, severity);
        // Find related failures
        var relatedFailures = options.maxRelatedFailures
            ? this.findRelatedFailures(failure, options.maxRelatedFailures).map(function (f) { return f.failureId; })
            : [];
        // Check for recurrence
        var _b = this.checkRecurrence(failure), isRecurring = _b.isRecurring, recurrenceCount = _b.recurrenceCount;
        // Build description
        var description = this.buildDescription(failure, category, contributingFactors);
        return {
            category: category,
            confidence: catConfidence,
            severity: severity,
            description: description,
            evidence: evidence,
            contributingFactors: contributingFactors,
            remediations: remediations,
            relatedFailures: relatedFailures,
            isRecurring: isRecurring,
            recurrenceCount: recurrenceCount,
        };
    };
    FailureAnalyzer.prototype.categorize = function (failure) {
        // Check against known error patterns
        for (var _i = 0, ERROR_PATTERNS_1 = ERROR_PATTERNS; _i < ERROR_PATTERNS_1.length; _i++) {
            var pattern = ERROR_PATTERNS_1[_i];
            if (pattern.pattern.test(failure.errorMessage) ||
                pattern.pattern.test(failure.errorType)) {
                return { category: pattern.category, confidence: 0.9 };
            }
        }
        // Check stack trace
        if (failure.stackTrace) {
            for (var _a = 0, ERROR_PATTERNS_2 = ERROR_PATTERNS; _a < ERROR_PATTERNS_2.length; _a++) {
                var pattern = ERROR_PATTERNS_2[_a];
                if (pattern.pattern.test(failure.stackTrace)) {
                    return { category: pattern.category, confidence: 0.7 };
                }
            }
        }
        // Check context
        if (failure.context) {
            var contextStr = JSON.stringify(failure.context);
            for (var _b = 0, ERROR_PATTERNS_3 = ERROR_PATTERNS; _b < ERROR_PATTERNS_3.length; _b++) {
                var pattern = ERROR_PATTERNS_3[_b];
                if (pattern.pattern.test(contextStr)) {
                    return { category: pattern.category, confidence: 0.6 };
                }
            }
        }
        // Default
        return { category: 'unknown', confidence: 0.3 };
    };
    FailureAnalyzer.prototype.assessSeverity = function (failure) {
        // Check against known patterns
        for (var _i = 0, ERROR_PATTERNS_4 = ERROR_PATTERNS; _i < ERROR_PATTERNS_4.length; _i++) {
            var pattern = ERROR_PATTERNS_4[_i];
            if (pattern.pattern.test(failure.errorMessage) ||
                pattern.pattern.test(failure.errorType)) {
                return pattern.severity;
            }
        }
        // Heuristics
        if (failure.wasRetried && !failure.retrySucceeded) {
            return 'high'; // Failed even after retry
        }
        if (failure.attemptNumber > 3) {
            return 'high'; // Multiple failed attempts
        }
        // Check for critical keywords
        var critical = /critical|fatal|crash|corrupt/i;
        if (critical.test(failure.errorMessage) || critical.test(failure.errorType)) {
            return 'critical';
        }
        return 'medium';
    };
    FailureAnalyzer.prototype.gatherEvidence = function (failure, options) {
        var evidence = [];
        evidence.push("Error type: ".concat(failure.errorType));
        evidence.push("Error message: ".concat(failure.errorMessage));
        evidence.push("Operation: ".concat(failure.operationName));
        if (failure.attemptNumber > 1) {
            evidence.push("Failed on attempt ".concat(failure.attemptNumber));
        }
        if (failure.wasRetried) {
            evidence.push(failure.retrySucceeded
                ? 'Retry succeeded'
                : 'Retry also failed');
        }
        if (options.analyzeStackTrace && failure.stackTrace) {
            // Extract key frames from stack trace
            var frames_1 = failure.stackTrace
                .split('\n')
                .filter(function (line) { return line.includes('at '); })
                .slice(0, 5);
            if (frames_1.length > 0) {
                evidence.push("Stack: ".concat(frames_1[0].trim()));
            }
        }
        if (failure.skillId) {
            evidence.push("Skill: ".concat(failure.skillId));
        }
        if (failure.nodeId) {
            evidence.push("Node: ".concat(failure.nodeId));
        }
        return evidence;
    };
    FailureAnalyzer.prototype.identifyContributingFactors = function (failure) {
        var factors = [];
        // Input-related
        if (failure.input) {
            var inputStr = JSON.stringify(failure.input);
            if (inputStr.length > 10000) {
                factors.push({
                    type: 'large_input',
                    description: 'Input size is very large',
                    weight: 0.3,
                });
            }
        }
        // Retry-related
        if (failure.attemptNumber > 1) {
            factors.push({
                type: 'repeated_failure',
                description: "Failed ".concat(failure.attemptNumber, " times"),
                weight: 0.4,
            });
        }
        // Context-related
        if (failure.context) {
            if (failure.context['tokenCount'] && failure.context['tokenCount'] > 50000) {
                factors.push({
                    type: 'high_token_usage',
                    description: 'High token count in context',
                    weight: 0.3,
                });
            }
            if (failure.context['latencyMs'] && failure.context['latencyMs'] > 30000) {
                factors.push({
                    type: 'slow_operation',
                    description: 'Operation was taking too long',
                    weight: 0.2,
                });
            }
        }
        // Time-based (late night might indicate batch job issues)
        var hour = failure.timestamp.getHours();
        if (hour >= 0 && hour < 6) {
            factors.push({
                type: 'off_hours',
                description: 'Occurred during off-peak hours',
                weight: 0.1,
            });
        }
        return factors.sort(function (a, b) { return b.weight - a.weight; });
    };
    FailureAnalyzer.prototype.generateRemediations = function (failure, category, severity) {
        var remediations = [];
        switch (category) {
            case 'rate-limit':
                remediations.push({
                    type: 'immediate',
                    priority: 'high',
                    action: 'Implement exponential backoff',
                    steps: [
                        'Add delay before retry',
                        'Double delay on each subsequent failure',
                        'Cap maximum delay at 60 seconds',
                    ],
                    expectedImpact: 'Prevents overwhelming the API',
                    autoFixable: true,
                });
                remediations.push({
                    type: 'long-term',
                    priority: 'medium',
                    action: 'Request rate limit increase',
                    steps: ['Contact API provider', 'Upgrade tier if needed'],
                    expectedImpact: 'Higher throughput capacity',
                    autoFixable: false,
                });
                break;
            case 'timeout':
                remediations.push({
                    type: 'immediate',
                    priority: 'high',
                    action: 'Increase timeout threshold',
                    steps: [
                        'Review current timeout setting',
                        'Increase to accommodate operation complexity',
                        'Consider operation-specific timeouts',
                    ],
                    expectedImpact: 'Allows operations to complete',
                    autoFixable: true,
                });
                remediations.push({
                    type: 'short-term',
                    priority: 'medium',
                    action: 'Optimize operation',
                    steps: [
                        'Profile operation to find bottlenecks',
                        'Reduce input size if possible',
                        'Use streaming for long operations',
                    ],
                    expectedImpact: 'Faster operation completion',
                    autoFixable: false,
                });
                break;
            case 'permission':
                remediations.push({
                    type: 'immediate',
                    priority: 'high',
                    action: 'Review permission configuration',
                    steps: [
                        'Check permission matrix for this operation',
                        'Verify API keys and credentials',
                        'Ensure proper scopes are granted',
                    ],
                    expectedImpact: 'Operation will have required access',
                    autoFixable: false,
                });
                break;
            case 'validation':
                remediations.push({
                    type: 'immediate',
                    priority: 'medium',
                    action: 'Fix output format',
                    steps: [
                        'Review expected schema',
                        'Add explicit format instructions to prompt',
                        'Implement format repair if needed',
                    ],
                    expectedImpact: 'Outputs will pass validation',
                    autoFixable: true,
                });
                break;
            case 'resource':
                remediations.push({
                    type: 'immediate',
                    priority: 'high',
                    action: 'Reduce resource consumption',
                    steps: [
                        'Reduce context/input size',
                        'Use smaller model for this operation',
                        'Implement chunking for large inputs',
                    ],
                    expectedImpact: 'Stay within resource limits',
                    autoFixable: true,
                });
                break;
            case 'network':
                remediations.push({
                    type: 'immediate',
                    priority: 'high',
                    action: 'Implement retry with backoff',
                    steps: [
                        'Add network retry logic',
                        'Use exponential backoff',
                        'Consider fallback endpoints',
                    ],
                    expectedImpact: 'Resilient to transient network issues',
                    autoFixable: true,
                });
                break;
            default:
                remediations.push({
                    type: 'immediate',
                    priority: 'medium',
                    action: 'Investigate and log details',
                    steps: [
                        'Enable verbose logging',
                        'Capture full error context',
                        'Review execution trace',
                    ],
                    expectedImpact: 'Better understanding of failure cause',
                    autoFixable: false,
                });
        }
        return remediations;
    };
    FailureAnalyzer.prototype.findRelatedFailures = function (failure, maxResults) {
        var related = [];
        for (var _i = 0, _a = this.failures; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], other = _b[1];
            if (id === failure.failureId)
                continue;
            var score = 0;
            // Same operation
            if (other.operationName === failure.operationName)
                score += 0.3;
            // Same error type
            if (other.errorType === failure.errorType)
                score += 0.3;
            // Similar error message
            if (this.similarMessages(other.errorMessage, failure.errorMessage))
                score += 0.2;
            // Same skill
            if (other.skillId && other.skillId === failure.skillId)
                score += 0.1;
            // Same DAG
            if (other.dagId && other.dagId === failure.dagId)
                score += 0.1;
            if (score > 0.3) {
                related.push({ failure: other, score: score });
            }
        }
        return related
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, maxResults)
            .map(function (r) { return r.failure; });
    };
    FailureAnalyzer.prototype.similarMessages = function (msg1, msg2) {
        // Simple similarity check
        var words1 = new Set(msg1.toLowerCase().split(/\s+/));
        var words2 = new Set(msg2.toLowerCase().split(/\s+/));
        var overlap = 0;
        for (var _i = 0, words1_1 = words1; _i < words1_1.length; _i++) {
            var word = words1_1[_i];
            if (words2.has(word))
                overlap++;
        }
        var union = words1.size + words2.size - overlap;
        return union > 0 && overlap / union > 0.5;
    };
    FailureAnalyzer.prototype.checkRecurrence = function (failure) {
        var windowMs = this.options.patternTimeWindowMs || 24 * 60 * 60 * 1000;
        var cutoff = new Date(failure.timestamp.getTime() - windowMs);
        var count = 0;
        for (var _i = 0, _a = this.failures.values(); _i < _a.length; _i++) {
            var other = _a[_i];
            if (other.failureId !== failure.failureId &&
                other.timestamp >= cutoff &&
                other.operationName === failure.operationName &&
                other.errorType === failure.errorType) {
                count++;
            }
        }
        return {
            isRecurring: count >= 2,
            recurrenceCount: count > 0 ? count : undefined,
        };
    };
    FailureAnalyzer.prototype.buildDescription = function (failure, category, factors) {
        var _a;
        var parts = [];
        // Category description
        var categoryDesc = (_a = ERROR_PATTERNS.find(function (p) { return p.category === category; })) === null || _a === void 0 ? void 0 : _a.description;
        if (categoryDesc) {
            parts.push(categoryDesc);
        }
        else {
            parts.push("".concat(category, " failure"));
        }
        parts.push("in operation \"".concat(failure.operationName, "\""));
        if (factors.length > 0) {
            var topFactor = factors[0];
            parts.push("(".concat(topFactor.description, ")"));
        }
        return parts.join(' ');
    };
    FailureAnalyzer.prototype.updatePatterns = function (failure) {
        // Check existing patterns
        for (var _i = 0, _a = this.patterns; _i < _a.length; _i++) {
            var _b = _a[_i], patternId = _b[0], pattern = _b[1];
            if (this.matchesPattern(failure, pattern)) {
                pattern.matchCount++;
                pattern.lastSeen = failure.timestamp;
                if (!pattern.affectedOperations.includes(failure.operationName)) {
                    pattern.affectedOperations.push(failure.operationName);
                }
                return;
            }
        }
        // Check if this creates a new pattern
        var similar = this.findRelatedFailures(failure, 5);
        if (similar.length >= 2) {
            // Found potential pattern
            var pattern = {
                patternId: this.generateId('pattern'),
                name: "".concat(failure.errorType, " in ").concat(failure.operationName),
                description: failure.errorMessage.substring(0, 100),
                category: this.categorize(failure).category,
                matchers: [
                    {
                        field: 'errorType',
                        matchType: 'exact',
                        value: failure.errorType,
                    },
                    {
                        field: 'operationName',
                        matchType: 'exact',
                        value: failure.operationName,
                    },
                ],
                matchCount: similar.length + 1,
                firstSeen: similar.reduce(function (earliest, f) { return (f.timestamp < earliest ? f.timestamp : earliest); }, failure.timestamp),
                lastSeen: failure.timestamp,
                affectedOperations: __spreadArray([], new Set(__spreadArray([failure.operationName], similar.map(function (f) { return f.operationName; }), true)), true),
            };
            this.patterns.set(pattern.patternId, pattern);
        }
    };
    FailureAnalyzer.prototype.matchesPattern = function (failure, pattern) {
        for (var _i = 0, _a = pattern.matchers; _i < _a.length; _i++) {
            var matcher = _a[_i];
            var value = failure[matcher.field];
            var strValue = typeof value === 'string' ? value : JSON.stringify(value);
            switch (matcher.matchType) {
                case 'exact':
                    if (strValue !== matcher.value)
                        return false;
                    break;
                case 'contains':
                    if (!strValue.includes(matcher.value))
                        return false;
                    break;
                case 'startsWith':
                    if (!strValue.startsWith(matcher.value))
                        return false;
                    break;
                case 'regex':
                    if (!new RegExp(matcher.value).test(strValue))
                        return false;
                    break;
            }
        }
        return true;
    };
    FailureAnalyzer.prototype.analyzeTrending = function (patterns, timeRange) {
        var trending = [];
        var midpoint = new Date((timeRange.start.getTime() + timeRange.end.getTime()) / 2);
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            // Count failures in first half vs second half
            var firstHalf = 0;
            var secondHalf = 0;
            for (var _a = 0, _b = this.failures.values(); _a < _b.length; _a++) {
                var failure = _b[_a];
                if (this.matchesPattern(failure, pattern)) {
                    if (failure.timestamp < midpoint)
                        firstHalf++;
                    else
                        secondHalf++;
                }
            }
            var trend = void 0;
            if (secondHalf > firstHalf * 1.5) {
                trend = 'increasing';
            }
            else if (secondHalf < firstHalf * 0.5) {
                trend = 'decreasing';
            }
            else {
                trend = 'stable';
            }
            trending.push({ pattern: pattern.name, trend: trend });
        }
        return trending.filter(function (t) { return t.trend !== 'stable'; });
    };
    FailureAnalyzer.prototype.generateReportRecommendations = function (byCategory, bySeverity, patterns) {
        var recommendations = [];
        // Based on top categories
        var topCategories = Object.entries(byCategory)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 3);
        for (var _i = 0, topCategories_1 = topCategories; _i < topCategories_1.length; _i++) {
            var category = topCategories_1[_i][0];
            if (category === 'rate-limit') {
                recommendations.push({
                    type: 'short-term',
                    priority: 'high',
                    action: 'Implement request throttling',
                    steps: ['Add rate limiting', 'Use request queuing', 'Implement backoff'],
                    expectedImpact: "Reduce ".concat(category, " failures"),
                    autoFixable: true,
                });
            }
            if (category === 'timeout') {
                recommendations.push({
                    type: 'short-term',
                    priority: 'high',
                    action: 'Review timeout configuration',
                    steps: ['Audit timeout settings', 'Profile slow operations', 'Optimize where possible'],
                    expectedImpact: 'Fewer timeout failures',
                    autoFixable: false,
                });
            }
        }
        // Based on severity
        if ((bySeverity.critical || 0) > 0) {
            recommendations.push({
                type: 'immediate',
                priority: 'high',
                action: 'Address critical failures',
                steps: [
                    'Investigate critical failure patterns',
                    'Implement monitoring alerts',
                    'Add failsafe mechanisms',
                ],
                expectedImpact: 'Prevent system-wide issues',
                autoFixable: false,
            });
        }
        return recommendations;
    };
    return FailureAnalyzer;
}());
exports.FailureAnalyzer = FailureAnalyzer;
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Global failure analyzer instance
 */
exports.failureAnalyzer = new FailureAnalyzer();
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Record a failure event
 */
function recordFailure(failure) {
    return exports.failureAnalyzer.recordFailure(failure);
}
/**
 * Analyze a failure
 */
function analyzeFailure(failureId, options) {
    return exports.failureAnalyzer.analyze(failureId, options);
}
/**
 * Find similar failures
 */
function findSimilarFailures(failureId, maxResults) {
    return exports.failureAnalyzer.findSimilar(failureId, maxResults);
}
/**
 * Generate failure report
 */
function generateFailureReport(timeRange) {
    return exports.failureAnalyzer.generateReport(timeRange);
}
/**
 * Get detected failure patterns
 */
function getFailurePatterns() {
    return exports.failureAnalyzer.getPatterns();
}

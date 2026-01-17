"use strict";
/**
 * Convergence Monitor
 *
 * Tracks progress toward goal state across iterations, detecting when
 * the system is converging on a solution, plateauing, or diverging.
 *
 * @module dag/feedback/convergence-monitor
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
exports.convergenceMonitor = exports.ConvergenceMonitor = void 0;
exports.startConvergenceSession = startConvergenceSession;
exports.recordIteration = recordIteration;
exports.analyzeConvergence = analyzeConvergence;
exports.hasConverged = hasConverged;
exports.getConvergenceState = getConvergenceState;
exports.endConvergenceSession = endConvergenceSession;
// ============================================================================
// Default Values
// ============================================================================
var DEFAULT_GOAL = {
    minQualityScore: 0.8,
    minConfidenceScore: 0.7,
    maxValidationIssues: 0,
    maxHallucinations: 0,
};
var DEFAULT_OPTIONS = {
    movingAverageWindow: 3,
    minIterationsForAssessment: 2,
    stabilityThreshold: 0.05,
    maxIterations: 10,
    trackCustomMetrics: true,
};
// ============================================================================
// Convergence Monitor Class
// ============================================================================
/**
 * Monitors convergence toward goals across iterations
 */
var ConvergenceMonitor = /** @class */ (function () {
    function ConvergenceMonitor(defaultGoal) {
        if (defaultGoal === void 0) { defaultGoal = DEFAULT_GOAL; }
        this.sessions = new Map();
        this.defaultOptions = __assign(__assign({}, DEFAULT_OPTIONS), { goal: defaultGoal });
    }
    /**
     * Start a new convergence tracking session
     */
    ConvergenceMonitor.prototype.startSession = function (name, goal) {
        if (goal === void 0) { goal = this.defaultOptions.goal; }
        var session = {
            id: this.generateSessionId(),
            name: name,
            startedAt: new Date(),
            goal: goal,
            history: [],
            currentState: 'unknown',
            isActive: true,
        };
        this.sessions.set(session.id, session);
        return session;
    };
    /**
     * Record a data point for a session
     */
    ConvergenceMonitor.prototype.recordIteration = function (sessionId, data) {
        var session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error("Session not found: ".concat(sessionId));
        }
        if (!session.isActive) {
            throw new Error("Session is no longer active: ".concat(sessionId));
        }
        var dataPoint = __assign(__assign({}, data), { iteration: session.history.length + 1, timestamp: new Date() });
        session.history.push(dataPoint);
        return dataPoint;
    };
    /**
     * Analyze convergence for a session
     */
    ConvergenceMonitor.prototype.analyze = function (sessionId, options) {
        var session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error("Session not found: ".concat(sessionId));
        }
        var opts = __assign(__assign(__assign({}, this.defaultOptions), options), { goal: session.goal });
        var history = session.history, goal = session.goal;
        // Insufficient data
        if (history.length < (opts.minIterationsForAssessment || 2)) {
            return this.createInsufficientDataAnalysis(history, goal);
        }
        // Calculate trends
        var trends = this.calculateTrends(history, opts);
        // Determine convergence state
        var state = this.determineState(history, trends, opts);
        var stateConfidence = this.calculateStateConfidence(history, state, opts);
        // Check goal criteria
        var criteriaStatus = this.checkCriteria(history, goal);
        var goalMet = this.isGoalMet(criteriaStatus);
        var goalProgress = this.calculateGoalProgress(history, goal);
        // Generate recommendations
        var recommendations = this.generateRecommendations(state, criteriaStatus, history, opts);
        // Generate warnings
        var warnings = this.generateWarnings(history, state, opts);
        // Estimate remaining iterations
        var estimatedIterationsRemaining = this.estimateRemainingIterations(history, trends, goal, goalMet);
        // Update session state
        session.currentState = state;
        return {
            state: state,
            stateConfidence: stateConfidence,
            goalProgress: goalProgress,
            estimatedIterationsRemaining: estimatedIterationsRemaining,
            trends: trends,
            goalMet: goalMet,
            criteriaStatus: criteriaStatus,
            recommendations: recommendations,
            warnings: warnings,
        };
    };
    /**
     * Quick check if goal is met
     */
    ConvergenceMonitor.prototype.isConverged = function (sessionId) {
        var session = this.sessions.get(sessionId);
        if (!session || session.history.length === 0) {
            return false;
        }
        var latest = session.history[session.history.length - 1];
        var goal = session.goal;
        return (latest.qualityScore >= goal.minQualityScore &&
            latest.confidenceScore >= goal.minConfidenceScore &&
            latest.validationIssues <= goal.maxValidationIssues &&
            latest.hallucinationCount <= goal.maxHallucinations);
    };
    /**
     * Get current state for a session
     */
    ConvergenceMonitor.prototype.getState = function (sessionId) {
        var session = this.sessions.get(sessionId);
        return (session === null || session === void 0 ? void 0 : session.currentState) || 'unknown';
    };
    /**
     * Get session by ID
     */
    ConvergenceMonitor.prototype.getSession = function (sessionId) {
        return this.sessions.get(sessionId);
    };
    /**
     * End a session
     */
    ConvergenceMonitor.prototype.endSession = function (sessionId) {
        var session = this.sessions.get(sessionId);
        if (session) {
            session.isActive = false;
        }
        return session;
    };
    /**
     * Get all active sessions
     */
    ConvergenceMonitor.prototype.getActiveSessions = function () {
        return Array.from(this.sessions.values()).filter(function (s) { return s.isActive; });
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    ConvergenceMonitor.prototype.generateSessionId = function () {
        return "conv_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    ConvergenceMonitor.prototype.createInsufficientDataAnalysis = function (history, goal) {
        var criteriaStatus = this.checkCriteria(history, goal);
        return {
            state: 'unknown',
            stateConfidence: 0,
            goalProgress: history.length > 0 ? this.calculateGoalProgress(history, goal) : 0,
            estimatedIterationsRemaining: null,
            trends: [],
            goalMet: false,
            criteriaStatus: criteriaStatus,
            recommendations: [
                {
                    type: 'continue',
                    priority: 'medium',
                    message: 'Continue iterating to gather more data',
                    reasoning: 'Insufficient data points for convergence assessment',
                },
            ],
            warnings: ['Insufficient data for reliable convergence assessment'],
        };
    };
    ConvergenceMonitor.prototype.calculateTrends = function (history, options) {
        var _a;
        var metrics = ['qualityScore', 'confidenceScore', 'validationIssues', 'hallucinationCount'];
        var trends = [];
        var _loop_1 = function (metric) {
            var values = history.map(function (h) { return h[metric]; });
            trends.push(this_1.calculateMetricTrend(metric, values, options));
        };
        var this_1 = this;
        for (var _i = 0, metrics_1 = metrics; _i < metrics_1.length; _i++) {
            var metric = metrics_1[_i];
            _loop_1(metric);
        }
        // Custom metrics
        if (options.trackCustomMetrics && ((_a = history[0]) === null || _a === void 0 ? void 0 : _a.customMetrics)) {
            var customKeys = Object.keys(history[0].customMetrics);
            var _loop_2 = function (key) {
                var values = history.map(function (h) { var _a, _b; return (_b = (_a = h.customMetrics) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : 0; });
                trends.push(this_2.calculateMetricTrend(key, values, options));
            };
            var this_2 = this;
            for (var _b = 0, customKeys_1 = customKeys; _b < customKeys_1.length; _b++) {
                var key = customKeys_1[_b];
                _loop_2(key);
            }
        }
        return trends;
    };
    ConvergenceMonitor.prototype.calculateMetricTrend = function (metric, values, options) {
        var current = values[values.length - 1];
        var previous = values.length > 1 ? values[values.length - 2] : current;
        var delta = current - previous;
        var percentChange = previous !== 0 ? (delta / previous) * 100 : 0;
        // Moving average
        var windowSize = Math.min(options.movingAverageWindow || 3, values.length);
        var windowValues = values.slice(-windowSize);
        var movingAverage = windowValues.reduce(function (a, b) { return a + b; }, 0) / windowSize;
        // Standard deviation
        var mean = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
        var variance = values.reduce(function (sum, val) { return sum + Math.pow(val - mean, 2); }, 0) / values.length;
        var standardDeviation = Math.sqrt(variance);
        // Determine direction
        var threshold = options.stabilityThreshold || 0.05;
        var isImproving = this.isMetricImproving(metric, delta);
        var direction;
        if (Math.abs(delta) < threshold * Math.abs(previous || 1)) {
            direction = 'stable';
        }
        else if (isImproving) {
            direction = 'improving';
        }
        else {
            direction = 'degrading';
        }
        return {
            metric: metric,
            current: current,
            previous: previous,
            delta: delta,
            percentChange: percentChange,
            direction: direction,
            movingAverage: movingAverage,
            standardDeviation: standardDeviation,
        };
    };
    ConvergenceMonitor.prototype.isMetricImproving = function (metric, delta) {
        // For issues and hallucinations, decreasing is improving
        if (metric === 'validationIssues' || metric === 'hallucinationCount') {
            return delta < 0;
        }
        // For scores, increasing is improving
        return delta > 0;
    };
    ConvergenceMonitor.prototype.determineState = function (history, trends, options) {
        // Check if converged (goal met)
        var latest = history[history.length - 1];
        var goal = options.goal;
        if (latest.qualityScore >= goal.minQualityScore &&
            latest.confidenceScore >= goal.minConfidenceScore &&
            latest.validationIssues <= goal.maxValidationIssues &&
            latest.hallucinationCount <= goal.maxHallucinations) {
            return 'converged';
        }
        // Analyze trends to determine state
        var qualityTrend = trends.find(function (t) { return t.metric === 'qualityScore'; });
        var confidenceTrend = trends.find(function (t) { return t.metric === 'confidenceScore'; });
        if (!qualityTrend || !confidenceTrend) {
            return 'unknown';
        }
        // Check for oscillation (alternating directions)
        if (this.isOscillating(history)) {
            return 'oscillating';
        }
        // Check improvement counts
        var improvingCount = trends.filter(function (t) { return t.direction === 'improving'; }).length;
        var degradingCount = trends.filter(function (t) { return t.direction === 'degrading'; }).length;
        var stableCount = trends.filter(function (t) { return t.direction === 'stable'; }).length;
        // Strong degradation
        if (degradingCount >= 2 && qualityTrend.direction === 'degrading') {
            return 'diverging';
        }
        // Plateau detection
        if (stableCount >= 3 || (history.length >= 3 && this.isPlateaued(history, options))) {
            return 'plateaued';
        }
        // Improvement
        if (improvingCount >= 2 || qualityTrend.direction === 'improving') {
            return 'converging';
        }
        return 'unknown';
    };
    ConvergenceMonitor.prototype.isOscillating = function (history) {
        if (history.length < 4)
            return false;
        // Check last 4 quality scores for alternating pattern
        var scores = history.slice(-4).map(function (h) { return h.qualityScore; });
        var alternations = 0;
        for (var i = 1; i < scores.length; i++) {
            var prevDir = i > 1 ? Math.sign(scores[i - 1] - scores[i - 2]) : 0;
            var currDir = Math.sign(scores[i] - scores[i - 1]);
            if (prevDir !== 0 && currDir !== 0 && prevDir !== currDir) {
                alternations++;
            }
        }
        return alternations >= 2;
    };
    ConvergenceMonitor.prototype.isPlateaued = function (history, options) {
        if (history.length < 3)
            return false;
        var threshold = options.stabilityThreshold || 0.05;
        var recent = history.slice(-3);
        // Check if quality scores are stable
        var scores = recent.map(function (h) { return h.qualityScore; });
        var maxScore = Math.max.apply(Math, scores);
        var minScore = Math.min.apply(Math, scores);
        return maxScore - minScore < threshold;
    };
    ConvergenceMonitor.prototype.calculateStateConfidence = function (history, state, options) {
        // More data = more confidence
        var dataFactor = Math.min(history.length / 5, 1);
        // Consistent trends = more confidence
        var consistencyFactor = this.calculateConsistencyFactor(history);
        // State-specific confidence adjustments
        var stateFactor = 0.8;
        if (state === 'converged')
            stateFactor = 1.0;
        if (state === 'unknown')
            stateFactor = 0.3;
        if (state === 'oscillating')
            stateFactor = 0.9;
        return Math.min(1, dataFactor * 0.4 + consistencyFactor * 0.3 + stateFactor * 0.3);
    };
    ConvergenceMonitor.prototype.calculateConsistencyFactor = function (history) {
        if (history.length < 3)
            return 0.5;
        // Calculate how consistent the quality score changes are
        var changes = [];
        for (var i = 1; i < history.length; i++) {
            changes.push(history[i].qualityScore - history[i - 1].qualityScore);
        }
        // Count consistent directions
        var consistentCount = 0;
        for (var i = 1; i < changes.length; i++) {
            if (Math.sign(changes[i]) === Math.sign(changes[i - 1])) {
                consistentCount++;
            }
        }
        return changes.length > 0 ? (consistentCount + 1) / changes.length : 0.5;
    };
    ConvergenceMonitor.prototype.checkCriteria = function (history, goal) {
        var _a;
        if (history.length === 0) {
            return {
                qualityScore: false,
                confidenceScore: false,
                validationIssues: false,
                hallucinations: false,
                custom: {},
            };
        }
        var latest = history[history.length - 1];
        var custom = {};
        if (goal.customThresholds && latest.customMetrics) {
            for (var _i = 0, _b = Object.entries(goal.customThresholds); _i < _b.length; _i++) {
                var _c = _b[_i], key = _c[0], threshold = _c[1];
                var value = (_a = latest.customMetrics[key]) !== null && _a !== void 0 ? _a : 0;
                var meetsMin = threshold.min === undefined || value >= threshold.min;
                var meetsMax = threshold.max === undefined || value <= threshold.max;
                custom[key] = meetsMin && meetsMax;
            }
        }
        return {
            qualityScore: latest.qualityScore >= goal.minQualityScore,
            confidenceScore: latest.confidenceScore >= goal.minConfidenceScore,
            validationIssues: latest.validationIssues <= goal.maxValidationIssues,
            hallucinations: latest.hallucinationCount <= goal.maxHallucinations,
            custom: custom,
        };
    };
    ConvergenceMonitor.prototype.isGoalMet = function (criteriaStatus) {
        return (criteriaStatus.qualityScore &&
            criteriaStatus.confidenceScore &&
            criteriaStatus.validationIssues &&
            criteriaStatus.hallucinations &&
            Object.values(criteriaStatus.custom).every(function (v) { return v; }));
    };
    ConvergenceMonitor.prototype.calculateGoalProgress = function (history, goal) {
        if (history.length === 0)
            return 0;
        var latest = history[history.length - 1];
        // Calculate progress for each criterion (capped at 1)
        var qualityProgress = Math.min(latest.qualityScore / goal.minQualityScore, 1);
        var confidenceProgress = Math.min(latest.confidenceScore / goal.minConfidenceScore, 1);
        // For issues, progress is inverse (0 issues = full progress)
        var issueProgress = goal.maxValidationIssues === 0
            ? latest.validationIssues === 0
                ? 1
                : 0
            : Math.min(1, 1 - latest.validationIssues / (goal.maxValidationIssues + 1));
        var hallucinationProgress = goal.maxHallucinations === 0
            ? latest.hallucinationCount === 0
                ? 1
                : 0
            : Math.min(1, 1 - latest.hallucinationCount / (goal.maxHallucinations + 1));
        // Weighted average
        return (qualityProgress * 0.35 +
            confidenceProgress * 0.25 +
            issueProgress * 0.2 +
            hallucinationProgress * 0.2);
    };
    ConvergenceMonitor.prototype.generateRecommendations = function (state, criteriaStatus, history, options) {
        var _a, _b;
        var recommendations = [];
        switch (state) {
            case 'converged':
                recommendations.push({
                    type: 'stop',
                    priority: 'high',
                    message: 'Goal achieved - stop iteration',
                    reasoning: 'All convergence criteria have been met',
                });
                break;
            case 'converging':
                recommendations.push({
                    type: 'continue',
                    priority: 'medium',
                    message: 'Continue iteration - making progress',
                    reasoning: 'Metrics are improving toward goal',
                });
                break;
            case 'plateaued':
                recommendations.push({
                    type: 'adjust',
                    priority: 'high',
                    message: 'Adjust approach - progress has stalled',
                    action: 'Try different prompts, increase specificity, or change strategy',
                    reasoning: 'Metrics have stabilized without meeting goal',
                });
                break;
            case 'diverging':
                recommendations.push({
                    type: 'reset',
                    priority: 'high',
                    message: 'Consider resetting - moving away from goal',
                    action: 'Review feedback and start fresh with adjusted approach',
                    reasoning: 'Quality metrics are degrading',
                });
                break;
            case 'oscillating':
                recommendations.push({
                    type: 'adjust',
                    priority: 'high',
                    message: 'Stabilize iteration - results are inconsistent',
                    action: 'Reduce variation in prompts and add more constraints',
                    reasoning: 'Metrics are alternating without convergence',
                });
                break;
            default:
                recommendations.push({
                    type: 'continue',
                    priority: 'low',
                    message: 'Continue iteration - gathering data',
                    reasoning: 'More iterations needed for assessment',
                });
        }
        // Add specific recommendations for unmet criteria
        if (!criteriaStatus.qualityScore) {
            recommendations.push({
                type: 'adjust',
                priority: 'medium',
                message: 'Focus on improving output quality',
                action: 'Add more specific requirements and examples',
                reasoning: 'Quality score below threshold',
            });
        }
        if (!criteriaStatus.validationIssues && ((_a = history[history.length - 1]) === null || _a === void 0 ? void 0 : _a.validationIssues) > 0) {
            recommendations.push({
                type: 'adjust',
                priority: 'high',
                message: 'Address validation issues',
                action: 'Review validation errors and add explicit format requirements',
                reasoning: 'Output has validation errors',
            });
        }
        if (!criteriaStatus.hallucinations && ((_b = history[history.length - 1]) === null || _b === void 0 ? void 0 : _b.hallucinationCount) > 0) {
            recommendations.push({
                type: 'escalate',
                priority: 'high',
                message: 'Hallucinations detected - requires attention',
                action: 'Add grounding, request citations, or verify claims',
                reasoning: 'Output contains fabricated content',
            });
        }
        // Check for max iterations
        if (options.maxIterations && history.length >= options.maxIterations) {
            recommendations.unshift({
                type: 'stop',
                priority: 'high',
                message: 'Maximum iterations reached',
                reasoning: "Iteration limit of ".concat(options.maxIterations, " reached"),
            });
        }
        return recommendations;
    };
    ConvergenceMonitor.prototype.generateWarnings = function (history, state, options) {
        var warnings = [];
        // Approaching max iterations
        if (options.maxIterations && history.length >= options.maxIterations * 0.8) {
            warnings.push("Approaching iteration limit (".concat(history.length, "/").concat(options.maxIterations, ")"));
        }
        // Long iteration time
        if (history.length > 5 && state !== 'converging' && state !== 'converged') {
            warnings.push('Many iterations without significant progress');
        }
        // Quality degradation
        if (history.length >= 2) {
            var current = history[history.length - 1].qualityScore;
            var previous = history[history.length - 2].qualityScore;
            if (current < previous * 0.9) {
                warnings.push('Quality score decreased significantly');
            }
        }
        // Hallucination increase
        if (history.length >= 2) {
            var current = history[history.length - 1].hallucinationCount;
            var previous = history[history.length - 2].hallucinationCount;
            if (current > previous) {
                warnings.push('Hallucination count increased');
            }
        }
        return warnings;
    };
    ConvergenceMonitor.prototype.estimateRemainingIterations = function (history, trends, goal, goalMet) {
        if (goalMet)
            return 0;
        if (history.length < 3)
            return null;
        var qualityTrend = trends.find(function (t) { return t.metric === 'qualityScore'; });
        if (!qualityTrend || qualityTrend.direction !== 'improving') {
            return null;
        }
        // Estimate based on average improvement rate
        var latest = history[history.length - 1];
        var remaining = goal.minQualityScore - latest.qualityScore;
        if (remaining <= 0)
            return 1;
        // Calculate average improvement per iteration
        var improvementRate = qualityTrend.movingAverage - latest.qualityScore + qualityTrend.delta;
        if (improvementRate <= 0)
            return null;
        var estimated = Math.ceil(remaining / Math.abs(improvementRate));
        return Math.max(1, Math.min(estimated, 20)); // Cap at reasonable bounds
    };
    return ConvergenceMonitor;
}());
exports.ConvergenceMonitor = ConvergenceMonitor;
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Global convergence monitor instance
 */
exports.convergenceMonitor = new ConvergenceMonitor();
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Start a new convergence tracking session
 */
function startConvergenceSession(name, goal) {
    return exports.convergenceMonitor.startSession(name, goal);
}
/**
 * Record an iteration data point
 */
function recordIteration(sessionId, data) {
    return exports.convergenceMonitor.recordIteration(sessionId, data);
}
/**
 * Analyze convergence for a session
 */
function analyzeConvergence(sessionId, options) {
    return exports.convergenceMonitor.analyze(sessionId, options);
}
/**
 * Quick check if a session has converged
 */
function hasConverged(sessionId) {
    return exports.convergenceMonitor.isConverged(sessionId);
}
/**
 * Get current convergence state
 */
function getConvergenceState(sessionId) {
    return exports.convergenceMonitor.getState(sessionId);
}
/**
 * End a convergence session
 */
function endConvergenceSession(sessionId) {
    return exports.convergenceMonitor.endSession(sessionId);
}

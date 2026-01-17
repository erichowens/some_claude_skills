"use strict";
/**
 * Performance Profiler
 *
 * Measures latency, token usage, cost, and other performance metrics
 * for DAG execution to identify bottlenecks and optimize workflows.
 *
 * @module dag/observability/performance-profiler
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
exports.performanceProfiler = exports.PerformanceProfiler = void 0;
exports.startProfiling = startProfiling;
exports.recordOperation = recordOperation;
exports.endProfiling = endProfiling;
exports.calculateTokenCost = calculateTokenCost;
exports.getMetricStatistics = getMetricStatistics;
exports.compareProfiles = compareProfiles;
// ============================================================================
// Default Values
// ============================================================================
var DEFAULT_MODEL_PRICING = [
    { modelId: 'claude-3-opus', inputPer1K: 0.015, outputPer1K: 0.075, currency: 'USD' },
    { modelId: 'claude-3-sonnet', inputPer1K: 0.003, outputPer1K: 0.015, currency: 'USD' },
    { modelId: 'claude-3-haiku', inputPer1K: 0.00025, outputPer1K: 0.00125, currency: 'USD' },
    { modelId: 'opus', inputPer1K: 0.015, outputPer1K: 0.075, currency: 'USD' },
    { modelId: 'sonnet', inputPer1K: 0.003, outputPer1K: 0.015, currency: 'USD' },
    { modelId: 'haiku', inputPer1K: 0.00025, outputPer1K: 0.00125, currency: 'USD' },
];
var DEFAULT_OPTIONS = {
    trackTokens: true,
    trackCosts: true,
    trackMemory: false,
    generateRecommendations: true,
    modelPricing: DEFAULT_MODEL_PRICING,
    latencyThresholdMs: 5000,
    costThreshold: 1.0,
};
// ============================================================================
// Performance Profiler Class
// ============================================================================
/**
 * Profiles DAG execution performance
 */
var PerformanceProfiler = /** @class */ (function () {
    function PerformanceProfiler(options) {
        if (options === void 0) { options = {}; }
        this.profiles = new Map();
        this.metrics = [];
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), options);
    }
    /**
     * Start profiling a DAG execution
     */
    PerformanceProfiler.prototype.startProfile = function (dagId, dagName) {
        var profile = {
            profileId: this.generateId('profile'),
            dagId: dagId,
            dagName: dagName,
            startTime: new Date(),
            totalTokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            totalCost: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD', model: '' },
            nodesExecuted: 0,
            nodesFailed: 0,
            totalRetries: 0,
            operations: [],
            bottlenecks: [],
            recommendations: [],
        };
        this.profiles.set(profile.profileId, profile);
        return profile;
    };
    /**
     * Record an operation profile
     */
    PerformanceProfiler.prototype.recordOperation = function (profileId, operation) {
        var profile = this.profiles.get(profileId);
        if (!profile)
            return;
        var fullOperation = __assign(__assign({}, operation), { customMetrics: operation.customMetrics || {} });
        profile.operations.push(fullOperation);
        profile.nodesExecuted++;
        if (operation.tokens) {
            profile.totalTokens.inputTokens += operation.tokens.inputTokens;
            profile.totalTokens.outputTokens += operation.tokens.outputTokens;
            profile.totalTokens.totalTokens += operation.tokens.totalTokens;
        }
        if (operation.cost) {
            profile.totalCost.inputCost += operation.cost.inputCost;
            profile.totalCost.outputCost += operation.cost.outputCost;
            profile.totalCost.totalCost += operation.cost.totalCost;
        }
        profile.totalRetries += operation.retryCount;
        // Record as metric data points
        this.recordMetric({
            timestamp: new Date(),
            name: 'operation.latency',
            value: operation.latency.totalMs,
            unit: 'ms',
            category: 'latency',
            nodeId: operation.nodeId,
            tags: { operation: operation.operationName },
        });
        if (operation.tokens) {
            this.recordMetric({
                timestamp: new Date(),
                name: 'operation.tokens',
                value: operation.tokens.totalTokens,
                unit: 'tokens',
                category: 'tokens',
                nodeId: operation.nodeId,
                tags: { operation: operation.operationName },
            });
        }
        if (operation.cost) {
            this.recordMetric({
                timestamp: new Date(),
                name: 'operation.cost',
                value: operation.cost.totalCost,
                unit: operation.cost.currency,
                category: 'cost',
                nodeId: operation.nodeId,
                tags: { operation: operation.operationName, model: operation.cost.model },
            });
        }
    };
    /**
     * Record a failed operation
     */
    PerformanceProfiler.prototype.recordFailure = function (profileId, operationName, nodeId) {
        var profile = this.profiles.get(profileId);
        if (!profile)
            return;
        profile.nodesFailed++;
        this.recordMetric({
            timestamp: new Date(),
            name: 'operation.failure',
            value: 1,
            unit: 'count',
            category: 'custom',
            nodeId: nodeId,
            tags: { operation: operationName },
        });
    };
    /**
     * End profiling and generate analysis
     */
    PerformanceProfiler.prototype.endProfile = function (profileId) {
        var profile = this.profiles.get(profileId);
        if (!profile)
            return undefined;
        profile.endTime = new Date();
        profile.totalDurationMs =
            profile.endTime.getTime() - profile.startTime.getTime();
        // Calculate parallelization efficiency
        profile.parallelizationEfficiency = this.calculateParallelizationEfficiency(profile);
        // Analyze bottlenecks
        profile.bottlenecks = this.analyzeBottlenecks(profile);
        // Generate recommendations
        if (this.options.generateRecommendations) {
            profile.recommendations = this.generateRecommendations(profile);
        }
        return profile;
    };
    /**
     * Record a custom metric
     */
    PerformanceProfiler.prototype.recordMetric = function (metric) {
        this.metrics.push(metric);
    };
    /**
     * Calculate cost for token usage
     */
    PerformanceProfiler.prototype.calculateCost = function (tokens, model) {
        var _a;
        var pricing = (_a = this.options.modelPricing) === null || _a === void 0 ? void 0 : _a.find(function (p) {
            return model.toLowerCase().includes(p.modelId.toLowerCase());
        });
        if (!pricing) {
            return {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0,
                currency: 'USD',
                model: model,
            };
        }
        var inputCost = (tokens.inputTokens / 1000) * pricing.inputPer1K;
        var outputCost = (tokens.outputTokens / 1000) * pricing.outputPer1K;
        return {
            inputCost: inputCost,
            outputCost: outputCost,
            totalCost: inputCost + outputCost,
            currency: pricing.currency,
            model: model,
        };
    };
    /**
     * Get statistics for a metric
     */
    PerformanceProfiler.prototype.getMetricStats = function (metricName, filters) {
        var dataPoints = this.metrics.filter(function (m) { return m.name === metricName; });
        if (filters === null || filters === void 0 ? void 0 : filters.nodeId) {
            dataPoints = dataPoints.filter(function (m) { return m.nodeId === filters.nodeId; });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.tags) {
            dataPoints = dataPoints.filter(function (m) {
                return Object.entries(filters.tags).every(function (_a) {
                    var k = _a[0], v = _a[1];
                    return m.tags[k] === v;
                });
            });
        }
        if (dataPoints.length === 0)
            return undefined;
        var values = dataPoints.map(function (m) { return m.value; }).sort(function (a, b) { return a - b; });
        var sum = values.reduce(function (a, b) { return a + b; }, 0);
        var mean = sum / values.length;
        // Standard deviation
        var variance = values.reduce(function (acc, val) { return acc + Math.pow(val - mean, 2); }, 0) /
            values.length;
        var stdDev = Math.sqrt(variance);
        // Percentiles
        var percentile = function (p) {
            var index = Math.ceil((p / 100) * values.length) - 1;
            return values[Math.max(0, index)];
        };
        return {
            name: metricName,
            count: values.length,
            sum: sum,
            mean: mean,
            min: values[0],
            max: values[values.length - 1],
            stdDev: stdDev,
            percentiles: {
                p50: percentile(50),
                p90: percentile(90),
                p95: percentile(95),
                p99: percentile(99),
            },
            timeSeries: dataPoints.map(function (m) { return ({ timestamp: m.timestamp, value: m.value }); }),
        };
    };
    /**
     * Get profile by ID
     */
    PerformanceProfiler.prototype.getProfile = function (profileId) {
        return this.profiles.get(profileId);
    };
    /**
     * Get all profiles
     */
    PerformanceProfiler.prototype.getAllProfiles = function () {
        return Array.from(this.profiles.values());
    };
    /**
     * Compare two profiles
     */
    PerformanceProfiler.prototype.compareProfiles = function (profileId1, profileId2) {
        var p1 = this.profiles.get(profileId1);
        var p2 = this.profiles.get(profileId2);
        if (!p1 || !p2)
            return undefined;
        return {
            profile1: profileId1,
            profile2: profileId2,
            latencyDiff: {
                absolute: (p1.totalDurationMs || 0) - (p2.totalDurationMs || 0),
                percentage: this.percentDiff(p1.totalDurationMs || 0, p2.totalDurationMs || 0),
            },
            tokensDiff: {
                absolute: p1.totalTokens.totalTokens - p2.totalTokens.totalTokens,
                percentage: this.percentDiff(p1.totalTokens.totalTokens, p2.totalTokens.totalTokens),
            },
            costDiff: {
                absolute: p1.totalCost.totalCost - p2.totalCost.totalCost,
                percentage: this.percentDiff(p1.totalCost.totalCost, p2.totalCost.totalCost),
            },
            summary: this.generateComparisonSummary(p1, p2),
        };
    };
    /**
     * Export metrics to various formats
     */
    PerformanceProfiler.prototype.exportMetrics = function (format) {
        if (format === void 0) { format = 'json'; }
        if (format === 'json') {
            return JSON.stringify(this.metrics, null, 2);
        }
        if (format === 'csv') {
            var headers = ['timestamp', 'name', 'value', 'unit', 'category', 'nodeId', 'tags'];
            var rows = this.metrics.map(function (m) { return [
                m.timestamp.toISOString(),
                m.name,
                m.value,
                m.unit,
                m.category,
                m.nodeId || '',
                JSON.stringify(m.tags),
            ]; });
            return __spreadArray([headers.join(',')], rows.map(function (r) { return r.join(','); }), true).join('\n');
        }
        // Prometheus format
        var lines = [];
        var grouped = this.groupMetricsByName();
        for (var _i = 0, grouped_1 = grouped; _i < grouped_1.length; _i++) {
            var _a = grouped_1[_i], name_1 = _a[0], dataPoints = _a[1];
            var sanitizedName = name_1.replace(/\./g, '_');
            lines.push("# HELP ".concat(sanitizedName, " ").concat(name_1));
            lines.push("# TYPE ".concat(sanitizedName, " gauge"));
            for (var _b = 0, dataPoints_1 = dataPoints; _b < dataPoints_1.length; _b++) {
                var dp = dataPoints_1[_b];
                var labels = Object.entries(dp.tags)
                    .map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return "".concat(k, "=\"").concat(v, "\"");
                })
                    .join(',');
                var labelStr = labels ? "{".concat(labels, "}") : '';
                lines.push("".concat(sanitizedName).concat(labelStr, " ").concat(dp.value));
            }
        }
        return lines.join('\n');
    };
    /**
     * Clear old metrics
     */
    PerformanceProfiler.prototype.clearOldMetrics = function (maxAgeMs) {
        var cutoff = new Date(Date.now() - maxAgeMs);
        var initialCount = this.metrics.length;
        this.metrics = this.metrics.filter(function (m) { return m.timestamp >= cutoff; });
        return initialCount - this.metrics.length;
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    PerformanceProfiler.prototype.generateId = function (prefix) {
        return "".concat(prefix, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    PerformanceProfiler.prototype.calculateParallelizationEfficiency = function (profile) {
        if (profile.operations.length === 0)
            return 1;
        // Sum of all operation latencies
        var totalOperationTime = profile.operations.reduce(function (sum, op) { return sum + op.latency.totalMs; }, 0);
        // If perfect parallelization, total time would be the longest single operation
        var longestOperation = Math.max.apply(Math, profile.operations.map(function (op) { return op.latency.totalMs; }));
        // Actual time vs sum of all operations
        if (!profile.totalDurationMs)
            return 1;
        // Efficiency = theoretical_best / actual
        // If all operations ran sequentially, efficiency would be totalDurationMs / totalOperationTime
        // If perfectly parallel, totalDurationMs would equal longestOperation
        // Normalize: 1 = perfect parallelization, 0 = fully sequential
        var maxPossibleSaving = totalOperationTime - longestOperation;
        var actualSaving = totalOperationTime - profile.totalDurationMs;
        if (maxPossibleSaving === 0)
            return 1;
        return Math.max(0, Math.min(1, actualSaving / maxPossibleSaving));
    };
    PerformanceProfiler.prototype.analyzeBottlenecks = function (profile) {
        var bottlenecks = [];
        var threshold = this.options.latencyThresholdMs || 5000;
        // Latency bottlenecks
        var slowOperations = profile.operations.filter(function (op) { return op.latency.totalMs > threshold; });
        if (slowOperations.length > 0) {
            bottlenecks.push({
                type: 'latency',
                severity: Math.min(1, slowOperations.length / profile.operations.length),
                description: "".concat(slowOperations.length, " operation(s) exceeded ").concat(threshold, "ms latency threshold"),
                affectedOperations: slowOperations.map(function (op) { return op.operationName; }),
                potentialSavingsMs: slowOperations.reduce(function (sum, op) { return sum + (op.latency.totalMs - threshold); }, 0),
            });
        }
        // Sequential bottleneck (low parallelization)
        if (profile.parallelizationEfficiency !== undefined &&
            profile.parallelizationEfficiency < 0.5) {
            bottlenecks.push({
                type: 'sequential',
                severity: 1 - profile.parallelizationEfficiency,
                description: "Low parallelization efficiency (".concat((profile.parallelizationEfficiency * 100).toFixed(1), "%)"),
                affectedOperations: profile.operations.map(function (op) { return op.operationName; }),
                potentialSavingsMs: this.estimateParallelSavings(profile),
            });
        }
        // Retry bottleneck
        if (profile.totalRetries > profile.nodesExecuted * 0.1) {
            var retryOperations = profile.operations
                .filter(function (op) { return op.retryCount > 0; })
                .map(function (op) { return op.operationName; });
            bottlenecks.push({
                type: 'retry',
                severity: Math.min(1, profile.totalRetries / profile.nodesExecuted),
                description: "High retry rate: ".concat(profile.totalRetries, " retries across ").concat(retryOperations.length, " operations"),
                affectedOperations: retryOperations,
            });
        }
        // Cost bottleneck
        if (this.options.costThreshold &&
            profile.totalCost.totalCost > this.options.costThreshold) {
            var expensiveOps = profile.operations
                .filter(function (op) { return op.cost && op.cost.totalCost > 0.1; })
                .sort(function (a, b) { var _a, _b; return (((_a = b.cost) === null || _a === void 0 ? void 0 : _a.totalCost) || 0) - (((_b = a.cost) === null || _b === void 0 ? void 0 : _b.totalCost) || 0); })
                .slice(0, 5);
            bottlenecks.push({
                type: 'cost',
                severity: Math.min(1, profile.totalCost.totalCost / this.options.costThreshold),
                description: "Total cost ($".concat(profile.totalCost.totalCost.toFixed(4), ") exceeds threshold"),
                affectedOperations: expensiveOps.map(function (op) { return op.operationName; }),
                potentialSavingsCost: this.estimateCostSavings(profile, expensiveOps),
            });
        }
        // Token bottleneck
        var avgTokensPerOp = profile.totalTokens.totalTokens / profile.nodesExecuted;
        if (avgTokensPerOp > 10000) {
            var tokenHeavyOps = profile.operations
                .filter(function (op) { return op.tokens && op.tokens.totalTokens > 10000; })
                .map(function (op) { return op.operationName; });
            bottlenecks.push({
                type: 'tokens',
                severity: Math.min(1, avgTokensPerOp / 50000),
                description: "High average token usage: ".concat(avgTokensPerOp.toFixed(0), " tokens/operation"),
                affectedOperations: tokenHeavyOps,
            });
        }
        return bottlenecks.sort(function (a, b) { return b.severity - a.severity; });
    };
    PerformanceProfiler.prototype.generateRecommendations = function (profile) {
        var _a;
        var recommendations = [];
        // Based on bottlenecks
        for (var _i = 0, _b = profile.bottlenecks; _i < _b.length; _i++) {
            var bottleneck = _b[_i];
            switch (bottleneck.type) {
                case 'latency':
                    recommendations.push({
                        category: 'latency',
                        priority: bottleneck.severity > 0.7 ? 'high' : 'medium',
                        title: 'Reduce operation latency',
                        description: "".concat(bottleneck.affectedOperations.length, " operations are slow"),
                        estimatedImpact: "Potential savings: ".concat(bottleneck.potentialSavingsMs, "ms"),
                        action: 'Consider using faster models (haiku) for simpler tasks or implementing caching',
                    });
                    break;
                case 'sequential':
                    recommendations.push({
                        category: 'parallelization',
                        priority: 'high',
                        title: 'Improve parallelization',
                        description: 'DAG execution is mostly sequential',
                        estimatedImpact: "Could save up to ".concat(bottleneck.potentialSavingsMs, "ms"),
                        action: 'Review node dependencies and identify operations that can run in parallel',
                    });
                    break;
                case 'cost':
                    recommendations.push({
                        category: 'cost',
                        priority: bottleneck.severity > 0.7 ? 'high' : 'medium',
                        title: 'Reduce execution cost',
                        description: "Total cost exceeds threshold",
                        estimatedImpact: "Potential savings: $".concat((_a = bottleneck.potentialSavingsCost) === null || _a === void 0 ? void 0 : _a.toFixed(4)),
                        action: 'Use smaller models where possible, reduce context size, or implement caching',
                    });
                    break;
                case 'tokens':
                    recommendations.push({
                        category: 'tokens',
                        priority: 'medium',
                        title: 'Optimize token usage',
                        description: 'High token consumption detected',
                        estimatedImpact: 'Reduced costs and latency',
                        action: 'Summarize context, use selective tool outputs, or implement context windowing',
                    });
                    break;
                case 'retry':
                    recommendations.push({
                        category: 'latency',
                        priority: 'high',
                        title: 'Reduce retry rate',
                        description: 'High number of operation retries',
                        estimatedImpact: 'Improved reliability and reduced latency',
                        action: 'Investigate failure causes and add validation before expensive operations',
                    });
                    break;
            }
        }
        // Cache recommendations
        var cacheHits = profile.operations.filter(function (op) { return op.cacheHit; }).length;
        var cacheRate = cacheHits / profile.operations.length;
        if (cacheRate < 0.1 && profile.operations.length > 5) {
            recommendations.push({
                category: 'caching',
                priority: 'medium',
                title: 'Implement result caching',
                description: "Only ".concat((cacheRate * 100).toFixed(1), "% cache hit rate"),
                estimatedImpact: 'Could significantly reduce latency and cost',
                action: 'Cache deterministic operations and use content-based cache keys',
            });
        }
        return recommendations.sort(function (a, b) {
            var priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    };
    PerformanceProfiler.prototype.estimateParallelSavings = function (profile) {
        if (!profile.totalDurationMs)
            return 0;
        var longestOp = Math.max.apply(Math, profile.operations.map(function (op) { return op.latency.totalMs; }));
        // Theoretical best case if fully parallelized
        return profile.totalDurationMs - longestOp;
    };
    PerformanceProfiler.prototype.estimateCostSavings = function (profile, expensiveOps) {
        // Estimate savings if expensive ops used cheaper models
        var savings = 0;
        for (var _i = 0, expensiveOps_1 = expensiveOps; _i < expensiveOps_1.length; _i++) {
            var op = expensiveOps_1[_i];
            if (op.cost && op.tokens) {
                // Estimate cost if using haiku instead
                var haikuCost = this.calculateCost(op.tokens, 'haiku');
                savings += op.cost.totalCost - haikuCost.totalCost;
            }
        }
        return Math.max(0, savings);
    };
    PerformanceProfiler.prototype.percentDiff = function (a, b) {
        if (b === 0)
            return a === 0 ? 0 : 100;
        return ((a - b) / b) * 100;
    };
    PerformanceProfiler.prototype.generateComparisonSummary = function (p1, p2) {
        var parts = [];
        var latencyDiff = (p1.totalDurationMs || 0) - (p2.totalDurationMs || 0);
        if (latencyDiff > 0) {
            parts.push("Profile 1 is ".concat(latencyDiff, "ms slower"));
        }
        else if (latencyDiff < 0) {
            parts.push("Profile 1 is ".concat(Math.abs(latencyDiff), "ms faster"));
        }
        else {
            parts.push('Same latency');
        }
        var costDiff = p1.totalCost.totalCost - p2.totalCost.totalCost;
        if (Math.abs(costDiff) > 0.001) {
            parts.push(costDiff > 0
                ? "$".concat(costDiff.toFixed(4), " more expensive")
                : "$".concat(Math.abs(costDiff).toFixed(4), " cheaper"));
        }
        return parts.join(', ');
    };
    PerformanceProfiler.prototype.groupMetricsByName = function () {
        var grouped = new Map();
        for (var _i = 0, _a = this.metrics; _i < _a.length; _i++) {
            var metric = _a[_i];
            var existing = grouped.get(metric.name) || [];
            existing.push(metric);
            grouped.set(metric.name, existing);
        }
        return grouped;
    };
    return PerformanceProfiler;
}());
exports.PerformanceProfiler = PerformanceProfiler;
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Global performance profiler instance
 */
exports.performanceProfiler = new PerformanceProfiler();
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Start profiling a DAG execution
 */
function startProfiling(dagId, dagName) {
    return exports.performanceProfiler.startProfile(dagId, dagName);
}
/**
 * Record an operation in a profile
 */
function recordOperation(profileId, operation) {
    exports.performanceProfiler.recordOperation(profileId, operation);
}
/**
 * End profiling and get analysis
 */
function endProfiling(profileId) {
    return exports.performanceProfiler.endProfile(profileId);
}
/**
 * Calculate cost for tokens
 */
function calculateTokenCost(tokens, model) {
    return exports.performanceProfiler.calculateCost(tokens, model);
}
/**
 * Get metric statistics
 */
function getMetricStatistics(metricName, filters) {
    return exports.performanceProfiler.getMetricStats(metricName, filters);
}
/**
 * Compare two profiles
 */
function compareProfiles(profileId1, profileId2) {
    return exports.performanceProfiler.compareProfiles(profileId1, profileId2);
}

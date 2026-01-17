"use strict";
/**
 * Observability & Learning Layer
 *
 * Provides execution tracing, performance profiling, failure analysis,
 * and pattern learning for comprehensive DAG execution monitoring.
 *
 * @module dag/observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPatterns = exports.generateInsights = exports.getApplicablePatterns = exports.learnPatterns = exports.recordObservation = exports.patternLearner = exports.PatternLearner = exports.getFailurePatterns = exports.generateFailureReport = exports.findSimilarFailures = exports.analyzeFailure = exports.recordFailure = exports.failureAnalyzer = exports.FailureAnalyzer = exports.compareProfiles = exports.getMetricStatistics = exports.calculateTokenCost = exports.recordOperation = exports.endProfiling = exports.startProfiling = exports.performanceProfiler = exports.PerformanceProfiler = exports.exportTrace = exports.queryTraces = exports.getTraceSummary = exports.endTrace = exports.endSpan = exports.startSpan = exports.startTrace = exports.executionTracer = exports.ExecutionTracer = void 0;
// Execution Tracer - Traces full execution paths
var execution_tracer_1 = require("./execution-tracer");
Object.defineProperty(exports, "ExecutionTracer", { enumerable: true, get: function () { return execution_tracer_1.ExecutionTracer; } });
Object.defineProperty(exports, "executionTracer", { enumerable: true, get: function () { return execution_tracer_1.executionTracer; } });
Object.defineProperty(exports, "startTrace", { enumerable: true, get: function () { return execution_tracer_1.startTrace; } });
Object.defineProperty(exports, "startSpan", { enumerable: true, get: function () { return execution_tracer_1.startSpan; } });
Object.defineProperty(exports, "endSpan", { enumerable: true, get: function () { return execution_tracer_1.endSpan; } });
Object.defineProperty(exports, "endTrace", { enumerable: true, get: function () { return execution_tracer_1.endTrace; } });
Object.defineProperty(exports, "getTraceSummary", { enumerable: true, get: function () { return execution_tracer_1.getTraceSummary; } });
Object.defineProperty(exports, "queryTraces", { enumerable: true, get: function () { return execution_tracer_1.queryTraces; } });
Object.defineProperty(exports, "exportTrace", { enumerable: true, get: function () { return execution_tracer_1.exportTrace; } });
// Performance Profiler - Measures latency, tokens, cost
var performance_profiler_1 = require("./performance-profiler");
Object.defineProperty(exports, "PerformanceProfiler", { enumerable: true, get: function () { return performance_profiler_1.PerformanceProfiler; } });
Object.defineProperty(exports, "performanceProfiler", { enumerable: true, get: function () { return performance_profiler_1.performanceProfiler; } });
Object.defineProperty(exports, "startProfiling", { enumerable: true, get: function () { return performance_profiler_1.startProfiling; } });
Object.defineProperty(exports, "endProfiling", { enumerable: true, get: function () { return performance_profiler_1.endProfiling; } });
Object.defineProperty(exports, "recordOperation", { enumerable: true, get: function () { return performance_profiler_1.recordOperation; } });
Object.defineProperty(exports, "calculateTokenCost", { enumerable: true, get: function () { return performance_profiler_1.calculateTokenCost; } });
Object.defineProperty(exports, "getMetricStatistics", { enumerable: true, get: function () { return performance_profiler_1.getMetricStatistics; } });
Object.defineProperty(exports, "compareProfiles", { enumerable: true, get: function () { return performance_profiler_1.compareProfiles; } });
// Failure Analyzer - Root cause analysis for failures
var failure_analyzer_1 = require("./failure-analyzer");
Object.defineProperty(exports, "FailureAnalyzer", { enumerable: true, get: function () { return failure_analyzer_1.FailureAnalyzer; } });
Object.defineProperty(exports, "failureAnalyzer", { enumerable: true, get: function () { return failure_analyzer_1.failureAnalyzer; } });
Object.defineProperty(exports, "recordFailure", { enumerable: true, get: function () { return failure_analyzer_1.recordFailure; } });
Object.defineProperty(exports, "analyzeFailure", { enumerable: true, get: function () { return failure_analyzer_1.analyzeFailure; } });
Object.defineProperty(exports, "findSimilarFailures", { enumerable: true, get: function () { return failure_analyzer_1.findSimilarFailures; } });
Object.defineProperty(exports, "generateFailureReport", { enumerable: true, get: function () { return failure_analyzer_1.generateFailureReport; } });
Object.defineProperty(exports, "getFailurePatterns", { enumerable: true, get: function () { return failure_analyzer_1.getFailurePatterns; } });
// Pattern Learner - Learns from execution history
var pattern_learner_1 = require("./pattern-learner");
Object.defineProperty(exports, "PatternLearner", { enumerable: true, get: function () { return pattern_learner_1.PatternLearner; } });
Object.defineProperty(exports, "patternLearner", { enumerable: true, get: function () { return pattern_learner_1.patternLearner; } });
Object.defineProperty(exports, "recordObservation", { enumerable: true, get: function () { return pattern_learner_1.recordObservation; } });
Object.defineProperty(exports, "learnPatterns", { enumerable: true, get: function () { return pattern_learner_1.learnPatterns; } });
Object.defineProperty(exports, "getApplicablePatterns", { enumerable: true, get: function () { return pattern_learner_1.getApplicablePatterns; } });
Object.defineProperty(exports, "generateInsights", { enumerable: true, get: function () { return pattern_learner_1.generateInsights; } });
Object.defineProperty(exports, "exportPatterns", { enumerable: true, get: function () { return pattern_learner_1.exportPatterns; } });

/**
 * Observability & Learning Layer
 *
 * Provides execution tracing, performance profiling, failure analysis,
 * and pattern learning for comprehensive DAG execution monitoring.
 *
 * @module dag/observability
 */

// Execution Tracer - Traces full execution paths
export {
  ExecutionTracer,
  executionTracer,
  startTrace,
  startSpan,
  endSpan,
  endTrace,
  getTraceSummary,
  queryTraces,
  exportTrace,
  type ExecutionStatus,
  type TraceLevel,
  type TraceEvent,
  type TraceError,
  type TraceSpan,
  type ExecutionTrace,
  type TraceMetadata,
  type TraceOptions,
  type SpanBuilder,
  type TraceQuery,
  type TraceSummary,
} from './execution-tracer';

// Performance Profiler - Measures latency, tokens, cost
export {
  PerformanceProfiler,
  performanceProfiler,
  startProfiling,
  endProfiling,
  recordOperation,
  calculateTokenCost,
  getMetricStatistics,
  compareProfiles,
  type MetricCategory,
  type AggregationType,
  type MetricDataPoint,
  type TokenMetrics,
  type CostMetrics,
  type LatencyBreakdown,
  type MetricStats,
  type OperationProfile,
  type DAGProfile,
  type BottleneckAnalysis,
  type PerformanceRecommendation,
  type ModelPricing,
  type ProfileOptions,
  type ProfileComparison,
} from './performance-profiler';

// Failure Analyzer - Root cause analysis for failures
export {
  FailureAnalyzer,
  failureAnalyzer,
  recordFailure,
  analyzeFailure,
  findSimilarFailures,
  generateFailureReport,
  getFailurePatterns,
  type FailureCategory,
  type FailureSeverity,
  type FailureEvent,
  type RootCauseAnalysis,
  type ContributingFactor,
  type Remediation,
  type FailurePattern,
  type PatternMatcher,
  type FailureReport,
  type AnalysisOptions,
} from './failure-analyzer';

// Pattern Learner - Learns from execution history
export {
  PatternLearner,
  patternLearner,
  recordObservation,
  learnPatterns,
  getApplicablePatterns,
  generateInsights,
  exportPatterns,
  type PatternType,
  type PatternConfidence,
  type LearnedPattern,
  type PatternCondition,
  type PatternRecommendation,
  type PatternEvidence,
  type ExecutionObservation,
  type LearningInsight,
  type LearnerStatistics,
  type LearnerOptions,
} from './pattern-learner';

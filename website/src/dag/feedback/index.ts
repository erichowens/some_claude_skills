/**
 * Feedback & Learning Layer
 *
 * Provides iteration detection, feedback synthesis, and convergence monitoring
 * for ensuring DAG execution progressively improves toward goal states.
 *
 * @module dag/feedback
 */

// Iteration Detector - Determines when iteration is needed
export {
  IterationDetector,
  iterationDetector,
  analyzeIteration,
  needsIteration,
  recommendedIterations,
  type IterationReason,
  type IterationDecision,
  type IterationFactor,
  type IterationAnalysis,
  type IterationStrategy,
  type IterationInput,
  type UserFeedback,
  type DetectionOptions,
  type IterationRule,
  type IterationWeights,
} from './iteration-detector';

// Feedback Synthesizer - Creates actionable feedback
export {
  FeedbackSynthesizer,
  feedbackSynthesizer,
  synthesizeFeedback,
  quickSynthesizeFeedback,
  getRevisionPrompt,
  type FeedbackPriority,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackAssessment,
  type SynthesizedFeedback,
  type SynthesisInput,
  type CustomAssessment,
  type SynthesisOptions,
} from './feedback-synthesizer';

// Convergence Monitor - Tracks progress toward goals
export {
  ConvergenceMonitor,
  convergenceMonitor,
  startConvergenceSession,
  recordIteration,
  analyzeConvergence,
  hasConverged,
  getConvergenceState,
  endConvergenceSession,
  type ConvergenceState,
  type ConvergenceDataPoint,
  type MetricTrend,
  type ConvergenceGoal,
  type ConvergenceAnalysis,
  type ConvergenceRecommendation,
  type MonitoringOptions,
  type ConvergenceSession,
} from './convergence-monitor';

// Recovery Manager - Handles failed task recovery
export {
  RecoveryManager,
  recoveryManager,
  attemptRecovery,
  createRecoveryManager,
  type RecoveryStrategy,
  type RecoveryAttempt,
  type RecoveryResult,
  type RecoveryContext,
  type StrategySelection,
  type RecoveryConfig,
} from './recovery-manager';

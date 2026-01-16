/**
 * Convergence Monitor
 *
 * Tracks progress toward goal state across iterations, detecting when
 * the system is converging on a solution, plateauing, or diverging.
 *
 * @module dag/feedback/convergence-monitor
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Convergence state of the iteration process
 */
export type ConvergenceState =
  | 'converging'      // Making progress toward goal
  | 'converged'       // Reached acceptable solution
  | 'plateaued'       // No longer making progress
  | 'diverging'       // Moving away from goal
  | 'oscillating'     // Alternating between states
  | 'unknown';        // Insufficient data

/**
 * A single data point in the convergence history
 */
export interface ConvergenceDataPoint {
  /** Iteration number (1-indexed) */
  iteration: number;
  /** Timestamp of this iteration */
  timestamp: Date;
  /** Overall quality score (0-1) */
  qualityScore: number;
  /** Confidence score (0-1) */
  confidenceScore: number;
  /** Number of validation issues */
  validationIssues: number;
  /** Number of hallucinations detected */
  hallucinationCount: number;
  /** Custom metrics for domain-specific tracking */
  customMetrics?: Record<string, number>;
  /** Notes about this iteration */
  notes?: string;
}

/**
 * Trend analysis for a metric over iterations
 */
export interface MetricTrend {
  /** Name of the metric */
  metric: string;
  /** Current value */
  current: number;
  /** Previous value */
  previous: number;
  /** Change from previous */
  delta: number;
  /** Percentage change */
  percentChange: number;
  /** Direction of change */
  direction: 'improving' | 'degrading' | 'stable';
  /** Moving average over last N iterations */
  movingAverage: number;
  /** Standard deviation */
  standardDeviation: number;
}

/**
 * Goal definition for convergence tracking
 */
export interface ConvergenceGoal {
  /** Minimum acceptable quality score */
  minQualityScore: number;
  /** Minimum acceptable confidence score */
  minConfidenceScore: number;
  /** Maximum allowed validation issues */
  maxValidationIssues: number;
  /** Maximum allowed hallucinations */
  maxHallucinations: number;
  /** Custom goal thresholds */
  customThresholds?: Record<string, { min?: number; max?: number }>;
}

/**
 * Convergence analysis result
 */
export interface ConvergenceAnalysis {
  /** Current convergence state */
  state: ConvergenceState;
  /** Confidence in this state assessment (0-1) */
  stateConfidence: number;
  /** Progress toward goal (0-1, can exceed 1 if surpassing) */
  goalProgress: number;
  /** Estimated iterations remaining (null if unknown) */
  estimatedIterationsRemaining: number | null;
  /** Trend analysis for each metric */
  trends: MetricTrend[];
  /** Whether the goal has been met */
  goalMet: boolean;
  /** Which goal criteria are met */
  criteriaStatus: {
    qualityScore: boolean;
    confidenceScore: boolean;
    validationIssues: boolean;
    hallucinations: boolean;
    custom: Record<string, boolean>;
  };
  /** Recommendations for next steps */
  recommendations: ConvergenceRecommendation[];
  /** Warnings about the convergence process */
  warnings: string[];
}

/**
 * Recommendation for improving convergence
 */
export interface ConvergenceRecommendation {
  /** Type of recommendation */
  type: 'continue' | 'adjust' | 'stop' | 'escalate' | 'reset';
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Human-readable recommendation */
  message: string;
  /** Suggested action */
  action?: string;
  /** Reasoning behind the recommendation */
  reasoning: string;
}

/**
 * Options for convergence monitoring
 */
export interface MonitoringOptions {
  /** Goal definition */
  goal: ConvergenceGoal;
  /** Window size for moving average calculation */
  movingAverageWindow?: number;
  /** Minimum iterations before making state assessment */
  minIterationsForAssessment?: number;
  /** Threshold for considering change as "stable" */
  stabilityThreshold?: number;
  /** Maximum iterations allowed */
  maxIterations?: number;
  /** Whether to track custom metrics */
  trackCustomMetrics?: boolean;
}

/**
 * Session for tracking a specific convergence process
 */
export interface ConvergenceSession {
  /** Unique session ID */
  id: string;
  /** Session name/description */
  name: string;
  /** Start time */
  startedAt: Date;
  /** Goal definition */
  goal: ConvergenceGoal;
  /** History of data points */
  history: ConvergenceDataPoint[];
  /** Current state */
  currentState: ConvergenceState;
  /** Whether session is active */
  isActive: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_GOAL: ConvergenceGoal = {
  minQualityScore: 0.8,
  minConfidenceScore: 0.7,
  maxValidationIssues: 0,
  maxHallucinations: 0,
};

const DEFAULT_OPTIONS: Omit<MonitoringOptions, 'goal'> = {
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
export class ConvergenceMonitor {
  private sessions: Map<string, ConvergenceSession> = new Map();
  private defaultOptions: MonitoringOptions;

  constructor(defaultGoal: ConvergenceGoal = DEFAULT_GOAL) {
    this.defaultOptions = {
      ...DEFAULT_OPTIONS,
      goal: defaultGoal,
    };
  }

  /**
   * Start a new convergence tracking session
   */
  startSession(
    name: string,
    goal: ConvergenceGoal = this.defaultOptions.goal
  ): ConvergenceSession {
    const session: ConvergenceSession = {
      id: this.generateSessionId(),
      name,
      startedAt: new Date(),
      goal,
      history: [],
      currentState: 'unknown',
      isActive: true,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Record a data point for a session
   */
  recordIteration(
    sessionId: string,
    data: Omit<ConvergenceDataPoint, 'iteration' | 'timestamp'>
  ): ConvergenceDataPoint {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    if (!session.isActive) {
      throw new Error(`Session is no longer active: ${sessionId}`);
    }

    const dataPoint: ConvergenceDataPoint = {
      ...data,
      iteration: session.history.length + 1,
      timestamp: new Date(),
    };

    session.history.push(dataPoint);
    return dataPoint;
  }

  /**
   * Analyze convergence for a session
   */
  analyze(
    sessionId: string,
    options?: Partial<MonitoringOptions>
  ): ConvergenceAnalysis {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const opts = { ...this.defaultOptions, ...options, goal: session.goal };
    const { history, goal } = session;

    // Insufficient data
    if (history.length < (opts.minIterationsForAssessment || 2)) {
      return this.createInsufficientDataAnalysis(history, goal);
    }

    // Calculate trends
    const trends = this.calculateTrends(history, opts);

    // Determine convergence state
    const state = this.determineState(history, trends, opts);
    const stateConfidence = this.calculateStateConfidence(history, state, opts);

    // Check goal criteria
    const criteriaStatus = this.checkCriteria(history, goal);
    const goalMet = this.isGoalMet(criteriaStatus);
    const goalProgress = this.calculateGoalProgress(history, goal);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      state,
      criteriaStatus,
      history,
      opts
    );

    // Generate warnings
    const warnings = this.generateWarnings(history, state, opts);

    // Estimate remaining iterations
    const estimatedIterationsRemaining = this.estimateRemainingIterations(
      history,
      trends,
      goal,
      goalMet
    );

    // Update session state
    session.currentState = state;

    return {
      state,
      stateConfidence,
      goalProgress,
      estimatedIterationsRemaining,
      trends,
      goalMet,
      criteriaStatus,
      recommendations,
      warnings,
    };
  }

  /**
   * Quick check if goal is met
   */
  isConverged(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.history.length === 0) {
      return false;
    }

    const latest = session.history[session.history.length - 1];
    const { goal } = session;

    return (
      latest.qualityScore >= goal.minQualityScore &&
      latest.confidenceScore >= goal.minConfidenceScore &&
      latest.validationIssues <= goal.maxValidationIssues &&
      latest.hallucinationCount <= goal.maxHallucinations
    );
  }

  /**
   * Get current state for a session
   */
  getState(sessionId: string): ConvergenceState {
    const session = this.sessions.get(sessionId);
    return session?.currentState || 'unknown';
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ConvergenceSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * End a session
   */
  endSession(sessionId: string): ConvergenceSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
    return session;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ConvergenceSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateSessionId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createInsufficientDataAnalysis(
    history: ConvergenceDataPoint[],
    goal: ConvergenceGoal
  ): ConvergenceAnalysis {
    const criteriaStatus = this.checkCriteria(history, goal);

    return {
      state: 'unknown',
      stateConfidence: 0,
      goalProgress: history.length > 0 ? this.calculateGoalProgress(history, goal) : 0,
      estimatedIterationsRemaining: null,
      trends: [],
      goalMet: false,
      criteriaStatus,
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
  }

  private calculateTrends(
    history: ConvergenceDataPoint[],
    options: MonitoringOptions
  ): MetricTrend[] {
    const metrics = ['qualityScore', 'confidenceScore', 'validationIssues', 'hallucinationCount'];
    const trends: MetricTrend[] = [];

    for (const metric of metrics) {
      const values = history.map((h) => h[metric as keyof ConvergenceDataPoint] as number);
      trends.push(this.calculateMetricTrend(metric, values, options));
    }

    // Custom metrics
    if (options.trackCustomMetrics && history[0]?.customMetrics) {
      const customKeys = Object.keys(history[0].customMetrics);
      for (const key of customKeys) {
        const values = history.map((h) => h.customMetrics?.[key] ?? 0);
        trends.push(this.calculateMetricTrend(key, values, options));
      }
    }

    return trends;
  }

  private calculateMetricTrend(
    metric: string,
    values: number[],
    options: MonitoringOptions
  ): MetricTrend {
    const current = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : current;
    const delta = current - previous;
    const percentChange = previous !== 0 ? (delta / previous) * 100 : 0;

    // Moving average
    const windowSize = Math.min(options.movingAverageWindow || 3, values.length);
    const windowValues = values.slice(-windowSize);
    const movingAverage = windowValues.reduce((a, b) => a + b, 0) / windowSize;

    // Standard deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Determine direction
    const threshold = options.stabilityThreshold || 0.05;
    const isImproving = this.isMetricImproving(metric, delta);
    let direction: 'improving' | 'degrading' | 'stable';

    if (Math.abs(delta) < threshold * Math.abs(previous || 1)) {
      direction = 'stable';
    } else if (isImproving) {
      direction = 'improving';
    } else {
      direction = 'degrading';
    }

    return {
      metric,
      current,
      previous,
      delta,
      percentChange,
      direction,
      movingAverage,
      standardDeviation,
    };
  }

  private isMetricImproving(metric: string, delta: number): boolean {
    // For issues and hallucinations, decreasing is improving
    if (metric === 'validationIssues' || metric === 'hallucinationCount') {
      return delta < 0;
    }
    // For scores, increasing is improving
    return delta > 0;
  }

  private determineState(
    history: ConvergenceDataPoint[],
    trends: MetricTrend[],
    options: MonitoringOptions
  ): ConvergenceState {
    // Check if converged (goal met)
    const latest = history[history.length - 1];
    const { goal } = options;

    if (
      latest.qualityScore >= goal.minQualityScore &&
      latest.confidenceScore >= goal.minConfidenceScore &&
      latest.validationIssues <= goal.maxValidationIssues &&
      latest.hallucinationCount <= goal.maxHallucinations
    ) {
      return 'converged';
    }

    // Analyze trends to determine state
    const qualityTrend = trends.find((t) => t.metric === 'qualityScore');
    const confidenceTrend = trends.find((t) => t.metric === 'confidenceScore');

    if (!qualityTrend || !confidenceTrend) {
      return 'unknown';
    }

    // Check for oscillation (alternating directions)
    if (this.isOscillating(history)) {
      return 'oscillating';
    }

    // Check improvement counts
    const improvingCount = trends.filter((t) => t.direction === 'improving').length;
    const degradingCount = trends.filter((t) => t.direction === 'degrading').length;
    const stableCount = trends.filter((t) => t.direction === 'stable').length;

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
  }

  private isOscillating(history: ConvergenceDataPoint[]): boolean {
    if (history.length < 4) return false;

    // Check last 4 quality scores for alternating pattern
    const scores = history.slice(-4).map((h) => h.qualityScore);
    let alternations = 0;

    for (let i = 1; i < scores.length; i++) {
      const prevDir = i > 1 ? Math.sign(scores[i - 1] - scores[i - 2]) : 0;
      const currDir = Math.sign(scores[i] - scores[i - 1]);

      if (prevDir !== 0 && currDir !== 0 && prevDir !== currDir) {
        alternations++;
      }
    }

    return alternations >= 2;
  }

  private isPlateaued(history: ConvergenceDataPoint[], options: MonitoringOptions): boolean {
    if (history.length < 3) return false;

    const threshold = options.stabilityThreshold || 0.05;
    const recent = history.slice(-3);

    // Check if quality scores are stable
    const scores = recent.map((h) => h.qualityScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    return maxScore - minScore < threshold;
  }

  private calculateStateConfidence(
    history: ConvergenceDataPoint[],
    state: ConvergenceState,
    options: MonitoringOptions
  ): number {
    // More data = more confidence
    const dataFactor = Math.min(history.length / 5, 1);

    // Consistent trends = more confidence
    const consistencyFactor = this.calculateConsistencyFactor(history);

    // State-specific confidence adjustments
    let stateFactor = 0.8;
    if (state === 'converged') stateFactor = 1.0;
    if (state === 'unknown') stateFactor = 0.3;
    if (state === 'oscillating') stateFactor = 0.9;

    return Math.min(1, dataFactor * 0.4 + consistencyFactor * 0.3 + stateFactor * 0.3);
  }

  private calculateConsistencyFactor(history: ConvergenceDataPoint[]): number {
    if (history.length < 3) return 0.5;

    // Calculate how consistent the quality score changes are
    const changes: number[] = [];
    for (let i = 1; i < history.length; i++) {
      changes.push(history[i].qualityScore - history[i - 1].qualityScore);
    }

    // Count consistent directions
    let consistentCount = 0;
    for (let i = 1; i < changes.length; i++) {
      if (Math.sign(changes[i]) === Math.sign(changes[i - 1])) {
        consistentCount++;
      }
    }

    return changes.length > 0 ? (consistentCount + 1) / changes.length : 0.5;
  }

  private checkCriteria(
    history: ConvergenceDataPoint[],
    goal: ConvergenceGoal
  ): ConvergenceAnalysis['criteriaStatus'] {
    if (history.length === 0) {
      return {
        qualityScore: false,
        confidenceScore: false,
        validationIssues: false,
        hallucinations: false,
        custom: {},
      };
    }

    const latest = history[history.length - 1];

    const custom: Record<string, boolean> = {};
    if (goal.customThresholds && latest.customMetrics) {
      for (const [key, threshold] of Object.entries(goal.customThresholds)) {
        const value = latest.customMetrics[key] ?? 0;
        const meetsMin = threshold.min === undefined || value >= threshold.min;
        const meetsMax = threshold.max === undefined || value <= threshold.max;
        custom[key] = meetsMin && meetsMax;
      }
    }

    return {
      qualityScore: latest.qualityScore >= goal.minQualityScore,
      confidenceScore: latest.confidenceScore >= goal.minConfidenceScore,
      validationIssues: latest.validationIssues <= goal.maxValidationIssues,
      hallucinations: latest.hallucinationCount <= goal.maxHallucinations,
      custom,
    };
  }

  private isGoalMet(criteriaStatus: ConvergenceAnalysis['criteriaStatus']): boolean {
    return (
      criteriaStatus.qualityScore &&
      criteriaStatus.confidenceScore &&
      criteriaStatus.validationIssues &&
      criteriaStatus.hallucinations &&
      Object.values(criteriaStatus.custom).every((v) => v)
    );
  }

  private calculateGoalProgress(
    history: ConvergenceDataPoint[],
    goal: ConvergenceGoal
  ): number {
    if (history.length === 0) return 0;

    const latest = history[history.length - 1];

    // Calculate progress for each criterion (capped at 1)
    const qualityProgress = Math.min(latest.qualityScore / goal.minQualityScore, 1);
    const confidenceProgress = Math.min(latest.confidenceScore / goal.minConfidenceScore, 1);

    // For issues, progress is inverse (0 issues = full progress)
    const issueProgress =
      goal.maxValidationIssues === 0
        ? latest.validationIssues === 0
          ? 1
          : 0
        : Math.min(1, 1 - latest.validationIssues / (goal.maxValidationIssues + 1));

    const hallucinationProgress =
      goal.maxHallucinations === 0
        ? latest.hallucinationCount === 0
          ? 1
          : 0
        : Math.min(1, 1 - latest.hallucinationCount / (goal.maxHallucinations + 1));

    // Weighted average
    return (
      qualityProgress * 0.35 +
      confidenceProgress * 0.25 +
      issueProgress * 0.2 +
      hallucinationProgress * 0.2
    );
  }

  private generateRecommendations(
    state: ConvergenceState,
    criteriaStatus: ConvergenceAnalysis['criteriaStatus'],
    history: ConvergenceDataPoint[],
    options: MonitoringOptions
  ): ConvergenceRecommendation[] {
    const recommendations: ConvergenceRecommendation[] = [];

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

    if (!criteriaStatus.validationIssues && history[history.length - 1]?.validationIssues > 0) {
      recommendations.push({
        type: 'adjust',
        priority: 'high',
        message: 'Address validation issues',
        action: 'Review validation errors and add explicit format requirements',
        reasoning: 'Output has validation errors',
      });
    }

    if (!criteriaStatus.hallucinations && history[history.length - 1]?.hallucinationCount > 0) {
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
        reasoning: `Iteration limit of ${options.maxIterations} reached`,
      });
    }

    return recommendations;
  }

  private generateWarnings(
    history: ConvergenceDataPoint[],
    state: ConvergenceState,
    options: MonitoringOptions
  ): string[] {
    const warnings: string[] = [];

    // Approaching max iterations
    if (options.maxIterations && history.length >= options.maxIterations * 0.8) {
      warnings.push(
        `Approaching iteration limit (${history.length}/${options.maxIterations})`
      );
    }

    // Long iteration time
    if (history.length > 5 && state !== 'converging' && state !== 'converged') {
      warnings.push('Many iterations without significant progress');
    }

    // Quality degradation
    if (history.length >= 2) {
      const current = history[history.length - 1].qualityScore;
      const previous = history[history.length - 2].qualityScore;
      if (current < previous * 0.9) {
        warnings.push('Quality score decreased significantly');
      }
    }

    // Hallucination increase
    if (history.length >= 2) {
      const current = history[history.length - 1].hallucinationCount;
      const previous = history[history.length - 2].hallucinationCount;
      if (current > previous) {
        warnings.push('Hallucination count increased');
      }
    }

    return warnings;
  }

  private estimateRemainingIterations(
    history: ConvergenceDataPoint[],
    trends: MetricTrend[],
    goal: ConvergenceGoal,
    goalMet: boolean
  ): number | null {
    if (goalMet) return 0;
    if (history.length < 3) return null;

    const qualityTrend = trends.find((t) => t.metric === 'qualityScore');
    if (!qualityTrend || qualityTrend.direction !== 'improving') {
      return null;
    }

    // Estimate based on average improvement rate
    const latest = history[history.length - 1];
    const remaining = goal.minQualityScore - latest.qualityScore;

    if (remaining <= 0) return 1;

    // Calculate average improvement per iteration
    const improvementRate = qualityTrend.movingAverage - latest.qualityScore + qualityTrend.delta;

    if (improvementRate <= 0) return null;

    const estimated = Math.ceil(remaining / Math.abs(improvementRate));
    return Math.max(1, Math.min(estimated, 20)); // Cap at reasonable bounds
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global convergence monitor instance
 */
export const convergenceMonitor = new ConvergenceMonitor();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Start a new convergence tracking session
 */
export function startConvergenceSession(
  name: string,
  goal?: ConvergenceGoal
): ConvergenceSession {
  return convergenceMonitor.startSession(name, goal);
}

/**
 * Record an iteration data point
 */
export function recordIteration(
  sessionId: string,
  data: Omit<ConvergenceDataPoint, 'iteration' | 'timestamp'>
): ConvergenceDataPoint {
  return convergenceMonitor.recordIteration(sessionId, data);
}

/**
 * Analyze convergence for a session
 */
export function analyzeConvergence(
  sessionId: string,
  options?: Partial<MonitoringOptions>
): ConvergenceAnalysis {
  return convergenceMonitor.analyze(sessionId, options);
}

/**
 * Quick check if a session has converged
 */
export function hasConverged(sessionId: string): boolean {
  return convergenceMonitor.isConverged(sessionId);
}

/**
 * Get current convergence state
 */
export function getConvergenceState(sessionId: string): ConvergenceState {
  return convergenceMonitor.getState(sessionId);
}

/**
 * End a convergence session
 */
export function endConvergenceSession(sessionId: string): ConvergenceSession | undefined {
  return convergenceMonitor.endSession(sessionId);
}

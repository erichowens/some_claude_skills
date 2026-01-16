/**
 * Pattern Learner
 *
 * Learns from execution history, identifying successful patterns and
 * anti-patterns to improve future DAG execution and skill selection.
 *
 * @module dag/observability/pattern-learner
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Types of patterns that can be learned
 */
export type PatternType =
  | 'skill-selection'     // Which skills work best for which tasks
  | 'execution-order'     // Optimal ordering of operations
  | 'parallelization'     // What can be parallelized safely
  | 'retry-strategy'      // When and how to retry
  | 'model-selection'     // Which model for which task
  | 'prompt-template'     // Effective prompt patterns
  | 'failure-prevention'  // Conditions that lead to failure
  | 'performance';        // Performance optimization patterns

/**
 * Confidence level for learned patterns
 */
export type PatternConfidence = 'high' | 'medium' | 'low' | 'experimental';

/**
 * A learned pattern
 */
export interface LearnedPattern {
  /** Pattern ID */
  patternId: string;
  /** Pattern type */
  type: PatternType;
  /** Human-readable name */
  name: string;
  /** Description of the pattern */
  description: string;
  /** Confidence in this pattern */
  confidence: PatternConfidence;
  /** Numeric confidence score (0-1) */
  confidenceScore: number;
  /** Conditions when this pattern applies */
  conditions: PatternCondition[];
  /** What the pattern recommends */
  recommendation: PatternRecommendation;
  /** Evidence supporting this pattern */
  evidence: PatternEvidence;
  /** When first learned */
  learnedAt: Date;
  /** When last updated */
  updatedAt: Date;
  /** Number of times validated */
  validationCount: number;
  /** Success rate when applied */
  successRate: number;
  /** Tags for categorization */
  tags: string[];
}

/**
 * Condition for pattern applicability
 */
export interface PatternCondition {
  /** Condition type */
  type: 'task-type' | 'input-size' | 'complexity' | 'skill' | 'context' | 'history';
  /** Operator */
  operator: 'equals' | 'contains' | 'greater-than' | 'less-than' | 'matches';
  /** Value to compare */
  value: string | number | boolean;
  /** Field to check */
  field?: string;
}

/**
 * Pattern recommendation
 */
export interface PatternRecommendation {
  /** Recommended action */
  action: string;
  /** Specific parameters */
  parameters?: Record<string, unknown>;
  /** Alternative if primary fails */
  fallback?: string;
  /** Expected improvement */
  expectedImprovement: {
    metric: string;
    improvement: number;
    unit: string;
  };
}

/**
 * Evidence supporting a pattern
 */
export interface PatternEvidence {
  /** Number of observations */
  observationCount: number;
  /** Success count */
  successCount: number;
  /** Failure count */
  failureCount: number;
  /** Sample execution IDs */
  sampleExecutions: string[];
  /** Statistical significance */
  pValue?: number;
  /** Average improvement observed */
  avgImprovement?: number;
}

/**
 * Execution observation for learning
 */
export interface ExecutionObservation {
  /** Observation ID */
  observationId: string;
  /** Timestamp */
  timestamp: Date;
  /** DAG ID */
  dagId?: string;
  /** Task description */
  taskDescription: string;
  /** Skills used */
  skillsUsed: string[];
  /** Execution order */
  executionOrder: string[];
  /** Model used */
  model?: string;
  /** Success or failure */
  success: boolean;
  /** Quality score if available */
  qualityScore?: number;
  /** Performance metrics */
  metrics: {
    durationMs: number;
    tokenCount?: number;
    cost?: number;
    retryCount: number;
  };
  /** Context at execution time */
  context: Record<string, unknown>;
  /** Input characteristics */
  inputCharacteristics: {
    size: number;
    complexity?: 'low' | 'medium' | 'high';
    type?: string;
  };
  /** Feedback if any */
  feedback?: {
    rating: number;
    comments?: string;
  };
}

/**
 * Learning insight
 */
export interface LearningInsight {
  /** Insight ID */
  insightId: string;
  /** Type of insight */
  type: 'correlation' | 'trend' | 'anomaly' | 'recommendation';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Confidence */
  confidence: number;
  /** Supporting data */
  data: Record<string, unknown>;
  /** Suggested action */
  suggestedAction?: string;
  /** Impact estimate */
  impactEstimate?: string;
}

/**
 * Options for the pattern learner
 */
export interface LearnerOptions {
  /** Minimum observations before learning pattern */
  minObservations?: number;
  /** Minimum confidence to promote pattern */
  minConfidence?: number;
  /** How long to keep observations (ms) */
  observationRetentionMs?: number;
  /** Whether to auto-promote patterns */
  autoPromote?: boolean;
  /** Maximum patterns to keep */
  maxPatterns?: number;
  /** Enable statistical significance testing */
  statisticalTesting?: boolean;
}

/**
 * Query for patterns
 */
export interface PatternQuery {
  /** Filter by type */
  type?: PatternType;
  /** Filter by confidence */
  minConfidence?: PatternConfidence;
  /** Filter by tags */
  tags?: string[];
  /** Filter by success rate */
  minSuccessRate?: number;
  /** Limit results */
  limit?: number;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_OPTIONS: LearnerOptions = {
  minObservations: 5,
  minConfidence: 0.6,
  observationRetentionMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  autoPromote: true,
  maxPatterns: 1000,
  statisticalTesting: true,
};

const CONFIDENCE_THRESHOLDS = {
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
export class PatternLearner {
  private patterns: Map<string, LearnedPattern> = new Map();
  private observations: Map<string, ExecutionObservation> = new Map();
  private insights: LearningInsight[] = [];
  private options: LearnerOptions;

  constructor(options: Partial<LearnerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Record an execution observation
   */
  recordObservation(
    observation: Omit<ExecutionObservation, 'observationId' | 'timestamp'>
  ): ExecutionObservation {
    const fullObservation: ExecutionObservation = {
      ...observation,
      observationId: this.generateId('obs'),
      timestamp: new Date(),
    };

    this.observations.set(fullObservation.observationId, fullObservation);

    // Trigger learning
    if (this.options.autoPromote) {
      this.learnFromObservation(fullObservation);
    }

    return fullObservation;
  }

  /**
   * Trigger learning from all observations
   */
  learn(): LearnedPattern[] {
    const newPatterns: LearnedPattern[] = [];

    // Learn skill selection patterns
    newPatterns.push(...this.learnSkillSelectionPatterns());

    // Learn execution order patterns
    newPatterns.push(...this.learnExecutionOrderPatterns());

    // Learn model selection patterns
    newPatterns.push(...this.learnModelSelectionPatterns());

    // Learn failure prevention patterns
    newPatterns.push(...this.learnFailurePreventionPatterns());

    // Learn performance patterns
    newPatterns.push(...this.learnPerformancePatterns());

    // Add to pattern store
    for (const pattern of newPatterns) {
      this.patterns.set(pattern.patternId, pattern);
    }

    return newPatterns;
  }

  /**
   * Get applicable patterns for a task
   */
  getApplicablePatterns(
    taskDescription: string,
    context: Record<string, unknown>
  ): LearnedPattern[] {
    const applicable: Array<{ pattern: LearnedPattern; score: number }> = [];

    for (const pattern of this.patterns.values()) {
      const score = this.evaluatePatternApplicability(pattern, taskDescription, context);
      if (score > 0.5) {
        applicable.push({ pattern, score });
      }
    }

    return applicable
      .sort((a, b) => b.score - a.score)
      .map((a) => a.pattern);
  }

  /**
   * Query patterns
   */
  queryPatterns(query: PatternQuery): LearnedPattern[] {
    let results = Array.from(this.patterns.values());

    if (query.type) {
      results = results.filter((p) => p.type === query.type);
    }

    if (query.minConfidence) {
      const threshold = CONFIDENCE_THRESHOLDS[query.minConfidence];
      results = results.filter((p) => p.confidenceScore >= threshold);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((p) =>
        query.tags!.some((tag) => p.tags.includes(tag))
      );
    }

    if (query.minSuccessRate !== undefined) {
      results = results.filter((p) => p.successRate >= query.minSuccessRate!);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get pattern by ID
   */
  getPattern(patternId: string): LearnedPattern | undefined {
    return this.patterns.get(patternId);
  }

  /**
   * Validate a pattern against new execution
   */
  validatePattern(
    patternId: string,
    success: boolean,
    observationId?: string
  ): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    pattern.validationCount++;
    pattern.evidence.observationCount++;

    if (success) {
      pattern.evidence.successCount++;
    } else {
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
  }

  /**
   * Generate insights from observations
   */
  generateInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Correlation analysis
    insights.push(...this.findCorrelations());

    // Trend analysis
    insights.push(...this.findTrends());

    // Anomaly detection
    insights.push(...this.findAnomalies());

    // Recommendations
    insights.push(...this.generateRecommendations());

    this.insights = insights;
    return insights;
  }

  /**
   * Get all insights
   */
  getInsights(): LearningInsight[] {
    return this.insights;
  }

  /**
   * Export learned patterns
   */
  exportPatterns(format: 'json' | 'summary' = 'json'): string {
    const patterns = Array.from(this.patterns.values());

    if (format === 'json') {
      return JSON.stringify(patterns, null, 2);
    }

    // Summary format
    const lines: string[] = [
      `# Learned Patterns Summary`,
      `Total patterns: ${patterns.length}`,
      '',
      '## By Type',
    ];

    const byType = this.groupBy(patterns, 'type');
    for (const [type, typePatterns] of Object.entries(byType)) {
      lines.push(`- ${type}: ${typePatterns.length} patterns`);
    }

    lines.push('', '## Top Patterns by Success Rate');
    const topPatterns = patterns
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    for (const pattern of topPatterns) {
      lines.push(
        `- **${pattern.name}** (${(pattern.successRate * 100).toFixed(1)}% success)`
      );
      lines.push(`  ${pattern.description}`);
    }

    return lines.join('\n');
  }

  /**
   * Import patterns
   */
  importPatterns(patternsJson: string): number {
    try {
      const patterns = JSON.parse(patternsJson) as LearnedPattern[];
      let imported = 0;

      for (const pattern of patterns) {
        if (pattern.patternId && pattern.type) {
          this.patterns.set(pattern.patternId, pattern);
          imported++;
        }
      }

      return imported;
    } catch {
      return 0;
    }
  }

  /**
   * Clear old observations
   */
  clearOldObservations(): number {
    const cutoff = new Date(
      Date.now() - (this.options.observationRetentionMs || 30 * 24 * 60 * 60 * 1000)
    );
    let cleared = 0;

    for (const [id, obs] of this.observations) {
      if (obs.timestamp < cutoff) {
        this.observations.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get statistics
   */
  getStatistics(): LearnerStatistics {
    const patterns = Array.from(this.patterns.values());
    const observations = Array.from(this.observations.values());

    return {
      totalPatterns: patterns.length,
      totalObservations: observations.length,
      patternsByType: this.countBy(patterns, 'type'),
      patternsByConfidence: this.countBy(patterns, 'confidence'),
      avgSuccessRate:
        patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length
          : 0,
      observationSuccessRate:
        observations.length > 0
          ? observations.filter((o) => o.success).length / observations.length
          : 0,
      topSkills: this.getTopSkills(observations),
      avgQualityScore: this.calculateAvgQualityScore(observations),
    };
  }

  // ============================================================================
  // Private Methods - Learning Algorithms
  // ============================================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private learnFromObservation(observation: ExecutionObservation): void {
    // Quick incremental learning
    const relevantPatterns = this.findRelevantPatterns(observation);

    for (const pattern of relevantPatterns) {
      this.validatePattern(pattern.patternId, observation.success, observation.observationId);
    }
  }

  private findRelevantPatterns(observation: ExecutionObservation): LearnedPattern[] {
    const relevant: LearnedPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (this.matchesPatternConditions(pattern, observation)) {
        relevant.push(pattern);
      }
    }

    return relevant;
  }

  private matchesPatternConditions(
    pattern: LearnedPattern,
    observation: ExecutionObservation
  ): boolean {
    for (const condition of pattern.conditions) {
      if (!this.evaluateCondition(condition, observation)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: PatternCondition,
    observation: ExecutionObservation
  ): boolean {
    let value: unknown;

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
  }

  private learnSkillSelectionPatterns(): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const observations = Array.from(this.observations.values());

    // Group by task keywords
    const taskKeywords = this.extractTaskKeywords(observations);

    for (const [keyword, obs] of Object.entries(taskKeywords)) {
      if (obs.length < (this.options.minObservations || 5)) continue;

      // Find most successful skill combinations
      const skillCombos = this.groupBy(obs, (o) => o.skillsUsed.sort().join(','));

      for (const [combo, comboObs] of Object.entries(skillCombos)) {
        const successRate = comboObs.filter((o) => o.success).length / comboObs.length;

        if (successRate >= 0.7 && comboObs.length >= 3) {
          patterns.push(this.createPattern({
            type: 'skill-selection',
            name: `Skills for "${keyword}" tasks`,
            description: `Use skills [${combo}] for tasks involving "${keyword}"`,
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
              successCount: comboObs.filter((o) => o.success).length,
              failureCount: comboObs.filter((o) => !o.success).length,
              sampleExecutions: comboObs.slice(0, 5).map((o) => o.observationId),
            },
            successRate,
            tags: ['skill-selection', keyword],
          }));
        }
      }
    }

    return patterns;
  }

  private learnExecutionOrderPatterns(): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const observations = Array.from(this.observations.values());

    // Group by execution order
    const orderGroups = this.groupBy(observations, (o) => o.executionOrder.join('->'));

    for (const [order, obs] of Object.entries(orderGroups)) {
      if (obs.length < (this.options.minObservations || 5)) continue;

      const successRate = obs.filter((o) => o.success).length / obs.length;
      const avgDuration = obs.reduce((sum, o) => sum + o.metrics.durationMs, 0) / obs.length;

      if (successRate >= 0.8) {
        patterns.push(this.createPattern({
          type: 'execution-order',
          name: `Order: ${order}`,
          description: `Execute in order: ${order.replace(/->/g, ' → ')}`,
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
            successCount: obs.filter((o) => o.success).length,
            failureCount: obs.filter((o) => !o.success).length,
            sampleExecutions: obs.slice(0, 5).map((o) => o.observationId),
            avgImprovement: avgDuration,
          },
          successRate,
          tags: ['execution-order'],
        }));
      }
    }

    return patterns;
  }

  private learnModelSelectionPatterns(): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const observations = Array.from(this.observations.values()).filter((o) => o.model);

    // Group by complexity and model
    const complexityGroups = this.groupBy(observations, (o) => o.inputCharacteristics?.complexity ?? 'unknown');

    for (const [complexity, obs] of Object.entries(complexityGroups)) {
      const modelGroups = this.groupBy(obs, 'model');

      // Find best model for this complexity
      let bestModel = '';
      let bestScore = 0;

      for (const [model, modelObs] of Object.entries(modelGroups)) {
        if (modelObs.length < 3) continue;

        const avgQuality =
          modelObs
            .filter((o) => o.qualityScore !== undefined)
            .reduce((sum, o) => sum + (o.qualityScore || 0), 0) /
          modelObs.filter((o) => o.qualityScore !== undefined).length;

        const successRate = modelObs.filter((o) => o.success).length / modelObs.length;
        const score = avgQuality * 0.6 + successRate * 0.4;

        if (score > bestScore) {
          bestScore = score;
          bestModel = model;
        }
      }

      if (bestModel && bestScore > 0.7) {
        const modelObs = modelGroups[bestModel];
        patterns.push(this.createPattern({
          type: 'model-selection',
          name: `Model for ${complexity} complexity`,
          description: `Use ${bestModel} for ${complexity} complexity tasks`,
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
            successCount: modelObs.filter((o) => o.success).length,
            failureCount: modelObs.filter((o) => !o.success).length,
            sampleExecutions: modelObs.slice(0, 5).map((o) => o.observationId),
          },
          successRate: modelObs.filter((o) => o.success).length / modelObs.length,
          tags: ['model-selection', complexity],
        }));
      }
    }

    return patterns;
  }

  private learnFailurePreventionPatterns(): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const failures = Array.from(this.observations.values()).filter((o) => !o.success);

    if (failures.length < (this.options.minObservations || 5)) {
      return patterns;
    }

    // Analyze common failure characteristics
    const inputSizeFailures = failures.filter(
      (f) => f.inputCharacteristics.size > 10000
    );

    if (inputSizeFailures.length >= 3) {
      const avgSize =
        inputSizeFailures.reduce((sum, f) => sum + f.inputCharacteristics.size, 0) /
        inputSizeFailures.length;

      patterns.push(this.createPattern({
        type: 'failure-prevention',
        name: 'Large input warning',
        description: `Inputs larger than ${Math.round(avgSize)} bytes have higher failure rate`,
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
          sampleExecutions: inputSizeFailures.slice(0, 5).map((f) => f.observationId),
        },
        successRate: 0,
        tags: ['failure-prevention', 'input-size'],
      }));
    }

    // High retry count failures
    const highRetryFailures = failures.filter((f) => f.metrics.retryCount >= 3);

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
          sampleExecutions: highRetryFailures.slice(0, 5).map((f) => f.observationId),
        },
        successRate: 0,
        tags: ['failure-prevention', 'retry'],
      }));
    }

    return patterns;
  }

  private learnPerformancePatterns(): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const successes = Array.from(this.observations.values()).filter((o) => o.success);

    if (successes.length < (this.options.minObservations || 5)) {
      return patterns;
    }

    // Find fast executions
    const durations = successes.map((s) => s.metrics.durationMs).sort((a, b) => a - b);
    const p25 = durations[Math.floor(durations.length * 0.25)];

    const fastExecutions = successes.filter((s) => s.metrics.durationMs <= p25);

    if (fastExecutions.length >= 3) {
      // What do fast executions have in common?
      const commonSkills = this.findCommonElements(
        fastExecutions.map((f) => f.skillsUsed)
      );

      if (commonSkills.length > 0) {
        patterns.push(this.createPattern({
          type: 'performance',
          name: 'Fast execution pattern',
          description: `Tasks with skills [${commonSkills.join(', ')}] execute faster`,
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
            sampleExecutions: fastExecutions.slice(0, 5).map((f) => f.observationId),
            avgImprovement: p25,
          },
          successRate: 1,
          tags: ['performance', 'latency'],
        }));
      }
    }

    return patterns;
  }

  private createPattern(params: {
    type: PatternType;
    name: string;
    description: string;
    conditions: PatternCondition[];
    recommendation: PatternRecommendation;
    evidence: PatternEvidence;
    successRate: number;
    tags: string[];
  }): LearnedPattern {
    const confidenceScore = this.calculateInitialConfidence(params.evidence, params.successRate);

    return {
      patternId: this.generateId('pattern'),
      type: params.type,
      name: params.name,
      description: params.description,
      confidence: this.confidenceLevel(confidenceScore),
      confidenceScore,
      conditions: params.conditions,
      recommendation: params.recommendation,
      evidence: params.evidence,
      learnedAt: new Date(),
      updatedAt: new Date(),
      validationCount: params.evidence.observationCount,
      successRate: params.successRate,
      tags: params.tags,
    };
  }

  private calculateInitialConfidence(evidence: PatternEvidence, successRate: number): number {
    // Factors: observation count, success rate, consistency
    const countFactor = Math.min(1, evidence.observationCount / 20);
    const successFactor = successRate;
    const consistencyFactor =
      evidence.observationCount > 0
        ? 1 -
          Math.abs(
            evidence.successCount / evidence.observationCount - successRate
          )
        : 0.5;

    return countFactor * 0.3 + successFactor * 0.5 + consistencyFactor * 0.2;
  }

  private calculateConfidence(pattern: LearnedPattern): number {
    const evidence = pattern.evidence;
    const countFactor = Math.min(1, evidence.observationCount / 30);
    const successFactor = pattern.successRate;
    const ageFactor = Math.min(
      1,
      (Date.now() - pattern.learnedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return countFactor * 0.3 + successFactor * 0.5 + ageFactor * 0.2;
  }

  private confidenceLevel(score: number): PatternConfidence {
    if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
    if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
    if (score >= CONFIDENCE_THRESHOLDS.low) return 'low';
    return 'experimental';
  }

  private evaluatePatternApplicability(
    pattern: LearnedPattern,
    taskDescription: string,
    context: Record<string, unknown>
  ): number {
    let score = pattern.confidenceScore * 0.5;

    // Check conditions
    let conditionsMet = 0;
    for (const condition of pattern.conditions) {
      if (condition.type === 'task-type') {
        if (taskDescription.toLowerCase().includes(String(condition.value).toLowerCase())) {
          conditionsMet++;
        }
      } else if (condition.type === 'context' && condition.field) {
        const contextValue = context[condition.field];
        if (contextValue === condition.value) {
          conditionsMet++;
        }
      }
    }

    if (pattern.conditions.length > 0) {
      score += (conditionsMet / pattern.conditions.length) * 0.5;
    }

    return score;
  }

  // ============================================================================
  // Private Methods - Insights
  // ============================================================================

  private findCorrelations(): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const observations = Array.from(this.observations.values());

    // Correlation: success rate vs input size
    const smallInputs = observations.filter((o) => o.inputCharacteristics.size < 1000);
    const largeInputs = observations.filter((o) => o.inputCharacteristics.size >= 10000);

    if (smallInputs.length >= 5 && largeInputs.length >= 5) {
      const smallSuccess = smallInputs.filter((o) => o.success).length / smallInputs.length;
      const largeSuccess = largeInputs.filter((o) => o.success).length / largeInputs.length;

      if (smallSuccess - largeSuccess > 0.2) {
        insights.push({
          insightId: this.generateId('insight'),
          type: 'correlation',
          title: 'Input size affects success rate',
          description: `Small inputs have ${((smallSuccess - largeSuccess) * 100).toFixed(1)}% higher success rate`,
          confidence: 0.8,
          data: { smallSuccess, largeSuccess },
          suggestedAction: 'Consider chunking large inputs',
          impactEstimate: `Could improve success rate by ${((smallSuccess - largeSuccess) * 100).toFixed(1)}%`,
        });
      }
    }

    return insights;
  }

  private findTrends(): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const observations = Array.from(this.observations.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (observations.length < 10) return insights;

    // Split into halves
    const midpoint = Math.floor(observations.length / 2);
    const firstHalf = observations.slice(0, midpoint);
    const secondHalf = observations.slice(midpoint);

    const firstSuccess = firstHalf.filter((o) => o.success).length / firstHalf.length;
    const secondSuccess = secondHalf.filter((o) => o.success).length / secondHalf.length;

    if (Math.abs(secondSuccess - firstSuccess) > 0.1) {
      const trend = secondSuccess > firstSuccess ? 'improving' : 'declining';
      insights.push({
        insightId: this.generateId('insight'),
        type: 'trend',
        title: `Success rate is ${trend}`,
        description: `Success rate changed from ${(firstSuccess * 100).toFixed(1)}% to ${(secondSuccess * 100).toFixed(1)}%`,
        confidence: 0.7,
        data: { firstSuccess, secondSuccess, trend },
        suggestedAction:
          trend === 'declining'
            ? 'Investigate recent failures'
            : 'Continue current approach',
      });
    }

    return insights;
  }

  private findAnomalies(): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const observations = Array.from(this.observations.values());

    // Find outlier durations
    const durations = observations.map((o) => o.metrics.durationMs);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev = Math.sqrt(
      durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length
    );

    const outliers = observations.filter(
      (o) => Math.abs(o.metrics.durationMs - mean) > 2 * stdDev
    );

    if (outliers.length > 0 && outliers.length < observations.length * 0.1) {
      insights.push({
        insightId: this.generateId('insight'),
        type: 'anomaly',
        title: 'Unusual execution times detected',
        description: `${outliers.length} executions had unusually long/short durations`,
        confidence: 0.6,
        data: {
          outlierCount: outliers.length,
          mean,
          stdDev,
          outlierIds: outliers.map((o) => o.observationId),
        },
        suggestedAction: 'Investigate outlier executions for issues',
      });
    }

    return insights;
  }

  private generateRecommendations(): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const stats = this.getStatistics();

    // Low overall success rate
    if (stats.observationSuccessRate < 0.7) {
      insights.push({
        insightId: this.generateId('insight'),
        type: 'recommendation',
        title: 'Improve overall success rate',
        description: `Current success rate (${(stats.observationSuccessRate * 100).toFixed(1)}%) is below target`,
        confidence: 0.9,
        data: { currentRate: stats.observationSuccessRate },
        suggestedAction: 'Review failure patterns and implement fixes',
        impactEstimate: 'Could improve to 80%+ success rate',
      });
    }

    return insights;
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  private extractTaskKeywords(observations: ExecutionObservation[]): Record<string, ExecutionObservation[]> {
    const keywords: Record<string, ExecutionObservation[]> = {};
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'to', 'for', 'and', 'or', 'of']);

    for (const obs of observations) {
      const words = obs.taskDescription
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

      for (const word of words) {
        if (!keywords[word]) keywords[word] = [];
        keywords[word].push(obs);
      }
    }

    return keywords;
  }

  private groupBy<T>(items: T[], keyFn: keyof T | ((item: T) => string)): Record<string, T[]> {
    const groups: Record<string, T[]> = {};

    for (const item of items) {
      const key =
        typeof keyFn === 'function'
          ? keyFn(item)
          : String(item[keyFn]);

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    return groups;
  }

  private countBy<T>(items: T[], key: keyof T): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of items) {
      const value = String(item[key]);
      counts[value] = (counts[value] || 0) + 1;
    }

    return counts;
  }

  private findCommonElements(arrays: string[][]): string[] {
    if (arrays.length === 0) return [];

    const counts = new Map<string, number>();
    for (const arr of arrays) {
      for (const item of arr) {
        counts.set(item, (counts.get(item) || 0) + 1);
      }
    }

    const threshold = arrays.length * 0.7;
    return Array.from(counts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([item]) => item);
  }

  private getTopSkills(observations: ExecutionObservation[]): Array<{ skill: string; count: number }> {
    const counts = new Map<string, number>();

    for (const obs of observations) {
      for (const skill of obs.skillsUsed) {
        counts.set(skill, (counts.get(skill) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateAvgQualityScore(observations: ExecutionObservation[]): number {
    const withQuality = observations.filter((o) => o.qualityScore !== undefined);
    if (withQuality.length === 0) return 0;
    return withQuality.reduce((sum, o) => sum + (o.qualityScore || 0), 0) / withQuality.length;
  }
}

/**
 * Statistics about the learner
 */
export interface LearnerStatistics {
  totalPatterns: number;
  totalObservations: number;
  patternsByType: Record<string, number>;
  patternsByConfidence: Record<string, number>;
  avgSuccessRate: number;
  observationSuccessRate: number;
  topSkills: Array<{ skill: string; count: number }>;
  avgQualityScore: number;
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global pattern learner instance
 */
export const patternLearner = new PatternLearner();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Record an execution observation
 */
export function recordObservation(
  observation: Omit<ExecutionObservation, 'observationId' | 'timestamp'>
): ExecutionObservation {
  return patternLearner.recordObservation(observation);
}

/**
 * Trigger learning from observations
 */
export function learnPatterns(): LearnedPattern[] {
  return patternLearner.learn();
}

/**
 * Get applicable patterns for a task
 */
export function getApplicablePatterns(
  taskDescription: string,
  context: Record<string, unknown> = {}
): LearnedPattern[] {
  return patternLearner.getApplicablePatterns(taskDescription, context);
}

/**
 * Query learned patterns
 */
export function queryPatterns(query: PatternQuery): LearnedPattern[] {
  return patternLearner.queryPatterns(query);
}

/**
 * Generate learning insights
 */
export function generateInsights(): LearningInsight[] {
  return patternLearner.generateInsights();
}

/**
 * Get learner statistics
 */
export function getLearnerStatistics(): LearnerStatistics {
  return patternLearner.getStatistics();
}

/**
 * Export patterns
 */
export function exportPatterns(format?: 'json' | 'summary'): string {
  return patternLearner.exportPatterns(format);
}

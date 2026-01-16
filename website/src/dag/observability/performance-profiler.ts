/**
 * Performance Profiler
 *
 * Measures latency, token usage, cost, and other performance metrics
 * for DAG execution to identify bottlenecks and optimize workflows.
 *
 * @module dag/observability/performance-profiler
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Categories of performance metrics
 */
export type MetricCategory =
  | 'latency'
  | 'tokens'
  | 'cost'
  | 'memory'
  | 'throughput'
  | 'custom';

/**
 * Aggregation methods for metrics
 */
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'p50' | 'p90' | 'p95' | 'p99';

/**
 * A single metric data point
 */
export interface MetricDataPoint {
  /** Timestamp */
  timestamp: Date;
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Metric category */
  category: MetricCategory;
  /** Associated span/operation ID */
  spanId?: string;
  /** Associated node ID */
  nodeId?: string;
  /** Tags for filtering */
  tags: Record<string, string>;
}

/**
 * Token usage metrics
 */
export interface TokenMetrics {
  /** Input tokens (prompt) */
  inputTokens: number;
  /** Output tokens (completion) */
  outputTokens: number;
  /** Total tokens */
  totalTokens: number;
  /** Context tokens used */
  contextTokens?: number;
  /** Tokens from tool calls */
  toolTokens?: number;
}

/**
 * Cost metrics
 */
export interface CostMetrics {
  /** Input token cost */
  inputCost: number;
  /** Output token cost */
  outputCost: number;
  /** Total cost */
  totalCost: number;
  /** Cost currency */
  currency: string;
  /** Model used */
  model: string;
}

/**
 * Latency breakdown
 */
export interface LatencyBreakdown {
  /** Total end-to-end latency */
  totalMs: number;
  /** Time waiting in queue */
  queueMs?: number;
  /** Time for API call */
  apiMs?: number;
  /** Time for processing */
  processingMs?: number;
  /** Time for tool execution */
  toolMs?: number;
  /** Network overhead */
  networkMs?: number;
}

/**
 * Aggregated metric statistics
 */
export interface MetricStats {
  /** Metric name */
  name: string;
  /** Number of samples */
  count: number;
  /** Sum of all values */
  sum: number;
  /** Mean value */
  mean: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Standard deviation */
  stdDev: number;
  /** Percentiles */
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  /** Values over time */
  timeSeries?: Array<{ timestamp: Date; value: number }>;
}

/**
 * Profile for a single operation
 */
export interface OperationProfile {
  /** Operation name */
  operationName: string;
  /** Node ID */
  nodeId?: string;
  /** Skill ID */
  skillId?: string;
  /** Latency breakdown */
  latency: LatencyBreakdown;
  /** Token usage */
  tokens?: TokenMetrics;
  /** Cost */
  cost?: CostMetrics;
  /** Memory usage (bytes) */
  memoryBytes?: number;
  /** Whether this was a cache hit */
  cacheHit?: boolean;
  /** Retry count */
  retryCount: number;
  /** Custom metrics */
  customMetrics: Record<string, number>;
}

/**
 * Profile for an entire DAG execution
 */
export interface DAGProfile {
  /** Profile ID */
  profileId: string;
  /** DAG ID */
  dagId: string;
  /** DAG name */
  dagName?: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Total duration */
  totalDurationMs?: number;
  /** Total tokens used */
  totalTokens: TokenMetrics;
  /** Total cost */
  totalCost: CostMetrics;
  /** Number of nodes executed */
  nodesExecuted: number;
  /** Number of nodes that failed */
  nodesFailed: number;
  /** Number of retries */
  totalRetries: number;
  /** Parallelization efficiency (0-1) */
  parallelizationEfficiency?: number;
  /** Operation profiles */
  operations: OperationProfile[];
  /** Bottleneck analysis */
  bottlenecks: BottleneckAnalysis[];
  /** Recommendations */
  recommendations: PerformanceRecommendation[];
}

/**
 * Bottleneck analysis
 */
export interface BottleneckAnalysis {
  /** Type of bottleneck */
  type: 'latency' | 'tokens' | 'cost' | 'sequential' | 'retry';
  /** Severity (0-1) */
  severity: number;
  /** Description */
  description: string;
  /** Affected operations */
  affectedOperations: string[];
  /** Potential time savings (ms) */
  potentialSavingsMs?: number;
  /** Potential cost savings */
  potentialSavingsCost?: number;
}

/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
  /** Recommendation category */
  category: 'latency' | 'cost' | 'tokens' | 'parallelization' | 'caching';
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Estimated impact */
  estimatedImpact: string;
  /** Suggested action */
  action: string;
}

/**
 * Pricing configuration for models
 */
export interface ModelPricing {
  /** Model ID */
  modelId: string;
  /** Input cost per 1K tokens */
  inputPer1K: number;
  /** Output cost per 1K tokens */
  outputPer1K: number;
  /** Currency */
  currency: string;
}

/**
 * Options for profiling
 */
export interface ProfileOptions {
  /** Whether to track token usage */
  trackTokens?: boolean;
  /** Whether to track costs */
  trackCosts?: boolean;
  /** Whether to track memory */
  trackMemory?: boolean;
  /** Whether to generate recommendations */
  generateRecommendations?: boolean;
  /** Model pricing configuration */
  modelPricing?: ModelPricing[];
  /** Latency threshold for bottleneck detection (ms) */
  latencyThresholdMs?: number;
  /** Cost threshold for alerts */
  costThreshold?: number;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_MODEL_PRICING: ModelPricing[] = [
  { modelId: 'claude-3-opus', inputPer1K: 0.015, outputPer1K: 0.075, currency: 'USD' },
  { modelId: 'claude-3-sonnet', inputPer1K: 0.003, outputPer1K: 0.015, currency: 'USD' },
  { modelId: 'claude-3-haiku', inputPer1K: 0.00025, outputPer1K: 0.00125, currency: 'USD' },
  { modelId: 'opus', inputPer1K: 0.015, outputPer1K: 0.075, currency: 'USD' },
  { modelId: 'sonnet', inputPer1K: 0.003, outputPer1K: 0.015, currency: 'USD' },
  { modelId: 'haiku', inputPer1K: 0.00025, outputPer1K: 0.00125, currency: 'USD' },
];

const DEFAULT_OPTIONS: ProfileOptions = {
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
export class PerformanceProfiler {
  private profiles: Map<string, DAGProfile> = new Map();
  private metrics: MetricDataPoint[] = [];
  private options: ProfileOptions;

  constructor(options: Partial<ProfileOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start profiling a DAG execution
   */
  startProfile(dagId: string, dagName?: string): DAGProfile {
    const profile: DAGProfile = {
      profileId: this.generateId('profile'),
      dagId,
      dagName,
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
  }

  /**
   * Record an operation profile
   */
  recordOperation(
    profileId: string,
    operation: Omit<OperationProfile, 'customMetrics'> & {
      customMetrics?: Record<string, number>;
    }
  ): void {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    const fullOperation: OperationProfile = {
      ...operation,
      customMetrics: operation.customMetrics || {},
    };

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
  }

  /**
   * Record a failed operation
   */
  recordFailure(profileId: string, operationName: string, nodeId?: string): void {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    profile.nodesFailed++;

    this.recordMetric({
      timestamp: new Date(),
      name: 'operation.failure',
      value: 1,
      unit: 'count',
      category: 'custom',
      nodeId,
      tags: { operation: operationName },
    });
  }

  /**
   * End profiling and generate analysis
   */
  endProfile(profileId: string): DAGProfile | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) return undefined;

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
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: MetricDataPoint): void {
    this.metrics.push(metric);
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(
    tokens: TokenMetrics,
    model: string
  ): CostMetrics {
    const pricing = this.options.modelPricing?.find((p) =>
      model.toLowerCase().includes(p.modelId.toLowerCase())
    );

    if (!pricing) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD',
        model,
      };
    }

    const inputCost = (tokens.inputTokens / 1000) * pricing.inputPer1K;
    const outputCost = (tokens.outputTokens / 1000) * pricing.outputPer1K;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: pricing.currency,
      model,
    };
  }

  /**
   * Get statistics for a metric
   */
  getMetricStats(
    metricName: string,
    filters?: { nodeId?: string; tags?: Record<string, string> }
  ): MetricStats | undefined {
    let dataPoints = this.metrics.filter((m) => m.name === metricName);

    if (filters?.nodeId) {
      dataPoints = dataPoints.filter((m) => m.nodeId === filters.nodeId);
    }

    if (filters?.tags) {
      dataPoints = dataPoints.filter((m) =>
        Object.entries(filters.tags!).every(([k, v]) => m.tags[k] === v)
      );
    }

    if (dataPoints.length === 0) return undefined;

    const values = dataPoints.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    // Standard deviation
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    // Percentiles
    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * values.length) - 1;
      return values[Math.max(0, index)];
    };

    return {
      name: metricName,
      count: values.length,
      sum,
      mean,
      min: values[0],
      max: values[values.length - 1],
      stdDev,
      percentiles: {
        p50: percentile(50),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99),
      },
      timeSeries: dataPoints.map((m) => ({ timestamp: m.timestamp, value: m.value })),
    };
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): DAGProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): DAGProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Compare two profiles
   */
  compareProfiles(
    profileId1: string,
    profileId2: string
  ): ProfileComparison | undefined {
    const p1 = this.profiles.get(profileId1);
    const p2 = this.profiles.get(profileId2);

    if (!p1 || !p2) return undefined;

    return {
      profile1: profileId1,
      profile2: profileId2,
      latencyDiff: {
        absolute: (p1.totalDurationMs || 0) - (p2.totalDurationMs || 0),
        percentage: this.percentDiff(
          p1.totalDurationMs || 0,
          p2.totalDurationMs || 0
        ),
      },
      tokensDiff: {
        absolute: p1.totalTokens.totalTokens - p2.totalTokens.totalTokens,
        percentage: this.percentDiff(
          p1.totalTokens.totalTokens,
          p2.totalTokens.totalTokens
        ),
      },
      costDiff: {
        absolute: p1.totalCost.totalCost - p2.totalCost.totalCost,
        percentage: this.percentDiff(
          p1.totalCost.totalCost,
          p2.totalCost.totalCost
        ),
      },
      summary: this.generateComparisonSummary(p1, p2),
    };
  }

  /**
   * Export metrics to various formats
   */
  exportMetrics(format: 'json' | 'csv' | 'prometheus' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    }

    if (format === 'csv') {
      const headers = ['timestamp', 'name', 'value', 'unit', 'category', 'nodeId', 'tags'];
      const rows = this.metrics.map((m) => [
        m.timestamp.toISOString(),
        m.name,
        m.value,
        m.unit,
        m.category,
        m.nodeId || '',
        JSON.stringify(m.tags),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    // Prometheus format
    const lines: string[] = [];
    const grouped = this.groupMetricsByName();

    for (const [name, dataPoints] of grouped) {
      const sanitizedName = name.replace(/\./g, '_');
      lines.push(`# HELP ${sanitizedName} ${name}`);
      lines.push(`# TYPE ${sanitizedName} gauge`);

      for (const dp of dataPoints) {
        const labels = Object.entries(dp.tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        const labelStr = labels ? `{${labels}}` : '';
        lines.push(`${sanitizedName}${labelStr} ${dp.value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(maxAgeMs: number): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const initialCount = this.metrics.length;
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
    return initialCount - this.metrics.length;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateParallelizationEfficiency(profile: DAGProfile): number {
    if (profile.operations.length === 0) return 1;

    // Sum of all operation latencies
    const totalOperationTime = profile.operations.reduce(
      (sum, op) => sum + op.latency.totalMs,
      0
    );

    // If perfect parallelization, total time would be the longest single operation
    const longestOperation = Math.max(
      ...profile.operations.map((op) => op.latency.totalMs)
    );

    // Actual time vs sum of all operations
    if (!profile.totalDurationMs) return 1;

    // Efficiency = theoretical_best / actual
    // If all operations ran sequentially, efficiency would be totalDurationMs / totalOperationTime
    // If perfectly parallel, totalDurationMs would equal longestOperation

    // Normalize: 1 = perfect parallelization, 0 = fully sequential
    const maxPossibleSaving = totalOperationTime - longestOperation;
    const actualSaving = totalOperationTime - profile.totalDurationMs;

    if (maxPossibleSaving === 0) return 1;
    return Math.max(0, Math.min(1, actualSaving / maxPossibleSaving));
  }

  private analyzeBottlenecks(profile: DAGProfile): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    const threshold = this.options.latencyThresholdMs || 5000;

    // Latency bottlenecks
    const slowOperations = profile.operations.filter(
      (op) => op.latency.totalMs > threshold
    );

    if (slowOperations.length > 0) {
      bottlenecks.push({
        type: 'latency',
        severity: Math.min(
          1,
          slowOperations.length / profile.operations.length
        ),
        description: `${slowOperations.length} operation(s) exceeded ${threshold}ms latency threshold`,
        affectedOperations: slowOperations.map((op) => op.operationName),
        potentialSavingsMs: slowOperations.reduce(
          (sum, op) => sum + (op.latency.totalMs - threshold),
          0
        ),
      });
    }

    // Sequential bottleneck (low parallelization)
    if (
      profile.parallelizationEfficiency !== undefined &&
      profile.parallelizationEfficiency < 0.5
    ) {
      bottlenecks.push({
        type: 'sequential',
        severity: 1 - profile.parallelizationEfficiency,
        description: `Low parallelization efficiency (${(profile.parallelizationEfficiency * 100).toFixed(1)}%)`,
        affectedOperations: profile.operations.map((op) => op.operationName),
        potentialSavingsMs: this.estimateParallelSavings(profile),
      });
    }

    // Retry bottleneck
    if (profile.totalRetries > profile.nodesExecuted * 0.1) {
      const retryOperations = profile.operations
        .filter((op) => op.retryCount > 0)
        .map((op) => op.operationName);

      bottlenecks.push({
        type: 'retry',
        severity: Math.min(1, profile.totalRetries / profile.nodesExecuted),
        description: `High retry rate: ${profile.totalRetries} retries across ${retryOperations.length} operations`,
        affectedOperations: retryOperations,
      });
    }

    // Cost bottleneck
    if (
      this.options.costThreshold &&
      profile.totalCost.totalCost > this.options.costThreshold
    ) {
      const expensiveOps = profile.operations
        .filter((op) => op.cost && op.cost.totalCost > 0.1)
        .sort((a, b) => (b.cost?.totalCost || 0) - (a.cost?.totalCost || 0))
        .slice(0, 5);

      bottlenecks.push({
        type: 'cost',
        severity: Math.min(
          1,
          profile.totalCost.totalCost / this.options.costThreshold
        ),
        description: `Total cost ($${profile.totalCost.totalCost.toFixed(4)}) exceeds threshold`,
        affectedOperations: expensiveOps.map((op) => op.operationName),
        potentialSavingsCost: this.estimateCostSavings(profile, expensiveOps),
      });
    }

    // Token bottleneck
    const avgTokensPerOp =
      profile.totalTokens.totalTokens / profile.nodesExecuted;
    if (avgTokensPerOp > 10000) {
      const tokenHeavyOps = profile.operations
        .filter((op) => op.tokens && op.tokens.totalTokens > 10000)
        .map((op) => op.operationName);

      bottlenecks.push({
        type: 'tokens',
        severity: Math.min(1, avgTokensPerOp / 50000),
        description: `High average token usage: ${avgTokensPerOp.toFixed(0)} tokens/operation`,
        affectedOperations: tokenHeavyOps,
      });
    }

    return bottlenecks.sort((a, b) => b.severity - a.severity);
  }

  private generateRecommendations(profile: DAGProfile): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Based on bottlenecks
    for (const bottleneck of profile.bottlenecks) {
      switch (bottleneck.type) {
        case 'latency':
          recommendations.push({
            category: 'latency',
            priority: bottleneck.severity > 0.7 ? 'high' : 'medium',
            title: 'Reduce operation latency',
            description: `${bottleneck.affectedOperations.length} operations are slow`,
            estimatedImpact: `Potential savings: ${bottleneck.potentialSavingsMs}ms`,
            action:
              'Consider using faster models (haiku) for simpler tasks or implementing caching',
          });
          break;

        case 'sequential':
          recommendations.push({
            category: 'parallelization',
            priority: 'high',
            title: 'Improve parallelization',
            description:
              'DAG execution is mostly sequential',
            estimatedImpact: `Could save up to ${bottleneck.potentialSavingsMs}ms`,
            action:
              'Review node dependencies and identify operations that can run in parallel',
          });
          break;

        case 'cost':
          recommendations.push({
            category: 'cost',
            priority: bottleneck.severity > 0.7 ? 'high' : 'medium',
            title: 'Reduce execution cost',
            description: `Total cost exceeds threshold`,
            estimatedImpact: `Potential savings: $${bottleneck.potentialSavingsCost?.toFixed(4)}`,
            action:
              'Use smaller models where possible, reduce context size, or implement caching',
          });
          break;

        case 'tokens':
          recommendations.push({
            category: 'tokens',
            priority: 'medium',
            title: 'Optimize token usage',
            description: 'High token consumption detected',
            estimatedImpact: 'Reduced costs and latency',
            action:
              'Summarize context, use selective tool outputs, or implement context windowing',
          });
          break;

        case 'retry':
          recommendations.push({
            category: 'latency',
            priority: 'high',
            title: 'Reduce retry rate',
            description: 'High number of operation retries',
            estimatedImpact: 'Improved reliability and reduced latency',
            action:
              'Investigate failure causes and add validation before expensive operations',
          });
          break;
      }
    }

    // Cache recommendations
    const cacheHits = profile.operations.filter((op) => op.cacheHit).length;
    const cacheRate = cacheHits / profile.operations.length;

    if (cacheRate < 0.1 && profile.operations.length > 5) {
      recommendations.push({
        category: 'caching',
        priority: 'medium',
        title: 'Implement result caching',
        description: `Only ${(cacheRate * 100).toFixed(1)}% cache hit rate`,
        estimatedImpact: 'Could significantly reduce latency and cost',
        action: 'Cache deterministic operations and use content-based cache keys',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private estimateParallelSavings(profile: DAGProfile): number {
    if (!profile.totalDurationMs) return 0;

    const longestOp = Math.max(
      ...profile.operations.map((op) => op.latency.totalMs)
    );

    // Theoretical best case if fully parallelized
    return profile.totalDurationMs - longestOp;
  }

  private estimateCostSavings(
    profile: DAGProfile,
    expensiveOps: OperationProfile[]
  ): number {
    // Estimate savings if expensive ops used cheaper models
    let savings = 0;

    for (const op of expensiveOps) {
      if (op.cost && op.tokens) {
        // Estimate cost if using haiku instead
        const haikuCost = this.calculateCost(op.tokens, 'haiku');
        savings += op.cost.totalCost - haikuCost.totalCost;
      }
    }

    return Math.max(0, savings);
  }

  private percentDiff(a: number, b: number): number {
    if (b === 0) return a === 0 ? 0 : 100;
    return ((a - b) / b) * 100;
  }

  private generateComparisonSummary(p1: DAGProfile, p2: DAGProfile): string {
    const parts: string[] = [];

    const latencyDiff = (p1.totalDurationMs || 0) - (p2.totalDurationMs || 0);
    if (latencyDiff > 0) {
      parts.push(`Profile 1 is ${latencyDiff}ms slower`);
    } else if (latencyDiff < 0) {
      parts.push(`Profile 1 is ${Math.abs(latencyDiff)}ms faster`);
    } else {
      parts.push('Same latency');
    }

    const costDiff = p1.totalCost.totalCost - p2.totalCost.totalCost;
    if (Math.abs(costDiff) > 0.001) {
      parts.push(
        costDiff > 0
          ? `$${costDiff.toFixed(4)} more expensive`
          : `$${Math.abs(costDiff).toFixed(4)} cheaper`
      );
    }

    return parts.join(', ');
  }

  private groupMetricsByName(): Map<string, MetricDataPoint[]> {
    const grouped = new Map<string, MetricDataPoint[]>();

    for (const metric of this.metrics) {
      const existing = grouped.get(metric.name) || [];
      existing.push(metric);
      grouped.set(metric.name, existing);
    }

    return grouped;
  }
}

/**
 * Profile comparison result
 */
export interface ProfileComparison {
  profile1: string;
  profile2: string;
  latencyDiff: { absolute: number; percentage: number };
  tokensDiff: { absolute: number; percentage: number };
  costDiff: { absolute: number; percentage: number };
  summary: string;
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global performance profiler instance
 */
export const performanceProfiler = new PerformanceProfiler();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Start profiling a DAG execution
 */
export function startProfiling(dagId: string, dagName?: string): DAGProfile {
  return performanceProfiler.startProfile(dagId, dagName);
}

/**
 * Record an operation in a profile
 */
export function recordOperation(
  profileId: string,
  operation: Omit<OperationProfile, 'customMetrics'> & {
    customMetrics?: Record<string, number>;
  }
): void {
  performanceProfiler.recordOperation(profileId, operation);
}

/**
 * End profiling and get analysis
 */
export function endProfiling(profileId: string): DAGProfile | undefined {
  return performanceProfiler.endProfile(profileId);
}

/**
 * Calculate cost for tokens
 */
export function calculateTokenCost(tokens: TokenMetrics, model: string): CostMetrics {
  return performanceProfiler.calculateCost(tokens, model);
}

/**
 * Get metric statistics
 */
export function getMetricStatistics(
  metricName: string,
  filters?: { nodeId?: string; tags?: Record<string, string> }
): MetricStats | undefined {
  return performanceProfiler.getMetricStats(metricName, filters);
}

/**
 * Compare two profiles
 */
export function compareProfiles(
  profileId1: string,
  profileId2: string
): ProfileComparison | undefined {
  return performanceProfiler.compareProfiles(profileId1, profileId2);
}

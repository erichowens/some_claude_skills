/**
 * Failure Analyzer
 *
 * Provides root cause analysis for DAG execution failures, categorizing
 * errors, identifying patterns, and suggesting remediation strategies.
 *
 * @module dag/observability/failure-analyzer
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Categories of failure root causes
 */
export type FailureCategory =
  | 'input'         // Bad input data
  | 'skill'         // Skill execution issue
  | 'agent'         // Agent spawning/execution issue
  | 'tool'          // Tool/MCP call failure
  | 'permission'    // Permission denied
  | 'timeout'       // Operation timed out
  | 'rate-limit'    // API rate limiting
  | 'resource'      // Resource exhaustion
  | 'dependency'    // Dependency failure
  | 'validation'    // Output validation failure
  | 'network'       // Network/connectivity issue
  | 'configuration' // Configuration error
  | 'unknown';      // Unknown cause

/**
 * Severity of the failure
 */
export type FailureSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * A recorded failure event
 */
export interface FailureEvent {
  /** Unique failure ID */
  failureId: string;
  /** Timestamp */
  timestamp: Date;
  /** DAG ID */
  dagId?: string;
  /** Node ID that failed */
  nodeId?: string;
  /** Operation name */
  operationName: string;
  /** Skill ID if applicable */
  skillId?: string;
  /** Error type/class */
  errorType: string;
  /** Error message */
  errorMessage: string;
  /** Stack trace if available */
  stackTrace?: string;
  /** Input that caused the failure */
  input?: unknown;
  /** Attempt number */
  attemptNumber: number;
  /** Whether the operation was retried */
  wasRetried: boolean;
  /** Whether the retry succeeded */
  retrySucceeded?: boolean;
  /** Additional context */
  context: Record<string, unknown>;
}

/**
 * Root cause analysis result
 */
export interface RootCauseAnalysis {
  /** Primary failure category */
  category: FailureCategory;
  /** Confidence in this analysis (0-1) */
  confidence: number;
  /** Severity assessment */
  severity: FailureSeverity;
  /** Root cause description */
  description: string;
  /** Evidence supporting this analysis */
  evidence: string[];
  /** Contributing factors */
  contributingFactors: ContributingFactor[];
  /** Suggested remediation steps */
  remediations: Remediation[];
  /** Related failures (may indicate pattern) */
  relatedFailures: string[];
  /** Is this a recurring issue? */
  isRecurring: boolean;
  /** Recurrence count if recurring */
  recurrenceCount?: number;
}

/**
 * A factor contributing to the failure
 */
export interface ContributingFactor {
  /** Factor type */
  type: string;
  /** Description */
  description: string;
  /** How much this contributed (0-1) */
  weight: number;
}

/**
 * Remediation suggestion
 */
export interface Remediation {
  /** Remediation type */
  type: 'immediate' | 'short-term' | 'long-term';
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Action to take */
  action: string;
  /** Detailed steps */
  steps: string[];
  /** Expected impact */
  expectedImpact: string;
  /** Auto-fixable? */
  autoFixable: boolean;
}

/**
 * Failure pattern
 */
export interface FailurePattern {
  /** Pattern ID */
  patternId: string;
  /** Pattern name */
  name: string;
  /** Description */
  description: string;
  /** Failure category */
  category: FailureCategory;
  /** Matching criteria */
  matchers: PatternMatcher[];
  /** Count of matches */
  matchCount: number;
  /** First seen */
  firstSeen: Date;
  /** Last seen */
  lastSeen: Date;
  /** Affected operations */
  affectedOperations: string[];
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * Pattern matching criteria
 */
export interface PatternMatcher {
  /** Field to match */
  field: 'errorType' | 'errorMessage' | 'operationName' | 'skillId' | 'context';
  /** Match type */
  matchType: 'exact' | 'contains' | 'regex' | 'startsWith';
  /** Value to match */
  value: string;
}

/**
 * Failure analysis report
 */
export interface FailureReport {
  /** Report ID */
  reportId: string;
  /** Generated at */
  generatedAt: Date;
  /** Time range covered */
  timeRange: { start: Date; end: Date };
  /** Total failures */
  totalFailures: number;
  /** Failures by category */
  byCategory: Record<FailureCategory, number>;
  /** Failures by severity */
  bySeverity: Record<FailureSeverity, number>;
  /** Top failing operations */
  topFailingOperations: Array<{ operation: string; count: number; rate: number }>;
  /** Identified patterns */
  patterns: FailurePattern[];
  /** Trending issues */
  trending: Array<{ pattern: string; trend: 'increasing' | 'decreasing' | 'stable' }>;
  /** Recommendations */
  recommendations: Remediation[];
}

/**
 * Options for failure analysis
 */
export interface AnalysisOptions {
  /** Include stack trace analysis */
  analyzeStackTrace?: boolean;
  /** Look for patterns */
  detectPatterns?: boolean;
  /** Maximum related failures to find */
  maxRelatedFailures?: number;
  /** Minimum confidence for pattern detection */
  minPatternConfidence?: number;
  /** Time window for pattern detection (ms) */
  patternTimeWindowMs?: number;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_OPTIONS: AnalysisOptions = {
  analyzeStackTrace: true,
  detectPatterns: true,
  maxRelatedFailures: 10,
  minPatternConfidence: 0.6,
  patternTimeWindowMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Common error patterns and their categories
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  category: FailureCategory;
  severity: FailureSeverity;
  description: string;
}> = [
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
export class FailureAnalyzer {
  private failures: Map<string, FailureEvent> = new Map();
  private patterns: Map<string, FailurePattern> = new Map();
  private options: AnalysisOptions;

  constructor(options: Partial<AnalysisOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Record a failure event
   */
  recordFailure(
    failure: Omit<FailureEvent, 'failureId' | 'timestamp'>
  ): FailureEvent {
    const event: FailureEvent = {
      ...failure,
      failureId: this.generateId('fail'),
      timestamp: new Date(),
    };

    this.failures.set(event.failureId, event);

    // Update patterns if enabled
    if (this.options.detectPatterns) {
      this.updatePatterns(event);
    }

    return event;
  }

  /**
   * Analyze a specific failure
   */
  analyze(failureId: string, options?: Partial<AnalysisOptions>): RootCauseAnalysis | undefined {
    const failure = this.failures.get(failureId);
    if (!failure) return undefined;

    const opts = { ...this.options, ...options };
    return this.performAnalysis(failure, opts);
  }

  /**
   * Analyze a failure event directly
   */
  analyzeEvent(
    failure: FailureEvent,
    options?: Partial<AnalysisOptions>
  ): RootCauseAnalysis {
    const opts = { ...this.options, ...options };
    return this.performAnalysis(failure, opts);
  }

  /**
   * Get failure by ID
   */
  getFailure(failureId: string): FailureEvent | undefined {
    return this.failures.get(failureId);
  }

  /**
   * Find similar failures
   */
  findSimilar(failureId: string, maxResults: number = 10): FailureEvent[] {
    const failure = this.failures.get(failureId);
    if (!failure) return [];

    return this.findRelatedFailures(failure, maxResults);
  }

  /**
   * Get all detected patterns
   */
  getPatterns(): FailurePattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get pattern by ID
   */
  getPattern(patternId: string): FailurePattern | undefined {
    return this.patterns.get(patternId);
  }

  /**
   * Generate a failure report
   */
  generateReport(
    timeRange?: { start: Date; end: Date }
  ): FailureReport {
    const now = new Date();
    const effectiveRange = timeRange || {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days
      end: now,
    };

    // Filter failures in time range
    const failuresInRange = Array.from(this.failures.values()).filter(
      (f) => f.timestamp >= effectiveRange.start && f.timestamp <= effectiveRange.end
    );

    // Count by category
    const byCategory = {} as Record<FailureCategory, number>;
    for (const failure of failuresInRange) {
      const category = this.categorize(failure).category;
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    // Count by severity
    const bySeverity = {} as Record<FailureSeverity, number>;
    for (const failure of failuresInRange) {
      const severity = this.assessSeverity(failure);
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    }

    // Top failing operations
    const opCounts = new Map<string, { count: number; total: number }>();
    for (const failure of failuresInRange) {
      const existing = opCounts.get(failure.operationName) || { count: 0, total: 0 };
      existing.count++;
      existing.total++;
      opCounts.set(failure.operationName, existing);
    }

    const topFailingOperations = Array.from(opCounts.entries())
      .map(([operation, { count, total }]) => ({
        operation,
        count,
        rate: total > 0 ? count / total : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get patterns
    const patterns = Array.from(this.patterns.values()).filter(
      (p) => p.lastSeen >= effectiveRange.start && p.lastSeen <= effectiveRange.end
    );

    // Trending analysis
    const trending = this.analyzeTrending(patterns, effectiveRange);

    // Generate recommendations
    const recommendations = this.generateReportRecommendations(
      byCategory,
      bySeverity,
      patterns
    );

    return {
      reportId: this.generateId('report'),
      generatedAt: now,
      timeRange: effectiveRange,
      totalFailures: failuresInRange.length,
      byCategory,
      bySeverity,
      topFailingOperations,
      patterns,
      trending,
      recommendations,
    };
  }

  /**
   * Clear old failures
   */
  clearOldFailures(maxAgeMs: number): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    let cleared = 0;

    for (const [id, failure] of this.failures) {
      if (failure.timestamp < cutoff) {
        this.failures.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private performAnalysis(
    failure: FailureEvent,
    options: AnalysisOptions
  ): RootCauseAnalysis {
    // Categorize the failure
    const { category, confidence: catConfidence } = this.categorize(failure);

    // Assess severity
    const severity = this.assessSeverity(failure);

    // Find evidence
    const evidence = this.gatherEvidence(failure, options);

    // Identify contributing factors
    const contributingFactors = this.identifyContributingFactors(failure);

    // Generate remediations
    const remediations = this.generateRemediations(failure, category, severity);

    // Find related failures
    const relatedFailures = options.maxRelatedFailures
      ? this.findRelatedFailures(failure, options.maxRelatedFailures).map(
          (f) => f.failureId
        )
      : [];

    // Check for recurrence
    const { isRecurring, recurrenceCount } = this.checkRecurrence(failure);

    // Build description
    const description = this.buildDescription(failure, category, contributingFactors);

    return {
      category,
      confidence: catConfidence,
      severity,
      description,
      evidence,
      contributingFactors,
      remediations,
      relatedFailures,
      isRecurring,
      recurrenceCount,
    };
  }

  private categorize(failure: FailureEvent): { category: FailureCategory; confidence: number } {
    // Check against known error patterns
    for (const pattern of ERROR_PATTERNS) {
      if (
        pattern.pattern.test(failure.errorMessage) ||
        pattern.pattern.test(failure.errorType)
      ) {
        return { category: pattern.category, confidence: 0.9 };
      }
    }

    // Check stack trace
    if (failure.stackTrace) {
      for (const pattern of ERROR_PATTERNS) {
        if (pattern.pattern.test(failure.stackTrace)) {
          return { category: pattern.category, confidence: 0.7 };
        }
      }
    }

    // Check context
    if (failure.context) {
      const contextStr = JSON.stringify(failure.context);
      for (const pattern of ERROR_PATTERNS) {
        if (pattern.pattern.test(contextStr)) {
          return { category: pattern.category, confidence: 0.6 };
        }
      }
    }

    // Default
    return { category: 'unknown', confidence: 0.3 };
  }

  private assessSeverity(failure: FailureEvent): FailureSeverity {
    // Check against known patterns
    for (const pattern of ERROR_PATTERNS) {
      if (
        pattern.pattern.test(failure.errorMessage) ||
        pattern.pattern.test(failure.errorType)
      ) {
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
    const critical = /critical|fatal|crash|corrupt/i;
    if (critical.test(failure.errorMessage) || critical.test(failure.errorType)) {
      return 'critical';
    }

    return 'medium';
  }

  private gatherEvidence(failure: FailureEvent, options: AnalysisOptions): string[] {
    const evidence: string[] = [];

    evidence.push(`Error type: ${failure.errorType}`);
    evidence.push(`Error message: ${failure.errorMessage}`);
    evidence.push(`Operation: ${failure.operationName}`);

    if (failure.attemptNumber > 1) {
      evidence.push(`Failed on attempt ${failure.attemptNumber}`);
    }

    if (failure.wasRetried) {
      evidence.push(
        failure.retrySucceeded
          ? 'Retry succeeded'
          : 'Retry also failed'
      );
    }

    if (options.analyzeStackTrace && failure.stackTrace) {
      // Extract key frames from stack trace
      const frames = failure.stackTrace
        .split('\n')
        .filter((line) => line.includes('at '))
        .slice(0, 5);
      if (frames.length > 0) {
        evidence.push(`Stack: ${frames[0].trim()}`);
      }
    }

    if (failure.skillId) {
      evidence.push(`Skill: ${failure.skillId}`);
    }

    if (failure.nodeId) {
      evidence.push(`Node: ${failure.nodeId}`);
    }

    return evidence;
  }

  private identifyContributingFactors(failure: FailureEvent): ContributingFactor[] {
    const factors: ContributingFactor[] = [];

    // Input-related
    if (failure.input) {
      const inputStr = JSON.stringify(failure.input);
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
        description: `Failed ${failure.attemptNumber} times`,
        weight: 0.4,
      });
    }

    // Context-related
    if (failure.context) {
      if (failure.context['tokenCount'] && (failure.context['tokenCount'] as number) > 50000) {
        factors.push({
          type: 'high_token_usage',
          description: 'High token count in context',
          weight: 0.3,
        });
      }

      if (failure.context['latencyMs'] && (failure.context['latencyMs'] as number) > 30000) {
        factors.push({
          type: 'slow_operation',
          description: 'Operation was taking too long',
          weight: 0.2,
        });
      }
    }

    // Time-based (late night might indicate batch job issues)
    const hour = failure.timestamp.getHours();
    if (hour >= 0 && hour < 6) {
      factors.push({
        type: 'off_hours',
        description: 'Occurred during off-peak hours',
        weight: 0.1,
      });
    }

    return factors.sort((a, b) => b.weight - a.weight);
  }

  private generateRemediations(
    failure: FailureEvent,
    category: FailureCategory,
    severity: FailureSeverity
  ): Remediation[] {
    const remediations: Remediation[] = [];

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
  }

  private findRelatedFailures(failure: FailureEvent, maxResults: number): FailureEvent[] {
    const related: Array<{ failure: FailureEvent; score: number }> = [];

    for (const [id, other] of this.failures) {
      if (id === failure.failureId) continue;

      let score = 0;

      // Same operation
      if (other.operationName === failure.operationName) score += 0.3;

      // Same error type
      if (other.errorType === failure.errorType) score += 0.3;

      // Similar error message
      if (this.similarMessages(other.errorMessage, failure.errorMessage)) score += 0.2;

      // Same skill
      if (other.skillId && other.skillId === failure.skillId) score += 0.1;

      // Same DAG
      if (other.dagId && other.dagId === failure.dagId) score += 0.1;

      if (score > 0.3) {
        related.push({ failure: other, score });
      }
    }

    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((r) => r.failure);
  }

  private similarMessages(msg1: string, msg2: string): boolean {
    // Simple similarity check
    const words1 = new Set(msg1.toLowerCase().split(/\s+/));
    const words2 = new Set(msg2.toLowerCase().split(/\s+/));

    let overlap = 0;
    for (const word of words1) {
      if (words2.has(word)) overlap++;
    }

    const union = words1.size + words2.size - overlap;
    return union > 0 && overlap / union > 0.5;
  }

  private checkRecurrence(failure: FailureEvent): { isRecurring: boolean; recurrenceCount?: number } {
    const windowMs = this.options.patternTimeWindowMs || 24 * 60 * 60 * 1000;
    const cutoff = new Date(failure.timestamp.getTime() - windowMs);

    let count = 0;
    for (const other of this.failures.values()) {
      if (
        other.failureId !== failure.failureId &&
        other.timestamp >= cutoff &&
        other.operationName === failure.operationName &&
        other.errorType === failure.errorType
      ) {
        count++;
      }
    }

    return {
      isRecurring: count >= 2,
      recurrenceCount: count > 0 ? count : undefined,
    };
  }

  private buildDescription(
    failure: FailureEvent,
    category: FailureCategory,
    factors: ContributingFactor[]
  ): string {
    const parts: string[] = [];

    // Category description
    const categoryDesc = ERROR_PATTERNS.find((p) => p.category === category)?.description;
    if (categoryDesc) {
      parts.push(categoryDesc);
    } else {
      parts.push(`${category} failure`);
    }

    parts.push(`in operation "${failure.operationName}"`);

    if (factors.length > 0) {
      const topFactor = factors[0];
      parts.push(`(${topFactor.description})`);
    }

    return parts.join(' ');
  }

  private updatePatterns(failure: FailureEvent): void {
    // Check existing patterns
    for (const [patternId, pattern] of this.patterns) {
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
    const similar = this.findRelatedFailures(failure, 5);
    if (similar.length >= 2) {
      // Found potential pattern
      const pattern: FailurePattern = {
        patternId: this.generateId('pattern'),
        name: `${failure.errorType} in ${failure.operationName}`,
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
        firstSeen: similar.reduce(
          (earliest, f) => (f.timestamp < earliest ? f.timestamp : earliest),
          failure.timestamp
        ),
        lastSeen: failure.timestamp,
        affectedOperations: [
          ...new Set([failure.operationName, ...similar.map((f) => f.operationName)]),
        ],
      };

      this.patterns.set(pattern.patternId, pattern);
    }
  }

  private matchesPattern(failure: FailureEvent, pattern: FailurePattern): boolean {
    for (const matcher of pattern.matchers) {
      const value = failure[matcher.field as keyof FailureEvent];
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);

      switch (matcher.matchType) {
        case 'exact':
          if (strValue !== matcher.value) return false;
          break;
        case 'contains':
          if (!strValue.includes(matcher.value)) return false;
          break;
        case 'startsWith':
          if (!strValue.startsWith(matcher.value)) return false;
          break;
        case 'regex':
          if (!new RegExp(matcher.value).test(strValue)) return false;
          break;
      }
    }
    return true;
  }

  private analyzeTrending(
    patterns: FailurePattern[],
    timeRange: { start: Date; end: Date }
  ): Array<{ pattern: string; trend: 'increasing' | 'decreasing' | 'stable' }> {
    const trending: Array<{ pattern: string; trend: 'increasing' | 'decreasing' | 'stable' }> = [];

    const midpoint = new Date(
      (timeRange.start.getTime() + timeRange.end.getTime()) / 2
    );

    for (const pattern of patterns) {
      // Count failures in first half vs second half
      let firstHalf = 0;
      let secondHalf = 0;

      for (const failure of this.failures.values()) {
        if (this.matchesPattern(failure, pattern)) {
          if (failure.timestamp < midpoint) firstHalf++;
          else secondHalf++;
        }
      }

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (secondHalf > firstHalf * 1.5) {
        trend = 'increasing';
      } else if (secondHalf < firstHalf * 0.5) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      trending.push({ pattern: pattern.name, trend });
    }

    return trending.filter((t) => t.trend !== 'stable');
  }

  private generateReportRecommendations(
    byCategory: Record<FailureCategory, number>,
    bySeverity: Record<FailureSeverity, number>,
    patterns: FailurePattern[]
  ): Remediation[] {
    const recommendations: Remediation[] = [];

    // Based on top categories
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [category] of topCategories) {
      if (category === 'rate-limit') {
        recommendations.push({
          type: 'short-term',
          priority: 'high',
          action: 'Implement request throttling',
          steps: ['Add rate limiting', 'Use request queuing', 'Implement backoff'],
          expectedImpact: `Reduce ${category} failures`,
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
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global failure analyzer instance
 */
export const failureAnalyzer = new FailureAnalyzer();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Record a failure event
 */
export function recordFailure(
  failure: Omit<FailureEvent, 'failureId' | 'timestamp'>
): FailureEvent {
  return failureAnalyzer.recordFailure(failure);
}

/**
 * Analyze a failure
 */
export function analyzeFailure(
  failureId: string,
  options?: Partial<AnalysisOptions>
): RootCauseAnalysis | undefined {
  return failureAnalyzer.analyze(failureId, options);
}

/**
 * Find similar failures
 */
export function findSimilarFailures(
  failureId: string,
  maxResults?: number
): FailureEvent[] {
  return failureAnalyzer.findSimilar(failureId, maxResults);
}

/**
 * Generate failure report
 */
export function generateFailureReport(
  timeRange?: { start: Date; end: Date }
): FailureReport {
  return failureAnalyzer.generateReport(timeRange);
}

/**
 * Get detected failure patterns
 */
export function getFailurePatterns(): FailurePattern[] {
  return failureAnalyzer.getPatterns();
}

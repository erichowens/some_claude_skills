/**
 * Iteration Detector
 *
 * Identifies when a task output requires iteration or refinement.
 * Determines if the result meets quality thresholds or needs another pass.
 *
 * @module dag/feedback/iteration-detector
 */

import { type ConfidenceScore, type ConfidenceLevel } from '../quality/confidence-scorer';
import { type ValidationResult } from '../quality/output-validator';
import { type DetectionResult as HallucinationResult } from '../quality/hallucination-detector';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Reasons why iteration might be needed
 */
export type IterationReason =
  | 'low-confidence'           // Confidence below threshold
  | 'validation-failed'        // Output validation failed
  | 'hallucination-risk'       // High hallucination risk
  | 'incomplete-output'        // Output is incomplete
  | 'quality-threshold'        // Below quality threshold
  | 'user-feedback'           // User indicated need for revision
  | 'dependency-changed'       // Upstream dependency changed
  | 'partial-success'         // Some parts succeeded, others didn't
  | 'timeout-partial'         // Timed out with partial results
  | 'error-recoverable'       // Recoverable error occurred
  | 'custom';                 // Custom iteration trigger

/**
 * Iteration decision
 */
export type IterationDecision = 'iterate' | 'accept' | 'reject' | 'escalate';

/**
 * Complete iteration analysis
 */
export interface IterationAnalysis {
  /** Should we iterate? */
  decision: IterationDecision;

  /** Primary reason for the decision */
  primaryReason: IterationReason | null;

  /** All factors contributing to decision */
  factors: IterationFactor[];

  /** Confidence in the decision (0-1) */
  decisionConfidence: number;

  /** Recommended iteration strategy */
  strategy?: IterationStrategy;

  /** Maximum iterations recommended */
  maxIterations: number;

  /** Current iteration count */
  currentIteration: number;

  /** Should we try a different approach? */
  shouldPivot: boolean;

  /** Human-readable explanation */
  explanation: string;

  /** Analysis timestamp */
  analyzedAt: Date;
}

/**
 * A single factor contributing to iteration decision
 */
export interface IterationFactor {
  /** Factor name */
  name: string;

  /** Factor type/reason */
  reason: IterationReason;

  /** Weight of this factor (0-1) */
  weight: number;

  /** Score for this factor (0-1, where 1 = needs iteration) */
  score: number;

  /** Contribution to overall decision */
  contribution: number;

  /** Details about this factor */
  details?: string;
}

/**
 * Strategy for iteration
 */
export interface IterationStrategy {
  /** Type of iteration */
  type: 'refine' | 'retry' | 'expand' | 'simplify' | 'alternate';

  /** Specific focus areas */
  focusAreas: string[];

  /** Changes to make */
  suggestedChanges: string[];

  /** Should we use a different skill? */
  alternateSkill?: string;

  /** Temperature/creativity adjustment */
  creativityAdjustment?: 'increase' | 'decrease' | 'maintain';
}

/**
 * Input for iteration detection
 */
export interface IterationInput {
  /** The output to evaluate */
  output: unknown;

  /** Original input/prompt */
  input?: string;

  /** Quality assessments */
  quality?: {
    confidence?: ConfidenceScore;
    validation?: ValidationResult;
    hallucination?: HallucinationResult;
  };

  /** Current iteration number */
  iteration?: number;

  /** Maximum allowed iterations */
  maxIterations?: number;

  /** Previous iteration outputs (for comparison) */
  previousOutputs?: unknown[];

  /** User feedback if any */
  userFeedback?: UserFeedback;

  /** Custom context */
  context?: Record<string, unknown>;
}

/**
 * User feedback for iteration
 */
export interface UserFeedback {
  /** Feedback type */
  type: 'approve' | 'reject' | 'revise';

  /** Specific issues mentioned */
  issues?: string[];

  /** Specific improvements requested */
  improvements?: string[];

  /** Overall satisfaction (1-5) */
  satisfaction?: number;
}

/**
 * Iteration detection options
 */
export interface DetectionOptions {
  /** Minimum confidence threshold (default: 0.6) */
  confidenceThreshold?: number;

  /** Maximum hallucination risk tolerated (default: 0.4) */
  hallucinationThreshold?: number;

  /** Require validation to pass */
  requireValidation?: boolean;

  /** Custom decision rules */
  customRules?: IterationRule[];

  /** Weight configuration */
  weights?: Partial<IterationWeights>;
}

/**
 * Custom iteration rule
 */
export interface IterationRule {
  /** Rule name */
  name: string;

  /** Condition function */
  condition: (input: IterationInput) => boolean;

  /** Reason if triggered */
  reason: IterationReason;

  /** Weight for this rule */
  weight: number;
}

/**
 * Weights for different factors
 */
export interface IterationWeights {
  confidence: number;
  validation: number;
  hallucination: number;
  completeness: number;
  userFeedback: number;
  improvement: number;
}

// =============================================================================
// ITERATION DETECTOR CLASS
// =============================================================================

/**
 * IterationDetector determines when outputs need refinement.
 *
 * @example
 * ```typescript
 * const detector = new IterationDetector();
 *
 * const analysis = detector.analyze({
 *   output: agentResult,
 *   input: originalPrompt,
 *   quality: {
 *     confidence: confidenceScore,
 *     validation: validationResult,
 *   },
 *   iteration: 1,
 * });
 *
 * if (analysis.decision === 'iterate') {
 *   console.log('Needs iteration:', analysis.explanation);
 *   console.log('Strategy:', analysis.strategy);
 * }
 * ```
 */
export class IterationDetector {
  private readonly defaultWeights: IterationWeights = {
    confidence: 0.25,
    validation: 0.25,
    hallucination: 0.20,
    completeness: 0.15,
    userFeedback: 0.10,
    improvement: 0.05,
  };

  private customRules: IterationRule[] = [];

  /**
   * Register a custom iteration rule
   */
  registerRule(rule: IterationRule): void {
    this.customRules.push(rule);
  }

  /**
   * Analyze whether iteration is needed
   */
  analyze(input: IterationInput, options: DetectionOptions = {}): IterationAnalysis {
    const weights = { ...this.defaultWeights, ...options.weights };
    const factors: IterationFactor[] = [];

    // Configuration
    const confidenceThreshold = options.confidenceThreshold ?? 0.6;
    const hallucinationThreshold = options.hallucinationThreshold ?? 0.4;
    const maxIterations = input.maxIterations ?? 3;
    const currentIteration = input.iteration ?? 1;

    // Analyze confidence
    if (input.quality?.confidence) {
      const confidenceFactor = this.analyzeConfidence(
        input.quality.confidence,
        confidenceThreshold,
        weights.confidence
      );
      factors.push(confidenceFactor);
    }

    // Analyze validation
    if (input.quality?.validation) {
      const validationFactor = this.analyzeValidation(
        input.quality.validation,
        options.requireValidation ?? false,
        weights.validation
      );
      factors.push(validationFactor);
    }

    // Analyze hallucination risk
    if (input.quality?.hallucination) {
      const hallucinationFactor = this.analyzeHallucination(
        input.quality.hallucination,
        hallucinationThreshold,
        weights.hallucination
      );
      factors.push(hallucinationFactor);
    }

    // Analyze completeness
    const completenessFactor = this.analyzeCompleteness(input, weights.completeness);
    factors.push(completenessFactor);

    // Analyze user feedback
    if (input.userFeedback) {
      const feedbackFactor = this.analyzeUserFeedback(
        input.userFeedback,
        weights.userFeedback
      );
      factors.push(feedbackFactor);
    }

    // Analyze improvement over iterations
    if (input.previousOutputs && input.previousOutputs.length > 0) {
      const improvementFactor = this.analyzeImprovement(
        input.output,
        input.previousOutputs,
        weights.improvement
      );
      factors.push(improvementFactor);
    }

    // Apply custom rules
    const allRules = [...this.customRules, ...(options.customRules || [])];
    for (const rule of allRules) {
      if (rule.condition(input)) {
        factors.push({
          name: rule.name,
          reason: rule.reason,
          weight: rule.weight,
          score: 1.0,
          contribution: rule.weight,
          details: `Custom rule triggered: ${rule.name}`,
        });
      }
    }

    // Calculate overall iteration score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const iterationScore = totalWeight > 0
      ? factors.reduce((sum, f) => sum + f.contribution, 0) / totalWeight
      : 0;

    // Determine decision
    const { decision, shouldPivot } = this.determineDecision(
      iterationScore,
      factors,
      currentIteration,
      maxIterations
    );

    // Find primary reason
    const primaryFactor = factors
      .filter(f => f.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)[0];

    const primaryReason = primaryFactor?.reason ?? null;

    // Build strategy if iterating
    const strategy = decision === 'iterate'
      ? this.buildStrategy(factors, input, currentIteration)
      : undefined;

    // Generate explanation
    const explanation = this.generateExplanation(decision, factors, currentIteration);

    return {
      decision,
      primaryReason,
      factors,
      decisionConfidence: this.calculateDecisionConfidence(factors, iterationScore),
      strategy,
      maxIterations,
      currentIteration,
      shouldPivot,
      explanation,
      analyzedAt: new Date(),
    };
  }

  /**
   * Analyze confidence factor
   */
  private analyzeConfidence(
    confidence: ConfidenceScore,
    threshold: number,
    weight: number
  ): IterationFactor {
    const needsIteration = confidence.score < threshold;
    const score = needsIteration ? 1 - (confidence.score / threshold) : 0;

    return {
      name: 'confidence',
      reason: 'low-confidence',
      weight,
      score,
      contribution: score * weight,
      details: `Confidence ${(confidence.score * 100).toFixed(0)}% vs threshold ${(threshold * 100).toFixed(0)}%`,
    };
  }

  /**
   * Analyze validation factor
   */
  private analyzeValidation(
    validation: ValidationResult,
    required: boolean,
    weight: number
  ): IterationFactor {
    const needsIteration = !validation.isValid;
    const score = needsIteration
      ? Math.min(1, validation.errorCount * 0.3 + (required ? 0.4 : 0))
      : 0;

    return {
      name: 'validation',
      reason: 'validation-failed',
      weight,
      score,
      contribution: score * weight,
      details: `${validation.errorCount} errors, ${validation.warningCount} warnings`,
    };
  }

  /**
   * Analyze hallucination factor
   */
  private analyzeHallucination(
    hallucination: HallucinationResult,
    threshold: number,
    weight: number
  ): IterationFactor {
    const needsIteration = hallucination.riskScore > threshold;
    const score = needsIteration
      ? (hallucination.riskScore - threshold) / (1 - threshold)
      : 0;

    return {
      name: 'hallucination',
      reason: 'hallucination-risk',
      weight,
      score,
      contribution: score * weight,
      details: `Risk score ${(hallucination.riskScore * 100).toFixed(0)}%, ${hallucination.highRiskCount} high-risk detections`,
    };
  }

  /**
   * Analyze completeness factor
   */
  private analyzeCompleteness(input: IterationInput, weight: number): IterationFactor {
    const output = input.output;

    let score = 0;
    let details = '';

    if (!output) {
      score = 1.0;
      details = 'Output is empty';
    } else {
      const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

      // Check for incomplete markers
      if (/TODO|FIXME|incomplete|...$|etc\./i.test(outputStr)) {
        score += 0.5;
        details = 'Contains incomplete markers';
      }

      // Check for truncation
      if (/truncated|cut off|continued/i.test(outputStr)) {
        score += 0.3;
        details += (details ? ', ' : '') + 'Appears truncated';
      }

      // Very short output
      if (outputStr.length < 50) {
        score += 0.2;
        details += (details ? ', ' : '') + 'Very short output';
      }
    }

    return {
      name: 'completeness',
      reason: 'incomplete-output',
      weight,
      score: Math.min(1, score),
      contribution: Math.min(1, score) * weight,
      details: details || 'Output appears complete',
    };
  }

  /**
   * Analyze user feedback factor
   */
  private analyzeUserFeedback(
    feedback: UserFeedback,
    weight: number
  ): IterationFactor {
    let score = 0;
    let details = '';

    switch (feedback.type) {
      case 'reject':
        score = 1.0;
        details = 'User rejected output';
        break;
      case 'revise':
        score = 0.7;
        details = `User requested revision: ${feedback.issues?.join(', ') || 'unspecified'}`;
        break;
      case 'approve':
        score = 0;
        details = 'User approved output';
        break;
    }

    // Adjust based on satisfaction
    if (feedback.satisfaction !== undefined) {
      const satisfactionScore = 1 - (feedback.satisfaction / 5);
      score = (score + satisfactionScore) / 2;
    }

    return {
      name: 'user-feedback',
      reason: 'user-feedback',
      weight,
      score,
      contribution: score * weight,
      details,
    };
  }

  /**
   * Analyze improvement over iterations
   */
  private analyzeImprovement(
    currentOutput: unknown,
    previousOutputs: unknown[],
    weight: number
  ): IterationFactor {
    // Simple heuristic: compare output lengths and complexity
    const current = typeof currentOutput === 'string'
      ? currentOutput
      : JSON.stringify(currentOutput);
    const previous = typeof previousOutputs[previousOutputs.length - 1] === 'string'
      ? previousOutputs[previousOutputs.length - 1] as string
      : JSON.stringify(previousOutputs[previousOutputs.length - 1]);

    // If current is same or shorter, might indicate stagnation
    const lengthRatio = current.length / Math.max(previous.length, 1);
    const isStagnating = lengthRatio < 1.05 && lengthRatio > 0.95;

    const score = isStagnating ? 0.5 : 0;

    return {
      name: 'improvement',
      reason: 'partial-success',
      weight,
      score,
      contribution: score * weight,
      details: isStagnating
        ? 'Output appears similar to previous iteration'
        : 'Output shows variation from previous iteration',
    };
  }

  /**
   * Determine iteration decision
   */
  private determineDecision(
    iterationScore: number,
    factors: IterationFactor[],
    currentIteration: number,
    maxIterations: number
  ): { decision: IterationDecision; shouldPivot: boolean } {
    // Check if we've exceeded max iterations
    if (currentIteration >= maxIterations) {
      // Even with issues, we need to make a decision
      const criticalFactors = factors.filter(f =>
        f.contribution > 0.15 &&
        (f.reason === 'validation-failed' || f.reason === 'hallucination-risk')
      );

      if (criticalFactors.length > 0) {
        return { decision: 'reject', shouldPivot: true };
      }
      return { decision: 'accept', shouldPivot: false };
    }

    // Strong indication to iterate
    if (iterationScore > 0.6) {
      const shouldPivot = currentIteration > 1 &&
        factors.some(f => f.name === 'improvement' && f.score > 0.4);
      return { decision: 'iterate', shouldPivot };
    }

    // Moderate issues
    if (iterationScore > 0.3) {
      // Check for critical issues
      const hasCritical = factors.some(f =>
        f.reason === 'validation-failed' && f.score > 0.5
      );

      if (hasCritical) {
        return { decision: 'iterate', shouldPivot: false };
      }

      // If user feedback is positive, accept
      const feedbackFactor = factors.find(f => f.name === 'user-feedback');
      if (feedbackFactor && feedbackFactor.score < 0.3) {
        return { decision: 'accept', shouldPivot: false };
      }

      return { decision: 'iterate', shouldPivot: false };
    }

    // Low issues - accept
    return { decision: 'accept', shouldPivot: false };
  }

  /**
   * Build iteration strategy
   */
  private buildStrategy(
    factors: IterationFactor[],
    input: IterationInput,
    currentIteration: number
  ): IterationStrategy {
    const focusAreas: string[] = [];
    const suggestedChanges: string[] = [];

    // Analyze factors to determine strategy type
    let strategyType: IterationStrategy['type'] = 'refine';

    // Sort factors by contribution
    const sortedFactors = [...factors].sort((a, b) => b.contribution - a.contribution);

    for (const factor of sortedFactors) {
      if (factor.contribution < 0.05) continue;

      switch (factor.reason) {
        case 'low-confidence':
          focusAreas.push('Improve response specificity');
          suggestedChanges.push('Add more concrete details and examples');
          break;

        case 'validation-failed':
          focusAreas.push('Fix format/schema compliance');
          suggestedChanges.push('Ensure output matches expected structure');
          break;

        case 'hallucination-risk':
          focusAreas.push('Verify factual claims');
          suggestedChanges.push('Remove or verify questionable citations/data');
          strategyType = 'refine';
          break;

        case 'incomplete-output':
          focusAreas.push('Complete all sections');
          suggestedChanges.push('Expand on truncated or incomplete parts');
          strategyType = 'expand';
          break;

        case 'user-feedback':
          if (input.userFeedback?.improvements) {
            focusAreas.push(...input.userFeedback.improvements);
          }
          break;

        case 'partial-success':
          if (currentIteration > 2) {
            strategyType = 'alternate';
            suggestedChanges.push('Try a different approach');
          }
          break;
      }
    }

    // Determine creativity adjustment
    let creativityAdjustment: IterationStrategy['creativityAdjustment'] = 'maintain';
    if (sortedFactors.some(f => f.reason === 'hallucination-risk')) {
      creativityAdjustment = 'decrease';
    } else if (sortedFactors.some(f => f.reason === 'incomplete-output')) {
      creativityAdjustment = 'increase';
    }

    return {
      type: strategyType,
      focusAreas: [...new Set(focusAreas)],
      suggestedChanges: [...new Set(suggestedChanges)],
      creativityAdjustment,
    };
  }

  /**
   * Calculate confidence in the decision
   */
  private calculateDecisionConfidence(
    factors: IterationFactor[],
    iterationScore: number
  ): number {
    // High confidence if score is clearly in one direction
    if (iterationScore > 0.8 || iterationScore < 0.2) {
      return 0.9;
    }

    // Lower confidence in the middle
    const distance = Math.abs(iterationScore - 0.5);
    return 0.5 + distance;
  }

  /**
   * Generate explanation for the decision
   */
  private generateExplanation(
    decision: IterationDecision,
    factors: IterationFactor[],
    currentIteration: number
  ): string {
    const topFactors = factors
      .filter(f => f.contribution > 0.05)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);

    let explanation = '';

    switch (decision) {
      case 'accept':
        explanation = `Accepting output after ${currentIteration} iteration(s). `;
        if (topFactors.length > 0 && topFactors[0].contribution > 0) {
          explanation += `Minor issues: ${topFactors.map(f => f.name).join(', ')}.`;
        } else {
          explanation += 'Output meets quality thresholds.';
        }
        break;

      case 'iterate':
        explanation = `Iteration ${currentIteration} needs refinement. `;
        explanation += `Key issues: ${topFactors.map(f => f.details || f.name).join('; ')}.`;
        break;

      case 'reject':
        explanation = `Rejecting output after ${currentIteration} iteration(s). `;
        explanation += `Critical issues: ${topFactors.map(f => f.name).join(', ')}.`;
        break;

      case 'escalate':
        explanation = `Escalating for human review after ${currentIteration} iteration(s). `;
        explanation += `Unresolvable issues detected.`;
        break;
    }

    return explanation;
  }

  /**
   * Quick check if iteration is needed
   */
  needsIteration(input: IterationInput, options?: DetectionOptions): boolean {
    return this.analyze(input, options).decision === 'iterate';
  }

  /**
   * Get iteration count recommendation
   */
  recommendedIterations(input: IterationInput, options?: DetectionOptions): number {
    const analysis = this.analyze(input, options);

    if (analysis.decision === 'accept') return 0;
    if (analysis.decision === 'reject') return 0;

    // Estimate needed iterations based on issue severity
    const avgContribution = analysis.factors
      .filter(f => f.contribution > 0)
      .reduce((sum, f) => sum + f.contribution, 0) / Math.max(analysis.factors.length, 1);

    if (avgContribution > 0.4) return 3;
    if (avgContribution > 0.2) return 2;
    return 1;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global iteration detector instance */
export const iterationDetector = new IterationDetector();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Analyze if iteration is needed
 */
export function analyzeIteration(
  input: IterationInput,
  options?: DetectionOptions
): IterationAnalysis {
  return iterationDetector.analyze(input, options);
}

/**
 * Quick check if iteration is needed
 */
export function needsIteration(
  input: IterationInput,
  options?: DetectionOptions
): boolean {
  return iterationDetector.needsIteration(input, options);
}

/**
 * Get recommended iteration count
 */
export function recommendedIterations(
  input: IterationInput,
  options?: DetectionOptions
): number {
  return iterationDetector.recommendedIterations(input, options);
}

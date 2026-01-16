/**
 * Feedback Synthesizer
 *
 * Creates actionable feedback from quality assessments and iteration analysis.
 * Generates specific, constructive guidance for improving outputs.
 *
 * @module dag/feedback/feedback-synthesizer
 */

import { type IterationAnalysis, type IterationFactor } from './iteration-detector';
import { type ConfidenceScore } from '../quality/confidence-scorer';
import { type ValidationResult, type ValidationIssue } from '../quality/output-validator';
import { type DetectionResult as HallucinationResult, type HallucinationDetection } from '../quality/hallucination-detector';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Feedback priority level
 */
export type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Feedback category
 */
export type FeedbackCategory =
  | 'accuracy'       // Factual correctness
  | 'completeness'   // Coverage of requirements
  | 'format'         // Structure and formatting
  | 'quality'        // Overall quality
  | 'style'          // Writing style and tone
  | 'specificity'    // Level of detail
  | 'verification'   // Source/fact verification
  | 'performance';   // Execution performance

/**
 * A single feedback item
 */
export interface FeedbackItem {
  /** Unique identifier */
  id: string;

  /** Priority level */
  priority: FeedbackPriority;

  /** Category */
  category: FeedbackCategory;

  /** Brief title */
  title: string;

  /** Detailed description */
  description: string;

  /** Specific, actionable steps to address */
  actions: string[];

  /** Example of desired improvement */
  example?: string;

  /** Related content location (if applicable) */
  location?: {
    type: 'line' | 'section' | 'field';
    reference: string;
  };

  /** Estimated effort to address */
  effort: 'trivial' | 'minor' | 'moderate' | 'significant';

  /** Source of the feedback */
  source: string;
}

/**
 * Complete synthesized feedback
 */
export interface SynthesizedFeedback {
  /** Overall assessment */
  assessment: FeedbackAssessment;

  /** All feedback items */
  items: FeedbackItem[];

  /** Items by priority */
  byPriority: Record<FeedbackPriority, FeedbackItem[]>;

  /** Items by category */
  byCategory: Record<FeedbackCategory, FeedbackItem[]>;

  /** Critical items that must be addressed */
  criticalItems: FeedbackItem[];

  /** Quick wins (low effort, high impact) */
  quickWins: FeedbackItem[];

  /** Summary for quick review */
  summary: string;

  /** Structured prompt for revision */
  revisionPrompt: string;

  /** Synthesis timestamp */
  synthesizedAt: Date;
}

/**
 * Overall feedback assessment
 */
export interface FeedbackAssessment {
  /** Overall grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  /** Numeric score (0-100) */
  score: number;

  /** Is this acceptable as-is? */
  isAcceptable: boolean;

  /** Key strengths */
  strengths: string[];

  /** Key weaknesses */
  weaknesses: string[];

  /** One-line verdict */
  verdict: string;
}

/**
 * Input for feedback synthesis
 */
export interface SynthesisInput {
  /** The output being evaluated */
  output: unknown;

  /** Original input/prompt */
  input?: string;

  /** Iteration analysis */
  iteration?: IterationAnalysis;

  /** Confidence score */
  confidence?: ConfidenceScore;

  /** Validation result */
  validation?: ValidationResult;

  /** Hallucination detection */
  hallucination?: HallucinationResult;

  /** Custom assessments */
  customAssessments?: CustomAssessment[];

  /** Context for synthesis */
  context?: Record<string, unknown>;
}

/**
 * Custom assessment input
 */
export interface CustomAssessment {
  /** Assessment name */
  name: string;

  /** Category */
  category: FeedbackCategory;

  /** Score (0-1) */
  score: number;

  /** Issues found */
  issues?: string[];

  /** Recommendations */
  recommendations?: string[];
}

/**
 * Synthesis options
 */
export interface SynthesisOptions {
  /** Include examples in feedback */
  includeExamples?: boolean;

  /** Maximum items to return */
  maxItems?: number;

  /** Minimum priority to include */
  minPriority?: FeedbackPriority;

  /** Focus on specific categories */
  focusCategories?: FeedbackCategory[];

  /** Generate revision prompt */
  generateRevisionPrompt?: boolean;

  /** Tone of feedback */
  tone?: 'formal' | 'friendly' | 'direct';
}

// =============================================================================
// FEEDBACK SYNTHESIZER CLASS
// =============================================================================

/**
 * FeedbackSynthesizer creates actionable feedback from assessments.
 *
 * @example
 * ```typescript
 * const synthesizer = new FeedbackSynthesizer();
 *
 * const feedback = synthesizer.synthesize({
 *   output: agentResult,
 *   input: originalPrompt,
 *   iteration: iterationAnalysis,
 *   confidence: confidenceScore,
 *   validation: validationResult,
 * });
 *
 * console.log('Assessment:', feedback.assessment.verdict);
 * console.log('Critical items:', feedback.criticalItems);
 * console.log('Revision prompt:', feedback.revisionPrompt);
 * ```
 */
export class FeedbackSynthesizer {
  private itemCounter = 0;

  /**
   * Generate a unique feedback item ID
   */
  private generateId(): string {
    return `fb-${Date.now()}-${++this.itemCounter}`;
  }

  /**
   * Synthesize feedback from all inputs
   */
  synthesize(input: SynthesisInput, options: SynthesisOptions = {}): SynthesizedFeedback {
    const items: FeedbackItem[] = [];

    // Synthesize from iteration analysis
    if (input.iteration) {
      items.push(...this.synthesizeFromIteration(input.iteration, options));
    }

    // Synthesize from confidence score
    if (input.confidence) {
      items.push(...this.synthesizeFromConfidence(input.confidence, options));
    }

    // Synthesize from validation
    if (input.validation) {
      items.push(...this.synthesizeFromValidation(input.validation, options));
    }

    // Synthesize from hallucination detection
    if (input.hallucination) {
      items.push(...this.synthesizeFromHallucination(input.hallucination, options));
    }

    // Synthesize from custom assessments
    if (input.customAssessments) {
      items.push(...this.synthesizeFromCustom(input.customAssessments, options));
    }

    // Filter by priority
    let filteredItems = items;
    if (options.minPriority) {
      const priorityOrder: FeedbackPriority[] = ['critical', 'high', 'medium', 'low'];
      const minIndex = priorityOrder.indexOf(options.minPriority);
      filteredItems = items.filter(item =>
        priorityOrder.indexOf(item.priority) <= minIndex
      );
    }

    // Filter by category
    if (options.focusCategories && options.focusCategories.length > 0) {
      filteredItems = filteredItems.filter(item =>
        options.focusCategories!.includes(item.category)
      );
    }

    // Sort by priority
    const priorityWeight: Record<FeedbackPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    filteredItems.sort((a, b) =>
      priorityWeight[b.priority] - priorityWeight[a.priority]
    );

    // Limit items
    if (options.maxItems) {
      filteredItems = filteredItems.slice(0, options.maxItems);
    }

    // Group by priority
    const byPriority: Record<FeedbackPriority, FeedbackItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    for (const item of filteredItems) {
      byPriority[item.priority].push(item);
    }

    // Group by category
    const byCategory: Record<FeedbackCategory, FeedbackItem[]> = {
      accuracy: [],
      completeness: [],
      format: [],
      quality: [],
      style: [],
      specificity: [],
      verification: [],
      performance: [],
    };
    for (const item of filteredItems) {
      byCategory[item.category].push(item);
    }

    // Identify critical items
    const criticalItems = filteredItems.filter(i => i.priority === 'critical');

    // Identify quick wins
    const quickWins = filteredItems.filter(i =>
      i.effort === 'trivial' || i.effort === 'minor'
    );

    // Generate assessment
    const assessment = this.generateAssessment(input, filteredItems);

    // Generate summary
    const summary = this.generateSummary(filteredItems, assessment);

    // Generate revision prompt
    const revisionPrompt = options.generateRevisionPrompt !== false
      ? this.generateRevisionPrompt(filteredItems, input.input, options.tone)
      : '';

    return {
      assessment,
      items: filteredItems,
      byPriority,
      byCategory,
      criticalItems,
      quickWins,
      summary,
      revisionPrompt,
      synthesizedAt: new Date(),
    };
  }

  /**
   * Synthesize feedback from iteration analysis
   */
  private synthesizeFromIteration(
    iteration: IterationAnalysis,
    options: SynthesisOptions
  ): FeedbackItem[] {
    const items: FeedbackItem[] = [];

    for (const factor of iteration.factors) {
      if (factor.contribution < 0.05) continue;

      const item = this.factorToFeedback(factor, options);
      if (item) items.push(item);
    }

    // Add strategy-based feedback
    if (iteration.strategy) {
      for (const change of iteration.strategy.suggestedChanges) {
        items.push({
          id: this.generateId(),
          priority: 'medium',
          category: 'quality',
          title: 'Suggested improvement',
          description: change,
          actions: [change],
          effort: 'moderate',
          source: 'iteration-strategy',
        });
      }
    }

    return items;
  }

  /**
   * Convert iteration factor to feedback item
   */
  private factorToFeedback(
    factor: IterationFactor,
    options: SynthesisOptions
  ): FeedbackItem | null {
    if (factor.score < 0.1) return null;

    const categoryMap: Record<string, FeedbackCategory> = {
      confidence: 'quality',
      validation: 'format',
      hallucination: 'accuracy',
      completeness: 'completeness',
      'user-feedback': 'quality',
      improvement: 'quality',
    };

    const priority = this.scoreToPriority(factor.contribution);
    const category = categoryMap[factor.name] || 'quality';

    return {
      id: this.generateId(),
      priority,
      category,
      title: this.formatFactorTitle(factor.name),
      description: factor.details || `Issue detected in ${factor.name}`,
      actions: this.getActionsForFactor(factor),
      effort: this.getEffortForFactor(factor),
      source: `iteration-${factor.name}`,
    };
  }

  /**
   * Synthesize feedback from confidence score
   */
  private synthesizeFromConfidence(
    confidence: ConfidenceScore,
    _options: SynthesisOptions
  ): FeedbackItem[] {
    const items: FeedbackItem[] = [];

    // Add recommendations as feedback items
    for (const rec of confidence.recommendations) {
      items.push({
        id: this.generateId(),
        priority: 'medium',
        category: this.categorizeRecommendation(rec),
        title: 'Confidence improvement',
        description: rec,
        actions: [rec],
        effort: 'minor',
        source: 'confidence-scorer',
      });
    }

    // Add factor-specific feedback for low scores
    for (const [name, value] of Object.entries(confidence.factors)) {
      if (typeof value !== 'number' || value >= 0.6) continue;

      items.push({
        id: this.generateId(),
        priority: value < 0.3 ? 'high' : 'medium',
        category: this.factorToCategory(name),
        title: `Improve ${this.formatFactorTitle(name)}`,
        description: `${this.formatFactorTitle(name)} score is ${(value * 100).toFixed(0)}%`,
        actions: this.getActionsForConfidenceFactor(name),
        effort: 'moderate',
        source: 'confidence-scorer',
      });
    }

    return items;
  }

  /**
   * Synthesize feedback from validation result
   */
  private synthesizeFromValidation(
    validation: ValidationResult,
    options: SynthesisOptions
  ): FeedbackItem[] {
    const items: FeedbackItem[] = [];

    for (const issue of validation.issues) {
      items.push(this.validationIssueToFeedback(issue, options));
    }

    return items;
  }

  /**
   * Convert validation issue to feedback item
   */
  private validationIssueToFeedback(
    issue: ValidationIssue,
    _options: SynthesisOptions
  ): FeedbackItem {
    const priority: FeedbackPriority = issue.severity === 'error'
      ? 'high'
      : issue.severity === 'warning' ? 'medium' : 'low';

    return {
      id: this.generateId(),
      priority,
      category: 'format',
      title: `Validation: ${issue.code}`,
      description: issue.message,
      actions: issue.suggestion ? [issue.suggestion] : ['Fix the validation error'],
      location: issue.path ? { type: 'field', reference: issue.path } : undefined,
      effort: 'minor',
      source: 'output-validator',
    };
  }

  /**
   * Synthesize feedback from hallucination detection
   */
  private synthesizeFromHallucination(
    result: HallucinationResult,
    _options: SynthesisOptions
  ): FeedbackItem[] {
    const items: FeedbackItem[] = [];

    for (const detection of result.detections) {
      items.push(this.hallucinationToFeedback(detection));
    }

    return items;
  }

  /**
   * Convert hallucination detection to feedback item
   */
  private hallucinationToFeedback(detection: HallucinationDetection): FeedbackItem {
    const priority: FeedbackPriority =
      detection.risk === 'high' ? 'critical' :
      detection.risk === 'medium' ? 'high' : 'medium';

    return {
      id: this.generateId(),
      priority,
      category: 'accuracy',
      title: `Potential ${this.formatHallucinationType(detection.type)}`,
      description: `${detection.reason}: "${detection.content.substring(0, 100)}${detection.content.length > 100 ? '...' : ''}"`,
      actions: detection.verification
        ? [detection.verification]
        : ['Verify this content for accuracy'],
      effort: 'moderate',
      source: 'hallucination-detector',
    };
  }

  /**
   * Synthesize feedback from custom assessments
   */
  private synthesizeFromCustom(
    assessments: CustomAssessment[],
    _options: SynthesisOptions
  ): FeedbackItem[] {
    const items: FeedbackItem[] = [];

    for (const assessment of assessments) {
      if (assessment.score >= 0.7) continue; // Only include issues

      // Add issues
      if (assessment.issues) {
        for (const issue of assessment.issues) {
          items.push({
            id: this.generateId(),
            priority: assessment.score < 0.3 ? 'high' : 'medium',
            category: assessment.category,
            title: `${assessment.name}: Issue`,
            description: issue,
            actions: assessment.recommendations || ['Address this issue'],
            effort: 'moderate',
            source: `custom-${assessment.name}`,
          });
        }
      }
    }

    return items;
  }

  /**
   * Generate overall assessment
   */
  private generateAssessment(
    input: SynthesisInput,
    items: FeedbackItem[]
  ): FeedbackAssessment {
    // Calculate score based on items
    let score = 100;

    for (const item of items) {
      switch (item.priority) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    }

    // Factor in confidence if available
    if (input.confidence) {
      score = (score + input.confidence.score * 100) / 2;
    }

    score = Math.max(0, Math.min(100, score));

    // Determine grade
    const grade: FeedbackAssessment['grade'] =
      score >= 90 ? 'A' :
      score >= 80 ? 'B' :
      score >= 70 ? 'C' :
      score >= 60 ? 'D' : 'F';

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (input.confidence) {
      for (const [name, value] of Object.entries(input.confidence.factors)) {
        if (typeof value !== 'number') continue;
        if (value >= 0.7) {
          strengths.push(this.formatFactorTitle(name));
        } else if (value < 0.5) {
          weaknesses.push(this.formatFactorTitle(name));
        }
      }
    }

    // Verdict
    const isAcceptable = score >= 60 && items.filter(i => i.priority === 'critical').length === 0;
    const verdict = isAcceptable
      ? score >= 80
        ? 'Output meets quality standards with minor improvements possible'
        : 'Output is acceptable but has room for improvement'
      : 'Output requires revision before acceptance';

    return {
      grade,
      score,
      isAcceptable,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      verdict,
    };
  }

  /**
   * Generate summary of feedback
   */
  private generateSummary(
    items: FeedbackItem[],
    assessment: FeedbackAssessment
  ): string {
    const criticalCount = items.filter(i => i.priority === 'critical').length;
    const highCount = items.filter(i => i.priority === 'high').length;

    let summary = `Grade: ${assessment.grade} (${assessment.score.toFixed(0)}%). `;
    summary += `${items.length} feedback items: `;

    if (criticalCount > 0) {
      summary += `${criticalCount} critical, `;
    }
    if (highCount > 0) {
      summary += `${highCount} high priority. `;
    }

    summary += assessment.verdict;

    return summary;
  }

  /**
   * Generate revision prompt
   */
  private generateRevisionPrompt(
    items: FeedbackItem[],
    originalInput?: string,
    tone: SynthesisOptions['tone'] = 'direct'
  ): string {
    const criticalItems = items.filter(i => i.priority === 'critical');
    const highItems = items.filter(i => i.priority === 'high');

    let prompt = '';

    // Tone-based intro
    switch (tone) {
      case 'formal':
        prompt = 'Please revise the output addressing the following items:\n\n';
        break;
      case 'friendly':
        prompt = 'Great start! Here are some improvements to make:\n\n';
        break;
      case 'direct':
        prompt = 'Revise with these fixes:\n\n';
        break;
    }

    // Critical items first
    if (criticalItems.length > 0) {
      prompt += '**CRITICAL (must fix):**\n';
      for (const item of criticalItems) {
        prompt += `- ${item.title}: ${item.actions[0]}\n`;
      }
      prompt += '\n';
    }

    // High priority items
    if (highItems.length > 0) {
      prompt += '**HIGH PRIORITY:**\n';
      for (const item of highItems) {
        prompt += `- ${item.title}: ${item.actions[0]}\n`;
      }
      prompt += '\n';
    }

    // Reference original input if available
    if (originalInput) {
      prompt += `\nOriginal request: "${originalInput.substring(0, 200)}${originalInput.length > 200 ? '...' : ''}"\n`;
    }

    return prompt;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private scoreToPriority(score: number): FeedbackPriority {
    if (score >= 0.3) return 'critical';
    if (score >= 0.2) return 'high';
    if (score >= 0.1) return 'medium';
    return 'low';
  }

  private formatFactorTitle(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/-/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  private formatHallucinationType(type: string): string {
    return type.replace(/-/g, ' ');
  }

  private categorizeRecommendation(rec: string): FeedbackCategory {
    const lower = rec.toLowerCase();
    if (lower.includes('format') || lower.includes('structure')) return 'format';
    if (lower.includes('specific') || lower.includes('detail')) return 'specificity';
    if (lower.includes('source') || lower.includes('reference')) return 'verification';
    if (lower.includes('complete') || lower.includes('cover')) return 'completeness';
    return 'quality';
  }

  private factorToCategory(name: string): FeedbackCategory {
    const map: Record<string, FeedbackCategory> = {
      formatCompliance: 'format',
      completeness: 'completeness',
      inputAlignment: 'completeness',
      internalConsistency: 'accuracy',
      specificity: 'specificity',
      sourceAttribution: 'verification',
      skillReliability: 'performance',
    };
    return map[name] || 'quality';
  }

  private getActionsForFactor(factor: IterationFactor): string[] {
    const actionMap: Record<string, string[]> = {
      confidence: ['Add more specific details', 'Include examples'],
      validation: ['Fix format errors', 'Match expected schema'],
      hallucination: ['Verify facts', 'Add sources'],
      completeness: ['Complete all sections', 'Expand on key points'],
      'user-feedback': ['Address user concerns', 'Incorporate feedback'],
    };
    return actionMap[factor.name] || ['Address the identified issue'];
  }

  private getActionsForConfidenceFactor(name: string): string[] {
    const actionMap: Record<string, string[]> = {
      formatCompliance: ['Ensure output matches expected format'],
      completeness: ['Cover all aspects of the request'],
      inputAlignment: ['Better address the original requirements'],
      internalConsistency: ['Remove contradictions', 'Ensure logical flow'],
      specificity: ['Add concrete details and examples'],
      sourceAttribution: ['Add references or documentation links'],
    };
    return actionMap[name] || ['Improve this aspect of the output'];
  }

  private getEffortForFactor(factor: IterationFactor): FeedbackItem['effort'] {
    if (factor.score > 0.7) return 'significant';
    if (factor.score > 0.4) return 'moderate';
    if (factor.score > 0.2) return 'minor';
    return 'trivial';
  }

  /**
   * Quick synthesis (returns just items)
   */
  quickSynthesize(input: SynthesisInput): FeedbackItem[] {
    return this.synthesize(input, { generateRevisionPrompt: false }).items;
  }

  /**
   * Get revision prompt only
   */
  getRevisionPrompt(
    input: SynthesisInput,
    tone?: SynthesisOptions['tone']
  ): string {
    return this.synthesize(input, { generateRevisionPrompt: true, tone }).revisionPrompt;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global feedback synthesizer instance */
export const feedbackSynthesizer = new FeedbackSynthesizer();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Synthesize feedback from inputs
 */
export function synthesizeFeedback(
  input: SynthesisInput,
  options?: SynthesisOptions
): SynthesizedFeedback {
  return feedbackSynthesizer.synthesize(input, options);
}

/**
 * Quick synthesis
 */
export function quickSynthesizeFeedback(input: SynthesisInput): FeedbackItem[] {
  return feedbackSynthesizer.quickSynthesize(input);
}

/**
 * Get revision prompt
 */
export function getRevisionPrompt(
  input: SynthesisInput,
  tone?: SynthesisOptions['tone']
): string {
  return feedbackSynthesizer.getRevisionPrompt(input, tone);
}

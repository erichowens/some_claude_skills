/**
 * Confidence Scorer
 *
 * Assigns confidence scores to agent outputs based on multiple factors.
 * Helps downstream consumers understand the reliability of results.
 *
 * @module dag/quality/confidence-scorer
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Factors that influence confidence scoring
 */
export interface ConfidenceFactors {
  /** How well the output matches expected format (0-1) */
  formatCompliance: number;

  /** Completeness of the output (0-1) */
  completeness: number;

  /** Consistency with input requirements (0-1) */
  inputAlignment: number;

  /** Self-consistency of the output (0-1) */
  internalConsistency: number;

  /** Specificity/detail level (0-1) */
  specificity: number;

  /** Source attribution quality (0-1) */
  sourceAttribution: number;

  /** Skill's historical success rate (0-1) */
  skillReliability: number;

  /** Custom factors */
  custom?: Record<string, number>;
}

/**
 * Weight configuration for confidence factors
 */
export interface ConfidenceWeights {
  formatCompliance: number;
  completeness: number;
  inputAlignment: number;
  internalConsistency: number;
  specificity: number;
  sourceAttribution: number;
  skillReliability: number;
  custom?: Record<string, number>;
}

/**
 * Confidence level categories
 */
export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low' | 'very-low';

/**
 * Complete confidence score result
 */
export interface ConfidenceScore {
  /** Overall confidence (0-1) */
  score: number;

  /** Categorical level */
  level: ConfidenceLevel;

  /** Individual factor scores */
  factors: ConfidenceFactors;

  /** Factor weights used */
  weights: ConfidenceWeights;

  /** Weighted factor contributions */
  contributions: Record<string, number>;

  /** Human-readable explanation */
  explanation: string;

  /** Recommendations for improvement */
  recommendations: string[];

  /** Scoring timestamp */
  scoredAt: Date;
}

/**
 * Input for confidence scoring
 */
export interface ScoringInput {
  /** The agent output to score */
  output: unknown;

  /** Original input/prompt */
  input?: string;

  /** Expected output format/schema */
  expectedFormat?: string;

  /** Skill ID that produced the output */
  skillId?: string;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Scoring options
 */
export interface ScoringOptions {
  /** Custom weights (overrides defaults) */
  weights?: Partial<ConfidenceWeights>;

  /** Include detailed explanations */
  includeExplanation?: boolean;

  /** Include recommendations */
  includeRecommendations?: boolean;

  /** Custom factor calculators */
  customFactors?: Record<string, (input: ScoringInput) => number>;
}

// =============================================================================
// CONFIDENCE SCORER CLASS
// =============================================================================

/**
 * ConfidenceScorer assigns confidence scores to agent outputs.
 *
 * @example
 * ```typescript
 * const scorer = new ConfidenceScorer();
 *
 * const score = scorer.score({
 *   output: agentResult,
 *   input: originalPrompt,
 *   expectedFormat: 'code',
 *   skillId: 'code-reviewer',
 * });
 *
 * console.log(`Confidence: ${score.level} (${score.score.toFixed(2)})`);
 * ```
 */
export class ConfidenceScorer {
  private readonly defaultWeights: ConfidenceWeights = {
    formatCompliance: 0.20,
    completeness: 0.20,
    inputAlignment: 0.15,
    internalConsistency: 0.15,
    specificity: 0.10,
    sourceAttribution: 0.10,
    skillReliability: 0.10,
  };

  private skillSuccessRates: Map<string, number> = new Map();

  /**
   * Score an agent output
   */
  score(input: ScoringInput, options: ScoringOptions = {}): ConfidenceScore {
    const weights = this.mergeWeights(options.weights);

    // Calculate individual factors
    const factors: ConfidenceFactors = {
      formatCompliance: this.calculateFormatCompliance(input),
      completeness: this.calculateCompleteness(input),
      inputAlignment: this.calculateInputAlignment(input),
      internalConsistency: this.calculateInternalConsistency(input),
      specificity: this.calculateSpecificity(input),
      sourceAttribution: this.calculateSourceAttribution(input),
      skillReliability: this.getSkillReliability(input.skillId),
    };

    // Add custom factors
    if (options.customFactors) {
      factors.custom = {};
      for (const [name, calculator] of Object.entries(options.customFactors)) {
        factors.custom[name] = calculator(input);
      }
    }

    // Calculate weighted score
    const contributions = this.calculateContributions(factors, weights);
    const score = Object.values(contributions).reduce((sum, c) => sum + c, 0);

    // Determine level
    const level = this.scoreToLevel(score);

    // Build result
    const result: ConfidenceScore = {
      score,
      level,
      factors,
      weights,
      contributions,
      explanation: '',
      recommendations: [],
      scoredAt: new Date(),
    };

    // Add explanations if requested
    if (options.includeExplanation !== false) {
      result.explanation = this.generateExplanation(result);
    }

    if (options.includeRecommendations !== false) {
      result.recommendations = this.generateRecommendations(factors);
    }

    return result;
  }

  /**
   * Calculate format compliance score
   */
  private calculateFormatCompliance(input: ScoringInput): number {
    const { output, expectedFormat } = input;

    if (!output) return 0;
    if (!expectedFormat) return 0.7; // No format specified, moderate confidence

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    switch (expectedFormat) {
      case 'code':
        return this.assessCodeFormat(outputStr);
      case 'markdown':
        return this.assessMarkdownFormat(outputStr);
      case 'json':
        return this.assessJsonFormat(output);
      case 'list':
        return this.assessListFormat(outputStr);
      default:
        return 0.5;
    }
  }

  private assessCodeFormat(code: string): number {
    let score = 0.5;

    // Has structure (functions, classes, etc.)
    if (/function|class|const|let|var|def|public|private/.test(code)) {
      score += 0.2;
    }

    // Balanced brackets
    const opens = (code.match(/[{[(]/g) || []).length;
    const closes = (code.match(/[}\])]/g) || []).length;
    if (opens === closes) {
      score += 0.2;
    }

    // No obvious errors
    if (!/syntax error|undefined|null pointer/i.test(code)) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private assessMarkdownFormat(md: string): number {
    let score = 0.5;

    // Has headings
    if (/#+ /.test(md)) score += 0.15;

    // Has paragraphs
    if (md.split('\n\n').length > 1) score += 0.1;

    // Properly closed code blocks
    const codeBlocks = (md.match(/```/g) || []).length;
    if (codeBlocks % 2 === 0) score += 0.15;

    // Has lists
    if (/^[-*•] /m.test(md) || /^\d+\. /m.test(md)) score += 0.1;

    return Math.min(1, score);
  }

  private assessJsonFormat(output: unknown): number {
    if (typeof output === 'object' && output !== null) return 0.9;

    if (typeof output === 'string') {
      try {
        JSON.parse(output);
        return 0.85;
      } catch {
        return 0.2;
      }
    }

    return 0.3;
  }

  private assessListFormat(text: string): number {
    const lines = text.split('\n').filter(l => l.trim());
    const listItems = lines.filter(l => /^[-*•\d.]/.test(l.trim()));
    return listItems.length / Math.max(lines.length, 1);
  }

  /**
   * Calculate completeness score
   */
  private calculateCompleteness(input: ScoringInput): number {
    const { output, input: originalInput } = input;

    if (!output) return 0;

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Base score on output length
    let score = Math.min(1, outputStr.length / 500);

    // Check for incomplete markers
    if (/TODO|FIXME|...$|etc\.|and more/i.test(outputStr)) {
      score *= 0.7;
    }

    // Check for truncation
    if (/truncated|cut off|continued/i.test(outputStr)) {
      score *= 0.6;
    }

    // If we have the original input, check coverage
    if (originalInput) {
      const inputKeywords = this.extractKeywords(originalInput);
      const outputKeywords = this.extractKeywords(outputStr);
      const coverage = inputKeywords.filter(k => outputKeywords.includes(k)).length /
                       Math.max(inputKeywords.length, 1);
      score = (score + coverage) / 2;
    }

    return score;
  }

  /**
   * Calculate input alignment score
   */
  private calculateInputAlignment(input: ScoringInput): number {
    const { output, input: originalInput } = input;

    if (!output || !originalInput) return 0.5;

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Extract key terms from input
    const inputTerms = this.extractKeywords(originalInput);
    const outputTerms = this.extractKeywords(outputStr);

    // Calculate overlap
    const overlap = inputTerms.filter(t => outputTerms.includes(t)).length;
    const alignmentScore = overlap / Math.max(inputTerms.length, 1);

    // Check for direct addressing of the input
    let directAddressing = 0.5;
    if (/based on|as requested|according to|following your/i.test(outputStr)) {
      directAddressing = 0.8;
    }

    return (alignmentScore + directAddressing) / 2;
  }

  /**
   * Calculate internal consistency score
   */
  private calculateInternalConsistency(input: ScoringInput): number {
    const { output } = input;

    if (!output) return 0;

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    let score = 0.7; // Base score

    // Check for contradictions
    const contradictionPatterns = [
      /however.*but/i,
      /yes.*no/i,
      /true.*false/i,
      /always.*never/i,
      /both.*neither/i,
    ];

    for (const pattern of contradictionPatterns) {
      if (pattern.test(outputStr)) {
        score -= 0.1;
      }
    }

    // Check for repetition (might indicate confusion)
    const sentences = outputStr.split(/[.!?]+/).filter(s => s.trim());
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    if (sentences.length > 3 && uniqueSentences.size < sentences.length * 0.8) {
      score -= 0.15;
    }

    // Check for logical structure
    if (/therefore|thus|hence|because|since|as a result/i.test(outputStr)) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate specificity score
   */
  private calculateSpecificity(input: ScoringInput): number {
    const { output } = input;

    if (!output) return 0;

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    let score = 0.5;

    // Has specific numbers/data
    if (/\d+(\.\d+)?(%|px|em|rem|ms|s|kb|mb|gb)?/i.test(outputStr)) {
      score += 0.15;
    }

    // Has code references
    if (/`[^`]+`|```[\s\S]+```/.test(outputStr)) {
      score += 0.15;
    }

    // Has file paths
    if (/\/[\w-]+\/[\w-]+(\.\w+)?/.test(outputStr)) {
      score += 0.1;
    }

    // Has specific technical terms
    const technicalTerms = outputStr.match(/\b[A-Z][a-z]+[A-Z]\w*\b/g) || []; // CamelCase
    if (technicalTerms.length > 0) {
      score += Math.min(0.1, technicalTerms.length * 0.02);
    }

    // Penalize vague language
    const vagueTerms = (outputStr.match(/\b(maybe|perhaps|might|could|possibly|probably|generally|usually|often)\b/gi) || []).length;
    score -= Math.min(0.2, vagueTerms * 0.03);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate source attribution score
   */
  private calculateSourceAttribution(input: ScoringInput): number {
    const { output } = input;

    if (!output) return 0;

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    let score = 0.5; // Base score (some outputs don't need sources)

    // Has URLs
    if (/https?:\/\/[\w-]+(\.[\w-]+)+/.test(outputStr)) {
      score += 0.2;
    }

    // Has references to documentation
    if (/documentation|docs|reference|source|according to/i.test(outputStr)) {
      score += 0.15;
    }

    // Has citations or quotes
    if (/"[^"]+"|'[^']+'/.test(outputStr)) {
      score += 0.1;
    }

    // Check context for required citations
    const context = input.context || {};
    if (context.requiresCitations && score < 0.7) {
      score *= 0.5; // Penalize if citations required but missing
    }

    return Math.min(1, score);
  }

  /**
   * Get skill reliability from historical data
   */
  private getSkillReliability(skillId?: string): number {
    if (!skillId) return 0.5;
    return this.skillSuccessRates.get(skillId) ?? 0.5;
  }

  /**
   * Update skill reliability tracking
   */
  updateSkillReliability(skillId: string, successRate: number): void {
    this.skillSuccessRates.set(skillId, successRate);
  }

  /**
   * Merge custom weights with defaults
   */
  private mergeWeights(custom?: Partial<ConfidenceWeights>): ConfidenceWeights {
    if (!custom) return { ...this.defaultWeights };

    const merged = { ...this.defaultWeights, ...custom };

    // Normalize weights to sum to 1
    const total = Object.values(merged)
      .filter((v): v is number => typeof v === 'number')
      .reduce((sum, w) => sum + w, 0);

    if (total > 0 && total !== 1) {
      for (const key of Object.keys(merged) as (keyof ConfidenceWeights)[]) {
        if (typeof merged[key] === 'number') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (merged as any)[key] = (merged[key] as number) / total;
        }
      }
    }

    return merged;
  }

  /**
   * Calculate weighted contributions
   */
  private calculateContributions(
    factors: ConfidenceFactors,
    weights: ConfidenceWeights
  ): Record<string, number> {
    const contributions: Record<string, number> = {};

    for (const [key, weight] of Object.entries(weights)) {
      if (key === 'custom') continue;
      const factor = factors[key as keyof ConfidenceFactors];
      if (typeof factor === 'number') {
        contributions[key] = factor * weight;
      }
    }

    // Handle custom factors
    if (factors.custom && weights.custom) {
      for (const [key, weight] of Object.entries(weights.custom)) {
        if (factors.custom[key] !== undefined) {
          contributions[`custom.${key}`] = factors.custom[key] * weight;
        }
      }
    }

    return contributions;
  }

  /**
   * Convert numeric score to level
   */
  private scoreToLevel(score: number): ConfidenceLevel {
    if (score >= 0.9) return 'very-high';
    if (score >= 0.75) return 'high';
    if (score >= 0.5) return 'medium';
    if (score >= 0.25) return 'low';
    return 'very-low';
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(result: ConfidenceScore): string {
    const { level, factors, contributions } = result;

    const topContributors = Object.entries(contributions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const weakFactors = Object.entries(factors)
      .filter(([k, v]) => typeof v === 'number' && v < 0.5 && k !== 'custom')
      .map(([name]) => name);

    let explanation = `Confidence: ${level.toUpperCase()} (${(result.score * 100).toFixed(0)}%). `;

    explanation += `Top factors: ${topContributors.join(', ')}. `;

    if (weakFactors.length > 0) {
      explanation += `Areas for improvement: ${weakFactors.join(', ')}.`;
    }

    return explanation;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(factors: ConfidenceFactors): string[] {
    const recommendations: string[] = [];

    if (factors.formatCompliance < 0.6) {
      recommendations.push('Improve output format adherence to expected structure');
    }

    if (factors.completeness < 0.6) {
      recommendations.push('Provide more complete response covering all aspects of the input');
    }

    if (factors.inputAlignment < 0.6) {
      recommendations.push('Better address the specific requirements from the input');
    }

    if (factors.internalConsistency < 0.6) {
      recommendations.push('Ensure logical consistency throughout the response');
    }

    if (factors.specificity < 0.5) {
      recommendations.push('Add more specific details, examples, and concrete references');
    }

    if (factors.sourceAttribution < 0.5) {
      recommendations.push('Include source references or documentation links where appropriate');
    }

    return recommendations;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'this', 'that', 'these', 'those', 'it', 'its', 'what', 'which', 'who',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Quick scoring (returns just the score)
   */
  quickScore(input: ScoringInput): number {
    return this.score(input, {
      includeExplanation: false,
      includeRecommendations: false,
    }).score;
  }

  /**
   * Score multiple outputs
   */
  scoreMany(inputs: ScoringInput[], options?: ScoringOptions): ConfidenceScore[] {
    return inputs.map(input => this.score(input, options));
  }

  /**
   * Get aggregate confidence for a batch
   */
  aggregateConfidence(scores: ConfidenceScore[]): {
    mean: number;
    min: number;
    max: number;
    level: ConfidenceLevel;
  } {
    if (scores.length === 0) {
      return { mean: 0, min: 0, max: 0, level: 'very-low' };
    }

    const values = scores.map(s => s.score);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      mean,
      min,
      max,
      level: this.scoreToLevel(mean),
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global confidence scorer instance */
export const confidenceScorer = new ConfidenceScorer();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Score an output's confidence
 */
export function scoreConfidence(
  input: ScoringInput,
  options?: ScoringOptions
): ConfidenceScore {
  return confidenceScorer.score(input, options);
}

/**
 * Quick confidence score
 */
export function quickConfidenceScore(input: ScoringInput): number {
  return confidenceScorer.quickScore(input);
}

/**
 * Score multiple outputs
 */
export function scoreConfidenceMany(
  inputs: ScoringInput[],
  options?: ScoringOptions
): ConfidenceScore[] {
  return confidenceScorer.scoreMany(inputs, options);
}

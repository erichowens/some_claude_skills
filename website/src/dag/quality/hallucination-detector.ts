/**
 * Hallucination Detector
 *
 * Detects fabricated or unsupported content in agent outputs.
 * Flags claims, citations, and data that may not be accurate.
 *
 * @module dag/quality/hallucination-detector
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Types of potential hallucinations
 */
export type HallucinationType =
  | 'fabricated-citation'     // Made-up source/reference
  | 'fabricated-data'         // Made-up statistics/numbers
  | 'fabricated-entity'       // Made-up people/companies/products
  | 'unsupported-claim'       // Claim without backing
  | 'temporal-inconsistency'  // Date/time issues
  | 'factual-error'           // Known incorrect statement
  | 'url-fabrication'         // Made-up URLs
  | 'code-fabrication'        // Invented APIs/functions
  | 'quote-fabrication';      // Made-up quotes

/**
 * Risk level for a detection
 */
export type RiskLevel = 'high' | 'medium' | 'low';

/**
 * A single hallucination detection
 */
export interface HallucinationDetection {
  /** Type of potential hallucination */
  type: HallucinationType;

  /** Risk level */
  risk: RiskLevel;

  /** The problematic content */
  content: string;

  /** Location in the output (character offset) */
  offset: number;

  /** Length of the problematic content */
  length: number;

  /** Why this was flagged */
  reason: string;

  /** Confidence in the detection (0-1) */
  confidence: number;

  /** Suggested verification action */
  verification?: string;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Complete detection result
 */
export interface DetectionResult {
  /** Were any hallucinations detected? */
  hasHallucinations: boolean;

  /** Overall hallucination risk (0-1) */
  riskScore: number;

  /** Risk level category */
  riskLevel: RiskLevel;

  /** All detections */
  detections: HallucinationDetection[];

  /** Count by type */
  countByType: Record<HallucinationType, number>;

  /** High-risk detection count */
  highRiskCount: number;

  /** Summary explanation */
  summary: string;

  /** Detection timestamp */
  detectedAt: Date;

  /** Processing time (ms) */
  processingTimeMs: number;
}

/**
 * Detection options
 */
export interface DetectionOptions {
  /** Types to detect (all if not specified) */
  types?: HallucinationType[];

  /** Minimum confidence to report */
  minConfidence?: number;

  /** Context for verification (known facts, etc.) */
  groundTruth?: GroundTruth;

  /** Custom detectors */
  customDetectors?: CustomDetector[];

  /** Skip certain patterns */
  skipPatterns?: RegExp[];
}

/**
 * Ground truth for verification
 */
export interface GroundTruth {
  /** Known valid URLs */
  validUrls?: string[];

  /** Known valid entities */
  validEntities?: string[];

  /** Known valid citations */
  validCitations?: string[];

  /** Current date for temporal checks */
  currentDate?: Date;

  /** Known facts to check against */
  facts?: Record<string, unknown>;

  /** Code APIs that are known to exist */
  knownApis?: string[];
}

/**
 * Custom detector function
 */
export type CustomDetector = (
  text: string,
  groundTruth?: GroundTruth
) => HallucinationDetection[];

// =============================================================================
// DETECTION PATTERNS
// =============================================================================

/**
 * Patterns that may indicate fabricated citations
 */
const CITATION_PATTERNS = [
  // Academic-style citations that look made up
  /\(\s*(?:[A-Z][a-z]+(?:\s+(?:et\s+al|&\s+[A-Z][a-z]+))?),?\s*\d{4}\s*\)/g,
  // "According to X" claims
  /according to\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // "Research shows/found" without citation
  /(?:research|studies?|scientists?|experts?)\s+(?:shows?|found|suggests?|confirms?|proves?)/gi,
];

/**
 * Patterns that may indicate fabricated statistics
 */
const STATISTICS_PATTERNS = [
  // Very specific percentages
  /\b\d{2,3}(?:\.\d{1,2})?\s*%/g,
  // Large specific numbers
  /\b\d{1,3}(?:,\d{3})+\b/g,
  // "X out of Y" claims
  /\b\d+\s+(?:out of|in)\s+\d+\b/gi,
  // "X times more/less"
  /\b\d+(?:\.\d+)?x?\s+(?:times?|fold)\s+(?:more|less|higher|lower|faster|slower)/gi,
];

/**
 * Patterns that may indicate URL fabrication
 */
const URL_PATTERNS = [
  // Standard URLs
  /https?:\/\/[\w-]+(\.[\w-]+)+[^\s)"\]]+/g,
];

/**
 * Patterns for potential fake quotes
 */
const QUOTE_PATTERNS = [
  // Attributed quotes
  /"[^"]{10,}"\s*[-–—]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g,
  // Said/stated quotes
  /(?:said|stated|wrote|noted)\s*[:,"]\s*"[^"]+"/gi,
];

/**
 * Patterns for potential code API fabrication
 */
const CODE_API_PATTERNS = [
  // Function calls
  /\b\w+\.\w+\([^)]*\)/g,
  // Import statements
  /import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/g,
  // Require statements
  /require\s*\(\s*['"][^'"]+['"]\s*\)/g,
];

// =============================================================================
// HALLUCINATION DETECTOR CLASS
// =============================================================================

/**
 * HallucinationDetector identifies potentially fabricated content.
 *
 * @example
 * ```typescript
 * const detector = new HallucinationDetector();
 *
 * const result = detector.detect(agentOutput, {
 *   groundTruth: {
 *     validUrls: ['https://docs.example.com'],
 *     currentDate: new Date(),
 *   },
 * });
 *
 * if (result.hasHallucinations) {
 *   console.warn('Potential hallucinations:', result.detections);
 * }
 * ```
 */
export class HallucinationDetector {
  private customDetectors: CustomDetector[] = [];

  /**
   * Register a custom detector
   */
  registerDetector(detector: CustomDetector): void {
    this.customDetectors.push(detector);
  }

  /**
   * Detect potential hallucinations in text
   */
  detect(text: string, options: DetectionOptions = {}): DetectionResult {
    const startTime = Date.now();
    const detections: HallucinationDetection[] = [];
    const minConfidence = options.minConfidence ?? 0.3;

    // Get types to detect
    const typesToDetect = options.types ?? [
      'fabricated-citation',
      'fabricated-data',
      'fabricated-entity',
      'unsupported-claim',
      'temporal-inconsistency',
      'url-fabrication',
      'code-fabrication',
      'quote-fabrication',
    ];

    // Run detectors based on types
    if (typesToDetect.includes('fabricated-citation')) {
      detections.push(...this.detectFabricatedCitations(text, options.groundTruth));
    }

    if (typesToDetect.includes('fabricated-data')) {
      detections.push(...this.detectFabricatedData(text));
    }

    if (typesToDetect.includes('url-fabrication')) {
      detections.push(...this.detectFabricatedUrls(text, options.groundTruth));
    }

    if (typesToDetect.includes('quote-fabrication')) {
      detections.push(...this.detectFabricatedQuotes(text));
    }

    if (typesToDetect.includes('code-fabrication')) {
      detections.push(...this.detectFabricatedCode(text, options.groundTruth));
    }

    if (typesToDetect.includes('temporal-inconsistency')) {
      detections.push(...this.detectTemporalInconsistencies(text, options.groundTruth));
    }

    if (typesToDetect.includes('unsupported-claim')) {
      detections.push(...this.detectUnsupportedClaims(text));
    }

    // Run custom detectors
    for (const detector of [...this.customDetectors, ...(options.customDetectors || [])]) {
      detections.push(...detector(text, options.groundTruth));
    }

    // Filter by skip patterns
    let filteredDetections = detections;
    if (options.skipPatterns) {
      filteredDetections = detections.filter(d =>
        !options.skipPatterns!.some(p => p.test(d.content))
      );
    }

    // Filter by minimum confidence
    filteredDetections = filteredDetections.filter(d => d.confidence >= minConfidence);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(filteredDetections);
    const riskLevel = this.riskScoreToLevel(riskScore);

    // Count by type
    const countByType = this.countByType(filteredDetections);

    // Count high risk
    const highRiskCount = filteredDetections.filter(d => d.risk === 'high').length;

    return {
      hasHallucinations: filteredDetections.length > 0,
      riskScore,
      riskLevel,
      detections: filteredDetections,
      countByType,
      highRiskCount,
      summary: this.generateSummary(filteredDetections),
      detectedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Detect potentially fabricated citations
   */
  private detectFabricatedCitations(
    text: string,
    groundTruth?: GroundTruth
  ): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];

    for (const pattern of CITATION_PATTERNS) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const content = match[0];

        // Skip if in ground truth
        if (groundTruth?.validCitations?.includes(content)) {
          continue;
        }

        // Analyze the citation
        const confidence = this.assessCitationConfidence(content);

        if (confidence > 0.3) {
          detections.push({
            type: 'fabricated-citation',
            risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
            content,
            offset: match.index,
            length: content.length,
            reason: 'Citation pattern detected without verification',
            confidence,
            verification: 'Verify the source exists and contains the referenced information',
          });
        }
      }
    }

    return detections;
  }

  private assessCitationConfidence(citation: string): number {
    let confidence = 0.5;

    // "et al" citations are more likely to be academic-style fabrications
    if (/et\s+al/i.test(citation)) {
      confidence += 0.2;
    }

    // Very recent years might be made up
    const yearMatch = citation.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const currentYear = new Date().getFullYear();
      if (year > currentYear) {
        confidence += 0.3; // Future year is suspicious
      } else if (year === currentYear || year === currentYear - 1) {
        confidence += 0.1; // Recent years are harder to verify
      }
    }

    return Math.min(1, confidence);
  }

  /**
   * Detect potentially fabricated statistics/data
   */
  private detectFabricatedData(text: string): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];

    for (const pattern of STATISTICS_PATTERNS) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const content = match[0];
        const confidence = this.assessDataConfidence(content, text, match.index);

        if (confidence > 0.4) {
          detections.push({
            type: 'fabricated-data',
            risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
            content,
            offset: match.index,
            length: content.length,
            reason: 'Specific statistic without clear source',
            confidence,
            verification: 'Verify the statistic from a reliable source',
          });
        }
      }
    }

    return detections;
  }

  private assessDataConfidence(data: string, text: string, offset: number): number {
    let confidence = 0.4;

    // Very specific percentages (e.g., 73.42%) are more suspicious
    if (/\d{2}\.\d{2}%/.test(data)) {
      confidence += 0.2;
    }

    // Check if there's a source nearby
    const contextStart = Math.max(0, offset - 100);
    const contextEnd = Math.min(text.length, offset + data.length + 100);
    const context = text.slice(contextStart, contextEnd);

    // If there's a citation nearby, lower confidence
    if (/\(\d{4}\)|source:|according to|study|research/i.test(context)) {
      confidence -= 0.2;
    }

    // Round numbers are less suspicious
    if (/^\d+0{2,}$/.test(data.replace(/,/g, ''))) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Detect potentially fabricated URLs
   */
  private detectFabricatedUrls(
    text: string,
    groundTruth?: GroundTruth
  ): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];

    for (const pattern of URL_PATTERNS) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const url = match[0];

        // Skip if in ground truth
        if (groundTruth?.validUrls?.some(valid =>
          url.startsWith(valid) || valid.startsWith(url)
        )) {
          continue;
        }

        const confidence = this.assessUrlConfidence(url);

        if (confidence > 0.3) {
          detections.push({
            type: 'url-fabrication',
            risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
            content: url,
            offset: match.index,
            length: url.length,
            reason: 'URL may not exist or be accessible',
            confidence,
            verification: 'Check if the URL is accessible and contains expected content',
          });
        }
      }
    }

    return detections;
  }

  private assessUrlConfidence(url: string): number {
    let confidence = 0.3;

    try {
      const parsed = new URL(url);

      // Non-standard TLDs
      if (!/\.(com|org|net|io|dev|co|edu|gov|app)$/i.test(parsed.hostname)) {
        confidence += 0.1;
      }

      // Very long paths
      if (parsed.pathname.split('/').length > 5) {
        confidence += 0.1;
      }

      // Random-looking path segments
      if (/\/[a-f0-9]{8,}/.test(parsed.pathname)) {
        confidence += 0.1;
      }

      // Fake-looking domains
      if (/example|test|demo|fake|sample/i.test(parsed.hostname)) {
        confidence += 0.3;
      }

      // Known documentation domains are less suspicious
      if (/github\.com|stackoverflow\.com|docs\.|documentation|wiki/i.test(url)) {
        confidence -= 0.2;
      }
    } catch {
      confidence = 0.8; // Invalid URL is highly suspicious
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Detect potentially fabricated quotes
   */
  private detectFabricatedQuotes(text: string): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];

    for (const pattern of QUOTE_PATTERNS) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const content = match[0];
        const confidence = this.assessQuoteConfidence(content);

        if (confidence > 0.4) {
          detections.push({
            type: 'quote-fabrication',
            risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
            content,
            offset: match.index,
            length: content.length,
            reason: 'Attributed quote may not be accurate',
            confidence,
            verification: 'Verify the quote against original source',
          });
        }
      }
    }

    return detections;
  }

  private assessQuoteConfidence(quote: string): number {
    let confidence = 0.5;

    // Very long quotes are more suspicious
    const quoteText = quote.match(/"([^"]+)"/)?.[1] || '';
    if (quoteText.length > 200) {
      confidence += 0.2;
    }

    // Generic-sounding names
    if (/John|Jane|Smith|Doe|Expert|Researcher/i.test(quote)) {
      confidence += 0.2;
    }

    return Math.min(1, confidence);
  }

  /**
   * Detect potentially fabricated code/APIs
   */
  private detectFabricatedCode(
    text: string,
    groundTruth?: GroundTruth
  ): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];

    // Only check within code blocks
    const codeBlocks = text.match(/```[\s\S]*?```|`[^`]+`/g) || [];

    for (const block of codeBlocks) {
      for (const pattern of CODE_API_PATTERNS) {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(block)) !== null) {
          const content = match[0];

          // Skip if in known APIs
          if (groundTruth?.knownApis?.some(api => content.includes(api))) {
            continue;
          }

          const confidence = this.assessCodeConfidence(content);

          if (confidence > 0.5) {
            detections.push({
              type: 'code-fabrication',
              risk: confidence > 0.7 ? 'high' : 'medium',
              content,
              offset: text.indexOf(content),
              length: content.length,
              reason: 'API or function may not exist',
              confidence,
              verification: 'Verify the API exists in the library documentation',
            });
          }
        }
      }
    }

    return detections;
  }

  private assessCodeConfidence(code: string): number {
    let confidence = 0.4;

    // Unusual function names
    if (/\b(doStuff|processData|handleThing|magicMethod)\b/i.test(code)) {
      confidence += 0.3;
    }

    // Very long method chains
    if ((code.match(/\./g) || []).length > 4) {
      confidence += 0.1;
    }

    // Known standard libraries reduce confidence
    if (/console|Math|Array|Object|String|JSON|fetch|require\('fs'\)|require\('path'\)/i.test(code)) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Detect temporal inconsistencies
   */
  private detectTemporalInconsistencies(
    text: string,
    groundTruth?: GroundTruth
  ): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];
    const currentDate = groundTruth?.currentDate || new Date();
    const currentYear = currentDate.getFullYear();

    // Find year references
    const yearPattern = /\b(19|20)\d{2}\b/g;
    let match;
    while ((match = yearPattern.exec(text)) !== null) {
      const year = parseInt(match[0]);

      if (year > currentYear) {
        detections.push({
          type: 'temporal-inconsistency',
          risk: 'high',
          content: match[0],
          offset: match.index,
          length: match[0].length,
          reason: 'Reference to future year',
          confidence: 0.9,
          verification: 'Check if this is an intentional prediction or error',
        });
      } else if (year > currentYear - 2) {
        // Check context for "will be" or "upcoming"
        const contextStart = Math.max(0, match.index - 50);
        const context = text.slice(contextStart, match.index + 50);
        if (/will|upcoming|planned|expected|announced/i.test(context)) {
          // This might be intentional prediction
          continue;
        }
      }
    }

    return detections;
  }

  /**
   * Detect unsupported claims
   */
  private detectUnsupportedClaims(text: string): HallucinationDetection[] {
    const detections: HallucinationDetection[] = [];

    // Strong claims without hedging
    const strongClaimPatterns = [
      /\b(always|never|all|none|every|no one)\s+\w+/gi,
      /\b(definitely|certainly|undoubtedly|clearly|obviously)\b/gi,
      /\b(the best|the worst|the only|the first|the most)\b/gi,
      /\b(proven|guaranteed|ensured|confirmed)\b/gi,
    ];

    for (const pattern of strongClaimPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const content = match[0];
        const offset = match.index;

        // Check for nearby evidence
        const contextStart = Math.max(0, offset - 100);
        const contextEnd = Math.min(text.length, offset + content.length + 100);
        const context = text.slice(contextStart, contextEnd);

        // If there's evidence nearby, skip
        if (/because|since|according|study|research|data|source/i.test(context)) {
          continue;
        }

        detections.push({
          type: 'unsupported-claim',
          risk: 'medium',
          content,
          offset,
          length: content.length,
          reason: 'Strong claim without supporting evidence',
          confidence: 0.5,
          verification: 'Add supporting evidence or soften the claim',
        });
      }
    }

    return detections;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(detections: HallucinationDetection[]): number {
    if (detections.length === 0) return 0;

    const riskWeights: Record<RiskLevel, number> = {
      high: 1.0,
      medium: 0.5,
      low: 0.2,
    };

    const totalRisk = detections.reduce((sum, d) =>
      sum + riskWeights[d.risk] * d.confidence, 0
    );

    // Normalize to 0-1, capped at reasonable levels
    return Math.min(1, totalRisk / 5);
  }

  /**
   * Convert risk score to level
   */
  private riskScoreToLevel(score: number): RiskLevel {
    if (score >= 0.7) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Count detections by type
   */
  private countByType(
    detections: HallucinationDetection[]
  ): Record<HallucinationType, number> {
    const counts = {} as Record<HallucinationType, number>;

    for (const detection of detections) {
      counts[detection.type] = (counts[detection.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Generate summary of detections
   */
  private generateSummary(detections: HallucinationDetection[]): string {
    if (detections.length === 0) {
      return 'No potential hallucinations detected.';
    }

    const highRisk = detections.filter(d => d.risk === 'high');
    const types = [...new Set(detections.map(d => d.type))];

    let summary = `Found ${detections.length} potential issue(s). `;

    if (highRisk.length > 0) {
      summary += `${highRisk.length} high-risk detection(s). `;
    }

    summary += `Types: ${types.join(', ')}.`;

    return summary;
  }

  /**
   * Quick check for hallucinations
   */
  hasHallucinations(text: string, options?: DetectionOptions): boolean {
    return this.detect(text, options).hasHallucinations;
  }

  /**
   * Get risk level for text
   */
  getRiskLevel(text: string, options?: DetectionOptions): RiskLevel {
    return this.detect(text, options).riskLevel;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global hallucination detector instance */
export const hallucinationDetector = new HallucinationDetector();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Detect hallucinations in text
 */
export function detectHallucinations(
  text: string,
  options?: DetectionOptions
): DetectionResult {
  return hallucinationDetector.detect(text, options);
}

/**
 * Quick hallucination check
 */
export function hasHallucinations(
  text: string,
  options?: DetectionOptions
): boolean {
  return hallucinationDetector.hasHallucinations(text, options);
}

/**
 * Get hallucination risk level
 */
export function getHallucinationRisk(
  text: string,
  options?: DetectionOptions
): RiskLevel {
  return hallucinationDetector.getRiskLevel(text, options);
}

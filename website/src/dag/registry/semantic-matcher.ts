/**
 * Semantic Matcher
 *
 * Finds skills for natural language requests using semantic similarity.
 * Combines TF-IDF-like scoring with activation/exclusion keyword analysis.
 *
 * @module dag/registry/semantic-matcher
 */

import {
  skillRegistry,
  type SkillRegistryEntry,
} from './skill-registry';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Match result with scoring details
 */
export interface MatchResult {
  /** The matched skill entry */
  entry: SkillRegistryEntry;

  /** Overall match score (0-1) */
  score: number;

  /** Breakdown of score components */
  scoreBreakdown: ScoreBreakdown;

  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';

  /** Why this skill was matched */
  matchReason: string;
}

/**
 * Score breakdown for debugging/explanation
 */
export interface ScoreBreakdown {
  /** Score from keyword matches */
  keywordScore: number;

  /** Score from semantic similarity */
  semanticScore: number;

  /** Score from tag matches */
  tagScore: number;

  /** Score from category relevance */
  categoryScore: number;

  /** Score from performance history */
  performanceScore: number;

  /** Penalty from exclusion matches */
  exclusionPenalty: number;
}

/**
 * Matching options
 */
export interface MatchOptions {
  /** Maximum results to return */
  maxResults?: number;

  /** Minimum score threshold (0-1) */
  minScore?: number;

  /** Minimum confidence level */
  minConfidence?: 'high' | 'medium' | 'low';

  /** Prefer skills with higher success rates */
  preferHighPerformance?: boolean;

  /** Filter to specific categories */
  categories?: string[];

  /** Boost specific skills */
  boostSkills?: string[];

  /** Exclude specific skills */
  excludeSkills?: string[];

  /** Include score breakdown in results */
  includeBreakdown?: boolean;
}

/**
 * Extracted intent from query
 */
export interface QueryIntent {
  /** Main action verbs */
  actions: string[];

  /** Target objects/domains */
  targets: string[];

  /** Modifiers/qualifiers */
  modifiers: string[];

  /** Detected task type */
  taskType: TaskType;

  /** Extracted keywords */
  keywords: string[];
}

/**
 * Detected task type
 */
export type TaskType =
  | 'create'      // Build something new
  | 'analyze'     // Analyze/review something
  | 'fix'         // Fix/debug something
  | 'optimize'    // Improve/optimize something
  | 'research'    // Research/learn about something
  | 'transform'   // Convert/transform something
  | 'unknown';    // Unclear intent

// =============================================================================
// SEMANTIC MATCHER CLASS
// =============================================================================

/**
 * SemanticMatcher finds skills for natural language queries.
 *
 * @example
 * ```typescript
 * const matcher = new SemanticMatcher();
 *
 * // Find skills for a request
 * const matches = matcher.match('Build a chatbot with RAG for customer support');
 *
 * // Get top match with explanation
 * const best = matches[0];
 * console.log(best.matchReason); // "High activation keyword match: 'chatbot', 'RAG'"
 * ```
 */
export class SemanticMatcher {
  // Weights for different score components
  private readonly weights = {
    keyword: 0.35,
    semantic: 0.25,
    tag: 0.15,
    category: 0.10,
    performance: 0.15,
  };

  // Action word mappings to task types
  private readonly actionMappings: Record<string, TaskType> = {
    // Create
    build: 'create',
    create: 'create',
    make: 'create',
    develop: 'create',
    implement: 'create',
    write: 'create',
    design: 'create',
    generate: 'create',
    construct: 'create',
    add: 'create',

    // Analyze
    analyze: 'analyze',
    review: 'analyze',
    check: 'analyze',
    evaluate: 'analyze',
    assess: 'analyze',
    audit: 'analyze',
    inspect: 'analyze',
    examine: 'analyze',

    // Fix
    fix: 'fix',
    debug: 'fix',
    repair: 'fix',
    solve: 'fix',
    resolve: 'fix',
    troubleshoot: 'fix',
    correct: 'fix',

    // Optimize
    optimize: 'optimize',
    improve: 'optimize',
    enhance: 'optimize',
    refactor: 'optimize',
    upgrade: 'optimize',
    boost: 'optimize',
    speed: 'optimize',

    // Research
    research: 'research',
    learn: 'research',
    understand: 'research',
    explore: 'research',
    discover: 'research',
    find: 'research',
    search: 'research',
    investigate: 'research',

    // Transform
    convert: 'transform',
    transform: 'transform',
    migrate: 'transform',
    translate: 'transform',
    port: 'transform',
    export: 'transform',
    import: 'transform',
  };

  // Domain keywords for better matching
  private readonly domainKeywords: Record<string, string[]> = {
    'AI & Machine Learning': ['ai', 'ml', 'llm', 'gpt', 'claude', 'model', 'neural', 'embedding', 'rag', 'chatbot', 'agent'],
    'Web Development': ['web', 'frontend', 'backend', 'api', 'react', 'next', 'html', 'css', 'http', 'rest'],
    'Design': ['design', 'ui', 'ux', 'visual', 'color', 'layout', 'typography', 'brand'],
    'DevOps & Infrastructure': ['devops', 'deploy', 'ci', 'cd', 'docker', 'kubernetes', 'terraform', 'aws'],
    'Mobile Development': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
    'Data Engineering': ['data', 'pipeline', 'etl', 'warehouse', 'spark', 'kafka', 'airflow'],
    'Security': ['security', 'auth', 'oauth', 'encryption', 'vulnerability', 'penetration'],
    'Testing': ['test', 'qa', 'automation', 'coverage', 'unit', 'integration', 'e2e'],
  };

  // Stop words to filter out
  private readonly stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
    'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
    'now', 'here', 'there', 'then', 'once', 'if', 'into', 'about',
    'out', 'up', 'down', 'over', 'under', 'again', 'further', 'through',
    'want', 'need', 'help', 'please', 'using', 'use',
  ]);

  /**
   * Match skills to a natural language query
   */
  match(query: string, options: MatchOptions = {}): MatchResult[] {
    const {
      maxResults = 5,
      minScore = 0.1,
      minConfidence,
      preferHighPerformance = true,
      categories,
      boostSkills = [],
      excludeSkills = [],
    } = options;

    // Parse query intent
    const intent = this.parseIntent(query);

    // Get candidate skills
    let candidates = skillRegistry.getAll().filter(e => e.isActive);

    // Apply category filter
    if (categories && categories.length > 0) {
      const lowerCats = categories.map(c => c.toLowerCase());
      candidates = candidates.filter(e =>
        lowerCats.includes(e.skill.category.toLowerCase())
      );
    }

    // Exclude specific skills
    if (excludeSkills.length > 0) {
      const excludeSet = new Set(excludeSkills);
      candidates = candidates.filter(e => !excludeSet.has(e.skill.id));
    }

    // Score each candidate
    const results: MatchResult[] = [];

    for (const entry of candidates) {
      const breakdown = this.calculateScoreBreakdown(entry, intent, query);
      let score = this.calculateFinalScore(breakdown);

      // Apply performance preference
      if (preferHighPerformance && entry.metrics.invocationCount > 0) {
        score *= (1 + entry.metrics.successRate * 0.1);
      }

      // Apply boost
      if (boostSkills.includes(entry.skill.id)) {
        score *= 1.2;
      }

      // Normalize score to 0-1
      score = Math.min(1, Math.max(0, score));

      if (score >= minScore) {
        const confidence = this.determineConfidence(score);
        const matchReason = this.generateMatchReason(entry, breakdown);

        if (!minConfidence || this.meetsConfidenceThreshold(confidence, minConfidence)) {
          results.push({
            entry,
            score,
            scoreBreakdown: breakdown,
            confidence,
            matchReason,
          });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Limit results
    return results.slice(0, maxResults);
  }

  /**
   * Parse intent from natural language query
   */
  parseIntent(query: string): QueryIntent {
    const lower = query.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 1);

    // Extract actions
    const actions: string[] = [];
    let taskType: TaskType = 'unknown';

    for (const word of words) {
      if (this.actionMappings[word]) {
        actions.push(word);
        taskType = this.actionMappings[word];
      }
    }

    // Extract keywords (non-stop words)
    const keywords = words.filter(w =>
      !this.stopWords.has(w) &&
      w.length > 2
    );

    // Extract targets (nouns that follow verbs)
    const targets: string[] = [];
    const modifiers: string[] = [];

    // Simple heuristic: words after action words are targets
    for (let i = 0; i < words.length; i++) {
      if (this.actionMappings[words[i]] && i + 1 < words.length) {
        const nextWord = words[i + 1];
        if (!this.stopWords.has(nextWord)) {
          targets.push(nextWord);
        }
      }
    }

    // Modifiers are adjectives/adverbs (simple heuristic: words ending in -ly, -ful, etc.)
    for (const word of words) {
      if (
        word.endsWith('ly') ||
        word.endsWith('ful') ||
        word.endsWith('able') ||
        word.endsWith('ive') ||
        ['fast', 'slow', 'simple', 'complex', 'advanced', 'basic'].includes(word)
      ) {
        modifiers.push(word);
      }
    }

    return {
      actions,
      targets,
      modifiers,
      taskType,
      keywords,
    };
  }

  /**
   * Calculate score breakdown for a skill
   */
  private calculateScoreBreakdown(
    entry: SkillRegistryEntry,
    intent: QueryIntent,
    query: string
  ): ScoreBreakdown {
    const lower = query.toLowerCase();

    // Keyword score
    let keywordScore = 0;
    for (const keyword of intent.keywords) {
      // Activation keywords
      if (entry.activationKeywords.some(k => k.includes(keyword) || keyword.includes(k))) {
        keywordScore += 0.3;
      }
      // Title match
      if (entry.skill.title.toLowerCase().includes(keyword)) {
        keywordScore += 0.25;
      }
      // Description match
      if (entry.skill.description.toLowerCase().includes(keyword)) {
        keywordScore += 0.1;
      }
    }
    keywordScore = Math.min(1, keywordScore);

    // Semantic score based on domain matching
    let semanticScore = 0;
    for (const [category, domainWords] of Object.entries(this.domainKeywords)) {
      if (entry.skill.category.toLowerCase().includes(category.toLowerCase())) {
        for (const domainWord of domainWords) {
          if (lower.includes(domainWord)) {
            semanticScore += 0.15;
          }
        }
      }
    }
    semanticScore = Math.min(1, semanticScore);

    // Tag score
    let tagScore = 0;
    for (const tag of entry.skill.tags) {
      const lowerTag = tag.toLowerCase();
      if (lower.includes(lowerTag) || intent.keywords.includes(lowerTag)) {
        tagScore += 0.2;
      }
    }
    tagScore = Math.min(1, tagScore);

    // Category score (if query mentions the category)
    let categoryScore = 0;
    const categoryLower = entry.skill.category.toLowerCase();
    const categoryWords = categoryLower.split(/[&\s]+/).filter(w => w.length > 2);
    for (const word of categoryWords) {
      if (lower.includes(word)) {
        categoryScore += 0.25;
      }
    }
    categoryScore = Math.min(1, categoryScore);

    // Performance score
    const performanceScore = entry.metrics.invocationCount > 0
      ? entry.metrics.successRate
      : 0.5; // Neutral for unused skills

    // Exclusion penalty
    let exclusionPenalty = 0;
    for (const exclusion of entry.exclusionKeywords) {
      if (lower.includes(exclusion)) {
        exclusionPenalty += 0.3;
      }
    }
    exclusionPenalty = Math.min(0.8, exclusionPenalty);

    return {
      keywordScore,
      semanticScore,
      tagScore,
      categoryScore,
      performanceScore,
      exclusionPenalty,
    };
  }

  /**
   * Calculate final score from breakdown
   */
  private calculateFinalScore(breakdown: ScoreBreakdown): number {
    const weighted =
      breakdown.keywordScore * this.weights.keyword +
      breakdown.semanticScore * this.weights.semantic +
      breakdown.tagScore * this.weights.tag +
      breakdown.categoryScore * this.weights.category +
      breakdown.performanceScore * this.weights.performance;

    return Math.max(0, weighted - breakdown.exclusionPenalty);
  }

  /**
   * Determine confidence level from score
   */
  private determineConfidence(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Check if confidence meets threshold
   */
  private meetsConfidenceThreshold(
    actual: 'high' | 'medium' | 'low',
    required: 'high' | 'medium' | 'low'
  ): boolean {
    const levels = { low: 0, medium: 1, high: 2 };
    return levels[actual] >= levels[required];
  }

  /**
   * Generate human-readable match reason
   */
  private generateMatchReason(entry: SkillRegistryEntry, breakdown: ScoreBreakdown): string {
    const reasons: string[] = [];

    if (breakdown.keywordScore >= 0.3) {
      const matchedKeywords = entry.activationKeywords.slice(0, 3).join(', ');
      reasons.push(`Matches keywords: ${matchedKeywords}`);
    }

    if (breakdown.tagScore >= 0.2) {
      const matchedTags = entry.skill.tags.slice(0, 3).join(', ');
      reasons.push(`Relevant tags: ${matchedTags}`);
    }

    if (breakdown.semanticScore >= 0.2) {
      reasons.push(`Strong domain fit: ${entry.skill.category}`);
    }

    if (breakdown.performanceScore >= 0.8 && entry.metrics.invocationCount > 0) {
      reasons.push(`High success rate: ${Math.round(breakdown.performanceScore * 100)}%`);
    }

    if (breakdown.exclusionPenalty > 0) {
      reasons.push(`(Partial exclusion match)`);
    }

    return reasons.length > 0
      ? reasons.join('; ')
      : `General category match: ${entry.skill.category}`;
  }

  /**
   * Find the single best match
   */
  matchOne(query: string, options?: Omit<MatchOptions, 'maxResults'>): MatchResult | null {
    const results = this.match(query, { ...options, maxResults: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Check if query matches a specific skill
   */
  isMatch(query: string, skillId: string, minScore = 0.3): boolean {
    const results = this.match(query, { maxResults: 20, minScore });
    return results.some(r => r.entry.skill.id === skillId);
  }

  /**
   * Get suggested follow-up skills based on matched skill
   */
  getSuggestedFollowups(skillId: string): SkillRegistryEntry[] {
    const entry = skillRegistry.get(skillId);
    if (!entry || !entry.skill.pairsWith) return [];

    return entry.skill.pairsWith
      .map(pair => skillRegistry.get(pair.skill))
      .filter((e): e is SkillRegistryEntry => e !== undefined);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global semantic matcher instance */
export const semanticMatcher = new SemanticMatcher();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Match skills to query using global matcher
 */
export function matchSkills(query: string, options?: MatchOptions): MatchResult[] {
  return semanticMatcher.match(query, options);
}

/**
 * Match single best skill
 */
export function matchBestSkill(query: string): MatchResult | null {
  return semanticMatcher.matchOne(query);
}

/**
 * Parse query intent
 */
export function parseQueryIntent(query: string): QueryIntent {
  return semanticMatcher.parseIntent(query);
}

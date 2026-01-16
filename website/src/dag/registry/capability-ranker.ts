/**
 * Capability Ranker
 *
 * Ranks skill matches by fit, performance, and capability requirements.
 * Provides advanced ranking algorithms for optimal skill selection.
 *
 * @module dag/registry/capability-ranker
 */

import {
  skillRegistry,
  type SkillRegistryEntry,
  type SkillCapabilities,
} from './skill-registry';
import {
  semanticMatcher,
  type MatchResult,
  type MatchOptions,
} from './semantic-matcher';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Ranking criteria with weights
 */
export interface RankingCriteria {
  /** Weight for semantic match score (0-1) */
  semanticWeight?: number;

  /** Weight for capability match (0-1) */
  capabilityWeight?: number;

  /** Weight for performance history (0-1) */
  performanceWeight?: number;

  /** Weight for recency (recently used skills) (0-1) */
  recencyWeight?: number;

  /** Weight for popularity (frequently used skills) (0-1) */
  popularityWeight?: number;

  /** Weight for specificity (prefer specific over general) (0-1) */
  specificityWeight?: number;
}

/**
 * Required capabilities for task
 */
export interface RequiredCapabilities {
  /** Task needs file reading */
  needsRead?: boolean;

  /** Task needs file writing */
  needsWrite?: boolean;

  /** Task needs bash execution */
  needsBash?: boolean;

  /** Task needs web access */
  needsWeb?: boolean;

  /** Task needs MCP tools */
  needsMcp?: boolean;

  /** Specific tools required */
  requiredTools?: string[];

  /** Preferred domains */
  preferredDomains?: string[];
}

/**
 * Extended ranking result
 */
export interface RankedResult extends MatchResult {
  /** Final rank (1 = best) */
  rank: number;

  /** Breakdown of ranking scores */
  rankingBreakdown: RankingBreakdown;

  /** Capability match assessment */
  capabilityMatch: CapabilityMatch;
}

/**
 * Breakdown of ranking components
 */
export interface RankingBreakdown {
  /** Score from semantic matching */
  semanticScore: number;

  /** Score from capability matching */
  capabilityScore: number;

  /** Score from performance history */
  performanceScore: number;

  /** Score from recency */
  recencyScore: number;

  /** Score from popularity */
  popularityScore: number;

  /** Score from specificity */
  specificityScore: number;

  /** Final combined score */
  finalScore: number;
}

/**
 * Capability match assessment
 */
export interface CapabilityMatch {
  /** Does skill meet all required capabilities */
  meetsRequirements: boolean;

  /** List of matched capabilities */
  matchedCapabilities: string[];

  /** List of missing capabilities */
  missingCapabilities: string[];

  /** Capability match percentage (0-1) */
  matchPercentage: number;
}

/**
 * Skill comparison result
 */
export interface ComparisonResult {
  /** Skills being compared */
  skills: [SkillRegistryEntry, SkillRegistryEntry];

  /** Which skill is better for the query (-1 = first, 0 = tie, 1 = second) */
  winner: -1 | 0 | 1;

  /** Score difference */
  scoreDifference: number;

  /** Explanation of comparison */
  explanation: string;

  /** Detailed comparison of aspects */
  aspects: {
    name: string;
    skill1Score: number;
    skill2Score: number;
    better: 'skill1' | 'skill2' | 'tie';
  }[];
}

// =============================================================================
// CAPABILITY RANKER CLASS
// =============================================================================

/**
 * CapabilityRanker provides advanced ranking for skill selection.
 *
 * @example
 * ```typescript
 * const ranker = new CapabilityRanker();
 *
 * // Rank skills for a query with capability requirements
 * const ranked = ranker.rank('Build a REST API', {
 *   capabilities: { needsWrite: true, needsBash: true }
 * });
 *
 * // Compare two skills
 * const comparison = ranker.compare(
 *   'ai-engineer',
 *   'backend-architect',
 *   'Build a chatbot API'
 * );
 * ```
 */
export class CapabilityRanker {
  // Default ranking weights
  private readonly defaultWeights: Required<RankingCriteria> = {
    semanticWeight: 0.35,
    capabilityWeight: 0.25,
    performanceWeight: 0.15,
    recencyWeight: 0.05,
    popularityWeight: 0.10,
    specificityWeight: 0.10,
  };

  /**
   * Rank skills for a query
   */
  rank(
    query: string,
    options: {
      capabilities?: RequiredCapabilities;
      criteria?: RankingCriteria;
      matchOptions?: MatchOptions;
      maxResults?: number;
    } = {}
  ): RankedResult[] {
    const {
      capabilities = {},
      criteria = {},
      matchOptions = {},
      maxResults = 10,
    } = options;

    // Merge criteria with defaults
    const weights = { ...this.defaultWeights, ...criteria };

    // Get semantic matches
    const matches = semanticMatcher.match(query, {
      ...matchOptions,
      maxResults: maxResults * 2, // Get more to filter by capability
    });

    // Calculate capability matches and rankings
    const ranked: RankedResult[] = matches.map(match => {
      const capabilityMatch = this.assessCapabilityMatch(
        match.entry.capabilities,
        capabilities
      );

      const rankingBreakdown = this.calculateRankingScores(
        match,
        capabilityMatch,
        weights
      );

      return {
        ...match,
        rank: 0, // Will be set after sorting
        rankingBreakdown,
        capabilityMatch,
      };
    });

    // Sort by final score
    ranked.sort((a, b) => b.rankingBreakdown.finalScore - a.rankingBreakdown.finalScore);

    // Assign ranks
    ranked.forEach((r, i) => {
      r.rank = i + 1;
    });

    // Filter to max results
    return ranked.slice(0, maxResults);
  }

  /**
   * Assess how well a skill's capabilities match requirements
   */
  private assessCapabilityMatch(
    skillCaps: SkillCapabilities,
    required: RequiredCapabilities
  ): CapabilityMatch {
    const matched: string[] = [];
    const missing: string[] = [];

    // Check each capability
    const checks: [boolean | undefined, boolean, string][] = [
      [required.needsRead, skillCaps.canRead, 'read'],
      [required.needsWrite, skillCaps.canWrite, 'write'],
      [required.needsBash, skillCaps.canBash, 'bash'],
      [required.needsWeb, skillCaps.canWeb, 'web'],
      [required.needsMcp, skillCaps.canMcp, 'mcp'],
    ];

    for (const [needed, has, name] of checks) {
      if (needed) {
        if (has) {
          matched.push(name);
        } else {
          missing.push(name);
        }
      }
    }

    // Check required tools
    if (required.requiredTools) {
      for (const tool of required.requiredTools) {
        if (skillCaps.primaryTools.some(t =>
          t.toLowerCase().includes(tool.toLowerCase())
        )) {
          matched.push(`tool:${tool}`);
        } else {
          missing.push(`tool:${tool}`);
        }
      }
    }

    // Check preferred domains
    if (required.preferredDomains) {
      for (const domain of required.preferredDomains) {
        if (skillCaps.domains.some(d =>
          d.toLowerCase().includes(domain.toLowerCase())
        )) {
          matched.push(`domain:${domain}`);
        }
      }
    }

    const total = matched.length + missing.length;
    const matchPercentage = total > 0 ? matched.length / total : 1;

    return {
      meetsRequirements: missing.length === 0,
      matchedCapabilities: matched,
      missingCapabilities: missing,
      matchPercentage,
    };
  }

  /**
   * Calculate ranking scores
   */
  private calculateRankingScores(
    match: MatchResult,
    capabilityMatch: CapabilityMatch,
    weights: Required<RankingCriteria>
  ): RankingBreakdown {
    const entry = match.entry;
    const metrics = entry.metrics;

    // Semantic score from matcher
    const semanticScore = match.score;

    // Capability score
    const capabilityScore = capabilityMatch.matchPercentage;

    // Performance score (success rate)
    const performanceScore = metrics.invocationCount > 0
      ? metrics.successRate
      : 0.5; // Neutral for unused skills

    // Recency score (time since last use)
    let recencyScore = 0.5; // Neutral default
    if (metrics.lastUsed) {
      const hoursSinceUse = (Date.now() - metrics.lastUsed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUse < 1) {
        recencyScore = 1.0;
      } else if (hoursSinceUse < 24) {
        recencyScore = 0.8;
      } else if (hoursSinceUse < 168) { // 1 week
        recencyScore = 0.6;
      } else {
        recencyScore = 0.4;
      }
    }

    // Popularity score (invocation count, normalized)
    // Assume max popular skill has ~1000 invocations
    const popularityScore = Math.min(1, metrics.invocationCount / 1000);

    // Specificity score (fewer activation keywords = more specific)
    const specificityScore = Math.max(0, 1 - (entry.activationKeywords.length / 20));

    // Calculate weighted final score
    const finalScore =
      semanticScore * weights.semanticWeight +
      capabilityScore * weights.capabilityWeight +
      performanceScore * weights.performanceWeight +
      recencyScore * weights.recencyWeight +
      popularityScore * weights.popularityWeight +
      specificityScore * weights.specificityWeight;

    return {
      semanticScore,
      capabilityScore,
      performanceScore,
      recencyScore,
      popularityScore,
      specificityScore,
      finalScore,
    };
  }

  /**
   * Compare two skills for a query
   */
  compare(
    skillId1: string,
    skillId2: string,
    query: string
  ): ComparisonResult {
    const skill1 = skillRegistry.get(skillId1);
    const skill2 = skillRegistry.get(skillId2);

    if (!skill1 || !skill2) {
      throw new Error(`Skill not found: ${!skill1 ? skillId1 : skillId2}`);
    }

    // Get rankings for both
    const ranked = this.rank(query, { maxResults: 100 });

    const rank1 = ranked.find(r => r.entry.skill.id === skillId1);
    const rank2 = ranked.find(r => r.entry.skill.id === skillId2);

    if (!rank1 || !rank2) {
      throw new Error('One or both skills did not match the query');
    }

    // Compare aspects
    const aspects: ComparisonResult['aspects'] = [
      {
        name: 'Semantic Match',
        skill1Score: rank1.rankingBreakdown.semanticScore,
        skill2Score: rank2.rankingBreakdown.semanticScore,
        better: this.compareTwoScores(
          rank1.rankingBreakdown.semanticScore,
          rank2.rankingBreakdown.semanticScore
        ),
      },
      {
        name: 'Capability Match',
        skill1Score: rank1.rankingBreakdown.capabilityScore,
        skill2Score: rank2.rankingBreakdown.capabilityScore,
        better: this.compareTwoScores(
          rank1.rankingBreakdown.capabilityScore,
          rank2.rankingBreakdown.capabilityScore
        ),
      },
      {
        name: 'Performance',
        skill1Score: rank1.rankingBreakdown.performanceScore,
        skill2Score: rank2.rankingBreakdown.performanceScore,
        better: this.compareTwoScores(
          rank1.rankingBreakdown.performanceScore,
          rank2.rankingBreakdown.performanceScore
        ),
      },
      {
        name: 'Specificity',
        skill1Score: rank1.rankingBreakdown.specificityScore,
        skill2Score: rank2.rankingBreakdown.specificityScore,
        better: this.compareTwoScores(
          rank1.rankingBreakdown.specificityScore,
          rank2.rankingBreakdown.specificityScore
        ),
      },
    ];

    const scoreDiff = rank1.rankingBreakdown.finalScore - rank2.rankingBreakdown.finalScore;
    const winner: -1 | 0 | 1 = scoreDiff > 0.05 ? -1 : scoreDiff < -0.05 ? 1 : 0;

    // Generate explanation
    const explanation = this.generateComparisonExplanation(
      skill1,
      skill2,
      rank1,
      rank2,
      winner
    );

    return {
      skills: [skill1, skill2],
      winner,
      scoreDifference: Math.abs(scoreDiff),
      explanation,
      aspects,
    };
  }

  /**
   * Compare two scores
   */
  private compareTwoScores(s1: number, s2: number): 'skill1' | 'skill2' | 'tie' {
    const diff = Math.abs(s1 - s2);
    if (diff < 0.05) return 'tie';
    return s1 > s2 ? 'skill1' : 'skill2';
  }

  /**
   * Generate comparison explanation
   */
  private generateComparisonExplanation(
    skill1: SkillRegistryEntry,
    skill2: SkillRegistryEntry,
    rank1: RankedResult,
    rank2: RankedResult,
    winner: -1 | 0 | 1
  ): string {
    const name1 = skill1.skill.title;
    const name2 = skill2.skill.title;

    if (winner === 0) {
      return `${name1} and ${name2} are equally suited for this task.`;
    }

    const better = winner === -1 ? rank1 : rank2;
    const worse = winner === -1 ? rank2 : rank1;
    const betterName = winner === -1 ? name1 : name2;
    const worseName = winner === -1 ? name2 : name1;

    const reasons: string[] = [];

    if (better.rankingBreakdown.semanticScore > worse.rankingBreakdown.semanticScore + 0.1) {
      reasons.push('better keyword match');
    }
    if (better.capabilityMatch.matchPercentage > worse.capabilityMatch.matchPercentage) {
      reasons.push('more relevant capabilities');
    }
    if (better.rankingBreakdown.performanceScore > worse.rankingBreakdown.performanceScore + 0.1) {
      reasons.push('higher success rate');
    }

    const reasonText = reasons.length > 0
      ? ` due to ${reasons.join(', ')}`
      : '';

    return `${betterName} is better suited than ${worseName}${reasonText}.`;
  }

  /**
   * Get top skills for a domain
   */
  getTopForDomain(
    domain: string,
    count = 5
  ): SkillRegistryEntry[] {
    const entries = skillRegistry.query({
      domain,
      activeOnly: true,
    });

    // Sort by success rate, then by invocation count
    return entries
      .sort((a, b) => {
        const rateA = a.metrics.invocationCount > 0 ? a.metrics.successRate : 0.5;
        const rateB = b.metrics.invocationCount > 0 ? b.metrics.successRate : 0.5;
        if (Math.abs(rateA - rateB) > 0.05) {
          return rateB - rateA;
        }
        return b.metrics.invocationCount - a.metrics.invocationCount;
      })
      .slice(0, count);
  }

  /**
   * Recommend skills for a workflow
   */
  recommendForWorkflow(
    steps: string[],
    options: { perStep?: number } = {}
  ): Map<string, RankedResult[]> {
    const { perStep = 3 } = options;
    const recommendations = new Map<string, RankedResult[]>();

    for (const step of steps) {
      const ranked = this.rank(step, { maxResults: perStep });
      recommendations.set(step, ranked);
    }

    return recommendations;
  }

  /**
   * Find complementary skills
   */
  findComplementary(
    skillId: string,
    count = 5
  ): SkillRegistryEntry[] {
    const entry = skillRegistry.get(skillId);
    if (!entry) return [];

    // Get from pairsWith
    const paired = entry.skill.pairsWith
      ?.map(p => skillRegistry.get(p.skill))
      .filter((e): e is SkillRegistryEntry => e !== undefined) || [];

    if (paired.length >= count) {
      return paired.slice(0, count);
    }

    // Also find skills in same category
    const sameCategory = skillRegistry.query({
      category: entry.skill.category,
      activeOnly: true,
    }).filter(e => e.skill.id !== skillId);

    return [...paired, ...sameCategory].slice(0, count);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global capability ranker instance */
export const capabilityRanker = new CapabilityRanker();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Rank skills using global ranker
 */
export function rankSkills(
  query: string,
  options?: Parameters<CapabilityRanker['rank']>[1]
): RankedResult[] {
  return capabilityRanker.rank(query, options);
}

/**
 * Compare two skills for a query
 */
export function compareSkills(
  skillId1: string,
  skillId2: string,
  query: string
): ComparisonResult {
  return capabilityRanker.compare(skillId1, skillId2, query);
}

/**
 * Get complementary skills
 */
export function getComplementarySkills(
  skillId: string,
  count?: number
): SkillRegistryEntry[] {
  return capabilityRanker.findComplementary(skillId, count);
}

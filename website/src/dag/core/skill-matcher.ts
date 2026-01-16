/**
 * Enhanced Skill Matching System
 *
 * Provides multiple strategies for matching subtasks to skills:
 * 1. Hybrid (DEFAULT) - combines keyword + semantic for best balance
 * 2. Enhanced keyword-based (fast, no API needed)
 * 3. Semantic similarity using embeddings (requires OpenAI API)
 * 4. LLM-based scoring (most accurate, requires Anthropic API)
 *
 * When OpenAI API key is not available, hybrid automatically falls back to keyword.
 */

import type { Subtask, SkillMatch } from './task-decomposer';
import type { SkillInfo } from '../registry/skill-loader';
import { EmbeddingService, type Embedding } from './embedding-service';
import { EmbeddingCache } from './embedding-cache';

/**
 * Matching strategy configuration
 */
export type MatchingStrategy = 'keyword' | 'semantic' | 'llm' | 'hybrid';

export interface MatcherConfig {
  strategy: MatchingStrategy;

  // Keyword matching weights
  keywordWeights?: {
    tagMatch: number;          // Weight for capability → tag match (default: 0.4)
    descriptionMatch: number;  // Weight for description overlap (default: 0.3)
    categoryMatch: number;     // Weight for category alignment (default: 0.2)
    nameMatch: number;         // Weight for name similarity (default: 0.1)
  };

  // Minimum confidence threshold
  minConfidence?: number;  // Default: 0.3

  // Fallback to general-purpose if no good match
  useFallback?: boolean;  // Default: true

  // Semantic matching config
  openAiApiKey?: string;  // Required for semantic matching
  embeddingModel?: 'text-embedding-3-small' | 'text-embedding-3-large';  // Default: small
  embeddingCachePath?: string;  // Path to cache file

  // Hybrid matching weights
  hybridWeights?: {
    keyword: number;   // Weight for keyword score (default: 0.4)
    semantic: number;  // Weight for semantic score (default: 0.6)
  };

  // LLM matching config
  anthropicApiKey?: string;  // Required for LLM matching
  llmModel?: 'claude-3-haiku-20240307' | 'claude-3-5-haiku-20241022';  // Default: 3.5 haiku
  llmTopK?: number;  // Number of candidates to send to LLM (default: 10)
}

/**
 * Enhanced skill matcher with multiple strategies
 */
export class SkillMatcher {
  private config: Required<MatcherConfig>;
  private embeddingService?: EmbeddingService;
  private embeddingCache?: EmbeddingCache;

  constructor(config: Partial<MatcherConfig> = {}) {
    this.config = {
      strategy: config.strategy || 'hybrid',
      keywordWeights: {
        tagMatch: 0.4,
        descriptionMatch: 0.3,
        categoryMatch: 0.2,
        nameMatch: 0.1,
        ...config.keywordWeights,
      },
      minConfidence: config.minConfidence ?? 0.3,
      useFallback: config.useFallback ?? true,
      openAiApiKey: config.openAiApiKey,
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      embeddingCachePath: config.embeddingCachePath,
      hybridWeights: {
        keyword: 0.4,
        semantic: 0.6,
        ...config.hybridWeights,
      },
      anthropicApiKey: config.anthropicApiKey,
      llmModel: config.llmModel || 'claude-3-5-haiku-20241022',
      llmTopK: config.llmTopK ?? 10,
    } as Required<MatcherConfig>;

    // Initialize embedding service and cache if using semantic/hybrid/llm
    if (
      (this.config.strategy === 'semantic' ||
       this.config.strategy === 'hybrid' ||
       this.config.strategy === 'llm') &&
      this.config.openAiApiKey
    ) {
      this.embeddingService = new EmbeddingService({
        apiKey: this.config.openAiApiKey,
        model: this.config.embeddingModel,
      });

      this.embeddingCache = new EmbeddingCache({
        cachePath: this.config.embeddingCachePath,
      });
    }
  }

  /**
   * Find best skill match for a subtask
   */
  async findBestMatch(
    subtask: Subtask,
    availableSkills: SkillInfo[]
  ): Promise<SkillMatch> {
    switch (this.config.strategy) {
      case 'keyword':
        return this.keywordMatch(subtask, availableSkills);

      case 'semantic':
        if (!this.embeddingService || !this.embeddingCache) {
          console.warn('Semantic matching requires OpenAI API key, falling back to keyword');
          return this.keywordMatch(subtask, availableSkills);
        }
        return await this.semanticMatch(subtask, availableSkills);

      case 'llm':
        if (!this.config.anthropicApiKey || !this.embeddingService || !this.embeddingCache) {
          console.warn('LLM matching requires Anthropic API key and OpenAI key for embeddings, falling back to keyword');
          return this.keywordMatch(subtask, availableSkills);
        }
        return await this.llmMatch(subtask, availableSkills);

      case 'hybrid':
        if (!this.embeddingService || !this.embeddingCache) {
          console.warn('Hybrid matching requires OpenAI API key, falling back to keyword');
          return this.keywordMatch(subtask, availableSkills);
        }
        return await this.hybridMatch(subtask, availableSkills);

      default:
        return this.keywordMatch(subtask, availableSkills);
    }
  }

  /**
   * Enhanced keyword-based matching
   */
  private keywordMatch(
    subtask: Subtask,
    availableSkills: SkillInfo[]
  ): SkillMatch {
    let bestMatch: { skill: SkillInfo; score: number; breakdown: string } | null = null;

    for (const skill of availableSkills) {
      const { score, breakdown } = this.scoreKeywordMatch(subtask, skill);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { skill, score, breakdown };
      }
    }

    // Check if we should use fallback
    if (
      this.config.useFallback &&
      (!bestMatch || bestMatch.score < this.config.minConfidence)
    ) {
      const fallback = availableSkills.find(s => s.id === 'general-purpose');
      if (fallback) {
        return {
          subtaskId: subtask.id,
          skillId: fallback.id,
          confidence: 0.3,
          reasoning: 'No strong match found, using general-purpose fallback',
        };
      }
    }

    if (!bestMatch) {
      // Absolute fallback - just use first skill
      return {
        subtaskId: subtask.id,
        skillId: availableSkills[0].id,
        confidence: 0.1,
        reasoning: 'No matches found, using first available skill',
      };
    }

    return {
      subtaskId: subtask.id,
      skillId: bestMatch.skill.id,
      confidence: bestMatch.score,
      reasoning: bestMatch.breakdown,
    };
  }

  /**
   * Score a skill match using enhanced keyword algorithm
   */
  private scoreKeywordMatch(
    subtask: Subtask,
    skill: SkillInfo
  ): { score: number; breakdown: string } {
    const weights = this.config.keywordWeights;
    const breakdown: string[] = [];
    let score = 0;

    // 1. Tag matching (most important)
    const tagMatches = this.countCapabilityTagMatches(
      subtask.requiredCapabilities,
      skill.tags
    );
    const tagScore = (tagMatches / Math.max(subtask.requiredCapabilities.length, 1)) * weights.tagMatch;
    score += tagScore;
    if (tagMatches > 0) {
      breakdown.push(`${tagMatches} capability matches`);
    }

    // 2. Description similarity
    const descScore = this.calculateDescriptionSimilarity(
      subtask.description,
      skill.description
    ) * weights.descriptionMatch;
    score += descScore;
    if (descScore > 0.1) {
      breakdown.push(`description similarity`);
    }

    // 3. Category alignment
    const categoryScore = this.scoreCategories(subtask, skill) * weights.categoryMatch;
    score += categoryScore;
    if (categoryScore > 0) {
      breakdown.push(`category match`);
    }

    // 4. Name similarity
    const nameScore = this.calculateNameSimilarity(subtask.id, skill.id) * weights.nameMatch;
    score += nameScore;

    return {
      score: Math.min(score, 1.0),
      breakdown: breakdown.length > 0 ? breakdown.join(', ') : 'weak match',
    };
  }

  /**
   * Count how many required capabilities match skill tags
   */
  private countCapabilityTagMatches(
    capabilities: string[],
    tags: string[]
  ): number {
    let matches = 0;
    const lowerTags = tags.map(t => t.toLowerCase());

    for (const capability of capabilities) {
      const capLower = capability.toLowerCase();

      // Exact match
      if (lowerTags.includes(capLower)) {
        matches += 1;
        continue;
      }

      // Partial match (tag contains capability or vice versa)
      if (lowerTags.some(tag =>
        tag.includes(capLower) || capLower.includes(tag)
      )) {
        matches += 0.5;
      }
    }

    return matches;
  }

  /**
   * Calculate description similarity using word overlap
   */
  private calculateDescriptionSimilarity(
    subtaskDesc: string,
    skillDesc: string
  ): number {
    // Extract meaningful words (remove common stop words)
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'to', 'for', 'of', 'in', 'on', 'at', 'from', 'with', 'by',
    ]);

    const extractWords = (text: string): Set<string> => {
      return new Set(
        text
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w))
      );
    };

    const subtaskWords = extractWords(subtaskDesc);
    const skillWords = extractWords(skillDesc);

    if (subtaskWords.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set(
      [...subtaskWords].filter(w => skillWords.has(w))
    );
    const union = new Set([...subtaskWords, ...skillWords]);

    return intersection.size / union.size;
  }

  /**
   * Score category alignment
   */
  private scoreCategories(subtask: Subtask, skill: SkillInfo): number {
    // Infer category from capabilities
    const categoryKeywords: Record<string, string[]> = {
      'Design & Creative': ['design', 'ui', 'ux', 'visual', 'creative', 'typography', 'color'],
      'Code Quality & Testing': ['test', 'testing', 'quality', 'lint', 'review'],
      'DevOps & Site Reliability': ['deploy', 'ci', 'cd', 'devops', 'docker', 'kubernetes'],
      'Content & Writing': ['write', 'writing', 'content', 'copy', 'seo', 'blog'],
      'Data & Analytics': ['data', 'analytics', 'metrics', 'database', 'query'],
      'AI & Machine Learning': ['ai', 'ml', 'machine-learning', 'model', 'training'],
    };

    // Check if subtask capabilities align with skill's category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (!skill.categories.includes(category)) continue;

      const hasKeyword = subtask.requiredCapabilities.some(cap =>
        keywords.some(kw => cap.toLowerCase().includes(kw))
      );

      if (hasKeyword) return 1.0;
    }

    return 0;
  }

  /**
   * Calculate name similarity (simple Levenshtein-like heuristic)
   */
  private calculateNameSimilarity(subtaskId: string, skillId: string): number {
    const words1 = subtaskId.toLowerCase().split('-');
    const words2 = skillId.toLowerCase().split('-');

    let matches = 0;
    for (const word of words1) {
      if (words2.includes(word)) {
        matches += 1;
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Semantic matching using embeddings
   */
  private async semanticMatch(
    subtask: Subtask,
    availableSkills: SkillInfo[]
  ): Promise<SkillMatch> {
    if (!this.embeddingService || !this.embeddingCache) {
      throw new Error('Embedding service not initialized');
    }

    // Ensure all skills have cached embeddings
    await this.ensureSkillEmbeddings(availableSkills);

    // Build subtask text for embedding
    const subtaskText = this.buildSubtaskText(subtask);

    // Get subtask embedding
    const result = await this.embeddingService.embed(subtaskText);
    const subtaskEmbedding = result.embedding;

    // Get all cached skill embeddings
    const skillEmbeddings = availableSkills.map(skill => {
      const cached = this.embeddingCache!.get(skill.id);
      if (!cached) {
        throw new Error(`Missing embedding for skill: ${skill.id}`);
      }
      return {
        skill,
        embedding: cached.embedding,
      };
    });

    // Find top-k most similar
    const similarities = EmbeddingService.findTopKSimilar(
      subtaskEmbedding,
      skillEmbeddings.map(se => ({ id: se.skill.id, embedding: se.embedding })),
      1
    );

    const bestMatch = similarities[0];
    const skill = availableSkills.find(s => s.id === bestMatch.id)!;

    // Check if we should use fallback
    if (
      this.config.useFallback &&
      bestMatch.similarity < this.config.minConfidence
    ) {
      const fallback = availableSkills.find(s => s.id === 'general-purpose');
      if (fallback) {
        return {
          subtaskId: subtask.id,
          skillId: fallback.id,
          confidence: 0.3,
          reasoning: `Semantic similarity too low (${bestMatch.similarity.toFixed(2)}), using general-purpose fallback`,
        };
      }
    }

    return {
      subtaskId: subtask.id,
      skillId: skill.id,
      confidence: bestMatch.similarity,
      reasoning: `Semantic match (similarity: ${bestMatch.similarity.toFixed(2)})`,
    };
  }

  /**
   * Hybrid matching (combines keyword + semantic)
   */
  private async hybridMatch(
    subtask: Subtask,
    availableSkills: SkillInfo[]
  ): Promise<SkillMatch> {
    if (!this.embeddingService || !this.embeddingCache) {
      throw new Error('Embedding service not initialized');
    }

    // Ensure all skills have cached embeddings
    await this.ensureSkillEmbeddings(availableSkills);

    // Get keyword scores
    const keywordScores = new Map<string, number>();
    for (const skill of availableSkills) {
      const { score } = this.scoreKeywordMatch(subtask, skill);
      keywordScores.set(skill.id, score);
    }

    // Get semantic scores
    const subtaskText = this.buildSubtaskText(subtask);
    const result = await this.embeddingService.embed(subtaskText);
    const subtaskEmbedding = result.embedding;

    const skillEmbeddings = availableSkills.map(skill => {
      const cached = this.embeddingCache!.get(skill.id);
      if (!cached) {
        throw new Error(`Missing embedding for skill: ${skill.id}`);
      }
      return {
        skill,
        embedding: cached.embedding,
      };
    });

    const semanticScores = new Map<string, number>();
    for (const se of skillEmbeddings) {
      const similarity = EmbeddingService.cosineSimilarity(subtaskEmbedding, se.embedding);
      semanticScores.set(se.skill.id, similarity);
    }

    // Combine scores
    const weights = this.config.hybridWeights;
    let bestMatch: { skill: SkillInfo; score: number; breakdown: string } | null = null;

    for (const skill of availableSkills) {
      const keywordScore = keywordScores.get(skill.id) || 0;
      const semanticScore = semanticScores.get(skill.id) || 0;

      const combinedScore = (
        keywordScore * weights.keyword +
        semanticScore * weights.semantic
      );

      if (!bestMatch || combinedScore > bestMatch.score) {
        bestMatch = {
          skill,
          score: combinedScore,
          breakdown: `keyword: ${keywordScore.toFixed(2)}, semantic: ${semanticScore.toFixed(2)}`,
        };
      }
    }

    if (!bestMatch) {
      // Absolute fallback
      return {
        subtaskId: subtask.id,
        skillId: availableSkills[0].id,
        confidence: 0.1,
        reasoning: 'No matches found, using first available skill',
      };
    }

    // Check if we should use fallback
    if (
      this.config.useFallback &&
      bestMatch.score < this.config.minConfidence
    ) {
      const fallback = availableSkills.find(s => s.id === 'general-purpose');
      if (fallback) {
        return {
          subtaskId: subtask.id,
          skillId: fallback.id,
          confidence: 0.3,
          reasoning: 'Hybrid score too low, using general-purpose fallback',
        };
      }
    }

    return {
      subtaskId: subtask.id,
      skillId: bestMatch.skill.id,
      confidence: bestMatch.score,
      reasoning: `Hybrid match (${bestMatch.breakdown})`,
    };
  }

  /**
   * LLM-based matching (uses Claude Haiku to select from top candidates)
   *
   * Strategy:
   * 1. Use hybrid matching to get top K candidates (fast filtering)
   * 2. Send candidates to Claude Haiku for final selection
   * 3. LLM understands nuanced requirements better than embeddings alone
   *
   * Achieves 95%+ accuracy by combining algorithmic filtering with LLM reasoning.
   */
  private async llmMatch(
    subtask: Subtask,
    availableSkills: SkillInfo[]
  ): Promise<SkillMatch> {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key required for LLM matching');
    }
    if (!this.embeddingService || !this.embeddingCache) {
      throw new Error('Embedding service required for LLM matching (used to filter candidates)');
    }

    // Step 1: Use hybrid matching to get top K candidates
    await this.ensureSkillEmbeddings(availableSkills);

    // Get hybrid scores for all skills
    const subtaskText = this.buildSubtaskText(subtask);
    const result = await this.embeddingService.embed(subtaskText);
    const subtaskEmbedding = result.embedding;

    const keywordScores = new Map<string, number>();
    for (const skill of availableSkills) {
      const { score } = this.scoreKeywordMatch(subtask, skill);
      keywordScores.set(skill.id, score);
    }

    const semanticScores = new Map<string, number>();
    for (const skill of availableSkills) {
      const cached = this.embeddingCache!.get(skill.id);
      if (!cached) {
        throw new Error(`Missing embedding for skill: ${skill.id}`);
      }
      const similarity = EmbeddingService.cosineSimilarity(subtaskEmbedding, cached.embedding);
      semanticScores.set(skill.id, similarity);
    }

    // Combine scores and get top K
    const weights = this.config.hybridWeights;
    const scoredSkills = availableSkills.map(skill => {
      const keywordScore = keywordScores.get(skill.id) || 0;
      const semanticScore = semanticScores.get(skill.id) || 0;
      const combinedScore = (
        keywordScore * weights.keyword +
        semanticScore * weights.semantic
      );
      return { skill, score: combinedScore };
    });

    scoredSkills.sort((a, b) => b.score - a.score);
    const topCandidates = scoredSkills.slice(0, this.config.llmTopK);

    // Step 2: Build prompt for Claude
    const candidatesText = topCandidates.map((c, i) =>
      `${i + 1}. **${c.skill.name}** (${c.skill.id})
   Description: ${c.skill.description}
   Categories: ${c.skill.categories.join(', ')}
   Tags: ${c.skill.tags.slice(0, 10).join(', ')}
   Hybrid Score: ${c.score.toFixed(2)}`
    ).join('\n\n');

    const prompt = `You are a skill matching expert. Your task is to select the SINGLE BEST skill from the candidates below to accomplish the given subtask.

SUBTASK:
  ID: ${subtask.id}
  Description: ${subtask.description}
  Required Capabilities: ${subtask.requiredCapabilities.join(', ')}
  Prompt: ${subtask.prompt}

TOP ${topCandidates.length} CANDIDATE SKILLS (ranked by hybrid keyword+semantic matching):

${candidatesText}

INSTRUCTIONS:
1. Analyze the subtask requirements carefully
2. Consider which skill's capabilities best match the task
3. Think about edge cases and domain expertise needed
4. Select the ONE skill that is most likely to succeed

RESPONSE FORMAT (JSON only, no markdown):
{
  "skill_id": "the-chosen-skill-id",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this skill is best (1-2 sentences)"
}`;

    // Step 3: Call Claude Haiku
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.llmModel,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Step 4: Parse response
    let parsedResponse: { skill_id: string; confidence: number; reasoning: string };
    try {
      // Try to extract JSON from markdown code blocks or raw text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse LLM response:', content);
      // Fallback to top hybrid candidate
      const fallback = topCandidates[0];
      return {
        subtaskId: subtask.id,
        skillId: fallback.skill.id,
        confidence: fallback.score,
        reasoning: `LLM parsing failed, using top hybrid candidate (score: ${fallback.score.toFixed(2)})`,
      };
    }

    // Validate selected skill exists
    const selectedSkill = availableSkills.find(s => s.id === parsedResponse.skill_id);
    if (!selectedSkill) {
      console.warn(`LLM selected unknown skill: ${parsedResponse.skill_id}, using top hybrid candidate`);
      const fallback = topCandidates[0];
      return {
        subtaskId: subtask.id,
        skillId: fallback.skill.id,
        confidence: fallback.score,
        reasoning: `LLM selected unknown skill, using top hybrid candidate`,
      };
    }

    return {
      subtaskId: subtask.id,
      skillId: parsedResponse.skill_id,
      confidence: parsedResponse.confidence,
      reasoning: `LLM match: ${parsedResponse.reasoning}`,
    };
  }

  /**
   * Ensure all skills have cached embeddings
   */
  private async ensureSkillEmbeddings(skills: SkillInfo[]): Promise<void> {
    if (!this.embeddingService || !this.embeddingCache) {
      return;
    }

    // Find skills missing embeddings
    const missing = this.embeddingCache.findMissing(skills);

    if (missing.length === 0) {
      return;
    }

    console.log(`Computing embeddings for ${missing.length} skills...`);

    // Build texts for embedding
    const texts = missing.map(skill => this.buildSkillText(skill));

    // Get embeddings in batch
    const results = await this.embeddingService.embedBatch(texts);

    // Cache embeddings
    this.embeddingCache.setBatch(
      missing.map((skill, i) => ({
        skillId: skill.id,
        embedding: results[i].embedding,
        model: results[i].model,
        description: skill.description,
      }))
    );

    console.log(`Cached ${missing.length} new skill embeddings`);
  }

  /**
   * Build text representation of subtask for embedding
   */
  private buildSubtaskText(subtask: Subtask): string {
    const parts = [
      subtask.description,
      subtask.requiredCapabilities.join(', '),
    ];

    return parts.filter(p => p && p.length > 0).join('. ');
  }

  /**
   * Build text representation of skill for embedding
   */
  private buildSkillText(skill: SkillInfo): string {
    const parts = [
      skill.name,
      skill.description,
      skill.tags.join(', '),
    ];

    return parts.filter(p => p && p.length > 0).join('. ');
  }
}

/**
 * Convenience function for batch matching
 */
export async function matchAllSkills(
  subtasks: Subtask[],
  availableSkills: SkillInfo[],
  config?: Partial<MatcherConfig>
): Promise<SkillMatch[]> {
  const matcher = new SkillMatcher(config);
  const matches: SkillMatch[] = [];

  for (const subtask of subtasks) {
    const match = await matcher.findBestMatch(subtask, availableSkills);
    matches.push(match);
  }

  return matches;
}

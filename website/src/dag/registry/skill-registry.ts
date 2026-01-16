/**
 * Skill Registry
 *
 * Central skill catalog with metadata, capabilities, and performance tracking.
 * Provides the foundation for skill discovery and matching in the DAG framework.
 *
 * @module dag/registry/skill-registry
 */

import { ALL_SKILLS, type Skill } from '../../data/skills';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Extended skill metadata for registry
 */
export interface SkillRegistryEntry {
  /** Base skill data */
  skill: Skill;

  /** Parsed activation keywords from description */
  activationKeywords: string[];

  /** Parsed exclusion keywords from description */
  exclusionKeywords: string[];

  /** Capability flags inferred from skill */
  capabilities: SkillCapabilities;

  /** Performance metrics (updated over time) */
  metrics: SkillMetrics;

  /** Is this skill currently active/available */
  isActive: boolean;

  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Capability flags for a skill
 */
export interface SkillCapabilities {
  /** Can read files */
  canRead: boolean;

  /** Can write/edit files */
  canWrite: boolean;

  /** Can execute bash commands */
  canBash: boolean;

  /** Can access web */
  canWeb: boolean;

  /** Can use MCP tools */
  canMcp: boolean;

  /** Primary tool types used */
  primaryTools: string[];

  /** Domains this skill operates in */
  domains: string[];
}

/**
 * Performance metrics for a skill
 */
export interface SkillMetrics {
  /** Total invocations */
  invocationCount: number;

  /** Successful completions */
  successCount: number;

  /** Average confidence score (0-1) */
  avgConfidence: number;

  /** Average tokens used */
  avgTokens: number;

  /** Average latency in ms */
  avgLatencyMs: number;

  /** Last used timestamp */
  lastUsed: Date | null;

  /** Success rate (0-1) */
  successRate: number;
}

/**
 * Registry query options
 */
export interface RegistryQueryOptions {
  /** Filter by category */
  category?: string;

  /** Filter by tags */
  tags?: string[];

  /** Filter by domain */
  domain?: string;

  /** Filter by capability */
  capability?: keyof SkillCapabilities;

  /** Only active skills */
  activeOnly?: boolean;

  /** Minimum success rate */
  minSuccessRate?: number;

  /** Maximum results */
  limit?: number;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalSkills: number;
  activeSkills: number;
  totalInvocations: number;
  avgSuccessRate: number;
  skillsByCategory: Record<string, number>;
  topSkills: { id: string; invocations: number }[];
}

// =============================================================================
// SKILL REGISTRY CLASS
// =============================================================================

/**
 * SkillRegistry provides centralized skill catalog with discovery capabilities.
 *
 * @example
 * ```typescript
 * const registry = new SkillRegistry();
 *
 * // Load skills from data
 * registry.initialize();
 *
 * // Query skills
 * const aiSkills = registry.query({ category: 'AI & Machine Learning' });
 *
 * // Get specific skill
 * const skill = registry.get('ai-engineer');
 *
 * // Search by keyword
 * const matches = registry.search('LLM chatbot RAG');
 * ```
 */
export class SkillRegistry {
  private entries: Map<string, SkillRegistryEntry> = new Map();
  private initialized = false;

  /**
   * Initialize registry with skills from data
   */
  initialize(skills: Skill[] = ALL_SKILLS): void {
    this.entries.clear();

    for (const skill of skills) {
      const entry = this.createEntry(skill);
      this.entries.set(skill.id, entry);
    }

    this.initialized = true;
  }

  /**
   * Create a registry entry from a skill
   */
  private createEntry(skill: Skill): SkillRegistryEntry {
    const activationKeywords = this.parseActivationKeywords(skill.description);
    const exclusionKeywords = this.parseExclusionKeywords(skill.description);
    const capabilities = this.inferCapabilities(skill);

    return {
      skill,
      activationKeywords,
      exclusionKeywords,
      capabilities,
      metrics: this.createDefaultMetrics(),
      isActive: true,
      registeredAt: new Date(),
    };
  }

  /**
   * Parse activation keywords from description
   * Looks for patterns like: Activate on "X", "Y", "Z"
   */
  private parseActivationKeywords(description: string): string[] {
    const keywords: string[] = [];

    // Match "Activate on" patterns
    const activateMatch = description.match(/Activate on[:\s]+([^.]+)/i);
    if (activateMatch) {
      const keywordPart = activateMatch[1];
      // Extract quoted strings
      const quoted = keywordPart.match(/"([^"]+)"/g) || [];
      keywords.push(...quoted.map(q => q.replace(/"/g, '').toLowerCase()));

      // Also get unquoted comma-separated terms
      const unquoted = keywordPart
        .replace(/"[^"]+"/g, '')
        .split(/[,;]/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 2);
      keywords.push(...unquoted);
    }

    // Also include tags as activation keywords
    return [...new Set(keywords)];
  }

  /**
   * Parse exclusion keywords from description
   * Looks for patterns like: NOT for X, Y, Z
   */
  private parseExclusionKeywords(description: string): string[] {
    const keywords: string[] = [];

    const notMatch = description.match(/NOT for[:\s]+([^.]+)/i);
    if (notMatch) {
      const keywordPart = notMatch[1];
      const terms = keywordPart
        .replace(/\([^)]+\)/g, '') // Remove parenthetical notes
        .split(/[,;]/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 2);
      keywords.push(...terms);
    }

    return [...new Set(keywords)];
  }

  /**
   * Infer capabilities from skill metadata
   */
  private inferCapabilities(skill: Skill): SkillCapabilities {
    const desc = skill.description.toLowerCase();
    const tags = skill.tags.map(t => t.toLowerCase());

    // Infer primary tools from common patterns
    const primaryTools: string[] = [];
    if (desc.includes('code') || desc.includes('develop')) primaryTools.push('Edit', 'Write');
    if (desc.includes('research') || desc.includes('search')) primaryTools.push('WebSearch', 'Grep');
    if (desc.includes('design') || desc.includes('visual')) primaryTools.push('Read', 'Write');

    // Infer domains from category and tags
    const domains: string[] = [skill.category.toLowerCase()];
    domains.push(...tags);

    return {
      canRead: true, // All skills can read
      canWrite: desc.includes('create') || desc.includes('write') || desc.includes('build'),
      canBash: desc.includes('deploy') || desc.includes('script') || desc.includes('cli'),
      canWeb: desc.includes('web') || desc.includes('api') || desc.includes('fetch'),
      canMcp: desc.includes('mcp') || desc.includes('tool'),
      primaryTools,
      domains: [...new Set(domains)],
    };
  }

  /**
   * Create default metrics for a new skill
   */
  private createDefaultMetrics(): SkillMetrics {
    return {
      invocationCount: 0,
      successCount: 0,
      avgConfidence: 0,
      avgTokens: 0,
      avgLatencyMs: 0,
      lastUsed: null,
      successRate: 0,
    };
  }

  /**
   * Get a skill by ID
   */
  get(id: string): SkillRegistryEntry | undefined {
    this.ensureInitialized();
    return this.entries.get(id);
  }

  /**
   * Check if a skill exists
   */
  has(id: string): boolean {
    this.ensureInitialized();
    return this.entries.has(id);
  }

  /**
   * Get all skill IDs
   */
  getAllIds(): string[] {
    this.ensureInitialized();
    return Array.from(this.entries.keys());
  }

  /**
   * Get all entries
   */
  getAll(): SkillRegistryEntry[] {
    this.ensureInitialized();
    return Array.from(this.entries.values());
  }

  /**
   * Query skills with filters
   */
  query(options: RegistryQueryOptions = {}): SkillRegistryEntry[] {
    this.ensureInitialized();

    let results = Array.from(this.entries.values());

    // Apply filters
    if (options.activeOnly !== false) {
      results = results.filter(e => e.isActive);
    }

    if (options.category) {
      results = results.filter(e =>
        e.skill.category.toLowerCase() === options.category!.toLowerCase()
      );
    }

    if (options.tags && options.tags.length > 0) {
      const lowerTags = options.tags.map(t => t.toLowerCase());
      results = results.filter(e =>
        e.skill.tags.some(t => lowerTags.includes(t.toLowerCase()))
      );
    }

    if (options.domain) {
      const lowerDomain = options.domain.toLowerCase();
      results = results.filter(e =>
        e.capabilities.domains.some(d => d.includes(lowerDomain))
      );
    }

    if (options.capability) {
      results = results.filter(e => e.capabilities[options.capability!]);
    }

    if (options.minSuccessRate !== undefined) {
      results = results.filter(e =>
        e.metrics.invocationCount === 0 || e.metrics.successRate >= options.minSuccessRate!
      );
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Search skills by keyword (simple text matching)
   * For semantic matching, use SemanticMatcher
   */
  search(query: string, limit = 10): SkillRegistryEntry[] {
    this.ensureInitialized();

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (queryTerms.length === 0) return [];

    // Score each skill by keyword matches
    const scored = Array.from(this.entries.values())
      .filter(e => e.isActive)
      .map(entry => {
        let score = 0;

        for (const term of queryTerms) {
          // Check activation keywords (highest weight)
          if (entry.activationKeywords.some(k => k.includes(term))) {
            score += 10;
          }

          // Check title
          if (entry.skill.title.toLowerCase().includes(term)) {
            score += 8;
          }

          // Check tags
          if (entry.skill.tags.some(t => t.toLowerCase().includes(term))) {
            score += 5;
          }

          // Check description
          if (entry.skill.description.toLowerCase().includes(term)) {
            score += 2;
          }

          // Check domains
          if (entry.capabilities.domains.some(d => d.includes(term))) {
            score += 3;
          }

          // Penalty for exclusion keywords
          if (entry.exclusionKeywords.some(k => k.includes(term))) {
            score -= 5;
          }
        }

        return { entry, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ entry }) => entry);
  }

  /**
   * Update skill metrics after invocation
   */
  recordInvocation(
    skillId: string,
    result: {
      success: boolean;
      confidence?: number;
      tokens?: number;
      latencyMs?: number;
    }
  ): void {
    const entry = this.entries.get(skillId);
    if (!entry) return;

    const m = entry.metrics;
    m.invocationCount++;

    if (result.success) {
      m.successCount++;
    }

    m.successRate = m.invocationCount > 0
      ? m.successCount / m.invocationCount
      : 0;

    // Rolling average for other metrics
    if (result.confidence !== undefined) {
      m.avgConfidence = this.rollingAvg(m.avgConfidence, result.confidence, m.invocationCount);
    }
    if (result.tokens !== undefined) {
      m.avgTokens = this.rollingAvg(m.avgTokens, result.tokens, m.invocationCount);
    }
    if (result.latencyMs !== undefined) {
      m.avgLatencyMs = this.rollingAvg(m.avgLatencyMs, result.latencyMs, m.invocationCount);
    }

    m.lastUsed = new Date();
  }

  /**
   * Calculate rolling average
   */
  private rollingAvg(current: number, newValue: number, count: number): number {
    if (count <= 1) return newValue;
    return ((current * (count - 1)) + newValue) / count;
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    this.ensureInitialized();

    const entries = Array.from(this.entries.values());
    const active = entries.filter(e => e.isActive);

    // Count by category
    const skillsByCategory: Record<string, number> = {};
    for (const entry of active) {
      const cat = entry.skill.category;
      skillsByCategory[cat] = (skillsByCategory[cat] || 0) + 1;
    }

    // Total invocations
    const totalInvocations = entries.reduce(
      (sum, e) => sum + e.metrics.invocationCount,
      0
    );

    // Average success rate (only for skills that have been used)
    const usedEntries = entries.filter(e => e.metrics.invocationCount > 0);
    const avgSuccessRate = usedEntries.length > 0
      ? usedEntries.reduce((sum, e) => sum + e.metrics.successRate, 0) / usedEntries.length
      : 0;

    // Top skills by invocation
    const topSkills = entries
      .filter(e => e.metrics.invocationCount > 0)
      .sort((a, b) => b.metrics.invocationCount - a.metrics.invocationCount)
      .slice(0, 10)
      .map(e => ({
        id: e.skill.id,
        invocations: e.metrics.invocationCount,
      }));

    return {
      totalSkills: entries.length,
      activeSkills: active.length,
      totalInvocations,
      avgSuccessRate,
      skillsByCategory,
      topSkills,
    };
  }

  /**
   * Deactivate a skill
   */
  deactivate(skillId: string): boolean {
    const entry = this.entries.get(skillId);
    if (!entry) return false;
    entry.isActive = false;
    return true;
  }

  /**
   * Activate a skill
   */
  activate(skillId: string): boolean {
    const entry = this.entries.get(skillId);
    if (!entry) return false;
    entry.isActive = true;
    return true;
  }

  /**
   * Register a new skill (for dynamically added skills)
   */
  register(skill: Skill): void {
    if (this.entries.has(skill.id)) {
      throw new Error(`Skill already registered: ${skill.id}`);
    }
    const entry = this.createEntry(skill);
    this.entries.set(skill.id, entry);
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.entries.clear();
    this.initialized = false;
  }

  /**
   * Ensure registry is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }

  /**
   * Get count of skills
   */
  get size(): number {
    return this.entries.size;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/** Global skill registry instance */
export const skillRegistry = new SkillRegistry();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Initialize the global registry
 */
export function initializeRegistry(skills?: Skill[]): void {
  skillRegistry.initialize(skills);
}

/**
 * Get a skill from the global registry
 */
export function getSkill(id: string): SkillRegistryEntry | undefined {
  return skillRegistry.get(id);
}

/**
 * Search skills in the global registry
 */
export function searchSkills(query: string, limit?: number): SkillRegistryEntry[] {
  return skillRegistry.search(query, limit);
}

/**
 * Query skills in the global registry
 */
export function querySkills(options: RegistryQueryOptions): SkillRegistryEntry[] {
  return skillRegistry.query(options);
}

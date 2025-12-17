/**
 * Skill Matcher Client SDK
 *
 * A TypeScript client for consuming the Skill Matcher MCP server.
 * Can be used programmatically or as a standalone CLI.
 *
 * Usage:
 *   import { SkillMatcherClient } from '@someclaudeskills/skill-matcher/client';
 *   const client = new SkillMatcherClient();
 *   const matches = await client.matchSkills('help me design a website');
 */

import type {
  SkillCatalogEntry,
  MatchResult,
  MatchResponse,
  GapAnalysis,
  ExternalSuggestion,
  ExternalSource,
  SkillCategory,
} from './types.js';

// ============================================================================
// Client Types
// ============================================================================

export interface SkillMatcherClientConfig {
  /** Project root directory (default: process.cwd()) */
  projectRoot?: string;
  /** Match threshold 0-1 (default: 0.4) */
  matchThreshold?: number;
  /** Maximum results to return (default: 5) */
  maxResults?: number;
  /** Enable external database search (default: false) */
  enableExternalSearch?: boolean;
  /** External sources to query when enabled */
  externalSources?: ExternalSource[];
}

export interface MatchOptions {
  /** Maximum results to return */
  maxResults?: number;
  /** Include gap analysis in response */
  includeGapAnalysis?: boolean;
  /** Search external databases too */
  searchExternal?: boolean;
  /** External sources to query */
  externalSources?: ExternalSource[];
}

export interface SkillSuggestion {
  /** Matched skill info */
  skill: SkillCatalogEntry;
  /** Confidence score 0-1 */
  confidence: number;
  /** Why this skill was matched */
  reasoning: string;
  /** Suggested usage example */
  exampleUsage?: string;
}

// ============================================================================
// Client Implementation
// ============================================================================

export class SkillMatcherClient {
  private config: Required<SkillMatcherClientConfig>;
  private skillIndex: SkillCatalogEntry[] = [];
  private isLoaded = false;

  constructor(config: SkillMatcherClientConfig = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      matchThreshold: config.matchThreshold || 0.4,
      maxResults: config.maxResults || 5,
      enableExternalSearch: config.enableExternalSearch || false,
      externalSources: config.externalSources || ['mcp-registry', 'smithery'],
    };
  }

  /**
   * Match a prompt against available skills
   */
  async matchSkills(
    prompt: string,
    options: MatchOptions = {}
  ): Promise<SkillSuggestion[]> {
    await this.ensureLoaded();

    // This would normally call the MCP server
    // For standalone use, we do simplified matching
    const matches = this.localMatch(prompt, options.maxResults || this.config.maxResults);

    return matches.map(m => ({
      skill: m.skill,
      confidence: m.score,
      reasoning: m.reasoning,
      exampleUsage: this.generateExampleUsage(m.skill, prompt),
    }));
  }

  /**
   * Get gap analysis for a prompt with no good matches
   */
  async analyzeGap(prompt: string): Promise<GapAnalysis | null> {
    await this.ensureLoaded();

    const matches = this.localMatch(prompt, 5);
    if (matches.length > 0 && matches[0].score > 0.6) {
      return null; // Good match exists, no gap
    }

    // Import gap analysis dynamically
    const { analyzeGap } = await import('./gap-analysis.js');
    return analyzeGap(prompt, this.skillIndex, matches);
  }

  /**
   * Search external databases for skills/MCPs
   */
  async searchExternal(
    query: string,
    sources?: ExternalSource[]
  ): Promise<ExternalSuggestion[]> {
    const { ExternalQueryService, DEFAULT_QUERY_OPTIONS } = await import('./external-sources.js');
    const service = new ExternalQueryService();

    return service.query(query, {
      sources: sources || this.config.externalSources,
      maxResults: this.config.maxResults,
      minRelevance: 0.35,
    });
  }

  /**
   * Get a skill by ID
   */
  async getSkill(id: string): Promise<SkillCatalogEntry | null> {
    await this.ensureLoaded();
    return this.skillIndex.find(s => s.id === id) || null;
  }

  /**
   * List all available skills
   */
  async listSkills(filter?: {
    category?: SkillCategory;
    type?: 'skill' | 'agent' | 'mcp';
  }): Promise<SkillCatalogEntry[]> {
    await this.ensureLoaded();

    let result = this.skillIndex;

    if (filter?.category) {
      result = result.filter(s => s.category === filter.category);
    }

    if (filter?.type) {
      result = result.filter(s => s.type === filter.type);
    }

    return result;
  }

  /**
   * Get statistics about the skill index
   */
  async getStats(): Promise<{
    totalSkills: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  }> {
    await this.ensureLoaded();

    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const skill of this.skillIndex) {
      byCategory[skill.category || 'uncategorized'] =
        (byCategory[skill.category || 'uncategorized'] || 0) + 1;
      byType[skill.type] = (byType[skill.type] || 0) + 1;
    }

    return {
      totalSkills: this.skillIndex.length,
      byCategory,
      byType,
    };
  }

  // Private methods

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;

    const { loadAllSkills } = await import('./skill-loader.js');
    this.skillIndex = await loadAllSkills(this.config.projectRoot, {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    this.isLoaded = true;
  }

  private localMatch(prompt: string, maxResults: number): MatchResult[] {
    const promptLower = prompt.toLowerCase();
    const promptTokens = new Set(
      promptLower.split(/\s+/).filter(t => t.length > 2)
    );

    const results: MatchResult[] = [];

    for (const skill of this.skillIndex) {
      let score = 0;

      // Check triggers
      for (const trigger of skill.activation.triggers) {
        if (promptLower.includes(trigger.toLowerCase())) {
          score += 0.3;
        }
        // Token overlap
        const triggerTokens = trigger.toLowerCase().split(/\s+/);
        for (const tt of triggerTokens) {
          if (promptTokens.has(tt)) {
            score += 0.1;
          }
        }
      }

      // Check anti-patterns
      for (const notFor of skill.activation.notFor) {
        if (promptLower.includes(notFor.toLowerCase())) {
          score -= 0.5;
        }
      }

      // Description matching
      const descLower = skill.description.toLowerCase();
      for (const token of promptTokens) {
        if (descLower.includes(token)) {
          score += 0.05;
        }
      }

      // Name matching
      if (promptLower.includes(skill.name.toLowerCase())) {
        score += 0.4;
      }

      // Normalize
      score = Math.min(Math.max(score, 0), 1);

      if (score >= this.config.matchThreshold) {
        results.push({
          skill,
          score,
          matchType: 'keyword',
          reasoning: this.generateReasoning(skill, score),
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private generateReasoning(skill: SkillCatalogEntry, score: number): string {
    const parts: string[] = [];

    if (score > 0.7) {
      parts.push('Strong match');
    } else if (score > 0.5) {
      parts.push('Good match');
    } else {
      parts.push('Partial match');
    }

    if (skill.tags && skill.tags.length > 0) {
      parts.push(`Tags: ${skill.tags.slice(0, 3).map(t => t.id).join(', ')}`);
    }

    parts.push(`Category: ${skill.category}`);

    return parts.join('. ');
  }

  private generateExampleUsage(skill: SkillCatalogEntry, prompt: string): string {
    return `To use the ${skill.name} skill, include "${skill.activation.triggers[0] || skill.name}" in your prompt.`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick match function for simple use cases
 */
export async function matchSkills(
  prompt: string,
  options?: MatchOptions
): Promise<SkillSuggestion[]> {
  const client = new SkillMatcherClient();
  return client.matchSkills(prompt, options);
}

/**
 * Get gap analysis for a prompt
 */
export async function analyzeGap(prompt: string): Promise<GapAnalysis | null> {
  const client = new SkillMatcherClient();
  return client.analyzeGap(prompt);
}

/**
 * Search external databases
 */
export async function searchExternal(
  query: string,
  sources?: ExternalSource[]
): Promise<ExternalSuggestion[]> {
  const client = new SkillMatcherClient();
  return client.searchExternal(query, sources);
}

// ============================================================================
// CLI
// ============================================================================

async function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const query = args.slice(1).join(' ');

  const client = new SkillMatcherClient();

  switch (command) {
    case 'match':
      if (!query) {
        console.error('Usage: skill-matcher match <prompt>');
        process.exit(1);
      }
      const matches = await client.matchSkills(query);
      console.log(JSON.stringify(matches, null, 2));
      break;

    case 'gap':
      if (!query) {
        console.error('Usage: skill-matcher gap <prompt>');
        process.exit(1);
      }
      const gap = await client.analyzeGap(query);
      console.log(JSON.stringify(gap, null, 2));
      break;

    case 'external':
      if (!query) {
        console.error('Usage: skill-matcher external <query>');
        process.exit(1);
      }
      const external = await client.searchExternal(query);
      console.log(JSON.stringify(external, null, 2));
      break;

    case 'list':
      const skills = await client.listSkills();
      console.log(JSON.stringify(skills.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        category: s.category,
      })), null, 2));
      break;

    case 'stats':
      const stats = await client.getStats();
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log(`
Skill Matcher CLI

Commands:
  match <prompt>     Find skills matching a prompt
  gap <prompt>       Analyze skill gap for a prompt
  external <query>   Search external databases
  list               List all skills
  stats              Show index statistics

Examples:
  skill-matcher match "help me design a website"
  skill-matcher gap "help me with quantum computing"
  skill-matcher external "file system access"
`);
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cli().catch(console.error);
}

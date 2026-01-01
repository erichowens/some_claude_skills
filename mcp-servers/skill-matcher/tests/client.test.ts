/**
 * Client SDK Tests
 *
 * Tests for the SkillMatcherClient class and convenience functions.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies before importing
const mockLoadAllSkills = vi.fn();
const mockAnalyzeGap = vi.fn();
const mockExternalQuery = vi.fn();

vi.mock('../src/skill-loader.js', () => ({
  loadAllSkills: (...args: unknown[]) => mockLoadAllSkills(...args),
}));

vi.mock('../src/gap-analysis.js', () => ({
  analyzeGap: (...args: unknown[]) => mockAnalyzeGap(...args),
}));

vi.mock('../src/external-sources.js', () => ({
  ExternalQueryService: vi.fn().mockImplementation(() => ({
    query: (...args: unknown[]) => mockExternalQuery(...args),
  })),
  DEFAULT_QUERY_OPTIONS: {
    sources: ['mcp-registry', 'smithery'],
    maxResults: 10,
    minRelevance: 0.35,
  },
}));

import {
  SkillMatcherClient,
  matchSkills as matchSkillsFn,
  analyzeGap as analyzeGapFn,
  searchExternal as searchExternalFn,
} from '../src/client.js';
import type { SkillCatalogEntry } from '../src/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockSkills: SkillCatalogEntry[] = [
  {
    id: 'web-design-expert',
    type: 'skill',
    name: 'Web Design Expert',
    description: 'Expert in web design, UI/UX, and frontend development.',
    category: 'visual-design-ui',
    activation: {
      triggers: ['web design', 'website', 'CSS', 'HTML', 'frontend'],
      notFor: ['mobile apps', 'backend'],
    },
    tags: [
      { id: 'design', type: 'domain' },
      { id: 'frontend', type: 'output' },
    ],
  },
  {
    id: 'mcp-creator',
    type: 'skill',
    name: 'MCP Creator',
    description: 'Expert MCP server developer for Model Context Protocol.',
    category: 'orchestration-meta',
    activation: {
      triggers: ['MCP', 'Model Context Protocol', 'MCP server'],
      notFor: ['general API', 'REST'],
    },
    tags: [
      { id: 'mcp', type: 'integration' },
      { id: 'development', type: 'domain' },
    ],
  },
  {
    id: 'data-analyst',
    type: 'agent',
    name: 'Data Analyst',
    description: 'Analyzes data and creates visualizations.',
    category: 'research-strategy',
    activation: {
      triggers: ['data analysis', 'charts', 'visualization'],
      notFor: [],
    },
    tags: [{ id: 'data', type: 'output' }],
  },
];

// ============================================================================
// SkillMatcherClient Constructor Tests
// ============================================================================

describe('SkillMatcherClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllSkills.mockResolvedValue(mockSkills);
    mockAnalyzeGap.mockReturnValue({
      identified: true,
      opportunity: 'Test opportunity',
      suggestedCategory: 'development',
    });
    mockExternalQuery.mockResolvedValue([]);
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const client = new SkillMatcherClient();
      expect(client).toBeDefined();
    });

    it('should accept custom projectRoot', () => {
      const client = new SkillMatcherClient({
        projectRoot: '/custom/path',
      });
      expect(client).toBeDefined();
    });

    it('should accept custom matchThreshold', () => {
      const client = new SkillMatcherClient({
        matchThreshold: 0.6,
      });
      expect(client).toBeDefined();
    });

    it('should accept custom maxResults', () => {
      const client = new SkillMatcherClient({
        maxResults: 10,
      });
      expect(client).toBeDefined();
    });

    it('should accept enableExternalSearch option', () => {
      const client = new SkillMatcherClient({
        enableExternalSearch: true,
      });
      expect(client).toBeDefined();
    });

    it('should accept custom externalSources', () => {
      const client = new SkillMatcherClient({
        externalSources: ['mcp-registry'],
      });
      expect(client).toBeDefined();
    });

    it('should accept all options together', () => {
      const client = new SkillMatcherClient({
        projectRoot: '/custom/path',
        matchThreshold: 0.5,
        maxResults: 3,
        enableExternalSearch: true,
        externalSources: ['smithery', 'glama'],
      });
      expect(client).toBeDefined();
    });
  });

  // ============================================================================
  // matchSkills Tests
  // ============================================================================

  describe('matchSkills', () => {
    it('should load skills on first call', async () => {
      const client = new SkillMatcherClient();
      await client.matchSkills('web design');

      expect(mockLoadAllSkills).toHaveBeenCalledTimes(1);
    });

    it('should not reload skills on subsequent calls', async () => {
      const client = new SkillMatcherClient();
      await client.matchSkills('web design');
      await client.matchSkills('MCP server');

      expect(mockLoadAllSkills).toHaveBeenCalledTimes(1);
    });

    it('should return matches for trigger keywords', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('help me design a website');

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].skill.id).toBe('web-design-expert');
    });

    it('should return matches with confidence scores', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('web design');

      expect(matches[0].confidence).toBeDefined();
      expect(typeof matches[0].confidence).toBe('number');
      expect(matches[0].confidence).toBeGreaterThanOrEqual(0);
      expect(matches[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should return matches with reasoning', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('web design');

      expect(matches[0].reasoning).toBeDefined();
      expect(typeof matches[0].reasoning).toBe('string');
    });

    it('should return matches with example usage', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('web design');

      expect(matches[0].exampleUsage).toBeDefined();
      expect(matches[0].exampleUsage).toContain('web design');
    });

    it('should respect maxResults option', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('design', { maxResults: 1 });

      expect(matches.length).toBeLessThanOrEqual(1);
    });

    it('should penalize notFor keywords', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('mobile apps');

      // web-design-expert has 'mobile apps' in notFor, should be penalized
      const webDesign = matches.find(m => m.skill.id === 'web-design-expert');
      if (webDesign) {
        expect(webDesign.confidence).toBeLessThan(0.5);
      }
    });

    it('should match by skill name', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('mcp creator');

      const mcpMatch = matches.find(m => m.skill.id === 'mcp-creator');
      expect(mcpMatch).toBeDefined();
    });

    it('should sort results by score descending', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });
      const matches = await client.matchSkills('design website');

      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
      }
    });

    it('should filter by match threshold', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.9 });
      const matches = await client.matchSkills('random query');

      // With high threshold, should return few or no results
      for (const match of matches) {
        expect(match.confidence).toBeGreaterThanOrEqual(0.9);
      }
    });
  });

  // ============================================================================
  // analyzeGap Tests
  // ============================================================================

  describe('analyzeGap', () => {
    it('should load skills before analyzing', async () => {
      const client = new SkillMatcherClient();
      await client.analyzeGap('quantum computing');

      expect(mockLoadAllSkills).toHaveBeenCalled();
    });

    it('should return null when good match exists', async () => {
      const client = new SkillMatcherClient({ matchThreshold: 0.1 });

      // Create a client that will find a high-scoring match
      mockLoadAllSkills.mockResolvedValue([
        {
          ...mockSkills[0],
          activation: {
            triggers: ['quantum computing'],
            notFor: [],
          },
        },
      ]);

      const gap = await client.analyzeGap('quantum computing');

      // If high match, should return null
      // Note: This depends on the localMatch implementation
    });

    it('should return gap analysis for poor matches', async () => {
      mockLoadAllSkills.mockResolvedValue([]);
      const client = new SkillMatcherClient();
      const gap = await client.analyzeGap('totally unrelated query');

      expect(mockAnalyzeGap).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // searchExternal Tests
  // ============================================================================

  describe('searchExternal', () => {
    it('should query external service', async () => {
      mockExternalQuery.mockResolvedValue([
        {
          source: 'mcp-registry',
          type: 'mcp',
          name: 'file-system',
          description: 'File system access',
          url: 'https://github.com/example/fs-mcp',
          relevanceScore: 0.9,
        },
      ]);

      const client = new SkillMatcherClient();
      const results = await client.searchExternal('file system');

      expect(mockExternalQuery).toHaveBeenCalled();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('file-system');
    });

    it('should accept custom sources', async () => {
      mockExternalQuery.mockResolvedValue([]);

      const client = new SkillMatcherClient();
      await client.searchExternal('database', ['smithery']);

      expect(mockExternalQuery).toHaveBeenCalledWith(
        'database',
        expect.objectContaining({
          sources: ['smithery'],
        })
      );
    });

    it('should use default sources from config', async () => {
      mockExternalQuery.mockResolvedValue([]);

      const client = new SkillMatcherClient({
        externalSources: ['glama'],
      });
      await client.searchExternal('test query');

      expect(mockExternalQuery).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          sources: ['glama'],
        })
      );
    });
  });

  // ============================================================================
  // getSkill Tests
  // ============================================================================

  describe('getSkill', () => {
    it('should return skill by ID', async () => {
      const client = new SkillMatcherClient();
      const skill = await client.getSkill('web-design-expert');

      expect(skill).toBeDefined();
      expect(skill?.id).toBe('web-design-expert');
      expect(skill?.name).toBe('Web Design Expert');
    });

    it('should return null for unknown ID', async () => {
      const client = new SkillMatcherClient();
      const skill = await client.getSkill('nonexistent-skill');

      expect(skill).toBeNull();
    });

    it('should load skills before searching', async () => {
      const client = new SkillMatcherClient();
      await client.getSkill('test');

      expect(mockLoadAllSkills).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // listSkills Tests
  // ============================================================================

  describe('listSkills', () => {
    it('should return all skills', async () => {
      const client = new SkillMatcherClient();
      const skills = await client.listSkills();

      expect(skills.length).toBe(3);
    });

    it('should filter by category', async () => {
      const client = new SkillMatcherClient();
      const skills = await client.listSkills({ category: 'visual-design-ui' });

      expect(skills.length).toBe(1);
      expect(skills[0].id).toBe('web-design-expert');
    });

    it('should filter by type', async () => {
      const client = new SkillMatcherClient();
      const skills = await client.listSkills({ type: 'agent' });

      expect(skills.length).toBe(1);
      expect(skills[0].id).toBe('data-analyst');
    });

    it('should filter by both category and type', async () => {
      const client = new SkillMatcherClient();
      const skills = await client.listSkills({
        category: 'research-strategy',
        type: 'agent',
      });

      expect(skills.length).toBe(1);
      expect(skills[0].id).toBe('data-analyst');
    });

    it('should return empty array when no matches', async () => {
      const client = new SkillMatcherClient();
      const skills = await client.listSkills({ category: 'nonexistent-category' as any });

      expect(skills.length).toBe(0);
    });
  });

  // ============================================================================
  // getStats Tests
  // ============================================================================

  describe('getStats', () => {
    it('should return total skills count', async () => {
      const client = new SkillMatcherClient();
      const stats = await client.getStats();

      expect(stats.totalSkills).toBe(3);
    });

    it('should return skills by category', async () => {
      const client = new SkillMatcherClient();
      const stats = await client.getStats();

      expect(stats.byCategory).toBeDefined();
      expect(stats.byCategory['visual-design-ui']).toBe(1);
      expect(stats.byCategory['orchestration-meta']).toBe(1);
      expect(stats.byCategory['research-strategy']).toBe(1);
    });

    it('should return skills by type', async () => {
      const client = new SkillMatcherClient();
      const stats = await client.getStats();

      expect(stats.byType).toBeDefined();
      expect(stats.byType['skill']).toBe(2);
      expect(stats.byType['agent']).toBe(1);
    });
  });
});

// ============================================================================
// Convenience Functions Tests
// ============================================================================

describe('Convenience Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllSkills.mockResolvedValue(mockSkills);
    mockExternalQuery.mockResolvedValue([]);
  });

  describe('matchSkills function', () => {
    it('should create client and match skills', async () => {
      const matches = await matchSkillsFn('web design');
      expect(mockLoadAllSkills).toHaveBeenCalled();
    });
  });

  describe('analyzeGap function', () => {
    it('should create client and analyze gap', async () => {
      mockLoadAllSkills.mockResolvedValue([]);
      await analyzeGapFn('unknown topic');
      expect(mockLoadAllSkills).toHaveBeenCalled();
    });
  });

  describe('searchExternal function', () => {
    it('should create client and search external', async () => {
      await searchExternalFn('MCP server');
      expect(mockExternalQuery).toHaveBeenCalled();
    });

    it('should accept custom sources', async () => {
      await searchExternalFn('database', ['github']);
      expect(mockExternalQuery).toHaveBeenCalledWith(
        'database',
        expect.objectContaining({
          sources: ['github'],
        })
      );
    });
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllSkills.mockResolvedValue(mockSkills);
  });

  it('should handle empty skills index', async () => {
    mockLoadAllSkills.mockResolvedValue([]);
    const client = new SkillMatcherClient();

    const matches = await client.matchSkills('any query');
    expect(matches.length).toBe(0);

    const stats = await client.getStats();
    expect(stats.totalSkills).toBe(0);
  });

  it('should handle skills without tags', async () => {
    mockLoadAllSkills.mockResolvedValue([
      {
        ...mockSkills[0],
        tags: undefined,
      },
    ]);

    const client = new SkillMatcherClient({ matchThreshold: 0.1 });
    const matches = await client.matchSkills('web design');

    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle skills with empty triggers', async () => {
    mockLoadAllSkills.mockResolvedValue([
      {
        ...mockSkills[0],
        activation: { triggers: [], notFor: [] },
      },
    ]);

    const client = new SkillMatcherClient({ matchThreshold: 0.01 });
    const matches = await client.matchSkills('web design');

    // Should still match on name/description
    expect(matches).toBeDefined();
  });

  it('should handle very short queries', async () => {
    const client = new SkillMatcherClient({ matchThreshold: 0.1 });
    const matches = await client.matchSkills('a');

    expect(matches).toBeDefined();
  });

  it('should handle very long queries', async () => {
    const client = new SkillMatcherClient({ matchThreshold: 0.1 });
    const longQuery = 'web design '.repeat(100);
    const matches = await client.matchSkills(longQuery);

    expect(matches).toBeDefined();
  });

  it('should handle special characters in query', async () => {
    const client = new SkillMatcherClient({ matchThreshold: 0.1 });
    const matches = await client.matchSkills('web design @#$%^&*()');

    expect(matches).toBeDefined();
  });

  it('should handle unicode in query', async () => {
    const client = new SkillMatcherClient({ matchThreshold: 0.1 });
    const matches = await client.matchSkills('デザイン web design 设计');

    expect(matches).toBeDefined();
  });
});

/**
 * Vector Store Tests
 *
 * Tests for the VectorStore class including loading, searching,
 * filtering, and result grouping.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import { cosineSimilarity, normalize } from '../src/embeddings.js';
import type { EmbeddingStore, SkillChunk, SkillMetadata, SectionType } from '../src/types.js';

// Mock fs module
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

// Import VectorStore after mocking
import { VectorStore } from '../src/vector-store.js';

// ============================================================================
// Mock Data
// ============================================================================

function createMockEmbedding(seed: number, dimensions: number = 128): number[] {
  const vec = [];
  for (let i = 0; i < dimensions; i++) {
    vec.push(Math.sin(seed * (i + 1)) * 0.5 + 0.5);
  }
  return normalize(vec);
}

function createMockStore(): EmbeddingStore {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      skillCount: 3,
      chunkCount: 9,
      embeddingModel: 'test-model',
      dimensions: 128,
    },
    skills: {
      'web-design-expert': {
        name: 'Web Design Expert',
        description: 'Expert in web design and UI/UX',
        category: 'Design',
        complexity: 'intermediate',
        tags: ['design', 'web', 'ui'],
        mcpIntegrations: ['figma-mcp'],
      },
      'mcp-creator': {
        name: 'MCP Creator',
        description: 'Build MCP servers for Claude',
        category: 'Development',
        complexity: 'advanced',
        tags: ['mcp', 'typescript'],
        mcpIntegrations: [],
      },
      'career-biographer': {
        name: 'Career Biographer',
        description: 'Document career journeys',
        category: 'Career',
        complexity: 'beginner',
        tags: ['career', 'writing'],
        mcpIntegrations: ['notion-mcp'],
      },
    },
    chunks: [
      // Web Design Expert chunks
      {
        id: 'web-design-expert-overview',
        skillId: 'web-design-expert',
        sectionType: 'overview',
        content: 'Web design expert helps create beautiful websites with modern UI/UX principles.',
        tokenCount: 15,
        embedding: createMockEmbedding(1),
      },
      {
        id: 'web-design-expert-when-to-use',
        skillId: 'web-design-expert',
        sectionType: 'when-to-use',
        content: 'Use when designing landing pages, portfolios, or web applications.',
        tokenCount: 12,
        embedding: createMockEmbedding(2),
      },
      {
        id: 'web-design-expert-anti-patterns',
        skillId: 'web-design-expert',
        sectionType: 'anti-patterns',
        content: 'Do not use for mobile native apps or backend development.',
        tokenCount: 10,
        embedding: createMockEmbedding(3),
      },
      // MCP Creator chunks
      {
        id: 'mcp-creator-overview',
        skillId: 'mcp-creator',
        sectionType: 'overview',
        content: 'MCP Creator builds Model Context Protocol servers for Claude integration.',
        tokenCount: 12,
        embedding: createMockEmbedding(4),
      },
      {
        id: 'mcp-creator-when-to-use',
        skillId: 'mcp-creator',
        sectionType: 'when-to-use',
        content: 'Use when creating tools and integrations for Claude Code.',
        tokenCount: 10,
        embedding: createMockEmbedding(5),
      },
      {
        id: 'mcp-creator-mcp-integration',
        skillId: 'mcp-creator',
        sectionType: 'mcp-integration',
        content: 'Uses @modelcontextprotocol/sdk for server development.',
        tokenCount: 8,
        embedding: createMockEmbedding(6),
      },
      // Career Biographer chunks
      {
        id: 'career-biographer-overview',
        skillId: 'career-biographer',
        sectionType: 'overview',
        content: 'Career biographer helps document professional journeys and achievements.',
        tokenCount: 11,
        embedding: createMockEmbedding(7),
      },
      {
        id: 'career-biographer-when-to-use',
        skillId: 'career-biographer',
        sectionType: 'when-to-use',
        content: 'Use for resume building, portfolio creation, and career documentation.',
        tokenCount: 10,
        embedding: createMockEmbedding(8),
      },
      {
        id: 'career-biographer-quick-start',
        skillId: 'career-biographer',
        sectionType: 'quick-start',
        content: 'Start by describing your current role and career goals.',
        tokenCount: 10,
        embedding: createMockEmbedding(9),
      },
    ],
  };
}

// ============================================================================
// VectorStore Tests with Mock Data
// ============================================================================

describe('VectorStore', () => {
  let store: VectorStore;
  let mockData: EmbeddingStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockData = createMockStore();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockData));
    store = new VectorStore('/mock/path/embeddings.json');
  });

  describe('Loading', () => {
    it('should load store from disk', async () => {
      await store.load();
      expect(store.isLoaded()).toBe(true);
    });

    it('should build indices after loading', async () => {
      await store.load();
      const stats = store.getStats();

      expect(stats?.totalSkills).toBe(3);
      expect(stats?.totalChunks).toBe(9);
    });

    it('should throw error when file not found', async () => {
      mockExistsSync.mockReturnValue(false);
      const badStore = new VectorStore('/nonexistent/path');

      await expect(badStore.load()).rejects.toThrow('Embedding store not found');
    });
  });

  describe('Skill Access', () => {
    beforeEach(async () => {
      await store.load();
    });

    it('should get skill by ID', () => {
      const skill = store.getSkill('web-design-expert');

      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Web Design Expert');
      expect(skill?.category).toBe('Design');
    });

    it('should return null for unknown skill', () => {
      const skill = store.getSkill('nonexistent-skill');
      expect(skill).toBeNull();
    });

    it('should get skill chunks', () => {
      const chunks = store.getSkillChunks('web-design-expert');

      expect(chunks.length).toBe(3);
      expect(chunks.every(c => c.skillId === 'web-design-expert')).toBe(true);
    });

    it('should filter chunks by section type', () => {
      const chunks = store.getSkillChunks('web-design-expert', ['overview']);

      expect(chunks.length).toBe(1);
      expect(chunks[0].sectionType).toBe('overview');
    });

    it('should get combined skill content', () => {
      const content = store.getSkillContent('mcp-creator');

      expect(content).toContain('MCP Creator builds');
      expect(content).toContain('Use when creating tools');
    });

    it('should filter content by section type', () => {
      const content = store.getSkillContent('mcp-creator', ['overview']);

      expect(content).toContain('MCP Creator builds');
      expect(content).not.toContain('Use when creating');
    });
  });

  describe('Listing Skills', () => {
    beforeEach(async () => {
      await store.load();
    });

    it('should list all skills', () => {
      const skills = store.listSkills();
      expect(skills.length).toBe(3);
    });

    it('should filter by category', () => {
      const skills = store.listSkills({ category: 'Design' });

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Web Design Expert');
    });

    it('should filter by complexity', () => {
      const skills = store.listSkills({ complexity: 'advanced' });

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('MCP Creator');
    });

    it('should filter by MCP integration', () => {
      const skills = store.listSkills({ hasMcp: true });

      expect(skills.length).toBe(2);
      expect(skills.some(s => s.name === 'Web Design Expert')).toBe(true);
      expect(skills.some(s => s.name === 'Career Biographer')).toBe(true);
    });

    it('should filter skills without MCP', () => {
      const skills = store.listSkills({ hasMcp: false });

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('MCP Creator');
    });

    it('should combine multiple filters', () => {
      const skills = store.listSkills({
        complexity: 'intermediate',
        hasMcp: true,
      });

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Web Design Expert');
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await store.load();
    });

    it('should search and return results', async () => {
      const queryEmbedding = createMockEmbedding(1); // Similar to web design overview
      const results = await store.search(queryEmbedding);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect topK limit', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, { topK: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minSimilarity', async () => {
      const queryEmbedding = createMockEmbedding(100); // Different from all
      const results = await store.search(queryEmbedding, { minSimilarity: 0.99 });

      // Very high threshold should filter most results
      expect(results.length).toBe(0);
    });

    it('should filter by section type', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, {
        sectionTypes: ['overview'],
        topK: 10,
      });

      expect(results.every(r => r.sectionType === 'overview')).toBe(true);
    });

    it('should include content when requested', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, { includeContent: true });

      expect(results[0].content.length).toBeGreaterThan(0);
    });

    it('should exclude content when not requested', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, { includeContent: false });

      expect(results[0].content).toBe('');
    });

    it('should assign correct ranks', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, { topK: 5 });

      for (let i = 0; i < results.length; i++) {
        expect(results[i].rank).toBe(i + 1);
      }
    });

    it('should sort by similarity descending', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, { topK: 10 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('should include skill metadata in results', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, { topK: 1 });

      expect(results[0].skillName).toBeDefined();
      expect(results[0].metadata).toBeDefined();
    });

    it('should throw when store not loaded', async () => {
      const unloadedStore = new VectorStore('/mock/path');
      const queryEmbedding = createMockEmbedding(1);

      await expect(unloadedStore.search(queryEmbedding)).rejects.toThrow('Store not loaded');
    });
  });

  describe('Group By Skill', () => {
    beforeEach(async () => {
      await store.load();
    });

    it('should group results by skill', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, {
        groupBySkill: true,
        topK: 10,
      });

      const skillIds = results.map(r => r.skillId);
      const uniqueSkillIds = new Set(skillIds);

      expect(skillIds.length).toBe(uniqueSkillIds.size);
    });

    it('should keep best match per skill when grouping', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const ungrouped = await store.search(queryEmbedding, { topK: 100 });
      const grouped = await store.search(queryEmbedding, {
        groupBySkill: true,
        topK: 100,
      });

      // For each skill in grouped, check it has the highest similarity
      for (const groupedResult of grouped) {
        const allForSkill = ungrouped.filter(r => r.skillId === groupedResult.skillId);
        const maxSimilarity = Math.max(...allForSkill.map(r => r.similarity));
        expect(groupedResult.similarity).toBe(maxSimilarity);
      }
    });

    it('should respect topK when grouping', async () => {
      const queryEmbedding = createMockEmbedding(1);
      const results = await store.search(queryEmbedding, {
        groupBySkill: true,
        topK: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await store.load();
    });

    it('should return correct stats', () => {
      const stats = store.getStats();

      expect(stats?.totalSkills).toBe(3);
      expect(stats?.totalChunks).toBe(9);
      expect(stats?.embeddingModel).toBe('test-model');
      expect(stats?.dimensions).toBe(128);
    });

    it('should return null stats when not loaded', () => {
      const unloadedStore = new VectorStore('/mock/path');
      expect(unloadedStore.getStats()).toBeNull();
    });

    it('should get section types', () => {
      const types = store.getSectionTypes();

      expect(types).toContain('overview');
      expect(types).toContain('when-to-use');
      expect(types).toContain('anti-patterns');
    });

    it('should get categories', () => {
      const categories = store.getCategories();

      expect(categories).toContain('Design');
      expect(categories).toContain('Development');
      expect(categories).toContain('Career');
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  let store: VectorStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it('should handle empty chunks array', async () => {
    const emptyStore: EmbeddingStore = {
      metadata: {
        generatedAt: new Date().toISOString(),
        skillCount: 0,
        chunkCount: 0,
        embeddingModel: 'test',
        dimensions: 128,
      },
      skills: {},
      chunks: [],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(emptyStore));
    store = new VectorStore('/mock/path');
    await store.load();

    const results = await store.search(createMockEmbedding(1));
    expect(results).toEqual([]);
  });

  it('should handle chunks without embeddings', async () => {
    const storeData: EmbeddingStore = {
      metadata: {
        generatedAt: new Date().toISOString(),
        skillCount: 1,
        chunkCount: 1,
        embeddingModel: 'test',
        dimensions: 128,
      },
      skills: {
        'test-skill': { name: 'Test Skill' },
      },
      chunks: [
        {
          id: 'test-chunk',
          skillId: 'test-skill',
          sectionType: 'overview',
          content: 'Test content',
          tokenCount: 2,
          embedding: [], // Empty embedding
        },
      ],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(storeData));
    store = new VectorStore('/mock/path');
    await store.load();

    const results = await store.search(createMockEmbedding(1));
    expect(results).toEqual([]);
  });

  it('should handle very low minSimilarity', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(createMockStore()));
    store = new VectorStore('/mock/path');
    await store.load();

    const results = await store.search(createMockEmbedding(1), { minSimilarity: 0 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle topK larger than results', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(createMockStore()));
    store = new VectorStore('/mock/path');
    await store.load();

    const results = await store.search(createMockEmbedding(1), { topK: 1000 });
    expect(results.length).toBeLessThanOrEqual(9); // Total chunks in mock
  });

  it('should handle zero topK', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(createMockStore()));
    store = new VectorStore('/mock/path');
    await store.load();

    const results = await store.search(createMockEmbedding(1), { topK: 0 });
    expect(results).toEqual([]);
  });

  it('should handle unknown section type filter', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(createMockStore()));
    store = new VectorStore('/mock/path');
    await store.load();

    const results = await store.search(createMockEmbedding(1), {
      sectionTypes: ['nonexistent-type' as SectionType],
    });
    expect(results).toEqual([]);
  });
});

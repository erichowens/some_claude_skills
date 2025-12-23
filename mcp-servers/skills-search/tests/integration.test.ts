/**
 * Integration Tests for Skills Search MCP Server
 *
 * Tests for the complete flow including tool handlers,
 * resource handlers, and response formatting.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  SearchSkillsArgs,
  GetSkillArgs,
  ListSkillsArgs,
  RecommendSkillArgs,
  CompareSkillsArgs,
  EmbeddingStore,
  SectionType,
} from '../src/types.js';
import { EmbeddingService, normalize } from '../src/embeddings.js';

// ============================================================================
// Mock Data Setup
// ============================================================================

function createMockEmbedding(seed: number, dimensions: number = 128): number[] {
  const vec = [];
  for (let i = 0; i < dimensions; i++) {
    vec.push(Math.sin(seed * (i + 1)) * 0.5 + 0.5);
  }
  return normalize(vec);
}

const mockStore: EmbeddingStore = {
  metadata: {
    generatedAt: new Date().toISOString(),
    skillCount: 4,
    chunkCount: 12,
    embeddingModel: 'text-embedding-3-small',
    dimensions: 128,
  },
  skills: {
    'web-design-expert': {
      name: 'Web Design Expert',
      description: 'Expert in web design, CSS, HTML, UI/UX, and responsive layouts',
      category: 'Design',
      complexity: 'intermediate',
      tags: ['design', 'web', 'css', 'html'],
      triggers: ['web design', 'website', 'landing page'],
      notFor: ['mobile apps', 'backend'],
      mcpIntegrations: ['figma-mcp'],
    },
    'mcp-creator': {
      name: 'MCP Creator',
      description: 'Build Model Context Protocol servers for Claude integration',
      category: 'Development',
      complexity: 'advanced',
      tags: ['mcp', 'typescript', 'tools'],
      triggers: ['MCP server', 'model context protocol'],
      notFor: ['general APIs'],
      mcpIntegrations: [],
    },
    'career-biographer': {
      name: 'Career Biographer',
      description: 'Document career journeys, create portfolios, and build CVs',
      category: 'Career',
      complexity: 'beginner',
      tags: ['career', 'writing', 'portfolio'],
      triggers: ['career story', 'resume', 'CV'],
      notFor: ['fiction writing'],
      mcpIntegrations: ['notion-mcp'],
    },
    'data-pipeline-engineer': {
      name: 'Data Pipeline Engineer',
      description: 'Design ETL pipelines, data warehouses, and streaming architectures',
      category: 'Data',
      complexity: 'advanced',
      tags: ['data', 'etl', 'pipeline'],
      triggers: ['data pipeline', 'ETL', 'data warehouse'],
      notFor: ['frontend', 'UI'],
      mcpIntegrations: ['postgres-mcp', 'kafka-mcp'],
    },
  },
  chunks: [
    // Web Design Expert chunks
    {
      id: 'web-design-expert-overview',
      skillId: 'web-design-expert',
      sectionType: 'overview',
      content: 'The Web Design Expert helps create beautiful, responsive websites using modern CSS and HTML techniques. Specializes in UI/UX best practices and accessibility.',
      tokenCount: 25,
      embedding: createMockEmbedding(1),
    },
    {
      id: 'web-design-expert-when-to-use',
      skillId: 'web-design-expert',
      sectionType: 'when-to-use',
      content: 'Use when designing landing pages, portfolios, marketing websites, or any web-based user interface.',
      tokenCount: 18,
      embedding: createMockEmbedding(2),
    },
    {
      id: 'web-design-expert-anti-patterns',
      skillId: 'web-design-expert',
      sectionType: 'anti-patterns',
      content: 'Do not use for mobile native apps, backend development, or database design.',
      tokenCount: 14,
      embedding: createMockEmbedding(3),
    },
    // MCP Creator chunks
    {
      id: 'mcp-creator-overview',
      skillId: 'mcp-creator',
      sectionType: 'overview',
      content: 'MCP Creator builds safe, performant Model Context Protocol servers. Uses TypeScript and the @modelcontextprotocol/sdk.',
      tokenCount: 20,
      embedding: createMockEmbedding(4),
    },
    {
      id: 'mcp-creator-when-to-use',
      skillId: 'mcp-creator',
      sectionType: 'when-to-use',
      content: 'Use when you need to create tools, resources, or prompts for Claude Code integration.',
      tokenCount: 15,
      embedding: createMockEmbedding(5),
    },
    {
      id: 'mcp-creator-mcp-integration',
      skillId: 'mcp-creator',
      sectionType: 'mcp-integration',
      content: 'Requires @modelcontextprotocol/sdk. Supports stdio and SSE transports.',
      tokenCount: 12,
      embedding: createMockEmbedding(6),
    },
    // Career Biographer chunks
    {
      id: 'career-biographer-overview',
      skillId: 'career-biographer',
      sectionType: 'overview',
      content: 'Career Biographer helps document professional journeys through empathetic interviews and structured narrative extraction.',
      tokenCount: 18,
      embedding: createMockEmbedding(7),
    },
    {
      id: 'career-biographer-when-to-use',
      skillId: 'career-biographer',
      sectionType: 'when-to-use',
      content: 'Use for creating resumes, CVs, portfolio narratives, or career transition documentation.',
      tokenCount: 14,
      embedding: createMockEmbedding(8),
    },
    {
      id: 'career-biographer-quick-start',
      skillId: 'career-biographer',
      sectionType: 'quick-start',
      content: 'Begin by describing your current role, key achievements, and career aspirations.',
      tokenCount: 13,
      embedding: createMockEmbedding(9),
    },
    // Data Pipeline Engineer chunks
    {
      id: 'data-pipeline-engineer-overview',
      skillId: 'data-pipeline-engineer',
      sectionType: 'overview',
      content: 'Data Pipeline Engineer designs scalable ETL/ELT pipelines, streaming architectures, and data warehouse solutions.',
      tokenCount: 17,
      embedding: createMockEmbedding(10),
    },
    {
      id: 'data-pipeline-engineer-when-to-use',
      skillId: 'data-pipeline-engineer',
      sectionType: 'when-to-use',
      content: 'Use when building data pipelines with Kafka, Spark, Airflow, or designing star schemas.',
      tokenCount: 15,
      embedding: createMockEmbedding(11),
    },
    {
      id: 'data-pipeline-engineer-mcp-integration',
      skillId: 'data-pipeline-engineer',
      sectionType: 'mcp-integration',
      content: 'Integrates with postgres-mcp for database operations and kafka-mcp for streaming data.',
      tokenCount: 13,
      embedding: createMockEmbedding(12),
    },
  ],
};

// Mock fs module before importing VectorStore
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

import { VectorStore } from '../src/vector-store.js';

// ============================================================================
// Mock Tool Handlers (simulating server behavior)
// ============================================================================

class MockSkillsSearchServer {
  private vectorStore: VectorStore;
  private embeddingService: EmbeddingService;

  constructor() {
    this.vectorStore = new VectorStore('/mock/path');
    this.embeddingService = new EmbeddingService(undefined, { dimensions: 128 });
  }

  async initialize(): Promise<void> {
    await this.vectorStore.load();
  }

  async searchSkills(args: SearchSkillsArgs) {
    const {
      query,
      top_k = 5,
      min_similarity = 0.3,
      section_types,
      group_by_skill = false,
    } = args;

    const queryEmbedding = await this.embeddingService.embed(query);
    const results = await this.vectorStore.search(queryEmbedding, {
      topK: top_k,
      minSimilarity: min_similarity,
      sectionTypes: section_types as SectionType[],
      groupBySkill: group_by_skill,
      includeContent: true,
    });

    return results;
  }

  async getSkill(args: GetSkillArgs) {
    const { skill_id, sections } = args;

    const skill = this.vectorStore.getSkill(skill_id);
    if (!skill) {
      return { error: `Skill not found: ${skill_id}` };
    }

    const content = this.vectorStore.getSkillContent(skill_id, sections as SectionType[]);
    return { skill, content };
  }

  async listSkills(args: ListSkillsArgs) {
    const { category, complexity, has_mcp } = args;

    return this.vectorStore.listSkills({
      category,
      complexity,
      hasMcp: has_mcp,
    });
  }

  async recommendSkill(args: RecommendSkillArgs) {
    const { task_description, current_context, exclude_skills } = args;

    let query = task_description;
    if (current_context) {
      query += `\n\nContext: ${current_context}`;
    }

    const queryEmbedding = await this.embeddingService.embed(query);
    let results = await this.vectorStore.search(queryEmbedding, {
      topK: 10,
      minSimilarity: 0.25,
      groupBySkill: true,
      includeContent: true,
    });

    if (exclude_skills && exclude_skills.length > 0) {
      const excludeSet = new Set(exclude_skills);
      results = results.filter(r => !excludeSet.has(r.skillId));
    }

    return results.slice(0, 3);
  }

  async compareSkills(args: CompareSkillsArgs) {
    const { skill_ids, aspects = ['capabilities', 'triggers', 'anti-patterns', 'tools'] } = args;

    const skills = [];
    const notFound = [];

    for (const id of skill_ids) {
      const skill = this.vectorStore.getSkill(id);
      if (skill) {
        skills.push({ id, ...skill });
      } else {
        notFound.push(id);
      }
    }

    if (notFound.length > 0) {
      return { error: `Skills not found: ${notFound.join(', ')}` };
    }

    if (skills.length < 2) {
      return { error: 'Need at least 2 valid skills to compare' };
    }

    return { skills, aspects };
  }

  getStats() {
    return this.vectorStore.getStats();
  }

  getCategories() {
    return this.vectorStore.getCategories();
  }
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Skills Search Integration', () => {
  let server: MockSkillsSearchServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockStore));
    server = new MockSkillsSearchServer();
    await server.initialize();
  });

  describe('search_skills', () => {
    it('should find relevant skills for design queries', async () => {
      const results = await server.searchSkills({
        query: 'web design website landing page',
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should find relevant skills for MCP queries', async () => {
      const results = await server.searchSkills({
        query: 'build MCP server Model Context Protocol',
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect section_types filter', async () => {
      const results = await server.searchSkills({
        query: 'use when',
        section_types: ['when-to-use'],
      });

      expect(results.every(r => r.sectionType === 'when-to-use')).toBe(true);
    });

    it('should group results by skill', async () => {
      const results = await server.searchSkills({
        query: 'design development',
        group_by_skill: true,
      });

      const skillIds = results.map(r => r.skillId);
      const uniqueIds = new Set(skillIds);

      expect(skillIds.length).toBe(uniqueIds.size);
    });

    it('should respect min_similarity threshold', async () => {
      const lowThreshold = await server.searchSkills({
        query: 'test query',
        min_similarity: 0.1,
      });

      const highThreshold = await server.searchSkills({
        query: 'test query',
        min_similarity: 0.9,
      });

      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });

    it('should respect top_k limit', async () => {
      const results = await server.searchSkills({
        query: 'design',
        top_k: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('get_skill', () => {
    it('should retrieve skill by ID', async () => {
      const result = await server.getSkill({
        skill_id: 'web-design-expert',
      });

      expect(result.skill).toBeDefined();
      expect(result.skill?.name).toBe('Web Design Expert');
      expect(result.content).toContain('beautiful');
    });

    it('should filter by sections', async () => {
      const result = await server.getSkill({
        skill_id: 'mcp-creator',
        sections: ['overview'],
      });

      expect(result.content).toContain('Model Context Protocol');
      expect(result.content).not.toContain('when you need to create');
    });

    it('should return error for unknown skill', async () => {
      const result = await server.getSkill({
        skill_id: 'nonexistent-skill',
      });

      expect(result.error).toContain('not found');
    });
  });

  describe('list_skills', () => {
    it('should list all skills', async () => {
      const skills = await server.listSkills({});

      expect(skills.length).toBe(4);
    });

    it('should filter by category', async () => {
      const skills = await server.listSkills({
        category: 'Design',
      });

      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Web Design Expert');
    });

    it('should filter by complexity', async () => {
      const skills = await server.listSkills({
        complexity: 'advanced',
      });

      expect(skills.length).toBe(2);
      expect(skills.some(s => s.name === 'MCP Creator')).toBe(true);
      expect(skills.some(s => s.name === 'Data Pipeline Engineer')).toBe(true);
    });

    it('should filter by MCP integration', async () => {
      const withMcp = await server.listSkills({
        has_mcp: true,
      });

      expect(withMcp.length).toBe(3);
      expect(withMcp.every(s => s.mcpIntegrations && s.mcpIntegrations.length > 0)).toBe(true);
    });
  });

  describe('recommend_skill', () => {
    it('should provide recommendations', async () => {
      const results = await server.recommendSkill({
        task_description: 'I need to design a website for my portfolio',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should respect exclude_skills', async () => {
      const excludedResults = await server.recommendSkill({
        task_description: 'design development',
        exclude_skills: ['web-design-expert'],
      });

      expect(excludedResults.every(r => r.skillId !== 'web-design-expert')).toBe(true);
    });

    it('should incorporate context', async () => {
      const withContext = await server.recommendSkill({
        task_description: 'create a website',
        current_context: 'I am building a portfolio for a photographer',
      });

      expect(withContext.length).toBeGreaterThan(0);
    });
  });

  describe('compare_skills', () => {
    it('should compare multiple skills', async () => {
      const result = await server.compareSkills({
        skill_ids: ['web-design-expert', 'mcp-creator'],
      });

      expect(result.skills).toBeDefined();
      expect(result.skills?.length).toBe(2);
    });

    it('should handle partial valid IDs', async () => {
      const result = await server.compareSkills({
        skill_ids: ['web-design-expert', 'nonexistent'],
      });

      expect(result.error).toContain('not found');
    });

    it('should require at least 2 skills', async () => {
      const result = await server.compareSkills({
        skill_ids: ['web-design-expert'],
      });

      expect(result.error).toContain('at least 2');
    });

    it('should support aspect filtering', async () => {
      const result = await server.compareSkills({
        skill_ids: ['web-design-expert', 'mcp-creator', 'career-biographer'],
        aspects: ['capabilities', 'triggers'],
      });

      expect(result.aspects).toContain('capabilities');
      expect(result.aspects).toContain('triggers');
      expect(result.aspects).not.toContain('tools');
    });
  });

  describe('Resources', () => {
    it('should provide stats resource', () => {
      const stats = server.getStats();

      expect(stats?.totalSkills).toBe(4);
      expect(stats?.totalChunks).toBe(12);
      expect(stats?.embeddingModel).toBe('text-embedding-3-small');
    });

    it('should provide categories resource', () => {
      const categories = server.getCategories();

      expect(categories).toContain('Design');
      expect(categories).toContain('Development');
      expect(categories).toContain('Career');
      expect(categories).toContain('Data');
    });
  });
});

// ============================================================================
// Response Formatting Tests
// ============================================================================

describe('Response Formatting', () => {
  let server: MockSkillsSearchServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockStore));
    server = new MockSkillsSearchServer();
    await server.initialize();
  });

  it('should format search results with ranks', async () => {
    const results = await server.searchSkills({
      query: 'design web',
      top_k: 3,
    });

    for (let i = 0; i < results.length; i++) {
      expect(results[i].rank).toBe(i + 1);
    }
  });

  it('should include similarity scores', async () => {
    const results = await server.searchSkills({
      query: 'career resume portfolio',
    });

    for (const result of results) {
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
    }
  });

  it('should include content in results', async () => {
    const results = await server.searchSkills({
      query: 'MCP server',
    });

    for (const result of results) {
      expect(result.content.length).toBeGreaterThan(0);
    }
  });

  it('should include skill metadata', async () => {
    const results = await server.searchSkills({
      query: 'data pipeline ETL',
    });

    for (const result of results) {
      expect(result.skillName).toBeDefined();
      expect(result.metadata).toBeDefined();
    }
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error Handling', () => {
  let server: MockSkillsSearchServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockStore));
    server = new MockSkillsSearchServer();
    await server.initialize();
  });

  it('should handle empty query gracefully', async () => {
    const results = await server.searchSkills({
      query: '',
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle very long queries', async () => {
    const longQuery = 'design '.repeat(1000);
    const results = await server.searchSkills({
      query: longQuery,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle special characters in queries', async () => {
    const results = await server.searchSkills({
      query: 'web <design> "test" & /path/',
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle unicode queries', async () => {
    const results = await server.searchSkills({
      query: 'ウェブデザイン 日本語',
    });

    expect(Array.isArray(results)).toBe(true);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  let server: MockSkillsSearchServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockStore));
    server = new MockSkillsSearchServer();
    await server.initialize();
  });

  it('should search quickly', async () => {
    const start = Date.now();

    await server.searchSkills({
      query: 'design web development',
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should handle multiple sequential searches', async () => {
    const queries = [
      'web design',
      'MCP server',
      'career portfolio',
      'data pipeline',
      'ETL workflow',
    ];

    const start = Date.now();

    for (const query of queries) {
      await server.searchSkills({ query });
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should handle concurrent searches', async () => {
    const queries = Array.from({ length: 10 }, (_, i) => `query ${i}`);

    const start = Date.now();

    await Promise.all(
      queries.map(query => server.searchSkills({ query }))
    );

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});

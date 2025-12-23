/**
 * External Sources Integration Tests
 *
 * Tests for the ExternalQueryService including parsing different
 * source formats, rate limiting, caching, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExternalQueryService,
  RECOMMENDED_SOURCES,
  ALL_SOURCES,
  DEFAULT_QUERY_OPTIONS,
} from '../src/external-sources.js';

// ============================================================================
// Mock fetch
// ============================================================================

const originalFetch = globalThis.fetch;

function createMockFetch(responses: Record<string, { ok: boolean; data: unknown }>) {
  return vi.fn(async (url: string, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    for (const [pattern, response] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        return {
          ok: response.ok,
          status: response.ok ? 200 : 404,
          text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          json: async () => response.data,
        };
      }
    }

    return {
      ok: false,
      status: 404,
      text: async () => 'Not found',
      json: async () => ({ error: 'Not found' }),
    };
  });
}

// ============================================================================
// Mock Data
// ============================================================================

const mockMcpRegistryReadme = `
# MCP Servers

A collection of Model Context Protocol servers.

## Databases

- [postgres-mcp](https://github.com/example/postgres-mcp) - PostgreSQL database integration for MCP
- [sqlite-mcp](https://github.com/example/sqlite-mcp) - SQLite database access via MCP

## File Systems

- [filesystem-mcp](https://github.com/example/fs-mcp) - Local filesystem operations
- [s3-mcp](https://github.com/example/s3-mcp) - AWS S3 file operations

## Search

- [elasticsearch-mcp](https://github.com/example/es-mcp) - Elasticsearch integration
`;

const mockAwesomeMcpReadme = `
# Awesome MCP Servers

A curated list of awesome MCP servers.

## Contents

- [Databases](#databases)
- [APIs](#apis)

## Databases

- [mysql-mcp](https://github.com/example/mysql-mcp) - MySQL database connector
- [mongodb-mcp](https://github.com/example/mongo-mcp) - MongoDB integration

## APIs

- [github-mcp](https://github.com/example/github-mcp) - GitHub API integration
- [slack-mcp](https://github.com/example/slack-mcp): Slack messaging integration
`;

const mockSmitheryResponse = {
  results: [
    {
      name: 'Notion Integration',
      description: 'Connect to Notion workspaces',
      slug: 'notion-mcp',
      url: 'https://smithery.ai/server/notion-mcp',
      score: 0.85,
    },
    {
      name: 'Linear Integration',
      description: 'Connect to Linear issue tracker',
      slug: 'linear-mcp',
      score: 0.75,
    },
  ],
};

const mockGlamaResponse = {
  servers: [
    {
      name: 'Jira MCP',
      description: 'Atlassian Jira integration',
      repository: 'https://github.com/example/jira-mcp',
      score: 0.9,
    },
  ],
};

const mockGithubResponse = {
  items: [
    {
      name: 'openai-mcp',
      full_name: 'example/openai-mcp',
      description: 'OpenAI API integration for MCP',
      html_url: 'https://github.com/example/openai-mcp',
      stargazers_count: 150,
    },
    {
      name: 'anthropic-mcp',
      full_name: 'example/anthropic-mcp',
      description: 'Anthropic Claude API integration',
      html_url: 'https://github.com/example/anthropic-mcp',
      stargazers_count: 200,
    },
    {
      name: 'low-stars-mcp',
      full_name: 'example/low-stars',
      description: 'Not enough stars',
      html_url: 'https://github.com/example/low-stars',
      stargazers_count: 5, // Below threshold
    },
  ],
};

// ============================================================================
// Parser Tests
// ============================================================================

describe('External Sources Parsers', () => {
  let service: ExternalQueryService;

  beforeEach(() => {
    service = new ExternalQueryService(1000);
  });

  describe('MCP Registry Parser', () => {
    beforeEach(() => {
      globalThis.fetch = createMockFetch({
        'modelcontextprotocol': { ok: true, data: mockMcpRegistryReadme },
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should parse MCP registry README format', async () => {
      const results = await service.query('database', {
        sources: ['mcp-registry'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.toLowerCase().includes('postgres'))).toBe(true);
    });

    it('should extract name, description, and URL', async () => {
      const results = await service.query('postgres', {
        sources: ['mcp-registry'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      const postgres = results.find(r => r.name.toLowerCase().includes('postgres'));
      expect(postgres).toBeDefined();
      expect(postgres?.url).toContain('github.com');
      expect(postgres?.description).toBeDefined();
    });

    it('should calculate relevance scores', async () => {
      const results = await service.query('database SQL', {
        sources: ['mcp-registry'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      // Results should be sorted by relevance
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }
    });
  });

  describe('Awesome MCP Parser', () => {
    beforeEach(() => {
      globalThis.fetch = createMockFetch({
        'punkpeye/awesome': { ok: true, data: mockAwesomeMcpReadme },
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should parse awesome-list format with different separators', async () => {
      const results = await service.query('mysql', {
        sources: ['awesome-mcp'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results.some(r => r.name.toLowerCase().includes('mysql'))).toBe(true);
    });

    it('should handle colon separator', async () => {
      const results = await service.query('slack messaging', {
        sources: ['awesome-mcp'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      const slack = results.find(r => r.name.toLowerCase().includes('slack'));
      expect(slack).toBeDefined();
      expect(slack?.description).toContain('Slack');
    });
  });

  describe('Smithery Parser', () => {
    beforeEach(() => {
      globalThis.fetch = createMockFetch({
        'smithery.ai': { ok: true, data: mockSmitheryResponse },
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should parse Smithery API response', async () => {
      const results = await service.query('notion', {
        sources: ['smithery'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toBe('smithery');
    });

    it('should generate install commands', async () => {
      const results = await service.query('notion', {
        sources: ['smithery'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      const notion = results.find(r => r.name.includes('Notion'));
      expect(notion?.installCommand).toContain('npx');
    });
  });

  describe('Glama Parser', () => {
    beforeEach(() => {
      globalThis.fetch = createMockFetch({
        'glama.ai': { ok: true, data: mockGlamaResponse },
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should parse Glama API response', async () => {
      const results = await service.query('jira', {
        sources: ['glama'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toBe('glama');
    });

    it('should use repository URL', async () => {
      const results = await service.query('jira', {
        sources: ['glama'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results[0].url).toContain('github.com');
    });
  });

  describe('GitHub Topics Parser', () => {
    beforeEach(() => {
      globalThis.fetch = createMockFetch({
        'api.github.com': { ok: true, data: mockGithubResponse },
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should parse GitHub search API response', async () => {
      const results = await service.query('openai', {
        sources: ['github-topics'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toBe('github-topics');
    });

    it('should filter out low-star repositories', async () => {
      const results = await service.query('mcp', {
        sources: ['github-topics'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      // low-stars-mcp has only 5 stars, should be filtered out
      expect(results.every(r => r.name !== 'low-stars-mcp')).toBe(true);
    });

    it('should include high-star repositories', async () => {
      const results = await service.query('anthropic', {
        sources: ['github-topics'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      expect(results.some(r => r.name.includes('anthropic'))).toBe(true);
    });
  });
});

// ============================================================================
// Service Behavior Tests
// ============================================================================

describe('ExternalQueryService', () => {
  let service: ExternalQueryService;

  beforeEach(() => {
    service = new ExternalQueryService(5000); // 5 second cache TTL
    globalThis.fetch = createMockFetch({
      'modelcontextprotocol': { ok: true, data: mockMcpRegistryReadme },
      'smithery.ai': { ok: true, data: mockSmitheryResponse },
      'glama.ai': { ok: true, data: mockGlamaResponse },
      'api.github.com': { ok: true, data: mockGithubResponse },
      'punkpeye/awesome': { ok: true, data: mockAwesomeMcpReadme },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Query Options', () => {
    it('should respect maxResults limit', async () => {
      const results = await service.query('database', {
        sources: ['mcp-registry', 'awesome-mcp'],
        maxResults: 2,
        minRelevance: 0.1,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minRelevance', async () => {
      const results = await service.query('xyz', {
        sources: ['mcp-registry'],
        maxResults: 10,
        minRelevance: 0.9, // Very high threshold
      });

      // Most results should be filtered out
      expect(results.every(r => r.relevanceScore >= 0.9)).toBe(true);
    });

    it('should query multiple sources in parallel', async () => {
      const results = await service.query('database', {
        sources: ['mcp-registry', 'smithery'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      const sources = new Set(results.map(r => r.source));
      expect(sources.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Caching', () => {
    it('should cache query results', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // First query
      await service.query('database', {
        sources: ['mcp-registry'],
        maxResults: 5,
        minRelevance: 0.1,
      });

      const callsAfterFirst = fetchSpy.mock.calls.length;

      // Second identical query
      await service.query('database', {
        sources: ['mcp-registry'],
        maxResults: 5,
        minRelevance: 0.1,
      });

      // Should use cache, no additional fetch calls
      expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
    });

    it('should clear cache', async () => {
      await service.query('database', {
        sources: ['mcp-registry'],
        maxResults: 5,
        minRelevance: 0.1,
      });

      service.clearCache();
      const stats = service.getCacheStats();

      expect(stats.entries).toBe(0);
    });

    it('should report cache stats', async () => {
      await service.query('test1', {
        sources: ['mcp-registry'],
        maxResults: 5,
        minRelevance: 0.1,
      });

      const stats = service.getCacheStats();

      expect(stats.entries).toBeGreaterThan(0);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate results by name', async () => {
      const results = await service.query('database', {
        sources: ALL_SOURCES,
        maxResults: 50,
        minRelevance: 0.1,
      });

      const names = results.map(r => r.name.toLowerCase());
      const uniqueNames = new Set(names);

      expect(names.length).toBe(uniqueNames.size);
    });
  });

  describe('Error Handling', () => {
    it('should handle failed source gracefully', async () => {
      globalThis.fetch = createMockFetch({
        'modelcontextprotocol': { ok: false, data: {} },
        'smithery.ai': { ok: true, data: mockSmitheryResponse },
      });

      const results = await service.query('test', {
        sources: ['mcp-registry', 'smithery'],
        maxResults: 10,
        minRelevance: 0.1,
      });

      // Should still return results from working source
      expect(results.some(r => r.source === 'smithery')).toBe(true);
    });

    it('should handle network timeout', async () => {
      globalThis.fetch = vi.fn(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 100);
      }));

      const results = await service.query('test', {
        sources: ['mcp-registry'],
        maxResults: 5,
        minRelevance: 0.1,
      });

      // Should return empty array, not throw
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle unknown source gracefully', async () => {
      const results = await service.query('test', {
        sources: ['unknown-source' as any],
        maxResults: 5,
        minRelevance: 0.1,
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit per source', async () => {
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          service.query(`query-${i}`, {
            sources: ['mcp-registry'],
            maxResults: 1,
            minRelevance: 0.1,
          })
        );
      }

      // Should complete without errors (rate limit is 10/min for mcp-registry)
      const results = await Promise.all(promises);
      expect(results.every(r => Array.isArray(r))).toBe(true);
    });
  });
});

// ============================================================================
// Relevance Calculation Tests
// ============================================================================

describe('Relevance Calculation', () => {
  let service: ExternalQueryService;

  beforeEach(() => {
    service = new ExternalQueryService(1000);
    globalThis.fetch = createMockFetch({
      'modelcontextprotocol': { ok: true, data: mockMcpRegistryReadme },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should score exact matches higher', async () => {
    const results = await service.query('postgres', {
      sources: ['mcp-registry'],
      maxResults: 10,
      minRelevance: 0,
    });

    const postgres = results.find(r => r.name.toLowerCase().includes('postgres'));
    const other = results.find(r => !r.name.toLowerCase().includes('postgres'));

    if (postgres && other) {
      expect(postgres.relevanceScore).toBeGreaterThan(other.relevanceScore);
    }
  });

  it('should handle multi-word queries', async () => {
    const results = await service.query('database postgres integration', {
      sources: ['mcp-registry'],
      maxResults: 10,
      minRelevance: 0,
    });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should be case-insensitive', async () => {
    const lowerResults = await service.query('postgres', {
      sources: ['mcp-registry'],
      maxResults: 10,
      minRelevance: 0.1,
    });

    service.clearCache();

    const upperResults = await service.query('POSTGRES', {
      sources: ['mcp-registry'],
      maxResults: 10,
      minRelevance: 0.1,
    });

    expect(lowerResults.length).toBe(upperResults.length);
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Source Constants', () => {
  it('should have recommended sources defined', () => {
    expect(RECOMMENDED_SOURCES).toContain('mcp-registry');
    expect(RECOMMENDED_SOURCES).toContain('smithery');
  });

  it('should have all sources defined', () => {
    expect(ALL_SOURCES).toContain('mcp-registry');
    expect(ALL_SOURCES).toContain('awesome-mcp');
    expect(ALL_SOURCES).toContain('smithery');
    expect(ALL_SOURCES).toContain('glama');
    expect(ALL_SOURCES).toContain('github-topics');
  });

  it('should have valid default query options', () => {
    expect(DEFAULT_QUERY_OPTIONS.sources).toBeDefined();
    expect(DEFAULT_QUERY_OPTIONS.maxResults).toBeGreaterThan(0);
    expect(DEFAULT_QUERY_OPTIONS.minRelevance).toBeGreaterThan(0);
    expect(DEFAULT_QUERY_OPTIONS.minRelevance).toBeLessThan(1);
  });
});

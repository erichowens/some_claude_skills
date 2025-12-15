/**
 * External Sources Module
 *
 * Provides optional integration with external skill/MCP databases:
 * - Official MCP Registry (modelcontextprotocol.io)
 * - Smithery.ai
 * - Glama.ai
 * - GitHub Topics
 * - awesome-mcp lists
 *
 * This is opt-in functionality that runs only when explicitly requested.
 */

import type {
  ExternalSource,
  ExternalSuggestion,
  ExternalQueryOptions,
} from './types.js';

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
  data: ExternalSuggestion[];
  timestamp: number;
}

// ============================================================================
// External Source Definitions
// ============================================================================

const SOURCE_CONFIGS: Record<
  ExternalSource,
  {
    name: string;
    baseUrl: string;
    searchEndpoint?: string;
    rateLimit: number; // requests per minute
    parser: (data: unknown, query: string) => ExternalSuggestion[];
  }
> = {
  'mcp-registry': {
    name: 'Official MCP Registry',
    baseUrl: 'https://raw.githubusercontent.com/modelcontextprotocol/servers/main',
    rateLimit: 10,
    parser: parseMcpRegistry,
  },
  'awesome-mcp': {
    name: 'Awesome MCP',
    baseUrl: 'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main',
    rateLimit: 10,
    parser: parseAwesomeMcp,
  },
  'smithery': {
    name: 'Smithery.ai',
    baseUrl: 'https://smithery.ai',
    searchEndpoint: '/api/search',
    rateLimit: 30,
    parser: parseSmithery,
  },
  'glama': {
    name: 'Glama.ai',
    baseUrl: 'https://glama.ai',
    searchEndpoint: '/api/mcp/search',
    rateLimit: 30,
    parser: parseGlama,
  },
  'github-topics': {
    name: 'GitHub Topics',
    baseUrl: 'https://api.github.com',
    searchEndpoint: '/search/repositories',
    rateLimit: 10,
    parser: parseGitHubTopics,
  },
};

// ============================================================================
// Parsers for Different Sources
// ============================================================================

function parseMcpRegistry(data: unknown, query: string): ExternalSuggestion[] {
  const suggestions: ExternalSuggestion[] = [];

  if (typeof data !== 'string') return suggestions;

  // Parse the README.md format from the MCP registry
  const lines = data.split('\n');
  let currentCategory = '';

  for (const line of lines) {
    // Category headers
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
      continue;
    }

    // MCP entries (markdown links with descriptions)
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)\s*[-–]\s*(.+)/);
    if (linkMatch) {
      const [, name, url, description] = linkMatch;
      const relevance = calculateRelevance(query, name, description);

      if (relevance > 0.3) {
        suggestions.push({
          source: 'mcp-registry',
          type: 'mcp',
          name,
          description: description.slice(0, 200),
          url,
          relevanceScore: relevance,
          installCommand: `npx -y ${name}`,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function parseAwesomeMcp(data: unknown, query: string): ExternalSuggestion[] {
  const suggestions: ExternalSuggestion[] = [];

  if (typeof data !== 'string') return suggestions;

  // Parse the awesome-list format
  const lines = data.split('\n');

  for (const line of lines) {
    // Look for list items with links
    const match = line.match(/^\s*[-*]\s*\[([^\]]+)\]\(([^)]+)\)\s*[-–:]?\s*(.*)$/);
    if (match) {
      const [, name, url, description] = match;
      const relevance = calculateRelevance(query, name, description);

      if (relevance > 0.3) {
        suggestions.push({
          source: 'awesome-mcp',
          type: 'mcp',
          name,
          description: description.slice(0, 200) || `MCP server: ${name}`,
          url,
          relevanceScore: relevance,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function parseSmithery(data: unknown, query: string): ExternalSuggestion[] {
  const suggestions: ExternalSuggestion[] = [];

  if (!data || typeof data !== 'object') return suggestions;

  const results = (data as { results?: unknown[] }).results || [];

  for (const item of results) {
    if (typeof item !== 'object' || !item) continue;

    const entry = item as {
      name?: string;
      description?: string;
      url?: string;
      slug?: string;
      score?: number;
    };

    suggestions.push({
      source: 'smithery',
      type: 'mcp',
      name: entry.name || 'Unknown',
      description: entry.description || '',
      url: entry.url || `https://smithery.ai/server/${entry.slug}`,
      relevanceScore: entry.score || calculateRelevance(query, entry.name || '', entry.description || ''),
      installCommand: `npx -y @smithery/${entry.slug}`,
    });
  }

  return suggestions;
}

function parseGlama(data: unknown, query: string): ExternalSuggestion[] {
  const suggestions: ExternalSuggestion[] = [];

  if (!data || typeof data !== 'object') return suggestions;

  const results = (data as { servers?: unknown[] }).servers || [];

  for (const item of results) {
    if (typeof item !== 'object' || !item) continue;

    const entry = item as {
      name?: string;
      description?: string;
      repository?: string;
      score?: number;
    };

    suggestions.push({
      source: 'glama',
      type: 'mcp',
      name: entry.name || 'Unknown',
      description: entry.description || '',
      url: entry.repository || `https://glama.ai/mcp/servers/${entry.name}`,
      relevanceScore: entry.score || calculateRelevance(query, entry.name || '', entry.description || ''),
    });
  }

  return suggestions;
}

function parseGitHubTopics(data: unknown, query: string): ExternalSuggestion[] {
  const suggestions: ExternalSuggestion[] = [];

  if (!data || typeof data !== 'object') return suggestions;

  const results = (data as { items?: unknown[] }).items || [];

  for (const item of results) {
    if (typeof item !== 'object' || !item) continue;

    const repo = item as {
      name?: string;
      full_name?: string;
      description?: string;
      html_url?: string;
      stargazers_count?: number;
    };

    // Only include repos with decent stars
    if ((repo.stargazers_count || 0) < 10) continue;

    suggestions.push({
      source: 'github-topics',
      type: 'mcp',
      name: repo.name || 'Unknown',
      description: repo.description || '',
      url: repo.html_url || '',
      relevanceScore: calculateRelevance(query, repo.name || '', repo.description || ''),
    });
  }

  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// ============================================================================
// Relevance Calculation
// ============================================================================

function calculateRelevance(query: string, name: string, description: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const descLower = description.toLowerCase();

  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);

  let score = 0;
  let matches = 0;

  for (const token of queryTokens) {
    // Name match is weighted higher
    if (nameLower.includes(token)) {
      score += 0.3;
      matches++;
    }
    // Description match
    if (descLower.includes(token)) {
      score += 0.15;
      matches++;
    }
  }

  // Bonus for exact phrase match
  if (descLower.includes(queryLower) || nameLower.includes(queryLower)) {
    score += 0.4;
  }

  // Normalize by query length
  const maxPossible = queryTokens.length * 0.45 + 0.4;
  return Math.min(score / Math.max(maxPossible, 1), 1);
}

// ============================================================================
// External Query Service
// ============================================================================

export class ExternalQueryService {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtlMs: number;
  private rateLimitTrackers: Map<ExternalSource, number[]> = new Map();

  constructor(cacheTtlMs: number = 300000) {
    this.cacheTtlMs = cacheTtlMs;
  }

  async query(
    query: string,
    options: ExternalQueryOptions
  ): Promise<ExternalSuggestion[]> {
    const { sources, maxResults, minRelevance } = options;
    const cacheKey = `${query}:${sources.join(',')}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data
        .filter(s => s.relevanceScore >= minRelevance)
        .slice(0, maxResults);
    }

    // Query each source in parallel
    const queryPromises = sources.map(source =>
      this.querySource(source, query).catch(err => {
        console.error(`Error querying ${source}:`, err);
        return [] as ExternalSuggestion[];
      })
    );

    const results = await Promise.all(queryPromises);
    const allSuggestions = results.flat();

    // Deduplicate by name
    const seen = new Set<string>();
    const deduped = allSuggestions.filter(s => {
      const key = s.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by relevance
    deduped.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Cache results
    this.cache.set(cacheKey, {
      data: deduped,
      timestamp: Date.now(),
    });

    return deduped
      .filter(s => s.relevanceScore >= minRelevance)
      .slice(0, maxResults);
  }

  private async querySource(
    source: ExternalSource,
    query: string
  ): Promise<ExternalSuggestion[]> {
    const config = SOURCE_CONFIGS[source];
    if (!config) {
      console.warn(`Unknown source: ${source}`);
      return [];
    }

    // Rate limiting check
    if (!this.checkRateLimit(source, config.rateLimit)) {
      console.warn(`Rate limit exceeded for ${source}`);
      return [];
    }

    try {
      let url: string;
      let data: unknown;

      switch (source) {
        case 'mcp-registry':
          url = `${config.baseUrl}/README.md`;
          data = await this.fetchText(url);
          break;

        case 'awesome-mcp':
          url = `${config.baseUrl}/README.md`;
          data = await this.fetchText(url);
          break;

        case 'smithery':
          url = `${config.baseUrl}${config.searchEndpoint}?q=${encodeURIComponent(query)}`;
          data = await this.fetchJson(url);
          break;

        case 'glama':
          url = `${config.baseUrl}${config.searchEndpoint}?query=${encodeURIComponent(query)}`;
          data = await this.fetchJson(url);
          break;

        case 'github-topics':
          url = `${config.baseUrl}${config.searchEndpoint}?q=${encodeURIComponent(query + ' topic:mcp')}&sort=stars&per_page=20`;
          data = await this.fetchJson(url, {
            'Accept': 'application/vnd.github.v3+json',
          });
          break;

        default:
          return [];
      }

      return config.parser(data, query);
    } catch (error) {
      console.error(`Failed to query ${source}:`, error);
      return [];
    }
  }

  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  }

  private async fetchJson(
    url: string,
    headers?: Record<string, string>
  ): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  private checkRateLimit(source: ExternalSource, limit: number): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    let timestamps = this.rateLimitTrackers.get(source) || [];

    // Remove old timestamps
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= limit) {
      return false;
    }

    timestamps.push(now);
    this.rateLimitTrackers.set(source, timestamps);
    return true;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { entries: number; size: number } {
    let size = 0;
    for (const [, entry] of this.cache) {
      size += JSON.stringify(entry).length;
    }
    return {
      entries: this.cache.size,
      size,
    };
  }
}

// ============================================================================
// Pre-built Source Lists
// ============================================================================

export const RECOMMENDED_SOURCES: ExternalSource[] = [
  'mcp-registry',
  'smithery',
];

export const ALL_SOURCES: ExternalSource[] = [
  'mcp-registry',
  'awesome-mcp',
  'smithery',
  'glama',
  'github-topics',
];

export const DEFAULT_QUERY_OPTIONS: ExternalQueryOptions = {
  sources: RECOMMENDED_SOURCES,
  maxResults: 5,
  minRelevance: 0.35,
};

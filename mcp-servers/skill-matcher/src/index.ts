#!/usr/bin/env node
/**
 * Skill Matcher MCP Server
 *
 * An MCP server that provides semantic skill matching using embeddings.
 * Features:
 * - Fast local embedding-based search
 * - Gap analysis for missing skills
 * - Optional external database integration
 * - Hybrid keyword + semantic matching
 *
 * Tools:
 * - match_skills: Find skills matching a user prompt
 * - analyze_gap: Analyze what's missing when no skill matches
 * - search_external: Query external MCP/skill databases (opt-in)
 * - get_skill: Get detailed info about a specific skill
 * - list_skills: List all available skills
 * - build_index: Rebuild the skill embedding index
 *
 * Part of someclaudeskills.com
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs/promises';

import type {
  SkillCatalogEntry,
  MatchResult,
  MatchResponse,
  GapAnalysis,
  ExternalSuggestion,
  SkillMatcherConfig,
  SkillIndex,
} from './types.js';
import { DEFAULT_CONFIG } from './types.js';
import {
  EmbeddingService,
  cosineSimilarity,
  keywordMatch,
  hybridScore,
  prepareTextForEmbedding,
} from './embeddings.js';
import { analyzeGap } from './gap-analysis.js';
import { loadAllSkills } from './skill-loader.js';
import {
  ExternalQueryService,
  DEFAULT_QUERY_OPTIONS,
  ALL_SOURCES,
} from './external-sources.js';

// ============================================================================
// Configuration
// ============================================================================

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const config: SkillMatcherConfig = {
  ...DEFAULT_CONFIG,
  skillsDir: process.env.SKILLS_DIR || DEFAULT_CONFIG.skillsDir,
  agentsDir: process.env.AGENTS_DIR || DEFAULT_CONFIG.agentsDir,
  indexPath: process.env.INDEX_PATH || DEFAULT_CONFIG.indexPath,
  matchThreshold: parseFloat(process.env.MATCH_THRESHOLD || '') || DEFAULT_CONFIG.matchThreshold,
  maxResults: parseInt(process.env.MAX_RESULTS || '') || DEFAULT_CONFIG.maxResults,
  enableExternalSearch: process.env.ENABLE_EXTERNAL === 'true',
};

// ============================================================================
// Services
// ============================================================================

let skillIndex: SkillCatalogEntry[] = [];
let skillEmbeddings: Map<string, number[]> = new Map();
let embeddingService: EmbeddingService;
let externalService: ExternalQueryService;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

async function initialize(): Promise<void> {
  if (isInitialized) return;

  console.error('Initializing Skill Matcher...');

  // Load skills
  skillIndex = await loadAllSkills(PROJECT_ROOT, {
    skillsDir: config.skillsDir,
    agentsDir: config.agentsDir,
  });

  console.error(`Loaded ${skillIndex.length} skills/agents`);

  // Initialize embedding service
  embeddingService = new EmbeddingService({
    provider: 'local-tfidf',
    dimensions: config.embeddingDimensions,
  });

  // Prepare documents for vocabulary building
  const documents = skillIndex.map(skill =>
    prepareTextForEmbedding(
      skill.name,
      skill.description,
      skill.activation.triggers,
      skill.activation.notFor,
      skill.tags
    )
  );

  await embeddingService.initialize(documents);

  // Generate embeddings for all skills
  for (const skill of skillIndex) {
    const text = prepareTextForEmbedding(
      skill.name,
      skill.description,
      skill.activation.triggers,
      skill.activation.notFor,
      skill.tags
    );
    const embedding = await embeddingService.embed(text);
    skillEmbeddings.set(skill.id, embedding.vector);
  }

  console.error(`Generated embeddings for ${skillEmbeddings.size} skills`);

  // Initialize external service
  externalService = new ExternalQueryService(config.cacheTtlMs);

  isInitialized = true;
  console.error('Skill Matcher initialized');
}

// ============================================================================
// Core Matching Logic
// ============================================================================

async function matchSkills(
  query: string,
  maxResults: number = config.maxResults,
  includeGapAnalysis: boolean = true
): Promise<MatchResponse> {
  const startTime = Date.now();

  await initialize();

  // Generate query embedding
  const queryEmbedding = await embeddingService.embed(query);

  // Score all skills
  const results: MatchResult[] = [];

  for (const skill of skillIndex) {
    const skillEmbedding = skillEmbeddings.get(skill.id);
    if (!skillEmbedding) continue;

    // Semantic similarity
    const semanticScore = cosineSimilarity(queryEmbedding.vector, skillEmbedding);

    // Keyword matching
    const kwScore = keywordMatch(query, skill.activation.triggers, skill.activation.notFor);

    // Combined score
    const finalScore = hybridScore(semanticScore, kwScore);

    if (finalScore >= config.matchThreshold) {
      results.push({
        skill,
        score: finalScore,
        matchType: kwScore > semanticScore ? 'keyword' : 'semantic',
        reasoning: generateReasoning(skill, query, semanticScore, kwScore),
      });
    }
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, maxResults);

  // Gap analysis if no good matches
  let gapAnalysis: GapAnalysis | undefined;
  if (includeGapAnalysis && (topResults.length === 0 || topResults[0].score < 0.6)) {
    gapAnalysis = analyzeGap(query, skillIndex, topResults);
  }

  return {
    query,
    matches: topResults,
    gapAnalysis,
    processingTime: Date.now() - startTime,
  };
}

function generateReasoning(
  skill: SkillCatalogEntry,
  query: string,
  semanticScore: number,
  keywordScore: number
): string {
  const parts: string[] = [];

  if (keywordScore > 0.5) {
    parts.push(`Strong keyword match with triggers`);
  }

  if (semanticScore > 0.6) {
    parts.push(`High semantic similarity (${(semanticScore * 100).toFixed(0)}%)`);
  }

  if (skill.tags && skill.tags.length > 0) {
    const relevantTags = skill.tags.slice(0, 3).map(t => t.id).join(', ');
    parts.push(`Related tags: ${relevantTags}`);
  }

  return parts.join('. ') || `Matches based on ${skill.category} category`;
}

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new Server(
  {
    name: 'skill-matcher',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================================================
// Tool Definitions
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'match_skills',
      description: `Find skills that match a user prompt using semantic search.
Returns ranked matches with confidence scores and reasoning.
When no good match exists, suggests what skill could fill the gap.`,
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The user prompt to match against skills',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5)',
          },
          includeGapAnalysis: {
            type: 'boolean',
            description: 'Include gap analysis when no strong match (default: true)',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'search_external',
      description: `Search external MCP and skill databases for relevant tools.
This is an OPT-IN feature that queries external sources.
Sources: Official MCP Registry, Smithery.ai, Glama.ai, awesome-mcp, GitHub.
Use when the user explicitly asks to find external tools or MCPs.`,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for external databases',
          },
          sources: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['mcp-registry', 'awesome-mcp', 'smithery', 'glama', 'github-topics'],
            },
            description: 'Which sources to search (default: mcp-registry, smithery)',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum results per source (default: 5)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'analyze_gap',
      description: `Analyze what skill is missing for a given prompt.
Returns detailed recommendations for creating a new skill:
- Suggested name and description
- Research topics and resources
- Success criteria and test cases
- Related existing skills`,
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt that has no matching skill',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'get_skill',
      description: 'Get detailed information about a specific skill by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The skill ID (e.g., "web-design-expert")',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'list_skills',
      description: 'List all available skills with optional filtering',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by category',
          },
          type: {
            type: 'string',
            enum: ['skill', 'agent', 'mcp', 'all'],
            description: 'Filter by type (default: all)',
          },
        },
      },
    },
    {
      name: 'build_index',
      description: 'Rebuild the skill embedding index (admin tool)',
      inputSchema: {
        type: 'object',
        properties: {
          force: {
            type: 'boolean',
            description: 'Force rebuild even if index exists',
          },
        },
      },
    },
  ],
}));

// ============================================================================
// Tool Handlers
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'match_skills': {
        const { prompt, maxResults, includeGapAnalysis } = args as {
          prompt: string;
          maxResults?: number;
          includeGapAnalysis?: boolean;
        };

        const response = await matchSkills(
          prompt,
          maxResults || config.maxResults,
          includeGapAnalysis !== false
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'search_external': {
        const { query, sources, maxResults } = args as {
          query: string;
          sources?: string[];
          maxResults?: number;
        };

        await initialize();

        const suggestions = await externalService.query(query, {
          sources: (sources as typeof ALL_SOURCES[number][]) || DEFAULT_QUERY_OPTIONS.sources,
          maxResults: maxResults || DEFAULT_QUERY_OPTIONS.maxResults,
          minRelevance: DEFAULT_QUERY_OPTIONS.minRelevance,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                results: suggestions,
                sources: sources || DEFAULT_QUERY_OPTIONS.sources,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_gap': {
        const { prompt } = args as { prompt: string };

        await initialize();

        // Get low-scoring matches for context
        const matchResponse = await matchSkills(prompt, 5, false);
        const gapAnalysis = analyzeGap(prompt, skillIndex, matchResponse.matches);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                prompt,
                analysis: gapAnalysis,
                nearestSkills: matchResponse.matches.slice(0, 3).map(m => ({
                  id: m.skill.id,
                  name: m.skill.name,
                  score: m.score,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'get_skill': {
        const { id } = args as { id: string };

        await initialize();

        const skill = skillIndex.find(s => s.id === id);
        if (!skill) {
          return {
            content: [{ type: 'text', text: `Skill '${id}' not found` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(skill, null, 2),
            },
          ],
        };
      }

      case 'list_skills': {
        const { category, type } = args as { category?: string; type?: string };

        await initialize();

        let filtered = skillIndex;

        if (category) {
          filtered = filtered.filter(s => s.category === category);
        }

        if (type && type !== 'all') {
          filtered = filtered.filter(s => s.type === type);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total: filtered.length,
                skills: filtered.map(s => ({
                  id: s.id,
                  name: s.name,
                  type: s.type,
                  category: s.category,
                  description: s.description.slice(0, 150) + (s.description.length > 150 ? '...' : ''),
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'build_index': {
        const { force } = args as { force?: boolean };

        // Reset and rebuild
        isInitialized = false;
        skillEmbeddings.clear();

        await initialize();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                skillCount: skillIndex.length,
                embeddingsGenerated: skillEmbeddings.size,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Resource Handlers
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'skill-matcher://catalog',
      name: 'Skill Catalog',
      description: 'Complete skill catalog in the standardized format',
      mimeType: 'application/json',
    },
    {
      uri: 'skill-matcher://schema',
      name: 'Catalog Schema',
      description: 'JSON Schema for skill catalog entries',
      mimeType: 'application/schema+json',
    },
    {
      uri: 'skill-matcher://stats',
      name: 'Index Statistics',
      description: 'Statistics about the skill index',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  await initialize();

  switch (uri) {
    case 'skill-matcher://catalog': {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(skillIndex, null, 2),
          },
        ],
      };
    }

    case 'skill-matcher://schema': {
      const schemaPath = path.join(PROJECT_ROOT, 'mcp-servers/skill-matcher/schemas/skill-catalog.schema.json');
      try {
        const schema = await fs.readFile(schemaPath, 'utf-8');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/schema+json',
              text: schema,
            },
          ],
        };
      } catch {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: 'Schema not found' }),
            },
          ],
        };
      }
    }

    case 'skill-matcher://stats': {
      const categories: Record<string, number> = {};
      const types: Record<string, number> = {};

      for (const skill of skillIndex) {
        categories[skill.category || 'uncategorized'] =
          (categories[skill.category || 'uncategorized'] || 0) + 1;
        types[skill.type] = (types[skill.type] || 0) + 1;
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              totalSkills: skillIndex.length,
              embeddingsGenerated: skillEmbeddings.size,
              categories,
              types,
              embeddingModel: embeddingService?.getModelInfo() || { model: 'not-initialized' },
              lastUpdated: new Date().toISOString(),
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Skill Matcher MCP Server running on stdio');
}

main().catch(console.error);

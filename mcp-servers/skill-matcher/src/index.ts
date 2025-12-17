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
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs/promises';

import {
  MatchSkillsInputSchema,
  SearchExternalInputSchema,
  AnalyzeGapInputSchema,
  GetSkillInputSchema,
  ListSkillsInputSchema,
  BuildIndexInputSchema,
} from './validation.js';

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
// Error Codes
// ============================================================================

const ERROR_CODES = {
  SKILL_NOT_FOUND: 'SKILL_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INDEX_NOT_INITIALIZED: 'INDEX_NOT_INITIALIZED',
  EXTERNAL_QUERY_FAILED: 'EXTERNAL_QUERY_FAILED',
  UNKNOWN_TOOL: 'UNKNOWN_TOOL',
  UNKNOWN_RESOURCE: 'UNKNOWN_RESOURCE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ============================================================================
// Server Metadata
// ============================================================================

const SERVER_INFO = {
  name: 'skill-matcher',
  version: '1.1.0',
  startTime: Date.now(),
};

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
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
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
    {
      name: 'health_check',
      description: `Check server health and operational status.
Returns server uptime, initialization status, skill count, and memory usage.
Use for monitoring and debugging.`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// ============================================================================
// Tool Handlers
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  try {
    let result: unknown;

    switch (name) {
      case 'match_skills': {
        const validated = MatchSkillsInputSchema.parse(args);

        const response = await matchSkills(
          validated.prompt,
          validated.maxResults ?? config.maxResults,
          validated.includeGapAnalysis ?? true
        );

        result = response;
        break;
      }

      case 'search_external': {
        const validated = SearchExternalInputSchema.parse(args);

        await initialize();

        const suggestions = await externalService.query(validated.query, {
          sources: (validated.sources as typeof ALL_SOURCES[number][]) || DEFAULT_QUERY_OPTIONS.sources,
          maxResults: validated.maxResults || DEFAULT_QUERY_OPTIONS.maxResults,
          minRelevance: DEFAULT_QUERY_OPTIONS.minRelevance,
        });

        result = {
          query: validated.query,
          results: suggestions,
          sources: validated.sources || DEFAULT_QUERY_OPTIONS.sources,
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'analyze_gap': {
        const validated = AnalyzeGapInputSchema.parse(args);

        await initialize();

        // Get low-scoring matches for context
        const matchResponse = await matchSkills(validated.prompt, 5, false);
        const gapAnalysis = analyzeGap(validated.prompt, skillIndex, matchResponse.matches);

        result = {
          prompt: validated.prompt,
          analysis: gapAnalysis,
          nearestSkills: matchResponse.matches.slice(0, 3).map(m => ({
            id: m.skill.id,
            name: m.skill.name,
            score: m.score,
          })),
        };
        break;
      }

      case 'get_skill': {
        const validated = GetSkillInputSchema.parse(args);

        await initialize();

        const skill = skillIndex.find(s => s.id === validated.id);
        if (!skill) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Skill '${validated.id}' not found`,
            { code: ERROR_CODES.SKILL_NOT_FOUND }
          );
        }

        result = skill;
        break;
      }

      case 'list_skills': {
        const validated = ListSkillsInputSchema.parse(args);

        await initialize();

        let filtered = skillIndex;

        if (validated.category) {
          filtered = filtered.filter(s => s.category === validated.category);
        }

        if (validated.type && validated.type !== 'all') {
          filtered = filtered.filter(s => s.type === validated.type);
        }

        result = {
          total: filtered.length,
          skills: filtered.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            category: s.category,
            description: s.description.slice(0, 150) + (s.description.length > 150 ? '...' : ''),
          })),
        };
        break;
      }

      case 'build_index': {
        const validated = BuildIndexInputSchema.parse(args);

        // Reset and rebuild
        isInitialized = false;
        skillEmbeddings.clear();

        await initialize();

        result = {
          success: true,
          skillCount: skillIndex.length,
          embeddingsGenerated: skillEmbeddings.size,
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'health_check': {
        const memoryUsage = process.memoryUsage();
        result = {
          status: 'healthy',
          version: SERVER_INFO.version,
          uptime: Math.floor((Date.now() - SERVER_INFO.startTime) / 1000),
          initialized: isInitialized,
          skillCount: skillIndex.length,
          embeddingCount: skillEmbeddings.size,
          memory: {
            heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
            rss: Math.floor(memoryUsage.rss / 1024 / 1024),
          },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`,
          { code: ERROR_CODES.UNKNOWN_TOOL }
        );
    }

    const duration = Date.now() - startTime;
    console.error(`Tool ${name} completed in ${duration}ms`);

    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Tool ${name} failed after ${duration}ms:`, error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        { code: ERROR_CODES.VALIDATION_ERROR, details: error.errors }
      );
    }

    // Re-throw MCP errors
    if (error instanceof McpError) {
      throw error;
    }

    // Wrap unknown errors
    throw new McpError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : 'Unknown error occurred',
      { code: ERROR_CODES.INTERNAL_ERROR }
    );
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
// Graceful Shutdown
// ============================================================================

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.error(`\nReceived ${signal}, shutting down gracefully...`);

  // Log final stats
  console.error(`Final stats: ${skillIndex.length} skills indexed, ${skillEmbeddings.size} embeddings cached`);
  console.error(`Uptime: ${Math.floor((Date.now() - SERVER_INFO.startTime) / 1000)}s`);

  // Allow pending operations to complete (give 5 seconds)
  setTimeout(() => {
    console.error('Shutdown complete');
    process.exit(0);
  }, 100);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  console.error(`Starting ${SERVER_INFO.name} v${SERVER_INFO.version}...`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${SERVER_INFO.name} running on stdio`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Skills Search MCP Server
 *
 * Provides semantic search over Claude Skills using pre-computed
 * embeddings and RAG-style retrieval.
 *
 * Tools:
 * - search_skills: Semantic search for relevant skills
 * - get_skill: Get full content of a specific skill
 * - list_skills: List all skills with optional filtering
 * - recommend_skill: Get skill recommendations for a task
 * - compare_skills: Compare multiple skills side by side
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { EmbeddingService } from './embeddings.js';
import { VectorStore } from './vector-store.js';
import type {
  SearchSkillsArgs,
  GetSkillArgs,
  ListSkillsArgs,
  RecommendSkillArgs,
  CompareSkillsArgs,
  SectionType,
  SearchResult,
  SkillMetadata,
} from './types.js';

// ============================================================================
// Server Initialization
// ============================================================================

const server = new Server(
  {
    name: 'skills-search',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Initialize services
const embeddingService = new EmbeddingService(process.env.OPENAI_API_KEY);
const vectorStore = new VectorStore();

// Track initialization state
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await vectorStore.load();
    initialized = true;
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_skills',
        description:
          'Search for relevant Claude skills using semantic search. ' +
          'Returns skills ranked by relevance to your query. ' +
          'Use this to find skills that match a capability, use case, or keyword.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query describing what you need',
            },
            top_k: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5)',
              default: 5,
            },
            min_similarity: {
              type: 'number',
              description: 'Minimum similarity threshold 0-1 (default: 0.3)',
              default: 0.3,
            },
            section_types: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Filter by section types: frontmatter, overview, when-to-use, ' +
                'quick-start, anti-patterns, references, code-example, ' +
                'mcp-integration, workflow, quality-checklist',
            },
            group_by_skill: {
              type: 'boolean',
              description: 'Return one result per skill (default: false)',
              default: false,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_skill',
        description:
          'Get the full content of a specific skill by its ID. ' +
          'Use this after searching to retrieve complete skill documentation.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            skill_id: {
              type: 'string',
              description: 'The skill ID (e.g., "web-design-expert", "career-biographer")',
            },
            sections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific sections to retrieve (optional, returns all if omitted)',
            },
          },
          required: ['skill_id'],
        },
      },
      {
        name: 'list_skills',
        description:
          'List all available skills with optional filtering by category, ' +
          'complexity level, or MCP integration status.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category (e.g., "career", "design", "development")',
            },
            complexity: {
              type: 'string',
              description: 'Filter by complexity: beginner, intermediate, advanced',
            },
            has_mcp: {
              type: 'boolean',
              description: 'Filter to skills with MCP integrations',
            },
          },
        },
      },
      {
        name: 'recommend_skill',
        description:
          'Get intelligent skill recommendations based on your task description. ' +
          'Provides reasoning about why each skill is relevant.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            task_description: {
              type: 'string',
              description: 'Detailed description of what you want to accomplish',
            },
            current_context: {
              type: 'string',
              description: 'Optional context about your current project or constraints',
            },
            exclude_skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skill IDs to exclude from recommendations',
            },
          },
          required: ['task_description'],
        },
      },
      {
        name: 'compare_skills',
        description:
          'Compare multiple skills side by side on specific aspects like ' +
          'capabilities, triggers, anti-patterns, and tool requirements.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            skill_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of skill IDs to compare (2-5 skills)',
              minItems: 2,
              maxItems: 5,
            },
            aspects: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Aspects to compare: capabilities, triggers, anti-patterns, tools',
            },
          },
          required: ['skill_ids'],
        },
      },
    ],
  };
});

// ============================================================================
// Tool Handlers
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    await ensureInitialized();

    switch (name) {
      case 'search_skills':
        return await handleSearchSkills(args as unknown as SearchSkillsArgs);

      case 'get_skill':
        return await handleGetSkill(args as unknown as GetSkillArgs);

      case 'list_skills':
        return await handleListSkills(args as unknown as ListSkillsArgs);

      case 'recommend_skill':
        return await handleRecommendSkill(args as unknown as RecommendSkillArgs);

      case 'compare_skills':
        return await handleCompareSkills(args as unknown as CompareSkillsArgs);

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ============================================================================
// Tool Implementations
// ============================================================================

async function handleSearchSkills(args: SearchSkillsArgs) {
  const {
    query,
    top_k = 5,
    min_similarity = 0.3,
    section_types,
    group_by_skill = false,
  } = args;

  // Generate embedding for query
  const queryEmbedding = await embeddingService.embed(query);

  // Search vector store
  const results = await vectorStore.search(queryEmbedding, {
    topK: top_k,
    minSimilarity: min_similarity,
    sectionTypes: section_types as SectionType[],
    groupBySkill: group_by_skill,
    includeContent: true,
  });

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No skills found matching "${query}" with similarity >= ${min_similarity}`,
        },
      ],
    };
  }

  const formatted = formatSearchResults(results);
  return {
    content: [{ type: 'text', text: formatted }],
  };
}

async function handleGetSkill(args: GetSkillArgs) {
  const { skill_id, sections } = args;

  const skill = vectorStore.getSkill(skill_id);
  if (!skill) {
    return {
      content: [{ type: 'text', text: `Skill not found: ${skill_id}` }],
      isError: true,
    };
  }

  const content = vectorStore.getSkillContent(skill_id, sections as SectionType[]);

  const header = [
    `# ${skill.name}`,
    '',
    skill.description || '',
    '',
    '---',
    '',
    `**Category:** ${skill.category || 'N/A'}`,
    `**Complexity:** ${skill.complexity || 'N/A'}`,
    `**Tags:** ${skill.tags?.join(', ') || 'N/A'}`,
    '',
  ];

  if (skill.mcpIntegrations && skill.mcpIntegrations.length > 0) {
    header.push(`**MCP Integrations:** ${skill.mcpIntegrations.join(', ')}`);
    header.push('');
  }

  header.push('---', '', content);

  return {
    content: [{ type: 'text', text: header.join('\n') }],
  };
}

async function handleListSkills(args: ListSkillsArgs) {
  const { category, complexity, has_mcp } = args;

  const skills = vectorStore.listSkills({
    category,
    complexity,
    hasMcp: has_mcp,
  });

  if (skills.length === 0) {
    return {
      content: [{ type: 'text', text: 'No skills found matching the filters.' }],
    };
  }

  const lines: string[] = [`# Available Skills (${skills.length} total)`, ''];

  // Group by category
  const byCategory = new Map<string, SkillMetadata[]>();
  for (const skill of skills) {
    const cat = skill.category || 'Uncategorized';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push(skill);
  }

  for (const [cat, catSkills] of byCategory) {
    lines.push(`## ${cat}`, '');
    for (const skill of catSkills) {
      const mcpBadge = skill.mcpIntegrations?.length ? ' 🔌' : '';
      const complexityBadge = skill.complexity ? ` [${skill.complexity}]` : '';
      lines.push(`- **${skill.name}**${mcpBadge}${complexityBadge}`);
      if (skill.description) {
        lines.push(`  ${skill.description}`);
      }
    }
    lines.push('');
  }

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
  };
}

async function handleRecommendSkill(args: RecommendSkillArgs) {
  const { task_description, current_context, exclude_skills } = args;

  // Build enhanced query with context
  let query = task_description;
  if (current_context) {
    query += `\n\nContext: ${current_context}`;
  }

  // Generate embedding and search
  const queryEmbedding = await embeddingService.embed(query);
  const results = await vectorStore.search(queryEmbedding, {
    topK: 10,
    minSimilarity: 0.25,
    groupBySkill: true,
    includeContent: true,
  });

  // Filter excluded skills
  let filtered = results;
  if (exclude_skills && exclude_skills.length > 0) {
    const excludeSet = new Set(exclude_skills);
    filtered = results.filter((r) => !excludeSet.has(r.skillId));
  }

  if (filtered.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No skill recommendations found for this task. Try rephrasing or being more specific.',
        },
      ],
    };
  }

  // Take top 3 recommendations
  const recommendations = filtered.slice(0, 3);

  const lines: string[] = ['# Skill Recommendations', '', `**Task:** ${task_description}`, ''];

  if (current_context) {
    lines.push(`**Context:** ${current_context}`, '');
  }

  lines.push('---', '');

  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    const relevancePercent = (rec.similarity * 100).toFixed(0);

    lines.push(`## ${i + 1}. ${rec.skillName}`);
    lines.push('');
    lines.push(`**Relevance:** ${relevancePercent}%`);
    lines.push('');

    if (rec.description) {
      lines.push(`**Description:** ${rec.description}`);
      lines.push('');
    }

    // Extract "when to use" content if available
    const whenToUse = vectorStore.getSkillContent(rec.skillId, ['when-to-use']);
    if (whenToUse) {
      lines.push('**When to Use:**');
      lines.push(whenToUse.substring(0, 500) + (whenToUse.length > 500 ? '...' : ''));
      lines.push('');
    }

    lines.push(`**ID for retrieval:** \`${rec.skillId}\``);
    lines.push('');
  }

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
  };
}

async function handleCompareSkills(args: CompareSkillsArgs) {
  const { skill_ids, aspects = ['capabilities', 'triggers', 'anti-patterns', 'tools'] } = args;

  // Validate skills exist
  const skills: SkillMetadata[] = [];
  const notFound: string[] = [];

  for (const id of skill_ids) {
    const skill = vectorStore.getSkill(id);
    if (skill) {
      skills.push(skill);
    } else {
      notFound.push(id);
    }
  }

  if (notFound.length > 0) {
    return {
      content: [{ type: 'text', text: `Skills not found: ${notFound.join(', ')}` }],
      isError: true,
    };
  }

  if (skills.length < 2) {
    return {
      content: [{ type: 'text', text: 'Need at least 2 valid skills to compare.' }],
      isError: true,
    };
  }

  const lines: string[] = ['# Skill Comparison', ''];

  // Overview table
  lines.push('## Overview', '');
  lines.push('| Skill | Category | Complexity | MCP |');
  lines.push('|-------|----------|------------|-----|');
  for (const skill of skills) {
    const hasMcp = skill.mcpIntegrations?.length ? '✅' : '—';
    lines.push(
      `| ${skill.name} | ${skill.category || 'N/A'} | ${skill.complexity || 'N/A'} | ${hasMcp} |`
    );
  }
  lines.push('');

  // Aspect sections
  const aspectMap: Record<string, SectionType[]> = {
    capabilities: ['overview', 'frontmatter'],
    triggers: ['when-to-use'],
    'anti-patterns': ['anti-patterns'],
    tools: ['mcp-integration'],
  };

  for (const aspect of aspects) {
    const sectionTypes = aspectMap[aspect];
    if (!sectionTypes) continue;

    lines.push(`## ${aspect.charAt(0).toUpperCase() + aspect.slice(1)}`, '');

    for (const skill of skills) {
      const skillMeta = vectorStore.getSkill(skill.name.toLowerCase().replace(/\s+/g, '-'));
      const id = skill_ids.find(
        (id) => vectorStore.getSkill(id)?.name === skill.name
      ) || '';
      const content = vectorStore.getSkillContent(id, sectionTypes);

      lines.push(`### ${skill.name}`);
      if (content) {
        const truncated = content.substring(0, 400) + (content.length > 400 ? '...' : '');
        lines.push(truncated);
      } else {
        lines.push('_No information available for this aspect._');
      }
      lines.push('');
    }
  }

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
  };
}

// ============================================================================
// Resource Handlers
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await ensureInitialized();

  const stats = vectorStore.getStats();
  const skills = vectorStore.listSkills();

  return {
    resources: [
      {
        uri: 'skills://stats',
        name: 'Skill Store Statistics',
        description: `Statistics about the skill embedding store (${stats?.totalSkills} skills, ${stats?.totalChunks} chunks)`,
        mimeType: 'application/json',
      },
      {
        uri: 'skills://categories',
        name: 'Skill Categories',
        description: 'List of all skill categories',
        mimeType: 'application/json',
      },
      ...skills.map((skill) => ({
        uri: `skills://skill/${skill.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: skill.name,
        description: skill.description || 'No description',
        mimeType: 'text/markdown',
      })),
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  await ensureInitialized();

  const { uri } = request.params;

  if (uri === 'skills://stats') {
    const stats = vectorStore.getStats();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  if (uri === 'skills://categories') {
    const categories = vectorStore.getCategories();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  }

  const skillMatch = uri.match(/^skills:\/\/skill\/(.+)$/);
  if (skillMatch) {
    const skillId = skillMatch[1];
    const skill = vectorStore.getSkill(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }
    const content = vectorStore.getSkillContent(skillId);
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// ============================================================================
// Helpers
// ============================================================================

function formatSearchResults(results: SearchResult[]): string {
  const lines: string[] = [`# Search Results (${results.length} matches)`, ''];

  for (const result of results) {
    const similarityPercent = (result.similarity * 100).toFixed(1);
    lines.push(`## ${result.rank}. ${result.skillName} (${similarityPercent}% match)`);
    lines.push('');

    if (result.description) {
      lines.push(`*${result.description}*`);
      lines.push('');
    }

    lines.push(`**Section:** ${result.sectionType}`);
    lines.push('');

    if (result.content) {
      // Truncate long content
      const preview =
        result.content.length > 300
          ? result.content.substring(0, 300) + '...'
          : result.content;
      lines.push('```');
      lines.push(preview);
      lines.push('```');
    }

    lines.push('');
    lines.push(`*Use \`get_skill\` with ID "${result.skillId}" for full content.*`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.error('[skills-search] Starting MCP server...');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[skills-search] Server connected and ready.');
}

main().catch((error) => {
  console.error('[skills-search] Fatal error:', error);
  process.exit(1);
});

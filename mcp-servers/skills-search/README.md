# Skills Search MCP Server

Semantic search over Claude Skills using RAG (Retrieval Augmented Generation) with pre-computed embeddings.

## Features

- **Semantic Search**: Find skills by natural language queries
- **Skill Retrieval**: Get full content of specific skills
- **Skill Listing**: List and filter skills by category, complexity, MCP integration
- **Recommendations**: Get intelligent skill recommendations for tasks
- **Comparisons**: Compare multiple skills side-by-side

## Installation

```bash
cd mcp-servers/skills-search
npm install
npm run build
```

## Configuration

Add to your Claude Code MCP settings (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "skills-search": {
      "command": "node",
      "args": ["/path/to/some_claude_skills/mcp-servers/skills-search/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

**Note**: The `OPENAI_API_KEY` is optional but recommended for accurate semantic search.
Without it, the server uses deterministic mock embeddings which won't match the pre-computed
embeddings as well.

## Tools

### `search_skills`

Search for relevant skills using semantic similarity.

```
Query: "help me design a website with modern aesthetics"
```

Parameters:
- `query` (required): Natural language search query
- `top_k`: Max results (default: 5)
- `min_similarity`: Threshold 0-1 (default: 0.3)
- `section_types`: Filter by sections (e.g., `["when-to-use", "overview"]`)
- `group_by_skill`: One result per skill (default: false)

### `get_skill`

Get full content of a specific skill.

```
Skill ID: "web-design-expert"
```

Parameters:
- `skill_id` (required): Skill identifier
- `sections`: Specific sections to retrieve

### `list_skills`

List all available skills with optional filtering.

Parameters:
- `category`: Filter by category
- `complexity`: Filter by complexity (beginner/intermediate/advanced)
- `has_mcp`: Filter to skills with MCP integrations

### `recommend_skill`

Get intelligent recommendations for a task.

Parameters:
- `task_description` (required): What you want to accomplish
- `current_context`: Additional context
- `exclude_skills`: Skills to exclude from results

### `compare_skills`

Compare multiple skills side by side.

Parameters:
- `skill_ids` (required): 2-5 skill IDs to compare
- `aspects`: Aspects to compare (capabilities, triggers, anti-patterns, tools)

## Resources

The server also exposes resources for direct access:

- `skills://stats` - Store statistics
- `skills://categories` - Available categories
- `skills://skill/{id}` - Individual skill content

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Test components
npx tsx test-server.ts
```

## Embedding Store

The server loads pre-computed embeddings from:
```
.claude/data/embeddings/skill-embeddings.json
```

To regenerate embeddings after adding new skills:
```bash
npx ts-node .claude/rag/scripts/generate-embeddings.ts
```

## Architecture

```
src/
├── index.ts        # MCP server entry point
├── types.ts        # TypeScript type definitions
├── embeddings.ts   # Embedding service (OpenAI + mock fallback)
└── vector-store.ts # Vector similarity search
```

The server uses:
- `text-embedding-3-small` model (1536 dimensions)
- Cosine similarity for vector search
- JSON-based embedding store for portability

#!/usr/bin/env node
/**
 * Ecosystem State MCP Server
 *
 * Exposes tools to query the Founding Council ecosystem:
 * - list_agents: Get all agents with their metadata
 * - list_skills: Get all skills with their metadata
 * - get_capability_graph: Generate relationship graph between agents/skills
 * - validate_structure: Run validation checks on ecosystem
 * - get_ecosystem_stats: Get statistics about the ecosystem
 *
 * Part of The Forge infrastructure.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { glob } from "glob";
import matter from "gray-matter";
import * as fs from "fs/promises";
import * as path from "path";

// Configuration - can be overridden via environment
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const AGENTS_DIR = path.join(PROJECT_ROOT, ".claude/agents");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".claude/skills");

// Types
interface AgentInfo {
  name: string;
  role?: string;
  description?: string;
  tools: string[];
  triggers?: string[];
  coordinatesWith?: string[];
  outputs?: string[];
  format: "flat" | "directory";
  path: string;
}

interface SkillInfo {
  name: string;
  description: string;
  category?: string;
  tools?: string[];
  path: string;
  hasReferences: boolean;
  hasExamples: boolean;
}

interface EcosystemStats {
  totalAgents: number;
  totalSkills: number;
  agentsByFormat: { flat: number; directory: number };
  skillCategories: Record<string, number>;
  toolUsage: Record<string, number>;
  lastScanned: string;
}

// Helper functions
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadAgents(): Promise<AgentInfo[]> {
  const agents: AgentInfo[] = [];

  // Load flat format agents (*.md excluding uppercase)
  const flatFiles = await glob("*.md", { cwd: AGENTS_DIR });
  for (const file of flatFiles) {
    // Skip uppercase files like FOUNDING_COUNCIL.md
    const baseName = path.basename(file, ".md");
    if (baseName === baseName.toUpperCase()) continue;

    // Skip if a directory format version exists (directory takes precedence)
    const dirVersion = path.join(AGENTS_DIR, baseName, "AGENT.md");
    if (await fileExists(dirVersion)) continue;

    const filePath = path.join(AGENTS_DIR, file);
    const content = await fs.readFile(filePath, "utf-8");
    const { data } = matter(content);

    agents.push({
      name: data.name || path.basename(file, ".md"),
      description: data.description,
      tools: parseTools(data.tools),
      format: "flat",
      path: filePath,
    });
  }

  // Load directory format agents (*/AGENT.md)
  const dirs = await fs.readdir(AGENTS_DIR, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const agentMdPath = path.join(AGENTS_DIR, dir.name, "AGENT.md");
    if (!(await fileExists(agentMdPath))) continue;

    const content = await fs.readFile(agentMdPath, "utf-8");
    const { data } = matter(content);

    agents.push({
      name: data.name || dir.name,
      role: data.role,
      tools: parseTools(data["allowed-tools"]),
      triggers: data.triggers,
      coordinatesWith: data.coordinates_with,
      outputs: data.outputs,
      format: "directory",
      path: agentMdPath,
    });
  }

  return agents;
}

async function loadSkills(): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];

  // Check each subdirectory for skill.md or SKILL.md
  const dirs = await fs.readdir(SKILLS_DIR, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const skillDir = path.join(SKILLS_DIR, dir.name);

    // Try both lowercase and uppercase
    let skillMdPath = path.join(skillDir, "skill.md");
    if (!(await fileExists(skillMdPath))) {
      skillMdPath = path.join(skillDir, "SKILL.md");
    }
    if (!(await fileExists(skillMdPath))) continue;

    const content = await fs.readFile(skillMdPath, "utf-8");
    const { data } = matter(content);

    // Check for references and examples
    const hasReferences = await fileExists(path.join(skillDir, "references"));
    const hasExamples = await fileExists(path.join(skillDir, "examples"));

    skills.push({
      name: data.name || dir.name,
      description: data.description || "",
      category: data.category,
      tools: parseTools(data.tools),
      path: skillMdPath,
      hasReferences,
      hasExamples,
    });
  }

  return skills;
}

function parseTools(tools: unknown): string[] {
  if (!tools) return [];
  if (Array.isArray(tools)) return tools;
  if (typeof tools === "string") {
    return tools.split(",").map((t) => t.trim());
  }
  return [];
}

async function getEcosystemStats(): Promise<EcosystemStats> {
  const agents = await loadAgents();
  const skills = await loadSkills();

  const agentsByFormat = {
    flat: agents.filter((a) => a.format === "flat").length,
    directory: agents.filter((a) => a.format === "directory").length,
  };

  const skillCategories: Record<string, number> = {};
  for (const skill of skills) {
    const cat = skill.category || "uncategorized";
    skillCategories[cat] = (skillCategories[cat] || 0) + 1;
  }

  const toolUsage: Record<string, number> = {};
  for (const agent of agents) {
    for (const tool of agent.tools) {
      toolUsage[tool] = (toolUsage[tool] || 0) + 1;
    }
  }
  for (const skill of skills) {
    for (const tool of skill.tools || []) {
      toolUsage[tool] = (toolUsage[tool] || 0) + 1;
    }
  }

  return {
    totalAgents: agents.length,
    totalSkills: skills.length,
    agentsByFormat,
    skillCategories,
    toolUsage,
    lastScanned: new Date().toISOString(),
  };
}

function generateCapabilityGraph(agents: AgentInfo[], skills: SkillInfo[]): object {
  const nodes: Array<{ id: string; type: string; label: string }> = [];
  const edges: Array<{ from: string; to: string; type: string }> = [];

  // Add agent nodes
  for (const agent of agents) {
    nodes.push({
      id: `agent:${agent.name}`,
      type: "agent",
      label: agent.name,
    });

    // Add coordination edges
    if (agent.coordinatesWith) {
      for (const other of agent.coordinatesWith) {
        edges.push({
          from: `agent:${agent.name}`,
          to: `agent:${other}`,
          type: "coordinates_with",
        });
      }
    }
  }

  // Add skill nodes
  for (const skill of skills) {
    nodes.push({
      id: `skill:${skill.name}`,
      type: "skill",
      label: skill.name,
    });
  }

  return { nodes, edges };
}

// Create server
const server = new Server(
  {
    name: "ecosystem-state",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_agents",
      description: "List all Founding Council agents with their metadata",
      inputSchema: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["flat", "directory", "all"],
            description: "Filter by agent format (default: all)",
          },
        },
      },
    },
    {
      name: "list_skills",
      description: "List all skills in the ecosystem",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Filter by skill category",
          },
        },
      },
    },
    {
      name: "get_capability_graph",
      description: "Generate a capability graph showing relationships between agents and skills",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_ecosystem_stats",
      description: "Get statistics about the ecosystem (agent counts, skill categories, tool usage)",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_agent",
      description: "Get detailed information about a specific agent",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the agent",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "get_skill",
      description: "Get detailed information about a specific skill",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the skill",
          },
        },
        required: ["name"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_agents": {
        const agents = await loadAgents();
        const format = (args as { format?: string })?.format || "all";

        const filtered = format === "all"
          ? agents
          : agents.filter((a) => a.format === format);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      }

      case "list_skills": {
        const skills = await loadSkills();
        const category = (args as { category?: string })?.category;

        const filtered = category
          ? skills.filter((s) => s.category === category)
          : skills;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      }

      case "get_capability_graph": {
        const agents = await loadAgents();
        const skills = await loadSkills();
        const graph = generateCapabilityGraph(agents, skills);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(graph, null, 2),
            },
          ],
        };
      }

      case "get_ecosystem_stats": {
        const stats = await getEcosystemStats();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "get_agent": {
        const agentName = (args as { name: string }).name;
        const agents = await loadAgents();
        const agent = agents.find((a) => a.name === agentName);

        if (!agent) {
          return {
            content: [{ type: "text", text: `Agent '${agentName}' not found` }],
            isError: true,
          };
        }

        // Load full content
        const content = await fs.readFile(agent.path, "utf-8");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ...agent, content }, null, 2),
            },
          ],
        };
      }

      case "get_skill": {
        const skillName = (args as { name: string }).name;
        const skills = await loadSkills();
        const skill = skills.find((s) => s.name === skillName);

        if (!skill) {
          return {
            content: [{ type: "text", text: `Skill '${skillName}' not found` }],
            isError: true,
          };
        }

        // Load full content
        const content = await fs.readFile(skill.path, "utf-8");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ...skill, content }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "ecosystem://stats",
      name: "Ecosystem Statistics",
      description: "Current ecosystem statistics (agents, skills, tool usage)",
      mimeType: "application/json",
    },
    {
      uri: "ecosystem://agents",
      name: "Agent List",
      description: "List of all Founding Council agents",
      mimeType: "application/json",
    },
    {
      uri: "ecosystem://skills",
      name: "Skills List",
      description: "List of all skills in the ecosystem",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "ecosystem://stats": {
      const stats = await getEcosystemStats();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    case "ecosystem://agents": {
      const agents = await loadAgents();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(agents, null, 2),
          },
        ],
      };
    }

    case "ecosystem://skills": {
      const skills = await loadSkills();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(skills, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ecosystem State MCP Server running on stdio");
}

main().catch(console.error);

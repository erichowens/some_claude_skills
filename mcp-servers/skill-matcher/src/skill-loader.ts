/**
 * Skill Loader Module
 *
 * Loads and parses skills from the local filesystem into the
 * standardized SkillCatalogEntry format.
 */

import { glob } from 'glob';
import matter from 'gray-matter';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  SkillCatalogEntry,
  SkillType,
  SkillCategory,
  SkillTag,
  SkillActivation,
  SkillSource,
} from './types.js';

// ============================================================================
// Category Mapping
// ============================================================================

const CATEGORY_MAP: Record<string, SkillCategory> = {
  'Orchestration & Meta': 'orchestration-meta',
  'Visual Design & UI': 'visual-design-ui',
  'Graphics, 3D & Simulation': 'graphics-3d-simulation',
  'Audio & Sound Design': 'audio-sound-design',
  'Computer Vision & Image AI': 'computer-vision-image-ai',
  'Autonomous Systems & Robotics': 'autonomous-systems-robotics',
  'Conversational AI & Bots': 'conversational-ai-bots',
  'Research & Strategy': 'research-strategy',
  'Coaching & Personal Development': 'coaching-personal-development',
  'DevOps & Site Reliability': 'devops-site-reliability',
  'Business & Monetization': 'business-monetization',
  'Documentation & Visualization': 'documentation-visualization',
};

// ============================================================================
// Helper Functions
// ============================================================================

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseTools(tools: unknown): string[] {
  if (!tools) return [];
  if (Array.isArray(tools)) return tools;
  if (typeof tools === 'string') {
    return tools.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

function parseTriggers(description: string): string[] {
  const triggers: string[] = [];

  // Extract trigger phrases from description
  // Look for patterns like "Activate on ...", "Use when ...", etc.
  const activateMatch = description.match(/activate\s+on\s+['""]?([^.'"]+)['""]?/i);
  if (activateMatch) {
    triggers.push(...activateMatch[1].split(/[,;]/).map(t => t.trim()));
  }

  const useWhenMatch = description.match(/use\s+(?:this\s+)?(?:skill\s+)?when\s+['""]?([^.'"]+)['""]?/i);
  if (useWhenMatch) {
    triggers.push(...useWhenMatch[1].split(/[,;]/).map(t => t.trim()));
  }

  // Extract quoted triggers
  const quotedMatches = description.matchAll(/['"""]([^'"""]+)['"""]/g);
  for (const match of quotedMatches) {
    if (match[1].length < 50) {
      triggers.push(match[1]);
    }
  }

  // If no explicit triggers, extract key phrases from the description
  if (triggers.length === 0) {
    const words = description.toLowerCase().split(/\s+/);
    const keyPhrases: string[] = [];

    // Extract noun phrases (simplified)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 3 && words[i + 1].length > 3) {
        keyPhrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    triggers.push(...keyPhrases.slice(0, 5));
  }

  return [...new Set(triggers)].slice(0, 10);
}

function parseNotFor(description: string): string[] {
  const notFor: string[] = [];

  // Look for "NOT for..." patterns
  const notForMatch = description.match(/not\s+for\s+([^.]+)/i);
  if (notForMatch) {
    notFor.push(...notForMatch[1].split(/[,;]/).map(t => t.trim()));
  }

  // Look for explicit negations
  const negativePatterns = [
    /don't\s+use\s+(?:this\s+)?(?:for\s+)?([^.]+)/i,
    /avoid\s+(?:using\s+)?(?:for\s+)?([^.]+)/i,
    /not\s+(?:intended|designed)\s+for\s+([^.]+)/i,
  ];

  for (const pattern of negativePatterns) {
    const match = description.match(pattern);
    if (match) {
      notFor.push(...match[1].split(/[,;]/).map(t => t.trim()));
    }
  }

  return [...new Set(notFor)].filter(s => s.length > 3);
}

function mapCategory(category: string | undefined): SkillCategory {
  if (!category) return 'research-strategy';
  return CATEGORY_MAP[category] || 'research-strategy';
}

function parseTags(tags: unknown): SkillTag[] {
  if (!tags) return [];

  const tagList: string[] = Array.isArray(tags) ? tags : [];
  const result: SkillTag[] = [];

  // Tag type inference based on known tag IDs
  const tagTypes: Record<string, SkillTag['type']> = {
    // Skill types
    research: 'skill-type',
    creation: 'skill-type',
    coaching: 'skill-type',
    automation: 'skill-type',
    orchestration: 'skill-type',
    validation: 'skill-type',
    analysis: 'skill-type',
    optimization: 'skill-type',
    // Domains
    design: 'domain',
    audio: 'domain',
    '3d': 'domain',
    cv: 'domain',
    ml: 'domain',
    psychology: 'domain',
    finance: 'domain',
    career: 'domain',
    accessibility: 'domain',
    devops: 'domain',
    robotics: 'domain',
    photography: 'domain',
    health: 'domain',
    entrepreneurship: 'domain',
    // Outputs
    code: 'output',
    document: 'output',
    visual: 'output',
    data: 'output',
    strategy: 'output',
    // Complexity
    'beginner-friendly': 'complexity',
    advanced: 'complexity',
    'production-ready': 'complexity',
    // Integrations
    mcp: 'integration',
    elevenlabs: 'integration',
    figma: 'integration',
    'stability-ai': 'integration',
  };

  for (const tag of tagList) {
    const type = tagTypes[tag] || 'domain';
    result.push({ id: tag, type });
  }

  return result;
}

// ============================================================================
// Skill Loader
// ============================================================================

export async function loadSkillsFromDirectory(
  skillsDir: string,
  projectRoot: string
): Promise<SkillCatalogEntry[]> {
  const skills: SkillCatalogEntry[] = [];
  const fullSkillsDir = path.join(projectRoot, skillsDir);

  if (!(await fileExists(fullSkillsDir))) {
    console.warn(`Skills directory not found: ${fullSkillsDir}`);
    return skills;
  }

  const dirs = await fs.readdir(fullSkillsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const skillDir = path.join(fullSkillsDir, dir.name);

    // Try both lowercase and uppercase
    let skillMdPath = path.join(skillDir, 'skill.md');
    if (!(await fileExists(skillMdPath))) {
      skillMdPath = path.join(skillDir, 'SKILL.md');
    }
    if (!(await fileExists(skillMdPath))) continue;

    try {
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const { data, content: body } = matter(content);

      // Check for references and examples
      const hasReferences = await fileExists(path.join(skillDir, 'references'));
      const hasExamples = await fileExists(path.join(skillDir, 'examples'));

      // Parse activation data
      const description = data.description || extractDescription(body);
      const triggers = parseTriggers(description);
      const notFor = parseNotFor(description);

      const activation: SkillActivation = {
        triggers,
        notFor,
        requiredContext: data['required-context']
          ? parseTools(data['required-context'])
          : undefined,
      };

      const entry: SkillCatalogEntry = {
        id: data.name || dir.name,
        type: 'skill' as SkillType,
        name: formatSkillName(data.name || dir.name),
        description,
        activation,
        category: mapCategory(data.category),
        tags: parseTags(data.tags),
        capabilities: {
          tools: parseTools(data['allowed-tools'] || data.tools),
          outputs: data.outputs ? parseTools(data.outputs) : undefined,
          integrations: data.integrations ? parseTools(data.integrations) : undefined,
        },
        metadata: {
          version: data.version,
          author: data.author,
          source: 'local' as SkillSource,
          sourceUrl: `file://${skillMdPath}`,
          license: data.license,
        },
      };

      skills.push(entry);
    } catch (error) {
      console.error(`Error loading skill from ${skillDir}:`, error);
    }
  }

  return skills;
}

export async function loadAgentsFromDirectory(
  agentsDir: string,
  projectRoot: string
): Promise<SkillCatalogEntry[]> {
  const agents: SkillCatalogEntry[] = [];
  const fullAgentsDir = path.join(projectRoot, agentsDir);

  if (!(await fileExists(fullAgentsDir))) {
    console.warn(`Agents directory not found: ${fullAgentsDir}`);
    return agents;
  }

  const dirs = await fs.readdir(fullAgentsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const agentMdPath = path.join(fullAgentsDir, dir.name, 'AGENT.md');
    if (!(await fileExists(agentMdPath))) continue;

    try {
      const content = await fs.readFile(agentMdPath, 'utf-8');
      const { data, content: body } = matter(content);

      const description = data.description || extractDescription(body);
      const triggers = data.triggers
        ? (Array.isArray(data.triggers) ? data.triggers : [data.triggers])
        : parseTriggers(description);
      const notFor = parseNotFor(description);

      const activation: SkillActivation = {
        triggers,
        notFor,
      };

      const entry: SkillCatalogEntry = {
        id: data.name || dir.name,
        type: 'agent' as SkillType,
        name: formatSkillName(data.name || dir.name),
        description,
        activation,
        category: mapCategory(data.role),
        capabilities: {
          tools: parseTools(data['allowed-tools']),
          outputs: data.outputs ? parseTools(data.outputs) : undefined,
        },
        metadata: {
          source: 'local' as SkillSource,
          sourceUrl: `file://${agentMdPath}`,
        },
      };

      agents.push(entry);
    } catch (error) {
      console.error(`Error loading agent from ${dir.name}:`, error);
    }
  }

  return agents;
}

function extractDescription(body: string): string {
  // Extract first paragraph or meaningful content
  const lines = body.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const firstParagraph = lines.slice(0, 3).join(' ').trim();
  return firstParagraph.slice(0, 500);
}

function formatSkillName(id: string): string {
  return id
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Website Data Loader
// ============================================================================

export async function loadSkillsFromWebsiteData(
  dataPath: string,
  projectRoot: string
): Promise<SkillCatalogEntry[]> {
  const skills: SkillCatalogEntry[] = [];
  const fullPath = path.join(projectRoot, dataPath);

  if (!(await fileExists(fullPath))) {
    console.warn(`Website data not found: ${fullPath}`);
    return skills;
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8');

    // Parse the TypeScript file to extract skill data
    // This is a simplified parser - in production you'd use proper TS parsing
    const skillRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*path:\s*['"]([^'"]+)['"],\s*description:\s*(?:getDesc\([^)]+\)|['"]([^'"]+)['"])/g;

    let match;
    while ((match = skillRegex.exec(content)) !== null) {
      const [, id, title, category, , description] = match;

      const entry: SkillCatalogEntry = {
        id,
        type: 'skill',
        name: title,
        description: description || `${title} skill`,
        activation: {
          triggers: parseTriggers(description || title),
          notFor: [],
        },
        category: mapCategory(category),
        metadata: {
          source: 'someclaudeskills',
        },
      };

      skills.push(entry);
    }
  } catch (error) {
    console.error('Error loading website data:', error);
  }

  return skills;
}

// ============================================================================
// Combined Loader
// ============================================================================

export async function loadAllSkills(
  projectRoot: string,
  config: {
    skillsDir: string;
    agentsDir: string;
    websiteDataPath?: string;
  }
): Promise<SkillCatalogEntry[]> {
  const [skills, agents] = await Promise.all([
    loadSkillsFromDirectory(config.skillsDir, projectRoot),
    loadAgentsFromDirectory(config.agentsDir, projectRoot),
  ]);

  // Deduplicate by ID, preferring skills over agents
  const idMap = new Map<string, SkillCatalogEntry>();

  for (const skill of skills) {
    idMap.set(skill.id, skill);
  }

  for (const agent of agents) {
    if (!idMap.has(agent.id)) {
      idMap.set(agent.id, agent);
    }
  }

  return Array.from(idMap.values());
}

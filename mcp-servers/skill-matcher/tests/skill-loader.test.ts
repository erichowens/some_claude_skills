/**
 * Skill Loader Tests
 *
 * Tests for loading and parsing skills from the filesystem.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Create mock functions
const mockAccess = vi.fn();
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();

// Mock fs/promises
vi.mock('fs/promises', () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

// Mock glob
const mockGlob = vi.fn();
vi.mock('glob', () => ({
  glob: (...args: unknown[]) => mockGlob(...args),
}));

// Mock gray-matter
vi.mock('gray-matter', () => ({
  default: (content: string) => {
    // Simple frontmatter parser for tests
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const yamlStr = frontmatterMatch[1];
      const body = frontmatterMatch[2];
      const data: Record<string, unknown> = {};

      // Parse simple YAML key-value pairs
      for (const line of yamlStr.split('\n')) {
        const match = line.match(/^(\w+[-\w]*):\s*(.+)$/);
        if (match) {
          let value: unknown = match[2].trim();
          // Handle arrays
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          }
          // Handle booleans
          if (value === 'true') value = true;
          if (value === 'false') value = false;
          data[match[1]] = value;
        }
      }
      return { data, content: body };
    }
    return { data: {}, content };
  },
}));

import {
  loadSkillsFromDirectory,
  loadAgentsFromDirectory,
  loadSkillsFromWebsiteData,
  loadAllSkills,
} from '../src/skill-loader.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const skillMdContent = `---
name: test-skill
description: A test skill for unit testing
category: Orchestration & Meta
tags: [development, testing]
allowed-tools: [Read, Write, Edit]
version: 1.0.0
author: Test Author
---

# Test Skill

This is a test skill. Activate on "test" or "unit test".

NOT for production use.
`;

const agentMdContent = `---
name: test-agent
description: A test agent for automation
role: Research & Strategy
allowed-tools: [Read, Grep]
triggers: [research, analyze]
---

# Test Agent

This agent helps with research tasks.
`;

// ============================================================================
// Helper Mock Setup
// ============================================================================

function setupDirectoryMock(dirs: { name: string; isDirectory: boolean }[]) {
  mockReaddir.mockResolvedValue(
    dirs.map(d => ({
      name: d.name,
      isDirectory: () => d.isDirectory,
    }))
  );
}

// ============================================================================
// loadSkillsFromDirectory Tests
// ============================================================================

describe('loadSkillsFromDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined); // File exists
  });

  it('should return empty array when directory does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills).toEqual([]);
  });

  it('should skip non-directory entries', async () => {
    setupDirectoryMock([
      { name: 'file.txt', isDirectory: false },
      { name: 'another-file.md', isDirectory: false },
    ]);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills).toEqual([]);
  });

  it('should skip directories without skill.md', async () => {
    setupDirectoryMock([{ name: 'empty-skill', isDirectory: true }]);
    mockAccess.mockImplementation((path: string) => {
      if (path.includes('skill.md') || path.includes('SKILL.md')) {
        return Promise.reject(new Error('ENOENT'));
      }
      return Promise.resolve(undefined);
    });

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills).toEqual([]);
  });

  it('should load skill from skill.md', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills.length).toBe(1);
    expect(skills[0].id).toBe('test-skill');
    expect(skills[0].type).toBe('skill');
  });

  it('should parse skill name from frontmatter', async () => {
    setupDirectoryMock([{ name: 'my-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].name).toBe('Test Skill'); // Formatted name
  });

  it('should parse description from frontmatter', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].description).toContain('test skill');
  });

  it('should map category correctly', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].category).toBe('orchestration-meta');
  });

  it('should parse activation triggers from description', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].activation.triggers).toBeDefined();
    expect(skills[0].activation.triggers.length).toBeGreaterThan(0);
  });

  it('should parse notFor from description', async () => {
    const contentWithNotFor = `---
name: test-skill
description: A test skill. NOT for production, staging, or debugging.
---
Content here.`;

    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(contentWithNotFor);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].activation.notFor).toBeDefined();
    expect(skills[0].activation.notFor).toContain('production');
  });

  it('should parse allowed-tools', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].capabilities?.tools).toEqual(['Read', 'Write', 'Edit']);
  });

  it('should parse tags', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].tags).toBeDefined();
    expect(skills[0].tags?.length).toBeGreaterThan(0);
  });

  it('should handle parsing errors gracefully', async () => {
    setupDirectoryMock([{ name: 'bad-skill', isDirectory: true }]);
    mockReadFile.mockRejectedValue(new Error('Read error'));

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills).toEqual([]);
  });

  it('should try SKILL.md if skill.md not found', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockAccess.mockImplementation((path: string) => {
      if (path.endsWith('skill.md')) {
        return Promise.reject(new Error('ENOENT'));
      }
      return Promise.resolve(undefined);
    });
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills.length).toBe(1);
  });

  it('should include metadata', async () => {
    setupDirectoryMock([{ name: 'test-skill', isDirectory: true }]);
    mockReadFile.mockResolvedValue(skillMdContent);

    const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

    expect(skills[0].metadata).toBeDefined();
    expect(skills[0].metadata?.source).toBe('local');
    expect(skills[0].metadata?.version).toBe('1.0.0');
    expect(skills[0].metadata?.author).toBe('Test Author');
  });
});

// ============================================================================
// loadAgentsFromDirectory Tests
// ============================================================================

describe('loadAgentsFromDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  it('should return empty array when directory does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    const agents = await loadAgentsFromDirectory('.claude/agents', '/project');

    expect(agents).toEqual([]);
  });

  it('should load agent from AGENT.md', async () => {
    setupDirectoryMock([{ name: 'test-agent', isDirectory: true }]);
    mockReadFile.mockResolvedValue(agentMdContent);

    const agents = await loadAgentsFromDirectory('.claude/agents', '/project');

    expect(agents.length).toBe(1);
    expect(agents[0].id).toBe('test-agent');
    expect(agents[0].type).toBe('agent');
  });

  it('should parse triggers from frontmatter when present', async () => {
    setupDirectoryMock([{ name: 'test-agent', isDirectory: true }]);
    mockReadFile.mockResolvedValue(agentMdContent);

    const agents = await loadAgentsFromDirectory('.claude/agents', '/project');

    expect(agents[0].activation.triggers).toContain('research');
    expect(agents[0].activation.triggers).toContain('analyze');
  });

  it('should skip directories without AGENT.md', async () => {
    setupDirectoryMock([{ name: 'incomplete-agent', isDirectory: true }]);
    mockAccess.mockImplementation((path: string) => {
      if (path.includes('AGENT.md')) {
        return Promise.reject(new Error('ENOENT'));
      }
      return Promise.resolve(undefined);
    });

    const agents = await loadAgentsFromDirectory('.claude/agents', '/project');

    expect(agents).toEqual([]);
  });

  it('should map role to category', async () => {
    setupDirectoryMock([{ name: 'test-agent', isDirectory: true }]);
    mockReadFile.mockResolvedValue(agentMdContent);

    const agents = await loadAgentsFromDirectory('.claude/agents', '/project');

    expect(agents[0].category).toBe('research-strategy');
  });
});

// ============================================================================
// loadSkillsFromWebsiteData Tests
// ============================================================================

describe('loadSkillsFromWebsiteData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  it('should return empty array when file does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    const skills = await loadSkillsFromWebsiteData('website/data.ts', '/project');

    expect(skills).toEqual([]);
  });

  it('should parse skill data from TypeScript file', async () => {
    const tsContent = `
      export const skills = [
        {
          id: 'web-expert',
          title: 'Web Expert',
          category: 'Visual Design & UI',
          path: '/skills/web-expert',
          description: 'Expert in web design',
        },
      ];
    `;
    mockReadFile.mockResolvedValue(tsContent);

    const skills = await loadSkillsFromWebsiteData('website/data.ts', '/project');

    expect(skills.length).toBe(1);
    expect(skills[0].id).toBe('web-expert');
    expect(skills[0].name).toBe('Web Expert');
  });

  it('should handle parsing errors', async () => {
    mockReadFile.mockRejectedValue(new Error('Read error'));

    const skills = await loadSkillsFromWebsiteData('website/data.ts', '/project');

    expect(skills).toEqual([]);
  });
});

// ============================================================================
// loadAllSkills Tests
// ============================================================================

describe('loadAllSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  it('should combine skills and agents', async () => {
    // Setup skills directory
    mockReaddir.mockImplementation((path: string) => {
      if (path.includes('skills')) {
        return Promise.resolve([{ name: 'skill1', isDirectory: () => true }]);
      }
      if (path.includes('agents')) {
        return Promise.resolve([{ name: 'agent1', isDirectory: () => true }]);
      }
      return Promise.resolve([]);
    });

    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('skill.md') || path.includes('SKILL.md')) {
        return Promise.resolve(skillMdContent);
      }
      if (path.includes('AGENT.md')) {
        return Promise.resolve(agentMdContent);
      }
      return Promise.reject(new Error('Not found'));
    });

    const all = await loadAllSkills('/project', {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    expect(all.length).toBe(2);
  });

  it('should deduplicate by ID', async () => {
    // Both skill and agent have same ID
    const duplicateSkill = skillMdContent.replace('name: test-skill', 'name: duplicate-id');
    const duplicateAgent = agentMdContent.replace('name: test-agent', 'name: duplicate-id');

    mockReaddir.mockImplementation((path: string) => {
      if (path.includes('skills')) {
        return Promise.resolve([{ name: 'skill1', isDirectory: () => true }]);
      }
      if (path.includes('agents')) {
        return Promise.resolve([{ name: 'agent1', isDirectory: () => true }]);
      }
      return Promise.resolve([]);
    });

    mockReadFile.mockImplementation((path: string) => {
      if (path.includes('skill.md') || path.includes('SKILL.md')) {
        return Promise.resolve(duplicateSkill);
      }
      if (path.includes('AGENT.md')) {
        return Promise.resolve(duplicateAgent);
      }
      return Promise.reject(new Error('Not found'));
    });

    const all = await loadAllSkills('/project', {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    // Should have only one entry (skill takes priority)
    const duplicates = all.filter(s => s.id === 'duplicate-id');
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].type).toBe('skill'); // Skills take priority
  });

  it('should handle empty directories', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    const all = await loadAllSkills('/project', {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    expect(all).toEqual([]);
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Helper Functions (via integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  describe('parseTriggers', () => {
    it('should extract "Activate on" triggers', async () => {
      const content = `---
name: test
description: Test skill. Activate on "create", "build", or "generate".
---
Content here.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].activation.triggers).toContain('create');
    });

    it('should extract "Use when" triggers', async () => {
      const content = `---
name: test
description: Use this skill when you need to analyze data.
---
Content here.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].activation.triggers.length).toBeGreaterThan(0);
    });

    it('should extract quoted triggers', async () => {
      const content = `---
name: test
description: Responds to "hello world" and "greeting" commands.
---
Content here.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].activation.triggers).toContain('hello world');
    });
  });

  describe('parseNotFor', () => {
    it('should extract "NOT for" patterns', async () => {
      const content = `---
name: test
description: Good for testing. NOT for production, staging, or live environments.
---
Content here.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].activation.notFor).toContain('production');
    });
  });

  describe('parseTools', () => {
    it('should parse comma-separated tools string', async () => {
      const content = `---
name: test
description: Test skill
allowed-tools: Read, Write, Edit
---
Content here.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].capabilities?.tools).toContain('Read');
      expect(skills[0].capabilities?.tools).toContain('Write');
      expect(skills[0].capabilities?.tools).toContain('Edit');
    });
  });

  describe('formatSkillName', () => {
    it('should format kebab-case to title case', async () => {
      const content = `---
name: my-awesome-skill
description: Test
---
Content.`;

      setupDirectoryMock([{ name: 'my-awesome-skill', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].name).toBe('My Awesome Skill');
    });

    it('should format snake_case to title case', async () => {
      const content = `---
name: my_other_skill
description: Test
---
Content.`;

      setupDirectoryMock([{ name: 'my_other_skill', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].name).toBe('My Other Skill');
    });
  });

  describe('mapCategory', () => {
    it('should map known categories', async () => {
      const categoryTests = [
        { input: 'Visual Design & UI', expected: 'visual-design-ui' },
        { input: 'DevOps & Site Reliability', expected: 'devops-site-reliability' },
        { input: 'Research & Strategy', expected: 'research-strategy' },
      ];

      for (const { input, expected } of categoryTests) {
        const content = `---
name: test
description: Test
category: ${input}
---
Content.`;

        setupDirectoryMock([{ name: 'test', isDirectory: true }]);
        mockReadFile.mockResolvedValue(content);

        const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

        expect(skills[0].category).toBe(expected);
      }
    });

    it('should default to research-strategy for unknown categories', async () => {
      const content = `---
name: test
description: Test
category: Unknown Category
---
Content.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      expect(skills[0].category).toBe('research-strategy');
    });
  });

  describe('parseTags', () => {
    it('should assign correct tag types', async () => {
      const content = `---
name: test
description: Test
tags: [design, code, mcp, advanced]
---
Content.`;

      setupDirectoryMock([{ name: 'test', isDirectory: true }]);
      mockReadFile.mockResolvedValue(content);

      const skills = await loadSkillsFromDirectory('.claude/skills', '/project');

      const designTag = skills[0].tags?.find(t => t.id === 'design');
      const codeTag = skills[0].tags?.find(t => t.id === 'code');
      const mcpTag = skills[0].tags?.find(t => t.id === 'mcp');
      const advancedTag = skills[0].tags?.find(t => t.id === 'advanced');

      expect(designTag?.type).toBe('domain');
      expect(codeTag?.type).toBe('output');
      expect(mcpTag?.type).toBe('integration');
      expect(advancedTag?.type).toBe('complexity');
    });
  });
});

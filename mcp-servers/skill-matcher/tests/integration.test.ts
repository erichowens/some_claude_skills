/**
 * Integration Tests
 *
 * Tests for the complete skill matching pipeline including
 * loading skills, generating embeddings, and matching.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { loadAllSkills } from '../src/skill-loader.js';
import {
  EmbeddingService,
  cosineSimilarity,
  prepareTextForEmbedding,
} from '../src/embeddings.js';
import { analyzeGap } from '../src/gap-analysis.js';
import type { SkillCatalogEntry, MatchResult } from '../src/types.js';

// Use relative path from test file location
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../..');

describe('Skill Loading', () => {
  it('should load skills from the repository', async () => {
    // Check if skills directory exists
    const skillsDir = path.join(PROJECT_ROOT, '.claude/skills');
    try {
      await fs.access(skillsDir);
    } catch {
      // Skip test if skills dir doesn't exist (CI environment)
      console.log('Skipping - skills directory not found');
      return;
    }

    const skills = await loadAllSkills(PROJECT_ROOT, {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0]).toHaveProperty('id');
    expect(skills[0]).toHaveProperty('name');
    expect(skills[0]).toHaveProperty('description');
    expect(skills[0]).toHaveProperty('activation');
  });

  it('should parse skill frontmatter correctly', async () => {
    const skillsDir = path.join(PROJECT_ROOT, '.claude/skills');
    try {
      await fs.access(skillsDir);
    } catch {
      console.log('Skipping - skills directory not found');
      return;
    }

    const skills = await loadAllSkills(PROJECT_ROOT, {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    // Find a known skill
    const webDesignSkill = skills.find(s => s.id === 'web-design-expert');
    if (webDesignSkill) {
      expect(webDesignSkill.activation.triggers).toBeDefined();
      expect(Array.isArray(webDesignSkill.activation.triggers)).toBe(true);
    }
  });

  it('should handle missing skill directories gracefully', async () => {
    const skills = await loadAllSkills('/nonexistent/path', {
      skillsDir: '.claude/skills',
      agentsDir: '.claude/agents',
    });

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });
});

describe('Full Matching Pipeline', () => {
  let skills: SkillCatalogEntry[];
  let embeddingService: EmbeddingService;
  let skillEmbeddings: Map<string, number[]>;

  beforeAll(async () => {
    // Create mock skills for testing
    skills = [
      {
        id: 'web-design-expert',
        type: 'skill',
        name: 'Web Design Expert',
        description: 'Expert in web design, brand identity, color theory, typography, UI/UX best practices, and accessibility standards.',
        category: 'Design & UX',
        activation: {
          triggers: ['web design', 'website', 'landing page', 'CSS', 'HTML', 'brand identity'],
          notFor: ['mobile apps', 'native apps'],
        },
        tags: [{ id: 'design', name: 'Design' }],
      },
      {
        id: 'mcp-creator',
        type: 'skill',
        name: 'MCP Creator',
        description: 'Expert MCP server developer creating safe, performant, production-ready Model Context Protocol servers.',
        category: 'Development & Infrastructure',
        activation: {
          triggers: ['MCP', 'Model Context Protocol', 'MCP server', 'stdio transport'],
          notFor: ['general API development'],
        },
        tags: [{ id: 'mcp', name: 'MCP' }],
      },
      {
        id: 'drone-cv-expert',
        type: 'skill',
        name: 'Drone CV Expert',
        description: 'Expert in drone systems, computer vision, SLAM, autonomous navigation, and aerial robotics.',
        category: 'AI & Machine Learning',
        activation: {
          triggers: ['drone', 'UAV', 'computer vision', 'SLAM', 'PID control'],
          notFor: ['general image processing'],
        },
        tags: [{ id: 'ai', name: 'AI' }],
      },
    ];

    // Initialize embedding service
    const documents = skills.map(s =>
      prepareTextForEmbedding(
        s.name,
        s.description,
        s.activation.triggers,
        s.activation.notFor,
        s.tags
      )
    );

    embeddingService = new EmbeddingService({
      provider: 'local-tfidf',
      dimensions: 512,
    });
    await embeddingService.initialize(documents);

    // Generate embeddings
    skillEmbeddings = new Map();
    for (const skill of skills) {
      const text = prepareTextForEmbedding(
        skill.name,
        skill.description,
        skill.activation.triggers,
        skill.activation.notFor,
        skill.tags
      );
      const emb = await embeddingService.embed(text);
      skillEmbeddings.set(skill.id, emb.vector);
    }
  });

  async function matchQuery(query: string, maxResults = 5): Promise<MatchResult[]> {
    const queryEmb = await embeddingService.embed(query);
    const results: MatchResult[] = [];

    for (const skill of skills) {
      const skillEmb = skillEmbeddings.get(skill.id);
      if (!skillEmb) continue;

      const score = cosineSimilarity(queryEmb.vector, skillEmb);
      results.push({
        skill,
        score,
        matchType: 'semantic',
        reasoning: `Semantic similarity: ${(score * 100).toFixed(0)}%`,
      });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  it('should match web design queries to web-design-expert', async () => {
    const results = await matchQuery('Help me design a beautiful landing page');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skill.id).toBe('web-design-expert');
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  it('should match MCP queries to mcp-creator', async () => {
    const results = await matchQuery('I want to build an MCP server');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skill.id).toBe('mcp-creator');
  });

  it('should match drone queries to drone-cv-expert', async () => {
    const results = await matchQuery('Help me with autonomous drone navigation and SLAM');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skill.id).toBe('drone-cv-expert');
  });

  it('should provide gap analysis for unmatched queries', async () => {
    const results = await matchQuery('Help me create a mobile game with Unity');

    // Even if there are results, they should be low-scoring
    const analysis = analyzeGap(
      'Help me create a mobile game with Unity',
      skills,
      results
    );

    expect(analysis.identified).toBe(true);
    expect(analysis.opportunity).toBeDefined();
  });

  it('should rank multiple relevant skills correctly', async () => {
    const results = await matchQuery('web design and computer vision for a drone dashboard');

    // Should return multiple skills since query spans domains
    expect(results.length).toBeGreaterThan(1);

    // Scores should be in descending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('should handle ambiguous queries', async () => {
    const results = await matchQuery('help me');

    // Should return results but with low confidence
    expect(results.length).toBeGreaterThan(0);
    // All scores should be relatively low for vague query
    expect(results[0].score).toBeLessThan(0.8);
  });

  it('should be fast for typical queries', async () => {
    const start = Date.now();
    await matchQuery('design a website with modern UI');
    const duration = Date.now() - start;

    // Should complete in under 100ms for small skill set
    expect(duration).toBeLessThan(100);
  });
});

describe('Performance Benchmarks', () => {
  it('should handle batch embedding generation efficiently', async () => {
    const service = new EmbeddingService({
      provider: 'local-tfidf',
      dimensions: 256,
    });

    const documents = Array.from({ length: 100 }, (_, i) =>
      `Document ${i} with various technical terms like web design, machine learning, and cloud computing.`
    );

    const start = Date.now();
    await service.initialize(documents);

    for (const doc of documents) {
      await service.embed(doc);
    }

    const duration = Date.now() - start;

    // Should process 100 documents in under 1 second
    expect(duration).toBeLessThan(1000);
  });
});

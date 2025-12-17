/**
 * Input Validation Tests
 *
 * Tests for Zod schemas ensuring proper input validation
 * and security boundaries.
 */

import { describe, it, expect } from 'vitest';
import {
  MatchSkillsInputSchema,
  SearchExternalInputSchema,
  AnalyzeGapInputSchema,
  GetSkillInputSchema,
  ListSkillsInputSchema,
  BuildIndexInputSchema,
} from '../src/validation.js';

describe('MatchSkillsInputSchema', () => {
  it('should accept valid input', () => {
    const result = MatchSkillsInputSchema.parse({
      prompt: 'Help me build a website',
    });
    expect(result.prompt).toBe('Help me build a website');
    expect(result.maxResults).toBe(5); // default
    expect(result.includeGapAnalysis).toBe(true); // default
  });

  it('should accept all optional fields', () => {
    const result = MatchSkillsInputSchema.parse({
      prompt: 'Test',
      maxResults: 10,
      includeGapAnalysis: false,
    });
    expect(result.maxResults).toBe(10);
    expect(result.includeGapAnalysis).toBe(false);
  });

  it('should reject empty prompt', () => {
    expect(() => MatchSkillsInputSchema.parse({ prompt: '' }))
      .toThrow('Prompt is required');
  });

  it('should reject prompt over 10000 chars', () => {
    const longPrompt = 'a'.repeat(10001);
    expect(() => MatchSkillsInputSchema.parse({ prompt: longPrompt }))
      .toThrow('Prompt too long');
  });

  it('should reject maxResults below 1', () => {
    expect(() => MatchSkillsInputSchema.parse({ prompt: 'test', maxResults: 0 }))
      .toThrow();
  });

  it('should reject maxResults above 50', () => {
    expect(() => MatchSkillsInputSchema.parse({ prompt: 'test', maxResults: 51 }))
      .toThrow();
  });

  it('should reject non-integer maxResults', () => {
    expect(() => MatchSkillsInputSchema.parse({ prompt: 'test', maxResults: 5.5 }))
      .toThrow();
  });
});

describe('SearchExternalInputSchema', () => {
  it('should accept valid input with query only', () => {
    const result = SearchExternalInputSchema.parse({
      query: 'MCP servers for GitHub',
    });
    expect(result.query).toBe('MCP servers for GitHub');
  });

  it('should accept valid sources', () => {
    const result = SearchExternalInputSchema.parse({
      query: 'test',
      sources: ['mcp-registry', 'smithery'],
    });
    expect(result.sources).toEqual(['mcp-registry', 'smithery']);
  });

  it('should reject empty query', () => {
    expect(() => SearchExternalInputSchema.parse({ query: '' }))
      .toThrow('Query is required');
  });

  it('should reject query over 500 chars', () => {
    const longQuery = 'a'.repeat(501);
    expect(() => SearchExternalInputSchema.parse({ query: longQuery }))
      .toThrow('Query too long');
  });

  it('should reject invalid sources', () => {
    expect(() => SearchExternalInputSchema.parse({
      query: 'test',
      sources: ['invalid-source'],
    })).toThrow();
  });

  it('should reject empty sources array', () => {
    expect(() => SearchExternalInputSchema.parse({
      query: 'test',
      sources: [],
    })).toThrow();
  });

  it('should reject more than 5 sources', () => {
    expect(() => SearchExternalInputSchema.parse({
      query: 'test',
      sources: ['mcp-registry', 'smithery', 'glama', 'awesome-mcp', 'github-topics', 'mcp-registry'],
    })).toThrow();
  });

  it('should reject maxResults above 20', () => {
    expect(() => SearchExternalInputSchema.parse({
      query: 'test',
      maxResults: 21,
    })).toThrow();
  });
});

describe('AnalyzeGapInputSchema', () => {
  it('should accept valid prompt', () => {
    const result = AnalyzeGapInputSchema.parse({
      prompt: 'I need help with something not covered',
    });
    expect(result.prompt).toBe('I need help with something not covered');
  });

  it('should reject empty prompt', () => {
    expect(() => AnalyzeGapInputSchema.parse({ prompt: '' }))
      .toThrow('Prompt is required');
  });

  it('should reject prompt over 10000 chars', () => {
    const longPrompt = 'a'.repeat(10001);
    expect(() => AnalyzeGapInputSchema.parse({ prompt: longPrompt }))
      .toThrow('Prompt too long');
  });
});

describe('GetSkillInputSchema', () => {
  it('should accept valid kebab-case ID', () => {
    const result = GetSkillInputSchema.parse({ id: 'web-design-expert' });
    expect(result.id).toBe('web-design-expert');
  });

  it('should accept simple lowercase ID', () => {
    const result = GetSkillInputSchema.parse({ id: 'orchestrator' });
    expect(result.id).toBe('orchestrator');
  });

  it('should accept ID with numbers', () => {
    const result = GetSkillInputSchema.parse({ id: 'skill-v2-beta' });
    expect(result.id).toBe('skill-v2-beta');
  });

  it('should reject empty ID', () => {
    expect(() => GetSkillInputSchema.parse({ id: '' })).toThrow();
  });

  it('should reject ID with uppercase', () => {
    expect(() => GetSkillInputSchema.parse({ id: 'WebDesign' }))
      .toThrow('Invalid skill ID format');
  });

  it('should reject ID with spaces', () => {
    expect(() => GetSkillInputSchema.parse({ id: 'web design' }))
      .toThrow('Invalid skill ID format');
  });

  it('should reject ID with underscores', () => {
    expect(() => GetSkillInputSchema.parse({ id: 'web_design' }))
      .toThrow('Invalid skill ID format');
  });

  it('should reject ID over 100 chars', () => {
    const longId = 'a'.repeat(101);
    expect(() => GetSkillInputSchema.parse({ id: longId })).toThrow();
  });

  it('should reject ID with special characters', () => {
    expect(() => GetSkillInputSchema.parse({ id: 'skill@test' }))
      .toThrow('Invalid skill ID format');
  });

  // Security: prevent path traversal
  it('should reject ID with path traversal attempts', () => {
    expect(() => GetSkillInputSchema.parse({ id: '../etc/passwd' }))
      .toThrow('Invalid skill ID format');
    expect(() => GetSkillInputSchema.parse({ id: '..%2F..%2Fetc' }))
      .toThrow('Invalid skill ID format');
  });
});

describe('ListSkillsInputSchema', () => {
  it('should accept empty object', () => {
    const result = ListSkillsInputSchema.parse({});
    expect(result.type).toBe('all'); // default
  });

  it('should accept valid type filter', () => {
    const result = ListSkillsInputSchema.parse({ type: 'skill' });
    expect(result.type).toBe('skill');
  });

  it('should accept category filter', () => {
    const result = ListSkillsInputSchema.parse({ category: 'design' });
    expect(result.category).toBe('design');
  });

  it('should reject invalid type', () => {
    expect(() => ListSkillsInputSchema.parse({ type: 'invalid' }))
      .toThrow();
  });

  it('should reject category over 100 chars', () => {
    const longCategory = 'a'.repeat(101);
    expect(() => ListSkillsInputSchema.parse({ category: longCategory }))
      .toThrow();
  });
});

describe('BuildIndexInputSchema', () => {
  it('should accept empty object', () => {
    const result = BuildIndexInputSchema.parse({});
    expect(result.force).toBe(false); // default
  });

  it('should accept force flag', () => {
    const result = BuildIndexInputSchema.parse({ force: true });
    expect(result.force).toBe(true);
  });

  it('should reject non-boolean force', () => {
    expect(() => BuildIndexInputSchema.parse({ force: 'true' }))
      .toThrow();
  });
});

describe('Security: Injection Prevention', () => {
  it('should allow prompts with SQL-like content (they are just text)', () => {
    // These should be allowed - they're just search queries
    const result = MatchSkillsInputSchema.parse({
      prompt: "SELECT * FROM users; DROP TABLE skills;",
    });
    expect(result.prompt).toContain('SELECT');
  });

  it('should allow prompts with shell-like content', () => {
    const result = MatchSkillsInputSchema.parse({
      prompt: "rm -rf / && echo 'hello'",
    });
    expect(result.prompt).toContain('rm -rf');
  });

  it('should handle unicode in prompts', () => {
    const result = MatchSkillsInputSchema.parse({
      prompt: '帮我设计网站 🎨',
    });
    expect(result.prompt).toContain('帮');
  });

  it('should handle null bytes in prompts (removed)', () => {
    const result = MatchSkillsInputSchema.parse({
      prompt: 'test\x00injection',
    });
    expect(result.prompt).toBe('test\x00injection');
  });
});

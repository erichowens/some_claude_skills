/**
 * Plugin System Tests
 *
 * Tests for the plugin registry, external sources, preprocessors,
 * enrichers, and event hooks.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  PluginRegistry,
  ExternalSourcePlugin,
  SkillPreprocessor,
  MatchResultEnricher,
  SkillMatcherEvent,
  NormalizationPreprocessor,
  UsageHintEnricher,
  getPluginRegistry,
  resetPluginRegistry,
} from '../src/plugins.js';
import type { SkillCatalogEntry, MatchResult, ExternalSuggestion } from '../src/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockSkill: SkillCatalogEntry = {
  id: 'test-skill',
  type: 'skill',
  name: 'Test Skill',
  description: 'A test skill for unit testing',
  category: 'research-strategy',
  activation: {
    triggers: ['test', 'unit test'],
    notFor: ['production'],
  },
  tags: [{ id: 'testing', type: 'domain' }],
};

const mockMatchResult: MatchResult = {
  skill: mockSkill,
  score: 0.85,
  matchType: 'semantic',
  reasoning: 'High semantic similarity',
};

const mockExternalSuggestion: ExternalSuggestion = {
  source: 'test-source',
  type: 'mcp',
  name: 'Test MCP',
  description: 'A test MCP server',
  url: 'https://github.com/test/mcp',
  relevanceScore: 0.9,
};

// ============================================================================
// PluginRegistry Tests
// ============================================================================

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  // ==========================================================================
  // External Source Tests
  // ==========================================================================

  describe('External Sources', () => {
    const mockSource: ExternalSourcePlugin = {
      id: 'test-source',
      name: 'Test Source',
      description: 'A test external source',
      rateLimit: 60,
      query: vi.fn().mockResolvedValue([mockExternalSuggestion]),
    };

    it('should register an external source', () => {
      registry.registerExternalSource(mockSource);

      const source = registry.getExternalSource('test-source');
      expect(source).toBeDefined();
      expect(source?.name).toBe('Test Source');
    });

    it('should replace existing source with same ID', () => {
      const source1 = { ...mockSource, name: 'Source 1' };
      const source2 = { ...mockSource, name: 'Source 2' };

      registry.registerExternalSource(source1);
      registry.registerExternalSource(source2);

      const source = registry.getExternalSource('test-source');
      expect(source?.name).toBe('Source 2');
    });

    it('should unregister an external source', () => {
      registry.registerExternalSource(mockSource);
      const result = registry.unregisterExternalSource('test-source');

      expect(result).toBe(true);
      expect(registry.getExternalSource('test-source')).toBeUndefined();
    });

    it('should return false when unregistering non-existent source', () => {
      const result = registry.unregisterExternalSource('nonexistent');
      expect(result).toBe(false);
    });

    it('should return undefined for unknown source', () => {
      const source = registry.getExternalSource('unknown');
      expect(source).toBeUndefined();
    });

    it('should get all external sources', () => {
      const source1 = { ...mockSource, id: 'source1', name: 'Source 1' };
      const source2 = { ...mockSource, id: 'source2', name: 'Source 2' };

      registry.registerExternalSource(source1);
      registry.registerExternalSource(source2);

      const sources = registry.getExternalSources();
      expect(sources.length).toBe(2);
    });

    it('should query external source', async () => {
      registry.registerExternalSource(mockSource);

      const results = await registry.queryExternalSource('test-source', 'test query');

      expect(mockSource.query).toHaveBeenCalledWith('test query', undefined);
      expect(results).toEqual([mockExternalSuggestion]);
    });

    it('should pass options to external source query', async () => {
      registry.registerExternalSource(mockSource);
      const options = { maxResults: 5 };

      await registry.queryExternalSource('test-source', 'test query', options);

      expect(mockSource.query).toHaveBeenCalledWith('test query', options);
    });

    it('should return empty array for unknown source', async () => {
      const results = await registry.queryExternalSource('unknown', 'query');
      expect(results).toEqual([]);
    });

    it('should emit events on query', async () => {
      registry.registerExternalSource(mockSource);
      const handler = vi.fn();
      registry.on('external:queried', handler);

      await registry.queryExternalSource('test-source', 'test query');

      expect(handler).toHaveBeenCalledWith({
        sourceId: 'test-source',
        query: 'test query',
        resultCount: 1,
      });
    });

    it('should emit error event on query failure', async () => {
      const errorSource: ExternalSourcePlugin = {
        ...mockSource,
        query: vi.fn().mockRejectedValue(new Error('Query failed')),
      };
      registry.registerExternalSource(errorSource);
      const handler = vi.fn();
      registry.on('error', handler);

      await expect(registry.queryExternalSource('test-source', 'query')).rejects.toThrow();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'external_query',
          sourceId: 'test-source',
        })
      );
    });

    it('should support health check function', async () => {
      const healthySource: ExternalSourcePlugin = {
        ...mockSource,
        healthCheck: vi.fn().mockResolvedValue(true),
      };

      registry.registerExternalSource(healthySource);
      const source = registry.getExternalSource('test-source');

      expect(source?.healthCheck).toBeDefined();
      await expect(source?.healthCheck?.()).resolves.toBe(true);
    });
  });

  // ==========================================================================
  // Preprocessor Tests
  // ==========================================================================

  describe('Preprocessors', () => {
    const mockPreprocessor: SkillPreprocessor = {
      id: 'test-preprocessor',
      priority: 10,
      process: vi.fn((skill) => ({
        ...skill,
        description: skill.description + ' [processed]',
      })),
    };

    it('should register a preprocessor', () => {
      registry.registerPreprocessor(mockPreprocessor);

      const stats = registry.getStats();
      expect(stats.preprocessors).toBe(1);
    });

    it('should apply preprocessors to skill', async () => {
      registry.registerPreprocessor(mockPreprocessor);

      const processed = await registry.applyPreprocessors(mockSkill);

      expect(processed.description).toContain('[processed]');
    });

    it('should apply preprocessors in priority order', async () => {
      const results: number[] = [];

      const lowPriority: SkillPreprocessor = {
        id: 'low',
        priority: 100,
        process: (skill) => {
          results.push(100);
          return skill;
        },
      };

      const highPriority: SkillPreprocessor = {
        id: 'high',
        priority: 1,
        process: (skill) => {
          results.push(1);
          return skill;
        },
      };

      const medPriority: SkillPreprocessor = {
        id: 'med',
        priority: 50,
        process: (skill) => {
          results.push(50);
          return skill;
        },
      };

      // Register in random order
      registry.registerPreprocessor(lowPriority);
      registry.registerPreprocessor(highPriority);
      registry.registerPreprocessor(medPriority);

      await registry.applyPreprocessors(mockSkill);

      expect(results).toEqual([1, 50, 100]); // Sorted by priority
    });

    it('should handle async preprocessors', async () => {
      const asyncPreprocessor: SkillPreprocessor = {
        id: 'async',
        priority: 1,
        process: async (skill) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { ...skill, name: 'Async Processed' };
        },
      };

      registry.registerPreprocessor(asyncPreprocessor);

      const processed = await registry.applyPreprocessors(mockSkill);

      expect(processed.name).toBe('Async Processed');
    });

    it('should chain preprocessors', async () => {
      const first: SkillPreprocessor = {
        id: 'first',
        priority: 1,
        process: (skill) => ({ ...skill, name: skill.name + '1' }),
      };

      const second: SkillPreprocessor = {
        id: 'second',
        priority: 2,
        process: (skill) => ({ ...skill, name: skill.name + '2' }),
      };

      registry.registerPreprocessor(first);
      registry.registerPreprocessor(second);

      const processed = await registry.applyPreprocessors(mockSkill);

      expect(processed.name).toBe('Test Skill12');
    });
  });

  // ==========================================================================
  // Enricher Tests
  // ==========================================================================

  describe('Enrichers', () => {
    const mockEnricher: MatchResultEnricher = {
      id: 'test-enricher',
      priority: 10,
      enrich: vi.fn((results) =>
        results.map(r => ({
          ...r,
          reasoning: r.reasoning + ' [enriched]',
        }))
      ),
    };

    it('should register an enricher', () => {
      registry.registerEnricher(mockEnricher);

      const stats = registry.getStats();
      expect(stats.enrichers).toBe(1);
    });

    it('should apply enrichers to results', async () => {
      registry.registerEnricher(mockEnricher);

      const enriched = await registry.applyEnrichers([mockMatchResult], 'test query');

      expect(enriched[0].reasoning).toContain('[enriched]');
    });

    it('should apply enrichers in priority order', async () => {
      const results: number[] = [];

      const lowPriority: MatchResultEnricher = {
        id: 'low',
        priority: 100,
        enrich: (res) => {
          results.push(100);
          return res;
        },
      };

      const highPriority: MatchResultEnricher = {
        id: 'high',
        priority: 1,
        enrich: (res) => {
          results.push(1);
          return res;
        },
      };

      registry.registerEnricher(lowPriority);
      registry.registerEnricher(highPriority);

      await registry.applyEnrichers([mockMatchResult], 'query');

      expect(results).toEqual([1, 100]);
    });

    it('should pass query to enrichers', async () => {
      const enricher: MatchResultEnricher = {
        id: 'query-aware',
        priority: 1,
        enrich: vi.fn((results, query) =>
          results.map(r => ({
            ...r,
            reasoning: `Query: ${query}`,
          }))
        ),
      };

      registry.registerEnricher(enricher);

      const enriched = await registry.applyEnrichers([mockMatchResult], 'my query');

      expect(enricher.enrich).toHaveBeenCalledWith([mockMatchResult], 'my query');
      expect(enriched[0].reasoning).toContain('my query');
    });

    it('should handle async enrichers', async () => {
      const asyncEnricher: MatchResultEnricher = {
        id: 'async',
        priority: 1,
        enrich: async (results) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return results.map(r => ({ ...r, score: 1.0 }));
        },
      };

      registry.registerEnricher(asyncEnricher);

      const enriched = await registry.applyEnrichers([mockMatchResult], 'query');

      expect(enriched[0].score).toBe(1.0);
    });
  });

  // ==========================================================================
  // Event Hooks Tests
  // ==========================================================================

  describe('Event Hooks', () => {
    it('should register event handler', () => {
      const handler = vi.fn();
      registry.on('match:complete', handler);

      const stats = registry.getStats();
      expect(stats.eventHooks).toBe(1);
    });

    it('should emit events to handlers', () => {
      const handler = vi.fn();
      registry.on('match:complete', handler);

      registry.emit('match:complete', { matches: [] });

      expect(handler).toHaveBeenCalledWith({ matches: [] });
    });

    it('should support multiple handlers per event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      registry.on('index:built', handler1);
      registry.on('index:built', handler2);

      registry.emit('index:built', { skillCount: 10 });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should support different event types', () => {
      const matchHandler = vi.fn();
      const gapHandler = vi.fn();

      registry.on('match:complete', matchHandler);
      registry.on('gap:detected', gapHandler);

      registry.emit('match:complete', {});
      registry.emit('gap:detected', {});

      expect(matchHandler).toHaveBeenCalledTimes(1);
      expect(gapHandler).toHaveBeenCalledTimes(1);
    });

    it('should unregister event handler', () => {
      const handler = vi.fn();
      registry.on('error', handler);
      registry.off('error', handler);

      registry.emit('error', { message: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent handler', () => {
      const handler = vi.fn();
      // Should not throw
      registry.off('error', handler);
    });

    it('should catch and log handler errors', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      registry.on('match:complete', errorHandler);
      registry.on('match:complete', normalHandler);

      // Should not throw, error is caught
      registry.emit('match:complete', {});

      // Other handlers should still run
      expect(normalHandler).toHaveBeenCalled();
    });

    it('should support all event types', () => {
      const events: SkillMatcherEvent[] = [
        'index:built',
        'index:updated',
        'match:complete',
        'gap:detected',
        'external:queried',
        'error',
      ];

      for (const event of events) {
        const handler = vi.fn();
        registry.on(event, handler);
        registry.emit(event, {});
        expect(handler).toHaveBeenCalled();
      }
    });
  });

  // ==========================================================================
  // Stats Tests
  // ==========================================================================

  describe('getStats', () => {
    it('should return zero counts initially', () => {
      const stats = registry.getStats();

      expect(stats.externalSources).toBe(0);
      expect(stats.preprocessors).toBe(0);
      expect(stats.enrichers).toBe(0);
      expect(stats.eventHooks).toBe(0);
    });

    it('should count registered plugins', () => {
      registry.registerExternalSource({
        id: 'src1',
        name: 'Source 1',
        description: '',
        rateLimit: 60,
        query: vi.fn(),
      });
      registry.registerExternalSource({
        id: 'src2',
        name: 'Source 2',
        description: '',
        rateLimit: 60,
        query: vi.fn(),
      });
      registry.registerPreprocessor({
        id: 'pre1',
        priority: 1,
        process: s => s,
      });
      registry.registerEnricher({
        id: 'enr1',
        priority: 1,
        enrich: r => r,
      });
      registry.on('match:complete', vi.fn());
      registry.on('error', vi.fn());

      const stats = registry.getStats();

      expect(stats.externalSources).toBe(2);
      expect(stats.preprocessors).toBe(1);
      expect(stats.enrichers).toBe(1);
      expect(stats.eventHooks).toBe(2);
    });
  });
});

// ============================================================================
// Built-in Plugins Tests
// ============================================================================

describe('Built-in Plugins', () => {
  describe('NormalizationPreprocessor', () => {
    it('should have correct id', () => {
      expect(NormalizationPreprocessor.id).toBe('normalize');
    });

    it('should have priority 0', () => {
      expect(NormalizationPreprocessor.priority).toBe(0);
    });

    it('should ensure activation triggers exist', () => {
      const skill: SkillCatalogEntry = {
        id: 'test',
        type: 'skill',
        name: 'Test',
        description: 'Test',
        category: 'research-strategy',
        activation: undefined as any,
      };

      const processed = NormalizationPreprocessor.process(skill);

      expect(processed.activation.triggers).toEqual([]);
      expect(processed.activation.notFor).toEqual([]);
    });

    it('should ensure tags exist', () => {
      const skill: SkillCatalogEntry = {
        id: 'test',
        type: 'skill',
        name: 'Test',
        description: 'Test',
        category: 'research-strategy',
        activation: { triggers: [], notFor: [] },
        tags: undefined,
      };

      const processed = NormalizationPreprocessor.process(skill);

      expect(processed.tags).toEqual([]);
    });

    it('should trim description', () => {
      const skill: SkillCatalogEntry = {
        id: 'test',
        type: 'skill',
        name: 'Test',
        description: '  Whitespace around  ',
        category: 'research-strategy',
        activation: { triggers: [], notFor: [] },
      };

      const processed = NormalizationPreprocessor.process(skill);

      expect(processed.description).toBe('Whitespace around');
    });

    it('should provide default description if empty', () => {
      const skill: SkillCatalogEntry = {
        id: 'test',
        type: 'skill',
        name: 'Test Skill',
        description: '',
        category: 'research-strategy',
        activation: { triggers: [], notFor: [] },
      };

      const processed = NormalizationPreprocessor.process(skill);

      expect(processed.description).toBe('Skill: Test Skill');
    });
  });

  describe('UsageHintEnricher', () => {
    it('should have correct id', () => {
      expect(UsageHintEnricher.id).toBe('usage-hints');
    });

    it('should have priority 100', () => {
      expect(UsageHintEnricher.priority).toBe(100);
    });

    it('should add invoke hint to reasoning', () => {
      const results: MatchResult[] = [mockMatchResult];

      const enriched = UsageHintEnricher.enrich(results);

      expect(enriched[0].reasoning).toContain('/skill test-skill');
    });

    it('should preserve original reasoning', () => {
      const results: MatchResult[] = [mockMatchResult];

      const enriched = UsageHintEnricher.enrich(results);

      expect(enriched[0].reasoning).toContain('High semantic similarity');
    });

    it('should enrich all results', () => {
      const results: MatchResult[] = [
        mockMatchResult,
        { ...mockMatchResult, skill: { ...mockSkill, id: 'skill-2' } },
      ];

      const enriched = UsageHintEnricher.enrich(results);

      expect(enriched[0].reasoning).toContain('/skill test-skill');
      expect(enriched[1].reasoning).toContain('/skill skill-2');
    });
  });
});

// ============================================================================
// Global Registry Tests
// ============================================================================

describe('Global Registry', () => {
  beforeEach(() => {
    resetPluginRegistry();
  });

  afterEach(() => {
    resetPluginRegistry();
  });

  it('should return singleton instance', () => {
    const registry1 = getPluginRegistry();
    const registry2 = getPluginRegistry();

    expect(registry1).toBe(registry2);
  });

  it('should register NormalizationPreprocessor by default', () => {
    const registry = getPluginRegistry();
    const stats = registry.getStats();

    expect(stats.preprocessors).toBe(1);
  });

  it('should reset registry', () => {
    const registry1 = getPluginRegistry();
    registry1.registerEnricher({
      id: 'test',
      priority: 1,
      enrich: r => r,
    });

    resetPluginRegistry();

    const registry2 = getPluginRegistry();
    const stats = registry2.getStats();

    // Should only have default preprocessor, not our enricher
    expect(stats.enrichers).toBe(0);
    expect(stats.preprocessors).toBe(1);
  });

  it('should create new registry after reset', () => {
    const registry1 = getPluginRegistry();
    resetPluginRegistry();
    const registry2 = getPluginRegistry();

    expect(registry1).not.toBe(registry2);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Edge Cases', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should handle empty results in enrichers', async () => {
    registry.registerEnricher({
      id: 'test',
      priority: 1,
      enrich: r => r,
    });

    const enriched = await registry.applyEnrichers([], 'query');

    expect(enriched).toEqual([]);
  });

  it('should handle no preprocessors', async () => {
    const processed = await registry.applyPreprocessors(mockSkill);

    expect(processed).toEqual(mockSkill);
  });

  it('should handle no enrichers', async () => {
    const enriched = await registry.applyEnrichers([mockMatchResult], 'query');

    expect(enriched).toEqual([mockMatchResult]);
  });

  it('should handle emit with no handlers', () => {
    // Should not throw
    registry.emit('match:complete', {});
  });

  it('should handle concurrent preprocessor registration', () => {
    // Register many preprocessors concurrently
    for (let i = 0; i < 100; i++) {
      registry.registerPreprocessor({
        id: `preprocessor-${i}`,
        priority: Math.random() * 100,
        process: s => s,
      });
    }

    const stats = registry.getStats();
    expect(stats.preprocessors).toBe(100);
  });
});

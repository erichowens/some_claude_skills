/**
 * Plugin System for Skill Matcher
 *
 * Provides extensibility through:
 * - Custom external source plugins
 * - Skill preprocessors
 * - Match result enrichers
 * - Event hooks
 */

import type { ExternalSuggestion, SkillCatalogEntry, MatchResult } from './types.js';

// ============================================================================
// Plugin Types
// ============================================================================

export interface ExternalSourcePlugin {
  /** Unique identifier for this source */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this source provides */
  description: string;
  /** Rate limit (requests per minute) */
  rateLimit: number;
  /** Query function */
  query(searchQuery: string, options?: Record<string, unknown>): Promise<ExternalSuggestion[]>;
  /** Optional health check */
  healthCheck?(): Promise<boolean>;
}

export interface SkillPreprocessor {
  /** Unique identifier */
  id: string;
  /** Priority (lower runs first) */
  priority: number;
  /** Process skill before indexing */
  process(skill: SkillCatalogEntry): SkillCatalogEntry | Promise<SkillCatalogEntry>;
}

export interface MatchResultEnricher {
  /** Unique identifier */
  id: string;
  /** Priority (lower runs first) */
  priority: number;
  /** Enrich match results with additional data */
  enrich(results: MatchResult[], query: string): MatchResult[] | Promise<MatchResult[]>;
}

export interface EventHook {
  /** Event type to listen for */
  event: SkillMatcherEvent;
  /** Handler function */
  handler(data: unknown): void | Promise<void>;
}

export type SkillMatcherEvent =
  | 'index:built'
  | 'index:updated'
  | 'match:complete'
  | 'gap:detected'
  | 'external:queried'
  | 'error';

// ============================================================================
// Plugin Registry
// ============================================================================

export class PluginRegistry {
  private externalSources: Map<string, ExternalSourcePlugin> = new Map();
  private preprocessors: SkillPreprocessor[] = [];
  private enrichers: MatchResultEnricher[] = [];
  private eventHooks: Map<SkillMatcherEvent, EventHook[]> = new Map();

  // ============================================================================
  // External Sources
  // ============================================================================

  registerExternalSource(plugin: ExternalSourcePlugin): void {
    if (this.externalSources.has(plugin.id)) {
      console.warn(`External source '${plugin.id}' already registered, replacing`);
    }
    this.externalSources.set(plugin.id, plugin);
    console.error(`Registered external source: ${plugin.name}`);
  }

  unregisterExternalSource(id: string): boolean {
    return this.externalSources.delete(id);
  }

  getExternalSource(id: string): ExternalSourcePlugin | undefined {
    return this.externalSources.get(id);
  }

  getExternalSources(): ExternalSourcePlugin[] {
    return Array.from(this.externalSources.values());
  }

  async queryExternalSource(
    sourceId: string,
    query: string,
    options?: Record<string, unknown>
  ): Promise<ExternalSuggestion[]> {
    const source = this.externalSources.get(sourceId);
    if (!source) {
      console.warn(`External source '${sourceId}' not found`);
      return [];
    }

    try {
      const results = await source.query(query, options);
      this.emit('external:queried', { sourceId, query, resultCount: results.length });
      return results;
    } catch (error) {
      this.emit('error', { type: 'external_query', sourceId, error });
      throw error;
    }
  }

  // ============================================================================
  // Preprocessors
  // ============================================================================

  registerPreprocessor(preprocessor: SkillPreprocessor): void {
    this.preprocessors.push(preprocessor);
    this.preprocessors.sort((a, b) => a.priority - b.priority);
    console.error(`Registered preprocessor: ${preprocessor.id}`);
  }

  async applyPreprocessors(skill: SkillCatalogEntry): Promise<SkillCatalogEntry> {
    let processed = skill;
    for (const preprocessor of this.preprocessors) {
      processed = await preprocessor.process(processed);
    }
    return processed;
  }

  // ============================================================================
  // Enrichers
  // ============================================================================

  registerEnricher(enricher: MatchResultEnricher): void {
    this.enrichers.push(enricher);
    this.enrichers.sort((a, b) => a.priority - b.priority);
    console.error(`Registered enricher: ${enricher.id}`);
  }

  async applyEnrichers(results: MatchResult[], query: string): Promise<MatchResult[]> {
    let enriched = results;
    for (const enricher of this.enrichers) {
      enriched = await enricher.enrich(enriched, query);
    }
    return enriched;
  }

  // ============================================================================
  // Event Hooks
  // ============================================================================

  on(event: SkillMatcherEvent, handler: EventHook['handler']): void {
    const hooks = this.eventHooks.get(event) || [];
    hooks.push({ event, handler });
    this.eventHooks.set(event, hooks);
  }

  off(event: SkillMatcherEvent, handler: EventHook['handler']): void {
    const hooks = this.eventHooks.get(event);
    if (hooks) {
      const index = hooks.findIndex(h => h.handler === handler);
      if (index !== -1) {
        hooks.splice(index, 1);
      }
    }
  }

  emit(event: SkillMatcherEvent, data: unknown): void {
    const hooks = this.eventHooks.get(event) || [];
    for (const hook of hooks) {
      try {
        hook.handler(data);
      } catch (error) {
        console.error(`Event hook error (${event}):`, error);
      }
    }
  }

  // ============================================================================
  // Registry Stats
  // ============================================================================

  getStats(): {
    externalSources: number;
    preprocessors: number;
    enrichers: number;
    eventHooks: number;
  } {
    let totalHooks = 0;
    for (const [, hooks] of this.eventHooks) {
      totalHooks += hooks.length;
    }

    return {
      externalSources: this.externalSources.size,
      preprocessors: this.preprocessors.length,
      enrichers: this.enrichers.length,
      eventHooks: totalHooks,
    };
  }
}

// ============================================================================
// Built-in Plugins
// ============================================================================

/**
 * Preprocessor that normalizes skill descriptions
 */
export const NormalizationPreprocessor: SkillPreprocessor = {
  id: 'normalize',
  priority: 0,
  process(skill) {
    return {
      ...skill,
      // Ensure required fields
      activation: {
        triggers: skill.activation?.triggers || [],
        notFor: skill.activation?.notFor || [],
      },
      tags: skill.tags || [],
      // Normalize description
      description: skill.description?.trim() || `Skill: ${skill.name}`,
    };
  },
};

/**
 * Enricher that adds usage hints to match results
 */
export const UsageHintEnricher: MatchResultEnricher = {
  id: 'usage-hints',
  priority: 100,
  enrich(results) {
    return results.map(result => ({
      ...result,
      reasoning: `${result.reasoning}. Invoke with: /skill ${result.skill.id}`,
    }));
  },
};

// ============================================================================
// Global Registry Instance
// ============================================================================

let globalRegistry: PluginRegistry | null = null;

export function getPluginRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();
    // Register built-in plugins
    globalRegistry.registerPreprocessor(NormalizationPreprocessor);
  }
  return globalRegistry;
}

export function resetPluginRegistry(): void {
  globalRegistry = null;
}

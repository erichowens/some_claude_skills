/**
 * Embedding Cache
 *
 * Manages persistent storage of skill embeddings to avoid recomputing.
 * Stored in JSON file for fast loading.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Embedding } from './embedding-service';
import type { SkillInfo } from '../registry/skill-loader';

export interface CachedEmbedding {
  /** Skill ID */
  skillId: string;

  /** Embedding vector */
  embedding: Embedding;

  /** Model used to generate embedding */
  model: string;

  /** When this embedding was created */
  timestamp: number;

  /** Hash of the skill description (to detect changes) */
  descriptionHash: string;
}

export interface EmbeddingCacheData {
  /** Cache format version */
  version: number;

  /** When cache was last updated */
  lastUpdated: number;

  /** Model used for embeddings */
  model: string;

  /** Cached embeddings by skill ID */
  embeddings: Record<string, CachedEmbedding>;
}

export interface EmbeddingCacheConfig {
  /** Path to cache file (default: .cache/skill-embeddings.json) */
  cachePath?: string;

  /** Cache TTL in milliseconds (default: 30 days) */
  ttl?: number;

  /** Whether to auto-save on updates (default: true) */
  autoSave?: boolean;
}

/**
 * EmbeddingCache - Manages persistent embedding storage
 */
export class EmbeddingCache {
  private config: Required<EmbeddingCacheConfig>;
  private cache: EmbeddingCacheData;
  private dirty = false;

  constructor(config: EmbeddingCacheConfig = {}) {
    this.config = {
      cachePath: config.cachePath || path.join(process.cwd(), '.cache', 'skill-embeddings.json'),
      ttl: config.ttl || 30 * 24 * 60 * 60 * 1000, // 30 days
      autoSave: config.autoSave ?? true,
    };

    this.cache = this.loadCache();
  }

  /**
   * Load cache from disk
   */
  private loadCache(): EmbeddingCacheData {
    try {
      if (fs.existsSync(this.config.cachePath)) {
        const data = fs.readFileSync(this.config.cachePath, 'utf-8');
        const cache = JSON.parse(data) as EmbeddingCacheData;

        // Validate cache structure
        if (!cache.version || !cache.embeddings) {
          console.warn('Invalid cache structure, creating new cache');
          return this.createEmptyCache();
        }

        return cache;
      }
    } catch (error) {
      console.warn('Failed to load embedding cache:', error);
    }

    return this.createEmptyCache();
  }

  /**
   * Create empty cache structure
   */
  private createEmptyCache(): EmbeddingCacheData {
    return {
      version: 1,
      lastUpdated: Date.now(),
      model: 'text-embedding-3-small',
      embeddings: {},
    };
  }

  /**
   * Save cache to disk
   */
  save(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.config.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write cache
      fs.writeFileSync(
        this.config.cachePath,
        JSON.stringify(this.cache, null, 2),
        'utf-8'
      );

      this.dirty = false;
    } catch (error) {
      console.error('Failed to save embedding cache:', error);
      throw error;
    }
  }

  /**
   * Get embedding for a skill
   */
  get(skillId: string): CachedEmbedding | undefined {
    const cached = this.cache.embeddings[skillId];
    if (!cached) return undefined;

    // Check if expired
    if (Date.now() - cached.timestamp > this.config.ttl) {
      delete this.cache.embeddings[skillId];
      this.dirty = true;
      if (this.config.autoSave) {
        this.save();
      }
      return undefined;
    }

    return cached;
  }

  /**
   * Set embedding for a skill
   */
  set(
    skillId: string,
    embedding: Embedding,
    model: string,
    description: string
  ): void {
    this.cache.embeddings[skillId] = {
      skillId,
      embedding,
      model,
      timestamp: Date.now(),
      descriptionHash: this.hashString(description),
    };

    this.cache.lastUpdated = Date.now();
    this.cache.model = model;
    this.dirty = true;

    if (this.config.autoSave) {
      this.save();
    }
  }

  /**
   * Check if cache has valid embedding for a skill
   */
  has(skillId: string, description: string): boolean {
    const cached = this.get(skillId);
    if (!cached) return false;

    // Check if description changed
    const currentHash = this.hashString(description);
    if (cached.descriptionHash !== currentHash) {
      // Description changed, invalidate
      delete this.cache.embeddings[skillId];
      this.dirty = true;
      if (this.config.autoSave) {
        this.save();
      }
      return false;
    }

    return true;
  }

  /**
   * Get all cached embeddings
   */
  getAll(): CachedEmbedding[] {
    return Object.values(this.cache.embeddings);
  }

  /**
   * Find missing embeddings for a list of skills
   */
  findMissing(skills: SkillInfo[]): SkillInfo[] {
    return skills.filter(skill => !this.has(skill.id, skill.description));
  }

  /**
   * Batch set embeddings
   */
  setBatch(
    embeddings: Array<{
      skillId: string;
      embedding: Embedding;
      model: string;
      description: string;
    }>
  ): void {
    for (const item of embeddings) {
      this.cache.embeddings[item.skillId] = {
        skillId: item.skillId,
        embedding: item.embedding,
        model: item.model,
        timestamp: Date.now(),
        descriptionHash: this.hashString(item.description),
      };
    }

    this.cache.lastUpdated = Date.now();
    this.dirty = true;

    if (this.config.autoSave) {
      this.save();
    }
  }

  /**
   * Clear all cached embeddings
   */
  clear(): void {
    this.cache = this.createEmptyCache();
    this.dirty = true;

    if (this.config.autoSave) {
      this.save();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEmbeddings: number;
    lastUpdated: Date;
    model: string;
    cacheSize: number;
  } {
    const stats = {
      totalEmbeddings: Object.keys(this.cache.embeddings).length,
      lastUpdated: new Date(this.cache.lastUpdated),
      model: this.cache.model,
      cacheSize: 0,
    };

    try {
      if (fs.existsSync(this.config.cachePath)) {
        const fileStats = fs.statSync(this.config.cachePath);
        stats.cacheSize = fileStats.size;
      }
    } catch {
      // Ignore errors
    }

    return stats;
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

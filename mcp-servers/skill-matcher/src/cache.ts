/**
 * Embedding Cache Module
 *
 * Provides disk-based caching for embeddings to avoid regenerating
 * them on each server restart. Uses a simple JSON file cache with
 * versioning and TTL support.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
  vector: number[];
  hash: string;
  timestamp: number;
}

interface CacheData {
  version: string;
  model: string;
  dimensions: number;
  entries: Record<string, CacheEntry>;
  createdAt: number;
  lastUpdated: number;
}

interface CacheConfig {
  cacheDir: string;
  cacheFile: string;
  version: string;
  model: string;
  dimensions: number;
  maxEntries?: number;
  ttlMs?: number;
}

// ============================================================================
// Embedding Cache
// ============================================================================

export class EmbeddingCache {
  private config: CacheConfig;
  private data: CacheData | null = null;
  private dirty = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: CacheConfig) {
    this.config = {
      maxEntries: 10000,
      ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days default
      ...config,
    };
  }

  /**
   * Initialize the cache, loading from disk if available
   */
  async initialize(): Promise<void> {
    const cachePath = this.getCachePath();

    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const loaded = JSON.parse(content) as CacheData;

      // Validate cache compatibility
      if (
        loaded.version === this.config.version &&
        loaded.model === this.config.model &&
        loaded.dimensions === this.config.dimensions
      ) {
        this.data = loaded;
        console.error(`Loaded ${Object.keys(loaded.entries).length} cached embeddings`);

        // Clean expired entries
        this.cleanExpired();
      } else {
        console.error('Cache version mismatch, starting fresh');
        this.initializeEmpty();
      }
    } catch (error) {
      // No cache file or invalid - start fresh
      console.error('No valid cache found, starting fresh');
      this.initializeEmpty();
    }
  }

  /**
   * Get a cached embedding if available
   */
  get(text: string): number[] | null {
    if (!this.data) return null;

    const hash = this.hashText(text);
    const entry = this.data.entries[hash];

    if (!entry) return null;

    // Check TTL
    if (this.config.ttlMs && Date.now() - entry.timestamp > this.config.ttlMs) {
      delete this.data.entries[hash];
      this.dirty = true;
      return null;
    }

    return entry.vector;
  }

  /**
   * Store an embedding in the cache
   */
  set(text: string, vector: number[]): void {
    if (!this.data) {
      this.initializeEmpty();
    }

    const hash = this.hashText(text);

    this.data!.entries[hash] = {
      vector,
      hash,
      timestamp: Date.now(),
    };

    this.data!.lastUpdated = Date.now();
    this.dirty = true;

    // Enforce max entries
    this.enforceMaxEntries();

    // Schedule async save
    this.scheduleSave();
  }

  /**
   * Check if text is cached
   */
  has(text: string): boolean {
    return this.get(text) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    hitRate?: number;
    sizeBytes: number;
    lastUpdated: number;
  } {
    if (!this.data) {
      return { entries: 0, sizeBytes: 0, lastUpdated: 0 };
    }

    return {
      entries: Object.keys(this.data.entries).length,
      sizeBytes: JSON.stringify(this.data).length,
      lastUpdated: this.data.lastUpdated,
    };
  }

  /**
   * Force save to disk immediately
   */
  async flush(): Promise<void> {
    if (!this.dirty || !this.data) return;

    const cachePath = this.getCachePath();
    const cacheDir = path.dirname(cachePath);

    // Ensure directory exists
    await fs.mkdir(cacheDir, { recursive: true });

    // Write atomically using temp file
    const tempPath = `${cachePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(this.data, null, 2));
    await fs.rename(tempPath, cachePath);

    this.dirty = false;
    console.error(`Saved ${Object.keys(this.data.entries).length} embeddings to cache`);
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    this.initializeEmpty();
    this.dirty = true;
    await this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getCachePath(): string {
    return path.join(this.config.cacheDir, this.config.cacheFile);
  }

  private initializeEmpty(): void {
    this.data = {
      version: this.config.version,
      model: this.config.model,
      dimensions: this.config.dimensions,
      entries: {},
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  private hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  private cleanExpired(): void {
    if (!this.data || !this.config.ttlMs) return;

    const now = Date.now();
    let cleaned = 0;

    for (const [hash, entry] of Object.entries(this.data.entries)) {
      if (now - entry.timestamp > this.config.ttlMs) {
        delete this.data.entries[hash];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.error(`Cleaned ${cleaned} expired cache entries`);
      this.dirty = true;
    }
  }

  private enforceMaxEntries(): void {
    if (!this.data || !this.config.maxEntries) return;

    const entries = Object.entries(this.data.entries);
    if (entries.length <= this.config.maxEntries) return;

    // Sort by timestamp (oldest first) and remove oldest
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.length - this.config.maxEntries;
    for (let i = 0; i < toRemove; i++) {
      delete this.data.entries[entries[i][0]];
    }

    console.error(`Evicted ${toRemove} oldest cache entries`);
  }

  private scheduleSave(): void {
    // Debounce saves to avoid excessive disk writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.flush().catch(err => console.error('Failed to save cache:', err));
    }, 5000); // Save after 5 seconds of no activity
  }
}

// ============================================================================
// Singleton Instance (Optional)
// ============================================================================

let defaultCache: EmbeddingCache | null = null;

export function getDefaultCache(config?: Partial<CacheConfig>): EmbeddingCache {
  if (!defaultCache) {
    defaultCache = new EmbeddingCache({
      cacheDir: config?.cacheDir || '.cache',
      cacheFile: config?.cacheFile || 'embeddings.json',
      version: config?.version || '1.0',
      model: config?.model || 'local-tfidf',
      dimensions: config?.dimensions || 512,
      ...config,
    });
  }
  return defaultCache;
}

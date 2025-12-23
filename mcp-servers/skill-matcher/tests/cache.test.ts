/**
 * Cache Layer Tests
 *
 * Tests for the EmbeddingCache class including initialization,
 * get/set operations, TTL expiration, max entries enforcement,
 * and disk persistence.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { EmbeddingCache, getDefaultCache } from '../src/cache.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createTestVector(size: number = 512): number[] {
  return Array.from({ length: size }, (_, i) => Math.sin(i) * 0.5);
}

// ============================================================================
// Basic Cache Operations
// ============================================================================

describe('EmbeddingCache', () => {
  let tempDir: string;
  let cache: EmbeddingCache;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-test-'));
    cache = new EmbeddingCache({
      cacheDir: tempDir,
      cacheFile: 'test-embeddings.json',
      version: '1.0',
      model: 'test-model',
      dimensions: 512,
      maxEntries: 100,
      ttlMs: 60000, // 1 minute for tests
    });
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize with empty cache when no file exists', async () => {
      await cache.initialize();
      const stats = cache.getStats();

      expect(stats.entries).toBe(0);
      expect(stats.sizeBytes).toBeGreaterThan(0);
    });

    it('should load existing cache from disk', async () => {
      // Create and populate cache
      await cache.initialize();
      cache.set('test-text', createTestVector());
      await cache.flush();

      // Create new cache instance and load
      const cache2 = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'test-embeddings.json',
        version: '1.0',
        model: 'test-model',
        dimensions: 512,
      });
      await cache2.initialize();

      expect(cache2.has('test-text')).toBe(true);
    });

    it('should reject cache with version mismatch', async () => {
      // Create cache with version 1.0
      await cache.initialize();
      cache.set('test-text', createTestVector());
      await cache.flush();

      // Create new cache with different version
      const cache2 = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'test-embeddings.json',
        version: '2.0', // Different version
        model: 'test-model',
        dimensions: 512,
      });
      await cache2.initialize();

      // Should start fresh due to version mismatch
      expect(cache2.has('test-text')).toBe(false);
    });

    it('should reject cache with model mismatch', async () => {
      await cache.initialize();
      cache.set('test-text', createTestVector());
      await cache.flush();

      const cache2 = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'test-embeddings.json',
        version: '1.0',
        model: 'different-model', // Different model
        dimensions: 512,
      });
      await cache2.initialize();

      expect(cache2.has('test-text')).toBe(false);
    });

    it('should reject cache with dimensions mismatch', async () => {
      await cache.initialize();
      cache.set('test-text', createTestVector());
      await cache.flush();

      const cache2 = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'test-embeddings.json',
        version: '1.0',
        model: 'test-model',
        dimensions: 1024, // Different dimensions
      });
      await cache2.initialize();

      expect(cache2.has('test-text')).toBe(false);
    });
  });

  describe('Get/Set Operations', () => {
    beforeEach(async () => {
      await cache.initialize();
    });

    it('should store and retrieve vectors', () => {
      const vector = createTestVector();
      cache.set('my-text', vector);
      const retrieved = cache.get('my-text');

      expect(retrieved).toEqual(vector);
    });

    it('should return null for missing entries', () => {
      const result = cache.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should correctly report has() for existing entries', () => {
      cache.set('exists', createTestVector());

      expect(cache.has('exists')).toBe(true);
      expect(cache.has('does-not-exist')).toBe(false);
    });

    it('should overwrite existing entries', () => {
      const vector1 = createTestVector();
      const vector2 = createTestVector().map(v => v * 2);

      cache.set('key', vector1);
      cache.set('key', vector2);

      expect(cache.get('key')).toEqual(vector2);
    });

    it('should handle empty text keys', () => {
      cache.set('', createTestVector());
      expect(cache.has('')).toBe(true);
    });

    it('should handle unicode text keys', () => {
      const vector = createTestVector();
      cache.set('日本語テキスト', vector);

      expect(cache.get('日本語テキスト')).toEqual(vector);
    });

    it('should handle very long text keys', () => {
      const longKey = 'a'.repeat(10000);
      const vector = createTestVector();
      cache.set(longKey, vector);

      expect(cache.get(longKey)).toEqual(vector);
    });
  });

  describe('TTL Expiration', () => {
    it('should return null for expired entries', async () => {
      const shortTtlCache = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'short-ttl.json',
        version: '1.0',
        model: 'test',
        dimensions: 512,
        ttlMs: 100, // 100ms TTL
      });
      await shortTtlCache.initialize();

      shortTtlCache.set('will-expire', createTestVector());
      expect(shortTtlCache.get('will-expire')).not.toBeNull();

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortTtlCache.get('will-expire')).toBeNull();
    });

    it('should not expire entries before TTL', async () => {
      cache.set('fresh', createTestVector());

      // Wait a short time (but less than TTL)
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(cache.get('fresh')).not.toBeNull();
    });
  });

  describe('Max Entries Enforcement', () => {
    it('should evict oldest entries when max is exceeded', async () => {
      const smallCache = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'small.json',
        version: '1.0',
        model: 'test',
        dimensions: 512,
        maxEntries: 3,
      });
      await smallCache.initialize();

      // Add 4 entries (max is 3)
      smallCache.set('entry1', createTestVector());
      await new Promise(r => setTimeout(r, 10)); // Ensure different timestamps
      smallCache.set('entry2', createTestVector());
      await new Promise(r => setTimeout(r, 10));
      smallCache.set('entry3', createTestVector());
      await new Promise(r => setTimeout(r, 10));
      smallCache.set('entry4', createTestVector());

      // First entry should be evicted
      expect(smallCache.has('entry1')).toBe(false);
      expect(smallCache.has('entry2')).toBe(true);
      expect(smallCache.has('entry3')).toBe(true);
      expect(smallCache.has('entry4')).toBe(true);
    });

    it('should track entry count correctly', async () => {
      cache.set('a', createTestVector());
      cache.set('b', createTestVector());
      cache.set('c', createTestVector());

      expect(cache.getStats().entries).toBe(3);
    });
  });

  describe('Disk Persistence', () => {
    beforeEach(async () => {
      await cache.initialize();
    });

    it('should flush changes to disk', async () => {
      cache.set('persist-me', createTestVector());
      await cache.flush();

      const filePath = path.join(tempDir, 'test-embeddings.json');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);

      expect(exists).toBe(true);
    });

    it('should not flush when not dirty', async () => {
      // Don't make any changes
      await cache.flush();

      const stats = cache.getStats();
      expect(stats.entries).toBe(0);
    });

    it('should persist data correctly', async () => {
      const vector = createTestVector();
      cache.set('persisted', vector);
      await cache.flush();

      // Read the file directly
      const filePath = path.join(tempDir, 'test-embeddings.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBe('1.0');
      expect(data.model).toBe('test-model');
      expect(data.dimensions).toBe(512);
      expect(Object.keys(data.entries).length).toBe(1);
    });

    it('should use atomic writes with temp file', async () => {
      cache.set('atomic', createTestVector());
      await cache.flush();

      // Temp file should not exist after flush
      const tempPath = path.join(tempDir, 'test-embeddings.json.tmp');
      const exists = await fs.access(tempPath).then(() => true).catch(() => false);

      expect(exists).toBe(false);
    });
  });

  describe('Clear Operation', () => {
    beforeEach(async () => {
      await cache.initialize();
    });

    it('should clear all entries', async () => {
      cache.set('entry1', createTestVector());
      cache.set('entry2', createTestVector());
      cache.set('entry3', createTestVector());

      await cache.clear();

      expect(cache.getStats().entries).toBe(0);
      expect(cache.get('entry1')).toBeNull();
    });

    it('should persist cleared state to disk', async () => {
      cache.set('to-clear', createTestVector());
      await cache.flush();
      await cache.clear();

      // Create new cache and verify empty
      const cache2 = new EmbeddingCache({
        cacheDir: tempDir,
        cacheFile: 'test-embeddings.json',
        version: '1.0',
        model: 'test-model',
        dimensions: 512,
      });
      await cache2.initialize();

      expect(cache2.getStats().entries).toBe(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await cache.initialize();
    });

    it('should report correct entry count', () => {
      cache.set('a', createTestVector());
      cache.set('b', createTestVector());

      expect(cache.getStats().entries).toBe(2);
    });

    it('should report size in bytes', () => {
      cache.set('text', createTestVector());
      const stats = cache.getStats();

      expect(stats.sizeBytes).toBeGreaterThan(0);
    });

    it('should report lastUpdated timestamp', () => {
      const before = Date.now();
      cache.set('timed', createTestVector());
      const after = Date.now();

      const stats = cache.getStats();
      expect(stats.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(stats.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('Hash Consistency', () => {
    beforeEach(async () => {
      await cache.initialize();
    });

    it('should produce consistent hashes for same text', () => {
      const vector = createTestVector();
      cache.set('consistent-text', vector);

      // The same text should retrieve the same vector
      expect(cache.get('consistent-text')).toEqual(vector);
      expect(cache.get('consistent-text')).toEqual(vector);
    });

    it('should produce different hashes for different text', () => {
      cache.set('text-a', [1, 2, 3]);
      cache.set('text-b', [4, 5, 6]);

      expect(cache.get('text-a')).toEqual([1, 2, 3]);
      expect(cache.get('text-b')).toEqual([4, 5, 6]);
    });
  });
});

// ============================================================================
// Default Cache Singleton Tests
// ============================================================================

describe('getDefaultCache', () => {
  it('should return a cache instance', () => {
    const cache = getDefaultCache({
      cacheDir: '/tmp/test-cache',
      version: '1.0',
    });

    expect(cache).toBeInstanceOf(EmbeddingCache);
  });

  it('should return the same instance on subsequent calls', () => {
    // Note: This test might fail if run after other tests that modify the singleton
    // In a real scenario, we'd reset the module between tests
    const cache1 = getDefaultCache();
    const cache2 = getDefaultCache();

    expect(cache1).toBe(cache2);
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-edge-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should handle corrupted cache file', async () => {
    // Create a corrupted cache file
    const filePath = path.join(tempDir, 'corrupted.json');
    await fs.writeFile(filePath, 'not valid json{{{');

    const cache = new EmbeddingCache({
      cacheDir: tempDir,
      cacheFile: 'corrupted.json',
      version: '1.0',
      model: 'test',
      dimensions: 512,
    });

    // Should not throw, should start fresh
    await expect(cache.initialize()).resolves.not.toThrow();
    expect(cache.getStats().entries).toBe(0);
  });

  it('should handle zero-length vectors', async () => {
    const cache = new EmbeddingCache({
      cacheDir: tempDir,
      cacheFile: 'zero.json',
      version: '1.0',
      model: 'test',
      dimensions: 0,
    });
    await cache.initialize();

    cache.set('empty-vector', []);
    expect(cache.get('empty-vector')).toEqual([]);
  });

  it('should handle special characters in text', async () => {
    const cache = new EmbeddingCache({
      cacheDir: tempDir,
      cacheFile: 'special.json',
      version: '1.0',
      model: 'test',
      dimensions: 512,
    });
    await cache.initialize();

    const specialTexts = [
      'path/with/slashes',
      'text\nwith\nnewlines',
      'text\twith\ttabs',
      '"quoted"',
      "it's apostrophe",
      '<html>tags</html>',
      '{ "json": true }',
    ];

    for (const text of specialTexts) {
      const vector = createTestVector();
      cache.set(text, vector);
      expect(cache.get(text)).toEqual(vector);
    }
  });

  it('should handle concurrent sets', async () => {
    const cache = new EmbeddingCache({
      cacheDir: tempDir,
      cacheFile: 'concurrent.json',
      version: '1.0',
      model: 'test',
      dimensions: 512,
    });
    await cache.initialize();

    // Simulate concurrent writes
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        Promise.resolve().then(() => {
          cache.set(`key-${i}`, createTestVector());
        })
      );
    }
    await Promise.all(promises);

    expect(cache.getStats().entries).toBe(50);
  });
});

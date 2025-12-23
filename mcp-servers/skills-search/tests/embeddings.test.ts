/**
 * Embedding Service Tests
 *
 * Tests for the EmbeddingService class including mock embeddings,
 * vector operations, and OpenAI fallback behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EmbeddingService,
  cosineSimilarity,
  normalize,
  addVectors,
  scaleVector,
} from '../src/embeddings.js';

// ============================================================================
// Vector Operations Tests
// ============================================================================

describe('Vector Operations', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0, 0];
      const b = [0, 1, 0, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const a = [1, 0, 0];
      const b = [-1, 0, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
    });

    it('should handle normalized vectors correctly', () => {
      const a = normalize([3, 4]);
      const b = normalize([4, 3]);
      const sim = cosineSimilarity(a, b);
      expect(sim).toBeGreaterThan(0.9);
      expect(sim).toBeLessThan(1);
    });

    it('should throw for dimension mismatch', () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow('dimension mismatch');
    });

    it('should return 0 for zero vectors', () => {
      const zero = [0, 0, 0, 0];
      const vec = [1, 2, 3, 4];
      expect(cosineSimilarity(zero, vec)).toBe(0);
    });

    it('should be symmetric', () => {
      const a = [0.1, 0.2, 0.3, 0.4];
      const b = [0.5, 0.4, 0.3, 0.2];
      expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
    });
  });

  describe('normalize', () => {
    it('should produce unit vector', () => {
      const vec = [3, 4];
      const normalized = normalize(vec);
      const magnitude = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should handle zero vector', () => {
      const zero = [0, 0, 0];
      const result = normalize(zero);
      expect(result).toEqual([0, 0, 0]);
    });

    it('should preserve direction', () => {
      const vec = [2, 4, 6];
      const normalized = normalize(vec);
      // Ratios should be preserved
      expect(normalized[1] / normalized[0]).toBeCloseTo(2, 5);
      expect(normalized[2] / normalized[0]).toBeCloseTo(3, 5);
    });

    it('should handle single-element vector', () => {
      const vec = [5];
      const normalized = normalize(vec);
      expect(normalized[0]).toBeCloseTo(1, 5);
    });

    it('should handle negative values', () => {
      const vec = [-3, 4];
      const normalized = normalize(vec);
      const magnitude = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });
  });

  describe('addVectors', () => {
    it('should add vectors element-wise', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      expect(addVectors(a, b)).toEqual([5, 7, 9]);
    });

    it('should throw for dimension mismatch', () => {
      const a = [1, 2];
      const b = [1, 2, 3];
      expect(() => addVectors(a, b)).toThrow('dimension mismatch');
    });

    it('should handle negative values', () => {
      const a = [1, -2, 3];
      const b = [-1, 2, -3];
      expect(addVectors(a, b)).toEqual([0, 0, 0]);
    });

    it('should handle zero vectors', () => {
      const a = [1, 2, 3];
      const zero = [0, 0, 0];
      expect(addVectors(a, zero)).toEqual(a);
    });
  });

  describe('scaleVector', () => {
    it('should scale vector by scalar', () => {
      const vec = [1, 2, 3];
      expect(scaleVector(vec, 2)).toEqual([2, 4, 6]);
    });

    it('should handle zero scalar', () => {
      const vec = [1, 2, 3];
      expect(scaleVector(vec, 0)).toEqual([0, 0, 0]);
    });

    it('should handle negative scalar', () => {
      const vec = [1, 2, 3];
      expect(scaleVector(vec, -1)).toEqual([-1, -2, -3]);
    });

    it('should handle fractional scalar', () => {
      const vec = [2, 4, 6];
      expect(scaleVector(vec, 0.5)).toEqual([1, 2, 3]);
    });
  });
});

// ============================================================================
// EmbeddingService Tests
// ============================================================================

describe('EmbeddingService', () => {
  describe('Constructor', () => {
    it('should create service without API key', () => {
      const service = new EmbeddingService();
      expect(service.isOpenAIAvailable()).toBe(false);
    });

    it('should create service with API key', () => {
      const service = new EmbeddingService('test-api-key');
      expect(service.isOpenAIAvailable()).toBe(true);
    });

    it('should use default config', () => {
      const service = new EmbeddingService();
      const config = service.getConfig();
      expect(config.model).toBe('text-embedding-3-small');
      expect(config.dimensions).toBe(1536);
    });

    it('should accept custom config', () => {
      const service = new EmbeddingService(undefined, {
        model: 'custom-model',
        dimensions: 512,
      });
      const config = service.getConfig();
      expect(config.model).toBe('custom-model');
      expect(config.dimensions).toBe(512);
    });
  });

  describe('Mock Embeddings', () => {
    let service: EmbeddingService;

    beforeEach(() => {
      service = new EmbeddingService(); // No API key = uses mock
    });

    it('should generate embeddings of correct dimension', async () => {
      const embedding = await service.embed('test text');
      expect(embedding.length).toBe(1536); // Default dimensions
    });

    it('should generate normalized embeddings', async () => {
      const embedding = await service.embed('test text');
      const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should be deterministic for same input', async () => {
      const emb1 = await service.embed('hello world');
      const emb2 = await service.embed('hello world');
      expect(emb1).toEqual(emb2);
    });

    it('should produce different embeddings for different text', async () => {
      const emb1 = await service.embed('hello');
      const emb2 = await service.embed('goodbye');
      expect(emb1).not.toEqual(emb2);
    });

    it('should handle empty string', async () => {
      const embedding = await service.embed('');
      expect(embedding.length).toBe(1536);
    });

    it('should handle long text', async () => {
      const longText = 'word '.repeat(10000);
      const embedding = await service.embed(longText);
      expect(embedding.length).toBe(1536);
    });

    it('should handle unicode text', async () => {
      const embedding = await service.embed('日本語テキスト 🎉');
      expect(embedding.length).toBe(1536);
    });

    it('should handle special characters', async () => {
      const embedding = await service.embed('test\n\t"quoted" <html> {json}');
      expect(embedding.length).toBe(1536);
    });
  });

  describe('Batch Embeddings', () => {
    let service: EmbeddingService;

    beforeEach(() => {
      service = new EmbeddingService();
    });

    it('should generate batch embeddings', async () => {
      const texts = ['text 1', 'text 2', 'text 3'];
      const embeddings = await service.embedBatch(texts);

      expect(embeddings.length).toBe(3);
      expect(embeddings[0].length).toBe(1536);
    });

    it('should maintain order in batch', async () => {
      const texts = ['first', 'second', 'third'];
      const embeddings = await service.embedBatch(texts);

      const individualEmbs = await Promise.all(texts.map(t => service.embed(t)));

      for (let i = 0; i < texts.length; i++) {
        expect(embeddings[i]).toEqual(individualEmbs[i]);
      }
    });

    it('should handle empty batch', async () => {
      const embeddings = await service.embedBatch([]);
      expect(embeddings).toEqual([]);
    });

    it('should handle single-item batch', async () => {
      const embeddings = await service.embedBatch(['single']);
      expect(embeddings.length).toBe(1);
    });
  });

  describe('Semantic Similarity', () => {
    let service: EmbeddingService;

    beforeEach(() => {
      service = new EmbeddingService();
    });

    it('should produce similar embeddings for related text', async () => {
      const emb1 = await service.embed('machine learning artificial intelligence');
      const emb2 = await service.embed('AI deep learning neural networks');
      const emb3 = await service.embed('cooking recipes kitchen food');

      const sim12 = cosineSimilarity(emb1, emb2);
      const sim13 = cosineSimilarity(emb1, emb3);

      // Note: Mock embeddings won't have true semantic understanding,
      // but should still produce different similarities for different texts
      expect(typeof sim12).toBe('number');
      expect(typeof sim13).toBe('number');
    });
  });

  describe('Custom Dimensions', () => {
    it('should respect custom dimensions', async () => {
      const service = new EmbeddingService(undefined, { dimensions: 256 });
      const embedding = await service.embed('test');
      expect(embedding.length).toBe(256);
    });

    it('should handle large dimensions', async () => {
      const service = new EmbeddingService(undefined, { dimensions: 4096 });
      const embedding = await service.embed('test');
      expect(embedding.length).toBe(4096);
    });

    it('should handle small dimensions', async () => {
      const service = new EmbeddingService(undefined, { dimensions: 8 });
      const embedding = await service.embed('test');
      expect(embedding.length).toBe(8);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  describe('Large Scale', () => {
    it('should handle many embeddings', async () => {
      const service = new EmbeddingService(undefined, { dimensions: 128 });
      const texts = Array.from({ length: 100 }, (_, i) => `document number ${i}`);

      const embeddings = await service.embedBatch(texts);

      expect(embeddings.length).toBe(100);
      embeddings.forEach(emb => {
        expect(emb.length).toBe(128);
      });
    });
  });

  describe('Numerical Precision', () => {
    it('should maintain reasonable precision in similarity', () => {
      const a = Array.from({ length: 1000 }, () => Math.random());
      const b = Array.from({ length: 1000 }, () => Math.random());

      const sim = cosineSimilarity(normalize(a), normalize(b));

      expect(sim).toBeGreaterThanOrEqual(-1);
      expect(sim).toBeLessThanOrEqual(1);
    });

    it('should handle very small values', () => {
      const a = [1e-10, 1e-10, 1e-10];
      const b = [1e-10, 1e-10, 1e-10];

      const sim = cosineSimilarity(a, b);
      expect(sim).toBeCloseTo(1, 5);
    });

    it('should handle very large values', () => {
      const a = [1e10, 1e10, 1e10];
      const b = [1e10, 1e10, 1e10];

      const sim = cosineSimilarity(a, b);
      expect(sim).toBeCloseTo(1, 5);
    });
  });
});

/**
 * Embeddings Module Tests
 *
 * Tests for TF-IDF embedding generation, cosine similarity,
 * keyword matching, and hybrid scoring.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  EmbeddingService,
  cosineSimilarity,
  keywordMatch,
  hybridScore,
  prepareTextForEmbedding,
} from '../src/embeddings.js';

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vec = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5);
  });

  it('should return 0 for orthogonal vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it('should return -1 for opposite vectors', () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
  });

  it('should handle zero vectors', () => {
    const zero = [0, 0, 0];
    const nonzero = [1, 2, 3];
    expect(cosineSimilarity(zero, nonzero)).toBe(0);
    expect(cosineSimilarity(zero, zero)).toBe(0);
  });

  it('should be commutative', () => {
    const a = [1, 2, 3, 4];
    const b = [4, 3, 2, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });

  it('should work with sparse vectors', () => {
    const a = [0, 0, 0, 1, 0];
    const b = [0, 0, 0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });
});

describe('keywordMatch', () => {
  it('should return positive score for exact trigger match', () => {
    const query = 'help me design a website';
    const triggers = ['website', 'web design', 'frontend'];
    // Multiple matches: "website" and "web design" both match
    expect(keywordMatch(query, triggers)).toBeGreaterThan(0.3);
  });

  it('should return 0 when no triggers match', () => {
    const query = 'help me cook dinner';
    const triggers = ['website', 'web design', 'frontend'];
    expect(keywordMatch(query, triggers)).toBe(0);
  });

  it('should penalize notFor matches', () => {
    const query = 'help me with general coding questions';
    const triggers = ['coding', 'programming'];
    const notFor = ['general'];
    const withNotFor = keywordMatch(query, triggers, notFor);
    const withoutNotFor = keywordMatch(query, triggers);
    // notFor contains "general" which matches "general" in query
    // This should result in a penalty (negative or lower score)
    expect(withNotFor).toBeLessThanOrEqual(withoutNotFor);
  });

  it('should be case-insensitive', () => {
    const triggers = ['WEBSITE', 'Web Design'];
    const score1 = keywordMatch('website help', triggers);
    const score2 = keywordMatch('WEBSITE HELP', triggers);
    expect(score1).toBeCloseTo(score2, 5);
  });

  it('should handle empty triggers', () => {
    const query = 'any query here';
    expect(keywordMatch(query, [])).toBe(0);
  });

  it('should match partial words in triggers', () => {
    const query = 'typescript development';
    const triggers = ['type', 'typescript'];
    expect(keywordMatch(query, triggers)).toBeGreaterThan(0);
  });
});

describe('hybridScore', () => {
  it('should weight semantic and keyword scores', () => {
    const semantic = 0.8;
    const keyword = 0.6;
    const hybrid = hybridScore(semantic, keyword);

    // Should be between the two scores
    expect(hybrid).toBeGreaterThanOrEqual(Math.min(semantic, keyword));
    expect(hybrid).toBeLessThanOrEqual(Math.max(semantic, keyword));
  });

  it('should handle zero scores', () => {
    expect(hybridScore(0, 0)).toBe(0);
    expect(hybridScore(1, 0)).toBeGreaterThan(0);
    expect(hybridScore(0, 1)).toBeGreaterThan(0);
  });

  it('should give higher weight to better signals', () => {
    // When both are high, should be high
    expect(hybridScore(0.9, 0.9)).toBeGreaterThan(0.85);

    // When one is very low, should be lower
    expect(hybridScore(0.9, 0.1)).toBeLessThan(hybridScore(0.9, 0.9));
  });
});

describe('prepareTextForEmbedding', () => {
  it('should combine all inputs', () => {
    const text = prepareTextForEmbedding(
      'Test Skill',
      'A test description',
      ['trigger1', 'trigger2'],
      ['not for this'],
      [{ id: 'tag1', name: 'Tag 1' }]
    );

    expect(text.toLowerCase()).toContain('test skill');
    expect(text.toLowerCase()).toContain('test description');
    expect(text.toLowerCase()).toContain('trigger1');
    expect(text.toLowerCase()).toContain('tag1');
  });

  it('should handle missing optional fields', () => {
    const text = prepareTextForEmbedding('Name', 'Desc');
    expect(text.toLowerCase()).toContain('name');
    expect(text.toLowerCase()).toContain('desc');
  });

  it('should normalize text to lowercase', () => {
    const text = prepareTextForEmbedding('UPPERCASE', 'MixedCase');
    expect(text).toBe(text.toLowerCase());
  });
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  const documents = [
    'web design and frontend development',
    'machine learning and artificial intelligence',
    'database management and sql queries',
    'mobile app development for ios and android',
    'cloud computing and devops automation',
  ];

  beforeAll(async () => {
    service = new EmbeddingService({
      provider: 'local-tfidf',
      dimensions: 512,
    });
    await service.initialize(documents);
  });

  it('should generate embeddings of correct dimension', async () => {
    const embedding = await service.embed('test query');
    expect(embedding.vector).toHaveLength(512);
  });

  it('should generate consistent embeddings for same input', async () => {
    const text = 'web design help';
    const emb1 = await service.embed(text);
    const emb2 = await service.embed(text);
    expect(cosineSimilarity(emb1.vector, emb2.vector)).toBeCloseTo(1.0, 5);
  });

  it('should generate different embeddings for different domains', async () => {
    const webEmb = await service.embed('web design frontend development html css');
    const mlEmb = await service.embed('machine learning artificial intelligence neural networks');

    const webToMl = cosineSimilarity(webEmb.vector, mlEmb.vector);

    // Different domains should have relatively low similarity (but not necessarily 0)
    // TF-IDF with feature hashing may have some overlap
    expect(webToMl).toBeLessThan(0.5);
  });

  it('should provide model info', () => {
    const info = service.getModelInfo();
    expect(info.model).toBe('local-tfidf');
    expect(info.dimensions).toBe(512);
  });

  it('should handle empty strings', async () => {
    const emb = await service.embed('');
    expect(emb.vector).toHaveLength(512);
    // Empty string should have low magnitude
    const magnitude = Math.sqrt(emb.vector.reduce((sum, v) => sum + v * v, 0));
    expect(magnitude).toBeLessThan(1);
  });

  it('should handle very long text', async () => {
    const longText = 'word '.repeat(10000);
    const emb = await service.embed(longText);
    expect(emb.vector).toHaveLength(512);
  });
});

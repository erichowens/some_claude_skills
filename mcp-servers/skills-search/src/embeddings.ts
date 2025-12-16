/**
 * Embedding Service for Skills Search
 *
 * Handles embedding generation for queries with OpenAI API
 * and fallback to deterministic mock embeddings.
 */

import OpenAI from 'openai';

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

/**
 * Service for generating text embeddings
 */
export class EmbeddingService {
  private openai: OpenAI | null = null;
  private config: EmbeddingConfig;

  constructor(apiKey?: string, config?: Partial<EmbeddingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate embedding for text using OpenAI or fallback to mock
   */
  async embed(text: string): Promise<number[]> {
    if (this.openai) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.config.model,
          input: text,
          dimensions: this.config.dimensions,
        });
        return response.data[0].embedding;
      } catch (error) {
        console.error('[EmbeddingService] OpenAI API error, using mock:', error);
        return this.mockEmbed(text);
      }
    }

    return this.mockEmbed(text);
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (this.openai) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.config.model,
          input: texts,
          dimensions: this.config.dimensions,
        });
        return response.data.map((d) => d.embedding);
      } catch (error) {
        console.error('[EmbeddingService] OpenAI batch error, using mock:', error);
        return texts.map((t) => this.mockEmbed(t));
      }
    }

    return texts.map((t) => this.mockEmbed(t));
  }

  /**
   * Generate deterministic mock embedding from text hash
   * Used for testing and when OpenAI is unavailable
   */
  private mockEmbed(text: string): number[] {
    const embedding: number[] = [];
    let hash = 0;

    // Simple string hash
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }

    const seed = Math.abs(hash);

    // Generate pseudo-random values deterministically
    for (let i = 0; i < this.config.dimensions; i++) {
      const x = Math.sin(seed * (i + 1)) * 10000;
      embedding.push(x - Math.floor(x));
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return magnitude === 0 ? embedding : embedding.map((v) => v / magnitude);
  }

  /**
   * Check if OpenAI is available
   */
  isOpenAIAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Vector Operations
// ============================================================================

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Normalize a vector to unit length
 */
export function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude === 0 ? vector : vector.map((v) => v / magnitude);
}

/**
 * Add two vectors
 */
export function addVectors(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  return a.map((v, i) => v + b[i]);
}

/**
 * Scale a vector by a scalar
 */
export function scaleVector(vector: number[], scalar: number): number[] {
  return vector.map((v) => v * scalar);
}

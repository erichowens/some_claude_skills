/**
 * Embedding Service
 *
 * Provides text embeddings using OpenAI's embedding API.
 * Used for semantic skill matching.
 */

/**
 * Embedding vector (1536-dimensional for text-embedding-3-small)
 */
export type Embedding = number[];

export interface EmbeddingConfig {
  /** OpenAI API key */
  apiKey: string;

  /** Model to use (default: text-embedding-3-small) */
  model?: 'text-embedding-3-small' | 'text-embedding-3-large';

  /** Dimensions (default: 1536 for small, 3072 for large) */
  dimensions?: number;
}

export interface EmbeddingResult {
  embedding: Embedding;
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * EmbeddingService - Generates embeddings using OpenAI API
 */
export class EmbeddingService {
  private config: Required<EmbeddingConfig>;
  private baseUrl = 'https://api.openai.com/v1/embeddings';

  constructor(config: EmbeddingConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'text-embedding-3-small',
      dimensions: config.dimensions || (config.model === 'text-embedding-3-large' ? 3072 : 1536),
    };
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot embed empty text');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: this.config.model,
        dimensions: this.config.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embedding API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      embedding: data.data[0].embedding,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  /**
   * Generate embeddings for multiple texts in a batch
   *
   * More efficient than calling embed() multiple times.
   * OpenAI supports up to 2048 inputs per batch.
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) {
      return [];
    }

    if (texts.length > 2048) {
      throw new Error('OpenAI supports max 2048 texts per batch. Split into multiple batches.');
    }

    // Filter out empty texts but track indices
    const validTexts: Array<{ text: string; index: number }> = [];
    for (let i = 0; i < texts.length; i++) {
      if (texts[i] && texts[i].trim().length > 0) {
        validTexts.push({ text: texts[i], index: i });
      }
    }

    if (validTexts.length === 0) {
      throw new Error('Cannot embed empty texts');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        input: validTexts.map(v => v.text),
        model: this.config.model,
        dimensions: this.config.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embedding API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    // Map embeddings back to original indices
    const results: EmbeddingResult[] = new Array(texts.length);
    for (let i = 0; i < validTexts.length; i++) {
      const originalIndex = validTexts[i].index;
      results[originalIndex] = {
        embedding: data.data[i].embedding,
        model: data.model,
        usage: {
          promptTokens: Math.floor(data.usage.prompt_tokens / validTexts.length),
          totalTokens: Math.floor(data.usage.total_tokens / validTexts.length),
        },
      };
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two embeddings
   *
   * Returns value between -1 and 1, where:
   * - 1 = identical
   * - 0 = orthogonal (unrelated)
   * - -1 = opposite
   */
  static cosineSimilarity(a: Embedding, b: Embedding): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find top-k most similar embeddings
   */
  static findTopKSimilar(
    query: Embedding,
    candidates: Array<{ id: string; embedding: Embedding }>,
    k: number
  ): Array<{ id: string; similarity: number }> {
    const similarities = candidates.map(candidate => ({
      id: candidate.id,
      similarity: EmbeddingService.cosineSimilarity(query, candidate.embedding),
    }));

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, k);
  }
}

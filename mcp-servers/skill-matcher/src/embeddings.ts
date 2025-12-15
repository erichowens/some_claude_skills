/**
 * Embeddings Module
 *
 * Provides semantic embedding capabilities for skill matching.
 * Supports multiple embedding strategies:
 * 1. Local TF-IDF (fast, no external dependencies)
 * 2. OpenAI API (high quality, requires API key)
 * 3. Local transformer models (via onnxruntime-node)
 */

import { createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type EmbeddingProvider = 'local-tfidf' | 'local-minilm' | 'openai' | 'voyage';

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimensions: number;
}

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey?: string;
  modelId?: string;
  dimensions?: number;
}

// ============================================================================
// Local TF-IDF Embeddings (No External Dependencies)
// ============================================================================

class TfIdfEmbedder {
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private dimensions: number;
  private documents: string[][] = [];
  private hashSeed: number;

  constructor(dimensions: number = 384) {
    this.dimensions = dimensions;
    this.hashSeed = 42;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .flatMap(token => {
        // Include bigrams for better semantic capture
        const tokens = [token];
        return tokens;
      });
  }

  private hashToken(token: string): number {
    const hash = createHash('md5').update(token + this.hashSeed).digest();
    return hash.readUInt32LE(0) % this.dimensions;
  }

  buildVocabulary(documents: string[]): void {
    this.documents = documents.map(doc => this.tokenize(doc));
    const docFreq: Map<string, number> = new Map();

    for (const tokens of this.documents) {
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    // Calculate IDF
    const numDocs = this.documents.length;
    for (const [token, freq] of docFreq) {
      this.idf.set(token, Math.log((numDocs + 1) / (freq + 1)) + 1);
    }
  }

  embed(text: string): number[] {
    const tokens = this.tokenize(text);
    const vector = new Array(this.dimensions).fill(0);

    // Count term frequencies
    const tf: Map<string, number> = new Map();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Apply TF-IDF with feature hashing
    for (const [token, freq] of tf) {
      const tfidf = freq * (this.idf.get(token) || 1);
      const idx = this.hashToken(token);
      // Use signed hash for better distribution
      const sign = createHash('md5').update(token).digest()[0] % 2 === 0 ? 1 : -1;
      vector[idx] += sign * tfidf;
    }

    // L2 normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }
}

// ============================================================================
// Cosine Similarity
// ============================================================================

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

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ============================================================================
// Enhanced Text Preparation
// ============================================================================

export function prepareTextForEmbedding(
  name: string,
  description: string,
  triggers: string[],
  notFor: string[],
  tags?: Array<{ id: string; type: string }>
): string {
  const parts = [
    `Skill: ${name}`,
    `Description: ${description}`,
    `Triggers: ${triggers.join(', ')}`,
    `Not for: ${notFor.join(', ')}`,
  ];

  if (tags && tags.length > 0) {
    parts.push(`Tags: ${tags.map(t => t.id).join(', ')}`);
  }

  return parts.join('\n');
}

// ============================================================================
// Embedding Service
// ============================================================================

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private tfidfEmbedder: TfIdfEmbedder | null = null;
  private apiKey?: string;
  private modelId: string;
  private dimensions: number;
  private isInitialized: boolean = false;

  constructor(config: EmbeddingConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.modelId = config.modelId || this.getDefaultModel();
    this.dimensions = config.dimensions || this.getDefaultDimensions();
  }

  private getDefaultModel(): string {
    switch (this.provider) {
      case 'openai':
        return 'text-embedding-3-small';
      case 'voyage':
        return 'voyage-3-lite';
      default:
        return 'local-tfidf';
    }
  }

  private getDefaultDimensions(): number {
    switch (this.provider) {
      case 'openai':
        return 1536;
      case 'voyage':
        return 512;
      default:
        return 384;
    }
  }

  async initialize(documents?: string[]): Promise<void> {
    if (this.provider === 'local-tfidf' || this.provider === 'local-minilm') {
      this.tfidfEmbedder = new TfIdfEmbedder(this.dimensions);
      if (documents && documents.length > 0) {
        this.tfidfEmbedder.buildVocabulary(documents);
      }
    }
    this.isInitialized = true;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    switch (this.provider) {
      case 'local-tfidf':
      case 'local-minilm':
        return this.embedLocal(text);
      case 'openai':
        return this.embedOpenAI(text);
      case 'voyage':
        return this.embedVoyage(text);
      default:
        return this.embedLocal(text);
    }
  }

  private embedLocal(text: string): EmbeddingResult {
    if (!this.tfidfEmbedder) {
      this.tfidfEmbedder = new TfIdfEmbedder(this.dimensions);
    }

    return {
      vector: this.tfidfEmbedder.embed(text),
      model: this.modelId,
      dimensions: this.dimensions,
    };
  }

  private async embedOpenAI(text: string): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      console.warn('OpenAI API key not set, falling back to local embeddings');
      return this.embedLocal(text);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          input: text,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        vector: data.data[0].embedding,
        model: this.modelId,
        dimensions: data.data[0].embedding.length,
      };
    } catch (error) {
      console.error('OpenAI embedding failed, falling back to local:', error);
      return this.embedLocal(text);
    }
  }

  private async embedVoyage(text: string): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      console.warn('Voyage API key not set, falling back to local embeddings');
      return this.embedLocal(text);
    }

    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voyage API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        vector: data.data[0].embedding,
        model: this.modelId,
        dimensions: data.data[0].embedding.length,
      };
    } catch (error) {
      console.error('Voyage embedding failed, falling back to local:', error);
      return this.embedLocal(text);
    }
  }

  getModelInfo(): { model: string; dimensions: number } {
    return {
      model: this.modelId,
      dimensions: this.dimensions,
    };
  }
}

// ============================================================================
// Keyword Matching (Fallback / Hybrid)
// ============================================================================

export function keywordMatch(query: string, triggers: string[], notFor: string[]): number {
  const queryLower = query.toLowerCase();
  const queryTokens = new Set(
    queryLower
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
  );

  // Check negative matches first
  for (const neg of notFor) {
    if (queryLower.includes(neg.toLowerCase())) {
      return -0.5; // Strong negative signal
    }
  }

  // Score positive triggers
  let matchCount = 0;
  for (const trigger of triggers) {
    const triggerLower = trigger.toLowerCase();
    if (queryLower.includes(triggerLower)) {
      matchCount += 2; // Exact phrase match
    } else {
      // Check token overlap
      const triggerTokens = triggerLower.split(/\s+/);
      for (const tt of triggerTokens) {
        if (queryTokens.has(tt)) {
          matchCount += 1;
        }
      }
    }
  }

  // Normalize to 0-1 range
  const maxPossible = triggers.length * 2;
  return maxPossible > 0 ? Math.min(matchCount / maxPossible, 1) : 0;
}

// ============================================================================
// Hybrid Scoring
// ============================================================================

export function hybridScore(
  semanticScore: number,
  keywordScore: number,
  semanticWeight: number = 0.7
): number {
  // If keyword match is negative (anti-pattern), penalize heavily
  if (keywordScore < 0) {
    return Math.max(0, semanticScore + keywordScore);
  }

  return semanticWeight * semanticScore + (1 - semanticWeight) * keywordScore;
}

/**
 * Vector Store for Skills Search
 *
 * Loads pre-computed embeddings from JSON and provides
 * efficient similarity search over skill chunks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { cosineSimilarity } from './embeddings.js';
import type {
  EmbeddingStore,
  SkillChunk,
  SkillMetadata,
  SearchResult,
  SearchOptions,
  SectionType,
} from './types.js';

const DEFAULT_STORE_PATH = path.join(
  process.cwd(),
  '.claude',
  'data',
  'embeddings',
  'skill-embeddings.json'
);

/**
 * In-memory vector store for skill embeddings
 */
export class VectorStore {
  private store: EmbeddingStore | null = null;
  private storePath: string;
  private chunkIndex: Map<string, SkillChunk> = new Map();
  private skillIndex: Map<string, SkillMetadata> = new Map();

  constructor(storePath?: string) {
    this.storePath = storePath || DEFAULT_STORE_PATH;
  }

  /**
   * Load embedding store from disk
   */
  async load(): Promise<void> {
    // Try multiple possible paths
    const possiblePaths = [
      this.storePath,
      path.join(process.cwd(), '..', '..', '.claude', 'data', 'embeddings', 'skill-embeddings.json'),
      path.join(process.env.HOME || '', 'coding', 'some_claude_skills', '.claude', 'data', 'embeddings', 'skill-embeddings.json'),
    ];

    let loadedPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        loadedPath = p;
        break;
      }
    }

    if (!loadedPath) {
      throw new Error(
        `Embedding store not found. Tried:\n${possiblePaths.join('\n')}\n\n` +
        'Run the embedding generator first:\n' +
        '  npx ts-node .claude/rag/scripts/generate-embeddings.ts'
      );
    }

    const content = fs.readFileSync(loadedPath, 'utf-8');
    this.store = JSON.parse(content) as EmbeddingStore;

    // Build indices
    this.buildIndices();

    console.error(
      `[VectorStore] Loaded ${this.store.metadata.skillCount} skills ` +
      `with ${this.store.metadata.chunkCount} chunks from ${loadedPath}`
    );
  }

  /**
   * Build lookup indices for fast access
   */
  private buildIndices(): void {
    if (!this.store) return;

    // Index chunks by ID
    this.chunkIndex.clear();
    for (const chunk of this.store.chunks) {
      this.chunkIndex.set(chunk.id, chunk);
    }

    // Index skills by ID
    this.skillIndex.clear();
    for (const [skillId, metadata] of Object.entries(this.store.skills)) {
      this.skillIndex.set(skillId, metadata as SkillMetadata);
    }
  }

  /**
   * Search for similar chunks using vector similarity
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.store) {
      throw new Error('Store not loaded. Call load() first.');
    }

    const {
      topK = 5,
      minSimilarity = 0.3,
      sectionTypes,
      groupBySkill = false,
      includeContent = true,
    } = options;

    const results: SearchResult[] = [];

    // Calculate similarity for all chunks
    for (const chunk of this.store.chunks) {
      // Skip chunks without embeddings
      if (!chunk.embedding || chunk.embedding.length === 0) {
        continue;
      }

      // Filter by section type if specified
      if (sectionTypes && sectionTypes.length > 0) {
        if (!sectionTypes.includes(chunk.sectionType)) {
          continue;
        }
      }

      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

      if (similarity >= minSimilarity) {
        const skillMeta = this.skillIndex.get(chunk.skillId);

        results.push({
          skillId: chunk.skillId,
          skillName: skillMeta?.name || chunk.skillId,
          description: skillMeta?.description,
          sectionType: chunk.sectionType,
          content: includeContent ? chunk.content : '',
          similarity,
          rank: 0,
          metadata: skillMeta,
        });
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    // Assign ranks
    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    // Group by skill if requested (one result per skill)
    if (groupBySkill) {
      return this.groupResultsBySkill(results, topK);
    }

    return results.slice(0, topK);
  }

  /**
   * Group results by skill, keeping the best match per skill
   */
  private groupResultsBySkill(results: SearchResult[], limit: number): SearchResult[] {
    const grouped = new Map<string, SearchResult>();

    for (const result of results) {
      if (!grouped.has(result.skillId)) {
        grouped.set(result.skillId, result);
        if (grouped.size >= limit) break;
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Get a skill by ID
   */
  getSkill(skillId: string): SkillMetadata | null {
    return this.skillIndex.get(skillId) || null;
  }

  /**
   * Get all chunks for a skill
   */
  getSkillChunks(skillId: string, sectionTypes?: SectionType[]): SkillChunk[] {
    if (!this.store) return [];

    let chunks = this.store.chunks.filter((c) => c.skillId === skillId);

    if (sectionTypes && sectionTypes.length > 0) {
      chunks = chunks.filter((c) => sectionTypes.includes(c.sectionType));
    }

    return chunks;
  }

  /**
   * Get full content for a skill (all chunks combined)
   */
  getSkillContent(skillId: string, sectionTypes?: SectionType[]): string {
    const chunks = this.getSkillChunks(skillId, sectionTypes);
    return chunks.map((c) => c.content).join('\n\n');
  }

  /**
   * List all skills with optional filtering
   */
  listSkills(filters?: {
    category?: string;
    complexity?: string;
    hasMcp?: boolean;
  }): SkillMetadata[] {
    const skills = Array.from(this.skillIndex.values());

    if (!filters) return skills;

    return skills.filter((skill) => {
      if (filters.category && skill.category !== filters.category) {
        return false;
      }
      if (filters.complexity && skill.complexity !== filters.complexity) {
        return false;
      }
      if (filters.hasMcp !== undefined) {
        const hasMcp = (skill.mcpIntegrations?.length || 0) > 0;
        if (filters.hasMcp !== hasMcp) return false;
      }
      return true;
    });
  }

  /**
   * Get store statistics
   */
  getStats(): {
    totalSkills: number;
    totalChunks: number;
    embeddingModel: string;
    dimensions: number;
    generatedAt: string;
  } | null {
    if (!this.store) return null;

    return {
      totalSkills: this.store.metadata.skillCount,
      totalChunks: this.store.metadata.chunkCount,
      embeddingModel: this.store.metadata.embeddingModel,
      dimensions: this.store.metadata.dimensions,
      generatedAt: this.store.metadata.generatedAt,
    };
  }

  /**
   * Check if store is loaded
   */
  isLoaded(): boolean {
    return this.store !== null;
  }

  /**
   * Get all unique section types
   */
  getSectionTypes(): SectionType[] {
    if (!this.store) return [];

    const types = new Set<SectionType>();
    for (const chunk of this.store.chunks) {
      types.add(chunk.sectionType);
    }
    return Array.from(types);
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const skill of this.skillIndex.values()) {
      if (skill.category) {
        categories.add(skill.category);
      }
    }
    return Array.from(categories);
  }
}

/**
 * Type definitions for Skills Search MCP Server
 */

// ============================================================================
// Skill Types
// ============================================================================

export interface SkillFrontmatter {
  name: string;
  description: string;
  allowedTools?: string;
  category?: string;
  tags?: string[];
  complexity?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillChunk {
  id: string;
  skillId: string;
  sectionType: SectionType;
  content: string;
  tokenCount: number;
  embedding?: number[];
}

export type SectionType =
  | 'frontmatter'
  | 'overview'
  | 'when-to-use'
  | 'quick-start'
  | 'anti-patterns'
  | 'references'
  | 'code-example'
  | 'mcp-integration'
  | 'workflow'
  | 'quality-checklist';

export interface SkillMetadata {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  triggers?: string[];
  notFor?: string[];
  tools?: string[];
  mcpIntegrations?: string[];
  complexity?: string;
  filePath?: string;
}

// ============================================================================
// Embedding Store Types
// ============================================================================

export interface EmbeddingStore {
  metadata: {
    generatedAt: string;
    skillCount: number;
    chunkCount: number;
    embeddingModel: string;
    dimensions: number;
  };
  skills: Record<string, SkillMetadata>;
  chunks: SkillChunk[];
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  skillId: string;
  skillName: string;
  description?: string;
  sectionType: SectionType;
  content: string;
  similarity: number;
  rank: number;
  metadata?: SkillMetadata;
}

export interface SearchOptions {
  topK?: number;
  minSimilarity?: number;
  sectionTypes?: SectionType[];
  groupBySkill?: boolean;
  includeContent?: boolean;
}

// ============================================================================
// Tool Argument Types
// ============================================================================

export interface SearchSkillsArgs {
  query: string;
  top_k?: number;
  min_similarity?: number;
  section_types?: SectionType[];
  group_by_skill?: boolean;
}

export interface GetSkillArgs {
  skill_id: string;
  sections?: SectionType[];
}

export interface ListSkillsArgs {
  category?: string;
  complexity?: string;
  has_mcp?: boolean;
}

export interface RecommendSkillArgs {
  task_description: string;
  current_context?: string;
  exclude_skills?: string[];
}

export interface CompareSkillsArgs {
  skill_ids: string[];
  aspects?: ('capabilities' | 'triggers' | 'anti-patterns' | 'tools')[];
}

// ============================================================================
// Response Types
// ============================================================================

export interface SkillRecommendation {
  skillId: string;
  skillName: string;
  description: string;
  relevanceScore: number;
  reasoningContext: string;
  suggestedUsage: string;
}

export interface SkillComparison {
  skills: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  aspects: Record<string, Record<string, string>>;
  summary: string;
}

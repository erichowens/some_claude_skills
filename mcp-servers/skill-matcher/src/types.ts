/**
 * Skill Matcher Types
 * Defines the core data structures for skill matching and indexing
 */

// ============================================================================
// Skill Catalog Types
// ============================================================================

export type SkillType = 'skill' | 'agent' | 'mcp' | 'subagent';

export type SkillCategory =
  | 'orchestration-meta'
  | 'visual-design-ui'
  | 'graphics-3d-simulation'
  | 'audio-sound-design'
  | 'computer-vision-image-ai'
  | 'autonomous-systems-robotics'
  | 'conversational-ai-bots'
  | 'research-strategy'
  | 'coaching-personal-development'
  | 'devops-site-reliability'
  | 'business-monetization'
  | 'documentation-visualization';

export type TagType = 'skill-type' | 'domain' | 'output' | 'complexity' | 'integration';

export type SkillSource = 'local' | 'someclaudeskills' | 'mcp-registry' | 'github' | 'custom';

export interface SkillTag {
  id: string;
  type: TagType;
}

export interface SkillActivation {
  triggers: string[];
  notFor: string[];
  requiredContext?: string[];
}

export interface SkillCapabilities {
  tools?: string[];
  outputs?: string[];
  integrations?: string[];
}

export interface SkillMetadata {
  version?: string;
  author?: string;
  source: SkillSource;
  sourceUrl?: string;
  license?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillEmbedding {
  model: string;
  dimensions: number;
  vector: number[];
  generatedAt: string;
}

export interface SkillExample {
  prompt: string;
  expectedMatch: boolean;
}

export interface SkillCatalogEntry {
  id: string;
  type: SkillType;
  name: string;
  description: string;
  activation: SkillActivation;
  category?: SkillCategory;
  tags?: SkillTag[];
  capabilities?: SkillCapabilities;
  metadata?: SkillMetadata;
  embedding?: SkillEmbedding;
  examples?: SkillExample[];
}

// ============================================================================
// Match Result Types
// ============================================================================

export interface MatchResult {
  skill: SkillCatalogEntry;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
  reasoning: string;
}

export interface MatchResponse {
  query: string;
  matches: MatchResult[];
  gapAnalysis?: GapAnalysis;
  externalSuggestions?: ExternalSuggestion[];
  processingTime: number;
}

// ============================================================================
// Gap Analysis Types
// ============================================================================

export interface GapAnalysis {
  identified: boolean;
  opportunity: {
    name: string;
    description: string;
    category: SkillCategory;
    suggestedTriggers: string[];
  };
  research: {
    topics: string[];
    resources: string[];
    existingTools: string[];
  };
  successCriteria: {
    metrics: string[];
    testCases: string[];
    validation: string;
  };
  relatedSkills: string[];
}

// ============================================================================
// External Database Types
// ============================================================================

export type ExternalSource =
  | 'mcp-registry'      // Official MCP registry
  | 'awesome-mcp'       // awesome-mcp GitHub list
  | 'smithery'          // smithery.ai
  | 'glama'             // glama.ai
  | 'github-topics';    // GitHub topic search

export interface ExternalSuggestion {
  source: ExternalSource;
  type: SkillType;
  name: string;
  description: string;
  url: string;
  relevanceScore: number;
  installCommand?: string;
}

export interface ExternalQueryOptions {
  sources: ExternalSource[];
  maxResults: number;
  minRelevance: number;
}

// ============================================================================
// Index Types
// ============================================================================

export interface SkillIndex {
  version: string;
  model: string;
  dimensions: number;
  skills: SkillCatalogEntry[];
  buildTime: string;
  checksum: string;
}

// ============================================================================
// Server Configuration
// ============================================================================

export interface SkillMatcherConfig {
  skillsDir: string;
  agentsDir: string;
  indexPath: string;
  embeddingModel: string;
  embeddingDimensions: number;
  matchThreshold: number;
  maxResults: number;
  enableExternalSearch: boolean;
  externalSources: ExternalSource[];
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

export const DEFAULT_CONFIG: SkillMatcherConfig = {
  skillsDir: '.claude/skills',
  agentsDir: '.claude/agents',
  indexPath: 'mcp-servers/skill-matcher/data/skill-index.json',
  embeddingModel: 'local-minilm',
  embeddingDimensions: 384,
  matchThreshold: 0.4,
  maxResults: 5,
  enableExternalSearch: false,
  externalSources: ['mcp-registry', 'smithery'],
  cacheEnabled: true,
  cacheTtlMs: 300000, // 5 minutes
};

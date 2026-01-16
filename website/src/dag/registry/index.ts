/**
 * Registry & Discovery Layer
 *
 * Provides skill catalog, semantic matching, and capability ranking
 * for the DAG framework's dynamic skill selection.
 *
 * @module dag/registry
 */

// Skill Registry - Central catalog
export {
  SkillRegistry,
  skillRegistry,
  initializeRegistry,
  getSkill,
  searchSkills,
  querySkills,
  type SkillRegistryEntry,
  type SkillCapabilities,
  type SkillMetrics,
  type RegistryQueryOptions,
  type RegistryStats,
} from './skill-registry';

// Semantic Matcher - NL to skill matching
export {
  SemanticMatcher,
  semanticMatcher,
  matchSkills,
  matchBestSkill,
  parseQueryIntent,
  type MatchResult,
  type MatchOptions,
  type QueryIntent,
  type TaskType,
  type ScoreBreakdown,
} from './semantic-matcher';

// Capability Ranker - Multi-factor ranking
export {
  CapabilityRanker,
  capabilityRanker,
  rankSkills,
  compareSkills,
  getComplementarySkills,
  type RankingCriteria,
  type RequiredCapabilities,
  type RankedResult,
  type RankingBreakdown,
  type CapabilityMatch,
  type ComparisonResult,
} from './capability-ranker';

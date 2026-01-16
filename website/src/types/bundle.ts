/**
 * Bundle Type Definitions
 *
 * Bundles are curated collections of skills designed for specific
 * workflows or user personas.
 *
 * @module types/bundle
 */

/**
 * A skill included in a bundle
 */
export interface BundleSkill {
  /** Skill identifier (matches skills.ts) */
  id: string;

  /** How this skill is used in the bundle workflow */
  role: string;

  /** Whether this skill is optional */
  optional?: boolean;
}

/**
 * Estimated cost for running the bundle
 */
export interface BundleCost {
  /** Estimated tokens for a typical run */
  tokens: number;

  /** Estimated USD cost (at current Claude pricing) */
  usd: number;
}

/**
 * Target audience for the bundle
 */
export type BundleAudience =
  | 'developers'
  | 'entrepreneurs'
  | 'teams'
  | 'technical-writers'
  | 'ml-engineers'
  | 'newcomers'
  | 'everyone';

/**
 * Bundle difficulty level
 */
export type BundleDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * A curated skill bundle
 */
export interface Bundle {
  /** URL-safe identifier */
  id: string;

  /** Display name */
  title: string;

  /** Short description (1-2 sentences) */
  description: string;

  /** Target audience */
  audience: BundleAudience;

  /** Difficulty level */
  difficulty: BundleDifficulty;

  /** Skills included in the bundle */
  skills: BundleSkill[];

  /** Command to install the bundle */
  installCommand: string;

  /** Estimated cost per run */
  estimatedCost: BundleCost;

  /** Example use cases */
  useCases: string[];

  /** Tags for filtering */
  tags: string[];

  /** Hero image path (optional) */
  heroImage?: string;

  /** Featured on homepage */
  featured?: boolean;

  /** Recommended related bundles */
  relatedBundles?: string[];
}

/**
 * Bundle YAML schema (matches YAML file format)
 */
export interface BundleYAML {
  name: string;
  title: string;
  description: string;
  audience: BundleAudience;
  difficulty: BundleDifficulty;
  skills: Array<{
    id: string;
    role: string;
    optional?: boolean;
  }>;
  install_command: string;
  estimated_cost: {
    tokens: number;
    usd: number;
  };
  use_cases: string[];
  tags: string[];
  hero_image?: string;
  featured?: boolean;
  related_bundles?: string[];
}

/**
 * Convert YAML bundle to TypeScript Bundle
 */
export function yamlToBundle(yaml: BundleYAML): Bundle {
  return {
    id: yaml.name,
    title: yaml.title,
    description: yaml.description,
    audience: yaml.audience,
    difficulty: yaml.difficulty,
    skills: yaml.skills.map((s) => ({
      id: s.id,
      role: s.role,
      optional: s.optional,
    })),
    installCommand: yaml.install_command,
    estimatedCost: {
      tokens: yaml.estimated_cost.tokens,
      usd: yaml.estimated_cost.usd,
    },
    useCases: yaml.use_cases,
    tags: yaml.tags,
    heroImage: yaml.hero_image,
    featured: yaml.featured,
    relatedBundles: yaml.related_bundles,
  };
}

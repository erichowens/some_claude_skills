#!/usr/bin/env npx tsx
/**
 * Bundle Generation Script
 *
 * Generates bundles.ts from YAML bundle definitions.
 *
 * Usage:
 *   npx tsx scripts/generate-bundles.ts [options]
 *
 * Options:
 *   --validate-only    Validate without generating files
 *   --verbose          Show detailed output
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import type { Bundle, BundleYAML, BundleAudience, BundleDifficulty } from '../src/types/bundle';

// =============================================================================
// CONFIGURATION
// =============================================================================

const BUNDLES_DIR = path.resolve(__dirname, '../bundles');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/bundles.ts');

// =============================================================================
// VALIDATION
// =============================================================================

interface ValidationError {
  file: string;
  message: string;
  field?: string;
}

const VALID_AUDIENCES: BundleAudience[] = [
  'developers',
  'entrepreneurs',
  'teams',
  'technical-writers',
  'ml-engineers',
  'newcomers',
  'everyone',
];

const VALID_DIFFICULTIES: BundleDifficulty[] = ['beginner', 'intermediate', 'advanced'];

function validateBundle(yaml: BundleYAML, filename: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!yaml.name) errors.push({ file: filename, message: 'Missing required field: name' });
  if (!yaml.title) errors.push({ file: filename, message: 'Missing required field: title' });
  if (!yaml.description) errors.push({ file: filename, message: 'Missing required field: description' });
  if (!yaml.skills || yaml.skills.length === 0) {
    errors.push({ file: filename, message: 'Bundle must have at least one skill' });
  }
  if (!yaml.install_command) errors.push({ file: filename, message: 'Missing required field: install_command' });

  // Audience validation
  if (!yaml.audience || !VALID_AUDIENCES.includes(yaml.audience)) {
    errors.push({
      file: filename,
      message: `Invalid audience: ${yaml.audience}. Must be one of: ${VALID_AUDIENCES.join(', ')}`,
      field: 'audience',
    });
  }

  // Difficulty validation
  if (!yaml.difficulty || !VALID_DIFFICULTIES.includes(yaml.difficulty)) {
    errors.push({
      file: filename,
      message: `Invalid difficulty: ${yaml.difficulty}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      field: 'difficulty',
    });
  }

  // Estimated cost validation
  if (!yaml.estimated_cost) {
    errors.push({ file: filename, message: 'Missing required field: estimated_cost' });
  } else {
    if (typeof yaml.estimated_cost.tokens !== 'number' || yaml.estimated_cost.tokens < 0) {
      errors.push({ file: filename, message: 'estimated_cost.tokens must be a non-negative number' });
    }
    if (typeof yaml.estimated_cost.usd !== 'number' || yaml.estimated_cost.usd < 0) {
      errors.push({ file: filename, message: 'estimated_cost.usd must be a non-negative number' });
    }
  }

  // Skills validation
  if (yaml.skills) {
    for (const skill of yaml.skills) {
      if (!skill.id) {
        errors.push({ file: filename, message: 'Each skill must have an id' });
      }
      if (!skill.role) {
        errors.push({ file: filename, message: `Skill "${skill.id}" must have a role description` });
      }
    }
  }

  return errors;
}

// =============================================================================
// YAML TO BUNDLE CONVERSION
// =============================================================================

function yamlToBundle(yaml: BundleYAML): Bundle {
  return {
    id: yaml.name,
    title: yaml.title,
    description: yaml.description.trim(),
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
    useCases: yaml.use_cases || [],
    tags: yaml.tags || [],
    heroImage: yaml.hero_image,
    featured: yaml.featured,
    relatedBundles: yaml.related_bundles,
  };
}

// =============================================================================
// CODE GENERATION
// =============================================================================

function generateBundlesTs(bundles: Bundle[]): string {
  const bundlesJson = JSON.stringify(bundles, null, 2);

  return `/**
 * Generated Bundle Data
 *
 * Auto-generated from YAML files in /bundles
 * DO NOT EDIT DIRECTLY - run 'npm run generate:bundles' instead
 *
 * Generated: ${new Date().toISOString()}
 */

import type { Bundle } from '../types/bundle';

export const bundles: Bundle[] = ${bundlesJson};

export function getBundleById(id: string): Bundle | undefined {
  return bundles.find((b) => b.id === id);
}

export function getFeaturedBundles(): Bundle[] {
  return bundles.filter((b) => b.featured);
}

export function getBundlesByAudience(audience: string): Bundle[] {
  return bundles.filter((b) => b.audience === audience);
}

export function getBundlesByDifficulty(difficulty: string): Bundle[] {
  return bundles.filter((b) => b.difficulty === difficulty);
}

export function getBundlesByTag(tag: string): Bundle[] {
  return bundles.filter((b) => b.tags.includes(tag));
}

export function searchBundles(query: string): Bundle[] {
  const lowerQuery = query.toLowerCase();
  return bundles.filter(
    (b) =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.description.toLowerCase().includes(lowerQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}
`;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const validateOnly = args.includes('--validate-only');
  const verbose = args.includes('--verbose');

  console.log('🔄 Generating bundles...\n');

  // Check if bundles directory exists
  if (!fs.existsSync(BUNDLES_DIR)) {
    console.error(`❌ Bundles directory not found: ${BUNDLES_DIR}`);
    process.exit(1);
  }

  // Read all YAML files
  const files = fs.readdirSync(BUNDLES_DIR).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  console.log(`📂 Found ${files.length} bundle files in ${BUNDLES_DIR}\n`);

  if (files.length === 0) {
    console.error('❌ No YAML files found in bundles directory');
    process.exit(1);
  }

  // Parse and validate bundles
  const bundles: Bundle[] = [];
  const allErrors: ValidationError[] = [];

  for (const file of files) {
    const filePath = path.join(BUNDLES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const yaml = YAML.parse(content) as BundleYAML;
      const errors = validateBundle(yaml, file);

      if (errors.length > 0) {
        allErrors.push(...errors);
        if (verbose) {
          console.log(`   ✗ ${file} (${errors.length} errors)`);
        }
      } else {
        bundles.push(yamlToBundle(yaml));
        if (verbose) {
          console.log(`   ✓ ${file}`);
        }
      }
    } catch (err) {
      allErrors.push({
        file,
        message: `Failed to parse YAML: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Report validation results
  console.log(`\n✅ Validated: ${bundles.length}/${files.length} bundles\n`);

  if (allErrors.length > 0) {
    console.log('❌ Validation errors:\n');
    for (const error of allErrors) {
      console.log(`   [${error.file}] ${error.message}`);
    }
    console.log('');
    process.exit(1);
  }

  // Stop if validate-only
  if (validateOnly) {
    console.log('🔍 Validation only mode - no files generated\n');
    process.exit(0);
  }

  // Generate bundles.ts
  console.log('📝 Generating bundles.ts...');
  const output = generateBundlesTs(bundles);
  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`   Written to ${OUTPUT_FILE}\n`);

  // Print summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                     GENERATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📦 Bundles by Audience:\n');
  const byAudience = new Map<string, number>();
  for (const bundle of bundles) {
    byAudience.set(bundle.audience, (byAudience.get(bundle.audience) || 0) + 1);
  }
  for (const [audience, count] of [...byAudience.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${audience}: ${count}`);
  }

  console.log('\n📊 Bundles by Difficulty:\n');
  const byDifficulty = new Map<string, number>();
  for (const bundle of bundles) {
    byDifficulty.set(bundle.difficulty, (byDifficulty.get(bundle.difficulty) || 0) + 1);
  }
  for (const [difficulty, count] of [...byDifficulty.entries()]) {
    console.log(`   ${difficulty}: ${count}`);
  }

  const featuredCount = bundles.filter((b) => b.featured).length;
  console.log(`\n⭐ Featured bundles: ${featuredCount}`);
  console.log(`📦 Total bundles: ${bundles.length}\n`);

  console.log('✅ Generation completed successfully!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

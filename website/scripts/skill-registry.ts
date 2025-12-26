#!/usr/bin/env npx tsx
/**
 * Skill Registry CLI
 *
 * Manage remote skill imports and registry operations.
 *
 * Usage:
 *   npx tsx scripts/skill-registry.ts search <query>       # Search registry
 *   npx tsx scripts/skill-registry.ts import <url>         # Import from URL/GitHub
 *   npx tsx scripts/skill-registry.ts validate <url>       # Validate remote skill
 *   npx tsx scripts/skill-registry.ts publish              # Generate registry.json
 *   npx tsx scripts/skill-registry.ts list-remote          # List all registry skills
 */

import * as path from 'path';
import {
  fetchRegistry,
  searchRegistry,
  importFromGitHub,
  importFromUrl,
  validateRemoteSkill,
  parseGitHubUrl,
  writeRegistryManifest,
  RemoteSkill,
} from './lib/remote-registry';
import { parseAllSkills } from './lib/skill-parser';

// =============================================================================
// COMMANDS
// =============================================================================

async function searchCommand(query: string): Promise<void> {
  console.log(`🔍 Searching registry for: "${query}"...\n`);

  const results = await searchRegistry(query);

  if (results.length === 0) {
    console.log('No skills found matching your query.');
    return;
  }

  console.log(`Found ${results.length} skill(s):\n`);

  for (const skill of results) {
    console.log(`📦 ${skill.title} (${skill.id})`);
    console.log(`   Category: ${skill.category}`);
    console.log(`   Tags: ${skill.tags.join(', ')}`);
    console.log(`   Description: ${skill.description.substring(0, 80)}...`);
    if (skill.source.repo) {
      console.log(`   Source: github.com/${skill.source.repo}`);
    }
    console.log('');
  }
}

async function importCommand(url: string): Promise<void> {
  console.log(`📥 Importing skill from: ${url}\n`);

  // Determine source type
  const githubParsed = parseGitHubUrl(url);

  let result;
  if (githubParsed) {
    console.log(`Detected GitHub URL:`);
    console.log(`   Repo: ${githubParsed.repo}`);
    console.log(`   Path: ${githubParsed.path}`);
    console.log(`   Branch: ${githubParsed.branch}`);
    console.log('');

    result = await importFromGitHub(
      githubParsed.repo,
      githubParsed.path,
      githubParsed.branch
    );
  } else {
    result = await importFromUrl(url);
  }

  if (result.success) {
    console.log(`✅ Successfully imported: ${result.skillId}`);
    console.log(`   Path: ${result.path}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Run: npm run skills:generate`);
    console.log(`   2. Review the imported skill`);
    console.log(`   3. Commit your changes`);
  } else {
    console.log(`❌ Import failed: ${result.error}`);
  }
}

async function validateCommand(url: string): Promise<void> {
  console.log(`🔍 Validating skill at: ${url}\n`);

  const githubParsed = parseGitHubUrl(url);

  const source = githubParsed
    ? {
        type: 'github' as const,
        repo: githubParsed.repo,
        path: githubParsed.path,
        branch: githubParsed.branch,
      }
    : {
        type: 'url' as const,
        url,
      };

  const result = await validateRemoteSkill(source);

  if (result.valid && result.skill) {
    console.log(`✅ Valid skill found!\n`);
    console.log(`   ID: ${result.skill.id}`);
    console.log(`   Title: ${result.skill.title}`);
    console.log(`   Category: ${result.skill.category}`);
    console.log(`   Tags: ${result.skill.tags.join(', ')}`);
    console.log(`   Tools: ${result.skill.allowedTools.join(', ')}`);
    console.log(`\nDescription:`);
    console.log(`   ${result.skill.shortDescription}`);
  } else {
    console.log(`❌ Validation failed: ${result.error}`);
  }
}

async function publishCommand(): Promise<void> {
  console.log(`📤 Generating registry manifest...\n`);

  const skillsDir = path.join(process.cwd(), '..', '.claude', 'skills');
  const skills = parseAllSkills(skillsDir);

  const outputPath = path.join(process.cwd(), '..', 'registry.json');
  writeRegistryManifest(skills, outputPath);

  console.log(`✅ Registry manifest written to: ${outputPath}`);
  console.log(`   Skills included: ${skills.length}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Commit registry.json`);
  console.log(`   2. Push to GitHub`);
  console.log(`   3. Your skills are now discoverable!`);
}

async function listRemoteCommand(): Promise<void> {
  console.log(`📋 Fetching skill registry...\n`);

  const registry = await fetchRegistry();

  if (!registry) {
    console.log('Could not fetch registry. It may not exist yet.');
    console.log('Run "npm run registry:publish" to create one.');
    return;
  }

  console.log(`Registry version: ${registry.version}`);
  console.log(`Last updated: ${new Date(registry.lastUpdated).toLocaleDateString()}`);
  console.log(`Total skills: ${registry.skills.length}\n`);

  // Group by category
  const byCategory: Record<string, RemoteSkill[]> = {};
  for (const skill of registry.skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = [];
    }
    byCategory[skill.category].push(skill);
  }

  for (const [category, skills] of Object.entries(byCategory)) {
    console.log(`\n📁 ${category} (${skills.length})`);
    for (const skill of skills) {
      console.log(`   • ${skill.title} (${skill.id})`);
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const [command, arg] = process.argv.slice(2);

  switch (command) {
    case 'search':
      if (!arg) {
        console.error('Usage: skill-registry.ts search <query>');
        process.exit(1);
      }
      await searchCommand(arg);
      break;

    case 'import':
      if (!arg) {
        console.error('Usage: skill-registry.ts import <url>');
        process.exit(1);
      }
      await importCommand(arg);
      break;

    case 'validate':
      if (!arg) {
        console.error('Usage: skill-registry.ts validate <url>');
        process.exit(1);
      }
      await validateCommand(arg);
      break;

    case 'publish':
      await publishCommand();
      break;

    case 'list-remote':
      await listRemoteCommand();
      break;

    default:
      console.log(`
Skill Registry CLI

Usage:
  npx tsx scripts/skill-registry.ts <command> [options]

Commands:
  search <query>      Search the skill registry
  import <url>        Import a skill from GitHub URL or raw URL
  validate <url>      Validate a remote skill without importing
  publish             Generate registry.json from local skills
  list-remote         List all skills in the remote registry

Examples:
  # Search for ML skills
  npx tsx scripts/skill-registry.ts search "machine learning"

  # Import from GitHub
  npx tsx scripts/skill-registry.ts import https://github.com/user/repo/blob/main/.claude/skills/my-skill/SKILL.md

  # Import from raw URL
  npx tsx scripts/skill-registry.ts import https://raw.githubusercontent.com/user/repo/main/.claude/skills/my-skill/SKILL.md

  # Validate before importing
  npx tsx scripts/skill-registry.ts validate https://github.com/user/repo/blob/main/.claude/skills/my-skill/SKILL.md

  # Publish your skills
  npx tsx scripts/skill-registry.ts publish
`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * validate-tags.js
 * Validates that all skills have required tags from the taxonomy
 */
const fs = require('fs');
const path = require('path');

// Valid tags from tags.ts (kept in sync manually)
// Run: grep "id: '" website/src/types/tags.ts | sed "s/.*id: '\([^']*\)'.*/'\1',/" | sort
const VALID_TAGS = new Set([
  // Skill Type (what it does) - purple
  'research', 'creation', 'coaching', 'automation', 'orchestration',
  'validation', 'analysis', 'optimization', 'clustering', 'curation',
  'indexing', 'refactoring', 'testing', 'moderation', 'coordination',
  // Domain (subject matter) - blue
  'design', 'audio', '3d', 'cv', 'ml', 'psychology', 'finance', 'career',
  'accessibility', 'adhd', 'devops', 'robotics', 'photography', 'health',
  'recovery', 'entrepreneurship', 'spatial', 'job-search', 'inspection',
  'thermal', 'insurance', 'temporal', 'events', 'faces', 'duplicates',
  'web', 'api', 'security', 'documentation', 'legal', 'relationships',
  'grief', 'vr', 'landscaping', 'color', 'typography', 'shaders',
  'physics', 'bots', 'agents', 'prompts',
  // Output (what it produces) - green
  'code', 'document', 'visual', 'data', 'strategy', 'diagrams', 'templates',
  // Complexity - orange
  'beginner-friendly', 'advanced', 'production-ready',
  // Integration (external tools) - pink
  'mcp', 'elevenlabs', 'figma', 'stability-ai', 'playwright', 'jest',
  'docusaurus', 'swiftui', 'react', 'discord', 'slack', 'telegram',
]);

const MIN_TAGS = 2;
const MAX_TAGS = 10;

function extractTags(content) {
  // Find tags section in YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const tagsMatch = frontmatter.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (!tagsMatch) return [];

  const tags = tagsMatch[1]
    .split('\n')
    .map(line => line.replace(/^\s+-\s+/, '').trim())
    .filter(tag => tag.length > 0);

  return tags;
}

function validateSkillTags(skillPath) {
  const skillName = path.basename(path.dirname(skillPath));
  const content = fs.readFileSync(skillPath, 'utf8');
  const errors = [];
  const warnings = [];

  const tags = extractTags(content);

  if (tags === null) {
    errors.push('Missing YAML frontmatter');
    return { skillName, errors, warnings, tags: [] };
  }

  if (tags.length === 0) {
    errors.push('No tags defined');
  } else if (tags.length < MIN_TAGS) {
    warnings.push(`Only ${tags.length} tag(s) - recommend at least ${MIN_TAGS}`);
  } else if (tags.length > MAX_TAGS) {
    warnings.push(`${tags.length} tags - maximum recommended is ${MAX_TAGS}`);
  }

  // Check for unknown tags (warn, don't error - we allow custom tags)
  const unknownTags = tags.filter(tag => !VALID_TAGS.has(tag));
  if (unknownTags.length > 0) {
    warnings.push(`Unknown tags (will display blue): ${unknownTags.join(', ')}`);
  }

  // Check for known tags (at least 1 from taxonomy is recommended)
  const knownTags = tags.filter(tag => VALID_TAGS.has(tag));
  if (knownTags.length === 0) {
    warnings.push('No tags from official taxonomy - consider adding standard tags for discoverability');
  }

  return { skillName, errors, warnings, tags };
}

// Main execution
const skillsDir = path.join(__dirname, '../../.claude/skills');
const skillDirs = fs.readdirSync(skillsDir)
  .filter(d => fs.statSync(path.join(skillsDir, d)).isDirectory());

let totalErrors = 0;
let totalWarnings = 0;
const results = [];

skillDirs.forEach(skillDir => {
  const skillPath = path.join(skillsDir, skillDir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return;

  const result = validateSkillTags(skillPath);
  results.push(result);

  if (result.errors.length > 0) {
    console.error(`❌ ${result.skillName}:`);
    result.errors.forEach(err => console.error(`   ${err}`));
    totalErrors += result.errors.length;
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️  ${result.skillName}:`);
    result.warnings.forEach(warn => console.warn(`   ${warn}`));
    totalWarnings += result.warnings.length;
  }
});

// Summary
console.log('\n--- Tag Validation Summary ---');
console.log(`Skills checked: ${results.length}`);
console.log(`Skills with tags: ${results.filter(r => r.tags.length > 0).length}`);
console.log(`Errors: ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);

// Tag distribution
const tagCounts = {};
results.forEach(r => {
  r.tags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
});

console.log('\nTag usage (top 15):');
Object.entries(tagCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count}`);
  });

if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('\n✅ Tag validation complete');
  process.exit(0);
}

#!/usr/bin/env npx tsx
/**
 * Sync Skill Documentation
 *
 * Reads each skill's SKILL.md and updates the corresponding website doc.
 * Extracts: name, description, tools, triggers from frontmatter
 * Updates: SkillHeader component props in the doc file
 *
 * Run: npx tsx scripts/syncSkillDocs.ts
 * Or: npm run sync:skills
 */

import * as fs from 'fs';
import * as path from 'path';

const SKILLS_DIR = path.resolve(__dirname, '../../.claude/skills');
const DOCS_DIR = path.resolve(__dirname, '../docs/skills');

interface SkillFrontmatter {
  name: string;
  description: string;
  tools?: string[];
  triggers?: string[];
}

function parseYamlFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: SkillFrontmatter = { name: '', description: '' };

  // Parse name
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  // Parse description (may be multi-line)
  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim();

  // Parse tools array
  const toolsSection = yaml.match(/^tools:\n((?:\s+-\s+.+\n?)+)/m);
  if (toolsSection) {
    result.tools = toolsSection[1]
      .split('\n')
      .map(line => line.replace(/^\s+-\s+/, '').split('#')[0].trim())
      .filter(Boolean);
  }

  // Parse triggers array
  const triggersSection = yaml.match(/^triggers:\n((?:\s+-\s+.+\n?)+)/m);
  if (triggersSection) {
    result.triggers = triggersSection[1]
      .split('\n')
      .map(line => line.replace(/^\s+-\s+/, '').replace(/['"]/g, '').trim())
      .filter(Boolean);
  }

  return result;
}

function getDocFilename(skillId: string): string {
  return skillId.replace(/-/g, '_') + '.md';
}

function createDocFile(skillId: string, skillMdPath: string): { created: boolean; reason?: string } {
  const docFilename = getDocFilename(skillId);
  const docPath = path.join(DOCS_DIR, docFilename);

  // Read the SKILL.md content
  const content = fs.readFileSync(skillMdPath, 'utf-8');

  // Transform YAML array tools to comma-separated format for Docusaurus frontmatter
  // Convert:
  //   allowed-tools:
  //     - Read
  //     - Write
  // To:
  //   allowed-tools: Read,Write,Edit
  const transformedContent = content.replace(
    /^(allowed-tools:)\n((?:\s+-\s+.+\n?)+)/m,
    (match, prefix, toolsBlock) => {
      const tools = toolsBlock
        .split('\n')
        .map((line: string) => line.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean)
        .join(',');
      return `${prefix} ${tools}\n`;
    }
  );

  // Ensure the docs/skills directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  fs.writeFileSync(docPath, transformedContent);
  return { created: true };
}

function updateDocFile(skillId: string, frontmatter: SkillFrontmatter, skillMdPath: string): { updated: boolean; created?: boolean; reason?: string } {
  const docFilename = getDocFilename(skillId);
  const docPath = path.join(DOCS_DIR, docFilename);

  // If doc file doesn't exist, create it from SKILL.md
  if (!fs.existsSync(docPath)) {
    return createDocFile(skillId, skillMdPath);
  }

  let content = fs.readFileSync(docPath, 'utf-8');
  let modified = false;

  // Escape quotes in description for JSX
  const escapedDesc = frontmatter.description.replace(/"/g, '\\"');

  // Update description in SkillHeader - use JSX expression syntax with curly braces
  // Match description={" or description=" followed by content until closing
  const descRegex = /(<SkillHeader[\s\S]*?description=\{?")([^]*?)("\}?\s*\n)/;
  const descMatch = content.match(descRegex);

  if (descMatch) {
    const currentDesc = descMatch[2];
    if (currentDesc !== escapedDesc) {
      // Use curly braces syntax: description={"..."} for proper JSX escaping
      content = content.replace(descRegex, `$1${escapedDesc}"}\n`);
      // Ensure we have the opening brace
      content = content.replace(/description="([^]*?)"}/g, 'description={"$1"}');
      modified = true;
    }
  }

  // Update skillName in SkillHeader if different from name
  const nameRegex = /(<SkillHeader[\s\S]*?skillName=")([^"]*?)(")/;
  const nameMatch = content.match(nameRegex);
  const displayName = frontmatter.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (nameMatch && nameMatch[2] !== displayName) {
    content = content.replace(nameRegex, `$1${displayName}$3`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(docPath, content);
    return { updated: true };
  }

  return { updated: false, reason: 'No changes needed' };
}

function main() {
  console.log('🔄 Syncing skill documentation...\n');

  const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let syncedCount = 0;
  let skippedCount = 0;
  const issues: string[] = [];

  for (const skillId of skillDirs) {
    const skillMdPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      issues.push(`${skillId}: Missing SKILL.md`);
      continue;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const frontmatter = parseYamlFrontmatter(content);

    if (!frontmatter || !frontmatter.name) {
      issues.push(`${skillId}: Invalid or missing frontmatter`);
      continue;
    }

    const result = updateDocFile(skillId, frontmatter, skillMdPath);

    if (result.created) {
      console.log(`🆕 ${skillId}: Created doc file`);
      syncedCount++;
    } else if (result.updated) {
      console.log(`✅ ${skillId}: Synced`);
      syncedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Synced: ${syncedCount}`);
  console.log(`   Unchanged: ${skippedCount}`);

  if (issues.length > 0) {
    console.log(`\n⚠️  Issues (${issues.length}):`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  console.log('\n✨ Sync complete!');
}

main();

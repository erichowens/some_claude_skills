#!/usr/bin/env npx tsx
/**
 * Fix Corrupted Skill Documentation
 *
 * The sync script corrupted descriptions by not handling escaped quotes.
 * This script rebuilds SkillHeader components from scratch using SKILL.md data.
 *
 * Run: npx tsx scripts/fixCorruptedDocs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SKILLS_DIR = path.resolve(__dirname, '../../.claude/skills');
const DOCS_DIR = path.resolve(__dirname, '../docs/skills');

interface SkillFrontmatter {
  name: string;
  description: string;
}

function parseYamlFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: SkillFrontmatter = { name: '', description: '' };

  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim();

  return result;
}

function getDocFilename(skillId: string): string {
  return skillId.replace(/-/g, '_') + '.md';
}

function fixDocFile(skillId: string, frontmatter: SkillFrontmatter): { fixed: boolean; reason?: string } {
  const docFilename = getDocFilename(skillId);
  const docPath = path.join(DOCS_DIR, docFilename);

  if (!fs.existsSync(docPath)) {
    return { fixed: false, reason: 'Doc file does not exist' };
  }

  let content = fs.readFileSync(docPath, 'utf-8');

  // Find the SkillHeader component - match from <SkillHeader to />
  const headerRegex = /<SkillHeader[\s\S]*?\/>/;
  const headerMatch = content.match(headerRegex);

  if (!headerMatch) {
    return { fixed: false, reason: 'No SkillHeader found' };
  }

  const currentHeader = headerMatch[0];

  // Extract existing props we want to keep
  const fileNameMatch = currentHeader.match(/fileName="([^"]+)"/);
  const skillNameMatch = currentHeader.match(/skillName="([^"]+)"/);
  const tagsMatch = currentHeader.match(/tags=\{(\[[^\]]+\])\}/);

  const fileName = fileNameMatch ? fileNameMatch[1] : skillId.replace(/-/g, '_');
  const skillName = skillNameMatch ? skillNameMatch[1] : frontmatter.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const tags = tagsMatch ? tagsMatch[1] : '["research"]';

  // Escape quotes in description for JSX - use curly braces syntax for proper escaping
  const escapedDesc = frontmatter.description.replace(/"/g, '\\"');

  // Build the new clean SkillHeader - use curly braces for description to handle special chars
  const newHeader = `<SkillHeader
  skillName="${skillName}"
  fileName="${fileName}"
  description={"${escapedDesc}"}
  tags={${tags}}
/>`;

  // Replace the old header with the new one
  const newContent = content.replace(headerRegex, newHeader);

  if (newContent !== content) {
    fs.writeFileSync(docPath, newContent);
    return { fixed: true };
  }

  return { fixed: false, reason: 'No changes needed' };
}

function main() {
  console.log('🔧 Fixing corrupted skill documentation...\n');

  const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let fixedCount = 0;
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

    const result = fixDocFile(skillId, frontmatter);

    if (result.fixed) {
      console.log(`✅ ${skillId}: Fixed`);
      fixedCount++;
    } else if (result.reason === 'Doc file does not exist') {
      issues.push(`${skillId}: No doc file`);
    } else if (result.reason === 'No SkillHeader found') {
      issues.push(`${skillId}: No SkillHeader in doc`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Unchanged: ${skippedCount}`);

  if (issues.length > 0) {
    console.log(`\n⚠️  Issues (${issues.length}):`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  console.log('\n✨ Fix complete!');
}

main();

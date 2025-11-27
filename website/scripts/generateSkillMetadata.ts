/**
 * Generate comprehensive skill metadata for sorting and display.
 * Includes git dates, line counts, and file sizes.
 *
 * Run: npx tsx scripts/generateSkillMetadata.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface SkillMetadata {
  id: string;
  createdAt: string | null;        // ISO date of first git commit
  updatedAt: string | null;        // ISO date of last git commit
  totalLines: number;              // Total lines across all files
  totalFiles: number;              // Total file count
  skillMdSize: number;             // Size of SKILL.md in bytes
  skillMdLines: number;            // Lines in SKILL.md
  hasReferences: boolean;          // Has references/ folder
  hasExamples: boolean;            // Has examples/ folder
  hasChangelog: boolean;           // Has CHANGELOG.md
}

interface SkillMetadataIndex {
  generatedAt: string;
  skills: Record<string, SkillMetadata>;
}

const SKILLS_DIR = path.join(__dirname, '../../.claude/skills');
const OUTPUT_PATH = path.join(__dirname, '../src/data/skillMetadata.json');
const ROOT_DIR = path.join(__dirname, '../..');

// Files to skip
const SKIP_FILES = ['.DS_Store', '.git', 'node_modules', '__pycache__'];

function shouldSkip(name: string): boolean {
  return SKIP_FILES.some(skip => name === skip || name.endsWith('.pyc'));
}

function getGitDate(filePath: string, first: boolean): string | null {
  try {
    const format = first ? '--follow --diff-filter=A --format=%aI' : '--format=%aI -1';
    const cmd = first
      ? `git log --follow --diff-filter=A --format=%aI -- "${filePath}" | tail -1`
      : `git log --format=%aI -1 -- "${filePath}"`;

    const result = execSync(cmd, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return result || null;
  } catch {
    return null;
  }
}

function getGitDatesForFolder(folderPath: string): { createdAt: string | null; updatedAt: string | null } {
  try {
    // Get most recent commit date for any file in folder
    const updatedCmd = `git log --format=%aI -1 -- "${folderPath}"`;
    const updatedAt = execSync(updatedCmd, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim() || null;

    // Get oldest commit date for any file in folder
    const createdCmd = `git log --format=%aI --reverse -- "${folderPath}" | head -1`;
    const createdAt = execSync(createdCmd, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim() || null;

    return { createdAt, updatedAt };
  } catch {
    return { createdAt: null, updatedAt: null };
  }
}

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function processFolder(dirPath: string): { totalLines: number; totalFiles: number } {
  let totalLines = 0;
  let totalFiles = 0;

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (shouldSkip(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        totalFiles++;
        // Count lines for text files
        const ext = path.extname(entry.name).toLowerCase();
        if (['.md', '.txt', '.py', '.sh', '.js', '.ts', '.tsx', '.jsx', '.css', '.json', '.yaml', '.yml'].includes(ext)) {
          totalLines += countLines(fullPath);
        }
      }
    }
  }

  walk(dirPath);
  return { totalLines, totalFiles };
}

function generateSkillMetadata(): void {
  console.log('Generating skill metadata...\n');

  const skillFolders = fs.readdirSync(SKILLS_DIR)
    .filter(name => {
      const skillPath = path.join(SKILLS_DIR, name);
      return fs.statSync(skillPath).isDirectory() && !shouldSkip(name);
    })
    .sort();

  const skills: Record<string, SkillMetadata> = {};

  for (const skillName of skillFolders) {
    const skillPath = path.join(SKILLS_DIR, skillName);
    const relativePath = `.claude/skills/${skillName}`;

    console.log(`Processing: ${skillName}`);

    // Get git dates
    const { createdAt, updatedAt } = getGitDatesForFolder(relativePath);

    // Count lines and files
    const { totalLines, totalFiles } = processFolder(skillPath);

    // Get SKILL.md stats
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    let skillMdSize = 0;
    let skillMdLines = 0;
    if (fs.existsSync(skillMdPath)) {
      const stats = fs.statSync(skillMdPath);
      skillMdSize = stats.size;
      skillMdLines = countLines(skillMdPath);
    }

    // Check for special folders/files
    const hasReferences = fs.existsSync(path.join(skillPath, 'references'));
    const hasExamples = fs.existsSync(path.join(skillPath, 'examples'));
    const hasChangelog = fs.existsSync(path.join(skillPath, 'CHANGELOG.md'));

    skills[skillName] = {
      id: skillName,
      createdAt,
      updatedAt,
      totalLines,
      totalFiles,
      skillMdSize,
      skillMdLines,
      hasReferences,
      hasExamples,
      hasChangelog,
    };

    console.log(`  Created: ${createdAt?.split('T')[0] || 'unknown'}, Updated: ${updatedAt?.split('T')[0] || 'unknown'}`);
    console.log(`  Lines: ${totalLines}, Files: ${totalFiles}, SKILL.md: ${skillMdLines} lines`);
  }

  const output: SkillMetadataIndex = {
    generatedAt: new Date().toISOString(),
    skills,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✅ Generated metadata for ${Object.keys(skills).length} skills`);
  console.log(`   Output: ${OUTPUT_PATH}`);
}

generateSkillMetadata();

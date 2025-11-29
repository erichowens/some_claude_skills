/**
 * Generate skill folder structure data for the Win31FileManager component.
 * This script runs at build time to generate JSON data for each skill folder.
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  size?: number;
}

const SKILLS_DIR = path.join(__dirname, '../../.claude/skills');
const OUTPUT_DIR = path.join(__dirname, '../src/data/skillFolders');

// Files to skip
const SKIP_FILES = ['.DS_Store', '.git', 'node_modules', '__pycache__', '.pyc'];

// Files where we should include content (max 50KB)
const MAX_CONTENT_SIZE = 50 * 1024;
const CONTENT_EXTENSIONS = ['.md', '.txt', '.py', '.sh', '.js', '.ts', '.tsx', '.jsx', '.css', '.json'];

function shouldSkip(name: string): boolean {
  return SKIP_FILES.some(skip => name === skip || name.endsWith(skip));
}

function shouldIncludeContent(name: string, size: number): boolean {
  if (size > MAX_CONTENT_SIZE) return false;
  const ext = path.extname(name).toLowerCase();
  return CONTENT_EXTENSIONS.includes(ext);
}

function buildFileTree(dirPath: string, relativePath: string = ''): FileNode {
  const name = path.basename(dirPath);
  const stats = fs.statSync(dirPath);

  if (stats.isFile()) {
    const node: FileNode = {
      name,
      type: 'file',
      path: relativePath || name,
      size: stats.size,
    };

    // Include content for supported file types
    if (shouldIncludeContent(name, stats.size)) {
      try {
        node.content = fs.readFileSync(dirPath, 'utf-8');
      } catch (err) {
        console.warn(`Could not read content of ${dirPath}`);
      }
    }

    return node;
  }

  // It's a directory
  const children: FileNode[] = [];
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries.sort()) {
    if (shouldSkip(entry)) continue;

    const entryPath = path.join(dirPath, entry);
    const childRelativePath = relativePath ? `${relativePath}/${entry}` : entry;

    try {
      const childNode = buildFileTree(entryPath, childRelativePath);
      children.push(childNode);
    } catch (err) {
      console.warn(`Error processing ${entryPath}:`, err);
    }
  }

  // Sort: folders first, then files, alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    name,
    type: 'folder',
    path: relativePath || name,
    children,
  };
}

function generateSkillFolderData(): void {
  console.log('Generating skill folder data...');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all skill folders
  const skillFolders = fs.readdirSync(SKILLS_DIR)
    .filter(name => {
      const skillPath = path.join(SKILLS_DIR, name);
      return fs.statSync(skillPath).isDirectory() && !shouldSkip(name);
    })
    .sort();

  const allSkillsIndex: Record<string, { hasContent: boolean; fileCount: number; folderCount: number }> = {};

  for (const skillName of skillFolders) {
    const skillPath = path.join(SKILLS_DIR, skillName);
    console.log(`  Processing: ${skillName}`);

    try {
      const tree = buildFileTree(skillPath, skillName);

      // Count files and folders
      let fileCount = 0;
      let folderCount = 0;
      const countNodes = (node: FileNode) => {
        if (node.type === 'file') fileCount++;
        else {
          folderCount++;
          node.children?.forEach(countNodes);
        }
      };
      countNodes(tree);
      folderCount--; // Don't count root

      // Check if has more than just SKILL.md
      const hasContent = tree.children && (
        tree.children.length > 1 ||
        tree.children.some(c => c.type === 'folder')
      );

      allSkillsIndex[skillName] = {
        hasContent: hasContent || false,
        fileCount,
        folderCount,
      };

      // Only generate file if there's content beyond SKILL.md
      if (hasContent) {
        const outputPath = path.join(OUTPUT_DIR, `${skillName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(tree, null, 2));
        console.log(`    Created: ${skillName}.json (${fileCount} files, ${folderCount} folders)`);
      } else {
        console.log(`    Skipped: ${skillName} (only SKILL.md)`);
      }
    } catch (err) {
      console.error(`  Error processing ${skillName}:`, err);
    }
  }

  // Generate index file
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(allSkillsIndex, null, 2));
  console.log(`\nCreated index: ${Object.keys(allSkillsIndex).length} skills`);

  // Generate TypeScript types file
  const typesContent = `// Auto-generated - do not edit
export interface SkillFolderIndex {
  [skillName: string]: {
    hasContent: boolean;
    fileCount: number;
    folderCount: number;
  };
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  size?: number;
}

// Skill folder index
export const skillFolderIndex: SkillFolderIndex = ${JSON.stringify(allSkillsIndex, null, 2)};

// Skills with rich content (more than just SKILL.md)
export const skillsWithContent = ${JSON.stringify(
    Object.entries(allSkillsIndex)
      .filter(([, info]) => info.hasContent)
      .map(([name]) => name),
    null,
    2
  )};
`;

  const typesPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(typesPath, typesContent);
  console.log('Created TypeScript types file');

  console.log('\nDone!');
}

generateSkillFolderData();

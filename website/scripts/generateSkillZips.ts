#!/usr/bin/env tsx
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Pre-generates skill folder zips at build time
 * This avoids GitHub API rate limits and CORS issues
 */

const SKILLS_DIR = path.join(__dirname, '../../.claude/skills');
const OUTPUT_DIR = path.join(__dirname, '../static/downloads/skills');

async function generateSkillZips() {
  console.log('🔨 Generating skill zips...\n');

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Get all skill directories
  const skillDirs = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  const skills = skillDirs.filter(dirent => dirent.isDirectory());

  for (const skill of skills) {
    const skillId = skill.name;
    const skillPath = path.join(SKILLS_DIR, skillId);
    const zipPath = path.join(OUTPUT_DIR, `${skillId}.zip`);

    console.log(`📦 Creating ${skillId}.zip...`);

    try {
      const zip = new JSZip();
      const skillFolder = zip.folder(skillId);

      if (!skillFolder) {
        throw new Error(`Failed to create zip folder for ${skillId}`);
      }

      // Recursively add files to zip
      await addDirectoryToZip(skillPath, skillFolder, '');

      // Generate and write zip file
      const content = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      await fs.writeFile(zipPath, content);
      console.log(`   ✓ Created ${skillId}.zip (${(content.length / 1024).toFixed(1)} KB)\n`);
    } catch (error) {
      console.error(`   ✗ Failed to create ${skillId}.zip:`, error);
    }
  }

  console.log('✅ Done generating skill zips!');
}

async function addDirectoryToZip(
  dirPath: string,
  zipFolder: JSZip,
  relativePath: string
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryRelativePath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      // Skip .git and node_modules
      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }

      // Create subfolder and recurse
      const subFolder = zipFolder.folder(entry.name);
      if (subFolder) {
        await addDirectoryToZip(fullPath, subFolder, entryRelativePath);
      }
    } else if (entry.isFile()) {
      // Add file to zip
      const fileContent = await fs.readFile(fullPath);
      zipFolder.file(entry.name, fileContent);
    }
  }
}

// Run the script
generateSkillZips().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

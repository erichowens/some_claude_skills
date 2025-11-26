import * as fs from 'fs';
import * as path from 'path';

interface SkillDescription {
  id: string;
  description: string;
}

// Extract first 1-2 paragraphs of expository content from SKILL.md
function extractDescription(content: string): string {
  // Split by lines
  const lines = content.split('\n');

  // Skip frontmatter
  let inFrontmatter = false;
  let frontmatterEnded = false;
  let paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle frontmatter
    if (trimmed === '---') {
      if (!inFrontmatter && !frontmatterEnded) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        frontmatterEnded = true;
        continue;
      }
    }

    if (inFrontmatter || !frontmatterEnded) {
      continue;
    }

    // Stop at first heading or list
    if (trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('1.')) {
      break;
    }

    // Empty line marks paragraph boundary
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];

        // Stop after 2 paragraphs
        if (paragraphs.length >= 2) {
          break;
        }
      }
    } else {
      currentParagraph.push(trimmed);
    }
  }

  // Add last paragraph if exists
  if (currentParagraph.length > 0 && paragraphs.length < 2) {
    paragraphs.push(currentParagraph.join(' '));
  }

  return paragraphs.join(' ');
}

// Main function
function main() {
  // Use the explicit path
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const skillsDir = path.join(homeDir, 'coding/some_claude_skills/.claude/skills');
  const skills: SkillDescription[] = [];

  // Read all skill directories
  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const skillId of skillDirs) {
    // Check both SKILL.md and skill.md
    const skillMdPath = path.join(skillsDir, skillId, 'SKILL.md');
    const skillMdPathLower = path.join(skillsDir, skillId, 'skill.md');

    const actualPath = fs.existsSync(skillMdPath) ? skillMdPath :
                       fs.existsSync(skillMdPathLower) ? skillMdPathLower : null;

    if (actualPath) {
      const content = fs.readFileSync(actualPath, 'utf-8');
      const description = extractDescription(content);

      if (description) {
        skills.push({ id: skillId, description });
      }
    }
  }

  // Write to JSON file
  const outputPath = path.join(__dirname, '../src/data/skillDescriptions.json');
  fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2));

  console.log(`✓ Extracted descriptions for ${skills.length} skills`);
  console.log(`✓ Written to ${outputPath}`);
}

main();

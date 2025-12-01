#!/usr/bin/env node
/**
 * Validate README.md skill count matches actual skill inventory
 * Part of skill-documentarian responsibilities
 */

const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '../../README.md');
const SKILLS_DIR = path.join(__dirname, '../../.claude/skills');

function countActualSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error('❌ Skills directory not found:', SKILLS_DIR);
    process.exit(1);
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).length;
}

function getReadmeSkillCount() {
  if (!fs.existsSync(README_PATH)) {
    console.error('❌ README.md not found:', README_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(README_PATH, 'utf-8');

  // Match patterns like "46+ production-ready skills" or "46 production-ready skills"
  const match = content.match(/(\d+)\+?\s*production-ready skills/i);

  if (!match) {
    console.warn('⚠️  Could not find skill count pattern in README.md');
    return null;
  }

  return parseInt(match[1], 10);
}

function main() {
  const actual = countActualSkills();
  const claimed = getReadmeSkillCount();

  console.log(`📊 Skills inventory check:`);
  console.log(`   Actual skills in .claude/skills/: ${actual}`);
  console.log(`   README.md claims: ${claimed}+`);

  if (claimed === null) {
    console.warn('⚠️  Could not validate README skill count');
    process.exit(0); // Don't block commit, just warn
  }

  // Allow if actual >= claimed (README uses "X+" notation)
  if (actual >= claimed) {
    console.log(`✅ README skill count is valid (${actual} >= ${claimed}+)`);
    process.exit(0);
  }

  // If actual is less than claimed, that's a problem
  console.error(`❌ README claims ${claimed}+ skills but only ${actual} exist!`);
  console.error(`   Update README.md to reflect actual count or add missing skills.`);
  process.exit(1);
}

main();

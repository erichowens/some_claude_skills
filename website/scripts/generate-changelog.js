#!/usr/bin/env node
/**
 * generate-changelog.js
 *
 * Extracts changelog entries from git commits and generates changelog data.
 * Filters for meaningful commits (feat, fix, add skills, etc.)
 *
 * Usage: node scripts/generate-changelog.js
 * Output: src/data/changelog.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Commit patterns we care about
const CHANGELOG_PATTERNS = [
  /^feat(\(.+\))?:/i,      // Features
  /^fix(\(.+\))?:/i,       // Bug fixes
  /^add(\(.+\))?:/i,       // Additions
  /^perf(\(.+\))?:/i,      // Performance
  /^refactor(\(.+\))?:/i,  // Refactors (major only)
];

// Patterns to skip
const SKIP_PATTERNS = [
  /^chore/i,
  /^docs/i,
  /^style/i,
  /^test/i,
  /^ci/i,
  /^build/i,
  /merge/i,
  /wip/i,
];

// Category mappings for commits
const CATEGORY_KEYWORDS = {
  'skills': ['skill', 'skills'],
  'ui': ['ui', 'design', 'css', 'style', 'layout', 'component'],
  'features': ['feat', 'feature', 'add'],
  'fixes': ['fix', 'bug', 'patch', 'resolve'],
  'performance': ['perf', 'performance', 'optimize', 'speed'],
  'infra': ['deploy', 'ci', 'build', 'docker', 'pipeline'],
};

function categorizeCommit(message) {
  const lowerMessage = message.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      return category;
    }
  }
  return 'other';
}

function parseCommitMessage(message) {
  // Extract conventional commit parts
  const match = message.match(/^(\w+)(?:\((.+)\))?:\s*(.+)$/);
  if (match) {
    return {
      type: match[1],
      scope: match[2] || null,
      description: match[3],
    };
  }
  return {
    type: 'other',
    scope: null,
    description: message,
  };
}

function extractSkillCount(message) {
  // Look for patterns like "Add 12 new skills" or "90 skills"
  const match = message.match(/(\d+)\s*(new\s+)?skills?/i);
  return match ? parseInt(match[1], 10) : null;
}

function getCommits(since = '2025-11-01') {
  try {
    // Get commits with hash, date, and full message
    const format = '%H|%aI|%s|%b|||';
    const cmd = `git log --since="${since}" --format="${format}" --no-merges`;
    const output = execSync(cmd, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..', '..'),
      maxBuffer: 10 * 1024 * 1024,
    });

    return output.split('|||')
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0)
      .map(entry => {
        const [hash, date, subject, body] = entry.split('|');
        return { hash, date, subject, body: body || '' };
      });
  } catch (error) {
    console.error('Error getting commits:', error.message);
    return [];
  }
}

function shouldIncludeCommit(subject) {
  // Check if it matches any skip pattern
  if (SKIP_PATTERNS.some(pattern => pattern.test(subject))) {
    return false;
  }

  // Check if it matches any changelog pattern
  if (CHANGELOG_PATTERNS.some(pattern => pattern.test(subject))) {
    return true;
  }

  // Include commits that mention skills specifically
  if (/skills?/i.test(subject)) {
    return true;
  }

  return false;
}

function generateChangelog() {
  console.log('Generating changelog from git history...\n');

  const commits = getCommits();
  console.log(`Found ${commits.length} total commits since Nov 2025`);

  const entries = [];
  const seenDescriptions = new Set();

  for (const commit of commits) {
    if (!shouldIncludeCommit(commit.subject)) {
      continue;
    }

    const parsed = parseCommitMessage(commit.subject);
    const category = categorizeCommit(commit.subject);
    const skillCount = extractSkillCount(commit.subject);

    // Dedupe similar entries
    const dedupeKey = parsed.description.toLowerCase().slice(0, 50);
    if (seenDescriptions.has(dedupeKey)) {
      continue;
    }
    seenDescriptions.add(dedupeKey);

    entries.push({
      date: commit.date.split('T')[0],
      hash: commit.hash.slice(0, 7),
      type: parsed.type,
      scope: parsed.scope,
      description: parsed.description,
      category,
      skillCount,
    });
  }

  console.log(`Filtered to ${entries.length} changelog entries\n`);

  // Group by date
  const byDate = {};
  for (const entry of entries) {
    if (!byDate[entry.date]) {
      byDate[entry.date] = [];
    }
    byDate[entry.date].push(entry);
  }

  // Sort dates descending
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const changelog = {
    generated: new Date().toISOString(),
    totalEntries: entries.length,
    entries: sortedDates.map(date => ({
      date,
      items: byDate[date],
    })),
  };

  // Write to JSON
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'changelog.json');
  fs.writeFileSync(outputPath, JSON.stringify(changelog, null, 2));
  console.log(`Wrote changelog to ${outputPath}`);

  // Print summary
  console.log('\nChangelog Summary:');
  console.log('==================');
  for (const dateGroup of changelog.entries.slice(0, 10)) {
    console.log(`\n${dateGroup.date}:`);
    for (const item of dateGroup.items) {
      const prefix = item.scope ? `[${item.scope}]` : '';
      console.log(`  - ${prefix} ${item.description}`);
    }
  }
  if (changelog.entries.length > 10) {
    console.log(`\n... and ${changelog.entries.length - 10} more days`);
  }

  return changelog;
}

generateChangelog();

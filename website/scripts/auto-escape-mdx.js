#!/usr/bin/env node
/**
 * Auto-Escape MDX Angle Brackets
 *
 * Automatically finds and escapes angle brackets that would cause MDX compilation errors.
 * Run this before build to prevent JSX parsing failures.
 *
 * Usage:
 *   node scripts/auto-escape-mdx.js           # Dry run (show what would change)
 *   node scripts/auto-escape-mdx.js --fix     # Actually fix the files
 *   node scripts/auto-escape-mdx.js --verbose # Show detailed matches
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns that cause MDX/JSX parsing errors
// These are angle brackets followed by things that aren't valid JSX tag names
const PROBLEMATIC_PATTERNS = [
  // <2s, <100, <50% etc. (number after angle bracket)
  /<(\d)/g,
  // <= >= comparisons that aren't in code blocks
  /<=/g,
  />=/g,
  // <-- arrows
  /<--/g,
  // -> arrows (less common issue but can happen)
  // /->/g,
  // <> empty tags that might be misinterpreted
  /<>/g,
  // < followed by space (not a tag)
  /<\s+\w/g,
];

// Patterns to SKIP (these are valid or in code blocks)
const SKIP_CONTEXTS = [
  // Already escaped
  /\\</g,
  // Inside inline code
  /`[^`]*<[^`]*`/g,
  // Inside code blocks (we'll handle this separately)
];

function isInsideCodeBlock(content, index) {
  // Count ``` before this position
  const before = content.slice(0, index);
  const codeBlockStarts = (before.match(/```/g) || []).length;
  // Odd number means we're inside a code block
  return codeBlockStarts % 2 === 1;
}

function isInsideInlineCode(content, index) {
  // Check if we're between backticks on the same line
  const lineStart = content.lastIndexOf('\n', index) + 1;
  const lineEnd = content.indexOf('\n', index);
  const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
  const posInLine = index - lineStart;

  // Count backticks before and after position in this line
  const beforeInLine = line.slice(0, posInLine);
  const afterInLine = line.slice(posInLine);

  const backticksBeforeOnLine = (beforeInLine.match(/`/g) || []).length;
  const backticksAfterOnLine = (afterInLine.match(/`/g) || []).length;

  // If odd backticks before AND at least one after, we're in inline code
  return backticksBeforeOnLine % 2 === 1 && backticksAfterOnLine > 0;
}

function findProblematicBrackets(content, filePath) {
  const issues = [];

  // Pattern: < followed by a digit (like <2s, <100ms)
  const digitPattern = /<(\d)/g;
  let match;

  while ((match = digitPattern.exec(content)) !== null) {
    const index = match.index;

    // Skip if already escaped
    if (index > 0 && content[index - 1] === '\\') continue;

    // Skip if inside code block
    if (isInsideCodeBlock(content, index)) continue;

    // Skip if inside inline code
    if (isInsideInlineCode(content, index)) continue;

    // Get line number and context
    const lineNumber = content.slice(0, index).split('\n').length;
    const lineStart = content.lastIndexOf('\n', index) + 1;
    const lineEnd = content.indexOf('\n', index);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);

    issues.push({
      index,
      lineNumber,
      match: match[0],
      line: line.trim(),
      replacement: '\\<' + match[1],
    });
  }

  // Pattern: <= comparison
  const lePattern = /<=/g;
  while ((match = lePattern.exec(content)) !== null) {
    const index = match.index;
    if (index > 0 && content[index - 1] === '\\') continue;
    if (isInsideCodeBlock(content, index)) continue;
    if (isInsideInlineCode(content, index)) continue;

    const lineNumber = content.slice(0, index).split('\n').length;
    const lineStart = content.lastIndexOf('\n', index) + 1;
    const lineEnd = content.indexOf('\n', index);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);

    issues.push({
      index,
      lineNumber,
      match: '<=',
      line: line.trim(),
      replacement: '\\<=',
    });
  }

  return issues;
}

function fixFile(content, issues) {
  if (issues.length === 0) return content;

  // Sort by index descending so we can replace from end to start
  // (this preserves indices)
  const sorted = [...issues].sort((a, b) => b.index - a.index);

  let fixed = content;
  for (const issue of sorted) {
    fixed = fixed.slice(0, issue.index) +
            issue.replacement +
            fixed.slice(issue.index + issue.match.length);
  }

  return fixed;
}

function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const verbose = args.includes('--verbose');

  console.log('🔍 Scanning for MDX angle bracket issues...\n');

  if (!shouldFix) {
    console.log('   (Dry run - use --fix to actually modify files)\n');
  }

  // Find all markdown files in docs
  const files = glob.sync('docs/**/*.md', {
    cwd: path.join(__dirname, '..'),
    absolute: true
  });

  let totalIssues = 0;
  let filesWithIssues = 0;
  const allIssues = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const issues = findProblematicBrackets(content, file);

    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.length;

      const relativePath = path.relative(path.join(__dirname, '..'), file);
      console.log(`❌ ${relativePath}: ${issues.length} issue(s)`);

      if (verbose) {
        for (const issue of issues) {
          console.log(`   Line ${issue.lineNumber}: "${issue.match}" → "${issue.replacement}"`);
          console.log(`   Context: ${issue.line.slice(0, 80)}...`);
        }
      }

      if (shouldFix) {
        const fixed = fixFile(content, issues);
        fs.writeFileSync(file, fixed, 'utf-8');
        console.log(`   ✅ Fixed!`);
      }

      allIssues.push({ file: relativePath, issues });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${totalIssues} issues in ${filesWithIssues} files`);

  if (totalIssues > 0 && !shouldFix) {
    console.log('\n💡 Run with --fix to automatically escape these brackets:');
    console.log('   node scripts/auto-escape-mdx.js --fix');
  } else if (totalIssues > 0 && shouldFix) {
    console.log('\n✅ All issues fixed! Build should now succeed.');
  } else {
    console.log('\n✅ No issues found!');
  }

  // Exit with error code if issues found and not fixed
  if (totalIssues > 0 && !shouldFix) {
    process.exit(1);
  }
}

main();

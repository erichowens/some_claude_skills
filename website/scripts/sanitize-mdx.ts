#!/usr/bin/env npx tsx
/**
 * MDX Sanitizer CLI
 *
 * Scan and fix MDX-incompatible content in markdown files.
 *
 * Usage:
 *   npx tsx scripts/sanitize-mdx.ts           # Dry run (show issues)
 *   npx tsx scripts/sanitize-mdx.ts --fix     # Fix all issues
 *   npx tsx scripts/sanitize-mdx.ts --verbose # Show detailed output
 *
 * Or via npm:
 *   npm run sanitize:mdx                      # Dry run
 *   npm run sanitize:mdx -- --fix             # Fix all issues
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import {
  sanitizeForMdx,
  formatIssuesReport,
  SanitizationIssue
} from './lib/mdx-sanitizer';

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');

async function main() {
  console.log('🔍 MDX Sanitizer - Scanning for issues...\n');

  if (!shouldFix) {
    console.log('   (Dry run - use --fix to modify files)\n');
  }

  // Directories to scan
  const scanDirs = [
    { dir: path.resolve(__dirname, '../docs'), label: 'docs/' },
    { dir: path.resolve(__dirname, '../../.claude/skills'), label: '.claude/skills/' }
  ];

  let totalIssues = 0;
  let filesWithIssues = 0;
  let filesFixed = 0;
  const allIssues: Array<{ file: string; issues: SanitizationIssue[] }> = [];

  for (const { dir, label } of scanDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Skipping ${label} (not found)`);
      continue;
    }

    console.log(`📂 Scanning ${label}...`);

    const files = await glob('**/*.md', {
      cwd: dir,
      absolute: true
    });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const result = sanitizeForMdx(content, { useHtmlEntities: true });

      if (result.issues.length > 0) {
        filesWithIssues++;
        totalIssues += result.issues.length;

        const relativePath = path.relative(process.cwd(), file);
        allIssues.push({ file: relativePath, issues: result.issues });

        if (verbose) {
          console.log(formatIssuesReport(result.issues, relativePath));
        } else {
          console.log(`   ❌ ${relativePath}: ${result.issues.length} issue(s)`);
        }

        if (shouldFix) {
          fs.writeFileSync(file, result.content, 'utf-8');
          console.log('      ✅ Fixed!');
          filesFixed++;
        }
      }
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Summary: ${totalIssues} issues in ${filesWithIssues} files`);

  if (shouldFix && filesFixed > 0) {
    console.log(`✅ Fixed ${filesFixed} files`);
  } else if (totalIssues > 0) {
    console.log('\n💡 To fix automatically, run:');
    console.log('   npm run sanitize:mdx -- --fix');

    if (!verbose && totalIssues > 0) {
      console.log('\n💡 For detailed output, use --verbose');
    }

    process.exit(1);
  } else {
    console.log('\n✅ All files are MDX-safe!');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

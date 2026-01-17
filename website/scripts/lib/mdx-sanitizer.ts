/**
 * MDX Sanitizer
 *
 * Comprehensive sanitization of markdown content for MDX compatibility.
 * Handles angle brackets, curly braces, and other JSX-conflicting patterns.
 *
 * Why this exists:
 * MDX 2.x treats unescaped `<` and `{` as JSX syntax, causing build failures
 * when content contains TypeScript generics, comparisons, or informal HTML tags.
 *
 * Usage:
 *   import { sanitizeForMdx, validateMdxSafety } from './mdx-sanitizer';
 *
 *   // Sanitize content before writing to docs
 *   const safe = sanitizeForMdx(content);
 *
 *   // Validate without modifying
 *   const issues = validateMdxSafety(content, 'path/to/file.md');
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TYPES
// =============================================================================

export interface SanitizationIssue {
  line: number;
  column: number;
  match: string;
  reason: string;
  fix: string;
}

export interface SanitizationResult {
  content: string;
  issues: SanitizationIssue[];
  modified: boolean;
}

export interface SanitizationOptions {
  /** Use HTML entities (&lt;) instead of backslash escapes (\<). Default: true */
  useHtmlEntities?: boolean;
  /** Also sanitize curly braces. Default: false (less common issue) */
  sanitizeCurlyBraces?: boolean;
  /** Verbose logging. Default: false */
  verbose?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Valid HTML5 void elements (self-closing)
 * These are valid in MDX without modification
 */
const HTML_VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/**
 * Valid HTML5 elements
 * These are valid in MDX and shouldn't be escaped
 */
const HTML_ELEMENTS = new Set([
  // Document metadata
  'html', 'head', 'title', 'base', 'link', 'meta', 'style',
  // Sectioning
  'body', 'article', 'section', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hgroup', 'header', 'footer', 'address', 'main',
  // Content grouping
  'p', 'hr', 'pre', 'blockquote', 'ol', 'ul', 'li', 'dl', 'dt', 'dd',
  'figure', 'figcaption', 'div',
  // Text-level semantics
  'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data', 'time',
  'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark', 'ruby', 'rt',
  'rp', 'bdi', 'bdo', 'span', 'br', 'wbr',
  // Edits
  'ins', 'del',
  // Embedded content
  'img', 'iframe', 'embed', 'object', 'param', 'video', 'audio', 'source',
  'track', 'canvas', 'map', 'area', 'svg', 'math',
  // Tables
  'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th',
  // Forms
  'form', 'label', 'input', 'button', 'select', 'datalist', 'optgroup', 'option',
  'textarea', 'output', 'progress', 'meter', 'fieldset', 'legend',
  // Interactive
  'details', 'summary', 'dialog', 'menu',
  // Scripting
  'script', 'noscript', 'template', 'slot'
]);

// =============================================================================
// CORE DETECTION FUNCTIONS
// =============================================================================

/**
 * Detect if a position is inside a fenced code block
 */
function isInsideFencedCodeBlock(content: string, index: number): boolean {
  // Find all ``` positions before this index
  const before = content.slice(0, index);
  let inCodeBlock = false;
  let pos = 0;

  while (pos < before.length) {
    // Check for ``` at line start or after newline
    const lineStart = pos === 0 || before[pos - 1] === '\n';
    if (lineStart && before.slice(pos, pos + 3) === '```') {
      inCodeBlock = !inCodeBlock;
      pos += 3;
    } else {
      pos++;
    }
  }

  return inCodeBlock;
}

/**
 * Detect if a position is inside inline code (backticks)
 */
function isInsideInlineCode(content: string, index: number): boolean {
  // Get the current line
  const lineStart = content.lastIndexOf('\n', index - 1) + 1;
  const lineEnd = content.indexOf('\n', index);
  const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
  const posInLine = index - lineStart;

  // Count backticks before and after on this line
  let backticksBefore = 0;
  for (let i = 0; i < posInLine; i++) {
    if (line[i] === '`') backticksBefore++;
  }

  // Odd number of backticks before means we're inside inline code
  return backticksBefore % 2 === 1;
}

/**
 * Check if already escaped with backslash or HTML entity
 */
function isAlreadyEscaped(content: string, index: number): boolean {
  // Backslash escape
  if (index > 0 && content[index - 1] === '\\') return true;

  // HTML entity escape (&lt; or &gt;)
  if (content.slice(index, index + 4) === '&lt;') return true;
  if (content.slice(index, index + 4) === '&gt;') return true;

  return false;
}

/**
 * Get position info (line, column) for an index
 */
function getPosition(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

// =============================================================================
// PROBLEM PATTERNS
// =============================================================================

interface PatternMatch {
  index: number;
  match: string;
  reason: string;
  replacement: string;
}

/**
 * Find all problematic angle brackets in content
 */
function findProblematicPatterns(
  content: string,
  options: SanitizationOptions
): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const useHtml = options.useHtmlEntities !== false;

  function shouldSkip(idx: number): boolean {
    return (
      isInsideFencedCodeBlock(content, idx) ||
      isInsideInlineCode(content, idx) ||
      isAlreadyEscaped(content, idx)
    );
  }

  // Pattern 1: < followed by digit (e.g., <100, <0.5ms)
  const digitPattern = /<(\d)/g;
  let match;
  while ((match = digitPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '<',
        reason: 'Less-than before number',
        replacement: useHtml ? '&lt;' : '\\<'
      });
    }
  }

  // Pattern 2: <= (less than or equal)
  const lePattern = /<=/g;
  while ((match = lePattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '<=',
        reason: 'Less-than-or-equal operator',
        replacement: useHtml ? '&lt;=' : '\\<='
      });
    }
  }

  // Pattern 3: >= (greater than or equal)
  const gePattern = />=/g;
  while ((match = gePattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '>=',
        reason: 'Greater-than-or-equal operator',
        replacement: useHtml ? '&gt;=' : '\\>='
      });
    }
  }

  // Pattern 4: <> (empty/diamond operator)
  const emptyPattern = /<>/g;
  while ((match = emptyPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '<>',
        reason: 'Empty angle brackets',
        replacement: useHtml ? '&lt;&gt;' : '\\<\\>'
      });
    }
  }

  // Pattern 5: <-- and --> (arrows)
  const leftArrowPattern = /<--/g;
  while ((match = leftArrowPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '<--',
        reason: 'Left arrow',
        replacement: useHtml ? '&lt;--' : '\\<--'
      });
    }
  }

  const rightArrowPattern = /-->/g;
  while ((match = rightArrowPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '-->',
        reason: 'Right arrow',
        replacement: useHtml ? '--&gt;' : '--\\>'
      });
    }
  }

  // Pattern 6: Generic types like Promise<T>, Array<string>, etc.
  // These appear OUTSIDE code blocks and should be escaped
  const genericPattern = /<([A-Za-z][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z][A-Za-z0-9_]*)*)>/g;
  while ((match = genericPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      // Check if this looks like a generic type (typically after a word boundary)
      const before = content.slice(Math.max(0, match.index - 50), match.index);
      const wordBeforeMatch = before.match(/([A-Za-z_][A-Za-z0-9_]*)$/);

      if (wordBeforeMatch) {
        // This is likely Word<T> pattern - a generic type
        const bracketContent = match[1];

        // Skip if it's a valid HTML element being used as JSX
        if (HTML_ELEMENTS.has(bracketContent.toLowerCase())) {
          continue;
        }

        matches.push({
          index: match.index,
          match: `<${bracketContent}>`,
          reason: 'Generic type parameter',
          replacement: useHtml ? `&lt;${bracketContent}&gt;` : `\\<${bracketContent}\\>`
        });
      }
    }
  }

  // Pattern 7: < followed by space (definitely not a tag)
  const spacedLtPattern = /<\s+\w/g;
  while ((match = spacedLtPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      matches.push({
        index: match.index,
        match: '<',
        reason: 'Less-than followed by space',
        replacement: useHtml ? '&lt;' : '\\<'
      });
    }
  }

  // Pattern 8: Invalid "tags" that aren't HTML or components
  // <word> where word is lowercase but not a valid HTML element
  const pseudoTagPattern = /<([a-z][a-z0-9-]*)(?:\s|>)/gi;
  while ((match = pseudoTagPattern.exec(content)) !== null) {
    if (!shouldSkip(match.index)) {
      const tagName = match[1].toLowerCase();

      // Skip valid HTML elements
      if (HTML_ELEMENTS.has(tagName)) continue;

      // Skip PascalCase (React components)
      if (/^[A-Z]/.test(match[1])) continue;

      matches.push({
        index: match.index,
        match: '<' + match[1],
        reason: `Invalid HTML tag "${tagName}"`,
        replacement: useHtml ? `&lt;${match[1]}` : `\\<${match[1]}`
      });
    }
  }

  // Deduplicate matches at same index (keep first)
  const seen = new Set<number>();
  return matches.filter(m => {
    if (seen.has(m.index)) return false;
    seen.add(m.index);
    return true;
  });
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Sanitize content for MDX compatibility
 *
 * @param content - Markdown/MDX content to sanitize
 * @param options - Sanitization options
 * @returns Sanitized content with issues fixed
 */
export function sanitizeForMdx(
  content: string,
  options: SanitizationOptions = {}
): SanitizationResult {
  const patterns = findProblematicPatterns(content, options);

  if (patterns.length === 0) {
    return { content, issues: [], modified: false };
  }

  // Sort by index descending to replace from end to start (preserves indices)
  const sorted = [...patterns].sort((a, b) => b.index - a.index);

  let result = content;
  const issues: SanitizationIssue[] = [];

  for (const pattern of sorted) {
    const pos = getPosition(content, pattern.index);

    issues.unshift({
      line: pos.line,
      column: pos.column,
      match: pattern.match,
      reason: pattern.reason,
      fix: pattern.replacement
    });

    // Apply the replacement
    result =
      result.slice(0, pattern.index) +
      pattern.replacement +
      result.slice(pattern.index + pattern.match.length);
  }

  return { content: result, issues, modified: true };
}

/**
 * Validate content for MDX safety without modifying
 *
 * @param content - Content to validate
 * @param filePath - File path for error reporting
 * @returns Array of issues found
 */
export function validateMdxSafety(
  content: string,
  _filePath?: string
): SanitizationIssue[] {
  const patterns = findProblematicPatterns(content, { useHtmlEntities: true });

  return patterns.map(pattern => {
    const pos = getPosition(content, pattern.index);
    return {
      line: pos.line,
      column: pos.column,
      match: pattern.match,
      reason: pattern.reason,
      fix: pattern.replacement
    };
  });
}

/**
 * Check if content is MDX-safe (no issues)
 */
export function isMdxSafe(content: string): boolean {
  const patterns = findProblematicPatterns(content, { useHtmlEntities: true });
  return patterns.length === 0;
}

/**
 * Get a human-readable report of issues
 */
export function formatIssuesReport(
  issues: SanitizationIssue[],
  filePath?: string
): string {
  if (issues.length === 0) {
    return filePath ? `✅ ${filePath}: No MDX issues` : '✅ No MDX issues';
  }

  const header = filePath
    ? `❌ ${filePath}: ${issues.length} MDX issue(s)`
    : `❌ ${issues.length} MDX issue(s)`;

  const details = issues.map(issue =>
    `   Line ${issue.line}: "${issue.match}" → "${issue.fix}" (${issue.reason})`
  ).join('\n');

  return `${header}\n${details}`;
}

/**
 * Process all markdown files in a directory
 */
export function processDirectory(
  dir: string,
  options: SanitizationOptions & { fix?: boolean } = {}
): { totalIssues: number; filesWithIssues: number; filesFixed: number } {
  const glob = require('glob');

  const files = glob.sync('**/*.md', {
    cwd: dir,
    absolute: true
  });

  let totalIssues = 0;
  let filesWithIssues = 0;
  let filesFixed = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const result = sanitizeForMdx(content, options);

    if (result.issues.length > 0) {
      filesWithIssues++;
      totalIssues += result.issues.length;

      const relativePath = path.relative(process.cwd(), file);

      if (options.verbose) {
        console.log(formatIssuesReport(result.issues, relativePath));
      }

      if (options.fix) {
        fs.writeFileSync(file, result.content, 'utf-8');
        filesFixed++;
        if (options.verbose) {
          console.log('   ✅ Fixed!\n');
        }
      }
    }
  }

  return { totalIssues, filesWithIssues, filesFixed };
}

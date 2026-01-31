#!/usr/bin/env npx tsx
/**
 * Validate Scraped Data
 *
 * Quick validation script to check scraped data quality.
 * Run after Firecrawl scrapes to identify issues.
 *
 * Usage:
 *   npx tsx .claude/skills/2026-legal-research-agent/scripts/validate-scraped-data.ts
 *   npx tsx .claude/skills/2026-legal-research-agent/scripts/validate-scraped-data.ts --state OR
 */

import * as fs from "fs";
import * as path from "path";

const SCRAPED_DIR = "src/data/scraped/states";

interface ValidationResult {
  state: string;
  file: string;
  issues: string[];
  warnings: string[];
}

interface ScrapedData {
  url?: string;
  title?: string;
  content?: string;
  scrapedAt?: string;
  [key: string]: unknown;
}

function validateStateData(stateCode: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const stateDir = path.join(SCRAPED_DIR, stateCode.toLowerCase());

  if (!fs.existsSync(stateDir)) {
    return [
      {
        state: stateCode,
        file: stateDir,
        issues: ["State directory does not exist"],
        warnings: [],
      },
    ];
  }

  const files = fs.readdirSync(stateDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(stateDir, file);
    const result: ValidationResult = {
      state: stateCode,
      file: file,
      issues: [],
      warnings: [],
    };

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const data: ScrapedData = JSON.parse(content);

      // Check for required fields
      if (!data.url) {
        result.issues.push("Missing 'url' field");
      }

      if (!data.scrapedAt) {
        result.warnings.push("Missing 'scrapedAt' timestamp");
      } else {
        // Check if data is stale (>90 days old)
        const scrapedDate = new Date(data.scrapedAt);
        const daysSinceScraped =
          (Date.now() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceScraped > 90) {
          result.warnings.push(
            `Data is ${Math.round(daysSinceScraped)} days old (>90 days)`
          );
        }
      }

      // Check content quality
      if (data.content) {
        if (data.content.length < 100) {
          result.warnings.push(
            `Content very short (${data.content.length} chars)`
          );
        }
        if (data.content.length > 500000) {
          result.warnings.push(
            `Content very long (${data.content.length} chars) - may be unprocessed HTML`
          );
        }
        if (data.content.includes("404") || data.content.includes("Not Found")) {
          result.issues.push("Content appears to be error page");
        }
      }

      // Validate URLs
      if (data.url) {
        try {
          new URL(data.url);
        } catch {
          result.issues.push(`Invalid URL format: ${data.url}`);
        }
      }

      // Check for state code mismatch
      if (data.url) {
        const urlLower = data.url.toLowerCase();
        const stateInUrl = detectStateFromUrl(urlLower);
        if (stateInUrl && stateInUrl !== stateCode.toUpperCase()) {
          result.issues.push(
            `URL suggests state ${stateInUrl}, but file is in ${stateCode.toUpperCase()} directory`
          );
        }
      }
    } catch (e) {
      result.issues.push(`Failed to parse JSON: ${e}`);
    }

    if (result.issues.length > 0 || result.warnings.length > 0) {
      results.push(result);
    }
  }

  return results;
}

function detectStateFromUrl(url: string): string | null {
  // Known URL patterns
  const patterns: Record<string, string> = {
    "oregon.public.law": "OR",
    "california.public.law": "OR",
    "courts.oregon.gov": "OR",
    "courts.ca.gov": "CA",
    "courts.wa.gov": "WA",
    // Add more as needed
  };

  for (const [pattern, code] of Object.entries(patterns)) {
    if (url.includes(pattern)) {
      return code;
    }
  }

  return null;
}

function getAllStateCodes(): string[] {
  if (!fs.existsSync(SCRAPED_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SCRAPED_DIR)
    .filter((f) => {
      const stat = fs.statSync(path.join(SCRAPED_DIR, f));
      return stat.isDirectory() && f !== "unknown";
    })
    .map((f) => f.toUpperCase());
}

function printResults(results: ValidationResult[]) {
  const hasIssues = results.some((r) => r.issues.length > 0);
  const hasWarnings = results.some((r) => r.warnings.length > 0);

  if (!hasIssues && !hasWarnings) {
    console.log("✅ All scraped data passed validation");
    return;
  }

  console.log("\n📋 Validation Results\n");

  for (const result of results) {
    if (result.issues.length > 0 || result.warnings.length > 0) {
      console.log(`\n${result.state}/${result.file}:`);

      for (const issue of result.issues) {
        console.log(`  ❌ ERROR: ${issue}`);
      }

      for (const warning of result.warnings) {
        console.log(`  ⚠️  WARN: ${warning}`);
      }
    }
  }

  console.log("\n---");
  console.log(`Total files with issues: ${results.filter((r) => r.issues.length > 0).length}`);
  console.log(`Total files with warnings: ${results.filter((r) => r.warnings.length > 0).length}`);
}

// Main execution
const args = process.argv.slice(2);
const stateArg = args.find((a) => a.startsWith("--state="))?.split("=")[1];
const singleState = args.includes("--state")
  ? args[args.indexOf("--state") + 1]
  : stateArg;

let statesToCheck: string[];

if (singleState) {
  statesToCheck = [singleState.toUpperCase()];
} else {
  statesToCheck = getAllStateCodes();
}

if (statesToCheck.length === 0) {
  console.log("No scraped data found in", SCRAPED_DIR);
  console.log("Run Firecrawl scrapes first.");
  process.exit(0);
}

console.log(`🔍 Validating scraped data for ${statesToCheck.length} states...`);

const allResults: ValidationResult[] = [];

for (const state of statesToCheck) {
  const results = validateStateData(state);
  allResults.push(...results);
}

printResults(allResults);

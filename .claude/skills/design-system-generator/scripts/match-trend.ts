#!/usr/bin/env npx ts-node
/**
 * Design Trend Matcher
 *
 * Matches natural language descriptions to design trends from gallery-sources.json
 *
 * Usage: npx ts-node match-trend.ts "description of desired design"
 *
 * Dependencies: npm install (uses project's typescript)
 */

import * as fs from 'fs';
import * as path from 'path';

interface Trend {
  id: string;
  name: string;
  description: string;
  status: string;
  examples?: string[];
  technologies?: string[];
  sources: string[];
}

interface MatchResult {
  trend: Trend;
  score: number;
  matchedKeywords: string[];
}

// Keyword mappings for each trend (shibboleths)
const TREND_KEYWORDS: Record<string, string[]> = {
  'swiss-modern': ['clean', 'minimal', 'grid', 'professional', 'tech', 'saas', 'dashboard', 'developer', 'linear', 'figma', 'stripe'],
  'neobrutalism': ['bold', 'stark', 'dramatic', 'raw', 'contrasting', 'indie', 'gumroad', 'creative', 'memorable', 'anti-design'],
  'glassmorphism': ['modern', 'transparent', 'blur', 'frosted', 'glass', 'elegant', 'ios', 'macos'],
  'neumorphism': ['soft', 'tactile', 'raised', 'inset', 'premium', 'ios', 'apple'],
  'dark-mode': ['dark', 'night', 'oled', 'eye strain', 'developer', 'coding'],
  'hyperminimalism': ['minimal', 'essential', 'calm', 'serene', 'peaceful', 'wellness', 'meditation', 'zen'],
  'maximalism': ['vibrant', 'colorful', 'rich', 'busy', 'entertainment', 'creative', 'expressive'],
  'cyberpunk': ['neon', 'tech', 'futuristic', 'bold', 'edgy', 'gaming', 'esports', 'synthwave'],
  'retrofuturism': ['vintage', 'sci-fi', 'chrome', 'pixel', 'arcade', 'retro', 'nostalgia'],
  '3d-immersive': ['interactive', 'webgl', 'ar', 'immersive', '3d', 'portfolio', 'showcase'],
  'motion-design': ['animated', 'micro', 'scroll', 'hover', 'engaging', 'dynamic'],
  'bold-typography': ['oversized', 'kinetic', 'variable', 'editorial', 'statement', 'type'],
  'collage': ['scrapbook', 'torn', 'cutout', 'hand-drawn', 'artistic', 'creative'],
  'sustainable-design': ['ethical', 'accessible', 'lean', 'green', 'eco', 'mission'],
  'claymorphism': ['clay', 'soft', 'rounded', 'playful', 'friendly', 'approachable', '3d'],
  'terminal-aesthetic': ['monospace', 'cli', 'hacker', 'green', 'developer', 'code'],
  'web3-crypto': ['gradient', 'blockchain', 'crypto', 'fintech', 'futuristic', 'glow', 'nft'],
  'botanical-organic': ['natural', 'earthy', 'plant', 'organic', 'wellness', 'eco', 'green'],
  'art-deco-revival': ['geometric', 'gold', 'luxury', '1920s', 'premium', 'fashion', 'elegant'],
  'gamified-design': ['game', 'points', 'badges', 'progress', 'reward', 'fun', 'interactive'],
  'vibrant-colors': ['y2k', 'neon', 'dopamine', 'playful', 'energetic', 'pop'],
  'scroll-driven-animations': ['scroll', 'parallax', 'view-timeline', 'modern', 'interactive'],
};

// Negative keywords (if present, reduce score)
const NEGATIVE_KEYWORDS: Record<string, string[]> = {
  'neobrutalism': ['soft', 'blur', 'gradient', 'subtle', 'elegant'],
  'glassmorphism': ['bold', 'stark', 'raw', 'hard'],
  'hyperminimalism': ['busy', 'colorful', 'vibrant', 'complex'],
  'dark-mode': ['light', 'bright', 'white'],
};

function loadTrends(catalogPath: string): Trend[] {
  const data = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  return data.trends2026 || [];
}

function matchTrends(description: string, trends: Trend[]): MatchResult[] {
  const descLower = description.toLowerCase();
  const words = descLower.split(/\s+/);

  const results: MatchResult[] = [];

  for (const trend of trends) {
    const keywords = TREND_KEYWORDS[trend.id] || [];
    const negatives = NEGATIVE_KEYWORDS[trend.id] || [];

    let score = 0;
    const matchedKeywords: string[] = [];

    // Positive matches
    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Partial word matches (less weight)
    for (const word of words) {
      for (const keyword of keywords) {
        if (keyword.includes(word) && word.length > 3 && !matchedKeywords.includes(keyword)) {
          score += 0.5;
          matchedKeywords.push(`~${keyword}`);
        }
      }
    }

    // Negative matches reduce score
    for (const negative of negatives) {
      if (descLower.includes(negative)) {
        score -= 0.5;
      }
    }

    // Also check trend's own description for matches
    const trendDescLower = trend.description.toLowerCase();
    for (const word of words) {
      if (word.length > 4 && trendDescLower.includes(word)) {
        score += 0.3;
      }
    }

    if (score > 0) {
      results.push({ trend, score, matchedKeywords });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

function calculateConfidence(topScore: number, secondScore: number): number {
  if (topScore === 0) return 0;
  if (secondScore === 0) return 0.95;

  const gap = topScore - secondScore;
  const confidence = Math.min(0.95, 0.5 + (gap / topScore) * 0.5);
  return Math.round(confidence * 100) / 100;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx ts-node match-trend.ts "description of desired design"');
  console.log('');
  console.log('Example: npx ts-node match-trend.ts "clean dashboard for developers"');
  process.exit(1);
}

const description = args.join(' ');
const catalogPath = path.resolve(__dirname, '../../../../website/design-catalog/gallery-sources.json');

if (!fs.existsSync(catalogPath)) {
  console.error(`Error: Design catalog not found at ${catalogPath}`);
  process.exit(1);
}

const trends = loadTrends(catalogPath);
const matches = matchTrends(description, trends);

if (matches.length === 0) {
  console.log('No matching trends found. Try a more descriptive query.');
  process.exit(0);
}

const primary = matches[0];
const secondary = matches[1];
const confidence = calculateConfidence(primary.score, secondary?.score || 0);

console.log(JSON.stringify({
  query: description,
  primary: {
    id: primary.trend.id,
    name: primary.trend.name,
    score: primary.score,
    matchedKeywords: primary.matchedKeywords,
    status: primary.trend.status
  },
  secondary: secondary ? {
    id: secondary.trend.id,
    name: secondary.trend.name,
    score: secondary.score,
    matchedKeywords: secondary.matchedKeywords
  } : null,
  confidence,
  reasoning: `Matched "${primary.trend.name}" based on keywords: ${primary.matchedKeywords.join(', ')}`
}, null, 2));

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface PlausibleBreakdownResult {
  skill: string;  // The property name from event:props:skill becomes the key
  visitors: number;
}

interface PlausibleBreakdownResponse {
  results: PlausibleBreakdownResult[];
}

interface SkillStats {
  skillId: string;
  views: number;
  lastUpdated: string;
}

interface SkillMetadata {
  generatedAt: string;
  skills: Record<string, { id: string }>;
}

// Simple hash function for consistent "random" baseline per skill
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate a consistent baseline for a skill (8-35 views)
function getBaseline(skillId: string): number {
  const hash = hashCode(skillId);
  return 8 + (hash % 28); // Range: 8-35
}

function getAllSkillIds(): string[] {
  const metadataPath = path.join(__dirname, '../src/data/skillMetadata.json');
  try {
    const data: SkillMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    return Object.keys(data.skills);
  } catch (error) {
    console.warn('⚠️  Could not read skill metadata, using empty list');
    return [];
  }
}

async function fetchPlausibleStats() {
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID || 'someclaudeskills.com';
  const allSkillIds = getAllSkillIds();

  if (!apiKey) {
    console.warn('⚠️  PLAUSIBLE_API_KEY not found. Using baseline data.');
    return generateBaselineStats(allSkillIds);
  }

  try {
    console.log('📊 Fetching Plausible stats...');

    // Fetch breakdown of "Skill Viewed" events by skill property
    const url = new URL('https://plausible.io/api/v1/stats/breakdown');
    url.searchParams.append('site_id', siteId);
    url.searchParams.append('period', '30d'); // Last 30 days
    url.searchParams.append('property', 'event:props:skill'); // Custom property from tracking
    url.searchParams.append('metrics', 'visitors');
    url.searchParams.append('filters', 'event:name==Skill Viewed');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Plausible API error: ${response.status} ${response.statusText}`);
    }

    const data: PlausibleBreakdownResponse = await response.json();

    // Build a map of real views
    const realViews = new Map<string, number>();
    for (const result of data.results) {
      realViews.set(result.skill, result.visitors);
    }

    console.log(`✅ Fetched real stats for ${realViews.size} skills`);

    // Generate stats for ALL skills: baseline + real views
    const now = new Date().toISOString();
    const stats: SkillStats[] = allSkillIds.map(skillId => ({
      skillId,
      views: getBaseline(skillId) + (realViews.get(skillId) || 0),
      lastUpdated: now,
    }));

    // Sort by views descending for nicer output
    stats.sort((a, b) => b.views - a.views);

    console.log(`📈 Generated stats for ${stats.length} skills (baseline + real)`);

    return stats;

  } catch (error) {
    console.error('❌ Error fetching Plausible stats:', error);
    console.warn('⚠️  Falling back to baseline data');
    return generateBaselineStats(allSkillIds);
  }
}

function generateBaselineStats(skillIds: string[]): SkillStats[] {
  console.log('🎲 Generating baseline stats...');

  const now = new Date().toISOString();
  return skillIds.map(skillId => ({
    skillId,
    views: getBaseline(skillId),
    lastUpdated: now,
  }));
}

async function main() {
  console.log('🚀 Starting Plausible stats fetch...\n');

  const stats = await fetchPlausibleStats();

  // Write to JSON file
  const outputPath = path.join(__dirname, '../src/data/plausibleStats.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));

  console.log(`\n✓ Stats written to ${outputPath}`);
  console.log(`✓ Total skills with stats: ${stats.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

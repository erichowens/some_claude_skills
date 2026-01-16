/**
 * Initialize Skill Embeddings Cache
 *
 * Precomputes embeddings for all available skills and stores them in cache.
 * Run this script after adding/modifying skills to update the cache.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/init-skill-embeddings.ts
 */

import { loadAvailableSkills } from '../src/dag/registry/skill-loader';
import { EmbeddingService } from '../src/dag/core/embedding-service';
import { EmbeddingCache } from '../src/dag/core/embedding-cache';
import * as path from 'path';

async function main() {
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: OPENAI_API_KEY environment variable not set');
    console.error('Usage: OPENAI_API_KEY=sk-... npx tsx scripts/init-skill-embeddings.ts');
    process.exit(1);
  }

  console.log('🚀 Initializing skill embeddings cache...\n');

  // Load all skills
  const skills = loadAvailableSkills();
  console.log(`📚 Loaded ${skills.length} skills\n`);

  // Initialize services
  const embeddingService = new EmbeddingService({
    apiKey,
    model: 'text-embedding-3-small',
  });

  const cachePath = path.join(process.cwd(), '.cache', 'skill-embeddings.json');
  const embeddingCache = new EmbeddingCache({
    cachePath,
    autoSave: false, // Manual save at end for performance
  });

  // Check which skills need embeddings
  const missing = embeddingCache.findMissing(skills);

  if (missing.length === 0) {
    console.log('✅ All skills already have embeddings cached');
    console.log('\nCache stats:');
    const stats = embeddingCache.getStats();
    console.log(`  Total embeddings: ${stats.totalEmbeddings}`);
    console.log(`  Last updated: ${stats.lastUpdated.toLocaleString()}`);
    console.log(`  Model: ${stats.model}`);
    console.log(`  Cache size: ${(stats.cacheSize / 1024).toFixed(2)} KB`);
    return;
  }

  console.log(`🔧 Need to compute embeddings for ${missing.length} skills\n`);

  // Build text for each skill
  const buildSkillText = (skill: typeof skills[0]): string => {
    const parts = [
      skill.name,
      skill.description,
      skill.tags.join(', '),
    ];
    return parts.filter(p => p && p.length > 0).join('. ');
  };

  const texts = missing.map(skill => buildSkillText(skill));

  // Batch process (OpenAI supports max 2048 per batch)
  const batchSize = 100; // Conservative batch size
  let processed = 0;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batchTexts = texts.slice(i, i + batchSize);
    const batchSkills = missing.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batchSkills.length} skills)...`);

    try {
      const results = await embeddingService.embedBatch(batchTexts);

      // Cache the embeddings
      embeddingCache.setBatch(
        batchSkills.map((skill, idx) => ({
          skillId: skill.id,
          embedding: results[idx].embedding,
          model: results[idx].model,
          description: skill.description,
        }))
      );

      processed += batchSkills.length;
      console.log(`  ✓ Cached ${processed}/${texts.length} embeddings`);

      // Add delay between batches to avoid rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ✗ Error processing batch:`, error);
      throw error;
    }
  }

  // Save cache
  console.log('\n💾 Saving cache...');
  embeddingCache.save();

  // Show stats
  console.log('\n✅ Done! Cache stats:');
  const stats = embeddingCache.getStats();
  console.log(`  Total embeddings: ${stats.totalEmbeddings}`);
  console.log(`  Last updated: ${stats.lastUpdated.toLocaleString()}`);
  console.log(`  Model: ${stats.model}`);
  console.log(`  Cache size: ${(stats.cacheSize / 1024).toFixed(2)} KB`);
  console.log(`  Cache location: ${cachePath}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

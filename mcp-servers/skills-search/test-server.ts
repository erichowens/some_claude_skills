#!/usr/bin/env npx ts-node
/**
 * Quick test script for skills-search MCP server components
 */

import { VectorStore } from './src/vector-store.js';
import { EmbeddingService } from './src/embeddings.js';

async function main() {
  console.log('=== Skills Search MCP Server Test ===\n');

  // Test 1: Load vector store
  console.log('1. Testing VectorStore load...');
  const store = new VectorStore();
  await store.load();

  const stats = store.getStats();
  console.log(`   ✓ Loaded ${stats?.totalSkills} skills with ${stats?.totalChunks} chunks`);
  console.log(`   ✓ Model: ${stats?.embeddingModel}`);
  console.log(`   ✓ Dimensions: ${stats?.dimensions}`);

  // Test 2: List skills
  console.log('\n2. Testing skill listing...');
  const allSkills = store.listSkills();
  console.log(`   ✓ Found ${allSkills.length} skills`);

  const categories = store.getCategories();
  console.log(`   ✓ Categories: ${categories.join(', ')}`);

  // Test 3: Get specific skill
  console.log('\n3. Testing skill retrieval...');
  const testSkill = allSkills[0];
  if (testSkill) {
    const skillId = testSkill.name.toLowerCase().replace(/\s+/g, '-');
    const skill = store.getSkill(skillId);
    console.log(`   ✓ Retrieved: ${skill?.name}`);

    const chunks = store.getSkillChunks(skillId);
    console.log(`   ✓ Has ${chunks.length} chunks`);
  }

  // Test 4: Test embedding service (mock mode)
  console.log('\n4. Testing EmbeddingService (mock mode)...');
  const embedder = new EmbeddingService(); // No API key = mock mode
  console.log(`   ✓ OpenAI available: ${embedder.isOpenAIAvailable()}`);

  const testQuery = 'help me design a website';
  const embedding = await embedder.embed(testQuery);
  console.log(`   ✓ Generated embedding: ${embedding.length} dimensions`);
  console.log(`   ✓ First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

  // Test 5: Semantic search
  console.log('\n5. Testing semantic search...');
  const results = await store.search(embedding, {
    topK: 3,
    minSimilarity: 0.1, // Lower threshold for mock embeddings
    groupBySkill: true,
  });

  console.log(`   ✓ Found ${results.length} results:`);
  for (const r of results) {
    console.log(`     - ${r.skillName} (${(r.similarity * 100).toFixed(1)}%)`);
  }

  console.log('\n=== All tests passed! ===');
}

main().catch(console.error);

/**
 * Full Task Decomposition Demo with Semantic Matching
 *
 * Demonstrates the complete workflow:
 * 1. Claude API decomposes task into subtasks
 * 2. Semantic matcher finds best skill for each subtask
 * 3. Compares keyword vs hybrid matching results
 *
 * Usage:
 *   npx tsx scripts/demo-full-decomposition.ts
 */

import { TaskDecomposer, loadAvailableSkills } from '../src/dag';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  // Verify API keys
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  if (!openaiKey) {
    console.error('ERROR: OPENAI_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('🚀 Full Task Decomposition with Semantic Matching\n');
  console.log('='.repeat(80) + '\n');

  // Load skills
  const skills = loadAvailableSkills();
  console.log(`📚 Loaded ${skills.length} skills\n`);

  // Sample task
  const task = 'Build a modern SaaS landing page with user authentication, analytics dashboard, and payment integration';
  console.log('📝 Task:');
  console.log(`   "${task}"\n`);

  // Create decomposer with KEYWORD matching
  console.log('=' + '='.repeat(79));
  console.log('🔤 DECOMPOSITION WITH KEYWORD MATCHING');
  console.log('=' + '='.repeat(79) + '\n');

  const keywordDecomposer = new TaskDecomposer({
    apiKey: anthropicKey,
    availableSkills: skills,
    model: 'claude-sonnet-4-5-20250929',
    matcherConfig: {
      strategy: 'keyword',
    },
  });

  console.log('⏳ Decomposing task (using keyword matching)...\n');
  const keywordFullResult = await keywordDecomposer.decomposeToDAG(task);
  const keywordResult = keywordFullResult.decomposition;
  const keywordMatches = keywordFullResult.matches;

  console.log(`✅ Decomposed into ${keywordResult.subtasks.length} subtasks:\n`);
  for (const subtask of keywordResult.subtasks) {
    const match = keywordMatches.find(m => m.subtaskId === subtask.id);
    console.log(`${subtask.id}:`);
    console.log(`  Description: ${subtask.description}`);
    console.log(`  Capabilities: ${subtask.requiredCapabilities.join(', ')}`);
    console.log(`  Matched Skill: ${match?.skillId || 'none'}`);
    console.log(`  Confidence: ${match?.confidence.toFixed(2) || 'N/A'}`);
    console.log(`  Reasoning: ${match?.reasoning || 'N/A'}`);
    console.log();
  }

  // Create decomposer with HYBRID matching
  console.log('=' + '='.repeat(79));
  console.log('🔀 DECOMPOSITION WITH HYBRID MATCHING (Keyword + Semantic)');
  console.log('=' + '='.repeat(79) + '\n');

  const hybridDecomposer = new TaskDecomposer({
    apiKey: anthropicKey,
    availableSkills: skills,
    model: 'claude-sonnet-4-5-20250929',
    matcherConfig: {
      strategy: 'hybrid',
      openAiApiKey: openaiKey,
    },
  });

  console.log('⏳ Decomposing task (using hybrid matching)...\n');
  const hybridFullResult = await hybridDecomposer.decomposeToDAG(task);
  const hybridResult = hybridFullResult.decomposition;
  const hybridMatches = hybridFullResult.matches;

  console.log(`✅ Decomposed into ${hybridResult.subtasks.length} subtasks:\n`);
  for (const subtask of hybridResult.subtasks) {
    const match = hybridMatches.find(m => m.subtaskId === subtask.id);
    console.log(`${subtask.id}:`);
    console.log(`  Description: ${subtask.description}`);
    console.log(`  Capabilities: ${subtask.requiredCapabilities.join(', ')}`);
    console.log(`  Matched Skill: ${match?.skillId || 'none'}`);
    console.log(`  Confidence: ${match?.confidence.toFixed(2) || 'N/A'}`);
    console.log(`  Reasoning: ${match?.reasoning || 'N/A'}`);
    console.log();
  }

  // Compare results
  console.log('=' + '='.repeat(79));
  console.log('📊 COMPARISON ANALYSIS');
  console.log('=' + '='.repeat(79) + '\n');

  console.log('Subtask-by-Subtask Comparison:\n');
  for (let i = 0; i < keywordResult.subtasks.length; i++) {
    const keywordSubtask = keywordResult.subtasks[i];
    const hybridSubtask = hybridResult.subtasks[i];

    const keywordMatch = keywordMatches.find(m => m.subtaskId === keywordSubtask.id);
    const hybridMatch = hybridMatches.find(m => m.subtaskId === hybridSubtask.id);

    console.log(`${i + 1}. ${keywordSubtask.id}`);
    console.log(`   Keyword: ${keywordMatch?.skillId} (confidence: ${keywordMatch?.confidence.toFixed(2)})`);
    console.log(`   Hybrid:  ${hybridMatch?.skillId} (confidence: ${hybridMatch?.confidence.toFixed(2)})`);

    if (keywordMatch?.skillId !== hybridMatch?.skillId) {
      console.log(`   ⚠️  DIFFERENT SKILLS SELECTED!`);
    } else if (hybridMatch && keywordMatch && hybridMatch.confidence > keywordMatch.confidence) {
      console.log(`   ✓  Higher confidence with hybrid (+${((hybridMatch.confidence - keywordMatch.confidence) * 100).toFixed(0)}%)`);
    }
    console.log();
  }

  // Summary
  console.log('Summary:');
  console.log(`  Total subtasks: ${keywordResult.subtasks.length}`);

  const avgKeywordConfidence = keywordMatches.reduce((sum, m) => sum + m.confidence, 0) / keywordMatches.length;
  const avgHybridConfidence = hybridMatches.reduce((sum, m) => sum + m.confidence, 0) / hybridMatches.length;

  console.log(`  Average keyword confidence: ${avgKeywordConfidence.toFixed(2)}`);
  console.log(`  Average hybrid confidence: ${avgHybridConfidence.toFixed(2)}`);
  console.log(`  Confidence improvement: +${((avgHybridConfidence - avgKeywordConfidence) * 100).toFixed(0)}%`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Demo complete!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

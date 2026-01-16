/**
 * Demo: Semantic vs Keyword Skill Matching
 *
 * Compares semantic and keyword matching strategies on sample subtasks.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/demo-semantic-matching.ts
 */

import { loadAvailableSkills } from '../src/dag/registry/skill-loader';
import { SkillMatcher } from '../src/dag/core/skill-matcher';
import type { Subtask } from '../src/dag/core/task-decomposer';

// Sample subtasks for comparison
const sampleSubtasks: Subtask[] = [
  {
    id: 'design-landing-page',
    description: 'Create an attractive landing page with modern design aesthetics',
    prompt: 'Design a landing page',
    dependencies: [],
    requiredCapabilities: ['ui-design', 'web-design', 'visual-design'],
  },
  {
    id: 'optimize-database',
    description: 'Improve database query performance and add indexes',
    prompt: 'Optimize database queries',
    dependencies: [],
    requiredCapabilities: ['database', 'performance', 'sql'],
  },
  {
    id: 'implement-authentication',
    description: 'Build a secure user authentication system with JWT tokens',
    prompt: 'Implement auth',
    dependencies: [],
    requiredCapabilities: ['security', 'authentication', 'backend'],
  },
  {
    id: 'analyze-user-behavior',
    description: 'Study how users interact with the application and identify patterns',
    prompt: 'Analyze user behavior',
    dependencies: [],
    requiredCapabilities: ['analytics', 'data-analysis', 'user-research'],
  },
];

async function main() {
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: OPENAI_API_KEY environment variable not set');
    console.error('Usage: OPENAI_API_KEY=sk-... npx tsx scripts/demo-semantic-matching.ts');
    console.error('\nAlternatively, you can run keyword-only demo:');
    console.error('npx tsx scripts/demo-semantic-matching.ts --keyword-only');
    process.exit(1);
  }

  console.log('🎯 Semantic vs Keyword Skill Matching Demo\n');
  console.log('='.repeat(80) + '\n');

  // Load skills
  const skills = loadAvailableSkills();
  console.log(`📚 Loaded ${skills.length} skills\n`);

  // Create matchers
  const keywordMatcher = new SkillMatcher({
    strategy: 'keyword',
  });

  const semanticMatcher = new SkillMatcher({
    strategy: 'semantic',
    openAiApiKey: apiKey,
  });

  const hybridMatcher = new SkillMatcher({
    strategy: 'hybrid',
    openAiApiKey: apiKey,
  });

  // Compare results for each subtask
  for (const subtask of sampleSubtasks) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Task: ${subtask.description}`);
    console.log(`Capabilities: ${subtask.requiredCapabilities.join(', ')}`);
    console.log('─'.repeat(80));

    // Keyword matching
    console.log('\n📝 KEYWORD MATCHING:');
    const keywordResult = await keywordMatcher.findBestMatch(subtask, skills);
    console.log(`  Skill: ${keywordResult.skillId}`);
    console.log(`  Confidence: ${keywordResult.confidence.toFixed(2)}`);
    console.log(`  Reasoning: ${keywordResult.reasoning}`);

    // Semantic matching
    console.log('\n🧠 SEMANTIC MATCHING:');
    try {
      const semanticResult = await semanticMatcher.findBestMatch(subtask, skills);
      console.log(`  Skill: ${semanticResult.skillId}`);
      console.log(`  Confidence: ${semanticResult.confidence.toFixed(2)}`);
      console.log(`  Reasoning: ${semanticResult.reasoning}`);
    } catch (error) {
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Hybrid matching
    console.log('\n🔀 HYBRID MATCHING:');
    try {
      const hybridResult = await hybridMatcher.findBestMatch(subtask, skills);
      console.log(`  Skill: ${hybridResult.skillId}`);
      console.log(`  Confidence: ${hybridResult.confidence.toFixed(2)}`);
      console.log(`  Reasoning: ${hybridResult.reasoning}`);
    } catch (error) {
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Comparison
    const keywordSkill = skills.find(s => s.id === keywordResult.skillId);
    console.log(`\n📊 Analysis:`);
    console.log(`  Keyword choice: ${keywordSkill?.name || keywordResult.skillId}`);
    console.log(`  Categories: ${keywordSkill?.categories.join(', ') || 'N/A'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Demo complete!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Test User's Actual Task
 */

import { TaskDecomposer } from '../core/task-decomposer';
import { createDecomposerConfig } from '../registry/skill-loader';

const USER_TASK = `Please modernize someclaudeskills.com. Make it much more compelling to the following users:
- the newbie to AI landing on the web page
- a software developer conversant in AI tools, heavily steeped in the developer community
- an ADHD dilettante
- a potential employer of the site's creator
- a friend of the site's creator not conversant in AI or tech at all

Minimize UX friction, optimize SEO, make it beautiful as hell and unique.`;

async function main() {
  console.log('🎯 Testing Task Decomposition\n');
  console.log('Task:', USER_TASK);
  console.log('\n' + '='.repeat(70) + '\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY required');
    process.exit(1);
  }

  const config = createDecomposerConfig({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const decomposer = new TaskDecomposer(config);

  console.log('⏳ Decomposing task...\n');
  const decomposition = await decomposer.decompose(USER_TASK);

  console.log('✅ Decomposition complete!\n');
  console.log(`Strategy: ${decomposition.strategy}`);
  console.log(`Complexity: ${decomposition.complexity}/10`);
  console.log(`Subtasks: ${decomposition.subtasks.length}\n`);

  console.log('📊 Subtasks:\n');
  for (const subtask of decomposition.subtasks) {
    console.log(`${subtask.id}:`);
    console.log(`  Description: ${subtask.description}`);
    console.log(`  Dependencies: ${subtask.dependencies.length === 0 ? 'None' : subtask.dependencies.join(', ')}`);
    console.log(`  Capabilities: ${subtask.requiredCapabilities.join(', ')}`);
    console.log();
  }

  console.log('🎯 Matching skills...\n');
  const matches = await decomposer.matchSkills(decomposition);

  console.log('🔗 Skill Matches:\n');
  for (const match of matches) {
    console.log(`${match.subtaskId} → ${match.skillId}`);
    console.log(`  Confidence: ${(match.confidence * 100).toFixed(0)}%`);
    console.log(`  Reasoning: ${match.reasoning}`);
    console.log();
  }

  console.log('📐 Building DAG...\n');
  const dag = decomposer.buildDAG(decomposition, matches);

  console.log(`DAG ID: ${dag.id}`);
  console.log(`Nodes: ${dag.nodes.size}`);
  console.log(`Edges: ${dag.edges.size}\n`);

  // Show DAG structure
  console.log('🌳 DAG Structure:\n');
  for (const [nodeId, node] of dag.nodes) {
    console.log(`${nodeId}:`);
    console.log(`  Type: ${node.type}`);
    console.log(`  Skill: ${node.skillId || 'N/A'}`);
    console.log(`  Dependencies: ${node.dependencies.length === 0 ? 'None' : node.dependencies.join(', ')}`);
    console.log();
  }

  // Save to file
  const fs = await import('fs/promises');
  await fs.writeFile('user-task-dag.json', JSON.stringify({
    task: USER_TASK,
    decomposition,
    matches,
    dag: {
      id: dag.id,
      nodes: Array.from(dag.nodes.entries()).map(([id, node]) => ({ id, ...node })),
      edges: Array.from(dag.edges.entries()).map(([from, to]) => ({ from, to })),
    },
  }, null, 2));

  console.log('💾 Saved to: user-task-dag.json\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

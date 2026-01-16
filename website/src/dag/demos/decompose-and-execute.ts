#!/usr/bin/env npx tsx
/**
 * Task Decomposition → DAG Execution Demo
 *
 * Shows the full pipeline from arbitrary natural language task
 * to executable DAG.
 *
 * Run with: npx tsx src/dag/demos/decompose-and-execute.ts
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import { TaskDecomposer } from '../core/task-decomposer';
import { ClaudeCodeRuntime } from '../runtimes/claude-code-cli';
import { createDecomposerConfig } from '../registry/skill-loader';
import { STANDARD_PERMISSIONS } from '../permissions/presets';

// Test tasks - from simple to complex
const TEST_TASKS = {
  simple: 'Build me a landing page for a SaaS product',
  moderate: 'Create a comprehensive code review report for a pull request',
  complex: 'Research quantum computing and write a technical whitepaper',
};

async function main() {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable required');
    console.log('\nSet it in your shell:');
    console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
    console.log('\nOr create a .env file in the website directory');
    process.exit(1);
  }

  console.log('🎯 Task Decomposition → DAG Execution Pipeline\n');
  console.log('='.repeat(70));

  // Get task from command line or use default
  const taskName = (process.argv[2] || 'simple') as keyof typeof TEST_TASKS;
  const task = TEST_TASKS[taskName] || TEST_TASKS.simple;

  console.log(`\n📝 Task: "${task}"`);
  console.log(`   Complexity: ${taskName}\n`);

  // Step 1: Initialize decomposer
  console.log('⚙️  Step 1: Initializing TaskDecomposer...\n');

  const config = createDecomposerConfig({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  console.log(`   Model: ${config.model}`);
  console.log(`   Available skills: ${config.availableSkills.length}`);
  console.log(`   Max subtasks: ${config.maxSubtasks}\n`);

  const decomposer = new TaskDecomposer(config);

  // Step 2: Decompose the task
  console.log('🔍 Step 2: Decomposing task...\n');

  const startDecompose = Date.now();
  const decomposition = await decomposer.decompose(task);
  const decomposeTime = Date.now() - startDecompose;

  console.log(`   Strategy: ${decomposition.strategy}`);
  console.log(`   Complexity: ${decomposition.complexity}/10`);
  console.log(`   Subtasks: ${decomposition.subtasks.length}`);
  console.log(`   Time: ${decomposeTime}ms\n`);

  // Show subtasks
  console.log('📊 Subtasks:\n');
  for (const subtask of decomposition.subtasks) {
    console.log(`   ${subtask.id}:`);
    console.log(`     Description: ${subtask.description}`);
    console.log(`     Dependencies: ${subtask.dependencies.length === 0 ? 'None' : subtask.dependencies.join(', ')}`);
    console.log(`     Capabilities: ${subtask.requiredCapabilities.join(', ')}`);
    console.log();
  }

  // Step 3: Match skills
  console.log('🎯 Step 3: Matching skills to subtasks...\n');

  const startMatch = Date.now();
  const matches = await decomposer.matchSkills(decomposition);
  const matchTime = Date.now() - startMatch;

  console.log(`   Matches found: ${matches.length}`);
  console.log(`   Time: ${matchTime}ms\n`);

  // Show matches
  console.log('🔗 Skill Matches:\n');
  for (const match of matches) {
    const subtask = decomposition.subtasks.find(st => st.id === match.subtaskId);
    console.log(`   ${match.subtaskId} → ${match.skillId}`);
    console.log(`     Confidence: ${(match.confidence * 100).toFixed(0)}%`);
    console.log(`     Reasoning: ${match.reasoning}`);
    if (subtask) {
      console.log(`     Prompt: "${subtask.prompt.substring(0, 60)}..."`);
    }
    console.log();
  }

  // Step 4: Build DAG
  console.log('📐 Step 4: Building DAG...\n');

  const dag = decomposer.buildDAG(decomposition, matches);

  console.log(`   DAG ID: ${dag.id}`);
  console.log(`   Nodes: ${dag.nodes.size}`);
  console.log(`   Edges: ${dag.edges.size}`);
  console.log(`   Inputs: ${dag.inputs.length}`);
  console.log(`   Outputs: ${dag.outputs.length}\n`);

  // Show DAG structure
  console.log('🌳 DAG Structure:\n');
  for (const [nodeId, node] of dag.nodes) {
    console.log(`   ${nodeId}:`);
    console.log(`     Type: ${node.type}`);
    console.log(`     Skill: ${node.skillId || 'N/A'}`);
    console.log(`     Dependencies: ${node.dependencies.length === 0 ? 'None' : node.dependencies.join(', ')}`);
    console.log();
  }

  // Step 5: Generate execution plan
  console.log('📋 Step 5: Generating execution plan...\n');

  const runtime = new ClaudeCodeRuntime({
    permissions: STANDARD_PERMISSIONS,
    defaultModel: 'sonnet',
  });

  const plan = runtime.generateExecutionPlan(dag);

  if (plan.error) {
    console.error(`   ❌ Error: ${plan.error}\n`);
    return;
  }

  console.log(`   Total waves: ${plan.totalWaves}`);
  console.log(`   Total nodes: ${plan.totalNodes}\n`);

  // Show execution waves
  console.log('🌊 Execution Waves:\n');
  for (const wave of plan.waves) {
    console.log(`   Wave ${wave.waveNumber + 1}:`);
    console.log(`     Nodes: [${wave.nodeIds.join(', ')}]`);
    console.log(`     Parallelizable: ${wave.parallelizable ? 'Yes' : 'No'}`);

    // Show task calls for this wave
    for (const [nodeId, taskCall] of Object.entries(wave.taskCalls)) {
      console.log(`\n     ${nodeId}:`);
      console.log(`       Subagent: ${taskCall.subagent_type}`);
      console.log(`       Model: ${taskCall.model}`);
      console.log(`       Description: ${taskCall.description}`);
    }
    console.log();
  }

  // Step 6: Summary
  console.log('='.repeat(70));
  console.log('\n✨ Summary:\n');
  console.log(`   Original task: "${task}"`);
  console.log(`   Decomposition: ${decomposition.subtasks.length} subtasks in ${decomposeTime}ms`);
  console.log(`   Skill matching: ${matches.length} matches in ${matchTime}ms`);
  console.log(`   Execution plan: ${plan.totalWaves} waves, ${plan.totalNodes} nodes`);
  console.log(`   Max parallelism: ${Math.max(...plan.waves.map(w => w.nodeIds.length))}`);
  console.log();

  // Next steps
  console.log('📌 Next Steps:\n');
  console.log('   To execute this DAG for real:');
  console.log('   1. Wire runtime.execute() to actually call the Task tool');
  console.log('   2. Pass the DAG: runtime.execute(dag)');
  console.log('   3. Results will come from parallel agent execution\n');

  // Export the DAG
  console.log('💾 Saving DAG to file...\n');
  const fs = await import('fs/promises');
  const dagJson = JSON.stringify({
    task,
    decomposition,
    matches,
    dag: {
      id: dag.id,
      name: dag.name,
      nodes: Array.from(dag.nodes.entries()).map(([id, node]) => ({
        id,
        type: node.type,
        skillId: node.skillId,
        dependencies: node.dependencies,
      })),
      edges: Array.from(dag.edges.entries()).map(([from, tos]) => ({
        from,
        to: tos,
      })),
    },
    plan,
  }, null, 2);

  await fs.writeFile('generated-dag.json', dagJson);
  console.log('   ✅ Saved to: generated-dag.json\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Real DAG Execution Demo
 *
 * This demonstrates the FULL pipeline from task to execution:
 * 1. Decompose natural language task
 * 2. Match skills
 * 3. Build DAG
 * 4. Generate execution plan
 * 5. Execute using real Task tool calls (simulated in TypeScript)
 *
 * Note: Real Task tool calls can only be made by Claude Code itself.
 * This script shows how to prepare the execution plan that Claude Code
 * would use to make parallel Task calls.
 *
 * Run with: npx tsx src/dag/demos/execute-real-dag.ts
 */

import { TaskDecomposer } from '../core/task-decomposer';
import { ClaudeCodeRuntime } from '../runtimes/claude-code-cli';
import { createDecomposerConfig } from '../registry/skill-loader';
import { STANDARD_PERMISSIONS } from '../permissions/presets';
import type { DAG, NodeId } from '../types';

// Example task
const TASK = 'Create a simple landing page with hero section and contact form';

async function main() {
  console.log('🎯 Full DAG Execution Pipeline\n');
  console.log('='.repeat(70));
  console.log();

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY required');
    console.log('Set in .env or export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }

  // Step 1: Decompose task
  console.log('📋 Step 1: Task Decomposition\n');
  console.log(`Task: "${TASK}"\n`);

  const config = createDecomposerConfig({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const decomposer = new TaskDecomposer(config);
  const { decomposition, matches, dag } = await decomposer.decomposeToDAG(TASK);

  console.log(`✅ Decomposed into ${decomposition.subtasks.length} subtasks`);
  console.log(`✅ Matched ${matches.length} skills`);
  console.log(`✅ Built DAG: ${dag.nodes.size} nodes, ${dag.edges.size} edges\n`);

  // Step 2: Generate execution plan
  console.log('📐 Step 2: Execution Planning\n');

  const runtime = new ClaudeCodeRuntime({
    permissions: STANDARD_PERMISSIONS,
    defaultModel: 'sonnet',
  });

  const plan = runtime.generateExecutionPlan(dag);

  if (plan.error) {
    console.error(`❌ Planning failed: ${plan.error}\n`);
    return;
  }

  console.log(`✅ Generated ${plan.totalWaves} waves`);
  console.log(`✅ Max parallelism: ${Math.max(...plan.waves.map(w => w.nodeIds.length))}\n`);

  // Step 3: Show execution script for Claude Code
  console.log('🚀 Step 3: Execution Instructions for Claude Code\n');
  console.log('='.repeat(70));
  console.log();

  generateClaudeCodeScript(plan, dag);

  // Step 4: Show what real execution would look like
  console.log('\n📊 Step 4: Simulated Execution\n');
  console.log('='.repeat(70));
  console.log();

  await simulateExecution(plan);

  console.log('\n✨ Summary\n');
  console.log('The DAG framework is fully operational:');
  console.log('  ✅ Task decomposition works');
  console.log('  ✅ Skill matching works');
  console.log('  ✅ DAG construction works');
  console.log('  ✅ Execution planning works');
  console.log('  ⚠️  Real Task calls require Claude Code environment');
  console.log();
  console.log('To execute for real:');
  console.log('  1. Copy the generated script above');
  console.log('  2. Paste it into a Claude Code conversation');
  console.log('  3. Claude Code will make the actual Task tool calls');
  console.log();
}

/**
 * Generate a script that Claude Code can use to execute the DAG
 */
function generateClaudeCodeScript(plan: any, dag: DAG) {
  console.log('Copy this into Claude Code to execute the DAG:\n');
  console.log('```typescript');
  console.log('// DAG Execution Script');
  console.log('// This shows what Claude Code should do\n');

  for (const wave of plan.waves) {
    console.log(`// Wave ${wave.waveNumber + 1}: ${wave.nodeIds.length} task(s)`);

    if (wave.parallelizable && wave.nodeIds.length > 1) {
      console.log('// These tasks can run in parallel');
      console.log('// Make all Task calls in a single message:\n');

      for (const nodeId of wave.nodeIds) {
        const taskCall = wave.taskCalls[nodeId];
        const node = dag.nodes.get(nodeId as NodeId);

        console.log(`// Task ${wave.nodeIds.indexOf(nodeId) + 1}/${wave.nodeIds.length}: ${nodeId}`);
        console.log('Task({');
        console.log(`  description: "${taskCall.description}",`);
        console.log(`  subagent_type: "${taskCall.subagent_type}",`);
        console.log(`  model: "${taskCall.model}",`);
        console.log(`  prompt: \`${taskCall.prompt.substring(0, 100)}...\``);
        console.log('});\n');
      }
    } else {
      // Sequential execution
      const nodeId = wave.nodeIds[0];
      const taskCall = wave.taskCalls[nodeId];

      console.log(`// Sequential task: ${nodeId}`);
      console.log('Task({');
      console.log(`  description: "${taskCall.description}",`);
      console.log(`  subagent_type: "${taskCall.subagent_type}",`);
      console.log(`  model: "${taskCall.model}",`);
      console.log(`  prompt: \`${taskCall.prompt.substring(0, 100)}...\``);
      console.log('});\n');
    }

    console.log('// Wait for wave to complete before continuing\n');
  }

  console.log('```\n');
}

/**
 * Simulate what execution would look like
 */
async function simulateExecution(plan: any) {
  console.log('Simulating wave-by-wave execution:\n');

  for (const wave of plan.waves) {
    const waveNum = wave.waveNumber + 1;
    const totalWaves = plan.totalWaves;

    console.log(`┌─ Wave ${waveNum}/${totalWaves} ─────────────────────────────────────┐`);
    console.log(`│ Nodes: ${wave.nodeIds.length}`);
    console.log(`│ Parallel: ${wave.parallelizable ? 'Yes' : 'No'}`);
    console.log(`└────────────────────────────────────────────────────┘\n`);

    for (const nodeId of wave.nodeIds) {
      const taskCall = wave.taskCalls[nodeId];

      console.log(`  🔄 Starting: ${nodeId}`);
      console.log(`     Agent: ${taskCall.subagent_type}`);
      console.log(`     Model: ${taskCall.model}`);

      // Simulate execution time
      await sleep(wave.parallelizable ? 500 : 1000);

      console.log(`  ✅ Completed: ${nodeId}\n`);
    }

    console.log(`  Wave ${waveNum} complete!\n`);
  }

  console.log('🎉 All waves executed successfully!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

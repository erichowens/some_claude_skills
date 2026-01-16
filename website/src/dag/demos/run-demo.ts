#!/usr/bin/env npx tsx
/**
 * DAG Framework Live Demo
 *
 * Run with: npx tsx src/dag/demos/run-demo.ts
 */

import {
  dag,
  ClaudeCodeRuntime,
  STANDARD_PERMISSIONS,
  topologicalSort,
  validateDAG,
} from '../index';

async function main() {
  console.log('🚀 DAG Framework Demo\n');
  console.log('='.repeat(60));

  // 1. Build the workflow
  console.log('\n📊 Step 1: Building DAG...\n');

  const workflow = dag('research-pipeline')
    .skillNode('research', 'comprehensive-researcher')
      .prompt('Research: {{topic}}')
      .done()
    .skillNode('summarize', 'technical-writer')
      .dependsOn('research')
      .prompt('Summarize the research findings')
      .done()
    .inputs('topic')
    .outputs({ name: 'summary', from: 'summarize' })
    .build();

  console.log(`✅ Created DAG: "${workflow.name}"`);
  console.log(`   ID: ${workflow.id}`);
  console.log(`   Nodes: ${workflow.nodes.size}`);

  // Show nodes
  console.log('\n   Nodes:');
  for (const [id, node] of workflow.nodes) {
    console.log(`     - ${id} (${node.type}) → skill: ${node.skillId || 'N/A'}`);
    if (node.dependencies.length > 0) {
      console.log(`       depends on: [${node.dependencies.join(', ')}]`);
    }
  }

  // 2. Validate the DAG
  console.log('\n📋 Step 2: Validating DAG...\n');

  const validationErrors = validateDAG(workflow);
  if (validationErrors.length === 0) {
    console.log('✅ DAG is valid!');
  } else {
    console.log('❌ Validation errors:');
    validationErrors.forEach(e => console.log(`   - ${e.message}`));
  }

  // 3. Topological sort
  console.log('\n📈 Step 3: Computing execution order...\n');

  const sortResult = topologicalSort(workflow);
  if (sortResult.success) {
    console.log('✅ Execution order:');
    sortResult.waves.forEach((wave, waveIdx) => {
      console.log(`   Wave ${waveIdx + 1}: [${wave.nodeIds.join(', ')}]`);
      if (wave.nodeIds.length > 1) {
        console.log(`            ↳ ${wave.nodeIds.length} tasks run in PARALLEL`);
      }
    });

    console.log(`\n   Total waves: ${sortResult.waves.length}`);
    console.log(`   Total nodes: ${sortResult.order.length}`);
    console.log(`   Can parallelize: ${sortResult.stats.maxParallelism > 1 ? 'Yes' : 'No (linear)'}`);
  } else {
    console.log('❌ Cycle detected:', sortResult.cycle?.join(' → '));
  }

  // 4. Show what the runtime would do
  console.log('\n⚙️ Step 4: Runtime configuration...\n');

  const runtime = new ClaudeCodeRuntime({
    permissions: STANDARD_PERMISSIONS,
    defaultModel: 'sonnet',
  });

  console.log('   Runtime: ClaudeCodeRuntime');
  console.log('   Mode: Claude Code CLI (Task tool spawning)');
  console.log('   Default model: sonnet');
  console.log('   Permissions: STANDARD_PERMISSIONS');
  console.log('     - Read: ✅');
  console.log('     - Write: ✅');
  console.log('     - Bash: ✅ (sandboxed)');
  console.log('     - WebSearch: ✅');
  console.log('     - WebFetch: ✅');

  // 5. Show execution plan (without actually executing)
  console.log('\n🎯 Step 5: Execution plan for topic="quantum computing"...\n');

  console.log('   Wave 1:');
  console.log('     → Spawn "comprehensive-researcher" agent');
  console.log('     → Prompt: "Research: quantum computing"');
  console.log('     → Wait for completion...');

  console.log('\n   Wave 2:');
  console.log('     → Spawn "technical-writer" agent');
  console.log('     → Prompt: "Summarize the research findings"');
  console.log('     → Input: Results from Wave 1');
  console.log('     → Wait for completion...');

  console.log('\n   Output:');
  console.log('     → Return "summary" from summarize node');

  // 6. Demo a more complex DAG
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Bonus: Complex parallel DAG...\n');

  const complexWorkflow = dag('code-review-pipeline')
    .skillNode('fetch', 'data-pipeline-engineer')
      .prompt('Fetch the PR diff for review')
      .done()
    .skillNode('lint', 'code-review')
      .dependsOn('fetch')
      .prompt('Run linting checks')
      .done()
    .skillNode('test', 'test-automation-expert')
      .dependsOn('fetch')
      .prompt('Run test suite')
      .done()
    .skillNode('security', 'security-auditor')
      .dependsOn('fetch')
      .prompt('Check for security vulnerabilities')
      .done()
    .skillNode('report', 'technical-writer')
      .dependsOn('lint', 'test', 'security')
      .prompt('Generate review report')
      .done()
    .build();

  const complexSort = topologicalSort(complexWorkflow);

  console.log(`   DAG: "${complexWorkflow.name}"`);
  console.log(`   Nodes: ${complexWorkflow.nodes.size}`);
  console.log(`   Waves: ${complexSort.waves.length}`);
  console.log(`   Max parallelism: ${complexSort.stats.maxParallelism}`);
  console.log('\n   Execution waves:');

  complexSort.waves.forEach((wave, idx) => {
    console.log(`     Wave ${idx + 1}: [${wave.nodeIds.join(', ')}]`);
    if (wave.nodeIds.length > 1) {
      console.log(`             ↳ ${wave.nodeIds.length} tasks run in PARALLEL`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Demo complete!\n');
  console.log('To execute for real, wire the runtime to actual Task tool calls.');
  console.log('See: /dag/builder in the website for visual editing.\n');
}

main().catch(console.error);

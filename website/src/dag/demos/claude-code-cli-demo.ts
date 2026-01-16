/**
 * Integration Demo: Claude Code CLI Runtime
 *
 * This demo showcases the DAG execution framework using the Claude Code CLI runtime.
 * It demonstrates a real-world workflow: "Research, Analyze, and Report Generation"
 *
 * DAG Structure:
 * ```
 *   [research-topic]     [gather-examples]
 *          \                   /
 *           \                 /
 *            v               v
 *         [analyze-findings]
 *                 |
 *                 v
 *         [generate-report]
 *                 |
 *                 v
 *         [create-summary]
 * ```
 *
 * Waves:
 * - Wave 0: research-topic, gather-examples (parallel)
 * - Wave 1: analyze-findings (depends on both)
 * - Wave 2: generate-report
 * - Wave 3: create-summary
 */

import { DAGBuilder, dag } from '../core/builder';
import { ClaudeCodeRuntime, ClaudeCodeRuntimeConfig } from '../runtimes/claude-code-cli';
import { getPreset } from '../permissions/presets';
import type { NodeId, TaskResult, TaskError, DAGExecutionResult, DAG } from '../types';

// =============================================================================
// Demo Configuration
// =============================================================================

interface DemoConfig {
  topic: string;
  verbose: boolean;
  permissions: 'minimal' | 'standard' | 'full';
}

const DEFAULT_CONFIG: DemoConfig = {
  topic: 'The impact of AI on software development workflows',
  verbose: true,
  permissions: 'standard',
};

// =============================================================================
// Event Logging
// =============================================================================

export function createEventLogger(verbose: boolean) {
  const logs: string[] = [];
  const startTime = Date.now();

  const log = (message: string) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const entry = `[${elapsed}s] ${message}`;
    logs.push(entry);
    if (verbose) {
      console.log(entry);
    }
  };

  return { log, logs };
}

// =============================================================================
// Build the Research DAG
// =============================================================================

export function buildResearchDAG(topic: string): DAG {
  const builder = dag('research-workflow')
    .description(`Research workflow for: ${topic}`);

  // Wave 0: Parallel research tasks
  builder
    .skillNode('research-topic', 'comprehensive-researcher')
    .name('Research Topic')
    .prompt(`Research the following topic thoroughly: "${topic}".
             Find key facts, recent developments, and expert opinions.
             Return structured findings with citations.`)
    .timeout(60000)
    .model('sonnet')
    .done();

  builder
    .skillNode('gather-examples', 'technical-researcher')
    .name('Gather Examples')
    .prompt(`Find real-world examples and case studies related to: "${topic}".
             Include code samples, tool comparisons, and practical implementations.`)
    .timeout(60000)
    .model('sonnet')
    .done();

  // Wave 1: Analysis (depends on both research tasks)
  builder
    .skillNode('analyze-findings', 'data-scientist')
    .name('Analyze Findings')
    .prompt(`Analyze the research findings and examples gathered.
             Identify patterns, trends, and key insights.
             Synthesize information from multiple sources.`)
    .dependsOn('research-topic', 'gather-examples')
    .timeout(45000)
    .model('sonnet')
    .done();

  // Wave 2: Report generation
  builder
    .skillNode('generate-report', 'technical-writer')
    .name('Generate Report')
    .prompt(`Create a comprehensive report based on the analysis.
             Structure: Executive Summary, Key Findings, Examples, Recommendations.
             Use clear headings and bullet points.`)
    .dependsOn('analyze-findings')
    .timeout(45000)
    .model('sonnet')
    .done();

  // Wave 3: Summary
  builder
    .skillNode('create-summary', 'technical-writer')
    .name('Create Summary')
    .prompt(`Create a concise executive summary (2-3 paragraphs) of the report.
             Highlight the most important takeaways and recommendations.`)
    .dependsOn('generate-report')
    .timeout(30000)
    .model('haiku')
    .done();

  // Define DAG outputs using the correct API
  builder.output({
    name: 'report',
    sourceNodeId: 'generate-report' as NodeId,
    outputPath: 'output',
  });

  builder.output({
    name: 'summary',
    sourceNodeId: 'create-summary' as NodeId,
    outputPath: 'output',
  });

  return builder.build();
}

// =============================================================================
// Run Demo
// =============================================================================

export async function runClaudeCodeCLIDemo(
  config: Partial<DemoConfig> = {}
): Promise<{
  result: DAGExecutionResult;
  logs: string[];
  metrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    totalTimeMs: number;
    tokensUsed: number;
  };
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { log, logs } = createEventLogger(finalConfig.verbose);

  log('═══════════════════════════════════════════════════════════════');
  log('  Claude Code CLI Runtime - Integration Demo');
  log('═══════════════════════════════════════════════════════════════');
  log(`Topic: ${finalConfig.topic}`);
  log(`Permissions: ${finalConfig.permissions}`);
  log('');

  // Build the DAG
  log('📊 Building DAG...');
  const dagInstance = buildResearchDAG(finalConfig.topic);
  log(`   Created DAG with ${dagInstance.nodes.size} nodes`);

  // Log the execution waves
  log('');
  log('📋 Execution Plan:');
  log('   Wave 0: research-topic, gather-examples (parallel)');
  log('   Wave 1: analyze-findings');
  log('   Wave 2: generate-report');
  log('   Wave 3: create-summary');
  log('');

  // Configure runtime
  const permissions = getPreset(finalConfig.permissions);

  const runtimeConfig: Partial<ClaudeCodeRuntimeConfig> = {
    permissions,
    defaultModel: 'sonnet',
    onNodeStart: (nodeId: NodeId) => {
      log(`▶️  Starting: ${nodeId}`);
    },
    onNodeComplete: (nodeId: NodeId, result: TaskResult) => {
      log(`✅ Completed: ${nodeId} (confidence: ${result.confidence?.toFixed(2) || 'N/A'})`);
    },
    onNodeError: (nodeId: NodeId, error: TaskError) => {
      log(`❌ Failed: ${nodeId} - ${error.message}`);
    },
    onWaveStart: (waveNum: number, nodeIds: NodeId[]) => {
      log(`🌊 Wave ${waveNum} starting with ${nodeIds.length} nodes`);
    },
    onWaveComplete: (waveNum: number) => {
      log(`🏁 Wave ${waveNum} completed`);
    },
  };

  // Create runtime and execute
  log('🚀 Starting execution...');
  log('');

  const runtime = new ClaudeCodeRuntime(runtimeConfig);
  const result = await runtime.execute(dagInstance, { topic: finalConfig.topic });

  // Log results
  log('');
  log('═══════════════════════════════════════════════════════════════');
  log('  Execution Complete');
  log('═══════════════════════════════════════════════════════════════');
  log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  log(`Total time: ${result.totalTimeMs}ms`);
  log(`Tokens used: ${result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens}`);
  log('');

  // Count node states
  let completedNodes = 0;
  let failedNodes = 0;
  for (const [, state] of result.snapshot.nodeStates) {
    if (state.status === 'completed') completedNodes++;
    if (state.status === 'failed') failedNodes++;
  }

  log('📈 Metrics:');
  log(`   Nodes completed: ${completedNodes}/${dagInstance.nodes.size}`);
  log(`   Nodes failed: ${failedNodes}`);
  log(`   Input tokens: ${result.totalTokenUsage.inputTokens}`);
  log(`   Output tokens: ${result.totalTokenUsage.outputTokens}`);

  if (result.outputs.size > 0) {
    log('');
    log('📤 Outputs:');
    for (const [name] of result.outputs) {
      log(`   - ${name}: [generated]`);
    }
  }

  if (result.errors.length > 0) {
    log('');
    log('⚠️  Errors:');
    for (const error of result.errors) {
      log(`   - ${error.code}: ${error.message}`);
    }
  }

  return {
    result,
    logs,
    metrics: {
      totalNodes: dagInstance.nodes.size,
      completedNodes,
      failedNodes,
      totalTimeMs: result.totalTimeMs,
      tokensUsed: result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens,
    },
  };
}

// =============================================================================
// Simple Demo (Minimal DAG)
// =============================================================================

export async function runSimpleDemo(): Promise<DAGExecutionResult> {
  console.log('\n🎯 Simple Demo: Linear A → B → C\n');

  const builder = dag('simple-demo')
    .description('Simple linear workflow');

  builder
    .skillNode('step-a', 'python-pro')
    .name('Step A')
    .prompt('Generate a Python hello world function')
    .done();

  builder
    .skillNode('step-b', 'code-reviewer')
    .name('Step B')
    .prompt('Review the generated code for best practices')
    .dependsOn('step-a')
    .done();

  builder
    .skillNode('step-c', 'technical-writer')
    .name('Step C')
    .prompt('Write documentation for the code')
    .dependsOn('step-b')
    .done();

  const dagInstance = builder.build();
  const runtime = new ClaudeCodeRuntime({
    onNodeStart: (id) => console.log(`  ▶️  ${id}`),
    onNodeComplete: (id) => console.log(`  ✅ ${id}`),
  });

  const result = await runtime.execute(dagInstance);

  console.log(`\nResult: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Time: ${result.totalTimeMs}ms`);

  return result;
}

// =============================================================================
// Parallel Demo (Fan-out/Fan-in)
// =============================================================================

export async function runParallelDemo(): Promise<DAGExecutionResult> {
  console.log('\n🔀 Parallel Demo: Fan-out/Fan-in Pattern\n');
  console.log('    [start]');
  console.log('   /   |   \\');
  console.log('  A    B    C   (parallel)');
  console.log('   \\   |   /');
  console.log('    [merge]\n');

  const builder = dag('parallel-demo')
    .description('Fan-out/fan-in pattern');

  // Start node
  builder
    .skillNode('start', 'graph-builder')
    .name('Start')
    .prompt('Initialize the workflow')
    .done();

  // Parallel nodes
  ['task-a', 'task-b', 'task-c'].forEach((id, i) => {
    builder
      .skillNode(id, 'python-pro')
      .name(`Task ${String.fromCharCode(65 + i)}`)
      .prompt(`Execute parallel task ${String.fromCharCode(65 + i)}`)
      .dependsOn('start')
      .done();
  });

  // Merge node
  builder
    .skillNode('merge', 'result-aggregator')
    .name('Merge Results')
    .prompt('Combine results from all parallel tasks')
    .dependsOn('task-a', 'task-b', 'task-c')
    .done();

  const dagInstance = builder.build();
  const runtime = new ClaudeCodeRuntime({
    onWaveStart: (wave, nodes) => console.log(`  🌊 Wave ${wave}: ${nodes.join(', ')}`),
    onWaveComplete: (wave) => console.log(`  🏁 Wave ${wave} done`),
  });

  const result = await runtime.execute(dagInstance);

  console.log(`\nResult: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Waves executed: ${result.snapshot.totalWaves}`);

  return result;
}

// =============================================================================
// Permission Demo
// =============================================================================

export async function runPermissionDemo(): Promise<void> {
  console.log('\n🔒 Permission Demo: Enforcing Boundaries\n');

  const builder = dag('permission-demo')
    .description('Testing permission enforcement');

  builder
    .skillNode('safe-task', 'python-pro')
    .name('Safe Task')
    .prompt('Generate safe code')
    .done();

  const dagInstance = builder.build();

  // Try with minimal permissions (no Task tool)
  console.log('1️⃣  Attempting with minimal permissions (Task disabled)...');
  const minimalPermissions = getPreset('minimal');
  minimalPermissions.coreTools.task = false;

  const restrictedRuntime = new ClaudeCodeRuntime({
    permissions: minimalPermissions,
    onNodeError: (id, err) => console.log(`   ❌ ${id}: ${err.message}`),
  });

  const restrictedResult = await restrictedRuntime.execute(dagInstance);
  console.log(`   Result: ${restrictedResult.success ? 'SUCCESS' : 'BLOCKED (expected)'}\n`);

  // Try with standard permissions
  console.log('2️⃣  Attempting with standard permissions...');
  const standardRuntime = new ClaudeCodeRuntime({
    permissions: getPreset('standard'),
    onNodeComplete: (id) => console.log(`   ✅ ${id}: completed`),
  });

  const standardResult = await standardRuntime.execute(dagInstance);
  console.log(`   Result: ${standardResult.success ? 'SUCCESS' : 'FAILED'}\n`);

  console.log('✅ Permission enforcement working correctly!');
}

// =============================================================================
// Main Entry Point
// =============================================================================

export async function runAllDemos(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     Claude Code CLI Runtime - Integration Demos               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Run demos
  await runSimpleDemo();
  await runParallelDemo();
  await runPermissionDemo();

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     Full Research Workflow Demo                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await runClaudeCodeCLIDemo({
    topic: 'Modern approaches to AI-assisted code review',
    verbose: true,
  });

  console.log('\n🎉 All demos completed!');
}

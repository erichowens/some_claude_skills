/**
 * Integration Demo: SDK TypeScript Runtime
 *
 * This demo showcases the DAG execution framework using the SDK TypeScript runtime.
 * Unlike the Claude Code CLI runtime which uses the Task tool for spawning agents,
 * the SDK runtime makes direct API calls using the @anthropic-ai/sdk package.
 *
 * Key Differences from CLI Runtime:
 * - Direct API calls instead of Task tool spawning
 * - Explicit message passing between nodes
 * - Promise.all() for parallel execution
 * - Full control over API parameters
 *
 * DAG Structure (same as CLI demo for comparison):
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
 */

import { dag } from '../core/builder';
import {
  SDKTypescriptRuntime,
  createMockClient,
  AnthropicClient,
  APIResponse,
  CreateMessageParams,
  SDKRuntimeConfig,
} from '../runtimes/sdk-typescript';
import { getPreset } from '../permissions/presets';
import type { NodeId, TaskResult, TaskError, DAGExecutionResult, DAG } from '../types';

// =============================================================================
// Demo Configuration
// =============================================================================

interface SDKDemoConfig {
  topic: string;
  verbose: boolean;
  useRealAPI: boolean;
  apiKey?: string;
  permissions: 'minimal' | 'standard' | 'full';
  maxParallelCalls: number;
  defaultModel: 'haiku' | 'sonnet' | 'opus';
}

const DEFAULT_CONFIG: SDKDemoConfig = {
  topic: 'The impact of AI on software development workflows',
  verbose: true,
  useRealAPI: false, // Use mock client by default for demos
  permissions: 'standard',
  maxParallelCalls: 3,
  defaultModel: 'sonnet',
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
  const builder = dag('sdk-research-workflow')
    .description(`SDK Research workflow for: ${topic}`);

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

  // Define DAG outputs
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
// Custom Response Client (for demos with custom behavior)
// =============================================================================

export function createCustomResponseClient(
  responseGenerator?: (nodeId: string, prompt: string) => string
): AnthropicClient {
  let callCount = 0;

  return {
    messages: {
      async create(params: CreateMessageParams): Promise<APIResponse> {
        callCount++;
        const userMessage = params.messages[0]?.content || '';
        const nodeIdMatch = userMessage.match(/Node ID: (\S+)/);
        const nodeId = nodeIdMatch ? nodeIdMatch[1] : `node-${callCount}`;

        // Default or custom response generation
        const responseText = responseGenerator
          ? responseGenerator(nodeId, userMessage)
          : JSON.stringify({
              output: {
                result: `Simulated result for ${nodeId}`,
                data: { processed: true, timestamp: Date.now() },
              },
              confidence: 0.85 + Math.random() * 0.1,
              reasoning: `Analysis completed for ${nodeId} using ${params.model}`,
            });

        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

        return {
          id: `msg_sdk_demo_${Date.now()}_${callCount}`,
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: responseText }],
          model: params.model,
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: Math.floor(100 + Math.random() * 200),
            output_tokens: Math.floor(50 + Math.random() * 150),
          },
        };
      },
    },
  };
}

// =============================================================================
// Run Main Demo
// =============================================================================

export async function runSDKTypescriptDemo(
  config: Partial<SDKDemoConfig> = {}
): Promise<{
  result: DAGExecutionResult;
  logs: string[];
  metrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    totalTimeMs: number;
    tokensUsed: number;
    apiCalls: number;
  };
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { log, logs } = createEventLogger(finalConfig.verbose);
  let apiCallCount = 0;

  log('═══════════════════════════════════════════════════════════════');
  log('  SDK TypeScript Runtime - Integration Demo');
  log('═══════════════════════════════════════════════════════════════');
  log(`Topic: ${finalConfig.topic}`);
  log(`API Mode: ${finalConfig.useRealAPI ? 'REAL API' : 'Mock Client'}`);
  log(`Max Parallel: ${finalConfig.maxParallelCalls}`);
  log(`Default Model: ${finalConfig.defaultModel}`);
  log('');

  // Build the DAG
  log('📊 Building DAG...');
  const dagInstance = buildResearchDAG(finalConfig.topic);
  log(`   Created DAG with ${dagInstance.nodes.size} nodes`);

  // Log the execution plan
  log('');
  log('📋 Execution Plan:');
  log('   Wave 0: research-topic, gather-examples (parallel via Promise.all)');
  log('   Wave 1: analyze-findings');
  log('   Wave 2: generate-report');
  log('   Wave 3: create-summary');
  log('');

  // Configure client
  const client = finalConfig.useRealAPI
    ? undefined // SDK runtime will require actual client
    : createCustomResponseClient();

  // Configure runtime
  const permissions = getPreset(finalConfig.permissions);

  const runtimeConfig: Partial<SDKRuntimeConfig> = {
    client,
    permissions,
    maxParallelCalls: finalConfig.maxParallelCalls,
    defaultModel: finalConfig.defaultModel === 'haiku'
      ? 'claude-3-haiku-20240307'
      : finalConfig.defaultModel === 'opus'
        ? 'claude-opus-4-20250514'
        : 'claude-sonnet-4-20250514',
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
    onAPICall: (nodeId: NodeId, params: CreateMessageParams) => {
      apiCallCount++;
      log(`📡 API Call #${apiCallCount}: ${nodeId} → ${params.model}`);
    },
    onAPIResponse: (nodeId: NodeId, response: APIResponse) => {
      log(`📥 Response: ${nodeId} (${response.usage.input_tokens}+${response.usage.output_tokens} tokens)`);
    },
  };

  // Create runtime and execute
  log('🚀 Starting execution...');
  log('');

  const runtime = new SDKTypescriptRuntime(runtimeConfig);

  // Show execution plan before running
  const plan = runtime.generateExecutionPlan(dagInstance);
  log(`📋 Execution plan generated: ${plan.totalWaves} waves, ${plan.totalNodes} nodes`);
  log('');

  const result = await runtime.execute(dagInstance, { topic: finalConfig.topic });

  // Log results
  log('');
  log('═══════════════════════════════════════════════════════════════');
  log('  Execution Complete');
  log('═══════════════════════════════════════════════════════════════');
  log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  log(`Total time: ${result.totalTimeMs}ms`);
  log(`API Calls: ${apiCallCount}`);
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
      apiCalls: apiCallCount,
    },
  };
}

// =============================================================================
// Simple Linear Demo
// =============================================================================

export async function runSimpleSDKDemo(): Promise<DAGExecutionResult> {
  console.log('\n🎯 Simple SDK Demo: Linear A → B → C\n');

  const builder = dag('simple-sdk-demo')
    .description('Simple linear workflow via SDK');

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
  const runtime = new SDKTypescriptRuntime({
    client: createMockClient(),
    onNodeStart: (id) => console.log(`  ▶️  ${id}`),
    onNodeComplete: (id) => console.log(`  ✅ ${id}`),
  });

  const result = await runtime.execute(dagInstance);

  console.log(`\nResult: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Time: ${result.totalTimeMs}ms`);

  return result;
}

// =============================================================================
// Parallel Execution Demo
// =============================================================================

export async function runParallelSDKDemo(): Promise<DAGExecutionResult> {
  console.log('\n🔀 Parallel SDK Demo: Fan-out/Fan-in with Promise.all\n');
  console.log('    [start]');
  console.log('   /   |   \\');
  console.log('  A    B    C   (Promise.all)');
  console.log('   \\   |   /');
  console.log('    [merge]\n');

  const builder = dag('parallel-sdk-demo')
    .description('Fan-out/fan-in pattern via SDK');

  builder
    .skillNode('start', 'graph-builder')
    .name('Start')
    .prompt('Initialize the workflow')
    .done();

  ['task-a', 'task-b', 'task-c'].forEach((id, i) => {
    builder
      .skillNode(id, 'python-pro')
      .name(`Task ${String.fromCharCode(65 + i)}`)
      .prompt(`Execute parallel task ${String.fromCharCode(65 + i)}`)
      .dependsOn('start')
      .done();
  });

  builder
    .skillNode('merge', 'result-aggregator')
    .name('Merge Results')
    .prompt('Combine results from all parallel tasks')
    .dependsOn('task-a', 'task-b', 'task-c')
    .done();

  const dagInstance = builder.build();
  const runtime = new SDKTypescriptRuntime({
    client: createMockClient(),
    maxParallelCalls: 3, // Allow all parallel tasks to run simultaneously
    onWaveStart: (wave, nodes) => console.log(`  🌊 Wave ${wave}: ${nodes.join(', ')}`),
    onWaveComplete: (wave) => console.log(`  🏁 Wave ${wave} done`),
    onAPICall: (nodeId) => console.log(`  📡 API call: ${nodeId}`),
  });

  const result = await runtime.execute(dagInstance);

  console.log(`\nResult: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Waves executed: ${result.snapshot.totalWaves}`);
  console.log(`Tokens used: ${result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens}`);

  return result;
}

// =============================================================================
// API Call Comparison Demo
// =============================================================================

export async function runAPIComparisonDemo(): Promise<void> {
  console.log('\n📊 API Comparison Demo: SDK vs CLI Runtime Characteristics\n');

  const builder = dag('comparison-demo')
    .description('Compare SDK runtime behavior');

  builder
    .skillNode('node-1', 'researcher')
    .name('Node 1')
    .prompt('Research task')
    .done();

  builder
    .skillNode('node-2', 'researcher')
    .name('Node 2')
    .prompt('Analysis task')
    .dependsOn('node-1')
    .done();

  const dagInstance = builder.build();

  // Track API calls
  const apiCalls: { nodeId: string; timestamp: number; model: string }[] = [];
  const apiResponses: { nodeId: string; timestamp: number; tokens: number }[] = [];

  const runtime = new SDKTypescriptRuntime({
    client: createMockClient(),
    onAPICall: (nodeId, params) => {
      apiCalls.push({
        nodeId: nodeId as string,
        timestamp: Date.now(),
        model: params.model,
      });
    },
    onAPIResponse: (nodeId, response) => {
      apiResponses.push({
        nodeId: nodeId as string,
        timestamp: Date.now(),
        tokens: response.usage.input_tokens + response.usage.output_tokens,
      });
    },
  });

  await runtime.execute(dagInstance);

  console.log('SDK Runtime Characteristics:');
  console.log('  ✓ Direct API calls (no Task tool intermediary)');
  console.log('  ✓ Full control over message structure');
  console.log('  ✓ Explicit token tracking per call');
  console.log('  ✓ Promise.all() for parallel execution');
  console.log('');
  console.log('API Call Log:');
  apiCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call.nodeId} → ${call.model}`);
  });
  console.log('');
  console.log('Token Usage:');
  apiResponses.forEach((resp) => {
    console.log(`  ${resp.nodeId}: ${resp.tokens} tokens`);
  });
}

// =============================================================================
// Error Handling Demo
// =============================================================================

export async function runErrorHandlingDemo(): Promise<void> {
  console.log('\n⚠️  Error Handling Demo: SDK Runtime Error Recovery\n');

  const builder = dag('error-demo')
    .description('Demonstrate error handling');

  builder
    .skillNode('success-node', 'researcher')
    .name('Success Node')
    .prompt('This will succeed')
    .done();

  builder
    .skillNode('dependent-node', 'writer')
    .name('Dependent Node')
    .prompt('This depends on success')
    .dependsOn('success-node')
    .done();

  const dagInstance = builder.build();

  // Create a client that fails on the second call
  let callCount = 0;
  const failingClient: AnthropicClient = {
    messages: {
      async create(params: CreateMessageParams): Promise<APIResponse> {
        callCount++;
        if (callCount === 2) {
          throw new Error('Simulated API failure: Rate limit exceeded');
        }
        return {
          id: `msg_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: JSON.stringify({ output: { result: 'success' }, confidence: 0.9 }),
            },
          ],
          model: params.model,
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 100, output_tokens: 50 },
        };
      },
    },
  };

  const runtime = new SDKTypescriptRuntime({
    client: failingClient,
    onNodeComplete: (id) => console.log(`  ✅ ${id} completed`),
    onNodeError: (id, error) => console.log(`  ❌ ${id} failed: ${error.message}`),
  });

  const result = await runtime.execute(dagInstance);

  console.log('');
  console.log('Error Handling Results:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Errors captured: ${result.errors.length}`);
  result.errors.forEach((error) => {
    console.log(`    - ${error.code}: ${error.message}`);
  });
}

// =============================================================================
// Main Entry Point
// =============================================================================

export async function runAllSDKDemos(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     SDK TypeScript Runtime - Integration Demos                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await runSimpleSDKDemo();
  await runParallelSDKDemo();
  await runAPIComparisonDemo();
  await runErrorHandlingDemo();

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     Full Research Workflow Demo                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await runSDKTypescriptDemo({
    topic: 'Modern approaches to AI-assisted code review',
    verbose: true,
  });

  console.log('\n🎉 All SDK demos completed!');
}

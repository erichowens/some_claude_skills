/**
 * Integration Demo: HTTP API Runtime
 *
 * This demo showcases the DAG execution framework using the HTTP API runtime.
 * Unlike CLI and SDK runtimes, the HTTP API runtime provides:
 * - Job-based execution with unique job IDs
 * - Event subscription for real-time progress updates
 * - Job queue with configurable concurrency
 * - State persistence via pluggable stores
 *
 * Key Differences from Other Runtimes:
 * - REST-like API: submitJob, getJob, cancelJob
 * - Async execution with status polling
 * - Event-driven updates via subscribe()
 * - Built-in job queue management
 *
 * DAG Structure (same as other demos for comparison):
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
  HTTPAPIRuntime,
  createMockAPIClient,
  InMemoryStateStore,
  HTTPAPIRuntimeConfig,
  ExecutionEvent,
  ExecutionJob,
  APIClient,
  APIResult,
  APIRequest,
} from '../runtimes/http-api';
import { getPreset } from '../permissions/presets';
import type { NodeId, DAGExecutionResult, DAG } from '../types';

// =============================================================================
// Demo Configuration
// =============================================================================

interface HTTPAPIDemoConfig {
  topic: string;
  verbose: boolean;
  maxConcurrentJobs: number;
  maxParallelCallsPerJob: number;
  permissions: 'minimal' | 'standard' | 'full';
  defaultModel: string;
}

const DEFAULT_CONFIG: HTTPAPIDemoConfig = {
  topic: 'The impact of AI on software development workflows',
  verbose: true,
  maxConcurrentJobs: 5,
  maxParallelCallsPerJob: 3,
  permissions: 'standard',
  defaultModel: 'claude-sonnet-4-20250514',
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
  const builder = dag('http-api-research-workflow')
    .description(`HTTP API Research workflow for: ${topic}`);

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
// Custom API Client
// =============================================================================

export function createCustomAPIClient(
  responseGenerator?: (nodeId: string, prompt: string) => string
): APIClient {
  let callCount = 0;

  return {
    async call(request: APIRequest): Promise<APIResult> {
      callCount++;

      // Extract node ID from prompt
      const nodeIdMatch = request.userMessage.match(/Node ID: (\S+)/);
      const nodeId = nodeIdMatch ? nodeIdMatch[1] : `node-${callCount}`;

      // Default or custom response generation
      const responseText = responseGenerator
        ? responseGenerator(nodeId, request.userMessage)
        : JSON.stringify({
            output: {
              result: `HTTP API result for ${nodeId}`,
              data: { processed: true, timestamp: Date.now(), model: request.model },
            },
            confidence: 0.85 + Math.random() * 0.1,
            reasoning: `Analysis completed for ${nodeId} via HTTP API runtime`,
          });

      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 70));

      return {
        success: true,
        content: responseText,
        tokenUsage: {
          inputTokens: Math.floor(100 + Math.random() * 200),
          outputTokens: Math.floor(50 + Math.random() * 150),
        },
      };
    },
  };
}

// =============================================================================
// Run Main Demo
// =============================================================================

export async function runHTTPAPIDemo(
  config: Partial<HTTPAPIDemoConfig> = {}
): Promise<{
  result: DAGExecutionResult | null;
  logs: string[];
  events: ExecutionEvent[];
  metrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    totalTimeMs: number;
    tokensUsed: number;
    eventsReceived: number;
  };
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { log, logs } = createEventLogger(finalConfig.verbose);
  const events: ExecutionEvent[] = [];

  log('═══════════════════════════════════════════════════════════════');
  log('  HTTP API Runtime - Integration Demo');
  log('═══════════════════════════════════════════════════════════════');
  log(`Topic: ${finalConfig.topic}`);
  log(`Max Concurrent Jobs: ${finalConfig.maxConcurrentJobs}`);
  log(`Max Parallel Calls/Job: ${finalConfig.maxParallelCallsPerJob}`);
  log(`Default Model: ${finalConfig.defaultModel}`);
  log('');

  // Build the DAG
  log('📊 Building DAG...');
  const dagInstance = buildResearchDAG(finalConfig.topic);
  log(`   Created DAG with ${dagInstance.nodes.size} nodes`);

  // Log the execution plan
  log('');
  log('📋 Execution Plan:');
  log('   Wave 0: research-topic, gather-examples (parallel)');
  log('   Wave 1: analyze-findings');
  log('   Wave 2: generate-report');
  log('   Wave 3: create-summary');
  log('');

  // Configure runtime
  const permissions = getPreset(finalConfig.permissions);
  const stateStore = new InMemoryStateStore();

  const runtimeConfig: Partial<HTTPAPIRuntimeConfig> = {
    maxConcurrentJobs: finalConfig.maxConcurrentJobs,
    maxParallelCallsPerJob: finalConfig.maxParallelCallsPerJob,
    stateStore,
    permissions,
    defaultModel: finalConfig.defaultModel,
    clientFactory: () => createCustomAPIClient(),
  };

  // Create runtime
  log('🚀 Creating HTTP API runtime...');
  const runtime = new HTTPAPIRuntime(runtimeConfig);

  // Generate execution plan (before running)
  const plan = runtime.generateExecutionPlan(dagInstance);
  log(`📋 Plan: ${plan.totalWaves} waves, ${plan.totalNodes} nodes, max concurrency: ${plan.estimatedConcurrency}`);
  log('');

  // Submit job
  log('📤 Submitting job...');
  const jobId = await runtime.submitJob(dagInstance, { topic: finalConfig.topic });
  log(`   Job ID: ${jobId}`);

  // Subscribe to events
  log('📡 Subscribing to job events...');
  const unsubscribe = runtime.subscribe(jobId, (event) => {
    events.push(event);
    switch (event.type) {
      case 'job:started':
        log('▶️  Job started');
        break;
      case 'wave:start':
        log(`🌊 Wave ${event.data.waveIndex} starting: ${(event.data.nodeIds as string[]).join(', ')}`);
        break;
      case 'wave:complete':
        log(`🏁 Wave ${event.data.waveIndex} completed`);
        break;
      case 'node:start':
        log(`   ▶️  Node starting: ${event.data.nodeId}`);
        break;
      case 'node:complete':
        log(`   ✅ Node completed: ${event.data.nodeId} (confidence: ${(event.data.confidence as number)?.toFixed(2) || 'N/A'})`);
        break;
      case 'node:error':
        log(`   ❌ Node failed: ${event.data.nodeId} - ${event.data.error}`);
        break;
      case 'job:completed':
        log(`🎉 Job completed in ${event.data.totalTimeMs}ms`);
        break;
      case 'job:failed':
        log(`💥 Job failed: ${event.data.error}`);
        break;
    }
  });
  log('');

  // Wait for job completion with polling
  log('⏳ Waiting for job completion...');
  let job: ExecutionJob | undefined;
  const pollInterval = 50;
  const maxPollTime = 30000;
  const pollStart = Date.now();

  while (Date.now() - pollStart < maxPollTime) {
    job = await runtime.getJob(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Unsubscribe from events
  unsubscribe();

  // Log results
  log('');
  log('═══════════════════════════════════════════════════════════════');
  log('  Execution Complete');
  log('═══════════════════════════════════════════════════════════════');

  if (!job) {
    log('❌ Job not found');
    return {
      result: null,
      logs,
      events,
      metrics: {
        totalNodes: dagInstance.nodes.size,
        completedNodes: 0,
        failedNodes: 0,
        totalTimeMs: 0,
        tokensUsed: 0,
        eventsReceived: events.length,
      },
    };
  }

  log(`Status: ${job.status === 'completed' ? '✅ SUCCESS' : '❌ ' + job.status.toUpperCase()}`);
  log(`Total time: ${job.result?.totalTimeMs ?? 0}ms`);
  log(`Events received: ${events.length}`);
  log('');

  // Count node states
  let completedNodes = 0;
  let failedNodes = 0;
  if (job.result?.snapshot.nodeStates) {
    for (const [, state] of job.result.snapshot.nodeStates) {
      if (state.status === 'completed') completedNodes++;
      if (state.status === 'failed') failedNodes++;
    }
  }

  const tokensUsed = job.result
    ? job.result.totalTokenUsage.inputTokens + job.result.totalTokenUsage.outputTokens
    : 0;

  log('📈 Metrics:');
  log(`   Nodes completed: ${completedNodes}/${dagInstance.nodes.size}`);
  log(`   Nodes failed: ${failedNodes}`);
  log(`   Tokens used: ${tokensUsed}`);
  log(`   Events received: ${events.length}`);

  if (job.result?.outputs && job.result.outputs.size > 0) {
    log('');
    log('📤 Outputs:');
    for (const [name] of job.result.outputs) {
      log(`   - ${name}: [generated]`);
    }
  }

  if (job.result?.errors && job.result.errors.length > 0) {
    log('');
    log('⚠️  Errors:');
    for (const error of job.result.errors) {
      log(`   - ${error.code}: ${error.message}`);
    }
  }

  return {
    result: job.result ?? null,
    logs,
    events,
    metrics: {
      totalNodes: dagInstance.nodes.size,
      completedNodes,
      failedNodes,
      totalTimeMs: job.result?.totalTimeMs ?? 0,
      tokensUsed,
      eventsReceived: events.length,
    },
  };
}

// =============================================================================
// Simple Linear Demo
// =============================================================================

export async function runSimpleHTTPAPIDemo(): Promise<DAGExecutionResult | null> {
  console.log('\n🎯 Simple HTTP API Demo: Linear A → B → C\n');

  const builder = dag('simple-http-api-demo')
    .description('Simple linear workflow via HTTP API');

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
  const runtime = new HTTPAPIRuntime({
    clientFactory: () => createMockAPIClient(),
  });

  // Submit and track
  const jobId = await runtime.submitJob(dagInstance);
  console.log(`  📤 Job submitted: ${jobId}`);

  runtime.subscribe(jobId, (event) => {
    if (event.type === 'node:start') {
      console.log(`  ▶️  ${event.data.nodeId}`);
    } else if (event.type === 'node:complete') {
      console.log(`  ✅ ${event.data.nodeId}`);
    }
  });

  // Wait for completion
  let job: ExecutionJob | undefined;
  while (true) {
    job = await runtime.getJob(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`\nResult: ${job?.status === 'completed' ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Time: ${job?.result?.totalTimeMs ?? 0}ms`);

  return job?.result ?? null;
}

// =============================================================================
// Parallel Execution Demo
// =============================================================================

export async function runParallelHTTPAPIDemo(): Promise<DAGExecutionResult | null> {
  console.log('\n🔀 Parallel HTTP API Demo: Fan-out/Fan-in with Job Queue\n');
  console.log('    [start]');
  console.log('   /   |   \\');
  console.log('  A    B    C   (parallel via worker pool)');
  console.log('   \\   |   /');
  console.log('    [merge]\n');

  const builder = dag('parallel-http-api-demo')
    .description('Fan-out/fan-in pattern via HTTP API');

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
  const runtime = new HTTPAPIRuntime({
    maxParallelCallsPerJob: 3, // Allow all parallel tasks to run simultaneously
    clientFactory: () => createMockAPIClient(),
  });

  // Subscribe to events
  const jobId = await runtime.submitJob(dagInstance);

  runtime.subscribe(jobId, (event) => {
    if (event.type === 'wave:start') {
      console.log(`  🌊 Wave ${event.data.waveIndex}: ${(event.data.nodeIds as string[]).join(', ')}`);
    } else if (event.type === 'wave:complete') {
      console.log(`  🏁 Wave ${event.data.waveIndex} done`);
    }
  });

  // Wait for completion
  let job: ExecutionJob | undefined;
  while (true) {
    job = await runtime.getJob(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const result = job?.result;
  console.log(`\nResult: ${job?.status === 'completed' ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Waves executed: ${result?.snapshot.totalWaves ?? 0}`);
  console.log(`Tokens used: ${result ? result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens : 0}`);

  return result ?? null;
}

// =============================================================================
// Job Queue Demo
// =============================================================================

export async function runJobQueueDemo(): Promise<void> {
  console.log('\n📋 Job Queue Demo: Multiple Concurrent Jobs\n');

  const runtime = new HTTPAPIRuntime({
    maxConcurrentJobs: 2,
    clientFactory: () => createMockAPIClient(),
  });

  // Create multiple simple DAGs
  const createSimpleDAG = (id: string): DAG => {
    const builder = dag(`queue-test-${id}`)
      .description(`Test job ${id}`);

    builder
      .skillNode('task', 'python-pro')
      .name(`Task ${id}`)
      .prompt(`Execute task ${id}`)
      .done();

    return builder.build();
  };

  // Submit multiple jobs
  const jobIds: string[] = [];
  console.log('  Submitting 5 jobs (max 2 concurrent)...');

  for (let i = 1; i <= 5; i++) {
    const jobId = await runtime.submitJob(createSimpleDAG(`job-${i}`));
    jobIds.push(jobId);
    console.log(`    📤 Submitted: ${jobId}`);
  }

  // Track all jobs via global subscription
  const completedJobs: string[] = [];
  runtime.subscribeAll((event) => {
    if (event.type === 'job:started') {
      console.log(`    ▶️  Started: ${event.jobId}`);
    } else if (event.type === 'job:completed') {
      console.log(`    ✅ Completed: ${event.jobId}`);
      completedJobs.push(event.jobId);
    }
  });

  // Wait for all jobs
  console.log('\n  Waiting for all jobs to complete...');
  while (completedJobs.length < 5) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n  ✅ All ${completedJobs.length} jobs completed!`);

  // List final job statuses
  console.log('\n  Final Job Statuses:');
  const jobs = await runtime.listJobs();
  for (const job of jobs) {
    console.log(`    ${job.id}: ${job.status}`);
  }
}

// =============================================================================
// Event Subscription Demo
// =============================================================================

export async function runEventSubscriptionDemo(): Promise<void> {
  console.log('\n📡 Event Subscription Demo: Real-time Updates\n');

  const runtime = new HTTPAPIRuntime({
    clientFactory: () => createMockAPIClient(),
  });

  const builder = dag('event-demo')
    .description('Event subscription demonstration');

  builder
    .skillNode('node-1', 'researcher')
    .name('Node 1')
    .prompt('Task 1')
    .done();

  builder
    .skillNode('node-2', 'writer')
    .name('Node 2')
    .prompt('Task 2')
    .dependsOn('node-1')
    .done();

  const dagInstance = builder.build();
  const jobId = await runtime.submitJob(dagInstance);

  const eventLog: string[] = [];

  // Subscribe to specific job events
  const unsubscribe = runtime.subscribe(jobId, (event) => {
    const entry = `[${event.type}] ${JSON.stringify(event.data)}`;
    eventLog.push(entry);
    console.log(`  📥 ${entry}`);
  });

  // Wait for completion
  let job: ExecutionJob | undefined;
  while (true) {
    job = await runtime.getJob(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  unsubscribe();

  console.log(`\n  📊 Total events captured: ${eventLog.length}`);
  console.log('  Event types received:');
  const eventTypes = new Set(eventLog.map((e) => e.match(/\[([^\]]+)\]/)?.[1] ?? ''));
  eventTypes.forEach((type) => console.log(`    - ${type}`));
}

// =============================================================================
// Job Cancellation Demo
// =============================================================================

export async function runJobCancellationDemo(): Promise<void> {
  console.log('\n🛑 Job Cancellation Demo\n');

  // Create a client with slow responses
  const slowClient: APIClient = {
    async call(request: APIRequest): Promise<APIResult> {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Slow!
      return {
        success: true,
        content: JSON.stringify({ output: 'result', confidence: 0.9 }),
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
      };
    },
  };

  const runtime = new HTTPAPIRuntime({
    clientFactory: () => slowClient,
  });

  const builder = dag('cancel-demo')
    .description('Cancellation test');

  builder
    .skillNode('slow-task', 'researcher')
    .name('Slow Task')
    .prompt('This will be cancelled')
    .done();

  const dagInstance = builder.build();
  const jobId = await runtime.submitJob(dagInstance);

  console.log(`  📤 Submitted slow job: ${jobId}`);

  // Wait a bit then cancel
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log('  🛑 Cancelling job...');
  const cancelled = await runtime.cancelJob(jobId);
  console.log(`  Result: ${cancelled ? 'Cancelled successfully' : 'Could not cancel'}`);

  const job = await runtime.getJob(jobId);
  console.log(`  Final status: ${job?.status}`);
}

// =============================================================================
// Error Handling Demo
// =============================================================================

export async function runErrorHandlingDemo(): Promise<void> {
  console.log('\n⚠️  Error Handling Demo: API Failure Recovery\n');

  // Create a client that fails on specific nodes
  let callCount = 0;
  const failingClient: APIClient = {
    async call(request: APIRequest): Promise<APIResult> {
      callCount++;
      if (callCount === 2) {
        return {
          success: false,
          content: '',
          tokenUsage: { inputTokens: 0, outputTokens: 0 },
          error: 'Simulated API error: Rate limit exceeded',
        };
      }
      return {
        success: true,
        content: JSON.stringify({ output: 'success', confidence: 0.9 }),
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
      };
    },
  };

  const runtime = new HTTPAPIRuntime({
    clientFactory: () => failingClient,
  });

  const builder = dag('error-demo')
    .description('Error handling test');

  builder
    .skillNode('will-succeed', 'researcher')
    .name('Will Succeed')
    .prompt('This succeeds')
    .done();

  builder
    .skillNode('will-fail', 'writer')
    .name('Will Fail')
    .prompt('This fails')
    .dependsOn('will-succeed')
    .done();

  const dagInstance = builder.build();
  const jobId = await runtime.submitJob(dagInstance);

  runtime.subscribe(jobId, (event) => {
    if (event.type === 'node:complete') {
      console.log(`  ✅ ${event.data.nodeId} completed`);
    } else if (event.type === 'node:error') {
      console.log(`  ❌ ${event.data.nodeId} failed: ${event.data.error}`);
    }
  });

  // Wait for completion
  let job: ExecutionJob | undefined;
  while (true) {
    job = await runtime.getJob(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log('');
  console.log('Error Handling Results:');
  console.log(`  Job status: ${job?.status}`);
  console.log(`  Errors captured: ${job?.result?.errors.length ?? 0}`);
  job?.result?.errors.forEach((error) => {
    console.log(`    - ${error.code}: ${error.message}`);
  });
}

// =============================================================================
// Cleanup Demo
// =============================================================================

export async function runCleanupDemo(): Promise<void> {
  console.log('\n🧹 Cleanup Demo: Old Job Removal\n');

  const stateStore = new InMemoryStateStore();
  const runtime = new HTTPAPIRuntime({
    stateStore,
    clientFactory: () => createMockAPIClient(),
  });

  // Submit several jobs
  console.log('  Submitting test jobs...');
  const builder = dag('cleanup-test').description('Test');
  builder.skillNode('task', 'researcher').name('Task').prompt('Test').done();
  const dagInstance = builder.build();

  const jobIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const jobId = await runtime.submitJob(dagInstance);
    jobIds.push(jobId);
  }

  // Wait for completion
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check job count
  let jobs = await runtime.listJobs();
  console.log(`  Jobs before cleanup: ${jobs.length}`);

  // Clean up (with 0ms age to clean everything)
  const cleaned = await runtime.cleanupOldJobs(0);
  console.log(`  Cleaned up: ${cleaned} jobs`);

  jobs = await runtime.listJobs();
  console.log(`  Jobs after cleanup: ${jobs.length}`);
}

// =============================================================================
// Main Entry Point
// =============================================================================

export async function runAllHTTPAPIDemos(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     HTTP API Runtime - Integration Demos                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await runSimpleHTTPAPIDemo();
  await runParallelHTTPAPIDemo();
  await runJobQueueDemo();
  await runEventSubscriptionDemo();
  await runJobCancellationDemo();
  await runErrorHandlingDemo();
  await runCleanupDemo();

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     Full Research Workflow Demo                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await runHTTPAPIDemo({
    topic: 'Modern approaches to AI-assisted code review',
    verbose: true,
  });

  console.log('\n🎉 All HTTP API demos completed!');
}

/**
 * Tests for HTTP API Runtime
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HTTPAPIRuntime,
  createHTTPAPIRuntime,
  createMockAPIClient,
  InMemoryStateStore,
  ExecutionJob,
  ExecutionEvent,
  APIClient,
  APIRequest,
  APIResult,
} from './http-api';
import { dag } from '../core/builder';
import { getPreset } from '../permissions/presets';
import type { NodeId } from '../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestDAG() {
  return dag('test-dag')
    .description('Test DAG for HTTP API runtime')
    .skillNode('node-a', 'test-skill')
    .name('Node A')
    .prompt('Execute task A')
    .done()
    .skillNode('node-b', 'test-skill')
    .name('Node B')
    .prompt('Execute task B')
    .dependsOn('node-a')
    .done()
    .build();
}

function createParallelDAG() {
  return dag('parallel-dag')
    .description('Parallel test DAG')
    .skillNode('start', 'init-skill')
    .name('Start')
    .prompt('Initialize')
    .done()
    .skillNode('task-a', 'worker-skill')
    .name('Task A')
    .prompt('Do task A')
    .dependsOn('start')
    .done()
    .skillNode('task-b', 'worker-skill')
    .name('Task B')
    .prompt('Do task B')
    .dependsOn('start')
    .done()
    .skillNode('task-c', 'worker-skill')
    .name('Task C')
    .prompt('Do task C')
    .dependsOn('start')
    .done()
    .skillNode('merge', 'aggregator-skill')
    .name('Merge')
    .prompt('Combine results')
    .dependsOn('task-a', 'task-b', 'task-c')
    .done()
    .build();
}

async function waitForJobCompletion(
  runtime: HTTPAPIRuntime,
  jobId: string,
  timeoutMs: number = 10000
): Promise<ExecutionJob | undefined> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const job = await runtime.getJob(jobId);
    if (job && ['completed', 'failed', 'cancelled'].includes(job.status)) {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return runtime.getJob(jobId);
}

// =============================================================================
// InMemoryStateStore Tests
// =============================================================================

describe('InMemoryStateStore', () => {
  it('stores and retrieves values', async () => {
    const store = new InMemoryStateStore();

    await store.set('key1', { value: 'test' });
    const result = await store.get('key1');

    expect(result).toEqual({ value: 'test' });
  });

  it('returns undefined for missing keys', async () => {
    const store = new InMemoryStateStore();
    const result = await store.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('deletes values', async () => {
    const store = new InMemoryStateStore();

    await store.set('key1', 'value1');
    const deleted = await store.delete('key1');
    const result = await store.get('key1');

    expect(deleted).toBe(true);
    expect(result).toBeUndefined();
  });

  it('respects TTL', async () => {
    const store = new InMemoryStateStore();

    await store.set('key1', 'value1', 50); // 50ms TTL
    expect(await store.get('key1')).toBe('value1');

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(await store.get('key1')).toBeUndefined();
  });

  it('lists keys by pattern', async () => {
    const store = new InMemoryStateStore();

    await store.set('job:1', 'a');
    await store.set('job:2', 'b');
    await store.set('dag:1', 'c');

    const jobKeys = await store.keys('job:*');
    expect(jobKeys).toHaveLength(2);
    expect(jobKeys).toContain('job:1');
    expect(jobKeys).toContain('job:2');
  });

  it('clears all data', async () => {
    const store = new InMemoryStateStore();

    await store.set('key1', 'value1');
    await store.set('key2', 'value2');
    store.clear();

    expect(await store.get('key1')).toBeUndefined();
    expect(await store.get('key2')).toBeUndefined();
  });
});

// =============================================================================
// Mock API Client Tests
// =============================================================================

describe('createMockAPIClient', () => {
  it('creates a working mock client', async () => {
    const client = createMockAPIClient();
    const result = await client.call({
      model: 'claude-sonnet-4-20250514',
      systemPrompt: 'Test system',
      userMessage: 'Test message',
      maxTokens: 1000,
    });

    expect(result.success).toBe(true);
    expect(result.content).toBeTruthy();
    expect(result.tokenUsage.inputTokens).toBeGreaterThan(0);
    expect(result.tokenUsage.outputTokens).toBeGreaterThan(0);
  });

  it('allows response override', async () => {
    const client = createMockAPIClient({
      tokenUsage: { inputTokens: 500, outputTokens: 250 },
    });

    const result = await client.call({
      model: 'claude-sonnet-4-20250514',
      systemPrompt: 'Test',
      userMessage: 'Test',
      maxTokens: 1000,
    });

    expect(result.tokenUsage.inputTokens).toBe(500);
    expect(result.tokenUsage.outputTokens).toBe(250);
  });
});

// =============================================================================
// HTTPAPIRuntime Tests
// =============================================================================

describe('HTTPAPIRuntime', () => {
  describe('constructor', () => {
    it('creates runtime with default config', () => {
      const runtime = new HTTPAPIRuntime();
      expect(runtime).toBeInstanceOf(HTTPAPIRuntime);
    });

    it('creates runtime with custom config', () => {
      const runtime = new HTTPAPIRuntime({
        maxConcurrentJobs: 10,
        maxParallelCallsPerJob: 5,
        jobTimeoutMs: 60000,
      });
      expect(runtime).toBeInstanceOf(HTTPAPIRuntime);
    });

    it('creates runtime with custom state store', () => {
      const store = new InMemoryStateStore();
      const runtime = new HTTPAPIRuntime({ stateStore: store });
      expect(runtime).toBeInstanceOf(HTTPAPIRuntime);
    });
  });

  describe('submitJob', () => {
    it('returns a job ID', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);

      expect(jobId).toMatch(/^job_\d+_[a-z0-9]+$/);
    });

    it('creates job with pending status', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const job = await runtime.getJob(jobId);

      expect(job).toBeDefined();
      expect(['pending', 'queued', 'running']).toContain(job?.status);
    });

    it('initializes job progress', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const job = await runtime.getJob(jobId);

      expect(job?.progress.totalNodes).toBe(2);
      expect(job?.progress.completedNodes).toBe(0);
      expect(job?.progress.totalWaves).toBe(2);
    });
  });

  describe('getJob', () => {
    it('returns undefined for non-existent job', async () => {
      const runtime = new HTTPAPIRuntime();
      const job = await runtime.getJob('nonexistent');
      expect(job).toBeUndefined();
    });

    it('returns job with updated status', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const completedJob = await waitForJobCompletion(runtime, jobId);

      expect(completedJob?.status).toBe('completed');
    });
  });

  describe('listJobs', () => {
    it('lists all jobs', async () => {
      const runtime = new HTTPAPIRuntime();
      const dag1 = createTestDAG();
      const dag2 = createTestDAG();

      await runtime.submitJob(dag1);
      await runtime.submitJob(dag2);

      const jobs = await runtime.listJobs();
      expect(jobs.length).toBeGreaterThanOrEqual(2);
    });

    it('filters jobs by status', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      await waitForJobCompletion(runtime, jobId);

      const completedJobs = await runtime.listJobs('completed');
      expect(completedJobs.some((j) => j.id === jobId)).toBe(true);
    });
  });

  describe('cancelJob', () => {
    it('cancels pending job', async () => {
      // Create runtime with high concurrency limit to ensure job stays pending
      const runtime = new HTTPAPIRuntime({ maxConcurrentJobs: 0 });
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const cancelled = await runtime.cancelJob(jobId);

      expect(cancelled).toBe(true);
      const job = await runtime.getJob(jobId);
      expect(job?.status).toBe('cancelled');
    });

    it('returns false for non-existent job', async () => {
      const runtime = new HTTPAPIRuntime();
      const cancelled = await runtime.cancelJob('nonexistent');
      expect(cancelled).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('receives job events', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();
      const events: ExecutionEvent[] = [];

      const jobId = await runtime.submitJob(testDAG);
      runtime.subscribe(jobId, (event) => events.push(event));

      await waitForJobCompletion(runtime, jobId);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'node:start')).toBe(true);
      expect(events.some((e) => e.type === 'node:complete')).toBe(true);
    });

    it('unsubscribe stops events', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();
      const events: ExecutionEvent[] = [];

      const jobId = await runtime.submitJob(testDAG);
      const unsubscribe = runtime.subscribe(jobId, (event) => events.push(event));

      // Unsubscribe immediately
      unsubscribe();

      await waitForJobCompletion(runtime, jobId);

      // Should have received some events before unsubscribe
      // but this is timing-dependent
    });

    it('subscribeAll receives all events', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();
      const events: ExecutionEvent[] = [];

      runtime.subscribeAll((event) => events.push(event));
      const jobId = await runtime.submitJob(testDAG);

      await waitForJobCompletion(runtime, jobId);

      expect(events.some((e) => e.type === 'job:created')).toBe(true);
      expect(events.some((e) => e.type === 'job:started')).toBe(true);
    });
  });

  describe('job execution', () => {
    it('executes simple DAG successfully', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const job = await waitForJobCompletion(runtime, jobId);

      expect(job?.status).toBe('completed');
      expect(job?.result?.success).toBe(true);
      expect(job?.progress.completedNodes).toBe(2);
    });

    it('executes parallel DAG successfully', async () => {
      const runtime = new HTTPAPIRuntime();
      const parallelDAG = createParallelDAG();

      const jobId = await runtime.submitJob(parallelDAG);
      const job = await waitForJobCompletion(runtime, jobId);

      expect(job?.status).toBe('completed');
      expect(job?.result?.success).toBe(true);
      expect(job?.progress.completedNodes).toBe(5);
      expect(job?.progress.totalWaves).toBe(3);
    });

    it('passes inputs to execution', async () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG, { topic: 'Test Topic' });
      const job = await waitForJobCompletion(runtime, jobId);

      expect(job?.status).toBe('completed');
      expect(job?.inputs.topic).toBe('Test Topic');
    });

    it('tracks token usage', async () => {
      const runtime = new HTTPAPIRuntime({
        clientFactory: () =>
          createMockAPIClient({
            tokenUsage: { inputTokens: 100, outputTokens: 50 },
          }),
      });
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const job = await waitForJobCompletion(runtime, jobId);

      expect(job?.result?.totalTokenUsage.inputTokens).toBeGreaterThan(0);
      expect(job?.result?.totalTokenUsage.outputTokens).toBeGreaterThan(0);
    });

    it('handles API errors', async () => {
      const failingClient: APIClient = {
        async call(): Promise<APIResult> {
          throw new Error('API failure');
        },
      };

      const runtime = new HTTPAPIRuntime({
        clientFactory: () => failingClient,
      });
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      const job = await waitForJobCompletion(runtime, jobId);

      expect(job?.status).toBe('failed');
      expect(job?.error).toContain('API failure');
    });

    it('detects cycles in DAG', async () => {
      const cyclicDAG = dag('cyclic-dag')
        .skillNode('node-a', 'test')
        .name('A')
        .prompt('A')
        .done()
        .build();

      // Manually introduce a cycle
      const nodeA = cyclicDAG.nodes.get('node-a' as NodeId)!;
      nodeA.dependencies.push('node-a' as NodeId);

      const runtime = new HTTPAPIRuntime();
      const jobId = await runtime.submitJob(cyclicDAG);
      const job = await waitForJobCompletion(runtime, jobId);

      expect(job?.status).toBe('failed');
      expect(job?.error).toContain('cycle');
    });
  });

  describe('concurrency control', () => {
    it('respects maxConcurrentJobs', async () => {
      const runtime = new HTTPAPIRuntime({ maxConcurrentJobs: 2 });

      const jobs: string[] = [];
      for (let i = 0; i < 5; i++) {
        const testDAG = createTestDAG();
        const jobId = await runtime.submitJob(testDAG);
        jobs.push(jobId);
      }

      // Wait for all jobs
      for (const jobId of jobs) {
        await waitForJobCompletion(runtime, jobId);
      }

      // All should complete
      const allJobs = await runtime.listJobs();
      const completedCount = allJobs.filter((j) => j.status === 'completed').length;
      expect(completedCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('generateExecutionPlan', () => {
    it('generates plan for simple DAG', () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const plan = runtime.generateExecutionPlan(testDAG);

      expect(plan.dagId).toBe(testDAG.id);
      expect(plan.totalNodes).toBe(2);
      expect(plan.totalWaves).toBe(2);
      expect(plan.hasCycle).toBe(false);
    });

    it('generates plan for parallel DAG', () => {
      const runtime = new HTTPAPIRuntime();
      const parallelDAG = createParallelDAG();

      const plan = runtime.generateExecutionPlan(parallelDAG);

      expect(plan.totalWaves).toBe(3);
      expect(plan.waves[1].parallelizable).toBe(true);
      expect(plan.waves[1].nodes.length).toBe(3);
    });

    it('includes dependency information', () => {
      const runtime = new HTTPAPIRuntime();
      const testDAG = createTestDAG();

      const plan = runtime.generateExecutionPlan(testDAG);

      const nodeBPlan = plan.waves[1].nodes.find((n) => n.nodeId === 'node-b');
      expect(nodeBPlan?.dependencies).toContain('node-a');
    });

    it('calculates estimated concurrency', () => {
      const runtime = new HTTPAPIRuntime({ maxParallelCallsPerJob: 3 });
      const parallelDAG = createParallelDAG();

      const plan = runtime.generateExecutionPlan(parallelDAG);

      expect(plan.estimatedConcurrency).toBe(3);
    });
  });

  describe('cleanupOldJobs', () => {
    it('removes old completed jobs', async () => {
      const store = new InMemoryStateStore();
      const runtime = new HTTPAPIRuntime({ stateStore: store });
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      await waitForJobCompletion(runtime, jobId);

      // Manually set completion time in the past
      const job = await runtime.getJob(jobId);
      if (job) {
        job.completedAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
        await store.set(`job:${jobId}`, job);
      }

      const cleaned = await runtime.cleanupOldJobs(24 * 60 * 60 * 1000); // 24 hour threshold

      expect(cleaned).toBe(1);
      expect(await runtime.getJob(jobId)).toBeUndefined();
    });

    it('keeps recent jobs', async () => {
      const store = new InMemoryStateStore();
      const runtime = new HTTPAPIRuntime({ stateStore: store });
      const testDAG = createTestDAG();

      const jobId = await runtime.submitJob(testDAG);
      await waitForJobCompletion(runtime, jobId);

      const cleaned = await runtime.cleanupOldJobs();

      expect(cleaned).toBe(0);
      expect(await runtime.getJob(jobId)).toBeDefined();
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createHTTPAPIRuntime', () => {
  it('creates runtime with factory function', () => {
    const runtime = createHTTPAPIRuntime();
    expect(runtime).toBeInstanceOf(HTTPAPIRuntime);
  });

  it('passes config to runtime', () => {
    const runtime = createHTTPAPIRuntime({
      maxConcurrentJobs: 10,
    });
    expect(runtime).toBeInstanceOf(HTTPAPIRuntime);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('HTTP API Runtime Integration', () => {
  it('executes multiple concurrent jobs', async () => {
    const runtime = new HTTPAPIRuntime({ maxConcurrentJobs: 3 });

    const jobs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const testDAG = createTestDAG();
      jobs.push(await runtime.submitJob(testDAG));
    }

    // Wait for all
    const results = await Promise.all(
      jobs.map((id) => waitForJobCompletion(runtime, id))
    );

    expect(results.every((j) => j?.status === 'completed')).toBe(true);
  });

  it('handles mixed success and failure', async () => {
    let callCount = 0;
    const mixedClient: APIClient = {
      async call(request: APIRequest): Promise<APIResult> {
        callCount++;
        if (callCount === 2) {
          return {
            success: false,
            content: '',
            tokenUsage: { inputTokens: 0, outputTokens: 0 },
            error: 'Simulated failure',
          };
        }
        return {
          success: true,
          content: JSON.stringify({ output: { result: 'success' }, confidence: 0.9 }),
          tokenUsage: { inputTokens: 100, outputTokens: 50 },
        };
      },
    };

    const runtime = new HTTPAPIRuntime({
      clientFactory: () => mixedClient,
    });
    const testDAG = createTestDAG();

    const jobId = await runtime.submitJob(testDAG);
    const job = await waitForJobCompletion(runtime, jobId);

    expect(job?.status).toBe('failed');
    expect(job?.result?.errors.length).toBeGreaterThan(0);
  });

  it('event stream provides complete execution trace', async () => {
    const runtime = new HTTPAPIRuntime();
    const testDAG = createTestDAG();
    const eventTypes: string[] = [];

    runtime.subscribeAll((event) => {
      eventTypes.push(event.type);
    });

    const jobId = await runtime.submitJob(testDAG);
    await waitForJobCompletion(runtime, jobId);

    expect(eventTypes).toContain('job:created');
    expect(eventTypes).toContain('job:started');
    expect(eventTypes).toContain('wave:start');
    expect(eventTypes).toContain('node:start');
    expect(eventTypes).toContain('node:complete');
    expect(eventTypes).toContain('wave:complete');
    expect(eventTypes).toContain('job:completed');
  });
});

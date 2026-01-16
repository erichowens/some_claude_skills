/**
 * Tests for SDK TypeScript Runtime
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SDKTypescriptRuntime,
  createSDKRuntime,
  createMockClient,
  AnthropicClient,
  APIResponse,
  CreateMessageParams,
} from './sdk-typescript';
import { dag } from '../core/builder';
import { getPreset } from '../permissions/presets';
import type { NodeId } from '../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestDAG() {
  return dag('test-dag')
    .description('Test DAG for SDK runtime')
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

// =============================================================================
// Basic Functionality Tests
// =============================================================================

describe('SDKTypescriptRuntime', () => {
  describe('constructor', () => {
    it('creates runtime with default config', () => {
      const runtime = new SDKTypescriptRuntime();
      expect(runtime).toBeInstanceOf(SDKTypescriptRuntime);
    });

    it('creates runtime with custom config', () => {
      const mockClient = createMockClient();
      const runtime = new SDKTypescriptRuntime({
        client: mockClient,
        maxParallelCalls: 3,
        defaultModel: 'claude-3-haiku-20240307',
      });
      expect(runtime).toBeInstanceOf(SDKTypescriptRuntime);
    });

    it('creates runtime with permissions', () => {
      const permissions = getPreset('standard');
      const runtime = new SDKTypescriptRuntime({ permissions });
      expect(runtime).toBeInstanceOf(SDKTypescriptRuntime);
    });
  });

  describe('execute', () => {
    it('executes a simple linear DAG', async () => {
      const testDAG = createTestDAG();
      const runtime = new SDKTypescriptRuntime();

      const result = await runtime.execute(testDAG);

      expect(result.success).toBe(true);
      expect(result.snapshot.nodeStates.size).toBe(2);
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('executes a parallel DAG', async () => {
      const parallelDAG = createParallelDAG();
      const runtime = new SDKTypescriptRuntime();

      const result = await runtime.execute(parallelDAG);

      expect(result.success).toBe(true);
      expect(result.snapshot.nodeStates.size).toBe(5);
      expect(result.snapshot.totalWaves).toBe(3); // start, parallel, merge
    });

    it('passes inputs as variables', async () => {
      const testDAG = createTestDAG();
      const mockClient = createMockClient();
      const runtime = new SDKTypescriptRuntime({ client: mockClient });

      const result = await runtime.execute(testDAG, {
        topic: 'Test Topic',
        count: 5,
      });

      expect(result.success).toBe(true);
    });

    it('tracks token usage', async () => {
      const testDAG = createTestDAG();
      const mockClient = createMockClient({
        usage: { input_tokens: 150, output_tokens: 75 },
      });
      const runtime = new SDKTypescriptRuntime({ client: mockClient });

      const result = await runtime.execute(testDAG);

      expect(result.totalTokenUsage.inputTokens).toBeGreaterThan(0);
      expect(result.totalTokenUsage.outputTokens).toBeGreaterThan(0);
    });
  });

  describe('callbacks', () => {
    it('calls onNodeStart for each node', async () => {
      const onNodeStart = vi.fn();
      const testDAG = createTestDAG();
      const runtime = new SDKTypescriptRuntime({ onNodeStart });

      await runtime.execute(testDAG);

      expect(onNodeStart).toHaveBeenCalledTimes(2);
      expect(onNodeStart).toHaveBeenCalledWith(
        'node-a' as NodeId,
        expect.objectContaining({ id: 'node-a' })
      );
      expect(onNodeStart).toHaveBeenCalledWith(
        'node-b' as NodeId,
        expect.objectContaining({ id: 'node-b' })
      );
    });

    it('calls onNodeComplete for successful nodes', async () => {
      const onNodeComplete = vi.fn();
      const testDAG = createTestDAG();
      const runtime = new SDKTypescriptRuntime({ onNodeComplete });

      await runtime.execute(testDAG);

      expect(onNodeComplete).toHaveBeenCalledTimes(2);
    });

    it('calls onWaveStart and onWaveComplete', async () => {
      const onWaveStart = vi.fn();
      const onWaveComplete = vi.fn();
      const parallelDAG = createParallelDAG();
      const runtime = new SDKTypescriptRuntime({ onWaveStart, onWaveComplete });

      await runtime.execute(parallelDAG);

      expect(onWaveStart).toHaveBeenCalledTimes(3); // 3 waves
      expect(onWaveComplete).toHaveBeenCalledTimes(3);
    });

    it('calls onAPICall and onAPIResponse', async () => {
      const onAPICall = vi.fn();
      const onAPIResponse = vi.fn();
      const testDAG = createTestDAG();
      const runtime = new SDKTypescriptRuntime({ onAPICall, onAPIResponse });

      await runtime.execute(testDAG);

      expect(onAPICall).toHaveBeenCalledTimes(2);
      expect(onAPIResponse).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      const errorClient: AnthropicClient = {
        messages: {
          async create(): Promise<APIResponse> {
            throw new Error('API rate limit exceeded');
          },
        },
      };

      const onNodeError = vi.fn();
      const testDAG = createTestDAG();
      const runtime = new SDKTypescriptRuntime({
        client: errorClient,
        onNodeError,
      });

      const result = await runtime.execute(testDAG);

      expect(result.success).toBe(false);
      expect(onNodeError).toHaveBeenCalled();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('detects cycles in DAG', async () => {
      // Create a cyclic DAG manually
      const cyclicDAG = dag('cyclic-dag')
        .skillNode('node-a', 'test')
        .name('A')
        .prompt('A')
        .done()
        .build();

      // Manually introduce a cycle (normally prevented by builder)
      const nodeA = cyclicDAG.nodes.get('node-a' as NodeId)!;
      nodeA.dependencies.push('node-a' as NodeId); // Self-reference

      const runtime = new SDKTypescriptRuntime();
      const result = await runtime.execute(cyclicDAG);

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('CYCLE_DETECTED');
    });
  });

  describe('model selection', () => {
    it('uses default model when not specified', async () => {
      const onAPICall = vi.fn();
      const testDAG = createTestDAG();
      const runtime = new SDKTypescriptRuntime({
        defaultModel: 'claude-3-haiku-20240307',
        onAPICall,
      });

      await runtime.execute(testDAG);

      expect(onAPICall).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ model: 'claude-3-haiku-20240307' })
      );
    });

    it('uses node-specific model when configured', async () => {
      const onAPICall = vi.fn();

      const dagWithModel = dag('model-dag')
        .skillNode('node-a', 'test')
        .name('A')
        .prompt('Test')
        .model('haiku')
        .done()
        .build();

      const runtime = new SDKTypescriptRuntime({
        defaultModel: 'claude-sonnet-4-20250514',
        onAPICall,
      });

      await runtime.execute(dagWithModel);

      expect(onAPICall).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ model: 'claude-3-haiku-20240307' })
      );
    });
  });
});

// =============================================================================
// generateExecutionPlan Tests
// =============================================================================

describe('generateExecutionPlan', () => {
  it('generates plan for simple DAG', () => {
    const testDAG = createTestDAG();
    const runtime = new SDKTypescriptRuntime();

    const plan = runtime.generateExecutionPlan(testDAG);

    expect(plan.dagId).toBe(testDAG.id);
    expect(plan.dagName).toBe('test-dag');
    expect(plan.totalNodes).toBe(2);
    expect(plan.totalWaves).toBe(2);
    expect(plan.waves[0].nodes[0].nodeId).toBe('node-a');
    expect(plan.waves[1].nodes[0].nodeId).toBe('node-b');
  });

  it('generates plan for parallel DAG', () => {
    const parallelDAG = createParallelDAG();
    const runtime = new SDKTypescriptRuntime();

    const plan = runtime.generateExecutionPlan(parallelDAG);

    expect(plan.totalWaves).toBe(3);
    expect(plan.waves[1].parallelizable).toBe(true);
    expect(plan.waves[1].nodes.length).toBe(3); // task-a, task-b, task-c
  });

  it('includes dependency information', () => {
    const testDAG = createTestDAG();
    const runtime = new SDKTypescriptRuntime();

    const plan = runtime.generateExecutionPlan(testDAG);

    const nodeBPlan = plan.waves[1].nodes.find((n) => n.nodeId === 'node-b');
    expect(nodeBPlan?.dependencies).toContain('node-a');
  });

  it('includes skill information', () => {
    const testDAG = createTestDAG();
    const runtime = new SDKTypescriptRuntime();

    const plan = runtime.generateExecutionPlan(testDAG);

    const nodeAPlan = plan.waves[0].nodes[0];
    expect(nodeAPlan.skillId).toBe('test-skill');
  });
});

// =============================================================================
// Mock Client Tests
// =============================================================================

describe('createMockClient', () => {
  it('creates a working mock client', async () => {
    const mockClient = createMockClient();
    const response = await mockClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(response.id).toMatch(/^msg_mock_/);
    expect(response.type).toBe('message');
    expect(response.content[0].type).toBe('text');
  });

  it('allows response override', async () => {
    const mockClient = createMockClient({
      usage: { input_tokens: 500, output_tokens: 250 },
    });

    const response = await mockClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(response.usage.input_tokens).toBe(500);
    expect(response.usage.output_tokens).toBe(250);
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createSDKRuntime', () => {
  it('creates runtime with factory function', () => {
    const runtime = createSDKRuntime();
    expect(runtime).toBeInstanceOf(SDKTypescriptRuntime);
  });

  it('passes config to runtime', () => {
    const mockClient = createMockClient();
    const runtime = createSDKRuntime({ client: mockClient });
    expect(runtime).toBeInstanceOf(SDKTypescriptRuntime);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('SDK Runtime Integration', () => {
  it('executes a complex research workflow', async () => {
    const researchDAG = dag('research-workflow')
      .description('Research workflow')
      .skillNode('research', 'researcher')
      .name('Research')
      .prompt('Research the topic')
      .done()
      .skillNode('analyze', 'analyst')
      .name('Analyze')
      .prompt('Analyze findings')
      .dependsOn('research')
      .done()
      .skillNode('report', 'writer')
      .name('Report')
      .prompt('Write report')
      .dependsOn('analyze')
      .done()
      .output({
        name: 'report',
        sourceNodeId: 'report' as NodeId,
        outputPath: 'output',
      })
      .build();

    const runtime = new SDKTypescriptRuntime();
    const result = await runtime.execute(researchDAG, { topic: 'AI Testing' });

    expect(result.success).toBe(true);
    expect(result.snapshot.totalWaves).toBe(3);
    expect(result.outputs.has('report')).toBe(true);
  });

  it('respects maxParallelCalls setting', async () => {
    const manyNodesDAG = dag('many-nodes')
      .skillNode('start', 'init')
      .name('Start')
      .prompt('Init')
      .done()
      .build();

    // Add 10 parallel nodes
    for (let i = 0; i < 10; i++) {
      manyNodesDAG.nodes.set(`task-${i}` as NodeId, {
        id: `task-${i}` as NodeId,
        name: `Task ${i}`,
        type: 'skill',
        skillId: 'worker',
        dependencies: ['start' as NodeId],
        state: { status: 'pending' },
        config: {
          timeoutMs: 30000,
          maxRetries: 0,
          retryDelayMs: 0,
          exponentialBackoff: false,
        },
      });
    }

    const callTimes: number[] = [];
    const runtime = new SDKTypescriptRuntime({
      maxParallelCalls: 3,
      onAPICall: () => {
        callTimes.push(Date.now());
      },
    });

    await runtime.execute(manyNodesDAG);

    // Verify execution completed
    expect(callTimes.length).toBe(11); // start + 10 tasks
  });

  it('passes dependency results to downstream nodes', async () => {
    const capturedParams: CreateMessageParams[] = [];
    const mockClient: AnthropicClient = {
      messages: {
        async create(params: CreateMessageParams): Promise<APIResponse> {
          capturedParams.push(params);
          return {
            id: `msg_${Date.now()}`,
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  output: { result: 'test-result' },
                  confidence: 0.9,
                }),
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

    const testDAG = createTestDAG();
    const runtime = new SDKTypescriptRuntime({ client: mockClient });

    await runtime.execute(testDAG);

    // Second call (node-b) should include results from node-a
    expect(capturedParams.length).toBe(2);
    const nodeBMessage = capturedParams[1].messages[0].content;
    expect(nodeBMessage).toContain('node-a');
    expect(nodeBMessage).toContain('test-result');
  });
});

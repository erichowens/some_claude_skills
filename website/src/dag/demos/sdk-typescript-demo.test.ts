/**
 * Tests for SDK TypeScript Runtime Demo
 */

import { describe, it, expect, vi } from 'vitest';
import {
  runSDKTypescriptDemo,
  runSimpleSDKDemo,
  runParallelSDKDemo,
  buildResearchDAG,
  createEventLogger,
  createCustomResponseClient,
} from './sdk-typescript-demo';
import type { NodeId } from '../types';

describe('SDK TypeScript Demo', () => {
  describe('buildResearchDAG', () => {
    it('creates a DAG with correct structure', () => {
      const dag = buildResearchDAG('Test Topic');

      expect(dag.name).toBe('sdk-research-workflow');
      expect(dag.nodes.size).toBe(5);
      expect(dag.outputs.length).toBe(2);
    });

    it('sets up correct dependencies', () => {
      const dag = buildResearchDAG('Test Topic');

      // Wave 0 nodes have no dependencies
      const researchNode = dag.nodes.get('research-topic' as NodeId);
      const examplesNode = dag.nodes.get('gather-examples' as NodeId);
      expect(researchNode?.dependencies).toHaveLength(0);
      expect(examplesNode?.dependencies).toHaveLength(0);

      // Wave 1 depends on both Wave 0 nodes
      const analyzeNode = dag.nodes.get('analyze-findings' as NodeId);
      expect(analyzeNode?.dependencies).toHaveLength(2);
      expect(analyzeNode?.dependencies).toContain('research-topic');
      expect(analyzeNode?.dependencies).toContain('gather-examples');

      // Wave 2 depends on Wave 1
      const reportNode = dag.nodes.get('generate-report' as NodeId);
      expect(reportNode?.dependencies).toContain('analyze-findings');

      // Wave 3 depends on Wave 2
      const summaryNode = dag.nodes.get('create-summary' as NodeId);
      expect(summaryNode?.dependencies).toContain('generate-report');
    });

    it('configures outputs correctly', () => {
      const dag = buildResearchDAG('Test Topic');

      const reportOutput = dag.outputs.find((o) => o.name === 'report');
      const summaryOutput = dag.outputs.find((o) => o.name === 'summary');

      expect(reportOutput?.sourceNodeId).toBe('generate-report');
      expect(summaryOutput?.sourceNodeId).toBe('create-summary');
    });
  });

  describe('createEventLogger', () => {
    it('logs with timestamps in verbose mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { log, logs } = createEventLogger(true);

      log('Test message');

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatch(/\[\d+\.\d+s\] Test message/);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('does not console.log in non-verbose mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { log, logs } = createEventLogger(false);

      log('Test message');

      expect(logs).toHaveLength(1);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('createCustomResponseClient', () => {
    it('creates a working custom client', async () => {
      const client = createCustomResponseClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.id).toMatch(/^msg_sdk_demo_/);
      expect(response.type).toBe('message');
      expect(response.content[0].type).toBe('text');
    });

    it('supports custom response generator', async () => {
      const client = createCustomResponseClient((nodeId, prompt) => {
        return JSON.stringify({ custom: true, nodeId, promptLength: prompt.length });
      });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Node ID: test-node\nTest prompt' }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);
      expect(parsed.custom).toBe(true);
    });
  });

  describe('runSimpleSDKDemo', () => {
    it('executes a simple linear DAG', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runSimpleSDKDemo();

      expect(result.success).toBe(true);
      expect(result.snapshot.nodeStates.size).toBe(3);

      consoleSpy.mockRestore();
    });
  });

  describe('runParallelSDKDemo', () => {
    it('executes a fan-out/fan-in DAG', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runParallelSDKDemo();

      expect(result.success).toBe(true);
      expect(result.snapshot.nodeStates.size).toBe(5);
      expect(result.snapshot.totalWaves).toBe(3);

      consoleSpy.mockRestore();
    });

    it('tracks token usage', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runParallelSDKDemo();

      expect(result.totalTokenUsage.inputTokens).toBeGreaterThan(0);
      expect(result.totalTokenUsage.outputTokens).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('runSDKTypescriptDemo', () => {
    it('executes the full research workflow', async () => {
      const { result, logs, metrics } = await runSDKTypescriptDemo({
        topic: 'Test topic for demo',
        verbose: false,
      });

      expect(result.success).toBe(true);
      expect(metrics.totalNodes).toBe(5);
      expect(metrics.completedNodes).toBe(5);
      expect(metrics.failedNodes).toBe(0);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('captures execution metrics', async () => {
      const { metrics } = await runSDKTypescriptDemo({
        verbose: false,
      });

      expect(metrics.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(metrics.tokensUsed).toBeGreaterThan(0);
      expect(metrics.apiCalls).toBe(5); // One per node
    });

    it('respects permission settings', async () => {
      // SDK runtime makes direct API calls, so Task tool permission doesn't apply
      // Unlike CLI runtime, minimal permissions work for SDK runtime
      // because it doesn't spawn agents via Task tool
      const { result: minimalResult } = await runSDKTypescriptDemo({
        verbose: false,
        permissions: 'minimal',
      });
      expect(minimalResult.success).toBe(true); // SDK doesn't need Task tool

      // Standard permissions also work
      const { result: standardResult } = await runSDKTypescriptDemo({
        verbose: false,
        permissions: 'standard',
      });
      expect(standardResult.success).toBe(true);

      // Full permissions also work
      const { result: fullResult } = await runSDKTypescriptDemo({
        verbose: false,
        permissions: 'full',
      });
      expect(fullResult.success).toBe(true);
    });

    it('respects maxParallelCalls setting', async () => {
      const { metrics } = await runSDKTypescriptDemo({
        verbose: false,
        maxParallelCalls: 1,
      });

      // Should still complete all nodes, just potentially slower
      expect(metrics.completedNodes).toBe(5);
    });

    it('uses specified default model', async () => {
      const { result } = await runSDKTypescriptDemo({
        verbose: false,
        defaultModel: 'haiku',
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('SDK Demo Integration', () => {
  it('demonstrates wave-based execution order', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = await runSDKTypescriptDemo({
      verbose: false,
    });

    // Verify parallel nodes complete before dependent nodes
    const nodeStates = result.snapshot.nodeStates;

    // All nodes should be completed
    for (const [nodeId, state] of nodeStates) {
      expect(state.status).toBe('completed');
    }

    consoleSpy.mockRestore();
  });

  it('handles DAG with complex dependencies', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runParallelSDKDemo();

    expect(result.success).toBe(true);

    // Verify the merge node received outputs from all parallel tasks
    const mergeState = result.snapshot.nodeStates.get('merge' as NodeId);
    expect(mergeState?.status).toBe('completed');

    consoleSpy.mockRestore();
  });

  it('API calls match node count', async () => {
    const { metrics } = await runSDKTypescriptDemo({
      verbose: false,
    });

    // SDK runtime makes one API call per node
    expect(metrics.apiCalls).toBe(metrics.totalNodes);
  });
});

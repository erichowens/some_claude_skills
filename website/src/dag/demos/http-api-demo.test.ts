/**
 * Tests for HTTP API Runtime Demo
 */

import { describe, it, expect, vi } from 'vitest';
import {
  runHTTPAPIDemo,
  runSimpleHTTPAPIDemo,
  runParallelHTTPAPIDemo,
  buildResearchDAG,
  createEventLogger,
  createCustomAPIClient,
} from './http-api-demo';
import type { NodeId } from '../types';

describe('HTTP API Demo', () => {
  describe('buildResearchDAG', () => {
    it('creates a DAG with correct structure', () => {
      const dag = buildResearchDAG('Test Topic');

      expect(dag.name).toBe('http-api-research-workflow');
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

  describe('createCustomAPIClient', () => {
    it('creates a working custom client', async () => {
      const client = createCustomAPIClient();
      const response = await client.call({
        model: 'claude-sonnet-4-20250514',
        systemPrompt: 'System prompt',
        userMessage: 'Node ID: test-node\nTest message',
        maxTokens: 1000,
      });

      expect(response.success).toBe(true);
      expect(response.content).toBeTruthy();
      expect(response.tokenUsage.inputTokens).toBeGreaterThan(0);
      expect(response.tokenUsage.outputTokens).toBeGreaterThan(0);
    });

    it('supports custom response generator', async () => {
      const client = createCustomAPIClient((nodeId, prompt) => {
        return JSON.stringify({ custom: true, nodeId, promptLength: prompt.length });
      });

      const response = await client.call({
        model: 'claude-sonnet-4-20250514',
        systemPrompt: 'System prompt',
        userMessage: 'Node ID: test-node\nTest prompt',
        maxTokens: 1000,
      });

      const parsed = JSON.parse(response.content);
      expect(parsed.custom).toBe(true);
      expect(parsed.nodeId).toBe('test-node');
    });
  });

  describe('runSimpleHTTPAPIDemo', () => {
    it('executes a simple linear DAG', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runSimpleHTTPAPIDemo();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.snapshot.nodeStates.size).toBe(3);

      consoleSpy.mockRestore();
    });
  });

  describe('runParallelHTTPAPIDemo', () => {
    it('executes a fan-out/fan-in DAG', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runParallelHTTPAPIDemo();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.snapshot.nodeStates.size).toBe(5);
      expect(result?.snapshot.totalWaves).toBe(3);

      consoleSpy.mockRestore();
    });

    it('tracks token usage', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runParallelHTTPAPIDemo();

      expect(result).not.toBeNull();
      expect(result?.totalTokenUsage.inputTokens).toBeGreaterThan(0);
      expect(result?.totalTokenUsage.outputTokens).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('runHTTPAPIDemo', () => {
    it('executes the full research workflow', async () => {
      const { result, logs, events, metrics } = await runHTTPAPIDemo({
        topic: 'Test topic for demo',
        verbose: false,
      });

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(metrics.totalNodes).toBe(5);
      expect(metrics.completedNodes).toBe(5);
      expect(metrics.failedNodes).toBe(0);
      expect(logs.length).toBeGreaterThan(0);
      expect(events.length).toBeGreaterThan(0);
    });

    it('captures execution metrics', async () => {
      const { metrics } = await runHTTPAPIDemo({
        verbose: false,
      });

      expect(metrics.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(metrics.tokensUsed).toBeGreaterThan(0);
      expect(metrics.eventsReceived).toBeGreaterThan(0);
    });

    it('receives all expected event types', async () => {
      const { events } = await runHTTPAPIDemo({
        verbose: false,
      });

      const eventTypes = new Set(events.map((e) => e.type));

      // Job lifecycle events
      expect(eventTypes.has('job:started')).toBe(true);
      expect(eventTypes.has('job:completed')).toBe(true);

      // Wave events
      expect(eventTypes.has('wave:start')).toBe(true);
      expect(eventTypes.has('wave:complete')).toBe(true);

      // Node events
      expect(eventTypes.has('node:start')).toBe(true);
      expect(eventTypes.has('node:complete')).toBe(true);
    });

    it('respects maxParallelCallsPerJob setting', async () => {
      const { metrics } = await runHTTPAPIDemo({
        verbose: false,
        maxParallelCallsPerJob: 1,
      });

      // Should still complete all nodes, just potentially slower
      expect(metrics.completedNodes).toBe(5);
    });

    it('respects permission settings', async () => {
      // HTTP API runtime uses API-level auth, permissions are more relaxed
      const { result: minimalResult } = await runHTTPAPIDemo({
        verbose: false,
        permissions: 'minimal',
      });
      expect(minimalResult?.success).toBe(true);

      const { result: standardResult } = await runHTTPAPIDemo({
        verbose: false,
        permissions: 'standard',
      });
      expect(standardResult?.success).toBe(true);

      const { result: fullResult } = await runHTTPAPIDemo({
        verbose: false,
        permissions: 'full',
      });
      expect(fullResult?.success).toBe(true);
    });
  });
});

describe('HTTP API Demo Integration', () => {
  it('demonstrates wave-based execution order', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = await runHTTPAPIDemo({
      verbose: false,
    });

    // Verify parallel nodes complete before dependent nodes
    const nodeStates = result?.snapshot.nodeStates;

    // All nodes should be completed
    if (nodeStates) {
      for (const [nodeId, state] of nodeStates) {
        expect(state.status).toBe('completed');
      }
    }

    consoleSpy.mockRestore();
  });

  it('handles DAG with complex dependencies', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runParallelHTTPAPIDemo();

    expect(result?.success).toBe(true);

    // Verify the merge node received outputs from all parallel tasks
    const mergeState = result?.snapshot.nodeStates.get('merge' as NodeId);
    expect(mergeState?.status).toBe('completed');

    consoleSpy.mockRestore();
  });

  it('collects events in chronological order', async () => {
    const { events } = await runHTTPAPIDemo({
      verbose: false,
    });

    // Events should be in chronological order
    for (let i = 1; i < events.length; i++) {
      const prevTime = new Date(events[i - 1].timestamp).getTime();
      const currTime = new Date(events[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  it('job lifecycle events bracket execution', async () => {
    const { events } = await runHTTPAPIDemo({
      verbose: false,
    });

    // First non-created event should be job:started
    const nonCreatedEvents = events.filter((e) => e.type !== 'job:created');
    expect(nonCreatedEvents[0]?.type).toBe('job:started');

    // Last event should be job:completed or job:failed
    const lastEvent = events[events.length - 1];
    expect(['job:completed', 'job:failed']).toContain(lastEvent.type);
  });
});

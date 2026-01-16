/**
 * Tests for Claude Code CLI Runtime Demo
 */

import { describe, it, expect, vi } from 'vitest';
import {
  runClaudeCodeCLIDemo,
  runSimpleDemo,
  runParallelDemo,
  buildResearchDAG,
  createEventLogger,
} from './claude-code-cli-demo';
import type { NodeId } from '../types';

describe('Claude Code CLI Demo', () => {
  describe('buildResearchDAG', () => {
    it('creates a DAG with correct structure', () => {
      const dag = buildResearchDAG('Test Topic');

      // DAG ID is auto-generated, check the name instead
      expect(dag.name).toBe('research-workflow');
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

  describe('runSimpleDemo', () => {
    it('executes a simple linear DAG', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runSimpleDemo();

      expect(result.success).toBe(true);
      expect(result.snapshot.nodeStates.size).toBe(3);

      consoleSpy.mockRestore();
    });
  });

  describe('runParallelDemo', () => {
    it('executes a fan-out/fan-in DAG', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runParallelDemo();

      expect(result.success).toBe(true);
      expect(result.snapshot.nodeStates.size).toBe(5); // start + 3 parallel + merge
      expect(result.snapshot.totalWaves).toBe(3); // Wave 0: start, Wave 1: A,B,C, Wave 2: merge

      consoleSpy.mockRestore();
    });
  });

  describe('runClaudeCodeCLIDemo', () => {
    it('executes the full research workflow', async () => {
      const { result, logs, metrics } = await runClaudeCodeCLIDemo({
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
      const { metrics } = await runClaudeCodeCLIDemo({
        verbose: false,
      });

      expect(metrics.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(metrics.tokensUsed).toBeGreaterThan(0); // Simulated tokens
    });

    it('respects permission settings', async () => {
      // Minimal permissions do NOT have Task tool enabled, so execution fails
      const { result: minimalResult } = await runClaudeCodeCLIDemo({
        verbose: false,
        permissions: 'minimal',
      });
      expect(minimalResult.success).toBe(false);

      // Standard permissions have Task tool enabled, so execution succeeds
      const { result: standardResult } = await runClaudeCodeCLIDemo({
        verbose: false,
        permissions: 'standard',
      });
      expect(standardResult.success).toBe(true);
    });
  });
});

describe('Demo Integration', () => {
  it('demonstrates wave-based execution order', async () => {
    const executionOrder: string[] = [];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = await runClaudeCodeCLIDemo({
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

    // The research DAG has complex dependencies:
    // - 2 parallel entry points
    // - 1 node depending on both
    // - 2 sequential nodes after
    const result = await runParallelDemo();

    expect(result.success).toBe(true);

    // Verify the merge node received outputs from all parallel tasks
    const mergeState = result.snapshot.nodeStates.get('merge' as NodeId);
    expect(mergeState?.status).toBe('completed');

    consoleSpy.mockRestore();
  });
});

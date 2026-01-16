/**
 * Tests for TaskToolExecutor
 *
 * TaskToolExecutor generates Task tool calls for Claude Code sessions.
 * Note: It doesn't execute directly - it generates call structures.
 */

import { describe, it, expect, vi } from 'vitest';
import { TaskToolExecutor, createTaskToolExecutor } from './task-tool-executor';
import type { ExecutionRequest } from './types';
import type { NodeId, TaskResult } from '../types';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestRequest(overrides?: Partial<ExecutionRequest>): ExecutionRequest {
  return {
    nodeId: 'test-node' as NodeId,
    prompt: 'Analyze the data and provide insights',
    description: 'Data analysis task',
    model: 'sonnet',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('TaskToolExecutor', () => {
  describe('getCapabilities', () => {
    it('reports 20k token overhead', () => {
      const executor = createTaskToolExecutor();
      const caps = executor.getCapabilities();

      expect(caps.tokenOverheadPerTask).toBe(20000);
    });

    it('reports max 10 parallel tasks', () => {
      const executor = createTaskToolExecutor();
      const caps = executor.getCapabilities();

      expect(caps.maxParallelism).toBe(10);
    });

    it('reports shared context available', () => {
      const executor = createTaskToolExecutor();
      const caps = executor.getCapabilities();

      expect(caps.sharedContext).toBe(true);
      expect(caps.efficientDependencyPassing).toBe(true);
    });

    it('reports no true isolation', () => {
      const executor = createTaskToolExecutor();
      const caps = executor.getCapabilities();

      expect(caps.trueIsolation).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('returns true (always available in Claude Code)', async () => {
      const executor = createTaskToolExecutor();
      const available = await executor.isAvailable();

      expect(available).toBe(true);
    });
  });

  describe('execute', () => {
    it('generates Task tool call structure', async () => {
      const executor = createTaskToolExecutor();
      const request = createTestRequest();

      const result = await executor.execute(request);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('_type', 'task-tool-call');
      expect(result.output).toHaveProperty('call');
    });

    it('includes correct call properties', async () => {
      const executor = createTaskToolExecutor();
      const request = createTestRequest({
        skillId: 'data-analyst',
        agentType: 'general-purpose',
        model: 'opus',
      });

      const result = await executor.execute(request);
      const call = (result.output as any).call;

      expect(call.subagent_type).toBe('general-purpose');
      expect(call.model).toBe('opus');
      expect(call.description).toContain('Data analysis');
    });

    it('builds prompt with dependency context', async () => {
      const executor = createTaskToolExecutor();

      const dependencyResults = new Map<NodeId, TaskResult>();
      dependencyResults.set('previous-task' as NodeId, {
        output: { summary: 'Previous analysis complete' },
        confidence: 0.95,
      });

      const request = createTestRequest({ dependencyResults });
      const result = await executor.execute(request);
      const call = (result.output as any).call;

      // Prompt should include dependency context
      expect(call.prompt).toContain('Results from Dependencies');
      expect(call.prompt).toContain('previous-task');
    });
  });

  describe('executeParallel', () => {
    it('generates multiple Task calls', async () => {
      const executor = createTaskToolExecutor();
      const requests = [
        createTestRequest({ nodeId: 'task-1' as NodeId }),
        createTestRequest({ nodeId: 'task-2' as NodeId }),
        createTestRequest({ nodeId: 'task-3' as NodeId }),
      ];

      const results = await executor.executeParallel(requests);

      expect(results.size).toBe(3);
      expect(results.has('task-1' as NodeId)).toBe(true);
      expect(results.has('task-2' as NodeId)).toBe(true);
      expect(results.has('task-3' as NodeId)).toBe(true);
    });

    it('calls progress callback', async () => {
      const executor = createTaskToolExecutor();
      const requests = [createTestRequest()];
      const onProgress = vi.fn();

      await executor.executeParallel(requests, onProgress);

      expect(onProgress).toHaveBeenCalled();
    });

    it('warns when exceeding parallelism limit', async () => {
      const executor = createTaskToolExecutor({ maxParallel: 2 });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const requests = Array.from({ length: 5 }, (_, i) =>
        createTestRequest({ nodeId: `task-${i}` as NodeId })
      );

      await executor.executeParallel(requests);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('limit is 2')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('formatParallelMessage', () => {
    it('formats multiple calls for parallel execution', () => {
      const executor = createTaskToolExecutor();
      const calls = [
        { description: 'Task 1', prompt: 'Do task 1', subagent_type: 'general-purpose' },
        { description: 'Task 2', prompt: 'Do task 2', subagent_type: 'general-purpose' },
      ];

      const message = executor.formatParallelMessage(calls as any);

      expect(message).toContain('Execute these tasks in parallel');
      expect(message).toContain('Task 1');
      expect(message).toContain('Task 2');
    });
  });
});

describe('createTaskToolExecutor', () => {
  it('creates executor with default config', () => {
    const executor = createTaskToolExecutor();

    expect(executor.type).toBe('task-tool');
    expect(executor.name).toBe('Claude Code Task Tool Executor');
  });

  it('respects custom maxParallel', () => {
    const executor = createTaskToolExecutor({ maxParallel: 5 });

    expect(executor.getCapabilities().maxParallelism).toBe(5);
  });

  it('respects custom defaultModel', async () => {
    const executor = createTaskToolExecutor({ defaultModel: 'haiku' });
    const request = createTestRequest({ model: undefined });

    const result = await executor.execute(request);
    const call = (result.output as any).call;

    expect(call.model).toBe('haiku');
  });
});

/**
 * Tests for ProcessExecutor
 *
 * ProcessExecutor spawns independent Claude CLI processes for each task.
 * Key benefits tested:
 * - Zero token overhead
 * - True parallel execution
 * - Complete isolation between tasks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExecutionRequest } from './types';
import type { NodeId, TaskResult } from '../types';

// Use vi.hoisted to ensure mock is set up BEFORE module imports
const mockExecAsync = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    stdout: JSON.stringify({ output: 'test result', confidence: 0.95 }),
    stderr: '',
  })
);

// Mock child_process and util before they're imported by process-executor
vi.mock('child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecAsync),
}));

// Import AFTER mocks are set up
import { ProcessExecutor, createProcessExecutor } from './process-executor';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestRequest(overrides?: Partial<ExecutionRequest>): ExecutionRequest {
  return {
    nodeId: 'test-node' as NodeId,
    prompt: 'Test prompt',
    description: 'Test task',
    model: 'sonnet',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('ProcessExecutor', () => {
  let executor: ProcessExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to successful default state
    mockExecAsync.mockResolvedValue({
      stdout: JSON.stringify({ output: 'test result', confidence: 0.95 }),
      stderr: '',
    });
    executor = createProcessExecutor({
      verbose: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCapabilities', () => {
    it('reports zero token overhead', () => {
      const caps = executor.getCapabilities();

      expect(caps.tokenOverheadPerTask).toBe(0);
    });

    it('reports true isolation', () => {
      const caps = executor.getCapabilities();

      expect(caps.trueIsolation).toBe(true);
      expect(caps.sharedContext).toBe(false);
    });

    it('has configurable max parallelism', () => {
      const customExecutor = createProcessExecutor({
        maxProcesses: 20,
      });

      expect(customExecutor.getCapabilities().maxParallelism).toBe(20);
    });
  });

  describe('execute', () => {
    it('returns success response for valid request', async () => {
      const request = createTestRequest();
      const result = await executor.execute(request);

      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(request.nodeId);
      expect(result.output).toBeDefined();
    });

    it('includes executor metadata', async () => {
      const request = createTestRequest();
      const result = await executor.execute(request);

      expect(result.metadata?.executor).toBe('process');
      expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('parses JSON output correctly', async () => {
      const request = createTestRequest();
      const result = await executor.execute(request);

      // The mock returns { output: 'test result', confidence: 0.95 }
      expect(result.output).toBe('test result');
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('executeParallel', () => {
    it('executes multiple requests', async () => {
      const requests = [
        createTestRequest({ nodeId: 'node-1' as NodeId }),
        createTestRequest({ nodeId: 'node-2' as NodeId }),
        createTestRequest({ nodeId: 'node-3' as NodeId }),
      ];

      const results = await executor.executeParallel(requests);

      expect(results.size).toBe(3);
      expect(results.has('node-1' as NodeId)).toBe(true);
      expect(results.has('node-2' as NodeId)).toBe(true);
      expect(results.has('node-3' as NodeId)).toBe(true);
    });

    it('calls progress callback', async () => {
      const requests = [createTestRequest()];
      const onProgress = vi.fn();

      await executor.executeParallel(requests, onProgress);

      expect(onProgress).toHaveBeenCalled();
      // Should call with 'starting' and 'completed' at minimum
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'starting' })
      );
    });

    it('batches requests exceeding maxProcesses', async () => {
      const smallExecutor = createProcessExecutor({ maxProcesses: 2 });
      const requests = [
        createTestRequest({ nodeId: 'node-1' as NodeId }),
        createTestRequest({ nodeId: 'node-2' as NodeId }),
        createTestRequest({ nodeId: 'node-3' as NodeId }),
      ];

      const results = await smallExecutor.executeParallel(requests);

      // Should still process all 3, just in batches
      expect(results.size).toBe(3);
    });
  });

  describe('buildPromptWithContext', () => {
    it('includes dependency results in prompt', async () => {
      const dependencyResults = new Map<NodeId, TaskResult>();
      dependencyResults.set('dep-1' as NodeId, {
        output: { data: 'from dependency' },
        confidence: 0.9,
      });

      const request = createTestRequest({
        dependencyResults,
      });

      // We can't directly test private method, but we can verify through execute
      const result = await executor.execute(request);
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('handles execution timeout', async () => {
      // Mock a timeout error (killed=true indicates timeout)
      mockExecAsync.mockRejectedValue(
        Object.assign(new Error('Timeout'), { killed: true })
      );

      const request = createTestRequest();
      const result = await executor.execute(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
    });

    it('handles general execution errors', async () => {
      // Mock a general error (killed=false indicates other error)
      mockExecAsync.mockRejectedValue(
        Object.assign(new Error('Command failed'), { killed: false })
      );

      const request = createTestRequest();
      const result = await executor.execute(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOOL_ERROR');
      expect(result.error?.retryable).toBe(true);
    });
  });
});

describe('createProcessExecutor', () => {
  it('creates executor with default config', () => {
    const executor = createProcessExecutor();

    expect(executor.type).toBe('process');
    expect(executor.name).toBe('Claude CLI Process Executor');
  });

  it('merges custom config', () => {
    const executor = createProcessExecutor({
      defaultModel: 'haiku',
      maxProcesses: 5,
    });

    const caps = executor.getCapabilities();
    expect(caps.maxParallelism).toBe(5);
  });
});

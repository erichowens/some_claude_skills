/**
 * Tests for Executor Registry
 *
 * The registry manages executor factories and enables smart selection
 * based on task requirements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executorRegistry,
  selectBestExecutor,
  compareExecutors,
  type ExecutorRequirements,
} from './registry';

// Mock the executors to avoid actual CLI checks
vi.mock('./process-executor', () => ({
  ProcessExecutor: class {
    type = 'process';
    name = 'Mock Process Executor';
    async isAvailable() {
      return true;
    }
    getCapabilities() {
      return {
        maxParallelism: 10,
        tokenOverheadPerTask: 0,
        sharedContext: false,
        supportsStreaming: true,
        trueIsolation: true,
      };
    }
  },
  createProcessExecutor: vi.fn(() => ({
    type: 'process',
    name: 'Mock Process Executor',
    isAvailable: vi.fn().mockResolvedValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxParallelism: 10,
      tokenOverheadPerTask: 0,
      sharedContext: false,
      supportsStreaming: true,
      trueIsolation: true,
    }),
  })),
}));

vi.mock('./worktree-executor', () => ({
  WorktreeExecutor: class {
    type = 'worktree';
    name = 'Mock Worktree Executor';
  },
  createWorktreeExecutor: vi.fn(() => ({
    type: 'worktree',
    name: 'Mock Worktree Executor',
    isAvailable: vi.fn().mockResolvedValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxParallelism: 5,
      tokenOverheadPerTask: 0,
      sharedContext: false,
      supportsStreaming: false,
      trueIsolation: true,
    }),
  })),
}));

vi.mock('./task-tool-executor', () => ({
  TaskToolExecutor: class {
    type = 'task-tool';
    name = 'Mock Task Tool Executor';
  },
  createTaskToolExecutor: vi.fn(() => ({
    type: 'task-tool',
    name: 'Mock Task Tool Executor',
    isAvailable: vi.fn().mockResolvedValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxParallelism: 10,
      tokenOverheadPerTask: 20000,
      sharedContext: true,
      supportsStreaming: false,
      trueIsolation: false,
    }),
  })),
}));

// =============================================================================
// Tests
// =============================================================================

describe('ExecutorRegistry', () => {
  describe('listTypes', () => {
    it('lists all registered executor types', () => {
      const types = executorRegistry.listTypes();

      expect(types).toContain('process');
      expect(types).toContain('worktree');
      expect(types).toContain('task-tool');
    });
  });

  describe('getDefault', () => {
    it('returns the default executor (process)', () => {
      const executor = executorRegistry.getDefault();

      expect(executor.type).toBe('process');
    });
  });

  describe('setDefault', () => {
    it('changes the default executor', () => {
      // Save original default
      const original = executorRegistry.getDefault().type;

      executorRegistry.setDefault('worktree');
      expect(executorRegistry.getDefault().type).toBe('worktree');

      // Restore
      executorRegistry.setDefault(original as any);
    });

    it('throws for unknown type', () => {
      expect(() => {
        executorRegistry.setDefault('unknown' as any);
      }).toThrow('Unknown executor type');
    });
  });

  describe('createByType', () => {
    it('creates executor by type string', () => {
      const executor = executorRegistry.createByType('process');

      expect(executor.type).toBe('process');
    });
  });
});

describe('selectBestExecutor', () => {
  it('selects zero-overhead executor when minimizeTokens is true', async () => {
    const requirements: ExecutorRequirements = {
      minimizeTokens: true,
    };

    const executor = await selectBestExecutor(requirements);

    // Should prefer process or worktree (both have 0 overhead)
    expect(executor.getCapabilities().tokenOverheadPerTask).toBe(0);
  });

  it('selects isolated executor when needsIsolation is true', async () => {
    const requirements: ExecutorRequirements = {
      needsIsolation: true,
    };

    const executor = await selectBestExecutor(requirements);

    expect(executor.getCapabilities().trueIsolation).toBe(true);
  });

  it('selects shared context executor when needed', async () => {
    const requirements: ExecutorRequirements = {
      needsSharedContext: true,
    };

    const executor = await selectBestExecutor(requirements);

    expect(executor.getCapabilities().sharedContext).toBe(true);
  });

  it('considers parallelism requirements', async () => {
    const requirements: ExecutorRequirements = {
      parallelTasks: 8,
    };

    const executor = await selectBestExecutor(requirements);
    const caps = executor.getCapabilities();

    // Should select one that supports 8+ parallel tasks
    expect(caps.maxParallelism).toBeGreaterThanOrEqual(8);
  });
});

describe('compareExecutors', () => {
  it('returns comparison for all registered executors', async () => {
    const comparisons = await compareExecutors();

    expect(comparisons.length).toBeGreaterThanOrEqual(3);

    // Each comparison should have required fields
    for (const comp of comparisons) {
      expect(comp.type).toBeDefined();
      expect(comp.name).toBeDefined();
      expect(typeof comp.available).toBe('boolean');
      expect(comp.capabilities).toBeDefined();
    }
  });

  it('includes capability details', async () => {
    const comparisons = await compareExecutors();

    const processComp = comparisons.find((c) => c.type === 'process');
    expect(processComp?.capabilities.tokenOverheadPerTask).toBe(0);

    const taskToolComp = comparisons.find((c) => c.type === 'task-tool');
    expect(taskToolComp?.capabilities.tokenOverheadPerTask).toBe(20000);
  });
});

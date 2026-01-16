/**
 * Tests for CheckpointManager and StorageAdapters
 *
 * Tests checkpoint save/load/resume functionality and
 * storage adapter implementations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CheckpointManager,
  createCheckpointManager,
  type Checkpoint,
  type ResumeOptions,
} from './checkpoint-manager';
import {
  MemoryStorageAdapter,
  LocalStorageAdapter,
  createStorageAdapter,
} from './storage-adapters';
import type { DAG, ExecutionSnapshot, NodeId, TaskResult, DAGNode } from '../types';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDAG(id: string = 'test-dag'): DAG {
  return {
    id,
    nodes: {
      'node-1': {
        id: 'node-1' as NodeId,
        type: 'task',
        description: 'First task',
        skillId: 'test-skill',
        dependencies: [],
        config: {},
      } as DAGNode,
      'node-2': {
        id: 'node-2' as NodeId,
        type: 'task',
        description: 'Second task',
        skillId: 'test-skill',
        dependencies: ['node-1' as NodeId],
        config: {},
      } as DAGNode,
      'node-3': {
        id: 'node-3' as NodeId,
        type: 'task',
        description: 'Third task',
        skillId: 'test-skill',
        dependencies: ['node-2' as NodeId],
        config: {},
      } as DAGNode,
    },
    inputs: [],
    outputs: [],
    config: {},
  } as unknown as DAG;
}

function createMockSnapshot(overrides?: Partial<ExecutionSnapshot>): ExecutionSnapshot {
  return {
    executionId: 'exec-123',
    currentWave: 1,
    nodeStates: {
      'node-1': 'completed',
      'node-2': 'executing',
      'node-3': 'pending',
    },
    results: new Map([
      ['node-1' as NodeId, { output: { data: 'result-1' }, confidence: 0.9 }],
    ]),
    errors: new Map(),
    startedAt: new Date('2025-01-15T10:00:00Z'),
    totalTokenUsage: { inputTokens: 1000, outputTokens: 500 },
    ...overrides,
  } as ExecutionSnapshot;
}

// =============================================================================
// Storage Adapter Tests
// =============================================================================

describe('MemoryStorageAdapter', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('stores and retrieves values', async () => {
    await storage.set('key1', 'value1');
    const result = await storage.get('key1');
    expect(result).toBe('value1');
  });

  it('returns null for missing keys', async () => {
    const result = await storage.get('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes values', async () => {
    await storage.set('key1', 'value1');
    const deleted = await storage.delete('key1');
    expect(deleted).toBe(true);
    expect(await storage.get('key1')).toBeNull();
  });

  it('lists keys with prefix', async () => {
    await storage.set('prefix:key1', 'value1');
    await storage.set('prefix:key2', 'value2');
    await storage.set('other:key3', 'value3');

    const keys = await storage.keys('prefix:');
    expect(keys).toHaveLength(2);
    expect(keys).toContain('prefix:key1');
    expect(keys).toContain('prefix:key2');
  });

  it('clears all values', async () => {
    await storage.set('key1', 'value1');
    await storage.set('key2', 'value2');
    await storage.clear();

    expect(await storage.get('key1')).toBeNull();
    expect(await storage.get('key2')).toBeNull();
  });

  it('reports correct stats', async () => {
    await storage.set('key1', 'value1');
    await storage.set('key2', 'value2');

    const stats = await storage.getStats();
    expect(stats.keyCount).toBe(2);
    expect(stats.isPersistent).toBe(false);
  });
});

describe('createStorageAdapter', () => {
  it('creates memory adapter', () => {
    const adapter = createStorageAdapter('memory');
    expect(adapter.type).toBe('memory');
  });

  it('creates localStorage adapter', () => {
    const adapter = createStorageAdapter('localStorage', { prefix: 'test:' });
    expect(adapter.type).toBe('localStorage');
  });

  it('throws for file adapter without baseDir', () => {
    expect(() => createStorageAdapter('file')).toThrow('baseDir is required');
  });
});

// =============================================================================
// CheckpointManager Tests
// =============================================================================

describe('CheckpointManager', () => {
  let manager: CheckpointManager;
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    manager = new CheckpointManager({ storage, verbose: false });
  });

  describe('save and load', () => {
    it('saves and loads checkpoints', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      await manager.save(checkpoint);
      const loaded = await manager.load(checkpoint.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(checkpoint.id);
      expect(loaded!.dag.id).toBe(dag.id);
    });

    it('returns null for missing checkpoint', async () => {
      const loaded = await manager.load('nonexistent');
      expect(loaded).toBeNull();
    });

    it('includes version in checkpoint', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      expect(checkpoint.version).toBe(CheckpointManager.CURRENT_VERSION);
    });
  });

  describe('createCheckpoint', () => {
    it('captures DAG structure', () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      expect(checkpoint.dag.nodeIds).toContain('node-1');
      expect(checkpoint.dag.nodeIds).toContain('node-2');
      expect(checkpoint.dag.nodeIds).toContain('node-3');
      expect(checkpoint.dag.dependencies['node-2']).toContain('node-1');
    });

    it('captures execution state', () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      expect(checkpoint.execution.currentWave).toBe(1);
      expect(checkpoint.execution.nodeStates['node-1']).toBe('completed');
      expect(checkpoint.execution.nodeStates['node-2']).toBe('executing');
    });

    it('captures results', () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      expect(checkpoint.execution.results['node-1']).toBeDefined();
      expect(checkpoint.execution.results['node-1'].output).toEqual({ data: 'result-1' });
    });
  });

  describe('list', () => {
    it('lists all checkpoints', async () => {
      const dag1 = createMockDAG('dag-1');
      const dag2 = createMockDAG('dag-2');
      const snapshot = createMockSnapshot();

      await manager.save(manager.createCheckpoint(dag1, snapshot));
      await manager.save(manager.createCheckpoint(dag2, snapshot));

      const list = await manager.list();
      expect(list).toHaveLength(2);
    });

    it('filters by DAG ID', async () => {
      const dag1 = createMockDAG('dag-1');
      const dag2 = createMockDAG('dag-2');
      const snapshot = createMockSnapshot();

      await manager.save(manager.createCheckpoint(dag1, snapshot));
      await manager.save(manager.createCheckpoint(dag2, snapshot));

      const list = await manager.list({ dagId: 'dag-1' });
      expect(list).toHaveLength(1);
      expect(list[0].dagId).toBe('dag-1');
    });

    it('limits results', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();

      for (let i = 0; i < 5; i++) {
        await manager.save(manager.createCheckpoint(dag, { ...snapshot, executionId: `exec-${i}` }));
      }

      const list = await manager.list({ limit: 3 });
      expect(list).toHaveLength(3);
    });
  });

  describe('prepareResume', () => {
    it('identifies nodes to execute', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot({
        nodeStates: {
          'node-1': 'completed',
          'node-2': 'failed',
          'node-3': 'pending',
        },
      });
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      const resumeState = manager.prepareResume(checkpoint);

      // By default, retry failed nodes
      expect(resumeState.nodesToExecute).toContain('node-2');
      expect(resumeState.nodesToExecute).toContain('node-3');
      expect(resumeState.nodesToExecute).not.toContain('node-1');
    });

    it('preserves completed results', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      const resumeState = manager.prepareResume(checkpoint);

      expect(resumeState.completedResults.has('node-1' as NodeId)).toBe(true);
    });

    it('respects retryFailed option', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot({
        nodeStates: {
          'node-1': 'completed',
          'node-2': 'failed',
          'node-3': 'pending',
        },
      });
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      const resumeState = manager.prepareResume(checkpoint, { retryFailed: false });

      expect(resumeState.nodesToExecute).not.toContain('node-2');
    });

    it('respects reExecuteCompleted option', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      const resumeState = manager.prepareResume(checkpoint, { reExecuteCompleted: true });

      expect(resumeState.nodesToExecute).toContain('node-1');
    });
  });

  describe('delete', () => {
    it('deletes existing checkpoint', async () => {
      const dag = createMockDAG();
      const snapshot = createMockSnapshot();
      const checkpoint = manager.createCheckpoint(dag, snapshot);

      await manager.save(checkpoint);
      const deleted = await manager.delete(checkpoint.id);

      expect(deleted).toBe(true);
      expect(await manager.load(checkpoint.id)).toBeNull();
    });

    it('returns false for nonexistent checkpoint', async () => {
      const deleted = await manager.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('getStats', () => {
    it('reports checkpoint statistics', async () => {
      const dag1 = createMockDAG('dag-1');
      const dag2 = createMockDAG('dag-2');
      const snapshot = createMockSnapshot();

      await manager.save(manager.createCheckpoint(dag1, snapshot));
      await manager.save(manager.createCheckpoint(dag1, { ...snapshot, executionId: 'exec-2' }));
      await manager.save(manager.createCheckpoint(dag2, snapshot));

      const stats = await manager.getStats();

      expect(stats.totalCheckpoints).toBe(3);
      expect(stats.checkpointsByDAG['dag-1']).toBe(2);
      expect(stats.checkpointsByDAG['dag-2']).toBe(1);
      expect(stats.storageType).toBe('memory');
    });
  });
});

describe('createCheckpointManager', () => {
  it('creates manager with custom config', () => {
    const storage = new MemoryStorageAdapter();
    const manager = createCheckpointManager({
      storage,
      maxCheckpointsPerDAG: 5,
    });

    expect(manager).toBeInstanceOf(CheckpointManager);
  });
});

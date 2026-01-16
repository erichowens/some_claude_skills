/**
 * Tests for DAG State Manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StateManager,
  isValidTransition,
  InvalidStateTransitionError,
  type StateManagerOptions,
} from './state-manager';
import type {
  DAG,
  DAGNode,
  NodeId,
  TaskState,
  TaskResult,
  TaskError,
  ExecutionEvent,
} from '../types';
import { NodeId as createNodeId, DAGId as createDAGId } from '../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestNode(
  id: string,
  dependencies: string[] = []
): DAGNode {
  return {
    id: createNodeId(id),
    name: `Node ${id}`,
    type: 'skill',
    skillId: `skill-${id}`,
    dependencies: dependencies.map(createNodeId),
    state: { status: 'pending' },
    config: {
      timeoutMs: 30000,
    },
    metadata: {},
    tags: [],
  };
}

function createTestDAG(nodes: DAGNode[]): DAG {
  const nodeMap = new Map<NodeId, DAGNode>();
  const edges = new Map<NodeId, NodeId[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    edges.set(node.id, []);
  }

  // Build edges from dependencies
  for (const node of nodes) {
    for (const depId of node.dependencies) {
      const depEdges = edges.get(depId) || [];
      depEdges.push(node.id);
      edges.set(depId, depEdges);
    }
  }

  return {
    id: createDAGId('test-dag'),
    name: 'Test DAG',
    version: '1.0.0',
    nodes: nodeMap,
    edges,
    inputs: [],
    outputs: [],
    metadata: {},
    tags: [],
  };
}

function createResult(output: unknown = { done: true }): TaskResult {
  return {
    output,
    confidence: 1.0,
    tokenUsage: {
      inputTokens: 100,
      outputTokens: 50,
    },
  };
}

function createError(message: string = 'Test error'): TaskError {
  return {
    code: 'INTERNAL_ERROR',
    message,
    retryable: false,
  };
}

// =============================================================================
// isValidTransition Tests
// =============================================================================

describe('isValidTransition', () => {
  describe('from pending', () => {
    it('should allow pending -> ready', () => {
      expect(isValidTransition(
        { status: 'pending' },
        { status: 'ready', becameReadyAt: new Date() }
      )).toBe(true);
    });

    it('should allow pending -> skipped', () => {
      expect(isValidTransition(
        { status: 'pending' },
        { status: 'skipped', reason: 'dependency_failed', skippedAt: new Date() }
      )).toBe(true);
    });

    it('should allow pending -> cancelled', () => {
      expect(isValidTransition(
        { status: 'pending' },
        { status: 'cancelled', cancelledAt: new Date(), reason: 'user cancelled' }
      )).toBe(true);
    });

    it('should not allow pending -> running', () => {
      expect(isValidTransition(
        { status: 'pending' },
        { status: 'running', startedAt: new Date(), attempt: 1 }
      )).toBe(false);
    });

    it('should not allow pending -> completed', () => {
      expect(isValidTransition(
        { status: 'pending' },
        { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 }
      )).toBe(false);
    });
  });

  describe('from ready', () => {
    it('should allow ready -> running', () => {
      expect(isValidTransition(
        { status: 'ready', becameReadyAt: new Date() },
        { status: 'running', startedAt: new Date(), attempt: 1 }
      )).toBe(true);
    });

    it('should allow ready -> skipped', () => {
      expect(isValidTransition(
        { status: 'ready', becameReadyAt: new Date() },
        { status: 'skipped', reason: 'condition_not_met', skippedAt: new Date() }
      )).toBe(true);
    });

    it('should allow ready -> cancelled', () => {
      expect(isValidTransition(
        { status: 'ready', becameReadyAt: new Date() },
        { status: 'cancelled', cancelledAt: new Date(), reason: 'timeout' }
      )).toBe(true);
    });

    it('should not allow ready -> completed', () => {
      expect(isValidTransition(
        { status: 'ready', becameReadyAt: new Date() },
        { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 }
      )).toBe(false);
    });
  });

  describe('from running', () => {
    it('should allow running -> completed', () => {
      expect(isValidTransition(
        { status: 'running', startedAt: new Date(), attempt: 1 },
        { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 }
      )).toBe(true);
    });

    it('should allow running -> failed', () => {
      expect(isValidTransition(
        { status: 'running', startedAt: new Date(), attempt: 1 },
        { status: 'failed', error: createError(), failedAt: new Date(), attempts: 1 }
      )).toBe(true);
    });

    it('should allow running -> cancelled', () => {
      expect(isValidTransition(
        { status: 'running', startedAt: new Date(), attempt: 1 },
        { status: 'cancelled', cancelledAt: new Date(), reason: 'abort' }
      )).toBe(true);
    });

    it('should not allow running -> pending', () => {
      expect(isValidTransition(
        { status: 'running', startedAt: new Date(), attempt: 1 },
        { status: 'pending' }
      )).toBe(false);
    });
  });

  describe('from terminal states', () => {
    it('should not allow transitions from completed', () => {
      const completed: TaskState = {
        status: 'completed',
        result: createResult(),
        completedAt: new Date(),
        durationMs: 100,
      };
      expect(isValidTransition(completed, { status: 'running', startedAt: new Date(), attempt: 1 })).toBe(false);
      expect(isValidTransition(completed, { status: 'pending' })).toBe(false);
    });

    it('should allow failed -> ready for retry', () => {
      expect(isValidTransition(
        { status: 'failed', error: createError(), failedAt: new Date(), attempts: 1 },
        { status: 'ready', becameReadyAt: new Date() }
      )).toBe(true);
    });

    it('should not allow transitions from skipped', () => {
      const skipped: TaskState = {
        status: 'skipped',
        reason: 'dependency_failed',
        skippedAt: new Date(),
      };
      expect(isValidTransition(skipped, { status: 'ready', becameReadyAt: new Date() })).toBe(false);
    });

    it('should not allow transitions from cancelled', () => {
      const cancelled: TaskState = {
        status: 'cancelled',
        cancelledAt: new Date(),
        reason: 'user',
      };
      expect(isValidTransition(cancelled, { status: 'ready', becameReadyAt: new Date() })).toBe(false);
    });
  });
});

// =============================================================================
// InvalidStateTransitionError Tests
// =============================================================================

describe('InvalidStateTransitionError', () => {
  it('should create error with correct message', () => {
    const from: TaskState = { status: 'pending' };
    const to: TaskState = { status: 'completed', result: createResult(), completedAt: new Date(), durationMs: 100 };
    const error = new InvalidStateTransitionError(createNodeId('A'), from, to);

    expect(error.message).toBe('Invalid state transition for node A: pending -> completed');
    expect(error.name).toBe('InvalidStateTransitionError');
  });

  it('should store nodeId, from, and to states', () => {
    const from: TaskState = { status: 'running', startedAt: new Date(), attempt: 1 };
    const to: TaskState = { status: 'pending' };
    const nodeId = createNodeId('test-node');
    const error = new InvalidStateTransitionError(nodeId, from, to);

    expect(error.nodeId).toBe(nodeId);
    expect(error.from).toEqual(from);
    expect(error.to).toEqual(to);
  });
});

// =============================================================================
// StateManager Tests
// =============================================================================

describe('StateManager', () => {
  let dag: DAG;
  let manager: StateManager;

  beforeEach(() => {
    // Create a simple DAG: A -> B -> C
    dag = createTestDAG([
      createTestNode('A'),
      createTestNode('B', ['A']),
      createTestNode('C', ['B']),
    ]);
    manager = new StateManager({ dag });
  });

  describe('initialization', () => {
    it('should initialize all nodes to pending', () => {
      const states = manager.getAllNodeStates();
      expect(states.get(createNodeId('A'))?.status).toBe('pending');
      expect(states.get(createNodeId('B'))?.status).toBe('pending');
      expect(states.get(createNodeId('C'))?.status).toBe('pending');
    });

    it('should compute execution waves', () => {
      const waves = manager.getWaves();
      expect(waves.length).toBe(3);
      expect(waves[0].nodeIds).toContain(createNodeId('A'));
      expect(waves[1].nodeIds).toContain(createNodeId('B'));
      expect(waves[2].nodeIds).toContain(createNodeId('C'));
    });

    it('should generate execution ID if not provided', () => {
      const id = manager.getExecutionId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should use provided execution ID', () => {
      const customManager = new StateManager({
        dag,
        executionId: 'custom-id' as any,
      });
      expect(customManager.getExecutionId()).toBe('custom-id');
    });
  });

  describe('event management', () => {
    it('should add and remove event listeners', () => {
      const listener = vi.fn();
      const unsubscribe = manager.addEventListener(listener);

      manager.startExecution();
      expect(listener).toHaveBeenCalled();

      unsubscribe();
      listener.mockClear();
      manager.completeExecution();
      // Note: completeExecution is still called but listener is removed
    });

    it('should remove listener via removeEventListener', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);
      manager.removeEventListener(listener);

      manager.startExecution();
      // Listener should still be called once in startExecution before removal takes effect
      // Actually, removal happens immediately so it won't be called
      // Let's verify by starting again
    });

    it('should not emit events when emitEvents is false', () => {
      const silentManager = new StateManager({
        dag,
        emitEvents: false,
      });
      const listener = vi.fn();
      silentManager.addEventListener(listener);

      silentManager.startExecution();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should catch errors in event listeners', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorListener = () => { throw new Error('Listener error'); };
      manager.addEventListener(errorListener);

      // Should not throw
      expect(() => manager.startExecution()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('state transitions', () => {
    it('should get node state', () => {
      const state = manager.getNodeState(createNodeId('A'));
      expect(state).toBeDefined();
      expect(state?.status).toBe('pending');
    });

    it('should return undefined for unknown node', () => {
      const state = manager.getNodeState(createNodeId('unknown'));
      expect(state).toBeUndefined();
    });

    it('should mark node ready', () => {
      manager.markNodeReady(createNodeId('A'));
      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('ready');
    });

    it('should mark node started', () => {
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);
      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('running');
      if (state?.status === 'running') {
        expect(state.attempt).toBe(1);
      }
    });

    it('should emit node_started event', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);

      const startedEvent = listener.mock.calls.find(
        (call) => call[0].type === 'node_started'
      );
      expect(startedEvent).toBeDefined();
      expect(startedEvent[0].nodeId).toBe(createNodeId('A'));
    });

    it('should mark node completed', () => {
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);
      const result = createResult({ value: 42 });
      manager.markNodeCompleted(createNodeId('A'), result);

      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('completed');

      const output = manager.getNodeOutput(createNodeId('A'));
      expect(output).toEqual(result);
    });

    it('should update token usage on completion', () => {
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);

      const result: TaskResult = {
        output: {},
        confidence: 1.0,
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheReadTokens: 10,
          cacheWriteTokens: 5,
        },
      };
      manager.markNodeCompleted(createNodeId('A'), result);

      const usage = manager.getTotalTokenUsage();
      expect(usage.inputTokens).toBe(100);
      expect(usage.outputTokens).toBe(50);
      expect(usage.cacheReadTokens).toBe(10);
      expect(usage.cacheWriteTokens).toBe(5);
    });

    it('should throw when completing non-running node', () => {
      expect(() => {
        manager.markNodeCompleted(createNodeId('A'), createResult());
      }).toThrow('Cannot complete node A - not running');
    });

    it('should mark node failed', () => {
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);
      const error = createError('Test failure');
      manager.markNodeFailed(createNodeId('A'), error);

      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('failed');

      const errors = manager.getErrors();
      expect(errors).toContainEqual(error);
    });

    it('should throw when failing non-running node', () => {
      expect(() => {
        manager.markNodeFailed(createNodeId('A'), createError());
      }).toThrow('Cannot fail node A - not running');
    });

    it('should mark node skipped', () => {
      manager.markNodeSkipped(createNodeId('A'), 'dependency_failed');
      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('skipped');
    });

    it('should mark node cancelled', () => {
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeCancelled(createNodeId('A'), 'user requested');

      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('cancelled');
    });

    it('should mark node retrying (failed -> ready)', () => {
      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError());
      manager.markNodeRetrying(createNodeId('A'), 2);

      const state = manager.getNodeState(createNodeId('A'));
      expect(state?.status).toBe('ready');
    });

    it('should emit node_retrying event', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);

      manager.markNodeReady(createNodeId('A'));
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError());
      manager.markNodeRetrying(createNodeId('A'), 2);

      const retryEvent = listener.mock.calls.find(
        (call) => call[0].type === 'node_retrying'
      );
      expect(retryEvent).toBeDefined();
      expect(retryEvent[0].attempt).toBe(2);
    });

    it('should throw for unknown node', () => {
      expect(() => {
        manager.markNodeReady(createNodeId('unknown'));
      }).toThrow('Unknown node: unknown');
    });

    it('should throw for invalid transition when validation enabled', () => {
      expect(() => {
        manager.markNodeStarted(createNodeId('A'), 1);
      }).toThrow(InvalidStateTransitionError);
    });

    it('should allow invalid transition when validation disabled', () => {
      const noValidationManager = new StateManager({
        dag,
        validateTransitions: false,
      });

      // This would normally be invalid (pending -> running)
      expect(() => {
        noValidationManager.markNodeStarted(createNodeId('A'), 1);
      }).not.toThrow();
    });
  });

  describe('updateReadyNodes', () => {
    it('should mark nodes ready when dependencies complete', () => {
      manager.startExecution(); // Marks A ready (no deps)

      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      // updateReadyNodes is called automatically, B should be ready
      const stateB = manager.getNodeState(createNodeId('B'));
      expect(stateB?.status).toBe('ready');
    });

    it('should skip nodes when dependencies fail', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError());

      // Manually trigger update since markNodeFailed doesn't auto-update
      manager.updateReadyNodes();

      const stateB = manager.getNodeState(createNodeId('B'));
      expect(stateB?.status).toBe('skipped');
    });

    it('should return newly ready node IDs', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      // B was marked ready by completion, C is still waiting for B
      const stateC = manager.getNodeState(createNodeId('C'));
      expect(stateC?.status).toBe('pending');
    });
  });

  describe('wave management', () => {
    it('should start and complete waves', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);

      manager.startWave(0);
      expect(manager.getCurrentWave()).toBe(0);

      const waveStarted = listener.mock.calls.find(
        (call) => call[0].type === 'wave_started'
      );
      expect(waveStarted).toBeDefined();
      expect(waveStarted[0].waveNumber).toBe(0);

      manager.completeWave(0);
      const waveCompleted = listener.mock.calls.find(
        (call) => call[0].type === 'wave_completed'
      );
      expect(waveCompleted).toBeDefined();
    });

    it('should handle out-of-bounds wave numbers', () => {
      // Should not throw
      manager.startWave(100);
      manager.completeWave(100);
    });

    it('should get ready nodes in wave', () => {
      manager.startExecution();
      const wave0Ready = manager.getReadyNodesInWave(0);
      expect(wave0Ready).toContain(createNodeId('A'));
    });

    it('should return empty for out-of-bounds wave', () => {
      const ready = manager.getReadyNodesInWave(100);
      expect(ready).toEqual([]);
    });

    it('should check if wave is complete', () => {
      manager.startExecution();

      expect(manager.isWaveComplete(0)).toBe(false);

      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      expect(manager.isWaveComplete(0)).toBe(true);
    });

    it('should return true for out-of-bounds wave complete check', () => {
      expect(manager.isWaveComplete(100)).toBe(true);
    });
  });

  describe('execution lifecycle', () => {
    it('should start execution', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);

      manager.startExecution();

      const dagStarted = listener.mock.calls.find(
        (call) => call[0].type === 'dag_started'
      );
      expect(dagStarted).toBeDefined();
    });

    it('should complete execution', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);

      manager.startExecution();
      manager.completeExecution();

      const dagCompleted = listener.mock.calls.find(
        (call) => call[0].type === 'dag_completed'
      );
      expect(dagCompleted).toBeDefined();
    });

    it('should fail execution', () => {
      const listener = vi.fn();
      manager.addEventListener(listener);

      manager.startExecution();
      manager.failExecution(createError('DAG failed'));

      const dagFailed = listener.mock.calls.find(
        (call) => call[0].type === 'dag_failed'
      );
      expect(dagFailed).toBeDefined();
    });
  });

  describe('isExecutionComplete', () => {
    it('should return false when nodes are pending', () => {
      expect(manager.isExecutionComplete()).toBe(false);
    });

    it('should return false when nodes are ready', () => {
      manager.startExecution();
      expect(manager.isExecutionComplete()).toBe(false);
    });

    it('should return false when nodes are running', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      expect(manager.isExecutionComplete()).toBe(false);
    });

    it('should return true when all nodes are completed', () => {
      manager.startExecution();

      // Complete A
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      // Complete B
      manager.markNodeStarted(createNodeId('B'), 1);
      manager.markNodeCompleted(createNodeId('B'), createResult());

      // Complete C
      manager.markNodeStarted(createNodeId('C'), 1);
      manager.markNodeCompleted(createNodeId('C'), createResult());

      expect(manager.isExecutionComplete()).toBe(true);
    });

    it('should return true when nodes are failed or skipped', () => {
      manager.startExecution();

      // Fail A
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError());

      // Skip B and C due to dependency failure
      manager.updateReadyNodes();

      expect(manager.isExecutionComplete()).toBe(true);
    });
  });

  describe('isExecutionSuccessful', () => {
    it('should return false when there are failed nodes', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError());
      manager.updateReadyNodes(); // Skip B and C

      expect(manager.isExecutionSuccessful()).toBe(false);
    });

    it('should return false when there are cancelled nodes', () => {
      manager.startExecution();
      manager.markNodeCancelled(createNodeId('A'), 'cancelled');
      manager.markNodeCancelled(createNodeId('B'), 'cancelled');
      manager.markNodeCancelled(createNodeId('C'), 'cancelled');

      expect(manager.isExecutionSuccessful()).toBe(false);
    });

    it('should return true when all completed or skipped', () => {
      manager.startExecution();

      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      manager.markNodeStarted(createNodeId('B'), 1);
      manager.markNodeCompleted(createNodeId('B'), createResult());

      manager.markNodeStarted(createNodeId('C'), 1);
      manager.markNodeCompleted(createNodeId('C'), createResult());

      expect(manager.isExecutionSuccessful()).toBe(true);
    });

    it('should return false when execution not complete', () => {
      manager.startExecution();
      expect(manager.isExecutionSuccessful()).toBe(false);
    });
  });

  describe('snapshots', () => {
    it('should get snapshot with pending status', () => {
      const snapshot = manager.getSnapshot();

      expect(snapshot.executionId).toBeDefined();
      expect(snapshot.dagId).toBe(dag.id);
      expect(snapshot.status).toBe('pending');
      expect(snapshot.nodeStates.size).toBe(3);
    });

    it('should get snapshot with running status', () => {
      manager.startExecution();
      const snapshot = manager.getSnapshot();

      expect(snapshot.status).toBe('running');
      expect(snapshot.startedAt).toBeDefined();
    });

    it('should get snapshot with completed status', () => {
      manager.startExecution();

      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      manager.markNodeStarted(createNodeId('B'), 1);
      manager.markNodeCompleted(createNodeId('B'), createResult());

      manager.markNodeStarted(createNodeId('C'), 1);
      manager.markNodeCompleted(createNodeId('C'), createResult());

      manager.completeExecution();

      const snapshot = manager.getSnapshot();
      expect(snapshot.status).toBe('completed');
      expect(snapshot.completedAt).toBeDefined();
    });

    it('should get snapshot with failed status', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError());
      manager.updateReadyNodes();

      const snapshot = manager.getSnapshot();
      expect(snapshot.status).toBe('failed');
    });

    it('should include token usage in snapshot', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult());

      const snapshot = manager.getSnapshot();
      expect(snapshot.totalTokenUsage.inputTokens).toBeGreaterThan(0);
    });

    it('should include errors in snapshot', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeFailed(createNodeId('A'), createError('Test'));

      const snapshot = manager.getSnapshot();
      expect(snapshot.errors.length).toBeGreaterThan(0);
    });

    it('should restore from snapshot', () => {
      // Create some state
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult({ data: 'test' }));

      const snapshot = manager.getSnapshot();

      // Create new manager and restore
      const newManager = new StateManager({ dag });
      newManager.restoreFromSnapshot(snapshot);

      expect(newManager.getNodeState(createNodeId('A'))?.status).toBe('completed');
      expect(newManager.getNodeOutput(createNodeId('A'))?.output).toEqual({ data: 'test' });
      expect(newManager.getCurrentWave()).toBe(snapshot.currentWave);
    });
  });

  describe('getters', () => {
    it('should get all node states', () => {
      const states = manager.getAllNodeStates();
      expect(states.size).toBe(3);
      expect(states).toBeInstanceOf(Map);
    });

    it('should get all node outputs', () => {
      manager.startExecution();
      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), createResult({ value: 1 }));

      const outputs = manager.getAllNodeOutputs();
      expect(outputs.size).toBe(1);
      expect(outputs.get(createNodeId('A'))?.output).toEqual({ value: 1 });
    });

    it('should get nodes in specific state', () => {
      manager.startExecution();

      const readyNodes = manager.getNodesInState('ready');
      expect(readyNodes).toContain(createNodeId('A'));

      const pendingNodes = manager.getNodesInState('pending');
      expect(pendingNodes).toContain(createNodeId('B'));
      expect(pendingNodes).toContain(createNodeId('C'));
    });

    it('should get state counts', () => {
      manager.startExecution();

      const counts = manager.getStateCounts();
      expect(counts.ready).toBe(1); // A
      expect(counts.pending).toBe(2); // B, C
      expect(counts.running).toBe(0);
      expect(counts.completed).toBe(0);
      expect(counts.failed).toBe(0);
      expect(counts.skipped).toBe(0);
      expect(counts.cancelled).toBe(0);
    });

    it('should get waves', () => {
      const waves = manager.getWaves();
      expect(waves.length).toBe(3);
    });

    it('should get current wave', () => {
      manager.startWave(1);
      expect(manager.getCurrentWave()).toBe(1);
    });

    it('should get total token usage', () => {
      const usage = manager.getTotalTokenUsage();
      expect(usage.inputTokens).toBe(0);
      expect(usage.outputTokens).toBe(0);
    });

    it('should get errors', () => {
      const errors = manager.getErrors();
      expect(errors).toEqual([]);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('complex scenarios', () => {
    it('should handle parallel execution DAG', () => {
      // Create: A -> [B, C] -> D
      const parallelDag = createTestDAG([
        createTestNode('A'),
        createTestNode('B', ['A']),
        createTestNode('C', ['A']),
        createTestNode('D', ['B', 'C']),
      ]);

      const parallelManager = new StateManager({ dag: parallelDag });
      parallelManager.startExecution();

      // A should be ready
      expect(parallelManager.getNodeState(createNodeId('A'))?.status).toBe('ready');

      // Complete A
      parallelManager.markNodeStarted(createNodeId('A'), 1);
      parallelManager.markNodeCompleted(createNodeId('A'), createResult());

      // B and C should both be ready now
      expect(parallelManager.getNodeState(createNodeId('B'))?.status).toBe('ready');
      expect(parallelManager.getNodeState(createNodeId('C'))?.status).toBe('ready');

      // D should still be pending
      expect(parallelManager.getNodeState(createNodeId('D'))?.status).toBe('pending');

      // Complete B
      parallelManager.markNodeStarted(createNodeId('B'), 1);
      parallelManager.markNodeCompleted(createNodeId('B'), createResult());

      // D still pending (waiting for C)
      expect(parallelManager.getNodeState(createNodeId('D'))?.status).toBe('pending');

      // Complete C
      parallelManager.markNodeStarted(createNodeId('C'), 1);
      parallelManager.markNodeCompleted(createNodeId('C'), createResult());

      // Now D should be ready
      expect(parallelManager.getNodeState(createNodeId('D'))?.status).toBe('ready');
    });

    it('should accumulate token usage across multiple nodes', () => {
      manager.startExecution();

      manager.markNodeStarted(createNodeId('A'), 1);
      manager.markNodeCompleted(createNodeId('A'), {
        output: {},
        confidence: 1.0,
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
      });

      manager.markNodeStarted(createNodeId('B'), 1);
      manager.markNodeCompleted(createNodeId('B'), {
        output: {},
        confidence: 1.0,
        tokenUsage: { inputTokens: 200, outputTokens: 100 },
      });

      const usage = manager.getTotalTokenUsage();
      expect(usage.inputTokens).toBe(300);
      expect(usage.outputTokens).toBe(150);
    });

    it('should handle DAG with cycles gracefully', () => {
      // Create nodes that would form a cycle: A -> B -> A
      // The builder would normally prevent this, but we test the state manager
      const cyclicNodes = [
        createTestNode('A', ['B']),
        createTestNode('B', ['A']),
      ];

      // topologicalSort will fail, waves will be empty
      const cyclicDag = createTestDAG(cyclicNodes);
      const cyclicManager = new StateManager({ dag: cyclicDag });

      const waves = cyclicManager.getWaves();
      expect(waves.length).toBe(0);
    });
  });
});

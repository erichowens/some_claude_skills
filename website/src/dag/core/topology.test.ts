/**
 * Tests for DAG Topology Algorithms
 */

import { describe, it, expect } from 'vitest';
import {
  topologicalSort,
  isAcyclic,
  getCycle,
  findCriticalPath,
  extractSubgraph,
  findTransitiveDependents,
  findTransitiveDependencies,
  validateDAG,
} from './topology';
import { dag } from './builder';
import type { DAG, DAGNode, NodeId } from '../types';
import { NodeId as createNodeId } from '../types';

// =============================================================================
// Helper to create test DAGs without builder (for edge cases)
// =============================================================================

function createTestDAG(
  nodes: Array<{ id: string; deps: string[] }>,
  name = 'test-dag'
): DAG {
  const nodeMap = new Map<NodeId, DAGNode>();
  const edgeMap = new Map<NodeId, NodeId[]>();

  for (const { id, deps } of nodes) {
    const nodeId = createNodeId(id);
    nodeMap.set(nodeId, {
      id: nodeId,
      name: id,
      type: 'skill',
      skillId: 'test-skill',
      dependencies: deps.map(d => createNodeId(d)),
      inputMappings: [],
      config: {
        timeoutMs: 30000,
        priority: 0,
      },
    });
    edgeMap.set(nodeId, []);
  }

  // Build edge map (forward edges from dependencies)
  for (const { id, deps } of nodes) {
    for (const dep of deps) {
      const edges = edgeMap.get(createNodeId(dep)) || [];
      edges.push(createNodeId(id));
      edgeMap.set(createNodeId(dep), edges);
    }
  }

  return {
    id: `dag-${name}`,
    name,
    version: '1.0.0',
    description: 'Test DAG',
    nodes: nodeMap,
    edges: edgeMap,
    inputs: [],
    outputs: [],
    config: {
      maxParallelism: 10,
      maxExecutionTimeMs: 300000,
      failFast: false,
      defaultRetryPolicy: {
        maxAttempts: 1,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        nonRetryableErrors: [],
      },
    },
  };
}

// =============================================================================
// Topological Sort Tests
// =============================================================================

describe('topologicalSort', () => {
  describe('basic cases', () => {
    it('should handle empty DAG', () => {
      const emptyDAG = createTestDAG([]);
      const result = topologicalSort(emptyDAG);

      expect(result.success).toBe(true);
      expect(result.order).toHaveLength(0);
      expect(result.waves).toHaveLength(0);
      expect(result.stats.totalNodes).toBe(0);
    });

    it('should handle single node', () => {
      const singleDAG = createTestDAG([{ id: 'A', deps: [] }]);
      const result = topologicalSort(singleDAG);

      expect(result.success).toBe(true);
      expect(result.order).toHaveLength(1);
      expect(result.order[0]).toBe(createNodeId('A'));
      expect(result.waves).toHaveLength(1);
      expect(result.stats.totalNodes).toBe(1);
      expect(result.stats.rootNodes).toBe(1);
      expect(result.stats.leafNodes).toBe(1);
    });

    it('should handle linear chain A -> B -> C', () => {
      const linearDAG = createTestDAG([
        { id: 'A', deps: [] },
        { id: 'B', deps: ['A'] },
        { id: 'C', deps: ['B'] },
      ]);
      const result = topologicalSort(linearDAG);

      expect(result.success).toBe(true);
      expect(result.order).toHaveLength(3);

      // A must come before B, B before C
      const aIndex = result.order.indexOf(createNodeId('A'));
      const bIndex = result.order.indexOf(createNodeId('B'));
      const cIndex = result.order.indexOf(createNodeId('C'));

      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);

      // Should have 3 waves (each node in its own wave)
      expect(result.waves).toHaveLength(3);
      expect(result.stats.maxDepth).toBe(3);
    });

    it('should handle parallel nodes (no dependencies)', () => {
      const parallelDAG = createTestDAG([
        { id: 'A', deps: [] },
        { id: 'B', deps: [] },
        { id: 'C', deps: [] },
      ]);
      const result = topologicalSort(parallelDAG);

      expect(result.success).toBe(true);
      expect(result.order).toHaveLength(3);
      expect(result.waves).toHaveLength(1);
      expect(result.waves[0].nodeIds).toHaveLength(3);
      expect(result.stats.maxParallelism).toBe(3);
    });
  });

  describe('wave computation', () => {
    it('should group independent nodes into same wave', () => {
      // Diamond pattern: A -> B, A -> C, B -> D, C -> D
      const diamondDAG = createTestDAG([
        { id: 'A', deps: [] },
        { id: 'B', deps: ['A'] },
        { id: 'C', deps: ['A'] },
        { id: 'D', deps: ['B', 'C'] },
      ]);
      const result = topologicalSort(diamondDAG);

      expect(result.success).toBe(true);
      expect(result.waves).toHaveLength(3);

      // Wave 0: A
      expect(result.waves[0].nodeIds).toContain(createNodeId('A'));

      // Wave 1: B and C (parallel)
      expect(result.waves[1].nodeIds).toHaveLength(2);
      expect(result.waves[1].nodeIds).toContain(createNodeId('B'));
      expect(result.waves[1].nodeIds).toContain(createNodeId('C'));

      // Wave 2: D
      expect(result.waves[2].nodeIds).toContain(createNodeId('D'));
    });

    it('should compute correct wave numbers', () => {
      const testDAG = dag('wave-test')
        .skillNode('root', 'skill').done()
        .skillNode('child1', 'skill').dependsOn('root').done()
        .skillNode('child2', 'skill').dependsOn('root').done()
        .skillNode('grandchild', 'skill').dependsOn('child1', 'child2').done()
        .build();

      const result = topologicalSort(testDAG);

      expect(result.success).toBe(true);
      expect(result.waves[0].waveNumber).toBe(0);
      expect(result.waves[1].waveNumber).toBe(1);
      expect(result.waves[2].waveNumber).toBe(2);
    });
  });

  describe('statistics', () => {
    it('should calculate correct statistics', () => {
      const testDAG = createTestDAG([
        { id: 'A', deps: [] },
        { id: 'B', deps: [] },
        { id: 'C', deps: ['A'] },
        { id: 'D', deps: ['A', 'B'] },
        { id: 'E', deps: ['C', 'D'] },
      ]);
      const result = topologicalSort(testDAG);

      expect(result.success).toBe(true);
      expect(result.stats.totalNodes).toBe(5);
      expect(result.stats.totalEdges).toBe(5); // A->C, A->D, B->D, C->E, D->E
      expect(result.stats.rootNodes).toBe(2);  // A, B
      expect(result.stats.leafNodes).toBe(1);  // E
      expect(result.stats.waveCount).toBe(3);
    });

    it('should calculate average parallelism', () => {
      // 3 waves: [A, B] (2), [C] (1), [D, E] (2) -> avg = 5/3
      const testDAG = createTestDAG([
        { id: 'A', deps: [] },
        { id: 'B', deps: [] },
        { id: 'C', deps: ['A'] },
        { id: 'D', deps: ['C'] },
        { id: 'E', deps: ['B'] },
      ]);
      const result = topologicalSort(testDAG);

      expect(result.success).toBe(true);
      expect(result.stats.avgParallelism).toBeGreaterThan(1);
    });
  });

  describe('cycle detection', () => {
    it('should detect simple cycle A -> B -> A', () => {
      const cyclicDAG = createTestDAG([
        { id: 'A', deps: ['B'] },
        { id: 'B', deps: ['A'] },
      ]);
      const result = topologicalSort(cyclicDAG);

      expect(result.success).toBe(false);
      expect(result.cycle).toBeDefined();
      expect(result.cycle!.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect longer cycle A -> B -> C -> A', () => {
      const cyclicDAG = createTestDAG([
        { id: 'A', deps: ['C'] },
        { id: 'B', deps: ['A'] },
        { id: 'C', deps: ['B'] },
      ]);
      const result = topologicalSort(cyclicDAG);

      expect(result.success).toBe(false);
      expect(result.cycle).toBeDefined();
    });

    it('should detect cycle in complex graph', () => {
      // Valid part: X -> Y
      // Cyclic part: A -> B -> C -> A
      const mixedDAG = createTestDAG([
        { id: 'X', deps: [] },
        { id: 'Y', deps: ['X'] },
        { id: 'A', deps: ['C'] },
        { id: 'B', deps: ['A'] },
        { id: 'C', deps: ['B'] },
      ]);
      const result = topologicalSort(mixedDAG);

      expect(result.success).toBe(false);
      expect(result.cycle).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should fail when dependency references non-existent node', () => {
      const badDAG = createTestDAG([
        { id: 'A', deps: ['missing'] },
      ]);
      const result = topologicalSort(badDAG);

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Acyclicity Tests
// =============================================================================

describe('isAcyclic', () => {
  it('should return true for acyclic DAG', () => {
    const acyclicDAG = dag('acyclic')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').dependsOn('A').done()
      .build();

    expect(isAcyclic(acyclicDAG)).toBe(true);
  });

  it('should return false for cyclic DAG', () => {
    const cyclicDAG = createTestDAG([
      { id: 'A', deps: ['B'] },
      { id: 'B', deps: ['A'] },
    ]);

    expect(isAcyclic(cyclicDAG)).toBe(false);
  });
});

describe('getCycle', () => {
  it('should return empty array for acyclic DAG', () => {
    const acyclicDAG = dag('acyclic')
      .skillNode('A', 'skill').done()
      .build();

    expect(getCycle(acyclicDAG)).toHaveLength(0);
  });

  it('should return cycle nodes for cyclic DAG', () => {
    const cyclicDAG = createTestDAG([
      { id: 'A', deps: ['B'] },
      { id: 'B', deps: ['A'] },
    ]);

    const cycle = getCycle(cyclicDAG);
    expect(cycle.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Critical Path Tests
// =============================================================================

describe('findCriticalPath', () => {
  it('should find critical path in linear DAG', () => {
    const linearDAG = dag('linear')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').dependsOn('A').done()
      .skillNode('C', 'skill').dependsOn('B').done()
      .build();

    const result = findCriticalPath(linearDAG);

    expect(result.length).toBe(3);
    expect(result.path).toContain(createNodeId('A'));
    expect(result.path).toContain(createNodeId('B'));
    expect(result.path).toContain(createNodeId('C'));
  });

  it('should find longest path in diamond DAG', () => {
    // A -> B -> D (length 3)
    // A -> C -> D (length 3)
    const diamondDAG = dag('diamond')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').dependsOn('A').done()
      .skillNode('C', 'skill').dependsOn('A').done()
      .skillNode('D', 'skill').dependsOn('B', 'C').done()
      .build();

    const result = findCriticalPath(diamondDAG);

    expect(result.length).toBe(3); // A -> B/C -> D
    expect(result.path[0]).toBe(createNodeId('A'));
    expect(result.path[result.path.length - 1]).toBe(createNodeId('D'));
  });

  it('should return empty for empty DAG', () => {
    const emptyDAG = createTestDAG([]);
    const result = findCriticalPath(emptyDAG);

    expect(result.path).toHaveLength(0);
    expect(result.length).toBe(0);
  });

  it('should return empty for cyclic DAG', () => {
    const cyclicDAG = createTestDAG([
      { id: 'A', deps: ['B'] },
      { id: 'B', deps: ['A'] },
    ]);
    const result = findCriticalPath(cyclicDAG);

    expect(result.path).toHaveLength(0);
  });

  it('should use node times when provided', () => {
    const testDAG = dag('timed')
      .skillNode('fast', 'skill').done()
      .skillNode('slow', 'skill').done()
      .skillNode('end', 'skill').dependsOn('fast', 'slow').done()
      .build();

    const nodeTimes = new Map<NodeId, number>();
    nodeTimes.set(createNodeId('fast'), 10);
    nodeTimes.set(createNodeId('slow'), 100);
    nodeTimes.set(createNodeId('end'), 5);

    const result = findCriticalPath(testDAG, nodeTimes);

    expect(result.estimatedTimeMs).toBeDefined();
    // Critical path should go through slow node
    expect(result.path).toContain(createNodeId('slow'));
  });
});

// =============================================================================
// Subgraph Extraction Tests
// =============================================================================

describe('extractSubgraph', () => {
  it('should extract subgraph with dependencies', () => {
    const fullDAG = dag('full')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').dependsOn('A').done()
      .skillNode('C', 'skill').dependsOn('A').done()
      .skillNode('D', 'skill').dependsOn('B', 'C').done()
      .skillNode('E', 'skill').done() // Unrelated
      .build();

    const subgraph = extractSubgraph(fullDAG, [createNodeId('D')]);

    // Should include D and all its dependencies (A, B, C)
    expect(subgraph.nodes.size).toBe(4);
    expect(subgraph.nodes.has(createNodeId('A'))).toBe(true);
    expect(subgraph.nodes.has(createNodeId('B'))).toBe(true);
    expect(subgraph.nodes.has(createNodeId('C'))).toBe(true);
    expect(subgraph.nodes.has(createNodeId('D'))).toBe(true);
    expect(subgraph.nodes.has(createNodeId('E'))).toBe(false);
  });

  it('should extract multiple entry points', () => {
    const fullDAG = dag('full')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').done()
      .skillNode('C', 'skill').dependsOn('A').done()
      .skillNode('D', 'skill').dependsOn('B').done()
      .build();

    const subgraph = extractSubgraph(fullDAG, [
      createNodeId('C'),
      createNodeId('D'),
    ]);

    expect(subgraph.nodes.size).toBe(4);
  });

  it('should handle node with no dependencies', () => {
    const testDAG = dag('test')
      .skillNode('standalone', 'skill').done()
      .skillNode('other', 'skill').done()
      .build();

    const subgraph = extractSubgraph(testDAG, [createNodeId('standalone')]);

    expect(subgraph.nodes.size).toBe(1);
    expect(subgraph.nodes.has(createNodeId('standalone'))).toBe(true);
  });
});

// =============================================================================
// Transitive Dependency Tests
// =============================================================================

describe('findTransitiveDependents', () => {
  it('should find all transitive dependents', () => {
    const testDAG = dag('test')
      .skillNode('root', 'skill').done()
      .skillNode('child1', 'skill').dependsOn('root').done()
      .skillNode('child2', 'skill').dependsOn('root').done()
      .skillNode('grandchild', 'skill').dependsOn('child1').done()
      .build();

    const dependents = findTransitiveDependents(testDAG, createNodeId('root'));

    expect(dependents.size).toBe(3);
    expect(dependents.has(createNodeId('child1'))).toBe(true);
    expect(dependents.has(createNodeId('child2'))).toBe(true);
    expect(dependents.has(createNodeId('grandchild'))).toBe(true);
  });

  it('should return empty set for leaf node', () => {
    const testDAG = dag('test')
      .skillNode('root', 'skill').done()
      .skillNode('leaf', 'skill').dependsOn('root').done()
      .build();

    const dependents = findTransitiveDependents(testDAG, createNodeId('leaf'));

    expect(dependents.size).toBe(0);
  });
});

describe('findTransitiveDependencies', () => {
  it('should find all transitive dependencies', () => {
    const testDAG = dag('test')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').dependsOn('A').done()
      .skillNode('C', 'skill').dependsOn('B').done()
      .skillNode('D', 'skill').dependsOn('C').done()
      .build();

    const deps = findTransitiveDependencies(testDAG, createNodeId('D'));

    expect(deps.size).toBe(3);
    expect(deps.has(createNodeId('A'))).toBe(true);
    expect(deps.has(createNodeId('B'))).toBe(true);
    expect(deps.has(createNodeId('C'))).toBe(true);
  });

  it('should return empty set for root node', () => {
    const testDAG = dag('test')
      .skillNode('root', 'skill').done()
      .skillNode('child', 'skill').dependsOn('root').done()
      .build();

    const deps = findTransitiveDependencies(testDAG, createNodeId('root'));

    expect(deps.size).toBe(0);
  });

  it('should return empty set for non-existent node', () => {
    const testDAG = dag('test')
      .skillNode('A', 'skill').done()
      .build();

    const deps = findTransitiveDependencies(testDAG, createNodeId('missing'));

    expect(deps.size).toBe(0);
  });
});

// =============================================================================
// Validation Tests
// =============================================================================

describe('validateDAG', () => {
  it('should return no errors for valid DAG', () => {
    const validDAG = dag('valid')
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').dependsOn('A').done()
      .build();

    const errors = validateDAG(validDAG);

    expect(errors).toHaveLength(0);
  });

  it('should detect self-dependency', () => {
    // Create a node that depends on itself
    const selfDepDAG = createTestDAG([
      { id: 'A', deps: ['A'] },
    ]);

    const errors = validateDAG(selfDepDAG);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.type === 'self_dependency')).toBe(true);
  });

  it('should detect missing dependency', () => {
    const missingDepDAG = createTestDAG([
      { id: 'A', deps: ['nonexistent'] },
    ]);

    const errors = validateDAG(missingDepDAG);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.type === 'missing_dependency')).toBe(true);
  });

  it('should detect cycles', () => {
    const cyclicDAG = createTestDAG([
      { id: 'A', deps: ['B'] },
      { id: 'B', deps: ['C'] },
      { id: 'C', deps: ['A'] },
    ]);

    const errors = validateDAG(cyclicDAG);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.type === 'cycle')).toBe(true);
  });

  it('should detect multiple errors', () => {
    // Self-dependency AND missing dependency
    const multiErrorDAG = createTestDAG([
      { id: 'A', deps: ['A', 'missing'] },
    ]);

    const errors = validateDAG(multiErrorDAG);

    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

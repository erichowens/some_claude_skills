/**
 * DAG Topology Algorithms
 *
 * Implements topological sorting, cycle detection, and wave computation
 * for executing DAG nodes in correct dependency order.
 */

import type { DAG, DAGNode, NodeId, ExecutionWave } from '../types';

// =============================================================================
// Topological Sort (Kahn's Algorithm)
// =============================================================================

/**
 * Result of topological sort
 */
export interface TopologicalSortResult {
  /** Whether the sort succeeded (no cycles) */
  success: boolean;

  /** Sorted node IDs in execution order */
  order: NodeId[];

  /** Nodes grouped by wave (parallel execution groups) */
  waves: ExecutionWave[];

  /** If failed, the cycle that was detected */
  cycle?: NodeId[];

  /** Statistics about the DAG structure */
  stats: DAGStats;
}

/**
 * Statistics about DAG structure
 */
export interface DAGStats {
  /** Total number of nodes */
  totalNodes: number;

  /** Number of edges (dependencies) */
  totalEdges: number;

  /** Number of root nodes (no dependencies) */
  rootNodes: number;

  /** Number of leaf nodes (no dependents) */
  leafNodes: number;

  /** Maximum depth (critical path length) */
  maxDepth: number;

  /** Number of execution waves */
  waveCount: number;

  /** Maximum parallelism (largest wave) */
  maxParallelism: number;

  /** Average parallelism across waves */
  avgParallelism: number;
}

/**
 * Performs topological sort using Kahn's algorithm.
 * Returns nodes in execution order, grouped into waves for parallel execution.
 *
 * Time complexity: O(V + E) where V = nodes, E = edges
 * Space complexity: O(V)
 *
 * @param dag - The DAG to sort
 * @returns TopologicalSortResult with order, waves, and statistics
 */
export function topologicalSort(dag: DAG): TopologicalSortResult {
  const nodes = dag.nodes;
  const nodeCount = nodes.size;

  if (nodeCount === 0) {
    return {
      success: true,
      order: [],
      waves: [],
      stats: emptyStats(),
    };
  }

  // Build in-degree map and reverse adjacency list
  const inDegree = new Map<NodeId, number>();
  const dependents = new Map<NodeId, NodeId[]>(); // nodeId -> nodes that depend on it

  // Initialize
  for (const [nodeId, node] of nodes) {
    inDegree.set(nodeId, node.dependencies.length);
    dependents.set(nodeId, []);
  }

  // Build dependents map (reverse edges)
  for (const [nodeId, node] of nodes) {
    for (const depId of node.dependencies) {
      const depList = dependents.get(depId);
      if (depList) {
        depList.push(nodeId);
      } else {
        // Dependency references non-existent node
        return {
          success: false,
          order: [],
          waves: [],
          cycle: [depId, nodeId],
          stats: emptyStats(),
        };
      }
    }
  }

  // Kahn's algorithm with wave tracking
  const order: NodeId[] = [];
  const waves: ExecutionWave[] = [];
  const nodeDepth = new Map<NodeId, number>();

  // Find all root nodes (in-degree 0)
  let currentWave: NodeId[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      currentWave.push(nodeId);
      nodeDepth.set(nodeId, 0);
    }
  }

  let waveNumber = 0;
  let processedCount = 0;

  while (currentWave.length > 0) {
    // Record this wave
    waves.push({
      waveNumber,
      nodeIds: [...currentWave],
      status: 'pending',
    });

    // Add wave nodes to order
    order.push(...currentWave);
    processedCount += currentWave.length;

    // Prepare next wave
    const nextWave: NodeId[] = [];
    const nextWaveDepth = waveNumber + 1;

    for (const nodeId of currentWave) {
      const deps = dependents.get(nodeId) || [];
      for (const depId of deps) {
        const newDegree = (inDegree.get(depId) || 0) - 1;
        inDegree.set(depId, newDegree);

        if (newDegree === 0) {
          nextWave.push(depId);
          nodeDepth.set(depId, nextWaveDepth);
        }
      }
    }

    currentWave = nextWave;
    waveNumber++;
  }

  // Check for cycle (not all nodes processed)
  if (processedCount !== nodeCount) {
    const cycle = detectCycle(nodes, inDegree);
    return {
      success: false,
      order: [],
      waves: [],
      cycle,
      stats: emptyStats(),
    };
  }

  // Calculate statistics
  const stats = calculateStats(nodes, waves, dependents);

  return {
    success: true,
    order,
    waves,
    stats,
  };
}

// =============================================================================
// Cycle Detection
// =============================================================================

/**
 * Detects a cycle in the DAG using DFS.
 * Called when Kahn's algorithm fails to process all nodes.
 *
 * @param nodes - The DAG nodes
 * @param inDegree - Remaining in-degrees after partial Kahn's
 * @returns Array of node IDs forming the cycle
 */
function detectCycle(
  nodes: Map<NodeId, DAGNode>,
  inDegree: Map<NodeId, number>
): NodeId[] {
  // Find nodes still in the graph (in-degree > 0)
  const remaining = new Set<NodeId>();
  for (const [nodeId, degree] of inDegree) {
    if (degree > 0) {
      remaining.add(nodeId);
    }
  }

  if (remaining.size === 0) {
    return [];
  }

  // DFS to find cycle
  const WHITE = 0; // Unvisited
  const GRAY = 1;  // In current path
  const BLACK = 2; // Fully processed

  const color = new Map<NodeId, number>();
  const parent = new Map<NodeId, NodeId>();

  for (const nodeId of remaining) {
    color.set(nodeId, WHITE);
  }

  const findCycleFromNode = (startId: NodeId): NodeId[] | null => {
    const stack: NodeId[] = [startId];

    while (stack.length > 0) {
      const nodeId = stack[stack.length - 1];
      const nodeColor = color.get(nodeId) || WHITE;

      if (nodeColor === WHITE) {
        color.set(nodeId, GRAY);
        const node = nodes.get(nodeId);

        if (node) {
          for (const depId of node.dependencies) {
            if (!remaining.has(depId)) continue;

            const depColor = color.get(depId) || WHITE;

            if (depColor === GRAY) {
              // Found cycle! Reconstruct it
              const cycle: NodeId[] = [depId];
              let current = nodeId;
              while (current !== depId) {
                cycle.push(current);
                current = parent.get(current)!;
              }
              cycle.push(depId);
              return cycle.reverse();
            }

            if (depColor === WHITE) {
              parent.set(depId, nodeId);
              stack.push(depId);
            }
          }
        }
      } else {
        color.set(nodeId, BLACK);
        stack.pop();
      }
    }

    return null;
  };

  for (const nodeId of remaining) {
    if (color.get(nodeId) === WHITE) {
      const cycle = findCycleFromNode(nodeId);
      if (cycle) {
        return cycle;
      }
    }
  }

  // Shouldn't reach here if Kahn's detected a cycle
  return Array.from(remaining).slice(0, 2);
}

/**
 * Validates that a DAG has no cycles.
 *
 * @param dag - The DAG to validate
 * @returns true if acyclic, false if cycle exists
 */
export function isAcyclic(dag: DAG): boolean {
  return topologicalSort(dag).success;
}

/**
 * Gets the cycle if one exists.
 *
 * @param dag - The DAG to check
 * @returns Array of node IDs forming cycle, or empty if no cycle
 */
export function getCycle(dag: DAG): NodeId[] {
  const result = topologicalSort(dag);
  return result.cycle || [];
}

// =============================================================================
// Critical Path
// =============================================================================

/**
 * Result of critical path analysis
 */
export interface CriticalPathResult {
  /** Nodes on the critical path */
  path: NodeId[];

  /** Total length (number of nodes) */
  length: number;

  /** Estimated total execution time (if node times available) */
  estimatedTimeMs?: number;
}

/**
 * Finds the critical path (longest path) through the DAG.
 * This represents the minimum possible execution time.
 *
 * @param dag - The DAG to analyze
 * @param nodeTimesMs - Optional map of estimated execution times per node
 * @returns Critical path information
 */
export function findCriticalPath(
  dag: DAG,
  nodeTimesMs?: Map<NodeId, number>
): CriticalPathResult {
  const sortResult = topologicalSort(dag);

  if (!sortResult.success || sortResult.order.length === 0) {
    return { path: [], length: 0 };
  }

  const nodes = dag.nodes;
  const dist = new Map<NodeId, number>();    // Distance (path length) to each node
  const predecessor = new Map<NodeId, NodeId>(); // For path reconstruction

  // Initialize distances
  for (const nodeId of sortResult.order) {
    dist.set(nodeId, 0);
  }

  // Process nodes in topological order
  for (const nodeId of sortResult.order) {
    const node = nodes.get(nodeId);
    if (!node) continue;

    const currentDist = dist.get(nodeId) || 0;
    const nodeTime = nodeTimesMs?.get(nodeId) || 1;
    const newDist = currentDist + nodeTime;

    // Update all dependents
    for (const [depId, depNode] of nodes) {
      if (depNode.dependencies.includes(nodeId)) {
        const depDist = dist.get(depId) || 0;
        if (newDist > depDist) {
          dist.set(depId, newDist);
          predecessor.set(depId, nodeId);
        }
      }
    }
  }

  // Find node with maximum distance (end of critical path)
  let maxDist = 0;
  let endNode: NodeId | undefined;

  for (const [nodeId, d] of dist) {
    if (d > maxDist) {
      maxDist = d;
      endNode = nodeId;
    }
  }

  if (!endNode) {
    return { path: [], length: 0 };
  }

  // Reconstruct path
  const path: NodeId[] = [endNode];
  let current = endNode;

  while (predecessor.has(current)) {
    current = predecessor.get(current)!;
    path.unshift(current);
  }

  return {
    path,
    length: path.length,
    estimatedTimeMs: nodeTimesMs ? maxDist : undefined,
  };
}

// =============================================================================
// Subgraph Extraction
// =============================================================================

/**
 * Extracts a subgraph containing only specified nodes and their dependencies.
 *
 * @param dag - The source DAG
 * @param nodeIds - Nodes to include (along with their transitive dependencies)
 * @returns A new DAG containing only the specified nodes and dependencies
 */
export function extractSubgraph(dag: DAG, nodeIds: NodeId[]): DAG {
  const nodesToInclude = new Set<NodeId>();
  const queue = [...nodeIds];

  // BFS to find all transitive dependencies
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (nodesToInclude.has(nodeId)) continue;

    nodesToInclude.add(nodeId);

    const node = dag.nodes.get(nodeId);
    if (node) {
      for (const depId of node.dependencies) {
        if (!nodesToInclude.has(depId)) {
          queue.push(depId);
        }
      }
    }
  }

  // Build new DAG
  const newNodes = new Map<NodeId, DAGNode>();
  const newEdges = new Map<NodeId, NodeId[]>();

  for (const nodeId of nodesToInclude) {
    const node = dag.nodes.get(nodeId);
    if (node) {
      // Filter dependencies to only included nodes
      const filteredDeps = node.dependencies.filter(d => nodesToInclude.has(d));
      newNodes.set(nodeId, { ...node, dependencies: filteredDeps });

      const edges = dag.edges.get(nodeId) || [];
      newEdges.set(nodeId, edges.filter(e => nodesToInclude.has(e)));
    }
  }

  return {
    ...dag,
    id: dag.id,
    name: `${dag.name} (subgraph)`,
    nodes: newNodes,
    edges: newEdges,
  };
}

/**
 * Finds all nodes that depend on a given node (transitive dependents).
 *
 * @param dag - The DAG
 * @param nodeId - The node to find dependents of
 * @returns Set of node IDs that transitively depend on the given node
 */
export function findTransitiveDependents(dag: DAG, nodeId: NodeId): Set<NodeId> {
  const dependents = new Set<NodeId>();
  const queue: NodeId[] = [];

  // Find immediate dependents
  for (const [id, node] of dag.nodes) {
    if (node.dependencies.includes(nodeId)) {
      queue.push(id);
    }
  }

  // BFS for transitive dependents
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (dependents.has(current)) continue;

    dependents.add(current);

    for (const [id, node] of dag.nodes) {
      if (node.dependencies.includes(current) && !dependents.has(id)) {
        queue.push(id);
      }
    }
  }

  return dependents;
}

/**
 * Finds all transitive dependencies of a node.
 *
 * @param dag - The DAG
 * @param nodeId - The node to find dependencies of
 * @returns Set of node IDs that the given node transitively depends on
 */
export function findTransitiveDependencies(dag: DAG, nodeId: NodeId): Set<NodeId> {
  const dependencies = new Set<NodeId>();
  const node = dag.nodes.get(nodeId);

  if (!node) return dependencies;

  const queue = [...node.dependencies];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (dependencies.has(current)) continue;

    dependencies.add(current);

    const depNode = dag.nodes.get(current);
    if (depNode) {
      for (const dep of depNode.dependencies) {
        if (!dependencies.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  return dependencies;
}

// =============================================================================
// Statistics Helpers
// =============================================================================

function emptyStats(): DAGStats {
  return {
    totalNodes: 0,
    totalEdges: 0,
    rootNodes: 0,
    leafNodes: 0,
    maxDepth: 0,
    waveCount: 0,
    maxParallelism: 0,
    avgParallelism: 0,
  };
}

function calculateStats(
  nodes: Map<NodeId, DAGNode>,
  waves: ExecutionWave[],
  dependents: Map<NodeId, NodeId[]>
): DAGStats {
  let totalEdges = 0;
  let rootNodes = 0;
  let leafNodes = 0;

  for (const [nodeId, node] of nodes) {
    totalEdges += node.dependencies.length;

    if (node.dependencies.length === 0) {
      rootNodes++;
    }

    const deps = dependents.get(nodeId) || [];
    if (deps.length === 0) {
      leafNodes++;
    }
  }

  const waveSizes = waves.map(w => w.nodeIds.length);
  const maxParallelism = Math.max(...waveSizes, 0);
  const avgParallelism = waveSizes.length > 0
    ? waveSizes.reduce((a, b) => a + b, 0) / waveSizes.length
    : 0;

  return {
    totalNodes: nodes.size,
    totalEdges,
    rootNodes,
    leafNodes,
    maxDepth: waves.length,
    waveCount: waves.length,
    maxParallelism,
    avgParallelism,
  };
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validation errors for a DAG
 */
export interface DAGValidationError {
  type: 'cycle' | 'missing_dependency' | 'orphan_node' | 'duplicate_id' | 'self_dependency';
  message: string;
  nodeIds?: NodeId[];
}

/**
 * Validates a DAG structure.
 *
 * @param dag - The DAG to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateDAG(dag: DAG): DAGValidationError[] {
  const errors: DAGValidationError[] = [];

  // Check for duplicate IDs (shouldn't happen with Map, but let's be safe)
  const seenIds = new Set<string>();
  for (const [nodeId] of dag.nodes) {
    if (seenIds.has(nodeId)) {
      errors.push({
        type: 'duplicate_id',
        message: `Duplicate node ID: ${nodeId}`,
        nodeIds: [nodeId],
      });
    }
    seenIds.add(nodeId);
  }

  // Check for self-dependencies and missing dependencies
  for (const [nodeId, node] of dag.nodes) {
    if (node.dependencies.includes(nodeId)) {
      errors.push({
        type: 'self_dependency',
        message: `Node ${nodeId} depends on itself`,
        nodeIds: [nodeId],
      });
    }

    for (const depId of node.dependencies) {
      if (!dag.nodes.has(depId)) {
        errors.push({
          type: 'missing_dependency',
          message: `Node ${nodeId} depends on non-existent node ${depId}`,
          nodeIds: [nodeId, depId],
        });
      }
    }
  }

  // Check for cycles
  const sortResult = topologicalSort(dag);
  if (!sortResult.success && sortResult.cycle) {
    errors.push({
      type: 'cycle',
      message: `Cycle detected: ${sortResult.cycle.join(' -> ')}`,
      nodeIds: sortResult.cycle,
    });
  }

  return errors;
}

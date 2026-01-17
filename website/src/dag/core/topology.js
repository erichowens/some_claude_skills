"use strict";
/**
 * DAG Topology Algorithms
 *
 * Implements topological sorting, cycle detection, and wave computation
 * for executing DAG nodes in correct dependency order.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.topologicalSort = topologicalSort;
exports.isAcyclic = isAcyclic;
exports.getCycle = getCycle;
exports.findCriticalPath = findCriticalPath;
exports.extractSubgraph = extractSubgraph;
exports.findTransitiveDependents = findTransitiveDependents;
exports.findTransitiveDependencies = findTransitiveDependencies;
exports.validateDAG = validateDAG;
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
function topologicalSort(dag) {
    var nodes = dag.nodes;
    var nodeCount = nodes.size;
    if (nodeCount === 0) {
        return {
            success: true,
            order: [],
            waves: [],
            stats: emptyStats(),
        };
    }
    // Build in-degree map and reverse adjacency list
    var inDegree = new Map();
    var dependents = new Map(); // nodeId -> nodes that depend on it
    // Initialize
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var _a = nodes_1[_i], nodeId = _a[0], node = _a[1];
        inDegree.set(nodeId, node.dependencies.length);
        dependents.set(nodeId, []);
    }
    // Build dependents map (reverse edges)
    for (var _b = 0, nodes_2 = nodes; _b < nodes_2.length; _b++) {
        var _c = nodes_2[_b], nodeId = _c[0], node = _c[1];
        for (var _d = 0, _e = node.dependencies; _d < _e.length; _d++) {
            var depId = _e[_d];
            var depList = dependents.get(depId);
            if (depList) {
                depList.push(nodeId);
            }
            else {
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
    var order = [];
    var waves = [];
    var nodeDepth = new Map();
    // Find all root nodes (in-degree 0)
    var currentWave = [];
    for (var _f = 0, inDegree_1 = inDegree; _f < inDegree_1.length; _f++) {
        var _g = inDegree_1[_f], nodeId = _g[0], degree = _g[1];
        if (degree === 0) {
            currentWave.push(nodeId);
            nodeDepth.set(nodeId, 0);
        }
    }
    var waveNumber = 0;
    var processedCount = 0;
    while (currentWave.length > 0) {
        // Record this wave
        waves.push({
            waveNumber: waveNumber,
            nodeIds: __spreadArray([], currentWave, true),
            status: 'pending',
        });
        // Add wave nodes to order
        order.push.apply(order, currentWave);
        processedCount += currentWave.length;
        // Prepare next wave
        var nextWave = [];
        var nextWaveDepth = waveNumber + 1;
        for (var _h = 0, currentWave_1 = currentWave; _h < currentWave_1.length; _h++) {
            var nodeId = currentWave_1[_h];
            var deps = dependents.get(nodeId) || [];
            for (var _j = 0, deps_1 = deps; _j < deps_1.length; _j++) {
                var depId = deps_1[_j];
                var newDegree = (inDegree.get(depId) || 0) - 1;
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
        var cycle = detectCycle(nodes, inDegree);
        return {
            success: false,
            order: [],
            waves: [],
            cycle: cycle,
            stats: emptyStats(),
        };
    }
    // Calculate statistics
    var stats = calculateStats(nodes, waves, dependents);
    return {
        success: true,
        order: order,
        waves: waves,
        stats: stats,
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
function detectCycle(nodes, inDegree) {
    // Find nodes still in the graph (in-degree > 0)
    var remaining = new Set();
    for (var _i = 0, inDegree_2 = inDegree; _i < inDegree_2.length; _i++) {
        var _a = inDegree_2[_i], nodeId = _a[0], degree = _a[1];
        if (degree > 0) {
            remaining.add(nodeId);
        }
    }
    if (remaining.size === 0) {
        return [];
    }
    // DFS to find cycle
    var WHITE = 0; // Unvisited
    var GRAY = 1; // In current path
    var BLACK = 2; // Fully processed
    var color = new Map();
    var parent = new Map();
    for (var _b = 0, remaining_1 = remaining; _b < remaining_1.length; _b++) {
        var nodeId = remaining_1[_b];
        color.set(nodeId, WHITE);
    }
    var findCycleFromNode = function (startId) {
        var stack = [startId];
        while (stack.length > 0) {
            var nodeId = stack[stack.length - 1];
            var nodeColor = color.get(nodeId) || WHITE;
            if (nodeColor === WHITE) {
                color.set(nodeId, GRAY);
                var node = nodes.get(nodeId);
                if (node) {
                    for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
                        var depId = _a[_i];
                        if (!remaining.has(depId))
                            continue;
                        var depColor = color.get(depId) || WHITE;
                        if (depColor === GRAY) {
                            // Found cycle! Reconstruct it
                            var cycle = [depId];
                            var current = nodeId;
                            while (current !== depId) {
                                cycle.push(current);
                                current = parent.get(current);
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
            }
            else {
                color.set(nodeId, BLACK);
                stack.pop();
            }
        }
        return null;
    };
    for (var _c = 0, remaining_2 = remaining; _c < remaining_2.length; _c++) {
        var nodeId = remaining_2[_c];
        if (color.get(nodeId) === WHITE) {
            var cycle = findCycleFromNode(nodeId);
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
function isAcyclic(dag) {
    return topologicalSort(dag).success;
}
/**
 * Gets the cycle if one exists.
 *
 * @param dag - The DAG to check
 * @returns Array of node IDs forming cycle, or empty if no cycle
 */
function getCycle(dag) {
    var result = topologicalSort(dag);
    return result.cycle || [];
}
/**
 * Finds the critical path (longest path) through the DAG.
 * This represents the minimum possible execution time.
 *
 * @param dag - The DAG to analyze
 * @param nodeTimesMs - Optional map of estimated execution times per node
 * @returns Critical path information
 */
function findCriticalPath(dag, nodeTimesMs) {
    var sortResult = topologicalSort(dag);
    if (!sortResult.success || sortResult.order.length === 0) {
        return { path: [], length: 0 };
    }
    var nodes = dag.nodes;
    var dist = new Map(); // Distance (path length) to each node
    var predecessor = new Map(); // For path reconstruction
    // Initialize distances
    for (var _i = 0, _a = sortResult.order; _i < _a.length; _i++) {
        var nodeId = _a[_i];
        dist.set(nodeId, 0);
    }
    // Process nodes in topological order
    for (var _b = 0, _c = sortResult.order; _b < _c.length; _b++) {
        var nodeId = _c[_b];
        var node = nodes.get(nodeId);
        if (!node)
            continue;
        var currentDist = dist.get(nodeId) || 0;
        var nodeTime = (nodeTimesMs === null || nodeTimesMs === void 0 ? void 0 : nodeTimesMs.get(nodeId)) || 1;
        var newDist = currentDist + nodeTime;
        // Update all dependents
        for (var _d = 0, nodes_3 = nodes; _d < nodes_3.length; _d++) {
            var _e = nodes_3[_d], depId = _e[0], depNode = _e[1];
            if (depNode.dependencies.includes(nodeId)) {
                var depDist = dist.get(depId) || 0;
                if (newDist > depDist) {
                    dist.set(depId, newDist);
                    predecessor.set(depId, nodeId);
                }
            }
        }
    }
    // Find node with maximum distance (end of critical path)
    var maxDist = 0;
    var endNode;
    for (var _f = 0, dist_1 = dist; _f < dist_1.length; _f++) {
        var _g = dist_1[_f], nodeId = _g[0], d = _g[1];
        if (d > maxDist) {
            maxDist = d;
            endNode = nodeId;
        }
    }
    if (!endNode) {
        return { path: [], length: 0 };
    }
    // Reconstruct path
    var path = [endNode];
    var current = endNode;
    while (predecessor.has(current)) {
        current = predecessor.get(current);
        path.unshift(current);
    }
    return {
        path: path,
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
function extractSubgraph(dag, nodeIds) {
    var nodesToInclude = new Set();
    var queue = __spreadArray([], nodeIds, true);
    // BFS to find all transitive dependencies
    while (queue.length > 0) {
        var nodeId = queue.shift();
        if (nodesToInclude.has(nodeId))
            continue;
        nodesToInclude.add(nodeId);
        var node = dag.nodes.get(nodeId);
        if (node) {
            for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
                var depId = _a[_i];
                if (!nodesToInclude.has(depId)) {
                    queue.push(depId);
                }
            }
        }
    }
    // Build new DAG
    var newNodes = new Map();
    var newEdges = new Map();
    for (var _b = 0, nodesToInclude_1 = nodesToInclude; _b < nodesToInclude_1.length; _b++) {
        var nodeId = nodesToInclude_1[_b];
        var node = dag.nodes.get(nodeId);
        if (node) {
            // Filter dependencies to only included nodes
            var filteredDeps = node.dependencies.filter(function (d) { return nodesToInclude.has(d); });
            newNodes.set(nodeId, __assign(__assign({}, node), { dependencies: filteredDeps }));
            var edges = dag.edges.get(nodeId) || [];
            newEdges.set(nodeId, edges.filter(function (e) { return nodesToInclude.has(e); }));
        }
    }
    return __assign(__assign({}, dag), { id: dag.id, name: "".concat(dag.name, " (subgraph)"), nodes: newNodes, edges: newEdges });
}
/**
 * Finds all nodes that depend on a given node (transitive dependents).
 *
 * @param dag - The DAG
 * @param nodeId - The node to find dependents of
 * @returns Set of node IDs that transitively depend on the given node
 */
function findTransitiveDependents(dag, nodeId) {
    var dependents = new Set();
    var queue = [];
    // Find immediate dependents
    for (var _i = 0, _a = dag.nodes; _i < _a.length; _i++) {
        var _b = _a[_i], id = _b[0], node = _b[1];
        if (node.dependencies.includes(nodeId)) {
            queue.push(id);
        }
    }
    // BFS for transitive dependents
    while (queue.length > 0) {
        var current = queue.shift();
        if (dependents.has(current))
            continue;
        dependents.add(current);
        for (var _c = 0, _d = dag.nodes; _c < _d.length; _c++) {
            var _e = _d[_c], id = _e[0], node = _e[1];
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
function findTransitiveDependencies(dag, nodeId) {
    var dependencies = new Set();
    var node = dag.nodes.get(nodeId);
    if (!node)
        return dependencies;
    var queue = __spreadArray([], node.dependencies, true);
    while (queue.length > 0) {
        var current = queue.shift();
        if (dependencies.has(current))
            continue;
        dependencies.add(current);
        var depNode = dag.nodes.get(current);
        if (depNode) {
            for (var _i = 0, _a = depNode.dependencies; _i < _a.length; _i++) {
                var dep = _a[_i];
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
function emptyStats() {
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
function calculateStats(nodes, waves, dependents) {
    var totalEdges = 0;
    var rootNodes = 0;
    var leafNodes = 0;
    for (var _i = 0, nodes_4 = nodes; _i < nodes_4.length; _i++) {
        var _a = nodes_4[_i], nodeId = _a[0], node = _a[1];
        totalEdges += node.dependencies.length;
        if (node.dependencies.length === 0) {
            rootNodes++;
        }
        var deps = dependents.get(nodeId) || [];
        if (deps.length === 0) {
            leafNodes++;
        }
    }
    var waveSizes = waves.map(function (w) { return w.nodeIds.length; });
    var maxParallelism = Math.max.apply(Math, __spreadArray(__spreadArray([], waveSizes, false), [0], false));
    var avgParallelism = waveSizes.length > 0
        ? waveSizes.reduce(function (a, b) { return a + b; }, 0) / waveSizes.length
        : 0;
    return {
        totalNodes: nodes.size,
        totalEdges: totalEdges,
        rootNodes: rootNodes,
        leafNodes: leafNodes,
        maxDepth: waves.length,
        waveCount: waves.length,
        maxParallelism: maxParallelism,
        avgParallelism: avgParallelism,
    };
}
/**
 * Validates a DAG structure.
 *
 * @param dag - The DAG to validate
 * @returns Array of validation errors (empty if valid)
 */
function validateDAG(dag) {
    var errors = [];
    // Check for duplicate IDs (shouldn't happen with Map, but let's be safe)
    var seenIds = new Set();
    for (var _i = 0, _a = dag.nodes; _i < _a.length; _i++) {
        var nodeId = _a[_i][0];
        if (seenIds.has(nodeId)) {
            errors.push({
                type: 'duplicate_id',
                message: "Duplicate node ID: ".concat(nodeId),
                nodeIds: [nodeId],
            });
        }
        seenIds.add(nodeId);
    }
    // Check for self-dependencies and missing dependencies
    for (var _b = 0, _c = dag.nodes; _b < _c.length; _b++) {
        var _d = _c[_b], nodeId = _d[0], node = _d[1];
        if (node.dependencies.includes(nodeId)) {
            errors.push({
                type: 'self_dependency',
                message: "Node ".concat(nodeId, " depends on itself"),
                nodeIds: [nodeId],
            });
        }
        for (var _e = 0, _f = node.dependencies; _e < _f.length; _e++) {
            var depId = _f[_e];
            if (!dag.nodes.has(depId)) {
                errors.push({
                    type: 'missing_dependency',
                    message: "Node ".concat(nodeId, " depends on non-existent node ").concat(depId),
                    nodeIds: [nodeId, depId],
                });
            }
        }
    }
    // Check for cycles
    var sortResult = topologicalSort(dag);
    if (!sortResult.success && sortResult.cycle) {
        errors.push({
            type: 'cycle',
            message: "Cycle detected: ".concat(sortResult.cycle.join(' -> ')),
            nodeIds: sortResult.cycle,
        });
    }
    return errors;
}

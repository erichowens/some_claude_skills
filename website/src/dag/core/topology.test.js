"use strict";
/**
 * Tests for DAG Topology Algorithms
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var topology_1 = require("./topology");
var builder_1 = require("./builder");
var types_1 = require("../types");
// =============================================================================
// Helper to create test DAGs without builder (for edge cases)
// =============================================================================
function createTestDAG(nodes, name) {
    if (name === void 0) { name = 'test-dag'; }
    var nodeMap = new Map();
    var edgeMap = new Map();
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var _a = nodes_1[_i], id = _a.id, deps = _a.deps;
        var nodeId = (0, types_1.NodeId)(id);
        nodeMap.set(nodeId, {
            id: nodeId,
            name: id,
            type: 'skill',
            skillId: 'test-skill',
            dependencies: deps.map(function (d) { return (0, types_1.NodeId)(d); }),
            inputMappings: [],
            config: {
                timeoutMs: 30000,
                priority: 0,
            },
        });
        edgeMap.set(nodeId, []);
    }
    // Build edge map (forward edges from dependencies)
    for (var _b = 0, nodes_2 = nodes; _b < nodes_2.length; _b++) {
        var _c = nodes_2[_b], id = _c.id, deps = _c.deps;
        for (var _d = 0, deps_1 = deps; _d < deps_1.length; _d++) {
            var dep = deps_1[_d];
            var edges = edgeMap.get((0, types_1.NodeId)(dep)) || [];
            edges.push((0, types_1.NodeId)(id));
            edgeMap.set((0, types_1.NodeId)(dep), edges);
        }
    }
    return {
        id: "dag-".concat(name),
        name: name,
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
(0, vitest_1.describe)('topologicalSort', function () {
    (0, vitest_1.describe)('basic cases', function () {
        (0, vitest_1.it)('should handle empty DAG', function () {
            var emptyDAG = createTestDAG([]);
            var result = (0, topology_1.topologicalSort)(emptyDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.order).toHaveLength(0);
            (0, vitest_1.expect)(result.waves).toHaveLength(0);
            (0, vitest_1.expect)(result.stats.totalNodes).toBe(0);
        });
        (0, vitest_1.it)('should handle single node', function () {
            var singleDAG = createTestDAG([{ id: 'A', deps: [] }]);
            var result = (0, topology_1.topologicalSort)(singleDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.order).toHaveLength(1);
            (0, vitest_1.expect)(result.order[0]).toBe((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(result.waves).toHaveLength(1);
            (0, vitest_1.expect)(result.stats.totalNodes).toBe(1);
            (0, vitest_1.expect)(result.stats.rootNodes).toBe(1);
            (0, vitest_1.expect)(result.stats.leafNodes).toBe(1);
        });
        (0, vitest_1.it)('should handle linear chain A -> B -> C', function () {
            var linearDAG = createTestDAG([
                { id: 'A', deps: [] },
                { id: 'B', deps: ['A'] },
                { id: 'C', deps: ['B'] },
            ]);
            var result = (0, topology_1.topologicalSort)(linearDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.order).toHaveLength(3);
            // A must come before B, B before C
            var aIndex = result.order.indexOf((0, types_1.NodeId)('A'));
            var bIndex = result.order.indexOf((0, types_1.NodeId)('B'));
            var cIndex = result.order.indexOf((0, types_1.NodeId)('C'));
            (0, vitest_1.expect)(aIndex).toBeLessThan(bIndex);
            (0, vitest_1.expect)(bIndex).toBeLessThan(cIndex);
            // Should have 3 waves (each node in its own wave)
            (0, vitest_1.expect)(result.waves).toHaveLength(3);
            (0, vitest_1.expect)(result.stats.maxDepth).toBe(3);
        });
        (0, vitest_1.it)('should handle parallel nodes (no dependencies)', function () {
            var parallelDAG = createTestDAG([
                { id: 'A', deps: [] },
                { id: 'B', deps: [] },
                { id: 'C', deps: [] },
            ]);
            var result = (0, topology_1.topologicalSort)(parallelDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.order).toHaveLength(3);
            (0, vitest_1.expect)(result.waves).toHaveLength(1);
            (0, vitest_1.expect)(result.waves[0].nodeIds).toHaveLength(3);
            (0, vitest_1.expect)(result.stats.maxParallelism).toBe(3);
        });
    });
    (0, vitest_1.describe)('wave computation', function () {
        (0, vitest_1.it)('should group independent nodes into same wave', function () {
            // Diamond pattern: A -> B, A -> C, B -> D, C -> D
            var diamondDAG = createTestDAG([
                { id: 'A', deps: [] },
                { id: 'B', deps: ['A'] },
                { id: 'C', deps: ['A'] },
                { id: 'D', deps: ['B', 'C'] },
            ]);
            var result = (0, topology_1.topologicalSort)(diamondDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.waves).toHaveLength(3);
            // Wave 0: A
            (0, vitest_1.expect)(result.waves[0].nodeIds).toContain((0, types_1.NodeId)('A'));
            // Wave 1: B and C (parallel)
            (0, vitest_1.expect)(result.waves[1].nodeIds).toHaveLength(2);
            (0, vitest_1.expect)(result.waves[1].nodeIds).toContain((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(result.waves[1].nodeIds).toContain((0, types_1.NodeId)('C'));
            // Wave 2: D
            (0, vitest_1.expect)(result.waves[2].nodeIds).toContain((0, types_1.NodeId)('D'));
        });
        (0, vitest_1.it)('should compute correct wave numbers', function () {
            var testDAG = (0, builder_1.dag)('wave-test')
                .skillNode('root', 'skill').done()
                .skillNode('child1', 'skill').dependsOn('root').done()
                .skillNode('child2', 'skill').dependsOn('root').done()
                .skillNode('grandchild', 'skill').dependsOn('child1', 'child2').done()
                .build();
            var result = (0, topology_1.topologicalSort)(testDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.waves[0].waveNumber).toBe(0);
            (0, vitest_1.expect)(result.waves[1].waveNumber).toBe(1);
            (0, vitest_1.expect)(result.waves[2].waveNumber).toBe(2);
        });
    });
    (0, vitest_1.describe)('statistics', function () {
        (0, vitest_1.it)('should calculate correct statistics', function () {
            var testDAG = createTestDAG([
                { id: 'A', deps: [] },
                { id: 'B', deps: [] },
                { id: 'C', deps: ['A'] },
                { id: 'D', deps: ['A', 'B'] },
                { id: 'E', deps: ['C', 'D'] },
            ]);
            var result = (0, topology_1.topologicalSort)(testDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.stats.totalNodes).toBe(5);
            (0, vitest_1.expect)(result.stats.totalEdges).toBe(5); // A->C, A->D, B->D, C->E, D->E
            (0, vitest_1.expect)(result.stats.rootNodes).toBe(2); // A, B
            (0, vitest_1.expect)(result.stats.leafNodes).toBe(1); // E
            (0, vitest_1.expect)(result.stats.waveCount).toBe(3);
        });
        (0, vitest_1.it)('should calculate average parallelism', function () {
            // 3 waves: [A, B] (2), [C] (1), [D, E] (2) -> avg = 5/3
            var testDAG = createTestDAG([
                { id: 'A', deps: [] },
                { id: 'B', deps: [] },
                { id: 'C', deps: ['A'] },
                { id: 'D', deps: ['C'] },
                { id: 'E', deps: ['B'] },
            ]);
            var result = (0, topology_1.topologicalSort)(testDAG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.stats.avgParallelism).toBeGreaterThan(1);
        });
    });
    (0, vitest_1.describe)('cycle detection', function () {
        (0, vitest_1.it)('should detect simple cycle A -> B -> A', function () {
            var cyclicDAG = createTestDAG([
                { id: 'A', deps: ['B'] },
                { id: 'B', deps: ['A'] },
            ]);
            var result = (0, topology_1.topologicalSort)(cyclicDAG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.cycle).toBeDefined();
            (0, vitest_1.expect)(result.cycle.length).toBeGreaterThanOrEqual(2);
        });
        (0, vitest_1.it)('should detect longer cycle A -> B -> C -> A', function () {
            var cyclicDAG = createTestDAG([
                { id: 'A', deps: ['C'] },
                { id: 'B', deps: ['A'] },
                { id: 'C', deps: ['B'] },
            ]);
            var result = (0, topology_1.topologicalSort)(cyclicDAG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.cycle).toBeDefined();
        });
        (0, vitest_1.it)('should detect cycle in complex graph', function () {
            // Valid part: X -> Y
            // Cyclic part: A -> B -> C -> A
            var mixedDAG = createTestDAG([
                { id: 'X', deps: [] },
                { id: 'Y', deps: ['X'] },
                { id: 'A', deps: ['C'] },
                { id: 'B', deps: ['A'] },
                { id: 'C', deps: ['B'] },
            ]);
            var result = (0, topology_1.topologicalSort)(mixedDAG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.cycle).toBeDefined();
        });
    });
    (0, vitest_1.describe)('edge cases', function () {
        (0, vitest_1.it)('should fail when dependency references non-existent node', function () {
            var badDAG = createTestDAG([
                { id: 'A', deps: ['missing'] },
            ]);
            var result = (0, topology_1.topologicalSort)(badDAG);
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
});
// =============================================================================
// Acyclicity Tests
// =============================================================================
(0, vitest_1.describe)('isAcyclic', function () {
    (0, vitest_1.it)('should return true for acyclic DAG', function () {
        var acyclicDAG = (0, builder_1.dag)('acyclic')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').dependsOn('A').done()
            .build();
        (0, vitest_1.expect)((0, topology_1.isAcyclic)(acyclicDAG)).toBe(true);
    });
    (0, vitest_1.it)('should return false for cyclic DAG', function () {
        var cyclicDAG = createTestDAG([
            { id: 'A', deps: ['B'] },
            { id: 'B', deps: ['A'] },
        ]);
        (0, vitest_1.expect)((0, topology_1.isAcyclic)(cyclicDAG)).toBe(false);
    });
});
(0, vitest_1.describe)('getCycle', function () {
    (0, vitest_1.it)('should return empty array for acyclic DAG', function () {
        var acyclicDAG = (0, builder_1.dag)('acyclic')
            .skillNode('A', 'skill').done()
            .build();
        (0, vitest_1.expect)((0, topology_1.getCycle)(acyclicDAG)).toHaveLength(0);
    });
    (0, vitest_1.it)('should return cycle nodes for cyclic DAG', function () {
        var cyclicDAG = createTestDAG([
            { id: 'A', deps: ['B'] },
            { id: 'B', deps: ['A'] },
        ]);
        var cycle = (0, topology_1.getCycle)(cyclicDAG);
        (0, vitest_1.expect)(cycle.length).toBeGreaterThan(0);
    });
});
// =============================================================================
// Critical Path Tests
// =============================================================================
(0, vitest_1.describe)('findCriticalPath', function () {
    (0, vitest_1.it)('should find critical path in linear DAG', function () {
        var linearDAG = (0, builder_1.dag)('linear')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').dependsOn('A').done()
            .skillNode('C', 'skill').dependsOn('B').done()
            .build();
        var result = (0, topology_1.findCriticalPath)(linearDAG);
        (0, vitest_1.expect)(result.length).toBe(3);
        (0, vitest_1.expect)(result.path).toContain((0, types_1.NodeId)('A'));
        (0, vitest_1.expect)(result.path).toContain((0, types_1.NodeId)('B'));
        (0, vitest_1.expect)(result.path).toContain((0, types_1.NodeId)('C'));
    });
    (0, vitest_1.it)('should find longest path in diamond DAG', function () {
        // A -> B -> D (length 3)
        // A -> C -> D (length 3)
        var diamondDAG = (0, builder_1.dag)('diamond')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').dependsOn('A').done()
            .skillNode('C', 'skill').dependsOn('A').done()
            .skillNode('D', 'skill').dependsOn('B', 'C').done()
            .build();
        var result = (0, topology_1.findCriticalPath)(diamondDAG);
        (0, vitest_1.expect)(result.length).toBe(3); // A -> B/C -> D
        (0, vitest_1.expect)(result.path[0]).toBe((0, types_1.NodeId)('A'));
        (0, vitest_1.expect)(result.path[result.path.length - 1]).toBe((0, types_1.NodeId)('D'));
    });
    (0, vitest_1.it)('should return empty for empty DAG', function () {
        var emptyDAG = createTestDAG([]);
        var result = (0, topology_1.findCriticalPath)(emptyDAG);
        (0, vitest_1.expect)(result.path).toHaveLength(0);
        (0, vitest_1.expect)(result.length).toBe(0);
    });
    (0, vitest_1.it)('should return empty for cyclic DAG', function () {
        var cyclicDAG = createTestDAG([
            { id: 'A', deps: ['B'] },
            { id: 'B', deps: ['A'] },
        ]);
        var result = (0, topology_1.findCriticalPath)(cyclicDAG);
        (0, vitest_1.expect)(result.path).toHaveLength(0);
    });
    (0, vitest_1.it)('should use node times when provided', function () {
        var testDAG = (0, builder_1.dag)('timed')
            .skillNode('fast', 'skill').done()
            .skillNode('slow', 'skill').done()
            .skillNode('end', 'skill').dependsOn('fast', 'slow').done()
            .build();
        var nodeTimes = new Map();
        nodeTimes.set((0, types_1.NodeId)('fast'), 10);
        nodeTimes.set((0, types_1.NodeId)('slow'), 100);
        nodeTimes.set((0, types_1.NodeId)('end'), 5);
        var result = (0, topology_1.findCriticalPath)(testDAG, nodeTimes);
        (0, vitest_1.expect)(result.estimatedTimeMs).toBeDefined();
        // Critical path should go through slow node
        (0, vitest_1.expect)(result.path).toContain((0, types_1.NodeId)('slow'));
    });
});
// =============================================================================
// Subgraph Extraction Tests
// =============================================================================
(0, vitest_1.describe)('extractSubgraph', function () {
    (0, vitest_1.it)('should extract subgraph with dependencies', function () {
        var fullDAG = (0, builder_1.dag)('full')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').dependsOn('A').done()
            .skillNode('C', 'skill').dependsOn('A').done()
            .skillNode('D', 'skill').dependsOn('B', 'C').done()
            .skillNode('E', 'skill').done() // Unrelated
            .build();
        var subgraph = (0, topology_1.extractSubgraph)(fullDAG, [(0, types_1.NodeId)('D')]);
        // Should include D and all its dependencies (A, B, C)
        (0, vitest_1.expect)(subgraph.nodes.size).toBe(4);
        (0, vitest_1.expect)(subgraph.nodes.has((0, types_1.NodeId)('A'))).toBe(true);
        (0, vitest_1.expect)(subgraph.nodes.has((0, types_1.NodeId)('B'))).toBe(true);
        (0, vitest_1.expect)(subgraph.nodes.has((0, types_1.NodeId)('C'))).toBe(true);
        (0, vitest_1.expect)(subgraph.nodes.has((0, types_1.NodeId)('D'))).toBe(true);
        (0, vitest_1.expect)(subgraph.nodes.has((0, types_1.NodeId)('E'))).toBe(false);
    });
    (0, vitest_1.it)('should extract multiple entry points', function () {
        var fullDAG = (0, builder_1.dag)('full')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').done()
            .skillNode('C', 'skill').dependsOn('A').done()
            .skillNode('D', 'skill').dependsOn('B').done()
            .build();
        var subgraph = (0, topology_1.extractSubgraph)(fullDAG, [
            (0, types_1.NodeId)('C'),
            (0, types_1.NodeId)('D'),
        ]);
        (0, vitest_1.expect)(subgraph.nodes.size).toBe(4);
    });
    (0, vitest_1.it)('should handle node with no dependencies', function () {
        var testDAG = (0, builder_1.dag)('test')
            .skillNode('standalone', 'skill').done()
            .skillNode('other', 'skill').done()
            .build();
        var subgraph = (0, topology_1.extractSubgraph)(testDAG, [(0, types_1.NodeId)('standalone')]);
        (0, vitest_1.expect)(subgraph.nodes.size).toBe(1);
        (0, vitest_1.expect)(subgraph.nodes.has((0, types_1.NodeId)('standalone'))).toBe(true);
    });
});
// =============================================================================
// Transitive Dependency Tests
// =============================================================================
(0, vitest_1.describe)('findTransitiveDependents', function () {
    (0, vitest_1.it)('should find all transitive dependents', function () {
        var testDAG = (0, builder_1.dag)('test')
            .skillNode('root', 'skill').done()
            .skillNode('child1', 'skill').dependsOn('root').done()
            .skillNode('child2', 'skill').dependsOn('root').done()
            .skillNode('grandchild', 'skill').dependsOn('child1').done()
            .build();
        var dependents = (0, topology_1.findTransitiveDependents)(testDAG, (0, types_1.NodeId)('root'));
        (0, vitest_1.expect)(dependents.size).toBe(3);
        (0, vitest_1.expect)(dependents.has((0, types_1.NodeId)('child1'))).toBe(true);
        (0, vitest_1.expect)(dependents.has((0, types_1.NodeId)('child2'))).toBe(true);
        (0, vitest_1.expect)(dependents.has((0, types_1.NodeId)('grandchild'))).toBe(true);
    });
    (0, vitest_1.it)('should return empty set for leaf node', function () {
        var testDAG = (0, builder_1.dag)('test')
            .skillNode('root', 'skill').done()
            .skillNode('leaf', 'skill').dependsOn('root').done()
            .build();
        var dependents = (0, topology_1.findTransitiveDependents)(testDAG, (0, types_1.NodeId)('leaf'));
        (0, vitest_1.expect)(dependents.size).toBe(0);
    });
});
(0, vitest_1.describe)('findTransitiveDependencies', function () {
    (0, vitest_1.it)('should find all transitive dependencies', function () {
        var testDAG = (0, builder_1.dag)('test')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').dependsOn('A').done()
            .skillNode('C', 'skill').dependsOn('B').done()
            .skillNode('D', 'skill').dependsOn('C').done()
            .build();
        var deps = (0, topology_1.findTransitiveDependencies)(testDAG, (0, types_1.NodeId)('D'));
        (0, vitest_1.expect)(deps.size).toBe(3);
        (0, vitest_1.expect)(deps.has((0, types_1.NodeId)('A'))).toBe(true);
        (0, vitest_1.expect)(deps.has((0, types_1.NodeId)('B'))).toBe(true);
        (0, vitest_1.expect)(deps.has((0, types_1.NodeId)('C'))).toBe(true);
    });
    (0, vitest_1.it)('should return empty set for root node', function () {
        var testDAG = (0, builder_1.dag)('test')
            .skillNode('root', 'skill').done()
            .skillNode('child', 'skill').dependsOn('root').done()
            .build();
        var deps = (0, topology_1.findTransitiveDependencies)(testDAG, (0, types_1.NodeId)('root'));
        (0, vitest_1.expect)(deps.size).toBe(0);
    });
    (0, vitest_1.it)('should return empty set for non-existent node', function () {
        var testDAG = (0, builder_1.dag)('test')
            .skillNode('A', 'skill').done()
            .build();
        var deps = (0, topology_1.findTransitiveDependencies)(testDAG, (0, types_1.NodeId)('missing'));
        (0, vitest_1.expect)(deps.size).toBe(0);
    });
});
// =============================================================================
// Validation Tests
// =============================================================================
(0, vitest_1.describe)('validateDAG', function () {
    (0, vitest_1.it)('should return no errors for valid DAG', function () {
        var validDAG = (0, builder_1.dag)('valid')
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').dependsOn('A').done()
            .build();
        var errors = (0, topology_1.validateDAG)(validDAG);
        (0, vitest_1.expect)(errors).toHaveLength(0);
    });
    (0, vitest_1.it)('should detect self-dependency', function () {
        // Create a node that depends on itself
        var selfDepDAG = createTestDAG([
            { id: 'A', deps: ['A'] },
        ]);
        var errors = (0, topology_1.validateDAG)(selfDepDAG);
        (0, vitest_1.expect)(errors.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(errors.some(function (e) { return e.type === 'self_dependency'; })).toBe(true);
    });
    (0, vitest_1.it)('should detect missing dependency', function () {
        var missingDepDAG = createTestDAG([
            { id: 'A', deps: ['nonexistent'] },
        ]);
        var errors = (0, topology_1.validateDAG)(missingDepDAG);
        (0, vitest_1.expect)(errors.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(errors.some(function (e) { return e.type === 'missing_dependency'; })).toBe(true);
    });
    (0, vitest_1.it)('should detect cycles', function () {
        var cyclicDAG = createTestDAG([
            { id: 'A', deps: ['B'] },
            { id: 'B', deps: ['C'] },
            { id: 'C', deps: ['A'] },
        ]);
        var errors = (0, topology_1.validateDAG)(cyclicDAG);
        (0, vitest_1.expect)(errors.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(errors.some(function (e) { return e.type === 'cycle'; })).toBe(true);
    });
    (0, vitest_1.it)('should detect multiple errors', function () {
        // Self-dependency AND missing dependency
        var multiErrorDAG = createTestDAG([
            { id: 'A', deps: ['A', 'missing'] },
        ]);
        var errors = (0, topology_1.validateDAG)(multiErrorDAG);
        (0, vitest_1.expect)(errors.length).toBeGreaterThanOrEqual(2);
    });
});

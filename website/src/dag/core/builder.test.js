"use strict";
/**
 * Tests for DAG Builder
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var builder_1 = require("./builder");
var types_1 = require("../types");
// =============================================================================
// NodeBuilder Tests
// =============================================================================
(0, vitest_1.describe)('NodeBuilder', function () {
    (0, vitest_1.describe)('basic configuration', function () {
        (0, vitest_1.it)('should set node name', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('my-node', 'skill')
                .name('Custom Name')
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('my-node'))) === null || _a === void 0 ? void 0 : _a.name).toBe('Custom Name');
        });
        (0, vitest_1.it)('should set description', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('my-node', 'skill')
                .description('A test node')
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('my-node'))) === null || _a === void 0 ? void 0 : _a.description).toBe('A test node');
        });
        (0, vitest_1.it)('should set skill ID', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('my-node', 'initial-skill')
                .skill('new-skill')
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('my-node'))) === null || _a === void 0 ? void 0 : _a.skillId).toBe('new-skill');
        });
        (0, vitest_1.it)('should set agent ID', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .agentNode('my-agent')
                .agent('agent-123')
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('my-agent'))) === null || _a === void 0 ? void 0 : _a.agentId).toBe('agent-123');
        });
        (0, vitest_1.it)('should set MCP tool', function () {
            var _a, _b;
            var testDAG = (0, builder_1.dag)('test')
                .mcpNode('my-mcp', 'server1', 'tool1')
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('my-mcp'));
            (0, vitest_1.expect)((_a = node === null || node === void 0 ? void 0 : node.mcpTool) === null || _a === void 0 ? void 0 : _a.server).toBe('server1');
            (0, vitest_1.expect)((_b = node === null || node === void 0 ? void 0 : node.mcpTool) === null || _b === void 0 ? void 0 : _b.tool).toBe('tool1');
        });
    });
    (0, vitest_1.describe)('dependencies', function () {
        (0, vitest_1.it)('should add single dependency', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').dependsOn('A').done()
                .build();
            var nodeB = testDAG.nodes.get((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(nodeB === null || nodeB === void 0 ? void 0 : nodeB.dependencies).toContain((0, types_1.NodeId)('A'));
        });
        (0, vitest_1.it)('should add multiple dependencies', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .skillNode('C', 'skill').dependsOn('A', 'B').done()
                .build();
            var nodeC = testDAG.nodes.get((0, types_1.NodeId)('C'));
            (0, vitest_1.expect)(nodeC === null || nodeC === void 0 ? void 0 : nodeC.dependencies).toContain((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)(nodeC === null || nodeC === void 0 ? void 0 : nodeC.dependencies).toContain((0, types_1.NodeId)('B'));
        });
        (0, vitest_1.it)('should accept NodeId type', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').dependsOn((0, types_1.NodeId)('A')).done()
                .build();
            var nodeB = testDAG.nodes.get((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(nodeB === null || nodeB === void 0 ? void 0 : nodeB.dependencies).toContain((0, types_1.NodeId)('A'));
        });
    });
    (0, vitest_1.describe)('retry configuration', function () {
        (0, vitest_1.it)('should set retry policy', function () {
            var _a, _b;
            var policy = {
                maxAttempts: 5,
                baseDelayMs: 500,
                maxDelayMs: 5000,
                backoffMultiplier: 2,
                retryableErrors: ['TIMEOUT'],
                nonRetryableErrors: ['PERMISSION_DENIED'],
            };
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .retry(policy)
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)((_a = node === null || node === void 0 ? void 0 : node.retryPolicy) === null || _a === void 0 ? void 0 : _a.maxAttempts).toBe(5);
            (0, vitest_1.expect)((_b = node === null || node === void 0 ? void 0 : node.retryPolicy) === null || _b === void 0 ? void 0 : _b.baseDelayMs).toBe(500);
        });
        (0, vitest_1.it)('should set simple retry with retryTimes', function () {
            var _a, _b, _c;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .retryTimes(3, 200)
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('A'));
            (0, vitest_1.expect)((_a = node === null || node === void 0 ? void 0 : node.retryPolicy) === null || _a === void 0 ? void 0 : _a.maxAttempts).toBe(3);
            (0, vitest_1.expect)((_b = node === null || node === void 0 ? void 0 : node.retryPolicy) === null || _b === void 0 ? void 0 : _b.baseDelayMs).toBe(200);
            (0, vitest_1.expect)((_c = node === null || node === void 0 ? void 0 : node.retryPolicy) === null || _c === void 0 ? void 0 : _c.maxDelayMs).toBe(2000); // 200 * 10
        });
    });
    (0, vitest_1.describe)('task configuration', function () {
        (0, vitest_1.it)('should set timeout', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .timeout(5000)
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config.timeoutMs).toBe(5000);
        });
        (0, vitest_1.it)('should set model', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .model('opus')
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config.model).toBe('opus');
        });
        (0, vitest_1.it)('should set maxRetries', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .maxRetries(5)
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config.maxRetries).toBe(5);
        });
        (0, vitest_1.it)('should set maxTokens', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .maxTokens(1000)
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config.maxTokens).toBe(1000);
        });
        (0, vitest_1.it)('should set prompt in metadata', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .prompt('Do something')
                .done()
                .build();
            var meta = (_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config.metadata;
            (0, vitest_1.expect)(meta === null || meta === void 0 ? void 0 : meta.prompt).toBe('Do something');
        });
        (0, vitest_1.it)('should merge config settings', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .config({ timeoutMs: 10000, priority: 5 })
                .done()
                .build();
            var config = (_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config;
            (0, vitest_1.expect)(config === null || config === void 0 ? void 0 : config.timeoutMs).toBe(10000);
            (0, vitest_1.expect)(config === null || config === void 0 ? void 0 : config.priority).toBe(5);
        });
    });
    (0, vitest_1.describe)('metadata and tags', function () {
        (0, vitest_1.it)('should set output schema', function () {
            var _a;
            var schema = { type: 'object', properties: { result: { type: 'string' } } };
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .outputSchema(schema)
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.outputSchema).toEqual(schema);
        });
        (0, vitest_1.it)('should set priority', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .priority(10)
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.priority).toBe(10);
        });
        (0, vitest_1.it)('should add tags', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .tags('important', 'fast')
                .done()
                .build();
            var tags = (_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.tags;
            (0, vitest_1.expect)(tags).toContain('important');
            (0, vitest_1.expect)(tags).toContain('fast');
        });
        (0, vitest_1.it)('should set metadata', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill')
                .metadata({ custom: 'value', count: 42 })
                .done()
                .build();
            var meta = (_a = testDAG.nodes.get((0, types_1.NodeId)('A'))) === null || _a === void 0 ? void 0 : _a.config.metadata;
            (0, vitest_1.expect)(meta === null || meta === void 0 ? void 0 : meta.custom).toBe('value');
            (0, vitest_1.expect)(meta === null || meta === void 0 ? void 0 : meta.count).toBe(42);
        });
    });
    (0, vitest_1.describe)('build method', function () {
        (0, vitest_1.it)('should return the built node', function () {
            var nodeBuilder = new builder_1.NodeBuilder(builder_1.DAGBuilder.create('test'), (0, types_1.NodeId)('test'), 'skill', 'Test Node');
            var node = nodeBuilder.skill('my-skill').build();
            (0, vitest_1.expect)(node.id).toBe((0, types_1.NodeId)('test'));
            (0, vitest_1.expect)(node.skillId).toBe('my-skill');
        });
    });
});
// =============================================================================
// ConditionalNodeBuilder Tests
// =============================================================================
(0, vitest_1.describe)('ConditionalNodeBuilder', function () {
    (0, vitest_1.it)('should set condition expression', function () {
        var _a;
        var builder = builder_1.DAGBuilder.create('test');
        var testDAG = builder
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').done()
            .conditionalNode('cond')
            .when('result.success === true')
            .then('A')
            .else('B')
            .done()
            .build();
        var condNode = testDAG.nodes.get((0, types_1.NodeId)('cond'));
        (0, vitest_1.expect)(condNode === null || condNode === void 0 ? void 0 : condNode.type).toBe('conditional');
        (0, vitest_1.expect)((_a = condNode === null || condNode === void 0 ? void 0 : condNode.config.metadata) === null || _a === void 0 ? void 0 : _a.conditionExpression).toBe('result.success === true');
    });
    (0, vitest_1.it)('should set then branch', function () {
        var _a;
        var builder = builder_1.DAGBuilder.create('test');
        var testDAG = builder
            .skillNode('A', 'skill').done()
            .conditionalNode('cond')
            .when('true')
            .then('A')
            .done()
            .build();
        var condNode = testDAG.nodes.get((0, types_1.NodeId)('cond'));
        (0, vitest_1.expect)((_a = condNode === null || condNode === void 0 ? void 0 : condNode.config.metadata) === null || _a === void 0 ? void 0 : _a.thenBranch).toContain((0, types_1.NodeId)('A'));
    });
    (0, vitest_1.it)('should set else branch', function () {
        var _a;
        var builder = builder_1.DAGBuilder.create('test');
        var testDAG = builder
            .skillNode('A', 'skill').done()
            .skillNode('B', 'skill').done()
            .conditionalNode('cond')
            .when('false')
            .then('A')
            .else('B')
            .done()
            .build();
        var condNode = testDAG.nodes.get((0, types_1.NodeId)('cond'));
        (0, vitest_1.expect)((_a = condNode === null || condNode === void 0 ? void 0 : condNode.config.metadata) === null || _a === void 0 ? void 0 : _a.elseBranch).toContain((0, types_1.NodeId)('B'));
    });
});
// =============================================================================
// DAGBuilder Tests
// =============================================================================
(0, vitest_1.describe)('DAGBuilder', function () {
    (0, vitest_1.describe)('DAG metadata', function () {
        (0, vitest_1.it)('should set name', function () {
            var testDAG = (0, builder_1.dag)('My DAG')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.name).toBe('My DAG');
        });
        (0, vitest_1.it)('should set name with method', function () {
            var testDAG = (0, builder_1.dag)()
                .name('Named DAG')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.name).toBe('Named DAG');
        });
        (0, vitest_1.it)('should set version', function () {
            var testDAG = (0, builder_1.dag)('test')
                .version('2.0.0')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.version).toBe('2.0.0');
        });
        (0, vitest_1.it)('should set description', function () {
            var testDAG = (0, builder_1.dag)('test')
                .description('A test DAG')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.description).toBe('A test DAG');
        });
        (0, vitest_1.it)('should set author', function () {
            var testDAG = (0, builder_1.dag)('test')
                .author('Test Author')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.author).toBe('Test Author');
        });
        (0, vitest_1.it)('should add tags', function () {
            var testDAG = (0, builder_1.dag)('test')
                .tags('workflow', 'automation')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.tags).toContain('workflow');
            (0, vitest_1.expect)(testDAG.tags).toContain('automation');
        });
    });
    (0, vitest_1.describe)('DAG configuration', function () {
        (0, vitest_1.it)('should set max parallelism', function () {
            var testDAG = (0, builder_1.dag)('test')
                .maxParallel(5)
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.config.maxParallelism).toBe(5);
        });
        (0, vitest_1.it)('should set timeout', function () {
            var testDAG = (0, builder_1.dag)('test')
                .timeout(60000)
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.config.maxExecutionTimeMs).toBe(60000);
        });
        (0, vitest_1.it)('should set failFast', function () {
            var testDAG = (0, builder_1.dag)('test')
                .failFast(true)
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.config.failFast).toBe(true);
        });
        (0, vitest_1.it)('should set execution mode', function () {
            var testDAG = (0, builder_1.dag)('test')
                .executionMode('sequential')
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.config.executionMode).toBe('sequential');
        });
        (0, vitest_1.it)('should merge config', function () {
            var testDAG = (0, builder_1.dag)('test')
                .config({ maxParallelism: 3, failFast: true })
                .skillNode('A', 'skill').done()
                .build();
            (0, vitest_1.expect)(testDAG.config.maxParallelism).toBe(3);
            (0, vitest_1.expect)(testDAG.config.failFast).toBe(true);
        });
    });
    (0, vitest_1.describe)('node creation', function () {
        (0, vitest_1.it)('should create skill node', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('my-skill', 'skill-id')
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('my-skill'));
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.type).toBe('skill');
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.skillId).toBe('skill-id');
        });
        (0, vitest_1.it)('should create agent node', function () {
            var testDAG = (0, builder_1.dag)('test')
                .agentNode('my-agent', 'agent-id')
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('my-agent'));
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.type).toBe('agent');
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.agentId).toBe('agent-id');
        });
        (0, vitest_1.it)('should create MCP node', function () {
            var _a, _b;
            var testDAG = (0, builder_1.dag)('test')
                .mcpNode('my-mcp', 'my-server', 'my-tool')
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('my-mcp'));
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.type).toBe('mcp-tool');
            (0, vitest_1.expect)((_a = node === null || node === void 0 ? void 0 : node.mcpTool) === null || _a === void 0 ? void 0 : _a.server).toBe('my-server');
            (0, vitest_1.expect)((_b = node === null || node === void 0 ? void 0 : node.mcpTool) === null || _b === void 0 ? void 0 : _b.tool).toBe('my-tool');
        });
        (0, vitest_1.it)('should create composite node', function () {
            var _a;
            var subDag = (0, builder_1.dag)('sub').skillNode('s', 'skill').done().build();
            var testDAG = (0, builder_1.dag)('test')
                .compositeNode('comp', subDag)
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('comp'));
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.type).toBe('composite');
            (0, vitest_1.expect)((_a = node === null || node === void 0 ? void 0 : node.config.metadata) === null || _a === void 0 ? void 0 : _a.subDagId).toBe(subDag.id);
        });
        (0, vitest_1.it)('should create conditional node', function () {
            var testDAG = (0, builder_1.dag)('test')
                .conditionalNode('cond')
                .when('true')
                .done()
                .build();
            var node = testDAG.nodes.get((0, types_1.NodeId)('cond'));
            (0, vitest_1.expect)(node === null || node === void 0 ? void 0 : node.type).toBe('conditional');
        });
        (0, vitest_1.it)('should create generic node', function () {
            var _a;
            var testDAG = (0, builder_1.dag)('test')
                .node('my-node', 'skill')
                .skill('some-skill')
                .done()
                .build();
            (0, vitest_1.expect)((_a = testDAG.nodes.get((0, types_1.NodeId)('my-node'))) === null || _a === void 0 ? void 0 : _a.type).toBe('skill');
        });
        (0, vitest_1.it)('should add pre-built node', function () {
            var preBuiltNode = {
                id: (0, types_1.NodeId)('pre-built'),
                name: 'Pre-Built',
                type: 'skill',
                skillId: 'skill-1',
                dependencies: [],
                inputMappings: [],
                state: { status: 'pending' },
                config: { timeoutMs: 30000, priority: 0 },
            };
            var testDAG = (0, builder_1.dag)('test')
                .addNode(preBuiltNode)
                .build();
            (0, vitest_1.expect)(testDAG.nodes.has((0, types_1.NodeId)('pre-built'))).toBe(true);
        });
    });
    (0, vitest_1.describe)('edge methods', function () {
        (0, vitest_1.it)('should add single edge', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .edge('A', 'B')
                .build();
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('A'))).toContain((0, types_1.NodeId)('B'));
        });
        (0, vitest_1.it)('should add multiple edges', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .skillNode('C', 'skill').done()
                .edges([['A', 'B'], ['B', 'C']])
                .build();
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('A'))).toContain((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('B'))).toContain((0, types_1.NodeId)('C'));
        });
        (0, vitest_1.it)('should create chain', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .skillNode('C', 'skill').done()
                .chain('A', 'B', 'C')
                .build();
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('A'))).toContain((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('B'))).toContain((0, types_1.NodeId)('C'));
        });
        (0, vitest_1.it)('should fan out from one to many', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .skillNode('C', 'skill').done()
                .skillNode('D', 'skill').done()
                .fanOut('A', 'B', 'C', 'D')
                .build();
            var edges = testDAG.edges.get((0, types_1.NodeId)('A')) || [];
            (0, vitest_1.expect)(edges).toContain((0, types_1.NodeId)('B'));
            (0, vitest_1.expect)(edges).toContain((0, types_1.NodeId)('C'));
            (0, vitest_1.expect)(edges).toContain((0, types_1.NodeId)('D'));
        });
        (0, vitest_1.it)('should fan in from many to one', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .skillNode('C', 'skill').done()
                .skillNode('D', 'skill').done()
                .fanIn('D', 'A', 'B', 'C')
                .build();
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('A'))).toContain((0, types_1.NodeId)('D'));
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('B'))).toContain((0, types_1.NodeId)('D'));
            (0, vitest_1.expect)(testDAG.edges.get((0, types_1.NodeId)('C'))).toContain((0, types_1.NodeId)('D'));
        });
    });
    (0, vitest_1.describe)('inputs and outputs', function () {
        (0, vitest_1.it)('should add single input', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .input({ name: 'query', required: true, schema: { type: 'string' } })
                .build();
            (0, vitest_1.expect)(testDAG.inputs).toHaveLength(1);
            (0, vitest_1.expect)(testDAG.inputs[0].name).toBe('query');
        });
        (0, vitest_1.it)('should add multiple inputs', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .inputs('input1', 'input2', 'input3')
                .build();
            (0, vitest_1.expect)(testDAG.inputs).toHaveLength(3);
            (0, vitest_1.expect)(testDAG.inputs[0].name).toBe('input1');
            (0, vitest_1.expect)(testDAG.inputs[0].required).toBe(true);
        });
        (0, vitest_1.it)('should add single output', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .output({ name: 'result', sourceNodeId: (0, types_1.NodeId)('A') })
                .build();
            (0, vitest_1.expect)(testDAG.outputs).toHaveLength(1);
            (0, vitest_1.expect)(testDAG.outputs[0].name).toBe('result');
        });
        (0, vitest_1.it)('should add multiple outputs', function () {
            var testDAG = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').done()
                .outputs({ name: 'out1', from: 'A' }, { name: 'out2', from: 'B' })
                .build();
            (0, vitest_1.expect)(testDAG.outputs).toHaveLength(2);
            (0, vitest_1.expect)(testDAG.outputs[0].sourceNodeId).toBe((0, types_1.NodeId)('A'));
        });
    });
    (0, vitest_1.describe)('validation', function () {
        (0, vitest_1.it)('should validate empty DAG', function () {
            var builder = (0, builder_1.dag)('empty');
            var result = builder.validate();
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('DAG has no nodes');
        });
        (0, vitest_1.it)('should validate missing dependency', function () {
            var builder = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').dependsOn('missing').done();
            var result = builder.validate();
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(function (e) { return e.includes('non-existent'); })).toBe(true);
        });
        (0, vitest_1.it)('should detect cycle', function () {
            var builder = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').dependsOn('B').done()
                .skillNode('B', 'skill').dependsOn('A').done();
            var result = builder.validate();
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(function (e) { return e.includes('Cycle'); })).toBe(true);
        });
        (0, vitest_1.it)('should warn about skill node without skillId', function () {
            var builder = (0, builder_1.dag)('test')
                .node('A', 'skill').done(); // No skill() call
            var result = builder.validate();
            (0, vitest_1.expect)(result.warnings.some(function (w) { return w.includes('no skillId'); })).toBe(true);
        });
        (0, vitest_1.it)('should return valid for correct DAG', function () {
            var builder = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').dependsOn('A').done();
            var result = builder.validate();
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('build methods', function () {
        (0, vitest_1.it)('should throw for invalid DAG on build()', function () {
            (0, vitest_1.expect)(function () {
                (0, builder_1.dag)('test').build();
            }).toThrow(builder_1.DAGBuilderError);
        });
        (0, vitest_1.it)('should not throw for buildUnsafe()', function () {
            var testDAG = (0, builder_1.dag)('test').buildUnsafe();
            (0, vitest_1.expect)(testDAG.nodes.size).toBe(0);
        });
    });
    (0, vitest_1.describe)('execution order', function () {
        (0, vitest_1.it)('should get execution order', function () {
            var builder = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').done()
                .skillNode('B', 'skill').dependsOn('A').done()
                .skillNode('C', 'skill').dependsOn('B').done();
            var order = builder.getExecutionOrder();
            var aIdx = order.indexOf((0, types_1.NodeId)('A'));
            var bIdx = order.indexOf((0, types_1.NodeId)('B'));
            var cIdx = order.indexOf((0, types_1.NodeId)('C'));
            (0, vitest_1.expect)(aIdx).toBeLessThan(bIdx);
            (0, vitest_1.expect)(bIdx).toBeLessThan(cIdx);
        });
        (0, vitest_1.it)('should throw for cyclic graph in getExecutionOrder', function () {
            var builder = (0, builder_1.dag)('test')
                .skillNode('A', 'skill').dependsOn('B').done()
                .skillNode('B', 'skill').dependsOn('A').done();
            (0, vitest_1.expect)(function () { return builder.getExecutionOrder(); }).toThrow('cycle');
        });
    });
    (0, vitest_1.describe)('clone and merge', function () {
        (0, vitest_1.it)('should clone builder', function () {
            var original = (0, builder_1.dag)('original')
                .skillNode('A', 'skill').done();
            var cloned = original.clone();
            // Modify original
            original.skillNode('B', 'skill').done();
            // Cloned should not be affected
            var originalDag = original.build();
            var clonedDag = cloned.build();
            (0, vitest_1.expect)(originalDag.nodes.size).toBe(2);
            (0, vitest_1.expect)(clonedDag.nodes.size).toBe(1);
            (0, vitest_1.expect)(clonedDag.id).not.toBe(originalDag.id);
        });
        (0, vitest_1.it)('should merge DAGs', function () {
            var subDag = (0, builder_1.dag)('sub')
                .skillNode('X', 'skill').done()
                .skillNode('Y', 'skill').dependsOn('X').done()
                .build();
            var mainDag = (0, builder_1.dag)('main')
                .skillNode('A', 'skill').done()
                .merge(subDag, 'sub')
                .build();
            (0, vitest_1.expect)(mainDag.nodes.has((0, types_1.NodeId)('A'))).toBe(true);
            (0, vitest_1.expect)(mainDag.nodes.has((0, types_1.NodeId)('sub_X'))).toBe(true);
            (0, vitest_1.expect)(mainDag.nodes.has((0, types_1.NodeId)('sub_Y'))).toBe(true);
        });
    });
});
// =============================================================================
// Convenience Function Tests
// =============================================================================
(0, vitest_1.describe)('Convenience Functions', function () {
    (0, vitest_1.describe)('dag()', function () {
        (0, vitest_1.it)('should create DAGBuilder', function () {
            var builder = (0, builder_1.dag)('test');
            (0, vitest_1.expect)(builder).toBeInstanceOf(builder_1.DAGBuilder);
        });
    });
    (0, vitest_1.describe)('linearDag()', function () {
        (0, vitest_1.it)('should create linear DAG', function () {
            var linear = (0, builder_1.linearDag)('linear', 'skill-a', 'skill-b', 'skill-c');
            (0, vitest_1.expect)(linear.nodes.size).toBe(3);
            // Check dependencies
            var node0 = linear.nodes.get((0, types_1.NodeId)('node-0'));
            var node1 = linear.nodes.get((0, types_1.NodeId)('node-1'));
            var node2 = linear.nodes.get((0, types_1.NodeId)('node-2'));
            (0, vitest_1.expect)(node0 === null || node0 === void 0 ? void 0 : node0.dependencies).toHaveLength(0);
            (0, vitest_1.expect)(node1 === null || node1 === void 0 ? void 0 : node1.dependencies).toContain((0, types_1.NodeId)('node-0'));
            (0, vitest_1.expect)(node2 === null || node2 === void 0 ? void 0 : node2.dependencies).toContain((0, types_1.NodeId)('node-1'));
        });
    });
    (0, vitest_1.describe)('fanOutFanInDag()', function () {
        (0, vitest_1.it)('should create fan-out/fan-in DAG', function () {
            var fanDag = (0, builder_1.fanOutFanInDag)('fan', 'start-skill', ['parallel-1', 'parallel-2', 'parallel-3'], 'end-skill');
            (0, vitest_1.expect)(fanDag.nodes.size).toBe(5); // 1 start + 3 parallel + 1 end
            // Check start node
            var startNode = fanDag.nodes.get((0, types_1.NodeId)('start'));
            (0, vitest_1.expect)(startNode === null || startNode === void 0 ? void 0 : startNode.skillId).toBe('start-skill');
            (0, vitest_1.expect)(startNode === null || startNode === void 0 ? void 0 : startNode.dependencies).toHaveLength(0);
            // Check parallel nodes depend on start
            var parallel0 = fanDag.nodes.get((0, types_1.NodeId)('parallel-0'));
            (0, vitest_1.expect)(parallel0 === null || parallel0 === void 0 ? void 0 : parallel0.dependencies).toContain((0, types_1.NodeId)('start'));
            // Check end node depends on all parallels
            var endNode = fanDag.nodes.get((0, types_1.NodeId)('end'));
            (0, vitest_1.expect)(endNode === null || endNode === void 0 ? void 0 : endNode.dependencies).toContain((0, types_1.NodeId)('parallel-0'));
            (0, vitest_1.expect)(endNode === null || endNode === void 0 ? void 0 : endNode.dependencies).toContain((0, types_1.NodeId)('parallel-1'));
            (0, vitest_1.expect)(endNode === null || endNode === void 0 ? void 0 : endNode.dependencies).toContain((0, types_1.NodeId)('parallel-2'));
        });
    });
});
// =============================================================================
// DAGBuilderError Tests
// =============================================================================
(0, vitest_1.describe)('DAGBuilderError', function () {
    (0, vitest_1.it)('should include details', function () {
        var error = new builder_1.DAGBuilderError('Test error', { foo: 'bar' });
        (0, vitest_1.expect)(error.message).toBe('Test error');
        (0, vitest_1.expect)(error.details).toEqual({ foo: 'bar' });
        (0, vitest_1.expect)(error.name).toBe('DAGBuilderError');
    });
});

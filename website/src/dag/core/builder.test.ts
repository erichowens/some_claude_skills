/**
 * Tests for DAG Builder
 */

import { describe, it, expect } from 'vitest';
import {
  dag,
  DAGBuilder,
  NodeBuilder,
  ConditionalNodeBuilder,
  DAGBuilderError,
  linearDag,
  fanOutFanInDag,
} from './builder';
import { NodeId, DAGId } from '../types';

// =============================================================================
// NodeBuilder Tests
// =============================================================================

describe('NodeBuilder', () => {
  describe('basic configuration', () => {
    it('should set node name', () => {
      const testDAG = dag('test')
        .skillNode('my-node', 'skill')
        .name('Custom Name')
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('my-node'))?.name).toBe('Custom Name');
    });

    it('should set description', () => {
      const testDAG = dag('test')
        .skillNode('my-node', 'skill')
        .description('A test node')
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('my-node'))?.description).toBe('A test node');
    });

    it('should set skill ID', () => {
      const testDAG = dag('test')
        .skillNode('my-node', 'initial-skill')
        .skill('new-skill')
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('my-node'))?.skillId).toBe('new-skill');
    });

    it('should set agent ID', () => {
      const testDAG = dag('test')
        .agentNode('my-agent')
        .agent('agent-123')
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('my-agent'))?.agentId).toBe('agent-123');
    });

    it('should set MCP tool', () => {
      const testDAG = dag('test')
        .mcpNode('my-mcp', 'server1', 'tool1')
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('my-mcp'));
      expect(node?.mcpTool?.server).toBe('server1');
      expect(node?.mcpTool?.tool).toBe('tool1');
    });
  });

  describe('dependencies', () => {
    it('should add single dependency', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').dependsOn('A').done()
        .build();

      const nodeB = testDAG.nodes.get(NodeId('B'));
      expect(nodeB?.dependencies).toContain(NodeId('A'));
    });

    it('should add multiple dependencies', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .skillNode('C', 'skill').dependsOn('A', 'B').done()
        .build();

      const nodeC = testDAG.nodes.get(NodeId('C'));
      expect(nodeC?.dependencies).toContain(NodeId('A'));
      expect(nodeC?.dependencies).toContain(NodeId('B'));
    });

    it('should accept NodeId type', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').dependsOn(NodeId('A')).done()
        .build();

      const nodeB = testDAG.nodes.get(NodeId('B'));
      expect(nodeB?.dependencies).toContain(NodeId('A'));
    });
  });

  describe('retry configuration', () => {
    it('should set retry policy', () => {
      const policy = {
        maxAttempts: 5,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        retryableErrors: ['TIMEOUT'],
        nonRetryableErrors: ['PERMISSION_DENIED'],
      };

      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .retry(policy)
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('A'));
      expect(node?.retryPolicy?.maxAttempts).toBe(5);
      expect(node?.retryPolicy?.baseDelayMs).toBe(500);
    });

    it('should set simple retry with retryTimes', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .retryTimes(3, 200)
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('A'));
      expect(node?.retryPolicy?.maxAttempts).toBe(3);
      expect(node?.retryPolicy?.baseDelayMs).toBe(200);
      expect(node?.retryPolicy?.maxDelayMs).toBe(2000); // 200 * 10
    });
  });

  describe('task configuration', () => {
    it('should set timeout', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .timeout(5000)
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('A'))?.config.timeoutMs).toBe(5000);
    });

    it('should set model', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .model('opus')
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('A'))?.config.model).toBe('opus');
    });

    it('should set maxRetries', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .maxRetries(5)
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('A'))?.config.maxRetries).toBe(5);
    });

    it('should set maxTokens', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .maxTokens(1000)
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('A'))?.config.maxTokens).toBe(1000);
    });

    it('should set prompt in metadata', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .prompt('Do something')
        .done()
        .build();

      const meta = testDAG.nodes.get(NodeId('A'))?.config.metadata;
      expect(meta?.prompt).toBe('Do something');
    });

    it('should merge config settings', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .config({ timeoutMs: 10000, priority: 5 })
        .done()
        .build();

      const config = testDAG.nodes.get(NodeId('A'))?.config;
      expect(config?.timeoutMs).toBe(10000);
      expect(config?.priority).toBe(5);
    });
  });

  describe('metadata and tags', () => {
    it('should set output schema', () => {
      const schema = { type: 'object', properties: { result: { type: 'string' } } };
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .outputSchema(schema)
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('A'))?.outputSchema).toEqual(schema);
    });

    it('should set priority', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .priority(10)
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('A'))?.priority).toBe(10);
    });

    it('should add tags', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .tags('important', 'fast')
        .done()
        .build();

      const tags = testDAG.nodes.get(NodeId('A'))?.tags;
      expect(tags).toContain('important');
      expect(tags).toContain('fast');
    });

    it('should set metadata', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill')
        .metadata({ custom: 'value', count: 42 })
        .done()
        .build();

      const meta = testDAG.nodes.get(NodeId('A'))?.config.metadata;
      expect(meta?.custom).toBe('value');
      expect(meta?.count).toBe(42);
    });
  });

  describe('build method', () => {
    it('should return the built node', () => {
      const nodeBuilder = new NodeBuilder(
        DAGBuilder.create('test'),
        NodeId('test'),
        'skill',
        'Test Node'
      );
      const node = nodeBuilder.skill('my-skill').build();

      expect(node.id).toBe(NodeId('test'));
      expect(node.skillId).toBe('my-skill');
    });
  });
});

// =============================================================================
// ConditionalNodeBuilder Tests
// =============================================================================

describe('ConditionalNodeBuilder', () => {
  it('should set condition expression', () => {
    const builder = DAGBuilder.create('test');
    const testDAG = builder
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').done()
      .conditionalNode('cond')
      .when('result.success === true')
      .then('A')
      .else('B')
      .done()
      .build();

    const condNode = testDAG.nodes.get(NodeId('cond'));
    expect(condNode?.type).toBe('conditional');
    expect(condNode?.config.metadata?.conditionExpression).toBe('result.success === true');
  });

  it('should set then branch', () => {
    const builder = DAGBuilder.create('test');
    const testDAG = builder
      .skillNode('A', 'skill').done()
      .conditionalNode('cond')
      .when('true')
      .then('A')
      .done()
      .build();

    const condNode = testDAG.nodes.get(NodeId('cond'));
    expect(condNode?.config.metadata?.thenBranch).toContain(NodeId('A'));
  });

  it('should set else branch', () => {
    const builder = DAGBuilder.create('test');
    const testDAG = builder
      .skillNode('A', 'skill').done()
      .skillNode('B', 'skill').done()
      .conditionalNode('cond')
      .when('false')
      .then('A')
      .else('B')
      .done()
      .build();

    const condNode = testDAG.nodes.get(NodeId('cond'));
    expect(condNode?.config.metadata?.elseBranch).toContain(NodeId('B'));
  });
});

// =============================================================================
// DAGBuilder Tests
// =============================================================================

describe('DAGBuilder', () => {
  describe('DAG metadata', () => {
    it('should set name', () => {
      const testDAG = dag('My DAG')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.name).toBe('My DAG');
    });

    it('should set name with method', () => {
      const testDAG = dag()
        .name('Named DAG')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.name).toBe('Named DAG');
    });

    it('should set version', () => {
      const testDAG = dag('test')
        .version('2.0.0')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.version).toBe('2.0.0');
    });

    it('should set description', () => {
      const testDAG = dag('test')
        .description('A test DAG')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.description).toBe('A test DAG');
    });

    it('should set author', () => {
      const testDAG = dag('test')
        .author('Test Author')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.author).toBe('Test Author');
    });

    it('should add tags', () => {
      const testDAG = dag('test')
        .tags('workflow', 'automation')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.tags).toContain('workflow');
      expect(testDAG.tags).toContain('automation');
    });
  });

  describe('DAG configuration', () => {
    it('should set max parallelism', () => {
      const testDAG = dag('test')
        .maxParallel(5)
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.config.maxParallelism).toBe(5);
    });

    it('should set timeout', () => {
      const testDAG = dag('test')
        .timeout(60000)
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.config.maxExecutionTimeMs).toBe(60000);
    });

    it('should set failFast', () => {
      const testDAG = dag('test')
        .failFast(true)
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.config.failFast).toBe(true);
    });

    it('should set execution mode', () => {
      const testDAG = dag('test')
        .executionMode('sequential')
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.config.executionMode).toBe('sequential');
    });

    it('should merge config', () => {
      const testDAG = dag('test')
        .config({ maxParallelism: 3, failFast: true })
        .skillNode('A', 'skill').done()
        .build();

      expect(testDAG.config.maxParallelism).toBe(3);
      expect(testDAG.config.failFast).toBe(true);
    });
  });

  describe('node creation', () => {
    it('should create skill node', () => {
      const testDAG = dag('test')
        .skillNode('my-skill', 'skill-id')
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('my-skill'));
      expect(node?.type).toBe('skill');
      expect(node?.skillId).toBe('skill-id');
    });

    it('should create agent node', () => {
      const testDAG = dag('test')
        .agentNode('my-agent', 'agent-id')
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('my-agent'));
      expect(node?.type).toBe('agent');
      expect(node?.agentId).toBe('agent-id');
    });

    it('should create MCP node', () => {
      const testDAG = dag('test')
        .mcpNode('my-mcp', 'my-server', 'my-tool')
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('my-mcp'));
      expect(node?.type).toBe('mcp-tool');
      expect(node?.mcpTool?.server).toBe('my-server');
      expect(node?.mcpTool?.tool).toBe('my-tool');
    });

    it('should create composite node', () => {
      const subDag = dag('sub').skillNode('s', 'skill').done().build();
      const testDAG = dag('test')
        .compositeNode('comp', subDag)
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('comp'));
      expect(node?.type).toBe('composite');
      expect(node?.config.metadata?.subDagId).toBe(subDag.id);
    });

    it('should create conditional node', () => {
      const testDAG = dag('test')
        .conditionalNode('cond')
        .when('true')
        .done()
        .build();

      const node = testDAG.nodes.get(NodeId('cond'));
      expect(node?.type).toBe('conditional');
    });

    it('should create generic node', () => {
      const testDAG = dag('test')
        .node('my-node', 'skill')
        .skill('some-skill')
        .done()
        .build();

      expect(testDAG.nodes.get(NodeId('my-node'))?.type).toBe('skill');
    });

    it('should add pre-built node', () => {
      const preBuiltNode = {
        id: NodeId('pre-built'),
        name: 'Pre-Built',
        type: 'skill' as const,
        skillId: 'skill-1',
        dependencies: [],
        inputMappings: [],
        state: { status: 'pending' as const },
        config: { timeoutMs: 30000, priority: 0 },
      };

      const testDAG = dag('test')
        .addNode(preBuiltNode)
        .build();

      expect(testDAG.nodes.has(NodeId('pre-built'))).toBe(true);
    });
  });

  describe('edge methods', () => {
    it('should add single edge', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .edge('A', 'B')
        .build();

      expect(testDAG.edges.get(NodeId('A'))).toContain(NodeId('B'));
    });

    it('should add multiple edges', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .skillNode('C', 'skill').done()
        .edges([['A', 'B'], ['B', 'C']])
        .build();

      expect(testDAG.edges.get(NodeId('A'))).toContain(NodeId('B'));
      expect(testDAG.edges.get(NodeId('B'))).toContain(NodeId('C'));
    });

    it('should create chain', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .skillNode('C', 'skill').done()
        .chain('A', 'B', 'C')
        .build();

      expect(testDAG.edges.get(NodeId('A'))).toContain(NodeId('B'));
      expect(testDAG.edges.get(NodeId('B'))).toContain(NodeId('C'));
    });

    it('should fan out from one to many', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .skillNode('C', 'skill').done()
        .skillNode('D', 'skill').done()
        .fanOut('A', 'B', 'C', 'D')
        .build();

      const edges = testDAG.edges.get(NodeId('A')) || [];
      expect(edges).toContain(NodeId('B'));
      expect(edges).toContain(NodeId('C'));
      expect(edges).toContain(NodeId('D'));
    });

    it('should fan in from many to one', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .skillNode('C', 'skill').done()
        .skillNode('D', 'skill').done()
        .fanIn('D', 'A', 'B', 'C')
        .build();

      expect(testDAG.edges.get(NodeId('A'))).toContain(NodeId('D'));
      expect(testDAG.edges.get(NodeId('B'))).toContain(NodeId('D'));
      expect(testDAG.edges.get(NodeId('C'))).toContain(NodeId('D'));
    });
  });

  describe('inputs and outputs', () => {
    it('should add single input', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .input({ name: 'query', required: true, schema: { type: 'string' } })
        .build();

      expect(testDAG.inputs).toHaveLength(1);
      expect(testDAG.inputs[0].name).toBe('query');
    });

    it('should add multiple inputs', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .inputs('input1', 'input2', 'input3')
        .build();

      expect(testDAG.inputs).toHaveLength(3);
      expect(testDAG.inputs[0].name).toBe('input1');
      expect(testDAG.inputs[0].required).toBe(true);
    });

    it('should add single output', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .output({ name: 'result', sourceNodeId: NodeId('A') })
        .build();

      expect(testDAG.outputs).toHaveLength(1);
      expect(testDAG.outputs[0].name).toBe('result');
    });

    it('should add multiple outputs', () => {
      const testDAG = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').done()
        .outputs(
          { name: 'out1', from: 'A' },
          { name: 'out2', from: 'B' }
        )
        .build();

      expect(testDAG.outputs).toHaveLength(2);
      expect(testDAG.outputs[0].sourceNodeId).toBe(NodeId('A'));
    });
  });

  describe('validation', () => {
    it('should validate empty DAG', () => {
      const builder = dag('empty');
      const result = builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('DAG has no nodes');
    });

    it('should validate missing dependency', () => {
      const builder = dag('test')
        .skillNode('A', 'skill').dependsOn('missing').done();
      const result = builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('non-existent'))).toBe(true);
    });

    it('should detect cycle', () => {
      const builder = dag('test')
        .skillNode('A', 'skill').dependsOn('B').done()
        .skillNode('B', 'skill').dependsOn('A').done();
      const result = builder.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Cycle'))).toBe(true);
    });

    it('should warn about skill node without skillId', () => {
      const builder = dag('test')
        .node('A', 'skill').done(); // No skill() call
      const result = builder.validate();

      expect(result.warnings.some(w => w.includes('no skillId'))).toBe(true);
    });

    it('should return valid for correct DAG', () => {
      const builder = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').dependsOn('A').done();
      const result = builder.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('build methods', () => {
    it('should throw for invalid DAG on build()', () => {
      expect(() => {
        dag('test').build();
      }).toThrow(DAGBuilderError);
    });

    it('should not throw for buildUnsafe()', () => {
      const testDAG = dag('test').buildUnsafe();
      expect(testDAG.nodes.size).toBe(0);
    });
  });

  describe('execution order', () => {
    it('should get execution order', () => {
      const builder = dag('test')
        .skillNode('A', 'skill').done()
        .skillNode('B', 'skill').dependsOn('A').done()
        .skillNode('C', 'skill').dependsOn('B').done();

      const order = builder.getExecutionOrder();

      const aIdx = order.indexOf(NodeId('A'));
      const bIdx = order.indexOf(NodeId('B'));
      const cIdx = order.indexOf(NodeId('C'));

      expect(aIdx).toBeLessThan(bIdx);
      expect(bIdx).toBeLessThan(cIdx);
    });

    it('should throw for cyclic graph in getExecutionOrder', () => {
      const builder = dag('test')
        .skillNode('A', 'skill').dependsOn('B').done()
        .skillNode('B', 'skill').dependsOn('A').done();

      expect(() => builder.getExecutionOrder()).toThrow('cycle');
    });
  });

  describe('clone and merge', () => {
    it('should clone builder', () => {
      const original = dag('original')
        .skillNode('A', 'skill').done();
      const cloned = original.clone();

      // Modify original
      original.skillNode('B', 'skill').done();

      // Cloned should not be affected
      const originalDag = original.build();
      const clonedDag = cloned.build();

      expect(originalDag.nodes.size).toBe(2);
      expect(clonedDag.nodes.size).toBe(1);
      expect(clonedDag.id).not.toBe(originalDag.id);
    });

    it('should merge DAGs', () => {
      const subDag = dag('sub')
        .skillNode('X', 'skill').done()
        .skillNode('Y', 'skill').dependsOn('X').done()
        .build();

      const mainDag = dag('main')
        .skillNode('A', 'skill').done()
        .merge(subDag, 'sub')
        .build();

      expect(mainDag.nodes.has(NodeId('A'))).toBe(true);
      expect(mainDag.nodes.has(NodeId('sub_X'))).toBe(true);
      expect(mainDag.nodes.has(NodeId('sub_Y'))).toBe(true);
    });
  });
});

// =============================================================================
// Convenience Function Tests
// =============================================================================

describe('Convenience Functions', () => {
  describe('dag()', () => {
    it('should create DAGBuilder', () => {
      const builder = dag('test');
      expect(builder).toBeInstanceOf(DAGBuilder);
    });
  });

  describe('linearDag()', () => {
    it('should create linear DAG', () => {
      const linear = linearDag('linear', 'skill-a', 'skill-b', 'skill-c');

      expect(linear.nodes.size).toBe(3);

      // Check dependencies
      const node0 = linear.nodes.get(NodeId('node-0'));
      const node1 = linear.nodes.get(NodeId('node-1'));
      const node2 = linear.nodes.get(NodeId('node-2'));

      expect(node0?.dependencies).toHaveLength(0);
      expect(node1?.dependencies).toContain(NodeId('node-0'));
      expect(node2?.dependencies).toContain(NodeId('node-1'));
    });
  });

  describe('fanOutFanInDag()', () => {
    it('should create fan-out/fan-in DAG', () => {
      const fanDag = fanOutFanInDag(
        'fan',
        'start-skill',
        ['parallel-1', 'parallel-2', 'parallel-3'],
        'end-skill'
      );

      expect(fanDag.nodes.size).toBe(5); // 1 start + 3 parallel + 1 end

      // Check start node
      const startNode = fanDag.nodes.get(NodeId('start'));
      expect(startNode?.skillId).toBe('start-skill');
      expect(startNode?.dependencies).toHaveLength(0);

      // Check parallel nodes depend on start
      const parallel0 = fanDag.nodes.get(NodeId('parallel-0'));
      expect(parallel0?.dependencies).toContain(NodeId('start'));

      // Check end node depends on all parallels
      const endNode = fanDag.nodes.get(NodeId('end'));
      expect(endNode?.dependencies).toContain(NodeId('parallel-0'));
      expect(endNode?.dependencies).toContain(NodeId('parallel-1'));
      expect(endNode?.dependencies).toContain(NodeId('parallel-2'));
    });
  });
});

// =============================================================================
// DAGBuilderError Tests
// =============================================================================

describe('DAGBuilderError', () => {
  it('should include details', () => {
    const error = new DAGBuilderError('Test error', { foo: 'bar' });
    expect(error.message).toBe('Test error');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('DAGBuilderError');
  });
});

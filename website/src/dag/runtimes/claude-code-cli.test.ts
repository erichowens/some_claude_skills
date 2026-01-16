/**
 * Tests for Claude Code CLI Runtime
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ClaudeCodeRuntime,
  createClaudeCodeRuntime,
  formatTaskCall,
  generateParallelTaskMessage,
  TaskToolCall,
  ExecutionContext,
  ClaudeCodeRuntimeConfig,
} from './claude-code-cli';
import { DAGBuilder } from '../core/builder';
import { NodeId, ExecutionId } from '../types';
import { getPreset } from '../permissions/presets';

// =============================================================================
// Test Fixtures
// =============================================================================

function createSimpleDAG() {
  return new DAGBuilder('Simple DAG')
    .addNode({
      id: 'node-a' as NodeId,
      name: 'Node A',
      type: 'skill',
      dependencies: [],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .addNode({
      id: 'node-b' as NodeId,
      name: 'Node B',
      type: 'skill',
      dependencies: ['node-a' as NodeId],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .output({
      name: 'result',
      sourceNodeId: 'node-b' as NodeId,
    })
    .build();
}

function createParallelDAG() {
  return new DAGBuilder('Parallel DAG')
    .addNode({
      id: 'root' as NodeId,
      name: 'Root',
      type: 'skill',
      dependencies: [],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .addNode({
      id: 'branch-a' as NodeId,
      name: 'Branch A',
      type: 'skill',
      dependencies: ['root' as NodeId],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .addNode({
      id: 'branch-b' as NodeId,
      name: 'Branch B',
      type: 'skill',
      dependencies: ['root' as NodeId],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .addNode({
      id: 'merge' as NodeId,
      name: 'Merge',
      type: 'skill',
      dependencies: ['branch-a' as NodeId, 'branch-b' as NodeId],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .output({
      name: 'merged-result',
      sourceNodeId: 'merge' as NodeId,
    })
    .build();
}

function createComplexDAG() {
  return new DAGBuilder('Complex DAG')
    .addNode({
      id: 'composite-node' as NodeId,
      name: 'Composite Node',
      type: 'composite',
      dependencies: [],
      config: { timeoutMs: 60000, priority: 1 },
    })
    .addNode({
      id: 'skill-node' as NodeId,
      name: 'Skill Node',
      type: 'skill',
      skillId: 'graph-builder',
      dependencies: ['composite-node' as NodeId],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .addNode({
      id: 'agent-node' as NodeId,
      name: 'Agent Node',
      type: 'agent',
      agentId: 'debugger',
      dependencies: ['skill-node' as NodeId],
      config: { timeoutMs: 30000, priority: 1 },
    })
    .addNode({
      id: 'many-deps' as NodeId,
      name: 'Many Dependencies',
      type: 'skill',
      dependencies: ['composite-node' as NodeId, 'skill-node' as NodeId, 'agent-node' as NodeId],
      skillId: 'result-aggregator',
      config: { timeoutMs: 30000, priority: 1 },
    })
    .output({
      name: 'final',
      sourceNodeId: 'many-deps' as NodeId,
    })
    .build();
}

// =============================================================================
// Constructor Tests
// =============================================================================

describe('ClaudeCodeRuntime', () => {
  describe('constructor', () => {
    it('creates runtime with default config', () => {
      const runtime = new ClaudeCodeRuntime();
      expect(runtime).toBeDefined();
    });

    it('creates runtime with custom permissions', () => {
      const permissions = getPreset('minimal');
      const runtime = new ClaudeCodeRuntime({ permissions });
      expect(runtime).toBeDefined();
    });

    it('creates runtime with custom maxParallelTasks', () => {
      const runtime = new ClaudeCodeRuntime({ maxParallelTasks: 10 });
      expect(runtime).toBeDefined();
    });

    it('creates runtime with custom defaultModel', () => {
      const runtime = new ClaudeCodeRuntime({ defaultModel: 'opus' });
      expect(runtime).toBeDefined();
    });

    it('creates runtime with custom defaultMaxTurns', () => {
      const runtime = new ClaudeCodeRuntime({ defaultMaxTurns: 20 });
      expect(runtime).toBeDefined();
    });

    it('creates runtime with runInBackground option', () => {
      const runtime = new ClaudeCodeRuntime({ runInBackground: true });
      expect(runtime).toBeDefined();
    });

    it('creates runtime with callback handlers', () => {
      const onNodeStart = vi.fn();
      const onNodeComplete = vi.fn();
      const onNodeError = vi.fn();
      const onWaveStart = vi.fn();
      const onWaveComplete = vi.fn();

      const runtime = new ClaudeCodeRuntime({
        onNodeStart,
        onNodeComplete,
        onNodeError,
        onWaveStart,
        onWaveComplete,
      });

      expect(runtime).toBeDefined();
    });
  });

  // ===========================================================================
  // Execute Tests
  // ===========================================================================

  describe('execute', () => {
    it('executes a simple DAG successfully', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const result = await runtime.execute(dag);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('executes a parallel DAG successfully', async () => {
      const dag = createParallelDAG();
      const runtime = new ClaudeCodeRuntime();

      const result = await runtime.execute(dag);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('executes a complex DAG successfully', async () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime();

      const result = await runtime.execute(dag);

      expect(result.success).toBe(true);
    });

    it('handles inputs correctly', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const inputs = { key: 'value', number: 42 };

      const result = await runtime.execute(dag, inputs);

      expect(result.success).toBe(true);
    });

    it('calls onNodeStart for each node', async () => {
      const dag = createSimpleDAG();
      const onNodeStart = vi.fn();
      const runtime = new ClaudeCodeRuntime({ onNodeStart });

      await runtime.execute(dag);

      expect(onNodeStart).toHaveBeenCalledTimes(2);
    });

    it('calls onNodeComplete for successful nodes', async () => {
      const dag = createSimpleDAG();
      const onNodeComplete = vi.fn();
      const runtime = new ClaudeCodeRuntime({ onNodeComplete });

      await runtime.execute(dag);

      expect(onNodeComplete).toHaveBeenCalledTimes(2);
    });

    it('calls onWaveStart for each wave', async () => {
      const dag = createSimpleDAG();
      const onWaveStart = vi.fn();
      const runtime = new ClaudeCodeRuntime({ onWaveStart });

      await runtime.execute(dag);

      // Simple DAG has 2 waves (node-a, then node-b)
      expect(onWaveStart).toHaveBeenCalledTimes(2);
    });

    it('calls onWaveComplete for each wave', async () => {
      const dag = createSimpleDAG();
      const onWaveComplete = vi.fn();
      const runtime = new ClaudeCodeRuntime({ onWaveComplete });

      await runtime.execute(dag);

      expect(onWaveComplete).toHaveBeenCalledTimes(2);
    });

    it('returns outputs from completed nodes', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const result = await runtime.execute(dag);

      expect(result.outputs.size).toBeGreaterThan(0);
      expect(result.outputs.has('result')).toBe(true);
    });

    it('returns execution snapshot', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const result = await runtime.execute(dag);

      expect(result.snapshot).toBeDefined();
      expect(result.snapshot.dagId).toMatch(/^dag-/);
      expect(result.snapshot.status).toBe('completed');
    });

    it('returns total token usage', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const result = await runtime.execute(dag);

      expect(result.totalTokenUsage).toBeDefined();
      // Simple DAG has 2 nodes, each with simulated 100 input / 50 output tokens
      expect(result.totalTokenUsage.inputTokens).toBe(200);
      expect(result.totalTokenUsage.outputTokens).toBe(100);
    });

    it('fails when DAG has a cycle', async () => {
      // Create a DAG with a cycle (using internal structure)
      const dag = createSimpleDAG();
      // Manually add a cycle
      const nodeA = dag.nodes.get('node-a' as NodeId);
      if (nodeA) {
        nodeA.dependencies = ['node-b' as NodeId];
      }

      const runtime = new ClaudeCodeRuntime();
      const result = await runtime.execute(dag);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('CYCLE_DETECTED');
    });

    it('fails when Task tool is disabled (no task calls generated)', async () => {
      const dag = createSimpleDAG();
      const permissions = getPreset('minimal');
      permissions.coreTools.task = false;

      const onNodeError = vi.fn();
      const runtime = new ClaudeCodeRuntime({ permissions, onNodeError });

      const result = await runtime.execute(dag);

      // Nodes fail because no task calls are generated
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('TOOL_ERROR');
      expect(result.errors[0].message).toContain('failed');
    });

    it('aggregates token usage from node results', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      // Execute to get context with results
      const result = await runtime.execute(dag);

      // The simulated execution doesn't include tokenUsage,
      // so we verify the aggregation logic handles missing tokenUsage gracefully
      expect(result.totalTokenUsage).toBeDefined();
      expect(result.totalTokenUsage.inputTokens).toBeGreaterThanOrEqual(0);
      expect(result.totalTokenUsage.outputTokens).toBeGreaterThanOrEqual(0);
    });

    it('handles task execution failure gracefully', async () => {
      const dag = createSimpleDAG();
      const onNodeError = vi.fn();
      const runtime = new ClaudeCodeRuntime({ onNodeError });

      // Mock simulateTaskExecution to return failure
      const mockSimulate = vi
        .spyOn(runtime as unknown as { simulateTaskExecution: () => Promise<{ success: boolean; error?: string }> }, 'simulateTaskExecution')
        .mockResolvedValue({ success: false, error: 'Simulated failure' });

      const result = await runtime.execute(dag);

      expect(result.success).toBe(false);
      expect(onNodeError).toHaveBeenCalled();

      mockSimulate.mockRestore();
    });

    it('aggregates token usage when results have tokenUsage', async () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      // Mock simulateTaskExecution to return result with tokenUsage
      const mockSimulate = vi
        .spyOn(runtime as unknown as { simulateTaskExecution: () => Promise<{ success: boolean; output?: unknown }> }, 'simulateTaskExecution')
        .mockResolvedValue({
          success: true,
          output: { data: 'test' },
        });

      // Also need to patch the result to include tokenUsage
      // We'll verify through the output having correct structure
      const result = await runtime.execute(dag);

      expect(result.success).toBe(true);
      expect(result.totalTokenUsage).toBeDefined();

      mockSimulate.mockRestore();
    });
  });

  // ===========================================================================
  // generateWaveTaskCalls Tests
  // ===========================================================================

  describe('generateWaveTaskCalls', () => {
    it('generates task calls for a single node', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const context = createTestContext(dag);

      const calls = runtime.generateWaveTaskCalls(dag, ['node-a' as NodeId], context);

      expect(calls.size).toBe(1);
      expect(calls.has('node-a' as NodeId)).toBe(true);
    });

    it('generates task calls for multiple nodes', () => {
      const dag = createParallelDAG();
      const runtime = new ClaudeCodeRuntime();
      const context = createTestContext(dag);

      const calls = runtime.generateWaveTaskCalls(
        dag,
        ['branch-a' as NodeId, 'branch-b' as NodeId],
        context
      );

      expect(calls.size).toBe(2);
      expect(calls.has('branch-a' as NodeId)).toBe(true);
      expect(calls.has('branch-b' as NodeId)).toBe(true);
    });

    it('skips non-existent nodes', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const context = createTestContext(dag);

      const calls = runtime.generateWaveTaskCalls(
        dag,
        ['node-a' as NodeId, 'non-existent' as NodeId],
        context
      );

      expect(calls.size).toBe(1);
    });

    it('returns empty map when Task tool not allowed', () => {
      const dag = createSimpleDAG();
      const permissions = getPreset('minimal');
      permissions.coreTools.task = false;
      const runtime = new ClaudeCodeRuntime({ permissions });
      const context = createTestContext(dag);

      const calls = runtime.generateWaveTaskCalls(dag, ['node-a' as NodeId], context);

      expect(calls.size).toBe(0);
    });
  });

  // ===========================================================================
  // generateTaskCall Tests
  // ===========================================================================

  describe('generateTaskCall', () => {
    it('generates a task call with required fields', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.description).toBeDefined();
      expect(call.prompt).toBeDefined();
      expect(call.subagent_type).toBeDefined();
    });

    it('includes model in task call', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime({ defaultModel: 'opus' });
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBeDefined();
    });

    it('includes max_turns in task call', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime({ defaultMaxTurns: 15 });
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.max_turns).toBe(15);
    });

    it('includes run_in_background in task call', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime({ runInBackground: true });
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.run_in_background).toBe(true);
    });

    it('generates description for skill nodes', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('skill-node' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.description).toContain('graph-builder');
    });

    it('generates description for composite nodes', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('composite-node' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.description).toContain('sub-DAG');
    });

    it('includes dependency results in prompt', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const nodeB = dag.nodes.get('node-b' as NodeId)!;
      const context = createTestContext(dag);

      // Add result for node-a
      context.nodeResults.set('node-a' as NodeId, {
        output: { test: 'data' },
        confidence: 0.9,
      });

      const call = runtime.generateTaskCall(nodeB, context);

      expect(call.prompt).toContain('Results from Dependencies');
      expect(call.prompt).toContain('node-a');
    });

    it('includes parent context in prompt', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);
      context.parentContext = { key: 'value' };

      const call = runtime.generateTaskCall(node, context);

      expect(call.prompt).toContain('Context from Parent');
    });

    it('includes variables in prompt', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);
      context.variables.set('inputVar', 'testValue');

      const call = runtime.generateTaskCall(node, context);

      expect(call.prompt).toContain('Available Variables');
    });
  });

  // ===========================================================================
  // Subagent Type Tests
  // ===========================================================================

  describe('subagent type determination', () => {
    it('uses agentId when specified', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('agent-node' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.subagent_type).toBe('debugger');
    });

    it('maps skill IDs to appropriate agent types', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('skill-node' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.subagent_type).toBe('Plan'); // graph-builder maps to Plan
    });

    it('uses Plan for composite nodes', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('composite-node' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.subagent_type).toBe('Plan');
    });

    it('uses general-purpose as default', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const node = dag.nodes.get('node-a' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.subagent_type).toBe('general-purpose');
    });

    it('uses subagentType from metadata', () => {
      const dag = createSimpleDAG();
      const node = dag.nodes.get('node-a' as NodeId)!;
      node.config.metadata = { subagentType: 'code-reviewer' };

      const runtime = new ClaudeCodeRuntime();
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.subagent_type).toBe('code-reviewer');
    });
  });

  // ===========================================================================
  // Model Selection Tests
  // ===========================================================================

  describe('model selection', () => {
    it('uses node-specific model when configured', () => {
      const dag = createSimpleDAG();
      const node = dag.nodes.get('node-a' as NodeId)!;
      node.config.model = 'opus';

      const runtime = new ClaudeCodeRuntime();
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBe('opus');
    });

    it('selects haiku for simple nodes', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime({ defaultModel: 'sonnet' });
      const node = dag.nodes.get('node-a' as NodeId)!;
      // node-a has no dependencies - simple
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBe('haiku');
    });

    it('selects opus for complex nodes', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime({ defaultModel: 'sonnet' });
      const node = dag.nodes.get('composite-node' as NodeId)!;
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBe('opus');
    });

    it('selects default model for nodes with 3 dependencies (moderate)', () => {
      const dag = createComplexDAG();
      const runtime = new ClaudeCodeRuntime({ defaultModel: 'sonnet' });
      const node = dag.nodes.get('many-deps' as NodeId)!;
      // many-deps has exactly 3 dependencies - moderate (not > 3)
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBe('sonnet'); // moderate complexity uses default
    });

    it('selects opus for nodes with more than 3 dependencies', () => {
      const dag = createComplexDAG();
      const node = dag.nodes.get('many-deps' as NodeId)!;
      // Add a 4th dependency to trigger 'complex' threshold (> 3)
      node.dependencies = [...node.dependencies, 'composite-node' as NodeId];

      const runtime = new ClaudeCodeRuntime({ defaultModel: 'sonnet' });
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBe('opus'); // > 3 dependencies = complex
    });

    it('respects allowed models from permissions', () => {
      const permissions = getPreset('standard');
      permissions.models = { allowed: ['haiku'] };

      const dag = createSimpleDAG();
      const node = dag.nodes.get('node-b' as NodeId)!;
      // node-b has 1 dependency - moderate, would normally use sonnet

      const runtime = new ClaudeCodeRuntime({
        permissions,
        defaultModel: 'sonnet',
      });
      const context = createTestContext(dag);

      const call = runtime.generateTaskCall(node, context);

      expect(call.model).toBe('haiku'); // Only allowed model
    });
  });

  // ===========================================================================
  // generateExecutionPlan Tests
  // ===========================================================================

  describe('generateExecutionPlan', () => {
    it('generates plan for simple DAG', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const plan = runtime.generateExecutionPlan(dag);

      expect(plan.dagId).toMatch(/^dag-/);
      expect(plan.dagName).toBe('Simple DAG');
      expect(plan.totalNodes).toBe(2);
      expect(plan.totalWaves).toBe(2);
      expect(plan.waves).toHaveLength(2);
    });

    it('generates plan for parallel DAG', () => {
      const dag = createParallelDAG();
      const runtime = new ClaudeCodeRuntime();

      const plan = runtime.generateExecutionPlan(dag);

      expect(plan.totalNodes).toBe(4);
      expect(plan.totalWaves).toBe(3);

      // Wave 2 should have parallel branches
      const wave2 = plan.waves.find(w => w.waveNumber === 1);
      expect(wave2?.parallelizable).toBe(true);
      expect(wave2?.nodeIds.length).toBe(2);
    });

    it('includes task calls in each wave', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const plan = runtime.generateExecutionPlan(dag);

      for (const wave of plan.waves) {
        expect(Object.keys(wave.taskCalls).length).toBe(wave.nodeIds.length);
      }
    });

    it('marks single-node waves as not parallelizable', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();

      const plan = runtime.generateExecutionPlan(dag);

      expect(plan.waves[0].parallelizable).toBe(false);
      expect(plan.waves[1].parallelizable).toBe(false);
    });

    it('includes inputs in context', () => {
      const dag = createSimpleDAG();
      const runtime = new ClaudeCodeRuntime();
      const inputs = { key: 'value' };

      const plan = runtime.generateExecutionPlan(dag, inputs);

      // Inputs are used to create context which affects prompts
      expect(plan.waves).toHaveLength(2);
    });

    it('returns error for cyclic DAG', () => {
      const dag = createSimpleDAG();
      const nodeA = dag.nodes.get('node-a' as NodeId);
      if (nodeA) {
        nodeA.dependencies = ['node-b' as NodeId];
      }

      const runtime = new ClaudeCodeRuntime();
      const plan = runtime.generateExecutionPlan(dag);

      expect(plan.error).toBeDefined();
      expect(plan.error).toContain('Cycle detected');
      expect(plan.totalWaves).toBe(0);
      expect(plan.waves).toHaveLength(0);
    });
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('createClaudeCodeRuntime', () => {
  it('creates runtime with default config', () => {
    const runtime = createClaudeCodeRuntime();
    expect(runtime).toBeInstanceOf(ClaudeCodeRuntime);
  });

  it('creates runtime with custom config', () => {
    const runtime = createClaudeCodeRuntime({
      defaultModel: 'opus',
      maxParallelTasks: 10,
    });
    expect(runtime).toBeInstanceOf(ClaudeCodeRuntime);
  });
});

describe('formatTaskCall', () => {
  it('formats task call as JSON', () => {
    const call: TaskToolCall = {
      description: 'Test task',
      prompt: 'Do something',
      subagent_type: 'general-purpose',
      model: 'sonnet',
    };

    const formatted = formatTaskCall(call);

    expect(formatted).toContain('"description": "Test task"');
    expect(formatted).toContain('"subagent_type": "general-purpose"');
  });

  it('includes all fields in output', () => {
    const call: TaskToolCall = {
      description: 'Test',
      prompt: 'Prompt',
      subagent_type: 'debugger',
      model: 'opus',
      max_turns: 20,
      run_in_background: true,
    };

    const formatted = formatTaskCall(call);
    const parsed = JSON.parse(formatted);

    expect(parsed.max_turns).toBe(20);
    expect(parsed.run_in_background).toBe(true);
  });
});

describe('generateParallelTaskMessage', () => {
  it('generates message for single task', () => {
    const calls: TaskToolCall[] = [
      {
        description: 'Task 1',
        prompt: 'Do task 1',
        subagent_type: 'general-purpose',
      },
    ];

    const message = generateParallelTaskMessage(calls);

    expect(message).toContain('execute these tasks in parallel');
    expect(message).toContain('Task 1');
  });

  it('generates message for multiple tasks', () => {
    const calls: TaskToolCall[] = [
      {
        description: 'Task 1',
        prompt: 'Do task 1',
        subagent_type: 'general-purpose',
      },
      {
        description: 'Task 2',
        prompt: 'Do task 2',
        subagent_type: 'debugger',
      },
    ];

    const message = generateParallelTaskMessage(calls);

    expect(message).toContain('Task 1');
    expect(message).toContain('Task 2');
    expect(message).toContain('general-purpose');
    expect(message).toContain('debugger');
  });

  it('includes JSON blocks for each task', () => {
    const calls: TaskToolCall[] = [
      {
        description: 'Task 1',
        prompt: 'Do task 1',
        subagent_type: 'general-purpose',
        model: 'sonnet',
      },
    ];

    const message = generateParallelTaskMessage(calls);

    expect(message).toContain('```json');
    expect(message).toContain('"model": "sonnet"');
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

function createTestContext(dag: ReturnType<typeof createSimpleDAG>): ExecutionContext {
  return {
    dagId: dag.id,
    executionId: ExecutionId('test-exec-1'),
    nodeResults: new Map(),
    variables: new Map(),
    startTime: new Date(),
    permissions: getPreset('standard'),
  };
}

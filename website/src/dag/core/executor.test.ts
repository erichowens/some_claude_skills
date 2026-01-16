/**
 * DAG Executor Tests
 *
 * Comprehensive test suite for the DAG execution engine.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DAGExecutor,
  NoOpExecutor,
  executeDAG,
  NodeExecutor,
  NodeExecutionContext,
  DAGExecutorOptions,
} from './executor';
import { dag, linearDag, fanOutFanInDag } from './builder';
import type {
  DAG,
  DAGNode,
  TaskResult,
  TaskError,
  NodeId,
} from '../types';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a mock executor that records calls and returns custom results
 */
function createMockExecutor(
  options: {
    delay?: number;
    results?: Map<string, TaskResult>;
    errors?: Map<string, TaskError>;
    canExecuteTypes?: string[];
  } = {}
): NodeExecutor & { calls: NodeExecutionContext[] } {
  const calls: NodeExecutionContext[] = [];
  const { delay = 10, results, errors, canExecuteTypes = ['skill', 'agent', 'mcp-tool', 'composite', 'conditional'] } = options;

  return {
    calls,
    async execute(context: NodeExecutionContext): Promise<TaskResult> {
      calls.push(context);

      // Simulate some async work
      await new Promise(resolve => setTimeout(resolve, delay));

      // Check for errors
      if (errors?.has(context.node.id as string)) {
        throw errors.get(context.node.id as string);
      }

      // Return custom result if provided
      if (results?.has(context.node.id as string)) {
        return results.get(context.node.id as string)!;
      }

      // Default result
      return {
        output: { nodeId: context.node.id, executed: true },
        confidence: 1.0,
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
      };
    },
    canExecute(node: DAGNode): boolean {
      return canExecuteTypes.includes(node.type);
    },
  };
}

/**
 * Create a simple test DAG with the builder
 */
function createSimpleDAG(name: string = 'test-dag'): DAG {
  return dag(name)
    .skillNode('node-1', 'skill-a')
      .prompt('Do task 1')
      .done()
    .skillNode('node-2', 'skill-b')
      .dependsOn('node-1')
      .prompt('Do task 2')
      .done()
    .outputs({ name: 'result', from: 'node-2' })
    .build();
}

// =============================================================================
// Basic Execution Tests
// =============================================================================

describe('DAGExecutor', () => {
  describe('basic execution', () => {
    it('should execute a single-node DAG', async () => {
      const testDAG = dag('single-node')
        .skillNode('only-node', 'test-skill')
          .prompt('Do the thing')
          .done()
        .outputs({ name: 'output', from: 'only-node' })
        .build();

      const executor = createMockExecutor();
      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(executor.calls).toHaveLength(1);
      expect(executor.calls[0].node.id).toBe('only-node');
    });

    it('should execute a linear DAG in order', async () => {
      const testDAG = linearDag('linear-test', 'skill-1', 'skill-2', 'skill-3');

      const executor = createMockExecutor();
      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(executor.calls).toHaveLength(3);

      // Verify execution order
      const executionOrder = executor.calls.map(c => c.node.id);
      expect(executionOrder).toEqual(['node-0', 'node-1', 'node-2']);
    });

    it('should pass dependency outputs to dependent nodes', async () => {
      const testDAG = createSimpleDAG();
      const customResults = new Map<string, TaskResult>([
        ['node-1', { output: { data: 'from-node-1' }, confidence: 1.0 }],
      ]);

      const executor = createMockExecutor({ results: customResults });
      await executeDAG(testDAG, { executors: [executor] });

      // Second node should have received first node's output
      const secondNodeContext = executor.calls.find(c => c.node.id === 'node-2');
      expect(secondNodeContext?.dependencyOutputs.size).toBe(1);

      const depOutput = secondNodeContext?.dependencyOutputs.get('node-1' as NodeId);
      expect(depOutput?.output).toEqual({ data: 'from-node-1' });
    });

    it('should build outputs from completed nodes', async () => {
      const testDAG = dag('output-test')
        .skillNode('producer', 'test-skill')
          .done()
        .outputs({ name: 'final', from: 'producer' })
        .build();

      const customResults = new Map<string, TaskResult>([
        ['producer', { output: { answer: 42 }, confidence: 1.0 }],
      ]);

      const executor = createMockExecutor({ results: customResults });
      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(result.outputs.get('final')).toEqual({ answer: 42 });
    });
  });

  // ===========================================================================
  // Parallel Execution Tests
  // ===========================================================================

  describe('parallel execution', () => {
    it('should execute independent nodes in parallel', async () => {
      const testDAG = dag('parallel-test')
        .skillNode('a', 'skill-a').done()
        .skillNode('b', 'skill-b').done()
        .skillNode('c', 'skill-c').done()
        .build();

      const startTimes: Map<string, number> = new Map();
      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          startTimes.set(context.node.id as string, Date.now());
          await new Promise(resolve => setTimeout(resolve, 50));
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const startTime = Date.now();
      const result = await executeDAG(testDAG, { executors: [executor] });

      // All nodes should have started nearly simultaneously
      expect(result.success).toBe(true);

      const times = Array.from(startTimes.values());
      const maxDiff = Math.max(...times) - Math.min(...times);
      expect(maxDiff).toBeLessThan(30); // All should start within 30ms

      // Total time should be ~50ms (parallel), not ~150ms (sequential)
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(150);
    });

    it('should execute fan-out/fan-in DAG correctly', async () => {
      const testDAG = fanOutFanInDag(
        'fan-test',
        'start-skill',
        ['parallel-1', 'parallel-2', 'parallel-3'],
        'end-skill'
      );

      const executionLog: string[] = [];
      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          executionLog.push(`start:${context.node.id}`);
          await new Promise(resolve => setTimeout(resolve, 20));
          executionLog.push(`end:${context.node.id}`);
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);

      // Start should complete before parallel nodes begin
      const startEndIndex = executionLog.indexOf('end:start');
      const parallelStartIndices = [
        executionLog.indexOf('start:parallel-0'),
        executionLog.indexOf('start:parallel-1'),
        executionLog.indexOf('start:parallel-2'),
      ];

      for (const idx of parallelStartIndices) {
        expect(idx).toBeGreaterThan(startEndIndex);
      }

      // End should start after all parallel nodes complete
      const endStartIndex = executionLog.indexOf('start:end');
      const parallelEndIndices = [
        executionLog.indexOf('end:parallel-0'),
        executionLog.indexOf('end:parallel-1'),
        executionLog.indexOf('end:parallel-2'),
      ];

      for (const idx of parallelEndIndices) {
        expect(endStartIndex).toBeGreaterThan(idx);
      }
    });

    it('should respect maxParallelism config', async () => {
      const testDAG = dag('parallelism-test')
        .config({ maxParallelism: 2 })
        .skillNode('a', 'skill').done()
        .skillNode('b', 'skill').done()
        .skillNode('c', 'skill').done()
        .skillNode('d', 'skill').done()
        .build();

      let currentRunning = 0;
      let maxRunning = 0;

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          currentRunning++;
          maxRunning = Math.max(maxRunning, currentRunning);
          await new Promise(resolve => setTimeout(resolve, 50));
          currentRunning--;
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(maxRunning).toBeLessThanOrEqual(2);
    });
  });

  // ===========================================================================
  // Retry Logic Tests
  // ===========================================================================

  describe('retry logic', () => {
    it('should retry failed nodes up to maxAttempts', async () => {
      const testDAG = dag('retry-test')
        .skillNode('flaky-node', 'skill')
          .retryTimes(3, 10)
          .done()
        .build();

      let attempts = 0;
      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          attempts++;
          if (attempts < 3) {
            const error: TaskError = {
              code: 'MODEL_ERROR',
              message: 'Transient error',
              retryable: true,
            };
            throw error;
          }
          return { output: { succeeded: true }, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      const testDAG = dag('no-retry-test')
        .skillNode('fail-node', 'skill')
          .retryTimes(5, 10)
          .done()
        .build();

      let attempts = 0;
      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          attempts++;
          const error: TaskError = {
            code: 'PERMISSION_DENIED',
            message: 'Not allowed',
            retryable: false,
          };
          throw error;
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);
      expect(attempts).toBe(1); // Should not retry
    });

    it('should apply exponential backoff between retries', async () => {
      const testDAG = dag('backoff-test')
        .skillNode('slow-retry', 'skill')
          .retry({
            maxAttempts: 3,
            baseDelayMs: 50,
            maxDelayMs: 1000,
            backoffMultiplier: 2,
            retryableErrors: ['TIMEOUT'],
            nonRetryableErrors: [],
          })
          .done()
        .build();

      const attemptTimes: number[] = [];
      let attempts = 0;

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          attemptTimes.push(Date.now());
          attempts++;
          if (attempts < 3) {
            const error: TaskError = {
              code: 'TIMEOUT',
              message: 'Timed out',
              retryable: true,
            };
            throw error;
          }
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      await executeDAG(testDAG, { executors: [executor] });

      // First retry delay should be ~50ms, second ~100ms
      if (attemptTimes.length >= 2) {
        const firstDelay = attemptTimes[1] - attemptTimes[0];
        expect(firstDelay).toBeGreaterThanOrEqual(40); // Some tolerance
      }
      if (attemptTimes.length >= 3) {
        const secondDelay = attemptTimes[2] - attemptTimes[1];
        expect(secondDelay).toBeGreaterThanOrEqual(80);
      }
    });
  });

  // ===========================================================================
  // Timeout Tests
  // ===========================================================================

  describe('timeout handling', () => {
    it('should timeout individual nodes', async () => {
      const testDAG = dag('node-timeout-test')
        .skillNode('slow-node', 'skill')
          .timeout(100) // 100ms timeout
          .done()
        .build();

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          // This will take longer than the timeout
          await new Promise(resolve => setTimeout(resolve, 500));
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === 'TIMEOUT')).toBe(true);
    });

    it('should timeout entire DAG execution', async () => {
      const testDAG = dag('dag-timeout-test')
        .timeout(150) // 150ms total timeout
        .skillNode('node-1', 'skill').done()
        .skillNode('node-2', 'skill').dependsOn('node-1').done()
        .skillNode('node-3', 'skill').dependsOn('node-2').done()
        .build();

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === 'TIMEOUT')).toBe(true);
    });
  });

  // ===========================================================================
  // Cancellation Tests
  // ===========================================================================

  describe('cancellation', () => {
    it('should cancel execution when abort signal is triggered', async () => {
      const testDAG = dag('cancel-test')
        .skillNode('node-1', 'skill').done()
        .skillNode('node-2', 'skill').dependsOn('node-1').done()
        .skillNode('node-3', 'skill').dependsOn('node-2').done()
        .build();

      const abortController = new AbortController();
      let nodesExecuted = 0;

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          nodesExecuted++;
          if (nodesExecuted === 2) {
            // Cancel after second node starts
            abortController.abort();
          }
          await new Promise(resolve => setTimeout(resolve, 50));
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, {
        executors: [executor],
        abortSignal: abortController.signal,
      });

      expect(result.success).toBe(false);
      expect(nodesExecuted).toBeLessThan(3);
    });

    it('should respect abort signal passed to node context', async () => {
      const testDAG = dag('abort-context-test')
        .skillNode('test-node', 'skill').done()
        .build();

      const abortController = new AbortController();
      let receivedSignal: AbortSignal | undefined;

      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          receivedSignal = context.abortSignal;
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      await executeDAG(testDAG, {
        executors: [executor],
        abortSignal: abortController.signal,
      });

      expect(receivedSignal).toBeDefined();
    });

    it('should support cancel() method on executor instance', async () => {
      const testDAG = dag('cancel-method-test')
        .skillNode('node-1', 'skill').done()
        .skillNode('node-2', 'skill').dependsOn('node-1').done()
        .build();

      let nodeStarted = false;
      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          if (context.node.id === 'node-1') {
            nodeStarted = true;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const dagExecutor = new DAGExecutor(testDAG, { executors: [executor] });

      // Start execution and cancel after short delay
      const executePromise = dagExecutor.execute();
      await new Promise(resolve => setTimeout(resolve, 30));
      dagExecutor.cancel();

      const result = await executePromise;

      expect(nodeStarted).toBe(true);
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should mark dependent nodes as skipped when dependency fails', async () => {
      const testDAG = dag('skip-test')
        .skillNode('failing', 'skill').done()
        .skillNode('dependent', 'skill').dependsOn('failing').done()
        .build();

      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          if (context.node.id === 'failing') {
            throw { code: 'MODEL_ERROR', message: 'Oops', retryable: false } as TaskError;
          }
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);

      // Check that dependent node was not executed
      const dependentState = result.snapshot.nodeStates.get('dependent' as NodeId);
      expect(dependentState?.status).toBe('skipped');
    });

    it('should fail fast when failFast is enabled', async () => {
      const testDAG = dag('fail-fast-test')
        .failFast(true)
        .skillNode('a', 'skill').done()
        .skillNode('b', 'skill').done() // Independent, runs in parallel
        .skillNode('c', 'skill').done()
        .build();

      let nodesStarted = 0;

      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          nodesStarted++;
          if (context.node.id === 'a') {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw { code: 'MODEL_ERROR', message: 'Fail fast', retryable: false } as TaskError;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);
      // With fail fast, execution should stop quickly
      expect(result.totalTimeMs).toBeLessThan(200);
    });

    it('should collect all errors in the result', async () => {
      const testDAG = dag('multi-error-test')
        .failFast(false)
        .skillNode('fail-1', 'skill').done()
        .skillNode('fail-2', 'skill').done()
        .build();

      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          throw {
            code: 'MODEL_ERROR',
            message: `Error from ${context.node.id}`,
            retryable: false,
          } as TaskError;
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle missing executor for node type', async () => {
      const testDAG = dag('missing-executor-test')
        .mcpNode('mcp-node', 'server', 'tool')
        .done()
        .build();

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          return { output: {}, confidence: 1.0 };
        },
        canExecute: (node) => node.type === 'skill', // Only handles skill nodes
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.message.includes('No executor found'))).toBe(true);
    });
  });

  // ===========================================================================
  // Token Usage Tests
  // ===========================================================================

  describe('token tracking', () => {
    it('should aggregate token usage across all nodes', async () => {
      const testDAG = dag('token-test')
        .skillNode('a', 'skill').done()
        .skillNode('b', 'skill').dependsOn('a').done()
        .build();

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          return {
            output: {},
            confidence: 1.0,
            tokenUsage: { inputTokens: 100, outputTokens: 50 },
          };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(result.totalTokenUsage.inputTokens).toBe(200);
      expect(result.totalTokenUsage.outputTokens).toBe(100);
    });
  });

  // ===========================================================================
  // Progress Callback Tests
  // ===========================================================================

  describe('progress reporting', () => {
    it('should call onProgress callback after each wave', async () => {
      const testDAG = linearDag('progress-test', 'skill-1', 'skill-2', 'skill-3');

      const progressSnapshots: { currentWave: number; status: string }[] = [];
      const executor = createMockExecutor();

      await executeDAG(testDAG, {
        executors: [executor],
        onProgress: (snapshot) => {
          progressSnapshots.push({
            currentWave: snapshot.currentWave,
            status: snapshot.status,
          });
        },
      });

      // Should have progress updates for each completed wave
      expect(progressSnapshots.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Snapshot Tests
  // ===========================================================================

  describe('execution snapshot', () => {
    it('should return final snapshot with all node states', async () => {
      const testDAG = createSimpleDAG();
      const executor = createMockExecutor();

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.snapshot.nodeStates.size).toBe(2);
      expect(result.snapshot.nodeOutputs.size).toBe(2);
      expect(result.snapshot.status).toBe('completed');
    });

    it('should provide execution ID', async () => {
      const testDAG = createSimpleDAG();
      const executor = createMockExecutor();

      const dagExecutor = new DAGExecutor(testDAG, { executors: [executor] });
      const executionId = dagExecutor.getExecutionId();

      expect(executionId).toBeDefined();
      expect(typeof executionId).toBe('string');
    });

    it('should expose getSnapshot() during execution', async () => {
      const testDAG = linearDag('snapshot-during-exec', 'skill-1', 'skill-2');

      let midExecutionSnapshot: ReturnType<DAGExecutor['getSnapshot']> | undefined;

      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          if (context.node.id === 'node-0') {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      const dagExecutor = new DAGExecutor(testDAG, { executors: [executor] });

      // Start execution and check snapshot mid-way
      const executePromise = dagExecutor.execute();
      await new Promise(resolve => setTimeout(resolve, 25));
      midExecutionSnapshot = dagExecutor.getSnapshot();

      await executePromise;

      expect(midExecutionSnapshot).toBeDefined();
      expect(midExecutionSnapshot.status).toBe('running');
    });
  });

  // ===========================================================================
  // NoOpExecutor Tests
  // ===========================================================================

  describe('NoOpExecutor', () => {
    it('should execute any node type', () => {
      const executor = new NoOpExecutor();

      const skillNode = { type: 'skill' } as DAGNode;
      const agentNode = { type: 'agent' } as DAGNode;
      const mcpNode = { type: 'mcp-tool' } as DAGNode;

      expect(executor.canExecute(skillNode)).toBe(true);
      expect(executor.canExecute(agentNode)).toBe(true);
      expect(executor.canExecute(mcpNode)).toBe(true);
    });

    it('should return result with node metadata', async () => {
      const executor = new NoOpExecutor();

      const context: NodeExecutionContext = {
        dag: {} as DAG,
        node: {
          id: 'test-node' as NodeId,
          name: 'Test Node',
          type: 'skill',
          dependencies: [],
          state: { status: 'running', startedAt: new Date(), attempt: 1 },
          config: { timeoutMs: 1000, maxRetries: 0, retryDelayMs: 0, exponentialBackoff: false },
        },
        executionId: 'exec-123' as any,
        dependencyOutputs: new Map(),
        dagInput: {},
      };

      const result = await executor.execute(context);

      expect(result.output).toHaveProperty('nodeId', 'test-node');
      expect(result.output).toHaveProperty('nodeName', 'Test Node');
      expect(result.output).toHaveProperty('executed', true);
      expect(result.confidence).toBe(1.0);
    });
  });

  // ===========================================================================
  // executeDAG Convenience Function Tests
  // ===========================================================================

  describe('executeDAG convenience function', () => {
    it('should use NoOpExecutor by default', async () => {
      const testDAG = createSimpleDAG();

      const result = await executeDAG(testDAG);

      expect(result.success).toBe(true);
    });

    it('should accept partial options', async () => {
      const testDAG = createSimpleDAG();

      const result = await executeDAG(testDAG, {
        input: { topic: 'test' },
      });

      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle empty input DAG gracefully', async () => {
      // DAGBuilder requires at least one node, so we test with a minimal DAG
      const testDAG = dag('minimal')
        .skillNode('only', 'skill')
        .done()
        .build();

      const result = await executeDAG(testDAG);
      expect(result.success).toBe(true);
    });

    it('should handle DAG input being passed to nodes', async () => {
      const testDAG = createSimpleDAG();
      let receivedInput: unknown;

      const executor: NodeExecutor = {
        async execute(context: NodeExecutionContext): Promise<TaskResult> {
          receivedInput = context.dagInput;
          return { output: {}, confidence: 1.0 };
        },
        canExecute: () => true,
      };

      await executeDAG(testDAG, {
        executors: [executor],
        input: { topic: 'AI safety', depth: 'comprehensive' },
      });

      expect(receivedInput).toEqual({ topic: 'AI safety', depth: 'comprehensive' });
    });

    it('should handle output path extraction', async () => {
      const testDAG = dag('path-extraction-test')
        .skillNode('producer', 'skill')
        .done()
        .output({
          name: 'nested',
          sourceNodeId: 'producer' as NodeId,
          outputPath: 'data.nested.value',
        })
        .build();

      const executor: NodeExecutor = {
        async execute(): Promise<TaskResult> {
          return {
            output: {
              data: {
                nested: {
                  value: 'extracted!',
                },
              },
            },
            confidence: 1.0,
          };
        },
        canExecute: () => true,
      };

      const result = await executeDAG(testDAG, { executors: [executor] });

      expect(result.success).toBe(true);
      expect(result.outputs.get('nested')).toBe('extracted!');
    });
  });
});

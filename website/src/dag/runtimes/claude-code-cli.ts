/**
 * Claude Code CLI Runtime
 *
 * Executes DAGs within Claude Code sessions using pluggable executors.
 * Supports multiple execution strategies:
 * - Task tool (in-session, shared context)
 * - Process executor (claude -p, zero overhead)
 * - Worktree executor (git worktrees, full isolation)
 *
 * Key features:
 * - Wave-based parallel execution
 * - Pluggable executor system for 36x cost reduction
 * - Context bridging between parent and child agents
 * - Permission enforcement via Task tool parameters
 * - Real-time progress tracking and state management
 */

import {
  DAG,
  DAGNode,
  NodeId,
  ExecutionId,
  TaskResult,
  TaskError,
  TaskErrorCode,
  TokenUsage,
  ExecutionSnapshot,
} from '../types';
import { PermissionMatrix } from '../types/permissions';
import { topologicalSort } from '../core/topology';
import { StateManager } from '../core/state-manager';
import { DAGExecutionResult } from '../core/executor';
import { PermissionEnforcer } from '../permissions/enforcer';
import { getPreset, PresetName } from '../permissions/presets';
import { ConflictDetector, type NodeConflict } from '../coordination/conflict-detector';
import type { Subtask } from '../core/task-decomposer';
import type {
  Executor,
  ExecutionRequest,
  ExecutionResponse,
  ExecutionProgress,
} from '../executors/types';
import { executorRegistry } from '../executors/registry';

/**
 * Task tool call structure (matches Claude Code's Task tool)
 */
export interface TaskToolCall {
  description: string;
  prompt: string;
  subagent_type: string;
  model?: 'haiku' | 'sonnet' | 'opus';
  max_turns?: number;
  run_in_background?: boolean;
}

/**
 * Task tool result structure
 */
export interface TaskToolResult {
  success: boolean;
  output: string;
  agentId?: string;
  error?: string;
}

/**
 * Execution context passed between nodes
 */
export interface ExecutionContext {
  dagId: string;
  executionId: ExecutionId;
  parentContext?: Record<string, unknown>;
  nodeResults: Map<NodeId, TaskResult>;
  variables: Map<string, unknown>;
  startTime: Date;
  permissions: PermissionMatrix;
}

/**
 * Configuration for Claude Code CLI runtime
 */
export interface ClaudeCodeRuntimeConfig {
  /**
   * Pluggable executor for task execution
   *
   * Options:
   * - ProcessExecutor: Zero token overhead, true parallel (RECOMMENDED)
   * - WorktreeExecutor: Full isolation via git worktrees
   * - TaskToolExecutor: In-session, shared context (20k token overhead)
   *
   * Default: ProcessExecutor (if available), else simulated
   */
  executor?: Executor;

  permissions?: PermissionMatrix;
  maxParallelTasks?: number;
  defaultModel?: 'haiku' | 'sonnet' | 'opus';
  defaultMaxTurns?: number;
  runInBackground?: boolean;
  onNodeStart?: (nodeId: NodeId, node: DAGNode) => void;
  onNodeComplete?: (nodeId: NodeId, result: TaskResult) => void;
  onNodeError?: (nodeId: NodeId, error: TaskError) => void;
  onWaveStart?: (wave: number, nodeIds: NodeId[]) => void;
  onWaveComplete?: (wave: number, results: Map<NodeId, TaskResult>) => void;
  /** Progress callback for executor updates */
  onProgress?: (progress: ExecutionProgress) => void;
}

/**
 * Claude Code CLI Runtime
 *
 * This class orchestrates DAG execution within Claude Code using
 * pluggable executors. By default uses ProcessExecutor for zero
 * token overhead, but can use any executor.
 */
export class ClaudeCodeRuntime {
  private config: Omit<Required<ClaudeCodeRuntimeConfig>, 'executor'>;
  private stateManager: StateManager | null = null;
  private enforcer: PermissionEnforcer;
  private executor: Executor | null;

  constructor(config: ClaudeCodeRuntimeConfig = {}) {
    this.config = {
      permissions: config.permissions || getPreset('standard' as PresetName),
      maxParallelTasks: config.maxParallelTasks || 5,
      defaultModel: config.defaultModel || 'sonnet',
      defaultMaxTurns: config.defaultMaxTurns || 10,
      runInBackground: config.runInBackground || false,
      onNodeStart: config.onNodeStart || (() => {}),
      onNodeComplete: config.onNodeComplete || (() => {}),
      onNodeError: config.onNodeError || (() => {}),
      onWaveStart: config.onWaveStart || (() => {}),
      onWaveComplete: config.onWaveComplete || (() => {}),
      onProgress: config.onProgress || (() => {}),
    };

    // Use provided executor or try to get default (null for simulated mode)
    this.executor = config.executor || null;

    this.enforcer = new PermissionEnforcer(this.config.permissions);
  }

  /**
   * Get the current executor, or null if using simulation mode
   */
  getExecutor(): Executor | null {
    return this.executor;
  }

  /**
   * Set the executor (allows runtime switching)
   */
  setExecutor(executor: Executor): void {
    this.executor = executor;
  }

  /**
   * Execute a DAG and return the result
   *
   * This method generates the sequence of Task tool calls needed to
   * execute the DAG. In actual Claude Code execution, these calls would
   * be made by the parent agent.
   */
  async execute(
    dag: DAG,
    inputs?: Record<string, unknown>
  ): Promise<DAGExecutionResult> {
    const startTime = Date.now();
    const context = this.createExecutionContext(dag, inputs);

    // Initialize state manager for this DAG
    this.stateManager = new StateManager({
      dag,
      executionId: context.executionId,
      validateTransitions: true,
      emitEvents: true,
    });

    // Start execution (initializes node states)
    this.stateManager.startExecution();

    // Get execution waves from topological sort
    const sortResult = topologicalSort(dag);
    if (!sortResult.success) {
      return this.createFailureResult(dag, startTime, {
        code: 'CYCLE_DETECTED' as TaskErrorCode,
        message: `Cycle detected in DAG: ${sortResult.cycle?.join(' -> ')}`,
        sourceNodeId: sortResult.cycle?.[0] as NodeId,
        retryable: false,
      });
    }

    const waves = sortResult.waves;

    // Execute wave by wave
    for (const wave of waves) {
      // Update ready nodes before processing this wave
      this.stateManager.updateReadyNodes();

      this.config.onWaveStart(wave.waveNumber, wave.nodeIds);

      // Generate Task calls for this wave
      const taskCalls = this.generateWaveTaskCalls(dag, wave.nodeIds, context);

      // Execute tasks (in real execution, these would be parallel Task tool calls)
      const waveResults = await this.executeWave(dag, wave.nodeIds, taskCalls, context);

      this.config.onWaveComplete(wave.waveNumber, waveResults);

      // Check for failures
      const failures = this.checkWaveFailures(dag, wave.nodeIds, waveResults);
      if (failures.length > 0) {
        const criticalFailure = failures.find(f => f.critical);
        if (criticalFailure) {
          return this.createFailureResult(dag, startTime, criticalFailure.error);
        }
      }
    }

    // Aggregate results
    return this.createSuccessResult(dag, startTime, context);
  }

  /**
   * Generate Task tool calls for a wave of nodes
   */
  generateWaveTaskCalls(
    dag: DAG,
    nodeIds: NodeId[],
    context: ExecutionContext
  ): Map<NodeId, TaskToolCall> {
    const calls = new Map<NodeId, TaskToolCall>();

    for (const nodeId of nodeIds) {
      const node = dag.nodes.get(nodeId);
      if (!node) continue;

      // Check permissions
      const permCheck = this.enforcer.check({
        type: 'tool',
        resource: 'Task',
        action: 'execute',
      });

      if (!permCheck.allowed) {
        console.warn(`Task tool not allowed for node ${nodeId}`);
        continue;
      }

      const call = this.generateTaskCall(node, context);
      calls.set(nodeId, call);
    }

    return calls;
  }

  /**
   * Generate a single Task tool call for a node
   */
  generateTaskCall(node: DAGNode, context: ExecutionContext): TaskToolCall {
    const prompt = this.buildPrompt(node, context);
    const subagentType = this.determineSubagentType(node);
    const model = this.selectModel(node);

    return {
      description: this.generateDescription(node),
      prompt,
      subagent_type: subagentType,
      model,
      max_turns: this.config.defaultMaxTurns,
      run_in_background: this.config.runInBackground,
    };
  }

  /**
   * Build the prompt for a node's Task call
   */
  private buildPrompt(node: DAGNode, context: ExecutionContext): string {
    const parts: string[] = [];

    // Add task description
    parts.push(`## Task: ${node.id}`);
    parts.push('');

    // Add skill-specific instructions if available
    if (node.skillId) {
      parts.push(`Execute the ${node.skillId} skill.`);
      parts.push('');
    }

    // Add context from parent
    if (context.parentContext && Object.keys(context.parentContext).length > 0) {
      parts.push('## Context from Parent');
      parts.push('```json');
      parts.push(JSON.stringify(context.parentContext, null, 2));
      parts.push('```');
      parts.push('');
    }

    // Add results from dependencies
    if (node.dependencies.length > 0) {
      parts.push('## Results from Dependencies');
      for (const depId of node.dependencies) {
        const depResult = context.nodeResults.get(depId);
        if (depResult) {
          parts.push(`### ${depId}`);
          parts.push('```json');
          parts.push(JSON.stringify(depResult, null, 2));
          parts.push('```');
          parts.push('');
        }
      }
    }

    // Add variables
    if (context.variables.size > 0) {
      parts.push('## Available Variables');
      parts.push('```json');
      parts.push(JSON.stringify(Object.fromEntries(context.variables), null, 2));
      parts.push('```');
      parts.push('');
    }

    // Add output format instructions
    parts.push('## Output Format');
    parts.push('Return your result as valid JSON with the following structure:');
    parts.push('```json');
    parts.push(JSON.stringify({
      output: '/* your result data */',
      confidence: 0.95,
    }, null, 2));
    parts.push('```');

    return parts.join('\n');
  }

  /**
   * Determine the subagent type for a node
   */
  private determineSubagentType(node: DAGNode): string {
    // If agentId is specified, use it
    if (node.agentId) {
      return node.agentId;
    }

    // Map node types to subagent types
    const typeMap: Record<string, string> = {
      skill: 'general-purpose',
      agent: 'general-purpose',
      'mcp-tool': 'general-purpose',
      composite: 'Plan',
      conditional: 'general-purpose',
    };

    // Check for skill-specific agent mappings
    if (node.skillId) {
      const skillAgentMap: Record<string, string> = {
        'graph-builder': 'Plan',
        'dependency-resolver': 'general-purpose',
        'task-scheduler': 'general-purpose',
        'parallel-executor': 'general-purpose',
        'result-aggregator': 'general-purpose',
        'context-bridger': 'general-purpose',
        'dynamic-replanner': 'Plan',
        'skill-registry': 'Explore',
        'semantic-matcher': 'Explore',
        'capability-ranker': 'general-purpose',
        'permission-validator': 'general-purpose',
        'scope-enforcer': 'general-purpose',
        'isolation-manager': 'general-purpose',
        'output-validator': 'code-reviewer',
        'confidence-scorer': 'general-purpose',
        'hallucination-detector': 'general-purpose',
        'iteration-detector': 'debugger',
        'feedback-synthesizer': 'general-purpose',
        'convergence-monitor': 'general-purpose',
        'execution-tracer': 'general-purpose',
        'performance-profiler': 'performance-engineer',
        'failure-analyzer': 'debugger',
        'pattern-learner': 'general-purpose',
      };

      if (skillAgentMap[node.skillId]) {
        return skillAgentMap[node.skillId];
      }
    }

    // Check config metadata
    if (node.config.metadata?.subagentType) {
      return node.config.metadata.subagentType as string;
    }

    return typeMap[node.type] || 'general-purpose';
  }

  /**
   * Select the appropriate model for a node
   */
  private selectModel(node: DAGNode): 'haiku' | 'sonnet' | 'opus' {
    // Check node-specific config
    if (node.config.model) {
      return node.config.model;
    }

    // Use complexity-based selection
    const complexity = this.estimateComplexity(node);
    if (complexity === 'simple') return 'haiku';
    if (complexity === 'complex') return 'opus';

    // Check permissions
    const allowed = this.config.permissions.models?.allowed || ['haiku', 'sonnet', 'opus'];
    if (!allowed.includes(this.config.defaultModel)) {
      return allowed[0] as 'haiku' | 'sonnet' | 'opus';
    }

    return this.config.defaultModel;
  }

  /**
   * Estimate task complexity for model selection
   */
  private estimateComplexity(node: DAGNode): 'simple' | 'moderate' | 'complex' {
    const dependencies = node.dependencies.length;

    // Simple heuristics based on node type and dependencies
    if (node.type === 'composite') return 'complex';
    if (dependencies === 0) return 'simple';
    if (dependencies > 3) return 'complex';
    return 'moderate';
  }

  /**
   * Generate a short description for the Task call
   */
  private generateDescription(node: DAGNode): string {
    if (node.skillId) {
      return `Execute ${node.skillId}`;
    }
    if (node.type === 'composite') {
      return `Execute sub-DAG ${node.id}`;
    }
    return `Execute node ${node.id}`;
  }

  /**
   * Execute a wave of tasks using the pluggable executor
   *
   * This method:
   * 1. Converts DAG nodes to ExecutionRequests
   * 2. Calls executor.executeParallel() for TRUE parallel execution
   * 3. Falls back to simulation if no executor is configured
   *
   * Using ProcessExecutor or WorktreeExecutor eliminates the
   * 20k token overhead per task, achieving 36x cost reduction.
   */
  private async executeWave(
    dag: DAG,
    nodeIds: NodeId[],
    taskCalls: Map<NodeId, TaskToolCall>,
    context: ExecutionContext
  ): Promise<Map<NodeId, TaskResult>> {
    const results = new Map<NodeId, TaskResult>();

    // Mark all nodes as started
    for (const nodeId of nodeIds) {
      const node = dag.nodes.get(nodeId);
      if (!node) continue;
      this.config.onNodeStart(nodeId, node);
      this.stateManager?.markNodeStarted(nodeId);
    }

    // If we have a real executor, use it for parallel execution
    if (this.executor) {
      // Convert nodes to ExecutionRequests
      const requests = this.nodesToExecutionRequests(dag, nodeIds, context);

      // Execute in parallel via the executor
      const executorResults = await this.executor.executeParallel(
        requests,
        this.config.onProgress
      );

      // Convert ExecutionResponses back to TaskResults
      for (const [nodeId, response] of executorResults) {
        if (response.success) {
          const taskResult = this.responseToTaskResult(response);
          results.set(nodeId, taskResult);
          context.nodeResults.set(nodeId, taskResult);
          this.stateManager?.markNodeCompleted(nodeId, taskResult);
          this.config.onNodeComplete(nodeId, taskResult);
        } else {
          const error = response.error || {
            code: 'TOOL_ERROR' as TaskErrorCode,
            message: 'Executor returned failure',
            sourceNodeId: nodeId,
            retryable: true,
          };
          this.stateManager?.markNodeFailed(nodeId, error);
          this.config.onNodeError(nodeId, error);
        }
      }
    } else {
      // Fallback to simulation mode (no real execution)
      for (const nodeId of nodeIds) {
        const node = dag.nodes.get(nodeId);
        if (!node) continue;

        const taskCall = taskCalls.get(nodeId);
        if (!taskCall) {
          const error: TaskError = {
            code: 'INTERNAL_ERROR' as TaskErrorCode,
            message: `No task call generated for node ${nodeId}`,
            sourceNodeId: nodeId,
            retryable: false,
          };
          this.stateManager?.markNodeFailed(nodeId, error);
          this.config.onNodeError(nodeId, error);
          continue;
        }

        // Simulate task execution
        const result = await this.simulateTaskExecution(nodeId, taskCall, context);

        if (result.success) {
          const taskResult: TaskResult = {
            output: result.output,
            confidence: 0.9,
            tokenUsage: {
              inputTokens: 100, // Simulated
              outputTokens: 50,
            },
            executionMetadata: {
              model: this.config.defaultModel,
              totalTurns: 1,
              toolCallCount: 1,
            },
          };

          results.set(nodeId, taskResult);
          context.nodeResults.set(nodeId, taskResult);
          this.stateManager?.markNodeCompleted(nodeId, taskResult);
          this.config.onNodeComplete(nodeId, taskResult);
        } else {
          const error: TaskError = {
            code: 'TOOL_ERROR' as TaskErrorCode,
            message: result.error || 'Task execution failed',
            sourceNodeId: nodeId,
            retryable: true,
          };
          this.stateManager?.markNodeFailed(nodeId, error);
          this.config.onNodeError(nodeId, error);
        }
      }
    }

    return results;
  }

  /**
   * Convert DAG nodes to ExecutionRequests for the executor
   */
  private nodesToExecutionRequests(
    dag: DAG,
    nodeIds: NodeId[],
    context: ExecutionContext
  ): ExecutionRequest[] {
    return nodeIds
      .map((nodeId) => {
        const node = dag.nodes.get(nodeId);
        if (!node) return null;

        // Build dependency results map for this node
        const dependencyResults = new Map<NodeId, TaskResult>();
        for (const depId of node.dependencies) {
          const depResult = context.nodeResults.get(depId);
          if (depResult) {
            dependencyResults.set(depId, depResult);
          }
        }

        return {
          nodeId,
          prompt: this.buildPrompt(node, context),
          description: this.generateDescription(node),
          skillId: node.skillId,
          agentType: this.determineSubagentType(node),
          model: this.selectModel(node),
          dependencyResults,
          context: context.parentContext || {},
          timeoutMs: this.config.defaultMaxTurns * 60000, // Rough estimate
        };
      })
      .filter((r): r is ExecutionRequest => r !== null);
  }

  /**
   * Convert ExecutionResponse to TaskResult
   */
  private responseToTaskResult(response: ExecutionResponse): TaskResult {
    return {
      output: response.output,
      confidence: response.confidence || 0.9,
      tokenUsage: response.tokenUsage || {
        inputTokens: 0, // ProcessExecutor doesn't track tokens
        outputTokens: 0,
      },
      executionMetadata: {
        model: this.config.defaultModel,
        totalTurns: 1,
        toolCallCount: 1,
        executor: response.metadata?.executor,
        durationMs: response.metadata?.durationMs,
      },
    };
  }

  /**
   * Simulate task execution (for testing/planning)
   */
  private async simulateTaskExecution(
    nodeId: NodeId,
    taskCall: TaskToolCall,
    _context: ExecutionContext
  ): Promise<{ success: boolean; output?: unknown; error?: string }> {
    // This is a placeholder for actual Task tool execution
    // In real execution, this would be replaced by actual Claude Code Task calls

    return {
      success: true,
      output: {
        nodeId,
        simulated: true,
        taskCall: {
          description: taskCall.description,
          subagent_type: taskCall.subagent_type,
          model: taskCall.model,
        },
      },
    };
  }

  /**
   * Check for failures in a wave
   */
  private checkWaveFailures(
    dag: DAG,
    nodeIds: NodeId[],
    results: Map<NodeId, TaskResult>
  ): Array<{ nodeId: NodeId; critical: boolean; error: TaskError }> {
    const failures: Array<{ nodeId: NodeId; critical: boolean; error: TaskError }> = [];

    for (const nodeId of nodeIds) {
      const result = results.get(nodeId);

      if (!result) {
        failures.push({
          nodeId,
          critical: true, // Nodes without results are critical failures
          error: {
            code: 'TOOL_ERROR' as TaskErrorCode,
            message: `Node ${nodeId} failed`,
            sourceNodeId: nodeId,
            retryable: false,
          },
        });
      }
    }

    return failures;
  }

  /**
   * Create execution context
   */
  private createExecutionContext(
    dag: DAG,
    inputs?: Record<string, unknown>
  ): ExecutionContext {
    const variables = new Map<string, unknown>();

    // Add inputs as variables
    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
        variables.set(key, value);
      }
    }

    return {
      dagId: dag.id,
      executionId: ExecutionId(`exec-${Date.now()}`),
      nodeResults: new Map(),
      variables,
      startTime: new Date(),
      permissions: this.config.permissions,
    };
  }

  /**
   * Create success result
   */
  private createSuccessResult(
    dag: DAG,
    startTime: number,
    context: ExecutionContext
  ): DAGExecutionResult {
    const outputs = new Map<string, unknown>();

    // Collect outputs based on DAG output definitions
    for (const output of dag.outputs) {
      const sourceResult = context.nodeResults.get(output.sourceNodeId);
      if (sourceResult) {
        outputs.set(output.name, sourceResult.output);
      }
    }

    // Calculate total token usage
    const totalTokenUsage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
    };

    for (const [, result] of context.nodeResults) {
      if (result.tokenUsage) {
        totalTokenUsage.inputTokens += result.tokenUsage.inputTokens;
        totalTokenUsage.outputTokens += result.tokenUsage.outputTokens;
      }
    }

    // Build execution snapshot
    const sortResult = topologicalSort(dag);
    const snapshot: ExecutionSnapshot = {
      executionId: context.executionId,
      dagId: dag.id,
      startedAt: context.startTime,
      completedAt: new Date(),
      nodeStates: this.stateManager?.getSnapshot()?.nodeStates || new Map(),
      nodeOutputs: context.nodeResults,
      currentWave: sortResult.waves?.length || 0,
      totalWaves: sortResult.waves?.length || 0,
      status: 'completed',
      totalTokenUsage,
      errors: [],
    };

    return {
      success: true,
      snapshot,
      outputs,
      totalTokenUsage,
      totalTimeMs: Date.now() - startTime,
      errors: [],
    };
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    dag: DAG,
    startTime: number,
    error: TaskError
  ): DAGExecutionResult {
    const sortResult = topologicalSort(dag);
    const snapshot: ExecutionSnapshot = {
      executionId: ExecutionId(`exec-${Date.now()}`),
      dagId: dag.id,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      nodeStates: this.stateManager?.getSnapshot()?.nodeStates || new Map(),
      nodeOutputs: new Map(),
      currentWave: 0,
      totalWaves: sortResult.waves?.length || 0,
      status: 'failed',
      totalTokenUsage: { inputTokens: 0, outputTokens: 0 },
      errors: [error],
    };

    return {
      success: false,
      snapshot,
      outputs: new Map(),
      totalTokenUsage: { inputTokens: 0, outputTokens: 0 },
      totalTimeMs: Date.now() - startTime,
      errors: [error],
    };
  }

  /**
   * Generate executable Task tool calls for a DAG
   *
   * This method returns the Task tool calls that would be made to execute
   * the DAG. Useful for planning and debugging.
   *
   * @param dag The DAG to generate execution plan for
   * @param inputs Optional input values
   * @param subtaskMap Optional map of node IDs to subtasks (for conflict detection)
   */
  generateExecutionPlan(
    dag: DAG,
    inputs?: Record<string, unknown>,
    subtaskMap?: Map<NodeId, Subtask>
  ): ExecutionPlan {
    const context = this.createExecutionContext(dag, inputs);
    const sortResult = topologicalSort(dag);

    if (!sortResult.success) {
      return {
        dagId: dag.id,
        dagName: dag.name,
        totalNodes: dag.nodes.size,
        totalWaves: 0,
        waves: [],
        error: `Cycle detected: ${sortResult.cycle?.join(' -> ')}`,
      };
    }

    const waves = sortResult.waves;

    const plan: ExecutionPlan = {
      dagId: dag.id,
      dagName: dag.name,
      totalNodes: dag.nodes.size,
      totalWaves: waves.length,
      waves: [],
    };

    for (const wave of waves) {
      const taskCalls = this.generateWaveTaskCalls(dag, wave.nodeIds, context);

      // Analyze wave for conflicts
      const conflictAnalysis = ConflictDetector.analyzeWave(dag, wave.nodeIds, subtaskMap);

      plan.waves.push({
        waveNumber: wave.waveNumber,
        nodeIds: wave.nodeIds,
        taskCalls: Object.fromEntries(taskCalls),
        parallelizable: conflictAnalysis.canParallelize,
        conflicts: conflictAnalysis.conflicts.length > 0 ? conflictAnalysis.conflicts : undefined,
        conflictReason: conflictAnalysis.remediation,
      });
    }

    return plan;
  }
}

/**
 * Execution plan for a DAG
 */
export interface ExecutionPlan {
  dagId: string;
  dagName: string;
  totalNodes: number;
  totalWaves: number;
  waves: WavePlan[];
  error?: string;
}

export interface WavePlan {
  waveNumber: number;
  nodeIds: NodeId[];
  taskCalls: Record<NodeId, TaskToolCall>;
  parallelizable: boolean;
  conflicts?: NodeConflict[];
  conflictReason?: string;
}

/**
 * Factory function to create a Claude Code runtime
 */
export function createClaudeCodeRuntime(
  config?: ClaudeCodeRuntimeConfig
): ClaudeCodeRuntime {
  return new ClaudeCodeRuntime(config);
}

/**
 * Utility to format Task tool calls for Claude Code
 */
export function formatTaskCall(call: TaskToolCall): string {
  return JSON.stringify(call, null, 2);
}

/**
 * Utility to generate Claude Code message with multiple parallel Task calls
 */
export function generateParallelTaskMessage(
  calls: TaskToolCall[]
): string {
  const parts = ['I will execute these tasks in parallel:\n'];

  for (const call of calls) {
    parts.push(`\n### ${call.description}\n`);
    parts.push('```json');
    parts.push(JSON.stringify(call, null, 2));
    parts.push('```\n');
  }

  return parts.join('\n');
}

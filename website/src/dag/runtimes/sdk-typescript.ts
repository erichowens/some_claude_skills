/**
 * SDK TypeScript Runtime
 *
 * Executes DAGs using the Anthropic SDK (@anthropic-ai/sdk) for direct
 * API calls to Claude. This runtime is ideal for CI/CD pipelines,
 * automated workflows, and programmatic integration.
 *
 * Key features:
 * - Direct API calls to Claude using @anthropic-ai/sdk
 * - Promise.all() for concurrent agent execution within waves
 * - Explicit message passing between API calls
 * - Tool definitions embedded in each request
 * - Real-time progress tracking and state management
 */

import type {
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
import { ExecutionId as createExecutionId } from '../types';
import { PermissionMatrix } from '../types/permissions';
import { topologicalSort } from '../core/topology';
import { StateManager } from '../core/state-manager';
import { DAGExecutionResult } from '../core/executor';
import { PermissionEnforcer } from '../permissions/enforcer';
import { getPreset, PresetName } from '../permissions/presets';

// =============================================================================
// Anthropic SDK Types (for type safety without requiring the actual package)
// =============================================================================

/**
 * Message content types from Anthropic SDK
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export type ContentBlock = TextBlock | ToolUseBlock;

/**
 * Message structure for Claude API
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

/**
 * Tool definition for Claude API
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * API response structure
 */
export interface APIResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// =============================================================================
// SDK Client Interface
// =============================================================================

/**
 * Interface for the Anthropic SDK client.
 * This allows for easy mocking in tests and flexibility in implementation.
 */
export interface AnthropicClient {
  messages: {
    create(params: CreateMessageParams): Promise<APIResponse>;
  };
}

/**
 * Parameters for creating a message
 */
export interface CreateMessageParams {
  model: string;
  max_tokens: number;
  system?: string;
  messages: Message[];
  tools?: ToolDefinition[];
  tool_choice?: { type: 'auto' | 'any' | 'tool'; name?: string };
}

// =============================================================================
// Execution Context
// =============================================================================

/**
 * Context for SDK execution
 */
export interface SDKExecutionContext {
  dagId: string;
  executionId: ExecutionId;
  parentContext?: Record<string, unknown>;
  nodeResults: Map<NodeId, TaskResult>;
  variables: Map<string, unknown>;
  startTime: Date;
  permissions: PermissionMatrix;
  conversationHistory: Map<NodeId, Message[]>;
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration for SDK TypeScript runtime
 */
export interface SDKRuntimeConfig {
  /** Anthropic API client (or mock for testing) */
  client?: AnthropicClient;
  /** API key for Anthropic (used if client not provided) */
  apiKey?: string;
  /** Permission matrix */
  permissions?: PermissionMatrix;
  /** Maximum parallel API calls */
  maxParallelCalls?: number;
  /** Default model */
  defaultModel?: 'claude-3-haiku-20240307' | 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514';
  /** Default max tokens per request */
  defaultMaxTokens?: number;
  /** System prompt template */
  systemPromptTemplate?: string;
  /** Tool definitions to include */
  tools?: ToolDefinition[];
  /** Callbacks */
  onNodeStart?: (nodeId: NodeId, node: DAGNode) => void;
  onNodeComplete?: (nodeId: NodeId, result: TaskResult) => void;
  onNodeError?: (nodeId: NodeId, error: TaskError) => void;
  onWaveStart?: (wave: number, nodeIds: NodeId[]) => void;
  onWaveComplete?: (wave: number, results: Map<NodeId, TaskResult>) => void;
  onAPICall?: (nodeId: NodeId, params: CreateMessageParams) => void;
  onAPIResponse?: (nodeId: NodeId, response: APIResponse) => void;
}

/**
 * Model ID mapping from simple names to full model IDs
 */
const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-3-haiku-20240307',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};

// =============================================================================
// SDK TypeScript Runtime
// =============================================================================

/**
 * SDK TypeScript Runtime
 *
 * This class orchestrates DAG execution using direct Anthropic API calls.
 * It's designed for programmatic use in TypeScript/JavaScript environments.
 */
export class SDKTypescriptRuntime {
  private config: Required<Omit<SDKRuntimeConfig, 'client' | 'apiKey'>> & {
    client: AnthropicClient | null;
    apiKey: string | null;
  };
  private stateManager: StateManager | null = null;
  private enforcer: PermissionEnforcer;

  constructor(config: SDKRuntimeConfig = {}) {
    this.config = {
      client: config.client || null,
      apiKey: config.apiKey || null,
      permissions: config.permissions || getPreset('standard' as PresetName),
      maxParallelCalls: config.maxParallelCalls || 5,
      defaultModel: config.defaultModel || 'claude-sonnet-4-20250514',
      defaultMaxTokens: config.defaultMaxTokens || 4096,
      systemPromptTemplate: config.systemPromptTemplate || this.getDefaultSystemPrompt(),
      tools: config.tools || [],
      onNodeStart: config.onNodeStart || (() => {}),
      onNodeComplete: config.onNodeComplete || (() => {}),
      onNodeError: config.onNodeError || (() => {}),
      onWaveStart: config.onWaveStart || (() => {}),
      onWaveComplete: config.onWaveComplete || (() => {}),
      onAPICall: config.onAPICall || (() => {}),
      onAPIResponse: config.onAPIResponse || (() => {}),
    };

    this.enforcer = new PermissionEnforcer(this.config.permissions);
  }

  /**
   * Execute a DAG and return the result
   */
  async execute(
    dag: DAG,
    inputs?: Record<string, unknown>
  ): Promise<DAGExecutionResult> {
    const startTime = Date.now();
    const context = this.createExecutionContext(dag, inputs);

    // Initialize state manager
    this.stateManager = new StateManager({
      dag,
      executionId: context.executionId,
      validateTransitions: true,
      emitEvents: true,
    });

    // Start execution
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
      // Update ready nodes before processing
      this.stateManager.updateReadyNodes();

      this.config.onWaveStart(wave.waveNumber, wave.nodeIds);

      // Execute wave with Promise.all for parallelism
      const waveResults = await this.executeWave(dag, wave.nodeIds, context);

      this.config.onWaveComplete(wave.waveNumber, waveResults);

      // Check for failures
      const failures = this.checkWaveFailures(wave.nodeIds, waveResults);
      if (failures.length > 0) {
        const criticalFailure = failures.find((f) => f.critical);
        if (criticalFailure) {
          return this.createFailureResult(dag, startTime, criticalFailure.error);
        }
      }
    }

    // Aggregate results
    return this.createSuccessResult(dag, startTime, context);
  }

  /**
   * Execute a wave of nodes using Promise.all
   */
  private async executeWave(
    dag: DAG,
    nodeIds: NodeId[],
    context: SDKExecutionContext
  ): Promise<Map<NodeId, TaskResult>> {
    const results = new Map<NodeId, TaskResult>();

    // Chunk nodes to respect maxParallelCalls
    const chunks = this.chunkArray(nodeIds, this.config.maxParallelCalls);

    for (const chunk of chunks) {
      // Execute chunk in parallel
      const promises = chunk.map((nodeId) =>
        this.executeNode(dag, nodeId, context)
      );

      const chunkResults = await Promise.allSettled(promises);

      // Process results
      chunkResults.forEach((result, index) => {
        const nodeId = chunk[index];
        if (result.status === 'fulfilled' && result.value) {
          results.set(nodeId, result.value);
          context.nodeResults.set(nodeId, result.value);
        }
      });
    }

    return results;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    dag: DAG,
    nodeId: NodeId,
    context: SDKExecutionContext
  ): Promise<TaskResult | null> {
    const node = dag.nodes.get(nodeId);
    if (!node) return null;

    this.config.onNodeStart(nodeId, node);
    this.stateManager?.markNodeStarted(nodeId);

    try {
      // Build the API request
      const messages = this.buildMessages(node, context);
      const systemPrompt = this.buildSystemPrompt(node, context);
      const model = this.selectModel(node);

      const params: CreateMessageParams = {
        model,
        max_tokens: node.config.maxTokens || this.config.defaultMaxTokens,
        system: systemPrompt,
        messages,
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
      };

      this.config.onAPICall(nodeId, params);

      // Make the API call
      const response = await this.callAPI(params);

      this.config.onAPIResponse(nodeId, response);

      // Parse the response
      const result = this.parseResponse(nodeId, response);

      // Store conversation for potential multi-turn
      context.conversationHistory.set(nodeId, [
        ...messages,
        { role: 'assistant', content: response.content },
      ]);

      this.stateManager?.markNodeCompleted(nodeId, result);
      this.config.onNodeComplete(nodeId, result);

      return result;
    } catch (error) {
      const taskError: TaskError = {
        code: 'MODEL_ERROR' as TaskErrorCode,
        message: error instanceof Error ? error.message : String(error),
        sourceNodeId: nodeId,
        retryable: true,
        cause: error,
      };

      this.stateManager?.markNodeFailed(nodeId, taskError);
      this.config.onNodeError(nodeId, taskError);

      return null;
    }
  }

  /**
   * Build messages array for the API call
   */
  private buildMessages(
    node: DAGNode,
    context: SDKExecutionContext
  ): Message[] {
    const messages: Message[] = [];
    const parts: string[] = [];

    // Add task description
    parts.push(`## Task: ${node.name || node.id}`);
    parts.push('');

    if (node.description) {
      parts.push(node.description);
      parts.push('');
    }

    // Add skill-specific instructions
    if (node.skillId) {
      parts.push(`Execute the "${node.skillId}" skill.`);
      parts.push('');
    }

    // Add context from parent
    if (context.parentContext && Object.keys(context.parentContext).length > 0) {
      parts.push('## Context');
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
          parts.push(JSON.stringify(depResult.output, null, 2));
          parts.push('```');
          parts.push('');
        }
      }
    }

    // Add available variables
    if (context.variables.size > 0) {
      parts.push('## Variables');
      parts.push('```json');
      parts.push(JSON.stringify(Object.fromEntries(context.variables), null, 2));
      parts.push('```');
      parts.push('');
    }

    // Add output instructions
    parts.push('## Output Format');
    parts.push('Return your response as valid JSON:');
    parts.push('```json');
    parts.push(
      JSON.stringify(
        {
          output: '/* your result data */',
          confidence: 0.95,
        },
        null,
        2
      )
    );
    parts.push('```');

    messages.push({
      role: 'user',
      content: parts.join('\n'),
    });

    return messages;
  }

  /**
   * Build system prompt for the API call
   */
  private buildSystemPrompt(
    node: DAGNode,
    context: SDKExecutionContext
  ): string {
    let prompt = this.config.systemPromptTemplate;

    // Replace placeholders
    prompt = prompt.replace('{{NODE_ID}}', node.id);
    prompt = prompt.replace('{{NODE_NAME}}', node.name);
    prompt = prompt.replace('{{DAG_ID}}', context.dagId);
    prompt = prompt.replace('{{SKILL_ID}}', node.skillId || 'general');

    return prompt;
  }

  /**
   * Select the appropriate model for a node
   */
  private selectModel(node: DAGNode): string {
    // Check node-specific config
    if (node.config.model) {
      return MODEL_MAP[node.config.model] || node.config.model;
    }

    // Check permissions
    const allowed = this.config.permissions.models?.allowed || ['haiku', 'sonnet', 'opus'];
    if (!allowed.some((m) => this.config.defaultModel.includes(m))) {
      const firstAllowed = allowed[0];
      return MODEL_MAP[firstAllowed] || this.config.defaultModel;
    }

    return this.config.defaultModel;
  }

  /**
   * Make the API call
   */
  private async callAPI(params: CreateMessageParams): Promise<APIResponse> {
    if (this.config.client) {
      return this.config.client.messages.create(params);
    }

    // If no client provided, simulate response for testing
    return this.simulateAPIResponse(params);
  }

  /**
   * Simulate API response (for testing without actual API calls)
   */
  private async simulateAPIResponse(
    params: CreateMessageParams
  ): Promise<APIResponse> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Extract task info from messages
    const userMessage = params.messages.find((m) => m.role === 'user');
    const content = typeof userMessage?.content === 'string'
      ? userMessage.content
      : '';

    // Generate simulated output
    const simulatedOutput = {
      output: {
        simulated: true,
        model: params.model,
        messageLength: content.length,
        timestamp: new Date().toISOString(),
      },
      confidence: 0.9,
    };

    return {
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: JSON.stringify(simulatedOutput, null, 2),
        },
      ],
      model: params.model,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: Math.floor(content.length / 4),
        output_tokens: Math.floor(JSON.stringify(simulatedOutput).length / 4),
      },
    };
  }

  /**
   * Parse API response into TaskResult
   */
  private parseResponse(nodeId: NodeId, response: APIResponse): TaskResult {
    // Extract text content
    const textBlock = response.content.find(
      (block): block is TextBlock => block.type === 'text'
    );

    let output: unknown = textBlock?.text || '';
    let confidence = 0.9;

    // Try to parse as JSON
    if (textBlock?.text) {
      try {
        const parsed = JSON.parse(textBlock.text);
        output = parsed.output !== undefined ? parsed.output : parsed;
        confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;
      } catch {
        // Keep as string if not valid JSON
        output = textBlock.text;
      }
    }

    return {
      output,
      confidence,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      executionMetadata: {
        model: response.model,
        totalTurns: 1,
        toolCallCount: response.content.filter(
          (c): c is ToolUseBlock => c.type === 'tool_use'
        ).length,
      },
    };
  }

  /**
   * Check for failures in a wave
   */
  private checkWaveFailures(
    nodeIds: NodeId[],
    results: Map<NodeId, TaskResult>
  ): Array<{ nodeId: NodeId; critical: boolean; error: TaskError }> {
    const failures: Array<{
      nodeId: NodeId;
      critical: boolean;
      error: TaskError;
    }> = [];

    for (const nodeId of nodeIds) {
      const result = results.get(nodeId);

      if (!result) {
        failures.push({
          nodeId,
          critical: true,
          error: {
            code: 'MODEL_ERROR' as TaskErrorCode,
            message: `Node ${nodeId} failed to execute`,
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
  ): SDKExecutionContext {
    const variables = new Map<string, unknown>();

    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
        variables.set(key, value);
      }
    }

    return {
      dagId: dag.id,
      executionId: createExecutionId(`sdk-exec-${Date.now()}`),
      nodeResults: new Map(),
      variables,
      startTime: new Date(),
      permissions: this.config.permissions,
      conversationHistory: new Map(),
    };
  }

  /**
   * Create success result
   */
  private createSuccessResult(
    dag: DAG,
    startTime: number,
    context: SDKExecutionContext
  ): DAGExecutionResult {
    const outputs = new Map<string, unknown>();

    for (const output of dag.outputs) {
      const sourceResult = context.nodeResults.get(output.sourceNodeId);
      if (sourceResult) {
        outputs.set(output.name, sourceResult.output);
      }
    }

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
      executionId: createExecutionId(`sdk-exec-${Date.now()}`),
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
   * Get default system prompt template
   */
  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant executing a task node in a DAG workflow.

Node ID: {{NODE_ID}}
Node Name: {{NODE_NAME}}
DAG ID: {{DAG_ID}}
Skill: {{SKILL_ID}}

Instructions:
1. Read the task description carefully
2. Use any provided context and dependency results
3. Execute the task to the best of your ability
4. Return your response as structured JSON

Always be precise, thorough, and helpful.`;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate execution plan (for debugging/planning)
   */
  generateExecutionPlan(
    dag: DAG,
    inputs?: Record<string, unknown>
  ): SDKExecutionPlan {
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
    const plan: SDKExecutionPlan = {
      dagId: dag.id,
      dagName: dag.name,
      totalNodes: dag.nodes.size,
      totalWaves: waves.length,
      waves: [],
    };

    for (const wave of waves) {
      const nodePlans: SDKNodePlan[] = [];

      for (const nodeId of wave.nodeIds) {
        const node = dag.nodes.get(nodeId);
        if (!node) continue;

        nodePlans.push({
          nodeId,
          nodeName: node.name,
          model: this.selectModel(node),
          dependencies: node.dependencies,
          skillId: node.skillId,
        });
      }

      plan.waves.push({
        waveNumber: wave.waveNumber,
        nodes: nodePlans,
        parallelizable: wave.nodeIds.length > 1,
      });
    }

    return plan;
  }
}

// =============================================================================
// Types
// =============================================================================

/**
 * Execution plan for SDK runtime
 */
export interface SDKExecutionPlan {
  dagId: string;
  dagName: string;
  totalNodes: number;
  totalWaves: number;
  waves: SDKWavePlan[];
  error?: string;
}

export interface SDKWavePlan {
  waveNumber: number;
  nodes: SDKNodePlan[];
  parallelizable: boolean;
}

export interface SDKNodePlan {
  nodeId: NodeId;
  nodeName: string;
  model: string;
  dependencies: NodeId[];
  skillId?: string;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an SDK TypeScript runtime
 */
export function createSDKRuntime(config?: SDKRuntimeConfig): SDKTypescriptRuntime {
  return new SDKTypescriptRuntime(config);
}

/**
 * Create a mock client for testing
 */
export function createMockClient(
  responseOverride?: Partial<APIResponse>
): AnthropicClient {
  return {
    messages: {
      async create(params: CreateMessageParams): Promise<APIResponse> {
        await new Promise((resolve) => setTimeout(resolve, 10));

        const defaultResponse: APIResponse = {
          id: `msg_mock_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                output: { mock: true, params: { model: params.model } },
                confidence: 0.95,
              }),
            },
          ],
          model: params.model,
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        };

        return { ...defaultResponse, ...responseOverride };
      },
    },
  };
}

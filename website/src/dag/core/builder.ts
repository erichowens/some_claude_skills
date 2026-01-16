/**
 * DAG Builder - Fluent DSL for constructing DAGs
 *
 * Provides a chainable API for building directed acyclic graphs
 * with nodes, edges, and configuration.
 */

import {
  DAG,
  DAGNode,
  DAGConfig,
  NodeId,
  DAGId,
  TaskConfig,
  RetryPolicy,
  DAGInput,
  DAGOutput,
  NodeType,
  DEFAULT_TASK_CONFIG,
  DEFAULT_DAG_CONFIG,
  JSONSchema,
} from '../types/dag';
import { isAcyclic, getCycle, topologicalSort } from './topology';

/**
 * Builder for creating DAG nodes
 */
export class NodeBuilder {
  private node: Partial<DAGNode>;
  private dagBuilder: DAGBuilder;

  constructor(dagBuilder: DAGBuilder, id: NodeId, type: NodeType, name?: string) {
    this.dagBuilder = dagBuilder;
    this.node = {
      id,
      name: name || id as string,
      type,
      dependencies: [],
      state: { status: 'pending' },
      config: { ...DEFAULT_TASK_CONFIG },
    };
  }

  /**
   * Set the node name
   */
  name(name: string): this {
    this.node.name = name;
    return this;
  }

  /**
   * Set the description
   */
  description(description: string): this {
    this.node.description = description;
    return this;
  }

  /**
   * Set the skill ID for this node
   */
  skill(skillId: string): this {
    this.node.skillId = skillId;
    return this;
  }

  /**
   * Set the agent ID for this node
   */
  agent(agentId: string): this {
    this.node.agentId = agentId;
    return this;
  }

  /**
   * Set the MCP tool for this node
   */
  mcp(server: string, tool: string): this {
    this.node.mcpTool = { server, tool };
    return this;
  }

  /**
   * Add dependencies (nodes that must complete before this one)
   */
  dependsOn(...nodeIds: (NodeId | string)[]): this {
    const deps = nodeIds.map((id) =>
      typeof id === 'string' ? NodeId(id) : id
    );
    this.node.dependencies = [...(this.node.dependencies || []), ...deps];
    return this;
  }

  /**
   * Set the retry policy
   */
  retry(policy: RetryPolicy): this {
    this.node.retryPolicy = policy;
    return this;
  }

  /**
   * Set retry with simple parameters
   */
  retryTimes(maxAttempts: number, baseDelayMs: number = 1000): this {
    this.node.retryPolicy = {
      maxAttempts,
      baseDelayMs,
      maxDelayMs: baseDelayMs * 10,
      backoffMultiplier: 2,
      retryableErrors: ['TIMEOUT', 'RATE_LIMITED', 'MODEL_ERROR'],
      nonRetryableErrors: ['PERMISSION_DENIED', 'INVALID_INPUT'],
    };
    return this;
  }

  /**
   * Set task configuration
   */
  config(config: Partial<TaskConfig>): this {
    this.node.config = { ...this.node.config, ...config } as TaskConfig;
    return this;
  }

  /**
   * Set timeout for this node
   */
  timeout(ms: number): this {
    if (this.node.config) {
      this.node.config.timeoutMs = ms;
    }
    return this;
  }

  /**
   * Set the model for this node
   */
  model(model: 'haiku' | 'sonnet' | 'opus'): this {
    if (this.node.config) {
      this.node.config.model = model;
    }
    return this;
  }

  /**
   * Set max retries
   */
  maxRetries(retries: number): this {
    if (this.node.config) {
      this.node.config.maxRetries = retries;
    }
    return this;
  }

  /**
   * Set max tokens for this node
   */
  maxTokens(tokens: number): this {
    if (this.node.config) {
      this.node.config.maxTokens = tokens;
    }
    return this;
  }

  /**
   * Set the prompt in metadata
   */
  prompt(prompt: string): this {
    if (this.node.config) {
      this.node.config.metadata = {
        ...(this.node.config.metadata || {}),
        prompt,
      };
    }
    return this;
  }

  /**
   * Set output schema for validation
   */
  outputSchema(schema: JSONSchema): this {
    this.node.outputSchema = schema;
    return this;
  }

  /**
   * Set priority for scheduling
   */
  priority(priority: number): this {
    this.node.priority = priority;
    return this;
  }

  /**
   * Add tags for categorization
   */
  tags(...tags: string[]): this {
    this.node.tags = [...(this.node.tags || []), ...tags];
    return this;
  }

  /**
   * Set metadata for this node
   */
  metadata(data: Record<string, unknown>): this {
    if (this.node.config) {
      this.node.config.metadata = { ...this.node.config.metadata, ...data };
    }
    return this;
  }

  /**
   * Finish building this node and return to DAG builder
   */
  done(): DAGBuilder {
    this.dagBuilder.addBuiltNode(this.node as DAGNode);
    return this.dagBuilder;
  }

  /**
   * Build and return the node (for inline usage)
   */
  build(): DAGNode {
    return this.node as DAGNode;
  }
}

/**
 * Builder for conditional nodes
 */
export class ConditionalNodeBuilder extends NodeBuilder {
  private thenBranch: NodeId[] = [];
  private elseBranch: NodeId[] = [];

  constructor(dagBuilder: DAGBuilder, id: NodeId) {
    super(dagBuilder, id, 'conditional');
  }

  /**
   * Set the condition expression
   */
  when(expression: string): this {
    this.metadata({ conditionExpression: expression });
    return this;
  }

  /**
   * Set nodes to execute if condition is true
   */
  then(...nodeIds: (NodeId | string)[]): this {
    this.thenBranch = nodeIds.map((id) =>
      typeof id === 'string' ? NodeId(id) : id
    );
    this.metadata({ thenBranch: this.thenBranch });
    return this;
  }

  /**
   * Set nodes to execute if condition is false
   */
  else(...nodeIds: (NodeId | string)[]): this {
    this.elseBranch = nodeIds.map((id) =>
      typeof id === 'string' ? NodeId(id) : id
    );
    this.metadata({ elseBranch: this.elseBranch });
    return this;
  }
}

/**
 * Main DAG Builder with fluent API
 */
export class DAGBuilder {
  private dag: Partial<DAG>;
  private nodes: Map<NodeId, DAGNode> = new Map();
  private adjacencyList: Map<NodeId, NodeId[]> = new Map();

  constructor(name?: string) {
    this.dag = {
      id: DAGId(this.generateId()),
      name: name || 'Untitled DAG',
      version: '1.0.0',
      config: { ...DEFAULT_DAG_CONFIG },
      inputs: [],
      outputs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create a new DAG builder
   */
  static create(name?: string): DAGBuilder {
    return new DAGBuilder(name);
  }

  /**
   * Set the DAG name
   */
  name(name: string): this {
    this.dag.name = name;
    return this;
  }

  /**
   * Set the DAG version
   */
  version(version: string): this {
    this.dag.version = version;
    return this;
  }

  /**
   * Set DAG description
   */
  description(description: string): this {
    this.dag.description = description;
    return this;
  }

  /**
   * Set the author
   */
  author(author: string): this {
    this.dag.author = author;
    return this;
  }

  /**
   * Configure the DAG
   */
  config(config: Partial<DAGConfig>): this {
    this.dag.config = { ...this.dag.config, ...config } as DAGConfig;
    return this;
  }

  /**
   * Set max parallel nodes
   */
  maxParallel(n: number): this {
    if (this.dag.config) {
      this.dag.config.maxParallelism = n;
    }
    return this;
  }

  /**
   * Set global timeout
   */
  timeout(ms: number): this {
    if (this.dag.config) {
      this.dag.config.maxExecutionTimeMs = ms;
    }
    return this;
  }

  /**
   * Enable/disable fail fast
   */
  failFast(enabled: boolean): this {
    if (this.dag.config) {
      this.dag.config.failFast = enabled;
    }
    return this;
  }

  /**
   * Set execution mode
   */
  executionMode(mode: 'sequential' | 'parallel' | 'wave'): this {
    if (this.dag.config) {
      this.dag.config.executionMode = mode;
    }
    return this;
  }

  /**
   * Add tags
   */
  tags(...tags: string[]): this {
    this.dag.tags = [...(this.dag.tags || []), ...tags];
    return this;
  }

  /**
   * Add a skill node
   */
  skillNode(id: string, skillId: string): NodeBuilder {
    const nodeId = NodeId(id);
    const builder = new NodeBuilder(this, nodeId, 'skill', id);
    builder.skill(skillId);
    return builder;
  }

  /**
   * Add an agent node
   */
  agentNode(id: string, agentId?: string): NodeBuilder {
    const nodeId = NodeId(id);
    const builder = new NodeBuilder(this, nodeId, 'agent', id);
    if (agentId) {
      builder.agent(agentId);
    }
    return builder;
  }

  /**
   * Add an MCP tool node
   */
  mcpNode(id: string, server: string, tool: string): NodeBuilder {
    const nodeId = NodeId(id);
    const builder = new NodeBuilder(this, nodeId, 'mcp-tool', id);
    builder.mcp(server, tool);
    return builder;
  }

  /**
   * Add a composite node (sub-DAG)
   */
  compositeNode(id: string, subDag: DAG): NodeBuilder {
    const nodeId = NodeId(id);
    const builder = new NodeBuilder(this, nodeId, 'composite', id);
    builder.metadata({ subDagId: subDag.id });
    return builder;
  }

  /**
   * Add a conditional node
   */
  conditionalNode(id: string): ConditionalNodeBuilder {
    const nodeId = NodeId(id);
    return new ConditionalNodeBuilder(this, nodeId);
  }

  /**
   * Add a simple node with minimal configuration
   */
  node(id: string, type: NodeType = 'skill'): NodeBuilder {
    const nodeId = NodeId(id);
    return new NodeBuilder(this, nodeId, type, id);
  }

  /**
   * Add a pre-built node
   */
  addNode(node: DAGNode): this {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
    return this;
  }

  /**
   * Internal method for NodeBuilder to add nodes
   */
  addBuiltNode(node: DAGNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
    // Add edges from dependencies
    for (const dep of node.dependencies) {
      const existing = this.adjacencyList.get(dep) || [];
      if (!existing.includes(node.id)) {
        this.adjacencyList.set(dep, [...existing, node.id]);
      }
    }
  }

  /**
   * Add an edge between nodes
   */
  edge(from: string, to: string): this {
    const fromId = NodeId(from);
    const toId = NodeId(to);

    const existing = this.adjacencyList.get(fromId) || [];
    if (!existing.includes(toId)) {
      this.adjacencyList.set(fromId, [...existing, toId]);
    }
    // Also update dependencies
    const toNode = this.nodes.get(toId);
    if (toNode && !toNode.dependencies.includes(fromId)) {
      toNode.dependencies.push(fromId);
    }
    return this;
  }

  /**
   * Add multiple edges at once
   */
  edges(edgeList: [string, string][]): this {
    for (const [from, to] of edgeList) {
      this.edge(from, to);
    }
    return this;
  }

  /**
   * Create a linear chain of nodes
   */
  chain(...nodeIds: string[]): this {
    for (let i = 0; i < nodeIds.length - 1; i++) {
      this.edge(nodeIds[i], nodeIds[i + 1]);
    }
    return this;
  }

  /**
   * Fan out from one node to many
   */
  fanOut(from: string, ...to: string[]): this {
    for (const target of to) {
      this.edge(from, target);
    }
    return this;
  }

  /**
   * Fan in from many nodes to one
   */
  fanIn(to: string, ...from: string[]): this {
    for (const source of from) {
      this.edge(source, to);
    }
    return this;
  }

  /**
   * Define DAG inputs
   */
  input(input: DAGInput): this {
    this.dag.inputs = [...(this.dag.inputs || []), input];
    return this;
  }

  /**
   * Define DAG inputs with simple parameters
   */
  inputs(...names: string[]): this {
    for (const name of names) {
      this.dag.inputs = [
        ...(this.dag.inputs || []),
        { name, required: true },
      ];
    }
    return this;
  }

  /**
   * Define DAG outputs
   */
  output(output: DAGOutput): this {
    this.dag.outputs = [...(this.dag.outputs || []), output];
    return this;
  }

  /**
   * Define DAG outputs with simple parameters
   */
  outputs(...specs: Array<{ name: string; from: string }>): this {
    for (const spec of specs) {
      this.dag.outputs = [
        ...(this.dag.outputs || []),
        { name: spec.name, sourceNodeId: NodeId(spec.from) },
      ];
    }
    return this;
  }

  /**
   * Validate the DAG structure
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for empty DAG
    if (this.nodes.size === 0) {
      errors.push('DAG has no nodes');
    }

    // Build temporary DAG for validation
    const tempDag = this.buildUnsafe();

    // Check for cycles using the topology module
    if (!isAcyclic(tempDag)) {
      const cycle = getCycle(tempDag);
      errors.push(`Cycle detected: ${cycle.map((id) => id as string).join(' -> ')}`);
    }

    // Check for missing dependencies
    for (const [nodeIdKey, node] of this.nodes) {
      for (const dep of node.dependencies) {
        if (!this.nodes.has(dep)) {
          errors.push(`Node "${nodeIdKey}" depends on non-existent node "${dep}"`);
        }
      }
    }

    // Check for orphan nodes (no incoming or outgoing edges)
    if (this.nodes.size > 1) {
      for (const [nodeIdKey] of this.nodes) {
        const hasIncoming = Array.from(this.adjacencyList.values()).some((targets) =>
          targets.includes(nodeIdKey)
        );
        const hasOutgoing = (this.adjacencyList.get(nodeIdKey) || []).length > 0;
        const hasDependencies =
          (this.nodes.get(nodeIdKey)?.dependencies || []).length > 0;

        if (!hasIncoming && !hasOutgoing && !hasDependencies) {
          warnings.push(`Node "${nodeIdKey}" is disconnected from the graph`);
        }
      }
    }

    // Check for skill nodes without skill IDs
    for (const [nodeIdKey, node] of this.nodes) {
      if (node.type === 'skill' && !node.skillId) {
        warnings.push(`Skill node "${nodeIdKey}" has no skillId set`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build and return the DAG
   */
  build(): DAG {
    const validation = this.validate();
    if (!validation.valid) {
      throw new DAGBuilderError(
        `Invalid DAG: ${validation.errors.join('; ')}`,
        validation
      );
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('DAG warnings:', validation.warnings);
    }

    return this.buildUnsafe();
  }

  /**
   * Build without validation (use with caution)
   */
  buildUnsafe(): DAG {
    return {
      id: this.dag.id!,
      name: this.dag.name!,
      version: this.dag.version!,
      description: this.dag.description,
      nodes: this.nodes,
      edges: this.adjacencyList,
      config: this.dag.config!,
      inputs: this.dag.inputs || [],
      outputs: this.dag.outputs || [],
      tags: this.dag.tags,
      createdAt: this.dag.createdAt!,
      updatedAt: new Date(),
      author: this.dag.author,
    };
  }

  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder(): NodeId[] {
    const tempDag = this.buildUnsafe();
    const result = topologicalSort(tempDag);
    if (!result.success) {
      throw new DAGBuilderError(
        `Cannot determine execution order: cycle detected`,
        { cycle: result.cycle }
      );
    }
    return result.order;
  }

  /**
   * Clone this builder
   */
  clone(): DAGBuilder {
    const cloned = new DAGBuilder(this.dag.name);
    cloned.dag = {
      ...this.dag,
      id: DAGId(this.generateId()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cloned.nodes = new Map(this.nodes);
    cloned.adjacencyList = new Map(this.adjacencyList);
    return cloned;
  }

  /**
   * Merge another DAG into this one
   */
  merge(other: DAG, prefix?: string): this {
    const p = prefix ? `${prefix}_` : '';

    for (const [id, node] of other.nodes) {
      const newId = NodeId(`${p}${id}`);
      const newNode: DAGNode = {
        ...node,
        id: newId,
        name: `${p}${node.name}`,
        dependencies: node.dependencies.map((d) => NodeId(`${p}${d}`)),
      };
      this.nodes.set(newId, newNode);
    }

    for (const [from, tos] of other.edges) {
      const newFrom = NodeId(`${p}${from}`);
      const newTos = tos.map((t) => NodeId(`${p}${t}`));
      this.adjacencyList.set(newFrom, newTos);
    }

    return this;
  }

  private generateId(): string {
    return `dag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Validation result from DAG builder
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Error thrown by DAG builder
 */
export class DAGBuilderError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DAGBuilderError';
  }
}

/**
 * Convenience function to create a new DAG builder
 */
export function dag(name?: string): DAGBuilder {
  return DAGBuilder.create(name);
}

/**
 * Create a simple linear DAG from skill IDs
 */
export function linearDag(name: string, ...skillIds: string[]): DAG {
  const builder = dag(name);

  for (let i = 0; i < skillIds.length; i++) {
    const nodeId = `node-${i}`;
    const nodeBuilder = builder.skillNode(nodeId, skillIds[i]);

    if (i > 0) {
      nodeBuilder.dependsOn(`node-${i - 1}`);
    }

    nodeBuilder.done();
  }

  return builder.build();
}

/**
 * Create a fan-out/fan-in DAG
 */
export function fanOutFanInDag(
  name: string,
  startSkill: string,
  parallelSkills: string[],
  endSkill: string
): DAG {
  const builder = dag(name);

  // Start node
  builder.skillNode('start', startSkill).done();

  // Parallel nodes
  for (let i = 0; i < parallelSkills.length; i++) {
    builder
      .skillNode(`parallel-${i}`, parallelSkills[i])
      .dependsOn('start')
      .done();
  }

  // End node
  const endBuilder = builder.skillNode('end', endSkill);
  for (let i = 0; i < parallelSkills.length; i++) {
    endBuilder.dependsOn(`parallel-${i}`);
  }
  endBuilder.done();

  return builder.build();
}

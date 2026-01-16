/**
 * HTTP API Runtime for DAG Execution
 *
 * Exposes DAG execution via REST/WebSocket endpoints.
 * Supports job queuing, concurrent execution, and real-time updates.
 *
 * Key Features:
 * - REST API for DAG submission and status polling
 * - WebSocket for real-time execution updates
 * - Job queue with configurable concurrency
 * - State persistence via pluggable store
 * - Worker pool for parallel agent execution
 */

import { StateManager, ExecutionSnapshot } from '../core/state-manager';
import { PermissionEnforcer } from '../permissions/enforcer';
import { topologicalSort, TopologicalSortResult } from '../core/topology';
import type {
  DAG,
  DAGNode,
  NodeId,
  TaskResult,
  TaskError,
  PermissionMatrix,
  TokenUsage,
  DAGExecutionResult,
  NodeExecutionContext,
} from '../types';

// =============================================================================
// HTTP API Types
// =============================================================================

/**
 * Job status for tracking execution
 */
export type JobStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Execution job representation
 */
export interface ExecutionJob {
  id: string;
  dagId: string;
  status: JobStatus;
  inputs: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: DAGExecutionResult;
  error?: string;
  progress: {
    totalNodes: number;
    completedNodes: number;
    currentWave: number;
    totalWaves: number;
  };
}

/**
 * Real-time event types
 */
export type ExecutionEventType =
  | 'job:created'
  | 'job:started'
  | 'job:completed'
  | 'job:failed'
  | 'wave:start'
  | 'wave:complete'
  | 'node:start'
  | 'node:complete'
  | 'node:error';

/**
 * Event payload for WebSocket updates
 */
export interface ExecutionEvent {
  type: ExecutionEventType;
  jobId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * State store interface for job persistence
 */
export interface StateStore {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
}

/**
 * Event subscriber callback
 */
export type EventSubscriber = (event: ExecutionEvent) => void;

/**
 * HTTP API Runtime configuration
 */
export interface HTTPAPIRuntimeConfig {
  /**
   * Maximum concurrent jobs
   */
  maxConcurrentJobs?: number;

  /**
   * Maximum parallel API calls per job
   */
  maxParallelCallsPerJob?: number;

  /**
   * Job timeout in milliseconds
   */
  jobTimeoutMs?: number;

  /**
   * State store for job persistence
   */
  stateStore?: StateStore;

  /**
   * Permission matrix for enforcement
   */
  permissions?: PermissionMatrix;

  /**
   * Default model for API calls
   */
  defaultModel?: string;

  /**
   * API client factory for making Claude calls
   */
  clientFactory?: () => APIClient;
}

/**
 * API client interface for making Claude calls
 */
export interface APIClient {
  call(request: APIRequest): Promise<APIResult>;
}

/**
 * API request structure
 */
export interface APIRequest {
  model: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
}

/**
 * API result structure
 */
export interface APIResult {
  success: boolean;
  content: string;
  tokenUsage: TokenUsage;
  error?: string;
}

// =============================================================================
// In-Memory State Store
// =============================================================================

/**
 * Simple in-memory state store implementation
 */
export class InMemoryStateStore implements StateStore {
  private data: Map<string, { value: unknown; expiresAt?: number }> = new Map();

  async get(key: string): Promise<unknown | undefined> {
    const entry = this.data.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.data.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.data.keys()).filter((k) => regex.test(k));
  }

  clear(): void {
    this.data.clear();
  }
}

// =============================================================================
// Mock API Client
// =============================================================================

/**
 * Create a mock API client for testing
 */
export function createMockAPIClient(
  responseOverride?: Partial<APIResult>
): APIClient {
  return {
    async call(request: APIRequest): Promise<APIResult> {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 50));

      const defaultResult: APIResult = {
        success: true,
        content: JSON.stringify({
          output: {
            result: `Response for: ${request.userMessage.slice(0, 50)}...`,
            model: request.model,
          },
          confidence: 0.85 + Math.random() * 0.1,
        }),
        tokenUsage: {
          inputTokens: Math.floor(100 + Math.random() * 200),
          outputTokens: Math.floor(50 + Math.random() * 150),
        },
      };

      return { ...defaultResult, ...responseOverride };
    },
  };
}

// =============================================================================
// HTTP API Runtime
// =============================================================================

/**
 * HTTP API Runtime for DAG Execution
 *
 * Provides REST-like interface for DAG execution with:
 * - Job submission and tracking
 * - Real-time event subscriptions
 * - Concurrent job execution
 * - State persistence
 */
export class HTTPAPIRuntime {
  private config: Required<HTTPAPIRuntimeConfig>;
  private stateStore: StateStore;
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private activeJobs: Map<string, boolean> = new Map();
  private permissionEnforcer: PermissionEnforcer;
  private jobQueue: string[] = [];
  private isProcessingQueue = false;

  constructor(config: Partial<HTTPAPIRuntimeConfig> = {}) {
    const defaultPermissions: PermissionMatrix = {
      coreTools: {
        read: true,
        write: true,
        edit: true,
        glob: true,
        grep: true,
        task: true,
        webFetch: true,
        webSearch: true,
        todoWrite: true,
      },
      bash: {
        enabled: true,
        allowedPatterns: ['.*'],
        deniedPatterns: [],
        sandboxed: false,
      },
      fileSystem: {
        readPatterns: ['**/*'],
        writePatterns: ['**/*'],
        denyPatterns: [],
      },
      mcpTools: {
        allowed: ['*'],
        denied: [],
      },
      network: {
        enabled: true,
        allowedDomains: ['*'],
        denyDomains: [],
      },
      models: {
        allowed: ['haiku', 'sonnet', 'opus'],
        preferredForSpawning: 'sonnet',
      },
    };

    this.config = {
      maxConcurrentJobs: config.maxConcurrentJobs ?? 5,
      maxParallelCallsPerJob: config.maxParallelCallsPerJob ?? 3,
      jobTimeoutMs: config.jobTimeoutMs ?? 300000, // 5 minutes
      stateStore: config.stateStore ?? new InMemoryStateStore(),
      permissions: config.permissions ?? defaultPermissions,
      defaultModel: config.defaultModel ?? 'claude-sonnet-4-20250514',
      clientFactory: config.clientFactory ?? (() => createMockAPIClient()),
    };

    this.stateStore = this.config.stateStore;
    this.permissionEnforcer = new PermissionEnforcer(this.config.permissions);
  }

  // ===========================================================================
  // Permission Validation
  // ===========================================================================

  /**
   * Validate that a DAG can be executed with current permissions
   * HTTP API uses API-level auth; this does basic DAG structure validation
   */
  private validateDagPermissions(dag: DAG): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check that DAG has nodes
    if (dag.nodes.size === 0) {
      violations.push('DAG has no nodes');
    }

    // Check that all node dependencies exist
    for (const [nodeId, node] of dag.nodes) {
      for (const depId of node.dependencies) {
        if (!dag.nodes.has(depId)) {
          violations.push(`Node ${nodeId} depends on non-existent node ${depId}`);
        }
      }
    }

    // Check that skill nodes have skill IDs
    for (const [nodeId, node] of dag.nodes) {
      if (node.type === 'skill' && !node.skillId) {
        violations.push(`Skill node ${nodeId} has no skillId`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  // ===========================================================================
  // Job Management API
  // ===========================================================================

  /**
   * Submit a DAG for execution
   * @returns Job ID for tracking
   */
  async submitJob(
    dag: DAG,
    inputs: Record<string, unknown> = {}
  ): Promise<string> {
    // Validate permissions - HTTP API uses API-level auth, basic validation here
    const permissionResult = this.validateDagPermissions(dag);
    if (!permissionResult.valid) {
      throw new Error(`Permission denied: ${permissionResult.violations.join(', ')}`);
    }

    // Create job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sortResult = topologicalSort(dag);

    const job: ExecutionJob = {
      id: jobId,
      dagId: dag.id,
      status: 'pending',
      inputs,
      createdAt: new Date(),
      progress: {
        totalNodes: dag.nodes.size,
        completedNodes: 0,
        currentWave: 0,
        totalWaves: sortResult.waves.length,
      },
    };

    // Store job
    await this.stateStore.set(`job:${jobId}`, job);
    await this.stateStore.set(`dag:${jobId}`, dag);

    // Emit event
    this.emitEvent({
      type: 'job:created',
      jobId,
      timestamp: new Date(),
      data: { dagId: dag.id, nodeCount: dag.nodes.size },
    });

    // Add to queue and start processing
    this.jobQueue.push(jobId);
    this.processQueue();

    return jobId;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<ExecutionJob | undefined> {
    return (await this.stateStore.get(`job:${jobId}`)) as ExecutionJob | undefined;
  }

  /**
   * Get all jobs (optionally filtered by status)
   */
  async listJobs(status?: JobStatus): Promise<ExecutionJob[]> {
    const keys = await this.stateStore.keys('job:*');
    const jobs: ExecutionJob[] = [];

    for (const key of keys) {
      const job = (await this.stateStore.get(key)) as ExecutionJob;
      if (job && (!status || job.status === status)) {
        jobs.push(job);
      }
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a pending or running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job) return false;

    if (job.status === 'pending' || job.status === 'queued') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      await this.stateStore.set(`job:${jobId}`, job);

      // Remove from queue
      const queueIndex = this.jobQueue.indexOf(jobId);
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
      }

      return true;
    }

    if (job.status === 'running') {
      // Signal cancellation
      this.activeJobs.set(jobId, false);
      return true;
    }

    return false;
  }

  // ===========================================================================
  // Event Subscription API
  // ===========================================================================

  /**
   * Subscribe to events for a specific job
   */
  subscribe(jobId: string, callback: EventSubscriber): () => void {
    if (!this.subscribers.has(jobId)) {
      this.subscribers.set(jobId, new Set());
    }
    this.subscribers.get(jobId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(jobId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(jobId);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: EventSubscriber): () => void {
    return this.subscribe('*', callback);
  }

  private emitEvent(event: ExecutionEvent): void {
    // Notify job-specific subscribers
    const jobSubs = this.subscribers.get(event.jobId);
    if (jobSubs) {
      jobSubs.forEach((cb) => cb(event));
    }

    // Notify global subscribers
    const globalSubs = this.subscribers.get('*');
    if (globalSubs) {
      globalSubs.forEach((cb) => cb(event));
    }
  }

  // ===========================================================================
  // Queue Processing
  // ===========================================================================

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.jobQueue.length > 0) {
        // Check concurrency limit
        const runningCount = Array.from(this.activeJobs.values()).filter(Boolean).length;
        if (runningCount >= this.config.maxConcurrentJobs) {
          // Wait for a slot
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        // Get next job
        const jobId = this.jobQueue.shift();
        if (!jobId) continue;

        const job = await this.getJob(jobId);
        if (!job || job.status === 'cancelled') continue;

        // Mark as queued
        job.status = 'queued';
        await this.stateStore.set(`job:${jobId}`, job);

        // Start execution (non-blocking)
        this.executeJob(jobId).catch((error) => {
          console.error(`Job ${jobId} failed:`, error);
        });
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ===========================================================================
  // Job Execution
  // ===========================================================================

  private async executeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    const dag = (await this.stateStore.get(`dag:${jobId}`)) as DAG;
    if (!dag) {
      job.status = 'failed';
      job.error = 'DAG not found';
      await this.stateStore.set(`job:${jobId}`, job);
      return;
    }

    // Validate DAG structure before proceeding
    if (!dag.nodes || !(dag.nodes instanceof Map)) {
      job.status = 'failed';
      job.error = `Invalid DAG structure: nodes is ${dag.nodes === undefined ? 'undefined' : typeof dag.nodes}`;
      await this.stateStore.set(`job:${jobId}`, job);
      this.emitEvent({
        type: 'job:failed',
        jobId,
        timestamp: new Date(),
        data: { error: job.error },
      });
      return;
    }

    // Mark as running
    job.status = 'running';
    job.startedAt = new Date();
    await this.stateStore.set(`job:${jobId}`, job);
    this.activeJobs.set(jobId, true);

    this.emitEvent({
      type: 'job:started',
      jobId,
      timestamp: new Date(),
      data: {},
    });

    const startTime = Date.now();
    const stateManager = new StateManager({ dag });
    stateManager.startExecution(); // Initialize nodes to ready state
    const client = this.config.clientFactory();
    const errors: TaskError[] = [];
    const tokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

    try {
      // Compute waves using topological sort
      const sortResult = topologicalSort(dag);

      if (!sortResult.success) {
        throw new Error('DAG contains a cycle');
      }

      // Execute waves
      for (let waveIndex = 0; waveIndex < sortResult.waves.length; waveIndex++) {
        // Check cancellation
        if (!this.activeJobs.get(jobId)) {
          job.status = 'cancelled';
          break;
        }

        const wave = sortResult.waves[waveIndex];
        job.progress.currentWave = waveIndex;
        await this.stateStore.set(`job:${jobId}`, job);

        this.emitEvent({
          type: 'wave:start',
          jobId,
          timestamp: new Date(),
          data: { waveIndex, nodeIds: wave.nodeIds },
        });

        // Execute nodes in wave with controlled parallelism
        const results = await this.executeWaveWithThrottle(
          jobId,
          dag,
          wave.nodeIds,
          stateManager,
          client,
          job.inputs
        );

        // Process results
        for (const [nodeId, result] of results) {
          if (result.success && result.taskResult) {
            stateManager.markNodeCompleted(nodeId, result.taskResult);
            tokenUsage.inputTokens += result.tokenUsage?.inputTokens ?? 0;
            tokenUsage.outputTokens += result.tokenUsage?.outputTokens ?? 0;
            job.progress.completedNodes++;
          } else if (result.error) {
            stateManager.markNodeFailed(nodeId, result.error);
            errors.push(result.error);
          }
        }

        await this.stateStore.set(`job:${jobId}`, job);

        this.emitEvent({
          type: 'wave:complete',
          jobId,
          timestamp: new Date(),
          data: { waveIndex },
        });
      }

      // Build result
      const snapshot = stateManager.getSnapshot();
      const outputs = this.collectOutputs(dag, snapshot);

      const result: DAGExecutionResult = {
        success: errors.length === 0 && job.status !== 'cancelled',
        snapshot,
        outputs,
        totalTokenUsage: tokenUsage,
        totalTimeMs: Date.now() - startTime,
        errors,
      };

      // Update job
      job.status = errors.length === 0 ? 'completed' : 'failed';
      job.completedAt = new Date();
      job.result = result;
      if (errors.length > 0) {
        job.error = errors.map((e) => e.message).join('; ');
      }
      await this.stateStore.set(`job:${jobId}`, job);

      this.emitEvent({
        type: job.status === 'completed' ? 'job:completed' : 'job:failed',
        jobId,
        timestamp: new Date(),
        data: { success: result.success, totalTimeMs: result.totalTimeMs },
      });
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : String(error);
      await this.stateStore.set(`job:${jobId}`, job);

      this.emitEvent({
        type: 'job:failed',
        jobId,
        timestamp: new Date(),
        data: { error: job.error },
      });
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  private async executeWaveWithThrottle(
    jobId: string,
    dag: DAG,
    nodeIds: NodeId[],
    stateManager: StateManager,
    client: APIClient,
    inputs: Record<string, unknown>
  ): Promise<Map<NodeId, NodeExecutionResult>> {
    const results = new Map<NodeId, NodeExecutionResult>();
    const pending = [...nodeIds];
    const inFlight = new Map<NodeId, Promise<void>>();

    while (pending.length > 0 || inFlight.size > 0) {
      // Check cancellation
      if (!this.activeJobs.get(jobId)) {
        break;
      }

      // Start new tasks up to limit
      while (
        pending.length > 0 &&
        inFlight.size < this.config.maxParallelCallsPerJob
      ) {
        const nodeId = pending.shift()!;
        const node = dag.nodes.get(nodeId);
        if (!node) continue;

        // Skip nodes that have already been skipped (e.g., due to failed dependencies)
        const nodeState = stateManager.getNodeState(nodeId);
        if (nodeState?.status === 'skipped') {
          continue;
        }

        const task = this.executeNode(jobId, node, stateManager, client, inputs)
          .then((result) => {
            results.set(nodeId, result);
            inFlight.delete(nodeId); // Remove from in-flight when done
          })
          .catch((error) => {
            results.set(nodeId, {
              success: false,
              error: {
                code: 'EXECUTION_ERROR',
                message: error instanceof Error ? error.message : String(error),
                recoverable: false,
              },
            });
            inFlight.delete(nodeId); // Remove from in-flight when done
          });

        inFlight.set(nodeId, task);
      }

      // Wait for at least one to complete if we have in-flight tasks
      if (inFlight.size > 0) {
        await Promise.race(inFlight.values());
      }
    }

    return results;
  }

  private async executeNode(
    jobId: string,
    node: DAGNode,
    stateManager: StateManager,
    client: APIClient,
    inputs: Record<string, unknown>
  ): Promise<NodeExecutionResult> {
    this.emitEvent({
      type: 'node:start',
      jobId,
      timestamp: new Date(),
      data: { nodeId: node.id, nodeName: node.name },
    });

    stateManager.markNodeStarted(node.id);

    try {
      // Build prompt with dependency results
      const depResults = this.getDependencyResults(node, stateManager);
      const prompt = this.buildNodePrompt(node, inputs, depResults);

      // Make API call
      const response = await client.call({
        model: this.config.defaultModel,
        systemPrompt: this.buildSystemPrompt(node),
        userMessage: prompt,
        maxTokens: 4096,
      });

      if (!response.success) {
        throw new Error(response.error || 'API call failed');
      }

      // Parse response
      const taskResult = this.parseResponse(response.content);

      this.emitEvent({
        type: 'node:complete',
        jobId,
        timestamp: new Date(),
        data: {
          nodeId: node.id,
          confidence: taskResult.confidence,
          tokens: response.tokenUsage,
        },
      });

      return {
        success: true,
        taskResult,
        tokenUsage: response.tokenUsage,
      };
    } catch (error) {
      const taskError: TaskError = {
        code: 'NODE_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : String(error),
        recoverable: false,
      };

      this.emitEvent({
        type: 'node:error',
        jobId,
        timestamp: new Date(),
        data: { nodeId: node.id, error: taskError.message },
      });

      return {
        success: false,
        error: taskError,
      };
    }
  }

  private getDependencyResults(
    node: DAGNode,
    stateManager: StateManager
  ): Map<NodeId, TaskResult> {
    const results = new Map<NodeId, TaskResult>();
    for (const depId of node.dependencies) {
      const state = stateManager.getNodeState(depId);
      if (state?.status === 'completed' && state.result) {
        results.set(depId, state.result);
      }
    }
    return results;
  }

  private buildNodePrompt(
    node: DAGNode,
    inputs: Record<string, unknown>,
    depResults: Map<NodeId, TaskResult>
  ): string {
    const parts: string[] = [];

    parts.push(`Task: ${node.name}`);
    parts.push(`Node ID: ${node.id}`);
    parts.push('');

    if (Object.keys(inputs).length > 0) {
      parts.push('Inputs:');
      parts.push(JSON.stringify(inputs, null, 2));
      parts.push('');
    }

    if (depResults.size > 0) {
      parts.push('Results from dependencies:');
      for (const [depId, result] of depResults) {
        parts.push(`- ${depId}:`);
        parts.push(JSON.stringify(result.output, null, 2));
      }
      parts.push('');
    }

    // Get prompt from node
    const prompt = (node as { prompt?: string }).prompt || `Execute task: ${node.name}`;
    parts.push('Instructions:');
    parts.push(prompt);

    return parts.join('\n');
  }

  private buildSystemPrompt(node: DAGNode): string {
    return `You are executing a node in a DAG workflow.
Node: ${node.name}
Type: ${node.type}
Skill: ${node.skillId || 'general'}

Respond with valid JSON containing:
- output: Your result data
- confidence: A number 0-1 indicating confidence
- reasoning: Brief explanation of your approach`;
  }

  private parseResponse(content: string): TaskResult {
    try {
      const parsed = JSON.parse(content);
      return {
        output: parsed.output ?? parsed,
        confidence: parsed.confidence ?? 0.8,
        metadata: {
          reasoning: parsed.reasoning,
        },
      };
    } catch {
      return {
        output: { text: content },
        confidence: 0.7,
      };
    }
  }

  private collectOutputs(dag: DAG, snapshot: ExecutionSnapshot): Map<string, unknown> {
    const outputs = new Map<string, unknown>();

    for (const outputDef of dag.outputs) {
      const nodeState = snapshot.nodeStates.get(outputDef.sourceNodeId);
      if (nodeState?.status === 'completed' && nodeState.result) {
        let value = nodeState.result.output;

        // Navigate to output path if specified
        if (outputDef.outputPath) {
          const pathParts = outputDef.outputPath.split('.');
          for (const part of pathParts) {
            if (value && typeof value === 'object') {
              value = (value as Record<string, unknown>)[part];
            }
          }
        }

        outputs.set(outputDef.name, value);
      }
    }

    return outputs;
  }

  // ===========================================================================
  // Execution Plan Generation
  // ===========================================================================

  /**
   * Generate execution plan without executing
   */
  generateExecutionPlan(dag: DAG): HTTPExecutionPlan {
    const sortResult = topologicalSort(dag);

    return {
      dagId: dag.id,
      dagName: dag.name || dag.id,
      totalNodes: dag.nodes.size,
      totalWaves: sortResult.waves.length,
      hasCycle: !sortResult.success,
      estimatedConcurrency: Math.min(
        this.config.maxParallelCallsPerJob,
        Math.max(...sortResult.waves.map((w) => w.nodeIds.length), 1)
      ),
      waves: sortResult.waves.map((wave) => ({
        waveIndex: wave.waveNumber,
        parallelizable: wave.nodeIds.length > 1,
        nodes: wave.nodeIds.map((nodeId) => {
          const node = dag.nodes.get(nodeId);
          return {
            nodeId,
            nodeName: node?.name ?? nodeId,
            nodeType: node?.type ?? 'skill',
            skillId: node?.skillId,
            dependencies: node?.dependencies ?? [],
          };
        }),
      })),
    };
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  /**
   * Clean up old jobs from state store
   */
  async cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const keys = await this.stateStore.keys('job:*');
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    for (const key of keys) {
      const job = (await this.stateStore.get(key)) as ExecutionJob;
      if (
        job &&
        job.completedAt &&
        job.completedAt.getTime() < cutoff
      ) {
        await this.stateStore.delete(key);
        await this.stateStore.delete(`dag:${job.id}`);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// =============================================================================
// Helper Types
// =============================================================================

interface NodeExecutionResult {
  success: boolean;
  taskResult?: TaskResult;
  tokenUsage?: TokenUsage;
  error?: TaskError;
}

export interface HTTPExecutionPlan {
  dagId: string;
  dagName: string;
  totalNodes: number;
  totalWaves: number;
  hasCycle: boolean;
  estimatedConcurrency: number;
  waves: HTTPWavePlan[];
}

export interface HTTPWavePlan {
  waveIndex: number;
  parallelizable: boolean;
  nodes: HTTPNodePlan[];
}

export interface HTTPNodePlan {
  nodeId: NodeId;
  nodeName: string;
  nodeType: string;
  skillId?: string;
  dependencies: NodeId[];
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create HTTP API runtime with default configuration
 */
export function createHTTPAPIRuntime(
  config: Partial<HTTPAPIRuntimeConfig> = {}
): HTTPAPIRuntime {
  return new HTTPAPIRuntime(config);
}

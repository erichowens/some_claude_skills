/**
 * Execution Tracer
 *
 * Traces full execution paths through DAG workflows, capturing detailed
 * information about each node execution for debugging and analysis.
 *
 * @module dag/observability/execution-tracer
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Execution status for a traced operation
 */
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled'
  | 'timeout';

/**
 * Level of detail for tracing
 */
export type TraceLevel = 'minimal' | 'standard' | 'detailed' | 'verbose';

/**
 * A single span in the execution trace
 */
export interface TraceSpan {
  /** Unique span ID */
  spanId: string;
  /** Parent span ID (null for root) */
  parentSpanId: string | null;
  /** Trace ID (groups related spans) */
  traceId: string;
  /** Operation name */
  operationName: string;
  /** Node ID in the DAG */
  nodeId?: string;
  /** Skill ID if applicable */
  skillId?: string;
  /** Agent type if spawned */
  agentType?: string;
  /** Start timestamp */
  startTime: Date;
  /** End timestamp */
  endTime?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Execution status */
  status: ExecutionStatus;
  /** Input data (may be truncated) */
  input?: unknown;
  /** Output data (may be truncated) */
  output?: unknown;
  /** Error information if failed */
  error?: TraceError;
  /** Tags for filtering */
  tags: Record<string, string>;
  /** Custom attributes */
  attributes: Record<string, unknown>;
  /** Child span IDs */
  childSpanIds: string[];
  /** Logs/events within this span */
  events: TraceEvent[];
}

/**
 * An event within a span
 */
export interface TraceEvent {
  /** Event timestamp */
  timestamp: Date;
  /** Event name */
  name: string;
  /** Event level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Event message */
  message: string;
  /** Additional attributes */
  attributes?: Record<string, unknown>;
}

/**
 * Error information in a trace
 */
export interface TraceError {
  /** Error type/class */
  type: string;
  /** Error message */
  message: string;
  /** Stack trace */
  stack?: string;
  /** Additional error context */
  context?: Record<string, unknown>;
}

/**
 * Complete execution trace
 */
export interface ExecutionTrace {
  /** Trace ID */
  traceId: string;
  /** Trace name/description */
  name: string;
  /** Root span ID */
  rootSpanId: string;
  /** All spans indexed by ID */
  spans: Map<string, TraceSpan>;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Total duration */
  totalDurationMs?: number;
  /** Overall status */
  status: ExecutionStatus;
  /** Trace metadata */
  metadata: TraceMetadata;
}

/**
 * Trace metadata
 */
export interface TraceMetadata {
  /** DAG ID */
  dagId?: string;
  /** DAG name */
  dagName?: string;
  /** Runtime environment */
  runtime: 'claude-code-cli' | 'sdk' | 'http-api' | 'unknown';
  /** User/session identifier */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Custom metadata */
  custom?: Record<string, unknown>;
}

/**
 * Options for tracing
 */
export interface TraceOptions {
  /** Level of detail */
  level: TraceLevel;
  /** Maximum input size to capture (bytes) */
  maxInputSize?: number;
  /** Maximum output size to capture (bytes) */
  maxOutputSize?: number;
  /** Whether to capture stack traces on errors */
  captureStackTraces?: boolean;
  /** Tags to add to all spans */
  defaultTags?: Record<string, string>;
  /** Sampling rate (0-1) */
  samplingRate?: number;
  /** Whether to trace is enabled */
  enabled?: boolean;
}

/**
 * Span builder for fluent API
 */
export interface SpanBuilder {
  /** Set node ID */
  withNodeId(nodeId: string): SpanBuilder;
  /** Set skill ID */
  withSkillId(skillId: string): SpanBuilder;
  /** Set agent type */
  withAgentType(agentType: string): SpanBuilder;
  /** Set input data */
  withInput(input: unknown): SpanBuilder;
  /** Add tag */
  withTag(key: string, value: string): SpanBuilder;
  /** Add attribute */
  withAttribute(key: string, value: unknown): SpanBuilder;
  /** Start the span */
  start(): TraceSpan;
}

/**
 * Query for filtering traces
 */
export interface TraceQuery {
  /** Filter by trace ID */
  traceId?: string;
  /** Filter by operation name (supports wildcards) */
  operationName?: string;
  /** Filter by status */
  status?: ExecutionStatus[];
  /** Filter by tag */
  tags?: Record<string, string>;
  /** Filter by time range */
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  /** Filter by duration */
  durationMs?: {
    min?: number;
    max?: number;
  };
  /** Include only spans with errors */
  hasError?: boolean;
  /** Limit results */
  limit?: number;
}

/**
 * Trace summary statistics
 */
export interface TraceSummary {
  /** Total number of spans */
  totalSpans: number;
  /** Spans by status */
  byStatus: Record<ExecutionStatus, number>;
  /** Average duration */
  avgDurationMs: number;
  /** Max duration */
  maxDurationMs: number;
  /** Min duration */
  minDurationMs: number;
  /** Error rate */
  errorRate: number;
  /** Most common operations */
  topOperations: Array<{ name: string; count: number; avgDurationMs: number }>;
  /** Critical path (longest chain) */
  criticalPath: string[];
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_OPTIONS: TraceOptions = {
  level: 'standard',
  maxInputSize: 10000,
  maxOutputSize: 10000,
  captureStackTraces: true,
  defaultTags: {},
  samplingRate: 1.0,
  enabled: true,
};

// ============================================================================
// Execution Tracer Class
// ============================================================================

/**
 * Traces DAG execution paths
 */
export class ExecutionTracer {
  private traces: Map<string, ExecutionTrace> = new Map();
  private activeSpans: Map<string, TraceSpan> = new Map();
  private options: TraceOptions;

  constructor(options: Partial<TraceOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, metadata?: Partial<TraceMetadata>): ExecutionTrace {
    if (!this.shouldSample()) {
      return this.createNoopTrace(name);
    }

    const traceId = this.generateId('trace');
    const rootSpanId = this.generateId('span');

    const rootSpan: TraceSpan = {
      spanId: rootSpanId,
      parentSpanId: null,
      traceId,
      operationName: name,
      startTime: new Date(),
      status: 'running',
      tags: { ...this.options.defaultTags },
      attributes: {},
      childSpanIds: [],
      events: [],
    };

    const trace: ExecutionTrace = {
      traceId,
      name,
      rootSpanId,
      spans: new Map([[rootSpanId, rootSpan]]),
      startTime: new Date(),
      status: 'running',
      metadata: {
        runtime: 'unknown',
        ...metadata,
      },
    };

    this.traces.set(traceId, trace);
    this.activeSpans.set(rootSpanId, rootSpan);

    return trace;
  }

  /**
   * Start a new span within a trace
   */
  startSpan(
    traceId: string,
    operationName: string,
    parentSpanId?: string
  ): SpanBuilder {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return this.createNoopSpanBuilder();
    }

    const spanId = this.generateId('span');
    const effectiveParentId = parentSpanId || trace.rootSpanId;

    const span: TraceSpan = {
      spanId,
      parentSpanId: effectiveParentId,
      traceId,
      operationName,
      startTime: new Date(),
      status: 'pending',
      tags: { ...this.options.defaultTags },
      attributes: {},
      childSpanIds: [],
      events: [],
    };

    return this.createSpanBuilder(span, trace, effectiveParentId);
  }

  /**
   * End a span
   */
  endSpan(
    spanId: string,
    status: ExecutionStatus = 'completed',
    output?: unknown,
    error?: TraceError
  ): TraceSpan | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    span.endTime = new Date();
    span.durationMs = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    if (output !== undefined) {
      span.output = this.truncateData(output, this.options.maxOutputSize);
    }

    if (error) {
      span.error = error;
    }

    this.activeSpans.delete(spanId);
    return span;
  }

  /**
   * Add an event to a span
   */
  addEvent(
    spanId: string,
    name: string,
    level: TraceEvent['level'] = 'info',
    message: string,
    attributes?: Record<string, unknown>
  ): void {
    const span = this.activeSpans.get(spanId) || this.findSpan(spanId);
    if (!span) return;

    span.events.push({
      timestamp: new Date(),
      name,
      level,
      message,
      attributes,
    });
  }

  /**
   * End a trace
   */
  endTrace(
    traceId: string,
    status?: ExecutionStatus
  ): ExecutionTrace | undefined {
    const trace = this.traces.get(traceId);
    if (!trace) return undefined;

    trace.endTime = new Date();
    trace.totalDurationMs = trace.endTime.getTime() - trace.startTime.getTime();

    // End root span
    const rootSpan = trace.spans.get(trace.rootSpanId);
    if (rootSpan && !rootSpan.endTime) {
      this.endSpan(trace.rootSpanId, status || 'completed');
    }

    // Determine overall status
    if (status) {
      trace.status = status;
    } else {
      trace.status = this.determineTraceStatus(trace);
    }

    return trace;
  }

  /**
   * Get a trace by ID
   */
  getTrace(traceId: string): ExecutionTrace | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get a span by ID
   */
  getSpan(spanId: string): TraceSpan | undefined {
    return this.findSpan(spanId);
  }

  /**
   * Query traces
   */
  queryTraces(query: TraceQuery): ExecutionTrace[] {
    let results = Array.from(this.traces.values());

    if (query.traceId) {
      results = results.filter((t) => t.traceId === query.traceId);
    }

    if (query.status) {
      results = results.filter((t) => query.status!.includes(t.status));
    }

    if (query.timeRange?.start) {
      results = results.filter((t) => t.startTime >= query.timeRange!.start!);
    }

    if (query.timeRange?.end) {
      results = results.filter((t) => t.startTime <= query.timeRange!.end!);
    }

    if (query.durationMs?.min !== undefined) {
      results = results.filter(
        (t) => t.totalDurationMs && t.totalDurationMs >= query.durationMs!.min!
      );
    }

    if (query.durationMs?.max !== undefined) {
      results = results.filter(
        (t) => t.totalDurationMs && t.totalDurationMs <= query.durationMs!.max!
      );
    }

    if (query.hasError) {
      results = results.filter((t) => t.status === 'failed');
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Query spans across all traces
   */
  querySpans(query: TraceQuery): TraceSpan[] {
    let results: TraceSpan[] = [];

    for (const trace of this.traces.values()) {
      if (query.traceId && trace.traceId !== query.traceId) continue;
      results.push(...trace.spans.values());
    }

    if (query.operationName) {
      const pattern = new RegExp(
        query.operationName.replace(/\*/g, '.*'),
        'i'
      );
      results = results.filter((s) => pattern.test(s.operationName));
    }

    if (query.status) {
      results = results.filter((s) => query.status!.includes(s.status));
    }

    if (query.tags) {
      results = results.filter((s) =>
        Object.entries(query.tags!).every(
          ([key, value]) => s.tags[key] === value
        )
      );
    }

    if (query.timeRange?.start) {
      results = results.filter((s) => s.startTime >= query.timeRange!.start!);
    }

    if (query.timeRange?.end) {
      results = results.filter((s) => s.startTime <= query.timeRange!.end!);
    }

    if (query.durationMs?.min !== undefined) {
      results = results.filter(
        (s) => s.durationMs && s.durationMs >= query.durationMs!.min!
      );
    }

    if (query.durationMs?.max !== undefined) {
      results = results.filter(
        (s) => s.durationMs && s.durationMs <= query.durationMs!.max!
      );
    }

    if (query.hasError) {
      results = results.filter((s) => s.error !== undefined);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get summary statistics for a trace
   */
  summarize(traceId: string): TraceSummary | undefined {
    const trace = this.traces.get(traceId);
    if (!trace) return undefined;

    const spans = Array.from(trace.spans.values());
    const completedSpans = spans.filter((s) => s.durationMs !== undefined);
    const durations = completedSpans.map((s) => s.durationMs!);

    // Count by status
    const byStatus = {} as Record<ExecutionStatus, number>;
    for (const span of spans) {
      byStatus[span.status] = (byStatus[span.status] || 0) + 1;
    }

    // Calculate duration stats
    const avgDurationMs =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Count operations
    const opCounts = new Map<string, { count: number; totalMs: number }>();
    for (const span of completedSpans) {
      const existing = opCounts.get(span.operationName) || {
        count: 0,
        totalMs: 0,
      };
      existing.count++;
      existing.totalMs += span.durationMs!;
      opCounts.set(span.operationName, existing);
    }

    const topOperations = Array.from(opCounts.entries())
      .map(([name, { count, totalMs }]) => ({
        name,
        count,
        avgDurationMs: totalMs / count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Find critical path
    const criticalPath = this.findCriticalPath(trace);

    return {
      totalSpans: spans.length,
      byStatus,
      avgDurationMs,
      maxDurationMs: durations.length > 0 ? Math.max(...durations) : 0,
      minDurationMs: durations.length > 0 ? Math.min(...durations) : 0,
      errorRate:
        spans.length > 0 ? (byStatus.failed || 0) / spans.length : 0,
      topOperations,
      criticalPath,
    };
  }

  /**
   * Export trace in various formats
   */
  export(
    traceId: string,
    format: 'json' | 'opentelemetry' = 'json'
  ): string | undefined {
    const trace = this.traces.get(traceId);
    if (!trace) return undefined;

    if (format === 'json') {
      return JSON.stringify(
        {
          ...trace,
          spans: Array.from(trace.spans.values()),
        },
        (key, value) => {
          if (value instanceof Map) {
            return Array.from(value.entries());
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        },
        2
      );
    }

    // OpenTelemetry format
    return JSON.stringify(
      {
        resourceSpans: [
          {
            resource: {
              attributes: Object.entries(trace.metadata).map(([k, v]) => ({
                key: k,
                value: { stringValue: String(v) },
              })),
            },
            scopeSpans: [
              {
                spans: Array.from(trace.spans.values()).map((span) => ({
                  traceId: span.traceId,
                  spanId: span.spanId,
                  parentSpanId: span.parentSpanId,
                  name: span.operationName,
                  startTimeUnixNano: span.startTime.getTime() * 1e6,
                  endTimeUnixNano: span.endTime
                    ? span.endTime.getTime() * 1e6
                    : 0,
                  status: {
                    code: span.status === 'failed' ? 2 : 1,
                    message: span.error?.message,
                  },
                  attributes: Object.entries(span.attributes).map(([k, v]) => ({
                    key: k,
                    value: { stringValue: String(v) },
                  })),
                })),
              },
            ],
          },
        ],
      },
      null,
      2
    );
  }

  /**
   * Clear old traces
   */
  clearOldTraces(maxAgeMs: number): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    let cleared = 0;

    for (const [traceId, trace] of this.traces) {
      if (trace.endTime && trace.endTime < cutoff) {
        this.traces.delete(traceId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Configure options
   */
  configure(options: Partial<TraceOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(): boolean {
    if (!this.options.enabled) return false;
    return Math.random() < (this.options.samplingRate || 1);
  }

  private createNoopTrace(name: string): ExecutionTrace {
    return {
      traceId: 'noop',
      name,
      rootSpanId: 'noop',
      spans: new Map(),
      startTime: new Date(),
      status: 'skipped',
      metadata: { runtime: 'unknown' },
    };
  }

  private createNoopSpanBuilder(): SpanBuilder {
    const noopSpan: TraceSpan = {
      spanId: 'noop',
      parentSpanId: null,
      traceId: 'noop',
      operationName: 'noop',
      startTime: new Date(),
      status: 'skipped',
      tags: {},
      attributes: {},
      childSpanIds: [],
      events: [],
    };

    return {
      withNodeId: () => this.createNoopSpanBuilder(),
      withSkillId: () => this.createNoopSpanBuilder(),
      withAgentType: () => this.createNoopSpanBuilder(),
      withInput: () => this.createNoopSpanBuilder(),
      withTag: () => this.createNoopSpanBuilder(),
      withAttribute: () => this.createNoopSpanBuilder(),
      start: () => noopSpan,
    };
  }

  private createSpanBuilder(
    span: TraceSpan,
    trace: ExecutionTrace,
    parentSpanId: string
  ): SpanBuilder {
    return {
      withNodeId: (nodeId: string) => {
        span.nodeId = nodeId;
        return this.createSpanBuilder(span, trace, parentSpanId);
      },
      withSkillId: (skillId: string) => {
        span.skillId = skillId;
        return this.createSpanBuilder(span, trace, parentSpanId);
      },
      withAgentType: (agentType: string) => {
        span.agentType = agentType;
        return this.createSpanBuilder(span, trace, parentSpanId);
      },
      withInput: (input: unknown) => {
        span.input = this.truncateData(input, this.options.maxInputSize);
        return this.createSpanBuilder(span, trace, parentSpanId);
      },
      withTag: (key: string, value: string) => {
        span.tags[key] = value;
        return this.createSpanBuilder(span, trace, parentSpanId);
      },
      withAttribute: (key: string, value: unknown) => {
        span.attributes[key] = value;
        return this.createSpanBuilder(span, trace, parentSpanId);
      },
      start: () => {
        span.status = 'running';
        trace.spans.set(span.spanId, span);
        this.activeSpans.set(span.spanId, span);

        // Add to parent's children
        const parent = trace.spans.get(parentSpanId);
        if (parent) {
          parent.childSpanIds.push(span.spanId);
        }

        return span;
      },
    };
  }

  private truncateData(data: unknown, maxSize?: number): unknown {
    if (!maxSize) return data;

    const str = JSON.stringify(data);
    if (str.length <= maxSize) return data;

    return {
      _truncated: true,
      _originalSize: str.length,
      _preview: str.substring(0, maxSize) + '...',
    };
  }

  private findSpan(spanId: string): TraceSpan | undefined {
    for (const trace of this.traces.values()) {
      const span = trace.spans.get(spanId);
      if (span) return span;
    }
    return undefined;
  }

  private determineTraceStatus(trace: ExecutionTrace): ExecutionStatus {
    const spans = Array.from(trace.spans.values());

    if (spans.some((s) => s.status === 'failed')) return 'failed';
    if (spans.some((s) => s.status === 'timeout')) return 'timeout';
    if (spans.some((s) => s.status === 'cancelled')) return 'cancelled';
    if (spans.every((s) => s.status === 'completed' || s.status === 'skipped')) {
      return 'completed';
    }
    return 'completed';
  }

  private findCriticalPath(trace: ExecutionTrace): string[] {
    // Find the path with the longest cumulative duration
    const paths: string[][] = [];

    const traverse = (spanId: string, currentPath: string[]): void => {
      const span = trace.spans.get(spanId);
      if (!span) return;

      const newPath = [...currentPath, span.operationName];

      if (span.childSpanIds.length === 0) {
        paths.push(newPath);
      } else {
        for (const childId of span.childSpanIds) {
          traverse(childId, newPath);
        }
      }
    };

    traverse(trace.rootSpanId, []);

    // Return the longest path
    return paths.reduce(
      (longest, current) =>
        current.length > longest.length ? current : longest,
      [] as string[]
    );
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global execution tracer instance
 */
export const executionTracer = new ExecutionTracer();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Start a new trace
 */
export function startTrace(
  name: string,
  metadata?: Partial<TraceMetadata>
): ExecutionTrace {
  return executionTracer.startTrace(name, metadata);
}

/**
 * Start a new span
 */
export function startSpan(
  traceId: string,
  operationName: string,
  parentSpanId?: string
): SpanBuilder {
  return executionTracer.startSpan(traceId, operationName, parentSpanId);
}

/**
 * End a span
 */
export function endSpan(
  spanId: string,
  status?: ExecutionStatus,
  output?: unknown,
  error?: TraceError
): TraceSpan | undefined {
  return executionTracer.endSpan(spanId, status, output, error);
}

/**
 * End a trace
 */
export function endTrace(
  traceId: string,
  status?: ExecutionStatus
): ExecutionTrace | undefined {
  return executionTracer.endTrace(traceId, status);
}

/**
 * Get trace summary
 */
export function getTraceSummary(traceId: string): TraceSummary | undefined {
  return executionTracer.summarize(traceId);
}

/**
 * Query traces
 */
export function queryTraces(query: TraceQuery): ExecutionTrace[] {
  return executionTracer.queryTraces(query);
}

/**
 * Export trace
 */
export function exportTrace(
  traceId: string,
  format?: 'json' | 'opentelemetry'
): string | undefined {
  return executionTracer.export(traceId, format);
}

"use strict";
/**
 * Execution Tracer
 *
 * Traces full execution paths through DAG workflows, capturing detailed
 * information about each node execution for debugging and analysis.
 *
 * @module dag/observability/execution-tracer
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionTracer = exports.ExecutionTracer = void 0;
exports.startTrace = startTrace;
exports.startSpan = startSpan;
exports.endSpan = endSpan;
exports.endTrace = endTrace;
exports.getTraceSummary = getTraceSummary;
exports.queryTraces = queryTraces;
exports.exportTrace = exportTrace;
// ============================================================================
// Default Values
// ============================================================================
var DEFAULT_OPTIONS = {
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
var ExecutionTracer = /** @class */ (function () {
    function ExecutionTracer(options) {
        if (options === void 0) { options = {}; }
        this.traces = new Map();
        this.activeSpans = new Map();
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), options);
    }
    /**
     * Start a new trace
     */
    ExecutionTracer.prototype.startTrace = function (name, metadata) {
        if (!this.shouldSample()) {
            return this.createNoopTrace(name);
        }
        var traceId = this.generateId('trace');
        var rootSpanId = this.generateId('span');
        var rootSpan = {
            spanId: rootSpanId,
            parentSpanId: null,
            traceId: traceId,
            operationName: name,
            startTime: new Date(),
            status: 'running',
            tags: __assign({}, this.options.defaultTags),
            attributes: {},
            childSpanIds: [],
            events: [],
        };
        var trace = {
            traceId: traceId,
            name: name,
            rootSpanId: rootSpanId,
            spans: new Map([[rootSpanId, rootSpan]]),
            startTime: new Date(),
            status: 'running',
            metadata: __assign({ runtime: 'unknown' }, metadata),
        };
        this.traces.set(traceId, trace);
        this.activeSpans.set(rootSpanId, rootSpan);
        return trace;
    };
    /**
     * Start a new span within a trace
     */
    ExecutionTracer.prototype.startSpan = function (traceId, operationName, parentSpanId) {
        var trace = this.traces.get(traceId);
        if (!trace) {
            return this.createNoopSpanBuilder();
        }
        var spanId = this.generateId('span');
        var effectiveParentId = parentSpanId || trace.rootSpanId;
        var span = {
            spanId: spanId,
            parentSpanId: effectiveParentId,
            traceId: traceId,
            operationName: operationName,
            startTime: new Date(),
            status: 'pending',
            tags: __assign({}, this.options.defaultTags),
            attributes: {},
            childSpanIds: [],
            events: [],
        };
        return this.createSpanBuilder(span, trace, effectiveParentId);
    };
    /**
     * End a span
     */
    ExecutionTracer.prototype.endSpan = function (spanId, status, output, error) {
        if (status === void 0) { status = 'completed'; }
        var span = this.activeSpans.get(spanId);
        if (!span)
            return undefined;
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
    };
    /**
     * Add an event to a span
     */
    ExecutionTracer.prototype.addEvent = function (spanId, name, level, message, attributes) {
        if (level === void 0) { level = 'info'; }
        var span = this.activeSpans.get(spanId) || this.findSpan(spanId);
        if (!span)
            return;
        span.events.push({
            timestamp: new Date(),
            name: name,
            level: level,
            message: message,
            attributes: attributes,
        });
    };
    /**
     * End a trace
     */
    ExecutionTracer.prototype.endTrace = function (traceId, status) {
        var trace = this.traces.get(traceId);
        if (!trace)
            return undefined;
        trace.endTime = new Date();
        trace.totalDurationMs = trace.endTime.getTime() - trace.startTime.getTime();
        // End root span
        var rootSpan = trace.spans.get(trace.rootSpanId);
        if (rootSpan && !rootSpan.endTime) {
            this.endSpan(trace.rootSpanId, status || 'completed');
        }
        // Determine overall status
        if (status) {
            trace.status = status;
        }
        else {
            trace.status = this.determineTraceStatus(trace);
        }
        return trace;
    };
    /**
     * Get a trace by ID
     */
    ExecutionTracer.prototype.getTrace = function (traceId) {
        return this.traces.get(traceId);
    };
    /**
     * Get a span by ID
     */
    ExecutionTracer.prototype.getSpan = function (spanId) {
        return this.findSpan(spanId);
    };
    /**
     * Query traces
     */
    ExecutionTracer.prototype.queryTraces = function (query) {
        var _a, _b, _c, _d;
        var results = Array.from(this.traces.values());
        if (query.traceId) {
            results = results.filter(function (t) { return t.traceId === query.traceId; });
        }
        if (query.status) {
            results = results.filter(function (t) { return query.status.includes(t.status); });
        }
        if ((_a = query.timeRange) === null || _a === void 0 ? void 0 : _a.start) {
            results = results.filter(function (t) { return t.startTime >= query.timeRange.start; });
        }
        if ((_b = query.timeRange) === null || _b === void 0 ? void 0 : _b.end) {
            results = results.filter(function (t) { return t.startTime <= query.timeRange.end; });
        }
        if (((_c = query.durationMs) === null || _c === void 0 ? void 0 : _c.min) !== undefined) {
            results = results.filter(function (t) { return t.totalDurationMs && t.totalDurationMs >= query.durationMs.min; });
        }
        if (((_d = query.durationMs) === null || _d === void 0 ? void 0 : _d.max) !== undefined) {
            results = results.filter(function (t) { return t.totalDurationMs && t.totalDurationMs <= query.durationMs.max; });
        }
        if (query.hasError) {
            results = results.filter(function (t) { return t.status === 'failed'; });
        }
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results;
    };
    /**
     * Query spans across all traces
     */
    ExecutionTracer.prototype.querySpans = function (query) {
        var _a, _b, _c, _d;
        var results = [];
        for (var _i = 0, _e = this.traces.values(); _i < _e.length; _i++) {
            var trace = _e[_i];
            if (query.traceId && trace.traceId !== query.traceId)
                continue;
            results.push.apply(results, trace.spans.values());
        }
        if (query.operationName) {
            var pattern_1 = new RegExp(query.operationName.replace(/\*/g, '.*'), 'i');
            results = results.filter(function (s) { return pattern_1.test(s.operationName); });
        }
        if (query.status) {
            results = results.filter(function (s) { return query.status.includes(s.status); });
        }
        if (query.tags) {
            results = results.filter(function (s) {
                return Object.entries(query.tags).every(function (_a) {
                    var key = _a[0], value = _a[1];
                    return s.tags[key] === value;
                });
            });
        }
        if ((_a = query.timeRange) === null || _a === void 0 ? void 0 : _a.start) {
            results = results.filter(function (s) { return s.startTime >= query.timeRange.start; });
        }
        if ((_b = query.timeRange) === null || _b === void 0 ? void 0 : _b.end) {
            results = results.filter(function (s) { return s.startTime <= query.timeRange.end; });
        }
        if (((_c = query.durationMs) === null || _c === void 0 ? void 0 : _c.min) !== undefined) {
            results = results.filter(function (s) { return s.durationMs && s.durationMs >= query.durationMs.min; });
        }
        if (((_d = query.durationMs) === null || _d === void 0 ? void 0 : _d.max) !== undefined) {
            results = results.filter(function (s) { return s.durationMs && s.durationMs <= query.durationMs.max; });
        }
        if (query.hasError) {
            results = results.filter(function (s) { return s.error !== undefined; });
        }
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results;
    };
    /**
     * Get summary statistics for a trace
     */
    ExecutionTracer.prototype.summarize = function (traceId) {
        var trace = this.traces.get(traceId);
        if (!trace)
            return undefined;
        var spans = Array.from(trace.spans.values());
        var completedSpans = spans.filter(function (s) { return s.durationMs !== undefined; });
        var durations = completedSpans.map(function (s) { return s.durationMs; });
        // Count by status
        var byStatus = {};
        for (var _i = 0, spans_1 = spans; _i < spans_1.length; _i++) {
            var span = spans_1[_i];
            byStatus[span.status] = (byStatus[span.status] || 0) + 1;
        }
        // Calculate duration stats
        var avgDurationMs = durations.length > 0
            ? durations.reduce(function (a, b) { return a + b; }, 0) / durations.length
            : 0;
        // Count operations
        var opCounts = new Map();
        for (var _a = 0, completedSpans_1 = completedSpans; _a < completedSpans_1.length; _a++) {
            var span = completedSpans_1[_a];
            var existing = opCounts.get(span.operationName) || {
                count: 0,
                totalMs: 0,
            };
            existing.count++;
            existing.totalMs += span.durationMs;
            opCounts.set(span.operationName, existing);
        }
        var topOperations = Array.from(opCounts.entries())
            .map(function (_a) {
            var name = _a[0], _b = _a[1], count = _b.count, totalMs = _b.totalMs;
            return ({
                name: name,
                count: count,
                avgDurationMs: totalMs / count,
            });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 10);
        // Find critical path
        var criticalPath = this.findCriticalPath(trace);
        return {
            totalSpans: spans.length,
            byStatus: byStatus,
            avgDurationMs: avgDurationMs,
            maxDurationMs: durations.length > 0 ? Math.max.apply(Math, durations) : 0,
            minDurationMs: durations.length > 0 ? Math.min.apply(Math, durations) : 0,
            errorRate: spans.length > 0 ? (byStatus.failed || 0) / spans.length : 0,
            topOperations: topOperations,
            criticalPath: criticalPath,
        };
    };
    /**
     * Export trace in various formats
     */
    ExecutionTracer.prototype.export = function (traceId, format) {
        if (format === void 0) { format = 'json'; }
        var trace = this.traces.get(traceId);
        if (!trace)
            return undefined;
        if (format === 'json') {
            return JSON.stringify(__assign(__assign({}, trace), { spans: Array.from(trace.spans.values()) }), function (key, value) {
                if (value instanceof Map) {
                    return Array.from(value.entries());
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            }, 2);
        }
        // OpenTelemetry format
        return JSON.stringify({
            resourceSpans: [
                {
                    resource: {
                        attributes: Object.entries(trace.metadata).map(function (_a) {
                            var k = _a[0], v = _a[1];
                            return ({
                                key: k,
                                value: { stringValue: String(v) },
                            });
                        }),
                    },
                    scopeSpans: [
                        {
                            spans: Array.from(trace.spans.values()).map(function (span) {
                                var _a;
                                return ({
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
                                        message: (_a = span.error) === null || _a === void 0 ? void 0 : _a.message,
                                    },
                                    attributes: Object.entries(span.attributes).map(function (_a) {
                                        var k = _a[0], v = _a[1];
                                        return ({
                                            key: k,
                                            value: { stringValue: String(v) },
                                        });
                                    }),
                                });
                            }),
                        },
                    ],
                },
            ],
        }, null, 2);
    };
    /**
     * Clear old traces
     */
    ExecutionTracer.prototype.clearOldTraces = function (maxAgeMs) {
        var cutoff = new Date(Date.now() - maxAgeMs);
        var cleared = 0;
        for (var _i = 0, _a = this.traces; _i < _a.length; _i++) {
            var _b = _a[_i], traceId = _b[0], trace = _b[1];
            if (trace.endTime && trace.endTime < cutoff) {
                this.traces.delete(traceId);
                cleared++;
            }
        }
        return cleared;
    };
    /**
     * Configure options
     */
    ExecutionTracer.prototype.configure = function (options) {
        this.options = __assign(__assign({}, this.options), options);
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    ExecutionTracer.prototype.generateId = function (prefix) {
        return "".concat(prefix, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    ExecutionTracer.prototype.shouldSample = function () {
        if (!this.options.enabled)
            return false;
        return Math.random() < (this.options.samplingRate || 1);
    };
    ExecutionTracer.prototype.createNoopTrace = function (name) {
        return {
            traceId: 'noop',
            name: name,
            rootSpanId: 'noop',
            spans: new Map(),
            startTime: new Date(),
            status: 'skipped',
            metadata: { runtime: 'unknown' },
        };
    };
    ExecutionTracer.prototype.createNoopSpanBuilder = function () {
        var _this = this;
        var noopSpan = {
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
            withNodeId: function () { return _this.createNoopSpanBuilder(); },
            withSkillId: function () { return _this.createNoopSpanBuilder(); },
            withAgentType: function () { return _this.createNoopSpanBuilder(); },
            withInput: function () { return _this.createNoopSpanBuilder(); },
            withTag: function () { return _this.createNoopSpanBuilder(); },
            withAttribute: function () { return _this.createNoopSpanBuilder(); },
            start: function () { return noopSpan; },
        };
    };
    ExecutionTracer.prototype.createSpanBuilder = function (span, trace, parentSpanId) {
        var _this = this;
        return {
            withNodeId: function (nodeId) {
                span.nodeId = nodeId;
                return _this.createSpanBuilder(span, trace, parentSpanId);
            },
            withSkillId: function (skillId) {
                span.skillId = skillId;
                return _this.createSpanBuilder(span, trace, parentSpanId);
            },
            withAgentType: function (agentType) {
                span.agentType = agentType;
                return _this.createSpanBuilder(span, trace, parentSpanId);
            },
            withInput: function (input) {
                span.input = _this.truncateData(input, _this.options.maxInputSize);
                return _this.createSpanBuilder(span, trace, parentSpanId);
            },
            withTag: function (key, value) {
                span.tags[key] = value;
                return _this.createSpanBuilder(span, trace, parentSpanId);
            },
            withAttribute: function (key, value) {
                span.attributes[key] = value;
                return _this.createSpanBuilder(span, trace, parentSpanId);
            },
            start: function () {
                span.status = 'running';
                trace.spans.set(span.spanId, span);
                _this.activeSpans.set(span.spanId, span);
                // Add to parent's children
                var parent = trace.spans.get(parentSpanId);
                if (parent) {
                    parent.childSpanIds.push(span.spanId);
                }
                return span;
            },
        };
    };
    ExecutionTracer.prototype.truncateData = function (data, maxSize) {
        if (!maxSize)
            return data;
        var str = JSON.stringify(data);
        if (str.length <= maxSize)
            return data;
        return {
            _truncated: true,
            _originalSize: str.length,
            _preview: str.substring(0, maxSize) + '...',
        };
    };
    ExecutionTracer.prototype.findSpan = function (spanId) {
        for (var _i = 0, _a = this.traces.values(); _i < _a.length; _i++) {
            var trace = _a[_i];
            var span = trace.spans.get(spanId);
            if (span)
                return span;
        }
        return undefined;
    };
    ExecutionTracer.prototype.determineTraceStatus = function (trace) {
        var spans = Array.from(trace.spans.values());
        if (spans.some(function (s) { return s.status === 'failed'; }))
            return 'failed';
        if (spans.some(function (s) { return s.status === 'timeout'; }))
            return 'timeout';
        if (spans.some(function (s) { return s.status === 'cancelled'; }))
            return 'cancelled';
        if (spans.every(function (s) { return s.status === 'completed' || s.status === 'skipped'; })) {
            return 'completed';
        }
        return 'completed';
    };
    ExecutionTracer.prototype.findCriticalPath = function (trace) {
        // Find the path with the longest cumulative duration
        var paths = [];
        var traverse = function (spanId, currentPath) {
            var span = trace.spans.get(spanId);
            if (!span)
                return;
            var newPath = __spreadArray(__spreadArray([], currentPath, true), [span.operationName], false);
            if (span.childSpanIds.length === 0) {
                paths.push(newPath);
            }
            else {
                for (var _i = 0, _a = span.childSpanIds; _i < _a.length; _i++) {
                    var childId = _a[_i];
                    traverse(childId, newPath);
                }
            }
        };
        traverse(trace.rootSpanId, []);
        // Return the longest path
        return paths.reduce(function (longest, current) {
            return current.length > longest.length ? current : longest;
        }, []);
    };
    return ExecutionTracer;
}());
exports.ExecutionTracer = ExecutionTracer;
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Global execution tracer instance
 */
exports.executionTracer = new ExecutionTracer();
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Start a new trace
 */
function startTrace(name, metadata) {
    return exports.executionTracer.startTrace(name, metadata);
}
/**
 * Start a new span
 */
function startSpan(traceId, operationName, parentSpanId) {
    return exports.executionTracer.startSpan(traceId, operationName, parentSpanId);
}
/**
 * End a span
 */
function endSpan(spanId, status, output, error) {
    return exports.executionTracer.endSpan(spanId, status, output, error);
}
/**
 * End a trace
 */
function endTrace(traceId, status) {
    return exports.executionTracer.endTrace(traceId, status);
}
/**
 * Get trace summary
 */
function getTraceSummary(traceId) {
    return exports.executionTracer.summarize(traceId);
}
/**
 * Query traces
 */
function queryTraces(query) {
    return exports.executionTracer.queryTraces(query);
}
/**
 * Export trace
 */
function exportTrace(traceId, format) {
    return exports.executionTracer.export(traceId, format);
}

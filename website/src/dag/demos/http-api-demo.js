"use strict";
/**
 * Integration Demo: HTTP API Runtime
 *
 * This demo showcases the DAG execution framework using the HTTP API runtime.
 * Unlike CLI and SDK runtimes, the HTTP API runtime provides:
 * - Job-based execution with unique job IDs
 * - Event subscription for real-time progress updates
 * - Job queue with configurable concurrency
 * - State persistence via pluggable stores
 *
 * Key Differences from Other Runtimes:
 * - REST-like API: submitJob, getJob, cancelJob
 * - Async execution with status polling
 * - Event-driven updates via subscribe()
 * - Built-in job queue management
 *
 * DAG Structure (same as other demos for comparison):
 * ```
 *   [research-topic]     [gather-examples]
 *          \                   /
 *           \                 /
 *            v               v
 *         [analyze-findings]
 *                 |
 *                 v
 *         [generate-report]
 *                 |
 *                 v
 *         [create-summary]
 * ```
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventLogger = createEventLogger;
exports.buildResearchDAG = buildResearchDAG;
exports.createCustomAPIClient = createCustomAPIClient;
exports.runHTTPAPIDemo = runHTTPAPIDemo;
exports.runSimpleHTTPAPIDemo = runSimpleHTTPAPIDemo;
exports.runParallelHTTPAPIDemo = runParallelHTTPAPIDemo;
exports.runJobQueueDemo = runJobQueueDemo;
exports.runEventSubscriptionDemo = runEventSubscriptionDemo;
exports.runJobCancellationDemo = runJobCancellationDemo;
exports.runErrorHandlingDemo = runErrorHandlingDemo;
exports.runCleanupDemo = runCleanupDemo;
exports.runAllHTTPAPIDemos = runAllHTTPAPIDemos;
var builder_1 = require("../core/builder");
var http_api_1 = require("../runtimes/http-api");
var presets_1 = require("../permissions/presets");
var DEFAULT_CONFIG = {
    topic: 'The impact of AI on software development workflows',
    verbose: true,
    maxConcurrentJobs: 5,
    maxParallelCallsPerJob: 3,
    permissions: 'standard',
    defaultModel: 'claude-sonnet-4-20250514',
};
// =============================================================================
// Event Logging
// =============================================================================
function createEventLogger(verbose) {
    var logs = [];
    var startTime = Date.now();
    var log = function (message) {
        var elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        var entry = "[".concat(elapsed, "s] ").concat(message);
        logs.push(entry);
        if (verbose) {
            console.log(entry);
        }
    };
    return { log: log, logs: logs };
}
// =============================================================================
// Build the Research DAG
// =============================================================================
function buildResearchDAG(topic) {
    var builder = (0, builder_1.dag)('http-api-research-workflow')
        .description("HTTP API Research workflow for: ".concat(topic));
    // Wave 0: Parallel research tasks
    builder
        .skillNode('research-topic', 'comprehensive-researcher')
        .name('Research Topic')
        .prompt("Research the following topic thoroughly: \"".concat(topic, "\".\n             Find key facts, recent developments, and expert opinions.\n             Return structured findings with citations."))
        .timeout(60000)
        .model('sonnet')
        .done();
    builder
        .skillNode('gather-examples', 'technical-researcher')
        .name('Gather Examples')
        .prompt("Find real-world examples and case studies related to: \"".concat(topic, "\".\n             Include code samples, tool comparisons, and practical implementations."))
        .timeout(60000)
        .model('sonnet')
        .done();
    // Wave 1: Analysis (depends on both research tasks)
    builder
        .skillNode('analyze-findings', 'data-scientist')
        .name('Analyze Findings')
        .prompt("Analyze the research findings and examples gathered.\n             Identify patterns, trends, and key insights.\n             Synthesize information from multiple sources.")
        .dependsOn('research-topic', 'gather-examples')
        .timeout(45000)
        .model('sonnet')
        .done();
    // Wave 2: Report generation
    builder
        .skillNode('generate-report', 'technical-writer')
        .name('Generate Report')
        .prompt("Create a comprehensive report based on the analysis.\n             Structure: Executive Summary, Key Findings, Examples, Recommendations.\n             Use clear headings and bullet points.")
        .dependsOn('analyze-findings')
        .timeout(45000)
        .model('sonnet')
        .done();
    // Wave 3: Summary
    builder
        .skillNode('create-summary', 'technical-writer')
        .name('Create Summary')
        .prompt("Create a concise executive summary (2-3 paragraphs) of the report.\n             Highlight the most important takeaways and recommendations.")
        .dependsOn('generate-report')
        .timeout(30000)
        .model('haiku')
        .done();
    // Define DAG outputs
    builder.output({
        name: 'report',
        sourceNodeId: 'generate-report',
        outputPath: 'output',
    });
    builder.output({
        name: 'summary',
        sourceNodeId: 'create-summary',
        outputPath: 'output',
    });
    return builder.build();
}
// =============================================================================
// Custom API Client
// =============================================================================
function createCustomAPIClient(responseGenerator) {
    var callCount = 0;
    return {
        call: function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var nodeIdMatch, nodeId, responseText;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            callCount++;
                            nodeIdMatch = request.userMessage.match(/Node ID: (\S+)/);
                            nodeId = nodeIdMatch ? nodeIdMatch[1] : "node-".concat(callCount);
                            responseText = responseGenerator
                                ? responseGenerator(nodeId, request.userMessage)
                                : JSON.stringify({
                                    output: {
                                        result: "HTTP API result for ".concat(nodeId),
                                        data: { processed: true, timestamp: Date.now(), model: request.model },
                                    },
                                    confidence: 0.85 + Math.random() * 0.1,
                                    reasoning: "Analysis completed for ".concat(nodeId, " via HTTP API runtime"),
                                });
                            // Simulate API latency
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30 + Math.random() * 70); })];
                        case 1:
                            // Simulate API latency
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    content: responseText,
                                    tokenUsage: {
                                        inputTokens: Math.floor(100 + Math.random() * 200),
                                        outputTokens: Math.floor(50 + Math.random() * 150),
                                    },
                                }];
                    }
                });
            });
        },
    };
}
// =============================================================================
// Run Main Demo
// =============================================================================
function runHTTPAPIDemo() {
    return __awaiter(this, arguments, void 0, function (config) {
        var finalConfig, _a, log, logs, events, dagInstance, permissions, stateStore, runtimeConfig, runtime, plan, jobId, unsubscribe, job, pollInterval, maxPollTime, pollStart, completedNodes, failedNodes, _i, _b, _c, state, tokensUsed, _d, _e, name_1, _f, _g, error;
        var _h, _j, _k, _l, _m, _o, _p, _q;
        if (config === void 0) { config = {}; }
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    finalConfig = __assign(__assign({}, DEFAULT_CONFIG), config);
                    _a = createEventLogger(finalConfig.verbose), log = _a.log, logs = _a.logs;
                    events = [];
                    log('═══════════════════════════════════════════════════════════════');
                    log('  HTTP API Runtime - Integration Demo');
                    log('═══════════════════════════════════════════════════════════════');
                    log("Topic: ".concat(finalConfig.topic));
                    log("Max Concurrent Jobs: ".concat(finalConfig.maxConcurrentJobs));
                    log("Max Parallel Calls/Job: ".concat(finalConfig.maxParallelCallsPerJob));
                    log("Default Model: ".concat(finalConfig.defaultModel));
                    log('');
                    // Build the DAG
                    log('📊 Building DAG...');
                    dagInstance = buildResearchDAG(finalConfig.topic);
                    log("   Created DAG with ".concat(dagInstance.nodes.size, " nodes"));
                    // Log the execution plan
                    log('');
                    log('📋 Execution Plan:');
                    log('   Wave 0: research-topic, gather-examples (parallel)');
                    log('   Wave 1: analyze-findings');
                    log('   Wave 2: generate-report');
                    log('   Wave 3: create-summary');
                    log('');
                    permissions = (0, presets_1.getPreset)(finalConfig.permissions);
                    stateStore = new http_api_1.InMemoryStateStore();
                    runtimeConfig = {
                        maxConcurrentJobs: finalConfig.maxConcurrentJobs,
                        maxParallelCallsPerJob: finalConfig.maxParallelCallsPerJob,
                        stateStore: stateStore,
                        permissions: permissions,
                        defaultModel: finalConfig.defaultModel,
                        clientFactory: function () { return createCustomAPIClient(); },
                    };
                    // Create runtime
                    log('🚀 Creating HTTP API runtime...');
                    runtime = new http_api_1.HTTPAPIRuntime(runtimeConfig);
                    plan = runtime.generateExecutionPlan(dagInstance);
                    log("\uD83D\uDCCB Plan: ".concat(plan.totalWaves, " waves, ").concat(plan.totalNodes, " nodes, max concurrency: ").concat(plan.estimatedConcurrency));
                    log('');
                    // Submit job
                    log('📤 Submitting job...');
                    return [4 /*yield*/, runtime.submitJob(dagInstance, { topic: finalConfig.topic })];
                case 1:
                    jobId = _r.sent();
                    log("   Job ID: ".concat(jobId));
                    // Subscribe to events
                    log('📡 Subscribing to job events...');
                    unsubscribe = runtime.subscribe(jobId, function (event) {
                        var _a;
                        events.push(event);
                        switch (event.type) {
                            case 'job:started':
                                log('▶️  Job started');
                                break;
                            case 'wave:start':
                                log("\uD83C\uDF0A Wave ".concat(event.data.waveIndex, " starting: ").concat(event.data.nodeIds.join(', ')));
                                break;
                            case 'wave:complete':
                                log("\uD83C\uDFC1 Wave ".concat(event.data.waveIndex, " completed"));
                                break;
                            case 'node:start':
                                log("   \u25B6\uFE0F  Node starting: ".concat(event.data.nodeId));
                                break;
                            case 'node:complete':
                                log("   \u2705 Node completed: ".concat(event.data.nodeId, " (confidence: ").concat(((_a = event.data.confidence) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'N/A', ")"));
                                break;
                            case 'node:error':
                                log("   \u274C Node failed: ".concat(event.data.nodeId, " - ").concat(event.data.error));
                                break;
                            case 'job:completed':
                                log("\uD83C\uDF89 Job completed in ".concat(event.data.totalTimeMs, "ms"));
                                break;
                            case 'job:failed':
                                log("\uD83D\uDCA5 Job failed: ".concat(event.data.error));
                                break;
                        }
                    });
                    log('');
                    // Wait for job completion with polling
                    log('⏳ Waiting for job completion...');
                    pollInterval = 50;
                    maxPollTime = 30000;
                    pollStart = Date.now();
                    _r.label = 2;
                case 2:
                    if (!(Date.now() - pollStart < maxPollTime)) return [3 /*break*/, 5];
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 3:
                    job = _r.sent();
                    if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, pollInterval); })];
                case 4:
                    _r.sent();
                    return [3 /*break*/, 2];
                case 5:
                    // Unsubscribe from events
                    unsubscribe();
                    // Log results
                    log('');
                    log('═══════════════════════════════════════════════════════════════');
                    log('  Execution Complete');
                    log('═══════════════════════════════════════════════════════════════');
                    if (!job) {
                        log('❌ Job not found');
                        return [2 /*return*/, {
                                result: null,
                                logs: logs,
                                events: events,
                                metrics: {
                                    totalNodes: dagInstance.nodes.size,
                                    completedNodes: 0,
                                    failedNodes: 0,
                                    totalTimeMs: 0,
                                    tokensUsed: 0,
                                    eventsReceived: events.length,
                                },
                            }];
                    }
                    log("Status: ".concat(job.status === 'completed' ? '✅ SUCCESS' : '❌ ' + job.status.toUpperCase()));
                    log("Total time: ".concat((_j = (_h = job.result) === null || _h === void 0 ? void 0 : _h.totalTimeMs) !== null && _j !== void 0 ? _j : 0, "ms"));
                    log("Events received: ".concat(events.length));
                    log('');
                    completedNodes = 0;
                    failedNodes = 0;
                    if ((_k = job.result) === null || _k === void 0 ? void 0 : _k.snapshot.nodeStates) {
                        for (_i = 0, _b = job.result.snapshot.nodeStates; _i < _b.length; _i++) {
                            _c = _b[_i], state = _c[1];
                            if (state.status === 'completed')
                                completedNodes++;
                            if (state.status === 'failed')
                                failedNodes++;
                        }
                    }
                    tokensUsed = job.result
                        ? job.result.totalTokenUsage.inputTokens + job.result.totalTokenUsage.outputTokens
                        : 0;
                    log('📈 Metrics:');
                    log("   Nodes completed: ".concat(completedNodes, "/").concat(dagInstance.nodes.size));
                    log("   Nodes failed: ".concat(failedNodes));
                    log("   Tokens used: ".concat(tokensUsed));
                    log("   Events received: ".concat(events.length));
                    if (((_l = job.result) === null || _l === void 0 ? void 0 : _l.outputs) && job.result.outputs.size > 0) {
                        log('');
                        log('📤 Outputs:');
                        for (_d = 0, _e = job.result.outputs; _d < _e.length; _d++) {
                            name_1 = _e[_d][0];
                            log("   - ".concat(name_1, ": [generated]"));
                        }
                    }
                    if (((_m = job.result) === null || _m === void 0 ? void 0 : _m.errors) && job.result.errors.length > 0) {
                        log('');
                        log('⚠️  Errors:');
                        for (_f = 0, _g = job.result.errors; _f < _g.length; _f++) {
                            error = _g[_f];
                            log("   - ".concat(error.code, ": ").concat(error.message));
                        }
                    }
                    return [2 /*return*/, {
                            result: (_o = job.result) !== null && _o !== void 0 ? _o : null,
                            logs: logs,
                            events: events,
                            metrics: {
                                totalNodes: dagInstance.nodes.size,
                                completedNodes: completedNodes,
                                failedNodes: failedNodes,
                                totalTimeMs: (_q = (_p = job.result) === null || _p === void 0 ? void 0 : _p.totalTimeMs) !== null && _q !== void 0 ? _q : 0,
                                tokensUsed: tokensUsed,
                                eventsReceived: events.length,
                            },
                        }];
            }
        });
    });
}
// =============================================================================
// Simple Linear Demo
// =============================================================================
function runSimpleHTTPAPIDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var builder, dagInstance, runtime, jobId, job;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('\n🎯 Simple HTTP API Demo: Linear A → B → C\n');
                    builder = (0, builder_1.dag)('simple-http-api-demo')
                        .description('Simple linear workflow via HTTP API');
                    builder
                        .skillNode('step-a', 'python-pro')
                        .name('Step A')
                        .prompt('Generate a Python hello world function')
                        .done();
                    builder
                        .skillNode('step-b', 'code-reviewer')
                        .name('Step B')
                        .prompt('Review the generated code for best practices')
                        .dependsOn('step-a')
                        .done();
                    builder
                        .skillNode('step-c', 'technical-writer')
                        .name('Step C')
                        .prompt('Write documentation for the code')
                        .dependsOn('step-b')
                        .done();
                    dagInstance = builder.build();
                    runtime = new http_api_1.HTTPAPIRuntime({
                        clientFactory: function () { return (0, http_api_1.createMockAPIClient)(); },
                    });
                    return [4 /*yield*/, runtime.submitJob(dagInstance)];
                case 1:
                    jobId = _d.sent();
                    console.log("  \uD83D\uDCE4 Job submitted: ".concat(jobId));
                    runtime.subscribe(jobId, function (event) {
                        if (event.type === 'node:start') {
                            console.log("  \u25B6\uFE0F  ".concat(event.data.nodeId));
                        }
                        else if (event.type === 'node:complete') {
                            console.log("  \u2705 ".concat(event.data.nodeId));
                        }
                    });
                    _d.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 3:
                    job = _d.sent();
                    if (!job || job.status === 'completed' || job.status === 'failed')
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\nResult: ".concat((job === null || job === void 0 ? void 0 : job.status) === 'completed' ? 'SUCCESS' : 'FAILED'));
                    console.log("Time: ".concat((_b = (_a = job === null || job === void 0 ? void 0 : job.result) === null || _a === void 0 ? void 0 : _a.totalTimeMs) !== null && _b !== void 0 ? _b : 0, "ms"));
                    return [2 /*return*/, (_c = job === null || job === void 0 ? void 0 : job.result) !== null && _c !== void 0 ? _c : null];
            }
        });
    });
}
// =============================================================================
// Parallel Execution Demo
// =============================================================================
function runParallelHTTPAPIDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var builder, dagInstance, runtime, jobId, job, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('\n🔀 Parallel HTTP API Demo: Fan-out/Fan-in with Job Queue\n');
                    console.log('    [start]');
                    console.log('   /   |   \\');
                    console.log('  A    B    C   (parallel via worker pool)');
                    console.log('   \\   |   /');
                    console.log('    [merge]\n');
                    builder = (0, builder_1.dag)('parallel-http-api-demo')
                        .description('Fan-out/fan-in pattern via HTTP API');
                    builder
                        .skillNode('start', 'graph-builder')
                        .name('Start')
                        .prompt('Initialize the workflow')
                        .done();
                    ['task-a', 'task-b', 'task-c'].forEach(function (id, i) {
                        builder
                            .skillNode(id, 'python-pro')
                            .name("Task ".concat(String.fromCharCode(65 + i)))
                            .prompt("Execute parallel task ".concat(String.fromCharCode(65 + i)))
                            .dependsOn('start')
                            .done();
                    });
                    builder
                        .skillNode('merge', 'result-aggregator')
                        .name('Merge Results')
                        .prompt('Combine results from all parallel tasks')
                        .dependsOn('task-a', 'task-b', 'task-c')
                        .done();
                    dagInstance = builder.build();
                    runtime = new http_api_1.HTTPAPIRuntime({
                        maxParallelCallsPerJob: 3, // Allow all parallel tasks to run simultaneously
                        clientFactory: function () { return (0, http_api_1.createMockAPIClient)(); },
                    });
                    return [4 /*yield*/, runtime.submitJob(dagInstance)];
                case 1:
                    jobId = _b.sent();
                    runtime.subscribe(jobId, function (event) {
                        if (event.type === 'wave:start') {
                            console.log("  \uD83C\uDF0A Wave ".concat(event.data.waveIndex, ": ").concat(event.data.nodeIds.join(', ')));
                        }
                        else if (event.type === 'wave:complete') {
                            console.log("  \uD83C\uDFC1 Wave ".concat(event.data.waveIndex, " done"));
                        }
                    });
                    _b.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 3:
                    job = _b.sent();
                    if (!job || job.status === 'completed' || job.status === 'failed')
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 2];
                case 5:
                    result = job === null || job === void 0 ? void 0 : job.result;
                    console.log("\nResult: ".concat((job === null || job === void 0 ? void 0 : job.status) === 'completed' ? 'SUCCESS' : 'FAILED'));
                    console.log("Waves executed: ".concat((_a = result === null || result === void 0 ? void 0 : result.snapshot.totalWaves) !== null && _a !== void 0 ? _a : 0));
                    console.log("Tokens used: ".concat(result ? result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens : 0));
                    return [2 /*return*/, result !== null && result !== void 0 ? result : null];
            }
        });
    });
}
// =============================================================================
// Job Queue Demo
// =============================================================================
function runJobQueueDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var runtime, createSimpleDAG, jobIds, i, jobId, completedJobs, jobs, _i, jobs_1, job;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📋 Job Queue Demo: Multiple Concurrent Jobs\n');
                    runtime = new http_api_1.HTTPAPIRuntime({
                        maxConcurrentJobs: 2,
                        clientFactory: function () { return (0, http_api_1.createMockAPIClient)(); },
                    });
                    createSimpleDAG = function (id) {
                        var builder = (0, builder_1.dag)("queue-test-".concat(id))
                            .description("Test job ".concat(id));
                        builder
                            .skillNode('task', 'python-pro')
                            .name("Task ".concat(id))
                            .prompt("Execute task ".concat(id))
                            .done();
                        return builder.build();
                    };
                    jobIds = [];
                    console.log('  Submitting 5 jobs (max 2 concurrent)...');
                    i = 1;
                    _a.label = 1;
                case 1:
                    if (!(i <= 5)) return [3 /*break*/, 4];
                    return [4 /*yield*/, runtime.submitJob(createSimpleDAG("job-".concat(i)))];
                case 2:
                    jobId = _a.sent();
                    jobIds.push(jobId);
                    console.log("    \uD83D\uDCE4 Submitted: ".concat(jobId));
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    completedJobs = [];
                    runtime.subscribeAll(function (event) {
                        if (event.type === 'job:started') {
                            console.log("    \u25B6\uFE0F  Started: ".concat(event.jobId));
                        }
                        else if (event.type === 'job:completed') {
                            console.log("    \u2705 Completed: ".concat(event.jobId));
                            completedJobs.push(event.jobId);
                        }
                    });
                    // Wait for all jobs
                    console.log('\n  Waiting for all jobs to complete...');
                    _a.label = 5;
                case 5:
                    if (!(completedJobs.length < 5)) return [3 /*break*/, 7];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 7:
                    console.log("\n  \u2705 All ".concat(completedJobs.length, " jobs completed!"));
                    // List final job statuses
                    console.log('\n  Final Job Statuses:');
                    return [4 /*yield*/, runtime.listJobs()];
                case 8:
                    jobs = _a.sent();
                    for (_i = 0, jobs_1 = jobs; _i < jobs_1.length; _i++) {
                        job = jobs_1[_i];
                        console.log("    ".concat(job.id, ": ").concat(job.status));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// Event Subscription Demo
// =============================================================================
function runEventSubscriptionDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var runtime, builder, dagInstance, jobId, eventLog, unsubscribe, job, eventTypes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📡 Event Subscription Demo: Real-time Updates\n');
                    runtime = new http_api_1.HTTPAPIRuntime({
                        clientFactory: function () { return (0, http_api_1.createMockAPIClient)(); },
                    });
                    builder = (0, builder_1.dag)('event-demo')
                        .description('Event subscription demonstration');
                    builder
                        .skillNode('node-1', 'researcher')
                        .name('Node 1')
                        .prompt('Task 1')
                        .done();
                    builder
                        .skillNode('node-2', 'writer')
                        .name('Node 2')
                        .prompt('Task 2')
                        .dependsOn('node-1')
                        .done();
                    dagInstance = builder.build();
                    return [4 /*yield*/, runtime.submitJob(dagInstance)];
                case 1:
                    jobId = _a.sent();
                    eventLog = [];
                    unsubscribe = runtime.subscribe(jobId, function (event) {
                        var entry = "[".concat(event.type, "] ").concat(JSON.stringify(event.data));
                        eventLog.push(entry);
                        console.log("  \uD83D\uDCE5 ".concat(entry));
                    });
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 3:
                    job = _a.sent();
                    if (!job || job.status === 'completed' || job.status === 'failed')
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 2];
                case 5:
                    unsubscribe();
                    console.log("\n  \uD83D\uDCCA Total events captured: ".concat(eventLog.length));
                    console.log('  Event types received:');
                    eventTypes = new Set(eventLog.map(function (e) { var _a, _b; return (_b = (_a = e.match(/\[([^\]]+)\]/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ''; }));
                    eventTypes.forEach(function (type) { return console.log("    - ".concat(type)); });
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// Job Cancellation Demo
// =============================================================================
function runJobCancellationDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var slowClient, runtime, builder, dagInstance, jobId, cancelled, job;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🛑 Job Cancellation Demo\n');
                    slowClient = {
                        call: function (request) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                                        case 1:
                                            _a.sent(); // Slow!
                                            return [2 /*return*/, {
                                                    success: true,
                                                    content: JSON.stringify({ output: 'result', confidence: 0.9 }),
                                                    tokenUsage: { inputTokens: 100, outputTokens: 50 },
                                                }];
                                    }
                                });
                            });
                        },
                    };
                    runtime = new http_api_1.HTTPAPIRuntime({
                        clientFactory: function () { return slowClient; },
                    });
                    builder = (0, builder_1.dag)('cancel-demo')
                        .description('Cancellation test');
                    builder
                        .skillNode('slow-task', 'researcher')
                        .name('Slow Task')
                        .prompt('This will be cancelled')
                        .done();
                    dagInstance = builder.build();
                    return [4 /*yield*/, runtime.submitJob(dagInstance)];
                case 1:
                    jobId = _a.sent();
                    console.log("  \uD83D\uDCE4 Submitted slow job: ".concat(jobId));
                    // Wait a bit then cancel
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 2:
                    // Wait a bit then cancel
                    _a.sent();
                    console.log('  🛑 Cancelling job...');
                    return [4 /*yield*/, runtime.cancelJob(jobId)];
                case 3:
                    cancelled = _a.sent();
                    console.log("  Result: ".concat(cancelled ? 'Cancelled successfully' : 'Could not cancel'));
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 4:
                    job = _a.sent();
                    console.log("  Final status: ".concat(job === null || job === void 0 ? void 0 : job.status));
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// Error Handling Demo
// =============================================================================
function runErrorHandlingDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var callCount, failingClient, runtime, builder, dagInstance, jobId, job;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('\n⚠️  Error Handling Demo: API Failure Recovery\n');
                    callCount = 0;
                    failingClient = {
                        call: function (request) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    callCount++;
                                    if (callCount === 2) {
                                        return [2 /*return*/, {
                                                success: false,
                                                content: '',
                                                tokenUsage: { inputTokens: 0, outputTokens: 0 },
                                                error: 'Simulated API error: Rate limit exceeded',
                                            }];
                                    }
                                    return [2 /*return*/, {
                                            success: true,
                                            content: JSON.stringify({ output: 'success', confidence: 0.9 }),
                                            tokenUsage: { inputTokens: 100, outputTokens: 50 },
                                        }];
                                });
                            });
                        },
                    };
                    runtime = new http_api_1.HTTPAPIRuntime({
                        clientFactory: function () { return failingClient; },
                    });
                    builder = (0, builder_1.dag)('error-demo')
                        .description('Error handling test');
                    builder
                        .skillNode('will-succeed', 'researcher')
                        .name('Will Succeed')
                        .prompt('This succeeds')
                        .done();
                    builder
                        .skillNode('will-fail', 'writer')
                        .name('Will Fail')
                        .prompt('This fails')
                        .dependsOn('will-succeed')
                        .done();
                    dagInstance = builder.build();
                    return [4 /*yield*/, runtime.submitJob(dagInstance)];
                case 1:
                    jobId = _d.sent();
                    runtime.subscribe(jobId, function (event) {
                        if (event.type === 'node:complete') {
                            console.log("  \u2705 ".concat(event.data.nodeId, " completed"));
                        }
                        else if (event.type === 'node:error') {
                            console.log("  \u274C ".concat(event.data.nodeId, " failed: ").concat(event.data.error));
                        }
                    });
                    _d.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 3:
                    job = _d.sent();
                    if (!job || job.status === 'completed' || job.status === 'failed')
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 2];
                case 5:
                    console.log('');
                    console.log('Error Handling Results:');
                    console.log("  Job status: ".concat(job === null || job === void 0 ? void 0 : job.status));
                    console.log("  Errors captured: ".concat((_b = (_a = job === null || job === void 0 ? void 0 : job.result) === null || _a === void 0 ? void 0 : _a.errors.length) !== null && _b !== void 0 ? _b : 0));
                    (_c = job === null || job === void 0 ? void 0 : job.result) === null || _c === void 0 ? void 0 : _c.errors.forEach(function (error) {
                        console.log("    - ".concat(error.code, ": ").concat(error.message));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// Cleanup Demo
// =============================================================================
function runCleanupDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var stateStore, runtime, builder, dagInstance, jobIds, i, jobId, jobs, cleaned;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧹 Cleanup Demo: Old Job Removal\n');
                    stateStore = new http_api_1.InMemoryStateStore();
                    runtime = new http_api_1.HTTPAPIRuntime({
                        stateStore: stateStore,
                        clientFactory: function () { return (0, http_api_1.createMockAPIClient)(); },
                    });
                    // Submit several jobs
                    console.log('  Submitting test jobs...');
                    builder = (0, builder_1.dag)('cleanup-test').description('Test');
                    builder.skillNode('task', 'researcher').name('Task').prompt('Test').done();
                    dagInstance = builder.build();
                    jobIds = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 3)) return [3 /*break*/, 4];
                    return [4 /*yield*/, runtime.submitJob(dagInstance)];
                case 2:
                    jobId = _a.sent();
                    jobIds.push(jobId);
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: 
                // Wait for completion
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 5:
                    // Wait for completion
                    _a.sent();
                    return [4 /*yield*/, runtime.listJobs()];
                case 6:
                    jobs = _a.sent();
                    console.log("  Jobs before cleanup: ".concat(jobs.length));
                    return [4 /*yield*/, runtime.cleanupOldJobs(0)];
                case 7:
                    cleaned = _a.sent();
                    console.log("  Cleaned up: ".concat(cleaned, " jobs"));
                    return [4 /*yield*/, runtime.listJobs()];
                case 8:
                    jobs = _a.sent();
                    console.log("  Jobs after cleanup: ".concat(jobs.length));
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// Main Entry Point
// =============================================================================
function runAllHTTPAPIDemos() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('╔═══════════════════════════════════════════════════════════════╗');
                    console.log('║     HTTP API Runtime - Integration Demos                      ║');
                    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
                    return [4 /*yield*/, runSimpleHTTPAPIDemo()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, runParallelHTTPAPIDemo()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, runJobQueueDemo()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, runEventSubscriptionDemo()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, runJobCancellationDemo()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, runErrorHandlingDemo()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, runCleanupDemo()];
                case 7:
                    _a.sent();
                    console.log('\n');
                    console.log('╔═══════════════════════════════════════════════════════════════╗');
                    console.log('║     Full Research Workflow Demo                               ║');
                    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
                    return [4 /*yield*/, runHTTPAPIDemo({
                            topic: 'Modern approaches to AI-assisted code review',
                            verbose: true,
                        })];
                case 8:
                    _a.sent();
                    console.log('\n🎉 All HTTP API demos completed!');
                    return [2 /*return*/];
            }
        });
    });
}

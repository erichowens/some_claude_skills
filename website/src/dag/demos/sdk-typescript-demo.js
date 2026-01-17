"use strict";
/**
 * Integration Demo: SDK TypeScript Runtime
 *
 * This demo showcases the DAG execution framework using the SDK TypeScript runtime.
 * Unlike the Claude Code CLI runtime which uses the Task tool for spawning agents,
 * the SDK runtime makes direct API calls using the @anthropic-ai/sdk package.
 *
 * Key Differences from CLI Runtime:
 * - Direct API calls instead of Task tool spawning
 * - Explicit message passing between nodes
 * - Promise.all() for parallel execution
 * - Full control over API parameters
 *
 * DAG Structure (same as CLI demo for comparison):
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
exports.createCustomResponseClient = createCustomResponseClient;
exports.runSDKTypescriptDemo = runSDKTypescriptDemo;
exports.runSimpleSDKDemo = runSimpleSDKDemo;
exports.runParallelSDKDemo = runParallelSDKDemo;
exports.runAPIComparisonDemo = runAPIComparisonDemo;
exports.runErrorHandlingDemo = runErrorHandlingDemo;
exports.runAllSDKDemos = runAllSDKDemos;
var builder_1 = require("../core/builder");
var sdk_typescript_1 = require("../runtimes/sdk-typescript");
var presets_1 = require("../permissions/presets");
var DEFAULT_CONFIG = {
    topic: 'The impact of AI on software development workflows',
    verbose: true,
    useRealAPI: false, // Use mock client by default for demos
    permissions: 'standard',
    maxParallelCalls: 3,
    defaultModel: 'sonnet',
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
    var builder = (0, builder_1.dag)('sdk-research-workflow')
        .description("SDK Research workflow for: ".concat(topic));
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
// Custom Response Client (for demos with custom behavior)
// =============================================================================
function createCustomResponseClient(responseGenerator) {
    var callCount = 0;
    return {
        messages: {
            create: function (params) {
                return __awaiter(this, void 0, void 0, function () {
                    var userMessage, nodeIdMatch, nodeId, responseText;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                callCount++;
                                userMessage = ((_a = params.messages[0]) === null || _a === void 0 ? void 0 : _a.content) || '';
                                nodeIdMatch = userMessage.match(/Node ID: (\S+)/);
                                nodeId = nodeIdMatch ? nodeIdMatch[1] : "node-".concat(callCount);
                                responseText = responseGenerator
                                    ? responseGenerator(nodeId, userMessage)
                                    : JSON.stringify({
                                        output: {
                                            result: "Simulated result for ".concat(nodeId),
                                            data: { processed: true, timestamp: Date.now() },
                                        },
                                        confidence: 0.85 + Math.random() * 0.1,
                                        reasoning: "Analysis completed for ".concat(nodeId, " using ").concat(params.model),
                                    });
                                // Simulate API latency
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50 + Math.random() * 100); })];
                            case 1:
                                // Simulate API latency
                                _b.sent();
                                return [2 /*return*/, {
                                        id: "msg_sdk_demo_".concat(Date.now(), "_").concat(callCount),
                                        type: 'message',
                                        role: 'assistant',
                                        content: [{ type: 'text', text: responseText }],
                                        model: params.model,
                                        stop_reason: 'end_turn',
                                        stop_sequence: null,
                                        usage: {
                                            input_tokens: Math.floor(100 + Math.random() * 200),
                                            output_tokens: Math.floor(50 + Math.random() * 150),
                                        },
                                    }];
                        }
                    });
                });
            },
        },
    };
}
// =============================================================================
// Run Main Demo
// =============================================================================
function runSDKTypescriptDemo() {
    return __awaiter(this, arguments, void 0, function (config) {
        var finalConfig, _a, log, logs, apiCallCount, dagInstance, client, permissions, runtimeConfig, runtime, plan, result, completedNodes, failedNodes, _i, _b, _c, state, _d, _e, name_1, _f, _g, error;
        if (config === void 0) { config = {}; }
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    finalConfig = __assign(__assign({}, DEFAULT_CONFIG), config);
                    _a = createEventLogger(finalConfig.verbose), log = _a.log, logs = _a.logs;
                    apiCallCount = 0;
                    log('═══════════════════════════════════════════════════════════════');
                    log('  SDK TypeScript Runtime - Integration Demo');
                    log('═══════════════════════════════════════════════════════════════');
                    log("Topic: ".concat(finalConfig.topic));
                    log("API Mode: ".concat(finalConfig.useRealAPI ? 'REAL API' : 'Mock Client'));
                    log("Max Parallel: ".concat(finalConfig.maxParallelCalls));
                    log("Default Model: ".concat(finalConfig.defaultModel));
                    log('');
                    // Build the DAG
                    log('📊 Building DAG...');
                    dagInstance = buildResearchDAG(finalConfig.topic);
                    log("   Created DAG with ".concat(dagInstance.nodes.size, " nodes"));
                    // Log the execution plan
                    log('');
                    log('📋 Execution Plan:');
                    log('   Wave 0: research-topic, gather-examples (parallel via Promise.all)');
                    log('   Wave 1: analyze-findings');
                    log('   Wave 2: generate-report');
                    log('   Wave 3: create-summary');
                    log('');
                    client = finalConfig.useRealAPI
                        ? undefined // SDK runtime will require actual client
                        : createCustomResponseClient();
                    permissions = (0, presets_1.getPreset)(finalConfig.permissions);
                    runtimeConfig = {
                        client: client,
                        permissions: permissions,
                        maxParallelCalls: finalConfig.maxParallelCalls,
                        defaultModel: finalConfig.defaultModel === 'haiku'
                            ? 'claude-3-haiku-20240307'
                            : finalConfig.defaultModel === 'opus'
                                ? 'claude-opus-4-20250514'
                                : 'claude-sonnet-4-20250514',
                        onNodeStart: function (nodeId) {
                            log("\u25B6\uFE0F  Starting: ".concat(nodeId));
                        },
                        onNodeComplete: function (nodeId, result) {
                            var _a;
                            log("\u2705 Completed: ".concat(nodeId, " (confidence: ").concat(((_a = result.confidence) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'N/A', ")"));
                        },
                        onNodeError: function (nodeId, error) {
                            log("\u274C Failed: ".concat(nodeId, " - ").concat(error.message));
                        },
                        onWaveStart: function (waveNum, nodeIds) {
                            log("\uD83C\uDF0A Wave ".concat(waveNum, " starting with ").concat(nodeIds.length, " nodes"));
                        },
                        onWaveComplete: function (waveNum) {
                            log("\uD83C\uDFC1 Wave ".concat(waveNum, " completed"));
                        },
                        onAPICall: function (nodeId, params) {
                            apiCallCount++;
                            log("\uD83D\uDCE1 API Call #".concat(apiCallCount, ": ").concat(nodeId, " \u2192 ").concat(params.model));
                        },
                        onAPIResponse: function (nodeId, response) {
                            log("\uD83D\uDCE5 Response: ".concat(nodeId, " (").concat(response.usage.input_tokens, "+").concat(response.usage.output_tokens, " tokens)"));
                        },
                    };
                    // Create runtime and execute
                    log('🚀 Starting execution...');
                    log('');
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime(runtimeConfig);
                    plan = runtime.generateExecutionPlan(dagInstance);
                    log("\uD83D\uDCCB Execution plan generated: ".concat(plan.totalWaves, " waves, ").concat(plan.totalNodes, " nodes"));
                    log('');
                    return [4 /*yield*/, runtime.execute(dagInstance, { topic: finalConfig.topic })];
                case 1:
                    result = _h.sent();
                    // Log results
                    log('');
                    log('═══════════════════════════════════════════════════════════════');
                    log('  Execution Complete');
                    log('═══════════════════════════════════════════════════════════════');
                    log("Status: ".concat(result.success ? '✅ SUCCESS' : '❌ FAILED'));
                    log("Total time: ".concat(result.totalTimeMs, "ms"));
                    log("API Calls: ".concat(apiCallCount));
                    log("Tokens used: ".concat(result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens));
                    log('');
                    completedNodes = 0;
                    failedNodes = 0;
                    for (_i = 0, _b = result.snapshot.nodeStates; _i < _b.length; _i++) {
                        _c = _b[_i], state = _c[1];
                        if (state.status === 'completed')
                            completedNodes++;
                        if (state.status === 'failed')
                            failedNodes++;
                    }
                    log('📈 Metrics:');
                    log("   Nodes completed: ".concat(completedNodes, "/").concat(dagInstance.nodes.size));
                    log("   Nodes failed: ".concat(failedNodes));
                    log("   Input tokens: ".concat(result.totalTokenUsage.inputTokens));
                    log("   Output tokens: ".concat(result.totalTokenUsage.outputTokens));
                    if (result.outputs.size > 0) {
                        log('');
                        log('📤 Outputs:');
                        for (_d = 0, _e = result.outputs; _d < _e.length; _d++) {
                            name_1 = _e[_d][0];
                            log("   - ".concat(name_1, ": [generated]"));
                        }
                    }
                    if (result.errors.length > 0) {
                        log('');
                        log('⚠️  Errors:');
                        for (_f = 0, _g = result.errors; _f < _g.length; _f++) {
                            error = _g[_f];
                            log("   - ".concat(error.code, ": ").concat(error.message));
                        }
                    }
                    return [2 /*return*/, {
                            result: result,
                            logs: logs,
                            metrics: {
                                totalNodes: dagInstance.nodes.size,
                                completedNodes: completedNodes,
                                failedNodes: failedNodes,
                                totalTimeMs: result.totalTimeMs,
                                tokensUsed: result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens,
                                apiCalls: apiCallCount,
                            },
                        }];
            }
        });
    });
}
// =============================================================================
// Simple Linear Demo
// =============================================================================
function runSimpleSDKDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var builder, dagInstance, runtime, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🎯 Simple SDK Demo: Linear A → B → C\n');
                    builder = (0, builder_1.dag)('simple-sdk-demo')
                        .description('Simple linear workflow via SDK');
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
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                        client: (0, sdk_typescript_1.createMockClient)(),
                        onNodeStart: function (id) { return console.log("  \u25B6\uFE0F  ".concat(id)); },
                        onNodeComplete: function (id) { return console.log("  \u2705 ".concat(id)); },
                    });
                    return [4 /*yield*/, runtime.execute(dagInstance)];
                case 1:
                    result = _a.sent();
                    console.log("\nResult: ".concat(result.success ? 'SUCCESS' : 'FAILED'));
                    console.log("Time: ".concat(result.totalTimeMs, "ms"));
                    return [2 /*return*/, result];
            }
        });
    });
}
// =============================================================================
// Parallel Execution Demo
// =============================================================================
function runParallelSDKDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var builder, dagInstance, runtime, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🔀 Parallel SDK Demo: Fan-out/Fan-in with Promise.all\n');
                    console.log('    [start]');
                    console.log('   /   |   \\');
                    console.log('  A    B    C   (Promise.all)');
                    console.log('   \\   |   /');
                    console.log('    [merge]\n');
                    builder = (0, builder_1.dag)('parallel-sdk-demo')
                        .description('Fan-out/fan-in pattern via SDK');
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
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                        client: (0, sdk_typescript_1.createMockClient)(),
                        maxParallelCalls: 3, // Allow all parallel tasks to run simultaneously
                        onWaveStart: function (wave, nodes) { return console.log("  \uD83C\uDF0A Wave ".concat(wave, ": ").concat(nodes.join(', '))); },
                        onWaveComplete: function (wave) { return console.log("  \uD83C\uDFC1 Wave ".concat(wave, " done")); },
                        onAPICall: function (nodeId) { return console.log("  \uD83D\uDCE1 API call: ".concat(nodeId)); },
                    });
                    return [4 /*yield*/, runtime.execute(dagInstance)];
                case 1:
                    result = _a.sent();
                    console.log("\nResult: ".concat(result.success ? 'SUCCESS' : 'FAILED'));
                    console.log("Waves executed: ".concat(result.snapshot.totalWaves));
                    console.log("Tokens used: ".concat(result.totalTokenUsage.inputTokens + result.totalTokenUsage.outputTokens));
                    return [2 /*return*/, result];
            }
        });
    });
}
// =============================================================================
// API Call Comparison Demo
// =============================================================================
function runAPIComparisonDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var builder, dagInstance, apiCalls, apiResponses, runtime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📊 API Comparison Demo: SDK vs CLI Runtime Characteristics\n');
                    builder = (0, builder_1.dag)('comparison-demo')
                        .description('Compare SDK runtime behavior');
                    builder
                        .skillNode('node-1', 'researcher')
                        .name('Node 1')
                        .prompt('Research task')
                        .done();
                    builder
                        .skillNode('node-2', 'researcher')
                        .name('Node 2')
                        .prompt('Analysis task')
                        .dependsOn('node-1')
                        .done();
                    dagInstance = builder.build();
                    apiCalls = [];
                    apiResponses = [];
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                        client: (0, sdk_typescript_1.createMockClient)(),
                        onAPICall: function (nodeId, params) {
                            apiCalls.push({
                                nodeId: nodeId,
                                timestamp: Date.now(),
                                model: params.model,
                            });
                        },
                        onAPIResponse: function (nodeId, response) {
                            apiResponses.push({
                                nodeId: nodeId,
                                timestamp: Date.now(),
                                tokens: response.usage.input_tokens + response.usage.output_tokens,
                            });
                        },
                    });
                    return [4 /*yield*/, runtime.execute(dagInstance)];
                case 1:
                    _a.sent();
                    console.log('SDK Runtime Characteristics:');
                    console.log('  ✓ Direct API calls (no Task tool intermediary)');
                    console.log('  ✓ Full control over message structure');
                    console.log('  ✓ Explicit token tracking per call');
                    console.log('  ✓ Promise.all() for parallel execution');
                    console.log('');
                    console.log('API Call Log:');
                    apiCalls.forEach(function (call, i) {
                        console.log("  ".concat(i + 1, ". ").concat(call.nodeId, " \u2192 ").concat(call.model));
                    });
                    console.log('');
                    console.log('Token Usage:');
                    apiResponses.forEach(function (resp) {
                        console.log("  ".concat(resp.nodeId, ": ").concat(resp.tokens, " tokens"));
                    });
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
        var builder, dagInstance, callCount, failingClient, runtime, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n⚠️  Error Handling Demo: SDK Runtime Error Recovery\n');
                    builder = (0, builder_1.dag)('error-demo')
                        .description('Demonstrate error handling');
                    builder
                        .skillNode('success-node', 'researcher')
                        .name('Success Node')
                        .prompt('This will succeed')
                        .done();
                    builder
                        .skillNode('dependent-node', 'writer')
                        .name('Dependent Node')
                        .prompt('This depends on success')
                        .dependsOn('success-node')
                        .done();
                    dagInstance = builder.build();
                    callCount = 0;
                    failingClient = {
                        messages: {
                            create: function (params) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        callCount++;
                                        if (callCount === 2) {
                                            throw new Error('Simulated API failure: Rate limit exceeded');
                                        }
                                        return [2 /*return*/, {
                                                id: "msg_".concat(Date.now()),
                                                type: 'message',
                                                role: 'assistant',
                                                content: [
                                                    {
                                                        type: 'text',
                                                        text: JSON.stringify({ output: { result: 'success' }, confidence: 0.9 }),
                                                    },
                                                ],
                                                model: params.model,
                                                stop_reason: 'end_turn',
                                                stop_sequence: null,
                                                usage: { input_tokens: 100, output_tokens: 50 },
                                            }];
                                    });
                                });
                            },
                        },
                    };
                    runtime = new sdk_typescript_1.SDKTypescriptRuntime({
                        client: failingClient,
                        onNodeComplete: function (id) { return console.log("  \u2705 ".concat(id, " completed")); },
                        onNodeError: function (id, error) { return console.log("  \u274C ".concat(id, " failed: ").concat(error.message)); },
                    });
                    return [4 /*yield*/, runtime.execute(dagInstance)];
                case 1:
                    result = _a.sent();
                    console.log('');
                    console.log('Error Handling Results:');
                    console.log("  Success: ".concat(result.success));
                    console.log("  Errors captured: ".concat(result.errors.length));
                    result.errors.forEach(function (error) {
                        console.log("    - ".concat(error.code, ": ").concat(error.message));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// Main Entry Point
// =============================================================================
function runAllSDKDemos() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('╔═══════════════════════════════════════════════════════════════╗');
                    console.log('║     SDK TypeScript Runtime - Integration Demos                ║');
                    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
                    return [4 /*yield*/, runSimpleSDKDemo()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, runParallelSDKDemo()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, runAPIComparisonDemo()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, runErrorHandlingDemo()];
                case 4:
                    _a.sent();
                    console.log('\n');
                    console.log('╔═══════════════════════════════════════════════════════════════╗');
                    console.log('║     Full Research Workflow Demo                               ║');
                    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
                    return [4 /*yield*/, runSDKTypescriptDemo({
                            topic: 'Modern approaches to AI-assisted code review',
                            verbose: true,
                        })];
                case 5:
                    _a.sent();
                    console.log('\n🎉 All SDK demos completed!');
                    return [2 /*return*/];
            }
        });
    });
}

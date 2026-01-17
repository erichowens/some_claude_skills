"use strict";
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
exports.SDKTypescriptRuntime = void 0;
exports.createSDKRuntime = createSDKRuntime;
exports.createMockClient = createMockClient;
var types_1 = require("../types");
var topology_1 = require("../core/topology");
var state_manager_1 = require("../core/state-manager");
var enforcer_1 = require("../permissions/enforcer");
var presets_1 = require("../permissions/presets");
/**
 * Model ID mapping from simple names to full model IDs
 */
var MODEL_MAP = {
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
var SDKTypescriptRuntime = /** @class */ (function () {
    function SDKTypescriptRuntime(config) {
        if (config === void 0) { config = {}; }
        this.stateManager = null;
        this.config = {
            client: config.client || null,
            apiKey: config.apiKey || null,
            permissions: config.permissions || (0, presets_1.getPreset)('standard'),
            maxParallelCalls: config.maxParallelCalls || 5,
            defaultModel: config.defaultModel || 'claude-sonnet-4-20250514',
            defaultMaxTokens: config.defaultMaxTokens || 4096,
            systemPromptTemplate: config.systemPromptTemplate || this.getDefaultSystemPrompt(),
            tools: config.tools || [],
            onNodeStart: config.onNodeStart || (function () { }),
            onNodeComplete: config.onNodeComplete || (function () { }),
            onNodeError: config.onNodeError || (function () { }),
            onWaveStart: config.onWaveStart || (function () { }),
            onWaveComplete: config.onWaveComplete || (function () { }),
            onAPICall: config.onAPICall || (function () { }),
            onAPIResponse: config.onAPIResponse || (function () { }),
        };
        this.enforcer = new enforcer_1.PermissionEnforcer(this.config.permissions);
    }
    /**
     * Execute a DAG and return the result
     */
    SDKTypescriptRuntime.prototype.execute = function (dag, inputs) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, context, sortResult, waves, _i, waves_1, wave, waveResults, failures, criticalFailure;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        context = this.createExecutionContext(dag, inputs);
                        // Initialize state manager
                        this.stateManager = new state_manager_1.StateManager({
                            dag: dag,
                            executionId: context.executionId,
                            validateTransitions: true,
                            emitEvents: true,
                        });
                        // Start execution
                        this.stateManager.startExecution();
                        sortResult = (0, topology_1.topologicalSort)(dag);
                        if (!sortResult.success) {
                            return [2 /*return*/, this.createFailureResult(dag, startTime, {
                                    code: 'CYCLE_DETECTED',
                                    message: "Cycle detected in DAG: ".concat((_a = sortResult.cycle) === null || _a === void 0 ? void 0 : _a.join(' -> ')),
                                    sourceNodeId: (_b = sortResult.cycle) === null || _b === void 0 ? void 0 : _b[0],
                                    retryable: false,
                                })];
                        }
                        waves = sortResult.waves;
                        _i = 0, waves_1 = waves;
                        _c.label = 1;
                    case 1:
                        if (!(_i < waves_1.length)) return [3 /*break*/, 4];
                        wave = waves_1[_i];
                        // Update ready nodes before processing
                        this.stateManager.updateReadyNodes();
                        this.config.onWaveStart(wave.waveNumber, wave.nodeIds);
                        return [4 /*yield*/, this.executeWave(dag, wave.nodeIds, context)];
                    case 2:
                        waveResults = _c.sent();
                        this.config.onWaveComplete(wave.waveNumber, waveResults);
                        failures = this.checkWaveFailures(wave.nodeIds, waveResults);
                        if (failures.length > 0) {
                            criticalFailure = failures.find(function (f) { return f.critical; });
                            if (criticalFailure) {
                                return [2 /*return*/, this.createFailureResult(dag, startTime, criticalFailure.error)];
                            }
                        }
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Aggregate results
                    return [2 /*return*/, this.createSuccessResult(dag, startTime, context)];
                }
            });
        });
    };
    /**
     * Execute a wave of nodes using Promise.all
     */
    SDKTypescriptRuntime.prototype.executeWave = function (dag, nodeIds, context) {
        return __awaiter(this, void 0, void 0, function () {
            var results, chunks, _loop_1, _i, chunks_1, chunk;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = new Map();
                        chunks = this.chunkArray(nodeIds, this.config.maxParallelCalls);
                        _loop_1 = function (chunk) {
                            var promises, chunkResults;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        promises = chunk.map(function (nodeId) {
                                            return _this.executeNode(dag, nodeId, context);
                                        });
                                        return [4 /*yield*/, Promise.allSettled(promises)];
                                    case 1:
                                        chunkResults = _b.sent();
                                        // Process results
                                        chunkResults.forEach(function (result, index) {
                                            var nodeId = chunk[index];
                                            if (result.status === 'fulfilled' && result.value) {
                                                results.set(nodeId, result.value);
                                                context.nodeResults.set(nodeId, result.value);
                                            }
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, chunks_1 = chunks;
                        _a.label = 1;
                    case 1:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 4];
                        chunk = chunks_1[_i];
                        return [5 /*yield**/, _loop_1(chunk)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Execute a single node
     */
    SDKTypescriptRuntime.prototype.executeNode = function (dag, nodeId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var node, messages, systemPrompt, model, params, response, result, error_1, taskError;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        node = dag.nodes.get(nodeId);
                        if (!node)
                            return [2 /*return*/, null];
                        this.config.onNodeStart(nodeId, node);
                        (_a = this.stateManager) === null || _a === void 0 ? void 0 : _a.markNodeStarted(nodeId);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        messages = this.buildMessages(node, context);
                        systemPrompt = this.buildSystemPrompt(node, context);
                        model = this.selectModel(node);
                        params = {
                            model: model,
                            max_tokens: node.config.maxTokens || this.config.defaultMaxTokens,
                            system: systemPrompt,
                            messages: messages,
                            tools: this.config.tools.length > 0 ? this.config.tools : undefined,
                        };
                        this.config.onAPICall(nodeId, params);
                        return [4 /*yield*/, this.callAPI(params)];
                    case 2:
                        response = _d.sent();
                        this.config.onAPIResponse(nodeId, response);
                        result = this.parseResponse(nodeId, response);
                        // Store conversation for potential multi-turn
                        context.conversationHistory.set(nodeId, __spreadArray(__spreadArray([], messages, true), [
                            { role: 'assistant', content: response.content },
                        ], false));
                        (_b = this.stateManager) === null || _b === void 0 ? void 0 : _b.markNodeCompleted(nodeId, result);
                        this.config.onNodeComplete(nodeId, result);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _d.sent();
                        taskError = {
                            code: 'MODEL_ERROR',
                            message: error_1 instanceof Error ? error_1.message : String(error_1),
                            sourceNodeId: nodeId,
                            retryable: true,
                            cause: error_1,
                        };
                        (_c = this.stateManager) === null || _c === void 0 ? void 0 : _c.markNodeFailed(nodeId, taskError);
                        this.config.onNodeError(nodeId, taskError);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build messages array for the API call
     */
    SDKTypescriptRuntime.prototype.buildMessages = function (node, context) {
        var messages = [];
        var parts = [];
        // Add task description
        parts.push("## Task: ".concat(node.name || node.id));
        parts.push('');
        if (node.description) {
            parts.push(node.description);
            parts.push('');
        }
        // Add skill-specific instructions
        if (node.skillId) {
            parts.push("Execute the \"".concat(node.skillId, "\" skill."));
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
            for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
                var depId = _a[_i];
                var depResult = context.nodeResults.get(depId);
                if (depResult) {
                    parts.push("### ".concat(depId));
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
        parts.push(JSON.stringify({
            output: '/* your result data */',
            confidence: 0.95,
        }, null, 2));
        parts.push('```');
        messages.push({
            role: 'user',
            content: parts.join('\n'),
        });
        return messages;
    };
    /**
     * Build system prompt for the API call
     */
    SDKTypescriptRuntime.prototype.buildSystemPrompt = function (node, context) {
        var prompt = this.config.systemPromptTemplate;
        // Replace placeholders
        prompt = prompt.replace('{{NODE_ID}}', node.id);
        prompt = prompt.replace('{{NODE_NAME}}', node.name);
        prompt = prompt.replace('{{DAG_ID}}', context.dagId);
        prompt = prompt.replace('{{SKILL_ID}}', node.skillId || 'general');
        return prompt;
    };
    /**
     * Select the appropriate model for a node
     */
    SDKTypescriptRuntime.prototype.selectModel = function (node) {
        var _this = this;
        var _a;
        // Check node-specific config
        if (node.config.model) {
            return MODEL_MAP[node.config.model] || node.config.model;
        }
        // Check permissions
        var allowed = ((_a = this.config.permissions.models) === null || _a === void 0 ? void 0 : _a.allowed) || ['haiku', 'sonnet', 'opus'];
        if (!allowed.some(function (m) { return _this.config.defaultModel.includes(m); })) {
            var firstAllowed = allowed[0];
            return MODEL_MAP[firstAllowed] || this.config.defaultModel;
        }
        return this.config.defaultModel;
    };
    /**
     * Make the API call
     */
    SDKTypescriptRuntime.prototype.callAPI = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.config.client) {
                    return [2 /*return*/, this.config.client.messages.create(params)];
                }
                // If no client provided, simulate response for testing
                return [2 /*return*/, this.simulateAPIResponse(params)];
            });
        });
    };
    /**
     * Simulate API response (for testing without actual API calls)
     */
    SDKTypescriptRuntime.prototype.simulateAPIResponse = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var userMessage, content, simulatedOutput;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate network latency
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 1:
                        // Simulate network latency
                        _a.sent();
                        userMessage = params.messages.find(function (m) { return m.role === 'user'; });
                        content = typeof (userMessage === null || userMessage === void 0 ? void 0 : userMessage.content) === 'string'
                            ? userMessage.content
                            : '';
                        simulatedOutput = {
                            output: {
                                simulated: true,
                                model: params.model,
                                messageLength: content.length,
                                timestamp: new Date().toISOString(),
                            },
                            confidence: 0.9,
                        };
                        return [2 /*return*/, {
                                id: "msg_".concat(Date.now()),
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
                            }];
                }
            });
        });
    };
    /**
     * Parse API response into TaskResult
     */
    SDKTypescriptRuntime.prototype.parseResponse = function (nodeId, response) {
        // Extract text content
        var textBlock = response.content.find(function (block) { return block.type === 'text'; });
        var output = (textBlock === null || textBlock === void 0 ? void 0 : textBlock.text) || '';
        var confidence = 0.9;
        // Try to parse as JSON
        if (textBlock === null || textBlock === void 0 ? void 0 : textBlock.text) {
            try {
                var parsed = JSON.parse(textBlock.text);
                output = parsed.output !== undefined ? parsed.output : parsed;
                confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;
            }
            catch (_a) {
                // Keep as string if not valid JSON
                output = textBlock.text;
            }
        }
        return {
            output: output,
            confidence: confidence,
            tokenUsage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            },
            executionMetadata: {
                model: response.model,
                totalTurns: 1,
                toolCallCount: response.content.filter(function (c) { return c.type === 'tool_use'; }).length,
            },
        };
    };
    /**
     * Check for failures in a wave
     */
    SDKTypescriptRuntime.prototype.checkWaveFailures = function (nodeIds, results) {
        var failures = [];
        for (var _i = 0, nodeIds_1 = nodeIds; _i < nodeIds_1.length; _i++) {
            var nodeId = nodeIds_1[_i];
            var result = results.get(nodeId);
            if (!result) {
                failures.push({
                    nodeId: nodeId,
                    critical: true,
                    error: {
                        code: 'MODEL_ERROR',
                        message: "Node ".concat(nodeId, " failed to execute"),
                        sourceNodeId: nodeId,
                        retryable: false,
                    },
                });
            }
        }
        return failures;
    };
    /**
     * Create execution context
     */
    SDKTypescriptRuntime.prototype.createExecutionContext = function (dag, inputs) {
        var variables = new Map();
        if (inputs) {
            for (var _i = 0, _a = Object.entries(inputs); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                variables.set(key, value);
            }
        }
        return {
            dagId: dag.id,
            executionId: (0, types_1.ExecutionId)("sdk-exec-".concat(Date.now())),
            nodeResults: new Map(),
            variables: variables,
            startTime: new Date(),
            permissions: this.config.permissions,
            conversationHistory: new Map(),
        };
    };
    /**
     * Create success result
     */
    SDKTypescriptRuntime.prototype.createSuccessResult = function (dag, startTime, context) {
        var _a, _b, _c, _d;
        var outputs = new Map();
        for (var _i = 0, _e = dag.outputs; _i < _e.length; _i++) {
            var output = _e[_i];
            var sourceResult = context.nodeResults.get(output.sourceNodeId);
            if (sourceResult) {
                outputs.set(output.name, sourceResult.output);
            }
        }
        var totalTokenUsage = {
            inputTokens: 0,
            outputTokens: 0,
        };
        for (var _f = 0, _g = context.nodeResults; _f < _g.length; _f++) {
            var _h = _g[_f], result = _h[1];
            if (result.tokenUsage) {
                totalTokenUsage.inputTokens += result.tokenUsage.inputTokens;
                totalTokenUsage.outputTokens += result.tokenUsage.outputTokens;
            }
        }
        var sortResult = (0, topology_1.topologicalSort)(dag);
        var snapshot = {
            executionId: context.executionId,
            dagId: dag.id,
            startedAt: context.startTime,
            completedAt: new Date(),
            nodeStates: ((_b = (_a = this.stateManager) === null || _a === void 0 ? void 0 : _a.getSnapshot()) === null || _b === void 0 ? void 0 : _b.nodeStates) || new Map(),
            nodeOutputs: context.nodeResults,
            currentWave: ((_c = sortResult.waves) === null || _c === void 0 ? void 0 : _c.length) || 0,
            totalWaves: ((_d = sortResult.waves) === null || _d === void 0 ? void 0 : _d.length) || 0,
            status: 'completed',
            totalTokenUsage: totalTokenUsage,
            errors: [],
        };
        return {
            success: true,
            snapshot: snapshot,
            outputs: outputs,
            totalTokenUsage: totalTokenUsage,
            totalTimeMs: Date.now() - startTime,
            errors: [],
        };
    };
    /**
     * Create failure result
     */
    SDKTypescriptRuntime.prototype.createFailureResult = function (dag, startTime, error) {
        var _a, _b, _c;
        var sortResult = (0, topology_1.topologicalSort)(dag);
        var snapshot = {
            executionId: (0, types_1.ExecutionId)("sdk-exec-".concat(Date.now())),
            dagId: dag.id,
            startedAt: new Date(startTime),
            completedAt: new Date(),
            nodeStates: ((_b = (_a = this.stateManager) === null || _a === void 0 ? void 0 : _a.getSnapshot()) === null || _b === void 0 ? void 0 : _b.nodeStates) || new Map(),
            nodeOutputs: new Map(),
            currentWave: 0,
            totalWaves: ((_c = sortResult.waves) === null || _c === void 0 ? void 0 : _c.length) || 0,
            status: 'failed',
            totalTokenUsage: { inputTokens: 0, outputTokens: 0 },
            errors: [error],
        };
        return {
            success: false,
            snapshot: snapshot,
            outputs: new Map(),
            totalTokenUsage: { inputTokens: 0, outputTokens: 0 },
            totalTimeMs: Date.now() - startTime,
            errors: [error],
        };
    };
    /**
     * Get default system prompt template
     */
    SDKTypescriptRuntime.prototype.getDefaultSystemPrompt = function () {
        return "You are an AI assistant executing a task node in a DAG workflow.\n\nNode ID: {{NODE_ID}}\nNode Name: {{NODE_NAME}}\nDAG ID: {{DAG_ID}}\nSkill: {{SKILL_ID}}\n\nInstructions:\n1. Read the task description carefully\n2. Use any provided context and dependency results\n3. Execute the task to the best of your ability\n4. Return your response as structured JSON\n\nAlways be precise, thorough, and helpful.";
    };
    /**
     * Chunk array into smaller arrays
     */
    SDKTypescriptRuntime.prototype.chunkArray = function (array, size) {
        var chunks = [];
        for (var i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };
    /**
     * Generate execution plan (for debugging/planning)
     */
    SDKTypescriptRuntime.prototype.generateExecutionPlan = function (dag, inputs) {
        var _a;
        var context = this.createExecutionContext(dag, inputs);
        var sortResult = (0, topology_1.topologicalSort)(dag);
        if (!sortResult.success) {
            return {
                dagId: dag.id,
                dagName: dag.name,
                totalNodes: dag.nodes.size,
                totalWaves: 0,
                waves: [],
                error: "Cycle detected: ".concat((_a = sortResult.cycle) === null || _a === void 0 ? void 0 : _a.join(' -> ')),
            };
        }
        var waves = sortResult.waves;
        var plan = {
            dagId: dag.id,
            dagName: dag.name,
            totalNodes: dag.nodes.size,
            totalWaves: waves.length,
            waves: [],
        };
        for (var _i = 0, waves_2 = waves; _i < waves_2.length; _i++) {
            var wave = waves_2[_i];
            var nodePlans = [];
            for (var _b = 0, _c = wave.nodeIds; _b < _c.length; _b++) {
                var nodeId = _c[_b];
                var node = dag.nodes.get(nodeId);
                if (!node)
                    continue;
                nodePlans.push({
                    nodeId: nodeId,
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
    };
    return SDKTypescriptRuntime;
}());
exports.SDKTypescriptRuntime = SDKTypescriptRuntime;
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create an SDK TypeScript runtime
 */
function createSDKRuntime(config) {
    return new SDKTypescriptRuntime(config);
}
/**
 * Create a mock client for testing
 */
function createMockClient(responseOverride) {
    return {
        messages: {
            create: function (params) {
                return __awaiter(this, void 0, void 0, function () {
                    var defaultResponse;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10); })];
                            case 1:
                                _a.sent();
                                defaultResponse = {
                                    id: "msg_mock_".concat(Date.now()),
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
                                return [2 /*return*/, __assign(__assign({}, defaultResponse), responseOverride)];
                        }
                    });
                });
            },
        },
    };
}

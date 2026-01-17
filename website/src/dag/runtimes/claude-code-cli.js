"use strict";
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
exports.ClaudeCodeRuntime = void 0;
exports.createClaudeCodeRuntime = createClaudeCodeRuntime;
exports.formatTaskCall = formatTaskCall;
exports.generateParallelTaskMessage = generateParallelTaskMessage;
var types_1 = require("../types");
var topology_1 = require("../core/topology");
var state_manager_1 = require("../core/state-manager");
var enforcer_1 = require("../permissions/enforcer");
var presets_1 = require("../permissions/presets");
var conflict_detector_1 = require("../coordination/conflict-detector");
/**
 * Claude Code CLI Runtime
 *
 * This class orchestrates DAG execution within Claude Code using
 * pluggable executors. By default uses ProcessExecutor for zero
 * token overhead, but can use any executor.
 */
var ClaudeCodeRuntime = /** @class */ (function () {
    function ClaudeCodeRuntime(config) {
        if (config === void 0) { config = {}; }
        this.stateManager = null;
        this.config = {
            permissions: config.permissions || (0, presets_1.getPreset)('standard'),
            maxParallelTasks: config.maxParallelTasks || 5,
            defaultModel: config.defaultModel || 'sonnet',
            defaultMaxTurns: config.defaultMaxTurns || 10,
            runInBackground: config.runInBackground || false,
            onNodeStart: config.onNodeStart || (function () { }),
            onNodeComplete: config.onNodeComplete || (function () { }),
            onNodeError: config.onNodeError || (function () { }),
            onWaveStart: config.onWaveStart || (function () { }),
            onWaveComplete: config.onWaveComplete || (function () { }),
            onProgress: config.onProgress || (function () { }),
        };
        // Use provided executor or try to get default (null for simulated mode)
        this.executor = config.executor || null;
        this.enforcer = new enforcer_1.PermissionEnforcer(this.config.permissions);
    }
    /**
     * Get the current executor, or null if using simulation mode
     */
    ClaudeCodeRuntime.prototype.getExecutor = function () {
        return this.executor;
    };
    /**
     * Set the executor (allows runtime switching)
     */
    ClaudeCodeRuntime.prototype.setExecutor = function (executor) {
        this.executor = executor;
    };
    /**
     * Execute a DAG and return the result
     *
     * This method generates the sequence of Task tool calls needed to
     * execute the DAG. In actual Claude Code execution, these calls would
     * be made by the parent agent.
     */
    ClaudeCodeRuntime.prototype.execute = function (dag, inputs) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, context, sortResult, waves, _i, waves_1, wave, taskCalls, waveResults, failures, criticalFailure;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        context = this.createExecutionContext(dag, inputs);
                        // Initialize state manager for this DAG
                        this.stateManager = new state_manager_1.StateManager({
                            dag: dag,
                            executionId: context.executionId,
                            validateTransitions: true,
                            emitEvents: true,
                        });
                        // Start execution (initializes node states)
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
                        // Update ready nodes before processing this wave
                        this.stateManager.updateReadyNodes();
                        this.config.onWaveStart(wave.waveNumber, wave.nodeIds);
                        taskCalls = this.generateWaveTaskCalls(dag, wave.nodeIds, context);
                        return [4 /*yield*/, this.executeWave(dag, wave.nodeIds, taskCalls, context)];
                    case 2:
                        waveResults = _c.sent();
                        this.config.onWaveComplete(wave.waveNumber, waveResults);
                        failures = this.checkWaveFailures(dag, wave.nodeIds, waveResults);
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
     * Generate Task tool calls for a wave of nodes
     */
    ClaudeCodeRuntime.prototype.generateWaveTaskCalls = function (dag, nodeIds, context) {
        var calls = new Map();
        for (var _i = 0, nodeIds_1 = nodeIds; _i < nodeIds_1.length; _i++) {
            var nodeId = nodeIds_1[_i];
            var node = dag.nodes.get(nodeId);
            if (!node)
                continue;
            // Check permissions
            var permCheck = this.enforcer.check({
                type: 'tool',
                resource: 'Task',
                action: 'execute',
            });
            if (!permCheck.allowed) {
                console.warn("Task tool not allowed for node ".concat(nodeId));
                continue;
            }
            var call = this.generateTaskCall(node, context);
            calls.set(nodeId, call);
        }
        return calls;
    };
    /**
     * Generate a single Task tool call for a node
     */
    ClaudeCodeRuntime.prototype.generateTaskCall = function (node, context) {
        var prompt = this.buildPrompt(node, context);
        var subagentType = this.determineSubagentType(node);
        var model = this.selectModel(node);
        return {
            description: this.generateDescription(node),
            prompt: prompt,
            subagent_type: subagentType,
            model: model,
            max_turns: this.config.defaultMaxTurns,
            run_in_background: this.config.runInBackground,
        };
    };
    /**
     * Build the prompt for a node's Task call
     */
    ClaudeCodeRuntime.prototype.buildPrompt = function (node, context) {
        var parts = [];
        // Add task description
        parts.push("## Task: ".concat(node.id));
        parts.push('');
        // Add skill-specific instructions if available
        if (node.skillId) {
            parts.push("Execute the ".concat(node.skillId, " skill."));
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
            for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
                var depId = _a[_i];
                var depResult = context.nodeResults.get(depId);
                if (depResult) {
                    parts.push("### ".concat(depId));
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
    };
    /**
     * Determine the subagent type for a node
     */
    ClaudeCodeRuntime.prototype.determineSubagentType = function (node) {
        var _a;
        // If agentId is specified, use it
        if (node.agentId) {
            return node.agentId;
        }
        // Map node types to subagent types
        var typeMap = {
            skill: 'general-purpose',
            agent: 'general-purpose',
            'mcp-tool': 'general-purpose',
            composite: 'Plan',
            conditional: 'general-purpose',
        };
        // Check for skill-specific agent mappings
        if (node.skillId) {
            var skillAgentMap = {
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
        if ((_a = node.config.metadata) === null || _a === void 0 ? void 0 : _a.subagentType) {
            return node.config.metadata.subagentType;
        }
        return typeMap[node.type] || 'general-purpose';
    };
    /**
     * Select the appropriate model for a node
     */
    ClaudeCodeRuntime.prototype.selectModel = function (node) {
        var _a;
        // Check node-specific config
        if (node.config.model) {
            return node.config.model;
        }
        // Use complexity-based selection
        var complexity = this.estimateComplexity(node);
        if (complexity === 'simple')
            return 'haiku';
        if (complexity === 'complex')
            return 'opus';
        // Check permissions
        var allowed = ((_a = this.config.permissions.models) === null || _a === void 0 ? void 0 : _a.allowed) || ['haiku', 'sonnet', 'opus'];
        if (!allowed.includes(this.config.defaultModel)) {
            return allowed[0];
        }
        return this.config.defaultModel;
    };
    /**
     * Estimate task complexity for model selection
     */
    ClaudeCodeRuntime.prototype.estimateComplexity = function (node) {
        var dependencies = node.dependencies.length;
        // Simple heuristics based on node type and dependencies
        if (node.type === 'composite')
            return 'complex';
        if (dependencies === 0)
            return 'simple';
        if (dependencies > 3)
            return 'complex';
        return 'moderate';
    };
    /**
     * Generate a short description for the Task call
     */
    ClaudeCodeRuntime.prototype.generateDescription = function (node) {
        if (node.skillId) {
            return "Execute ".concat(node.skillId);
        }
        if (node.type === 'composite') {
            return "Execute sub-DAG ".concat(node.id);
        }
        return "Execute node ".concat(node.id);
    };
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
    ClaudeCodeRuntime.prototype.executeWave = function (dag, nodeIds, taskCalls, context) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, nodeIds_2, nodeId, node, requests, executorResults, _a, executorResults_1, _b, nodeId, response, taskResult, error, _c, nodeIds_3, nodeId, node, taskCall, error, result, taskResult, error;
            var _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        results = new Map();
                        // Mark all nodes as started
                        for (_i = 0, nodeIds_2 = nodeIds; _i < nodeIds_2.length; _i++) {
                            nodeId = nodeIds_2[_i];
                            node = dag.nodes.get(nodeId);
                            if (!node)
                                continue;
                            this.config.onNodeStart(nodeId, node);
                            (_d = this.stateManager) === null || _d === void 0 ? void 0 : _d.markNodeStarted(nodeId);
                        }
                        if (!this.executor) return [3 /*break*/, 2];
                        requests = this.nodesToExecutionRequests(dag, nodeIds, context);
                        return [4 /*yield*/, this.executor.executeParallel(requests, this.config.onProgress)];
                    case 1:
                        executorResults = _k.sent();
                        // Convert ExecutionResponses back to TaskResults
                        for (_a = 0, executorResults_1 = executorResults; _a < executorResults_1.length; _a++) {
                            _b = executorResults_1[_a], nodeId = _b[0], response = _b[1];
                            if (response.success) {
                                taskResult = this.responseToTaskResult(response);
                                results.set(nodeId, taskResult);
                                context.nodeResults.set(nodeId, taskResult);
                                (_e = this.stateManager) === null || _e === void 0 ? void 0 : _e.markNodeCompleted(nodeId, taskResult);
                                this.config.onNodeComplete(nodeId, taskResult);
                            }
                            else {
                                error = response.error || {
                                    code: 'TOOL_ERROR',
                                    message: 'Executor returned failure',
                                    sourceNodeId: nodeId,
                                    retryable: true,
                                };
                                (_f = this.stateManager) === null || _f === void 0 ? void 0 : _f.markNodeFailed(nodeId, error);
                                this.config.onNodeError(nodeId, error);
                            }
                        }
                        return [3 /*break*/, 6];
                    case 2:
                        _c = 0, nodeIds_3 = nodeIds;
                        _k.label = 3;
                    case 3:
                        if (!(_c < nodeIds_3.length)) return [3 /*break*/, 6];
                        nodeId = nodeIds_3[_c];
                        node = dag.nodes.get(nodeId);
                        if (!node)
                            return [3 /*break*/, 5];
                        taskCall = taskCalls.get(nodeId);
                        if (!taskCall) {
                            error = {
                                code: 'INTERNAL_ERROR',
                                message: "No task call generated for node ".concat(nodeId),
                                sourceNodeId: nodeId,
                                retryable: false,
                            };
                            (_g = this.stateManager) === null || _g === void 0 ? void 0 : _g.markNodeFailed(nodeId, error);
                            this.config.onNodeError(nodeId, error);
                            return [3 /*break*/, 5];
                        }
                        return [4 /*yield*/, this.simulateTaskExecution(nodeId, taskCall, context)];
                    case 4:
                        result = _k.sent();
                        if (result.success) {
                            taskResult = {
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
                            (_h = this.stateManager) === null || _h === void 0 ? void 0 : _h.markNodeCompleted(nodeId, taskResult);
                            this.config.onNodeComplete(nodeId, taskResult);
                        }
                        else {
                            error = {
                                code: 'TOOL_ERROR',
                                message: result.error || 'Task execution failed',
                                sourceNodeId: nodeId,
                                retryable: true,
                            };
                            (_j = this.stateManager) === null || _j === void 0 ? void 0 : _j.markNodeFailed(nodeId, error);
                            this.config.onNodeError(nodeId, error);
                        }
                        _k.label = 5;
                    case 5:
                        _c++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Convert DAG nodes to ExecutionRequests for the executor
     */
    ClaudeCodeRuntime.prototype.nodesToExecutionRequests = function (dag, nodeIds, context) {
        var _this = this;
        return nodeIds
            .map(function (nodeId) {
            var node = dag.nodes.get(nodeId);
            if (!node)
                return null;
            // Build dependency results map for this node
            var dependencyResults = new Map();
            for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
                var depId = _a[_i];
                var depResult = context.nodeResults.get(depId);
                if (depResult) {
                    dependencyResults.set(depId, depResult);
                }
            }
            return {
                nodeId: nodeId,
                prompt: _this.buildPrompt(node, context),
                description: _this.generateDescription(node),
                skillId: node.skillId,
                agentType: _this.determineSubagentType(node),
                model: _this.selectModel(node),
                dependencyResults: dependencyResults,
                context: context.parentContext || {},
                timeoutMs: _this.config.defaultMaxTurns * 60000, // Rough estimate
            };
        })
            .filter(function (r) { return r !== null; });
    };
    /**
     * Convert ExecutionResponse to TaskResult
     */
    ClaudeCodeRuntime.prototype.responseToTaskResult = function (response) {
        var _a, _b;
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
                executor: (_a = response.metadata) === null || _a === void 0 ? void 0 : _a.executor,
                durationMs: (_b = response.metadata) === null || _b === void 0 ? void 0 : _b.durationMs,
            },
        };
    };
    /**
     * Simulate task execution (for testing/planning)
     */
    ClaudeCodeRuntime.prototype.simulateTaskExecution = function (nodeId, taskCall, _context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This is a placeholder for actual Task tool execution
                // In real execution, this would be replaced by actual Claude Code Task calls
                return [2 /*return*/, {
                        success: true,
                        output: {
                            nodeId: nodeId,
                            simulated: true,
                            taskCall: {
                                description: taskCall.description,
                                subagent_type: taskCall.subagent_type,
                                model: taskCall.model,
                            },
                        },
                    }];
            });
        });
    };
    /**
     * Check for failures in a wave
     */
    ClaudeCodeRuntime.prototype.checkWaveFailures = function (dag, nodeIds, results) {
        var failures = [];
        for (var _i = 0, nodeIds_4 = nodeIds; _i < nodeIds_4.length; _i++) {
            var nodeId = nodeIds_4[_i];
            var result = results.get(nodeId);
            if (!result) {
                failures.push({
                    nodeId: nodeId,
                    critical: true, // Nodes without results are critical failures
                    error: {
                        code: 'TOOL_ERROR',
                        message: "Node ".concat(nodeId, " failed"),
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
    ClaudeCodeRuntime.prototype.createExecutionContext = function (dag, inputs) {
        var variables = new Map();
        // Add inputs as variables
        if (inputs) {
            for (var _i = 0, _a = Object.entries(inputs); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                variables.set(key, value);
            }
        }
        return {
            dagId: dag.id,
            executionId: (0, types_1.ExecutionId)("exec-".concat(Date.now())),
            nodeResults: new Map(),
            variables: variables,
            startTime: new Date(),
            permissions: this.config.permissions,
        };
    };
    /**
     * Create success result
     */
    ClaudeCodeRuntime.prototype.createSuccessResult = function (dag, startTime, context) {
        var _a, _b, _c, _d;
        var outputs = new Map();
        // Collect outputs based on DAG output definitions
        for (var _i = 0, _e = dag.outputs; _i < _e.length; _i++) {
            var output = _e[_i];
            var sourceResult = context.nodeResults.get(output.sourceNodeId);
            if (sourceResult) {
                outputs.set(output.name, sourceResult.output);
            }
        }
        // Calculate total token usage
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
        // Build execution snapshot
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
    ClaudeCodeRuntime.prototype.createFailureResult = function (dag, startTime, error) {
        var _a, _b, _c;
        var sortResult = (0, topology_1.topologicalSort)(dag);
        var snapshot = {
            executionId: (0, types_1.ExecutionId)("exec-".concat(Date.now())),
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
     * Generate executable Task tool calls for a DAG
     *
     * This method returns the Task tool calls that would be made to execute
     * the DAG. Useful for planning and debugging.
     *
     * @param dag The DAG to generate execution plan for
     * @param inputs Optional input values
     * @param subtaskMap Optional map of node IDs to subtasks (for conflict detection)
     */
    ClaudeCodeRuntime.prototype.generateExecutionPlan = function (dag, inputs, subtaskMap) {
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
            var taskCalls = this.generateWaveTaskCalls(dag, wave.nodeIds, context);
            // Analyze wave for conflicts
            var conflictAnalysis = conflict_detector_1.ConflictDetector.analyzeWave(dag, wave.nodeIds, subtaskMap);
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
    };
    return ClaudeCodeRuntime;
}());
exports.ClaudeCodeRuntime = ClaudeCodeRuntime;
/**
 * Factory function to create a Claude Code runtime
 */
function createClaudeCodeRuntime(config) {
    return new ClaudeCodeRuntime(config);
}
/**
 * Utility to format Task tool calls for Claude Code
 */
function formatTaskCall(call) {
    return JSON.stringify(call, null, 2);
}
/**
 * Utility to generate Claude Code message with multiple parallel Task calls
 */
function generateParallelTaskMessage(calls) {
    var parts = ['I will execute these tasks in parallel:\n'];
    for (var _i = 0, calls_1 = calls; _i < calls_1.length; _i++) {
        var call = calls_1[_i];
        parts.push("\n### ".concat(call.description, "\n"));
        parts.push('```json');
        parts.push(JSON.stringify(call, null, 2));
        parts.push('```\n');
    }
    return parts.join('\n');
}

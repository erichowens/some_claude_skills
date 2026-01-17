"use strict";
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
exports.HTTPAPIRuntime = exports.InMemoryStateStore = void 0;
exports.createMockAPIClient = createMockAPIClient;
exports.createHTTPAPIRuntime = createHTTPAPIRuntime;
var state_manager_1 = require("../core/state-manager");
var enforcer_1 = require("../permissions/enforcer");
var topology_1 = require("../core/topology");
// =============================================================================
// In-Memory State Store
// =============================================================================
/**
 * Simple in-memory state store implementation
 */
var InMemoryStateStore = /** @class */ (function () {
    function InMemoryStateStore() {
        this.data = new Map();
    }
    InMemoryStateStore.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                entry = this.data.get(key);
                if (!entry)
                    return [2 /*return*/, undefined];
                if (entry.expiresAt && Date.now() > entry.expiresAt) {
                    this.data.delete(key);
                    return [2 /*return*/, undefined];
                }
                return [2 /*return*/, entry.value];
            });
        });
    };
    InMemoryStateStore.prototype.set = function (key, value, ttlMs) {
        return __awaiter(this, void 0, void 0, function () {
            var expiresAt;
            return __generator(this, function (_a) {
                expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
                this.data.set(key, { value: value, expiresAt: expiresAt });
                return [2 /*return*/];
            });
        });
    };
    InMemoryStateStore.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.data.delete(key)];
            });
        });
    };
    InMemoryStateStore.prototype.keys = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var regex;
            return __generator(this, function (_a) {
                regex = new RegExp(pattern.replace('*', '.*'));
                return [2 /*return*/, Array.from(this.data.keys()).filter(function (k) { return regex.test(k); })];
            });
        });
    };
    InMemoryStateStore.prototype.clear = function () {
        this.data.clear();
    };
    return InMemoryStateStore;
}());
exports.InMemoryStateStore = InMemoryStateStore;
// =============================================================================
// Mock API Client
// =============================================================================
/**
 * Create a mock API client for testing
 */
function createMockAPIClient(responseOverride) {
    return {
        call: function (request) {
            return __awaiter(this, void 0, void 0, function () {
                var defaultResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Simulate API latency
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10 + Math.random() * 50); })];
                        case 1:
                            // Simulate API latency
                            _a.sent();
                            defaultResult = {
                                success: true,
                                content: JSON.stringify({
                                    output: {
                                        result: "Response for: ".concat(request.userMessage.slice(0, 50), "..."),
                                        model: request.model,
                                    },
                                    confidence: 0.85 + Math.random() * 0.1,
                                }),
                                tokenUsage: {
                                    inputTokens: Math.floor(100 + Math.random() * 200),
                                    outputTokens: Math.floor(50 + Math.random() * 150),
                                },
                            };
                            return [2 /*return*/, __assign(__assign({}, defaultResult), responseOverride)];
                    }
                });
            });
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
var HTTPAPIRuntime = /** @class */ (function () {
    function HTTPAPIRuntime(config) {
        if (config === void 0) { config = {}; }
        var _a, _b, _c, _d, _e, _f, _g;
        this.subscribers = new Map();
        this.activeJobs = new Map();
        this.jobQueue = [];
        this.isProcessingQueue = false;
        var defaultPermissions = {
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
            maxConcurrentJobs: (_a = config.maxConcurrentJobs) !== null && _a !== void 0 ? _a : 5,
            maxParallelCallsPerJob: (_b = config.maxParallelCallsPerJob) !== null && _b !== void 0 ? _b : 3,
            jobTimeoutMs: (_c = config.jobTimeoutMs) !== null && _c !== void 0 ? _c : 300000, // 5 minutes
            stateStore: (_d = config.stateStore) !== null && _d !== void 0 ? _d : new InMemoryStateStore(),
            permissions: (_e = config.permissions) !== null && _e !== void 0 ? _e : defaultPermissions,
            defaultModel: (_f = config.defaultModel) !== null && _f !== void 0 ? _f : 'claude-sonnet-4-20250514',
            clientFactory: (_g = config.clientFactory) !== null && _g !== void 0 ? _g : (function () { return createMockAPIClient(); }),
        };
        this.stateStore = this.config.stateStore;
        this.permissionEnforcer = new enforcer_1.PermissionEnforcer(this.config.permissions);
    }
    // ===========================================================================
    // Permission Validation
    // ===========================================================================
    /**
     * Validate that a DAG can be executed with current permissions
     * HTTP API uses API-level auth; this does basic DAG structure validation
     */
    HTTPAPIRuntime.prototype.validateDagPermissions = function (dag) {
        var violations = [];
        // Check that DAG has nodes
        if (dag.nodes.size === 0) {
            violations.push('DAG has no nodes');
        }
        // Check that all node dependencies exist
        for (var _i = 0, _a = dag.nodes; _i < _a.length; _i++) {
            var _b = _a[_i], nodeId = _b[0], node = _b[1];
            for (var _c = 0, _d = node.dependencies; _c < _d.length; _c++) {
                var depId = _d[_c];
                if (!dag.nodes.has(depId)) {
                    violations.push("Node ".concat(nodeId, " depends on non-existent node ").concat(depId));
                }
            }
        }
        // Check that skill nodes have skill IDs
        for (var _e = 0, _f = dag.nodes; _e < _f.length; _e++) {
            var _g = _f[_e], nodeId = _g[0], node = _g[1];
            if (node.type === 'skill' && !node.skillId) {
                violations.push("Skill node ".concat(nodeId, " has no skillId"));
            }
        }
        return {
            valid: violations.length === 0,
            violations: violations,
        };
    };
    // ===========================================================================
    // Job Management API
    // ===========================================================================
    /**
     * Submit a DAG for execution
     * @returns Job ID for tracking
     */
    HTTPAPIRuntime.prototype.submitJob = function (dag_1) {
        return __awaiter(this, arguments, void 0, function (dag, inputs) {
            var permissionResult, jobId, sortResult, job;
            if (inputs === void 0) { inputs = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        permissionResult = this.validateDagPermissions(dag);
                        if (!permissionResult.valid) {
                            throw new Error("Permission denied: ".concat(permissionResult.violations.join(', ')));
                        }
                        jobId = "job_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 8));
                        sortResult = (0, topology_1.topologicalSort)(dag);
                        job = {
                            id: jobId,
                            dagId: dag.id,
                            status: 'pending',
                            inputs: inputs,
                            createdAt: new Date(),
                            progress: {
                                totalNodes: dag.nodes.size,
                                completedNodes: 0,
                                currentWave: 0,
                                totalWaves: sortResult.waves.length,
                            },
                        };
                        // Store job
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 1:
                        // Store job
                        _a.sent();
                        return [4 /*yield*/, this.stateStore.set("dag:".concat(jobId), dag)];
                    case 2:
                        _a.sent();
                        // Emit event
                        this.emitEvent({
                            type: 'job:created',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { dagId: dag.id, nodeCount: dag.nodes.size },
                        });
                        // Add to queue and start processing
                        this.jobQueue.push(jobId);
                        this.processQueue();
                        return [2 /*return*/, jobId];
                }
            });
        });
    };
    /**
     * Get job status
     */
    HTTPAPIRuntime.prototype.getJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.stateStore.get("job:".concat(jobId))];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    /**
     * Get all jobs (optionally filtered by status)
     */
    HTTPAPIRuntime.prototype.listJobs = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, jobs, _i, keys_1, key, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.stateStore.keys('job:*')];
                    case 1:
                        keys = _a.sent();
                        jobs = [];
                        _i = 0, keys_1 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 5];
                        key = keys_1[_i];
                        return [4 /*yield*/, this.stateStore.get(key)];
                    case 3:
                        job = (_a.sent());
                        if (job && (!status || job.status === status)) {
                            jobs.push(job);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, jobs.sort(function (a, b) { return b.createdAt.getTime() - a.createdAt.getTime(); })];
                }
            });
        });
    };
    /**
     * Cancel a pending or running job
     */
    HTTPAPIRuntime.prototype.cancelJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, queueIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getJob(jobId)];
                    case 1:
                        job = _a.sent();
                        if (!job)
                            return [2 /*return*/, false];
                        if (!(job.status === 'pending' || job.status === 'queued')) return [3 /*break*/, 3];
                        job.status = 'cancelled';
                        job.completedAt = new Date();
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 2:
                        _a.sent();
                        queueIndex = this.jobQueue.indexOf(jobId);
                        if (queueIndex !== -1) {
                            this.jobQueue.splice(queueIndex, 1);
                        }
                        return [2 /*return*/, true];
                    case 3:
                        if (job.status === 'running') {
                            // Signal cancellation
                            this.activeJobs.set(jobId, false);
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                }
            });
        });
    };
    // ===========================================================================
    // Event Subscription API
    // ===========================================================================
    /**
     * Subscribe to events for a specific job
     */
    HTTPAPIRuntime.prototype.subscribe = function (jobId, callback) {
        var _this = this;
        if (!this.subscribers.has(jobId)) {
            this.subscribers.set(jobId, new Set());
        }
        this.subscribers.get(jobId).add(callback);
        // Return unsubscribe function
        return function () {
            var subs = _this.subscribers.get(jobId);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    _this.subscribers.delete(jobId);
                }
            }
        };
    };
    /**
     * Subscribe to all events
     */
    HTTPAPIRuntime.prototype.subscribeAll = function (callback) {
        return this.subscribe('*', callback);
    };
    HTTPAPIRuntime.prototype.emitEvent = function (event) {
        // Notify job-specific subscribers
        var jobSubs = this.subscribers.get(event.jobId);
        if (jobSubs) {
            jobSubs.forEach(function (cb) { return cb(event); });
        }
        // Notify global subscribers
        var globalSubs = this.subscribers.get('*');
        if (globalSubs) {
            globalSubs.forEach(function (cb) { return cb(event); });
        }
    };
    // ===========================================================================
    // Queue Processing
    // ===========================================================================
    HTTPAPIRuntime.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isProcessingQueue)
                            return [2 /*return*/];
                        this.isProcessingQueue = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 5, 6]);
                        _loop_1 = function () {
                            var runningCount, jobId, job;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        runningCount = Array.from(this_1.activeJobs.values()).filter(Boolean).length;
                                        if (!(runningCount >= this_1.config.maxConcurrentJobs)) return [3 /*break*/, 2];
                                        // Wait for a slot
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                    case 1:
                                        // Wait for a slot
                                        _b.sent();
                                        return [2 /*return*/, "continue"];
                                    case 2:
                                        jobId = this_1.jobQueue.shift();
                                        if (!jobId)
                                            return [2 /*return*/, "continue"];
                                        return [4 /*yield*/, this_1.getJob(jobId)];
                                    case 3:
                                        job = _b.sent();
                                        if (!job || job.status === 'cancelled')
                                            return [2 /*return*/, "continue"];
                                        // Mark as queued
                                        job.status = 'queued';
                                        return [4 /*yield*/, this_1.stateStore.set("job:".concat(jobId), job)];
                                    case 4:
                                        _b.sent();
                                        // Start execution (non-blocking)
                                        this_1.executeJob(jobId).catch(function (error) {
                                            console.error("Job ".concat(jobId, " failed:"), error);
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 2;
                    case 2:
                        if (!(this.jobQueue.length > 0)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 2];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        this.isProcessingQueue = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // ===========================================================================
    // Job Execution
    // ===========================================================================
    HTTPAPIRuntime.prototype.executeJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, dag, startTime, stateManager, client, errors, tokenUsage, sortResult, waveIndex, wave, results, _i, results_1, _a, nodeId, result_1, snapshot, outputs, result, error_1;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.getJob(jobId)];
                    case 1:
                        job = _f.sent();
                        if (!job)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.stateStore.get("dag:".concat(jobId))];
                    case 2:
                        dag = (_f.sent());
                        if (!!dag) return [3 /*break*/, 4];
                        job.status = 'failed';
                        job.error = 'DAG not found';
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 3:
                        _f.sent();
                        return [2 /*return*/];
                    case 4:
                        if (!(!dag.nodes || !(dag.nodes instanceof Map))) return [3 /*break*/, 6];
                        job.status = 'failed';
                        job.error = "Invalid DAG structure: nodes is ".concat(dag.nodes === undefined ? 'undefined' : typeof dag.nodes);
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 5:
                        _f.sent();
                        this.emitEvent({
                            type: 'job:failed',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { error: job.error },
                        });
                        return [2 /*return*/];
                    case 6:
                        // Mark as running
                        job.status = 'running';
                        job.startedAt = new Date();
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 7:
                        _f.sent();
                        this.activeJobs.set(jobId, true);
                        this.emitEvent({
                            type: 'job:started',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: {},
                        });
                        startTime = Date.now();
                        stateManager = new state_manager_1.StateManager({ dag: dag });
                        stateManager.startExecution(); // Initialize nodes to ready state
                        client = this.config.clientFactory();
                        errors = [];
                        tokenUsage = { inputTokens: 0, outputTokens: 0 };
                        _f.label = 8;
                    case 8:
                        _f.trys.push([8, 16, 18, 19]);
                        sortResult = (0, topology_1.topologicalSort)(dag);
                        if (!sortResult.success) {
                            throw new Error('DAG contains a cycle');
                        }
                        waveIndex = 0;
                        _f.label = 9;
                    case 9:
                        if (!(waveIndex < sortResult.waves.length)) return [3 /*break*/, 14];
                        // Check cancellation
                        if (!this.activeJobs.get(jobId)) {
                            job.status = 'cancelled';
                            return [3 /*break*/, 14];
                        }
                        wave = sortResult.waves[waveIndex];
                        job.progress.currentWave = waveIndex;
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 10:
                        _f.sent();
                        this.emitEvent({
                            type: 'wave:start',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { waveIndex: waveIndex, nodeIds: wave.nodeIds },
                        });
                        return [4 /*yield*/, this.executeWaveWithThrottle(jobId, dag, wave.nodeIds, stateManager, client, job.inputs)];
                    case 11:
                        results = _f.sent();
                        // Process results
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            _a = results_1[_i], nodeId = _a[0], result_1 = _a[1];
                            if (result_1.success && result_1.taskResult) {
                                stateManager.markNodeCompleted(nodeId, result_1.taskResult);
                                tokenUsage.inputTokens += (_c = (_b = result_1.tokenUsage) === null || _b === void 0 ? void 0 : _b.inputTokens) !== null && _c !== void 0 ? _c : 0;
                                tokenUsage.outputTokens += (_e = (_d = result_1.tokenUsage) === null || _d === void 0 ? void 0 : _d.outputTokens) !== null && _e !== void 0 ? _e : 0;
                                job.progress.completedNodes++;
                            }
                            else if (result_1.error) {
                                stateManager.markNodeFailed(nodeId, result_1.error);
                                errors.push(result_1.error);
                            }
                        }
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 12:
                        _f.sent();
                        this.emitEvent({
                            type: 'wave:complete',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { waveIndex: waveIndex },
                        });
                        _f.label = 13;
                    case 13:
                        waveIndex++;
                        return [3 /*break*/, 9];
                    case 14:
                        snapshot = stateManager.getSnapshot();
                        outputs = this.collectOutputs(dag, snapshot);
                        result = {
                            success: errors.length === 0 && job.status !== 'cancelled',
                            snapshot: snapshot,
                            outputs: outputs,
                            totalTokenUsage: tokenUsage,
                            totalTimeMs: Date.now() - startTime,
                            errors: errors,
                        };
                        // Update job
                        job.status = errors.length === 0 ? 'completed' : 'failed';
                        job.completedAt = new Date();
                        job.result = result;
                        if (errors.length > 0) {
                            job.error = errors.map(function (e) { return e.message; }).join('; ');
                        }
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 15:
                        _f.sent();
                        this.emitEvent({
                            type: job.status === 'completed' ? 'job:completed' : 'job:failed',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { success: result.success, totalTimeMs: result.totalTimeMs },
                        });
                        return [3 /*break*/, 19];
                    case 16:
                        error_1 = _f.sent();
                        job.status = 'failed';
                        job.completedAt = new Date();
                        job.error = error_1 instanceof Error ? error_1.message : String(error_1);
                        return [4 /*yield*/, this.stateStore.set("job:".concat(jobId), job)];
                    case 17:
                        _f.sent();
                        this.emitEvent({
                            type: 'job:failed',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { error: job.error },
                        });
                        return [3 /*break*/, 19];
                    case 18:
                        this.activeJobs.delete(jobId);
                        return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    HTTPAPIRuntime.prototype.executeWaveWithThrottle = function (jobId, dag, nodeIds, stateManager, client, inputs) {
        return __awaiter(this, void 0, void 0, function () {
            var results, pending, inFlight, _loop_2, this_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = new Map();
                        pending = __spreadArray([], nodeIds, true);
                        inFlight = new Map();
                        _a.label = 1;
                    case 1:
                        if (!(pending.length > 0 || inFlight.size > 0)) return [3 /*break*/, 4];
                        // Check cancellation
                        if (!this.activeJobs.get(jobId)) {
                            return [3 /*break*/, 4];
                        }
                        _loop_2 = function () {
                            var nodeId = pending.shift();
                            var node = dag.nodes.get(nodeId);
                            if (!node)
                                return "continue";
                            // Skip nodes that have already been skipped (e.g., due to failed dependencies)
                            var nodeState = stateManager.getNodeState(nodeId);
                            if ((nodeState === null || nodeState === void 0 ? void 0 : nodeState.status) === 'skipped') {
                                return "continue";
                            }
                            var task = this_2.executeNode(jobId, node, stateManager, client, inputs)
                                .then(function (result) {
                                results.set(nodeId, result);
                                inFlight.delete(nodeId); // Remove from in-flight when done
                            })
                                .catch(function (error) {
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
                        };
                        this_2 = this;
                        // Start new tasks up to limit
                        while (pending.length > 0 &&
                            inFlight.size < this.config.maxParallelCallsPerJob) {
                            _loop_2();
                        }
                        if (!(inFlight.size > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, Promise.race(inFlight.values())];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    HTTPAPIRuntime.prototype.executeNode = function (jobId, node, stateManager, client, inputs) {
        return __awaiter(this, void 0, void 0, function () {
            var depResults, prompt_1, response, taskResult, error_2, taskError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.emitEvent({
                            type: 'node:start',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { nodeId: node.id, nodeName: node.name },
                        });
                        stateManager.markNodeStarted(node.id);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        depResults = this.getDependencyResults(node, stateManager);
                        prompt_1 = this.buildNodePrompt(node, inputs, depResults);
                        return [4 /*yield*/, client.call({
                                model: this.config.defaultModel,
                                systemPrompt: this.buildSystemPrompt(node),
                                userMessage: prompt_1,
                                maxTokens: 4096,
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.success) {
                            throw new Error(response.error || 'API call failed');
                        }
                        taskResult = this.parseResponse(response.content);
                        this.emitEvent({
                            type: 'node:complete',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: {
                                nodeId: node.id,
                                confidence: taskResult.confidence,
                                tokens: response.tokenUsage,
                            },
                        });
                        return [2 /*return*/, {
                                success: true,
                                taskResult: taskResult,
                                tokenUsage: response.tokenUsage,
                            }];
                    case 3:
                        error_2 = _a.sent();
                        taskError = {
                            code: 'NODE_EXECUTION_FAILED',
                            message: error_2 instanceof Error ? error_2.message : String(error_2),
                            recoverable: false,
                        };
                        this.emitEvent({
                            type: 'node:error',
                            jobId: jobId,
                            timestamp: new Date(),
                            data: { nodeId: node.id, error: taskError.message },
                        });
                        return [2 /*return*/, {
                                success: false,
                                error: taskError,
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    HTTPAPIRuntime.prototype.getDependencyResults = function (node, stateManager) {
        var results = new Map();
        for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
            var depId = _a[_i];
            var state = stateManager.getNodeState(depId);
            if ((state === null || state === void 0 ? void 0 : state.status) === 'completed' && state.result) {
                results.set(depId, state.result);
            }
        }
        return results;
    };
    HTTPAPIRuntime.prototype.buildNodePrompt = function (node, inputs, depResults) {
        var parts = [];
        parts.push("Task: ".concat(node.name));
        parts.push("Node ID: ".concat(node.id));
        parts.push('');
        if (Object.keys(inputs).length > 0) {
            parts.push('Inputs:');
            parts.push(JSON.stringify(inputs, null, 2));
            parts.push('');
        }
        if (depResults.size > 0) {
            parts.push('Results from dependencies:');
            for (var _i = 0, depResults_1 = depResults; _i < depResults_1.length; _i++) {
                var _a = depResults_1[_i], depId = _a[0], result = _a[1];
                parts.push("- ".concat(depId, ":"));
                parts.push(JSON.stringify(result.output, null, 2));
            }
            parts.push('');
        }
        // Get prompt from node
        var prompt = node.prompt || "Execute task: ".concat(node.name);
        parts.push('Instructions:');
        parts.push(prompt);
        return parts.join('\n');
    };
    HTTPAPIRuntime.prototype.buildSystemPrompt = function (node) {
        return "You are executing a node in a DAG workflow.\nNode: ".concat(node.name, "\nType: ").concat(node.type, "\nSkill: ").concat(node.skillId || 'general', "\n\nRespond with valid JSON containing:\n- output: Your result data\n- confidence: A number 0-1 indicating confidence\n- reasoning: Brief explanation of your approach");
    };
    HTTPAPIRuntime.prototype.parseResponse = function (content) {
        var _a, _b;
        try {
            var parsed = JSON.parse(content);
            return {
                output: (_a = parsed.output) !== null && _a !== void 0 ? _a : parsed,
                confidence: (_b = parsed.confidence) !== null && _b !== void 0 ? _b : 0.8,
                metadata: {
                    reasoning: parsed.reasoning,
                },
            };
        }
        catch (_c) {
            return {
                output: { text: content },
                confidence: 0.7,
            };
        }
    };
    HTTPAPIRuntime.prototype.collectOutputs = function (dag, snapshot) {
        var outputs = new Map();
        for (var _i = 0, _a = dag.outputs; _i < _a.length; _i++) {
            var outputDef = _a[_i];
            var nodeState = snapshot.nodeStates.get(outputDef.sourceNodeId);
            if ((nodeState === null || nodeState === void 0 ? void 0 : nodeState.status) === 'completed' && nodeState.result) {
                var value = nodeState.result.output;
                // Navigate to output path if specified
                if (outputDef.outputPath) {
                    var pathParts = outputDef.outputPath.split('.');
                    for (var _b = 0, pathParts_1 = pathParts; _b < pathParts_1.length; _b++) {
                        var part = pathParts_1[_b];
                        if (value && typeof value === 'object') {
                            value = value[part];
                        }
                    }
                }
                outputs.set(outputDef.name, value);
            }
        }
        return outputs;
    };
    // ===========================================================================
    // Execution Plan Generation
    // ===========================================================================
    /**
     * Generate execution plan without executing
     */
    HTTPAPIRuntime.prototype.generateExecutionPlan = function (dag) {
        var sortResult = (0, topology_1.topologicalSort)(dag);
        return {
            dagId: dag.id,
            dagName: dag.name || dag.id,
            totalNodes: dag.nodes.size,
            totalWaves: sortResult.waves.length,
            hasCycle: !sortResult.success,
            estimatedConcurrency: Math.min(this.config.maxParallelCallsPerJob, Math.max.apply(Math, __spreadArray(__spreadArray([], sortResult.waves.map(function (w) { return w.nodeIds.length; }), false), [1], false))),
            waves: sortResult.waves.map(function (wave) { return ({
                waveIndex: wave.waveNumber,
                parallelizable: wave.nodeIds.length > 1,
                nodes: wave.nodeIds.map(function (nodeId) {
                    var _a, _b, _c;
                    var node = dag.nodes.get(nodeId);
                    return {
                        nodeId: nodeId,
                        nodeName: (_a = node === null || node === void 0 ? void 0 : node.name) !== null && _a !== void 0 ? _a : nodeId,
                        nodeType: (_b = node === null || node === void 0 ? void 0 : node.type) !== null && _b !== void 0 ? _b : 'skill',
                        skillId: node === null || node === void 0 ? void 0 : node.skillId,
                        dependencies: (_c = node === null || node === void 0 ? void 0 : node.dependencies) !== null && _c !== void 0 ? _c : [],
                    };
                }),
            }); }),
        };
    };
    // ===========================================================================
    // Cleanup
    // ===========================================================================
    /**
     * Clean up old jobs from state store
     */
    HTTPAPIRuntime.prototype.cleanupOldJobs = function () {
        return __awaiter(this, arguments, void 0, function (maxAgeMs) {
            var keys, cutoff, cleaned, _i, keys_2, key, job;
            if (maxAgeMs === void 0) { maxAgeMs = 24 * 60 * 60 * 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.stateStore.keys('job:*')];
                    case 1:
                        keys = _a.sent();
                        cutoff = Date.now() - maxAgeMs;
                        cleaned = 0;
                        _i = 0, keys_2 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_2.length)) return [3 /*break*/, 7];
                        key = keys_2[_i];
                        return [4 /*yield*/, this.stateStore.get(key)];
                    case 3:
                        job = (_a.sent());
                        if (!(job &&
                            job.completedAt &&
                            job.completedAt.getTime() < cutoff)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.stateStore.delete(key)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.stateStore.delete("dag:".concat(job.id))];
                    case 5:
                        _a.sent();
                        cleaned++;
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, cleaned];
                }
            });
        });
    };
    return HTTPAPIRuntime;
}());
exports.HTTPAPIRuntime = HTTPAPIRuntime;
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create HTTP API runtime with default configuration
 */
function createHTTPAPIRuntime(config) {
    if (config === void 0) { config = {}; }
    return new HTTPAPIRuntime(config);
}

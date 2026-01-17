"use strict";
/**
 * Tests for HTTP API Runtime
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
var vitest_1 = require("vitest");
var http_api_1 = require("./http-api");
var builder_1 = require("../core/builder");
// =============================================================================
// Test Helpers
// =============================================================================
function createTestDAG() {
    return (0, builder_1.dag)('test-dag')
        .description('Test DAG for HTTP API runtime')
        .skillNode('node-a', 'test-skill')
        .name('Node A')
        .prompt('Execute task A')
        .done()
        .skillNode('node-b', 'test-skill')
        .name('Node B')
        .prompt('Execute task B')
        .dependsOn('node-a')
        .done()
        .build();
}
function createParallelDAG() {
    return (0, builder_1.dag)('parallel-dag')
        .description('Parallel test DAG')
        .skillNode('start', 'init-skill')
        .name('Start')
        .prompt('Initialize')
        .done()
        .skillNode('task-a', 'worker-skill')
        .name('Task A')
        .prompt('Do task A')
        .dependsOn('start')
        .done()
        .skillNode('task-b', 'worker-skill')
        .name('Task B')
        .prompt('Do task B')
        .dependsOn('start')
        .done()
        .skillNode('task-c', 'worker-skill')
        .name('Task C')
        .prompt('Do task C')
        .dependsOn('start')
        .done()
        .skillNode('merge', 'aggregator-skill')
        .name('Merge')
        .prompt('Combine results')
        .dependsOn('task-a', 'task-b', 'task-c')
        .done()
        .build();
}
function waitForJobCompletion(runtime_1, jobId_1) {
    return __awaiter(this, arguments, void 0, function (runtime, jobId, timeoutMs) {
        var startTime, job;
        if (timeoutMs === void 0) { timeoutMs = 10000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    if (!(Date.now() - startTime < timeoutMs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, runtime.getJob(jobId)];
                case 2:
                    job = _a.sent();
                    if (job && ['completed', 'failed', 'cancelled'].includes(job.status)) {
                        return [2 /*return*/, job];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, runtime.getJob(jobId)];
            }
        });
    });
}
// =============================================================================
// InMemoryStateStore Tests
// =============================================================================
(0, vitest_1.describe)('InMemoryStateStore', function () {
    (0, vitest_1.it)('stores and retrieves values', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store = new http_api_1.InMemoryStateStore();
                    return [4 /*yield*/, store.set('key1', { value: 'test' })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, store.get('key1')];
                case 2:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).toEqual({ value: 'test' });
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('returns undefined for missing keys', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store = new http_api_1.InMemoryStateStore();
                    return [4 /*yield*/, store.get('nonexistent')];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('deletes values', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, deleted, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store = new http_api_1.InMemoryStateStore();
                    return [4 /*yield*/, store.set('key1', 'value1')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, store.delete('key1')];
                case 2:
                    deleted = _a.sent();
                    return [4 /*yield*/, store.get('key1')];
                case 3:
                    result = _a.sent();
                    (0, vitest_1.expect)(deleted).toBe(true);
                    (0, vitest_1.expect)(result).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('respects TTL', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    store = new http_api_1.InMemoryStateStore();
                    return [4 /*yield*/, store.set('key1', 'value1', 50)];
                case 1:
                    _c.sent(); // 50ms TTL
                    _a = vitest_1.expect;
                    return [4 /*yield*/, store.get('key1')];
                case 2:
                    _a.apply(void 0, [_c.sent()]).toBe('value1');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60); })];
                case 3:
                    _c.sent();
                    _b = vitest_1.expect;
                    return [4 /*yield*/, store.get('key1')];
                case 4:
                    _b.apply(void 0, [_c.sent()]).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('lists keys by pattern', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, jobKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    store = new http_api_1.InMemoryStateStore();
                    return [4 /*yield*/, store.set('job:1', 'a')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, store.set('job:2', 'b')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, store.set('dag:1', 'c')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, store.keys('job:*')];
                case 4:
                    jobKeys = _a.sent();
                    (0, vitest_1.expect)(jobKeys).toHaveLength(2);
                    (0, vitest_1.expect)(jobKeys).toContain('job:1');
                    (0, vitest_1.expect)(jobKeys).toContain('job:2');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('clears all data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    store = new http_api_1.InMemoryStateStore();
                    return [4 /*yield*/, store.set('key1', 'value1')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, store.set('key2', 'value2')];
                case 2:
                    _c.sent();
                    store.clear();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, store.get('key1')];
                case 3:
                    _a.apply(void 0, [_c.sent()]).toBeUndefined();
                    _b = vitest_1.expect;
                    return [4 /*yield*/, store.get('key2')];
                case 4:
                    _b.apply(void 0, [_c.sent()]).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
// =============================================================================
// Mock API Client Tests
// =============================================================================
(0, vitest_1.describe)('createMockAPIClient', function () {
    (0, vitest_1.it)('creates a working mock client', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = (0, http_api_1.createMockAPIClient)();
                    return [4 /*yield*/, client.call({
                            model: 'claude-sonnet-4-20250514',
                            systemPrompt: 'Test system',
                            userMessage: 'Test message',
                            maxTokens: 1000,
                        })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.success).toBe(true);
                    (0, vitest_1.expect)(result.content).toBeTruthy();
                    (0, vitest_1.expect)(result.tokenUsage.inputTokens).toBeGreaterThan(0);
                    (0, vitest_1.expect)(result.tokenUsage.outputTokens).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('allows response override', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = (0, http_api_1.createMockAPIClient)({
                        tokenUsage: { inputTokens: 500, outputTokens: 250 },
                    });
                    return [4 /*yield*/, client.call({
                            model: 'claude-sonnet-4-20250514',
                            systemPrompt: 'Test',
                            userMessage: 'Test',
                            maxTokens: 1000,
                        })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.tokenUsage.inputTokens).toBe(500);
                    (0, vitest_1.expect)(result.tokenUsage.outputTokens).toBe(250);
                    return [2 /*return*/];
            }
        });
    }); });
});
// =============================================================================
// HTTPAPIRuntime Tests
// =============================================================================
(0, vitest_1.describe)('HTTPAPIRuntime', function () {
    (0, vitest_1.describe)('constructor', function () {
        (0, vitest_1.it)('creates runtime with default config', function () {
            var runtime = new http_api_1.HTTPAPIRuntime();
            (0, vitest_1.expect)(runtime).toBeInstanceOf(http_api_1.HTTPAPIRuntime);
        });
        (0, vitest_1.it)('creates runtime with custom config', function () {
            var runtime = new http_api_1.HTTPAPIRuntime({
                maxConcurrentJobs: 10,
                maxParallelCallsPerJob: 5,
                jobTimeoutMs: 60000,
            });
            (0, vitest_1.expect)(runtime).toBeInstanceOf(http_api_1.HTTPAPIRuntime);
        });
        (0, vitest_1.it)('creates runtime with custom state store', function () {
            var store = new http_api_1.InMemoryStateStore();
            var runtime = new http_api_1.HTTPAPIRuntime({ stateStore: store });
            (0, vitest_1.expect)(runtime).toBeInstanceOf(http_api_1.HTTPAPIRuntime);
        });
    });
    (0, vitest_1.describe)('submitJob', function () {
        (0, vitest_1.it)('returns a job ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        (0, vitest_1.expect)(jobId).toMatch(/^job_\d+_[a-z0-9]+$/);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('creates job with pending status', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, runtime.getJob(jobId)];
                    case 2:
                        job = _a.sent();
                        (0, vitest_1.expect)(job).toBeDefined();
                        (0, vitest_1.expect)(['pending', 'queued', 'running']).toContain(job === null || job === void 0 ? void 0 : job.status);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('initializes job progress', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, runtime.getJob(jobId)];
                    case 2:
                        job = _a.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.progress.totalNodes).toBe(2);
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.progress.completedNodes).toBe(0);
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.progress.totalWaves).toBe(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('getJob', function () {
        (0, vitest_1.it)('returns undefined for non-existent job', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        return [4 /*yield*/, runtime.getJob('nonexistent')];
                    case 1:
                        job = _a.sent();
                        (0, vitest_1.expect)(job).toBeUndefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns job with updated status', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, completedJob;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        completedJob = _a.sent();
                        (0, vitest_1.expect)(completedJob === null || completedJob === void 0 ? void 0 : completedJob.status).toBe('completed');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('listJobs', function () {
        (0, vitest_1.it)('lists all jobs', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, dag1, dag2, jobs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        dag1 = createTestDAG();
                        dag2 = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(dag1)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, runtime.submitJob(dag2)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, runtime.listJobs()];
                    case 3:
                        jobs = _a.sent();
                        (0, vitest_1.expect)(jobs.length).toBeGreaterThanOrEqual(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('filters jobs by status', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, completedJobs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, runtime.listJobs('completed')];
                    case 3:
                        completedJobs = _a.sent();
                        (0, vitest_1.expect)(completedJobs.some(function (j) { return j.id === jobId; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('cancelJob', function () {
        (0, vitest_1.it)('cancels pending job', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, cancelled, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime({ maxConcurrentJobs: 0 });
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, runtime.cancelJob(jobId)];
                    case 2:
                        cancelled = _a.sent();
                        (0, vitest_1.expect)(cancelled).toBe(true);
                        return [4 /*yield*/, runtime.getJob(jobId)];
                    case 3:
                        job = _a.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('cancelled');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns false for non-existent job', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, cancelled;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        return [4 /*yield*/, runtime.cancelJob('nonexistent')];
                    case 1:
                        cancelled = _a.sent();
                        (0, vitest_1.expect)(cancelled).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('subscribe', function () {
        (0, vitest_1.it)('receives job events', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, events, jobId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        events = [];
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        runtime.subscribe(jobId, function (event) { return events.push(event); });
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        _a.sent();
                        (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(events.some(function (e) { return e.type === 'node:start'; })).toBe(true);
                        (0, vitest_1.expect)(events.some(function (e) { return e.type === 'node:complete'; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('unsubscribe stops events', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, events, jobId, unsubscribe;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        events = [];
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        unsubscribe = runtime.subscribe(jobId, function (event) { return events.push(event); });
                        // Unsubscribe immediately
                        unsubscribe();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('subscribeAll receives all events', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, events, jobId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        events = [];
                        runtime.subscribeAll(function (event) { return events.push(event); });
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        _a.sent();
                        (0, vitest_1.expect)(events.some(function (e) { return e.type === 'job:created'; })).toBe(true);
                        (0, vitest_1.expect)(events.some(function (e) { return e.type === 'job:started'; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('job execution', function () {
        (0, vitest_1.it)('executes simple DAG successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, job;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _b.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        job = _b.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('completed');
                        (0, vitest_1.expect)((_a = job === null || job === void 0 ? void 0 : job.result) === null || _a === void 0 ? void 0 : _a.success).toBe(true);
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.progress.completedNodes).toBe(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('executes parallel DAG successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, parallelDAG, jobId, job;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        parallelDAG = createParallelDAG();
                        return [4 /*yield*/, runtime.submitJob(parallelDAG)];
                    case 1:
                        jobId = _b.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        job = _b.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('completed');
                        (0, vitest_1.expect)((_a = job === null || job === void 0 ? void 0 : job.result) === null || _a === void 0 ? void 0 : _a.success).toBe(true);
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.progress.completedNodes).toBe(5);
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.progress.totalWaves).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('passes inputs to execution', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime();
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG, { topic: 'Test Topic' })];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        job = _a.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('completed');
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.inputs.topic).toBe('Test Topic');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('tracks token usage', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, testDAG, jobId, job;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime({
                            clientFactory: function () {
                                return (0, http_api_1.createMockAPIClient)({
                                    tokenUsage: { inputTokens: 100, outputTokens: 50 },
                                });
                            },
                        });
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _c.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        job = _c.sent();
                        (0, vitest_1.expect)((_a = job === null || job === void 0 ? void 0 : job.result) === null || _a === void 0 ? void 0 : _a.totalTokenUsage.inputTokens).toBeGreaterThan(0);
                        (0, vitest_1.expect)((_b = job === null || job === void 0 ? void 0 : job.result) === null || _b === void 0 ? void 0 : _b.totalTokenUsage.outputTokens).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('handles API errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var failingClient, runtime, testDAG, jobId, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        failingClient = {
                            call: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        throw new Error('API failure');
                                    });
                                });
                            },
                        };
                        runtime = new http_api_1.HTTPAPIRuntime({
                            clientFactory: function () { return failingClient; },
                        });
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        job = _a.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('failed');
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.error).toContain('API failure');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('detects cycles in DAG', function () { return __awaiter(void 0, void 0, void 0, function () {
            var cyclicDAG, nodeA, runtime, jobId, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cyclicDAG = (0, builder_1.dag)('cyclic-dag')
                            .skillNode('node-a', 'test')
                            .name('A')
                            .prompt('A')
                            .done()
                            .build();
                        nodeA = cyclicDAG.nodes.get('node-a');
                        nodeA.dependencies.push('node-a');
                        runtime = new http_api_1.HTTPAPIRuntime();
                        return [4 /*yield*/, runtime.submitJob(cyclicDAG)];
                    case 1:
                        jobId = _a.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        job = _a.sent();
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('failed');
                        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.error).toContain('cycle');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('concurrency control', function () {
        (0, vitest_1.it)('respects maxConcurrentJobs', function () { return __awaiter(void 0, void 0, void 0, function () {
            var runtime, jobs, i, testDAG, jobId, _i, jobs_1, jobId, allJobs, completedCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtime = new http_api_1.HTTPAPIRuntime({ maxConcurrentJobs: 2 });
                        jobs = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 5)) return [3 /*break*/, 4];
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 2:
                        jobId = _a.sent();
                        jobs.push(jobId);
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        _i = 0, jobs_1 = jobs;
                        _a.label = 5;
                    case 5:
                        if (!(_i < jobs_1.length)) return [3 /*break*/, 8];
                        jobId = jobs_1[_i];
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: return [4 /*yield*/, runtime.listJobs()];
                    case 9:
                        allJobs = _a.sent();
                        completedCount = allJobs.filter(function (j) { return j.status === 'completed'; }).length;
                        (0, vitest_1.expect)(completedCount).toBeGreaterThanOrEqual(5);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('generateExecutionPlan', function () {
        (0, vitest_1.it)('generates plan for simple DAG', function () {
            var runtime = new http_api_1.HTTPAPIRuntime();
            var testDAG = createTestDAG();
            var plan = runtime.generateExecutionPlan(testDAG);
            (0, vitest_1.expect)(plan.dagId).toBe(testDAG.id);
            (0, vitest_1.expect)(plan.totalNodes).toBe(2);
            (0, vitest_1.expect)(plan.totalWaves).toBe(2);
            (0, vitest_1.expect)(plan.hasCycle).toBe(false);
        });
        (0, vitest_1.it)('generates plan for parallel DAG', function () {
            var runtime = new http_api_1.HTTPAPIRuntime();
            var parallelDAG = createParallelDAG();
            var plan = runtime.generateExecutionPlan(parallelDAG);
            (0, vitest_1.expect)(plan.totalWaves).toBe(3);
            (0, vitest_1.expect)(plan.waves[1].parallelizable).toBe(true);
            (0, vitest_1.expect)(plan.waves[1].nodes.length).toBe(3);
        });
        (0, vitest_1.it)('includes dependency information', function () {
            var runtime = new http_api_1.HTTPAPIRuntime();
            var testDAG = createTestDAG();
            var plan = runtime.generateExecutionPlan(testDAG);
            var nodeBPlan = plan.waves[1].nodes.find(function (n) { return n.nodeId === 'node-b'; });
            (0, vitest_1.expect)(nodeBPlan === null || nodeBPlan === void 0 ? void 0 : nodeBPlan.dependencies).toContain('node-a');
        });
        (0, vitest_1.it)('calculates estimated concurrency', function () {
            var runtime = new http_api_1.HTTPAPIRuntime({ maxParallelCallsPerJob: 3 });
            var parallelDAG = createParallelDAG();
            var plan = runtime.generateExecutionPlan(parallelDAG);
            (0, vitest_1.expect)(plan.estimatedConcurrency).toBe(3);
        });
    });
    (0, vitest_1.describe)('cleanupOldJobs', function () {
        (0, vitest_1.it)('removes old completed jobs', function () { return __awaiter(void 0, void 0, void 0, function () {
            var store, runtime, testDAG, jobId, job, cleaned, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        store = new http_api_1.InMemoryStateStore();
                        runtime = new http_api_1.HTTPAPIRuntime({ stateStore: store });
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _b.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, runtime.getJob(jobId)];
                    case 3:
                        job = _b.sent();
                        if (!job) return [3 /*break*/, 5];
                        job.completedAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
                        return [4 /*yield*/, store.set("job:".concat(jobId), job)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [4 /*yield*/, runtime.cleanupOldJobs(24 * 60 * 60 * 1000)];
                    case 6:
                        cleaned = _b.sent();
                        (0, vitest_1.expect)(cleaned).toBe(1);
                        _a = vitest_1.expect;
                        return [4 /*yield*/, runtime.getJob(jobId)];
                    case 7:
                        _a.apply(void 0, [_b.sent()]).toBeUndefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('keeps recent jobs', function () { return __awaiter(void 0, void 0, void 0, function () {
            var store, runtime, testDAG, jobId, cleaned, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        store = new http_api_1.InMemoryStateStore();
                        runtime = new http_api_1.HTTPAPIRuntime({ stateStore: store });
                        testDAG = createTestDAG();
                        return [4 /*yield*/, runtime.submitJob(testDAG)];
                    case 1:
                        jobId = _b.sent();
                        return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, runtime.cleanupOldJobs()];
                    case 3:
                        cleaned = _b.sent();
                        (0, vitest_1.expect)(cleaned).toBe(0);
                        _a = vitest_1.expect;
                        return [4 /*yield*/, runtime.getJob(jobId)];
                    case 4:
                        _a.apply(void 0, [_b.sent()]).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
// =============================================================================
// Factory Function Tests
// =============================================================================
(0, vitest_1.describe)('createHTTPAPIRuntime', function () {
    (0, vitest_1.it)('creates runtime with factory function', function () {
        var runtime = (0, http_api_1.createHTTPAPIRuntime)();
        (0, vitest_1.expect)(runtime).toBeInstanceOf(http_api_1.HTTPAPIRuntime);
    });
    (0, vitest_1.it)('passes config to runtime', function () {
        var runtime = (0, http_api_1.createHTTPAPIRuntime)({
            maxConcurrentJobs: 10,
        });
        (0, vitest_1.expect)(runtime).toBeInstanceOf(http_api_1.HTTPAPIRuntime);
    });
});
// =============================================================================
// Integration Tests
// =============================================================================
(0, vitest_1.describe)('HTTP API Runtime Integration', function () {
    (0, vitest_1.it)('executes multiple concurrent jobs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var runtime, jobs, i, testDAG, _a, _b, results;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    runtime = new http_api_1.HTTPAPIRuntime({ maxConcurrentJobs: 3 });
                    jobs = [];
                    i = 0;
                    _c.label = 1;
                case 1:
                    if (!(i < 3)) return [3 /*break*/, 4];
                    testDAG = createTestDAG();
                    _b = (_a = jobs).push;
                    return [4 /*yield*/, runtime.submitJob(testDAG)];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    _c.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, Promise.all(jobs.map(function (id) { return waitForJobCompletion(runtime, id); }))];
                case 5:
                    results = _c.sent();
                    (0, vitest_1.expect)(results.every(function (j) { return (j === null || j === void 0 ? void 0 : j.status) === 'completed'; })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('handles mixed success and failure', function () { return __awaiter(void 0, void 0, void 0, function () {
        var callCount, mixedClient, runtime, testDAG, jobId, job;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    callCount = 0;
                    mixedClient = {
                        call: function (request) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    callCount++;
                                    if (callCount === 2) {
                                        return [2 /*return*/, {
                                                success: false,
                                                content: '',
                                                tokenUsage: { inputTokens: 0, outputTokens: 0 },
                                                error: 'Simulated failure',
                                            }];
                                    }
                                    return [2 /*return*/, {
                                            success: true,
                                            content: JSON.stringify({ output: { result: 'success' }, confidence: 0.9 }),
                                            tokenUsage: { inputTokens: 100, outputTokens: 50 },
                                        }];
                                });
                            });
                        },
                    };
                    runtime = new http_api_1.HTTPAPIRuntime({
                        clientFactory: function () { return mixedClient; },
                    });
                    testDAG = createTestDAG();
                    return [4 /*yield*/, runtime.submitJob(testDAG)];
                case 1:
                    jobId = _b.sent();
                    return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                case 2:
                    job = _b.sent();
                    (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('failed');
                    (0, vitest_1.expect)((_a = job === null || job === void 0 ? void 0 : job.result) === null || _a === void 0 ? void 0 : _a.errors.length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('event stream provides complete execution trace', function () { return __awaiter(void 0, void 0, void 0, function () {
        var runtime, testDAG, eventTypes, jobId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    runtime = new http_api_1.HTTPAPIRuntime();
                    testDAG = createTestDAG();
                    eventTypes = [];
                    runtime.subscribeAll(function (event) {
                        eventTypes.push(event.type);
                    });
                    return [4 /*yield*/, runtime.submitJob(testDAG)];
                case 1:
                    jobId = _a.sent();
                    return [4 /*yield*/, waitForJobCompletion(runtime, jobId)];
                case 2:
                    _a.sent();
                    (0, vitest_1.expect)(eventTypes).toContain('job:created');
                    (0, vitest_1.expect)(eventTypes).toContain('job:started');
                    (0, vitest_1.expect)(eventTypes).toContain('wave:start');
                    (0, vitest_1.expect)(eventTypes).toContain('node:start');
                    (0, vitest_1.expect)(eventTypes).toContain('node:complete');
                    (0, vitest_1.expect)(eventTypes).toContain('wave:complete');
                    (0, vitest_1.expect)(eventTypes).toContain('job:completed');
                    return [2 /*return*/];
            }
        });
    }); });
});

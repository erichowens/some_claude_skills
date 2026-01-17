"use strict";
/**
 * Tests for CheckpointManager and StorageAdapters
 *
 * Tests checkpoint save/load/resume functionality and
 * storage adapter implementations.
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
var vitest_1 = require("vitest");
var checkpoint_manager_1 = require("./checkpoint-manager");
var storage_adapters_1 = require("./storage-adapters");
// =============================================================================
// Test Fixtures
// =============================================================================
function createMockDAG(id) {
    if (id === void 0) { id = 'test-dag'; }
    return {
        id: id,
        nodes: {
            'node-1': {
                id: 'node-1',
                type: 'task',
                description: 'First task',
                skillId: 'test-skill',
                dependencies: [],
                config: {},
            },
            'node-2': {
                id: 'node-2',
                type: 'task',
                description: 'Second task',
                skillId: 'test-skill',
                dependencies: ['node-1'],
                config: {},
            },
            'node-3': {
                id: 'node-3',
                type: 'task',
                description: 'Third task',
                skillId: 'test-skill',
                dependencies: ['node-2'],
                config: {},
            },
        },
        inputs: [],
        outputs: [],
        config: {},
    };
}
function createMockSnapshot(overrides) {
    return __assign({ executionId: 'exec-123', currentWave: 1, nodeStates: {
            'node-1': 'completed',
            'node-2': 'executing',
            'node-3': 'pending',
        }, results: new Map([
            ['node-1', { output: { data: 'result-1' }, confidence: 0.9 }],
        ]), errors: new Map(), startedAt: new Date('2025-01-15T10:00:00Z'), totalTokenUsage: { inputTokens: 1000, outputTokens: 500 } }, overrides);
}
// =============================================================================
// Storage Adapter Tests
// =============================================================================
(0, vitest_1.describe)('MemoryStorageAdapter', function () {
    var storage;
    (0, vitest_1.beforeEach)(function () {
        storage = new storage_adapters_1.MemoryStorageAdapter();
    });
    (0, vitest_1.it)('stores and retrieves values', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.set('key1', 'value1')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, storage.get('key1')];
                case 2:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).toBe('value1');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('returns null for missing keys', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.get('nonexistent')];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('deletes values', function () { return __awaiter(void 0, void 0, void 0, function () {
        var deleted, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, storage.set('key1', 'value1')];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, storage.delete('key1')];
                case 2:
                    deleted = _b.sent();
                    (0, vitest_1.expect)(deleted).toBe(true);
                    _a = vitest_1.expect;
                    return [4 /*yield*/, storage.get('key1')];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('lists keys with prefix', function () { return __awaiter(void 0, void 0, void 0, function () {
        var keys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.set('prefix:key1', 'value1')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, storage.set('prefix:key2', 'value2')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, storage.set('other:key3', 'value3')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, storage.keys('prefix:')];
                case 4:
                    keys = _a.sent();
                    (0, vitest_1.expect)(keys).toHaveLength(2);
                    (0, vitest_1.expect)(keys).toContain('prefix:key1');
                    (0, vitest_1.expect)(keys).toContain('prefix:key2');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('clears all values', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, storage.set('key1', 'value1')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, storage.set('key2', 'value2')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, storage.clear()];
                case 3:
                    _c.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, storage.get('key1')];
                case 4:
                    _a.apply(void 0, [_c.sent()]).toBeNull();
                    _b = vitest_1.expect;
                    return [4 /*yield*/, storage.get('key2')];
                case 5:
                    _b.apply(void 0, [_c.sent()]).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('reports correct stats', function () { return __awaiter(void 0, void 0, void 0, function () {
        var stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.set('key1', 'value1')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, storage.set('key2', 'value2')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, storage.getStats()];
                case 3:
                    stats = _a.sent();
                    (0, vitest_1.expect)(stats.keyCount).toBe(2);
                    (0, vitest_1.expect)(stats.isPersistent).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('createStorageAdapter', function () {
    (0, vitest_1.it)('creates memory adapter', function () {
        var adapter = (0, storage_adapters_1.createStorageAdapter)('memory');
        (0, vitest_1.expect)(adapter.type).toBe('memory');
    });
    (0, vitest_1.it)('creates localStorage adapter', function () {
        var adapter = (0, storage_adapters_1.createStorageAdapter)('localStorage', { prefix: 'test:' });
        (0, vitest_1.expect)(adapter.type).toBe('localStorage');
    });
    (0, vitest_1.it)('throws for file adapter without baseDir', function () {
        (0, vitest_1.expect)(function () { return (0, storage_adapters_1.createStorageAdapter)('file'); }).toThrow('baseDir is required');
    });
});
// =============================================================================
// CheckpointManager Tests
// =============================================================================
(0, vitest_1.describe)('CheckpointManager', function () {
    var manager;
    var storage;
    (0, vitest_1.beforeEach)(function () {
        storage = new storage_adapters_1.MemoryStorageAdapter();
        manager = new checkpoint_manager_1.CheckpointManager({ storage: storage, verbose: false });
    });
    (0, vitest_1.describe)('save and load', function () {
        (0, vitest_1.it)('saves and loads checkpoints', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint, loaded;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createMockDAG();
                        snapshot = createMockSnapshot();
                        checkpoint = manager.createCheckpoint(dag, snapshot);
                        return [4 /*yield*/, manager.save(checkpoint)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, manager.load(checkpoint.id)];
                    case 2:
                        loaded = _a.sent();
                        (0, vitest_1.expect)(loaded).not.toBeNull();
                        (0, vitest_1.expect)(loaded.id).toBe(checkpoint.id);
                        (0, vitest_1.expect)(loaded.dag.id).toBe(dag.id);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns null for missing checkpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
            var loaded;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, manager.load('nonexistent')];
                    case 1:
                        loaded = _a.sent();
                        (0, vitest_1.expect)(loaded).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('includes version in checkpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint;
            return __generator(this, function (_a) {
                dag = createMockDAG();
                snapshot = createMockSnapshot();
                checkpoint = manager.createCheckpoint(dag, snapshot);
                (0, vitest_1.expect)(checkpoint.version).toBe(checkpoint_manager_1.CheckpointManager.CURRENT_VERSION);
                return [2 /*return*/];
            });
        }); });
    });
    (0, vitest_1.describe)('createCheckpoint', function () {
        (0, vitest_1.it)('captures DAG structure', function () {
            var dag = createMockDAG();
            var snapshot = createMockSnapshot();
            var checkpoint = manager.createCheckpoint(dag, snapshot);
            (0, vitest_1.expect)(checkpoint.dag.nodeIds).toContain('node-1');
            (0, vitest_1.expect)(checkpoint.dag.nodeIds).toContain('node-2');
            (0, vitest_1.expect)(checkpoint.dag.nodeIds).toContain('node-3');
            (0, vitest_1.expect)(checkpoint.dag.dependencies['node-2']).toContain('node-1');
        });
        (0, vitest_1.it)('captures execution state', function () {
            var dag = createMockDAG();
            var snapshot = createMockSnapshot();
            var checkpoint = manager.createCheckpoint(dag, snapshot);
            (0, vitest_1.expect)(checkpoint.execution.currentWave).toBe(1);
            (0, vitest_1.expect)(checkpoint.execution.nodeStates['node-1']).toBe('completed');
            (0, vitest_1.expect)(checkpoint.execution.nodeStates['node-2']).toBe('executing');
        });
        (0, vitest_1.it)('captures results', function () {
            var dag = createMockDAG();
            var snapshot = createMockSnapshot();
            var checkpoint = manager.createCheckpoint(dag, snapshot);
            (0, vitest_1.expect)(checkpoint.execution.results['node-1']).toBeDefined();
            (0, vitest_1.expect)(checkpoint.execution.results['node-1'].output).toEqual({ data: 'result-1' });
        });
    });
    (0, vitest_1.describe)('list', function () {
        (0, vitest_1.it)('lists all checkpoints', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag1, dag2, snapshot, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag1 = createMockDAG('dag-1');
                        dag2 = createMockDAG('dag-2');
                        snapshot = createMockSnapshot();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag1, snapshot))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag2, snapshot))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, manager.list()];
                    case 3:
                        list = _a.sent();
                        (0, vitest_1.expect)(list).toHaveLength(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('filters by DAG ID', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag1, dag2, snapshot, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag1 = createMockDAG('dag-1');
                        dag2 = createMockDAG('dag-2');
                        snapshot = createMockSnapshot();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag1, snapshot))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag2, snapshot))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, manager.list({ dagId: 'dag-1' })];
                    case 3:
                        list = _a.sent();
                        (0, vitest_1.expect)(list).toHaveLength(1);
                        (0, vitest_1.expect)(list[0].dagId).toBe('dag-1');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('limits results', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, i, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag = createMockDAG();
                        snapshot = createMockSnapshot();
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 5)) return [3 /*break*/, 4];
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag, __assign(__assign({}, snapshot), { executionId: "exec-".concat(i) })))];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, manager.list({ limit: 3 })];
                    case 5:
                        list = _a.sent();
                        (0, vitest_1.expect)(list).toHaveLength(3);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('prepareResume', function () {
        (0, vitest_1.it)('identifies nodes to execute', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint, resumeState;
            return __generator(this, function (_a) {
                dag = createMockDAG();
                snapshot = createMockSnapshot({
                    nodeStates: {
                        'node-1': 'completed',
                        'node-2': 'failed',
                        'node-3': 'pending',
                    },
                });
                checkpoint = manager.createCheckpoint(dag, snapshot);
                resumeState = manager.prepareResume(checkpoint);
                // By default, retry failed nodes
                (0, vitest_1.expect)(resumeState.nodesToExecute).toContain('node-2');
                (0, vitest_1.expect)(resumeState.nodesToExecute).toContain('node-3');
                (0, vitest_1.expect)(resumeState.nodesToExecute).not.toContain('node-1');
                return [2 /*return*/];
            });
        }); });
        (0, vitest_1.it)('preserves completed results', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint, resumeState;
            return __generator(this, function (_a) {
                dag = createMockDAG();
                snapshot = createMockSnapshot();
                checkpoint = manager.createCheckpoint(dag, snapshot);
                resumeState = manager.prepareResume(checkpoint);
                (0, vitest_1.expect)(resumeState.completedResults.has('node-1')).toBe(true);
                return [2 /*return*/];
            });
        }); });
        (0, vitest_1.it)('respects retryFailed option', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint, resumeState;
            return __generator(this, function (_a) {
                dag = createMockDAG();
                snapshot = createMockSnapshot({
                    nodeStates: {
                        'node-1': 'completed',
                        'node-2': 'failed',
                        'node-3': 'pending',
                    },
                });
                checkpoint = manager.createCheckpoint(dag, snapshot);
                resumeState = manager.prepareResume(checkpoint, { retryFailed: false });
                (0, vitest_1.expect)(resumeState.nodesToExecute).not.toContain('node-2');
                return [2 /*return*/];
            });
        }); });
        (0, vitest_1.it)('respects reExecuteCompleted option', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint, resumeState;
            return __generator(this, function (_a) {
                dag = createMockDAG();
                snapshot = createMockSnapshot();
                checkpoint = manager.createCheckpoint(dag, snapshot);
                resumeState = manager.prepareResume(checkpoint, { reExecuteCompleted: true });
                (0, vitest_1.expect)(resumeState.nodesToExecute).toContain('node-1');
                return [2 /*return*/];
            });
        }); });
    });
    (0, vitest_1.describe)('delete', function () {
        (0, vitest_1.it)('deletes existing checkpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag, snapshot, checkpoint, deleted, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dag = createMockDAG();
                        snapshot = createMockSnapshot();
                        checkpoint = manager.createCheckpoint(dag, snapshot);
                        return [4 /*yield*/, manager.save(checkpoint)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, manager.delete(checkpoint.id)];
                    case 2:
                        deleted = _b.sent();
                        (0, vitest_1.expect)(deleted).toBe(true);
                        _a = vitest_1.expect;
                        return [4 /*yield*/, manager.load(checkpoint.id)];
                    case 3:
                        _a.apply(void 0, [_b.sent()]).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('returns false for nonexistent checkpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
            var deleted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, manager.delete('nonexistent')];
                    case 1:
                        deleted = _a.sent();
                        (0, vitest_1.expect)(deleted).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('getStats', function () {
        (0, vitest_1.it)('reports checkpoint statistics', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dag1, dag2, snapshot, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dag1 = createMockDAG('dag-1');
                        dag2 = createMockDAG('dag-2');
                        snapshot = createMockSnapshot();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag1, snapshot))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag1, __assign(__assign({}, snapshot), { executionId: 'exec-2' })))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, manager.save(manager.createCheckpoint(dag2, snapshot))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, manager.getStats()];
                    case 4:
                        stats = _a.sent();
                        (0, vitest_1.expect)(stats.totalCheckpoints).toBe(3);
                        (0, vitest_1.expect)(stats.checkpointsByDAG['dag-1']).toBe(2);
                        (0, vitest_1.expect)(stats.checkpointsByDAG['dag-2']).toBe(1);
                        (0, vitest_1.expect)(stats.storageType).toBe('memory');
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
(0, vitest_1.describe)('createCheckpointManager', function () {
    (0, vitest_1.it)('creates manager with custom config', function () {
        var storage = new storage_adapters_1.MemoryStorageAdapter();
        var manager = (0, checkpoint_manager_1.createCheckpointManager)({
            storage: storage,
            maxCheckpointsPerDAG: 5,
        });
        (0, vitest_1.expect)(manager).toBeInstanceOf(checkpoint_manager_1.CheckpointManager);
    });
});

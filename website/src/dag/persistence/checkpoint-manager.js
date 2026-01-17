"use strict";
/**
 * Checkpoint Manager for DAG Persistence
 *
 * Manages saving, loading, and resuming DAG execution state.
 * Enables recovery from interrupted executions.
 *
 * @module dag/persistence/checkpoint-manager
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
exports.checkpointManager = exports.CheckpointManager = void 0;
exports.createCheckpointManager = createCheckpointManager;
exports.saveCheckpoint = saveCheckpoint;
exports.loadAndPrepareResume = loadAndPrepareResume;
var storage_adapters_1 = require("./storage-adapters");
// =============================================================================
// CHECKPOINT MANAGER CLASS
// =============================================================================
/**
 * CheckpointManager handles DAG execution persistence.
 *
 * @example
 * ```typescript
 * const checkpointManager = new CheckpointManager();
 *
 * // Save checkpoint during execution
 * await checkpointManager.save(checkpoint);
 *
 * // List available checkpoints
 * const checkpoints = await checkpointManager.list({ dagId: 'my-dag' });
 *
 * // Load and resume
 * const checkpoint = await checkpointManager.load(checkpointId);
 * const resumeState = checkpointManager.prepareResume(checkpoint);
 * ```
 */
var CheckpointManager = /** @class */ (function () {
    function CheckpointManager(config) {
        if (config === void 0) { config = {}; }
        var _a, _b, _c;
        this.storage = config.storage || (0, storage_adapters_1.autoDetectStorage)();
        this.config = {
            storage: this.storage,
            autoSaveIntervalMs: (_a = config.autoSaveIntervalMs) !== null && _a !== void 0 ? _a : 0,
            maxCheckpointsPerDAG: (_b = config.maxCheckpointsPerDAG) !== null && _b !== void 0 ? _b : 10,
            verbose: (_c = config.verbose) !== null && _c !== void 0 ? _c : false,
        };
    }
    // ===========================================================================
    // CORE OPERATIONS
    // ===========================================================================
    /**
     * Save a checkpoint
     */
    CheckpointManager.prototype.save = function (checkpoint) {
        return __awaiter(this, void 0, void 0, function () {
            var key, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getKey(checkpoint.id);
                        data = JSON.stringify(checkpoint);
                        return [4 /*yield*/, this.storage.set(key, data)];
                    case 1:
                        _a.sent();
                        if (this.config.verbose) {
                            console.log("[CheckpointManager] Saved checkpoint: ".concat(checkpoint.id));
                        }
                        // Cleanup old checkpoints if needed
                        return [4 /*yield*/, this.cleanupOldCheckpoints(checkpoint.dag.id)];
                    case 2:
                        // Cleanup old checkpoints if needed
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Load a checkpoint by ID
     */
    CheckpointManager.prototype.load = function (checkpointId) {
        return __awaiter(this, void 0, void 0, function () {
            var key, data, checkpoint;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.getKey(checkpointId);
                        return [4 /*yield*/, this.storage.get(key)];
                    case 1:
                        data = _a.sent();
                        if (!data) {
                            if (this.config.verbose) {
                                console.log("[CheckpointManager] Checkpoint not found: ".concat(checkpointId));
                            }
                            return [2 /*return*/, null];
                        }
                        checkpoint = JSON.parse(data);
                        // Version check
                        if (checkpoint.version !== CheckpointManager.CURRENT_VERSION) {
                            console.warn("[CheckpointManager] Checkpoint version mismatch: " +
                                "expected ".concat(CheckpointManager.CURRENT_VERSION, ", got ").concat(checkpoint.version));
                        }
                        return [2 /*return*/, checkpoint];
                }
            });
        });
    };
    /**
     * Delete a checkpoint
     */
    CheckpointManager.prototype.delete = function (checkpointId) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                key = this.getKey(checkpointId);
                return [2 /*return*/, this.storage.delete(key)];
            });
        });
    };
    /**
     * Check if a checkpoint exists
     */
    CheckpointManager.prototype.exists = function (checkpointId) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                key = this.getKey(checkpointId);
                return [2 /*return*/, this.storage.has(key)];
            });
        });
    };
    /**
     * List available checkpoints
     */
    CheckpointManager.prototype.list = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var keys, summaries, _i, keys_1, key, data, checkpoint, sortBy, sortOrder;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.keys(CheckpointManager.KEY_PREFIX)];
                    case 1:
                        keys = _a.sent();
                        summaries = [];
                        _i = 0, keys_1 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 5];
                        key = keys_1[_i];
                        return [4 /*yield*/, this.storage.get(key)];
                    case 3:
                        data = _a.sent();
                        if (!data)
                            return [3 /*break*/, 4];
                        try {
                            checkpoint = JSON.parse(data);
                            // Filter by DAG ID if specified
                            if (options.dagId && checkpoint.dag.id !== options.dagId) {
                                return [3 /*break*/, 4];
                            }
                            summaries.push({
                                id: checkpoint.id,
                                dagId: checkpoint.dag.id,
                                executionId: checkpoint.execution.executionId,
                                currentWave: checkpoint.execution.currentWave,
                                completedNodes: Object.values(checkpoint.execution.nodeStates)
                                    .filter(function (s) { return s === 'completed'; }).length,
                                totalNodes: Object.keys(checkpoint.execution.nodeStates).length,
                                createdAt: new Date(checkpoint.createdAt),
                                updatedAt: new Date(checkpoint.updatedAt),
                            });
                        }
                        catch (err) {
                            console.warn("[CheckpointManager] Invalid checkpoint data: ".concat(key));
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        sortBy = options.sortBy || 'updatedAt';
                        sortOrder = options.sortOrder || 'desc';
                        summaries.sort(function (a, b) {
                            var aVal = a[sortBy].getTime();
                            var bVal = b[sortBy].getTime();
                            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
                        });
                        // Limit
                        if (options.limit) {
                            return [2 /*return*/, summaries.slice(0, options.limit)];
                        }
                        return [2 /*return*/, summaries];
                }
            });
        });
    };
    // ===========================================================================
    // CHECKPOINT CREATION
    // ===========================================================================
    /**
     * Create a checkpoint from current execution state
     */
    CheckpointManager.prototype.createCheckpoint = function (dag, snapshot, metadata) {
        var now = new Date().toISOString();
        var checkpointId = this.generateCheckpointId(dag.id, snapshot.executionId);
        // Extract minimal DAG data
        var dagData = {
            id: dag.id,
            nodeIds: Object.keys(dag.nodes),
            dependencies: {},
            nodeConfigs: {},
        };
        for (var _i = 0, _a = Object.entries(dag.nodes); _i < _a.length; _i++) {
            var _b = _a[_i], nodeId = _b[0], node = _b[1];
            dagData.dependencies[nodeId] = node.dependencies;
            dagData.nodeConfigs[nodeId] = {
                id: node.id,
                type: node.type,
                skillId: node.skillId,
                description: node.description,
            };
        }
        // Extract execution state
        var executionData = {
            executionId: snapshot.executionId,
            currentWave: snapshot.currentWave,
            nodeStates: __assign({}, snapshot.nodeStates),
            results: {},
            errors: {},
            startedAt: snapshot.startedAt.toISOString(),
            tokenUsage: snapshot.totalTokenUsage ? {
                inputTokens: snapshot.totalTokenUsage.inputTokens,
                outputTokens: snapshot.totalTokenUsage.outputTokens,
            } : undefined,
        };
        // Copy results and errors
        for (var _c = 0, _d = snapshot.results; _c < _d.length; _c++) {
            var _e = _d[_c], nodeId = _e[0], result = _e[1];
            executionData.results[nodeId] = result;
        }
        for (var _f = 0, _g = snapshot.errors; _f < _g.length; _f++) {
            var _h = _g[_f], nodeId = _h[0], error = _h[1];
            executionData.errors[nodeId] = error;
        }
        return {
            id: checkpointId,
            dag: dagData,
            execution: executionData,
            createdAt: now,
            updatedAt: now,
            version: CheckpointManager.CURRENT_VERSION,
            metadata: metadata,
        };
    };
    /**
     * Update an existing checkpoint
     */
    CheckpointManager.prototype.updateCheckpoint = function (checkpointId, snapshot) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, _i, _a, _b, nodeId, result, _c, _d, _e, nodeId, error;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.load(checkpointId)];
                    case 1:
                        existing = _f.sent();
                        if (!existing) {
                            throw new Error("Checkpoint not found: ".concat(checkpointId));
                        }
                        // Update execution state
                        existing.execution.currentWave = snapshot.currentWave;
                        existing.execution.nodeStates = __assign({}, snapshot.nodeStates);
                        // Update results and errors
                        for (_i = 0, _a = snapshot.results; _i < _a.length; _i++) {
                            _b = _a[_i], nodeId = _b[0], result = _b[1];
                            existing.execution.results[nodeId] = result;
                        }
                        for (_c = 0, _d = snapshot.errors; _c < _d.length; _c++) {
                            _e = _d[_c], nodeId = _e[0], error = _e[1];
                            existing.execution.errors[nodeId] = error;
                        }
                        if (snapshot.totalTokenUsage) {
                            existing.execution.tokenUsage = {
                                inputTokens: snapshot.totalTokenUsage.inputTokens,
                                outputTokens: snapshot.totalTokenUsage.outputTokens,
                            };
                        }
                        existing.updatedAt = new Date().toISOString();
                        return [4 /*yield*/, this.save(existing)];
                    case 2:
                        _f.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ===========================================================================
    // RESUME OPERATIONS
    // ===========================================================================
    /**
     * Prepare resume state from a checkpoint
     */
    CheckpointManager.prototype.prepareResume = function (checkpoint, options) {
        if (options === void 0) { options = {}; }
        var _a = options.retryFailed, retryFailed = _a === void 0 ? true : _a, _b = options.reExecuteCompleted, reExecuteCompleted = _b === void 0 ? false : _b, _c = options.reExecuteNodes, reExecuteNodes = _c === void 0 ? [] : _c;
        var nodesToExecute = [];
        var completedResults = new Map();
        for (var _i = 0, _d = Object.entries(checkpoint.execution.nodeStates); _i < _d.length; _i++) {
            var _e = _d[_i], nodeId = _e[0], state = _e[1];
            if (reExecuteNodes.includes(nodeId)) {
                // Explicitly marked for re-execution
                nodesToExecute.push(nodeId);
            }
            else if (state === 'completed') {
                if (reExecuteCompleted) {
                    nodesToExecute.push(nodeId);
                }
                else {
                    // Preserve completed results
                    var result = checkpoint.execution.results[nodeId];
                    if (result) {
                        completedResults.set(nodeId, result);
                    }
                }
            }
            else if (state === 'failed') {
                if (retryFailed) {
                    nodesToExecute.push(nodeId);
                }
            }
            else if (state === 'pending' || state === 'ready' || state === 'executing') {
                // These need to be (re-)executed
                nodesToExecute.push(nodeId);
            }
        }
        return {
            checkpointId: checkpoint.id,
            dagId: checkpoint.dag.id,
            executionId: checkpoint.execution.executionId,
            startFromWave: this.calculateStartWave(checkpoint, nodesToExecute),
            nodesToExecute: nodesToExecute,
            completedResults: completedResults,
            previousTokenUsage: checkpoint.execution.tokenUsage,
        };
    };
    /**
     * Calculate which wave to start from based on nodes to execute
     */
    CheckpointManager.prototype.calculateStartWave = function (checkpoint, nodesToExecute) {
        // Simple approach: if any node from wave N needs execution,
        // start from wave N
        // For now, just start from wave 0 if there are nodes to execute
        return nodesToExecute.length > 0 ? 0 : checkpoint.execution.currentWave;
    };
    // ===========================================================================
    // AUTO-SAVE
    // ===========================================================================
    /**
     * Start auto-saving at configured interval
     */
    CheckpointManager.prototype.startAutoSave = function (getSnapshot) {
        var _this = this;
        if (this.config.autoSaveIntervalMs <= 0)
            return;
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var state, checkpoint, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        state = getSnapshot();
                        if (!state) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        checkpoint = this.createCheckpoint(state.dag, state.snapshot);
                        return [4 /*yield*/, this.save(checkpoint)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error('[CheckpointManager] Auto-save failed:', err_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); }, this.config.autoSaveIntervalMs);
    };
    /**
     * Stop auto-saving
     */
    CheckpointManager.prototype.stopAutoSave = function () {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
    };
    // ===========================================================================
    // CLEANUP
    // ===========================================================================
    /**
     * Clean up old checkpoints for a DAG
     */
    CheckpointManager.prototype.cleanupOldCheckpoints = function (dagId) {
        return __awaiter(this, void 0, void 0, function () {
            var checkpoints, toDelete, _i, toDelete_1, checkpoint;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.list({
                            dagId: dagId,
                            sortBy: 'createdAt',
                            sortOrder: 'desc',
                        })];
                    case 1:
                        checkpoints = _a.sent();
                        if (checkpoints.length <= this.config.maxCheckpointsPerDAG) {
                            return [2 /*return*/];
                        }
                        toDelete = checkpoints.slice(this.config.maxCheckpointsPerDAG);
                        _i = 0, toDelete_1 = toDelete;
                        _a.label = 2;
                    case 2:
                        if (!(_i < toDelete_1.length)) return [3 /*break*/, 5];
                        checkpoint = toDelete_1[_i];
                        return [4 /*yield*/, this.delete(checkpoint.id)];
                    case 3:
                        _a.sent();
                        if (this.config.verbose) {
                            console.log("[CheckpointManager] Deleted old checkpoint: ".concat(checkpoint.id));
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear all checkpoints
     */
    CheckpointManager.prototype.clearAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.clear(CheckpointManager.KEY_PREFIX)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ===========================================================================
    // UTILITIES
    // ===========================================================================
    CheckpointManager.prototype.getKey = function (checkpointId) {
        return CheckpointManager.KEY_PREFIX + checkpointId;
    };
    CheckpointManager.prototype.generateCheckpointId = function (dagId, executionId) {
        var timestamp = Date.now();
        return "".concat(dagId, "-").concat(executionId, "-").concat(timestamp);
    };
    /**
     * Get storage statistics
     */
    CheckpointManager.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var storageStats, checkpoints, dagCounts, _i, checkpoints_1, cp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getStats()];
                    case 1:
                        storageStats = _a.sent();
                        return [4 /*yield*/, this.list()];
                    case 2:
                        checkpoints = _a.sent();
                        dagCounts = {};
                        for (_i = 0, checkpoints_1 = checkpoints; _i < checkpoints_1.length; _i++) {
                            cp = checkpoints_1[_i];
                            dagCounts[cp.dagId] = (dagCounts[cp.dagId] || 0) + 1;
                        }
                        return [2 /*return*/, {
                                totalCheckpoints: checkpoints.length,
                                checkpointsByDAG: dagCounts,
                                storageUsedBytes: storageStats.totalSize,
                                storageType: this.storage.type,
                            }];
                }
            });
        });
    };
    CheckpointManager.CURRENT_VERSION = 1;
    CheckpointManager.KEY_PREFIX = 'checkpoint:';
    return CheckpointManager;
}());
exports.CheckpointManager = CheckpointManager;
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/** Default checkpoint manager instance */
exports.checkpointManager = new CheckpointManager();
/**
 * Create a configured checkpoint manager
 */
function createCheckpointManager(config) {
    return new CheckpointManager(config);
}
/**
 * Quick save a checkpoint
 */
function saveCheckpoint(dag, snapshot, storage) {
    return __awaiter(this, void 0, void 0, function () {
        var manager, checkpoint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = storage
                        ? new CheckpointManager({ storage: storage })
                        : exports.checkpointManager;
                    checkpoint = manager.createCheckpoint(dag, snapshot);
                    return [4 /*yield*/, manager.save(checkpoint)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, checkpoint.id];
            }
        });
    });
}
/**
 * Quick load and prepare resume
 */
function loadAndPrepareResume(checkpointId, options) {
    return __awaiter(this, void 0, void 0, function () {
        var manager, checkpoint;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = (options === null || options === void 0 ? void 0 : options.storage)
                        ? new CheckpointManager({ storage: options.storage })
                        : exports.checkpointManager;
                    return [4 /*yield*/, manager.load(checkpointId)];
                case 1:
                    checkpoint = _a.sent();
                    if (!checkpoint)
                        return [2 /*return*/, null];
                    return [2 /*return*/, manager.prepareResume(checkpoint, options)];
            }
        });
    });
}

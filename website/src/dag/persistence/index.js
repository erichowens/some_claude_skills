"use strict";
/**
 * Persistence Layer for DAG Framework
 *
 * Provides checkpoint management and storage adapters for
 * saving and resuming interrupted DAG executions.
 *
 * @module dag/persistence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAndPrepareResume = exports.saveCheckpoint = exports.createCheckpointManager = exports.checkpointManager = exports.CheckpointManager = exports.defaultStorage = exports.autoDetectStorage = exports.createStorageAdapter = exports.FileStorageAdapter = exports.LocalStorageAdapter = exports.MemoryStorageAdapter = void 0;
// Storage Adapters
var storage_adapters_1 = require("./storage-adapters");
Object.defineProperty(exports, "MemoryStorageAdapter", { enumerable: true, get: function () { return storage_adapters_1.MemoryStorageAdapter; } });
Object.defineProperty(exports, "LocalStorageAdapter", { enumerable: true, get: function () { return storage_adapters_1.LocalStorageAdapter; } });
Object.defineProperty(exports, "FileStorageAdapter", { enumerable: true, get: function () { return storage_adapters_1.FileStorageAdapter; } });
Object.defineProperty(exports, "createStorageAdapter", { enumerable: true, get: function () { return storage_adapters_1.createStorageAdapter; } });
Object.defineProperty(exports, "autoDetectStorage", { enumerable: true, get: function () { return storage_adapters_1.autoDetectStorage; } });
Object.defineProperty(exports, "defaultStorage", { enumerable: true, get: function () { return storage_adapters_1.defaultStorage; } });
// Checkpoint Manager
var checkpoint_manager_1 = require("./checkpoint-manager");
Object.defineProperty(exports, "CheckpointManager", { enumerable: true, get: function () { return checkpoint_manager_1.CheckpointManager; } });
Object.defineProperty(exports, "checkpointManager", { enumerable: true, get: function () { return checkpoint_manager_1.checkpointManager; } });
Object.defineProperty(exports, "createCheckpointManager", { enumerable: true, get: function () { return checkpoint_manager_1.createCheckpointManager; } });
Object.defineProperty(exports, "saveCheckpoint", { enumerable: true, get: function () { return checkpoint_manager_1.saveCheckpoint; } });
Object.defineProperty(exports, "loadAndPrepareResume", { enumerable: true, get: function () { return checkpoint_manager_1.loadAndPrepareResume; } });

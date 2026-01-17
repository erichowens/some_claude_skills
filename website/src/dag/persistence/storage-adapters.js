"use strict";
/**
 * Storage Adapters for DAG Persistence
 *
 * Provides pluggable storage backends for DAG checkpoints:
 * - MemoryStorageAdapter: In-memory (testing, ephemeral)
 * - LocalStorageAdapter: Browser localStorage
 * - FileStorageAdapter: File system (Node.js)
 *
 * @module dag/persistence/storage-adapters
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
exports.defaultStorage = exports.FileStorageAdapter = exports.LocalStorageAdapter = exports.MemoryStorageAdapter = void 0;
exports.createStorageAdapter = createStorageAdapter;
exports.autoDetectStorage = autoDetectStorage;
// =============================================================================
// MEMORY STORAGE ADAPTER
// =============================================================================
/**
 * In-memory storage adapter
 *
 * Useful for testing and ephemeral storage.
 * Data is lost when the process exits.
 */
var MemoryStorageAdapter = /** @class */ (function () {
    function MemoryStorageAdapter() {
        this.type = 'memory';
        this.name = 'In-Memory Storage';
        this.data = new Map();
    }
    MemoryStorageAdapter.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.data.get(key)) !== null && _a !== void 0 ? _a : null];
            });
        });
    };
    MemoryStorageAdapter.prototype.set = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.data.set(key, value);
                return [2 /*return*/];
            });
        });
    };
    MemoryStorageAdapter.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.data.delete(key)];
            });
        });
    };
    MemoryStorageAdapter.prototype.has = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.data.has(key)];
            });
        });
    };
    MemoryStorageAdapter.prototype.keys = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var allKeys;
            return __generator(this, function (_a) {
                allKeys = Array.from(this.data.keys());
                if (!prefix)
                    return [2 /*return*/, allKeys];
                return [2 /*return*/, allKeys.filter(function (k) { return k.startsWith(prefix); })];
            });
        });
    };
    MemoryStorageAdapter.prototype.clear = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, key;
            return __generator(this, function (_b) {
                if (!prefix) {
                    this.data.clear();
                    return [2 /*return*/];
                }
                for (_i = 0, _a = this.data.keys(); _i < _a.length; _i++) {
                    key = _a[_i];
                    if (key.startsWith(prefix)) {
                        this.data.delete(key);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    MemoryStorageAdapter.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var totalSize, _i, _a, _b, key, value;
            return __generator(this, function (_c) {
                totalSize = 0;
                for (_i = 0, _a = this.data; _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], value = _b[1];
                    totalSize += key.length + value.length;
                }
                return [2 /*return*/, {
                        keyCount: this.data.size,
                        totalSize: totalSize,
                        isPersistent: false,
                    }];
            });
        });
    };
    return MemoryStorageAdapter;
}());
exports.MemoryStorageAdapter = MemoryStorageAdapter;
// =============================================================================
// LOCAL STORAGE ADAPTER
// =============================================================================
/**
 * localStorage adapter for browser environments
 *
 * Persists data across page reloads.
 * Limited to ~5MB in most browsers.
 */
var LocalStorageAdapter = /** @class */ (function () {
    function LocalStorageAdapter(prefix) {
        if (prefix === void 0) { prefix = 'dag-checkpoint:'; }
        this.type = 'localStorage';
        this.name = 'Browser LocalStorage';
        this.prefix = prefix;
    }
    LocalStorageAdapter.prototype.getFullKey = function (key) {
        return this.prefix + key;
    };
    LocalStorageAdapter.prototype.stripPrefix = function (fullKey) {
        return fullKey.slice(this.prefix.length);
    };
    LocalStorageAdapter.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (typeof localStorage === 'undefined')
                    return [2 /*return*/, null];
                return [2 /*return*/, localStorage.getItem(this.getFullKey(key))];
            });
        });
    };
    LocalStorageAdapter.prototype.set = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (typeof localStorage === 'undefined') {
                    throw new Error('localStorage is not available');
                }
                localStorage.setItem(this.getFullKey(key), value);
                return [2 /*return*/];
            });
        });
    };
    LocalStorageAdapter.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var fullKey, existed;
            return __generator(this, function (_a) {
                if (typeof localStorage === 'undefined')
                    return [2 /*return*/, false];
                fullKey = this.getFullKey(key);
                existed = localStorage.getItem(fullKey) !== null;
                localStorage.removeItem(fullKey);
                return [2 /*return*/, existed];
            });
        });
    };
    LocalStorageAdapter.prototype.has = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (typeof localStorage === 'undefined')
                    return [2 /*return*/, false];
                return [2 /*return*/, localStorage.getItem(this.getFullKey(key)) !== null];
            });
        });
    };
    LocalStorageAdapter.prototype.keys = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var result, searchPrefix, i, fullKey;
            return __generator(this, function (_a) {
                if (typeof localStorage === 'undefined')
                    return [2 /*return*/, []];
                result = [];
                searchPrefix = this.prefix + (prefix || '');
                for (i = 0; i < localStorage.length; i++) {
                    fullKey = localStorage.key(i);
                    if (fullKey === null || fullKey === void 0 ? void 0 : fullKey.startsWith(searchPrefix)) {
                        result.push(this.stripPrefix(fullKey));
                    }
                }
                return [2 /*return*/, result];
            });
        });
    };
    LocalStorageAdapter.prototype.clear = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var keysToDelete, _i, keysToDelete_1, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof localStorage === 'undefined')
                            return [2 /*return*/];
                        return [4 /*yield*/, this.keys(prefix)];
                    case 1:
                        keysToDelete = _a.sent();
                        for (_i = 0, keysToDelete_1 = keysToDelete; _i < keysToDelete_1.length; _i++) {
                            key = keysToDelete_1[_i];
                            localStorage.removeItem(this.getFullKey(key));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    LocalStorageAdapter.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var totalSize, keyCount, i, fullKey, value;
            return __generator(this, function (_a) {
                if (typeof localStorage === 'undefined') {
                    return [2 /*return*/, { keyCount: 0, totalSize: 0, isPersistent: true }];
                }
                totalSize = 0;
                keyCount = 0;
                for (i = 0; i < localStorage.length; i++) {
                    fullKey = localStorage.key(i);
                    if (fullKey === null || fullKey === void 0 ? void 0 : fullKey.startsWith(this.prefix)) {
                        keyCount++;
                        value = localStorage.getItem(fullKey);
                        if (value) {
                            totalSize += fullKey.length + value.length;
                        }
                    }
                }
                return [2 /*return*/, {
                        keyCount: keyCount,
                        totalSize: totalSize,
                        isPersistent: true,
                        capacity: 5 * 1024 * 1024, // ~5MB typical limit
                    }];
            });
        });
    };
    return LocalStorageAdapter;
}());
exports.LocalStorageAdapter = LocalStorageAdapter;
// =============================================================================
// FILE STORAGE ADAPTER
// =============================================================================
/**
 * File system storage adapter for Node.js environments
 *
 * Stores each key as a separate JSON file.
 * Useful for CLI tools and server-side execution.
 */
var FileStorageAdapter = /** @class */ (function () {
    function FileStorageAdapter(baseDir) {
        this.type = 'file';
        this.name = 'File System Storage';
        this.fs = null;
        this.path = null;
        this.baseDir = baseDir;
    }
    FileStorageAdapter.prototype.ensureModules = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (this.fs && this.path)
                            return [2 /*return*/];
                        if (!(typeof process !== 'undefined' && ((_c = process.versions) === null || _c === void 0 ? void 0 : _c.node))) return [3 /*break*/, 4];
                        _a = this;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                    case 1:
                        _a.fs = _d.sent();
                        _b = this;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('path'); })];
                    case 2:
                        _b.path = _d.sent();
                        // Ensure base directory exists
                        return [4 /*yield*/, this.fs.mkdir(this.baseDir, { recursive: true })];
                    case 3:
                        // Ensure base directory exists
                        _d.sent();
                        return [3 /*break*/, 5];
                    case 4: throw new Error('FileStorageAdapter requires Node.js environment');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.getFilePath = function (key) {
        // Sanitize key for file system
        var safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return this.path.join(this.baseDir, "".concat(safeKey, ".json"));
    };
    FileStorageAdapter.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.fs.readFile(this.getFilePath(key), 'utf-8')];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        err_1 = _a.sent();
                        if (err_1.code === 'ENOENT')
                            return [2 /*return*/, null];
                        throw err_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.set = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.fs.writeFile(this.getFilePath(key), value, 'utf-8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.fs.unlink(this.getFilePath(key))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 4:
                        err_2 = _a.sent();
                        if (err_2.code === 'ENOENT')
                            return [2 /*return*/, false];
                        throw err_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.has = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.fs.access(this.getFilePath(key))];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 4:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.keys = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var files, keys, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.fs.readdir(this.baseDir)];
                    case 3:
                        files = _a.sent();
                        keys = files
                            .filter(function (f) { return f.endsWith('.json'); })
                            .map(function (f) { return f.slice(0, -5); });
                        if (!prefix)
                            return [2 /*return*/, keys];
                        return [2 /*return*/, keys.filter(function (k) { return k.startsWith(prefix.replace(/[^a-zA-Z0-9_-]/g, '_')); })];
                    case 4:
                        err_3 = _a.sent();
                        if (err_3.code === 'ENOENT')
                            return [2 /*return*/, []];
                        throw err_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.clear = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var keysToDelete;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.keys(prefix)];
                    case 2:
                        keysToDelete = _a.sent();
                        return [4 /*yield*/, Promise.all(keysToDelete.map(function (key) { return _this.delete(key); }))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FileStorageAdapter.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keys, totalSize, _i, keys_1, key, stat, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureModules()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 9]);
                        return [4 /*yield*/, this.keys()];
                    case 3:
                        keys = _a.sent();
                        totalSize = 0;
                        _i = 0, keys_1 = keys;
                        _a.label = 4;
                    case 4:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 7];
                        key = keys_1[_i];
                        return [4 /*yield*/, this.fs.stat(this.getFilePath(key))];
                    case 5:
                        stat = _a.sent();
                        totalSize += stat.size;
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [2 /*return*/, {
                            keyCount: keys.length,
                            totalSize: totalSize,
                            isPersistent: true,
                        }];
                    case 8:
                        err_4 = _a.sent();
                        if (err_4.code === 'ENOENT') {
                            return [2 /*return*/, { keyCount: 0, totalSize: 0, isPersistent: true }];
                        }
                        throw err_4;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return FileStorageAdapter;
}());
exports.FileStorageAdapter = FileStorageAdapter;
// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================
/**
 * Create a storage adapter by type
 */
function createStorageAdapter(type, options) {
    switch (type) {
        case 'memory':
            return new MemoryStorageAdapter();
        case 'localStorage':
            return new LocalStorageAdapter(options === null || options === void 0 ? void 0 : options.prefix);
        case 'file':
            if (!(options === null || options === void 0 ? void 0 : options.baseDir)) {
                throw new Error('baseDir is required for file storage');
            }
            return new FileStorageAdapter(options.baseDir);
        default:
            throw new Error("Unknown storage adapter type: ".concat(type));
    }
}
/**
 * Auto-detect the best available storage adapter
 */
function autoDetectStorage(options) {
    var _a;
    // Prefer file storage in Node.js
    if (typeof process !== 'undefined' && ((_a = process.versions) === null || _a === void 0 ? void 0 : _a.node)) {
        var baseDir = (options === null || options === void 0 ? void 0 : options.baseDir) || '.dag-checkpoints';
        return new FileStorageAdapter(baseDir);
    }
    // Use localStorage in browser
    if (typeof localStorage !== 'undefined') {
        return new LocalStorageAdapter(options === null || options === void 0 ? void 0 : options.prefix);
    }
    // Fallback to memory
    return new MemoryStorageAdapter();
}
/** Default storage adapter instance */
exports.defaultStorage = new MemoryStorageAdapter();

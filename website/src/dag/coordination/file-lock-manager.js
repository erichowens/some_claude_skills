"use strict";
/**
 * File Lock Manager
 *
 * Coordinates file access across parallel agents to prevent conflicts.
 * Uses a simple file-based locking mechanism with automatic cleanup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLockManager = void 0;
exports.getSharedLockManager = getSharedLockManager;
exports.resetSharedLockManager = resetSharedLockManager;
var fs = require("fs");
var path = require("path");
/**
 * FileLockManager - Coordinates file access across parallel agents
 */
var FileLockManager = /** @class */ (function () {
    function FileLockManager(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        this.lockDir = config.lockDir || path.join(process.cwd(), '.claude', 'locks');
        this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5 minutes
        this.autoCleanup = config.autoCleanup !== false;
        this.locks = new Map();
        // Ensure lock directory exists
        if (!fs.existsSync(this.lockDir)) {
            fs.mkdirSync(this.lockDir, { recursive: true });
        }
        // Load existing locks
        this.loadLocks();
        // Clean up expired locks periodically
        if (this.autoCleanup) {
            setInterval(function () { return _this.cleanupExpiredLocks(); }, 30000); // Every 30 seconds
        }
    }
    /**
     * Attempt to acquire a lock on a file
     */
    FileLockManager.prototype.acquireLock = function (filePath, owner, operation, ttl) {
        if (operation === void 0) { operation = 'write'; }
        var normalizedPath = this.normalizePath(filePath);
        // Check if lock already exists and is valid
        var existingLock = this.locks.get(normalizedPath);
        if (existingLock && !this.isExpired(existingLock)) {
            // Allow multiple readers, but not readers with writers
            if (operation === 'read' && existingLock.operation === 'read') {
                return { success: true };
            }
            return {
                success: false,
                owner: existingLock.owner,
                expiresIn: existingLock.timestamp + existingLock.ttl - Date.now(),
                reason: "File locked by ".concat(existingLock.owner, " for ").concat(existingLock.operation),
            };
        }
        // Acquire the lock
        var lock = {
            filePath: normalizedPath,
            owner: owner,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            operation: operation,
        };
        this.locks.set(normalizedPath, lock);
        this.saveLock(lock);
        return { success: true };
    };
    /**
     * Release a lock
     */
    FileLockManager.prototype.releaseLock = function (filePath, owner) {
        var normalizedPath = this.normalizePath(filePath);
        var lock = this.locks.get(normalizedPath);
        if (!lock) {
            return false; // Lock doesn't exist
        }
        if (lock.owner !== owner) {
            return false; // Not the owner
        }
        this.locks.delete(normalizedPath);
        this.deleteLockFile(normalizedPath);
        return true;
    };
    /**
     * Check if a file is locked
     */
    FileLockManager.prototype.isLocked = function (filePath) {
        var normalizedPath = this.normalizePath(filePath);
        var lock = this.locks.get(normalizedPath);
        return lock ? !this.isExpired(lock) : false;
    };
    /**
     * Get the owner of a lock
     */
    FileLockManager.prototype.getLockOwner = function (filePath) {
        var normalizedPath = this.normalizePath(filePath);
        var lock = this.locks.get(normalizedPath);
        if (!lock || this.isExpired(lock)) {
            return null;
        }
        return lock.owner;
    };
    /**
     * Check for conflicts across multiple files
     */
    FileLockManager.prototype.checkConflicts = function (files, operation) {
        if (operation === void 0) { operation = 'write'; }
        var conflicts = [];
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var normalizedPath = this.normalizePath(file);
            var lock = this.locks.get(normalizedPath);
            if (lock && !this.isExpired(lock)) {
                // Conflict if trying to write, or if lock is for write
                if (operation === 'write' || lock.operation === 'write') {
                    conflicts.push({
                        file: normalizedPath,
                        owner: lock.owner,
                        expiresIn: lock.timestamp + lock.ttl - Date.now(),
                    });
                }
            }
        }
        return conflicts;
    };
    /**
     * Release all locks owned by a specific agent
     */
    FileLockManager.prototype.releaseAllLocks = function (owner) {
        var count = 0;
        for (var _i = 0, _a = this.locks.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], path_1 = _b[0], lock = _b[1];
            if (lock.owner === owner) {
                this.locks.delete(path_1);
                this.deleteLockFile(path_1);
                count++;
            }
        }
        return count;
    };
    /**
     * Get all active locks
     */
    FileLockManager.prototype.getAllLocks = function () {
        var _this = this;
        return Array.from(this.locks.values()).filter(function (lock) { return !_this.isExpired(lock); });
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Normalize file path for consistent lookup
     */
    FileLockManager.prototype.normalizePath = function (filePath) {
        return path.normalize(filePath).replace(/\\/g, '/');
    };
    /**
     * Check if a lock has expired
     */
    FileLockManager.prototype.isExpired = function (lock) {
        return Date.now() > lock.timestamp + lock.ttl;
    };
    /**
     * Load locks from disk
     */
    FileLockManager.prototype.loadLocks = function () {
        if (!fs.existsSync(this.lockDir)) {
            return;
        }
        var files = fs.readdirSync(this.lockDir);
        for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
            var file = files_2[_i];
            if (!file.endsWith('.lock'))
                continue;
            try {
                var lockPath = path.join(this.lockDir, file);
                var content = fs.readFileSync(lockPath, 'utf-8');
                var lock = JSON.parse(content);
                // Only load if not expired
                if (!this.isExpired(lock)) {
                    this.locks.set(lock.filePath, lock);
                }
                else {
                    // Clean up expired lock file
                    fs.unlinkSync(lockPath);
                }
            }
            catch (error) {
                console.error("Failed to load lock file ".concat(file, ":"), error);
            }
        }
    };
    /**
     * Save a lock to disk
     */
    FileLockManager.prototype.saveLock = function (lock) {
        var lockFileName = this.getLockFileName(lock.filePath);
        var lockPath = path.join(this.lockDir, lockFileName);
        fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), 'utf-8');
    };
    /**
     * Delete a lock file from disk
     */
    FileLockManager.prototype.deleteLockFile = function (filePath) {
        var lockFileName = this.getLockFileName(filePath);
        var lockPath = path.join(this.lockDir, lockFileName);
        if (fs.existsSync(lockPath)) {
            fs.unlinkSync(lockPath);
        }
    };
    /**
     * Get lock file name for a given file path
     */
    FileLockManager.prototype.getLockFileName = function (filePath) {
        // Create a safe filename from the file path
        var hash = Buffer.from(filePath).toString('base64url');
        return "".concat(hash, ".lock");
    };
    /**
     * Clean up expired locks
     */
    FileLockManager.prototype.cleanupExpiredLocks = function () {
        var expiredPaths = [];
        for (var _i = 0, _a = this.locks.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], path_2 = _b[0], lock = _b[1];
            if (this.isExpired(lock)) {
                expiredPaths.push(path_2);
            }
        }
        for (var _c = 0, expiredPaths_1 = expiredPaths; _c < expiredPaths_1.length; _c++) {
            var path_3 = expiredPaths_1[_c];
            this.locks.delete(path_3);
            this.deleteLockFile(path_3);
        }
        if (expiredPaths.length > 0) {
            console.log("Cleaned up ".concat(expiredPaths.length, " expired file locks"));
        }
    };
    return FileLockManager;
}());
exports.FileLockManager = FileLockManager;
/**
 * Singleton instance for easy access
 */
var sharedLockManager = null;
/**
 * Get the shared FileLockManager instance
 */
function getSharedLockManager(config) {
    if (!sharedLockManager) {
        sharedLockManager = new FileLockManager(config);
    }
    return sharedLockManager;
}
/**
 * Reset the shared instance (useful for testing)
 */
function resetSharedLockManager() {
    sharedLockManager = null;
}

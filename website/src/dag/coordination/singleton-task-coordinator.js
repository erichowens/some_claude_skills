"use strict";
/**
 * Singleton Task Coordinator
 *
 * Ensures that certain operations (build, lint, test) only run once at a time
 * across parallel agents. Prevents wasted resources and conflicts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingletonTaskCoordinator = exports.SINGLETON_TASKS = void 0;
exports.getSharedSingletonCoordinator = getSharedSingletonCoordinator;
exports.resetSharedSingletonCoordinator = resetSharedSingletonCoordinator;
var fs = require("fs");
var path = require("path");
/**
 * Singleton task types that should only run once at a time
 */
exports.SINGLETON_TASKS = {
    BUILD: 'build',
    LINT: 'lint',
    TEST: 'test',
    TYPECHECK: 'typecheck',
    INSTALL: 'install',
    DEPLOY: 'deploy',
};
/**
 * SingletonTaskCoordinator - Ensures exclusive execution of certain tasks
 */
var SingletonTaskCoordinator = /** @class */ (function () {
    function SingletonTaskCoordinator(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        this.singletonDir =
            config.singletonDir || path.join(process.cwd(), '.claude', 'singletons');
        this.defaultTTL = config.defaultTTL || 10 * 60 * 1000; // 10 minutes
        this.autoCleanup = config.autoCleanup !== false;
        this.activeTasks = new Map();
        // Ensure singleton directory exists
        if (!fs.existsSync(this.singletonDir)) {
            fs.mkdirSync(this.singletonDir, { recursive: true });
        }
        // Load existing singleton tasks
        this.loadSingletonTasks();
        // Clean up expired tasks periodically
        if (this.autoCleanup) {
            setInterval(function () { return _this.cleanupExpiredTasks(); }, 30000); // Every 30 seconds
        }
    }
    /**
     * Attempt to acquire a singleton task
     */
    SingletonTaskCoordinator.prototype.acquire = function (type, owner, description, ttl) {
        // Check if task is already running
        var existingTask = this.activeTasks.get(type);
        if (existingTask && !this.isExpired(existingTask)) {
            var remaining = existingTask.timestamp + existingTask.ttl - Date.now();
            return {
                success: false,
                currentOwner: existingTask.owner,
                currentTask: existingTask.description,
                estimatedTimeRemaining: Math.max(0, remaining),
                reason: "".concat(type, " is already running (owner: ").concat(existingTask.owner, ")"),
            };
        }
        // Acquire the task
        var task = {
            type: type,
            owner: owner,
            timestamp: Date.now(),
            description: description,
            ttl: ttl || this.defaultTTL,
        };
        this.activeTasks.set(type, task);
        this.saveTask(task);
        return { success: true };
    };
    /**
     * Release a singleton task
     */
    SingletonTaskCoordinator.prototype.release = function (type, owner) {
        var task = this.activeTasks.get(type);
        if (!task) {
            return false; // Task not running
        }
        if (task.owner !== owner) {
            return false; // Not the owner
        }
        this.activeTasks.delete(type);
        this.deleteTaskFile(type);
        return true;
    };
    /**
     * Check if a singleton task is running
     */
    SingletonTaskCoordinator.prototype.isRunning = function (type) {
        var task = this.activeTasks.get(type);
        return task ? !this.isExpired(task) : false;
    };
    /**
     * Get the current owner of a singleton task
     */
    SingletonTaskCoordinator.prototype.getOwner = function (type) {
        var task = this.activeTasks.get(type);
        if (!task || this.isExpired(task)) {
            return null;
        }
        return task.owner;
    };
    /**
     * Get all active singleton tasks
     */
    SingletonTaskCoordinator.prototype.getActiveTasks = function () {
        var _this = this;
        return Array.from(this.activeTasks.values()).filter(function (task) { return !_this.isExpired(task); });
    };
    /**
     * Release all tasks owned by a specific agent
     */
    SingletonTaskCoordinator.prototype.releaseAllTasks = function (owner) {
        var count = 0;
        for (var _i = 0, _a = this.activeTasks.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], task = _b[1];
            if (task.owner === owner) {
                this.activeTasks.delete(type);
                this.deleteTaskFile(type);
                count++;
            }
        }
        return count;
    };
    /**
     * Detect if a task description is a singleton task
     */
    SingletonTaskCoordinator.detectSingletonTask = function (description) {
        var lowerDesc = description.toLowerCase();
        // Build detection
        if (lowerDesc.includes('npm run build') ||
            lowerDesc.includes('yarn build') ||
            lowerDesc.includes('pnpm build') ||
            lowerDesc.includes('bun build') ||
            lowerDesc.match(/\bbuild\b.*project/)) {
            return exports.SINGLETON_TASKS.BUILD;
        }
        // Lint detection
        if (lowerDesc.includes('npm run lint') ||
            lowerDesc.includes('yarn lint') ||
            lowerDesc.includes('eslint') ||
            lowerDesc.match(/\blint\b.*code/)) {
            return exports.SINGLETON_TASKS.LINT;
        }
        // Test detection
        if (lowerDesc.includes('npm test') ||
            lowerDesc.includes('yarn test') ||
            lowerDesc.includes('jest') ||
            lowerDesc.includes('vitest') ||
            lowerDesc.match(/\btest\b.*suite/)) {
            return exports.SINGLETON_TASKS.TEST;
        }
        // Typecheck detection
        if (lowerDesc.includes('typecheck') ||
            lowerDesc.includes('tsc --noEmit') ||
            lowerDesc.match(/\btypecheck\b/)) {
            return exports.SINGLETON_TASKS.TYPECHECK;
        }
        // Install detection
        if (lowerDesc.includes('npm install') ||
            lowerDesc.includes('yarn install') ||
            lowerDesc.includes('pnpm install') ||
            lowerDesc.match(/\binstall\b.*dependencies/)) {
            return exports.SINGLETON_TASKS.INSTALL;
        }
        // Deploy detection
        if (lowerDesc.includes('deploy') || lowerDesc.includes('deployment')) {
            return exports.SINGLETON_TASKS.DEPLOY;
        }
        return null;
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Check if a task has expired
     */
    SingletonTaskCoordinator.prototype.isExpired = function (task) {
        return Date.now() > task.timestamp + task.ttl;
    };
    /**
     * Load singleton tasks from disk
     */
    SingletonTaskCoordinator.prototype.loadSingletonTasks = function () {
        if (!fs.existsSync(this.singletonDir)) {
            return;
        }
        var files = fs.readdirSync(this.singletonDir);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            if (!file.endsWith('.singleton'))
                continue;
            try {
                var taskPath = path.join(this.singletonDir, file);
                var content = fs.readFileSync(taskPath, 'utf-8');
                var task = JSON.parse(content);
                // Only load if not expired
                if (!this.isExpired(task)) {
                    this.activeTasks.set(task.type, task);
                }
                else {
                    // Clean up expired task file
                    fs.unlinkSync(taskPath);
                }
            }
            catch (error) {
                console.error("Failed to load singleton task file ".concat(file, ":"), error);
            }
        }
    };
    /**
     * Save a singleton task to disk
     */
    SingletonTaskCoordinator.prototype.saveTask = function (task) {
        var taskPath = path.join(this.singletonDir, "".concat(task.type, ".singleton"));
        fs.writeFileSync(taskPath, JSON.stringify(task, null, 2), 'utf-8');
    };
    /**
     * Delete a singleton task file from disk
     */
    SingletonTaskCoordinator.prototype.deleteTaskFile = function (type) {
        var taskPath = path.join(this.singletonDir, "".concat(type, ".singleton"));
        if (fs.existsSync(taskPath)) {
            fs.unlinkSync(taskPath);
        }
    };
    /**
     * Clean up expired singleton tasks
     */
    SingletonTaskCoordinator.prototype.cleanupExpiredTasks = function () {
        var expiredTypes = [];
        for (var _i = 0, _a = this.activeTasks.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], task = _b[1];
            if (this.isExpired(task)) {
                expiredTypes.push(type);
            }
        }
        for (var _c = 0, expiredTypes_1 = expiredTypes; _c < expiredTypes_1.length; _c++) {
            var type = expiredTypes_1[_c];
            this.activeTasks.delete(type);
            this.deleteTaskFile(type);
        }
        if (expiredTypes.length > 0) {
            console.log("Cleaned up ".concat(expiredTypes.length, " expired singleton tasks"));
        }
    };
    return SingletonTaskCoordinator;
}());
exports.SingletonTaskCoordinator = SingletonTaskCoordinator;
/**
 * Singleton instance for easy access
 */
var sharedCoordinator = null;
/**
 * Get the shared SingletonTaskCoordinator instance
 */
function getSharedSingletonCoordinator(config) {
    if (!sharedCoordinator) {
        sharedCoordinator = new SingletonTaskCoordinator(config);
    }
    return sharedCoordinator;
}
/**
 * Reset the shared instance (useful for testing)
 */
function resetSharedSingletonCoordinator() {
    sharedCoordinator = null;
}

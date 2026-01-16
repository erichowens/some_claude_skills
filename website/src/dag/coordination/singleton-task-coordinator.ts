/**
 * Singleton Task Coordinator
 *
 * Ensures that certain operations (build, lint, test) only run once at a time
 * across parallel agents. Prevents wasted resources and conflicts.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Singleton task types that should only run once at a time
 */
export const SINGLETON_TASKS = {
  BUILD: 'build',
  LINT: 'lint',
  TEST: 'test',
  TYPECHECK: 'typecheck',
  INSTALL: 'install',
  DEPLOY: 'deploy',
} as const;

export type SingletonTaskType = typeof SINGLETON_TASKS[keyof typeof SINGLETON_TASKS];

/**
 * Active singleton task
 */
export interface SingletonTask {
  /** Task type */
  type: SingletonTaskType;

  /** Owner (agent/task ID) */
  owner: string;

  /** When started */
  timestamp: number;

  /** Task description */
  description: string;

  /** TTL in milliseconds (default: 10 minutes) */
  ttl: number;
}

/**
 * Result of attempting to acquire a singleton task
 */
export interface SingletonAcquisitionResult {
  /** Whether the task was successfully acquired */
  success: boolean;

  /** If failed, who owns the task */
  currentOwner?: string;

  /** If failed, what task is running */
  currentTask?: string;

  /** If failed, estimated time remaining (ms) */
  estimatedTimeRemaining?: number;

  /** Reason for failure */
  reason?: string;
}

/**
 * Configuration for SingletonTaskCoordinator
 */
export interface SingletonCoordinatorConfig {
  /** Directory to store singleton task files (default: .claude/singletons) */
  singletonDir?: string;

  /** Default TTL for singleton tasks in milliseconds (default: 10 minutes) */
  defaultTTL?: number;

  /** Whether to automatically clean expired tasks (default: true) */
  autoCleanup?: boolean;
}

/**
 * SingletonTaskCoordinator - Ensures exclusive execution of certain tasks
 */
export class SingletonTaskCoordinator {
  private singletonDir: string;
  private defaultTTL: number;
  private autoCleanup: boolean;
  private activeTasks: Map<SingletonTaskType, SingletonTask>;

  constructor(config: SingletonCoordinatorConfig = {}) {
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
      setInterval(() => this.cleanupExpiredTasks(), 30000); // Every 30 seconds
    }
  }

  /**
   * Attempt to acquire a singleton task
   */
  acquire(
    type: SingletonTaskType,
    owner: string,
    description: string,
    ttl?: number
  ): SingletonAcquisitionResult {
    // Check if task is already running
    const existingTask = this.activeTasks.get(type);
    if (existingTask && !this.isExpired(existingTask)) {
      const remaining = existingTask.timestamp + existingTask.ttl - Date.now();

      return {
        success: false,
        currentOwner: existingTask.owner,
        currentTask: existingTask.description,
        estimatedTimeRemaining: Math.max(0, remaining),
        reason: `${type} is already running (owner: ${existingTask.owner})`,
      };
    }

    // Acquire the task
    const task: SingletonTask = {
      type,
      owner,
      timestamp: Date.now(),
      description,
      ttl: ttl || this.defaultTTL,
    };

    this.activeTasks.set(type, task);
    this.saveTask(task);

    return { success: true };
  }

  /**
   * Release a singleton task
   */
  release(type: SingletonTaskType, owner: string): boolean {
    const task = this.activeTasks.get(type);

    if (!task) {
      return false; // Task not running
    }

    if (task.owner !== owner) {
      return false; // Not the owner
    }

    this.activeTasks.delete(type);
    this.deleteTaskFile(type);

    return true;
  }

  /**
   * Check if a singleton task is running
   */
  isRunning(type: SingletonTaskType): boolean {
    const task = this.activeTasks.get(type);
    return task ? !this.isExpired(task) : false;
  }

  /**
   * Get the current owner of a singleton task
   */
  getOwner(type: SingletonTaskType): string | null {
    const task = this.activeTasks.get(type);

    if (!task || this.isExpired(task)) {
      return null;
    }

    return task.owner;
  }

  /**
   * Get all active singleton tasks
   */
  getActiveTasks(): SingletonTask[] {
    return Array.from(this.activeTasks.values()).filter(task => !this.isExpired(task));
  }

  /**
   * Release all tasks owned by a specific agent
   */
  releaseAllTasks(owner: string): number {
    let count = 0;

    for (const [type, task] of this.activeTasks.entries()) {
      if (task.owner === owner) {
        this.activeTasks.delete(type);
        this.deleteTaskFile(type);
        count++;
      }
    }

    return count;
  }

  /**
   * Detect if a task description is a singleton task
   */
  static detectSingletonTask(description: string): SingletonTaskType | null {
    const lowerDesc = description.toLowerCase();

    // Build detection
    if (
      lowerDesc.includes('npm run build') ||
      lowerDesc.includes('yarn build') ||
      lowerDesc.includes('pnpm build') ||
      lowerDesc.includes('bun build') ||
      lowerDesc.match(/\bbuild\b.*project/)
    ) {
      return SINGLETON_TASKS.BUILD;
    }

    // Lint detection
    if (
      lowerDesc.includes('npm run lint') ||
      lowerDesc.includes('yarn lint') ||
      lowerDesc.includes('eslint') ||
      lowerDesc.match(/\blint\b.*code/)
    ) {
      return SINGLETON_TASKS.LINT;
    }

    // Test detection
    if (
      lowerDesc.includes('npm test') ||
      lowerDesc.includes('yarn test') ||
      lowerDesc.includes('jest') ||
      lowerDesc.includes('vitest') ||
      lowerDesc.match(/\btest\b.*suite/)
    ) {
      return SINGLETON_TASKS.TEST;
    }

    // Typecheck detection
    if (
      lowerDesc.includes('typecheck') ||
      lowerDesc.includes('tsc --noEmit') ||
      lowerDesc.match(/\btypecheck\b/)
    ) {
      return SINGLETON_TASKS.TYPECHECK;
    }

    // Install detection
    if (
      lowerDesc.includes('npm install') ||
      lowerDesc.includes('yarn install') ||
      lowerDesc.includes('pnpm install') ||
      lowerDesc.match(/\binstall\b.*dependencies/)
    ) {
      return SINGLETON_TASKS.INSTALL;
    }

    // Deploy detection
    if (lowerDesc.includes('deploy') || lowerDesc.includes('deployment')) {
      return SINGLETON_TASKS.DEPLOY;
    }

    return null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Check if a task has expired
   */
  private isExpired(task: SingletonTask): boolean {
    return Date.now() > task.timestamp + task.ttl;
  }

  /**
   * Load singleton tasks from disk
   */
  private loadSingletonTasks(): void {
    if (!fs.existsSync(this.singletonDir)) {
      return;
    }

    const files = fs.readdirSync(this.singletonDir);

    for (const file of files) {
      if (!file.endsWith('.singleton')) continue;

      try {
        const taskPath = path.join(this.singletonDir, file);
        const content = fs.readFileSync(taskPath, 'utf-8');
        const task: SingletonTask = JSON.parse(content);

        // Only load if not expired
        if (!this.isExpired(task)) {
          this.activeTasks.set(task.type, task);
        } else {
          // Clean up expired task file
          fs.unlinkSync(taskPath);
        }
      } catch (error) {
        console.error(`Failed to load singleton task file ${file}:`, error);
      }
    }
  }

  /**
   * Save a singleton task to disk
   */
  private saveTask(task: SingletonTask): void {
    const taskPath = path.join(this.singletonDir, `${task.type}.singleton`);
    fs.writeFileSync(taskPath, JSON.stringify(task, null, 2), 'utf-8');
  }

  /**
   * Delete a singleton task file from disk
   */
  private deleteTaskFile(type: SingletonTaskType): void {
    const taskPath = path.join(this.singletonDir, `${type}.singleton`);

    if (fs.existsSync(taskPath)) {
      fs.unlinkSync(taskPath);
    }
  }

  /**
   * Clean up expired singleton tasks
   */
  private cleanupExpiredTasks(): void {
    const expiredTypes: SingletonTaskType[] = [];

    for (const [type, task] of this.activeTasks.entries()) {
      if (this.isExpired(task)) {
        expiredTypes.push(type);
      }
    }

    for (const type of expiredTypes) {
      this.activeTasks.delete(type);
      this.deleteTaskFile(type);
    }

    if (expiredTypes.length > 0) {
      console.log(`Cleaned up ${expiredTypes.length} expired singleton tasks`);
    }
  }
}

/**
 * Singleton instance for easy access
 */
let sharedCoordinator: SingletonTaskCoordinator | null = null;

/**
 * Get the shared SingletonTaskCoordinator instance
 */
export function getSharedSingletonCoordinator(
  config?: SingletonCoordinatorConfig
): SingletonTaskCoordinator {
  if (!sharedCoordinator) {
    sharedCoordinator = new SingletonTaskCoordinator(config);
  }
  return sharedCoordinator;
}

/**
 * Reset the shared instance (useful for testing)
 */
export function resetSharedSingletonCoordinator(): void {
  sharedCoordinator = null;
}

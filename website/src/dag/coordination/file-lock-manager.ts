/**
 * File Lock Manager
 *
 * Coordinates file access across parallel agents to prevent conflicts.
 * Uses a simple file-based locking mechanism with automatic cleanup.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * A file lock claim
 */
export interface FileLock {
  /** File path being locked */
  filePath: string;

  /** Agent/task that owns this lock */
  owner: string;

  /** When the lock was acquired */
  timestamp: number;

  /** Lock expires after this duration (ms) */
  ttl: number;

  /** Operation being performed (read/write) */
  operation: 'read' | 'write';
}

/**
 * Lock acquisition result
 */
export interface LockResult {
  /** Whether the lock was successfully acquired */
  success: boolean;

  /** If failed, who owns the lock */
  owner?: string;

  /** If failed, estimated time until lock expires (ms) */
  expiresIn?: number;

  /** Reason for failure */
  reason?: string;
}

/**
 * Configuration for FileLockManager
 */
export interface FileLockConfig {
  /** Directory to store lock files (default: .claude/locks) */
  lockDir?: string;

  /** Default TTL for locks in milliseconds (default: 5 minutes) */
  defaultTTL?: number;

  /** Whether to automatically clean expired locks (default: true) */
  autoCleanup?: boolean;
}

/**
 * FileLockManager - Coordinates file access across parallel agents
 */
export class FileLockManager {
  private lockDir: string;
  private defaultTTL: number;
  private autoCleanup: boolean;
  private locks: Map<string, FileLock>;

  constructor(config: FileLockConfig = {}) {
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
      setInterval(() => this.cleanupExpiredLocks(), 30000); // Every 30 seconds
    }
  }

  /**
   * Attempt to acquire a lock on a file
   */
  acquireLock(
    filePath: string,
    owner: string,
    operation: 'read' | 'write' = 'write',
    ttl?: number
  ): LockResult {
    const normalizedPath = this.normalizePath(filePath);

    // Check if lock already exists and is valid
    const existingLock = this.locks.get(normalizedPath);
    if (existingLock && !this.isExpired(existingLock)) {
      // Allow multiple readers, but not readers with writers
      if (operation === 'read' && existingLock.operation === 'read') {
        return { success: true };
      }

      return {
        success: false,
        owner: existingLock.owner,
        expiresIn: existingLock.timestamp + existingLock.ttl - Date.now(),
        reason: `File locked by ${existingLock.owner} for ${existingLock.operation}`,
      };
    }

    // Acquire the lock
    const lock: FileLock = {
      filePath: normalizedPath,
      owner,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      operation,
    };

    this.locks.set(normalizedPath, lock);
    this.saveLock(lock);

    return { success: true };
  }

  /**
   * Release a lock
   */
  releaseLock(filePath: string, owner: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    const lock = this.locks.get(normalizedPath);

    if (!lock) {
      return false; // Lock doesn't exist
    }

    if (lock.owner !== owner) {
      return false; // Not the owner
    }

    this.locks.delete(normalizedPath);
    this.deleteLockFile(normalizedPath);

    return true;
  }

  /**
   * Check if a file is locked
   */
  isLocked(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    const lock = this.locks.get(normalizedPath);

    return lock ? !this.isExpired(lock) : false;
  }

  /**
   * Get the owner of a lock
   */
  getLockOwner(filePath: string): string | null {
    const normalizedPath = this.normalizePath(filePath);
    const lock = this.locks.get(normalizedPath);

    if (!lock || this.isExpired(lock)) {
      return null;
    }

    return lock.owner;
  }

  /**
   * Check for conflicts across multiple files
   */
  checkConflicts(
    files: string[],
    operation: 'read' | 'write' = 'write'
  ): Array<{ file: string; owner: string; expiresIn: number }> {
    const conflicts: Array<{ file: string; owner: string; expiresIn: number }> = [];

    for (const file of files) {
      const normalizedPath = this.normalizePath(file);
      const lock = this.locks.get(normalizedPath);

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
  }

  /**
   * Release all locks owned by a specific agent
   */
  releaseAllLocks(owner: string): number {
    let count = 0;

    for (const [path, lock] of this.locks.entries()) {
      if (lock.owner === owner) {
        this.locks.delete(path);
        this.deleteLockFile(path);
        count++;
      }
    }

    return count;
  }

  /**
   * Get all active locks
   */
  getAllLocks(): FileLock[] {
    return Array.from(this.locks.values()).filter(lock => !this.isExpired(lock));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Normalize file path for consistent lookup
   */
  private normalizePath(filePath: string): string {
    return path.normalize(filePath).replace(/\\/g, '/');
  }

  /**
   * Check if a lock has expired
   */
  private isExpired(lock: FileLock): boolean {
    return Date.now() > lock.timestamp + lock.ttl;
  }

  /**
   * Load locks from disk
   */
  private loadLocks(): void {
    if (!fs.existsSync(this.lockDir)) {
      return;
    }

    const files = fs.readdirSync(this.lockDir);

    for (const file of files) {
      if (!file.endsWith('.lock')) continue;

      try {
        const lockPath = path.join(this.lockDir, file);
        const content = fs.readFileSync(lockPath, 'utf-8');
        const lock: FileLock = JSON.parse(content);

        // Only load if not expired
        if (!this.isExpired(lock)) {
          this.locks.set(lock.filePath, lock);
        } else {
          // Clean up expired lock file
          fs.unlinkSync(lockPath);
        }
      } catch (error) {
        console.error(`Failed to load lock file ${file}:`, error);
      }
    }
  }

  /**
   * Save a lock to disk
   */
  private saveLock(lock: FileLock): void {
    const lockFileName = this.getLockFileName(lock.filePath);
    const lockPath = path.join(this.lockDir, lockFileName);

    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), 'utf-8');
  }

  /**
   * Delete a lock file from disk
   */
  private deleteLockFile(filePath: string): void {
    const lockFileName = this.getLockFileName(filePath);
    const lockPath = path.join(this.lockDir, lockFileName);

    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  }

  /**
   * Get lock file name for a given file path
   */
  private getLockFileName(filePath: string): string {
    // Create a safe filename from the file path
    const hash = Buffer.from(filePath).toString('base64url');
    return `${hash}.lock`;
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const expiredPaths: string[] = [];

    for (const [path, lock] of this.locks.entries()) {
      if (this.isExpired(lock)) {
        expiredPaths.push(path);
      }
    }

    for (const path of expiredPaths) {
      this.locks.delete(path);
      this.deleteLockFile(path);
    }

    if (expiredPaths.length > 0) {
      console.log(`Cleaned up ${expiredPaths.length} expired file locks`);
    }
  }
}

/**
 * Singleton instance for easy access
 */
let sharedLockManager: FileLockManager | null = null;

/**
 * Get the shared FileLockManager instance
 */
export function getSharedLockManager(config?: FileLockConfig): FileLockManager {
  if (!sharedLockManager) {
    sharedLockManager = new FileLockManager(config);
  }
  return sharedLockManager;
}

/**
 * Reset the shared instance (useful for testing)
 */
export function resetSharedLockManager(): void {
  sharedLockManager = null;
}

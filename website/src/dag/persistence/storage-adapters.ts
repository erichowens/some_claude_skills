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

// =============================================================================
// TYPES
// =============================================================================

/**
 * Storage adapter interface
 *
 * All storage implementations must implement this interface.
 * Keys are strings, values are serialized JSON.
 */
export interface StorageAdapter {
  /** Unique identifier for this adapter type */
  readonly type: StorageAdapterType;

  /** Human-readable name */
  readonly name: string;

  /**
   * Get a value by key
   * @returns The value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value by key
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Delete a value by key
   * @returns true if the key existed
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * List all keys (optionally with prefix filter)
   */
  keys(prefix?: string): Promise<string[]>;

  /**
   * Clear all data (optionally with prefix filter)
   */
  clear(prefix?: string): Promise<void>;

  /**
   * Get storage statistics
   */
  getStats(): Promise<StorageStats>;
}

/**
 * Storage adapter types
 */
export type StorageAdapterType = 'memory' | 'localStorage' | 'file';

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total number of keys */
  keyCount: number;

  /** Approximate total size in bytes */
  totalSize: number;

  /** Whether storage is persistent */
  isPersistent: boolean;

  /** Storage capacity (if known) */
  capacity?: number;
}

// =============================================================================
// MEMORY STORAGE ADAPTER
// =============================================================================

/**
 * In-memory storage adapter
 *
 * Useful for testing and ephemeral storage.
 * Data is lost when the process exits.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  readonly type: StorageAdapterType = 'memory';
  readonly name = 'In-Memory Storage';

  private data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const allKeys = Array.from(this.data.keys());
    if (!prefix) return allKeys;
    return allKeys.filter(k => k.startsWith(prefix));
  }

  async clear(prefix?: string): Promise<void> {
    if (!prefix) {
      this.data.clear();
      return;
    }
    for (const key of this.data.keys()) {
      if (key.startsWith(prefix)) {
        this.data.delete(key);
      }
    }
  }

  async getStats(): Promise<StorageStats> {
    let totalSize = 0;
    for (const [key, value] of this.data) {
      totalSize += key.length + value.length;
    }
    return {
      keyCount: this.data.size,
      totalSize,
      isPersistent: false,
    };
  }
}

// =============================================================================
// LOCAL STORAGE ADAPTER
// =============================================================================

/**
 * localStorage adapter for browser environments
 *
 * Persists data across page reloads.
 * Limited to ~5MB in most browsers.
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly type: StorageAdapterType = 'localStorage';
  readonly name = 'Browser LocalStorage';

  private prefix: string;

  constructor(prefix: string = 'dag-checkpoint:') {
    this.prefix = prefix;
  }

  private getFullKey(key: string): string {
    return this.prefix + key;
  }

  private stripPrefix(fullKey: string): string {
    return fullKey.slice(this.prefix.length);
  }

  async get(key: string): Promise<string | null> {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.getFullKey(key));
  }

  async set(key: string, value: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available');
    }
    localStorage.setItem(this.getFullKey(key), value);
  }

  async delete(key: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;
    const fullKey = this.getFullKey(key);
    const existed = localStorage.getItem(fullKey) !== null;
    localStorage.removeItem(fullKey);
    return existed;
  }

  async has(key: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.getFullKey(key)) !== null;
  }

  async keys(prefix?: string): Promise<string[]> {
    if (typeof localStorage === 'undefined') return [];

    const result: string[] = [];
    const searchPrefix = this.prefix + (prefix || '');

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey?.startsWith(searchPrefix)) {
        result.push(this.stripPrefix(fullKey));
      }
    }

    return result;
  }

  async clear(prefix?: string): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const keysToDelete = await this.keys(prefix);
    for (const key of keysToDelete) {
      localStorage.removeItem(this.getFullKey(key));
    }
  }

  async getStats(): Promise<StorageStats> {
    if (typeof localStorage === 'undefined') {
      return { keyCount: 0, totalSize: 0, isPersistent: true };
    }

    let totalSize = 0;
    let keyCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey?.startsWith(this.prefix)) {
        keyCount++;
        const value = localStorage.getItem(fullKey);
        if (value) {
          totalSize += fullKey.length + value.length;
        }
      }
    }

    return {
      keyCount,
      totalSize,
      isPersistent: true,
      capacity: 5 * 1024 * 1024, // ~5MB typical limit
    };
  }
}

// =============================================================================
// FILE STORAGE ADAPTER
// =============================================================================

/**
 * File system storage adapter for Node.js environments
 *
 * Stores each key as a separate JSON file.
 * Useful for CLI tools and server-side execution.
 */
export class FileStorageAdapter implements StorageAdapter {
  readonly type: StorageAdapterType = 'file';
  readonly name = 'File System Storage';

  private baseDir: string;
  private fs: typeof import('fs/promises') | null = null;
  private path: typeof import('path') | null = null;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private async ensureModules(): Promise<void> {
    if (this.fs && this.path) return;

    // Dynamic import for Node.js modules
    if (typeof process !== 'undefined' && process.versions?.node) {
      this.fs = await import('fs/promises');
      this.path = await import('path');

      // Ensure base directory exists
      await this.fs.mkdir(this.baseDir, { recursive: true });
    } else {
      throw new Error('FileStorageAdapter requires Node.js environment');
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key for file system
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return this.path!.join(this.baseDir, `${safeKey}.json`);
  }

  async get(key: string): Promise<string | null> {
    await this.ensureModules();
    try {
      return await this.fs!.readFile(this.getFilePath(key), 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureModules();
    await this.fs!.writeFile(this.getFilePath(key), value, 'utf-8');
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureModules();
    try {
      await this.fs!.unlink(this.getFilePath(key));
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  async has(key: string): Promise<boolean> {
    await this.ensureModules();
    try {
      await this.fs!.access(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async keys(prefix?: string): Promise<string[]> {
    await this.ensureModules();
    try {
      const files = await this.fs!.readdir(this.baseDir);
      const keys = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.slice(0, -5)); // Remove .json extension

      if (!prefix) return keys;
      return keys.filter(k => k.startsWith(prefix.replace(/[^a-zA-Z0-9_-]/g, '_')));
    } catch (err: any) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async clear(prefix?: string): Promise<void> {
    await this.ensureModules();
    const keysToDelete = await this.keys(prefix);
    await Promise.all(keysToDelete.map(key => this.delete(key)));
  }

  async getStats(): Promise<StorageStats> {
    await this.ensureModules();
    try {
      const keys = await this.keys();
      let totalSize = 0;

      for (const key of keys) {
        const stat = await this.fs!.stat(this.getFilePath(key));
        totalSize += stat.size;
      }

      return {
        keyCount: keys.length,
        totalSize,
        isPersistent: true,
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return { keyCount: 0, totalSize: 0, isPersistent: true };
      }
      throw err;
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a storage adapter by type
 */
export function createStorageAdapter(
  type: StorageAdapterType,
  options?: { prefix?: string; baseDir?: string }
): StorageAdapter {
  switch (type) {
    case 'memory':
      return new MemoryStorageAdapter();
    case 'localStorage':
      return new LocalStorageAdapter(options?.prefix);
    case 'file':
      if (!options?.baseDir) {
        throw new Error('baseDir is required for file storage');
      }
      return new FileStorageAdapter(options.baseDir);
    default:
      throw new Error(`Unknown storage adapter type: ${type}`);
  }
}

/**
 * Auto-detect the best available storage adapter
 */
export function autoDetectStorage(options?: { prefix?: string; baseDir?: string }): StorageAdapter {
  // Prefer file storage in Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    const baseDir = options?.baseDir || '.dag-checkpoints';
    return new FileStorageAdapter(baseDir);
  }

  // Use localStorage in browser
  if (typeof localStorage !== 'undefined') {
    return new LocalStorageAdapter(options?.prefix);
  }

  // Fallback to memory
  return new MemoryStorageAdapter();
}

/** Default storage adapter instance */
export const defaultStorage = new MemoryStorageAdapter();

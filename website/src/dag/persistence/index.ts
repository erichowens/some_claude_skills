/**
 * Persistence Layer for DAG Framework
 *
 * Provides checkpoint management and storage adapters for
 * saving and resuming interrupted DAG executions.
 *
 * @module dag/persistence
 */

// Storage Adapters
export {
  MemoryStorageAdapter,
  LocalStorageAdapter,
  FileStorageAdapter,
  createStorageAdapter,
  autoDetectStorage,
  defaultStorage,
  type StorageAdapter,
  type StorageAdapterType,
  type StorageStats,
} from './storage-adapters';

// Checkpoint Manager
export {
  CheckpointManager,
  checkpointManager,
  createCheckpointManager,
  saveCheckpoint,
  loadAndPrepareResume,
  type Checkpoint,
  type DAGCheckpointData,
  type NodeCheckpointData,
  type ExecutionCheckpointData,
  type NodeExecutionState,
  type CheckpointManagerConfig,
  type ResumeOptions,
  type ListCheckpointsOptions,
  type CheckpointSummary,
  type ResumeState,
  type CheckpointStats,
} from './checkpoint-manager';

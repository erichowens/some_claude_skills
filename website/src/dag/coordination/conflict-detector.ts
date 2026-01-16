/**
 * Conflict Detector
 *
 * Analyzes DAG nodes to detect file conflicts and singleton task violations
 * that would prevent safe parallel execution.
 */

import type { DAG, DAGNode, NodeId } from '../types';
import { Subtask } from '../core/task-decomposer';
import { SingletonTaskCoordinator, SINGLETON_TASKS, SingletonTaskType } from './singleton-task-coordinator';

/**
 * Conflict between nodes
 */
export interface NodeConflict {
  /** Type of conflict */
  type: 'file' | 'singleton';

  /** Nodes involved in the conflict */
  nodeIds: NodeId[];

  /** File path causing conflict (for file conflicts) */
  filePath?: string;

  /** Singleton task type causing conflict (for singleton conflicts) */
  singletonType?: SingletonTaskType;

  /** Human-readable description */
  description: string;
}

/**
 * Analysis result for a wave of nodes
 */
export interface WaveConflictAnalysis {
  /** Can this wave be executed in parallel? */
  canParallelize: boolean;

  /** Detected conflicts (empty if no conflicts) */
  conflicts: NodeConflict[];

  /** Suggested remediation if conflicts exist */
  remediation?: string;
}

/**
 * ConflictDetector - Analyzes nodes for execution conflicts
 */
export class ConflictDetector {
  /**
   * Analyze a wave of nodes for conflicts
   *
   * @param dag The DAG containing the nodes
   * @param nodeIds Node IDs in this wave
   * @param subtaskMap Optional map of node IDs to subtasks with predictedFiles
   */
  static analyzeWave(
    dag: DAG,
    nodeIds: NodeId[],
    subtaskMap?: Map<NodeId, Subtask>
  ): WaveConflictAnalysis {
    // Single node waves can always be parallelized
    if (nodeIds.length <= 1) {
      return {
        canParallelize: false, // Not parallel (only one task)
        conflicts: [],
      };
    }

    const conflicts: NodeConflict[] = [];

    // Check for singleton task conflicts
    const singletonConflicts = this.detectSingletonConflicts(dag, nodeIds, subtaskMap);
    conflicts.push(...singletonConflicts);

    // Check for file conflicts
    const fileConflicts = this.detectFileConflicts(dag, nodeIds, subtaskMap);
    conflicts.push(...fileConflicts);

    const canParallelize = conflicts.length === 0;
    const remediation = canParallelize ? undefined : this.suggestRemediation(conflicts);

    return {
      canParallelize,
      conflicts,
      remediation,
    };
  }

  /**
   * Detect singleton task conflicts
   */
  private static detectSingletonConflicts(
    dag: DAG,
    nodeIds: NodeId[],
    subtaskMap?: Map<NodeId, Subtask>
  ): NodeConflict[] {
    const conflicts: NodeConflict[] = [];
    const singletonNodes: Array<{ nodeId: NodeId; type: SingletonTaskType }> = [];

    for (const nodeId of nodeIds) {
      const node = dag.nodes.get(nodeId);
      if (!node) continue;

      // Check if subtask has explicit singleton type
      const subtask = subtaskMap?.get(nodeId);
      const singletonType = subtask?.singletonType || null;

      if (singletonType) {
        singletonNodes.push({ nodeId, type: singletonType });
      } else {
        // Fallback: detect from node description
        const detected = SingletonTaskCoordinator.detectSingletonTask(
          node.prompt || node.id.toString()
        );

        if (detected) {
          singletonNodes.push({ nodeId, type: detected });
        }
      }
    }

    // If multiple singleton tasks of the same type, conflict
    const typeGroups = new Map<SingletonTaskType, NodeId[]>();
    for (const { nodeId, type } of singletonNodes) {
      const existing = typeGroups.get(type) || [];
      existing.push(nodeId);
      typeGroups.set(type, existing);
    }

    for (const [type, nodes] of typeGroups.entries()) {
      if (nodes.length > 1) {
        conflicts.push({
          type: 'singleton',
          nodeIds: nodes,
          singletonType: type,
          description: `Multiple ${type} tasks cannot run in parallel: ${nodes.join(', ')}`,
        });
      }
    }

    // If ANY singleton task exists in a wave with other tasks, conflict
    if (singletonNodes.length > 0 && nodeIds.length > singletonNodes.length) {
      const singletonNodeIds = singletonNodes.map(s => s.nodeId);
      const regularNodeIds = nodeIds.filter(id => !singletonNodeIds.includes(id));

      conflicts.push({
        type: 'singleton',
        nodeIds: [...singletonNodeIds, ...regularNodeIds],
        description: `Singleton tasks (${singletonNodeIds.join(', ')}) must run alone, not with ${regularNodeIds.join(', ')}`,
      });
    }

    return conflicts;
  }

  /**
   * Detect file conflicts between nodes
   */
  private static detectFileConflicts(
    dag: DAG,
    nodeIds: NodeId[],
    subtaskMap?: Map<NodeId, Subtask>
  ): NodeConflict[] {
    const conflicts: NodeConflict[] = [];

    // Build file map: filePath -> nodeIds that modify it
    const fileMap = new Map<string, NodeId[]>();

    for (const nodeId of nodeIds) {
      const subtask = subtaskMap?.get(nodeId);
      if (!subtask?.predictedFiles || subtask.predictedFiles.length === 0) {
        continue;
      }

      for (const filePath of subtask.predictedFiles) {
        const normalized = this.normalizePath(filePath);
        const existing = fileMap.get(normalized) || [];
        existing.push(nodeId);
        fileMap.set(normalized, existing);
      }
    }

    // Find files modified by multiple nodes
    for (const [filePath, nodes] of fileMap.entries()) {
      if (nodes.length > 1) {
        conflicts.push({
          type: 'file',
          nodeIds: nodes,
          filePath,
          description: `File ${filePath} modified by multiple tasks: ${nodes.join(', ')}`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Suggest remediation for conflicts
   */
  private static suggestRemediation(conflicts: NodeConflict[]): string {
    const suggestions: string[] = [];

    const fileConflicts = conflicts.filter(c => c.type === 'file');
    const singletonConflicts = conflicts.filter(c => c.type === 'singleton');

    if (fileConflicts.length > 0) {
      suggestions.push(
        `File conflicts detected: ${fileConflicts.length} file(s) modified by multiple tasks.`
      );
      suggestions.push(
        'Solution: Add dependencies to make these tasks sequential, or decompose differently to avoid file overlap.'
      );
    }

    if (singletonConflicts.length > 0) {
      suggestions.push(
        `Singleton task conflicts detected: ${singletonConflicts.length} singleton operation(s) in wave.`
      );
      suggestions.push(
        'Solution: Singleton tasks (build, lint, test) must run alone. Move to separate wave.'
      );
    }

    return suggestions.join(' ');
  }

  /**
   * Normalize file path for consistent comparison
   */
  private static normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/').toLowerCase().trim();
  }

  /**
   * Check if two file paths could conflict (handles wildcards)
   */
  private static pathsConflict(path1: string, path2: string): boolean {
    const norm1 = this.normalizePath(path1);
    const norm2 = this.normalizePath(path2);

    // Exact match
    if (norm1 === norm2) {
      return true;
    }

    // Wildcard matching (basic support)
    if (norm1.includes('*') || norm2.includes('*')) {
      const pattern1 = new RegExp('^' + norm1.replace(/\*/g, '.*') + '$');
      const pattern2 = new RegExp('^' + norm2.replace(/\*/g, '.*') + '$');

      if (pattern1.test(norm2) || pattern2.test(norm1)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find all conflicts in a DAG
   *
   * This scans all nodes for potential conflicts, useful for validation.
   */
  static findAllConflicts(
    dag: DAG,
    subtaskMap?: Map<NodeId, Subtask>
  ): Map<NodeId, NodeConflict[]> {
    const conflictMap = new Map<NodeId, NodeConflict[]>();

    // Get all nodes
    const allNodeIds = Array.from(dag.nodes.keys());

    // Check each pair of nodes
    for (let i = 0; i < allNodeIds.length; i++) {
      for (let j = i + 1; j < allNodeIds.length; j++) {
        const nodeId1 = allNodeIds[i];
        const nodeId2 = allNodeIds[j];

        const analysis = this.analyzeWave(dag, [nodeId1, nodeId2], subtaskMap);

        if (analysis.conflicts.length > 0) {
          for (const conflict of analysis.conflicts) {
            for (const nodeId of conflict.nodeIds) {
              const existing = conflictMap.get(nodeId) || [];
              existing.push(conflict);
              conflictMap.set(nodeId, existing);
            }
          }
        }
      }
    }

    return conflictMap;
  }
}

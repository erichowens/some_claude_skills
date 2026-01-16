/**
 * ExecutionMonitor Component
 *
 * Real-time monitoring interface for DAG execution.
 * Displays progress, timing, node states, and execution logs.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  DAG,
  DAGNode as DAGNodeType,
  NodeId,
  TaskState,
} from '@site/src/dag/types';
import { DAGGraph } from './DAGGraph';
import styles from './ExecutionMonitor.module.css';

export interface ExecutionLogEntry {
  timestamp: Date;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface ExecutionStats {
  startTime?: Date;
  endTime?: Date;
  completedNodes: number;
  failedNodes: number;
  runningNodes: number;
  pendingNodes: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ExecutionMonitorProps {
  /** The DAG being executed */
  dag: DAG;
  /** Current execution state of the DAG */
  executionState?: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  /** Execution logs */
  logs?: ExecutionLogEntry[];
  /** Execution statistics */
  stats?: ExecutionStats;
  /** Callback to start execution */
  onStart?: () => void;
  /** Callback to pause execution */
  onPause?: () => void;
  /** Callback to resume execution */
  onResume?: () => void;
  /** Callback to stop/cancel execution */
  onStop?: () => void;
  /** Callback to retry failed nodes */
  onRetry?: (nodeIds: string[]) => void;
  /** Callback when a node is selected for inspection */
  onNodeInspect?: (nodeId: string) => void;
  /** Auto-scroll logs */
  autoScrollLogs?: boolean;
}

const STATUS_COLORS: Record<TaskState['status'], string> = {
  pending: '#6b7280',
  ready: '#3b82f6',
  running: '#f59e0b',
  completed: '#10b981',
  failed: '#ef4444',
  skipped: '#9ca3af',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function ExecutionMonitor({
  dag,
  executionState = 'idle',
  logs = [],
  stats,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetry,
  onNodeInspect,
  autoScrollLogs = true,
}: ExecutionMonitorProps): React.ReactElement {
  const [selectedTab, setSelectedTab] = useState<'graph' | 'logs' | 'stats'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScrollLogs && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScrollLogs]);

  // Calculate node stats
  const nodeStats = useMemo(() => {
    const result = {
      pending: 0,
      ready: 0,
      running: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
    };
    for (const node of dag.nodes.values()) {
      result[node.state.status]++;
    }
    return result;
  }, [dag]);

  // Get failed nodes for retry
  const failedNodes = useMemo(() => {
    const failed: string[] = [];
    for (const node of dag.nodes.values()) {
      if (node.state.status === 'failed') {
        failed.push(node.id as string);
      }
    }
    return failed;
  }, [dag]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs;
    return logs.filter(log => log.level === logFilter);
  }, [logs, logFilter]);

  // Calculate elapsed time
  const elapsedTime = useMemo(() => {
    if (!stats?.startTime) return null;
    const end = stats.endTime ?? new Date();
    return end.getTime() - stats.startTime.getTime();
  }, [stats]);

  // Progress percentage
  const progressPercent = useMemo(() => {
    const total = dag.nodes.size;
    if (total === 0) return 0;
    return Math.round(((nodeStats.completed + nodeStats.failed + nodeStats.skipped) / total) * 100);
  }, [dag.nodes.size, nodeStats]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      onNodeInspect?.(nodeId);
    }
  }, [onNodeInspect]);

  const handleRetryFailed = useCallback(() => {
    if (failedNodes.length > 0) {
      onRetry?.(failedNodes);
    }
  }, [failedNodes, onRetry]);

  const selectedNode = selectedNodeId ? dag.nodes.get(selectedNodeId as NodeId) : null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>📊</span>
          <span>Execution Monitor</span>
          <span className={`${styles.statusBadge} ${styles[executionState]}`}>
            {executionState.toUpperCase()}
          </span>
        </div>
        <div className={styles.headerActions}>
          {executionState === 'idle' && (
            <button className={styles.actionButton} onClick={onStart}>
              ▶️ Start
            </button>
          )}
          {executionState === 'running' && (
            <button className={styles.actionButton} onClick={onPause}>
              ⏸️ Pause
            </button>
          )}
          {executionState === 'paused' && (
            <button className={styles.actionButton} onClick={onResume}>
              ▶️ Resume
            </button>
          )}
          {(executionState === 'running' || executionState === 'paused') && (
            <button className={`${styles.actionButton} ${styles.danger}`} onClick={onStop}>
              ⏹️ Stop
            </button>
          )}
          {failedNodes.length > 0 && (
            <button className={styles.actionButton} onClick={handleRetryFailed}>
              🔄 Retry Failed ({failedNodes.length})
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles[executionState]}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className={styles.progressText}>{progressPercent}%</span>
      </div>

      {/* Quick stats */}
      <div className={styles.quickStats}>
        <div className={styles.statItem}>
          <span className={styles.statDot} style={{ background: STATUS_COLORS.completed }} />
          <span>{nodeStats.completed} Completed</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statDot} style={{ background: STATUS_COLORS.running }} />
          <span>{nodeStats.running} Running</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statDot} style={{ background: STATUS_COLORS.pending }} />
          <span>{nodeStats.pending + nodeStats.ready} Pending</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statDot} style={{ background: STATUS_COLORS.failed }} />
          <span>{nodeStats.failed} Failed</span>
        </div>
        {elapsedTime !== null && (
          <div className={styles.statItem}>
            <span>⏱️ {formatDuration(elapsedTime)}</span>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedTab === 'graph' ? styles.tabActive : ''}`}
          onClick={() => setSelectedTab('graph')}
        >
          📊 Graph
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'logs' ? styles.tabActive : ''}`}
          onClick={() => setSelectedTab('logs')}
        >
          📜 Logs ({logs.length})
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'stats' ? styles.tabActive : ''}`}
          onClick={() => setSelectedTab('stats')}
        >
          📈 Statistics
        </button>
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {/* Graph tab */}
        {selectedTab === 'graph' && (
          <div className={styles.graphContainer}>
            <DAGGraph
              dag={dag}
              width={700}
              height={400}
              onNodeSelect={handleNodeSelect}
              showDetails={false}
              interactive={true}
            />
            {selectedNode && (
              <div className={styles.nodeInspector}>
                <div className={styles.inspectorHeader}>
                  <span>Node: {selectedNode.skillId || selectedNode.id}</span>
                  <button
                    className={styles.closeButton}
                    onClick={() => setSelectedNodeId(null)}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.inspectorContent}>
                  <div className={styles.inspectorRow}>
                    <span className={styles.inspectorLabel}>Type:</span>
                    <span>{selectedNode.type}</span>
                  </div>
                  <div className={styles.inspectorRow}>
                    <span className={styles.inspectorLabel}>Status:</span>
                    <span
                      className={styles.statusValue}
                      style={{ color: STATUS_COLORS[selectedNode.state.status] }}
                    >
                      {selectedNode.state.status}
                    </span>
                  </div>
                  {selectedNode.state.status === 'running' && 'startedAt' in selectedNode.state && (
                    <div className={styles.inspectorRow}>
                      <span className={styles.inspectorLabel}>Started:</span>
                      <span>{formatTime(selectedNode.state.startedAt)}</span>
                    </div>
                  )}
                  {selectedNode.state.status === 'completed' && 'completedAt' in selectedNode.state && (
                    <div className={styles.inspectorRow}>
                      <span className={styles.inspectorLabel}>Duration:</span>
                      <span>
                        {formatDuration(
                          selectedNode.state.completedAt.getTime() -
                          ('startedAt' in selectedNode.state
                            ? selectedNode.state.startedAt.getTime()
                            : 0)
                        )}
                      </span>
                    </div>
                  )}
                  {selectedNode.state.status === 'failed' && 'error' in selectedNode.state && (
                    <div className={styles.inspectorRow}>
                      <span className={styles.inspectorLabel}>Error:</span>
                      <span className={styles.errorText}>
                        {selectedNode.state.error.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs tab */}
        {selectedTab === 'logs' && (
          <div className={styles.logsContainer}>
            <div className={styles.logsToolbar}>
              <select
                className={styles.logFilter}
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as typeof logFilter)}
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warnings</option>
                <option value="error">Errors</option>
              </select>
              <span className={styles.logCount}>
                Showing {filteredLogs.length} of {logs.length}
              </span>
            </div>
            <div className={styles.logsList} ref={logContainerRef}>
              {filteredLogs.length === 0 ? (
                <div className={styles.emptyLogs}>No logs yet</div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div key={index} className={`${styles.logEntry} ${styles[`log${log.level}`]}`}>
                    <span className={styles.logTime}>
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`${styles.logLevel} ${styles[log.level]}`}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.nodeId && (
                      <span className={styles.logNode}>[{log.nodeId}]</span>
                    )}
                    <span className={styles.logMessage}>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Stats tab */}
        {selectedTab === 'stats' && (
          <div className={styles.statsContainer}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statCardLabel}>Total Nodes</div>
                <div className={styles.statCardValue}>{dag.nodes.size}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statCardLabel}>Completed</div>
                <div className={styles.statCardValue} style={{ color: STATUS_COLORS.completed }}>
                  {nodeStats.completed}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statCardLabel}>Failed</div>
                <div className={styles.statCardValue} style={{ color: STATUS_COLORS.failed }}>
                  {nodeStats.failed}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statCardLabel}>Elapsed Time</div>
                <div className={styles.statCardValue}>
                  {elapsedTime !== null ? formatDuration(elapsedTime) : '--'}
                </div>
              </div>
              {stats && (
                <>
                  <div className={styles.statCard}>
                    <div className={styles.statCardLabel}>Total Tokens</div>
                    <div className={styles.statCardValue}>
                      {stats.totalTokens.toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statCardLabel}>Estimated Cost</div>
                    <div className={styles.statCardValue}>
                      ${stats.estimatedCost.toFixed(4)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Node breakdown */}
            <div className={styles.breakdown}>
              <div className={styles.breakdownHeader}>Node Status Breakdown</div>
              <div className={styles.breakdownBars}>
                {Object.entries(nodeStats).map(([status, count]) => {
                  if (count === 0) return null;
                  const percent = (count / dag.nodes.size) * 100;
                  return (
                    <div key={status} className={styles.breakdownItem}>
                      <span className={styles.breakdownLabel}>{status}</span>
                      <div className={styles.breakdownBarContainer}>
                        <div
                          className={styles.breakdownBar}
                          style={{
                            width: `${percent}%`,
                            background: STATUS_COLORS[status as TaskState['status']],
                          }}
                        />
                      </div>
                      <span className={styles.breakdownCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>Workflow: {dag.name}</span>
        <span>•</span>
        <span>{dag.nodes.size} nodes</span>
        {stats?.startTime && (
          <>
            <span>•</span>
            <span>Started: {formatTime(stats.startTime)}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ExecutionMonitor;

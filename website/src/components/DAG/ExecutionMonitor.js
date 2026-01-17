"use strict";
/**
 * ExecutionMonitor Component
 *
 * Real-time monitoring interface for DAG execution.
 * Displays progress, timing, node states, and execution logs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionMonitor = ExecutionMonitor;
var react_1 = require("react");
var DAGGraph_1 = require("./DAGGraph");
var ExecutionMonitor_module_css_1 = require("./ExecutionMonitor.module.css");
var STATUS_COLORS = {
    pending: '#6b7280',
    ready: '#3b82f6',
    running: '#f59e0b',
    completed: '#10b981',
    failed: '#ef4444',
    skipped: '#9ca3af',
};
function formatDuration(ms) {
    if (ms < 1000)
        return "".concat(ms, "ms");
    if (ms < 60000)
        return "".concat((ms / 1000).toFixed(1), "s");
    var mins = Math.floor(ms / 60000);
    var secs = Math.floor((ms % 60000) / 1000);
    return "".concat(mins, "m ").concat(secs, "s");
}
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}
function ExecutionMonitor(_a) {
    var dag = _a.dag, _b = _a.executionState, executionState = _b === void 0 ? 'idle' : _b, _c = _a.logs, logs = _c === void 0 ? [] : _c, stats = _a.stats, onStart = _a.onStart, onPause = _a.onPause, onResume = _a.onResume, onStop = _a.onStop, onRetry = _a.onRetry, onNodeInspect = _a.onNodeInspect, _d = _a.autoScrollLogs, autoScrollLogs = _d === void 0 ? true : _d;
    var _e = (0, react_1.useState)('graph'), selectedTab = _e[0], setSelectedTab = _e[1];
    var _f = (0, react_1.useState)(null), selectedNodeId = _f[0], setSelectedNodeId = _f[1];
    var _g = (0, react_1.useState)('all'), logFilter = _g[0], setLogFilter = _g[1];
    var logContainerRef = react_1.default.useRef(null);
    // Auto-scroll logs
    (0, react_1.useEffect)(function () {
        if (autoScrollLogs && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScrollLogs]);
    // Calculate node stats
    var nodeStats = (0, react_1.useMemo)(function () {
        var result = {
            pending: 0,
            ready: 0,
            running: 0,
            completed: 0,
            failed: 0,
            skipped: 0,
        };
        for (var _i = 0, _a = dag.nodes.values(); _i < _a.length; _i++) {
            var node = _a[_i];
            result[node.state.status]++;
        }
        return result;
    }, [dag]);
    // Get failed nodes for retry
    var failedNodes = (0, react_1.useMemo)(function () {
        var failed = [];
        for (var _i = 0, _a = dag.nodes.values(); _i < _a.length; _i++) {
            var node = _a[_i];
            if (node.state.status === 'failed') {
                failed.push(node.id);
            }
        }
        return failed;
    }, [dag]);
    // Filter logs
    var filteredLogs = (0, react_1.useMemo)(function () {
        if (logFilter === 'all')
            return logs;
        return logs.filter(function (log) { return log.level === logFilter; });
    }, [logs, logFilter]);
    // Calculate elapsed time
    var elapsedTime = (0, react_1.useMemo)(function () {
        var _a;
        if (!(stats === null || stats === void 0 ? void 0 : stats.startTime))
            return null;
        var end = (_a = stats.endTime) !== null && _a !== void 0 ? _a : new Date();
        return end.getTime() - stats.startTime.getTime();
    }, [stats]);
    // Progress percentage
    var progressPercent = (0, react_1.useMemo)(function () {
        var total = dag.nodes.size;
        if (total === 0)
            return 0;
        return Math.round(((nodeStats.completed + nodeStats.failed + nodeStats.skipped) / total) * 100);
    }, [dag.nodes.size, nodeStats]);
    var handleNodeSelect = (0, react_1.useCallback)(function (nodeId) {
        setSelectedNodeId(nodeId);
        if (nodeId) {
            onNodeInspect === null || onNodeInspect === void 0 ? void 0 : onNodeInspect(nodeId);
        }
    }, [onNodeInspect]);
    var handleRetryFailed = (0, react_1.useCallback)(function () {
        if (failedNodes.length > 0) {
            onRetry === null || onRetry === void 0 ? void 0 : onRetry(failedNodes);
        }
    }, [failedNodes, onRetry]);
    var selectedNode = selectedNodeId ? dag.nodes.get(selectedNodeId) : null;
    return (<div className={ExecutionMonitor_module_css_1.default.container}>
      {/* Header */}
      <div className={ExecutionMonitor_module_css_1.default.header}>
        <div className={ExecutionMonitor_module_css_1.default.title}>
          <span className={ExecutionMonitor_module_css_1.default.icon}>📊</span>
          <span>Execution Monitor</span>
          <span className={"".concat(ExecutionMonitor_module_css_1.default.statusBadge, " ").concat(ExecutionMonitor_module_css_1.default[executionState])}>
            {executionState.toUpperCase()}
          </span>
        </div>
        <div className={ExecutionMonitor_module_css_1.default.headerActions}>
          {executionState === 'idle' && (<button className={ExecutionMonitor_module_css_1.default.actionButton} onClick={onStart}>
              ▶️ Start
            </button>)}
          {executionState === 'running' && (<button className={ExecutionMonitor_module_css_1.default.actionButton} onClick={onPause}>
              ⏸️ Pause
            </button>)}
          {executionState === 'paused' && (<button className={ExecutionMonitor_module_css_1.default.actionButton} onClick={onResume}>
              ▶️ Resume
            </button>)}
          {(executionState === 'running' || executionState === 'paused') && (<button className={"".concat(ExecutionMonitor_module_css_1.default.actionButton, " ").concat(ExecutionMonitor_module_css_1.default.danger)} onClick={onStop}>
              ⏹️ Stop
            </button>)}
          {failedNodes.length > 0 && (<button className={ExecutionMonitor_module_css_1.default.actionButton} onClick={handleRetryFailed}>
              🔄 Retry Failed ({failedNodes.length})
            </button>)}
        </div>
      </div>

      {/* Progress bar */}
      <div className={ExecutionMonitor_module_css_1.default.progressContainer}>
        <div className={ExecutionMonitor_module_css_1.default.progressBar}>
          <div className={"".concat(ExecutionMonitor_module_css_1.default.progressFill, " ").concat(ExecutionMonitor_module_css_1.default[executionState])} style={{ width: "".concat(progressPercent, "%") }}/>
        </div>
        <span className={ExecutionMonitor_module_css_1.default.progressText}>{progressPercent}%</span>
      </div>

      {/* Quick stats */}
      <div className={ExecutionMonitor_module_css_1.default.quickStats}>
        <div className={ExecutionMonitor_module_css_1.default.statItem}>
          <span className={ExecutionMonitor_module_css_1.default.statDot} style={{ background: STATUS_COLORS.completed }}/>
          <span>{nodeStats.completed} Completed</span>
        </div>
        <div className={ExecutionMonitor_module_css_1.default.statItem}>
          <span className={ExecutionMonitor_module_css_1.default.statDot} style={{ background: STATUS_COLORS.running }}/>
          <span>{nodeStats.running} Running</span>
        </div>
        <div className={ExecutionMonitor_module_css_1.default.statItem}>
          <span className={ExecutionMonitor_module_css_1.default.statDot} style={{ background: STATUS_COLORS.pending }}/>
          <span>{nodeStats.pending + nodeStats.ready} Pending</span>
        </div>
        <div className={ExecutionMonitor_module_css_1.default.statItem}>
          <span className={ExecutionMonitor_module_css_1.default.statDot} style={{ background: STATUS_COLORS.failed }}/>
          <span>{nodeStats.failed} Failed</span>
        </div>
        {elapsedTime !== null && (<div className={ExecutionMonitor_module_css_1.default.statItem}>
            <span>⏱️ {formatDuration(elapsedTime)}</span>
          </div>)}
      </div>

      {/* Tab navigation */}
      <div className={ExecutionMonitor_module_css_1.default.tabs}>
        <button className={"".concat(ExecutionMonitor_module_css_1.default.tab, " ").concat(selectedTab === 'graph' ? ExecutionMonitor_module_css_1.default.tabActive : '')} onClick={function () { return setSelectedTab('graph'); }}>
          📊 Graph
        </button>
        <button className={"".concat(ExecutionMonitor_module_css_1.default.tab, " ").concat(selectedTab === 'logs' ? ExecutionMonitor_module_css_1.default.tabActive : '')} onClick={function () { return setSelectedTab('logs'); }}>
          📜 Logs ({logs.length})
        </button>
        <button className={"".concat(ExecutionMonitor_module_css_1.default.tab, " ").concat(selectedTab === 'stats' ? ExecutionMonitor_module_css_1.default.tabActive : '')} onClick={function () { return setSelectedTab('stats'); }}>
          📈 Statistics
        </button>
      </div>

      {/* Tab content */}
      <div className={ExecutionMonitor_module_css_1.default.tabContent}>
        {/* Graph tab */}
        {selectedTab === 'graph' && (<div className={ExecutionMonitor_module_css_1.default.graphContainer}>
            <DAGGraph_1.DAGGraph dag={dag} width={700} height={400} onNodeSelect={handleNodeSelect} showDetails={false} interactive={true}/>
            {selectedNode && (<div className={ExecutionMonitor_module_css_1.default.nodeInspector}>
                <div className={ExecutionMonitor_module_css_1.default.inspectorHeader}>
                  <span>Node: {selectedNode.skillId || selectedNode.id}</span>
                  <button className={ExecutionMonitor_module_css_1.default.closeButton} onClick={function () { return setSelectedNodeId(null); }}>
                    ×
                  </button>
                </div>
                <div className={ExecutionMonitor_module_css_1.default.inspectorContent}>
                  <div className={ExecutionMonitor_module_css_1.default.inspectorRow}>
                    <span className={ExecutionMonitor_module_css_1.default.inspectorLabel}>Type:</span>
                    <span>{selectedNode.type}</span>
                  </div>
                  <div className={ExecutionMonitor_module_css_1.default.inspectorRow}>
                    <span className={ExecutionMonitor_module_css_1.default.inspectorLabel}>Status:</span>
                    <span className={ExecutionMonitor_module_css_1.default.statusValue} style={{ color: STATUS_COLORS[selectedNode.state.status] }}>
                      {selectedNode.state.status}
                    </span>
                  </div>
                  {selectedNode.state.status === 'running' && 'startedAt' in selectedNode.state && (<div className={ExecutionMonitor_module_css_1.default.inspectorRow}>
                      <span className={ExecutionMonitor_module_css_1.default.inspectorLabel}>Started:</span>
                      <span>{formatTime(selectedNode.state.startedAt)}</span>
                    </div>)}
                  {selectedNode.state.status === 'completed' && 'completedAt' in selectedNode.state && (<div className={ExecutionMonitor_module_css_1.default.inspectorRow}>
                      <span className={ExecutionMonitor_module_css_1.default.inspectorLabel}>Duration:</span>
                      <span>
                        {formatDuration(selectedNode.state.completedAt.getTime() -
                        ('startedAt' in selectedNode.state
                            ? selectedNode.state.startedAt.getTime()
                            : 0))}
                      </span>
                    </div>)}
                  {selectedNode.state.status === 'failed' && 'error' in selectedNode.state && (<div className={ExecutionMonitor_module_css_1.default.inspectorRow}>
                      <span className={ExecutionMonitor_module_css_1.default.inspectorLabel}>Error:</span>
                      <span className={ExecutionMonitor_module_css_1.default.errorText}>
                        {selectedNode.state.error.message}
                      </span>
                    </div>)}
                </div>
              </div>)}
          </div>)}

        {/* Logs tab */}
        {selectedTab === 'logs' && (<div className={ExecutionMonitor_module_css_1.default.logsContainer}>
            <div className={ExecutionMonitor_module_css_1.default.logsToolbar}>
              <select className={ExecutionMonitor_module_css_1.default.logFilter} value={logFilter} onChange={function (e) { return setLogFilter(e.target.value); }}>
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warnings</option>
                <option value="error">Errors</option>
              </select>
              <span className={ExecutionMonitor_module_css_1.default.logCount}>
                Showing {filteredLogs.length} of {logs.length}
              </span>
            </div>
            <div className={ExecutionMonitor_module_css_1.default.logsList} ref={logContainerRef}>
              {filteredLogs.length === 0 ? (<div className={ExecutionMonitor_module_css_1.default.emptyLogs}>No logs yet</div>) : (filteredLogs.map(function (log, index) { return (<div key={index} className={"".concat(ExecutionMonitor_module_css_1.default.logEntry, " ").concat(ExecutionMonitor_module_css_1.default["log".concat(log.level)])}>
                    <span className={ExecutionMonitor_module_css_1.default.logTime}>
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={"".concat(ExecutionMonitor_module_css_1.default.logLevel, " ").concat(ExecutionMonitor_module_css_1.default[log.level])}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.nodeId && (<span className={ExecutionMonitor_module_css_1.default.logNode}>[{log.nodeId}]</span>)}
                    <span className={ExecutionMonitor_module_css_1.default.logMessage}>{log.message}</span>
                  </div>); }))}
            </div>
          </div>)}

        {/* Stats tab */}
        {selectedTab === 'stats' && (<div className={ExecutionMonitor_module_css_1.default.statsContainer}>
            <div className={ExecutionMonitor_module_css_1.default.statsGrid}>
              <div className={ExecutionMonitor_module_css_1.default.statCard}>
                <div className={ExecutionMonitor_module_css_1.default.statCardLabel}>Total Nodes</div>
                <div className={ExecutionMonitor_module_css_1.default.statCardValue}>{dag.nodes.size}</div>
              </div>
              <div className={ExecutionMonitor_module_css_1.default.statCard}>
                <div className={ExecutionMonitor_module_css_1.default.statCardLabel}>Completed</div>
                <div className={ExecutionMonitor_module_css_1.default.statCardValue} style={{ color: STATUS_COLORS.completed }}>
                  {nodeStats.completed}
                </div>
              </div>
              <div className={ExecutionMonitor_module_css_1.default.statCard}>
                <div className={ExecutionMonitor_module_css_1.default.statCardLabel}>Failed</div>
                <div className={ExecutionMonitor_module_css_1.default.statCardValue} style={{ color: STATUS_COLORS.failed }}>
                  {nodeStats.failed}
                </div>
              </div>
              <div className={ExecutionMonitor_module_css_1.default.statCard}>
                <div className={ExecutionMonitor_module_css_1.default.statCardLabel}>Elapsed Time</div>
                <div className={ExecutionMonitor_module_css_1.default.statCardValue}>
                  {elapsedTime !== null ? formatDuration(elapsedTime) : '--'}
                </div>
              </div>
              {stats && (<>
                  <div className={ExecutionMonitor_module_css_1.default.statCard}>
                    <div className={ExecutionMonitor_module_css_1.default.statCardLabel}>Total Tokens</div>
                    <div className={ExecutionMonitor_module_css_1.default.statCardValue}>
                      {stats.totalTokens.toLocaleString()}
                    </div>
                  </div>
                  <div className={ExecutionMonitor_module_css_1.default.statCard}>
                    <div className={ExecutionMonitor_module_css_1.default.statCardLabel}>Estimated Cost</div>
                    <div className={ExecutionMonitor_module_css_1.default.statCardValue}>
                      ${stats.estimatedCost.toFixed(4)}
                    </div>
                  </div>
                </>)}
            </div>

            {/* Node breakdown */}
            <div className={ExecutionMonitor_module_css_1.default.breakdown}>
              <div className={ExecutionMonitor_module_css_1.default.breakdownHeader}>Node Status Breakdown</div>
              <div className={ExecutionMonitor_module_css_1.default.breakdownBars}>
                {Object.entries(nodeStats).map(function (_a) {
                var status = _a[0], count = _a[1];
                if (count === 0)
                    return null;
                var percent = (count / dag.nodes.size) * 100;
                return (<div key={status} className={ExecutionMonitor_module_css_1.default.breakdownItem}>
                      <span className={ExecutionMonitor_module_css_1.default.breakdownLabel}>{status}</span>
                      <div className={ExecutionMonitor_module_css_1.default.breakdownBarContainer}>
                        <div className={ExecutionMonitor_module_css_1.default.breakdownBar} style={{
                        width: "".concat(percent, "%"),
                        background: STATUS_COLORS[status],
                    }}/>
                      </div>
                      <span className={ExecutionMonitor_module_css_1.default.breakdownCount}>{count}</span>
                    </div>);
            })}
              </div>
            </div>
          </div>)}
      </div>

      {/* Footer */}
      <div className={ExecutionMonitor_module_css_1.default.footer}>
        <span>Workflow: {dag.name}</span>
        <span>•</span>
        <span>{dag.nodes.size} nodes</span>
        {(stats === null || stats === void 0 ? void 0 : stats.startTime) && (<>
            <span>•</span>
            <span>Started: {formatTime(stats.startTime)}</span>
          </>)}
      </div>
    </div>);
}
exports.default = ExecutionMonitor;

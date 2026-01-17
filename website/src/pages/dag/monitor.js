"use strict";
/**
 * DAG Monitor Page
 *
 * Real-time monitoring interface for DAG execution.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DAGMonitorPage;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var DAG_1 = require("@site/src/components/DAG");
var dag_module_css_1 = require("./dag.module.css");
// Create a sample DAG for demonstration
function createSampleDAG() {
    var _a;
    var nodes = new Map();
    var edges = new Map();
    var nodeConfigs = [
        { id: 'node-1', type: 'skill', skillId: 'fetch-data', deps: [] },
        { id: 'node-2', type: 'skill', skillId: 'validate', deps: ['node-1'] },
        { id: 'node-3', type: 'skill', skillId: 'transform', deps: ['node-2'] },
        { id: 'node-4', type: 'skill', skillId: 'analyze', deps: ['node-2'] },
        { id: 'node-5', type: 'skill', skillId: 'export', deps: ['node-3', 'node-4'] },
    ];
    for (var _i = 0, nodeConfigs_1 = nodeConfigs; _i < nodeConfigs_1.length; _i++) {
        var config = nodeConfigs_1[_i];
        var node = {
            id: config.id,
            type: config.type,
            skillId: config.skillId,
            dependencies: config.deps,
            inputMappings: [],
            state: { status: 'pending' },
            config: {
                timeoutMs: 30000,
                maxRetries: 3,
                retryDelayMs: 1000,
                exponentialBackoff: true,
            },
        };
        nodes.set(config.id, node);
        // Build edges
        for (var _b = 0, _c = config.deps; _b < _c.length; _b++) {
            var dep = _c[_b];
            var existing = (_a = edges.get(dep)) !== null && _a !== void 0 ? _a : [];
            edges.set(dep, __spreadArray(__spreadArray([], existing, true), [config.id], false));
        }
    }
    return {
        id: 'sample-dag',
        name: 'Data Processing Pipeline',
        nodes: nodes,
        edges: edges,
        config: {
            maxParallelism: 3,
            defaultTimeout: 30000,
            errorHandling: 'stop-on-failure',
        },
        inputs: [],
        outputs: [],
    };
}
function DAGMonitorPage() {
    var _a = (0, react_1.useState)(createSampleDAG), dag = _a[0], setDag = _a[1];
    var _b = (0, react_1.useState)('idle'), executionState = _b[0], setExecutionState = _b[1];
    var _c = (0, react_1.useState)([]), logs = _c[0], setLogs = _c[1];
    var _d = (0, react_1.useState)(), stats = _d[0], setStats = _d[1];
    var executionRef = (0, react_1.useRef)(null);
    var nodeQueueRef = (0, react_1.useRef)([]);
    var addLog = (0, react_1.useCallback)(function (level, message, nodeId) {
        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{
                timestamp: new Date(),
                level: level,
                message: message,
                nodeId: nodeId,
            }], false); });
    }, []);
    var updateNodeStatus = (0, react_1.useCallback)(function (nodeId, status) {
        setDag(function (prev) {
            var newNodes = new Map(prev.nodes);
            var node = newNodes.get(nodeId);
            if (node) {
                var newNode = __assign({}, node);
                if (status === 'running') {
                    newNode.state = { status: 'running', startedAt: new Date() };
                }
                else if (status === 'completed') {
                    var startedAt = 'startedAt' in node.state ? node.state.startedAt : new Date();
                    newNode.state = {
                        status: 'completed',
                        result: { output: { success: true } },
                        completedAt: new Date(),
                        startedAt: startedAt,
                    };
                }
                else if (status === 'failed') {
                    newNode.state = {
                        status: 'failed',
                        error: { message: 'Task execution failed', code: 'EXEC_ERROR', recoverable: true },
                        failedAt: new Date(),
                    };
                }
                else {
                    newNode.state = { status: status };
                }
                newNodes.set(nodeId, newNode);
            }
            return __assign(__assign({}, prev), { nodes: newNodes });
        });
    }, []);
    // Simulation of DAG execution
    var runSimulation = (0, react_1.useCallback)(function () {
        var nodeIds = Array.from(dag.nodes.keys()).map(function (id) { return id; });
        nodeQueueRef.current = __spreadArray([], nodeIds, true);
        var currentIndex = 0;
        var processNextNode = function () {
            if (currentIndex >= nodeIds.length) {
                setExecutionState('completed');
                addLog('info', 'Workflow execution completed successfully');
                setStats(function (prev) { return prev ? __assign(__assign({}, prev), { endTime: new Date() }) : undefined; });
                return;
            }
            var nodeId = nodeIds[currentIndex];
            var node = dag.nodes.get(nodeId);
            if (!node)
                return;
            // Check dependencies
            var depsCompleted = node.dependencies.every(function (depId) {
                var depNode = dag.nodes.get(depId);
                return (depNode === null || depNode === void 0 ? void 0 : depNode.state.status) === 'completed';
            });
            if (!depsCompleted) {
                // Try next node
                currentIndex++;
                processNextNode();
                return;
            }
            // Run this node
            updateNodeStatus(nodeId, 'running');
            addLog('info', "Starting task: ".concat(node.skillId), nodeId);
            // Simulate execution time (1-3 seconds)
            var executionTime = 1000 + Math.random() * 2000;
            executionRef.current = setTimeout(function () {
                // 90% success rate
                var success = Math.random() < 0.9;
                if (success) {
                    updateNodeStatus(nodeId, 'completed');
                    addLog('info', "Task completed: ".concat(node.skillId), nodeId);
                    setStats(function (prev) { return prev ? __assign(__assign({}, prev), { completedNodes: prev.completedNodes + 1, totalTokens: prev.totalTokens + Math.floor(Math.random() * 1000), estimatedCost: prev.estimatedCost + Math.random() * 0.01 }) : undefined; });
                }
                else {
                    updateNodeStatus(nodeId, 'failed');
                    addLog('error', "Task failed: ".concat(node.skillId), nodeId);
                    setStats(function (prev) { return prev ? __assign(__assign({}, prev), { failedNodes: prev.failedNodes + 1 }) : undefined; });
                }
                currentIndex++;
                processNextNode();
            }, executionTime);
        };
        processNextNode();
    }, [dag.nodes, addLog, updateNodeStatus]);
    var handleStart = (0, react_1.useCallback)(function () {
        // Reset state
        setDag(createSampleDAG());
        setLogs([]);
        setStats({
            startTime: new Date(),
            completedNodes: 0,
            failedNodes: 0,
            runningNodes: 0,
            pendingNodes: dag.nodes.size,
            totalTokens: 0,
            estimatedCost: 0,
        });
        setExecutionState('running');
        addLog('info', 'Starting workflow execution...');
        // Start simulation
        setTimeout(runSimulation, 500);
    }, [dag.nodes.size, addLog, runSimulation]);
    var handlePause = (0, react_1.useCallback)(function () {
        if (executionRef.current) {
            clearTimeout(executionRef.current);
        }
        setExecutionState('paused');
        addLog('warn', 'Execution paused');
    }, [addLog]);
    var handleResume = (0, react_1.useCallback)(function () {
        setExecutionState('running');
        addLog('info', 'Execution resumed');
        runSimulation();
    }, [addLog, runSimulation]);
    var handleStop = (0, react_1.useCallback)(function () {
        if (executionRef.current) {
            clearTimeout(executionRef.current);
        }
        setExecutionState('idle');
        addLog('warn', 'Execution stopped by user');
        setStats(function (prev) { return prev ? __assign(__assign({}, prev), { endTime: new Date() }) : undefined; });
    }, [addLog]);
    var handleRetry = (0, react_1.useCallback)(function (nodeIds) {
        addLog('info', "Retrying ".concat(nodeIds.length, " failed node(s)..."));
        for (var _i = 0, nodeIds_1 = nodeIds; _i < nodeIds_1.length; _i++) {
            var nodeId = nodeIds_1[_i];
            updateNodeStatus(nodeId, 'pending');
        }
        setExecutionState('running');
        runSimulation();
    }, [addLog, updateNodeStatus, runSimulation]);
    // Cleanup on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            if (executionRef.current) {
                clearTimeout(executionRef.current);
            }
        };
    }, []);
    return (<Layout_1.default title="DAG Monitor" description="Monitor DAG workflow execution in real-time">
      <div className={dag_module_css_1.default.container}>
        {/* Breadcrumbs */}
        <div className={dag_module_css_1.default.breadcrumbs}>
          <Link_1.default to="/dag" className={dag_module_css_1.default.breadcrumbLink}>DAG Framework</Link_1.default>
          <span className={dag_module_css_1.default.breadcrumbSeparator}>›</span>
          <span className={dag_module_css_1.default.breadcrumbCurrent}>Monitor</span>
        </div>

        {/* Header */}
        <div className={dag_module_css_1.default.monitorHeader}>
          <h1 className={dag_module_css_1.default.monitorTitle}>
            📈 Execution Monitor
          </h1>
          <div className={dag_module_css_1.default.monitorActions}>
            <Link_1.default to="/dag/builder" className={dag_module_css_1.default.secondaryCta}>
              📊 Builder
            </Link_1.default>
          </div>
        </div>

        {/* Monitor Component */}
        <div className={dag_module_css_1.default.monitorContainer}>
          <DAG_1.ExecutionMonitor dag={dag} executionState={executionState} logs={logs} stats={stats} onStart={handleStart} onPause={handlePause} onResume={handleResume} onStop={handleStop} onRetry={handleRetry}/>
        </div>

        {/* Instructions */}
        <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-system)', fontSize: '14px' }}>
            Demo Instructions
          </h3>
          <p style={{ margin: 0, fontFamily: 'var(--font-system)', fontSize: '12px', color: '#333333' }}>
            Click "Start" to begin the simulated workflow execution. The demo will process nodes
            in dependency order, showing real-time progress, logs, and statistics. You can pause,
            resume, or stop execution at any time. Failed nodes can be retried.
          </p>
        </div>
      </div>
    </Layout_1.default>);
}

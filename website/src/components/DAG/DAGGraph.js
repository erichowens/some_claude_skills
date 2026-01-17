"use strict";
/**
 * DAGGraph Component
 *
 * Renders a complete DAG visualization with nodes and edges.
 * Uses SVG for rendering with automatic layout calculation.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAGGraph = DAGGraph;
var react_1 = require("react");
var DAGNode_1 = require("./DAGNode");
var DAGGraph_module_css_1 = require("./DAGGraph.module.css");
var NODE_DIMENSIONS = {
    small: { width: 120, height: 60 },
    medium: { width: 160, height: 80 },
    large: { width: 200, height: 100 },
};
/**
 * Calculate node positions using topological levels
 */
function calculateLayout(dag, nodeSize, direction) {
    var _a, _b;
    var positions = new Map();
    var dims = NODE_DIMENSIONS[nodeSize];
    // Calculate levels using topological ordering
    var levels = new Map();
    var nodes = Array.from(dag.nodes.values());
    // Initialize all nodes at level 0
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        levels.set(node.id, 0);
    }
    // Calculate max level for each node based on dependencies
    var changed = true;
    while (changed) {
        changed = false;
        for (var _c = 0, nodes_2 = nodes; _c < nodes_2.length; _c++) {
            var node = nodes_2[_c];
            var nodeId = node.id;
            for (var _d = 0, _e = node.dependencies; _d < _e.length; _d++) {
                var depId = _e[_d];
                var depLevel = (_a = levels.get(depId)) !== null && _a !== void 0 ? _a : 0;
                var currentLevel = (_b = levels.get(nodeId)) !== null && _b !== void 0 ? _b : 0;
                if (depLevel + 1 > currentLevel) {
                    levels.set(nodeId, depLevel + 1);
                    changed = true;
                }
            }
        }
    }
    // Group nodes by level
    var levelGroups = new Map();
    for (var _f = 0, levels_1 = levels; _f < levels_1.length; _f++) {
        var _g = levels_1[_f], nodeId = _g[0], level = _g[1];
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level).push(nodeId);
    }
    // Calculate positions
    var horizontalGap = dims.width + 60;
    var verticalGap = dims.height + 40;
    for (var _h = 0, levelGroups_1 = levelGroups; _h < levelGroups_1.length; _h++) {
        var _j = levelGroups_1[_h], level = _j[0], nodeIds = _j[1];
        var totalNodes = nodeIds.length;
        for (var i = 0; i < nodeIds.length; i++) {
            var nodeId = nodeIds[i];
            // Center nodes vertically within their level
            var offset = (i - (totalNodes - 1) / 2);
            if (direction === 'horizontal') {
                positions.set(nodeId, {
                    x: level * horizontalGap + 40,
                    y: offset * verticalGap + 200,
                    level: level,
                });
            }
            else {
                positions.set(nodeId, {
                    x: offset * horizontalGap + 400,
                    y: level * verticalGap + 40,
                    level: level,
                });
            }
        }
    }
    return positions;
}
/**
 * Generate edge path between two nodes
 */
function getEdgePath(from, to, nodeSize, direction) {
    var dims = NODE_DIMENSIONS[nodeSize];
    var startX, startY, endX, endY;
    if (direction === 'horizontal') {
        startX = from.x + dims.width;
        startY = from.y + dims.height / 2;
        endX = to.x;
        endY = to.y + dims.height / 2;
    }
    else {
        startX = from.x + dims.width / 2;
        startY = from.y + dims.height;
        endX = to.x + dims.width / 2;
        endY = to.y;
    }
    // Use bezier curve for smooth edges
    var midX = (startX + endX) / 2;
    var midY = (startY + endY) / 2;
    if (direction === 'horizontal') {
        return "M ".concat(startX, " ").concat(startY, " C ").concat(midX, " ").concat(startY, ", ").concat(midX, " ").concat(endY, ", ").concat(endX, " ").concat(endY);
    }
    else {
        return "M ".concat(startX, " ").concat(startY, " C ").concat(startX, " ").concat(midY, ", ").concat(endX, " ").concat(midY, ", ").concat(endX, " ").concat(endY);
    }
}
function DAGGraph(_a) {
    var dag = _a.dag, _b = _a.width, width = _b === void 0 ? 800 : _b, _c = _a.height, height = _c === void 0 ? 600 : _c, _d = _a.nodeSize, nodeSize = _d === void 0 ? 'medium' : _d, onNodeSelect = _a.onNodeSelect, onNodeEdit = _a.onNodeEdit, _e = _a.showDetails, showDetails = _e === void 0 ? true : _e, _f = _a.direction, direction = _f === void 0 ? 'horizontal' : _f, _g = _a.interactive, interactive = _g === void 0 ? true : _g;
    var _h = (0, react_1.useState)(null), selectedNodeId = _h[0], setSelectedNodeId = _h[1];
    var _j = (0, react_1.useState)({ x: 0, y: 0, scale: 1 }), transform = _j[0], setTransform = _j[1];
    var _k = (0, react_1.useState)(false), isDragging = _k[0], setIsDragging = _k[1];
    var _l = (0, react_1.useState)({ x: 0, y: 0 }), dragStart = _l[0], setDragStart = _l[1];
    // Calculate node positions
    var positions = (0, react_1.useMemo)(function () { return calculateLayout(dag, nodeSize, direction); }, [dag, nodeSize, direction]);
    // Generate edges
    var edges = (0, react_1.useMemo)(function () {
        var _a;
        var edgeList = [];
        for (var _i = 0, _b = dag.nodes.values(); _i < _b.length; _i++) {
            var node = _b[_i];
            var toPos = positions.get(node.id);
            if (!toPos)
                continue;
            for (var _c = 0, _d = node.dependencies; _c < _d.length; _c++) {
                var depId = _d[_c];
                var fromPos = positions.get(depId);
                if (!fromPos)
                    continue;
                var fromNode = dag.nodes.get(depId);
                edgeList.push({
                    from: depId,
                    to: node.id,
                    path: getEdgePath(fromPos, toPos, nodeSize, direction),
                    fromStatus: (_a = fromNode === null || fromNode === void 0 ? void 0 : fromNode.state.status) !== null && _a !== void 0 ? _a : 'pending',
                    toStatus: node.state.status,
                });
            }
        }
        return edgeList;
    }, [dag, positions, nodeSize, direction]);
    // Calculate viewBox
    var viewBox = (0, react_1.useMemo)(function () {
        var minX = 0, minY = 0, maxX = width, maxY = height;
        var dims = NODE_DIMENSIONS[nodeSize];
        for (var _i = 0, _a = positions.values(); _i < _a.length; _i++) {
            var pos = _a[_i];
            minX = Math.min(minX, pos.x - 20);
            minY = Math.min(minY, pos.y - 20);
            maxX = Math.max(maxX, pos.x + dims.width + 20);
            maxY = Math.max(maxY, pos.y + dims.height + 20);
        }
        return { minX: minX, minY: minY, width: maxX - minX + 40, height: maxY - minY + 40 };
    }, [positions, nodeSize, width, height]);
    var handleNodeClick = (0, react_1.useCallback)(function (nodeId) {
        setSelectedNodeId(function (prev) { return prev === nodeId ? null : nodeId; });
        onNodeSelect === null || onNodeSelect === void 0 ? void 0 : onNodeSelect(nodeId);
    }, [onNodeSelect]);
    var handleNodeDoubleClick = (0, react_1.useCallback)(function (nodeId) {
        onNodeEdit === null || onNodeEdit === void 0 ? void 0 : onNodeEdit(nodeId);
    }, [onNodeEdit]);
    var handleBackgroundClick = (0, react_1.useCallback)(function () {
        setSelectedNodeId(null);
        onNodeSelect === null || onNodeSelect === void 0 ? void 0 : onNodeSelect(null);
    }, [onNodeSelect]);
    // Pan handlers
    var handleMouseDown = (0, react_1.useCallback)(function (e) {
        if (!interactive)
            return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }, [interactive, transform]);
    var handleMouseMove = (0, react_1.useCallback)(function (e) {
        if (!isDragging)
            return;
        setTransform(function (prev) { return (__assign(__assign({}, prev), { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })); });
    }, [isDragging, dragStart]);
    var handleMouseUp = (0, react_1.useCallback)(function () {
        setIsDragging(false);
    }, []);
    // Zoom handler
    var handleWheel = (0, react_1.useCallback)(function (e) {
        if (!interactive)
            return;
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        setTransform(function (prev) { return (__assign(__assign({}, prev), { scale: Math.max(0.25, Math.min(2, prev.scale * delta)) })); });
    }, [interactive]);
    // Get edge color based on status
    var getEdgeColor = function (fromStatus, toStatus) {
        if (fromStatus === 'completed' && toStatus === 'completed')
            return '#10b981';
        if (fromStatus === 'completed' && toStatus === 'running')
            return '#f59e0b';
        if (fromStatus === 'failed' || toStatus === 'failed')
            return '#ef4444';
        if (fromStatus === 'completed')
            return '#3b82f6';
        return '#9ca3af';
    };
    var selectedNode = selectedNodeId ? dag.nodes.get(selectedNodeId) : null;
    return (<div className={DAGGraph_module_css_1.default.container}>
      {/* Graph header */}
      <div className={DAGGraph_module_css_1.default.header}>
        <div className={DAGGraph_module_css_1.default.title}>
          <span className={DAGGraph_module_css_1.default.icon}>📊</span>
          {dag.name}
        </div>
        <div className={DAGGraph_module_css_1.default.stats}>
          <span>{dag.nodes.size} nodes</span>
          <span>•</span>
          <span>{edges.length} edges</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg className={DAGGraph_module_css_1.default.canvas} width={width} height={height} viewBox={"".concat(viewBox.minX, " ").concat(viewBox.minY, " ").concat(viewBox.width, " ").concat(viewBox.height)} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onClick={handleBackgroundClick}>
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>

          {/* Arrow marker for edges */}
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/>
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981"/>
          </marker>
        </defs>

        <rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="url(#grid)"/>

        {/* Transform group for pan/zoom */}
        <g transform={"translate(".concat(transform.x, ", ").concat(transform.y, ") scale(").concat(transform.scale, ")")}>
          {/* Edges */}
          <g className={DAGGraph_module_css_1.default.edges}>
            {edges.map(function (edge, i) { return (<path key={"".concat(edge.from, "-").concat(edge.to, "-").concat(i)} d={edge.path} fill="none" stroke={getEdgeColor(edge.fromStatus, edge.toStatus)} strokeWidth={2} markerEnd={edge.fromStatus === 'completed' ? 'url(#arrowhead-active)' : 'url(#arrowhead)'} className={DAGGraph_module_css_1.default.edge}/>); })}
          </g>

          {/* Nodes */}
          <g className={DAGGraph_module_css_1.default.nodes}>
            {Array.from(dag.nodes.values()).map(function (node) {
            var pos = positions.get(node.id);
            if (!pos)
                return null;
            return (<DAGNode_1.DAGNode key={node.id} node={node} position={pos} selected={selectedNodeId === node.id} onClick={handleNodeClick} onDoubleClick={handleNodeDoubleClick} size={nodeSize}/>);
        })}
          </g>
        </g>
      </svg>

      {/* Node details panel */}
      {showDetails && selectedNode && (<div className={DAGGraph_module_css_1.default.detailsPanel}>
          <div className={DAGGraph_module_css_1.default.detailsHeader}>
            <span>Node Details</span>
            <button className={DAGGraph_module_css_1.default.closeButton} onClick={function () { return setSelectedNodeId(null); }}>
              ×
            </button>
          </div>
          <div className={DAGGraph_module_css_1.default.detailsContent}>
            <div className={DAGGraph_module_css_1.default.detailRow}>
              <span className={DAGGraph_module_css_1.default.detailLabel}>ID:</span>
              <span className={DAGGraph_module_css_1.default.detailValue}>{selectedNode.id}</span>
            </div>
            <div className={DAGGraph_module_css_1.default.detailRow}>
              <span className={DAGGraph_module_css_1.default.detailLabel}>Type:</span>
              <span className={DAGGraph_module_css_1.default.detailValue}>{selectedNode.type}</span>
            </div>
            {selectedNode.skillId && (<div className={DAGGraph_module_css_1.default.detailRow}>
                <span className={DAGGraph_module_css_1.default.detailLabel}>Skill:</span>
                <span className={DAGGraph_module_css_1.default.detailValue}>{selectedNode.skillId}</span>
              </div>)}
            <div className={DAGGraph_module_css_1.default.detailRow}>
              <span className={DAGGraph_module_css_1.default.detailLabel}>Status:</span>
              <span className={DAGGraph_module_css_1.default.detailValue}>{selectedNode.state.status}</span>
            </div>
            <div className={DAGGraph_module_css_1.default.detailRow}>
              <span className={DAGGraph_module_css_1.default.detailLabel}>Dependencies:</span>
              <span className={DAGGraph_module_css_1.default.detailValue}>
                {selectedNode.dependencies.length > 0
                ? selectedNode.dependencies.join(', ')
                : 'None'}
              </span>
            </div>
          </div>
        </div>)}

      {/* Controls */}
      {interactive && (<div className={DAGGraph_module_css_1.default.controls}>
          <button className={DAGGraph_module_css_1.default.controlButton} onClick={function () { return setTransform({ x: 0, y: 0, scale: 1 }); }} title="Reset view">
            🔄
          </button>
          <button className={DAGGraph_module_css_1.default.controlButton} onClick={function () { return setTransform(function (prev) { return (__assign(__assign({}, prev), { scale: prev.scale * 1.2 })); }); }} title="Zoom in">
            +
          </button>
          <button className={DAGGraph_module_css_1.default.controlButton} onClick={function () { return setTransform(function (prev) { return (__assign(__assign({}, prev), { scale: prev.scale * 0.8 })); }); }} title="Zoom out">
            −
          </button>
        </div>)}

      {/* Legend */}
      <div className={DAGGraph_module_css_1.default.legend}>
        <div className={DAGGraph_module_css_1.default.legendItem}>
          <span className={DAGGraph_module_css_1.default.legendDot} style={{ background: '#6b7280' }}/>
          <span>Pending</span>
        </div>
        <div className={DAGGraph_module_css_1.default.legendItem}>
          <span className={DAGGraph_module_css_1.default.legendDot} style={{ background: '#3b82f6' }}/>
          <span>Ready</span>
        </div>
        <div className={DAGGraph_module_css_1.default.legendItem}>
          <span className={DAGGraph_module_css_1.default.legendDot} style={{ background: '#f59e0b' }}/>
          <span>Running</span>
        </div>
        <div className={DAGGraph_module_css_1.default.legendItem}>
          <span className={DAGGraph_module_css_1.default.legendDot} style={{ background: '#10b981' }}/>
          <span>Completed</span>
        </div>
        <div className={DAGGraph_module_css_1.default.legendItem}>
          <span className={DAGGraph_module_css_1.default.legendDot} style={{ background: '#ef4444' }}/>
          <span>Failed</span>
        </div>
      </div>
    </div>);
}
exports.default = DAGGraph;

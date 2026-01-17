"use strict";
/**
 * DAGNode Component
 *
 * Visual representation of a single node in a DAG execution graph.
 * Shows node type, status, and provides interaction handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAGNode = DAGNode;
var react_1 = require("react");
var DAGNode_module_css_1 = require("./DAGNode.module.css");
var NODE_SIZES = {
    small: { width: 120, height: 60, fontSize: 10 },
    medium: { width: 160, height: 80, fontSize: 12 },
    large: { width: 200, height: 100, fontSize: 14 },
};
var STATUS_COLORS = {
    pending: '#6b7280', // gray
    ready: '#3b82f6', // blue
    running: '#f59e0b', // amber
    completed: '#10b981', // green
    failed: '#ef4444', // red
    skipped: '#9ca3af', // light gray
};
var NODE_TYPE_ICONS = {
    skill: '⚙️',
    agent: '🤖',
    'mcp-tool': '🔧',
    composite: '📦',
    conditional: '🔀',
};
function getStatusLabel(state) {
    switch (state.status) {
        case 'pending':
            return 'Pending';
        case 'ready':
            return 'Ready';
        case 'running':
            return 'Running...';
        case 'completed':
            return 'Done';
        case 'failed':
            return 'Failed';
        case 'skipped':
            return 'Skipped';
    }
}
function DAGNode(_a) {
    var node = _a.node, position = _a.position, _b = _a.selected, selected = _b === void 0 ? false : _b, onClick = _a.onClick, onDoubleClick = _a.onDoubleClick, _c = _a.size, size = _c === void 0 ? 'medium' : _c;
    var dimensions = NODE_SIZES[size];
    var statusColor = STATUS_COLORS[node.state.status];
    var icon = NODE_TYPE_ICONS[node.type];
    var handleClick = function (e) {
        e.stopPropagation();
        onClick === null || onClick === void 0 ? void 0 : onClick(node.id);
    };
    var handleDoubleClick = function (e) {
        e.stopPropagation();
        onDoubleClick === null || onDoubleClick === void 0 ? void 0 : onDoubleClick(node.id);
    };
    // Extract name from node
    var nodeName = node.skillId || node.id;
    return (<g transform={"translate(".concat(position.x, ", ").concat(position.y, ")")} onClick={handleClick} onDoubleClick={handleDoubleClick} className={DAGNode_module_css_1.default.nodeGroup}>
      {/* Shadow */}
      <rect x={4} y={4} width={dimensions.width} height={dimensions.height} rx={8} fill="#000000" opacity={0.15}/>

      {/* Main node body - Win31 style */}
      <rect x={0} y={0} width={dimensions.width} height={dimensions.height} rx={8} fill="#c0c0c0" stroke={selected ? '#000080' : '#000000'} strokeWidth={selected ? 3 : 2} className={DAGNode_module_css_1.default.nodeBody}/>

      {/* Title bar - Navy blue Win31 style */}
      <rect x={2} y={2} width={dimensions.width - 4} height={20} fill="#000080"/>

      {/* Title text */}
      <text x={8} y={15} fill="#ffffff" fontSize={dimensions.fontSize - 2} fontWeight="bold" fontFamily="var(--font-code)">
        {icon} {node.type}
      </text>

      {/* Node name */}
      <text x={dimensions.width / 2} y={dimensions.height / 2 + 2} textAnchor="middle" fill="#000000" fontSize={dimensions.fontSize} fontWeight="bold" fontFamily="var(--font-code)">
        {nodeName.length > 18 ? "".concat(nodeName.slice(0, 15), "...") : nodeName}
      </text>

      {/* Status badge */}
      <g transform={"translate(".concat(dimensions.width / 2 - 30, ", ").concat(dimensions.height - 20, ")")}>
        <rect x={0} y={0} width={60} height={14} rx={3} fill={statusColor}/>
        <text x={30} y={10} textAnchor="middle" fill="#ffffff" fontSize={9} fontWeight="bold" fontFamily="var(--font-system)">
          {getStatusLabel(node.state)}
        </text>
      </g>

      {/* Running indicator (animated) */}
      {node.state.status === 'running' && (<g className={DAGNode_module_css_1.default.runningIndicator}>
          <circle cx={dimensions.width - 12} cy={12} r={5} fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>)}

      {/* Selection indicator */}
      {selected && (<rect x={-4} y={-4} width={dimensions.width + 8} height={dimensions.height + 8} rx={10} fill="none" stroke="#000080" strokeWidth={2} strokeDasharray="4,4"/>)}
    </g>);
}
exports.default = DAGNode;

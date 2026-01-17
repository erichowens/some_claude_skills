"use strict";
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
exports.default = KnowledgeGraph;
var react_1 = require("react");
var styles_module_css_1 = require("./styles.module.css");
function KnowledgeGraph(_a) {
    var nodes = _a.nodes, edges = _a.edges, onNodeClick = _a.onNodeClick;
    var canvasRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(null), hoveredNode = _b[0], setHoveredNode = _b[1];
    var _c = (0, react_1.useState)([]), layoutNodes = _c[0], setLayoutNodes = _c[1];
    // Bipartite layout: agents on left, skills on right
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var width = canvas.width;
        var height = canvas.height;
        var agentNodes = nodes.filter(function (n) { return n.type === 'agent'; });
        var skillNodes = nodes.filter(function (n) { return n.type === 'skill'; });
        var agentColumnX = width * 0.15;
        var skillColumnX = width * 0.75;
        var agentSpacing = (height - 100) / Math.max(agentNodes.length, 1);
        var skillSpacing = (height - 100) / Math.max(skillNodes.length, 1);
        var positioned = [];
        // Position agents in left column
        agentNodes.forEach(function (node, i) {
            positioned.push(__assign(__assign({}, node), { x: agentColumnX, y: 50 + (i + 0.5) * agentSpacing }));
        });
        // Position skills in right column
        skillNodes.forEach(function (node, i) {
            positioned.push(__assign(__assign({}, node), { x: skillColumnX, y: 50 + (i + 0.5) * skillSpacing }));
        });
        setLayoutNodes(positioned);
    }, [nodes]);
    // Get connected nodes for highlighting
    var getConnectedNodes = (0, react_1.useCallback)(function (nodeId) {
        var connected = new Set();
        edges.forEach(function (edge) {
            if (edge.from === nodeId)
                connected.add(edge.to);
            if (edge.to === nodeId)
                connected.add(edge.from);
        });
        return connected;
    }, [edges]);
    // Render graph
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        if (!canvas || layoutNodes.length === 0)
            return;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        var connectedToHovered = hoveredNode ? getConnectedNodes(hoveredNode) : new Set();
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw column labels
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px var(--font-system)';
        ctx.textAlign = 'center';
        ctx.fillText('AGENTS (9)', canvas.width * 0.15, 30);
        ctx.fillText('SKILLS (51)', canvas.width * 0.75, 30);
        // Draw edges
        edges.forEach(function (edge) {
            var source = layoutNodes.find(function (n) { return n.id === edge.from; });
            var target = layoutNodes.find(function (n) { return n.id === edge.to; });
            if (!source || !target)
                return;
            var isHighlighted = hoveredNode &&
                (edge.from === hoveredNode || edge.to === hoveredNode);
            var isDimmed = hoveredNode && !isHighlighted;
            if (isDimmed) {
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
                ctx.lineWidth = 1;
            }
            else if (isHighlighted) {
                ctx.strokeStyle = '#f59e0b'; // Amber for highlighted edges
                ctx.lineWidth = 3;
            }
            else {
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
                ctx.lineWidth = 1.5;
            }
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            // Bezier curve for smoother edges
            var cpX = (source.x + target.x) / 2;
            ctx.quadraticCurveTo(cpX, source.y, cpX, (source.y + target.y) / 2);
            ctx.quadraticCurveTo(cpX, target.y, target.x, target.y);
            ctx.stroke();
        });
        // Draw nodes
        layoutNodes.forEach(function (node) {
            var isAgent = node.type === 'agent';
            var isHovered = hoveredNode === node.id;
            var isConnected = connectedToHovered.has(node.id);
            var isDimmed = hoveredNode && !isHovered && !isConnected;
            // Node colors
            var fillColor;
            var strokeColor;
            var radius;
            if (isAgent) {
                fillColor = isHovered ? '#818cf8' : '#6366f1';
                strokeColor = isHovered ? '#c7d2fe' : '#4f46e5';
                radius = isHovered ? 16 : 12;
            }
            else {
                fillColor = isHovered ? '#34d399' : '#10b981';
                strokeColor = isHovered ? '#a7f3d0' : '#059669';
                radius = isHovered ? 10 : 6;
            }
            if (isDimmed) {
                fillColor = isAgent ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)';
                strokeColor = 'transparent';
            }
            else if (isConnected && !isHovered) {
                // Highlight connected nodes
                fillColor = isAgent ? '#818cf8' : '#34d399';
                strokeColor = '#f59e0b';
                radius = isAgent ? 14 : 8;
            }
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            if (strokeColor !== 'transparent') {
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            // Draw label
            var showLabel = isAgent || isHovered || isConnected;
            if (showLabel) {
                ctx.fillStyle = isDimmed ? 'rgba(255, 255, 255, 0.3)' : '#fff';
                ctx.font = isHovered ? 'bold 13px var(--font-code)' : '11px var(--font-code)';
                ctx.textAlign = isAgent ? 'right' : 'left';
                var labelX = isAgent ? node.x - radius - 8 : node.x + radius + 8;
                ctx.fillText(node.label, labelX, node.y + 4);
            }
        });
        // Draw hover tooltip with more info
        if (hoveredNode) {
            var node = layoutNodes.find(function (n) { return n.id === hoveredNode; });
            if (node) {
                var connectionCount = connectedToHovered.size;
                var tooltipText = node.type === 'agent'
                    ? "".concat(node.label, " (").concat(connectionCount, " connections)")
                    : node.label;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
                ctx.strokeStyle = node.type === 'agent' ? '#6366f1' : '#10b981';
                ctx.lineWidth = 2;
                var padding = 12;
                ctx.font = 'bold 12px var(--font-system)';
                var textWidth = ctx.measureText(tooltipText).width;
                var tooltipX = node.x + (node.type === 'agent' ? -textWidth - 50 : 30);
                var tooltipY = node.y - 35;
                // Tooltip background
                ctx.beginPath();
                ctx.roundRect(tooltipX - padding, tooltipY - 16, textWidth + padding * 2, 28, 4);
                ctx.fill();
                ctx.stroke();
                // Tooltip text
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';
                ctx.fillText(tooltipText, tooltipX, tooltipY);
            }
        }
    }, [layoutNodes, hoveredNode, edges, getConnectedNodes]);
    // Handle mouse events
    var handleMouseMove = function (e) {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var x = (e.clientX - rect.left) * scaleX;
        var y = (e.clientY - rect.top) * scaleY;
        var node = layoutNodes.find(function (n) {
            var dx = n.x - x;
            var dy = n.y - y;
            var hitRadius = n.type === 'agent' ? 16 : 10;
            return Math.sqrt(dx * dx + dy * dy) < hitRadius;
        });
        setHoveredNode(node ? node.id : null);
        canvas.style.cursor = node ? 'pointer' : 'default';
    };
    var handleClick = function () {
        if (hoveredNode && onNodeClick) {
            onNodeClick(hoveredNode);
        }
    };
    return (<div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">GRAPH.VIZ - Bipartite Capability Network</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">□</div>
        </div>
      </div>

      <div className={styles_module_css_1.default.graphContainer}>
        <canvas ref={canvasRef} width={1200} height={700} className={styles_module_css_1.default.graphCanvas} onMouseMove={handleMouseMove} onClick={handleClick} onMouseLeave={function () { return setHoveredNode(null); }}/>

        <div className={styles_module_css_1.default.graphLegend}>
          <div className={styles_module_css_1.default.legendItem}>
            <div className={styles_module_css_1.default.legendDot} style={{ background: '#6366f1' }}/>
            <span>Agents</span>
          </div>
          <div className={styles_module_css_1.default.legendItem}>
            <div className={styles_module_css_1.default.legendDot} style={{ background: '#10b981' }}/>
            <span>Skills</span>
          </div>
          <div className={styles_module_css_1.default.legendItem}>
            <div className={styles_module_css_1.default.legendDot} style={{ background: '#f59e0b' }}/>
            <span>Connections (hover)</span>
          </div>
        </div>

        <div className={styles_module_css_1.default.graphInstructions}>
          <span>Hover over a node to see its connections • Click to view details</span>
        </div>
      </div>
    </div>);
}

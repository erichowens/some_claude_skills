"use strict";
/**
 * DAG Visualization Component
 *
 * Displays DAG execution graphs with:
 * - Node visualization with status indicators
 * - Edge connections showing dependencies
 * - Wave grouping for parallel execution
 * - Real-time execution progress
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAGVisualizer = DAGVisualizer;
var react_1 = require("react");
var DAGVisualizer_module_css_1 = require("./DAGVisualizer.module.css");
// Image cache for skill hero images
var imageCache = new Map();
// ============================================================================
// CONFIGURABLE CONSTANTS - Adjust these to change the layout
// ============================================================================
var NODE_WIDTH = 120;
var NODE_HEIGHT = 100;
var TITLE_BAR_HEIGHT = 18;
var HORIZONTAL_SPACING = 250; // Space between waves (columns)
var VERTICAL_SPACING = 180; // Space between nodes in a wave
var CANVAS_PADDING = 50; // Padding around the entire graph
// ============================================================================
function DAGVisualizer(_a) {
    var _this = this;
    var dag = _a.dag, executionState = _a.executionState, onNodeClick = _a.onNodeClick, _b = _a.highlightCriticalPath, highlightCriticalPath = _b === void 0 ? false : _b;
    var canvasRef = (0, react_1.useRef)(null);
    var _c = (0, react_1.useState)(null), hoveredNode = _c[0], setHoveredNode = _c[1];
    var _d = (0, react_1.useState)(null), mousePos = _d[0], setMousePos = _d[1];
    var _e = (0, react_1.useState)(false), imagesLoaded = _e[0], setImagesLoaded = _e[1];
    var _f = (0, react_1.useState)(1.0), zoom = _f[0], setZoom = _f[1];
    var _g = (0, react_1.useState)(true), autoFit = _g[0], setAutoFit = _g[1];
    var _h = (0, react_1.useState)(false), isPanning = _h[0], setIsPanning = _h[1];
    var _j = (0, react_1.useState)({ x: 0, y: 0 }), panOffset = _j[0], setPanOffset = _j[1];
    var _k = (0, react_1.useState)({ x: 0, y: 0 }), panStart = _k[0], setPanStart = _k[1];
    // Preload skill hero images
    (0, react_1.useEffect)(function () {
        var loadImages = function () { return __awaiter(_this, void 0, void 0, function () {
            var promises, _loop_1, _i, _a, _b, _, node;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        promises = [];
                        _loop_1 = function (_, node) {
                            if (node.skillId && !imageCache.has(node.skillId)) {
                                var promise = new Promise(function (resolve) {
                                    var img = new Image();
                                    img.onload = function () {
                                        imageCache.set(node.skillId, img);
                                        resolve();
                                    };
                                    img.onerror = function () { return resolve(); }; // Continue even if image fails to load
                                    img.src = "/img/skills/".concat(node.skillId, "-hero.png");
                                });
                                promises.push(promise);
                            }
                        };
                        for (_i = 0, _a = dag.nodes; _i < _a.length; _i++) {
                            _b = _a[_i], _ = _b[0], node = _b[1];
                            _loop_1(_, node);
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _c.sent();
                        setImagesLoaded(true);
                        return [2 /*return*/];
                }
            });
        }); };
        loadImages();
    }, [dag]);
    (0, react_1.useEffect)(function () {
        if (!canvasRef.current || !imagesLoaded)
            return;
        var canvas = canvasRef.current;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // Set canvas size
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        // Draw the DAG with zoom and pan
        drawDAG(ctx, dag, executionState, hoveredNode, highlightCriticalPath, zoom, autoFit, panOffset);
    }, [dag, executionState, hoveredNode, highlightCriticalPath, imagesLoaded, zoom, autoFit, panOffset]);
    // Mouse wheel zoom - attach manually with passive: false to allow preventDefault
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var handleWheel = function (e) {
            e.preventDefault();
            setAutoFit(false); // Disable auto-fit when manually zooming
            var delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(function (prev) { return Math.max(0.1, Math.min(3.0, prev + delta)); });
        };
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return function () { return canvas.removeEventListener('wheel', handleWheel); };
    }, []);
    var handleZoomIn = function () {
        setAutoFit(false);
        setZoom(function (prev) { return Math.min(3.0, prev + 0.2); });
    };
    var handleZoomOut = function () {
        setAutoFit(false);
        setZoom(function (prev) { return Math.max(0.1, prev - 0.2); });
    };
    var handleResetZoom = function () {
        setZoom(1.0);
        setAutoFit(true);
        setPanOffset({ x: 0, y: 0 }); // Reset pan when resetting zoom
    };
    var handleMouseDown = function (e) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    };
    var handleMouseUp = function () {
        setIsPanning(false);
    };
    var handleMouseMove = function (e) {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        // Update mouse position for tooltip
        setMousePos({ x: e.clientX, y: e.clientY });
        // Handle panning
        if (isPanning) {
            var newPanOffset = {
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            };
            setPanOffset(newPanOffset);
            setAutoFit(false); // Disable auto-fit when manually panning
            canvas.style.cursor = 'grabbing';
            return;
        }
        // Find node under cursor (accounting for zoom and transformations)
        var node = findNodeAtPosition(x, y, dag, zoom, autoFit, panOffset);
        setHoveredNode(node);
        // Change cursor if hovering over node
        canvas.style.cursor = node ? 'pointer' : 'grab';
    };
    var handleClick = function (e) {
        if (!hoveredNode || !onNodeClick)
            return;
        onNodeClick(hoveredNode);
    };
    return (<div className={DAGVisualizer_module_css_1.default.container}>
      <div className={DAGVisualizer_module_css_1.default.zoomControls}>
        <button onClick={handleZoomIn} className={DAGVisualizer_module_css_1.default.zoomButton} title="Zoom In">+</button>
        <button onClick={handleZoomOut} className={DAGVisualizer_module_css_1.default.zoomButton} title="Zoom Out">−</button>
        <button onClick={handleResetZoom} className={DAGVisualizer_module_css_1.default.zoomButton} title="Reset Zoom">⊙</button>
        <span className={DAGVisualizer_module_css_1.default.zoomLevel}>{Math.round(zoom * 100)}%</span>
      </div>
      <canvas ref={canvasRef} className={DAGVisualizer_module_css_1.default.canvas} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleClick}/>
      {hoveredNode && mousePos && (<div className={DAGVisualizer_module_css_1.default.tooltip} style={{ left: "".concat(mousePos.x + 15, "px"), top: "".concat(mousePos.y + 15, "px") }}>
          {renderNodeTooltip(dag.nodes.get(hoveredNode), executionState === null || executionState === void 0 ? void 0 : executionState.get(hoveredNode))}
        </div>)}
    </div>);
}
/**
 * Draw the entire DAG on canvas
 */
function drawDAG(ctx, dag, executionState, hoveredNode, highlightCriticalPath, zoom, autoFit, panOffset) {
    var width = ctx.canvas.width / window.devicePixelRatio;
    var height = ctx.canvas.height / window.devicePixelRatio;
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Layout nodes in layers (wave-based)
    var layout = calculateLayout(dag, width, height);
    // Calculate bounding box and auto-fit scale
    var bounds = calculateBoundingBox(layout);
    var scale = zoom;
    if (autoFit && bounds) {
        // Calculate scale to fit all nodes with padding
        var scaleX = (width - 2 * CANVAS_PADDING) / bounds.width;
        var scaleY = (height - 2 * CANVAS_PADDING) / bounds.height;
        scale = Math.min(scaleX, scaleY); // Allow scaling up to fill canvas
    }
    // Save context and apply transformations
    ctx.save();
    if (autoFit && bounds) {
        // Center the graph with padding
        var scaledWidth = bounds.width * scale;
        var scaledHeight = bounds.height * scale;
        var offsetX = (width - scaledWidth) / 2 - bounds.minX * scale;
        var offsetY = (height - scaledHeight) / 2 - bounds.minY * scale;
        ctx.translate(offsetX + panOffset.x, offsetY + panOffset.y);
    }
    else {
        // Manual pan without auto-fit
        ctx.translate(panOffset.x, panOffset.y);
    }
    ctx.scale(scale, scale);
    // Draw edges first (behind nodes)
    drawEdges(ctx, dag, layout, executionState);
    // Draw nodes
    for (var _i = 0, _a = layout.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], nodeId = _b[0], position = _b[1];
        var node = dag.nodes.get(nodeId);
        var state = executionState === null || executionState === void 0 ? void 0 : executionState.get(nodeId);
        var isHovered = nodeId === hoveredNode;
        drawNode(ctx, nodeId, node, position, state, isHovered);
    }
    // Restore context
    ctx.restore();
    // Draw legend (unscaled, in corner)
    drawLegend(ctx, width, height);
}
/**
 * Calculate node positions using wave-based layout (left-to-right)
 */
function calculateLayout(dag, width, height) {
    var layout = new Map();
    // Group nodes by wave (dependency depth)
    var waves = groupByWaves(dag);
    waves.forEach(function (nodeIds, waveIndex) {
        // Position waves from left to right
        var waveX = waveIndex * HORIZONTAL_SPACING;
        nodeIds.forEach(function (nodeId, nodeIndex) {
            // Position nodes top to bottom within a wave
            var y = nodeIndex * VERTICAL_SPACING;
            layout.set(nodeId, { x: waveX, y: y });
        });
    });
    return layout;
}
/**
 * Calculate bounding box of all nodes
 */
function calculateBoundingBox(layout) {
    if (layout.size === 0)
        return null;
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    for (var _i = 0, _a = layout.values(); _i < _a.length; _i++) {
        var _b = _a[_i], x = _b.x, y = _b.y;
        var nodeLeft = x - NODE_WIDTH / 2;
        var nodeRight = x + NODE_WIDTH / 2;
        var nodeTop = y - NODE_HEIGHT / 2;
        var nodeBottom = y + NODE_HEIGHT / 2;
        minX = Math.min(minX, nodeLeft);
        maxX = Math.max(maxX, nodeRight);
        minY = Math.min(minY, nodeTop);
        maxY = Math.max(maxY, nodeBottom);
    }
    return {
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
/**
 * Group nodes by execution wave (dependency depth)
 */
function groupByWaves(dag) {
    var waves = [];
    var visited = new Set();
    var inDegree = new Map();
    // Calculate in-degrees
    for (var _i = 0, _a = dag.nodes.keys(); _i < _a.length; _i++) {
        var nodeId = _a[_i];
        inDegree.set(nodeId, 0);
    }
    for (var _b = 0, _c = dag.edges; _b < _c.length; _b++) {
        var _d = _c[_b], _ = _d[0], targets = _d[1];
        for (var _e = 0, targets_1 = targets; _e < targets_1.length; _e++) {
            var target = targets_1[_e];
            inDegree.set(target, (inDegree.get(target) || 0) + 1);
        }
    }
    // Process waves
    while (visited.size < dag.nodes.size) {
        var wave = [];
        // Find all nodes with in-degree 0
        for (var _f = 0, _g = inDegree.entries(); _f < _g.length; _f++) {
            var _h = _g[_f], nodeId = _h[0], degree = _h[1];
            if (degree === 0 && !visited.has(nodeId)) {
                wave.push(nodeId);
            }
        }
        if (wave.length === 0)
            break; // Cycle detected
        waves.push(wave);
        // Mark as visited and update in-degrees
        for (var _j = 0, wave_1 = wave; _j < wave_1.length; _j++) {
            var nodeId = wave_1[_j];
            visited.add(nodeId);
            var targets = dag.edges.get(nodeId) || [];
            for (var _k = 0, targets_2 = targets; _k < targets_2.length; _k++) {
                var target = targets_2[_k];
                inDegree.set(target, inDegree.get(target) - 1);
            }
        }
    }
    return waves;
}
/**
 * Draw edges between nodes (left-to-right with arrows)
 */
function drawEdges(ctx, dag, layout, executionState) {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (var _i = 0, _a = dag.edges; _i < _a.length; _i++) {
        var _b = _a[_i], fromId = _b[0], toIds = _b[1];
        var fromPos = layout.get(fromId);
        if (!fromPos)
            continue;
        for (var _c = 0, toIds_1 = toIds; _c < toIds_1.length; _c++) {
            var toId = toIds_1[_c];
            var toPos = layout.get(toId);
            if (!toPos)
                continue;
            // Draw curved arrow from right edge of source window to left edge of target window
            var startX = fromPos.x + NODE_WIDTH / 2;
            var startY = fromPos.y;
            var endX = toPos.x - NODE_WIDTH / 2;
            var endY = toPos.y;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            var midX = (startX + endX) / 2;
            ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
            ctx.stroke();
            // Draw arrowhead pointing right (toward target)
            drawArrowhead(ctx, endX, endY, 0);
        }
    }
}
/**
 * Draw an arrowhead
 */
function drawArrowhead(ctx, x, y, angle) {
    var size = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#666';
    ctx.fill();
}
/**
 * Draw a single node as a Windows 3.1 style window
 */
function drawNode(ctx, nodeId, node, position, state, isHovered) {
    var x = position.x - NODE_WIDTH / 2;
    var y = position.y - NODE_HEIGHT / 2;
    // Determine title bar color based on state
    var titleBarColor = '#000080'; // Navy blue (pending)
    if (state) {
        switch (state.status) {
            case 'ready':
                titleBarColor = '#ffeb3b'; // Yellow
                break;
            case 'running':
                titleBarColor = '#2196f3'; // Blue
                break;
            case 'completed':
                titleBarColor = '#4caf50'; // Green
                break;
            case 'failed':
                titleBarColor = '#f44336'; // Red
                break;
            case 'skipped':
                titleBarColor = '#9e9e9e'; // Gray
                break;
        }
    }
    // Draw outer border (black)
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, NODE_WIDTH, NODE_HEIGHT);
    // Draw white highlight (top-left)
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 2, y + 2, NODE_WIDTH - 4, 2); // Top
    ctx.fillRect(x + 2, y + 2, 2, NODE_HEIGHT - 4); // Left
    // Draw dark shadow (bottom-right)
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 2, y + NODE_HEIGHT - 4, NODE_WIDTH - 4, 2); // Bottom
    ctx.fillRect(x + NODE_WIDTH - 4, y + 2, 2, NODE_HEIGHT - 4); // Right
    // Draw title bar
    ctx.fillStyle = titleBarColor;
    ctx.fillRect(x + 4, y + 4, NODE_WIDTH - 8, TITLE_BAR_HEIGHT);
    // Draw title bar text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var title = node.name || nodeId;
    var truncatedTitle = title.length > 14 ? title.substring(0, 11) + '...' : title;
    ctx.fillText(truncatedTitle, x + 8, y + 4 + TITLE_BAR_HEIGHT / 2);
    // Draw window content area (light gray)
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x + 4, y + 4 + TITLE_BAR_HEIGHT, NODE_WIDTH - 8, NODE_HEIGHT - 8 - TITLE_BAR_HEIGHT);
    // Draw skill hero image if available
    if (node.skillId) {
        var img = imageCache.get(node.skillId);
        if (img) {
            var imgX = x + 6;
            var imgY = y + 6 + TITLE_BAR_HEIGHT;
            var imgWidth = NODE_WIDTH - 12;
            var imgHeight = NODE_HEIGHT - 12 - TITLE_BAR_HEIGHT;
            ctx.save();
            ctx.beginPath();
            ctx.rect(imgX, imgY, imgWidth, imgHeight);
            ctx.clip();
            // Draw image maintaining aspect ratio
            var aspectRatio = img.width / img.height;
            var targetAspect = imgWidth / imgHeight;
            var drawWidth = imgWidth;
            var drawHeight = imgHeight;
            var drawX = imgX;
            var drawY = imgY;
            if (aspectRatio > targetAspect) {
                drawHeight = imgWidth / aspectRatio;
                drawY = imgY + (imgHeight - drawHeight) / 2;
            }
            else {
                drawWidth = imgHeight * aspectRatio;
                drawX = imgX + (imgWidth - drawWidth) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
        }
    }
    // Draw hover border
    if (isHovered) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, NODE_WIDTH, NODE_HEIGHT);
    }
}
/**
 * Draw legend
 */
function drawLegend(ctx, width, height) {
    var legendItems = [
        { color: '#f0f0f0', border: '#ccc', label: 'Pending' },
        { color: '#ffffcc', border: '#ffeb3b', label: 'Ready' },
        { color: '#bbdefb', border: '#2196f3', label: 'Running' },
        { color: '#c8e6c9', border: '#4caf50', label: 'Completed' },
        { color: '#ffcdd2', border: '#f44336', label: 'Failed' },
    ];
    var legendX = 20;
    var legendY = height - (legendItems.length * 25 + 20);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    legendItems.forEach(function (item, index) {
        var y = legendY + index * 25;
        // Draw circle
        ctx.beginPath();
        ctx.arc(legendX + 10, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = item.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Draw label
        ctx.fillStyle = '#000';
        ctx.fillText(item.label, legendX + 25, y);
    });
}
/**
 * Find node at position (accounting for zoom and transformations)
 */
function findNodeAtPosition(x, y, dag, zoom, autoFit, panOffset) {
    var canvas = document.querySelector('canvas');
    if (!canvas)
        return null;
    var width = canvas.offsetWidth;
    var height = canvas.offsetHeight;
    var layout = calculateLayout(dag, width, height);
    var bounds = calculateBoundingBox(layout);
    // Calculate the same transformations applied during drawing
    var scale = zoom;
    var offsetX = 0;
    var offsetY = 0;
    if (autoFit && bounds) {
        var scaleX = (width - 2 * CANVAS_PADDING) / bounds.width;
        var scaleY = (height - 2 * CANVAS_PADDING) / bounds.height;
        scale = Math.min(scaleX, scaleY);
        var scaledWidth = bounds.width * scale;
        var scaledHeight = bounds.height * scale;
        offsetX = (width - scaledWidth) / 2 - bounds.minX * scale + panOffset.x;
        offsetY = (height - scaledHeight) / 2 - bounds.minY * scale + panOffset.y;
    }
    else {
        offsetX = panOffset.x;
        offsetY = panOffset.y;
    }
    // Transform mouse coordinates to graph space (inverse transformation)
    var graphX = (x - offsetX) / scale;
    var graphY = (y - offsetY) / scale;
    // Check if mouse is over any node (using rectangular bounds, not radius)
    for (var _i = 0, _a = layout.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], nodeId = _b[0], position = _b[1];
        var nodeLeft = position.x - NODE_WIDTH / 2;
        var nodeRight = position.x + NODE_WIDTH / 2;
        var nodeTop = position.y - NODE_HEIGHT / 2;
        var nodeBottom = position.y + NODE_HEIGHT / 2;
        if (graphX >= nodeLeft &&
            graphX <= nodeRight &&
            graphY >= nodeTop &&
            graphY <= nodeBottom) {
            return nodeId;
        }
    }
    return null;
}
/**
 * Render rich tooltip for node
 */
function renderNodeTooltip(node, state) {
    return (<div style={{
            background: '#fff',
            border: '2px solid #000',
            padding: '12px',
            borderRadius: '4px',
            maxWidth: '320px',
            fontSize: '13px',
            lineHeight: '1.5'
        }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
        {node.name || node.id}
      </div>

      <div style={{ marginBottom: '4px' }}>
        <strong>Type:</strong> {node.type}
      </div>

      {node.description && (<div style={{ marginBottom: '4px', fontStyle: 'italic', color: '#666' }}>
          {node.description}
        </div>)}

      {node.skillId && (<div style={{ marginBottom: '4px' }}>
          <strong>Skill:</strong> {node.skillId}
        </div>)}

      {node.agentId && (<div style={{ marginBottom: '4px' }}>
          <strong>Agent:</strong> {node.agentId}
        </div>)}

      {node.mcpTool && (<div style={{ marginBottom: '4px' }}>
          <strong>MCP Tool:</strong> {node.mcpTool.server}/{node.mcpTool.tool}
        </div>)}

      {node.dependencies.length > 0 && (<div style={{ marginBottom: '4px' }}>
          <strong>Dependencies:</strong> {node.dependencies.join(', ')}
        </div>)}

      {node.config && (<div style={{ marginBottom: '4px', fontSize: '12px', color: '#555' }}>
          <strong>Config:</strong>
          {node.config.model && " Model: ".concat(node.config.model, " |")}
          {" Timeout: ".concat(node.config.timeoutMs, "ms")}
          {node.config.maxRetries > 0 && " | Retries: ".concat(node.config.maxRetries)}
        </div>)}

      {state && (<div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #ddd',
                fontWeight: 'bold'
            }}>
          Status: <span style={{
                color: state.status === 'completed' ? '#4caf50' :
                    state.status === 'failed' ? '#f44336' :
                        state.status === 'running' ? '#2196f3' : '#666'
            }}>
            {state.status}
          </span>
          {state.status === 'running' && 'attempt' in state && (<span style={{ fontWeight: 'normal', fontSize: '12px' }}>
              {' '}(Attempt {state.attempt})
            </span>)}
          {state.status === 'completed' && 'durationMs' in state && (<span style={{ fontWeight: 'normal', fontSize: '12px' }}>
              {' '}in {state.durationMs}ms
            </span>)}
        </div>)}
    </div>);
}

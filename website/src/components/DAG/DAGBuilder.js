"use strict";
/**
 * DAGBuilder Component
 *
 * Visual interface for building DAG workflows by adding nodes and connections.
 * Provides a Win31-styled interface for creating execution graphs.
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
exports.DAGBuilder = DAGBuilder;
var react_1 = require("react");
var DAGGraph_1 = require("./DAGGraph");
var DAGBuilder_module_css_1 = require("./DAGBuilder.module.css");
var NODE_TYPES = [
    { type: 'skill', label: 'Skill Node', icon: '⚙️' },
    { type: 'agent', label: 'Agent Node', icon: '🤖' },
    { type: 'mcp-tool', label: 'MCP Tool', icon: '🔧' },
    { type: 'composite', label: 'Composite', icon: '📦' },
    { type: 'conditional', label: 'Conditional', icon: '🔀' },
];
var DEFAULT_CONFIG = {
    timeoutMs: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    exponentialBackoff: true,
};
function createEmptyDAG(name) {
    return {
        id: "dag-".concat(Date.now()),
        name: name,
        nodes: new Map(),
        edges: new Map(),
        config: {
            maxParallelism: 5,
            defaultTimeout: 30000,
            errorHandling: 'stop-on-failure',
        },
        inputs: [],
        outputs: [],
    };
}
function generateNodeId() {
    return "node-".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8));
}
function DAGBuilder(_a) {
    var _b;
    var initialDag = _a.initialDag, _c = _a.availableSkills, availableSkills = _c === void 0 ? [] : _c, onSave = _a.onSave, onExport = _a.onExport;
    var _d = (0, react_1.useState)(initialDag !== null && initialDag !== void 0 ? initialDag : createEmptyDAG('New Workflow')), dag = _d[0], setDag = _d[1];
    var _e = (0, react_1.useState)(null), selectedNodeId = _e[0], setSelectedNodeId = _e[1];
    var _f = (0, react_1.useState)(false), isAddingNode = _f[0], setIsAddingNode = _f[1];
    var _g = (0, react_1.useState)('skill'), newNodeType = _g[0], setNewNodeType = _g[1];
    var _h = (0, react_1.useState)(''), newNodeSkill = _h[0], setNewNodeSkill = _h[1];
    var _j = (0, react_1.useState)([]), newNodeDeps = _j[0], setNewNodeDeps = _j[1];
    var _k = (0, react_1.useState)(dag.name), dagName = _k[0], setDagName = _k[1];
    var _l = (0, react_1.useState)(false), showExportModal = _l[0], setShowExportModal = _l[1];
    // Get existing node IDs for dependency selection
    var existingNodeIds = (0, react_1.useMemo)(function () { return Array.from(dag.nodes.keys()).map(function (id) { return id; }); }, [dag.nodes]);
    // Add a new node
    var handleAddNode = (0, react_1.useCallback)(function () {
        var nodeId = generateNodeId();
        var newNode = {
            id: nodeId,
            type: newNodeType,
            skillId: newNodeType === 'skill' ? newNodeSkill : undefined,
            dependencies: newNodeDeps,
            inputMappings: [],
            state: { status: 'pending' },
            config: __assign({}, DEFAULT_CONFIG),
        };
        setDag(function (prev) {
            var _a;
            var newNodes = new Map(prev.nodes);
            newNodes.set(nodeId, newNode);
            // Update edges
            var newEdges = new Map(prev.edges);
            for (var _i = 0, newNodeDeps_1 = newNodeDeps; _i < newNodeDeps_1.length; _i++) {
                var depId = newNodeDeps_1[_i];
                var existing = (_a = newEdges.get(depId)) !== null && _a !== void 0 ? _a : [];
                newEdges.set(depId, __spreadArray(__spreadArray([], existing, true), [nodeId], false));
            }
            return __assign(__assign({}, prev), { nodes: newNodes, edges: newEdges });
        });
        // Reset form
        setIsAddingNode(false);
        setNewNodeSkill('');
        setNewNodeDeps([]);
    }, [newNodeType, newNodeSkill, newNodeDeps]);
    // Delete selected node
    var handleDeleteNode = (0, react_1.useCallback)(function () {
        if (!selectedNodeId)
            return;
        setDag(function (prev) {
            var newNodes = new Map(prev.nodes);
            newNodes.delete(selectedNodeId);
            // Remove from edges
            var newEdges = new Map();
            for (var _i = 0, _a = prev.edges; _i < _a.length; _i++) {
                var _b = _a[_i], fromId = _b[0], toIds = _b[1];
                if (fromId === selectedNodeId)
                    continue;
                var filtered = toIds.filter(function (id) { return id !== selectedNodeId; });
                if (filtered.length > 0) {
                    newEdges.set(fromId, filtered);
                }
            }
            // Remove from dependencies
            for (var _c = 0, _d = newNodes.values(); _c < _d.length; _c++) {
                var node = _d[_c];
                node.dependencies = node.dependencies.filter(function (dep) { return dep !== selectedNodeId; });
            }
            return __assign(__assign({}, prev), { nodes: newNodes, edges: newEdges });
        });
        setSelectedNodeId(null);
    }, [selectedNodeId]);
    // Update DAG name
    var handleNameChange = (0, react_1.useCallback)(function (e) {
        var name = e.target.value;
        setDagName(name);
        setDag(function (prev) { return (__assign(__assign({}, prev), { name: name })); });
    }, []);
    // Save DAG
    var handleSave = (0, react_1.useCallback)(function () {
        onSave === null || onSave === void 0 ? void 0 : onSave(dag);
    }, [dag, onSave]);
    // Export DAG
    var handleExport = (0, react_1.useCallback)(function (format) {
        onExport === null || onExport === void 0 ? void 0 : onExport(dag, format);
        setShowExportModal(false);
    }, [dag, onExport]);
    // Toggle dependency selection
    var toggleDependency = (0, react_1.useCallback)(function (nodeId) {
        setNewNodeDeps(function (prev) {
            return prev.includes(nodeId)
                ? prev.filter(function (id) { return id !== nodeId; })
                : __spreadArray(__spreadArray([], prev, true), [nodeId], false);
        });
    }, []);
    // Clear all nodes
    var handleClear = (0, react_1.useCallback)(function () {
        if (confirm('Are you sure you want to clear all nodes?')) {
            setDag(function (prev) { return (__assign(__assign({}, prev), { nodes: new Map(), edges: new Map() })); });
            setSelectedNodeId(null);
        }
    }, []);
    return (<div className={DAGBuilder_module_css_1.default.container}>
      {/* Toolbar */}
      <div className={DAGBuilder_module_css_1.default.toolbar}>
        <div className={DAGBuilder_module_css_1.default.toolbarSection}>
          <label className={DAGBuilder_module_css_1.default.nameLabel}>
            Workflow:
            <input type="text" value={dagName} onChange={handleNameChange} className={DAGBuilder_module_css_1.default.nameInput} placeholder="Workflow name"/>
          </label>
        </div>

        <div className={DAGBuilder_module_css_1.default.toolbarSection}>
          <button className={DAGBuilder_module_css_1.default.toolButton} onClick={function () { return setIsAddingNode(true); }} disabled={isAddingNode}>
            ➕ Add Node
          </button>
          <button className={DAGBuilder_module_css_1.default.toolButton} onClick={handleDeleteNode} disabled={!selectedNodeId}>
            🗑️ Delete
          </button>
          <button className={DAGBuilder_module_css_1.default.toolButton} onClick={handleClear} disabled={dag.nodes.size === 0}>
            🧹 Clear
          </button>
        </div>

        <div className={DAGBuilder_module_css_1.default.toolbarSection}>
          <button className={DAGBuilder_module_css_1.default.toolButton} onClick={handleSave} disabled={dag.nodes.size === 0}>
            💾 Save
          </button>
          <button className={DAGBuilder_module_css_1.default.toolButton} onClick={function () { return setShowExportModal(true); }} disabled={dag.nodes.size === 0}>
            📤 Export
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className={DAGBuilder_module_css_1.default.content}>
        {/* Graph visualization */}
        <div className={DAGBuilder_module_css_1.default.graphArea}>
          {dag.nodes.size > 0 ? (<DAGGraph_1.DAGGraph dag={dag} width={800} height={500} onNodeSelect={setSelectedNodeId} showDetails={true}/>) : (<div className={DAGBuilder_module_css_1.default.emptyState}>
              <div className={DAGBuilder_module_css_1.default.emptyIcon}>📊</div>
              <div className={DAGBuilder_module_css_1.default.emptyTitle}>No nodes yet</div>
              <div className={DAGBuilder_module_css_1.default.emptyText}>
                Click "Add Node" to start building your workflow
              </div>
            </div>)}
        </div>

        {/* Add Node Panel */}
        {isAddingNode && (<div className={DAGBuilder_module_css_1.default.sidePanel}>
            <div className={DAGBuilder_module_css_1.default.panelHeader}>
              <span>Add New Node</span>
              <button className={DAGBuilder_module_css_1.default.closeButton} onClick={function () { return setIsAddingNode(false); }}>
                ×
              </button>
            </div>

            <div className={DAGBuilder_module_css_1.default.panelContent}>
              {/* Node Type Selection */}
              <div className={DAGBuilder_module_css_1.default.formGroup}>
                <label className={DAGBuilder_module_css_1.default.formLabel}>Node Type:</label>
                <div className={DAGBuilder_module_css_1.default.nodeTypeGrid}>
                  {NODE_TYPES.map(function (_a) {
                var type = _a.type, label = _a.label, icon = _a.icon;
                return (<button key={type} className={"".concat(DAGBuilder_module_css_1.default.nodeTypeButton, " ").concat(newNodeType === type ? DAGBuilder_module_css_1.default.nodeTypeSelected : '')} onClick={function () { return setNewNodeType(type); }}>
                      <span className={DAGBuilder_module_css_1.default.nodeTypeIcon}>{icon}</span>
                      <span className={DAGBuilder_module_css_1.default.nodeTypeLabel}>{label}</span>
                    </button>);
            })}
                </div>
              </div>

              {/* Skill Selection (for skill nodes) */}
              {newNodeType === 'skill' && (<div className={DAGBuilder_module_css_1.default.formGroup}>
                  <label className={DAGBuilder_module_css_1.default.formLabel}>Skill:</label>
                  <select className={DAGBuilder_module_css_1.default.select} value={newNodeSkill} onChange={function (e) { return setNewNodeSkill(e.target.value); }}>
                    <option value="">Select a skill...</option>
                    {availableSkills.map(function (skill) { return (<option key={skill.id} value={skill.id}>
                        {skill.name} ({skill.category})
                      </option>); })}
                  </select>
                </div>)}

              {/* Dependencies */}
              {existingNodeIds.length > 0 && (<div className={DAGBuilder_module_css_1.default.formGroup}>
                  <label className={DAGBuilder_module_css_1.default.formLabel}>Dependencies:</label>
                  <div className={DAGBuilder_module_css_1.default.depsList}>
                    {existingNodeIds.map(function (nodeId) {
                    var node = dag.nodes.get(nodeId);
                    return (<label key={nodeId} className={DAGBuilder_module_css_1.default.depItem}>
                          <input type="checkbox" checked={newNodeDeps.includes(nodeId)} onChange={function () { return toggleDependency(nodeId); }}/>
                          <span>{(node === null || node === void 0 ? void 0 : node.skillId) || nodeId}</span>
                        </label>);
                })}
                  </div>
                </div>)}

              {/* Actions */}
              <div className={DAGBuilder_module_css_1.default.formActions}>
                <button className={DAGBuilder_module_css_1.default.primaryButton} onClick={handleAddNode} disabled={newNodeType === 'skill' && !newNodeSkill}>
                  Add Node
                </button>
                <button className={DAGBuilder_module_css_1.default.secondaryButton} onClick={function () { return setIsAddingNode(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>)}
      </div>

      {/* Export Modal */}
      {showExportModal && (<div className={DAGBuilder_module_css_1.default.modalOverlay}>
          <div className={DAGBuilder_module_css_1.default.modal}>
            <div className={DAGBuilder_module_css_1.default.modalHeader}>
              <span>Export Workflow</span>
              <button className={DAGBuilder_module_css_1.default.closeButton} onClick={function () { return setShowExportModal(false); }}>
                ×
              </button>
            </div>
            <div className={DAGBuilder_module_css_1.default.modalContent}>
              <p>Choose export format:</p>
              <div className={DAGBuilder_module_css_1.default.exportButtons}>
                <button className={DAGBuilder_module_css_1.default.exportButton} onClick={function () { return handleExport('json'); }}>
                  📄 Export as JSON
                </button>
                <button className={DAGBuilder_module_css_1.default.exportButton} onClick={function () { return handleExport('yaml'); }}>
                  📝 Export as YAML
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Status bar */}
      <div className={DAGBuilder_module_css_1.default.statusBar}>
        <span>Nodes: {dag.nodes.size}</span>
        <span>•</span>
        <span>
          Selected: {selectedNodeId ? ((_b = dag.nodes.get(selectedNodeId)) === null || _b === void 0 ? void 0 : _b.skillId) || selectedNodeId : 'None'}
        </span>
      </div>
    </div>);
}
exports.default = DAGBuilder;

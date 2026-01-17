"use strict";
/**
 * DAG Builder - Fluent DSL for constructing DAGs
 *
 * Provides a chainable API for building directed acyclic graphs
 * with nodes, edges, and configuration.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.DAGBuilderError = exports.DAGBuilder = exports.ConditionalNodeBuilder = exports.NodeBuilder = void 0;
exports.dag = dag;
exports.linearDag = linearDag;
exports.fanOutFanInDag = fanOutFanInDag;
var dag_1 = require("../types/dag");
var topology_1 = require("./topology");
/**
 * Builder for creating DAG nodes
 */
var NodeBuilder = /** @class */ (function () {
    function NodeBuilder(dagBuilder, id, type, name) {
        this.dagBuilder = dagBuilder;
        this.node = {
            id: id,
            name: name || id,
            type: type,
            dependencies: [],
            state: { status: 'pending' },
            config: __assign({}, dag_1.DEFAULT_TASK_CONFIG),
        };
    }
    /**
     * Set the node name
     */
    NodeBuilder.prototype.name = function (name) {
        this.node.name = name;
        return this;
    };
    /**
     * Set the description
     */
    NodeBuilder.prototype.description = function (description) {
        this.node.description = description;
        return this;
    };
    /**
     * Set the skill ID for this node
     */
    NodeBuilder.prototype.skill = function (skillId) {
        this.node.skillId = skillId;
        return this;
    };
    /**
     * Set the agent ID for this node
     */
    NodeBuilder.prototype.agent = function (agentId) {
        this.node.agentId = agentId;
        return this;
    };
    /**
     * Set the MCP tool for this node
     */
    NodeBuilder.prototype.mcp = function (server, tool) {
        this.node.mcpTool = { server: server, tool: tool };
        return this;
    };
    /**
     * Add dependencies (nodes that must complete before this one)
     */
    NodeBuilder.prototype.dependsOn = function () {
        var nodeIds = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodeIds[_i] = arguments[_i];
        }
        var deps = nodeIds.map(function (id) {
            return typeof id === 'string' ? (0, dag_1.NodeId)(id) : id;
        });
        this.node.dependencies = __spreadArray(__spreadArray([], (this.node.dependencies || []), true), deps, true);
        return this;
    };
    /**
     * Set the retry policy
     */
    NodeBuilder.prototype.retry = function (policy) {
        this.node.retryPolicy = policy;
        return this;
    };
    /**
     * Set retry with simple parameters
     */
    NodeBuilder.prototype.retryTimes = function (maxAttempts, baseDelayMs) {
        if (baseDelayMs === void 0) { baseDelayMs = 1000; }
        this.node.retryPolicy = {
            maxAttempts: maxAttempts,
            baseDelayMs: baseDelayMs,
            maxDelayMs: baseDelayMs * 10,
            backoffMultiplier: 2,
            retryableErrors: ['TIMEOUT', 'RATE_LIMITED', 'MODEL_ERROR'],
            nonRetryableErrors: ['PERMISSION_DENIED', 'INVALID_INPUT'],
        };
        return this;
    };
    /**
     * Set task configuration
     */
    NodeBuilder.prototype.config = function (config) {
        this.node.config = __assign(__assign({}, this.node.config), config);
        return this;
    };
    /**
     * Set timeout for this node
     */
    NodeBuilder.prototype.timeout = function (ms) {
        if (this.node.config) {
            this.node.config.timeoutMs = ms;
        }
        return this;
    };
    /**
     * Set the model for this node
     */
    NodeBuilder.prototype.model = function (model) {
        if (this.node.config) {
            this.node.config.model = model;
        }
        return this;
    };
    /**
     * Set max retries
     */
    NodeBuilder.prototype.maxRetries = function (retries) {
        if (this.node.config) {
            this.node.config.maxRetries = retries;
        }
        return this;
    };
    /**
     * Set max tokens for this node
     */
    NodeBuilder.prototype.maxTokens = function (tokens) {
        if (this.node.config) {
            this.node.config.maxTokens = tokens;
        }
        return this;
    };
    /**
     * Set the prompt in metadata
     */
    NodeBuilder.prototype.prompt = function (prompt) {
        if (this.node.config) {
            this.node.config.metadata = __assign(__assign({}, (this.node.config.metadata || {})), { prompt: prompt });
        }
        return this;
    };
    /**
     * Set output schema for validation
     */
    NodeBuilder.prototype.outputSchema = function (schema) {
        this.node.outputSchema = schema;
        return this;
    };
    /**
     * Set priority for scheduling
     */
    NodeBuilder.prototype.priority = function (priority) {
        this.node.priority = priority;
        return this;
    };
    /**
     * Add tags for categorization
     */
    NodeBuilder.prototype.tags = function () {
        var tags = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tags[_i] = arguments[_i];
        }
        this.node.tags = __spreadArray(__spreadArray([], (this.node.tags || []), true), tags, true);
        return this;
    };
    /**
     * Set metadata for this node
     */
    NodeBuilder.prototype.metadata = function (data) {
        if (this.node.config) {
            this.node.config.metadata = __assign(__assign({}, this.node.config.metadata), data);
        }
        return this;
    };
    /**
     * Finish building this node and return to DAG builder
     */
    NodeBuilder.prototype.done = function () {
        this.dagBuilder.addBuiltNode(this.node);
        return this.dagBuilder;
    };
    /**
     * Build and return the node (for inline usage)
     */
    NodeBuilder.prototype.build = function () {
        return this.node;
    };
    return NodeBuilder;
}());
exports.NodeBuilder = NodeBuilder;
/**
 * Builder for conditional nodes
 */
var ConditionalNodeBuilder = /** @class */ (function (_super) {
    __extends(ConditionalNodeBuilder, _super);
    function ConditionalNodeBuilder(dagBuilder, id) {
        var _this = _super.call(this, dagBuilder, id, 'conditional') || this;
        _this.thenBranch = [];
        _this.elseBranch = [];
        return _this;
    }
    /**
     * Set the condition expression
     */
    ConditionalNodeBuilder.prototype.when = function (expression) {
        this.metadata({ conditionExpression: expression });
        return this;
    };
    /**
     * Set nodes to execute if condition is true
     */
    ConditionalNodeBuilder.prototype.then = function () {
        var nodeIds = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodeIds[_i] = arguments[_i];
        }
        this.thenBranch = nodeIds.map(function (id) {
            return typeof id === 'string' ? (0, dag_1.NodeId)(id) : id;
        });
        this.metadata({ thenBranch: this.thenBranch });
        return this;
    };
    /**
     * Set nodes to execute if condition is false
     */
    ConditionalNodeBuilder.prototype.else = function () {
        var nodeIds = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodeIds[_i] = arguments[_i];
        }
        this.elseBranch = nodeIds.map(function (id) {
            return typeof id === 'string' ? (0, dag_1.NodeId)(id) : id;
        });
        this.metadata({ elseBranch: this.elseBranch });
        return this;
    };
    return ConditionalNodeBuilder;
}(NodeBuilder));
exports.ConditionalNodeBuilder = ConditionalNodeBuilder;
/**
 * Main DAG Builder with fluent API
 */
var DAGBuilder = /** @class */ (function () {
    function DAGBuilder(name) {
        this.nodes = new Map();
        this.adjacencyList = new Map();
        this.dag = {
            id: (0, dag_1.DAGId)(this.generateId()),
            name: name || 'Untitled DAG',
            version: '1.0.0',
            config: __assign({}, dag_1.DEFAULT_DAG_CONFIG),
            inputs: [],
            outputs: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    /**
     * Create a new DAG builder
     */
    DAGBuilder.create = function (name) {
        return new DAGBuilder(name);
    };
    /**
     * Set the DAG name
     */
    DAGBuilder.prototype.name = function (name) {
        this.dag.name = name;
        return this;
    };
    /**
     * Set the DAG version
     */
    DAGBuilder.prototype.version = function (version) {
        this.dag.version = version;
        return this;
    };
    /**
     * Set DAG description
     */
    DAGBuilder.prototype.description = function (description) {
        this.dag.description = description;
        return this;
    };
    /**
     * Set the author
     */
    DAGBuilder.prototype.author = function (author) {
        this.dag.author = author;
        return this;
    };
    /**
     * Configure the DAG
     */
    DAGBuilder.prototype.config = function (config) {
        this.dag.config = __assign(__assign({}, this.dag.config), config);
        return this;
    };
    /**
     * Set max parallel nodes
     */
    DAGBuilder.prototype.maxParallel = function (n) {
        if (this.dag.config) {
            this.dag.config.maxParallelism = n;
        }
        return this;
    };
    /**
     * Set global timeout
     */
    DAGBuilder.prototype.timeout = function (ms) {
        if (this.dag.config) {
            this.dag.config.maxExecutionTimeMs = ms;
        }
        return this;
    };
    /**
     * Enable/disable fail fast
     */
    DAGBuilder.prototype.failFast = function (enabled) {
        if (this.dag.config) {
            this.dag.config.failFast = enabled;
        }
        return this;
    };
    /**
     * Set execution mode
     */
    DAGBuilder.prototype.executionMode = function (mode) {
        if (this.dag.config) {
            this.dag.config.executionMode = mode;
        }
        return this;
    };
    /**
     * Add tags
     */
    DAGBuilder.prototype.tags = function () {
        var tags = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tags[_i] = arguments[_i];
        }
        this.dag.tags = __spreadArray(__spreadArray([], (this.dag.tags || []), true), tags, true);
        return this;
    };
    /**
     * Add a skill node
     */
    DAGBuilder.prototype.skillNode = function (id, skillId) {
        var nodeId = (0, dag_1.NodeId)(id);
        var builder = new NodeBuilder(this, nodeId, 'skill', id);
        builder.skill(skillId);
        return builder;
    };
    /**
     * Add an agent node
     */
    DAGBuilder.prototype.agentNode = function (id, agentId) {
        var nodeId = (0, dag_1.NodeId)(id);
        var builder = new NodeBuilder(this, nodeId, 'agent', id);
        if (agentId) {
            builder.agent(agentId);
        }
        return builder;
    };
    /**
     * Add an MCP tool node
     */
    DAGBuilder.prototype.mcpNode = function (id, server, tool) {
        var nodeId = (0, dag_1.NodeId)(id);
        var builder = new NodeBuilder(this, nodeId, 'mcp-tool', id);
        builder.mcp(server, tool);
        return builder;
    };
    /**
     * Add a composite node (sub-DAG)
     */
    DAGBuilder.prototype.compositeNode = function (id, subDag) {
        var nodeId = (0, dag_1.NodeId)(id);
        var builder = new NodeBuilder(this, nodeId, 'composite', id);
        builder.metadata({ subDagId: subDag.id });
        return builder;
    };
    /**
     * Add a conditional node
     */
    DAGBuilder.prototype.conditionalNode = function (id) {
        var nodeId = (0, dag_1.NodeId)(id);
        return new ConditionalNodeBuilder(this, nodeId);
    };
    /**
     * Add a simple node with minimal configuration
     */
    DAGBuilder.prototype.node = function (id, type) {
        if (type === void 0) { type = 'skill'; }
        var nodeId = (0, dag_1.NodeId)(id);
        return new NodeBuilder(this, nodeId, type, id);
    };
    /**
     * Add a pre-built node
     */
    DAGBuilder.prototype.addNode = function (node) {
        this.nodes.set(node.id, node);
        if (!this.adjacencyList.has(node.id)) {
            this.adjacencyList.set(node.id, []);
        }
        return this;
    };
    /**
     * Internal method for NodeBuilder to add nodes
     */
    DAGBuilder.prototype.addBuiltNode = function (node) {
        this.nodes.set(node.id, node);
        if (!this.adjacencyList.has(node.id)) {
            this.adjacencyList.set(node.id, []);
        }
        // Add edges from dependencies
        for (var _i = 0, _a = node.dependencies; _i < _a.length; _i++) {
            var dep = _a[_i];
            var existing = this.adjacencyList.get(dep) || [];
            if (!existing.includes(node.id)) {
                this.adjacencyList.set(dep, __spreadArray(__spreadArray([], existing, true), [node.id], false));
            }
        }
    };
    /**
     * Add an edge between nodes
     */
    DAGBuilder.prototype.edge = function (from, to) {
        var fromId = (0, dag_1.NodeId)(from);
        var toId = (0, dag_1.NodeId)(to);
        var existing = this.adjacencyList.get(fromId) || [];
        if (!existing.includes(toId)) {
            this.adjacencyList.set(fromId, __spreadArray(__spreadArray([], existing, true), [toId], false));
        }
        // Also update dependencies
        var toNode = this.nodes.get(toId);
        if (toNode && !toNode.dependencies.includes(fromId)) {
            toNode.dependencies.push(fromId);
        }
        return this;
    };
    /**
     * Add multiple edges at once
     */
    DAGBuilder.prototype.edges = function (edgeList) {
        for (var _i = 0, edgeList_1 = edgeList; _i < edgeList_1.length; _i++) {
            var _a = edgeList_1[_i], from = _a[0], to = _a[1];
            this.edge(from, to);
        }
        return this;
    };
    /**
     * Create a linear chain of nodes
     */
    DAGBuilder.prototype.chain = function () {
        var nodeIds = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodeIds[_i] = arguments[_i];
        }
        for (var i = 0; i < nodeIds.length - 1; i++) {
            this.edge(nodeIds[i], nodeIds[i + 1]);
        }
        return this;
    };
    /**
     * Fan out from one node to many
     */
    DAGBuilder.prototype.fanOut = function (from) {
        var to = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            to[_i - 1] = arguments[_i];
        }
        for (var _a = 0, to_1 = to; _a < to_1.length; _a++) {
            var target = to_1[_a];
            this.edge(from, target);
        }
        return this;
    };
    /**
     * Fan in from many nodes to one
     */
    DAGBuilder.prototype.fanIn = function (to) {
        var from = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            from[_i - 1] = arguments[_i];
        }
        for (var _a = 0, from_1 = from; _a < from_1.length; _a++) {
            var source = from_1[_a];
            this.edge(source, to);
        }
        return this;
    };
    /**
     * Define DAG inputs
     */
    DAGBuilder.prototype.input = function (input) {
        this.dag.inputs = __spreadArray(__spreadArray([], (this.dag.inputs || []), true), [input], false);
        return this;
    };
    /**
     * Define DAG inputs with simple parameters
     */
    DAGBuilder.prototype.inputs = function () {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
            var name_1 = names_1[_a];
            this.dag.inputs = __spreadArray(__spreadArray([], (this.dag.inputs || []), true), [
                { name: name_1, required: true },
            ], false);
        }
        return this;
    };
    /**
     * Define DAG outputs
     */
    DAGBuilder.prototype.output = function (output) {
        this.dag.outputs = __spreadArray(__spreadArray([], (this.dag.outputs || []), true), [output], false);
        return this;
    };
    /**
     * Define DAG outputs with simple parameters
     */
    DAGBuilder.prototype.outputs = function () {
        var specs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            specs[_i] = arguments[_i];
        }
        for (var _a = 0, specs_1 = specs; _a < specs_1.length; _a++) {
            var spec = specs_1[_a];
            this.dag.outputs = __spreadArray(__spreadArray([], (this.dag.outputs || []), true), [
                { name: spec.name, sourceNodeId: (0, dag_1.NodeId)(spec.from) },
            ], false);
        }
        return this;
    };
    /**
     * Validate the DAG structure
     */
    DAGBuilder.prototype.validate = function () {
        var _a;
        var errors = [];
        var warnings = [];
        // Check for empty DAG
        if (this.nodes.size === 0) {
            errors.push('DAG has no nodes');
        }
        // Build temporary DAG for validation
        var tempDag = this.buildUnsafe();
        // Check for cycles using the topology module
        if (!(0, topology_1.isAcyclic)(tempDag)) {
            var cycle = (0, topology_1.getCycle)(tempDag);
            errors.push("Cycle detected: ".concat(cycle.map(function (id) { return id; }).join(' -> ')));
        }
        // Check for missing dependencies
        for (var _i = 0, _b = this.nodes; _i < _b.length; _i++) {
            var _c = _b[_i], nodeIdKey = _c[0], node = _c[1];
            for (var _d = 0, _e = node.dependencies; _d < _e.length; _d++) {
                var dep = _e[_d];
                if (!this.nodes.has(dep)) {
                    errors.push("Node \"".concat(nodeIdKey, "\" depends on non-existent node \"").concat(dep, "\""));
                }
            }
        }
        // Check for orphan nodes (no incoming or outgoing edges)
        if (this.nodes.size > 1) {
            var _loop_1 = function (nodeIdKey) {
                var hasIncoming = Array.from(this_1.adjacencyList.values()).some(function (targets) {
                    return targets.includes(nodeIdKey);
                });
                var hasOutgoing = (this_1.adjacencyList.get(nodeIdKey) || []).length > 0;
                var hasDependencies = (((_a = this_1.nodes.get(nodeIdKey)) === null || _a === void 0 ? void 0 : _a.dependencies) || []).length > 0;
                if (!hasIncoming && !hasOutgoing && !hasDependencies) {
                    warnings.push("Node \"".concat(nodeIdKey, "\" is disconnected from the graph"));
                }
            };
            var this_1 = this;
            for (var _f = 0, _g = this.nodes; _f < _g.length; _f++) {
                var nodeIdKey = _g[_f][0];
                _loop_1(nodeIdKey);
            }
        }
        // Check for skill nodes without skill IDs
        for (var _h = 0, _j = this.nodes; _h < _j.length; _h++) {
            var _k = _j[_h], nodeIdKey = _k[0], node = _k[1];
            if (node.type === 'skill' && !node.skillId) {
                warnings.push("Skill node \"".concat(nodeIdKey, "\" has no skillId set"));
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
        };
    };
    /**
     * Build and return the DAG
     */
    DAGBuilder.prototype.build = function () {
        var validation = this.validate();
        if (!validation.valid) {
            throw new DAGBuilderError("Invalid DAG: ".concat(validation.errors.join('; ')), validation);
        }
        // Log warnings
        if (validation.warnings.length > 0) {
            console.warn('DAG warnings:', validation.warnings);
        }
        return this.buildUnsafe();
    };
    /**
     * Build without validation (use with caution)
     */
    DAGBuilder.prototype.buildUnsafe = function () {
        return {
            id: this.dag.id,
            name: this.dag.name,
            version: this.dag.version,
            description: this.dag.description,
            nodes: this.nodes,
            edges: this.adjacencyList,
            config: this.dag.config,
            inputs: this.dag.inputs || [],
            outputs: this.dag.outputs || [],
            tags: this.dag.tags,
            createdAt: this.dag.createdAt,
            updatedAt: new Date(),
            author: this.dag.author,
        };
    };
    /**
     * Get execution order (topological sort)
     */
    DAGBuilder.prototype.getExecutionOrder = function () {
        var tempDag = this.buildUnsafe();
        var result = (0, topology_1.topologicalSort)(tempDag);
        if (!result.success) {
            throw new DAGBuilderError("Cannot determine execution order: cycle detected", { cycle: result.cycle });
        }
        return result.order;
    };
    /**
     * Clone this builder
     */
    DAGBuilder.prototype.clone = function () {
        var cloned = new DAGBuilder(this.dag.name);
        cloned.dag = __assign(__assign({}, this.dag), { id: (0, dag_1.DAGId)(this.generateId()), createdAt: new Date(), updatedAt: new Date() });
        cloned.nodes = new Map(this.nodes);
        cloned.adjacencyList = new Map(this.adjacencyList);
        return cloned;
    };
    /**
     * Merge another DAG into this one
     */
    DAGBuilder.prototype.merge = function (other, prefix) {
        var p = prefix ? "".concat(prefix, "_") : '';
        for (var _i = 0, _a = other.nodes; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], node = _b[1];
            var newId = (0, dag_1.NodeId)("".concat(p).concat(id));
            var newNode = __assign(__assign({}, node), { id: newId, name: "".concat(p).concat(node.name), dependencies: node.dependencies.map(function (d) { return (0, dag_1.NodeId)("".concat(p).concat(d)); }) });
            this.nodes.set(newId, newNode);
        }
        for (var _c = 0, _d = other.edges; _c < _d.length; _c++) {
            var _e = _d[_c], from = _e[0], tos = _e[1];
            var newFrom = (0, dag_1.NodeId)("".concat(p).concat(from));
            var newTos = tos.map(function (t) { return (0, dag_1.NodeId)("".concat(p).concat(t)); });
            this.adjacencyList.set(newFrom, newTos);
        }
        return this;
    };
    DAGBuilder.prototype.generateId = function () {
        return "dag-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    };
    return DAGBuilder;
}());
exports.DAGBuilder = DAGBuilder;
/**
 * Error thrown by DAG builder
 */
var DAGBuilderError = /** @class */ (function (_super) {
    __extends(DAGBuilderError, _super);
    function DAGBuilderError(message, details) {
        var _this = _super.call(this, message) || this;
        _this.details = details;
        _this.name = 'DAGBuilderError';
        return _this;
    }
    return DAGBuilderError;
}(Error));
exports.DAGBuilderError = DAGBuilderError;
/**
 * Convenience function to create a new DAG builder
 */
function dag(name) {
    return DAGBuilder.create(name);
}
/**
 * Create a simple linear DAG from skill IDs
 */
function linearDag(name) {
    var skillIds = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        skillIds[_i - 1] = arguments[_i];
    }
    var builder = dag(name);
    for (var i = 0; i < skillIds.length; i++) {
        var nodeId = "node-".concat(i);
        var nodeBuilder = builder.skillNode(nodeId, skillIds[i]);
        if (i > 0) {
            nodeBuilder.dependsOn("node-".concat(i - 1));
        }
        nodeBuilder.done();
    }
    return builder.build();
}
/**
 * Create a fan-out/fan-in DAG
 */
function fanOutFanInDag(name, startSkill, parallelSkills, endSkill) {
    var builder = dag(name);
    // Start node
    builder.skillNode('start', startSkill).done();
    // Parallel nodes
    for (var i = 0; i < parallelSkills.length; i++) {
        builder
            .skillNode("parallel-".concat(i), parallelSkills[i])
            .dependsOn('start')
            .done();
    }
    // End node
    var endBuilder = builder.skillNode('end', endSkill);
    for (var i = 0; i < parallelSkills.length; i++) {
        endBuilder.dependsOn("parallel-".concat(i));
    }
    endBuilder.done();
    return builder.build();
}

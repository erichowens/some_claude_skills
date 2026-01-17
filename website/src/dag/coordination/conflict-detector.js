"use strict";
/**
 * Conflict Detector
 *
 * Analyzes DAG nodes to detect file conflicts and singleton task violations
 * that would prevent safe parallel execution.
 */
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
exports.ConflictDetector = void 0;
var singleton_task_coordinator_1 = require("./singleton-task-coordinator");
/**
 * ConflictDetector - Analyzes nodes for execution conflicts
 */
var ConflictDetector = /** @class */ (function () {
    function ConflictDetector() {
    }
    /**
     * Analyze a wave of nodes for conflicts
     *
     * @param dag The DAG containing the nodes
     * @param nodeIds Node IDs in this wave
     * @param subtaskMap Optional map of node IDs to subtasks with predictedFiles
     */
    ConflictDetector.analyzeWave = function (dag, nodeIds, subtaskMap) {
        // Single node waves can always be parallelized
        if (nodeIds.length <= 1) {
            return {
                canParallelize: false, // Not parallel (only one task)
                conflicts: [],
            };
        }
        var conflicts = [];
        // Check for singleton task conflicts
        var singletonConflicts = this.detectSingletonConflicts(dag, nodeIds, subtaskMap);
        conflicts.push.apply(conflicts, singletonConflicts);
        // Check for file conflicts
        var fileConflicts = this.detectFileConflicts(dag, nodeIds, subtaskMap);
        conflicts.push.apply(conflicts, fileConflicts);
        var canParallelize = conflicts.length === 0;
        var remediation = canParallelize ? undefined : this.suggestRemediation(conflicts);
        return {
            canParallelize: canParallelize,
            conflicts: conflicts,
            remediation: remediation,
        };
    };
    /**
     * Detect singleton task conflicts
     */
    ConflictDetector.detectSingletonConflicts = function (dag, nodeIds, subtaskMap) {
        var conflicts = [];
        var singletonNodes = [];
        for (var _i = 0, nodeIds_1 = nodeIds; _i < nodeIds_1.length; _i++) {
            var nodeId = nodeIds_1[_i];
            var node = dag.nodes.get(nodeId);
            if (!node)
                continue;
            // Check if subtask has explicit singleton type
            var subtask = subtaskMap === null || subtaskMap === void 0 ? void 0 : subtaskMap.get(nodeId);
            var singletonType = (subtask === null || subtask === void 0 ? void 0 : subtask.singletonType) || null;
            if (singletonType) {
                singletonNodes.push({ nodeId: nodeId, type: singletonType });
            }
            else {
                // Fallback: detect from node description
                var detected = singleton_task_coordinator_1.SingletonTaskCoordinator.detectSingletonTask(node.prompt || node.id.toString());
                if (detected) {
                    singletonNodes.push({ nodeId: nodeId, type: detected });
                }
            }
        }
        // If multiple singleton tasks of the same type, conflict
        var typeGroups = new Map();
        for (var _a = 0, singletonNodes_1 = singletonNodes; _a < singletonNodes_1.length; _a++) {
            var _b = singletonNodes_1[_a], nodeId = _b.nodeId, type = _b.type;
            var existing = typeGroups.get(type) || [];
            existing.push(nodeId);
            typeGroups.set(type, existing);
        }
        for (var _c = 0, _d = typeGroups.entries(); _c < _d.length; _c++) {
            var _e = _d[_c], type = _e[0], nodes = _e[1];
            if (nodes.length > 1) {
                conflicts.push({
                    type: 'singleton',
                    nodeIds: nodes,
                    singletonType: type,
                    description: "Multiple ".concat(type, " tasks cannot run in parallel: ").concat(nodes.join(', ')),
                });
            }
        }
        // If ANY singleton task exists in a wave with other tasks, conflict
        if (singletonNodes.length > 0 && nodeIds.length > singletonNodes.length) {
            var singletonNodeIds_1 = singletonNodes.map(function (s) { return s.nodeId; });
            var regularNodeIds = nodeIds.filter(function (id) { return !singletonNodeIds_1.includes(id); });
            conflicts.push({
                type: 'singleton',
                nodeIds: __spreadArray(__spreadArray([], singletonNodeIds_1, true), regularNodeIds, true),
                description: "Singleton tasks (".concat(singletonNodeIds_1.join(', '), ") must run alone, not with ").concat(regularNodeIds.join(', ')),
            });
        }
        return conflicts;
    };
    /**
     * Detect file conflicts between nodes
     */
    ConflictDetector.detectFileConflicts = function (dag, nodeIds, subtaskMap) {
        var conflicts = [];
        // Build file map: filePath -> nodeIds that modify it
        var fileMap = new Map();
        for (var _i = 0, nodeIds_2 = nodeIds; _i < nodeIds_2.length; _i++) {
            var nodeId = nodeIds_2[_i];
            var subtask = subtaskMap === null || subtaskMap === void 0 ? void 0 : subtaskMap.get(nodeId);
            if (!(subtask === null || subtask === void 0 ? void 0 : subtask.predictedFiles) || subtask.predictedFiles.length === 0) {
                continue;
            }
            for (var _a = 0, _b = subtask.predictedFiles; _a < _b.length; _a++) {
                var filePath = _b[_a];
                var normalized = this.normalizePath(filePath);
                var existing = fileMap.get(normalized) || [];
                existing.push(nodeId);
                fileMap.set(normalized, existing);
            }
        }
        // Find files modified by multiple nodes
        for (var _c = 0, _d = fileMap.entries(); _c < _d.length; _c++) {
            var _e = _d[_c], filePath = _e[0], nodes = _e[1];
            if (nodes.length > 1) {
                conflicts.push({
                    type: 'file',
                    nodeIds: nodes,
                    filePath: filePath,
                    description: "File ".concat(filePath, " modified by multiple tasks: ").concat(nodes.join(', ')),
                });
            }
        }
        return conflicts;
    };
    /**
     * Suggest remediation for conflicts
     */
    ConflictDetector.suggestRemediation = function (conflicts) {
        var suggestions = [];
        var fileConflicts = conflicts.filter(function (c) { return c.type === 'file'; });
        var singletonConflicts = conflicts.filter(function (c) { return c.type === 'singleton'; });
        if (fileConflicts.length > 0) {
            suggestions.push("File conflicts detected: ".concat(fileConflicts.length, " file(s) modified by multiple tasks."));
            suggestions.push('Solution: Add dependencies to make these tasks sequential, or decompose differently to avoid file overlap.');
        }
        if (singletonConflicts.length > 0) {
            suggestions.push("Singleton task conflicts detected: ".concat(singletonConflicts.length, " singleton operation(s) in wave."));
            suggestions.push('Solution: Singleton tasks (build, lint, test) must run alone. Move to separate wave.');
        }
        return suggestions.join(' ');
    };
    /**
     * Normalize file path for consistent comparison
     */
    ConflictDetector.normalizePath = function (filePath) {
        return filePath.replace(/\\/g, '/').toLowerCase().trim();
    };
    /**
     * Check if two file paths could conflict (handles wildcards)
     */
    ConflictDetector.pathsConflict = function (path1, path2) {
        var norm1 = this.normalizePath(path1);
        var norm2 = this.normalizePath(path2);
        // Exact match
        if (norm1 === norm2) {
            return true;
        }
        // Wildcard matching (basic support)
        if (norm1.includes('*') || norm2.includes('*')) {
            var pattern1 = new RegExp('^' + norm1.replace(/\*/g, '.*') + '$');
            var pattern2 = new RegExp('^' + norm2.replace(/\*/g, '.*') + '$');
            if (pattern1.test(norm2) || pattern2.test(norm1)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Find all conflicts in a DAG
     *
     * This scans all nodes for potential conflicts, useful for validation.
     */
    ConflictDetector.findAllConflicts = function (dag, subtaskMap) {
        var conflictMap = new Map();
        // Get all nodes
        var allNodeIds = Array.from(dag.nodes.keys());
        // Check each pair of nodes
        for (var i = 0; i < allNodeIds.length; i++) {
            for (var j = i + 1; j < allNodeIds.length; j++) {
                var nodeId1 = allNodeIds[i];
                var nodeId2 = allNodeIds[j];
                var analysis = this.analyzeWave(dag, [nodeId1, nodeId2], subtaskMap);
                if (analysis.conflicts.length > 0) {
                    for (var _i = 0, _a = analysis.conflicts; _i < _a.length; _i++) {
                        var conflict = _a[_i];
                        for (var _b = 0, _c = conflict.nodeIds; _b < _c.length; _b++) {
                            var nodeId = _c[_b];
                            var existing = conflictMap.get(nodeId) || [];
                            existing.push(conflict);
                            conflictMap.set(nodeId, existing);
                        }
                    }
                }
            }
        }
        return conflictMap;
    };
    return ConflictDetector;
}());
exports.ConflictDetector = ConflictDetector;

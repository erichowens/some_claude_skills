#!/usr/bin/env npx tsx
"use strict";
/**
 * DAG Execution Plan Visualizer
 *
 * Creates a beautiful ASCII visualization of a DAG execution plan:
 * - DAG structure (nodes, edges, dependencies)
 * - Wave-based execution plan
 * - Conflict detection (file locks, singleton tasks)
 * - Skill matches with confidence scores
 * - Execution time estimation
 * - Parallelization opportunities
 *
 * Usage:
 *   npx tsx scripts/visualize-dag.ts "<your task description>"
 *
 * Or use a predefined example:
 *   npx tsx scripts/visualize-dag.ts --example saas
 *
 * Requires:
 *   - ANTHROPIC_API_KEY (for task decomposition)
 *   - OPENAI_API_KEY (for semantic/hybrid matching)
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
var dag_1 = require("../src/dag");
var claude_code_cli_1 = require("../src/dag/runtimes/claude-code-cli");
var presets_1 = require("../src/dag/permissions/presets");
var conflict_detector_1 = require("../src/dag/coordination/conflict-detector");
var singleton_task_coordinator_1 = require("../src/dag/coordination/singleton-task-coordinator");
var dotenv = require("dotenv");
var path = require("path");
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
// Example tasks
var EXAMPLES = {
    saas: 'Build a modern SaaS application with user authentication, PostgreSQL database, REST API, React frontend, and CI/CD pipeline',
    blog: 'Create a personal blog with markdown support, syntax highlighting, dark mode, and SEO optimization',
    analytics: 'Build a real-time analytics dashboard with data visualization, user tracking, and export functionality',
    ecommerce: 'Develop an e-commerce platform with product catalog, shopping cart, payment integration, and order management',
};
/**
 * Color codes for terminal output
 */
var colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
};
function colorize(text, color) {
    return "".concat(colors[color]).concat(text).concat(colors.reset);
}
function renderBox(title, content, width) {
    if (width === void 0) { width = 80; }
    var top = '┌─ ' + title + ' ' + '─'.repeat(width - title.length - 4) + '┐';
    var bottom = '└' + '─'.repeat(width - 2) + '┘';
    var lines = [top];
    for (var _i = 0, content_1 = content; _i < content_1.length; _i++) {
        var line = content_1[_i];
        var padding = ' '.repeat(Math.max(0, width - line.length - 4));
        lines.push("\u2502 ".concat(line).concat(padding, " \u2502"));
    }
    lines.push(bottom);
    return lines.join('\n');
}
function renderWave(waveNumber, totalWaves, nodeIds, parallelizable, taskCalls, dag, skills) {
    var lines = [];
    var header = "Wave ".concat(waveNumber + 1, "/").concat(totalWaves, " ").concat(parallelizable ? colorize('(PARALLEL)', 'green') : colorize('(SEQUENTIAL)', 'yellow'));
    lines.push(colorize(header, 'bold'));
    lines.push(colorize('─'.repeat(60), 'dim'));
    var _loop_1 = function (nodeId) {
        var node = dag.nodes.get(nodeId);
        var taskCall = taskCalls[nodeId];
        var skill = skills.find(function (s) { return s.id === (node === null || node === void 0 ? void 0 : node.skillId); });
        lines.push('');
        lines.push(colorize("  ".concat(nodeId), 'cyan'));
        if (skill) {
            lines.push("    Skill: ".concat(skill.name));
            lines.push("    Agent: ".concat(taskCall.subagent_type, " (").concat(taskCall.model, ")"));
        }
        else {
            lines.push("    Agent: ".concat(taskCall.subagent_type, " (").concat(taskCall.model, ")"));
        }
        if ((node === null || node === void 0 ? void 0 : node.dependencies) && node.dependencies.length > 0) {
            lines.push(colorize("    Depends on: ".concat(node.dependencies.join(', ')), 'dim'));
        }
    };
    for (var _i = 0, nodeIds_1 = nodeIds; _i < nodeIds_1.length; _i++) {
        var nodeId = nodeIds_1[_i];
        _loop_1(nodeId);
    }
    return lines.join('\n');
}
function renderDependencyGraph(dag) {
    var _a;
    var lines = [];
    lines.push(colorize('DAG Dependency Graph:', 'bold'));
    lines.push(colorize('─'.repeat(60), 'dim'));
    lines.push('');
    // Build adjacency list
    var adjacency = new Map();
    for (var _i = 0, _b = dag.edges; _i < _b.length; _i++) {
        var _c = _b[_i], from = _c[0], tos = _c[1];
        if (!adjacency.has(from)) {
            adjacency.set(from, []);
        }
        (_a = adjacency.get(from)).push.apply(_a, tos);
    }
    // Render each node with its children
    for (var _d = 0, _e = dag.nodes; _d < _e.length; _d++) {
        var _f = _e[_d], nodeId = _f[0], node = _f[1];
        var children = adjacency.get(nodeId) || [];
        lines.push(colorize("  ".concat(nodeId), 'cyan'));
        if (children.length > 0) {
            for (var i = 0; i < children.length; i++) {
                var isLast = i === children.length - 1;
                var prefix = isLast ? '    └─→ ' : '    ├─→ ';
                lines.push(colorize(prefix + children[i], 'dim'));
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, task, _i, _a, _b, name_1, description, exampleName, anthropicKey, openaiKey, skills, decomposer, startDecompose, _c, decomposition, matches, dag, decomposeTime, runtime, plan, _loop_2, _d, matches_1, match, singletonCoordinator, _e, _f, wave, analysis, _g, _h, conflict, totalNodes, parallelWaves, sequentialWaves, maxParallelism, sequentialTime, parallelTime, speedup;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    args = process.argv.slice(2);
                    if (args.length === 0) {
                        console.error(colorize('Usage:', 'red'));
                        console.error('  npx tsx scripts/visualize-dag.ts "<task description>"');
                        console.error('  npx tsx scripts/visualize-dag.ts --example <name>');
                        console.error('');
                        console.error('Examples:');
                        for (_i = 0, _a = Object.entries(EXAMPLES); _i < _a.length; _i++) {
                            _b = _a[_i], name_1 = _b[0], description = _b[1];
                            console.error("  ".concat(name_1, ": ").concat(description));
                        }
                        process.exit(1);
                    }
                    if (args[0] === '--example') {
                        exampleName = args[1];
                        if (!EXAMPLES[exampleName]) {
                            console.error(colorize("Unknown example: ".concat(exampleName), 'red'));
                            console.error('Available examples:', Object.keys(EXAMPLES).join(', '));
                            process.exit(1);
                        }
                        task = EXAMPLES[exampleName];
                    }
                    else {
                        task = args.join(' ');
                    }
                    anthropicKey = process.env.ANTHROPIC_API_KEY;
                    openaiKey = process.env.OPENAI_API_KEY;
                    if (!anthropicKey) {
                        console.error(colorize('ERROR: ANTHROPIC_API_KEY not found in .env', 'red'));
                        process.exit(1);
                    }
                    console.log('');
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log(colorize(' DAG EXECUTION PLAN VISUALIZER', 'bold'));
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log('');
                    skills = (0, dag_1.loadAvailableSkills)();
                    console.log(colorize("\uD83D\uDCDA Loaded ".concat(skills.length, " skills"), 'green'));
                    console.log('');
                    // Show task
                    console.log(colorize('📝 Task:', 'bold'));
                    console.log(colorize("   ".concat(task), 'cyan'));
                    console.log('');
                    // Decompose task
                    console.log(colorize('⏳ Decomposing task...', 'yellow'));
                    decomposer = new dag_1.TaskDecomposer({
                        apiKey: anthropicKey,
                        availableSkills: skills,
                        model: 'claude-sonnet-4-5-20250929',
                        matcherConfig: openaiKey ? {
                            strategy: 'hybrid',
                            openAiApiKey: openaiKey,
                        } : {
                            strategy: 'keyword',
                        },
                    });
                    startDecompose = Date.now();
                    return [4 /*yield*/, decomposer.decomposeToDAG(task)];
                case 1:
                    _c = _j.sent(), decomposition = _c.decomposition, matches = _c.matches, dag = _c.dag;
                    decomposeTime = Date.now() - startDecompose;
                    console.log(colorize("\u2705 Decomposed in ".concat(decomposeTime, "ms"), 'green'));
                    console.log('');
                    // Generate execution plan
                    console.log(colorize('⏳ Generating execution plan...', 'yellow'));
                    runtime = new claude_code_cli_1.ClaudeCodeRuntime({
                        permissions: presets_1.STANDARD_PERMISSIONS,
                        defaultModel: 'sonnet',
                    });
                    plan = runtime.generateExecutionPlan(dag);
                    if (plan.error) {
                        console.error(colorize("\u274C Planning failed: ".concat(plan.error), 'red'));
                        process.exit(1);
                    }
                    console.log(colorize("\u2705 Generated ".concat(plan.totalWaves, " execution waves"), 'green'));
                    console.log('');
                    // Section 1: Overview
                    console.log('');
                    console.log(renderBox('OVERVIEW', [
                        "Strategy: ".concat(decomposition.strategy),
                        "Complexity: ".concat(decomposition.complexity, "/10"),
                        "",
                        "Subtasks: ".concat(decomposition.subtasks.length),
                        "DAG Nodes: ".concat(dag.nodes.size),
                        "DAG Edges: ".concat(dag.edges.size),
                        "",
                        "Execution Waves: ".concat(plan.totalWaves),
                        "Max Parallelism: ".concat(Math.max.apply(Math, plan.waves.map(function (w) { return w.nodeIds.length; })), " tasks"),
                        "",
                        "Matching Strategy: ".concat(openaiKey ? 'Hybrid (keyword + semantic)' : 'Keyword only'),
                        "Average Confidence: ".concat((matches.reduce(function (sum, m) { return sum + m.confidence; }, 0) / matches.length * 100).toFixed(0), "%"),
                    ]));
                    console.log('');
                    // Section 2: Skill Matches
                    console.log('');
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log(colorize(' SKILL MATCHES', 'bold'));
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log('');
                    _loop_2 = function (match) {
                        var subtask = decomposition.subtasks.find(function (st) { return st.id === match.subtaskId; });
                        var skill = skills.find(function (s) { return s.id === match.skillId; });
                        var confidencePercent = (match.confidence * 100).toFixed(0);
                        var confidenceColor = match.confidence >= 0.7 ? 'green' : match.confidence >= 0.4 ? 'yellow' : 'red';
                        console.log(colorize("".concat(match.subtaskId, ":"), 'cyan'));
                        console.log("  Subtask: ".concat((subtask === null || subtask === void 0 ? void 0 : subtask.description) || 'N/A'));
                        console.log("  Skill: ".concat((skill === null || skill === void 0 ? void 0 : skill.name) || match.skillId));
                        console.log("  Confidence: ".concat(colorize(confidencePercent + '%', confidenceColor)));
                        console.log(colorize("  Reasoning: ".concat(match.reasoning), 'dim'));
                        console.log('');
                    };
                    for (_d = 0, matches_1 = matches; _d < matches_1.length; _d++) {
                        match = matches_1[_d];
                        _loop_2(match);
                    }
                    // Section 3: Dependency Graph
                    console.log('');
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log(colorize(' DEPENDENCY GRAPH', 'bold'));
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log('');
                    console.log(renderDependencyGraph(dag));
                    // Section 4: Execution Plan
                    console.log('');
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log(colorize(' EXECUTION PLAN', 'bold'));
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log('');
                    singletonCoordinator = (0, singleton_task_coordinator_1.getSharedSingletonCoordinator)();
                    for (_e = 0, _f = plan.waves; _e < _f.length; _e++) {
                        wave = _f[_e];
                        console.log(renderWave(wave.waveNumber, plan.totalWaves, wave.nodeIds, wave.parallelizable, wave.taskCalls, dag, skills));
                        // Check for conflicts
                        if (wave.parallelizable && wave.nodeIds.length > 1) {
                            analysis = conflict_detector_1.ConflictDetector.analyzeWave(dag, wave.nodeIds);
                            if (analysis.conflicts.length > 0) {
                                console.log('');
                                console.log(colorize('    ⚠️  Conflicts Detected:', 'red'));
                                for (_g = 0, _h = analysis.conflicts; _g < _h.length; _g++) {
                                    conflict = _h[_g];
                                    if (conflict.type === 'file') {
                                        console.log(colorize("       File: ".concat(conflict.filePath), 'red'));
                                        console.log(colorize("       Nodes: ".concat(conflict.nodeIds.join(', ')), 'red'));
                                    }
                                    else if (conflict.type === 'singleton') {
                                        console.log(colorize("       Singleton: ".concat(conflict.singletonType), 'yellow'));
                                        console.log(colorize("       Nodes: ".concat(conflict.nodeIds.join(', ')), 'yellow'));
                                    }
                                }
                                if (analysis.remediation) {
                                    console.log('');
                                    console.log(colorize('    💡 Remediation:', 'cyan'));
                                    console.log(colorize("       ".concat(analysis.remediation), 'cyan'));
                                }
                            }
                        }
                        console.log('');
                        console.log('');
                    }
                    // Section 5: Performance Analysis
                    console.log('');
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log(colorize(' PERFORMANCE ANALYSIS', 'bold'));
                    console.log(colorize('═'.repeat(80), 'bold'));
                    console.log('');
                    totalNodes = plan.totalNodes;
                    parallelWaves = plan.waves.filter(function (w) { return w.parallelizable && w.nodeIds.length > 1; }).length;
                    sequentialWaves = plan.totalWaves - parallelWaves;
                    maxParallelism = Math.max.apply(Math, plan.waves.map(function (w) { return w.nodeIds.length; }));
                    sequentialTime = totalNodes;
                    parallelTime = plan.waves.reduce(function (sum, wave) {
                        return sum + (wave.parallelizable ? 1 : wave.nodeIds.length);
                    }, 0);
                    speedup = sequentialTime / parallelTime;
                    console.log(renderBox('EXECUTION METRICS', [
                        "Total Nodes: ".concat(totalNodes),
                        "Total Waves: ".concat(plan.totalWaves),
                        "  - Parallel Waves: ".concat(parallelWaves),
                        "  - Sequential Waves: ".concat(sequentialWaves),
                        "",
                        "Max Parallelism: ".concat(maxParallelism, " tasks at once"),
                        "",
                        "Theoretical Speedup: ".concat(colorize(speedup.toFixed(2) + 'x', 'green')),
                        "  - Sequential: ".concat(sequentialTime, " time units"),
                        "  - Parallel: ".concat(parallelTime, " time units"),
                    ]));
                    console.log('');
                    // Summary
                    console.log(colorize('✨ Visualization complete!', 'green'));
                    console.log('');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('\n' + colorize('❌ Error:', 'red'), error.message);
    if (error.stack) {
        console.error('\n' + colorize('Stack trace:', 'dim'));
        console.error(error.stack);
    }
    process.exit(1);
});

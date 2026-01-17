#!/usr/bin/env npx tsx
"use strict";
/**
 * Task Decomposition → DAG Execution Demo
 *
 * Shows the full pipeline from arbitrary natural language task
 * to executable DAG.
 *
 * Run with: npx tsx src/dag/demos/decompose-and-execute.ts
 *
 * Requires: ANTHROPIC_API_KEY environment variable
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
var task_decomposer_1 = require("../core/task-decomposer");
var claude_code_cli_1 = require("../runtimes/claude-code-cli");
var skill_loader_1 = require("../registry/skill-loader");
var presets_1 = require("../permissions/presets");
// Test tasks - from simple to complex
var TEST_TASKS = {
    simple: 'Build me a landing page for a SaaS product',
    moderate: 'Create a comprehensive code review report for a pull request',
    complex: 'Research quantum computing and write a technical whitepaper',
};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var taskName, task, config, decomposer, startDecompose, decomposition, decomposeTime, _i, _a, subtask, startMatch, matches, matchTime, _loop_1, _b, matches_1, match, dag, _c, _d, _e, nodeId, node, runtime, plan, _f, _g, wave, _h, _j, _k, nodeId, taskCall, fs, dagJson;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    // Check for API key
                    if (!process.env.ANTHROPIC_API_KEY) {
                        console.error('❌ ANTHROPIC_API_KEY environment variable required');
                        console.log('\nSet it in your shell:');
                        console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
                        console.log('\nOr create a .env file in the website directory');
                        process.exit(1);
                    }
                    console.log('🎯 Task Decomposition → DAG Execution Pipeline\n');
                    console.log('='.repeat(70));
                    taskName = (process.argv[2] || 'simple');
                    task = TEST_TASKS[taskName] || TEST_TASKS.simple;
                    console.log("\n\uD83D\uDCDD Task: \"".concat(task, "\""));
                    console.log("   Complexity: ".concat(taskName, "\n"));
                    // Step 1: Initialize decomposer
                    console.log('⚙️  Step 1: Initializing TaskDecomposer...\n');
                    config = (0, skill_loader_1.createDecomposerConfig)({
                        apiKey: process.env.ANTHROPIC_API_KEY,
                    });
                    console.log("   Model: ".concat(config.model));
                    console.log("   Available skills: ".concat(config.availableSkills.length));
                    console.log("   Max subtasks: ".concat(config.maxSubtasks, "\n"));
                    decomposer = new task_decomposer_1.TaskDecomposer(config);
                    // Step 2: Decompose the task
                    console.log('🔍 Step 2: Decomposing task...\n');
                    startDecompose = Date.now();
                    return [4 /*yield*/, decomposer.decompose(task)];
                case 1:
                    decomposition = _l.sent();
                    decomposeTime = Date.now() - startDecompose;
                    console.log("   Strategy: ".concat(decomposition.strategy));
                    console.log("   Complexity: ".concat(decomposition.complexity, "/10"));
                    console.log("   Subtasks: ".concat(decomposition.subtasks.length));
                    console.log("   Time: ".concat(decomposeTime, "ms\n"));
                    // Show subtasks
                    console.log('📊 Subtasks:\n');
                    for (_i = 0, _a = decomposition.subtasks; _i < _a.length; _i++) {
                        subtask = _a[_i];
                        console.log("   ".concat(subtask.id, ":"));
                        console.log("     Description: ".concat(subtask.description));
                        console.log("     Dependencies: ".concat(subtask.dependencies.length === 0 ? 'None' : subtask.dependencies.join(', ')));
                        console.log("     Capabilities: ".concat(subtask.requiredCapabilities.join(', ')));
                        console.log();
                    }
                    // Step 3: Match skills
                    console.log('🎯 Step 3: Matching skills to subtasks...\n');
                    startMatch = Date.now();
                    return [4 /*yield*/, decomposer.matchSkills(decomposition)];
                case 2:
                    matches = _l.sent();
                    matchTime = Date.now() - startMatch;
                    console.log("   Matches found: ".concat(matches.length));
                    console.log("   Time: ".concat(matchTime, "ms\n"));
                    // Show matches
                    console.log('🔗 Skill Matches:\n');
                    _loop_1 = function (match) {
                        var subtask = decomposition.subtasks.find(function (st) { return st.id === match.subtaskId; });
                        console.log("   ".concat(match.subtaskId, " \u2192 ").concat(match.skillId));
                        console.log("     Confidence: ".concat((match.confidence * 100).toFixed(0), "%"));
                        console.log("     Reasoning: ".concat(match.reasoning));
                        if (subtask) {
                            console.log("     Prompt: \"".concat(subtask.prompt.substring(0, 60), "...\""));
                        }
                        console.log();
                    };
                    for (_b = 0, matches_1 = matches; _b < matches_1.length; _b++) {
                        match = matches_1[_b];
                        _loop_1(match);
                    }
                    // Step 4: Build DAG
                    console.log('📐 Step 4: Building DAG...\n');
                    dag = decomposer.buildDAG(decomposition, matches);
                    console.log("   DAG ID: ".concat(dag.id));
                    console.log("   Nodes: ".concat(dag.nodes.size));
                    console.log("   Edges: ".concat(dag.edges.size));
                    console.log("   Inputs: ".concat(dag.inputs.length));
                    console.log("   Outputs: ".concat(dag.outputs.length, "\n"));
                    // Show DAG structure
                    console.log('🌳 DAG Structure:\n');
                    for (_c = 0, _d = dag.nodes; _c < _d.length; _c++) {
                        _e = _d[_c], nodeId = _e[0], node = _e[1];
                        console.log("   ".concat(nodeId, ":"));
                        console.log("     Type: ".concat(node.type));
                        console.log("     Skill: ".concat(node.skillId || 'N/A'));
                        console.log("     Dependencies: ".concat(node.dependencies.length === 0 ? 'None' : node.dependencies.join(', ')));
                        console.log();
                    }
                    // Step 5: Generate execution plan
                    console.log('📋 Step 5: Generating execution plan...\n');
                    runtime = new claude_code_cli_1.ClaudeCodeRuntime({
                        permissions: presets_1.STANDARD_PERMISSIONS,
                        defaultModel: 'sonnet',
                    });
                    plan = runtime.generateExecutionPlan(dag);
                    if (plan.error) {
                        console.error("   \u274C Error: ".concat(plan.error, "\n"));
                        return [2 /*return*/];
                    }
                    console.log("   Total waves: ".concat(plan.totalWaves));
                    console.log("   Total nodes: ".concat(plan.totalNodes, "\n"));
                    // Show execution waves
                    console.log('🌊 Execution Waves:\n');
                    for (_f = 0, _g = plan.waves; _f < _g.length; _f++) {
                        wave = _g[_f];
                        console.log("   Wave ".concat(wave.waveNumber + 1, ":"));
                        console.log("     Nodes: [".concat(wave.nodeIds.join(', '), "]"));
                        console.log("     Parallelizable: ".concat(wave.parallelizable ? 'Yes' : 'No'));
                        // Show task calls for this wave
                        for (_h = 0, _j = Object.entries(wave.taskCalls); _h < _j.length; _h++) {
                            _k = _j[_h], nodeId = _k[0], taskCall = _k[1];
                            console.log("\n     ".concat(nodeId, ":"));
                            console.log("       Subagent: ".concat(taskCall.subagent_type));
                            console.log("       Model: ".concat(taskCall.model));
                            console.log("       Description: ".concat(taskCall.description));
                        }
                        console.log();
                    }
                    // Step 6: Summary
                    console.log('='.repeat(70));
                    console.log('\n✨ Summary:\n');
                    console.log("   Original task: \"".concat(task, "\""));
                    console.log("   Decomposition: ".concat(decomposition.subtasks.length, " subtasks in ").concat(decomposeTime, "ms"));
                    console.log("   Skill matching: ".concat(matches.length, " matches in ").concat(matchTime, "ms"));
                    console.log("   Execution plan: ".concat(plan.totalWaves, " waves, ").concat(plan.totalNodes, " nodes"));
                    console.log("   Max parallelism: ".concat(Math.max.apply(Math, plan.waves.map(function (w) { return w.nodeIds.length; }))));
                    console.log();
                    // Next steps
                    console.log('📌 Next Steps:\n');
                    console.log('   To execute this DAG for real:');
                    console.log('   1. Wire runtime.execute() to actually call the Task tool');
                    console.log('   2. Pass the DAG: runtime.execute(dag)');
                    console.log('   3. Results will come from parallel agent execution\n');
                    // Export the DAG
                    console.log('💾 Saving DAG to file...\n');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                case 3:
                    fs = _l.sent();
                    dagJson = JSON.stringify({
                        task: task,
                        decomposition: decomposition,
                        matches: matches,
                        dag: {
                            id: dag.id,
                            name: dag.name,
                            nodes: Array.from(dag.nodes.entries()).map(function (_a) {
                                var id = _a[0], node = _a[1];
                                return ({
                                    id: id,
                                    type: node.type,
                                    skillId: node.skillId,
                                    dependencies: node.dependencies,
                                });
                            }),
                            edges: Array.from(dag.edges.entries()).map(function (_a) {
                                var from = _a[0], tos = _a[1];
                                return ({
                                    from: from,
                                    to: tos,
                                });
                            }),
                        },
                        plan: plan,
                    }, null, 2);
                    return [4 /*yield*/, fs.writeFile('generated-dag.json', dagJson)];
                case 4:
                    _l.sent();
                    console.log('   ✅ Saved to: generated-dag.json\n');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
    }
    process.exit(1);
});

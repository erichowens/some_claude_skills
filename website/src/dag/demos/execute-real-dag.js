#!/usr/bin/env npx tsx
"use strict";
/**
 * Real DAG Execution Demo
 *
 * This demonstrates the FULL pipeline from task to execution:
 * 1. Decompose natural language task
 * 2. Match skills
 * 3. Build DAG
 * 4. Generate execution plan
 * 5. Execute using real Task tool calls (simulated in TypeScript)
 *
 * Note: Real Task tool calls can only be made by Claude Code itself.
 * This script shows how to prepare the execution plan that Claude Code
 * would use to make parallel Task calls.
 *
 * Run with: npx tsx src/dag/demos/execute-real-dag.ts
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
// Example task
var TASK = 'Create a simple landing page with hero section and contact form';
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, decomposer, _a, decomposition, matches, dag, runtime, plan;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🎯 Full DAG Execution Pipeline\n');
                    console.log('='.repeat(70));
                    console.log();
                    // Check API key
                    if (!process.env.ANTHROPIC_API_KEY) {
                        console.error('❌ ANTHROPIC_API_KEY required');
                        console.log('Set in .env or export ANTHROPIC_API_KEY=sk-ant-...\n');
                        process.exit(1);
                    }
                    // Step 1: Decompose task
                    console.log('📋 Step 1: Task Decomposition\n');
                    console.log("Task: \"".concat(TASK, "\"\n"));
                    config = (0, skill_loader_1.createDecomposerConfig)({
                        apiKey: process.env.ANTHROPIC_API_KEY,
                    });
                    decomposer = new task_decomposer_1.TaskDecomposer(config);
                    return [4 /*yield*/, decomposer.decomposeToDAG(TASK)];
                case 1:
                    _a = _b.sent(), decomposition = _a.decomposition, matches = _a.matches, dag = _a.dag;
                    console.log("\u2705 Decomposed into ".concat(decomposition.subtasks.length, " subtasks"));
                    console.log("\u2705 Matched ".concat(matches.length, " skills"));
                    console.log("\u2705 Built DAG: ".concat(dag.nodes.size, " nodes, ").concat(dag.edges.size, " edges\n"));
                    // Step 2: Generate execution plan
                    console.log('📐 Step 2: Execution Planning\n');
                    runtime = new claude_code_cli_1.ClaudeCodeRuntime({
                        permissions: presets_1.STANDARD_PERMISSIONS,
                        defaultModel: 'sonnet',
                    });
                    plan = runtime.generateExecutionPlan(dag);
                    if (plan.error) {
                        console.error("\u274C Planning failed: ".concat(plan.error, "\n"));
                        return [2 /*return*/];
                    }
                    console.log("\u2705 Generated ".concat(plan.totalWaves, " waves"));
                    console.log("\u2705 Max parallelism: ".concat(Math.max.apply(Math, plan.waves.map(function (w) { return w.nodeIds.length; })), "\n"));
                    // Step 3: Show execution script for Claude Code
                    console.log('🚀 Step 3: Execution Instructions for Claude Code\n');
                    console.log('='.repeat(70));
                    console.log();
                    generateClaudeCodeScript(plan, dag);
                    // Step 4: Show what real execution would look like
                    console.log('\n📊 Step 4: Simulated Execution\n');
                    console.log('='.repeat(70));
                    console.log();
                    return [4 /*yield*/, simulateExecution(plan)];
                case 2:
                    _b.sent();
                    console.log('\n✨ Summary\n');
                    console.log('The DAG framework is fully operational:');
                    console.log('  ✅ Task decomposition works');
                    console.log('  ✅ Skill matching works');
                    console.log('  ✅ DAG construction works');
                    console.log('  ✅ Execution planning works');
                    console.log('  ⚠️  Real Task calls require Claude Code environment');
                    console.log();
                    console.log('To execute for real:');
                    console.log('  1. Copy the generated script above');
                    console.log('  2. Paste it into a Claude Code conversation');
                    console.log('  3. Claude Code will make the actual Task tool calls');
                    console.log();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate a script that Claude Code can use to execute the DAG
 */
function generateClaudeCodeScript(plan, dag) {
    console.log('Copy this into Claude Code to execute the DAG:\n');
    console.log('```typescript');
    console.log('// DAG Execution Script');
    console.log('// This shows what Claude Code should do\n');
    for (var _i = 0, _a = plan.waves; _i < _a.length; _i++) {
        var wave = _a[_i];
        console.log("// Wave ".concat(wave.waveNumber + 1, ": ").concat(wave.nodeIds.length, " task(s)"));
        if (wave.parallelizable && wave.nodeIds.length > 1) {
            console.log('// These tasks can run in parallel');
            console.log('// Make all Task calls in a single message:\n');
            for (var _b = 0, _c = wave.nodeIds; _b < _c.length; _b++) {
                var nodeId = _c[_b];
                var taskCall = wave.taskCalls[nodeId];
                var node = dag.nodes.get(nodeId);
                console.log("// Task ".concat(wave.nodeIds.indexOf(nodeId) + 1, "/").concat(wave.nodeIds.length, ": ").concat(nodeId));
                console.log('Task({');
                console.log("  description: \"".concat(taskCall.description, "\","));
                console.log("  subagent_type: \"".concat(taskCall.subagent_type, "\","));
                console.log("  model: \"".concat(taskCall.model, "\","));
                console.log("  prompt: `".concat(taskCall.prompt.substring(0, 100), "...`"));
                console.log('});\n');
            }
        }
        else {
            // Sequential execution
            var nodeId = wave.nodeIds[0];
            var taskCall = wave.taskCalls[nodeId];
            console.log("// Sequential task: ".concat(nodeId));
            console.log('Task({');
            console.log("  description: \"".concat(taskCall.description, "\","));
            console.log("  subagent_type: \"".concat(taskCall.subagent_type, "\","));
            console.log("  model: \"".concat(taskCall.model, "\","));
            console.log("  prompt: `".concat(taskCall.prompt.substring(0, 100), "...`"));
            console.log('});\n');
        }
        console.log('// Wait for wave to complete before continuing\n');
    }
    console.log('```\n');
}
/**
 * Simulate what execution would look like
 */
function simulateExecution(plan) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, wave, waveNum, totalWaves, _b, _c, nodeId, taskCall;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('Simulating wave-by-wave execution:\n');
                    _i = 0, _a = plan.waves;
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    wave = _a[_i];
                    waveNum = wave.waveNumber + 1;
                    totalWaves = plan.totalWaves;
                    console.log("\u250C\u2500 Wave ".concat(waveNum, "/").concat(totalWaves, " \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"));
                    console.log("\u2502 Nodes: ".concat(wave.nodeIds.length));
                    console.log("\u2502 Parallel: ".concat(wave.parallelizable ? 'Yes' : 'No'));
                    console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n");
                    _b = 0, _c = wave.nodeIds;
                    _d.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 5];
                    nodeId = _c[_b];
                    taskCall = wave.taskCalls[nodeId];
                    console.log("  \uD83D\uDD04 Starting: ".concat(nodeId));
                    console.log("     Agent: ".concat(taskCall.subagent_type));
                    console.log("     Model: ".concat(taskCall.model));
                    // Simulate execution time
                    return [4 /*yield*/, sleep(wave.parallelizable ? 500 : 1000)];
                case 3:
                    // Simulate execution time
                    _d.sent();
                    console.log("  \u2705 Completed: ".concat(nodeId, "\n"));
                    _d.label = 4;
                case 4:
                    _b++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("  Wave ".concat(waveNum, " complete!\n"));
                    _d.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    console.log('🎉 All waves executed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
main().catch(function (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});

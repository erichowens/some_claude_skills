#!/usr/bin/env npx tsx
"use strict";
/**
 * DAG Framework Live Demo
 *
 * Run with: npx tsx src/dag/demos/run-demo.ts
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
var index_1 = require("../index");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var workflow, _i, _a, _b, id, node, validationErrors, sortResult, runtime, complexWorkflow, complexSort;
        var _c;
        return __generator(this, function (_d) {
            console.log('🚀 DAG Framework Demo\n');
            console.log('='.repeat(60));
            // 1. Build the workflow
            console.log('\n📊 Step 1: Building DAG...\n');
            workflow = (0, index_1.dag)('research-pipeline')
                .skillNode('research', 'comprehensive-researcher')
                .prompt('Research: {{topic}}')
                .done()
                .skillNode('summarize', 'technical-writer')
                .dependsOn('research')
                .prompt('Summarize the research findings')
                .done()
                .inputs('topic')
                .outputs({ name: 'summary', from: 'summarize' })
                .build();
            console.log("\u2705 Created DAG: \"".concat(workflow.name, "\""));
            console.log("   ID: ".concat(workflow.id));
            console.log("   Nodes: ".concat(workflow.nodes.size));
            // Show nodes
            console.log('\n   Nodes:');
            for (_i = 0, _a = workflow.nodes; _i < _a.length; _i++) {
                _b = _a[_i], id = _b[0], node = _b[1];
                console.log("     - ".concat(id, " (").concat(node.type, ") \u2192 skill: ").concat(node.skillId || 'N/A'));
                if (node.dependencies.length > 0) {
                    console.log("       depends on: [".concat(node.dependencies.join(', '), "]"));
                }
            }
            // 2. Validate the DAG
            console.log('\n📋 Step 2: Validating DAG...\n');
            validationErrors = (0, index_1.validateDAG)(workflow);
            if (validationErrors.length === 0) {
                console.log('✅ DAG is valid!');
            }
            else {
                console.log('❌ Validation errors:');
                validationErrors.forEach(function (e) { return console.log("   - ".concat(e.message)); });
            }
            // 3. Topological sort
            console.log('\n📈 Step 3: Computing execution order...\n');
            sortResult = (0, index_1.topologicalSort)(workflow);
            if (sortResult.success) {
                console.log('✅ Execution order:');
                sortResult.waves.forEach(function (wave, waveIdx) {
                    console.log("   Wave ".concat(waveIdx + 1, ": [").concat(wave.nodeIds.join(', '), "]"));
                    if (wave.nodeIds.length > 1) {
                        console.log("            \u21B3 ".concat(wave.nodeIds.length, " tasks run in PARALLEL"));
                    }
                });
                console.log("\n   Total waves: ".concat(sortResult.waves.length));
                console.log("   Total nodes: ".concat(sortResult.order.length));
                console.log("   Can parallelize: ".concat(sortResult.stats.maxParallelism > 1 ? 'Yes' : 'No (linear)'));
            }
            else {
                console.log('❌ Cycle detected:', (_c = sortResult.cycle) === null || _c === void 0 ? void 0 : _c.join(' → '));
            }
            // 4. Show what the runtime would do
            console.log('\n⚙️ Step 4: Runtime configuration...\n');
            runtime = new index_1.ClaudeCodeRuntime({
                permissions: index_1.STANDARD_PERMISSIONS,
                defaultModel: 'sonnet',
            });
            console.log('   Runtime: ClaudeCodeRuntime');
            console.log('   Mode: Claude Code CLI (Task tool spawning)');
            console.log('   Default model: sonnet');
            console.log('   Permissions: STANDARD_PERMISSIONS');
            console.log('     - Read: ✅');
            console.log('     - Write: ✅');
            console.log('     - Bash: ✅ (sandboxed)');
            console.log('     - WebSearch: ✅');
            console.log('     - WebFetch: ✅');
            // 5. Show execution plan (without actually executing)
            console.log('\n🎯 Step 5: Execution plan for topic="quantum computing"...\n');
            console.log('   Wave 1:');
            console.log('     → Spawn "comprehensive-researcher" agent');
            console.log('     → Prompt: "Research: quantum computing"');
            console.log('     → Wait for completion...');
            console.log('\n   Wave 2:');
            console.log('     → Spawn "technical-writer" agent');
            console.log('     → Prompt: "Summarize the research findings"');
            console.log('     → Input: Results from Wave 1');
            console.log('     → Wait for completion...');
            console.log('\n   Output:');
            console.log('     → Return "summary" from summarize node');
            // 6. Demo a more complex DAG
            console.log('\n' + '='.repeat(60));
            console.log('\n📊 Bonus: Complex parallel DAG...\n');
            complexWorkflow = (0, index_1.dag)('code-review-pipeline')
                .skillNode('fetch', 'data-pipeline-engineer')
                .prompt('Fetch the PR diff for review')
                .done()
                .skillNode('lint', 'code-review')
                .dependsOn('fetch')
                .prompt('Run linting checks')
                .done()
                .skillNode('test', 'test-automation-expert')
                .dependsOn('fetch')
                .prompt('Run test suite')
                .done()
                .skillNode('security', 'security-auditor')
                .dependsOn('fetch')
                .prompt('Check for security vulnerabilities')
                .done()
                .skillNode('report', 'technical-writer')
                .dependsOn('lint', 'test', 'security')
                .prompt('Generate review report')
                .done()
                .build();
            complexSort = (0, index_1.topologicalSort)(complexWorkflow);
            console.log("   DAG: \"".concat(complexWorkflow.name, "\""));
            console.log("   Nodes: ".concat(complexWorkflow.nodes.size));
            console.log("   Waves: ".concat(complexSort.waves.length));
            console.log("   Max parallelism: ".concat(complexSort.stats.maxParallelism));
            console.log('\n   Execution waves:');
            complexSort.waves.forEach(function (wave, idx) {
                console.log("     Wave ".concat(idx + 1, ": [").concat(wave.nodeIds.join(', '), "]"));
                if (wave.nodeIds.length > 1) {
                    console.log("             \u21B3 ".concat(wave.nodeIds.length, " tasks run in PARALLEL"));
                }
            });
            console.log('\n' + '='.repeat(60));
            console.log('\n✨ Demo complete!\n');
            console.log('To execute for real, wire the runtime to actual Task tool calls.');
            console.log('See: /dag/builder in the website for visual editing.\n');
            return [2 /*return*/];
        });
    });
}
main().catch(console.error);

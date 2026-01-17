#!/usr/bin/env npx tsx
"use strict";
/**
 * Test User's Actual Task
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
var skill_loader_1 = require("../registry/skill-loader");
var USER_TASK = "Please modernize someclaudeskills.com. Make it much more compelling to the following users:\n- the newbie to AI landing on the web page\n- a software developer conversant in AI tools, heavily steeped in the developer community\n- an ADHD dilettante\n- a potential employer of the site's creator\n- a friend of the site's creator not conversant in AI or tech at all\n\nMinimize UX friction, optimize SEO, make it beautiful as hell and unique.";
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, decomposer, decomposition, _i, _a, subtask, matches, _b, matches_1, match, dag, _c, _d, _e, nodeId, node, fs;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('🎯 Testing Task Decomposition\n');
                    console.log('Task:', USER_TASK);
                    console.log('\n' + '='.repeat(70) + '\n');
                    if (!process.env.ANTHROPIC_API_KEY) {
                        console.error('❌ ANTHROPIC_API_KEY required');
                        process.exit(1);
                    }
                    config = (0, skill_loader_1.createDecomposerConfig)({
                        apiKey: process.env.ANTHROPIC_API_KEY,
                    });
                    decomposer = new task_decomposer_1.TaskDecomposer(config);
                    console.log('⏳ Decomposing task...\n');
                    return [4 /*yield*/, decomposer.decompose(USER_TASK)];
                case 1:
                    decomposition = _f.sent();
                    console.log('✅ Decomposition complete!\n');
                    console.log("Strategy: ".concat(decomposition.strategy));
                    console.log("Complexity: ".concat(decomposition.complexity, "/10"));
                    console.log("Subtasks: ".concat(decomposition.subtasks.length, "\n"));
                    console.log('📊 Subtasks:\n');
                    for (_i = 0, _a = decomposition.subtasks; _i < _a.length; _i++) {
                        subtask = _a[_i];
                        console.log("".concat(subtask.id, ":"));
                        console.log("  Description: ".concat(subtask.description));
                        console.log("  Dependencies: ".concat(subtask.dependencies.length === 0 ? 'None' : subtask.dependencies.join(', ')));
                        console.log("  Capabilities: ".concat(subtask.requiredCapabilities.join(', ')));
                        console.log();
                    }
                    console.log('🎯 Matching skills...\n');
                    return [4 /*yield*/, decomposer.matchSkills(decomposition)];
                case 2:
                    matches = _f.sent();
                    console.log('🔗 Skill Matches:\n');
                    for (_b = 0, matches_1 = matches; _b < matches_1.length; _b++) {
                        match = matches_1[_b];
                        console.log("".concat(match.subtaskId, " \u2192 ").concat(match.skillId));
                        console.log("  Confidence: ".concat((match.confidence * 100).toFixed(0), "%"));
                        console.log("  Reasoning: ".concat(match.reasoning));
                        console.log();
                    }
                    console.log('📐 Building DAG...\n');
                    dag = decomposer.buildDAG(decomposition, matches);
                    console.log("DAG ID: ".concat(dag.id));
                    console.log("Nodes: ".concat(dag.nodes.size));
                    console.log("Edges: ".concat(dag.edges.size, "\n"));
                    // Show DAG structure
                    console.log('🌳 DAG Structure:\n');
                    for (_c = 0, _d = dag.nodes; _c < _d.length; _c++) {
                        _e = _d[_c], nodeId = _e[0], node = _e[1];
                        console.log("".concat(nodeId, ":"));
                        console.log("  Type: ".concat(node.type));
                        console.log("  Skill: ".concat(node.skillId || 'N/A'));
                        console.log("  Dependencies: ".concat(node.dependencies.length === 0 ? 'None' : node.dependencies.join(', ')));
                        console.log();
                    }
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                case 3:
                    fs = _f.sent();
                    return [4 /*yield*/, fs.writeFile('user-task-dag.json', JSON.stringify({
                            task: USER_TASK,
                            decomposition: decomposition,
                            matches: matches,
                            dag: {
                                id: dag.id,
                                nodes: Array.from(dag.nodes.entries()).map(function (_a) {
                                    var id = _a[0], node = _a[1];
                                    return (__assign({ id: id }, node));
                                }),
                                edges: Array.from(dag.edges.entries()).map(function (_a) {
                                    var from = _a[0], to = _a[1];
                                    return ({ from: from, to: to });
                                }),
                            },
                        }, null, 2))];
                case 4:
                    _f.sent();
                    console.log('💾 Saved to: user-task-dag.json\n');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

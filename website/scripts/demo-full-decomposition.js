"use strict";
/**
 * Full Task Decomposition Demo with Semantic Matching
 *
 * Demonstrates the complete workflow:
 * 1. Claude API decomposes task into subtasks
 * 2. Semantic matcher finds best skill for each subtask
 * 3. Compares keyword vs hybrid matching results
 *
 * Usage:
 *   npx tsx scripts/demo-full-decomposition.ts
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
var dotenv = require("dotenv");
var path = require("path");
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var anthropicKey, openaiKey, skills, task, keywordDecomposer, keywordFullResult, keywordResult, keywordMatches, _loop_1, _i, _a, subtask, hybridDecomposer, hybridFullResult, hybridResult, hybridMatches, _loop_2, _b, _c, subtask, _loop_3, i, avgKeywordConfidence, avgHybridConfidence;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    anthropicKey = process.env.ANTHROPIC_API_KEY;
                    openaiKey = process.env.OPENAI_API_KEY;
                    if (!anthropicKey) {
                        console.error('ERROR: ANTHROPIC_API_KEY not found in .env');
                        process.exit(1);
                    }
                    if (!openaiKey) {
                        console.error('ERROR: OPENAI_API_KEY not found in .env');
                        process.exit(1);
                    }
                    console.log('🚀 Full Task Decomposition with Semantic Matching\n');
                    console.log('='.repeat(80) + '\n');
                    skills = (0, dag_1.loadAvailableSkills)();
                    console.log("\uD83D\uDCDA Loaded ".concat(skills.length, " skills\n"));
                    task = 'Build a modern SaaS landing page with user authentication, analytics dashboard, and payment integration';
                    console.log('📝 Task:');
                    console.log("   \"".concat(task, "\"\n"));
                    // Create decomposer with KEYWORD matching
                    console.log('=' + '='.repeat(79));
                    console.log('🔤 DECOMPOSITION WITH KEYWORD MATCHING');
                    console.log('=' + '='.repeat(79) + '\n');
                    keywordDecomposer = new dag_1.TaskDecomposer({
                        apiKey: anthropicKey,
                        availableSkills: skills,
                        model: 'claude-sonnet-4-5-20250929',
                        matcherConfig: {
                            strategy: 'keyword',
                        },
                    });
                    console.log('⏳ Decomposing task (using keyword matching)...\n');
                    return [4 /*yield*/, keywordDecomposer.decomposeToDAG(task)];
                case 1:
                    keywordFullResult = _d.sent();
                    keywordResult = keywordFullResult.decomposition;
                    keywordMatches = keywordFullResult.matches;
                    console.log("\u2705 Decomposed into ".concat(keywordResult.subtasks.length, " subtasks:\n"));
                    _loop_1 = function (subtask) {
                        var match = keywordMatches.find(function (m) { return m.subtaskId === subtask.id; });
                        console.log("".concat(subtask.id, ":"));
                        console.log("  Description: ".concat(subtask.description));
                        console.log("  Capabilities: ".concat(subtask.requiredCapabilities.join(', ')));
                        console.log("  Matched Skill: ".concat((match === null || match === void 0 ? void 0 : match.skillId) || 'none'));
                        console.log("  Confidence: ".concat((match === null || match === void 0 ? void 0 : match.confidence.toFixed(2)) || 'N/A'));
                        console.log("  Reasoning: ".concat((match === null || match === void 0 ? void 0 : match.reasoning) || 'N/A'));
                        console.log();
                    };
                    for (_i = 0, _a = keywordResult.subtasks; _i < _a.length; _i++) {
                        subtask = _a[_i];
                        _loop_1(subtask);
                    }
                    // Create decomposer with HYBRID matching
                    console.log('=' + '='.repeat(79));
                    console.log('🔀 DECOMPOSITION WITH HYBRID MATCHING (Keyword + Semantic)');
                    console.log('=' + '='.repeat(79) + '\n');
                    hybridDecomposer = new dag_1.TaskDecomposer({
                        apiKey: anthropicKey,
                        availableSkills: skills,
                        model: 'claude-sonnet-4-5-20250929',
                        matcherConfig: {
                            strategy: 'hybrid',
                            openAiApiKey: openaiKey,
                        },
                    });
                    console.log('⏳ Decomposing task (using hybrid matching)...\n');
                    return [4 /*yield*/, hybridDecomposer.decomposeToDAG(task)];
                case 2:
                    hybridFullResult = _d.sent();
                    hybridResult = hybridFullResult.decomposition;
                    hybridMatches = hybridFullResult.matches;
                    console.log("\u2705 Decomposed into ".concat(hybridResult.subtasks.length, " subtasks:\n"));
                    _loop_2 = function (subtask) {
                        var match = hybridMatches.find(function (m) { return m.subtaskId === subtask.id; });
                        console.log("".concat(subtask.id, ":"));
                        console.log("  Description: ".concat(subtask.description));
                        console.log("  Capabilities: ".concat(subtask.requiredCapabilities.join(', ')));
                        console.log("  Matched Skill: ".concat((match === null || match === void 0 ? void 0 : match.skillId) || 'none'));
                        console.log("  Confidence: ".concat((match === null || match === void 0 ? void 0 : match.confidence.toFixed(2)) || 'N/A'));
                        console.log("  Reasoning: ".concat((match === null || match === void 0 ? void 0 : match.reasoning) || 'N/A'));
                        console.log();
                    };
                    for (_b = 0, _c = hybridResult.subtasks; _b < _c.length; _b++) {
                        subtask = _c[_b];
                        _loop_2(subtask);
                    }
                    // Compare results
                    console.log('=' + '='.repeat(79));
                    console.log('📊 COMPARISON ANALYSIS');
                    console.log('=' + '='.repeat(79) + '\n');
                    console.log('Subtask-by-Subtask Comparison:\n');
                    _loop_3 = function (i) {
                        var keywordSubtask = keywordResult.subtasks[i];
                        var hybridSubtask = hybridResult.subtasks[i];
                        var keywordMatch = keywordMatches.find(function (m) { return m.subtaskId === keywordSubtask.id; });
                        var hybridMatch = hybridMatches.find(function (m) { return m.subtaskId === hybridSubtask.id; });
                        console.log("".concat(i + 1, ". ").concat(keywordSubtask.id));
                        console.log("   Keyword: ".concat(keywordMatch === null || keywordMatch === void 0 ? void 0 : keywordMatch.skillId, " (confidence: ").concat(keywordMatch === null || keywordMatch === void 0 ? void 0 : keywordMatch.confidence.toFixed(2), ")"));
                        console.log("   Hybrid:  ".concat(hybridMatch === null || hybridMatch === void 0 ? void 0 : hybridMatch.skillId, " (confidence: ").concat(hybridMatch === null || hybridMatch === void 0 ? void 0 : hybridMatch.confidence.toFixed(2), ")"));
                        if ((keywordMatch === null || keywordMatch === void 0 ? void 0 : keywordMatch.skillId) !== (hybridMatch === null || hybridMatch === void 0 ? void 0 : hybridMatch.skillId)) {
                            console.log("   \u26A0\uFE0F  DIFFERENT SKILLS SELECTED!");
                        }
                        else if (hybridMatch && keywordMatch && hybridMatch.confidence > keywordMatch.confidence) {
                            console.log("   \u2713  Higher confidence with hybrid (+".concat(((hybridMatch.confidence - keywordMatch.confidence) * 100).toFixed(0), "%)"));
                        }
                        console.log();
                    };
                    for (i = 0; i < keywordResult.subtasks.length; i++) {
                        _loop_3(i);
                    }
                    // Summary
                    console.log('Summary:');
                    console.log("  Total subtasks: ".concat(keywordResult.subtasks.length));
                    avgKeywordConfidence = keywordMatches.reduce(function (sum, m) { return sum + m.confidence; }, 0) / keywordMatches.length;
                    avgHybridConfidence = hybridMatches.reduce(function (sum, m) { return sum + m.confidence; }, 0) / hybridMatches.length;
                    console.log("  Average keyword confidence: ".concat(avgKeywordConfidence.toFixed(2)));
                    console.log("  Average hybrid confidence: ".concat(avgHybridConfidence.toFixed(2)));
                    console.log("  Confidence improvement: +".concat(((avgHybridConfidence - avgKeywordConfidence) * 100).toFixed(0), "%"));
                    console.log('\n' + '='.repeat(80));
                    console.log('\n✅ Demo complete!\n');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
});

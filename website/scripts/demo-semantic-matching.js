"use strict";
/**
 * Demo: Semantic vs Keyword Skill Matching
 *
 * Compares semantic and keyword matching strategies on sample subtasks.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/demo-semantic-matching.ts
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
var skill_loader_1 = require("../src/dag/registry/skill-loader");
var skill_matcher_1 = require("../src/dag/core/skill-matcher");
// Sample subtasks for comparison
var sampleSubtasks = [
    {
        id: 'design-landing-page',
        description: 'Create an attractive landing page with modern design aesthetics',
        prompt: 'Design a landing page',
        dependencies: [],
        requiredCapabilities: ['ui-design', 'web-design', 'visual-design'],
    },
    {
        id: 'optimize-database',
        description: 'Improve database query performance and add indexes',
        prompt: 'Optimize database queries',
        dependencies: [],
        requiredCapabilities: ['database', 'performance', 'sql'],
    },
    {
        id: 'implement-authentication',
        description: 'Build a secure user authentication system with JWT tokens',
        prompt: 'Implement auth',
        dependencies: [],
        requiredCapabilities: ['security', 'authentication', 'backend'],
    },
    {
        id: 'analyze-user-behavior',
        description: 'Study how users interact with the application and identify patterns',
        prompt: 'Analyze user behavior',
        dependencies: [],
        requiredCapabilities: ['analytics', 'data-analysis', 'user-research'],
    },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, skills, keywordMatcher, semanticMatcher, hybridMatcher, _loop_1, _i, sampleSubtasks_1, subtask;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) {
                        console.error('ERROR: OPENAI_API_KEY environment variable not set');
                        console.error('Usage: OPENAI_API_KEY=sk-... npx tsx scripts/demo-semantic-matching.ts');
                        console.error('\nAlternatively, you can run keyword-only demo:');
                        console.error('npx tsx scripts/demo-semantic-matching.ts --keyword-only');
                        process.exit(1);
                    }
                    console.log('🎯 Semantic vs Keyword Skill Matching Demo\n');
                    console.log('='.repeat(80) + '\n');
                    skills = (0, skill_loader_1.loadAvailableSkills)();
                    console.log("\uD83D\uDCDA Loaded ".concat(skills.length, " skills\n"));
                    keywordMatcher = new skill_matcher_1.SkillMatcher({
                        strategy: 'keyword',
                    });
                    semanticMatcher = new skill_matcher_1.SkillMatcher({
                        strategy: 'semantic',
                        openAiApiKey: apiKey,
                    });
                    hybridMatcher = new skill_matcher_1.SkillMatcher({
                        strategy: 'hybrid',
                        openAiApiKey: apiKey,
                    });
                    _loop_1 = function (subtask) {
                        var keywordResult, semanticResult, error_1, hybridResult, error_2, keywordSkill;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    console.log("\n".concat('─'.repeat(80)));
                                    console.log("Task: ".concat(subtask.description));
                                    console.log("Capabilities: ".concat(subtask.requiredCapabilities.join(', ')));
                                    console.log('─'.repeat(80));
                                    // Keyword matching
                                    console.log('\n📝 KEYWORD MATCHING:');
                                    return [4 /*yield*/, keywordMatcher.findBestMatch(subtask, skills)];
                                case 1:
                                    keywordResult = _b.sent();
                                    console.log("  Skill: ".concat(keywordResult.skillId));
                                    console.log("  Confidence: ".concat(keywordResult.confidence.toFixed(2)));
                                    console.log("  Reasoning: ".concat(keywordResult.reasoning));
                                    // Semantic matching
                                    console.log('\n🧠 SEMANTIC MATCHING:');
                                    _b.label = 2;
                                case 2:
                                    _b.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, semanticMatcher.findBestMatch(subtask, skills)];
                                case 3:
                                    semanticResult = _b.sent();
                                    console.log("  Skill: ".concat(semanticResult.skillId));
                                    console.log("  Confidence: ".concat(semanticResult.confidence.toFixed(2)));
                                    console.log("  Reasoning: ".concat(semanticResult.reasoning));
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_1 = _b.sent();
                                    console.log("  Error: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                                    return [3 /*break*/, 5];
                                case 5:
                                    // Hybrid matching
                                    console.log('\n🔀 HYBRID MATCHING:');
                                    _b.label = 6;
                                case 6:
                                    _b.trys.push([6, 8, , 9]);
                                    return [4 /*yield*/, hybridMatcher.findBestMatch(subtask, skills)];
                                case 7:
                                    hybridResult = _b.sent();
                                    console.log("  Skill: ".concat(hybridResult.skillId));
                                    console.log("  Confidence: ".concat(hybridResult.confidence.toFixed(2)));
                                    console.log("  Reasoning: ".concat(hybridResult.reasoning));
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_2 = _b.sent();
                                    console.log("  Error: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                                    return [3 /*break*/, 9];
                                case 9:
                                    keywordSkill = skills.find(function (s) { return s.id === keywordResult.skillId; });
                                    console.log("\n\uD83D\uDCCA Analysis:");
                                    console.log("  Keyword choice: ".concat((keywordSkill === null || keywordSkill === void 0 ? void 0 : keywordSkill.name) || keywordResult.skillId));
                                    console.log("  Categories: ".concat((keywordSkill === null || keywordSkill === void 0 ? void 0 : keywordSkill.categories.join(', ')) || 'N/A'));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, sampleSubtasks_1 = sampleSubtasks;
                    _a.label = 1;
                case 1:
                    if (!(_i < sampleSubtasks_1.length)) return [3 /*break*/, 4];
                    subtask = sampleSubtasks_1[_i];
                    return [5 /*yield**/, _loop_1(subtask)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
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

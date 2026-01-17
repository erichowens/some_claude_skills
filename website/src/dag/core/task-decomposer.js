"use strict";
/**
 * Task Decomposer
 *
 * Takes arbitrary natural language tasks and decomposes them into
 * executable DAGs by analyzing requirements and matching to available skills.
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
exports.TaskDecomposer = void 0;
var builder_1 = require("./builder");
var sdk_1 = require("@anthropic-ai/sdk");
var skill_matcher_1 = require("./skill-matcher");
/**
 * TaskDecomposer - Breaks down arbitrary tasks into executable DAGs
 */
var TaskDecomposer = /** @class */ (function () {
    function TaskDecomposer(config) {
        this.config = {
            apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
            model: config.model || 'claude-sonnet-4-5-20250929',
            availableSkills: config.availableSkills,
            maxSubtasks: config.maxSubtasks || 10,
            temperature: config.temperature || 0.7,
            matcherConfig: config.matcherConfig || {},
        };
        if (!this.config.apiKey) {
            throw new Error('ANTHROPIC_API_KEY required for TaskDecomposer');
        }
        this.client = new sdk_1.default({ apiKey: this.config.apiKey });
        this.matcher = new skill_matcher_1.SkillMatcher(this.config.matcherConfig);
    }
    /**
     * Decompose a natural language task into subtasks
     */
    TaskDecomposer.prototype.decompose = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, response, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemPrompt = this.buildDecompositionPrompt();
                        return [4 /*yield*/, this.client.messages.create({
                                model: this.config.model,
                                max_tokens: 4096,
                                temperature: this.config.temperature,
                                system: systemPrompt,
                                messages: [
                                    {
                                        role: 'user',
                                        content: task,
                                    },
                                ],
                            })];
                    case 1:
                        response = _a.sent();
                        content = response.content[0];
                        if (content.type !== 'text') {
                            throw new Error('Expected text response from Claude');
                        }
                        return [2 /*return*/, this.parseDecomposition(task, content.text)];
                }
            });
        });
    };
    /**
     * Match subtasks to available skills using the configured matcher
     */
    TaskDecomposer.prototype.matchSkills = function (decomposition) {
        return __awaiter(this, void 0, void 0, function () {
            var matches, _i, _a, subtask, match;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        matches = [];
                        _i = 0, _a = decomposition.subtasks;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        subtask = _a[_i];
                        return [4 /*yield*/, this.matcher.findBestMatch(subtask, this.config.availableSkills)];
                    case 2:
                        match = _b.sent();
                        matches.push(match);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, matches];
                }
            });
        });
    };
    /**
     * Build a DAG from decomposition and skill matches
     */
    TaskDecomposer.prototype.buildDAG = function (decomposition, matches) {
        var builder = (0, builder_1.dag)("task-".concat(Date.now()));
        var _loop_1 = function (match) {
            var subtask = decomposition.subtasks.find(function (st) { return st.id === match.subtaskId; });
            if (!subtask)
                return "continue";
            var nodeBuilder = builder
                .skillNode(subtask.id, match.skillId)
                .prompt(subtask.prompt);
            // Add dependencies
            if (subtask.dependencies.length > 0) {
                nodeBuilder = nodeBuilder.dependsOn.apply(nodeBuilder, subtask.dependencies);
            }
            nodeBuilder.done();
        };
        // Add nodes
        for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
            var match = matches_1[_i];
            _loop_1(match);
        }
        // Add outputs
        for (var _a = 0, _b = decomposition.outputs; _a < _b.length; _a++) {
            var output = _b[_a];
            builder.outputs({ name: output.name, from: output.from });
        }
        return builder.build();
    };
    /**
     * Full pipeline: decompose → match → build DAG
     */
    TaskDecomposer.prototype.decomposeToDAG = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var decomposition, matches, generatedDag;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.decompose(task)];
                    case 1:
                        decomposition = _a.sent();
                        return [4 /*yield*/, this.matchSkills(decomposition)];
                    case 2:
                        matches = _a.sent();
                        generatedDag = this.buildDAG(decomposition, matches);
                        return [2 /*return*/, { decomposition: decomposition, matches: matches, dag: generatedDag }];
                }
            });
        });
    };
    // ============================================================================
    // Private Methods
    // ============================================================================
    /**
     * Build the system prompt for task decomposition
     */
    TaskDecomposer.prototype.buildDecompositionPrompt = function () {
        return "You are a task decomposition expert. Your job is to break down complex tasks into subtasks that can be executed by specialized AI agents.\n\nAvailable skills:\n".concat(this.config.availableSkills.map(function (s) { return "- ".concat(s.id, ": ").concat(s.description); }).join('\n'), "\n\nWhen given a task, analyze it and respond with a JSON object containing:\n{\n  \"strategy\": \"Brief explanation of the decomposition approach\",\n  \"complexity\": 1-10 rating,\n  \"subtasks\": [\n    {\n      \"id\": \"unique-id\",\n      \"description\": \"What this subtask does\",\n      \"prompt\": \"The actual prompt for the agent\",\n      \"dependencies\": [\"id-of-prerequisite-task\"],\n      \"requiredCapabilities\": [\"web-search\", \"code-generation\", etc],\n      \"predictedFiles\": [\"src/components/Header.tsx\", \"src/styles/header.css\"],\n      \"singletonType\": null | \"build\" | \"lint\" | \"test\" | \"typecheck\" | \"install\" | \"deploy\"\n    }\n  ],\n  \"outputs\": [\n    { \"name\": \"output-key\", \"from\": \"subtask-id\" }\n  ]\n}\n\nGuidelines:\n1. Break tasks into 2-").concat(this.config.maxSubtasks, " subtasks (don't over-decompose)\n2. Identify clear dependencies (what must happen before what)\n3. Make prompts specific and actionable\n4. List required capabilities to help match skills\n5. Define clear outputs that capture the final result\n6. **CRITICAL**: Predict which files each subtask will modify in \"predictedFiles\"\n   - Be specific (e.g., \"src/components/Header.tsx\" not \"components\")\n   - Include all files the agent might create/modify\n   - Leave empty [] if task only reads files or does research\n7. **CRITICAL**: Set \"singletonType\" if task is build/lint/test/typecheck/install/deploy\n   - These operations should only run once at a time across all agents\n   - Examples: \"npm run build\" \u2192 \"build\", \"eslint .\" \u2192 \"lint\"\n   - Set to null for normal tasks\n\nFile Conflict Prevention:\n- If two subtasks modify THE SAME FILE, they MUST be sequential (add dependency)\n- If subtasks modify DIFFERENT FILES, they CAN be parallel (no dependency)\n- Example: Both \"add-header\" and \"add-footer\" modify \"src/App.tsx\" \u2192 make sequential\n- Example: \"add-header\" modifies \"Header.tsx\", \"add-footer\" modifies \"Footer.tsx\" \u2192 can be parallel\n\nRespond ONLY with valid JSON, no markdown formatting.");
    };
    /**
     * Parse Claude's decomposition response
     */
    TaskDecomposer.prototype.parseDecomposition = function (task, response) {
        try {
            // Strip markdown code blocks if present
            var cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            var parsed = JSON.parse(cleaned);
            return {
                originalTask: task,
                subtasks: parsed.subtasks || [],
                strategy: parsed.strategy || '',
                complexity: parsed.complexity || 5,
                outputs: parsed.outputs || [],
            };
        }
        catch (error) {
            throw new Error("Failed to parse decomposition: ".concat(error.message, "\n\nResponse:\n").concat(response));
        }
    };
    return TaskDecomposer;
}());
exports.TaskDecomposer = TaskDecomposer;

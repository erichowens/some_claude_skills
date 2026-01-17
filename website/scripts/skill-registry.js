#!/usr/bin/env npx tsx
"use strict";
/**
 * Skill Registry CLI
 *
 * Manage remote skill imports and registry operations.
 *
 * Usage:
 *   npx tsx scripts/skill-registry.ts search <query>       # Search registry
 *   npx tsx scripts/skill-registry.ts import <url>         # Import from URL/GitHub
 *   npx tsx scripts/skill-registry.ts validate <url>       # Validate remote skill
 *   npx tsx scripts/skill-registry.ts publish              # Generate registry.json
 *   npx tsx scripts/skill-registry.ts list-remote          # List all registry skills
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
var path = require("path");
var remote_registry_1 = require("./lib/remote-registry");
var skill_parser_1 = require("./lib/skill-parser");
// =============================================================================
// COMMANDS
// =============================================================================
function searchCommand(query) {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, results_1, skill;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDD0D Searching registry for: \"".concat(query, "\"...\n"));
                    return [4 /*yield*/, (0, remote_registry_1.searchRegistry)(query)];
                case 1:
                    results = _a.sent();
                    if (results.length === 0) {
                        console.log('No skills found matching your query.');
                        return [2 /*return*/];
                    }
                    console.log("Found ".concat(results.length, " skill(s):\n"));
                    for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                        skill = results_1[_i];
                        console.log("\uD83D\uDCE6 ".concat(skill.title, " (").concat(skill.id, ")"));
                        console.log("   Category: ".concat(skill.category));
                        console.log("   Tags: ".concat(skill.tags.join(', ')));
                        console.log("   Description: ".concat(skill.description.substring(0, 80), "..."));
                        if (skill.source.repo) {
                            console.log("   Source: github.com/".concat(skill.source.repo));
                        }
                        console.log('');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function importCommand(url) {
    return __awaiter(this, void 0, void 0, function () {
        var githubParsed, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDCE5 Importing skill from: ".concat(url, "\n"));
                    githubParsed = (0, remote_registry_1.parseGitHubUrl)(url);
                    if (!githubParsed) return [3 /*break*/, 2];
                    console.log("Detected GitHub URL:");
                    console.log("   Repo: ".concat(githubParsed.repo));
                    console.log("   Path: ".concat(githubParsed.path));
                    console.log("   Branch: ".concat(githubParsed.branch));
                    console.log('');
                    return [4 /*yield*/, (0, remote_registry_1.importFromGitHub)(githubParsed.repo, githubParsed.path, githubParsed.branch)];
                case 1:
                    result = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, remote_registry_1.importFromUrl)(url)];
                case 3:
                    result = _a.sent();
                    _a.label = 4;
                case 4:
                    if (result.success) {
                        console.log("\u2705 Successfully imported: ".concat(result.skillId));
                        console.log("   Path: ".concat(result.path));
                        console.log("\n\uD83D\uDCDD Next steps:");
                        console.log("   1. Run: npm run skills:generate");
                        console.log("   2. Review the imported skill");
                        console.log("   3. Commit your changes");
                    }
                    else {
                        console.log("\u274C Import failed: ".concat(result.error));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function validateCommand(url) {
    return __awaiter(this, void 0, void 0, function () {
        var githubParsed, source, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDD0D Validating skill at: ".concat(url, "\n"));
                    githubParsed = (0, remote_registry_1.parseGitHubUrl)(url);
                    source = githubParsed
                        ? {
                            type: 'github',
                            repo: githubParsed.repo,
                            path: githubParsed.path,
                            branch: githubParsed.branch,
                        }
                        : {
                            type: 'url',
                            url: url,
                        };
                    return [4 /*yield*/, (0, remote_registry_1.validateRemoteSkill)(source)];
                case 1:
                    result = _a.sent();
                    if (result.valid && result.skill) {
                        console.log("\u2705 Valid skill found!\n");
                        console.log("   ID: ".concat(result.skill.id));
                        console.log("   Title: ".concat(result.skill.title));
                        console.log("   Category: ".concat(result.skill.category));
                        console.log("   Tags: ".concat(result.skill.tags.join(', ')));
                        console.log("   Tools: ".concat(result.skill.allowedTools.join(', ')));
                        console.log("\nDescription:");
                        console.log("   ".concat(result.skill.shortDescription));
                    }
                    else {
                        console.log("\u274C Validation failed: ".concat(result.error));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function publishCommand() {
    return __awaiter(this, void 0, void 0, function () {
        var skillsDir, skills, outputPath;
        return __generator(this, function (_a) {
            console.log("\uD83D\uDCE4 Generating registry manifest...\n");
            skillsDir = path.join(process.cwd(), '..', '.claude', 'skills');
            skills = (0, skill_parser_1.parseAllSkills)(skillsDir);
            outputPath = path.join(process.cwd(), '..', 'registry.json');
            (0, remote_registry_1.writeRegistryManifest)(skills, outputPath);
            console.log("\u2705 Registry manifest written to: ".concat(outputPath));
            console.log("   Skills included: ".concat(skills.length));
            console.log("\n\uD83D\uDCDD Next steps:");
            console.log("   1. Commit registry.json");
            console.log("   2. Push to GitHub");
            console.log("   3. Your skills are now discoverable!");
            return [2 /*return*/];
        });
    });
}
function listRemoteCommand() {
    return __awaiter(this, void 0, void 0, function () {
        var registry, byCategory, _i, _a, skill, _b, _c, _d, category, skills, _e, skills_1, skill;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log("\uD83D\uDCCB Fetching skill registry...\n");
                    return [4 /*yield*/, (0, remote_registry_1.fetchRegistry)()];
                case 1:
                    registry = _f.sent();
                    if (!registry) {
                        console.log('Could not fetch registry. It may not exist yet.');
                        console.log('Run "npm run registry:publish" to create one.');
                        return [2 /*return*/];
                    }
                    console.log("Registry version: ".concat(registry.version));
                    console.log("Last updated: ".concat(new Date(registry.lastUpdated).toLocaleDateString()));
                    console.log("Total skills: ".concat(registry.skills.length, "\n"));
                    byCategory = {};
                    for (_i = 0, _a = registry.skills; _i < _a.length; _i++) {
                        skill = _a[_i];
                        if (!byCategory[skill.category]) {
                            byCategory[skill.category] = [];
                        }
                        byCategory[skill.category].push(skill);
                    }
                    for (_b = 0, _c = Object.entries(byCategory); _b < _c.length; _b++) {
                        _d = _c[_b], category = _d[0], skills = _d[1];
                        console.log("\n\uD83D\uDCC1 ".concat(category, " (").concat(skills.length, ")"));
                        for (_e = 0, skills_1 = skills; _e < skills_1.length; _e++) {
                            skill = skills_1[_e];
                            console.log("   \u2022 ".concat(skill.title, " (").concat(skill.id, ")"));
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// =============================================================================
// MAIN
// =============================================================================
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, command, arg, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = process.argv.slice(2), command = _a[0], arg = _a[1];
                    _b = command;
                    switch (_b) {
                        case 'search': return [3 /*break*/, 1];
                        case 'import': return [3 /*break*/, 3];
                        case 'validate': return [3 /*break*/, 5];
                        case 'publish': return [3 /*break*/, 7];
                        case 'list-remote': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 11];
                case 1:
                    if (!arg) {
                        console.error('Usage: skill-registry.ts search <query>');
                        process.exit(1);
                    }
                    return [4 /*yield*/, searchCommand(arg)];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 3:
                    if (!arg) {
                        console.error('Usage: skill-registry.ts import <url>');
                        process.exit(1);
                    }
                    return [4 /*yield*/, importCommand(arg)];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 5:
                    if (!arg) {
                        console.error('Usage: skill-registry.ts validate <url>');
                        process.exit(1);
                    }
                    return [4 /*yield*/, validateCommand(arg)];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 7: return [4 /*yield*/, publishCommand()];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 9: return [4 /*yield*/, listRemoteCommand()];
                case 10:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 11:
                    console.log("\nSkill Registry CLI\n\nUsage:\n  npx tsx scripts/skill-registry.ts <command> [options]\n\nCommands:\n  search <query>      Search the skill registry\n  import <url>        Import a skill from GitHub URL or raw URL\n  validate <url>      Validate a remote skill without importing\n  publish             Generate registry.json from local skills\n  list-remote         List all skills in the remote registry\n\nExamples:\n  # Search for ML skills\n  npx tsx scripts/skill-registry.ts search \"machine learning\"\n\n  # Import from GitHub\n  npx tsx scripts/skill-registry.ts import https://github.com/user/repo/blob/main/.claude/skills/my-skill/SKILL.md\n\n  # Import from raw URL\n  npx tsx scripts/skill-registry.ts import https://raw.githubusercontent.com/user/repo/main/.claude/skills/my-skill/SKILL.md\n\n  # Validate before importing\n  npx tsx scripts/skill-registry.ts validate https://github.com/user/repo/blob/main/.claude/skills/my-skill/SKILL.md\n\n  # Publish your skills\n  npx tsx scripts/skill-registry.ts publish\n");
                    _c.label = 12;
                case 12: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error('Error:', err.message);
    process.exit(1);
});

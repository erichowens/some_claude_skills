#!/usr/bin/env npx tsx
"use strict";
/**
 * Skill Generation Script
 *
 * Generates skills.ts and docs/skills/ from SKILL.md files.
 *
 * Usage:
 *   npx tsx scripts/generate-skills.ts [options]
 *
 * Options:
 *   --validate-only    Validate without generating files
 *   --verbose          Show detailed output
 *   --watch            Watch for changes and regenerate
 *   --include-remote   Include remote skills from skill-sources.yaml
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
var path = require("path");
var skill_parser_1 = require("./lib/skill-parser");
var skill_generator_1 = require("./lib/skill-generator");
var doc_generator_1 = require("./lib/doc-generator");
var types_1 = require("./lib/types");
// =============================================================================
// CONFIGURATION
// =============================================================================
var DEFAULT_OPTIONS = {
    skillsSourceDir: path.resolve(__dirname, '../../.claude/skills'),
    skillsOutputFile: path.resolve(__dirname, '../src/data/skills.ts'),
    docsOutputDir: path.resolve(__dirname, '../docs/skills'),
    skillSourcesFile: path.resolve(__dirname, '../skill-sources.yaml'),
    validateOnly: false,
    verbose: false,
    watch: false,
    includeRemote: false,
};
// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================
function generateSkills() {
    return __awaiter(this, arguments, void 0, function (options) {
        var startTime, errors, warnings, skills, validCount, warningCount, _i, skills_1, skill, validation, _a, _b, error, _c, _d, warning, status_1, warnStr, descriptionsPath, generatedDocs, removed;
        if (options === void 0) { options = DEFAULT_OPTIONS; }
        return __generator(this, function (_e) {
            startTime = Date.now();
            errors = [];
            warnings = [];
            console.log('🔄 Generating skills...\n');
            // Step 1: Parse all local skills
            console.log("\uD83D\uDCC2 Scanning ".concat(options.skillsSourceDir, "..."));
            skills = (0, skill_parser_1.parseAllSkills)(options.skillsSourceDir);
            console.log("   Found ".concat(skills.length, " skill folders\n"));
            if (skills.length === 0) {
                errors.push({
                    message: 'No skills found',
                    details: "Checked directory: ".concat(options.skillsSourceDir),
                });
                return [2 /*return*/, buildResult(false, [], errors, warnings, startTime)];
            }
            // Step 2: Validate all skills
            console.log('✅ Validating skills...');
            validCount = 0;
            warningCount = 0;
            for (_i = 0, skills_1 = skills; _i < skills_1.length; _i++) {
                skill = skills_1[_i];
                validation = (0, skill_parser_1.validateSkill)(skill);
                if (!validation.valid) {
                    for (_a = 0, _b = validation.errors; _a < _b.length; _a++) {
                        error = _b[_a];
                        errors.push({
                            skillId: skill.id,
                            file: skill.sourcePath,
                            message: error.message,
                            details: error.value ? String(error.value) : undefined,
                        });
                    }
                }
                else {
                    validCount++;
                }
                for (_c = 0, _d = validation.warnings; _c < _d.length; _c++) {
                    warning = _d[_c];
                    warnings.push({
                        skillId: skill.id,
                        file: skill.sourcePath,
                        message: warning.message,
                        suggestion: warning.suggestion,
                    });
                    warningCount++;
                }
                if (options.verbose) {
                    status_1 = validation.valid ? '✓' : '✗';
                    warnStr = validation.warnings.length > 0 ? " (".concat(validation.warnings.length, " warnings)") : '';
                    console.log("   ".concat(status_1, " ").concat(skill.id).concat(warnStr));
                }
            }
            console.log("   ".concat(validCount, "/").concat(skills.length, " valid, ").concat(warningCount, " warnings\n"));
            // Stop here if validate-only
            if (options.validateOnly) {
                console.log('🔍 Validation only mode - no files generated\n');
                return [2 /*return*/, buildResult(errors.length === 0, skills, errors, warnings, startTime)];
            }
            // Step 3: Assign categories to uncategorized skills
            assignCategories(skills);
            // Step 4: Generate skills.ts
            console.log('📝 Generating skills.ts...');
            try {
                (0, skill_generator_1.generateSkillsTs)(skills, options.skillsOutputFile);
                console.log("   Written to ".concat(options.skillsOutputFile, "\n"));
            }
            catch (error) {
                errors.push({
                    message: 'Failed to generate skills.ts',
                    details: String(error),
                });
            }
            descriptionsPath = path.join(path.dirname(options.skillsOutputFile), 'skillDescriptions.json');
            console.log('📝 Generating skillDescriptions.json...');
            try {
                (0, skill_generator_1.generateSkillDescriptionsJson)(skills, descriptionsPath);
                console.log("   Written to ".concat(descriptionsPath, "\n"));
            }
            catch (error) {
                errors.push({
                    message: 'Failed to generate skillDescriptions.json',
                    details: String(error),
                });
            }
            // Step 6: Generate docs
            console.log('📚 Generating skill docs...');
            try {
                generatedDocs = (0, doc_generator_1.generateSkillDocs)(skills, options.docsOutputDir, options.skillsSourceDir);
                console.log("   Generated ".concat(generatedDocs.length, " doc files\n"));
                removed = (0, doc_generator_1.cleanupOldDocs)(options.docsOutputDir, skills);
                if (removed.length > 0) {
                    console.log("   Removed ".concat(removed.length, " obsolete doc folders: ").concat(removed.join(', '), "\n"));
                }
            }
            catch (error) {
                errors.push({
                    message: 'Failed to generate docs',
                    details: String(error),
                });
            }
            // Step 7: Print summary
            printSummary(skills, errors, warnings);
            return [2 /*return*/, buildResult(errors.length === 0, skills, errors, warnings, startTime)];
        });
    });
}
// =============================================================================
// CATEGORY ASSIGNMENT
// =============================================================================
function assignCategories(skills) {
    // Category keywords for auto-assignment
    var categoryKeywords = {
        'AI & Machine Learning': ['ai', 'ml', 'llm', 'prompt', 'model', 'neural', 'embedding', 'rag'],
        'Code Quality & Testing': ['test', 'quality', 'lint', 'review', 'refactor', 'debug'],
        'Content & Writing': ['write', 'doc', 'content', 'copy', 'blog', 'technical-writer'],
        'Data & Analytics': ['data', 'analytics', 'pipeline', 'etl', 'visualization'],
        'Design & Creative': ['design', 'ui', 'ux', 'creative', 'visual', 'style'],
        'DevOps & Site Reliability': ['devops', 'deploy', 'ci', 'cd', 'infrastructure', 'kubernetes', 'docker', 'api', 'security'],
        'Business & Monetization': ['business', 'marketing', 'monetize', 'strategy', 'promoter'],
        'Research & Analysis': ['research', 'analysis', 'investigate', 'competitor'],
        'Productivity & Meta': ['productivity', 'workflow', 'meta', 'claude', 'skill'],
        'Lifestyle & Personal': ['lifestyle', 'personal', 'wellness', 'relationship', 'wedding', 'health'],
    };
    for (var _i = 0, skills_2 = skills; _i < skills_2.length; _i++) {
        var skill = skills_2[_i];
        if (skill.category && skill.category !== 'Uncategorized')
            continue;
        // Try to auto-assign based on keywords
        var lowerName = skill.name.toLowerCase();
        var lowerDesc = skill.description.toLowerCase();
        for (var _a = 0, _b = Object.entries(categoryKeywords); _a < _b.length; _a++) {
            var _c = _b[_a], category = _c[0], keywords = _c[1];
            for (var _d = 0, keywords_1 = keywords; _d < keywords_1.length; _d++) {
                var keyword = keywords_1[_d];
                if (lowerName.includes(keyword) || lowerDesc.includes(keyword)) {
                    skill.category = category;
                    break;
                }
            }
            if (skill.category !== 'Uncategorized')
                break;
        }
    }
}
// =============================================================================
// HELPERS
// =============================================================================
function buildResult(success, skills, errors, warnings, startTime) {
    var categoryCounts = {};
    for (var _i = 0, skills_3 = skills; _i < skills_3.length; _i++) {
        var skill = skills_3[_i];
        categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
    }
    return {
        success: success,
        skills: skills,
        errors: errors,
        warnings: warnings,
        stats: {
            totalSkills: skills.length,
            localSkills: skills.filter(function (s) { return s.source.type === 'local'; }).length,
            remoteSkills: skills.filter(function (s) { return s.source.type === 'remote'; }).length,
            submissionSkills: skills.filter(function (s) { return s.source.type === 'submission'; }).length,
            categoryCounts: categoryCounts,
            generatedDocs: skills.length,
            skippedSkills: 0,
            processingTimeMs: Date.now() - startTime,
        },
    };
}
function printSummary(skills, errors, warnings) {
    var _a;
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                     GENERATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    // Category breakdown
    console.log('📊 Skills by Category:\n');
    var byCategory = new Map();
    for (var _i = 0, skills_4 = skills; _i < skills_4.length; _i++) {
        var skill = skills_4[_i];
        byCategory.set(skill.category, (byCategory.get(skill.category) || 0) + 1);
    }
    for (var _b = 0, _c = __spreadArray([], byCategory.entries(), true).sort(function (a, b) { return b[1] - a[1]; }); _b < _c.length; _b++) {
        var _d = _c[_b], category = _d[0], count = _d[1];
        var icon = ((_a = types_1.SKILL_CATEGORIES[category]) === null || _a === void 0 ? void 0 : _a.icon) || '📦';
        console.log("   ".concat(icon, " ").concat(category, ": ").concat(count));
    }
    console.log("\n   Total: ".concat(skills.length, " skills\n"));
    // Errors
    if (errors.length > 0) {
        console.log('❌ Errors:\n');
        for (var _e = 0, errors_1 = errors; _e < errors_1.length; _e++) {
            var error = errors_1[_e];
            var prefix = error.skillId ? "[".concat(error.skillId, "] ") : '';
            console.log("   ".concat(prefix).concat(error.message));
            if (error.details) {
                console.log("      ".concat(error.details));
            }
        }
        console.log('');
    }
    // Warnings (show first 10)
    if (warnings.length > 0) {
        console.log("\u26A0\uFE0F  Warnings (".concat(warnings.length, " total):\n"));
        var shown = warnings.slice(0, 10);
        for (var _f = 0, shown_1 = shown; _f < shown_1.length; _f++) {
            var warning = shown_1[_f];
            var prefix = warning.skillId ? "[".concat(warning.skillId, "] ") : '';
            console.log("   ".concat(prefix).concat(warning.message));
        }
        if (warnings.length > 10) {
            console.log("   ... and ".concat(warnings.length - 10, " more"));
        }
        console.log('');
    }
    // Status
    if (errors.length === 0) {
        console.log('✅ Generation completed successfully!\n');
    }
    else {
        console.log('❌ Generation completed with errors\n');
    }
}
// =============================================================================
// CLI
// =============================================================================
function parseArgs() {
    var args = process.argv.slice(2);
    var options = __assign({}, DEFAULT_OPTIONS);
    for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
        var arg = args_1[_i];
        switch (arg) {
            case '--validate-only':
            case '-v':
                options.validateOnly = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--watch':
            case '-w':
                options.watch = true;
                break;
            case '--include-remote':
            case '-r':
                options.includeRemote = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }
    return options;
}
function printHelp() {
    console.log("\nSkill Generation Script\n\nUsage: npx tsx scripts/generate-skills.ts [options]\n\nOptions:\n  --validate-only, -v    Validate skills without generating files\n  --verbose              Show detailed output for each skill\n  --watch, -w            Watch for changes and regenerate\n  --include-remote, -r   Include remote skills from skill-sources.yaml\n  --help, -h             Show this help message\n\nExamples:\n  npx tsx scripts/generate-skills.ts\n  npx tsx scripts/generate-skills.ts --validate-only\n  npx tsx scripts/generate-skills.ts --verbose --watch\n");
}
// =============================================================================
// WATCH MODE
// =============================================================================
function watchMode(options) {
    return __awaiter(this, void 0, void 0, function () {
        var chokidar, watcher, debounceTimer;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('👀 Watching for changes...\n');
                    console.log("   Source: ".concat(options.skillsSourceDir));
                    console.log('   Press Ctrl+C to stop\n');
                    // Initial generation
                    return [4 /*yield*/, generateSkills(options)];
                case 1:
                    // Initial generation
                    _a.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('chokidar'); })];
                case 2:
                    chokidar = _a.sent();
                    watcher = chokidar.watch(options.skillsSourceDir, {
                        ignored: /node_modules/,
                        persistent: true,
                        ignoreInitial: true,
                    });
                    debounceTimer = null;
                    watcher.on('all', function (event, filePath) {
                        if (!filePath.endsWith('SKILL.md') && !filePath.endsWith('.md'))
                            return;
                        console.log("\n\uD83D\uDCDD ".concat(event, ": ").concat(path.relative(options.skillsSourceDir, filePath)));
                        // Debounce regeneration
                        if (debounceTimer) {
                            clearTimeout(debounceTimer);
                        }
                        debounceTimer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.log('\n🔄 Regenerating...\n');
                                        return [4 /*yield*/, generateSkills(options)];
                                    case 1:
                                        _a.sent();
                                        console.log('\n👀 Watching for changes...');
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 500);
                    });
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
        var options, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = parseArgs();
                    if (!options.watch) return [3 /*break*/, 2];
                    return [4 /*yield*/, watchMode(options)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, generateSkills(options)];
                case 3:
                    result = _a.sent();
                    process.exit(result.success ? 0 : 1);
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('Fatal error:', error);
    process.exit(1);
});

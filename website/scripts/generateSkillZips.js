#!/usr/bin/env tsx
"use strict";
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
var fs_1 = require("fs");
var path_1 = require("path");
var jszip_1 = require("jszip");
var yaml = require("js-yaml");
/**
 * Pre-generates skill folder zips at build time
 * This avoids GitHub API rate limits and CORS issues
 */
var SKILLS_DIR = path_1.default.join(__dirname, '../../.claude/skills');
var OUTPUT_DIR = path_1.default.join(__dirname, '../static/downloads/skills');
/**
 * Validates a skill folder has proper SKILL.md with valid YAML frontmatter
 */
function validateSkill(skillPath, skillId) {
    return __awaiter(this, void 0, void 0, function () {
        var errors, skillMdPath, lowercasePath, skillMdExists, _a, _b, content, lines, endIdx, i, frontmatter, parsed, readError_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    errors = [];
                    skillMdPath = path_1.default.join(skillPath, 'SKILL.md');
                    lowercasePath = path_1.default.join(skillPath, 'skill.md');
                    skillMdExists = false;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 8]);
                    return [4 /*yield*/, fs_1.promises.access(skillMdPath)];
                case 2:
                    _c.sent();
                    skillMdExists = true;
                    return [3 /*break*/, 8];
                case 3:
                    _a = _c.sent();
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, fs_1.promises.access(lowercasePath)];
                case 5:
                    _c.sent();
                    errors.push("Found skill.md but expected SKILL.md (uppercase). Rename it!");
                    return [3 /*break*/, 7];
                case 6:
                    _b = _c.sent();
                    errors.push("Missing SKILL.md file");
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 8];
                case 8:
                    if (!skillMdExists) return [3 /*break*/, 12];
                    _c.label = 9;
                case 9:
                    _c.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, fs_1.promises.readFile(skillMdPath, 'utf-8')];
                case 10:
                    content = _c.sent();
                    if (!content.startsWith('---')) {
                        errors.push("SKILL.md missing YAML frontmatter (should start with ---)");
                    }
                    else {
                        lines = content.split('\n');
                        endIdx = -1;
                        for (i = 1; i < lines.length; i++) {
                            if (lines[i].trim() === '---') {
                                endIdx = i;
                                break;
                            }
                        }
                        if (endIdx === -1) {
                            errors.push("SKILL.md has unclosed frontmatter (missing closing ---)");
                        }
                        else {
                            frontmatter = lines.slice(1, endIdx).join('\n');
                            try {
                                parsed = yaml.load(frontmatter);
                                // Check required fields
                                if (!parsed.name)
                                    errors.push("Frontmatter missing 'name' field");
                                if (!parsed.description)
                                    errors.push("Frontmatter missing 'description' field");
                            }
                            catch (yamlError) {
                                errors.push("Invalid YAML in frontmatter: ".concat(yamlError.message));
                            }
                        }
                    }
                    return [3 /*break*/, 12];
                case 11:
                    readError_1 = _c.sent();
                    errors.push("Failed to read SKILL.md: ".concat(readError_1.message));
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/, {
                        valid: errors.length === 0,
                        errors: errors
                    }];
            }
        });
    });
}
function generateSkillZips() {
    return __awaiter(this, void 0, void 0, function () {
        var skillDirs, skills, validationErrors, _i, skills_1, skill, skillId, skillPath, result, _a, _b, error, _c, skills_2, skill, skillId, skillPath, zipPath, zip, skillFolder, content, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🔨 Generating skill zips...\n');
                    // Ensure output directory exists
                    return [4 /*yield*/, fs_1.promises.mkdir(OUTPUT_DIR, { recursive: true })];
                case 1:
                    // Ensure output directory exists
                    _d.sent();
                    return [4 /*yield*/, fs_1.promises.readdir(SKILLS_DIR, { withFileTypes: true })];
                case 2:
                    skillDirs = _d.sent();
                    skills = skillDirs.filter(function (dirent) { return dirent.isDirectory(); });
                    // First pass: validate all skills
                    console.log('🔍 Validating skills...\n');
                    validationErrors = [];
                    _i = 0, skills_1 = skills;
                    _d.label = 3;
                case 3:
                    if (!(_i < skills_1.length)) return [3 /*break*/, 6];
                    skill = skills_1[_i];
                    skillId = skill.name;
                    skillPath = path_1.default.join(SKILLS_DIR, skillId);
                    return [4 /*yield*/, validateSkill(skillPath, skillId)];
                case 4:
                    result = _d.sent();
                    if (!result.valid) {
                        validationErrors.push({ skillId: skillId, errors: result.errors });
                        console.error("   \u274C ".concat(skillId, ":"));
                        for (_a = 0, _b = result.errors; _a < _b.length; _a++) {
                            error = _b[_a];
                            console.error("      - ".concat(error));
                        }
                    }
                    else {
                        console.log("   \u2713 ".concat(skillId));
                    }
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    // Fail fast if any skills are invalid
                    if (validationErrors.length > 0) {
                        console.error("\n\uD83D\uDEA8 ".concat(validationErrors.length, " skill(s) failed validation. Fix these before generating zips!\n"));
                        process.exit(1);
                    }
                    console.log('\n✅ All skills validated!\n');
                    _c = 0, skills_2 = skills;
                    _d.label = 7;
                case 7:
                    if (!(_c < skills_2.length)) return [3 /*break*/, 14];
                    skill = skills_2[_c];
                    skillId = skill.name;
                    skillPath = path_1.default.join(SKILLS_DIR, skillId);
                    zipPath = path_1.default.join(OUTPUT_DIR, "".concat(skillId, ".zip"));
                    console.log("\uD83D\uDCE6 Creating ".concat(skillId, ".zip..."));
                    _d.label = 8;
                case 8:
                    _d.trys.push([8, 12, , 13]);
                    zip = new jszip_1.default();
                    skillFolder = zip.folder(skillId);
                    if (!skillFolder) {
                        throw new Error("Failed to create zip folder for ".concat(skillId));
                    }
                    // Recursively add files to zip
                    return [4 /*yield*/, addDirectoryToZip(skillPath, skillFolder, '')];
                case 9:
                    // Recursively add files to zip
                    _d.sent();
                    return [4 /*yield*/, zip.generateAsync({
                            type: 'nodebuffer',
                            compression: 'DEFLATE',
                            compressionOptions: { level: 9 }
                        })];
                case 10:
                    content = _d.sent();
                    return [4 /*yield*/, fs_1.promises.writeFile(zipPath, content)];
                case 11:
                    _d.sent();
                    console.log("   \u2713 Created ".concat(skillId, ".zip (").concat((content.length / 1024).toFixed(1), " KB)\n"));
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _d.sent();
                    console.error("   \u2717 Failed to create ".concat(skillId, ".zip:"), error_1);
                    return [3 /*break*/, 13];
                case 13:
                    _c++;
                    return [3 /*break*/, 7];
                case 14:
                    console.log('✅ Done generating skill zips!');
                    return [2 /*return*/];
            }
        });
    });
}
function addDirectoryToZip(dirPath, zipFolder, relativePath) {
    return __awaiter(this, void 0, void 0, function () {
        var entries, _i, entries_1, entry, fullPath, entryRelativePath, subFolder, fileContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.readdir(dirPath, { withFileTypes: true })];
                case 1:
                    entries = _a.sent();
                    _i = 0, entries_1 = entries;
                    _a.label = 2;
                case 2:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 8];
                    entry = entries_1[_i];
                    fullPath = path_1.default.join(dirPath, entry.name);
                    entryRelativePath = path_1.default.join(relativePath, entry.name);
                    if (!entry.isDirectory()) return [3 /*break*/, 5];
                    // Skip .git and node_modules
                    if (entry.name === '.git' || entry.name === 'node_modules') {
                        return [3 /*break*/, 7];
                    }
                    subFolder = zipFolder.folder(entry.name);
                    if (!subFolder) return [3 /*break*/, 4];
                    return [4 /*yield*/, addDirectoryToZip(fullPath, subFolder, entryRelativePath)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    if (!entry.isFile()) return [3 /*break*/, 7];
                    return [4 /*yield*/, fs_1.promises.readFile(fullPath)];
                case 6:
                    fileContent = _a.sent();
                    zipFolder.file(entry.name, fileContent);
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Run the script
generateSkillZips().catch(function (error) {
    console.error('Fatal error:', error);
    process.exit(1);
});

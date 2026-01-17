#!/usr/bin/env npx tsx
"use strict";
/**
 * Bundle Generation Script
 *
 * Generates bundles.ts from YAML bundle definitions.
 *
 * Usage:
 *   npx tsx scripts/generate-bundles.ts [options]
 *
 * Options:
 *   --validate-only    Validate without generating files
 *   --verbose          Show detailed output
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
var fs = require("fs");
var path = require("path");
var yaml_1 = require("yaml");
// =============================================================================
// CONFIGURATION
// =============================================================================
var BUNDLES_DIR = path.resolve(__dirname, '../bundles');
var OUTPUT_FILE = path.resolve(__dirname, '../src/data/bundles.ts');
var VALID_AUDIENCES = [
    'developers',
    'entrepreneurs',
    'teams',
    'technical-writers',
    'ml-engineers',
    'newcomers',
    'everyone',
];
var VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
function validateBundle(yaml, filename) {
    var errors = [];
    // Required fields
    if (!yaml.name)
        errors.push({ file: filename, message: 'Missing required field: name' });
    if (!yaml.title)
        errors.push({ file: filename, message: 'Missing required field: title' });
    if (!yaml.description)
        errors.push({ file: filename, message: 'Missing required field: description' });
    if (!yaml.skills || yaml.skills.length === 0) {
        errors.push({ file: filename, message: 'Bundle must have at least one skill' });
    }
    if (!yaml.install_command)
        errors.push({ file: filename, message: 'Missing required field: install_command' });
    // Audience validation
    if (!yaml.audience || !VALID_AUDIENCES.includes(yaml.audience)) {
        errors.push({
            file: filename,
            message: "Invalid audience: ".concat(yaml.audience, ". Must be one of: ").concat(VALID_AUDIENCES.join(', ')),
            field: 'audience',
        });
    }
    // Difficulty validation
    if (!yaml.difficulty || !VALID_DIFFICULTIES.includes(yaml.difficulty)) {
        errors.push({
            file: filename,
            message: "Invalid difficulty: ".concat(yaml.difficulty, ". Must be one of: ").concat(VALID_DIFFICULTIES.join(', ')),
            field: 'difficulty',
        });
    }
    // Estimated cost validation
    if (!yaml.estimated_cost) {
        errors.push({ file: filename, message: 'Missing required field: estimated_cost' });
    }
    else {
        if (typeof yaml.estimated_cost.tokens !== 'number' || yaml.estimated_cost.tokens < 0) {
            errors.push({ file: filename, message: 'estimated_cost.tokens must be a non-negative number' });
        }
        if (typeof yaml.estimated_cost.usd !== 'number' || yaml.estimated_cost.usd < 0) {
            errors.push({ file: filename, message: 'estimated_cost.usd must be a non-negative number' });
        }
    }
    // Skills validation
    if (yaml.skills) {
        for (var _i = 0, _a = yaml.skills; _i < _a.length; _i++) {
            var skill = _a[_i];
            if (!skill.id) {
                errors.push({ file: filename, message: 'Each skill must have an id' });
            }
            if (!skill.role) {
                errors.push({ file: filename, message: "Skill \"".concat(skill.id, "\" must have a role description") });
            }
        }
    }
    return errors;
}
// =============================================================================
// YAML TO BUNDLE CONVERSION
// =============================================================================
function yamlToBundle(yaml) {
    return {
        id: yaml.name,
        title: yaml.title,
        description: yaml.description.trim(),
        audience: yaml.audience,
        difficulty: yaml.difficulty,
        skills: yaml.skills.map(function (s) { return ({
            id: s.id,
            role: s.role,
            optional: s.optional,
        }); }),
        installCommand: yaml.install_command,
        estimatedCost: {
            tokens: yaml.estimated_cost.tokens,
            usd: yaml.estimated_cost.usd,
        },
        useCases: yaml.use_cases || [],
        tags: yaml.tags || [],
        heroImage: yaml.hero_image,
        featured: yaml.featured,
        relatedBundles: yaml.related_bundles,
    };
}
// =============================================================================
// CODE GENERATION
// =============================================================================
function generateBundlesTs(bundles) {
    var bundlesJson = JSON.stringify(bundles, null, 2);
    return "/**\n * Generated Bundle Data\n *\n * Auto-generated from YAML files in /bundles\n * DO NOT EDIT DIRECTLY - run 'npm run generate:bundles' instead\n *\n * Generated: ".concat(new Date().toISOString(), "\n */\n\nimport type { Bundle } from '../types/bundle';\n\nexport const bundles: Bundle[] = ").concat(bundlesJson, ";\n\nexport function getBundleById(id: string): Bundle | undefined {\n  return bundles.find((b) => b.id === id);\n}\n\nexport function getFeaturedBundles(): Bundle[] {\n  return bundles.filter((b) => b.featured);\n}\n\nexport function getBundlesByAudience(audience: string): Bundle[] {\n  return bundles.filter((b) => b.audience === audience);\n}\n\nexport function getBundlesByDifficulty(difficulty: string): Bundle[] {\n  return bundles.filter((b) => b.difficulty === difficulty);\n}\n\nexport function getBundlesByTag(tag: string): Bundle[] {\n  return bundles.filter((b) => b.tags.includes(tag));\n}\n\nexport function searchBundles(query: string): Bundle[] {\n  const lowerQuery = query.toLowerCase();\n  return bundles.filter(\n    (b) =>\n      b.title.toLowerCase().includes(lowerQuery) ||\n      b.description.toLowerCase().includes(lowerQuery) ||\n      b.tags.some((t) => t.toLowerCase().includes(lowerQuery))\n  );\n}\n");
}
// =============================================================================
// MAIN
// =============================================================================
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, validateOnly, verbose, files, bundles, allErrors, _i, files_1, file, filePath, content, yaml, errors, _a, allErrors_1, error, output, byAudience, _b, bundles_1, bundle, _c, _d, _e, audience, count, byDifficulty, _f, bundles_2, bundle, _g, _h, _j, difficulty, count, featuredCount;
        return __generator(this, function (_k) {
            args = process.argv.slice(2);
            validateOnly = args.includes('--validate-only');
            verbose = args.includes('--verbose');
            console.log('🔄 Generating bundles...\n');
            // Check if bundles directory exists
            if (!fs.existsSync(BUNDLES_DIR)) {
                console.error("\u274C Bundles directory not found: ".concat(BUNDLES_DIR));
                process.exit(1);
            }
            files = fs.readdirSync(BUNDLES_DIR).filter(function (f) { return f.endsWith('.yaml') || f.endsWith('.yml'); });
            console.log("\uD83D\uDCC2 Found ".concat(files.length, " bundle files in ").concat(BUNDLES_DIR, "\n"));
            if (files.length === 0) {
                console.error('❌ No YAML files found in bundles directory');
                process.exit(1);
            }
            bundles = [];
            allErrors = [];
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                filePath = path.join(BUNDLES_DIR, file);
                content = fs.readFileSync(filePath, 'utf-8');
                try {
                    yaml = yaml_1.default.parse(content);
                    errors = validateBundle(yaml, file);
                    if (errors.length > 0) {
                        allErrors.push.apply(allErrors, errors);
                        if (verbose) {
                            console.log("   \u2717 ".concat(file, " (").concat(errors.length, " errors)"));
                        }
                    }
                    else {
                        bundles.push(yamlToBundle(yaml));
                        if (verbose) {
                            console.log("   \u2713 ".concat(file));
                        }
                    }
                }
                catch (err) {
                    allErrors.push({
                        file: file,
                        message: "Failed to parse YAML: ".concat(err instanceof Error ? err.message : String(err)),
                    });
                }
            }
            // Report validation results
            console.log("\n\u2705 Validated: ".concat(bundles.length, "/").concat(files.length, " bundles\n"));
            if (allErrors.length > 0) {
                console.log('❌ Validation errors:\n');
                for (_a = 0, allErrors_1 = allErrors; _a < allErrors_1.length; _a++) {
                    error = allErrors_1[_a];
                    console.log("   [".concat(error.file, "] ").concat(error.message));
                }
                console.log('');
                process.exit(1);
            }
            // Stop if validate-only
            if (validateOnly) {
                console.log('🔍 Validation only mode - no files generated\n');
                process.exit(0);
            }
            // Generate bundles.ts
            console.log('📝 Generating bundles.ts...');
            output = generateBundlesTs(bundles);
            fs.writeFileSync(OUTPUT_FILE, output);
            console.log("   Written to ".concat(OUTPUT_FILE, "\n"));
            // Print summary
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('                     GENERATION SUMMARY');
            console.log('═══════════════════════════════════════════════════════════════\n');
            console.log('📦 Bundles by Audience:\n');
            byAudience = new Map();
            for (_b = 0, bundles_1 = bundles; _b < bundles_1.length; _b++) {
                bundle = bundles_1[_b];
                byAudience.set(bundle.audience, (byAudience.get(bundle.audience) || 0) + 1);
            }
            for (_c = 0, _d = __spreadArray([], byAudience.entries(), true).sort(function (a, b) { return b[1] - a[1]; }); _c < _d.length; _c++) {
                _e = _d[_c], audience = _e[0], count = _e[1];
                console.log("   ".concat(audience, ": ").concat(count));
            }
            console.log('\n📊 Bundles by Difficulty:\n');
            byDifficulty = new Map();
            for (_f = 0, bundles_2 = bundles; _f < bundles_2.length; _f++) {
                bundle = bundles_2[_f];
                byDifficulty.set(bundle.difficulty, (byDifficulty.get(bundle.difficulty) || 0) + 1);
            }
            for (_g = 0, _h = __spreadArray([], byDifficulty.entries(), true); _g < _h.length; _g++) {
                _j = _h[_g], difficulty = _j[0], count = _j[1];
                console.log("   ".concat(difficulty, ": ").concat(count));
            }
            featuredCount = bundles.filter(function (b) { return b.featured; }).length;
            console.log("\n\u2B50 Featured bundles: ".concat(featuredCount));
            console.log("\uD83D\uDCE6 Total bundles: ".concat(bundles.length, "\n"));
            console.log('✅ Generation completed successfully!\n');
            return [2 /*return*/];
        });
    });
}
main().catch(function (error) {
    console.error('Fatal error:', error);
    process.exit(1);
});

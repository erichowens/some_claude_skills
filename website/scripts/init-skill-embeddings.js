"use strict";
/**
 * Initialize Skill Embeddings Cache
 *
 * Precomputes embeddings for all available skills and stores them in cache.
 * Run this script after adding/modifying skills to update the cache.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/init-skill-embeddings.ts
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
var embedding_service_1 = require("../src/dag/core/embedding-service");
var embedding_cache_1 = require("../src/dag/core/embedding-cache");
var path = require("path");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, skills, embeddingService, cachePath, embeddingCache, missing, stats_1, buildSkillText, texts, batchSize, processed, _loop_1, i, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) {
                        console.error('ERROR: OPENAI_API_KEY environment variable not set');
                        console.error('Usage: OPENAI_API_KEY=sk-... npx tsx scripts/init-skill-embeddings.ts');
                        process.exit(1);
                    }
                    console.log('🚀 Initializing skill embeddings cache...\n');
                    skills = (0, skill_loader_1.loadAvailableSkills)();
                    console.log("\uD83D\uDCDA Loaded ".concat(skills.length, " skills\n"));
                    embeddingService = new embedding_service_1.EmbeddingService({
                        apiKey: apiKey,
                        model: 'text-embedding-3-small',
                    });
                    cachePath = path.join(process.cwd(), '.cache', 'skill-embeddings.json');
                    embeddingCache = new embedding_cache_1.EmbeddingCache({
                        cachePath: cachePath,
                        autoSave: false, // Manual save at end for performance
                    });
                    missing = embeddingCache.findMissing(skills);
                    if (missing.length === 0) {
                        console.log('✅ All skills already have embeddings cached');
                        console.log('\nCache stats:');
                        stats_1 = embeddingCache.getStats();
                        console.log("  Total embeddings: ".concat(stats_1.totalEmbeddings));
                        console.log("  Last updated: ".concat(stats_1.lastUpdated.toLocaleString()));
                        console.log("  Model: ".concat(stats_1.model));
                        console.log("  Cache size: ".concat((stats_1.cacheSize / 1024).toFixed(2), " KB"));
                        return [2 /*return*/];
                    }
                    console.log("\uD83D\uDD27 Need to compute embeddings for ".concat(missing.length, " skills\n"));
                    buildSkillText = function (skill) {
                        var parts = [
                            skill.name,
                            skill.description,
                            skill.tags.join(', '),
                        ];
                        return parts.filter(function (p) { return p && p.length > 0; }).join('. ');
                    };
                    texts = missing.map(function (skill) { return buildSkillText(skill); });
                    batchSize = 100;
                    processed = 0;
                    _loop_1 = function (i) {
                        var batchTexts, batchSkills, results_1, error_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    batchTexts = texts.slice(i, i + batchSize);
                                    batchSkills = missing.slice(i, i + batchSize);
                                    console.log("Processing batch ".concat(Math.floor(i / batchSize) + 1, "/").concat(Math.ceil(texts.length / batchSize), " (").concat(batchSkills.length, " skills)..."));
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 5, , 6]);
                                    return [4 /*yield*/, embeddingService.embedBatch(batchTexts)];
                                case 2:
                                    results_1 = _b.sent();
                                    // Cache the embeddings
                                    embeddingCache.setBatch(batchSkills.map(function (skill, idx) { return ({
                                        skillId: skill.id,
                                        embedding: results_1[idx].embedding,
                                        model: results_1[idx].model,
                                        description: skill.description,
                                    }); }));
                                    processed += batchSkills.length;
                                    console.log("  \u2713 Cached ".concat(processed, "/").concat(texts.length, " embeddings"));
                                    if (!(i + batchSize < texts.length)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                case 3:
                                    _b.sent();
                                    _b.label = 4;
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_1 = _b.sent();
                                    console.error("  \u2717 Error processing batch:", error_1);
                                    throw error_1;
                                case 6: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < texts.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i += batchSize;
                    return [3 /*break*/, 1];
                case 4:
                    // Save cache
                    console.log('\n💾 Saving cache...');
                    embeddingCache.save();
                    // Show stats
                    console.log('\n✅ Done! Cache stats:');
                    stats = embeddingCache.getStats();
                    console.log("  Total embeddings: ".concat(stats.totalEmbeddings));
                    console.log("  Last updated: ".concat(stats.lastUpdated.toLocaleString()));
                    console.log("  Model: ".concat(stats.model));
                    console.log("  Cache size: ".concat((stats.cacheSize / 1024).toFixed(2), " KB"));
                    console.log("  Cache location: ".concat(cachePath));
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});

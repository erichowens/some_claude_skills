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
var fs = require("fs");
var path = require("path");
var dotenv = require("dotenv");
// Load environment variables
dotenv.config();
// Simple hash function for consistent "random" baseline per skill
function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
// Generate a consistent baseline for a skill (8-35 views)
function getBaseline(skillId) {
    var hash = hashCode(skillId);
    return 8 + (hash % 28); // Range: 8-35
}
function getAllSkillIds() {
    var metadataPath = path.join(__dirname, '../src/data/skillMetadata.json');
    try {
        var data = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        return Object.keys(data.skills);
    }
    catch (error) {
        console.warn('⚠️  Could not read skill metadata, using empty list');
        return [];
    }
}
function fetchPlausibleStats() {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, siteId, allSkillIds, url, response, data, realViews_1, _i, _a, result, now_1, stats, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    apiKey = process.env.PLAUSIBLE_API_KEY;
                    siteId = process.env.PLAUSIBLE_SITE_ID || 'someclaudeskills.com';
                    allSkillIds = getAllSkillIds();
                    if (!apiKey) {
                        console.warn('⚠️  PLAUSIBLE_API_KEY not found. Using baseline data.');
                        return [2 /*return*/, generateBaselineStats(allSkillIds)];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    console.log('📊 Fetching Plausible stats...');
                    url = new URL('https://plausible.io/api/v1/stats/breakdown');
                    url.searchParams.append('site_id', siteId);
                    url.searchParams.append('period', '30d'); // Last 30 days
                    url.searchParams.append('property', 'event:props:skill'); // Custom property from tracking
                    url.searchParams.append('metrics', 'visitors');
                    url.searchParams.append('filters', 'event:name==Skill Viewed');
                    return [4 /*yield*/, fetch(url.toString(), {
                            headers: {
                                'Authorization': "Bearer ".concat(apiKey),
                            },
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) {
                        throw new Error("Plausible API error: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    realViews_1 = new Map();
                    for (_i = 0, _a = data.results; _i < _a.length; _i++) {
                        result = _a[_i];
                        realViews_1.set(result.skill, result.visitors);
                    }
                    console.log("\u2705 Fetched real stats for ".concat(realViews_1.size, " skills"));
                    now_1 = new Date().toISOString();
                    stats = allSkillIds.map(function (skillId) { return ({
                        skillId: skillId,
                        views: getBaseline(skillId) + (realViews_1.get(skillId) || 0),
                        lastUpdated: now_1,
                    }); });
                    // Sort by views descending for nicer output
                    stats.sort(function (a, b) { return b.views - a.views; });
                    console.log("\uD83D\uDCC8 Generated stats for ".concat(stats.length, " skills (baseline + real)"));
                    return [2 /*return*/, stats];
                case 4:
                    error_1 = _b.sent();
                    console.error('❌ Error fetching Plausible stats:', error_1);
                    console.warn('⚠️  Falling back to baseline data');
                    return [2 /*return*/, generateBaselineStats(allSkillIds)];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function generateBaselineStats(skillIds) {
    console.log('🎲 Generating baseline stats...');
    var now = new Date().toISOString();
    return skillIds.map(function (skillId) { return ({
        skillId: skillId,
        views: getBaseline(skillId),
        lastUpdated: now,
    }); });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var stats, outputPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting Plausible stats fetch...\n');
                    return [4 /*yield*/, fetchPlausibleStats()];
                case 1:
                    stats = _a.sent();
                    outputPath = path.join(__dirname, '../src/data/plausibleStats.json');
                    fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
                    console.log("\n\u2713 Stats written to ".concat(outputPath));
                    console.log("\u2713 Total skills with stats: ".concat(stats.length));
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('Fatal error:', error);
    process.exit(1);
});

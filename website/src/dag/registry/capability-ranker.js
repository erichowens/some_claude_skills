"use strict";
/**
 * Capability Ranker
 *
 * Ranks skill matches by fit, performance, and capability requirements.
 * Provides advanced ranking algorithms for optimal skill selection.
 *
 * @module dag/registry/capability-ranker
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
exports.capabilityRanker = exports.CapabilityRanker = void 0;
exports.rankSkills = rankSkills;
exports.compareSkills = compareSkills;
exports.getComplementarySkills = getComplementarySkills;
var skill_registry_1 = require("./skill-registry");
var semantic_matcher_1 = require("./semantic-matcher");
// =============================================================================
// CAPABILITY RANKER CLASS
// =============================================================================
/**
 * CapabilityRanker provides advanced ranking for skill selection.
 *
 * @example
 * ```typescript
 * const ranker = new CapabilityRanker();
 *
 * // Rank skills for a query with capability requirements
 * const ranked = ranker.rank('Build a REST API', {
 *   capabilities: { needsWrite: true, needsBash: true }
 * });
 *
 * // Compare two skills
 * const comparison = ranker.compare(
 *   'ai-engineer',
 *   'backend-architect',
 *   'Build a chatbot API'
 * );
 * ```
 */
var CapabilityRanker = /** @class */ (function () {
    function CapabilityRanker() {
        // Default ranking weights
        this.defaultWeights = {
            semanticWeight: 0.35,
            capabilityWeight: 0.25,
            performanceWeight: 0.15,
            recencyWeight: 0.05,
            popularityWeight: 0.10,
            specificityWeight: 0.10,
        };
    }
    /**
     * Rank skills for a query
     */
    CapabilityRanker.prototype.rank = function (query, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a = options.capabilities, capabilities = _a === void 0 ? {} : _a, _b = options.criteria, criteria = _b === void 0 ? {} : _b, _c = options.matchOptions, matchOptions = _c === void 0 ? {} : _c, _d = options.maxResults, maxResults = _d === void 0 ? 10 : _d;
        // Merge criteria with defaults
        var weights = __assign(__assign({}, this.defaultWeights), criteria);
        // Get semantic matches
        var matches = semantic_matcher_1.semanticMatcher.match(query, __assign(__assign({}, matchOptions), { maxResults: maxResults * 2 }));
        // Calculate capability matches and rankings
        var ranked = matches.map(function (match) {
            var capabilityMatch = _this.assessCapabilityMatch(match.entry.capabilities, capabilities);
            var rankingBreakdown = _this.calculateRankingScores(match, capabilityMatch, weights);
            return __assign(__assign({}, match), { rank: 0, // Will be set after sorting
                rankingBreakdown: rankingBreakdown, capabilityMatch: capabilityMatch });
        });
        // Sort by final score
        ranked.sort(function (a, b) { return b.rankingBreakdown.finalScore - a.rankingBreakdown.finalScore; });
        // Assign ranks
        ranked.forEach(function (r, i) {
            r.rank = i + 1;
        });
        // Filter to max results
        return ranked.slice(0, maxResults);
    };
    /**
     * Assess how well a skill's capabilities match requirements
     */
    CapabilityRanker.prototype.assessCapabilityMatch = function (skillCaps, required) {
        var matched = [];
        var missing = [];
        // Check each capability
        var checks = [
            [required.needsRead, skillCaps.canRead, 'read'],
            [required.needsWrite, skillCaps.canWrite, 'write'],
            [required.needsBash, skillCaps.canBash, 'bash'],
            [required.needsWeb, skillCaps.canWeb, 'web'],
            [required.needsMcp, skillCaps.canMcp, 'mcp'],
        ];
        for (var _i = 0, checks_1 = checks; _i < checks_1.length; _i++) {
            var _a = checks_1[_i], needed = _a[0], has = _a[1], name_1 = _a[2];
            if (needed) {
                if (has) {
                    matched.push(name_1);
                }
                else {
                    missing.push(name_1);
                }
            }
        }
        // Check required tools
        if (required.requiredTools) {
            var _loop_1 = function (tool) {
                if (skillCaps.primaryTools.some(function (t) {
                    return t.toLowerCase().includes(tool.toLowerCase());
                })) {
                    matched.push("tool:".concat(tool));
                }
                else {
                    missing.push("tool:".concat(tool));
                }
            };
            for (var _b = 0, _c = required.requiredTools; _b < _c.length; _b++) {
                var tool = _c[_b];
                _loop_1(tool);
            }
        }
        // Check preferred domains
        if (required.preferredDomains) {
            var _loop_2 = function (domain) {
                if (skillCaps.domains.some(function (d) {
                    return d.toLowerCase().includes(domain.toLowerCase());
                })) {
                    matched.push("domain:".concat(domain));
                }
            };
            for (var _d = 0, _e = required.preferredDomains; _d < _e.length; _d++) {
                var domain = _e[_d];
                _loop_2(domain);
            }
        }
        var total = matched.length + missing.length;
        var matchPercentage = total > 0 ? matched.length / total : 1;
        return {
            meetsRequirements: missing.length === 0,
            matchedCapabilities: matched,
            missingCapabilities: missing,
            matchPercentage: matchPercentage,
        };
    };
    /**
     * Calculate ranking scores
     */
    CapabilityRanker.prototype.calculateRankingScores = function (match, capabilityMatch, weights) {
        var entry = match.entry;
        var metrics = entry.metrics;
        // Semantic score from matcher
        var semanticScore = match.score;
        // Capability score
        var capabilityScore = capabilityMatch.matchPercentage;
        // Performance score (success rate)
        var performanceScore = metrics.invocationCount > 0
            ? metrics.successRate
            : 0.5; // Neutral for unused skills
        // Recency score (time since last use)
        var recencyScore = 0.5; // Neutral default
        if (metrics.lastUsed) {
            var hoursSinceUse = (Date.now() - metrics.lastUsed.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUse < 1) {
                recencyScore = 1.0;
            }
            else if (hoursSinceUse < 24) {
                recencyScore = 0.8;
            }
            else if (hoursSinceUse < 168) { // 1 week
                recencyScore = 0.6;
            }
            else {
                recencyScore = 0.4;
            }
        }
        // Popularity score (invocation count, normalized)
        // Assume max popular skill has ~1000 invocations
        var popularityScore = Math.min(1, metrics.invocationCount / 1000);
        // Specificity score (fewer activation keywords = more specific)
        var specificityScore = Math.max(0, 1 - (entry.activationKeywords.length / 20));
        // Calculate weighted final score
        var finalScore = semanticScore * weights.semanticWeight +
            capabilityScore * weights.capabilityWeight +
            performanceScore * weights.performanceWeight +
            recencyScore * weights.recencyWeight +
            popularityScore * weights.popularityWeight +
            specificityScore * weights.specificityWeight;
        return {
            semanticScore: semanticScore,
            capabilityScore: capabilityScore,
            performanceScore: performanceScore,
            recencyScore: recencyScore,
            popularityScore: popularityScore,
            specificityScore: specificityScore,
            finalScore: finalScore,
        };
    };
    /**
     * Compare two skills for a query
     */
    CapabilityRanker.prototype.compare = function (skillId1, skillId2, query) {
        var skill1 = skill_registry_1.skillRegistry.get(skillId1);
        var skill2 = skill_registry_1.skillRegistry.get(skillId2);
        if (!skill1 || !skill2) {
            throw new Error("Skill not found: ".concat(!skill1 ? skillId1 : skillId2));
        }
        // Get rankings for both
        var ranked = this.rank(query, { maxResults: 100 });
        var rank1 = ranked.find(function (r) { return r.entry.skill.id === skillId1; });
        var rank2 = ranked.find(function (r) { return r.entry.skill.id === skillId2; });
        if (!rank1 || !rank2) {
            throw new Error('One or both skills did not match the query');
        }
        // Compare aspects
        var aspects = [
            {
                name: 'Semantic Match',
                skill1Score: rank1.rankingBreakdown.semanticScore,
                skill2Score: rank2.rankingBreakdown.semanticScore,
                better: this.compareTwoScores(rank1.rankingBreakdown.semanticScore, rank2.rankingBreakdown.semanticScore),
            },
            {
                name: 'Capability Match',
                skill1Score: rank1.rankingBreakdown.capabilityScore,
                skill2Score: rank2.rankingBreakdown.capabilityScore,
                better: this.compareTwoScores(rank1.rankingBreakdown.capabilityScore, rank2.rankingBreakdown.capabilityScore),
            },
            {
                name: 'Performance',
                skill1Score: rank1.rankingBreakdown.performanceScore,
                skill2Score: rank2.rankingBreakdown.performanceScore,
                better: this.compareTwoScores(rank1.rankingBreakdown.performanceScore, rank2.rankingBreakdown.performanceScore),
            },
            {
                name: 'Specificity',
                skill1Score: rank1.rankingBreakdown.specificityScore,
                skill2Score: rank2.rankingBreakdown.specificityScore,
                better: this.compareTwoScores(rank1.rankingBreakdown.specificityScore, rank2.rankingBreakdown.specificityScore),
            },
        ];
        var scoreDiff = rank1.rankingBreakdown.finalScore - rank2.rankingBreakdown.finalScore;
        var winner = scoreDiff > 0.05 ? -1 : scoreDiff < -0.05 ? 1 : 0;
        // Generate explanation
        var explanation = this.generateComparisonExplanation(skill1, skill2, rank1, rank2, winner);
        return {
            skills: [skill1, skill2],
            winner: winner,
            scoreDifference: Math.abs(scoreDiff),
            explanation: explanation,
            aspects: aspects,
        };
    };
    /**
     * Compare two scores
     */
    CapabilityRanker.prototype.compareTwoScores = function (s1, s2) {
        var diff = Math.abs(s1 - s2);
        if (diff < 0.05)
            return 'tie';
        return s1 > s2 ? 'skill1' : 'skill2';
    };
    /**
     * Generate comparison explanation
     */
    CapabilityRanker.prototype.generateComparisonExplanation = function (skill1, skill2, rank1, rank2, winner) {
        var name1 = skill1.skill.title;
        var name2 = skill2.skill.title;
        if (winner === 0) {
            return "".concat(name1, " and ").concat(name2, " are equally suited for this task.");
        }
        var better = winner === -1 ? rank1 : rank2;
        var worse = winner === -1 ? rank2 : rank1;
        var betterName = winner === -1 ? name1 : name2;
        var worseName = winner === -1 ? name2 : name1;
        var reasons = [];
        if (better.rankingBreakdown.semanticScore > worse.rankingBreakdown.semanticScore + 0.1) {
            reasons.push('better keyword match');
        }
        if (better.capabilityMatch.matchPercentage > worse.capabilityMatch.matchPercentage) {
            reasons.push('more relevant capabilities');
        }
        if (better.rankingBreakdown.performanceScore > worse.rankingBreakdown.performanceScore + 0.1) {
            reasons.push('higher success rate');
        }
        var reasonText = reasons.length > 0
            ? " due to ".concat(reasons.join(', '))
            : '';
        return "".concat(betterName, " is better suited than ").concat(worseName).concat(reasonText, ".");
    };
    /**
     * Get top skills for a domain
     */
    CapabilityRanker.prototype.getTopForDomain = function (domain, count) {
        if (count === void 0) { count = 5; }
        var entries = skill_registry_1.skillRegistry.query({
            domain: domain,
            activeOnly: true,
        });
        // Sort by success rate, then by invocation count
        return entries
            .sort(function (a, b) {
            var rateA = a.metrics.invocationCount > 0 ? a.metrics.successRate : 0.5;
            var rateB = b.metrics.invocationCount > 0 ? b.metrics.successRate : 0.5;
            if (Math.abs(rateA - rateB) > 0.05) {
                return rateB - rateA;
            }
            return b.metrics.invocationCount - a.metrics.invocationCount;
        })
            .slice(0, count);
    };
    /**
     * Recommend skills for a workflow
     */
    CapabilityRanker.prototype.recommendForWorkflow = function (steps, options) {
        if (options === void 0) { options = {}; }
        var _a = options.perStep, perStep = _a === void 0 ? 3 : _a;
        var recommendations = new Map();
        for (var _i = 0, steps_1 = steps; _i < steps_1.length; _i++) {
            var step = steps_1[_i];
            var ranked = this.rank(step, { maxResults: perStep });
            recommendations.set(step, ranked);
        }
        return recommendations;
    };
    /**
     * Find complementary skills
     */
    CapabilityRanker.prototype.findComplementary = function (skillId, count) {
        var _a;
        if (count === void 0) { count = 5; }
        var entry = skill_registry_1.skillRegistry.get(skillId);
        if (!entry)
            return [];
        // Get from pairsWith
        var paired = ((_a = entry.skill.pairsWith) === null || _a === void 0 ? void 0 : _a.map(function (p) { return skill_registry_1.skillRegistry.get(p.skill); }).filter(function (e) { return e !== undefined; })) || [];
        if (paired.length >= count) {
            return paired.slice(0, count);
        }
        // Also find skills in same category
        var sameCategory = skill_registry_1.skillRegistry.query({
            category: entry.skill.category,
            activeOnly: true,
        }).filter(function (e) { return e.skill.id !== skillId; });
        return __spreadArray(__spreadArray([], paired, true), sameCategory, true).slice(0, count);
    };
    return CapabilityRanker;
}());
exports.CapabilityRanker = CapabilityRanker;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global capability ranker instance */
exports.capabilityRanker = new CapabilityRanker();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Rank skills using global ranker
 */
function rankSkills(query, options) {
    return exports.capabilityRanker.rank(query, options);
}
/**
 * Compare two skills for a query
 */
function compareSkills(skillId1, skillId2, query) {
    return exports.capabilityRanker.compare(skillId1, skillId2, query);
}
/**
 * Get complementary skills
 */
function getComplementarySkills(skillId, count) {
    return exports.capabilityRanker.findComplementary(skillId, count);
}

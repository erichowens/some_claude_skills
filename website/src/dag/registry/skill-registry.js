"use strict";
/**
 * Skill Registry
 *
 * Central skill catalog with metadata, capabilities, and performance tracking.
 * Provides the foundation for skill discovery and matching in the DAG framework.
 *
 * @module dag/registry/skill-registry
 */
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
exports.skillRegistry = exports.SkillRegistry = void 0;
exports.initializeRegistry = initializeRegistry;
exports.getSkill = getSkill;
exports.searchSkills = searchSkills;
exports.querySkills = querySkills;
var skills_1 = require("../../data/skills");
// =============================================================================
// SKILL REGISTRY CLASS
// =============================================================================
/**
 * SkillRegistry provides centralized skill catalog with discovery capabilities.
 *
 * @example
 * ```typescript
 * const registry = new SkillRegistry();
 *
 * // Load skills from data
 * registry.initialize();
 *
 * // Query skills
 * const aiSkills = registry.query({ category: 'AI & Machine Learning' });
 *
 * // Get specific skill
 * const skill = registry.get('ai-engineer');
 *
 * // Search by keyword
 * const matches = registry.search('LLM chatbot RAG');
 * ```
 */
var SkillRegistry = /** @class */ (function () {
    function SkillRegistry() {
        this.entries = new Map();
        this.initialized = false;
    }
    /**
     * Initialize registry with skills from data
     */
    SkillRegistry.prototype.initialize = function (skills) {
        if (skills === void 0) { skills = skills_1.ALL_SKILLS; }
        this.entries.clear();
        for (var _i = 0, skills_2 = skills; _i < skills_2.length; _i++) {
            var skill = skills_2[_i];
            var entry = this.createEntry(skill);
            this.entries.set(skill.id, entry);
        }
        this.initialized = true;
    };
    /**
     * Create a registry entry from a skill
     */
    SkillRegistry.prototype.createEntry = function (skill) {
        var activationKeywords = this.parseActivationKeywords(skill.description);
        var exclusionKeywords = this.parseExclusionKeywords(skill.description);
        var capabilities = this.inferCapabilities(skill);
        return {
            skill: skill,
            activationKeywords: activationKeywords,
            exclusionKeywords: exclusionKeywords,
            capabilities: capabilities,
            metrics: this.createDefaultMetrics(),
            isActive: true,
            registeredAt: new Date(),
        };
    };
    /**
     * Parse activation keywords from description
     * Looks for patterns like: Activate on "X", "Y", "Z"
     */
    SkillRegistry.prototype.parseActivationKeywords = function (description) {
        var keywords = [];
        // Match "Activate on" patterns
        var activateMatch = description.match(/Activate on[:\s]+([^.]+)/i);
        if (activateMatch) {
            var keywordPart = activateMatch[1];
            // Extract quoted strings
            var quoted = keywordPart.match(/"([^"]+)"/g) || [];
            keywords.push.apply(keywords, quoted.map(function (q) { return q.replace(/"/g, '').toLowerCase(); }));
            // Also get unquoted comma-separated terms
            var unquoted = keywordPart
                .replace(/"[^"]+"/g, '')
                .split(/[,;]/)
                .map(function (s) { return s.trim().toLowerCase(); })
                .filter(function (s) { return s.length > 2; });
            keywords.push.apply(keywords, unquoted);
        }
        // Also include tags as activation keywords
        return __spreadArray([], new Set(keywords), true);
    };
    /**
     * Parse exclusion keywords from description
     * Looks for patterns like: NOT for X, Y, Z
     */
    SkillRegistry.prototype.parseExclusionKeywords = function (description) {
        var keywords = [];
        var notMatch = description.match(/NOT for[:\s]+([^.]+)/i);
        if (notMatch) {
            var keywordPart = notMatch[1];
            var terms = keywordPart
                .replace(/\([^)]+\)/g, '') // Remove parenthetical notes
                .split(/[,;]/)
                .map(function (s) { return s.trim().toLowerCase(); })
                .filter(function (s) { return s.length > 2; });
            keywords.push.apply(keywords, terms);
        }
        return __spreadArray([], new Set(keywords), true);
    };
    /**
     * Infer capabilities from skill metadata
     */
    SkillRegistry.prototype.inferCapabilities = function (skill) {
        var desc = skill.description.toLowerCase();
        var tags = skill.tags.map(function (t) { return t.toLowerCase(); });
        // Infer primary tools from common patterns
        var primaryTools = [];
        if (desc.includes('code') || desc.includes('develop'))
            primaryTools.push('Edit', 'Write');
        if (desc.includes('research') || desc.includes('search'))
            primaryTools.push('WebSearch', 'Grep');
        if (desc.includes('design') || desc.includes('visual'))
            primaryTools.push('Read', 'Write');
        // Infer domains from category and tags
        var domains = [skill.category.toLowerCase()];
        domains.push.apply(domains, tags);
        return {
            canRead: true, // All skills can read
            canWrite: desc.includes('create') || desc.includes('write') || desc.includes('build'),
            canBash: desc.includes('deploy') || desc.includes('script') || desc.includes('cli'),
            canWeb: desc.includes('web') || desc.includes('api') || desc.includes('fetch'),
            canMcp: desc.includes('mcp') || desc.includes('tool'),
            primaryTools: primaryTools,
            domains: __spreadArray([], new Set(domains), true),
        };
    };
    /**
     * Create default metrics for a new skill
     */
    SkillRegistry.prototype.createDefaultMetrics = function () {
        return {
            invocationCount: 0,
            successCount: 0,
            avgConfidence: 0,
            avgTokens: 0,
            avgLatencyMs: 0,
            lastUsed: null,
            successRate: 0,
        };
    };
    /**
     * Get a skill by ID
     */
    SkillRegistry.prototype.get = function (id) {
        this.ensureInitialized();
        return this.entries.get(id);
    };
    /**
     * Check if a skill exists
     */
    SkillRegistry.prototype.has = function (id) {
        this.ensureInitialized();
        return this.entries.has(id);
    };
    /**
     * Get all skill IDs
     */
    SkillRegistry.prototype.getAllIds = function () {
        this.ensureInitialized();
        return Array.from(this.entries.keys());
    };
    /**
     * Get all entries
     */
    SkillRegistry.prototype.getAll = function () {
        this.ensureInitialized();
        return Array.from(this.entries.values());
    };
    /**
     * Query skills with filters
     */
    SkillRegistry.prototype.query = function (options) {
        if (options === void 0) { options = {}; }
        this.ensureInitialized();
        var results = Array.from(this.entries.values());
        // Apply filters
        if (options.activeOnly !== false) {
            results = results.filter(function (e) { return e.isActive; });
        }
        if (options.category) {
            results = results.filter(function (e) {
                return e.skill.category.toLowerCase() === options.category.toLowerCase();
            });
        }
        if (options.tags && options.tags.length > 0) {
            var lowerTags_1 = options.tags.map(function (t) { return t.toLowerCase(); });
            results = results.filter(function (e) {
                return e.skill.tags.some(function (t) { return lowerTags_1.includes(t.toLowerCase()); });
            });
        }
        if (options.domain) {
            var lowerDomain_1 = options.domain.toLowerCase();
            results = results.filter(function (e) {
                return e.capabilities.domains.some(function (d) { return d.includes(lowerDomain_1); });
            });
        }
        if (options.capability) {
            results = results.filter(function (e) { return e.capabilities[options.capability]; });
        }
        if (options.minSuccessRate !== undefined) {
            results = results.filter(function (e) {
                return e.metrics.invocationCount === 0 || e.metrics.successRate >= options.minSuccessRate;
            });
        }
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    };
    /**
     * Search skills by keyword (simple text matching)
     * For semantic matching, use SemanticMatcher
     */
    SkillRegistry.prototype.search = function (query, limit) {
        if (limit === void 0) { limit = 10; }
        this.ensureInitialized();
        var queryTerms = query.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 2; });
        if (queryTerms.length === 0)
            return [];
        // Score each skill by keyword matches
        var scored = Array.from(this.entries.values())
            .filter(function (e) { return e.isActive; })
            .map(function (entry) {
            var score = 0;
            var _loop_1 = function (term) {
                // Check activation keywords (highest weight)
                if (entry.activationKeywords.some(function (k) { return k.includes(term); })) {
                    score += 10;
                }
                // Check title
                if (entry.skill.title.toLowerCase().includes(term)) {
                    score += 8;
                }
                // Check tags
                if (entry.skill.tags.some(function (t) { return t.toLowerCase().includes(term); })) {
                    score += 5;
                }
                // Check description
                if (entry.skill.description.toLowerCase().includes(term)) {
                    score += 2;
                }
                // Check domains
                if (entry.capabilities.domains.some(function (d) { return d.includes(term); })) {
                    score += 3;
                }
                // Penalty for exclusion keywords
                if (entry.exclusionKeywords.some(function (k) { return k.includes(term); })) {
                    score -= 5;
                }
            };
            for (var _i = 0, queryTerms_1 = queryTerms; _i < queryTerms_1.length; _i++) {
                var term = queryTerms_1[_i];
                _loop_1(term);
            }
            return { entry: entry, score: score };
        })
            .filter(function (_a) {
            var score = _a.score;
            return score > 0;
        })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, limit);
        return scored.map(function (_a) {
            var entry = _a.entry;
            return entry;
        });
    };
    /**
     * Update skill metrics after invocation
     */
    SkillRegistry.prototype.recordInvocation = function (skillId, result) {
        var entry = this.entries.get(skillId);
        if (!entry)
            return;
        var m = entry.metrics;
        m.invocationCount++;
        if (result.success) {
            m.successCount++;
        }
        m.successRate = m.invocationCount > 0
            ? m.successCount / m.invocationCount
            : 0;
        // Rolling average for other metrics
        if (result.confidence !== undefined) {
            m.avgConfidence = this.rollingAvg(m.avgConfidence, result.confidence, m.invocationCount);
        }
        if (result.tokens !== undefined) {
            m.avgTokens = this.rollingAvg(m.avgTokens, result.tokens, m.invocationCount);
        }
        if (result.latencyMs !== undefined) {
            m.avgLatencyMs = this.rollingAvg(m.avgLatencyMs, result.latencyMs, m.invocationCount);
        }
        m.lastUsed = new Date();
    };
    /**
     * Calculate rolling average
     */
    SkillRegistry.prototype.rollingAvg = function (current, newValue, count) {
        if (count <= 1)
            return newValue;
        return ((current * (count - 1)) + newValue) / count;
    };
    /**
     * Get registry statistics
     */
    SkillRegistry.prototype.getStats = function () {
        this.ensureInitialized();
        var entries = Array.from(this.entries.values());
        var active = entries.filter(function (e) { return e.isActive; });
        // Count by category
        var skillsByCategory = {};
        for (var _i = 0, active_1 = active; _i < active_1.length; _i++) {
            var entry = active_1[_i];
            var cat = entry.skill.category;
            skillsByCategory[cat] = (skillsByCategory[cat] || 0) + 1;
        }
        // Total invocations
        var totalInvocations = entries.reduce(function (sum, e) { return sum + e.metrics.invocationCount; }, 0);
        // Average success rate (only for skills that have been used)
        var usedEntries = entries.filter(function (e) { return e.metrics.invocationCount > 0; });
        var avgSuccessRate = usedEntries.length > 0
            ? usedEntries.reduce(function (sum, e) { return sum + e.metrics.successRate; }, 0) / usedEntries.length
            : 0;
        // Top skills by invocation
        var topSkills = entries
            .filter(function (e) { return e.metrics.invocationCount > 0; })
            .sort(function (a, b) { return b.metrics.invocationCount - a.metrics.invocationCount; })
            .slice(0, 10)
            .map(function (e) { return ({
            id: e.skill.id,
            invocations: e.metrics.invocationCount,
        }); });
        return {
            totalSkills: entries.length,
            activeSkills: active.length,
            totalInvocations: totalInvocations,
            avgSuccessRate: avgSuccessRate,
            skillsByCategory: skillsByCategory,
            topSkills: topSkills,
        };
    };
    /**
     * Deactivate a skill
     */
    SkillRegistry.prototype.deactivate = function (skillId) {
        var entry = this.entries.get(skillId);
        if (!entry)
            return false;
        entry.isActive = false;
        return true;
    };
    /**
     * Activate a skill
     */
    SkillRegistry.prototype.activate = function (skillId) {
        var entry = this.entries.get(skillId);
        if (!entry)
            return false;
        entry.isActive = true;
        return true;
    };
    /**
     * Register a new skill (for dynamically added skills)
     */
    SkillRegistry.prototype.register = function (skill) {
        if (this.entries.has(skill.id)) {
            throw new Error("Skill already registered: ".concat(skill.id));
        }
        var entry = this.createEntry(skill);
        this.entries.set(skill.id, entry);
    };
    /**
     * Clear the registry
     */
    SkillRegistry.prototype.clear = function () {
        this.entries.clear();
        this.initialized = false;
    };
    /**
     * Ensure registry is initialized
     */
    SkillRegistry.prototype.ensureInitialized = function () {
        if (!this.initialized) {
            this.initialize();
        }
    };
    Object.defineProperty(SkillRegistry.prototype, "size", {
        /**
         * Get count of skills
         */
        get: function () {
            return this.entries.size;
        },
        enumerable: false,
        configurable: true
    });
    return SkillRegistry;
}());
exports.SkillRegistry = SkillRegistry;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global skill registry instance */
exports.skillRegistry = new SkillRegistry();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Initialize the global registry
 */
function initializeRegistry(skills) {
    exports.skillRegistry.initialize(skills);
}
/**
 * Get a skill from the global registry
 */
function getSkill(id) {
    return exports.skillRegistry.get(id);
}
/**
 * Search skills in the global registry
 */
function searchSkills(query, limit) {
    return exports.skillRegistry.search(query, limit);
}
/**
 * Query skills in the global registry
 */
function querySkills(options) {
    return exports.skillRegistry.query(options);
}

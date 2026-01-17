"use strict";
/**
 * Semantic Matcher
 *
 * Finds skills for natural language requests using semantic similarity.
 * Combines TF-IDF-like scoring with activation/exclusion keyword analysis.
 *
 * @module dag/registry/semantic-matcher
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.semanticMatcher = exports.SemanticMatcher = void 0;
exports.matchSkills = matchSkills;
exports.matchBestSkill = matchBestSkill;
exports.parseQueryIntent = parseQueryIntent;
var skill_registry_1 = require("./skill-registry");
// =============================================================================
// SEMANTIC MATCHER CLASS
// =============================================================================
/**
 * SemanticMatcher finds skills for natural language queries.
 *
 * @example
 * ```typescript
 * const matcher = new SemanticMatcher();
 *
 * // Find skills for a request
 * const matches = matcher.match('Build a chatbot with RAG for customer support');
 *
 * // Get top match with explanation
 * const best = matches[0];
 * console.log(best.matchReason); // "High activation keyword match: 'chatbot', 'RAG'"
 * ```
 */
var SemanticMatcher = /** @class */ (function () {
    function SemanticMatcher() {
        // Weights for different score components
        this.weights = {
            keyword: 0.35,
            semantic: 0.25,
            tag: 0.15,
            category: 0.10,
            performance: 0.15,
        };
        // Action word mappings to task types
        this.actionMappings = {
            // Create
            build: 'create',
            create: 'create',
            make: 'create',
            develop: 'create',
            implement: 'create',
            write: 'create',
            design: 'create',
            generate: 'create',
            construct: 'create',
            add: 'create',
            // Analyze
            analyze: 'analyze',
            review: 'analyze',
            check: 'analyze',
            evaluate: 'analyze',
            assess: 'analyze',
            audit: 'analyze',
            inspect: 'analyze',
            examine: 'analyze',
            // Fix
            fix: 'fix',
            debug: 'fix',
            repair: 'fix',
            solve: 'fix',
            resolve: 'fix',
            troubleshoot: 'fix',
            correct: 'fix',
            // Optimize
            optimize: 'optimize',
            improve: 'optimize',
            enhance: 'optimize',
            refactor: 'optimize',
            upgrade: 'optimize',
            boost: 'optimize',
            speed: 'optimize',
            // Research
            research: 'research',
            learn: 'research',
            understand: 'research',
            explore: 'research',
            discover: 'research',
            find: 'research',
            search: 'research',
            investigate: 'research',
            // Transform
            convert: 'transform',
            transform: 'transform',
            migrate: 'transform',
            translate: 'transform',
            port: 'transform',
            export: 'transform',
            import: 'transform',
        };
        // Domain keywords for better matching
        this.domainKeywords = {
            'AI & Machine Learning': ['ai', 'ml', 'llm', 'gpt', 'claude', 'model', 'neural', 'embedding', 'rag', 'chatbot', 'agent'],
            'Web Development': ['web', 'frontend', 'backend', 'api', 'react', 'next', 'html', 'css', 'http', 'rest'],
            'Design': ['design', 'ui', 'ux', 'visual', 'color', 'layout', 'typography', 'brand'],
            'DevOps & Infrastructure': ['devops', 'deploy', 'ci', 'cd', 'docker', 'kubernetes', 'terraform', 'aws'],
            'Mobile Development': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
            'Data Engineering': ['data', 'pipeline', 'etl', 'warehouse', 'spark', 'kafka', 'airflow'],
            'Security': ['security', 'auth', 'oauth', 'encryption', 'vulnerability', 'penetration'],
            'Testing': ['test', 'qa', 'automation', 'coverage', 'unit', 'integration', 'e2e'],
        };
        // Stop words to filter out
        this.stopWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
            'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
            'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
            'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
            'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
            'only', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
            'now', 'here', 'there', 'then', 'once', 'if', 'into', 'about',
            'out', 'up', 'down', 'over', 'under', 'again', 'further', 'through',
            'want', 'need', 'help', 'please', 'using', 'use',
        ]);
    }
    /**
     * Match skills to a natural language query
     */
    SemanticMatcher.prototype.match = function (query, options) {
        if (options === void 0) { options = {}; }
        var _a = options.maxResults, maxResults = _a === void 0 ? 5 : _a, _b = options.minScore, minScore = _b === void 0 ? 0.1 : _b, minConfidence = options.minConfidence, _c = options.preferHighPerformance, preferHighPerformance = _c === void 0 ? true : _c, categories = options.categories, _d = options.boostSkills, boostSkills = _d === void 0 ? [] : _d, _e = options.excludeSkills, excludeSkills = _e === void 0 ? [] : _e;
        // Parse query intent
        var intent = this.parseIntent(query);
        // Get candidate skills
        var candidates = skill_registry_1.skillRegistry.getAll().filter(function (e) { return e.isActive; });
        // Apply category filter
        if (categories && categories.length > 0) {
            var lowerCats_1 = categories.map(function (c) { return c.toLowerCase(); });
            candidates = candidates.filter(function (e) {
                return lowerCats_1.includes(e.skill.category.toLowerCase());
            });
        }
        // Exclude specific skills
        if (excludeSkills.length > 0) {
            var excludeSet_1 = new Set(excludeSkills);
            candidates = candidates.filter(function (e) { return !excludeSet_1.has(e.skill.id); });
        }
        // Score each candidate
        var results = [];
        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
            var entry = candidates_1[_i];
            var breakdown = this.calculateScoreBreakdown(entry, intent, query);
            var score = this.calculateFinalScore(breakdown);
            // Apply performance preference
            if (preferHighPerformance && entry.metrics.invocationCount > 0) {
                score *= (1 + entry.metrics.successRate * 0.1);
            }
            // Apply boost
            if (boostSkills.includes(entry.skill.id)) {
                score *= 1.2;
            }
            // Normalize score to 0-1
            score = Math.min(1, Math.max(0, score));
            if (score >= minScore) {
                var confidence = this.determineConfidence(score);
                var matchReason = this.generateMatchReason(entry, breakdown);
                if (!minConfidence || this.meetsConfidenceThreshold(confidence, minConfidence)) {
                    results.push({
                        entry: entry,
                        score: score,
                        scoreBreakdown: breakdown,
                        confidence: confidence,
                        matchReason: matchReason,
                    });
                }
            }
        }
        // Sort by score descending
        results.sort(function (a, b) { return b.score - a.score; });
        // Limit results
        return results.slice(0, maxResults);
    };
    /**
     * Parse intent from natural language query
     */
    SemanticMatcher.prototype.parseIntent = function (query) {
        var _this = this;
        var lower = query.toLowerCase();
        var words = lower.split(/\s+/).filter(function (w) { return w.length > 1; });
        // Extract actions
        var actions = [];
        var taskType = 'unknown';
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (this.actionMappings[word]) {
                actions.push(word);
                taskType = this.actionMappings[word];
            }
        }
        // Extract keywords (non-stop words)
        var keywords = words.filter(function (w) {
            return !_this.stopWords.has(w) &&
                w.length > 2;
        });
        // Extract targets (nouns that follow verbs)
        var targets = [];
        var modifiers = [];
        // Simple heuristic: words after action words are targets
        for (var i = 0; i < words.length; i++) {
            if (this.actionMappings[words[i]] && i + 1 < words.length) {
                var nextWord = words[i + 1];
                if (!this.stopWords.has(nextWord)) {
                    targets.push(nextWord);
                }
            }
        }
        // Modifiers are adjectives/adverbs (simple heuristic: words ending in -ly, -ful, etc.)
        for (var _a = 0, words_2 = words; _a < words_2.length; _a++) {
            var word = words_2[_a];
            if (word.endsWith('ly') ||
                word.endsWith('ful') ||
                word.endsWith('able') ||
                word.endsWith('ive') ||
                ['fast', 'slow', 'simple', 'complex', 'advanced', 'basic'].includes(word)) {
                modifiers.push(word);
            }
        }
        return {
            actions: actions,
            targets: targets,
            modifiers: modifiers,
            taskType: taskType,
            keywords: keywords,
        };
    };
    /**
     * Calculate score breakdown for a skill
     */
    SemanticMatcher.prototype.calculateScoreBreakdown = function (entry, intent, query) {
        var lower = query.toLowerCase();
        // Keyword score
        var keywordScore = 0;
        var _loop_1 = function (keyword) {
            // Activation keywords
            if (entry.activationKeywords.some(function (k) { return k.includes(keyword) || keyword.includes(k); })) {
                keywordScore += 0.3;
            }
            // Title match
            if (entry.skill.title.toLowerCase().includes(keyword)) {
                keywordScore += 0.25;
            }
            // Description match
            if (entry.skill.description.toLowerCase().includes(keyword)) {
                keywordScore += 0.1;
            }
        };
        for (var _i = 0, _a = intent.keywords; _i < _a.length; _i++) {
            var keyword = _a[_i];
            _loop_1(keyword);
        }
        keywordScore = Math.min(1, keywordScore);
        // Semantic score based on domain matching
        var semanticScore = 0;
        for (var _b = 0, _c = Object.entries(this.domainKeywords); _b < _c.length; _b++) {
            var _d = _c[_b], category = _d[0], domainWords = _d[1];
            if (entry.skill.category.toLowerCase().includes(category.toLowerCase())) {
                for (var _e = 0, domainWords_1 = domainWords; _e < domainWords_1.length; _e++) {
                    var domainWord = domainWords_1[_e];
                    if (lower.includes(domainWord)) {
                        semanticScore += 0.15;
                    }
                }
            }
        }
        semanticScore = Math.min(1, semanticScore);
        // Tag score
        var tagScore = 0;
        for (var _f = 0, _g = entry.skill.tags; _f < _g.length; _f++) {
            var tag = _g[_f];
            var lowerTag = tag.toLowerCase();
            if (lower.includes(lowerTag) || intent.keywords.includes(lowerTag)) {
                tagScore += 0.2;
            }
        }
        tagScore = Math.min(1, tagScore);
        // Category score (if query mentions the category)
        var categoryScore = 0;
        var categoryLower = entry.skill.category.toLowerCase();
        var categoryWords = categoryLower.split(/[&\s]+/).filter(function (w) { return w.length > 2; });
        for (var _h = 0, categoryWords_1 = categoryWords; _h < categoryWords_1.length; _h++) {
            var word = categoryWords_1[_h];
            if (lower.includes(word)) {
                categoryScore += 0.25;
            }
        }
        categoryScore = Math.min(1, categoryScore);
        // Performance score
        var performanceScore = entry.metrics.invocationCount > 0
            ? entry.metrics.successRate
            : 0.5; // Neutral for unused skills
        // Exclusion penalty
        var exclusionPenalty = 0;
        for (var _j = 0, _k = entry.exclusionKeywords; _j < _k.length; _j++) {
            var exclusion = _k[_j];
            if (lower.includes(exclusion)) {
                exclusionPenalty += 0.3;
            }
        }
        exclusionPenalty = Math.min(0.8, exclusionPenalty);
        return {
            keywordScore: keywordScore,
            semanticScore: semanticScore,
            tagScore: tagScore,
            categoryScore: categoryScore,
            performanceScore: performanceScore,
            exclusionPenalty: exclusionPenalty,
        };
    };
    /**
     * Calculate final score from breakdown
     */
    SemanticMatcher.prototype.calculateFinalScore = function (breakdown) {
        var weighted = breakdown.keywordScore * this.weights.keyword +
            breakdown.semanticScore * this.weights.semantic +
            breakdown.tagScore * this.weights.tag +
            breakdown.categoryScore * this.weights.category +
            breakdown.performanceScore * this.weights.performance;
        return Math.max(0, weighted - breakdown.exclusionPenalty);
    };
    /**
     * Determine confidence level from score
     */
    SemanticMatcher.prototype.determineConfidence = function (score) {
        if (score >= 0.6)
            return 'high';
        if (score >= 0.3)
            return 'medium';
        return 'low';
    };
    /**
     * Check if confidence meets threshold
     */
    SemanticMatcher.prototype.meetsConfidenceThreshold = function (actual, required) {
        var levels = { low: 0, medium: 1, high: 2 };
        return levels[actual] >= levels[required];
    };
    /**
     * Generate human-readable match reason
     */
    SemanticMatcher.prototype.generateMatchReason = function (entry, breakdown) {
        var reasons = [];
        if (breakdown.keywordScore >= 0.3) {
            var matchedKeywords = entry.activationKeywords.slice(0, 3).join(', ');
            reasons.push("Matches keywords: ".concat(matchedKeywords));
        }
        if (breakdown.tagScore >= 0.2) {
            var matchedTags = entry.skill.tags.slice(0, 3).join(', ');
            reasons.push("Relevant tags: ".concat(matchedTags));
        }
        if (breakdown.semanticScore >= 0.2) {
            reasons.push("Strong domain fit: ".concat(entry.skill.category));
        }
        if (breakdown.performanceScore >= 0.8 && entry.metrics.invocationCount > 0) {
            reasons.push("High success rate: ".concat(Math.round(breakdown.performanceScore * 100), "%"));
        }
        if (breakdown.exclusionPenalty > 0) {
            reasons.push("(Partial exclusion match)");
        }
        return reasons.length > 0
            ? reasons.join('; ')
            : "General category match: ".concat(entry.skill.category);
    };
    /**
     * Find the single best match
     */
    SemanticMatcher.prototype.matchOne = function (query, options) {
        var results = this.match(query, __assign(__assign({}, options), { maxResults: 1 }));
        return results.length > 0 ? results[0] : null;
    };
    /**
     * Check if query matches a specific skill
     */
    SemanticMatcher.prototype.isMatch = function (query, skillId, minScore) {
        if (minScore === void 0) { minScore = 0.3; }
        var results = this.match(query, { maxResults: 20, minScore: minScore });
        return results.some(function (r) { return r.entry.skill.id === skillId; });
    };
    /**
     * Get suggested follow-up skills based on matched skill
     */
    SemanticMatcher.prototype.getSuggestedFollowups = function (skillId) {
        var entry = skill_registry_1.skillRegistry.get(skillId);
        if (!entry || !entry.skill.pairsWith)
            return [];
        return entry.skill.pairsWith
            .map(function (pair) { return skill_registry_1.skillRegistry.get(pair.skill); })
            .filter(function (e) { return e !== undefined; });
    };
    return SemanticMatcher;
}());
exports.SemanticMatcher = SemanticMatcher;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global semantic matcher instance */
exports.semanticMatcher = new SemanticMatcher();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Match skills to query using global matcher
 */
function matchSkills(query, options) {
    return exports.semanticMatcher.match(query, options);
}
/**
 * Match single best skill
 */
function matchBestSkill(query) {
    return exports.semanticMatcher.matchOne(query);
}
/**
 * Parse query intent
 */
function parseQueryIntent(query) {
    return exports.semanticMatcher.parseIntent(query);
}

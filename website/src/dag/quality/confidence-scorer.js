"use strict";
/**
 * Confidence Scorer
 *
 * Assigns confidence scores to agent outputs based on multiple factors.
 * Helps downstream consumers understand the reliability of results.
 *
 * @module dag/quality/confidence-scorer
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
exports.confidenceScorer = exports.ConfidenceScorer = void 0;
exports.scoreConfidence = scoreConfidence;
exports.quickConfidenceScore = quickConfidenceScore;
exports.scoreConfidenceMany = scoreConfidenceMany;
// =============================================================================
// CONFIDENCE SCORER CLASS
// =============================================================================
/**
 * ConfidenceScorer assigns confidence scores to agent outputs.
 *
 * @example
 * ```typescript
 * const scorer = new ConfidenceScorer();
 *
 * const score = scorer.score({
 *   output: agentResult,
 *   input: originalPrompt,
 *   expectedFormat: 'code',
 *   skillId: 'code-reviewer',
 * });
 *
 * console.log(`Confidence: ${score.level} (${score.score.toFixed(2)})`);
 * ```
 */
var ConfidenceScorer = /** @class */ (function () {
    function ConfidenceScorer() {
        this.defaultWeights = {
            formatCompliance: 0.20,
            completeness: 0.20,
            inputAlignment: 0.15,
            internalConsistency: 0.15,
            specificity: 0.10,
            sourceAttribution: 0.10,
            skillReliability: 0.10,
        };
        this.skillSuccessRates = new Map();
    }
    /**
     * Score an agent output
     */
    ConfidenceScorer.prototype.score = function (input, options) {
        if (options === void 0) { options = {}; }
        var weights = this.mergeWeights(options.weights);
        // Calculate individual factors
        var factors = {
            formatCompliance: this.calculateFormatCompliance(input),
            completeness: this.calculateCompleteness(input),
            inputAlignment: this.calculateInputAlignment(input),
            internalConsistency: this.calculateInternalConsistency(input),
            specificity: this.calculateSpecificity(input),
            sourceAttribution: this.calculateSourceAttribution(input),
            skillReliability: this.getSkillReliability(input.skillId),
        };
        // Add custom factors
        if (options.customFactors) {
            factors.custom = {};
            for (var _i = 0, _a = Object.entries(options.customFactors); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], calculator = _b[1];
                factors.custom[name_1] = calculator(input);
            }
        }
        // Calculate weighted score
        var contributions = this.calculateContributions(factors, weights);
        var score = Object.values(contributions).reduce(function (sum, c) { return sum + c; }, 0);
        // Determine level
        var level = this.scoreToLevel(score);
        // Build result
        var result = {
            score: score,
            level: level,
            factors: factors,
            weights: weights,
            contributions: contributions,
            explanation: '',
            recommendations: [],
            scoredAt: new Date(),
        };
        // Add explanations if requested
        if (options.includeExplanation !== false) {
            result.explanation = this.generateExplanation(result);
        }
        if (options.includeRecommendations !== false) {
            result.recommendations = this.generateRecommendations(factors);
        }
        return result;
    };
    /**
     * Calculate format compliance score
     */
    ConfidenceScorer.prototype.calculateFormatCompliance = function (input) {
        var output = input.output, expectedFormat = input.expectedFormat;
        if (!output)
            return 0;
        if (!expectedFormat)
            return 0.7; // No format specified, moderate confidence
        var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        switch (expectedFormat) {
            case 'code':
                return this.assessCodeFormat(outputStr);
            case 'markdown':
                return this.assessMarkdownFormat(outputStr);
            case 'json':
                return this.assessJsonFormat(output);
            case 'list':
                return this.assessListFormat(outputStr);
            default:
                return 0.5;
        }
    };
    ConfidenceScorer.prototype.assessCodeFormat = function (code) {
        var score = 0.5;
        // Has structure (functions, classes, etc.)
        if (/function|class|const|let|var|def|public|private/.test(code)) {
            score += 0.2;
        }
        // Balanced brackets
        var opens = (code.match(/[{[(]/g) || []).length;
        var closes = (code.match(/[}\])]/g) || []).length;
        if (opens === closes) {
            score += 0.2;
        }
        // No obvious errors
        if (!/syntax error|undefined|null pointer/i.test(code)) {
            score += 0.1;
        }
        return Math.min(1, score);
    };
    ConfidenceScorer.prototype.assessMarkdownFormat = function (md) {
        var score = 0.5;
        // Has headings
        if (/#+ /.test(md))
            score += 0.15;
        // Has paragraphs
        if (md.split('\n\n').length > 1)
            score += 0.1;
        // Properly closed code blocks
        var codeBlocks = (md.match(/```/g) || []).length;
        if (codeBlocks % 2 === 0)
            score += 0.15;
        // Has lists
        if (/^[-*•] /m.test(md) || /^\d+\. /m.test(md))
            score += 0.1;
        return Math.min(1, score);
    };
    ConfidenceScorer.prototype.assessJsonFormat = function (output) {
        if (typeof output === 'object' && output !== null)
            return 0.9;
        if (typeof output === 'string') {
            try {
                JSON.parse(output);
                return 0.85;
            }
            catch (_a) {
                return 0.2;
            }
        }
        return 0.3;
    };
    ConfidenceScorer.prototype.assessListFormat = function (text) {
        var lines = text.split('\n').filter(function (l) { return l.trim(); });
        var listItems = lines.filter(function (l) { return /^[-*•\d.]/.test(l.trim()); });
        return listItems.length / Math.max(lines.length, 1);
    };
    /**
     * Calculate completeness score
     */
    ConfidenceScorer.prototype.calculateCompleteness = function (input) {
        var output = input.output, originalInput = input.input;
        if (!output)
            return 0;
        var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        // Base score on output length
        var score = Math.min(1, outputStr.length / 500);
        // Check for incomplete markers
        if (/TODO|FIXME|...$|etc\.|and more/i.test(outputStr)) {
            score *= 0.7;
        }
        // Check for truncation
        if (/truncated|cut off|continued/i.test(outputStr)) {
            score *= 0.6;
        }
        // If we have the original input, check coverage
        if (originalInput) {
            var inputKeywords = this.extractKeywords(originalInput);
            var outputKeywords_1 = this.extractKeywords(outputStr);
            var coverage = inputKeywords.filter(function (k) { return outputKeywords_1.includes(k); }).length /
                Math.max(inputKeywords.length, 1);
            score = (score + coverage) / 2;
        }
        return score;
    };
    /**
     * Calculate input alignment score
     */
    ConfidenceScorer.prototype.calculateInputAlignment = function (input) {
        var output = input.output, originalInput = input.input;
        if (!output || !originalInput)
            return 0.5;
        var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        // Extract key terms from input
        var inputTerms = this.extractKeywords(originalInput);
        var outputTerms = this.extractKeywords(outputStr);
        // Calculate overlap
        var overlap = inputTerms.filter(function (t) { return outputTerms.includes(t); }).length;
        var alignmentScore = overlap / Math.max(inputTerms.length, 1);
        // Check for direct addressing of the input
        var directAddressing = 0.5;
        if (/based on|as requested|according to|following your/i.test(outputStr)) {
            directAddressing = 0.8;
        }
        return (alignmentScore + directAddressing) / 2;
    };
    /**
     * Calculate internal consistency score
     */
    ConfidenceScorer.prototype.calculateInternalConsistency = function (input) {
        var output = input.output;
        if (!output)
            return 0;
        var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        var score = 0.7; // Base score
        // Check for contradictions
        var contradictionPatterns = [
            /however.*but/i,
            /yes.*no/i,
            /true.*false/i,
            /always.*never/i,
            /both.*neither/i,
        ];
        for (var _i = 0, contradictionPatterns_1 = contradictionPatterns; _i < contradictionPatterns_1.length; _i++) {
            var pattern = contradictionPatterns_1[_i];
            if (pattern.test(outputStr)) {
                score -= 0.1;
            }
        }
        // Check for repetition (might indicate confusion)
        var sentences = outputStr.split(/[.!?]+/).filter(function (s) { return s.trim(); });
        var uniqueSentences = new Set(sentences.map(function (s) { return s.trim().toLowerCase(); }));
        if (sentences.length > 3 && uniqueSentences.size < sentences.length * 0.8) {
            score -= 0.15;
        }
        // Check for logical structure
        if (/therefore|thus|hence|because|since|as a result/i.test(outputStr)) {
            score += 0.1;
        }
        return Math.max(0, Math.min(1, score));
    };
    /**
     * Calculate specificity score
     */
    ConfidenceScorer.prototype.calculateSpecificity = function (input) {
        var output = input.output;
        if (!output)
            return 0;
        var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        var score = 0.5;
        // Has specific numbers/data
        if (/\d+(\.\d+)?(%|px|em|rem|ms|s|kb|mb|gb)?/i.test(outputStr)) {
            score += 0.15;
        }
        // Has code references
        if (/`[^`]+`|```[\s\S]+```/.test(outputStr)) {
            score += 0.15;
        }
        // Has file paths
        if (/\/[\w-]+\/[\w-]+(\.\w+)?/.test(outputStr)) {
            score += 0.1;
        }
        // Has specific technical terms
        var technicalTerms = outputStr.match(/\b[A-Z][a-z]+[A-Z]\w*\b/g) || []; // CamelCase
        if (technicalTerms.length > 0) {
            score += Math.min(0.1, technicalTerms.length * 0.02);
        }
        // Penalize vague language
        var vagueTerms = (outputStr.match(/\b(maybe|perhaps|might|could|possibly|probably|generally|usually|often)\b/gi) || []).length;
        score -= Math.min(0.2, vagueTerms * 0.03);
        return Math.max(0, Math.min(1, score));
    };
    /**
     * Calculate source attribution score
     */
    ConfidenceScorer.prototype.calculateSourceAttribution = function (input) {
        var output = input.output;
        if (!output)
            return 0;
        var outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        var score = 0.5; // Base score (some outputs don't need sources)
        // Has URLs
        if (/https?:\/\/[\w-]+(\.[\w-]+)+/.test(outputStr)) {
            score += 0.2;
        }
        // Has references to documentation
        if (/documentation|docs|reference|source|according to/i.test(outputStr)) {
            score += 0.15;
        }
        // Has citations or quotes
        if (/"[^"]+"|'[^']+'/.test(outputStr)) {
            score += 0.1;
        }
        // Check context for required citations
        var context = input.context || {};
        if (context.requiresCitations && score < 0.7) {
            score *= 0.5; // Penalize if citations required but missing
        }
        return Math.min(1, score);
    };
    /**
     * Get skill reliability from historical data
     */
    ConfidenceScorer.prototype.getSkillReliability = function (skillId) {
        var _a;
        if (!skillId)
            return 0.5;
        return (_a = this.skillSuccessRates.get(skillId)) !== null && _a !== void 0 ? _a : 0.5;
    };
    /**
     * Update skill reliability tracking
     */
    ConfidenceScorer.prototype.updateSkillReliability = function (skillId, successRate) {
        this.skillSuccessRates.set(skillId, successRate);
    };
    /**
     * Merge custom weights with defaults
     */
    ConfidenceScorer.prototype.mergeWeights = function (custom) {
        if (!custom)
            return __assign({}, this.defaultWeights);
        var merged = __assign(__assign({}, this.defaultWeights), custom);
        // Normalize weights to sum to 1
        var total = Object.values(merged)
            .filter(function (v) { return typeof v === 'number'; })
            .reduce(function (sum, w) { return sum + w; }, 0);
        if (total > 0 && total !== 1) {
            for (var _i = 0, _a = Object.keys(merged); _i < _a.length; _i++) {
                var key = _a[_i];
                if (typeof merged[key] === 'number') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    merged[key] = merged[key] / total;
                }
            }
        }
        return merged;
    };
    /**
     * Calculate weighted contributions
     */
    ConfidenceScorer.prototype.calculateContributions = function (factors, weights) {
        var contributions = {};
        for (var _i = 0, _a = Object.entries(weights); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], weight = _b[1];
            if (key === 'custom')
                continue;
            var factor = factors[key];
            if (typeof factor === 'number') {
                contributions[key] = factor * weight;
            }
        }
        // Handle custom factors
        if (factors.custom && weights.custom) {
            for (var _c = 0, _d = Object.entries(weights.custom); _c < _d.length; _c++) {
                var _e = _d[_c], key = _e[0], weight = _e[1];
                if (factors.custom[key] !== undefined) {
                    contributions["custom.".concat(key)] = factors.custom[key] * weight;
                }
            }
        }
        return contributions;
    };
    /**
     * Convert numeric score to level
     */
    ConfidenceScorer.prototype.scoreToLevel = function (score) {
        if (score >= 0.9)
            return 'very-high';
        if (score >= 0.75)
            return 'high';
        if (score >= 0.5)
            return 'medium';
        if (score >= 0.25)
            return 'low';
        return 'very-low';
    };
    /**
     * Generate human-readable explanation
     */
    ConfidenceScorer.prototype.generateExplanation = function (result) {
        var level = result.level, factors = result.factors, contributions = result.contributions;
        var topContributors = Object.entries(contributions)
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 3)
            .map(function (_a) {
            var name = _a[0];
            return name;
        });
        var weakFactors = Object.entries(factors)
            .filter(function (_a) {
            var k = _a[0], v = _a[1];
            return typeof v === 'number' && v < 0.5 && k !== 'custom';
        })
            .map(function (_a) {
            var name = _a[0];
            return name;
        });
        var explanation = "Confidence: ".concat(level.toUpperCase(), " (").concat((result.score * 100).toFixed(0), "%). ");
        explanation += "Top factors: ".concat(topContributors.join(', '), ". ");
        if (weakFactors.length > 0) {
            explanation += "Areas for improvement: ".concat(weakFactors.join(', '), ".");
        }
        return explanation;
    };
    /**
     * Generate improvement recommendations
     */
    ConfidenceScorer.prototype.generateRecommendations = function (factors) {
        var recommendations = [];
        if (factors.formatCompliance < 0.6) {
            recommendations.push('Improve output format adherence to expected structure');
        }
        if (factors.completeness < 0.6) {
            recommendations.push('Provide more complete response covering all aspects of the input');
        }
        if (factors.inputAlignment < 0.6) {
            recommendations.push('Better address the specific requirements from the input');
        }
        if (factors.internalConsistency < 0.6) {
            recommendations.push('Ensure logical consistency throughout the response');
        }
        if (factors.specificity < 0.5) {
            recommendations.push('Add more specific details, examples, and concrete references');
        }
        if (factors.sourceAttribution < 0.5) {
            recommendations.push('Include source references or documentation links where appropriate');
        }
        return recommendations;
    };
    /**
     * Extract keywords from text
     */
    ConfidenceScorer.prototype.extractKeywords = function (text) {
        var stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
            'this', 'that', 'these', 'those', 'it', 'its', 'what', 'which', 'who',
        ]);
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(function (word) { return word.length > 2 && !stopWords.has(word); });
    };
    /**
     * Quick scoring (returns just the score)
     */
    ConfidenceScorer.prototype.quickScore = function (input) {
        return this.score(input, {
            includeExplanation: false,
            includeRecommendations: false,
        }).score;
    };
    /**
     * Score multiple outputs
     */
    ConfidenceScorer.prototype.scoreMany = function (inputs, options) {
        var _this = this;
        return inputs.map(function (input) { return _this.score(input, options); });
    };
    /**
     * Get aggregate confidence for a batch
     */
    ConfidenceScorer.prototype.aggregateConfidence = function (scores) {
        if (scores.length === 0) {
            return { mean: 0, min: 0, max: 0, level: 'very-low' };
        }
        var values = scores.map(function (s) { return s.score; });
        var mean = values.reduce(function (sum, v) { return sum + v; }, 0) / values.length;
        var min = Math.min.apply(Math, values);
        var max = Math.max.apply(Math, values);
        return {
            mean: mean,
            min: min,
            max: max,
            level: this.scoreToLevel(mean),
        };
    };
    return ConfidenceScorer;
}());
exports.ConfidenceScorer = ConfidenceScorer;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global confidence scorer instance */
exports.confidenceScorer = new ConfidenceScorer();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Score an output's confidence
 */
function scoreConfidence(input, options) {
    return exports.confidenceScorer.score(input, options);
}
/**
 * Quick confidence score
 */
function quickConfidenceScore(input) {
    return exports.confidenceScorer.quickScore(input);
}
/**
 * Score multiple outputs
 */
function scoreConfidenceMany(inputs, options) {
    return exports.confidenceScorer.scoreMany(inputs, options);
}

"use strict";
/**
 * Hallucination Detector
 *
 * Detects fabricated or unsupported content in agent outputs.
 * Flags claims, citations, and data that may not be accurate.
 *
 * @module dag/quality/hallucination-detector
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
exports.hallucinationDetector = exports.HallucinationDetector = void 0;
exports.detectHallucinations = detectHallucinations;
exports.hasHallucinations = hasHallucinations;
exports.getHallucinationRisk = getHallucinationRisk;
// =============================================================================
// DETECTION PATTERNS
// =============================================================================
/**
 * Patterns that may indicate fabricated citations
 */
var CITATION_PATTERNS = [
    // Academic-style citations that look made up
    /\(\s*(?:[A-Z][a-z]+(?:\s+(?:et\s+al|&\s+[A-Z][a-z]+))?),?\s*\d{4}\s*\)/g,
    // "According to X" claims
    /according to\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    // "Research shows/found" without citation
    /(?:research|studies?|scientists?|experts?)\s+(?:shows?|found|suggests?|confirms?|proves?)/gi,
];
/**
 * Patterns that may indicate fabricated statistics
 */
var STATISTICS_PATTERNS = [
    // Very specific percentages
    /\b\d{2,3}(?:\.\d{1,2})?\s*%/g,
    // Large specific numbers
    /\b\d{1,3}(?:,\d{3})+\b/g,
    // "X out of Y" claims
    /\b\d+\s+(?:out of|in)\s+\d+\b/gi,
    // "X times more/less"
    /\b\d+(?:\.\d+)?x?\s+(?:times?|fold)\s+(?:more|less|higher|lower|faster|slower)/gi,
];
/**
 * Patterns that may indicate URL fabrication
 */
var URL_PATTERNS = [
    // Standard URLs
    /https?:\/\/[\w-]+(\.[\w-]+)+[^\s)"\]]+/g,
];
/**
 * Patterns for potential fake quotes
 */
var QUOTE_PATTERNS = [
    // Attributed quotes
    /"[^"]{10,}"\s*[-–—]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g,
    // Said/stated quotes
    /(?:said|stated|wrote|noted)\s*[:,"]\s*"[^"]+"/gi,
];
/**
 * Patterns for potential code API fabrication
 */
var CODE_API_PATTERNS = [
    // Function calls
    /\b\w+\.\w+\([^)]*\)/g,
    // Import statements
    /import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/g,
    // Require statements
    /require\s*\(\s*['"][^'"]+['"]\s*\)/g,
];
// =============================================================================
// HALLUCINATION DETECTOR CLASS
// =============================================================================
/**
 * HallucinationDetector identifies potentially fabricated content.
 *
 * @example
 * ```typescript
 * const detector = new HallucinationDetector();
 *
 * const result = detector.detect(agentOutput, {
 *   groundTruth: {
 *     validUrls: ['https://docs.example.com'],
 *     currentDate: new Date(),
 *   },
 * });
 *
 * if (result.hasHallucinations) {
 *   console.warn('Potential hallucinations:', result.detections);
 * }
 * ```
 */
var HallucinationDetector = /** @class */ (function () {
    function HallucinationDetector() {
        this.customDetectors = [];
    }
    /**
     * Register a custom detector
     */
    HallucinationDetector.prototype.registerDetector = function (detector) {
        this.customDetectors.push(detector);
    };
    /**
     * Detect potential hallucinations in text
     */
    HallucinationDetector.prototype.detect = function (text, options) {
        var _a, _b;
        if (options === void 0) { options = {}; }
        var startTime = Date.now();
        var detections = [];
        var minConfidence = (_a = options.minConfidence) !== null && _a !== void 0 ? _a : 0.3;
        // Get types to detect
        var typesToDetect = (_b = options.types) !== null && _b !== void 0 ? _b : [
            'fabricated-citation',
            'fabricated-data',
            'fabricated-entity',
            'unsupported-claim',
            'temporal-inconsistency',
            'url-fabrication',
            'code-fabrication',
            'quote-fabrication',
        ];
        // Run detectors based on types
        if (typesToDetect.includes('fabricated-citation')) {
            detections.push.apply(detections, this.detectFabricatedCitations(text, options.groundTruth));
        }
        if (typesToDetect.includes('fabricated-data')) {
            detections.push.apply(detections, this.detectFabricatedData(text));
        }
        if (typesToDetect.includes('url-fabrication')) {
            detections.push.apply(detections, this.detectFabricatedUrls(text, options.groundTruth));
        }
        if (typesToDetect.includes('quote-fabrication')) {
            detections.push.apply(detections, this.detectFabricatedQuotes(text));
        }
        if (typesToDetect.includes('code-fabrication')) {
            detections.push.apply(detections, this.detectFabricatedCode(text, options.groundTruth));
        }
        if (typesToDetect.includes('temporal-inconsistency')) {
            detections.push.apply(detections, this.detectTemporalInconsistencies(text, options.groundTruth));
        }
        if (typesToDetect.includes('unsupported-claim')) {
            detections.push.apply(detections, this.detectUnsupportedClaims(text));
        }
        // Run custom detectors
        for (var _i = 0, _c = __spreadArray(__spreadArray([], this.customDetectors, true), (options.customDetectors || []), true); _i < _c.length; _i++) {
            var detector = _c[_i];
            detections.push.apply(detections, detector(text, options.groundTruth));
        }
        // Filter by skip patterns
        var filteredDetections = detections;
        if (options.skipPatterns) {
            filteredDetections = detections.filter(function (d) {
                return !options.skipPatterns.some(function (p) { return p.test(d.content); });
            });
        }
        // Filter by minimum confidence
        filteredDetections = filteredDetections.filter(function (d) { return d.confidence >= minConfidence; });
        // Calculate risk score
        var riskScore = this.calculateRiskScore(filteredDetections);
        var riskLevel = this.riskScoreToLevel(riskScore);
        // Count by type
        var countByType = this.countByType(filteredDetections);
        // Count high risk
        var highRiskCount = filteredDetections.filter(function (d) { return d.risk === 'high'; }).length;
        return {
            hasHallucinations: filteredDetections.length > 0,
            riskScore: riskScore,
            riskLevel: riskLevel,
            detections: filteredDetections,
            countByType: countByType,
            highRiskCount: highRiskCount,
            summary: this.generateSummary(filteredDetections),
            detectedAt: new Date(),
            processingTimeMs: Date.now() - startTime,
        };
    };
    /**
     * Detect potentially fabricated citations
     */
    HallucinationDetector.prototype.detectFabricatedCitations = function (text, groundTruth) {
        var _a;
        var detections = [];
        for (var _i = 0, CITATION_PATTERNS_1 = CITATION_PATTERNS; _i < CITATION_PATTERNS_1.length; _i++) {
            var pattern = CITATION_PATTERNS_1[_i];
            var match = void 0;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                var content = match[0];
                // Skip if in ground truth
                if ((_a = groundTruth === null || groundTruth === void 0 ? void 0 : groundTruth.validCitations) === null || _a === void 0 ? void 0 : _a.includes(content)) {
                    continue;
                }
                // Analyze the citation
                var confidence = this.assessCitationConfidence(content);
                if (confidence > 0.3) {
                    detections.push({
                        type: 'fabricated-citation',
                        risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
                        content: content,
                        offset: match.index,
                        length: content.length,
                        reason: 'Citation pattern detected without verification',
                        confidence: confidence,
                        verification: 'Verify the source exists and contains the referenced information',
                    });
                }
            }
        }
        return detections;
    };
    HallucinationDetector.prototype.assessCitationConfidence = function (citation) {
        var confidence = 0.5;
        // "et al" citations are more likely to be academic-style fabrications
        if (/et\s+al/i.test(citation)) {
            confidence += 0.2;
        }
        // Very recent years might be made up
        var yearMatch = citation.match(/\d{4}/);
        if (yearMatch) {
            var year = parseInt(yearMatch[0]);
            var currentYear = new Date().getFullYear();
            if (year > currentYear) {
                confidence += 0.3; // Future year is suspicious
            }
            else if (year === currentYear || year === currentYear - 1) {
                confidence += 0.1; // Recent years are harder to verify
            }
        }
        return Math.min(1, confidence);
    };
    /**
     * Detect potentially fabricated statistics/data
     */
    HallucinationDetector.prototype.detectFabricatedData = function (text) {
        var detections = [];
        for (var _i = 0, STATISTICS_PATTERNS_1 = STATISTICS_PATTERNS; _i < STATISTICS_PATTERNS_1.length; _i++) {
            var pattern = STATISTICS_PATTERNS_1[_i];
            var match = void 0;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                var content = match[0];
                var confidence = this.assessDataConfidence(content, text, match.index);
                if (confidence > 0.4) {
                    detections.push({
                        type: 'fabricated-data',
                        risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
                        content: content,
                        offset: match.index,
                        length: content.length,
                        reason: 'Specific statistic without clear source',
                        confidence: confidence,
                        verification: 'Verify the statistic from a reliable source',
                    });
                }
            }
        }
        return detections;
    };
    HallucinationDetector.prototype.assessDataConfidence = function (data, text, offset) {
        var confidence = 0.4;
        // Very specific percentages (e.g., 73.42%) are more suspicious
        if (/\d{2}\.\d{2}%/.test(data)) {
            confidence += 0.2;
        }
        // Check if there's a source nearby
        var contextStart = Math.max(0, offset - 100);
        var contextEnd = Math.min(text.length, offset + data.length + 100);
        var context = text.slice(contextStart, contextEnd);
        // If there's a citation nearby, lower confidence
        if (/\(\d{4}\)|source:|according to|study|research/i.test(context)) {
            confidence -= 0.2;
        }
        // Round numbers are less suspicious
        if (/^\d+0{2,}$/.test(data.replace(/,/g, ''))) {
            confidence -= 0.1;
        }
        return Math.max(0, Math.min(1, confidence));
    };
    /**
     * Detect potentially fabricated URLs
     */
    HallucinationDetector.prototype.detectFabricatedUrls = function (text, groundTruth) {
        var _a;
        var detections = [];
        for (var _i = 0, URL_PATTERNS_1 = URL_PATTERNS; _i < URL_PATTERNS_1.length; _i++) {
            var pattern = URL_PATTERNS_1[_i];
            var match = void 0;
            pattern.lastIndex = 0;
            var _loop_1 = function () {
                var url = match[0];
                // Skip if in ground truth
                if ((_a = groundTruth === null || groundTruth === void 0 ? void 0 : groundTruth.validUrls) === null || _a === void 0 ? void 0 : _a.some(function (valid) {
                    return url.startsWith(valid) || valid.startsWith(url);
                })) {
                    return "continue";
                }
                var confidence = this_1.assessUrlConfidence(url);
                if (confidence > 0.3) {
                    detections.push({
                        type: 'url-fabrication',
                        risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
                        content: url,
                        offset: match.index,
                        length: url.length,
                        reason: 'URL may not exist or be accessible',
                        confidence: confidence,
                        verification: 'Check if the URL is accessible and contains expected content',
                    });
                }
            };
            var this_1 = this;
            while ((match = pattern.exec(text)) !== null) {
                _loop_1();
            }
        }
        return detections;
    };
    HallucinationDetector.prototype.assessUrlConfidence = function (url) {
        var confidence = 0.3;
        try {
            var parsed = new URL(url);
            // Non-standard TLDs
            if (!/\.(com|org|net|io|dev|co|edu|gov|app)$/i.test(parsed.hostname)) {
                confidence += 0.1;
            }
            // Very long paths
            if (parsed.pathname.split('/').length > 5) {
                confidence += 0.1;
            }
            // Random-looking path segments
            if (/\/[a-f0-9]{8,}/.test(parsed.pathname)) {
                confidence += 0.1;
            }
            // Fake-looking domains
            if (/example|test|demo|fake|sample/i.test(parsed.hostname)) {
                confidence += 0.3;
            }
            // Known documentation domains are less suspicious
            if (/github\.com|stackoverflow\.com|docs\.|documentation|wiki/i.test(url)) {
                confidence -= 0.2;
            }
        }
        catch (_a) {
            confidence = 0.8; // Invalid URL is highly suspicious
        }
        return Math.max(0, Math.min(1, confidence));
    };
    /**
     * Detect potentially fabricated quotes
     */
    HallucinationDetector.prototype.detectFabricatedQuotes = function (text) {
        var detections = [];
        for (var _i = 0, QUOTE_PATTERNS_1 = QUOTE_PATTERNS; _i < QUOTE_PATTERNS_1.length; _i++) {
            var pattern = QUOTE_PATTERNS_1[_i];
            var match = void 0;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                var content = match[0];
                var confidence = this.assessQuoteConfidence(content);
                if (confidence > 0.4) {
                    detections.push({
                        type: 'quote-fabrication',
                        risk: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
                        content: content,
                        offset: match.index,
                        length: content.length,
                        reason: 'Attributed quote may not be accurate',
                        confidence: confidence,
                        verification: 'Verify the quote against original source',
                    });
                }
            }
        }
        return detections;
    };
    HallucinationDetector.prototype.assessQuoteConfidence = function (quote) {
        var _a;
        var confidence = 0.5;
        // Very long quotes are more suspicious
        var quoteText = ((_a = quote.match(/"([^"]+)"/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
        if (quoteText.length > 200) {
            confidence += 0.2;
        }
        // Generic-sounding names
        if (/John|Jane|Smith|Doe|Expert|Researcher/i.test(quote)) {
            confidence += 0.2;
        }
        return Math.min(1, confidence);
    };
    /**
     * Detect potentially fabricated code/APIs
     */
    HallucinationDetector.prototype.detectFabricatedCode = function (text, groundTruth) {
        var _a;
        var detections = [];
        // Only check within code blocks
        var codeBlocks = text.match(/```[\s\S]*?```|`[^`]+`/g) || [];
        for (var _i = 0, codeBlocks_1 = codeBlocks; _i < codeBlocks_1.length; _i++) {
            var block = codeBlocks_1[_i];
            for (var _b = 0, CODE_API_PATTERNS_1 = CODE_API_PATTERNS; _b < CODE_API_PATTERNS_1.length; _b++) {
                var pattern = CODE_API_PATTERNS_1[_b];
                var match = void 0;
                pattern.lastIndex = 0;
                var _loop_2 = function () {
                    var content = match[0];
                    // Skip if in known APIs
                    if ((_a = groundTruth === null || groundTruth === void 0 ? void 0 : groundTruth.knownApis) === null || _a === void 0 ? void 0 : _a.some(function (api) { return content.includes(api); })) {
                        return "continue";
                    }
                    var confidence = this_2.assessCodeConfidence(content);
                    if (confidence > 0.5) {
                        detections.push({
                            type: 'code-fabrication',
                            risk: confidence > 0.7 ? 'high' : 'medium',
                            content: content,
                            offset: text.indexOf(content),
                            length: content.length,
                            reason: 'API or function may not exist',
                            confidence: confidence,
                            verification: 'Verify the API exists in the library documentation',
                        });
                    }
                };
                var this_2 = this;
                while ((match = pattern.exec(block)) !== null) {
                    _loop_2();
                }
            }
        }
        return detections;
    };
    HallucinationDetector.prototype.assessCodeConfidence = function (code) {
        var confidence = 0.4;
        // Unusual function names
        if (/\b(doStuff|processData|handleThing|magicMethod)\b/i.test(code)) {
            confidence += 0.3;
        }
        // Very long method chains
        if ((code.match(/\./g) || []).length > 4) {
            confidence += 0.1;
        }
        // Known standard libraries reduce confidence
        if (/console|Math|Array|Object|String|JSON|fetch|require\('fs'\)|require\('path'\)/i.test(code)) {
            confidence -= 0.3;
        }
        return Math.max(0, Math.min(1, confidence));
    };
    /**
     * Detect temporal inconsistencies
     */
    HallucinationDetector.prototype.detectTemporalInconsistencies = function (text, groundTruth) {
        var detections = [];
        var currentDate = (groundTruth === null || groundTruth === void 0 ? void 0 : groundTruth.currentDate) || new Date();
        var currentYear = currentDate.getFullYear();
        // Find year references
        var yearPattern = /\b(19|20)\d{2}\b/g;
        var match;
        while ((match = yearPattern.exec(text)) !== null) {
            var year = parseInt(match[0]);
            if (year > currentYear) {
                detections.push({
                    type: 'temporal-inconsistency',
                    risk: 'high',
                    content: match[0],
                    offset: match.index,
                    length: match[0].length,
                    reason: 'Reference to future year',
                    confidence: 0.9,
                    verification: 'Check if this is an intentional prediction or error',
                });
            }
            else if (year > currentYear - 2) {
                // Check context for "will be" or "upcoming"
                var contextStart = Math.max(0, match.index - 50);
                var context = text.slice(contextStart, match.index + 50);
                if (/will|upcoming|planned|expected|announced/i.test(context)) {
                    // This might be intentional prediction
                    continue;
                }
            }
        }
        return detections;
    };
    /**
     * Detect unsupported claims
     */
    HallucinationDetector.prototype.detectUnsupportedClaims = function (text) {
        var detections = [];
        // Strong claims without hedging
        var strongClaimPatterns = [
            /\b(always|never|all|none|every|no one)\s+\w+/gi,
            /\b(definitely|certainly|undoubtedly|clearly|obviously)\b/gi,
            /\b(the best|the worst|the only|the first|the most)\b/gi,
            /\b(proven|guaranteed|ensured|confirmed)\b/gi,
        ];
        for (var _i = 0, strongClaimPatterns_1 = strongClaimPatterns; _i < strongClaimPatterns_1.length; _i++) {
            var pattern = strongClaimPatterns_1[_i];
            var match = void 0;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                var content = match[0];
                var offset = match.index;
                // Check for nearby evidence
                var contextStart = Math.max(0, offset - 100);
                var contextEnd = Math.min(text.length, offset + content.length + 100);
                var context = text.slice(contextStart, contextEnd);
                // If there's evidence nearby, skip
                if (/because|since|according|study|research|data|source/i.test(context)) {
                    continue;
                }
                detections.push({
                    type: 'unsupported-claim',
                    risk: 'medium',
                    content: content,
                    offset: offset,
                    length: content.length,
                    reason: 'Strong claim without supporting evidence',
                    confidence: 0.5,
                    verification: 'Add supporting evidence or soften the claim',
                });
            }
        }
        return detections;
    };
    /**
     * Calculate overall risk score
     */
    HallucinationDetector.prototype.calculateRiskScore = function (detections) {
        if (detections.length === 0)
            return 0;
        var riskWeights = {
            high: 1.0,
            medium: 0.5,
            low: 0.2,
        };
        var totalRisk = detections.reduce(function (sum, d) {
            return sum + riskWeights[d.risk] * d.confidence;
        }, 0);
        // Normalize to 0-1, capped at reasonable levels
        return Math.min(1, totalRisk / 5);
    };
    /**
     * Convert risk score to level
     */
    HallucinationDetector.prototype.riskScoreToLevel = function (score) {
        if (score >= 0.7)
            return 'high';
        if (score >= 0.3)
            return 'medium';
        return 'low';
    };
    /**
     * Count detections by type
     */
    HallucinationDetector.prototype.countByType = function (detections) {
        var counts = {};
        for (var _i = 0, detections_1 = detections; _i < detections_1.length; _i++) {
            var detection = detections_1[_i];
            counts[detection.type] = (counts[detection.type] || 0) + 1;
        }
        return counts;
    };
    /**
     * Generate summary of detections
     */
    HallucinationDetector.prototype.generateSummary = function (detections) {
        if (detections.length === 0) {
            return 'No potential hallucinations detected.';
        }
        var highRisk = detections.filter(function (d) { return d.risk === 'high'; });
        var types = __spreadArray([], new Set(detections.map(function (d) { return d.type; })), true);
        var summary = "Found ".concat(detections.length, " potential issue(s). ");
        if (highRisk.length > 0) {
            summary += "".concat(highRisk.length, " high-risk detection(s). ");
        }
        summary += "Types: ".concat(types.join(', '), ".");
        return summary;
    };
    /**
     * Quick check for hallucinations
     */
    HallucinationDetector.prototype.hasHallucinations = function (text, options) {
        return this.detect(text, options).hasHallucinations;
    };
    /**
     * Get risk level for text
     */
    HallucinationDetector.prototype.getRiskLevel = function (text, options) {
        return this.detect(text, options).riskLevel;
    };
    return HallucinationDetector;
}());
exports.HallucinationDetector = HallucinationDetector;
// =============================================================================
// SINGLETON INSTANCE
// =============================================================================
/** Global hallucination detector instance */
exports.hallucinationDetector = new HallucinationDetector();
// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================
/**
 * Detect hallucinations in text
 */
function detectHallucinations(text, options) {
    return exports.hallucinationDetector.detect(text, options);
}
/**
 * Quick hallucination check
 */
function hasHallucinations(text, options) {
    return exports.hallucinationDetector.hasHallucinations(text, options);
}
/**
 * Get hallucination risk level
 */
function getHallucinationRisk(text, options) {
    return exports.hallucinationDetector.getRiskLevel(text, options);
}

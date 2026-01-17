"use strict";
/**
 * Embedding Service
 *
 * Provides text embeddings using OpenAI's embedding API.
 * Used for semantic skill matching.
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
exports.EmbeddingService = void 0;
/**
 * EmbeddingService - Generates embeddings using OpenAI API
 */
var EmbeddingService = /** @class */ (function () {
    function EmbeddingService(config) {
        this.baseUrl = 'https://api.openai.com/v1/embeddings';
        this.config = {
            apiKey: config.apiKey,
            model: config.model || 'text-embedding-3-small',
            dimensions: config.dimensions || (config.model === 'text-embedding-3-large' ? 3072 : 1536),
        };
    }
    /**
     * Generate embedding for a single text
     */
    EmbeddingService.prototype.embed = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!text || text.trim().length === 0) {
                            throw new Error('Cannot embed empty text');
                        }
                        return [4 /*yield*/, fetch(this.baseUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': "Bearer ".concat(this.config.apiKey),
                                },
                                body: JSON.stringify({
                                    input: text,
                                    model: this.config.model,
                                    dimensions: this.config.dimensions,
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        error = _a.sent();
                        throw new Error("OpenAI embedding API error: ".concat(response.status, " ").concat(error));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        return [2 /*return*/, {
                                embedding: data.data[0].embedding,
                                model: data.model,
                                usage: {
                                    promptTokens: data.usage.prompt_tokens,
                                    totalTokens: data.usage.total_tokens,
                                },
                            }];
                }
            });
        });
    };
    /**
     * Generate embeddings for multiple texts in a batch
     *
     * More efficient than calling embed() multiple times.
     * OpenAI supports up to 2048 inputs per batch.
     */
    EmbeddingService.prototype.embedBatch = function (texts) {
        return __awaiter(this, void 0, void 0, function () {
            var validTexts, i, response, error, data, results, i, originalIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (texts.length === 0) {
                            return [2 /*return*/, []];
                        }
                        if (texts.length > 2048) {
                            throw new Error('OpenAI supports max 2048 texts per batch. Split into multiple batches.');
                        }
                        validTexts = [];
                        for (i = 0; i < texts.length; i++) {
                            if (texts[i] && texts[i].trim().length > 0) {
                                validTexts.push({ text: texts[i], index: i });
                            }
                        }
                        if (validTexts.length === 0) {
                            throw new Error('Cannot embed empty texts');
                        }
                        return [4 /*yield*/, fetch(this.baseUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': "Bearer ".concat(this.config.apiKey),
                                },
                                body: JSON.stringify({
                                    input: validTexts.map(function (v) { return v.text; }),
                                    model: this.config.model,
                                    dimensions: this.config.dimensions,
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        error = _a.sent();
                        throw new Error("OpenAI embedding API error: ".concat(response.status, " ").concat(error));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        results = new Array(texts.length);
                        for (i = 0; i < validTexts.length; i++) {
                            originalIndex = validTexts[i].index;
                            results[originalIndex] = {
                                embedding: data.data[i].embedding,
                                model: data.model,
                                usage: {
                                    promptTokens: Math.floor(data.usage.prompt_tokens / validTexts.length),
                                    totalTokens: Math.floor(data.usage.total_tokens / validTexts.length),
                                },
                            };
                        }
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Calculate cosine similarity between two embeddings
     *
     * Returns value between -1 and 1, where:
     * - 1 = identical
     * - 0 = orthogonal (unrelated)
     * - -1 = opposite
     */
    EmbeddingService.cosineSimilarity = function (a, b) {
        if (a.length !== b.length) {
            throw new Error('Embeddings must have same dimensions');
        }
        var dotProduct = 0;
        var normA = 0;
        var normB = 0;
        for (var i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (normA * normB);
    };
    /**
     * Find top-k most similar embeddings
     */
    EmbeddingService.findTopKSimilar = function (query, candidates, k) {
        var similarities = candidates.map(function (candidate) { return ({
            id: candidate.id,
            similarity: EmbeddingService.cosineSimilarity(query, candidate.embedding),
        }); });
        // Sort by similarity descending
        similarities.sort(function (a, b) { return b.similarity - a.similarity; });
        return similarities.slice(0, k);
    };
    return EmbeddingService;
}());
exports.EmbeddingService = EmbeddingService;

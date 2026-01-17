"use strict";
/**
 * Embedding Cache
 *
 * Manages persistent storage of skill embeddings to avoid recomputing.
 * Stored in JSON file for fast loading.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingCache = void 0;
var fs = require("fs");
var path = require("path");
/**
 * EmbeddingCache - Manages persistent embedding storage
 */
var EmbeddingCache = /** @class */ (function () {
    function EmbeddingCache(config) {
        if (config === void 0) { config = {}; }
        var _a;
        this.dirty = false;
        this.config = {
            cachePath: config.cachePath || path.join(process.cwd(), '.cache', 'skill-embeddings.json'),
            ttl: config.ttl || 30 * 24 * 60 * 60 * 1000, // 30 days
            autoSave: (_a = config.autoSave) !== null && _a !== void 0 ? _a : true,
        };
        this.cache = this.loadCache();
    }
    /**
     * Load cache from disk
     */
    EmbeddingCache.prototype.loadCache = function () {
        try {
            if (fs.existsSync(this.config.cachePath)) {
                var data = fs.readFileSync(this.config.cachePath, 'utf-8');
                var cache = JSON.parse(data);
                // Validate cache structure
                if (!cache.version || !cache.embeddings) {
                    console.warn('Invalid cache structure, creating new cache');
                    return this.createEmptyCache();
                }
                return cache;
            }
        }
        catch (error) {
            console.warn('Failed to load embedding cache:', error);
        }
        return this.createEmptyCache();
    };
    /**
     * Create empty cache structure
     */
    EmbeddingCache.prototype.createEmptyCache = function () {
        return {
            version: 1,
            lastUpdated: Date.now(),
            model: 'text-embedding-3-small',
            embeddings: {},
        };
    };
    /**
     * Save cache to disk
     */
    EmbeddingCache.prototype.save = function () {
        try {
            // Ensure directory exists
            var dir = path.dirname(this.config.cachePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Write cache
            fs.writeFileSync(this.config.cachePath, JSON.stringify(this.cache, null, 2), 'utf-8');
            this.dirty = false;
        }
        catch (error) {
            console.error('Failed to save embedding cache:', error);
            throw error;
        }
    };
    /**
     * Get embedding for a skill
     */
    EmbeddingCache.prototype.get = function (skillId) {
        var cached = this.cache.embeddings[skillId];
        if (!cached)
            return undefined;
        // Check if expired
        if (Date.now() - cached.timestamp > this.config.ttl) {
            delete this.cache.embeddings[skillId];
            this.dirty = true;
            if (this.config.autoSave) {
                this.save();
            }
            return undefined;
        }
        return cached;
    };
    /**
     * Set embedding for a skill
     */
    EmbeddingCache.prototype.set = function (skillId, embedding, model, description) {
        this.cache.embeddings[skillId] = {
            skillId: skillId,
            embedding: embedding,
            model: model,
            timestamp: Date.now(),
            descriptionHash: this.hashString(description),
        };
        this.cache.lastUpdated = Date.now();
        this.cache.model = model;
        this.dirty = true;
        if (this.config.autoSave) {
            this.save();
        }
    };
    /**
     * Check if cache has valid embedding for a skill
     */
    EmbeddingCache.prototype.has = function (skillId, description) {
        var cached = this.get(skillId);
        if (!cached)
            return false;
        // Check if description changed
        var currentHash = this.hashString(description);
        if (cached.descriptionHash !== currentHash) {
            // Description changed, invalidate
            delete this.cache.embeddings[skillId];
            this.dirty = true;
            if (this.config.autoSave) {
                this.save();
            }
            return false;
        }
        return true;
    };
    /**
     * Get all cached embeddings
     */
    EmbeddingCache.prototype.getAll = function () {
        return Object.values(this.cache.embeddings);
    };
    /**
     * Find missing embeddings for a list of skills
     */
    EmbeddingCache.prototype.findMissing = function (skills) {
        var _this = this;
        return skills.filter(function (skill) { return !_this.has(skill.id, skill.description); });
    };
    /**
     * Batch set embeddings
     */
    EmbeddingCache.prototype.setBatch = function (embeddings) {
        for (var _i = 0, embeddings_1 = embeddings; _i < embeddings_1.length; _i++) {
            var item = embeddings_1[_i];
            this.cache.embeddings[item.skillId] = {
                skillId: item.skillId,
                embedding: item.embedding,
                model: item.model,
                timestamp: Date.now(),
                descriptionHash: this.hashString(item.description),
            };
        }
        this.cache.lastUpdated = Date.now();
        this.dirty = true;
        if (this.config.autoSave) {
            this.save();
        }
    };
    /**
     * Clear all cached embeddings
     */
    EmbeddingCache.prototype.clear = function () {
        this.cache = this.createEmptyCache();
        this.dirty = true;
        if (this.config.autoSave) {
            this.save();
        }
    };
    /**
     * Get cache statistics
     */
    EmbeddingCache.prototype.getStats = function () {
        var stats = {
            totalEmbeddings: Object.keys(this.cache.embeddings).length,
            lastUpdated: new Date(this.cache.lastUpdated),
            model: this.cache.model,
            cacheSize: 0,
        };
        try {
            if (fs.existsSync(this.config.cachePath)) {
                var fileStats = fs.statSync(this.config.cachePath);
                stats.cacheSize = fileStats.size;
            }
        }
        catch (_a) {
            // Ignore errors
        }
        return stats;
    };
    /**
     * Simple hash function for strings
     */
    EmbeddingCache.prototype.hashString = function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    };
    return EmbeddingCache;
}());
exports.EmbeddingCache = EmbeddingCache;

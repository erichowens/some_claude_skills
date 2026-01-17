"use strict";
/**
 * Skill Registry Loader
 *
 * Loads the 128+ available skills from the generated skills registry
 * and formats them for the task decomposer.
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
exports.loadAvailableSkills = loadAvailableSkills;
exports.getSkillsByCategory = getSkillsByCategory;
exports.getSkillsByTags = getSkillsByTags;
exports.searchSkills = searchSkills;
exports.getSkillById = getSkillById;
exports.createDecomposerConfig = createDecomposerConfig;
var skills_1 = require("../../data/skills");
/**
 * Load all available skills from the registry
 */
function loadAvailableSkills() {
    return skills_1.skills.map(function (skill) { return ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        categories: skill.category ? [skill.category] : [],
        tags: skill.tags || [],
    }); });
}
/**
 * Get skills for a specific category
 */
function getSkillsByCategory(category) {
    return loadAvailableSkills().filter(function (s) {
        return s.categories.some(function (c) { return c.toLowerCase() === category.toLowerCase(); });
    });
}
/**
 * Get skills matching specific tags
 */
function getSkillsByTags(tags) {
    var lowerTags = tags.map(function (t) { return t.toLowerCase(); });
    return loadAvailableSkills().filter(function (s) {
        return s.tags.some(function (tag) { return lowerTags.includes(tag.toLowerCase()); });
    });
}
/**
 * Search skills by keyword
 */
function searchSkills(query) {
    var lowerQuery = query.toLowerCase();
    return loadAvailableSkills().filter(function (s) {
        return s.name.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery) ||
            s.tags.some(function (tag) { return tag.toLowerCase().includes(lowerQuery); });
    });
}
/**
 * Get skill info by ID
 */
function getSkillById(id) {
    var skill = skills_1.skills.find(function (s) { return s.id === id; });
    if (!skill)
        return undefined;
    return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        categories: skill.category ? [skill.category] : [],
        tags: skill.tags || [],
    };
}
/**
 * Build decomposer config with all available skills
 */
function createDecomposerConfig(overrides) {
    return __assign({ availableSkills: loadAvailableSkills(), model: 'claude-sonnet-4-5-20250929', maxSubtasks: 10, temperature: 0.7 }, overrides);
}

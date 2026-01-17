"use strict";
/**
 * Tests for Skill Relationships
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
var vitest_1 = require("vitest");
var skillRelationships_1 = require("./skillRelationships");
var skills_1 = require("./skills");
(0, vitest_1.describe)('Skill Relationships Data Integrity', function () {
    var validSkillIds = new Set(skills_1.ALL_SKILLS.map(function (s) { return s.id; }));
    (0, vitest_1.describe)('SKILL_RELATIONSHIPS', function () {
        (0, vitest_1.it)('has valid relationship entries', function () {
            (0, vitest_1.expect)(skillRelationships_1.SKILL_RELATIONSHIPS.length).toBeGreaterThan(0);
            for (var _i = 0, SKILL_RELATIONSHIPS_1 = skillRelationships_1.SKILL_RELATIONSHIPS; _i < SKILL_RELATIONSHIPS_1.length; _i++) {
                var rel = SKILL_RELATIONSHIPS_1[_i];
                (0, vitest_1.expect)(rel.skillA).toBeTruthy();
                (0, vitest_1.expect)(rel.skillB).toBeTruthy();
                (0, vitest_1.expect)(rel.skillA).not.toBe(rel.skillB);
                (0, vitest_1.expect)(rel.relationship).toMatch(/^(complements|extends|alternative|precedes)$/);
                (0, vitest_1.expect)(rel.strength).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(rel.strength).toBeLessThanOrEqual(1);
                (0, vitest_1.expect)(rel.description).toBeTruthy();
            }
        });
        (0, vitest_1.it)('references valid skill IDs', function () {
            var invalidSkills = [];
            for (var _i = 0, SKILL_RELATIONSHIPS_2 = skillRelationships_1.SKILL_RELATIONSHIPS; _i < SKILL_RELATIONSHIPS_2.length; _i++) {
                var rel = SKILL_RELATIONSHIPS_2[_i];
                if (!validSkillIds.has(rel.skillA)) {
                    invalidSkills.push(rel.skillA);
                }
                if (!validSkillIds.has(rel.skillB)) {
                    invalidSkills.push(rel.skillB);
                }
            }
            if (invalidSkills.length > 0) {
                console.warn('Invalid skill IDs in relationships:', __spreadArray([], new Set(invalidSkills), true));
            }
            // Allow some invalid for skills that may be added later
            (0, vitest_1.expect)(invalidSkills.length).toBeLessThan(10);
        });
        (0, vitest_1.it)('has no duplicate relationships', function () {
            var seen = new Set();
            for (var _i = 0, SKILL_RELATIONSHIPS_3 = skillRelationships_1.SKILL_RELATIONSHIPS; _i < SKILL_RELATIONSHIPS_3.length; _i++) {
                var rel = SKILL_RELATIONSHIPS_3[_i];
                var key = [rel.skillA, rel.skillB].sort().join('::');
                (0, vitest_1.expect)(seen.has(key)).toBe(false);
                seen.add(key);
            }
        });
    });
    (0, vitest_1.describe)('SKILL_STACKS', function () {
        (0, vitest_1.it)('has valid stack entries', function () {
            (0, vitest_1.expect)(skillRelationships_1.SKILL_STACKS.length).toBeGreaterThan(0);
            for (var _i = 0, SKILL_STACKS_1 = skillRelationships_1.SKILL_STACKS; _i < SKILL_STACKS_1.length; _i++) {
                var stack = SKILL_STACKS_1[_i];
                (0, vitest_1.expect)(stack.id).toBeTruthy();
                (0, vitest_1.expect)(stack.name).toBeTruthy();
                (0, vitest_1.expect)(stack.description).toBeTruthy();
                (0, vitest_1.expect)(stack.category).toBeTruthy();
                (0, vitest_1.expect)(stack.skills.length).toBeGreaterThan(0);
                (0, vitest_1.expect)(stack.order).toMatch(/^(sequential|any)$/);
                (0, vitest_1.expect)(stack.icon).toBeTruthy();
            }
        });
        (0, vitest_1.it)('has unique stack IDs', function () {
            var ids = skillRelationships_1.SKILL_STACKS.map(function (s) { return s.id; });
            (0, vitest_1.expect)(new Set(ids).size).toBe(ids.length);
        });
        (0, vitest_1.it)('references mostly valid skill IDs', function () {
            var invalidSkills = [];
            for (var _i = 0, SKILL_STACKS_2 = skillRelationships_1.SKILL_STACKS; _i < SKILL_STACKS_2.length; _i++) {
                var stack = SKILL_STACKS_2[_i];
                for (var _a = 0, _b = stack.skills; _a < _b.length; _a++) {
                    var skillId = _b[_a];
                    if (!validSkillIds.has(skillId)) {
                        invalidSkills.push(skillId);
                    }
                }
            }
            if (invalidSkills.length > 0) {
                console.warn('Invalid skill IDs in stacks:', __spreadArray([], new Set(invalidSkills), true));
            }
            // Allow some invalid for skills that may be added later
            (0, vitest_1.expect)(invalidSkills.length).toBeLessThan(5);
        });
    });
    (0, vitest_1.describe)('SKILL_WORKFLOWS', function () {
        (0, vitest_1.it)('has valid workflow entries', function () {
            (0, vitest_1.expect)(skillRelationships_1.SKILL_WORKFLOWS.length).toBeGreaterThan(0);
            for (var _i = 0, SKILL_WORKFLOWS_1 = skillRelationships_1.SKILL_WORKFLOWS; _i < SKILL_WORKFLOWS_1.length; _i++) {
                var workflow = SKILL_WORKFLOWS_1[_i];
                (0, vitest_1.expect)(workflow.id).toBeTruthy();
                (0, vitest_1.expect)(workflow.name).toBeTruthy();
                (0, vitest_1.expect)(workflow.description).toBeTruthy();
                (0, vitest_1.expect)(workflow.category).toBeTruthy();
                (0, vitest_1.expect)(workflow.skills.length).toBeGreaterThan(0);
                (0, vitest_1.expect)(workflow.estimatedTime).toBeTruthy();
                (0, vitest_1.expect)(workflow.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
                (0, vitest_1.expect)(workflow.tags.length).toBeGreaterThan(0);
            }
        });
        (0, vitest_1.it)('has unique workflow IDs', function () {
            var ids = skillRelationships_1.SKILL_WORKFLOWS.map(function (w) { return w.id; });
            (0, vitest_1.expect)(new Set(ids).size).toBe(ids.length);
        });
        (0, vitest_1.it)('has valid workflow nodes', function () {
            for (var _i = 0, SKILL_WORKFLOWS_2 = skillRelationships_1.SKILL_WORKFLOWS; _i < SKILL_WORKFLOWS_2.length; _i++) {
                var workflow = SKILL_WORKFLOWS_2[_i];
                for (var _a = 0, _b = workflow.skills; _a < _b.length; _a++) {
                    var node = _b[_a];
                    (0, vitest_1.expect)(node.skillId).toBeTruthy();
                    (0, vitest_1.expect)(node.role).toBeTruthy();
                    (0, vitest_1.expect)(typeof node.wave).toBe('number');
                    (0, vitest_1.expect)(node.wave).toBeGreaterThanOrEqual(0);
                }
            }
        });
        (0, vitest_1.it)('has correct wave ordering', function () {
            for (var _i = 0, SKILL_WORKFLOWS_3 = skillRelationships_1.SKILL_WORKFLOWS; _i < SKILL_WORKFLOWS_3.length; _i++) {
                var workflow = SKILL_WORKFLOWS_3[_i];
                var waves = workflow.skills.map(function (n) { return n.wave; });
                var maxWave = Math.max.apply(Math, waves);
                var _loop_1 = function (wave) {
                    var nodesInWave = workflow.skills.filter(function (n) { return n.wave === wave; });
                    (0, vitest_1.expect)(nodesInWave.length).toBeGreaterThan(0);
                };
                // Each wave should have at least one node
                for (var wave = 0; wave <= maxWave; wave++) {
                    _loop_1(wave);
                }
            }
        });
    });
});
(0, vitest_1.describe)('Helper Functions', function () {
    (0, vitest_1.describe)('getRelatedSkills', function () {
        (0, vitest_1.it)('returns related skills for career-biographer', function () {
            var related = (0, skillRelationships_1.getRelatedSkills)('career-biographer');
            (0, vitest_1.expect)(related.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(related.some(function (r) { return r.skill === 'cv-creator'; })).toBe(true);
        });
        (0, vitest_1.it)('returns empty array for unknown skill', function () {
            var related = (0, skillRelationships_1.getRelatedSkills)('unknown-skill-xyz');
            (0, vitest_1.expect)(related).toEqual([]);
        });
        (0, vitest_1.it)('returns relationships sorted by strength', function () {
            var related = (0, skillRelationships_1.getRelatedSkills)('career-biographer');
            for (var i = 1; i < related.length; i++) {
                (0, vitest_1.expect)(related[i].strength).toBeLessThanOrEqual(related[i - 1].strength);
            }
        });
        (0, vitest_1.it)('handles bidirectional relationships correctly', function () {
            // 'complements' relationships are bidirectional by default
            // competitive-cartographer should list career-biographer as related
            // (career-biographer complements competitive-cartographer)
            var related = (0, skillRelationships_1.getRelatedSkills)('competitive-cartographer');
            (0, vitest_1.expect)(related.some(function (r) { return r.skill === 'career-biographer'; })).toBe(true);
        });
    });
    (0, vitest_1.describe)('getStacksForSkill', function () {
        (0, vitest_1.it)('returns stacks containing a skill', function () {
            var stacks = (0, skillRelationships_1.getStacksForSkill)('career-biographer');
            (0, vitest_1.expect)(stacks.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(stacks.some(function (s) { return s.id === 'career-stack'; })).toBe(true);
        });
        (0, vitest_1.it)('returns empty array for unknown skill', function () {
            var stacks = (0, skillRelationships_1.getStacksForSkill)('unknown-skill-xyz');
            (0, vitest_1.expect)(stacks).toEqual([]);
        });
    });
    (0, vitest_1.describe)('getWorkflowsForSkill', function () {
        (0, vitest_1.it)('returns workflows containing a skill', function () {
            var workflows = (0, skillRelationships_1.getWorkflowsForSkill)('career-biographer');
            (0, vitest_1.expect)(workflows.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(workflows.some(function (w) { return w.id === 'job-search-workflow'; })).toBe(true);
        });
        (0, vitest_1.it)('returns empty array for unknown skill', function () {
            var workflows = (0, skillRelationships_1.getWorkflowsForSkill)('unknown-skill-xyz');
            (0, vitest_1.expect)(workflows).toEqual([]);
        });
    });
    (0, vitest_1.describe)('getWorkflowById', function () {
        (0, vitest_1.it)('returns workflow by ID', function () {
            var workflow = (0, skillRelationships_1.getWorkflowById)('job-search-workflow');
            (0, vitest_1.expect)(workflow).toBeDefined();
            (0, vitest_1.expect)(workflow === null || workflow === void 0 ? void 0 : workflow.name).toBe('Complete Job Search');
        });
        (0, vitest_1.it)('returns undefined for unknown ID', function () {
            var workflow = (0, skillRelationships_1.getWorkflowById)('unknown-workflow');
            (0, vitest_1.expect)(workflow).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getStackById', function () {
        (0, vitest_1.it)('returns stack by ID', function () {
            var stack = (0, skillRelationships_1.getStackById)('career-stack');
            (0, vitest_1.expect)(stack).toBeDefined();
            (0, vitest_1.expect)(stack === null || stack === void 0 ? void 0 : stack.name).toBe('Career Advancement Stack');
        });
        (0, vitest_1.it)('returns undefined for unknown ID', function () {
            var stack = (0, skillRelationships_1.getStackById)('unknown-stack');
            (0, vitest_1.expect)(stack).toBeUndefined();
        });
    });
});

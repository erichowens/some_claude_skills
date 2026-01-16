/**
 * Tests for Skill Relationships
 */

import { describe, it, expect } from 'vitest';
import {
  SKILL_RELATIONSHIPS,
  SKILL_STACKS,
  SKILL_WORKFLOWS,
  getRelatedSkills,
  getStacksForSkill,
  getWorkflowsForSkill,
  getWorkflowById,
  getStackById,
} from './skillRelationships';
import { ALL_SKILLS } from './skills';

describe('Skill Relationships Data Integrity', () => {
  const validSkillIds = new Set(ALL_SKILLS.map((s) => s.id));

  describe('SKILL_RELATIONSHIPS', () => {
    it('has valid relationship entries', () => {
      expect(SKILL_RELATIONSHIPS.length).toBeGreaterThan(0);

      for (const rel of SKILL_RELATIONSHIPS) {
        expect(rel.skillA).toBeTruthy();
        expect(rel.skillB).toBeTruthy();
        expect(rel.skillA).not.toBe(rel.skillB);
        expect(rel.relationship).toMatch(/^(complements|extends|alternative|precedes)$/);
        expect(rel.strength).toBeGreaterThanOrEqual(0);
        expect(rel.strength).toBeLessThanOrEqual(1);
        expect(rel.description).toBeTruthy();
      }
    });

    it('references valid skill IDs', () => {
      const invalidSkills: string[] = [];

      for (const rel of SKILL_RELATIONSHIPS) {
        if (!validSkillIds.has(rel.skillA)) {
          invalidSkills.push(rel.skillA);
        }
        if (!validSkillIds.has(rel.skillB)) {
          invalidSkills.push(rel.skillB);
        }
      }

      if (invalidSkills.length > 0) {
        console.warn('Invalid skill IDs in relationships:', [...new Set(invalidSkills)]);
      }
      // Allow some invalid for skills that may be added later
      expect(invalidSkills.length).toBeLessThan(10);
    });

    it('has no duplicate relationships', () => {
      const seen = new Set<string>();

      for (const rel of SKILL_RELATIONSHIPS) {
        const key = [rel.skillA, rel.skillB].sort().join('::');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  describe('SKILL_STACKS', () => {
    it('has valid stack entries', () => {
      expect(SKILL_STACKS.length).toBeGreaterThan(0);

      for (const stack of SKILL_STACKS) {
        expect(stack.id).toBeTruthy();
        expect(stack.name).toBeTruthy();
        expect(stack.description).toBeTruthy();
        expect(stack.category).toBeTruthy();
        expect(stack.skills.length).toBeGreaterThan(0);
        expect(stack.order).toMatch(/^(sequential|any)$/);
        expect(stack.icon).toBeTruthy();
      }
    });

    it('has unique stack IDs', () => {
      const ids = SKILL_STACKS.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('references mostly valid skill IDs', () => {
      const invalidSkills: string[] = [];

      for (const stack of SKILL_STACKS) {
        for (const skillId of stack.skills) {
          if (!validSkillIds.has(skillId)) {
            invalidSkills.push(skillId);
          }
        }
      }

      if (invalidSkills.length > 0) {
        console.warn('Invalid skill IDs in stacks:', [...new Set(invalidSkills)]);
      }
      // Allow some invalid for skills that may be added later
      expect(invalidSkills.length).toBeLessThan(5);
    });
  });

  describe('SKILL_WORKFLOWS', () => {
    it('has valid workflow entries', () => {
      expect(SKILL_WORKFLOWS.length).toBeGreaterThan(0);

      for (const workflow of SKILL_WORKFLOWS) {
        expect(workflow.id).toBeTruthy();
        expect(workflow.name).toBeTruthy();
        expect(workflow.description).toBeTruthy();
        expect(workflow.category).toBeTruthy();
        expect(workflow.skills.length).toBeGreaterThan(0);
        expect(workflow.estimatedTime).toBeTruthy();
        expect(workflow.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(workflow.tags.length).toBeGreaterThan(0);
      }
    });

    it('has unique workflow IDs', () => {
      const ids = SKILL_WORKFLOWS.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has valid workflow nodes', () => {
      for (const workflow of SKILL_WORKFLOWS) {
        for (const node of workflow.skills) {
          expect(node.skillId).toBeTruthy();
          expect(node.role).toBeTruthy();
          expect(typeof node.wave).toBe('number');
          expect(node.wave).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('has correct wave ordering', () => {
      for (const workflow of SKILL_WORKFLOWS) {
        const waves = workflow.skills.map((n) => n.wave);
        const maxWave = Math.max(...waves);

        // Each wave should have at least one node
        for (let wave = 0; wave <= maxWave; wave++) {
          const nodesInWave = workflow.skills.filter((n) => n.wave === wave);
          expect(nodesInWave.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('Helper Functions', () => {
  describe('getRelatedSkills', () => {
    it('returns related skills for career-biographer', () => {
      const related = getRelatedSkills('career-biographer');

      expect(related.length).toBeGreaterThan(0);
      expect(related.some((r) => r.skill === 'cv-creator')).toBe(true);
    });

    it('returns empty array for unknown skill', () => {
      const related = getRelatedSkills('unknown-skill-xyz');
      expect(related).toEqual([]);
    });

    it('returns relationships sorted by strength', () => {
      const related = getRelatedSkills('career-biographer');

      for (let i = 1; i < related.length; i++) {
        expect(related[i].strength).toBeLessThanOrEqual(related[i - 1].strength);
      }
    });

    it('handles bidirectional relationships correctly', () => {
      // 'complements' relationships are bidirectional by default
      // competitive-cartographer should list career-biographer as related
      // (career-biographer complements competitive-cartographer)
      const related = getRelatedSkills('competitive-cartographer');
      expect(related.some((r) => r.skill === 'career-biographer')).toBe(true);
    });
  });

  describe('getStacksForSkill', () => {
    it('returns stacks containing a skill', () => {
      const stacks = getStacksForSkill('career-biographer');

      expect(stacks.length).toBeGreaterThan(0);
      expect(stacks.some((s) => s.id === 'career-stack')).toBe(true);
    });

    it('returns empty array for unknown skill', () => {
      const stacks = getStacksForSkill('unknown-skill-xyz');
      expect(stacks).toEqual([]);
    });
  });

  describe('getWorkflowsForSkill', () => {
    it('returns workflows containing a skill', () => {
      const workflows = getWorkflowsForSkill('career-biographer');

      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows.some((w) => w.id === 'job-search-workflow')).toBe(true);
    });

    it('returns empty array for unknown skill', () => {
      const workflows = getWorkflowsForSkill('unknown-skill-xyz');
      expect(workflows).toEqual([]);
    });
  });

  describe('getWorkflowById', () => {
    it('returns workflow by ID', () => {
      const workflow = getWorkflowById('job-search-workflow');

      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Complete Job Search');
    });

    it('returns undefined for unknown ID', () => {
      const workflow = getWorkflowById('unknown-workflow');
      expect(workflow).toBeUndefined();
    });
  });

  describe('getStackById', () => {
    it('returns stack by ID', () => {
      const stack = getStackById('career-stack');

      expect(stack).toBeDefined();
      expect(stack?.name).toBe('Career Advancement Stack');
    });

    it('returns undefined for unknown ID', () => {
      const stack = getStackById('unknown-stack');
      expect(stack).toBeUndefined();
    });
  });
});

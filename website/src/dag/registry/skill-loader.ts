/**
 * Skill Registry Loader
 *
 * Loads the 128+ available skills from the generated skills registry
 * and formats them for the task decomposer.
 */

import { skills } from '../../data/skills';
import type { DecomposerConfig } from '../core/task-decomposer';

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  categories: string[];
  tags: string[];
}

/**
 * Load all available skills from the registry
 */
export function loadAvailableSkills(): SkillInfo[] {
  return skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    categories: skill.category ? [skill.category] : [],
    tags: skill.tags || [],
  }));
}

/**
 * Get skills for a specific category
 */
export function getSkillsByCategory(category: string): SkillInfo[] {
  return loadAvailableSkills().filter(s =>
    s.categories.some(c => c.toLowerCase() === category.toLowerCase())
  );
}

/**
 * Get skills matching specific tags
 */
export function getSkillsByTags(tags: string[]): SkillInfo[] {
  const lowerTags = tags.map(t => t.toLowerCase());
  return loadAvailableSkills().filter(s =>
    s.tags.some(tag => lowerTags.includes(tag.toLowerCase()))
  );
}

/**
 * Search skills by keyword
 */
export function searchSkills(query: string): SkillInfo[] {
  const lowerQuery = query.toLowerCase();
  return loadAvailableSkills().filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.description.toLowerCase().includes(lowerQuery) ||
    s.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get skill info by ID
 */
export function getSkillById(id: string): SkillInfo | undefined {
  const skill = skills.find(s => s.id === id);
  if (!skill) return undefined;

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
export function createDecomposerConfig(
  overrides?: Partial<DecomposerConfig>
): Omit<DecomposerConfig, 'apiKey'> & { apiKey?: string } {
  return {
    availableSkills: loadAvailableSkills(),
    model: 'claude-sonnet-4-5-20250929',
    maxSubtasks: 10,
    temperature: 0.7,
    ...overrides,
  };
}

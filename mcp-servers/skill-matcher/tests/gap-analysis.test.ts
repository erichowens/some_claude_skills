/**
 * Gap Analysis Module Tests
 *
 * Tests for skill gap detection and new skill recommendation.
 */

import { describe, it, expect } from 'vitest';
import { analyzeGap } from '../src/gap-analysis.js';
import type { SkillCatalogEntry, MatchResult } from '../src/types.js';

// Mock skill catalog for testing
const mockSkills: SkillCatalogEntry[] = [
  {
    id: 'web-design-expert',
    type: 'skill',
    name: 'Web Design Expert',
    description: 'Expert web designer specializing in modern web design principles and brand identity.',
    category: 'visual-design-ui',
    activation: {
      triggers: ['web design', 'website', 'landing page', 'UI/UX'],
      notFor: ['mobile apps', 'native apps'],
    },
    tags: [{ id: 'design', name: 'Design' }, { id: 'web', name: 'Web' }],
  },
  {
    id: 'drone-cv-expert',
    type: 'skill',
    name: 'Drone CV Expert',
    description: 'Expert in drone systems, computer vision, and autonomous navigation.',
    category: 'autonomous-systems-robotics',
    activation: {
      triggers: ['drone', 'UAV', 'computer vision', 'SLAM'],
      notFor: ['general image processing'],
    },
    tags: [{ id: 'ai', name: 'AI' }, { id: 'robotics', name: 'Robotics' }],
  },
  {
    id: 'jungian-psychologist',
    type: 'skill',
    name: 'Jungian Psychologist',
    description: 'Expert in Jungian analytical psychology and archetypal patterns.',
    category: 'coaching-personal-development',
    activation: {
      triggers: ['Jung', 'shadow work', 'archetypes', 'individuation'],
      notFor: ['clinical diagnosis', 'medication'],
    },
    tags: [{ id: 'psychology', name: 'Psychology' }],
  },
];

// Mock match results
const lowScoreMatches: MatchResult[] = [
  {
    skill: mockSkills[0],
    score: 0.3,
    matchType: 'semantic',
    reasoning: 'Low semantic similarity',
  },
];

const noMatches: MatchResult[] = [];

describe('analyzeGap', () => {
  it('should identify gap when no matches exist', () => {
    const analysis = analyzeGap(
      'Help me build a blockchain smart contract',
      mockSkills,
      noMatches
    );

    expect(analysis.identified).toBe(true);
    expect(analysis.opportunity).toBeDefined();
    expect(analysis.opportunity.name).toBeDefined();
    expect(analysis.opportunity.description).toBeDefined();
  });

  it('should identify gap when matches are low-scoring', () => {
    const analysis = analyzeGap(
      'Help me create 3D game assets in Blender',
      mockSkills,
      lowScoreMatches
    );

    expect(analysis.identified).toBe(true);
    expect(analysis.opportunity).toBeDefined();
  });

  it('should include research topics', () => {
    const analysis = analyzeGap(
      'Help me build a quantum computing algorithm',
      mockSkills,
      noMatches
    );

    expect(analysis.research).toBeDefined();
    expect(analysis.research.topics).toBeDefined();
    expect(analysis.research.topics.length).toBeGreaterThan(0);
  });

  it('should suggest activation triggers', () => {
    const analysis = analyzeGap(
      'Help me with Kubernetes cluster management',
      mockSkills,
      noMatches
    );

    expect(analysis.opportunity.suggestedTriggers).toBeDefined();
    expect(analysis.opportunity.suggestedTriggers.length).toBeGreaterThan(0);
  });

  it('should identify related existing skills', () => {
    const analysis = analyzeGap(
      'Help me with mobile app UI design for iOS',
      mockSkills,
      lowScoreMatches
    );

    expect(analysis.relatedSkills).toBeDefined();
    // Related skills should include those from matches
    expect(analysis.relatedSkills.length).toBeGreaterThan(0);
  });

  it('should return identified=true for all gap analyses', () => {
    const goodMatches: MatchResult[] = [
      {
        skill: mockSkills[0],
        score: 0.85,
        matchType: 'hybrid',
        reasoning: 'Strong match on web design',
      },
    ];

    const analysis = analyzeGap(
      'Help me design a website',
      mockSkills,
      goodMatches
    );

    // Gap analysis always returns identified=true (the function is for when there's a gap)
    expect(analysis.identified).toBe(true);
  });

  it('should generate meaningful skill name', () => {
    const analysis = analyzeGap(
      'Help me compose music using AI and synthesizers',
      mockSkills,
      noMatches
    );

    expect(analysis.opportunity.name).toBeDefined();
    expect(analysis.opportunity.name.length).toBeGreaterThan(3);
  });

  it('should handle empty prompt gracefully', () => {
    const analysis = analyzeGap('', mockSkills, noMatches);
    expect(analysis).toBeDefined();
    expect(analysis.identified).toBe(true);
  });

  it('should handle empty skill catalog', () => {
    const analysis = analyzeGap(
      'Any query here',
      [],
      noMatches
    );

    expect(analysis.identified).toBe(true);
    expect(analysis.relatedSkills).toEqual([]);
  });

  it('should provide success criteria for new skill', () => {
    const analysis = analyzeGap(
      'Help me with automated testing and CI/CD pipelines',
      mockSkills,
      noMatches
    );

    expect(analysis.successCriteria).toBeDefined();
    expect(analysis.successCriteria.metrics).toBeDefined();
    expect(analysis.successCriteria.metrics.length).toBeGreaterThan(0);
    expect(analysis.successCriteria.testCases).toBeDefined();
  });

  it('should categorize the suggested skill appropriately', () => {
    const analysis = analyzeGap(
      'Help me with financial modeling and investment analysis',
      mockSkills,
      noMatches
    );

    expect(analysis.opportunity.category).toBeDefined();
    // Financial analysis might fall into research-strategy
    expect(typeof analysis.opportunity.category).toBe('string');
  });
});

describe('Gap Analysis Quality', () => {
  it('should extract key concepts from query', () => {
    const analysis = analyzeGap(
      'I need help setting up a Kubernetes cluster with Istio service mesh and Prometheus monitoring',
      mockSkills,
      noMatches
    );

    // Should identify multiple technical concepts
    const triggers = analysis.opportunity.suggestedTriggers;
    expect(triggers.length).toBeGreaterThan(0);

    // Check that at least some relevant terms are present
    const triggersJoined = triggers.join(' ').toLowerCase();
    const hasRelevantTerms =
      triggersJoined.includes('kubernetes') ||
      triggersJoined.includes('monitoring') ||
      triggersJoined.includes('cluster') ||
      triggersJoined.includes('istio') ||
      triggersJoined.includes('prometheus');

    expect(hasRelevantTerms).toBe(true);
  });

  it('should identify related skills in same category', () => {
    const analysis = analyzeGap(
      'Help me with autonomous vehicle navigation and sensor fusion',
      mockSkills,
      []
    );

    // Should find drone-cv-expert as related (same autonomous-systems category)
    // Either via category match or via relatedSkills
    expect(analysis.opportunity.category).toBe('autonomous-systems-robotics');
  });

  it('should provide resource suggestions for research', () => {
    const analysis = analyzeGap(
      'Help me design a mobile app interface',
      mockSkills,
      noMatches
    );

    expect(analysis.research.resources).toBeDefined();
    expect(analysis.research.resources.length).toBeGreaterThan(0);
  });
});

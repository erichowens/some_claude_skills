/**
 * Gap Analysis Module
 *
 * When no existing skill matches a user's prompt, this module analyzes the gap
 * and suggests how a new skill could be created to fill it.
 */

import type {
  SkillCatalogEntry,
  GapAnalysis,
  SkillCategory,
  MatchResult,
} from './types.js';

// ============================================================================
// Category Detection
// ============================================================================

const CATEGORY_KEYWORDS: Record<SkillCategory, string[]> = {
  'orchestration-meta': [
    'coordinate', 'orchestrate', 'manage', 'automate', 'workflow',
    'pipeline', 'multi-step', 'agent', 'delegate', 'meta',
  ],
  'visual-design-ui': [
    'design', 'ui', 'ux', 'interface', 'visual', 'layout', 'color',
    'typography', 'brand', 'aesthetic', 'css', 'style', 'theme',
  ],
  'graphics-3d-simulation': [
    '3d', 'render', 'shader', 'graphics', 'simulation', 'physics',
    'animation', 'vr', 'ar', 'webgl', 'opengl', 'metal', 'vulkan',
  ],
  'audio-sound-design': [
    'audio', 'sound', 'music', 'voice', 'speech', 'dsp', 'wav',
    'synthesizer', 'spatial audio', 'podcast', 'recording',
  ],
  'computer-vision-image-ai': [
    'image', 'photo', 'vision', 'detect', 'recognize', 'segment',
    'ocr', 'face', 'object detection', 'classification', 'clip',
  ],
  'autonomous-systems-robotics': [
    'robot', 'drone', 'autonomous', 'navigation', 'slam', 'sensor',
    'control', 'pid', 'path planning', 'iot', 'embedded',
  ],
  'conversational-ai-bots': [
    'bot', 'chatbot', 'discord', 'telegram', 'slack', 'conversation',
    'dialogue', 'assistant', 'moderation', 'command',
  ],
  'research-strategy': [
    'research', 'analyze', 'strategy', 'competitive', 'market',
    'landscape', 'trend', 'report', 'data analysis', 'insight',
  ],
  'coaching-personal-development': [
    'coach', 'mentor', 'career', 'personal', 'growth', 'advice',
    'psychology', 'wellness', 'finance', 'resume', 'cv', 'job',
  ],
  'devops-site-reliability': [
    'devops', 'deploy', 'infrastructure', 'ci/cd', 'monitoring',
    'reliability', 'kubernetes', 'docker', 'cloud', 'aws', 'gcp',
  ],
  'business-monetization': [
    'monetize', 'pricing', 'business', 'revenue', 'startup',
    'saas', 'subscription', 'freemium', 'marketing',
  ],
  'documentation-visualization': [
    'document', 'diagram', 'chart', 'visualization', 'flowchart',
    'architecture', 'readme', 'wiki', 'specification',
  ],
};

function detectCategory(query: string): SkillCategory {
  const queryLower = query.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.reduce((score, keyword) => {
      if (queryLower.includes(keyword)) {
        return score + (keyword.includes(' ') ? 2 : 1); // Phrase matches score higher
      }
      return score;
    }, 0);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return (sorted[0][1] > 0 ? sorted[0][0] : 'research-strategy') as SkillCategory;
}

// ============================================================================
// Trigger Extraction
// ============================================================================

function extractSuggestedTriggers(query: string): string[] {
  const triggers: string[] = [];
  const queryLower = query.toLowerCase();

  // Extract noun phrases (simplified)
  const words = queryLower
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Look for action verbs
  const actionVerbs = [
    'create', 'build', 'generate', 'analyze', 'design', 'implement',
    'optimize', 'convert', 'transform', 'extract', 'validate', 'test',
    'automate', 'integrate', 'deploy', 'monitor', 'debug', 'refactor',
  ];

  for (const verb of actionVerbs) {
    if (queryLower.includes(verb)) {
      const idx = queryLower.indexOf(verb);
      const context = queryLower.slice(idx, idx + 40).split(' ').slice(0, 4).join(' ');
      if (context.length > verb.length + 3) {
        triggers.push(context.trim());
      }
    }
  }

  // Extract key noun phrases
  const technicalTerms = words.filter(w =>
    w.length > 4 &&
    !['want', 'need', 'help', 'please', 'could', 'would', 'should'].includes(w)
  );

  triggers.push(...technicalTerms.slice(0, 5));

  return [...new Set(triggers)].slice(0, 8);
}

// ============================================================================
// Research Topic Generation
// ============================================================================

function generateResearchTopics(query: string, category: SkillCategory): string[] {
  const topics: string[] = [];
  const queryLower = query.toLowerCase();

  // Domain-specific research topics
  const domainTopics: Record<string, string[]> = {
    'visual-design-ui': [
      'Design patterns and UI frameworks',
      'Color theory and accessibility standards (WCAG)',
      'Typography best practices',
      'Responsive design techniques',
    ],
    'computer-vision-image-ai': [
      'Pre-trained models (CLIP, YOLO, SAM)',
      'Image processing libraries (OpenCV, Pillow)',
      'Evaluation metrics (mAP, IoU, SSIM)',
      'Dataset requirements and annotation',
    ],
    'audio-sound-design': [
      'Digital signal processing fundamentals',
      'Audio APIs (Web Audio, CoreAudio)',
      'Codec and format considerations',
      'Spatial audio and 3D sound',
    ],
    'autonomous-systems-robotics': [
      'Control theory and PID tuning',
      'SLAM algorithms',
      'Sensor fusion techniques',
      'Safety and regulatory requirements',
    ],
    'coaching-personal-development': [
      'Evidence-based coaching methodologies',
      'Psychological frameworks',
      'Privacy and ethical considerations',
      'Outcome measurement and tracking',
    ],
  };

  // Add domain-specific topics
  if (domainTopics[category]) {
    topics.push(...domainTopics[category]);
  }

  // Extract technology mentions
  const techPatterns = [
    /\b(react|vue|angular|svelte)\b/i,
    /\b(python|javascript|typescript|rust|go)\b/i,
    /\b(api|rest|graphql|grpc)\b/i,
    /\b(docker|kubernetes|aws|gcp|azure)\b/i,
    /\b(tensorflow|pytorch|scikit|numpy)\b/i,
  ];

  for (const pattern of techPatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      topics.push(`${match[0]} ecosystem and best practices`);
    }
  }

  // Generic research topics
  topics.push(
    'Existing tools and libraries in this space',
    'Common pitfalls and anti-patterns',
    'Industry standards and benchmarks',
  );

  return [...new Set(topics)].slice(0, 6);
}

// ============================================================================
// Success Criteria Generation
// ============================================================================

function generateSuccessCriteria(
  query: string,
  category: SkillCategory,
  suggestedName: string
): { metrics: string[]; testCases: string[]; validation: string } {
  const metrics: string[] = [];
  const testCases: string[] = [];

  // Category-specific metrics
  const categoryMetrics: Record<string, string[]> = {
    'visual-design-ui': [
      'Design consistency score across components',
      'Accessibility compliance (WCAG 2.1 AA)',
      'Load time and performance metrics',
    ],
    'computer-vision-image-ai': [
      'Precision, recall, and F1 score',
      'Processing speed (images/second)',
      'Memory usage and model size',
    ],
    'audio-sound-design': [
      'Signal-to-noise ratio',
      'Latency measurements',
      'Format compatibility coverage',
    ],
    'coaching-personal-development': [
      'User satisfaction ratings',
      'Goal achievement rate',
      'Engagement and retention metrics',
    ],
    'devops-site-reliability': [
      'Mean time to recovery (MTTR)',
      'Deployment success rate',
      'System uptime percentage',
    ],
  };

  if (categoryMetrics[category]) {
    metrics.push(...categoryMetrics[category]);
  }

  metrics.push(
    'User task completion rate',
    'Error rate and edge case handling',
    'Response time and efficiency',
  );

  // Generate test cases from the query
  testCases.push(
    `Given the original prompt "${query.slice(0, 50)}...", skill produces expected output`,
    'Handles edge cases gracefully without errors',
    'Produces consistent results across multiple invocations',
    'Correctly identifies when task is outside skill scope (anti-pattern test)',
    'Integrates properly with related skills in the ecosystem',
  );

  const validation = `The ${suggestedName} skill is considered successful when it can reliably handle the types of requests that led to its creation, demonstrates clear value over manual approaches, and has measurable positive impact on user workflows.`;

  return {
    metrics: [...new Set(metrics)].slice(0, 5),
    testCases: testCases.slice(0, 5),
    validation,
  };
}

// ============================================================================
// Name Generation
// ============================================================================

function generateSkillName(query: string, category: SkillCategory): string {
  const queryLower = query.toLowerCase();

  // Extract key action and subject
  const actionWords = [
    'create', 'build', 'generate', 'analyze', 'design', 'implement',
    'optimize', 'convert', 'transform', 'extract', 'validate',
  ];

  let action = '';
  for (const word of actionWords) {
    if (queryLower.includes(word)) {
      action = word;
      break;
    }
  }

  // Extract the main subject
  const subjectPatterns = [
    /(?:for|with|using)\s+(\w+(?:\s+\w+)?)/i,
    /(\w+(?:\s+\w+)?)\s+(?:system|tool|generator|analyzer)/i,
    /(?:create|build|make)\s+(?:a\s+)?(\w+(?:\s+\w+)?)/i,
  ];

  let subject = '';
  for (const pattern of subjectPatterns) {
    const match = query.match(pattern);
    if (match) {
      subject = match[1];
      break;
    }
  }

  if (!subject) {
    // Fallback: use most significant words
    const words = queryLower
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['would', 'could', 'should', 'please', 'help'].includes(w));
    subject = words.slice(0, 2).join(' ');
  }

  // Category suffix suggestions
  const categorySuffixes: Record<string, string> = {
    'visual-design-ui': 'Designer',
    'computer-vision-image-ai': 'Vision Expert',
    'audio-sound-design': 'Audio Engineer',
    'coaching-personal-development': 'Coach',
    'research-strategy': 'Analyst',
    'devops-site-reliability': 'Engineer',
    'autonomous-systems-robotics': 'Systems Expert',
  };

  const suffix = categorySuffixes[category] || 'Expert';

  // Clean up and format
  const name = `${subject} ${suffix}`
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .slice(0, 40);

  return name || 'Custom Skill';
}

// ============================================================================
// Main Gap Analysis Function
// ============================================================================

export function analyzeGap(
  query: string,
  existingSkills: SkillCatalogEntry[],
  topMatches: MatchResult[]
): GapAnalysis {
  const category = detectCategory(query);
  const suggestedName = generateSkillName(query, category);
  const suggestedTriggers = extractSuggestedTriggers(query);
  const researchTopics = generateResearchTopics(query, category);
  const successCriteria = generateSuccessCriteria(query, category, suggestedName);

  // Find related skills (even if they weren't good matches)
  const relatedSkills = topMatches
    .filter(m => m.score > 0.2)
    .map(m => m.skill.id)
    .slice(0, 3);

  // Also find skills in the same category
  const categorySkills = existingSkills
    .filter(s => s.category === category)
    .map(s => s.id)
    .slice(0, 3);

  const allRelated = [...new Set([...relatedSkills, ...categorySkills])].slice(0, 5);

  // Identify existing tools that might be useful
  const existingTools: string[] = [];
  for (const skill of existingSkills) {
    if (skill.capabilities?.tools) {
      existingTools.push(...skill.capabilities.tools);
    }
  }

  return {
    identified: true,
    opportunity: {
      name: suggestedName,
      description: generateDescription(query, suggestedName, category),
      category,
      suggestedTriggers,
    },
    research: {
      topics: researchTopics,
      resources: generateResourceSuggestions(category),
      existingTools: [...new Set(existingTools)].slice(0, 5),
    },
    successCriteria,
    relatedSkills: allRelated,
  };
}

function generateDescription(
  query: string,
  name: string,
  category: SkillCategory
): string {
  const categoryDescriptions: Record<string, string> = {
    'visual-design-ui': 'specialized in visual design and user interface creation',
    'computer-vision-image-ai': 'expert in image analysis and computer vision',
    'audio-sound-design': 'specialized in audio processing and sound design',
    'coaching-personal-development': 'focused on guidance and personal growth',
    'research-strategy': 'expert in research and strategic analysis',
    'devops-site-reliability': 'specialized in deployment and reliability engineering',
  };

  const focus = categoryDescriptions[category] || 'specialized in this domain';

  // Create a description based on the query
  const queryVerb = query.toLowerCase().includes('create') ? 'creating' :
    query.toLowerCase().includes('analyze') ? 'analyzing' :
      query.toLowerCase().includes('optimize') ? 'optimizing' :
        'handling';

  return `${name} skill ${focus}. Designed for ${queryVerb} tasks like: "${query.slice(0, 100)}${query.length > 100 ? '...' : ''}"`;
}

function generateResourceSuggestions(category: SkillCategory): string[] {
  const resources: Record<string, string[]> = {
    'visual-design-ui': [
      'Material Design Guidelines',
      'Apple Human Interface Guidelines',
      'A11y Project accessibility resources',
    ],
    'computer-vision-image-ai': [
      'Papers With Code - Computer Vision',
      'Hugging Face Model Hub',
      'OpenCV documentation',
    ],
    'audio-sound-design': [
      'Web Audio API specification',
      'Audio programming books (DAFX, etc.)',
      'Sound design communities (KVR, etc.)',
    ],
    'coaching-personal-development': [
      'Evidence-based coaching research (ICF)',
      'Positive psychology literature',
      'Ethical guidelines for AI coaching',
    ],
    'devops-site-reliability': [
      'Google SRE book',
      'CNCF project documentation',
      'AWS/GCP Well-Architected Frameworks',
    ],
  };

  return resources[category] || [
    'Domain-specific documentation',
    'Industry best practices',
    'Academic research papers',
  ];
}

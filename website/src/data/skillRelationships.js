"use strict";
/**
 * Skill Relationships & Workflows
 *
 * This file defines relationships between skills and pre-built workflows
 * that leverage the DAG execution framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_WORKFLOWS = exports.SKILL_STACKS = exports.SKILL_RELATIONSHIPS = void 0;
exports.getRelatedSkills = getRelatedSkills;
exports.getStacksForSkill = getStacksForSkill;
exports.getWorkflowsForSkill = getWorkflowsForSkill;
exports.getWorkflowById = getWorkflowById;
exports.getStackById = getStackById;
// =============================================================================
// SKILL RELATIONSHIPS
// =============================================================================
exports.SKILL_RELATIONSHIPS = [
    // Career & Professional Stack
    {
        skillA: 'career-biographer',
        skillB: 'cv-creator',
        relationship: 'precedes',
        strength: 0.95,
        description: 'Career narratives feed directly into CV creation',
    },
    {
        skillA: 'career-biographer',
        skillB: 'competitive-cartographer',
        relationship: 'complements',
        strength: 0.85,
        description: 'Career stories benefit from competitive positioning analysis',
    },
    {
        skillA: 'competitive-cartographer',
        skillB: 'cv-creator',
        relationship: 'precedes',
        strength: 0.8,
        description: 'Positioning insights improve CV targeting',
    },
    {
        skillA: 'cv-creator',
        skillB: 'job-application-optimizer',
        relationship: 'precedes',
        strength: 0.9,
        description: 'Created CV needs optimization for specific applications',
    },
    // Design Stack
    {
        skillA: 'design-archivist',
        skillB: 'design-system-creator',
        relationship: 'precedes',
        strength: 0.85,
        description: 'Design research informs system creation',
    },
    {
        skillA: 'color-theory-palette-harmony-expert',
        skillB: 'design-system-creator',
        relationship: 'complements',
        strength: 0.8,
        description: 'Color expertise enhances design systems',
    },
    {
        skillA: 'typography-expert',
        skillB: 'design-system-creator',
        relationship: 'complements',
        strength: 0.8,
        description: 'Typography knowledge improves design systems',
    },
    {
        skillA: 'design-system-creator',
        skillB: 'web-design-expert',
        relationship: 'precedes',
        strength: 0.9,
        description: 'Design system guides web implementation',
    },
    {
        skillA: 'vaporwave-glassomorphic-ui-designer',
        skillB: 'web-design-expert',
        relationship: 'alternative',
        strength: 0.6,
        description: 'Different aesthetic approaches to UI design',
    },
    // Computer Vision Stack
    {
        skillA: 'drone-cv-expert',
        skillB: 'drone-inspection-specialist',
        relationship: 'precedes',
        strength: 0.95,
        description: 'Flight control must be established before inspection tasks',
    },
    {
        skillA: 'clip-aware-embeddings',
        skillB: 'photo-composition-critic',
        relationship: 'complements',
        strength: 0.75,
        description: 'CLIP embeddings can enhance photo quality assessment',
    },
    {
        skillA: 'clip-aware-embeddings',
        skillB: 'collage-layout-expert',
        relationship: 'complements',
        strength: 0.8,
        description: 'Semantic similarity helps photo grouping for collages',
    },
    {
        skillA: 'photo-composition-critic',
        skillB: 'collage-layout-expert',
        relationship: 'complements',
        strength: 0.7,
        description: 'Photo quality informs collage curation',
    },
    {
        skillA: 'event-detection-temporal-intelligence-expert',
        skillB: 'collage-layout-expert',
        relationship: 'precedes',
        strength: 0.85,
        description: 'Event detection organizes photos for collage creation',
    },
    // Backend & Infrastructure Stack
    {
        skillA: 'api-architect',
        skillB: 'data-pipeline-engineer',
        relationship: 'complements',
        strength: 0.85,
        description: 'API design often needs data pipeline understanding',
    },
    {
        skillA: 'api-architect',
        skillB: 'devops-automator',
        relationship: 'precedes',
        strength: 0.8,
        description: 'API design precedes deployment automation',
    },
    {
        skillA: 'cloudflare-worker-dev',
        skillB: 'devops-automator',
        relationship: 'complements',
        strength: 0.75,
        description: 'Edge functions complement DevOps workflows',
    },
    {
        skillA: 'drizzle-migrations',
        skillB: 'data-pipeline-engineer',
        relationship: 'complements',
        strength: 0.7,
        description: 'Database schema management supports data pipelines',
    },
    // AI/ML Stack
    {
        skillA: 'ai-engineer',
        skillB: 'prompt-engineer',
        relationship: 'complements',
        strength: 0.95,
        description: 'LLM applications require strong prompt engineering',
    },
    {
        skillA: 'automatic-stateful-prompt-improver',
        skillB: 'prompt-engineer',
        relationship: 'extends',
        strength: 0.9,
        description: 'Automated prompt optimization extends manual prompt engineering',
    },
    {
        skillA: 'agent-creator',
        skillB: 'mcp-creator',
        relationship: 'complements',
        strength: 0.85,
        description: 'Agent creation often requires MCP server development',
    },
    {
        skillA: 'skill-coach',
        skillB: 'agent-creator',
        relationship: 'complements',
        strength: 0.8,
        description: 'Skill coaching helps with agent design patterns',
    },
    // Psychology & Wellness Stack
    {
        skillA: 'jungian-psychologist',
        skillB: 'grief-companion',
        relationship: 'complements',
        strength: 0.7,
        description: 'Jungian depth psychology enhances grief support',
    },
    {
        skillA: 'adhd-design-expert',
        skillB: 'adhd-daily-planner',
        relationship: 'complements',
        strength: 0.9,
        description: 'ADHD design principles apply to planning interfaces',
    },
    {
        skillA: 'hrv-alexithymia-expert',
        skillB: 'crisis-response-protocol',
        relationship: 'complements',
        strength: 0.65,
        description: 'Biometric awareness can inform crisis detection',
    },
    {
        skillA: 'partner-text-coach',
        skillB: 'jungian-psychologist',
        relationship: 'complements',
        strength: 0.6,
        description: 'Depth psychology improves relationship communication insights',
    },
    // Bot & Automation Stack
    {
        skillA: 'bot-developer',
        skillB: 'chatbot-analytics',
        relationship: 'complements',
        strength: 0.85,
        description: 'Bot development needs analytics for improvement',
    },
    {
        skillA: 'bot-developer',
        skillB: 'ai-engineer',
        relationship: 'complements',
        strength: 0.8,
        description: 'AI capabilities enhance bot functionality',
    },
    // Video & Media Stack
    {
        skillA: 'ai-video-production-master',
        skillB: '2000s-visualization-expert',
        relationship: 'complements',
        strength: 0.6,
        description: 'Music visualization can enhance video production',
    },
    {
        skillA: 'metal-shader-expert',
        skillB: '2000s-visualization-expert',
        relationship: 'complements',
        strength: 0.75,
        description: 'GPU shader expertise enables advanced visualizations',
    },
    // Interior & Exterior Design
    {
        skillA: 'interior-design-expert',
        skillB: 'color-theory-palette-harmony-expert',
        relationship: 'complements',
        strength: 0.8,
        description: 'Color theory improves interior color selection',
    },
    {
        skillA: 'interior-design-expert',
        skillB: 'maximalist-wall-decorator',
        relationship: 'complements',
        strength: 0.7,
        description: 'Wall decoration is a subset of interior design',
    },
    {
        skillA: 'fancy-yard-landscaper',
        skillB: 'interior-design-expert',
        relationship: 'complements',
        strength: 0.5,
        description: 'Outdoor and indoor design should be cohesive',
        bidirectional: true,
    },
    // Auth & Security
    {
        skillA: 'modern-auth-2026',
        skillB: 'hipaa-compliance',
        relationship: 'complements',
        strength: 0.8,
        description: 'Authentication often needs compliance awareness',
    },
    {
        skillA: 'admin-dashboard',
        skillB: 'modern-auth-2026',
        relationship: 'complements',
        strength: 0.75,
        description: 'Admin dashboards require robust authentication',
    },
    // Legacy & Debugging
    {
        skillA: 'code-necromancer',
        skillB: 'fullstack-debugger',
        relationship: 'complements',
        strength: 0.8,
        description: 'Legacy code resurrection needs strong debugging',
    },
    {
        skillA: 'code-review-checklist',
        skillB: 'code-necromancer',
        relationship: 'complements',
        strength: 0.7,
        description: 'Code review helps assess legacy code quality',
    },
];
// =============================================================================
// SKILL STACKS
// =============================================================================
exports.SKILL_STACKS = [
    {
        id: 'career-stack',
        name: 'Career Advancement Stack',
        description: 'Complete toolkit for job hunting and career development',
        category: 'professional',
        skills: [
            'career-biographer',
            'competitive-cartographer',
            'cv-creator',
            'job-application-optimizer',
        ],
        order: 'sequential',
        icon: '💼',
    },
    {
        id: 'design-stack',
        name: 'Design System Stack',
        description: 'Build comprehensive design systems from research to implementation',
        category: 'design',
        skills: [
            'design-archivist',
            'color-theory-palette-harmony-expert',
            'typography-expert',
            'design-system-creator',
            'web-design-expert',
        ],
        order: 'sequential',
        icon: '🎨',
    },
    {
        id: 'cv-ml-stack',
        name: 'Computer Vision ML Stack',
        description: 'Full CV pipeline from embeddings to analysis',
        category: 'ml',
        skills: [
            'clip-aware-embeddings',
            'photo-composition-critic',
            'event-detection-temporal-intelligence-expert',
            'collage-layout-expert',
        ],
        order: 'any',
        icon: '👁️',
    },
    {
        id: 'drone-stack',
        name: 'Drone Engineering Stack',
        description: 'Complete drone development from flight control to inspection',
        category: 'ml',
        skills: [
            'drone-cv-expert',
            'drone-inspection-specialist',
            'metal-shader-expert',
        ],
        order: 'sequential',
        icon: '🚁',
    },
    {
        id: 'ai-builder-stack',
        name: 'AI Builder Stack',
        description: 'Build AI applications, agents, and tools',
        category: 'ai',
        skills: [
            'ai-engineer',
            'prompt-engineer',
            'agent-creator',
            'mcp-creator',
            'skill-coach',
        ],
        order: 'any',
        icon: '🤖',
    },
    {
        id: 'wellness-stack',
        name: 'Mental Wellness Stack',
        description: 'Psychology, wellness, and personal growth tools',
        category: 'wellness',
        skills: [
            'jungian-psychologist',
            'grief-companion',
            'adhd-daily-planner',
            'adhd-design-expert',
            'partner-text-coach',
            'personal-finance-coach',
        ],
        order: 'any',
        icon: '🧠',
    },
    {
        id: 'backend-stack',
        name: 'Backend Engineering Stack',
        description: 'APIs, data pipelines, and infrastructure',
        category: 'engineering',
        skills: [
            'api-architect',
            'data-pipeline-engineer',
            'devops-automator',
            'cloudflare-worker-dev',
            'drizzle-migrations',
        ],
        order: 'any',
        icon: '⚙️',
    },
    {
        id: 'home-stack',
        name: 'Home Design Stack',
        description: 'Interior and exterior home improvement',
        category: 'design',
        skills: [
            'interior-design-expert',
            'maximalist-wall-decorator',
            'fancy-yard-landscaper',
            'color-theory-palette-harmony-expert',
        ],
        order: 'any',
        icon: '🏠',
    },
];
// =============================================================================
// PRE-BUILT WORKFLOWS
// =============================================================================
exports.SKILL_WORKFLOWS = [
    {
        id: 'job-search-workflow',
        name: 'Complete Job Search',
        description: 'From career story to optimized applications',
        category: 'career',
        estimatedTime: '2-4 hours',
        difficulty: 'beginner',
        tags: ['career', 'resume', 'job-hunting'],
        skills: [
            {
                skillId: 'career-biographer',
                role: 'Extract your career narrative through empathetic interview',
                wave: 0,
                outputs: ['career-narrative', 'key-achievements', 'brand-themes'],
            },
            {
                skillId: 'competitive-cartographer',
                role: 'Analyze market positioning and differentiation',
                wave: 0,
                outputs: ['competitive-landscape', 'positioning-recommendations'],
            },
            {
                skillId: 'cv-creator',
                role: 'Generate ATS-optimized resume in multiple formats',
                wave: 1,
                inputs: ['career-narrative', 'positioning-recommendations'],
                outputs: ['resume-pdf', 'resume-docx', 'resume-json'],
            },
            {
                skillId: 'job-application-optimizer',
                role: 'Tailor resume for specific job applications',
                wave: 2,
                inputs: ['resume-json', 'job-posting'],
                outputs: ['tailored-resume', 'fit-score'],
            },
        ],
    },
    {
        id: 'design-system-workflow',
        name: 'Build Design System',
        description: 'Research-driven design system creation',
        category: 'design',
        estimatedTime: '4-8 hours',
        difficulty: 'intermediate',
        tags: ['design', 'ui', 'branding'],
        skills: [
            {
                skillId: 'design-archivist',
                role: 'Research 500+ real-world design examples',
                wave: 0,
                outputs: ['design-patterns', 'color-palettes', 'typography-samples'],
            },
            {
                skillId: 'color-theory-palette-harmony-expert',
                role: 'Select harmonious color palette',
                wave: 1,
                inputs: ['color-palettes'],
                outputs: ['final-palette', 'color-tokens'],
            },
            {
                skillId: 'typography-expert',
                role: 'Choose and configure typography system',
                wave: 1,
                inputs: ['typography-samples'],
                outputs: ['type-scale', 'font-pairings'],
            },
            {
                skillId: 'design-system-creator',
                role: 'Build comprehensive design system',
                wave: 2,
                inputs: ['design-patterns', 'color-tokens', 'type-scale'],
                outputs: ['design-system', 'css-tokens', 'component-specs'],
            },
            {
                skillId: 'web-design-expert',
                role: 'Implement design system in code',
                wave: 3,
                inputs: ['design-system', 'css-tokens'],
                outputs: ['component-library', 'documentation'],
            },
        ],
    },
    {
        id: 'photo-curation-workflow',
        name: 'Smart Photo Curation',
        description: 'Organize and curate photo collections intelligently',
        category: 'photography',
        estimatedTime: '1-2 hours',
        difficulty: 'intermediate',
        tags: ['photography', 'ml', 'organization'],
        skills: [
            {
                skillId: 'clip-aware-embeddings',
                role: 'Generate semantic embeddings for all photos',
                wave: 0,
                outputs: ['photo-embeddings', 'similarity-matrix'],
            },
            {
                skillId: 'event-detection-temporal-intelligence-expert',
                role: 'Detect events and cluster by time/location',
                wave: 0,
                outputs: ['event-clusters', 'temporal-groups'],
            },
            {
                skillId: 'photo-composition-critic',
                role: 'Score photos for quality and composition',
                wave: 1,
                inputs: ['photo-embeddings'],
                outputs: ['quality-scores', 'best-photos'],
            },
            {
                skillId: 'collage-layout-expert',
                role: 'Create beautiful collages from curated photos',
                wave: 2,
                inputs: ['event-clusters', 'best-photos', 'similarity-matrix'],
                outputs: ['collage-layouts', 'final-collages'],
            },
        ],
    },
    {
        id: 'ai-chatbot-workflow',
        name: 'Production AI Chatbot',
        description: 'Build a complete AI chatbot with analytics',
        category: 'ai',
        estimatedTime: '4-6 hours',
        difficulty: 'advanced',
        tags: ['ai', 'chatbot', 'llm'],
        skills: [
            {
                skillId: 'prompt-engineer',
                role: 'Design system prompts and response patterns',
                wave: 0,
                outputs: ['system-prompts', 'few-shot-examples'],
            },
            {
                skillId: 'ai-engineer',
                role: 'Build RAG pipeline and LLM integration',
                wave: 1,
                inputs: ['system-prompts'],
                outputs: ['rag-pipeline', 'api-integration'],
            },
            {
                skillId: 'bot-developer',
                role: 'Create chat interface and platform integration',
                wave: 1,
                outputs: ['chat-interface', 'platform-connectors'],
            },
            {
                skillId: 'chatbot-analytics',
                role: 'Add conversation tracking and metrics',
                wave: 2,
                inputs: ['api-integration', 'chat-interface'],
                outputs: ['analytics-dashboard', 'conversation-logs'],
            },
        ],
    },
    {
        id: 'drone-inspection-workflow',
        name: 'Drone Inspection Pipeline',
        description: 'End-to-end drone inspection system',
        category: 'ml',
        estimatedTime: '8+ hours',
        difficulty: 'advanced',
        tags: ['drone', 'cv', 'inspection'],
        skills: [
            {
                skillId: 'drone-cv-expert',
                role: 'Configure flight control, SLAM, and navigation',
                wave: 0,
                outputs: ['flight-controller', 'slam-config', 'path-planner'],
            },
            {
                skillId: 'metal-shader-expert',
                role: 'Optimize GPU processing for real-time analysis',
                wave: 1,
                inputs: ['flight-controller'],
                outputs: ['gpu-pipeline', 'shaders'],
            },
            {
                skillId: 'drone-inspection-specialist',
                role: 'Add domain-specific detection (fire, damage, etc.)',
                wave: 2,
                inputs: ['slam-config', 'gpu-pipeline'],
                outputs: ['detection-models', 'inspection-reports', '3d-reconstructions'],
            },
        ],
    },
    {
        id: 'mcp-agent-workflow',
        name: 'Build Custom Agent',
        description: 'Create a custom agent with MCP tools',
        category: 'ai',
        estimatedTime: '2-4 hours',
        difficulty: 'intermediate',
        tags: ['agent', 'mcp', 'automation'],
        skills: [
            {
                skillId: 'skill-coach',
                role: 'Design agent capabilities and interaction patterns',
                wave: 0,
                outputs: ['agent-spec', 'capability-list'],
            },
            {
                skillId: 'agent-creator',
                role: 'Create agent definition and SKILL.md',
                wave: 1,
                inputs: ['agent-spec'],
                outputs: ['skill-md', 'agent-config'],
            },
            {
                skillId: 'mcp-creator',
                role: 'Build MCP server for external integrations',
                wave: 1,
                inputs: ['capability-list'],
                outputs: ['mcp-server', 'tool-definitions'],
            },
            {
                skillId: 'automatic-stateful-prompt-improver',
                role: 'Optimize agent prompts over time',
                wave: 2,
                inputs: ['skill-md', 'tool-definitions'],
                outputs: ['optimized-prompts', 'performance-metrics'],
            },
        ],
    },
];
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Get all skills that relate to a given skill
 */
function getRelatedSkills(skillId) {
    var _a;
    var related = [];
    for (var _i = 0, SKILL_RELATIONSHIPS_1 = exports.SKILL_RELATIONSHIPS; _i < SKILL_RELATIONSHIPS_1.length; _i++) {
        var rel = SKILL_RELATIONSHIPS_1[_i];
        if (rel.skillA === skillId) {
            related.push({
                skill: rel.skillB,
                relationship: rel.relationship,
                strength: rel.strength,
                description: rel.description,
            });
        }
        else if (rel.skillB === skillId) {
            // Only include if bidirectional or relationship type implies it
            var isBidirectional = (_a = rel.bidirectional) !== null && _a !== void 0 ? _a : (rel.relationship === 'complements' || rel.relationship === 'alternative');
            if (isBidirectional) {
                // Reverse the relationship type if needed
                var reversedRelationship = rel.relationship;
                if (rel.relationship === 'precedes') {
                    reversedRelationship = 'extends'; // B extends A if A precedes B
                }
                related.push({
                    skill: rel.skillA,
                    relationship: reversedRelationship,
                    strength: rel.strength,
                    description: rel.description,
                });
            }
        }
    }
    return related.sort(function (a, b) { return b.strength - a.strength; });
}
/**
 * Get stacks that include a given skill
 */
function getStacksForSkill(skillId) {
    return exports.SKILL_STACKS.filter(function (stack) { return stack.skills.includes(skillId); });
}
/**
 * Get workflows that include a given skill
 */
function getWorkflowsForSkill(skillId) {
    return exports.SKILL_WORKFLOWS.filter(function (workflow) {
        return workflow.skills.some(function (node) { return node.skillId === skillId; });
    });
}
/**
 * Get workflow by ID
 */
function getWorkflowById(workflowId) {
    return exports.SKILL_WORKFLOWS.find(function (w) { return w.id === workflowId; });
}
/**
 * Get stack by ID
 */
function getStackById(stackId) {
    return exports.SKILL_STACKS.find(function (s) { return s.id === stackId; });
}

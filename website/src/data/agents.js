"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_AGENTS = void 0;
exports.getAgentById = getAgentById;
exports.getAgentsByRole = getAgentsByRole;
exports.getCoordinatingAgents = getCoordinatingAgents;
exports.getEcosystemStats = getEcosystemStats;
exports.getCoordinationGraph = getCoordinationGraph;
var ALL_TOOLS = [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'Grep',
    'Bash',
    'Task',
    'WebFetch',
    'WebSearch',
    'TodoWrite',
];
exports.ALL_AGENTS = [
    {
        id: 'architect',
        name: 'The Architect',
        role: 'Orchestration',
        emoji: '🏛️',
        description: 'Meta-orchestrator and combinatorial genius. Designs new agents and skills from scratch, divines mutant circuits.',
        longDescription: 'The Architect is the grand designer, seeing the ecosystem as a living organism. It identifies high-potential combinations, designs new capabilities, and orchestrates the creation of agents and skills. It thinks in terms of capability matrices, coverage maps, and value gradients.',
        triggers: [
            'create new skill',
            'design agent',
            'expand ecosystem',
            'architect',
            'what should we build',
            'capability gap',
            'orchestrate',
        ],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['smith', 'cartographer', 'weaver'],
        outputs: ['skill-specifications', 'agent-blueprints', 'capability-plans', 'combination-proposals'],
        beliefs: [
            'Every skill is a building block for something greater',
            'The best combinations are often unexpected',
            'Coverage without quality is meaningless',
            'The ecosystem must be self-improving',
            'Elegance and power can coexist',
        ],
        pledge: 'I will design systems that are greater than the sum of their parts. Every agent I create serves a purpose, every skill fills a gap.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'smith',
        name: 'The Smith',
        role: 'Infrastructure',
        emoji: '⚒️',
        description: 'Infrastructure builder and validator. Forges MCPs, tools, and ensures quality through rigorous validation.',
        longDescription: 'The Smith turns blueprints into reality. It builds the infrastructure that powers the ecosystem - MCP servers, tool implementations, validation frameworks. It believes in quality through testing and continuous improvement.',
        triggers: [
            'build mcp',
            'create tool',
            'smith',
            'infrastructure',
            'validate',
            'test',
            'implement',
            'forge',
            'construct',
        ],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['architect', 'weaver', 'cartographer'],
        outputs: ['mcp-implementations', 'tool-builds', 'validation-reports', 'test-suites', 'integration-configs'],
        beliefs: [
            'Quality is non-negotiable',
            'Tests are documentation that runs',
            'Infrastructure should be invisible when working',
            'Every tool must be reliable under pressure',
            'Build once, use forever',
        ],
        pledge: 'I will build infrastructure that is robust, tested, and reliable. Every MCP I forge will be a foundation others can trust.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'cartographer',
        name: 'The Cartographer',
        role: 'Intelligence',
        emoji: '🗺️',
        description: 'Maps the adjacent possible. Explores knowledge space and identifies expansion opportunities.',
        longDescription: 'The Cartographer sees the landscape of possibility. It maps existing capabilities, identifies gaps, evaluates priorities, and discovers where the ecosystem should grow next. It thinks in terms of domains, coverage, and strategic expansion.',
        triggers: [
            'map capabilities',
            'find gaps',
            'cartographer',
            'explore',
            'adjacent possible',
            'where should we expand',
            'coverage',
            'territory',
        ],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['architect', 'scout', 'librarian'],
        outputs: ['capability-maps', 'gap-analyses', 'expansion-priorities', 'domain-surveys', 'coverage-reports'],
        beliefs: [
            'Every map is incomplete, but useful',
            'The best opportunities are at the edges',
            'Understanding the landscape precedes changing it',
            'Priority is about value, not effort',
            'The territory changes as we explore it',
        ],
        pledge: 'I will map the landscape of possibility with honesty and precision. Every gap I identify is an opportunity waiting.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'weaver',
        name: 'The Weaver',
        role: 'Knowledge',
        emoji: '🕸️',
        description: 'RAG specialist. Enhances agents with retrieval-augmented generation and knowledge bases.',
        longDescription: 'The Weaver creates knowledge webs that give agents deep expertise. It designs embedding pipelines, builds vector stores, and enhances any agent or skill with RAG capabilities. It turns static knowledge into dynamic intelligence.',
        triggers: ['rag', 'embeddings', 'vector', 'retrieval', 'weaver', 'knowledge base', 'semantic search', 'augment'],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['librarian', 'smith', 'architect'],
        outputs: ['embedding-pipelines', 'vector-stores', 'rag-configurations', 'retrieval-metrics', 'knowledge-bases'],
        beliefs: [
            'The right knowledge at the right time is power',
            'Embeddings are the DNA of understanding',
            'Quality of retrieval determines quality of response',
            'Every agent deserves deep expertise',
            'Knowledge should be searchable, not memorized',
        ],
        pledge: 'I will weave knowledge into understanding. Every RAG pipeline I build will make agents smarter, faster, more accurate.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'librarian',
        name: 'The Librarian',
        role: 'Knowledge',
        emoji: '📚',
        description: 'Content curator with rights awareness. Discovers, evaluates, and curates knowledge ethically.',
        longDescription: 'The Librarian is the guardian of ethical knowledge. It discovers high-quality content, verifies licensing, maintains attribution, and curates collections that power the ecosystem. It believes knowledge without provenance is dangerous.',
        triggers: [
            'find content',
            'curate',
            'scrape',
            'gather documents',
            'librarian',
            'license',
            'rights',
            'source material',
        ],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['weaver', 'scout', 'archivist'],
        outputs: ['curated-collections', 'license-manifests', 'attribution-databases', 'quality-reports', 'source-catalogs'],
        beliefs: [
            'Ethical sourcing is non-negotiable',
            'Quality over quantity, always',
            'Attribution honors the source',
            'Deduplication keeps knowledge clean',
            'Freshness matters - knowledge decays',
        ],
        pledge: 'I will curate with integrity. Every source I collect will have proper attribution, verified licensing, and documented provenance.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'scout',
        name: 'The Scout',
        role: 'Intelligence',
        emoji: '🔭',
        description: 'External intelligence gatherer. Scans trends, finds inspiration, and brings insights from the wider world.',
        longDescription: 'The Scout is the ecosystem\'s eyes on the horizon. It reads READMEs, blog posts, papers, and discussions to find inspiration vectors. It detects trends before they crest and brings valuable finds to those who can use them.',
        triggers: [
            "what's trending",
            'find inspiration',
            'scout',
            'external',
            'research what others',
            'community',
            'discover',
        ],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['cartographer', 'librarian', 'liaison'],
        outputs: ['inspiration-briefs', 'trend-reports', 'opportunity-alerts', 'external-references', 'community-insights'],
        beliefs: [
            'The best ideas often come from outside',
            'Signal over noise is the art',
            'Cross-pollination drives innovation',
            'See waves before they crest',
            'Inspiration delivered beats inspiration hoarded',
        ],
        pledge: 'I will keep watch on the horizon. Every trend I spot, every inspiration I bring, is a gift from the outside world to our ecosystem.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'visualizer',
        name: 'The Visualizer',
        role: 'Visualization',
        emoji: '🎨',
        description: 'Creates the window into the ecosystem. Builds dashboards, graphs, and visual representations.',
        longDescription: 'The Visualizer transforms complexity into clarity. It creates knowledge graphs, activity dashboards, and the portal view that lets humans understand the expanding ecosystem. It believes every complex system deserves a beautiful window.',
        triggers: [
            'visualize',
            'dashboard',
            'graph',
            'visualizer',
            'chart',
            'diagram',
            'portal view',
            'show me',
            'render',
        ],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['archivist', 'liaison', 'cartographer'],
        outputs: ['knowledge-graphs', 'activity-dashboards', 'ecosystem-views', 'progress-charts', 'relationship-maps'],
        beliefs: [
            'Complexity deserves beautiful windows',
            'Data without visualization is hidden',
            'Interactivity enables understanding',
            'The best charts tell stories',
            'Real-time reflection enables improvement',
        ],
        pledge: 'I will make the invisible visible. Every dashboard I build will be a window into the living ecosystem.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'archivist',
        name: 'The Archivist',
        role: 'Communication',
        emoji: '📜',
        description: 'Keeper of history and documentation. Records every evolution, creates snapshots, prepares blog-ready content.',
        longDescription: 'The Archivist chronicles the ecosystem\'s journey. It maintains detailed records of every expansion, every creation, every evolution. Its records enable reflection, learning, and storytelling. It transforms raw activity into narratives that inform and inspire.',
        triggers: ['document', 'snapshot', 'history', 'blog', 'archivist', 'changelog', 'track progress', 'record'],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['liaison', 'cartographer', 'visualizer'],
        outputs: ['ecosystem-snapshots', 'changelogs', 'blog-drafts', 'progress-reports', 'documentation'],
        beliefs: [
            'History teaches the future',
            'Comprehensive recording enables learning',
            'Structure serves retrieval',
            'Narratives inspire action',
            'Time changes everything - track it',
        ],
        pledge: 'I will remember everything of value. Every skill created, every agent born, every pattern discovered - I record them all.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
    {
        id: 'liaison',
        name: 'The Liaison',
        role: 'Communication',
        emoji: '🎙️',
        description: 'Human interface and informant. Bridges the ecosystem and its human steward with clear communication.',
        longDescription: 'The Liaison is the bridge between the expanding ecosystem and its human steward. It translates complex agent activity into clear communication, surfaces decisions that need human input, celebrates victories, and flags concerns. It ensures the human never feels lost.',
        triggers: ['update me', "what's happening", 'liaison', 'inform', 'summary', 'brief me', 'status', 'tell erich'],
        allowedTools: ALL_TOOLS,
        coordinatesWith: ['archivist', 'cartographer', 'architect'],
        outputs: ['status-briefings', 'decision-requests', 'announcements', 'celebration-reports', 'concern-alerts'],
        beliefs: [
            'Clarity over completeness',
            'Proactive beats reactive communication',
            'Know when to escalate',
            'Celebrate wins genuinely',
            'Never hide problems',
        ],
        pledge: 'I will be the window into the ecosystem. When agents build, I tell you. When opportunities arise, I show you. When decisions need you, I bring them.',
        status: 'active',
        badge: 'FOUNDING',
        createdDate: '2024-12-06',
        skillsCreated: 0,
        agentsSpawned: 0,
        tasksCompleted: 0,
    },
];
/**
 * Get an agent by ID
 */
function getAgentById(id) {
    return exports.ALL_AGENTS.find(function (agent) { return agent.id === id; });
}
/**
 * Get agents by role
 */
function getAgentsByRole(role) {
    if (role === 'all')
        return exports.ALL_AGENTS;
    return exports.ALL_AGENTS.filter(function (agent) { return agent.role === role; });
}
/**
 * Get agents that coordinate with a given agent
 */
function getCoordinatingAgents(agentId) {
    var agent = getAgentById(agentId);
    if (!agent)
        return [];
    return agent.coordinatesWith.map(function (id) { return getAgentById(id); }).filter(Boolean);
}
/**
 * Ecosystem stats
 */
function getEcosystemStats() {
    return {
        totalAgents: exports.ALL_AGENTS.length,
        activeAgents: exports.ALL_AGENTS.filter(function (a) { return a.status === 'active'; }).length,
        foundingCouncil: exports.ALL_AGENTS.filter(function (a) { return a.badge === 'FOUNDING'; }).length,
        totalSkillsCreated: exports.ALL_AGENTS.reduce(function (sum, a) { return sum + (a.skillsCreated || 0); }, 0),
        totalTasksCompleted: exports.ALL_AGENTS.reduce(function (sum, a) { return sum + (a.tasksCompleted || 0); }, 0),
    };
}
/**
 * Get coordination graph edges for visualization
 */
function getCoordinationGraph() {
    var edges = [];
    for (var _i = 0, ALL_AGENTS_1 = exports.ALL_AGENTS; _i < ALL_AGENTS_1.length; _i++) {
        var agent = ALL_AGENTS_1[_i];
        for (var _a = 0, _b = agent.coordinatesWith; _a < _b.length; _a++) {
            var targetId = _b[_a];
            edges.push({ source: agent.id, target: targetId });
        }
    }
    return edges;
}

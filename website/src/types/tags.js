"use strict";
/**
 * Skill Tags - Flat taxonomy with color-coded categories
 * Tags provide granular discoverability beyond categories
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAG_TYPE_LABELS = exports.TAG_MAP = exports.ALL_TAGS = exports.TAG_TYPE_COLORS = void 0;
exports.getTag = getTag;
exports.getTagColors = getTagColors;
exports.getTagsByType = getTagsByType;
// Color mapping for tag types
exports.TAG_TYPE_COLORS = {
    'skill-type': { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' }, // Purple
    'domain': { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' }, // Blue
    'output': { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // Green
    'complexity': { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }, // Orange
    'integration': { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // Pink
};
// All available tags - expanded taxonomy for rich discoverability
exports.ALL_TAGS = [
    // Skill Type Tags (what it does) - Purple
    { id: 'research', label: 'Research', type: 'skill-type', description: 'Investigates and analyzes information' },
    { id: 'creation', label: 'Creation', type: 'skill-type', description: 'Creates artifacts and outputs' },
    { id: 'coaching', label: 'Coaching', type: 'skill-type', description: 'Provides guidance and mentorship' },
    { id: 'automation', label: 'Automation', type: 'skill-type', description: 'Automates workflows and processes' },
    { id: 'orchestration', label: 'Orchestration', type: 'skill-type', description: 'Coordinates multiple skills or agents' },
    { id: 'validation', label: 'Validation', type: 'skill-type', description: 'Checks and validates work' },
    { id: 'analysis', label: 'Analysis', type: 'skill-type', description: 'Deep analytical processing' },
    { id: 'optimization', label: 'Optimization', type: 'skill-type', description: 'Improves and optimizes content or processes' },
    { id: 'clustering', label: 'Clustering', type: 'skill-type', description: 'Groups and categorizes similar items' },
    { id: 'curation', label: 'Curation', type: 'skill-type', description: 'Selects and organizes content' },
    { id: 'indexing', label: 'Indexing', type: 'skill-type', description: 'Creates searchable indexes' },
    { id: 'refactoring', label: 'Refactoring', type: 'skill-type', description: 'Restructures and improves code' },
    { id: 'testing', label: 'Testing', type: 'skill-type', description: 'Validates through testing' },
    { id: 'moderation', label: 'Moderation', type: 'skill-type', description: 'Content moderation and safety' },
    { id: 'coordination', label: 'Coordination', type: 'skill-type', description: 'Coordinates people or processes' },
    // Domain Tags (subject matter) - Blue
    { id: 'design', label: 'Design', type: 'domain', description: 'Visual and UX design' },
    { id: 'audio', label: 'Audio', type: 'domain', description: 'Sound, voice, and music' },
    { id: '3d', label: '3D', type: 'domain', description: '3D graphics and rendering' },
    { id: 'cv', label: 'Computer Vision', type: 'domain', description: 'Image and video analysis' },
    { id: 'ml', label: 'ML/AI', type: 'domain', description: 'Machine learning and AI' },
    { id: 'psychology', label: 'Psychology', type: 'domain', description: 'Mental health and self-development' },
    { id: 'finance', label: 'Finance', type: 'domain', description: 'Money and investing' },
    { id: 'career', label: 'Career', type: 'domain', description: 'Job and professional growth' },
    { id: 'accessibility', label: 'Accessibility', type: 'domain', description: 'ADHD and disability-focused' },
    { id: 'adhd', label: 'ADHD', type: 'domain', description: 'ADHD-focused tools and workflows' },
    { id: 'devops', label: 'DevOps', type: 'domain', description: 'Deployment and reliability' },
    { id: 'robotics', label: 'Robotics', type: 'domain', description: 'Drones and autonomous systems' },
    { id: 'photography', label: 'Photography', type: 'domain', description: 'Photo composition and curation' },
    { id: 'health', label: 'Health', type: 'domain', description: 'Physical and mental wellness' },
    { id: 'recovery', label: 'Recovery', type: 'domain', description: 'Addiction recovery and sobriety' },
    { id: 'entrepreneurship', label: 'Entrepreneurship', type: 'domain', description: 'Startups and business building' },
    { id: 'spatial', label: 'Spatial', type: 'domain', description: 'Interior design and space planning' },
    { id: 'job-search', label: 'Job Search', type: 'domain', description: 'Job hunting and application strategy' },
    { id: 'inspection', label: 'Inspection', type: 'domain', description: 'Infrastructure and property inspection' },
    { id: 'thermal', label: 'Thermal', type: 'domain', description: 'Thermal imaging and analysis' },
    { id: 'insurance', label: 'Insurance', type: 'domain', description: 'Insurance risk and claims' },
    { id: 'temporal', label: 'Temporal', type: 'domain', description: 'Time-based analysis and events' },
    { id: 'events', label: 'Events', type: 'domain', description: 'Event detection and tracking' },
    { id: 'faces', label: 'Faces', type: 'domain', description: 'Face recognition and clustering' },
    { id: 'duplicates', label: 'Duplicates', type: 'domain', description: 'Duplicate detection and deduplication' },
    { id: 'web', label: 'Web', type: 'domain', description: 'Web development and design' },
    { id: 'api', label: 'API', type: 'domain', description: 'API design and integration' },
    { id: 'security', label: 'Security', type: 'domain', description: 'Security and vulnerability analysis' },
    { id: 'documentation', label: 'Documentation', type: 'domain', description: 'Technical writing and docs' },
    { id: 'legal', label: 'Legal', type: 'domain', description: 'Legal documents and compliance' },
    { id: 'relationships', label: 'Relationships', type: 'domain', description: 'Personal and professional relationships' },
    { id: 'grief', label: 'Grief', type: 'domain', description: 'Grief and bereavement support' },
    { id: 'vr', label: 'VR', type: 'domain', description: 'Virtual reality and immersive tech' },
    { id: 'landscaping', label: 'Landscaping', type: 'domain', description: 'Outdoor and garden design' },
    { id: 'color', label: 'Color', type: 'domain', description: 'Color theory and palettes' },
    { id: 'typography', label: 'Typography', type: 'domain', description: 'Fonts and type design' },
    { id: 'shaders', label: 'Shaders', type: 'domain', description: 'GPU shaders and graphics programming' },
    { id: 'physics', label: 'Physics', type: 'domain', description: 'Physics simulation' },
    { id: 'bots', label: 'Bots', type: 'domain', description: 'Chat and automation bots' },
    { id: 'agents', label: 'Agents', type: 'domain', description: 'AI agents and autonomous systems' },
    { id: 'prompts', label: 'Prompts', type: 'domain', description: 'Prompt engineering' },
    // Output Format Tags - Green
    { id: 'code', label: 'Code', type: 'output', description: 'Generates code' },
    { id: 'document', label: 'Document', type: 'output', description: 'Creates documents' },
    { id: 'visual', label: 'Visual', type: 'output', description: 'Creates images or designs' },
    { id: 'data', label: 'Data', type: 'output', description: 'Produces structured data' },
    { id: 'strategy', label: 'Strategy', type: 'output', description: 'Produces strategic plans' },
    { id: 'diagrams', label: 'Diagrams', type: 'output', description: 'Creates diagrams and visualizations' },
    { id: 'templates', label: 'Templates', type: 'output', description: 'Provides templates and patterns' },
    // Complexity Tags - Orange
    { id: 'beginner-friendly', label: 'Beginner Friendly', type: 'complexity', description: 'Easy to use, no special knowledge needed' },
    { id: 'advanced', label: 'Advanced', type: 'complexity', description: 'Requires domain knowledge' },
    { id: 'production-ready', label: 'Production Ready', type: 'complexity', description: 'Battle-tested and reliable' },
    // Integration Tags - Pink
    { id: 'mcp', label: 'MCP', type: 'integration', description: 'Uses MCP servers' },
    { id: 'elevenlabs', label: 'ElevenLabs', type: 'integration', description: 'ElevenLabs audio integration' },
    { id: 'figma', label: 'Figma', type: 'integration', description: 'Figma design integration' },
    { id: 'stability-ai', label: 'Stability AI', type: 'integration', description: 'Stability AI image generation' },
    { id: 'playwright', label: 'Playwright', type: 'integration', description: 'Playwright browser automation' },
    { id: 'jest', label: 'Jest', type: 'integration', description: 'Jest testing framework' },
    { id: 'docusaurus', label: 'Docusaurus', type: 'integration', description: 'Docusaurus documentation' },
    { id: 'swiftui', label: 'SwiftUI', type: 'integration', description: 'SwiftUI for iOS/macOS' },
    { id: 'react', label: 'React', type: 'integration', description: 'React framework' },
    { id: 'discord', label: 'Discord', type: 'integration', description: 'Discord platform' },
    { id: 'slack', label: 'Slack', type: 'integration', description: 'Slack platform' },
    { id: 'telegram', label: 'Telegram', type: 'integration', description: 'Telegram platform' },
];
// Quick lookup map
exports.TAG_MAP = new Map(exports.ALL_TAGS.map(function (tag) { return [tag.id, tag]; }));
// Get tag definition by ID
function getTag(id) {
    return exports.TAG_MAP.get(id);
}
// Get color for a tag
function getTagColors(tagId) {
    var tag = exports.TAG_MAP.get(tagId);
    if (!tag)
        return exports.TAG_TYPE_COLORS['domain']; // Default to blue
    return exports.TAG_TYPE_COLORS[tag.type];
}
// Group tags by type for filter UI
function getTagsByType() {
    return exports.ALL_TAGS.reduce(function (acc, tag) {
        if (!acc[tag.type])
            acc[tag.type] = [];
        acc[tag.type].push(tag);
        return acc;
    }, {});
}
// Type labels for filter UI headers
exports.TAG_TYPE_LABELS = {
    'skill-type': 'What It Does',
    'domain': 'Subject Area',
    'output': 'Output Type',
    'complexity': 'Complexity',
    'integration': 'Integrations',
};

/**
 * Skill Tags - Flat taxonomy with color-coded categories
 * Tags provide granular discoverability beyond categories
 */

// Tag type determines color
export type TagType =
  | 'skill-type'    // What it does (purple)
  | 'domain'        // Subject matter (blue)
  | 'output'        // What it produces (green)
  | 'complexity'    // Difficulty level (orange)
  | 'integration';  // External tools (pink)

export interface TagDefinition {
  id: string;
  label: string;
  type: TagType;
  description?: string;
}

// Color mapping for tag types
export const TAG_TYPE_COLORS: Record<TagType, { bg: string; text: string; border: string }> = {
  'skill-type': { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },   // Purple
  'domain': { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },       // Blue
  'output': { bg: '#dcfce7', text: '#15803d', border: '#86efac' },       // Green
  'complexity': { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },   // Orange
  'integration': { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },  // Pink
};

// All available tags
export const ALL_TAGS: TagDefinition[] = [
  // Skill Type Tags (what it does) - Purple
  { id: 'research', label: 'Research', type: 'skill-type', description: 'Investigates and analyzes information' },
  { id: 'creation', label: 'Creation', type: 'skill-type', description: 'Creates artifacts and outputs' },
  { id: 'coaching', label: 'Coaching', type: 'skill-type', description: 'Provides guidance and mentorship' },
  { id: 'automation', label: 'Automation', type: 'skill-type', description: 'Automates workflows and processes' },
  { id: 'orchestration', label: 'Orchestration', type: 'skill-type', description: 'Coordinates multiple skills or agents' },
  { id: 'validation', label: 'Validation', type: 'skill-type', description: 'Checks and validates work' },
  { id: 'analysis', label: 'Analysis', type: 'skill-type', description: 'Deep analytical processing' },

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
  { id: 'devops', label: 'DevOps', type: 'domain', description: 'Deployment and reliability' },
  { id: 'robotics', label: 'Robotics', type: 'domain', description: 'Drones and autonomous systems' },
  { id: 'photography', label: 'Photography', type: 'domain', description: 'Photo composition and curation' },
  { id: 'health', label: 'Health', type: 'domain', description: 'Physical and mental wellness' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', type: 'domain', description: 'Startups and business building' },
  { id: 'spatial', label: 'Spatial', type: 'domain', description: 'Interior design and space planning' },

  // Output Format Tags - Green
  { id: 'code', label: 'Code', type: 'output', description: 'Generates code' },
  { id: 'document', label: 'Document', type: 'output', description: 'Creates documents' },
  { id: 'visual', label: 'Visual', type: 'output', description: 'Creates images or designs' },
  { id: 'data', label: 'Data', type: 'output', description: 'Produces structured data' },
  { id: 'strategy', label: 'Strategy', type: 'output', description: 'Produces strategic plans' },

  // Complexity Tags - Orange
  { id: 'beginner-friendly', label: 'Beginner Friendly', type: 'complexity', description: 'Easy to use, no special knowledge needed' },
  { id: 'advanced', label: 'Advanced', type: 'complexity', description: 'Requires domain knowledge' },
  { id: 'production-ready', label: 'Production Ready', type: 'complexity', description: 'Battle-tested and reliable' },

  // Integration Tags - Pink
  { id: 'mcp', label: 'MCP', type: 'integration', description: 'Uses MCP servers' },
  { id: 'elevenlabs', label: 'ElevenLabs', type: 'integration', description: 'ElevenLabs audio integration' },
  { id: 'figma', label: 'Figma', type: 'integration', description: 'Figma design integration' },
  { id: 'stability-ai', label: 'Stability AI', type: 'integration', description: 'Stability AI image generation' },
];

// Quick lookup map
export const TAG_MAP = new Map(ALL_TAGS.map(tag => [tag.id, tag]));

// Get tag definition by ID
export function getTag(id: string): TagDefinition | undefined {
  return TAG_MAP.get(id);
}

// Get color for a tag
export function getTagColors(tagId: string): { bg: string; text: string; border: string } {
  const tag = TAG_MAP.get(tagId);
  if (!tag) return TAG_TYPE_COLORS['domain']; // Default to blue
  return TAG_TYPE_COLORS[tag.type];
}

// Group tags by type for filter UI
export function getTagsByType(): Record<TagType, TagDefinition[]> {
  return ALL_TAGS.reduce((acc, tag) => {
    if (!acc[tag.type]) acc[tag.type] = [];
    acc[tag.type].push(tag);
    return acc;
  }, {} as Record<TagType, TagDefinition[]>);
}

// Type labels for filter UI headers
export const TAG_TYPE_LABELS: Record<TagType, string> = {
  'skill-type': 'What It Does',
  'domain': 'Subject Area',
  'output': 'Output Type',
  'complexity': 'Complexity',
  'integration': 'Integrations',
};

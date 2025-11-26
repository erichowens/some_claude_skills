import type { Skill } from '../types/skill';
import skillDescriptions from './skillDescriptions.json';

// Create a map for quick lookup
const descriptionMap = new Map(
  skillDescriptions.map(item => [item.id, item.description])
);

// Helper to get description with fallback
const getDesc = (id: string, fallback: string) => descriptionMap.get(id) || fallback;

/**
 * Complete skills data - Single Source of Truth
 * Used by both index.tsx and skills.tsx
 */
export const ALL_SKILLS: Skill[] = [
  // 🎭 Orchestration & Meta (5 skills)
  { id: 'orchestrator', title: 'Orchestrator', category: 'Orchestration & Meta', path: '/docs/skills/orchestrator', description: getDesc('orchestrator', 'Master coordinator that delegates to specialist skills and synthesizes outputs.') },
  { id: 'agent-creator', title: 'Agent Creator', category: 'Orchestration & Meta', path: '/docs/skills/agent_creator', description: getDesc('agent-creator', 'Meta-agent for creating new custom agents, skills, and MCP integrations.') },
  { id: 'skill-coach', title: 'Skill Coach', category: 'Orchestration & Meta', path: '/docs/skills/skill_coach', description: getDesc('skill-coach', 'Guide for creating high-quality Agent Skills with domain expertise, anti-pattern detection, and progressive disclosure.') },
  { id: 'skill-documentarian', title: 'Skill Documentarian', category: 'Orchestration & Meta', path: '/docs/skills/skill_documentarian', description: getDesc('skill-documentarian', 'Website sync guardian. Ensures .claude/skills/ stays in sync with website/docs/skills/, validates metadata, creates blog-style artifacts.') },
  { id: 'swift-executor', title: 'Swift Executor', category: 'Orchestration & Meta', path: '/docs/skills/swift_executor', description: getDesc('swift-executor', 'Rapid task execution without hesitation. Overcomes blockers through pragmatic solutions. Ships and iterates.') },

  // 🎨 Visual Design & UI (8 skills)
  { id: 'web-design-expert', title: 'Web Design Expert', category: 'Visual Design & UI', path: '/docs/skills/web_design_expert', description: getDesc('web-design-expert', 'Creates unique web designs with brand identity, color palettes, and modern UI/UX patterns.') },
  { id: 'design-system-creator', title: 'Design System Creator', category: 'Visual Design & UI', path: '/docs/skills/design_system_creator', description: getDesc('design-system-creator', 'Builds comprehensive design systems and design bibles with production-ready CSS.') },
  { id: 'native-app-designer', title: 'Native App Designer', category: 'Visual Design & UI', path: '/docs/skills/native_app_designer', description: getDesc('native-app-designer', 'Creates breathtaking iOS/Mac and web apps with organic, non-AI aesthetic.') },
  { id: 'vaporwave-glassomorphic-ui-designer', title: 'Vaporwave UI Designer', category: 'Visual Design & UI', path: '/docs/skills/vaporwave_glassomorphic_ui_designer', description: getDesc('vaporwave-glassomorphic-ui-designer', 'Modern aesthetic UI blending vaporwave nostalgia with glassomorphic elegance.') },
  { id: 'typography-expert', title: 'Typography Expert', category: 'Visual Design & UI', path: '/docs/skills/typography_expert', description: getDesc('typography-expert', 'Master typographer: font pairing, OpenType features, variable fonts, performance.') },
  { id: 'vibe-matcher', title: 'Vibe Matcher', category: 'Visual Design & UI', path: '/docs/skills/vibe_matcher', description: getDesc('vibe-matcher', 'Synesthete designer that translates emotional vibes and brand keywords into concrete visual DNA.') },
  { id: 'interior-design-expert', title: 'Interior Design Expert', category: 'Visual Design & UI', path: '/docs/skills/interior_design_expert', description: getDesc('interior-design-expert', 'Expert interior designer with color science (Munsell), IES lighting standards, and computational space planning.') },
  { id: 'design-archivist', title: 'Design Archivist', category: 'Visual Design & UI', path: '/docs/skills/design_archivist', description: getDesc('design-archivist', 'Long-running design anthropologist that builds comprehensive visual databases from 500-1000 real-world examples.') },

  // 🎮 Graphics, 3D & Simulation (4 skills)
  { id: 'metal-shader-expert', title: 'Metal Shader Expert', category: 'Graphics, 3D & Simulation', path: '/docs/skills/metal_shader_expert', description: getDesc('metal-shader-expert', '20 years Weta/Pixar experience in real-time graphics, Metal shaders, and visual effects.') },
  { id: 'vr-avatar-engineer', title: 'VR Avatar Engineer', category: 'Graphics, 3D & Simulation', path: '/docs/skills/vr_avatar_engineer', description: getDesc('vr-avatar-engineer', 'Photorealistic VR avatars with face tracking, voice, and cross-platform support.') },
  { id: 'rope-physics-rendering-expert', title: 'Rope Physics + Rendering', category: 'Graphics, 3D & Simulation', path: '/docs/skills/physics_rendering_expert', description: getDesc('physics-rendering-expert', 'Real-time rope and cable dynamics simulation with constraint solvers and rendering.') },
  { id: 'collage-layout-expert', title: 'Collage Layout Expert', category: 'Graphics, 3D & Simulation', path: '/docs/skills/collage_layout_expert', description: getDesc('collage-layout-expert', 'Expert in computational collage composition inspired by David Hockney joiners.') },

  // 🔊 Audio & Sound Design (2 skills)
  { id: 'sound-engineer', title: 'Sound Engineer', category: 'Audio & Sound Design', path: '/docs/skills/sound_engineer', description: getDesc('sound-engineer', 'Expert audio engineering with spatial audio, procedural sound design, and real-time DSP.') },
  { id: 'voice-audio-engineer', title: 'Voice & Audio Engineer', category: 'Audio & Sound Design', path: '/docs/skills/voice_audio_engineer', description: getDesc('voice-audio-engineer', 'Expert audio engineer with deep signal processing knowledge, spatial audio (Ambisonics, binaural), and production-ready DSP.') },

  // 👁️ Computer Vision & Image AI (5 skills)
  { id: 'clip-aware-embeddings', title: 'CLIP-Aware Embeddings', category: 'Computer Vision & Image AI', path: '/docs/skills/clip_aware_embeddings', description: getDesc('clip-aware-embeddings', 'Semantic image-text matching with CLIP and alternatives, knowing when CLIP works and when to use specialized models.') },
  { id: 'photo-content-recognition-curation-expert', title: 'Photo Content Recognition', category: 'Computer Vision & Image AI', path: '/docs/skills/photo_content_recognition_curation_expert', description: getDesc('photo-content-recognition-curation-expert', 'Advanced photo content recognition and intelligent curation.') },
  { id: 'event-detection-temporal-intelligence-expert', title: 'Event Detection Expert', category: 'Computer Vision & Image AI', path: '/docs/skills/event_detection_temporal_intelligence_expert', description: getDesc('event-detection-temporal-intelligence-expert', 'Event detection and temporal intelligence for photo analysis.') },
  { id: 'photo-composition-critic', title: 'Photo Composition Critic', category: 'Computer Vision & Image AI', path: '/docs/skills/photo_composition_critic', description: getDesc('photo-composition-critic', 'Expert photography critic grounded in graduate-level visual aesthetics and computational aesthetics research (NIMA, AVA, LAION).') },
  { id: 'color-theory-palette-harmony-expert', title: 'Color Theory Expert', category: 'Computer Vision & Image AI', path: '/docs/skills/color_theory_palette_harmony_expert', description: getDesc('color-theory-palette-harmony-expert', 'Color palette harmony and theory expert for visual design.') },

  // 🤖 Autonomous Systems & Robotics (2 skills)
  { id: 'drone-cv-expert', title: 'Drone CV Expert', category: 'Autonomous Systems & Robotics', path: '/docs/skills/drone_cv_expert', description: getDesc('drone-cv-expert', 'Expert in drone systems, computer vision, and autonomous navigation.') },
  { id: 'drone-inspection-specialist', title: 'Drone Inspection Specialist', category: 'Autonomous Systems & Robotics', path: '/docs/skills/drone_inspection_specialist', description: getDesc('drone-inspection-specialist', 'Advanced CV for infrastructure inspection including thermal analysis and 3D reconstruction.') },

  // 💬 Conversational AI & Bots (1 skill)
  { id: 'bot-developer', title: 'Bot Developer', category: 'Conversational AI & Bots', path: '/docs/skills/bot_developer', description: getDesc('bot-developer', 'Production-grade bot development for Discord, Telegram, Slack with state machines, rate limiting, and moderation systems.') },

  // 🔬 Research & Strategy (3 skills)
  { id: 'research-analyst', title: 'Research Analyst', category: 'Research & Strategy', path: '/docs/skills/research_analyst', description: getDesc('research-analyst', 'Thorough landscape research, competitive analysis, and evidence-based recommendations.') },
  { id: 'team-builder', title: 'Team Builder', category: 'Research & Strategy', path: '/docs/skills/team_builder', description: getDesc('team-builder', 'Designs high-performing team structures using organizational psychology.') },
  { id: 'competitive-cartographer', title: 'Competitive Cartographer', category: 'Research & Strategy', path: '/docs/skills/competitive_cartographer', description: getDesc('competitive-cartographer', 'Strategic analyst that maps competitive landscapes and identifies white space opportunities.') },

  // 🌱 Coaching & Personal Development (9 skills)
  { id: 'career-biographer', title: 'Career Biographer', category: 'Coaching & Personal Development', path: '/docs/skills/career_biographer', description: getDesc('career-biographer', 'AI-powered career biographer that conducts empathetic interviews and transforms professional stories into portfolios, CVs, and personal brand assets.') },
  { id: 'personal-finance-coach', title: 'Personal Finance Coach', category: 'Coaching & Personal Development', path: '/docs/skills/personal_finance_coach', description: getDesc('personal-finance-coach', 'Expert personal finance coach grounded in academic research: MPT, factor investing, tax optimization, and retirement mathematics.') },
  { id: 'tech-entrepreneur-coach-adhd', title: 'Tech Entrepreneur Coach', category: 'Coaching & Personal Development', path: '/docs/skills/tech_entrepreneur_coach_adhd', description: getDesc('tech-entrepreneur-coach-adhd', 'Big tech ML engineer to indie founder transition coach.') },
  { id: 'project-management-guru-adhd', title: 'Project Management Guru', category: 'Coaching & Personal Development', path: '/docs/skills/project_management_guru_adhd', description: getDesc('project-management-guru-adhd', 'Expert project manager for ADHD engineers managing concurrent projects.') },
  { id: 'jungian-psychologist', title: 'Jungian Psychologist', category: 'Coaching & Personal Development', path: '/docs/skills/jungian_psychologist', description: getDesc('jungian-psychologist', 'Expert in Jungian analytical psychology: shadow work, archetypes, dream analysis, and individuation grounded in primary sources.') },
  { id: 'wisdom-accountability-coach', title: 'Wisdom & Accountability Coach', category: 'Coaching & Personal Development', path: '/docs/skills/wisdom_accountability_coach', description: getDesc('wisdom-accountability-coach', 'Longitudinal memory tracking, philosophy teaching, and personal accountability.') },
  { id: 'hrv-alexithymia-expert', title: 'HRV & Alexithymia Expert', category: 'Coaching & Personal Development', path: '/docs/skills/hrv_alexithymia_expert', description: getDesc('hrv-alexithymia-expert', 'Heart rate variability biometrics and emotional awareness training.') },
  { id: 'speech-pathology-ai', title: 'Speech Pathology AI', category: 'Coaching & Personal Development', path: '/docs/skills/speech_pathology_ai', description: getDesc('speech-pathology-ai', 'AI-powered speech therapy, phoneme analysis, and articulation visualization.') },
  { id: 'adhd-design-expert', title: 'ADHD Design Expert', category: 'Coaching & Personal Development', path: '/docs/skills/adhd_design_expert', description: getDesc('adhd-design-expert', 'Designs digital experiences for ADHD brains using neuroscience research.') },
];

/**
 * Featured skills for homepage display
 */
export const FEATURED_SKILLS: Skill[] = [
  ALL_SKILLS.find(s => s.id === 'metal-shader-expert')!,
  ALL_SKILLS.find(s => s.id === 'vr-avatar-engineer')!,
  ALL_SKILLS.find(s => s.id === 'drone-cv-expert')!,
  ALL_SKILLS.find(s => s.id === 'collage-layout-expert')!,
  ALL_SKILLS.find(s => s.id === 'adhd-design-expert')!,
  ALL_SKILLS.find(s => s.id === 'sound-engineer')!,
];

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: string): Skill[] {
  if (category === 'all') return ALL_SKILLS;
  return ALL_SKILLS.filter(skill => skill.category === category);
}

/**
 * Search skills by query
 */
export function searchSkills(skills: Skill[], query: string): Skill[] {
  if (!query) return skills;
  const lowerQuery = query.toLowerCase();
  return skills.filter(skill =>
    skill.title.toLowerCase().includes(lowerQuery) ||
    skill.description.toLowerCase().includes(lowerQuery)
  );
}

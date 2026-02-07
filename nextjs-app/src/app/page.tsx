'use client';

import * as React from 'react';
import { skills, type Skill, getSkillById, type SkillCategory } from '@/lib/skills';
import {
  ProgramManager,
  Win31Window,
  Win31Button,
  Win31Dialog,
  DesktopScene,
  FileManager,
  TutorialWizard,
  TUTORIALS,
  type ProgramGroup,
  type TutorialId,
} from '@/components/memphis';
import { SkillDocument } from '@/components/win31';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * MEMPHIS × WINDOWS 3.1 - Some Claude Skills
 * Program Manager shell with skill gallery
 * ═══════════════════════════════════════════════════════════════════════════
 */

type ActiveView =
  | { type: 'desktop' }
  | { type: 'file-manager' }
  | { type: 'skill'; skill: Skill }
  | { type: 'tutorial'; id: TutorialId }
  | { type: 'readme' }
  | { type: 'about' }
  | { type: 'search' };

export default function HomePage() {
  const [activeView, setActiveView] = React.useState<ActiveView>({ type: 'desktop' });
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [desktopScene, setDesktopScene] = React.useState<'default' | 'skills' | 'tutorials' | 'windags'>('default');

  // Check for first visit
  React.useEffect(() => {
    const hasVisited = localStorage.getItem('scs-visited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('scs-visited', 'true');
    }
  }, []);

  // Group skills by category for display
  const skillsByCategory = React.useMemo(() => {
    const grouped = new Map<SkillCategory, Skill[]>();
    skills.forEach(skill => {
      const cat = skill.category;
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(skill);
    });
    return grouped;
  }, []);

  // Program groups for Program Manager
  const programGroups: ProgramGroup[] = React.useMemo(() => [
    {
      id: 'main',
      title: 'Main',
      icons: [
        { id: 'file-manager', label: 'Skill Browser', icon: '📁' },
        { id: 'search', label: 'Skill Search', icon: '🔍' },
        { id: 'readme', label: 'Read Me', icon: '📖' },
        { id: 'about', label: 'About', icon: 'ℹ️' },
      ],
    },
    {
      id: 'tutorials',
      title: 'Tutorials',
      icons: Object.entries(TUTORIALS).map(([id, tutorial]) => ({
        id,
        label: tutorial.title.replace('Claude ', ''),
        icon: tutorial.icon,
      })),
    },
    {
      id: 'skills-development',
      title: 'Development Skills',
      icons: (skillsByCategory.get('development') || []).slice(0, 12).map(skill => ({
        id: `skill-${skill.id}`,
        label: skill.title.substring(0, 15),
        icon: skill.icon || '💻',
      })),
    },
    {
      id: 'skills-design',
      title: 'Design Skills',
      icons: (skillsByCategory.get('design') || []).slice(0, 12).map(skill => ({
        id: `skill-${skill.id}`,
        label: skill.title.substring(0, 15),
        icon: skill.icon || '🎨',
      })),
    },
    {
      id: 'skills-devops',
      title: 'DevOps Skills',
      icons: (skillsByCategory.get('devops') || []).slice(0, 12).map(skill => ({
        id: `skill-${skill.id}`,
        label: skill.title.substring(0, 15),
        icon: skill.icon || '🔧',
      })),
    },
    {
      id: 'accessories',
      title: 'Accessories',
      icons: [
        { id: 'clock', label: 'Clock', icon: '🕐' },
        { id: 'solitaire', label: 'Solitaire', icon: '🃏' },
        { id: 'gorillas', label: 'GORILLA.BAS', icon: '🦍' },
      ],
    },
    {
      id: 'windags',
      title: 'winDAGs.AI (Coming Soon)',
      icons: [
        { id: 'dag-builder', label: 'DAG Builder', icon: '🔀' },
        { id: 'skill-matcher', label: 'Skill Matcher', icon: '🎯' },
        { id: 'workflow-editor', label: 'Workflow Editor', icon: '⚙️' },
      ],
    },
  ], [skillsByCategory]);

  const handleOpenProgram = (programId: string) => {
    // Check if it's a tutorial
    if (programId in TUTORIALS) {
      setActiveView({ type: 'tutorial', id: programId as TutorialId });
      setDesktopScene('tutorials');
      return;
    }

    // Check if it's a skill
    if (programId.startsWith('skill-')) {
      const skillId = programId.replace('skill-', '');
      const skill = getSkillById(skillId);
      if (skill) {
        setActiveView({ type: 'skill', skill });
        setDesktopScene('skills');
      }
      return;
    }

    // Handle main programs
    switch (programId) {
      case 'file-manager':
        setActiveView({ type: 'file-manager' });
        setDesktopScene('skills');
        break;
      case 'search':
        setActiveView({ type: 'search' });
        break;
      case 'readme':
        setActiveView({ type: 'readme' });
        break;
      case 'about':
        setActiveView({ type: 'about' });
        break;
      case 'dag-builder':
      case 'skill-matcher':
      case 'workflow-editor':
        setDesktopScene('windags');
        // Show coming soon dialog or navigate to windags section
        break;
      default:
        // Accessories don't change view, they're decorative
        break;
    }
  };

  const handleSelectSkill = (skill: Skill) => {
    setActiveView({ type: 'skill', skill });
    setDesktopScene('skills');
  };

  const handleNavigateToSkill = (skillId: string) => {
    const skill = getSkillById(skillId);
    if (skill) {
      setActiveView({ type: 'skill', skill });
    }
  };

  const goToDesktop = () => {
    setActiveView({ type: 'desktop' });
    setDesktopScene('default');
  };

  const goToFileManager = () => {
    setActiveView({ type: 'file-manager' });
    setDesktopScene('skills');
  };

  return (
    <DesktopScene scene={desktopScene}>
      <div className="min-h-screen flex flex-col">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Desktop / Program Manager */}
          {activeView.type === 'desktop' && (
            <div className="h-full p-2 md:p-4">
              {/* Header Banner */}
              <Win31Window
                title="Some Claude Skills - Memphis Edition"
                menuItems={[]}
                className="mx-auto max-w-4xl mb-4"
              >
                <div className="p-4 bg-[var(--memphis-cream)] flex flex-col md:flex-row gap-4 items-center">
                  <div className="text-6xl">🎨</div>
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-xl font-bold text-[var(--memphis-purple)] mb-1">
                      173 Curated Claude Code Skills
                    </h1>
                    <p className="text-sm text-[var(--memphis-black)]">
                      Transform Claude into an expert in any domain. Double-click a skill to explore!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Win31Button onClick={() => setActiveView({ type: 'file-manager' })} variant="primary">
                      Browse Skills
                    </Win31Button>
                    <Win31Button onClick={() => setActiveView({ type: 'tutorial', id: 'what-is-a-skill' })}>
                      What&apos;s a Skill?
                    </Win31Button>
                  </div>
                </div>
              </Win31Window>

              {/* Program Manager */}
              <div className="h-[calc(100vh-200px)] max-w-6xl mx-auto">
                <ProgramManager
                  groups={programGroups}
                  onOpenProgram={handleOpenProgram}
                >
                  {/* Decorative elements positioned within Program Manager */}
                </ProgramManager>
              </div>
            </div>
          )}

          {/* File Manager / Skill Browser */}
          {activeView.type === 'file-manager' && (
            <div className="h-full p-2 md:p-4 flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <FileManager
                  skills={skills}
                  onSelectSkill={handleSelectSkill}
                />
                <div className="mt-2 flex justify-end">
                  <Win31Button onClick={goToDesktop}>
                    ← Back to Desktop
                  </Win31Button>
                </div>
              </div>
            </div>
          )}

          {/* Skill Document */}
          {activeView.type === 'skill' && (
            <div className="h-full p-2 md:p-4 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <div className="mb-2 flex gap-2">
                  <Win31Button onClick={goToFileManager}>
                    ← Browse Skills
                  </Win31Button>
                  <Win31Button onClick={goToDesktop}>
                    🏠 Desktop
                  </Win31Button>
                </div>
                <SkillDocument
                  skill={activeView.skill}
                  onClose={goToFileManager}
                  onNavigate={handleNavigateToSkill}
                />
              </div>
            </div>
          )}

          {/* Tutorial Wizard */}
          {activeView.type === 'tutorial' && (
            <TutorialWizard
              title={TUTORIALS[activeView.id].title}
              steps={TUTORIALS[activeView.id].steps}
              onComplete={goToDesktop}
              onClose={goToDesktop}
            />
          )}

          {/* README */}
          {activeView.type === 'readme' && (
            <div className="h-full p-2 md:p-4 flex items-center justify-center">
              <Win31Window
                title="README.TXT - Welcome to Some Claude Skills"
                menuItems={['File', 'Edit', 'Help']}
                className="w-full max-w-2xl"
                onClose={goToDesktop}
              >
                <div className="p-6 bg-white overflow-auto max-h-[70vh]">
                  <div className="prose-typora">
                    <h1>Some Claude Skills</h1>
                    <p className="text-lg text-gray-600">
                      A curated collection of 173 expert AI agents for Claude Code.
                    </p>

                    <hr />

                    <h2>What are Skills?</h2>
                    <p>
                      Skills are specialized markdown files that transform Claude into an expert 
                      in a specific domain. Each skill contains instructions, best practices, 
                      and patterns for tasks like TypeScript development, system architecture, 
                      DevOps, design systems, and more.
                    </p>

                    <h2>Getting Started</h2>
                    <ol>
                      <li><strong>Browse Skills</strong> - Open the Skill Browser (File Manager) to explore</li>
                      <li><strong>Learn the Basics</strong> - Check out the Tutorials group</li>
                      <li><strong>Install a Skill</strong> - Copy the install command from any skill page</li>
                      <li><strong>Use It!</strong> - Claude will automatically apply the skill&apos;s expertise</li>
                    </ol>

                    <h2>About This Interface</h2>
                    <p>
                      This is <strong>Memphis × Windows 3.1</strong> - imagining what Microsoft
                      would have created if they hired Ettore Sottsass in 1992.
                    </p>
                    <p className="text-sm text-gray-500">
                      Built with Next.js 15, Tailwind CSS v4, and deployed on Cloudflare Pages.
                    </p>

                    <div className="bg-[var(--memphis-cyan)]/10 border border-[var(--memphis-cyan)] p-4 rounded mt-6">
                      <h3 className="mt-0">Quick Tips</h3>
                      <ul className="mb-0">
                        <li>Double-click icons to open programs</li>
                        <li>Program groups contain related skills</li>
                        <li>Tutorials teach you how to use skills effectively</li>
                        <li>winDAGs.AI features are coming soon!</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-[var(--memphis-cream)] border-t border-[var(--memphis-shadow)] flex justify-end gap-2">
                  <Win31Button onClick={goToFileManager} variant="primary">
                    Browse Skills
                  </Win31Button>
                  <Win31Button onClick={goToDesktop}>
                    OK
                  </Win31Button>
                </div>
              </Win31Window>
            </div>
          )}

          {/* About */}
          {activeView.type === 'about' && (
            <div className="h-full p-2 md:p-4 flex items-center justify-center">
              <Win31Window
                title="About Some Claude Skills"
                menuItems={[]}
                className="w-full max-w-md"
                onClose={goToDesktop}
              >
                <div className="p-6 bg-[var(--memphis-cream)] text-center">
                  <div className="text-6xl mb-4">🎨🖥️</div>
                  <h1 className="text-xl font-bold text-[var(--memphis-purple)] mb-1">
                    Some Claude Skills
                  </h1>
                  <p className="text-sm mb-4">
                    Memphis × Windows 3.1 Edition
                  </p>
                  <p className="text-xs text-[var(--memphis-shadow)] mb-4">
                    Version 1.0.0
                  </p>

                  <div className="text-xs space-y-1 mb-4">
                    <p>© 2024 Erich Owens</p>
                    <p className="text-[var(--memphis-shadow)]">Ex-Meta ML Engineer</p>
                  </div>

                  <div className="bg-white border border-[var(--memphis-shadow)] p-3 text-left text-xs">
                    <p className="font-semibold mb-2">System Info:</p>
                    <p>• Next.js 15 (App Router)</p>
                    <p>• Tailwind CSS v4</p>
                    <p>• Radix UI Primitives</p>
                    <p>• Cloudflare Pages</p>
                    <p>• 173 Curated Skills</p>
                  </div>

                  <div className="mt-4 flex gap-2 justify-center">
                    {['#FF6B9D', '#00D4FF', '#FFE156', '#FF7F6B', '#7DFFC2', '#6B5CE7'].map(color => (
                      <div
                        key={color}
                        className="w-6 h-6 border border-[var(--memphis-black)]"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-[var(--memphis-cream)] border-t border-[var(--memphis-shadow)] flex justify-center">
                  <Win31Button onClick={goToDesktop}>
                    OK
                  </Win31Button>
                </div>
              </Win31Window>
            </div>
          )}

          {/* Search (Placeholder) */}
          {activeView.type === 'search' && (
            <div className="h-full p-2 md:p-4 flex items-center justify-center">
              <Win31Window
                title="Skill Search - AI-Powered"
                menuItems={['Search', 'Options', 'Help']}
                className="w-full max-w-2xl"
                onClose={goToDesktop}
              >
                <div className="p-6 bg-[var(--memphis-cream)]">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Describe what you want to do..."
                      className="win31-input flex-1 py-2 px-3"
                    />
                    <Win31Button variant="primary">
                      🔍 Search
                    </Win31Button>
                  </div>
                  <p className="text-sm text-[var(--memphis-shadow)] text-center">
                    AI-powered semantic search coming soon!
                    <br />
                    For now, browse skills in the File Manager.
                  </p>
                </div>
                <div className="p-3 bg-[var(--memphis-cream)] border-t border-[var(--memphis-shadow)] flex justify-end gap-2">
                  <Win31Button onClick={goToFileManager}>
                    Open File Manager
                  </Win31Button>
                  <Win31Button onClick={goToDesktop}>
                    Close
                  </Win31Button>
                </div>
              </Win31Window>
            </div>
          )}
        </main>

        {/* Status Bar */}
        <footer className="win31-statusbar sticky bottom-0 z-50">
          <span className="win31-statusbar-section">
            {activeView.type === 'desktop' ? 'Ready' : 
             activeView.type === 'skill' ? `Viewing: ${activeView.skill.title}` :
             activeView.type === 'file-manager' ? `${skills.length} skills available` :
             'Some Claude Skills'}
          </span>
          <span className="win31-statusbar-section">
            {new Date().toLocaleDateString()}
          </span>
          <span className="win31-statusbar-section">
            Memphis Edition
          </span>
        </footer>

        {/* Welcome Dialog for First-Time Visitors */}
        {showWelcome && (
          <Win31Dialog
            title="Welcome to Some Claude Skills!"
            icon="info"
            buttons={[
              {
                label: 'Take Tutorial',
                onClick: () => {
                  setShowWelcome(false);
                  setActiveView({ type: 'tutorial', id: 'what-is-a-skill' });
                },
                isDefault: true,
              },
              {
                label: 'Browse Skills',
                onClick: () => {
                  setShowWelcome(false);
                  setActiveView({ type: 'file-manager' });
                },
              },
              {
                label: 'Explore Desktop',
                onClick: () => setShowWelcome(false),
              },
            ]}
            onClose={() => setShowWelcome(false)}
          >
            <div className="space-y-2">
              <p>
                Welcome! This site contains <strong>173 curated skills</strong> that transform
                Claude into an expert in specific domains.
              </p>
              <p>
                <strong>New to skills?</strong> Take the tutorial to learn how they work.
              </p>
              <p>
                <strong>Ready to browse?</strong> Jump straight into the skill library.
              </p>
            </div>
          </Win31Dialog>
        )}
      </div>
    </DesktopScene>
  );
}

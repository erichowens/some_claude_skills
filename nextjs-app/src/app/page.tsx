'use client';

import { useState } from 'react';
import {
  Folder,
  FileText,
  HelpCircle,
  Star,
  Book,
  Power,
  Search,
  Cpu,
} from 'lucide-react';

import { type Skill, getSkillById } from '@/lib/skills';
import { Button } from '@/components/ui/button';
import {
  Window,
  WindowContent,
  WindowWell,
  DesktopIcon,
  Taskbar,
  TaskbarButton,
  StartMenu,
  StartMenuItem,
  StartMenuDivider,
  SkillBrowser,
  SkillDocument,
} from '@/components/win31';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * WINDOWS 3.1 POCKET EDITION - Homepage
 * Document-centric skill browser
 * ═══════════════════════════════════════════════════════════════════════════
 */

type ActiveView = 
  | { type: 'desktop' }
  | { type: 'browser' }
  | { type: 'skill'; skill: Skill }
  | { type: 'readme' }
  | { type: 'about' };

export default function HomePage() {
  const [startOpen, setStartOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'desktop' });

  const openSkillBrowser = () => {
    setActiveView({ type: 'browser' });
    setStartOpen(false);
  };

  const openSkill = (skill: Skill) => {
    setActiveView({ type: 'skill', skill });
  };

  const navigateToSkill = (skillId: string) => {
    const skill = getSkillById(skillId);
    if (skill) {
      setActiveView({ type: 'skill', skill });
    }
  };

  const goToDesktop = () => {
    setActiveView({ type: 'desktop' });
  };

  const getActiveTitle = (): string => {
    switch (activeView.type) {
      case 'browser': return 'Skills';
      case 'skill': return activeView.skill.title;
      case 'readme': return 'README';
      case 'about': return 'About';
      default: return '';
    }
  };

  return (
    <div className="win-desktop flex flex-col no-bounce">
      {/* Main Area */}
      <main className="flex-1 overflow-hidden pb-12">
        {/* Desktop Icons */}
        {activeView.type === 'desktop' && (
          <div className="h-full overflow-auto p-4">
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              <DesktopIcon
                icon={Folder}
                label="Skills"
                size="touch"
                onDoubleClick={openSkillBrowser}
              />
              <DesktopIcon
                icon={Star}
                label="Favorites"
                size="touch"
                onDoubleClick={() => setActiveView({ type: 'browser' })}
              />
              <DesktopIcon
                icon={Cpu}
                label="MCP Servers"
                size="touch"
                onDoubleClick={() => setActiveView({ type: 'browser' })}
              />
              <DesktopIcon
                icon={Book}
                label="Docs"
                size="touch"
                onDoubleClick={() => setActiveView({ type: 'readme' })}
              />
              <DesktopIcon
                icon={FileText}
                label="README"
                size="touch"
                onDoubleClick={() => setActiveView({ type: 'readme' })}
              />
              <DesktopIcon
                icon={HelpCircle}
                label="About"
                size="touch"
                onDoubleClick={() => setActiveView({ type: 'about' })}
              />
            </div>
          </div>
        )}

        {/* Skill Browser */}
        {activeView.type === 'browser' && (
          <div className="h-full p-2 sm:p-4">
            <SkillBrowser
              onSelectSkill={openSkill}
              onClose={goToDesktop}
            />
          </div>
        )}

        {/* Skill Document */}
        {activeView.type === 'skill' && (
          <div className="h-full p-2 sm:p-4">
            <SkillDocument
              skill={activeView.skill}
              onClose={openSkillBrowser}
              onNavigate={navigateToSkill}
            />
          </div>
        )}

        {/* README */}
        {activeView.type === 'readme' && (
          <div className="h-full p-2 sm:p-4">
            <Window
              title="README.TXT - Welcome"
              icon={<FileText className="h-4 w-4" />}
              onClose={goToDesktop}
              className="mx-auto h-full max-w-3xl animate-fade-in"
              mobile
            >
              <WindowWell className="m-2 flex-1 overflow-auto p-4 sm:p-6">
                <article className="space-y-4 text-sm leading-relaxed">
                  <h1 className="text-2xl font-bold text-win31-navy">
                    Some Claude Skills
                  </h1>
                  <p className="text-base text-win31-gray-darker">
                    A curated collection of 90+ expert AI agents for Claude Code.
                  </p>

                  <hr className="border-win31-gray-darker" />

                  <h2 className="text-lg font-semibold text-win31-navy">What are Skills?</h2>
                  <p>
                    Skills are specialized prompts that transform Claude into an expert in a specific
                    domain. Each skill contains instructions, best practices, and patterns for tasks
                    like TypeScript development, system architecture, DevOps, and more.
                  </p>

                  <h2 className="text-lg font-semibold text-win31-navy">Getting Started</h2>
                  <ol className="list-inside list-decimal space-y-2">
                    <li>
                      <strong>Browse Skills</strong> - Open the Skills folder to explore available skills
                    </li>
                    <li>
                      <strong>Read the Documentation</strong> - Each skill includes detailed instructions
                    </li>
                    <li>
                      <strong>Install</strong> - Copy the install command to add skills to your project
                    </li>
                    <li>
                      <strong>Use</strong> - Claude will automatically apply the skill&apos;s expertise
                    </li>
                  </ol>

                  <h2 className="text-lg font-semibold text-win31-navy">About This Interface</h2>
                  <p>
                    This is <strong>Windows 3.1 Pocket Edition</strong> - imagining what a smartphone
                    would look like if Microsoft made one in 1992.
                  </p>
                  <p className="text-win31-gray-darker">
                    Built with Next.js 15, Tailwind CSS v4, and Cloudflare Pages.
                  </p>

                  <div className="mt-8 rounded-none border border-win31-gray-darker bg-win31-gray-light p-4">
                    <h3 className="mb-2 font-semibold">Quick Tips</h3>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>Double-tap icons to open them</li>
                      <li>Use the Start menu for navigation</li>
                      <li>Skills show references in the sidebar</li>
                      <li>Works great on mobile devices</li>
                    </ul>
                  </div>
                </article>
              </WindowWell>
              <div className="flex justify-end gap-2 p-2">
                <Button variant="primary" onClick={openSkillBrowser}>
                  Browse Skills
                </Button>
                <Button variant="default" onClick={goToDesktop}>
                  OK
                </Button>
              </div>
            </Window>
          </div>
        )}

        {/* About */}
        {activeView.type === 'about' && (
          <div className="h-full p-2 sm:p-4">
            <Window
              title="About Skills 3.1"
              icon={<HelpCircle className="h-4 w-4" />}
              onClose={goToDesktop}
              className="mx-auto max-w-md animate-fade-in"
              mobile
            >
              <WindowContent className="text-center">
                <div className="mb-4 text-6xl">🖥️</div>
                <h1 className="mb-1 text-xl font-bold text-win31-navy">
                  Skills 3.1 Pocket Edition
                </h1>
                <p className="mb-4 text-sm text-win31-gray-darker">
                  Version 1.0.0
                </p>

                <div className="mb-4 space-y-1 text-xs">
                  <p>© 2024 Some Claude Skills</p>
                  <p>Made by Erich Owens</p>
                  <p className="text-win31-gray-darker">Ex-Meta ML Engineer</p>
                </div>

                <div className="rounded-none border border-win31-gray-darker bg-win31-gray-light p-3 text-left text-xs">
                  <p className="mb-2 font-semibold">System Info:</p>
                  <p>• Next.js 15 (App Router)</p>
                  <p>• Tailwind CSS v4</p>
                  <p>• Radix UI Primitives</p>
                  <p>• Cloudflare Pages</p>
                </div>
              </WindowContent>
              <div className="flex justify-center p-2">
                <Button variant="default" onClick={goToDesktop}>
                  OK
                </Button>
              </div>
            </Window>
          </div>
        )}
      </main>

      {/* Taskbar */}
      <Taskbar onStartClick={() => setStartOpen(!startOpen)}>
        {activeView.type !== 'desktop' && (
          <TaskbarButton
            active
            icon={
              activeView.type === 'browser' ? <Folder className="h-3 w-3" /> :
              activeView.type === 'skill' ? <FileText className="h-3 w-3" /> :
              <FileText className="h-3 w-3" />
            }
            onClick={() => {}}
          >
            {getActiveTitle()}
          </TaskbarButton>
        )}
      </Taskbar>

      {/* Start Menu */}
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)}>
        <StartMenuItem
          icon={Folder}
          label="Skills"
          onClick={openSkillBrowser}
        />
        <StartMenuItem
          icon={Star}
          label="Favorites"
          onClick={openSkillBrowser}
        />
        <StartMenuItem
          icon={Cpu}
          label="MCP Servers"
          onClick={openSkillBrowser}
        />
        <StartMenuDivider />
        <StartMenuItem
          icon={Search}
          label="Find..."
          shortcut="Ctrl+F"
          onClick={openSkillBrowser}
        />
        <StartMenuItem
          icon={Book}
          label="Documentation"
          onClick={() => { setActiveView({ type: 'readme' }); setStartOpen(false); }}
        />
        <StartMenuItem
          icon={HelpCircle}
          label="About"
          onClick={() => { setActiveView({ type: 'about' }); setStartOpen(false); }}
        />
        <StartMenuDivider />
        <StartMenuItem
          icon={Power}
          label="Close Menu"
          onClick={() => setStartOpen(false)}
        />
      </StartMenu>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  FileText,
  Book,
  Link2,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { type Skill, type SkillReference, categoryMeta } from '@/lib/skills';
import { Button } from '@/components/ui/button';
import { Window, WindowContent, WindowStatusBar } from './window';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * SKILL DOCUMENT VIEWER
 * Full-page document view for skills - like opening a file in Notepad
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface SkillDocumentProps {
  skill: Skill;
  onClose: () => void;
  onNavigate?: (skillId: string) => void;
}

export function SkillDocument({ skill, onClose, onNavigate }: SkillDocumentProps) {
  const [copied, setCopied] = React.useState(false);
  const category = categoryMeta[skill.category];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(skill.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Window
      title={`${skill.title}.md`}
      icon={<FileText className="h-4 w-4" />}
      onClose={onClose}
      className="mx-auto h-[calc(100dvh-60px)] max-w-4xl animate-fade-in"
      mobile
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-win31-gray-darker bg-win31-gray px-2 py-1">
        <span className="text-xs text-win31-gray-darker">Category:</span>
        <span className="flex items-center gap-1 rounded bg-win31-gray-light px-2 py-0.5 text-xs">
          {category.icon} {category.label}
        </span>
        <span className="mx-2 h-4 w-px bg-win31-gray-darker" />
        <span className="text-xs text-win31-gray-darker">Difficulty:</span>
        <DifficultyBadge difficulty={skill.difficulty} />
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" onClick={handleCopy} title="Copy install command">
          {copied ? <Check className="h-4 w-4 text-win31-green" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document content */}
        <div className="flex-1 overflow-auto">
          <WindowContent className="pb-8">
            {/* Header */}
            <div className="mb-6 border-b border-win31-gray-darker pb-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-3xl">{skill.icon}</span>
                <div>
                  <h1 className="text-xl font-semibold text-win31-navy">{skill.title}</h1>
                  <p className="text-sm text-win31-gray-darker">{skill.description}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm bg-win31-gray-light px-2 py-0.5 text-xs text-win31-gray-darker"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Install command */}
              <div className="mt-4 flex items-center gap-2">
                <code className="flex-1 rounded-none border border-win31-gray-darker bg-win31-black px-3 py-2 font-mono text-sm text-win31-lime">
                  {skill.installCommand}
                </code>
                <Button variant="primary" size="sm" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Rendered markdown content */}
            <div className="prose-win31">
              <MarkdownContent content={skill.content} />
            </div>
          </WindowContent>
        </div>

        {/* References sidebar - prominent on desktop, collapsible on mobile */}
        {skill.references && skill.references.length > 0 && (
          <ReferencesSidebar
            references={skill.references}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* Status bar */}
      <WindowStatusBar>
        <span className="flex-1">{skill.content.split('\n').length} lines</span>
        <span>Skill v1.0</span>
      </WindowStatusBar>
    </Window>
  );
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * REFERENCES SIDEBAR
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ReferencesSidebarProps {
  references: SkillReference[];
  onNavigate?: (skillId: string) => void;
}

function ReferencesSidebar({ references, onNavigate }: ReferencesSidebarProps) {
  const [expanded, setExpanded] = React.useState(true);

  const grouped = React.useMemo(() => {
    const groups: Record<string, SkillReference[]> = {};
    for (const ref of references) {
      if (!groups[ref.type]) groups[ref.type] = [];
      groups[ref.type].push(ref);
    }
    return groups;
  }, [references]);

  const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    guide: { label: 'Guides', icon: <Book className="h-3 w-3" /> },
    example: { label: 'Examples', icon: <FileText className="h-3 w-3" /> },
    'related-skill': { label: 'Related Skills', icon: <Link2 className="h-3 w-3" /> },
    external: { label: 'External', icon: <ExternalLink className="h-3 w-3" /> },
  };

  return (
    <aside
      className={cn(
        'flex-shrink-0 border-l border-win31-gray-darker bg-win31-gray-light',
        'transition-all duration-200',
        expanded ? 'w-64' : 'w-10'
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex h-8 w-full items-center gap-2 border-b border-win31-gray-darker px-2 text-xs font-semibold hover:bg-win31-gray"
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 transition-transform',
            expanded && 'rotate-180'
          )}
        />
        {expanded && <span>References</span>}
      </button>

      {expanded && (
        <div className="overflow-auto p-2">
          {Object.entries(grouped).map(([type, refs]) => (
            <div key={type} className="mb-4">
              <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-win31-gray-darker">
                {typeLabels[type]?.icon}
                <span>{typeLabels[type]?.label || type}</span>
              </div>
              <div className="space-y-1">
                {refs.map((ref, i) => (
                  <ReferenceLink
                    key={i}
                    reference={ref}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

interface ReferenceLinkProps {
  reference: SkillReference;
  onNavigate?: (skillId: string) => void;
}

function ReferenceLink({ reference, onNavigate }: ReferenceLinkProps) {
  const isInternal = reference.url.startsWith('/');
  const isSkill = reference.type === 'related-skill';

  const handleClick = () => {
    if (isSkill && onNavigate) {
      // Extract skill ID from URL like /skills/typescript-developer
      const skillId = reference.url.split('/').pop();
      if (skillId) onNavigate(skillId);
    } else if (!isInternal) {
      window.open(reference.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-2 rounded-sm p-2 text-left text-xs',
        'hover:bg-win31-navy hover:text-white',
        'transition-colors'
      )}
    >
      <span className="flex-1">
        <span className="block font-medium">{reference.title}</span>
        {reference.description && (
          <span className="block text-win31-gray-darker group-hover:text-win31-gray-light">
            {reference.description}
          </span>
        )}
      </span>
      {!isInternal && <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0" />}
    </button>
  );
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * SIMPLE MARKDOWN RENDERER
 * ═══════════════════════════════════════════════════════════════════════════
 */

function MarkdownContent({ content }: { content: string }) {
  // Very simple markdown rendering - in production use react-markdown or MDX
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={i}
            className="my-4 overflow-x-auto rounded-none border border-win31-gray-darker bg-win31-black p-4 font-mono text-sm text-win31-lime"
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        // Language hint (e.g., ```typescript) - could be used for syntax highlighting
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="mb-4 mt-6 text-xl font-bold text-win31-navy first:mt-0">
          {line.slice(2)}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="mb-3 mt-6 text-lg font-semibold text-win31-navy">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="mb-2 mt-4 text-base font-semibold text-win31-gray-darker">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm">
          {renderInline(line.slice(2))}
        </li>
      );
      continue;
    }
    if (/^\d+\. /.test(line)) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-sm">
          {renderInline(line.replace(/^\d+\. /, ''))}
        </li>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-3" />);
      continue;
    }

    // Tables (simple)
    if (line.startsWith('|')) {
      // Skip for now - would need proper table parsing
      elements.push(
        <div key={i} className="overflow-x-auto text-xs font-mono">
          {line}
        </div>
      );
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Simple inline formatting
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code
          key={key++}
          className="rounded-sm bg-win31-gray-light px-1 py-0.5 font-mono text-xs text-win31-navy"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // No more formatting
    parts.push(remaining);
    break;
  }

  return parts;
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════
 */

function DifficultyBadge({ difficulty }: { difficulty: Skill['difficulty'] }) {
  const styles = {
    beginner: 'bg-win31-green/20 text-win31-green border-win31-green/40',
    intermediate: 'bg-win31-yellow/20 text-win31-gray-darker border-win31-yellow/40',
    advanced: 'bg-win31-red/20 text-win31-red border-win31-red/40',
  };

  return (
    <span
      className={cn(
        'rounded-sm border px-2 py-0.5 text-xs font-medium capitalize',
        styles[difficulty]
      )}
    >
      {difficulty}
    </span>
  );
}


import React, { useState } from 'react';
import InstallTabs from './InstallTabs';
import { downloadSkillZip } from '@site/src/utils/downloadSkillZip';
import '../css/win31.css';

interface SkillHeaderProps {
  skillName: string;
  fileName: string;
  description: string;
}

export default function SkillHeader({ skillName, fileName, description }: SkillHeaderProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // Convert fileName (underscore format) to skillId (hyphen format)
  const skillId = fileName.replace(/_/g, '-');
  const githubFolderUrl = `https://github.com/erichowens/some_claude_skills/tree/main/.claude/skills/${skillId}`;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadSkillZip(skillId, skillName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Hero Image Card */}
      <div
        style={{
          marginBottom: '24px',
          background: '#000',
          border: '3px solid var(--win31-black)',
          overflow: 'hidden',
        }}
      >
        <img
          src={`/img/skills/${skillId}-hero.png`}
          alt={`${skillName} Hero`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* Get This Skill Panel - Windows 3.1 Style */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '3px solid var(--win31-black)',
          boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.5)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Vaporwave accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--win31-teal) 0%, var(--win31-magenta) 50%, var(--win31-teal) 100%)',
        }} />

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {/* Title */}
          <div style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '11px',
            letterSpacing: '3px',
            color: 'var(--win31-teal)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
          }}>
            ⚡ Get This Skill
          </div>

          {/* Download Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
          }}>
            {/* Download Skill Folder ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="win31-push-button win31-push-button-default"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '6px',
                padding: '16px 20px',
                cursor: isDownloading ? 'wait' : 'pointer',
                opacity: isDownloading ? 0.7 : 1,
                background: 'linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)',
                border: '2px outset #00d4ff',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-system)',
                fontSize: '16px',
                fontWeight: '700',
                color: '#000',
              }}>
                <span style={{ fontSize: '20px' }}>{isDownloading ? '⏳' : '📦'}</span>
                {isDownloading ? 'Downloading...' : 'Download Skill Folder'}
              </div>
              <div style={{
                fontFamily: 'var(--font-system)',
                fontSize: '12px',
                color: '#000',
                fontWeight: '600',
                lineHeight: '1.5',
              }}>
                {isDownloading ? 'Creating zip file...' : 'Complete skill folder with SKILL.md and all resources'}
              </div>
            </button>

            {/* View on GitHub */}
            <a
              href={githubFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="win31-push-button"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '6px',
                textDecoration: 'none',
                padding: '16px 20px',
                background: 'var(--win31-gray)',
                border: '2px outset var(--win31-gray)',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-system)',
                fontSize: '16px',
                fontWeight: '600',
                color: '#000',
              }}>
                <span style={{ fontSize: '20px' }}>🔗</span>
                Browse on GitHub
              </div>
              <div style={{
                fontFamily: 'var(--font-system)',
                fontSize: '12px',
                color: '#333',
                lineHeight: '1.5',
              }}>
                View source code and explore the skill folder structure
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Installation Instructions - Collapsible */}
      <div
        className="win31-panel win31-panel-inset"
        style={{
          background: 'var(--win31-yellow)',
          border: '3px solid var(--win31-black)',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-pixel)',
            fontSize: '10px',
            color: 'var(--win31-black)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          <span>📖 Installation Instructions (3 Easy Steps)</span>
          <span style={{ fontSize: '14px' }}>{isExpanded ? '▼' : '▶'}</span>
        </button>

        {isExpanded && (
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div
              style={{
                fontFamily: 'var(--font-system)',
                fontSize: '13px',
                color: 'var(--win31-black)',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}
            >
              {description}
            </div>

            {/* Tabbed Installation Instructions */}
            <InstallTabs
              skillId={skillId}
              skillName={skillName}
              compact={false}
            />

            {/* Security Note */}
            <div style={{
              marginTop: '16px',
              padding: '10px',
              background: '#1a1a0a',
              border: '2px solid #aa0',
              borderLeft: '4px solid #aa0',
            }}>
              <div style={{
                color: '#dd0',
                fontSize: '11px',
                fontFamily: 'var(--font-code)',
                fontWeight: 'bold',
                marginBottom: '4px',
              }}>
                Security Note
              </div>
              <div style={{
                color: '#aa8',
                fontSize: '11px',
                fontFamily: 'var(--font-code)',
              }}>
                Skills execute code. Only install from trusted sources.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

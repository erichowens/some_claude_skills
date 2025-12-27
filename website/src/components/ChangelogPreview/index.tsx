import React from 'react';
import changelogData from '../../data/changelog.json';
import './styles.css';

type ChangelogItem = {
  date: string;
  hash: string;
  type: string;
  scope: string | null;
  description: string;
  category: string;
  skillCount: number | null;
};

type ChangelogEntry = {
  date: string;
  items: ChangelogItem[];
};

type ChangelogData = {
  generated: string;
  totalEntries: number;
  entries: ChangelogEntry[];
};

const changelog = changelogData as ChangelogData;

const TYPE_ICONS: Record<string, string> = {
  feat: '✨',
  fix: '🔧',
  add: '➕',
  perf: '⚡',
  refactor: '♻️',
  other: '📝',
};

const CATEGORY_COLORS: Record<string, string> = {
  skills: 'var(--win31-lime)',
  ui: 'var(--win31-bright-cyan)',
  features: 'var(--win31-bright-yellow)',
  fixes: 'var(--win31-bright-magenta)',
  performance: 'var(--win31-bright-green)',
  infra: 'var(--win31-gray)',
  other: '#888',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChangelogPreview(): JSX.Element {
  // Get recent items (last 7 items across all days)
  const recentItems: (ChangelogItem & { formattedDate: string })[] = [];

  for (const entry of changelog.entries) {
    for (const item of entry.items) {
      if (recentItems.length >= 7) break;
      recentItems.push({
        ...item,
        formattedDate: formatDate(entry.date),
      });
    }
    if (recentItems.length >= 7) break;
  }

  return (
    <div className="win31-window changelog-preview">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">WHATSNEW.TXT</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">▲</div>
          <div className="win31-btn-3d win31-btn-3d--small">▼</div>
        </div>
      </div>
      <div className="changelog-preview__content">
        <div className="changelog-preview__header">
          <h2>Recent Updates</h2>
          <a href="/changelog" className="changelog-preview__see-all">
            View full changelog →
          </a>
        </div>
        <ul className="changelog-preview__list">
          {recentItems.map((item, idx) => (
            <li key={`${item.hash}-${idx}`} className="changelog-preview__item">
              <span className="changelog-preview__icon">
                {TYPE_ICONS[item.type] || TYPE_ICONS.other}
              </span>
              <span className="changelog-preview__desc">
                {item.scope && (
                  <span
                    className="changelog-preview__scope"
                    style={{ borderColor: CATEGORY_COLORS[item.category] }}
                  >
                    {item.scope}
                  </span>
                )}
                {item.description}
                {item.skillCount && (
                  <span className="changelog-preview__skill-count">
                    +{item.skillCount}
                  </span>
                )}
              </span>
              <span className="changelog-preview__date">{item.formattedDate}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

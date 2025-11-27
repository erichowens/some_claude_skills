import React, { useState, useMemo } from 'react';
import { useHistory } from '@docusaurus/router';
import type { Skill } from '../../types/skill';
import skillMetadata from '../../data/skillMetadata.json';
import styles from './styles.module.css';

type SortField = 'title' | 'category' | 'createdAt' | 'updatedAt' | 'totalLines' | 'skillMdSize';
type SortDirection = 'asc' | 'desc';

interface SkillListViewProps {
  skills: Skill[];
  basePath?: string;
}

interface SkillMetadataItem {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  totalLines: number;
  totalFiles: number;
  skillMdSize: number;
  skillMdLines: number;
  hasReferences: boolean;
  hasExamples: boolean;
  hasChangelog: boolean;
}

const metadata = skillMetadata.skills as Record<string, SkillMetadataItem>;

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function formatLines(lines: number): string {
  if (lines >= 1000) {
    return `${(lines / 1000).toFixed(1)}K`;
  }
  return lines.toString();
}

function getRelativeDate(isoDate: string | null): string {
  if (!isoDate) return 'Unknown';
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(isoDate);
}

export default function SkillListView({ skills, basePath = '' }: SkillListViewProps): JSX.Element {
  const history = useHistory();
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedSkills = useMemo(() => {
    const sorted = [...skills].sort((a, b) => {
      const metaA = metadata[a.id];
      const metaB = metadata[b.id];

      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'createdAt':
          const dateA = metaA?.createdAt ? new Date(metaA.createdAt).getTime() : 0;
          const dateB = metaB?.createdAt ? new Date(metaB.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'updatedAt':
          const updateA = metaA?.updatedAt ? new Date(metaA.updatedAt).getTime() : 0;
          const updateB = metaB?.updatedAt ? new Date(metaB.updatedAt).getTime() : 0;
          comparison = updateA - updateB;
          break;
        case 'totalLines':
          comparison = (metaA?.totalLines || 0) - (metaB?.totalLines || 0);
          break;
        case 'skillMdSize':
          comparison = (metaA?.skillMdSize || 0) - (metaB?.skillMdSize || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [skills, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRowClick = (skill: Skill) => {
    history.push(skill.path);
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return <span className={styles.sortIndicatorInactive}>◇</span>;
    return sortDirection === 'asc'
      ? <span className={styles.sortIndicator}>▲</span>
      : <span className={styles.sortIndicator}>▼</span>;
  };

  const sortLabels: Record<SortField, string> = {
    title: 'Name',
    category: 'Category',
    createdAt: 'Created',
    updatedAt: 'Updated',
    totalLines: 'Lines',
    skillMdSize: 'Size',
  };

  return (
    <div className={styles.container}>
      {/* Window Title Bar */}
      <div className={styles.titleBar}>
        <span className={styles.titleBarIcon}>📋</span>
        <span className={styles.titleBarText}>SKILLS.LST - {skills.length} items</span>
        <div className={styles.titleBarButtons}>
          <button className={styles.titleBarBtn}>─</button>
          <button className={styles.titleBarBtn}>□</button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>Sort by:</span>
        {(['title', 'updatedAt', 'createdAt', 'totalLines', 'skillMdSize'] as SortField[]).map((field) => (
          <button
            key={field}
            className={`${styles.sortBtn} ${sortField === field ? styles.sortBtnActive : ''}`}
            onClick={() => handleSort(field)}
          >
            {sortLabels[field]} {sortField === field && (sortDirection === 'asc' ? '▲' : '▼')}
          </button>
        ))}
      </div>

      {/* Skills List with Hero Images */}
      <div className={styles.listContainer}>
        {sortedSkills.map((skill) => {
          const meta = metadata[skill.id];
          return (
            <div
              key={skill.id}
              className={styles.skillRow}
              onClick={() => handleRowClick(skill)}
            >
              {/* Hero Image Thumbnail */}
              <div className={styles.heroThumb}>
                <img
                  src={`${basePath}/img/skills/${skill.id}-hero.png`}
                  alt={skill.title}
                  className={styles.heroImg}
                />
                {skill.badge === 'NEW' && <span className={styles.badgeNew}>NEW!</span>}
                {skill.badge === 'UPDATED' && <span className={styles.badgeUpdated}>UPD</span>}
              </div>

              {/* Skill Info */}
              <div className={styles.skillInfo}>
                <div className={styles.skillHeader}>
                  <h3 className={styles.skillTitle}>{skill.title}</h3>
                  <span className={styles.skillCategory}>{skill.category}</span>
                </div>
                <p className={styles.skillDesc}>{skill.description}</p>
                <div className={styles.skillMeta}>
                  <span className={styles.metaItem} title="Last updated">
                    🕐 {getRelativeDate(meta?.updatedAt)}
                  </span>
                  <span className={styles.metaItem} title="Created">
                    📅 {formatDate(meta?.createdAt)}
                  </span>
                  <span className={styles.metaItem} title="Total lines of content">
                    📝 {formatLines(meta?.totalLines || 0)} lines
                  </span>
                  <span className={styles.metaItem} title="SKILL.md size">
                    📦 {formatSize(meta?.skillMdSize || 0)}
                  </span>
                  {meta?.totalFiles > 1 && (
                    <span className={styles.metaItem} title="Number of files">
                      📁 {meta.totalFiles} files
                    </span>
                  )}
                  {meta?.hasReferences && (
                    <span className={styles.metaBadge} title="Has reference materials">
                      📚 refs
                    </span>
                  )}
                </div>
              </div>

              {/* Action Arrow */}
              <div className={styles.skillAction}>
                →
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusPanel}>
          {sortedSkills.length} skill(s)
        </div>
        <div className={styles.statusPanel}>
          Sorted by: {sortLabels[sortField]} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
        </div>
        <div className={styles.statusPanel}>
          Click row to view details
        </div>
      </div>
    </div>
  );
}

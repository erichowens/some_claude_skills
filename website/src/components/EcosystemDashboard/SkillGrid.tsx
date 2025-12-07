import React, { useState, useMemo } from 'react';
import styles from './styles.module.css';

interface Skill {
  name: string;
  description: string;
  category: string | null;
  tools: string[];
  has_references: boolean;
  has_examples: boolean;
}

interface SkillGridProps {
  skills: Skill[];
}

export default function SkillGrid({ skills }: SkillGridProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWithTools, setFilterWithTools] = useState(false);
  const [filterWithRefs, setFilterWithRefs] = useState(false);

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTools = !filterWithTools || skill.tools.length > 0;
      const matchesRefs = !filterWithRefs || skill.has_references;

      return matchesSearch && matchesTools && matchesRefs;
    });
  }, [skills, searchTerm, filterWithTools, filterWithRefs]);

  return (
    <div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">SKILLS.DB - All Capabilities</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">□</div>
        </div>
      </div>

      <div className={styles.skillControls}>
        <input
          type="text"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={filterWithTools}
            onChange={(e) => setFilterWithTools(e.target.checked)}
          />
          Has Tools
        </label>

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={filterWithRefs}
            onChange={(e) => setFilterWithRefs(e.target.checked)}
          />
          Has References
        </label>

        <div className={styles.skillCount}>
          {filteredSkills.length} of {skills.length} skills
        </div>
      </div>

      <div className={styles.skillGridContainer}>
        {filteredSkills.map(skill => (
          <div key={skill.name} className={styles.skillCard}>
            <div className={styles.skillHeader}>
              <h4 className={styles.skillName}>{skill.name}</h4>
              <div className={styles.skillBadges}>
                {skill.has_references && (
                  <span className={styles.badge} title="Has references">📚</span>
                )}
                {skill.has_examples && (
                  <span className={styles.badge} title="Has examples">💡</span>
                )}
                {skill.tools.length > 0 && (
                  <span className={styles.badge} title={`${skill.tools.length} tools`}>
                    🔧 {skill.tools.length}
                  </span>
                )}
              </div>
            </div>

            <p className={styles.skillDescription}>
              {skill.description.slice(0, 200)}
              {skill.description.length > 200 ? '...' : ''}
            </p>

            {skill.tools.length > 0 && (
              <div className={styles.skillTools}>
                {skill.tools.slice(0, 3).map(tool => (
                  <span key={tool} className={styles.toolTag}>{tool}</span>
                ))}
                {skill.tools.length > 3 && (
                  <span className={styles.toolTag}>+{skill.tools.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

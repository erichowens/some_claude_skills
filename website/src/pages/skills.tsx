import React, { useState, useMemo } from 'react';
import Layout from '@theme/Layout';
import SkillQuickView from '../components/SkillQuickView';
import SkillGalleryCard from '../components/SkillGalleryCard';
import type { Skill } from '../types/skill';
import { ALL_SKILLS, searchSkills } from '../data/skills';
import { SKILL_CATEGORIES } from '../types/skill';
import { useStarredSkills } from '../hooks/useStarredSkills';
import '../css/win31.css';
import '../css/skills-gallery.css';

export default function SkillsGallery(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const { toggleStar, isStarred, getStarredCount } = useStarredSkills();

  const filteredSkills = useMemo(() => {
    let skills = ALL_SKILLS;

    // Filter by starred
    if (showStarredOnly) {
      skills = skills.filter(skill => isStarred(skill.id));
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      skills = skills.filter(skill => skill.category === selectedCategory);
    }

    // Filter by search
    return searchSkills(skills, searchQuery);
  }, [selectedCategory, searchQuery, showStarredOnly, isStarred]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setShowStarredOnly(false);
  };

  return (
    <Layout
      title="Skills Gallery"
      description="Browse all 25 Claude Skills with beautiful hero images"
    >
      <div className="skills-page-bg">
        <div className="skills-container">
          {/* Header */}
          <div className="win31-panel-box">
            <div className="section-header">
              <h1 className="win31-font hero-title" style={{ fontSize: '32px' }}>
                Skills Gallery
              </h1>
              <p className="win31-font" style={{ fontSize: '16px', textAlign: 'center', color: '#333', marginBottom: '20px' }}>
                Modular prompt extensions for Claude Code - Click any card for quick install
              </p>

              {/* Search Bar */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="win31-font search-input"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            {/* Starred Filter */}
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className="win31-push-button"
              style={{
                fontSize: '14px',
                padding: '10px 20px',
                background: showStarredOnly ? 'var(--win31-yellow)' : 'var(--win31-gray)',
                color: 'black',
                fontWeight: showStarredOnly ? 'bold' : 'normal',
              }}
            >
              ★ Starred ({getStarredCount()})
            </button>
            {SKILL_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="win31-push-button"
                style={{
                  fontSize: '14px',
                  padding: '10px 20px',
                  background: selectedCategory === category ? 'var(--win31-blue)' : 'var(--win31-gray)',
                  color: selectedCategory === category ? 'white' : 'black',
                  fontWeight: selectedCategory === category ? 'bold' : 'normal',
                }}
              >
                {category === 'all' ? 'All Skills' : category}
              </button>
            ))}
          </div>

          {/* Skills Grid */}
          <div className="skills-grid">
            {filteredSkills.map((skill) => (
              <SkillGalleryCard
                key={skill.id}
                skill={skill}
                onClick={setSelectedSkill}
                isStarred={isStarred(skill.id)}
                onToggleStar={toggleStar}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredSkills.length === 0 && (
            <div className="no-results">
              <h3 className="win31-font no-results__title">No skills found</h3>
              <p className="win31-font no-results__description">
                Try adjusting your search or category filter
              </p>
              <button
                className="win31-push-button"
                onClick={handleResetFilters}
                style={{ padding: '10px 20px' }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Stats Footer */}
          <div className="win31-panel-box win31-panel-box--small-shadow" style={{ marginBottom: 0 }}>
            <div className="win31-statusbar" style={{ justifyContent: 'center', gap: '20px', padding: '20px' }}>
              <div className="win31-statusbar-panel">
                {filteredSkills.length} of {ALL_SKILLS.length} skills shown
              </div>
              <div className="win31-statusbar-panel">
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </div>
              <div className="win31-statusbar-panel">
                <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedSkill && (
        <SkillQuickView
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          isStarred={isStarred(selectedSkill.id)}
          onToggleStar={toggleStar}
        />
      )}
    </Layout>
  );
}

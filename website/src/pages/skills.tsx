import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { useHistory, useLocation } from '@docusaurus/router';
import SkillQuickView from '../components/SkillQuickView';
import SkillGalleryCard from '../components/SkillGalleryCard';
import SkillListView from '../components/SkillListView';
import type { Skill } from '../types/skill';
import { ALL_SKILLS, searchSkills } from '../data/skills';
import { SKILL_CATEGORIES } from '../types/skill';
import { ALL_TAGS, getTagsByType, TAG_TYPE_LABELS, TAG_TYPE_COLORS, type TagType } from '../types/tags';
import { useStarredSkills } from '../hooks/useStarredSkills';
import '../css/win31.css';
import '../css/skills-gallery.css';
import '../css/backsplash.css';

type ViewMode = 'cards' | 'list';

export default function SkillsGallery(): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const { toggleStar, isStarred, getStarredCount } = useStarredSkills();

  // Read tags from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tagsParam = params.get('tags');
    if (tagsParam) {
      const tags = tagsParam.split(',').filter(t => ALL_TAGS.some(at => at.id === t));
      setSelectedTags(tags);
      if (tags.length > 0) {
        setShowTagFilter(true);
      }
    }
  }, [location.search]);

  // Update URL when tags change
  const updateUrlWithTags = (tags: string[]) => {
    const params = new URLSearchParams(location.search);
    if (tags.length > 0) {
      params.set('tags', tags.join(','));
    } else {
      params.delete('tags');
    }
    const newSearch = params.toString();
    history.replace({
      pathname: location.pathname,
      search: newSearch ? `?${newSearch}` : '',
    });
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    updateUrlWithTags(newTags);
  };

  const handleClearTags = () => {
    setSelectedTags([]);
    updateUrlWithTags([]);
  };

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

    // Filter by tags (OR logic - skill matches if it has ANY of the selected tags)
    if (selectedTags.length > 0) {
      skills = skills.filter(skill =>
        skill.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Filter by search (also searches tags)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      skills = skills.filter(skill =>
        skill.title.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return skills;
  }, [selectedCategory, searchQuery, showStarredOnly, isStarred, selectedTags]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setShowStarredOnly(false);
    setSelectedTags([]);
    updateUrlWithTags([]);
  };

  const tagsByType = getTagsByType();

  // Calculate tag counts from actual skills
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_SKILLS.forEach(skill => {
      skill.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, []);

  // Get popular tags (used by 3+ skills, sorted by usage)
  const popularTags = useMemo(() => {
    return ALL_TAGS
      .filter(tag => (tagCounts[tag.id] || 0) >= 2)
      .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
      .slice(0, 12);
  }, [tagCounts]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_SKILLS.length };
    SKILL_CATEGORIES.slice(1).forEach(category => {
      counts[category] = ALL_SKILLS.filter(skill => skill.category === category).length;
    });
    return counts;
  }, []);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Claude Skills Gallery',
    description: `Browse all ${ALL_SKILLS.length} Claude Code skills. Expert AI agents for machine learning, computer vision, audio design, web development, and more.`,
    url: 'https://someclaudeskills.com/skills',
    numberOfItems: ALL_SKILLS.length,
    about: {
      '@type': 'SoftwareApplication',
      name: 'Claude Code Skills',
      applicationCategory: 'DeveloperApplication',
    },
  };

  return (
    <Layout
      title="Skills Gallery"
      description={`Browse all ${ALL_SKILLS.length} Claude Skills with beautiful hero images. Expert agents for ML, computer vision, audio, design, and more.`}
    >
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
        <meta name="keywords" content="Claude Code skills, AI agents, machine learning, computer vision, audio design, web development, developer tools" />
        <link rel="canonical" href="https://someclaudeskills.com/skills" />
      </Head>
      <div className="skills-page-bg page-backsplash page-backsplash--skills page-backsplash--medium">
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

          {/* Popular Tags - Always Visible */}
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}>
            <span className="win31-font" style={{
              fontSize: '12px',
              color: '#495057',
              fontWeight: 'bold',
              marginRight: '4px',
            }}>
              Popular:
            </span>
            {popularTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              const colors = TAG_TYPE_COLORS[tag.type];
              const count = tagCounts[tag.id] || 0;
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  title={`${tag.description} (${count} skills)`}
                  className="win31-font"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isSelected ? colors.text : colors.bg,
                    color: isSelected ? '#fff' : colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  {tag.label}
                  <span style={{
                    fontSize: '10px',
                    opacity: 0.8,
                    marginLeft: '2px',
                  }}>
                    ({count})
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className="win31-font"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: showTagFilter ? '#6c757d' : '#fff',
                color: showTagFilter ? '#fff' : '#495057',
                border: '1px solid #adb5bd',
                borderRadius: '16px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              {showTagFilter ? '− Less' : '+ More Tags'}
            </button>
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', border: '2px solid #808080', marginRight: '8px' }}>
              <button
                onClick={() => setViewMode('cards')}
                className="win31-push-button"
                style={{
                  fontSize: '14px',
                  padding: '10px 16px',
                  background: viewMode === 'cards' ? 'var(--win31-navy)' : 'var(--win31-gray)',
                  color: viewMode === 'cards' ? 'white' : 'black',
                  fontWeight: viewMode === 'cards' ? 'bold' : 'normal',
                  borderRight: '1px solid #808080',
                }}
                title="Card View"
              >
                ▦ Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="win31-push-button"
                style={{
                  fontSize: '14px',
                  padding: '10px 16px',
                  background: viewMode === 'list' ? 'var(--win31-navy)' : 'var(--win31-gray)',
                  color: viewMode === 'list' ? 'white' : 'black',
                  fontWeight: viewMode === 'list' ? 'bold' : 'normal',
                }}
                title="List View (Sortable)"
              >
                ☰ List
              </button>
            </div>
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
                {category === 'all' ? 'All Skills' : category} ({categoryCounts[category] || 0})
              </button>
            ))}
          </div>

          {/* Tag Filter Panel */}
          {showTagFilter && (
            <div className="win31-panel-box" style={{ marginBottom: '20px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 className="win31-font" style={{ margin: 0, fontSize: '14px', color: 'var(--win31-navy)' }}>
                    Filter by Tags
                  </h3>
                  <p className="win31-font" style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                    Shows skills matching <strong>any</strong> selected tag
                  </p>
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={handleClearTags}
                    className="win31-push-button"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {(Object.keys(tagsByType) as TagType[]).map((type) => (
                <div key={type} style={{ marginBottom: '12px' }}>
                  <div
                    className="win31-font"
                    style={{
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '6px',
                      fontWeight: 'bold'
                    }}
                  >
                    {TAG_TYPE_LABELS[type]}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {tagsByType[type].map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      const colors = TAG_TYPE_COLORS[type];
                      const count = tagCounts[tag.id] || 0;
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          title={`${tag.description} (${count} skills)`}
                          className="win31-font"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            backgroundColor: isSelected ? colors.text : colors.bg,
                            color: isSelected ? '#fff' : colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '12px',
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            opacity: count === 0 ? 0.5 : 1,
                          }}
                        >
                          {tag.label}
                          {count > 0 && (
                            <span style={{ fontSize: '10px', opacity: 0.75 }}>
                              ({count})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Tag Pills */}
          {selectedTags.length > 0 && !showTagFilter && (
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span className="win31-font" style={{ fontSize: '12px', color: '#666' }}>Active tags:</span>
              {selectedTags.map((tagId) => {
                const tag = ALL_TAGS.find(t => t.id === tagId);
                if (!tag) return null;
                const colors = TAG_TYPE_COLORS[tag.type];
                return (
                  <button
                    key={tagId}
                    onClick={() => handleTagToggle(tagId)}
                    className="win31-font"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {tag.label} ×
                  </button>
                );
              })}
              <button
                onClick={handleClearTags}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Skills Grid or List */}
          {viewMode === 'cards' ? (
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
          ) : (
            <SkillListView skills={filteredSkills} />
          )}

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
              {selectedTags.length > 0 && (
                <div className="win31-statusbar-panel">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                </div>
              )}
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

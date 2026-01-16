import React, { useState, useMemo } from 'react';
import type { Bundle, BundleAudience, BundleDifficulty } from '../../types/bundle';
import BundleCard from '../BundleCard';
import BundleQuickView from '../BundleQuickView';
import './styles.css';

interface BundleGalleryProps {
  bundles: Bundle[];
  showFilters?: boolean;
  showFeaturedFirst?: boolean;
  onViewSkill?: (skillId: string) => void;
}

/**
 * Audience filter options with labels and icons
 */
const AUDIENCE_OPTIONS: Array<{ value: BundleAudience | 'all'; label: string; icon: string }> = [
  { value: 'all', label: 'All Audiences', icon: '👥' },
  { value: 'developers', label: 'Developers', icon: '💻' },
  { value: 'entrepreneurs', label: 'Entrepreneurs', icon: '🚀' },
  { value: 'teams', label: 'Teams', icon: '👥' },
  { value: 'technical-writers', label: 'Technical Writers', icon: '📝' },
  { value: 'ml-engineers', label: 'ML Engineers', icon: '🤖' },
  { value: 'newcomers', label: 'Newcomers', icon: '🌱' },
];

/**
 * Difficulty filter options
 */
const DIFFICULTY_OPTIONS: Array<{ value: BundleDifficulty | 'all'; label: string }> = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

/**
 * BundleGallery - Grid display for skill bundles
 *
 * Features:
 * - Filterable by audience and difficulty
 * - Featured bundles shown first
 * - Click to open QuickView modal
 * - Win31 aesthetic styling
 */
export default function BundleGallery({
  bundles,
  showFilters = true,
  showFeaturedFirst = true,
  onViewSkill,
}: BundleGalleryProps): React.JSX.Element {
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<BundleAudience | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<BundleDifficulty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort bundles
  const filteredBundles = useMemo(() => {
    let result = bundles;

    // Filter by audience
    if (audienceFilter !== 'all') {
      result = result.filter((b) => b.audience === audienceFilter);
    }

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      result = result.filter((b) => b.difficulty === difficultyFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sort: featured first, then by title
    if (showFeaturedFirst) {
      result = [...result].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.title.localeCompare(b.title);
      });
    }

    return result;
  }, [bundles, audienceFilter, difficultyFilter, searchQuery, showFeaturedFirst]);

  const handleCardClick = (bundle: Bundle) => {
    setSelectedBundle(bundle);
  };

  const handleCloseQuickView = () => {
    setSelectedBundle(null);
  };

  const handleResetFilters = () => {
    setAudienceFilter('all');
    setDifficultyFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = audienceFilter !== 'all' || difficultyFilter !== 'all' || searchQuery;

  return (
    <div className="bundle-gallery">
      {/* Filters */}
      {showFilters && (
        <div className="bundle-gallery__filters">
          {/* Search */}
          <div className="bundle-gallery__search">
            <input
              type="text"
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win31-font bundle-gallery__search-input"
            />
          </div>

          {/* Audience Filter */}
          <div className="bundle-gallery__filter-group">
            <label className="win31-font bundle-gallery__filter-label">Audience:</label>
            <div className="bundle-gallery__filter-buttons">
              {AUDIENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAudienceFilter(option.value)}
                  className={`win31-push-button bundle-gallery__filter-btn ${
                    audienceFilter === option.value ? 'bundle-gallery__filter-btn--active' : ''
                  }`}
                  title={option.label}
                >
                  {option.icon}{' '}
                  <span className="bundle-gallery__filter-btn-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="bundle-gallery__filter-group">
            <label className="win31-font bundle-gallery__filter-label">Difficulty:</label>
            <div className="bundle-gallery__filter-buttons">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDifficultyFilter(option.value)}
                  className={`win31-push-button bundle-gallery__filter-btn ${
                    difficultyFilter === option.value ? 'bundle-gallery__filter-btn--active' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="win31-push-button bundle-gallery__reset-btn"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="bundle-gallery__results-bar">
        <span className="win31-font">
          Showing {filteredBundles.length} of {bundles.length} bundles
        </span>
      </div>

      {/* Grid */}
      {filteredBundles.length > 0 ? (
        <div className="bundle-gallery__grid">
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onClick={handleCardClick}
              variant={bundle.featured ? 'featured' : 'default'}
            />
          ))}
        </div>
      ) : (
        <div className="bundle-gallery__empty">
          <h3 className="win31-font">No bundles found</h3>
          <p className="win31-font">Try adjusting your filters or search query</p>
          <button onClick={handleResetFilters} className="win31-push-button">
            Reset Filters
          </button>
        </div>
      )}

      {/* QuickView Modal */}
      {selectedBundle && (
        <BundleQuickView
          bundle={selectedBundle}
          onClose={handleCloseQuickView}
          onViewSkill={onViewSkill}
        />
      )}
    </div>
  );
}

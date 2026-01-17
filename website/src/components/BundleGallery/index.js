"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BundleGallery;
var react_1 = require("react");
var BundleCard_1 = require("../BundleCard");
var BundleQuickView_1 = require("../BundleQuickView");
require("./styles.css");
/**
 * Audience filter options with labels and icons
 */
var AUDIENCE_OPTIONS = [
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
var DIFFICULTY_OPTIONS = [
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
function BundleGallery(_a) {
    var bundles = _a.bundles, _b = _a.showFilters, showFilters = _b === void 0 ? true : _b, _c = _a.showFeaturedFirst, showFeaturedFirst = _c === void 0 ? true : _c, onViewSkill = _a.onViewSkill;
    var _d = (0, react_1.useState)(null), selectedBundle = _d[0], setSelectedBundle = _d[1];
    var _e = (0, react_1.useState)('all'), audienceFilter = _e[0], setAudienceFilter = _e[1];
    var _f = (0, react_1.useState)('all'), difficultyFilter = _f[0], setDifficultyFilter = _f[1];
    var _g = (0, react_1.useState)(''), searchQuery = _g[0], setSearchQuery = _g[1];
    // Filter and sort bundles
    var filteredBundles = (0, react_1.useMemo)(function () {
        var result = bundles;
        // Filter by audience
        if (audienceFilter !== 'all') {
            result = result.filter(function (b) { return b.audience === audienceFilter; });
        }
        // Filter by difficulty
        if (difficultyFilter !== 'all') {
            result = result.filter(function (b) { return b.difficulty === difficultyFilter; });
        }
        // Filter by search query
        if (searchQuery) {
            var query_1 = searchQuery.toLowerCase();
            result = result.filter(function (b) {
                return b.title.toLowerCase().includes(query_1) ||
                    b.description.toLowerCase().includes(query_1) ||
                    b.tags.some(function (t) { return t.toLowerCase().includes(query_1); });
            });
        }
        // Sort: featured first, then by title
        if (showFeaturedFirst) {
            result = __spreadArray([], result, true).sort(function (a, b) {
                if (a.featured && !b.featured)
                    return -1;
                if (!a.featured && b.featured)
                    return 1;
                return a.title.localeCompare(b.title);
            });
        }
        return result;
    }, [bundles, audienceFilter, difficultyFilter, searchQuery, showFeaturedFirst]);
    var handleCardClick = function (bundle) {
        setSelectedBundle(bundle);
    };
    var handleCloseQuickView = function () {
        setSelectedBundle(null);
    };
    var handleResetFilters = function () {
        setAudienceFilter('all');
        setDifficultyFilter('all');
        setSearchQuery('');
    };
    var hasActiveFilters = audienceFilter !== 'all' || difficultyFilter !== 'all' || searchQuery;
    return (<div className="bundle-gallery">
      {/* Filters */}
      {showFilters && (<div className="bundle-gallery__filters">
          {/* Search */}
          <div className="bundle-gallery__search">
            <input type="text" placeholder="Search bundles..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="win31-font bundle-gallery__search-input"/>
          </div>

          {/* Audience Filter */}
          <div className="bundle-gallery__filter-group">
            <label className="win31-font bundle-gallery__filter-label">Audience:</label>
            <div className="bundle-gallery__filter-buttons">
              {AUDIENCE_OPTIONS.map(function (option) { return (<button key={option.value} onClick={function () { return setAudienceFilter(option.value); }} className={"win31-push-button bundle-gallery__filter-btn ".concat(audienceFilter === option.value ? 'bundle-gallery__filter-btn--active' : '')} title={option.label}>
                  {option.icon}{' '}
                  <span className="bundle-gallery__filter-btn-label">{option.label}</span>
                </button>); })}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="bundle-gallery__filter-group">
            <label className="win31-font bundle-gallery__filter-label">Difficulty:</label>
            <div className="bundle-gallery__filter-buttons">
              {DIFFICULTY_OPTIONS.map(function (option) { return (<button key={option.value} onClick={function () { return setDifficultyFilter(option.value); }} className={"win31-push-button bundle-gallery__filter-btn ".concat(difficultyFilter === option.value ? 'bundle-gallery__filter-btn--active' : '')}>
                  {option.label}
                </button>); })}
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (<button onClick={handleResetFilters} className="win31-push-button bundle-gallery__reset-btn">
              ✕ Clear Filters
            </button>)}
        </div>)}

      {/* Results count */}
      <div className="bundle-gallery__results-bar">
        <span className="win31-font">
          Showing {filteredBundles.length} of {bundles.length} bundles
        </span>
      </div>

      {/* Grid */}
      {filteredBundles.length > 0 ? (<div className="bundle-gallery__grid">
          {filteredBundles.map(function (bundle) { return (<BundleCard_1.default key={bundle.id} bundle={bundle} onClick={handleCardClick} variant={bundle.featured ? 'featured' : 'default'}/>); })}
        </div>) : (<div className="bundle-gallery__empty">
          <h3 className="win31-font">No bundles found</h3>
          <p className="win31-font">Try adjusting your filters or search query</p>
          <button onClick={handleResetFilters} className="win31-push-button">
            Reset Filters
          </button>
        </div>)}

      {/* QuickView Modal */}
      {selectedBundle && (<BundleQuickView_1.default bundle={selectedBundle} onClose={handleCloseQuickView} onViewSkill={onViewSkill}/>)}
    </div>);
}

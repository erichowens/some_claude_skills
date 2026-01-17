"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BundleCard;
var react_1 = require("react");
var useHoverLift_1 = require("../../hooks/useHoverLift");
var TagBadge_1 = require("../TagBadge");
require("./styles.css");
/**
 * Difficulty badge colors and labels
 */
var DIFFICULTY_CONFIG = {
    beginner: { label: 'Beginner', color: '#4a9', bg: '#e8fff0' },
    intermediate: { label: 'Intermediate', color: '#48a', bg: '#e8f4ff' },
    advanced: { label: 'Advanced', color: '#a48', bg: '#fff0f8' },
};
/**
 * Audience icons
 */
var AUDIENCE_ICONS = {
    developers: '💻',
    entrepreneurs: '🚀',
    teams: '👥',
    'technical-writers': '📝',
    'ml-engineers': '🤖',
    newcomers: '🌱',
    everyone: '🌍',
};
/**
 * BundleCard - Displays a skill bundle in the gallery
 *
 * Similar to SkillGalleryCard but for curated skill bundles.
 * Shows bundle title, description, skill count, and estimated cost.
 */
function BundleCard(_a) {
    var bundle = _a.bundle, onClick = _a.onClick, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.basePath, basePath = _c === void 0 ? '' : _c;
    var hoverConfig = variant === 'featured' ? useHoverLift_1.HOVER_CONFIGS.featuredCard : useHoverLift_1.HOVER_CONFIGS.card;
    var hoverHandlers = (0, useHoverLift_1.useHoverLift)(hoverConfig);
    var diffConfig = DIFFICULTY_CONFIG[bundle.difficulty];
    var audienceIcon = AUDIENCE_ICONS[bundle.audience] || '📦';
    var requiredSkills = bundle.skills.filter(function (s) { return !s.optional; });
    var optionalSkills = bundle.skills.filter(function (s) { return s.optional; });
    var cardClass = variant === 'featured'
        ? 'bundle-card bundle-card--featured'
        : 'bundle-card';
    return (<div className={cardClass} onClick={function () { return onClick === null || onClick === void 0 ? void 0 : onClick(bundle); }} {...hoverHandlers}>
      {/* Header with audience icon */}
      <div className="bundle-card__header">
        <span className="bundle-card__audience-icon">{audienceIcon}</span>
        <div className="bundle-card__badges">
          {bundle.featured && (<span className="bundle-card__badge bundle-card__badge--featured">
              ⭐ Featured
            </span>)}
          <span className="bundle-card__badge" style={{ background: diffConfig.bg, color: diffConfig.color }}>
            {diffConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bundle-card__content">
        <h3 className="win31-font bundle-card__title">{bundle.title}</h3>
        <p className="win31-font bundle-card__description">{bundle.description}</p>

        {/* Skill count */}
        <div className="bundle-card__skill-count">
          <span className="bundle-card__skill-count-icon">🔧</span>
          <span>
            {requiredSkills.length} skills
            {optionalSkills.length > 0 && " (+".concat(optionalSkills.length, " optional)")}
          </span>
        </div>

        {/* Estimated cost */}
        <div className="bundle-card__cost">
          <span className="bundle-card__cost-label">Est. cost:</span>
          <span className="bundle-card__cost-value">
            ~${bundle.estimatedCost.usd.toFixed(2)}/run
          </span>
        </div>

        {/* Tags */}
        {bundle.tags && bundle.tags.length > 0 && (<div className="bundle-card__tags">
            <TagBadge_1.TagList tags={bundle.tags.filter(function (t) { return t !== 'featured'; })} maxTags={4} size="sm"/>
          </div>)}
      </div>

      {/* Install hint */}
      <div className="bundle-card__install-hint">
        Click to install bundle
      </div>
    </div>);
}

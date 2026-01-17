"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChangelogPreview;
var react_1 = require("react");
var changelog_json_1 = require("../../data/changelog.json");
require("./styles.css");
var changelog = changelog_json_1.default;
var TYPE_ICONS = {
    feat: '✨',
    fix: '🔧',
    add: '➕',
    perf: '⚡',
    refactor: '♻️',
    other: '📝',
};
var CATEGORY_COLORS = {
    skills: 'var(--win31-lime)',
    ui: 'var(--win31-bright-cyan)',
    features: 'var(--win31-bright-yellow)',
    fixes: 'var(--win31-bright-magenta)',
    performance: 'var(--win31-bright-green)',
    infra: 'var(--win31-gray)',
    other: '#888',
};
function formatDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    var now = new Date();
    var diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return 'Today';
    if (diffDays === 1)
        return 'Yesterday';
    if (diffDays < 7)
        return "".concat(diffDays, " days ago");
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function ChangelogPreview() {
    // Get recent items (last 7 items across all days)
    var recentItems = [];
    for (var _i = 0, _a = changelog.entries; _i < _a.length; _i++) {
        var entry = _a[_i];
        for (var _b = 0, _c = entry.items; _b < _c.length; _b++) {
            var item = _c[_b];
            if (recentItems.length >= 7)
                break;
            recentItems.push(__assign(__assign({}, item), { formattedDate: formatDate(entry.date) }));
        }
        if (recentItems.length >= 7)
            break;
    }
    return (<div className="win31-window changelog-preview">
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
          {recentItems.map(function (item, idx) { return (<li key={"".concat(item.hash, "-").concat(idx)} className="changelog-preview__item">
              <span className="changelog-preview__icon">
                {TYPE_ICONS[item.type] || TYPE_ICONS.other}
              </span>
              <span className="changelog-preview__desc">
                {item.scope && (<span className="changelog-preview__scope" style={{ borderColor: CATEGORY_COLORS[item.category] }}>
                    {item.scope}
                  </span>)}
                {item.description}
                {item.skillCount && (<span className="changelog-preview__skill-count">
                    +{item.skillCount}
                  </span>)}
              </span>
              <span className="changelog-preview__date">{item.formattedDate}</span>
            </li>); })}
        </ul>
      </div>
    </div>);
}

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
exports.default = Changelog;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Head_1 = require("@docusaurus/Head");
var changelog_json_1 = require("../data/changelog.json");
require("../css/win31.css");
var changelog = changelog_json_1.default;
var TYPE_ICONS = {
    feat: '✨',
    fix: '🔧',
    add: '➕',
    perf: '⚡',
    refactor: '♻️',
    other: '📝',
};
var TYPE_LABELS = {
    feat: 'Feature',
    fix: 'Fix',
    add: 'Addition',
    perf: 'Performance',
    refactor: 'Refactor',
    other: 'Other',
};
var CATEGORY_COLORS = {
    skills: '#00ff00',
    ui: '#00ffff',
    features: '#ffff00',
    fixes: '#ff00ff',
    performance: '#00cc00',
    infra: '#888888',
    other: '#aaaaaa',
};
var CATEGORY_LABELS = {
    skills: 'Skills',
    ui: 'UI/UX',
    features: 'Features',
    fixes: 'Bug Fixes',
    performance: 'Performance',
    infra: 'Infrastructure',
    other: 'Other',
};
function formatDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
function formatRelativeDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    var now = new Date();
    var diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return 'Today';
    if (diffDays === 1)
        return 'Yesterday';
    if (diffDays < 7)
        return "".concat(diffDays, " days ago");
    if (diffDays < 30)
        return "".concat(Math.floor(diffDays / 7), " weeks ago");
    return "".concat(Math.floor(diffDays / 30), " months ago");
}
function Changelog() {
    var _a = (0, react_1.useState)('all'), filter = _a[0], setFilter = _a[1];
    var categories = __spreadArray(['all'], Object.keys(CATEGORY_LABELS), true);
    // Count items per category
    var categoryCounts = { all: 0 };
    for (var _i = 0, _b = changelog.entries; _i < _b.length; _i++) {
        var entry = _b[_i];
        for (var _c = 0, _d = entry.items; _c < _d.length; _c++) {
            var item = _d[_c];
            categoryCounts.all++;
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
    }
    // Filter entries
    var filteredEntries = changelog.entries
        .map(function (entry) { return (__assign(__assign({}, entry), { items: filter === 'all'
            ? entry.items
            : entry.items.filter(function (item) { return item.category === filter; }) })); })
        .filter(function (entry) { return entry.items.length > 0; });
    return (<Layout_1.default title="Changelog" description="See what's new in Some Claude Skills - new skills, features, and improvements">
      <Head_1.default>
        <meta name="robots" content="noindex"/>
      </Head_1.default>
      <div className="skills-page-bg page-backsplash page-backsplash--changelog page-backsplash--medium">
        <div className="skills-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          {/* Header */}
          <div className="win31-window" style={{ marginBottom: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">CHANGELOG.TXT</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">▲</div>
                <div className="win31-btn-3d win31-btn-3d--small">▼</div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', marginBottom: '8px' }}>Changelog</h1>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {changelog.totalEntries} updates since November 2025 •
                Last generated: {new Date(changelog.generated).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="win31-window" style={{ marginBottom: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">FILTER</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">□</div>
              </div>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(function (cat) { return (<button key={cat} onClick={function () { return setFilter(cat); }} className="win31-btn-3d" style={{
                background: filter === cat ? (cat === 'all' ? '#333' : CATEGORY_COLORS[cat]) : 'var(--win31-gray)',
                color: filter === cat ? (cat === 'all' || ['ui', 'features'].includes(cat) ? '#000' : '#fff') : '#333',
                fontWeight: filter === cat ? 'bold' : 'normal',
                fontSize: '11px',
                padding: '6px 12px',
                fontFamily: 'var(--font-code)',
            }}>
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                  <span style={{
                marginLeft: '6px',
                opacity: 0.7,
                fontSize: '10px',
            }}>
                    ({categoryCounts[cat] || 0})
                  </span>
                </button>); })}
            </div>
          </div>

          {/* Changelog entries */}
          {filteredEntries.map(function (entry) { return (<div key={entry.date} className="win31-window" style={{ marginBottom: '16px' }}>
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">{entry.date}</span>
                <div className="win31-titlebar__right">
                  <span style={{ fontSize: '11px', marginRight: '8px', opacity: 0.8 }}>
                    {formatRelativeDate(entry.date)}
                  </span>
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                fontFamily: 'var(--font-code)',
            }}>
                  {formatDate(entry.date)} • {entry.items.length} update{entry.items.length !== 1 ? 's' : ''}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {entry.items.map(function (item, idx) { return (<li key={"".concat(item.hash, "-").concat(idx)} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: idx < entry.items.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>
                        {TYPE_ICONS[item.type] || TYPE_ICONS.other}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                }}>
                          <span style={{
                    background: CATEGORY_COLORS[item.category],
                    color: ['skills', 'performance', 'infra', 'other'].includes(item.category) ? '#000' : '#000',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-code)',
                }}>
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                          <span style={{
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-code)',
                    color: '#666',
                }}>
                            {TYPE_LABELS[item.type] || item.type}
                          </span>
                          {item.scope && (<span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-code)',
                        color: '#888',
                    }}>
                              [{item.scope}]
                            </span>)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#333', lineHeight: 1.4 }}>
                          {item.description}
                          {item.skillCount && (<span style={{
                        display: 'inline-block',
                        background: 'var(--win31-lime)',
                        color: '#000',
                        padding: '2px 8px',
                        marginLeft: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-code)',
                    }}>
                              +{item.skillCount} skills
                            </span>)}
                        </div>
                      </div>
                      <a href={"https://github.com/erichowens/some_claude_skills/commit/".concat(item.hash)} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-code)',
                    color: '#888',
                    textDecoration: 'none',
                    flexShrink: 0,
                }} title="View commit on GitHub">
                        {item.hash}
                      </a>
                    </li>); })}
                </ul>
              </div>
            </div>); })}

          {/* Footer */}
          <div className="win31-statusbar" style={{ marginTop: '24px' }}>
            <div className="win31-statusbar-panel">
              {filteredEntries.reduce(function (sum, e) { return sum + e.items.length; }, 0)} items shown
            </div>
            <div className="win31-statusbar-panel">
              <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout_1.default>);
}

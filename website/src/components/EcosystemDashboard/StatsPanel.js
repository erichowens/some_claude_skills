"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatsPanel;
var react_1 = require("react");
var styles_module_css_1 = require("./styles.module.css");
function StatsPanel(_a) {
    var totalAgents = _a.totalAgents, totalSkills = _a.totalSkills, totalTools = _a.totalTools, toolUsage = _a.toolUsage, domainCoverage = _a.domainCoverage;
    // Top 5 most used tools
    var topTools = Object.entries(toolUsage)
        .sort(function (_a, _b) {
        var a = _a[1];
        var b = _b[1];
        return b - a;
    })
        .slice(0, 5);
    return (<div className="win31-window" style={{ marginBottom: '24px' }}>
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">ECOSYSTEM.SYS - Overview</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">□</div>
        </div>
      </div>

      <div className={styles_module_css_1.default.statsGrid}>
        {/* Summary Stats */}
        <div className={styles_module_css_1.default.statBox}>
          <div className={styles_module_css_1.default.statLabel}>Agents</div>
          <div className={styles_module_css_1.default.statValue} style={{ color: 'var(--win31-navy)' }}>
            {totalAgents}
          </div>
          <div className={styles_module_css_1.default.statSubtext}>Meta-coordinators</div>
        </div>

        <div className={styles_module_css_1.default.statBox}>
          <div className={styles_module_css_1.default.statLabel}>Skills</div>
          <div className={styles_module_css_1.default.statValue} style={{ color: 'var(--win31-teal)' }}>
            {totalSkills}
          </div>
          <div className={styles_module_css_1.default.statSubtext}>Domain experts</div>
        </div>

        <div className={styles_module_css_1.default.statBox}>
          <div className={styles_module_css_1.default.statLabel}>Tools</div>
          <div className={styles_module_css_1.default.statValue} style={{ color: '#f59e0b' }}>
            {totalTools}
          </div>
          <div className={styles_module_css_1.default.statSubtext}>Unique capabilities</div>
        </div>

        {/* Top Tools */}
        <div className={styles_module_css_1.default.statBox} style={{ gridColumn: 'span 2' }}>
          <div className={styles_module_css_1.default.statLabel}>Most Used Tools</div>
          <div className={styles_module_css_1.default.toolList}>
            {topTools.map(function (_a) {
            var tool = _a[0], count = _a[1];
            return (<div key={tool} className={styles_module_css_1.default.toolItem}>
                <span className={styles_module_css_1.default.toolName}>{tool}</span>
                <div className={styles_module_css_1.default.toolBar}>
                  <div className={styles_module_css_1.default.toolBarFill} style={{ width: "".concat((count / topTools[0][1]) * 100, "%") }}/>
                  <span className={styles_module_css_1.default.toolCount}>{count}</span>
                </div>
              </div>);
        })}
          </div>
        </div>

        {/* Domain Coverage Heatmap */}
        <div className={styles_module_css_1.default.statBox} style={{ gridColumn: 'span 3' }}>
          <div className={styles_module_css_1.default.statLabel}>Domain Coverage</div>
          <div className={styles_module_css_1.default.heatmapGrid}>
            {domainCoverage.map(function (_a) {
            var domain = _a.domain, count = _a.count;
            return (<div key={domain} className={styles_module_css_1.default.heatmapCell}>
                <div className={styles_module_css_1.default.heatmapLabel}>{domain}</div>
                <div className={styles_module_css_1.default.heatmapValue}>{count}</div>
              </div>);
        })}
          </div>
        </div>
      </div>
    </div>);
}

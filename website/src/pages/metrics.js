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
exports.default = MetricsPage;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Head_1 = require("@docusaurus/Head");
var ecosystem_state_json_1 = require("../data/ecosystem-state.json");
var skillMetadata_json_1 = require("../data/skillMetadata.json");
require("../css/win31.css");
require("../css/backsplash.css");
function MetricsPage() {
    // Calculate aggregate metrics
    var metrics = (0, react_1.useMemo)(function () {
        var skills = Object.values(skillMetadata_json_1.default.skills);
        var totalLines = skills.reduce(function (sum, skill) { return sum + skill.totalLines; }, 0);
        var totalFiles = skills.reduce(function (sum, skill) { return sum + skill.totalFiles; }, 0);
        var avgLinesPerSkill = Math.round(totalLines / skills.length);
        var avgFilesPerSkill = (totalFiles / skills.length).toFixed(1);
        var withReferences = skills.filter(function (s) { return s.hasReferences; }).length;
        var withExamples = skills.filter(function (s) { return s.hasExamples; }).length;
        var withChangelog = skills.filter(function (s) { return s.hasChangelog; }).length;
        // Sort by most recent updates
        var recentlyUpdated = __spreadArray([], skills, true).sort(function (a, b) { return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); })
            .slice(0, 5);
        // Sort by size (total lines)
        var largestSkills = __spreadArray([], skills, true).sort(function (a, b) { return b.totalLines - a.totalLines; })
            .slice(0, 5);
        // Calculate creation dates to track growth
        var skillsByMonth = skills.reduce(function (acc, skill) {
            var month = new Date(skill.createdAt).toISOString().substring(0, 7); // YYYY-MM
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
        return {
            totalSkills: skills.length,
            totalLines: totalLines,
            totalFiles: totalFiles,
            avgLinesPerSkill: avgLinesPerSkill,
            avgFilesPerSkill: avgFilesPerSkill,
            withReferences: withReferences,
            withExamples: withExamples,
            withChangelog: withChangelog,
            recentlyUpdated: recentlyUpdated,
            largestSkills: largestSkills,
            skillsByMonth: skillsByMonth,
        };
    }, []);
    return (<Layout_1.default title="Ecosystem Metrics" description="Growth metrics and statistics for the Claude Skills ecosystem">
      <Head_1.default>
        <meta name="keywords" content="metrics, statistics, Claude skills, ecosystem growth, code metrics"/>
      </Head_1.default>

      <div className="page-backsplash page-backsplash--metrics page-backsplash--medium" style={{
            background: '#0f172a',
            minHeight: '100vh',
            paddingTop: '60px'
        }}>
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px 24px 24px'
        }}>
          {/* Page Header */}
          <div className="win31-window" style={{ marginBottom: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">METRICS.EXE - Ecosystem Statistics</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">□</div>
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--win31-gray)' }}>
              <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '48px',
            margin: '0 0 12px 0',
            color: 'var(--win31-navy)'
        }}>
                Ecosystem Metrics
              </h1>

              <p style={{
            fontFamily: 'var(--font-code)',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#333',
            margin: 0
        }}>
                Real-time statistics and growth metrics for the Claude Skills ecosystem.
                Track skills development, code volume, documentation quality, and agent coordination patterns.
              </p>
            </div>
          </div>

          {/* Overview Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
        }}>
            {/* Total Skills */}
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">SKILLS.SYS</span>
              </div>
              <div style={{ padding: '20px', background: 'var(--win31-gray)', textAlign: 'center' }}>
                <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'var(--win31-blue)',
            fontFamily: 'var(--font-code)'
        }}>
                  {metrics.totalSkills}
                </div>
                <div style={{
            fontSize: '14px',
            color: '#666',
            fontFamily: 'var(--font-code)',
            marginTop: '8px'
        }}>
                  Total Skills
                </div>
              </div>
            </div>

            {/* Total Agents */}
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">AGENTS.SYS</span>
              </div>
              <div style={{ padding: '20px', background: 'var(--win31-gray)', textAlign: 'center' }}>
                <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#6366f1',
            fontFamily: 'var(--font-code)'
        }}>
                  {ecosystem_state_json_1.default.summary.total_agents}
                </div>
                <div style={{
            fontSize: '14px',
            color: '#666',
            fontFamily: 'var(--font-code)',
            marginTop: '8px'
        }}>
                  Active Agents
                </div>
              </div>
            </div>

            {/* Total Lines */}
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">CODE.SYS</span>
              </div>
              <div style={{ padding: '20px', background: 'var(--win31-gray)', textAlign: 'center' }}>
                <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#10b981',
            fontFamily: 'var(--font-code)'
        }}>
                  {(metrics.totalLines / 1000).toFixed(1)}k
                </div>
                <div style={{
            fontSize: '14px',
            color: '#666',
            fontFamily: 'var(--font-code)',
            marginTop: '8px'
        }}>
                  Lines of Code
                </div>
              </div>
            </div>

            {/* Unique Tools */}
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">TOOLS.SYS</span>
              </div>
              <div style={{ padding: '20px', background: 'var(--win31-gray)', textAlign: 'center' }}>
                <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#f59e0b',
            fontFamily: 'var(--font-code)'
        }}>
                  {ecosystem_state_json_1.default.summary.unique_tools}
                </div>
                <div style={{
            fontSize: '14px',
            color: '#666',
            fontFamily: 'var(--font-code)',
            marginTop: '8px'
        }}>
                  Unique Tools
                </div>
              </div>
            </div>
          </div>

          {/* Two column layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
        }}>
            {/* Code Quality Metrics */}
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">QUALITY.RPT</span>
                <div className="win31-titlebar__right">
                  <div className="win31-btn-3d win31-btn-3d--small">▼</div>
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--win31-gray)' }}>
                <h3 style={{
            fontFamily: 'var(--font-system)',
            fontSize: '16px',
            margin: '0 0 16px 0',
            color: 'var(--win31-navy)'
        }}>
                  Code Quality
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#333' }}>
                      Avg Lines per Skill
                    </span>
                    <span style={{
            fontFamily: 'var(--font-code)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--win31-navy)'
        }}>
                      {metrics.avgLinesPerSkill}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#333' }}>
                      Avg Files per Skill
                    </span>
                    <span style={{
            fontFamily: 'var(--font-code)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--win31-navy)'
        }}>
                      {metrics.avgFilesPerSkill}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#333' }}>
                      With References
                    </span>
                    <span style={{
            fontFamily: 'var(--font-code)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#10b981'
        }}>
                      {metrics.withReferences} ({Math.round(metrics.withReferences / metrics.totalSkills * 100)}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#333' }}>
                      With Examples
                    </span>
                    <span style={{
            fontFamily: 'var(--font-code)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#10b981'
        }}>
                      {metrics.withExamples} ({Math.round(metrics.withExamples / metrics.totalSkills * 100)}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#333' }}>
                      With Changelog
                    </span>
                    <span style={{
            fontFamily: 'var(--font-code)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#10b981'
        }}>
                      {metrics.withChangelog} ({Math.round(metrics.withChangelog / metrics.totalSkills * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Tools */}
            <div className="win31-window">
              <div className="win31-titlebar">
                <div className="win31-titlebar__left">
                  <div className="win31-btn-3d win31-btn-3d--small">─</div>
                </div>
                <span className="win31-title-text">TOP-TOOLS.DAT</span>
                <div className="win31-titlebar__right">
                  <div className="win31-btn-3d win31-btn-3d--small">▼</div>
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--win31-gray)' }}>
                <h3 style={{
            fontFamily: 'var(--font-system)',
            fontSize: '16px',
            margin: '0 0 16px 0',
            color: 'var(--win31-navy)'
        }}>
                  Most Used Tools
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(ecosystem_state_json_1.default.tool_usage)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 8)
            .map(function (_a, index) {
            var tool = _a[0], count = _a[1];
            return (<div key={tool} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                        <div style={{
                    minWidth: '24px',
                    height: '20px',
                    background: index < 3 ? 'var(--win31-lime)' : 'var(--win31-light-gray)',
                    color: index < 3 ? '#000' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-code)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '1px solid #808080'
                }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                    background: '#000',
                    height: '20px',
                    width: "".concat(count / ecosystem_state_json_1.default.tool_usage.Read * 100, "%"),
                    minWidth: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '6px'
                }}>
                            <span style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: '11px',
                    color: 'var(--win31-lime)',
                    fontWeight: 'bold'
                }}>
                              {tool}
                            </span>
                          </div>
                        </div>
                        <div style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'var(--win31-navy)',
                    minWidth: '30px',
                    textAlign: 'right'
                }}>
                          {count}
                        </div>
                      </div>);
        })}
                </div>
              </div>
            </div>
          </div>

          {/* Recently Updated Skills */}
          <div className="win31-window" style={{ marginBottom: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">RECENT.LOG - Last Updated</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">▼</div>
              </div>
            </div>
            <div style={{ padding: '20px', background: 'var(--win31-gray)' }}>
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
        }}>
                {metrics.recentlyUpdated.map(function (skill) { return (<a key={skill.id} href={"/docs/skills/".concat(skill.id.replace(/-/g, '_'))} style={{
                display: 'block',
                background: '#fff',
                border: '2px solid #808080',
                padding: '12px',
                textDecoration: 'none',
                color: 'inherit'
            }}>
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--win31-navy)',
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                      {skill.id}
                    </div>
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '10px',
                color: '#666'
            }}>
                      Updated: {new Date(skill.updatedAt).toLocaleDateString()}
                    </div>
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '10px',
                color: '#999',
                marginTop: '4px'
            }}>
                      {skill.totalLines} lines · {skill.totalFiles} files
                    </div>
                  </a>); })}
              </div>
            </div>
          </div>

          {/* Largest Skills */}
          <div className="win31-window" style={{ marginBottom: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">BIGFILE.DAT - Largest Skills</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">▼</div>
              </div>
            </div>
            <div style={{ padding: '20px', background: 'var(--win31-gray)' }}>
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
        }}>
                {metrics.largestSkills.map(function (skill, index) { return (<a key={skill.id} href={"/docs/skills/".concat(skill.id.replace(/-/g, '_'))} style={{
                display: 'block',
                background: index === 0 ? '#fff5cc' : '#fff',
                border: index === 0 ? '2px solid var(--win31-bright-yellow)' : '2px solid #808080',
                padding: '12px',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative'
            }}>
                    {index === 0 && (<div style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '8px',
                    background: 'var(--win31-bright-yellow)',
                    color: '#000',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-code)'
                }}>
                        LARGEST
                      </div>)}
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--win31-navy)',
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                      {skill.id}
                    </div>
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '14px',
                color: '#10b981',
                fontWeight: 'bold'
            }}>
                      {skill.totalLines.toLocaleString()} lines
                    </div>
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '10px',
                color: '#666',
                marginTop: '4px'
            }}>
                      {skill.totalFiles} files · {(skill.skillMdSize / 1024).toFixed(1)}KB
                    </div>
                  </a>); })}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="win31-window">
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">INFO.TXT</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">▼</div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
              <p style={{
            fontFamily: 'var(--font-code)',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#333',
            margin: 0
        }}>
                <strong>Data Sources:</strong> Metrics are calculated from skill metadata, ecosystem state data,
                and git history. Updated automatically during build. Generated: {new Date(skillMetadata_json_1.default.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout_1.default>);
}

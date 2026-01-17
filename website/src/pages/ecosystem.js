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
exports.default = EcosystemPage;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Head_1 = require("@docusaurus/Head");
var skillMetadata_json_1 = require("../data/skillMetadata.json");
require("../css/win31.css");
require("../css/backsplash.css");
var agents = [
    { id: 'architect', name: 'The Architect', role: 'Meta-Orchestrator of Combinatorial Genius', emoji: '🏛️', description: 'Designs new agents and orchestrates complex multi-agent workflows' },
    { id: 'archivist', name: 'The Archivist', role: 'Keeper of History and Documentation', emoji: '📜', description: 'Documents ecosystem progress, maintains changelogs and snapshots' },
    { id: 'auditor', name: 'The Auditor', role: 'Quality Assurance & Code Review Specialist', emoji: '🔍', description: 'Reviews code quality, enforces standards, identifies issues' },
    { id: 'cartographer', name: 'The Cartographer', role: 'Explorer of Adjacent Knowledge Space', emoji: '🗺️', description: 'Maps knowledge domains, finds gaps, charts expansion paths' },
    { id: 'debugger', name: 'The Debugger', role: 'Expert Troubleshooter & Root Cause Analyst', emoji: '🐛', description: 'Investigates bugs, traces issues, provides fix recommendations' },
    { id: 'guardian', name: 'The Guardian', role: 'Security & Compliance Specialist', emoji: '🛡️', description: 'Protects against vulnerabilities, ensures security best practices' },
    { id: 'liaison', name: 'The Liaison', role: 'Human Interface and Informant', emoji: '🎙️', description: 'Communicates ecosystem status, bridges agents and humans' },
    { id: 'librarian', name: 'The Librarian', role: 'Content Curator with Rights Awareness', emoji: '📚', description: 'Curates content, tracks licenses, maintains attribution' },
    { id: 'optimizer', name: 'The Optimizer', role: 'Performance & Efficiency Expert', emoji: '⚡', description: 'Profiles performance, identifies bottlenecks, tunes systems' },
    { id: 'researcher', name: 'The Researcher', role: 'Deep Research & Knowledge Synthesis Expert', emoji: '🔬', description: 'Conducts deep research, synthesizes findings, compares options' },
    { id: 'scout', name: 'The Scout', role: 'External Intelligence Gatherer', emoji: '🔭', description: 'Monitors trends, gathers external inspiration, tracks community' },
    { id: 'smith', name: 'The Smith', role: 'Builder of Infrastructure', emoji: '⚒️', description: 'Builds MCP servers, CLI tools, validation scripts, infrastructure' },
    { id: 'visualizer', name: 'The Visualizer', role: 'Builder of Portals', emoji: '🔮', description: 'Creates dashboards, knowledge graphs, monitoring interfaces' },
    { id: 'weaver', name: 'The Weaver', role: 'RAG Specialist', emoji: '🕸️', description: 'Implements embeddings, vector stores, semantic search systems' },
];
// Council documents available
var councilDocs = [
    {
        id: 'decisions',
        title: 'Council Decisions',
        description: 'Architectural decisions and governance records',
        path: '/docs/council/decisions',
        icon: '📋'
    },
    {
        id: 'snapshots',
        title: 'Ecosystem Snapshots',
        description: 'Point-in-time ecosystem state captures',
        path: '/docs/council/snapshots',
        icon: '📸'
    },
    {
        id: 'liaison-reports',
        title: 'Liaison Reports',
        description: 'Human interface agent communications',
        path: '/docs/council/liaison-reports',
        icon: '📨'
    },
    {
        id: 'index',
        title: 'Council Overview',
        description: 'Introduction to the Council of Agents',
        path: '/docs/council/',
        icon: '🏛️'
    }
];
// Group skills by creation date
function groupSkillsByDate(skills) {
    var groups = new Map();
    Object.values(skills).forEach(function (skill) {
        var _a, _b;
        var date = (_b = (_a = skill.createdAt) === null || _a === void 0 ? void 0 : _a.split('T')[0]) !== null && _b !== void 0 ? _b : 'Unknown';
        if (!groups.has(date)) {
            groups.set(date, []);
        }
        groups.get(date).push(skill);
    });
    // Sort by date descending
    return new Map(__spreadArray([], groups.entries(), true).sort(function (a, b) { return b[0].localeCompare(a[0]); }));
}
// Format date for display
function formatDate(dateStr) {
    var date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
// Stats calculation
function calculateStats(skills) {
    var skillList = Object.values(skills);
    var totalLines = skillList.reduce(function (sum, s) { return sum + s.totalLines; }, 0);
    var withChangelog = skillList.filter(function (s) { return s.hasChangelog; }).length;
    var withReferences = skillList.filter(function (s) { return s.hasReferences; }).length;
    var withExamples = skillList.filter(function (s) { return s.hasExamples; }).length;
    var dates = skillList.map(function (s) { return new Date(s.createdAt).getTime(); });
    var earliest = new Date(Math.min.apply(Math, dates));
    var latest = new Date(Math.max.apply(Math, dates));
    return {
        totalSkills: skillList.length,
        totalLines: totalLines,
        withChangelog: withChangelog,
        withReferences: withReferences,
        withExamples: withExamples,
        earliest: earliest,
        latest: latest,
        avgLinesPerSkill: Math.round(totalLines / skillList.length)
    };
}
function EcosystemPage() {
    var _a = (0, react_1.useState)('timeline'), selectedView = _a[0], setSelectedView = _a[1];
    var _b = (0, react_1.useState)(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var skills = skillMetadata_json_1.default.skills;
    var stats = (0, react_1.useMemo)(function () { return calculateStats(skills); }, [skills]);
    var groupedSkills = (0, react_1.useMemo)(function () { return groupSkillsByDate(skills); }, [skills]);
    // Filter skills by search term
    var filteredGroups = (0, react_1.useMemo)(function () {
        if (!searchTerm.trim())
            return groupedSkills;
        var term = searchTerm.toLowerCase();
        var filtered = new Map();
        groupedSkills.forEach(function (skillList, date) {
            var matching = skillList.filter(function (s) { return s.id.toLowerCase().includes(term); });
            if (matching.length > 0) {
                filtered.set(date, matching);
            }
        });
        return filtered;
    }, [groupedSkills, searchTerm]);
    return (<Layout_1.default title="Ecosystem Dashboard" description="Skills timeline, council documents, and ecosystem metrics">
      <Head_1.default>
        <meta name="keywords" content="skills, timeline, council, documentation, ecosystem"/>
      </Head_1.default>

      <div className="page-backsplash page-backsplash--ecosystem page-backsplash--medium" style={{
            background: '#0f172a',
            minHeight: '100vh',
            paddingTop: '60px'
        }}>
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px 24px 24px'
        }}>
          {/* Header */}
          <div className="win31-window" style={{ marginBottom: '24px' }}>
            <div className="win31-titlebar">
              <div className="win31-titlebar__left">
                <div className="win31-btn-3d win31-btn-3d--small">─</div>
              </div>
              <span className="win31-title-text">ECOSYSTEM.EXE - Knowledge Center</span>
              <div className="win31-titlebar__right">
                <div className="win31-btn-3d win31-btn-3d--small">□</div>
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--win31-gray)' }}>
              <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '36px',
            margin: '0 0 12px 0',
            color: 'var(--win31-navy)'
        }}>
                Ecosystem Dashboard
              </h1>

              <p style={{
            fontFamily: 'var(--font-code)',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#333',
            margin: '0 0 16px 0'
        }}>
                Historical ledger of {stats.totalSkills} skills, council documentation, and ecosystem metrics.
                From {formatDate(stats.earliest.toISOString())} to {formatDate(stats.latest.toISOString())}.
              </p>

              {/* Quick Stats */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
        }}>
                <StatBox label="Total Skills" value={stats.totalSkills}/>
                <StatBox label="Total Lines" value={stats.totalLines.toLocaleString()}/>
                <StatBox label="With Changelog" value={"".concat(stats.withChangelog, " (").concat(Math.round(stats.withChangelog / stats.totalSkills * 100), "%)")}/>
                <StatBox label="With References" value={"".concat(stats.withReferences, " (").concat(Math.round(stats.withReferences / stats.totalSkills * 100), "%)")}/>
              </div>
            </div>
          </div>

          {/* View Selector */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            padding: '8px',
            background: 'var(--win31-gray)',
            border: '2px solid var(--win31-black)'
        }}>
            <ViewButton label="📅 Skills Timeline" active={selectedView === 'timeline'} onClick={function () { return setSelectedView('timeline'); }}/>
            <ViewButton label="🤖 Council Agents" active={selectedView === 'agents'} onClick={function () { return setSelectedView('agents'); }}/>
            <ViewButton label="📚 Council Documents" active={selectedView === 'documents'} onClick={function () { return setSelectedView('documents'); }}/>
            <ViewButton label="📊 Detailed Stats" active={selectedView === 'stats'} onClick={function () { return setSelectedView('stats'); }}/>
          </div>

          {/* Content Area */}
          {selectedView === 'timeline' && (<SkillsTimeline groupedSkills={filteredGroups} searchTerm={searchTerm} onSearchChange={setSearchTerm}/>)}

          {selectedView === 'agents' && (<AgentsGallery agents={agents}/>)}

          {selectedView === 'documents' && (<DocumentBrowser docs={councilDocs}/>)}

          {selectedView === 'stats' && (<DetailedStats skills={skills} stats={stats}/>)}
        </div>
      </div>
    </Layout_1.default>);
}
// Stat Box Component
function StatBox(_a) {
    var label = _a.label, value = _a.value;
    return (<div style={{
            background: '#fff',
            border: '2px solid var(--win31-dark-gray)',
            padding: '12px',
            boxShadow: 'inset -1px -1px 0 var(--win31-dark-gray)'
        }}>
      <div style={{
            fontFamily: 'var(--font-system)',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--win31-dark-gray)',
            marginBottom: '4px'
        }}>
        {label}
      </div>
      <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--win31-navy)'
        }}>
        {value}
      </div>
    </div>);
}
// View Button Component
function ViewButton(_a) {
    var label = _a.label, active = _a.active, onClick = _a.onClick;
    return (<button onClick={onClick} style={{
            background: active ? 'var(--win31-navy)' : 'var(--win31-gray)',
            color: active ? 'white' : 'var(--win31-black)',
            border: active ? '2px inset var(--win31-white)' : '2px outset var(--win31-white)',
            padding: '8px 16px',
            fontFamily: 'var(--font-system)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
        }}>
      {label}
    </button>);
}
// Skills Timeline Component
function SkillsTimeline(_a) {
    var groupedSkills = _a.groupedSkills, searchTerm = _a.searchTerm, onSearchChange = _a.onSearchChange;
    return (<div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">TIMELINE.DAT - Skills Creation History</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">▼</div>
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input type="text" placeholder="Search skills by name..." value={searchTerm} onChange={function (e) { return onSearchChange(e.target.value); }} style={{
            width: '100%',
            padding: '8px 12px',
            fontFamily: 'var(--font-code)',
            fontSize: '12px',
            border: '2px inset var(--win31-gray)',
            background: 'white'
        }}/>
        </div>

        {/* Timeline */}
        <div style={{
            maxHeight: '600px',
            overflowY: 'auto',
            border: '2px inset var(--win31-dark-gray)',
            background: 'white',
            padding: '16px'
        }}>
          {Array.from(groupedSkills.entries()).map(function (_a) {
            var date = _a[0], skills = _a[1];
            return (<div key={date} style={{ marginBottom: '24px' }}>
              {/* Date Header */}
              <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    borderBottom: '2px solid var(--win31-dark-gray)',
                    paddingBottom: '8px'
                }}>
                <div style={{
                    background: 'var(--win31-navy)',
                    color: 'white',
                    padding: '4px 12px',
                    fontFamily: 'var(--font-system)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                  {formatDate(date)}
                </div>
                <span style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: '11px',
                    color: '#666'
                }}>
                  {skills.length} skill{skills.length > 1 ? 's' : ''} created
                </span>
              </div>

              {/* Skills */}
              <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '8px'
                }}>
                {skills.map(function (skill) { return (<a key={skill.id} href={"/docs/skills/".concat(skill.id.replace(/-/g, '_'))} style={{
                        display: 'block',
                        padding: '12px',
                        background: 'var(--win31-light-gray)',
                        border: '1px solid var(--win31-dark-gray)',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                    }} onMouseEnter={function (e) {
                        e.currentTarget.style.background = 'var(--win31-navy)';
                        e.currentTarget.style.color = 'white';
                    }} onMouseLeave={function (e) {
                        e.currentTarget.style.background = 'var(--win31-light-gray)';
                        e.currentTarget.style.color = 'inherit';
                    }}>
                    <div style={{
                        fontFamily: 'var(--font-system)',
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: 'inherit'
                    }}>
                      {skill.id}
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-code)'
                    }}>
                      <span>{skill.totalLines} lines</span>
                      <span>•</span>
                      <span>{skill.totalFiles} files</span>
                      {skill.hasChangelog && <span>• 📝</span>}
                      {skill.hasReferences && <span>• 📚</span>}
                    </div>
                  </a>); })}
              </div>
            </div>);
        })}

          {groupedSkills.size === 0 && (<div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                fontFamily: 'var(--font-code)'
            }}>
              No skills found matching "{searchTerm}"
            </div>)}
        </div>
      </div>
    </div>);
}
// Document Browser Component
function DocumentBrowser(_a) {
    var docs = _a.docs;
    return (<div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">DOCS.EXE - Council Documentation Browser</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">▼</div>
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
        <p style={{
            fontFamily: 'var(--font-code)',
            fontSize: '12px',
            color: '#333',
            marginBottom: '16px'
        }}>
          Browse the Council of Agents documentation. These documents capture decisions,
          snapshots, and communications from the agentic ecosystem.
        </p>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
        }}>
          {docs.map(function (doc) { return (<a key={doc.id} href={doc.path} style={{
                display: 'block',
                background: 'white',
                border: '2px solid var(--win31-dark-gray)',
                padding: '16px',
                textDecoration: 'none',
                transition: 'all 0.2s'
            }} onMouseEnter={function (e) {
                e.currentTarget.style.borderColor = 'var(--win31-navy)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }} onMouseLeave={function (e) {
                e.currentTarget.style.borderColor = 'var(--win31-dark-gray)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
            }}>
                <span style={{ fontSize: '32px' }}>{doc.icon}</span>
                <div style={{
                fontFamily: 'var(--font-system)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--win31-navy)'
            }}>
                  {doc.title}
                </div>
              </div>
              <p style={{
                fontFamily: 'var(--font-code)',
                fontSize: '12px',
                color: '#666',
                margin: 0,
                lineHeight: 1.5
            }}>
                {doc.description}
              </p>
            </a>); })}
        </div>

        {/* Archive Section */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{
            fontFamily: 'var(--font-system)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--win31-navy)',
            marginBottom: '12px'
        }}>
            Additional Resources
          </h3>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
        }}>
            <ResourceLink href="/skills" label="All Skills Gallery"/>
            <ResourceLink href="/artifacts" label="Artifacts & Examples"/>
            <ResourceLink href="/docs/intro" label="Getting Started"/>
            <ResourceLink href="/docs/guides/artifact-contribution-guide" label="Contribution Guide"/>
          </div>
        </div>
      </div>
    </div>);
}
// Resource Link Component
function ResourceLink(_a) {
    var href = _a.href, label = _a.label;
    return (<a href={href} style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'var(--win31-light-gray)',
            border: '2px outset var(--win31-white)',
            fontFamily: 'var(--font-system)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--win31-black)',
            textDecoration: 'none'
        }} onMouseEnter={function (e) {
            e.currentTarget.style.background = 'var(--win31-navy)';
            e.currentTarget.style.color = 'white';
        }} onMouseLeave={function (e) {
            e.currentTarget.style.background = 'var(--win31-light-gray)';
            e.currentTarget.style.color = 'var(--win31-black)';
        }}>
      {label}
    </a>);
}
// Detailed Stats Component
function DetailedStats(_a) {
    var skills = _a.skills, stats = _a.stats;
    var skillList = Object.values(skills);
    // Top 10 largest skills by lines
    var largestSkills = __spreadArray([], skillList, true).sort(function (a, b) { return b.totalLines - a.totalLines; })
        .slice(0, 10);
    // Most recently updated
    var recentlyUpdated = __spreadArray([], skillList, true).sort(function (a, b) { return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); })
        .slice(0, 10);
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary Stats */}
      <div className="win31-window">
        <div className="win31-titlebar">
          <div className="win31-titlebar__left">
            <div className="win31-btn-3d win31-btn-3d--small">─</div>
          </div>
          <span className="win31-title-text">STATS.DAT - Ecosystem Metrics</span>
          <div className="win31-titlebar__right">
            <div className="win31-btn-3d win31-btn-3d--small">▼</div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
        }}>
            <StatBox label="Total Skills" value={stats.totalSkills}/>
            <StatBox label="Total Lines of Code" value={stats.totalLines.toLocaleString()}/>
            <StatBox label="Avg Lines/Skill" value={stats.avgLinesPerSkill}/>
            <StatBox label="With Changelog" value={stats.withChangelog}/>
            <StatBox label="With References" value={stats.withReferences}/>
            <StatBox label="With Examples" value={stats.withExamples}/>
          </div>
        </div>
      </div>

      {/* Largest Skills */}
      <div className="win31-window">
        <div className="win31-titlebar">
          <div className="win31-titlebar__left">
            <div className="win31-btn-3d win31-btn-3d--small">─</div>
          </div>
          <span className="win31-title-text">TOP10.DAT - Largest Skills by Lines</span>
          <div className="win31-titlebar__right">
            <div className="win31-btn-3d win31-btn-3d--small">▼</div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }}>
            {largestSkills.map(function (skill, idx) { return (<div key={skill.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                background: idx % 2 === 0 ? 'white' : 'var(--win31-light-gray)'
            }}>
                <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--win31-navy)',
                width: '30px',
                textAlign: 'center'
            }}>
                  {idx + 1}
                </span>
                <a href={"/docs/skills/".concat(skill.id.replace(/-/g, '_'))} style={{
                flex: 1,
                fontFamily: 'var(--font-system)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--win31-navy)',
                textDecoration: 'none'
            }}>
                  {skill.id}
                </a>
                <div style={{
                flex: 1,
                height: '16px',
                background: 'var(--win31-light-gray)',
                border: '1px solid var(--win31-dark-gray)',
                position: 'relative'
            }}>
                  <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: "".concat((skill.totalLines / largestSkills[0].totalLines) * 100, "%"),
                background: 'linear-gradient(90deg, var(--win31-navy), var(--win31-teal))'
            }}/>
                </div>
                <span style={{
                fontFamily: 'var(--font-code)',
                fontSize: '11px',
                fontWeight: 'bold',
                width: '80px',
                textAlign: 'right'
            }}>
                  {skill.totalLines.toLocaleString()} lines
                </span>
              </div>); })}
          </div>
        </div>
      </div>

      {/* Recently Updated */}
      <div className="win31-window">
        <div className="win31-titlebar">
          <div className="win31-titlebar__left">
            <div className="win31-btn-3d win31-btn-3d--small">─</div>
          </div>
          <span className="win31-title-text">RECENT.DAT - Recently Updated Skills</span>
          <div className="win31-titlebar__right">
            <div className="win31-btn-3d win31-btn-3d--small">▼</div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '8px'
        }}>
            {recentlyUpdated.map(function (skill) { return (<a key={skill.id} href={"/docs/skills/".concat(skill.id.replace(/-/g, '_'))} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'white',
                border: '1px solid var(--win31-dark-gray)',
                textDecoration: 'none'
            }}>
                <span style={{
                fontFamily: 'var(--font-system)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--win31-navy)'
            }}>
                  {skill.id}
                </span>
                <span style={{
                fontFamily: 'var(--font-code)',
                fontSize: '10px',
                color: '#666'
            }}>
                  {formatDate(skill.updatedAt)}
                </span>
              </a>); })}
          </div>
        </div>
      </div>
    </div>);
}
// Agents Gallery Component
function AgentsGallery(_a) {
    var agents = _a.agents;
    return (<div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">AGENTS.EXE - Council of Agents</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">▼</div>
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--win31-gray)' }}>
        <p style={{
            fontFamily: 'var(--font-code)',
            fontSize: '12px',
            color: '#333',
            marginBottom: '16px'
        }}>
          The Council of Agents is a collaborative system of specialized AI agents, each with unique
          roles and capabilities. Together they form an emergent intelligence greater than the sum
          of their parts.
        </p>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
        }}>
          {agents.map(function (agent) { return (<div key={agent.id} style={{
                background: 'white',
                border: '2px solid var(--win31-dark-gray)',
                overflow: 'hidden',
                transition: 'all 0.2s'
            }} onMouseEnter={function (e) {
                e.currentTarget.style.borderColor = 'var(--win31-navy)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }} onMouseLeave={function (e) {
                e.currentTarget.style.borderColor = 'var(--win31-dark-gray)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}>
              {/* Hero Image */}
              <div style={{
                width: '100%',
                height: '160px',
                background: "url(/img/agents/".concat(agent.id, "-hero.png) center center / cover no-repeat"),
                borderBottom: '2px solid var(--win31-dark-gray)'
            }}/>

              {/* Content */}
              <div style={{ padding: '16px' }}>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
            }}>
                  <span style={{ fontSize: '24px' }}>{agent.emoji}</span>
                  <div>
                    <div style={{
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--win31-navy)'
            }}>
                      {agent.name}
                    </div>
                    <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: '10px',
                color: '#666'
            }}>
                      {agent.role}
                    </div>
                  </div>
                </div>
                <p style={{
                fontFamily: 'var(--font-code)',
                fontSize: '11px',
                color: '#333',
                margin: 0,
                lineHeight: 1.5
            }}>
                  {agent.description}
                </p>
              </div>
            </div>); })}
        </div>

        {/* Council Overview Link */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/docs/council/" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'var(--win31-navy)',
            color: 'white',
            fontFamily: 'var(--font-system)',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            border: '2px outset var(--win31-white)'
        }} onMouseEnter={function (e) {
            e.currentTarget.style.background = 'var(--win31-teal)';
        }} onMouseLeave={function (e) {
            e.currentTarget.style.background = 'var(--win31-navy)';
        }}>
            Read Council Overview →
          </a>
        </div>
      </div>
    </div>);
}

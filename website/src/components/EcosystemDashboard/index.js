"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EcosystemDashboard;
var react_1 = require("react");
var StatsPanel_1 = require("./StatsPanel");
var KnowledgeGraph_1 = require("./KnowledgeGraph");
var AgentCard_1 = require("./AgentCard");
var SkillGrid_1 = require("./SkillGrid");
var styles_module_css_1 = require("./styles.module.css");
function EcosystemDashboard(_a) {
    var data = _a.data;
    var _b = (0, react_1.useState)('graph'), selectedView = _b[0], setSelectedView = _b[1];
    var _c = (0, react_1.useState)(null), selectedAgent = _c[0], setSelectedAgent = _c[1];
    var _d = (0, react_1.useState)(null), selectedSkill = _d[0], setSelectedSkill = _d[1];
    // Calculate domain coverage heatmap data
    var domainCoverage = (0, react_1.useMemo)(function () {
        var domains = {
            'Computer Vision': ['clip-aware-embeddings', 'drone-cv-expert', 'drone-inspection-specialist',
                'photo-composition-critic', 'photo-content-recognition-curation-expert'],
            'Design & UI': ['web-design-expert', 'typography-expert', 'vaporwave-glassomorphic-ui-designer',
                'design-system-creator', 'native-app-designer', 'adhd-design-expert', 'collage-layout-expert'],
            'Audio & Music': ['sound-engineer', 'voice-audio-engineer', '2000s-visualization-expert',
                'speech-pathology-ai'],
            'Psychology & Wellness': ['jungian-psychologist', 'hrv-alexithymia-expert',
                'wisdom-accountability-coach', 'project-management-guru-adhd'],
            'Career & Business': ['career-biographer', 'cv-creator', 'job-application-optimizer',
                'competitive-cartographer', 'indie-monetization-strategist', 'tech-entrepreneur-coach-adhd'],
            'Development Tools': ['bot-developer', 'agent-creator', 'code-necromancer',
                'site-reliability-engineer', 'skill-coach', 'orchestrator']
        };
        return Object.entries(domains).map(function (_a) {
            var domain = _a[0], skillIds = _a[1];
            var matchingSkills = data.skills.filter(function (s) {
                return skillIds.some(function (id) { return s.name.includes(id); });
            });
            return {
                domain: domain,
                count: matchingSkills.length,
                percentage: (matchingSkills.length / skillIds.length) * 100
            };
        });
    }, [data.skills]);
    return (<div className={styles_module_css_1.default.dashboard}>
      {/* Stats Panel - Always visible at top */}
      <StatsPanel_1.default totalAgents={data.summary.total_agents} totalSkills={data.summary.total_skills} totalTools={data.summary.unique_tools} toolUsage={data.tool_usage} domainCoverage={domainCoverage}/>

      {/* View Selector */}
      <div className={styles_module_css_1.default.viewSelector}>
        <button className={"".concat(styles_module_css_1.default.viewButton, " ").concat(selectedView === 'graph' ? styles_module_css_1.default.active : '')} onClick={function () { return setSelectedView('graph'); }}>
          Knowledge Graph
        </button>
        <button className={"".concat(styles_module_css_1.default.viewButton, " ").concat(selectedView === 'agents' ? styles_module_css_1.default.active : '')} onClick={function () { return setSelectedView('agents'); }}>
          Agents ({data.summary.total_agents})
        </button>
        <button className={"".concat(styles_module_css_1.default.viewButton, " ").concat(selectedView === 'skills' ? styles_module_css_1.default.active : '')} onClick={function () { return setSelectedView('skills'); }}>
          Skills ({data.summary.total_skills})
        </button>
      </div>

      {/* Main Content Area */}
      <div className={styles_module_css_1.default.mainContent}>
        {selectedView === 'graph' && (<KnowledgeGraph_1.default nodes={data.capability_graph.nodes} edges={data.capability_graph.edges} onNodeClick={function (nodeId) {
                // Handle agent clicks
                var agent = data.agents.find(function (a) { return "agent:".concat(a.name) === nodeId; });
                if (agent) {
                    setSelectedSkill(null);
                    setSelectedAgent(agent);
                    return;
                }
                // Handle skill clicks
                var skill = data.skills.find(function (s) { return "skill:".concat(s.name) === nodeId; });
                if (skill) {
                    setSelectedAgent(null);
                    setSelectedSkill(skill);
                }
            }}/>)}

        {selectedView === 'agents' && (<div className={styles_module_css_1.default.agentGrid}>
            {data.agents.map(function (agent) { return (<AgentCard_1.default key={agent.name} agent={agent} onClick={function () { return setSelectedAgent(agent); }} isSelected={(selectedAgent === null || selectedAgent === void 0 ? void 0 : selectedAgent.name) === agent.name}/>); })}
          </div>)}

        {selectedView === 'skills' && (<SkillGrid_1.default skills={data.skills}/>)}
      </div>

      {/* Agent Detail Panel (slides in from right when selected) */}
      {selectedAgent && (<div className={styles_module_css_1.default.detailPanel}>
          <div className={styles_module_css_1.default.detailHeader}>
            <h2>{selectedAgent.name}</h2>
            <button className={styles_module_css_1.default.closeButton} onClick={function () { return setSelectedAgent(null); }}>
              ✕
            </button>
          </div>
          <div className={styles_module_css_1.default.detailContent}>
            <h3>{selectedAgent.role}</h3>
            <p>{selectedAgent.description}</p>

            <div className={styles_module_css_1.default.detailSection}>
              <h4>Tools ({selectedAgent.tools.length})</h4>
              <div className={styles_module_css_1.default.tagList}>
                {selectedAgent.tools.map(function (tool) { return (<span key={tool} className={styles_module_css_1.default.tag}>{tool}</span>); })}
              </div>
            </div>

            <div className={styles_module_css_1.default.detailSection}>
              <h4>Coordinates With</h4>
              <div className={styles_module_css_1.default.tagList}>
                {selectedAgent.coordinates_with.map(function (coord) { return (<span key={coord} className={"".concat(styles_module_css_1.default.tag, " ").concat(styles_module_css_1.default.tagAgent)} onClick={function () {
                    var agent = data.agents.find(function (a) { return a.name === coord; });
                    if (agent)
                        setSelectedAgent(agent);
                }}>
                    {coord}
                  </span>); })}
              </div>
            </div>

            <div className={styles_module_css_1.default.detailSection}>
              <h4>Triggers</h4>
              <div className={styles_module_css_1.default.tagList}>
                {selectedAgent.triggers.slice(0, 10).map(function (trigger) { return (<span key={trigger} className={"".concat(styles_module_css_1.default.tag, " ").concat(styles_module_css_1.default.tagTrigger)}>
                    "{trigger}"
                  </span>); })}
              </div>
            </div>
          </div>
        </div>)}

      {/* Skill Detail Panel (slides in from right when selected) */}
      {selectedSkill && (<div className={styles_module_css_1.default.detailPanel}>
          <div className={styles_module_css_1.default.detailHeader} style={{ background: '#10b981' }}>
            <h2>{selectedSkill.name}</h2>
            <button className={styles_module_css_1.default.closeButton} onClick={function () { return setSelectedSkill(null); }}>
              ✕
            </button>
          </div>
          <div className={styles_module_css_1.default.detailContent}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {selectedSkill.has_examples && (<span className={"".concat(styles_module_css_1.default.tag, " ").concat(styles_module_css_1.default.tagTrigger)}>Has Examples</span>)}
              {selectedSkill.has_references && (<span className={styles_module_css_1.default.tag}>Has References</span>)}
            </div>

            <p>{selectedSkill.description}</p>

            <div className={styles_module_css_1.default.detailSection}>
              <h4>Tools ({selectedSkill.tools.length})</h4>
              <div className={styles_module_css_1.default.tagList}>
                {selectedSkill.tools.map(function (tool) { return (<span key={tool} className={styles_module_css_1.default.tag}>{tool}</span>); })}
              </div>
            </div>

            {selectedSkill.category && (<div className={styles_module_css_1.default.detailSection}>
                <h4>Category</h4>
                <span className={"".concat(styles_module_css_1.default.tag, " ").concat(styles_module_css_1.default.tagAgent)}>
                  {selectedSkill.category}
                </span>
              </div>)}

            <div className={styles_module_css_1.default.detailSection}>
              <h4>View Full Documentation</h4>
              <a href={"/docs/skills/".concat(selectedSkill.name.replace(/-/g, '_'))} style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                textDecoration: 'none',
                fontFamily: 'var(--font-system)',
                fontSize: '12px',
                fontWeight: 600,
                border: '2px solid #059669'
            }}>
                Open Skill Page →
              </a>
            </div>
          </div>
        </div>)}
    </div>);
}

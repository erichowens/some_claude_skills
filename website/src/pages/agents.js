"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AgentsDashboard;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var AgentCard_1 = require("../components/AgentCard");
var agent_1 = require("../types/agent");
var agents_1 = require("../data/agents");
require("../css/win31.css");
require("../css/skills-gallery.css");
require("../css/backsplash.css");
require("./agents.module.css");
/**
 * Agents++ Dashboard - The Founding Council visualization
 * Shows all meta-orchestrating agents with their coordination networks
 */
function AgentsDashboard() {
    var _a = (0, react_1.useState)('all'), selectedRole = _a[0], setSelectedRole = _a[1];
    var _b = (0, react_1.useState)(''), searchQuery = _b[0], setSearchQuery = _b[1];
    var _c = (0, react_1.useState)('grid'), viewMode = _c[0], setViewMode = _c[1];
    var stats = (0, react_1.useMemo)(function () { return (0, agents_1.getEcosystemStats)(); }, []);
    var coordinationEdges = (0, react_1.useMemo)(function () { return (0, agents_1.getCoordinationGraph)(); }, []);
    var filteredAgents = (0, react_1.useMemo)(function () {
        var agents = (0, agents_1.getAgentsByRole)(selectedRole);
        // Filter by search
        if (searchQuery) {
            var query_1 = searchQuery.toLowerCase();
            agents = agents.filter(function (agent) {
                return agent.name.toLowerCase().includes(query_1) ||
                    agent.description.toLowerCase().includes(query_1) ||
                    agent.triggers.some(function (t) { return t.toLowerCase().includes(query_1); }) ||
                    agent.role.toLowerCase().includes(query_1);
            });
        }
        return agents;
    }, [selectedRole, searchQuery]);
    var handleResetFilters = function () {
        setSelectedRole('all');
        setSearchQuery('');
    };
    return (<Layout_1.default title="Agents++ | The Founding Council" description="Meet the meta-orchestrating agents that power the self-expanding skill ecosystem">
      <div className="skills-page-bg page-backsplash page-backsplash--agents page-backsplash--medium">
        <div className="skills-container">
          {/* Header */}
          <div className="win31-panel-box">
            <div className="section-header">
              <div className="agents-title-row">
                <h1 className="win31-font hero-title" style={{ fontSize: '32px' }}>
                  Agents++
                </h1>
                <span className="agents-subtitle">The Founding Council</span>
              </div>
              <p className="win31-font" style={{
            fontSize: '16px',
            textAlign: 'center',
            color: '#333',
            marginBottom: '20px',
        }}>
                Nine meta-orchestrating agents that design, build, and expand the ecosystem
              </p>

              {/* Ecosystem Stats Banner */}
              <div className="ecosystem-stats">
                <div className="stat-item">
                  <span className="stat-value">{stats.totalAgents}</span>
                  <span className="stat-label">Total Agents</span>
                </div>
                <div className="stat-divider"/>
                <div className="stat-item">
                  <span className="stat-value">{stats.activeAgents}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat-divider"/>
                <div className="stat-item">
                  <span className="stat-value">{stats.foundingCouncil}</span>
                  <span className="stat-label">Founding Council</span>
                </div>
                <div className="stat-divider"/>
                <div className="stat-item">
                  <span className="stat-value">{coordinationEdges.length}</span>
                  <span className="stat-label">Coordination Links</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-container">
                <input type="text" placeholder="Search agents by name, role, or trigger..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="win31-font search-input"/>
              </div>
            </div>
          </div>

          {/* Role Filter */}
          <div className="category-filter">
            {agent_1.AGENT_ROLES.map(function (role) { return (<button key={role} onClick={function () { return setSelectedRole(role); }} className="win31-push-button" style={{
                fontSize: '14px',
                padding: '10px 20px',
                background: selectedRole === role ? 'var(--win31-blue)' : 'var(--win31-gray)',
                color: selectedRole === role ? 'white' : 'black',
                fontWeight: selectedRole === role ? 'bold' : 'normal',
            }}>
                {role === 'all' ? 'All Roles' : role}
              </button>); })}
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button className={"win31-push-button ".concat(viewMode === 'grid' ? 'active' : '')} onClick={function () { return setViewMode('grid'); }} style={{
            background: viewMode === 'grid' ? 'var(--win31-navy)' : 'var(--win31-gray)',
            color: viewMode === 'grid' ? 'white' : 'black',
        }}>
              Grid View
            </button>
            <button className={"win31-push-button ".concat(viewMode === 'network' ? 'active' : '')} onClick={function () { return setViewMode('network'); }} style={{
            background: viewMode === 'network' ? 'var(--win31-navy)' : 'var(--win31-gray)',
            color: viewMode === 'network' ? 'white' : 'black',
        }}>
              Network View
            </button>
          </div>

          {/* Agents Display */}
          {viewMode === 'grid' ? (<div className="skills-grid agents-grid">
              {filteredAgents.map(function (agent) { return (<AgentCard_1.default key={agent.id} agent={agent} showConnections={true}/>); })}
            </div>) : (<div className="coordination-network">
              <CoordinationNetworkView agents={filteredAgents} edges={coordinationEdges}/>
            </div>)}

          {/* No Results */}
          {filteredAgents.length === 0 && (<div className="no-results">
              <h3 className="win31-font no-results__title">No agents found</h3>
              <p className="win31-font no-results__description">
                Try adjusting your search or role filter
              </p>
              <button className="win31-push-button" onClick={handleResetFilters} style={{ padding: '10px 20px' }}>
                Reset Filters
              </button>
            </div>)}

          {/* Council Philosophy */}
          <div className="win31-panel-box" style={{ marginTop: '40px', padding: '30px', textAlign: 'center' }}>
            <h2 className="win31-font" style={{ fontSize: '20px', color: 'var(--win31-navy)', marginBottom: '16px' }}>
              The Council Philosophy
            </h2>
            <p className="win31-font" style={{ fontSize: '14px', color: '#333', marginBottom: '20px' }}>
              The Founding Council operates as a living network of specialized intelligences. Each
              agent has a unique role but collaborates through coordination links. Together, they
              form a self-improving system that can design new agents, build infrastructure, map
              possibilities, and communicate progress.
            </p>
            <div className="philosophy-points">
              <div className="philosophy-point">
                <span className="philosophy-emoji">🏛️</span>
                <span className="philosophy-text">Architect designs, Smith builds</span>
              </div>
              <div className="philosophy-point">
                <span className="philosophy-emoji">🗺️</span>
                <span className="philosophy-text">Cartographer maps, Scout discovers</span>
              </div>
              <div className="philosophy-point">
                <span className="philosophy-emoji">🕸️</span>
                <span className="philosophy-text">Weaver connects, Librarian curates</span>
              </div>
              <div className="philosophy-point">
                <span className="philosophy-emoji">📜</span>
                <span className="philosophy-text">Archivist records, Liaison communicates</span>
              </div>
              <div className="philosophy-point">
                <span className="philosophy-emoji">🎨</span>
                <span className="philosophy-text">Visualizer reveals</span>
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="win31-panel-box win31-panel-box--small-shadow" style={{ marginBottom: 0 }}>
            <div className="win31-statusbar" style={{ justifyContent: 'center', gap: '20px', padding: '20px' }}>
              <div className="win31-statusbar-panel">
                {filteredAgents.length} of {agents_1.ALL_AGENTS.length} agents shown
              </div>
              <div className="win31-statusbar-panel">
                {selectedRole === 'all' ? 'All Roles' : selectedRole}
              </div>
              <div className="win31-statusbar-panel">
                <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout_1.default>);
}
/**
 * Network visualization of agent coordination relationships
 */
function CoordinationNetworkView(_a) {
    var agents = _a.agents, edges = _a.edges;
    var agentMap = new Map(agents.map(function (a) { return [a.id, a]; }));
    // Simple force-directed layout positions (pre-computed for 9 agents)
    var positions = {
        architect: { x: 50, y: 20 },
        smith: { x: 20, y: 40 },
        cartographer: { x: 80, y: 40 },
        weaver: { x: 35, y: 60 },
        librarian: { x: 65, y: 60 },
        scout: { x: 85, y: 25 },
        visualizer: { x: 50, y: 80 },
        archivist: { x: 20, y: 75 },
        liaison: { x: 80, y: 75 },
    };
    return (<div className="network-container">
      <svg viewBox="0 0 100 100" className="network-svg">
        {/* Coordination edges */}
        {edges.map(function (edge, idx) {
            var source = positions[edge.source];
            var target = positions[edge.target];
            if (!source || !target)
                return null;
            return (<line key={idx} x1={source.x} y1={source.y} x2={target.x} y2={target.y} className="network-edge"/>);
        })}

        {/* Agent nodes */}
        {agents.map(function (agent) {
            var pos = positions[agent.id];
            if (!pos)
                return null;
            return (<g key={agent.id} transform={"translate(".concat(pos.x, ", ").concat(pos.y, ")")} className="network-node">
              <circle r="6" className="node-circle"/>
              <text y="-8" textAnchor="middle" className="node-emoji">
                {agent.emoji}
              </text>
              <text y="12" textAnchor="middle" className="node-label">
                {agent.name.replace('The ', '')}
              </text>
            </g>);
        })}
      </svg>

      <div className="network-legend">
        <h4 className="win31-font">Coordination Network</h4>
        <p className="win31-font">
          Lines show which agents coordinate together. Click an agent card below for details.
        </p>
      </div>

      {/* Agent cards below network */}
      <div className="network-agent-list">
        {agents.map(function (agent) { return (<div key={agent.id} className="network-agent-item">
            <span className="network-agent-emoji">{agent.emoji}</span>
            <span className="network-agent-name">{agent.name}</span>
            <span className="network-agent-role">{agent.role}</span>
          </div>); })}
      </div>
    </div>);
}

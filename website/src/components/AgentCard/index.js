"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AgentCard;
exports.AgentMiniCard = AgentMiniCard;
var react_1 = require("react");
var agent_1 = require("../../types/agent");
var useHoverLift_1 = require("../../hooks/useHoverLift");
var agents_1 = require("../../data/agents");
var styles_module_css_1 = require("./styles.module.css");
/**
 * Agent card component for displaying Founding Council members
 * Features status glow, coordination network preview, and expandable details
 */
function AgentCard(_a) {
    var agent = _a.agent, onClick = _a.onClick, _b = _a.showConnections, showConnections = _b === void 0 ? true : _b;
    var _c = (0, react_1.useState)(false), expanded = _c[0], setExpanded = _c[1];
    var hoverHandlers = (0, useHoverLift_1.useHoverLift)(useHoverLift_1.HOVER_CONFIGS.card);
    var statusConfig = agent_1.AGENT_STATUS_CONFIG[agent.status];
    var badgeConfig = agent.badge ? agent_1.AGENT_BADGE_CONFIG[agent.badge] : null;
    var handleCardClick = function () {
        if (onClick) {
            onClick(agent);
        }
        else {
            setExpanded(!expanded);
        }
    };
    // Get coordinating agent names
    var coordinatingAgents = agent.coordinatesWith
        .map(function (id) { return (0, agents_1.getAgentById)(id); })
        .filter(Boolean);
    return (<div className={styles_module_css_1.default.agentCard} onClick={handleCardClick} style={{
            '--status-glow': statusConfig.glow,
        }} {...hoverHandlers}>
      {/* Status glow indicator */}
      <div className={"".concat(styles_module_css_1.default.statusGlow, " ").concat(agent.status === 'active' ? styles_module_css_1.default.statusGlowActive : '')}/>

      {/* Header with emoji and badges */}
      <div className={styles_module_css_1.default.header}>
        <span className={styles_module_css_1.default.emoji}>{agent.emoji}</span>
        <div className={styles_module_css_1.default.badges}>
          {badgeConfig && (<span className={styles_module_css_1.default.badge} style={{ backgroundColor: badgeConfig.bg, color: badgeConfig.color }}>
              {badgeConfig.label}
            </span>)}
          <span className={styles_module_css_1.default.statusBadge} style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={styles_module_css_1.default.content}>
        <h3 className={"win31-font ".concat(styles_module_css_1.default.title)}>{agent.name}</h3>
        <div className={styles_module_css_1.default.role}>{agent.role}</div>
        <p className={"win31-font ".concat(styles_module_css_1.default.description)}>{agent.description}</p>

        {/* Triggers preview */}
        <div className={styles_module_css_1.default.triggersPreview}>
          <span className={"win31-font ".concat(styles_module_css_1.default.triggersLabel)}>Triggers:</span>
          <div className={styles_module_css_1.default.triggersList}>
            {agent.triggers.slice(0, 4).map(function (trigger, idx) { return (<span key={idx} className={styles_module_css_1.default.triggerBadge}>
                "{trigger}"
              </span>); })}
            {agent.triggers.length > 4 && (<span className={styles_module_css_1.default.triggerBadge}>+{agent.triggers.length - 4}</span>)}
          </div>
        </div>

        {/* Coordination network preview */}
        {showConnections && coordinatingAgents.length > 0 && (<div className={styles_module_css_1.default.coordinationPreview}>
            <span className={"win31-font ".concat(styles_module_css_1.default.coordLabel)}>Coordinates with:</span>
            <div className={styles_module_css_1.default.coordAgents}>
              {coordinatingAgents.map(function (coordAgent) { return (<span key={coordAgent.id} className={styles_module_css_1.default.coordAgent} title={coordAgent.name}>
                  {coordAgent.emoji}
                </span>); })}
            </div>
          </div>)}

        {/* Expanded content */}
        {expanded && (<div className={styles_module_css_1.default.expandedContent}>
            {agent.longDescription && (<p className={"win31-font ".concat(styles_module_css_1.default.longDescription)}>
                {agent.longDescription}
              </p>)}

            {/* Beliefs */}
            <div className={styles_module_css_1.default.section}>
              <h4 className="win31-font">Core Beliefs</h4>
              <ul className={styles_module_css_1.default.beliefsList}>
                {agent.beliefs.map(function (belief, idx) { return (<li key={idx}>{belief}</li>); })}
              </ul>
            </div>

            {/* Outputs */}
            <div className={styles_module_css_1.default.section}>
              <h4 className="win31-font">Outputs</h4>
              <div className={styles_module_css_1.default.outputsList}>
                {agent.outputs.map(function (output, idx) { return (<span key={idx} className={styles_module_css_1.default.outputBadge}>
                    {output}
                  </span>); })}
              </div>
            </div>

            {/* Tools */}
            <div className={styles_module_css_1.default.section}>
              <h4 className="win31-font">Allowed Tools ({agent.allowedTools.length})</h4>
              <div className={styles_module_css_1.default.toolsList}>
                {agent.allowedTools.map(function (tool, idx) { return (<code key={idx} className={styles_module_css_1.default.toolBadge}>
                    {tool}
                  </code>); })}
              </div>
            </div>

            {/* Pledge */}
            {agent.pledge && (<div className={styles_module_css_1.default.pledge}>
                <em>"{agent.pledge}"</em>
              </div>)}
          </div>)}

        {/* Footer */}
        <div className={styles_module_css_1.default.footer}>
          <div className={styles_module_css_1.default.stats}>
            <span className={styles_module_css_1.default.stat}>
              <span className={styles_module_css_1.default.statIcon}>🛠️</span>
              {agent.skillsCreated || 0} skills
            </span>
            <span className={styles_module_css_1.default.stat}>
              <span className={styles_module_css_1.default.statIcon}>🤖</span>
              {agent.agentsSpawned || 0} agents
            </span>
          </div>
          <div className={styles_module_css_1.default.created}>
            Created: {agent.createdDate}
          </div>
        </div>

        {/* Expand hint */}
        <div className={styles_module_css_1.default.expandHint}>
          {expanded ? 'Click to collapse' : 'Click for details'}
        </div>
      </div>
    </div>);
}
/**
 * Mini agent card for coordination network visualization
 */
function AgentMiniCard(_a) {
    var agent = _a.agent;
    var statusConfig = agent_1.AGENT_STATUS_CONFIG[agent.status];
    return (<div className={styles_module_css_1.default.miniCard} style={{
            '--status-glow': statusConfig.glow,
        }}>
      <span className={styles_module_css_1.default.miniEmoji}>{agent.emoji}</span>
      <span className={styles_module_css_1.default.miniName}>{agent.name}</span>
      <span className={styles_module_css_1.default.miniStatus} style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
        {statusConfig.label}
      </span>
    </div>);
}

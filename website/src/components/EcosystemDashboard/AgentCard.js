"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AgentCard;
var react_1 = require("react");
var styles_module_css_1 = require("./styles.module.css");
function AgentCard(_a) {
    var agent = _a.agent, onClick = _a.onClick, isSelected = _a.isSelected;
    return (<div className={"".concat(styles_module_css_1.default.agentCard, " ").concat(isSelected ? styles_module_css_1.default.selected : '')} onClick={onClick}>
      <div className={styles_module_css_1.default.agentIcon}>
        {agent.name.charAt(0).toUpperCase()}
      </div>

      <div className={styles_module_css_1.default.agentContent}>
        <h3 className={styles_module_css_1.default.agentName}>{agent.name}</h3>
        <div className={styles_module_css_1.default.agentRole}>{agent.role}</div>

        <p className={styles_module_css_1.default.agentDescription}>
          {agent.description.slice(0, 150)}...
        </p>

        <div className={styles_module_css_1.default.agentMeta}>
          <span className={styles_module_css_1.default.metaBadge}>
            {agent.tools.length} tools
          </span>
          <span className={styles_module_css_1.default.metaBadge}>
            {agent.coordinates_with.length} connections
          </span>
        </div>
      </div>
    </div>);
}

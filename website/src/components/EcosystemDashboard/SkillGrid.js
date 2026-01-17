"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SkillGrid;
var react_1 = require("react");
var styles_module_css_1 = require("./styles.module.css");
function SkillGrid(_a) {
    var skills = _a.skills;
    var _b = (0, react_1.useState)(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var _c = (0, react_1.useState)(false), filterWithTools = _c[0], setFilterWithTools = _c[1];
    var _d = (0, react_1.useState)(false), filterWithRefs = _d[0], setFilterWithRefs = _d[1];
    var filteredSkills = (0, react_1.useMemo)(function () {
        return skills.filter(function (skill) {
            var matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                skill.description.toLowerCase().includes(searchTerm.toLowerCase());
            var matchesTools = !filterWithTools || skill.tools.length > 0;
            var matchesRefs = !filterWithRefs || skill.has_references;
            return matchesSearch && matchesTools && matchesRefs;
        });
    }, [skills, searchTerm, filterWithTools, filterWithRefs]);
    return (<div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">SKILLS.DB - All Capabilities</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">□</div>
        </div>
      </div>

      <div className={styles_module_css_1.default.skillControls}>
        <input type="text" placeholder="Search skills..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className={styles_module_css_1.default.searchInput}/>

        <label className={styles_module_css_1.default.filterLabel}>
          <input type="checkbox" checked={filterWithTools} onChange={function (e) { return setFilterWithTools(e.target.checked); }}/>
          Has Tools
        </label>

        <label className={styles_module_css_1.default.filterLabel}>
          <input type="checkbox" checked={filterWithRefs} onChange={function (e) { return setFilterWithRefs(e.target.checked); }}/>
          Has References
        </label>

        <div className={styles_module_css_1.default.skillCount}>
          {filteredSkills.length} of {skills.length} skills
        </div>
      </div>

      <div className={styles_module_css_1.default.skillGridContainer}>
        {filteredSkills.map(function (skill) { return (<div key={skill.name} className={styles_module_css_1.default.skillCard}>
            <div className={styles_module_css_1.default.skillHeader}>
              <h4 className={styles_module_css_1.default.skillName}>{skill.name}</h4>
              <div className={styles_module_css_1.default.skillBadges}>
                {skill.has_references && (<span className={styles_module_css_1.default.badge} title="Has references">📚</span>)}
                {skill.has_examples && (<span className={styles_module_css_1.default.badge} title="Has examples">💡</span>)}
                {skill.tools.length > 0 && (<span className={styles_module_css_1.default.badge} title={"".concat(skill.tools.length, " tools")}>
                    🔧 {skill.tools.length}
                  </span>)}
              </div>
            </div>

            <p className={styles_module_css_1.default.skillDescription}>
              {skill.description.slice(0, 200)}
              {skill.description.length > 200 ? '...' : ''}
            </p>

            {skill.tools.length > 0 && (<div className={styles_module_css_1.default.skillTools}>
                {skill.tools.slice(0, 3).map(function (tool) { return (<span key={tool} className={styles_module_css_1.default.toolTag}>{tool}</span>); })}
                {skill.tools.length > 3 && (<span className={styles_module_css_1.default.toolTag}>+{skill.tools.length - 3} more</span>)}
              </div>)}
          </div>); })}
      </div>
    </div>);
}

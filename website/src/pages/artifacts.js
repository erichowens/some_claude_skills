"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Artifacts;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var ArtifactCard_1 = require("@site/src/components/ArtifactCard");
var artifacts_module_css_1 = require("./artifacts.module.css");
require("../css/backsplash.css");
// Import all artifacts
// Note: In production, this would dynamically load from the artifacts directory
var artifact_json_1 = require("@site/src/data/artifacts/single-skill/prompt-learning-mcp/001-test-suite-creation/artifact.json");
var artifact_json_2 = require("@site/src/data/artifacts/single-skill/skill-coach/001-self-improvement/artifact.json");
var artifact_json_3 = require("@site/src/data/artifacts/single-skill/vaporwave-glassomorphic-ui-designer/001-midi-player/artifact.json");
var artifact_json_4 = require("@site/src/data/artifacts/frontend/multi-skill/1-site-reliability-engineer-integration/artifact.json");
// New lifestyle and recovery artifacts
var artifact_json_5 = require("@site/src/data/artifacts/multi-skill/recovery-communication-stack/artifact.json");
var artifact_json_6 = require("@site/src/data/artifacts/multi-skill/home-transformation-suite/artifact.json");
var artifact_json_7 = require("@site/src/data/artifacts/single-skill/panic-room-finder/001-hidden-space-detective/artifact.json");
var artifact_json_8 = require("@site/src/data/artifacts/single-skill/wedding-immortalist/001-wedding-time-capsule/artifact.json");
var artifact_json_9 = require("@site/src/data/artifacts/single-skill/partner-text-coach/001-relationship-lab/artifact.json");
var artifact_json_10 = require("@site/src/data/artifacts/single-skill/fancy-yard-landscaper/001-yard-transformation/artifact.json");
var artifact_json_11 = require("@site/src/data/artifacts/single-skill/maximalist-wall-decorator/001-color-confidence/artifact.json");
var artifact_json_12 = require("@site/src/data/artifacts/multi-skill/cv-creator-production/artifact.json");
var artifact_json_13 = require("@site/src/data/artifacts/multi-skill/sound-engineer-winamp-upgrade/artifact.json");
var ARTIFACTS = [
    artifact_json_1.default,
    artifact_json_2.default,
    artifact_json_3.default,
    artifact_json_4.default,
    // Lifestyle and recovery artifacts
    artifact_json_5.default,
    artifact_json_6.default,
    artifact_json_7.default,
    artifact_json_8.default,
    artifact_json_9.default,
    artifact_json_10.default,
    artifact_json_11.default,
    artifact_json_12.default,
    artifact_json_13.default,
];
var CATEGORIES = [
    { value: 'all', label: 'All', icon: '📚' },
    { value: 'design', label: 'Design', icon: '🎨' },
    { value: 'development', label: 'Development', icon: '💻' },
    { value: 'ai-ml', label: 'AI/ML', icon: '🤖' },
    { value: 'lifestyle', label: 'Lifestyle', icon: '🏡' },
    { value: 'relationships', label: 'Relationships', icon: '💕' },
    { value: 'recovery', label: 'Recovery', icon: '🌅' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'writing', label: 'Writing', icon: '✍️' },
    { value: 'meta', label: 'Meta', icon: '🔄' },
];
var TYPES = [
    { value: 'all', label: 'All Types', icon: '🎯' },
    { value: 'single-skill', label: 'Solo Skills', icon: '🎯' },
    { value: 'multi-skill', label: 'Orchestration', icon: '🎼' },
    { value: 'comparison', label: 'Comparisons', icon: '⚖️' },
];
function Artifacts() {
    var _a = (0, react_1.useState)('all'), selectedCategory = _a[0], setSelectedCategory = _a[1];
    var _b = (0, react_1.useState)('all'), selectedType = _b[0], setSelectedType = _b[1];
    var _c = (0, react_1.useState)(''), searchQuery = _c[0], setSearchQuery = _c[1];
    var filteredArtifacts = (0, react_1.useMemo)(function () {
        return ARTIFACTS.filter(function (artifact) {
            var matchesCategory = selectedCategory === 'all' || artifact.category === selectedCategory;
            var matchesType = selectedType === 'all' || artifact.type === selectedType;
            var matchesSearch = searchQuery === '' ||
                artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                artifact.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                artifact.skills.some(function (s) { return s.name.toLowerCase().includes(searchQuery.toLowerCase()); });
            return matchesCategory && matchesType && matchesSearch;
        }).sort(function (a, b) {
            // Sort by creation date descending (newest first)
            var dateA = new Date(a.createdAt || a.created || '2025-01-01');
            var dateB = new Date(b.createdAt || b.created || '2025-01-01');
            return dateB.getTime() - dateA.getTime();
        });
    }, [selectedCategory, selectedType, searchQuery]);
    var featuredArtifacts = (0, react_1.useMemo)(function () {
        return filteredArtifacts.filter(function (a) { return a.featured; });
    }, [filteredArtifacts]);
    var regularArtifacts = (0, react_1.useMemo)(function () {
        return filteredArtifacts.filter(function (a) { return !a.featured; });
    }, [filteredArtifacts]);
    return (<Layout_1.default title="Examples" description="Explore real-world demonstrations of Claude Skills in action">
      <div className={"".concat(artifacts_module_css_1.default.artifactsPage, " page-backsplash page-backsplash--artifacts page-backsplash--medium")}>
        <div className={artifacts_module_css_1.default.hero}>
          <div className="container">
            <h1 className={artifacts_module_css_1.default.heroTitle} style={{ position: 'relative' }}>
              <span className={artifacts_module_css_1.default.heroIcon}>✨</span>
              Examples
              <span className="beta-sticker">BETA</span>
            </h1>
            <p className={artifacts_module_css_1.default.heroSubtitle}>
              Real-world demonstrations of Claude Skills in action. See how individual skills
              perform solo, how they orchestrate together, and compare different approaches.
            </p>
            <div className={artifacts_module_css_1.default.heroStats}>
              <div className={artifacts_module_css_1.default.stat}>
                <span className={artifacts_module_css_1.default.statValue}>{ARTIFACTS.length}</span>
                <span className={artifacts_module_css_1.default.statLabel}>Examples</span>
              </div>
              <div className={artifacts_module_css_1.default.stat}>
                <span className={artifacts_module_css_1.default.statValue}>
                  {new Set(ARTIFACTS.flatMap(function (a) { return a.skills.map(function (s) { return s.name; }); })).size}
                </span>
                <span className={artifacts_module_css_1.default.statLabel}>Skills Featured</span>
              </div>
              <div className={artifacts_module_css_1.default.stat}>
                <span className={artifacts_module_css_1.default.statValue}>
                  {ARTIFACTS.filter(function (a) { return a.type === 'multi-skill'; }).length}
                </span>
                <span className={artifacts_module_css_1.default.statLabel}>Orchestrations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className={artifacts_module_css_1.default.filters}>
            <div className={artifacts_module_css_1.default.searchContainer}>
              <input type="text" className={artifacts_module_css_1.default.searchInput} placeholder="Search artifacts, skills, or tags..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }}/>
              <span className={artifacts_module_css_1.default.searchIcon}>🔍</span>
            </div>

            <div className={artifacts_module_css_1.default.filterGroup}>
              <label className={artifacts_module_css_1.default.filterLabel}>Category:</label>
              <div className={artifacts_module_css_1.default.filterButtons}>
                {CATEGORIES.map(function (cat) { return (<button key={cat.value} className={"".concat(artifacts_module_css_1.default.filterButton, " ").concat(selectedCategory === cat.value ? artifacts_module_css_1.default.active : '')} onClick={function () { return setSelectedCategory(cat.value); }}>
                    <span className={artifacts_module_css_1.default.filterIcon}>{cat.icon}</span>
                    {cat.label}
                  </button>); })}
              </div>
            </div>

            <div className={artifacts_module_css_1.default.filterGroup}>
              <label className={artifacts_module_css_1.default.filterLabel}>Type:</label>
              <div className={artifacts_module_css_1.default.filterButtons}>
                {TYPES.map(function (type) { return (<button key={type.value} className={"".concat(artifacts_module_css_1.default.filterButton, " ").concat(selectedType === type.value ? artifacts_module_css_1.default.active : '')} onClick={function () { return setSelectedType(type.value); }}>
                    <span className={artifacts_module_css_1.default.filterIcon}>{type.icon}</span>
                    {type.label}
                  </button>); })}
              </div>
            </div>
          </div>

          {filteredArtifacts.length === 0 ? (<div className={artifacts_module_css_1.default.emptyState}>
              <div className={artifacts_module_css_1.default.emptyIcon}>🔍</div>
              <h3 className={artifacts_module_css_1.default.emptyTitle}>No artifacts found</h3>
              <p className={artifacts_module_css_1.default.emptyText}>
                Try adjusting your filters or search query
              </p>
              <button className={artifacts_module_css_1.default.resetButton} onClick={function () {
                setSelectedCategory('all');
                setSelectedType('all');
                setSearchQuery('');
            }}>
                Reset Filters
              </button>
            </div>) : (<>
              {featuredArtifacts.length > 0 && (<section className={artifacts_module_css_1.default.section}>
                  <h2 className={artifacts_module_css_1.default.sectionTitle}>
                    <span className={artifacts_module_css_1.default.sectionIcon}>⭐</span>
                    Featured Examples
                  </h2>
                  <div className={artifacts_module_css_1.default.artifactGrid}>
                    {featuredArtifacts.map(function (artifact) { return (<ArtifactCard_1.default key={artifact.id} artifact={artifact}/>); })}
                  </div>
                </section>)}

              {regularArtifacts.length > 0 && (<section className={artifacts_module_css_1.default.section}>
                  <h2 className={artifacts_module_css_1.default.sectionTitle}>
                    {featuredArtifacts.length > 0 ? 'All Examples' : 'Examples'}
                  </h2>
                  <div className={artifacts_module_css_1.default.artifactGrid}>
                    {regularArtifacts.map(function (artifact) { return (<ArtifactCard_1.default key={artifact.id} artifact={artifact}/>); })}
                  </div>
                </section>)}
            </>)}

          <div className={artifacts_module_css_1.default.ctaSection}>
            <h2 className={artifacts_module_css_1.default.ctaTitle}>Want to contribute an artifact?</h2>
            <p className={artifacts_module_css_1.default.ctaText}>
              Share your own demonstrations of Claude Skills in action. Show the community
              how skills work individually or how they orchestrate together.
            </p>
            <Link_1.default to="/docs/guides/artifact-contribution-guide" className={artifacts_module_css_1.default.ctaButton}>
              Learn How to Create Artifacts →
            </Link_1.default>
          </div>
        </div>
      </div>
    </Layout_1.default>);
}

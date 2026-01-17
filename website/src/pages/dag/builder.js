"use strict";
/**
 * DAG Builder Page
 *
 * Interactive interface for building DAG workflows.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DAGBuilderPage;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var DAG_1 = require("@site/src/components/DAG");
var dag_module_css_1 = require("./dag.module.css");
// Sample skills for demonstration
var SAMPLE_SKILLS = [
    { id: 'code-review', name: 'Code Review', category: 'Development' },
    { id: 'unit-testing', name: 'Unit Testing', category: 'Testing' },
    { id: 'security-audit', name: 'Security Audit', category: 'Security' },
    { id: 'documentation', name: 'Documentation', category: 'Writing' },
    { id: 'api-design', name: 'API Design', category: 'Architecture' },
    { id: 'performance-optimization', name: 'Performance Optimization', category: 'Development' },
    { id: 'data-validation', name: 'Data Validation', category: 'Data' },
    { id: 'error-handling', name: 'Error Handling', category: 'Development' },
];
function dagToJson(dag) {
    var obj = {
        id: dag.id,
        name: dag.name,
        nodes: Array.from(dag.nodes.values()).map(function (node) { return ({
            id: node.id,
            type: node.type,
            skillId: node.skillId,
            dependencies: node.dependencies,
        }); }),
        config: dag.config,
    };
    return JSON.stringify(obj, null, 2);
}
function dagToYaml(dag) {
    var nodes = Array.from(dag.nodes.values());
    var yaml = "# DAG Workflow: ".concat(dag.name, "\n");
    yaml += "id: ".concat(dag.id, "\n");
    yaml += "name: ".concat(dag.name, "\n");
    yaml += "config:\n";
    yaml += "  maxParallelism: ".concat(dag.config.maxParallelism, "\n");
    yaml += "  defaultTimeout: ".concat(dag.config.defaultTimeout, "\n");
    yaml += "  errorHandling: ".concat(dag.config.errorHandling, "\n");
    yaml += "nodes:\n";
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        yaml += "  - id: ".concat(node.id, "\n");
        yaml += "    type: ".concat(node.type, "\n");
        if (node.skillId) {
            yaml += "    skillId: ".concat(node.skillId, "\n");
        }
        if (node.dependencies.length > 0) {
            yaml += "    dependencies:\n";
            for (var _a = 0, _b = node.dependencies; _a < _b.length; _a++) {
                var dep = _b[_a];
                yaml += "      - ".concat(dep, "\n");
            }
        }
    }
    return yaml;
}
function DAGBuilderPage() {
    var _a = (0, react_1.useState)(null), savedDag = _a[0], setSavedDag = _a[1];
    var _b = (0, react_1.useState)(null), exportedContent = _b[0], setExportedContent = _b[1];
    var _c = (0, react_1.useState)('json'), exportFormat = _c[0], setExportFormat = _c[1];
    var handleSave = (0, react_1.useCallback)(function (dag) {
        setSavedDag(dag);
        // In a real app, this would save to backend/localStorage
        console.log('Saved DAG:', dag);
        alert("Workflow \"".concat(dag.name, "\" saved with ").concat(dag.nodes.size, " nodes!"));
    }, []);
    var handleExport = (0, react_1.useCallback)(function (dag, format) {
        var content = format === 'json' ? dagToJson(dag) : dagToYaml(dag);
        setExportedContent(content);
        setExportFormat(format);
    }, []);
    var handleCopyExport = (0, react_1.useCallback)(function () {
        if (exportedContent) {
            navigator.clipboard.writeText(exportedContent);
            alert('Copied to clipboard!');
        }
    }, [exportedContent]);
    var handleDownloadExport = (0, react_1.useCallback)(function () {
        if (exportedContent && savedDag) {
            var blob = new Blob([exportedContent], { type: 'text/plain' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = "".concat(savedDag.name.toLowerCase().replace(/\s+/g, '-'), ".").concat(exportFormat);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }, [exportedContent, exportFormat, savedDag]);
    return (<Layout_1.default title="DAG Builder" description="Build DAG workflows visually">
      <div className={dag_module_css_1.default.container}>
        {/* Breadcrumbs */}
        <div className={dag_module_css_1.default.breadcrumbs}>
          <Link_1.default to="/dag" className={dag_module_css_1.default.breadcrumbLink}>DAG Framework</Link_1.default>
          <span className={dag_module_css_1.default.breadcrumbSeparator}>›</span>
          <span className={dag_module_css_1.default.breadcrumbCurrent}>Builder</span>
        </div>

        {/* Header */}
        <div className={dag_module_css_1.default.builderHeader}>
          <h1 className={dag_module_css_1.default.builderTitle}>
            📊 DAG Workflow Builder
          </h1>
          <div className={dag_module_css_1.default.builderActions}>
            <Link_1.default to="/dag/monitor" className={dag_module_css_1.default.secondaryCta}>
              📈 Monitor
            </Link_1.default>
          </div>
        </div>

        {/* Builder Component */}
        <div className={dag_module_css_1.default.builderContainer}>
          <DAG_1.DAGBuilder availableSkills={SAMPLE_SKILLS} onSave={handleSave} onExport={handleExport}/>
        </div>

        {/* Export Modal */}
        {exportedContent && (<div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }} onClick={function () { return setExportedContent(null); }}>
            <div style={{
                width: '600px',
                maxHeight: '80vh',
                background: '#c0c0c0',
                border: '4px solid #000000',
                boxShadow: '8px 8px 0 rgba(0,0,0,0.3)',
            }} onClick={function (e) { return e.stopPropagation(); }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                background: 'linear-gradient(90deg, #000080, #1084d0)',
                color: 'white',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                fontWeight: 'bold',
            }}>
                <span>📤 Export - {exportFormat.toUpperCase()}</span>
                <button style={{
                background: '#c0c0c0',
                border: '2px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                color: '#000000',
                width: '20px',
                height: '20px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }} onClick={function () { return setExportedContent(null); }}>
                  ×
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <pre style={{
                background: '#ffffff',
                border: '2px solid',
                borderColor: '#808080 #ffffff #ffffff #808080',
                padding: '12px',
                margin: '0 0 16px 0',
                maxHeight: '400px',
                overflow: 'auto',
                fontFamily: 'var(--font-code)',
                fontSize: '11px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
            }}>
                  {exportedContent}
                </pre>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={dag_module_css_1.default.primaryCta} onClick={handleCopyExport}>
                    📋 Copy to Clipboard
                  </button>
                  <button className={dag_module_css_1.default.secondaryCta} onClick={handleDownloadExport}>
                    💾 Download
                  </button>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </Layout_1.default>);
}

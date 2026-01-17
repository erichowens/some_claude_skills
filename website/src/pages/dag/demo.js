"use strict";
/**
 * DAG Execution Demo Page
 *
 * Interactive visualization of DAG execution
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DAGDemo;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var DAGVisualizer_1 = require("../../components/DAG/DAGVisualizer");
var types_1 = require("../../dag/types");
var demo_module_css_1 = require("./demo.module.css");
// Helper to create rich DAG nodes
function createNode(id, name, description, skillId, dependencies, model) {
    if (dependencies === void 0) { dependencies = []; }
    if (model === void 0) { model = 'haiku'; }
    return {
        id: (0, types_1.NodeId)(id),
        name: name,
        description: description,
        type: 'skill',
        skillId: skillId,
        dependencies: dependencies,
        state: { status: 'pending' },
        config: __assign(__assign({}, types_1.DEFAULT_TASK_CONFIG), { model: model }),
    };
}
// Example DAGs
var SIMPLE_DAG = {
    id: (0, types_1.NodeId)('simple'),
    name: 'Simple Sequential',
    version: '1.0.0',
    nodes: new Map([
        [(0, types_1.NodeId)('research'), createNode('research', 'Research Topic', 'Comprehensive research on the given topic using web search and documentation', 'comprehensive-researcher', [], 'haiku')],
        [(0, types_1.NodeId)('write'), createNode('write', 'Write Documentation', 'Technical writing based on research findings with clear structure', 'technical-writer', [(0, types_1.NodeId)('research')], 'sonnet')],
        [(0, types_1.NodeId)('review'), createNode('review', 'Code Review', 'Review documentation for quality, accuracy, and adherence to standards', 'code-reviewer', [(0, types_1.NodeId)('write')], 'haiku')],
    ]),
    edges: new Map([
        [(0, types_1.NodeId)('research'), [(0, types_1.NodeId)('write')]],
        [(0, types_1.NodeId)('write'), [(0, types_1.NodeId)('review')]],
    ]),
    config: types_1.DEFAULT_DAG_CONFIG,
    inputs: [],
    outputs: [{ name: 'result', description: 'Final reviewed documentation', sourceNodeId: (0, types_1.NodeId)('review') }],
    createdAt: new Date(),
    updatedAt: new Date(),
};
var PARALLEL_DAG = {
    id: (0, types_1.NodeId)('parallel'),
    name: 'Parallel Execution',
    version: '1.0.0',
    nodes: new Map([
        [(0, types_1.NodeId)('design'), createNode('design', 'UI/UX Design', 'Create visual design mockups and component library with modern aesthetics', 'web-design-expert', [], 'sonnet')],
        [(0, types_1.NodeId)('content'), createNode('content', 'Content Writing', 'Write clear, engaging content with proper structure and SEO optimization', 'technical-writer', [], 'haiku')],
        [(0, types_1.NodeId)('code'), createNode('code', 'Frontend Development', 'Implement React components with TypeScript and modern best practices', 'frontend-developer', [], 'sonnet')],
        [(0, types_1.NodeId)('integrate'), createNode('integrate', 'Full Integration', 'Combine design, content, and code into cohesive application with testing', 'fullstack-developer', [(0, types_1.NodeId)('design'), (0, types_1.NodeId)('content'), (0, types_1.NodeId)('code')], 'opus')],
    ]),
    edges: new Map([
        [(0, types_1.NodeId)('design'), [(0, types_1.NodeId)('integrate')]],
        [(0, types_1.NodeId)('content'), [(0, types_1.NodeId)('integrate')]],
        [(0, types_1.NodeId)('code'), [(0, types_1.NodeId)('integrate')]],
    ]),
    config: types_1.DEFAULT_DAG_CONFIG,
    inputs: [],
    outputs: [{ name: 'result', description: 'Integrated application', sourceNodeId: (0, types_1.NodeId)('integrate') }],
    createdAt: new Date(),
    updatedAt: new Date(),
};
// Real-world example: Website modernization for 5 personas
var WEBSITE_MODERNIZATION_DAG = {
    id: (0, types_1.NodeId)('website-modernization'),
    name: 'Website Modernization (Real Task)',
    version: '1.0.0',
    nodes: new Map([
        [(0, types_1.NodeId)('ux-friction-audit'), createNode('ux-friction-audit', 'UX Friction Audit', 'Analyze current site for usability issues, navigation problems, and user pain points', 'ux-friction-analyzer', [], 'haiku')],
        [(0, types_1.NodeId)('seo-audit'), createNode('seo-audit', 'SEO Audit', 'Comprehensive SEO analysis: meta tags, performance, indexing, mobile optimization', 'technical-writer', [], 'haiku')],
        [(0, types_1.NodeId)('competitive-landscape'), createNode('competitive-landscape', 'Competitive Analysis', 'Research competitor sites and industry design trends for positioning', 'web-design-expert', [], 'sonnet')],
        [(0, types_1.NodeId)('persona-vibe-matching'), createNode('persona-vibe-matching', 'Persona Vibe Matching', 'Translate 5 personas into specific design language and content tone', 'vibe-matcher', [(0, types_1.NodeId)('competitive-landscape')], 'sonnet')],
        [(0, types_1.NodeId)('design-system-creation'), createNode('design-system-creation', 'Design System Creation', 'Create comprehensive design system: colors, typography, components, spacing', 'design-system-creator', [(0, types_1.NodeId)('persona-vibe-matching'), (0, types_1.NodeId)('ux-friction-audit')], 'opus')],
        [(0, types_1.NodeId)('content-strategy'), createNode('content-strategy', 'Content Strategy', 'Plan content structure, information architecture, and messaging for each persona', 'diagramming-expert', [(0, types_1.NodeId)('ux-friction-audit'), (0, types_1.NodeId)('seo-audit'), (0, types_1.NodeId)('persona-vibe-matching')], 'sonnet')],
        [(0, types_1.NodeId)('visual-design-mockups'), createNode('visual-design-mockups', 'Visual Design Mockups', 'Create high-fidelity mockups for all key pages and components', 'web-design-expert', [(0, types_1.NodeId)('design-system-creation'), (0, types_1.NodeId)('content-strategy')], 'opus')],
        [(0, types_1.NodeId)('implementation-frontend'), createNode('implementation-frontend', 'Frontend Implementation', 'Build React components implementing the design system and mockups', 'prompt-engineer', [(0, types_1.NodeId)('visual-design-mockups'), (0, types_1.NodeId)('design-system-creation')], 'opus')],
        [(0, types_1.NodeId)('seo-implementation'), createNode('seo-implementation', 'SEO Implementation', 'Implement technical SEO: meta tags, schema, sitemap, performance optimizations', 'chatbot-analytics', [(0, types_1.NodeId)('seo-audit'), (0, types_1.NodeId)('implementation-frontend')], 'sonnet')],
        [(0, types_1.NodeId)('content-writing'), createNode('content-writing', 'Content Writing', 'Write final copy for all pages optimized for personas and SEO', 'technical-writer', [(0, types_1.NodeId)('content-strategy'), (0, types_1.NodeId)('persona-vibe-matching')], 'sonnet')],
        [(0, types_1.NodeId)('deployment-optimization'), createNode('deployment-optimization', 'Deployment & Optimization', 'Deploy to production with CI/CD, monitoring, and performance tuning', 'site-reliability-engineer', [(0, types_1.NodeId)('implementation-frontend'), (0, types_1.NodeId)('seo-implementation'), (0, types_1.NodeId)('content-writing')], 'opus')],
        [(0, types_1.NodeId)('validation-testing'), createNode('validation-testing', 'Validation & Testing', 'Comprehensive testing: unit, integration, accessibility, cross-browser', 'vitest-testing-patterns', [(0, types_1.NodeId)('deployment-optimization')], 'sonnet')],
    ]),
    edges: new Map([
        [(0, types_1.NodeId)('ux-friction-audit'), [(0, types_1.NodeId)('design-system-creation'), (0, types_1.NodeId)('content-strategy')]],
        [(0, types_1.NodeId)('seo-audit'), [(0, types_1.NodeId)('content-strategy'), (0, types_1.NodeId)('seo-implementation')]],
        [(0, types_1.NodeId)('competitive-landscape'), [(0, types_1.NodeId)('persona-vibe-matching')]],
        [(0, types_1.NodeId)('persona-vibe-matching'), [(0, types_1.NodeId)('design-system-creation'), (0, types_1.NodeId)('content-strategy'), (0, types_1.NodeId)('content-writing')]],
        [(0, types_1.NodeId)('design-system-creation'), [(0, types_1.NodeId)('visual-design-mockups'), (0, types_1.NodeId)('implementation-frontend')]],
        [(0, types_1.NodeId)('content-strategy'), [(0, types_1.NodeId)('visual-design-mockups'), (0, types_1.NodeId)('content-writing')]],
        [(0, types_1.NodeId)('visual-design-mockups'), [(0, types_1.NodeId)('implementation-frontend')]],
        [(0, types_1.NodeId)('implementation-frontend'), [(0, types_1.NodeId)('seo-implementation'), (0, types_1.NodeId)('deployment-optimization')]],
        [(0, types_1.NodeId)('seo-implementation'), [(0, types_1.NodeId)('deployment-optimization')]],
        [(0, types_1.NodeId)('content-writing'), [(0, types_1.NodeId)('deployment-optimization')]],
        [(0, types_1.NodeId)('deployment-optimization'), [(0, types_1.NodeId)('validation-testing')]],
        [(0, types_1.NodeId)('validation-testing'), []],
    ]),
    config: types_1.DEFAULT_DAG_CONFIG,
    inputs: [],
    outputs: [{ name: 'validation_report', description: 'Final validation report with test results', sourceNodeId: (0, types_1.NodeId)('validation-testing') }],
    createdAt: new Date(),
    updatedAt: new Date(),
};
var DAG_DESCRIPTIONS = {
    'simple': {
        title: 'Simple Sequential',
        description: 'Basic 3-step workflow: research → write → review. Demonstrates linear task dependencies.',
        complexity: 3,
    },
    'parallel': {
        title: 'Parallel Execution',
        description: 'Fan-out/fan-in pattern: 3 tasks run concurrently (design, content, code), then integrate. Shows 3x speedup potential.',
        complexity: 5,
    },
    'website-modernization': {
        title: 'Website Modernization',
        description: 'Real-world task: modernize someclaudeskills.com for 5 personas. Multi-phase strategy with UX audit, design system, implementation, and deployment. Complexity 9/10.',
        complexity: 9,
    },
};
function DAGDemo() {
    var _a = (0, react_1.useState)('simple'), selectedDAG = _a[0], setSelectedDAG = _a[1];
    var dag = selectedDAG === 'simple'
        ? SIMPLE_DAG
        : selectedDAG === 'parallel'
            ? PARALLEL_DAG
            : WEBSITE_MODERNIZATION_DAG;
    var description = DAG_DESCRIPTIONS[selectedDAG];
    return (<Layout_1.default title="DAG Visualization Demo" description="Interactive DAG execution visualization">
      <div className={demo_module_css_1.default.container}>
        <h1>DAG Visualization Demo</h1>

        <p className={demo_module_css_1.default.intro}>
          See how arbitrary tasks are decomposed into execution graphs with automatic parallelization.
        </p>

        <div className={demo_module_css_1.default.controls}>
          <label>Example:</label>
          <select value={selectedDAG} onChange={function (e) { return setSelectedDAG(e.target.value); }}>
            <option value="simple">Simple Sequential</option>
            <option value="parallel">Parallel Execution</option>
            <option value="website-modernization">Website Modernization (Real Task)</option>
          </select>
        </div>

        <div className={demo_module_css_1.default.description}>
          <h3>{description.title}</h3>
          <p>{description.description}</p>
          <p className={demo_module_css_1.default.complexity}>
            <strong>Complexity:</strong> {description.complexity}/10
          </p>
        </div>

        <div className={demo_module_css_1.default.dagExplanation}>
          <h3>📋 Understanding the DAG</h3>
          <p><strong>What is this?</strong> A Directed Acyclic Graph (DAG) showing task execution order and dependencies.</p>

          <h4>How Data Flows:</h4>
          <ul>
            <li><strong>Nodes (Windows):</strong> Each window represents a skill/agent that performs work</li>
            <li><strong>Arrows:</strong> Show dependencies - an arrow from A→B means "B depends on A's output"</li>
            <li><strong>Waves (Columns):</strong> Nodes in the same column can run in parallel (no dependencies between them)</li>
            <li><strong>Execution Order:</strong> Left to right - earlier waves complete before later ones</li>
          </ul>

          <h4>Node Inputs & Outputs:</h4>
          <ul>
            <li><strong>Input:</strong> Each node receives the combined outputs of all its dependencies</li>
            <li><strong>Processing:</strong> The skill analyzes inputs and produces new artifacts (docs, designs, code, etc.)</li>
            <li><strong>Output:</strong> Artifacts are passed to dependent nodes (shown by arrows)</li>
            <li><strong>Example:</strong> "Research" outputs findings → "Write" consumes findings and outputs draft → "Review" consumes draft and outputs feedback</li>
          </ul>

          <h4>Color Legend:</h4>
          <ul>
            <li><strong>Navy:</strong> Pending (waiting for dependencies)</li>
            <li><strong>Yellow:</strong> Ready (all dependencies met, can start)</li>
            <li><strong>Blue:</strong> Running (actively executing)</li>
            <li><strong>Green:</strong> Completed (output available)</li>
            <li><strong>Red:</strong> Failed (error occurred)</li>
          </ul>
        </div>

        <DAGVisualizer_1.DAGVisualizer dag={dag} highlightCriticalPath/>

        <div className={demo_module_css_1.default.info}>
          <h2>DAG Statistics</h2>
          <p><strong>Total nodes:</strong> {dag.nodes.size}</p>
          <p><strong>Total edges:</strong> {dag.edges.size}</p>
          <p><strong>Parallelization opportunities:</strong> {Array.from(dag.nodes.values()).filter(function (n) { return n.dependencies.length === 0; }).length} (wave 1)</p>
        </div>

        {selectedDAG === 'website-modernization' && (<div className={demo_module_css_1.default.realTaskNote}>
            <h3>📊 Real Task Decomposition</h3>
            <p>
              This DAG was generated from the task: <em>"Modernize someclaudeskills.com for 5 personas:
              AI newbie, developer, ADHD dilettante, potential employer, and non-tech friend.
              Minimize UX friction, optimize SEO, make it beautiful and unique."</em>
            </p>
            <p>
              The decomposer identified 12 subtasks across 6 waves: research/audit (wave 1),
              persona translation (wave 2), design system + content strategy (wave 3),
              visual mockups (wave 4), implementation (wave 5), deployment + validation (wave 6).
            </p>
            <p>
              <strong>Estimated speedup:</strong> 3.1x vs sequential execution through parallel research/audit phases.
            </p>
          </div>)}
      </div>
    </Layout_1.default>);
}

"use strict";
/**
 * DAG Landing Page
 *
 * Overview of the DAG execution framework with links to builder and monitor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DAGPage;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var dag_module_css_1 = require("./dag.module.css");
var FEATURES = [
    {
        icon: '📊',
        title: 'Visual DAG Builder',
        description: 'Create execution graphs visually with drag-and-drop node creation and dependency management.',
        link: '/dag/builder',
        cta: 'Open Builder',
    },
    {
        icon: '📈',
        title: 'Execution Monitor',
        description: 'Watch your workflows execute in real-time with detailed progress, logs, and statistics.',
        link: '/dag/monitor',
        cta: 'Open Monitor',
    },
    {
        icon: '⚙️',
        title: 'Skill Orchestration',
        description: 'Combine multiple skills into powerful pipelines with parallel execution and smart scheduling.',
        link: '/docs/dag/orchestration',
        cta: 'Learn More',
    },
    {
        icon: '🔍',
        title: 'Semantic Matching',
        description: 'Automatically find the best skills for your tasks using intelligent semantic matching.',
        link: '/docs/dag/registry',
        cta: 'Learn More',
    },
    {
        icon: '✅',
        title: 'Quality Assurance',
        description: 'Built-in output validation, confidence scoring, and hallucination detection.',
        link: '/docs/dag/quality',
        cta: 'Learn More',
    },
    {
        icon: '📡',
        title: 'Observability',
        description: 'Full execution tracing, performance profiling, and pattern learning for optimization.',
        link: '/docs/dag/observability',
        cta: 'Learn More',
    },
];
var EXAMPLE_WORKFLOWS = [
    {
        name: 'Code Review Pipeline',
        nodes: 4,
        description: 'Lint → Test → Security Scan → Review Report',
    },
    {
        name: 'Documentation Generator',
        nodes: 5,
        description: 'Parse Code → Extract APIs → Generate Docs → Format → Publish',
    },
    {
        name: 'Data Processing',
        nodes: 6,
        description: 'Fetch → Validate → Transform → Analyze → Visualize → Export',
    },
];
function DAGPage() {
    return (<Layout_1.default title="DAG Execution Framework" description="Build and execute intelligent skill workflows with the DAG framework">
      <div className={dag_module_css_1.default.container}>
        {/* Hero Section */}
        <div className={dag_module_css_1.default.hero}>
          <div className={dag_module_css_1.default.heroWindow}>
            <div className={dag_module_css_1.default.windowHeader}>
              <span>📊 DAG Execution Framework</span>
              <div className={dag_module_css_1.default.windowControls}>
                <span className={dag_module_css_1.default.windowButton}>_</span>
                <span className={dag_module_css_1.default.windowButton}>□</span>
              </div>
            </div>
            <div className={dag_module_css_1.default.heroContent}>
              <h1 className={dag_module_css_1.default.heroTitle}>
                Dynamic Skill Agent Graphs
              </h1>
              <p className={dag_module_css_1.default.heroSubtitle}>
                Build intelligent workflows that orchestrate skills, spawn agents,
                and solve complex problems through parallel execution.
              </p>
              <div className={dag_module_css_1.default.heroCtas}>
                <Link_1.default to="/dag/builder" className={dag_module_css_1.default.primaryCta}>
                  ➕ Create Workflow
                </Link_1.default>
                <Link_1.default to="/dag/monitor" className={dag_module_css_1.default.secondaryCta}>
                  📈 Monitor Execution
                </Link_1.default>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className={dag_module_css_1.default.section}>
          <h2 className={dag_module_css_1.default.sectionTitle}>Framework Capabilities</h2>
          <div className={dag_module_css_1.default.featuresGrid}>
            {FEATURES.map(function (feature, index) { return (<div key={index} className={dag_module_css_1.default.featureCard}>
                <div className={dag_module_css_1.default.featureHeader}>
                  <span className={dag_module_css_1.default.featureIcon}>{feature.icon}</span>
                  <span className={dag_module_css_1.default.featureTitle}>{feature.title}</span>
                </div>
                <p className={dag_module_css_1.default.featureDescription}>{feature.description}</p>
                <Link_1.default to={feature.link} className={dag_module_css_1.default.featureLink}>
                  {feature.cta} →
                </Link_1.default>
              </div>); })}
          </div>
        </section>

        {/* Architecture Overview */}
        <section className={dag_module_css_1.default.section}>
          <h2 className={dag_module_css_1.default.sectionTitle}>Architecture Layers</h2>
          <div className={dag_module_css_1.default.architectureWindow}>
            <div className={dag_module_css_1.default.windowHeader}>
              <span>📦 System Architecture</span>
            </div>
            <div className={dag_module_css_1.default.architectureContent}>
              <div className={dag_module_css_1.default.layerStack}>
                <div className={dag_module_css_1.default.layer}>
                  <div className={dag_module_css_1.default.layerLabel}>Layer 6</div>
                  <div className={dag_module_css_1.default.layerBox}>
                    <span className={dag_module_css_1.default.layerTitle}>Observability</span>
                    <span className={dag_module_css_1.default.layerItems}>
                      execution-tracer • performance-profiler • failure-analyzer • pattern-learner
                    </span>
                  </div>
                </div>
                <div className={dag_module_css_1.default.layer}>
                  <div className={dag_module_css_1.default.layerLabel}>Layer 5</div>
                  <div className={dag_module_css_1.default.layerBox}>
                    <span className={dag_module_css_1.default.layerTitle}>Feedback & Learning</span>
                    <span className={dag_module_css_1.default.layerItems}>
                      iteration-detector • feedback-synthesizer • convergence-monitor
                    </span>
                  </div>
                </div>
                <div className={dag_module_css_1.default.layer}>
                  <div className={dag_module_css_1.default.layerLabel}>Layer 4</div>
                  <div className={dag_module_css_1.default.layerBox}>
                    <span className={dag_module_css_1.default.layerTitle}>Quality Assurance</span>
                    <span className={dag_module_css_1.default.layerItems}>
                      output-validator • confidence-scorer • hallucination-detector
                    </span>
                  </div>
                </div>
                <div className={dag_module_css_1.default.layer}>
                  <div className={dag_module_css_1.default.layerLabel}>Layer 3</div>
                  <div className={dag_module_css_1.default.layerBox}>
                    <span className={dag_module_css_1.default.layerTitle}>Permission & Scoping</span>
                    <span className={dag_module_css_1.default.layerItems}>
                      permission-validator • scope-enforcer • isolation-manager
                    </span>
                  </div>
                </div>
                <div className={dag_module_css_1.default.layer}>
                  <div className={dag_module_css_1.default.layerLabel}>Layer 2</div>
                  <div className={dag_module_css_1.default.layerBox}>
                    <span className={dag_module_css_1.default.layerTitle}>Registry & Discovery</span>
                    <span className={dag_module_css_1.default.layerItems}>
                      skill-registry • semantic-matcher • capability-ranker
                    </span>
                  </div>
                </div>
                <div className={dag_module_css_1.default.layer}>
                  <div className={dag_module_css_1.default.layerLabel}>Layer 1</div>
                  <div className={dag_module_css_1.default.layerBox}>
                    <span className={dag_module_css_1.default.layerTitle}>Orchestration</span>
                    <span className={dag_module_css_1.default.layerItems}>
                      graph-builder • dependency-resolver • task-scheduler • parallel-executor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Example Workflows */}
        <section className={dag_module_css_1.default.section}>
          <h2 className={dag_module_css_1.default.sectionTitle}>Example Workflows</h2>
          <div className={dag_module_css_1.default.examplesGrid}>
            {EXAMPLE_WORKFLOWS.map(function (workflow, index) { return (<div key={index} className={dag_module_css_1.default.exampleCard}>
                <div className={dag_module_css_1.default.windowHeader}>
                  <span>📋 {workflow.name}</span>
                </div>
                <div className={dag_module_css_1.default.exampleContent}>
                  <div className={dag_module_css_1.default.exampleStats}>
                    <span>{workflow.nodes} nodes</span>
                  </div>
                  <div className={dag_module_css_1.default.exampleFlow}>
                    {workflow.description}
                  </div>
                  <Link_1.default to="/dag/builder" className={dag_module_css_1.default.exampleCta}>
                    Use Template →
                  </Link_1.default>
                </div>
              </div>); })}
          </div>
        </section>

        {/* Getting Started */}
        <section className={dag_module_css_1.default.section}>
          <div className={dag_module_css_1.default.gettingStartedWindow}>
            <div className={dag_module_css_1.default.windowHeader}>
              <span>🚀 Getting Started</span>
            </div>
            <div className={dag_module_css_1.default.gettingStartedContent}>
              <div className={dag_module_css_1.default.stepsList}>
                <div className={dag_module_css_1.default.step}>
                  <span className={dag_module_css_1.default.stepNumber}>1</span>
                  <div className={dag_module_css_1.default.stepContent}>
                    <strong>Create a Workflow</strong>
                    <p>Use the visual builder to create your execution graph by adding nodes and dependencies.</p>
                  </div>
                </div>
                <div className={dag_module_css_1.default.step}>
                  <span className={dag_module_css_1.default.stepNumber}>2</span>
                  <div className={dag_module_css_1.default.stepContent}>
                    <strong>Configure Skills</strong>
                    <p>Select skills for each node and configure input/output mappings between them.</p>
                  </div>
                </div>
                <div className={dag_module_css_1.default.step}>
                  <span className={dag_module_css_1.default.stepNumber}>3</span>
                  <div className={dag_module_css_1.default.stepContent}>
                    <strong>Execute & Monitor</strong>
                    <p>Run your workflow and monitor execution in real-time with detailed logs and stats.</p>
                  </div>
                </div>
                <div className={dag_module_css_1.default.step}>
                  <span className={dag_module_css_1.default.stepNumber}>4</span>
                  <div className={dag_module_css_1.default.stepContent}>
                    <strong>Iterate & Improve</strong>
                    <p>Use observability insights to optimize your workflows based on performance patterns.</p>
                  </div>
                </div>
              </div>
              <div className={dag_module_css_1.default.gettingStartedCta}>
                <Link_1.default to="/dag/builder" className={dag_module_css_1.default.primaryCta}>
                  Start Building →
                </Link_1.default>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout_1.default>);
}

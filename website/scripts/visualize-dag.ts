#!/usr/bin/env npx tsx
/**
 * DAG Execution Plan Visualizer
 *
 * Creates a beautiful ASCII visualization of a DAG execution plan:
 * - DAG structure (nodes, edges, dependencies)
 * - Wave-based execution plan
 * - Conflict detection (file locks, singleton tasks)
 * - Skill matches with confidence scores
 * - Execution time estimation
 * - Parallelization opportunities
 *
 * Usage:
 *   npx tsx scripts/visualize-dag.ts "<your task description>"
 *
 * Or use a predefined example:
 *   npx tsx scripts/visualize-dag.ts --example saas
 *
 * Requires:
 *   - ANTHROPIC_API_KEY (for task decomposition)
 *   - OPENAI_API_KEY (for semantic/hybrid matching)
 */

import { TaskDecomposer, loadAvailableSkills } from '../src/dag';
import { ClaudeCodeRuntime } from '../src/dag/runtimes/claude-code-cli';
import { STANDARD_PERMISSIONS } from '../src/dag/permissions/presets';
import { ConflictDetector } from '../src/dag/coordination/conflict-detector';
import { getSharedSingletonCoordinator } from '../src/dag/coordination/singleton-task-coordinator';
import type { DAG, NodeId } from '../src/dag/types';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Example tasks
const EXAMPLES = {
  saas: 'Build a modern SaaS application with user authentication, PostgreSQL database, REST API, React frontend, and CI/CD pipeline',
  blog: 'Create a personal blog with markdown support, syntax highlighting, dark mode, and SEO optimization',
  analytics: 'Build a real-time analytics dashboard with data visualization, user tracking, and export functionality',
  ecommerce: 'Develop an e-commerce platform with product catalog, shopping cart, payment integration, and order management',
};

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function renderBox(title: string, content: string[], width: number = 80): string {
  const top = '┌─ ' + title + ' ' + '─'.repeat(width - title.length - 4) + '┐';
  const bottom = '└' + '─'.repeat(width - 2) + '┘';

  const lines = [top];
  for (const line of content) {
    const padding = ' '.repeat(Math.max(0, width - line.length - 4));
    lines.push(`│ ${line}${padding} │`);
  }
  lines.push(bottom);

  return lines.join('\n');
}

function renderWave(
  waveNumber: number,
  totalWaves: number,
  nodeIds: string[],
  parallelizable: boolean,
  taskCalls: any,
  dag: DAG,
  skills: any[]
): string {
  const lines: string[] = [];

  const header = `Wave ${waveNumber + 1}/${totalWaves} ${parallelizable ? colorize('(PARALLEL)', 'green') : colorize('(SEQUENTIAL)', 'yellow')}`;
  lines.push(colorize(header, 'bold'));
  lines.push(colorize('─'.repeat(60), 'dim'));

  for (const nodeId of nodeIds) {
    const node = dag.nodes.get(nodeId);
    const taskCall = taskCalls[nodeId];
    const skill = skills.find(s => s.id === node?.skillId);

    lines.push('');
    lines.push(colorize(`  ${nodeId}`, 'cyan'));

    if (skill) {
      lines.push(`    Skill: ${skill.name}`);
      lines.push(`    Agent: ${taskCall.subagent_type} (${taskCall.model})`);
    } else {
      lines.push(`    Agent: ${taskCall.subagent_type} (${taskCall.model})`);
    }

    if (node?.dependencies && node.dependencies.length > 0) {
      lines.push(colorize(`    Depends on: ${node.dependencies.join(', ')}`, 'dim'));
    }
  }

  return lines.join('\n');
}

function renderDependencyGraph(dag: DAG): string {
  const lines: string[] = [];

  lines.push(colorize('DAG Dependency Graph:', 'bold'));
  lines.push(colorize('─'.repeat(60), 'dim'));
  lines.push('');

  // Build adjacency list
  const adjacency = new Map<NodeId, NodeId[]>();
  for (const [from, tos] of dag.edges) {
    if (!adjacency.has(from)) {
      adjacency.set(from, []);
    }
    adjacency.get(from)!.push(...tos);
  }

  // Render each node with its children
  for (const [nodeId, node] of dag.nodes) {
    const children = adjacency.get(nodeId) || [];

    lines.push(colorize(`  ${nodeId}`, 'cyan'));

    if (children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        const isLast = i === children.length - 1;
        const prefix = isLast ? '    └─→ ' : '    ├─→ ';
        lines.push(colorize(prefix + children[i], 'dim'));
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let task: string;

  if (args.length === 0) {
    console.error(colorize('Usage:', 'red'));
    console.error('  npx tsx scripts/visualize-dag.ts "<task description>"');
    console.error('  npx tsx scripts/visualize-dag.ts --example <name>');
    console.error('');
    console.error('Examples:');
    for (const [name, description] of Object.entries(EXAMPLES)) {
      console.error(`  ${name}: ${description}`);
    }
    process.exit(1);
  }

  if (args[0] === '--example') {
    const exampleName = args[1] as keyof typeof EXAMPLES;
    if (!EXAMPLES[exampleName]) {
      console.error(colorize(`Unknown example: ${exampleName}`, 'red'));
      console.error('Available examples:', Object.keys(EXAMPLES).join(', '));
      process.exit(1);
    }
    task = EXAMPLES[exampleName];
  } else {
    task = args.join(' ');
  }

  // Verify API keys
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey) {
    console.error(colorize('ERROR: ANTHROPIC_API_KEY not found in .env', 'red'));
    process.exit(1);
  }

  console.log('');
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log(colorize(' DAG EXECUTION PLAN VISUALIZER', 'bold'));
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log('');

  // Load skills
  const skills = loadAvailableSkills();
  console.log(colorize(`📚 Loaded ${skills.length} skills`, 'green'));
  console.log('');

  // Show task
  console.log(colorize('📝 Task:', 'bold'));
  console.log(colorize(`   ${task}`, 'cyan'));
  console.log('');

  // Decompose task
  console.log(colorize('⏳ Decomposing task...', 'yellow'));

  const decomposer = new TaskDecomposer({
    apiKey: anthropicKey,
    availableSkills: skills,
    model: 'claude-sonnet-4-5-20250929',
    matcherConfig: openaiKey ? {
      strategy: 'hybrid',
      openAiApiKey: openaiKey,
    } : {
      strategy: 'keyword',
    },
  });

  const startDecompose = Date.now();
  const { decomposition, matches, dag } = await decomposer.decomposeToDAG(task);
  const decomposeTime = Date.now() - startDecompose;

  console.log(colorize(`✅ Decomposed in ${decomposeTime}ms`, 'green'));
  console.log('');

  // Generate execution plan
  console.log(colorize('⏳ Generating execution plan...', 'yellow'));

  const runtime = new ClaudeCodeRuntime({
    permissions: STANDARD_PERMISSIONS,
    defaultModel: 'sonnet',
  });

  const plan = runtime.generateExecutionPlan(dag);

  if (plan.error) {
    console.error(colorize(`❌ Planning failed: ${plan.error}`, 'red'));
    process.exit(1);
  }

  console.log(colorize(`✅ Generated ${plan.totalWaves} execution waves`, 'green'));
  console.log('');

  // Section 1: Overview
  console.log('');
  console.log(renderBox('OVERVIEW', [
    `Strategy: ${decomposition.strategy}`,
    `Complexity: ${decomposition.complexity}/10`,
    ``,
    `Subtasks: ${decomposition.subtasks.length}`,
    `DAG Nodes: ${dag.nodes.size}`,
    `DAG Edges: ${dag.edges.size}`,
    ``,
    `Execution Waves: ${plan.totalWaves}`,
    `Max Parallelism: ${Math.max(...plan.waves.map(w => w.nodeIds.length))} tasks`,
    ``,
    `Matching Strategy: ${openaiKey ? 'Hybrid (keyword + semantic)' : 'Keyword only'}`,
    `Average Confidence: ${(matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length * 100).toFixed(0)}%`,
  ]));
  console.log('');

  // Section 2: Skill Matches
  console.log('');
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log(colorize(' SKILL MATCHES', 'bold'));
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log('');

  for (const match of matches) {
    const subtask = decomposition.subtasks.find(st => st.id === match.subtaskId);
    const skill = skills.find(s => s.id === match.skillId);
    const confidencePercent = (match.confidence * 100).toFixed(0);
    const confidenceColor = match.confidence >= 0.7 ? 'green' : match.confidence >= 0.4 ? 'yellow' : 'red';

    console.log(colorize(`${match.subtaskId}:`, 'cyan'));
    console.log(`  Subtask: ${subtask?.description || 'N/A'}`);
    console.log(`  Skill: ${skill?.name || match.skillId}`);
    console.log(`  Confidence: ${colorize(confidencePercent + '%', confidenceColor)}`);
    console.log(colorize(`  Reasoning: ${match.reasoning}`, 'dim'));
    console.log('');
  }

  // Section 3: Dependency Graph
  console.log('');
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log(colorize(' DEPENDENCY GRAPH', 'bold'));
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log('');
  console.log(renderDependencyGraph(dag));

  // Section 4: Execution Plan
  console.log('');
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log(colorize(' EXECUTION PLAN', 'bold'));
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log('');

  const singletonCoordinator = getSharedSingletonCoordinator();

  for (const wave of plan.waves) {
    console.log(renderWave(
      wave.waveNumber,
      plan.totalWaves,
      wave.nodeIds,
      wave.parallelizable,
      wave.taskCalls,
      dag,
      skills
    ));

    // Check for conflicts
    if (wave.parallelizable && wave.nodeIds.length > 1) {
      const analysis = ConflictDetector.analyzeWave(dag, wave.nodeIds);

      if (analysis.conflicts.length > 0) {
        console.log('');
        console.log(colorize('    ⚠️  Conflicts Detected:', 'red'));

        for (const conflict of analysis.conflicts) {
          if (conflict.type === 'file') {
            console.log(colorize(`       File: ${conflict.filePath}`, 'red'));
            console.log(colorize(`       Nodes: ${conflict.nodeIds.join(', ')}`, 'red'));
          } else if (conflict.type === 'singleton') {
            console.log(colorize(`       Singleton: ${conflict.singletonType}`, 'yellow'));
            console.log(colorize(`       Nodes: ${conflict.nodeIds.join(', ')}`, 'yellow'));
          }
        }

        if (analysis.remediation) {
          console.log('');
          console.log(colorize('    💡 Remediation:', 'cyan'));
          console.log(colorize(`       ${analysis.remediation}`, 'cyan'));
        }
      }
    }

    console.log('');
    console.log('');
  }

  // Section 5: Performance Analysis
  console.log('');
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log(colorize(' PERFORMANCE ANALYSIS', 'bold'));
  console.log(colorize('═'.repeat(80), 'bold'));
  console.log('');

  const totalNodes = plan.totalNodes;
  const parallelWaves = plan.waves.filter(w => w.parallelizable && w.nodeIds.length > 1).length;
  const sequentialWaves = plan.totalWaves - parallelWaves;
  const maxParallelism = Math.max(...plan.waves.map(w => w.nodeIds.length));

  // Calculate theoretical speedup
  const sequentialTime = totalNodes;
  const parallelTime = plan.waves.reduce((sum, wave) => {
    return sum + (wave.parallelizable ? 1 : wave.nodeIds.length);
  }, 0);
  const speedup = sequentialTime / parallelTime;

  console.log(renderBox('EXECUTION METRICS', [
    `Total Nodes: ${totalNodes}`,
    `Total Waves: ${plan.totalWaves}`,
    `  - Parallel Waves: ${parallelWaves}`,
    `  - Sequential Waves: ${sequentialWaves}`,
    ``,
    `Max Parallelism: ${maxParallelism} tasks at once`,
    ``,
    `Theoretical Speedup: ${colorize(speedup.toFixed(2) + 'x', 'green')}`,
    `  - Sequential: ${sequentialTime} time units`,
    `  - Parallel: ${parallelTime} time units`,
  ]));
  console.log('');

  // Summary
  console.log(colorize('✨ Visualization complete!', 'green'));
  console.log('');
}

main().catch(error => {
  console.error('\n' + colorize('❌ Error:', 'red'), error.message);
  if (error.stack) {
    console.error('\n' + colorize('Stack trace:', 'dim'));
    console.error(error.stack);
  }
  process.exit(1);
});

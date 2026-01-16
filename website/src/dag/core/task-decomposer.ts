/**
 * Task Decomposer
 *
 * Takes arbitrary natural language tasks and decomposes them into
 * executable DAGs by analyzing requirements and matching to available skills.
 */

import type { DAG, NodeId } from '../types';
import { dag } from './builder';
import Anthropic from '@anthropic-ai/sdk';
import { SkillMatcher, type MatcherConfig } from './skill-matcher';

/**
 * A subtask identified during decomposition
 */
export interface Subtask {
  /** Unique identifier for this subtask */
  id: string;

  /** Human-readable description of what needs to be done */
  description: string;

  /** The prompt that will be given to the agent */
  prompt: string;

  /** IDs of subtasks this depends on (empty array = no dependencies) */
  dependencies: string[];

  /** Required capabilities (e.g., "web-search", "code-generation", "design") */
  requiredCapabilities: string[];

  /** Input mappings from dependent tasks */
  inputs?: Array<{ from: string; key: string }>;

  /** Predicted files this task will modify (for conflict detection) */
  predictedFiles?: string[];

  /** If this is a singleton task (build/lint/test), what type */
  singletonType?: 'build' | 'lint' | 'test' | 'typecheck' | 'install' | 'deploy' | null;
}

/**
 * Result of task decomposition
 */
export interface DecompositionResult {
  /** The original task */
  originalTask: string;

  /** Decomposed subtasks */
  subtasks: Subtask[];

  /** Overall strategy/reasoning */
  strategy: string;

  /** Estimated complexity (1-10) */
  complexity: number;

  /** Expected outputs */
  outputs: Array<{ name: string; from: string }>;
}

/**
 * A matched skill for a subtask
 */
export interface SkillMatch {
  /** Subtask this skill is matched to */
  subtaskId: string;

  /** Skill ID (e.g., "comprehensive-researcher") */
  skillId: string;

  /** Match confidence (0-1) */
  confidence: number;

  /** Why this skill was chosen */
  reasoning: string;
}

/**
 * Configuration for task decomposition
 */
export interface DecomposerConfig {
  /** Anthropic API key */
  apiKey?: string;

  /** Model to use for decomposition */
  model?: string;

  /** Available skills to match against */
  availableSkills: Array<{
    id: string;
    name: string;
    description: string;
    categories: string[];
    tags: string[];
  }>;

  /** Max subtasks to generate (prevents over-decomposition) */
  maxSubtasks?: number;

  /** Temperature for Claude calls */
  temperature?: number;

  /** Skill matching configuration */
  matcherConfig?: Partial<MatcherConfig>;
}

/**
 * TaskDecomposer - Breaks down arbitrary tasks into executable DAGs
 */
export class TaskDecomposer {
  private client: Anthropic;
  private config: Required<DecomposerConfig>;
  private matcher: SkillMatcher;

  constructor(config: DecomposerConfig) {
    this.config = {
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
      model: config.model || 'claude-sonnet-4-5-20250929',
      availableSkills: config.availableSkills,
      maxSubtasks: config.maxSubtasks || 10,
      temperature: config.temperature || 0.7,
      matcherConfig: config.matcherConfig || {},
    };

    if (!this.config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY required for TaskDecomposer');
    }

    this.client = new Anthropic({ apiKey: this.config.apiKey });
    this.matcher = new SkillMatcher(this.config.matcherConfig);
  }

  /**
   * Decompose a natural language task into subtasks
   */
  async decompose(task: string): Promise<DecompositionResult> {
    const systemPrompt = this.buildDecompositionPrompt();

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: task,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    return this.parseDecomposition(task, content.text);
  }

  /**
   * Match subtasks to available skills using the configured matcher
   */
  async matchSkills(decomposition: DecompositionResult): Promise<SkillMatch[]> {
    const matches: SkillMatch[] = [];

    for (const subtask of decomposition.subtasks) {
      const match = await this.matcher.findBestMatch(
        subtask,
        this.config.availableSkills
      );
      matches.push(match);
    }

    return matches;
  }

  /**
   * Build a DAG from decomposition and skill matches
   */
  buildDAG(
    decomposition: DecompositionResult,
    matches: SkillMatch[]
  ): DAG {
    const builder = dag(`task-${Date.now()}`);

    // Add nodes
    for (const match of matches) {
      const subtask = decomposition.subtasks.find(st => st.id === match.subtaskId);
      if (!subtask) continue;

      let nodeBuilder = builder
        .skillNode(subtask.id, match.skillId)
        .prompt(subtask.prompt);

      // Add dependencies
      if (subtask.dependencies.length > 0) {
        nodeBuilder = nodeBuilder.dependsOn(...(subtask.dependencies as NodeId[]));
      }

      nodeBuilder.done();
    }

    // Add outputs
    for (const output of decomposition.outputs) {
      builder.outputs({ name: output.name, from: output.from as NodeId });
    }

    return builder.build();
  }

  /**
   * Full pipeline: decompose → match → build DAG
   */
  async decomposeToDAG(task: string): Promise<{
    decomposition: DecompositionResult;
    matches: SkillMatch[];
    dag: DAG;
  }> {
    const decomposition = await this.decompose(task);
    const matches = await this.matchSkills(decomposition);
    const generatedDag = this.buildDAG(decomposition, matches);

    return { decomposition, matches, dag: generatedDag };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build the system prompt for task decomposition
   */
  private buildDecompositionPrompt(): string {
    return `You are a task decomposition expert. Your job is to break down complex tasks into subtasks that can be executed by specialized AI agents.

Available skills:
${this.config.availableSkills.map(s => `- ${s.id}: ${s.description}`).join('\n')}

When given a task, analyze it and respond with a JSON object containing:
{
  "strategy": "Brief explanation of the decomposition approach",
  "complexity": 1-10 rating,
  "subtasks": [
    {
      "id": "unique-id",
      "description": "What this subtask does",
      "prompt": "The actual prompt for the agent",
      "dependencies": ["id-of-prerequisite-task"],
      "requiredCapabilities": ["web-search", "code-generation", etc],
      "predictedFiles": ["src/components/Header.tsx", "src/styles/header.css"],
      "singletonType": null | "build" | "lint" | "test" | "typecheck" | "install" | "deploy"
    }
  ],
  "outputs": [
    { "name": "output-key", "from": "subtask-id" }
  ]
}

Guidelines:
1. Break tasks into 2-${this.config.maxSubtasks} subtasks (don't over-decompose)
2. Identify clear dependencies (what must happen before what)
3. Make prompts specific and actionable
4. List required capabilities to help match skills
5. Define clear outputs that capture the final result
6. **CRITICAL**: Predict which files each subtask will modify in "predictedFiles"
   - Be specific (e.g., "src/components/Header.tsx" not "components")
   - Include all files the agent might create/modify
   - Leave empty [] if task only reads files or does research
7. **CRITICAL**: Set "singletonType" if task is build/lint/test/typecheck/install/deploy
   - These operations should only run once at a time across all agents
   - Examples: "npm run build" → "build", "eslint ." → "lint"
   - Set to null for normal tasks

File Conflict Prevention:
- If two subtasks modify THE SAME FILE, they MUST be sequential (add dependency)
- If subtasks modify DIFFERENT FILES, they CAN be parallel (no dependency)
- Example: Both "add-header" and "add-footer" modify "src/App.tsx" → make sequential
- Example: "add-header" modifies "Header.tsx", "add-footer" modifies "Footer.tsx" → can be parallel

Respond ONLY with valid JSON, no markdown formatting.`;
  }

  /**
   * Parse Claude's decomposition response
   */
  private parseDecomposition(task: string, response: string): DecompositionResult {
    try {
      // Strip markdown code blocks if present
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        originalTask: task,
        subtasks: parsed.subtasks || [],
        strategy: parsed.strategy || '',
        complexity: parsed.complexity || 5,
        outputs: parsed.outputs || [],
      };
    } catch (error) {
      throw new Error(`Failed to parse decomposition: ${error.message}\n\nResponse:\n${response}`);
    }
  }

  // Skill matching logic has been moved to skill-matcher.ts
  // This provides a more sophisticated matching system with multiple strategies
}

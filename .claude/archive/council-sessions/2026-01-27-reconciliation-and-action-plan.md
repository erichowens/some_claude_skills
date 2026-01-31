# The Great Reconciliation: DAG Orchestration & WinDAGs Launch

**Date**: 2026-01-27
**Session**: Council Session #001 Follow-up
**Topic**: Reconciling some_claude_skills + workgroup-ai + Launch Strategy

---

## The Sibling Projects

You have two complementary codebases:

### some_claude_skills/
- **Purpose**: Gallery & Documentation
- **Contains**: 143+ Skills (source of truth), Win31 Website, Platform Features Doc, Semantic Matcher code, DAG Visualization
- **Status**: Documentation-rich but no runtime

### workgroup-ai/ (WinDAGs)
- **Purpose**: Runtime Engine
- **Contains**: Same 143+ Skills, Win31 Control Center, ProcessExecutor, WorktreeExecutor, Phase Orchestration
- **Status**: Implementation-rich but halted

**Key Insight:** WinDAGs IS the runtime you were seeking. It has:
- ✅ `ProcessExecutor` — spawns `claude -p` processes (zero token overhead)
- ✅ `WorktreeExecutor` — git worktree isolation for parallel file safety
- ✅ `PhaseOrchestrator` — dynamic DAG evolution (research → plan → build)
- ✅ Quality tracking with confidence self-assessment
- ✅ Approval gates for human-in-the-loop
- ✅ Recurrent nodes for iteration loops

**The Joy Got Lost Because:** The codebase grew complex with enterprise patterns but paused before reaching "magic just works."

---

## MCP Server vs. Slash Command

| Aspect | Slash Command (`/dag`) | MCP Server |
|--------|----------------------|------------|
| **Invocation** | User types `/dag build a landing page` | Tool call in Claude's tool palette |
| **Persistence** | Session-only | Persistent service |
| **Multi-session** | No | Yes |
| **State** | TodoWrite for tracking | Full database access |
| **Complexity** | Skill file + script | Node.js server + stdio |
| **Best For** | Quick automation, learning | Production workflows, external integrations |

**Recommendation:** Start with slash command, graduate to MCP server when you need persistence.

---

## Using Haiku/Sonnet on DAG Skills as Agents

**YES — This is exactly how it should work!**

```typescript
// dag-graph-builder as agent
const graphBuilderAgent = await Task({
  description: "Build DAG for landing page",
  subagent_type: "dag-graph-builder",  // Skill acts as agent "personality"
  model: "haiku",  // Cheap, fast
  prompt: "Decompose 'build a landing page' into a DAG workflow"
});
```

**The Pattern:**
1. **Skill = Knowledge** — SKILL.md contains domain expertise
2. **Model = Execution** — Haiku/Sonnet/Opus provides reasoning
3. **Task tool = Runtime** — Claude Code's native parallelization

**Your 24 DAG skills become a meta-orchestra:**
- `dag-graph-builder` (Haiku) — Decomposes tasks
- `dag-semantic-matcher` (Haiku) — Matches skills to nodes
- `dag-executor` (Sonnet) — Orchestrates execution
- `dag-confidence-scorer` (Haiku) — Rates outputs

**The magic:** Let Haiku be 80% of your agents, Sonnet for complex reasoning, Opus for critical decisions.

---

## Hardening Skills Through Execution

### Available Datasets

| Dataset | What It Has | Value |
|---------|-------------|-------|
| **SWE-bench** | 2,294 GitHub issues | Code task decomposition |
| **HumanEval / MBPP** | Python problems | Function-level tasks |
| **APPS** | 10,000 coding problems | Algorithmic decomposition |
| **BigCodeBench** | 1,140 practical tasks | Real-world tool-using |
| **TaskBench** | Multi-step task graphs | Most relevant for DAG |

### The Hardening Loop

```
1. EXECUTE: Skill → Agent → Output
2. JUDGE: Self-confidence, downstream rating, LLM-as-judge, human review
3. LOG: SkillChangelog tracks all metrics
4. ANALYZE: SkillImprover identifies patterns
5. EVOLVE: A/B test, promote improvements, deprecate failures
```

### Tournament Format

```yaml
tournament:
  name: "Landing Page Build-Off"
  task: "Build a responsive landing page"
  teams:
    - name: "Team Conservative"
      skills: [research-analyst, web-design-expert, technical-writer]
      model: sonnet
    - name: "Team Aggressive"
      skills: [ai-engineer, design-system-creator, fullstack-debugger]
      model: haiku
  evaluation:
    judges:
      - type: llm (opus)
      - type: human
    metrics: [total_tokens, execution_time, iteration_count, confidence]
  rounds: 5
```

---

## Skills To Create

### Tier 1: Core Infrastructure
| Skill | Purpose |
|-------|---------|
| **dag-memory-bridge** | Persist DAG state between sessions |
| **agent-memory-system** | Persistent memory (RAG + vector) |
| **dag-context-optimizer** | Share context between agents |
| **dag-auto-retrier** | Failure recovery with backoff |

### Tier 2: Quality & Feedback
| Skill | Purpose |
|-------|---------|
| **dag-cost-estimator** | Predict token/time costs |
| **dag-event-emitter** | Publish execution events |
| **auto-prompt-optimizer** | DSPy-style improvement |

### Tier 3: Ecosystem Integration
| Skill | Purpose |
|-------|---------|
| **langchain-integration** | Connect to LangGraph |
| **temporal-workflow-patterns** | Durable execution |
| **tool-composition-engine** | Dynamic tool combining |

---

## Competitive Differentiator

**Your Differentiator Is NOT DAGs.** LangGraph has better DAGs.

**Your Differentiator IS:**
1. **Curated Skills + Automatic Orchestration** — No one else combines them
2. **Zero-Code UX** — Natural language → DAG
3. **Claude Code Native** — Task tool, ProcessExecutor, worktrees
4. **Quality Feedback Loop** — Skills improve from execution
5. **Win31 Aesthetic** — Memorable brand identity

### Competitive Position

```
        High Curation
             ↑
  GPT Store  │         ★ YOU (WinDAGs)
  (100K GPTs,│        (143 curated + DAG + Zero-code)
  no orch)   │
─────────────┼─────────────────────────────────────
             │                    LangGraph
  SkillsMP   │                   (Build from scratch)
(Directory)  │                    CrewAI
             ↓                   (Role-based Python)
        Low Curation
```

### Skills Outside Claude

**Partially portable.** Skills are markdown files that can convert to:
- OpenAI Custom GPTs
- LangChain agents
- CrewAI roles

**Not portable:** allowed-tools, pairs-with relationships, Task tool integration

---

## The Reconciliation Plan

### Step 1: Merge the Joy
- Joy/ideation in some_claude_skills (Founding Council, vision, docs)
- Execution muscle in workgroup-ai (ProcessExecutor, PhaseOrchestrator)
- Action: Import workgroup-ai/packages/core as runtime

### Step 2: Build `/dag` Command
1. Takes natural language task
2. Calls task-decomposer.ts
3. Uses skill-matcher.ts
4. Generates wave execution plan
5. Issues parallel Task calls
6. Aggregates results

### Step 3: Activate Phase Orchestration
```
Phase 1: RESEARCH (concrete DAG)
Phase 2: PLAN (generated from Phase 1)
Phase 3: BUILD (recurrent: implement → test → review)
Phase 4: POLISH (final check + approval)
```

### Step 4: Close the Feedback Loop
- Log every skill execution
- Track downstream quality scores
- Generate improvement suggestions
- Surface underperforming skills

---

## Priority Action Items

### 🔥 IMMEDIATE (This Week)
1. Build `/dag` slash command
2. Wire ProcessExecutor from workgroup-ai
3. Create dag-memory-bridge skill

### 📅 SHORT-TERM (This Month)
4. Activate PhaseOrchestrator
5. Build skill embedding index
6. Create tournament/hardening loop
7. Wire SkillChangelog feedback

### 🎯 MEDIUM-TERM (Quarter)
8. Build MCP server for dag-runtime
9. Create 10 new skills
10. Launch windags.ai with gallery + execution

---

*Archived by The Archivist*
*Transmitted by The Liaison*
*2026-01-27*

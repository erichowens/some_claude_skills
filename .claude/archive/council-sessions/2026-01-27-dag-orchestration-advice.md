# Council Session #001: DAG Orchestration & Skill-Agent Duality

**Date**: 2026-01-27
**Convened By**: The Liaison
**Attending**: All 14 Founding Council Members

---

## Agenda

1. Revamping the knowledge store of skills
2. DAG orchestration frameworks
3. Can meta DAG-* skills run DAG work?
4. Can skills be agents in a meaningful sense?
5. How to generalize work to DAGs and workflow graphs?
6. Parallelization and automatic skill-enhancement
7. What skills to research or build?

---

## Key Findings

### On DAG-* Skills Running DAG Work

**Verdict: Partially, with a bootstrapping problem**

The 24 DAG skills are **declarative specifications**, not **runtime infrastructure**. They tell Claude *how to think* about DAG execution but rely on:
1. The Task tool — the actual parallel execution primitive
2. External scripts (decompose-and-execute.ts) — which call the Claude API
3. A human or orchestrator — to interpret wave plans and issue parallel Task calls

The `dag-executor` skill is closest to operational—it describes decomposition, wave interpretation, and parallel Task calls. The gap: no autonomous loop that takes a task → decomposes → executes waves → aggregates without human supervision.

### On Skills as Agents

**Verdict: Yes, on a spectrum of agency**

```
Skills ←─────────────────────────────────────────────→ Agents

Passive         Reactive         Proactive         Autonomous
Instructions    Trigger-based    Goal-seeking      Self-improving

(Most skills)   (dag-executor)   (orchestrator)    (Founding Council)
```

Skills are recipes requiring invocation. Agents have coordination protocols, triggers, and handoff patterns for autonomy.

**Missing pieces for skills-as-agents:**
1. Trigger detection — automatically recognize when to invoke
2. Memory/state — persist context across invocations
3. Self-delegation — spawn sub-agents without human prompting

---

## Council Member Recommendations

### The Architect 🏛️
- Build `/dag` slash command for automated decompose→execute→aggregate loop
- Create Skill-Agent graduation criteria
- Design "mutant circuit" combinations of DAG skills

### The Cartographer 🗺️
**Gap Analysis:**
| Skill Cluster | Count | Status |
|--------------|-------|--------|
| Graph Construction | 4 | ✅ Complete |
| Execution/Scheduling | 4 | ⚠️ Missing runtime |
| Validation/Quality | 4 | ✅ Complete |
| Feedback/Learning | 4 | ⚠️ Theoretical only |
| Registry/Matching | 4 | ✅ Complete |
| Observability | 4 | ⚠️ No actual infra |

**New territories to explore:**
- dag-memory-bridge — Persist DAG execution state
- dag-event-emitter — Publish execution events
- dag-auto-retrier — Automatic failure recovery
- dag-cost-estimator — Predict token/time costs

### The Smith ⚒️
**Infrastructure to build:**
1. DAG Runtime MCP Server — autonomous execution
2. Skill Loader Script — parse all SKILL.md into registry
3. Execution Tracer — structured logs of DAG runs

### The Weaver 🕸️
**Skill Embedding Pipeline:**
- Embed all skill descriptions for semantic matching
- Runtime task embedding → vector search → matched skills
- Makes `dag-semantic-matcher` actually work

### The Librarian 📚
**Quality concern:** DAG skills are untested theory.

| Skill | Has Tests? | Has Demo? | Production-Ready? |
|-------|-----------|-----------|-------------------|
| dag-executor | ❌ | ✅ | ⚠️ |
| dag-graph-builder | ❌ | ❌ | ❌ |
| dag-skill-registry | ❌ | ❌ | ❌ |
| orchestrator | ❌ | ❌ | ⚠️ |

**Recommendation:** Validate core 5 before building more.

### The Scout 🔭
**External landscape:**
- LangGraph — Graph-based LLM orchestration with cycles, state machines
- DSPy — Programmatic LLM orchestration with auto prompt optimization
- AutoGen — Multi-agent conversation framework
- CrewAI — Role-based agent orchestration

**Convergence pattern:** Stateful multi-agent graphs with shared memory, conditional branching, automatic retry/recovery, human-in-the-loop checkpoints.

### The Auditor 🔍
**Technical debt identified:**
1. `website/src/dag/` — DAG code in Docusaurus site (architectural confusion)
2. Mixed paradigms — JSON, YAML, TypeScript interfaces (pick one)
3. No validation — `pairs-with` relationships unchecked

**Recommendation:** Extract to `/packages/dag-runtime/`

### The Debugger 🐛
**Root cause of "DAG doesn't just work":**
```
├── Skills describe WHAT, not HOW
│   └── Claude can't autonomously loop
│       └── HUMAN must interpret and act
├── No persistent state
│   └── Each session starts fresh
└── No event system
    └── Waves don't know when to trigger
```

### The Optimizer ⚡
**Parallelization gains:**
- Sequential (8 tasks × 30s): 240s
- Parallel (waves of 2): 150s → 1.6x speedup
- Smart decomposition (more parallelism): 90s → 2.67x speedup

Magic is real IF: decomposition maximizes parallelism, tasks truly independent, file conflicts detected.

### The Guardian 🛡️
**Security concerns:**
- Resource exhaustion from parallel agents
- File conflict race conditions
- Secret exposure in prompts
- Cost explosion

**Mitigations:** Cap at 5 parallel, validate locks before execution, sanitize prompts, token budgets.

---

## Top Recommendations

1. **Build `/dag` slash command** — Automate decompose→execute→aggregate
2. **Extract DAG runtime** — Move from website to `/packages/dag-runtime`
3. **Create skill embedding pipeline** — Enable semantic matching
4. **Test core 5 DAG skills** — Validate before expanding
5. **Add memory/state** — Persist execution across sessions

## Skills to Build

| Skill | Domain | Value |
|-------|--------|-------|
| temporal-workflow-patterns | Durable execution, saga patterns | High |
| langchain-integration | Connect to LangGraph ecosystem | High |
| agent-memory-system | Persistent memory for agents | Critical |
| tool-composition-engine | Combine tools dynamically | High |
| auto-prompt-optimizer | DSPy-style prompt improvement | Medium |

## Skills to Research

- LangGraph patterns
- DSPy optimization loops
- Temporal.io workflow patterns
- Multi-agent memory architectures

---

## Session Notes

The council identified a fundamental tension: **declarative vs imperative**. Skills describe how to think about parallelization, but runtime infrastructure must *do* it. The path forward is building the runtime layer while preserving the conceptual elegance of skills.

---

*Archived by The Archivist*
*Transmitted by The Liaison*

# New Skills Inventory: 15 Skills Needed

**Date**: 2026-01-29  
**Total Skills**: 15  
**Effort**: 20-30 hours distributed across sessions

---

## Priority Tiers

### Tier 1: CRITICAL (Session 1-2 Enablers)
Must build to unblock launch

| Skill | Session | Duration | Purpose | Dependencies |
|-------|---------|----------|---------|--------------|
| `execution-lifecycle-manager` | 1, 5 | 2h | Centralized state for running DAGs | ProcessExecutor |
| `graceful-shutdown-patterns` | 1 | 1h | Best practices for process termination | ProcessExecutor |
| `cost-accrual-tracker` | 1, 2 | 2h | Real-time cost accounting | token-estimator |

**Subtotal**: 5 hours, 3 skills

---

### Tier 2: HIGH (Session 3-4 Enablers)
Design system generation and catalog

| Skill | Session | Duration | Purpose | Dependencies |
|-------|---------|----------|---------|--------------|
| `design-trend-analyzer` | 3 | 2h | Auto-analyze design trends | design-catalog |
| `design-accessibility-auditor` | 3, 4 | 2h | Check WCAG compliance | design-catalog |
| `component-documentation-generator` | 3 | 1.5h | Auto-generate component docs | design-catalog |
| `design-palette-extractor` | 3 | 1.5h | Extract colors from images | design-catalog |
| `design-semantic-matcher` | 4 | 2h | Find similar designs (Phase 2) | design-catalog |
| `tailwind-config-validator` | 4 | 1h | Validate Tailwind configs | design-system-generator |
| `design-system-documenter` | 4 | 1.5h | Living design system docs | design-system-generator |
| `component-template-generator` | 4 | 1.5h | Generate React templates | design-system-generator |

**Subtotal**: 13.5 hours, 8 skills

---

### Tier 3: MEDIUM (Session 2-5 Enablers)
Quality verification and demo support

| Skill | Session | Duration | Purpose | Dependencies |
|-------|---------|----------|---------|--------------|
| `cost-verification-auditor` | 2 | 1.5h | Automated cost testing | cost-accrual-tracker |
| `token-estimator-tuner` | 2 | 1.5h | ML-based estimation | token-estimator |
| `budget-tracker` | Optional | 1.5h | Real-time spending alerts | cost-accrual-tracker |
| `code-metrics-calculator` | 5 | 2h | Measures quality/perf | code-reviewer |
| `before-after-comparison` | 5 | 1.5h | Creates comparison visuals | code-metrics-calculator |
| `demo-scenario-generator` | 5 | 1h | Auto-generates demo DAGs | dag-graph-builder |
| `execution-streamer` | 5 | 1.5h | WebSocket event streaming | ProcessExecutor |

**Subtotal**: 10.5 hours, 7 skills (3 optional)

---

## Detailed Skill Specifications

### TIER 1: Critical Infrastructure

#### Skill: `execution-lifecycle-manager`

**Purpose**: Centralized state management for running DAG executions. Tracks lifecycle events (started, node_completed, execution_stopped, etc.)

**When to Build**: Before Session 1 (needed for stop controls)

**Key Responsibilities**:
- Track currently-running DAGs in memory
- Store execution state (running, stopped, completed, error)
- Provide lookup: `getExecutor(executionId)`
- Emit lifecycle events for UI streaming
- Clean up completed executions

**Interfaces**:
```typescript
class ExecutionLifecycleManager {
  startExecution(dagId: string): ExecutionId
  stopExecution(executionId: string): void
  getExecutor(executionId: string): Executor | null
  onNodeCompleted(executionId, nodeId): void
  getAllRunning(): Execution[]
}
```

**Integration Points**:
- ProcessExecutor → emit events
- ExecutionCanvas → subscribe to events
- Server → track active executions

---

#### Skill: `graceful-shutdown-patterns`

**Purpose**: Document and implement best practices for terminating processes (SIGTERM → wait → SIGKILL pattern)

**When to Build**: Session 1 (needed for stop button implementation)

**Key Responsibilities**:
- Implement SIGTERM/SIGKILL cascade
- Provide configurable grace period (default 2s)
- Track shutdown status and final state
- Handle edge cases (process already dead, stuck zombie)

**Code Pattern**:
```typescript
async function terminateGracefully(
  process: ChildProcess,
  gracePeriodMs: number = 2000
): Promise<TerminationResult> {
  // 1. Send SIGTERM
  // 2. Wait for graceful shutdown
  // 3. If still running, send SIGKILL
  // 4. Return final status
}
```

**Integration Points**:
- ProcessExecutor → use this function
- Stop controls → call this

---

#### Skill: `cost-accrual-tracker`

**Purpose**: Track costs in real-time as DAGs execute, updating on each token consumption

**When to Build**: Before Session 2 (cost verification depends on it)

**Key Responsibilities**:
- Update cost on each model API call
- Provide current cost at any point in execution
- Track cost even during abort
- Expose cost history for verification

**Interfaces**:
```typescript
class CostAccrualTracker {
  onTokensConsumed(inputTokens, outputTokens): void
  getCurrentCost(): number
  getFinalCost(): number
  getHistory(): CostEvent[]
}
```

**Integration Points**:
- ProcessExecutor → update on each call
- ExecutionCanvas → display current cost
- Stop controls → capture final cost on abort

---

### TIER 2: Design System Skills

#### Skill: `design-trend-analyzer`

**Purpose**: Analyze design resources (screenshots, Figma files, websites) to extract design trends, color palettes, and component patterns

**When to Build**: Session 3 (enables design catalog creation)

**Key Responsibilities**:
- Analyze visual design from images/URLs
- Extract dominant colors and typography
- Classify design trend (neobrutalism, swiss-modern, etc.)
- Generate design system metadata

**Input/Output**:
```typescript
interface DesignAnalysis {
  trend: DesignTrend
  colors: ColorPalette
  typography: TypographySystem
  components: ComponentLibrary
  confidence: number
}
```

---

#### Skill: `design-accessibility-auditor`

**Purpose**: Validate design tokens and component styles for WCAG accessibility compliance

**When to Build**: Session 3 (needed for design catalog validation)

**Key Responsibilities**:
- Calculate contrast ratios (WCAG formula)
- Verify text sizes are readable
- Check component states (focus, disabled, etc.)
- Generate accessibility report

**Output**:
```typescript
interface AccessibilityReport {
  wcagLevel: 'AA' | 'AAA'
  issues: AccessibilityIssue[]
  passing: AccessibilityCheck[]
  recommendations: string[]
}
```

---

#### Skill: `component-documentation-generator`

**Purpose**: Auto-generate Storybook-style documentation for UI components in the catalog

**When to Build**: Session 3 (document all 20+ components)

**Key Responsibilities**:
- Create component stories from JSON
- Generate prop tables
- Create usage examples
- Document accessibility specs

---

#### Skill: `design-palette-extractor`

**Purpose**: Extract color palettes from screenshots, websites, or images using computer vision

**When to Build**: Session 3 (helps automate color research)

**Key Responsibilities**:
- Analyze image for dominant colors
- Group similar colors
- Calculate contrast ratios
- Return palette with accessibility ratings

---

#### Skill: `design-semantic-matcher`

**Purpose**: Use embeddings to find "similar" design systems based on semantic description (Phase 2 feature)

**When to Build**: Week 3+ (optional, enables fuzzy search)

**Key Responsibilities**:
- Embed design system descriptions
- Query for similar designs
- Return ranked results with confidence
- Support "find design systems like..."

---

#### Skill: `tailwind-config-validator`

**Purpose**: Validate generated Tailwind configurations for correctness and best practices

**When to Build**: Session 4 (validate design system generator output)

**Key Responsibilities**:
- Parse and validate tailwind.config.js
- Check theme consistency
- Verify color contrast values
- Generate validation report

---

#### Skill: `design-system-documenter`

**Purpose**: Generate living design system documentation from design tokens and components

**When to Build**: Session 4 (document generated systems)

**Key Responsibilities**:
- Create Markdown documentation
- Generate component showcase
- Create usage guides
- Build token reference

---

#### Skill: `component-template-generator`

**Purpose**: Generate React component templates from design tokens and component specs

**When to Build**: Session 4 (generate template code)

**Key Responsibilities**:
- Generate TSX component from design spec
- Include accessibility props
- Create Storybook stories
- Generate prop types

---

### TIER 3: Verification & Demo Skills

#### Skill: `cost-verification-auditor`

**Purpose**: Automated test suite to verify cost estimations are accurate within ±20%

**When to Build**: Session 2 (main task of session 2)

**Key Responsibilities**:
- Run test DAGs
- Compare estimated vs actual costs
- Generate verification report
- Identify estimation errors

---

#### Skill: `token-estimator-tuner`

**Purpose**: Adjust token estimation formulas based on empirical data to reduce variance

**When to Build**: Session 2 (if verification fails >20%)

**Key Responsibilities**:
- Analyze estimation errors
- Calculate adjustment factors
- Update estimation formulas
- Re-test until accurate

---

#### Skill: `budget-tracker`

**Purpose**: Track spending in real-time and alert if approaching budget limits

**When to Build**: Week 2+ (optional, nice-to-have for revenue features)

**Key Responsibilities**:
- Monitor execution costs
- Enforce budget limits
- Generate spending alerts
- Create billing reports

---

#### Skill: `code-metrics-calculator`

**Purpose**: Calculate code quality and performance metrics (before/after comparison)

**When to Build**: Session 5 (show improvement in demo)

**Key Responsibilities**:
- Measure code quality (cyclomatic complexity, etc.)
- Measure performance (latency, memory)
- Calculate maintainability index
- Compare before/after

---

#### Skill: `before-after-comparison`

**Purpose**: Create compelling visual comparisons of before/after code changes

**When to Build**: Session 5 (display demo results)

**Key Responsibilities**:
- Generate diff visualizations
- Create side-by-side comparisons
- Highlight improvements
- Generate comparison summaries

---

#### Skill: `demo-scenario-generator`

**Purpose**: Automatically generate relevant demo DAGs based on user repository

**When to Build**: Session 5 (customize demo for user's code)

**Key Responsibilities**:
- Analyze repository structure
- Identify refactoring opportunities
- Generate targeted demo DAG
- Create scenario description

---

#### Skill: `execution-streamer`

**Purpose**: Real-time WebSocket event streaming for DAG execution progress

**When to Build**: Session 5 (enable real-time UI updates)

**Key Responsibilities**:
- Stream execution events via WebSocket
- Provide progress updates
- Stream log output
- Handle connection management

---

## Implementation Schedule

### Week 1 (Parallel Sessions)

**Session 1 (Stop Controls)** - 4-6 hours
- Requires: `execution-lifecycle-manager`, `graceful-shutdown-patterns`, `cost-accrual-tracker`
- Deliver: Stop button, process termination, cost tracking

**Session 2 (Cost Verification)** - 3-4 hours
- Requires: `cost-accrual-tracker`
- May create: `cost-verification-auditor`, `token-estimator-tuner` (if needed)
- Deliver: Cost accuracy verification report

**Session 3 (Design Research)** - 8-12 hours
- May use: `design-trend-analyzer`, `design-accessibility-auditor`, `design-palette-extractor`, `component-documentation-generator`
- Deliver: Complete design catalog (8 trends, 20+ components, 15+ palettes, 10+ typography)

**Session 4 (Design System Generator)** - 4-6 hours
- Requires: Completed Session 3 catalog
- Uses: `tailwind-config-validator`, `design-system-documenter`, `component-template-generator`
- Deliver: Design system generator skill

### Week 1-2 (Sequential)

**Session 5 (Magic Developer Tool Demo)** - 4-5 hours
- Requires: Sessions 1-2 complete (stop controls + verified costs)
- Uses: `code-metrics-calculator`, `before-after-comparison`, `demo-scenario-generator`, `execution-streamer`
- Deliver: Working demo with real-time execution

---

## Total Effort Estimate

| Tier | Skills | Hours | Sessions |
|------|--------|-------|----------|
| 1 (Critical) | 3 | 5 | 1, 2 |
| 2 (High) | 8 | 13.5 | 3, 4 |
| 3 (Medium) | 7 | 10.5 | 2, 5 |
| **Total** | **15** | **29** | **All** |

**Legend**: ✨ = new skill to create

---

## Dependency Graph

```
ProcessExecutor
  ↓
  ├─→ execution-lifecycle-manager ──┐
  ├─→ graceful-shutdown-patterns ──→ Session 1: Stop Controls ──┐
  ├─→ cost-accrual-tracker ──────────────────────────────────→ ├─→ Session 5: Demo
  │                        ↓                                    │
  │                  Session 2: Cost Verification ──────────────┤
  │                  (verify, tune, track)                      │
  │                                                              │
  ├─→ design-catalog (from Session 3) ──────────────────────────┤
  │         ↓                                                    │
  │   ├─ design-trend-analyzer                                  │
  │   ├─ design-accessibility-auditor                           │
  │   ├─ component-documentation-generator                      │
  │   ├─ design-palette-extractor                               │
  │   └─ (Session 3: Design Research)                           │
  │         ↓                                                    │
  │   ├─ tailwind-config-validator                              │
  │   ├─ design-system-documenter                               │
  │   ├─ component-template-generator                           │
  │   └─ (Session 4: Design System Generator) ────────────────→ ├─→ Demo
  │                                                              │
  └─→ ├─ code-metrics-calculator                               │
      ├─ before-after-comparison                               │
      ├─ demo-scenario-generator                               │
      ├─ execution-streamer                                    │
      └─ (Session 5 Features) ────────────────────────────────┘
```

---

## Next Action

**Ready to execute 5 parallel sessions?**

Approve to start:
1. Session 1: Stop Controls (4-6h) - `~/coding/workgroup-ai`
2. Session 2: Cost Verification (3-4h) - `~/coding/workgroup-ai`
3. Session 3: Design Archivist (8-12h) - `~/coding/some_claude_skills`
4. Session 4: Design System Generator (4-6h) - `~/coding/some_claude_skills`
5. Session 5: Magic Developer Demo (4-5h) - `~/coding/workgroup-ai` (after 1-2 complete)

**Each session will have detailed instructions for a dedicated Claude Code instance.**

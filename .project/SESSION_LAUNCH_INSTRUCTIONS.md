# 5-Session Parallel Execution: Launch Instructions

**Start Date**: 2026-01-29  
**Duration**: Week 1-2 (staggered)  
**Coordination**: Use .CLAUDE_LOCK + .CLAUDE_NOTES.md  
**Cost Hedge**: TOKEN_OPTIMIZATION_STRATEGY.md + skill-architect enhancements

---

## Parallel Execution Schedule

```
Week 1:
┌─ SESSION 1: Stop Controls (4-6h)
│  └─ Run in: ~/coding/workgroup-ai
│  └─ Start: ASAP
│  └─ Budget: $36 (10% contingency)
│
├─ SESSION 2: Cost Verification (3-4h)
│  └─ Run in: ~/coding/workgroup-ai
│  └─ Start: ASAP (parallel with Session 1)
│  └─ Budget: $27
│  └─ Depends on: Session 1 (partial overlap OK)
│
├─ SESSION 3: Design Research (8-12h)
│  └─ Run in: ~/coding/some_claude_skills
│  └─ Start: ASAP (parallel with 1-2)
│  └─ Budget: $72
│
└─ SESSION 4: Design System Generator (4-6h)
   └─ Run in: ~/coding/some_claude_skills
   └─ Start: Day 2 (after Session 3 has started)
   └─ Budget: $36
   └─ Depends on: Session 3 (partial output)

Week 1-2:
└─ SESSION 5: Magic Developer Demo (4-5h)
   └─ Run in: ~/coding/workgroup-ai
   └─ Start: After Sessions 1-2 complete
   └─ Budget: $36
   └─ Depends on: Sessions 1-2 (working stop controls + verified costs)
```

---

## Each Session: Quick Start Template

**Use this template for each new Claude Code instance:**

```markdown
# Session [#]: [Title]

## Your Mission
[Brief one-liner from DETAILED_SESSION_BREAKDOWNS.md]

## Repository
```bash
cd ~/coding/[workgroup-ai OR some_claude_skills]
```

## Duration & Budget
- Time: X-Y hours
- Token budget: $Z (10% contingency reserved)
- Cost hedge: TOKEN_OPTIMIZATION_STRATEGY.md (keep skills <2k tokens)

## Key Documents
1. `/DETAILED_SESSION_BREAKDOWNS.md` — Detailed subtask breakdown
2. `/SESSION_TOKEN_HEDGING_GUIDE.md` — Token optimization for your session
3. `/SKILL_ARCHITECT_AUDIT.md` — How to create efficient skills
4. `~/.claude/TOKEN_OPTIMIZATION_STRATEGY.md` — Cost principles
5. `.CLAUDE_LOCK` + `.CLAUDE_NOTES.md` — Coordination with other sessions

## What You're Building
- **Primary objective**: [From DETAILED_SESSION_BREAKDOWNS.md Subtask overview]
- **Skills you may create**: [List with ROI notes]
- **Output artifacts**: [List of deliverables]
- **Success criteria**: [Pass/fail tests]

## Workflow
1. **Read DETAILED_SESSION_BREAKDOWNS.md** for this session (10 min)
2. **Read SESSION_TOKEN_HEDGING_GUIDE.md** "Session-Specific Instructions" section (5 min)
3. **Check .CLAUDE_LOCK** to see what other sessions are doing (2 min)
4. **Begin work** on subtasks in order (follow the breakdown)
5. **Create skills only if** ROI-justified (3+ uses, encodes expertise, <30 min express workflow)
6. **Invoke skill-architect** when creating skills (it will handle TOKEN_OPTIMIZATION_STRATEGY)
7. **Track costs** in SESSION_TOKEN_HEDGING_GUIDE budget section
8. **Update .CLAUDE_NOTES.md** as you complete major milestones
9. **Cleanup** low-ROI skills before session ends
10. **Move entry to COMPLETED** in .CLAUDE_LOCK with summary

## Key Principles
- **Cost awareness**: Every skill must justify its overhead (break-even within 1-2 uses)
- **Parallelization**: Other sessions are running — coordinate via .CLAUDE_NOTES.md
- **Just-in-time skills**: Create skills WHILE building, not before
- **Express workflow**: 30-min skills are better than blocked work waiting for perfection
- **ROI post-session**: Analyze each skill's value before promoting to permanent

## If You Get Stuck
1. Check .CLAUDE_NOTES.md for what other sessions have learned
2. Review SKILL_ARCHITECT_AUDIT.md for skill creation guidance
3. Use skill-architect to create a helper skill (it knows about TOKEN_OPTIMIZATION)
4. Ask for clarification in .CLAUDE_NOTES.md (other sessions will see it)

## Invoking Skills
When you need expertise for a task:

```bash
# Use existing skills (search .claude/skills/)
Invoke Skill: "skill-name" (described in the skill directory)

# Create new skills if needed:
# 1. Check ROI: Will this be used 3+ times?
# 2. Invoke skill-architect to build it
# 3. Pass TOKEN_OPTIMIZATION_STRATEGY as reference
# 4. Accept "express" (30-min) workflow if time-tight
```

## Coordination
**File**: `.CLAUDE_NOTES.md` — Update as you work!
- Completed subtasks? → Add to "Done"
- Blocking other sessions? → Add to "Blockers"
- Learned something? → Add to "Lessons Learned"
- Questions for user? → Add to "Questions for User"

**Before session ends**:
1. Update .CLAUDE_LOCK with COMPLETED entry
2. Update .CLAUDE_NOTES.md with final status
3. Delete low-ROI skills from .claude/skills/
4. Verify all files are saved to disk

---

## Session 1: Stop Controls

### Your Mission
Implement graceful execution abort/stop controls so users can terminate running DAGs mid-execution.

### Repository
```bash
cd ~/coding/workgroup-ai
```

### Duration & Budget
- Time: 4-6 hours
- Token budget: $36 (10% = $4 contingency)
- Cost hedge: Keep skills <2k tokens each; inline `graceful-shutdown-patterns`

### Skills You May Create
1. **execution-lifecycle-manager** (1-2h)
   - Used in: Session 1 (stop controls) + Session 5 (demo)
   - ROI: 2 uses = marginal but enables both → **Create if time allows**
   - Cost: ~1,500 tokens
   
2. **graceful-shutdown-patterns** (0.5-1h)
   - Used in: Session 1 only
   - ROI: 1 use → **Inline instead (cheaper)**
   - Cost if created: ~800 tokens
   
3. **cost-accrual-tracker** (1-1.5h)
   - Used in: Session 1 + Session 2 + Session 5
   - ROI: 3 uses → **Create (justified)**
   - Cost: ~1,500 tokens

### Subtasks (from DETAILED_SESSION_BREAKDOWNS.md)
1. **Subtask 1.1**: Stop Button UI (1-1.5h)
2. **Subtask 1.2**: Abort Handler in DAG Runtime (2-2.5h)
3. **Subtask 1.3**: Wire UI to Backend (1-1.5h)
4. **Subtask 1.4**: Cost Display & Recovery UI (0.5-1h)

### Success Criteria
- [ ] STOP button appears in ExecutionCanvas (Win31 style)
- [ ] Clicking STOP sends SIGTERM to running process
- [ ] Process terminates within 2 seconds (SIGKILL if needed)
- [ ] Cost is captured at moment of termination
- [ ] UI shows "(Stopped)" label on cost display
- [ ] All 5 manual tests pass (see breakdown)
- [ ] Final cost under budget: $36

### Key Files to Modify
- `packages/ui/src/modes/ExecutionCanvas.tsx` — Add button + handlers
- `packages/core/src/executors/process-executor.ts` — Implement terminate()
- `packages/cli/src/server.ts` — Add /api/execute/stop endpoint

### Before You Start
1. Read DETAILED_SESSION_BREAKDOWNS.md § "SESSION 1" (detailed subtasks)
2. Read SESSION_TOKEN_HEDGING_GUIDE.md § "Session 1: Stop Controls" (cost strategy)
3. Check .CLAUDE_LOCK to see if Session 2 is running (coordinate DAG lifecycle)

---

## Session 2: Cost Verification

### Your Mission
Verify that cost estimation in the token-estimator matches actual Claude API consumption within ±20% margin.

### Repository
```bash
cd ~/coding/workgroup-ai
```

### Duration & Budget
- Time: 3-4 hours
- Token budget: $27 (10% = $2.70 contingency)
- Cost hedge: Inline verification logic; create tuner skill only if needed

### Skills You May Create
1. **cost-verification-auditor** (1.5h)
   - Used in: Session 2 only
   - ROI: 1 use → **Inline (cheaper)**
   - But if reused later: **Create if time allows**

2. **token-estimator-tuner** (1-1.5h)
   - Used in: Session 2 IF verification finds errors
   - ROI: Create on-demand (only if >20% variance found)
   - Decision: Inline first, create if needed

### Subtasks (from DETAILED_SESSION_BREAKDOWNS.md)
1. **Subtask 2.1**: Build Test DAG Suite (1h)
2. **Subtask 2.2**: Execute DAGs & Collect Costs (1-1.5h)
3. **Subtask 2.3**: Compare Estimates vs Actual (1h)
4. **Subtask 2.4**: Fix Estimation Errors (0.5-1h) ← Only if needed

### Success Criteria
- [ ] 3 test DAGs execute successfully
- [ ] Actual token counts recorded for each
- [ ] Estimate variance < ±20% for all DAGs ✅ OR
- [ ] If variance > 20%, cost-verification-auditor skill created + tuner applied
- [ ] Cost report generated (json)
- [ ] Final cost under budget: $27

### Key Files to Modify
- Create: `packages/core/__tests__/fixtures/test-dags.ts`
- Create: `packages/core/__tests__/verify-cost.test.ts`
- Modify: `packages/core/src/pricing/token-estimator.ts` (if tuning needed)

### Before You Start
1. Read DETAILED_SESSION_BREAKDOWNS.md § "SESSION 2" (detailed subtasks)
2. Read SESSION_TOKEN_HEDGING_GUIDE.md § "Session 2: Cost Verification" (cost strategy)
3. Check .CLAUDE_LOCK to see if Session 1 is running (may need cost-accrual-tracker from S1)

---

## Session 3: Design Research

### Your Mission
Research 8+ contemporary design trends and build a comprehensive, version-controlled catalog of design systems, components, color palettes, and typography systems.

### Repository
```bash
cd ~/coding/some_claude_skills
```

### Duration & Budget
- Time: 8-12 hours
- Token budget: $72 (10% = $7.20 contingency)
- Cost hedge: Create design-trend-analyzer + design-accessibility-auditor; inline palette-extractor

### Skills You May Create
1. **design-trend-analyzer** (1.5-2h)
   - Used in: Session 3 (research) + Session 4 (system generation)
   - ROI: 2 uses = marginal → **Create if time allows**
   - Cost: ~1,800 tokens

2. **design-accessibility-auditor** (1.5-2h)
   - Used in: Every design validation in Session 3
   - ROI: High reuse → **Create (justified)**
   - Cost: ~1,800 tokens

3. **design-palette-extractor** (1-1.5h)
   - Used in: Session 3 image analysis (optional)
   - ROI: 1 use → **Inline (cheaper)**

### Subtasks (from DETAILED_SESSION_BREAKDOWNS.md)
1. **Subtask 3.1**: Design Trend Research (2-3h) — 8 trends + documentation
2. **Subtask 3.2**: Build Color Palette Database (2h) — 15+ palettes
3. **Subtask 3.3**: Build Typography Systems Database (2h) — 10+ systems
4. **Subtask 3.4**: Build Component Library Database (2-3h) — 20+ components
5. **Subtask 3.5**: Assemble & Document Catalog (1-2h) — Index + validation

### Success Criteria
- [ ] All 8 design trends documented (neobrutalism, swiss-modern, glassmorphism, maximalism, hyperminimalism, cyberpunk, cottagecore, brutalist-minimal)
- [ ] 15+ color palettes with WCAG ratings
- [ ] 10+ typography systems with readability scores
- [ ] 20+ UI components with accessibility specs
- [ ] All JSON files validate against schema
- [ ] README is clear and complete
- [ ] Final cost under budget: $72

### Output Artifacts
- `website/design-catalog/design-catalog.json` — Main index
- `website/design-catalog/design-systems/*.json` — 8 design system files
- `website/design-catalog/components/*.json` — Components organized by type
- `website/design-catalog/color-palettes.json` — All palettes
- `website/design-catalog/typography-systems.json` — All typography
- `website/design-catalog/README.md` — Documentation

### Before You Start
1. Read DETAILED_SESSION_BREAKDOWNS.md § "SESSION 3" (detailed subtasks)
2. Read SESSION_TOKEN_HEDGING_GUIDE.md § "Session 3: Design Research" (cost strategy)
3. Check .CLAUDE_NOTES.md to see if design resources have been researched yet
4. Set up design research tools: Dribbble, Behance, Figma community bookmarks

---

## Session 4: Design System Generator

### Your Mission
Create a `design-system-generator` skill that takes natural language design direction and outputs production-ready design tokens, Tailwind config, CSS variables, and component styles.

### Repository
```bash
cd ~/coding/some_claude_skills
```

### Duration & Budget
- Time: 4-6 hours
- Token budget: $36 (10% = $3.60 contingency)
- Cost hedge: Create design-system-documenter + component-template-generator; inline validator

### Skills You May Create
1. **tailwind-config-validator** (0.5-1h)
   - Used in: Session 4 validation only
   - ROI: 1 use = marginal → **Inline or defer to post-session**

2. **design-system-documenter** (1-1.5h)
   - Used in: Every generated system in Session 4
   - ROI: High reuse → **Create (justified)**
   - Cost: ~1,200 tokens

3. **component-template-generator** (1-1.5h)
   - Used in: Component generation in Session 4
   - ROI: High reuse → **Create (justified)**
   - Cost: ~1,200 tokens

### Subtasks (from DETAILED_SESSION_BREAKDOWNS.md)
1. **Subtask 4.1**: Create Skill Definition (1h)
2. **Subtask 4.2**: Build Design Matcher Logic (1.5h) — Match text to trends
3. **Subtask 4.3**: Build Token Generation Engine (2h) — Generate tokens from trend
4. **Subtask 4.4**: Build Output Generators (1.5h) — Tailwind + CSS variables
5. **Subtask 4.5**: Create Skill Integration (1h) — Tie it together
6. **Subtask 4.6**: Test with Real Design Directions (0.5h)

### Success Criteria
- [ ] design-system-generator skill created and documented
- [ ] 5 test cases pass (Tech SaaS→Swiss, Meditation→Cottagecore, etc.)
- [ ] Tailwind configs generate valid JavaScript
- [ ] CSS variables output valid CSS
- [ ] Component styles render correctly
- [ ] Documentation complete
- [ ] WCAG report shows AA or better
- [ ] Final cost under budget: $36

### Output Artifacts
- `.claude/skills/design-system-generator/SKILL.md` — Skill definition
- `website/src/utils/design-matcher.ts` — Trend matching logic
- `website/src/utils/token-generator.ts` — Token generation
- `website/src/utils/output-generators.ts` — Tailwind + CSS output
- Tests pass for all 5 design directions

### Before You Start
1. Read DETAILED_SESSION_BREAKDOWNS.md § "SESSION 4" (detailed subtasks)
2. Read SESSION_TOKEN_HEDGING_GUIDE.md § "Session 4: Design System Generator" (cost strategy)
3. **WAIT for Session 3 to complete design catalog** (this session depends on it)
4. Check .CLAUDE_NOTES.md for Session 3 output location

---

## Session 5: Magic Developer Demo

### Your Mission
Build a "Refactor my codebase" demo DAG that showcases parallel agent execution, real-time streaming, and measurable code improvements.

### Repository
```bash
cd ~/coding/workgroup-ai
```

### Duration & Budget
- Time: 4-5 hours
- Token budget: $36 (10% = $3.60 contingency)
- Cost hedge: Create all 4 skills (demo impact justifies overhead)

### Skills You May Create
1. **execution-streamer** (1-1.5h)
   - Used in: Real-time demo execution
   - ROI: Enables wow factor → **Create (justified)**
   - Cost: ~1,500 tokens

2. **code-metrics-calculator** (1.5-2h)
   - Used in: Before/after metrics in demo
   - ROI: Creates impressive visuals → **Create (justified)**
   - Cost: ~1,800 tokens

3. **before-after-comparison** (1-1.5h)
   - Used in: Visual comparison in demo
   - ROI: Key to demo impact → **Create (justified)**
   - Cost: ~1,200 tokens

4. **demo-scenario-generator** (1h)
   - Used in: Customize demo for different codebases
   - ROI: Reusable for future demos → **Create (justified)**
   - Cost: ~1,000 tokens

### Subtasks (from DETAILED_SESSION_BREAKDOWNS.md)
1. **Subtask 5.1**: Design Demo DAG Structure (0.5h)
2. **Subtask 5.2**: Implement Demo Runner (1h)
3. **Subtask 5.3**: Add Real-Time Streaming (1.5h)
4. **Subtask 5.4**: Create Visual DAG Display (1h)
5. **Subtask 5.5**: Build Results Display (1h)

### Success Criteria
- [ ] Demo DAG loads and displays correctly
- [ ] All 6 nodes execute successfully
- [ ] Real-time streaming shows progress
- [ ] Parallel execution visible (Wave 1: 3 nodes simultaneous)
- [ ] Cost accrual shown in real-time
- [ ] STOP button gracefully terminates execution
- [ ] Results display shows measurable improvements
- [ ] Code examples are realistic and impressive
- [ ] Total demo runtime < 3 minutes
- [ ] Final cost under budget: $36

### Output Artifacts
- `docs/MAGIC_DEVELOPER_DEMO_DAG.md` — DAG structure
- `packages/cli/src/commands/demo.ts` — Demo runner
- Enhanced `packages/ui/src/modes/ExecutionCanvas.tsx` — Real-time streaming
- New component: `packages/ui/src/components/DAGVisualization.tsx`
- New component: `packages/ui/src/components/DemoResults.tsx`

### Before You Start
1. Read DETAILED_SESSION_BREAKDOWNS.md § "SESSION 5" (detailed subtasks)
2. Read SESSION_TOKEN_HEDGING_GUIDE.md § "Session 5: Magic Developer Demo" (cost strategy)
3. **WAIT for Sessions 1-2 to complete** (demo needs working stop controls + verified costs)
4. Check .CLAUDE_NOTES.md for Session 1-2 completion status

---

## Coordination & Synchronization

### File: .CLAUDE_LOCK
Each session registers itself here:

```
session-s1-stop-controls:2026-01-29T09:00:00Z:IN_PROGRESS
# Purpose: Implement execution stop/abort controls
# Status: Building subtask 1.2 (abort handler)
# Files: packages/ui/src/modes/ExecutionCanvas.tsx, packages/core/src/executors/process-executor.ts
# See .CLAUDE_NOTES.md for progress

session-s2-cost-verification:2026-01-29T09:15:00Z:IN_PROGRESS
# Purpose: Verify cost estimation accuracy
# Status: Setting up test DAGs
# Files: packages/core/__tests__/fixtures/test-dags.ts, packages/core/__tests__/verify-cost.test.ts
# See .CLAUDE_NOTES.md for progress
```

**Remember to**:
1. Register session at start (add entry to .CLAUDE_LOCK)
2. Update timestamp every 30-60 min during work
3. Move to COMPLETED section when done with summary

### File: .CLAUDE_NOTES.md
Update as you work. Other sessions will see your progress:

```markdown
## Session 1: Stop Controls (In Progress)

### Completed
- [x] Analyzed ExecutionCanvas component structure
- [x] Designed Win31 button component
- [ ] Subtask 1.1: Stop Button UI (pending, will start next)

### In Progress
- [ ] Subtask 1.2: Abort Handler (blocked on understanding ProcessExecutor lifecycle)

### Blockers
- Session 2 needs cost-accrual-tracker from Session 1
  → Will deliver by end of Subtask 1.4

### Questions for User
- None yet

### Lessons Learned
- Win31 button API is flexible, can style with backgroundColor directly
- ProcessExecutor cleanup happens automatically in Node.js but need explicit SIGKILL check
```

---

## When Sessions Finish

### Move to COMPLETED
1. Update .CLAUDE_LOCK: Move entry from ACTIVE to COMPLETED section
2. Add summary: What was built, what worked, what to improve
3. Delete low-ROI skills from `.claude/skills/`
4. Update .CLAUDE_NOTES.md with final status

### Cleanup
```bash
# Before session ends:
cd ~/coding/some_claude_skills # or workgroup-ai
ls .claude/skills/ | sort  # List all skills
# Delete any skill marked "low-ROI" in .CLAUDE_NOTES.md
```

### Example Final Entry in .CLAUDE_LOCK
```
session-s1-stop-controls:2026-01-29T14:30:00Z:COMPLETED
# Purpose: Implement execution stop/abort controls
# Status: COMPLETE - All 5 manual tests passed
# Files modified: 3 (ExecutionCanvas, ProcessExecutor, server.ts)
# Skills created: execution-lifecycle-manager (used 2x, marginal ROI), cost-accrual-tracker (used 3x, justified)
# Skills deleted: graceful-shutdown-patterns (inlined instead, cheaper)
# Time: 5h 45m (under 6h budget)
# Cost: $22 (under $36 budget)
# Blockers resolved: None
# Handoff to Session 5: Stop controls working, ready for demo integration
```

---

## Support & Questions

**If you get stuck**:
1. Check .CLAUDE_NOTES.md for what other sessions learned
2. Review SKILL_ARCHITECT_AUDIT.md for skill creation help
3. Consult SESSION_TOKEN_HEDGING_GUIDE.md for your session's specific strategy
4. Add question to .CLAUDE_NOTES.md "Questions for User" section
5. Use skill-architect to create a helper skill if needed

**Cost overruns**:
- If you exceed budget midway through session
- Note it in .CLAUDE_NOTES.md with explanation
- Continue work (contingency exists for this)
- Don't sacrifice quality to save tokens
- Review TOKEN_OPTIMIZATION_STRATEGY for compression techniques

---

**Ready to launch? Each session gets these instructions + links to:**
- docs/DETAILED_SESSION_BREAKDOWNS.md (the actual work)
- docs/SESSION_TOKEN_HEDGING_GUIDE.md (token optimization)
- docs/SKILL_ARCHITECT_AUDIT.md (how to create skills efficiently)
- ~/.claude/TOKEN_OPTIMIZATION_STRATEGY.md (cost principles)

**All 5 sessions can start simultaneously (Week 1).  Session 5 waits until Sessions 1-2 complete (Week 1-2).**

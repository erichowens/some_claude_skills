# Detailed Task Breakdowns: 5 Parallel Sessions

**Date**: 2026-01-29  
**Sprint Duration**: 2 weeks  
**Parallel Execution**: Sessions 1-4 can run simultaneously; Session 5 after Session 1-2

---

## SESSION 1: Stop Controls (Execution Abort System)

**Repository**: `~/coding/workgroup-ai`  
**Duration**: 4-6 hours  
**Priority**: CRITICAL (blocks launch)  
**Owner**: Execute this session

### Objective
Implement graceful execution abort/stop controls so users can terminate running DAGs mid-execution while properly tracking cost accrual.

### Detailed Subtasks

#### Subtask 1.1: Stop Button UI Component (1-1.5 hours)
**File**: `packages/ui/src/modes/ExecutionCanvas.tsx`  
**Current State**: ExecutionCanvas exists but has no stop button

**Changes needed**:
- Add a red STOP button to the top-right of ExecutionCanvas (Win31 style: beveled red button)
- Button should only be active (`disabled={!isExecuting}`)
- On click: call `handleStopExecution()`
- Add visual feedback: button changes to "STOPPING..." with spinner during abort
- Button should show elapsed time: "Running for 42s | Stop"

**Implementation approach**:
```typescript
// In ExecutionCanvas.tsx, add to the header:
<Win31Button 
  onClick={handleStopExecution}
  disabled={!isExecuting}
  style={{ backgroundColor: '#ff0000', color: '#ffffff' }}
>
  STOP
</Win31Button>
```

**Knowledge needed**:
- Win31 button component API (already exists, just style it)
- React state management for button states

---

#### Subtask 1.2: Abort Handler in DAG Runtime (2-2.5 hours)
**File**: `packages/core/src/executors/process-executor.ts`  
**Current State**: ProcessExecutor spawns `claude -p` processes but has no stop mechanism

**Changes needed**:
1. Add `abortSignal` property to ProcessExecutor class
2. Implement `terminateGracefully()` method:
   - Send SIGTERM to running process
   - Wait 2 seconds for graceful shutdown
   - Send SIGKILL if still running
3. Implement `currentCostAccrued()` method to track partial execution cost
4. Add state tracking: `isStopping`, `stoppedAt`, `finalCost`

**Implementation approach**:
```typescript
// In process-executor.ts
export class ProcessExecutor {
  private process: ChildProcess | null = null;
  private isStopping = false;
  
  async terminate(reason: string): Promise<ExecutionResult> {
    this.isStopping = true;
    const costBeforeTermination = this.currentCostAccrued();
    
    if (this.process) {
      this.process.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (this.process) {
        this.process.kill('SIGKILL');
      }
    }
    
    return {
      status: 'stopped',
      reason,
      cost: costBeforeTermination,
      output: 'Execution terminated by user'
    };
  }
}
```

**Knowledge needed**:
- Node.js child_process API (ChildProcess, kill signals)
- Cost tracking mechanism (from token-estimator.ts)
- Process lifecycle management

---

#### Subtask 1.3: Wire UI to Backend (1-1.5 hours)
**File**: `packages/cli/src/server.ts`  
**Current State**: `/api/execute` endpoint exists but no `/api/execute/stop` endpoint

**Changes needed**:
1. Add `/api/execute/stop` POST endpoint
2. Extract running DAG execution ID from request
3. Call `executor.terminate()` 
4. Return `{ status: 'stopped', final_cost: X, reason: 'user_abort' }`
5. Wire ExecutionCanvas `handleStopExecution()` to call this endpoint

**Implementation approach**:
```typescript
// In server.ts
app.post('/api/execute/stop', (req, res) => {
  const { executionId } = req.body;
  const executor = getActiveExecutor(executionId);
  
  if (!executor) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  
  const result = executor.terminate('user_request');
  res.json(result);
});
```

**Knowledge needed**:
- Express.js API design
- Execution state management (how to find active executors)
- WebSocket communication pattern (if streaming updates)

---

#### Subtask 1.4: Cost Display & Recovery UI (0.5-1 hour)
**File**: `packages/ui/src/modes/ExecutionCanvas.tsx`  
**Current State**: Cost display exists but doesn't update on abort

**Changes needed**:
- Show "Accrued Cost: $X.XX" in real-time during execution
- On abort, lock the cost display with "Final Cost (Stopped): $X.XX"
- Add a dismiss button to clear the execution view
- Add error message if abort fails: "Failed to stop execution - contact support"

**Implementation approach**:
```typescript
// In ExecutionCanvas.tsx, add to display area:
<div className="cost-display">
  <span className="label">
    {isExecuting ? 'Accrued Cost' : 'Final Cost'}
  </span>
  <span className="amount">${cost.toFixed(2)}</span>
  {isStopped && <span className="status">(Stopped)</span>}
</div>
```

**Knowledge needed**:
- React hooks for state management (useState, useEffect)
- Cost formatting utilities

---

### Testing Requirements

**Manual Tests** (all must pass):
1. ✓ Start a 5-node DAG, click STOP after 10 seconds
2. ✓ Verify cost accrual stops immediately
3. ✓ Verify `claude -p` process is actually terminated (check ps)
4. ✓ Verify cost display shows "(Stopped)" label
5. ✓ Click "Dismiss" and re-run same DAG successfully
6. ✓ SIGKILL test: modify code to use SIGKILL immediately, verify force-kill works

**Edge Cases**:
- What if STOP is clicked during the first 100ms? (Process might not exist yet)
- What if backend is unreachable when STOP is clicked?
- What if cost tracker is stale? (Race condition between abort and cost recording)

---

### Knowledge Gaps & New Skills Needed

**Knowledge I need**:
- How is cost currently tracked during execution? (grep `token_estimator.ts` for implementation)
- What's the lifecycle of a running DAG? (How are they stored in memory?)
- Current WebSocket pattern for ExecutionCanvas (does it use polling or real-time?)

**Skills to create** (for future):
- ✨ `execution-lifecycle-manager` — Centralized state for running DAGs
- ✨ `graceful-shutdown-patterns` — Best practices for process termination
- ✨ `cost-accrual-tracker` — Real-time cost accounting during execution

---

## SESSION 2: Cost Verification (±20% Accuracy Check)

**Repository**: `~/coding/workgroup-ai`  
**Duration**: 3-4 hours  
**Priority**: HIGH (revenue blocking)  
**Depends on**: Session 1 (needs working stop controls for safety)

### Objective
Verify that cost estimation in the token-estimator matches actual Claude API consumption within ±20% margin.

### Detailed Subtasks

#### Subtask 2.1: Build Test DAG Suite (1 hour)
**File**: Create `packages/core/__tests__/fixtures/test-dags.ts`  
**Current State**: No test DAGs exist

**Changes needed**:
1. Create 3 test DAGs of varying complexity:
   - **Simple**: 1 skill node (research-analyst)
   - **Medium**: 3 nodes (research → analyze → summarize)
   - **Complex**: 6 nodes with parallel fan-out + fan-in
2. Define expected token ranges for each
3. Ensure DAGs are deterministic (same prompts, same expected tokens)

**Implementation approach**:
```typescript
// In test-dags.ts
export const simpleDag = {
  id: 'test-simple',
  nodes: [
    {
      id: 'research',
      skillId: 'research-analyst',
      prompt: 'Research the history of the Internet. Provide 3 key facts.',
      expectedTokens: { input: 50, output: 200 } // ±20%
    }
  ]
};

export const complexDag = {
  id: 'test-complex',
  nodes: [
    // 6 nodes with parallel execution...
  ]
};
```

**Knowledge needed**:
- How to structure DAGs in workgroup-ai format
- Approximate token counts (will learn from actual API calls)

---

#### Subtask 2.2: Execute DAGs & Collect Actual Costs (1-1.5 hours)
**File**: Create `packages/core/__tests__/verify-cost.test.ts`  
**Current State**: No integration tests exist

**Changes needed**:
1. Create test file that:
   - Loads test DAGs
   - Executes each DAG via ProcessExecutor
   - Records actual token counts from Claude API response metadata
   - Stores results in JSON for comparison
2. Use environment variable `CLAUDE_API_KEY` to run against real API
3. Log execution with timestamps

**Implementation approach**:
```typescript
// In verify-cost.test.ts
import { testDags } from './fixtures/test-dags';

describe('Cost Verification', () => {
  it('simple DAG cost within ±20%', async () => {
    const result = await executeDAG(testDags.simpleDag);
    const actualTokens = result.usage.total_input_tokens + result.usage.total_output_tokens;
    const estimated = testDags.simpleDag.nodes[0].expectedTokens.input + expectedTokens.output;
    
    const variance = Math.abs(actualTokens - estimated) / estimated;
    expect(variance).toBeLessThan(0.20); // ±20%
  });
});
```

**Knowledge needed**:
- Claude API response format (where is usage metadata?)
- How to extract token counts from API response
- Vitest/Jest syntax for async tests

---

#### Subtask 2.3: Compare Estimates vs Actual (1 hour)
**File**: Modify `packages/core/src/pricing/token-estimator.ts`  
**Current State**: Has estimation logic but never verified

**Changes needed**:
1. Run token-estimator predictions on same test DAGs
2. Compare `estimatedTokens` vs `actualTokens`
3. If variance > 20%:
   - Identify which node(s) are off
   - Document the discrepancy
   - Adjust estimation formula
4. Create report: `packages/core/__tests__/cost-verification-report.json`

**Implementation approach**:
```typescript
// In cost verification script
const report = {
  timestamp: new Date().toISOString(),
  testRuns: [
    {
      dagId: 'test-simple',
      estimated: 250,
      actual: 268,
      variance: '7.2%', // ✓ within 20%
      status: 'PASS'
    },
    {
      dagId: 'test-medium',
      estimated: 800,
      actual: 1050,
      variance: '31.2%', // ✗ FAILS - exceeds 20%
      status: 'FAIL',
      reason: 'summarize node underestimated by 30%'
    }
  ],
  summary: '2/3 passing. Need to adjust summarize estimation formula.'
};
```

**Knowledge needed**:
- How token-estimator currently works (read the code)
- Which estimations are most inaccurate
- How to adjust formulas based on empirical data

---

#### Subtask 2.4: Fix Estimation Errors (0.5-1 hour)
**File**: `packages/core/src/pricing/token-estimator.ts`  
**Current State**: May have underestimation bugs

**Changes needed**:
1. If any node type has >20% variance:
   - Increase the token multiplier
   - Document the change
   - Add TODO explaining why
2. Re-run cost verification test
3. Repeat until all tests pass

**Implementation approach**:
```typescript
// In token-estimator.ts
const getEstimatedTokens = (skillId: string, complexity: 'simple' | 'medium' | 'complex') => {
  const baseTokens = {
    'research-analyst': { simple: 150, medium: 300, complex: 500 },
    // ... other skills
  };
  
  // Increased from 1.0x to 1.3x based on verification testing
  const safetyMultiplier = 1.3;
  
  return (baseTokens[skillId][complexity] || 100) * safetyMultiplier;
};
```

**Knowledge needed**:
- Statistical analysis (what adjustment factor makes sense?)
- Risk tolerance (should we over-estimate to be safe?)

---

### Testing Requirements

**Verification Checklist**:
- [ ] All 3 test DAGs execute successfully
- [ ] Actual token counts recorded for each
- [ ] Estimate variance < ±20% for all DAGs
- [ ] Cost report generated with clear pass/fail status
- [ ] Any failing estimations have clear documentation of fix

**Cost Bounds** (from verification):
- Simple DAG: ~250 tokens ±20%
- Medium DAG: ~800 tokens ±20%
- Complex DAG: ~1500 tokens ±20%

---

### Knowledge Gaps & New Skills Needed

**Knowledge I need**:
- Current structure of Claude API response (where is usage data?)
- Token-estimator implementation details (grep for estimation formulas)
- How are skills currently being estimated? (Is there a base cost per skill?)

**Skills to create**:
- ✨ `cost-verification-auditor` — Automated cost accuracy testing
- ✨ `token-estimator-tuner` — ML-based adjustment of estimation formulas
- ✨ `budget-tracker` — Real-time spending alert system

---

## SESSION 3: Design Archivist Research Mission

**Repository**: `~/coding/some_claude_skills`  
**Duration**: 8-12 hours  
**Priority**: HIGH (enables demos)  
**Can run in parallel with**: Sessions 1, 2, 4

### Objective
Research contemporary design trends and build a comprehensive, version-controlled catalog of design systems, components, color palettes, and typography systems to power the Design System Generator.

### Detailed Subtasks

#### Subtask 3.1: Design Trend Research (2-3 hours)
**Output**: `docs/DESIGN_TRENDS_RESEARCH.md`

**Changes needed**:
Research 8+ contemporary design trends and document:
1. **Neobrutalism**
   - Definition, characteristics, use cases
   - Example sites/apps (3-5)
   - Key colors, typography, components
   - WCAG compliance profile
2. **Swiss Modern**
   - Minimalist, grid-based
   - Examples: Figma, Linear, Stripe
3. **Glassmorphism**
   - Frosted glass, blur, transparency
   - Examples: Windows 11, iOS, macOS
4. **Maximalism**
   - Busy, pattern-rich, colorful
   - Examples: Wix, Behance
5. **Hyperminimalism**
   - Essential elements only
   - Examples: Apple, Basecamp, Hey
6. **Cyberpunk**
   - Neon, high contrast, tech-forward
   - Examples: gaming UIs, synthwave design
7. **Cottagecore**
   - Rustic, vintage, hand-drawn
   - Examples: indie blogs, craft sites
8. **Brutalist Minimal**
   - Heavy typography, monochrome, stark
   - Examples: Craigslist-inspired, text-first

**Research resources**:
- Dribbble.com (trending designs)
- Awwwards.com (best web design)
- Behance.net (design portfolios)
- Design Twitter (design discourse)
- Figma community (open design files)
- UI8.net (design systems for sale)

**Research output format**:
```markdown
## [Trend Name]

### Definition
[2-3 sentence description]

### Characteristics
- [Key visual trait 1]
- [Key visual trait 2]
- [Color philosophy]
- [Typography approach]
- [Spacing philosophy]

### Real-world Examples
- [Site/App](url) - [Why it's exemplary]
- ...

### WCAG Compliance
- Default contrast ratio: X:1 (AA/AAA)
- Accessibility strengths: [...]
- Accessibility risks: [...]

### When to Use
- [Use case 1]
- [Use case 2]

### Personality
- Feeling/emotion conveyed
- Target audience
```

**Knowledge needed**:
- Contemporary design trends (designer knowledge or research)
- WCAG accessibility standards
- How to evaluate design systems

---

#### Subtask 3.2: Build Color Palette Database (2 hours)
**Output**: `website/design-catalog/color-palettes.json`

**Changes needed**:
Extract or create 15+ color palettes representing the 8 trends:

```json
{
  "palettes": [
    {
      "id": "neobrutalism-primary",
      "name": "Neobrutalism Primary",
      "trend": "neobrutalism",
      "colors": [
        {
          "name": "Deep Black",
          "hex": "#1a1a1a",
          "hsv": [0, 100, 10],
          "usage": "text, borders, backgrounds",
          "wcag_contrast_white": 21,
          "wcag_contrast_black": 1
        },
        {
          "name": "Cream",
          "hex": "#fef3c7",
          "hsv": [42, 5, 99],
          "usage": "background, highlights",
          "wcag_contrast_white": 1.05,
          "wcag_contrast_black": 20
        }
      ],
      "wcag_profile": {
        "minimum_contrast": 21,
        "rating": "AAA",
        "accessibility": "Excellent"
      },
      "sources": ["Example Site 1", "Example Site 2"]
    },
    // ... 14 more palettes
  ]
}
```

**Color selection criteria**:
- Primary color (brand/dominant)
- Secondary color (accents)
- Neutral palette (grays/blacks)
- Success/warning/error colors (functional)
- Ensure each combo meets WCAG AA minimum (4.5:1)

**Knowledge needed**:
- Color theory (hue, saturation, value)
- WCAG contrast calculation formula
- How color palettes are used in design systems

---

#### Subtask 3.3: Build Typography Systems Database (2 hours)
**Output**: `website/design-catalog/typography-systems.json`

**Changes needed**:
Document 10+ typography systems covering all trends:

```json
{
  "systems": [
    {
      "id": "swiss-modern-typography",
      "name": "Swiss Modern",
      "trend": "swiss-modern",
      "base_font_size": 16,
      "scale_ratio": 1.25,
      "fonts": {
        "display": {
          "family": "Inter, -apple-system, sans-serif",
          "weights": [700, 800, 900],
          "sizes": [48, 56, 64, 72]
        },
        "heading": {
          "family": "Inter, -apple-system, sans-serif",
          "weights": [600, 700],
          "sizes": [24, 32, 40]
        },
        "body": {
          "family": "Inter, -apple-system, sans-serif",
          "weights": [400, 500],
          "sizes": [14, 16, 18],
          "line_height": 1.6,
          "letter_spacing": 0
        },
        "monospace": {
          "family": "Inconsolata, 'Courier New', monospace",
          "weights": [400],
          "sizes": [12, 14]
        }
      },
      "line_heights": {
        "tight": 1.2,
        "normal": 1.5,
        "loose": 1.8
      },
      "readability_score": 9.5,
      "examples": ["Figma", "Linear", "Stripe"]
    },
    // ... 9 more systems
  ]
}
```

**Typography system components**:
- Font families (serif, sans-serif, monospace)
- Weight hierarchy
- Size scale (and ratio used)
- Line height recommendations
- Letter spacing
- Use cases (display, heading, body, label, code)

**Knowledge needed**:
- Typography terminology (kerning, leading, x-height)
- Font pairing principles
- Readability metrics

---

#### Subtask 3.4: Build Component Library Database (2-3 hours)
**Output**: `website/design-catalog/components/`

**Changes needed**:
Document 20+ UI components across 7 types:

```json
{
  "components": [
    {
      "id": "button-primary-neobrutalism",
      "type": "button",
      "trend": "neobrutalism",
      "states": {
        "default": {
          "background": "#1a1a1a",
          "color": "#fef3c7",
          "border": "3px solid #1a1a1a",
          "padding": "12px 24px",
          "font_weight": 700
        },
        "hover": {
          "background": "#333333",
          "transform": "scale(1.02)"
        },
        "active": {
          "transform": "scale(0.98)",
          "box_shadow": "inset 0 2px 4px rgba(0,0,0,0.3)"
        },
        "disabled": {
          "background": "#cccccc",
          "color": "#999999",
          "cursor": "not-allowed"
        }
      },
      "accessibility": {
        "focus_visible": "2px solid #fef3c7",
        "aria_role": "button",
        "keyboard_support": true,
        "wcag_rating": "AAA"
      },
      "animation": {
        "transition": "all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
      }
    },
    // Components to document:
    // - buttons (primary, secondary, ghost)
    // - cards (elevated, flat, outline)
    // - navigation (horizontal, vertical, dropdown)
    // - hero sections (with/without image)
    // - CTAs (with/without arrow)
    // - testimonial cards
    // - form inputs (text, select, checkbox, radio)
  ]
}
```

**Component categories** (20+ total):
- **Buttons** (3): Primary, Secondary, Ghost
- **Cards** (3): Elevated, Flat, Outline
- **Navigation** (3): Horizontal, Vertical, Dropdown
- **Hero Sections** (2): Image-heavy, Text-heavy
- **CTAs** (2): Button-style, Link-style
- **Testimonials** (1): Quote card
- **Forms** (3): Text input, Select, Radio/Checkbox

**Knowledge needed**:
- Component design systems (Atomic Design)
- Accessibility requirements for components
- Animation/transition best practices

---

#### Subtask 3.5: Assemble & Document Catalog (1-2 hours)
**Output**: Complete `website/design-catalog/` directory

**Changes needed**:
1. Create main `design-catalog.json` index file
2. Document in `README.md`:
   - How to use the catalog
   - File structure
   - Adding new designs
   - Maintenance process
3. Add TypeScript types: `website/src/types/design-catalog.ts`
4. Create validation script: `website/scripts/validate-catalog.ts`

**Catalog index format**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-29",
  "design_systems": 8,
  "components": 22,
  "color_palettes": 15,
  "typography_systems": 10,
  "trends": [
    "neobrutalism",
    "swiss-modern",
    "glassmorphism",
    "maximalism",
    "hyperminimalism",
    "cyberpunk",
    "cottagecore",
    "brutalist-minimal"
  ],
  "metadata": {
    "wcag_baseline": "AA",
    "component_types": 7,
    "total_states": 48
  }
}
```

**README.md sections**:
- Overview
- File structure
- Design system format
- Component format
- Adding a new design system
- Adding new components
- Validation & testing
- Contributing guidelines

**Knowledge needed**:
- JSON schema validation
- Documentation best practices

---

### Testing Requirements

**Validation Checklist**:
- [ ] All 8 design trends documented with examples
- [ ] 15+ color palettes with WCAG ratings
- [ ] 10+ typography systems with readability scores
- [ ] 20+ components with accessibility specs
- [ ] All JSON files validate against schema
- [ ] README is clear and complete
- [ ] Design catalog can be imported without errors

**Quality Metrics**:
- Minimum WCAG rating: AA (4.5:1 contrast)
- All components have accessible states
- All trends have 3+ real-world examples
- All components documented with hover/active/disabled states

---

### Knowledge Gaps & New Skills Needed

**Knowledge I need**:
- Where are design resources (Figma, Dribbble, Behance)?
- How to extract color values from screenshots?
- What makes a good design system documentation?
- WCAG contrast calculation details

**Skills to create**:
- ✨ `design-trend-analyzer` — Analyze current design trends automatically
- ✨ `design-accessibility-auditor` — Check WCAG compliance on designs
- ✨ `component-documentation-generator` — Auto-generate component docs from Figma
- ✨ `design-palette-extractor` — Extract color palettes from images/sites

---

## SESSION 4: Design System Generator Skill

**Repository**: `~/coding/some_claude_skills`  
**Duration**: 4-6 hours  
**Priority**: HIGH (powers demos)  
**Depends on**: Session 3 (needs completed design catalog)
**Can run in parallel with**: Sessions 1, 2

### Objective
Create a `design-system-generator` skill that takes a natural language design direction and outputs production-ready design tokens, Tailwind config, CSS variables, and component styles.

### Detailed Subtasks

#### Subtask 4.1: Create Skill Definition (1 hour)
**File**: `.claude/skills/design-system-generator/SKILL.md`

**Changes needed**:
```markdown
---
name: design-system-generator
description: Generates production-ready design systems from natural language descriptions. Takes a design direction and produces Tailwind config, CSS variables, design tokens, and component styles. Activate on 'generate design system', 'create design tokens', 'build theme', 'design direction'.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Task
category: Design
tags:
  - design-system
  - tokens
  - tailwind
  - css-variables
  - design-generation
pairs-with:
  - skill: design-trend-analyzer
    reason: Analyzes design trends to inform generation
  - skill: design-accessibility-auditor
    reason: Validates accessibility of generated design
---

# Design System Generator

You are a design systems expert who generates production-ready design tokens from natural language descriptions.

## Core Responsibilities

1. **Parse Design Direction** - Understand natural language design requests
2. **Select Design System** - Match request to catalog design trend
3. **Generate Design Tokens** - Create color, typography, spacing tokens
4. **Output Tailwind Config** - Generate tailwind.config.js
5. **Create CSS Variables** - Generate CSS custom properties
6. **Document System** - Create design system documentation

## Input Format

```json
{
  "description": "Modern SaaS dashboard for developers",
  "audience": "tech-savvy users",
  "accessibility": "WCAG AA",
  "preferred_trends": ["swiss-modern", "hyperminimalism"],
  "existing_colors": ["#1a1a1a", "#ffffff"]
}
```

## Output Format

Returns object with:
- `tailwind_config.js` - Tailwind configuration
- `css-variables.css` - CSS custom properties
- `design-tokens.json` - Design tokens in DTCG format
- `component-styles.css` - Pre-built component styles
- `documentation.md` - How to use the system
- `accessibility-report.md` - WCAG compliance report

## Example

Request: "Generate a design system for a meditation app"
Output:
- Selects: Cottagecore + Hyperminimalism
- Colors: Soft greens, creams, earth tones
- Typography: Serif headings, sans-serif body
- Components: Calm, rounded, minimal borders
- WCAG: AAA (high contrast where needed)
```

**Knowledge needed**:
- Skill metadata format (already understood from existing skills)
- Design generation workflow

---

#### Subtask 4.2: Build Design Matcher Logic (1.5 hours)
**File**: `website/src/utils/design-matcher.ts`

**Changes needed**:
Create function that matches natural language description to best design trend:

```typescript
export async function matchDesignTrend(
  description: string,
  catalog: DesignCatalog
): Promise<{
  primary: DesignTrend;
  secondary: DesignTrend;
  confidence: number;
  reasoning: string;
}> {
  // Map keywords to trends
  const trendKeywords = {
    'neobrutalism': ['bold', 'heavy', 'stark', 'dramatic', 'contrasting'],
    'swiss-modern': ['clean', 'minimal', 'grid', 'professional', 'tech'],
    'glassmorphism': ['modern', 'transparent', 'blur', 'frosted', 'contemporary'],
    'hyperminimalism': ['minimal', 'essential', 'calm', 'serene', 'peaceful'],
    'cottagecore': ['rustic', 'vintage', 'handmade', 'cozy', 'organic'],
    'cyberpunk': ['neon', 'tech', 'futuristic', 'bold', 'edgy'],
    'maximalism': ['vibrant', 'colorful', 'rich', 'detailed', 'busy'],
    'brutalist-minimal': ['text-first', 'typography', 'monochrome', 'stark']
  };
  
  // Score each trend based on keyword matches
  const scores = Object.entries(trendKeywords).map(([trend, keywords]) => {
    const matchCount = keywords.filter(kw => 
      description.toLowerCase().includes(kw)
    ).length;
    return { trend, score: matchCount };
  });
  
  scores.sort((a, b) => b.score - a.score);
  
  return {
    primary: scores[0].trend as DesignTrend,
    secondary: scores[1].trend as DesignTrend,
    confidence: scores[0].score > 2 ? 0.9 : 0.7,
    reasoning: `Matched to ${scores[0].trend} based on keywords`
  };
}
```

**Knowledge needed**:
- Natural language matching (keyword-based or ML-based?)
- Design trend characteristics
- Confidence scoring

---

#### Subtask 4.3: Build Token Generation Engine (2 hours)
**File**: `website/src/utils/token-generator.ts`

**Changes needed**:
Create function that generates design tokens from selected trend:

```typescript
export function generateDesignTokens(
  trend: DesignTrend,
  catalog: DesignCatalog,
  customization?: {
    additionalColors?: string[];
    fontFamily?: string;
    accessibility?: 'AA' | 'AAA';
  }
): DesignTokens {
  const system = catalog.designSystems[trend];
  const palette = catalog.colorPalettes[`${trend}-primary`];
  const typography = catalog.typographySystems[trend];
  
  return {
    color: {
      primary: palette.colors[0].hex,
      secondary: palette.colors[1].hex,
      neutral: {
        50: palette.colors.find(c => c.name.includes('light')).hex,
        900: palette.colors.find(c => c.name.includes('dark')).hex,
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: typography.fonts.body.family,
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px'
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px'
    },
    radius: {
      none: '0px',
      sm: '4px',
      base: '8px',
      lg: '12px',
      full: '9999px'
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  };
}
```

**Knowledge needed**:
- Design token format (DTCG standard)
- How to select colors from palette
- How to generate spacing/radius scales
- Shadow/depth definitions

---

#### Subtask 4.4: Build Output Generators (1.5 hours)
**File**: `website/src/utils/output-generators.ts`

**Changes needed**:
Functions that generate Tailwind config and CSS variables:

```typescript
export function generateTailwindConfig(tokens: DesignTokens): string {
  return `
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${tokens.color.primary}',
        secondary: '${tokens.color.secondary}',
        neutral: ${JSON.stringify(tokens.color.neutral)},
      },
      fontFamily: {
        sans: '${tokens.typography.fontFamily}',
      },
      fontSize: ${JSON.stringify(tokens.typography.fontSize)},
      spacing: ${JSON.stringify(tokens.spacing)},
      borderRadius: ${JSON.stringify(tokens.radius)},
      boxShadow: ${JSON.stringify(tokens.shadow)},
    }
  }
}
  `.trim();
}

export function generateCSSVariables(tokens: DesignTokens): string {
  let css = ':root {\n';
  
  // Colors
  css += '  /* Colors */\n';
  css += `  --color-primary: ${tokens.color.primary};\n`;
  css += `  --color-secondary: ${tokens.color.secondary};\n`;
  
  // Typography
  css += '  /* Typography */\n';
  css += `  --font-family: ${tokens.typography.fontFamily};\n`;
  
  // Spacing
  css += '  /* Spacing */\n';
  Object.entries(tokens.spacing).forEach(([key, val]) => {
    css += `  --spacing-${key}: ${val};\n`;
  });
  
  css += '}\n';
  return css;
}
```

**Knowledge needed**:
- Tailwind.js configuration format
- CSS custom property syntax
- How to flatten token objects into string output

---

#### Subtask 4.5: Create Skill Integration (1 hour)
**File**: `.claude/skills/design-system-generator/skill-runner.ts`

**Changes needed**:
Main skill execution logic:

```typescript
export async function runDesignSystemGenerator(input: {
  description: string;
  audience?: string;
  accessibility?: 'AA' | 'AAA';
  preferredTrends?: string[];
}): Promise<DesignSystemOutput> {
  
  // 1. Match design trend
  const matchedTrend = await matchDesignTrend(
    input.description,
    designCatalog
  );
  
  // 2. Generate tokens
  const tokens = generateDesignTokens(
    matchedTrend.primary,
    designCatalog,
    { accessibility: input.accessibility }
  );
  
  // 3. Generate outputs
  const tailwindConfig = generateTailwindConfig(tokens);
  const cssVariables = generateCSSVariables(tokens);
  const componentStyles = generateComponentStyles(matchedTrend.primary);
  
  // 4. Create documentation
  const documentation = createSystemDocumentation(
    matchedTrend.primary,
    tokens,
    input.description
  );
  
  // 5. Validate accessibility
  const wcagReport = validateAccessibility(tokens);
  
  return {
    designTrend: matchedTrend.primary,
    confidence: matchedTrend.confidence,
    tokens,
    outputs: {
      tailwindConfig,
      cssVariables,
      componentStyles,
      documentation,
      wcagReport
    }
  };
}
```

**Knowledge needed**:
- Skill execution pattern
- Error handling and validation
- Output formatting

---

#### Subtask 4.6: Test with Real Design Directions (0.5 hours)
**File**: `.claude/skills/design-system-generator/__tests__/design-generator.test.ts`

**Changes needed**:
Create test cases for various design directions:

```typescript
describe('Design System Generator', () => {
  it('generates Swiss Modern system for tech SaaS', async () => {
    const result = await runDesignSystemGenerator({
      description: 'Clean, professional dashboard for developers',
      accessibility: 'AA'
    });
    
    expect(result.designTrend).toBe('swiss-modern');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.outputs.tailwindConfig).toContain('primary');
  });
  
  it('generates Cottagecore system for wellness app', async () => {
    const result = await runDesignSystemGenerator({
      description: 'Cozy meditation app with hand-drawn aesthetic'
    });
    
    expect(result.designTrend).toBe('cottagecore');
  });
});
```

**Knowledge needed**:
- Jest/Vitest testing patterns
- Output validation

---

### Testing Requirements

**Test Cases**:
1. ✓ Tech SaaS → Swiss Modern (clean, professional)
2. ✓ Meditation app → Cottagecore (cozy, rustic)
3. ✓ Gaming UI → Cyberpunk (neon, bold)
4. ✓ Corporate → Hyperminimalism (essential, clean)
5. ✓ Creative agency → Maximalism (colorful, rich)

**Output Validation**:
- [ ] Tailwind config is valid JavaScript
- [ ] CSS variables are valid CSS
- [ ] Component styles render correctly
- [ ] Documentation is complete
- [ ] WCAG report shows AA or better

---

### Knowledge Gaps & New Skills Needed

**Knowledge I need**:
- Tailwind CSS configuration format (read tailwind.config.js examples)
- Design token standards (DTCG by W3C)
- How design trends map to specific visual properties
- CSS custom property best practices

**Skills to create**:
- ✨ `tailwind-config-validator` — Validates generated Tailwind configs
- ✨ `design-system-documenter` — Creates living design system docs
- ✨ `component-template-generator` — Generates React component templates from tokens

---

## SESSION 5: Magic Developer Tool Demo

**Repository**: `~/coding/workgroup-ai`  
**Duration**: 4-5 hours  
**Priority**: CRITICAL (demo for launch)  
**Depends on**: Sessions 1-2 (needs working stop controls + verified costs)

### Objective
Build a "Refactor my codebase" demo DAG that showcases parallel agent execution, real-time streaming, and measurable code improvements.

### Detailed Subtasks

#### Subtask 5.1: Design Demo DAG Structure (0.5 hours)
**Output**: `docs/MAGIC_DEVELOPER_DEMO_DAG.md`

**Changes needed**:
Document the DAG structure:

```yaml
dag:
  id: magic-developer-demo
  name: "Magic Developer Tool - Refactor Demo"
  description: "Analyzes and refactors a codebase in parallel"
  
  nodes:
    # Wave 1: Parallel Analysis
    - id: analyze-architecture
      type: skill
      skillId: code-architect
      dependencies: []
      task: "Analyze repository architecture and identify improvement opportunities"
      
    - id: analyze-code-quality
      type: skill
      skillId: code-reviewer
      dependencies: []
      task: "Review code for quality issues, dead code, and anti-patterns"
      
    - id: analyze-performance
      type: skill
      skillId: performance-engineer
      dependencies: []
      task: "Identify performance bottlenecks and optimization opportunities"
    
    # Wave 2: Generate Recommendations
    - id: synthesize-recommendations
      type: skill
      skillId: dag-feedback-synthesizer
      dependencies: [analyze-architecture, analyze-code-quality, analyze-performance]
      task: "Combine findings into prioritized refactoring recommendations"
    
    # Wave 3: Generate Code
    - id: generate-refactored-code
      type: skill
      skillId: code-refactoring:legacy-modernizer
      dependencies: [synthesize-recommendations]
      task: "Generate refactored versions of key files"
    
    # Wave 4: Validate & Document
    - id: validate-changes
      type: skill
      skillId: test-automator
      dependencies: [generate-refactored-code]
      task: "Verify refactored code compiles and tests pass"
    
    - id: create-summary
      type: skill
      skillId: technical-writer
      dependencies: [generate-refactored-code, validate-changes]
      task: "Create before/after summary and migration guide"
  
  config:
    maxParallelism: 3
    defaultTimeout: 120000
    errorHandling: "stop-on-failure"
  
  expected_runtime: 180  # seconds
  expected_cost: 15  # dollars
```

**Knowledge needed**:
- DAG design patterns
- Skill orchestration
- Critical path analysis

---

#### Subtask 5.2: Implement Demo Runner (1 hour)
**File**: `packages/cli/src/commands/demo.ts`

**Changes needed**:
Create command to run demo with a real codebase:

```typescript
export async function runMagicDeveloperDemo(repoPath: string): Promise<void> {
  console.log('🪄 Magic Developer Tool - Refactor Demo');
  console.log(`📁 Target repository: ${repoPath}`);
  console.log('');
  
  // 1. Validate repo exists
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repository not found: ${repoPath}`);
  }
  
  // 2. Create DAG from YAML
  const dagYaml = fs.readFileSync('./docs/MAGIC_DEVELOPER_DEMO_DAG.md');
  const dag = parseDagFromYaml(dagYaml);
  
  // 3. Execute DAG
  const executor = new DAGExecutor(dag);
  const results = await executor.execute({
    targetRepository: repoPath,
    streaming: true,
    onProgress: (event) => {
      console.log(`[${event.nodeId}] ${event.status}`);
    }
  });
  
  // 4. Display results
  displayResults(results);
}
```

**Knowledge needed**:
- CLI command structure
- DAG execution API
- Progress streaming

---

#### Subtask 5.3: Add Real-Time Streaming to ExecutionCanvas (1.5 hours)
**File**: `packages/ui/src/modes/ExecutionCanvas.tsx`

**Changes needed**:
Wire real-time execution updates to UI:

```typescript
useEffect(() => {
  if (!isExecuting) return;
  
  // Create WebSocket connection to execution stream
  const ws = new WebSocket(`ws://localhost:8000/api/execute/${executionId}/stream`);
  
  ws.onmessage = (event) => {
    const update: ExecutionUpdate = JSON.parse(event.data);
    
    switch(update.type) {
      case 'node_started':
        updateNodeState(update.nodeId, 'running');
        break;
      case 'node_completed':
        updateNodeState(update.nodeId, 'completed');
        updateCost(update.costAccrued);
        break;
      case 'node_error':
        updateNodeState(update.nodeId, 'error');
        showError(update.error);
        break;
      case 'execution_complete':
        setIsExecuting(false);
        showResults(update.results);
        break;
    }
  };
  
  return () => ws.close();
}, [executionId, isExecuting]);
```

**Knowledge needed**:
- WebSocket API
- Real-time UI updates
- React hooks patterns

---

#### Subtask 5.4: Create Visual DAG Display (1 hour)
**File**: `packages/ui/src/components/DAGVisualization.tsx`

**Changes needed**:
Create component that shows DAG topology with execution progress:

```typescript
export function DAGVisualization({ dag, execution }: DAGVisualizationProps) {
  return (
    <svg width="800" height="600" className="dag-visualization">
      {/* Wave 1 nodes */}
      <g className="wave-1">
        {dag.nodes.filter(n => n.dependencies.length === 0).map(node => (
          <DAGNode
            key={node.id}
            node={node}
            status={execution.nodeStates[node.id]}
            x={100 + Math.random() * 50}
            y={100}
          />
        ))}
      </g>
      
      {/* Connecting lines */}
      {dag.nodes.flatMap(node =>
        node.dependencies.map(depId => (
          <line
            key={`${depId}-${node.id}`}
            x1={getNodePosition(depId).x}
            y1={getNodePosition(depId).y}
            x2={getNodePosition(node.id).x}
            y2={getNodePosition(node.id).y}
            stroke="#4a9d9e"
            strokeWidth="2"
          />
        ))
      )}
    </svg>
  );
}
```

**Knowledge needed**:
- SVG drawing
- Graph layout algorithms (force-directed, hierarchical)
- Animation/transitions

---

#### Subtask 5.5: Build Results Display (1 hour)
**File**: `packages/ui/src/components/DemoResults.tsx`

**Changes needed**:
Create component showing before/after analysis:

```typescript
export function DemoResults({ results }: DemoResultsProps) {
  return (
    <div className="demo-results">
      <h2>✨ Refactoring Complete</h2>
      
      <div className="metrics-grid">
        <MetricCard
          title="Code Quality"
          before={results.quality.before}
          after={results.quality.after}
          improvement={results.quality.improvement}
          icon="📊"
        />
        <MetricCard
          title="Performance"
          before={results.performance.before}
          after={results.performance.after}
          improvement={results.performance.improvement}
          icon="⚡"
        />
        <MetricCard
          title="Maintainability"
          before={results.maintainability.before}
          after={results.maintainability.after}
          improvement={results.maintainability.improvement}
          icon="🎯"
        />
      </div>
      
      <CodeComparison
        before={results.codeExamples.before}
        after={results.codeExamples.after}
      />
      
      <MigrationGuide recommendations={results.recommendations} />
    </div>
  );
}
```

**Knowledge needed**:
- React component composition
- Diff visualization (use react-diff-viewer)
- Data visualization patterns

---

### Testing Requirements

**Demo Checklist**:
- [ ] DAG loads and displays correctly
- [ ] All 6 nodes execute successfully
- [ ] Real-time streaming shows node progress
- [ ] Parallel execution happens (Wave 1: 3 nodes run simultaneously)
- [ ] Cost accrual shown in real-time
- [ ] STOP button gracefully terminates execution
- [ ] Results display shows measurable improvements
- [ ] Code examples are realistic and impressive
- [ ] Total demo runtime < 3 minutes (for user patience)

**Metrics to Track**:
- Execution time per wave
- Total cost vs estimated cost
- Node success rates
- User engagement time

---

### Knowledge Gaps & New Skills Needed

**Knowledge I need**:
- How to measure code quality/performance improvements (metrics)
- Real codebase to analyze (user's repo or open-source example?)
- WebSocket implementation in workgroup-ai
- DAG visualization libraries (Mermaid, D3, Cytoscape)

**Skills to create**:
- ✨ `code-metrics-calculator` — Measures quality/performance metrics
- ✨ `before-after-comparison` — Creates compelling before/after visuals
- ✨ `demo-scenario-generator` — Automatically creates relevant demo DAGs
- ✨ `execution-streamer` — Real-time WebSocket event streaming

---

## Meta-Analysis: New Skills Needed

### Across All Sessions

**Infrastructure Skills** (support multiple sessions):
1. ✨ `execution-lifecycle-manager` — Centralized state for running DAGs
2. ✨ `graceful-shutdown-patterns` — Best practices for process termination
3. ✨ `cost-accrual-tracker` — Real-time cost accounting during execution

**Design Skills** (enable Session 3-4):
1. ✨ `design-trend-analyzer` — Analyze current design trends automatically
2. ✨ `design-accessibility-auditor` — Check WCAG compliance on designs
3. ✨ `component-documentation-generator` — Auto-generate component docs
4. ✨ `design-palette-extractor` — Extract color palettes from images
5. ✨ `design-semantic-matcher` — Find similar designs (Phase 2)
6. ✨ `tailwind-config-validator` — Validates generated Tailwind configs
7. ✨ `design-system-documenter` — Creates living design system docs
8. ✨ `component-template-generator` — Generates React templates from tokens

**Quality/Verification Skills** (enable Session 2):
1. ✨ `cost-verification-auditor` — Automated cost accuracy testing
2. ✨ `token-estimator-tuner` — ML-based adjustment of formulas
3. ✨ `budget-tracker` — Real-time spending alert system

**Demo/Presentation Skills** (enable Session 5):
1. ✨ `code-metrics-calculator` — Measures quality/performance
2. ✨ `before-after-comparison` — Creates compelling visuals
3. ✨ `demo-scenario-generator` — Auto-generates relevant demo DAGs
4. ✨ `execution-streamer` — Real-time WebSocket events

**Total New Skills Needed**: 15 skills  
**Priority Order**: Infrastructure > Design > Verification > Demo

---

## Summary: Implementation Roadmap

| Week | Sessions | Duration | Output |
|------|----------|----------|--------|
| 1 | 1-4 (parallel) | 20-30 hours | Stop controls, cost verification, design catalog, design system generator |
| 1-2 | 5 (after 1-2 complete) | 4-5 hours | Magic Developer Tool demo |
| 2+ | Optional | Varies | Design semantic layer (Phase 2), new supporting skills |

**Critical Path**:
- Day 1-2: Sessions 1, 2 (stop controls, cost verification)
- Days 1-3: Session 3 (design research)
- Days 2-3: Session 4 (design system generator)
- Days 3-4: Session 5 (demo integration)

**Risk Mitigation**:
- Session 1-2 must pass before Session 5 (demo needs working stop + verified costs)
- Session 3 must complete before Session 4 (design generator needs catalog)
- Session 5 depends on successful Sessions 1-2

---

*Ready to execute. Awaiting approval to spin up parallel sessions.*

# WinDAGs Design Gallery Integration Plan

**Date**: 2026-01-31
**Status**: Ready for Implementation
**Harvested From**: prompt-learning MCP patterns + Design Gallery Plan

---

## Overview

This document folds the Design Gallery Explorer into windags.ai, harvesting the continuous learning loop architecture from the prompt-learning MCP.

### The Synthesis

| Source | What We Harvest |
|--------|-----------------|
| **Design Gallery Plan** | Harmony Engine, Composer Canvas, Industry Templates |
| **Prompt-Learning MCP** | Learning loop (OBSERVE→INDEX→UPDATE→ADAPT), RAG retrieval, 5-dimension scoring, EMA updates |
| **WinDAGs Runtime** | ProcessExecutor, PhaseOrchestrator, Win95 aesthetic |

---

## Architecture: Design Harmony Engine

Inspired by the prompt-learning optimization pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN HARMONY ENGINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PATTERN MATCHING (instant, no API calls)                │
│     ├── trend_compatibility: Same trend = 80%, related = 60%│
│     ├── category_balance: Complementary categories = 90%   │
│     ├── accessibility_fit: WCAG compliance scoring          │
│     ├── temperature_harmony: Warm/cool balance              │
│     └── contrast_check: Light/dark distribution             │
│                                                              │
│  2. RAG RETRIEVAL (vector similarity search)                │
│     ├── Embed selected patterns using text-embedding-3-small│
│     ├── Search catalog for similar high-performing combos   │
│     └── Learn from what worked in past compositions         │
│                                                              │
│  3. ITERATIVE REFINEMENT (user feedback loop)               │
│     ├── Track which combinations users keep vs. discard     │
│     ├── Score each pattern combo on 5 weighted criteria     │
│     ├── EMA update: α=0.3 (30% new, 70% historical)        │
│     └── Surface trending and declining patterns             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5-Dimension Scoring (Harvested from prompt-learning)

Every pattern combination is scored (0-100) on five dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Trend Match** | 30% | Do patterns share aesthetic DNA? |
| **Category Balance** | 25% | Complementary roles (color + typography + button)? |
| **Accessibility** | 20% | WCAG contrast, touch targets, readable type |
| **Visual Rhythm** | 15% | Spacing harmony, grid alignment potential |
| **Modernity** | 10% | Current vs. dated pattern choices |

---

## Continuous Learning Loop

Directly harvested from prompt-learning MCP:

```
1. OBSERVE: Track pattern selection → outcome pairs
   - Store pattern combination embedding
   - Record usage metrics (kept, exported, shared)
   - Capture context (industry template, custom composition)

2. INDEX: Build retrievable knowledge base
   - Vector database for semantic similarity
   - Metadata filtering (trend, category, accessibility score)
   - Hybrid search: vector + keyword

3. UPDATE: Exponential moving average
   - α = 0.3 (30% new, 70% historical)
   - Recency decay: half-life 30 days
   - Distribution drift detection for new trends

4. ADAPT: Adjust recommendations based on patterns
   - Which combinations work for which industries?
   - What pairings consistently get exported?
   - Where do certain patterns fail to compose?
```

### Drift Detection (for emerging design trends)

```typescript
// When the distribution of selected patterns shifts
if (embedding_drift > 0.15) {
  // New design trend emerging
  surfaceTrendingPatterns();
  flagForCatalogReview();
  logPotentialNewTrend();
}
```

---

## windags.ai Integration

### URL Structure

```
windags.ai/
├── /                      # Hero + runtime demo
├── /skills/               # Skill gallery (existing)
├── /dag/                  # DAG builder interface
├── /design/               # ← NEW: Design Gallery
│   ├── /explore/          # Browse by category/trend
│   ├── /compose/          # Drag-drop canvas
│   ├── /templates/        # Industry templates
│   └── /analytics/        # User's pattern history
└── /api/
    ├── /harmony/          # Pattern compatibility scoring
    ├── /similar/          # Find similar patterns (RAG)
    └── /record/           # Log pattern selections
```

### Component Architecture

```
windags.ai/
├── app/
│   └── design/
│       ├── page.tsx                 # Design gallery home
│       ├── explore/
│       │   └── [category]/          # Pattern browser
│       ├── compose/
│       │   └── page.tsx             # Composer canvas
│       └── templates/
│           └── [industry]/          # Industry templates
│
├── components/
│   ├── win95/                       # Win95 design system (existing)
│   │   ├── Win95Window.tsx
│   │   ├── Win95Button.tsx
│   │   └── Win95Toolbar.tsx
│   │
│   ├── design/                      # ← NEW: Gallery components
│   │   ├── PatternCard.tsx          # Visual pattern preview
│   │   ├── HarmonyScore.tsx         # Compatibility indicator
│   │   ├── ComposerCanvas.tsx       # Drag-drop composition
│   │   ├── PatternPalette.tsx       # Available patterns sidebar
│   │   ├── TrendBadge.tsx           # Trend classification
│   │   └── ExportModal.tsx          # Export design system
│   │
│   └── shared/
│       ├── MasonryGrid.tsx          # Responsive gallery layout
│       └── FilterBar.tsx            # Category/trend filters
│
├── lib/
│   ├── harmony/                     # ← NEW: Harmony Engine
│   │   ├── scoring.ts               # Compatibility algorithm
│   │   ├── trends.ts                # Trend relationship graph
│   │   ├── recommendations.ts       # "You might also like"
│   │   └── learning.ts              # EMA updates, drift detection
│   │
│   └── catalog/                     # Design catalog loader
│       ├── loader.ts                # JSON catalog loader
│       ├── types.ts                 # From some_claude_skills
│       └── index.ts                 # Unified catalog API
│
└── data/
    └── catalog/                     # Symlink to some_claude_skills/design-catalog
```

---

## Harmony Engine Implementation

### Core Algorithm (from Gallery Plan + prompt-learning patterns)

```typescript
// lib/harmony/scoring.ts

import type { Pattern, HarmonyScore } from './types';

// Trend relationships (harvested from design-catalog research)
const RELATED_TRENDS: Record<string, string[]> = {
  'neobrutalism': ['maximalism', 'swiss-grid'],
  'swiss-modern': ['minimalism', 'bauhaus'],
  'glassmorphism': ['neumorphism', 'modern-minimal'],
  'memphis': ['maximalism', 'pop-art'],
  'vaporwave': ['retrowave', 'synthwave'],
  // ... from design-catalog/DESIGN_TRENDS_RESEARCH.md
};

const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  'color-palette': ['typography', 'button', 'spacing'],
  'typography': ['color-palette', 'layout', 'card'],
  'button': ['color-palette', 'form', 'card'],
  'layout': ['typography', 'spacing', 'navigation'],
  // ...
};

export function calculateHarmony(
  patternA: Pattern,
  patternB: Pattern
): HarmonyScore {
  // Trend Match (30%)
  const trendMatch =
    patternA.trend === patternB.trend ? 100 :
    RELATED_TRENDS[patternA.trend]?.includes(patternB.trend) ? 70 :
    30;

  // Category Balance (25%)
  const categoryBalance =
    COMPLEMENTARY_CATEGORIES[patternA.category]?.includes(patternB.category)
      ? 90
      : 50;

  // Accessibility (20%)
  const accessibilityFit = Math.min(
    patternA.accessibilityScore ?? 80,
    patternB.accessibilityScore ?? 80
  );

  // Visual Rhythm (15%)
  const visualRhythm = calculateVisualRhythm(patternA, patternB);

  // Modernity (10%)
  const modernity = (patternA.modernityScore + patternB.modernityScore) / 2;

  // Weighted composite
  const overall =
    trendMatch * 0.30 +
    categoryBalance * 0.25 +
    accessibilityFit * 0.20 +
    visualRhythm * 0.15 +
    modernity * 0.10;

  return {
    overall: Math.round(overall),
    breakdown: {
      trendMatch,
      categoryBalance,
      accessibilityFit,
      visualRhythm,
      modernity,
    },
    suggestions: generateImprovementSuggestions(overall, { trendMatch, categoryBalance }),
  };
}

function generateImprovementSuggestions(
  overall: number,
  breakdown: Record<string, number>
): string[] {
  const suggestions: string[] = [];

  if (breakdown.trendMatch < 50) {
    suggestions.push('Consider patterns from the same design trend for stronger cohesion');
  }
  if (breakdown.categoryBalance < 50) {
    suggestions.push('Add a complementary category (e.g., typography pairs with color-palette)');
  }

  return suggestions;
}
```

### Learning Loop (harvested from prompt-learning)

```typescript
// lib/harmony/learning.ts

interface PatternSelection {
  patterns: string[];       // Pattern IDs
  embedding: number[];      // Vector embedding of combo
  outcome: 'kept' | 'exported' | 'discarded';
  industry?: string;
  timestamp: string;
}

interface SelectionMetrics {
  keep_rate: number;        // 0-1, EMA
  export_rate: number;      // 0-1, EMA
  observation_count: number;
}

const ALPHA = 0.3;  // EMA weight: 30% new, 70% historical

export async function recordPatternSelection(
  selection: PatternSelection,
  existingMetrics?: SelectionMetrics
): Promise<SelectionMetrics> {
  const isKeep = selection.outcome === 'kept' || selection.outcome === 'exported';
  const isExport = selection.outcome === 'exported';

  if (!existingMetrics) {
    // New combination
    return {
      keep_rate: isKeep ? 1.0 : 0.0,
      export_rate: isExport ? 1.0 : 0.0,
      observation_count: 1,
    };
  }

  // EMA update (from prompt-learning)
  return {
    keep_rate: ALPHA * (isKeep ? 1 : 0) + (1 - ALPHA) * existingMetrics.keep_rate,
    export_rate: ALPHA * (isExport ? 1 : 0) + (1 - ALPHA) * existingMetrics.export_rate,
    observation_count: existingMetrics.observation_count + 1,
  };
}

export async function findSimilarCombinations(
  patterns: string[],
  minKeepRate = 0.7,
  topK = 5
): Promise<PatternSelection[]> {
  // Generate embedding for current selection
  const embedding = await embedPatternCombination(patterns);

  // Vector search in catalog
  const results = await vectorDb.search('pattern_combinations', {
    vector: embedding,
    limit: topK * 2,
    filter: {
      must: [
        { key: 'metrics.keep_rate', range: { gte: minKeepRate } }
      ]
    }
  });

  return results.slice(0, topK);
}
```

---

## API Endpoints

### Harmony Scoring

```typescript
// app/api/harmony/route.ts

export async function POST(request: Request) {
  const { patternIds } = await request.json();

  const patterns = await Promise.all(
    patternIds.map(id => loadPattern(id))
  );

  // Calculate pairwise harmony
  const scores: HarmonyScore[] = [];
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      scores.push(calculateHarmony(patterns[i], patterns[j]));
    }
  }

  // Aggregate into overall composition score
  const overall = Math.round(
    scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
  );

  return Response.json({
    overall,
    pairwise: scores,
    suggestions: aggregateSuggestions(scores),
  });
}
```

### Record Selection (Learning Loop)

```typescript
// app/api/record/route.ts

export async function POST(request: Request) {
  const selection: PatternSelection = await request.json();

  // Get or create metrics
  const comboId = hashPatternCombination(selection.patterns);
  const existing = await getMetrics(comboId);

  // EMA update
  const updated = await recordPatternSelection(selection, existing);

  // Store updated metrics + embedding
  await upsertMetrics(comboId, updated, selection.embedding);

  return Response.json({
    status: 'recorded',
    combination_id: comboId,
    metrics: updated,
  });
}
```

### Find Similar (RAG Retrieval)

```typescript
// app/api/similar/route.ts

export async function POST(request: Request) {
  const { patternIds, topK = 5 } = await request.json();

  const similar = await findSimilarCombinations(patternIds, 0.7, topK);

  return Response.json({
    similar: similar.map(s => ({
      patterns: s.patterns,
      keep_rate: s.metrics?.keep_rate,
      similarity_score: s.score,
    })),
  });
}
```

---

## Win95 Aesthetic Integration

The gallery uses the existing Win95 design system from windags.ai:

```tsx
// components/design/PatternCard.tsx

import { Win95Window, Win95Button } from '../win95';

export function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <Win95Window title={pattern.name} className="pattern-card">
      <div className="pattern-preview">
        <img src={pattern.thumbnail} alt={pattern.name} />
      </div>

      <div className="pattern-meta">
        <TrendBadge trend={pattern.trend} />
        <span className="category">{pattern.category}</span>
      </div>

      <div className="pattern-actions">
        <Win95Button onClick={() => addToComposer(pattern)}>
          Add to Canvas
        </Win95Button>
        <Win95Button onClick={() => viewDetails(pattern)}>
          Details
        </Win95Button>
      </div>
    </Win95Window>
  );
}
```

### Composer Canvas (Win95 Style)

```tsx
// components/design/ComposerCanvas.tsx

export function ComposerCanvas() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [harmonyScore, setHarmonyScore] = useState<HarmonyScore | null>(null);

  useEffect(() => {
    if (patterns.length >= 2) {
      fetchHarmonyScore(patterns.map(p => p.id)).then(setHarmonyScore);
    }
  }, [patterns]);

  return (
    <Win95Window title="Design Composer" className="composer-canvas">
      {/* Toolbar */}
      <Win95Toolbar>
        <Win95Button onClick={clearCanvas}>Clear</Win95Button>
        <Win95Button onClick={exportDesignSystem}>Export</Win95Button>
        <HarmonyScore score={harmonyScore} />
      </Win95Toolbar>

      {/* Canvas Area */}
      <div className="canvas-area">
        {patterns.map(pattern => (
          <DraggablePattern key={pattern.id} pattern={pattern} />
        ))}
      </div>

      {/* Sidebar */}
      <PatternPalette onSelect={addPattern} />
    </Win95Window>
  );
}
```

---

## Data Flow: some_claude_skills → windags.ai

```
some_claude_skills/                    windags.ai/
├── website/design-catalog/   ──────>  data/catalog/ (symlink or copy)
│   ├── design-catalog.json
│   ├── color-palettes.json
│   ├── typography-systems.json
│   └── ...
│
├── .claude/skills/                    (Skills available via DAG)
│   ├── design-critic/       ──────>   /dag "critique this design"
│   └── frontend-architect/  ──────>   /dag "plan frontend stack"
│
└── docs/
    └── DESIGN_TRENDS_RESEARCH.md ──>  lib/harmony/trends.ts (compiled)
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Create `windags.ai/app/design/` route structure
- [ ] Symlink design-catalog from some_claude_skills
- [ ] Build `PatternCard` and `MasonryGrid` in Win95 style
- [ ] Implement basic `/explore` category browser

### Phase 2: Harmony Engine (Week 2)
- [ ] Implement `lib/harmony/scoring.ts`
- [ ] Build `HarmonyScore` component
- [ ] Create `/api/harmony` endpoint
- [ ] Add real-time scoring to Composer

### Phase 3: Learning Loop (Week 3)
- [ ] Set up Qdrant collection for pattern embeddings
- [ ] Implement `lib/harmony/learning.ts`
- [ ] Create `/api/record` and `/api/similar` endpoints
- [ ] Add "Similar Combinations" recommendations

### Phase 4: Polish (Week 4)
- [ ] Industry templates page
- [ ] Export modal (CSS, Tailwind, JSON)
- [ ] Analytics dashboard (user's pattern history)
- [ ] Performance optimization

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pattern combinations explored | 500+ | Analytics |
| Export rate | >20% | Compositions exported / created |
| Return visitors | >40% | Weekly active users |
| Harmony score correlation | >0.7 | Score vs. export rate |
| Learning loop accuracy | >80% | Similar combos user keeps |

---

## What This Enables

1. **Design exploration as part of WinDAGs workflow**
   - `/dag "design a landing page"` can pull from gallery
   - design-critic skill can reference catalog patterns

2. **Continuous improvement**
   - User selections train the Harmony Engine
   - Trending patterns surface automatically
   - Underperforming patterns get flagged

3. **Unified aesthetic**
   - Win95 style consistent with rest of windags.ai
   - Design patterns match the runtime personality

---

*Harvested from prompt-learning MCP + Design Gallery Plan*
*Folded into windags.ai architecture*
*2026-01-31*

---
slug: /skills/diagramming_expert
id: diagramming_expert
name: diagramming-expert
description: Master of text-based visual communication using ASCII art, Unicode box-drawing, and structured diagram notation
---

# Diagramming Expert: Text-Based Visual Communication

<SkillHeader
  skillName="Diagramming Expert"
  fileName="diagramming-expert"
  description={"\"Master of text-based visual communication using ASCII art, Unicode box-drawing, and structured diagram notation. Creates clear, maintainable diagrams for systems, processes, hierarchies, relationships, and psychological structures. Proactively generates diagrams to enhance understanding. Activate on 'diagram', 'visualize', 'flowchart', 'architecture diagram', 'process flow', 'decision tree', 'ASCII art', 'box drawing', 'psyche map', 'parts diagram'. NOT for image generation, graphic design, or rendered visualizations (use design tools).\""}
  tags={["analysis","design","visual","documentation","beginner-friendly"]}
/>

Master of text-based visual communication. Proactively creates diagrams to enhance understanding of complex concepts, systems, processes, and relationships.

## Your Mission

Create clear, maintainable diagrams using ASCII art and Unicode box-drawing characters. Reduce cognitive load through visual communication. Apply Tufte's principles for maximum signal-to-noise ratio.

## When to Use This Skill

### Perfect For:
- 🏗️ System architecture and component diagrams
- 🔄 Process flows and state machines
- 🌳 Decision trees and conditional logic
- 📊 Hierarchical structures (org charts, taxonomies)
- 🧠 Psychological structures (psyche maps, parts work, shadow diagrams)
- 🔗 Data relationships and entity models
- ♻️ Feedback loops and causal systems
- ⚖️ Before/after comparisons
- ⏱️ Timelines and sequences
- 💡 Any concept that would be clearer with a visual

### Not For:
- ❌ Image generation or graphic design (use Stability AI, Ideogram)
- ❌ Rendered visualizations (use charting libraries)
- ❌ Complex infographics (use design tools)
- ❌ Photo editing or manipulation
- ❌ Video or animation creation

## Core Philosophy

> "Above all else, show the data." — Edward Tufte

Diagrams should:
1. **Reduce cognitive load** — not add to it
2. **Maximize signal** — minimize noise (data-ink ratio)
3. **Be maintainable** — easy to update as understanding evolves
4. **Work everywhere** — monospace text renders universally

## Character Reference

```
BOXES:           ARROWS:          CONNECTORS:
┌─┬─┐  ╔═╦═╗    →  ←  ↑  ↓       ├  ┤  ┬  ┴
│ │ │  ║ ║ ║    ◄  ►  ▲  ▼       ╠  ╣  ╦  ╩
├─┼─┤  ╠═╬═╣    ⟶  ⟵  ⟷         ┼  ╋  ╬
│ │ │  ║ ║ ║    ⇒  ⇐  ⇔
└─┴─┘  ╚═╩═╝    ──►  ◄──        EMPHASIS:
                               ═══  ━━━
ROUNDED:        BULLETS:         ═══  ━━━
╭───╮           •  ○  ●
│   │           ├──  └──        DASHED:
╰───╯           ■  □  ▪         ┄  ┅  ┆  ┇
```

## Diagram Types Quick Reference

| Type | Use For | Key Pattern |
|------|---------|-------------|
| Flowchart | Processes, decisions | Boxes + arrows |
| Hierarchy | Org structures, taxonomies | Tree structure |
| Layers | System architecture | Stacked boxes |
| Relationship | Connections, networks | Nodes + edges |
| Sequence | Time-ordered events | Vertical flow |
| Comparison | Side-by-side analysis | Parallel columns |
| Cycle | Feedback loops | Circular arrows |
| Matrix | 2D categorization | Grid structure |

## Common Patterns

### Process Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  Start  │───►│ Process │───►│   End   │
└─────────┘    └─────────┘    └─────────┘
```

### Decision Tree

```
                ┌─────────┐
                │ Decision│
                └────┬────┘
           ┌────────┴────────┐
           ▼                 ▼
      ┌────────┐        ┌────────┐
      │  Yes   │        │   No   │
      └────────┘        └────────┘
```

### Layered Architecture

```
┌─────────────────────────────────────┐
│          PRESENTATION LAYER         │
├─────────────────────────────────────┤
│          BUSINESS LOGIC             │
├─────────────────────────────────────┤
│          DATA ACCESS                │
├─────────────────────────────────────┤
│          DATABASE                   │
└─────────────────────────────────────┘
```

### Feedback Loop

```
        ┌──────────────────┐
        │                  │
        ▼                  │
    ┌───────┐          ┌───┴───┐
    │ Input │─────────►│Output │
    └───────┘          └───────┘
        ▲                  │
        │                  │
        └──────────────────┘
```

## Design Principles

### 1. Tufte's Data-Ink Ratio

```
MAXIMIZE:                    MINIMIZE:
┌─────────────────┐         ╔══════════════════╗
│ Essential info  │         ║ ╭──────────────╮ ║
│ Clear structure │         ║ │ Same info    │ ║
│ Direct labeling │         ║ │ + decoration │ ║
└─────────────────┘         ║ ╰──────────────╯ ║
                            ╚══════════════════╝
        ✓ Good                    ✗ Chartjunk
```

### 2. Cognitive Load Management

```
CHUNKING: Group related elements

BAD:                         GOOD:
┌─┬─┬─┬─┬─┬─┬─┬─┐           ┌─────┐ ┌─────┐ ┌─────┐
│A│B│C│D│E│F│G│H│           │ A B │ │ C D │ │ E F │
└─┴─┴─┴─┴─┴─┴─┴─┘           │ (1) │ │ (2) │ │ (3) │
                            └─────┘ └─────┘ └─────┘
```

### 3. Visual Hierarchy

```
EMPHASIS LEVELS:

═══════════════════════    Level 1: Double/Heavy
───────────────────────    Level 2: Single
- - - - - - - - - - - -    Level 3: Dashed
. . . . . . . . . . . .    Level 4: Dotted
```

## Anti-Patterns to Avoid

### Chartjunk
```
✗ BAD: Excessive decoration
╔══════════════════════════════════════╗
║ ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮ ║
║ ┃ ★ ★ ★  IMPORTANT INFO  ★ ★ ★  ┃ ║
║ ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯ ║
╚══════════════════════════════════════╝

✓ GOOD: Clean and direct
┌──────────────────┐
│  Important Info  │
└──────────────────┘
```

### Information Overload
```
✗ BAD: Too much in one diagram
[Cramming 15 concepts with 30 arrows]

✓ GOOD: Break into focused diagrams
"Overview Diagram" + "Detail Diagram A" + "Detail Diagram B"
```

## Integration with Other Skills

This skill integrates with:
- **jungian-psychologist** — Psyche mapping, parts work diagrams
- **system-architect** — System architecture diagrams
- **backend-architect** — API and data flow diagrams

## Workflow

1. **Understand the content** — What are we visualizing?
2. **Choose the right type** — Hierarchy? Process? Relationship?
3. **Sketch the structure** — Start rough, refine
4. **Apply principles** — Data-ink ratio, chunking, hierarchy
5. **Test readability** — Would someone new understand this?
6. **Iterate** — Diagrams improve with revision

## Mermaid Integration

When appropriate, also provide Mermaid notation for diagrams that benefit from rendering:

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E
```

---

**Remember**: A good diagram is worth a thousand words. Create them proactively whenever complex concepts arise.

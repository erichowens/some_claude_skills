---
sidebar_label: Hero Image Style Guide
sidebar_position: 10
---

# Hero Image Style Guide

This guide defines the consistent visual style for all skill hero images. Follow these guidelines when creating new hero images to maintain visual cohesion across the skill gallery.

## Core Aesthetic: "Retro-Professional Pixel Art"

The style blends **1990s computing nostalgia** with **professional workspace imagery**, rendered in a cohesive pixel art style. Think: what if a talented pixel artist from 1995 illustrated a modern productivity tool?

---

## Required Elements

### 1. Pixel Art Rendering
- **Resolution feel**: 16-bit era (SNES/early PC game aesthetic)
- **Visible pixels**: Deliberate blockiness, no anti-aliasing smoothing
- **Clean lines**: Crisp edges, no blur or gradients within pixel blocks
- **Dithering**: Use sparingly for shading, classic pixel art dither patterns

### 2. Retro UI Chrome
Every image should incorporate period-appropriate interface elements:

- **Window frames**: Windows 3.1/95 style with:
  - Title bar (colored, with window title)
  - Traffic light buttons (red/yellow/green) OR square minimize/maximize
  - Beveled 3D borders (light top-left, shadow bottom-right)
- **Dialog boxes**: Inset panels, scrollbars, button groups
- **Menu bars**: File/Edit/View style dropdowns
- **Status bars**: Bottom information strips

### 3. Color Palette Families

Choose ONE primary palette family per image:

| Family | Primary | Secondary | Accent | Use For |
|--------|---------|-----------|--------|---------|
| **Mint/Teal Professional** | `#5B9A8B` | `#8EC5B5` | `#F5E6D3` | Business, strategy, analysis skills |
| **Synthwave Sunset** | `#FF6B9D` | `#C44569` | `#1A1A2E` | Creative, VR, futuristic skills |
| **Warm Terracotta** | `#C67B5C` | `#E8A87C` | `#41444B` | Interior, lifestyle, coaching skills |
| **Lavender Workspace** | `#9B8AA5` | `#C4B6CF` | `#F0EBF4` | Psychology, wellness, personal skills |
| **Terminal Green** | `#00FF00` | `#003300` | `#000000` | Technical, code, system skills |
| **Rainbow Spectrum** | Various | Various | `#333333` | Design, color, creative tools |

### 4. Composition Styles

Choose the appropriate composition for the skill type:

#### A. Desktop Workstation Scene
**Best for**: Professional/productivity skills
- Monitor centered, showing relevant interface
- Keyboard in foreground
- Desk accessories: plants, coffee mug, mouse
- Background: solid color or subtle pattern

**Examples**: ADHD Design Expert, Color Theory Expert, Agent Creator, Wisdom Coach

#### B. Isometric Workspace
**Best for**: Strategy, research, organization skills
- 45-degree angled view
- Objects arranged in 3D space
- Clean background with subtle grid
- Human figure optional (small scale)

**Examples**: Design Archivist, Competitive Cartographer, Collage Layout Expert

#### C. Synthwave Landscape
**Best for**: Futuristic, VR, creative tech skills
- Horizon line with gradient sunset
- Perspective grid floor (magenta/cyan lines)
- Central floating UI element
- Geometric shapes: spheres, pyramids

**Examples**: VR Avatar Engineer, Vaporwave UI Designer, Jungian Psychologist

#### D. Terminal/Flowchart
**Best for**: Technical, programming, system skills
- Dark background (pure black ideal)
- Bright monochrome elements (green, cyan, amber)
- Connected nodes, flowchart boxes
- No physical workspace, pure interface

**Examples**: Diagramming Expert

#### E. Interview/Interaction Scene
**Best for**: People-focused, coaching, HR skills
- Two figures in conversation
- Office/professional setting
- Screen showing relevant data
- Warm, approachable lighting

**Examples**: Career Biographer, HR Network Analyst

---

## Technical Specifications

### Dimensions
- **Aspect ratio**: 16:9 (preferred) or 4:3
- **Resolution**: 960×540 or 1024×576 pixels (scales well)
- **File format**: PNG (for transparency support)
- **File size**: Under 500KB

### Naming Convention
```
{skill-id}-hero.png
```
Examples: `career-biographer-hero.png`, `agent-creator-hero.png`

---

## Style Do's and Don'ts

### DO:
- ✅ Include retro window chrome (title bars, buttons)
- ✅ Use a cohesive 4-6 color palette
- ✅ Show the skill's domain clearly (what it does)
- ✅ Add subtle environmental details (plants, mugs, papers)
- ✅ Keep text minimal and stylized (can be "gibberish" pixel text)
- ✅ Use isometric or straight-on perspectives
- ✅ Include pixel-art humans when relevant (simplified features)

### DON'T:
- ❌ Use photorealistic rendering
- ❌ Include modern flat UI (Material Design, iOS style)
- ❌ Use gradients that aren't dithered
- ❌ Make the image too busy (< 5 focal elements)
- ❌ Use clipart or stock imagery
- ❌ Include real brand logos
- ❌ Make text actually readable (stylized gibberish is fine)

---

## Generation Methods

### Recommended: Local Qwen Image (2025+)

To avoid cloud quota limits, use local generation:

```bash
# Setup (one-time)
cd /tmp/qwen-image-macos
source .venv/bin/activate

# Generate image
python qwen.py generate "PROMPT" --ultra-fast --size 1024x576
# Output: ~/qwen-images/image-YYYYMMDD-HHMMSS.png
```

### Legacy: Cloud AI Generators (Ideogram, etc.)

> **Note**: Cloud generators have quota limits. For batch generation, prefer local Qwen Image.
> See `/docs/historical/IDEOGRAM_USAGE_PATTERNS.md` for preserved Ideogram patterns.

When using AI image generators (Midjourney, DALL-E, Ideogram), use this base prompt structure:

```
Pixel art [SCENE TYPE] showing [SUBJECT MATTER],
[COLOR PALETTE] color scheme,
retro Windows 95 interface elements,
16-bit video game aesthetic,
[COMPOSITION STYLE],
clean pixel art style, no anti-aliasing
--ar 16:9
```

### Example Prompts:

**For a "Database Architect" skill:**
```
Pixel art desktop workstation scene showing database schema diagram on retro monitor,
mint and teal professional color scheme,
retro Windows 95 interface with title bar and scrollbars,
16-bit video game aesthetic,
keyboard and desk plant in foreground,
clean pixel art style, no anti-aliasing
--ar 16:9
```

**For a "Meditation Guide" skill:**
```
Pixel art synthwave landscape with floating zen interface window,
lavender and sunset pink color scheme,
retro Mac OS window chrome with lotus flower icon,
16-bit video game aesthetic,
perspective grid floor with gentle mountains,
clean pixel art style, no anti-aliasing
--ar 16:9
```

---

## Reference Gallery

The following skills exemplify the target style:

| Style Category | Reference Skills |
|---------------|------------------|
| Desktop Workstation | ADHD Design Expert, Color Theory Expert, Agent Creator |
| Isometric | Design Archivist, Competitive Cartographer |
| Synthwave | VR Avatar Engineer, Vaporwave UI Designer, Jungian Psychologist |
| Terminal | Diagramming Expert |
| Interaction | Career Biographer, HR Network Analyst |
| Hybrid | Orchestrator, Design System Creator |

---

## Checklist for New Hero Images

Before submitting a new hero image, verify:

- [ ] Pixel art style with visible pixels
- [ ] Retro window/UI chrome present
- [ ] Color palette is cohesive (4-6 colors max)
- [ ] Subject matter clearly represents the skill
- [ ] Aspect ratio is 16:9
- [ ] File is PNG, under 500KB
- [ ] Named correctly: `{skill-id}-hero.png`
- [ ] No modern UI elements or photorealism
- [ ] Matches one of the five composition styles

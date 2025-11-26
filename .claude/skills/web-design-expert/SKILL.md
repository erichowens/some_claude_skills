---
name: web-design-expert
description: Creates unique web designs with brand identity, color palettes, typography, and modern UI/UX patterns. Use for brand identity development, visual design systems, layout composition, and responsive web design. Activate on "web design", "brand identity", "color palette", "UI design", "visual design", "layout". NOT for typography details (use typography-expert), color theory deep-dives (use color-theory-expert), design system tokens (use design-system-creator), or code implementation without design direction.
allowed-tools: Read,Write,Edit,WebFetch,mcp__magic__21st_magic_component_builder,mcp__magic__21st_magic_component_inspiration,mcp__magic__21st_magic_component_refiner,mcp__magic__logo_search
---

# Web Design Expert

Expert web designer and brand identity specialist creating distinctive, cohesive visual systems for web applications.

## When to Use This Skill

✅ **Use for:**
- Brand identity development (personality, visual language, guidelines)
- Color palette creation and rationale
- Layout composition and visual hierarchy
- Component visual design (not just code)
- Responsive design strategy
- Design direction and creative concepts
- WCAG accessibility review for visual elements
- Design system visual foundations

❌ **Do NOT use for:**
- Deep typography work → use typography-expert
- Color theory mathematics → use color-theory-palette-harmony-expert
- Design tokens and CSS architecture → use design-system-creator
- Retro Windows 3.1 aesthetics → use windows-3-1-web-designer
- Vaporwave/glassmorphic styles → use vaporwave-glassomorphic-ui-designer
- Native app design (iOS/Mac) → use native-app-designer
- Pure code implementation without design thinking

## Core Design Process

### 1. Discovery (Critical First Step)

**Questions to Ask Before Designing:**
```
BUSINESS CONTEXT:
- What is the primary goal of this site/app?
- Who is the target audience (demographics, technical level, expectations)?
- What action should users take (conversion goal)?
- Who are the competitors? What makes you different?

BRAND PERSONALITY:
- If this brand were a person, how would they dress? Speak?
- Pick 3 adjectives that should describe the user's feeling
- What should the brand NEVER be perceived as?

CONSTRAINTS:
- Existing brand assets to incorporate?
- Accessibility requirements beyond WCAG AA?
- Technical limitations (no JavaScript, specific framework)?
- Timeline and budget implications?
```

### 2. Visual Direction Development

**Provide 2-3 Distinct Concepts:**

Each concept should include:
- **Mood board reference** (3-5 inspiration examples with rationale)
- **Color palette** (primary, secondary, accent, neutrals with hex codes)
- **Typography direction** (font families, hierarchy approach)
- **Layout philosophy** (grid vs freeform, density, whitespace strategy)
- **Signature elements** (unique visual features that make it memorable)

**Example Concept Presentation:**
```
CONCEPT A: "Bold & Confident"
- Vibe: High-energy startup, ambitious, moves fast
- Colors: Deep black (#0a0a0a), electric blue (#0066FF), white
- Typography: Space Grotesk (bold headings), Inter (clean body)
- Layout: Asymmetric grid, large hero, bold CTAs
- Signature: Angular cuts, high contrast photography, motion

CONCEPT B: "Refined & Trustworthy"
- Vibe: Established expertise, professional, reliable
- Colors: Navy (#1a365d), warm gold (#d69e2e), cream (#faf5eb)
- Typography: Freight Display (elegant headings), Source Sans (readable body)
- Layout: Traditional grid, generous whitespace, clear hierarchy
- Signature: Subtle gradients, editorial photography, smooth transitions
```

### 3. Design Principles (Apply to Every Decision)

**Hierarchy Checklist:**
```
□ Is the most important element immediately obvious?
□ Can users scan the page in 3 seconds and understand purpose?
□ Does the eye flow naturally from primary → secondary → tertiary?
□ Are clickable elements obviously clickable?
□ Is there a clear visual distinction between content types?
```

**Consistency Checklist:**
```
□ Same colors mean same things throughout?
□ Spacing follows a consistent scale (4px, 8px, 16px, 24px, 32px...)?
□ Typography uses no more than 3 sizes/weights per page?
□ Interactive states (hover, focus, active) are predictable?
□ Icons follow same style (line weight, fill, size)?
```

## Common Anti-Patterns

### Anti-Pattern: Design by Committee
**What it looks like:** Multiple visual styles fighting on same page
**Why it's wrong:** Destroys brand coherence, confuses users
**What to do instead:** Establish design principles early, enforce consistency

### Anti-Pattern: Decoration Over Function
**What it looks like:** Fancy animations, gradients, shadows that don't serve purpose
**Why it's wrong:** Slows performance, distracts from content, dates quickly
**What to do instead:** Every visual element must earn its place

### Anti-Pattern: Ignoring the Fold
**What it looks like:** Critical information/CTAs below initial viewport
**Why it's wrong:** 80% of user attention is above fold (Nielsen)
**What to do instead:** Hero section must communicate value prop + primary CTA

### Anti-Pattern: Low Contrast Text
**What it looks like:** Light gray text on white (#999 on #fff)
**Why it's wrong:** Fails WCAG, excludes users, looks unfinished
**What to do instead:** Minimum 4.5:1 contrast ratio for body text

### Anti-Pattern: Mobile as Afterthought
**What it looks like:** Desktop-first design that "shrinks" on mobile
**Why it's wrong:** 60%+ traffic is mobile, cramped experience
**What to do instead:** Design mobile-first, enhance for desktop

### Anti-Pattern: Stock Photo Overload
**What it looks like:** Generic handshake/laptop/coffee cup imagery
**Why it's wrong:** Looks like every other corporate site, no brand identity
**What to do instead:** Custom illustration, authentic photography, or no imagery

## Layout Systems

### Grid Decision Tree
```
IF content-heavy (blog, documentation, dashboard)
  → 12-column grid, consistent gutters

IF marketing/landing page
  → Flexible sections, asymmetric allowed, dramatic whitespace

IF e-commerce/catalog
  → CSS Grid auto-fit for responsive product grids

IF editorial/magazine
  → Mixed grid, large images, pull quotes, visual variety

IF app interface
  → Sidebar + main content, dense but organized
```

### Spacing Scale (8px Base)
```css
--space-1: 4px;   /* Tight: icon padding, inline elements */
--space-2: 8px;   /* Compact: form field padding */
--space-3: 16px;  /* Default: card padding, element gaps */
--space-4: 24px;  /* Comfortable: section gaps */
--space-5: 32px;  /* Generous: major section breaks */
--space-6: 48px;  /* Dramatic: hero margins */
--space-7: 64px;  /* Statement: page sections */
--space-8: 96px;  /* Massive: landing page breaks */
```

## Color Palette Construction

### Minimum Viable Palette
```
PRIMARY: Main brand color (CTAs, key elements)
SECONDARY: Supporting color (headers, accents)
NEUTRAL DARK: Text, borders (#1a1a1a to #333)
NEUTRAL MID: Secondary text, disabled (#666 to #999)
NEUTRAL LIGHT: Backgrounds, cards (#f5f5f5 to #fafafa)
ACCENT: Success/error/warning (semantic colors)
```

### Color Psychology Quick Reference
| Color | Conveys | Use For |
|-------|---------|---------|
| Blue | Trust, stability, professional | Finance, healthcare, enterprise |
| Green | Growth, nature, success | Wellness, finance, sustainability |
| Red | Energy, urgency, passion | Food, entertainment, errors |
| Orange | Friendly, confident, creative | Startups, creative agencies |
| Purple | Luxury, wisdom, creativity | Beauty, education, premium |
| Yellow | Optimism, warmth, caution | Warnings, highlights (use sparingly) |
| Black | Sophistication, power, luxury | Fashion, luxury, minimalism |

### Dark Mode Considerations
```
DO:
- Reduce brightness of images (filter: brightness(0.85))
- Use dark grays (#121212) not pure black (#000)
- Increase contrast for text (bump from 400 to 450 weight)
- Reduce shadow intensity

DON'T:
- Simply invert colors (looks jarring)
- Keep same accent color saturation (lower by 10-20%)
- Forget to test colored text on dark backgrounds
```

## Responsive Design Strategy

### Breakpoint Philosophy
```css
/* Content-based breakpoints, not device-based */
/* Start mobile-first, add complexity as viewport grows */

/* Base: Mobile */
.container { padding: 16px; }

/* 640px: Content needs more room */
@media (min-width: 640px) {
  .container { max-width: 640px; padding: 24px; }
}

/* 1024px: Multi-column becomes useful */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* 1280px: Maximum content width reached */
@media (min-width: 1280px) {
  .container { max-width: 1200px; }
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Mobile-First Checklist
```
□ Touch targets minimum 44x44px
□ No hover-only interactions
□ Text readable without zooming (16px+ base)
□ Forms have appropriate input types (email, tel, date)
□ Images lazy-loaded and responsive
□ Navigation collapses to hamburger or bottom nav
□ Critical actions visible without scrolling
```

## Accessibility (WCAG 2.1 AA)

### Visual Accessibility Checklist
```
□ Color contrast 4.5:1 for text, 3:1 for large text
□ Information not conveyed by color alone
□ Focus indicators visible (don't remove outline)
□ Animations can be paused/reduced (prefers-reduced-motion)
□ Text resizable to 200% without breaking layout
□ Touch targets 44x44px minimum
□ Error states clearly indicated (not just red)
```

### Focus State Template
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Don't do this: */
:focus { outline: none; } /* Removes accessibility */
```

## Design Trend Evolution

### 2015-2018: Flat Design Fatigue
Clean, minimal, but often lifeless. Card-based layouts everywhere.

### 2019-2021: Depth Returns
Subtle shadows, layering, 3D elements. Dark mode becomes standard.

### 2022-2023: Bold Typography Era
Oversized headings, experimental layouts, variable fonts.

### 2024-Present: AI-Influenced Design
Generative backgrounds, dynamic personalization, accessibility-first.
Bento grid layouts, claymorphism, grain textures.

### Watch For
LLMs trained on older data may suggest:
- Flat design without depth (dated)
- Hero sliders (proven ineffective)
- Carousel galleries (users don't engage)
- Hamburger menus on desktop (hides navigation)

## Brand Styles Reference

### Brutalist
- Raw HTML aesthetic, exposed structure
- High contrast, monospace fonts
- Anti-design as design statement
- Use for: Art galleries, experimental studios, developer portfolios

### Neumorphic
- Soft shadows, raised/recessed effects
- Monochromatic palette
- Subtle depth, haptic feel
- Use for: Apps, dashboards (sparingly—accessibility concerns)

### Glassmorphic
- Frosted glass effects, transparency
- Vibrant gradients behind
- Depth through layering
- Use for: Modern apps, overlays, cards

### Minimalist
- Maximum whitespace, typography-focused
- Limited palette (2-3 colors)
- Every element intentional
- Use for: Luxury brands, portfolios, editorial

### Editorial
- Magazine-inspired layouts
- Mixed typography, pull quotes
- Large imagery, asymmetric grids
- Use for: Blogs, news sites, storytelling

## Output Deliverables

For every design project, provide:

1. **Brand Identity Guide**
   - Logo usage (if applicable)
   - Color palette with hex/RGB values
   - Typography selections with rationale
   - Voice and tone guidelines
   - Do's and Don'ts

2. **Design Specifications**
   - Spacing system
   - Border radius values
   - Shadow definitions
   - Animation timing

3. **Component Examples**
   - Buttons (all states)
   - Forms (inputs, labels, errors)
   - Cards (content variations)
   - Navigation (responsive states)

4. **Responsive Guidelines**
   - Breakpoint strategy
   - Layout changes per breakpoint
   - Touch target requirements

## 21st.dev & Component Tooling

**This skill has access to 21st.dev MCP tools for real-time design inspiration and component building.**

### Getting Inspiration
```
Use mcp__magic__21st_magic_component_inspiration to:
- Search for existing UI patterns ("hero section", "pricing table", "testimonials")
- Preview component designs before implementing
- Gather competitive reference quickly
```

**Workflow**: Before designing a component, search 21st.dev for inspiration:
1. `21st_magic_component_inspiration` → See what exists
2. Pick elements you like (layout structure, interactions)
3. Design your unique version (don't copy, be inspired)

### Building Components
```
Use mcp__magic__21st_magic_component_builder to:
- Generate production-ready React components
- Get properly typed TypeScript components
- Include Tailwind CSS styling
```

**When to use builder vs hand-code**:
- Use builder: Standard patterns (cards, buttons, forms) where speed matters
- Hand-code: Custom animations, brand-specific interactions, complex state

### Refining Components
```
Use mcp__magic__21st_magic_component_refiner to:
- Improve existing component UI
- Modernize dated designs
- Apply current design trends
```

### Finding Logos
```
Use mcp__magic__logo_search to:
- Get company logos in JSX/TSX/SVG format
- Proper brand colors and proportions
- No manual SVG hunting
```

**Anti-pattern: Over-relying on templates**
- 21st.dev is for inspiration and scaffolding, not final design
- Every component should get custom brand treatment
- Templates are starting points, not destinations

## Figma Integration (When Available)

**If Figma MCP is configured, this skill can extract design data directly from Figma files.**

### Available Figma MCPs

Several Figma MCP implementations exist (install separately):

| MCP | GitHub Stars | Best For |
|-----|--------------|----------|
| **Figma Context MCP** (GLips) | 4.4k+ | AI-friendly design data extraction |
| **Cursor Talk to Figma** (sonnylazuardi) | 2.4k+ | Bidirectional Figma manipulation |
| **Figma MCP with Chunking** | - | Large files, memory efficiency |

### Design-to-Code Workflow

```
1. Designer shares Figma file URL
2. Use Figma MCP to extract:
   - Color palette (exact hex values)
   - Typography specs (font, size, weight, line-height)
   - Spacing values
   - Component structure
3. Build design system tokens from extracted data
4. Generate components with 21st.dev builder
5. Apply Figma-extracted styles
```

### What Figma MCP Can Extract
- **Colors**: Fill colors, stroke colors, gradients
- **Typography**: Font family, size, weight, letter-spacing, line-height
- **Spacing**: Padding, margins, gaps (from auto-layout)
- **Components**: Component names, variants, properties
- **Images**: Export assets from frames

### Anti-Pattern: Manual Color Copying

**What it looks like**: Designer says "use this blue" and you guess #0066FF
**Why it's wrong**: Colors drift, brand consistency breaks
**What to do**: Extract exact values from Figma using MCP

### Setup Notes

Figma MCPs require:
1. Figma Personal Access Token (from Figma account settings)
2. MCP server installation (`npx`, Docker, or local)
3. Claude Code MCP configuration

Check MCP availability before promising Figma features.

## Integration with Other Skills

Works well with:
- **typography-expert** - Deep typography decisions
- **color-theory-palette-harmony-expert** - Color mathematics
- **design-system-creator** - Token architecture
- **vibe-matcher** - Translating feelings to visuals
- **design-archivist** - Competitive research

---

*The best design is invisible until you notice its excellence.*

---
title: Design Assessment Rubric
sidebar_label: Design Assessment Rubric
sidebar_position: 2
---
# Design Assessment Rubric

Detailed scoring criteria with examples for each dimension.

## Accessibility Scoring

### 95-100: Exceptional

**Characteristics**:
- WCAG AAA compliance throughout
- Skip links and landmark regions
- Comprehensive ARIA labels
- Reduced motion alternatives
- High contrast mode support
- Screen reader tested

**Example**: Apple's accessibility page, gov.uk

### 85-94: Excellent

**Characteristics**:
- WCAG AA compliance
- Good focus management
- Semantic HTML structure
- Appropriate alt text
- Keyboard navigable

**Example**: Stripe Dashboard, Linear

### 75-84: Good

**Characteristics**:
- WCAG AA minimum met
- Basic focus states
- Some semantic issues
- Missing skip links
- Adequate contrast

### 65-74: Fair

**Characteristics**:
- Some contrast failures
- Inconsistent focus states
- Limited semantic markup
- Keyboard traps possible

### Below 65: Needs Work

**Characteristics**:
- Failing WCAG AA
- Missing focus states
- No semantic structure
- Color-only information

---

## Color Harmony Scoring

### 95-100: Exceptional

**Characteristics**:
- Intentional color relationships (60-30-10 rule)
- Emotional resonance matches content
- Sophisticated accent usage
- Perfect saturation balance
- Considered color temperature

**Color relationship types**:
```
Complementary: High contrast, energetic
Analogous: Harmonious, calm
Triadic: Vibrant, balanced
Split-complementary: Nuanced contrast
Monochromatic: Sophisticated, unified
```

### 85-94: Excellent

**Characteristics**:
- Cohesive palette
- Clear primary/secondary/accent
- Consistent saturation levels
- Good dark/light mode adaptation

### 75-84: Good

**Characteristics**:
- Functional palette
- Some accent discord
- Adequate but safe choices
- Minor saturation inconsistencies

### 65-74: Fair

**Characteristics**:
- Palette feels random
- Competing accent colors
- No clear color system
- Saturation chaos

### Below 65: Needs Work

**Characteristics**:
- Clashing colors
- No color logic
- Jarring combinations
- Unintentional discord

---

## Typography Scoring

### Hierarchy Checklist

| Level | Relative Size | Weight | Use |
|-------|---------------|--------|-----|
| Display | 3-4x body | 700-900 | Page titles |
| H1 | 2.5x body | 600-800 | Section headers |
| H2 | 2x body | 600-700 | Subsections |
| H3 | 1.5x body | 500-600 | Card titles |
| Body | 1x (16px base) | 400-500 | Content |
| Caption | 0.875x body | 400 | Secondary info |

### Line Length Guidelines

| Content Type | Optimal | Acceptable |
|--------------|---------|------------|
| Long-form | 65-75 chars | 55-85 chars |
| UI labels | 20-40 chars | 15-50 chars |
| Headlines | 40-60 chars | 30-70 chars |

### Font Pairing Rules

**Safe Pairings**:
- Sans-serif heading + serif body (contrast)
- Same family, different weights (unity)
- Geometric + humanist (balanced contrast)

**Avoid**:
- Two similar sans-serifs (confusion)
- Three+ font families (chaos)
- Display fonts for body (unreadable)

---

## Layout Scoring

### Grid Systems

**8px Base Grid**:
```
4px   - Micro spacing (icon padding)
8px   - Element spacing
16px  - Component spacing
24px  - Section spacing
32px  - Major section breaks
48px+ - Page-level spacing
```

### Visual Weight Balance

Check:
1. Draw vertical line through center
2. Is visual weight roughly equal?
3. Intentional asymmetry vs. accidental?

### Whitespace Guidelines

| Space Type | Purpose | Common Issues |
|------------|---------|---------------|
| Micro | Breathability | Too tight = cramped |
| Meso | Grouping | Too loose = disconnected |
| Macro | Emphasis | None = overwhelming |

---

## Modernity Timeline

### Current (2024-2026)

**In Fashion**:
- Bento grids
- Variable fonts
- Micro-interactions
- Dark mode default
- AI-generated imagery
- Asymmetric layouts
- Subtle glassmorphism
- Neobrutalist accents

**Emerging**:
- Spatial design (AR/VR ready)
- Animated gradients
- 3D elements (tasteful)
- Kinetic typography

### Dated (Avoid)

| Pattern | Era | Why It's Dated |
|---------|-----|----------------|
| Hamburger on desktop | 2015-2018 | Hides critical nav |
| Carousels | 2010-2015 | Low engagement, accessibility |
| Parallax overload | 2013-2016 | Performance, motion sickness |
| Flat design extremes | 2014-2017 | Poor affordances |
| Stock photo heroes | 2012-2018 | Inauthentic, cliché |
| Heavy skeuomorphism | 2008-2013 | Visual noise |

---

## Usability Checklist

### Primary CTA Test

- [ ] Visible within 3 seconds
- [ ] Clearly differentiated from secondary actions
- [ ] Appropriate size (min 44x44px touch)
- [ ] Clear action-oriented label
- [ ] Sufficient contrast with background

### Cognitive Load Assessment

| Level | Description | Elements |
|-------|-------------|----------|
| Low | Focused, minimal choice | 1-3 actions |
| Medium | Balanced, clear hierarchy | 4-7 actions |
| High | Complex, requires effort | 8+ actions |

**Target**: Keep most pages at Low-Medium.

### Feedback Signals

Every interaction should have:
1. **Immediate** - Visual acknowledgment (hover, press)
2. **During** - Loading/progress state
3. **After** - Success/error confirmation

---

## Example Assessments

### Example 1: SaaS Dashboard

```
Overall Score: 82/100 (Excellent)

Accessibility: 85 - Good contrast, keyboard nav works, missing skip links
Color Harmony: 78 - Cohesive blue palette, accent orange feels forced
Typography: 88 - Clear hierarchy, excellent readability
Layout: 84 - Strong grid, sidebar slightly cramped
Modernity: 76 - Solid but safe, could use micro-interactions
Usability: 82 - Clear primary actions, some buried settings
```

### Example 2: Marketing Landing Page

```
Overall Score: 67/100 (Fair)

Accessibility: 58 - Contrast failures on hero text, no focus visible
Color Harmony: 72 - Nice gradient but clashes with CTA
Typography: 71 - Hierarchy unclear, body too small
Layout: 68 - Too much above fold, cramped
Modernity: 70 - Current enough, stock photo problem
Usability: 63 - CTA buried, competing actions
```

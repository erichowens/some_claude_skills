# Project Roadmap

## ⚠️ Product Appeal Analysis Update (Jan 17, 2026)

**Critical Finding**: Overall appeal score is 63/90. Strong identity fit (8/10) and trust (9/10), but **urgency score is only 4/10**. Users think "cool, maybe later" instead of converting.

**Must fix before features**:
- [ ] /bundles page 404s
- [ ] /docs/getting-started doesn't exist
- [ ] Primary CTA is a terminal command (trust ladder violation)
- [ ] No "What are Claude Skills?" education
- [ ] No urgency mechanics

---

## Current Sprint: Phase 0 - Critical Fixes

**Goal**: Fix conversion-killing issues identified by product appeal analysis

### Week 0: Critical Fixes (BEFORE ANYTHING ELSE)

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Fix /bundles page 404 | `pending` | - | Page exists in code but not accessible |
| Create /docs/getting-started | `pending` | - | Installation tutorial with clear steps |
| Add "What are Claude Skills?" section | `pending` | - | Above fold on homepage, 2-3 sentences |
| Change primary CTA | `pending` | - | From terminal command → "Browse Skills" |
| Add urgency signals | `pending` | - | "Most popular", "New this week" badges |

---

## Phase 1: Foundation & Onboarding

**Goal**: Establish infrastructure and create first-time user experience

### Week 1-2: Foundation

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Logger utility (`src/utils/logger.ts`) | `pending` | - | Debug/info/warn/error with namespace |
| TypeScript types (`src/types/features.ts`) | `pending` | - | Tutorial, Bundle, Video, Onboarding interfaces |
| Vitest configuration | `pending` | - | `vitest.config.ts` + test setup |
| Win31 design system components | `pending` | - | Modal, Button, Window base components |
| **Animation tokens** in `win31.css` | `pending` | - | `--win31-transition-fast/normal/slow`, window scale tokens |

### Week 2-4: Onboarding Modal

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| `Win31Modal` base component | `pending` | - | Reusable dialog with title bar, close button |
| `useOnboarding` hook | `pending` | - | localStorage persistence, path selection |
| `OnboardingModal` component | `pending` | - | 3-step wizard with path selection |
| Homepage integration | `pending` | - | Show on first visit, re-trigger from menu |
| Tests for onboarding flow | `pending` | - | Hook + component tests |

---

## Future Sprints

### Phase 2: Tutorial System (Weeks 5-8)

- `useTutorialProgress` hook with localStorage
- `TutorialStep` component with code copying
- `TutorialLayout` wrapper for MDX
- 3 launch tutorials:
  1. Getting Started (install → first skill)
  2. Building Your First Skill
  3. MCP Integration
- Progress dashboard page

### Phase 3: Skill Bundles (Weeks 9-11)

- Bundle YAML schema definition
- `scripts/generate-bundles.ts` generator
- `BundleCard` component
- `/bundles` page with filtering
- 5 launch bundles:
  - Startup MVP Kit
  - Code Review Suite
  - Documentation Powerhouse
  - DevOps Essentials
  - AI Development Stack

### Phase 4: Video Walkthroughs (Weeks 12-14)

- `Win31VideoPlayer` component (VHS aesthetic)
- Video gallery page
- YouTube/Loom embed integration
- 3 launch videos:
  1. Install to First Skill (5 min)
  2. Building a Custom Skill (10 min)
  3. Bundles Deep Dive (8 min)

### Phase 5: UX Polish (Weeks 15-18) — Agent 3 Strategy

**Philosophy**: Obsessive attention to detail. Premium retro, not cheap retro.

#### 5.1 Component Polish Tiers (Impact Order)

**Tier 1: Homepage Hero** (Highest Impact)
- [ ] Extract ~200 lines inline styles → CSS modules
- [ ] Add CRT monitor frame around install hero
- [ ] Implement subtle "boot sequence" animation on first load
- [ ] Optional: keyboard sounds on button press (Web Audio API, toggleable)

**Tier 2: Skills Gallery Cards**
- [ ] Consistent hover lift with Win31 shadow expansion
- [ ] "Flip card" effect showing install command on hover
- [ ] Star animation when favoriting (pixel burst effect)
- [ ] Win31-styled skeleton loading states ("Loading..." progress bars)

**Tier 3: Navigation & Title Bars**
- [ ] Subtle gradient shine on active title bars (period-appropriate)
- [ ] Proper focus states for window buttons
- [ ] "Window glass" reflection effect (linear gradient overlay)
- [ ] Make minimize/maximize buttons functional where appropriate

**Tier 4: Quick View Modal**
- [ ] Extract ~300 lines inline styles → CSS module
- [ ] Add window open/close animation (scale 0.95 → 1 + fade)
- [ ] Implement focus trap for accessibility
- [ ] Subtle scanline overlay for CRT effect

#### 5.2 Animation System

**Core Principles (DO):**
- Quick, snappy transitions (100-200ms max)
- Linear or ease-out timing (no bouncy physics)
- Pixel-perfect movements (1px increments)
- Simple fades and slides

**Avoid (DO NOT):**
- Spring/elastic animations
- Complex transforms
- Parallax effects
- Blur transitions

**Animations to Add:**
- [ ] `@keyframes win31-window-open` (scale + fade)
- [ ] `@keyframes win31-star-burst` (favorite toggle)
- [ ] Refined button press (inset shadow swap)

#### 5.3 Mobile: "Pocket Computer" Philosophy

Instead of "mobile-friendly" (loses charm), position as **pocket computer from alternate timeline**.

**Design Principles:**
- [ ] Single-column layouts with simplified window chrome
- [ ] Smaller title bar buttons, collapsible "windows"
- [ ] Minimum 44px touch targets (Apple guideline)
- [ ] Increase button padding by 50% on mobile
- [ ] Subtle "touch ripple" effect (translucent white flash)

**Navigation Pattern:**
- [ ] Bottom-docked "taskbar" on mobile
- [ ] Hamburger menu styled as "Start menu"
- [ ] Optional: swipe gestures for window switching

#### 5.4 Performance Optimization

**Core Web Vitals Targets:**
| Metric | Current (Est.) | Target |
|--------|---------------|--------|
| LCP | ~2.5s | < 1.5s |
| FID | ~50ms | < 50ms |
| CLS | ~0.1 | < 0.05 |
| INP | ~150ms | < 100ms |

**Font Loading:**
- [ ] Move Google Fonts to `<link preload>` in head
- [ ] Add `font-display: swap` to all @font-face
- [ ] Consider self-hosting Press Start 2P and VT323

**Image Optimization:**
- [ ] `loading="lazy"` on all skill hero images
- [ ] Convert remaining PNGs to WebP
- [ ] Add blur placeholder for hero images (LQIP)

**Code Splitting:**
- [ ] Lazy load WinampModal (heavy component)
- [ ] Split VaporwavePlayer into separate chunk
- [ ] Defer EcosystemDashboard components

#### 5.5 Premium Feel Checklist (Pre-Launch)

- [ ] All borders are solid (no dashed/dotted)
- [ ] All shadows are hard-edged (no blur)
- [ ] All buttons have proper inset/outset swap
- [ ] All windows have proper 4-color bevel
- [ ] All fonts use the established hierarchy
- [ ] All animations are under 250ms
- [ ] All touch targets are 44px+ on mobile
- [ ] All images have proper loading states

---

## Backlog (Unprioritized)

- [ ] Skill search with fuzzy matching
- [ ] User accounts with progress sync
- [ ] Skill ratings and reviews
- [ ] Community skill submissions
- [ ] AI-powered skill recommendations
- [ ] Skill dependency graphs
- [ ] Interactive skill playground
- [ ] Newsletter integration
- [ ] Discord bot for skill lookup
- [ ] CLI tool: `npx some-claude-skills install <bundle>`

---

## Success Metrics

| Metric | Current | Target (Phase 1) | Target (Launch) |
|--------|---------|------------------|-----------------|
| Bounce rate | Unknown | &lt;60% | &lt;40% |
| Avg. session duration | Unknown | &gt;2 min | &gt;4 min |
| Skills installed (estimated) | Unknown | +20% | +100% |
| Tutorial completion rate | N/A | &gt;50% | &gt;70% |
| Return visitor rate | Unknown | &gt;20% | &gt;35% |

---

*Last updated: 2026-01-22*

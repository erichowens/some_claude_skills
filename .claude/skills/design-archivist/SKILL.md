---
name: design-archivist
description: Long-running design anthropologist that builds comprehensive visual databases from 500-1000 real-world examples, extracting color palettes, typography patterns, layout systems, and interaction design across any domain (portfolios, e-commerce, SaaS, adult content, technical showcases). This skill should be used when users need exhaustive design research, pattern recognition across large example sets, or systematic visual analysis for competitive positioning.
allowed-tools: Read,Write,WebSearch,WebFetch
---

# Design Archivist

A design anthropologist that systematically builds comprehensive visual databases through large-scale analysis of real-world examples. This is a long-running skill designed for multi-day research jobs (2-7 days for 500-1000 examples).

## Quick Start

**Minimal example to begin archival research:**

```
User: "Research design patterns for fintech apps targeting Gen Z"

Archivist:
1. Define scope: "fintech landing pages and mobile apps, Gen Z audience (18-27)"
2. Set target: 500 examples over 2-3 days
3. Identify seeds: Venmo, Cash App, Robinhood, plus competitors
4. Begin systematic crawl with checkpoints every 10 examples
5. After 48 hours: Deliver pattern database with color trends, typography patterns, layout systems, and white space opportunities
```

**Key principle**: This is a long-running job (multi-day). Set clear scope, checkpoint frequently, report progress regularly.

## Mission

Build exhaustive design databases for any domain by analyzing hundreds to thousands of real examples, extracting patterns, and creating searchable taxonomies of visual language, interaction patterns, and design systems.

## Core Process

### 1. Domain Initialization

To begin archival research:
- Define target domain (e.g., "professional software engineer portfolios", "SaaS landing pages", "VR adult content advertisements")
- Set target count (300-1000 examples based on domain specificity)
- Identify seed URLs or search queries
- Establish focus areas (clarity, conversion, trust, technical prowess, etc.)

###  2. Systematic Crawling

For each discovered example:
1. Capture visual snapshot (screenshot)
2. Record metadata (URL, timestamp, domain context)
3. Extract visual DNA
4. Analyze contextual signals
5. Apply categorical tags
6. Save checkpoint every 10 examples

### 3. Visual DNA Extraction

For each example, extract structured visual data:

```typescript
interface VisualDNA {
  colors: {
    palette: string[]; // Hex codes
    primaryColor: string;
    secondaryColors: string[];
    accentColors: string[];
    dominance: { color: string; percentage: number }[];
  };

  typography: {
    primary: { family: string; weight: number; size: string };
    secondary: { family: string; weight: number; size: string };
    hierarchy: string[]; // Font families in order of prominence
    characteristics: string[]; // 'serif', 'sans-serif', 'monospace', 'display'
  };

  layout: {
    gridSystem: string; // '12-column', 'flexbox', 'freeform', 'masonry'
    spacing: string; // '4px base', '8px base', 'generous', 'tight'
    structure: string; // 'single-column', 'sidebar', 'grid', 'asymmetric'
    whitespace: string; // 'minimal', 'balanced', 'generous'
  };

  interactions: {
    patterns: string[]; // 'hover-lift', 'smooth-scroll', 'parallax', 'fade-in'
    speed: string; // 'instant', 'snappy', 'smooth', 'slow'
    effects: string[]; // 'blur', 'scale', 'color-shift', 'slide'
  };

  animation: {
    presence: string; // 'none', 'subtle', 'moderate', 'heavy'
    types: string[]; // 'scroll-triggered', 'hover-activated', 'auto-play'
    timing: string; // 'fast' (<200ms), 'medium' (200-500ms), 'slow' (>500ms)
  };
}
```

### 4. Context Analysis

Beyond visual elements, extract contextual insights:

```typescript
interface ContextAnalysis {
  targetAudience: {
    demographic: string;
    techSavviness: 'beginner' | 'intermediate' | 'expert';
    expectedIntent: string[];
  };

  positioning: {
    priceSignal: 'budget' | 'mid-market' | 'premium' | 'luxury';
    trustLevel: 'casual' | 'professional' | 'enterprise';
    innovationLevel: 'conservative' | 'modern' | 'cutting-edge';
  };

  successSignals: {
    engagementMetrics?: { visits: number; timeOnSite: number };
    conversionIndicators: string[]; // 'clear CTA', 'trust badges', 'social proof'
    technicalQuality: string[]; // 'fast-loading', 'responsive', 'accessible'
  };

  competitiveSet: {
    similarSites: string[]; // URLs
    differentiators: string[]; // How this site stands out
  };
}
```

### 5. Taxonomic Categorization

Tag each example across multiple dimensions:

**Style Families:**
- Minimal / Maximal / Brutalist / Skeuomorphic / Neumorphic / Glassmorphic
- Corporate / Playful / Elegant / Technical / Edgy / Warm

**Technical Sophistication:**
- Static / Basic Interactive / Advanced Interactive / Experimental

**Content Strategy:**
- Text-heavy / Image-focused / Video-first / Interactive-demo / Minimal-copy

**Navigation Patterns:**
- Traditional-nav / Hamburger / Mega-menu / Single-scroll / Tab-based

**Accessibility:**
- Excellent / Good / Basic / Poor

## Pattern Extraction

After accumulating examples, identify patterns:

### Dominant Patterns
Most common approaches in the domain (the "norm")

```typescript
interface Pattern {
  name: string;
  frequency: number; // How many examples use this
  description: string;
  examples: string[]; // URLs demonstrating pattern
  contexts: string[]; // When this pattern appears
  effectiveness: string; // Known success rate if available
}
```

### Emerging Patterns
Innovative approaches gaining traction (the "future")

### Deprecated Patterns
Outdated approaches to avoid (the "past")

### Outlier Patterns
Unique approaches that break conventions (the "experimental")

## Long-Running Infrastructure

This skill is designed to run for extended periods:

### Checkpointing Strategy
```typescript
interface Checkpoint {
  jobId: string;
  domain: string;
  progress: {
    analyzed: number;
    target: number;
    lastProcessedUrl: string;
    timestamp: Date;
  };
  visualDatabase: DesignExample[];
  queue: string[]; // Remaining URLs to process
  patterns: PatternDatabase;
}
```

Save checkpoints every 10 examples to enable resumption after interruption.

### Progress Tracking
Report progress at intervals:
- "Analyzed 250/1000 examples (25% complete)"
- "Current rate: 100 examples/day"
- "Estimated completion: 7 days"
- "Top emerging pattern: glassmorphic cards (seen in 15% of recent examples)"

### Rate Limiting
Respect website rate limits:
- Max 1 request per second per domain
- Respect robots.txt
- Implement exponential backoff on errors
- Rotate user agents to avoid blocks

## Domain-Specific Adaptations

### Professional Portfolios
Focus on: Clarity, credibility, personality, storytelling, accessibility
Seed sources: Awwwards, Dribbble, Behance, personal sites of known engineers

### SaaS Landing Pages
Focus on: Conversion optimization, trust signals, feature presentation, pricing clarity
Seed sources: SaaS directories, Product Hunt, competitor analysis

### E-Commerce Sites
Focus on: Product photography, checkout flow, mobile experience, trust badges
Seed sources: Shopify stores, major retailers, niche marketplaces

### Adult Content Sites
Focus on: Premium positioning, discretion, trust signals, age verification UX
Seed sources: Adult ad networks, VR platforms, competitor landing pages
**Note:** Handle with professional discretion and respect privacy

### Technical Showcases (Shader Art, 3D Demos)
Focus on: Visual drama, performance metrics, interactive demos, technical depth
Seed sources: Shadertoy, ArtStation, Codrops, technical portfolios

## Output Format

Generate comprehensive research packages:

```typescript
interface ArchiveOutput {
  meta: {
    domain: string;
    examplesAnalyzed: number;
    dateRange: { start: Date; end: Date };
    analysisDepth: 'quick' | 'standard' | 'exhaustive';
  };

  examples: DesignExample[]; // Full database

  patterns: {
    dominant: Pattern[];
    emerging: Pattern[];
    deprecated: Pattern[];
    outliers: Pattern[];
  };

  insights: {
    colorTrends: string[];
    typographyTrends: string[];
    layoutTrends: string[];
    interactionTrends: string[];
    technicalTrends: string[];
  };

  recommendations: {
    safeChoices: string[]; // Proven patterns for risk-averse projects
    differentiators: string[]; // Underutilized patterns for standing out
    avoid: string[]; // Deprecated or overused patterns
  };
}
```

## When NOT to Use

This skill is NOT appropriate for:
- Quick design inspiration (use Pinterest, Dribbble, or Awwwards directly)
- Single example analysis (just analyze the one site)
- Small sample sizes (<50 examples) (manual research is faster)
- Real-time trend spotting (this takes days, not hours)
- Copywriting or content strategy (visual patterns only)

## Common Anti-Patterns

### Anti-Pattern: Scraping Too Aggressively
**What it looks like**: Requesting screenshots every 100ms, hitting same domain repeatedly
**Why it's wrong**: Gets blocked, burns reputation, violates robots.txt, disrespectful to site owners
**What to do instead**: 1 request/second maximum per domain, respect robots.txt, implement exponential backoff

### Anti-Pattern: No Checkpointing
**What it looks like**: Running for 24 hours straight without saving progress
**Why it's wrong**: Job crashes, network fails, rate limits hit - lose all work
**What to do instead**: Save checkpoint every 10 examples minimum, include timestamp and queue state

### Anti-Pattern: Ignoring Domain Context
**What it looks like**: Applying e-commerce conversion patterns to portfolio sites
**Why it's wrong**: Different domains have different success metrics and conventions
**What to do instead**: Research domain-specific best practices first, adapt analysis criteria per domain

### Anti-Pattern: Analysis Paralysis
**What it looks like**: Spending 30 minutes analyzing each of 1000 examples
**Why it's wrong**: Diminishing returns, job takes weeks instead of days
**What to do instead**: Batch process in groups of 10, extract key patterns quickly, deep-dive only on outliers

## Troubleshooting

### Issue: Getting rate-limited or blocked
**Cause**: Too aggressive crawling, insufficient delays between requests
**Fix**: Implement 1-2 second delays, rotate user agents, respect robots.txt, add exponential backoff on errors

### Issue: Checkpoint restoration fails
**Cause**: Corrupted checkpoint file, incompatible data structure
**Fix**: Save checkpoints as JSON with version metadata, validate on load, keep last 3 checkpoints as backup

### Issue: Screenshots are blank or broken
**Cause**: Page requires JavaScript, authentication, or has anti-scraping measures
**Fix**: Use headless browser with JavaScript enabled, wait for page load events, handle auth cookies properly

### Issue: Can't categorize visual style consistently
**Cause**: Ambiguous or overlapping style definitions
**Fix**: Create clear taxonomy up front, use multiple tags per example, track "uncertainty" flag for borderline cases

## Integration with Other Skills

This skill works well with other existing skills:
- **Research Analyst**: Feed domain research to research-analyst for competitive context
- **Web Design Expert**: Provide pattern database to inform web-design-expert decisions

## Best Practices

### Quality Over Speed
- Prioritize accurate analysis over fast completion
- Multi-day jobs are expected and acceptable
- Better to analyze 500 examples well than 1000 poorly

### Diversity of Examples
- Include both leaders and lesser-known examples
- Cover geographic diversity if relevant
- Span from conservative to experimental
- Include both large companies and independents

### Historical Context
- Note when patterns emerged
- Track evolution over time
- Use Wayback Machine for historical analysis when relevant

### Ethical Considerations
- Respect copyright and privacy
- Don't scrape private/authenticated content
- Be mindful when analyzing sensitive domains
- Cite sources appropriately

## Cost and Scale Estimation

For a typical 1000-example analysis:
- **Screenshots**: ~$20 (Playwright cloud at $0.02/screenshot)
- **LLM Analysis**: ~$15 (100 batches × $0.15/batch, Claude Sonnet vision)
- **Storage**: ~$0.01 (200MB screenshots)
- **Total**: ~$35
- **Runtime**: 48-72 hours

Users should be informed of scope and cost before beginning analysis.

## Tool Requirements

To execute archival research effectively, the following capabilities are needed:
- Browser automation for screenshots
- Web scraping for structured data extraction
- Image analysis for visual feature extraction
- Search capabilities for finding examples
- File storage for checkpoints and screenshots
- Note: Use available MCP servers or build custom scripts as needed

## Example Usage

```
User: "I need to research design patterns for fintech landing pages targeting Gen Z"

Archivist:
- Initializes job for "fintech landing pages, Gen Z target"
- Sets target: 500 examples
- Identifies seed URLs: Venmo, Cash App, Robinhood, Revolut, plus competitors
- Begins systematic crawl
- After 48 hours: "Analyzed 500 examples. Key findings:
  * 78% use vibrant gradients (vs 45% in traditional finance)
  * 92% have mobile-first layouts
  * 65% use playful, accessible language
  * Emerging: gamification elements, social features
  * Avoid: Corporate blues, traditional banking imagery"
```

This skill transforms ad-hoc design decisions into data-informed choices grounded in comprehensive market research.

---
name: competitive-cartographer
description: Strategic analyst that maps competitive landscapes, identifies white space opportunities, and provides positioning recommendations. Use when users need competitive analysis, market positioning strategy, differentiation tactics, or "how do I stand out?" guidance across any domain (portfolios, products, services). NOT for market size estimation or financial forecasting.
allowed-tools: Read,Write,WebSearch,WebFetch
---

# Competitive Cartographer

A strategic analyst who maps competitive spaces to reveal positioning opportunities, white space, and differentiation strategies. Think of this as creating a "you are here" map in a crowded market.

## Quick Start

**Minimal example to map competitive landscape:**

```
User: "How do I stand out as a senior frontend engineer?"

Cartographer:
1. Define space: "Professional portfolios for senior frontend engineers"
2. Identify players:
   - Direct: Other senior frontend engineers in similar tech stacks
   - Adjacent: Full-stack engineers, design engineers
   - Aspirational: Apple's minimal aesthetic
3. Map on axes: Technical Depth (x) vs Design Polish (y)
4. Find white space: High tech + high design (rare combination)
5. Recommend positioning: "Engineer who thinks like a designer"
```

**Key principle**: Don't just list competitors - map them spatially to reveal positioning opportunities.

## Core Mission

Transform competitive chaos into strategic clarity by:
1. Identifying all players in a space (direct, adjacent, aspirational)
2. Analyzing how they position themselves
3. Finding under-served positioning opportunities
4. Recommending specific differentiation strategies

## When to Use

✅ Use when:
- User asks "how do I stand out?" or "what makes me different?"
- Launching product/service and need positioning strategy
- Feeling lost in crowded market
- Considering pivot or repositioning
- User says "everyone does X, how do I compete?"

❌ Do NOT use when:
- User needs market size or TAM estimates (use market research)
- Financial projections or fundraising strategy
- Specific competitor feature comparison (just compare features directly)
- Legal competitive intelligence (stay ethical)
- User already has clear positioning

## Competitive Mapping Process

### 1. Define the Space

Clarify what competitive landscape to map:
- **Domain**: Portfolio sites? SaaS products? Consulting services?
- **User's offer**: What are they selling/showcasing?
- **User's background**: Strengths, constraints, unique assets
- **Goals**: Brand awareness? Lead generation? Thought leadership?

### 2. Identify Players

Find three types of competitors:

#### Direct Competitors
Same domain, same audience, same offering
- Example (portfolio): Other senior engineers in same tech stack
- Example (SaaS): Other project management tools for design teams
- Example (service): Other freelance designers in same city

####  Adjacent Competitors
Nearby domains, overlapping audience
- Example (portfolio): Engineers in adjacent stacks, designers with similar aesthetic
- Example (SaaS): Adjacent tools (time tracking, team chat) that solve related problems
- Example (service): Agencies or in-house teams user competes against for work

#### Aspirational References
Different domain but desired positioning/vibe
- Example (portfolio): Apple's minimal aesthetic (though not a portfolio)
- Example (SaaS): Notion's community-driven growth (though different product)
- Example (service): Patagonia's values-driven brand (though different industry)

### 3. Analyze Positioning

For each competitor, extract:

```typescript
interface CompetitorProfile {
  name: string;
  url: string;

  positioning: {
    tagline: string; // How they describe themselves
    primaryMessage: string; // Main value prop
    differentiation: string; // How they claim to be different
  };

  visualStrategy: {
    aestheticStyle: string; // Minimal, maximal, corporate, edgy, etc.
    colorPalette: string[]; // Dominant colors
    typography: string; // Serif, sans, display characteristics
    layout: string; // Grid, asymmetric, single-page, etc.
  };

  contentStrategy: {
    tone: string; // Professional, casual, technical, friendly
    depth: string; // Surface-level or deep technical content
    focus: string; // Process, results, personality, credentials
  };

  strengths: string[]; // What they do well
  weaknesses: string[]; // Gaps or vulnerabilities
  audience: string; // Who they're clearly targeting
}
```

### 4. Create Competitive Map

Plot competitors on 2D space using strategic dimensions:

**Common Dimension Pairs**:
- Technical depth ↔ Accessibility (for portfolios)
- Feature-rich ↔ Simple (for products)
- Enterprise ↔ Individual (for tools)
- Conservative ↔ Innovative (for agencies)
- Low-touch ↔ High-touch (for services)

```typescript
interface CompetitiveMap {
  axes: {
    x: { name: string; low: string; high: string };
    y: { name: string; low: string; high: string };
  };

  players: Array<{
    name: string;
    position: { x: number; y: number }; // 0-100 scale
    size?: number; // Optional: market presence
  }>;

  clusters: Array<{
    name: string; // "Enterprise focus", "Indie hackers", etc.
    members: string[];
    characteristics: string;
  }>;

  whiteSpace: Array<{
    position: { x: number; y: number };
    description: string;
    why: string; // Why this space is open
  }>;
}
```

### 5. Identify White Space

Find under-served positioning opportunities:

#### Criteria for Good White Space
- **Viable**: Target audience exists and is reachable
- **Defensible**: User has unique advantage to claim this space
- **Sustainable**: Not a temporary gap that will flood with competitors
- **Aligned**: Matches user's strengths and goals

#### Types of White Space

**Intersection Spaces**
- "Technical depth + warm personality" (most engineers pick one)
- "Enterprise features + indie pricing" (most do one or other)
- "Conservative trust + innovative approach" (rare combination)

**Under-served Audiences**
- "Mid-market companies" (everyone targets enterprise or startups)
- "Non-technical founders" (most tools assume technical users)
- "Legacy system maintainers" (everyone chases greenfield projects)

**Contrarian Positions**
- "Slow and thoughtful" (when everyone races to launch fast)
- "Expensive and exclusive" (when market races to bottom on price)
- "Opinionated and prescriptive" (when everyone offers flexibility)

### 6. Strategic Recommendations

Provide specific, actionable positioning strategy:

```typescript
interface Strategy {
  positioning: {
    headline: string; // One-line positioning statement
    differentiators: string[]; // Specific ways to stand out
    messaging: string; // Key messages to emphasize
  };

  visualStrategy: {
    aestheticDirection: string; // How to look different
    avoid: string[]; // Crowded visual patterns to avoid
    embrace: string[]; // Underutilized patterns to adopt
  };

  contentStrategy: {
    topics: string[]; // What to write/talk about
    tone: string; // How to sound different
    depth: string; // How deep to go
  };

  risks: string[]; // Potential downsides of this positioning
  validation: string[]; // How to test if positioning resonates
}
```

## Domain-Specific Positioning

Different domains have different positioning dynamics:

### Professional Portfolios

**Common positions** (crowded):
- "Full-stack engineer with X years experience"
- "Passionate about clean code"
- "Blockchain/AI/ML specialist"

**White space opportunities**:
- "Engineer who explains technical decisions to non-technical stakeholders"
- "Specialist in legacy system modernization"
- "Technical leader who builds teams, not just code"

### SaaS Products

**Common positions** (crowded):
- "The simple alternative to [big competitor]"
- "All-in-one platform for [broad category]"
- "AI-powered [generic tool]"

**White space opportunities**:
- "Opinionated tool that does one thing perfectly"
- "Premium tier of [commodity category]"
- "Integration layer between [specific tools]"

### Consulting/Freelance Services

**Common positions** (crowded):
- "Full-service agency"
- "Affordable freelancer"
- "10+ years experience"

**White space opportunities**:
- "Specialist in [specific vertical/problem]"
- "Productized service with fixed scope"
- "Teaching/training alongside delivery"

## Common Anti-Patterns

### Anti-Pattern: Me-Too Positioning
**What it looks like**: "We're like Airbnb but for [different thing]"
**Why it's wrong**: Invites direct comparison where you'll lose (they have bigger brand, more resources)
**What to do instead**: Find your unique angle that makes comparison irrelevant

### Anti-Pattern: Swiss Army Knife Syndrome
**What it looks like**: "We do everything for everyone"
**Why it's wrong**: In crowded market, specialists beat generalists
**What to do instead**: Pick one thing you'll be known for, even if you can do more

### Anti-Pattern: Feature Parity Race
**What it looks like**: "We have all the features competitors have, plus one more"
**Why it's wrong**: Mature competitors will always out-feature you; you win on positioning not features
**What to do instead**: Different approach/philosophy, not more features

### Anti-Pattern: Ignoring Your Constraints
**What it looks like**: Positioning as enterprise solution when you're solo founder
**Why it's wrong**: Can't deliver on positioning promise, credibility destroyed
**What to do instead**: Position where your constraints become advantages ("boutique", "founder-led")

## When NOT to Use

This skill is NOT appropriate for:
- Market size/TAM calculations (use market research)
- Financial modeling or pricing strategy
- Detailed feature-by-feature comparison
- Competitive intelligence gathering (this analyzes existing knowledge, doesn't spy)
- Legal or IP competitive analysis

## Troubleshooting

### Issue: Can't find any white space
**Cause**: Market is genuinely saturated OR looking at wrong dimensions
**Fix**: Zoom out to adjacent categories, or zoom in to micro-niches. Try different axis pairs for mapping.

### Issue: User resists differentiation
**Example**: "But I can do everything they do!"
**Fix**: Explain positioning vs capability. You can DO many things, but you're KNOWN for one thing. Choose what you want to be known for.

### Issue: White space has no audience
**Example**: Found gap but no one wants that position
**Fix**: Validate before committing. Can be white space because it's bad space, not just overlooked.

### Issue: Recommended positioning feels inauthentic
**Example**: Strategy is sound but doesn't match user's personality
**Fix**: Positioning must be authentic. Find white space that aligns with user's genuine strengths and values.

## Integration with Other Skills

Works well with:
- **Design Archivist**: Use visual pattern database to inform visual differentiation strategy
- **Vibe Matcher**: Translate positioning strategy into emotional/visual direction
- **Research Analyst**: Feed competitive insights to deeper market research
- **Career Biographer**: Competitive context informs personal brand positioning

## Best Practices

### Start with User, Not Market
1. What's genuinely unique about user?
2. What do they do better than anyone?
3. What do they want to be known for?
4. Then find where that fits in competitive landscape

### Be Ruthlessly Honest
- Point out when user's desired positioning is crowded
- Identify genuine weaknesses vs competitors
- Recommend against poor strategic fit
- Better to surface hard truths early

### Provide Evidence
Don't just say "this space is crowded" - show specific examples:
- "Here are 15 portfolios using exact same layout"
- "Here are 8 products with nearly identical taglines"
- "Here's how competitors cluster around this position"

### Think Long-Term
- Will this positioning still work in 2-3 years?
- Is it defensible or easily copied?
- Does it allow room to grow/evolve?

## Example Competitive Maps

### Example 1: Portfolio Site Positioning

**User**: Senior frontend engineer, 8 years experience, strong design sense

**Competitors mapped on**:
- X-axis: Technical Depth (Low → High)
- Y-axis: Design Polish (Functional → Beautiful)

**Findings**:
- Cluster 1 (high tech, low design): Backend engineers, functional portfolios
- Cluster 2 (low tech, high design): Designers with code, beautiful but shallow
- White space: High tech + high design (rare combination)

**Recommended Positioning**:
"Engineer who thinks like a designer - deep technical expertise with an eye for aesthetics. I build systems that don't just work, but delight."

**Differentiation tactics**:
- Visual: Showcase code AND design process
- Content: Write about intersection of engineering and UX
- Projects: Highlight both technical architecture and user experience

### Example 2: SaaS Product Positioning

**User**: Task management tool for remote teams

**Competitors mapped on**:
- X-axis: Simplicity (Minimal → Feature-rich)
- Y-axis: Integration (Standalone → Hub)

**Findings**:
- Cluster 1: Simple, standalone (Todoist, Things)
- Cluster 2: Feature-rich, standalone (Asana, Monday)
- Cluster 3: Feature-rich, hub (Notion, ClickUp)
- White space: Simple + hub (minimal UI but connects everything)

**Recommended Positioning**:
"The calm center of your workflow chaos - simple task management that connects your entire toolkit without overwhelming you."

**Differentiation tactics**:
- Features: Deep integrations, minimal interface
- Messaging: Anti-feature-bloat, pro-integration
- Visual: Clean, spacious UI that fades into background

## Evolution Timeline

### 2000-2010: Features Race Era
Positioning was about feature count - "we have 47 features!"

### 2010-2015: "Simple Alternative" Era
Positioning was about simplicity - "Simpler than [big competitor]"

### 2015-2020: "All-in-One" Era
Positioning was about consolidation - "Replace 10 tools with one"

### 2020-Present: Specialization Era
Positioning is about focus - "We do one thing better than anyone"

### Watch For
Generic "AI-powered" positioning is 2023's "blockchain-powered" - avoid unless AI is genuinely core differentiator

## Validation Questions

Before finalizing positioning strategy, validate:
1. **Is it credible?** Can user actually deliver on this positioning?
2. **Is it memorable?** Will people remember how user is different?
3. **Is it defensible?** Can user protect this positioning from copycats?
4. **Is it sustainable?** Will this positioning work long-term?
5. **Is it authentic?** Does it match user's genuine strengths and personality?

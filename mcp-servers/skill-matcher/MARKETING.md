# Skill Matcher: Marketing & Website Integration Strategy

## Product Naming

### Primary Name: **SkillFinder**

**Full name:** SkillFinder by Some Claude Skills

**Taglines:**
- "The right skill, right now"
- "Adaptive AI skill discovery"
- "Find your perfect Claude skill instantly"

**Alternative names considered:**
- SkillMatch Pro
- SkillRadar
- SkillScope
- SkillSeek
- The Skill Oracle

### Why "SkillFinder"
1. **Clarity** - Immediately communicates what it does
2. **Memorability** - Simple, two-syllable compound word
3. **Action-oriented** - Implies active discovery
4. **Brand alignment** - Complements "Some Claude Skills" without competing

---

## Website Integration Plan

### 1. New Landing Page: `/skillfinder`

**Hero Section:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              🔍 SkillFinder                                     │
│              The Right Skill, Right Now                         │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐     │
│    │ Describe what you want to accomplish...             │     │
│    └─────────────────────────────────────────────────────┘     │
│                      [ Find Skills ]                            │
│                                                                 │
│    Try: "design a mobile app" | "analyze my photos" | ...      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features Section:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Semantic Search      │  🔌 External Discovery  │  💡 Gap    │
│  Find the perfect skill  │  Query MCP registries,  │  Analysis  │
│  using natural language  │  Smithery, Glama & more │  What's    │
│  descriptions            │  (opt-in)               │  missing?  │
└─────────────────────────────────────────────────────────────────┘
```

**Interactive Demo:**
- Live skill matching against the full catalog
- Shows match scores, reasoning, and suggestions
- "No match? Here's what we'd build" gap analysis display

### 2. Navigation Integration

**Navbar Addition:**
```
Home | Skills | Agents | MCPs | Artifacts | SkillFinder [NEW]
```

**Skills Page Enhancement:**
- Add SkillFinder search bar at top of /skills page
- Replace basic text search with SkillFinder semantic search
- Show "Did you mean?" suggestions from SkillFinder

### 3. Homepage Integration

**Add to homepage:**
```
┌─────────────────────────────────────────────────────────────────┐
│                      Quick Skill Discovery                       │
│                                                                 │
│    What do you want to accomplish?                              │
│    ┌─────────────────────────────────────────────────────┐     │
│    │ "Help me..."                                        │     │
│    └─────────────────────────────────────────────────────┘     │
│    Powered by SkillFinder                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4. API Page: `/skillfinder/api`

Document the MCP server and client SDK for developers:
- Installation instructions
- Tool reference
- Schema documentation
- Integration examples

---

## Target Audiences

### 1. Claude Code Users (Primary)
- **Pain point:** "Which skill do I need?"
- **Value prop:** Instant discovery without browsing
- **Channel:** Claude Code documentation, GitHub

### 2. MCP Developers (Secondary)
- **Pain point:** Fragmented skill ecosystem
- **Value prop:** Unified search across registries
- **Channel:** MCP community, awesome-mcp

### 3. AI Enthusiasts (Tertiary)
- **Pain point:** Overwhelmed by AI tools
- **Value prop:** Curated, searchable skill library
- **Channel:** Twitter/X, Reddit r/ClaudeAI

---

## Marketing Messages

### Core Message
> "Stop browsing, start finding. SkillFinder uses semantic search to instantly match your task to the perfect Claude skill."

### Feature-Specific Messages

**For Semantic Search:**
> "Describe your task in plain English. SkillFinder understands context, not just keywords."

**For Gap Analysis:**
> "No matching skill? We'll tell you exactly what would help and how to build it."

**For External Search:**
> "Search beyond our catalog. Query Smithery, Glama, and the official MCP registry with one click."

### Social Proof Templates
- "X skills matched in Y ms"
- "Used by Z developers to find the right tool"
- "Gap analysis has inspired N new community skills"

---

## Launch Strategy

### Phase 1: Soft Launch (Week 1)
1. Deploy SkillFinder page on someclaudeskills.com
2. Announce in project README
3. Add to Claude Code MCP config examples

### Phase 2: Community Launch (Week 2)
1. Post on r/ClaudeAI
2. Tweet thread with demo GIFs
3. Add to awesome-mcp list

### Phase 3: Integration Push (Week 3-4)
1. Create Claude Code slash command: `/skillfinder <query>`
2. Build VS Code extension integration
3. Partner with MCP directory sites

### Phase 4: Ecosystem Growth (Ongoing)
1. Encourage community skill submissions
2. Highlight "Skills Created from Gap Analysis"
3. Monthly "Skill Discovery" blog posts

---

## Metrics & Success Criteria

### Usage Metrics
- Daily active searches
- Search → skill click-through rate
- External search opt-in rate
- Gap analysis → new skill conversion

### Quality Metrics
- Match relevance feedback (thumbs up/down)
- Time to find relevant skill
- Return user rate

### Growth Metrics
- New skills added per month
- Community contributions
- MCP registry cross-references

---

## Competitive Positioning

### vs. Basic Search
- **Them:** Keyword matching only
- **Us:** Semantic understanding + keyword hybrid

### vs. ChatGPT Plugins
- **Them:** Broad, unfocused
- **Us:** Curated, Claude-optimized skills

### vs. MCP Registries
- **Them:** Lists without context
- **Us:** Intelligent matching + gap analysis

---

## Content Calendar

### Blog Posts
1. "Introducing SkillFinder: AI Skill Discovery" (launch)
2. "How Semantic Search Beats Keyword Matching" (week 2)
3. "From Gap Analysis to New Skill: A Case Study" (week 4)
4. "Building Skills the Community Needs" (month 2)

### Social Content
- Weekly "Skill Spotlight" featuring underused skills
- "Gap of the Week" - interesting missing skills
- User success stories

### Documentation
- SkillFinder Guide
- API Reference
- Schema Documentation
- Integration Tutorials

---

## Technical SEO

### Target Keywords
- "claude skills"
- "mcp skill finder"
- "ai skill discovery"
- "claude code skills"
- "find mcp server"

### Page Optimization
- Title: "SkillFinder - Discover Claude Skills | Some Claude Skills"
- Meta: "Find the perfect Claude skill instantly using semantic search. 50+ curated skills with gap analysis."
- OG Image: Custom SkillFinder hero

### Schema Markup
```json
{
  "@type": "SoftwareApplication",
  "name": "SkillFinder",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0"
  }
}
```

---

## Future Enhancements

### Near-term (1-3 months)
- Voice search ("Hey SkillFinder, I need help with...")
- Skill comparison view
- Personal favorites sync

### Mid-term (3-6 months)
- Skill recommendation feed
- "Skills like this" suggestions
- Usage analytics dashboard

### Long-term (6-12 months)
- Auto-skill generation from gap analysis
- Community voting on new skills
- Enterprise skill management

---

## Budget Considerations

### Free Tier
- Full semantic search
- Gap analysis
- Basic external search (rate limited)

### Future Premium (if needed)
- Unlimited external search
- Custom skill catalogs
- Team/enterprise features
- API rate limits lifted

---

## Summary

SkillFinder transforms the skill discovery experience from "browse and hope" to "describe and find." By integrating semantic search directly into someclaudeskills.com and providing gap analysis when skills are missing, we create a virtuous cycle of discovery and creation that grows the ecosystem.

**Key differentiators:**
1. Semantic understanding, not just keywords
2. Gap analysis that inspires new skills
3. Unified search across multiple registries
4. Open schema for community contributions

**Launch priority:** High - this is foundational infrastructure for ecosystem growth.

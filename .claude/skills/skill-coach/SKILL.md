---
name: skill-coach
description: "Guides creation of high-quality Agent Skills with domain expertise, anti-pattern detection, and progressive disclosure best practices. Use when creating skills, reviewing existing skills, or when users mention improving skill quality, encoding expertise, or avoiding common AI tooling mistakes. Activate on keywords: create skill, review skill, skill quality, skill best practices, skill anti-patterns. NOT for general coding advice or non-skill Claude Code features."
allowed-tools: Read,Write,Bash,Glob,Grep,Edit
---

# Skill Coach: Creating Expert-Level Agent Skills

Encode real domain expertise, not just surface-level instructions. Focus on **shibboleths** - the deep knowledge that separates novices from experts.

## When to Use This Skill

**Use for:**
- Creating new Agent Skills from scratch
- Reviewing/auditing existing skills
- Improving skill activation rates
- Adding domain expertise to skills
- Debugging why skills don't activate

**NOT for:**
- General Claude Code features (slash commands, MCPs)
- Non-skill coding advice
- Debugging runtime errors (use domain skills)

## Quick Wins

**Immediate improvements for existing skills**:
1. **Add NOT clause** to description → Prevents false activation
2. **Add 1-2 anti-patterns** → Prevents common mistakes
3. **Check line count** (`wc -l`) → Should be fewer than 500 lines
4. **Remove dead files** → Delete unreferenced scripts/references
5. **Test activation** → Questions that should/shouldn't trigger it

## What Makes a Great Skill

Great skills are **progressive disclosure machines** that:
1. **Activate precisely** - Specific keywords + NOT clause
2. **Encode shibboleths** - Expert knowledge that separates novice from expert
3. **Surface anti-patterns** - "If you see X, that's wrong because Y, use Z"
4. **Capture temporal knowledge** - "Pre-2024: X. 2024+: Y"
5. **Know their limits** - "Use for A, B, C. NOT for D, E, F"
6. **Provide decision trees** - Not templates, but "If X then A, if Y then B"
7. **Stay under 500 lines** - Core in SKILL.md, deep dives in /references

## Core Principles

### Progressive Disclosure

- **Phase 1 (~100 tokens)**: Metadata - "Should I activate?"
- **Phase 2 (&lt;5k tokens)**: SKILL.md - "How do I do this?"
- **Phase 3 (as needed)**: References - "Show me the details"

**Critical**: Keep SKILL.md under 500 lines. Split details into `/references`.

### Description Formula

**[What] [Use for] [Keywords] NOT for [Exclusions]**

```
❌ Bad: "Helps with images"
⚠️ Better: "Image processing with CLIP"
✅ Good: "CLIP semantic search. Use for image-text matching.
   Activate on 'CLIP', 'embeddings'. NOT for counting, spatial reasoning."
```

## SKILL.md Template

```markdown
---
name: your-skill-name
description: [What] [When] [Triggers]. NOT for [Exclusions].
allowed-tools: Read,Write  # Minimal only
---

# Skill Name
[One sentence purpose]

## When to Use
✅ Use for: [A, B, C]
❌ NOT for: [D, E, F]

## Core Instructions
[Step-by-step, decision trees, not templates]

## Common Anti-Patterns
### [Pattern]
**Symptom**: [Recognition]
**Problem**: [Why wrong]
**Solution**: [Better approach]
```

## Skill Structure

**Mandatory**:
```
your-skill/
└── SKILL.md           # Core instructions (max 500 lines)
```

**Strongly Recommended** (self-contained skills):
```
├── scripts/           # Working code - NOT templates
├── mcp-server/        # Custom MCP if external APIs needed
├── agents/            # Subagent definitions if orchestration needed
├── references/        # Deep dives on domain knowledge
└── CHANGELOG.md       # Version history
```

## Self-Contained Skills (RECOMMENDED)

**Skills with working tools are immediately useful. Skills with only instructions require manual implementation.**

### Why Ship Tools?

| Skill Type | User Experience |
|------------|-----------------|
| Instructions only | "Great advice, now I have to build it myself" |
| With working tools | "I can use this RIGHT NOW" |

### What to Include

**Scripts** - Working code for the domain:
```
scripts/
├── analyze.py       # Actually works, not a template
├── validate.sh      # Pre-flight checks
└── README.md        # How to run
```

**MCP Server** - When external APIs are needed:
```
mcp-server/
├── server.py        # Ready to install
├── package.json     # Dependencies
└── README.md        # `npx @anthropic/create-mcp-server`
```

**Subagents** - When orchestration is needed:
```
agents/
├── workflow.md      # Agent definition
└── prompts/         # Agent system prompts
```

### Decision Tree: What Tools Does My Skill Need?

```
Does skill need external APIs (GitHub, Figma, databases)?
├── YES → Build an MCP server
└── NO → Does skill need multi-step orchestration?
    ├── YES → Define subagents
    └── NO → Does skill have repeatable operations?
        ├── YES → Write scripts
        └── NO → References only (rare)
```

See `references/self-contained-tools.md` for implementation patterns.

## Decision Trees

**When to create a NEW skill?**
- ✅ Domain expertise not in existing skills
- ✅ Pattern repeats across 3+ projects
- ✅ Anti-patterns you want to prevent
- ❌ One-time task → Just do it directly
- ❌ Existing skill could be extended → Improve that one

**Skill vs Subagent vs MCP?**
- **Skill**: Domain expertise, decision trees (no runtime state)
- **Subagent**: Multi-step workflows needing tool orchestration
- **MCP**: External APIs, auth, stateful connections

## Common Workflows

**Create Skill from Expertise**:
1. Define scope: What expertise? What keywords? What NOT to handle?
2. Write description with keywords and NOT clause
3. Add anti-patterns you've observed
4. Test activation thoroughly

**Debug Activation Issues**:
1. Review description - missing keywords?
2. Add NOT clause if false positives
3. Test with specific phrases

## Tool Permissions

**Guidelines**:
- Read-only skill: `Read,Grep,Glob`
- File modifier: `Read,Write,Edit`
- Build integration: `Read,Write,Bash(npm:*,git:*)`
- ⚠️ **Never**: Unrestricted `Bash` for untrusted skills

## Success Metrics

| Metric | Target |
|--------|--------|
| Correct activation | &gt;90% |
| False positive rate | &lt;5% |
| Token usage | &lt;5k typical |

## Reference Files

| File | Contents |
|------|----------|
| `references/anti-patterns.md` | Detailed anti-pattern examples with fixes |
| `references/shibboleths.md` | Expert vs novice knowledge patterns |
| `references/validation-checklist.md` | Complete review and testing guide |
| `references/self-contained-tools.md` | Scripts, MCP servers, and subagent implementation patterns |

---

**This skill guides**: Skill creation | Skill auditing | Anti-pattern detection | Progressive disclosure | Domain expertise encoding

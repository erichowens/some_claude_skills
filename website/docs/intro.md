---
sidebar_position: 1
slug: /intro
---

# Welcome to Claude Skills

**Expert AI agents that make Claude truly powerful. Skills that know more than you do.**

Claude Skills are specialized AI agents with deep domain expertise across design, engineering, research, health, and creative disciplines. Unlike one-off prompts, these skills provide consistent, expert-level capabilities you can deploy across all your projects.

## Choose Your Path

### Browse the Skills Gallery

The best way to discover Claude Skills is to explore them visually. Each skill has a beautifully designed hero image and detailed documentation.

**[View Skills Gallery](/skills)** - Browse all 25 skills with hero images, search, and category filtering

### Get the Code

All skills are open source and available on GitHub. Clone, fork, or contribute.

**[GitHub Repository](https://github.com/erichowens/some_claude_skills)** - Source code, installation instructions, and contribution guide

### Read the Documentation

Learn how Claude Skills work, how to install them, and how to create your own.

**[Skills Guide](/docs/guides/claude-skills-guide)** - Complete guide to using and creating skills

---

## What Are Claude Skills?

Claude Skills are custom AI agents that embody deep expertise in specific domains. Instead of telling Claude what to do, these skills teach Claude:

- **How experts think** - Decision-making frameworks and mental models
- **What experts know** - Domain knowledge and best practices
- **How experts work** - Proven methodologies and workflows
- **Why experts make certain choices** - The reasoning behind decisions

## Quick Installation

### Add Marketplace (Recommended)

```bash
# In Claude Code, add this marketplace:
/plugin marketplace add erichowens/some_claude_skills

# Then install any skill:
/plugin install orchestrator@some-claude-skills

# Or install all skills at once:
/plugin install adhd-design-expert@some-claude-skills
/plugin install metal-shader-expert@some-claude-skills
# ... etc
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/erichowens/some_claude_skills

# Copy all skills to your personal Claude skills folder
cp -r some_claude_skills/.claude/skills/* ~/.claude/skills/

# Or copy to a specific project
cp -r some_claude_skills/.claude/skills/* /path/to/your/project/.claude/skills/
```

## Skill Categories

| Category | Skills | Description |
|----------|--------|-------------|
| **Meta Skills** | Orchestrator, Agent Creator | Coordinate and create new skills |
| **Design & Development** | 6 skills | UI/UX, design systems, typography |
| **Specialized Technical** | 6 skills | Graphics, drones, VR, audio |
| **Photo Intelligence** | 3 skills | Color, events, content recognition |
| **Health & Personal Growth** | 6 skills | ADHD, coaching, speech therapy |
| **Research & Strategy** | 2 skills | Analysis and team building |

## Featured Skills

### [Orchestrator](/docs/skills/orchestrator)
The master coordinator that automatically delegates to specialist skills based on your needs. Start here if you're not sure which skill to use.

### [Agent Creator](/docs/skills/agent_creator)
Meta-agent for creating new custom agents, skills, and MCP integrations. Use this to build your own specialized skills.

### [Design System Creator](/docs/skills/design_system_creator)
Builds comprehensive design systems with production-ready CSS, design tokens, and component libraries.

---

## Next Steps

1. **[Browse Skills Gallery](/skills)** - Explore all 25 skills with beautiful hero images
2. **[Read the Guide](/docs/guides/claude-skills-guide)** - Learn how skills work
3. **[View on GitHub](https://github.com/erichowens/some_claude_skills)** - Get the source code

Ready to make Claude an expert? Let's get started!

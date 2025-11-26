# Skill Documentation Components

This document describes the reusable components for skill documentation pages.

## SkillHeader Component

**Location**: `/src/components/SkillHeader.tsx`

The main component for skill documentation pages. It includes:
- Hero image card
- Download buttons (SKILL.md and ZIP)
- Collapsible TL;DR box with installation instructions
- Security note

### Usage

```jsx
<SkillHeader
  skillName="Vibe Matcher"
  fileName="vibe-matcher"
  description="Synesthete designer that translates emotional vibes into concrete visual DNA"
/>
```

### Props

- `skillName` (string): Display name of the skill
- `fileName` (string): Filename in kebab-case (matches folder name in `.claude/skills/`)
- `description` (string): Short description shown in TL;DR box

### Structure

The component automatically handles:
1. **Hero Image**: Displays `/img/skills/{fileName}-hero.png`
2. **Download SKILL.md Button**: Links to raw GitHub file
3. **Download ZIP Button**: Links to repository ZIP download
4. **TL;DR Box**: Collapsible section with:
   - Description text
   - Installation tabs (CLI, Desktop, Web)
   - Security warning

## SkillPageTitle Component

**Location**: `/src/components/SkillPageTitle.tsx`

A styled title component for skill pages using the Windows 3.1 pixel font aesthetic.

### Usage

```jsx
<SkillPageTitle title="Vibe Matcher" />
```

This replaces markdown `# Title` headers for consistent styling across all skill pages.

### Props

- `title` (string): The page title to display

### Styling

- Font: `var(--font-pixel)` (Windows 3.1 style)
- Size: 24px
- Letter spacing: 1px
- Transform: Uppercase
- Color: `var(--win31-black)`

## Standard Skill Page Structure

Every skill documentation page should follow this structure:

```markdown
---
title: Skill Name
description: Short description
category: Category Name
sidebar_position: X
---

# Skill Name

<SkillHeader
  skillName="Skill Name"
  fileName="skill-name"
  description="Detailed description for TL;DR box"
/>

Opening paragraph describing the skill...

## Section Title

Content...
```

**Important**: Do NOT include `![Hero Banner]` markdown images - SkillHeader handles hero image display automatically.

## Updating Components

### To update hero image positioning:
Edit `/src/components/SkillHeader.tsx` lines 21-39 (Hero Image Card section)

### To update download buttons:
Edit `/src/components/SkillHeader.tsx` lines 42-78 (Download Buttons section)

### To update TL;DR box:
Edit `/src/components/SkillHeader.tsx` lines 80-159 (TL;DR Box section)

### To update title styling:
Edit `/src/components/SkillPageTitle.tsx`

## Bulk Operations

### Remove duplicate hero images from all docs:
```bash
cd website
./fix-skill-docs.sh
```

This script removes `![*Hero*](/img/skills/*-hero.png)` markdown images from all skill docs since SkillHeader displays the hero image automatically.

# Before State: Problems and Gaps

## Context

This artifact documents the state of the codebase **before** the site-reliability-engineer skill was created and integrated. At this point, we had:
- No systematic validation of MDX files
- No pre-commit hooks to catch errors
- Build failures happening in CI/CD after pushing broken code
- Manual discovery of MDX parsing issues

## Problems Identified

### 1. cv-creator Skill Incomplete (skill-documentarian found)

**Issue**: The cv-creator skill was added but missing critical components
- ❌ No hero image (`cv-creator-hero.png`)
- ❌ No downloadable ZIP (`cv-creator.zip`)
- ❌ **NOT in `website/src/data/skills.ts`** - completely invisible on website!
  - Not in skills gallery
  - Not in homepage marquee
  - Not counted in skill statistics

**Impact**: New skill was essentially invisible to users despite documentation existing

### 2. Unescaped Liquid Template Syntax

**Issue**: Vue code examples in `native_app_designer.md` had double-brace template syntax
- MDX parser interpreted double-brace patterns as Liquid templates
- Build failed with parsing errors
- Required manual wrapping using MDX escape syntax

**Impact**: Build failures, broken documentation

### 3. Unescaped Angle Brackets in Markdown

**Issue**: Headings in `cv_creator.md` and `artifact-contribution-guide.md` had `&lt;70`, `&gt;10MB`
- MDX parser choked on angle brackets followed by digits
- Error: `Unexpected character '7' (U+0037) before name`
- Required HTML entities: `&lt;70`, `&gt;10MB`

**Impact**: SSG build failures, broken skill documentation

### 4. SkillHeader Component Prop Mismatch

**Issue**: `cv_creator.md` passed `skillId` prop but component expected `fileName`
- Component tried `fileName.replace()` on undefined
- TypeError during SSG build
- No systematic validation across all 45 skill docs

**Impact**: Build failure, potential regression in other files

## Missing Infrastructure

### No Validation Scripts
- No automated detection of Liquid syntax issues
- No checking for unescaped angle brackets
- No validation of SkillHeader prop usage
- Errors only discovered during full `npm run build`

### No Pre-Commit Hooks
- No fast feedback before committing
- Broken code reached git history
- CI/CD failed after push (slow feedback loop)

### No Build-Time Validation
- `prebuild` script didn't validate docs
- Build failures happened deep in SSG process
- Hard to diagnose which file caused the error

## Development Workflow Pain Points

1. **Slow feedback**: Had to run full build (~2 minutes) to find errors
2. **Manual hunting**: Had to grep through build output to find problematic files
3. **No prevention**: Could commit broken code easily
4. **No guidance**: Error messages didn't suggest fixes
5. **Reactive debugging**: Fixed errors after they broke builds

## Files With Issues

### cv_creator.md (before)
```markdown
<SkillHeader
  skillName="CV Creator"
  skillId="cv-creator"  <!-- ❌ Wrong prop name -->
  description="..."
/>

## Quick Wins (&lt;70 characters)  &lt;!-- Unescaped less-than --&gt;
```

### artifact-contribution-guide.md (before)
```markdown
Include massive binary files (&gt;10MB)  &lt;!-- Unescaped greater-than --&gt;
```

### native_app_designer.md (before)
```vue
<template>
  <li>{{ item.title }}</li>  <!-- ❌ Unescaped Liquid syntax -->
</template>
```

### website/src/data/skills.ts (before)
```typescript
// Coaching & Personal Development (9 skills)
{ id: 'career-biographer', ... },
// ❌ cv-creator missing!
{ id: 'competitive-cartographer', ... },
```

## What We Needed

1. **Fast validation scripts** that run in &lt;1 second
2. **Pre-commit hooks** to catch errors before committing
3. **Prebuild integration** to prevent broken builds from reaching production
4. **Clear error messages** with suggested fixes
5. **Systematic validation** across all 45 skill docs

## Summary

Before site-reliability-engineer, the development workflow was reactive and error-prone:
- ✅ Write code
- ❌ Commit broken code
- ❌ Push to remote
- ❌ Wait for CI/CD to fail
- ❌ Debug build output
- ❌ Fix and repeat

This artifact shows how three skills worked together to transform this into a proactive, validated workflow.

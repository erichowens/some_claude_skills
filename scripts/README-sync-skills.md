# Skill Syncing System

## Overview

This project maintains the **canonical source** for all 143+ Claude Code skills. They are automatically symlinked to `~/.claude/skills/` for global availability across all projects.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Project: some_claude_skills                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  .claude/skills/  (Source of Truth)                 │    │
│  │  ├── computer-vision-pipeline/                      │    │
│  │  ├── document-generation-pdf/                       │    │
│  │  ├── crisis-detection-intervention-ai/              │    │
│  │  └── ... (143 skills)                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ Git commits                      │
│                           ▼                                  │
│                   GitHub Repository                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ sync-skills.sh
                            │ (automatic via git hooks)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  User Level: ~/.claude/skills/ (Symlinks)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  computer-vision-pipeline@ → /path/to/project/...   │    │
│  │  document-generation-pdf@ → /path/to/project/...    │    │
│  │  crisis-detection-intervention-ai@ → /path/to/...   │    │
│  │  ... (143 symlinks)                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Available globally in ALL Claude Code sessions             │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Source of Truth

All skills live in `/coding/some_claude_skills/.claude/skills/`:
- **Version controlled** in git
- **Tracked changes** via commits
- **Collaborative editing** via pull requests
- **Documentation** alongside skill code

### 2. Automatic Syncing

The `sync-skills.sh` script runs automatically via git hooks:

| Git Operation | When | Hook |
|---------------|------|------|
| `git checkout` | Switching branches | `post-checkout` |
| `git pull` | Pulling remote changes | `post-merge` |
| `git merge` | Merging branches | `post-merge` |

**What happens**:
1. Migrates any user-level skills to project (one-time)
2. Removes stale symlinks
3. Creates fresh symlinks for all project skills

### 3. Global Availability

Skills appear in `~/.claude/skills/` as symlinks:
- **Read by Claude Code** when scanning for skills
- **Updated automatically** when project skills change
- **No manual copying** required
- **Always in sync** with project version

## Usage

### Manual Sync

```bash
# From website/ directory
npm run sync:user-skills

# From project root
./scripts/sync-skills.sh
```

### After Creating New Skill

```bash
# 1. Create skill in project
mkdir -p .claude/skills/my-new-skill
echo "---\nname: my-new-skill\n..." > .claude/skills/my-new-skill/SKILL.md

# 2. Sync to user level
npm run sync:user-skills

# 3. Verify
ls -la ~/.claude/skills/my-new-skill
```

### After Pulling Changes

```bash
git pull origin main
# sync-skills.sh runs automatically via post-merge hook
```

### Verifying Sync

```bash
# Check counts match
echo "Project: $(ls -1 .claude/skills/ | wc -l)"
echo "User: $(ls -1 ~/.claude/skills/ | wc -l)"

# Check specific skill
ls -la ~/.claude/skills/computer-vision-pipeline
# Should show: symlink → /Users/.../some_claude_skills/.claude/skills/computer-vision-pipeline
```

## Troubleshooting

### Skills Not Appearing in Claude Code

**Symptom**: New skill not available in Claude Code sessions

**Solution**:
```bash
# Manual sync
npm run sync:user-skills

# Verify symlink created
ls -la ~/.claude/skills/your-skill-name
```

---

### Symlink Broken

**Symptom**: `ls ~/.claude/skills/skill-name` shows "No such file or directory"

**Cause**: Project skill was deleted or renamed

**Solution**:
```bash
# Remove broken symlinks and recreate
npm run sync:user-skills
```

---

### Git Hook Not Running

**Symptom**: After `git pull`, skills aren't synced

**Check**:
```bash
# Verify hooks are executable
ls -la .git/hooks/post-*
# Should show: -rwxr-xr-x

# If not executable
chmod +x .git/hooks/post-checkout
chmod +x .git/hooks/post-merge
```

---

### Skills in Wrong Location

**Symptom**: Skills in `~/.claude/skills/` instead of project

**Cause**: Created skill at user-level instead of project-level

**Solution**:
```bash
# Script will automatically migrate them
npm run sync:user-skills
```

## Benefits

### For Skill Authors

✅ **Version Control**: Track changes, revert mistakes
✅ **Collaboration**: Share skills via pull requests
✅ **Documentation**: Keep docs with code
✅ **Testing**: Test locally before committing

### For Skill Users

✅ **Always Updated**: Auto-sync with latest versions
✅ **No Manual Work**: Git operations handle syncing
✅ **Global Access**: Available in all projects
✅ **Reliable Source**: Single source of truth

### For the Project

✅ **Centralized**: All skills in one repo
✅ **Discoverable**: Easy to browse and search
✅ **Maintainable**: Easy to update and fix
✅ **Deployable**: Can publish to skill registry

## Implementation Files

| File | Purpose |
|------|---------|
| `scripts/sync-skills.sh` | Main sync script |
| `.git/hooks/post-checkout` | Auto-sync on branch switch |
| `.git/hooks/post-merge` | Auto-sync on pull/merge |
| `website/package.json` | npm run sync:user-skills |

## Architecture Decisions

### Why Symlinks (not copies)?

**Symlinks**:
- ✅ Always in sync (points to source)
- ✅ No duplication
- ✅ Instant updates

**Copies**:
- ❌ Can get out of sync
- ❌ Wasted disk space
- ❌ Manual copying required

### Why Project as Source of Truth?

**Project-level**:
- ✅ Version controlled
- ✅ Collaborative
- ✅ Documented
- ✅ Testable

**User-level**:
- ❌ Not version controlled
- ❌ Hard to share
- ❌ No change tracking
- ❌ Can't collaborate

### Why Automatic via Git Hooks?

**Automatic**:
- ✅ Never forget to sync
- ✅ Always up to date
- ✅ No manual steps

**Manual**:
- ❌ Easy to forget
- ❌ Inconsistent state
- ❌ Extra work

## Migration History

### Initial Setup (2026-01-15)

- Moved 143 skills from `~/.claude/skills/` to project
- Created `sync-skills.sh` script
- Added git hooks (post-checkout, post-merge)
- Added npm script: `sync:user-skills`
- Created 143 symlinks to user-level

**Skills migrated**:
- 5 from this session (crisis-detection, geospatial, react-performance, document-generation, computer-vision)
- 8 existing at user-level (background-job-orchestrator, form-validation-architect, etc.)
- 130 pre-existing project skills

**Result**: All 143 skills now symlinked and globally available

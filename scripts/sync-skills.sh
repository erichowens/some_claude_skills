#!/bin/bash
set -e

# Sync Skills: Project → User Level via Symlinks
#
# This script:
# 1. Moves any skills from user-level to project (one-time migration)
# 2. Symlinks all project skills to user-level for global availability
#
# Run manually: npm run sync-skills
# Runs automatically: git post-checkout/post-merge hooks

PROJECT_SKILLS="/Users/erichowens/coding/some_claude_skills/.claude/skills"
USER_SKILLS="/Users/erichowens/.claude/skills"

echo "🔄 Syncing skills: Project ↔ User Level"

# Create directories if they don't exist
mkdir -p "$PROJECT_SKILLS"
mkdir -p "$USER_SKILLS"

# Step 1: Migrate any skills from user-level to project (one-time)
echo ""
echo "📦 Step 1: Migrating skills from user-level to project..."

migrated=0
for skill_dir in "$USER_SKILLS"/*; do
  if [ -d "$skill_dir" ] && [ ! -L "$skill_dir" ]; then
    skill_name=$(basename "$skill_dir")

    # Only migrate if it doesn't exist in project
    if [ ! -d "$PROJECT_SKILLS/$skill_name" ]; then
      echo "  → Moving $skill_name to project"
      mv "$skill_dir" "$PROJECT_SKILLS/"
      ((migrated++))
    fi
  fi
done

if [ $migrated -eq 0 ]; then
  echo "  ✓ No skills to migrate (all in project)"
else
  echo "  ✓ Migrated $migrated skills to project"
fi

# Step 2: Remove existing symlinks (clean slate)
echo ""
echo "🧹 Step 2: Cleaning existing symlinks..."

removed=0
for skill_link in "$USER_SKILLS"/*; do
  if [ -L "$skill_link" ]; then
    rm "$skill_link"
    ((removed++))
  fi
done

if [ $removed -eq 0 ]; then
  echo "  ✓ No stale symlinks to remove"
else
  echo "  ✓ Removed $removed stale symlinks"
fi

# Step 3: Create symlinks from user-level to project
echo ""
echo "🔗 Step 3: Creating symlinks (project → user-level)..."

linked=0
for skill_dir in "$PROJECT_SKILLS"/*; do
  if [ -d "$skill_dir" ]; then
    skill_name=$(basename "$skill_dir")

    # Create symlink
    ln -sf "$skill_dir" "$USER_SKILLS/$skill_name"
    ((linked++))
  fi
done

echo "  ✓ Created $linked symlinks"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Sync complete!"
echo ""
echo "📊 Summary:"
echo "  • Project skills: $(find "$PROJECT_SKILLS" -maxdepth 1 -type d | tail -n +2 | wc -l | tr -d ' ')"
echo "  • User symlinks:  $(find "$USER_SKILLS" -maxdepth 1 -type l | wc -l | tr -d ' ')"
echo ""
echo "📂 Locations:"
echo "  • Project (source):  $PROJECT_SKILLS"
echo "  • User (symlinks):   $USER_SKILLS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

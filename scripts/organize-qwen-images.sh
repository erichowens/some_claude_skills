#!/bin/bash

# Organize generated Qwen images into proper locations
# Maps the 60 generated images to their proper names and locations

set -e

SOURCE_DIR="$HOME/qwen-images"
TARGET_BASE="/Users/erichowens/coding/some_claude_skills/website/static"

# Create target directories
mkdir -p "$TARGET_BASE/img/skills"
mkdir -p "$TARGET_BASE/img/agents"
mkdir -p "$TARGET_BASE/img/mcps"
mkdir -p "$TARGET_BASE/img/pages"
mkdir -p "$TARGET_BASE/img/backsplash"

# Get sorted list of images into array (zsh compatible)
IMAGES=($(ls "$SOURCE_DIR" | sort))

echo "Found ${#IMAGES[@]} images to process"

# Define the mapping (order matches generation order)
# Skills (19 images, indices 1-19 in 1-based, 0-18 in 0-based)
SKILLS=(
  "agent-creator"
  "intimacy-avatar-engineer"
  "rope-physics-rendering-expert"
  "swift-executor"
  "team-builder"
  "tech-entrepreneur-coach-adhd"
  "technical-writer"
  "test-automation-expert"
  "typography-expert"
  "vaporwave-glassomorphic-ui-designer"
  "vercel-deployment"
  "vibe-matcher"
  "vitest-testing-patterns"
  "voice-audio-engineer"
  "web-design-expert"
  "webapp-testing"
  "wedding-immortalist"
  "windows-3-1-web-designer"
  "wisdom-accountability-coach"
)

# Agents (14 images)
AGENTS=(
  "backend-architect"
  "code-reviewer"
  "context-manager"
  "debugger"
  "dependency-manager"
  "documentation-expert"
  "frontend-developer"
  "fullstack-developer"
  "graphql-architect"
  "ai-engineer"
  "prompt-engineer"
  "architect-reviewer"
  "report-generator"
  "research-orchestrator"
)

# MCPs (2 images)
MCPS=(
  "desktop-commander"
  "firecrawl"
)

# Page og:images (12 images)
PAGES=(
  "homepage"
  "skills"
  "agents"
  "mcps"
  "artifacts"
  "playground"
  "ecosystem"
  "submit-skill"
  "favorites"
  "changelog"
  "contact"
  "metrics"
)

idx=0

echo ""
echo "=== Processing Skills (19) ==="
for skill in "${SKILLS[@]}"; do
  if [ $idx -lt ${#IMAGES[@]} ]; then
    src="$SOURCE_DIR/${IMAGES[$idx]}"
    dst="$TARGET_BASE/img/skills/${skill}-og.webp"
    echo "[$idx] ${IMAGES[$idx]} -> ${skill}-og.webp"
    magick "$src" -quality 85 "$dst"
    idx=$((idx + 1))
  fi
done

echo ""
echo "=== Processing Agents (14) ==="
for agent in "${AGENTS[@]}"; do
  if [ $idx -lt ${#IMAGES[@]} ]; then
    src="$SOURCE_DIR/${IMAGES[$idx]}"
    dst="$TARGET_BASE/img/agents/${agent}-og.webp"
    echo "[$idx] ${IMAGES[$idx]} -> ${agent}-og.webp"
    magick "$src" -quality 85 "$dst"
    idx=$((idx + 1))
  fi
done

echo ""
echo "=== Processing MCPs (2) ==="
for mcp in "${MCPS[@]}"; do
  if [ $idx -lt ${#IMAGES[@]} ]; then
    src="$SOURCE_DIR/${IMAGES[$idx]}"
    dst="$TARGET_BASE/img/mcps/${mcp}-og.webp"
    echo "[$idx] ${IMAGES[$idx]} -> ${mcp}-og.webp"
    magick "$src" -quality 85 "$dst"
    idx=$((idx + 1))
  fi
done

echo ""
echo "=== Processing Page OG images (12) ==="
for page in "${PAGES[@]}"; do
  if [ $idx -lt ${#IMAGES[@]} ]; then
    src="$SOURCE_DIR/${IMAGES[$idx]}"
    dst="$TARGET_BASE/img/pages/${page}-og.webp"
    echo "[$idx] ${IMAGES[$idx]} -> ${page}-og.webp"
    magick "$src" -quality 85 "$dst"
    idx=$((idx + 1))
  fi
done

echo ""
echo "=== Processing Page Backsplashes (12) ==="
for page in "${PAGES[@]}"; do
  if [ $idx -lt ${#IMAGES[@]} ]; then
    src="$SOURCE_DIR/${IMAGES[$idx]}"
    dst="$TARGET_BASE/img/backsplash/${page}-backsplash.webp"
    echo "[$idx] ${IMAGES[$idx]} -> ${page}-backsplash.webp"
    magick "$src" -quality 85 "$dst"
    idx=$((idx + 1))
  fi
done

echo ""
echo "=== Summary ==="
echo "Processed $idx images"
echo "Remaining images: $((${#IMAGES[@]} - idx))"
echo ""
echo "Output counts:"
echo "Skills: $(ls "$TARGET_BASE/img/skills/"*-og.webp 2>/dev/null | wc -l | tr -d ' ')"
echo "Agents: $(ls "$TARGET_BASE/img/agents/"*-og.webp 2>/dev/null | wc -l | tr -d ' ')"
echo "MCPs: $(ls "$TARGET_BASE/img/mcps/"*-og.webp 2>/dev/null | wc -l | tr -d ' ')"
echo "Pages: $(ls "$TARGET_BASE/img/pages/"*-og.webp 2>/dev/null | wc -l | tr -d ' ')"
echo "Backsplash: $(ls "$TARGET_BASE/img/backsplash/"*-backsplash.webp 2>/dev/null | wc -l | tr -d ' ')"

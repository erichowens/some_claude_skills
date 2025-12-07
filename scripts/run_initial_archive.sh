#!/bin/bash
# Initial Archive Setup Script
# Run this to create the first ecosystem snapshot and changelog

set -e

cd "$(dirname "$0")/.."

echo "📜 The Archivist - Initial Archive Setup"
echo ""

# Create directory structure
echo "Creating archive directories..."
mkdir -p .claude/archive/snapshots
mkdir -p .claude/archive/changelogs
mkdir -p .claude/archive/blog-drafts
mkdir -p .claude/archive/progress-reports/weekly
mkdir -p .claude/archive/progress-reports/monthly
echo "✅ Directories created"
echo ""

# Generate ecosystem data
echo "Generating ecosystem state..."
python3 scripts/generate_ecosystem_data.py
echo ""

# Generate initial snapshot
echo "Creating initial snapshot..."
python3 scripts/generate_snapshot.py --label initial
echo ""

# Generate initial changelog
echo "Creating initial changelog..."
python3 scripts/update_changelog.py
echo ""

echo "🎉 Archive initialization complete!"
echo ""
echo "Files created:"
echo "  - .claude/archive/snapshots/[timestamp]-initial.{json,md}"
echo "  - .claude/archive/changelogs/CHANGELOG.md"
echo ""
echo "Run these scripts regularly:"
echo "  - generate_snapshot.py - After significant changes"
echo "  - update_changelog.py - After commits to skills/agents"

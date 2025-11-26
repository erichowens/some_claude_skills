#!/bin/bash

# Fix all skill documentation files to remove duplicate hero images

cd "$(dirname "$0")/docs/skills"

for file in *.md; do
  echo "Processing $file..."

  # Remove lines that match the pattern ![*Hero*](/img/skills/*-hero.png)
  # This removes duplicate hero banner markdown images
  sed -i '' '/^!\[.*[Hh]ero.*\](\/img\/skills\/.*-hero\.png)/d' "$file"

  echo "  ✓ Removed duplicate hero images from $file"
done

echo ""
echo "✓ All skill docs have been fixed!"
echo "  - Duplicate hero banner markdown images removed"
echo "  - SkillHeader component will handle hero image display"

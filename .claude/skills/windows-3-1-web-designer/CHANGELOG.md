# Changelog

All notable changes to the windows-3-1-web-designer skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-31

### Added
- **Modern Extrapolations** - How Win31 would handle 2026 UI needs:
  - AI chatbot patterns (Cue Card paradigm, pre-Clippy)
  - Mobile responsive (Pocket Computing paradigm)
  - Responsive breakpoints (MDI as metaphor)
  - Theme variations (Hotdog Stand, Monochrome)
- `references/ai-assistant-patterns.md` - Complete Cue Card-style AI UX:
  - Modal dialog patterns
  - Setup Wizard flows
  - Message box styles (info, question, warning, error)
  - Terminal chat interface
  - Help Index pattern
  - Sound effect mappings
- `references/mobile-pocket-computing.md` - Responsive Win31 for mobile:
  - Program Manager as mobile navigation
  - Dialog stack pattern
  - Touch adaptations with 44px targets
  - Gesture mappings
  - Responsive breakpoints
  - Menu system for mobile
- Explicit Win31 vs Win95 differentiation table
- 8 anti-patterns with Win95-specific distinctions
- Decision tree covering AI/help patterns
- Quick Test checklist with Win95-specific negatives
- CSS Variables template with spacing scale

### Changed
- Expanded SKILL.md from ~150 lines to ~530 lines (matching Win95 skill depth)
- Enhanced description with modern extrapolation keywords
- Updated "When to Use" with AI chatbot and mobile use cases
- Reorganized anti-patterns to emphasize Win95 distinctions

### Technical
- Proper NOT clause distinguishing from Win95 skill
- Cross-references to windows-95-web-designer
- Complements Win95 skill with distinct aesthetic

### Key Differences from Win95 (Highlighted)
| Feature | Win31 | Win95 |
|---------|-------|-------|
| Title bar | **Solid navy** | Gradient |
| Window controls | **Single button** | Three buttons |
| Navigation | **Program Manager** | Start Menu |
| AI style | **Cue Cards, Wizards** | Clippy character |
| Mobile | **Pocket computing** | Pocket PC |

## [2.0.0] - 2024-01-XX

### Changed
- **BREAKING**: Restructured from monolithic 539-line file to progressive disclosure architecture
- Reduced SKILL.md from 539 lines to 137 lines (75% reduction)

### Added
- `references/design-system.md` - Color palette, beveled borders, typography
- `references/component-patterns.md` - Window chrome, buttons, forms, panels CSS
- `references/anti-patterns.md` - Vaporwave comparison, decision tree, conversion examples
- Anti-patterns section with "What it looks like / Why wrong / Instead" format
- Quick Test checklist for Win31 authenticity

### Removed
- Inline CSS examples (moved to references)
- Verbose design explanations (condensed to quick reference)

### Migration Guide
Reference files are now in `/references/` directory. Import patterns:
- Color palette & typography → `references/design-system.md`
- Component CSS → `references/component-patterns.md`
- Vaporwave vs Win31 → `references/anti-patterns.md`

## [1.1.0] - 2025-11-26

### Changed
- Updated frontmatter to standard `allowed-tools` format
- Improved description with proper NOT clause and activation keywords

### Added
- **When to Use This Skill** section with clear scope boundaries
- **Do NOT use for** section with skill alternatives
- **MCP Integrations** section:
  - 21st Century Dev for component scaffolding
  - Component Refiner for Win31 styling conversion
- Cross-references to related skills (vaporwave, native-app, web-design)

### Fixed
- Removed duplicate "when to use" content

## [1.0.0] - 2024-XX-XX

### Added
- Initial windows-3-1-web-designer skill
- Comprehensive Win31 color palette (system gray, navy, accents)
- Sacred Rule of Beveled Borders (outset, inset, pressed states)
- Typography system (VT323, Press Start 2P, MS Sans Serif)
- Component patterns:
  - Window chrome with titlebar
  - 3D push buttons with pressed states
  - Form controls (inputs, checkboxes)
  - Panels and group boxes
- Anti-patterns: Windows 3.1 vs Vaporwave comparison table
- Decision tree for component design
- Responsive considerations for modern screens
- Vaporwave-to-Win31 conversion example
- Hotdog Stand high-contrast mode
- Quick reference card for all elements

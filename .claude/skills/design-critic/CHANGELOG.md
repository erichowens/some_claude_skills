# Changelog

All notable changes to the design-critic skill.

## [1.0.0] - 2026-01-31

### Added
- Initial release of design-critic skill
- 6-dimension scoring system (Accessibility, Color Harmony, Typography, Layout, Modernity, Usability)
- Assessment workflow with 200ms first impression test
- Detailed scoring rubric in `/references/assessment-rubric.md`
- Design trend timeline in `/references/trend-timeline.md`
- Remix patterns with before/after examples in `/references/remix-patterns.md`
- Integration guidance for web-design-expert and color-contrast-auditor
- Anti-patterns section for common design mistakes
- Output format template for consistent assessments

### Technical
- Read-only tool permissions (Read, Glob, Grep, WebFetch, WebSearch)
- Proper NOT clause to avoid false activation
- Under 500 lines in SKILL.md (progressive disclosure)

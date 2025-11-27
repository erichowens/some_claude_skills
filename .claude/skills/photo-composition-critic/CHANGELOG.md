# Changelog

All notable changes to the photo-composition-critic skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-26

### Changed
- Updated frontmatter to standard `allowed-tools` format
- Added activation keywords to description
- Removed custom YAML fields (version, category, tags, author)

### Added
- **When to Use This Skill** section with clear scope boundaries
- **Do NOT use for** section with skill alternatives
- **MCP Integrations** section (Firecrawl, Hugging Face)

## [1.0.0] - 2024-XX-XX

### Added
- Initial photo-composition-critic skill
- Graduate-level composition theory:
  - Visual weight & balance (Arnheim)
  - Gestalt principles in photography
  - Dynamic symmetry (Hambidge)
  - The arabesque (Harold Speed)
- Color theory foundations:
  - Josef Albers - Interaction of Color
  - Johannes Itten - 7 Color Contrasts
  - Bezold Effect
- Computational aesthetics models:
  - AVA Dataset analysis
  - NIMA (Neural Image Assessment)
  - LAION-Aesthetics
  - VisualQuality-R1
- Custom analysis scripts:
  - Multi-model ensemble scorer (PhotoCritic class)
  - MCP server for photo critique
- Full critique framework protocol
- Academic references

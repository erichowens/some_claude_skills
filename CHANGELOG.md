# Ecosystem Changelog

All notable changes to the Claude Skills ecosystem will be documented in this file.

## [Unreleased]

### Added - 2024-12-08
- **security-auditor skill**: Comprehensive OWASP Top 10 scanner with working scripts
  - `detect-secrets.sh` - Finds AWS keys, private keys, JWT tokens, connection strings
  - `owasp-check.py` - Python SAST for injection, crypto, misconfig vulnerabilities
  - `full-audit.sh` - Unified security audit runner
  - Decision: Chose regex-based detection over external tools for portability

- **test-automation-expert skill**: Complete testing guidance from unit to E2E
  - Framework comparison: Jest vs Vitest vs Playwright vs Cypress vs pytest
  - Test pyramid philosophy: 70% unit / 20% integration / 10% E2E
  - Coverage optimization patterns and CI/CD integration templates
  - Decision: Recommend Vitest for new projects (faster, native ESM/TS support)

- **Growth Metrics Infrastructure**: `scripts/measure-ecosystem.py`
  - Tracks: skill count, agent count, reference files, lines of guidance
  - Outputs JSON metrics to `metrics/` directory
  - Decision: Focus on content depth metrics, not vanity metrics

- **Forge Infrastructure Completion**:
  - `scripts/validate_skill.py` - Validates SKILL.md structure and quality
  - `scripts/check_dependencies.py` - Verifies skill dependencies and cross-references

### Technical Decisions Made Today

1. **Background Agent Limitations**: Agents launched with `run_in_background: true` cannot write files due to permission constraints. Workaround: Extract agent output and write directly.

2. **Metrics Philosophy**: Measuring what matters for ecosystem health:
   - Breadth: Total skills, agents, categories covered
   - Depth: Reference files per skill, lines of actionable guidance
   - Quality: Validation pass rate, cross-references
   - NOT measuring: Downloads, stars, or social metrics (not yet available)

3. **Skill Categories Tracked**:
   - Security (security-auditor, etc.)
   - Testing (test-automation-expert, etc.)
   - Infrastructure (deployment-engineer, etc.)
   - Design (web-design-expert, etc.)
   - ML/AI (clip-aware-embeddings, etc.)
   - Career (career-biographer, cv-creator, etc.)

## Metrics Baseline - 2024-12-08

**First Official Measurement** (via `measure-ecosystem.py`):

| Metric | Value |
|--------|-------|
| Total Skills | 53 |
| Total Agents | 1 |
| Reference Files | 132 |
| Total Scripts | 17 |
| Total Guidance Lines | 35,177 |
| Avg References/Skill | 2.49 |
| Avg Lines/Skill | 663.72 |
| Skills with Examples | 46/53 (87%) |
| Skills with Changelog | 35/53 (66%) |
| Skills with Scripts | 10/53 (19%) |

**Top 5 Skills by Depth**:
1. drone-inspection-specialist: 2,503 lines, 4 refs
2. diagramming-expert: 2,017 lines, 4 refs
3. automatic-stateful-prompt-improver: 1,982 lines, 7 refs
4. skill-coach: 1,709 lines, 8 refs
5. test-automation-expert: 1,689 lines, 4 refs (NEW)

**Category Distribution**:
- Design: 53 skills
- ML/AI: 53 skills
- Backend: 41 skills
- Frontend: 41 skills
- Testing: 30 skills
- Audio/Video: 30 skills
- Documentation: 25 skills
- Career: 25 skills
- Security: 16 skills
- Infrastructure: 13 skills

---

## How to Contribute

1. Add skills following the SKILL.md template
2. Run `python scripts/validate_skill.py path/to/skill` before PRs
3. Update this CHANGELOG with notable additions
4. Include reference files for deep guidance

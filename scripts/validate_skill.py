#!/usr/bin/env python3
"""
Skill Validation Script

Validates that a skill directory follows the required structure and quality standards.

Usage:
    python scripts/validate_skill.py .claude/skills/my-skill
    python scripts/validate_skill.py .claude/skills/my-skill --strict
"""

import argparse
import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Tuple

@dataclass
class ValidationResult:
    """Result of a single validation check"""
    check: str
    passed: bool
    message: str
    severity: str  # 'error', 'warning', 'info'


class SkillValidator:
    """Validates skill structure and content quality"""

    REQUIRED_FRONTMATTER = ['name', 'description', 'allowed-tools']

    RECOMMENDED_SECTIONS = [
        'When to Use',
        'Quick Start',
        'Anti-Pattern',
    ]

    ALLOWED_TOOLS_PATTERN = re.compile(
        r'^(Read|Write|Edit|Bash(\([^)]*\))?|Grep|Glob|WebFetch|WebSearch|Task|mcp__\w+__\w+)(,(Read|Write|Edit|Bash(\([^)]*\))?|Grep|Glob|WebFetch|WebSearch|Task|mcp__\w+__\w+))*$'
    )

    def __init__(self, skill_path: Path, strict: bool = False):
        self.skill_path = skill_path
        self.strict = strict
        self.results: List[ValidationResult] = []

    def add_result(self, check: str, passed: bool, message: str, severity: str = 'error'):
        self.results.append(ValidationResult(check, passed, message, severity))

    def validate(self) -> bool:
        """Run all validations and return overall pass/fail"""
        self._check_directory_exists()
        if not self.skill_path.exists():
            return False

        self._check_skill_md_exists()
        if not (self.skill_path / 'SKILL.md').exists():
            return False

        self._check_frontmatter()
        self._check_description_quality()
        self._check_sections()
        self._check_examples()
        self._check_references()
        self._check_scripts()

        errors = [r for r in self.results if not r.passed and r.severity == 'error']
        warnings = [r for r in self.results if not r.passed and r.severity == 'warning']

        if self.strict:
            return len(errors) == 0 and len(warnings) == 0
        return len(errors) == 0

    def _check_directory_exists(self):
        self.add_result(
            'directory_exists',
            self.skill_path.exists() and self.skill_path.is_dir(),
            f"Skill directory exists at {self.skill_path}"
        )

    def _check_skill_md_exists(self):
        skill_md = self.skill_path / 'SKILL.md'
        self.add_result(
            'skill_md_exists',
            skill_md.exists(),
            "SKILL.md file exists"
        )

    def _check_frontmatter(self):
        skill_md = self.skill_path / 'SKILL.md'
        content = skill_md.read_text()

        # Check for YAML frontmatter
        if not content.startswith('---'):
            self.add_result('frontmatter_exists', False, "Missing YAML frontmatter (---)")
            return

        # Extract frontmatter
        parts = content.split('---', 2)
        if len(parts) < 3:
            self.add_result('frontmatter_valid', False, "Malformed frontmatter")
            return

        frontmatter = parts[1]

        # Check required fields
        for field in self.REQUIRED_FRONTMATTER:
            pattern = rf'^{field}:\s*\S+'
            if re.search(pattern, frontmatter, re.MULTILINE):
                self.add_result(f'has_{field}', True, f"Has {field} field")
            else:
                self.add_result(f'has_{field}', False, f"Missing required field: {field}")

        # Validate allowed-tools format
        tools_match = re.search(r'^allowed-tools:\s*(.+)$', frontmatter, re.MULTILINE)
        if tools_match:
            tools = tools_match.group(1).strip()
            if self.ALLOWED_TOOLS_PATTERN.match(tools):
                self.add_result('allowed_tools_valid', True, "allowed-tools format is valid")
            else:
                self.add_result('allowed_tools_valid', False,
                               f"Invalid allowed-tools format: {tools}")

    def _check_description_quality(self):
        skill_md = self.skill_path / 'SKILL.md'
        content = skill_md.read_text()

        # Extract description from frontmatter
        desc_match = re.search(r'^description:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
        if not desc_match:
            return

        description = desc_match.group(1)

        # Check length
        if len(description) < 50:
            self.add_result('description_length', False,
                           f"Description too short ({len(description)} chars, need 50+)",
                           severity='warning')
        else:
            self.add_result('description_length', True,
                           f"Description has adequate length ({len(description)} chars)")

        # Check for activation triggers
        if 'activate on' in description.lower() or 'use for' in description.lower():
            self.add_result('has_activation_triggers', True,
                           "Description includes activation triggers")
        else:
            self.add_result('has_activation_triggers', False,
                           "Description should include 'Activate on' triggers",
                           severity='warning')

        # Check for anti-use cases
        if 'not for' in description.lower() or 'do not use' in description.lower():
            self.add_result('has_anti_uses', True,
                           "Description includes anti-use cases")
        else:
            self.add_result('has_anti_uses', False,
                           "Description should include 'NOT for' anti-use cases",
                           severity='warning')

    def _check_sections(self):
        skill_md = self.skill_path / 'SKILL.md'
        content = skill_md.read_text()

        for section in self.RECOMMENDED_SECTIONS:
            pattern = rf'^##\s+{re.escape(section)}'
            if re.search(pattern, content, re.MULTILINE | re.IGNORECASE):
                self.add_result(f'has_{section.lower().replace(" ", "_")}', True,
                               f"Has '{section}' section")
            else:
                self.add_result(f'has_{section.lower().replace(" ", "_")}', False,
                               f"Missing recommended section: '{section}'",
                               severity='warning')

    def _check_examples(self):
        skill_md = self.skill_path / 'SKILL.md'
        content = skill_md.read_text()

        code_blocks = re.findall(r'```[\w]*\n', content)
        if len(code_blocks) >= 2:
            self.add_result('has_code_examples', True,
                           f"Has {len(code_blocks)} code examples")
        elif len(code_blocks) == 1:
            self.add_result('has_code_examples', False,
                           "Only 1 code example, recommend 2+",
                           severity='warning')
        else:
            self.add_result('has_code_examples', False,
                           "No code examples found",
                           severity='warning')

    def _check_references(self):
        refs_dir = self.skill_path / 'references'
        if refs_dir.exists():
            ref_count = len(list(refs_dir.glob('*.md')))
            if ref_count > 0:
                self.add_result('has_references', True,
                               f"Has {ref_count} reference files")
            else:
                self.add_result('has_references', False,
                               "references/ directory is empty",
                               severity='info')
        else:
            self.add_result('has_references', False,
                           "No references/ directory (optional but recommended)",
                           severity='info')

    def _check_scripts(self):
        scripts_dir = self.skill_path / 'scripts'
        if scripts_dir.exists():
            scripts = list(scripts_dir.glob('*'))
            if scripts:
                # Check if scripts are executable
                executable = [s for s in scripts if s.stat().st_mode & 0o111]
                self.add_result('has_scripts', True,
                               f"Has {len(scripts)} scripts ({len(executable)} executable)")
        else:
            self.add_result('has_scripts', False,
                           "No scripts/ directory (optional)",
                           severity='info')

    def print_report(self) -> None:
        """Print validation report"""
        print(f"\n{'='*60}")
        print(f"SKILL VALIDATION: {self.skill_path.name}")
        print(f"{'='*60}\n")

        passed = [r for r in self.results if r.passed]
        failed = [r for r in self.results if not r.passed]

        if passed:
            print("✅ PASSED:")
            for r in passed:
                print(f"   • {r.message}")

        if failed:
            print("\n❌ ISSUES:")
            for r in failed:
                icon = {'error': '🔴', 'warning': '🟡', 'info': '🔵'}.get(r.severity, '⚪')
                print(f"   {icon} [{r.severity.upper()}] {r.message}")

        print(f"\n{'='*60}")
        errors = sum(1 for r in failed if r.severity == 'error')
        warnings = sum(1 for r in failed if r.severity == 'warning')
        print(f"Summary: {len(passed)} passed, {errors} errors, {warnings} warnings")

        if errors == 0 and warnings == 0:
            print("✨ Skill passes all validation checks!")
        elif errors == 0:
            print("⚠️  Skill is valid but has warnings to address")
        else:
            print("❌ Skill has errors that must be fixed")

        print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description='Validate skill structure')
    parser.add_argument('skill_path', help='Path to skill directory')
    parser.add_argument('--strict', action='store_true',
                       help='Fail on warnings too')
    parser.add_argument('--json', action='store_true',
                       help='Output JSON instead of report')

    args = parser.parse_args()

    skill_path = Path(args.skill_path).resolve()
    validator = SkillValidator(skill_path, strict=args.strict)

    passed = validator.validate()

    if args.json:
        import json
        print(json.dumps({
            'skill': skill_path.name,
            'passed': passed,
            'results': [
                {'check': r.check, 'passed': r.passed, 'message': r.message, 'severity': r.severity}
                for r in validator.results
            ]
        }, indent=2))
    else:
        validator.print_report()

    return 0 if passed else 1


if __name__ == '__main__':
    sys.exit(main())

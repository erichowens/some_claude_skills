#!/usr/bin/env python3
"""
Skill Dependency Checker

Verifies skill dependencies and cross-references are valid.
Checks for:
- Referenced skills that don't exist
- Circular dependencies
- Missing tool requirements
- Broken reference file links

Usage:
    python scripts/check_dependencies.py
    python scripts/check_dependencies.py --skill security-auditor
"""

import argparse
import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List, Set, Optional
from collections import defaultdict

@dataclass
class DependencyIssue:
    """A detected dependency issue"""
    skill: str
    issue_type: str
    message: str
    severity: str  # 'error', 'warning'


class DependencyChecker:
    """Checks skill dependencies and cross-references"""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.skills_dir = base_dir / '.claude' / 'skills'
        self.issues: List[DependencyIssue] = []
        self.skill_names: Set[str] = set()
        self.skill_references: Dict[str, Set[str]] = defaultdict(set)

    def add_issue(self, skill: str, issue_type: str, message: str, severity: str = 'warning'):
        self.issues.append(DependencyIssue(skill, issue_type, message, severity))

    def discover_skills(self) -> None:
        """Find all skill directories"""
        if not self.skills_dir.exists():
            self.add_issue('_system', 'missing_dir',
                          f"Skills directory not found: {self.skills_dir}", 'error')
            return

        for skill_dir in self.skills_dir.iterdir():
            if skill_dir.is_dir() and (skill_dir / 'SKILL.md').exists():
                self.skill_names.add(skill_dir.name)

    def check_all(self) -> bool:
        """Run all checks and return overall pass/fail"""
        self.discover_skills()

        if not self.skill_names:
            return len([i for i in self.issues if i.severity == 'error']) == 0

        for skill_name in self.skill_names:
            skill_dir = self.skills_dir / skill_name
            self._check_skill(skill_dir)

        self._check_circular_dependencies()

        errors = [i for i in self.issues if i.severity == 'error']
        return len(errors) == 0

    def check_single(self, skill_name: str) -> bool:
        """Check a single skill"""
        self.discover_skills()

        if skill_name not in self.skill_names:
            self.add_issue(skill_name, 'not_found',
                          f"Skill not found: {skill_name}", 'error')
            return False

        skill_dir = self.skills_dir / skill_name
        self._check_skill(skill_dir)

        errors = [i for i in self.issues if i.severity == 'error']
        return len(errors) == 0

    def _check_skill(self, skill_dir: Path) -> None:
        """Check a single skill's dependencies"""
        skill_name = skill_dir.name
        skill_md = skill_dir / 'SKILL.md'

        if not skill_md.exists():
            self.add_issue(skill_name, 'missing_file',
                          "SKILL.md not found", 'error')
            return

        content = skill_md.read_text()

        # Check for skill references in "Use with:" section
        self._check_skill_references(skill_name, content)

        # Check for reference file links
        self._check_reference_links(skill_name, skill_dir, content)

        # Check for MCP tool references
        self._check_mcp_tools(skill_name, content)

    def _check_skill_references(self, skill_name: str, content: str) -> None:
        """Check that referenced skills exist"""
        # Look for "Use with:" section
        use_with_match = re.search(r'\*\*Use with\*\*:\s*(.+)', content)
        if not use_with_match:
            return

        use_with_line = use_with_match.group(1)

        # Extract skill names (format: skill-name, skill-name (description))
        skill_refs = re.findall(r'([a-z][a-z0-9-]+)', use_with_line)

        for ref in skill_refs:
            if ref in self.skill_names:
                self.skill_references[skill_name].add(ref)
            else:
                # Check if it might be a partial match or typo
                close_matches = [s for s in self.skill_names
                               if ref in s or s in ref]
                if close_matches:
                    self.add_issue(skill_name, 'possible_typo',
                                  f"'{ref}' not found, did you mean: {close_matches}?",
                                  'warning')
                else:
                    self.add_issue(skill_name, 'missing_ref',
                                  f"Referenced skill not found: '{ref}'",
                                  'warning')

    def _check_reference_links(self, skill_name: str, skill_dir: Path,
                               content: str) -> None:
        """Check that reference file links are valid"""
        # Find reference file mentions
        ref_mentions = re.findall(r'`references/([^`]+)`', content)
        ref_mentions += re.findall(r'references/([a-zA-Z0-9_-]+\.md)', content)
        # Clean up any trailing punctuation
        ref_mentions = [r.rstrip('`\'".,;:)') for r in ref_mentions]

        refs_dir = skill_dir / 'references'

        for ref_file in set(ref_mentions):
            ref_path = refs_dir / ref_file
            if not ref_path.exists():
                self.add_issue(skill_name, 'broken_ref_link',
                              f"Referenced file not found: references/{ref_file}",
                              'error')

        # Check if references dir exists but isn't mentioned
        if refs_dir.exists():
            existing_refs = {f.name for f in refs_dir.glob('*.md')}
            mentioned_refs = {r for r in ref_mentions if r.endswith('.md')}
            unmentioned = existing_refs - mentioned_refs

            if unmentioned:
                self.add_issue(skill_name, 'unreferenced_files',
                              f"Reference files not mentioned in SKILL.md: {unmentioned}",
                              'warning')

    def _check_mcp_tools(self, skill_name: str, content: str) -> None:
        """Check MCP tool references in allowed-tools"""
        # Extract allowed-tools from frontmatter
        tools_match = re.search(r'^allowed-tools:\s*(.+)$', content, re.MULTILINE)
        if not tools_match:
            return

        tools = tools_match.group(1)

        # Find MCP tool references
        mcp_refs = re.findall(r'mcp__([a-zA-Z0-9_-]+)__', tools)

        for mcp in mcp_refs:
            # We can't verify MCP servers exist, but we can check format
            if not re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', mcp):
                self.add_issue(skill_name, 'invalid_mcp',
                              f"Invalid MCP server name format: {mcp}",
                              'error')

    def _check_circular_dependencies(self) -> None:
        """Check for circular dependencies between skills"""
        def find_cycle(skill: str, path: List[str], visited: Set[str]) -> Optional[List[str]]:
            if skill in path:
                cycle_start = path.index(skill)
                return path[cycle_start:] + [skill]

            if skill in visited:
                return None

            visited.add(skill)
            path.append(skill)

            for ref in self.skill_references.get(skill, set()):
                cycle = find_cycle(ref, path.copy(), visited)
                if cycle:
                    return cycle

            return None

        visited: Set[str] = set()
        for skill in self.skill_references:
            cycle = find_cycle(skill, [], visited)
            if cycle:
                self.add_issue(skill, 'circular_dep',
                              f"Circular dependency detected: {' -> '.join(cycle)}",
                              'warning')

    def print_report(self) -> None:
        """Print dependency check report"""
        print(f"\n{'='*60}")
        print("SKILL DEPENDENCY CHECK")
        print(f"{'='*60}\n")

        print(f"Skills discovered: {len(self.skill_names)}")
        print(f"Cross-references found: {sum(len(v) for v in self.skill_references.values())}")

        if not self.issues:
            print("\n✅ No dependency issues found!")
        else:
            errors = [i for i in self.issues if i.severity == 'error']
            warnings = [i for i in self.issues if i.severity == 'warning']

            if errors:
                print("\n🔴 ERRORS:")
                for issue in errors:
                    print(f"   [{issue.skill}] {issue.issue_type}: {issue.message}")

            if warnings:
                print("\n🟡 WARNINGS:")
                for issue in warnings:
                    print(f"   [{issue.skill}] {issue.issue_type}: {issue.message}")

        # Print reference graph
        if self.skill_references:
            print("\n📊 SKILL REFERENCE GRAPH:")
            for skill, refs in sorted(self.skill_references.items()):
                if refs:
                    print(f"   {skill} -> {', '.join(sorted(refs))}")

        print(f"\n{'='*60}")
        errors = sum(1 for i in self.issues if i.severity == 'error')
        warnings = sum(1 for i in self.issues if i.severity == 'warning')
        print(f"Summary: {errors} errors, {warnings} warnings")
        print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description='Check skill dependencies')
    parser.add_argument('--skill', '-s', help='Check specific skill only')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    parser.add_argument('--dir', default='.', help='Base directory')

    args = parser.parse_args()

    base_dir = Path(args.dir).resolve()
    checker = DependencyChecker(base_dir)

    if args.skill:
        passed = checker.check_single(args.skill)
    else:
        passed = checker.check_all()

    if args.json:
        import json
        print(json.dumps({
            'passed': passed,
            'skills_found': list(checker.skill_names),
            'references': {k: list(v) for k, v in checker.skill_references.items()},
            'issues': [
                {'skill': i.skill, 'type': i.issue_type,
                 'message': i.message, 'severity': i.severity}
                for i in checker.issues
            ]
        }, indent=2))
    else:
        checker.print_report()

    return 0 if passed else 1


if __name__ == '__main__':
    sys.exit(main())

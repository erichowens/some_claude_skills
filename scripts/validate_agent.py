#!/usr/bin/env python3
"""
Agent Validator - Pre-flight checks for Founding Council Agents

Validates agent structure, content quality, and coordination references.
Part of The Forge infrastructure.
"""

import os
import sys
import re
import yaml
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum


class Severity(Enum):
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"


@dataclass
class ValidationIssue:
    severity: Severity
    message: str
    line: int = None
    suggestion: str = None


class AgentValidator:
    """Validates Claude Code agent definitions.

    Supports two formats:
    1. Flat format: .claude/agents/name.md (newer, Claude Code native)
    2. Directory format: .claude/agents/name/AGENT.md (older, custom format)
    """

    # Required frontmatter fields for agents (flat format)
    REQUIRED_FIELDS_FLAT = ['name', 'description', 'tools']

    # Required frontmatter fields for agents (directory format)
    REQUIRED_FIELDS_DIR = ['name', 'role', 'allowed-tools']

    # Optional but recommended fields
    RECOMMENDED_FIELDS = ['model']

    # Valid model values
    VALID_MODELS = ['opus', 'sonnet', 'haiku']

    # Core tools agents typically need
    CORE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'Task']

    def __init__(self, agent_path: str):
        self.agent_path = Path(agent_path)
        self.issues: List[ValidationIssue] = []
        self.frontmatter: Dict = {}
        self.content: str = ""
        self.is_directory_format: bool = False

    def validate(self) -> List[ValidationIssue]:
        """Run all validation checks."""
        self.check_file_exists()
        if self.issues and any(i.severity == Severity.ERROR for i in self.issues):
            return self.issues

        self.load_content()
        if self.issues and any(i.severity == Severity.ERROR for i in self.issues):
            return self.issues

        self.check_frontmatter()
        self.check_name_format()
        self.check_description_quality()
        self.check_tools()
        self.check_model()
        self.check_body_content()
        self.check_coordination_references()

        return self.issues

    def check_file_exists(self):
        """Verify agent file exists. Supports both flat and directory formats."""
        # Check if path is a directory (directory format)
        if self.agent_path.is_dir():
            agent_md = self.agent_path / "AGENT.md"
            if not agent_md.exists():
                self.issues.append(ValidationIssue(
                    Severity.ERROR,
                    f"Agent directory missing AGENT.md: {self.agent_path}"
                ))
                return
            self.agent_path = agent_md
            self.is_directory_format = True
            return

        # Flat format - check file exists
        if not self.agent_path.exists():
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Agent file not found: {self.agent_path}"
            ))
            return

        if not self.agent_path.suffix == '.md':
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Agent file must be markdown (.md): {self.agent_path}"
            ))

    def load_content(self):
        """Load and parse agent file."""
        try:
            with open(self.agent_path, 'r', encoding='utf-8') as f:
                self.content = f.read()
        except Exception as e:
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Failed to read file: {e}"
            ))
            return

        # Check for YAML frontmatter
        if not self.content.startswith('---'):
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                "Missing YAML frontmatter. File must start with '---'"
            ))
            return

        # Extract frontmatter
        try:
            parts = self.content.split('---', 2)
            if len(parts) < 3:
                self.issues.append(ValidationIssue(
                    Severity.ERROR,
                    "Invalid frontmatter format. Must have opening and closing '---'"
                ))
                return
            self.frontmatter = yaml.safe_load(parts[1]) or {}
        except yaml.YAMLError as e:
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Invalid YAML frontmatter: {e}"
            ))

    def check_frontmatter(self):
        """Validate required frontmatter fields based on format."""
        required_fields = self.REQUIRED_FIELDS_DIR if self.is_directory_format else self.REQUIRED_FIELDS_FLAT

        for field in required_fields:
            if field not in self.frontmatter:
                self.issues.append(ValidationIssue(
                    Severity.ERROR,
                    f"Missing required field: {field}"
                ))

        # For directory format, check optional fields
        if self.is_directory_format:
            optional_fields = ['triggers', 'coordinates_with', 'outputs']
            for field in optional_fields:
                if field not in self.frontmatter:
                    self.issues.append(ValidationIssue(
                        Severity.INFO,
                        f"Missing optional field: {field}",
                        suggestion=f"Add '{field}:' for better agent coordination"
                    ))
        else:
            # Flat format uses 'model' as recommended
            for field in self.RECOMMENDED_FIELDS:
                if field not in self.frontmatter:
                    self.issues.append(ValidationIssue(
                        Severity.INFO,
                        f"Missing recommended field: {field}",
                        suggestion=f"Add '{field}:' to frontmatter for better agent behavior"
                    ))

    def check_name_format(self):
        """Validate agent name format."""
        name = self.frontmatter.get('name', '')
        if not name:
            return  # Already reported in check_frontmatter

        # Name should be lowercase with hyphens
        if not re.match(r'^[a-z][a-z0-9-]*$', name):
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Invalid name format: '{name}'. Must be lowercase, start with letter, use only letters/numbers/hyphens."
            ))

        if len(name) > 32:
            self.issues.append(ValidationIssue(
                Severity.WARNING,
                f"Name is long: {len(name)} chars. Consider shorter name for invocation ease.",
                suggestion="Agent names should be memorable and easy to type"
            ))

        # Check if filename/directory matches name
        if self.is_directory_format:
            # For directory format, check parent directory name
            expected_dirname = name
            actual_dirname = self.agent_path.parent.name
            if actual_dirname != expected_dirname:
                self.issues.append(ValidationIssue(
                    Severity.WARNING,
                    f"Directory name '{actual_dirname}' doesn't match name '{name}'",
                    suggestion=f"Rename directory to '{expected_dirname}/'"
                ))
        else:
            # For flat format, check filename
            expected_filename = f"{name}.md"
            if self.agent_path.name != expected_filename:
                self.issues.append(ValidationIssue(
                    Severity.WARNING,
                    f"Filename '{self.agent_path.name}' doesn't match name '{name}'",
                    suggestion=f"Rename file to '{expected_filename}'"
                ))

    def check_description_quality(self):
        """Analyze description/role field quality."""
        # Get description or role depending on format
        description = self.frontmatter.get('description', '') or self.frontmatter.get('role', '')
        if not description:
            return  # Already reported

        # For directory format, role is typically short - check triggers field instead
        if self.is_directory_format:
            triggers = self.frontmatter.get('triggers', [])
            if not triggers:
                self.issues.append(ValidationIssue(
                    Severity.WARNING,
                    "No triggers defined. Add invocation phrases.",
                    suggestion='Add triggers: ["build tool", "create mcp", ...]'
                ))
            elif len(triggers) < 3:
                self.issues.append(ValidationIssue(
                    Severity.INFO,
                    f"Only {len(triggers)} triggers defined. Consider adding more.",
                    suggestion="More triggers = easier invocation"
                ))
            return

        # Flat format - check description quality
        if len(description) > 1024:
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Description too long: {len(description)} chars (max 1024)"
            ))

        if len(description) < 50:
            self.issues.append(ValidationIssue(
                Severity.WARNING,
                "Description too short. Should explain role, capabilities, and trigger phrases."
            ))

        # Check for trigger words
        trigger_patterns = ['use for', 'use when', 'triggers:', '"']
        has_triggers = any(p in description.lower() for p in trigger_patterns)
        if not has_triggers:
            self.issues.append(ValidationIssue(
                Severity.WARNING,
                "Description should include trigger phrases in quotes",
                suggestion='Add phrases like: Use for "status", "brief me", "what\'s happening"'
            ))

        # Check for role/purpose indication
        role_words = ['agent', 'builds', 'creates', 'manages', 'coordinates', 'handles', 'translates', 'maps']
        has_role = any(word in description.lower() for word in role_words)
        if not has_role:
            self.issues.append(ValidationIssue(
                Severity.INFO,
                "Consider clarifying what this agent DOES in the description"
            ))

    def check_tools(self):
        """Validate tools field (tools or allowed-tools)."""
        # Get tools from either field
        tools = self.frontmatter.get('tools', '') or self.frontmatter.get('allowed-tools', '')
        if not tools:
            return  # Already reported

        # Parse tools list (comma-separated or YAML list)
        if isinstance(tools, list):
            tool_list = tools
        else:
            tool_list = [t.strip() for t in str(tools).split(',')]

        # Check for essential tools
        missing_core = []
        for core in ['Read', 'Task']:  # Minimum tools most agents need
            if core not in tool_list:
                missing_core.append(core)

        if missing_core:
            self.issues.append(ValidationIssue(
                Severity.INFO,
                f"Missing commonly-used tools: {', '.join(missing_core)}",
                suggestion="Most agents need Read and Task for basic operations"
            ))

        # Check for unrestricted Bash
        if 'Bash' in tool_list:
            self.issues.append(ValidationIssue(
                Severity.INFO,
                "Unrestricted Bash access. Consider if all bash commands are needed.",
                suggestion="For security, consider scoping: Bash(git:*,npm:*)"
            ))

    def check_model(self):
        """Validate model field (only for flat format)."""
        # Directory format doesn't use model field
        if self.is_directory_format:
            return

        model = self.frontmatter.get('model', '')

        if model and model not in self.VALID_MODELS:
            self.issues.append(ValidationIssue(
                Severity.ERROR,
                f"Invalid model: '{model}'. Must be one of: {', '.join(self.VALID_MODELS)}"
            ))

        if not model:
            self.issues.append(ValidationIssue(
                Severity.INFO,
                "No model specified. Will use default (usually sonnet).",
                suggestion="Add 'model: sonnet' or 'model: opus' for complex reasoning"
            ))

    def check_body_content(self):
        """Validate the body content of the agent file."""
        # Get body after frontmatter
        parts = self.content.split('---', 2)
        if len(parts) < 3:
            return
        body = parts[2]

        lines = body.strip().split('\n')

        # Check for minimum content
        if len(lines) < 10:
            self.issues.append(ValidationIssue(
                Severity.WARNING,
                f"Agent body is very short ({len(lines)} lines). Add more guidance.",
                suggestion="Include: Core Philosophy, First Actions, Templates, Pledge"
            ))

        # Check for heading structure
        headings = [l for l in lines if l.startswith('#')]
        if len(headings) < 2:
            self.issues.append(ValidationIssue(
                Severity.WARNING,
                "Few section headings. Consider adding structure.",
                suggestion="Add ## sections for Philosophy, Actions, Templates"
            ))

        # Check for actionable content
        has_actions = any(word in body.lower() for word in ['first action', 'when invoked', 'always start', 'your job'])
        if not has_actions:
            self.issues.append(ValidationIssue(
                Severity.WARNING,
                "No clear first-action guidance found.",
                suggestion="Add '## Your First Action' section with specific steps"
            ))

        # Check for code examples
        has_code = '```' in body
        if not has_code:
            self.issues.append(ValidationIssue(
                Severity.INFO,
                "No code examples. Consider adding bash/script examples for common tasks."
            ))

    def check_coordination_references(self):
        """Check if coordinating agent references are valid."""
        # Get body after frontmatter
        parts = self.content.split('---', 2)
        if len(parts) < 3:
            return
        body = parts[2].lower()

        # Known founding council agents
        council_agents = [
            'architect', 'smith', 'cartographer', 'weaver',
            'librarian', 'scout', 'visualizer', 'archivist', 'liaison'
        ]

        # Check for coordination mentions
        mentioned = [a for a in council_agents if a in body]

        # Get agents directory to check if referenced agents exist
        # For directory format, go up one level from AGENT.md to agent dir, then up to agents dir
        if self.is_directory_format:
            agents_dir = self.agent_path.parent.parent
        else:
            agents_dir = self.agent_path.parent

        for agent in mentioned:
            # Check both flat format (agent.md) and directory format (agent/AGENT.md)
            agent_file_flat = agents_dir / f"{agent}.md"
            agent_dir = agents_dir / agent / "AGENT.md"
            if not agent_file_flat.exists() and not agent_dir.exists():
                self.issues.append(ValidationIssue(
                    Severity.WARNING,
                    f"References agent '{agent}' but no agent definition found",
                    suggestion=f"Ensure {agent}.md or {agent}/AGENT.md exists in {agents_dir}"
                ))


def print_report(issues: List[ValidationIssue], agent_name: str):
    """Print validation report."""
    if not issues:
        print(f"✅ Agent '{agent_name}' validated successfully! No issues found.")
        return

    errors = [i for i in issues if i.severity == Severity.ERROR]
    warnings = [i for i in issues if i.severity == Severity.WARNING]
    info = [i for i in issues if i.severity == Severity.INFO]

    print(f"\n{'='*60}")
    print(f"AGENT VALIDATION REPORT: {agent_name}")
    print(f"{'='*60}\n")

    if errors:
        print(f"❌ ERRORS ({len(errors)}):")
        for issue in errors:
            print(f"  • {issue.message}")
            if issue.suggestion:
                print(f"    💡 {issue.suggestion}")
        print()

    if warnings:
        print(f"⚠️  WARNINGS ({len(warnings)}):")
        for issue in warnings:
            print(f"  • {issue.message}")
            if issue.suggestion:
                print(f"    💡 {issue.suggestion}")
        print()

    if info:
        print(f"ℹ️  SUGGESTIONS ({len(info)}):")
        for issue in info:
            print(f"  • {issue.message}")
            if issue.suggestion:
                print(f"    💡 {issue.suggestion}")
        print()

    print(f"{'='*60}")
    status = "❌ FAILED" if errors else "✅ PASSED"
    print(f"Status: {status}")
    print(f"Summary: {len(errors)} errors, {len(warnings)} warnings, {len(info)} suggestions")
    print(f"{'='*60}\n")


def validate_all_agents(agents_dir: Path) -> int:
    """Validate all agents in a directory.

    Supports both:
    - Flat format: name.md files directly in agents_dir
    - Directory format: name/AGENT.md subdirectories
    """
    # Collect all agent paths
    agent_paths = []

    # Find flat format agents (*.md files, excluding uppercase like FOUNDING_COUNCIL.md)
    for md_file in agents_dir.glob('*.md'):
        # Skip uppercase filenames (documentation files like FOUNDING_COUNCIL.md)
        stem_upper = md_file.stem.upper()
        if md_file.stem == stem_upper:
            continue
        agent_paths.append(md_file)

    # Find directory format agents (subdirs with AGENT.md)
    for subdir in agents_dir.iterdir():
        if subdir.is_dir() and (subdir / "AGENT.md").exists():
            agent_paths.append(subdir)

    if not agent_paths:
        print(f"No agent files found in {agents_dir}")
        return 1

    print(f"Found {len(agent_paths)} agent(s) to validate\n")

    total_errors = 0

    for agent_path in sorted(agent_paths, key=lambda p: p.name):
        validator = AgentValidator(agent_path)
        issues = validator.validate()

        errors = [i for i in issues if i.severity == Severity.ERROR]
        total_errors += len(errors)

        agent_name = validator.frontmatter.get('name', agent_path.stem if agent_path.is_file() else agent_path.name)
        print_report(issues, agent_name)

    return 1 if total_errors > 0 else 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_agent.py <agent_path_or_directory>")
        print("\nExamples:")
        print("  python validate_agent.py .claude/agents/smith.md")
        print("  python validate_agent.py .claude/agents/  # Validate all")
        sys.exit(1)

    path = Path(sys.argv[1])

    if path.is_dir():
        print(f"Validating all agents in: {path}\n")
        exit_code = validate_all_agents(path)
    else:
        print(f"Validating agent: {path}\n")
        validator = AgentValidator(path)
        issues = validator.validate()
        agent_name = validator.frontmatter.get('name', path.stem)
        print_report(issues, agent_name)
        errors = [i for i in issues if i.severity == Severity.ERROR]
        exit_code = 1 if errors else 0

    sys.exit(exit_code)


if __name__ == '__main__':
    main()

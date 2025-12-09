#!/usr/bin/env python3
"""
Changelog Generator - Part of The Archivist

Analyzes git history for .claude/skills/ and .claude/agents/ changes
and generates/updates CHANGELOG.md in Keep a Changelog format.

Usage:
    python scripts/update_changelog.py [--output PATH] [--since DATE]

Output goes to .claude/archive/changelogs/CHANGELOG.md by default.
"""

import subprocess
import argparse
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict


def find_project_root() -> Path:
    """Find the project root by looking for .claude directory."""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".claude").exists():
            return current
        current = current.parent
    return Path.cwd()


def get_git_log(since: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get git log for .claude/skills/ and .claude/agents/ directories."""
    try:
        # Build git log command
        cmd = [
            "git", "log",
            "--pretty=format:%H|%ai|%s|%b",
            "--name-status",
        ]

        if since:
            cmd.append(f"--since={since}")

        cmd.extend([
            "--",
            ".claude/skills/",
            ".claude/agents/"
        ])

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )

        return parse_git_log(result.stdout)

    except subprocess.CalledProcessError:
        # No git repo or no commits
        return []


def parse_git_log(log_output: str) -> List[Dict[str, Any]]:
    """Parse git log output into structured commits."""
    commits = []
    lines = log_output.split("\n")

    current_commit = None

    for line in lines:
        if "|" in line and not line.startswith(("A\t", "M\t", "D\t", "R\t")):
            # New commit line
            parts = line.split("|", 3)
            if len(parts) >= 3:
                if current_commit:
                    commits.append(current_commit)

                current_commit = {
                    "hash": parts[0],
                    "date": parts[1],
                    "subject": parts[2],
                    "body": parts[3] if len(parts) > 3 else "",
                    "files": []
                }
        elif line.startswith(("A\t", "M\t", "D\t", "R\t")) and current_commit:
            # File change line
            parts = line.split("\t", 1)
            if len(parts) == 2:
                status = parts[0]
                filepath = parts[1]
                current_commit["files"].append({
                    "status": status,
                    "path": filepath
                })

    if current_commit:
        commits.append(current_commit)

    return commits


def categorize_changes(commits: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Categorize commits into Added, Changed, Fixed, Removed."""
    categories = {
        "Added": [],
        "Changed": [],
        "Fixed": [],
        "Deprecated": [],
        "Removed": [],
        "Security": []
    }

    for commit in commits:
        # Analyze commit message
        subject = commit["subject"].lower()
        body = commit["body"].lower()

        # Determine category based on keywords
        category = None

        if any(kw in subject for kw in ["add", "new", "create", "initial"]):
            category = "Added"
        elif any(kw in subject for kw in ["remove", "delete"]):
            category = "Removed"
        elif any(kw in subject for kw in ["fix", "bug", "issue", "error"]):
            category = "Fixed"
        elif any(kw in subject for kw in ["deprecate"]):
            category = "Deprecated"
        elif any(kw in subject for kw in ["security", "vulnerability", "cve"]):
            category = "Security"
        elif any(kw in subject for kw in ["update", "improve", "enhance", "change", "refactor"]):
            category = "Changed"

        # Also check file status
        if not category:
            for file in commit["files"]:
                if file["status"] == "A":
                    category = "Added"
                    break
                elif file["status"] == "D":
                    category = "Removed"
                    break
                elif file["status"] == "M":
                    category = "Changed"
                    break

        # Default to Changed
        if not category:
            category = "Changed"

        categories[category].append(commit)

    return categories


def extract_entity_name(filepath: str) -> Optional[Tuple[str, str]]:
    """Extract skill or agent name from file path."""
    # .claude/skills/skill-name/... -> ("skill", "skill-name")
    # .claude/agents/agent-name/... -> ("agent", "agent-name")

    parts = Path(filepath).parts

    if ".claude" in parts:
        idx = parts.index(".claude")
        if idx + 2 < len(parts):
            entity_type = parts[idx + 1].rstrip("s")  # "skills" -> "skill"
            entity_name = parts[idx + 2]
            return (entity_type, entity_name)

    return None


def generate_changelog_entry(
    categories: Dict[str, List[Dict[str, Any]]],
    version: str = "Unreleased"
) -> str:
    """Generate a changelog entry in Keep a Changelog format."""
    lines = [
        f"## [{version}] - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
        ""
    ]

    for category in ["Added", "Changed", "Fixed", "Deprecated", "Removed", "Security"]:
        entries = categories.get(category, [])
        if not entries:
            continue

        lines.append(f"### {category}")
        lines.append("")

        # Group by entity
        entity_changes = defaultdict(list)

        for commit in entries:
            for file in commit["files"]:
                entity_info = extract_entity_name(file["path"])
                if entity_info:
                    entity_type, entity_name = entity_info
                    entity_changes[f"{entity_type}:{entity_name}"].append(commit)

        # Generate entries
        for entity_key, commits in sorted(entity_changes.items()):
            entity_type, entity_name = entity_key.split(":", 1)

            # Get most recent commit message
            commit = commits[0]
            subject = commit["subject"]

            # Clean up subject
            subject = re.sub(r'^(add|new|create|update|improve|fix|remove|delete)\s*:?\s*', '', subject, flags=re.IGNORECASE)
            subject = subject.strip()

            if subject:
                lines.append(f"- **{entity_name}** ({entity_type}): {subject}")
            else:
                lines.append(f"- **{entity_name}** ({entity_type})")

        lines.append("")

    return "\n".join(lines)


def read_existing_changelog(changelog_path: Path) -> str:
    """Read existing changelog content."""
    if not changelog_path.exists():
        return ""
    return changelog_path.read_text(encoding="utf-8")


def merge_changelog(existing: str, new_entry: str) -> str:
    """Merge new entry into existing changelog."""
    if not existing:
        # Create new changelog
        header = """# Changelog

All notable changes to the Claude Skills Ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

"""
        return header + new_entry

    # Insert new entry after header
    lines = existing.split("\n")

    # Find where to insert (after header, before first ## entry)
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("## ["):
            insert_idx = i
            break

    if insert_idx == 0:
        # No existing entries, append
        return existing + "\n\n" + new_entry

    # Insert new entry
    new_lines = lines[:insert_idx] + new_entry.split("\n") + [""] + lines[insert_idx:]
    return "\n".join(new_lines)


def main():
    parser = argparse.ArgumentParser(description="Generate/update changelog")
    parser.add_argument(
        "--output", "-o",
        type=Path,
        help="Output file (default: .claude/archive/changelogs/CHANGELOG.md)"
    )
    parser.add_argument(
        "--since", "-s",
        type=str,
        help="Include commits since date (e.g., '2024-12-01', '1 week ago')"
    )
    parser.add_argument(
        "--version", "-v",
        type=str,
        default="Unreleased",
        help="Version number for changelog entry (default: Unreleased)"
    )
    args = parser.parse_args()

    project_root = find_project_root()

    # Setup output path
    if args.output:
        changelog_path = args.output
    else:
        changelog_dir = project_root / ".claude" / "archive" / "changelogs"
        changelog_dir.mkdir(parents=True, exist_ok=True)
        changelog_path = changelog_dir / "CHANGELOG.md"

    # Get git log
    commits = get_git_log(since=args.since)

    if not commits:
        # Check if git repo exists
        try:
            subprocess.run(["git", "rev-parse", "--git-dir"], capture_output=True, check=True)
            print("ℹ️  No commits found in specified range")

            # Create initial changelog if it doesn't exist
            if not changelog_path.exists():
                print("📝 Creating initial CHANGELOG.md with founding entry")

                initial_entry = f"""## [0.1.0] - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

### Added

- **Ecosystem Foundation**: Initial creation of the Claude Skills Ecosystem
- **9 Founding Agents**: architect, archivist, cartographer, liaison, librarian, scout, smith, visualizer, weaver
- **51 Founding Skills**: Complete initial skill library covering diverse domains
- **Auto-documentation Pipeline**: Snapshot and changelog generation infrastructure

"""
                header = """# Changelog

All notable changes to the Claude Skills Ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

"""
                changelog_path.write_text(header + initial_entry, encoding="utf-8")
                print(f"✅ Initial changelog created: {changelog_path}")
                return 0

        except subprocess.CalledProcessError:
            print("⚠️  Not a git repository. Creating initial changelog without git history.")

            if not changelog_path.exists():
                initial_entry = f"""## [0.1.0] - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

### Added

- **Ecosystem Foundation**: Initial creation of the Claude Skills Ecosystem
- **Documentation Infrastructure**: Auto-generated snapshots and changelogs

"""
                header = """# Changelog

All notable changes to the Claude Skills Ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

"""
                changelog_path.write_text(header + initial_entry, encoding="utf-8")
                print(f"✅ Initial changelog created: {changelog_path}")

        return 0

    # Categorize changes
    categories = categorize_changes(commits)

    # Generate new entry
    new_entry = generate_changelog_entry(categories, args.version)

    # Read existing changelog
    existing = read_existing_changelog(changelog_path)

    # Merge
    updated_changelog = merge_changelog(existing, new_entry)

    # Write
    changelog_path.write_text(updated_changelog, encoding="utf-8")

    # Print summary
    total_changes = sum(len(entries) for entries in categories.values())
    print(f"✅ Changelog updated: {changelog_path}")
    print(f"   📝 {total_changes} commit(s) processed")

    for category, entries in categories.items():
        if entries:
            print(f"   - {category}: {len(entries)}")

    return 0


if __name__ == "__main__":
    exit(main())

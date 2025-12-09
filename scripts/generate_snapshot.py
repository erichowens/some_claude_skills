#!/usr/bin/env python3
"""
Ecosystem Snapshot Generator - Part of The Archivist

Creates timestamped snapshots of ecosystem state with delta tracking.
Compares against previous snapshot to identify changes.

Usage:
    python scripts/generate_snapshot.py [--output PATH] [--label LABEL]

Output goes to .claude/archive/snapshots/ by default.
"""

import json
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple


def find_project_root() -> Path:
    """Find the project root by looking for .claude directory."""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".claude").exists():
            return current
        current = current.parent
    return Path.cwd()


def load_ecosystem_state(state_file: Path) -> Optional[Dict[str, Any]]:
    """Load ecosystem state JSON."""
    if not state_file.exists():
        return None
    try:
        return json.loads(state_file.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def find_previous_snapshot(snapshots_dir: Path) -> Optional[Dict[str, Any]]:
    """Find the most recent snapshot file."""
    if not snapshots_dir.exists():
        return None

    snapshot_files = sorted(snapshots_dir.glob("*.json"))
    if not snapshot_files:
        return None

    # Load most recent
    latest = snapshot_files[-1]
    try:
        return json.loads(latest.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def calculate_delta(current: Dict[str, Any], previous: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate changes since previous snapshot."""
    if previous is None:
        return {
            "is_initial": True,
            "skills_added": len(current["skills"]),
            "agents_added": len(current["agents"]),
            "new_skills": [s["name"] for s in current["skills"]],
            "new_agents": [a["name"] for a in current["agents"]],
        }

    # Calculate diffs
    prev_skill_names = {s["name"] for s in previous["skills"]}
    curr_skill_names = {s["name"] for s in current["skills"]}

    prev_agent_names = {a["name"] for a in previous["agents"]}
    curr_agent_names = {a["name"] for a in current["agents"]}

    new_skills = sorted(curr_skill_names - prev_skill_names)
    removed_skills = sorted(prev_skill_names - curr_skill_names)

    new_agents = sorted(curr_agent_names - prev_agent_names)
    removed_agents = sorted(prev_agent_names - curr_agent_names)

    # Detect changed skills (by comparing description/tools)
    changed_skills = []
    for curr_skill in current["skills"]:
        name = curr_skill["name"]
        if name in prev_skill_names and name not in new_skills:
            prev_skill = next((s for s in previous["skills"] if s["name"] == name), None)
            if prev_skill and (
                curr_skill.get("description") != prev_skill.get("description") or
                curr_skill.get("tools") != prev_skill.get("tools")
            ):
                changed_skills.append(name)

    return {
        "is_initial": False,
        "skills_added": len(new_skills),
        "skills_removed": len(removed_skills),
        "agents_added": len(new_agents),
        "agents_removed": len(removed_agents),
        "skills_changed": len(changed_skills),
        "new_skills": new_skills,
        "removed_skills": removed_skills,
        "new_agents": new_agents,
        "removed_agents": removed_agents,
        "changed_skills": changed_skills,
    }


def generate_snapshot_markdown(
    state: Dict[str, Any],
    delta: Dict[str, Any],
    timestamp: str
) -> str:
    """Generate human-readable markdown snapshot."""
    summary = state["summary"]

    # Header
    lines = [
        f"# Ecosystem Snapshot: {timestamp}",
        "",
        "## Summary Statistics",
        "",
        "| Metric | Count | Change |",
        "|--------|-------|--------|",
        f"| Total Skills | {summary['total_skills']} | {'+' if delta.get('skills_added', 0) > 0 else ''}{delta.get('skills_added', 0) - delta.get('skills_removed', 0)} |",
        f"| Total Agents | {summary['total_agents']} | {'+' if delta.get('agents_added', 0) > 0 else ''}{delta.get('agents_added', 0) - delta.get('agents_removed', 0)} |",
        f"| Unique Tools | {summary['unique_tools']} | - |",
        f"| Skill Categories | {len(summary['skill_categories'])} | - |",
        "",
    ]

    # New since last snapshot
    if delta.get("is_initial"):
        lines.extend([
            "## Initial Snapshot",
            "",
            "This is the founding snapshot of the ecosystem.",
            "",
            f"**{summary['total_skills']} Skills**: {', '.join([s['name'] for s in state['skills'][:10]])}{'...' if len(state['skills']) > 10 else ''}",
            "",
            f"**{summary['total_agents']} Agents**: {', '.join([a['name'] for a in state['agents']])}",
            "",
        ])
    else:
        lines.extend([
            "## Changes Since Last Snapshot",
            "",
        ])

        if delta["new_skills"]:
            lines.append("### New Skills")
            lines.append("")
            for skill_name in delta["new_skills"]:
                skill = next((s for s in state["skills"] if s["name"] == skill_name), None)
                if skill:
                    desc = skill.get("description", "")[:100]
                    lines.append(f"- **{skill_name}**: {desc}{'...' if len(skill.get('description', '')) > 100 else ''}")
            lines.append("")

        if delta["new_agents"]:
            lines.append("### New Agents")
            lines.append("")
            for agent_name in delta["new_agents"]:
                agent = next((a for a in state["agents"] if a["name"] == agent_name), None)
                if agent:
                    role = agent.get("role", "")
                    lines.append(f"- **{agent_name}**: {role}")
            lines.append("")

        if delta["changed_skills"]:
            lines.append("### Updated Skills")
            lines.append("")
            for skill_name in delta["changed_skills"]:
                lines.append(f"- **{skill_name}**: Description or tools updated")
            lines.append("")

        if delta["removed_skills"]:
            lines.append("### Removed Skills")
            lines.append("")
            for skill_name in delta["removed_skills"]:
                lines.append(f"- **{skill_name}**")
            lines.append("")

        if delta["removed_agents"]:
            lines.append("### Removed Agents")
            lines.append("")
            for agent_name in delta["removed_agents"]:
                lines.append(f"- **{agent_name}**")
            lines.append("")

    # Notable patterns
    lines.extend([
        "## Ecosystem Health",
        "",
        f"- **Directory-format Agents**: {summary['agents_by_format']['directory']}",
        f"- **Flat-format Agents**: {summary['agents_by_format']['flat']}",
        f"- **Skills with References**: {sum(1 for s in state['skills'] if s.get('has_references'))}",
        f"- **Skills with Examples**: {sum(1 for s in state['skills'] if s.get('has_examples'))}",
        "",
    ])

    # Tool usage
    lines.extend([
        "## Tool Usage",
        "",
        "Top 10 most used tools:",
        "",
    ])

    tool_usage = state.get("tool_usage", {})
    top_tools = sorted(tool_usage.items(), key=lambda x: x[1], reverse=True)[:10]
    for tool, count in top_tools:
        lines.append(f"- **{tool}**: {count} uses")

    lines.extend([
        "",
        "---",
        "",
        f"*Generated at {timestamp} by The Archivist*",
    ])

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Generate ecosystem snapshot")
    parser.add_argument(
        "--output", "-o",
        type=Path,
        help="Output directory (default: .claude/archive/snapshots/)"
    )
    parser.add_argument(
        "--label", "-l",
        type=str,
        help="Optional label for snapshot (e.g., 'initial', 'milestone')"
    )
    args = parser.parse_args()

    project_root = find_project_root()

    # Load current ecosystem state
    state_file = project_root / ".claude" / "data" / "ecosystem-state.json"
    if not state_file.exists():
        print("❌ No ecosystem state found. Run generate_ecosystem_data.py first.")
        return 1

    state = load_ecosystem_state(state_file)
    if state is None:
        print("❌ Failed to load ecosystem state")
        return 1

    # Setup output directory
    if args.output:
        snapshots_dir = args.output
    else:
        snapshots_dir = project_root / ".claude" / "archive" / "snapshots"

    snapshots_dir.mkdir(parents=True, exist_ok=True)

    # Find previous snapshot
    previous = find_previous_snapshot(snapshots_dir)

    # Calculate delta
    delta = calculate_delta(state, previous)

    # Generate timestamp
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    file_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d-%H%M")

    # Add label if provided
    if args.label:
        filename = f"{file_timestamp}-{args.label}"
    else:
        filename = file_timestamp

    # Create snapshot data
    snapshot_data = {
        "timestamp": timestamp,
        "state": state,
        "delta": delta,
    }

    # Write JSON snapshot
    json_path = snapshots_dir / f"{filename}.json"
    json_path.write_text(
        json.dumps(snapshot_data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    # Write markdown snapshot
    markdown = generate_snapshot_markdown(state, delta, timestamp)
    md_path = snapshots_dir / f"{filename}.md"
    md_path.write_text(markdown, encoding="utf-8")

    # Print summary
    print(f"✅ Snapshot created: {md_path.name}")
    print(f"   📊 {state['summary']['total_agents']} agents, {state['summary']['total_skills']} skills")

    if delta.get("is_initial"):
        print(f"   🎉 Initial ecosystem snapshot")
    else:
        changes = []
        if delta["skills_added"]:
            changes.append(f"+{delta['skills_added']} skills")
        if delta["agents_added"]:
            changes.append(f"+{delta['agents_added']} agents")
        if delta["skills_changed"]:
            changes.append(f"~{delta['skills_changed']} updated")

        if changes:
            print(f"   📈 Changes: {', '.join(changes)}")
        else:
            print(f"   ⚪ No changes since last snapshot")

    return 0


if __name__ == "__main__":
    exit(main())

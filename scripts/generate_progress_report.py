#!/usr/bin/env python3
"""
Progress Report Generator - Part of The Archivist

Generates weekly or monthly progress reports by analyzing snapshots.

Usage:
    python scripts/generate_progress_report.py --weekly
    python scripts/generate_progress_report.py --monthly
    python scripts/generate_progress_report.py --weekly --output path/to/report.md
"""

import json
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional


def find_project_root() -> Path:
    """Find the project root by looking for .claude directory."""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".claude").exists():
            return current
        current = current.parent
    return Path.cwd()


def load_snapshots(snapshots_dir: Path, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """Load all snapshots since a given date."""
    if not snapshots_dir.exists():
        return []

    snapshots = []
    for json_file in sorted(snapshots_dir.glob("*.json")):
        try:
            data = json.loads(json_file.read_text(encoding="utf-8"))

            # Parse timestamp
            ts_str = data.get("timestamp", "")
            if ts_str:
                # Handle both formats: "2024-12-07 18:00 UTC" and ISO format
                try:
                    ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M UTC")
                except ValueError:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))

                # Filter by date if specified
                if since and ts < since:
                    continue

            snapshots.append({
                "file": json_file.name,
                "data": data
            })
        except (json.JSONDecodeError, OSError, ValueError):
            continue

    return snapshots


def calculate_trends(snapshots: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate trends from snapshot series."""
    if len(snapshots) < 2:
        return {
            "has_trends": False,
            "message": "Need at least 2 snapshots for trend analysis"
        }

    first = snapshots[0]["data"]["state"]["summary"]
    last = snapshots[-1]["data"]["state"]["summary"]

    return {
        "has_trends": True,
        "skills": {
            "start": first["total_skills"],
            "end": last["total_skills"],
            "delta": last["total_skills"] - first["total_skills"]
        },
        "agents": {
            "start": first["total_agents"],
            "end": last["total_agents"],
            "delta": last["total_agents"] - first["total_agents"]
        },
        "tools": {
            "start": first["unique_tools"],
            "end": last["unique_tools"],
            "delta": last["unique_tools"] - first["unique_tools"]
        }
    }


def collect_changes(snapshots: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Collect all changes across snapshots."""
    all_new_skills = []
    all_new_agents = []
    all_changed_skills = []

    for snapshot in snapshots:
        delta = snapshot["data"].get("delta", {})

        all_new_skills.extend(delta.get("new_skills", []))
        all_new_agents.extend(delta.get("new_agents", []))
        all_changed_skills.extend(delta.get("changed_skills", []))

    return {
        "new_skills": all_new_skills,
        "new_agents": all_new_agents,
        "changed_skills": list(set(all_changed_skills))  # Deduplicate
    }


def generate_weekly_report(snapshots: List[Dict[str, Any]]) -> str:
    """Generate weekly progress report."""
    if not snapshots:
        return "# Weekly Progress Report\n\nNo snapshots available for this week.\n"

    # Get date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=7)

    trends = calculate_trends(snapshots)
    changes = collect_changes(snapshots)

    lines = [
        f"# Weekly Progress Report: Week of {start_date.strftime('%Y-%m-%d')}",
        "",
        "## Executive Summary",
        "",
    ]

    # Summary based on changes
    if changes["new_skills"] or changes["new_agents"]:
        summary_parts = []
        if changes["new_skills"]:
            summary_parts.append(f"{len(changes['new_skills'])} new skills")
        if changes["new_agents"]:
            summary_parts.append(f"{len(changes['new_agents'])} new agents")
        if changes["changed_skills"]:
            summary_parts.append(f"{len(changes['changed_skills'])} skills updated")

        lines.append(f"This week we added {' and '.join(summary_parts)}.")
    else:
        lines.append("This week focused on refinement and stabilization.")

    lines.extend(["", "## By the Numbers", ""])

    # Metrics table
    if trends["has_trends"]:
        t = trends
        lines.extend([
            "| Metric | Start | End | Delta |",
            "|--------|-------|-----|-------|",
            f"| Skills | {t['skills']['start']} | {t['skills']['end']} | {'+' if t['skills']['delta'] > 0 else ''}{t['skills']['delta']} |",
            f"| Agents | {t['agents']['start']} | {t['agents']['end']} | {'+' if t['agents']['delta'] > 0 else ''}{t['agents']['delta']} |",
            f"| Tools | {t['tools']['start']} | {t['tools']['end']} | {'+' if t['tools']['delta'] > 0 else ''}{t['tools']['delta']} |",
            ""
        ])

    # Highlights
    lines.extend(["## Highlights", ""])

    if changes["new_skills"]:
        lines.append("### New Skills Added")
        lines.append("")
        for skill in changes["new_skills"][:5]:  # Top 5
            lines.append(f"- **{skill}**")
        if len(changes["new_skills"]) > 5:
            lines.append(f"- ...and {len(changes['new_skills']) - 5} more")
        lines.append("")

    if changes["new_agents"]:
        lines.append("### New Agents Added")
        lines.append("")
        for agent in changes["new_agents"]:
            lines.append(f"- **{agent}**")
        lines.append("")

    if changes["changed_skills"]:
        lines.append("### Skills Updated")
        lines.append("")
        for skill in changes["changed_skills"][:5]:
            lines.append(f"- **{skill}**")
        if len(changes["changed_skills"]) > 5:
            lines.append(f"- ...and {len(changes['changed_skills']) - 5} more")
        lines.append("")

    # Placeholder sections
    lines.extend([
        "## Challenges",
        "",
        "*(To be filled in manually)*",
        "",
        "## Next Week",
        "",
        "*(To be filled in manually)*",
        "",
        "## Blockers",
        "",
        "*(None identified - to be filled in manually if any)*",
        "",
        "---",
        "",
        f"*Generated by The Archivist on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}*"
    ])

    return "\n".join(lines)


def generate_monthly_report(snapshots: List[Dict[str, Any]]) -> str:
    """Generate monthly progress report."""
    if not snapshots:
        return "# Monthly Progress Report\n\nNo snapshots available for this month.\n"

    # Get date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=30)

    trends = calculate_trends(snapshots)
    changes = collect_changes(snapshots)

    lines = [
        f"# Monthly Progress Report: {start_date.strftime('%B %Y')}",
        "",
        "## Executive Summary",
        "",
    ]

    # Comprehensive summary
    summary_parts = []
    if changes["new_skills"]:
        summary_parts.append(f"{len(changes['new_skills'])} new skills")
    if changes["new_agents"]:
        summary_parts.append(f"{len(changes['new_agents'])} new agents")
    if changes["changed_skills"]:
        summary_parts.append(f"{len(changes['changed_skills'])} skills updated")

    if summary_parts:
        lines.append(f"This month we grew the ecosystem with {', '.join(summary_parts)}.")
    else:
        lines.append("This month focused on consolidation and quality improvements.")

    lines.extend(["", "## Growth Metrics", ""])

    # Metrics table
    if trends["has_trends"]:
        t = trends
        lines.extend([
            "| Metric | Start of Month | End of Month | Net Change | Growth Rate |",
            "|--------|----------------|--------------|------------|-------------|",
        ])

        # Skills row
        skill_growth = f"{(t['skills']['delta'] / t['skills']['start'] * 100):.1f}%" if t['skills']['start'] > 0 else "N/A"
        lines.append(f"| Skills | {t['skills']['start']} | {t['skills']['end']} | {'+' if t['skills']['delta'] > 0 else ''}{t['skills']['delta']} | {skill_growth} |")

        # Agents row
        agent_growth = f"{(t['agents']['delta'] / t['agents']['start'] * 100):.1f}%" if t['agents']['start'] > 0 else "N/A"
        lines.append(f"| Agents | {t['agents']['start']} | {t['agents']['end']} | {'+' if t['agents']['delta'] > 0 else ''}{t['agents']['delta']} | {agent_growth} |")

        # Tools row
        tool_growth = f"{(t['tools']['delta'] / t['tools']['start'] * 100):.1f}%" if t['tools']['start'] > 0 else "N/A"
        lines.append(f"| Tools | {t['tools']['start']} | {t['tools']['end']} | {'+' if t['tools']['delta'] > 0 else ''}{t['tools']['delta']} | {tool_growth} |")

        lines.append("")

    # Major additions
    lines.extend(["## Major Additions", ""])

    if changes["new_skills"]:
        lines.append("### New Skills")
        lines.append("")
        for skill in changes["new_skills"]:
            lines.append(f"- **{skill}**")
        lines.append("")

    if changes["new_agents"]:
        lines.append("### New Agents")
        lines.append("")
        for agent in changes["new_agents"]:
            lines.append(f"- **{agent}**")
        lines.append("")

    # Placeholder sections
    lines.extend([
        "## Key Learnings",
        "",
        "*(To be filled in manually)*",
        "",
        "## Architecture Evolution",
        "",
        "*(To be filled in manually)*",
        "",
        "## Community Engagement",
        "",
        "*(To be filled in manually)*",
        "",
        "## Strategic Adjustments",
        "",
        "*(To be filled in manually)*",
        "",
        "## Next Month Priorities",
        "",
        "*(To be filled in manually)*",
        "",
        "---",
        "",
        f"*Generated by The Archivist on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}*"
    ])

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Generate progress reports")
    parser.add_argument(
        "--weekly", "-w",
        action="store_true",
        help="Generate weekly report"
    )
    parser.add_argument(
        "--monthly", "-m",
        action="store_true",
        help="Generate monthly report"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        help="Output file path"
    )
    args = parser.parse_args()

    if not args.weekly and not args.monthly:
        print("❌ Specify --weekly or --monthly")
        return 1

    project_root = find_project_root()
    snapshots_dir = project_root / ".claude" / "archive" / "snapshots"

    # Determine time range
    if args.weekly:
        since = datetime.now(timezone.utc) - timedelta(days=7)
        report_type = "weekly"
    else:
        since = datetime.now(timezone.utc) - timedelta(days=30)
        report_type = "monthly"

    # Load snapshots
    snapshots = load_snapshots(snapshots_dir, since)

    # Generate report
    if args.weekly:
        report = generate_weekly_report(snapshots)
    else:
        report = generate_monthly_report(snapshots)

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        reports_dir = project_root / ".claude" / "archive" / "progress-reports" / report_type
        reports_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        output_path = reports_dir / f"{timestamp}-{report_type}.md"

    # Write report
    output_path.write_text(report, encoding="utf-8")

    print(f"✅ {report_type.capitalize()} report generated: {output_path}")
    print(f"   📊 Based on {len(snapshots)} snapshot(s)")

    return 0


if __name__ == "__main__":
    exit(main())

#!/usr/bin/env python3
"""
Ecosystem Data Generator - Part of The Forge

Generates ecosystem-state.json containing:
- Agent metadata and relationships
- Skill inventory and categorization
- Tool usage statistics
- Capability graph data
- Timestamp for tracking changes

Usage:
    python scripts/generate_ecosystem_data.py [--output PATH]

Output goes to .claude/data/ecosystem-state.json by default.
"""

import json
import yaml
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional


def find_project_root() -> Path:
    """Find the project root by looking for .claude directory."""
    current = Path.cwd()
    while current != current.parent:
        if (current / ".claude").exists():
            return current
        current = current.parent
    return Path.cwd()


def parse_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
    """Parse YAML frontmatter from markdown content."""
    if not content.startswith("---"):
        return {}, content

    try:
        parts = content.split("---", 2)
        if len(parts) >= 3:
            frontmatter = yaml.safe_load(parts[1]) or {}
            body = parts[2].strip()
            return frontmatter, body
    except yaml.YAMLError:
        pass

    return {}, content


def load_agents(agents_dir: Path) -> List[Dict[str, Any]]:
    """Load all agent definitions from both flat and directory formats."""
    agents = []

    if not agents_dir.exists():
        return agents

    # Load flat format agents (*.md)
    for md_file in agents_dir.glob("*.md"):
        # Skip uppercase files like FOUNDING_COUNCIL.md
        if md_file.stem == md_file.stem.upper():
            continue

        # Skip if directory version exists
        dir_version = agents_dir / md_file.stem / "AGENT.md"
        if dir_version.exists():
            continue

        content = md_file.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(content)

        agents.append({
            "name": frontmatter.get("name", md_file.stem),
            "description": frontmatter.get("description", ""),
            "tools": parse_tools(frontmatter.get("tools")),
            "model": frontmatter.get("model"),
            "format": "flat",
            "path": str(md_file.relative_to(agents_dir.parent.parent)),
        })

    # Load directory format agents (*/AGENT.md)
    for subdir in agents_dir.iterdir():
        if not subdir.is_dir():
            continue

        agent_md = subdir / "AGENT.md"
        if not agent_md.exists():
            continue

        content = agent_md.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(content)

        agents.append({
            "name": frontmatter.get("name", subdir.name),
            "role": frontmatter.get("role"),
            "description": extract_description(body),
            "tools": parse_tools(frontmatter.get("allowed-tools")),
            "triggers": frontmatter.get("triggers", []),
            "coordinates_with": frontmatter.get("coordinates_with", []),
            "outputs": frontmatter.get("outputs", []),
            "format": "directory",
            "path": str(agent_md.relative_to(agents_dir.parent.parent)),
        })

    return sorted(agents, key=lambda a: a["name"])


def load_skills(skills_dir: Path) -> List[Dict[str, Any]]:
    """Load all skill definitions."""
    skills = []

    if not skills_dir.exists():
        return skills

    # Check each subdirectory for skill.md or SKILL.md
    for subdir in skills_dir.iterdir():
        if not subdir.is_dir():
            continue

        # Try both lowercase and uppercase
        skill_md = subdir / "skill.md"
        if not skill_md.exists():
            skill_md = subdir / "SKILL.md"
        if not skill_md.exists():
            continue

        content = skill_md.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(content)

        skills.append({
            "name": frontmatter.get("name", subdir.name),
            "description": frontmatter.get("description", ""),
            "category": frontmatter.get("category"),
            "tools": parse_tools(frontmatter.get("tools")),
            "has_references": (subdir / "references").exists(),
            "has_examples": (subdir / "examples").exists(),
            "path": str(skill_md.relative_to(skills_dir.parent.parent)),
        })

    return sorted(skills, key=lambda s: s["name"])


def parse_tools(tools: Any) -> List[str]:
    """Parse tools from various formats."""
    if not tools:
        return []
    if isinstance(tools, list):
        return tools
    if isinstance(tools, str):
        return [t.strip() for t in tools.split(",")]
    return []


def extract_description(body: str) -> str:
    """Extract first paragraph as description from markdown body."""
    lines = body.strip().split("\n")
    desc_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            if desc_lines:
                break
            continue
        if line.startswith("#"):
            continue
        desc_lines.append(line)

    return " ".join(desc_lines)[:500] if desc_lines else ""


def calculate_tool_usage(agents: List[Dict], skills: List[Dict]) -> Dict[str, int]:
    """Calculate tool usage across agents and skills."""
    usage: Dict[str, int] = {}

    for agent in agents:
        for tool in agent.get("tools", []):
            usage[tool] = usage.get(tool, 0) + 1

    for skill in skills:
        for tool in skill.get("tools", []):
            usage[tool] = usage.get(tool, 0) + 1

    return dict(sorted(usage.items(), key=lambda x: x[1], reverse=True))


def build_capability_graph(agents: List[Dict], skills: List[Dict]) -> Dict[str, Any]:
    """Build a capability graph showing relationships."""
    nodes = []
    edges = []

    # Add agent nodes
    for agent in agents:
        nodes.append({
            "id": f"agent:{agent['name']}",
            "type": "agent",
            "label": agent["name"],
            "role": agent.get("role"),
        })

        # Add coordination edges
        for other in agent.get("coordinates_with", []):
            edges.append({
                "from": f"agent:{agent['name']}",
                "to": f"agent:{other}",
                "type": "coordinates_with",
            })

    # Add skill nodes
    for skill in skills:
        nodes.append({
            "id": f"skill:{skill['name']}",
            "type": "skill",
            "label": skill["name"],
            "category": skill.get("category"),
        })

    return {"nodes": nodes, "edges": edges}


def generate_ecosystem_state(project_root: Path) -> Dict[str, Any]:
    """Generate the complete ecosystem state."""
    claude_dir = project_root / ".claude"
    agents_dir = claude_dir / "agents"
    skills_dir = claude_dir / "skills"

    agents = load_agents(agents_dir)
    skills = load_skills(skills_dir)

    # Calculate statistics
    agents_by_format = {
        "flat": len([a for a in agents if a["format"] == "flat"]),
        "directory": len([a for a in agents if a["format"] == "directory"]),
    }

    skill_categories: Dict[str, int] = {}
    for skill in skills:
        cat = skill.get("category") or "uncategorized"
        skill_categories[cat] = skill_categories.get(cat, 0) + 1

    tool_usage = calculate_tool_usage(agents, skills)
    capability_graph = build_capability_graph(agents, skills)

    return {
        "version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "project_root": str(project_root),
        "summary": {
            "total_agents": len(agents),
            "total_skills": len(skills),
            "agents_by_format": agents_by_format,
            "skill_categories": skill_categories,
            "unique_tools": len(tool_usage),
        },
        "agents": agents,
        "skills": skills,
        "tool_usage": tool_usage,
        "capability_graph": capability_graph,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate ecosystem state data")
    parser.add_argument(
        "--output", "-o",
        type=Path,
        help="Output file path (default: .claude/data/ecosystem-state.json)"
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        default=True,
        help="Pretty print JSON output (default: True)"
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="Compact JSON output"
    )
    args = parser.parse_args()

    project_root = find_project_root()

    # Default output path
    if args.output:
        output_path = args.output
    else:
        data_dir = project_root / ".claude" / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        output_path = data_dir / "ecosystem-state.json"

    # Generate state
    state = generate_ecosystem_state(project_root)

    # Write output
    indent = None if args.compact else 2
    output_path.write_text(
        json.dumps(state, indent=indent, ensure_ascii=False),
        encoding="utf-8"
    )

    # Print summary
    summary = state["summary"]
    print(f"✅ Ecosystem state generated: {output_path}")
    print(f"   📊 {summary['total_agents']} agents, {summary['total_skills']} skills")
    print(f"   🔧 {summary['unique_tools']} unique tools in use")
    print(f"   📁 {summary['agents_by_format']['flat']} flat, {summary['agents_by_format']['directory']} directory format")


if __name__ == "__main__":
    main()

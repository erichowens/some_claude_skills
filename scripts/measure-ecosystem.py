#!/usr/bin/env python3
"""
Ecosystem Growth Metrics Collector

Measures the health and growth of the Claude Skills ecosystem.
Run periodically to track progress over time.

Usage:
    python scripts/measure-ecosystem.py
    python scripts/measure-ecosystem.py --output metrics/YYYY-MM-DD.json
"""

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

@dataclass
class SkillMetrics:
    """Metrics for a single skill"""
    name: str
    has_skill_md: bool
    has_changelog: bool
    reference_count: int
    script_count: int
    total_lines: int
    has_examples: bool
    categories: List[str]

@dataclass
class EcosystemMetrics:
    """Overall ecosystem metrics"""
    timestamp: str
    version: str

    # Breadth metrics
    total_skills: int
    total_agents: int
    total_references: int
    total_scripts: int

    # Depth metrics
    total_guidance_lines: int
    avg_references_per_skill: float
    avg_lines_per_skill: float

    # Quality metrics
    skills_with_examples: int
    skills_with_changelog: int
    skills_with_scripts: int

    # Category breakdown
    categories: Dict[str, int]

    # Individual skill data
    skills: List[SkillMetrics]


def count_lines(filepath: Path) -> int:
    """Count non-empty, non-comment lines in a file"""
    try:
        content = filepath.read_text(encoding='utf-8', errors='ignore')
        lines = [l for l in content.split('\n')
                 if l.strip() and not l.strip().startswith('#')]
        return len(lines)
    except Exception:
        return 0


def extract_categories(skill_md: Path) -> List[str]:
    """Extract categories from SKILL.md description"""
    try:
        content = skill_md.read_text()
        # Look for category hints in description
        categories = []

        category_patterns = {
            'security': r'security|vulnerability|owasp|audit|cve',
            'testing': r'test|tdd|coverage|jest|pytest|playwright',
            'infrastructure': r'deploy|ci\/cd|docker|kubernetes|devops',
            'design': r'design|ui|ux|css|component|visual',
            'ml-ai': r'machine learning|ml|ai|model|embedding|clip|neural',
            'career': r'career|resume|cv|portfolio|job',
            'audio-video': r'audio|video|sound|music|voice|media',
            'documentation': r'document|docs|readme|technical writing',
            'backend': r'api|backend|database|server|rest|graphql',
            'frontend': r'react|vue|frontend|browser|dom|css',
        }

        for category, pattern in category_patterns.items():
            if re.search(pattern, content, re.IGNORECASE):
                categories.append(category)

        return categories if categories else ['uncategorized']
    except Exception:
        return ['unknown']


def analyze_skill(skill_dir: Path) -> Optional[SkillMetrics]:
    """Analyze a single skill directory"""
    skill_md = skill_dir / 'SKILL.md'
    if not skill_md.exists():
        return None

    # Count reference files
    refs_dir = skill_dir / 'references'
    reference_count = len(list(refs_dir.glob('*.md'))) if refs_dir.exists() else 0

    # Count scripts
    scripts_dir = skill_dir / 'scripts'
    script_count = len(list(scripts_dir.glob('*'))) if scripts_dir.exists() else 0

    # Count total lines
    total_lines = count_lines(skill_md)
    if refs_dir.exists():
        for ref in refs_dir.glob('*.md'):
            total_lines += count_lines(ref)

    # Check for examples in SKILL.md
    content = skill_md.read_text()
    has_examples = '```' in content  # Code blocks indicate examples

    return SkillMetrics(
        name=skill_dir.name,
        has_skill_md=True,
        has_changelog=(skill_dir / 'CHANGELOG.md').exists(),
        reference_count=reference_count,
        script_count=script_count,
        total_lines=total_lines,
        has_examples=has_examples,
        categories=extract_categories(skill_md)
    )


def count_agents(base_dir: Path) -> int:
    """Count custom agents defined"""
    agents_dir = base_dir / '.claude' / 'agents'
    if not agents_dir.exists():
        return 0
    return len([f for f in agents_dir.glob('*.md') if f.is_file()])


def collect_metrics(base_dir: Path) -> EcosystemMetrics:
    """Collect all ecosystem metrics"""
    skills_dir = base_dir / '.claude' / 'skills'

    skills: List[SkillMetrics] = []
    categories: Dict[str, int] = {}

    if skills_dir.exists():
        for skill_dir in skills_dir.iterdir():
            if skill_dir.is_dir():
                skill = analyze_skill(skill_dir)
                if skill:
                    skills.append(skill)
                    for cat in skill.categories:
                        categories[cat] = categories.get(cat, 0) + 1

    total_skills = len(skills)
    total_agents = count_agents(base_dir)
    total_references = sum(s.reference_count for s in skills)
    total_scripts = sum(s.script_count for s in skills)
    total_lines = sum(s.total_lines for s in skills)

    return EcosystemMetrics(
        timestamp=datetime.now(timezone.utc).isoformat(),
        version='1.0.0',

        total_skills=total_skills,
        total_agents=total_agents,
        total_references=total_references,
        total_scripts=total_scripts,

        total_guidance_lines=total_lines,
        avg_references_per_skill=round(total_references / total_skills, 2) if total_skills else 0,
        avg_lines_per_skill=round(total_lines / total_skills, 2) if total_skills else 0,

        skills_with_examples=sum(1 for s in skills if s.has_examples),
        skills_with_changelog=sum(1 for s in skills if s.has_changelog),
        skills_with_scripts=sum(1 for s in skills if s.script_count > 0),

        categories=dict(sorted(categories.items(), key=lambda x: -x[1])),
        skills=[asdict(s) for s in sorted(skills, key=lambda x: -x.total_lines)]
    )


def print_summary(metrics: EcosystemMetrics) -> None:
    """Print human-readable summary"""
    print("\n" + "=" * 60)
    print("CLAUDE SKILLS ECOSYSTEM METRICS")
    print("=" * 60)
    print(f"Timestamp: {metrics.timestamp}")
    print()

    print("📊 BREADTH")
    print(f"  Total Skills:     {metrics.total_skills}")
    print(f"  Total Agents:     {metrics.total_agents}")
    print(f"  Reference Files:  {metrics.total_references}")
    print(f"  Scripts:          {metrics.total_scripts}")
    print()

    print("📏 DEPTH")
    print(f"  Total Guidance Lines:    {metrics.total_guidance_lines:,}")
    print(f"  Avg References/Skill:    {metrics.avg_references_per_skill}")
    print(f"  Avg Lines/Skill:         {metrics.avg_lines_per_skill}")
    print()

    print("✅ QUALITY")
    print(f"  Skills with Examples:    {metrics.skills_with_examples}/{metrics.total_skills}")
    print(f"  Skills with Changelog:   {metrics.skills_with_changelog}/{metrics.total_skills}")
    print(f"  Skills with Scripts:     {metrics.skills_with_scripts}/{metrics.total_skills}")
    print()

    print("🏷️  CATEGORIES")
    for cat, count in metrics.categories.items():
        print(f"  {cat}: {count}")
    print()

    print("🏆 TOP 5 SKILLS BY DEPTH")
    for skill in metrics.skills[:5]:
        print(f"  {skill['name']}: {skill['total_lines']} lines, {skill['reference_count']} refs")

    print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(description='Collect ecosystem metrics')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--json', action='store_true', help='Output JSON only')
    parser.add_argument('--dir', default='.', help='Base directory to analyze')
    args = parser.parse_args()

    base_dir = Path(args.dir).resolve()
    metrics = collect_metrics(base_dir)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(asdict(metrics), indent=2))
        print(f"Metrics saved to: {output_path}")

    if args.json:
        print(json.dumps(asdict(metrics), indent=2))
    else:
        print_summary(metrics)

    # Always save to metrics directory with date
    metrics_dir = base_dir / 'metrics'
    metrics_dir.mkdir(exist_ok=True)
    dated_file = metrics_dir / f"{datetime.now().strftime('%Y-%m-%d')}.json"
    dated_file.write_text(json.dumps(asdict(metrics), indent=2))

    return 0


if __name__ == '__main__':
    sys.exit(main())

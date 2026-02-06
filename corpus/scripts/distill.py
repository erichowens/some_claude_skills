#!/usr/bin/env python3
"""
Corpus Distillation Pipeline

Three-pass hierarchical extraction of expert knowledge from books:
  Pass 1: Haiku army (parallel) — chunk extraction
  Pass 2: Sonnet synthesis — merge + structure
  Pass 3: Opus refinement (optional) — skill draft

Usage:
  python distill.py <input-file> [--output-mode summary|knowledge-map|skill-draft]
  python distill.py corpus/books/  # Process all files in directory

Supports: PDF, DOCX, Markdown, plain text
Requires: pip install anthropic pymupdf python-docx

Cost estimate: ~$0.19 per 300-page book
"""

import sys
import os
import json
import asyncio
import argparse
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional

# ============================================================================
# Text Extraction
# ============================================================================

def extract_text_from_pdf(path: str) -> str:
    """Extract text from PDF using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("Install PyMuPDF: pip install pymupdf")
        sys.exit(1)
    
    doc = fitz.open(path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n\n"
    doc.close()
    return text


def extract_text_from_docx(path: str) -> str:
    """Extract text from DOCX."""
    try:
        from docx import Document
    except ImportError:
        print("Install python-docx: pip install python-docx")
        sys.exit(1)
    
    doc = Document(path)
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(path: str) -> str:
    """Extract text from any supported format."""
    ext = Path(path).suffix.lower()
    if ext == '.pdf':
        return extract_text_from_pdf(path)
    elif ext == '.docx':
        return extract_text_from_docx(path)
    elif ext in ('.md', '.txt', '.text'):
        return Path(path).read_text(encoding='utf-8', errors='replace')
    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported: .pdf, .docx, .md, .txt")


# ============================================================================
# Chunking
# ============================================================================

def count_tokens_approx(text: str) -> int:
    """Approximate token count (1 token ≈ 4 chars for English)."""
    return len(text) // 4


def semantic_chunk(text: str, max_tokens: int = 4000, overlap_tokens: int = 500) -> list[dict]:
    """Split text into overlapping chunks on paragraph boundaries."""
    max_chars = max_tokens * 4
    overlap_chars = overlap_tokens * 4
    
    paragraphs = text.split('\n\n')
    chunks = []
    current = ""
    chunk_id = 0
    
    for para in paragraphs:
        if count_tokens_approx(current + para) > max_tokens and current:
            chunks.append({
                "id": chunk_id,
                "text": current.strip(),
                "tokens": count_tokens_approx(current),
            })
            chunk_id += 1
            # Overlap: keep the tail of the previous chunk
            current = current[-overlap_chars:] + "\n\n" + para
        else:
            current += "\n\n" + para if current else para
    
    if current.strip():
        chunks.append({
            "id": chunk_id,
            "text": current.strip(),
            "tokens": count_tokens_approx(current),
        })
    
    return chunks


# ============================================================================
# Pass 1: Haiku Extraction (Parallel)
# ============================================================================

EXTRACTION_PROMPT = """You are extracting structured knowledge from a book chunk for a knowledge engineering pipeline.

Analyze this text and extract the following. Return ONLY valid JSON, no markdown fences.

{
  "summary": "2-3 sentence summary of this section",
  "key_claims": ["list of factual claims or assertions"],
  "processes": ["any step-by-step procedures described"],
  "decisions": ["any decision points or heuristics mentioned"],
  "failures": ["any failures, mistakes, or anti-patterns described"],
  "aha_moments": ["any insights, realizations, or conceptual breakthroughs"],
  "metaphors": ["any metaphors or mental models used"],
  "temporal": ["any 'things changed when...' or 'before X, after Y' patterns"],
  "quotes": ["notable direct quotes worth preserving (max 3)"],
  "domain_terms": ["domain-specific vocabulary or jargon"]
}

If a category has no relevant content, use an empty array [].

TEXT TO ANALYZE:
"""


async def extract_chunk(client, chunk: dict, semaphore: asyncio.Semaphore) -> dict:
    """Extract knowledge from a single chunk using Haiku."""
    async with semaphore:
        try:
            response = await client.messages.create(
                model="claude-haiku-4-20250514",
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": EXTRACTION_PROMPT + chunk["text"][:16000]  # Safety limit
                }]
            )
            
            text = response.content[0].text.strip()
            # Try to parse as JSON
            if text.startswith('{'):
                extraction = json.loads(text)
            else:
                # Sometimes model wraps in markdown
                start = text.find('{')
                end = text.rfind('}') + 1
                if start >= 0 and end > start:
                    extraction = json.loads(text[start:end])
                else:
                    extraction = {"summary": text, "parse_error": True}
            
            return {
                "chunk_id": chunk["id"],
                "extraction": extraction,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            }
        except Exception as e:
            return {
                "chunk_id": chunk["id"],
                "extraction": {"error": str(e)},
                "input_tokens": 0,
                "output_tokens": 0,
            }


async def pass1_extract(client, chunks: list[dict], max_concurrent: int = 10) -> list[dict]:
    """Pass 1: Parallel Haiku extraction across all chunks."""
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [extract_chunk(client, chunk, semaphore) for chunk in chunks]
    results = await asyncio.gather(*tasks)
    return sorted(results, key=lambda r: r["chunk_id"])


# ============================================================================
# Pass 2: Sonnet Synthesis
# ============================================================================

SYNTHESIS_PROMPT = """You are synthesizing extracted knowledge from multiple book chunks into a structured knowledge map.

You will receive chunk-level extractions from a book. Merge, deduplicate, and organize them into this structure. Return ONLY valid JSON.

{
  "document_summary": "1-2 paragraph executive summary of the entire book's key contributions",
  
  "core_concepts": [
    {"concept": "name", "definition": "what it means", "relationships": ["connects to X because..."]}
  ],
  
  "processes": [
    {"name": "process name", "steps": ["ordered steps"], "decision_points": ["choices"], "common_mistakes": ["what goes wrong"]}
  ],
  
  "expertise_patterns": [
    {"pattern": "what experts do differently", "novice_mistake": "what novices do", "aha_moment": "the bridging insight"}
  ],
  
  "temporal_evolution": [
    {"period": "date range", "paradigm": "what was believed", "change_trigger": "what caused shift"}
  ],
  
  "key_metaphors": [
    {"metaphor": "how practitioners think about X", "maps_to": "the underlying structure"}
  ],
  
  "anti_patterns": [
    {"name": "anti-pattern name", "description": "what it looks like", "why_wrong": "fundamental reason", "fix": "correct approach"}
  ],
  
  "notable_quotes": ["direct quotes worth preserving"],
  
  "domain_vocabulary": [
    {"term": "word", "definition": "what it means in this domain"}
  ]
}

CHUNK EXTRACTIONS:
"""


async def pass2_synthesize(client, extractions: list[dict]) -> dict:
    """Pass 2: Sonnet merges all extractions into a knowledge map."""
    # Prepare extraction summaries for Sonnet
    extraction_text = json.dumps(
        [e["extraction"] for e in extractions if "error" not in e.get("extraction", {})],
        indent=1
    )
    
    # If too long, truncate (Sonnet has 200K context but let's be reasonable)
    if len(extraction_text) > 150000:
        extraction_text = extraction_text[:150000] + "\n... (truncated)"
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        messages=[{
            "role": "user",
            "content": SYNTHESIS_PROMPT + extraction_text
        }]
    )
    
    text = response.content[0].text.strip()
    try:
        start = text.find('{')
        end = text.rfind('}') + 1
        knowledge_map = json.loads(text[start:end])
    except (json.JSONDecodeError, ValueError):
        knowledge_map = {"raw_synthesis": text, "parse_error": True}
    
    return {
        "knowledge_map": knowledge_map,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }


# ============================================================================
# Pass 3: Opus Skill Draft (Optional)
# ============================================================================

SKILL_DRAFT_PROMPT = """You are skill-architect. Using this knowledge map extracted from a professional book, create a SKILL.md following the standard template.

The skill should encode the book's expertise as:
- Decision trees in the Core Process (not prose)
- Anti-patterns with Novice/Expert/Timeline template  
- Temporal knowledge with dates
- Mental models and metaphors as shibboleths

Follow this template:
---
name: [lowercase-hyphenated from book topic]
description: [What] [When] [Keywords]. NOT for [Exclusions].
allowed-tools: Read
---

# [Skill Name]
[One sentence purpose derived from the book]

## When to Use
✅ Use for: [domains from the knowledge map]
❌ NOT for: [adjacent domains this doesn't cover]

## Core Process
[Decision trees from the book's processes]

## Anti-Patterns
[From the knowledge map's anti_patterns and expertise_patterns]

## References
- Source: [Book title and author]

KNOWLEDGE MAP:
"""


async def pass3_skill_draft(client, knowledge_map: dict) -> str:
    """Pass 3: Opus creates a SKILL.md from the knowledge map."""
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",  # Using Sonnet for cost; upgrade to Opus for quality
        max_tokens=8000,
        messages=[{
            "role": "user",
            "content": SKILL_DRAFT_PROMPT + json.dumps(knowledge_map, indent=2)
        }]
    )
    return response.content[0].text


# ============================================================================
# Main Pipeline
# ============================================================================

async def distill_file(
    filepath: str,
    output_dir: str,
    output_mode: str = "knowledge-map",
    max_concurrent: int = 10,
) -> dict:
    """Run the full distillation pipeline on a single file."""
    try:
        import anthropic
    except ImportError:
        print("Install anthropic SDK: pip install anthropic")
        sys.exit(1)
    
    client = anthropic.AsyncAnthropic()
    filename = Path(filepath).stem
    
    print(f"\n{'='*60}")
    print(f"Distilling: {filepath}")
    print(f"Output mode: {output_mode}")
    print(f"{'='*60}")
    
    # Extract text
    print(f"\n📖 Extracting text...")
    text = extract_text(filepath)
    total_tokens = count_tokens_approx(text)
    print(f"   {total_tokens:,} tokens ({total_tokens // 500} pages approx)")
    
    # Chunk
    print(f"\n✂️  Chunking...")
    chunks = semantic_chunk(text)
    print(f"   {len(chunks)} chunks")
    
    # Pass 1: Haiku extraction
    print(f"\n🐝 Pass 1: Haiku army ({len(chunks)} parallel extractions)...")
    extractions = await pass1_extract(client, chunks, max_concurrent)
    p1_input = sum(e["input_tokens"] for e in extractions)
    p1_output = sum(e["output_tokens"] for e in extractions)
    p1_cost = (p1_input * 0.80 + p1_output * 4.00) / 1_000_000
    errors = sum(1 for e in extractions if "error" in e.get("extraction", {}))
    print(f"   Done. {len(extractions) - errors} succeeded, {errors} errors")
    print(f"   Cost: ${p1_cost:.4f} ({p1_input:,} in + {p1_output:,} out)")
    
    # Save Pass 1 output
    p1_path = os.path.join(output_dir, f"{filename}_pass1_extractions.json")
    with open(p1_path, 'w') as f:
        json.dump(extractions, f, indent=2)
    print(f"   Saved: {p1_path}")
    
    if output_mode == "summary":
        # Just return the concatenated summaries
        summaries = [e["extraction"].get("summary", "") for e in extractions if "error" not in e.get("extraction", {})]
        result = {"summaries": summaries, "pass1_cost": p1_cost}
        result_path = os.path.join(output_dir, f"{filename}_summary.json")
        with open(result_path, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n✅ Summary saved: {result_path}")
        print(f"   Total cost: ${p1_cost:.4f}")
        return result
    
    # Pass 2: Sonnet synthesis
    print(f"\n🧠 Pass 2: Sonnet synthesis...")
    synthesis = await pass2_synthesize(client, extractions)
    p2_cost = (synthesis["input_tokens"] * 3.00 + synthesis["output_tokens"] * 15.00) / 1_000_000
    print(f"   Cost: ${p2_cost:.4f}")
    
    # Save Pass 2 output
    p2_path = os.path.join(output_dir, f"{filename}_knowledge_map.json")
    with open(p2_path, 'w') as f:
        json.dump(synthesis["knowledge_map"], f, indent=2)
    print(f"   Saved: {p2_path}")
    
    if output_mode == "knowledge-map":
        total_cost = p1_cost + p2_cost
        print(f"\n✅ Knowledge map saved: {p2_path}")
        print(f"   Total cost: ${total_cost:.4f}")
        return {"knowledge_map": synthesis["knowledge_map"], "total_cost": total_cost}
    
    # Pass 3: Skill draft
    print(f"\n📝 Pass 3: Skill draft generation...")
    skill_md = await pass3_skill_draft(client, synthesis["knowledge_map"])
    
    # Save skill draft
    p3_path = os.path.join(output_dir, f"{filename}_SKILL.md")
    with open(p3_path, 'w') as f:
        f.write(skill_md)
    
    total_cost = p1_cost + p2_cost + 0.05  # Approximate Pass 3 cost
    print(f"\n✅ Skill draft saved: {p3_path}")
    print(f"   Total cost: ${total_cost:.4f}")
    
    return {"skill_draft": skill_md, "knowledge_map": synthesis["knowledge_map"], "total_cost": total_cost}


async def main():
    parser = argparse.ArgumentParser(description="Corpus Distillation Pipeline")
    parser.add_argument("input", help="File path or directory of files to distill")
    parser.add_argument("--output-mode", choices=["summary", "knowledge-map", "skill-draft"],
                        default="knowledge-map", help="Output mode (default: knowledge-map)")
    parser.add_argument("--output-dir", default="corpus/output", help="Output directory")
    parser.add_argument("--max-concurrent", type=int, default=10,
                        help="Max concurrent Haiku calls (default: 10)")
    
    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    
    input_path = Path(args.input)
    
    if input_path.is_dir():
        # Process all supported files in directory
        files = sorted([
            str(f) for f in input_path.iterdir()
            if f.suffix.lower() in ('.pdf', '.docx', '.md', '.txt')
        ])
        print(f"Found {len(files)} files to process")
        for filepath in files:
            try:
                await distill_file(filepath, args.output_dir, args.output_mode, args.max_concurrent)
            except Exception as e:
                print(f"\n❌ Error processing {filepath}: {e}")
    elif input_path.is_file():
        await distill_file(str(input_path), args.output_dir, args.output_mode, args.max_concurrent)
    else:
        print(f"Not found: {args.input}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
Build Embeddings Pipeline for Claude Skills Ecosystem
======================================================

This script reads all SKILL.md and AGENT.md files, parses their YAML frontmatter
and markdown content, chunks appropriately, generates embeddings using
sentence-transformers (local, free), and stores in ChromaDB (local vector store).

Usage:
    python scripts/build_embeddings.py
    python scripts/build_embeddings.py --skills-dir .claude/skills --agents-dir .claude/agents
    python scripts/build_embeddings.py --rebuild  # Force rebuild from scratch
"""

import os
import sys
import json
import hashlib
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

import click
import frontmatter
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

# Constants
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384
CHROMA_COLLECTION_NAME = "claude_ecosystem"
DEFAULT_CHROMA_PATH = ".chroma_db"


@dataclass
class DocumentChunk:
    """A chunk of content from a skill or agent file."""
    id: str
    content: str
    metadata: Dict[str, Any]
    source_file: str
    chunk_type: str  # 'frontmatter', 'section', 'full'
    section_title: Optional[str] = None


@dataclass
class ParsedDocument:
    """A parsed SKILL.md or AGENT.md file."""
    path: str
    doc_type: str  # 'skill' or 'agent'
    name: str
    frontmatter: Dict[str, Any]
    content: str
    sections: List[Tuple[str, str]] = field(default_factory=list)  # (title, content)


def compute_file_hash(file_path: Path) -> str:
    """Compute MD5 hash of file for change detection."""
    with open(file_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def parse_markdown_sections(content: str) -> List[Tuple[str, str]]:
    """
    Parse markdown content into sections based on headers.
    Returns list of (section_title, section_content) tuples.
    """
    sections = []
    lines = content.split('\n')
    current_title = "Introduction"
    current_content = []

    for line in lines:
        # Match headers (## or ###)
        header_match = re.match(r'^(#{1,3})\s+(.+)$', line)
        if header_match:
            # Save previous section if it has content
            if current_content:
                section_text = '\n'.join(current_content).strip()
                if section_text:
                    sections.append((current_title, section_text))

            current_title = header_match.group(2).strip()
            current_content = []
        else:
            current_content.append(line)

    # Save final section
    if current_content:
        section_text = '\n'.join(current_content).strip()
        if section_text:
            sections.append((current_title, section_text))

    return sections


def parse_document(file_path: Path, doc_type: str) -> Optional[ParsedDocument]:
    """
    Parse a SKILL.md or AGENT.md file.
    Extracts YAML frontmatter and markdown content.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            doc = frontmatter.load(f)

        name = doc.metadata.get('name', file_path.parent.name)
        sections = parse_markdown_sections(doc.content)

        return ParsedDocument(
            path=str(file_path),
            doc_type=doc_type,
            name=name,
            frontmatter=dict(doc.metadata),
            content=doc.content,
            sections=sections
        )
    except Exception as e:
        console.print(f"[red]Error parsing {file_path}: {e}[/red]")
        return None


def create_chunks(doc: ParsedDocument) -> List[DocumentChunk]:
    """
    Create semantic chunks from a parsed document.

    Strategy:
    1. Create a summary chunk from frontmatter (name, description, tools)
    2. Create section-level chunks for meaningful content blocks
    3. Preserve context in metadata for retrieval
    """
    chunks = []
    base_id = f"{doc.doc_type}-{doc.name}"

    # Extract common metadata
    base_metadata = {
        "type": doc.doc_type,
        "name": doc.name,
        "source_file": doc.path,
    }

    # Add frontmatter fields to metadata
    if 'description' in doc.frontmatter:
        base_metadata['description'] = doc.frontmatter['description']
    if 'allowed-tools' in doc.frontmatter:
        base_metadata['tools'] = doc.frontmatter['allowed-tools']
    if 'role' in doc.frontmatter:
        base_metadata['role'] = doc.frontmatter['role']
    if 'triggers' in doc.frontmatter:
        base_metadata['triggers'] = json.dumps(doc.frontmatter['triggers'])
    if 'coordinates_with' in doc.frontmatter:
        base_metadata['coordinates_with'] = json.dumps(doc.frontmatter['coordinates_with'])
    if 'outputs' in doc.frontmatter:
        base_metadata['outputs'] = json.dumps(doc.frontmatter['outputs'])

    # Chunk 1: Summary/Overview chunk
    # Combine frontmatter info into a searchable summary
    summary_parts = [f"# {doc.name}"]
    if 'role' in doc.frontmatter:
        summary_parts.append(f"Role: {doc.frontmatter['role']}")
    if 'description' in doc.frontmatter:
        summary_parts.append(f"Description: {doc.frontmatter['description']}")
    if 'triggers' in doc.frontmatter:
        summary_parts.append(f"Triggers: {', '.join(doc.frontmatter['triggers'])}")
    if 'allowed-tools' in doc.frontmatter:
        summary_parts.append(f"Tools: {doc.frontmatter['allowed-tools']}")

    summary_content = '\n'.join(summary_parts)
    chunks.append(DocumentChunk(
        id=f"{base_id}-summary",
        content=summary_content,
        metadata={**base_metadata, "chunk_type": "summary"},
        source_file=doc.path,
        chunk_type="summary"
    ))

    # Chunk 2+: Section-level chunks
    for i, (title, content) in enumerate(doc.sections):
        # Skip very short sections (less than 50 chars)
        if len(content) < 50:
            continue

        # Create section chunk
        section_content = f"## {title}\n\n{content}"
        chunk_metadata = {
            **base_metadata,
            "chunk_type": "section",
            "section_title": title,
            "section_index": i
        }

        chunks.append(DocumentChunk(
            id=f"{base_id}-section-{i}",
            content=section_content,
            metadata=chunk_metadata,
            source_file=doc.path,
            chunk_type="section",
            section_title=title
        ))

    # If document is small enough, also create a full-document chunk
    if len(doc.content) < 4000:  # Keep full doc if under ~1000 tokens
        chunks.append(DocumentChunk(
            id=f"{base_id}-full",
            content=doc.content,
            metadata={**base_metadata, "chunk_type": "full"},
            source_file=doc.path,
            chunk_type="full"
        ))

    return chunks


def find_documents(
    skills_dir: Path,
    agents_dir: Path
) -> Tuple[List[Path], List[Path]]:
    """Find all SKILL.md and AGENT.md files."""
    skill_files = list(skills_dir.glob("*/SKILL.md"))
    agent_files = list(agents_dir.glob("*/AGENT.md"))
    return skill_files, agent_files


def build_embeddings(
    skills_dir: str = ".claude/skills",
    agents_dir: str = ".claude/agents",
    chroma_path: str = DEFAULT_CHROMA_PATH,
    rebuild: bool = False
) -> Dict[str, Any]:
    """
    Main function to build embeddings for all skills and agents.

    Args:
        skills_dir: Path to skills directory
        agents_dir: Path to agents directory
        chroma_path: Path for ChromaDB persistence
        rebuild: If True, delete existing collection and rebuild

    Returns:
        Statistics about the build process
    """
    console.print(Panel.fit(
        "[bold blue]Building RAG Embeddings for Claude Ecosystem[/bold blue]\n"
        f"Skills: {skills_dir}\n"
        f"Agents: {agents_dir}\n"
        f"ChromaDB: {chroma_path}",
        title="RAG Pipeline"
    ))

    # Find base directory
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent

    skills_path = base_dir / skills_dir
    agents_path = base_dir / agents_dir
    chroma_full_path = base_dir / chroma_path

    # Validate directories exist
    if not skills_path.exists():
        console.print(f"[red]Skills directory not found: {skills_path}[/red]")
        sys.exit(1)
    if not agents_path.exists():
        console.print(f"[red]Agents directory not found: {agents_path}[/red]")
        sys.exit(1)

    # Initialize ChromaDB
    console.print("\n[bold]Initializing ChromaDB...[/bold]")
    chroma_full_path.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(
        path=str(chroma_full_path),
        settings=Settings(anonymized_telemetry=False)
    )

    # Handle rebuild
    if rebuild:
        console.print("[yellow]Rebuild requested - deleting existing collection[/yellow]")
        try:
            client.delete_collection(CHROMA_COLLECTION_NAME)
        except Exception:
            pass  # Collection doesn't exist or other error

    # Get or create collection
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata={
            "description": "Claude Skills and Agents Ecosystem",
            "embedding_model": EMBEDDING_MODEL,
            "embedding_dim": str(EMBEDDING_DIM)
        }
    )

    # Load existing document hashes to detect changes
    existing_ids = set()
    try:
        existing = collection.get()
        existing_ids = set(existing['ids']) if existing['ids'] else set()
    except Exception:
        pass

    # Load embedding model
    console.print(f"\n[bold]Loading embedding model: {EMBEDDING_MODEL}[/bold]")
    model = SentenceTransformer(EMBEDDING_MODEL)

    # Find all documents
    console.print("\n[bold]Scanning for documents...[/bold]")
    skill_files, agent_files = find_documents(skills_path, agents_path)
    console.print(f"  Found {len(skill_files)} skills and {len(agent_files)} agents")

    # Parse all documents
    console.print("\n[bold]Parsing documents...[/bold]")
    all_docs = []

    for file_path in tqdm(skill_files, desc="Parsing skills"):
        doc = parse_document(file_path, "skill")
        if doc:
            all_docs.append(doc)

    for file_path in tqdm(agent_files, desc="Parsing agents"):
        doc = parse_document(file_path, "agent")
        if doc:
            all_docs.append(doc)

    console.print(f"  Successfully parsed {len(all_docs)} documents")

    # Create chunks
    console.print("\n[bold]Creating semantic chunks...[/bold]")
    all_chunks = []
    for doc in all_docs:
        chunks = create_chunks(doc)
        all_chunks.extend(chunks)

    console.print(f"  Created {len(all_chunks)} chunks")

    # Filter to only new/changed chunks
    new_chunks = [c for c in all_chunks if c.id not in existing_ids]
    console.print(f"  {len(new_chunks)} new chunks to embed")

    if not new_chunks and not rebuild:
        console.print("\n[green]No new content to embed. Database is up to date.[/green]")
        return {
            "total_docs": len(all_docs),
            "total_chunks": len(all_chunks),
            "new_chunks": 0,
            "skills": len(skill_files),
            "agents": len(agent_files)
        }

    # Generate embeddings
    console.print("\n[bold]Generating embeddings...[/bold]")
    chunks_to_process = new_chunks if not rebuild else all_chunks

    contents = [c.content for c in chunks_to_process]
    embeddings = model.encode(
        contents,
        show_progress_bar=True,
        convert_to_numpy=True
    )

    # Prepare data for ChromaDB
    ids = [c.id for c in chunks_to_process]
    documents = contents
    metadatas = []

    for chunk in chunks_to_process:
        # Clean metadata - ChromaDB only accepts str, int, float, bool
        clean_meta = {}
        for k, v in chunk.metadata.items():
            if isinstance(v, (str, int, float, bool)):
                clean_meta[k] = v
            elif isinstance(v, list):
                clean_meta[k] = json.dumps(v)
            elif v is not None:
                clean_meta[k] = str(v)
        metadatas.append(clean_meta)

    # Upsert to ChromaDB
    console.print("\n[bold]Storing in ChromaDB...[/bold]")

    # ChromaDB has batch size limits, process in chunks
    batch_size = 100
    for i in tqdm(range(0, len(ids), batch_size), desc="Upserting"):
        batch_end = min(i + batch_size, len(ids))
        collection.upsert(
            ids=ids[i:batch_end],
            documents=documents[i:batch_end],
            embeddings=embeddings[i:batch_end].tolist(),
            metadatas=metadatas[i:batch_end]
        )

    # Print summary
    stats = {
        "total_docs": len(all_docs),
        "total_chunks": len(all_chunks),
        "new_chunks": len(chunks_to_process),
        "skills": len(skill_files),
        "agents": len(agent_files),
        "chroma_path": str(chroma_full_path)
    }

    # Display results
    table = Table(title="Embedding Build Complete")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Skills Processed", str(stats['skills']))
    table.add_row("Agents Processed", str(stats['agents']))
    table.add_row("Total Documents", str(stats['total_docs']))
    table.add_row("Total Chunks", str(stats['total_chunks']))
    table.add_row("New/Updated Chunks", str(stats['new_chunks']))
    table.add_row("ChromaDB Path", stats['chroma_path'])

    console.print("\n")
    console.print(table)

    # Verify
    console.print("\n[bold]Verification:[/bold]")
    count = collection.count()
    console.print(f"  Total documents in collection: {count}")

    return stats


@click.command()
@click.option(
    '--skills-dir',
    default='.claude/skills',
    help='Path to skills directory (relative to project root)'
)
@click.option(
    '--agents-dir',
    default='.claude/agents',
    help='Path to agents directory (relative to project root)'
)
@click.option(
    '--chroma-path',
    default=DEFAULT_CHROMA_PATH,
    help='Path for ChromaDB persistence'
)
@click.option(
    '--rebuild',
    is_flag=True,
    help='Force rebuild from scratch (delete existing collection)'
)
def main(skills_dir: str, agents_dir: str, chroma_path: str, rebuild: bool):
    """
    Build embeddings for the Claude Skills Ecosystem.

    Reads all SKILL.md and AGENT.md files, creates semantic chunks,
    generates embeddings with sentence-transformers, and stores in ChromaDB.
    """
    try:
        build_embeddings(
            skills_dir=skills_dir,
            agents_dir=agents_dir,
            chroma_path=chroma_path,
            rebuild=rebuild
        )
    except KeyboardInterrupt:
        console.print("\n[yellow]Build interrupted by user[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Build failed: {e}[/red]")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

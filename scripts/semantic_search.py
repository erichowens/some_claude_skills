#!/usr/bin/env python3
"""
Semantic Search CLI for Claude Skills Ecosystem
================================================

Search across skills and agents using semantic similarity.
Uses embeddings stored in ChromaDB by build_embeddings.py.

Usage:
    python scripts/semantic_search.py "how to design agents"
    python scripts/semantic_search.py "photo analysis" --type skill --top-k 10
    python scripts/semantic_search.py "RAG embeddings" --type agent --show-content
    python scripts/semantic_search.py "visual design" --min-score 0.5
"""

import sys
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

import click
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown
from rich.syntax import Syntax

console = Console()

# Constants (must match build_embeddings.py)
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_COLLECTION_NAME = "claude_ecosystem"
DEFAULT_CHROMA_PATH = ".chroma_db"


class SemanticSearcher:
    """Semantic search engine for the Claude ecosystem."""

    def __init__(self, chroma_path: str = DEFAULT_CHROMA_PATH):
        """Initialize the searcher with ChromaDB connection."""
        script_dir = Path(__file__).parent
        base_dir = script_dir.parent
        self.chroma_full_path = base_dir / chroma_path

        if not self.chroma_full_path.exists():
            raise FileNotFoundError(
                f"ChromaDB not found at {self.chroma_full_path}. "
                "Run 'python scripts/build_embeddings.py' first."
            )

        self.client = chromadb.PersistentClient(
            path=str(self.chroma_full_path),
            settings=Settings(anonymized_telemetry=False)
        )

        try:
            self.collection = self.client.get_collection(CHROMA_COLLECTION_NAME)
        except ValueError:
            raise ValueError(
                f"Collection '{CHROMA_COLLECTION_NAME}' not found. "
                "Run 'python scripts/build_embeddings.py' first."
            )

        # Load embedding model
        self.model = SentenceTransformer(EMBEDDING_MODEL)

    def search(
        self,
        query: str,
        top_k: int = 5,
        doc_type: Optional[str] = None,
        chunk_type: Optional[str] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search.

        Args:
            query: Search query
            top_k: Number of results to return
            doc_type: Filter by type ('skill' or 'agent')
            chunk_type: Filter by chunk type ('summary', 'section', 'full')
            min_score: Minimum similarity score (0-1)

        Returns:
            List of results with id, content, metadata, and score
        """
        # Generate query embedding
        query_embedding = self.model.encode(query).tolist()

        # Build where clause for filtering
        where = None
        where_conditions = []

        if doc_type:
            where_conditions.append({"type": doc_type})

        if chunk_type:
            where_conditions.append({"chunk_type": chunk_type})

        if len(where_conditions) == 1:
            where = where_conditions[0]
        elif len(where_conditions) > 1:
            where = {"$and": where_conditions}

        # Query ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2 if min_score > 0 else top_k,  # Get extra for filtering
            where=where,
            include=["documents", "metadatas", "distances"]
        )

        # Process results
        processed = []
        for i in range(len(results['ids'][0])):
            # ChromaDB returns L2 distance, convert to similarity score
            # For normalized embeddings: similarity = 1 - (distance^2 / 2)
            distance = results['distances'][0][i]
            # sentence-transformers embeddings are normalized, so we use cosine
            # ChromaDB's L2 distance for normalized vectors: d = sqrt(2 - 2*cos)
            # So: cos = 1 - d^2/2
            similarity = max(0, 1 - (distance ** 2) / 2)

            if similarity < min_score:
                continue

            processed.append({
                'id': results['ids'][0][i],
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'score': similarity,
                'distance': distance
            })

        # Sort by score descending and limit to top_k
        processed.sort(key=lambda x: x['score'], reverse=True)
        return processed[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """Get collection statistics."""
        count = self.collection.count()

        # Sample to get type distribution
        sample = self.collection.get(limit=1000, include=["metadatas"])

        type_counts = {}
        chunk_counts = {}

        for meta in sample['metadatas']:
            doc_type = meta.get('type', 'unknown')
            chunk_type = meta.get('chunk_type', 'unknown')

            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
            chunk_counts[chunk_type] = chunk_counts.get(chunk_type, 0) + 1

        return {
            'total_documents': count,
            'type_distribution': type_counts,
            'chunk_distribution': chunk_counts
        }


def format_result(result: Dict[str, Any], show_content: bool = False, index: int = 0) -> Panel:
    """Format a search result for display."""
    meta = result['metadata']

    # Build header
    doc_type = meta.get('type', 'unknown').upper()
    name = meta.get('name', 'Unknown')
    chunk_type = meta.get('chunk_type', '')
    section_title = meta.get('section_title', '')

    score_color = "green" if result['score'] > 0.7 else "yellow" if result['score'] > 0.4 else "red"
    score_str = f"[{score_color}]{result['score']:.3f}[/{score_color}]"

    title = f"[{index + 1}] [{doc_type}] {name}"
    if section_title:
        title += f" - {section_title}"
    title += f" (score: {score_str})"

    # Build content
    lines = []

    if 'description' in meta:
        desc = meta['description']
        if len(desc) > 200:
            desc = desc[:200] + "..."
        lines.append(f"[dim]{desc}[/dim]")

    if 'tools' in meta:
        lines.append(f"[cyan]Tools:[/cyan] {meta['tools']}")

    if 'role' in meta:
        lines.append(f"[cyan]Role:[/cyan] {meta['role']}")

    if 'triggers' in meta:
        try:
            triggers = json.loads(meta['triggers'])
            lines.append(f"[cyan]Triggers:[/cyan] {', '.join(triggers[:5])}")
        except (json.JSONDecodeError, TypeError):
            lines.append(f"[cyan]Triggers:[/cyan] {meta['triggers']}")

    lines.append(f"[dim]Source: {meta.get('source_file', 'unknown')}[/dim]")

    if show_content:
        lines.append("")
        lines.append("[bold]Content:[/bold]")
        content = result['content']
        if len(content) > 1000:
            content = content[:1000] + "\n... (truncated)"
        lines.append(content)

    return Panel(
        "\n".join(lines),
        title=title,
        border_style="blue" if meta.get('type') == 'skill' else "magenta"
    )


@click.command()
@click.argument('query')
@click.option(
    '--top-k', '-k',
    default=5,
    help='Number of results to return'
)
@click.option(
    '--type', '-t', 'doc_type',
    type=click.Choice(['skill', 'agent']),
    help='Filter by document type'
)
@click.option(
    '--chunk-type', '-c',
    type=click.Choice(['summary', 'section', 'full']),
    help='Filter by chunk type'
)
@click.option(
    '--min-score', '-s',
    default=0.0,
    help='Minimum similarity score (0-1)'
)
@click.option(
    '--show-content',
    is_flag=True,
    help='Show full content of each result'
)
@click.option(
    '--json-output',
    is_flag=True,
    help='Output results as JSON'
)
@click.option(
    '--chroma-path',
    default=DEFAULT_CHROMA_PATH,
    help='Path to ChromaDB database'
)
@click.option(
    '--stats',
    is_flag=True,
    help='Show collection statistics instead of searching'
)
def main(
    query: str,
    top_k: int,
    doc_type: Optional[str],
    chunk_type: Optional[str],
    min_score: float,
    show_content: bool,
    json_output: bool,
    chroma_path: str,
    stats: bool
):
    """
    Search the Claude Skills Ecosystem using semantic similarity.

    QUERY is the search text to find relevant skills and agents.

    Examples:

        python scripts/semantic_search.py "how to design agents"

        python scripts/semantic_search.py "photo analysis" --type skill

        python scripts/semantic_search.py "RAG embeddings" -k 10 --show-content
    """
    try:
        searcher = SemanticSearcher(chroma_path=chroma_path)

        if stats:
            # Show statistics
            stat_data = searcher.get_stats()

            table = Table(title="Collection Statistics")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")

            table.add_row("Total Documents", str(stat_data['total_documents']))

            console.print(table)

            if stat_data['type_distribution']:
                type_table = Table(title="Document Types")
                type_table.add_column("Type", style="cyan")
                type_table.add_column("Count", style="green")
                for t, c in stat_data['type_distribution'].items():
                    type_table.add_row(t, str(c))
                console.print(type_table)

            if stat_data['chunk_distribution']:
                chunk_table = Table(title="Chunk Types")
                chunk_table.add_column("Type", style="cyan")
                chunk_table.add_column("Count", style="green")
                for t, c in stat_data['chunk_distribution'].items():
                    chunk_table.add_row(t, str(c))
                console.print(chunk_table)

            return

        # Perform search
        if not json_output:
            console.print(f"\n[bold]Searching for:[/bold] \"{query}\"")
            if doc_type:
                console.print(f"[dim]Filter: type={doc_type}[/dim]")
            if chunk_type:
                console.print(f"[dim]Filter: chunk_type={chunk_type}[/dim]")
            if min_score > 0:
                console.print(f"[dim]Filter: min_score={min_score}[/dim]")
            console.print()

        results = searcher.search(
            query=query,
            top_k=top_k,
            doc_type=doc_type,
            chunk_type=chunk_type,
            min_score=min_score
        )

        if json_output:
            # JSON output
            output = {
                'query': query,
                'filters': {
                    'type': doc_type,
                    'chunk_type': chunk_type,
                    'min_score': min_score
                },
                'results': results
            }
            print(json.dumps(output, indent=2))
        else:
            # Rich console output
            if not results:
                console.print("[yellow]No results found.[/yellow]")
                if min_score > 0:
                    console.print("[dim]Try lowering --min-score[/dim]")
                return

            console.print(f"[bold green]Found {len(results)} results:[/bold green]\n")

            for i, result in enumerate(results):
                panel = format_result(result, show_content=show_content, index=i)
                console.print(panel)
                console.print()

    except FileNotFoundError as e:
        console.print(f"[red]Error: {e}[/red]")
        console.print("\n[yellow]Run 'python scripts/build_embeddings.py' first to build the vector store.[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

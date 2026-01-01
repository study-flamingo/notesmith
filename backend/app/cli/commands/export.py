"""Export notes to PDF or DOCX format."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console

console = Console()


def export(
    note_file: Path = typer.Argument(
        ...,
        help="Path to note file (markdown or text)",
        exists=True,
        readable=True,
    ),
    format: str = typer.Option(
        "pdf",
        "--format",
        "-f",
        help="Export format: pdf or docx",
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: <note_file>.<format>)",
    ),
    title: Optional[str] = typer.Option(
        None,
        "--title",
        help="Document title for header",
    ),
) -> None:
    """
    Export a clinical note to PDF or DOCX.
    """
    # Validate format
    if format not in ("pdf", "docx"):
        console.print(f"[red]Error:[/red] Invalid format '{format}'. Use 'pdf' or 'docx'.")
        raise typer.Exit(1)

    # TODO: Implement export using app.services.export
    output_path = output or note_file.with_suffix(f".{format}")

    console.print(f"[yellow]TODO:[/yellow] Export {note_file} to {format.upper()}")
    console.print(f"  Output: {output_path}")
    console.print(f"  Title: {title or 'Clinical Note'}")

    console.print("[dim]Export not yet implemented[/dim]")


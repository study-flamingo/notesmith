"""Generate clinical notes from transcripts."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


def generate(
    transcript: Path = typer.Argument(
        ...,
        help="Path to transcript file or '-' for stdin",
        exists=True,
        readable=True,
    ),
    template: str = typer.Option(
        "soap",
        "--template",
        "-t",
        help="Template name or path to template file",
    ),
    provider: Optional[str] = typer.Option(
        None,
        "--provider",
        "-p",
        help="LLM provider (openai, anthropic, ollama). Uses config default if not set.",
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: stdout)",
    ),
) -> None:
    """
    Generate a clinical note from a transcript.

    Uses an LLM to analyze the transcript and fill in the template.
    """
    # TODO: Implement generation using app.services.note_generator
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("Generating clinical note...", total=None)

        # Placeholder - will integrate with NoteGeneratorService
        console.print(f"[yellow]TODO:[/yellow] Generate note from {transcript}")
        console.print(f"  Template: {template}")
        console.print(f"  Provider: {provider or 'default'}")
        console.print(f"  Output: {output or 'stdout'}")

    console.print("[dim]Note generation not yet implemented[/dim]")


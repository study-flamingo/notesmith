"""Full pipeline: transcribe → generate → export."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


def process(
    audio_file: Path = typer.Argument(
        ...,
        help="Path to audio file to process",
        exists=True,
        readable=True,
    ),
    template: str = typer.Option(
        "soap",
        "--template",
        "-t",
        help="Template name for note generation",
    ),
    format: str = typer.Option(
        "pdf",
        "--format",
        "-f",
        help="Export format: pdf, docx, or txt (no export)",
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path",
    ),
    keep_intermediate: bool = typer.Option(
        False,
        "--keep",
        "-k",
        help="Keep intermediate files (transcript, raw note)",
    ),
    provider: Optional[str] = typer.Option(
        None,
        "--provider",
        "-p",
        help="LLM provider for note generation",
    ),
) -> None:
    """
    Process an audio recording through the full pipeline.

    This command runs: transcribe → generate → export

    [bold]Example:[/bold]
        notesmith process recording.mp3 --template soap --format pdf
    """
    console.print(
        Panel.fit(
            f"[bold]Processing:[/bold] {audio_file.name}",
            subtitle=f"Template: {template} | Format: {format}",
        )
    )

    steps = [
        ("Transcribing audio", "transcribe"),
        ("Analyzing transcript", "analyze"),
        ("Generating clinical note", "generate"),
    ]

    if format != "txt":
        steps.append((f"Exporting to {format.upper()}", "export"))

    # TODO: Implement full pipeline
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        for step_name, step_id in steps:
            task = progress.add_task(step_name, total=None)
            # Placeholder for actual implementation
            import time

            time.sleep(0.5)  # Simulate work
            progress.remove_task(task)
            console.print(f"  [green]✓[/green] {step_name}")

    # Output path
    output_path = output or audio_file.with_suffix(f".{format}")

    console.print()
    console.print(f"[yellow]TODO:[/yellow] Full pipeline not yet implemented")
    console.print(f"  Audio: {audio_file}")
    console.print(f"  Template: {template}")
    console.print(f"  Provider: {provider or 'default'}")
    console.print(f"  Output: {output_path}")

    if keep_intermediate:
        console.print(f"  Transcript: {audio_file.with_suffix('.txt')}")
        console.print(f"  Raw note: {audio_file.with_suffix('.md')}")

    console.print("[dim]Pipeline not yet implemented[/dim]")


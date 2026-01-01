"""Transcribe audio files using OpenAI Whisper."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


def transcribe(
    audio_file: Path = typer.Argument(
        ...,
        help="Path to audio file (mp3, wav, m4a, webm)",
        exists=True,
        readable=True,
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: <audio_file>.txt)",
    ),
    language: str = typer.Option(
        "en",
        "--language",
        "-l",
        help="Audio language (ISO 639-1 code)",
    ),
    model: str = typer.Option(
        "whisper-1",
        "--model",
        "-m",
        help="Whisper model to use",
    ),
) -> None:
    """
    Transcribe an audio recording to text.

    Supported formats: mp3, wav, m4a, webm, ogg, flac
    """
    # TODO: Implement transcription using app.services.transcription
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("Transcribing audio...", total=None)

        # Placeholder - will integrate with TranscriptionService
        console.print(f"[yellow]TODO:[/yellow] Transcribe {audio_file}")
        console.print(f"  Language: {language}")
        console.print(f"  Model: {model}")
        console.print(f"  Output: {output or audio_file.with_suffix('.txt')}")

    console.print("[dim]Transcription not yet implemented[/dim]")


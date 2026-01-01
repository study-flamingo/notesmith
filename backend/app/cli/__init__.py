"""
NoteSmith CLI - Command-line interface for dental transcription and note generation.

Usage:
    notesmith transcribe <audio-file>
    notesmith generate <transcript> --template <name>
    notesmith export <note-id> --format pdf|docx
    notesmith process <audio-file> --template <name>  # Full pipeline
    notesmith templates list|show|import|export
    notesmith config init|set|get
"""

import typer
from rich.console import Console

from app.cli.commands import config, export, generate, process, templates, transcribe

# Console for rich output
console = Console()

# Main CLI app
app = typer.Typer(
    name="notesmith",
    help="NoteSmith - Dental appointment transcription and clinical note generation",
    no_args_is_help=True,
    rich_markup_mode="rich",
)

# Register command groups
app.add_typer(templates.app, name="templates", help="Manage note templates")
app.add_typer(config.app, name="config", help="Configure NoteSmith settings")

# Register top-level commands
app.command()(transcribe.transcribe)
app.command()(generate.generate)
app.command()(export.export)
app.command()(process.process)


@app.callback()
def main(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose output"),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Suppress non-essential output"),
    json_output: bool = typer.Option(False, "--json", help="Output results as JSON"),
):
    """
    NoteSmith CLI - Process dental recordings into clinical notes.

    Use --json for machine-readable output in scripts and pipelines.
    """
    # Store global options in context for commands to access
    ctx = typer.Context
    # These will be accessed via state object in commands


if __name__ == "__main__":
    app()


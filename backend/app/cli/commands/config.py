"""Configuration management commands."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

console = Console()

app = typer.Typer(help="Configure NoteSmith settings")

# Default config location
CONFIG_DIR = Path.home() / ".notesmith"
CONFIG_FILE = CONFIG_DIR / "config.toml"


@app.command("init")
def init_config(
    force: bool = typer.Option(False, "--force", "-f", help="Overwrite existing config"),
) -> None:
    """Initialize NoteSmith configuration interactively."""
    if CONFIG_FILE.exists() and not force:
        console.print(f"[yellow]Config already exists:[/yellow] {CONFIG_FILE}")
        console.print("Use --force to overwrite")
        raise typer.Exit(1)

    console.print("[bold]NoteSmith Configuration Setup[/bold]")
    console.print()

    # TODO: Interactive prompts for configuration
    console.print("Configuration options:")
    console.print("  1. OpenAI API Key")
    console.print("  2. Anthropic API Key (optional)")
    console.print("  3. Default LLM Provider")
    console.print("  4. Default Template")
    console.print()

    console.print(f"[yellow]TODO:[/yellow] Create config at {CONFIG_FILE}")
    console.print("[dim]Interactive config not yet implemented[/dim]")


@app.command("set")
def set_config(
    key: str = typer.Argument(..., help="Configuration key (e.g., 'llm.provider')"),
    value: str = typer.Argument(..., help="Value to set"),
) -> None:
    """Set a configuration value."""
    # TODO: Update config file
    console.print(f"[yellow]TODO:[/yellow] Set {key} = {value}")
    console.print("[dim]Config set not yet implemented[/dim]")


@app.command("get")
def get_config(
    key: Optional[str] = typer.Argument(None, help="Configuration key (omit to show all)"),
) -> None:
    """Get a configuration value or show all config."""
    if key:
        # TODO: Get specific key
        console.print(f"[yellow]TODO:[/yellow] Get config value for '{key}'")
    else:
        # Show all config
        table = Table(title="NoteSmith Configuration")
        table.add_column("Key", style="cyan")
        table.add_column("Value")

        # Placeholder
        config_items = [
            ("llm.provider", "openai"),
            ("llm.model", "gpt-4o"),
            ("template.default", "soap"),
            ("output.format", "pdf"),
        ]

        for k, v in config_items:
            table.add_row(k, v)

        console.print(table)

    console.print("[dim]Config reading not yet implemented[/dim]")


@app.command("path")
def show_config_path() -> None:
    """Show the configuration file path."""
    console.print(f"Config directory: {CONFIG_DIR}")
    console.print(f"Config file: {CONFIG_FILE}")

    if CONFIG_FILE.exists():
        console.print("[green]✓ Config file exists[/green]")
    else:
        console.print("[yellow]⚠ Config file not found[/yellow]")
        console.print("Run 'notesmith config init' to create it")


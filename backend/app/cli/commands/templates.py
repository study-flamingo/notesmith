"""Template management commands."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

console = Console()

app = typer.Typer(help="Manage clinical note templates")


@app.command("list")
def list_templates(
    format: str = typer.Option("table", "--format", "-f", help="Output format: table or json"),
) -> None:
    """List all available templates."""
    # TODO: Load templates from config/database
    table = Table(title="Available Templates")
    table.add_column("Name", style="cyan")
    table.add_column("Type", style="green")
    table.add_column("Description")

    # Placeholder data
    templates = [
        ("soap", "builtin", "Standard SOAP note format"),
        ("narrative", "builtin", "Narrative clinical note"),
        ("periodontal", "builtin", "Periodontal examination note"),
    ]

    for name, type_, desc in templates:
        table.add_row(name, type_, desc)

    console.print(table)
    console.print("[dim]Template listing not yet connected to backend[/dim]")


@app.command("show")
def show_template(
    name: str = typer.Argument(..., help="Template name to display"),
) -> None:
    """Display a template's content."""
    # TODO: Load template from config/database
    console.print(f"[yellow]TODO:[/yellow] Show template '{name}'")
    console.print("[dim]Template display not yet implemented[/dim]")


@app.command("import")
def import_template(
    file: Path = typer.Argument(
        ...,
        help="JSON file to import",
        exists=True,
        readable=True,
    ),
    name: Optional[str] = typer.Option(
        None,
        "--name",
        "-n",
        help="Override template name",
    ),
) -> None:
    """Import a template from a JSON file."""
    # TODO: Implement template import
    console.print(f"[yellow]TODO:[/yellow] Import template from {file}")
    if name:
        console.print(f"  Override name: {name}")
    console.print("[dim]Template import not yet implemented[/dim]")


@app.command("export")
def export_template(
    name: str = typer.Argument(..., help="Template name to export"),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: <name>.json)",
    ),
) -> None:
    """Export a template to a JSON file."""
    output_path = output or Path(f"{name}.json")

    # TODO: Implement template export
    console.print(f"[yellow]TODO:[/yellow] Export template '{name}' to {output_path}")
    console.print("[dim]Template export not yet implemented[/dim]")


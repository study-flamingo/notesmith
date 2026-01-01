"""Tests for CLI scaffold."""

import pytest
from typer.testing import CliRunner

from app.cli import app


runner = CliRunner()


class TestCLIStructure:
    """Tests for CLI app structure and commands."""

    def test_app_exists(self):
        """Test that the CLI app is properly created."""
        assert app is not None
        assert app.info.name == "notesmith"

    def test_app_has_help(self):
        """Test that the CLI app has help text."""
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        assert "NoteSmith" in result.stdout
        assert "transcribe" in result.stdout
        assert "generate" in result.stdout
        assert "export" in result.stdout
        assert "process" in result.stdout
        assert "templates" in result.stdout
        assert "config" in result.stdout


class TestTranscribeCommand:
    """Tests for transcribe command."""

    def test_transcribe_help(self):
        """Test transcribe command has help text."""
        result = runner.invoke(app, ["transcribe", "--help"])
        assert result.exit_code == 0
        assert "audio" in result.stdout.lower()
        assert "--output" in result.stdout or "-o" in result.stdout

    def test_transcribe_requires_file(self):
        """Test transcribe command requires audio file argument."""
        result = runner.invoke(app, ["transcribe"])
        # Should fail because required argument is missing
        assert result.exit_code != 0


class TestGenerateCommand:
    """Tests for generate command."""

    def test_generate_help(self):
        """Test generate command has help text."""
        result = runner.invoke(app, ["generate", "--help"])
        assert result.exit_code == 0
        assert "--template" in result.stdout or "-t" in result.stdout

    def test_generate_requires_file(self):
        """Test generate command requires transcript file argument."""
        result = runner.invoke(app, ["generate"])
        assert result.exit_code != 0


class TestExportCommand:
    """Tests for export command."""

    def test_export_help(self):
        """Test export command has help text."""
        result = runner.invoke(app, ["export", "--help"])
        assert result.exit_code == 0
        assert "pdf" in result.stdout.lower() or "docx" in result.stdout.lower()
        assert "--format" in result.stdout or "-f" in result.stdout

    def test_export_requires_file(self):
        """Test export command requires note file argument."""
        result = runner.invoke(app, ["export"])
        assert result.exit_code != 0


class TestProcessCommand:
    """Tests for process command (full pipeline)."""

    def test_process_help(self):
        """Test process command has help text."""
        result = runner.invoke(app, ["process", "--help"])
        assert result.exit_code == 0
        assert "pipeline" in result.stdout.lower() or "transcribe" in result.stdout.lower()
        assert "--template" in result.stdout or "-t" in result.stdout

    def test_process_requires_file(self):
        """Test process command requires audio file argument."""
        result = runner.invoke(app, ["process"])
        assert result.exit_code != 0


class TestTemplatesSubcommand:
    """Tests for templates subcommand group."""

    def test_templates_help(self):
        """Test templates command group has help text."""
        result = runner.invoke(app, ["templates", "--help"])
        assert result.exit_code == 0
        assert "list" in result.stdout
        assert "show" in result.stdout
        assert "import" in result.stdout
        assert "export" in result.stdout

    def test_templates_list(self):
        """Test templates list command runs."""
        result = runner.invoke(app, ["templates", "list"])
        assert result.exit_code == 0
        # Should show available templates (even if placeholder)
        assert "template" in result.stdout.lower()

    def test_templates_list_help(self):
        """Test templates list has format option."""
        result = runner.invoke(app, ["templates", "list", "--help"])
        assert result.exit_code == 0
        assert "--format" in result.stdout or "-f" in result.stdout

    def test_templates_show_requires_name(self):
        """Test templates show requires template name."""
        result = runner.invoke(app, ["templates", "show"])
        assert result.exit_code != 0

    def test_templates_import_requires_file(self):
        """Test templates import requires file argument."""
        result = runner.invoke(app, ["templates", "import"])
        assert result.exit_code != 0

    def test_templates_export_requires_name(self):
        """Test templates export requires template name."""
        result = runner.invoke(app, ["templates", "export"])
        assert result.exit_code != 0


class TestConfigSubcommand:
    """Tests for config subcommand group."""

    def test_config_help(self):
        """Test config command group has help text."""
        result = runner.invoke(app, ["config", "--help"])
        assert result.exit_code == 0
        assert "init" in result.stdout
        assert "set" in result.stdout
        assert "get" in result.stdout
        assert "path" in result.stdout

    def test_config_init(self):
        """Test config init command runs."""
        result = runner.invoke(app, ["config", "init"])
        # May exit with 1 if config exists, but should not crash
        assert result.exit_code in (0, 1)

    def test_config_init_help(self):
        """Test config init has force option."""
        result = runner.invoke(app, ["config", "init", "--help"])
        assert result.exit_code == 0
        assert "--force" in result.stdout or "-f" in result.stdout

    def test_config_set_requires_args(self):
        """Test config set requires key and value."""
        result = runner.invoke(app, ["config", "set"])
        assert result.exit_code != 0

    def test_config_get_runs(self):
        """Test config get command runs without args."""
        result = runner.invoke(app, ["config", "get"])
        assert result.exit_code == 0
        # Should show config table or message
        assert "config" in result.stdout.lower()

    def test_config_path(self):
        """Test config path command shows path."""
        result = runner.invoke(app, ["config", "path"])
        assert result.exit_code == 0
        assert ".notesmith" in result.stdout or "config" in result.stdout.lower()


class TestGlobalOptions:
    """Tests for global CLI options."""

    def test_verbose_option(self):
        """Test --verbose flag is accepted."""
        result = runner.invoke(app, ["--verbose", "--help"])
        assert result.exit_code == 0

    def test_quiet_option(self):
        """Test --quiet flag is accepted."""
        result = runner.invoke(app, ["--quiet", "--help"])
        assert result.exit_code == 0

    def test_json_option(self):
        """Test --json flag is accepted."""
        result = runner.invoke(app, ["--json", "--help"])
        assert result.exit_code == 0

    def test_version_shows_in_help(self):
        """Test version info may be shown."""
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        # App help should be shown
        assert len(result.stdout) > 0


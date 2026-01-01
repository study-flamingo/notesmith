"""Tests for export service."""

import pytest
from io import BytesIO

from app.services.export import export_to_pdf, export_to_docx


class TestPDFExport:
    """Tests for PDF export functionality."""

    def test_export_simple_content(self):
        """Test exporting simple text content to PDF."""
        content = "This is a simple clinical note."
        result = export_to_pdf(content)

        assert isinstance(result, bytes)
        assert len(result) > 0
        # PDF files start with %PDF
        assert result[:4] == b"%PDF"

    def test_export_with_custom_title(self):
        """Test exporting with custom title."""
        content = "Note content here."
        result = export_to_pdf(content, title="Custom Title")

        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result[:4] == b"%PDF"

    def test_export_with_markdown_headers(self):
        """Test exporting content with markdown-style headers."""
        content = """# Main Title
## Section Header
Some content here.
## Another Section
More content."""

        result = export_to_pdf(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_with_bullet_points(self):
        """Test exporting content with bullet points."""
        content = """Findings:
• Cavity detected on tooth #14
• Gum inflammation present
- Additional item with dash
"""
        result = export_to_pdf(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_with_empty_lines(self):
        """Test exporting content with blank lines."""
        content = """First paragraph.

Second paragraph after blank line.

Third paragraph."""

        result = export_to_pdf(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_empty_content(self):
        """Test exporting empty content."""
        result = export_to_pdf("")
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result[:4] == b"%PDF"

    def test_export_unicode_content(self):
        """Test exporting content with unicode characters."""
        content = "Patient name: José García\nDiagnosis: café au lait spots"
        result = export_to_pdf(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_long_content(self):
        """Test exporting longer content that may span pages."""
        content = "Clinical findings:\n" + "\n".join(
            [f"Finding {i}: Lorem ipsum dolor sit amet." for i in range(50)]
        )
        result = export_to_pdf(content)
        assert isinstance(result, bytes)
        assert len(result) > 0


class TestDOCXExport:
    """Tests for DOCX export functionality."""

    def test_export_simple_content(self):
        """Test exporting simple text content to DOCX."""
        content = "This is a simple clinical note."
        result = export_to_docx(content)

        assert isinstance(result, bytes)
        assert len(result) > 0
        # DOCX files are ZIP archives starting with PK
        assert result[:2] == b"PK"

    def test_export_with_custom_title(self):
        """Test exporting with custom title."""
        content = "Note content here."
        result = export_to_docx(content, title="Custom Title")

        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result[:2] == b"PK"

    def test_export_with_markdown_headers(self):
        """Test exporting content with markdown-style headers."""
        content = """# Main Title
## Section Header
Some content here.
## Another Section
More content."""

        result = export_to_docx(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_with_bullet_points(self):
        """Test exporting content with bullet points."""
        content = """Findings:
• Cavity detected on tooth #14
• Gum inflammation present
- Additional item with dash
"""
        result = export_to_docx(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_with_numbered_list(self):
        """Test exporting content with numbered list."""
        content = """Recommendations:
1. Schedule follow-up in 2 weeks
2. Take medication as prescribed
3. Avoid hard foods
"""
        result = export_to_docx(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_with_empty_lines(self):
        """Test exporting content with blank lines."""
        content = """First paragraph.

Second paragraph after blank line.

Third paragraph."""

        result = export_to_docx(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_empty_content(self):
        """Test exporting empty content."""
        result = export_to_docx("")
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result[:2] == b"PK"

    def test_export_unicode_content(self):
        """Test exporting content with unicode characters."""
        content = "Patient name: José García\nDiagnosis: café au lait spots"
        result = export_to_docx(content)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_long_content(self):
        """Test exporting longer content."""
        content = "Clinical findings:\n" + "\n".join(
            [f"Finding {i}: Lorem ipsum dolor sit amet." for i in range(50)]
        )
        result = export_to_docx(content)
        assert isinstance(result, bytes)
        assert len(result) > 0


class TestExportFormats:
    """Tests comparing PDF and DOCX export behavior."""

    def test_same_content_different_formats(self):
        """Test that same content produces valid output in both formats."""
        content = """DENTAL CLINICAL NOTE
        
Patient presented with tooth pain in upper right quadrant.

Findings:
• Cavity on tooth #3
• Mild gingivitis

Recommendations:
1. Filling procedure scheduled
2. Improved oral hygiene routine
"""
        pdf_result = export_to_pdf(content)
        docx_result = export_to_docx(content)

        # Both should produce valid output
        assert pdf_result[:4] == b"%PDF"
        assert docx_result[:2] == b"PK"

        # Both should be non-trivial
        assert len(pdf_result) > 100
        assert len(docx_result) > 100

    def test_special_characters_handling(self):
        """Test handling of special characters in both formats."""
        content = "Special chars: <>&\"' and symbols: © ® ™"

        # Should not raise exceptions
        pdf_result = export_to_pdf(content)
        docx_result = export_to_docx(content)

        assert isinstance(pdf_result, bytes)
        assert isinstance(docx_result, bytes)


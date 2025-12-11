"""Tests for template engine."""

import pytest

from app.models.notes import AnalysisResult
from app.services.template_engine import TemplateEngine


@pytest.fixture
def engine():
    """Create template engine instance."""
    return TemplateEngine()


def test_simple_render(engine):
    """Test simple variable substitution."""
    template = "Hello {{ name }}!"
    result = engine.render(template, {"name": "World"})
    assert result == "Hello World!"


def test_render_with_list(engine):
    """Test rendering with list filter."""
    template = "Items:\n{{ items | bullet_list }}"
    result = engine.render(template, {"items": ["Item 1", "Item 2"]})
    assert "• Item 1" in result
    assert "• Item 2" in result


def test_render_with_empty_list(engine):
    """Test rendering with empty list."""
    template = "{{ items | bullet_list }}"
    result = engine.render(template, {"items": []})
    assert result == "None documented"


def test_extract_variables(engine):
    """Test variable extraction from template."""
    template = """
    {{ chief_complaint }}
    {% for item in procedures %}
    - {{ item }}
    {% endfor %}
    {% if has_findings %}
    {{ findings }}
    {% endif %}
    """
    variables = engine.extract_variables(template)
    assert "chief_complaint" in variables
    assert "procedures" in variables
    assert "has_findings" in variables


def test_build_variables_from_analysis(engine):
    """Test building variables from analysis result."""
    analysis = AnalysisResult(
        chief_complaint="Tooth pain",
        procedures=["Examination", "X-ray"],
        findings=["Cavity detected"],
        recommendations=["Schedule filling"],
        summary="Patient has cavity",
    )
    
    variables = engine.build_variables_from_analysis(analysis, "test transcript")
    
    assert variables["chief_complaint"] == "Tooth pain"
    assert variables["procedures"] == ["Examination", "X-ray"]
    assert variables["has_procedures"] is True
    assert variables["transcript"] == "test transcript"


"""Tests for template engine."""

import pytest

from app.models.notes import AnalysisResult
from app.services.template_engine import TemplateEngine, DEFAULT_TEMPLATES


@pytest.fixture
def engine():
    """Create template engine instance."""
    return TemplateEngine()


class TestSimpleRendering:
    """Tests for basic template rendering."""

    def test_simple_render(self, engine):
        """Test simple variable substitution."""
        template = "Hello {{ name }}!"
        result = engine.render(template, {"name": "World"})
        assert result == "Hello World!"

    def test_render_multiple_variables(self, engine):
        """Test multiple variable substitution."""
        template = "{{ greeting }}, {{ name }}! Welcome to {{ place }}."
        result = engine.render(
            template, {"greeting": "Hello", "name": "Alice", "place": "NoteSmith"}
        )
        assert result == "Hello, Alice! Welcome to NoteSmith."

    def test_render_preserves_whitespace(self, engine):
        """Test that whitespace is preserved."""
        template = "Line 1\n\nLine 3"
        result = engine.render(template, {})
        assert result == "Line 1\n\nLine 3"

    def test_render_with_missing_variable(self, engine):
        """Test rendering with undefined variable - Jinja2 treats as empty string."""
        template = "Hello {{ undefined_var }}!"
        result = engine.render(template, {})
        assert result == "Hello !"

    def test_render_empty_template(self, engine):
        """Test rendering empty template."""
        result = engine.render("", {})
        assert result == ""


class TestListFilters:
    """Tests for list filter functionality."""

    def test_render_with_bullet_list(self, engine):
        """Test rendering with list filter."""
        template = "Items:\n{{ items | bullet_list }}"
        result = engine.render(template, {"items": ["Item 1", "Item 2"]})
        assert "• Item 1" in result
        assert "• Item 2" in result

    def test_render_with_numbered_list(self, engine):
        """Test rendering with numbered list filter."""
        template = "{{ items | numbered_list }}"
        result = engine.render(template, {"items": ["First", "Second", "Third"]})
        assert "1. First" in result
        assert "2. Second" in result
        assert "3. Third" in result

    def test_render_with_empty_list_bullet(self, engine):
        """Test rendering with empty list returns default text."""
        template = "{{ items | bullet_list }}"
        result = engine.render(template, {"items": []})
        assert result == "None documented"

    def test_render_with_empty_list_numbered(self, engine):
        """Test numbered list with empty list returns default text."""
        template = "{{ items | numbered_list }}"
        result = engine.render(template, {"items": []})
        assert result == "None documented"

    def test_render_single_item_list(self, engine):
        """Test list with single item."""
        template = "{{ items | bullet_list }}"
        result = engine.render(template, {"items": ["Only one"]})
        assert result == "• Only one"


class TestConditionals:
    """Tests for conditional rendering."""

    def test_if_true_condition(self, engine):
        """Test if block with true condition."""
        template = "{% if show %}Visible{% endif %}"
        result = engine.render(template, {"show": True})
        assert result == "Visible"

    def test_if_false_condition(self, engine):
        """Test if block with false condition."""
        template = "{% if show %}Visible{% endif %}"
        result = engine.render(template, {"show": False})
        assert result == ""

    def test_if_else(self, engine):
        """Test if-else block."""
        template = "{% if active %}Active{% else %}Inactive{% endif %}"
        assert engine.render(template, {"active": True}) == "Active"
        assert engine.render(template, {"active": False}) == "Inactive"


class TestForLoops:
    """Tests for loop rendering."""

    def test_for_loop(self, engine):
        """Test for loop rendering."""
        template = "{% for item in items %}{{ item }},{% endfor %}"
        result = engine.render(template, {"items": ["a", "b", "c"]})
        assert result == "a,b,c,"

    def test_for_loop_empty(self, engine):
        """Test for loop with empty list."""
        template = "{% for item in items %}{{ item }}{% endfor %}"
        result = engine.render(template, {"items": []})
        assert result == ""

    def test_for_loop_nested_access(self, engine):
        """Test for loop with dict items."""
        template = "{% for p in patients %}{{ p.name }}:{{ p.age }};{% endfor %}"
        result = engine.render(
            template,
            {"patients": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]},
        )
        assert "Alice:30" in result
        assert "Bob:25" in result


class TestVariableExtraction:
    """Tests for variable extraction from templates."""

    def test_extract_simple_variables(self, engine):
        """Test extracting simple variables."""
        template = "{{ name }} and {{ date }}"
        variables = engine.extract_variables(template)
        assert "name" in variables
        assert "date" in variables

    def test_extract_from_for_loop(self, engine):
        """Test extracting variables from for loops."""
        template = "{% for item in procedures %}{{ item }}{% endfor %}"
        variables = engine.extract_variables(template)
        assert "procedures" in variables

    def test_extract_from_if_statement(self, engine):
        """Test extracting variables from if statements."""
        template = "{% if has_findings %}{{ findings }}{% endif %}"
        variables = engine.extract_variables(template)
        assert "has_findings" in variables

    def test_extract_complex_template(self, engine):
        """Test variable extraction from complex template."""
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

    def test_extract_excludes_builtins(self, engine):
        """Test that builtins are excluded from extraction."""
        template = "{% if true %}Yes{% endif %}{% if false %}No{% endif %}"
        variables = engine.extract_variables(template)
        assert "true" not in variables
        assert "false" not in variables

    def test_extract_no_duplicates(self, engine):
        """Test that duplicate variables are not returned."""
        template = "{{ name }} says {{ name }}"
        variables = engine.extract_variables(template)
        assert variables.count("name") == 1


class TestBuildVariablesFromAnalysis:
    """Tests for building template variables from analysis results."""

    def test_build_with_full_analysis(self, engine):
        """Test building variables from complete analysis result."""
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
        assert variables["findings"] == ["Cavity detected"]
        assert variables["recommendations"] == ["Schedule filling"]
        assert variables["summary"] == "Patient has cavity"
        assert variables["transcript"] == "test transcript"
        assert variables["has_procedures"] is True
        assert variables["has_findings"] is True
        assert variables["has_recommendations"] is True

    def test_build_with_empty_analysis(self, engine):
        """Test building variables from empty analysis."""
        analysis = AnalysisResult()

        variables = engine.build_variables_from_analysis(analysis, "transcript text")

        assert variables["chief_complaint"] == "Not specified"
        assert variables["procedures"] == []
        assert variables["findings"] == []
        assert variables["recommendations"] == []
        assert variables["summary"] == ""
        assert variables["has_procedures"] is False
        assert variables["has_findings"] is False
        assert variables["has_recommendations"] is False

    def test_build_with_partial_analysis(self, engine):
        """Test building variables from partial analysis."""
        analysis = AnalysisResult(
            chief_complaint="Pain",
            procedures=["Cleaning"],
        )

        variables = engine.build_variables_from_analysis(analysis, "transcript")

        assert variables["chief_complaint"] == "Pain"
        assert variables["has_procedures"] is True
        assert variables["has_findings"] is False
        assert variables["has_recommendations"] is False


class TestSyntaxErrors:
    """Tests for template syntax error handling."""

    def test_invalid_syntax_raises_error(self, engine):
        """Test that invalid syntax raises ValueError."""
        template = "{% if unclosed"
        with pytest.raises(ValueError) as exc_info:
            engine.render(template, {})
        assert "Template syntax error" in str(exc_info.value)

    def test_mismatched_tags_raises_error(self, engine):
        """Test that mismatched tags raise error."""
        template = "{% if x %}{% endfor %}"
        with pytest.raises(ValueError):
            engine.render(template, {"x": True})


class TestDefaultTemplates:
    """Tests for default template definitions."""

    def test_soap_template_exists(self):
        """Test SOAP template is defined."""
        assert "soap" in DEFAULT_TEMPLATES
        assert "name" in DEFAULT_TEMPLATES["soap"]
        assert "content" in DEFAULT_TEMPLATES["soap"]
        assert DEFAULT_TEMPLATES["soap"]["name"] == "SOAP Note"

    def test_dap_template_exists(self):
        """Test DAP template is defined."""
        assert "dap" in DEFAULT_TEMPLATES
        assert DEFAULT_TEMPLATES["dap"]["name"] == "DAP Note"

    def test_narrative_template_exists(self):
        """Test Narrative template is defined."""
        assert "narrative" in DEFAULT_TEMPLATES
        assert DEFAULT_TEMPLATES["narrative"]["name"] == "Narrative Note"

    def test_default_templates_are_renderable(self, engine):
        """Test that all default templates can be rendered."""
        mock_vars = {
            "date": "2024-01-01",
            "provider": "Dr. Smith",
            "chief_complaint": "Tooth pain",
            "subjective_notes": "Patient reports pain",
            "findings": ["Cavity"],
            "assessment": "Dental caries",
            "procedures": ["Examination"],
            "recommendations": ["Return in 6 months"],
            "follow_up": "2 weeks",
            "patient_ref": "12345",
            "summary": "Routine exam",
        }

        for key, template_def in DEFAULT_TEMPLATES.items():
            result = engine.render(template_def["content"], mock_vars)
            assert result, f"Template '{key}' rendered empty"
            assert "{{ " not in result, f"Template '{key}' has unrendered variables"


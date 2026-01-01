"""Template engine for clinical note generation."""

import re
from typing import Any

from jinja2 import Environment, BaseLoader, TemplateSyntaxError

from app.models.notes import AnalysisResult


class TemplateEngine:
    """Engine for processing clinical note templates."""

    def __init__(self):
        self.env = Environment(
            loader=BaseLoader(),
            autoescape=False,  # Clinical notes don't need HTML escaping
        )
        # Add custom filters
        self.env.filters["bullet_list"] = self._bullet_list
        self.env.filters["numbered_list"] = self._numbered_list

    @staticmethod
    def _bullet_list(items: list[str]) -> str:
        """Convert list to bullet points."""
        if not items:
            return "None documented"
        return "\n".join(f"• {item}" for item in items)

    @staticmethod
    def _numbered_list(items: list[str]) -> str:
        """Convert list to numbered points."""
        if not items:
            return "None documented"
        return "\n".join(f"{i+1}. {item}" for i, item in enumerate(items))

    def render(
        self,
        template_content: str,
        variables: dict[str, Any],
    ) -> str:
        """
        Render a template with provided variables.
        
        Args:
            template_content: Template string with placeholders
            variables: Dictionary of variable values
            
        Returns:
            Rendered template content
        """
        try:
            template = self.env.from_string(template_content)
            return template.render(**variables)
        except TemplateSyntaxError as e:
            raise ValueError(f"Template syntax error: {e}")

    def extract_variables(self, template_content: str) -> list[str]:
        """
        Extract variable names from a template.
        
        Finds both {{ variable }} and {% ... variable ... %} patterns.
        """
        # Match {{ variable }} patterns
        simple_vars = re.findall(r'\{\{\s*(\w+)', template_content)
        
        # Match {% for item in variable %} patterns
        for_vars = re.findall(r'\{%\s*for\s+\w+\s+in\s+(\w+)', template_content)
        
        # Match {% if variable %} patterns
        if_vars = re.findall(r'\{%\s*if\s+(\w+)', template_content)
        
        all_vars = set(simple_vars + for_vars + if_vars)
        
        # Remove built-in names
        builtins = {'true', 'false', 'none', 'True', 'False', 'None'}
        return list(all_vars - builtins)

    def build_variables_from_analysis(
        self,
        analysis: AnalysisResult,
        transcript: str,
    ) -> dict[str, Any]:
        """
        Build template variables dictionary from analysis result.
        """
        return {
            "chief_complaint": analysis.chief_complaint or "Not specified",
            "procedures": analysis.procedures,
            "findings": analysis.findings,
            "recommendations": analysis.recommendations,
            "summary": analysis.summary or "",
            "transcript": transcript,
            "has_procedures": bool(analysis.procedures),
            "has_findings": bool(analysis.findings),
            "has_recommendations": bool(analysis.recommendations),
        }


# Default templates
DEFAULT_TEMPLATES = {
    "soap": {
        "name": "SOAP Note",
        "description": "Standard SOAP format (Subjective, Objective, Assessment, Plan)",
        "content": """DENTAL CLINICAL NOTE - SOAP FORMAT

Date: {{ date }}
Provider: {{ provider }}

SUBJECTIVE:
Chief Complaint: {{ chief_complaint }}

History of Present Illness:
{{ subjective_notes }}

OBJECTIVE:
Clinical Examination:
{% if findings %}
{{ findings | bullet_list }}
{% else %}
No significant findings documented.
{% endif %}

ASSESSMENT:
{{ assessment }}

PLAN:
{% if procedures %}
Procedures Performed:
{{ procedures | bullet_list }}
{% endif %}

{% if recommendations %}
Recommendations:
{{ recommendations | numbered_list }}
{% endif %}

Follow-up: {{ follow_up }}

_____________________________
Provider Signature
""",
    },
    "dap": {
        "name": "DAP Note",
        "description": "Data, Assessment, Plan format",
        "content": """DENTAL CLINICAL NOTE - DAP FORMAT

Date: {{ date }}
Provider: {{ provider }}

DATA:
{{ chief_complaint }}

Clinical Findings:
{{ findings | bullet_list }}

ASSESSMENT:
{{ assessment }}

PLAN:
{{ procedures | bullet_list }}

Recommendations:
{{ recommendations | numbered_list }}

_____________________________
Provider Signature
""",
    },
    "narrative": {
        "name": "Narrative Note",
        "description": "Free-form narrative clinical note",
        "content": """DENTAL CLINICAL NOTE

Date: {{ date }}
Provider: {{ provider }}
Patient Reference: {{ patient_ref }}

{{ summary }}

Chief Complaint:
{{ chief_complaint }}

Clinical Findings:
{{ findings | bullet_list }}

Treatment Provided:
{{ procedures | bullet_list }}

Recommendations and Follow-up:
{{ recommendations | bullet_list }}

_____________________________
Provider Signature
""",
    },
}


"""Anthropic Claude LLM provider implementation."""

import json
import logging

from anthropic import AsyncAnthropic

from app.core.config import settings
from app.models.notes import AnalysisResult, ClinicalEntity
from app.services.llm.base import BaseLLMProvider
from app.services.llm.prompts import ANALYSIS_SYSTEM_PROMPT, NOTE_GENERATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude provider for transcript analysis and note generation."""

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.model = model
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def analyze_transcript(
        self,
        transcript: str,
        context: dict | None = None,
    ) -> AnalysisResult:
        """Extract clinical entities from transcript using Claude."""
        user_prompt = f"""Analyze the following dental appointment transcript and extract clinical information.

Transcript:
---
{transcript}
---

{f"Additional context: {json.dumps(context)}" if context else ""}

Provide your analysis in the specified JSON format. Return ONLY valid JSON, no other text."""

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=ANALYSIS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        result_text = response.content[0].text

        # Try to extract JSON from response
        try:
            # Handle case where response might have markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            data = json.loads(result_text.strip())
        except json.JSONDecodeError:
            logger.error(f"Failed to parse analysis response: {result_text}")
            data = {}

        # Build entities list
        entities = []
        for procedure in data.get("procedures", []):
            entities.append(ClinicalEntity(entity_type="procedure", value=procedure))
        for finding in data.get("findings", []):
            entities.append(ClinicalEntity(entity_type="finding", value=finding))
        for rec in data.get("recommendations", []):
            entities.append(ClinicalEntity(entity_type="recommendation", value=rec))

        return AnalysisResult(
            chief_complaint=data.get("chief_complaint"),
            procedures=data.get("procedures", []),
            findings=data.get("findings", []),
            recommendations=data.get("recommendations", []),
            entities=entities,
            summary=data.get("summary"),
        )

    async def generate_note(
        self,
        transcript: str,
        template: str,
        analysis: AnalysisResult | None = None,
    ) -> str:
        """Generate clinical note using Claude."""
        analysis_context = ""
        if analysis:
            analysis_context = f"""
Pre-analyzed information:
- Chief Complaint: {analysis.chief_complaint or 'Not specified'}
- Procedures: {', '.join(analysis.procedures) if analysis.procedures else 'None'}
- Findings: {', '.join(analysis.findings) if analysis.findings else 'None'}
- Recommendations: {', '.join(analysis.recommendations) if analysis.recommendations else 'None'}
"""

        user_prompt = f"""Generate a clinical note using the following template and transcript.

Template:
---
{template}
---

Transcript:
---
{transcript}
---
{analysis_context}

Generate the clinical note following the template structure. Replace all placeholders with appropriate content from the transcript."""

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=NOTE_GENERATION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        return response.content[0].text

    async def complete(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> str:
        """Generic completion."""
        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt

        response = await self.client.messages.create(**kwargs)
        return response.content[0].text


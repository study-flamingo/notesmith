"""OpenAI LLM provider implementation."""

import json
import logging

from openai import AsyncOpenAI

from app.core.config import settings
from app.models.notes import AnalysisResult, ClinicalEntity
from app.services.llm.base import BaseLLMProvider
from app.services.llm.prompts import ANALYSIS_SYSTEM_PROMPT, NOTE_GENERATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """OpenAI GPT provider for transcript analysis and note generation."""

    def __init__(self, model: str = "gpt-4o"):
        self.model = model
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def analyze_transcript(
        self,
        transcript: str,
        context: dict | None = None,
    ) -> AnalysisResult:
        """Extract clinical entities from transcript using GPT."""
        user_prompt = f"""Analyze the following dental appointment transcript and extract clinical information.

Transcript:
---
{transcript}
---

{f"Additional context: {json.dumps(context)}" if context else ""}

Provide your analysis in the specified JSON format."""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        
        try:
            data = json.loads(result_text)
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
        """Generate clinical note using GPT."""
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

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": NOTE_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=4096,
        )

        return response.choices[0].message.content

    async def complete(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> str:
        """Generic completion."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content


"""Ollama local LLM provider implementation."""

import json
import logging

import httpx

from app.models.notes import AnalysisResult, ClinicalEntity
from app.services.llm.base import BaseLLMProvider
from app.services.llm.prompts import ANALYSIS_SYSTEM_PROMPT, NOTE_GENERATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class OllamaProvider(BaseLLMProvider):
    """Ollama local LLM provider for transcript analysis and note generation."""

    def __init__(
        self,
        model: str = "llama3.1",
        base_url: str = "http://localhost:11434",
    ):
        self.model = model
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=120.0)

    async def _generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.3,
    ) -> str:
        """Send generation request to Ollama."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        
        if system:
            payload["system"] = system

        response = await self.client.post(
            f"{self.base_url}/api/generate",
            json=payload,
        )
        response.raise_for_status()
        
        return response.json()["response"]

    async def analyze_transcript(
        self,
        transcript: str,
        context: dict | None = None,
    ) -> AnalysisResult:
        """Extract clinical entities from transcript using local LLM."""
        user_prompt = f"""Analyze the following dental appointment transcript and extract clinical information.

Transcript:
---
{transcript}
---

{f"Additional context: {json.dumps(context)}" if context else ""}

Provide your analysis in the specified JSON format. Return ONLY valid JSON, no other text."""

        result_text = await self._generate(
            prompt=user_prompt,
            system=ANALYSIS_SYSTEM_PROMPT,
            temperature=0.2,
        )

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
        """Generate clinical note using local LLM."""
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

        return await self._generate(
            prompt=user_prompt,
            system=NOTE_GENERATION_SYSTEM_PROMPT,
            temperature=0.3,
        )

    async def complete(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> str:
        """Generic completion."""
        return await self._generate(
            prompt=prompt,
            system=system_prompt,
            temperature=temperature,
        )


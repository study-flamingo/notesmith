"""Clinical note generation service."""

import logging

from app.db.client import get_supabase_client
from app.models.notes import NoteStatus
from app.services.llm.base import LLMProviderFactory

logger = logging.getLogger(__name__)


class NoteGeneratorService:
    """Service for generating clinical notes from transcripts."""

    def __init__(self, llm_provider: str | None = None):
        self.llm = LLMProviderFactory.get_provider(llm_provider)

    async def generate(
        self,
        transcript: str,
        template: str,
        analyze_first: bool = True,
    ) -> tuple[str, dict]:
        """
        Generate a clinical note from transcript and template.
        
        Args:
            transcript: Full transcript text
            template: Template content with placeholders
            analyze_first: Whether to analyze transcript before generation
            
        Returns:
            Tuple of (generated_note, analysis_dict)
        """
        analysis = None
        analysis_dict = {}

        if analyze_first:
            analysis = await self.llm.analyze_transcript(transcript)
            analysis_dict = {
                "chief_complaint": analysis.chief_complaint,
                "procedures": analysis.procedures,
                "findings": analysis.findings,
                "recommendations": analysis.recommendations,
                "summary": analysis.summary,
                "entities": [e.model_dump() for e in analysis.entities],
            }

        generated_note = await self.llm.generate_note(
            transcript=transcript,
            template=template,
            analysis=analysis,
        )

        return generated_note, analysis_dict


async def generate_clinical_note_task(
    note_id: str,
    transcript_content: str,
    template_content: str,
) -> None:
    """
    Background task to generate a clinical note.
    Updates the note record with generated content.
    """
    db = get_supabase_client()
    service = NoteGeneratorService()

    try:
        # Generate note
        generated_content, analysis = await service.generate(
            transcript=transcript_content,
            template=template_content,
            analyze_first=True,
        )

        # Update note record
        db.table("clinical_notes").update({
            "generated_content": generated_content,
            "analysis": analysis,
            "status": NoteStatus.GENERATED.value,
        }).eq("id", note_id).execute()

        logger.info(f"Note generation completed for {note_id}")

    except Exception as e:
        logger.error(f"Note generation failed for {note_id}: {e}")

        # Update status to draft with error
        db.table("clinical_notes").update({
            "status": NoteStatus.DRAFT.value,
            "generated_content": f"Error generating note: {str(e)}",
        }).eq("id", note_id).execute()

        raise


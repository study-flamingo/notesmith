"""Transcription service using OpenAI Whisper API."""

import logging
from pathlib import Path
from tempfile import NamedTemporaryFile

from openai import OpenAI

from app.core.config import settings
from app.db.client import get_supabase_client
from app.models.transcripts import TranscriptSegment, TranscriptStatus

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Service for audio transcription using OpenAI Whisper."""

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    async def transcribe_audio(
        self,
        audio_path: str | Path,
        language: str = "en",
    ) -> dict:
        """
        Transcribe audio file using OpenAI Whisper API.
        
        Returns:
            dict with 'text', 'segments', and 'language' keys
        """
        if not self.client:
            raise ValueError("OpenAI API key not configured")

        with open(audio_path, "rb") as audio_file:
            # Use verbose_json to get timestamps
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        segments = []
        if hasattr(response, "segments") and response.segments:
            for seg in response.segments:
                segments.append(
                    TranscriptSegment(
                        start_time=seg.get("start", 0),
                        end_time=seg.get("end", 0),
                        text=seg.get("text", ""),
                        confidence=seg.get("confidence"),
                    )
                )

        return {
            "text": response.text,
            "segments": segments,
            "language": response.language if hasattr(response, "language") else language,
        }

    async def transcribe_from_storage(
        self,
        storage_path: str,
        language: str = "en",
    ) -> dict:
        """
        Download audio from Supabase storage and transcribe it.
        """
        db = get_supabase_client()

        # Download file to temporary location
        file_data = db.storage.from_("recordings").download(storage_path)

        # Write to temp file (Whisper API needs a file)
        suffix = Path(storage_path).suffix
        with NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            tmp_file.write(file_data)
            tmp_path = tmp_file.name

        try:
            result = await self.transcribe_audio(tmp_path, language)
            return result
        finally:
            # Clean up temp file
            Path(tmp_path).unlink(missing_ok=True)


async def process_transcription_task(transcript_id: str, recording_id: str) -> None:
    """
    Background task to process transcription.
    Updates transcript record with results.
    """
    db = get_supabase_client()
    service = TranscriptionService()

    try:
        # Update status to processing
        db.table("transcripts").update(
            {"status": TranscriptStatus.PROCESSING.value}
        ).eq("id", transcript_id).execute()

        # Get recording info
        recording = (
            db.table("recordings")
            .select("storage_path")
            .eq("id", recording_id)
            .single()
            .execute()
        )

        if not recording.data:
            raise ValueError(f"Recording {recording_id} not found")

        # Perform transcription
        result = await service.transcribe_from_storage(recording.data["storage_path"])

        # Update transcript with results
        db.table("transcripts").update({
            "content": result["text"],
            "segments": [s.model_dump() for s in result["segments"]],
            "language": result["language"],
            "word_count": len(result["text"].split()),
            "status": TranscriptStatus.COMPLETED.value,
        }).eq("id", transcript_id).execute()

        # Update recording status
        db.table("recordings").update({
            "status": "transcribed"
        }).eq("id", recording_id).execute()

        logger.info(f"Transcription completed for {transcript_id}")

    except Exception as e:
        logger.error(f"Transcription failed for {transcript_id}: {e}")

        # Update status to failed
        db.table("transcripts").update({
            "status": TranscriptStatus.FAILED.value,
        }).eq("id", transcript_id).execute()

        db.table("recordings").update({
            "status": "failed"
        }).eq("id", recording_id).execute()

        raise


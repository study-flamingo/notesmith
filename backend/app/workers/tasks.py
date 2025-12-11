"""Celery tasks for background processing."""

import asyncio
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3)
def transcribe_recording_task(self, transcript_id: str, recording_id: str):
    """
    Celery task for transcribing audio recordings.
    """
    from app.services.transcription import process_transcription_task

    try:
        run_async(process_transcription_task(transcript_id, recording_id))
        logger.info(f"Transcription completed: {transcript_id}")
    except Exception as exc:
        logger.error(f"Transcription failed: {exc}")
        raise self.retry(exc=exc, countdown=60)  # Retry after 60 seconds


@celery_app.task(bind=True, max_retries=3)
def generate_note_task(
    self,
    note_id: str,
    transcript_content: str,
    template_content: str,
):
    """
    Celery task for generating clinical notes.
    """
    from app.services.note_generator import generate_clinical_note_task

    try:
        run_async(
            generate_clinical_note_task(note_id, transcript_content, template_content)
        )
        logger.info(f"Note generation completed: {note_id}")
    except Exception as exc:
        logger.error(f"Note generation failed: {exc}")
        raise self.retry(exc=exc, countdown=30)


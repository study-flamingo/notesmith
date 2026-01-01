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


@celery_app.task(bind=True, max_retries=2)
def process_appointment_task(self, appointment_id: str, user_id: str):
    """
    Celery task for processing an entire appointment with AI.

    This task:
    1. Gets all recordings for the appointment
    2. Transcribes any recordings that haven't been transcribed yet
    3. For each transcript and each assigned template, generates a clinical note
    4. Updates appointment status to COMPLETED when done

    Args:
        appointment_id: UUID of the appointment to process
        user_id: UUID of the user who initiated the processing
    """
    from app.db.client import get_db_client
    from app.core.logging import audit_logger
    from app.models.appointments import AppointmentStatus

    try:
        db = get_db_client()
        logger.info(f"Starting appointment processing: {appointment_id}")

        # Get appointment details
        appointment_result = (
            db.table("appointments")
            .select("*, template_ids")
            .eq("id", appointment_id)
            .single()
            .execute()
        )

        if not appointment_result.data:
            raise ValueError(f"Appointment not found: {appointment_id}")

        appointment = appointment_result.data
        template_ids = appointment.get("template_ids", [])

        if not template_ids:
            raise ValueError(f"No templates assigned to appointment: {appointment_id}")

        # Get all recordings for this appointment
        recordings_result = (
            db.table("recordings")
            .select("*")
            .eq("appointment_id", appointment_id)
            .eq("status", "uploaded")
            .execute()
        )

        if not recordings_result.data:
            raise ValueError(f"No uploaded recordings found for appointment: {appointment_id}")

        recordings = recordings_result.data
        logger.info(f"Found {len(recordings)} recordings to process")

        # Process each recording
        for recording in recordings:
            recording_id = recording["id"]

            # Check if transcript already exists
            transcript_result = (
                db.table("transcripts")
                .select("*")
                .eq("recording_id", recording_id)
                .execute()
            )

            if transcript_result.data and len(transcript_result.data) > 0:
                # Transcript exists
                transcript = transcript_result.data[0]
                logger.info(f"Using existing transcript: {transcript['id']}")
            else:
                # Create and transcribe
                transcript_data = {
                    "recording_id": recording_id,
                    "status": "pending",
                }
                transcript_create_result = (
                    db.table("transcripts").insert(transcript_data).execute()
                )
                transcript = transcript_create_result.data[0]
                logger.info(f"Created transcript: {transcript['id']}")

                # Queue transcription task and wait for it
                transcribe_recording_task.apply_async(
                    args=[transcript["id"], recording_id],
                    countdown=1,
                )
                logger.info(f"Queued transcription task for: {transcript['id']}")

        # Get all completed transcripts
        transcripts_result = (
            db.table("transcripts")
            .select("*")
            .in_("recording_id", [r["id"] for r in recordings])
            .eq("status", "completed")
            .execute()
        )

        if not transcripts_result.data:
            logger.warning("No completed transcripts yet, will need to retry")
            raise self.retry(countdown=60)

        # Get template data
        templates_result = (
            db.table("templates")
            .select("*")
            .in_("id", template_ids)
            .execute()
        )

        if not templates_result.data:
            raise ValueError(f"No templates found for IDs: {template_ids}")

        templates = templates_result.data
        logger.info(f"Found {len(templates)} templates to use")

        # Generate notes for each transcript x template combination
        notes_created = 0
        for transcript in transcripts_result.data:
            for template in templates:
                # Check if note already exists
                existing_note = (
                    db.table("clinical_notes")
                    .select("id")
                    .eq("transcript_id", transcript["id"])
                    .eq("template_id", template["id"])
                    .execute()
                )

                if existing_note.data:
                    logger.info(f"Note already exists, skipping")
                    continue

                # Create note record
                note_data = {
                    "transcript_id": transcript["id"],
                    "template_id": template["id"],
                    "generated_content": "",
                    "status": "draft",
                }
                note_result = db.table("clinical_notes").insert(note_data).execute()
                note = note_result.data[0]

                # Queue note generation task
                generate_note_task.apply_async(
                    args=[note["id"], transcript["content"], template["content"]],
                    countdown=1,
                )
                notes_created += 1
                logger.info(f"Queued note generation for: {note['id']}")

        # Update appointment status to COMPLETED
        db.table("appointments").update(
            {"status": AppointmentStatus.COMPLETED.value}
        ).eq("id", appointment_id).execute()

        audit_logger.log_access(
            user_id=user_id,
            action="process_completed",
            resource_type="appointment",
            resource_id=appointment_id,
            details={
                "recordings_processed": len(recordings),
                "transcripts_created": len(transcripts_result.data),
                "notes_queued": notes_created,
            },
        )

        logger.info(f"Appointment processing completed: {appointment_id}")
        return {
            "success": True,
            "appointment_id": appointment_id,
            "notes_queued": notes_created,
        }

    except Exception as exc:
        logger.error(f"Appointment processing failed: {exc}")
        # Update appointment status to indicate error
        try:
            db = get_db_client()
            db.table("appointments").update(
                {"status": AppointmentStatus.SCHEDULED.value, "notes": f"Processing failed: {str(exc)}"}
            ).eq("id", appointment_id).execute()
        except:
            pass
        raise self.retry(exc=exc, countdown=120)

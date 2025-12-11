"""Transcripts API endpoints."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.api.deps import CurrentUser, DBClient
from app.core.logging import audit_logger
from app.models.transcripts import Transcript, TranscriptStatus

router = APIRouter()


@router.post("/generate/{recording_id}", response_model=Transcript, status_code=status.HTTP_202_ACCEPTED)
async def generate_transcript(
    recording_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
    background_tasks: BackgroundTasks,
) -> Transcript:
    """Start transcript generation for a recording."""
    # Check if recording exists
    recording_result = (
        db.table("recordings")
        .select("*")
        .eq("id", str(recording_id))
        .single()
        .execute()
    )

    if not recording_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found",
        )

    # Check if transcript already exists
    existing = (
        db.table("transcripts")
        .select("*")
        .eq("recording_id", str(recording_id))
        .execute()
    )

    if existing.data:
        return Transcript(**existing.data[0])

    # Create pending transcript record
    transcript_data = {
        "recording_id": str(recording_id),
        "content": "",
        "segments": [],
        "speaker_labels": [],
        "status": TranscriptStatus.PENDING.value,
    }

    result = db.table("transcripts").insert(transcript_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transcript record",
        )

    transcript = Transcript(**result.data[0])

    # Queue transcription job (will be processed by Celery worker)
    from app.services.transcription import process_transcription_task

    background_tasks.add_task(
        process_transcription_task,
        transcript_id=str(transcript.id),
        recording_id=str(recording_id),
    )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="generate",
        resource_type="transcript",
        resource_id=str(transcript.id),
        details={"recording_id": str(recording_id)},
    )

    return transcript


@router.get("/{transcript_id}", response_model=Transcript)
async def get_transcript(
    transcript_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> Transcript:
    """Get a transcript by ID."""
    result = (
        db.table("transcripts")
        .select("*")
        .eq("id", str(transcript_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="read",
        resource_type="transcript",
        resource_id=str(transcript_id),
    )

    return Transcript(**result.data)


@router.get("/recording/{recording_id}", response_model=Transcript)
async def get_transcript_for_recording(
    recording_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> Transcript:
    """Get the transcript for a specific recording."""
    result = (
        db.table("transcripts")
        .select("*")
        .eq("recording_id", str(recording_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found for this recording",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="read",
        resource_type="transcript",
        resource_id=result.data["id"],
    )

    return Transcript(**result.data)


@router.patch("/{transcript_id}", response_model=Transcript)
async def update_transcript(
    transcript_id: UUID,
    content: str,
    current_user: CurrentUser,
    db: DBClient,
) -> Transcript:
    """Update transcript content (for manual corrections)."""
    result = (
        db.table("transcripts")
        .update({"content": content, "word_count": len(content.split())})
        .eq("id", str(transcript_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="update",
        resource_type="transcript",
        resource_id=str(transcript_id),
    )

    return Transcript(**result.data[0])


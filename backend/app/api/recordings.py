"""Recordings API endpoints."""

from uuid import UUID, uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import CurrentUser, DBClient
from app.core.config import settings
from app.core.logging import audit_logger
from app.models.recordings import Recording, RecordingStatus

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/m4a",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",
}


@router.post("/upload/{appointment_id}", response_model=Recording, status_code=status.HTTP_201_CREATED)
async def upload_recording(
    appointment_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
    file: UploadFile = File(...),
) -> Recording:
    """Upload an audio recording for an appointment."""
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check file size
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB",
        )

    # Generate storage path
    recording_id = uuid4()
    storage_path = f"recordings/{appointment_id}/{recording_id}/{file.filename}"

    # Upload to Supabase Storage
    try:
        db.storage.from_("recordings").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )

    # Create recording record
    recording_data = {
        "id": str(recording_id),
        "appointment_id": str(appointment_id),
        "storage_path": storage_path,
        "filename": file.filename,
        "content_type": file.content_type,
        "file_size": file_size,
        "status": RecordingStatus.UPLOADED.value,
    }

    result = db.table("recordings").insert(recording_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create recording record",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="upload",
        resource_type="recording",
        resource_id=str(recording_id),
        details={"filename": file.filename, "size": file_size},
    )

    return Recording(**result.data[0])


@router.get("/{recording_id}", response_model=Recording)
async def get_recording(
    recording_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> Recording:
    """Get a recording by ID."""
    result = (
        db.table("recordings")
        .select("*")
        .eq("id", str(recording_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="read",
        resource_type="recording",
        resource_id=str(recording_id),
    )

    return Recording(**result.data)


@router.get("/appointment/{appointment_id}", response_model=list[Recording])
async def list_recordings_for_appointment(
    appointment_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> list[Recording]:
    """List all recordings for an appointment."""
    result = (
        db.table("recordings")
        .select("*")
        .eq("appointment_id", str(appointment_id))
        .order("created_at", desc=True)
        .execute()
    )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="list",
        resource_type="recording",
        resource_id=str(appointment_id),
        details={"count": len(result.data) if result.data else 0},
    )

    return [Recording(**item) for item in result.data] if result.data else []


@router.delete("/{recording_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recording(
    recording_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> None:
    """Delete a recording (removes from storage and database)."""
    # Get recording first
    result = (
        db.table("recordings")
        .select("*")
        .eq("id", str(recording_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found",
        )

    recording = result.data

    # Delete from storage
    try:
        db.storage.from_("recordings").remove([recording["storage_path"]])
    except Exception:
        pass  # Continue even if storage deletion fails

    # Delete from database
    db.table("recordings").delete().eq("id", str(recording_id)).execute()

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="delete",
        resource_type="recording",
        resource_id=str(recording_id),
    )


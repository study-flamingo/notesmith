"""Clinical notes API endpoints."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, DBClient
from app.core.logging import audit_logger
from app.models.notes import ClinicalNote, NoteCreate, NoteStatus, NoteUpdate

router = APIRouter()


@router.post("/generate", response_model=ClinicalNote, status_code=status.HTTP_202_ACCEPTED)
async def generate_note(
    note_request: NoteCreate,
    current_user: CurrentUser,
    db: DBClient,
    background_tasks: BackgroundTasks,
) -> ClinicalNote:
    """Generate a clinical note from a transcript using a template."""
    # Verify transcript exists and is completed
    transcript_result = (
        db.table("transcripts")
        .select("*")
        .eq("id", str(note_request.transcript_id))
        .single()
        .execute()
    )

    if not transcript_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found",
        )

    if transcript_result.data["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is not yet completed",
        )

    # Verify template exists
    template_result = (
        db.table("templates")
        .select("*")
        .eq("id", str(note_request.template_id))
        .single()
        .execute()
    )

    if not template_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    # Create draft note record
    note_data = {
        "transcript_id": str(note_request.transcript_id),
        "template_id": str(note_request.template_id),
        "generated_content": "",
        "status": NoteStatus.DRAFT.value,
    }

    result = db.table("clinical_notes").insert(note_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create note record",
        )

    note = ClinicalNote(**result.data[0])

    # Queue note generation
    from app.services.note_generator import generate_clinical_note_task

    background_tasks.add_task(
        generate_clinical_note_task,
        note_id=str(note.id),
        transcript_content=transcript_result.data["content"],
        template_content=template_result.data["content"],
    )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="generate",
        resource_type="clinical_note",
        resource_id=str(note.id),
    )

    return note


@router.get("/{note_id}", response_model=ClinicalNote)
async def get_note(
    note_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> ClinicalNote:
    """Get a clinical note by ID."""
    result = (
        db.table("clinical_notes")
        .select("*")
        .eq("id", str(note_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical note not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="read",
        resource_type="clinical_note",
        resource_id=str(note_id),
    )

    return ClinicalNote(**result.data)


@router.get("/transcript/{transcript_id}", response_model=list[ClinicalNote])
async def list_notes_for_transcript(
    transcript_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> list[ClinicalNote]:
    """List all clinical notes for a transcript."""
    result = (
        db.table("clinical_notes")
        .select("*")
        .eq("transcript_id", str(transcript_id))
        .order("created_at", desc=True)
        .execute()
    )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="list",
        resource_type="clinical_note",
        resource_id=str(transcript_id),
    )

    return [ClinicalNote(**item) for item in result.data] if result.data else []


@router.patch("/{note_id}", response_model=ClinicalNote)
async def update_note(
    note_id: UUID,
    note_update: NoteUpdate,
    current_user: CurrentUser,
    db: DBClient,
) -> ClinicalNote:
    """Update a clinical note."""
    update_data = note_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Handle status transitions
    if "status" in update_data:
        if update_data["status"] == NoteStatus.REVIEWED.value:
            update_data["reviewed_by"] = str(current_user.id)
            from datetime import datetime, timezone
            update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        elif update_data["status"] == NoteStatus.FINALIZED.value:
            update_data["finalized_by"] = str(current_user.id)
            from datetime import datetime, timezone
            update_data["finalized_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        db.table("clinical_notes")
        .update(update_data)
        .eq("id", str(note_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical note not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="update",
        resource_type="clinical_note",
        resource_id=str(note_id),
        details={"updated_fields": list(update_data.keys())},
    )

    return ClinicalNote(**result.data[0])


@router.get("/{note_id}/export/{format}")
async def export_note(
    note_id: UUID,
    format: str,
    current_user: CurrentUser,
    db: DBClient,
) -> StreamingResponse:
    """Export a clinical note to PDF or DOCX format."""
    if format not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format must be 'pdf' or 'docx'",
        )

    # Get note
    result = (
        db.table("clinical_notes")
        .select("*")
        .eq("id", str(note_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical note not found",
        )

    note = ClinicalNote(**result.data)
    content = note.final_content or note.generated_content

    from app.services.export import export_to_docx, export_to_pdf

    if format == "pdf":
        file_bytes = export_to_pdf(content, title="Clinical Note")
        media_type = "application/pdf"
        filename = f"clinical_note_{note_id}.pdf"
    else:
        file_bytes = export_to_docx(content, title="Clinical Note")
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"clinical_note_{note_id}.docx"

    # Update status to exported
    db.table("clinical_notes").update({"status": NoteStatus.EXPORTED.value}).eq(
        "id", str(note_id)
    ).execute()

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="export",
        resource_type="clinical_note",
        resource_id=str(note_id),
        details={"format": format},
    )

    return StreamingResponse(
        iter([file_bytes]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


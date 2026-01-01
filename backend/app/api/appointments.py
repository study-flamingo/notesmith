"""Appointments API endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DBClient
from app.core.logging import audit_logger
from app.models.appointments import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    AppointmentUpdate,
)
from app.workers.tasks import process_appointment_task

router = APIRouter()


@router.post("/", response_model=Appointment, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: CurrentUser,
    db: DBClient,
) -> Appointment:
    """Create a new appointment."""
    data = {
        **appointment.model_dump(),
        "practice_id": str(appointment.practice_id),
        "status": AppointmentStatus.SCHEDULED.value,
    }

    result = db.table("appointments").insert(data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create appointment",
        )

    created = result.data[0]
    audit_logger.log_access(
        user_id=str(current_user.id),
        action="create",
        resource_type="appointment",
        resource_id=created["id"],
    )

    return Appointment(**created)


@router.get("/", response_model=list[Appointment])
async def list_appointments(
    current_user: CurrentUser,
    db: DBClient,
    practice_id: UUID | None = None,
    status_filter: AppointmentStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Appointment]:
    """List appointments with optional filtering."""
    query = db.table("appointments").select("*")

    if practice_id:
        query = query.eq("practice_id", str(practice_id))

    if status_filter:
        query = query.eq("status", status_filter.value)

    query = query.order("appointment_date", desc=True).range(offset, offset + limit - 1)
    result = query.execute()

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="list",
        resource_type="appointment",
        resource_id="*",
        details={"count": len(result.data) if result.data else 0},
    )

    return [Appointment(**item) for item in result.data] if result.data else []


@router.get("/{appointment_id}", response_model=Appointment)
async def get_appointment(
    appointment_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> Appointment:
    """Get a specific appointment by ID."""
    result = (
        db.table("appointments")
        .select("*")
        .eq("id", str(appointment_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="read",
        resource_type="appointment",
        resource_id=str(appointment_id),
    )

    return Appointment(**result.data)


@router.patch("/{appointment_id}", response_model=Appointment)
async def update_appointment(
    appointment_id: UUID,
    appointment_update: AppointmentUpdate,
    current_user: CurrentUser,
    db: DBClient,
) -> Appointment:
    """Update an appointment."""
    update_data = appointment_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    result = (
        db.table("appointments")
        .update(update_data)
        .eq("id", str(appointment_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="update",
        resource_type="appointment",
        resource_id=str(appointment_id),
        details={"updated_fields": list(update_data.keys())},
    )

    return Appointment(**result.data[0])


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> None:
    """Delete an appointment (soft delete by setting status to cancelled)."""
    result = (
        db.table("appointments")
        .update({"status": AppointmentStatus.CANCELLED.value})
        .eq("id", str(appointment_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="delete",
        resource_type="appointment",
        resource_id=str(appointment_id),
    )


@router.post("/{appointment_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def process_appointment(
    appointment_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> dict:
    """
    Queue AI processing for an appointment.

    Validates that the appointment has:
    - At least one recording
    - At least one template assigned

    Then queues a background job to transcribe recordings and generate notes.
    """
    # Get the appointment
    appointment_result = (
        db.table("appointments")
        .select("*")
        .eq("id", str(appointment_id))
        .single()
        .execute()
    )

    if not appointment_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    appointment = appointment_result.data

    # Check if appointment has at least one template
    template_ids = appointment.get("template_ids", [])
    if not template_ids or len(template_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment must have at least one template assigned",
        )

    # Check if appointment has at least one recording
    recordings_result = (
        db.table("recordings")
        .select("id")
        .eq("appointment_id", str(appointment_id))
        .execute()
    )

    if not recordings_result.data or len(recordings_result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment must have at least one recording",
        )

    # Update appointment status to IN_PROGRESS
    db.table("appointments").update(
        {"status": AppointmentStatus.IN_PROGRESS.value}
    ).eq("id", str(appointment_id)).execute()

    # Queue the processing task
    task = process_appointment_task.delay(
        appointment_id=str(appointment_id),
        user_id=str(current_user.id),
    )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="process",
        resource_type="appointment",
        resource_id=str(appointment_id),
        details={"task_id": task.id, "template_count": len(template_ids)},
    )

    return {
        "message": "Appointment queued for processing",
        "task_id": task.id,
        "appointment_id": str(appointment_id),
    }

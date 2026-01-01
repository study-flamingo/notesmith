<<<<<<< Updated upstream
"""Appointment models."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from app.models.base import BaseDBModel, BaseSchema


class AppointmentStatus(StrEnum):
    """Appointment status enumeration."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AppointmentCreate(BaseSchema):
    """Schema for creating an appointment."""

    practice_id: UUID
    patient_ref: str  # External patient reference (no PHI stored directly)
    appointment_date: datetime
    notes: str | None = None
    template_ids: list[UUID] = []


class AppointmentUpdate(BaseSchema):
    """Schema for updating an appointment."""

    patient_ref: str | None = None
    appointment_date: datetime | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None
    template_ids: list[UUID] | None = None


class Appointment(BaseDBModel):
    """Appointment model."""

    practice_id: UUID
    patient_ref: str
    appointment_date: datetime
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    notes: str | None = None
    template_ids: list[UUID] = []

=======
"""Appointment models."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from app.models.base import BaseDBModel, BaseSchema


class AppointmentStatus(StrEnum):
    """Appointment status enumeration."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AppointmentCreate(BaseSchema):
    """Schema for creating an appointment."""

    practice_id: UUID
    patient_ref: str  # External patient reference (no PHI stored directly)
    appointment_date: datetime
    notes: str | None = None


class AppointmentUpdate(BaseSchema):
    """Schema for updating an appointment."""

    patient_ref: str | None = None
    appointment_date: datetime | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None


class Appointment(BaseDBModel):
    """Appointment model."""

    practice_id: UUID
    patient_ref: str
    appointment_date: datetime
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    notes: str | None = None

>>>>>>> Stashed changes

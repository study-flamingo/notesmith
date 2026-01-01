"""Recording models."""

from enum import StrEnum
from uuid import UUID

from app.models.base import BaseDBModel, BaseSchema


class RecordingStatus(StrEnum):
    """Recording status enumeration."""

    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    TRANSCRIBED = "transcribed"
    FAILED = "failed"


class RecordingCreate(BaseSchema):
    """Schema for creating a recording."""

    appointment_id: UUID
    filename: str
    content_type: str
    file_size: int


class Recording(BaseDBModel):
    """Recording model."""

    appointment_id: UUID
    storage_path: str
    filename: str
    content_type: str
    file_size: int
    duration_seconds: int | None = None
    status: RecordingStatus = RecordingStatus.UPLOADING


"""Transcript models."""

from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel

from app.models.base import BaseDBModel, BaseSchema


class TranscriptStatus(StrEnum):
    """Transcript status enumeration."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TranscriptSegment(BaseModel):
    """A segment of the transcript with timing and speaker info."""

    start_time: float
    end_time: float
    text: str
    speaker: str | None = None
    confidence: float | None = None


class SpeakerLabel(BaseModel):
    """Speaker identification label."""

    speaker_id: str
    label: str  # e.g., "Dentist", "Patient", "Assistant"


class TranscriptCreate(BaseSchema):
    """Schema for creating a transcript."""

    recording_id: UUID


class Transcript(BaseDBModel):
    """Transcript model."""

    recording_id: UUID
    content: str  # Full transcript text
    segments: list[TranscriptSegment] = []
    speaker_labels: list[SpeakerLabel] = []
    status: TranscriptStatus = TranscriptStatus.PENDING
    language: str = "en"
    word_count: int | None = None


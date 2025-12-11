"""Pydantic models for API request/response validation."""

from app.models.appointments import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    AppointmentUpdate,
)
from app.models.notes import ClinicalNote, NoteCreate, NoteStatus, NoteUpdate
from app.models.recordings import Recording, RecordingCreate, RecordingStatus
from app.models.templates import Template, TemplateCreate, TemplateUpdate
from app.models.transcripts import Transcript, TranscriptSegment, TranscriptStatus
from app.models.users import User, UserCreate, UserRole

__all__ = [
    "Appointment",
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentStatus",
    "Recording",
    "RecordingCreate",
    "RecordingStatus",
    "Transcript",
    "TranscriptSegment",
    "TranscriptStatus",
    "Template",
    "TemplateCreate",
    "TemplateUpdate",
    "ClinicalNote",
    "NoteCreate",
    "NoteUpdate",
    "NoteStatus",
    "User",
    "UserCreate",
    "UserRole",
]


"""Clinical note models."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel

from app.models.base import BaseDBModel, BaseSchema


class NoteStatus(StrEnum):
    """Clinical note status enumeration."""

    DRAFT = "draft"
    GENERATED = "generated"
    REVIEWED = "reviewed"
    FINALIZED = "finalized"
    EXPORTED = "exported"


class ClinicalEntity(BaseModel):
    """Extracted clinical entity from transcript."""

    entity_type: str  # e.g., "procedure", "finding", "medication", "recommendation"
    value: str
    confidence: float | None = None


class AnalysisResult(BaseModel):
    """Result of AI analysis on transcript."""

    chief_complaint: str | None = None
    procedures: list[str] = []
    findings: list[str] = []
    recommendations: list[str] = []
    entities: list[ClinicalEntity] = []
    summary: str | None = None


class NoteCreate(BaseSchema):
    """Schema for creating a clinical note."""

    transcript_id: UUID
    template_id: UUID


class NoteUpdate(BaseSchema):
    """Schema for updating a clinical note."""

    final_content: str | None = None
    status: NoteStatus | None = None


class ClinicalNote(BaseDBModel):
    """Clinical note model."""

    transcript_id: UUID
    template_id: UUID
    generated_content: str
    final_content: str | None = None
    analysis: AnalysisResult | None = None
    status: NoteStatus = NoteStatus.DRAFT
    reviewed_at: datetime | None = None
    reviewed_by: UUID | None = None
    finalized_at: datetime | None = None
    finalized_by: UUID | None = None


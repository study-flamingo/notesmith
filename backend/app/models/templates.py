"""Template models."""

from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel

from app.models.base import BaseDBModel, BaseSchema


class TemplateType(StrEnum):
    """Template type enumeration."""

    SOAP = "soap"  # Subjective, Objective, Assessment, Plan
    DAP = "dap"  # Data, Assessment, Plan
    NARRATIVE = "narrative"
    CUSTOM = "custom"


class TemplateVariable(BaseModel):
    """Variable definition within a template."""

    name: str
    description: str
    required: bool = False
    default_value: str | None = None


class TemplateCreate(BaseSchema):
    """Schema for creating a template."""

    practice_id: UUID | None = None  # None for system templates
    name: str
    description: str | None = None
    template_type: TemplateType = TemplateType.CUSTOM
    content: str  # Template content with placeholders
    variables: list[TemplateVariable] = []


class TemplateUpdate(BaseSchema):
    """Schema for updating a template."""

    name: str | None = None
    description: str | None = None
    content: str | None = None
    variables: list[TemplateVariable] | None = None
    is_active: bool | None = None


class Template(BaseDBModel):
    """Template model."""

    practice_id: UUID | None = None
    name: str
    description: str | None = None
    template_type: TemplateType
    content: str
    variables: list[TemplateVariable] = []
    is_default: bool = False
    is_active: bool = True
    version: int = 1


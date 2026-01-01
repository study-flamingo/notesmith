"""Base model configurations."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class TimestampMixin(BaseModel):
    """Mixin for created_at and updated_at timestamps."""

    created_at: datetime
    updated_at: datetime | None = None


class BaseDBModel(BaseSchema, TimestampMixin):
    """Base model for database entities."""

    id: UUID


"""User models."""

from enum import StrEnum
from uuid import UUID

from pydantic import EmailStr

from app.models.base import BaseDBModel, BaseSchema


class UserRole(StrEnum):
    """User role enumeration."""

    ADMIN = "admin"
    DENTIST = "dentist"
    HYGIENIST = "hygienist"
    ASSISTANT = "assistant"
    STAFF = "staff"


class UserCreate(BaseSchema):
    """Schema for creating a new user."""

    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.STAFF
    practice_id: UUID | None = None


class User(BaseDBModel):
    """User model."""

    email: EmailStr
    full_name: str
    role: UserRole
    practice_id: UUID | None = None
    is_active: bool = True


class UserInDB(User):
    """User model with hashed password (for internal use)."""

    hashed_password: str


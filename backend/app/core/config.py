"""Application configuration."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App settings
    app_name: str = "NoteSmith"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    # Supabase settings
    # Backend uses service role key (secret) for full database access
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    # Note: JWT verification uses JWKS (public keys) fetched from:
    # https://<project>.supabase.co/auth/v1/.well-known/jwks.json
    # No shared secret needed - Supabase uses ES256 asymmetric signing

    # OpenAI settings
    openai_api_key: str = ""

    # Anthropic settings
    anthropic_api_key: str = ""

    # Default LLM provider
    default_llm_provider: Literal["openai", "anthropic", "azure", "ollama"] = "openai"

    # Redis settings (for Celery)
    redis_url: str = "redis://localhost:6379/0"

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000"]

    # Security
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30

    # File upload limits
    max_upload_size_mb: int = 100


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()


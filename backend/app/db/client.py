"""Supabase client configuration."""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# Convenience instance
supabase = get_supabase_client() if settings.supabase_url else None


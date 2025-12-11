"""Security utilities for authentication and authorization."""

import logging
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

logger = logging.getLogger("notesmith.auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cache JWKS for 10 minutes (matches Supabase edge cache)
_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: datetime | None = None
JWKS_CACHE_TTL = timedelta(minutes=10)


def get_jwks() -> dict[str, Any] | None:
    """Fetch JWKS from Supabase Auth endpoint with caching.
    
    Supabase exposes public keys at:
    https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
    """
    global _jwks_cache, _jwks_cache_time
    
    now = datetime.now(timezone.utc)
    
    # Return cached JWKS if still valid
    if _jwks_cache and _jwks_cache_time:
        if now - _jwks_cache_time < JWKS_CACHE_TTL:
            return _jwks_cache
    
    # Fetch fresh JWKS
    if not settings.supabase_url:
        logger.error("SUPABASE_URL is not configured!")
        return None
    
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_cache_time = now
            logger.info(f"Fetched JWKS from Supabase. Keys count: {len(_jwks_cache.get('keys', []))}")
            return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        # Return stale cache if fetch fails
        if _jwks_cache:
            logger.warning("Using stale JWKS cache")
            return _jwks_cache
        return None


def verify_token(token: str) -> dict[str, Any] | None:
    """Verify and decode a Supabase JWT token using JWKS.
    
    Supabase Auth issues JWTs signed with asymmetric keys (ES256 P-256 curve).
    The public keys are available at the JWKS endpoint.
    
    This is the recommended way to verify Supabase JWTs - no shared secret needed!
    """
    jwks = get_jwks()
    
    if not jwks:
        logger.error("Could not fetch JWKS for JWT verification")
        return None
    
    try:
        # Get the key ID from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        alg = unverified_header.get("alg", "ES256")
        
        logger.debug(f"Token header - kid: {kid}, alg: {alg}")
        
        # Find the matching key in JWKS
        key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key = k
                break
        
        if not key:
            logger.error(f"No matching key found in JWKS for kid: {kid}")
            return None
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated"
        )
        
        logger.debug(f"JWT verification successful for user: {payload.get('sub', 'unknown')}")
        return payload
        
    except JWTError as e:
        logger.warning(f"JWT verification failed: {type(e).__name__}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during JWT verification: {e}")
        return None


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token (for internal use, not Supabase Auth)."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

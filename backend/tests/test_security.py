"""Tests for security module - JWKS-based JWT verification."""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from jose import jwt

from app.core.security import (
    get_jwks,
    verify_token,
    create_access_token,
    verify_password,
    get_password_hash,
    JWKS_CACHE_TTL,
)


class TestPasswordHashing:
    """Tests for password hashing utilities."""

    @patch("app.core.security.pwd_context")
    def test_hash_and_verify_password(self, mock_pwd_context):
        """Test that a password can be hashed and verified."""
        password = "secure_password_123"
        mock_pwd_context.hash.return_value = "$2b$12$hashed_password_mock"
        mock_pwd_context.verify.return_value = True
        
        hashed = get_password_hash(password)
        
        assert hashed != password
        mock_pwd_context.hash.assert_called_once_with(password)
        
        result = verify_password(password, hashed)
        assert result is True
        mock_pwd_context.verify.assert_called_once_with(password, hashed)

    @patch("app.core.security.pwd_context")
    def test_verify_wrong_password(self, mock_pwd_context):
        """Test that wrong password fails verification."""
        password = "secure_password_123"
        wrong_password = "wrong_password"
        mock_pwd_context.hash.return_value = "$2b$12$hashed_password_mock"
        
        hashed = get_password_hash(password)
        
        # Verification should return False for wrong password
        mock_pwd_context.verify.return_value = False
        assert verify_password(wrong_password, hashed) is False

    @patch("app.core.security.pwd_context")
    def test_hash_calls_pwd_context(self, mock_pwd_context):
        """Test that get_password_hash calls pwd_context.hash."""
        password = "same_password"
        mock_pwd_context.hash.return_value = "$2b$12$hash_result"
        
        result = get_password_hash(password)
        
        mock_pwd_context.hash.assert_called_once_with(password)
        assert result == "$2b$12$hash_result"

    @patch("app.core.security.pwd_context")
    def test_verify_calls_pwd_context(self, mock_pwd_context):
        """Test that verify_password calls pwd_context.verify."""
        password = "test_password"
        hashed = "$2b$12$stored_hash"
        mock_pwd_context.verify.return_value = True
        
        result = verify_password(password, hashed)
        
        mock_pwd_context.verify.assert_called_once_with(password, hashed)
        assert result is True


class TestAccessToken:
    """Tests for internal access token creation."""

    def test_create_access_token(self):
        """Test creating an access token with default expiry."""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_expiry(self):
        """Test creating an access token with custom expiry."""
        data = {"sub": "user123"}
        expires = timedelta(hours=2)
        token = create_access_token(data, expires_delta=expires)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_access_token_contains_data(self):
        """Test that token can be decoded and contains original data."""
        data = {"sub": "user123", "custom": "value"}
        token = create_access_token(data)
        
        # Decode without verification to check payload
        payload = jwt.get_unverified_claims(token)
        assert payload["sub"] == "user123"
        assert payload["custom"] == "value"
        assert "exp" in payload


class TestJWKS:
    """Tests for JWKS fetching and caching."""

    @patch("app.core.security.httpx.Client")
    @patch("app.core.security.settings")
    def test_get_jwks_success(self, mock_settings, mock_client_class):
        """Test successful JWKS fetch."""
        # Reset cache
        import app.core.security as security_module
        security_module._jwks_cache = None
        security_module._jwks_cache_time = None
        
        mock_settings.supabase_url = "https://test.supabase.co"
        
        mock_response = MagicMock()
        mock_response.json.return_value = {"keys": [{"kid": "key1"}]}
        mock_response.raise_for_status = MagicMock()
        
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client
        
        result = get_jwks()
        
        assert result is not None
        assert "keys" in result
        assert len(result["keys"]) == 1
        mock_client.get.assert_called_once_with(
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )

    @patch("app.core.security.settings")
    def test_get_jwks_no_url(self, mock_settings):
        """Test JWKS fetch fails gracefully when URL not configured."""
        # Reset cache
        import app.core.security as security_module
        security_module._jwks_cache = None
        security_module._jwks_cache_time = None
        
        mock_settings.supabase_url = None
        
        result = get_jwks()
        assert result is None

    @patch("app.core.security.httpx.Client")
    @patch("app.core.security.settings")
    def test_get_jwks_uses_cache(self, mock_settings, mock_client_class):
        """Test that JWKS is cached and reused."""
        import app.core.security as security_module
        
        # Set up cache
        cached_jwks = {"keys": [{"kid": "cached_key"}]}
        security_module._jwks_cache = cached_jwks
        security_module._jwks_cache_time = datetime.now(timezone.utc)
        
        result = get_jwks()
        
        assert result == cached_jwks
        # Should not make HTTP request when cache is valid
        mock_client_class.assert_not_called()

    @patch("app.core.security.httpx.Client")
    @patch("app.core.security.settings")
    def test_get_jwks_cache_expired(self, mock_settings, mock_client_class):
        """Test that expired cache triggers fresh fetch."""
        import app.core.security as security_module
        
        mock_settings.supabase_url = "https://test.supabase.co"
        
        # Set up expired cache
        security_module._jwks_cache = {"keys": [{"kid": "old_key"}]}
        security_module._jwks_cache_time = datetime.now(timezone.utc) - JWKS_CACHE_TTL - timedelta(minutes=1)
        
        mock_response = MagicMock()
        mock_response.json.return_value = {"keys": [{"kid": "new_key"}]}
        mock_response.raise_for_status = MagicMock()
        
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client
        
        result = get_jwks()
        
        assert result is not None
        assert result["keys"][0]["kid"] == "new_key"


class TestVerifyToken:
    """Tests for JWT verification using JWKS."""

    @patch("app.core.security.get_jwks")
    def test_verify_token_no_jwks(self, mock_get_jwks):
        """Test token verification fails gracefully when JWKS unavailable."""
        mock_get_jwks.return_value = None
        
        result = verify_token("some.jwt.token")
        
        assert result is None

    @patch("app.core.security.get_jwks")
    def test_verify_token_no_matching_key(self, mock_get_jwks):
        """Test verification fails when no matching key found."""
        mock_get_jwks.return_value = {"keys": [{"kid": "different_key"}]}
        
        # Create a token with a different kid
        token = jwt.encode(
            {"sub": "user123"},
            "secret",
            algorithm="HS256",
            headers={"kid": "missing_key"}
        )
        
        result = verify_token(token)
        
        assert result is None

    @patch("app.core.security.get_jwks")
    def test_verify_token_invalid_token(self, mock_get_jwks):
        """Test verification fails for malformed token."""
        mock_get_jwks.return_value = {"keys": [{"kid": "key1", "kty": "RSA"}]}
        
        result = verify_token("not.a.valid.token")
        
        assert result is None

    @patch("app.core.security.get_jwks")
    def test_verify_token_empty_string(self, mock_get_jwks):
        """Test verification handles empty token string."""
        mock_get_jwks.return_value = {"keys": [{"kid": "key1"}]}
        
        result = verify_token("")
        
        assert result is None


class TestCacheIntegration:
    """Integration tests for JWKS cache behavior."""

    def test_cache_ttl_constant(self):
        """Test that cache TTL is set to expected value."""
        assert JWKS_CACHE_TTL == timedelta(minutes=10)

    @patch("app.core.security.httpx.Client")
    @patch("app.core.security.settings")
    def test_stale_cache_used_on_fetch_failure(self, mock_settings, mock_client_class):
        """Test that stale cache is used when fresh fetch fails."""
        import app.core.security as security_module
        
        mock_settings.supabase_url = "https://test.supabase.co"
        
        # Set up expired cache
        stale_jwks = {"keys": [{"kid": "stale_key"}]}
        security_module._jwks_cache = stale_jwks
        security_module._jwks_cache_time = datetime.now(timezone.utc) - JWKS_CACHE_TTL - timedelta(minutes=1)
        
        # Make fetch fail
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.side_effect = Exception("Network error")
        mock_client_class.return_value = mock_client
        
        result = get_jwks()
        
        # Should return stale cache on failure
        assert result == stale_jwks


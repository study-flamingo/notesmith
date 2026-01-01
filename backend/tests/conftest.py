"""Pytest configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create mock authentication headers for testing."""
    # In real tests, you'd generate a valid test token
    return {"Authorization": "Bearer test-token"}


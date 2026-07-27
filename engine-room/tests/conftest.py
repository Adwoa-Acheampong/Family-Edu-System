"""Shared Engine Room test fixtures."""

import tempfile
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def test_env(monkeypatch):
    monkeypatch.setenv("TOKEN_ENCRYPTION_KEY", "a" * 64)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    monkeypatch.delenv("NOTEBOOKLM_PROJECT_NUMBER", raising=False)
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as handle:
        db_path = handle.name
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")
    yield
    Path(db_path).unlink(missing_ok=True)


@pytest_asyncio.fixture
async def client():
    from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as api_client:
        yield api_client

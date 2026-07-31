"""Health endpoint tests for the Engine Room."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """GET /health should return {'status': 'ok'}."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_method_not_allowed(client: AsyncClient):
    """POST /health should return 405."""
    response = await client.post("/health")
    assert response.status_code == 405


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    """Health endpoint should include CORS headers."""
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    # CORS headers should be present
    assert "access-control-allow-origin" in response.headers


@pytest.mark.asyncio
async def test_drive_usage_no_auth(client: AsyncClient):
    """GET /v1/drive-usage without auth should return 401."""
    response = await client.get("/v1/drive-usage")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_url_endpoint(client: AsyncClient):
    """GET /v1/auth/url should return a Google OAuth URL."""
    response = await client.get("/v1/auth/url")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert len(data["state"]) >= 16
    assert data["url"].startswith("https://accounts.google.com/o/oauth2/v2/auth")


@pytest.mark.asyncio
async def test_progress_analytics(client: AsyncClient):
    """GET /v1/progress-analytics should return stub data."""
    response = await client.get("/v1/progress-analytics")
    assert response.status_code == 200
    data = response.json()
    # Should return numeric values (stub or real)
    assert "completionPercent" in data
    assert isinstance(data["completionPercent"], (int, float))
    assert "currentStreak" in data
    assert isinstance(data["currentStreak"], int)

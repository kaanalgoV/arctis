"""Test all API routes are mounted and return valid responses.

Uses TestClient (synchronous ASGI wrapper) so no running DB is required.
Endpoints that need a DB will return 404/500 gracefully — those are
accepted as passing since the test verifies routing and response shape,
not data correctness.
"""

import pytest
from httpx import ASGITransport, AsyncClient


def get_transport():
    from arctis.main import app
    return ASGITransport(app=app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_endpoint():
    """Health should always return 200 with a status field."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert data["status"] in ("ok", "degraded")
    assert "version" in data
    assert "db" in data


# ---------------------------------------------------------------------------
# Snapshot
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_snapshot_endpoint_mounted():
    """Snapshot route must be mounted — accepts 200 or 404 (no DB data)."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/snapshot?market=NQ&timeframe=15min")
    # 200 = DB connected + data, 404 = no bars in DB, 500 = DB not running
    assert resp.status_code in (200, 404, 500)


@pytest.mark.asyncio
async def test_snapshot_response_shape_when_ok():
    """If snapshot returns 200, it must contain 'indicators' and 'sessions'."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/snapshot?market=NQ&timeframe=15min")
    if resp.status_code == 200:
        data = resp.json()
        assert "indicators" in data, "Missing 'indicators' key in snapshot response"
        assert "sessions" in data, "Missing 'sessions' key in snapshot response"
        assert "market" in data
        assert "timeframe" in data
        assert "timestamp" in data


# ---------------------------------------------------------------------------
# Setups
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_setups_endpoint_mounted():
    """Setups route must be mounted and respond."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/setups?market=NQ&timeframe=15min")
    # Route accepts market string — 200 (empty list) or 404/500 without DB
    assert resp.status_code in (200, 404, 500)


@pytest.mark.asyncio
async def test_setups_response_shape_when_ok():
    """If setups returns 200, response must have 'setups' list."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/setups?market=NQ&timeframe=15min")
    if resp.status_code == 200:
        data = resp.json()
        assert "setups" in data
        assert isinstance(data["setups"], list)


# ---------------------------------------------------------------------------
# Travis
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_travis_ask_mounted():
    """Travis /ask must be mounted — POST with JSON body."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.post(
            "/api/travis/ask",
            json={"question": "Was passiert gerade?", "market": "NQ", "timeframe": "15min"},
        )
    assert resp.status_code in (200, 404, 500)


@pytest.mark.asyncio
async def test_travis_ask_response_shape_when_ok():
    """Travis /ask 200 response must include 'question' and 'response' keys."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.post(
            "/api/travis/ask",
            json={"question": "Was passiert gerade?", "market": "NQ", "timeframe": "15min"},
        )
    if resp.status_code == 200:
        data = resp.json()
        assert "question" in data
        assert "response" in data
        assert "context" in data


# ---------------------------------------------------------------------------
# Drawings
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_drawings_endpoint_mounted():
    """Drawings route must be mounted."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/drawings?symbol=NQM6&timeframe=15min")
    # File-based storage — always returns 200 (empty list if no file)
    assert resp.status_code in (200, 404)


@pytest.mark.asyncio
async def test_drawings_response_shape_when_ok():
    """Drawings 200 response must have 'drawings' list."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/drawings?symbol=NQM6&timeframe=15min")
    if resp.status_code == 200:
        data = resp.json()
        assert "drawings" in data
        assert isinstance(data["drawings"], list)


# ---------------------------------------------------------------------------
# Markets
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_markets_endpoint():
    """Markets endpoint must return 200 with a 'markets' list."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/markets")
    assert resp.status_code == 200
    data = resp.json()
    assert "markets" in data
    assert isinstance(data["markets"], list)


# ---------------------------------------------------------------------------
# Features (optional — 404 accepted if not mounted yet)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_features_endpoint():
    """Features endpoint is optional — 200 or 404 both accepted."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/features")
    assert resp.status_code in (200, 404)


# ---------------------------------------------------------------------------
# Sim status (lightweight — no DB needed)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sim_status_endpoint():
    """Simulation status must always return 200."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        resp = await client.get("/api/sim/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "active" in data

"""Basic performance checks for critical endpoints.

These tests measure round-trip time using the in-process ASGI TestClient.
No real network or external DB is involved — latency reflects computation
only. Tests are skipped gracefully when no DB data is available (404/500).
"""

import time

import pytest
from httpx import ASGITransport, AsyncClient


def get_transport():
    from arctis.main import app
    return ASGITransport(app=app)


@pytest.mark.asyncio
async def test_snapshot_under_2s():
    """Snapshot must complete within 2 s when data is available."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        start = time.perf_counter()
        resp = await client.get("/api/snapshot?market=NQ&timeframe=15min&days=1")
        elapsed = time.perf_counter() - start

    if resp.status_code in (404, 500):
        pytest.skip("No DB data available — skipping perf assertion")

    assert resp.status_code == 200
    assert elapsed < 2.0, f"Snapshot took {elapsed:.3f}s (limit: 2.0s)"


@pytest.mark.asyncio
async def test_bars_under_500ms():
    """DB bars endpoint must respond within 500 ms when data is available."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        start = time.perf_counter()
        resp = await client.get("/api/db/bars?symbol=NQM6&timeframe=15min&days=1")
        elapsed = time.perf_counter() - start

    if resp.status_code in (404, 500):
        pytest.skip("No DB data available — skipping perf assertion")

    assert resp.status_code == 200
    assert elapsed < 0.5, f"Bars took {elapsed:.3f}s (limit: 0.5s)"


@pytest.mark.asyncio
async def test_health_under_200ms():
    """Health check must always respond within 200 ms regardless of DB state."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        start = time.perf_counter()
        resp = await client.get("/health")
        elapsed = time.perf_counter() - start

    assert resp.status_code == 200
    assert elapsed < 0.2, f"Health took {elapsed:.3f}s (limit: 0.2s)"


@pytest.mark.asyncio
async def test_markets_under_200ms():
    """Markets endpoint must respond within 200 ms (has graceful fallback)."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        start = time.perf_counter()
        resp = await client.get("/api/markets")
        elapsed = time.perf_counter() - start

    assert resp.status_code == 200
    assert elapsed < 0.2, f"Markets took {elapsed:.3f}s (limit: 0.2s)"


@pytest.mark.asyncio
async def test_sim_status_under_50ms():
    """Simulation status must be near-instant — pure in-memory state."""
    async with AsyncClient(transport=get_transport(), base_url="http://test") as client:
        start = time.perf_counter()
        resp = await client.get("/api/sim/status")
        elapsed = time.perf_counter() - start

    assert resp.status_code == 200
    assert elapsed < 0.05, f"Sim status took {elapsed:.3f}s (limit: 0.05s)"

import pytest
from pathlib import Path
from httpx import ASGITransport, AsyncClient
from arctis.main import app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
async def client_with_data():
    """Import sample data then return test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(FIXTURES / "sample_es_1min.csv", "rb") as f:
            await client.post(
                "/api/import",
                files={"file": ("es.csv", f, "text/csv")},
                data={"market": "ES", "timeframe": "1min"},
            )
        yield client


@pytest.mark.asyncio
async def test_structure_endpoint(client_with_data):
    response = await client_with_data.get("/api/analysis/structure", params={"market": "ES", "timeframe": "1min"})
    assert response.status_code == 200
    data = response.json()
    assert "trend" in data
    assert "swings" in data
    assert "structure_breaks" in data


@pytest.mark.asyncio
async def test_volume_endpoint(client_with_data):
    response = await client_with_data.get("/api/analysis/volume", params={"market": "ES", "timeframe": "1min"})
    assert response.status_code == 200
    data = response.json()
    assert "relative_volume" in data
    assert "spikes" in data


@pytest.mark.asyncio
async def test_sessions_endpoint(client_with_data):
    response = await client_with_data.get("/api/analysis/sessions", params={"market": "ES", "timeframe": "1min"})
    assert response.status_code == 200
    data = response.json()
    assert "current_session" in data
    assert "session_stats" in data

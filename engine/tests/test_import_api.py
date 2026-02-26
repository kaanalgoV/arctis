import pytest
from pathlib import Path
from httpx import ASGITransport, AsyncClient

from arctis.main import app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.mark.asyncio
async def test_import_csv():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(FIXTURES / "sample_es_1min.csv", "rb") as f:
            response = await client.post(
                "/api/import",
                files={"file": ("es_1min.csv", f, "text/csv")},
                data={"market": "ES", "timeframe": "1min"},
            )
    assert response.status_code == 200
    data = response.json()
    assert data["bars_imported"] == 10
    assert data["market"] == "ES"


@pytest.mark.asyncio
async def test_import_csv_invalid_market():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with open(FIXTURES / "sample_es_1min.csv", "rb") as f:
            response = await client.post(
                "/api/import",
                files={"file": ("test.csv", f, "text/csv")},
                data={"market": "INVALID", "timeframe": "1min"},
            )
    assert response.status_code == 422

"""Tests for the /api/analysis/bias endpoint."""

import pytest
from pathlib import Path
from httpx import ASGITransport, AsyncClient
from arctis.main import app
from arctis.analysis.bias_state import BiasState

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


@pytest.fixture
async def client_no_data():
    """Return test client with no data imported."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ---------------------------------------------------------------------------
# Happy path with data
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_bias_endpoint_returns_200(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_bias_endpoint_top_level_keys(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    required_keys = {
        "market",
        "timeframe",
        "bar_count",
        "confidence",
        "bias_state",
        "bias_switch_level",
        "velocity",
        "auction_quality",
        "naked_pocs",
        "opening_fake",
        "double_fake",
        "correction",
        "key_levels",
    }
    assert required_keys.issubset(set(data.keys()))


@pytest.mark.asyncio
async def test_bias_state_structure(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    bs = data["bias_state"]
    assert "state" in bs
    assert "score" in bs
    assert "components" in bs
    # state must be one of the 5 valid values
    valid_states = {s.value for s in BiasState}
    assert bs["state"] in valid_states
    # score within range
    assert -10 <= bs["score"] <= 10
    # all five component keys present
    assert set(bs["components"].keys()) == {"trend", "velocity", "auction", "vwap", "ema"}


@pytest.mark.asyncio
async def test_confidence_between_zero_and_one(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    assert 0.0 <= data["confidence"] <= 1.0


@pytest.mark.asyncio
async def test_market_and_timeframe_echoed(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    assert data["market"] == "ES"
    assert data["timeframe"] == "1min"


@pytest.mark.asyncio
async def test_bar_count_positive(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    assert data["bar_count"] > 0


@pytest.mark.asyncio
async def test_key_levels_is_list(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    assert isinstance(data["key_levels"], list)
    # If key_levels are returned, they have the expected fields
    for kl in data["key_levels"]:
        assert "level" in kl
        assert "tests" in kl
        assert "type" in kl
        assert kl["type"] in ("support", "resistance")


@pytest.mark.asyncio
async def test_naked_pocs_is_list(client_with_data):
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    assert isinstance(data["naked_pocs"], list)
    assert len(data["naked_pocs"]) <= 5


# ---------------------------------------------------------------------------
# Response shape: optional fields are None or list
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_opening_fake_field_structure(client_with_data):
    """opening_fake must have the expected sub-fields when not None."""
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    of = data.get("opening_fake")
    if of is not None:
        assert "detected" in of
        assert "direction" in of
        assert "confidence" in of


@pytest.mark.asyncio
async def test_double_fake_field_structure(client_with_data):
    """double_fake must have the expected sub-fields when not None."""
    response = await client_with_data.get(
        "/api/analysis/bias",
        params={"market": "ES", "timeframe": "1min"},
    )
    data = response.json()
    df = data.get("double_fake")
    if df is not None:
        assert "detected" in df
        assert "direction" in df
        assert "confidence" in df

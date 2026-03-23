"""Zones API endpoint — returns all trading zones for a given market/timeframe."""

from fastapi import APIRouter, Query

from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe
from arctis.analysis.zones import calculate_zones

router = APIRouter(prefix="/api/analysis")


def _get_sim():
    from arctis.main import sim
    return sim


def _load_bars(market: Market, timeframe: Timeframe):
    """Load bars, respecting simulation mode."""
    sim = _get_sim()
    if sim.active and sim.market == market.value and sim.timeframe == timeframe.value:
        return sim.get_bars()
    return fetch_bars_as_models(market=market.value, days=30, timeframe=timeframe.value)


@router.get("/zones")
async def get_zones(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Calculate and return all trading zones for the given market/timeframe.

    Returns a list of zone objects. Each zone has:
    - name: human-readable name
    - type: "line" | "area"
    - high / low: price levels
    - color: hex color string
    - opacity: 0.0-1.0 fill opacity
    - start_time: unix timestamp when zone begins
    - end_time: unix timestamp when zone ends (null = extends to present)
    - label: short chart label (e.g. "PDH", "POC", "VA")
    - priority: 1=highest (used for draw order)
    """
    bars = _load_bars(market, timeframe)
    zones = calculate_zones(bars)

    return {
        "zones": [
            {
                "name": z.name,
                "type": z.type,
                "high": z.high,
                "low": z.low,
                "color": z.color,
                "opacity": z.opacity,
                "start_time": z.start_time,
                "end_time": z.end_time,
                "label": z.label,
                "priority": z.priority,
            }
            for z in zones
        ],
        "bar_count": len(bars),
        "zone_count": len(zones),
    }

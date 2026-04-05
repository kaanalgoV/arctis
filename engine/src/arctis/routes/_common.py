"""Shared route helpers — single source of truth for bar loading and sim access."""

import logging
import math
import time

from fastapi import HTTPException


def sanitize_floats(obj):
    """Replace inf/-inf/NaN with None recursively so JSON serialization never fails."""
    if isinstance(obj, float) and (math.isinf(obj) or math.isnan(obj)):
        return None
    if isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize_floats(v) for v in obj]
    return obj

from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe

logger = logging.getLogger(__name__)


def get_sim():
    """Lazy import of the global Simulation singleton from main."""
    from arctis.main import sim
    return sim


def load_bars(market: Market, timeframe: Timeframe, days: int = 30):
    """Load bars from simulation engine or TimescaleDB.

    Source selection:
    - If a simulation is active for this market+timeframe → use sim bars.
    - Otherwise → TimescaleDB.

    Raises HTTPException(404) when no bars are available.
    """
    sim = get_sim()
    if sim.active and sim.market == market.value and sim.timeframe == timeframe.value:
        bars = sim.get_bars()
        logger.debug(
            "load_bars: source=simulation market=%s timeframe=%s bars=%d",
            market.value, timeframe.value, len(bars),
        )
        return bars

    logger.debug(
        "load_bars: source=timescaledb market=%s timeframe=%s days=%d",
        market.value, timeframe.value, days,
    )
    bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
    if not bars:
        raise HTTPException(
            status_code=404,
            detail=f"Keine Bars fuer {market.value} ({timeframe.value}) in der DB gefunden.",
        )
    return bars


def current_timestamp() -> int:
    """Return current timestamp, or simulated time in sim mode."""
    sim = get_sim()
    if sim.active:
        return sim.get_sim_timestamp()
    return int(time.time())

"""Zones and Signals API endpoints — returns trading zones and trade signals."""

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


@router.get("/signals")
async def get_signals(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Detect and return active trade signals based on Travis methodology.

    Signals are filtered by the current 5-state bias. Each signal includes
    entry, stop, target prices, R:R ratio, confidence, and explanation.
    """
    from arctis.analysis.zones import _calculate_value_area, _group_by_day
    from arctis.analysis.bias_state import calculate_bias_state
    from arctis.analysis.structure import detect_swings, classify_trend
    from arctis.analysis.signals import detect_signals
    from arctis.analysis.naked_poc import find_naked_pocs
    from arctis.analysis.key_levels import find_key_levels

    bars = _load_bars(market, timeframe)

    if len(bars) < 50:
        return {"signals": [], "bias": "RANGE", "bias_score": 0}

    # Calculate zones to extract key price levels
    zones = calculate_zones(bars)
    poc: float | None = None
    vah: float | None = None
    val: float | None = None
    prev_high: float | None = None
    prev_low: float | None = None
    or_high: float | None = None
    or_low: float | None = None
    ib_high: float | None = None
    ib_low: float | None = None

    for z in zones:
        if z.label == "POC":
            poc = z.high
        elif z.label == "VA":
            vah = z.high
            val = z.low
        elif z.label == "PDH":
            prev_high = z.high
        elif z.label == "PDL":
            prev_low = z.low
        elif z.label == "OR":
            or_high = z.high
            or_low = z.low
        elif z.label == "IB":
            ib_high = z.high
            ib_low = z.low

    # Determine bias state
    swings = detect_swings(bars)
    trend = classify_trend(swings)
    bias = calculate_bias_state(bars, trend=trend.value)

    # Naked POCs
    try:
        npocs = find_naked_pocs(bars)
        naked_poc_prices = [p.poc_price for p in npocs if p.is_naked]
    except Exception:
        naked_poc_prices = []

    # Key levels
    try:
        kls = find_key_levels(bars)
        kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls]
    except Exception:
        kl_dicts = []

    signals = detect_signals(
        bars,
        bias_state=bias.state.value,
        bias_score=bias.score,
        poc=poc,
        vah=vah,
        val=val,
        prev_high=prev_high,
        prev_low=prev_low,
        or_high=or_high,
        or_low=or_low,
        ib_high=ib_high,
        ib_low=ib_low,
        naked_pocs=naked_poc_prices,
        key_levels=kl_dicts,
    )

    return {
        "signals": [
            {
                "direction": s.direction,
                "type": s.signal_type,
                "entry": s.entry_price,
                "stop": s.stop_price,
                "target": s.target_price,
                "rr": s.risk_reward,
                "confidence": s.confidence,
                "reason": s.reason,
                "timestamp": s.timestamp,
            }
            for s in signals
        ],
        "bias": bias.state.value,
        "bias_score": bias.score,
    }

"""Signals API endpoint — returns detected trade signals."""

from fastapi import APIRouter, HTTPException, Query

from arctis.analysis.signals import detect_signals
from arctis.db import fetch_bars_as_models

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("")
async def get_signals(
    market: str = Query(...),
    timeframe: str = Query(default="1min"),
    days: int = Query(default=5),
    max_bars: int | None = Query(default=None),
):
    """Return detected trade signals.

    If max_bars is set, only the first N bars are analyzed (useful for replay proberun).
    """
    try:
        bars = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
    except (KeyError, RuntimeError) as e:
        raise HTTPException(404, str(e))
    if max_bars is not None and max_bars < len(bars):
        bars = bars[:max_bars]
    signals = detect_signals(bars)
    return {
        "signals": [
            {
                "signal_type": s.signal_type,
                "direction": s.direction,
                "entry_price": s.entry_price,
                "stop_price": s.stop_price,
                "target_price": s.target_price,
                "risk_reward": s.risk_reward,
                "confidence": s.confidence,
                "reason": s.reason,
                "timestamp": s.timestamp,
            }
            for s in signals
        ],
        "bar_count": len(bars),
        "market": market,
    }

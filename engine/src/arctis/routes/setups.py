"""FastAPI router for the /api/setups endpoint.

Returns active setup objects derived from signals, bias state, and confluence
for a given market and timeframe.
"""

from fastapi import APIRouter, HTTPException, Query

from arctis.db import fetch_bars_as_models
from arctis.analysis.setup_engine import detect_setups

router = APIRouter(prefix="/api/setups", tags=["setups"])


@router.get("")
async def get_setups(
    market: str = Query(..., description="Market symbol, e.g. NQH6"),
    timeframe: str = Query(default="1min", description="Bar timeframe"),
    days: int = Query(default=5, ge=1, le=90, description="Lookback in days"),
):
    """Return detected setups with full lifecycle state for a market."""
    try:
        bars = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
    except (KeyError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if not bars:
        return {"setups": [], "count": 0, "market": market}

    # Run analysis modules — each may fail independently without blocking the
    # endpoint; we degrade gracefully.
    signals = []
    bias = None
    confluence = None

    try:
        from arctis.analysis.signals import detect_signals
        signals = detect_signals(bars)
    except Exception:  # noqa: BLE001
        pass

    try:
        from arctis.analysis.bias_state import calculate_bias_state
        bias = calculate_bias_state(bars)
    except Exception:  # noqa: BLE001
        pass

    try:
        from arctis.analysis.confluence import calculate_confluence
        confluence = calculate_confluence(bars, trend="range")
    except Exception:  # noqa: BLE001
        pass

    setups = detect_setups(
        bars,
        bias_state=bias,
        confluence=confluence,
        signals=signals,
    )

    return {
        "setups": [
            {
                "setup_id": s.setup_id,
                "instrument": s.instrument,
                "timeframe": s.timeframe,
                "direction": s.direction,
                "status": s.status.value,
                "setup_type": s.setup_type,
                "thesis": s.thesis,
                "why_now": s.why_now,
                "why_here": s.why_here,
                "invalidation_reason": s.invalidation_reason,
                "entry_zone_low": s.entry_zone_low,
                "entry_zone_high": s.entry_zone_high,
                "entry_trigger_price": s.entry_trigger_price,
                "stop_price": s.stop_price,
                "tp1_price": s.tp1_price,
                "tp2_price": s.tp2_price,
                "risk_reward": s.risk_reward,
                "confidence": s.confidence,
                "evidence": s.evidence,
                "created_ts": s.created_ts,
                "armed_ts": s.armed_ts,
                "entry_ts": s.entry_ts,
                "exit_ts": s.exit_ts,
                "exit_reason": s.exit_reason,
                "source_modules": s.source_modules,
            }
            for s in setups
        ],
        "count": len(setups),
        "market": market,
        "timeframe": timeframe,
    }

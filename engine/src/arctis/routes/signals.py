"""Signals API endpoint — returns detected trade signals."""

import time

from fastapi import APIRouter, HTTPException, Query

from arctis.analysis.signals import detect_signals, _NQ_TICK_SIZE
from arctis.db import fetch_bars_as_models

router = APIRouter(prefix="/api/signals", tags=["signals"])

# Tick size per instrument (add more as needed)
_TICK_SIZE_MAP: dict[str, float] = {
    "NQ": 0.25,
    "MNQ": 0.25,
    "ES": 0.25,
    "MES": 0.25,
}


def _get_tick_size(market: str) -> float:
    """Return tick size for the given market symbol (upper-case prefix match)."""
    upper = market.upper()
    for prefix, size in _TICK_SIZE_MAP.items():
        if upper.startswith(prefix):
            return size
    return _NQ_TICK_SIZE  # default NQ tick size


@router.get("")
async def get_signals(
    market: str = Query(...),
    timeframe: str = Query(default="1min"),
    days: int = Query(default=5),
    max_bars: int | None = Query(default=None),
):
    """Return detected trade signals with precise entry/stop/target prices.

    v3 response includes full precision fields per signal:
      - entry_price:   Exact tick-rounded entry price
      - stop_price:    Exact stop loss price
      - target_price:  Primary target (same as target_1, for backward compat)
      - target_1:      1.5x risk target (tick-rounded)
      - target_2:      2.5x risk target (tick-rounded)
      - risk_ticks:    Stop distance in ticks
      - reward_ticks:  Target_1 distance in ticks
      - rr_ratio:      Reward / Risk
      - reasoning:     Human-readable entry rationale
      - invalidation:  Exact condition that voids the setup
      - expires_bars:  Signal valid for next N bars
      - tick_size:     Instrument tick size used for all calculations

    Response also includes current_price, session, and timestamp so callers
    can verify consistency with /api/analysis/bias and /api/snapshot.

    If max_bars is set, only the first N bars are analyzed (useful for replay).
    """
    try:
        bars = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
    except (KeyError, RuntimeError) as e:
        raise HTTPException(404, str(e))
    if max_bars is not None and max_bars < len(bars):
        bars = bars[:max_bars]

    tick_size = _get_tick_size(market)

    # --- Shared meta: live price + session (single source of truth) ---
    from arctis.routes.live import _last_prices
    from arctis.analysis.sessions import get_current_session
    from arctis.models import FRONT_MONTH, MarketRoot

    # Resolve symbol — market param may be a root (NQ) or contract (NQM6)
    try:
        root = MarketRoot(market.upper())
        resolved_symbol = FRONT_MONTH.get(root, market)
    except ValueError:
        resolved_symbol = market

    live_entry = _last_prices.get(resolved_symbol)
    now = time.time()
    if live_entry:
        current_price = live_entry["price"]
        price_is_live = (now - live_entry["ts"]) < 5.0
        price_age_s = round(now - live_entry["ts"], 1)
    else:
        current_price = bars[-1].close if bars else None
        price_is_live = False
        price_age_s = None

    session_ctx = get_current_session()

    signals = detect_signals(bars, tick_size=tick_size)
    return {
        "signals": [
            {
                # --- backward-compatible fields ---
                "signal_type": s.signal_type,
                "direction": s.direction,
                "entry_price": s.entry_price,
                "stop_price": s.stop_price,
                "target_price": s.target_price,
                "risk_reward": s.risk_reward,
                "confidence": s.confidence,
                "reason": s.reason,
                "timestamp": s.timestamp,
                "session": s.session,
                "confluence_count": s.confluence_count,
                "vwap_aligned": s.vwap_aligned,
                # --- v3 precision fields ---
                "target_1": s.target_1,
                "target_2": s.target_2,
                "risk_ticks": s.risk_ticks,
                "reward_ticks": s.reward_ticks,
                "rr_ratio": s.rr_ratio,
                "reasoning": s.reasoning,
                "invalidation": s.invalidation,
                "expires_bars": s.expires_bars,
                "tick_size": s.tick_size,
            }
            for s in signals
        ],
        "bar_count": len(bars),
        "market": market,
        "tick_size": tick_size,
        # --- Shared meta block ---
        "current_price": round(current_price, 2) if current_price is not None else None,
        "session": session_ctx.value,
        "timestamp": now,
        "price_is_live": price_is_live,
        "price_age_s": price_age_s,
    }

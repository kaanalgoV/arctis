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

    # --- Bias data (so SignalsPanel can show correct bias micro-strip) ---
    try:
        from arctis.analysis.bias_state import calculate_bias_state
        bias_obj = calculate_bias_state(bars)
        bias_state = bias_obj.state.value if hasattr(bias_obj, 'state') else str(bias_obj.state) if hasattr(bias_obj, 'state') else "RANGE"
        bias_score = getattr(bias_obj, 'score', 0)
    except Exception:
        bias_state = "RANGE"
        bias_score = 0

    # --- Extract zone levels for signal generation (same as zones route) ---
    from arctis.analysis.zones import calculate_zones, _calculate_value_area, _group_by_day

    zones = calculate_zones(bars, market=market)
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

    # --- Naked POCs ---
    naked_poc_prices: list[float] = []
    try:
        from arctis.analysis.naked_poc import find_naked_pocs
        npocs = find_naked_pocs(bars)
        naked_poc_prices = [p.poc_price for p in npocs if p.is_naked]
    except Exception:
        pass

    # --- Key levels ---
    kl_dicts: list[dict] = []
    try:
        from arctis.analysis.key_levels import find_key_levels
        kls = find_key_levels(bars)
        kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls]
    except Exception:
        pass

    # --- VWAP (latest value from session-anchored VWAP) ---
    vwap_val: float | None = None
    try:
        from arctis.analysis.vwap import calculate_vwap
        vwap_data_list = calculate_vwap(bars)
        if vwap_data_list:
            vwap_val = vwap_data_list[-1].vwap
    except Exception:
        pass

    signals = detect_signals(
        bars,
        bias_state=bias_state,
        bias_score=bias_score,
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
        vwap=vwap_val,
        tick_size=tick_size,
        market_root=market.upper()[:2],
    )

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
        "bias": bias_state,
        "bias_state": bias_state,
        "bias_score": bias_score,
        # --- Shared meta block ---
        "current_price": round(current_price, 2) if current_price is not None else None,
        "session": session_ctx.value,
        "timestamp": now,
        "price_is_live": price_is_live,
        "price_age_s": price_age_s,
    }

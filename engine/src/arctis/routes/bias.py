"""BIAS analysis API endpoint — combines all BIAS modules."""

import time

from fastapi import APIRouter, HTTPException, Query
from arctis.models import Market, Timeframe, resolve_symbol
from arctis.routes._common import load_bars as _load_bars
from arctis.analysis.sessions import classify_session, get_current_session
from arctis.analysis.market_context import build_market_context
from arctis.routes._common import sanitize_floats as _sanitize_floats

router = APIRouter(prefix="/api/analysis")


# ---------------------------------------------------------------------------
# Live price helper
# ---------------------------------------------------------------------------

def _get_live_price(market: Market) -> float | None:
    """Return the latest tick price for the front-month contract of a market.

    Falls back to None when Rithmic is not connected or the symbol has not
    been ticked yet.  Uses FRONT_MONTH mapping to resolve e.g. NQ -> NQM6.
    """
    try:
        from arctis.routes.live import _last_prices
        symbol = resolve_symbol(market)
        p = _last_prices.get(symbol)
        if p:
            return float(p["price"])
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Bias helper utilities
# ---------------------------------------------------------------------------

def _price_vs_vwap_detail(price: float, vwap: float) -> tuple[str, str]:
    """Return (position_key, human_label) describing price relative to VWAP.

    Uses 0.1% threshold to distinguish "weit_oben"/"weit_unten".
    """
    diff_pct = (price - vwap) / vwap * 100.0
    if diff_pct > 0.2:
        return "above", f"Price well above VWAP {vwap:.2f}"
    elif diff_pct > 0.0:
        return "above", f"Price above VWAP {vwap:.2f}"
    elif diff_pct < -0.2:
        return "below", f"Price well below VWAP {vwap:.2f}"
    elif diff_pct < 0.0:
        return "below", f"Price below VWAP {vwap:.2f}"
    else:
        return "at", f"Price at VWAP {vwap:.2f}"


def _price_vs_ema_reasoning(price: float, ema9: float, ema21: float) -> list[str]:
    """Build reasoning strings for price position relative to EMA9/21."""
    reasons = []
    if price > ema9 and price > ema21:
        reasons.append(f"Price above EMA9 ({ema9:.2f}) and EMA21 ({ema21:.2f}) — strong bull")
    elif price > ema9:
        reasons.append(f"Price above EMA9 ({ema9:.2f}), below EMA21 ({ema21:.2f}) — mixed")
    elif price > ema21:
        reasons.append(f"Price above EMA21 ({ema21:.2f}), below EMA9 ({ema9:.2f}) — mixed")
    else:
        reasons.append(f"Price below EMA9 ({ema9:.2f}) and EMA21 ({ema21:.2f}) — strong bear")
    return reasons


def _price_vs_ema_alignment(price: float, ema9: float, ema21: float) -> str:
    """Return ema_alignment string accounting for live price position."""
    if price > ema9 and price > ema21 and ema9 > ema21:
        return "bullish"
    elif price > ema9 and price > ema21:
        return "slightly_bullish"
    elif price < ema9 and price < ema21 and ema9 < ema21:
        return "bearish"
    elif price < ema9 and price < ema21:
        return "slightly_bearish"
    else:
        return "mixed"


def _momentum_score_and_reason(bars: list, n: int = 5) -> tuple[int, str]:
    """Compute 5-bar momentum: count of up-closes minus down-closes.

    Returns (signed score -2..+2, human label).
    """
    recent = bars[-n:] if len(bars) >= n else bars
    up = sum(1 for b in recent if b.close > b.open)
    down = sum(1 for b in recent if b.close < b.open)
    net = up - down
    total = len(recent)
    if total == 0:
        return 0, "No momentum data"

    if net >= 4:
        return 2, f"Strong upward momentum ({up}/{total} up bars)"
    elif net >= 2:
        return 1, f"Moderate upward momentum ({up}/{total} up bars)"
    elif net <= -4:
        return -2, f"Strong downward momentum ({down}/{total} down bars)"
    elif net <= -2:
        return -1, f"Moderate downward momentum ({down}/{total} down bars)"
    else:
        return 0, f"Neutral momentum ({up} up / {down} down in last {total} bars)"


def _volume_context_reason(bars: list, n: int = 5) -> str:
    """Compare average volume of last n/2 bars vs prior n/2 bars."""
    if len(bars) < n:
        return "Insufficient bars for volume context"
    half = n // 2
    recent_vol = sum(b.volume for b in bars[-half:]) / half
    prior_vol = sum(b.volume for b in bars[-(n):-half]) / half
    if prior_vol == 0:
        return "Volume context unavailable"
    ratio = recent_vol / prior_vol
    if ratio > 1.3:
        return f"Increasing volume ({ratio:.1f}x) — confirms momentum"
    elif ratio < 0.7:
        return f"Decreasing volume ({ratio:.1f}x) — doubts momentum"
    else:
        return f"Stable volume ({ratio:.1f}x) — neutral context"


def _pdh_pdl_context(
    price: float,
    prev_high: float | None,
    prev_low: float | None,
    proximity_pct: float = 0.1,
) -> tuple[list[str], str | None]:
    """Analyse price proximity to Previous Day High / Low.

    Returns (reasoning_list, key_level_if_near).
    """
    reasons = []
    key_level = None
    if prev_high and prev_low:
        range_size = prev_high - prev_low
        threshold = range_size * proximity_pct

        dist_pdh = abs(price - prev_high)
        dist_pdl = abs(price - prev_low)

        if dist_pdh <= threshold:
            reasons.append(f"Near PDH {prev_high:.2f} — resistance zone")
            key_level = prev_high
        elif price > prev_high:
            reasons.append(f"Price above PDH {prev_high:.2f} — breakout territory")
            key_level = prev_high

        if dist_pdl <= threshold:
            reasons.append(f"Near PDL {prev_low:.2f} — support zone")
            if key_level is None:
                key_level = prev_low
        elif price < prev_low:
            reasons.append(f"Price below PDL {prev_low:.2f} — breakdown territory")
            if key_level is None:
                key_level = prev_low

    return reasons, key_level


def _poc_context(price: float, poc: float | None) -> tuple[str, str | None]:
    """Determine price position relative to POC.

    Returns (vwap_position_hint_for_score, reasoning_string).
    """
    if poc is None:
        return "at", None
    if price > poc:
        return "above", f"Price above POC {poc:.2f} — bullish value area"
    elif price < poc:
        return "below", f"Price below POC {poc:.2f} — bearish value area"
    else:
        return "at", f"Price at POC {poc:.2f} — fair value"


def _build_invalidation(
    direction: str,
    vwap: float | None,
    ema21: float | None,
    prev_low: float | None,
    prev_high: float | None,
) -> str:
    """Return a concrete invalidation sentence for the current bias direction."""
    if direction in ("bullish", "long"):
        if vwap:
            return f"Bias invalidated on close below VWAP {vwap:.2f}"
        if ema21:
            return f"Bias invalidated on close below EMA21 {ema21:.2f}"
        if prev_low:
            return f"Bias invalidated on break below PDL {prev_low:.2f}"
        return "Bias invalidated on loss of nearest support"
    elif direction in ("bearish", "short"):
        if vwap:
            return f"Bias invalidated on close above VWAP {vwap:.2f}"
        if ema21:
            return f"Bias invalidated on close above EMA21 {ema21:.2f}"
        if prev_high:
            return f"Bias invalidated on break above PDH {prev_high:.2f}"
        return "Bias invalidated on break above nearest resistance"
    else:
        return "Bias invalidated on directional breakout beyond PDH or PDL"


def _state_to_direction(state_value: str) -> str:
    """Map BiasState string to plain direction label."""
    mapping = {
        "LONG": "bullish",
        "RANGE_LONG": "bullish",
        "RANGE": "neutral",
        "RANGE_SHORT": "bearish",
        "SHORT": "bearish",
    }
    return mapping.get(state_value.upper(), "neutral")


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.get("/bias")
async def get_daily_bias(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Return combined BIAS analysis.

    Reacts to live tick prices when Rithmic is connected.  Falls back to the
    last bar close when no live price is available, so the endpoint is always
    functional regardless of connection state.
    """
    try:
        bars = _load_bars(market, timeframe)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der BIAS-Daten: {e}")

    if not bars:
        return {"error": "No data available"}

    # ------------------------------------------------------------------
    # 1. Current price — prefer live tick, fall back to last bar close
    # ------------------------------------------------------------------
    live_price = _get_live_price(market)
    last_bar_close = bars[-1].close
    current_price = live_price if live_price is not None else last_bar_close
    price_source = "live_tick" if live_price is not None else "last_bar_close"

    # ------------------------------------------------------------------
    # 2. Session — derived from sim time during replay, wall clock otherwise
    # ------------------------------------------------------------------
    from arctis.routes._common import get_sim, current_timestamp as _current_timestamp
    _sim = get_sim()
    _sim_active = _sim.active and _sim.market == market.value
    current_session = get_current_session(override_ts=_current_timestamp() if _sim_active else None)
    current_session_str = current_session.value

    # ------------------------------------------------------------------
    # 2b. Build shared MarketContext — single source of truth for price,
    #     session, and levels.  Populated with indicator data after step 4.
    # ------------------------------------------------------------------
    # (ctx is built after indicators are computed — see step 4b below)

    # ------------------------------------------------------------------
    # 3. Import all BIAS modules
    # ------------------------------------------------------------------
    from arctis.analysis.velocity import calculate_velocity
    from arctis.analysis.auction import calculate_auction_quality
    from arctis.analysis.naked_poc import find_naked_pocs
    from arctis.analysis.bias_state import calculate_bias_state
    from arctis.analysis.bias_switch import calculate_bias_switch
    from arctis.analysis.opening_fake import detect_opening_fake
    from arctis.analysis.double_fake import detect_double_fake
    from arctis.analysis.correction import monitor_correction
    from arctis.analysis.key_levels import find_key_levels
    from arctis.analysis.structure import detect_swings, classify_trend
    from arctis.analysis.indicators import calculate_ema_ribbon
    from arctis.analysis.vwap import calculate_vwap
    from arctis.analysis.volume_profile import calculate_session_levels

    # ------------------------------------------------------------------
    # 4. Compute all indicators
    # ------------------------------------------------------------------
    swings = detect_swings(bars)
    trend = classify_trend(swings)

    velocity_list = calculate_velocity(bars)
    latest_velocity = velocity_list[-1] if velocity_list else None

    auction = calculate_auction_quality(bars)

    naked_pocs = find_naked_pocs(bars)

    ema_list = calculate_ema_ribbon(bars)
    latest_ema = ema_list[-1] if ema_list else None

    vwap_list = calculate_vwap(bars)
    latest_vwap = vwap_list[-1] if vwap_list else None

    session_levels = calculate_session_levels(bars)
    prev_high = session_levels.prev_high if session_levels else None
    prev_low = session_levels.prev_low if session_levels else None

    # 4b. Build shared context now that indicators are ready
    from arctis.analysis.volume_profile import build_volume_profile
    vol_profile = build_volume_profile(bars)
    _ctx = build_market_context(
        market=market,
        timeframe=timeframe.value,
        bars=bars,
        indicators={
            "vwap_list": vwap_list,
            "ema_list": ema_list,
            "vol_profile": vol_profile,
            "session_levels": session_levels,
        },
    )

    # POC from today's session profile
    today_poc: float | None = None
    if naked_pocs:
        # First naked POC entry that is naked (most recent day)
        for p in naked_pocs:
            if p.is_naked:
                today_poc = p.poc_price
                break

    # ------------------------------------------------------------------
    # 5. Live-reactive position calculations (use current_price)
    # ------------------------------------------------------------------
    reasoning: list[str] = []

    # 5a. Price vs VWAP
    vwap_value = latest_vwap.vwap if latest_vwap else None
    if vwap_value:
        vwap_position, vwap_reason = _price_vs_vwap_detail(current_price, vwap_value)
        reasoning.append(vwap_reason)
    else:
        vwap_position = "at"
        vwap_value = None

    # 5b. Price vs EMA9/21 — override static alignment with live-reactive check
    ema9_value: float | None = latest_ema.ema9 if latest_ema else None
    ema21_value: float | None = latest_ema.ema21 if latest_ema else None

    if ema9_value is not None and ema21_value is not None:
        ema_alignment = _price_vs_ema_alignment(current_price, ema9_value, ema21_value)
        reasoning.extend(_price_vs_ema_reasoning(current_price, ema9_value, ema21_value))
    else:
        ema_alignment = latest_ema.alignment if latest_ema else "mixed"

    # 5c. PDH / PDL proximity
    pdh_pdl_reasons, pdh_pdl_key_level = _pdh_pdl_context(current_price, prev_high, prev_low)
    reasoning.extend(pdh_pdl_reasons)

    # 5d. POC context (adds colour but not scored separately — informational)
    poc_position_hint, poc_reason = _poc_context(current_price, today_poc)
    if poc_reason:
        reasoning.append(poc_reason)

    # 5e. 5-bar momentum
    momentum_score, momentum_reason = _momentum_score_and_reason(bars, n=5)
    reasoning.append(momentum_reason)

    # 5f. Volume context
    vol_reason = _volume_context_reason(bars, n=6)
    reasoning.append(vol_reason)

    # ------------------------------------------------------------------
    # 6. Session weighting for velocity
    # ------------------------------------------------------------------
    _rth_sessions = {"ny_open", "midday", "afternoon", "power_hour"}
    _velocity_scale_raw = latest_velocity.signed_scale if latest_velocity else 0
    velocity_scale_weighted = (
        _velocity_scale_raw
        if current_session_str in _rth_sessions
        else _velocity_scale_raw // 2
    )

    # Apply momentum as an additional tilt to velocity for live reactivity
    effective_velocity = max(-10, min(10, velocity_scale_weighted + momentum_score))

    # ------------------------------------------------------------------
    # 7. Bias State (5-state) — uses live-reactive inputs
    # ------------------------------------------------------------------
    bias = calculate_bias_state(
        bars=bars,
        trend=trend.value,
        velocity_scale=effective_velocity,
        auction_quality=auction.quality_label if auction else "moderat",
        vwap_position=vwap_position,
        ema_alignment=ema_alignment,
    )

    # ------------------------------------------------------------------
    # 8. Determine direction, preferred/avoid, key level, invalidation
    # ------------------------------------------------------------------
    direction = _state_to_direction(bias.state.value)

    # Key level: prefer VWAP, then PDH/PDL proximity, then EMA21
    if vwap_value:
        key_level = vwap_value
    elif pdh_pdl_key_level:
        key_level = pdh_pdl_key_level
    elif ema21_value:
        key_level = ema21_value
    else:
        key_level = None

    invalidation = _build_invalidation(
        direction,
        vwap=vwap_value,
        ema21=ema21_value,
        prev_low=prev_low,
        prev_high=prev_high,
    )

    if direction == "bullish":
        preferred_direction = "long"
        avoid_direction = "short"
    elif direction == "bearish":
        preferred_direction = "short"
        avoid_direction = "long"
    else:
        preferred_direction = "neutral"
        avoid_direction = "counter-trend"

    # Session-specific context
    session_context = {
        "ny_open": "NY Open — high volatility, wait for first 5-min confirmation",
        "midday": "Midday — low liquidity, avoid chasing",
        "afternoon": "Afternoon — watch for trend continuation or reversal",
        "power_hour": "Power Hour — MOC flows, elevated volume",
        "premarket": "Pre-Market — thin liquidity, levels less reliable",
        "after_hours": "After Hours — thin, avoid counter-trend",
        "overnight": "Overnight — globex session, levels carry less weight",
    }.get(current_session_str)
    if session_context:
        reasoning.append(session_context)

    # ------------------------------------------------------------------
    # 9. Bias Switch Level / Opening Fake / Double Fake / Correction
    # ------------------------------------------------------------------
    switch_level = calculate_bias_switch(bars)
    prev_high_val = prev_high or 0
    prev_low_val = prev_low or 0

    opening_fake = detect_opening_fake(bars, prev_high=prev_high_val, prev_low=prev_low_val)

    double_fake = None
    if switch_level:
        double_fake = detect_double_fake(bars, level=switch_level.level)

    correction = monitor_correction(bars)
    key_levels = find_key_levels(bars)

    # ------------------------------------------------------------------
    # 10. Confidence: normalized score from -10..+10 to 0..1
    # ------------------------------------------------------------------
    confidence = round((bias.score + 10) / 20.0, 4)

    # ------------------------------------------------------------------
    # 11. Assemble response — ADD new fields, keep all existing fields
    # ------------------------------------------------------------------
    return _sanitize_floats({
        "market": market.value,
        "timeframe": timeframe.value,
        "bar_count": len(bars),
        # ----- Shared meta block (same across all endpoints) -----
        "current_price": round(current_price, 2),
        "session": current_session_str,
        "is_rth": _ctx.is_rth,
        "timestamp": _ctx.timestamp,
        "price_is_live": _ctx.price_is_live,
        "price_age_s": round(_ctx.price_age_s, 1) if _ctx.price_age_s != float("inf") else None,
        # ----- Actionable summary -----
        "direction": direction,
        "confidence": confidence,
        "score": bias.score,
        "price_source": price_source,
        "key_level": round(key_level, 2) if key_level else None,
        "invalidation": invalidation,
        "reasoning": reasoning,
        "preferred_direction": preferred_direction,
        "avoid_direction": avoid_direction,
        # ----- Detailed bias_state block (backwards compat) -----
        "bias_state": {
            "state": bias.state.value,
            "score": bias.score,
            "components": bias.components,
            "session": current_session_str,
        },
        "bias_switch_level": {
            "level": switch_level.level,
            "type": switch_level.type,
            "confidence": switch_level.confidence,
            "description": switch_level.description,
        } if switch_level else None,
        "velocity": {
            "current": latest_velocity.velocity,
            "average": latest_velocity.avg_velocity,
            "ratio": latest_velocity.ratio,
            "scale": latest_velocity.scale,
            "signed_scale": latest_velocity.signed_scale,
        } if latest_velocity else None,
        "auction_quality": {
            "score": auction.quality_score,
            "label": auction.quality_label,
            "type": auction.auction_type,
        } if auction else None,
        "naked_pocs": [
            {"date": p.date, "price": p.poc_price, "naked": p.is_naked, "distance": p.distance}
            for p in naked_pocs[:5]
        ],
        "opening_fake": {
            "detected": opening_fake.detected,
            "direction": opening_fake.direction,
            "confidence": opening_fake.confidence,
        } if opening_fake else None,
        "double_fake": {
            "detected": double_fake.detected,
            "direction": double_fake.direction,
            "confidence": double_fake.confidence,
        } if double_fake else None,
        "correction": {
            "impulse_size": correction.impulse_size,
            "correction_pct": correction.correction_pct,
            "is_threat": correction.is_threat,
            "direction": correction.impulse_direction,
        } if correction else None,
        "key_levels": [
            {"level": kl.level, "tests": kl.test_count, "type": kl.type}
            for kl in sorted(key_levels, key=lambda kl: abs(kl.level - current_price))[:10]
        ],
        # ----- Indicator context (new, informational) -----
        "indicators": {
            "vwap": round(vwap_value, 2) if vwap_value else None,
            "ema9": round(ema9_value, 2) if ema9_value else None,
            "ema21": round(ema21_value, 2) if ema21_value else None,
            "prev_day_high": round(prev_high, 2) if prev_high else None,
            "prev_day_low": round(prev_low, 2) if prev_low else None,
            "poc": round(today_poc, 2) if today_poc else None,
            "ema_alignment": ema_alignment,
            "vwap_position": vwap_position,
        },
    })

"""Unified analysis snapshot endpoint.

Returns all analysis data in a single response. All sub-analyses share the
same bar-load AND the same MarketContext, so there are no race conditions and
no contradictions between panels.

Individual endpoints remain unchanged and fully operational.
"""

import asyncio
import logging
import time
import threading

from fastapi import APIRouter, HTTPException, Query, Request

from arctis.models import Market, Timeframe
from arctis.routes._common import load_bars as _load_bars, current_timestamp as _current_timestamp
from arctis.analysis.market_context import build_market_context, MarketContext

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["snapshot"])

# ---------------------------------------------------------------------------
# Stale request tracking — prevents older snapshot requests from completing
# when the user has already switched to a different market.
# ---------------------------------------------------------------------------
_latest_snapshot_request: dict[str, float] = {}
_snapshot_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Internal helpers — each mirrors what the individual route handler does,
# but accepts pre-loaded bars so the DB is only hit once.
# ---------------------------------------------------------------------------


def _build_sessions(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.sessions import get_session_context, get_today_session_stats

    # current_session uses real wall-clock time — never stale bar timestamps
    ctx   = get_session_context()
    stats = get_today_session_stats(bars)

    return {
        "market": market,
        "timeframe": timeframe,
        # Real-time session context
        "current_session":  ctx["current_session"],
        "session_start_et": ctx["session_start_et"],
        "session_end_et":   ctx["session_end_et"],
        "session_progress": ctx["session_progress"],
        "next_session":     ctx["next_session"],
        "time_to_next":     ctx["time_to_next"],
        "is_rth":           ctx["is_rth"],
        "current_time_et":  ctx["current_time_et"],
        # Today's stats only
        "today_only": True,
        "session_stats": {
            session.value: {
                "bar_count":    st.bar_count,
                "avg_volume":   round(st.avg_volume, 1),
                "avg_range":    round(st.avg_range, 4),
                "total_volume": st.total_volume,
            }
            for session, st in stats.items()
        },
        "bar_count": len(bars),
    }


def _build_indicators(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
    from arctis.analysis.volume_profile import (
        build_daily_volume_profiles,
        build_volume_profile,
        calculate_session_levels,
    )
    from arctis.analysis.vwap import calculate_vwap

    vwap_list = calculate_vwap(bars)
    ema_list = calculate_ema_ribbon(bars)
    rsi_list = calculate_rsi(bars)
    vol_profile = build_volume_profile(bars)
    daily_profiles = build_daily_volume_profiles(bars)
    session_lvls = calculate_session_levels(bars)

    return {
        "market": market,
        "timeframe": timeframe,
        "vwap": [
            {
                "timestamp": v.timestamp,
                "vwap": v.vwap,
                "upper_1": v.upper_1,
                "lower_1": v.lower_1,
                "upper_2": v.upper_2,
                "lower_2": v.lower_2,
            }
            for v in vwap_list
        ],
        "ema": [
            {
                "timestamp": e.timestamp,
                "ema9": e.ema9,
                "ema21": e.ema21,
                "ema50": e.ema50,
                "alignment": e.alignment,
            }
            for e in ema_list
        ],
        "rsi": [
            {"timestamp": r.timestamp, "rsi": r.rsi, "divergence": r.divergence}
            for r in rsi_list
        ],
        "volume_profile": {
            "poc": vol_profile.poc,
            "vah": vol_profile.vah,
            "val": vol_profile.val,
            "total_volume": vol_profile.total_volume,
        }
        if vol_profile
        else None,
        "daily_volume_profiles": [
            {
                "date": dp.date,
                "poc": dp.poc,
                "vah": dp.vah,
                "val": dp.val,
                "total_volume": dp.total_volume,
            }
            for dp in daily_profiles
        ],
        "session_levels": {
            "prev_high": session_lvls.prev_high,
            "prev_low": session_lvls.prev_low,
            "prev_close": session_lvls.prev_close,
            "prev_poc": session_lvls.prev_poc,
            "overnight_high": session_lvls.overnight_high,
            "overnight_low": session_lvls.overnight_low,
            "opening_range_high": session_lvls.opening_range_high,
            "opening_range_low": session_lvls.opening_range_low,
        },
    }


def _build_confluence(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.confluence import calculate_confluence
    from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
    from arctis.analysis.structure import classify_trend, detect_swings
    from arctis.analysis.volume import detect_volume_spikes
    from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels
    from arctis.analysis.vwap import calculate_vwap

    swings = detect_swings(bars)
    trend = classify_trend(swings)
    vwap_list = calculate_vwap(bars)
    ema_list = calculate_ema_ribbon(bars)
    rsi_list = calculate_rsi(bars)
    vol_profile = build_volume_profile(bars)
    session_lvls = calculate_session_levels(bars)
    spikes = detect_volume_spikes(bars)

    latest_vwap = None
    if vwap_list:
        v = vwap_list[-1]
        latest_vwap = {
            "vwap": v.vwap,
            "upper_1": v.upper_1,
            "lower_1": v.lower_1,
            "upper_2": v.upper_2,
            "lower_2": v.lower_2,
        }

    latest_ema = None
    if ema_list:
        e = ema_list[-1]
        latest_ema = {"ema9": e.ema9, "ema21": e.ema21, "ema50": e.ema50, "alignment": e.alignment}

    latest_rsi = None
    if rsi_list:
        r = rsi_list[-1]
        latest_rsi = {"rsi": r.rsi, "divergence": r.divergence}

    vp_dict = None
    if vol_profile:
        vp_dict = {"poc": vol_profile.poc, "vah": vol_profile.vah, "val": vol_profile.val}

    sl_dict = None
    if session_lvls:
        sl_dict = {
            "prev_high": session_lvls.prev_high,
            "prev_low": session_lvls.prev_low,
            "prev_close": session_lvls.prev_close,
            "opening_range_high": session_lvls.opening_range_high,
            "opening_range_low": session_lvls.opening_range_low,
        }

    spike_dicts = [{"ratio": sp.ratio} for sp in spikes[-3:]] if spikes else []

    result = calculate_confluence(
        bars=bars,
        trend=trend.value,
        vwap_data=latest_vwap,
        ema_data=latest_ema,
        rsi_data=latest_rsi,
        volume_profile=vp_dict,
        session_levels=sl_dict,
        volume_spikes=spike_dicts,
    )

    return {
        "market": market,
        "timeframe": timeframe,
        "score": result.score,
        "max_score": result.max_score,
        "direction": result.direction,
        "confidence": result.confidence,
        "signals": [
            {"name": s.name, "direction": s.direction, "strength": s.strength, "detail": s.detail}
            for s in result.signals
        ],
        "indicators": {
            "vwap": latest_vwap,
            "ema": latest_ema,
            "rsi": latest_rsi,
            "volume_profile": vp_dict,
            "session_levels": sl_dict,
        },
    }


def _build_patterns(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.indicators import calculate_rsi
    from arctis.analysis.patterns import detect_patterns
    from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels
    from arctis.analysis.vwap import calculate_vwap

    vwap_list = calculate_vwap(bars)
    rsi_list = calculate_rsi(bars)
    vol_profile = build_volume_profile(bars)
    session_lvls = calculate_session_levels(bars)

    latest_vwap = None
    if vwap_list:
        v = vwap_list[-1]
        latest_vwap = {
            "vwap": v.vwap,
            "upper_1": v.upper_1,
            "lower_1": v.lower_1,
            "upper_2": v.upper_2,
            "lower_2": v.lower_2,
        }

    latest_rsi = None
    if rsi_list:
        r = rsi_list[-1]
        latest_rsi = {"rsi": r.rsi, "divergence": r.divergence}

    vp_dict = None
    if vol_profile:
        vp_dict = {"poc": vol_profile.poc, "vah": vol_profile.vah, "val": vol_profile.val}

    sl_dict = None
    if session_lvls:
        sl_dict = {
            "prev_high": session_lvls.prev_high,
            "prev_low": session_lvls.prev_low,
            "prev_close": session_lvls.prev_close,
            "opening_range_high": session_lvls.opening_range_high,
            "opening_range_low": session_lvls.opening_range_low,
        }

    result = detect_patterns(
        bars=bars,
        vwap_data=latest_vwap,
        rsi_data=latest_rsi,
        volume_profile=vp_dict,
        session_levels=sl_dict,
    )

    return {
        "annotations": [
            {
                "timestamp": a.timestamp,
                "pattern": a.pattern,
                "direction": a.direction,
                "text": a.text,
                "detail": a.detail,
                "confidence": a.confidence,
                "win_rate": a.win_rate,
                "profit_factor": a.profit_factor,
                "sample_size": a.sample_size,
                "category": a.category,
                "price": a.price,
                "target": a.target,
                "marker_type": a.marker_type,
                "color": a.color,
                "expiry_days": a.expiry_days,
            }
            for a in result.annotations
        ],
        "day_type": result.day_type,
        "day_bias": result.day_bias,
    }


def _build_volume(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.volume import detect_volume_spikes, relative_volume

    rvol = relative_volume(bars)
    spikes = detect_volume_spikes(bars)

    return {
        "market": market,
        "timeframe": timeframe,
        "relative_volume": [
            {"index": i, "timestamp": bars[i].timestamp, "rvol": v}
            for i, v in enumerate(rvol)
            if v is not None
        ],
        "spikes": [
            {
                "index": sp.index,
                "timestamp": sp.timestamp,
                "volume": sp.volume,
                "ratio": round(sp.ratio, 2),
            }
            for sp in spikes
        ],
        "bar_count": len(bars),
    }


def _build_structure(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.structure import classify_trend, detect_structure_breaks, detect_swings

    swings = detect_swings(bars)
    trend = classify_trend(swings)
    breaks = detect_structure_breaks(swings)

    recent_breaks = sorted(breaks, key=lambda b: b.index, reverse=True)[:30]
    recent_breaks.reverse()

    return {
        "market": market,
        "timeframe": timeframe,
        "trend": trend.value,
        "swings": [
            {"type": sw.type.value, "price": sw.price, "index": sw.index, "timestamp": sw.timestamp}
            for sw in swings[-50:]
        ],
        "structure_breaks": [
            {
                "type": b.break_type,
                "direction": b.direction,
                "price": b.price,
                "index": b.index,
                "timestamp": b.timestamp,
            }
            for b in recent_breaks
        ],
        "bar_count": len(bars),
    }


def _build_bias(bars, market: str, timeframe: str, ctx: "MarketContext | None" = None) -> dict:
    from arctis.analysis.auction import calculate_auction_quality
    from arctis.analysis.bias_state import calculate_bias_state
    from arctis.analysis.bias_switch import calculate_bias_switch
    from arctis.analysis.correction import monitor_correction
    from arctis.analysis.double_fake import detect_double_fake
    from arctis.analysis.indicators import calculate_ema_ribbon
    from arctis.analysis.key_levels import find_key_levels
    from arctis.analysis.naked_poc import find_naked_pocs
    from arctis.analysis.opening_fake import detect_opening_fake
    from arctis.analysis.structure import classify_trend, detect_swings
    from arctis.analysis.velocity import calculate_velocity
    from arctis.analysis.volume_profile import calculate_session_levels
    from arctis.analysis.vwap import calculate_vwap

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

    # Use shared context price when available (live tick), else last bar close
    if ctx is not None:
        ref_price = ctx.current_price if ctx.current_price is not None else (bars[-1].close if bars else 0)
        if ctx.vwap is not None:
            if ref_price > ctx.vwap:
                vwap_position = "above"
            elif ref_price < ctx.vwap:
                vwap_position = "below"
            else:
                vwap_position = "at"
        else:
            vwap_position = "at"
    else:
        last_close = bars[-1].close if bars else 0
        vwap_position = "at"
        if latest_vwap and last_close > latest_vwap.vwap:
            vwap_position = "above"
        elif latest_vwap and last_close < latest_vwap.vwap:
            vwap_position = "below"

    ema_alignment = latest_ema.alignment if latest_ema else "mixed"

    bias = calculate_bias_state(
        bars=bars,
        trend=trend.value,
        velocity_scale=latest_velocity.signed_scale if latest_velocity else 0,
        auction_quality=auction.quality_label if auction else "moderat",
        vwap_position=vwap_position,
        ema_alignment=ema_alignment,
    )

    switch_level = calculate_bias_switch(bars)

    session_levels = calculate_session_levels(bars)
    prev_high = (session_levels.prev_high if session_levels and session_levels.prev_high is not None else 0) or 0
    prev_low = (session_levels.prev_low if session_levels and session_levels.prev_low is not None else 0) or 0

    opening_fake = detect_opening_fake(bars, prev_high=prev_high, prev_low=prev_low) if prev_high and prev_low else None

    double_fake = None
    if switch_level:
        double_fake = detect_double_fake(bars, level=switch_level.level)

    correction = monitor_correction(bars)
    key_levels = find_key_levels(bars)

    return {
        "market": market,
        "timeframe": timeframe,
        "bar_count": len(bars),
        "confidence": round((bias.score + 10) / 20.0, 4),
        "bias_state": {
            "state": bias.state.value,
            "score": bias.score,
            "components": bias.components,
        },
        "bias_switch_level": {
            "level": switch_level.level,
            "type": switch_level.type,
            "confidence": switch_level.confidence,
            "description": switch_level.description,
        }
        if switch_level
        else None,
        "velocity": {
            "current": latest_velocity.velocity,
            "average": latest_velocity.avg_velocity,
            "ratio": latest_velocity.ratio,
            "scale": latest_velocity.scale,
            "signed_scale": latest_velocity.signed_scale,
        }
        if latest_velocity
        else None,
        "auction_quality": {
            "score": auction.quality_score,
            "label": auction.quality_label,
            "type": auction.auction_type,
        }
        if auction
        else None,
        "naked_pocs": [
            {"date": p.date, "price": p.poc_price, "naked": p.is_naked, "distance": p.distance}
            for p in naked_pocs[:5]
        ],
        "opening_fake": {
            "detected": opening_fake.detected,
            "direction": opening_fake.direction,
            "confidence": opening_fake.confidence,
        }
        if opening_fake
        else None,
        "double_fake": {
            "detected": double_fake.detected,
            "direction": double_fake.direction,
            "confidence": double_fake.confidence,
        }
        if double_fake
        else None,
        "correction": {
            "impulse_size": correction.impulse_size,
            "correction_pct": correction.correction_pct,
            "is_threat": correction.is_threat,
            "direction": correction.impulse_direction,
        }
        if correction
        else None,
        "key_levels": [
            {"level": kl.level, "tests": kl.test_count, "type": kl.type}
            for kl in key_levels[:10]
        ],
    }


def _build_zones(bars, market: str, timeframe: str) -> dict:
    from arctis.analysis.zones import calculate_zones

    zones = calculate_zones(bars, market=market)

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


def _build_signals(bars, market: str, timeframe: str, ctx: "MarketContext | None" = None) -> dict:
    from arctis.analysis.bias_state import calculate_bias_state
    from arctis.analysis.key_levels import find_key_levels
    from arctis.analysis.naked_poc import find_naked_pocs
    from arctis.analysis.signals import detect_signals
    from arctis.analysis.structure import classify_trend, detect_swings
    from arctis.analysis.vwap import calculate_vwap
    from arctis.analysis.zones import calculate_zones

    if len(bars) < 50:
        return {"signals": [], "bias": "RANGE", "bias_score": 0}

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

    swings = detect_swings(bars)
    trend = classify_trend(swings)
    bias = calculate_bias_state(bars, trend=trend.value)

    try:
        npocs = find_naked_pocs(bars)
        naked_poc_prices = [p.poc_price for p in npocs if p.is_naked]
    except Exception:
        naked_poc_prices = []

    try:
        kls = find_key_levels(bars)
        kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls]
    except Exception:
        kl_dicts = []

    # Compute VWAP — use MarketContext if available, otherwise calculate fresh.
    # This was previously missing, causing VWAP MR signals and VWAP-aligned
    # daily breakouts to NEVER fire (vwap was always None).
    latest_vwap: float | None = None
    if ctx is not None and ctx.vwap is not None:
        latest_vwap = ctx.vwap
    else:
        try:
            vwap_list = calculate_vwap(bars)
            if vwap_list:
                latest_vwap = vwap_list[-1].vwap
        except Exception:
            latest_vwap = None

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
        vwap=latest_vwap,
        market_root=market[:2].upper() if market else "NQ",
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


# ---------------------------------------------------------------------------
# Consistency check helper
# ---------------------------------------------------------------------------


def _build_consistency(ctx: MarketContext, bias_result: dict | None, signals_result: dict | None) -> dict:
    """Validate that the response data is internally coherent.

    All checks compare against the shared MarketContext so they refer to the
    same price, session, and levels as every other part of the response.
    """
    now = time.time()

    # 1. Price freshness
    price_is_live = ctx.price_is_live

    # 2. Session currency — compare ctx session against wall clock
    from arctis.analysis.sessions import get_current_session
    wall_session = get_current_session().value
    session_is_current = ctx.session == wall_session

    # 3. Bias direction matches price vs VWAP
    bias_matches_price = True
    if bias_result and ctx.vwap is not None and ctx.current_price is not None:
        bias_state = (bias_result.get("bias_state") or {}).get("state", "RANGE")
        price_above_vwap = ctx.current_price > ctx.vwap
        if bias_state in ("LONG", "RANGE_LONG") and not price_above_vwap:
            bias_matches_price = False
        elif bias_state in ("SHORT", "RANGE_SHORT") and price_above_vwap:
            bias_matches_price = False

    # 4. Signal directions align with bias
    signals_match_bias = True
    if bias_result and signals_result:
        bias_state = (bias_result.get("bias_state") or {}).get("state", "RANGE")
        signal_list = signals_result.get("signals", [])
        if signal_list and bias_state not in ("RANGE",):
            bias_dir = "long" if "LONG" in bias_state else "short"
            contradictory = [s for s in signal_list if s.get("direction") != bias_dir]
            # More than half the signals contradicting bias is a consistency failure
            if len(contradictory) > len(signal_list) / 2:
                signals_match_bias = False

    return {
        "bias_matches_price": bias_matches_price,
        "signals_match_bias": signals_match_bias,
        "session_is_current": session_is_current,
        "price_is_live": price_is_live,
    }


# ---------------------------------------------------------------------------
# Async wrappers so asyncio.gather can run them concurrently in the thread pool
# ---------------------------------------------------------------------------


async def _run(fn, *args):
    """Run a synchronous analysis function in the default executor."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, fn, *args)


# ---------------------------------------------------------------------------
# Snapshot endpoint
# ---------------------------------------------------------------------------


@router.get("/snapshot")
async def get_analysis_snapshot(
    request: Request,
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.MIN_15),
    days: int = Query(default=5, ge=1, le=365),
):
    """Return all analysis data in a single atomic response.

    All sub-analyses share the same bars AND the same MarketContext.
    This guarantees that current_price, session, and key levels are
    identical in every section of the response.

    Runs all sub-analyses concurrently. If one sub-analysis fails its key
    will be null and the error message is recorded under ``errors``.

    This endpoint is additive — existing individual endpoints are unchanged.
    """
    market_str = market.value
    timeframe_str = timeframe.value

    # Register this request as the latest for its market key.
    # If a newer request arrives for the same market before this one finishes,
    # the stale one will return 204 No Content instead of overwriting newer data.
    request_ts = time.time()
    snapshot_key = f"{market_str}:{timeframe_str}"
    with _snapshot_lock:
        _latest_snapshot_request[snapshot_key] = request_ts

    # Load bars once — shared across all sub-analyses.
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Laden der Bars fuer Snapshot: {exc}",
        )

    # Build the shared MarketContext — single source of truth for price/session/levels.
    # Pre-compute indicators here so _build_bias and _build_signals can reuse them.
    try:
        from arctis.analysis.vwap import calculate_vwap
        from arctis.analysis.indicators import calculate_ema_ribbon
        from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels

        _vwap_list = calculate_vwap(bars)
        _ema_list = calculate_ema_ribbon(bars)
        _vol_profile = build_volume_profile(bars)
        _session_levels = calculate_session_levels(bars)

        ctx = build_market_context(
            market=market,
            timeframe=timeframe_str,
            bars=bars,
            indicators={
                "vwap_list": _vwap_list,
                "ema_list": _ema_list,
                "vol_profile": _vol_profile,
                "session_levels": _session_levels,
            },
        )
    except Exception as exc:
        logger.warning("MarketContext build failed, using minimal fallback: %s", exc)
        ctx = None

    # Run all sub-analyses concurrently.
    # _build_bias and _build_signals receive ctx so they use the same price/session.
    keys = ["sessions", "indicators", "confluence", "patterns", "volume", "structure", "bias", "zones", "signals"]

    results = await asyncio.gather(
        _run(_build_sessions, bars, market_str, timeframe_str),
        _run(_build_indicators, bars, market_str, timeframe_str),
        _run(_build_confluence, bars, market_str, timeframe_str),
        _run(_build_patterns, bars, market_str, timeframe_str),
        _run(_build_volume, bars, market_str, timeframe_str),
        _run(_build_structure, bars, market_str, timeframe_str),
        _run(_build_bias, bars, market_str, timeframe_str, ctx),
        _run(_build_zones, bars, market_str, timeframe_str),
        _run(_build_signals, bars, market_str, timeframe_str, ctx),
        return_exceptions=True,
    )

    # Abort if a newer request for the same market arrived while we were computing.
    with _snapshot_lock:
        if _latest_snapshot_request.get(snapshot_key, 0) > request_ts:
            logger.info(
                "Snapshot for %s aborted — superseded by newer request",
                snapshot_key,
            )
            from fastapi.responses import Response
            return Response(status_code=204)

    # Also abort if the client disconnected.
    if await request.is_disconnected():
        logger.info("Snapshot for %s aborted — client disconnected", snapshot_key)
        from fastapi.responses import Response
        return Response(status_code=204)

    errors: dict[str, str] = {}

    # Shared meta block — same values seen in /api/analysis/bias and /api/signals
    now = time.time()
    meta: dict = {
        "market": market_str,
        "timeframe": timeframe_str,
        "timestamp": now,
        # Fields from shared context (None if ctx build failed)
        "current_price": round(ctx.current_price, 2) if ctx and ctx.current_price else None,
        "session": ctx.session if ctx else None,
        "is_rth": ctx.is_rth if ctx else None,
        "price_is_live": ctx.price_is_live if ctx else False,
        "price_age_s": round(ctx.price_age_s, 1) if ctx and ctx.price_age_s != float("inf") else None,
    }
    payload: dict = {**meta}

    for key, result in zip(keys, results):
        if isinstance(result, Exception):
            logger.warning("Snapshot sub-analysis '%s' failed: %s", key, result)
            payload[key] = None
            errors[key] = str(result)
        else:
            payload[key] = result

    # Consistency check — validates the response is internally coherent
    if ctx is not None:
        payload["consistency"] = _build_consistency(
            ctx,
            bias_result=payload.get("bias"),
            signals_result=payload.get("signals"),
        )

    payload["errors"] = errors
    return payload

"""Analysis API endpoints."""

import logging
import time

from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.discipline import DisciplineContext, generate_warnings
from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
from arctis.analysis.patterns import detect_patterns
from arctis.analysis.sessions import (
    classify_session,
    get_current_session,
    get_recent_transition,
    get_session_context,
    get_session_stats,
    get_today_session_stats,
)
from arctis.analysis.structure import classify_trend, detect_structure_breaks, detect_swings
from arctis.analysis.volume import detect_volume_spikes, relative_volume
from arctis.analysis.volume_profile import build_daily_volume_profiles, build_volume_profile, calculate_session_levels
from arctis.analysis.vwap import calculate_vwap
from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe, FRONT_MONTH, resolve_symbol

router = APIRouter(prefix="/api/analysis")


from arctis.routes._common import get_sim as _get_sim, load_bars as _load_bars, current_timestamp as _current_timestamp


def _shared_meta(market: Market, bars: list) -> dict:
    """Return the shared meta block included in every analysis response.

    Guarantees that current_price, session, timestamp are derived from the
    same sources as /api/analysis/bias and /api/signals.
    """
    from arctis.routes.live import _last_prices

    symbol = resolve_symbol(market)
    now = time.time()
    live_entry = _last_prices.get(symbol)

    if live_entry:
        current_price = live_entry["price"]
        price_is_live = (now - live_entry["ts"]) < 5.0
        price_age_s = round(now - live_entry["ts"], 1)
    else:
        current_price = bars[-1].close if bars else None
        price_is_live = False
        price_age_s = None

    session_ctx = get_current_session()

    return {
        "current_price": round(current_price, 2) if current_price is not None else None,
        "session": session_ctx.value,
        "timestamp": now,
        "price_is_live": price_is_live,
        "price_age_s": price_age_s,
    }


@router.get("/structure")
async def analyze_structure(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
    lookback: int = Query(default=15, ge=2, le=50),
):
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Strukturdaten: {e}")

    swings = detect_swings(bars, lookback=lookback)
    trend = classify_trend(swings)
    breaks = detect_structure_breaks(swings)

    # Only return the most recent 30 breaks (markante Strukturpunkte)
    recent_breaks = sorted(breaks, key=lambda b: b.index, reverse=True)[:30]
    recent_breaks.reverse()

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
        "trend": trend.value,
        "swings": [
            {"type": sw.type.value, "price": sw.price, "index": sw.index, "timestamp": sw.timestamp}
            for sw in swings[-50:]  # last 50 swings only
        ],
        "structure_breaks": [
            {"type": b.break_type, "direction": b.direction, "price": b.price, "index": b.index, "timestamp": b.timestamp}
            for b in recent_breaks
        ],
        "bar_count": len(bars),
    }


@router.get("/volume")
async def analyze_volume(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
    period: int = Query(default=20, ge=5, le=100),
    spike_sigma: float = Query(default=2.0, ge=1.0, le=5.0),
):
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Volumendaten: {e}")

    rvol = relative_volume(bars, period=period)
    spikes = detect_volume_spikes(bars, period=period, threshold_sigma=spike_sigma)

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
        "relative_volume": [
            {"index": i, "timestamp": bars[i].timestamp, "rvol": v}
            for i, v in enumerate(rvol) if v is not None
        ],
        "spikes": [
            {"index": sp.index, "timestamp": sp.timestamp, "volume": sp.volume, "ratio": round(sp.ratio, 2)}
            for sp in spikes
        ],
        "bar_count": len(bars),
    }


@router.get("/sessions")
async def analyze_sessions(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
    today_only: bool = Query(default=True, description="Show only today's session stats (ET date)"),
):
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Session-Daten: {e}")

    # current_session uses real wall-clock time — never stale bar timestamps
    ctx   = get_session_context()
    stats = get_today_session_stats(bars) if today_only else get_session_stats(bars)

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
        # Real-time session context
        "current_session":   ctx["current_session"],
        "session_start_et":  ctx["session_start_et"],
        "session_end_et":    ctx["session_end_et"],
        "session_progress":  ctx["session_progress"],
        "next_session":      ctx["next_session"],
        "time_to_next":      ctx["time_to_next"],
        "is_rth":            ctx["is_rth"],
        "current_time_et":   ctx["current_time_et"],
        # Transition alert: set within 5 minutes after a session boundary crossing.
        "recent_transition": ctx["recent_transition"],
        # Stats (today or multi-day depending on today_only param)
        "today_only": today_only,
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


@router.get("/warnings")
async def get_warnings(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
):
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Warnung-Daten: {e}")

    swings = detect_swings(bars)
    trend = classify_trend(swings)
    # Always use real wall-clock time for the current session
    current_session = get_current_session()

    ctx = DisciplineContext(
        trend=trend,
        session=current_session.value,
        risk_used_pct=0.0,
        trade_count=0,
        max_trades=10,
        consecutive_losses=0,
    )
    warnings = generate_warnings(ctx)

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
        "warnings": [{"message": w.message, "severity": w.severity.value} for w in warnings],
    }


@router.get("/indicators")
async def get_indicators(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int | None = Query(default=None, ge=1, le=365),
):
    """Return VWAP, EMA, RSI, Volume Profile, Session Levels."""
    # Auto-select days based on timeframe to keep response size reasonable
    if days is None:
        tf_days = {"1min": 5, "5min": 14, "15min": 30, "30min": 30, "1h": 60}
        days = tf_days.get(timeframe.value, 30)
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Indikatoren: {e}")

    vwap_list = calculate_vwap(bars)
    ema_list = calculate_ema_ribbon(bars)
    rsi_list = calculate_rsi(bars)
    vol_profile = build_volume_profile(bars)
    daily_profiles = build_daily_volume_profiles(bars)
    session_lvls = calculate_session_levels(bars)

    # Send ALL indicator points so VWAP/EMA cover the entire chart range.
    vwap_out = vwap_list
    ema_out = ema_list
    rsi_out = rsi_list

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
        "vwap": [
            {"timestamp": v.timestamp, "vwap": v.vwap, "upper_1": v.upper_1, "lower_1": v.lower_1, "upper_2": v.upper_2, "lower_2": v.lower_2}
            for v in vwap_out
        ],
        "ema": [
            {"timestamp": e.timestamp, "ema9": e.ema9, "ema21": e.ema21, "ema50": e.ema50, "alignment": e.alignment}
            for e in ema_out
        ],
        "rsi": [
            {"timestamp": r.timestamp, "rsi": r.rsi, "divergence": r.divergence}
            for r in rsi_out
        ],
        "volume_profile": {
            "poc": vol_profile.poc,
            "vah": vol_profile.vah,
            "val": vol_profile.val,
            "total_volume": vol_profile.total_volume,
        } if vol_profile else None,
        "daily_volume_profiles": [
            {"date": dp.date, "poc": dp.poc, "vah": dp.vah, "val": dp.val, "total_volume": dp.total_volume}
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


@router.get("/confluence")
async def get_confluence(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
):
    """Return confluence score combining all indicators."""
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Confluence-Daten: {e}")

    # Calculate all indicators
    swings = detect_swings(bars)
    trend = classify_trend(swings)
    vwap_list = calculate_vwap(bars)
    ema_list = calculate_ema_ribbon(bars)
    rsi_list = calculate_rsi(bars)
    vol_profile = build_volume_profile(bars)
    session_lvls = calculate_session_levels(bars)
    spikes = detect_volume_spikes(bars)

    # Get latest values
    latest_vwap = None
    if vwap_list:
        v = vwap_list[-1]
        latest_vwap = {"vwap": v.vwap, "upper_1": v.upper_1, "lower_1": v.lower_1, "upper_2": v.upper_2, "lower_2": v.lower_2}

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
            "prev_high": session_lvls.prev_high, "prev_low": session_lvls.prev_low,
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
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
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


@router.get("/patterns")
async def get_patterns(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
):
    """Detect statistical trading patterns and return chart annotations.

    Annotations persist for 3 days. Each annotation includes pattern name,
    direction, confidence, win rate (from published research), and chart marker info.
    """
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Pattern-Daten: {e}")

    # Calculate all needed indicators
    vwap_list = calculate_vwap(bars)
    ema_list = calculate_ema_ribbon(bars)
    rsi_list = calculate_rsi(bars)
    vol_profile = build_volume_profile(bars)
    session_lvls = calculate_session_levels(bars)

    latest_vwap = None
    if vwap_list:
        v = vwap_list[-1]
        latest_vwap = {"vwap": v.vwap, "upper_1": v.upper_1, "lower_1": v.lower_1, "upper_2": v.upper_2, "lower_2": v.lower_2}

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
            "prev_high": session_lvls.prev_high, "prev_low": session_lvls.prev_low,
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
        "market": market.value,
        "timeframe": timeframe.value,
        **_shared_meta(market, bars),
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

"""Analysis API endpoints."""

import logging
import time

from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.discipline import DisciplineContext, generate_warnings
from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
from arctis.analysis.patterns import detect_patterns
from arctis.analysis.sessions import classify_session, get_session_stats
from arctis.analysis.structure import classify_trend, detect_structure_breaks, detect_swings
from arctis.analysis.volume import detect_volume_spikes, relative_volume
from arctis.analysis.volume_profile import build_daily_volume_profiles, build_volume_profile, calculate_session_levels
from arctis.analysis.vwap import calculate_vwap
from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api/analysis")


def _get_sim():
    from arctis.main import sim
    return sim


def _load_bars(market: Market, timeframe: Timeframe, days: int = 30):
    """Load bars from simulation engine or TimescaleDB.

    Source selection is explicit and logged:
    - If a simulation is active for this market+timeframe → use sim bars.
    - Otherwise → use TimescaleDB. No silent ParquetStore fallback.

    The ParquetStore fallback was removed because stale parquet files silently
    overrode live DB data, creating a second source of truth and data integrity
    issues. If you need parquet for testing, do so explicitly at the call site.
    """
    sim = _get_sim()
    if sim.active and sim.market == market and sim.timeframe == timeframe:
        bars = sim.get_bars()
        logger.debug(
            "_load_bars: source=simulation market=%s timeframe=%s bars=%d",
            market.value, timeframe.value, len(bars),
        )
        return bars

    logger.debug(
        "_load_bars: source=timescaledb market=%s timeframe=%s days=%d",
        market.value, timeframe.value, days,
    )
    bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
    if not bars:
        raise HTTPException(
            status_code=404,
            detail=f"Keine Bars fuer {market.value} ({timeframe.value}) in der DB gefunden.",
        )
    return bars


def _current_timestamp() -> int:
    """Return current timestamp, or simulated time in sim mode."""
    sim = _get_sim()
    if sim.active:
        return sim.get_sim_timestamp()
    return int(time.time())


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
):
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Session-Daten: {e}")

    stats = get_session_stats(bars)
    # Use last bar's timestamp as data context; fall back to wall-clock only if no bars available
    ref_ts = bars[-1].timestamp if bars else _current_timestamp()
    current = classify_session(ref_ts)

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        "current_session": current.value,
        "session_stats": {
            session.value: {
                "bar_count": st.bar_count,
                "avg_volume": round(st.avg_volume, 1),
                "avg_range": round(st.avg_range, 4),
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
    # Use last bar's timestamp as data context; fall back to wall-clock only if no bars available
    ref_ts = bars[-1].timestamp if bars else _current_timestamp()
    current_session = classify_session(ref_ts)

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
        "warnings": [{"message": w.message, "severity": w.severity.value} for w in warnings],
    }


@router.get("/indicators")
async def get_indicators(
    market: Market = Query(...),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    days: int = Query(default=30, ge=1, le=365),
):
    """Return VWAP, EMA, RSI, Volume Profile, Session Levels."""
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

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        "vwap": [
            {"timestamp": v.timestamp, "vwap": v.vwap, "upper_1": v.upper_1, "lower_1": v.lower_1, "upper_2": v.upper_2, "lower_2": v.lower_2}
            for v in vwap_list
        ],
        "ema": [
            {"timestamp": e.timestamp, "ema9": e.ema9, "ema21": e.ema21, "ema50": e.ema50, "alignment": e.alignment}
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

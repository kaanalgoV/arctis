"""BIAS analysis API endpoint — combines all BIAS modules."""

from fastapi import APIRouter, HTTPException, Query
from arctis.models import Market, Timeframe
from arctis.db import fetch_bars_as_models

router = APIRouter(prefix="/api/analysis")


def _get_sim():
    from arctis.main import sim
    return sim


def _load_bars(market: Market, timeframe: Timeframe, days: int = 30):
    """Load bars from simulation engine or TimescaleDB.

    In replay/simulation mode the sim engine is the authoritative source so
    that all analysis endpoints — including bias and probability — reflect the
    replayed context rather than live DB data.
    """
    sim = _get_sim()
    if sim.active and sim.market == market and sim.timeframe == timeframe:
        return sim.get_bars()

    bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
    if not bars:
        raise HTTPException(
            status_code=404,
            detail=f"Keine Bars fuer {market.value} ({timeframe.value}) in der DB gefunden.",
        )
    return bars


@router.get("/bias")
async def get_daily_bias(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Return combined BIAS analysis."""
    try:
        bars = _load_bars(market, timeframe)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der BIAS-Daten: {e}")

    if not bars:
        return {"error": "No data available"}

    # Import all BIAS modules
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

    # Structure
    swings = detect_swings(bars)
    trend = classify_trend(swings)

    # Velocity
    velocity_list = calculate_velocity(bars)
    latest_velocity = velocity_list[-1] if velocity_list else None

    # Auction Quality
    auction = calculate_auction_quality(bars)

    # Naked POCs
    naked_pocs = find_naked_pocs(bars)

    # EMA + VWAP for bias state
    ema_list = calculate_ema_ribbon(bars)
    latest_ema = ema_list[-1] if ema_list else None
    vwap_list = calculate_vwap(bars)
    latest_vwap = vwap_list[-1] if vwap_list else None

    # Derive positions
    last_close = bars[-1].close if bars else 0
    vwap_position = "at"
    if latest_vwap and last_close > latest_vwap.vwap:
        vwap_position = "above"
    elif latest_vwap and last_close < latest_vwap.vwap:
        vwap_position = "below"

    ema_alignment = latest_ema.alignment if latest_ema else "mixed"

    # Bias State (5-state)
    # Use signed_scale so that bearish velocity (close < open) reduces the
    # BIAS score instead of incorrectly increasing it.
    bias = calculate_bias_state(
        bars=bars,
        trend=trend.value,
        velocity_scale=latest_velocity.signed_scale if latest_velocity else 0,
        auction_quality=auction.quality_label if auction else "moderat",
        vwap_position=vwap_position,
        ema_alignment=ema_alignment,
    )

    # Bias Switch Level
    switch_level = calculate_bias_switch(bars)

    # Session levels for opening fake
    session_levels = calculate_session_levels(bars)
    prev_high = session_levels.prev_high if session_levels else 0
    prev_low = session_levels.prev_low if session_levels else 0

    # Opening Fake
    opening_fake = detect_opening_fake(bars, prev_high=prev_high, prev_low=prev_low)

    # Double Fake (at bias switch level if available)
    double_fake = None
    if switch_level:
        double_fake = detect_double_fake(bars, level=switch_level.level)

    # Correction
    correction = monitor_correction(bars)

    # Key Levels
    key_levels = find_key_levels(bars)

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        "bar_count": len(bars),
        # Normalize raw score (-10..+10) to a 0..1 confidence value
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
            for kl in key_levels[:10]
        ],
    }

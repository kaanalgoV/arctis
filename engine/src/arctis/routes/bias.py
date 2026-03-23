"""BIAS analysis API endpoint — combines all BIAS modules."""

from fastapi import APIRouter, HTTPException, Query
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api/analysis")


def _get_sim():
    from arctis.main import sim
    return sim


def _load_bars(market: Market, timeframe: Timeframe):
    """Load bars from the simulation engine, ParquetStore, or TimescaleDB (in priority order)."""
    sim = _get_sim()
    if sim.active and sim.market == market.value and sim.timeframe == timeframe.value:
        return sim.get_bars()

    # Try ParquetStore first (populated via /api/import)
    try:
        from arctis.main import store
        bars = store.load(market, timeframe)
        if bars:
            return bars
    except Exception:
        pass

    # Fall back to TimescaleDB
    try:
        from arctis.db import fetch_bars_as_models
        return fetch_bars_as_models(market=market.value, days=30, timeframe=timeframe.value)
    except Exception:
        return []


def _derive_confidence(
    has_velocity: bool,
    has_auction: bool,
    has_switch: bool,
    has_vwap: bool,
    has_ema: bool,
) -> float:
    """Return a confidence score (0.0–1.0) based on how many components are available.

    Each available component contributes 0.2 to the total.
    """
    components = [has_velocity, has_auction, has_switch, has_vwap, has_ema]
    return round(sum(1 for c in components if c) / len(components), 2)


@router.get("/bias")
async def get_daily_bias(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Return combined daily BIAS analysis.

    Aggregates the following modules into a single response:
      - bias_state:        5-state system (LONG / RANGE_LONG / RANGE / RANGE_SHORT / SHORT)
      - bias_switch_level: price level where the current bias would flip
      - velocity:          price velocity relative to its rolling average
      - auction_quality:   cleanliness of recent price movement
      - naked_pocs:        unfilled Point-of-Control levels
      - opening_fake:      false breakout detection in the first 2 hours
      - double_fake:       two-failed-breakout exhaustion pattern
      - correction:        60% retracement monitor
      - key_levels:        multi-day price levels
      - confidence:        0.0–1.0 score indicating data availability
    """
    bars = _load_bars(market, timeframe)

    if not bars:
        raise HTTPException(status_code=404, detail="No data available for this market/timeframe")

    # Import all BIAS modules (local imports keep startup time low)
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

    # -----------------------------------------------------------------------
    # Structure
    # -----------------------------------------------------------------------
    swings = detect_swings(bars)
    trend = classify_trend(swings)

    # -----------------------------------------------------------------------
    # Velocity
    # -----------------------------------------------------------------------
    velocity_list = calculate_velocity(bars)
    latest_velocity = velocity_list[-1] if velocity_list else None

    # -----------------------------------------------------------------------
    # Auction Quality
    # -----------------------------------------------------------------------
    auction = calculate_auction_quality(bars)

    # -----------------------------------------------------------------------
    # Naked POCs
    # -----------------------------------------------------------------------
    naked_pocs = find_naked_pocs(bars)

    # -----------------------------------------------------------------------
    # EMA ribbon + VWAP → derive input descriptors for bias state
    # -----------------------------------------------------------------------
    ema_list = calculate_ema_ribbon(bars)
    latest_ema = ema_list[-1] if ema_list else None

    vwap_list = calculate_vwap(bars)
    latest_vwap = vwap_list[-1] if vwap_list else None

    last_close = bars[-1].close
    if latest_vwap and last_close > latest_vwap.vwap * 1.001:
        vwap_position = "above"
    elif latest_vwap and last_close < latest_vwap.vwap * 0.999:
        vwap_position = "below"
    else:
        vwap_position = "at"

    ema_alignment = latest_ema.alignment if latest_ema else "mixed"

    # -----------------------------------------------------------------------
    # 5-State Bias
    # -----------------------------------------------------------------------
    bias = calculate_bias_state(
        bars=bars,
        trend=trend.value,
        velocity_scale=latest_velocity.scale if latest_velocity else 5,
        auction_quality=auction.quality_label if auction else "moderat",
        vwap_position=vwap_position,
        ema_alignment=ema_alignment,
    )

    # -----------------------------------------------------------------------
    # Bias Switch Level
    # -----------------------------------------------------------------------
    switch_level = calculate_bias_switch(bars)

    # -----------------------------------------------------------------------
    # Session levels → Opening Fake
    # -----------------------------------------------------------------------
    session_levels = calculate_session_levels(bars)
    prev_high: float = (session_levels.prev_high or 0.0) if session_levels else 0.0
    prev_low: float = (session_levels.prev_low or 0.0) if session_levels else 0.0
    opening_fake = detect_opening_fake(bars, prev_high=prev_high, prev_low=prev_low)

    # -----------------------------------------------------------------------
    # Double Fake (at the bias switch level when available)
    # -----------------------------------------------------------------------
    double_fake = None
    if switch_level:
        double_fake = detect_double_fake(bars, level=switch_level.level)

    # -----------------------------------------------------------------------
    # 60% Correction monitor
    # -----------------------------------------------------------------------
    correction = monitor_correction(bars)

    # -----------------------------------------------------------------------
    # Key Levels
    # -----------------------------------------------------------------------
    key_levels = find_key_levels(bars)

    # -----------------------------------------------------------------------
    # Confidence
    # -----------------------------------------------------------------------
    confidence = _derive_confidence(
        has_velocity=latest_velocity is not None,
        has_auction=auction is not None,
        has_switch=switch_level is not None,
        has_vwap=latest_vwap is not None,
        has_ema=latest_ema is not None,
    )

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        "bar_count": len(bars),
        "confidence": confidence,
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
        } if latest_velocity else None,
        "auction_quality": {
            "score": auction.quality_score,
            "label": auction.quality_label,
            "type": auction.auction_type,
            "direction": auction.direction,
        } if auction else None,
        "naked_pocs": [
            {
                "date": p.date,
                "price": p.poc_price,
                "naked": p.is_naked,
                "distance": p.distance,
            }
            for p in naked_pocs[:5]
        ],
        "opening_fake": {
            "detected": opening_fake.detected,
            "direction": opening_fake.direction,
            "confidence": opening_fake.confidence,
            "break_price": opening_fake.break_price if opening_fake.detected else None,
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
            {
                "level": kl.level,
                "tests": kl.test_count,
                "type": kl.type,
                "first_test": kl.first_test_date,
                "last_test": kl.last_test_date,
            }
            for kl in key_levels[:10]
        ],
    }

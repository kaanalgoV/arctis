"""Zones and Signals API endpoints — returns trading zones and trade signals."""

from fastapi import APIRouter, Query

from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe
from arctis.analysis.zones import calculate_zones

router = APIRouter(prefix="/api/analysis")


@router.get("/backtest")
async def run_backtest_endpoint(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    days: int = Query(default=30, ge=7, le=90),
):
    """Run backtest on historical data and return signal accuracy report.

    Simulates the full signal detection pipeline at intraday checkpoints over
    the requested number of trading days and measures:
    - Win rate per signal type
    - Average R multiple
    - Profit factor
    - Confidence-level breakdown (high/medium/low)

    Query params:
        market:    ES | NQ
        timeframe: 1min | 5min
        days:      7-90 (default 30)

    Returns a JSON report with aggregate stats and the 20 most recent trades.
    """
    from arctis.analysis.backtester import run_backtest

    bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
    report = run_backtest(bars, market_root=market.value)

    return {
        "total_trades": report.total_trades,
        "wins": report.wins,
        "losses": report.losses,
        "win_rate": report.win_rate,
        "avg_r": report.avg_r,
        "profit_factor": report.profit_factor,
        "best_type": report.best_type,
        "worst_type": report.worst_type,
        "by_type": report.by_type,
        "by_confidence": report.by_confidence,
        "recent_trades": [
            {
                "type": t.signal_type,
                "dir": t.direction,
                "entry": t.entry_price,
                "exit": t.exit_price,
                "r": t.r_multiple,
                "won": t.won,
                "bars": t.bars_held,
                "date": t.date,
                "confidence": t.confidence,
                "exit_reason": t.exit_reason,
            }
            for t in report.trades[-20:]
        ],
    }


from arctis.routes._common import load_bars as _load_bars


@router.get("/zones")
async def get_zones(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Calculate and return all trading zones for the given market/timeframe.

    Returns a list of zone objects. Each zone has:
    - name: human-readable name
    - type: "line" | "area"
    - high / low: price levels
    - color: hex color string
    - opacity: 0.0-1.0 fill opacity
    - start_time: unix timestamp when zone begins
    - end_time: unix timestamp when zone ends (null = extends to present)
    - label: short chart label (e.g. "PDH", "POC", "VA")
    - priority: 1=highest (used for draw order)
    """
    bars = _load_bars(market, timeframe)
    zones = calculate_zones(bars, market=market.value)

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


@router.get("/signals")
async def get_signals(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Detect and return active trade signals based on Travis methodology.

    Signals are filtered by the current 5-state bias. Each signal includes
    entry, stop, target prices, R:R ratio, confidence, and explanation.
    """
    from arctis.analysis.zones import _calculate_value_area, _group_by_day
    from arctis.analysis.bias_state import calculate_bias_state
    from arctis.analysis.structure import detect_swings, classify_trend
    from arctis.analysis.signals import detect_signals
    from arctis.analysis.naked_poc import find_naked_pocs
    from arctis.analysis.key_levels import find_key_levels
    from arctis.analysis.indicators import calculate_ema_ribbon
    from arctis.analysis.velocity import calculate_velocity
    from arctis.analysis.auction import calculate_auction_quality
    from arctis.analysis.vwap import calculate_vwap

    bars = _load_bars(market, timeframe)

    if len(bars) < 50:
        return {"signals": [], "bias": "RANGE", "bias_score": 0}

    # Calculate zones to extract key price levels
    zones = calculate_zones(bars, market=market.value)
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

    # Determine bias state — feed ALL five components so non-trending
    # days don't collapse to RANGE score=0 and block every signal.
    # Without this fix, detect_signals sees bias_state="RANGE" bias_score=0
    # and most signals fail the confluence threshold, causing the endpoint
    # to return zero setups even when VWAP/EMA/velocity are clearly tilted.
    swings = detect_swings(bars)
    trend = classify_trend(swings)

    price = bars[-1].close

    try:
        vel_list = calculate_velocity(bars)
        velocity_scale = vel_list[-1].signed_scale if vel_list else 0
    except Exception:
        velocity_scale = 0

    try:
        auction = calculate_auction_quality(bars)
        auction_quality = auction.quality_label if auction else "moderat"
    except Exception:
        auction_quality = "moderat"

    try:
        vwap_list = calculate_vwap(bars)
        vwap_value = vwap_list[-1].vwap if vwap_list else None
    except Exception:
        vwap_value = None

    if vwap_value:
        diff_pct = (price - vwap_value) / vwap_value * 100
        if diff_pct > 0.15:
            vwap_position = "weit_oben"
        elif diff_pct > 0.02:
            vwap_position = "above"
        elif diff_pct < -0.15:
            vwap_position = "weit_unten"
        elif diff_pct < -0.02:
            vwap_position = "below"
        else:
            vwap_position = "at"
    else:
        vwap_position = "at"

    try:
        ema_list = calculate_ema_ribbon(bars)
        if ema_list:
            last_ema = ema_list[-1]
            if price > last_ema.ema9 > last_ema.ema21:
                ema_alignment = "bullish"
            elif price < last_ema.ema9 < last_ema.ema21:
                ema_alignment = "bearish"
            elif last_ema.ema9 > last_ema.ema21:
                ema_alignment = "slightly_bullish"
            elif last_ema.ema9 < last_ema.ema21:
                ema_alignment = "slightly_bearish"
            else:
                ema_alignment = "mixed"
        else:
            ema_alignment = "mixed"
    except Exception:
        ema_alignment = "mixed"

    bias = calculate_bias_state(
        bars,
        trend=trend.value,
        velocity_scale=velocity_scale,
        auction_quality=auction_quality,
        vwap_position=vwap_position,
        ema_alignment=ema_alignment,
    )

    # Naked POCs
    try:
        npocs = find_naked_pocs(bars)
        naked_poc_prices = [p.poc_price for p in npocs if p.is_naked]
    except Exception:
        naked_poc_prices = []

    # Key levels
    try:
        kls = find_key_levels(bars)
        kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls]
    except Exception:
        kl_dicts = []

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
        vwap=vwap_value,
        market_root=market.value,
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

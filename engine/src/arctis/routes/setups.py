"""FastAPI router for the /api/setups endpoint.

Returns active setup objects derived from signals, bias state, and confluence
for a given market and timeframe.  Each setup includes a ``chart_artifacts``
field with horizontal-line and band annotation data that the frontend can
render directly onto the chart.

v2 changes (2026-03-25):
  - All level parameters (VWAP, OR, POC, PDH/PDL, naked POCs) now computed
    and passed to detect_signals() so the engine receives full context.
  - Live price from _last_prices is used to evaluate setup status in real-time.
  - Playbook rules filtered for the current session are passed to detect_setups().
  - Fallback setups generated from VWAP proximity / session levels / EMA alignment
    when detect_signals() returns zero signals (e.g. very early in NY Open).
  - session_context added to API response for debugging.
"""

from __future__ import annotations

import time
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query

from arctis.db import fetch_bars_as_models
from arctis.analysis.setup_engine import Setup, SetupStatus, detect_setups, _build_chart_artifacts
from arctis.analysis.sessions import classify_session, get_session_context
from arctis.routes._common import load_bars as _load_bars, current_timestamp as _current_timestamp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/setups", tags=["setups"])

ET = ZoneInfo("America/New_York")

# ---------------------------------------------------------------------------
# NQ-specific constants
# ---------------------------------------------------------------------------
_NQ_TICK = 0.25
_MIN_RR = 1.35


# ---------------------------------------------------------------------------
# Serialisation helper
# ---------------------------------------------------------------------------

def _serialize_setup(s: Setup) -> dict:
    """Serialize a Setup dataclass to a JSON-serializable dict."""
    return {
        "setup_id": s.setup_id,
        "instrument": s.instrument,
        "timeframe": s.timeframe,
        "direction": s.direction,
        "status": s.status.value,
        "setup_type": s.setup_type,
        "thesis": s.thesis,
        "why_now": s.why_now,
        "why_here": s.why_here,
        "status_reason": s.status_reason,
        "invalidation_reason": s.invalidation_reason,
        # Entry / exit levels
        "entry_zone_low": s.entry_zone_low,
        "entry_zone_high": s.entry_zone_high,
        "entry_trigger_price": s.entry_trigger_price,
        "stop_price": s.stop_price,
        "tp1_price": s.tp1_price,
        "tp2_price": s.tp2_price,
        "risk_reward": s.risk_reward,
        # Context
        "confidence": s.confidence,
        "bias_direction": s.bias_direction,
        "confluence_score": s.confluence_score,
        "evidence": s.evidence,
        "source_modules": s.source_modules,
        # Chart annotation artifacts
        "chart_artifacts": s.chart_artifacts,
        # Timestamps
        "created_ts": s.created_ts,
        "qualified_ts": s.qualified_ts,
        "armed_ts": s.armed_ts,
        "entry_ts": s.entry_ts,
        "exit_ts": s.exit_ts,
        "exit_reason": s.exit_reason,
        # Outcomes
        "entry_price": s.entry_price,
        "exit_price": s.exit_price,
        "pnl_ticks": s.pnl_ticks,
        # Session
        "session": s.session,
    }


# ---------------------------------------------------------------------------
# Level extraction helpers
# ---------------------------------------------------------------------------

def _extract_vwap(bars) -> float | None:
    """Calculate the current session VWAP from bars."""
    try:
        from arctis.analysis.vwap import calculate_vwap
        vwap_data = calculate_vwap(bars)
        if vwap_data:
            return vwap_data[-1].vwap
    except Exception:
        pass
    return None


def _extract_session_levels(bars) -> dict:
    """Extract OR, PDH/PDL, overnight range from bars via volume_profile module."""
    result = {
        "or_high": None, "or_low": None,
        "ib_high": None, "ib_low": None,
        "prev_high": None, "prev_low": None,
        "overnight_high": None, "overnight_low": None,
    }
    try:
        from arctis.analysis.volume_profile import calculate_session_levels
        lvls = calculate_session_levels(bars, or_minutes=30)
        result["prev_high"] = lvls.prev_high
        result["prev_low"] = lvls.prev_low
        result["overnight_high"] = lvls.overnight_high
        result["overnight_low"] = lvls.overnight_low
        result["or_high"] = lvls.opening_range_high
        result["or_low"] = lvls.opening_range_low
    except Exception:
        pass
    return result


def _extract_poc_levels(bars) -> dict:
    """Extract current session POC/VAH/VAL and naked POCs from prior days."""
    result = {"poc": None, "vah": None, "val": None, "naked_pocs": []}
    try:
        from arctis.analysis.volume_profile import build_volume_profile, build_daily_volume_profiles
        from arctis.analysis.sessions import classify_session, Session
        from datetime import datetime, timezone

        # Today's session bars only (RTH-only for intraday POC)
        today_bars = _get_today_rth_bars(bars)
        if today_bars:
            vp = build_volume_profile(today_bars)
            if vp:
                result["poc"] = vp.poc
                result["vah"] = vp.vah
                result["val"] = vp.val

        # Naked POCs from prior sessions (unvisited by today's price)
        last_price = bars[-1].close if bars else 0.0
        daily_profiles = build_daily_volume_profiles(bars)
        today_str = datetime.fromtimestamp(time.time(), tz=timezone.utc).strftime("%Y-%m-%d")
        prior_pocs = [
            d.poc for d in daily_profiles
            if d.date < today_str and d.poc > 0
        ]
        # A naked POC is one that today's price range has NOT yet crossed
        if today_bars:
            today_high = max(b.high for b in today_bars)
            today_low = min(b.low for b in today_bars)
            naked = [
                p for p in prior_pocs
                if not (today_low <= p <= today_high)
            ]
            result["naked_pocs"] = naked[-5:]  # keep closest 5

    except Exception:
        pass
    return result


def _get_today_rth_bars(bars):
    """Filter bars to today's RTH session (09:30-16:00 ET)."""
    try:
        from zoneinfo import ZoneInfo
        from datetime import datetime

        et = ZoneInfo("America/New_York")
        today_et = datetime.now(tz=et).date()
        rth_bars = []
        for b in bars:
            dt = datetime.fromtimestamp(b.timestamp, tz=et)
            if dt.date() != today_et:
                continue
            h, m = dt.hour, dt.minute
            tv = h * 60 + m
            if 570 <= tv < 960:  # 09:30 - 16:00
                rth_bars.append(b)
        return rth_bars
    except Exception:
        return []


def _extract_key_levels(bars) -> list[dict]:
    """Extract multi-day key price levels from bars."""
    try:
        from arctis.analysis.key_levels import identify_key_levels
        levels = identify_key_levels(bars)
        return [{"level": kl.level, "type": kl.type} for kl in levels]
    except Exception:
        return []


def _get_live_price(market: str) -> float | None:
    """Fetch live tick price from the Rithmic/Databento cache."""
    try:
        from arctis.routes.live import _last_prices
        # Try exact match first
        entry = _last_prices.get(market)
        if entry and time.time() - entry["ts"] < 30:  # max 30s stale
            return float(entry["price"])
        # Try prefix match (NQH6 -> NQM6 live feed)
        root = market[:2]
        for sym, p in _last_prices.items():
            if sym.startswith(root) and time.time() - p["ts"] < 30:
                return float(p["price"])
    except Exception:
        pass
    return None


def _get_session_bar_index(bars) -> int:
    """Return the bar count within today's RTH session for session_bar_idx."""
    today_rth = _get_today_rth_bars(bars)
    return len(today_rth)


# ---------------------------------------------------------------------------
# ATR helper
# ---------------------------------------------------------------------------

def _calc_atr(bars, period: int = 20) -> float:
    recent = bars[-period:] if len(bars) >= period else bars
    if not recent:
        return 1.0
    atr = sum(b.high - b.low for b in recent) / len(recent)
    return max(atr, 0.25)


# ---------------------------------------------------------------------------
# Fallback setup generators (when detect_signals returns nothing)
# ---------------------------------------------------------------------------

def _make_fallback_id(prefix: str, ts: int) -> str:
    return f"{prefix}_{ts}"


def _vwap_proximity_setup(
    bars, price: float, vwap: float, atr: float,
    ts: int, session_str: str, instrument: str
) -> Setup | None:
    """Generate a VWAP proximity bounce setup when price is within 5 points of VWAP."""
    if not vwap or not atr:
        return None

    dist = price - vwap  # positive = above, negative = below
    if abs(dist) > 5.0:
        return None

    # Need at least 3 bars to check momentum
    if len(bars) < 3:
        return None

    # Long: price just below VWAP, last bar closing up
    if dist < 0 and bars[-1].close > bars[-2].close:
        entry = price + _NQ_TICK  # one tick above current price
        stop = min(b.low for b in bars[-3:]) - atr * 0.5
        target = vwap + atr * 1.5
        risk = abs(entry - stop)
        if risk <= 0 or abs(target - entry) / risk < _MIN_RR:
            return None
        setup = Setup(
            setup_id=_make_fallback_id("vwap_proximity_long", ts),
            instrument=instrument,
            timeframe="1min",
            direction="long",
            status=SetupStatus.CANDIDATE,
            setup_type="vwap_bounce",
            thesis="VWAP Proximity Bounce — price within 5 pts of VWAP, momentum reverting up",
            why_now=f"Last bar closed up at {price:.2f}, approaching VWAP ({vwap:.2f})",
            why_here=f"VWAP at {vwap:.2f} acts as magnetic support; price {abs(dist):.1f} pts below",
            session=session_str,
            entry_trigger_price=round(entry, 2),
            entry_zone_low=round(vwap - 1.0, 2),
            entry_zone_high=round(vwap + 1.0, 2),
            stop_price=round(stop, 2),
            tp1_price=round(target, 2),
            tp2_price=round(vwap + atr * 3.0, 2),
            risk_reward=round(abs(target - entry) / risk, 2),
            confidence="medium",
            evidence=[f"Price {abs(dist):.1f} pts below VWAP ({vwap:.2f})", "Upward momentum confirmed"],
            source_modules=["fallback", "vwap"],
            created_ts=ts,
        )
        setup.qualify(reason="VWAP proximity — fallback generator", ts=ts)
        setup.chart_artifacts = _build_chart_artifacts(setup)
        return setup

    # Short: price just above VWAP, last bar closing down
    if dist > 0 and bars[-1].close < bars[-2].close:
        entry = price - _NQ_TICK
        stop = max(b.high for b in bars[-3:]) + atr * 0.5
        target = vwap - atr * 1.5
        risk = abs(entry - stop)
        if risk <= 0 or abs(target - entry) / risk < _MIN_RR:
            return None
        setup = Setup(
            setup_id=_make_fallback_id("vwap_proximity_short", ts),
            instrument=instrument,
            timeframe="1min",
            direction="short",
            status=SetupStatus.CANDIDATE,
            setup_type="vwap_bounce",
            thesis="VWAP Proximity Fade — price within 5 pts above VWAP, momentum reverting down",
            why_now=f"Last bar closed down at {price:.2f}, approaching VWAP ({vwap:.2f}) from above",
            why_here=f"VWAP at {vwap:.2f} acts as magnetic resistance; price {abs(dist):.1f} pts above",
            session=session_str,
            entry_trigger_price=round(entry, 2),
            entry_zone_low=round(vwap - 1.0, 2),
            entry_zone_high=round(vwap + 1.0, 2),
            stop_price=round(stop, 2),
            tp1_price=round(target, 2),
            tp2_price=round(vwap - atr * 3.0, 2),
            risk_reward=round(abs(target - entry) / risk, 2),
            confidence="medium",
            evidence=[f"Price {abs(dist):.1f} pts above VWAP ({vwap:.2f})", "Downward momentum confirmed"],
            source_modules=["fallback", "vwap"],
            created_ts=ts,
        )
        setup.qualify(reason="VWAP proximity — fallback generator", ts=ts)
        setup.chart_artifacts = _build_chart_artifacts(setup)
        return setup

    return None


def _session_level_setup(
    bars, price: float, atr: float,
    prev_high: float | None, prev_low: float | None,
    or_high: float | None, or_low: float | None,
    ts: int, session_str: str, instrument: str
) -> list[Setup]:
    """Generate rejection setups when price is near PDH/PDL or OR levels."""
    setups: list[Setup] = []
    if not atr:
        return setups

    # Tolerance: 3 NQ points
    tol = 3.0

    def _make_rejection(direction: str, level: float, label: str, level_type: str) -> Setup | None:
        if abs(price - level) > tol:
            return None
        if len(bars) < 3:
            return None
        if direction == "long":
            # Price at support — check bounce
            if bars[-1].close <= bars[-2].close:
                return None
            entry = price + _NQ_TICK
            stop = level - atr * 1.5
            target = level + atr * 3.0
        else:
            # Price at resistance — check rejection
            if bars[-1].close >= bars[-2].close:
                return None
            entry = price - _NQ_TICK
            stop = level + atr * 1.5
            target = level - atr * 3.0

        risk = abs(entry - stop)
        if risk <= 0 or abs(target - entry) / risk < _MIN_RR:
            return None
        if abs(entry - stop) > 25.0:  # max 100 ticks
            return None

        sid = _make_fallback_id(f"{level_type}_{direction}", ts)
        return Setup(
            setup_id=sid,
            instrument=instrument,
            timeframe="1min",
            direction=direction,
            status=SetupStatus.CANDIDATE,
            setup_type="poc_rejection" if "poc" in level_type else "orb_break",
            thesis=f"{label} {'Support Bounce' if direction == 'long' else 'Resistance Rejection'} — price at key session level",
            why_now=f"Price {price:.2f} at {label} ({level:.2f}) with {'up' if direction == 'long' else 'down'}ward momentum",
            why_here=f"{label} at {level:.2f} is a significant structural reference",
            session=session_str,
            entry_trigger_price=round(entry, 2),
            entry_zone_low=round(level - 1.0, 2),
            entry_zone_high=round(level + 1.0, 2),
            stop_price=round(stop, 2),
            tp1_price=round(target, 2),
            tp2_price=round(target + (target - entry) * 0.5, 2) if direction == "long" else round(target - (entry - target) * 0.5, 2),
            risk_reward=round(abs(target - entry) / risk, 2),
            confidence="medium",
            evidence=[f"Price near {label} ({level:.2f})", f"Momentum {'up' if direction == 'long' else 'down'}"],
            source_modules=["fallback", "session_levels"],
            created_ts=ts,
        )

    # PDH rejection (short at resistance)
    if prev_high is not None:
        s = _make_rejection("short", prev_high, "PDH", "pdh")
        if s:
            s.qualify(reason="Session level rejection — fallback", ts=ts)
            s.chart_artifacts = _build_chart_artifacts(s)
            setups.append(s)

    # PDL bounce (long at support)
    if prev_low is not None:
        s = _make_rejection("long", prev_low, "PDL", "pdl")
        if s:
            s.qualify(reason="Session level bounce — fallback", ts=ts)
            s.chart_artifacts = _build_chart_artifacts(s)
            setups.append(s)

    # OR high breakout (long)
    if or_high is not None:
        if price > or_high and len(bars) >= 2 and bars[-1].close > bars[-2].close:
            entry = or_high + _NQ_TICK
            stop = or_high - atr * 1.5
            target = or_high + atr * 3.0
            risk = abs(entry - stop)
            if risk > 0 and abs(target - entry) / risk >= _MIN_RR and abs(entry - stop) <= 25.0:
                s = Setup(
                    setup_id=_make_fallback_id("or_high_break_long", ts),
                    instrument=instrument,
                    timeframe="1min",
                    direction="long",
                    status=SetupStatus.CANDIDATE,
                    setup_type="orb_break",
                    thesis="Opening Range High Breakout — price above OR high with momentum",
                    why_now=f"Price {price:.2f} broke above OR High ({or_high:.2f})",
                    why_here=f"OR High at {or_high:.2f} is the session's key breakout level",
                    session=session_str,
                    entry_trigger_price=round(entry, 2),
                    entry_zone_low=round(or_high, 2),
                    entry_zone_high=round(or_high + 2.0, 2),
                    stop_price=round(stop, 2),
                    tp1_price=round(target, 2),
                    tp2_price=round(target + atr * 1.5, 2),
                    risk_reward=round(abs(target - entry) / risk, 2),
                    confidence="medium",
                    evidence=[f"Price above OR High ({or_high:.2f})", "Breakout momentum"],
                    source_modules=["fallback", "session_levels"],
                    created_ts=ts,
                )
                s.qualify(reason="OR High breakout — fallback", ts=ts)
                s.chart_artifacts = _build_chart_artifacts(s)
                setups.append(s)

    # OR low breakdown (short)
    if or_low is not None:
        if price < or_low and len(bars) >= 2 and bars[-1].close < bars[-2].close:
            entry = or_low - _NQ_TICK
            stop = or_low + atr * 1.5
            target = or_low - atr * 3.0
            risk = abs(entry - stop)
            if risk > 0 and abs(target - entry) / risk >= _MIN_RR and abs(entry - stop) <= 25.0:
                s = Setup(
                    setup_id=_make_fallback_id("or_low_break_short", ts),
                    instrument=instrument,
                    timeframe="1min",
                    direction="short",
                    status=SetupStatus.CANDIDATE,
                    setup_type="orb_break",
                    thesis="Opening Range Low Breakdown — price below OR low with momentum",
                    why_now=f"Price {price:.2f} broke below OR Low ({or_low:.2f})",
                    why_here=f"OR Low at {or_low:.2f} is the session's key breakdown level",
                    session=session_str,
                    entry_trigger_price=round(entry, 2),
                    entry_zone_low=round(or_low - 2.0, 2),
                    entry_zone_high=round(or_low, 2),
                    stop_price=round(stop, 2),
                    tp1_price=round(target, 2),
                    tp2_price=round(target - atr * 1.5, 2),
                    risk_reward=round(abs(target - entry) / risk, 2),
                    confidence="medium",
                    evidence=[f"Price below OR Low ({or_low:.2f})", "Breakdown momentum"],
                    source_modules=["fallback", "session_levels"],
                    created_ts=ts,
                )
                s.qualify(reason="OR Low breakdown — fallback", ts=ts)
                s.chart_artifacts = _build_chart_artifacts(s)
                setups.append(s)

    return setups


def _ema_trend_setup(
    bars, price: float, atr: float,
    ts: int, session_str: str, instrument: str
) -> Setup | None:
    """Generate EMA alignment trend continuation setup."""
    try:
        from arctis.analysis.indicators import calculate_ema_ribbon
        if len(bars) < 55:
            return None
        ema_data = calculate_ema_ribbon(bars)
        if not ema_data:
            return None
        last_ema = ema_data[-1]
        # Only generate if fully aligned (bullish or bearish)
        if last_ema.alignment not in ("bullish", "bearish"):
            return None

        direction = "long" if last_ema.alignment == "bullish" else "short"

        # EMA21 as dynamic support/resistance
        support_level = last_ema.ema21

        if direction == "long":
            if price < last_ema.ema9:  # price pulled back, not extended
                return None
            dist_to_ema21 = price - support_level
            if dist_to_ema21 > atr * 2.0:  # too extended for a pullback entry
                return None
            entry = price + _NQ_TICK
            stop = support_level - atr * 0.5
            target = price + atr * 2.0
        else:
            if price > last_ema.ema9:
                return None
            dist_to_ema21 = support_level - price
            if dist_to_ema21 > atr * 2.0:
                return None
            entry = price - _NQ_TICK
            stop = support_level + atr * 0.5
            target = price - atr * 2.0

        risk = abs(entry - stop)
        if risk <= 0 or abs(target - entry) / risk < _MIN_RR:
            return None
        if abs(entry - stop) > 25.0:
            return None

        setup = Setup(
            setup_id=_make_fallback_id(f"ema_trend_{direction}", ts),
            instrument=instrument,
            timeframe="1min",
            direction=direction,
            status=SetupStatus.CANDIDATE,
            setup_type="orb_break",
            thesis=f"EMA Ribbon Fully {last_ema.alignment.capitalize()} — trend continuation near EMA21",
            why_now=f"All EMAs aligned {last_ema.alignment}: EMA9={last_ema.ema9:.2f} > EMA21={last_ema.ema21:.2f} > EMA50={last_ema.ema50:.2f}",
            why_here=f"EMA21 at {support_level:.2f} acts as dynamic {'support' if direction == 'long' else 'resistance'}",
            session=session_str,
            entry_trigger_price=round(entry, 2),
            entry_zone_low=round(support_level, 2) if direction == "long" else round(entry - 2.0, 2),
            entry_zone_high=round(entry + 2.0, 2) if direction == "long" else round(support_level, 2),
            stop_price=round(stop, 2),
            tp1_price=round(target, 2),
            tp2_price=round(target + atr * 1.0, 2) if direction == "long" else round(target - atr * 1.0, 2),
            risk_reward=round(abs(target - entry) / risk, 2),
            confidence="medium",
            evidence=[
                f"EMA ribbon fully {last_ema.alignment}",
                f"EMA9={last_ema.ema9:.2f}, EMA21={last_ema.ema21:.2f}, EMA50={last_ema.ema50:.2f}",
            ],
            source_modules=["fallback", "ema"],
            created_ts=ts,
        )
        setup.qualify(reason="EMA trend alignment — fallback", ts=ts)
        setup.chart_artifacts = _build_chart_artifacts(setup)
        return setup
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Live price status update
# ---------------------------------------------------------------------------

def _apply_live_price_to_setups(setups: list[Setup], live_price: float | None) -> None:
    """Update setup statuses in-place using the best available price.

    This runs a lifecycle pass to resolve stale setups (expire if price moved
    far past entry) and advance active setups through their state machine.
    Accepts live tick price or last bar close as fallback.
    """
    if live_price is None or live_price <= 0:
        return

    ts_now = int(time.time())
    from arctis.analysis.setup_engine import _update_lifecycle_long, _update_lifecycle_short

    _terminal = {
        SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED,
        SetupStatus.EXITED, SetupStatus.EXPIRED,
    }

    for setup in setups:
        if setup.status in _terminal:
            continue
        if setup.direction == "long":
            _update_lifecycle_long(setup, live_price, ts_now)
        else:
            _update_lifecycle_short(setup, live_price, ts_now)

        # Enrich status_reason with current live price context
        if setup.status not in _terminal:
            setup.status_reason = (
                f"{setup.status_reason} | Live: {live_price:.2f}"
                if setup.status_reason
                else f"Live price: {live_price:.2f}"
            )
        # Rebuild chart artifacts in case levels changed
        from arctis.analysis.setup_engine import _build_chart_artifacts
        setup.chart_artifacts = _build_chart_artifacts(setup)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("")
async def get_setups(
    market: str = Query(..., description="Market symbol, e.g. NQH6"),
    timeframe: str = Query(default="1min", description="Bar timeframe"),
    days: int = Query(default=5, ge=1, le=90, description="Lookback in days"),
):
    """Return detected setups with full lifecycle state for a market.

    Response includes:
    - setups: List of Setup objects with status, price levels, evidence
    - chart_artifacts: Per-setup annotation data (hlines, bands) for the chart
    - count: Total number of setups
    - market / timeframe: Echo of request parameters
    - session_context: Current session info for debugging
    - live_price: Resolved live tick price (or null if offline)
    """
    try:
        from arctis.models import Market, Timeframe
        bars = _load_bars(Market(market), Timeframe(timeframe), days=days)
    except (KeyError, RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if not bars:
        return {"setups": [], "count": 0, "market": market, "timeframe": timeframe}

    last_bar = bars[-1]
    ts = last_bar.timestamp
    price = last_bar.close

    # Use sim timestamp when replay is active
    from arctis.routes._common import get_sim
    _sim = get_sim()
    _sim_active = _sim.active and _sim.market == market

    # Live price (may be fresher than the last bar) — skip during replay
    live_price = None if _sim_active else _get_live_price(market)
    effective_price = live_price if live_price else price

    # Session context — use sim time during replay
    sim_ts = _current_timestamp() if _sim_active else None
    session_ctx = get_session_context()
    current_session_str = classify_session(int(sim_ts) if sim_ts else ts).value

    # ---------------------------------------------------------------------------
    # Analysis modules — each fails independently without blocking the endpoint
    # ---------------------------------------------------------------------------
    signals = []
    bias = None
    confluence = None

    try:
        from arctis.analysis.bias_state import calculate_bias_state
        bias = calculate_bias_state(bars)
    except Exception:
        pass

    try:
        from arctis.analysis.confluence import calculate_confluence
        confluence = calculate_confluence(bars, trend="range")
    except Exception:
        pass

    # Extract bias_state string for signals module
    bias_state_str = "RANGE"
    bias_score_val = 0
    if bias is not None:
        bias_state_str = (
            bias.get("state", "RANGE") if isinstance(bias, dict)
            else str(getattr(bias, "state", "RANGE"))
        )
        bias_score_val = (
            bias.get("score", 0) if isinstance(bias, dict)
            else int(getattr(bias, "score", 0))
        )

    # Extract all level parameters for detect_signals
    vwap_val = _extract_vwap(bars)
    session_lvls = _extract_session_levels(bars)
    poc_lvls = _extract_poc_levels(bars)
    key_levels = _extract_key_levels(bars)
    session_bar_idx = _get_session_bar_index(bars)
    atr = _calc_atr(bars)

    try:
        from arctis.analysis.signals import detect_signals
        signals = detect_signals(
            bars,
            bias_state=bias_state_str,
            bias_score=bias_score_val,
            poc=poc_lvls["poc"],
            vah=poc_lvls["vah"],
            val=poc_lvls["val"],
            prev_high=session_lvls["prev_high"],
            prev_low=session_lvls["prev_low"],
            or_high=session_lvls["or_high"],
            or_low=session_lvls["or_low"],
            ib_high=session_lvls["ib_high"],
            ib_low=session_lvls["ib_low"],
            naked_pocs=poc_lvls["naked_pocs"],
            key_levels=key_levels,
            vwap=vwap_val,
            session_bar_idx=session_bar_idx,
            market_root=market[:2].upper() if market else "NQ",
        )
        logger.debug(
            "detect_signals returned %d signals for %s [session=%s bar_idx=%d vwap=%s]",
            len(signals), market, current_session_str, session_bar_idx, vwap_val
        )
    except Exception as exc:
        logger.warning("detect_signals failed for %s: %s", market, exc)

    # ---------------------------------------------------------------------------
    # Playbook rules for current session
    # ---------------------------------------------------------------------------
    playbook_rules = None
    try:
        from arctis.playbooks.library import get_active_playbooks
        playbook_rules = get_active_playbooks(unix_ts=ts)
    except Exception:
        pass

    # ---------------------------------------------------------------------------
    # Run the setup engine
    # ---------------------------------------------------------------------------
    setups = detect_setups(
        bars,
        bias_state=bias,
        confluence=confluence,
        signals=signals,
        playbook_rules=playbook_rules,
    )

    # ---------------------------------------------------------------------------
    # Fallback: generate setups from market context when signals module fires nothing
    # ---------------------------------------------------------------------------
    if not setups:
        logger.debug(
            "No signal-based setups for %s — running fallback generators "
            "[session=%s price=%.2f vwap=%s]",
            market, current_session_str, effective_price, vwap_val
        )
        fallback: list[Setup] = []

        # 1. VWAP proximity
        if vwap_val:
            vs = _vwap_proximity_setup(
                bars, effective_price, vwap_val, atr, ts, current_session_str, market
            )
            if vs:
                fallback.append(vs)

        # 2. Session levels (PDH/PDL, OR)
        level_setups = _session_level_setup(
            bars, effective_price, atr,
            session_lvls["prev_high"], session_lvls["prev_low"],
            session_lvls["or_high"], session_lvls["or_low"],
            ts, current_session_str, market
        )
        fallback.extend(level_setups)

        # 3. EMA alignment
        ema_s = _ema_trend_setup(
            bars, effective_price, atr, ts, current_session_str, market
        )
        if ema_s:
            fallback.append(ema_s)

        # Pre-filter: discard fallback setups whose entry is already far from
        # effective_price (>50 pts).  This prevents stale setups from being
        # created in the first place (belt-and-suspenders with lifecycle guard).
        _MAX_ENTRY_DIST = 50.0
        fallback = [
            s for s in fallback
            if abs(effective_price - s.entry_trigger_price) <= _MAX_ENTRY_DIST
        ]

        setups = fallback

    # ---------------------------------------------------------------------------
    # Apply live price status update
    # ---------------------------------------------------------------------------
    # Always run lifecycle update — use effective_price (falls back to last bar
    # close when live tick data is unavailable) so stale setups get resolved.
    _apply_live_price_to_setups(setups, effective_price)

    # Rebuild tp2 for setups that are missing it (signals module only sets tp1)
    for s in setups:
        if s.tp2_price == 0.0 and s.tp1_price > 0 and s.entry_trigger_price > 0:
            risk = abs(s.entry_trigger_price - s.stop_price)
            if s.direction == "long":
                s.tp2_price = round(s.tp1_price + risk * 0.5, 2)
            else:
                s.tp2_price = round(s.tp1_price - risk * 0.5, 2)
            # Rebuild chart artifacts to include tp2
            s.chart_artifacts = _build_chart_artifacts(s)

    # Remove expired/terminal setups from the response — they add noise and
    # confuse the frontend signal overlay which only expects active setups.
    _terminal_statuses = {
        SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED,
        SetupStatus.EXITED, SetupStatus.EXPIRED,
    }
    setups = [s for s in setups if s.status not in _terminal_statuses]

    now_ts = time.time()
    price_is_live = live_price is not None
    price_age_s: float | None = None
    if price_is_live:
        try:
            from arctis.routes.live import _last_prices
            from arctis.models import FRONT_MONTH, MarketRoot
            try:
                root = MarketRoot(market[:2].upper())
                sym = FRONT_MONTH.get(root, market)
            except ValueError:
                sym = market
            entry = _last_prices.get(sym)
            if entry:
                price_age_s = round(now_ts - entry["ts"], 1)
        except Exception:
            pass

    # Filter stale setups: remove any setup with entry >50pt from current price
    MAX_SETUP_DIST = 50.0
    filtered_setups = [
        s for s in setups
        if s.status in (SetupStatus.CLOSED, SetupStatus.EXPIRED)
        or abs(effective_price - (s.entry_trigger_price or 0)) <= MAX_SETUP_DIST
    ]

    return {
        "setups": [_serialize_setup(s) for s in filtered_setups],
        "count": len(filtered_setups),
        "market": market,
        "timeframe": timeframe,
        # --- Shared meta block (consistent with /api/analysis/bias and /api/signals) ---
        "current_price": round(effective_price, 2),
        "session": session_ctx.get("current_session", current_session_str),
        "is_rth": session_ctx.get("is_rth", False),
        "timestamp": now_ts,
        "price_is_live": price_is_live,
        "price_age_s": price_age_s,
        # --- Extra detail ---
        "live_price": live_price,
        "session_context": session_ctx,
        "levels": {
            "vwap": vwap_val,
            "poc": poc_lvls["poc"],
            "vah": poc_lvls["vah"],
            "val": poc_lvls["val"],
            "prev_high": session_lvls["prev_high"],
            "prev_low": session_lvls["prev_low"],
            "or_high": session_lvls["or_high"],
            "or_low": session_lvls["or_low"],
            "naked_pocs": poc_lvls["naked_pocs"],
            "atr": round(atr, 2),
        },
        "signal_count": len(signals),
    }

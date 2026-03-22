"""Unified feed endpoint — aggregates events from all analysis modules."""

import time as _time
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.discipline import DisciplineContext, generate_warnings
from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
from arctis.analysis.patterns import detect_patterns
from arctis.analysis.sessions import classify_session, get_session_stats
from arctis.analysis.structure import classify_trend, detect_structure_breaks, detect_swings
from arctis.analysis.volume import detect_volume_spikes, relative_volume
from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels
from arctis.analysis.vwap import calculate_vwap
from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api")


def _get_sim():
    from arctis.main import sim
    return sim


def _load_bars(market: Market, timeframe: Timeframe):
    sim = _get_sim()
    if sim.active and sim.market == market.value and sim.timeframe == timeframe.value:
        return sim.get_bars()
    return fetch_bars_as_models(market=market.value, days=30, timeframe=timeframe.value)


def _current_timestamp() -> int:
    sim = _get_sim()
    if sim.active:
        return sim.get_sim_timestamp()
    return int(_time.time())


def _fmt_time(ts: int) -> str:
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    return dt.strftime("%H:%M")


@router.get("/feed")
async def get_feed(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Aggregate events from all analysis modules into a unified feed.

    Returns up to 50 events sorted by timestamp descending.
    Each event has: timestamp, type, severity, message, source.
    Types: SIGNAL, STRUCTURE, VOLUME, SESSION, RISK, BIAS
    Severity: info, warning, signal, critical
    """
    bars = _load_bars(market, timeframe)

    if not bars:
        return {"events": []}

    events: list[dict] = []
    now = _current_timestamp()

    # ── 1. Confluence signals ─────────────────────────────────────────────────
    try:
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
            latest_vwap = {"vwap": v.vwap, "upper_1": v.upper_1, "lower_1": v.lower_1,
                           "upper_2": v.upper_2, "lower_2": v.lower_2}

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

        confluence_result = calculate_confluence(
            bars=bars,
            trend=trend.value,
            vwap_data=latest_vwap,
            ema_data=latest_ema,
            rsi_data=latest_rsi,
            volume_profile=vp_dict,
            session_levels=sl_dict,
            volume_spikes=spike_dicts,
        )

        for idx, sig in enumerate(confluence_result.signals):
            ts = now - idx * 30
            severity = "signal" if sig.strength > 0 else "warning" if sig.strength < 0 else "info"
            events.append({
                "timestamp": ts,
                "time": _fmt_time(ts),
                "type": "SIGNAL",
                "severity": severity,
                "message": f"{sig.name}: {sig.direction} ({sig.strength:+d})",
                "source": "confluence",
            })

        # Overall confluence score as a single event
        if confluence_result.score > 0:
            direction_label = confluence_result.direction or "neutral"
            severity = "signal" if confluence_result.confidence == "high" else "info"
            events.append({
                "timestamp": now - 5,
                "time": _fmt_time(now - 5),
                "type": "SIGNAL",
                "severity": severity,
                "message": (
                    f"Confluence {direction_label}: {confluence_result.score}/{confluence_result.max_score} "
                    f"({confluence_result.confidence})"
                ),
                "source": "confluence",
            })
    except Exception:
        pass

    # ── 2. Volume spikes ──────────────────────────────────────────────────────
    try:
        spikes = detect_volume_spikes(bars)
        for sp in spikes[-10:]:
            events.append({
                "timestamp": sp.timestamp,
                "time": _fmt_time(sp.timestamp),
                "type": "VOLUME",
                "severity": "warning" if sp.ratio >= 3.0 else "info",
                "message": f"RVOL Spike {sp.ratio:.1f}x",
                "source": "volume",
            })
    except Exception:
        pass

    # ── 3. Pattern annotations ────────────────────────────────────────────────
    try:
        vwap_list = calculate_vwap(bars)
        rsi_list = calculate_rsi(bars)
        vol_profile = build_volume_profile(bars)
        session_lvls = calculate_session_levels(bars)

        lv = vwap_list[-1] if vwap_list else None
        lr = rsi_list[-1] if rsi_list else None

        pattern_result = detect_patterns(
            bars=bars,
            vwap_data={"vwap": lv.vwap, "upper_1": lv.upper_1, "lower_1": lv.lower_1,
                       "upper_2": lv.upper_2, "lower_2": lv.lower_2} if lv else None,
            rsi_data={"rsi": lr.rsi, "divergence": lr.divergence} if lr else None,
            volume_profile={"poc": vol_profile.poc, "vah": vol_profile.vah,
                            "val": vol_profile.val} if vol_profile else None,
            session_levels={
                "prev_high": session_lvls.prev_high, "prev_low": session_lvls.prev_low,
                "prev_close": session_lvls.prev_close,
                "opening_range_high": session_lvls.opening_range_high,
                "opening_range_low": session_lvls.opening_range_low,
            } if session_lvls else None,
        )

        for ann in pattern_result.annotations:
            severity: str
            if ann.direction == "long":
                severity = "signal"
            elif ann.direction == "short":
                severity = "warning"
            else:
                severity = "info"

            win_pct = f" ({round(ann.win_rate * 100)}%)" if ann.win_rate is not None else ""
            events.append({
                "timestamp": ann.timestamp,
                "time": _fmt_time(ann.timestamp),
                "type": "SIGNAL",
                "severity": severity,
                "message": f"{ann.pattern}: {ann.direction}{win_pct}",
                "source": "patterns",
            })

        if pattern_result.day_bias and pattern_result.day_bias != "unknown":
            events.append({
                "timestamp": now - 600,
                "time": _fmt_time(now - 600),
                "type": "BIAS",
                "severity": "info",
                "message": f"Day Bias: {pattern_result.day_bias} ({pattern_result.day_type})",
                "source": "patterns",
            })
    except Exception:
        pass

    # ── 4. Structure breaks (BOS / CHoCH) ─────────────────────────────────────
    try:
        swings = detect_swings(bars)
        breaks = detect_structure_breaks(swings)
        for brk in breaks[-10:]:
            severity = "signal" if brk.direction == "long" else "warning"
            events.append({
                "timestamp": brk.timestamp,
                "time": _fmt_time(brk.timestamp),
                "type": "STRUCTURE",
                "severity": severity,
                "message": f"{brk.break_type} {brk.direction} @ {brk.price:.2f}",
                "source": "structure",
            })
    except Exception:
        pass

    # ── 5. Session transitions ─────────────────────────────────────────────────
    try:
        current_session = classify_session(now)
        session_stats = get_session_stats(bars)

        session_display = {
            "pre_market": "Pre-Market",
            "premarket": "Pre-Market",
            "ny_open": "NY Open",
            "midday": "Midday",
            "power_hour": "Power Hour",
            "after_hours": "After Hours",
            "overnight": "Overnight",
            "globex": "Globex",
            "closed": "Closed",
        }
        label = session_display.get(current_session.value, current_session.value)

        stat = session_stats.get(current_session)
        bar_info = f" | {stat.bar_count} bars" if stat and stat.bar_count > 0 else ""
        events.append({
            "timestamp": now - 300,
            "time": _fmt_time(now - 300),
            "type": "SESSION",
            "severity": "info",
            "message": f"Session: {label}{bar_info}",
            "source": "sessions",
        })
    except Exception:
        pass

    # ── 6. Discipline warnings ────────────────────────────────────────────────
    try:
        swings = detect_swings(bars)
        trend = classify_trend(swings)
        current_session = classify_session(now)

        ctx = DisciplineContext(
            trend=trend,
            session=current_session.value,
            risk_used_pct=0.0,
            trade_count=0,
            max_trades=10,
            consecutive_losses=0,
        )
        warnings = generate_warnings(ctx)
        for w in warnings:
            severity_map = {"low": "info", "medium": "warning", "high": "critical"}
            events.append({
                "timestamp": now - 120,
                "time": _fmt_time(now - 120),
                "type": "RISK",
                "severity": severity_map.get(w.severity.value, "info"),
                "message": w.message,
                "source": "discipline",
            })
    except Exception:
        pass

    # ── 7. BIAS state ─────────────────────────────────────────────────────────
    try:
        from arctis.analysis.bias_state import calculate_bias_state
        swings = detect_swings(bars)
        trend = classify_trend(swings)
        ema_list = calculate_ema_ribbon(bars)
        vwap_list = calculate_vwap(bars)

        last_close = bars[-1].close if bars else 0
        latest_vwap = vwap_list[-1] if vwap_list else None
        latest_ema = ema_list[-1] if ema_list else None

        vwap_pos = "at"
        if latest_vwap and last_close > latest_vwap.vwap:
            vwap_pos = "above"
        elif latest_vwap and last_close < latest_vwap.vwap:
            vwap_pos = "below"

        ema_align = latest_ema.alignment if latest_ema else "mixed"

        bias = calculate_bias_state(
            bars=bars,
            trend=trend.value,
            velocity_scale=5,
            auction_quality="moderat",
            vwap_position=vwap_pos,
            ema_alignment=ema_align,
        )

        severity = "signal" if bias.state.value in ("strong_bull", "weak_bull") else \
                   "warning" if bias.state.value in ("strong_bear", "weak_bear") else "info"
        events.append({
            "timestamp": now - 60,
            "time": _fmt_time(now - 60),
            "type": "BIAS",
            "severity": severity,
            "message": f"BIAS: {bias.state.value.replace('_', ' ').title()} (score {bias.score})",
            "source": "bias",
        })
    except Exception:
        pass

    # ── Sort descending, deduplicate closely stacked timestamps, limit 50 ──────
    events.sort(key=lambda e: e["timestamp"], reverse=True)
    return {"events": events[:50]}

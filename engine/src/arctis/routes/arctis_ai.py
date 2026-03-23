"""Arctis AI assistant route.

Provides precise, actionable trading analysis with exact price levels:
- Entry, Stop Loss, Target prices
- Clear action: WARTEN / EINSTEIGEN / NICHT HANDELN
- Risk/Reward ratio
- Live market context
"""

import logging
from fastapi import APIRouter
from arctis.db import fetch_bars_as_models
from arctis.analysis.sessions import classify_session
from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.signals import detect_signals
from arctis.analysis.indicators import calculate_indicators
from arctis.analysis.volume_profile import build_volume_profile
from arctis.analysis.vwap import calculate_vwap

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/arctis", tags=["arctis-ai"])


def _build_full_context(market: str = "NQ", timeframe: str = "1min") -> dict:
    """Build complete market context with signals, levels, and actionable data."""
    try:
        bars = fetch_bars_as_models(market=market, days=5, timeframe=timeframe)
        if not bars:
            return {"status": "no_data", "market": market}

        last = bars[-1]
        price = last.close
        ref_ts = last.timestamp

        # Session
        try:
            session = classify_session(ref_ts).value
        except Exception:
            session = "unknown"

        # Confluence
        try:
            conf = calculate_confluence(bars)
            score, direction, confidence = conf.score, conf.direction, conf.confidence
        except Exception:
            score, direction, confidence = 0, "neutral", "unknown"

        # Bias
        try:
            bias_result = calculate_bias_state(bars)
            bias = bias_result.get("state", "neutral") if isinstance(bias_result, dict) else str(bias_result)
        except Exception:
            bias = "neutral"

        # Trend
        try:
            swings = detect_swings(bars)
            trend_state = classify_trend(swings)
            trend = trend_state.value if hasattr(trend_state, "value") else str(trend_state)
        except Exception:
            trend = "unknown"

        # VWAP
        try:
            vwap_data = calculate_vwap(bars)
            vwap = vwap_data[-1]["vwap"] if vwap_data else price
        except Exception:
            vwap = price

        # Volume Profile
        try:
            vp = build_volume_profile(bars)
            poc = vp.poc
            vah = vp.vah
            val = vp.val
        except Exception:
            poc = vah = val = price

        # Indicators (EMA)
        try:
            ind = calculate_indicators(bars)
            ema9 = ind.get("ema_9", price)
            ema21 = ind.get("ema_21", price)
        except Exception:
            ema9 = ema21 = price

        # Signals — the critical part
        try:
            signals = detect_signals(bars)
            active_signals = [
                {
                    "type": s.signal_type,
                    "direction": s.direction,
                    "entry": s.entry_price,
                    "stop": s.stop_price,
                    "target": s.target_price,
                    "rr": s.risk_reward,
                    "confidence": s.confidence,
                    "reason": s.reason,
                }
                for s in signals[-3:]  # Last 3 signals
            ]
        except Exception:
            active_signals = []

        return {
            "status": "ok",
            "market": market,
            "price": price,
            "session": session,
            "score": score,
            "direction": direction,
            "confidence": confidence,
            "bias": bias,
            "trend": trend,
            "vwap": round(vwap, 2),
            "poc": round(poc, 2),
            "vah": round(vah, 2),
            "val": round(val, 2),
            "ema9": round(ema9, 2),
            "ema21": round(ema21, 2),
            "signals": active_signals,
            "bar_count": len(bars),
        }
    except Exception as e:
        logger.warning(f"Context build failed: {e}")
        return {"status": "error", "error": str(e), "market": market}


def _generate_precise_answer(ctx: dict) -> list[dict]:
    """Generate precise, actionable trading answers with exact levels."""
    if ctx.get("status") != "ok":
        return [{"title": "Keine Daten", "content": "Marktdaten nicht verfuegbar.", "action": "WARTEN"}]

    results = []
    price = ctx["price"]
    bias = ctx["bias"]
    score = ctx["score"]
    direction = ctx["direction"]
    vwap = ctx["vwap"]
    poc = ctx["poc"]
    vah = ctx["vah"]
    val = ctx["val"]
    signals = ctx["signals"]
    session = ctx["session"]
    trend = ctx["trend"]
    market = ctx["market"]

    # ── 1. STATUS: Exakte Marktlage ──────────────────────────────────────────
    price_vs_vwap = "ueber" if price > vwap else "unter"
    price_vs_poc = "ueber" if price > poc else "unter"

    results.append({
        "title": f"{market} — {price:,.2f}",
        "content": (
            f"Session: {session} | Trend: {trend} | Bias: {bias}\n"
            f"Confluence: {score:+d} ({direction}) | Confidence: {ctx['confidence']}\n"
            f"Preis {price_vs_vwap} VWAP ({vwap:,.2f}) | {price_vs_poc} POC ({poc:,.2f})\n"
            f"VAH: {vah:,.2f} | VAL: {val:,.2f} | EMA9: {ctx['ema9']:,.2f} | EMA21: {ctx['ema21']:,.2f}"
        ),
        "type": "status",
    })

    # ── 2. AKTIVE SIGNALE mit exakten Levels ─────────────────────────────────
    if signals:
        for sig in signals:
            entry = sig["entry"]
            stop = sig["stop"]
            target = sig["target"]
            rr = sig["rr"]
            risk_pts = abs(entry - stop)
            reward_pts = abs(target - entry)
            is_long = sig["direction"] == "long"

            # Bestimme ob Setup aktiv oder abwarten
            if is_long:
                if price <= entry * 1.001:
                    action = "EINSTEIGEN" if sig["confidence"] == "high" else "BEREIT MACHEN"
                elif price > entry:
                    action = "VERPASST — Naechsten Pullback abwarten"
                else:
                    action = "WARTEN auf Preis bei Entry"
            else:
                if price >= entry * 0.999:
                    action = "EINSTEIGEN" if sig["confidence"] == "high" else "BEREIT MACHEN"
                elif price < entry:
                    action = "VERPASST — Naechstes Rally abwarten"
                else:
                    action = "WARTEN auf Preis bei Entry"

            results.append({
                "title": f"{'LONG' if is_long else 'SHORT'} — {sig['type'].upper().replace('_', ' ')}",
                "content": (
                    f"Entry:  {entry:,.2f}\n"
                    f"Stop:   {stop:,.2f} ({risk_pts:,.1f} pts Risiko)\n"
                    f"Target: {target:,.2f} ({reward_pts:,.1f} pts Reward)\n"
                    f"R:R:    {rr:.1f} | Confidence: {sig['confidence']}\n"
                    f"Grund:  {sig['reason']}"
                ),
                "action": action,
                "type": "signal",
            })
    else:
        # Keine Signale — was tun?
        if abs(score) < 3:
            action = "WARTEN — Kein klares Setup. Markt in Balance."
        elif session in ("pre_market", "Pre-Mkt"):
            action = "WARTEN — Pre-Market. Warte auf RTH Open."
        else:
            # Berechne naechstgelegenes Level als potenziellen Entry
            levels = sorted([
                ("VWAP", vwap, abs(price - vwap)),
                ("POC", poc, abs(price - poc)),
                ("VAH", vah, abs(price - vah)),
                ("VAL", val, abs(price - val)),
            ], key=lambda x: x[2])
            nearest = levels[0]
            action = f"WARTEN — Kein aktives Signal. Naechstes Key Level: {nearest[0]} bei {nearest[1]:,.2f} ({nearest[2]:,.1f} pts entfernt)"

        results.append({
            "title": "Kein aktives Setup",
            "content": action,
            "action": "WARTEN",
            "type": "no_signal",
        })

    return results


@router.post("/ask")
async def ask_arctis(body: dict) -> dict:
    """Arctis AI — praezise Handelsanalyse mit exakten Entry/Stop/Target Levels."""
    question: str = body.get("question", "")
    market: str = body.get("market", "NQ")
    timeframe: str = body.get("timeframe", "1min")

    ctx = _build_full_context(market, timeframe)
    results = _generate_precise_answer(ctx)

    return {
        "question": question,
        "results": results,
        "context": ctx,
    }


# Backward compat
@router.post("/travis/ask", include_in_schema=False)
async def ask_travis_compat(body: dict) -> dict:
    return await ask_arctis(body)

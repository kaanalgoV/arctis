"""Arctis AI assistant route.

Context-aware chatbot that understands questions and gives precise answers
using the full analysis engine. Different questions get different answers.
"""

import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from arctis.db import fetch_bars_as_models
from arctis.analysis.sessions import classify_session
from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.signals import detect_signals
from arctis.analysis.indicators import calculate_ema_ribbon
from arctis.analysis.volume_profile import build_volume_profile
from arctis.analysis.vwap import calculate_vwap

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/arctis", tags=["arctis-ai"])


def _build_full_context(market: str, timeframe: str, days: int = 5) -> dict:
    """Build complete market context."""
    try:
        bars = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
        if not bars:
            return {"status": "no_data", "market": market}

        last = bars[-1]
        price = last.close
        high = max(b.high for b in bars[-100:]) if len(bars) > 1 else price
        low = min(b.low for b in bars[-100:]) if len(bars) > 1 else price

        # Session
        try: session = classify_session(last.timestamp).value
        except: session = "unknown"

        # Confluence
        try:
            conf = calculate_confluence(bars)
            score, direction, confidence = conf.score, conf.direction, conf.confidence
        except: score, direction, confidence = 0, "neutral", "unknown"

        # Bias
        try:
            br = calculate_bias_state(bars)
            bias = br.get("state", "neutral") if isinstance(br, dict) else str(br)
            bias_score = br.get("score", 0) if isinstance(br, dict) else 0
        except: bias, bias_score = "neutral", 0

        # Trend
        try:
            swings = detect_swings(bars)
            trend = classify_trend(swings)
            trend = trend.value if hasattr(trend, "value") else str(trend)
        except: trend = "unknown"

        # VWAP
        try:
            vd = calculate_vwap(bars)
            vwap = vd[-1]["vwap"] if vd else price
        except: vwap = price

        # Volume Profile
        try:
            vp = build_volume_profile(bars)
            poc, vah, val = vp.poc, vp.vah, vp.val
        except: poc = vah = val = price

        # EMA
        try:
            er = calculate_ema_ribbon(bars)
            le = er[-1] if er else None
            ema9 = le.ema_9 if le and le.ema_9 is not None else price
            ema21 = le.ema_21 if le and le.ema_21 is not None else price
        except: ema9 = ema21 = price

        # Signals
        try:
            sigs = detect_signals(bars)
            active_signals = [
                {"type": s.signal_type, "direction": s.direction,
                 "entry": s.entry_price, "stop": s.stop_price,
                 "target": s.target_price, "rr": s.risk_reward,
                 "confidence": s.confidence, "reason": s.reason}
                for s in sigs[-3:]
            ]
        except: active_signals = []

        # Yesterday stats
        today_bars = []
        yesterday_bars = []
        try:
            dates = sorted(set(datetime.fromtimestamp(b.timestamp, tz=timezone.utc).date() for b in bars))
            if len(dates) >= 2:
                yday = dates[-2]
                tday = dates[-1]
                yesterday_bars = [b for b in bars if datetime.fromtimestamp(b.timestamp, tz=timezone.utc).date() == yday]
                today_bars = [b for b in bars if datetime.fromtimestamp(b.timestamp, tz=timezone.utc).date() == tday]
        except: pass

        yday_high = max(b.high for b in yesterday_bars) if yesterday_bars else 0
        yday_low = min(b.low for b in yesterday_bars) if yesterday_bars else 0
        yday_close = yesterday_bars[-1].close if yesterday_bars else 0
        yday_open = yesterday_bars[0].open if yesterday_bars else 0
        yday_volume = sum(b.volume for b in yesterday_bars) if yesterday_bars else 0
        yday_range = yday_high - yday_low

        today_high = max(b.high for b in today_bars) if today_bars else price
        today_low = min(b.low for b in today_bars) if today_bars else price
        today_open = today_bars[0].open if today_bars else price
        today_volume = sum(b.volume for b in today_bars) if today_bars else 0
        today_range = today_high - today_low
        today_change = price - today_open
        today_change_pct = (today_change / today_open * 100) if today_open else 0

        return {
            "status": "ok", "market": market, "price": price,
            "session": session, "score": score, "direction": direction,
            "confidence": confidence, "bias": bias, "bias_score": bias_score,
            "trend": trend, "vwap": round(vwap, 2),
            "poc": round(poc, 2), "vah": round(vah, 2), "val": round(val, 2),
            "ema9": round(ema9, 2), "ema21": round(ema21, 2),
            "signals": active_signals, "bar_count": len(bars),
            "today_high": round(today_high, 2), "today_low": round(today_low, 2),
            "today_open": round(today_open, 2), "today_volume": today_volume,
            "today_range": round(today_range, 2), "today_change": round(today_change, 2),
            "today_change_pct": round(today_change_pct, 2),
            "yday_high": round(yday_high, 2), "yday_low": round(yday_low, 2),
            "yday_close": round(yday_close, 2), "yday_open": round(yday_open, 2),
            "yday_volume": yday_volume, "yday_range": round(yday_range, 2),
        }
    except Exception as e:
        logger.warning(f"Context build failed: {e}")
        return {"status": "error", "error": str(e), "market": market}


def _classify_question(q: str) -> str:
    """Classify the user's question into a category."""
    q = q.lower().strip()

    if any(w in q for w in ["gestern", "yesterday", "vorige", "letzte session"]):
        return "yesterday"
    if any(w in q for w in ["wo steht", "wo ist", "preis", "price", "kurs", "stand"]):
        return "price"
    if any(w in q for w in ["einsteig", "entry", "trade", "handeln", "soll ich", "long", "short"]):
        return "trade"
    if any(w in q for w in ["setup", "signal", "chance", "opportunit", "moeglich"]):
        return "setups"
    if any(w in q for w in ["bias", "richtung", "seite", "direction", "welche seite"]):
        return "bias"
    if any(w in q for w in ["session", "sitzung", "ny open", "pre-market", "power hour"]):
        return "session"
    if any(w in q for w in ["vwap", "poc", "vah", "val", "level", "zone", "support", "widerstand", "resist"]):
        return "levels"
    if any(w in q for w in ["was macht", "wie sieht", "analyse", "uebersicht", "zusammenfassung", "markt"]):
        return "overview"
    if any(w in q for w in ["risiko", "risk", "stop", "verlust", "drawdown"]):
        return "risk"
    return "overview"


def _answer_question(question: str, ctx: dict) -> list[dict]:
    """Generate a specific answer based on the question type."""
    if ctx.get("status") != "ok":
        return [{"title": "Keine Daten", "content": "Marktdaten nicht verfuegbar."}]

    category = _classify_question(question)
    p = ctx["price"]
    m = ctx["market"]

    if category == "yesterday":
        if ctx["yday_close"] == 0:
            return [{"title": "Gestern", "content": "Keine Daten von gestern verfuegbar.", "type": "status"}]

        yday_dir = "gestiegen" if ctx["yday_close"] > ctx["yday_open"] else "gefallen"
        yday_chg = ctx["yday_close"] - ctx["yday_open"]
        return [{
            "title": f"Gestern — {m}",
            "content": (
                f"Der Markt ist {yday_dir} ({yday_chg:+,.2f} pts).\n"
                f"Open:   {ctx['yday_open']:,.2f}\n"
                f"High:   {ctx['yday_high']:,.2f}\n"
                f"Low:    {ctx['yday_low']:,.2f}\n"
                f"Close:  {ctx['yday_close']:,.2f}\n"
                f"Range:  {ctx['yday_range']:,.2f} pts\n"
                f"Volume: {ctx['yday_volume']:,}"
            ),
            "type": "status",
        }, {
            "title": "Heute vs Gestern",
            "content": (
                f"Aktuell: {p:,.2f} ({'+' if p > ctx['yday_close'] else ''}{p - ctx['yday_close']:,.2f} vs gestern Close)\n"
                f"{'Ueber' if p > ctx['yday_high'] else 'Unter'} dem gestrigen High ({ctx['yday_high']:,.2f})\n"
                f"{'Ueber' if p > ctx['yday_low'] else 'Unter'} dem gestrigen Low ({ctx['yday_low']:,.2f})"
            ),
            "type": "status",
        }]

    elif category == "price":
        pvw = "ueber" if p > ctx["vwap"] else "unter"
        ppoc = "ueber" if p > ctx["poc"] else "unter"
        return [{
            "title": f"{m} — {p:,.2f}",
            "content": (
                f"Preis:    {p:,.2f}\n"
                f"Tages-H:  {ctx['today_high']:,.2f}\n"
                f"Tages-L:  {ctx['today_low']:,.2f}\n"
                f"Change:   {ctx['today_change']:+,.2f} ({ctx['today_change_pct']:+.2f}%)\n"
                f"Range:    {ctx['today_range']:,.2f} pts\n"
                f"\n"
                f"Preis {pvw} VWAP ({ctx['vwap']:,.2f})\n"
                f"Preis {ppoc} POC ({ctx['poc']:,.2f})\n"
                f"VAH: {ctx['vah']:,.2f} | VAL: {ctx['val']:,.2f}\n"
                f"EMA9: {ctx['ema9']:,.2f} | EMA21: {ctx['ema21']:,.2f}"
            ),
            "type": "status",
        }]

    elif category == "bias":
        bs = ctx["bias"]
        bsc = ctx["bias_score"]
        strength = "stark" if abs(bsc) > 5 else "moderat" if abs(bsc) > 2 else "schwach"
        return [{
            "title": f"Bias: {bs}",
            "content": (
                f"Score: {bsc:+d}/10 — {strength}\n"
                f"Trend: {ctx['trend']}\n"
                f"Confluence: {ctx['score']:+d} ({ctx['direction']})\n"
                f"\n"
                f"{'Der Markt tendiert nach oben. Pullbacks zum VWAP als Long-Entries suchen.' if 'long' in bs.lower() else ''}"
                f"{'Der Markt tendiert nach unten. Rallyes zum VWAP als Short-Entries suchen.' if 'short' in bs.lower() else ''}"
                f"{'Markt in Balance. Range-Kanten (VAH/VAL) handeln oder auf Breakout warten.' if 'long' not in bs.lower() and 'short' not in bs.lower() else ''}"
            ),
            "type": "status",
        }]

    elif category == "trade" or category == "setups":
        results = []
        sigs = ctx["signals"]
        if sigs:
            for sig in sigs:
                e, s, t = sig["entry"], sig["stop"], sig["target"]
                is_long = sig["direction"] == "long"
                risk = abs(e - s)
                reward = abs(t - e)

                if is_long:
                    if p <= e * 1.001: act = "EINSTEIGEN" if sig["confidence"] == "high" else "BEREIT MACHEN"
                    elif p > e: act = "VERPASST"
                    else: act = "WARTEN"
                else:
                    if p >= e * 0.999: act = "EINSTEIGEN" if sig["confidence"] == "high" else "BEREIT MACHEN"
                    elif p < e: act = "VERPASST"
                    else: act = "WARTEN"

                results.append({
                    "title": f"{'LONG' if is_long else 'SHORT'} — {sig['type'].replace('_', ' ').upper()}",
                    "content": (
                        f"Entry:  {e:,.2f}\n"
                        f"Stop:   {s:,.2f} ({risk:,.1f} pts)\n"
                        f"Target: {t:,.2f} ({reward:,.1f} pts)\n"
                        f"R:R:    {sig['rr']:.1f}\n"
                        f"Grund:  {sig['reason']}"
                    ),
                    "action": act,
                    "type": "signal",
                })
        else:
            levels = sorted([
                ("VWAP", ctx["vwap"], abs(p - ctx["vwap"])),
                ("POC", ctx["poc"], abs(p - ctx["poc"])),
                ("VAH", ctx["vah"], abs(p - ctx["vah"])),
                ("VAL", ctx["val"], abs(p - ctx["val"])),
            ], key=lambda x: x[2])
            near = levels[0]
            results.append({
                "title": "Kein aktives Setup",
                "content": (
                    f"Aktuell keine Signale. Markt bei {p:,.2f}.\n"
                    f"Naechstes Key Level: {near[0]} bei {near[1]:,.2f} ({near[2]:,.1f} pts entfernt).\n"
                    f"Confluence: {ctx['score']:+d} — {'zu schwach fuer Entry' if abs(ctx['score']) < 4 else 'Richtung erkennbar'}."
                ),
                "action": "WARTEN",
                "type": "no_signal",
            })
        return results

    elif category == "session":
        return [{
            "title": f"Session: {ctx['session']}",
            "content": (
                f"Aktuelle Session: {ctx['session']}\n"
                f"Tages-Range bisher: {ctx['today_range']:,.2f} pts\n"
                f"Tages-High: {ctx['today_high']:,.2f}\n"
                f"Tages-Low:  {ctx['today_low']:,.2f}\n"
                f"Volume:     {ctx['today_volume']:,}\n"
                f"\n"
                f"Gestern Close: {ctx['yday_close']:,.2f}\n"
                f"Gestern Range: {ctx['yday_range']:,.2f} pts"
            ),
            "type": "status",
        }]

    elif category == "levels":
        dist_vwap = p - ctx["vwap"]
        dist_poc = p - ctx["poc"]
        return [{
            "title": "Key Levels",
            "content": (
                f"VWAP:  {ctx['vwap']:,.2f}  ({dist_vwap:+,.2f})\n"
                f"POC:   {ctx['poc']:,.2f}  ({dist_poc:+,.2f})\n"
                f"VAH:   {ctx['vah']:,.2f}  ({p - ctx['vah']:+,.2f})\n"
                f"VAL:   {ctx['val']:,.2f}  ({p - ctx['val']:+,.2f})\n"
                f"EMA9:  {ctx['ema9']:,.2f}  ({p - ctx['ema9']:+,.2f})\n"
                f"EMA21: {ctx['ema21']:,.2f}  ({p - ctx['ema21']:+,.2f})\n"
                f"\n"
                f"Gestern:\n"
                f"PDH: {ctx['yday_high']:,.2f} | PDL: {ctx['yday_low']:,.2f} | PDC: {ctx['yday_close']:,.2f}"
            ),
            "type": "status",
        }]

    elif category == "risk":
        sigs = ctx["signals"]
        if sigs:
            sig = sigs[0]
            risk = abs(sig["entry"] - sig["stop"])
            return [{
                "title": "Risiko-Analyse",
                "content": (
                    f"Aktuelles Setup: {sig['type'].replace('_',' ').upper()}\n"
                    f"Risiko: {risk:,.2f} pts pro Kontrakt\n"
                    f"NQ Tick = $5 → Risiko = ${risk * 4 * 5:,.0f} pro Kontrakt\n"
                    f"R:R: {sig['rr']:.1f}\n"
                    f"Confidence: {sig['confidence']}\n"
                    f"\nBei 2% Risiko auf 50k Konto:\n"
                    f"Max Risiko: $1,000\n"
                    f"Max Kontrakte: {max(1, int(1000 / (risk * 20)))}"
                ),
                "type": "status",
            }]
        return [{"title": "Risiko", "content": "Kein aktives Setup — kein Risiko zu berechnen.", "type": "no_signal"}]

    # Default: overview
    pvw = "ueber" if p > ctx["vwap"] else "unter"
    results = [{
        "title": f"{m} — Ueberblick",
        "content": (
            f"Preis: {p:,.2f} ({ctx['today_change']:+,.2f} heute)\n"
            f"Session: {ctx['session']} | Trend: {ctx['trend']}\n"
            f"Bias: {ctx['bias']} ({ctx['bias_score']:+d})\n"
            f"Confluence: {ctx['score']:+d} → {ctx['direction']}\n"
            f"Preis {pvw} VWAP ({ctx['vwap']:,.2f})\n"
            f"{len(ctx['signals'])} aktive Signale"
        ),
        "type": "status",
    }]
    if ctx["signals"]:
        sig = ctx["signals"][0]
        results.append({
            "title": f"Top Setup: {sig['type'].replace('_',' ').upper()} {sig['direction'].upper()}",
            "content": f"Entry: {sig['entry']:,.2f} | Stop: {sig['stop']:,.2f} | Target: {sig['target']:,.2f} | R:R: {sig['rr']:.1f}",
            "action": "BEREIT MACHEN" if sig["confidence"] != "high" else "EINSTEIGEN",
            "type": "signal",
        })
    return results


@router.post("/ask")
async def ask_arctis(body: dict) -> dict:
    """Arctis AI — context-aware chatbot with full engine access."""
    question: str = body.get("question", "")
    market: str = body.get("market", "NQ")
    # Always use 1min for most accurate current price, regardless of chart timeframe
    timeframe = "1min"

    ctx = _build_full_context(market, timeframe)
    results = _answer_question(question, ctx)

    return {"question": question, "results": results, "context": ctx}


@router.post("/travis/ask", include_in_schema=False)
async def ask_travis_compat(body: dict) -> dict:
    return await ask_arctis(body)

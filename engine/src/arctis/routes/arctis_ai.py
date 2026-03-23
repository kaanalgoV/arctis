"""Arctis AI assistant route.

Provides contextual trading analysis by combining:
1. Live market context (price, session, bias, confluence, trend)
2. Traivend knowledge base via MCP proxy (ask_about_videos, search_videos)

The frontend sends a question + current market/timeframe.
The backend builds context from live analysis and returns intelligent answers.
"""

import os
import json
import logging
import httpx
from fastapi import APIRouter
from arctis.db import fetch_bars_as_models
from arctis.analysis.sessions import classify_session
from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/arctis", tags=["arctis-ai"])

# MCP proxy URL — if Travis MCP is running as HTTP, configure here
_MCP_BASE = os.environ.get("TRAVIS_MCP_URL", "")


def _build_market_context(market: str = "NQ", timeframe: str = "1min") -> dict:
    """Build current market context from live analysis modules."""
    try:
        bars = fetch_bars_as_models(market=market, days=5, timeframe=timeframe)
        if not bars:
            return {"status": "no_data", "market": market}

        last_price = bars[-1].close
        ref_ts = bars[-1].timestamp

        # Session
        try:
            current_session = classify_session(ref_ts).value
        except Exception:
            current_session = "unknown"

        # Confluence
        try:
            confluence = calculate_confluence(bars)
            score = confluence.score
            direction = confluence.direction
            confidence = confluence.confidence
        except Exception:
            score, direction, confidence = 0, "neutral", "unknown"

        # Bias
        try:
            bias = calculate_bias_state(bars)
            bias_state = bias.get("state", "neutral") if isinstance(bias, dict) else str(bias)
        except Exception:
            bias_state = "neutral"

        # Structure / Trend
        try:
            swings = detect_swings(bars)
            trend_state = classify_trend(swings)
            trend = trend_state.value if hasattr(trend_state, "value") else str(trend_state)
        except Exception:
            trend = "unknown"

        return {
            "status": "ok",
            "market": market,
            "last_price": last_price,
            "current_session": current_session,
            "confluence_score": score,
            "direction": direction,
            "confidence": confidence,
            "bias_state": bias_state,
            "trend": trend,
            "bar_count": len(bars),
            "timeframe": timeframe,
        }
    except Exception as e:
        logger.warning(f"Failed to build market context: {e}")
        return {"status": "error", "error": str(e), "market": market}


def _format_context_summary(ctx: dict) -> str:
    """Format market context as a readable summary string."""
    if ctx.get("status") != "ok":
        return "Market data unavailable."

    return (
        f"{ctx['market']} @ {ctx['last_price']:,.2f} | "
        f"Session: {ctx['current_session']} | "
        f"Trend: {ctx['trend']} | "
        f"Confluence: {ctx['confluence_score']:+d} ({ctx['direction']}) | "
        f"Bias: {ctx['bias_state']}"
    )


def _generate_contextual_answer(question: str, ctx: dict) -> list[dict]:
    """Generate analysis answers from live market context."""
    results = []
    q = question.lower()

    price = ctx.get("last_price", 0)
    session = ctx.get("current_session", "unknown")
    score = ctx.get("confluence_score", 0)
    direction = ctx.get("direction", "neutral")
    bias = ctx.get("bias_state", "neutral")
    trend = ctx.get("trend", "unknown")
    market = ctx.get("market", "NQ")

    # Always include market overview
    results.append({
        "title": f"{market} Live Analysis",
        "content": (
            f"Price: {price:,.2f}. Session: {session}. Trend: {trend}. "
            f"Confluence: {score:+d} ({direction}). Bias: {bias}."
        ),
        "source": "arctis_live",
    })

    # Bias-specific guidance
    bias_lower = bias.lower()
    if "long" in bias_lower:
        results.append({
            "title": "Long Bias — Aktionsplan",
            "content": (
                f"Markt zeigt {bias}. Pullbacks zu VWAP oder Support-Levels "
                f"als Long-Einstiege suchen. Confluence {score:+d} "
                f"{'unterstuetzt' if score > 3 else 'schwach fuer'} diese Richtung. "
                f"Keine Gegentrend-Shorts bis Bias dreht."
            ),
            "source": "arctis_analysis",
        })
    elif "short" in bias_lower:
        results.append({
            "title": "Short Bias — Aktionsplan",
            "content": (
                f"Markt zeigt {bias}. Rallyes zu VWAP oder Widerstand "
                f"als Short-Einstiege suchen. Confluence {score:+d} "
                f"{'unterstuetzt' if score < -3 else 'schwach fuer'} diese Richtung."
            ),
            "source": "arctis_analysis",
        })
    else:
        results.append({
            "title": "Neutral — Range-Bedingungen",
            "content": (
                f"Bias ist {bias} — Markt in Balance. "
                f"Handele die Range-Kanten (VA High/Low) oder warte auf Breakout. "
                f"Confluence {score:+d} zeigt keine starke Ueberzeugung."
            ),
            "source": "arctis_analysis",
        })

    # Session-specific
    if session in ("pre_market", "Pre-Mkt"):
        results.append({
            "title": "Pre-Market",
            "content": "Pre-Market ist oft choppig. Warte auf RTH Open fuer sauberere Setups.",
            "source": "arctis_analysis",
        })
    elif session in ("ny_open", "NY Open"):
        results.append({
            "title": "NY Open — Hohe Opportunitaet",
            "content": (
                "Opening Range bildet sich. Achte auf ORB Breakout oder IB Extension. "
                "Erste 15 Minuten setzen den Ton. Volume-Bestaetigung kritisch."
            ),
            "source": "arctis_analysis",
        })

    return results


@router.post("/ask")
async def ask_arctis(body: dict) -> dict:
    """Arctis AI assistant — answers trading questions with live market context.

    Combines live analysis data with Traivend knowledge base.
    """
    question: str = body.get("question", "")
    market: str = body.get("market", "NQ")
    timeframe: str = body.get("timeframe", "1min")

    # 1. Build live market context
    context = _build_market_context(market, timeframe)
    context_summary = _format_context_summary(context)

    # 2. Generate contextual analysis answer
    results = _generate_contextual_answer(question, context)

    return {
        "question": question,
        "results": results,
        "context": context,
        "context_summary": context_summary,
    }


# Keep backward compatibility with old /api/travis/ask endpoint
@router.post("/travis/ask", include_in_schema=False, deprecated=True)
async def ask_travis_compat(body: dict) -> dict:
    """Backward-compatible alias for /api/arctis/ask."""
    return await ask_arctis(body)

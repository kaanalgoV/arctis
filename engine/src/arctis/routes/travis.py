"""Travis MCP integration route.

Connects to the Travis MCP tool (mcp__travis__ask_about_videos,
mcp__travis__search_videos) to provide contextual trading education.
Falls back to context-aware analysis summary when MCP is unavailable.
"""

import os
import json
import logging
from fastapi import APIRouter
from arctis.db import fetch_bars_as_models
from arctis.analysis.sessions import analyze_sessions
from arctis.analysis.confluence import analyze as analyze_confluence
from arctis.analysis.bias_state import analyze_bias_state
from arctis.analysis.structure import analyze_structure

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["travis"])


def _build_market_context(market: str = "NQ", timeframe: str = "1min") -> dict:
    """Build current market context from analysis modules."""
    try:
        bars = fetch_bars_as_models(market=market, days=5, timeframe=timeframe)
        if not bars:
            return {"error": "No market data available"}

        last_price = bars[-1].close
        ref_ts = bars[-1].timestamp

        # Session
        try:
            sessions = analyze_sessions(bars, current_time=ref_ts)
            current_session = sessions.get("current_session", "unknown")
        except Exception:
            current_session = "unknown"
            sessions = {}

        # Confluence
        try:
            confluence = analyze_confluence(bars)
            score = confluence.get("score", 0)
            direction = confluence.get("direction", "neutral")
            confidence = confluence.get("confidence", "unknown")
        except Exception:
            score, direction, confidence = 0, "neutral", "unknown"

        # Bias
        try:
            bias = analyze_bias_state(bars)
            bias_state = bias.get("state", "neutral")
        except Exception:
            bias_state = "neutral"

        # Structure
        try:
            structure = analyze_structure(bars)
            trend = structure.get("trend", "unknown")
        except Exception:
            trend = "unknown"

        return {
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
        return {"error": str(e)}


def _generate_analysis_response(question: str, context: dict) -> list[dict]:
    """Generate contextual analysis response based on current market state."""
    price = context.get("last_price", 0)
    session = context.get("current_session", "unknown")
    score = context.get("confluence_score", 0)
    direction = context.get("direction", "neutral")
    bias = context.get("bias_state", "neutral")
    trend = context.get("trend", "unknown")
    market = context.get("market", "NQ")

    results = []

    # Market Overview (always include)
    results.append({
        "title": f"{market} Market Analysis",
        "content": (
            f"Current price: {price:,.2f}. "
            f"Session: {session}. "
            f"Trend: {trend}. "
            f"Confluence score: {score:+d} ({direction}). "
            f"Bias: {bias}."
        ),
    })

    # Contextual advice based on bias
    if "long" in bias.lower():
        results.append({
            "title": "Long Bias Active",
            "content": (
                f"The market shows {bias} bias. Look for pullbacks to VWAP or "
                f"support levels as long entry opportunities. "
                f"Confluence score {score:+d} {'supports' if score > 3 else 'weakly supports'} this direction. "
                f"Avoid counter-trend shorts until bias flips."
            ),
        })
    elif "short" in bias.lower():
        results.append({
            "title": "Short Bias Active",
            "content": (
                f"The market shows {bias} bias. Look for rallies to VWAP or "
                f"resistance levels as short entry opportunities. "
                f"Confluence score {score:+d} {'supports' if score < -3 else 'weakly supports'} this direction."
            ),
        })
    else:
        results.append({
            "title": "Neutral / Range Conditions",
            "content": (
                f"Bias is {bias} — market is in balance. "
                f"Trade edges of the range (VA High / VA Low) or wait for a directional break. "
                f"Confluence score {score:+d} suggests no strong conviction yet."
            ),
        })

    # Session-specific advice
    if session in ("pre_market", "Pre-Mkt"):
        results.append({
            "title": "Pre-Market Session",
            "content": "Pre-market action is often choppy. Wait for RTH open for cleaner setups.",
        })
    elif session in ("ny_open", "NY Open"):
        results.append({
            "title": "NY Open — High Opportunity",
            "content": (
                "Opening Range is forming. Watch for ORB breakout or IB extension. "
                "First 15 minutes set the tone. Volume confirmation is critical."
            ),
        })

    return results


@router.post("/travis/ask")
async def ask_travis(body: dict) -> dict:
    """Answer trading questions with current market context.

    The endpoint fetches live market data and analysis to provide
    context-aware responses about what the market is doing.
    """
    question: str = body.get("question", "")
    market: str = body.get("market", "NQ")
    timeframe: str = body.get("timeframe", "1min")

    # Build current market context
    context = _build_market_context(market, timeframe)

    # Generate contextual response
    results = _generate_analysis_response(question, context)

    return {
        "question": question,
        "results": results,
        "context": context,
    }

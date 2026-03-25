"""Travis MCP integration route.

Endpoints:
  POST /api/travis/ask          — context-aware question answering
  POST /api/travis/search       — knowledge base search
  GET  /api/travis/checklist    — session checklist

All endpoints use TravisMCPClient which:
  1. Checks in-memory cache (5 min TTL)
  2. Tries real MCP tools (TODO — see services/travis_mcp.py)
  3. Falls back to local analysis engine
"""

import logging
from fastapi import APIRouter, Query
from arctis.db import fetch_bars_as_models
from arctis.analysis.sessions import classify_session
from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.signals import detect_signals
from arctis.analysis.vwap import calculate_vwap
from arctis.analysis.volume_profile import build_volume_profile
from arctis.services.travis_mcp import TravisContext, TravisResponse, get_travis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/travis", tags=["travis"])


# ---------------------------------------------------------------------------
# Context builder
# ---------------------------------------------------------------------------


def _build_travis_context(
    question: str,
    market: str = "NQ",
    timeframe: str = "1min",
    mode: str = "live",
) -> TravisContext:
    """Fetch live analysis data and package it into a TravisContext."""
    try:
        bars = fetch_bars_as_models(market=market, days=5, timeframe=timeframe)
    except Exception as exc:
        logger.warning("Could not fetch bars for Travis context: %s", exc)
        bars = []

    # --- Defaults ---
    session_label = "unknown"
    bias_direction = "neutral"
    bias_confidence = 0.0
    structure_summary = "unknown"
    recent_signals: list[str] = []
    visible_levels: list[str] = []
    active_setup_summary = ""
    resolved_symbol = market

    if bars:
        last = bars[-1]
        price = last.close

        try:
            session_label = classify_session(last.timestamp).value
        except Exception:
            pass

        try:
            conf = calculate_confluence(bars)
            if conf.direction and conf.direction != "neutral":
                bias_direction = conf.direction
            bias_confidence = min(abs(conf.score) / 10.0, 1.0)
        except Exception:
            pass

        try:
            br = calculate_bias_state(bars)
            if isinstance(br, dict):
                raw_bias = br.get("state", "neutral")
                raw_score = br.get("score", 0)
                if "long" in raw_bias.lower():
                    bias_direction = "long"
                elif "short" in raw_bias.lower():
                    bias_direction = "short"
                bias_confidence = min(abs(raw_score) / 10.0, 1.0)
        except Exception:
            pass

        try:
            swings = detect_swings(bars)
            trend = classify_trend(swings)
            trend_str = trend.value if hasattr(trend, "value") else str(trend)
            structure_summary = trend_str
        except Exception:
            pass

        try:
            sigs = detect_signals(bars)
            recent_signals = [
                f"{s.direction.upper()} {s.signal_type} E:{s.entry_price:.0f} SL:{s.stop_price:.0f}"
                for s in sigs[-3:]
            ]
            if sigs:
                top = sigs[-1]
                active_setup_summary = f"{top.direction} {top.signal_type.replace('_', ' ')}"
        except Exception:
            pass

        try:
            vd = calculate_vwap(bars)
            vwap = vd[-1]["vwap"] if vd else price
            visible_levels.append(f"VWAP {vwap:,.2f}")
        except Exception:
            pass

        try:
            vp = build_volume_profile(bars)
            visible_levels.append(f"POC {vp.poc:,.2f}")
            visible_levels.append(f"VAH {vp.vah:,.2f}")
            visible_levels.append(f"VAL {vp.val:,.2f}")
        except Exception:
            pass

    return TravisContext(
        market_root=market,
        resolved_symbol=resolved_symbol,
        timeframe=timeframe,
        session_label=session_label,
        bias_direction=bias_direction,
        bias_confidence=bias_confidence,
        structure_summary=structure_summary,
        active_setup_summary=active_setup_summary,
        recent_signals=recent_signals,
        visible_levels=visible_levels,
        mode=mode,
        user_query=question,
    )


def _response_to_dict(resp: TravisResponse) -> dict:
    """Serialize a TravisResponse to a JSON-safe dict."""
    return {
        "kind": resp.kind,
        "title": resp.title,
        "summary": resp.summary,
        "confidence": round(resp.confidence, 2),
        "why_now": resp.why_now,
        "source": resp.source,
        "data": resp.data or {},
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/ask")
async def ask_travis(body: dict) -> dict:
    """Answer a trading question with full market context.

    Request body:
      question      string   the user's question
      market        string   market root, e.g. "NQ" (default "NQ")
      timeframe     string   e.g. "1min" (default "1min")
      mode          string   "live" | "replay" (default "live")

    Response:
      question      string
      response      TravisResponse (structured)
      context       dict with raw analysis values
    """
    question: str = body.get("question", "")
    market: str = body.get("market", "NQ")
    timeframe: str = body.get("timeframe", "1min")
    mode: str = body.get("mode", "live")

    context = _build_travis_context(question, market, timeframe, mode)
    client = get_travis_client()

    try:
        resp = await client.ask(context)
    except Exception as exc:
        logger.exception("TravisMCPClient.ask failed: %s", exc)
        resp = TravisResponse(
            kind="explanation",
            title="Fehler",
            summary="Travis konnte keine Antwort generieren.",
            confidence=0.0,
            why_now="Interner Fehler.",
            source="local_fallback",
        )

    return {
        "question": question,
        "response": _response_to_dict(resp),
        # Legacy "results" field for backward compatibility with existing
        # TravisPanel/ArctisPanel that reads resp.results as a list.
        "results": [
            {"title": resp.title, "content": resp.summary, "type": "status"}
        ],
        "context": {
            "market": context.market_root,
            "symbol": context.resolved_symbol,
            "session": context.session_label,
            "bias": context.bias_direction,
            "bias_confidence": context.bias_confidence,
            "structure": context.structure_summary,
            "levels": context.visible_levels,
            "mode": context.mode,
        },
    }


@router.post("/search")
async def search_travis(body: dict) -> dict:
    """Search Travis knowledge base.

    Request body:
      query         string   search query
      market        string   market root (default "NQ")
      timeframe     string   (default "1min")

    Response:
      query         string
      results       list[TravisResponse]
    """
    query: str = body.get("query", "")
    market: str = body.get("market", "NQ")
    timeframe: str = body.get("timeframe", "1min")

    context = _build_travis_context(query, market, timeframe)
    client = get_travis_client()

    try:
        results = await client.search(query, context)
    except Exception as exc:
        logger.exception("TravisMCPClient.search failed: %s", exc)
        results = []

    return {
        "query": query,
        "results": [_response_to_dict(r) for r in results],
        "count": len(results),
    }


@router.get("/checklist")
async def get_checklist(
    session: str = Query(default="", description="Session name, e.g. 'NY Open'"),
    market: str = Query(default="NQ"),
    timeframe: str = Query(default="1min"),
) -> dict:
    """Return a structured checklist for the given session.

    Query params:
      session       string   e.g. "NY Open", "London", "Pre-Market"
      market        string   (default "NQ")
      timeframe     string   (default "1min")

    Response:
      session       string
      checklist     TravisResponse (kind="checklist")
    """
    context = _build_travis_context(
        question=f"checklist {session}",
        market=market,
        timeframe=timeframe,
    )

    # Override session if explicitly passed
    if session:
        context.session_label = session

    client = get_travis_client()

    try:
        resp = await client.get_session_checklist(session or context.session_label, context)
    except Exception as exc:
        logger.exception("TravisMCPClient.get_session_checklist failed: %s", exc)
        resp = TravisResponse(
            kind="checklist",
            title="Checklist nicht verfuegbar",
            summary="Konnte keine Checklist laden.",
            confidence=0.0,
            why_now="Fehler beim Laden.",
            source="local_fallback",
        )

    return {
        "session": session or context.session_label,
        "checklist": _response_to_dict(resp),
    }

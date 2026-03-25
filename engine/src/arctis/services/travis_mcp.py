"""Travis MCP BFF — server-side gateway to Travis knowledge tools.

Architecture:
  TravisMCPClient  ->  [MCP gateway]  external HTTP gateway (TRAVIS_MCP_GATEWAY)
                   ->  [fallback]     local analysis engine (arctis_ai patterns)
                   ->  [cache]        in-memory TTL cache (5 min)

MCP Gateway Integration:
  Set TRAVIS_MCP_GATEWAY=http://localhost:3001/mcp to enable real Travis knowledge.
  When the gateway is not configured or unreachable, the client falls back to the
  local analysis engine which produces fully-structured TravisResponse objects.

  Gateway protocol (POST /ask):
    Request:  { query, market, session, bias, setup, levels, structure }
    Response: { kind, title, summary, confidence, why_now }

  Gateway protocol (POST /search):
    Request:  { query, market, session, max_results }
    Response: { results: [{ kind, title, summary, confidence, why_now }] }
"""

import hashlib
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from arctis.analysis.sessions import Session, classify_session

logger = logging.getLogger(__name__)


def _get_realtime_session_label() -> str:
    """Return a human-readable session label derived from the current wall-clock time.

    This always uses ``time.time()`` so it cannot be stale even if a caller
    passes old API data.  The returned string matches the labels used in the
    local checklist handler (e.g. "NY Open", "Midday", "Power Hour").
    """
    session = classify_session(int(time.time()))
    _label_map: Dict[str, str] = {
        Session.OVERNIGHT.value:   "Overnight",
        Session.PREMARKET.value:   "Pre-Market",
        Session.NY_OPEN.value:     "NY Open",
        Session.MIDDAY.value:      "Midday",
        Session.AFTERNOON.value:   "Afternoon",
        Session.POWER_HOUR.value:  "Power Hour",
        Session.AFTER_HOURS.value: "After Hours",
    }
    return _label_map.get(session.value, session.value)


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


@dataclass
class TravisContext:
    """Rich market context sent with every Travis MCP query.

    All fields that describe the current chart state are included so Travis
    can give a maximally precise answer without the client needing to provide
    extra explanation.
    """
    market_root: str            # e.g. "NQ"
    resolved_symbol: str        # e.g. "NQH6"
    timeframe: str              # e.g. "1min"
    session_label: str          # e.g. "NY Open", "London"
    bias_direction: str         # "long" | "short" | "neutral"
    bias_confidence: float      # 0.0-1.0
    structure_summary: str      # e.g. "Uptrend with HH/HL sequence"
    active_setup_summary: str   # e.g. "Pullback long near VWAP"
    recent_signals: List[str]   # last 3 signal descriptions
    visible_levels: List[str]   # e.g. ["VWAP 19420", "POC 19380"]
    mode: str                   # "live" | "replay"
    user_query: str             # the raw question from the user


@dataclass
class TravisResponse:
    """Structured response from Travis MCP (or local analysis).

    kind values:
      "video"       — Travis pointed at a specific video
      "explanation" — text explanation of a concept or situation
      "checklist"   — step-by-step checklist for a session or setup
      "playbook"    — full trading playbook
      "review"      — Travis reviewing the current setup quality
    """
    kind: str
    title: str
    summary: str
    confidence: float           # 0.0-1.0
    why_now: str                # why this response is relevant right now
    source: str                 # "mcp" | "local_analysis" | "cache"
    data: Dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------


def _cache_key(prefix: str, text: str) -> str:
    return prefix + ":" + hashlib.sha1(text.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class TravisMCPClient:
    """BFF client that wraps the Travis MCP tools.

    Usage:
        client = TravisMCPClient(mcp_gateway_url="http://localhost:3001/mcp")
        response = await client.ask(context)
        results  = await client.search("pullback long", context)

    When mcp_gateway_url is set, the client calls the external MCP gateway
    first. On failure or when not configured, it falls back to the local
    analysis engine which mirrors the patterns in arctis_ai.py.
    """

    def __init__(self, cache_ttl: int = 300, mcp_gateway_url: Optional[str] = None) -> None:
        self._cache: Dict[str, tuple[float, Any]] = {}
        self._cache_ttl = cache_ttl
        self._mcp_url = mcp_gateway_url

    # ------------------------------------------------------------------ cache

    def _cache_get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            return None
        ts, value = entry
        if time.time() - ts > self._cache_ttl:
            del self._cache[key]
            return None
        return value

    def _cache_set(self, key: str, value: Any) -> None:
        self._cache[key] = (time.time(), value)

    # ------------------------------------------------------------------ public

    async def ask(self, context: TravisContext) -> TravisResponse:
        """Ask Travis about the current market situation.

        First checks the cache, then attempts MCP gateway (if configured),
        then falls back to local analysis engine.

        The ``context.session_label`` is always overridden with the real-time
        session so stale API data cannot route the response to the wrong handler.
        """
        # Always derive session from real-time clock — never trust caller-provided value
        realtime_session = _get_realtime_session_label()
        if context.session_label != realtime_session:
            logger.debug(
                "Travis: overriding stale session_label %r -> %r",
                context.session_label,
                realtime_session,
            )
            context = TravisContext(**{**context.__dict__, "session_label": realtime_session})

        key = _cache_key("ask", context.user_query + context.market_root + context.session_label)
        cached = self._cache_get(key)
        if cached is not None:
            logger.debug("Travis cache hit: %s", key)
            cached.source = "cache"
            return cached

        if self._mcp_url:
            response = await self._mcp_ask(context)
        else:
            response = self._local_ask(context)

        self._cache_set(key, response)
        return response

    async def search(self, query: str, context: TravisContext) -> List[TravisResponse]:
        """Search Travis knowledge base for a specific topic.

        Returns up to 5 ranked results.
        """
        key = _cache_key("search", query + context.market_root)
        cached = self._cache_get(key)
        if cached is not None:
            for r in cached:
                r.source = "cache"
            return cached

        if self._mcp_url:
            results = await self._mcp_search(query, context)
        else:
            results = self._local_search(query, context)

        self._cache_set(key, results)
        return results

    async def explain_pattern(self, pattern: str, context: TravisContext) -> TravisResponse:
        """Get an explanation for a specific pattern or concept."""
        ctx = TravisContext(
            **{**context.__dict__, "user_query": f"Erklaer mir {pattern}"}
        )
        return await self.ask(ctx)

    async def get_session_checklist(self, session: str, context: TravisContext) -> TravisResponse:
        """Return a structured checklist for the given session.

        The ``session`` parameter is overridden with the real-time session label
        so the checklist always matches the actual trading session, not a stale value
        passed from the API layer.
        """
        # Use real-time session — ignore whatever was passed in
        realtime_session = _get_realtime_session_label()
        if session != realtime_session:
            logger.debug(
                "Travis checklist: overriding stale session %r -> %r",
                session,
                realtime_session,
            )
            session = realtime_session

        # Keep context.session_label consistent with the corrected session
        if context.session_label != realtime_session:
            context = TravisContext(**{**context.__dict__, "session_label": realtime_session})

        key = _cache_key("checklist", session + context.market_root)
        cached = self._cache_get(key)
        if cached is not None:
            cached.source = "cache"
            return cached

        if self._mcp_url:
            ctx = TravisContext(
                **{**context.__dict__, "user_query": f"checklist {session}"}
            )
            response = await self._mcp_ask(ctx)
            # If the MCP gateway returned something useful, use it.
            # Otherwise fall through to local checklist which is always reliable.
            if response.source == "mcp" and response.kind != "explanation":
                self._cache_set(key, response)
                return response

        response = self._local_checklist(session, context)
        self._cache_set(key, response)
        return response

    # ------------------------------------------------------------------ MCP gateway

    async def _mcp_ask(self, context: TravisContext) -> TravisResponse:
        """Call external MCP gateway for real Travis knowledge.

        Falls back to local analysis on any error (timeout, non-200, parse failure).
        """
        try:
            import httpx
            payload = {
                "query": self._build_query(context),
                "market": context.market_root,
                "session": context.session_label,
                "bias": context.bias_direction,
                "setup": context.active_setup_summary,
                "levels": context.visible_levels,
                "structure": context.structure_summary,
            }
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(f"{self._mcp_url}/ask", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return TravisResponse(
                    kind=data.get("kind", "explanation"),
                    title=data.get("title", "Travis"),
                    summary=data.get("summary", ""),
                    confidence=float(data.get("confidence", 0.7)),
                    why_now=data.get("why_now", ""),
                    source="mcp",
                    data=data.get("data", {}),
                )
            logger.warning("MCP gateway /ask returned HTTP %s", resp.status_code)
        except Exception as exc:
            logger.warning("MCP gateway /ask failed (%s) — falling back to local", exc)

        return self._local_ask(context)

    async def _mcp_search(self, query: str, context: TravisContext) -> List[TravisResponse]:
        """Call external MCP gateway search.

        Falls back to local search on any error.
        """
        try:
            import httpx
            payload = {
                "query": query,
                "market": context.market_root,
                "session": context.session_label,
                "max_results": 5,
            }
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(f"{self._mcp_url}/search", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_results = data.get("results", [])
                if raw_results:
                    return [
                        TravisResponse(
                            kind=r.get("kind", "explanation"),
                            title=r.get("title", "Travis"),
                            summary=r.get("summary", ""),
                            confidence=float(r.get("confidence", 0.7)),
                            why_now=r.get("why_now", ""),
                            source="mcp",
                            data=r.get("data", {}),
                        )
                        for r in raw_results
                    ]
            logger.warning("MCP gateway /search returned HTTP %s", resp.status_code)
        except Exception as exc:
            logger.warning("MCP gateway /search failed (%s) — falling back to local", exc)

        return self._local_search(query, context)

    # ------------------------------------------------------------------ local analysis

    def _build_query(self, context: TravisContext) -> str:
        """Build a descriptive MCP query string from context."""
        parts = [
            f"Market: {context.market_root} ({context.resolved_symbol})",
            f"Timeframe: {context.timeframe}",
            f"Session: {context.session_label}",
            f"Bias: {context.bias_direction} (confidence {context.bias_confidence:.0%})",
            f"Structure: {context.structure_summary}",
        ]
        if context.active_setup_summary:
            parts.append(f"Active setup: {context.active_setup_summary}")
        if context.visible_levels:
            parts.append(f"Key levels: {', '.join(context.visible_levels)}")
        if context.recent_signals:
            parts.append(f"Recent signals: {', '.join(context.recent_signals)}")
        parts.append(f"Question: {context.user_query}")
        return "\n".join(parts)

    def _local_ask(self, context: TravisContext) -> TravisResponse:
        """Local analysis: derive a structured response from context."""
        q = context.user_query.lower()

        # Route to the appropriate local handler based on question intent
        if any(w in q for w in ["checklist", "checkliste", "vorbereitung", "prepare"]):
            return self._local_checklist(context.session_label, context)

        if any(w in q for w in ["setup", "signal", "einsteigen", "entry", "long", "short"]):
            return self._local_setup_review(context)

        if any(w in q for w in ["bias", "richtung", "direction", "seite"]):
            return self._local_bias_explanation(context)

        if any(w in q for w in ["level", "vwap", "poc", "zone", "support", "widerstand"]):
            return self._local_levels_explanation(context)

        if any(w in q for w in ["session", "ny open", "london", "asia", "pre-market"]):
            return self._local_session_explanation(context)

        if any(w in q for w in ["consolidation", "konsolidierung", "range", "seitwärts"]):
            return self._local_consolidation_explanation(context)

        # Default: situational overview
        return self._local_overview(context)

    def _local_overview(self, context: TravisContext) -> TravisResponse:
        bias = context.bias_direction
        conf = context.bias_confidence
        session = context.session_label
        structure = context.structure_summary
        levels = ", ".join(context.visible_levels) if context.visible_levels else "keine"

        bias_label = {
            "long": "bullisch",
            "short": "bearisch",
            "neutral": "neutral",
        }.get(bias, bias)

        # Context-specific guidance based on bias + session combination
        guidance = self._derive_situational_guidance(context)

        why_now = (
            f"Session {session}: Bias ist {bias_label} ({conf:.0%} Konfidenz). "
            f"Struktur: {structure}."
        )
        if context.recent_signals:
            why_now += f" Letzte Signale: {', '.join(context.recent_signals[:2])}."

        summary = (
            f"Aktueller Bias: {bias_label} ({conf:.0%}). "
            f"Struktur: {structure}. "
            f"Key Levels: {levels}."
        )
        if guidance:
            summary += f" {guidance}"

        return TravisResponse(
            kind="explanation",
            title=f"{context.market_root} — {session} Ueberblick",
            summary=summary,
            confidence=conf,
            why_now=why_now,
            source="local_analysis",
        )

    def _derive_situational_guidance(self, context: TravisContext) -> str:
        """Derive actionable guidance from the full context combination."""
        bias = context.bias_direction
        conf = context.bias_confidence
        session = context.session_label.lower()
        setup = context.active_setup_summary.lower()
        structure = context.structure_summary.lower()

        # Bullish bias + NY Open -> wait for pullback
        if bias == "long" and ("ny open" in session or "open" in session):
            if conf >= 0.6:
                return (
                    "NY Open: Warte auf Pullback zu VWAP oder EMA bevor du long gehst. "
                    "Kein Chasing — erst Konsolidierung, dann Break."
                )
            return "NY Open bei moderatem Long-Bias: Opening Range abwarten, dann Richtung bestaetigen."

        # Bearish bias + NY Open -> wait for dead-cat bounce
        if bias == "short" and ("ny open" in session or "open" in session):
            return (
                "NY Open Short-Bias: Rallye zu VWAP oder POC abwarten. "
                "Short nur bei Ablehnung mit Volumen, kein Blinds-Short."
            )

        # Armed setup -> explain entry conditions
        if setup and ("armed" in setup or "aktiv" in setup or "bereit" in setup):
            return (
                f"Setup '{context.active_setup_summary}' ist aktiv. "
                "Warte auf Trigger-Kerze mit Volumenbestaetigung vor dem Einstieg."
            )

        # Consolidation detected in structure
        if "consolidat" in structure or "range" in structure or "sideways" in structure:
            return (
                "Konsolidierungsphase: Handele die Kanten (VAH/VAL oder Range-Highs/-Lows). "
                "Ausbruch mit Volumen bestaetigen, Fakeouts in Low-Volume beachten."
            )

        # Neutral bias -> range edges
        if bias == "neutral":
            return (
                "Neutraler Markt: VAH und VAL sind die primaeren Handelslevels. "
                "Auf Ausbruch mit Volumen warten oder an den Kanten reversal traden."
            )

        return ""

    def _local_setup_review(self, context: TravisContext) -> TravisResponse:
        bias = context.bias_direction
        conf = context.bias_confidence
        setup = context.active_setup_summary
        session = context.session_label.lower()

        if not setup or setup.strip() == "":
            # Bias-specific no-setup guidance
            if bias == "long":
                wait_msg = "Warte auf Pullback zu VWAP/EMA — dort sind saubere Long-Einstiege."
            elif bias == "short":
                wait_msg = "Warte auf Rallye zu VWAP/POC — dort sind saubere Short-Einstiege."
            else:
                wait_msg = "Warte auf einen Ausbruch der Value Area mit Volumen."

            return TravisResponse(
                kind="review",
                title="Kein aktives Setup",
                summary=(
                    f"Derzeit ist kein konkretes Setup aktiv. "
                    f"Bias ist {bias} — {wait_msg}"
                ),
                confidence=0.3,
                why_now=f"Bias {bias} aktiv, aber kein Setup in Sicht.",
                source="local_analysis",
            )

        quality = "stark" if conf >= 0.7 else "moderat" if conf >= 0.4 else "schwach"
        action = "Bereit machen" if conf >= 0.4 else "Noch warten"

        # Session-specific entry advice
        if "ny open" in session or "open" in session:
            entry_note = "Warte Opening Range (erste 5-15 min) — dann Setup bestaetigen."
        elif "london" in session:
            entry_note = "London-Fakeout beachten: erster Break oft Stop-Hunt."
        elif "pre" in session:
            entry_note = "Pre-Market: kein Einstieg — Setup fuer RTH-Eroeffnung vorbereiten."
        else:
            entry_note = "Bestaetigung an Key Level abwarten."

        return TravisResponse(
            kind="review",
            title=f"Setup Review: {setup}",
            summary=(
                f"Das Setup '{setup}' hat {quality}e Konfluenz ({conf:.0%}). "
                f"Empfehlung: {action}. "
                f"{entry_note}"
            ),
            confidence=conf,
            why_now=(
                f"Session {context.session_label}: Setup '{setup}' sichtbar. "
                f"Bias {bias} unterstuetzt die Richtung."
            ),
            source="local_analysis",
            data={"setup": setup, "action": action, "quality": quality},
        )

    def _local_bias_explanation(self, context: TravisContext) -> TravisResponse:
        bias = context.bias_direction
        conf = context.bias_confidence
        session = context.session_label.lower()

        if bias == "long":
            detail = (
                "Long Bias bedeutet: Pullbacks zu VWAP oder Value Area Low sind Einstiegsmoeglichkeiten. "
                "Shorts gegen den Bias vermeiden, ausser bei klarem Struktur-Bruch. "
            )
            # NY Open specific
            if "ny open" in session or "open" in session:
                detail += (
                    "NY Open Long-Bias: Opening Range Break nach oben bestaetigt den Bias. "
                    "Erster Pullback nach ORB ist oft der beste Einstieg."
                )
            elif "london" in session:
                detail += "London Long-Bias: Asien-Low-Sweep oft der Startschuss fuer London-Rally."
        elif bias == "short":
            detail = (
                "Short Bias bedeutet: Rallyes zu VWAP oder Value Area High sind Leerverkaufs-Chancen. "
                "Longs gegen den Bias vermeiden. "
            )
            if "ny open" in session or "open" in session:
                detail += (
                    "NY Open Short-Bias: Gap-Fill oder VWAP-Test nach oben — dann Short. "
                    "Kein Blinds-Short ohne Ablehnung."
                )
        else:
            detail = (
                "Neutraler Bias: Markt ist in Balance. "
                "Handele die Kanten der Value Area (VAH/VAL) oder warte auf einen Ausbruch mit Volumen. "
                "In neutralen Maerkten sind Fakeouts haeufig — Volumen als Filter einsetzen."
            )

        return TravisResponse(
            kind="explanation",
            title=f"Bias: {bias.upper()} ({conf:.0%})",
            summary=detail,
            confidence=conf,
            why_now=(
                f"Bias wird durch Struktur '{context.structure_summary}' "
                f"und aktuelle Session {context.session_label} bestaetigt."
            ),
            source="local_analysis",
        )

    def _local_levels_explanation(self, context: TravisContext) -> TravisResponse:
        levels = context.visible_levels

        if not levels:
            summary = "Keine spezifischen Level im aktuellen Chart-Kontext sichtbar."
        else:
            level_explanations = []
            for lvl in levels:
                lvl_l = lvl.lower()
                if "vwap" in lvl_l:
                    level_explanations.append(f"{lvl}: primaeres intraday Reversal-Level, Magneteffekt")
                elif "poc" in lvl_l:
                    level_explanations.append(f"{lvl}: Point of Control — hoechstes Volumen, starker Magnet")
                elif "vah" in lvl_l:
                    level_explanations.append(f"{lvl}: Value Area High — Widerstand, Short-Niveau bei Short-Bias")
                elif "val" in lvl_l:
                    level_explanations.append(f"{lvl}: Value Area Low — Support, Long-Niveau bei Long-Bias")
                else:
                    level_explanations.append(lvl)

            summary = (
                "Aktuell relevante Level:\n"
                + "\n".join(f"  {e}" for e in level_explanations)
                + "\n\nHandele Reaktionen an diesen Leveln — Einstieg nur mit Volumenbestaetigung."
            )

        return TravisResponse(
            kind="explanation",
            title="Key Levels",
            summary=summary,
            confidence=0.85,
            why_now=f"Session {context.session_label}: Diese Level sind die wahrscheinlichsten Reaktionspunkte.",
            source="local_analysis",
            data={"levels": levels},
        )

    def _local_session_explanation(self, context: TravisContext) -> TravisResponse:
        session = context.session_label
        s = session.lower()
        bias = context.bias_direction

        if "ny open" in s or "ny_open" in s:
            summary = (
                "NY Open (09:30 ET): Hoechstes Volumen und Volatilitaet des Tages. "
                "Opening Range Break (ORB) und Initial Balance Extension sind die primaeren Setups. "
                "Erste 15 Minuten bestimmen oft die Tagesrichtung. "
            )
            if bias == "long":
                summary += "Long-Bias aktiv: erster Pullback nach ORB ist oft der beste Long-Einstieg."
            elif bias == "short":
                summary += "Short-Bias aktiv: Gap-Fill oder VWAP-Test vor dem Short nutzen."
            else:
                summary += "Neutraler Bias: Opening Range abwarten, dann Richtung folgen."
        elif "london" in s:
            summary = (
                "London Session (03:00-12:00 ET): Globale Liquiditaet, starke Trendphasen. "
                "London Open Fakeout beachten: Stop-Hunt ueber Asien-Range oft Startschuss. "
                "Nach Fakeout-Reversal laeuft der Trade oft mehrere Stunden."
            )
        elif "asia" in s:
            summary = (
                "Asien-Session (18:00-03:00 ET): Geringeres Volumen, oft Konsolidierung. "
                "Asien-Extremwerte (Highs/Lows) werden in NY haeufig getestet. "
                "Kein aktives Trading empfohlen — Levels fuer London/NY vorbereiten."
            )
        elif "pre" in s:
            summary = (
                "Pre-Market: Niedrige Liquiditaet, weite Spreads, viele Fakeouts. "
                "Warte auf RTH-Eroeffnung (09:30 ET) fuer sauberere Setups. "
                "Pre-Market Highs/Lows als potenzielle Magneten fuer NY Open markieren."
            )
        elif "power" in s:
            summary = (
                "Power Hour (15:00-16:00 ET): Zweite hohe Volumenphase des Tages. "
                "MOC-Orders (Market-on-Close) bewegen den Markt stark. "
                "Richtung oft Bias-bestaedigend — Trend-Continuation-Setups bevorzugen."
            )
        else:
            summary = (
                f"Session '{session}': Handelsqualitaet haengt vom Volumen und der Volatilitaet ab. "
                "Beachte aktuelle Bias-Richtung fuer die Session. "
                "Key Levels (VWAP, POC, VAH/VAL) als primaere Reaktionspunkte nutzen."
            )

        return TravisResponse(
            kind="explanation",
            title=f"Session: {session}",
            summary=summary,
            confidence=0.8,
            why_now=f"Bias {context.bias_direction} aktiv. Struktur: {context.structure_summary}.",
            source="local_analysis",
        )

    def _local_consolidation_explanation(self, context: TravisContext) -> TravisResponse:
        """Specific explanation for consolidation/range situations."""
        levels = context.visible_levels
        bias = context.bias_direction
        session = context.session_label

        vah = next((l for l in levels if "VAH" in l), None)
        val = next((l for l in levels if "VAL" in l), None)
        poc = next((l for l in levels if "POC" in l), None)

        summary = (
            "Konsolidierung: Der Markt handelt in einer definierten Range. "
        )
        if vah and val:
            summary += f"Value Area: {val} (unten) bis {vah} (oben). "
        if poc:
            summary += f"POC {poc} ist der Schwerpunkt — Preis kehrt haeufig dorthin zurueck. "

        summary += (
            "\n\nKonsolidierungs-Strategien:\n"
            "  1. Range-Reversal: An VAH shorten, an VAL longen — mit engem Stop\n"
            "  2. Ausbruchs-Trade: Warte auf Close ausserhalb der Range + Volumen\n"
            "  3. Fakeout-Filter: Ausbrueche ohne Volumen oft Trap — Gegenreaktion abwarten\n"
        )

        if bias != "neutral":
            summary += (
                f"\nAktueller Bias {bias}: "
                f"Ausbruch in Bias-Richtung hat hoehere Wahrscheinlichkeit als Gegenrichtung."
            )

        return TravisResponse(
            kind="explanation",
            title=f"Konsolidierung — {session}",
            summary=summary,
            confidence=0.8,
            why_now=f"Struktur zeigt Konsolidierung in {session}. Bias: {bias}.",
            source="local_analysis",
            data={"levels": levels},
        )

    def _local_checklist(self, session: str, context: TravisContext) -> TravisResponse:
        s = session.lower()
        bias = context.bias_direction
        conf = context.bias_confidence
        setup = context.active_setup_summary

        if "ny open" in s or "ny_open" in s or "open" in s:
            items = [
                "1. Vorboersen-Niveau checken (Futures vs. RTH Gap)",
                "2. Gestern PDH/PDL/PDC markieren",
                "3. VWAP und POC des gestrigen Tages beachten",
                "4. Opening Range (erste 5/15 min) abwarten — nicht in die Eroeffnung rein",
                "5. Bias durch Eröffnungsverhalten bestaetigen oder verwerfen",
                "6. Erst nach ORB-Bestaetigung traden — kein Pre-Market-Bias blindlings fortsetzen",
                "7. Ersten Pullback nach ORB identifizieren — oft bester Einstieg",
                "8. Stop unter/ueber Opening Range setzen",
            ]
            if bias == "long" and conf >= 0.5:
                items.append(f"9. [BIAS-CHECK] Long-Bias ({conf:.0%}) aktiv — Long-Setups priorisieren")
            elif bias == "short" and conf >= 0.5:
                items.append(f"9. [BIAS-CHECK] Short-Bias ({conf:.0%}) aktiv — Short-Setups priorisieren")
            if setup:
                items.append(f"10. [SETUP] Aktiv: '{setup}' — Trigger-Kerze abwarten")
            title = "NY Open Checklist"

        elif "london" in s:
            items = [
                "1. Asien-Range markieren (High/Low)",
                "2. London Open Fakeout-Muster beachten (Stop-Hunt ueber Asien-Range)",
                "3. Richtung nach London-Break bestimmen — Reversal vs. Continuation",
                "4. VWAP als Einstiegsfilter nutzen — nur mit VWAP-Untersteung einsteigen",
                "5. Erste Reaktion an Key Level fuer Setup-Bestaetigung abwarten",
                "6. Position-Size: London ist volatil — kleinere Groesse als NY",
            ]
            if bias != "neutral":
                items.append(f"7. [BIAS-CHECK] {bias.upper()}-Bias ({conf:.0%}) — passt London-Break dazu?")
            title = "London Open Checklist"

        elif "pre" in s:
            items = [
                "1. Kein aktives Trading — nur Beobachten und Vorbereiten",
                "2. Overnights und Gaps notieren",
                "3. Pre-Market Highs/Lows als potenzielle Magneten fuer NY Open markieren",
                "4. Makro-Events pruefen (8:30 ET Daten, Fed-Sprecher, Earnings)",
                "5. Bias-Hypothese formulieren — erst bei RTH-Bestaetigung handeln",
                "6. Risk-Parameter festlegen: max. Kontrakte, max. Daily Loss fuer heute",
                "7. Chart auf relevante Zeitrahmen einstellen (1min + 5min + 15min)",
            ]
            title = "Pre-Market Checklist"

        elif "power" in s:
            items = [
                "1. Tagesbilanz pruefen — bereits profitabel? Position-Size reduzieren",
                "2. MOC-Richtung einschaetzen (Markt-Stimmung der letzten Stunde)",
                "3. VWAP als Bias-Filter: Preis ueber VWAP = bullisch, darunter = bearisch",
                "4. Power Hour Setups: Trend-Continuation oder False-Breakout",
                "5. Kein neues Risiko in letzten 15 Minuten vor Close",
            ]
            title = "Power Hour Checklist"

        elif "asia" in s:
            items = [
                "1. Asien-Range verfolgen (High/Low markieren)",
                "2. Kein aktives Trading bei niedrigem Volumen",
                "3. Key Levels fuer London-Session vorbereiten",
                "4. Overnight-Gap-Potenzial einschaetzen",
            ]
            title = "Asien-Session Checklist"

        else:
            items = [
                "1. Aktuellen Bias und Konfidenz pruefen",
                "2. Key Levels (VWAP, POC, VAH/VAL) aktualisieren",
                "3. Struktur (HH/HL vs LH/LL) bestaetigen",
                "4. Aktive Setups bewerten (Konfluenz >= 3 Faktoren)",
                "5. Risk-Management pruefen (max. Kontrakte, Stop-Level)",
                "6. Bias-Flip-Level definieren (ab wann Richtungswechsel moeglich)",
            ]
            title = "Allgemeine Trading Checklist"

        return TravisResponse(
            kind="checklist",
            title=title,
            summary="\n".join(items),
            confidence=0.9,
            why_now=(
                f"Session: {session}. "
                f"Bias {context.bias_direction} ({context.bias_confidence:.0%}). "
                f"Struktur: {context.structure_summary}."
            ),
            source="local_analysis",
            data={"items": items, "session": session},
        )

    def _local_search(self, query: str, context: TravisContext) -> List[TravisResponse]:
        """Local search: map query terms to relevant explanations."""
        q = query.lower()
        results: List[TravisResponse] = []

        # Topic -> handler mapping
        topic_handlers = [
            (["bias", "richtung"], lambda: self._local_bias_explanation(context)),
            (["vwap", "poc", "level", "zone"], lambda: self._local_levels_explanation(context)),
            (["setup", "signal", "entry", "einsteig"], lambda: self._local_setup_review(context)),
            (["session", "ny open", "london", "pre-market"], lambda: self._local_session_explanation(context)),
            (["checklist", "vorbereitung"], lambda: self._local_checklist(context.session_label, context)),
            (["consolidation", "konsolidierung", "range", "sideways"], lambda: self._local_consolidation_explanation(context)),
        ]

        for keywords, handler in topic_handlers:
            if any(kw in q for kw in keywords):
                r = handler()
                results.append(r)
                if len(results) >= 3:
                    break

        # Always include overview as last result if nothing matched
        if not results:
            results.append(self._local_overview(context))

        return results


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------


_client: Optional[TravisMCPClient] = None


def get_travis_client() -> TravisMCPClient:
    """Return the shared TravisMCPClient singleton.

    The singleton is initialized by init_travis_client() on application startup.
    If called before initialization, returns a client without MCP gateway (local fallback only).
    """
    global _client
    if _client is None:
        _client = TravisMCPClient()
    return _client


def init_travis_client(mcp_gateway_url: Optional[str] = None) -> TravisMCPClient:
    """Initialize (or re-initialize) the singleton with a given MCP gateway URL.

    Called from main.py on startup with TRAVIS_MCP_GATEWAY env var.
    """
    global _client
    _client = TravisMCPClient(mcp_gateway_url=mcp_gateway_url)
    if mcp_gateway_url:
        logger.info("TravisMCPClient initialized with MCP gateway: %s", mcp_gateway_url)
    else:
        logger.info("TravisMCPClient initialized with local analysis (no MCP gateway configured)")
    return _client

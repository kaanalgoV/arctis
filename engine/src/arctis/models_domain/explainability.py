"""Explainability tokens for Travis MCP queries and UI context panels.

``ExplainToken`` is a semantic context atom that captures one piece of
market context in a machine-readable (category/key/value) and human-readable
(human_text) form.  A list of ExplainTokens forms a context snapshot that:

  1. Powers the Travis MCP /ask endpoint — providing structured context
     instead of raw OHLCV data.
  2. Drives the Arctis UI "Why this trade?" panel.
  3. Enables the playbook engine to filter rules by semantic state.

Usage
-----
::

    from arctis.models_domain.explainability import build_explain_context

    tokens = build_explain_context(
        bars=bars,
        indicators={"vwap": 21340.5, "ema9": 21332.0, "ema21": 21320.0},
        setups=active_setups,
        session="ny_open",
        bias=bias_object,          # optional BiasObject
        consolidations=cons_list,  # optional list[Consolidation]
    )
    for t in tokens:
        print(t.human_text)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class ExplainToken:
    """Semantic context token for Travis MCP queries and UI display.

    Attributes
    ----------
    category:
        Broad grouping of the token.  One of:
          "bias"      — market direction / bias context
          "structure" — swing structure, trend, consolidation state
          "setup"     — active setup or signal context
          "session"   — time-of-day / session context
          "risk"      — R:R, stop, position-sizing context
          "indicator" — raw indicator values (VWAP, EMA, ATR, etc.)
    key:
        Machine-readable token identifier within its category.
        Examples: "bias_direction", "active_setup_type", "session_name",
        "vwap_value", "atr_14", "consolidation_status".
    value:
        Current value as a string.
        Examples: "bullish", "orb_breakout", "ny_open", "21340.50", "active".
    human_text:
        Plain-English sentence describing this token for human or LLM
        consumption.
        Example: "Bias is bullish based on price above VWAP and EMA alignment."
    confidence:
        Float in [0, 1] indicating how certain this token's value is.
        1.0 for deterministic values (session name, current price).
        Lower for derived/estimated values (trend classification).
    """

    category: str       # "bias", "structure", "setup", "session", "risk", "indicator"
    key: str            # e.g. "bias_direction", "active_setup_type"
    value: str          # e.g. "bullish", "orb_breakout"
    human_text: str     # e.g. "Bias is bullish based on price above VWAP"
    confidence: float   # 0.0 - 1.0

    def __repr__(self) -> str:
        return (
            f"ExplainToken(category={self.category!r}, key={self.key!r}, "
            f"value={self.value!r}, confidence={self.confidence:.2f})"
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to a plain dict (for JSON API responses)."""
        return {
            "category": self.category,
            "key": self.key,
            "value": self.value,
            "human_text": self.human_text,
            "confidence": round(self.confidence, 3),
        }


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def build_explain_context(
    bars: list,
    indicators: Optional[Dict[str, Any]] = None,
    setups: Optional[list] = None,
    session: str = "unknown",
    bias: Optional[Any] = None,
    consolidations: Optional[list] = None,
) -> List[ExplainToken]:
    """Build a list of ExplainTokens representing the current market context.

    This function is intentionally defensive: if any individual section
    fails to extract context it is skipped silently so the rest of the
    tokens are still returned.

    Args:
        bars:
            List of OHLCVBar objects.  Must be non-empty.
        indicators:
            Dict of indicator values keyed by name.
            Recognised keys: "vwap", "ema9", "ema21", "ema50", "atr".
            Unknown keys are included as generic indicator tokens.
        setups:
            List of Setup objects from ``arctis.analysis.setup_engine``.
            Active setups (status != terminal) are surfaced as tokens.
        session:
            Current session name string, e.g. "ny_open".
        bias:
            Optional BiasObject from ``arctis.models_domain.bias``.
            If None, basic price-based bias tokens are still generated.
        consolidations:
            Optional list of Consolidation objects from
            ``arctis.analysis.structure``.

    Returns:
        List of ExplainToken objects ordered by category priority:
        session -> bias -> structure -> indicator -> setup -> risk.
    """
    tokens: List[ExplainToken] = []
    indicators = indicators or {}
    setups = setups or []
    consolidations = consolidations or []

    # 1. Session tokens
    tokens.extend(_build_session_tokens(session, bars))

    # 2. Bias tokens
    tokens.extend(_build_bias_tokens(bias, bars, indicators))

    # 3. Structure tokens
    tokens.extend(_build_structure_tokens(bars, consolidations))

    # 4. Indicator tokens
    tokens.extend(_build_indicator_tokens(indicators, bars))

    # 5. Setup tokens
    tokens.extend(_build_setup_tokens(setups))

    # 6. Risk tokens
    tokens.extend(_build_risk_tokens(setups, indicators, bars))

    return tokens


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _build_session_tokens(session: str, bars: list) -> List[ExplainToken]:
    tokens: List[ExplainToken] = []

    session_labels = {
        "premarket": "Pre-market session (04:00-09:30 ET) — reduced liquidity",
        "ny_open": "NY Open session (09:30-10:30 ET) — highest volatility window",
        "midday": "Midday session (10:30-14:00 ET) — moderate volume, trend continuation",
        "power_hour": "Power Hour (14:00-16:00 ET) — institutional activity, fade setups",
        "after_hours": "After-hours session (16:00-20:00 ET) — low liquidity",
        "closed": "Market closed",
        "unknown": "Session undetermined",
    }

    label = session_labels.get(session, f"Session: {session}")
    tokens.append(ExplainToken(
        category="session",
        key="session_name",
        value=session,
        human_text=label,
        confidence=1.0,
    ))

    if bars:
        bar_count = len(bars)
        tokens.append(ExplainToken(
            category="session",
            key="bar_count",
            value=str(bar_count),
            human_text=f"Current analysis window contains {bar_count} bars.",
            confidence=1.0,
        ))

        last = bars[-1]
        tokens.append(ExplainToken(
            category="session",
            key="current_price",
            value=f"{last.close:.2f}",
            human_text=f"Current price is {last.close:.2f} (last bar close).",
            confidence=1.0,
        ))

    return tokens


def _build_bias_tokens(bias: Optional[Any], bars: list, indicators: dict) -> List[ExplainToken]:
    tokens: List[ExplainToken] = []

    if bias is not None:
        # Rich BiasObject available
        direction = getattr(bias, "direction", "neutral")
        confidence = getattr(bias, "confidence", 0.5)
        sources = getattr(bias, "sources", [])
        raw_state = getattr(bias, "raw_state", "RANGE")
        raw_score = getattr(bias, "raw_score", 0)

        source_text = ", ".join(sources) if sources else "multiple indicators"
        tokens.append(ExplainToken(
            category="bias",
            key="bias_direction",
            value=direction,
            human_text=(
                f"Bias is {direction} (state: {raw_state}, score: {raw_score:+d}) "
                f"based on {source_text}."
            ),
            confidence=confidence,
        ))

        tokens.append(ExplainToken(
            category="bias",
            key="bias_confidence",
            value=f"{confidence:.2f}",
            human_text=(
                f"Bias confidence is {confidence:.0%}. "
                + ("High-conviction — prefer aligned setups." if confidence >= 0.6
                   else "Moderate conviction — validate with additional confluence.")
            ),
            confidence=confidence,
        ))

        invalid = getattr(bias, "invalidation_conditions", [])
        if invalid:
            tokens.append(ExplainToken(
                category="bias",
                key="bias_invalidation",
                value="; ".join(invalid[:2]),  # first two for brevity
                human_text=f"Bias invalidation: {invalid[0]}",
                confidence=0.9,
            ))

    else:
        # Fallback: derive direction from VWAP if available
        vwap = indicators.get("vwap")
        if vwap and bars:
            price = bars[-1].close
            if price > vwap:
                tokens.append(ExplainToken(
                    category="bias",
                    key="bias_direction",
                    value="bullish",
                    human_text=(
                        f"Price ({price:.2f}) is above VWAP ({vwap:.2f}) — "
                        "tentative bullish bias."
                    ),
                    confidence=0.5,
                ))
            elif price < vwap:
                tokens.append(ExplainToken(
                    category="bias",
                    key="bias_direction",
                    value="bearish",
                    human_text=(
                        f"Price ({price:.2f}) is below VWAP ({vwap:.2f}) — "
                        "tentative bearish bias."
                    ),
                    confidence=0.5,
                ))
            else:
                tokens.append(ExplainToken(
                    category="bias",
                    key="bias_direction",
                    value="neutral",
                    human_text="Price is at VWAP — neutral bias.",
                    confidence=0.4,
                ))

    return tokens


def _build_structure_tokens(bars: list, consolidations: list) -> List[ExplainToken]:
    tokens: List[ExplainToken] = []

    if not bars:
        return tokens

    # Recent price action summary
    if len(bars) >= 3:
        recent = bars[-3:]
        closes = [b.close for b in recent]
        if closes[-1] > closes[-2] > closes[-3]:
            tokens.append(ExplainToken(
                category="structure",
                key="recent_momentum",
                value="bullish_momentum",
                human_text=(
                    "Last 3 bars show sequential higher closes — short-term "
                    "bullish momentum present."
                ),
                confidence=0.75,
            ))
        elif closes[-1] < closes[-2] < closes[-3]:
            tokens.append(ExplainToken(
                category="structure",
                key="recent_momentum",
                value="bearish_momentum",
                human_text=(
                    "Last 3 bars show sequential lower closes — short-term "
                    "bearish momentum present."
                ),
                confidence=0.75,
            ))
        else:
            tokens.append(ExplainToken(
                category="structure",
                key="recent_momentum",
                value="choppy",
                human_text="Last 3 bars show no clear directional momentum — choppy price action.",
                confidence=0.6,
            ))

    # Consolidation tokens
    if consolidations:
        active = [c for c in consolidations if getattr(c, "is_active", False)]
        recent_broken = [
            c for c in consolidations
            if getattr(c, "is_broken", False)
        ]

        if active:
            con = active[-1]
            range_size = getattr(con, "range_size", 0)
            bar_count = getattr(con, "bar_count", 0)
            vol_char = getattr(con, "volume_character", "steady")
            context = getattr(con, "context_trend", "range")
            tokens.append(ExplainToken(
                category="structure",
                key="consolidation_status",
                value="active",
                human_text=(
                    f"Active consolidation: {bar_count} bars, range {range_size:.2f} pts, "
                    f"volume {vol_char}, context: {context}. "
                    "Watch for breakout expansion."
                ),
                confidence=0.85,
            ))

        if recent_broken:
            con = recent_broken[-1]
            status = getattr(con, "status", "broken_up")
            bp = getattr(con, "breakout_price", None)
            bp_text = f" at {bp:.2f}" if bp else ""
            tokens.append(ExplainToken(
                category="structure",
                key="consolidation_status",
                value=status,
                human_text=(
                    f"Recent consolidation {status.replace('_', ' ')}{bp_text}. "
                    "Breakout bars may provide momentum entry opportunity."
                ),
                confidence=0.8,
            ))

    return tokens


def _build_indicator_tokens(indicators: dict, bars: list) -> List[ExplainToken]:
    tokens: List[ExplainToken] = []

    if not bars:
        return tokens

    price = bars[-1].close

    # VWAP
    vwap = indicators.get("vwap")
    if vwap:
        dist = abs(price - vwap)
        direction_text = "above" if price > vwap else "below" if price < vwap else "at"
        tokens.append(ExplainToken(
            category="indicator",
            key="vwap_value",
            value=f"{vwap:.2f}",
            human_text=(
                f"VWAP is {vwap:.2f}. Price is {direction_text} VWAP "
                f"by {dist:.2f} pts."
            ),
            confidence=1.0,
        ))

    # EMA alignment
    ema9 = indicators.get("ema9")
    ema21 = indicators.get("ema21")
    if ema9 and ema21:
        if ema9 > ema21:
            align_text = "bullish (EMA9 > EMA21)"
            align_val = "bullish"
        else:
            align_text = "bearish (EMA9 < EMA21)"
            align_val = "bearish"
        tokens.append(ExplainToken(
            category="indicator",
            key="ema_alignment",
            value=align_val,
            human_text=f"EMA alignment is {align_text}.",
            confidence=0.9,
        ))

    # ATR
    atr = indicators.get("atr")
    if atr:
        tokens.append(ExplainToken(
            category="indicator",
            key="atr_value",
            value=f"{atr:.2f}",
            human_text=(
                f"ATR is {atr:.2f} pts. "
                + ("Low volatility session." if atr < 5
                   else "Normal volatility." if atr < 15
                   else "High volatility — widen stops accordingly.")
            ),
            confidence=1.0,
        ))

    # Generic pass-through for unknown indicator keys
    known_keys = {"vwap", "ema9", "ema21", "ema50", "atr"}
    for key, val in indicators.items():
        if key not in known_keys and isinstance(val, (int, float)):
            tokens.append(ExplainToken(
                category="indicator",
                key=key,
                value=f"{val:.4g}",
                human_text=f"{key} = {val:.4g}.",
                confidence=1.0,
            ))

    return tokens


def _build_setup_tokens(setups: list) -> List[ExplainToken]:
    tokens: List[ExplainToken] = []

    if not setups:
        tokens.append(ExplainToken(
            category="setup",
            key="active_setup_count",
            value="0",
            human_text="No active setups detected in the current context.",
            confidence=1.0,
        ))
        return tokens

    # Terminal statuses to exclude
    _terminal = {"stopped", "completed", "invalidated", "expired"}

    active = [
        s for s in setups
        if str(getattr(s, "status", "")).lower() not in _terminal
    ]

    tokens.append(ExplainToken(
        category="setup",
        key="active_setup_count",
        value=str(len(active)),
        human_text=f"{len(active)} active setup(s) detected.",
        confidence=1.0,
    ))

    for setup in active[:3]:  # surface up to 3 setups
        setup_type = getattr(setup, "setup_type", "unknown")
        direction = getattr(setup, "direction", "unknown")
        status = getattr(setup, "status", "candidate")
        conf = getattr(setup, "confidence", "medium")
        thesis = getattr(setup, "thesis", "")
        entry = getattr(setup, "entry_trigger_price", 0.0)
        rr = getattr(setup, "risk_reward", 0.0)

        tokens.append(ExplainToken(
            category="setup",
            key="active_setup_type",
            value=setup_type,
            human_text=(
                f"{setup_type.replace('_', ' ').title()} {direction} setup "
                f"({conf} confidence, status: {status}). "
                f"Entry: {entry:.2f}, R:R: {rr:.2f}. "
                + (f"Thesis: {thesis}" if thesis else "")
            ),
            confidence=0.9 if conf == "high" else 0.7,
        ))

    return tokens


def _build_risk_tokens(setups: list, indicators: dict, bars: list) -> List[ExplainToken]:
    tokens: List[ExplainToken] = []

    if not setups or not bars:
        return tokens

    _terminal = {"stopped", "completed", "invalidated", "expired"}
    active = [
        s for s in setups
        if str(getattr(s, "status", "")).lower() not in _terminal
    ]

    if not active:
        return tokens

    # Best R:R among active setups
    best = max(active, key=lambda s: getattr(s, "risk_reward", 0.0))
    best_rr = getattr(best, "risk_reward", 0.0)

    if best_rr > 0:
        quality = (
            "excellent" if best_rr >= 3.0
            else "good" if best_rr >= 2.0
            else "acceptable" if best_rr >= 1.35
            else "below threshold"
        )
        tokens.append(ExplainToken(
            category="risk",
            key="best_risk_reward",
            value=f"{best_rr:.2f}",
            human_text=(
                f"Best available R:R is {best_rr:.2f} ({quality}). "
                f"Setup: {getattr(best, 'setup_type', 'unknown')}."
            ),
            confidence=0.95,
        ))

    # ATR-based stop context
    atr = indicators.get("atr")
    if atr:
        max_stop_pts = 25.0  # NQ: 100 ticks
        tokens.append(ExplainToken(
            category="risk",
            key="atr_stop_context",
            value=f"1.5x_atr={1.5 * atr:.2f}",
            human_text=(
                f"1.5 ATR stop = {1.5 * atr:.2f} pts "
                f"({'within' if 1.5 * atr <= max_stop_pts else 'exceeds'} "
                f"NQ max stop of {max_stop_pts:.0f} pts)."
            ),
            confidence=0.9,
        ))

    return tokens

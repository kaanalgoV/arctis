"""Bias as a rich domain object.

``BiasObject`` extends the low-level ``BiasResult`` (from
``arctis.analysis.bias_state``) by adding semantic context needed by the
playbook engine and the explainability layer:

  - Human-readable direction: "bullish", "bearish", or "neutral"
  - Confidence float 0-1 (derived from the bias score magnitude)
  - Sources list (which indicators contributed to the bias)
  - Invalidation conditions (what would flip the bias)
  - Preferred setup types (which playbook rules are most relevant)

Usage
-----
Build from an existing BiasResult::

    from arctis.analysis.bias_state import calculate_bias_state
    from arctis.models_domain.bias import BiasObject, bias_object_from_result

    result = calculate_bias_state(bars, trend="up", vwap_position="above")
    obj = bias_object_from_result(result, session="ny_open", timeframe="1min")
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class BiasObject:
    """Rich domain model for market bias.

    Attributes
    ----------
    direction:
        Simplified direction: "bullish", "bearish", or "neutral".
        Derived from BiasState:
          LONG / RANGE_LONG  -> "bullish"
          SHORT / RANGE_SHORT -> "bearish"
          RANGE               -> "neutral"
    confidence:
        Float in [0, 1]. Derived from the abs(bias score) / 10.
        Score 0  -> 0.0 (no conviction)
        Score 5  -> 0.5 (moderate conviction)
        Score 10 -> 1.0 (maximum conviction)
    sources:
        List of indicator names or descriptions that contributed to the
        current bias direction.  Populated by the caller or by
        ``bias_object_from_result``.
        Examples: ["price_above_vwap", "ema_alignment_bullish", "hh_hl_trend"]
    session:
        Session name at the time of calculation, e.g. "ny_open".
    timeframe:
        Timeframe of the bars used to calculate bias, e.g. "1min".
    invalidation_conditions:
        Plain-English list of conditions that would negate this bias.
        Example: ["Close below VWAP", "EMA stack crosses bearish"]
    preferred_setup_types:
        List of playbook rule IDs that are most consistent with this bias.
        The setup engine uses this to prioritise rule matching.
    created_at:
        Unix timestamp (float) when the object was created.  Useful for
        detecting stale bias objects in streaming contexts.
    raw_score:
        The underlying integer bias score from BiasResult (-10 to +10).
        Preserved for downstream scoring logic.
    raw_state:
        The underlying BiasState string, e.g. "RANGE_LONG".
    """

    direction: str          # "bullish", "bearish", "neutral"
    confidence: float       # 0.0 - 1.0
    sources: List[str]      # indicator contributions
    session: str
    timeframe: str
    invalidation_conditions: List[str]
    preferred_setup_types: List[str]
    created_at: float = field(default_factory=time.time)
    raw_score: int = 0
    raw_state: str = "RANGE"

    # ---------------------------------------------------------------------------
    # Convenience properties
    # ---------------------------------------------------------------------------

    @property
    def is_bullish(self) -> bool:
        return self.direction == "bullish"

    @property
    def is_bearish(self) -> bool:
        return self.direction == "bearish"

    @property
    def is_neutral(self) -> bool:
        return self.direction == "neutral"

    @property
    def is_high_confidence(self) -> bool:
        """True if confidence >= 0.6 (score >= 6)."""
        return self.confidence >= 0.6

    def aligns_with(self, trade_direction: str) -> bool:
        """Return True if the bias direction is compatible with the trade direction.

        "neutral" is compatible with both long and short trades.

        Args:
            trade_direction: "long" or "short".
        """
        if self.is_neutral:
            return True
        if trade_direction == "long":
            return self.is_bullish
        if trade_direction == "short":
            return self.is_bearish
        return False

    def __repr__(self) -> str:
        return (
            f"BiasObject(direction={self.direction!r}, "
            f"confidence={self.confidence:.2f}, "
            f"session={self.session!r}, "
            f"raw_state={self.raw_state!r})"
        )


# ---------------------------------------------------------------------------
# Factory: build BiasObject from existing BiasResult
# ---------------------------------------------------------------------------

def bias_object_from_result(
    result,
    session: str = "unknown",
    timeframe: str = "1min",
) -> BiasObject:
    """Build a BiasObject from a ``BiasResult`` (analysis.bias_state module).

    This factory translates the low-level BiasResult into the richer domain
    object without modifying the existing bias_state.py module.

    Args:
        result:    A ``BiasResult`` instance (or any object with ``.state``
                   and ``.score`` attributes, and optional ``.components`` dict).
        session:   Current session name string, e.g. "ny_open".
        timeframe: Bar timeframe string, e.g. "1min".

    Returns:
        A populated BiasObject with direction, confidence, sources, and
        sensible default invalidation conditions.
    """
    # Extract state/score, support both dataclass and dict representations
    if hasattr(result, "state"):
        raw_state = str(result.state.value if hasattr(result.state, "value") else result.state)
        raw_score = getattr(result, "score", 0)
        components: dict = getattr(result, "components", {})
    elif isinstance(result, dict):
        raw_state = str(result.get("state", "RANGE"))
        raw_score = int(result.get("score", 0))
        components = result.get("components", {})
    else:
        raw_state = "RANGE"
        raw_score = 0
        components = {}

    # Map BiasState -> simplified direction
    state_upper = raw_state.upper()
    if state_upper in ("LONG", "RANGE_LONG"):
        direction = "bullish"
    elif state_upper in ("SHORT", "RANGE_SHORT"):
        direction = "bearish"
    else:
        direction = "neutral"

    # Confidence: abs(score) / 10, clamped to [0, 1]
    confidence = min(1.0, abs(raw_score) / 10.0)

    # Build sources from components dict (if available)
    sources: List[str] = []
    _component_labels = {
        "trend": ("trend_bullish", "trend_bearish"),
        "velocity": ("velocity_up", "velocity_down"),
        "auction": ("auction_bullish", "auction_bearish"),
        "vwap": ("price_above_vwap", "price_below_vwap"),
        "ema": ("ema_alignment_bullish", "ema_alignment_bearish"),
    }
    for comp_name, (pos_label, neg_label) in _component_labels.items():
        comp_score = components.get(comp_name, 0)
        if comp_score > 0:
            sources.append(pos_label)
        elif comp_score < 0:
            sources.append(neg_label)

    # Invalidation conditions (direction-aware defaults)
    invalidation_conditions: List[str] = _build_invalidation_conditions(
        direction, components
    )

    # Preferred setup types (direction + session aware)
    preferred_setup_types: List[str] = _preferred_setups(direction, session)

    return BiasObject(
        direction=direction,
        confidence=confidence,
        sources=sources,
        session=session,
        timeframe=timeframe,
        invalidation_conditions=invalidation_conditions,
        preferred_setup_types=preferred_setup_types,
        created_at=time.time(),
        raw_score=raw_score,
        raw_state=raw_state,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_invalidation_conditions(direction: str, components: dict) -> List[str]:
    """Build direction-aware list of invalidation conditions."""
    conditions: List[str] = []

    if direction == "bullish":
        conditions.append("Close below VWAP on 2+ consecutive bars")
        conditions.append("EMA stack crosses to bearish alignment")
        conditions.append("Price breaks below most recent swing low (structure break)")
        if components.get("trend", 0) > 0:
            conditions.append("Lower high formation confirms trend reversal")
    elif direction == "bearish":
        conditions.append("Close above VWAP on 2+ consecutive bars")
        conditions.append("EMA stack crosses to bullish alignment")
        conditions.append("Price breaks above most recent swing high (structure break)")
        if components.get("trend", 0) < 0:
            conditions.append("Higher low formation confirms trend reversal")
    else:  # neutral
        conditions.append("Sustained move > 1.5 ATR above VWAP (shifts bullish)")
        conditions.append("Sustained move > 1.5 ATR below VWAP (shifts bearish)")

    return conditions


def _preferred_setups(direction: str, session: str) -> List[str]:
    """Return playbook rule IDs most consistent with direction + session."""
    if direction == "bullish":
        base = ["orb_breakout", "consolidation_bo", "poc_rejection"]
        if session == "power_hour":
            base.append("session_fade")  # fade if trend has over-extended
    elif direction == "bearish":
        base = ["orb_breakout", "consolidation_bo", "poc_rejection"]
        if session == "power_hour":
            base.append("session_fade")
    else:  # neutral
        base = ["vwap_bounce", "poc_rejection", "double_fake"]

    return base

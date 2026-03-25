"""Declarative playbook rule schema.

A PlaybookRule captures all conditions, entry logic, risk parameters, and
invalidation criteria for one named trading setup.  Rules are stateless data
objects — they describe *when* and *how* to trade, not whether a specific bar
currently satisfies the conditions (that is the job of the setup engine).

Design goals:
- Machine-readable: the setup engine can filter rules by session, bias, category.
- Human-readable: every field has a plain-English description.
- Composable: rules combine independently; a session can match multiple rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class PlaybookRule:
    """A declarative trading playbook rule.

    Attributes
    ----------
    id:
        Short machine-readable identifier, e.g. "orb_breakout".
    name:
        Display name shown in UI, e.g. "ORB Breakout".
    description:
        Plain-English explanation of the setup thesis.
    direction:
        Allowed trade direction: "long", "short", or "both".

    Conditions
    ----------
    session_filter:
        Session names during which the rule is active.
        Matches values from ``arctis.analysis.sessions.Session`` enum:
        "premarket", "ny_open", "midday", "power_hour", "after_hours".
        Empty list means any session.
    bias_required:
        Bias direction that must be present: "bullish", "bearish", or None
        (= any bias is acceptable).  Maps to BiasState groups:
          "bullish" -> LONG or RANGE_LONG
          "bearish" -> SHORT or RANGE_SHORT
    min_confluence:
        Minimum confirmation count (0-5) required before the rule fires.
        Mirrors ``signals._count_confirmations`` scale.

    Entry Rules
    -----------
    entry_type:
        How to enter: "limit" (passive), "market" (aggressive), or "stop"
        (breakout trigger above/below a level).
    entry_description:
        Human-readable entry instruction, e.g. "Limit at OR high retest".

    Risk Rules
    ----------
    stop_type:
        How the stop-loss is placed: "fixed" (specific price), "swing"
        (most recent swing high/low), or "atr" (N * ATR below/above entry).
    stop_description:
        Human-readable stop instruction, e.g. "1.5 ATR below entry bar low".
    risk_reward_min:
        Minimum acceptable R:R ratio.  Signals below this threshold are
        discarded by the setup engine.

    Invalidation
    ------------
    invalidation_rules:
        Conditions that cancel this setup if they occur BEFORE entry.
        Plain-English strings, e.g. "Price closes below VWAP before trigger".
    no_trade_conditions:
        Market regimes where this rule should never fire, e.g.
        "High-impact news within 30 min", "ATR < 5 pts (no range)".

    Meta
    ----
    category:
        Setup archetype: "momentum", "reversal", "breakout", or "fade".
    confidence_weight:
        Multiplier applied to the computed confidence score when this
        playbook rule is matched (default 1.0, can boost or penalise).
    """

    # Identity
    id: str
    name: str
    description: str
    direction: str  # "long", "short", "both"

    # Conditions
    session_filter: List[str] = field(default_factory=list)
    bias_required: Optional[str] = None  # "bullish", "bearish", None=any
    min_confluence: float = 0

    # Entry rules
    entry_type: str = "limit"          # "limit", "market", "stop"
    entry_description: str = ""

    # Risk rules
    stop_type: str = "fixed"           # "fixed", "swing", "atr"
    stop_description: str = ""
    risk_reward_min: float = 1.5

    # Invalidation
    invalidation_rules: List[str] = field(default_factory=list)
    no_trade_conditions: List[str] = field(default_factory=list)

    # Meta
    category: str = "momentum"         # "momentum", "reversal", "breakout", "fade"
    confidence_weight: float = 1.0

    # ---------------------------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------------------------

    def allows_direction(self, direction: str) -> bool:
        """Return True if this rule permits the given trade direction."""
        if self.direction == "both":
            return True
        return self.direction == direction

    def session_matches(self, session_name: str) -> bool:
        """Return True if the current session is in the filter (or filter empty)."""
        if not self.session_filter:
            return True
        return session_name in self.session_filter

    def bias_matches(self, bias_direction: str) -> bool:
        """Return True if the current bias satisfies the rule requirement.

        Args:
            bias_direction: "bullish", "bearish", or "neutral".
        """
        if self.bias_required is None:
            return True
        return bias_direction == self.bias_required

    def __repr__(self) -> str:
        return (
            f"PlaybookRule(id={self.id!r}, direction={self.direction!r}, "
            f"category={self.category!r}, session_filter={self.session_filter!r})"
        )

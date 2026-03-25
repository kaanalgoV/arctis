"""Pre-built playbook rule library.

Each rule is a fully declarative ``PlaybookRule`` instance that captures
the conditions, entry logic, risk parameters, and invalidation criteria for
one named trading setup.

Rules are sourced from the AlgoView/Travis knowledge base and adapted to
Arctis NQ futures trading conventions:
  - NQ tick = 0.25 points
  - Default max stop = 100 ticks (25 NQ points)
  - Min R:R = 1.35 (matches signals.py _MIN_RR constant)

Available rules
---------------
  orb_breakout        Opening Range Breakout (breakout category)
  vwap_bounce         VWAP Mean-Reversion Bounce (reversal category)
  poc_rejection       Point of Control Rejection (reversal category)
  double_fake         Double Fake / Fakeout Reversal (reversal category)
  consolidation_bo    Consolidation Breakout (breakout category)
  session_fade        Session Fade / Late-Day Reversal (fade category)
"""

from __future__ import annotations

import time
from typing import Dict, Optional

from arctis.analysis.sessions import classify_session
from arctis.playbooks.schema import PlaybookRule


# ---------------------------------------------------------------------------
# Rule definitions
# ---------------------------------------------------------------------------

_ORB_BREAKOUT = PlaybookRule(
    id="orb_breakout",
    name="ORB Breakout",
    description=(
        "Opening Range Breakout. Price breaks and closes above (long) or below "
        "(short) the 30-minute opening range high/low with at least three "
        "confirmations. Directional bias and volume surge are required. "
        "Only valid within the first 90 minutes of RTH to avoid stale breakouts."
    ),
    direction="both",

    session_filter=["ny_open", "midday"],
    bias_required=None,           # works in any bias, but bias alignment adds confluence
    min_confluence=3,

    entry_type="stop",
    entry_description=(
        "Buy/sell-stop 0.25 pts beyond OR high/low. Wait for the breakout bar "
        "to close outside the range before entering — no spike-entries."
    ),

    stop_type="atr",
    stop_description=(
        "1.5 ATR (20-bar) below the breakout bar low (long) or above the "
        "breakout bar high (short). Minimum stop distance: 1 ATR."
    ),
    risk_reward_min=1.5,

    invalidation_rules=[
        "Price closes back inside the opening range (failed breakout)",
        "No volume expansion on the breakout bar (< 1.2x 20-bar average)",
        "Breakout occurs after bar 90 of RTH session (stale setup)",
        "Gap-open already past OR high/low at session start",
    ],
    no_trade_conditions=[
        "High-impact economic news within 30 minutes",
        "ATR < 5 NQ points (insufficient range)",
        "Pre-market range already > 40 NQ points (over-extended)",
    ],

    category="breakout",
    confidence_weight=1.1,  # slightly higher: historically 50%+ WR in clean breakouts
)


_VWAP_BOUNCE = PlaybookRule(
    id="vwap_bounce",
    name="VWAP Bounce",
    description=(
        "Mean-reversion trade when price has extended > 2 ATR from VWAP and "
        "shows a reversal bar back toward VWAP. Works best in trending-then-"
        "reverting environments (RANGE_LONG / RANGE_SHORT bias states). "
        "Added in signals v2 — replaces the removed VA Edge signal."
    ),
    direction="both",

    session_filter=["midday", "power_hour"],
    bias_required=None,
    min_confluence=2,

    entry_type="limit",
    entry_description=(
        "Limit entry on the pullback bar that first closes toward VWAP after "
        "the extreme. Entry is placed at the close of the reversal bar or at "
        "the VWAP ± 0.5 ATR zone."
    ),

    stop_type="swing",
    stop_description=(
        "Stop beyond the most recent swing extreme (swing high for short, "
        "swing low for long). Typically 1-1.5 ATR beyond the extreme."
    ),
    risk_reward_min=1.35,

    invalidation_rules=[
        "Price makes a new extreme in the same direction before reversal bar",
        "VWAP slope continues strongly in original direction (trending day)",
        "Volume increases on the extension bars (momentum, not exhaustion)",
    ],
    no_trade_conditions=[
        "Trend day classification: consecutive HH/HL or LL/LH without pullbacks",
        "Strong bias state: LONG or SHORT (not RANGE_LONG/RANGE_SHORT)",
        "ATR < 3 NQ points (not enough room to target VWAP profitably)",
    ],

    category="reversal",
    confidence_weight=1.0,
)


_POC_REJECTION = PlaybookRule(
    id="poc_rejection",
    name="POC Rejection",
    description=(
        "Price approaches the session Point of Control (or a naked prior-session "
        "POC) and shows rejection — a wick or a failed close through the POC. "
        "Best signal in signals v2 with 50%+ WR. Requires volume confirmation "
        "at the rejection point (> 1.2x 20-bar average)."
    ),
    direction="both",

    session_filter=["ny_open", "midday", "power_hour"],
    bias_required=None,
    min_confluence=2,

    entry_type="limit",
    entry_description=(
        "Limit at POC ± 0.5 points. Enter on the first bar that fails to "
        "close through the POC. For naked POCs from prior sessions, use a "
        "slightly wider entry zone (POC ± 1 point)."
    ),

    stop_type="swing",
    stop_description=(
        "Stop beyond the rejection wick: 0.25 pts (1 tick) past the wick "
        "extreme, or 1 ATR beyond the POC if wick is small."
    ),
    risk_reward_min=1.35,

    invalidation_rules=[
        "Price closes convincingly through POC on 2+ consecutive bars",
        "Volume at POC is below average (no genuine auction at the level)",
        "Bias strongly opposes the direction (e.g. LONG bias but shorting POC)",
    ],
    no_trade_conditions=[
        "POC is within 2 NQ points of VWAP (too thin a level cluster)",
        "Same POC already rejected 3+ times today (exhausted magnet level)",
        "First 15 bars of RTH (opening trap filter)",
    ],

    category="reversal",
    confidence_weight=1.15,  # best historical WR in backtest
)


_DOUBLE_FAKE = PlaybookRule(
    id="double_fake",
    name="Double Fake / Fakeout",
    description=(
        "A two-directional false breakout: price breaks a key level (OR high, "
        "prior high, VA boundary) in one direction, trapping breakout traders, "
        "then reverses sharply through to the opposite side. "
        "Identified by double_fake.py analysis module. A-Tier in the Travis "
        "strategy lab (Profit Factor 6.32 in backtests)."
    ),
    direction="both",

    session_filter=["ny_open", "midday"],
    bias_required=None,
    min_confluence=3,

    entry_type="market",
    entry_description=(
        "Market entry on confirmation of the reversal: once price reclaims "
        "the key level it just broke (e.g. closes back below the OR high that "
        "it spiked above). Can also use a limit at the re-test of the reclaimed "
        "level for a better fill."
    ),

    stop_type="fixed",
    stop_description=(
        "Stop above/below the fake-out extreme (the wick high/low that caused "
        "the initial false breakout). Typically 0.25-0.5 pts beyond the extreme."
    ),
    risk_reward_min=2.0,  # fakeouts reward well if confirmed — higher bar

    invalidation_rules=[
        "Fakeout bar closes OUTSIDE the level (genuine breakout, not a fake)",
        "Follow-through volume confirms the initial breakout direction",
        "No prior accumulation/distribution context at the faked level",
    ],
    no_trade_conditions=[
        "Low-volatility range day: ATR < 8 NQ points (no conviction in fakes)",
        "More than 2 fakeouts already observed today (random noise regime)",
        "High-impact news event within 15 minutes",
    ],

    category="reversal",
    confidence_weight=1.2,  # highest WR archetype when correctly identified
)


_CONSOLIDATION_BREAKOUT = PlaybookRule(
    id="consolidation_bo",
    name="Consolidation Breakout",
    description=(
        "Price compresses into a tight range (at least 5 bars, range < 50% of "
        "ATR) with declining volume, then breaks out with an expansion bar and "
        "volume surge. Works best after a clear trend move (breakout in trend "
        "direction = continuation; against trend = potential reversal setup)."
    ),
    direction="both",

    session_filter=["ny_open", "midday", "power_hour"],
    bias_required=None,
    min_confluence=2,

    entry_type="stop",
    entry_description=(
        "Buy/sell-stop 0.25 pts beyond the consolidation range boundary. "
        "The consolidation must have at least 5 bars and declining or steady "
        "volume before the breakout bar."
    ),

    stop_type="fixed",
    stop_description=(
        "Stop at the opposite boundary of the consolidation range, or "
        "0.5 ATR below/above the entry bar low/high if range is narrow."
    ),
    risk_reward_min=1.5,

    invalidation_rules=[
        "Breakout bar closes back inside the consolidation range (failed BO)",
        "Volume on breakout bar is below the consolidation average (weak expansion)",
        "Consolidation is < 5 bars (insufficient compression)",
        "Consolidation occurs against a strong daily bias (fading the trend)",
    ],
    no_trade_conditions=[
        "Consolidation range > 1.5x ATR (not a tight compression — random range)",
        "Breakout is into a major resistance/support zone with no room to target",
        "Multiple consolidation attempts already broken and failed today",
    ],

    category="breakout",
    confidence_weight=1.0,
)


_SESSION_FADE = PlaybookRule(
    id="session_fade",
    name="Session Fade",
    description=(
        "Fade the dominant session move during the power hour (14:00-16:00 ET). "
        "After a strong directional move in NY_OPEN / MIDDAY, price often mean-"
        "reverts as institutional activity winds down and retail over-extends. "
        "Works best when price is at an extreme relative to the session VWAP "
        "and volume is declining into the close."
    ),
    direction="both",

    session_filter=["power_hour"],
    bias_required=None,
    min_confluence=2,

    entry_type="limit",
    entry_description=(
        "Limit entry at or near the session high/low extension when a reversal "
        "bar appears. Confirm with a close back toward session midpoint. "
        "Entry zone: within 2 NQ points of the session extreme."
    ),

    stop_type="swing",
    stop_description=(
        "Stop 0.25-0.5 pts beyond the session extreme reached during the "
        "directional move. Do not allow more than 1.5 ATR of stop distance."
    ),
    risk_reward_min=1.35,

    invalidation_rules=[
        "Session is still making new highs/lows at the time of entry signal",
        "Volume is expanding (not declining) near the session extreme",
        "Bias state is LONG or SHORT (strong trend day — fades rarely work)",
    ],
    no_trade_conditions=[
        "Trend day: session has extended > 2.5x the prior-day ATR",
        "Major economic release occurs during power hour",
        "Position held over 15:50 ET (risk of closing auction volatility)",
    ],

    category="fade",
    confidence_weight=0.9,  # slightly penalised: lower success rate than breakouts
)


# ---------------------------------------------------------------------------
# Library registry
# ---------------------------------------------------------------------------

PLAYBOOK_LIBRARY: Dict[str, PlaybookRule] = {
    rule.id: rule
    for rule in [
        _ORB_BREAKOUT,
        _VWAP_BOUNCE,
        _POC_REJECTION,
        _DOUBLE_FAKE,
        _CONSOLIDATION_BREAKOUT,
        _SESSION_FADE,
    ]
}


def get_rule_by_id(rule_id: str) -> Optional[PlaybookRule]:
    """Look up a playbook rule by its identifier.

    Args:
        rule_id: The rule id string, e.g. "orb_breakout".

    Returns:
        The matching PlaybookRule, or None if not found.
    """
    return PLAYBOOK_LIBRARY.get(rule_id)


def get_rules_for_session(session_name: str) -> list[PlaybookRule]:
    """Return all rules that are active in the given session.

    Args:
        session_name: Session enum value as string, e.g. "ny_open".

    Returns:
        List of PlaybookRule objects whose session_filter includes this
        session, or that have an empty session_filter (= any session).
    """
    return [
        rule for rule in PLAYBOOK_LIBRARY.values()
        if rule.session_matches(session_name)
    ]


def get_rules_for_direction(direction: str) -> list[PlaybookRule]:
    """Return all rules that permit the given trade direction.

    Args:
        direction: "long" or "short".

    Returns:
        List of PlaybookRule objects that allow this direction.
    """
    return [
        rule for rule in PLAYBOOK_LIBRARY.values()
        if rule.allows_direction(direction)
    ]


def get_rules_by_category(category: str) -> list[PlaybookRule]:
    """Return all rules in the given category.

    Args:
        category: "momentum", "reversal", "breakout", or "fade".

    Returns:
        List of matching PlaybookRule objects.
    """
    return [
        rule for rule in PLAYBOOK_LIBRARY.values()
        if rule.category == category
    ]


def get_active_playbooks(unix_ts: int | None = None) -> list[PlaybookRule]:
    """Return playbook rules that are valid for the current (real-time) session.

    The session is derived from the actual wall-clock time (ET timezone) so
    stale API context cannot cause wrong rules to fire.

    Args:
        unix_ts: Optional unix timestamp to classify.  When None, ``time.time()``
                 is used so callers get the genuinely current session without
                 needing to pass anything.

    Returns:
        List of PlaybookRule objects whose ``session_filter`` includes the
        current session, or that have an empty session_filter (any session).

    Example::

        from arctis.playbooks.library import get_active_playbooks
        rules = get_active_playbooks()   # uses real-time clock
        for rule in rules:
            print(rule.id, rule.session_filter)
    """
    ts = unix_ts if unix_ts is not None else int(time.time())
    session = classify_session(ts)
    return get_rules_for_session(session.value)

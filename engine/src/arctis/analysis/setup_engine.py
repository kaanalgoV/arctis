"""Setup Lifecycle Engine — core differentiator of Arctis.

Detects trade setups from analysis modules, tracks their lifecycle (CANDIDATE ->
ARMED -> TRIGGERED -> PARTIAL_TP1 / STOPPED / COMPLETED), and exposes them via
the /api/setups endpoint.

Lifecycle transitions are determined by comparing current price against
setup levels.  The engine is stateless: every call to ``detect_setups``
re-evaluates each setup from scratch based on the latest bar.
"""

from dataclasses import dataclass, field
from enum import Enum


class SetupStatus(str, Enum):
    CANDIDATE = "candidate"
    ARMED = "armed"
    TRIGGERED = "triggered"
    PARTIAL_TP1 = "partial_tp1"
    STOPPED = "stopped"
    INVALIDATED = "invalidated"
    EXPIRED = "expired"
    COMPLETED = "completed"


@dataclass
class Setup:
    setup_id: str
    instrument: str
    timeframe: str
    direction: str          # "long" | "short"
    status: SetupStatus
    setup_type: str         # "orb_break" | "ib_break" | "poc_rejection" | etc.
    thesis: str             # Why this setup exists
    why_now: str            # Why at this moment
    why_here: str           # Why at this price level
    invalidation_reason: str = ""
    entry_zone_low: float = 0.0
    entry_zone_high: float = 0.0
    entry_trigger_price: float = 0.0
    stop_price: float = 0.0
    tp1_price: float = 0.0
    tp2_price: float = 0.0
    risk_reward: float = 0.0
    confidence: str = "medium"  # "high" | "medium" | "low"
    evidence: list[str] = field(default_factory=list)
    created_ts: int = 0
    armed_ts: int = 0
    entry_ts: int = 0
    exit_ts: int = 0
    exit_reason: str = ""
    source_modules: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Lifecycle helpers
# ---------------------------------------------------------------------------

_ARMED_PROXIMITY = 0.002   # price within 0.2% of entry triggers ARMED
_TP1_PROXIMITY = 0.001     # price within 0.1% of tp1 triggers PARTIAL_TP1


def _update_lifecycle_long(setup: Setup, price: float, ts: int) -> None:
    """Mutate setup status in-place for a long trade based on current price."""
    # Terminal states — stop re-evaluating
    if setup.status in (SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED):
        return

    entry = setup.entry_trigger_price
    stop = setup.stop_price
    tp1 = setup.tp1_price

    # Stop hit
    if stop > 0 and price <= stop:
        setup.status = SetupStatus.STOPPED
        setup.exit_ts = ts
        setup.exit_reason = "Stop hit"
        return

    # TP1 hit / completed
    if tp1 > 0 and price >= tp1:
        if setup.status == SetupStatus.PARTIAL_TP1:
            setup.status = SetupStatus.COMPLETED
            setup.exit_ts = ts
            setup.exit_reason = "TP2 / full exit"
        else:
            setup.status = SetupStatus.PARTIAL_TP1
            setup.exit_ts = ts
            setup.exit_reason = "TP1 hit"
        return

    # Triggered
    if entry > 0 and price >= entry:
        setup.status = SetupStatus.TRIGGERED
        if setup.entry_ts == 0:
            setup.entry_ts = ts
        return

    # Armed — price approaching entry
    if entry > 0 and price >= entry * (1 - _ARMED_PROXIMITY):
        setup.status = SetupStatus.ARMED
        if setup.armed_ts == 0:
            setup.armed_ts = ts
        return


def _update_lifecycle_short(setup: Setup, price: float, ts: int) -> None:
    """Mutate setup status in-place for a short trade based on current price."""
    if setup.status in (SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED):
        return

    entry = setup.entry_trigger_price
    stop = setup.stop_price
    tp1 = setup.tp1_price

    # Stop hit
    if stop > 0 and price >= stop:
        setup.status = SetupStatus.STOPPED
        setup.exit_ts = ts
        setup.exit_reason = "Stop hit"
        return

    # TP1 hit / completed
    if tp1 > 0 and price <= tp1:
        if setup.status == SetupStatus.PARTIAL_TP1:
            setup.status = SetupStatus.COMPLETED
            setup.exit_ts = ts
            setup.exit_reason = "TP2 / full exit"
        else:
            setup.status = SetupStatus.PARTIAL_TP1
            setup.exit_ts = ts
            setup.exit_reason = "TP1 hit"
        return

    # Triggered
    if entry > 0 and price <= entry:
        setup.status = SetupStatus.TRIGGERED
        if setup.entry_ts == 0:
            setup.entry_ts = ts
        return

    # Armed — price approaching entry
    if entry > 0 and price <= entry * (1 + _ARMED_PROXIMITY):
        setup.status = SetupStatus.ARMED
        if setup.armed_ts == 0:
            setup.armed_ts = ts
        return


# ---------------------------------------------------------------------------
# Evidence enrichment
# ---------------------------------------------------------------------------

def _enrich_evidence(setup: Setup, bias_state, confluence) -> None:
    """Add bias-alignment and confluence evidence to setup.evidence in-place."""
    if bias_state is not None:
        bs = (
            bias_state.get("state", "")
            if isinstance(bias_state, dict)
            else getattr(bias_state, "state", str(bias_state))
        )
        bs_str = str(bs).lower()
        if (setup.direction == "long" and "long" in bs_str) or \
           (setup.direction == "short" and "short" in bs_str):
            setup.evidence.append(f"Bias aligned: {bs}")
            setup.confidence = "high"

    if confluence is not None:
        score = (
            confluence.get("score", 0)
            if isinstance(confluence, dict)
            else getattr(confluence, "score", 0)
        )
        setup.evidence.append(f"Confluence score: {score:+d}")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_setups(bars, bias_state=None, confluence=None, signals=None) -> list[Setup]:
    """Detect active setups from analysis modules and track their lifecycle.

    Args:
        bars:        List of OHLCVBar objects (must have .close, .timestamp).
        bias_state:  BiasResult or dict with ``state`` key, or None.
        confluence:  ConfluenceResult or dict with ``score`` key, or None.
        signals:     List of TradeSignal objects from signals module, or None.

    Returns:
        List of Setup objects sorted by priority:
        terminal states last, then by confidence (high > medium > low),
        then by R:R descending.
    """
    if not bars or not signals:
        return []

    last = bars[-1]
    price = last.close
    ts = last.timestamp

    setups: list[Setup] = []

    for sig in signals:
        setup = Setup(
            setup_id=f"{sig.signal_type}_{sig.timestamp}",
            instrument=getattr(sig, "instrument", "NQ"),
            timeframe="1min",
            direction=sig.direction,
            status=SetupStatus.CANDIDATE,
            setup_type=sig.signal_type,
            thesis=sig.reason,
            why_now=f"Signal triggered at bar ts={sig.timestamp}",
            why_here=f"Price at {sig.entry_price:.2f} near key level",
            entry_trigger_price=sig.entry_price,
            entry_zone_low=sig.entry_price * 0.999,
            entry_zone_high=sig.entry_price * 1.001,
            stop_price=sig.stop_price,
            tp1_price=sig.target_price,
            risk_reward=sig.risk_reward,
            confidence=sig.confidence,
            evidence=[sig.reason],
            created_ts=sig.timestamp,
            source_modules=["signals"],
        )

        # Lifecycle transition
        if sig.direction == "long":
            _update_lifecycle_long(setup, price, ts)
        else:
            _update_lifecycle_short(setup, price, ts)

        # Enrich with bias / confluence
        _enrich_evidence(setup, bias_state, confluence)

        setups.append(setup)

    # Sort: active setups first, terminal states last; within active: high
    # confidence before medium/low, then higher R:R first.
    _conf_order = {"high": 0, "medium": 1, "low": 2}
    _terminal = {SetupStatus.STOPPED, SetupStatus.COMPLETED,
                 SetupStatus.INVALIDATED, SetupStatus.EXPIRED}

    setups.sort(key=lambda s: (
        1 if s.status in _terminal else 0,
        _conf_order.get(s.confidence, 2),
        -s.risk_reward,
    ))

    return setups

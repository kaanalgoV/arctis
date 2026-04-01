"""Setup Lifecycle Engine — core differentiator of Arctis.

Detects trade setups from analysis modules, tracks their lifecycle via explicit
state machine methods, and exposes them via the /api/setups endpoint.

State machine transitions:
    CANDIDATE -> QUALIFIED -> ARMED -> TRIGGERED -> IN_POSITION -> PARTIAL_TAKEN -> EXITED
    any -> INVALIDATED  (price violates stop before trigger)
    any -> EXPIRED      (setup is too old / session ended)

The engine is stateless per call: every invocation of ``detect_setups``
re-evaluates each setup from scratch based on the latest bar.  The lifecycle
methods (qualify, arm, trigger, …) may be used by external orchestration layers
that maintain persistent setup state across bars.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from arctis.analysis.sessions import Session, classify_session


# ---------------------------------------------------------------------------
# Status enum
# ---------------------------------------------------------------------------

class SetupStatus(str, Enum):
    CANDIDATE   = "candidate"
    QUALIFIED   = "qualified"
    ARMED       = "armed"
    TRIGGERED   = "triggered"
    IN_POSITION = "in_position"
    PARTIAL_TAKEN = "partial_taken"
    EXITED      = "exited"
    # Legacy aliases kept for backward-compatibility with existing UI
    PARTIAL_TP1 = "partial_tp1"
    STOPPED     = "stopped"
    COMPLETED   = "completed"
    # Terminal
    INVALIDATED = "invalidated"
    EXPIRED     = "expired"


# ---------------------------------------------------------------------------
# Domain model
# ---------------------------------------------------------------------------

@dataclass
class Setup:
    setup_id: str
    instrument: str
    timeframe: str
    direction: str           # "long" | "short"
    status: SetupStatus
    setup_type: str          # "orb_break" | "ib_break" | "poc_rejection" | etc.
    thesis: str              # Why this setup exists
    why_now: str             # Why at this moment
    why_here: str            # Why at this price level

    # Session context
    session: str = ""        # Session enum value, e.g. "ny_open"

    # State reason / narrative
    status_reason: str = ""
    invalidation_reason: str = ""

    # Entry / exit price levels
    entry_zone_low: float = 0.0
    entry_zone_high: float = 0.0
    entry_trigger_price: float = 0.0
    stop_price: float = 0.0
    tp1_price: float = 0.0
    tp2_price: float = 0.0
    risk_reward: float = 0.0

    # Context
    confidence: str = "medium"   # "high" | "medium" | "low"
    bias_direction: str = ""
    confluence_score: float = 0.0
    evidence: list[str] = field(default_factory=list)
    source_modules: list[str] = field(default_factory=list)

    # Chart annotation artifacts forwarded to the frontend
    chart_artifacts: dict = field(default_factory=dict)

    # Timestamps
    created_ts: int = 0
    qualified_ts: int = 0
    armed_ts: int = 0
    entry_ts: int = 0
    exit_ts: int = 0
    exit_reason: str = ""

    # Outcomes (populated after exit)
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    pnl_ticks: Optional[float] = None

    # ---------------------------------------------------------------------------
    # State machine transition methods
    # ---------------------------------------------------------------------------

    def qualify(self, reason: str = "", ts: int = 0) -> bool:
        """CANDIDATE -> QUALIFIED.  Returns True if transition was valid."""
        if self.status != SetupStatus.CANDIDATE:
            return False
        self.status = SetupStatus.QUALIFIED
        self.status_reason = reason or "Setup qualified"
        if ts:
            self.qualified_ts = ts
        return True

    def arm(self, ts: int = 0) -> bool:
        """QUALIFIED -> ARMED.  Returns True if transition was valid."""
        if self.status not in (SetupStatus.QUALIFIED, SetupStatus.CANDIDATE):
            return False
        self.status = SetupStatus.ARMED
        self.status_reason = "Price approaching entry zone"
        if ts and not self.armed_ts:
            self.armed_ts = ts
        return True

    def trigger(self, price: float, ts: int = 0) -> bool:
        """ARMED -> TRIGGERED.  Returns True if transition was valid."""
        if self.status != SetupStatus.ARMED:
            return False
        self.status = SetupStatus.TRIGGERED
        self.entry_price = price
        self.status_reason = f"Entry triggered at {price:.2f}"
        if ts and not self.entry_ts:
            self.entry_ts = ts
        return True

    def enter_position(self, price: float, ts: int = 0) -> bool:
        """TRIGGERED -> IN_POSITION.  Returns True if transition was valid."""
        if self.status != SetupStatus.TRIGGERED:
            return False
        self.status = SetupStatus.IN_POSITION
        if self.entry_price is None:
            self.entry_price = price
        self.status_reason = f"Position active at {price:.2f}"
        if ts and not self.entry_ts:
            self.entry_ts = ts
        return True

    def take_partial(self, price: float, ts: int = 0) -> bool:
        """IN_POSITION -> PARTIAL_TAKEN.  Returns True if transition was valid."""
        if self.status != SetupStatus.IN_POSITION:
            return False
        self.status = SetupStatus.PARTIAL_TAKEN
        self.status_reason = f"Partial exit at {price:.2f}"
        return True

    def exit(self, price: float, reason: str = "", ts: int = 0) -> bool:
        """TRIGGERED / IN_POSITION / PARTIAL_TAKEN -> EXITED.  Returns True if valid."""
        if self.status not in (
            SetupStatus.TRIGGERED,
            SetupStatus.IN_POSITION,
            SetupStatus.PARTIAL_TAKEN,
        ):
            return False
        self.status = SetupStatus.EXITED
        self.exit_price = price
        self.exit_reason = reason or f"Exited at {price:.2f}"
        self.status_reason = self.exit_reason
        if ts:
            self.exit_ts = ts
        # Calculate P&L in ticks (NQ = 0.25 tick size)
        if self.entry_price is not None:
            raw = (price - self.entry_price) if self.direction == "long" else (self.entry_price - price)
            self.pnl_ticks = round(raw / 0.25, 2)
        return True

    def invalidate(self, reason: str = "", ts: int = 0) -> bool:
        """any -> INVALIDATED.  Returns True if setup was not already terminal."""
        _terminal = {
            SetupStatus.EXITED, SetupStatus.INVALIDATED, SetupStatus.EXPIRED,
            SetupStatus.STOPPED, SetupStatus.COMPLETED,
        }
        if self.status in _terminal:
            return False
        self.status = SetupStatus.INVALIDATED
        self.invalidation_reason = reason or "Setup invalidated"
        self.status_reason = self.invalidation_reason
        if ts:
            self.exit_ts = ts
        return True

    def expire(self, reason: str = "Session ended") -> bool:
        """any -> EXPIRED (graceful expiry, not a stop hit)."""
        _terminal = {
            SetupStatus.EXITED, SetupStatus.INVALIDATED, SetupStatus.EXPIRED,
            SetupStatus.STOPPED, SetupStatus.COMPLETED,
        }
        if self.status in _terminal:
            return False
        self.status = SetupStatus.EXPIRED
        self.status_reason = reason
        return True


# ---------------------------------------------------------------------------
# Proximity constants
# ---------------------------------------------------------------------------

_ARMED_PROXIMITY = 0.002   # price within 0.2% of entry triggers ARMED
_TP1_PROXIMITY = 0.001     # price within 0.1% of tp1 triggers PARTIAL_TP1


# ---------------------------------------------------------------------------
# Lifecycle update helpers (stateless re-evaluation per bar)
# ---------------------------------------------------------------------------

def _update_lifecycle_long(setup: Setup, price: float, ts: int) -> None:
    """Mutate setup status in-place for a long trade based on current price."""
    _terminal = {
        SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED,
        SetupStatus.EXITED, SetupStatus.EXPIRED,
    }
    if setup.status in _terminal:
        return

    entry = setup.entry_trigger_price
    stop  = setup.stop_price
    tp1   = setup.tp1_price

    _pre_entry = {SetupStatus.CANDIDATE, SetupStatus.QUALIFIED, SetupStatus.ARMED}

    # Stale setup guard: if the setup was never triggered and price has moved
    # far past entry (>50 pts for NQ-class instruments) in either direction,
    # expire it — the opportunity window has passed.
    if setup.status in _pre_entry and entry > 0:
        distance = abs(price - entry)
        if distance > 50.0:
            setup.expire(reason=f"Price {price:.2f} moved {distance:.0f}pts from entry {entry:.2f}")
            return

    # Stop hit — pre-trigger invalidation
    if stop > 0 and price <= stop and setup.status in _pre_entry:
        setup.status = SetupStatus.INVALIDATED
        setup.invalidation_reason = f"Stop violated before entry at {price:.2f}"
        setup.exit_ts = ts
        return

    # Stop hit after entry
    if stop > 0 and price <= stop:
        setup.status = SetupStatus.STOPPED
        setup.exit_ts = ts
        setup.exit_reason = "Stop hit"
        return

    # TP1 hit — only valid if the trade was actually entered
    if tp1 > 0 and price >= tp1:
        if setup.status == SetupStatus.PARTIAL_TP1:
            setup.status = SetupStatus.COMPLETED
            setup.exit_ts = ts
            setup.exit_reason = "TP2 / full exit"
        elif setup.status in (SetupStatus.IN_POSITION, SetupStatus.PARTIAL_TAKEN):
            setup.status = SetupStatus.EXITED
            setup.exit_price = price
            setup.exit_ts = ts
            setup.exit_reason = "TP1 hit"
            if setup.entry_price:
                raw = price - setup.entry_price
                setup.pnl_ticks = round(raw / 0.25, 2)
        elif setup.status in _pre_entry:
            # Price ran past TP1 without the trade being entered — expire, not PARTIAL_TP1
            setup.expire(reason=f"Price ran past TP1 ({tp1:.2f}) without entry")
        else:
            setup.status = SetupStatus.PARTIAL_TP1
            setup.exit_ts = ts
            setup.exit_reason = "TP1 hit"
        return

    # Triggered
    if entry > 0 and price >= entry:
        if setup.status == SetupStatus.ARMED:
            setup.status = SetupStatus.TRIGGERED
            if not setup.entry_ts:
                setup.entry_ts = ts
            if setup.entry_price is None:
                setup.entry_price = price
        return

    # Armed — price approaching entry
    if entry > 0 and price >= entry * (1 - _ARMED_PROXIMITY):
        if setup.status in (SetupStatus.CANDIDATE, SetupStatus.QUALIFIED):
            setup.status = SetupStatus.ARMED
            if not setup.armed_ts:
                setup.armed_ts = ts
        return


def _update_lifecycle_short(setup: Setup, price: float, ts: int) -> None:
    """Mutate setup status in-place for a short trade based on current price."""
    _terminal = {
        SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED,
        SetupStatus.EXITED, SetupStatus.EXPIRED,
    }
    if setup.status in _terminal:
        return

    entry = setup.entry_trigger_price
    stop  = setup.stop_price
    tp1   = setup.tp1_price

    _pre_entry = {SetupStatus.CANDIDATE, SetupStatus.QUALIFIED, SetupStatus.ARMED}

    # Stale setup guard: if the setup was never triggered and price has moved
    # far past entry (>50 pts for NQ-class instruments) in either direction,
    # expire it — the opportunity window has passed.
    if setup.status in _pre_entry and entry > 0:
        distance = abs(price - entry)
        if distance > 50.0:
            setup.expire(reason=f"Price {price:.2f} moved {distance:.0f}pts from entry {entry:.2f}")
            return

    # Stop hit — pre-trigger invalidation
    if stop > 0 and price >= stop and setup.status in _pre_entry:
        setup.status = SetupStatus.INVALIDATED
        setup.invalidation_reason = f"Stop violated before entry at {price:.2f}"
        setup.exit_ts = ts
        return

    # Stop hit after entry
    if stop > 0 and price >= stop:
        setup.status = SetupStatus.STOPPED
        setup.exit_ts = ts
        setup.exit_reason = "Stop hit"
        return

    # TP1 hit — only valid if the trade was actually entered
    if tp1 > 0 and price <= tp1:
        if setup.status == SetupStatus.PARTIAL_TP1:
            setup.status = SetupStatus.COMPLETED
            setup.exit_ts = ts
            setup.exit_reason = "TP2 / full exit"
        elif setup.status in (SetupStatus.IN_POSITION, SetupStatus.PARTIAL_TAKEN):
            setup.status = SetupStatus.EXITED
            setup.exit_price = price
            setup.exit_ts = ts
            setup.exit_reason = "TP1 hit"
            if setup.entry_price:
                raw = setup.entry_price - price
                setup.pnl_ticks = round(raw / 0.25, 2)
        elif setup.status in _pre_entry:
            # Price ran past TP1 without the trade being entered — expire, not PARTIAL_TP1
            setup.expire(reason=f"Price ran past TP1 ({tp1:.2f}) without entry")
        else:
            setup.status = SetupStatus.PARTIAL_TP1
            setup.exit_ts = ts
            setup.exit_reason = "TP1 hit"
        return

    # Triggered
    if entry > 0 and price <= entry:
        if setup.status == SetupStatus.ARMED:
            setup.status = SetupStatus.TRIGGERED
            if not setup.entry_ts:
                setup.entry_ts = ts
            if setup.entry_price is None:
                setup.entry_price = price
        return

    # Armed — price approaching entry
    if entry > 0 and price <= entry * (1 + _ARMED_PROXIMITY):
        if setup.status in (SetupStatus.CANDIDATE, SetupStatus.QUALIFIED):
            setup.status = SetupStatus.ARMED
            if not setup.armed_ts:
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
            setup.bias_direction = setup.direction
            setup.confidence = "high"

    if confluence is not None:
        score = (
            confluence.get("score", 0)
            if isinstance(confluence, dict)
            else getattr(confluence, "score", 0)
        )
        setup.confluence_score = float(score)
        setup.evidence.append(f"Confluence score: {score:+d}")


def _build_chart_artifacts(setup: Setup) -> dict:
    """Build chart annotation artifacts for the frontend renderer.

    Shape contract (SciChart-compatible):
      - Band annotation:  { type, y1, y2, fill, border, low, high }
                          (y1/y2 are the canonical keys; low/high are kept for
                          backward-compatibility with existing frontend code)
      - HLine annotation: { type, price, color, dash: [int, int] | "solid" | "dashed",
                            label }
    """
    artifacts: dict = {}

    # Entry zone horizontal band
    if setup.entry_zone_low > 0 and setup.entry_zone_high > 0:
        artifacts["entry_zone"] = {
            "type": "band",
            # Canonical keys (frontend SciChart renderer)
            "y1": setup.entry_zone_low,
            "y2": setup.entry_zone_high,
            "fill": "rgba(92,184,240,0.1)",
            # Backward-compat aliases
            "low": setup.entry_zone_low,
            "high": setup.entry_zone_high,
            "color": "rgba(92,184,240,0.12)",
            "border": "rgba(92,184,240,0.4)",
        }

    # Entry trigger horizontal line
    if setup.entry_trigger_price > 0:
        artifacts["entry_line"] = {
            "type": "hline",
            "price": setup.entry_trigger_price,
            "color": "#5CB8F0",
            "dash": [4, 4],
            "label": "Entry",
        }
        # Keep old key for backward-compat
        artifacts["entry_trigger"] = artifacts["entry_line"]

    # Stop line
    if setup.stop_price > 0:
        artifacts["stop_line"] = {
            "type": "hline",
            "price": setup.stop_price,
            "color": "#EF4136",
            "dash": [2, 2],
            "label": "Stop",
        }
        artifacts["stop"] = artifacts["stop_line"]

    # TP1 line
    if setup.tp1_price > 0:
        artifacts["target_1"] = {
            "type": "hline",
            "price": setup.tp1_price,
            "color": "#34D399",
            "dash": [4, 4],
            "label": "TP1",
        }
        artifacts["tp1"] = artifacts["target_1"]

    # TP2 line
    if setup.tp2_price > 0:
        artifacts["target_2"] = {
            "type": "hline",
            "price": setup.tp2_price,
            "color": "#34D399",
            "dash": [6, 4],
            "label": "TP2",
        }
        artifacts["tp2"] = artifacts["target_2"]

    return artifacts


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _calc_precise_entry_zone(
    direction: str,
    entry_price: float,
    stop_price: float,
    signal_type: str,
) -> tuple[float, float]:
    """Calculate a precise, market-reactive entry zone around the entry trigger.

    The entry zone width is derived from signal type and risk distance:
    - orb_break / daily_breakout: 0.5 pt zone (stop entry — tight)
    - poc_rejection / vwap_bounce: 1.0 pt zone (limit entry — slightly wider)
    - bos / sammelzone_breakout: 0.75 pt zone

    Returns (entry_zone_low, entry_zone_high).
    """
    _ZONE_WIDTH: dict[str, float] = {
        "orb_break": 0.5,
        "daily_breakout": 0.5,
        "poc_rejection": 1.0,
        "vwap_bounce": 1.0,
        "bos": 0.75,
        "sammelzone_breakout": 0.75,
    }
    half = _ZONE_WIDTH.get(signal_type, 1.0) / 2.0

    if direction == "long":
        # Entry zone: just below the trigger (where we'd place a buy-stop or limit)
        low = round(entry_price - half, 2)
        high = round(entry_price + half, 2)
    else:
        low = round(entry_price - half, 2)
        high = round(entry_price + half, 2)

    return low, high


def _calc_tp2(direction: str, entry: float, tp1: float, stop: float) -> float:
    """Calculate TP2 as entry + 1.5x the TP1 distance (extended target).

    For long: TP2 = entry + 1.5 * (TP1 - entry)
    For short: TP2 = entry - 1.5 * (entry - TP1)
    """
    if direction == "long":
        return round(entry + 1.5 * (tp1 - entry), 2)
    else:
        return round(entry - 1.5 * (entry - tp1), 2)


def _build_why_texts(sig, current_session_str: str, price: float) -> tuple[str, str]:
    """Build precise why_now and why_here texts from signal data."""
    from datetime import datetime, timezone
    dt = datetime.fromtimestamp(sig.timestamp, tz=timezone.utc)
    time_str = dt.strftime("%H:%M ET")

    session_label = {
        "ny_open": "NY Open",
        "midday": "Midday",
        "afternoon": "Afternoon",
        "power_hour": "Power Hour",
    }.get(current_session_str, current_session_str.replace("_", " ").title())

    type_label = {
        "orb_break": "Opening Range Breakout",
        "poc_rejection": "POC Rejection",
        "vwap_bounce": "VWAP Bounce",
        "bos": "Break of Structure / Naked POC",
        "daily_breakout": "Daily Level Breakout",
        "sammelzone_breakout": "Sammelzone Breakout",
    }.get(sig.signal_type, sig.signal_type.replace("_", " ").title())

    conf_label = {
        "high": f"High confluence ({getattr(sig, 'confluence_count', '?')}/5 confirmations)",
        "medium": f"Medium confluence ({getattr(sig, 'confluence_count', '?')}/5 confirmations)",
        "low": "Low confluence",
    }.get(sig.confidence, sig.confidence)

    vwap_txt = " | VWAP aligned" if getattr(sig, "vwap_aligned", False) else ""

    why_now = (
        f"{session_label} at {time_str} — {type_label} signal fired."
        f" {conf_label}{vwap_txt}."
    )
    why_here = (
        f"Entry at {sig.entry_price:.2f} | Stop {sig.stop_price:.2f}"
        f" ({abs(sig.entry_price - sig.stop_price):.2f} pts risk)"
        f" | Target {sig.target_price:.2f}"
        f" | R:R {sig.risk_reward:.2f}:1"
    )
    return why_now, why_here


def detect_setups(bars, bias_state=None, confluence=None, signals=None, playbook_rules=None) -> list[Setup]:
    """Detect active setups from analysis modules and track their lifecycle.

    Args:
        bars:            List of OHLCVBar objects (must have .close, .timestamp).
        bias_state:      BiasResult or dict with ``state`` key, or None.
        confluence:      ConfluenceResult or dict with ``score`` key, or None.
        signals:         List of TradeSignal objects from signals module, or None.
        playbook_rules:  Optional list of PlaybookRule objects to filter against.
                         When provided, only signals whose signal_type matches an
                         active rule for the current session are kept.  If None,
                         no playbook filtering is applied (backward-compatible).

    Returns:
        List of Setup objects sorted by priority:
        terminal states last, then by confidence (high > medium > low),
        then by R:R descending.
    """
    if not bars or not signals:
        return []

    last  = bars[-1]
    price = last.close
    ts    = last.timestamp

    # Determine the real-time session from the last bar timestamp
    current_session: Session = classify_session(ts)
    current_session_str: str = current_session.value  # e.g. "ny_open"

    # Build a set of allowed signal types from active playbook rules, if provided
    # Note: signals module uses "orb_break" but playbook uses "orb_breakout" — map them
    _SIGNAL_TO_PLAYBOOK: dict[str, str] = {
        "orb_break": "orb_breakout",
        "poc_rejection": "poc_rejection",
        "vwap_bounce": "vwap_bounce",
        "bos": "consolidation_bo",
        "daily_breakout": "orb_breakout",
        "sammelzone_breakout": "consolidation_bo",
    }

    allowed_setup_types: set[str] | None = None
    if playbook_rules is not None:
        active_rules = [r for r in playbook_rules if r.session_matches(current_session_str)]
        allowed_playbook_ids = {r.id for r in active_rules}
        # Map signal types to playbook IDs for filtering
        allowed_setup_types = {
            sig_type
            for sig_type, pb_id in _SIGNAL_TO_PLAYBOOK.items()
            if pb_id in allowed_playbook_ids
        }
        # Also allow direct match in case signal_type == playbook id
        for r in active_rules:
            allowed_setup_types.add(r.id)

    setups: list[Setup] = []

    for sig in signals:
        # Playbook session filter: skip signal if its type is not in an active rule
        if allowed_setup_types is not None and sig.signal_type not in allowed_setup_types:
            continue

        # Precise entry zone width based on signal type
        ez_low, ez_high = _calc_precise_entry_zone(
            sig.direction, sig.entry_price, sig.stop_price, sig.signal_type
        )

        # TP2 — extended target at 1.5x TP1 distance
        tp2 = _calc_tp2(sig.direction, sig.entry_price, sig.target_price, sig.stop_price)

        # Precise why_now / why_here texts
        why_now, why_here = _build_why_texts(sig, current_session_str, price)

        setup = Setup(
            setup_id=f"{sig.signal_type}_{sig.timestamp}",
            instrument=getattr(sig, "instrument", "NQ"),
            timeframe="1min",
            direction=sig.direction,
            status=SetupStatus.CANDIDATE,
            setup_type=sig.signal_type,
            thesis=sig.reason,
            why_now=why_now,
            why_here=why_here,
            session=current_session_str,
            entry_trigger_price=sig.entry_price,
            entry_zone_low=ez_low,
            entry_zone_high=ez_high,
            stop_price=sig.stop_price,
            tp1_price=sig.target_price,
            tp2_price=tp2,
            risk_reward=sig.risk_reward,
            confidence=sig.confidence,
            evidence=[sig.reason],
            created_ts=sig.timestamp,
            source_modules=["signals"],
        )

        # Qualify immediately — every signal from the signals module is pre-screened
        setup.qualify(
            reason=f"Signal module qualification ({current_session_str})",
            ts=ts,
        )

        # Tag the status reason with session context
        setup.status_reason = (
            f"[{current_session_str}] {setup.status_reason}"
        )

        # Lifecycle transition based on current price
        if sig.direction == "long":
            _update_lifecycle_long(setup, price, ts)
        else:
            _update_lifecycle_short(setup, price, ts)

        # Enrich with bias / confluence
        _enrich_evidence(setup, bias_state, confluence)

        # Build chart artifacts for frontend
        setup.chart_artifacts = _build_chart_artifacts(setup)

        setups.append(setup)

    # Sort: active setups first, terminal states last; within active: high
    # confidence before medium/low, then higher R:R first.
    _conf_order = {"high": 0, "medium": 1, "low": 2}
    _terminal = {
        SetupStatus.STOPPED, SetupStatus.COMPLETED, SetupStatus.INVALIDATED,
        SetupStatus.EXPIRED, SetupStatus.EXITED,
    }

    setups.sort(key=lambda s: (
        1 if s.status in _terminal else 0,
        _conf_order.get(s.confidence, 2),
        -s.risk_reward,
    ))

    return setups

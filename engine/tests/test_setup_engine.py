"""Tests for the Setup Lifecycle Engine (arctis.analysis.setup_engine)."""

import pytest
from arctis.models import OHLCVBar
from arctis.analysis.setup_engine import (
    Setup,
    SetupStatus,
    detect_setups,
    _update_lifecycle_long,
    _update_lifecycle_short,
)
from arctis.analysis.signals import TradeSignal


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_bars(closes: list[float], base_ts: int = 1_000_000) -> list[OHLCVBar]:
    """Create minimal OHLCVBar list from close prices."""
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=c,
            high=c + 1.0,
            low=c - 1.0,
            close=c,
            volume=1000,
        )
        for i, c in enumerate(closes)
    ]


def make_signal(
    direction: str = "long",
    entry: float = 100.0,
    stop: float = 98.0,
    target: float = 104.0,
    signal_type: str = "orb_break",
    confidence: str = "medium",
    ts: int = 1_000_000,
) -> TradeSignal:
    rr = (target - entry) / max(entry - stop, 0.01) if direction == "long" \
        else (entry - target) / max(stop - entry, 0.01)
    return TradeSignal(
        direction=direction,
        signal_type=signal_type,
        entry_price=entry,
        stop_price=stop,
        target_price=target,
        risk_reward=round(rr, 1),
        confidence=confidence,
        reason=f"Test {signal_type} {direction}",
        timestamp=ts,
    )


def make_setup(
    direction: str = "long",
    entry: float = 100.0,
    stop: float = 98.0,
    tp1: float = 104.0,
    status: SetupStatus = SetupStatus.CANDIDATE,
) -> Setup:
    return Setup(
        setup_id="test_setup",
        instrument="NQ",
        timeframe="1min",
        direction=direction,
        status=status,
        setup_type="orb_break",
        thesis="test thesis",
        why_now="test now",
        why_here="test here",
        entry_trigger_price=entry,
        stop_price=stop,
        tp1_price=tp1,
        risk_reward=2.0,
    )


# ── Unit: Lifecycle helpers ───────────────────────────────────────────────────

class TestLongLifecycle:
    def test_candidate_transitions_to_stopped_when_stop_is_hit(self):
        # Even a CANDIDATE setup becomes STOPPED if price immediately hits the stop.
        # (The setup never had a chance to arm/trigger — it's invalidated on creation.)
        setup = make_setup("long", entry=100.0, stop=98.0)
        _update_lifecycle_long(setup, price=90.0, ts=1)  # well below stop=98
        assert setup.status == SetupStatus.STOPPED

    def test_candidate_stays_candidate_when_price_neutral(self):
        # Price between stop and armed threshold — no transition yet
        setup = make_setup("long", entry=100.0, stop=95.0)
        _update_lifecycle_long(setup, price=96.0, ts=1)
        assert setup.status == SetupStatus.CANDIDATE

    def test_armed_when_price_approaches_entry(self):
        setup = make_setup("long", entry=100.0)
        # Price within 0.2% of entry from below
        _update_lifecycle_long(setup, price=99.9, ts=100)
        assert setup.status == SetupStatus.ARMED
        assert setup.armed_ts == 100

    def test_triggered_when_price_at_or_above_entry(self):
        setup = make_setup("long", entry=100.0)
        _update_lifecycle_long(setup, price=100.0, ts=200)
        assert setup.status == SetupStatus.TRIGGERED
        assert setup.entry_ts == 200

    def test_triggered_when_price_above_entry(self):
        setup = make_setup("long", entry=100.0)
        _update_lifecycle_long(setup, price=101.5, ts=300)
        assert setup.status == SetupStatus.TRIGGERED

    def test_stopped_when_price_at_stop(self):
        setup = make_setup("long", entry=100.0, stop=98.0)
        _update_lifecycle_long(setup, price=98.0, ts=400)
        assert setup.status == SetupStatus.STOPPED
        assert setup.exit_reason == "Stop hit"
        assert setup.exit_ts == 400

    def test_stopped_when_price_below_stop(self):
        setup = make_setup("long", entry=100.0, stop=98.0)
        _update_lifecycle_long(setup, price=97.0, ts=500)
        assert setup.status == SetupStatus.STOPPED

    def test_partial_tp1_when_price_reaches_tp1(self):
        setup = make_setup("long", entry=100.0, tp1=104.0,
                           status=SetupStatus.TRIGGERED)
        _update_lifecycle_long(setup, price=104.0, ts=600)
        assert setup.status == SetupStatus.PARTIAL_TP1
        assert "TP1" in setup.exit_reason

    def test_completed_from_partial_tp1(self):
        setup = make_setup("long", entry=100.0, tp1=104.0,
                           status=SetupStatus.PARTIAL_TP1)
        _update_lifecycle_long(setup, price=104.5, ts=700)
        assert setup.status == SetupStatus.COMPLETED

    def test_terminal_state_is_not_overwritten(self):
        setup = make_setup("long", status=SetupStatus.STOPPED)
        _update_lifecycle_long(setup, price=50.0, ts=800)
        assert setup.status == SetupStatus.STOPPED


class TestShortLifecycle:
    def test_candidate_transitions_to_stopped_when_stop_is_hit(self):
        # Price well above stop for a short setup — becomes STOPPED immediately
        setup = make_setup("short", entry=100.0, stop=102.0, tp1=96.0)
        _update_lifecycle_short(setup, price=110.0, ts=1)  # above stop=102
        assert setup.status == SetupStatus.STOPPED

    def test_candidate_stays_candidate_when_price_neutral(self):
        # Price between armed threshold and stop — no transition
        setup = make_setup("short", entry=100.0, stop=106.0, tp1=94.0)
        _update_lifecycle_short(setup, price=103.0, ts=1)
        assert setup.status == SetupStatus.CANDIDATE

    def test_armed_when_price_approaches_entry_from_above(self):
        setup = make_setup("short", entry=100.0, stop=102.0, tp1=96.0)
        # Price within 0.2% above entry
        _update_lifecycle_short(setup, price=100.1, ts=100)
        assert setup.status == SetupStatus.ARMED

    def test_triggered_when_price_at_or_below_entry(self):
        setup = make_setup("short", entry=100.0, stop=102.0, tp1=96.0)
        _update_lifecycle_short(setup, price=100.0, ts=200)
        assert setup.status == SetupStatus.TRIGGERED

    def test_stopped_when_price_at_or_above_stop(self):
        setup = make_setup("short", entry=100.0, stop=102.0, tp1=96.0)
        _update_lifecycle_short(setup, price=102.0, ts=300)
        assert setup.status == SetupStatus.STOPPED
        assert setup.exit_reason == "Stop hit"

    def test_partial_tp1_when_price_at_target(self):
        setup = make_setup("short", entry=100.0, stop=102.0, tp1=96.0,
                           status=SetupStatus.TRIGGERED)
        _update_lifecycle_short(setup, price=96.0, ts=400)
        assert setup.status == SetupStatus.PARTIAL_TP1

    def test_terminal_state_is_not_overwritten(self):
        setup = make_setup("short", status=SetupStatus.COMPLETED)
        _update_lifecycle_short(setup, price=999.0, ts=500)
        assert setup.status == SetupStatus.COMPLETED


# ── Integration: detect_setups ────────────────────────────────────────────────

class TestDetectSetups:
    def test_returns_empty_without_signals(self):
        bars = make_bars([100.0] * 60)
        result = detect_setups(bars)
        assert result == []

    def test_returns_empty_without_bars(self):
        sig = make_signal()
        result = detect_setups([], signals=[sig])
        assert result == []

    def test_returns_one_setup_per_signal(self):
        bars = make_bars([100.0] * 60)
        signals = [make_signal("long"), make_signal("short", entry=100.0, stop=102.0, target=96.0)]
        result = detect_setups(bars, signals=signals)
        assert len(result) == 2

    def test_setup_id_contains_signal_type(self):
        bars = make_bars([100.0] * 60)
        sig = make_signal(signal_type="ib_break")
        result = detect_setups(bars, signals=[sig])
        assert "ib_break" in result[0].setup_id

    def test_long_setup_triggered_when_price_above_entry(self):
        # Last bar close above entry
        closes = [98.0] * 59 + [101.0]
        bars = make_bars(closes)
        sig = make_signal("long", entry=100.0, stop=98.0, target=104.0)
        result = detect_setups(bars, signals=[sig])
        assert result[0].status == SetupStatus.TRIGGERED

    def test_long_setup_stopped_when_price_at_stop(self):
        closes = [100.0] * 59 + [97.5]
        bars = make_bars(closes)
        sig = make_signal("long", entry=100.0, stop=98.0, target=104.0)
        result = detect_setups(bars, signals=[sig])
        assert result[0].status == SetupStatus.STOPPED

    def test_short_setup_triggered_when_price_below_entry(self):
        closes = [102.0] * 59 + [99.0]
        bars = make_bars(closes)
        sig = make_signal("short", entry=100.0, stop=102.0, target=96.0)
        result = detect_setups(bars, signals=[sig])
        assert result[0].status == SetupStatus.TRIGGERED

    def test_high_confidence_sorted_before_low(self):
        bars = make_bars([100.0] * 60)
        sig_low = make_signal(confidence="low", ts=1_000_000)
        sig_high = make_signal(confidence="high", ts=1_000_001)
        result = detect_setups(bars, signals=[sig_low, sig_high])
        assert result[0].confidence == "high"

    def test_bias_alignment_upgrades_confidence_to_high(self):
        bars = make_bars([100.0] * 60)
        sig = make_signal("long", confidence="medium")
        # bias_state as a mock object with .state attribute
        class FakeBias:
            state = "LONG"
        result = detect_setups(bars, bias_state=FakeBias(), signals=[sig])
        assert result[0].confidence == "high"
        assert any("Bias aligned" in e for e in result[0].evidence)

    def test_confluence_score_added_to_evidence(self):
        bars = make_bars([100.0] * 60)
        sig = make_signal("long")
        class FakeConfluence:
            score = 5
        result = detect_setups(bars, confluence=FakeConfluence(), signals=[sig])
        assert any("Confluence" in e for e in result[0].evidence)

    def test_terminal_setups_sorted_last(self):
        bars = make_bars([100.0] * 59 + [97.5])  # price at stop
        sig_stopped = make_signal("long", entry=100.0, stop=98.0, target=104.0, ts=1_000_000)
        sig_active = make_signal("long", entry=100.0, stop=90.0, target=110.0, ts=1_000_001)
        result = detect_setups(bars, signals=[sig_stopped, sig_active])
        # Active (candidate/stopped higher entry) before terminal
        assert not any(
            r.status in (SetupStatus.STOPPED,)
            for r in result[:1]
        ) or result[-1].status == SetupStatus.STOPPED


# ── SetupStatus enum ─────────────────────────────────────────────────────────

class TestSetupStatusEnum:
    def test_all_status_values_are_strings(self):
        for status in SetupStatus:
            assert isinstance(status.value, str)

    def test_serializable_as_string(self):
        assert SetupStatus.CANDIDATE.value == "candidate"
        assert SetupStatus.ARMED.value == "armed"
        assert SetupStatus.TRIGGERED.value == "triggered"
        assert SetupStatus.PARTIAL_TP1.value == "partial_tp1"
        assert SetupStatus.STOPPED.value == "stopped"
        assert SetupStatus.INVALIDATED.value == "invalidated"
        assert SetupStatus.EXPIRED.value == "expired"
        assert SetupStatus.COMPLETED.value == "completed"

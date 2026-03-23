"""Tests for the FeedEventEngine in arctis.events."""

import pytest
from arctis.events import AnalysisSnapshot, FeedEvent, FeedEventEngine


def _snap(
    timestamp: int = 1000,
    session: str = "ny_open",
    confluence_score: int = 30,
    confluence_direction: str = "long",
    volume_ratios: list | None = None,
    patterns: list | None = None,
) -> AnalysisSnapshot:
    return AnalysisSnapshot(
        timestamp=timestamp,
        session=session,
        confluence_score=confluence_score,
        confluence_direction=confluence_direction,
        volume_ratios=volume_ratios or [1.0, 1.1, 0.9, 1.0, 1.0],
        patterns=patterns or [],
    )


# ── session_change ─────────────────────────────────────────────────────────────

def test_session_change_emits_event():
    engine = FeedEventEngine()
    engine.update(_snap(session="ny_open"))
    events = engine.update(_snap(session="midday", timestamp=1060))
    assert len(events) == 1
    evt = events[0]
    assert evt.type == "session_change"
    assert "ny_open" in evt.message
    assert "midday" in evt.message


def test_no_event_when_session_unchanged():
    engine = FeedEventEngine()
    engine.update(_snap(session="ny_open"))
    events = engine.update(_snap(session="ny_open", timestamp=1060))
    # No session change event expected
    session_events = [e for e in events if e.type == "session_change"]
    assert session_events == []


# ── confluence_shift ───────────────────────────────────────────────────────────

def test_confluence_shift_above_threshold():
    engine = FeedEventEngine()
    engine.update(_snap(confluence_score=20))
    events = engine.update(_snap(confluence_score=35, timestamp=1060))
    shift_events = [e for e in events if e.type == "confluence_shift"]
    assert len(shift_events) == 1
    assert shift_events[0].severity == "signal"
    assert shift_events[0].detail["delta"] == 15


def test_confluence_shift_below_threshold_no_event():
    engine = FeedEventEngine()
    engine.update(_snap(confluence_score=30))
    events = engine.update(_snap(confluence_score=35, timestamp=1060))
    shift_events = [e for e in events if e.type == "confluence_shift"]
    assert shift_events == []


def test_confluence_decrease_is_warning():
    engine = FeedEventEngine()
    engine.update(_snap(confluence_score=50))
    events = engine.update(_snap(confluence_score=30, timestamp=1060))
    shift_events = [e for e in events if e.type == "confluence_shift"]
    assert len(shift_events) == 1
    assert shift_events[0].severity == "warning"
    assert shift_events[0].detail["delta"] == -20


# ── volume_spike ───────────────────────────────────────────────────────────────

def test_volume_spike_above_2sigma():
    # baseline ~1.0 with tiny variance, spike to 5.0
    ratios = [1.0, 1.0, 1.0, 1.0, 1.0, 5.0]
    engine = FeedEventEngine()
    engine.update(_snap(volume_ratios=[1.0] * 5))
    events = engine.update(_snap(timestamp=1060, volume_ratios=ratios))
    spike_events = [e for e in events if e.type == "volume_spike"]
    assert len(spike_events) == 1
    assert spike_events[0].detail["rvol"] == 5.0


def test_volume_spike_not_triggered_below_2sigma():
    ratios = [1.0, 1.0, 1.0, 1.0, 1.1]  # last value not a spike
    engine = FeedEventEngine()
    engine.update(_snap(volume_ratios=[1.0] * 5))
    events = engine.update(_snap(timestamp=1060, volume_ratios=ratios))
    spike_events = [e for e in events if e.type == "volume_spike"]
    assert spike_events == []


def test_volume_spike_needs_at_least_5_ratios():
    engine = FeedEventEngine()
    engine.update(_snap(volume_ratios=[1.0] * 5))
    events = engine.update(_snap(timestamp=1060, volume_ratios=[5.0, 5.0]))
    spike_events = [e for e in events if e.type == "volume_spike"]
    assert spike_events == []


# ── pattern_trigger ────────────────────────────────────────────────────────────

def test_new_pattern_emits_event():
    engine = FeedEventEngine()
    engine.update(_snap(patterns=["Bull Flag"]))
    events = engine.update(_snap(timestamp=1060, patterns=["Bull Flag", "Opening Fake"]))
    pattern_events = [e for e in events if e.type == "pattern_trigger"]
    assert len(pattern_events) == 1
    assert "Opening Fake" in pattern_events[0].message


def test_existing_pattern_no_event():
    engine = FeedEventEngine()
    engine.update(_snap(patterns=["Bull Flag"]))
    events = engine.update(_snap(timestamp=1060, patterns=["Bull Flag"]))
    pattern_events = [e for e in events if e.type == "pattern_trigger"]
    assert pattern_events == []


# ── deduplication ──────────────────────────────────────────────────────────────

def test_deduplication_same_30s_bucket():
    engine = FeedEventEngine()
    engine.update(_snap(session="ny_open", timestamp=1000))
    # Both updates fall in the same 30-second bucket (1060 // 30 == 35)
    engine.update(_snap(session="midday", timestamp=1060))
    events2 = engine.update(_snap(session="power_hour", timestamp=1065))
    # midday→power_hour is in the same bucket as ny_open→midday (1065//30 == 35)
    session_events = [e for e in events2 if e.type == "session_change"]
    # Because 1065 // 30 == 35 same bucket as 1060, dedup suppresses it
    assert session_events == []


# ── get_events_since ───────────────────────────────────────────────────────────

def test_get_events_since_filters_by_timestamp():
    engine = FeedEventEngine()
    engine.update(_snap(session="ny_open", timestamp=1000))
    engine.update(_snap(session="midday", timestamp=1060))
    engine.update(_snap(session="power_hour", timestamp=2000))

    all_events = engine.get_events_since(0)
    assert len(all_events) >= 2

    recent = engine.get_events_since(1500)
    assert all(e.timestamp >= 1500 for e in recent)


def test_events_returned_newest_first():
    engine = FeedEventEngine()
    engine.update(_snap(session="ny_open", timestamp=1000))
    engine.update(_snap(session="midday", timestamp=5000))
    events = engine.get_events_since(0)
    timestamps = [e.timestamp for e in events]
    assert timestamps == sorted(timestamps, reverse=True)


# ── FeedEvent.to_dict ──────────────────────────────────────────────────────────

def test_feed_event_to_dict_contains_required_fields():
    evt = FeedEvent(
        type="session_change",
        timestamp=1700000000,
        message="Test event",
        severity="info",
        source="test",
        detail={"key": "value"},
    )
    d = evt.to_dict()
    assert d["type"] == "session_change"
    assert d["timestamp"] == 1700000000
    assert "time" in d
    assert d["message"] == "Test event"
    assert d["severity"] == "info"
    assert d["key"] == "value"


# ── reset ──────────────────────────────────────────────────────────────────────

def test_reset_clears_state():
    engine = FeedEventEngine()
    engine.update(_snap(session="ny_open"))
    engine.update(_snap(session="midday", timestamp=1060))
    engine.reset()
    assert engine.get_events_since(0) == []
    # After reset, first update should not produce events (no previous state)
    events = engine.update(_snap(session="ny_open", timestamp=2000))
    assert events == []

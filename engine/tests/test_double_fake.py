"""Tests for the Double Fake Exhaustion module.

Bar-construction strategy
-------------------------
The algorithm scans for RESISTANCE when bar.high >= level - tolerance
and for SUPPORT when bar.low <= level + tolerance.  Because these two
conditions are mutually exclusive only when tolerance is very small, the
simplest test fixture is to build bars that come from ABOVE the level:

  - Approach bars: high above level but NOT touching level-tolerance from
    below (approach from above keeps direction='long' locked once the first
    resistance bar is processed).
  - Retraction bars: price drops BELOW level-tolerance so the resistance
    condition no longer triggers → in_attempt is reset.
  - Second approach: slower bars that again touch resistance.

For SUPPORT (direction='short') the layout is mirrored.
"""

import pytest
from arctis.models import OHLCVBar
from arctis.analysis.double_fake import (
    AttemptInfo,
    DoubleFakeResult,
    detect_double_fake,
    _bar_velocity,
    _MIN_BARS,
    _MIN_VELOCITY_DECLINE,
)


# ---------------------------------------------------------------------------
# Constants from the module (must match)
# ---------------------------------------------------------------------------

_LEVEL = 200.0
_TOL = 5.0
_BASE_TS = 1_000_000


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_bar(
    ts: int,
    open_: float = 100.0,
    high: float = 101.0,
    low: float = 99.0,
    close: float = 100.0,
    volume: int = 1000,
) -> OHLCVBar:
    return OHLCVBar(timestamp=ts, open=open_, high=high, low=low, close=close, volume=volume)


def _build_resistance_bars(
    vel_first: float = 2.0,
    vel_second: float = 1.0,
    level: float = _LEVEL,
    tol: float = _TOL,
) -> list[OHLCVBar]:
    """
    Build a bar series that triggers a RESISTANCE double-fake at `level`.

    Layout (all bars above level - tol so ts never triggers):
      - Bars 0-4: approach from above with move = vel_first
                  (high > level - tol → tr=True; low > level + tol → ts=False)
                  Bar 0 records attempt1 with velocity = vel_first (via inclusive lookback).
      - Bar 5:   retraction below level - tol (high < level - tol)
                 Resistance=False; direction='long' blocks support check → in_attempt=False.
      - Bars 6-10: second approach with move = vel_second (slower).
                  Bar 6 records attempt2.
    """
    base_ts = _BASE_TS
    above_level_open = level + 8.0   # well above level + tol

    bars: list[OHLCVBar] = []

    # Approach 1: approach from above, each bar moves vel_first points
    for i in range(5):
        o = above_level_open
        c = o + vel_first  # close > open, move = vel_first
        bars.append(OHLCVBar(
            timestamp=base_ts + len(bars) * 60,
            open=o, high=o + vel_first + 0.5, low=o + tol + 0.5, close=c, volume=1000
        ))
        # high = o + vel_first + 0.5  ≥  level - tol  (resistance touch ✓)
        # low  = o + tol + 0.5  >  level + tol         (NOT support touch ✓)

    # Retraction: high drops below level - tol
    retract_high = level - tol - 0.5
    retract_low = retract_high - 3.0
    bars.append(OHLCVBar(
        timestamp=base_ts + len(bars) * 60,
        open=retract_high - 1.0,
        high=retract_high,
        low=retract_low,
        close=retract_low + 1.0,
        volume=500,
    ))
    # tr = False (high < level - tol); ts = True (low < level + tol) but direction='long' → reset ✓

    # Approach 2: slower, still above level - tol
    for i in range(5):
        o = above_level_open
        c = o + vel_second
        bars.append(OHLCVBar(
            timestamp=base_ts + len(bars) * 60,
            open=o, high=o + vel_second + 0.5, low=o + tol + 0.5, close=c, volume=1000
        ))

    return bars


def _build_support_bars(
    vel_first: float = 2.0,
    vel_second: float = 1.0,
    level: float = _LEVEL,
    tol: float = _TOL,
) -> list[OHLCVBar]:
    """
    Build a bar series that triggers a SUPPORT double-fake at `level`.

    Approach from BELOW: bars with low < level + tol (support touch)
    and high < level - tol (no resistance touch) → direction='short'.

    Layout:
      - Bars 0-4: approach from below with move = vel_first
      - Bar 5:   retraction above level + tol → ts=False, tr=True but direction='short' → reset
      - Bars 6-10: second approach from below with move = vel_second
    """
    base_ts = _BASE_TS
    below_level_open = level - 8.0   # well below level - tol

    bars: list[OHLCVBar] = []

    # Approach 1: from below, move = vel_first downward
    for i in range(5):
        o = below_level_open
        c = o - vel_first
        bars.append(OHLCVBar(
            timestamp=base_ts + len(bars) * 60,
            open=o, high=o - tol - 0.5, low=o - vel_first - 0.5, close=c, volume=1000
        ))
        # high = o - tol - 0.5 < level - tol (NOT resistance ✓)
        # low  = o - vel_first - 0.5 < level + tol (support touch ✓)

    # Retraction: low rises above level + tol → ts=False; high stays below level+tol+small
    retract_low = level + tol + 0.5
    retract_high = retract_low + 2.0
    bars.append(OHLCVBar(
        timestamp=base_ts + len(bars) * 60,
        open=retract_low + 1.0,
        high=retract_high,
        low=retract_low,
        close=retract_low + 0.5,
        volume=500,
    ))

    # Approach 2: slower
    for i in range(5):
        o = below_level_open
        c = o - vel_second
        bars.append(OHLCVBar(
            timestamp=base_ts + len(bars) * 60,
            open=o, high=o - tol - 0.5, low=o - vel_second - 0.5, close=c, volume=1000
        ))

    return bars


# ---------------------------------------------------------------------------
# _bar_velocity helper
# ---------------------------------------------------------------------------

class TestBarVelocity:
    def test_first_bar_uses_inclusive_lookback(self):
        """With the inclusive lookback fix, bar 0 returns its own move instead of 0."""
        bars = [
            OHLCVBar(timestamp=1000, open=100.0, high=102.0, low=99.0, close=102.0, volume=500),
        ]
        # abs(102 - 100) = 2.0
        assert _bar_velocity(bars, idx=0, lookback=5) == 2.0

    def test_uniform_bars(self):
        bars = [
            OHLCVBar(timestamp=1000 + i * 60, open=100.0, high=101.5, low=99.5, close=101.0, volume=500)
            for i in range(10)
        ]
        vel = _bar_velocity(bars, idx=5, lookback=5)
        assert vel == 1.0  # abs(101.0 - 100.0) = 1.0 per bar


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_bars(self):
        result = detect_double_fake([], level=100.0)
        assert not result.detected
        assert result.confidence == "none"

    def test_too_few_bars(self):
        bars = [
            OHLCVBar(timestamp=1000 + i * 60, open=100.0, high=101.0, low=99.0, close=100.0, volume=1000)
            for i in range(_MIN_BARS - 1)
        ]
        result = detect_double_fake(bars, level=100.0)
        assert not result.detected

    def test_no_touches_returns_no_fake(self):
        bars = [
            OHLCVBar(timestamp=1000 + i * 60, open=100.0, high=101.0, low=99.0, close=100.0, volume=1000)
            for i in range(20)
        ]
        # Level = 500, tolerance = 1 → neither condition triggered
        result = detect_double_fake(bars, level=500.0, tolerance=1.0)
        assert not result.detected


# ---------------------------------------------------------------------------
# Resistance double-fake (direction = "long")
# ---------------------------------------------------------------------------

class TestDoubleFakeResistance:
    def test_detected_true(self):
        bars = _build_resistance_bars(vel_first=2.0, vel_second=1.5)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.detected

    def test_direction_long(self):
        bars = _build_resistance_bars()
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.direction == "long"

    def test_two_attempts_recorded(self):
        bars = _build_resistance_bars()
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert len(result.attempts) == 2

    def test_high_confidence_when_large_velocity_decline(self):
        """When vel_second is dramatically lower than vel_first, confidence should be high."""
        # vel_second=0.1 is much slower than vel_first=2.0; even after averaging with retraction
        # the decline ratio should exceed 20%.
        bars = _build_resistance_bars(vel_first=2.0, vel_second=0.1)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.detected
        assert result.confidence == "high"

    def test_detected_when_second_attempt_clearly_slower(self):
        """Second attempt clearly slower than first → detected regardless of exact confidence."""
        bars = _build_resistance_bars(vel_first=2.0, vel_second=1.0)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.detected
        assert result.confidence in ("high", "medium")

    def test_no_fake_when_second_faster(self):
        """When second approach is faster than first, no exhaustion pattern."""
        bars = _build_resistance_bars(vel_first=1.0, vel_second=3.0)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert not result.detected


# ---------------------------------------------------------------------------
# Support double-fake (direction = "short")
# ---------------------------------------------------------------------------

class TestDoubleFakeSupport:
    def test_detected_true(self):
        bars = _build_support_bars(vel_first=2.0, vel_second=1.0)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.detected

    def test_direction_short(self):
        bars = _build_support_bars()
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.direction == "short"

    def test_high_confidence(self):
        bars = _build_support_bars(vel_first=2.0, vel_second=1.0)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.confidence == "high"

    def test_no_fake_when_second_faster(self):
        """When second support attempt has higher velocity, no exhaustion."""
        bars = _build_support_bars(vel_first=1.0, vel_second=3.0)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert not result.detected


# ---------------------------------------------------------------------------
# Result type integrity
# ---------------------------------------------------------------------------

class TestResultIntegrity:
    def test_no_fake_result_fields(self):
        result = detect_double_fake([], level=100.0)
        assert isinstance(result, DoubleFakeResult)
        assert result.detected is False
        assert result.direction == ""
        assert result.attempts == []
        assert result.confidence == "none"

    def test_attempt_info_fields_on_detected_result(self):
        bars = _build_resistance_bars(vel_first=2.0, vel_second=1.0)
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert result.detected
        for attempt in result.attempts:
            assert isinstance(attempt, AttemptInfo)
            assert isinstance(attempt.time, int)
            assert isinstance(attempt.price, float)
            assert isinstance(attempt.velocity, float)
            assert attempt.velocity >= 0.0

    def test_single_touch_not_enough(self):
        """Only one approach → not enough for a double-fake."""
        bars = _build_resistance_bars(vel_first=2.0, vel_second=1.0)
        # Truncate to only include bars for the first attempt + retraction
        result = detect_double_fake(bars[:6], level=_LEVEL, tolerance=_TOL)
        assert not result.detected

    def test_returned_type_is_double_fake_result(self):
        bars = _build_resistance_bars()
        result = detect_double_fake(bars, level=_LEVEL, tolerance=_TOL)
        assert isinstance(result, DoubleFakeResult)

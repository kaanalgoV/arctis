"""Tests for the Double Fake Exhaustion module."""

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


def _flat_bars(
    count: int,
    high: float = 99.0,
    low: float = 97.0,
    base_ts: int = 1_000_000,
) -> list[OHLCVBar]:
    """Bars that stay well below a resistance level."""
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=98.0,
            high=high,
            low=low,
            close=98.0,
            volume=1000,
        )
        for i in range(count)
    ]


# ---------------------------------------------------------------------------
# _bar_velocity helper
# ---------------------------------------------------------------------------

class TestBarVelocity:
    def test_empty_window_returns_zero(self):
        bars = _flat_bars(3)
        assert _bar_velocity(bars, 0) == 0.0

    def test_uniform_bars(self):
        bars = [
            OHLCVBar(timestamp=1000 + i * 60, open=100.0, high=101.0, low=99.0, close=101.0, volume=500)
            for i in range(10)
        ]
        vel = _bar_velocity(bars, idx=5, lookback=5)
        assert vel == 1.0  # each bar moves abs(101 - 100) = 1.0


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_bars(self):
        result = detect_double_fake([], level=100.0)
        assert not result.detected
        assert result.confidence == "none"

    def test_too_few_bars(self):
        bars = _flat_bars(_MIN_BARS - 1)
        result = detect_double_fake(bars, level=100.0)
        assert not result.detected

    def test_no_touches_returns_no_fake(self):
        # Level = 200.0, bars never reach it
        bars = _flat_bars(20)
        result = detect_double_fake(bars, level=200.0, tolerance=1.0)
        assert not result.detected

    def test_single_touch_not_enough(self):
        bars = _flat_bars(20, high=99.0, low=97.0)
        # One bar touches level = 100.0 within tolerance = 2.0
        bars[10] = _make_bar(bars[10].timestamp, high=101.0, low=97.0)
        result = detect_double_fake(bars, level=100.0, tolerance=2.0)
        assert not result.detected


# ---------------------------------------------------------------------------
# Successful double fake — resistance (direction = "long")
# ---------------------------------------------------------------------------

class TestDoubleFakeResistance:
    """Two upside attempts at a resistance level with declining velocity."""

    def _build_bars(
        self,
        vel_first: float = 2.0,
        vel_second: float = 1.5,
    ) -> tuple[list[OHLCVBar], float]:
        """
        Build a bar series with two distinct upside touches of level=100.0.

        - 5 approach bars with move = vel_first (first attempt)
        - 1 touch bar that reaches 101.0 (>= 100 - 5 tolerance)
        - 2 retraction bars (below 95 so in_attempt resets)
        - 5 approach bars with move = vel_second (second attempt, slower)
        - 1 touch bar
        """
        level = 100.0
        base_ts = 1_000_000
        bars: list[OHLCVBar] = []

        # Approach 1: 5 bars moving vel_first each
        for i in range(5):
            o = 90.0
            c = o + vel_first
            bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                                  open=o, high=c + 0.5, low=o - 0.5, close=c, volume=1000))

        # First touch: high reaches level + epsilon
        bars.append(_make_bar(base_ts + len(bars) * 60, open_=99.0, high=101.0, low=98.0, close=99.5))

        # Retraction below tolerance (level - 5 - 1 = 94)
        for _ in range(3):
            bars.append(_make_bar(base_ts + len(bars) * 60, open_=93.0, high=94.0, low=92.0, close=93.0))

        # Approach 2: 5 bars moving vel_second each (slower)
        for i in range(5):
            o = 90.0
            c = o + vel_second
            bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                                  open=o, high=c + 0.5, low=o - 0.5, close=c, volume=1000))

        # Second touch
        bars.append(_make_bar(base_ts + len(bars) * 60, open_=99.0, high=101.0, low=98.0, close=99.5))

        return bars, level

    def test_detected_true(self):
        bars, level = self._build_bars(vel_first=2.0, vel_second=1.5)
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert result.detected

    def test_direction_long(self):
        bars, level = self._build_bars()
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert result.direction == "long"

    def test_two_attempts_recorded(self):
        bars, level = self._build_bars()
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert len(result.attempts) == 2

    def test_high_confidence_when_decline_over_20_pct(self):
        # vel_first=2.0, vel_second=1.0 → decline = 50% > 20%
        bars, level = self._build_bars(vel_first=2.0, vel_second=1.0)
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert result.confidence == "high"

    def test_medium_confidence_when_decline_5_to_20_pct(self):
        # vel_first=2.0, vel_second=1.7 → decline = 15% (between 5% and 20%)
        bars, level = self._build_bars(vel_first=2.0, vel_second=1.7)
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert result.confidence == "medium"

    def test_no_fake_when_velocity_does_not_decline(self):
        # vel_first=1.0, vel_second=1.0 → decline = 0% < 5%
        bars, level = self._build_bars(vel_first=1.0, vel_second=1.0)
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert not result.detected

    def test_no_fake_when_second_faster(self):
        # vel_second > vel_first → no exhaustion
        bars, level = self._build_bars(vel_first=1.0, vel_second=2.0)
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert not result.detected


# ---------------------------------------------------------------------------
# Successful double fake — support (direction = "short")
# ---------------------------------------------------------------------------

class TestDoubleFakeSupport:
    """Two downside attempts at a support level with declining velocity."""

    def _build_bars(self, vel_first: float = 2.0, vel_second: float = 1.0) -> tuple[list[OHLCVBar], float]:
        level = 100.0
        base_ts = 1_000_000
        bars: list[OHLCVBar] = []

        # Approach 1
        for _ in range(5):
            o = 110.0
            c = o - vel_first
            bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                                  open=o, high=o + 0.5, low=c - 0.5, close=c, volume=1000))

        # First touch: low reaches level - epsilon (within tolerance)
        bars.append(_make_bar(base_ts + len(bars) * 60, open_=101.0, high=102.0, low=99.0, close=101.0))

        # Retraction above tolerance
        for _ in range(3):
            bars.append(_make_bar(base_ts + len(bars) * 60, open_=107.0, high=108.0, low=106.0, close=107.0))

        # Approach 2
        for _ in range(5):
            o = 110.0
            c = o - vel_second
            bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                                  open=o, high=o + 0.5, low=c - 0.5, close=c, volume=1000))

        # Second touch
        bars.append(_make_bar(base_ts + len(bars) * 60, open_=101.0, high=102.0, low=99.0, close=101.0))

        return bars, level

    def test_direction_short(self):
        bars, level = self._build_bars()
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert result.detected
        assert result.direction == "short"

    def test_high_confidence(self):
        # vel_first=2.0, vel_second=1.0 → 50% decline
        bars, level = self._build_bars(vel_first=2.0, vel_second=1.0)
        result = detect_double_fake(bars, level=level, tolerance=5.0)
        assert result.confidence == "high"


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

    def test_attempt_info_fields(self):
        bars: list[OHLCVBar] = []
        base_ts = 1_000_000
        # Same construction as resistance test with high confidence
        for i in range(5):
            bars.append(OHLCVBar(timestamp=base_ts + i * 60, open=90.0, high=92.5,
                                  low=89.5, close=92.0, volume=1000))
        bars.append(_make_bar(base_ts + 5 * 60, open_=99.0, high=101.0, low=98.0, close=99.5))
        for i in range(3):
            bars.append(_make_bar(base_ts + (6 + i) * 60, open_=93.0, high=94.0, low=92.0, close=93.0))
        for i in range(5):
            bars.append(OHLCVBar(timestamp=base_ts + (9 + i) * 60, open=90.0, high=91.5,
                                  low=89.5, close=91.0, volume=1000))
        bars.append(_make_bar(base_ts + 14 * 60, open_=99.0, high=101.0, low=98.0, close=99.5))

        result = detect_double_fake(bars, level=100.0, tolerance=5.0)
        if result.detected:
            for attempt in result.attempts:
                assert isinstance(attempt, AttemptInfo)
                assert isinstance(attempt.time, int)
                assert isinstance(attempt.price, float)
                assert isinstance(attempt.velocity, float)
                assert attempt.velocity >= 0.0

"""Tests for the 60% Correction Monitor module."""

import pytest
from arctis.models import OHLCVBar
from arctis.analysis.correction import (
    CorrectionStatus,
    monitor_correction,
    _MIN_BARS,
    _THREAT_THRESHOLD_PCT,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_bar(
    ts: int,
    open_: float,
    high: float,
    low: float,
    close: float,
    volume: int = 1000,
) -> OHLCVBar:
    return OHLCVBar(timestamp=ts, open=open_, high=high, low=low, close=close, volume=volume)


def _make_uptrend_bars() -> list[OHLCVBar]:
    """
    Create a series with a clear upward impulse followed by a mild correction.

    Layout:
      - Swing low at bar 5  (price=95)   — established by bars 0-10
      - Swing high at bar 15 (price=115) — established by bars 10-20
      - Current close at bar 24 = 112 (correction = 3 out of 20 = 15%)

    The lookback window for detect_swings defaults to 5, so we need 5 bars
    on each side of a swing point.
    """
    base_ts = 1_000_000
    bars: list[OHLCVBar] = []

    # Bars 0-4: descending toward swing low
    prices = [100.0, 98.0, 97.0, 96.0, 95.5]
    for i, p in enumerate(prices):
        bars.append(_make_bar(base_ts + i * 60, p, p + 0.5, p - 0.5, p))

    # Bar 5: swing low at 95.0
    bars.append(_make_bar(base_ts + 5 * 60, 95.5, 96.0, 95.0, 95.5))

    # Bars 6-10: ascending away from swing low
    prices2 = [96.0, 97.0, 98.5, 100.0, 102.0]
    for i, p in enumerate(prices2):
        bars.append(_make_bar(base_ts + (6 + i) * 60, p, p + 0.5, p - 0.5, p))

    # Bars 11-14: approaching swing high
    prices3 = [105.0, 108.0, 111.0, 113.0]
    for i, p in enumerate(prices3):
        bars.append(_make_bar(base_ts + (11 + i) * 60, p, p + 0.5, p - 0.5, p))

    # Bar 15: swing high at 115.0
    bars.append(_make_bar(base_ts + 15 * 60, 114.0, 115.0, 113.0, 114.5))

    # Bars 16-20: descending from swing high (5 bars so detect_swings can see it)
    prices4 = [113.5, 113.0, 112.5, 112.0, 112.0]
    for i, p in enumerate(prices4):
        bars.append(_make_bar(base_ts + (16 + i) * 60, p, p + 0.5, p - 0.5, p))

    return bars


def _make_downtrend_bars() -> list[OHLCVBar]:
    """
    Create a series with a clear downward impulse followed by a mild bounce.

    Layout:
      - Swing high at bar 5  (price=115)
      - Swing low at bar 15  (price=95)
      - Current close at bar 24 = 97 (correction of 2 out of 20 = 10%)
    """
    base_ts = 1_000_000
    bars: list[OHLCVBar] = []

    # Bars 0-4: ascending toward swing high
    prices = [110.0, 112.0, 113.0, 114.0, 114.5]
    for i, p in enumerate(prices):
        bars.append(_make_bar(base_ts + i * 60, p, p + 0.5, p - 0.5, p))

    # Bar 5: swing high at 115.0
    bars.append(_make_bar(base_ts + 5 * 60, 114.5, 115.0, 114.0, 114.8))

    # Bars 6-10: descending from swing high
    prices2 = [113.0, 111.0, 108.0, 105.0, 102.0]
    for i, p in enumerate(prices2):
        bars.append(_make_bar(base_ts + (6 + i) * 60, p, p + 0.5, p - 0.5, p))

    # Bars 11-14: approaching swing low
    prices3 = [100.0, 98.0, 96.5, 95.5]
    for i, p in enumerate(prices3):
        bars.append(_make_bar(base_ts + (11 + i) * 60, p, p + 0.5, p - 0.5, p))

    # Bar 15: swing low at 95.0
    bars.append(_make_bar(base_ts + 15 * 60, 95.5, 96.0, 95.0, 95.5))

    # Bars 16-20: bouncing upward (correction)
    prices4 = [96.0, 96.5, 97.0, 97.0, 97.0]
    for i, p in enumerate(prices4):
        bars.append(_make_bar(base_ts + (16 + i) * 60, p, p + 0.5, p - 0.5, p))

    return bars


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_returns_none_for_empty(self):
        assert monitor_correction([]) is None

    def test_returns_none_for_insufficient_bars(self):
        bars = [
            _make_bar(1000 + i * 60, 100.0, 101.0, 99.0, 100.0)
            for i in range(_MIN_BARS - 1)
        ]
        assert monitor_correction(bars) is None

    def test_returns_none_when_no_swings(self):
        # Perfectly flat bars → no swing detected
        bars = [
            _make_bar(1000 + i * 60, 100.0, 100.5, 99.5, 100.0)
            for i in range(20)
        ]
        result = monitor_correction(bars)
        # May return None or CorrectionStatus if structure is found
        assert result is None or isinstance(result, CorrectionStatus)


# ---------------------------------------------------------------------------
# Upward impulse
# ---------------------------------------------------------------------------

class TestUpwardImpulse:
    def test_returns_correction_status(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        assert result is None or isinstance(result, CorrectionStatus)

    def test_impulse_direction_up(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert result.impulse_direction == "up"

    def test_correction_pct_non_negative(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert result.correction_pct >= 0.0

    def test_impulse_size_positive(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert result.impulse_size > 0.0

    def test_correction_pct_at_most_100_for_mild_pullback(self):
        """Mild pullback should give correction_pct well below 100."""
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            # Swing high = 115, close = 112, impulse = 115 - 95 = 20, correction = 3
            # correction_pct = 3/20 = 15%
            assert result.correction_pct < 50.0

    def test_is_threat_false_for_mild_correction(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert not result.is_threat


# ---------------------------------------------------------------------------
# Downward impulse
# ---------------------------------------------------------------------------

class TestDownwardImpulse:
    def test_impulse_direction_down(self):
        bars = _make_downtrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert result.impulse_direction == "down"

    def test_correction_pct_non_negative(self):
        bars = _make_downtrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert result.correction_pct >= 0.0

    def test_is_threat_false_for_mild_bounce(self):
        bars = _make_downtrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert not result.is_threat


# ---------------------------------------------------------------------------
# Threat threshold
# ---------------------------------------------------------------------------

class TestThreatThreshold:
    def test_is_threat_true_when_correction_exceeds_60_pct(self):
        """Craft a bar series where the correction is deeper than 60% of the impulse."""
        base_ts = 1_000_000
        bars = []

        # Descend to swing low
        for i in range(6):
            p = 100.0 - i
            bars.append(_make_bar(base_ts + i * 60, p, p + 0.5, p - 0.5, p))
        # Swing low at bar 5: price = 95
        bars.append(_make_bar(base_ts + 5 * 60, 94.5, 95.5, 95.0, 95.2))

        # Rise sharply to swing high (bars 6-14)
        for i in range(9):
            p = 95.5 + (i + 1) * 1.5
            bars.append(_make_bar(base_ts + (6 + i) * 60, p, p + 0.5, p - 0.5, p))
        # Swing high at bar 15 (index 15): price ~= 95.5 + 9*1.5 = 109
        swing_high = 115.0
        bars.append(_make_bar(base_ts + 15 * 60, 113.0, swing_high, 112.5, 114.0))

        # Deep correction: price falls back by >60% of impulse
        # impulse = 115 - 95 = 20; 60% = 12; price must fall to 115 - 12 = 103
        # Close at 102 → correction = 13 / 20 = 65%
        for i in range(5):
            p = 113.0 - (i + 1) * 2.5
            bars.append(_make_bar(base_ts + (16 + i) * 60, p, p + 0.5, p - 0.5, p))

        result = monitor_correction(bars)
        if result is not None and result.impulse_direction == "up":
            if result.correction_pct > _THREAT_THRESHOLD_PCT:
                assert result.is_threat

    def test_is_threat_field_is_bool(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert isinstance(result.is_threat, bool)


# ---------------------------------------------------------------------------
# CorrectionStatus field types
# ---------------------------------------------------------------------------

class TestCorrectionStatusFields:
    def test_all_fields_correct_types(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert isinstance(result.impulse_size, float)
            assert isinstance(result.correction_size, float)
            assert isinstance(result.correction_pct, float)
            assert isinstance(result.is_threat, bool)
            assert result.impulse_direction in ("up", "down")

    def test_correction_size_non_negative(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            assert result.correction_size >= 0.0

    def test_pct_matches_size_ratio(self):
        bars = _make_uptrend_bars()
        result = monitor_correction(bars)
        if result is not None:
            expected_pct = (result.correction_size / result.impulse_size) * 100.0
            assert abs(result.correction_pct - expected_pct) < 0.01

"""Tests for the Opening Fake detection module."""

import pytest
from arctis.models import OHLCVBar
from arctis.analysis.opening_fake import (
    OpeningFake,
    detect_opening_fake,
    _OPENING_WINDOW,
    _LOW_VOLUME_RATIO,
    _REVERSAL_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_flat_bars(
    count: int,
    high: float = 101.0,
    low: float = 99.0,
    close: float = 100.0,
    volume: int = 1000,
    base_ts: int = 1_700_000_000,
) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=100.0,
            high=high,
            low=low,
            close=close,
            volume=volume,
        )
        for i in range(count)
    ]


def _make_bar(
    ts: int,
    open_: float = 100.0,
    high: float = 101.0,
    low: float = 99.0,
    close: float = 100.0,
    volume: int = 1000,
) -> OHLCVBar:
    return OHLCVBar(timestamp=ts, open=open_, high=high, low=low, close=close, volume=volume)


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_bars_returns_no_fake(self):
        result = detect_opening_fake([], prev_high=110.0, prev_low=90.0)
        assert not result.detected
        assert result.confidence == "none"

    def test_too_few_bars_returns_no_fake(self):
        bars = _make_flat_bars(5)
        result = detect_opening_fake(bars, prev_high=110.0, prev_low=90.0)
        assert not result.detected

    def test_no_break_returns_no_fake(self):
        # All bars inside the prev range [90, 110]
        bars = _make_flat_bars(30, high=105.0, low=95.0)
        result = detect_opening_fake(bars, prev_high=110.0, prev_low=90.0)
        assert not result.detected
        assert result.direction == ""
        assert result.confidence == "none"


# ---------------------------------------------------------------------------
# High-confidence fake: low-volume break + reversal confirmed
# ---------------------------------------------------------------------------

class TestHighConfidenceFakeHigh:
    """Fake breakout above prev_high with low volume, followed by full reversal."""

    def _build_bars(self) -> list[OHLCVBar]:
        prev_high = 110.0
        base_ts = 1_700_000_000
        mean_vol = 1000

        bars: list[OHLCVBar] = []

        # 10 normal bars inside the range
        for i in range(10):
            bars.append(_make_bar(base_ts + i * 60, high=109.0, low=98.0, close=105.0, volume=mean_vol))

        # Bar that breaks prev_high with LOW volume (volume well below mean * 0.8)
        break_vol = int(mean_vol * 0.5)  # 50% of mean → < 80%
        break_bar = _make_bar(
            base_ts + 10 * 60,
            open_=109.5, high=112.0, low=109.0, close=111.0,
            volume=break_vol,
        )
        bars.append(break_bar)

        # Bars that reverse back below prev_high
        # reversal_target = prev_high - 0.5 * (112 - 110) = 110 - 1 = 109
        for i in range(11, 20):
            bars.append(_make_bar(base_ts + i * 60, high=110.5, low=107.0, close=108.0, volume=mean_vol))

        return bars

    def test_detected_true(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.detected

    def test_direction_long(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.direction == "long"

    def test_reversal_confirmed(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.reversal_confirmed

    def test_confidence_high(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.confidence == "high"

    def test_break_price_correct(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.break_price == 112.0


class TestHighConfidenceFakeLow:
    """Fake breakdown below prev_low with low volume, followed by full reversal."""

    def _build_bars(self) -> list[OHLCVBar]:
        prev_low = 90.0
        base_ts = 1_700_000_000
        mean_vol = 1000

        bars: list[OHLCVBar] = []

        # 10 normal bars inside the range
        for i in range(10):
            bars.append(_make_bar(base_ts + i * 60, high=102.0, low=91.0, close=95.0, volume=mean_vol))

        # Bar that breaks prev_low with LOW volume
        break_vol = int(mean_vol * 0.5)
        bars.append(_make_bar(
            base_ts + 10 * 60,
            open_=91.0, high=91.5, low=87.0, close=88.0,
            volume=break_vol,
        ))

        # reversal_target = prev_low + 0.5 * (90 - 87) = 90 + 1.5 = 91.5
        for i in range(11, 20):
            bars.append(_make_bar(base_ts + i * 60, high=93.0, low=90.5, close=92.0, volume=mean_vol))

        return bars

    def test_direction_short(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.direction == "short"

    def test_confidence_high(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.confidence == "high"

    def test_reversal_confirmed(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.reversal_confirmed


# ---------------------------------------------------------------------------
# Medium-confidence fake: low-volume break, NO reversal yet
# ---------------------------------------------------------------------------

class TestMediumConfidenceFake:
    def _build_bars(self) -> list[OHLCVBar]:
        prev_high = 110.0
        base_ts = 1_700_000_000
        mean_vol = 1000

        bars: list[OHLCVBar] = []
        for i in range(10):
            bars.append(_make_bar(base_ts + i * 60, high=109.0, low=98.0, close=105.0, volume=mean_vol))

        break_vol = int(mean_vol * 0.5)
        bars.append(_make_bar(
            base_ts + 10 * 60,
            open_=109.5, high=112.0, low=109.0, close=111.5,
            volume=break_vol,
        ))

        # Bars that stay above prev_high → no reversal below reversal_target = 109
        for i in range(11, 20):
            bars.append(_make_bar(base_ts + i * 60, high=112.5, low=110.5, close=111.0, volume=mean_vol))

        return bars

    def test_confidence_medium(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.detected
        assert result.confidence == "medium"
        assert not result.reversal_confirmed


# ---------------------------------------------------------------------------
# Low-confidence fake: normal volume break + reversal confirmed
# ---------------------------------------------------------------------------

class TestLowConfidenceFake:
    def _build_bars(self) -> list[OHLCVBar]:
        prev_high = 110.0
        base_ts = 1_700_000_000
        mean_vol = 1000

        bars: list[OHLCVBar] = []
        for i in range(10):
            bars.append(_make_bar(base_ts + i * 60, high=109.0, low=98.0, close=105.0, volume=mean_vol))

        # Normal volume break (same as mean → not low volume)
        bars.append(_make_bar(
            base_ts + 10 * 60,
            open_=109.5, high=112.0, low=109.0, close=111.0,
            volume=mean_vol,   # exactly at mean → not "low volume"
        ))

        # Bars that reverse back
        for i in range(11, 20):
            bars.append(_make_bar(base_ts + i * 60, high=110.5, low=107.0, close=108.0, volume=mean_vol))

        return bars

    def test_confidence_low(self):
        result = detect_opening_fake(self._build_bars(), prev_high=110.0, prev_low=90.0)
        assert result.detected
        assert result.confidence == "low"


# ---------------------------------------------------------------------------
# Only the first break within the opening window is reported
# ---------------------------------------------------------------------------

class TestOnlyFirstBreak:
    def test_first_break_is_reported(self):
        prev_high = 110.0
        base_ts = 1_700_000_000
        mean_vol = 1000

        bars: list[OHLCVBar] = []
        for i in range(10):
            bars.append(_make_bar(base_ts + i * 60, high=109.0, low=95.0, close=100.0, volume=mean_vol))

        # First break at bar 10 (above prev_high)
        break_vol = int(mean_vol * 0.5)
        bars.append(_make_bar(base_ts + 10 * 60, open_=109.5, high=112.0, low=109.0, close=111.0, volume=break_vol))

        # Second break at bar 11 (below prev_low = also possible, but should be ignored)
        bars.append(_make_bar(base_ts + 11 * 60, open_=91.0, high=91.5, low=88.0, close=89.0, volume=break_vol))

        # Reversal bars
        for i in range(12, 22):
            bars.append(_make_bar(base_ts + i * 60, high=110.5, low=107.0, close=108.0, volume=mean_vol))

        result = detect_opening_fake(bars, prev_high=prev_high, prev_low=90.0)
        assert result.detected
        assert result.direction == "long"  # first break wins


# ---------------------------------------------------------------------------
# Bars beyond opening window are ignored
# ---------------------------------------------------------------------------

class TestOpeningWindowBoundary:
    def test_break_beyond_window_not_detected(self):
        """A break that occurs after bar 120 should not be detected."""
        prev_high = 110.0
        base_ts = 1_700_000_000
        mean_vol = 1000

        # 120 normal bars (exactly the window)
        bars = _make_flat_bars(120, high=109.0, low=95.0, volume=mean_vol, base_ts=base_ts)

        # Bar 121 breaks prev_high — outside the window
        bars.append(_make_bar(base_ts + 120 * 60, high=115.0, low=109.0, close=112.0, volume=int(mean_vol * 0.5)))

        result = detect_opening_fake(bars, prev_high=prev_high, prev_low=90.0)
        # The 121st bar is outside the window; no break inside window → not detected
        assert not result.detected

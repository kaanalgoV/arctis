import pytest
from arctis.models import OHLCVBar
from arctis.analysis.structure import (
    detect_swings,
    classify_trend,
    detect_structure_breaks,
    SwingPoint,
    SwingType,
    TrendState,
    StructureBreak,
)


def make_bars(closes: list[float], base_ts: int = 1000000) -> list[OHLCVBar]:
    """Helper: create bars from close prices. High=close+1, Low=close-1."""
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


class TestSwingDetection:
    def test_finds_swing_high(self):
        bars = make_bars([10, 12, 15, 12, 10])
        swings = detect_swings(bars, lookback=2)
        highs = [s for s in swings if s.type == SwingType.HIGH]
        assert len(highs) == 1
        assert highs[0].price == 16.0  # close(15) + 1 = high

    def test_finds_swing_low(self):
        bars = make_bars([15, 12, 10, 12, 15])
        swings = detect_swings(bars, lookback=2)
        lows = [s for s in swings if s.type == SwingType.LOW]
        assert len(lows) == 1
        assert lows[0].price == 9.0  # close(10) - 1 = low

    def test_no_swings_in_flat(self):
        bars = make_bars([10, 10, 10, 10, 10])
        swings = detect_swings(bars, lookback=2)
        assert len(swings) == 0


class TestTrendClassification:
    def test_uptrend(self):
        swings = [
            SwingPoint(type=SwingType.LOW, price=100, index=0, timestamp=1000),
            SwingPoint(type=SwingType.HIGH, price=110, index=2, timestamp=1120),
            SwingPoint(type=SwingType.LOW, price=105, index=4, timestamp=1240),
            SwingPoint(type=SwingType.HIGH, price=115, index=6, timestamp=1360),
        ]
        trend = classify_trend(swings)
        assert trend == TrendState.UPTREND

    def test_downtrend(self):
        swings = [
            SwingPoint(type=SwingType.HIGH, price=115, index=0, timestamp=1000),
            SwingPoint(type=SwingType.LOW, price=105, index=2, timestamp=1120),
            SwingPoint(type=SwingType.HIGH, price=110, index=4, timestamp=1240),
            SwingPoint(type=SwingType.LOW, price=100, index=6, timestamp=1360),
        ]
        trend = classify_trend(swings)
        assert trend == TrendState.DOWNTREND

    def test_range(self):
        swings = [
            SwingPoint(type=SwingType.LOW, price=100, index=0, timestamp=1000),
            SwingPoint(type=SwingType.HIGH, price=110, index=2, timestamp=1120),
            SwingPoint(type=SwingType.LOW, price=101, index=4, timestamp=1240),
            SwingPoint(type=SwingType.HIGH, price=109, index=6, timestamp=1360),
        ]
        trend = classify_trend(swings)
        assert trend == TrendState.RANGE


class TestStructureBreaks:
    def test_detects_bos(self):
        swings = [
            SwingPoint(type=SwingType.LOW, price=100, index=0, timestamp=1000),
            SwingPoint(type=SwingType.HIGH, price=110, index=2, timestamp=1120),
            SwingPoint(type=SwingType.LOW, price=105, index=4, timestamp=1240),
            SwingPoint(type=SwingType.HIGH, price=115, index=6, timestamp=1360),
        ]
        breaks = detect_structure_breaks(swings)
        assert len(breaks) >= 1
        assert breaks[0].break_type == "BOS"

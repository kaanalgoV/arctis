"""Tests for velocity analysis module."""

from arctis.analysis.velocity import calculate_velocity
from arctis.models import OHLCVBar


def _make_bars(prices: list[tuple[float, float]], base_ts: int = 1000000) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=o,
            high=max(o, c) + 1,
            low=min(o, c) - 1,
            close=c,
            volume=100,
        )
        for i, (o, c) in enumerate(prices)
    ]


def test_velocity_basic():
    # 25 bars: 20 slow (0.5 range) + 5 fast (5.0 range)
    slow = [(100.0, 100.5)] * 20
    fast = [(100.0, 105.0)] * 5
    bars = _make_bars(slow + fast)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 5

    # First fast bar: window is entirely slow (avg=0.5), ratio = 5.0/0.5 = 10.0
    assert result[0].ratio == 10.0
    assert result[0].scale == 10

    # Last fast bar: window contains 4 fast + 16 slow bars
    # avg = (16*0.5 + 4*5.0) / 20 = 28/20 = 1.4  →  ratio = 5.0/1.4 ≈ 3.57
    assert result[-1].ratio > 3.0
    assert result[-1].scale >= 9


def test_velocity_empty():
    assert calculate_velocity([], period=20) == []


def test_velocity_too_few_bars():
    bars = _make_bars([(100.0, 101.0)] * 10)
    assert calculate_velocity(bars, period=20) == []


def test_velocity_exact_period_boundary():
    # Exactly `period` bars — still too few (need period + 1 for first result)
    bars = _make_bars([(100.0, 101.0)] * 20)
    assert calculate_velocity(bars, period=20) == []


def test_velocity_period_plus_one():
    # period + 1 bars should yield exactly 1 result
    bars = _make_bars([(100.0, 101.0)] * 21)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 1


def test_velocity_uniform_bars():
    # All bars identical → ratio == 1.0, scale == 5
    bars = _make_bars([(100.0, 102.0)] * 25)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 5
    for point in result:
        assert point.ratio == 1.0
        assert point.scale == 5


def test_velocity_zero_movement():
    # Doji bars (open == close) → velocity == 0, ratio == 0, scale == 1
    bars = _make_bars([(100.0, 100.0)] * 25)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 5
    for point in result:
        assert point.velocity == 0.0
        assert point.ratio == 0.0
        assert point.scale == 1


def test_velocity_timestamps_correct():
    base_ts = 1_700_000_000
    bars = _make_bars([(100.0, 101.0)] * 22, base_ts=base_ts)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 2
    # First result corresponds to bar at index 20
    assert result[0].timestamp == base_ts + 20 * 60
    assert result[1].timestamp == base_ts + 21 * 60


# ---------------------------------------------------------------------------
# signed_scale tests (Bug 2 regression guard)
# ---------------------------------------------------------------------------

def test_signed_scale_bullish_bar_is_positive():
    """Bullish bars (close > open) must produce a positive signed_scale."""
    # 20 baseline bars + 1 fast bullish bar
    slow = [(100.0, 100.5)] * 20
    fast = [(100.0, 105.0)]  # close > open → bullish
    bars = _make_bars(slow + fast)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 1
    assert result[0].signed_scale > 0
    assert result[0].signed_scale == result[0].scale  # positive → same magnitude


def test_signed_scale_bearish_bar_is_negative():
    """Bearish bars (close < open) must produce a negative signed_scale."""
    # 20 baseline bars + 1 fast bearish bar
    slow = [(100.0, 100.5)] * 20
    fast = [(105.0, 100.0)]  # close < open → bearish
    bars = _make_bars(slow + fast)
    result = calculate_velocity(bars, period=20)
    assert len(result) == 1
    assert result[0].signed_scale < 0
    assert result[0].signed_scale == -result[0].scale  # negative → flipped magnitude


def test_signed_scale_doji_bar_is_non_negative():
    """Doji bars (open == close) count as neutral/bullish (signed_scale == scale == 1)."""
    bars = _make_bars([(100.0, 100.0)] * 25)
    result = calculate_velocity(bars, period=20)
    for point in result:
        # raw_move == 0.0 → direction_sign == 1 (>= 0 branch) → signed_scale positive
        assert point.signed_scale >= 0


def test_signed_scale_magnitude_equals_scale():
    """abs(signed_scale) must always equal scale."""
    mixed = [(100.0, 101.0), (101.0, 99.0), (99.0, 100.5), (100.5, 98.0)] * 10
    bars = _make_bars(mixed)
    result = calculate_velocity(bars, period=20)
    for point in result:
        assert abs(point.signed_scale) == point.scale

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


def test_velocity_scale_boundaries():
    """Scale thresholds map correctly at boundary ratios."""
    # Build bars so ratio is exactly at each boundary.
    # 20 baseline bars with move = 1.0, then one bar with the desired move.
    def _single(ratio: float) -> int:
        slow = [(100.0, 101.0)] * 20  # avg velocity = 1.0
        fast_move = 1.0 * ratio
        target = [(100.0, 100.0 + fast_move)]
        bars = _make_bars(slow + target)
        result = calculate_velocity(bars, period=20)
        return result[0].scale

    assert _single(0.2) == 1   # ratio < 0.3
    assert _single(0.4) == 2   # 0.3-0.5
    assert _single(0.6) == 3   # 0.5-0.7
    assert _single(0.8) == 4   # 0.7-0.9
    assert _single(1.0) == 5   # 0.9-1.1
    assert _single(1.2) == 6   # 1.1-1.3
    assert _single(1.4) == 7   # 1.3-1.5
    assert _single(1.7) == 8   # 1.5-2.0
    assert _single(2.2) == 9   # 2.0-2.5
    assert _single(3.0) == 10  # > 2.5


def test_velocity_result_fields_present():
    """Each VelocityPoint has all required fields with correct types."""
    bars = _make_bars([(100.0, 102.0)] * 22)
    result = calculate_velocity(bars, period=20)
    for pt in result:
        assert isinstance(pt.timestamp, int)
        assert isinstance(pt.velocity, float)
        assert isinstance(pt.avg_velocity, float)
        assert isinstance(pt.ratio, float)
        assert 1 <= pt.scale <= 10

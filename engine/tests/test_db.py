"""Tests for SQLAlchemy engine setup and aggregation in db.py."""

from arctis.db import aggregate_bars
from arctis.models import OHLCVBar


def _make_bar(ts: int, price: float = 100.0, volume: int = 10) -> OHLCVBar:
    return OHLCVBar(
        timestamp=ts,
        open=price,
        high=price + 1,
        low=price - 1,
        close=price + 0.5,
        volume=volume,
    )


def test_create_engine():
    from arctis.db import get_engine
    engine = get_engine()
    assert engine is not None
    assert str(engine.url).startswith("postgresql")


def test_aggregate_5min_basic():
    """5 consecutive 1min bars -> 1 aggregated 5min bar."""
    base = 1735830000  # Unix timestamp aligned to 5min boundary
    bars = [_make_bar(base + i * 60, price=100 + i) for i in range(5)]
    result = aggregate_bars(bars, "5min")
    assert len(result) == 1
    assert result[0].open == 100.0          # first bar's open
    assert result[0].close == 104.5         # last bar's close
    assert result[0].high == max(b.high for b in bars)
    assert result[0].low == min(b.low for b in bars)
    assert result[0].volume == 50


def test_aggregate_5min_with_gap():
    """Bars with 30min gap should produce separate buckets."""
    base = 1735830000
    bars = [_make_bar(base + i * 60) for i in range(3)]          # 3 bars
    bars += [_make_bar(base + 1800 + i * 60) for i in range(3)]  # 3 bars 30min later
    result = aggregate_bars(bars, "5min")
    assert len(result) >= 2  # at least 2 separate buckets


def test_aggregate_1min_passthrough():
    """1min timeframe returns bars unchanged."""
    bars = [_make_bar(1735830000 + i * 60) for i in range(10)]
    result = aggregate_bars(bars, "1min")
    assert len(result) == 10


def test_aggregate_15min():
    """15 consecutive bars -> 1 aggregated 15min bar."""
    base = 1735830000
    bars = [_make_bar(base + i * 60) for i in range(15)]
    result = aggregate_bars(bars, "15min")
    assert len(result) == 1


def test_aggregate_empty():
    """Empty bars list returns empty list."""
    result = aggregate_bars([], "5min")
    assert result == []


def test_aggregate_unknown_timeframe():
    """Unknown timeframe returns bars unchanged."""
    bars = [_make_bar(1735830000 + i * 60) for i in range(5)]
    result = aggregate_bars(bars, "3min")
    assert result == bars


def test_aggregate_30min():
    """30 consecutive 1min bars -> 1 aggregated 30min bar."""
    base = 1735830000
    bars = [_make_bar(base + i * 60) for i in range(30)]
    result = aggregate_bars(bars, "30min")
    assert len(result) == 1
    assert result[0].volume == 300  # 30 bars * 10 volume each


def test_aggregate_1h():
    """60 consecutive 1min bars -> 1 aggregated 1h bar."""
    base = 1735830000
    bars = [_make_bar(base + i * 60) for i in range(60)]
    result = aggregate_bars(bars, "1h")
    assert len(result) == 1
    assert result[0].volume == 600  # 60 bars * 10 volume each

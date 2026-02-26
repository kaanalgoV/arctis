import pytest
from arctis.models import OHLCVBar
from arctis.analysis.probability import (
    build_feature_vector,
    find_similar_situations,
    calculate_target_zones,
    TargetZone,
)


def make_daily_bars(n: int, base_price: float = 5000.0) -> list[OHLCVBar]:
    """Create n days of 1-min bars (390 bars per day)."""
    import random
    random.seed(42)
    bars = []
    price = base_price
    ts = 1704067200  # 2024-01-01 00:00:00 UTC
    for day in range(n):
        for minute in range(390):
            change = random.uniform(-2, 2)
            price += change
            bars.append(OHLCVBar(
                timestamp=ts + day * 86400 + minute * 60,
                open=price,
                high=price + random.uniform(0, 3),
                low=price - random.uniform(0, 3),
                close=price + random.uniform(-1, 1),
                volume=random.randint(500, 5000),
            ))
    return bars


class TestFeatureVector:
    def test_builds_vector(self):
        bars = make_daily_bars(5)
        vec = build_feature_vector(bars[-390:])
        assert len(vec) == 5
        assert all(isinstance(v, float) for v in vec)


class TestSimilarSituations:
    def test_finds_matches(self):
        bars = make_daily_bars(30)
        current = bars[-390:]
        history = bars[:-390]
        matches = find_similar_situations(current, history, top_n=10)
        assert len(matches) <= 10
        assert all("distance" in m for m in matches)
        assert all("bars" in m for m in matches)


class TestTargetZones:
    def test_calculates_zones(self):
        bars = make_daily_bars(30)
        current = bars[-390:]
        history = bars[:-390]
        matches = find_similar_situations(current, history, top_n=10)
        zones = calculate_target_zones(matches, current_price=5000.0)
        assert zones.median_target != 0
        assert 0 <= zones.reach_probability <= 1.0
        assert zones.iqr_low <= zones.iqr_high

"""Key Level Identification — finds price levels respected across 3+ distinct trading days."""

from dataclasses import dataclass
from datetime import datetime, timezone

from arctis.models import OHLCVBar

# Minimum number of distinct days a level must be tested on
_MIN_TEST_DAYS = 3

# Minimum bars required for any meaningful analysis
_MIN_BARS = 3


@dataclass
class KeyLevel:
    level: float            # representative price of the cluster
    first_test_date: str    # ISO date string of the first test (YYYY-MM-DD)
    test_count: int         # total number of bars that tested this level
    last_test_date: str     # ISO date string of the most recent test
    type: str               # "support" | "resistance"


def _ts_to_date(timestamp: int) -> str:
    """Convert Unix timestamp (seconds) to YYYY-MM-DD string (UTC)."""
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m-%d")


def _price_touches_level(bar: OHLCVBar, level: float, tolerance: float) -> str | None:
    """Return 'support' or 'resistance' when the bar tests `level`, else None.

    A bar tests the level as *support* when its low comes within `tolerance`
    of `level` (price bounced off from below).
    A bar tests the level as *resistance* when its high comes within `tolerance`
    of `level` (price rejected from above).
    When the bar spans across the level (both high and low bracket it), the
    classification is determined by which side the close is on:
      - close below level → resistance (price failed to hold above)
      - close above level → support (price held above)
    """
    low_near = abs(bar.low - level) <= tolerance
    high_near = abs(bar.high - level) <= tolerance
    spans = bar.low <= level <= bar.high

    if spans:
        return "resistance" if bar.close < level else "support"
    elif high_near:
        return "resistance"
    elif low_near:
        return "support"
    return None


def find_key_levels(
    bars: list[OHLCVBar],
    tolerance_pct: float = 0.1,
) -> list[KeyLevel]:
    """Identify price levels tested (within tolerance) on 3 or more different days.

    Algorithm:
      1. Collect all bar highs and lows as candidate level seeds.
      2. Cluster nearby candidates within `tolerance_pct`% of price together,
         using the arithmetic mean of the cluster as the representative level.
      3. For each candidate level, scan every bar to find tests within
         `tolerance` points.
      4. Keep only levels tested on at least `_MIN_TEST_DAYS` distinct calendar
         days (UTC).
      5. Classify each surviving level as "support" or "resistance" by majority
         vote among all touching bars.

    Args:
        bars:          Ordered list of OHLCVBar.  Any timeframe works; daily or
                       1-min bars on multi-day data are the primary use case.
        tolerance_pct: Cluster/touch tolerance as a percentage of the level
                       price (default 0.1 = 0.1%).

    Returns:
        List of KeyLevel objects sorted by level price ascending.
        Returns an empty list when bars are insufficient.
    """
    if not bars or len(bars) < _MIN_BARS:
        return []

    # --- Step 1: Collect candidate prices (all highs and lows) -----------------
    candidates: list[float] = []
    for bar in bars:
        candidates.append(bar.high)
        candidates.append(bar.low)
    candidates.sort()

    # --- Step 2: Cluster candidates using a greedy single-pass approach ---------
    clusters: list[list[float]] = []
    for price in candidates:
        placed = False
        for cluster in clusters:
            rep = sum(cluster) / len(cluster)  # current cluster mean
            tol = rep * tolerance_pct / 100.0
            if abs(price - rep) <= tol:
                cluster.append(price)
                placed = True
                break
        if not placed:
            clusters.append([price])

    cluster_levels = [sum(c) / len(c) for c in clusters]

    # --- Step 3 & 4: Test each cluster level against all bars -------------------
    key_levels: list[KeyLevel] = []

    for level in cluster_levels:
        tolerance = level * tolerance_pct / 100.0
        touching_bars: list[tuple[OHLCVBar, str]] = []

        for bar in bars:
            touch_type = _price_touches_level(bar, level, tolerance)
            if touch_type is not None:
                touching_bars.append((bar, touch_type))

        if not touching_bars:
            continue

        # Count distinct calendar days
        distinct_days: set[str] = {_ts_to_date(b.timestamp) for b, _ in touching_bars}
        if len(distinct_days) < _MIN_TEST_DAYS:
            continue

        # Majority vote for type
        support_votes = sum(1 for _, t in touching_bars if t == "support")
        resistance_votes = len(touching_bars) - support_votes
        level_type = "support" if support_votes >= resistance_votes else "resistance"

        sorted_dates = sorted(distinct_days)

        key_levels.append(KeyLevel(
            level=round(level, 4),
            first_test_date=sorted_dates[0],
            test_count=len(touching_bars),
            last_test_date=sorted_dates[-1],
            type=level_type,
        ))

    key_levels.sort(key=lambda kl: kl.level)
    return key_levels

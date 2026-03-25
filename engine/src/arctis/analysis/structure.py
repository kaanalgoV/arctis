"""Market structure analysis: swings, trends, structure breaks, consolidations."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from arctis.models import OHLCVBar


class SwingType(str, Enum):
    HIGH = "high"
    LOW = "low"


class TrendState(str, Enum):
    UPTREND = "uptrend"
    DOWNTREND = "downtrend"
    RANGE = "range"


@dataclass
class SwingPoint:
    type: SwingType
    price: float
    index: int
    timestamp: int


@dataclass
class StructureBreak:
    break_type: str  # "BOS" or "CHoCH"
    price: float
    index: int
    timestamp: int
    direction: str  # "bullish" or "bearish"


def detect_swings(bars: list[OHLCVBar], lookback: int = 5) -> list[SwingPoint]:
    """Detect swing highs and lows using lookback window."""
    swings: list[SwingPoint] = []
    n = len(bars)

    for i in range(lookback, n - lookback):
        is_high = all(
            bars[i].high > bars[i + j].high and bars[i].high > bars[i - j].high
            for j in range(1, lookback + 1)
        )
        if is_high:
            swings.append(SwingPoint(
                type=SwingType.HIGH, price=bars[i].high, index=i, timestamp=bars[i].timestamp,
            ))

        is_low = all(
            bars[i].low < bars[i + j].low and bars[i].low < bars[i - j].low
            for j in range(1, lookback + 1)
        )
        if is_low:
            swings.append(SwingPoint(
                type=SwingType.LOW, price=bars[i].low, index=i, timestamp=bars[i].timestamp,
            ))

    swings.sort(key=lambda s: s.index)
    return swings


def classify_trend(swings: list[SwingPoint]) -> TrendState:
    """Classify trend based on swing sequence."""
    highs = [s for s in swings if s.type == SwingType.HIGH]
    lows = [s for s in swings if s.type == SwingType.LOW]

    if len(highs) < 2 or len(lows) < 2:
        return TrendState.RANGE

    hh = all(highs[i].price > highs[i - 1].price for i in range(1, len(highs)))
    hl = all(lows[i].price > lows[i - 1].price for i in range(1, len(lows)))
    lh = all(highs[i].price < highs[i - 1].price for i in range(1, len(highs)))
    ll = all(lows[i].price < lows[i - 1].price for i in range(1, len(lows)))

    if hh and hl:
        return TrendState.UPTREND
    elif lh and ll:
        return TrendState.DOWNTREND
    else:
        return TrendState.RANGE


def detect_structure_breaks(swings: list[SwingPoint]) -> list[StructureBreak]:
    """Detect BOS and CHoCH."""
    breaks: list[StructureBreak] = []
    highs = [s for s in swings if s.type == SwingType.HIGH]
    lows = [s for s in swings if s.type == SwingType.LOW]

    for i in range(1, len(highs)):
        if highs[i].price > highs[i - 1].price:
            breaks.append(StructureBreak(
                break_type="BOS", price=highs[i].price, index=highs[i].index,
                timestamp=highs[i].timestamp, direction="bullish",
            ))

    for i in range(1, len(lows)):
        if lows[i].price < lows[i - 1].price:
            breaks.append(StructureBreak(
                break_type="BOS", price=lows[i].price, index=lows[i].index,
                timestamp=lows[i].timestamp, direction="bearish",
            ))

    for i in range(1, len(lows)):
        prev_highs = [h for h in highs if h.index < lows[i].index]
        if len(prev_highs) >= 2:
            if prev_highs[-1].price > prev_highs[-2].price and lows[i].price < lows[i - 1].price:
                breaks.append(StructureBreak(
                    break_type="CHoCH", price=lows[i].price, index=lows[i].index,
                    timestamp=lows[i].timestamp, direction="bearish",
                ))

    breaks.sort(key=lambda b: b.index)
    return breaks


# ---------------------------------------------------------------------------
# Consolidation detection
# ---------------------------------------------------------------------------

@dataclass
class Consolidation:
    """A period of price compression within a bounded range.

    Attributes
    ----------
    start_ts:
        Unix timestamp of the first bar in the consolidation.
    end_ts:
        Unix timestamp of the last bar in the consolidation, or None if
        the consolidation is still active (not yet broken).
    range_high:
        Highest high price seen during the consolidation period.
    range_low:
        Lowest low price seen during the consolidation period.
    bar_count:
        Number of bars that make up the consolidation.
    volume_character:
        Volume trend during the consolidation:
          "declining"  — volume trending down (healthy compression)
          "steady"     — volume roughly flat
          "increasing" — volume trending up (unusual, potential climax)
    context_trend:
        Market context before the consolidation began:
          "after_uptrend"    — consolidation follows bullish structure
          "after_downtrend"  — consolidation follows bearish structure
          "range"            — no clear prior trend (neutral context)
    status:
        Current state of the consolidation:
          "active"       — consolidation is ongoing, no breakout yet
          "broken_up"    — price broke above range_high
          "broken_down"  — price broke below range_low
    breakout_price:
        The price at which the breakout occurred, or None if still active.
    """

    start_ts: float
    end_ts: Optional[float]     # None = still active
    range_high: float
    range_low: float
    bar_count: int
    volume_character: str       # "declining", "steady", "increasing"
    context_trend: str          # "after_uptrend", "after_downtrend", "range"
    status: str                 # "active", "broken_up", "broken_down"
    breakout_price: Optional[float] = field(default=None)

    @property
    def range_size(self) -> float:
        """Height of the consolidation range in price units."""
        return self.range_high - self.range_low

    @property
    def is_active(self) -> bool:
        return self.status == "active"

    @property
    def is_broken(self) -> bool:
        return self.status in ("broken_up", "broken_down")

    def __repr__(self) -> str:
        return (
            f"Consolidation(bars={self.bar_count}, "
            f"range={self.range_low:.2f}-{self.range_high:.2f}, "
            f"volume={self.volume_character!r}, "
            f"context={self.context_trend!r}, "
            f"status={self.status!r})"
        )


def _classify_volume_character(volumes: list[int]) -> str:
    """Classify volume trend within a consolidation window.

    Divides the volume list in half and compares the means.  A >15%
    decline is "declining"; a >15% increase is "increasing"; otherwise
    "steady".

    Args:
        volumes: List of volume values for the consolidation bars.

    Returns:
        "declining", "steady", or "increasing".
    """
    n = len(volumes)
    if n < 4:
        return "steady"

    mid = n // 2
    first_half_avg = sum(volumes[:mid]) / mid
    second_half_avg = sum(volumes[mid:]) / (n - mid)

    if first_half_avg <= 0:
        return "steady"

    change_ratio = (second_half_avg - first_half_avg) / first_half_avg
    if change_ratio < -0.15:
        return "declining"
    elif change_ratio > 0.15:
        return "increasing"
    return "steady"


def _classify_context_trend(pre_bars: list[OHLCVBar]) -> str:
    """Determine the trend context before a consolidation starts.

    Examines up to the last 20 bars prior to the consolidation window.
    Uses close-price slope: if the last close is >0.5 ATR above the
    first close it is an uptrend; >0.5 ATR below is downtrend; else range.

    Args:
        pre_bars: Bars that precede the consolidation window.

    Returns:
        "after_uptrend", "after_downtrend", or "range".
    """
    if len(pre_bars) < 5:
        return "range"

    window = pre_bars[-20:] if len(pre_bars) >= 20 else pre_bars
    atr = sum(b.high - b.low for b in window) / len(window)
    if atr <= 0:
        return "range"

    price_delta = window[-1].close - window[0].close
    if price_delta > 0.5 * atr:
        return "after_uptrend"
    elif price_delta < -0.5 * atr:
        return "after_downtrend"
    return "range"


def detect_consolidations(
    bars: list[OHLCVBar],
    min_bars: int = 5,
    max_range_atr_ratio: float = 0.6,
) -> list[Consolidation]:
    """Detect periods of price consolidation (compression) in a bar series.

    A consolidation is identified when N consecutive bars (>= min_bars) all
    trade within a range that is <= max_range_atr_ratio * ATR.  The range is
    defined as max(high) - min(low) across the window.

    After detecting the compressed range, each consolidation is checked for
    a subsequent breakout:
      - If a later bar's high > range_high -> "broken_up"
      - If a later bar's low  < range_low  -> "broken_down"
      - Otherwise -> "active"

    Args:
        bars:
            List of OHLCVBar objects.  Bars must be ordered oldest-first.
        min_bars:
            Minimum number of bars required to qualify as a consolidation.
            Default 5.
        max_range_atr_ratio:
            Maximum allowed range as a fraction of the 20-bar ATR.  Bars
            where range > max_range_atr_ratio * ATR are not compressed.
            Default 0.6 (60% of ATR).

    Returns:
        List of Consolidation objects, ordered by start_ts ascending.
        The last entry may have status "active" if no breakout has occurred.
    """
    if len(bars) < min_bars + 1:
        return []

    # 20-bar ATR baseline (use full series)
    atr_window = bars[-20:] if len(bars) >= 20 else bars
    atr = sum(b.high - b.low for b in atr_window) / len(atr_window)
    if atr <= 0:
        return []

    max_allowed_range = max_range_atr_ratio * atr
    n = len(bars)
    results: list[Consolidation] = []
    i = 0

    while i <= n - min_bars:
        # Expand window from i as long as bars remain in the compressed range
        window_high = bars[i].high
        window_low = bars[i].low
        j = i + 1

        while j < n:
            candidate_high = max(window_high, bars[j].high)
            candidate_low = min(window_low, bars[j].low)
            if candidate_high - candidate_low > max_allowed_range:
                break
            window_high = candidate_high
            window_low = candidate_low
            j += 1

        window_size = j - i
        if window_size < min_bars:
            i += 1
            continue

        # We have a valid consolidation window: bars[i..j-1]
        con_bars = bars[i:j]
        volumes = [b.volume for b in con_bars]
        volume_char = _classify_volume_character(volumes)
        context_trend = _classify_context_trend(bars[:i])

        # Check for breakout in subsequent bars
        status = "active"
        end_ts: Optional[float] = None
        breakout_price: Optional[float] = None

        for k in range(j, n):
            if bars[k].high > window_high:
                status = "broken_up"
                end_ts = float(bars[k].timestamp)
                breakout_price = bars[k].high
                break
            if bars[k].low < window_low:
                status = "broken_down"
                end_ts = float(bars[k].timestamp)
                breakout_price = bars[k].low
                break

        consolidation = Consolidation(
            start_ts=float(con_bars[0].timestamp),
            end_ts=end_ts,
            range_high=window_high,
            range_low=window_low,
            bar_count=window_size,
            volume_character=volume_char,
            context_trend=context_trend,
            status=status,
            breakout_price=breakout_price,
        )
        results.append(consolidation)

        # Advance past this consolidation window to avoid overlapping detections
        i = j

    return results

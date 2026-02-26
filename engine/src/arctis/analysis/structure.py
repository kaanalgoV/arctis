"""Market structure analysis: swings, trends, structure breaks."""

from dataclasses import dataclass
from enum import Enum

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

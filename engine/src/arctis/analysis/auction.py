"""Auction Quality — measures cleanliness of price moves."""

from dataclasses import dataclass
from arctis.models import OHLCVBar


@dataclass
class AuctionQuality:
    quality_score: float    # 0.0 to 1.0 (traded_ticks / total_ticks)
    quality_label: str      # "sauber" | "moderat" | "schlecht"
    auction_type: str       # "two_way" | "one_way"
    traded_ticks: int       # number of price levels traded
    total_ticks: int        # total price levels in the range
    direction: str          # "up" | "down" | "flat"


def calculate_auction_quality(bars: list[OHLCVBar], lookback: int = 50) -> AuctionQuality | None:
    """Analyze the auction quality of the recent price action.

    Looks at the last `lookback` bars and measures:
    - How many distinct price levels (ticks) were traded
    - vs how many total ticks exist in the high-low range
    - Quality > 0.85 = "sauber" (clean, sustainable move)
    - Quality 0.60-0.85 = "moderat" (mixed)
    - Quality < 0.60 = "schlecht" (poor, will likely be rebalanced)

    One-way auction (low volume, few traded levels) = weak
    Two-way auction (high volume, many traded levels) = strong
    """
    if len(bars) < lookback:
        return None

    recent = bars[-lookback:]

    # Overall direction
    start_price = recent[0].open
    end_price = recent[-1].close
    direction = "up" if end_price > start_price else "down" if end_price < start_price else "flat"

    # Collect all traded price levels (round to tick size, use 0.25 for NQ/ES)
    tick_size = 0.25
    traded_levels: set[float] = set()
    range_high = float('-inf')
    range_low = float('inf')

    for bar in recent:
        range_high = max(range_high, bar.high)
        range_low = min(range_low, bar.low)
        # Each bar trades through its range
        level = bar.low
        while level <= bar.high:
            traded_levels.add(round(level / tick_size) * tick_size)
            level += tick_size

    total_ticks = int((range_high - range_low) / tick_size) + 1 if range_high > range_low else 1
    traded_ticks = len(traded_levels)

    quality_score = min(traded_ticks / total_ticks, 1.0) if total_ticks > 0 else 0.0

    if quality_score > 0.85:
        quality_label = "sauber"
    elif quality_score > 0.60:
        quality_label = "moderat"
    else:
        quality_label = "schlecht"

    # One-way vs two-way: check if volume is concentrated or distributed
    avg_volume = sum(b.volume for b in recent) / len(recent)
    high_vol_bars = sum(1 for b in recent if b.volume > avg_volume * 1.2)
    auction_type = "two_way" if high_vol_bars > len(recent) * 0.3 else "one_way"

    return AuctionQuality(
        quality_score=round(quality_score, 3),
        quality_label=quality_label,
        auction_type=auction_type,
        traded_ticks=traded_ticks,
        total_ticks=total_ticks,
        direction=direction,
    )

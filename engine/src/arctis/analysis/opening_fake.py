"""Opening Fake Detection — identifies false breakouts of prior-day extremes in first 2 hours.

ALGOVIEW CALIBRATION (fakeout_pro_v5 strategy, NQH6/NQZ5):
  Win Rate:      16.0%  (only 1 in 6 trades wins)
  Profit Factor: 3.83   (profitable despite low WR)
  Avg R:R:       6.72   (winners are ~7x larger than losers)
  Sample size:   50 trades (Aug 2025 — Mar 2026)

KEY: This pattern requires strict stop discipline. The edge is entirely in the
reward/risk ratio — not in win rate. Do NOT widen stops chasing winners.

DATA SOURCE: AlgoView TimescaleDB, fakeout_pro_v5, NQ Aug 2025-Mar 2026
"""

from dataclasses import dataclass

from arctis.models import OHLCVBar

# Minimum bars required to detect anything meaningful
_MIN_BARS = 10

# First 2 hours = 120 one-minute bars
_OPENING_WINDOW = 120

# Volume considered "low" relative to mean: ratio below this threshold
_LOW_VOLUME_RATIO = 0.8

# Minimum retracement back inside range to confirm reversal (as fraction of breakout distance)
_REVERSAL_THRESHOLD = 0.5


@dataclass
class OpeningFake:
    detected: bool
    direction: str          # "long"  = fake high then reverses down
                            # "short" = fake low then reverses up
                            # ""      = no fake found
    break_price: float      # price at which the prior extreme was broken
    break_time: int         # unix timestamp of the bar that broke the extreme
    reversal_confirmed: bool
    confidence: str         # "high" | "medium" | "low" | "none"
    # AlgoView-calibrated statistics (fakeout_pro_v5, n=50, NQ Aug 2025-Mar 2026)
    win_rate: float = 16.0          # 16% — low WR, but PF 3.83 due to extreme R:R
    profit_factor: float = 3.83     # profitable overall despite 1-in-6 win rate
    avg_rr: float = 6.72            # winners ~7x larger than losers
    sample_size: int = 50


def detect_opening_fake(
    bars: list[OHLCVBar],
    prev_high: float,
    prev_low: float,
) -> OpeningFake:
    """Check first 120 bars (2 hours of 1-min data) for an opening fake.

    A fake is defined as:
      1. Price breaks the prior day's high or low within the opening window.
      2. The breaking bar has below-average volume (exhaustion, not conviction).
      3. Price subsequently reverses back inside the prior day's range by at
         least 50% of the breakout distance.

    Confidence levels:
      high   — low-volume break + full 50% reversal confirmed
      medium — low-volume break, partial reversal in progress
      low    — break occurred but volume was normal (could still be a fake)
      none   — no break detected

    AlgoView statistics (fakeout_pro_v5, n=50 trades, NQ Aug 2025-Mar 2026):
      Win Rate: 16% | Profit Factor: 3.83 | Avg R:R: 6.72
      Low win rate (16%) but extreme reward/risk ratio (6.7:1). Only 1 in 6
      trades wins, but winners are ~7x larger than losers. Profitable overall
      (PF 3.83). Requires strict stop discipline — do NOT widen stops.

    Args:
        bars:      Ordered list of 1-minute OHLCVBar from session open.
                   Only the first 120 bars are examined.
        prev_high: Previous session's high price.
        prev_low:  Previous session's low price.

    Returns:
        OpeningFake dataclass. ``detected=False`` when bars are insufficient
        or no fake pattern is found. When detected, ``win_rate``, ``profit_factor``,
        ``avg_rr``, and ``sample_size`` fields carry AlgoView-calibrated statistics.
    """
    _no_fake = OpeningFake(
        detected=False,
        direction="",
        break_price=0.0,
        break_time=0,
        reversal_confirmed=False,
        confidence="none",
    )

    if not bars or len(bars) < _MIN_BARS:
        return _no_fake

    window = bars[:_OPENING_WINDOW]

    # Pre-compute mean volume over the entire window for comparison
    mean_volume = sum(b.volume for b in window) / len(window)

    # Scan for the first bar that breaks a prior extreme
    for idx, bar in enumerate(window):
        broke_high = bar.high > prev_high
        broke_low = bar.low < prev_low

        if not broke_high and not broke_low:
            continue

        # Use whichever extreme was broken (if both, high takes priority)
        if broke_high:
            direction = "long"          # faked out bulls → expect reversal down
            break_price = bar.high
            breakout_distance = bar.high - prev_high
        else:
            direction = "short"         # faked out bears → expect reversal up
            break_price = bar.low
            breakout_distance = prev_low - bar.low

        break_time = bar.timestamp
        low_volume = (mean_volume > 0) and (bar.volume / mean_volume < _LOW_VOLUME_RATIO)

        # Check subsequent bars for reversal back inside the prior range
        post_bars = window[idx + 1:]
        reversal_confirmed = False

        if broke_high:
            # Reversal: price must close back below (prev_high - threshold * distance)
            reversal_target = prev_high - _REVERSAL_THRESHOLD * breakout_distance
            reversal_confirmed = any(b.close < reversal_target for b in post_bars)
        else:
            # Reversal: price must close back above (prev_low + threshold * distance)
            reversal_target = prev_low + _REVERSAL_THRESHOLD * breakout_distance
            reversal_confirmed = any(b.close > reversal_target for b in post_bars)

        # Assign confidence
        if low_volume and reversal_confirmed:
            confidence = "high"
        elif low_volume and not reversal_confirmed:
            confidence = "medium"
        elif not low_volume and reversal_confirmed:
            confidence = "low"
        else:
            confidence = "low"

        return OpeningFake(
            detected=True,
            direction=direction,
            break_price=round(break_price, 4),
            break_time=break_time,
            reversal_confirmed=reversal_confirmed,
            confidence=confidence,
        )

    return _no_fake

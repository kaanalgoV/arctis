"""Velocity analysis — measures auction speed relative to history."""

from dataclasses import dataclass

from arctis.models import OHLCVBar


@dataclass
class VelocityPoint:
    timestamp: int
    velocity: float      # absolute price change per bar
    avg_velocity: float  # rolling average over N bars
    ratio: float         # velocity / avg_velocity
    scale: int           # 1-10 scale (always positive, magnitude only)
    signed_scale: int    # signed: positive = bullish bar, negative = bearish bar


def calculate_velocity(bars: list[OHLCVBar], period: int = 20) -> list[VelocityPoint]:
    """Calculate velocity for each bar.

    Velocity = abs(close - open) for each bar.
    Avg velocity = rolling mean over `period` bars.
    Ratio = current / average.
    Scale mapping:
      <0.3  -> 1   (extremely slow)
      0.3-0.5 -> 2 (very slow, rotational)
      0.5-0.7 -> 3 (slow)
      0.7-0.9 -> 4 (below-average)
      0.9-1.1 -> 5 (normal)
      1.1-1.3 -> 6 (slightly fast)
      1.3-1.5 -> 7 (fast, directional)
      1.5-2.0 -> 8 (very fast)
      2.0-2.5 -> 9 (extremely fast)
      >2.5    -> 10 (manipulative/stop-run)

    signed_scale mirrors scale but carries the direction of the bar:
      positive = bullish bar (close > open)
      negative = bearish bar (close < open)
    This is the value that should be passed to BIAS scoring so that
    downward velocity correctly decreases (not increases) the BIAS score.
    """
    if len(bars) < period:
        return []

    results = []
    for i in range(period, len(bars)):
        raw_move = bars[i].close - bars[i].open   # signed: positive = bullish
        vel = abs(raw_move)

        # Rolling average over the preceding `period` bars (not including current)
        window = bars[i - period:i]
        avg = sum(abs(b.close - b.open) for b in window) / period

        ratio = vel / avg if avg > 0 else 0.0

        # Scale mapping (magnitude only, 1-10)
        if ratio < 0.3:
            scale = 1
        elif ratio < 0.5:
            scale = 2
        elif ratio < 0.7:
            scale = 3
        elif ratio < 0.9:
            scale = 4
        elif ratio < 1.1:
            scale = 5
        elif ratio < 1.3:
            scale = 6
        elif ratio < 1.5:
            scale = 7
        elif ratio < 2.0:
            scale = 8
        elif ratio < 2.5:
            scale = 9
        else:
            scale = 10

        # signed_scale: magnitude × direction (-10..+10)
        direction_sign = 1 if raw_move >= 0 else -1
        signed_scale = direction_sign * scale

        results.append(VelocityPoint(
            timestamp=bars[i].timestamp,
            velocity=round(vel, 4),
            avg_velocity=round(avg, 4),
            ratio=round(ratio, 2),
            scale=scale,
            signed_scale=signed_scale,
        ))

    return results

"""Cumulative Delta analysis — computes running buy/sell pressure from bar delta.

Daily reset at 17:00 CT (Central Time) = Market Open for futures.
This matches the VWAP reset anchor.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from arctis.models import OHLCVBar


@dataclass
class CumDeltaPoint:
    timestamp: int
    bar_delta: int
    cum_delta: int


@dataclass
class DivergenceResult:
    type: str        # "bullish" | "bearish"
    severity: str    # "warning" | "strong"
    message: str


def _is_daily_reset(ts: int, prev_ts: int) -> bool:
    """Check if we crossed the 17:00 CT (22:00/23:00 UTC) boundary."""
    from datetime import datetime, timezone, timedelta
    ct = timezone(timedelta(hours=-6))  # CT = UTC-6 (CST), UTC-5 (CDT)
    current = datetime.fromtimestamp(ts, tz=ct)
    previous = datetime.fromtimestamp(prev_ts, tz=ct)
    # Reset if we crossed 17:00 CT (different calendar day at 17:00+)
    current_reset = current.replace(hour=17, minute=0, second=0, microsecond=0)
    if current.hour < 17:
        current_reset = current_reset.replace(day=current.day - 1)
    previous_reset = previous.replace(hour=17, minute=0, second=0, microsecond=0)
    if previous.hour < 17:
        previous_reset = previous_reset.replace(day=previous.day - 1)
    return current_reset > previous_reset


def compute_cum_delta(bars: list[OHLCVBar]) -> list[CumDeltaPoint]:
    """Compute cumulative delta from bar-level delta values.

    Resets to 0 at 17:00 CT daily (futures market open).
    Bars without delta data (delta=0 and buy_volume=0) are skipped.
    """
    if not bars:
        return []

    points: list[CumDeltaPoint] = []
    cum = 0
    prev_ts = bars[0].timestamp

    for bar in bars:
        # Check for daily reset
        if points and _is_daily_reset(bar.timestamp, prev_ts):
            cum = 0

        bar_delta = bar.delta if hasattr(bar, 'delta') else 0
        cum += bar_delta
        points.append(CumDeltaPoint(
            timestamp=bar.timestamp,
            bar_delta=bar_delta,
            cum_delta=cum,
        ))
        prev_ts = bar.timestamp

    return points


def detect_divergence(
    bars: list[OHLCVBar],
    cum_delta_points: list[CumDeltaPoint],
    lookback: int = 30,
) -> Optional[DivergenceResult]:
    """Detect price/delta divergence in the last `lookback` bars.

    Bearish divergence: price makes Higher High but cum delta makes Lower High
    Bullish divergence: price makes Lower Low but cum delta makes Higher Low
    """
    if len(bars) < lookback or len(cum_delta_points) < lookback:
        return None

    recent_bars = bars[-lookback:]
    recent_delta = cum_delta_points[-lookback:]

    # Find swing highs (local maxima in last N bars)
    price_highs = []
    delta_highs = []
    for i in range(2, len(recent_bars) - 2):
        if (recent_bars[i].high > recent_bars[i-1].high
            and recent_bars[i].high > recent_bars[i-2].high
            and recent_bars[i].high > recent_bars[i+1].high
            and recent_bars[i].high > recent_bars[i+2].high):
            price_highs.append((i, recent_bars[i].high))
            delta_highs.append((i, recent_delta[i].cum_delta))

    # Check for bearish divergence (price HH, delta LH)
    if len(price_highs) >= 2:
        ph1, ph2 = price_highs[-2], price_highs[-1]
        dh1, dh2 = delta_highs[-2], delta_highs[-1]
        if ph2[1] > ph1[1] and dh2[1] < dh1[1]:
            return DivergenceResult(
                type="bearish",
                severity="warning",
                message=f"Price HH ({ph2[1]:.2f} > {ph1[1]:.2f}) but Cum Delta LH ({dh2[1]} < {dh1[1]}) - selling pressure"
            )

    # Find swing lows
    price_lows = []
    delta_lows = []
    for i in range(2, len(recent_bars) - 2):
        if (recent_bars[i].low < recent_bars[i-1].low
            and recent_bars[i].low < recent_bars[i-2].low
            and recent_bars[i].low < recent_bars[i+1].low
            and recent_bars[i].low < recent_bars[i+2].low):
            price_lows.append((i, recent_bars[i].low))
            delta_lows.append((i, recent_delta[i].cum_delta))

    # Check for bullish divergence (price LL, delta HL)
    if len(price_lows) >= 2:
        pl1, pl2 = price_lows[-2], price_lows[-1]
        dl1, dl2 = delta_lows[-2], delta_lows[-1]
        if pl2[1] < pl1[1] and dl2[1] > dl1[1]:
            return DivergenceResult(
                type="bullish",
                severity="warning",
                message=f"Price LL ({pl2[1]:.2f} < {pl1[1]:.2f}) but Cum Delta HL ({dl2[1]} > {dl1[1]}) - buying pressure"
            )

    return None

"""Volume Profile with POC (Point of Control) and Value Area."""

from dataclasses import dataclass, field
from datetime import datetime, timezone

from arctis.models import OHLCVBar


@dataclass
class VolumeProfileData:
    poc: float  # Point of Control (highest volume price)
    vah: float  # Value Area High (upper 70% boundary)
    val: float  # Value Area Low (lower 70% boundary)
    total_volume: int
    profile: dict[float, int]  # price_level -> volume


@dataclass
class DailyVolumeProfile:
    date: str  # ISO date string, e.g. "2026-03-20"
    poc: float
    vah: float
    val: float
    total_volume: int


@dataclass
class SessionLevels:
    prev_high: float | None
    prev_low: float | None
    prev_close: float | None
    prev_poc: float | None
    overnight_high: float | None
    overnight_low: float | None
    opening_range_high: float | None
    opening_range_low: float | None


def build_volume_profile(
    bars: list[OHLCVBar], tick_size: float = 0.25, bin_ticks: int = 4
) -> VolumeProfileData | None:
    """Build volume profile from bars.

    Args:
        bars: OHLCV bars
        tick_size: Minimum price increment (0.25 for ES)
        bin_ticks: Number of ticks per bin (4 = 1 point bins for ES)
    """
    if not bars:
        return None

    bin_size = tick_size * bin_ticks
    profile: dict[float, int] = {}

    for bar in bars:
        # Distribute volume across the bar's range
        tp = (bar.high + bar.low + bar.close) / 3.0
        price_bin = round(round(tp / bin_size) * bin_size, 2)
        profile[price_bin] = profile.get(price_bin, 0) + bar.volume

    if not profile:
        return None

    # POC = price level with highest volume
    poc = max(profile, key=lambda k: profile[k])

    # Value Area (70% of total volume)
    total_vol = sum(profile.values())
    target_vol = total_vol * 0.70

    va_vol = profile[poc]
    upper = poc
    lower = poc

    sorted_prices = sorted(profile.keys())

    while va_vol < target_vol:
        # Check volume above and below current VA
        next_upper = None
        next_lower = None

        for p in sorted_prices:
            if p > upper:
                next_upper = p
                break
        for p in reversed(sorted_prices):
            if p < lower:
                next_lower = p
                break

        vol_above = profile.get(next_upper, 0) if next_upper else 0
        vol_below = profile.get(next_lower, 0) if next_lower else 0

        if vol_above == 0 and vol_below == 0:
            break

        if vol_above >= vol_below:
            if next_upper is not None:
                upper = next_upper
                va_vol += vol_above
        else:
            if next_lower is not None:
                lower = next_lower
                va_vol += vol_below

    return VolumeProfileData(
        poc=poc,
        vah=upper,
        val=lower,
        total_volume=total_vol,
        profile=profile,
    )


def build_daily_volume_profiles(
    bars: list[OHLCVBar], tick_size: float = 0.25, bin_ticks: int = 4
) -> list[DailyVolumeProfile]:
    """Build per-day volume profiles from bars.

    Groups bars by calendar date (UTC), then computes POC/VAH/VAL for each day.
    Returns the list sorted ascending by date.
    """
    if not bars:
        return []

    # Group bars by ISO date string (UTC)
    days: dict[str, list[OHLCVBar]] = {}
    for bar in bars:
        date_str = datetime.fromtimestamp(bar.timestamp, tz=timezone.utc).strftime("%Y-%m-%d")
        days.setdefault(date_str, []).append(bar)

    result: list[DailyVolumeProfile] = []
    for date_str in sorted(days.keys()):
        day_bars = days[date_str]
        vp = build_volume_profile(day_bars, tick_size=tick_size, bin_ticks=bin_ticks)
        if vp is not None:
            result.append(
                DailyVolumeProfile(
                    date=date_str,
                    poc=vp.poc,
                    vah=vp.vah,
                    val=vp.val,
                    total_volume=vp.total_volume,
                )
            )

    return result


def calculate_session_levels(
    bars: list[OHLCVBar], or_minutes: int = 15
) -> SessionLevels:
    """Calculate key session reference levels.

    Detects previous day's H/L/C, overnight range, and opening range.
    """
    if len(bars) < 2:
        return SessionLevels(None, None, None, None, None, None, None, None)

    # Split bars into days (gap > 6 hours = new day)
    days: list[list[OHLCVBar]] = []
    current_day: list[OHLCVBar] = [bars[0]]

    for i in range(1, len(bars)):
        if bars[i].timestamp - bars[i - 1].timestamp > 6 * 3600:
            days.append(current_day)
            current_day = [bars[i]]
        else:
            current_day.append(bars[i])
    days.append(current_day)

    result = SessionLevels(None, None, None, None, None, None, None, None)

    if len(days) >= 2:
        prev_day = days[-2]
        result.prev_high = max(b.high for b in prev_day)
        result.prev_low = min(b.low for b in prev_day)
        result.prev_close = prev_day[-1].close

        # Previous day POC
        prev_profile = build_volume_profile(prev_day)
        if prev_profile:
            result.prev_poc = prev_profile.poc

    # Current day opening range
    current_day_bars = days[-1]
    if len(current_day_bars) >= or_minutes:
        or_bars = current_day_bars[:or_minutes]
        result.opening_range_high = max(b.high for b in or_bars)
        result.opening_range_low = min(b.low for b in or_bars)

    # Overnight (last 2 hours of previous day if available - simplified)
    if len(days) >= 2:
        prev_day = days[-2]
        if len(prev_day) > 30:
            overnight_bars = prev_day[-30:]
            result.overnight_high = max(b.high for b in overnight_bars)
            result.overnight_low = min(b.low for b in overnight_bars)

    return result

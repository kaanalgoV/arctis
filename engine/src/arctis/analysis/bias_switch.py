"""Bias-Switch Level: the single price level where the daily bias would flip.

Priority chain:
  1. Most recent defended swing (touched 2+ times after initial formation)
  2. Formation level  (most recent identifiable swing high or low)
  3. Key zone boundary (VAH or VAL from today's volume profile)
  4. Asia session extreme (highest high / lowest low of the 18:00-08:30 ET window)
"""

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta

from arctis.models import OHLCVBar
from arctis.analysis.structure import detect_swings, SwingType
from arctis.analysis.volume_profile import build_volume_profile

# Asia session in UTC: 23:00 - 08:30 next day (roughly 18:00 - 03:30 ET)
_ASIA_START_UTC_HOUR = 23
_ASIA_END_UTC_HOUR = 8
_ASIA_END_UTC_MINUTE = 30

_DEFENSE_TOLERANCE = 2.0   # price within ±2 pts of swing counts as a "touch"
_MIN_DEFENSES = 2           # number of touches required for "defended" classification


@dataclass
class BiasSwitchLevel:
    level: float
    type: str         # "structural_point" | "formation" | "key_zone" | "asia_extreme"
    confidence: str   # "high" | "medium" | "low"
    description: str


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _count_touches(price: float, bars: list[OHLCVBar], tolerance: float) -> int:
    """Count bars whose high-low range comes within *tolerance* of *price*."""
    count = 0
    for bar in bars:
        if bar.low - tolerance <= price <= bar.high + tolerance:
            count += 1
    return count


def _find_defended_swing(bars: list[OHLCVBar]) -> float | None:
    """Return the most recent swing price that was tested >= _MIN_DEFENSES times.

    'Most recent' is determined by the swing's bar index (latest first).
    Only bars that come *after* the swing itself are used as test bars.
    """
    swings = detect_swings(bars, lookback=5)
    if not swings:
        return None

    # Iterate from most-recent swing to oldest.
    for swing in reversed(swings):
        subsequent = bars[swing.index + 1 :]
        touches = _count_touches(swing.price, subsequent, _DEFENSE_TOLERANCE)
        if touches >= _MIN_DEFENSES:
            return swing.price

    return None


def _find_formation_level(bars: list[OHLCVBar]) -> float | None:
    """Return the price of the most recent swing high or low (formation level)."""
    swings = detect_swings(bars, lookback=5)
    if not swings:
        return None
    return swings[-1].price  # sorted by index; last = most recent


def _find_key_zone(bars: list[OHLCVBar]) -> float | None:
    """Return the nearest Value Area boundary (VAH or VAL) to the last close."""
    profile = build_volume_profile(bars)
    if profile is None:
        return None

    last_close = bars[-1].close
    dist_vah = abs(last_close - profile.vah)
    dist_val = abs(last_close - profile.val)

    return profile.vah if dist_vah <= dist_val else profile.val


def _is_asia_bar(bar: OHLCVBar) -> bool:
    """Return True if this bar falls inside the Asia session window (UTC)."""
    dt = datetime.fromtimestamp(bar.timestamp, tz=timezone.utc)
    hour, minute = dt.hour, dt.minute
    time_val = hour * 60 + minute

    # 23:00+ or before 08:30
    asia_start = _ASIA_START_UTC_HOUR * 60
    asia_end = _ASIA_END_UTC_HOUR * 60 + _ASIA_END_UTC_MINUTE

    return time_val >= asia_start or time_val < asia_end


def _find_asia_extreme(bars: list[OHLCVBar]) -> float | None:
    """Return the Asia extreme (high or low) closest to the last close.

    Scans only the last 24 hours of data for the Asia window.
    """
    if not bars:
        return None

    cutoff = bars[-1].timestamp - 86400  # last 24 h
    asia_bars = [b for b in bars if b.timestamp >= cutoff and _is_asia_bar(b)]

    if not asia_bars:
        return None

    last_close = bars[-1].close
    asia_high = max(b.high for b in asia_bars)
    asia_low = min(b.low for b in asia_bars)

    if abs(last_close - asia_high) <= abs(last_close - asia_low):
        return asia_high
    return asia_low


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_bias_switch(bars: list[OHLCVBar]) -> BiasSwitchLevel | None:
    """Calculate the single price level where the current bias would flip.

    The function walks through a priority chain and returns the first level
    it can determine.  Returns None only when not enough data is available
    for any method (very short bar series).

    Args:
        bars: Chronologically ordered OHLCV bars.

    Returns:
        A BiasSwitchLevel or None if data is insufficient.
    """
    if len(bars) < 10:
        return None

    # 1. Defended swing -------------------------------------------------------
    defended = _find_defended_swing(bars)
    if defended is not None:
        return BiasSwitchLevel(
            level=defended,
            type="structural_point",
            confidence="high",
            description=(
                f"Defended swing at {defended:.2f} — tested {_MIN_DEFENSES}+ times; "
                "break would confirm bias flip."
            ),
        )

    # 2. Formation level ------------------------------------------------------
    formation = _find_formation_level(bars)
    if formation is not None:
        return BiasSwitchLevel(
            level=formation,
            type="formation",
            confidence="medium",
            description=(
                f"Most recent swing formation at {formation:.2f}; "
                "reclaim or break determines directional intent."
            ),
        )

    # 3. Key zone boundary ----------------------------------------------------
    key_zone = _find_key_zone(bars)
    if key_zone is not None:
        return BiasSwitchLevel(
            level=key_zone,
            type="key_zone",
            confidence="medium",
            description=(
                f"Value Area boundary at {key_zone:.2f}; "
                "acceptance outside redefines the auction."
            ),
        )

    # 4. Asia session extreme -------------------------------------------------
    asia = _find_asia_extreme(bars)
    if asia is not None:
        return BiasSwitchLevel(
            level=asia,
            type="asia_extreme",
            confidence="low",
            description=(
                f"Asia session extreme at {asia:.2f}; "
                "used as fallback reference in absence of structural levels."
            ),
        )

    return None

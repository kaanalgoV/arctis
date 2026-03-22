"""60% Correction Monitor — tracks how deep the current pullback is relative to the last impulse."""

from dataclasses import dataclass

from arctis.models import OHLCVBar
from arctis.analysis.structure import SwingType, detect_swings

# Minimum bars required to find meaningful swings
_MIN_BARS = 15

# Correction depth threshold that signals a potential trend-change threat
_THREAT_THRESHOLD_PCT = 60.0

# Default swing lookback (passed through to detect_swings)
_DEFAULT_LOOKBACK = 5


@dataclass
class CorrectionStatus:
    impulse_size: float         # absolute price distance of the last impulse move
    correction_size: float      # absolute price distance of the current correction
    correction_pct: float       # correction as a percentage of impulse (0–100+)
    is_threat: bool             # True when correction_pct > 60
    impulse_direction: str      # "up" or "down"


def monitor_correction(
    bars: list[OHLCVBar],
    lookback: int = _DEFAULT_LOOKBACK,
) -> CorrectionStatus | None:
    """Find the last impulse move and measure the current correction depth.

    Strategy:
      1. Detect all swing highs and lows in `bars` using `detect_swings`.
      2. Identify the most recent completed impulse leg: the last pair of
         consecutive swing points that moved in the same direction.
         - Upward impulse:   last swing low  → last swing high  (high after low)
         - Downward impulse: last swing high → last swing low   (low after high)
      3. Measure correction as the distance price has retraced from the
         impulse endpoint toward the impulse origin.
         The current price is taken as the close of the final bar.

    Args:
        bars:     Ordered list of OHLCVBar (at least ~15 bars recommended).
        lookback: Swing detection lookback window (default 5).

    Returns:
        CorrectionStatus, or None when bars are too few / no impulse is found.
    """
    if not bars or len(bars) < _MIN_BARS:
        return None

    swings = detect_swings(bars, lookback=lookback)

    if len(swings) < 2:
        return None

    # Find the last swing high and last swing low, respecting chronological order
    swing_highs = [s for s in swings if s.type == SwingType.HIGH]
    swing_lows = [s for s in swings if s.type == SwingType.LOW]

    if not swing_highs or not swing_lows:
        return None

    last_high = swing_highs[-1]
    last_low = swing_lows[-1]

    # Determine which completed impulse is more recent
    # Case A: low comes before high  →  upward impulse (low → high)
    # Case B: high comes before low  →  downward impulse (high → low)
    if last_low.index < last_high.index:
        # Upward impulse: from last_low to last_high
        impulse_origin = last_low.price
        impulse_end = last_high.price
        impulse_size = impulse_end - impulse_origin
        impulse_direction = "up"
        # Current correction: how far has price fallen from the impulse high?
        current_price = bars[-1].close
        correction_size = max(0.0, impulse_end - current_price)
    else:
        # Downward impulse: from last_high to last_low
        impulse_origin = last_high.price
        impulse_end = last_low.price
        impulse_size = impulse_origin - impulse_end
        impulse_direction = "down"
        # Current correction: how far has price risen from the impulse low?
        current_price = bars[-1].close
        correction_size = max(0.0, current_price - impulse_end)

    if impulse_size <= 0:
        return None

    correction_pct = (correction_size / impulse_size) * 100.0

    return CorrectionStatus(
        impulse_size=round(impulse_size, 4),
        correction_size=round(correction_size, 4),
        correction_pct=round(correction_pct, 2),
        is_threat=correction_pct > _THREAT_THRESHOLD_PCT,
        impulse_direction=impulse_direction,
    )

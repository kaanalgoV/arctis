"""5-state Bias System: classifies market context into LONG / RANGE_LONG / RANGE /
RANGE_SHORT / SHORT based on five weighted components.
"""

from dataclasses import dataclass, field
from enum import Enum

from arctis.models import OHLCVBar


class BiasState(str, Enum):
    LONG = "LONG"
    RANGE_LONG = "RANGE_LONG"
    RANGE = "RANGE"
    RANGE_SHORT = "RANGE_SHORT"
    SHORT = "SHORT"


@dataclass
class BiasResult:
    state: BiasState
    score: int                         # -10 to +10  (sum of 5 components each -2..+2)
    components: dict[str, int] = field(default_factory=dict)
    # keys: "trend", "velocity", "auction", "vwap", "ema"


# ---------------------------------------------------------------------------
# Component scoring helpers
# ---------------------------------------------------------------------------

_TREND_SCORES: dict[str, int] = {
    "up": 2,
    "bullish": 2,
    "range_up": 1,
    "range": 0,
    "range_down": -1,
    "bearish": -2,
    "down": -2,
}

_AUCTION_SCORES: dict[str, int] = {
    "stark": 2,
    "gut": 1,
    "moderat": 0,
    "schwach": -1,
    "stark_bärisch": -2,
    "stark_bearish": -2,
}

_VWAP_SCORES: dict[str, int] = {
    "weit_oben": 2,
    "above": 2,
    "oben": 1,
    "at": 0,
    "unten": -1,
    "below": -2,
    "weit_unten": -2,
}

_EMA_SCORES: dict[str, int] = {
    "bullish": 2,
    "aligned_up": 2,
    "slightly_bullish": 1,
    "mixed": 0,
    "slightly_bearish": -1,
    "bearish": -2,
    "aligned_down": -2,
}


def _score_trend(trend: str) -> int:
    """Map trend string to -2..+2 component score."""
    return _TREND_SCORES.get(trend.lower(), 0)


def _score_velocity(velocity_scale: int) -> int:
    """Map velocity_scale (1-10) to -2..+2 component score.

    The caller supplies a signed integer:
      positive = bullish momentum, negative = bearish momentum.
      |value| 1-3  -> ±1
      |value| 4-6  -> ±1
      |value| 7-10 -> ±2
      Default: 0 for scale == 0 or out of [-10, 10].
    """
    clamped = max(-10, min(10, velocity_scale))
    if clamped == 0:
        return 0
    magnitude = abs(clamped)
    sign = 1 if clamped > 0 else -1
    if magnitude >= 7:
        return sign * 2
    elif magnitude >= 4:
        return sign * 1
    else:
        return sign * 1


def _score_auction(auction_quality: str) -> int:
    """Map auction quality descriptor to -2..+2 component score."""
    return _AUCTION_SCORES.get(auction_quality.lower(), 0)


def _score_vwap(vwap_position: str) -> int:
    """Map VWAP position descriptor to -2..+2 component score."""
    return _VWAP_SCORES.get(vwap_position.lower(), 0)


def _score_ema(ema_alignment: str) -> int:
    """Map EMA alignment descriptor to -2..+2 component score."""
    return _EMA_SCORES.get(ema_alignment.lower(), 0)


def _state_from_score(score: int) -> BiasState:
    """Convert aggregate score to one of the five bias states.

    Thresholds:
      >=  5  -> LONG
       2..4  -> RANGE_LONG
      -1..1  -> RANGE
      -4..-2 -> RANGE_SHORT
      <= -5  -> SHORT
    """
    if score >= 5:
        return BiasState.LONG
    elif score >= 2:
        return BiasState.RANGE_LONG
    elif score >= -1:
        return BiasState.RANGE
    elif score >= -4:
        return BiasState.RANGE_SHORT
    else:
        return BiasState.SHORT


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_bias_state(
    bars: list[OHLCVBar],
    trend: str = "range",
    velocity_scale: int = 0,
    auction_quality: str = "moderat",
    vwap_position: str = "at",
    ema_alignment: str = "mixed",
) -> BiasResult:
    """Calculate the current 5-state bias.

    Each component contributes -2 to +2 to the aggregate score.  The sum of
    all five components (-10 to +10) determines the final BiasState.

    Args:
        bars:             OHLCV bars (currently unused but kept for future
                          automatic component derivation).
        trend:            Trend descriptor.  Accepted values: "up", "bullish",
                          "range_up", "range", "range_down", "bearish", "down".
        velocity_scale:   Signed integer -10..+10.  Positive = bullish momentum,
                          negative = bearish.  Magnitude controls score strength.
        auction_quality:  Auction quality.  Accepted values: "stark", "gut",
                          "moderat", "schwach", "stark_bärisch".
        vwap_position:    Price vs. VWAP.  Accepted values: "weit_oben",
                          "above", "oben", "at", "unten", "below", "weit_unten".
        ema_alignment:    EMA stack orientation.  Accepted values: "bullish",
                          "aligned_up", "slightly_bullish", "mixed",
                          "slightly_bearish", "bearish", "aligned_down".

    Returns:
        BiasResult with state, aggregate score, and per-component breakdown.
    """
    trend_sc = _score_trend(trend)
    vel_sc = _score_velocity(velocity_scale)
    auction_sc = _score_auction(auction_quality)
    vwap_sc = _score_vwap(vwap_position)
    ema_sc = _score_ema(ema_alignment)

    total = trend_sc + vel_sc + auction_sc + vwap_sc + ema_sc

    return BiasResult(
        state=_state_from_score(total),
        score=total,
        components={
            "trend": trend_sc,
            "velocity": vel_sc,
            "auction": auction_sc,
            "vwap": vwap_sc,
            "ema": ema_sc,
        },
    )

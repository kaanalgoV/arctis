"""Double Fake Exhaustion — two failed breakout attempts at the same level with declining velocity.

ALGOVIEW CALIBRATION — two strategies tracked, results differ significantly:

  travis_double_fake_nq (profitable):
    Win Rate:      45.8%
    Profit Factor: 1.74
    Avg R:R:       1.98
    Sample size:   48 trades (NQ Aug 2025-Mar 2026) — small sample, use with caution

  kaans_session_bias_nq (standalone Double Fake component, unprofitable):
    Win Rate:      20.0%
    Profit Factor: 0.42
    Sample size:   30 trades
    NOTE: This variant is NOT profitable as a standalone signal.

KEY INSIGHT: The Arctis variant (stricter entry conditions, more confluence)
produces a viable edge (PF 1.74). The standalone session-bias variant does not.
Always use confluence confirmation — volume exhaustion + level confluence.

DATA SOURCE: Arctis TimescaleDB, NQ Aug 2025-Mar 2026
"""

from dataclasses import dataclass, field

from arctis.models import OHLCVBar

# Bars to look back when computing per-attempt average velocity
_VELOCITY_LOOKBACK = 5

# Minimum velocity decline between attempt N and attempt N+1 (as ratio)
# e.g. 0.1 means attempt 2 must be at least 10% slower than attempt 1
_MIN_VELOCITY_DECLINE = 0.05

# Minimum bars required for any analysis
_MIN_BARS = 6

# Maximum bars a single attempt may occupy (how quickly it must fail)
_MAX_ATTEMPT_DURATION = 10

# A bar "touches" the level when its high (upside attempt) or low (downside
# attempt) comes within `tolerance` points of `level`.
# The caller supplies `tolerance`; this default is used when resolving direction.
_DEFAULT_TOLERANCE = 5.0


@dataclass
class AttemptInfo:
    time: int       # timestamp of the touching bar
    price: float    # exact high/low that challenged the level
    velocity: float # average absolute bar move over the preceding lookback bars


@dataclass
class DoubleFakeResult:
    detected: bool
    direction: str              # "long" = level is resistance (failed upside breaks)
                                # "short" = level is support (failed downside breaks)
                                # "" = not detected
    attempts: list[AttemptInfo] = field(default_factory=list)
    confidence: str = "none"    # "high" | "medium" | "none"
    # Arctis-calibrated statistics — travis_double_fake_nq (n=48, NQ Aug 2025-Mar 2026)
    # Only valid when confluence conditions match the Arctis variant (volume + level confluence)
    win_rate: float = 46.0          # 45.8% WR (travis_double_fake_nq)
    profit_factor: float = 1.74     # profitable with strict entry rules
    avg_rr: float = 1.98
    sample_size: int = 48           # small sample — use with caution


def _bar_velocity(bars: list[OHLCVBar], idx: int, lookback: int = _VELOCITY_LOOKBACK) -> float:
    """Average absolute close-to-open move over the `lookback` bars ending at idx (exclusive)."""
    start = max(0, idx - lookback)
    if start >= idx:
        return 0.0
    window = bars[start:idx]
    if not window:
        return 0.0
    return sum(abs(b.close - b.open) for b in window) / len(window)


def detect_double_fake(
    bars: list[OHLCVBar],
    level: float,
    tolerance: float = _DEFAULT_TOLERANCE,
) -> DoubleFakeResult:
    """Find 2+ failed breakout attempts at `level` with declining velocity.

    Algorithm:
      1. For each bar, check whether the bar's high (upside) or low (downside)
         penetrates `level` within `tolerance` points.
      2. A "touch" counts as a new attempt only when the previous attempt has
         ended — i.e. price has retracted back inside the range for at least
         one bar.
      3. Collect up to the first two distinct attempts.
      4. Require the second attempt's velocity to be lower than the first
         (exhaustion signature).

    The direction is inferred from the first attempt:
      - If the bar's high exceeds (level - tolerance), the level acts as
        resistance → direction = "long" (setup for short entry on reversal).
      - If the bar's low is below (level + tolerance), the level acts as
        support → direction = "short" (setup for long entry on reversal).

    Confidence:
      high   — velocity declined by >20% between the two attempts
      medium — velocity declined by 5-20%
      none   — fewer than 2 attempts or velocity did not decline

    Arctis statistics (travis_double_fake_nq, n=48, NQ Aug 2025-Mar 2026):
      Win Rate: 46% | Profit Factor: 1.74 | Avg R:R: 1.98
      Small sample (n=48) — profitable but use with confluence confirmation.
      WARNING: standalone double-fake without confluence (kaans_session_bias_nq)
      produced PF 0.42 (n=30) — NOT profitable. Always require level confluence.

    Args:
        bars:      Ordered list of OHLCVBar (any timeframe, but 1-min typical).
        level:     The price level to test.
        tolerance: Price distance within which a bar is considered to "touch"
                   the level.

    Returns:
        DoubleFakeResult. ``detected=False`` when bars are insufficient or the
        pattern is absent. When detected, ``win_rate``, ``profit_factor``,
        ``avg_rr``, and ``sample_size`` fields carry Arctis-calibrated statistics
        for the Arctis variant (requires additional confluence to be valid).
    """
    _no_result = DoubleFakeResult(detected=False, direction="", attempts=[], confidence="none")

    if not bars or len(bars) < _MIN_BARS:
        return _no_result

    attempts: list[AttemptInfo] = []
    in_attempt = False
    direction: str = ""

    for idx, bar in enumerate(bars):
        touches_resistance = bar.high >= level - tolerance
        touches_support = bar.low <= level + tolerance

        # Determine touch type: resistance first, then support
        if touches_resistance and (not direction or direction == "long"):
            current_touch = "long"
            touch_price = bar.high
        elif touches_support and (not direction or direction == "short"):
            current_touch = "short"
            touch_price = bar.low
        else:
            # No touch this bar — reset in_attempt flag
            in_attempt = False
            continue

        # Lock direction once the first attempt is recorded
        if not direction:
            direction = current_touch

        # Only count a new attempt when we are not already inside one
        if in_attempt:
            continue

        vel = _bar_velocity(bars, idx)
        attempts.append(AttemptInfo(time=bar.timestamp, price=touch_price, velocity=vel))
        in_attempt = True

        # We only need 2 attempts; stop scanning once we have them
        if len(attempts) == 2:
            break

    if len(attempts) < 2:
        return _no_result

    vel_first = attempts[0].velocity
    vel_second = attempts[1].velocity

    if vel_first == 0:
        # Cannot compute decline; treat as no pattern
        return _no_result

    decline_ratio = (vel_first - vel_second) / vel_first  # positive = slower second attempt

    if decline_ratio < _MIN_VELOCITY_DECLINE:
        return _no_result

    if decline_ratio >= 0.20:
        confidence = "high"
    else:
        confidence = "medium"

    return DoubleFakeResult(
        detected=True,
        direction=direction,
        attempts=attempts,
        confidence=confidence,
    )

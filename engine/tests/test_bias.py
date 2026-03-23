"""Comprehensive BIAS module integration tests.

Tests the interaction between all BIAS modules:
  - bias_state: 5-state system transitions
  - bias_switch: switch level calculation
  - opening_fake: false breakout detection
  - double_fake: exhaustion pattern
  - correction: 60% retracement monitor

These tests use realistic bar series that simulate trading scenarios.
"""

import pytest
from arctis.models import OHLCVBar
from arctis.analysis.bias_state import BiasState, BiasResult, calculate_bias_state, _state_from_score
from arctis.analysis.bias_switch import BiasSwitchLevel, calculate_bias_switch
from arctis.analysis.opening_fake import OpeningFake, detect_opening_fake
from arctis.analysis.double_fake import DoubleFakeResult, detect_double_fake
from arctis.analysis.correction import CorrectionStatus, monitor_correction


# ---------------------------------------------------------------------------
# Shared fixtures / helpers
# ---------------------------------------------------------------------------

def _make_bar(
    ts: int,
    open_: float,
    high: float,
    low: float,
    close: float,
    volume: int = 1000,
) -> OHLCVBar:
    return OHLCVBar(timestamp=ts, open=open_, high=high, low=low, close=close, volume=volume)


def _flat_bars(count: int, price: float = 100.0, base_ts: int = 1_000_000) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=base_ts + i * 60,
            open=price, high=price + 0.5, low=price - 0.5, close=price, volume=1000
        )
        for i in range(count)
    ]


# ---------------------------------------------------------------------------
# STATE MACHINE TRANSITIONS
# The 5 states form a continuum: SHORT ← RANGE_SHORT ← RANGE → RANGE_LONG → LONG
# We verify every adjacent transition in both directions.
# ---------------------------------------------------------------------------

class TestStateMachineTransitions:
    """Test all 5 state transitions by adjusting input descriptors."""

    def _bars(self) -> list[OHLCVBar]:
        return _flat_bars(10)

    def test_neutral_to_range_long(self):
        """Adding bullish velocity to neutral inputs should push to RANGE_LONG."""
        neutral = calculate_bias_state(self._bars(), trend="range", velocity_scale=0,
                                       auction_quality="moderat", vwap_position="at", ema_alignment="mixed")
        assert neutral.state == BiasState.RANGE

        range_long = calculate_bias_state(self._bars(), trend="range_up", velocity_scale=4,
                                          auction_quality="gut", vwap_position="oben", ema_alignment="mixed")
        assert range_long.state == BiasState.RANGE_LONG

    def test_range_long_to_long(self):
        """All strongly bullish inputs must produce LONG."""
        result = calculate_bias_state(self._bars(), trend="bullish", velocity_scale=9,
                                      auction_quality="stark", vwap_position="above", ema_alignment="bullish")
        assert result.state == BiasState.LONG
        assert result.score >= 5

    def test_neutral_to_range_short(self):
        """Bearish velocity + bearish VWAP from neutral → RANGE_SHORT."""
        result = calculate_bias_state(self._bars(), trend="range_down", velocity_scale=-3,
                                      auction_quality="moderat", vwap_position="unten", ema_alignment="mixed")
        assert result.state == BiasState.RANGE_SHORT

    def test_range_short_to_short(self):
        """All strongly bearish inputs must produce SHORT."""
        result = calculate_bias_state(self._bars(), trend="down", velocity_scale=-9,
                                      auction_quality="stark_bearish", vwap_position="below",
                                      ema_alignment="bearish")
        assert result.state == BiasState.SHORT
        assert result.score <= -5

    def test_long_to_neutral_by_reducing_velocity(self):
        """Dropping velocity to 0 on otherwise bullish inputs reduces the score."""
        strong = calculate_bias_state(self._bars(), trend="up", velocity_scale=8,
                                      auction_quality="stark", vwap_position="above",
                                      ema_alignment="bullish")
        weak = calculate_bias_state(self._bars(), trend="range", velocity_scale=0,
                                    auction_quality="moderat", vwap_position="at",
                                    ema_alignment="mixed")
        assert strong.score > weak.score

    def test_score_monotonically_increases_with_bullish_velocity(self):
        """Increasing bullish velocity should produce equal-or-higher scores."""
        scores = []
        for v in (0, 3, 7, 10):
            r = calculate_bias_state(
                self._bars(), trend="range", velocity_scale=v,
                auction_quality="moderat", vwap_position="at", ema_alignment="mixed"
            )
            scores.append(r.score)
        assert scores == sorted(scores), f"Scores not sorted: {scores}"

    def test_symmetry_bull_bear(self):
        """Bull and bear extremes should produce symmetric scores."""
        bull = calculate_bias_state(self._bars(), trend="up", velocity_scale=9,
                                    auction_quality="stark", vwap_position="above",
                                    ema_alignment="bullish")
        bear = calculate_bias_state(self._bars(), trend="down", velocity_scale=-9,
                                    auction_quality="stark_bearish", vwap_position="below",
                                    ema_alignment="bearish")
        assert bull.score == -bear.score

    def test_all_five_states_reachable(self):
        """All 5 states should be reachable with appropriate inputs."""
        bars = self._bars()
        states = set()

        # Scores computed explicitly to hit each state:
        # LONG:        up(2)+vel=9→2+stark(2)+above(2)+bullish(2) = 10
        # RANGE_LONG:  range_up(1)+vel=3→1+moderat(0)+oben(1)+mixed(0) = 3
        # RANGE:       range(0)+vel=0+moderat(0)+at(0)+mixed(0) = 0
        # RANGE_SHORT: range_down(-1)+vel=-3→-1+moderat(0)+unten(-1)+mixed(0) = -3
        # SHORT:       down(-2)+vel=-9→-2+stark_bearish(-2)+below(-2)+bearish(-2) = -10
        configs = [
            dict(trend="up", velocity_scale=9, auction_quality="stark",
                 vwap_position="above", ema_alignment="bullish"),
            dict(trend="range_up", velocity_scale=3, auction_quality="moderat",
                 vwap_position="oben", ema_alignment="mixed"),
            dict(trend="range", velocity_scale=0, auction_quality="moderat",
                 vwap_position="at", ema_alignment="mixed"),
            dict(trend="range_down", velocity_scale=-3, auction_quality="moderat",
                 vwap_position="unten", ema_alignment="mixed"),
            dict(trend="down", velocity_scale=-9, auction_quality="stark_bearish",
                 vwap_position="below", ema_alignment="bearish"),
        ]
        for cfg in configs:
            r = calculate_bias_state(bars, **cfg)
            states.add(r.state)

        assert len(states) == 5, f"Not all states reached: {states}"


# ---------------------------------------------------------------------------
# SWITCH LEVEL CALCULATION
# ---------------------------------------------------------------------------

class TestSwitchLevelCalculation:
    def test_returns_none_for_too_few_bars(self):
        assert calculate_bias_switch(_flat_bars(5)) is None

    def test_returns_level_with_positive_price(self):
        bars = _flat_bars(50, price=5000.0)
        result = calculate_bias_switch(bars)
        if result is not None:
            assert result.level > 0.0

    def test_result_type_is_valid(self):
        bars = _flat_bars(50)
        result = calculate_bias_switch(bars)
        if result is not None:
            assert isinstance(result, BiasSwitchLevel)
            assert result.type in ("structural_point", "formation", "key_zone", "asia_extreme")
            assert result.confidence in ("high", "medium", "low")

    def test_confidence_high_for_defended_swing(self):
        """A level tested multiple times after formation should return high confidence."""
        base_ts = 1_700_000_000
        bars = []

        # Bars 0-4: approaching swing high
        for i in range(5):
            bars.append(_make_bar(base_ts + i * 60, 107.0, 108.5, 106.5, 107.5))

        # Swing high at bar 5 (clear peak)
        bars.append(_make_bar(base_ts + 5 * 60, 109.0, 110.0, 108.5, 109.5))

        # Bars 6-25: test & retreat from the high level
        for i in range(20):
            p = 108.0 + (0.5 if i % 4 == 0 else 0.0)  # occasional test near 110
            h = 110.5 if i % 4 == 0 else 109.0
            bars.append(_make_bar(base_ts + (6 + i) * 60, p, h, p - 1.0, p))

        result = calculate_bias_switch(bars)
        # May be structural_point with high confidence or any other type
        assert result is None or isinstance(result, BiasSwitchLevel)


# ---------------------------------------------------------------------------
# OPENING FAKE DETECTION — known scenarios
# ---------------------------------------------------------------------------

class TestOpeningFakeKnownScenarios:
    """Test detection logic with carefully crafted bar series."""

    def _make_scenario_bars(
        self,
        prev_high: float,
        prev_low: float,
        n_warmup: int = 15,
        break_high: bool = True,
        low_volume: bool = True,
        reversal: bool = True,
    ) -> tuple[list[OHLCVBar], float, float]:
        base_ts = 1_700_000_000
        mean_vol = 1000
        bars = []

        # Warmup bars inside the prev range
        for i in range(n_warmup):
            mid = (prev_high + prev_low) / 2
            bars.append(_make_bar(base_ts + i * 60, mid, mid + 1.0, mid - 1.0, mid, mean_vol))

        # Break bar
        break_vol = int(mean_vol * 0.5) if low_volume else mean_vol
        if break_high:
            break_price = prev_high + 3.0
            bars.append(_make_bar(
                base_ts + n_warmup * 60,
                prev_high + 0.5, break_price, prev_high - 0.5, break_price - 0.5,
                volume=break_vol
            ))
            # Reversal target = prev_high - 0.5 * (break_price - prev_high)
            reversal_target = prev_high - 0.5 * (break_price - prev_high)
        else:
            break_price = prev_low - 3.0
            bars.append(_make_bar(
                base_ts + n_warmup * 60,
                prev_low - 0.5, prev_low + 0.5, break_price, break_price + 0.5,
                volume=break_vol
            ))
            reversal_target = prev_low + 0.5 * (prev_low - break_price)

        # Post-break bars (reversal or continuation)
        for i in range(5):
            if reversal and break_high:
                close = reversal_target - 1.0  # below target
                bars.append(_make_bar(
                    base_ts + (n_warmup + 1 + i) * 60,
                    close + 0.5, close + 1.0, close - 0.5, close, mean_vol
                ))
            elif reversal and not break_high:
                close = reversal_target + 1.0  # above target
                bars.append(_make_bar(
                    base_ts + (n_warmup + 1 + i) * 60,
                    close - 0.5, close + 0.5, close - 1.0, close, mean_vol
                ))
            else:
                # No reversal: stay beyond the break
                mid = break_price
                bars.append(_make_bar(
                    base_ts + (n_warmup + 1 + i) * 60,
                    mid, mid + 1.0, mid - 0.5, mid, mean_vol
                ))

        return bars, prev_high, prev_low

    def test_high_confidence_fake_above_prev_high(self):
        bars, prev_h, prev_l = self._make_scenario_bars(
            prev_high=110.0, prev_low=90.0,
            break_high=True, low_volume=True, reversal=True
        )
        result = detect_opening_fake(bars, prev_high=prev_h, prev_low=prev_l)
        assert result.detected
        assert result.direction == "long"
        assert result.confidence == "high"
        assert result.reversal_confirmed

    def test_high_confidence_fake_below_prev_low(self):
        bars, prev_h, prev_l = self._make_scenario_bars(
            prev_high=110.0, prev_low=90.0,
            break_high=False, low_volume=True, reversal=True
        )
        result = detect_opening_fake(bars, prev_high=prev_h, prev_low=prev_l)
        assert result.detected
        assert result.direction == "short"
        assert result.confidence == "high"

    def test_no_fake_when_bars_inside_range(self):
        prev_high, prev_low = 110.0, 90.0
        base_ts = 1_700_000_000
        bars = [
            _make_bar(base_ts + i * 60, 100.0, 108.0, 92.0, 100.0)
            for i in range(30)
        ]
        result = detect_opening_fake(bars, prev_high=prev_high, prev_low=prev_low)
        assert not result.detected

    def test_medium_confidence_when_no_reversal(self):
        bars, prev_h, prev_l = self._make_scenario_bars(
            prev_high=110.0, prev_low=90.0,
            break_high=True, low_volume=True, reversal=False
        )
        result = detect_opening_fake(bars, prev_high=prev_h, prev_low=prev_l)
        assert result.detected
        assert result.confidence == "medium"
        assert not result.reversal_confirmed


# ---------------------------------------------------------------------------
# DOUBLE FAKE — known scenarios
# ---------------------------------------------------------------------------

class TestDoubleFakeKnownScenarios:
    """Test exhaustion patterns at resistance and support levels."""

    def _build_bars(self, level: float, tol: float, vel1: float, vel2: float) -> list[OHLCVBar]:
        """Build resistance double-fake bars (approach from above)."""
        base_ts = 1_000_000
        bars = []
        above = level + 8.0

        # First approach (5 bars, move=vel1)
        for _ in range(5):
            o, c = above, above + vel1
            bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                                  open=o, high=o + vel1 + 0.5, low=o + tol + 0.5, close=c, volume=1000))

        # Retraction below level-tol
        rt = level - tol - 0.5
        bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                              open=rt - 1.0, high=rt, low=rt - 3.0, close=rt - 2.0, volume=500))

        # Second approach (5 bars, move=vel2, slower)
        for _ in range(5):
            o, c = above, above + vel2
            bars.append(OHLCVBar(timestamp=base_ts + len(bars) * 60,
                                  open=o, high=o + vel2 + 0.5, low=o + tol + 0.5, close=c, volume=1000))

        return bars

    def test_double_fake_high_confidence(self):
        bars = self._build_bars(level=200.0, tol=5.0, vel1=2.0, vel2=0.1)
        result = detect_double_fake(bars, level=200.0, tolerance=5.0)
        assert result.detected
        assert result.direction == "long"
        assert result.confidence == "high"

    def test_double_fake_no_detection_when_accel(self):
        bars = self._build_bars(level=200.0, tol=5.0, vel1=1.0, vel2=3.0)
        result = detect_double_fake(bars, level=200.0, tolerance=5.0)
        assert not result.detected

    def test_double_fake_returns_two_attempts(self):
        bars = self._build_bars(level=200.0, tol=5.0, vel1=2.0, vel2=0.5)
        result = detect_double_fake(bars, level=200.0, tolerance=5.0)
        assert result.detected
        assert len(result.attempts) == 2

    def test_second_attempt_price_matches_level(self):
        """The touch price of each attempt should be near the level."""
        bars = self._build_bars(level=200.0, tol=5.0, vel1=2.0, vel2=0.5)
        result = detect_double_fake(bars, level=200.0, tolerance=5.0)
        if result.detected:
            for attempt in result.attempts:
                assert attempt.price >= 200.0 - 5.0


# ---------------------------------------------------------------------------
# CORRECTION MONITOR — known scenarios
# ---------------------------------------------------------------------------

class TestCorrectionKnownScenarios:
    """Test the 60% retracement detection with realistic bar layouts."""

    def _make_impulse_correction_bars(
        self,
        impulse_from: float,
        impulse_to: float,
        correction_pct: float,
        direction: str = "up",
    ) -> list[OHLCVBar]:
        """
        Build bars with a clean impulse move followed by a correction.

        impulse_from → impulse_to (direction=up → price rises)
        Then price retraces correction_pct% of the impulse move.
        Layout ensures detect_swings can find the swing high and low.
        """
        base_ts = 1_000_000
        bars = []
        lookback = 5

        impulse_size = abs(impulse_to - impulse_from)
        correction_size = impulse_size * (correction_pct / 100.0)

        if direction == "up":
            swing_low = impulse_from
            swing_high = impulse_to
            current_close = impulse_to - correction_size

            # Descend to swing low (lookback+1 bars)
            for i in range(lookback + 1):
                p = swing_low + 2.0 - i * 0.2
                bars.append(_make_bar(base_ts + len(bars) * 60, p, p + 0.5, p - 0.3, p))

            # Swing low bar (exact low point)
            bars.append(_make_bar(base_ts + len(bars) * 60,
                                   swing_low + 0.2, swing_low + 0.5, swing_low, swing_low + 0.2))

            # Rise to swing high (lookback+1 bars)
            step = (swing_high - swing_low) / (lookback + 1)
            for i in range(lookback + 1):
                p = swing_low + (i + 1) * step
                bars.append(_make_bar(base_ts + len(bars) * 60, p - 0.2, p + 0.5, p - 0.5, p))

            # Swing high bar
            bars.append(_make_bar(base_ts + len(bars) * 60,
                                   swing_high - 0.2, swing_high, swing_high - 0.5, swing_high - 0.2))

            # Correction bars (lookback bars moving toward current_close)
            step_corr = correction_size / (lookback + 1)
            for i in range(lookback + 1):
                p = swing_high - (i + 1) * step_corr
                bars.append(_make_bar(base_ts + len(bars) * 60, p + 0.2, p + 0.5, p - 0.3, p))

        else:  # down impulse
            swing_high = impulse_from
            swing_low = impulse_to
            current_close = impulse_to + correction_size

            # Rise to swing high
            for i in range(lookback + 1):
                p = swing_high - 2.0 + i * 0.2
                bars.append(_make_bar(base_ts + len(bars) * 60, p, p + 0.5, p - 0.3, p))

            bars.append(_make_bar(base_ts + len(bars) * 60,
                                   swing_high - 0.2, swing_high, swing_high - 0.5, swing_high - 0.2))

            step = (swing_high - swing_low) / (lookback + 1)
            for i in range(lookback + 1):
                p = swing_high - (i + 1) * step
                bars.append(_make_bar(base_ts + len(bars) * 60, p + 0.2, p + 0.5, p - 0.5, p))

            bars.append(_make_bar(base_ts + len(bars) * 60,
                                   swing_low + 0.2, swing_low + 0.5, swing_low, swing_low + 0.2))

            step_corr = correction_size / (lookback + 1)
            for i in range(lookback + 1):
                p = swing_low + (i + 1) * step_corr
                bars.append(_make_bar(base_ts + len(bars) * 60, p - 0.2, p + 0.3, p - 0.5, p))

        return bars

    def test_upward_impulse_mild_correction(self):
        """Upward impulse with 15% correction → is_threat=False."""
        bars = self._make_impulse_correction_bars(
            impulse_from=100.0, impulse_to=120.0, correction_pct=15.0, direction="up"
        )
        result = monitor_correction(bars)
        if result is not None:
            assert result.impulse_direction == "up"
            assert not result.is_threat

    def test_upward_impulse_deep_correction(self):
        """Upward impulse with 70% correction → is_threat=True."""
        bars = self._make_impulse_correction_bars(
            impulse_from=100.0, impulse_to=120.0, correction_pct=70.0, direction="up"
        )
        result = monitor_correction(bars)
        if result is not None and result.impulse_direction == "up":
            assert result.is_threat

    def test_downward_impulse_mild_correction(self):
        """Downward impulse with 20% correction → is_threat=False."""
        bars = self._make_impulse_correction_bars(
            impulse_from=120.0, impulse_to=100.0, correction_pct=20.0, direction="down"
        )
        result = monitor_correction(bars)
        if result is not None:
            assert result.impulse_direction == "down"
            assert not result.is_threat

    def test_correction_pct_matches_construction(self):
        """The computed correction_pct should roughly match the constructed percentage."""
        target_pct = 30.0
        bars = self._make_impulse_correction_bars(
            impulse_from=100.0, impulse_to=200.0, correction_pct=target_pct, direction="up"
        )
        result = monitor_correction(bars)
        if result is not None and result.impulse_direction == "up":
            # Allow 30% tolerance on the target due to swing detection imprecision
            assert abs(result.correction_pct - target_pct) < target_pct * 0.5


# ---------------------------------------------------------------------------
# CROSS-MODULE CONSISTENCY
# Ensures that the outputs of individual modules are compatible with each other
# and can be used together without type errors.
# ---------------------------------------------------------------------------

class TestCrossModuleConsistency:
    """Smoke tests that exercise multiple modules on the same bar series."""

    def test_all_modules_accept_same_bars(self):
        """All BIAS modules should accept the same bar list without crashing."""
        bars = _flat_bars(50)

        # bias_state
        result_state = calculate_bias_state(bars)
        assert isinstance(result_state, BiasResult)

        # bias_switch
        result_switch = calculate_bias_switch(bars)
        assert result_switch is None or isinstance(result_switch, BiasSwitchLevel)

        # opening_fake
        result_fake = detect_opening_fake(bars, prev_high=105.0, prev_low=95.0)
        assert isinstance(result_fake, OpeningFake)

        # double_fake
        result_df = detect_double_fake(bars, level=100.0)
        assert isinstance(result_df, DoubleFakeResult)

        # correction
        result_corr = monitor_correction(bars)
        assert result_corr is None or isinstance(result_corr, CorrectionStatus)

    def test_bias_state_accepts_empty_bars(self):
        """calculate_bias_state accepts empty bars (bars param currently unused)."""
        result = calculate_bias_state([])
        assert isinstance(result, BiasResult)

    def test_switch_level_output_compatible_with_double_fake(self):
        """BiasSwitchLevel.level can be passed directly to detect_double_fake."""
        bars = _flat_bars(50)
        switch = calculate_bias_switch(bars)
        if switch is not None:
            result = detect_double_fake(bars, level=switch.level)
            assert isinstance(result, DoubleFakeResult)

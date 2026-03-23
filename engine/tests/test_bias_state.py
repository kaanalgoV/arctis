"""Tests for the 5-state bias system."""

import pytest
from arctis.models import OHLCVBar
from arctis.analysis.bias_state import (
    BiasState,
    BiasResult,
    calculate_bias_state,
    _score_trend,
    _score_velocity,
    _score_auction,
    _score_vwap,
    _score_ema,
    _state_from_score,
)


def _make_bars(count: int = 5) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            timestamp=1_000_000 + i * 60,
            open=100.0,
            high=101.0,
            low=99.0,
            close=100.5,
            volume=1000,
        )
        for i in range(count)
    ]


# ---------------------------------------------------------------------------
# Component scoring helpers
# ---------------------------------------------------------------------------

class TestScoreTrend:
    def test_bullish_labels_score_positive(self):
        assert _score_trend("up") == 2
        assert _score_trend("bullish") == 2
        assert _score_trend("range_up") == 1

    def test_bearish_labels_score_negative(self):
        assert _score_trend("down") == -2
        assert _score_trend("bearish") == -2
        assert _score_trend("range_down") == -1

    def test_neutral_label_scores_zero(self):
        assert _score_trend("range") == 0

    def test_unknown_label_scores_zero(self):
        assert _score_trend("sideways") == 0

    def test_case_insensitive(self):
        assert _score_trend("UP") == 2
        assert _score_trend("BULLISH") == 2


class TestScoreVelocity:
    def test_zero_returns_zero(self):
        assert _score_velocity(0) == 0

    def test_high_positive_magnitude_returns_plus_two(self):
        for v in (7, 8, 9, 10):
            assert _score_velocity(v) == 2

    def test_low_positive_magnitude_returns_plus_one(self):
        for v in (1, 2, 3, 4, 5, 6):
            assert _score_velocity(v) == 1

    def test_high_negative_magnitude_returns_minus_two(self):
        for v in (-7, -8, -9, -10):
            assert _score_velocity(v) == -2

    def test_low_negative_magnitude_returns_minus_one(self):
        for v in (-1, -2, -3, -4, -5, -6):
            assert _score_velocity(v) == -1

    def test_clamping_beyond_10(self):
        assert _score_velocity(15) == _score_velocity(10)
        assert _score_velocity(-15) == _score_velocity(-10)


class TestScoreAuction:
    def test_strong_bullish_returns_two(self):
        assert _score_auction("stark") == 2

    def test_bearish_returns_negative(self):
        assert _score_auction("stark_bärisch") == -2
        assert _score_auction("stark_bearish") == -2

    def test_neutral_returns_zero(self):
        assert _score_auction("moderat") == 0

    def test_unknown_returns_zero(self):
        assert _score_auction("unbekannt") == 0


class TestScoreVwap:
    def test_above_vwap_positive(self):
        assert _score_vwap("weit_oben") == 2
        assert _score_vwap("above") == 2
        assert _score_vwap("oben") == 1

    def test_below_vwap_negative(self):
        assert _score_vwap("weit_unten") == -2
        assert _score_vwap("below") == -2
        assert _score_vwap("unten") == -1

    def test_at_vwap_zero(self):
        assert _score_vwap("at") == 0


class TestScoreEma:
    def test_bullish_aligned_positive(self):
        assert _score_ema("bullish") == 2
        assert _score_ema("aligned_up") == 2
        assert _score_ema("slightly_bullish") == 1

    def test_bearish_aligned_negative(self):
        assert _score_ema("bearish") == -2
        assert _score_ema("aligned_down") == -2
        assert _score_ema("slightly_bearish") == -1

    def test_mixed_zero(self):
        assert _score_ema("mixed") == 0


# ---------------------------------------------------------------------------
# State-from-score thresholds
# ---------------------------------------------------------------------------

class TestStateFromScore:
    def test_strong_bull_at_five(self):
        assert _state_from_score(5) == BiasState.LONG
        assert _state_from_score(10) == BiasState.LONG

    def test_range_long_two_to_four(self):
        for s in (2, 3, 4):
            assert _state_from_score(s) == BiasState.RANGE_LONG

    def test_range_minus_one_to_one(self):
        for s in (-1, 0, 1):
            assert _state_from_score(s) == BiasState.RANGE

    def test_range_short_minus_four_to_minus_two(self):
        for s in (-4, -3, -2):
            assert _state_from_score(s) == BiasState.RANGE_SHORT

    def test_short_at_minus_five(self):
        assert _state_from_score(-5) == BiasState.SHORT
        assert _state_from_score(-10) == BiasState.SHORT


# ---------------------------------------------------------------------------
# Full state transitions via calculate_bias_state
# ---------------------------------------------------------------------------

class TestCalculateBiasState:
    """Cover all 5 states with plausible input combinations."""

    def test_strong_bull_all_bullish(self):
        bars = _make_bars()
        result = calculate_bias_state(
            bars,
            trend="bullish",
            velocity_scale=9,
            auction_quality="stark",
            vwap_position="above",
            ema_alignment="bullish",
        )
        assert result.state == BiasState.LONG
        assert result.score >= 5

    def test_strong_bear_all_bearish(self):
        bars = _make_bars()
        result = calculate_bias_state(
            bars,
            trend="down",
            velocity_scale=-9,
            auction_quality="stark_bearish",
            vwap_position="below",
            ema_alignment="bearish",
        )
        assert result.state == BiasState.SHORT
        assert result.score <= -5

    def test_range_long_moderate_bullish(self):
        bars = _make_bars()
        result = calculate_bias_state(
            bars,
            trend="range_up",
            velocity_scale=5,
            auction_quality="moderat",
            vwap_position="oben",
            ema_alignment="slightly_bullish",
        )
        assert result.state == BiasState.RANGE_LONG

    def test_range_short_moderate_bearish(self):
        # trend=range_down(-1), vel=-3(-1), auction=moderat(0), vwap=unten(-1), ema=mixed(0)
        # total = -3 -> RANGE_SHORT
        bars = _make_bars()
        result = calculate_bias_state(
            bars,
            trend="range_down",
            velocity_scale=-3,
            auction_quality="moderat",
            vwap_position="unten",
            ema_alignment="mixed",
        )
        assert result.state == BiasState.RANGE_SHORT

    def test_range_all_neutral(self):
        bars = _make_bars()
        result = calculate_bias_state(
            bars,
            trend="range",
            velocity_scale=0,
            auction_quality="moderat",
            vwap_position="at",
            ema_alignment="mixed",
        )
        assert result.state == BiasState.RANGE
        assert result.score == 0

    def test_components_dict_has_all_keys(self):
        bars = _make_bars()
        result = calculate_bias_state(bars)
        assert set(result.components.keys()) == {"trend", "velocity", "auction", "vwap", "ema"}

    def test_score_is_sum_of_components(self):
        bars = _make_bars()
        result = calculate_bias_state(
            bars,
            trend="up",
            velocity_scale=7,
            auction_quality="gut",
            vwap_position="above",
            ema_alignment="aligned_up",
        )
        expected_sum = sum(result.components.values())
        assert result.score == expected_sum

    def test_returns_bias_result_type(self):
        bars = _make_bars()
        result = calculate_bias_state(bars)
        assert isinstance(result, BiasResult)
        assert isinstance(result.state, BiasState)

    def test_score_within_bounds(self):
        """Score must always be in [-10, +10]."""
        bars = _make_bars()
        for trend in ("up", "range", "down"):
            for vel in (-10, 0, 10):
                result = calculate_bias_state(
                    bars,
                    trend=trend,
                    velocity_scale=vel,
                    auction_quality="moderat",
                    vwap_position="at",
                    ema_alignment="mixed",
                )
                assert -10 <= result.score <= 10

    def test_empty_bars_still_returns_result(self):
        """bars parameter is currently unused; empty list should not crash."""
        result = calculate_bias_state([])
        assert isinstance(result, BiasResult)

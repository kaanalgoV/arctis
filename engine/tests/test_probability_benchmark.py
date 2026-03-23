"""Tests for the walk-forward benchmark harness."""

import math

import pytest

from arctis.benchmark import evaluate_forecast, walk_forward_split
from arctis.models import OHLCVBar


def make_bars(n: int, base: float = 100.0) -> list[OHLCVBar]:
    """Create n simple bars with linearly rising closes."""
    bars = []
    ts = 1704067200
    for i in range(n):
        price = base + i * 0.5
        bars.append(
            OHLCVBar(
                timestamp=ts + i * 60,
                open=price,
                high=price + 1.0,
                low=price - 1.0,
                close=price,
                volume=1000,
            )
        )
    return bars


class TestWalkForwardSplit:
    def test_basic_split(self):
        bars = make_bars(200)
        splits = walk_forward_split(bars)
        assert len(splits) == 1
        split = splits[0]
        assert len(split["train"]) == 140  # 70% of 200
        assert len(split["test"]) == 60

    def test_respects_min_train(self):
        bars = make_bars(120)
        splits = walk_forward_split(bars, train_ratio=0.5, min_train=100)
        assert len(splits) == 1
        assert len(splits[0]["train"]) == 100

    def test_empty_when_too_few_bars(self):
        bars = make_bars(50)
        splits = walk_forward_split(bars, min_train=100)
        assert splits == []

    def test_train_test_are_contiguous(self):
        bars = make_bars(200)
        splits = walk_forward_split(bars)
        train = splits[0]["train"]
        test = splits[0]["test"]
        assert train[-1].timestamp < test[0].timestamp


class TestEvaluateForecast:
    def test_perfect_forecast(self):
        preds = [1.0, 2.0, 3.0, 4.0]
        actuals = [1.0, 2.0, 3.0, 4.0]
        result = evaluate_forecast(preds, actuals)
        assert result["mae"] == 0.0
        assert result["rmse"] == 0.0
        assert result["direction_accuracy"] == 1.0
        assert result["n"] == 4

    def test_constant_forecast(self):
        preds = [5.0, 5.0, 5.0]
        actuals = [5.0, 6.0, 7.0]
        result = evaluate_forecast(preds, actuals)
        assert result["mae"] > 0
        assert result["rmse"] > 0
        assert result["n"] == 3

    def test_mismatched_lengths_returns_error(self):
        result = evaluate_forecast([1.0, 2.0], [1.0])
        assert "error" in result

    def test_empty_inputs_return_error(self):
        assert "error" in evaluate_forecast([], [])

    def test_single_element(self):
        result = evaluate_forecast([3.0], [4.0])
        assert result["mae"] == 1.0
        assert result["direction_accuracy"] == 0.0

    def test_direction_accuracy_all_wrong(self):
        # Predict down when actual goes up
        preds = [10.0, 9.0, 8.0]
        actuals = [10.0, 11.0, 12.0]
        result = evaluate_forecast(preds, actuals)
        assert result["direction_accuracy"] == 0.0

    def test_rmse_larger_than_mae_with_outlier(self):
        preds = [0.0, 0.0, 0.0, 0.0]
        actuals = [1.0, 1.0, 1.0, 10.0]
        result = evaluate_forecast(preds, actuals)
        assert result["rmse"] > result["mae"]

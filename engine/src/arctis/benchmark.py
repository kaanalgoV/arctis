"""Walk-forward benchmark harness for prediction model evaluation."""

import math

from arctis.models import OHLCVBar


def walk_forward_split(
    bars: list[OHLCVBar],
    train_ratio: float = 0.7,
    min_train: int = 100,
) -> list[dict]:
    """Generate walk-forward train/test splits."""
    n = len(bars)
    train_end = max(int(n * train_ratio), min_train)
    if train_end >= n:
        return []
    return [{"train": bars[:train_end], "test": bars[train_end:]}]


def evaluate_forecast(predictions: list[float], actuals: list[float]) -> dict:
    """Calculate forecast metrics: MAE, RMSE, direction accuracy."""
    if not predictions or not actuals or len(predictions) != len(actuals):
        return {"error": "mismatched lengths"}
    n = len(predictions)
    mae = sum(abs(p - a) for p, a in zip(predictions, actuals)) / n
    rmse = math.sqrt(sum((p - a) ** 2 for p, a in zip(predictions, actuals)) / n)
    # Direction accuracy: did we predict up/down correctly?
    if n > 1:
        correct = sum(
            1
            for i in range(1, n)
            if (predictions[i] > predictions[i - 1]) == (actuals[i] > actuals[i - 1])
        )
        direction_acc = correct / (n - 1)
    else:
        direction_acc = 0.0
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "direction_accuracy": round(direction_acc, 4),
        "n": n,
    }

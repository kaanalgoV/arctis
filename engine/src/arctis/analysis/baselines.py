"""Baseline forecast models for probability benchmarking."""

from arctis.models import OHLCVBar


def naive_forecast(bars: list[OHLCVBar]) -> dict:
    """Predict next bar = last bar's close."""
    if not bars:
        return {"forecast": None, "method": "naive"}
    last = bars[-1]
    return {"forecast": last.close, "method": "naive", "confidence": 0.0}


def seasonal_naive_forecast(bars: list[OHLCVBar], period: int = 390) -> dict:
    """Predict = same time yesterday (390 = 1-min bars in RTH)."""
    if len(bars) < period + 1:
        return {"forecast": None, "method": "seasonal_naive"}
    ref = bars[-period]
    return {"forecast": ref.close, "method": "seasonal_naive", "confidence": 0.0}


def rolling_quantile_forecast(
    bars: list[OHLCVBar],
    window: int = 100,
    quantiles: list[float] = [0.1, 0.25, 0.5, 0.75, 0.9],
) -> dict:
    """Rolling quantile-based probability bands."""
    if len(bars) < window:
        return {"zones": [], "method": "rolling_quantile"}
    closes = [b.close for b in bars[-window:]]
    sorted_closes = sorted(closes)
    zones = []
    for q in quantiles:
        idx = int(q * (len(sorted_closes) - 1))
        zones.append({"quantile": q, "price": sorted_closes[idx]})
    return {"zones": zones, "method": "rolling_quantile", "window": window}

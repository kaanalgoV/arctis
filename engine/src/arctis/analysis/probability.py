"""Historical probability analysis using nearest-neighbor comparison."""

from dataclasses import dataclass

import numpy as np

from arctis.models import OHLCVBar


@dataclass
class TargetZone:
    median_target: float
    iqr_low: float
    iqr_high: float
    reach_probability: float
    counter_move_probability: float
    sample_size: int


def build_feature_vector(bars: list[OHLCVBar]) -> list[float]:
    """Build a normalized feature vector from a set of bars.
    Features: [trend_score, volatility, volume_profile, avg_range, close_position]
    """
    if len(bars) < 10:
        return [0.0] * 5

    closes = np.array([b.close for b in bars])
    highs = np.array([b.high for b in bars])
    lows = np.array([b.low for b in bars])
    volumes = np.array([b.volume for b in bars], dtype=float)

    x = np.arange(len(closes))
    slope = np.polyfit(x, closes, 1)[0] if len(closes) > 1 else 0.0
    trend_score = float(np.clip(slope / (np.std(closes) + 1e-9), -3, 3))

    returns = np.diff(closes) / (closes[:-1] + 1e-9)
    volatility = float(np.std(returns) * 100)

    mid = len(volumes) // 2
    vol_ratio = float(np.mean(volumes[mid:]) / (np.mean(volumes[:mid]) + 1e-9))

    avg_range = float(np.mean(highs - lows) / (np.mean(closes) + 1e-9) * 100)

    day_high = np.max(highs)
    day_low = np.min(lows)
    close_pos = float((closes[-1] - day_low) / (day_high - day_low + 1e-9))

    return [trend_score, volatility, vol_ratio, avg_range, close_pos]


def find_similar_situations(
    current_bars: list[OHLCVBar],
    history_bars: list[OHLCVBar],
    top_n: int = 20,
    window_size: int = 390,
) -> list[dict]:
    """Find the top_n most similar historical situations."""
    current_vec = np.array(build_feature_vector(current_bars))
    matches = []

    step = window_size // 2
    for i in range(0, len(history_bars) - window_size * 2, step):
        window = history_bars[i : i + window_size]
        future = history_bars[i + window_size : i + window_size * 2]

        vec = np.array(build_feature_vector(window))
        distance = float(np.linalg.norm(current_vec - vec))

        if len(future) > 0:
            entry_price = window[-1].close
            future_closes = [b.close for b in future]
            max_move = max(future_closes) - entry_price
            min_move = min(future_closes) - entry_price

            matches.append({
                "distance": distance,
                "bars": window,
                "entry_price": entry_price,
                "max_up": max_move,
                "max_down": min_move,
                "end_price": future_closes[-1],
                "move": future_closes[-1] - entry_price,
            })

    matches.sort(key=lambda m: m["distance"])
    return matches[:top_n]


def calculate_target_zones(matches: list[dict], current_price: float) -> TargetZone:
    """Calculate probability zones from similar historical matches."""
    if not matches:
        return TargetZone(median_target=0.0, iqr_low=0.0, iqr_high=0.0,
                         reach_probability=0.0, counter_move_probability=0.0, sample_size=0)

    moves = np.array([m["move"] for m in matches])
    median_move = float(np.median(moves))
    q25 = float(np.percentile(moves, 25))
    q75 = float(np.percentile(moves, 75))

    if median_move > 0:
        reach_count = sum(1 for m in matches if m["max_up"] >= median_move)
    else:
        reach_count = sum(1 for m in matches if m["max_down"] <= median_move)

    reach_prob = reach_count / len(matches)

    threshold = abs(median_move) * 0.5
    if median_move > 0:
        counter_count = sum(1 for m in matches if m["max_down"] < -threshold)
    else:
        counter_count = sum(1 for m in matches if m["max_up"] > threshold)

    counter_prob = counter_count / len(matches)

    return TargetZone(
        median_target=current_price + median_move,
        iqr_low=current_price + q25,
        iqr_high=current_price + q75,
        reach_probability=reach_prob,
        counter_move_probability=counter_prob,
        sample_size=len(matches),
    )

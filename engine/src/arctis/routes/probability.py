"""Historical probability API endpoint."""

from fastapi import APIRouter, Query

from arctis.analysis.probability import build_feature_vector, calculate_target_zones, find_similar_situations
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api/analysis")


def _get_store():
    from arctis.main import store
    return store


@router.get("/probability")
async def analyze_probability(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    top_n: int = Query(default=20, ge=5, le=50),
):
    s = _get_store()
    bars = s.load(market, timeframe)

    if len(bars) < 780:
        return {"error": "Nicht genug historische Daten (mindestens 2 Tage noetig)", "bar_count": len(bars)}

    window = 390 if timeframe == "1min" else 78
    current = bars[-window:]
    history = bars[:-window]
    current_price = current[-1].close

    matches = find_similar_situations(current, history, top_n=top_n, window_size=window)
    zones = calculate_target_zones(matches, current_price)

    return {
        "current_price": current_price,
        "median_target": round(zones.median_target, 2),
        "iqr_low": round(zones.iqr_low, 2),
        "iqr_high": round(zones.iqr_high, 2),
        "reach_probability": round(zones.reach_probability, 3),
        "counter_move_probability": round(zones.counter_move_probability, 3),
        "sample_size": zones.sample_size,
        "feature_vector": build_feature_vector(current),
    }

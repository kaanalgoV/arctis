"""Historical probability API endpoint."""

from fastapi import APIRouter, HTTPException, Query

from arctis.analysis.probability import build_feature_vector, calculate_target_zones, find_similar_situations
from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api/analysis")


@router.get("/probability")
async def analyze_probability(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    days: int = Query(default=60, ge=10, le=365),
    top_n: int = Query(default=20, ge=5, le=50),
):
    try:
        bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Marktdaten: {e}")

    if not bars:
        raise HTTPException(
            status_code=404,
            detail=f"Keine Bars fuer {market.value} ({timeframe.value}) in der DB gefunden.",
        )

    if len(bars) < 780:
        return {
            "error": "Nicht genug historische Daten (mindestens 2 Tage noetig)",
            "bar_count": len(bars),
        }

    window = 390 if timeframe == Timeframe.M1 else 78
    current = bars[-window:]
    history = bars[:-window]
    current_price = current[-1].close

    matches = find_similar_situations(current, history, top_n=top_n, window_size=window)
    zones = calculate_target_zones(matches, current_price)

    return {
        "market": market.value,
        "timeframe": timeframe.value,
        "bar_count": len(bars),
        "current_price": current_price,
        "median_target": round(zones.median_target, 2),
        "iqr_low": round(zones.iqr_low, 2),
        "iqr_high": round(zones.iqr_high, 2),
        "reach_probability": round(zones.reach_probability, 3),
        "counter_move_probability": round(zones.counter_move_probability, 3),
        "sample_size": zones.sample_size,
        "feature_vector": build_feature_vector(current),
    }

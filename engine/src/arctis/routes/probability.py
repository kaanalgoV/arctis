"""Historical probability API endpoint."""

from fastapi import APIRouter, HTTPException, Query

from arctis.analysis.baselines import naive_forecast, rolling_quantile_forecast
from arctis.analysis.probability import (
    build_feature_vector,
    calculate_probability_zones,
    calculate_target_zones,
    find_similar_situations,
)
from arctis.contracts import ProbabilityResponse, ProbabilityZone
from arctis.db import fetch_bars_as_models
from arctis.models import Market, Timeframe

router = APIRouter(prefix="/api/analysis")


def _get_sim():
    from arctis.main import sim
    return sim


def _load_bars(market: Market, timeframe: Timeframe, days: int = 60):
    """Load bars from simulation engine or TimescaleDB.

    In replay/simulation mode the sim engine is the authoritative source so
    that the probability endpoint reflects replayed context rather than live
    DB data.
    """
    sim = _get_sim()
    if sim.active and sim.market == market and sim.timeframe == timeframe:
        return sim.get_bars()

    bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
    if not bars:
        raise HTTPException(
            status_code=404,
            detail=f"Keine Bars fuer {market.value} ({timeframe.value}) in der DB gefunden.",
        )
    return bars


def _detect_regime(feature_vector: list[float]) -> str:
    """Derive a simple regime label from the feature vector.

    Feature vector layout: [trend_score, volatility, vol_ratio, avg_range, close_pos]
    """
    if not feature_vector or len(feature_vector) < 2:
        return "unknown"
    trend_score, volatility = feature_vector[0], feature_vector[1]
    if abs(trend_score) < 0.3:
        return "ranging"
    if volatility > 1.5:
        regime = "volatile_"
    else:
        regime = "normal_"
    return regime + ("bull" if trend_score > 0 else "bear")


@router.get("/probability")
async def analyze_probability(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    days: int = Query(default=60, ge=10, le=365),
    top_n: int = Query(default=20, ge=5, le=50),
):
    try:
        bars = _load_bars(market, timeframe, days=days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Marktdaten: {e}")

    if len(bars) < 780:
        return {
            "error": "Nicht genug historische Daten (mindestens 2 Tage noetig)",
            "bar_count": len(bars),
        }

    window = 390 if timeframe == Timeframe.M1 else 78
    current = bars[-window:]
    history = bars[:-window]
    current_price = current[-1].close

    # --- Nearest-neighbour analysis (existing logic) ------------------------
    matches = find_similar_situations(current, history, top_n=top_n, window_size=window)
    nn_zones = calculate_target_zones(matches, current_price)

    # --- Rule-based probability zones (Task 91) -----------------------------
    rule_zone_dicts = calculate_probability_zones(bars)
    probability_zones: list[ProbabilityZone] = [
        ProbabilityZone(
            target_high=z["target_high"],
            target_low=z["target_low"],
            probability=z["probability"],
            horizon_bars=window,
            method=z["method"],
        )
        for z in rule_zone_dicts
    ]

    # --- Baseline comparison ------------------------------------------------
    naive = naive_forecast(current)
    quantile = rolling_quantile_forecast(current, window=min(100, len(current)))

    # --- Regime detection ---------------------------------------------------
    feature_vec = build_feature_vector(current)
    regime = _detect_regime(feature_vec)

    # --- Build ProbabilityResponse ------------------------------------------
    prob_response = ProbabilityResponse(
        zones=probability_zones,
        current_price=current_price,
        sample_size=nn_zones.sample_size,
        regime=regime,
    )

    return {
        # Structured probabilistic output (Task 90 contract)
        "probability": prob_response.model_dump(),
        # Nearest-neighbour legacy fields (kept for backwards compatibility)
        "market": market.value,
        "timeframe": timeframe.value,
        "bar_count": len(bars),
        "current_price": current_price,
        "median_target": round(nn_zones.median_target, 2),
        "iqr_low": round(nn_zones.iqr_low, 2),
        "iqr_high": round(nn_zones.iqr_high, 2),
        "reach_probability": round(nn_zones.reach_probability, 3),
        "counter_move_probability": round(nn_zones.counter_move_probability, 3),
        "sample_size": nn_zones.sample_size,
        "feature_vector": feature_vec,
        # Baseline comparison
        "baselines": {
            "naive": naive,
            "rolling_quantile": quantile,
        },
    }

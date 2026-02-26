"""Analysis API endpoints."""

import time

from fastapi import APIRouter, Query

from arctis.analysis.sessions import classify_session, get_session_stats
from arctis.analysis.structure import classify_trend, detect_structure_breaks, detect_swings
from arctis.analysis.volume import detect_volume_spikes, relative_volume
from arctis.models import Market, Timeframe
from arctis.storage import ParquetStore

router = APIRouter(prefix="/api/analysis")


def _get_store() -> ParquetStore:
    from arctis.main import store
    return store


@router.get("/structure")
async def analyze_structure(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    lookback: int = Query(default=5, ge=2, le=20),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    swings = detect_swings(bars, lookback=lookback)
    trend = classify_trend(swings)
    breaks = detect_structure_breaks(swings)

    return {
        "trend": trend.value,
        "swings": [
            {"type": sw.type.value, "price": sw.price, "index": sw.index, "timestamp": sw.timestamp}
            for sw in swings
        ],
        "structure_breaks": [
            {"type": b.break_type, "direction": b.direction, "price": b.price, "index": b.index, "timestamp": b.timestamp}
            for b in breaks
        ],
        "bar_count": len(bars),
    }


@router.get("/volume")
async def analyze_volume(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
    period: int = Query(default=20, ge=5, le=100),
    spike_sigma: float = Query(default=2.0, ge=1.0, le=5.0),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    rvol = relative_volume(bars, period=period)
    spikes = detect_volume_spikes(bars, period=period, threshold_sigma=spike_sigma)

    return {
        "relative_volume": [
            {"index": i, "timestamp": bars[i].timestamp, "rvol": v}
            for i, v in enumerate(rvol) if v is not None
        ],
        "spikes": [
            {"index": sp.index, "timestamp": sp.timestamp, "volume": sp.volume, "ratio": round(sp.ratio, 2)}
            for sp in spikes
        ],
        "bar_count": len(bars),
    }


@router.get("/sessions")
async def analyze_sessions(
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    s = _get_store()
    bars = s.load(market, timeframe)
    stats = get_session_stats(bars)
    current = classify_session(int(time.time()))

    return {
        "current_session": current.value,
        "session_stats": {
            session.value: {
                "bar_count": st.bar_count,
                "avg_volume": round(st.avg_volume, 1),
                "avg_range": round(st.avg_range, 4),
                "total_volume": st.total_volume,
            }
            for session, st in stats.items()
        },
        "bar_count": len(bars),
    }

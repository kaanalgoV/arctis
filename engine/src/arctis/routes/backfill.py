"""Backfill missing historical bars from Databento.

Automatically detects gaps in the candles table and fills them.
Uses the DATABENTO_API_KEY environment variable.
"""

import os
import logging
from datetime import datetime, timezone, timedelta, date

from fastapi import APIRouter, Query
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/backfill", tags=["backfill"])

# Symbol mapping for Databento (uses continuous front-month)
_DATABENTO_SYMBOLS = {
    "NQM6": "NQ.FUT",
    "ESM6": "ES.FUT",
}


def _find_missing_days(engine, symbol: str, lookback_days: int = 7, min_bars: int = 100) -> list[date]:
    """Find trading days with insufficient data in the last N days.

    Days with fewer than min_bars are considered incomplete and will be backfilled.
    """
    with engine.connect() as conn:
        r = conn.execute(text("""
            SELECT ts::date as day, count(*) as bars
            FROM candles
            WHERE symbol = :sym AND timeframe = '1m' AND ts > NOW() - :days * INTERVAL '1 day'
            GROUP BY day
        """), {"sym": symbol, "days": lookback_days})
        day_bars = {row[0]: row[1] for row in r}

    today = date.today()
    missing = []
    for i in range(lookback_days):
        d = today - timedelta(days=i)
        if d >= today:
            continue
        if d.weekday() >= 5 and d.weekday() != 6:  # Skip Saturday (but include Sunday = Globex open)
            continue
        bars = day_bars.get(d, 0)
        if bars < min_bars:
            missing.append(d)

    return sorted(missing)


async def _fetch_databento_bars(symbol: str, target_date: date) -> list[dict]:
    """Fetch 1-min OHLCV bars from Databento for a specific date."""
    import databento as db

    key = os.environ.get("DATABENTO_API_KEY")
    if not key:
        raise RuntimeError("DATABENTO_API_KEY not set")

    db_symbol = symbol  # Use contract symbol directly (e.g. NQM6, ESM6)
    client = db.Historical(key)

    start = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end = start + timedelta(days=1)

    data = client.timeseries.get_range(
        dataset="GLBX.MDP3",
        schema="ohlcv-1m",
        symbols=[db_symbol],
        start=start.isoformat(),
        end=end.isoformat(),
    )

    bars = []
    for record in data:
        bars.append({
            "ts": datetime.fromtimestamp(record.ts_event / 1e9, tz=timezone.utc),
            "symbol": symbol,
            "o": record.open / 1e9,
            "h": record.high / 1e9,
            "l": record.low / 1e9,
            "c": record.close / 1e9,
            "v": record.volume,
        })

    return bars


@router.get("/status")
async def backfill_status(
    symbol: str = Query(default="NQM6"),
    days: int = Query(default=7),
):
    """Check which days are missing for a symbol."""
    from arctis.db import get_engine
    engine = get_engine()
    missing = _find_missing_days(engine, symbol, days)
    return {
        "symbol": symbol,
        "lookback_days": days,
        "missing_days": [d.isoformat() for d in missing],
        "missing_count": len(missing),
    }


@router.post("/run")
async def run_backfill(
    symbol: str = Query(default="NQM6"),
    days: int = Query(default=7),
):
    """Fetch and insert missing bars from Databento."""
    from arctis.db import get_engine
    engine = get_engine()

    key = os.environ.get("DATABENTO_API_KEY")
    if not key:
        return {"error": "DATABENTO_API_KEY not set. Set it in env or ~/.keys/env.sh"}

    missing = _find_missing_days(engine, symbol, days)
    if not missing:
        return {"symbol": symbol, "message": "No missing days", "filled": 0}

    total_filled = 0
    results = []

    for target_date in missing:
        try:
            bars = await _fetch_databento_bars(symbol, target_date)
            count = 0
            for bar in bars:
                try:
                    with engine.begin() as conn:
                        conn.execute(text("""
                            INSERT INTO candles (ts, symbol, timeframe, o, h, l, c, volume)
                            VALUES (:ts, :sym, '1m', :o, :h, :l, :c, :v)
                            ON CONFLICT (symbol, timeframe, ts) DO NOTHING
                        """), bar)
                    count += 1
                except Exception:
                    pass
            total_filled += count
            results.append({"date": target_date.isoformat(), "bars": count})
            logger.info("Backfilled %s %s: %d bars", symbol, target_date, count)
        except Exception as e:
            results.append({"date": target_date.isoformat(), "error": str(e)})
            logger.warning("Backfill failed for %s %s: %s", symbol, target_date, e)

    return {
        "symbol": symbol,
        "total_filled": total_filled,
        "days_processed": len(missing),
        "details": results,
    }

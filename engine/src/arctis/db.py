"""TimescaleDB connection for live market data."""

import os
from datetime import datetime, timedelta, timezone

import pandas as pd
from sqlalchemy import create_engine

from arctis.models import OHLCVBar
from arctis.db_constants import VIEW_OHLCV_1M

_raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql://algorivo:algorivo_dev@localhost:5532/algorivo",
)
# SQLAlchemy 2.x requires "postgresql://" not "postgres://"
DB_URL = _raw_url.replace("postgres://", "postgresql://", 1) if _raw_url.startswith("postgres://") else _raw_url

_engine = None


def get_engine():
    """Return a lazily-created SQLAlchemy engine with connection pooling."""
    global _engine
    if _engine is None:
        _engine = create_engine(DB_URL, pool_size=15, max_overflow=20)
    return _engine


# Map Market enum values to DB symbols (front-month contracts)
# Updated dynamically by _build_symbol_map() on first call
_SYMBOL_MAP: dict[str, str] | None = None
_SYMBOL_MAP_TS: float = 0.0
_SYMBOL_MAP_TTL: float = 4 * 3600  # Re-check every 4 hours (handles contract rollover)


def _build_symbol_map() -> dict[str, str]:
    """Build market->symbol map from DB, picking the contract with most recent data per root.

    Cached with a 4-hour TTL so contract rollovers are picked up without restart.
    Raises RuntimeError if the DB is unreachable — callers must handle this explicitly.
    """
    global _SYMBOL_MAP, _SYMBOL_MAP_TS
    import time as _time
    if _SYMBOL_MAP is not None and (_time.time() - _SYMBOL_MAP_TS) < _SYMBOL_MAP_TTL:
        return _SYMBOL_MAP

    query = f"""
        SELECT symbol, MAX(timestamp) as latest
        FROM {VIEW_OHLCV_1M}
        GROUP BY symbol
        ORDER BY latest DESC
    """
    df = pd.read_sql(query, get_engine())

    # Group by root (first 2 chars: ES, NQ, CL, GC, 6E, 6J)
    roots: dict[str, tuple[str, object]] = {}
    for _, row in df.iterrows():
        sym = row["symbol"]
        root = sym[:2]
        if root not in roots or row["latest"] > roots[root][1]:
            roots[root] = (sym, row["latest"])

    _SYMBOL_MAP = {root: sym for root, (sym, _) in roots.items()}
    _SYMBOL_MAP_TS = _time.time()
    return _SYMBOL_MAP


def _resolve_symbol(market: str) -> str:
    """Resolve market name (ES, NQ) to DB symbol (ESZ5, NQH6).

    Raises KeyError if the market root is not found in the DB.
    Raises RuntimeError (via _build_symbol_map) if DB is unreachable.
    """
    m = _build_symbol_map()
    key = market.upper()
    if key not in m:
        raise KeyError(
            f"Symbol-Root '{key}' nicht in der Datenbank gefunden. "
            f"Verfuegbare Roots: {sorted(m.keys())}"
        )
    return m[key]


_FETCH_BARS_CACHE: dict[tuple, tuple[float, list[dict]]] = {}
_FETCH_BARS_CACHE_TTL_S = 1.5  # replay polls every 500 ms, but DB data only
                                # changes once per minute — 1.5 s is a fair trade


def fetch_bars(
    symbol: str,
    days: int = 30,
    table: str | None = None,
) -> list[dict]:
    """Fetch OHLCV bars from TimescaleDB as dicts (for REST API).

    Always reads from VIEW_OHLCV_1M unless an explicit override table is given.
    Short-TTL cached — repeated calls with the same arguments within 1.5 s
    reuse the result. Huge win for the /api/bars polling loop during replay.
    """
    import time as _t

    table = table or VIEW_OHLCV_1M
    cache_key = (symbol, days, table)
    now = _t.time()
    cached = _FETCH_BARS_CACHE.get(cache_key)
    if cached is not None and (now - cached[0]) < _FETCH_BARS_CACHE_TTL_S:
        return cached[1]

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)

    query = f"""
        SELECT EXTRACT(EPOCH FROM timestamp)::bigint as timestamp,
               open, high, low, close, volume,
               COALESCE(buy_volume, 0) as buy_volume,
               COALESCE(sell_volume, 0) as sell_volume,
               COALESCE(delta, 0) as delta
        FROM {table}
        WHERE symbol = %s
          AND timestamp >= %s
          AND timestamp <= %s
        ORDER BY timestamp ASC
    """

    df = pd.read_sql(query, get_engine(), params=(symbol, start, end))

    if df.empty:
        result: list[dict] = []
    else:
        df["timestamp"] = df["timestamp"].astype(int)
        result = df.to_dict(orient="records")

    _FETCH_BARS_CACHE[cache_key] = (now, result)
    if len(_FETCH_BARS_CACHE) > 8:
        oldest_key = min(_FETCH_BARS_CACHE, key=lambda k: _FETCH_BARS_CACHE[k][0])
        _FETCH_BARS_CACHE.pop(oldest_key, None)

    return result


_BARS_CACHE: dict[tuple, tuple[float, list[OHLCVBar]]] = {}
_BARS_CACHE_TTL_S = 2.0  # bars change at most every 60s in live mode


def fetch_bars_as_models(
    market: str,
    days: int = 10,
    timeframe: str = "1min",
) -> list[OHLCVBar]:
    """Fetch OHLCV bars from TimescaleDB as OHLCVBar model objects.

    This is the primary function used by all analysis modules.

    Raises:
        KeyError: If the market root is not found in the DB.
        RuntimeError: If the DB is unreachable.
    """
    import time as _t

    # Hot-path cache: repeat calls within 2s reuse the last result.
    # Analysis endpoints fan out to several helpers that each fetch the same
    # market+timeframe window — without this cache every helper pays the
    # 500-800 ms DB roundtrip.
    cache_key = (market, days, timeframe)
    now = _t.time()
    cached = _BARS_CACHE.get(cache_key)
    if cached is not None and (now - cached[0]) < _BARS_CACHE_TTL_S:
        return cached[1]

    symbol = _resolve_symbol(market)
    raw = fetch_bars(symbol=symbol, days=days)

    bars = [
        OHLCVBar(
            timestamp=r["timestamp"],
            open=float(r["open"]),
            high=float(r["high"]),
            low=float(r["low"]),
            close=float(r["close"]),
            volume=int(r["volume"]),
            buy_volume=int(r.get("buy_volume", 0)),
            sell_volume=int(r.get("sell_volume", 0)),
            delta=int(r.get("delta", 0)),
        )
        for r in raw
    ]

    if timeframe != "1min" and bars:
        bars = aggregate_bars(bars, timeframe)

    # Store in cache, prune to last 8 distinct keys
    _BARS_CACHE[cache_key] = (now, bars)
    if len(_BARS_CACHE) > 8:
        oldest_key = min(_BARS_CACHE, key=lambda k: _BARS_CACHE[k][0])
        _BARS_CACHE.pop(oldest_key, None)

    return bars


def aggregate_bars(bars: list[OHLCVBar], timeframe: str) -> list[OHLCVBar]:
    """Aggregate 1min bars to larger timeframes using time-based bucketing.

    Supports: 5min, 15min, 30min, 1h
    Handles gaps, session boundaries, and remainder bars correctly.
    """
    if not bars or timeframe == "1min":
        return bars

    freq_map = {"5min": "5min", "15min": "15min", "30min": "30min", "1h": "1h"}
    freq = freq_map.get(timeframe)
    if not freq:
        return bars

    df = pd.DataFrame([{
        "timestamp": b.timestamp,
        "open": b.open,
        "high": b.high,
        "low": b.low,
        "close": b.close,
        "volume": b.volume,
    } for b in bars])

    df["dt"] = pd.to_datetime(df["timestamp"], unit="s")
    df = df.set_index("dt")

    agg = df.resample(freq).agg({
        "timestamp": "first",
        "open": "first",
        "high": "max",
        "low": "min",
        "close": "last",
        "volume": "sum",
    }).dropna(subset=["timestamp"])  # Keep incomplete current bar, only drop truly empty buckets

    return [
        OHLCVBar(
            timestamp=int(row["timestamp"]),
            open=row["open"],
            high=row["high"],
            low=row["low"],
            close=row["close"],
            volume=int(row["volume"]),
        )
        for _, row in agg.iterrows()
    ]


def fetch_available_symbols() -> list[dict]:
    """Fetch distinct symbols from the DB, grouped by root."""
    query = f"""
        SELECT symbol, COUNT(*) as bar_count,
               MIN(timestamp) as earliest,
               MAX(timestamp) as latest
        FROM {VIEW_OHLCV_1M}
        GROUP BY symbol
        ORDER BY bar_count DESC
    """
    df = pd.read_sql(query, get_engine())

    if df.empty:
        return []

    symbols = []
    for _, row in df.iterrows():
        sym = row["symbol"]
        # Extract root: first 2 chars for standard futures (ES, NQ, CL, GC, 6E)
        root = sym[:2] if len(sym) >= 2 else sym
        symbols.append({
            "symbol": sym,
            "root": root,
            "bar_count": int(row["bar_count"]),
            "earliest": str(row["earliest"]),
            "latest": str(row["latest"]),
        })

    return symbols

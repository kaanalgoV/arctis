"""TimescaleDB connection for live market data."""

import os
from datetime import datetime, timedelta, timezone

import pandas as pd

from arctis.models import OHLCVBar

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://algorivo:algorivo_dev@localhost:5532/algorivo",
)

# Map Market enum values to DB symbols (front-month contracts)
# Updated dynamically by _build_symbol_map() on first call
_SYMBOL_MAP: dict[str, str] | None = None


def _build_symbol_map() -> dict[str, str]:
    """Build market->symbol map from DB, picking the contract with most recent data per root."""
    global _SYMBOL_MAP
    if _SYMBOL_MAP is not None:
        return _SYMBOL_MAP

    query = """
        SELECT symbol, MAX(timestamp) as latest
        FROM ohlcv_1m
        GROUP BY symbol
        ORDER BY latest DESC
    """
    try:
        df = pd.read_sql(query, DB_URL)
    except Exception:
        _SYMBOL_MAP = {"ES": "ESZ5", "NQ": "NQH6"}
        return _SYMBOL_MAP

    # Group by root (first 2 chars: ES, NQ, CL, GC, 6E, 6J)
    roots: dict[str, tuple[str, object]] = {}
    for _, row in df.iterrows():
        sym = row["symbol"]
        root = sym[:2]
        if root not in roots or row["latest"] > roots[root][1]:
            roots[root] = (sym, row["latest"])

    _SYMBOL_MAP = {root: sym for root, (sym, _) in roots.items()}
    return _SYMBOL_MAP


def _resolve_symbol(market: str) -> str:
    """Resolve market name (ES, NQ) to DB symbol (ESZ5, NQH6)."""
    m = _build_symbol_map()
    return m.get(market.upper(), market)


def fetch_bars(
    symbol: str = "NQH6",
    days: int = 30,
    table: str = "ohlcv_1m",
) -> list[dict]:
    """Fetch OHLCV bars from TimescaleDB as dicts (for REST API)."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)

    query = f"""
        SELECT EXTRACT(EPOCH FROM timestamp)::bigint as timestamp,
               open, high, low, close, volume
        FROM {table}
        WHERE symbol = %s
          AND timestamp >= %s
          AND timestamp <= %s
        ORDER BY timestamp ASC
    """

    df = pd.read_sql(query, DB_URL, params=(symbol, start, end))

    if df.empty:
        return []

    df["timestamp"] = df["timestamp"].astype(int)
    return df.to_dict(orient="records")


def fetch_bars_as_models(
    market: str = "NQ",
    days: int = 10,
    timeframe: str = "1min",
) -> list[OHLCVBar]:
    """Fetch OHLCV bars from TimescaleDB as OHLCVBar model objects.

    This is the primary function used by all analysis modules.
    """
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
        )
        for r in raw
    ]

    # Aggregate to 5min if requested
    if timeframe == "5min" and bars:
        bars = _aggregate_5min(bars)

    return bars


def _aggregate_5min(bars: list[OHLCVBar]) -> list[OHLCVBar]:
    """Aggregate 1-min bars to 5-min bars."""
    if not bars:
        return []

    result = []
    chunk: list[OHLCVBar] = []

    for bar in bars:
        chunk.append(bar)
        if len(chunk) == 5:
            agg = OHLCVBar(
                timestamp=chunk[0].timestamp,
                open=chunk[0].open,
                high=max(b.high for b in chunk),
                low=min(b.low for b in chunk),
                close=chunk[-1].close,
                volume=sum(b.volume for b in chunk),
            )
            result.append(agg)
            chunk = []

    return result


def fetch_available_symbols() -> list[dict]:
    """Fetch distinct symbols from the DB, grouped by root."""
    query = """
        SELECT symbol, COUNT(*) as bar_count,
               MIN(timestamp) as earliest,
               MAX(timestamp) as latest
        FROM ohlcv_1m
        GROUP BY symbol
        ORDER BY bar_count DESC
    """
    df = pd.read_sql(query, DB_URL)

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

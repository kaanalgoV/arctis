"""Canonical database table and view names for the Arctis engine.

Architecture:
  - ``TABLE_CANDLES``  — raw base table; used for INSERT/UPDATE operations.
  - ``VIEW_OHLCV_1M``  — TimescaleDB continuous aggregate view built on top
                         of ``TABLE_CANDLES``; used for all SELECT operations.

Always write to TABLE_CANDLES, always read from VIEW_OHLCV_1M.
Never SELECT from TABLE_CANDLES directly (it lacks the aggregate index).
"""

# Base write table — receives all incoming bar data (backfill, live, import).
TABLE_CANDLES: str = "candles"

# Read view — 1-minute OHLCV aggregate; source for all analysis and API reads.
VIEW_OHLCV_1M: str = "ohlcv_1m"

# Column name aliases used inside candles (non-standard column names)
# candles uses short column names: ts, o, h, l, c, volume
# ohlcv_1m exposes: timestamp, open, high, low, close, volume
CANDLES_TS_COL: str = "ts"
OHLCV_TS_COL: str = "timestamp"

# Migration: add delta columns to candles table
MIGRATION_ADD_DELTA_COLUMNS: str = """
ALTER TABLE candles ADD COLUMN IF NOT EXISTS buy_volume INTEGER DEFAULT 0;
ALTER TABLE candles ADD COLUMN IF NOT EXISTS sell_volume INTEGER DEFAULT 0;
ALTER TABLE candles ADD COLUMN IF NOT EXISTS delta INTEGER DEFAULT 0;
"""

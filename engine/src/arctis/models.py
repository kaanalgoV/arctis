"""Core data models for Arctis."""

from enum import Enum

from pydantic import BaseModel


class MarketRoot(str, Enum):
    """Futures market root symbols (e.g. NQ, ES, CL)."""

    NQ = "NQ"
    ES = "ES"
    CL = "CL"
    GC = "GC"
    E6 = "6E"  # Euro FX
    J6 = "6J"  # Japanese Yen


# Backward-compatibility alias — existing code that imports `Market` keeps working.
Market = MarketRoot


class Timeframe(str, Enum):
    """Supported timeframes."""

    M1 = "1min"
    M5 = "5min"
    MIN_1 = "1min"
    MIN_5 = "5min"
    MIN_15 = "15min"
    MIN_30 = "30min"
    HOUR_1 = "1h"


class ContractInfo(BaseModel):
    """A specific futures contract, e.g. NQH6."""

    symbol: str       # e.g. "NQH6"
    root: MarketRoot  # e.g. MarketRoot.NQ
    month_code: str   # e.g. "H" (March)
    year_code: str    # e.g. "6" (2026)


class MarketInfo(BaseModel):
    """A futures market together with its available contracts."""

    root: MarketRoot
    name: str                          # e.g. "E-mini NASDAQ-100"
    contracts: list[ContractInfo] = []
    timeframes: list[Timeframe] = [Timeframe.M1, Timeframe.M5]


# ---------------------------------------------------------------------------
# Front-month mapping (static fallback — will be replaced by DB query later)
# ---------------------------------------------------------------------------

FRONT_MONTH: dict[MarketRoot, str] = {
    MarketRoot.NQ: "NQH6",
    MarketRoot.ES: "ESZ5",
    MarketRoot.CL: "CLJ6",
    MarketRoot.GC: "GCJ6",
    MarketRoot.E6: "6EH6",
    MarketRoot.J6: "6JH6",
}

MARKET_NAMES: dict[MarketRoot, str] = {
    MarketRoot.NQ: "E-mini NASDAQ-100",
    MarketRoot.ES: "E-mini S&P 500",
    MarketRoot.CL: "Crude Oil",
    MarketRoot.GC: "Gold",
    MarketRoot.E6: "Euro FX",
    MarketRoot.J6: "Japanese Yen",
}


def resolve_symbol(root: MarketRoot) -> str:
    """Resolve a market root to its front-month contract symbol.

    Args:
        root: The market root enum value (e.g. MarketRoot.NQ).

    Returns:
        The front-month contract symbol string (e.g. "NQH6").
    """
    return FRONT_MONTH.get(root, f"{root.value}H6")


# ---------------------------------------------------------------------------
# Existing low-level bar / CSV models — unchanged
# ---------------------------------------------------------------------------


class OHLCVBar(BaseModel):
    """Single OHLCV bar."""

    timestamp: int  # Unix timestamp in seconds
    open: float
    high: float
    low: float
    close: float
    volume: int


class CSVMapping(BaseModel):
    """Column mapping for CSV import."""

    timestamp_col: str = "timestamp"
    open_col: str = "open"
    high_col: str = "high"
    low_col: str = "low"
    close_col: str = "close"
    volume_col: str = "volume"
    timestamp_format: str | None = None  # None = auto-detect
    delimiter: str = ","

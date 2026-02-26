"""Core data models for Arctis."""

from enum import Enum

from pydantic import BaseModel


class Market(str, Enum):
    ES = "ES"
    NQ = "NQ"


class Timeframe(str, Enum):
    M1 = "1min"
    M5 = "5min"


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

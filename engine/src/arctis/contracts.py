"""Canonical REST response types for the Arctis Engine API."""

from pydantic import BaseModel


class BarsResponse(BaseModel):
    bars: list[dict]
    count: int
    symbol: str
    timeframe: str


class MarketsResponse(BaseModel):
    markets: list[dict]


class HealthResponse(BaseModel):
    status: str
    db: str
    symbols: int = 0
    error: str | None = None


class AnalysisError(BaseModel):
    error: str
    detail: str | None = None

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


class ProbabilityZone(BaseModel):
    target_high: float
    target_low: float
    probability: float
    horizon_bars: int = 5
    method: str = "rolling_quantile"


class ProbabilityResponse(BaseModel):
    zones: list[ProbabilityZone] = []
    current_price: float | None = None
    sample_size: int = 0
    regime: str = "unknown"

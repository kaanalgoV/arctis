"""Parquet-based storage for OHLCV timeseries data."""

from pathlib import Path

import pandas as pd

from arctis.models import Market, OHLCVBar, Timeframe


class ParquetStore:
    """Stores OHLCV data as Parquet files, one file per market+timeframe."""

    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _file_path(self, market: Market, timeframe: Timeframe) -> Path:
        return self.data_dir / f"{market.value}_{timeframe.value}.parquet"

    def save(self, market: Market, timeframe: Timeframe, bars: list[OHLCVBar]) -> None:
        """Save bars to Parquet, appending to existing data and deduplicating."""
        if not bars:
            return

        new_df = pd.DataFrame([b.model_dump() for b in bars])
        path = self._file_path(market, timeframe)

        if path.exists():
            existing_df = pd.read_parquet(path)
            combined = pd.concat([existing_df, new_df], ignore_index=True)
            combined = combined.drop_duplicates(subset=["timestamp"], keep="last")
            combined = combined.sort_values("timestamp").reset_index(drop=True)
        else:
            combined = new_df.sort_values("timestamp").reset_index(drop=True)

        combined.to_parquet(path, index=False)

    def load(
        self,
        market: Market,
        timeframe: Timeframe,
        start_ts: int | None = None,
        end_ts: int | None = None,
    ) -> list[OHLCVBar]:
        """Load bars from Parquet, optionally filtering by time range."""
        path = self._file_path(market, timeframe)
        if not path.exists():
            return []

        df = pd.read_parquet(path)

        if start_ts is not None:
            df = df[df["timestamp"] >= start_ts]
        if end_ts is not None:
            df = df[df["timestamp"] <= end_ts]

        df = df.sort_values("timestamp").reset_index(drop=True)
        return [OHLCVBar(**row) for _, row in df.iterrows()]

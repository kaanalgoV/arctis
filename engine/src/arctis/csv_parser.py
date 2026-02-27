"""CSV parser for OHLCV market data."""

from pathlib import Path

import pandas as pd

from arctis.models import CSVMapping, OHLCVBar


def parse_csv(
    file_path: Path,
    mapping: CSVMapping | None = None,
) -> list[OHLCVBar]:
    """Parse a CSV file into a list of OHLCVBar objects."""
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"CSV file not found: {file_path}")

    if mapping is None:
        mapping = CSVMapping()

    df = pd.read_csv(file_path, delimiter=mapping.delimiter)

    if df.empty:
        return []

    ts_col = mapping.timestamp_col
    if mapping.timestamp_format:
        df[ts_col] = pd.to_datetime(df[ts_col], format=mapping.timestamp_format)
    else:
        df[ts_col] = pd.to_datetime(df[ts_col])

    # datetime64[us] -> seconds: divide by 10^6
    df["_ts_unix"] = df[ts_col].values.astype("int64") // 10**6

    df = df.sort_values("_ts_unix").reset_index(drop=True)

    bars = [
        OHLCVBar(
            timestamp=int(row["_ts_unix"]),
            open=float(row[mapping.open_col]),
            high=float(row[mapping.high_col]),
            low=float(row[mapping.low_col]),
            close=float(row[mapping.close_col]),
            volume=int(row[mapping.volume_col]),
        )
        for _, row in df.iterrows()
    ]
    return bars

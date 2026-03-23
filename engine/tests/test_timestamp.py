import os
import tempfile

import pandas as pd

from arctis.csv_parser import parse_csv
from arctis.models import CSVMapping


def test_timestamp_produces_unix_seconds():
    """Verify CSV parser produces Unix timestamps in seconds, not ms."""
    # Create a test CSV with known datetime.
    # 2025-01-02 14:30:00 UTC = 1735827000 seconds
    df = pd.DataFrame(
        {
            "datetime": ["2025-01-02 14:30:00"],
            "open": [100.0],
            "high": [101.0],
            "low": [99.0],
            "close": [100.5],
            "volume": [1000],
        }
    )
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w") as f:
        df.to_csv(f, index=False)
        path = f.name
    try:
        mapping = CSVMapping(timestamp_col="datetime")
        result = parse_csv(path, mapping=mapping)
        ts = result[0].timestamp
        # Unix seconds should be ~1.7 billion, not ~1.7 trillion (ms)
        assert 1_000_000_000 < ts < 2_000_000_000, (
            f"Timestamp {ts} looks like milliseconds, not seconds"
        )
    finally:
        os.unlink(path)

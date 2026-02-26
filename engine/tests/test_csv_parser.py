import pytest
from pathlib import Path

from arctis.csv_parser import parse_csv
from arctis.models import CSVMapping, OHLCVBar

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_csv_default_mapping():
    bars = parse_csv(FIXTURES / "sample_es_1min.csv")
    assert len(bars) == 10
    assert isinstance(bars[0], OHLCVBar)


def test_parse_csv_first_bar_values():
    bars = parse_csv(FIXTURES / "sample_es_1min.csv")
    bar = bars[0]
    assert bar.open == 5950.25
    assert bar.high == 5952.50
    assert bar.low == 5949.00
    assert bar.close == 5951.75
    assert bar.volume == 12543


def test_parse_csv_timestamps_ascending():
    bars = parse_csv(FIXTURES / "sample_es_1min.csv")
    timestamps = [b.timestamp for b in bars]
    assert timestamps == sorted(timestamps)


def test_parse_csv_custom_mapping():
    mapping = CSVMapping(delimiter=",", timestamp_col="timestamp")
    bars = parse_csv(FIXTURES / "sample_es_1min.csv", mapping=mapping)
    assert len(bars) == 10


def test_parse_csv_empty_file(tmp_path):
    csv_file = tmp_path / "empty.csv"
    csv_file.write_text("timestamp,open,high,low,close,volume\n")
    bars = parse_csv(csv_file)
    assert bars == []


def test_parse_csv_file_not_found():
    with pytest.raises(FileNotFoundError):
        parse_csv(Path("/nonexistent/file.csv"))

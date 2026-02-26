import pytest
from pathlib import Path

from arctis.storage import ParquetStore
from arctis.models import Market, Timeframe, OHLCVBar


@pytest.fixture
def store(tmp_path):
    return ParquetStore(data_dir=tmp_path)


@pytest.fixture
def sample_bars():
    return [
        OHLCVBar(timestamp=1735819800, open=5950.25, high=5952.50, low=5949.00, close=5951.75, volume=12543),
        OHLCVBar(timestamp=1735819860, open=5951.75, high=5953.00, low=5950.50, close=5952.25, volume=8721),
        OHLCVBar(timestamp=1735819920, open=5952.25, high=5954.75, low=5951.00, close=5954.50, volume=15234),
    ]


def test_save_and_load(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded = store.load(Market.ES, Timeframe.M1)
    assert len(loaded) == 3
    assert loaded[0].open == 5950.25


def test_load_empty(store):
    loaded = store.load(Market.ES, Timeframe.M1)
    assert loaded == []


def test_save_appends(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars[:2])
    store.save(Market.ES, Timeframe.M1, sample_bars[2:])
    loaded = store.load(Market.ES, Timeframe.M1)
    assert len(loaded) == 3


def test_save_deduplicates(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded = store.load(Market.ES, Timeframe.M1)
    assert len(loaded) == 3


def test_load_time_range(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded = store.load(Market.ES, Timeframe.M1, start_ts=1735819860, end_ts=1735819920)
    assert len(loaded) == 2
    assert loaded[0].timestamp == 1735819860


def test_separate_markets(store, sample_bars):
    store.save(Market.ES, Timeframe.M1, sample_bars)
    loaded_nq = store.load(Market.NQ, Timeframe.M1)
    assert loaded_nq == []

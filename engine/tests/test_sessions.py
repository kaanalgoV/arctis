import pytest
from datetime import datetime, timezone, timedelta
from arctis.analysis.sessions import (
    Session,
    classify_session,
    get_session_stats,
    SessionStats,
)
from arctis.models import OHLCVBar


def ts_et(hour: int, minute: int = 0) -> int:
    """Create unix timestamp for a given ET hour on 2025-01-02.
    ET is UTC-5, so we add 5 hours to get the UTC equivalent."""
    utc_dt = datetime(2025, 1, 2, hour + 5, minute, tzinfo=timezone.utc)
    return int(utc_dt.timestamp())


class TestClassifySession:
    def test_premarket(self):
        assert classify_session(ts_et(7, 0)) == Session.PREMARKET

    def test_ny_open(self):
        assert classify_session(ts_et(9, 45)) == Session.NY_OPEN

    def test_midday(self):
        assert classify_session(ts_et(12, 0)) == Session.MIDDAY

    def test_power_hour(self):
        assert classify_session(ts_et(15, 0)) == Session.POWER_HOUR

    def test_after_hours(self):
        assert classify_session(ts_et(17, 0)) == Session.AFTER_HOURS


class TestSessionStats:
    def test_basic_stats(self):
        bars = [
            OHLCVBar(timestamp=ts_et(9, 30 + i), open=100, high=101 + i * 0.5, low=99, close=100 + i * 0.5, volume=1000 + i * 100)
            for i in range(30)
        ]
        stats = get_session_stats(bars)
        assert Session.NY_OPEN in stats
        assert stats[Session.NY_OPEN].bar_count > 0
        assert stats[Session.NY_OPEN].avg_volume > 0
        assert stats[Session.NY_OPEN].avg_range > 0

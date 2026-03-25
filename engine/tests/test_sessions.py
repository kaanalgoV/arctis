import pytest
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from unittest.mock import patch

from arctis.analysis.sessions import (
    Session,
    SessionStats,
    classify_session,
    get_current_session,
    get_recent_transition,
    get_session_context,
    get_session_stats,
    get_session_progress,
    get_today_session_stats,
)
from arctis.models import OHLCVBar

ET = ZoneInfo("America/New_York")


def ts_et(hour: int, minute: int = 0, second: int = 0, date: tuple = (2026, 3, 25)) -> int:
    """Create a unix timestamp for a given ET time on a given date.

    Uses zoneinfo to correctly handle DST — no manual UTC offset arithmetic.
    Default date is 2026-03-25 (a Tuesday, standard trading day, EDT = UTC-4).
    """
    dt = datetime(date[0], date[1], date[2], hour, minute, second, tzinfo=ET)
    return int(dt.timestamp())


# ---------------------------------------------------------------------------
# TestClassifySession — exact boundary verification
# ---------------------------------------------------------------------------

class TestClassifySession:
    """Verify session classification at exact boundary times."""

    # --- OVERNIGHT ---
    def test_overnight_early_morning(self):
        # 00:30 ET -> overnight
        assert classify_session(ts_et(0, 30)) == Session.OVERNIGHT

    def test_overnight_before_premarket(self):
        # 03:59 ET -> still overnight (premarket starts at 04:00)
        assert classify_session(ts_et(3, 59)) == Session.OVERNIGHT

    def test_overnight_evening(self):
        # 18:01 ET -> overnight (after-hours ends at 18:00)
        assert classify_session(ts_et(18, 1)) == Session.OVERNIGHT

    def test_overnight_midnight(self):
        # 23:59 ET -> overnight
        assert classify_session(ts_et(23, 59)) == Session.OVERNIGHT

    # --- PREMARKET ---
    def test_premarket_start_exact(self):
        # 04:00 ET -> premarket opens exactly
        assert classify_session(ts_et(4, 0)) == Session.PREMARKET

    def test_premarket_midpoint(self):
        # 07:00 ET -> premarket
        assert classify_session(ts_et(7, 0)) == Session.PREMARKET

    def test_premarket_last_minute(self):
        # 09:29 ET -> still premarket (NY_OPEN starts at 09:30)
        assert classify_session(ts_et(9, 29)) == Session.PREMARKET

    # --- NY_OPEN ---
    def test_ny_open_exact_start(self):
        # 09:30 ET -> NY Open begins
        assert classify_session(ts_et(9, 30)) == Session.NY_OPEN

    def test_ny_open_one_minute_in(self):
        # 09:31 ET -> NY Open
        assert classify_session(ts_et(9, 31)) == Session.NY_OPEN

    def test_ny_open_last_minute(self):
        # 10:29 ET -> still NY Open
        assert classify_session(ts_et(10, 29)) == Session.NY_OPEN

    # --- MIDDAY ---
    def test_midday_exact_start(self):
        # 10:30 ET -> Midday begins
        assert classify_session(ts_et(10, 30)) == Session.MIDDAY

    def test_midday_midpoint(self):
        # 12:00 ET -> midday
        assert classify_session(ts_et(12, 0)) == Session.MIDDAY

    def test_midday_last_minute(self):
        # 13:59 ET -> still midday
        assert classify_session(ts_et(13, 59)) == Session.MIDDAY

    # --- AFTERNOON ---
    def test_afternoon_exact_start(self):
        # 14:00 ET -> Afternoon begins
        assert classify_session(ts_et(14, 0)) == Session.AFTERNOON

    def test_afternoon_midpoint(self):
        # 14:30 ET -> afternoon
        assert classify_session(ts_et(14, 30)) == Session.AFTERNOON

    def test_afternoon_last_minute(self):
        # 14:59 ET -> still afternoon
        assert classify_session(ts_et(14, 59)) == Session.AFTERNOON

    # --- POWER_HOUR ---
    def test_power_hour_exact_start(self):
        # 15:00 ET -> Power Hour begins
        assert classify_session(ts_et(15, 0)) == Session.POWER_HOUR

    def test_power_hour_midpoint(self):
        # 15:30 ET -> power hour
        assert classify_session(ts_et(15, 30)) == Session.POWER_HOUR

    def test_power_hour_last_minute(self):
        # 15:59 ET -> still power hour
        assert classify_session(ts_et(15, 59)) == Session.POWER_HOUR

    # --- AFTER_HOURS ---
    def test_after_hours_exact_start(self):
        # 16:00 ET -> After Hours begins
        assert classify_session(ts_et(16, 0)) == Session.AFTER_HOURS

    def test_after_hours_midpoint(self):
        # 17:00 ET -> after hours
        assert classify_session(ts_et(17, 0)) == Session.AFTER_HOURS

    def test_after_hours_last_minute(self):
        # 17:59 ET -> still after hours
        assert classify_session(ts_et(17, 59)) == Session.AFTER_HOURS

    def test_after_hours_end_transitions_to_overnight(self):
        # 18:00 ET -> back to overnight
        assert classify_session(ts_et(18, 0)) == Session.OVERNIGHT

    # --- DST edge case: EST (UTC-5) in January ---
    def test_boundary_in_est_january(self):
        """09:29 EST (UTC-5) -> premarket, 09:30 EST -> ny_open."""
        jan_date = (2026, 1, 15)  # January = EST
        assert classify_session(ts_et(9, 29, date=jan_date)) == Session.PREMARKET
        assert classify_session(ts_et(9, 30, date=jan_date)) == Session.NY_OPEN


# ---------------------------------------------------------------------------
# TestSessionStats
# ---------------------------------------------------------------------------

class TestSessionStats:
    def test_basic_stats(self):
        bars = [
            OHLCVBar(
                timestamp=ts_et(9, 30 + i),
                open=100, high=101 + i * 0.5, low=99,
                close=100 + i * 0.5, volume=1000 + i * 100,
            )
            for i in range(30)
        ]
        stats = get_session_stats(bars)
        assert Session.NY_OPEN in stats
        assert stats[Session.NY_OPEN].bar_count > 0
        assert stats[Session.NY_OPEN].avg_volume > 0
        assert stats[Session.NY_OPEN].avg_range > 0

    def test_all_sessions_classified(self):
        """One bar per session — verify all are recognised."""
        bar_times = [
            (1, 0, Session.OVERNIGHT),
            (6, 0, Session.PREMARKET),
            (9, 45, Session.NY_OPEN),
            (12, 0, Session.MIDDAY),
            (14, 15, Session.AFTERNOON),
            (15, 15, Session.POWER_HOUR),
            (17, 0, Session.AFTER_HOURS),
        ]
        bars = [
            OHLCVBar(
                timestamp=ts_et(h, m),
                open=100, high=101, low=99, close=100, volume=500,
            )
            for h, m, _ in bar_times
        ]
        stats = get_session_stats(bars)
        for _, _, expected_session in bar_times:
            assert expected_session in stats, f"{expected_session.value} missing from stats"


# ---------------------------------------------------------------------------
# TestGetSessionContext — real-time context dict
# ---------------------------------------------------------------------------

class TestGetSessionContext:
    def test_returns_required_fields(self):
        ctx = get_session_context()
        required = {
            "current_session", "session_start_et", "session_end_et",
            "session_progress", "next_session", "time_to_next",
            "is_rth", "current_time_et", "recent_transition",
        }
        assert required.issubset(ctx.keys()), f"Missing keys: {required - ctx.keys()}"

    def test_session_progress_in_range(self):
        ctx = get_session_context()
        p = ctx["session_progress"]
        assert 0.0 <= p <= 1.0, f"session_progress out of range: {p}"

    def test_time_to_next_format(self):
        """time_to_next must be HH:MM:SS format."""
        ctx = get_session_context()
        ttn = ctx["time_to_next"]
        parts = ttn.split(":")
        assert len(parts) == 3, f"Unexpected format: {ttn}"
        assert all(p.isdigit() for p in parts), f"Non-numeric parts: {ttn}"

    def test_is_rth_type(self):
        ctx = get_session_context()
        assert isinstance(ctx["is_rth"], bool)

    def test_ny_open_is_rth(self):
        """At 10:00 ET the context must report is_rth=True."""
        mock_ts = ts_et(10, 0)
        with patch("arctis.analysis.sessions._time.time", return_value=float(mock_ts)):
            ctx = get_session_context()
        assert ctx["is_rth"] is True
        assert ctx["current_session"] == Session.NY_OPEN.value

    def test_overnight_is_not_rth(self):
        """At 02:00 ET the context must report is_rth=False."""
        mock_ts = ts_et(2, 0)
        with patch("arctis.analysis.sessions._time.time", return_value=float(mock_ts)):
            ctx = get_session_context()
        assert ctx["is_rth"] is False
        assert ctx["current_session"] == Session.OVERNIGHT.value


# ---------------------------------------------------------------------------
# TestGetRecentTransition — session boundary crossing detection
# ---------------------------------------------------------------------------

class TestGetRecentTransition:
    def test_no_transition_mid_session(self):
        """Well into NY Open (10:00 ET) — no recent transition."""
        ts = ts_et(10, 0)
        result = get_recent_transition(ts)
        assert result is None

    def test_transition_at_ny_open_start(self):
        """Exactly at 09:30 ET — should detect premarket -> ny_open."""
        ts = ts_et(9, 30)
        result = get_recent_transition(ts)
        assert result is not None
        assert result["from"] == "premarket"
        assert result["to"] == "ny_open"
        assert result["minutes_ago"] == 0
        assert result["at"] == "09:30:00 ET"

    def test_transition_two_minutes_after_ny_open(self):
        """Two minutes after 09:30 — transition still visible."""
        ts = ts_et(9, 32)
        result = get_recent_transition(ts)
        assert result is not None
        assert result["to"] == "ny_open"
        assert result["minutes_ago"] == 2

    def test_transition_five_minutes_after_ny_open_is_stale(self):
        """Five minutes exactly is outside the window."""
        ts = ts_et(9, 35)
        result = get_recent_transition(ts)
        # 9:35 is 5 minutes after 9:30; window is < 5 (exclusive), so no transition.
        assert result is None

    def test_transition_at_premarket_start(self):
        """At 04:00 ET — overnight -> premarket."""
        ts = ts_et(4, 0)
        result = get_recent_transition(ts)
        assert result is not None
        assert result["from"] == "overnight"
        assert result["to"] == "premarket"

    def test_transition_at_after_hours_end_overnight(self):
        """At 18:00 ET — after_hours -> overnight."""
        ts = ts_et(18, 0)
        result = get_recent_transition(ts)
        assert result is not None
        assert result["from"] == "after_hours"
        assert result["to"] == "overnight"

    def test_recent_transition_in_context(self):
        """get_session_context embeds recent_transition correctly."""
        # Simulate being 1 minute after midday start (10:31 ET)
        ts = ts_et(10, 31)
        with patch("arctis.analysis.sessions._time.time", return_value=float(ts)):
            ctx = get_session_context()
        rt = ctx["recent_transition"]
        assert rt is not None
        assert rt["to"] == "midday"
        assert rt["from"] == "ny_open"


# ---------------------------------------------------------------------------
# TestGetSessionProgress — 0.0-1.0 progress through current session
# ---------------------------------------------------------------------------

class TestGetSessionProgress:
    def test_progress_at_session_start(self):
        """At 09:30 ET progress through NY_OPEN should be ~0.0."""
        ts = ts_et(9, 30)
        with patch("arctis.analysis.sessions._time.time", return_value=float(ts)):
            p = get_session_progress(Session.NY_OPEN)
        assert p == pytest.approx(0.0, abs=0.02)

    def test_progress_at_session_midpoint(self):
        """At 10:00 ET (30 min into 60-min NY_OPEN) progress should be ~0.5."""
        ts = ts_et(10, 0)
        with patch("arctis.analysis.sessions._time.time", return_value=float(ts)):
            p = get_session_progress(Session.NY_OPEN)
        assert p == pytest.approx(0.5, abs=0.02)

    def test_progress_at_session_end(self):
        """At 10:29 ET (near end of NY_OPEN) progress should be close to 1.0."""
        ts = ts_et(10, 29)
        with patch("arctis.analysis.sessions._time.time", return_value=float(ts)):
            p = get_session_progress(Session.NY_OPEN)
        assert p > 0.95

    def test_progress_always_clamped(self):
        """Progress must always be between 0 and 1."""
        for h in range(0, 24):
            ts = ts_et(h, 0)
            with patch("arctis.analysis.sessions._time.time", return_value=float(ts)):
                p = get_session_progress()
            assert 0.0 <= p <= 1.0, f"progress={p} out of range at ET {h:02d}:00"

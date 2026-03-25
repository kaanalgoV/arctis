"""Session and time-based analysis."""

import time as _time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from zoneinfo import ZoneInfo

from arctis.models import OHLCVBar

ET = ZoneInfo("America/New_York")

# Session boundaries as (start_minute, end_minute) in ET minutes-since-midnight.
# OVERNIGHT wraps around midnight: 18:00 (1080) -> 04:00 next day (240).
_SESSION_BOUNDARIES: dict[str, tuple[int, int]] = {
    "PREMARKET":   (240,  570),   # 04:00 - 09:30
    "NY_OPEN":     (570,  630),   # 09:30 - 10:30
    "MIDDAY":      (630,  840),   # 10:30 - 14:00
    "AFTERNOON":   (840,  900),   # 14:00 - 15:00
    "POWER_HOUR":  (900,  960),   # 15:00 - 16:00
    "AFTER_HOURS": (960,  1080),  # 16:00 - 18:00
    # OVERNIGHT: everything outside 04:00-18:00 (wraps midnight)
}

# Human-readable boundary strings (ET) for each session.
_SESSION_META: dict[str, tuple[str, str, str]] = {
    # key -> (start_et_str, end_et_str, next_session_key)
    "OVERNIGHT":   ("18:00", "04:00", "PREMARKET"),
    "PREMARKET":   ("04:00", "09:30", "NY_OPEN"),
    "NY_OPEN":     ("09:30", "10:30", "MIDDAY"),
    "MIDDAY":      ("10:30", "14:00", "AFTERNOON"),
    "AFTERNOON":   ("14:00", "15:00", "POWER_HOUR"),
    "POWER_HOUR":  ("15:00", "16:00", "AFTER_HOURS"),
    "AFTER_HOURS": ("16:00", "18:00", "OVERNIGHT"),
}

# Regular Trading Hours: 09:30-16:00
_RTH_START = 570   # 09:30 in minutes
_RTH_END   = 960   # 16:00 in minutes


class Session(str, Enum):
    OVERNIGHT   = "overnight"
    PREMARKET   = "premarket"
    NY_OPEN     = "ny_open"
    MIDDAY      = "midday"
    AFTERNOON   = "afternoon"
    POWER_HOUR  = "power_hour"
    AFTER_HOURS = "after_hours"


@dataclass
class SessionStats:
    session: Session
    bar_count: int
    avg_volume: float
    avg_range: float
    total_volume: int


def _to_et_dt(unix_ts: int) -> datetime:
    return datetime.fromtimestamp(unix_ts, tz=timezone.utc).astimezone(ET)


def _to_et_hour_minute(unix_ts: int) -> tuple[int, int]:
    dt = _to_et_dt(unix_ts)
    return dt.hour, dt.minute


def _time_val(hour: int, minute: int) -> int:
    """Convert hour/minute to minutes-since-midnight."""
    return hour * 60 + minute


def classify_session(unix_ts: int) -> Session:
    """Classify a unix timestamp into a trading session based on ET time.

    Session boundaries (ET):
      - OVERNIGHT:   18:00 (prev day) - 04:00  (Globex / CME electronic)
      - PREMARKET:   04:00 - 09:30
      - NY_OPEN:     09:30 - 10:30  (first hour, highest volatility)
      - MIDDAY:      10:30 - 14:00  (lunch / consolidation)
      - AFTERNOON:   14:00 - 15:00  (pre-power-hour)
      - POWER_HOUR:  15:00 - 16:00  (MOC orders, high volume)
      - AFTER_HOURS: 16:00 - 18:00  (post-close electronic)
      - OVERNIGHT:   18:00 - 04:00  (Globex continues)
    """
    hour, minute = _to_et_hour_minute(unix_ts)
    tv = _time_val(hour, minute)

    if tv < 240:        # 00:00 - 04:00
        return Session.OVERNIGHT
    elif tv < 570:      # 04:00 - 09:30
        return Session.PREMARKET
    elif tv < 630:      # 09:30 - 10:30
        return Session.NY_OPEN
    elif tv < 840:      # 10:30 - 14:00
        return Session.MIDDAY
    elif tv < 900:      # 14:00 - 15:00
        return Session.AFTERNOON
    elif tv < 960:      # 15:00 - 16:00
        return Session.POWER_HOUR
    elif tv < 1080:     # 16:00 - 18:00
        return Session.AFTER_HOURS
    else:               # 18:00 - 24:00
        return Session.OVERNIGHT


def get_current_session() -> Session:
    """Get the current trading session based on real wall clock time (not bar timestamp)."""
    return classify_session(int(_time.time()))


def _session_key(session: Session) -> str:
    return session.value.upper()


def _is_rth(time_val: int) -> bool:
    """Return True if time_val (minutes since midnight ET) is within RTH (09:30-16:00)."""
    return _RTH_START <= time_val < _RTH_END


def get_session_progress(session: Session | None = None) -> float:
    """Return fraction (0.0-1.0) through the current (or given) session based on real time.

    Returns 0.0 if the session boundary cannot be determined.
    """
    now_et = datetime.fromtimestamp(_time.time(), tz=ET)
    tv = _time_val(now_et.hour, now_et.minute) + now_et.second / 60.0

    if session is None:
        session = get_current_session()

    key = _session_key(session)
    meta = _SESSION_META.get(key)
    if meta is None:
        return 0.0

    start_str, end_str, _ = meta

    def parse(s: str) -> float:
        h, m = s.split(":")
        return int(h) * 60 + int(m)

    start = parse(start_str)
    end   = parse(end_str)

    if key == "OVERNIGHT":
        # OVERNIGHT wraps midnight: 18:00 -> 04:00 (+1 day)
        duration = (24 * 60 - 1080) + 240   # 10 hours = 600 min
        if tv >= 1080:
            elapsed = tv - 1080
        else:
            elapsed = (24 * 60 - 1080) + tv  # past-midnight portion
        progress = elapsed / duration
    else:
        if end <= start:
            return 0.0
        duration = end - start
        elapsed  = max(0.0, tv - start)
        progress = elapsed / duration

    return round(min(max(progress, 0.0), 1.0), 4)


_TRANSITION_WINDOW_MINUTES = 5

# Ordered list of sessions for transition detection (excludes OVERNIGHT — handled separately).
_SESSION_ORDER = [
    "PREMARKET",
    "NY_OPEN",
    "MIDDAY",
    "AFTERNOON",
    "POWER_HOUR",
    "AFTER_HOURS",
    "OVERNIGHT",
]


def get_recent_transition(now_unix: int | None = None) -> dict | None:
    """Detect if a session boundary was crossed within the last _TRANSITION_WINDOW_MINUTES.

    Returns a dict with from/to/at/minutes_ago, or None if no recent transition.

    Example return value::

        {
            "from": "premarket",
            "to": "ny_open",
            "at": "09:30:00 ET",
            "minutes_ago": 3,
        }
    """
    if now_unix is None:
        now_unix = int(_time.time())

    now_et  = _to_et_dt(now_unix)
    now_min = now_et.hour * 60 + now_et.minute

    for key, (start_min, _end_min) in _SESSION_BOUNDARIES.items():
        minutes_since_start = now_min - start_min
        if 0 <= minutes_since_start < _TRANSITION_WINDOW_MINUTES:
            # Find which session precedes this one in the ordered list.
            idx = _SESSION_ORDER.index(key) if key in _SESSION_ORDER else -1
            if idx > 0:
                prev_key = _SESSION_ORDER[idx - 1]
            elif idx == 0:
                prev_key = "OVERNIGHT"
            else:
                prev_key = "OVERNIGHT"

            h, m = divmod(start_min, 60)
            return {
                "from":         prev_key.lower(),
                "to":           key.lower(),
                "at":           f"{h:02d}:{m:02d}:00 ET",
                "minutes_ago":  minutes_since_start,
            }

    # Also check for OVERNIGHT start (18:00 ET = 1080 minutes)
    overnight_start = 1080
    minutes_since_overnight = now_min - overnight_start
    if 0 <= minutes_since_overnight < _TRANSITION_WINDOW_MINUTES:
        return {
            "from":         "after_hours",
            "to":           "overnight",
            "at":           "18:00:00 ET",
            "minutes_ago":  minutes_since_overnight,
        }

    return None


def get_session_context() -> dict:
    """Return a comprehensive session context dict using real wall clock time.

    Fields:
      current_session     – e.g. "ny_open"
      session_start_et    – "09:30:00"
      session_end_et      – "10:30:00"
      session_progress    – 0.0-1.0
      next_session        – "midday"
      time_to_next        – "HH:MM:SS"
      is_rth              – bool (09:30-16:00 ET)
      current_time_et     – "HH:MM:SS" wall clock in ET
      recent_transition   – dict or None (transition within last 5 minutes)
    """
    now_unix = int(_time.time())
    session  = classify_session(now_unix)
    key      = _session_key(session)
    meta     = _SESSION_META.get(key, ("00:00", "00:00", "overnight"))

    start_str, end_str, next_key = meta
    next_session = next_key.lower()
    progress     = get_session_progress(session)

    now_et = datetime.fromtimestamp(now_unix, tz=ET)
    tv     = _time_val(now_et.hour, now_et.minute)

    # Calculate time to next session boundary
    def parse_min(s: str) -> int:
        h, m = s.split(":")
        return int(h) * 60 + int(m)

    end_min    = parse_min(end_str)
    now_min    = now_et.hour * 60 + now_et.minute
    now_total  = now_min * 60 + now_et.second

    if key == "OVERNIGHT":
        # End is 04:00 next day (or same day if past midnight)
        if now_min >= 1080:   # 18:00+
            end_total = (24 * 60 + 240) * 60   # next day 04:00
        else:
            end_total = 240 * 60               # today 04:00
    else:
        end_total = end_min * 60

    diff_secs = max(0, end_total - now_total)
    # Always produce zero-padded HH:MM:SS (timedelta.__str__ omits leading hour zero)
    _h = int(diff_secs // 3600)
    _m = int((diff_secs % 3600) // 60)
    _s = int(diff_secs % 60)
    time_to_next = f"{_h:02d}:{_m:02d}:{_s:02d}"

    return {
        "current_session":   session.value,
        "session_start_et":  start_str + ":00",
        "session_end_et":    end_str   + ":00",
        "session_progress":  progress,
        "next_session":      next_session,
        "time_to_next":      time_to_next,
        "is_rth":            _is_rth(tv),
        "current_time_et":   now_et.strftime("%H:%M:%S"),
        "recent_transition": get_recent_transition(now_unix),
    }


def _et_date(unix_ts: int) -> str:
    """Return the ET calendar date string for a unix timestamp (YYYY-MM-DD)."""
    return _to_et_dt(unix_ts).strftime("%Y-%m-%d")


def get_session_stats(bars: list[OHLCVBar]) -> dict[Session, SessionStats]:
    """Calculate statistics per trading session from a list of OHLCV bars (all days)."""
    session_bars: dict[Session, list[OHLCVBar]] = {}

    for bar in bars:
        session = classify_session(bar.timestamp)
        if session not in session_bars:
            session_bars[session] = []
        session_bars[session].append(bar)

    return _compute_stats(session_bars)


def get_today_session_stats(bars: list[OHLCVBar]) -> dict[Session, SessionStats]:
    """Calculate statistics per session using only TODAY's bars (ET date).

    For OVERNIGHT bars, "today" refers to the session that started yesterday
    evening and continues into today's early hours — bars from 18:00 ET
    yesterday through 04:00 ET today are included.
    """
    today_et = _et_date(int(_time.time()))

    today_bars = []
    for bar in bars:
        bar_date = _et_date(bar.timestamp)
        bar_et   = _to_et_dt(bar.timestamp)
        bar_tv   = _time_val(bar_et.hour, bar_et.minute)

        if bar_date == today_et:
            today_bars.append(bar)
        elif bar_tv >= 1080:
            # Overnight bars from yesterday evening (18:00+) belong to today's session
            yesterday_et = (datetime.strptime(today_et, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
            if bar_date == yesterday_et:
                today_bars.append(bar)

    session_bars: dict[Session, list[OHLCVBar]] = {}
    for bar in today_bars:
        session = classify_session(bar.timestamp)
        if session not in session_bars:
            session_bars[session] = []
        session_bars[session].append(bar)

    return _compute_stats(session_bars)


def _compute_stats(session_bars: dict[Session, list[OHLCVBar]]) -> dict[Session, SessionStats]:
    stats: dict[Session, SessionStats] = {}
    for session, s_bars in session_bars.items():
        volumes = [b.volume for b in s_bars]
        ranges  = [b.high - b.low for b in s_bars]
        stats[session] = SessionStats(
            session=session,
            bar_count=len(s_bars),
            avg_volume=sum(volumes) / len(volumes),
            avg_range=sum(ranges) / len(ranges),
            total_volume=sum(volumes),
        )
    return stats

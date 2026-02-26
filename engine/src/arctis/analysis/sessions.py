"""Session and time-based analysis."""

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum

from arctis.models import OHLCVBar

ET_OFFSET = timedelta(hours=-5)


class Session(str, Enum):
    PREMARKET = "premarket"
    NY_OPEN = "ny_open"
    MIDDAY = "midday"
    POWER_HOUR = "power_hour"
    AFTER_HOURS = "after_hours"
    CLOSED = "closed"


@dataclass
class SessionStats:
    session: Session
    bar_count: int
    avg_volume: float
    avg_range: float
    total_volume: int


def _to_et_hour_minute(unix_ts: int) -> tuple[int, int]:
    utc_dt = datetime.fromtimestamp(unix_ts, tz=timezone.utc)
    et_dt = utc_dt + ET_OFFSET
    return et_dt.hour, et_dt.minute


def classify_session(unix_ts: int) -> Session:
    """Classify a unix timestamp into a trading session based on ET time.

    Session boundaries (ET):
      - CLOSED:      00:00 - 04:00
      - PREMARKET:   04:00 - 09:30
      - NY_OPEN:     09:30 - 10:30
      - MIDDAY:      10:30 - 14:00
      - POWER_HOUR:  14:00 - 16:00
      - AFTER_HOURS:  16:00 - 20:00
      - CLOSED:      20:00 - 00:00
    """
    hour, minute = _to_et_hour_minute(unix_ts)
    time_val = hour * 60 + minute

    if time_val < 240:       # before 04:00
        return Session.CLOSED
    elif time_val < 570:     # 04:00 - 09:30
        return Session.PREMARKET
    elif time_val < 630:     # 09:30 - 10:30
        return Session.NY_OPEN
    elif time_val < 840:     # 10:30 - 14:00
        return Session.MIDDAY
    elif time_val < 960:     # 14:00 - 16:00
        return Session.POWER_HOUR
    elif time_val < 1200:    # 16:00 - 20:00
        return Session.AFTER_HOURS
    else:                    # 20:00+
        return Session.CLOSED


def get_session_stats(bars: list[OHLCVBar]) -> dict[Session, SessionStats]:
    """Calculate statistics per trading session from a list of OHLCV bars."""
    session_bars: dict[Session, list[OHLCVBar]] = {}

    for bar in bars:
        session = classify_session(bar.timestamp)
        if session not in session_bars:
            session_bars[session] = []
        session_bars[session].append(bar)

    stats: dict[Session, SessionStats] = {}
    for session, s_bars in session_bars.items():
        volumes = [b.volume for b in s_bars]
        ranges = [b.high - b.low for b in s_bars]
        stats[session] = SessionStats(
            session=session,
            bar_count=len(s_bars),
            avg_volume=sum(volumes) / len(volumes),
            avg_range=sum(ranges) / len(ranges),
            total_volume=sum(volumes),
        )

    return stats

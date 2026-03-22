"""Naked POC Tracker: identifies untested Points of Control across trading days."""

from dataclasses import dataclass
from datetime import datetime, timezone

from arctis.models import OHLCVBar
from arctis.analysis.volume_profile import build_volume_profile

_DAY_GAP_SECONDS = 6 * 3600  # gap > 6 hours = new trading day


@dataclass
class NakedPOC:
    date: str        # YYYY-MM-DD (UTC)
    poc_price: float
    is_naked: bool
    distance: float  # absolute distance from last close price


def _group_bars_by_day(bars: list[OHLCVBar]) -> list[list[OHLCVBar]]:
    """Split bars into trading days using a 6-hour gap heuristic."""
    if not bars:
        return []

    days: list[list[OHLCVBar]] = []
    current_day: list[OHLCVBar] = [bars[0]]

    for i in range(1, len(bars)):
        if bars[i].timestamp - bars[i - 1].timestamp > _DAY_GAP_SECONDS:
            days.append(current_day)
            current_day = [bars[i]]
        else:
            current_day.append(bars[i])

    days.append(current_day)
    return days


def _date_label(bar: OHLCVBar) -> str:
    """Return YYYY-MM-DD UTC string for the first bar of a day group."""
    dt = datetime.fromtimestamp(bar.timestamp, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d")


def _poc_is_touched(poc: float, bars: list[OHLCVBar]) -> bool:
    """Return True if any bar's low-high range touches or crosses the POC price."""
    for bar in bars:
        if bar.low <= poc <= bar.high:
            return True
    return False


def find_naked_pocs(bars: list[OHLCVBar]) -> list[NakedPOC]:
    """Find all untested (naked) daily POCs.

    A POC is considered naked if no bar that closed *after* the day on which
    the POC was formed has a low-high range that includes the POC price.

    Args:
        bars: Chronologically ordered OHLCV bars across one or more trading days.

    Returns:
        List of NakedPOC objects sorted by ascending distance from the last
        close price.  Only POCs from all-but-the-most-recent day are evaluated
        (the current day's POC cannot yet be tested against future bars).
    """
    if not bars:
        return []

    days = _group_bars_by_day(bars)
    last_close = bars[-1].close
    result: list[NakedPOC] = []

    # Evaluate every day except the last (no future bars to test against).
    for day_idx, day_bars in enumerate(days[:-1]):
        profile = build_volume_profile(day_bars)
        if profile is None:
            continue

        poc = profile.poc
        date = _date_label(day_bars[0])

        # All bars strictly after this day.
        subsequent_bars: list[OHLCVBar] = []
        for later_day in days[day_idx + 1 :]:
            subsequent_bars.extend(later_day)

        is_naked = not _poc_is_touched(poc, subsequent_bars)
        distance = abs(last_close - poc)

        result.append(
            NakedPOC(
                date=date,
                poc_price=poc,
                is_naked=is_naked,
                distance=distance,
            )
        )

    result.sort(key=lambda n: n.distance)
    return result

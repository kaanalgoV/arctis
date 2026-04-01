"""VWAP (Volume Weighted Average Price) with deviation bands."""

from dataclasses import dataclass

from arctis.models import OHLCVBar


@dataclass
class VWAPData:
    timestamp: int
    vwap: float
    upper_1: float  # +1 SD
    lower_1: float  # -1 SD
    upper_2: float  # +2 SD
    lower_2: float  # -2 SD


def calculate_vwap(bars: list[OHLCVBar]) -> list[VWAPData]:
    """Calculate session-anchored VWAP with 1/2 SD bands.

    Resets daily at RTH open (14:30 UTC = 09:30 ET) — same as TradingView.
    For CME futures that trade 23 hours, a time-gap reset is unreliable.
    Instead we detect when the bar crosses the 14:30 UTC boundary.
    """
    if len(bars) < 2:
        return []

    from datetime import datetime, timezone
    from zoneinfo import ZoneInfo

    ET = ZoneInfo("America/New_York")
    results = []
    cum_tp_vol = 0.0
    cum_vol = 0.0
    cum_tp2_vol = 0.0
    prev_trading_day = None

    for bar in bars:
        # Convert to ET for correct RTH detection (handles EST/EDT automatically)
        et_dt = datetime.fromtimestamp(bar.timestamp, tz=timezone.utc).astimezone(ET)
        et_minutes = et_dt.hour * 60 + et_dt.minute

        # RTH = 09:30 - 16:00 ET (CME Regular Trading Hours)
        is_rth = 570 <= et_minutes < 960  # 09:30 - 16:00 ET

        # Trading day resets at RTH open (09:30 ET)
        if et_minutes < 570:
            trading_day = (et_dt.date().toordinal() - 1)
        else:
            trading_day = et_dt.date().toordinal()

        # Reset VWAP at new RTH session
        if prev_trading_day is not None and trading_day != prev_trading_day:
            cum_tp_vol = 0.0
            cum_vol = 0.0
            cum_tp2_vol = 0.0

        prev_trading_day = trading_day

        # Only accumulate volume during RTH — skip pre-RTH bars entirely.
        # No VWAP data emitted for overnight/premarket = clean line on chart.
        if not is_rth:
            continue

        tp = (bar.high + bar.low + bar.close) / 3.0
        cum_tp_vol += tp * bar.volume
        cum_vol += bar.volume
        cum_tp2_vol += (tp * tp) * bar.volume

        if cum_vol == 0:
            continue

        vwap = cum_tp_vol / cum_vol
        variance = max(0.0, (cum_tp2_vol / cum_vol) - vwap * vwap)
        sd = variance**0.5

        results.append(
            VWAPData(
                timestamp=bar.timestamp,
                vwap=round(vwap, 2),
                upper_1=round(vwap + sd, 2),
                lower_1=round(vwap - sd, 2),
                upper_2=round(vwap + 2 * sd, 2),
                lower_2=round(vwap - 2 * sd, 2),
            )
        )

    # Return VWAP for ALL loaded days (each day resets independently at RTH open).
    # The chart handles per-session rendering — no need to filter server-side.
    return results

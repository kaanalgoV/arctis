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

    results = []
    cum_tp_vol = 0.0
    cum_vol = 0.0
    cum_tp2_vol = 0.0
    prev_trading_day = None

    for bar in bars:
        # Determine the trading day for this bar.
        # CME trading day starts at 17:00 CT (23:00 UTC) previous calendar day.
        # For VWAP reset we use 14:30 UTC (09:30 ET = RTH open) as the anchor.
        dt = datetime.fromtimestamp(bar.timestamp, tz=timezone.utc)
        # Trading day: if before 14:30 UTC, it belongs to the previous calendar date.
        # If at or after 14:30 UTC, it's the current date.
        if dt.hour < 14 or (dt.hour == 14 and dt.minute < 30):
            trading_day = (dt.date().toordinal() - 1)  # previous day's session
        else:
            trading_day = dt.date().toordinal()

        # Reset VWAP at new trading day
        if prev_trading_day is not None and trading_day != prev_trading_day:
            cum_tp_vol = 0.0
            cum_vol = 0.0
            cum_tp2_vol = 0.0

        prev_trading_day = trading_day

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

    return results

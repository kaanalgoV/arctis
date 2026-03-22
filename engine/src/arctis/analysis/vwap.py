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

    Resets at each new trading day (detected by timestamp gap > 6 hours).
    """
    if len(bars) < 2:
        return []

    results = []
    cum_tp_vol = 0.0
    cum_vol = 0.0
    cum_tp2_vol = 0.0
    prev_ts = bars[0].timestamp

    for bar in bars:
        # Detect session reset (gap > 6 hours = new day)
        if bar.timestamp - prev_ts > 6 * 3600:
            cum_tp_vol = 0.0
            cum_vol = 0.0
            cum_tp2_vol = 0.0

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
        prev_ts = bar.timestamp

    return results

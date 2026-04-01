"""Trading zones calculation based on Travis/Traivend methodology.

v2 (2026-03-27): Zone precision improvements:
  - Volume profile uses full bar range distribution (not just close)
  - POC is a single tick-level price (not a wide band)
  - Naked POCs are single price lines with tight proximity filter
  - Value Area uses precise 70% volume rule with finer binning
  - Timeframe-aware zone widths (1m tighter than 5m/1h)
  - Sammelzone dedup uses percentage-based overlap instead of fixed points
"""

from dataclasses import dataclass

from arctis.models import OHLCVBar


# Tick size per instrument (default NQ/ES)
_DEFAULT_TICK_SIZE: float = 0.25

# Maximum zone width in points per instrument root.
# NQ moves ~200 pts/day so 10 pts is ~5%. ES moves ~60 pts/day so 3 pts is ~5%.
_MAX_ZONE_WIDTH: dict[str, float] = {
    "NQ": 10.0,
    "ES": 3.0,
}
_DEFAULT_MAX_ZONE_WIDTH: float = 10.0

# Timeframe-aware parameters: controls how tight zones are
# Key = approximate bar duration in seconds
_TF_PARAMS: dict[int, dict] = {
    60:   {"bin_ticks": 2, "npoc_range": 80,  "sz_overlap_pct": 0.3},   # 1min
    300:  {"bin_ticks": 4, "npoc_range": 120, "sz_overlap_pct": 0.5},   # 5min
    900:  {"bin_ticks": 8, "npoc_range": 150, "sz_overlap_pct": 0.7},   # 15min
    3600: {"bin_ticks": 16, "npoc_range": 200, "sz_overlap_pct": 1.0},  # 1h
}


def _get_tf_params(bars: list[OHLCVBar]) -> dict:
    """Infer timeframe from bar spacing and return appropriate parameters."""
    if len(bars) < 2:
        return _TF_PARAMS[300]  # default 5min
    # Median gap between bars (skip large gaps which are session breaks)
    gaps = sorted(bars[i].timestamp - bars[i - 1].timestamp for i in range(1, min(50, len(bars))))
    median_gap = gaps[len(gaps) // 2] if gaps else 300
    # Find closest matching timeframe
    best_tf = min(_TF_PARAMS.keys(), key=lambda k: abs(k - median_gap))
    return _TF_PARAMS[best_tf]


@dataclass
class TradingZone:
    name: str          # e.g. "Value Area", "Initial Balance", "Opening Range"
    type: str          # "area" (shaded box) | "line" (horizontal) | "range" (high+low lines)
    high: float
    low: float
    color: str         # hex color
    opacity: float     # 0.0-1.0
    start_time: int    # unix timestamp (for time-bounded zones)
    end_time: int | None  # None = extends to current
    label: str         # display label
    priority: int      # 1=highest importance


def _clamp_zone_width(zone: TradingZone, max_width: float) -> TradingZone:
    """Clamp a zone's width to max_width, keeping the densest center."""
    width = zone.high - zone.low
    if width <= max_width or zone.type == "line":
        return zone
    mid = (zone.high + zone.low) / 2.0
    half = max_width / 2.0
    return TradingZone(
        name=zone.name, type=zone.type,
        high=round(mid + half, 4), low=round(mid - half, 4),
        color=zone.color, opacity=zone.opacity,
        start_time=zone.start_time, end_time=zone.end_time,
        label=zone.label, priority=zone.priority,
    )


def calculate_zones(bars: list[OHLCVBar], market: str = "NQ") -> list[TradingZone]:
    """Calculate all trading zones from bars."""
    if len(bars) < 100:
        return []

    zones = []
    tf_params = _get_tf_params(bars)
    max_width = _MAX_ZONE_WIDTH.get(market.upper()[:2], _DEFAULT_MAX_ZONE_WIDTH)

    # Group bars by trading day (gap > 6 hours = new day)
    days = _group_by_day(bars)

    if len(days) < 2:
        return zones

    current_day = days[-1]
    prev_day = days[-2]

    # 1. Previous Day High/Low/Close
    if prev_day:
        pd_high = max(b.high for b in prev_day)
        pd_low = min(b.low for b in prev_day)
        pd_close = prev_day[-1].close
        zones.append(TradingZone(
            "Prev Day High", "line", pd_high, pd_high,
            "#008757", 0.6, prev_day[-1].timestamp, None, "PDH", 2
        ))
        zones.append(TradingZone(
            "Prev Day Low", "line", pd_low, pd_low,
            "#EF4136", 0.6, prev_day[-1].timestamp, None, "PDL", 2
        ))
        zones.append(TradingZone(
            "Prev Day Close", "line", pd_close, pd_close,
            "#949DA8", 0.4, prev_day[-1].timestamp, None, "PDC", 3
        ))

    # 2. Value Area (from prev day volume profile with timeframe-aware binning)
    #    Zone is clamped to max_width so it never spans the whole day range.
    va = _calculate_value_area(prev_day, bin_ticks=tf_params["bin_ticks"])
    if va:
        va_zone = TradingZone(
            "Value Area", "area", va["vah"], va["val"],
            "#5CB8F0", 0.06, prev_day[0].timestamp, None, "VA", 1
        )
        zones.append(_clamp_zone_width(va_zone, max_width))
        # POC is a single price level (line, not area)
        zones.append(TradingZone(
            "POC", "line", va["poc"], va["poc"],
            "#FBBF24", 0.7, prev_day[0].timestamp, None, "POC", 1
        ))

    # 3. Opening Range (first 15 min of current day = first 15 bars of 1min)
    if len(current_day) >= 15:
        or_bars = current_day[:15]
        or_high = max(b.high for b in or_bars)
        or_low = min(b.low for b in or_bars)
        or_zone = TradingZone(
            "Opening Range", "area", or_high, or_low,
            "#5CB8F0", 0.08, or_bars[0].timestamp, or_bars[-1].timestamp, "OR", 2
        )
        zones.append(_clamp_zone_width(or_zone, max_width))

    # 4. Initial Balance (first 30 min = first 30 bars)
    if len(current_day) >= 30:
        ib_bars = current_day[:30]
        ib_high = max(b.high for b in ib_bars)
        ib_low = min(b.low for b in ib_bars)
        ib_zone = TradingZone(
            "Initial Balance", "area", ib_high, ib_low,
            "#A855F7", 0.05, ib_bars[0].timestamp, ib_bars[-1].timestamp, "IB", 2
        )
        zones.append(_clamp_zone_width(ib_zone, max_width))

    # 5. Overnight Range (from prev day close to current day open)
    if prev_day and current_day:
        prev_close_ts = prev_day[-1].timestamp
        curr_open_ts = current_day[0].timestamp
        overnight_bars = [b for b in bars if prev_close_ts < b.timestamp < curr_open_ts]
        if overnight_bars:
            on_high = max(b.high for b in overnight_bars)
            on_low = min(b.low for b in overnight_bars)
            on_zone = TradingZone(
                "Overnight Range", "area", on_high, on_low,
                "#F7941D", 0.04, overnight_bars[0].timestamp, overnight_bars[-1].timestamp,
                "ONR", 3
            )
            zones.append(_clamp_zone_width(on_zone, max_width))

    # 6. Naked POCs (from all previous days) — single price lines, tight filter
    last_close = bars[-1].close
    npoc_range = tf_params["npoc_range"]
    for day in days[:-1]:
        day_va = _calculate_value_area(day, bin_ticks=tf_params["bin_ticks"])
        if day_va:
            poc = day_va["poc"]
            # Check if POC was retested in subsequent bars (tight tolerance: +/- 1 tick)
            subsequent_bars = [b for b in bars if b.timestamp > day[-1].timestamp]
            tick_tol = _DEFAULT_TICK_SIZE * 2  # 0.50 pts tolerance for "tested"
            is_naked = not any(
                b.low <= poc + tick_tol and b.high >= poc - tick_tol
                for b in subsequent_bars
            )
            if is_naked:
                # Only include NPOCs within timeframe-appropriate range of last close
                if abs(last_close - poc) <= npoc_range:
                    zones.append(TradingZone(
                        "Naked POC", "line", poc, poc,
                        "#FBBF24", 0.5,
                        day[0].timestamp, None,
                        "NPOC", 1
                    ))

    # 7. Sammelzonen (Consolidation/Accumulation zones)
    sammels = _detect_sammelzonen(
        bars[-500:] if len(bars) > 500 else bars,
        overlap_pct=tf_params["sz_overlap_pct"],
    )
    for sz in sammels:
        zones.append(_clamp_zone_width(sz, max_width))

    # Filter out stale zones that price has traded completely through
    last_close = bars[-1].close
    zones = _filter_stale_zones(zones, last_close, days)

    # Sort by priority
    zones.sort(key=lambda z: z.priority)

    return zones


def _filter_stale_zones(
    zones: list[TradingZone],
    current_price: float,
    days: list[list[OHLCVBar]],
) -> list[TradingZone]:
    """Remove zones that price has traded completely through (stale zones).

    Rules:
      - Support zone is stale if current price is > 20 pts BELOW the zone bottom
      - Resistance zone is stale if current price is > 20 pts ABOVE the zone top
      - Value Area zones expire after 2 trading days
      - POC zones expire after 3 trading days if retested (price touched the zone)
      - Lines like PDH/PDL/PDC are support/resistance — check 20pt rule
      - Opening Range, Initial Balance, Overnight Range: bounded by time, keep as-is
    """
    STALE_THRESHOLD = 20.0  # points
    num_days = len(days)
    current_day_start = days[-1][0].timestamp if days else 0

    result: list[TradingZone] = []
    for z in zones:
        label = z.label

        # Time-bounded zones (OR, IB, ONR) are never filtered by price distance
        if label in ("OR", "IB", "ONR"):
            result.append(z)
            continue

        # Value Area zones expire after 2 trading days
        if label == "VA":
            # Count how many day boundaries have passed since the zone's start_time
            days_since = sum(1 for d in days if d[0].timestamp > z.start_time)
            if days_since > 2:
                continue  # expired
            result.append(z)
            continue

        # POC/NPOC zones expire after 3 trading days if retested
        if label in ("POC", "NPOC"):
            days_since = sum(1 for d in days if d[0].timestamp > z.start_time)
            if days_since > 3:
                continue  # expired
            result.append(z)
            continue

        # Sammelzonen: apply standard 20pt stale check
        # Support-type zones (PDL, low-related): stale if price is far below
        if label in ("PDL",):
            if current_price < z.low - STALE_THRESHOLD:
                continue  # price broke far below support — zone is stale

        # Resistance-type zones (PDH, high-related): stale if price is far above
        if label in ("PDH",):
            if current_price > z.high + STALE_THRESHOLD:
                continue  # price broke far above resistance — zone is stale

        # PDC: neutral reference, stale if price is > 20pts away in either direction
        if label == "PDC":
            if abs(current_price - z.high) > STALE_THRESHOLD:
                continue

        # Sammelzone: stale if price is > 20pts outside the zone
        if label == "SZ":
            if current_price > z.high + STALE_THRESHOLD:
                continue
            if current_price < z.low - STALE_THRESHOLD:
                continue

        result.append(z)

    return result


def _group_by_day(bars: list[OHLCVBar]) -> list[list[OHLCVBar]]:
    """Group bars by trading day (gap > 6 hours = new day)."""
    if not bars:
        return []
    days: list[list[OHLCVBar]] = [[bars[0]]]
    for i in range(1, len(bars)):
        gap = bars[i].timestamp - bars[i - 1].timestamp
        if gap > 6 * 3600:  # 6 hour gap = new day
            days.append([bars[i]])
        else:
            days[-1].append(bars[i])
    return days


def _calculate_value_area(
    bars: list[OHLCVBar],
    tick_size: float = _DEFAULT_TICK_SIZE,
    bin_ticks: int = 2,
) -> dict | None:
    """Calculate POC, VAH, VAL from bars using volume profile (70% rule).

    v2 improvements:
      - Distributes volume across the full bar range (not just close)
      - Uses finer binning (bin_ticks parameter, timeframe-aware)
      - POC is a single precise price level
    """
    if not bars:
        return None

    bin_size = tick_size * bin_ticks
    price_volume: dict[float, int] = {}

    for bar in bars:
        # Distribute volume evenly across all price bins within the bar's range
        lo_bin = round(round(bar.low / bin_size) * bin_size, 4)
        hi_bin = round(round(bar.high / bin_size) * bin_size, 4)
        if lo_bin > hi_bin:
            lo_bin, hi_bin = hi_bin, lo_bin

        # Count bins in range
        num_bins = max(1, round((hi_bin - lo_bin) / bin_size) + 1)
        vol_per_bin = bar.volume // num_bins if num_bins > 0 else bar.volume
        remainder = bar.volume - vol_per_bin * num_bins

        # Typical price bin gets the remainder (weighted toward where trading happened)
        tp = (bar.high + bar.low + bar.close) / 3.0
        tp_bin = round(round(tp / bin_size) * bin_size, 4)

        level = lo_bin
        while level <= hi_bin + bin_size * 0.01:  # small epsilon for float comparison
            rounded_level = round(level, 4)
            vol = vol_per_bin
            if rounded_level == tp_bin:
                vol += remainder  # give remainder to typical price bin
            price_volume[rounded_level] = price_volume.get(rounded_level, 0) + vol
            level += bin_size

    if not price_volume:
        return None

    # POC = price level with highest volume (single precise level)
    poc_price = max(price_volume, key=lambda k: price_volume[k])
    total_vol = sum(price_volume.values())
    target_vol = total_vol * 0.70

    sorted_levels = sorted(price_volume.keys())
    poc_idx = sorted_levels.index(poc_price)

    cum_vol = price_volume[poc_price]
    lo_idx = poc_idx
    hi_idx = poc_idx

    # Expand value area outward from POC until 70% volume is captured
    while cum_vol < target_vol and (lo_idx > 0 or hi_idx < len(sorted_levels) - 1):
        lo_vol = price_volume[sorted_levels[lo_idx - 1]] if lo_idx > 0 else 0
        hi_vol = price_volume[sorted_levels[hi_idx + 1]] if hi_idx < len(sorted_levels) - 1 else 0

        if lo_vol >= hi_vol and lo_idx > 0:
            lo_idx -= 1
            cum_vol += lo_vol
        elif hi_idx < len(sorted_levels) - 1:
            hi_idx += 1
            cum_vol += hi_vol
        else:
            break

    return {
        "poc": poc_price,
        "vah": sorted_levels[hi_idx],
        "val": sorted_levels[lo_idx],
    }


def _detect_sammelzonen(
    bars: list[OHLCVBar],
    overlap_pct: float = 0.5,
) -> list[TradingZone]:
    """Detect Sammelzonen (accumulation/distribution ranges).

    A Sammelzone is a range where price trades back and forth with high volume.
    Look for periods where price stays within a range for 30+ bars.

    v2: Tighter consolidation factor (3x instead of 4x), percentage-based
    deduplication instead of fixed 10-point overlap.
    """
    zones: list[TradingZone] = []
    if len(bars) < 50:
        return zones

    window = 50  # look at 50-bar windows
    step = 25    # step by 25

    for i in range(0, len(bars) - window, step):
        chunk = bars[i:i + window]
        high = max(b.high for b in chunk)
        low = min(b.low for b in chunk)
        range_size = high - low
        avg_range = sum(b.high - b.low for b in chunk) / len(chunk)

        # Sammelzone if total range is less than 3x average bar range (tighter than v1's 4x)
        if range_size > 0 and range_size < avg_range * 3:
            avg_vol = sum(b.volume for b in chunk) / len(chunk)
            # High volume consolidation = accumulation zone
            if avg_vol > 500:
                zones.append(TradingZone(
                    "Sammelzone", "area",
                    high, low,
                    "#34D399", 0.04,
                    chunk[0].timestamp, chunk[-1].timestamp,
                    "SZ", 3
                ))

    # Deduplicate overlapping zones (keep the one with tighter range)
    # Use percentage-based overlap instead of fixed points
    if zones:
        zones.sort(key=lambda z: z.high - z.low)
        deduped: list[TradingZone] = [zones[0]]
        for z in zones[1:]:
            z_mid = (z.high + z.low) / 2.0
            z_range = z.high - z.low
            overlap = any(
                abs(z.high - d.high) < z_range * overlap_pct
                and abs(z.low - d.low) < z_range * overlap_pct
                for d in deduped
            )
            if not overlap:
                deduped.append(z)
        zones = deduped[:5]  # max 5 Sammelzonen

    return zones

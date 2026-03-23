"""Trading zones calculation based on Travis/Traivend methodology."""

from dataclasses import dataclass

from arctis.models import OHLCVBar


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


def calculate_zones(bars: list[OHLCVBar]) -> list[TradingZone]:
    """Calculate all trading zones from bars."""
    if len(bars) < 100:
        return []

    zones = []

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

    # 2. Value Area (from prev day volume profile)
    va = _calculate_value_area(prev_day)
    if va:
        zones.append(TradingZone(
            "Value Area", "area", va["vah"], va["val"],
            "#5CB8F0", 0.06, prev_day[0].timestamp, None, "VA", 1
        ))
        zones.append(TradingZone(
            "POC", "line", va["poc"], va["poc"],
            "#FBBF24", 0.7, prev_day[0].timestamp, None, "POC", 1
        ))

    # 3. Opening Range (first 15 min of current day = first 15 bars of 1min)
    if len(current_day) >= 15:
        or_bars = current_day[:15]
        or_high = max(b.high for b in or_bars)
        or_low = min(b.low for b in or_bars)
        zones.append(TradingZone(
            "Opening Range", "area", or_high, or_low,
            "#5CB8F0", 0.08, or_bars[0].timestamp, or_bars[-1].timestamp, "OR", 2
        ))

    # 4. Initial Balance (first 30 min = first 30 bars)
    if len(current_day) >= 30:
        ib_bars = current_day[:30]
        ib_high = max(b.high for b in ib_bars)
        ib_low = min(b.low for b in ib_bars)
        zones.append(TradingZone(
            "Initial Balance", "area", ib_high, ib_low,
            "#A855F7", 0.05, ib_bars[0].timestamp, ib_bars[-1].timestamp, "IB", 2
        ))

    # 5. Overnight Range (from prev day close to current day open)
    if prev_day and current_day:
        prev_close_ts = prev_day[-1].timestamp
        curr_open_ts = current_day[0].timestamp
        overnight_bars = [b for b in bars if prev_close_ts < b.timestamp < curr_open_ts]
        if overnight_bars:
            on_high = max(b.high for b in overnight_bars)
            on_low = min(b.low for b in overnight_bars)
            zones.append(TradingZone(
                "Overnight Range", "area", on_high, on_low,
                "#F7941D", 0.04, overnight_bars[0].timestamp, overnight_bars[-1].timestamp,
                "ONR", 3
            ))

    # 6. Naked POCs (from all previous days)
    last_close = bars[-1].close
    for day in days[:-1]:
        day_va = _calculate_value_area(day)
        if day_va:
            poc = day_va["poc"]
            # Check if POC was retested in subsequent bars
            subsequent_bars = [b for b in bars if b.timestamp > day[-1].timestamp]
            is_naked = not any(b.low <= poc <= b.high for b in subsequent_bars)
            if is_naked:
                # Only include NPOCs within 200 points of last close to avoid clutter
                if abs(last_close - poc) <= 200:
                    zones.append(TradingZone(
                        "Naked POC", "line", poc, poc,
                        "#FBBF24", 0.5,
                        day[0].timestamp, None,
                        "NPOC", 1
                    ))

    # 7. Sammelzonen (Consolidation/Accumulation zones)
    sammels = _detect_sammelzonen(bars[-500:] if len(bars) > 500 else bars)
    for sz in sammels:
        zones.append(sz)

    # Sort by priority
    zones.sort(key=lambda z: z.priority)

    return zones


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


def _calculate_value_area(bars: list[OHLCVBar]) -> dict | None:
    """Calculate POC, VAH, VAL from bars using volume profile (70% rule)."""
    if not bars:
        return None

    tick_size = 0.25
    price_volume: dict[float, int] = {}

    for bar in bars:
        level = round(bar.close / tick_size) * tick_size
        price_volume[level] = price_volume.get(level, 0) + bar.volume

    if not price_volume:
        return None

    poc_price = max(price_volume, key=lambda k: price_volume[k])
    total_vol = sum(price_volume.values())
    target_vol = total_vol * 0.70

    sorted_levels = sorted(price_volume.keys())
    poc_idx = sorted_levels.index(poc_price)

    cum_vol = price_volume[poc_price]
    lo_idx = poc_idx
    hi_idx = poc_idx

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


def _detect_sammelzonen(bars: list[OHLCVBar]) -> list[TradingZone]:
    """Detect Sammelzonen (accumulation/distribution ranges).

    A Sammelzone is a range where price trades back and forth with high volume.
    Look for periods where price stays within a range for 30+ bars.
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

        # Sammelzone if total range is less than 4x average bar range
        # (meaning price is consolidating, not trending)
        if range_size > 0 and range_size < avg_range * 4:
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
    if zones:
        zones.sort(key=lambda z: z.high - z.low)
        deduped: list[TradingZone] = [zones[0]]
        for z in zones[1:]:
            overlap = any(
                abs(z.high - d.high) < 10 and abs(z.low - d.low) < 10
                for d in deduped
            )
            if not overlap:
                deduped.append(z)
        zones = deduped[:5]  # max 5 Sammelzonen

    return zones

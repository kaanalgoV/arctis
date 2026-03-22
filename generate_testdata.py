"""
Generate realistic ES futures 1-minute OHLCV test data for 5 trading days.
Prices are guided toward target end-of-day levels while maintaining realistic noise.
"""

import csv
import os
import random
import math
from datetime import datetime, timedelta

random.seed(42)

# --- Config ---
OUTPUT = os.path.join(os.path.dirname(__file__), "data", "es_5days_test.csv")
TRADING_START = (9, 30)
TRADING_END = (16, 0)
BARS_PER_DAY = 390

DAYS = [
    datetime(2025, 1, 6),   # Mon - Uptrend
    datetime(2025, 1, 7),   # Tue - Volatile/choppy
    datetime(2025, 1, 8),   # Wed - Strong downtrend
    datetime(2025, 1, 9),   # Thu - Recovery bounce
    datetime(2025, 1, 10),  # Fri - Range-bound
]

# Target open/close for each day
DAY_TARGETS = [
    {"open": 5950.0, "close": 5985.0},   # Day 1: uptrend
    {"open": None,    "close": 5980.0},   # Day 2: volatile, ends ~flat
    {"open": None,    "close": 5920.0},   # Day 3: strong down
    {"open": None,    "close": 5950.0},   # Day 4: recovery
    {"open": None,    "close": 5955.0},   # Day 5: range-bound
]


def volume_profile(bar_idx: int) -> float:
    """Return a volume multiplier based on time-of-day (U-shaped)."""
    if bar_idx < 30:
        base = 1.8 - 0.8 * (bar_idx / 30)
    elif bar_idx >= 360:
        base = 1.0 + 0.8 * ((bar_idx - 360) / 30)
    elif 150 <= bar_idx <= 270:
        base = 0.6
    else:
        base = 0.85
    return base


def gen_volume(bar_idx: int, avg: float = 12000) -> int:
    """Generate realistic volume for a given bar."""
    mult = volume_profile(bar_idx)
    if random.random() < 0.03:
        mult *= random.uniform(2.0, 3.0)
    vol = avg * mult * random.uniform(0.6, 1.5)
    return max(2000, min(45000, int(vol)))


def guided_move(price: float, target_close: float, bar_idx: int,
                drift_func, noise_std: float, vol_avg: float,
                wick_up_range=(0.1, 1.0), wick_dn_range=(0.1, 0.8)):
    """
    Generate a single bar with drift from drift_func, plus correction
    steering toward target_close by end of day.
    """
    remaining = BARS_PER_DAY - bar_idx
    frac = bar_idx / BARS_PER_DAY

    # Base drift from the day's character
    base_drift = drift_func(frac, price)

    # Correction: gently steer toward target_close, stronger near end of day
    error = target_close - price
    if remaining > 0:
        # Correction increases as we approach day end
        correction_strength = 0.02 + 0.15 * (frac ** 2)
        correction = error * correction_strength / max(remaining, 1) * 10
    else:
        correction = 0

    noise = random.gauss(0, noise_std)

    # Blend: early in day, base_drift dominates; late in day, correction dominates
    blend = min(1.0, frac * 1.5)  # 0 at open, 1.0 by bar 260
    move = base_drift * (1 - blend * 0.3) + correction + noise

    o = round(price, 2)
    c = round(price + move, 2)

    wick_up = round(random.uniform(*wick_up_range), 2)
    wick_dn = round(random.uniform(*wick_dn_range), 2)
    h = round(max(o, c) + wick_up, 2)
    l = round(min(o, c) - wick_dn, 2)

    vol = gen_volume(bar_idx, avg=vol_avg)
    return o, h, l, c, vol


def gen_day_uptrend(start_price: float, target_close: float) -> list:
    """Day 1: Steady climb ~35 pts."""
    bars = []
    price = start_price
    total_move = target_close - start_price

    def drift_func(frac, p):
        base = total_move / BARS_PER_DAY
        return base * (0.7 + 0.6 * math.sin(math.pi * frac))

    for i in range(BARS_PER_DAY):
        o, h, l, c, v = guided_move(
            price, target_close, i, drift_func,
            noise_std=0.45, vol_avg=11000,
            wick_up_range=(0.1, 1.0), wick_dn_range=(0.1, 0.8)
        )
        bars.append((o, h, l, c, v))
        price = c
    return bars


def gen_day_volatile(start_price: float, target_close: float) -> list:
    """Day 2: Volatile/choppy, big swings, ends near target."""
    bars = []
    price = start_price

    swing_points = [0, 0.15, 0.35, 0.55, 0.75, 1.0]
    swing_offsets = [0, 14, -10, 16, -8, target_close - start_price]

    def drift_func(frac, p):
        for s in range(len(swing_points) - 1):
            if swing_points[s] <= frac <= swing_points[s + 1]:
                seg_frac = (frac - swing_points[s]) / (swing_points[s + 1] - swing_points[s])
                target_offset = swing_offsets[s] + (swing_offsets[s + 1] - swing_offsets[s]) * seg_frac
                break
        target_p = start_price + target_offset
        return (target_p - p) * 0.06

    for i in range(BARS_PER_DAY):
        o, h, l, c, v = guided_move(
            price, target_close, i, drift_func,
            noise_std=0.85, vol_avg=14000,
            wick_up_range=(0.15, 1.5), wick_dn_range=(0.15, 1.5)
        )
        bars.append((o, h, l, c, v))
        price = c
    return bars


def gen_day_downtrend(start_price: float, target_close: float) -> list:
    """Day 3: Strong downtrend ~60 pts."""
    bars = []
    price = start_price
    total_move = target_close - start_price

    def drift_func(frac, p):
        base = total_move / BARS_PER_DAY
        if frac < 0.4:
            base *= 1.5
        elif frac > 0.7:
            base *= 0.5
        # Occasional sharp drops
        if random.random() < 0.015:
            base -= random.uniform(1.5, 3.0)
        return base

    for i in range(BARS_PER_DAY):
        o, h, l, c, v = guided_move(
            price, target_close, i, drift_func,
            noise_std=0.60, vol_avg=15000,
            wick_up_range=(0.1, 0.7), wick_dn_range=(0.15, 1.2)
        )
        bars.append((o, h, l, c, v))
        price = c
    return bars


def gen_day_recovery(start_price: float, target_close: float) -> list:
    """Day 4: Recovery bounce, dip then reversal up ~30 pts."""
    bars = []
    price = start_price
    low_target = start_price - 8  # dip ~8 pts first

    def drift_func(frac, p):
        if frac < 0.12:
            return -0.06  # continued dip
        elif frac < 0.25:
            # Bottoming / reversal
            return (low_target + 5 - p) * 0.03
        elif frac < 0.55:
            return 0.11  # strong buying
        else:
            return 0.035  # slower grind

    for i in range(BARS_PER_DAY):
        o, h, l, c, v = guided_move(
            price, target_close, i, drift_func,
            noise_std=0.50, vol_avg=13000,
            wick_up_range=(0.1, 1.0), wick_dn_range=(0.1, 0.9)
        )
        bars.append((o, h, l, c, v))
        price = c
    return bars


def gen_day_rangebound(start_price: float, target_close: float) -> list:
    """Day 5: Tight range-bound consolidation."""
    bars = []
    price = start_price
    center = (start_price + target_close) / 2

    def drift_func(frac, p):
        return (center - p) * 0.05

    for i in range(BARS_PER_DAY):
        o, h, l, c, v = guided_move(
            price, target_close, i, drift_func,
            noise_std=0.32, vol_avg=9000,
            wick_up_range=(0.05, 0.6), wick_dn_range=(0.05, 0.6)
        )
        bars.append((o, h, l, c, v))
        price = c
    return bars


def main():
    generators = [
        gen_day_uptrend,
        gen_day_volatile,
        gen_day_downtrend,
        gen_day_recovery,
        gen_day_rangebound,
    ]

    all_rows = []
    prev_close = 5950.0

    for day_idx, (day_date, gen_func) in enumerate(zip(DAYS, generators)):
        targets = DAY_TARGETS[day_idx]

        if targets["open"] is not None:
            open_price = targets["open"]
        else:
            gap = random.uniform(-2, 2)
            open_price = round(prev_close + gap, 2)

        target_close = targets["close"]
        bars = gen_func(open_price, target_close)

        for bar_idx, (o, h, l, c, v) in enumerate(bars):
            ts = day_date.replace(
                hour=TRADING_START[0],
                minute=TRADING_START[1],
            ) + timedelta(minutes=bar_idx)
            all_rows.append((ts.strftime("%Y-%m-%d %H:%M:%S"), o, h, l, c, v))

        prev_close = bars[-1][3]

    # Write CSV
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "open", "high", "low", "close", "volume"])
        writer.writerows(all_rows)

    print(f"Written {len(all_rows)} rows to {OUTPUT}")

    # Summary
    for d in range(5):
        first = all_rows[d * BARS_PER_DAY]
        last = all_rows[(d + 1) * BARS_PER_DAY - 1]
        day_open = first[1]
        day_close = last[4]
        print(f"  Day {d+1} ({DAYS[d].strftime('%a %m/%d')}): Open={day_open} Close={day_close}")


if __name__ == "__main__":
    main()

"""Generate 365 days of realistic ES and NQ 1-min data for backtesting.

Uses realistic market microstructure:
- Session times (RTH 9:30-16:00 ET, Globex overnight)
- Day-of-week effects (Monday gaps, Tuesday reversals, Thursday trends)
- Intraday patterns (10AM reversal, lunch chop, power hour)
- Gap opens, trend days, range days, reversal days
- Volume profiles with session-based patterns
- VWAP-anchored mean reversion
"""

import csv
import random
import math
import os
from datetime import datetime, timedelta

random.seed(42)  # reproducible

# ES params
ES_BASE = 5200.0
ES_DAILY_VOL = 0.008  # ~0.8% daily vol
ES_TICK = 0.25

# NQ params
NQ_BASE = 18500.0
NQ_DAILY_VOL = 0.012  # ~1.2% daily vol (more volatile)
NQ_TICK = 0.25


def generate_year_data(base_price: float, daily_vol: float, tick: float, market: str):
    """Generate 365 trading days (~252 trading days) of 1-min data."""
    bars = []
    price = base_price

    # Start from 2024-01-02 (first trading day)
    start_date = datetime(2024, 1, 2, 9, 30)
    current_date = start_date

    trading_days = 0
    day_count = 0

    # Track multi-day state
    prev_day_high = base_price + 5
    prev_day_low = base_price - 5
    prev_day_close = base_price
    prev_day_range = 10.0
    consecutive_down = 0
    consecutive_up = 0
    weekly_high = base_price + 10
    weekly_low = base_price - 10

    while trading_days < 252:  # ~252 trading days in a year
        dow = current_date.weekday()

        # Skip weekends
        if dow >= 5:
            current_date += timedelta(days=1)
            day_count += 1
            continue

        # Skip some holidays (~10 per year)
        holiday_dates = [
            (1, 1), (1, 15), (2, 19), (3, 29), (5, 27),
            (6, 19), (7, 4), (9, 2), (11, 28), (12, 25),
        ]
        is_holiday = any(current_date.month == m and current_date.day == d for m, d in holiday_dates)
        if is_holiday:
            current_date += timedelta(days=1)
            day_count += 1
            continue

        trading_days += 1

        # ── Determine day character ──────────────────────────────
        day_type_roll = random.random()
        if day_type_roll < 0.16:
            day_type = "trend"
        elif day_type_roll < 0.70:
            day_type = "normal_variation"
        elif day_type_roll < 0.90:
            day_type = "normal"
        else:
            day_type = "neutral"

        # Day-of-week biases
        if dow == 0:  # Monday
            gap_prob = 0.7
            gap_fill_rate = 0.53
        elif dow == 1:  # Tuesday
            gap_prob = 0.5
            gap_fill_rate = 0.70  # highest fill rate
        elif dow == 3:  # Thursday
            gap_prob = 0.5
            gap_fill_rate = 0.55
            if day_type == "normal":
                day_type = "normal_variation"  # Thursday tends to break IB
        elif dow == 4:  # Friday
            gap_prob = 0.4
            gap_fill_rate = 0.45  # lowest fill rate
        else:
            gap_prob = 0.5
            gap_fill_rate = 0.60

        # Trend direction for the day
        # Consider multi-day patterns
        if consecutive_down >= 2:
            trend_bias = 0.65  # mean reversion after 2 down days
        elif consecutive_up >= 2:
            trend_bias = 0.35
        else:
            trend_bias = 0.50

        # IBS effect from previous day
        if prev_day_range > 0:
            prev_ibs = (prev_day_close - prev_day_low) / prev_day_range
            if prev_ibs < 0.2:
                trend_bias += 0.15  # bullish next day
            elif prev_ibs > 0.8:
                trend_bias -= 0.15  # bearish next day

        is_bullish_day = random.random() < trend_bias
        day_direction = 1 if is_bullish_day else -1

        # ── Gap calculation ──────────────────────────────────────
        gap = 0
        if random.random() < gap_prob:
            gap_size = random.gauss(0, daily_vol * base_price * 0.3)
            # Larger gaps less common
            if abs(gap_size) > base_price * 0.01:
                gap_size *= 0.3  # reduce large gaps
            gap = round(gap_size / tick) * tick

            # On bullish days, gaps tend to be up
            if is_bullish_day and gap < 0 and random.random() < 0.3:
                gap = abs(gap)
            elif not is_bullish_day and gap > 0 and random.random() < 0.3:
                gap = -abs(gap)

        # Set open price with gap
        day_open = prev_day_close + gap

        # ── Day range calculation ────────────────────────────────
        base_range = daily_vol * base_price
        if day_type == "trend":
            day_range = base_range * random.uniform(1.5, 2.5)
        elif day_type == "normal_variation":
            day_range = base_range * random.uniform(0.8, 1.5)
        elif day_type == "normal":
            day_range = base_range * random.uniform(0.5, 0.9)
        else:  # neutral
            day_range = base_range * random.uniform(0.6, 1.0)

        # NR4/NR7 occasionally
        if trading_days > 7 and random.random() < 0.08:
            day_range *= 0.4  # narrow range day

        # ── Generate 1-min bars for RTH (9:30-16:00 = 390 minutes) ──
        day_bars = []
        current_price = day_open
        session_start = current_date.replace(hour=9, minute=30, second=0)

        # Track intraday extremes
        day_high = current_price
        day_low = current_price
        vwap_sum = 0
        vol_sum = 0

        # Gap fill target
        gap_fill_target = prev_day_close
        gap_filled = False

        # Opening range (first 15 min)
        orb_high = current_price
        orb_low = current_price

        # Initial balance (first 60 min)
        ib_high = current_price
        ib_low = current_price

        for minute in range(390):
            bar_time = session_start + timedelta(minutes=minute)
            ts = int(bar_time.timestamp())

            # ── Intraday volatility profile ──────────────────────
            # Higher vol in first/last hour, low at lunch
            hour_frac = minute / 60
            if hour_frac < 0.5:  # first 30 min
                vol_mult = 2.0
            elif hour_frac < 1.0:  # 10:00-10:30
                vol_mult = 1.5
            elif hour_frac < 2.5:  # 10:30-12:00
                vol_mult = 1.0
            elif hour_frac < 4.0:  # 12:00-13:30 lunch
                vol_mult = 0.5
            elif hour_frac < 5.5:  # 13:30-15:00
                vol_mult = 0.8
            else:  # 15:00-16:00 power hour
                vol_mult = 1.5

            # Bar-level volatility
            bar_vol = (day_range / 390) * vol_mult
            noise = random.gauss(0, bar_vol)

            # ── Intraday drift patterns ──────────────────────────
            drift = 0

            # 10:00 AM reversal (minute 30)
            if 28 <= minute <= 35 and day_type != "trend":
                early_move = current_price - day_open
                if abs(early_move) > day_range * 0.2:
                    drift = -early_move * 0.05  # reversal pressure

            # Gap fill pressure (first 2 hours)
            if not gap_filled and abs(gap) > tick * 2 and minute < 120:
                fill_pressure = (gap_fill_target - current_price) * 0.001
                if random.random() < gap_fill_rate:
                    drift += fill_pressure

            # Trend day drift
            if day_type == "trend":
                drift += day_direction * day_range / 500 * vol_mult

            # Mean reversion during lunch
            if 150 <= minute <= 240:  # lunch
                vwap_price = vwap_sum / vol_sum if vol_sum > 0 else day_open
                drift += (vwap_price - current_price) * 0.002

            # Power hour trend continuation
            if minute >= 330:
                drift += day_direction * day_range / 600

            # VWAP mean reversion (weak)
            if vol_sum > 0:
                vwap_price = vwap_sum / vol_sum
                dist_from_vwap = current_price - vwap_price
                drift -= dist_from_vwap * 0.0005  # gentle pull toward VWAP

            # Calculate bar OHLC
            move = noise + drift
            bar_open = round(current_price / tick) * tick
            bar_close = round((current_price + move) / tick) * tick

            # Realistic high/low
            intrabar_vol = abs(move) * random.uniform(1.2, 2.0)
            if bar_close >= bar_open:
                bar_high = round(max(bar_open, bar_close) + random.uniform(0, intrabar_vol) * 0.5 / tick) * tick
                bar_low = round((min(bar_open, bar_close) - random.uniform(0, intrabar_vol) * 0.3) / tick) * tick
            else:
                bar_high = round((max(bar_open, bar_close) + random.uniform(0, intrabar_vol) * 0.3) / tick) * tick
                bar_low = round((min(bar_open, bar_close) - random.uniform(0, intrabar_vol) * 0.5) / tick) * tick

            bar_high = max(bar_high, bar_open, bar_close)
            bar_low = min(bar_low, bar_open, bar_close)

            # Volume
            base_vol = random.randint(5000, 25000)
            bar_volume = int(base_vol * vol_mult)
            # Volume spikes on big moves
            if abs(move) > bar_vol * 2:
                bar_volume = int(bar_volume * random.uniform(2.0, 4.0))

            current_price = bar_close

            # Track extremes
            day_high = max(day_high, bar_high)
            day_low = min(day_low, bar_low)
            vwap_sum += bar_close * bar_volume
            vol_sum += bar_volume

            # Gap fill check
            if not gap_filled:
                if gap > 0 and bar_low <= gap_fill_target:
                    gap_filled = True
                elif gap < 0 and bar_high >= gap_fill_target:
                    gap_filled = True

            # ORB tracking
            if minute < 15:
                orb_high = max(orb_high, bar_high)
                orb_low = min(orb_low, bar_low)

            # IB tracking
            if minute < 60:
                ib_high = max(ib_high, bar_high)
                ib_low = min(ib_low, bar_low)

            # Enforce day range limits (prevent unrealistic moves)
            if current_price > day_open + day_range:
                current_price = day_open + day_range - random.uniform(0, day_range * 0.1)
            elif current_price < day_open - day_range:
                current_price = day_open - day_range + random.uniform(0, day_range * 0.1)

            day_bars.append({
                "timestamp": ts,
                "open": bar_open,
                "high": bar_high,
                "low": bar_low,
                "close": bar_close,
                "volume": bar_volume,
            })

        bars.extend(day_bars)

        # Update multi-day tracking
        day_close = day_bars[-1]["close"]
        day_actual_high = max(b["high"] for b in day_bars)
        day_actual_low = min(b["low"] for b in day_bars)
        day_actual_range = day_actual_high - day_actual_low

        if day_close > prev_day_close:
            consecutive_up += 1
            consecutive_down = 0
        else:
            consecutive_down += 1
            consecutive_up = 0

        # Weekly tracking
        if dow == 0:  # Monday = new week
            weekly_high = day_actual_high
            weekly_low = day_actual_low
        else:
            weekly_high = max(weekly_high, day_actual_high)
            weekly_low = min(weekly_low, day_actual_low)

        prev_day_high = day_actual_high
        prev_day_low = day_actual_low
        prev_day_close = day_close
        prev_day_range = day_actual_range
        price = day_close

        # Gentle trend over the year (ES typically up ~10%)
        price += day_direction * base_price * 0.00004

        current_date += timedelta(days=1)

    return bars


def write_csv(bars: list[dict], filepath: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["timestamp", "open", "high", "low", "close", "volume"])
        writer.writeheader()
        writer.writerows(bars)
    print(f"  Written {len(bars)} bars to {filepath}")


if __name__ == "__main__":
    print("Generating 365-day ES data...")
    es_bars = generate_year_data(ES_BASE, ES_DAILY_VOL, ES_TICK, "ES")
    write_csv(es_bars, "C:/Users/Meriton/Arctis/data/backtest/es_365d.csv")

    print("Generating 365-day NQ data...")
    nq_bars = generate_year_data(NQ_BASE, NQ_DAILY_VOL, NQ_TICK, "NQ")
    write_csv(nq_bars, "C:/Users/Meriton/Arctis/data/backtest/nq_365d.csv")

    print(f"\nDone! ES: {len(es_bars)} bars, NQ: {len(nq_bars)} bars")

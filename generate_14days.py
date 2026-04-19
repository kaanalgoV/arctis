"""
Generate realistic NQ & ES futures 1-minute OHLCV data for the last 14 trading days.
Includes buy_volume, sell_volume, delta for Cumulative Delta analysis.
Inserts directly into TimescaleDB.
"""

import random
import math
import sys
from datetime import datetime, timedelta, timezone, time as dtime

import psycopg2

random.seed(2026_04_18)

DB_URL = "host=localhost port=5532 dbname=algorivo user=algorivo password=algorivo_dev"

# --- Trading Sessions (ET -> UTC, ET = UTC-4 during EDT) ---
# RTH: 09:30-16:00 ET = 13:30-20:00 UTC
# Globex: 18:00 ET prev day - 09:30 ET = 22:00 UTC prev day - 13:30 UTC
RTH_START_UTC = (13, 30)
RTH_END_UTC = (20, 0)
GLOBEX_START_UTC = (22, 0)  # previous day
BARS_RTH = 390  # 6.5 hours * 60
BARS_GLOBEX = 930  # 15.5 hours * 60

# --- Current realistic prices (April 2026) ---
NQ_BASE = 19850.0
ES_BASE = 5520.0

# --- Day character templates ---
DAY_TYPES = [
    "uptrend",      # Day 1: strong up
    "volatile",     # Day 2: choppy
    "downtrend",    # Day 3: sell-off
    "recovery",     # Day 4: bounce
    "range",        # Day 5: tight range
    "uptrend",      # Day 6: grind up
    "volatile",     # Day 7: whipsaw
    "downtrend",    # Day 8: fade
    "uptrend",      # Day 9: breakout
    "range",        # Day 10: consolidation
    "recovery",     # Day 11: morning dip then rally
    "volatile",     # Day 12: news-driven
    "uptrend",      # Day 13: trend continuation
    "range",        # Day 14: pre-weekend range
]

# NQ daily moves (points) - realistic for NQ
NQ_MOVES = [180, -40, -280, 150, 30, 120, -90, -200, 250, -20, 160, -60, 140, 25]
# ES daily moves (points) - roughly NQ/4
ES_MOVES = [45, -10, -70, 38, 8, 30, -22, -50, 62, -5, 40, -15, 35, 6]


def get_trading_days(count=14):
    """Get the last N trading days (Mon-Fri) ending yesterday."""
    today = datetime(2026, 4, 17, tzinfo=timezone.utc)  # yesterday as last complete day
    days = []
    d = today
    while len(days) < count:
        if d.weekday() < 5:  # Mon-Fri
            days.append(d)
        d -= timedelta(days=1)
    return list(reversed(days))


def volume_profile(bar_idx, total_bars, is_rth=True):
    """U-shaped volume for RTH, flat-low for Globex."""
    if not is_rth:
        return 0.15 + 0.1 * random.random()

    frac = bar_idx / total_bars
    # U-shape: high at open, low midday, high at close
    if frac < 0.08:  # first ~30 min
        base = 2.0 - 1.0 * (frac / 0.08)
    elif frac > 0.92:  # last ~30 min (power hour close)
        base = 1.0 + 1.2 * ((frac - 0.92) / 0.08)
    elif 0.38 < frac < 0.62:  # midday lull
        base = 0.5
    else:
        base = 0.75

    # Random volume spikes (3% chance)
    if random.random() < 0.03:
        base *= random.uniform(2.0, 4.0)

    return base


def gen_bars(start_price, day_move, day_type, avg_volume, tick_size=0.25,
             is_rth=True, bar_count=390, noise_scale=1.0):
    """Generate OHLCV bars with buy/sell volume and delta."""
    bars = []
    price = start_price
    target = start_price + day_move

    for i in range(bar_count):
        frac = i / bar_count
        remaining = bar_count - i

        # --- Drift based on day type ---
        if day_type == "uptrend":
            drift = day_move / bar_count * (0.7 + 0.6 * math.sin(math.pi * frac))
        elif day_type == "downtrend":
            drift = day_move / bar_count * (1.5 if frac < 0.4 else 0.5)
            if random.random() < 0.01:
                drift += random.uniform(-2, -5) * noise_scale
        elif day_type == "volatile":
            # Swing back and forth
            swing = math.sin(4 * math.pi * frac) * abs(day_move) * 0.3 / bar_count
            drift = day_move / bar_count + swing
        elif day_type == "recovery":
            if frac < 0.15:
                drift = -abs(day_move) * 0.3 / (bar_count * 0.15)
            elif frac < 0.3:
                drift = abs(day_move) * 0.1 / (bar_count * 0.15)
            else:
                drift = abs(day_move) * 1.2 / (bar_count * 0.7)
        else:  # range
            drift = (target - price) * 0.02

        # Correction toward target
        if remaining > 0:
            error = target - price
            correction = error * (0.01 + 0.1 * frac ** 2) / max(remaining, 1) * 5
        else:
            correction = 0

        noise = random.gauss(0, tick_size * 2 * noise_scale)
        if not is_rth:
            noise *= 0.4  # less noise in globex

        move = drift + correction + noise

        o = round(price / tick_size) * tick_size
        c = round((price + move) / tick_size) * tick_size

        wick_mult = 1.5 if day_type == "volatile" else 1.0
        wick_up = round(random.uniform(0.1, 1.2) * tick_size * wick_mult / tick_size) * tick_size
        wick_dn = round(random.uniform(0.1, 1.0) * tick_size * wick_mult / tick_size) * tick_size

        h = max(o, c) + wick_up
        l = min(o, c) - wick_dn

        # Volume
        vol_mult = volume_profile(i, bar_count, is_rth)
        vol = max(500, int(avg_volume * vol_mult * random.uniform(0.6, 1.5)))

        # Buy/sell volume split based on bar direction
        if c >= o:  # bullish bar
            buy_pct = random.uniform(0.52, 0.72)
        else:  # bearish bar
            buy_pct = random.uniform(0.28, 0.48)

        buy_vol = int(vol * buy_pct)
        sell_vol = vol - buy_vol
        delta = buy_vol - sell_vol

        bars.append({
            "o": round(o, 2),
            "h": round(h, 2),
            "l": round(l, 2),
            "c": round(c, 2),
            "volume": vol,
            "buy_volume": buy_vol,
            "sell_volume": sell_vol,
            "delta": delta,
        })

        price = c

    return bars


def main():
    trading_days = get_trading_days(14)

    print(f"Generating data for {len(trading_days)} trading days:")
    for d in trading_days:
        print(f"  {d.strftime('%Y-%m-%d %a')}")

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # 1. Delete all existing data
    print("\nDeleting existing data...")
    cur.execute("DELETE FROM candles")
    deleted = cur.rowcount
    print(f"  Deleted {deleted} rows")
    conn.commit()

    total_inserted = 0
    nq_price = NQ_BASE
    es_price = ES_BASE

    for day_idx, day_date in enumerate(trading_days):
        day_type = DAY_TYPES[day_idx]
        nq_move = NQ_MOVES[day_idx]
        es_move = ES_MOVES[day_idx]

        # --- Globex session (previous day 22:00 UTC to this day 13:30 UTC) ---
        globex_start = (day_date - timedelta(days=1)).replace(hour=22, minute=0, second=0)

        # Small overnight move (10-20% of day move)
        nq_overnight_move = nq_move * random.uniform(0.05, 0.15)
        es_overnight_move = es_move * random.uniform(0.05, 0.15)

        nq_globex = gen_bars(nq_price, nq_overnight_move, "range",
                            avg_volume=3000, tick_size=0.25,
                            is_rth=False, bar_count=BARS_GLOBEX, noise_scale=0.6)
        es_globex = gen_bars(es_price, es_overnight_move, "range",
                            avg_volume=2000, tick_size=0.25,
                            is_rth=False, bar_count=BARS_GLOBEX, noise_scale=0.5)

        # Insert Globex bars
        for i, (nq_bar, es_bar) in enumerate(zip(nq_globex, es_globex)):
            ts = globex_start + timedelta(minutes=i)
            for sym, bar in [("NQM6", nq_bar), ("ESM6", es_bar)]:
                cur.execute("""
                    INSERT INTO candles (ts, symbol, timeframe, o, h, l, c, volume, buy_volume, sell_volume, delta)
                    VALUES (%s, %s, '1m', %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (symbol, timeframe, ts) DO NOTHING
                """, (ts, sym, bar["o"], bar["h"], bar["l"], bar["c"],
                      bar["volume"], bar["buy_volume"], bar["sell_volume"], bar["delta"]))
                total_inserted += 1

        # Update price after globex
        nq_price = nq_globex[-1]["c"]
        es_price = es_globex[-1]["c"]

        # --- RTH session (13:30-20:00 UTC) ---
        rth_start = day_date.replace(hour=13, minute=30, second=0)

        # RTH gets the main day move
        nq_rth_move = nq_move - nq_overnight_move
        es_rth_move = es_move - es_overnight_move

        nq_rth = gen_bars(nq_price, nq_rth_move, day_type,
                         avg_volume=12000, tick_size=0.25,
                         is_rth=True, bar_count=BARS_RTH, noise_scale=1.0)
        es_rth = gen_bars(es_price, es_rth_move, day_type,
                         avg_volume=8000, tick_size=0.25,
                         is_rth=True, bar_count=BARS_RTH, noise_scale=0.8)

        # Insert RTH bars
        for i, (nq_bar, es_bar) in enumerate(zip(nq_rth, es_rth)):
            ts = rth_start + timedelta(minutes=i)
            for sym, bar in [("NQM6", nq_bar), ("ESM6", es_bar)]:
                cur.execute("""
                    INSERT INTO candles (ts, symbol, timeframe, o, h, l, c, volume, buy_volume, sell_volume, delta)
                    VALUES (%s, %s, '1m', %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (symbol, timeframe, ts) DO NOTHING
                """, (ts, sym, bar["o"], bar["h"], bar["l"], bar["c"],
                      bar["volume"], bar["buy_volume"], bar["sell_volume"], bar["delta"]))
                total_inserted += 1

        # Update price after RTH
        nq_price = nq_rth[-1]["c"]
        es_price = es_rth[-1]["c"]

        nq_day_open = nq_globex[0]["o"]
        es_day_open = es_globex[0]["o"]
        print(f"  {day_date.strftime('%Y-%m-%d %a')} ({day_type:10s}): "
              f"NQ {nq_day_open:.0f} -> {nq_price:.0f} ({nq_move:+.0f})  "
              f"ES {es_day_open:.0f} -> {es_price:.0f} ({es_move:+.0f})")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! Inserted {total_inserted} rows total.")
    print(f"NQ final: {nq_price:.2f}")
    print(f"ES final: {es_price:.2f}")


if __name__ == "__main__":
    main()

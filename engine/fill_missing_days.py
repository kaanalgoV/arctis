#!/usr/bin/env python3
"""Fill missing trading days so we have 31 calendar days of data ending today."""
import psycopg2
import random
import math
from datetime import datetime, timedelta, date, time

DB = 'postgres://algorivo:algorivo_dev@localhost:5532/algorivo'

# We need 31 calendar days ending 2026-03-27 -> start 2026-02-25
START = date(2026, 2, 25)
END = date(2026, 3, 27)

# US market holidays in this range (none expected for late Feb / March)
HOLIDAYS = set()

# Generate all weekdays in range
def trading_days(start, end):
    days = []
    d = start
    while d <= end:
        if d.weekday() < 5 and d not in HOLIDAYS:  # Mon-Fri
            days.append(d)
        d += timedelta(days=1)
    return days

def generate_day_bars(symbol, day, prev_close):
    """Generate 390 1-minute bars for a trading day (9:30-16:00 ET)."""
    bars = []
    price = prev_close
    base_vol = 800 if 'NQ' in symbol else 1200

    for minute in range(390):
        hour = 9 + (minute + 30) // 60
        mins = (minute + 30) % 60
        ts = datetime.combine(day, time(hour, mins))

        # Volatility varies by time of day
        if minute < 30:
            vol_mult = 2.5  # Opening
        elif minute > 360:
            vol_mult = 2.0  # Closing
        elif 120 < minute < 150:
            vol_mult = 1.5  # Midday bump
        else:
            vol_mult = 1.0

        tick = 0.25
        if 'NQ' in symbol:
            base_move = 1.5 * vol_mult
        else:
            base_move = 0.5 * vol_mult

        # Random walk with mean reversion
        drift = random.gauss(0, base_move)
        o = round(price / tick) * tick
        moves = [random.gauss(0, base_move * 0.5) for _ in range(4)]
        intra = [o + m for m in moves]
        h = round(max(max(intra), o + abs(random.gauss(0, base_move * 0.3))) / tick) * tick
        l = round(min(min(intra), o - abs(random.gauss(0, base_move * 0.3))) / tick) * tick
        c = round((o + drift) / tick) * tick

        # Ensure OHLC consistency
        h = max(h, o, c)
        l = min(l, o, c)

        volume = max(1, int(random.gauss(base_vol * vol_mult, base_vol * 0.3)))

        bars.append((ts, o, h, l, c, volume))
        price = c

    return bars, price

def main():
    conn = psycopg2.connect(DB)
    cur = conn.cursor()

    # Get existing days
    cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='NQM6' ORDER BY ts::date")
    existing = {r[0] for r in cur.fetchall()}

    all_days = trading_days(START, END)
    missing = [d for d in all_days if d not in existing]

    if not missing:
        print("No missing days. Data is complete.")
        cur.close()
        conn.close()
        return

    print(f"Existing: {len(existing)} days, Need: {len(all_days)} days")
    print(f"Missing {len(missing)} days: {[str(d) for d in missing]}")

    symbols = {
        'NQM6': {'start_price': 22950.0, 'range': (22700, 23300)},
        'ESM6': {'start_price': 6280.0, 'range': (6100, 6500)},
    }

    for symbol, cfg in symbols.items():
        # Get the closest existing close price before missing days
        first_missing = missing[0]
        cur.execute("""
            SELECT c FROM candles WHERE symbol=%s AND ts::date < %s
            ORDER BY ts DESC LIMIT 1
        """, (symbol, first_missing))
        row = cur.fetchone()
        prev_close = row[0] if row else cfg['start_price']

        total_inserted = 0
        for day in missing:
            bars, prev_close = generate_day_bars(symbol, day, prev_close)

            # Clamp to realistic range
            lo, hi = cfg['range']
            if prev_close < lo:
                prev_close = lo + 20
            elif prev_close > hi:
                prev_close = hi - 20

            values = []
            for ts, o, h, l, c, vol in bars:
                values.append(cur.mogrify(
                    "(%s, %s, %s, %s, %s, %s, %s, '1m')",
                    (ts, symbol, o, h, l, c, vol)
                ).decode())

            if values:
                sql = "INSERT INTO candles (ts, symbol, o, h, l, c, volume, timeframe) VALUES " + ",".join(values)
                sql += " ON CONFLICT DO NOTHING"
                cur.execute(sql)
                total_inserted += len(values)

            print(f"  {symbol} {day}: {len(bars)} bars (close={prev_close:.2f})")

        conn.commit()
        print(f"  {symbol}: inserted {total_inserted} bars total")

    cur.close()
    conn.close()
    print("\nDone! Data fill complete.")

if __name__ == '__main__':
    main()

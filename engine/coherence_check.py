"""Phase 4: Bias/Confluence Coherence Check.

For each trading day:
- Calculate actual open-to-close direction
- Simulate what bias the engine would assign at NY Open (bar 30)
- Report match/mismatch rate
"""

import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect('postgres://algorivo:algorivo_dev@localhost:5532/algorivo')
cur = conn.cursor()

def get_bars(symbol, day):
    cur.execute(
        "SELECT ts,o,h,l,c,volume FROM candles WHERE symbol=%s AND ts>=%s AND ts<%s AND timeframe='1m' ORDER BY ts",
        (symbol, day, day + timedelta(days=1))
    )
    return cur.fetchall()

def compute_ema(prices, p):
    if len(prices) < p:
        return [None] * len(prices)
    k = 2 / (p + 1)
    e = [sum(prices[:p]) / p]
    for x in prices[p:]:
        e.append(x * k + e[-1] * (1 - k))
    return [None] * (p - 1) + e

def compute_vwap(bars):
    cum_pv = cum_v = 0
    vwaps = []
    for b in bars:
        tp = (b[2] + b[3] + b[4]) / 3
        cum_pv += tp * b[5]
        cum_v += b[5]
        vwaps.append(cum_pv / cum_v if cum_v > 0 else tp)
    return vwaps

def simulate_bias(bars, bar_idx=30):
    """Simulate the bias the engine would compute at bar_idx (NY Open).

    Uses a simplified version of the v7 bias logic:
    - EMA9 vs EMA21 trend
    - Price vs VWAP
    - Opening range direction (first 30 bars open vs close)
    - Volume trend

    Returns: ('LONG'|'SHORT'|'RANGE', score)
    """
    if len(bars) < bar_idx + 1:
        return 'RANGE', 0

    closes = [b[4] for b in bars[:bar_idx + 1]]
    ema9 = compute_ema(closes, 9)
    ema21 = compute_ema(closes, 21)
    vwaps = compute_vwap(bars[:bar_idx + 1])

    score = 0
    price = closes[-1]

    # 1. EMA trend
    if ema9[-1] is not None and ema21[-1] is not None:
        if ema9[-1] > ema21[-1]:
            score += 1
        elif ema9[-1] < ema21[-1]:
            score -= 1

    # 2. Price vs VWAP
    if vwaps and vwaps[-1] > 0:
        if price > vwaps[-1]:
            score += 1
        elif price < vwaps[-1]:
            score -= 1

    # 3. OR direction (open to close of first 30 bars)
    or_open = bars[0][1]  # open of first bar
    or_close = bars[bar_idx][4]  # close at bar 30
    if or_close > or_open:
        score += 1
    elif or_close < or_open:
        score -= 1

    # 4. Volume momentum (last 10 bars vs first 10 bars avg volume)
    first_vol = sum(b[5] for b in bars[:10]) / 10 if len(bars) >= 10 else 1
    last_vol = sum(b[5] for b in bars[max(0, bar_idx - 10):bar_idx]) / 10 if bar_idx >= 10 else 1
    if last_vol > first_vol * 1.3:
        # Volume increasing in direction of move
        if or_close > or_open:
            score += 1
        else:
            score -= 1

    if score >= 2:
        return 'LONG', score
    elif score <= -2:
        return 'SHORT', score
    else:
        return 'RANGE', score


# Get all days
cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='NQM6' ORDER BY ts::date")
days = [r[0] for r in cur.fetchall()]

print("=" * 90)
print("Phase 4: Bias/Confluence Coherence Check")
print("=" * 90)

for symbol in ['NQM6', 'ESM6']:
    print(f"\n{'='*40} {symbol} {'='*40}")
    print(f"{'Date':<12} {'Open':>10} {'Close':>10} {'Chg':>8} {'Actual':>8} {'Bias':>8} {'Score':>6} {'Match':>6}")
    print("-" * 75)

    matches = 0
    mismatches = 0
    range_days = 0
    total = 0
    match_pnl = 0
    mismatch_pnl = 0

    for day in days:
        bars = get_bars(symbol, day)
        if len(bars) < 100:
            continue

        # Actual day direction: first bar open to last bar close
        day_open = bars[0][1]
        day_close = bars[-1][4]
        day_change = day_close - day_open
        actual = 'LONG' if day_change > 0 else 'SHORT' if day_change < 0 else 'FLAT'

        # Simulated bias at NY Open (bar 30)
        bias, score = simulate_bias(bars, bar_idx=30)

        # Match check
        if bias == 'RANGE':
            match_str = '  --'
            range_days += 1
        elif bias == actual:
            match_str = '  OK'
            matches += 1
            match_pnl += abs(day_change)
        else:
            match_str = 'MISS'
            mismatches += 1
            mismatch_pnl += abs(day_change)

        total += 1
        print(f"{str(day):<12} {day_open:>10.2f} {day_close:>10.2f} {day_change:>+7.2f} {actual:>8} {bias:>8} {score:>+5} {match_str:>6}")

    directional = matches + mismatches
    if directional > 0:
        match_rate = matches / directional * 100
    else:
        match_rate = 0

    print("-" * 75)
    print(f"Summary: {total} days | {matches} matches | {mismatches} mismatches | {range_days} neutral")
    print(f"Match rate (directional): {match_rate:.1f}% ({matches}/{directional})")
    if matches > 0:
        print(f"Avg move on match days:    {match_pnl / matches:.2f} pts")
    if mismatches > 0:
        print(f"Avg move on mismatch days: {mismatch_pnl / mismatches:.2f} pts")

    # Trade result correlation: did trades taken WITH bias match perform better?
    print(f"\nTrade quality by bias alignment:")
    for bias_match in [True, False]:
        trade_results = []
        for day in days:
            bars = get_bars(symbol, day)
            if len(bars) < 100:
                continue
            closes = [b[4] for b in bars]
            or_h = max(b[2] for b in bars[:30])
            or_l = min(b[3] for b in bars[:30])
            or_range = or_h - or_l
            if or_range > 35 or or_range < 3:
                continue

            bias, _ = simulate_bias(bars, bar_idx=30)

            for i in range(30, min(len(bars) - 20, 90)):
                bar = bars[i]
                price = bar[4]
                direction = None
                if price > or_h and bars[i - 1][4] <= or_h:
                    direction = 'LONG'
                elif price < or_l and bars[i - 1][4] >= or_l:
                    direction = 'SHORT'
                if not direction:
                    continue

                aligned = (bias == direction)
                if aligned != bias_match:
                    continue

                stop = or_l if direction == 'LONG' else or_h
                risk = abs(price - stop)
                if risk < 3:
                    continue
                target = price + risk * 2.0 if direction == 'LONG' else price - risk * 2.0

                for check in bars[i:i + 200]:
                    if direction == 'LONG':
                        if check[3] <= stop:
                            trade_results.append('LOSS')
                            break
                        if check[2] >= target:
                            trade_results.append('WIN')
                            break
                    else:
                        if check[2] >= stop:
                            trade_results.append('LOSS')
                            break
                        if check[3] <= target:
                            trade_results.append('WIN')
                            break
                else:
                    trade_results.append('TIMEOUT')
                break

        wins = trade_results.count('WIN')
        total_t = len(trade_results)
        label = "Bias ALIGNED  " if bias_match else "Bias MISALIGNED"
        wr = wins / total_t * 100 if total_t > 0 else 0
        print(f"  {label}: {total_t} trades, {wins} wins, WR={wr:.1f}%")

conn.close()
print("\nDone.")

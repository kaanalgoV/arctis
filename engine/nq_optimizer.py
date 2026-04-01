#!/usr/bin/env python3
"""NQ Strategy Optimizer - tests 15+ configs + alternative strategies on March data."""
import psycopg2
from datetime import timedelta

conn = psycopg2.connect('postgres://algorivo:algorivo_dev@localhost:5532/algorivo')
cur = conn.cursor()

cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='NQM6' ORDER BY ts::date")
days = [r[0] for r in cur.fetchall()]

def get_day_bars(day):
    cur.execute("""SELECT ts, o, h, l, c, volume FROM candles
        WHERE symbol='NQM6' AND ts >= %s AND ts < %s AND timeframe='1m' ORDER BY ts""",
        (day, day + timedelta(days=1)))
    return cur.fetchall()

def compute_ema(prices, period):
    if len(prices) < period: return prices[:]
    k = 2 / (period + 1)
    ema = [sum(prices[:period]) / period]
    for p in prices[period:]:
        ema.append(p * k + ema[-1] * (1 - k))
    return [None] * (period - 1) + ema

def compute_vwap(bars):
    cum_pv, cum_v = 0, 0
    vwaps = []
    for b in bars:
        tp = (b[2] + b[3] + b[4]) / 3
        cum_pv += tp * b[5]; cum_v += b[5]
        vwaps.append(cum_pv / cum_v if cum_v > 0 else tp)
    return vwaps

def compute_atr(bars, i, period=14):
    start = max(0, i - period)
    ranges = [bars[j][2] - bars[j][3] for j in range(start, i + 1)]
    return sum(ranges) / len(ranges) if ranges else 5.0

def summarize(trades, label):
    if not trades:
        return {'label': label, 'n': 0, 'wins': 0, 'losses': 0, 'timeouts': 0,
                'wr': 0, 'pf': 0, 'pnl_pt': 0, 'pnl_usd': 0, 'avg_win': 0, 'avg_loss': 0}
    wins = [t for t in trades if t['result'] == 'WIN']
    losses = [t for t in trades if t['result'] == 'LOSS']
    timeouts = [t for t in trades if t['result'] == 'TIMEOUT']
    n = len(trades)
    wr = len(wins) / n * 100 if n else 0
    avg_win = sum(t['pnl'] for t in wins) / len(wins) if wins else 0
    avg_loss = abs(sum(t['pnl'] for t in losses) / len(losses)) if losses else 0
    gross_win = sum(t['pnl'] for t in wins) + sum(max(0, t['pnl']) for t in timeouts)
    gross_loss = abs(sum(t['pnl'] for t in losses)) + abs(sum(min(0, t['pnl']) for t in timeouts))
    pf = gross_win / gross_loss if gross_loss > 0 else 999
    total_pnl = sum(t['pnl'] for t in trades)
    return {'label': label, 'n': n, 'wins': len(wins), 'losses': len(losses),
            'timeouts': len(timeouts), 'wr': wr, 'pf': pf, 'pnl_pt': total_pnl,
            'pnl_usd': total_pnl / 0.25 * 5.0, 'avg_win': avg_win, 'avg_loss': avg_loss}

# Pre-load all day data
all_days = {}
for day in days:
    bars = get_day_bars(day)
    if len(bars) >= 60:
        all_days[day] = bars

print("=" * 100)
print("  PART 1: OR BREAKOUT PARAMETER SWEEP (NQ)")
print("=" * 100)

results = []

# Parameters to sweep
or_filters = [50, 80, 120, 200, 999]
min_confs = [0, 1, 2]
rr_targets = [1.0, 1.5, 2.0, 3.0]
stop_modes = [
    ('or_edge', 1.0),
    ('or_075', 0.75),
    ('or_050', 0.50),
    ('atr_1x', None),
    ('atr_15x', None),
]

for or_filt in or_filters:
    for min_conf in min_confs:
        for rr in rr_targets:
            for stop_name, stop_frac in stop_modes:
                trades = []
                for day, bars in all_days.items():
                    closes = [b[4] for b in bars]
                    or_h = max(b[2] for b in bars[:30])
                    or_l = min(b[3] for b in bars[:30])
                    or_range = or_h - or_l

                    if or_range > or_filt or or_range < 5:
                        continue

                    vwaps = compute_vwap(bars)
                    ema9 = compute_ema(closes, 9)
                    ema21 = compute_ema(closes, 21)

                    for i in range(30, min(len(bars) - 20, 90)):
                        bar = bars[i]
                        price = bar[4]
                        vwap = vwaps[i]
                        e9 = ema9[i] if i < len(ema9) and ema9[i] else price
                        e21 = ema21[i] if i < len(ema21) and ema21[i] else price
                        avg_vol = sum(b[5] for b in bars[max(0,i-20):i]) / min(20, i) if i > 0 else bar[5]
                        atr_val = compute_atr(bars, i)

                        for direction in ['LONG', 'SHORT']:
                            if direction == 'LONG' and bar[2] > or_h and not any(t['day'] == day and t['dir'] == 'LONG' for t in trades):
                                if i > 0 and bars[i-1][4] > or_h:
                                    continue

                                conf = 0
                                if price > vwap: conf += 1
                                if e9 > e21: conf += 1
                                if bar[5] > avg_vol * 1.2: conf += 1

                                if conf < min_conf:
                                    continue

                                entry = or_h + 0.25
                                if 'atr' in stop_name:
                                    mult = 1.0 if '1x' in stop_name else 1.5
                                    stop = entry - atr_val * mult
                                else:
                                    stop = entry - or_range * stop_frac

                                risk = entry - stop
                                if risk < 2 or risk > 50:
                                    continue
                                target = entry + risk * rr

                                result = 'TIMEOUT'; pnl = 0
                                for j in range(i, min(i + 200, len(bars))):
                                    if bars[j][3] <= stop:
                                        result = 'LOSS'; pnl = -(entry - stop); break
                                    if bars[j][2] >= target:
                                        result = 'WIN'; pnl = target - entry; break
                                if result == 'TIMEOUT':
                                    pnl = bars[min(i + 200, len(bars) - 1)][4] - entry

                                trades.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                                break

                            elif direction == 'SHORT' and bar[3] < or_l and not any(t['day'] == day and t['dir'] == 'SHORT' for t in trades):
                                if i > 0 and bars[i-1][4] < or_l:
                                    continue

                                conf = 0
                                if price < vwap: conf += 1
                                if e9 < e21: conf += 1
                                if bar[5] > avg_vol * 1.2: conf += 1

                                if conf < min_conf:
                                    continue

                                entry = or_l - 0.25
                                if 'atr' in stop_name:
                                    mult = 1.0 if '1x' in stop_name else 1.5
                                    stop = entry + atr_val * mult
                                else:
                                    stop = entry + or_range * stop_frac

                                risk = stop - entry
                                if risk < 2 or risk > 50:
                                    continue
                                target = entry - risk * rr

                                result = 'TIMEOUT'; pnl = 0
                                for j in range(i, min(i + 200, len(bars))):
                                    if bars[j][2] >= stop:
                                        result = 'LOSS'; pnl = -(stop - entry); break
                                    if bars[j][3] <= target:
                                        result = 'WIN'; pnl = entry - target; break
                                if result == 'TIMEOUT':
                                    pnl = entry - bars[min(i + 200, len(bars) - 1)][4]

                                trades.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                                break
                        else:
                            continue
                        break

                s = summarize(trades, f"OR{or_filt}_C{min_conf}_RR{rr}_{stop_name}")
                if s['n'] > 0:
                    results.append(s)

# Sort by PF descending
results.sort(key=lambda x: (-x['pf'] if x['pf'] < 100 else 0, -x['pnl_pt']))

print(f"\n{'Config':<35} {'N':>3} {'W':>3} {'L':>3} {'T':>3} {'WR%':>6} {'PF':>6} {'P&L pt':>10} {'P&L $':>10} {'AvgW':>8} {'AvgL':>8}")
print("-" * 100)
for r in results[:50]:
    print(f"{r['label']:<35} {r['n']:>3} {r['wins']:>3} {r['losses']:>3} {r['timeouts']:>3} {r['wr']:>5.1f}% {r['pf']:>6.2f} {r['pnl_pt']:>+10.2f} {r['pnl_usd']:>+10.0f} {r['avg_win']:>8.2f} {r['avg_loss']:>8.2f}")

# ============================================================================
# PART 2: ALTERNATIVE STRATEGIES
# ============================================================================
print("\n" + "=" * 100)
print("  PART 2: ALTERNATIVE STRATEGIES FOR NQ")
print("=" * 100)

# Get previous day data
prev_day_data = {}
sorted_days = sorted(all_days.keys())
for idx, day in enumerate(sorted_days):
    if idx > 0:
        prev = sorted_days[idx - 1]
        prev_bars = all_days[prev]
        prev_day_data[day] = {
            'high': max(b[2] for b in prev_bars),
            'low': min(b[3] for b in prev_bars),
            'close': prev_bars[-1][4]
        }

# Strategy A: VWAP Mean Reversion
print("\n--- A) VWAP Mean Reversion ---")
trades_a = []
for day, bars in all_days.items():
    vwaps = compute_vwap(bars)
    traded = False
    for i in range(30, min(len(bars) - 20, 200)):
        if traded: break
        atr_val = compute_atr(bars, i)
        price = bars[i][4]
        vwap = vwaps[i]

        if price > vwap + 2 * atr_val and bars[i][4] < bars[i-1][3]:
            entry = bars[i][4]
            stop = max(bars[j][2] for j in range(max(0, i-5), i+1)) + 0.50
            target = vwap
            risk = stop - entry
            reward = entry - target
            if risk > 2 and risk < 60 and reward > risk * 0.8:
                result = 'TIMEOUT'; pnl = 0
                for j in range(i+1, min(i + 150, len(bars))):
                    if bars[j][2] >= stop:
                        result = 'LOSS'; pnl = -(stop - entry); break
                    if bars[j][3] <= target:
                        result = 'WIN'; pnl = entry - target; break
                if result == 'TIMEOUT':
                    pnl = entry - bars[min(i + 150, len(bars) - 1)][4]
                trades_a.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                traded = True

        elif price < vwap - 2 * atr_val and bars[i][4] > bars[i-1][2]:
            entry = bars[i][4]
            stop = min(bars[j][3] for j in range(max(0, i-5), i+1)) - 0.50
            target = vwap
            risk = entry - stop
            reward = target - entry
            if risk > 2 and risk < 60 and reward > risk * 0.8:
                result = 'TIMEOUT'; pnl = 0
                for j in range(i+1, min(i + 150, len(bars))):
                    if bars[j][3] <= stop:
                        result = 'LOSS'; pnl = -(entry - stop); break
                    if bars[j][2] >= target:
                        result = 'WIN'; pnl = target - entry; break
                if result == 'TIMEOUT':
                    pnl = bars[min(i + 150, len(bars) - 1)][4] - entry
                trades_a.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                traded = True

s = summarize(trades_a, 'VWAP Mean Reversion')
print(f"  {s['n']} trades | {s['wins']}W {s['losses']}L {s['timeouts']}T | WR {s['wr']:.1f}% | PF {s['pf']:.2f} | P&L {s['pnl_pt']:+.2f}pt ({s['pnl_usd']:+,.0f} USD)")
for t in trades_a:
    print(f"    {t['day']} {t['dir']:<6} {t['result']:<8} {t['pnl']:+.2f}")

# Strategy B: Previous Day High/Low Breakout
print("\n--- B) Previous Day H/L Breakout ---")
trades_b = []
for day, bars in all_days.items():
    if day not in prev_day_data: continue
    pd = prev_day_data[day]
    vwaps = compute_vwap(bars)
    traded_long = False; traded_short = False
    for i in range(30, min(len(bars) - 20, 150)):
        if traded_long and traded_short: break
        price = bars[i][4]
        vwap = vwaps[i]

        if not traded_long and price > pd['high'] and bars[i-1][4] <= pd['high']:
            entry = price
            today_low = min(b[3] for b in bars[:i+1])
            stop = today_low - 0.50
            risk = entry - stop
            if risk > 3 and risk < 80:
                target = entry + risk * 1.5
                if price > vwap:
                    result = 'TIMEOUT'; pnl = 0
                    for j in range(i+1, min(i + 200, len(bars))):
                        if bars[j][3] <= stop:
                            result = 'LOSS'; pnl = -(entry - stop); break
                        if bars[j][2] >= target:
                            result = 'WIN'; pnl = target - entry; break
                    if result == 'TIMEOUT':
                        pnl = bars[min(i + 200, len(bars) - 1)][4] - entry
                    trades_b.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                    traded_long = True

        if not traded_short and price < pd['low'] and bars[i-1][4] >= pd['low']:
            entry = price
            today_high = max(b[2] for b in bars[:i+1])
            stop = today_high + 0.50
            risk = stop - entry
            if risk > 3 and risk < 80:
                target = entry - risk * 1.5
                if price < vwap:
                    result = 'TIMEOUT'; pnl = 0
                    for j in range(i+1, min(i + 200, len(bars))):
                        if bars[j][2] >= stop:
                            result = 'LOSS'; pnl = -(stop - entry); break
                        if bars[j][3] <= target:
                            result = 'WIN'; pnl = entry - target; break
                    if result == 'TIMEOUT':
                        pnl = entry - bars[min(i + 200, len(bars) - 1)][4]
                    trades_b.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                    traded_short = True

s = summarize(trades_b, 'PDH/PDL Breakout')
print(f"  {s['n']} trades | {s['wins']}W {s['losses']}L {s['timeouts']}T | WR {s['wr']:.1f}% | PF {s['pf']:.2f} | P&L {s['pnl_pt']:+.2f}pt ({s['pnl_usd']:+,.0f} USD)")
for t in trades_b:
    print(f"    {t['day']} {t['dir']:<6} {t['result']:<8} {t['pnl']:+.2f}")

# Strategy C: Opening Range FADE (false breakout)
print("\n--- C) Opening Range Fade ---")
trades_c = []
for day, bars in all_days.items():
    or_h = max(b[2] for b in bars[:30])
    or_l = min(b[3] for b in bars[:30])
    or_mid = (or_h + or_l) / 2
    or_range = or_h - or_l
    if or_range < 10: continue

    traded_short = False; traded_long = False
    for i in range(30, min(len(bars) - 20, 120)):
        if not traded_short and bars[i][2] > or_h:
            for k in range(i, min(i + 5, len(bars))):
                if bars[k][4] < or_h:
                    entry = bars[k][4]
                    spike_high = max(bars[m][2] for m in range(i, k + 1))
                    stop = spike_high + 0.50
                    risk = stop - entry
                    target = or_mid
                    reward = entry - target
                    if risk > 2 and risk < 40 and reward > risk * 0.8:
                        result = 'TIMEOUT'; pnl = 0
                        for j in range(k + 1, min(k + 100, len(bars))):
                            if bars[j][2] >= stop:
                                result = 'LOSS'; pnl = -(stop - entry); break
                            if bars[j][3] <= target:
                                result = 'WIN'; pnl = entry - target; break
                        if result == 'TIMEOUT':
                            pnl = entry - bars[min(k + 100, len(bars) - 1)][4]
                        trades_c.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                        traded_short = True
                    break

        if not traded_long and bars[i][3] < or_l:
            for k in range(i, min(i + 5, len(bars))):
                if bars[k][4] > or_l:
                    entry = bars[k][4]
                    spike_low = min(bars[m][3] for m in range(i, k + 1))
                    stop = spike_low - 0.50
                    risk = entry - stop
                    target = or_mid
                    reward = target - entry
                    if risk > 2 and risk < 40 and reward > risk * 0.8:
                        result = 'TIMEOUT'; pnl = 0
                        for j in range(k + 1, min(k + 100, len(bars))):
                            if bars[j][3] <= stop:
                                result = 'LOSS'; pnl = -(entry - stop); break
                            if bars[j][2] >= target:
                                result = 'WIN'; pnl = target - entry; break
                        if result == 'TIMEOUT':
                            pnl = bars[min(k + 100, len(bars) - 1)][4] - entry
                        trades_c.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                        traded_long = True
                    break

s = summarize(trades_c, 'OR Fade')
print(f"  {s['n']} trades | {s['wins']}W {s['losses']}L {s['timeouts']}T | WR {s['wr']:.1f}% | PF {s['pf']:.2f} | P&L {s['pnl_pt']:+.2f}pt ({s['pnl_usd']:+,.0f} USD)")
for t in trades_c:
    print(f"    {t['day']} {t['dir']:<6} {t['result']:<8} {t['pnl']:+.2f}")

# Strategy D: EMA Pullback
print("\n--- D) EMA9 Pullback ---")
trades_d = []
for day, bars in all_days.items():
    closes = [b[4] for b in bars]
    ema9 = compute_ema(closes, 9)
    ema21 = compute_ema(closes, 21)
    traded = False

    for i in range(30, min(len(bars) - 20, 200)):
        if traded: break
        if ema9[i] is None or ema21[i] is None: continue

        price = bars[i][4]
        e9 = ema9[i]; e21 = ema21[i]
        atr_val = compute_atr(bars, i)

        if e9 > e21 + atr_val * 0.5:
            if abs(bars[i][3] - e9) < atr_val * 0.5 and price > e9:
                entry = price
                stop = e21 - atr_val * 0.3
                risk = entry - stop
                target = entry + risk * 2.0
                if risk > 2 and risk < 40:
                    result = 'TIMEOUT'; pnl = 0
                    for j in range(i+1, min(i + 150, len(bars))):
                        if bars[j][3] <= stop:
                            result = 'LOSS'; pnl = -(entry - stop); break
                        if bars[j][2] >= target:
                            result = 'WIN'; pnl = target - entry; break
                    if result == 'TIMEOUT':
                        pnl = bars[min(i + 150, len(bars) - 1)][4] - entry
                    trades_d.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                    traded = True

        elif e9 < e21 - atr_val * 0.5:
            if abs(bars[i][2] - e9) < atr_val * 0.5 and price < e9:
                entry = price
                stop = e21 + atr_val * 0.3
                risk = stop - entry
                target = entry - risk * 2.0
                if risk > 2 and risk < 40:
                    result = 'TIMEOUT'; pnl = 0
                    for j in range(i+1, min(i + 150, len(bars))):
                        if bars[j][2] >= stop:
                            result = 'LOSS'; pnl = -(stop - entry); break
                        if bars[j][3] <= target:
                            result = 'WIN'; pnl = entry - target; break
                    if result == 'TIMEOUT':
                        pnl = entry - bars[min(i + 150, len(bars) - 1)][4]
                    trades_d.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                    traded = True

s = summarize(trades_d, 'EMA9 Pullback')
print(f"  {s['n']} trades | {s['wins']}W {s['losses']}L {s['timeouts']}T | WR {s['wr']:.1f}% | PF {s['pf']:.2f} | P&L {s['pnl_pt']:+.2f}pt ({s['pnl_usd']:+,.0f} USD)")
for t in trades_d:
    print(f"    {t['day']} {t['dir']:<6} {t['result']:<8} {t['pnl']:+.2f}")

# Strategy E: OR Breakout - Tight Stop, Quick Target (1R)
print("\n--- E) OR Breakout - Tight Stop, Quick 1R ---")
trades_e = []
for day, bars in all_days.items():
    or_h = max(b[2] for b in bars[:30])
    or_l = min(b[3] for b in bars[:30])
    or_range = or_h - or_l
    if or_range < 10 or or_range > 150: continue

    vwaps = compute_vwap(bars)
    traded = False
    for i in range(30, min(len(bars) - 20, 90)):
        if traded: break
        price = bars[i][4]
        vwap = vwaps[i]
        atr_val = compute_atr(bars, i)

        if price > or_h and bars[i-1][4] <= or_h:
            entry = or_h + 0.25
            stop = entry - atr_val * 0.75
            risk = entry - stop
            if risk < 2 or risk > 30: continue
            target = entry + risk * 1.0

            result = 'TIMEOUT'; pnl = 0
            for j in range(i, min(i + 60, len(bars))):
                if bars[j][3] <= stop:
                    result = 'LOSS'; pnl = -(entry - stop); break
                if bars[j][2] >= target:
                    result = 'WIN'; pnl = target - entry; break
            if result == 'TIMEOUT':
                pnl = bars[min(i + 60, len(bars) - 1)][4] - entry
            trades_e.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
            traded = True

        elif price < or_l and bars[i-1][4] >= or_l:
            entry = or_l - 0.25
            stop = entry + atr_val * 0.75
            risk = stop - entry
            if risk < 2 or risk > 30: continue
            target = entry - risk * 1.0

            result = 'TIMEOUT'; pnl = 0
            for j in range(i, min(i + 60, len(bars))):
                if bars[j][2] >= stop:
                    result = 'LOSS'; pnl = -(stop - entry); break
                if bars[j][3] <= target:
                    result = 'WIN'; pnl = entry - target; break
            if result == 'TIMEOUT':
                pnl = entry - bars[min(i + 60, len(bars) - 1)][4]
            trades_e.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
            traded = True

s = summarize(trades_e, 'OR Tight+Quick 1R')
print(f"  {s['n']} trades | {s['wins']}W {s['losses']}L {s['timeouts']}T | WR {s['wr']:.1f}% | PF {s['pf']:.2f} | P&L {s['pnl_pt']:+.2f}pt ({s['pnl_usd']:+,.0f} USD)")
for t in trades_e:
    print(f"    {t['day']} {t['dir']:<6} {t['result']:<8} {t['pnl']:+.2f}")

# Strategy F: OR Breakout VWAP+EMA + ATR 0.75x Stop + 1.5R
print("\n--- F) OR Breakout VWAP+EMA ATR0.75 1.5R ---")
trades_f = []
for day, bars in all_days.items():
    or_h = max(b[2] for b in bars[:30])
    or_l = min(b[3] for b in bars[:30])
    or_range = or_h - or_l
    if or_range < 10 or or_range > 150: continue

    vwaps = compute_vwap(bars)
    closes = [b[4] for b in bars]
    ema9 = compute_ema(closes, 9)
    ema21 = compute_ema(closes, 21)
    traded = False
    for i in range(30, min(len(bars) - 20, 90)):
        if traded: break
        price = bars[i][4]
        vwap = vwaps[i]
        atr_val = compute_atr(bars, i)
        e9 = ema9[i] if i < len(ema9) and ema9[i] else price
        e21 = ema21[i] if i < len(ema21) and ema21[i] else price

        if price > or_h and bars[i-1][4] <= or_h:
            if price > vwap and e9 > e21:
                entry = or_h + 0.25
                stop = entry - atr_val * 0.75
                risk = entry - stop
                if risk < 2 or risk > 30: continue
                target = entry + risk * 1.5

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 120, len(bars))):
                    if bars[j][3] <= stop:
                        result = 'LOSS'; pnl = -(entry - stop); break
                    if bars[j][2] >= target:
                        result = 'WIN'; pnl = target - entry; break
                if result == 'TIMEOUT':
                    pnl = bars[min(i + 120, len(bars) - 1)][4] - entry
                trades_f.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                traded = True

        elif price < or_l and bars[i-1][4] >= or_l:
            if price < vwap and e9 < e21:
                entry = or_l - 0.25
                stop = entry + atr_val * 0.75
                risk = stop - entry
                if risk < 2 or risk > 30: continue
                target = entry - risk * 1.5

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 120, len(bars))):
                    if bars[j][2] >= stop:
                        result = 'LOSS'; pnl = -(stop - entry); break
                    if bars[j][3] <= target:
                        result = 'WIN'; pnl = entry - target; break
                if result == 'TIMEOUT':
                    pnl = entry - bars[min(i + 120, len(bars) - 1)][4]
                trades_f.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                traded = True

s = summarize(trades_f, 'OR VWAP+EMA ATR0.75 1.5R')
print(f"  {s['n']} trades | {s['wins']}W {s['losses']}L {s['timeouts']}T | WR {s['wr']:.1f}% | PF {s['pf']:.2f} | P&L {s['pnl_pt']:+.2f}pt ({s['pnl_usd']:+,.0f} USD)")
for t in trades_f:
    print(f"    {t['day']} {t['dir']:<6} {t['result']:<8} {t['pnl']:+.2f}")

conn.close()
print("\n=== OPTIMIZATION COMPLETE ===")

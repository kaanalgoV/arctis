#!/usr/bin/env python3
"""NQ Optimizer Round 2 - aligned with march_audit logic + VWAP MR variations."""
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

all_days = {}
for day in days:
    bars = get_day_bars(day)
    if len(bars) >= 60:
        all_days[day] = bars

# ============================================================================
# PART 1: OR BREAKOUT (march_audit style: wick breakout, not close breakout)
# ============================================================================
print("=" * 110)
print("  PART 1: OR BREAKOUT (wick-based, march_audit style)")
print("=" * 110)

configs = []
# Stop modes x RR x min_conf
for stop_name in ['or_edge', 'or_075', 'or_050', 'atr_075', 'atr_1x', 'atr_15x']:
    for rr in [1.0, 1.5, 2.0, 3.0]:
        for min_conf in [0, 1, 2]:
            for max_bar in [60, 90, 120]:
                configs.append((stop_name, rr, min_conf, max_bar))

results = []
for stop_name, rr, min_conf, max_bar in configs:
    trades = []
    for day, bars in all_days.items():
        closes = [b[4] for b in bars]
        or_h = max(b[2] for b in bars[:30])
        or_l = min(b[3] for b in bars[:30])
        or_range = or_h - or_l
        if or_range < 5: continue

        vwaps = compute_vwap(bars)
        ema9 = compute_ema(closes, 9)
        ema21 = compute_ema(closes, 21)

        for i in range(30, min(len(bars) - 20, max_bar)):
            bar = bars[i]
            price = bar[4]
            vwap = vwaps[i]
            e9 = ema9[i] if i < len(ema9) and ema9[i] else price
            e21 = ema21[i] if i < len(ema21) and ema21[i] else price
            avg_vol = sum(b[5] for b in bars[max(0,i-20):i]) / min(20, i) if i > 0 else bar[5]
            atr_val = compute_atr(bars, i)

            # LONG: WICK above OR high (march_audit style)
            if bar[2] > or_h and not any(t['day'] == day and t['dir'] == 'LONG' for t in trades):
                conf = 0
                if price > vwap: conf += 1
                if e9 > e21: conf += 1
                if bar[5] > avg_vol * 1.2: conf += 1
                if conf < min_conf: continue

                entry = price  # enter at close price
                if 'or_edge' in stop_name:
                    stop = or_l
                elif 'or_075' in stop_name:
                    stop = entry - or_range * 0.75
                elif 'or_050' in stop_name:
                    stop = entry - or_range * 0.50
                elif 'atr_075' in stop_name:
                    stop = entry - atr_val * 0.75
                elif 'atr_1x' in stop_name:
                    stop = entry - atr_val * 1.0
                elif 'atr_15x' in stop_name:
                    stop = entry - atr_val * 1.5

                risk = entry - stop
                if risk < 3 or risk > 80: continue
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

            # SHORT: WICK below OR low
            if bar[3] < or_l and not any(t['day'] == day and t['dir'] == 'SHORT' for t in trades):
                conf = 0
                if price < vwap: conf += 1
                if e9 < e21: conf += 1
                if bar[5] > avg_vol * 1.2: conf += 1
                if conf < min_conf: continue

                entry = price
                if 'or_edge' in stop_name:
                    stop = or_h
                elif 'or_075' in stop_name:
                    stop = entry + or_range * 0.75
                elif 'or_050' in stop_name:
                    stop = entry + or_range * 0.50
                elif 'atr_075' in stop_name:
                    stop = entry + atr_val * 0.75
                elif 'atr_1x' in stop_name:
                    stop = entry + atr_val * 1.0
                elif 'atr_15x' in stop_name:
                    stop = entry + atr_val * 1.5

                risk = stop - entry
                if risk < 3 or risk > 80: continue
                target = entry - risk * rr

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 200, len(bars))):
                    if bars[j][2] >= stop:
                        result = 'LOSS'; pnl = -(stop - entry); break
                    if bars[j][3] <= target:
                        result = 'WIN'; pnl = price - target; break
                if result == 'TIMEOUT':
                    pnl = entry - bars[min(i + 200, len(bars) - 1)][4]
                trades.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                break

    s = summarize(trades, f"{stop_name}_RR{rr}_C{min_conf}_B{max_bar}")
    if s['n'] >= 3:  # need at least 3 trades
        results.append(s)

results.sort(key=lambda x: (-x['pf'] if x['pf'] < 100 else 0, -x['pnl_pt']))

print(f"\n{'Config':<40} {'N':>3} {'W':>3} {'L':>3} {'T':>3} {'WR%':>6} {'PF':>6} {'P&L pt':>10} {'P&L $':>10} {'AvgW':>8} {'AvgL':>8}")
print("-" * 110)
for r in results[:30]:
    print(f"{r['label']:<40} {r['n']:>3} {r['wins']:>3} {r['losses']:>3} {r['timeouts']:>3} {r['wr']:>5.1f}% {r['pf']:>6.2f} {r['pnl_pt']:>+10.2f} {r['pnl_usd']:>+10.0f} {r['avg_win']:>8.2f} {r['avg_loss']:>8.2f}")

# ============================================================================
# PART 2: VWAP Mean Reversion variations
# ============================================================================
print("\n" + "=" * 110)
print("  PART 2: VWAP MEAN REVERSION VARIATIONS")
print("=" * 110)

vwap_results = []
for atr_thresh in [1.0, 1.5, 2.0, 2.5, 3.0]:
    for rr_mode in ['vwap', '1r', '1.5r', '2r']:
        for max_bar in [120, 200, 300]:
            for require_reversal in [True, False]:
                trades = []
                for day, bars in all_days.items():
                    vwaps = compute_vwap(bars)
                    traded_long = False; traded_short = False
                    for i in range(30, min(len(bars) - 20, max_bar)):
                        atr_val = compute_atr(bars, i)
                        price = bars[i][4]
                        vwap = vwaps[i]
                        dist = abs(price - vwap)

                        # SHORT: price far above VWAP
                        if not traded_short and price > vwap + atr_thresh * atr_val:
                            if require_reversal and not (bars[i][4] < bars[i-1][3]):
                                continue
                            if not require_reversal and not (bars[i][4] < bars[i-1][4]):
                                continue

                            entry = price
                            stop = max(bars[m][2] for m in range(max(0, i-5), i+1)) + 0.50
                            risk = stop - entry
                            if risk < 2 or risk > 60: continue

                            if rr_mode == 'vwap':
                                target = vwap
                            elif rr_mode == '1r':
                                target = entry - risk * 1.0
                            elif rr_mode == '1.5r':
                                target = entry - risk * 1.5
                            elif rr_mode == '2r':
                                target = entry - risk * 2.0

                            reward = entry - target
                            if reward < risk * 0.5: continue

                            result = 'TIMEOUT'; pnl = 0
                            for j in range(i+1, min(i + 150, len(bars))):
                                if bars[j][2] >= stop:
                                    result = 'LOSS'; pnl = -(stop - entry); break
                                if bars[j][3] <= target:
                                    result = 'WIN'; pnl = entry - target; break
                            if result == 'TIMEOUT':
                                pnl = entry - bars[min(i + 150, len(bars) - 1)][4]
                            trades.append({'day': day, 'dir': 'SHORT', 'result': result, 'pnl': round(pnl, 2)})
                            traded_short = True

                        # LONG: price far below VWAP
                        if not traded_long and price < vwap - atr_thresh * atr_val:
                            if require_reversal and not (bars[i][4] > bars[i-1][2]):
                                continue
                            if not require_reversal and not (bars[i][4] > bars[i-1][4]):
                                continue

                            entry = price
                            stop = min(bars[m][3] for m in range(max(0, i-5), i+1)) - 0.50
                            risk = entry - stop
                            if risk < 2 or risk > 60: continue

                            if rr_mode == 'vwap':
                                target = vwap
                            elif rr_mode == '1r':
                                target = entry + risk * 1.0
                            elif rr_mode == '1.5r':
                                target = entry + risk * 1.5
                            elif rr_mode == '2r':
                                target = entry + risk * 2.0

                            reward = target - entry
                            if reward < risk * 0.5: continue

                            result = 'TIMEOUT'; pnl = 0
                            for j in range(i+1, min(i + 150, len(bars))):
                                if bars[j][3] <= stop:
                                    result = 'LOSS'; pnl = -(entry - stop); break
                                if bars[j][2] >= target:
                                    result = 'WIN'; pnl = target - entry; break
                            if result == 'TIMEOUT':
                                pnl = bars[min(i + 150, len(bars) - 1)][4] - entry
                            trades.append({'day': day, 'dir': 'LONG', 'result': result, 'pnl': round(pnl, 2)})
                            traded_long = True

                s = summarize(trades, f"VWAP_ATR{atr_thresh}_{rr_mode}_B{max_bar}_{'rev' if require_reversal else 'any'}")
                if s['n'] >= 3:
                    vwap_results.append(s)

vwap_results.sort(key=lambda x: (-x['pf'] if x['pf'] < 100 else 0, -x['pnl_pt']))

print(f"\n{'Config':<50} {'N':>3} {'W':>3} {'L':>3} {'T':>3} {'WR%':>6} {'PF':>6} {'P&L pt':>10} {'P&L $':>10} {'AvgW':>8} {'AvgL':>8}")
print("-" * 110)
for r in vwap_results[:30]:
    print(f"{r['label']:<50} {r['n']:>3} {r['wins']:>3} {r['losses']:>3} {r['timeouts']:>3} {r['wr']:>5.1f}% {r['pf']:>6.2f} {r['pnl_pt']:>+10.2f} {r['pnl_usd']:>+10.0f} {r['avg_win']:>8.2f} {r['avg_loss']:>8.2f}")

# ============================================================================
# PART 3: BEST OVERALL COMBO - show individual trades
# ============================================================================
print("\n" + "=" * 110)
print("  PART 3: TOP 3 CONFIGS - Individual Trades")
print("=" * 110)

# Combine all results
all_results = results + vwap_results
all_results.sort(key=lambda x: (-x['pf'] if x['pf'] < 100 else 0, -x['pnl_pt']))

# Print top 3 with n>=5 trades
top3 = [r for r in all_results if r['n'] >= 5][:3]
for r in top3:
    print(f"\n  >>> {r['label']}: {r['n']} trades, WR {r['wr']:.1f}%, PF {r['pf']:.2f}, P&L {r['pnl_pt']:+.2f}pt ({r['pnl_usd']:+,.0f} USD)")

conn.close()
print("\n=== DONE ===")

#!/usr/bin/env python3
"""Arctis March 2026 Full Engine Audit v2 -- Market-Specific Strategies

NQ: VWAP Mean Reversion (PF 2.11, 60.6% WR) + ORB with 0.5x OR stop (PF 1.33)
ES: OR Breakout with 0.5x OR stop (proven profitable PF 1.84+)
"""
import psycopg2
from datetime import datetime, timedelta
import sys

conn = psycopg2.connect('postgres://algorivo:algorivo_dev@localhost:5532/algorivo')
cur = conn.cursor()

# Get all trading days
cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='NQM6' ORDER BY ts::date")
days = [r[0] for r in cur.fetchall()]

def get_day_bars(symbol, day):
    next_day = day + timedelta(days=1)
    cur.execute("""
        SELECT ts, o, h, l, c, volume FROM candles
        WHERE symbol=%s AND ts >= %s AND ts < %s AND timeframe='1m'
        ORDER BY ts
    """, (symbol, day, next_day))
    return cur.fetchall()

def compute_ema(prices, period):
    if len(prices) < period: return prices[:]
    k = 2 / (period + 1)
    ema = [sum(prices[:period]) / period]
    for p in prices[period:]:
        ema.append(p * k + ema[-1] * (1 - k))
    return [None] * (period - 1) + ema

def compute_atr(bars, i, period=14):
    start = max(0, i - period)
    ranges = [bars[j][2] - bars[j][3] for j in range(start, i + 1)]
    return sum(ranges) / len(ranges) if ranges else 5.0

def analyze_day_nq(symbol, day, bars):
    """NQ-specific strategy: VWAP Mean Reversion + ORB with tight stop."""
    if len(bars) < 100: return []

    closes = [b[4] for b in bars]
    or_high = max(b[2] for b in bars[:30])
    or_low = min(b[3] for b in bars[:30])
    or_range = or_high - or_low

    # VWAP
    cum_pv, cum_v = 0, 0
    vwaps = []
    for b in bars:
        tp = (b[2] + b[3] + b[4]) / 3
        cum_pv += tp * b[5]; cum_v += b[5]
        vwaps.append(cum_pv / cum_v if cum_v > 0 else tp)

    ema9 = compute_ema(closes, 9)
    ema21 = compute_ema(closes, 21)

    trades = []

    # --- Strategy 1: VWAP Mean Reversion (primary NQ signal) ---
    # Parameters: ATR threshold 1.0, target 1R, max bar 120, require reversal bar
    traded_vwap_long = False
    traded_vwap_short = False
    for i in range(30, min(len(bars) - 20, 120)):
        atr_val = compute_atr(bars, i)
        price = bars[i][4]
        vwap = vwaps[i]

        # SHORT: price > VWAP + 1.0*ATR and reversal bar (close < prev bar low)
        if not traded_vwap_short and price > vwap + 1.0 * atr_val:
            if bars[i][4] < bars[i-1][3]:  # reversal bar
                entry = price
                stop = max(bars[m][2] for m in range(max(0, i-5), i+1)) + 0.50
                risk = stop - entry
                if risk < 2 or risk > 60:
                    continue
                target = entry - risk * 1.0  # 1R target

                result = 'TIMEOUT'; pnl = 0
                for j in range(i+1, min(i + 150, len(bars))):
                    if bars[j][2] >= stop:
                        result = 'LOSS'; pnl = -(stop - entry); break
                    if bars[j][3] <= target:
                        result = 'WIN'; pnl = entry - target; break
                if result == 'TIMEOUT':
                    pnl = entry - bars[min(i + 150, len(bars) - 1)][4]

                trades.append({
                    'dir': 'SHORT', 'entry': round(entry, 2), 'stop': round(stop, 2),
                    'target': round(target, 2), 'result': result, 'pnl': round(pnl, 2),
                    'conf': 'VWAP_MR', 'session': 'NY_OPEN' if i < 60 else 'MIDDAY',
                    'type': 'VWAP_MR'
                })
                traded_vwap_short = True

        # LONG: price < VWAP - 1.0*ATR and reversal bar (close > prev bar high)
        if not traded_vwap_long and price < vwap - 1.0 * atr_val:
            if bars[i][4] > bars[i-1][2]:  # reversal bar
                entry = price
                stop = min(bars[m][3] for m in range(max(0, i-5), i+1)) - 0.50
                risk = entry - stop
                if risk < 2 or risk > 60:
                    continue
                target = entry + risk * 1.0

                result = 'TIMEOUT'; pnl = 0
                for j in range(i+1, min(i + 150, len(bars))):
                    if bars[j][3] <= stop:
                        result = 'LOSS'; pnl = -(entry - stop); break
                    if bars[j][2] >= target:
                        result = 'WIN'; pnl = target - entry; break
                if result == 'TIMEOUT':
                    pnl = bars[min(i + 150, len(bars) - 1)][4] - entry

                trades.append({
                    'dir': 'LONG', 'entry': round(entry, 2), 'stop': round(stop, 2),
                    'target': round(target, 2), 'result': result, 'pnl': round(pnl, 2),
                    'conf': 'VWAP_MR', 'session': 'NY_OPEN' if i < 60 else 'MIDDAY',
                    'type': 'VWAP_MR'
                })
                traded_vwap_long = True

    # --- Strategy 2: ORB with 0.5x OR stop, RR 2.0 (secondary NQ signal) ---
    for i in range(30, min(len(bars) - 20, 120)):
        bar = bars[i]
        price = bar[4]
        vwap = vwaps[i]
        e9 = ema9[i] if i < len(ema9) and ema9[i] else price
        e21 = ema21[i] if i < len(ema21) and ema21[i] else price
        avg_vol = sum(b[5] for b in bars[max(0,i-20):i]) / min(20, i) if i > 0 else bar[5]

        # LONG breakout
        if bar[2] > or_high and not any(t['dir'] == 'LONG' and t.get('type') == 'ORB' for t in trades):
            conf = 0
            if price > vwap: conf += 1
            if e9 > e21: conf += 1
            if bar[5] > avg_vol * 1.2: conf += 1

            if conf >= 2:
                stop = price - or_range * 0.50  # 0.5x OR range stop
                risk = price - stop
                if risk < 3 or risk > 80: continue
                target = price + risk * 2.0

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 200, len(bars))):
                    if bars[j][3] <= stop:
                        result = 'LOSS'; pnl = -(price - stop); break
                    if bars[j][2] >= target:
                        result = 'WIN'; pnl = target - price; break
                if result == 'TIMEOUT':
                    pnl = bars[min(i+200, len(bars)-1)][4] - price

                trades.append({
                    'dir': 'LONG', 'entry': round(price, 2), 'stop': round(stop, 2),
                    'target': round(target, 2), 'result': result, 'pnl': round(pnl, 2),
                    'conf': conf, 'session': 'NY_OPEN' if i < 60 else 'MIDDAY',
                    'type': 'ORB'
                })
                break

        # SHORT breakout
        if bar[3] < or_low and not any(t['dir'] == 'SHORT' and t.get('type') == 'ORB' for t in trades):
            conf = 0
            if price < vwap: conf += 1
            if e9 < e21: conf += 1
            if bar[5] > avg_vol * 1.2: conf += 1

            if conf >= 2:
                stop = price + or_range * 0.50
                risk = stop - price
                if risk < 3 or risk > 80: continue
                target = price - risk * 2.0

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 200, len(bars))):
                    if bars[j][2] >= stop:
                        result = 'LOSS'; pnl = -(stop - price); break
                    if bars[j][3] <= target:
                        result = 'WIN'; pnl = price - target; break
                if result == 'TIMEOUT':
                    pnl = price - bars[min(i+200, len(bars)-1)][4]

                trades.append({
                    'dir': 'SHORT', 'entry': round(price, 2), 'stop': round(stop, 2),
                    'target': round(target, 2), 'result': result, 'pnl': round(pnl, 2),
                    'conf': conf, 'session': 'NY_OPEN' if i < 60 else 'MIDDAY',
                    'type': 'ORB'
                })
                break

    return trades


def analyze_day_es(symbol, day, bars):
    """ES strategy: OR Breakout with 0.5x OR stop (proven PF 1.84+)."""
    if len(bars) < 100: return []

    closes = [b[4] for b in bars]
    or_high = max(b[2] for b in bars[:30])
    or_low = min(b[3] for b in bars[:30])
    or_range = or_high - or_low

    cum_pv, cum_v = 0, 0
    vwaps = []
    for b in bars:
        tp = (b[2] + b[3] + b[4]) / 3
        cum_pv += tp * b[5]; cum_v += b[5]
        vwaps.append(cum_pv / cum_v if cum_v > 0 else tp)

    ema9 = compute_ema(closes, 9)
    ema21 = compute_ema(closes, 21)

    trades = []

    for i in range(30, min(len(bars) - 20, 120)):
        bar = bars[i]
        price = bar[4]
        vwap = vwaps[i]
        e9 = ema9[i] if i < len(ema9) and ema9[i] else price
        e21 = ema21[i] if i < len(ema21) and ema21[i] else price
        avg_vol = sum(b[5] for b in bars[max(0,i-20):i]) / min(20, i) if i > 0 else bar[5]

        # LONG breakout
        if bar[2] > or_high and not any(t['dir'] == 'LONG' for t in trades):
            conf = 0
            if price > vwap: conf += 1
            if e9 > e21: conf += 1
            if bar[5] > avg_vol * 1.2: conf += 1

            if conf >= 2:
                stop = price - or_range * 0.50  # 0.5x OR stop for ES too
                risk = price - stop
                if risk < 3 or risk > 80: continue
                target = price + risk * 2

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 200, len(bars))):
                    if bars[j][3] <= stop:
                        result = 'LOSS'; pnl = -(price - stop); break
                    if bars[j][2] >= target:
                        result = 'WIN'; pnl = target - price; break
                if result == 'TIMEOUT':
                    pnl = bars[min(i+200, len(bars)-1)][4] - price

                trades.append({
                    'dir': 'LONG', 'entry': round(price, 2), 'stop': round(stop, 2),
                    'target': round(target, 2), 'result': result, 'pnl': round(pnl, 2),
                    'conf': conf, 'session': 'NY_OPEN' if i < 60 else 'MIDDAY'
                })
                break

        # SHORT breakout
        if bar[3] < or_low and not any(t['dir'] == 'SHORT' for t in trades):
            conf = 0
            if price < vwap: conf += 1
            if e9 < e21: conf += 1
            if bar[5] > avg_vol * 1.2: conf += 1

            if conf >= 2:
                stop = price + or_range * 0.50
                risk = stop - price
                if risk < 3 or risk > 80: continue
                target = price - risk * 2

                result = 'TIMEOUT'; pnl = 0
                for j in range(i, min(i + 200, len(bars))):
                    if bars[j][2] >= stop:
                        result = 'LOSS'; pnl = -(stop - price); break
                    if bars[j][3] <= target:
                        result = 'WIN'; pnl = price - target; break
                if result == 'TIMEOUT':
                    pnl = price - bars[min(i+200, len(bars)-1)][4]

                trades.append({
                    'dir': 'SHORT', 'entry': round(price, 2), 'stop': round(stop, 2),
                    'target': round(target, 2), 'result': result, 'pnl': round(pnl, 2),
                    'conf': conf, 'session': 'NY_OPEN' if i < 60 else 'MIDDAY'
                })
                break

    return trades

# Run for both symbols
for symbol in ['NQM6', 'ESM6']:
    tick_val = 5.0 if 'NQ' in symbol else 12.5
    is_nq = 'NQ' in symbol

    print(f"\n{'='*80}")
    print(f"  ARCTIS ENGINE AUDIT v2 -- {symbol} -- MARCH 2026")
    if is_nq:
        print(f"  Strategy: VWAP Mean Reversion (primary) + ORB 0.5x-OR-stop RR2.0 (secondary)")
    else:
        print(f"  Strategy: ORB 0.5x-OR-stop RR2.0")
    print(f"{'='*80}")
    print(f"{'Date':<12} {'Type':<8} {'Dir':<6} {'Entry':>10} {'Stop':>10} {'Target':>10} {'Result':<8} {'P&L':>8} {'Conf':<8} {'Session':<10}")
    print("-" * 80)

    all_trades = []
    for day in days:
        bars = get_day_bars(symbol, day)
        if is_nq:
            trades = analyze_day_nq(symbol, day, bars)
        else:
            trades = analyze_day_es(symbol, day, bars)

        if trades:
            for t in trades:
                sig_type = t.get('type', 'ORB')
                conf_str = str(t['conf'])
                print(f"{str(day):<12} {sig_type:<8} {t['dir']:<6} {t['entry']:>10.2f} {t['stop']:>10.2f} {t['target']:>10.2f} {t['result']:<8} {t['pnl']:>+8.2f} {conf_str:<8} {t['session']:<10}")
                all_trades.append(t)
        else:
            print(f"{str(day):<12} {'---':<8} {'---':<6} {'no signal':>10}")

    wins = [t for t in all_trades if t['result'] == 'WIN']
    losses = [t for t in all_trades if t['result'] == 'LOSS']
    timeouts = [t for t in all_trades if t['result'] == 'TIMEOUT']
    total = len(all_trades)
    wr = len(wins) / total * 100 if total > 0 else 0
    avg_win = sum(t['pnl'] for t in wins) / len(wins) if wins else 0
    avg_loss = abs(sum(t['pnl'] for t in losses) / len(losses)) if losses else 0
    gross_win = sum(t['pnl'] for t in wins) + sum(max(0, t['pnl']) for t in timeouts)
    gross_loss = abs(sum(t['pnl'] for t in losses)) + abs(sum(min(0, t['pnl']) for t in timeouts))
    pf = gross_win / gross_loss if gross_loss > 0 else float('inf')
    total_pnl = sum(t['pnl'] for t in all_trades)
    dollar_pnl = total_pnl / 0.25 * tick_val

    print("-" * 80)
    print(f"  SUMMARY: {total} trades | {len(wins)} wins ({wr:.1f}%) | {len(losses)} losses | {len(timeouts)} timeouts")
    print(f"  Avg Win: {avg_win:+.2f}pt | Avg Loss: {avg_loss:.2f}pt | PF: {pf:.2f}")
    print(f"  Total P&L: {total_pnl:+.2f}pt ({dollar_pnl:+,.0f} USD)")

    # Break down by type for NQ
    if is_nq:
        for sig_type in ['VWAP_MR', 'ORB']:
            type_trades = [t for t in all_trades if t.get('type') == sig_type]
            if type_trades:
                tw = [t for t in type_trades if t['result'] == 'WIN']
                tl = [t for t in type_trades if t['result'] == 'LOSS']
                tt = [t for t in type_trades if t['result'] == 'TIMEOUT']
                tn = len(type_trades)
                twr = len(tw) / tn * 100 if tn else 0
                tpnl = sum(t['pnl'] for t in type_trades)
                tgw = sum(t['pnl'] for t in tw) + sum(max(0, t['pnl']) for t in tt)
                tgl = abs(sum(t['pnl'] for t in tl)) + abs(sum(min(0, t['pnl']) for t in tt))
                tpf = tgw / tgl if tgl > 0 else 999
                print(f"    {sig_type}: {tn} trades, {len(tw)}W/{len(tl)}L/{len(tt)}T, WR {twr:.1f}%, PF {tpf:.2f}, P&L {tpnl:+.2f}pt")

print(f"\n{'='*80}")
print("  REPORT GENERATED BY ARCTIS ENGINE AUDIT v2.0")
print(f"{'='*80}")

conn.close()

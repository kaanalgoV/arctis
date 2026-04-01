#!/usr/bin/env python3
"""Verify v6 production engine changes against backtest configs."""

import sys, os
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8')

import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect('postgres://algorivo:algorivo_dev@localhost:5532/algorivo')

def get_bars(symbol, day):
    cur = conn.cursor()
    next_day = day + timedelta(days=1)
    cur.execute("""
        SELECT ts, o, h, l, c, volume FROM candles
        WHERE symbol=%s AND ts >= %s AND ts < %s AND timeframe='1m'
        ORDER BY ts
    """, (symbol, day, next_day))
    return cur.fetchall()

def get_trading_days(symbol):
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol=%s ORDER BY ts::date", (symbol,))
    return [r[0] for r in cur.fetchall()]

def compute_vwap(bars):
    cum_vol = 0; cum_pv = 0; vwaps = []
    for b in bars:
        typical = (b[2] + b[3] + b[4]) / 3
        vol = b[5]; cum_vol += vol; cum_pv += typical * vol
        vwaps.append(cum_pv / cum_vol if cum_vol > 0 else typical)
    return vwaps

def compute_ema(prices, period):
    if len(prices) < period: return prices[:]
    k = 2 / (period + 1)
    ema = [sum(prices[:period]) / period]
    for p in prices[period:]:
        ema.append(p * k + ema[-1] * (1 - k))
    return [None] * (period - 1) + ema

def _check_trade(bars, direction, entry, stop, target, max_bars):
    for i, bar in enumerate(bars[:max_bars]):
        if direction == 'LONG':
            if bar[3] <= stop: return {'result': 'LOSS', 'pnl': round(stop - entry, 2), 'bars_held': i}
            if bar[2] >= target: return {'result': 'WIN', 'pnl': round(target - entry, 2), 'bars_held': i}
        else:
            if bar[2] >= stop: return {'result': 'LOSS', 'pnl': round(entry - stop, 2), 'bars_held': i}
            if bar[3] <= target: return {'result': 'WIN', 'pnl': round(entry - target, 2), 'bars_held': i}
    return {'result': 'TIMEOUT', 'pnl': round(bars[-1][4] - entry if direction == 'LONG' else entry - bars[-1][4], 2) if bars else 0, 'bars_held': min(max_bars, len(bars))}

def analyze_day(symbol, day, bars, config):
    if len(bars) < 100: return []
    closes = [b[4] for b in bars]
    or_minutes = config['or_minutes']
    or_bars = bars[:or_minutes]
    or_high = max(b[2] for b in or_bars)
    or_low = min(b[3] for b in or_bars)
    or_range = or_high - or_low
    if or_range < config['min_or_range'] or or_range > config['max_or_range']:
        return []
    vwaps = compute_vwap(bars)
    ema9 = compute_ema(closes, 9)
    ema21 = compute_ema(closes, 21)
    trades = []
    for i in range(or_minutes, min(len(bars) - 30, config['max_entry_bar'])):
        bar = bars[i]; price = bar[4]
        avg_vol = sum(b[5] for b in bars[max(0,i-20):i]) / min(20, i) if i > 0 else bar[5]
        if bar[5] < avg_vol * config['min_rvol']: continue
        vwap = vwaps[i] if i < len(vwaps) else price
        e9 = ema9[i] if i < len(ema9) and ema9[i] else price
        e21 = ema21[i] if i < len(ema21) and ema21[i] else price

        if bar[2] > or_high and not any(t['dir'] == 'LONG' for t in trades):
            confluence = 0
            if price > vwap: confluence += 1
            if e9 > e21: confluence += 1
            if bar[5] > avg_vol * 1.2: confluence += 1
            if price > or_high + or_range * 0.1: confluence += 1
            if confluence >= config['min_confluence']:
                stop = or_low if config['stop_at_or'] else max(or_low, price - or_range * config['stop_mult'])
                risk = price - stop
                if risk < config['min_risk'] or risk > config['max_risk']: continue
                target = price + risk * config['rr_target']
                result = _check_trade(bars[i:], 'LONG', price, stop, target, config['max_hold_bars'])
                trades.append({'day': str(day), 'dir': 'LONG', 'entry': round(price, 2),
                    'stop': round(stop, 2), 'target': round(target, 2), 'confluence': confluence, **result})
                break

        if bar[3] < or_low and not any(t['dir'] == 'SHORT' for t in trades):
            confluence = 0
            if price < vwap: confluence += 1
            if e9 < e21: confluence += 1
            if bar[5] > avg_vol * 1.2: confluence += 1
            if price < or_low - or_range * 0.1: confluence += 1
            if confluence >= config['min_confluence']:
                stop = or_high if config['stop_at_or'] else min(or_high, price + or_range * config['stop_mult'])
                risk = stop - price
                if risk < config['min_risk'] or risk > config['max_risk']: continue
                target = price - risk * config['rr_target']
                result = _check_trade(bars[i:], 'SHORT', price, stop, target, config['max_hold_bars'])
                trades.append({'day': str(day), 'dir': 'SHORT', 'entry': round(price, 2),
                    'stop': round(stop, 2), 'target': round(target, 2), 'confluence': confluence, **result})
                break
    return trades

def run_backtest(symbol, config, days=None):
    if days is None: days = get_trading_days(symbol)
    all_trades = []
    for day in days:
        bars = get_bars(symbol, day)
        all_trades.extend(analyze_day(symbol, day, bars, config))
    wins = [t for t in all_trades if t['result'] == 'WIN']
    losses = [t for t in all_trades if t['result'] == 'LOSS']
    timeouts = [t for t in all_trades if t['result'] == 'TIMEOUT']
    total = len(all_trades)
    wr = len(wins) / total * 100 if total > 0 else 0
    avg_win = sum(t['pnl'] for t in wins) / len(wins) if wins else 0
    avg_loss = abs(sum(t['pnl'] for t in losses) / len(losses)) if losses else 0
    pf = (avg_win * len(wins)) / (avg_loss * len(losses)) if losses and avg_loss > 0 else float('inf')
    total_pnl = sum(t['pnl'] for t in all_trades)
    return {
        'total': total, 'wins': len(wins), 'losses': len(losses), 'timeouts': len(timeouts),
        'wr': round(wr, 1), 'avg_win': round(avg_win, 2), 'avg_loss': round(avg_loss, 2),
        'pf': round(pf, 2), 'pnl': round(total_pnl, 2), 'trades': all_trades
    }

# ============================================================
# VERIFICATION: Compare v5 (before) vs v6 (after) changes
# ============================================================

print("=" * 60)
print("  ARCTIS v6 VERIFICATION")
print("  Comparing old (v5) vs new (v6) production parameters")
print("=" * 60)

# v5 = old production (RVOL 0.5, NY Open conf=1)
v5_config = {
    'or_minutes': 30, 'min_or_range': 8, 'max_or_range': 150,
    'min_confluence': 1, 'rr_target': 2.0, 'stop_at_or': True, 'stop_mult': 1.0,
    'min_rvol': 0.5, 'max_entry_bar': 200, 'max_hold_bars': 200,
    'min_risk': 5, 'max_risk': 80,
}

# v6 = new production (RVOL 0.7, conf=2, max_entry=150)
v6_config = {
    'or_minutes': 30, 'min_or_range': 8, 'max_or_range': 150,
    'min_confluence': 2, 'rr_target': 2.0, 'stop_at_or': True, 'stop_mult': 1.0,
    'min_rvol': 0.7, 'max_entry_bar': 150, 'max_hold_bars': 150,
    'min_risk': 5, 'max_risk': 80,
}

for symbol in ['NQM6', 'ESM6']:
    tick_val = 5.0 if 'NQ' in symbol else 12.5

    print(f"\n{'='*60}")
    print(f"  {symbol}")
    print(f"{'='*60}")

    old = run_backtest(symbol, v5_config)
    new = run_backtest(symbol, v6_config)

    old_dollar = old['pnl'] / 0.25 * tick_val
    new_dollar = new['pnl'] / 0.25 * tick_val

    print(f"\n  v5 (OLD): {old['total']} trades | WR {old['wr']}% | PF {old['pf']} | P&L {old['pnl']:+.2f}pt ({old_dollar:+.0f} USD)")
    print(f"    Wins: {old['wins']} | Losses: {old['losses']} | Timeouts: {old['timeouts']}")
    print(f"    Avg Win: {old['avg_win']}pt | Avg Loss: {old['avg_loss']}pt")

    print(f"\n  v6 (NEW): {new['total']} trades | WR {new['wr']}% | PF {new['pf']} | P&L {new['pnl']:+.2f}pt ({new_dollar:+.0f} USD)")
    print(f"    Wins: {new['wins']} | Losses: {new['losses']} | Timeouts: {new['timeouts']}")
    print(f"    Avg Win: {new['avg_win']}pt | Avg Loss: {new['avg_loss']}pt")

    # Delta
    pf_delta = new['pf'] - old['pf']
    wr_delta = new['wr'] - old['wr']
    pnl_delta = new['pnl'] - old['pnl']
    dollar_delta = new_dollar - old_dollar

    print(f"\n  DELTA: PF {pf_delta:+.2f} | WR {wr_delta:+.1f}% | P&L {pnl_delta:+.2f}pt ({dollar_delta:+.0f} USD)")

    # Show eliminated trades (in v5 but not v6)
    old_days = {t['day'] for t in old['trades']}
    new_days = {t['day'] for t in new['trades']}
    eliminated = old_days - new_days
    if eliminated:
        print(f"\n  Eliminated {len(eliminated)} trade-days:")
        for day in sorted(eliminated):
            t = [x for x in old['trades'] if x['day'] == day][0]
            print(f"    {day} {t['dir']} conf={t['confluence']} -> {t['result']} ({t['pnl']:+.2f}pt)")

    # Show individual v6 trades
    print(f"\n  v6 trades:")
    for t in new['trades']:
        print(f"    {t['day']} {t['dir']} entry={t['entry']} conf={t['confluence']} -> {t['result']} ({t['pnl']:+.2f}pt, {t['bars_held']} bars)")

print(f"\n{'='*60}")
print("  CONCLUSION")
print(f"{'='*60}")

conn.close()

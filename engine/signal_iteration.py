"""Phase 3: Signal Quality Iteration — Multi-config backtest on real data.

Tests 5 configurations against NQM6/ESM6 1-minute bars from TimescaleDB.
v2: Fixed breakout detection (removed prior-bar-inside constraint that was too strict).
"""

import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect('postgres://algorivo:algorivo_dev@localhost:5532/algorivo')
cur = conn.cursor()

cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='NQM6' ORDER BY ts::date")
nq_days = [r[0] for r in cur.fetchall()]
cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='ESM6' ORDER BY ts::date")
es_days = [r[0] for r in cur.fetchall()]
print(f"NQ days: {len(nq_days)}, ES days: {len(es_days)}")

# Debug: check OR ranges
cur.execute("""
    SELECT ts::date, symbol,
           MAX(h) FILTER (WHERE rn <= 30) as or_h,
           MIN(l) FILTER (WHERE rn <= 30) as or_l
    FROM (
        SELECT ts, symbol, h, l,
               ROW_NUMBER() OVER (PARTITION BY ts::date, symbol ORDER BY ts) as rn
        FROM candles WHERE symbol IN ('NQM6','ESM6') AND timeframe='1m'
    ) sub
    GROUP BY ts::date, symbol
    ORDER BY ts::date, symbol
""")
print("\nOR Ranges per day:")
for r in cur.fetchall():
    rng = r[2] - r[3] if r[2] and r[3] else 0
    print(f"  {r[0]} {r[1]}: OR_H={r[2]:.2f} OR_L={r[3]:.2f} Range={rng:.2f}")

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

# Test multiple configurations
configs = [
    {'name': 'v7_baseline',     'min_conf': 2, 'rr': 2.0, 'rvol': 0.7, 'max_bar': 90,  'or_filter_nq': 35,  'or_filter_es': 999, 'stop_mode': 'or'},
    {'name': 'v8_strict',       'min_conf': 3, 'rr': 2.0, 'rvol': 0.8, 'max_bar': 90,  'or_filter_nq': 30,  'or_filter_es': 40,  'stop_mode': 'or'},
    {'name': 'v8_tight_rr',     'min_conf': 2, 'rr': 1.5, 'rvol': 0.7, 'max_bar': 90,  'or_filter_nq': 35,  'or_filter_es': 999, 'stop_mode': 'or'},
    {'name': 'v8_atr_stop',     'min_conf': 2, 'rr': 2.0, 'rvol': 0.7, 'max_bar': 90,  'or_filter_nq': 50,  'or_filter_es': 999, 'stop_mode': 'atr'},
    {'name': 'v8_wide_or',      'min_conf': 2, 'rr': 2.0, 'rvol': 0.6, 'max_bar': 120, 'or_filter_nq': 80,  'or_filter_es': 999, 'stop_mode': 'or'},
    {'name': 'v8_half_or_stop', 'min_conf': 2, 'rr': 2.0, 'rvol': 0.7, 'max_bar': 90,  'or_filter_nq': 50,  'or_filter_es': 999, 'stop_mode': 'half_or'},
    {'name': 'v8_no_conf',      'min_conf': 0, 'rr': 2.0, 'rvol': 0.5, 'max_bar': 120, 'or_filter_nq': 100, 'or_filter_es': 999, 'stop_mode': 'or'},
]

print()
print(f"{'Config':<20} {'Sym':<6} {'Trades':>6} {'WR':>6} {'PF':>7} {'P&L':>10} {'AvgW':>7} {'AvgL':>7} {'TO':>3}")
print("-" * 80)

best_results = {}

for cfg in configs:
    for symbol in ['NQM6', 'ESM6']:
        days_list = nq_days if 'NQ' in symbol else es_days
        or_filter = cfg['or_filter_nq'] if 'NQ' in symbol else cfg['or_filter_es']
        all_trades = []

        for day in days_list:
            bars = get_bars(symbol, day)
            if len(bars) < 60:
                continue
            closes = [b[4] for b in bars]
            # OR from first 30 bars
            or_bars = bars[:min(30, len(bars))]
            or_h = max(b[2] for b in or_bars)
            or_l = min(b[3] for b in or_bars)
            or_range = or_h - or_l

            if or_range > or_filter or or_range < 1:
                continue

            ema9 = compute_ema(closes, 9)
            ema21 = compute_ema(closes, 21)
            cum_pv = cum_v = 0
            vwaps = []
            for b in bars:
                tp = (b[2] + b[3] + b[4]) / 3
                cum_pv += tp * b[5]
                cum_v += b[5]
                vwaps.append(cum_pv / cum_v if cum_v > 0 else tp)

            # ATR from OR period
            atr = sum(b[2] - b[3] for b in or_bars) / len(or_bars) if or_bars else 5

            traded_dirs = set()
            for i in range(30, min(len(bars) - 20, cfg['max_bar'])):
                bar = bars[i]
                price = bar[4]
                avg_vol = sum(b[5] for b in bars[max(0, i - 20):i]) / min(20, max(i, 1))
                if avg_vol > 0 and cfg['rvol'] > 0 and bar[5] < avg_vol * cfg['rvol']:
                    continue

                # Breakout detection: close beyond OR level
                direction = None
                if price > or_h:
                    direction = 'LONG'
                elif price < or_l:
                    direction = 'SHORT'
                if not direction:
                    continue
                if direction in traded_dirs:
                    continue

                # Confluence
                conf = 0
                if price > vwaps[i]: conf += 1 if direction == 'LONG' else 0
                if price < vwaps[i]: conf += 1 if direction == 'SHORT' else 0
                if ema9[i] is not None and ema21[i] is not None:
                    if direction == 'LONG' and ema9[i] > ema21[i]: conf += 1
                    if direction == 'SHORT' and ema9[i] < ema21[i]: conf += 1
                if avg_vol > 0 and bar[5] > avg_vol * 1.2: conf += 1

                if conf < cfg['min_conf']:
                    continue

                # Stop calculation
                if cfg['stop_mode'] == 'atr':
                    stop_dist = atr * 1.0
                elif cfg['stop_mode'] == 'half_or':
                    stop_dist = or_range * 0.5
                else:  # 'or' = full OR stop
                    stop_dist = or_range

                if direction == 'LONG':
                    stop = price - stop_dist
                else:
                    stop = price + stop_dist

                risk = stop_dist
                if risk < 1 or risk > 100:
                    continue
                target = price + risk * cfg['rr'] if direction == 'LONG' else price - risk * cfg['rr']

                result = 'TIMEOUT'
                pnl = 0
                exit_bar = None
                for j, check in enumerate(bars[i:i + 200]):
                    if direction == 'LONG':
                        if check[3] <= stop:
                            result = 'LOSS'
                            pnl = -risk
                            exit_bar = j
                            break
                        if check[2] >= target:
                            result = 'WIN'
                            pnl = risk * cfg['rr']
                            exit_bar = j
                            break
                    else:
                        if check[2] >= stop:
                            result = 'LOSS'
                            pnl = -risk
                            exit_bar = j
                            break
                        if check[3] <= target:
                            result = 'WIN'
                            pnl = risk * cfg['rr']
                            exit_bar = j
                            break

                traded_dirs.add(direction)
                all_trades.append({
                    'day': str(day), 'dir': direction, 'result': result,
                    'pnl': round(pnl, 2), 'conf': conf, 'exit_bar': exit_bar,
                    'or_range': round(or_range, 2), 'risk': round(risk, 2),
                    'entry': round(price, 2)
                })

        wins = len([t for t in all_trades if t['result'] == 'WIN'])
        losses_list = [t for t in all_trades if t['result'] == 'LOSS']
        timeouts = len([t for t in all_trades if t['result'] == 'TIMEOUT'])
        total = len(all_trades)
        wr = wins / total * 100 if total > 0 else 0
        total_pnl = sum(t['pnl'] for t in all_trades)
        avg_w = sum(t['pnl'] for t in all_trades if t['result'] == 'WIN') / max(wins, 1)
        avg_l = abs(sum(t['pnl'] for t in losses_list) / max(len(losses_list), 1))
        pf = (avg_w * wins) / (avg_l * len(losses_list)) if losses_list and avg_l > 0 else float('inf')

        key = f"{cfg['name']}_{symbol}"
        best_results[key] = {'wr': wr, 'pf': pf, 'pnl': total_pnl, 'trades': total, 'cfg': cfg}

        print(f"{cfg['name']:<20} {symbol:<6} {total:>6} {wr:>5.1f}% {pf:>6.2f} {total_pnl:>+9.2f}pt {avg_w:>6.1f} {avg_l:>6.1f} {timeouts:>3}")

        # Show individual trades for notable configs
        if cfg['name'] in ('v7_baseline', 'v8_atr_stop', 'v8_half_or_stop') and all_trades:
            for t in all_trades:
                print(f"    {t['day']} {t['dir']:<5} {t['result']:<7} P&L={t['pnl']:>+7.2f} conf={t['conf']} OR={t['or_range']} risk={t['risk']} entry={t['entry']}")

# Summary
print("\n" + "=" * 80)
print("RANKING (by PF where trades >= 3):")
ranked = [(k, v) for k, v in best_results.items() if v['trades'] >= 3]
ranked.sort(key=lambda x: x[1]['pf'], reverse=True)
for i, (k, v) in enumerate(ranked[:10], 1):
    print(f"  {i}. {k:<35} PF={v['pf']:>6.2f} WR={v['wr']:>5.1f}% trades={v['trades']:>3} P&L={v['pnl']:>+8.2f}")

conn.close()

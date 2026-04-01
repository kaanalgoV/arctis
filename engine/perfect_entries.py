#!/usr/bin/env python3
"""Perfect Entries Audit — Day-by-day analysis of BEST possible trade vs ENGINE signal.

For EACH March 2026 trading day, for BOTH NQ and ES:
1. Loads 1-min bars (RTH only: 09:30-16:00 ET)
2. Computes VWAP, EMA9, EMA21, OR high/low, PDH/PDL, ATR, RSI
3. Finds the BEST possible trade (hindsight-optimal)
4. Finds what the ENGINE would have signaled
5. Compares: did the engine find the right trade?
6. Prints detailed indicator state at entry
"""
import psycopg2
from datetime import datetime, timedelta, date
import sys
import math
import io

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

conn = psycopg2.connect('postgres://algorivo:algorivo_dev@localhost:5532/algorivo')
cur = conn.cursor()

# ─── Helper functions ────────────────────────────────────────────────────────

def get_day_bars(symbol, day):
    """Get RTH bars (09:30-16:00 ET) for a given day."""
    next_day = day + timedelta(days=1)
    cur.execute("""
        SELECT ts, o, h, l, c, volume FROM candles
        WHERE symbol=%s AND ts >= %s AND ts < %s AND timeframe='1m'
        ORDER BY ts
    """, (symbol, day, next_day))
    return cur.fetchall()

def get_prev_day_bars(symbol, day):
    """Get previous trading day bars."""
    cur.execute("""
        SELECT DISTINCT ts::date FROM candles
        WHERE symbol=%s AND ts::date < %s AND timeframe='1m'
        ORDER BY ts::date DESC LIMIT 1
    """, (symbol, day))
    row = cur.fetchone()
    if not row:
        return []
    return get_day_bars(symbol, row[0])

def compute_ema(prices, period):
    if len(prices) < period:
        return [None] * len(prices)
    k = 2.0 / (period + 1)
    ema = [sum(prices[:period]) / period]
    for p in prices[period:]:
        ema.append(p * k + ema[-1] * (1 - k))
    return [None] * (period - 1) + ema

def compute_rsi(closes, period=14):
    """Standard Wilder RSI calculation."""
    if len(closes) < period + 1:
        return [None] * len(closes)
    gains = []
    losses = []
    for i in range(1, len(closes)):
        ch = closes[i] - closes[i-1]
        gains.append(max(0, ch))
        losses.append(max(0, -ch))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    rsi_vals = [None] * period
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        if avg_loss == 0:
            rsi_vals.append(100.0)
        else:
            rs = avg_gain / avg_loss
            rsi_vals.append(round(100 - 100 / (1 + rs), 1))
    return rsi_vals

def compute_atr(bars, idx, period=14):
    start = max(0, idx - period)
    ranges = [bars[j][2] - bars[j][3] for j in range(start, idx + 1)]
    return sum(ranges) / len(ranges) if ranges else 5.0

def compute_vwap(bars):
    """VWAP from cumulative TP*V / V."""
    cum_pv, cum_v = 0.0, 0.0
    vwaps = []
    for b in bars:
        tp = (b[2] + b[3] + b[4]) / 3.0
        cum_pv += tp * b[5]
        cum_v += b[5]
        vwaps.append(cum_pv / cum_v if cum_v > 0 else tp)
    return vwaps

def simulate_trade(bars, entry_idx, direction, entry_price, stop_price, target_price, max_bars=200):
    """Simulate a trade forward from entry_idx. Returns (result, pnl, exit_idx)."""
    for j in range(entry_idx + 1, min(entry_idx + max_bars, len(bars))):
        if direction == 'LONG':
            if bars[j][3] <= stop_price:
                return 'LOSS', -(entry_price - stop_price), j
            if bars[j][2] >= target_price:
                return 'WIN', target_price - entry_price, j
        else:
            if bars[j][2] >= stop_price:
                return 'LOSS', -(stop_price - entry_price), j
            if bars[j][3] <= target_price:
                return 'WIN', entry_price - target_price, j
    # Timeout — use last bar close
    last_idx = min(entry_idx + max_bars, len(bars) - 1)
    if direction == 'LONG':
        pnl = bars[last_idx][4] - entry_price
    else:
        pnl = entry_price - bars[last_idx][4]
    return 'TIMEOUT', pnl, last_idx

# ─── Best Trade Finder (Hindsight Optimal) ──────────────────────────────────

def find_best_trade(bars, or_high, or_low, vwaps, ema9, ema21, prev_high, prev_low):
    """Find the best possible trade for the day using hindsight.

    Strategies scanned:
    1. OR Breakout (long above OR high, short below OR low)
    2. VWAP Mean Reversion (price far from VWAP, reversal bar)
    3. PDH/PDL Breakout
    4. Trend continuation after pullback to EMA/VWAP
    """
    if len(bars) < 50:
        return None

    or_range = or_high - or_low
    best_trade = None
    best_rr_achieved = 0

    closes = [b[4] for b in bars]

    # Scan every bar from 3 to len-20 for potential entries
    for i in range(3, min(len(bars) - 20, 200)):
        price = bars[i][4]
        vwap = vwaps[i] if i < len(vwaps) else price
        atr = compute_atr(bars, i)
        e9 = ema9[i] if i < len(ema9) and ema9[i] is not None else price
        e21 = ema21[i] if i < len(ema21) and ema21[i] is not None else price
        avg_vol = sum(b[5] for b in bars[max(0, i-20):i]) / min(20, i) if i > 0 else bars[i][5]
        rvol = bars[i][5] / avg_vol if avg_vol > 0 else 1.0

        candidates = []

        # 1. OR Breakout Long
        if i >= 30 and i <= 120 and price > or_high and or_range > 0:
            if len(bars) >= 2 and bars[i-1][4] <= or_high * 1.001:
                stop = price - or_range * 0.5
                risk = price - stop
                if 2 <= risk <= 60:
                    target = price + risk * 2.0
                    candidates.append(('LONG', 'ORB', price, stop, target, risk, i))

        # 2. OR Breakout Short
        if i >= 30 and i <= 120 and price < or_low and or_range > 0:
            if len(bars) >= 2 and bars[i-1][4] >= or_low * 0.999:
                stop = price + or_range * 0.5
                risk = stop - price
                if 2 <= risk <= 60:
                    target = price - risk * 2.0
                    candidates.append(('SHORT', 'ORB', price, stop, target, risk, i))

        # 3. VWAP MR Long (price far below VWAP + reversal)
        if i >= 5 and price < vwap - atr * 1.0:
            if bars[i][4] > bars[i-1][2]:  # reversal bar
                stop = min(b[3] for b in bars[max(0, i-5):i+1]) - 0.50
                risk = price - stop
                if 2 <= risk <= 60:
                    target = price + risk * 1.0
                    candidates.append(('LONG', 'VWAP_MR', price, stop, target, risk, i))

        # 4. VWAP MR Short (price far above VWAP + reversal)
        if i >= 5 and price > vwap + atr * 1.0:
            if bars[i][4] < bars[i-1][3]:  # reversal bar
                stop = max(b[2] for b in bars[max(0, i-5):i+1]) + 0.50
                risk = stop - price
                if 2 <= risk <= 60:
                    target = price - risk * 1.0
                    candidates.append(('SHORT', 'VWAP_MR', price, stop, target, risk, i))

        # 5. PDH Breakout Long
        if prev_high and i >= 3 and price > prev_high and price > vwap:
            if len(bars) >= 2 and bars[i-1][4] <= prev_high * 1.001:
                stop_raw = min(b[3] for b in bars[max(0, i-10):i+1]) - 0.25
                risk = price - stop_raw
                if 2 <= risk <= 60:
                    target = price + risk * 2.0
                    candidates.append(('LONG', 'PDH_BO', price, stop_raw, target, risk, i))

        # 6. PDL Breakout Short
        if prev_low and i >= 3 and price < prev_low and price < vwap:
            if len(bars) >= 2 and bars[i-1][4] >= prev_low * 0.999:
                stop_raw = max(b[2] for b in bars[max(0, i-10):i+1]) + 0.25
                risk = stop_raw - price
                if 2 <= risk <= 60:
                    target = price - risk * 2.0
                    candidates.append(('SHORT', 'PDL_BO', price, stop_raw, target, risk, i))

        # Evaluate each candidate
        for direction, stype, entry, stop, target, risk, idx in candidates:
            result, pnl, exit_idx = simulate_trade(bars, idx, direction, entry, stop, target)
            rr_achieved = pnl / risk if risk > 0 else 0
            if rr_achieved > best_rr_achieved:
                best_rr_achieved = rr_achieved
                best_trade = {
                    'direction': direction,
                    'type': stype,
                    'entry': round(entry, 2),
                    'stop': round(stop, 2),
                    'target': round(target, 2),
                    'risk': round(risk, 2),
                    'result': result,
                    'pnl': round(pnl, 2),
                    'rr_achieved': round(rr_achieved, 2),
                    'entry_idx': idx,
                    'exit_idx': exit_idx,
                    'vwap_at_entry': round(vwap, 2),
                    'ema9_at_entry': round(e9, 2),
                    'ema21_at_entry': round(e21, 2),
                    'atr_at_entry': round(atr, 2),
                    'rvol': round(rvol, 2),
                }

    return best_trade


# ─── Engine Signal Simulation ────────────────────────────────────────────────

def simulate_engine_signals(bars, or_high, or_low, vwaps, ema9, ema21, prev_high, prev_low, market):
    """Simulate what the current engine (signals.py v8) would signal.

    Replicates the logic from arctis.analysis.signals.detect_signals exactly.
    """
    if len(bars) < 50:
        return []

    or_range = or_high - or_low
    closes = [b[4] for b in bars]
    is_nq = market == 'NQ'
    signals = []

    # Bias detection (simplified — same as engine)
    def get_bias(idx):
        if idx < 21:
            return 'RANGE'
        e9 = ema9[idx] if idx < len(ema9) and ema9[idx] else closes[idx]
        e21 = ema21[idx] if idx < len(ema21) and ema21[idx] else closes[idx]
        v = vwaps[idx] if idx < len(vwaps) else closes[idx]
        score = 0
        if e9 > e21: score += 1
        else: score -= 1
        if closes[idx] > v: score += 1
        else: score -= 1
        if idx >= 3 and closes[idx] > closes[idx-3]: score += 1
        elif idx >= 3: score -= 1
        if score >= 2: return 'LONG'
        elif score <= -2: return 'SHORT'
        elif score == 1: return 'RANGE_LONG'
        elif score == -1: return 'RANGE_SHORT'
        return 'RANGE'

    def count_confirmations(idx, direction):
        """Count confirmations exactly like the engine."""
        count = 0
        bias = get_bias(idx)
        avg_vol = sum(b[5] for b in bars[max(0, idx-20):idx]) / min(20, idx) if idx > 0 else bars[idx][5]
        v = vwaps[idx] if idx < len(vwaps) else closes[idx]

        # 1. Bias
        if direction == 'long' and bias in ('LONG', 'RANGE_LONG'): count += 1
        elif direction == 'short' and bias in ('SHORT', 'RANGE_SHORT'): count += 1

        # 2. Volume
        if avg_vol > 0 and bars[idx][5] > avg_vol: count += 1

        # 3. Structure (3 sequential closes)
        if idx >= 2:
            if direction == 'long' and bars[idx][4] > bars[idx-1][4] > bars[idx-2][4]: count += 1
            elif direction == 'short' and bars[idx][4] < bars[idx-1][4] < bars[idx-2][4]: count += 1

        # 4. Velocity (close in upper/lower 40% of bar)
        bar_range = bars[idx][2] - bars[idx][3]
        if bar_range > 0:
            close_pos = (bars[idx][4] - bars[idx][3]) / bar_range
            if direction == 'long' and close_pos >= 0.60: count += 1
            elif direction == 'short' and close_pos <= 0.40: count += 1

        # 5. VWAP
        if direction == 'long' and closes[idx] > v: count += 1
        elif direction == 'short' and closes[idx] < v: count += 1

        return count

    # Engine v9: ORB (lowered confluence to 2, volume to 1.0x) + VWAP MR (bias-filtered)
    orb_long_done = False
    orb_short_done = False
    vwap_mr_long_done = False
    vwap_mr_short_done = False
    daily_bo_long_done = False
    daily_bo_short_done = False

    for i in range(3, min(len(bars) - 20, 200)):
        price = bars[i][4]
        vwap = vwaps[i] if i < len(vwaps) else price
        atr = compute_atr(bars, i)
        avg_vol = sum(b[5] for b in bars[max(0, i-20):i]) / min(20, i) if i > 0 else bars[i][5]
        bias = get_bias(i)

        # Session detection (simplified)
        is_ny_open = i < 60
        min_conf = 2  # Session minimum

        # RVOL filter (v6: >= 0.7)
        rvol = bars[i][5] / avg_vol if avg_vol > 0 else 1.0
        if rvol < 0.7:
            continue

        # ── ORB (v9: confluence 2, volume 1.0x, prior bar 0.3% tolerance) ──
        if 30 <= i <= 120 and or_range > 0 and not orb_long_done:
            if price > or_high and bars[i][5] > avg_vol * 1.0:
                if i >= 1 and bars[i-1][4] <= or_high * 1.003:
                    entry = or_high + 0.25  # OR_high + 1 tick
                    stop_dist = or_range * 0.5
                    stop = entry - stop_dist
                    stop_ticks = abs(entry - stop) / 0.25
                    if stop_ticks < 12: stop = entry - 12 * 0.25
                    if abs(entry - stop) <= (60.0 if market == 'NQ' else 25.0) and stop_dist >= atr * 0.3:
                        risk = entry - stop
                        target = entry + risk * 1.5
                        conf = count_confirmations(i, 'long')
                        if is_ny_open: conf += 1
                        if conf >= 2:  # v9: lowered from 3
                            rr = abs(target - entry) / risk if risk > 0 else 0
                            if rr >= 1.5:
                                result, pnl, exit_idx = simulate_trade(bars, i, 'LONG', entry, stop, target)
                                signals.append({
                                    'direction': 'LONG', 'type': 'orb_break',
                                    'entry': round(entry, 2), 'stop': round(stop, 2),
                                    'target': round(target, 2), 'result': result,
                                    'pnl': round(pnl, 2), 'conf': conf,
                                    'entry_idx': i, 'exit_idx': exit_idx,
                                    'vwap': round(vwap, 2), 'bias': bias,
                                    'rvol': round(rvol, 2),
                                })
                                orb_long_done = True

        if 30 <= i <= 120 and or_range > 0 and not orb_short_done:
            if price < or_low and bars[i][5] > avg_vol * 1.0:
                if i >= 1 and bars[i-1][4] >= or_low * 0.997:
                    entry = or_low - 0.25
                    stop_dist = or_range * 0.5
                    stop = entry + stop_dist
                    stop_ticks = abs(stop - entry) / 0.25
                    if stop_ticks < 12: stop = entry + 12 * 0.25
                    if abs(stop - entry) <= (60.0 if market == 'NQ' else 25.0) and stop_dist >= atr * 0.3:
                        risk = stop - entry
                        target = entry - risk * 1.5
                        conf = count_confirmations(i, 'short')
                        if is_ny_open: conf += 1
                        if conf >= 2:  # v9: lowered from 3
                            rr = abs(entry - target) / risk if risk > 0 else 0
                            if rr >= 1.5:
                                result, pnl, exit_idx = simulate_trade(bars, i, 'SHORT', entry, stop, target)
                                signals.append({
                                    'direction': 'SHORT', 'type': 'orb_break',
                                    'entry': round(entry, 2), 'stop': round(stop, 2),
                                    'target': round(target, 2), 'result': result,
                                    'pnl': round(pnl, 2), 'conf': conf,
                                    'entry_idx': i, 'exit_idx': exit_idx,
                                    'vwap': round(vwap, 2), 'bias': bias,
                                    'rvol': round(rvol, 2),
                                })
                                orb_short_done = True

        # ── VWAP Mean Reversion (v9: NQ only, bias-filtered, 1.5x ATR, 1.0pt buffer) ──
        vwap_mr_enabled = (market == 'NQ')  # v9: ES VWAP MR loses money
        vwap_mr_allow_long = bias not in ('SHORT', 'RANGE_SHORT')
        vwap_mr_allow_short = bias not in ('LONG', 'RANGE_LONG')

        if vwap_mr_enabled and i >= 5 and i <= 120 and not vwap_mr_long_done and vwap_mr_allow_long:
            dist = price - vwap
            if dist < -atr * 1.5 and bars[i][4] > bars[i-1][2]:  # reversal bar
                entry = price
                stop_raw = min(b[3] for b in bars[max(0, i-5):i+1]) - 1.0
                stop = round(round(stop_raw / 0.25) * 0.25, 2)
                risk = entry - stop
                if 2 <= risk <= 60:
                    target = round(entry + risk * 1.0, 2)
                    conf = count_confirmations(i, 'long')
                    if conf >= 1:  # VWAP MR only needs 1
                        result, pnl, exit_idx = simulate_trade(bars, i, 'LONG', entry, stop, target)
                        signals.append({
                            'direction': 'LONG', 'type': 'vwap_bounce',
                            'entry': round(entry, 2), 'stop': stop,
                            'target': target, 'result': result,
                            'pnl': round(pnl, 2), 'conf': conf,
                            'entry_idx': i, 'exit_idx': exit_idx,
                            'vwap': round(vwap, 2), 'bias': bias,
                            'rvol': round(rvol, 2),
                        })
                        vwap_mr_long_done = True

        if vwap_mr_enabled and i >= 5 and i <= 120 and not vwap_mr_short_done and vwap_mr_allow_short:
            dist = price - vwap
            if dist > atr * 1.5 and bars[i][4] < bars[i-1][3]:  # reversal bar
                entry = price
                stop_raw = max(b[2] for b in bars[max(0, i-5):i+1]) + 1.0
                stop = round(round(stop_raw / 0.25) * 0.25, 2)
                risk = stop - entry
                if 2 <= risk <= 60:
                    target = round(entry - risk * 1.0, 2)
                    conf = count_confirmations(i, 'short')
                    if conf >= 1:
                        result, pnl, exit_idx = simulate_trade(bars, i, 'SHORT', entry, stop, target)
                        signals.append({
                            'direction': 'SHORT', 'type': 'vwap_bounce',
                            'entry': round(entry, 2), 'stop': stop,
                            'target': target, 'result': result,
                            'pnl': round(pnl, 2), 'conf': conf,
                            'entry_idx': i, 'exit_idx': exit_idx,
                            'vwap': round(vwap, 2), 'bias': bias,
                            'rvol': round(rvol, 2),
                        })
                        vwap_mr_short_done = True

        # ── Daily Breakout (v9: ES only, once per direction) ──
        daily_bo_enabled = (market == 'ES')
        if daily_bo_enabled and prev_high and i >= 3 and i <= 150 and not daily_bo_long_done:
            if price > prev_high + atr * 0.1 and price > vwap:
                if i >= 1 and bars[i-1][4] >= prev_high * 0.998:
                    entry = prev_high + 0.25
                    stop = min(b[3] for b in bars[max(0, i-10):i+1]) - 0.25
                    risk = entry - stop
                    if risk >= atr * 1.0 and abs(entry - stop) <= (60.0 if market == 'NQ' else 25.0):
                        target = entry + risk * 2.0
                        conf = count_confirmations(i, 'long')
                        if conf >= 2:
                            rr = abs(target - entry) / risk
                            if rr >= 1.5:
                                result, pnl, exit_idx = simulate_trade(bars, i, 'LONG', entry, stop, target)
                                signals.append({
                                    'direction': 'LONG', 'type': 'daily_breakout',
                                    'entry': round(entry, 2), 'stop': round(stop, 2),
                                    'target': round(target, 2), 'result': result,
                                    'pnl': round(pnl, 2), 'conf': conf,
                                    'entry_idx': i, 'exit_idx': exit_idx,
                                    'vwap': round(vwap, 2), 'bias': bias,
                                    'rvol': round(rvol, 2),
                                })
                                daily_bo_long_done = True

        if daily_bo_enabled and prev_low and i >= 3 and i <= 150 and not daily_bo_short_done:
            if price < prev_low - atr * 0.1 and price < vwap:
                if i >= 1 and bars[i-1][4] <= prev_low * 1.002:
                    entry = prev_low - 0.25
                    stop = max(b[2] for b in bars[max(0, i-10):i+1]) + 0.25
                    risk = stop - entry
                    if risk >= atr * 1.0 and abs(stop - entry) <= (60.0 if market == 'NQ' else 25.0):
                        target = entry - risk * 2.0
                        conf = count_confirmations(i, 'short')
                        if conf >= 2:
                            rr = abs(entry - target) / risk
                            if rr >= 1.5:
                                result, pnl, exit_idx = simulate_trade(bars, i, 'SHORT', entry, stop, target)
                                signals.append({
                                    'direction': 'SHORT', 'type': 'daily_breakout',
                                    'entry': round(entry, 2), 'stop': round(stop, 2),
                                    'target': round(target, 2), 'result': result,
                                    'pnl': round(pnl, 2), 'conf': conf,
                                    'entry_idx': i, 'exit_idx': exit_idx,
                                    'vwap': round(vwap, 2), 'bias': bias,
                                    'rvol': round(rvol, 2),
                                })
                                daily_bo_short_done = True

    return signals


# ─── Main Audit Loop ─────────────────────────────────────────────────────────

# Get all trading days
cur.execute("SELECT DISTINCT ts::date FROM candles WHERE symbol='NQM6' AND timeframe='1m' ORDER BY ts::date")
trading_days = [r[0] for r in cur.fetchall()]

for symbol in ['NQM6', 'ESM6']:
    market = 'NQ' if 'NQ' in symbol else 'ES'
    tick_val = 5.0 if market == 'NQ' else 12.5

    print(f"\n{'='*100}")
    print(f"  PERFECT ENTRIES AUDIT -- {symbol} -- MARCH 2026")
    print(f"  {len(trading_days)} trading days")
    print(f"{'='*100}")

    all_engine_trades = []
    all_best_trades = []
    match_count = 0
    engine_miss_count = 0
    engine_wrong_count = 0
    failure_reasons = []

    prev_day_bars = None

    for day_idx, day in enumerate(trading_days):
        bars = get_day_bars(symbol, day)
        if len(bars) < 50:
            print(f"\n--- {day} ({day.strftime('%A')}) --- SKIPPED (only {len(bars)} bars)")
            continue

        # Compute indicators
        closes = [b[4] for b in bars]
        day_open = bars[0][1]
        day_high = max(b[2] for b in bars)
        day_low = min(b[3] for b in bars)
        day_close = bars[-1][4]
        day_change = day_close - day_open
        day_range = day_high - day_low

        or_high = max(b[2] for b in bars[:30])
        or_low = min(b[3] for b in bars[:30])
        or_range = or_high - or_low

        vwaps = compute_vwap(bars)
        ema9 = compute_ema(closes, 9)
        ema21 = compute_ema(closes, 21)
        rsi_vals = compute_rsi(closes)

        # Previous day high/low
        prev_bars = get_prev_day_bars(symbol, day) if day_idx > 0 else None
        prev_high = max(b[2] for b in prev_bars) if prev_bars else None
        prev_low = min(b[3] for b in prev_bars) if prev_bars else None

        # Day direction
        if day_change > day_range * 0.2:
            day_dir = "TREND UP"
        elif day_change < -day_range * 0.2:
            day_dir = "TREND DOWN"
        else:
            day_dir = "RANGE"

        print(f"\n{'─'*100}")
        print(f"Date: {day} ({day.strftime('%A')}) [{symbol}]")
        print(f"Day: {day_dir} ({day_change:+.2f}pts, range {day_range:.0f}pt)")
        print(f"Open: {day_open:.2f}  High: {day_high:.2f}  Low: {day_low:.2f}  Close: {day_close:.2f}")
        print(f"OR: {or_low:.2f}-{or_high:.2f} (range {or_range:.0f}pt)")
        if prev_high:
            print(f"PDH: {prev_high:.2f}  PDL: {prev_low:.2f}")

        # Find BEST trade (hindsight)
        best = find_best_trade(bars, or_high, or_low, vwaps, ema9, ema21, prev_high, prev_low)

        if best:
            print(f"\nBEST TRADE (hindsight):")
            print(f"  {best['direction']} at {best['entry']:.2f} ({best['type']})")
            print(f"  Stop: {best['stop']:.2f} ({best['risk']:.2f}pt risk)")
            print(f"  Target: {best['target']:.2f}")
            print(f"  Result: {best['result']} ({best['pnl']:+.2f}pt, {best['rr_achieved']:.1f}R)")
            print(f"  Bar idx: {best['entry_idx']} (minute {best['entry_idx']} from RTH open)")
            all_best_trades.append(best)

            # Indicators at entry
            idx = best['entry_idx']
            rsi_at = rsi_vals[idx] if idx < len(rsi_vals) and rsi_vals[idx] is not None else 'N/A'
            print(f"\n  INDICATORS AT ENTRY:")
            print(f"    VWAP: {best['vwap_at_entry']:.2f} (price {'above' if best['entry'] > best['vwap_at_entry'] else 'below'} = {'bullish' if best['direction']=='LONG' and best['entry']>best['vwap_at_entry'] else 'bearish' if best['direction']=='SHORT' and best['entry']<best['vwap_at_entry'] else 'contra'})")
            print(f"    EMA9: {best['ema9_at_entry']:.2f} {'>' if best['ema9_at_entry'] > best['ema21_at_entry'] else '<'} EMA21: {best['ema21_at_entry']:.2f} ({'bullish' if best['ema9_at_entry'] > best['ema21_at_entry'] else 'bearish'})")
            print(f"    RSI: {rsi_at}")
            print(f"    Volume: {best['rvol']:.1f}x avg ({'confirmed' if best['rvol'] >= 1.0 else 'thin'})")
            print(f"    ATR: {best['atr_at_entry']:.2f}")
        else:
            print(f"\nBEST TRADE: NONE (no profitable setup found)")

        # Find ENGINE signals
        engine_sigs = simulate_engine_signals(bars, or_high, or_low, vwaps, ema9, ema21, prev_high, prev_low, market)

        if engine_sigs:
            # Find the best engine signal (highest P&L)
            engine_sigs.sort(key=lambda s: s['pnl'], reverse=True)
            eng = engine_sigs[0]

            print(f"\nENGINE SIGNAL ({len(engine_sigs)} signals):")
            for es in engine_sigs:
                marker = ' <-- BEST' if es == eng else ''
                print(f"  {es['direction']} {es['type']} at {es['entry']:.2f} "
                      f"stop={es['stop']:.2f} target={es['target']:.2f} "
                      f"-> {es['result']} ({es['pnl']:+.2f}pt) conf={es['conf']} "
                      f"bias={es['bias']} rvol={es['rvol']:.1f}x{marker}")
            all_engine_trades.extend(engine_sigs)

            # Compare with best trade
            if best:
                same_dir = eng['direction'] == best['direction']
                entry_close = abs(eng['entry'] - best['entry']) < best['atr_at_entry'] * 1.5
                eng_won = eng['result'] == 'WIN'
                best_won = best['result'] == 'WIN'

                if same_dir and entry_close:
                    print(f"\n  Match: YES (same direction, close entry)")
                    match_count += 1
                elif eng_won:
                    print(f"\n  Match: PARTIAL (different trade but engine won)")
                    match_count += 1
                else:
                    print(f"\n  Match: NO (engine: {eng['direction']} {eng['type']} {eng['result']}, best: {best['direction']} {best['type']} {best['result']})")
                    engine_wrong_count += 1
                    # Diagnose why
                    reasons = []
                    if not same_dir:
                        reasons.append(f"WRONG DIRECTION (engine={eng['direction']}, best={best['direction']})")
                    if eng['result'] == 'LOSS':
                        reasons.append(f"ENGINE LOSS: stop hit at {eng['stop']:.2f}")
                    if eng['conf'] < 3:
                        reasons.append(f"LOW CONFLUENCE ({eng['conf']})")
                    if eng['rvol'] < 1.0:
                        reasons.append(f"LOW VOLUME (rvol={eng['rvol']:.1f}x)")
                    failure_reasons.append({
                        'day': str(day),
                        'reasons': reasons,
                        'engine': eng,
                        'best': best,
                    })
            else:
                print(f"\n  Match: N/A (no best trade found, engine signaled anyway)")

        else:
            print(f"\nENGINE SIGNAL: NONE")
            if best and best['result'] == 'WIN':
                print(f"  ** ENGINE MISSED a {best['direction']} {best['type']} that would have been a WIN ({best['pnl']:+.2f}pt) **")
                engine_miss_count += 1
                # Diagnose why engine missed
                idx = best['entry_idx']
                vwap = vwaps[idx] if idx < len(vwaps) else best['entry']
                atr = compute_atr(bars, idx)
                avg_vol = sum(b[5] for b in bars[max(0, idx-20):idx]) / min(20, idx) if idx > 0 else bars[idx][5]
                rvol = bars[idx][5] / avg_vol if avg_vol > 0 else 1.0
                bias = 'N/A'
                conf_est = 0
                if best['entry'] > vwap: conf_est += 1
                e9 = ema9[idx] if idx < len(ema9) and ema9[idx] else best['entry']
                e21 = ema21[idx] if idx < len(ema21) and ema21[idx] else best['entry']
                if (best['direction'] == 'LONG' and e9 > e21) or (best['direction'] == 'SHORT' and e9 < e21):
                    conf_est += 1
                if rvol >= 1.0: conf_est += 1

                reasons = []
                if best['type'] == 'ORB' and or_range > 35 and market == 'NQ':
                    reasons.append(f"OR range too large ({or_range:.0f}pt > 35pt NQ filter)")
                if rvol < 0.7:
                    reasons.append(f"RVOL too low ({rvol:.1f}x < 0.7x filter)")
                if rvol < 1.2 and best['type'] == 'ORB':
                    reasons.append(f"ORB volume filter: rvol {rvol:.1f}x < 1.2x")
                if conf_est < 2:
                    reasons.append(f"Estimated confluence too low ({conf_est})")
                if best['type'] == 'VWAP_MR':
                    dist = abs(best['entry'] - vwap)
                    if dist < atr:
                        reasons.append(f"VWAP distance ({dist:.1f}) < ATR ({atr:.1f})")
                if best['entry_idx'] > 120:
                    reasons.append(f"Entry too late (bar {best['entry_idx']} > 120 max)")
                if not reasons:
                    reasons.append("UNKNOWN - needs investigation")

                for r in reasons:
                    print(f"    Why missed: {r}")
                failure_reasons.append({
                    'day': str(day),
                    'reasons': reasons,
                    'engine': None,
                    'best': best,
                })
            elif best:
                print(f"  (Best trade was {best['result']} anyway)")

    # ── Summary ──────────────────────────────────────────────────────────────

    print(f"\n{'='*100}")
    print(f"  SUMMARY: {symbol}")
    print(f"{'='*100}")

    # Engine stats
    eng_wins = [t for t in all_engine_trades if t['result'] == 'WIN']
    eng_losses = [t for t in all_engine_trades if t['result'] == 'LOSS']
    eng_timeouts = [t for t in all_engine_trades if t['result'] == 'TIMEOUT']
    eng_total = len(all_engine_trades)
    eng_wr = len(eng_wins) / eng_total * 100 if eng_total > 0 else 0
    eng_gross_win = sum(t['pnl'] for t in eng_wins) + sum(max(0, t['pnl']) for t in eng_timeouts)
    eng_gross_loss = abs(sum(t['pnl'] for t in eng_losses)) + abs(sum(min(0, t['pnl']) for t in eng_timeouts))
    eng_pf = eng_gross_win / eng_gross_loss if eng_gross_loss > 0 else float('inf')
    eng_pnl = sum(t['pnl'] for t in all_engine_trades)
    eng_usd = eng_pnl / 0.25 * tick_val

    print(f"\nENGINE PERFORMANCE:")
    print(f"  Trades: {eng_total} ({len(eng_wins)}W / {len(eng_losses)}L / {len(eng_timeouts)}T)")
    print(f"  Win Rate: {eng_wr:.1f}%")
    print(f"  Profit Factor: {eng_pf:.2f}")
    print(f"  Total P&L: {eng_pnl:+.2f}pt ({eng_usd:+,.0f} USD)")

    # By signal type
    for stype in set(t['type'] for t in all_engine_trades):
        st_trades = [t for t in all_engine_trades if t['type'] == stype]
        st_wins = [t for t in st_trades if t['result'] == 'WIN']
        st_pnl = sum(t['pnl'] for t in st_trades)
        st_wr = len(st_wins) / len(st_trades) * 100
        print(f"    {stype}: {len(st_trades)} trades, {st_wr:.0f}% WR, {st_pnl:+.2f}pt")

    # Best trades (hindsight)
    best_wins = [t for t in all_best_trades if t['result'] == 'WIN']
    best_pnl = sum(t['pnl'] for t in all_best_trades)
    print(f"\nBEST POSSIBLE (hindsight):")
    print(f"  Winning days: {len(best_wins)} / {len(all_best_trades)}")
    print(f"  Total P&L: {best_pnl:+.2f}pt ({best_pnl / 0.25 * tick_val:+,.0f} USD)")

    print(f"\nENGINE ACCURACY:")
    print(f"  Matches (correct trade or engine won): {match_count}")
    print(f"  Missed winning trades: {engine_miss_count}")
    print(f"  Wrong signals: {engine_wrong_count}")
    total_evals = match_count + engine_miss_count + engine_wrong_count
    accuracy = match_count / total_evals * 100 if total_evals > 0 else 0
    print(f"  Accuracy: {accuracy:.0f}%")

    # Failure analysis
    if failure_reasons:
        print(f"\nFAILURE ANALYSIS ({len(failure_reasons)} issues):")
        reason_counts = {}
        for fr in failure_reasons:
            for r in fr['reasons']:
                # Extract category
                cat = r.split('(')[0].strip().split(':')[0].strip()
                reason_counts[cat] = reason_counts.get(cat, 0) + 1
        for reason, count in sorted(reason_counts.items(), key=lambda x: -x[1]):
            print(f"  [{count}x] {reason}")

        print(f"\n  Day-by-day failures:")
        for fr in failure_reasons:
            eng_str = f"{fr['engine']['direction']} {fr['engine']['type']} -> {fr['engine']['result']}" if fr['engine'] else "NO SIGNAL"
            best_str = f"{fr['best']['direction']} {fr['best']['type']} -> {fr['best']['result']}" if fr['best'] else "N/A"
            print(f"    {fr['day']}: Engine={eng_str} | Best={best_str}")
            for r in fr['reasons']:
                print(f"      - {r}")

print(f"\n{'='*100}")
print(f"  AUDIT COMPLETE")
print(f"{'='*100}")

conn.close()

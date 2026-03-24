"""Arctis Engine — 90-Day Paper Trading (50K EUR, NQ, Jan-Mar 2026)

Fixes vs. paper_trade_7days.py:
  1. Passes vwap= to detect_signals (was missing)
  2. Computes prev_high/prev_low correctly from prior RTH day
  3. Uses 90 days of Jan-Mar 2026 data
  4. 90-bar timeout exit
  5. Breakeven at 35% (more aggressive)
  6. Per-signal-type breakdown with W/L/T counts
"""
import os, sys, dataclasses
from datetime import datetime, timezone

raw_url = os.environ.get("DATABASE_URL", "postgresql://algorivo:algorivo_dev@localhost:5532/algorivo")
os.environ["DATABASE_URL"] = raw_url.replace("postgres://", "postgresql://", 1) if raw_url.startswith("postgres://") else raw_url
sys.path.insert(0, "/Users/kaan_macbook/arctis/engine/src")

from arctis.db import fetch_bars_as_models
from arctis.analysis.signals import detect_signals
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.confluence import calculate_confluence
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
from arctis.analysis.velocity import calculate_velocity
from arctis.analysis.vwap import calculate_vwap
from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels
from arctis.analysis.volume import detect_volume_spikes
from arctis.analysis.naked_poc import find_naked_pocs
from arctis.analysis.key_levels import find_key_levels

ACCOUNT = 50000; NQ_TICK = 0.25; NQ_TV = 5.00; COMM = 4.50
BREAKEVEN_PCT = 0.35   # Move stop to entry when 35% of target distance reached
MAX_HOLD_BARS = 90     # 90-bar (90 min on 1min chart) timeout exit

print("=" * 70)
print("ARCTIS ENGINE — 90-TAGE PAPER TRADING (50.000 EUR, Jan-Mar 2026)")
print("=" * 70)

# Load 90 days of NQ data
bars = fetch_bars_as_models(market="NQ", days=90, timeframe="1min")
print(f"Total bars loaded: {len(bars)}")

# Group by RTH calendar day (14:30-21:00 UTC = 09:30-16:00 ET)
days_map: dict[str, list] = {}
for b in bars:
    dt = datetime.fromtimestamp(b.timestamp, tz=timezone.utc)
    day = dt.strftime("%Y-%m-%d")
    if 14 <= dt.hour <= 20:
        days_map.setdefault(day, []).append(b)

all_days = sorted(days_map.keys())
# Only use full trading days (>200 RTH bars)
full_days = [d for d in all_days if len(days_map[d]) > 200]
print(f"Full RTH days: {len(full_days)} ({full_days[0]} to {full_days[-1]})")
print()

# Also build a dict of ALL bars by day for context
all_bars_by_day: dict[str, list] = {}
for b in bars:
    dt = datetime.fromtimestamp(b.timestamp, tz=timezone.utc)
    day = dt.strftime("%Y-%m-%d")
    all_bars_by_day.setdefault(day, []).append(b)

all_trades = []
equity = ACCOUNT


def compute_prev_day_levels(trading_days: list[str], current_day: str, days_map_all: dict[str, list]) -> tuple:
    """Get previous trading day's high/low/close from RTH data."""
    idx = trading_days.index(current_day)
    if idx == 0:
        return None, None, None
    prev_day = trading_days[idx - 1]
    prev_bars = days_map_all.get(prev_day, [])
    if not prev_bars:
        return None, None, None
    return (
        max(b.high for b in prev_bars),
        min(b.low for b in prev_bars),
        prev_bars[-1].close
    )


for day in full_days:
    day_bars = days_map[day]

    # Context: all bars from prior day (all sessions) for volume profile etc.
    day_ts_start = day_bars[0].timestamp
    # Use up to 1000 bars of context (pre-RTH + prior RTH sessions)
    context_bars = [b for b in bars if b.timestamp < day_ts_start][-1000:]

    # Compute previous RTH day levels correctly
    prev_high, prev_low, prev_close = compute_prev_day_levels(full_days, day, days_map)

    # Opening range: first 30 bars of RTH
    or_bars = day_bars[:30] if len(day_bars) >= 30 else day_bars
    or_high = max(b.high for b in or_bars) if or_bars else None
    or_low = min(b.low for b in or_bars) if or_bars else None

    daily_pnl = 0.0
    daily_trades = []
    # Track signal types already taken today (no re-entry on same signal type + direction)
    daily_signals_taken: set[str] = set()

    # Checkpoints every 15 bars from bar 30 to 330 (max)
    checkpoints = list(range(30, min(len(day_bars), 330), 15))

    for cp in checkpoints:
        if len(daily_trades) >= 3:
            break  # max 3 trades per day
        if abs(daily_pnl) >= 1000:
            break  # daily limit hit

        today_bars = day_bars[:cp]
        # Analysis uses prior context + today's bars
        analysis_bars = context_bars + today_bars

        try:
            # Core analysis
            swings = detect_swings(analysis_bars)
            trend = classify_trend(swings)
            vwap_data = calculate_vwap(today_bars)
            ema_data = calculate_ema_ribbon(analysis_bars)
            vel = calculate_velocity(analysis_bars)
            # Volume profiles
            # Historical VP for targets (VAH/VAL) and naked POC detection
            vp = build_volume_profile(analysis_bars)
            # Today-only VP for intraday POC level (used in detect_signals poc param)
            vp_today = build_volume_profile(today_bars)
            npocs = find_naked_pocs(analysis_bars)
            klevels = find_key_levels(analysis_bars)

            if vp is None:
                continue
            # Use today's intraday POC for signal detection, historical VAH/VAL for targets
            poc_for_signals = vp_today.poc if vp_today is not None else vp.poc

            vwap_val = vwap_data[-1].vwap if vwap_data else None
            ema_align = "mixed"
            if ema_data and hasattr(ema_data[-1], 'alignment') and ema_data[-1].alignment:
                ema_align = ema_data[-1].alignment
            vs = vel[-1].signed_scale if vel else 0

            vpos = "above" if (vwap_val and today_bars[-1].close > vwap_val) else "below"

            bias = calculate_bias_state(
                bars=analysis_bars, trend=trend, velocity_scale=vs,
                auction_quality="unknown", vwap_position=vpos, ema_alignment=ema_align
            )

            kl_dicts = [dataclasses.asdict(k) for k in klevels]
            naked_poc_prices = [p.poc_price for p in npocs if p.is_naked]

            sigs = detect_signals(
                bars=analysis_bars,
                bias_state=bias.state,
                bias_score=bias.score,
                poc=poc_for_signals,   # intraday POC for rejection signals
                vah=vp.vah,            # historical VAH/VAL for target levels
                val=vp.val,
                prev_high=prev_high,
                prev_low=prev_low,
                or_high=or_high,
                or_low=or_low,
                ib_high=None,
                ib_low=None,
                naked_pocs=naked_poc_prices,
                key_levels=kl_dicts,
                vwap=vwap_val,
                session_bar_idx=cp,  # cp = bar position within today's session
            )

            if not sigs:
                continue

            # Take first (highest-quality) signal only
            sig = sigs[0]

            # No re-entry: skip if same signal type+direction already traded today
            sig_key = f"{sig.signal_type}_{sig.direction}"
            if sig_key in daily_signals_taken:
                continue

            # Validate signal fields
            entry = sig.entry_price
            stop = sig.stop_price
            target = sig.target_price
            if not all([entry, stop, target]):
                continue
            risk = abs(entry - stop)
            reward = abs(target - entry)
            if risk == 0 or reward / risk < 1.0:
                continue

            # Walk forward: simulate trade with breakeven management
            remaining = day_bars[cp:]
            result = "timeout"
            exit_price = entry  # default: timeout at entry (breakeven)
            breakeven_triggered = False
            breakeven_price = entry  # adjusted stop once breakeven fires
            bars_held = 0

            for fb in remaining:
                bars_held += 1

                # 90-bar timeout exit
                if bars_held >= MAX_HOLD_BARS:
                    result = "timeout"
                    exit_price = fb.close
                    break

                if sig.direction == "long":
                    # Check if breakeven should trigger
                    if not breakeven_triggered:
                        be_trigger_price = entry + (target - entry) * BREAKEVEN_PCT
                        if fb.high >= be_trigger_price:
                            breakeven_triggered = True
                            breakeven_price = entry  # stop moved to entry

                    # Check stop (structural or breakeven)
                    effective_stop = max(stop, breakeven_price) if breakeven_triggered else stop
                    if fb.low <= effective_stop:
                        result = "breakeven" if breakeven_triggered else "loss"
                        exit_price = effective_stop
                        break

                    # Check target
                    if fb.high >= target:
                        result = "win"
                        exit_price = target
                        break
                else:
                    # SHORT
                    if not breakeven_triggered:
                        be_trigger_price = entry - (entry - target) * BREAKEVEN_PCT
                        if fb.low <= be_trigger_price:
                            breakeven_triggered = True
                            breakeven_price = entry

                    effective_stop = min(stop, breakeven_price) if breakeven_triggered else stop
                    if fb.high >= effective_stop:
                        result = "breakeven" if breakeven_triggered else "loss"
                        exit_price = effective_stop
                        break

                    if fb.low <= target:
                        result = "win"
                        exit_price = target
                        break

            # Calculate P&L in EUR
            if sig.direction == "long":
                ticks = (exit_price - entry) / NQ_TICK
            else:
                ticks = (entry - exit_price) / NQ_TICK

            # P&L: ticks * tick_value - commission, with 0.92 EUR/USD conversion
            pnl = (ticks * NQ_TV - COMM) * 0.92

            daily_pnl += pnl
            equity += pnl

            ts = datetime.fromtimestamp(today_bars[-1].timestamp, tz=timezone.utc)

            trade = {
                "day": day,
                "time": ts.strftime("%H:%M"),
                "dir": sig.direction.upper(),
                "type": sig.signal_type,
                "entry": entry,
                "stop": stop,
                "target": target,
                "exit": exit_price,
                "result": result,
                "ticks": ticks,
                "pnl": round(pnl, 2),
                "rr": round(reward / risk, 1),
                "bias": bias.state,
                "conf": sig.confidence,
                "bars_held": bars_held,
                "breakeven": breakeven_triggered,
            }
            daily_trades.append(trade)
            all_trades.append(trade)
            daily_signals_taken.add(sig_key)

        except Exception as e:
            # Uncomment for debugging: print(f"  Error at {day} cp={cp}: {e}")
            continue

    # Daily summary
    w = sum(1 for t in daily_trades if t["result"] == "win")
    l = sum(1 for t in daily_trades if t["result"] == "loss")
    be = sum(1 for t in daily_trades if t["result"] == "breakeven")
    to = sum(1 for t in daily_trades if t["result"] == "timeout")
    day_str = f"  {day}: {len(daily_trades)} trades"
    if daily_trades:
        day_str += f" | {w}W {l}L {be}BE {to}T | PnL: {daily_pnl:+.2f} EUR"
    day_str += f" | Equity: {equity:.2f}"
    print(day_str)

    for t in daily_trades:
        icon = "+" if t["result"] == "win" else ("-" if t["result"] == "loss" else ("=" if t["result"] == "breakeven" else "~"))
        print(f"    {icon} {t['time']} {t['dir']} [{t['type']}] "
              f"entry={t['entry']:.2f} stop={t['stop']:.2f} tgt={t['target']:.2f} "
              f"exit={t['exit']:.2f} ({t['ticks']:+.0f}t) = {t['pnl']:+.2f}EUR "
              f"[bias={t['bias']} conf={t['conf']} rr={t['rr']}x bars={t['bars_held']}]")

# Final results
print("\n" + "=" * 70)
print("GESAMT-ERGEBNIS (Jan-Mar 2026, 90 Tage)")
print("=" * 70)

n = len(all_trades)
if n == 0:
    print("KEINE TRADES GENERIERT.")
    print("Signal-Filter zu restriktiv oder keine Daten.")
    sys.exit(1)

w = sum(1 for t in all_trades if t["result"] == "win")
l = sum(1 for t in all_trades if t["result"] == "loss")
be = sum(1 for t in all_trades if t["result"] == "breakeven")
to = sum(1 for t in all_trades if t["result"] == "timeout")
pnl_total = equity - ACCOUNT
gp = sum(t["pnl"] for t in all_trades if t["pnl"] > 0)
gl = abs(sum(t["pnl"] for t in all_trades if t["pnl"] < 0))
pf = gp / gl if gl > 0 else float("inf")
wr = w / n * 100 if n > 0 else 0

print(f"Kapital:       {ACCOUNT} -> {equity:.2f} EUR ({pnl_total:+.2f} EUR, {pnl_total/ACCOUNT*100:+.2f}%)")
print(f"Trades:        {n} ({w}W {l}L {be}BE {to}T)")
print(f"Win Rate:      {wr:.1f}%")
print(f"Profit Factor: {pf:.2f}")
if w > 0:
    print(f"Avg Win:       {gp/w:.2f} EUR ({gp/(w*NQ_TV/NQ_TICK/0.92):.0f} ticks)")
if l > 0:
    print(f"Avg Loss:      {-gl/l:.2f} EUR ({-gl/(l*NQ_TV/NQ_TICK/0.92):.0f} ticks)")
print(f"Avg Trade:     {pnl_total/n:.2f} EUR")

print(f"\nSignal-Breakdown:")
types: dict = {}
for t in all_trades:
    k = t["type"]
    types.setdefault(k, {"n": 0, "w": 0, "l": 0, "be": 0, "to": 0, "pnl": 0})
    types[k]["n"] += 1
    types[k]["pnl"] += t["pnl"]
    if t["result"] == "win":
        types[k]["w"] += 1
    elif t["result"] == "loss":
        types[k]["l"] += 1
    elif t["result"] == "breakeven":
        types[k]["be"] += 1
    else:
        types[k]["to"] += 1

for k, v in sorted(types.items(), key=lambda x: x[1]["pnl"], reverse=True):
    wr_k = v["w"] / v["n"] * 100 if v["n"] > 0 else 0
    print(f"  {k:30s}: {v['n']:3d}x, {wr_k:.0f}% WR, {v['w']}W/{v['l']}L/{v['be']}BE/{v['to']}T, {v['pnl']:+.2f} EUR")

print(f"\nPROFIT FACTOR: {pf:.2f} {'[PROFITABLE]' if pf > 1.2 else '[TARGET: 1.2+]'}")

"""Arctis Engine — 7-Day Paper Trading Simulation (50K EUR, NQ, 1 Contract)

Simulates trading by walking through historical data day by day,
generating signals at each checkpoint, and checking if targets/stops are hit.
"""
import os, sys, dataclasses
from datetime import datetime, timezone

raw_url = os.environ.get("DATABASE_URL", "postgresql://algorivo:algorivo_dev@localhost:5532/algorivo")
os.environ["DATABASE_URL"] = raw_url.replace("postgres://", "postgresql://", 1) if raw_url.startswith("postgres://") else raw_url

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

print("=" * 70)
print("ARCTIS ENGINE — 7-TAGE PAPER TRADING (50.000 EUR)")
print("=" * 70)

# Load 60 days for enough context (Feb-Mar 2026)
bars = fetch_bars_as_models(market="NQ", days=60, timeframe="1min")
print(f"Total bars: {len(bars)}")

# Group by day (RTH only: 14:30-21:00 UTC)
days_map = {}
for b in bars:
    dt = datetime.fromtimestamp(b.timestamp, tz=timezone.utc)
    day = dt.strftime("%Y-%m-%d")
    if 14 <= dt.hour <= 20:
        days_map.setdefault(day, []).append(b)

# Pick 7 most active weekdays (most bars)
all_days = sorted(days_map.keys())
# Filter days with >200 bars (full trading days)
full_days = [d for d in all_days if len(days_map[d]) > 200]
trading_days = full_days[-7:] if len(full_days) >= 7 else full_days
print(f"Trading days: {trading_days}")
for d in trading_days:
    print(f"  {d}: {len(days_map[d])} bars")
print()

all_trades = []; equity = ACCOUNT

for day in trading_days:
    day_bars = days_map[day]
    # Get ALL bars up to this day for context (session levels need prior day data)
    day_ts_start = day_bars[0].timestamp
    context_bars = [b for b in bars if b.timestamp < day_ts_start]

    daily_pnl = 0; daily_trades = []

    for cp in [30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 270, 300, 330]:
        if cp >= len(day_bars) or len(daily_trades) >= 3 or abs(daily_pnl) >= 1000:
            break

        # Analysis uses context + today's bars up to checkpoint
        analysis_bars = context_bars[-500:] + day_bars[:cp]
        today_bars = day_bars[:cp]

        try:
            swings = detect_swings(analysis_bars)
            trend = classify_trend(swings)
            vwap_data = calculate_vwap(today_bars)  # VWAP resets daily
            ema_data = calculate_ema_ribbon(analysis_bars)
            rsi_data = calculate_rsi(analysis_bars)
            vel = calculate_velocity(analysis_bars)
            vp = build_volume_profile(analysis_bars)
            sl = calculate_session_levels(analysis_bars)
            spikes = detect_volume_spikes(analysis_bars)
            npocs = find_naked_pocs(analysis_bars)
            klevels = find_key_levels(analysis_bars)

            vpos = "above" if today_bars[-1].close > (vwap_data[-1].vwap if vwap_data else today_bars[-1].close) else "below"
            ema_align = ema_data[-1].alignment if ema_data and hasattr(ema_data[-1], 'alignment') and ema_data[-1].alignment else "mixed"
            vs = vel[-1].signed_scale if vel else 0

            bias = calculate_bias_state(bars=analysis_bars, trend=trend, velocity_scale=vs, auction_quality="unknown", vwap_position=vpos, ema_alignment=ema_align)

            confluence = calculate_confluence(bars=analysis_bars, trend=trend, vwap_data=vwap_data, ema_data=ema_data, rsi_data=rsi_data, volume_profile=vp, session_levels=sl, volume_spikes=spikes)

            kl_dicts = [dataclasses.asdict(k) for k in klevels]

            sigs = detect_signals(
                bars=analysis_bars, bias_state=bias.state, bias_score=bias.score,
                poc=vp.poc, vah=vp.vah, val=vp.val,
                prev_high=sl.prev_high, prev_low=sl.prev_low,
                or_high=sl.opening_range_high, or_low=sl.opening_range_low,
                ib_high=None, ib_low=None,
                naked_pocs=[p.poc_price for p in npocs if p.is_naked],
                key_levels=kl_dicts,
            )

            if not sigs:
                continue

            for sig in sigs:
                if not all([sig.entry, sig.stop, sig.target]):
                    continue
                risk = abs(sig.entry - sig.stop)
                reward = abs(sig.target - sig.entry)
                if risk == 0 or reward / risk < 1.0:
                    continue

                # Walk forward to check outcome
                remaining = day_bars[cp:]
                result = "timeout"
                exit_price = remaining[-1].close if remaining else sig.entry

                for fb in remaining:
                    if sig.direction == "long":
                        if fb.low <= sig.stop:
                            result = "loss"; exit_price = sig.stop; break
                        if fb.high >= sig.target:
                            result = "win"; exit_price = sig.target; break
                    else:
                        if fb.high >= sig.stop:
                            result = "loss"; exit_price = sig.stop; break
                        if fb.low <= sig.target:
                            result = "win"; exit_price = sig.target; break

                ticks = ((exit_price - sig.entry) / NQ_TICK) if sig.direction == "long" else ((sig.entry - exit_price) / NQ_TICK)
                pnl = (ticks * NQ_TV - COMM) * 0.92
                daily_pnl += pnl; equity += pnl

                trade = {"day": day, "time": datetime.fromtimestamp(today_bars[-1].timestamp, tz=timezone.utc).strftime("%H:%M"),
                    "dir": sig.direction.upper(), "type": sig.type, "entry": sig.entry, "stop": sig.stop,
                    "target": sig.target, "exit": exit_price, "result": result, "ticks": ticks,
                    "pnl": round(pnl, 2), "rr": round(reward/risk, 1), "bias": bias.state, "conf": confluence.score}
                daily_trades.append(trade); all_trades.append(trade)
                break
        except Exception as e:
            continue

    w = sum(1 for t in daily_trades if t["result"] == "win")
    l = sum(1 for t in daily_trades if t["result"] == "loss")
    to = sum(1 for t in daily_trades if t["result"] == "timeout")
    print(f"  {day}: {len(daily_trades)} trades | {w}W {l}L {to}T | PnL: {daily_pnl:+.2f} EUR | Equity: {equity:.2f}")
    for t in daily_trades:
        icon = "+" if t["result"] == "win" else "-" if t["result"] == "loss" else "~"
        print(f"    {icon} {t['time']} {t['dir']} {t['type']}: {t['entry']:.2f} -> {t['exit']:.2f} ({t['ticks']:+.0f}t) = {t['pnl']:+.2f}EUR [B:{t['bias']} C:{t['conf']:+d} RR:{t['rr']}]")

print("\n" + "=" * 70)
print("ERGEBNIS")
print("=" * 70)
n = len(all_trades)
if n == 0:
    print("KEINE TRADES GENERIERT.")
    print("Die Engine hat in den letzten 7 Handelstagen kein Signal gefunden das alle Kriterien erfuellt.")
    print("Moegliche Gruende: Markt war in RANGE, keine ORB/IB Breaks, keine POC Rejections")
    sys.exit(0)

w = sum(1 for t in all_trades if t["result"] == "win")
l = sum(1 for t in all_trades if t["result"] == "loss")
to = n - w - l
pnl = equity - ACCOUNT
gp = sum(t["pnl"] for t in all_trades if t["pnl"] > 0)
gl = abs(sum(t["pnl"] for t in all_trades if t["pnl"] < 0))
pf = gp / gl if gl > 0 else float('inf')
wr = w / n * 100 if n > 0 else 0

print(f"Kapital:      {ACCOUNT} -> {equity:.2f} EUR ({pnl:+.2f} EUR, {pnl/ACCOUNT*100:+.1f}%)")
print(f"Trades:       {n} ({w}W {l}L {to}T)")
print(f"Win Rate:     {wr:.1f}%")
print(f"Profit Factor: {pf:.2f}")
if w: print(f"Avg Win:      {gp/w:.2f} EUR")
if l: print(f"Avg Loss:     {gl/l:.2f} EUR")

types = {}
for t in all_trades:
    types.setdefault(t["type"], {"n":0,"w":0,"pnl":0})
    types[t["type"]]["n"] += 1
    if t["result"] == "win": types[t["type"]]["w"] += 1
    types[t["type"]]["pnl"] += t["pnl"]
print(f"\nSignal Breakdown:")
for k,v in sorted(types.items(), key=lambda x: x[1]["pnl"], reverse=True):
    print(f"  {k:25s}: {v['n']}x, {v['w']/v['n']*100:.0f}% WR, {v['pnl']:+.2f} EUR")

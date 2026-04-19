"""Debug backtester — introspect why 0 signals are generated.

Usage:
    .venv/Scripts/python.exe engine/scripts/debug_backtest.py
"""
from __future__ import annotations

import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from arctis.db import fetch_bars_as_models
from arctis.analysis.zones import calculate_zones, _group_by_day
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.naked_poc import find_naked_pocs
from arctis.analysis.key_levels import find_key_levels
from arctis.analysis.signals import detect_signals
from arctis.analysis.vwap import calculate_vwap


def main():
    bars = fetch_bars_as_models(market="NQ", days=30, timeframe="1min")
    print(f"Total bars: {len(bars)}")

    days = _group_by_day(bars)
    print(f"Days grouped: {len(days)}")
    for i, d in enumerate(days):
        first = datetime.fromtimestamp(d[0].timestamp, tz=timezone.utc).strftime("%Y-%m-%d")
        print(f"  day {i}: {first}  bars={len(d)}")

    # Analyze day 5 (mid-sample): check bias + signals with full context
    day_idx = 5
    if day_idx >= len(days):
        day_idx = len(days) - 1

    context_bars = []
    for d in days[:day_idx]:
        context_bars.extend(d)
    current = days[day_idx]
    day_date = datetime.fromtimestamp(current[0].timestamp, tz=timezone.utc).strftime("%Y-%m-%d")
    print(f"\nProbing day {day_idx} = {day_date}")
    print(f"  context bars: {len(context_bars)}  current day bars: {len(current)}")

    zones = calculate_zones(context_bars + current[:30])
    print(f"  zones: {len(zones)}")
    for z in zones[:10]:
        print(f"    {z.label}: high={z.high} low={z.low}")

    ctx_slice = context_bars[-500:] if len(context_bars) > 500 else context_bars
    swings = detect_swings(ctx_slice)
    trend = classify_trend(swings)
    bias = calculate_bias_state(ctx_slice, trend=trend.value)
    print(f"  bias.state={bias.state.value}  score={bias.score}  trend={trend.value}  swings={len(swings)}")

    # Check signals at several checkpoints
    poc = vah = val = prev_high = prev_low = None
    or_high = or_low = ib_high = ib_low = None
    for z in zones:
        if z.label == "POC":
            poc = z.high
        elif z.label == "VA":
            vah, val = z.high, z.low
        elif z.label == "PDH":
            prev_high = z.high
        elif z.label == "PDL":
            prev_low = z.low
        elif z.label == "OR":
            or_high, or_low = z.high, z.low
        elif z.label == "IB":
            ib_high, ib_low = z.high, z.low

    print(f"  poc={poc}  vah={vah}  val={val}  pdh={prev_high}  pdl={prev_low}  or={or_high}/{or_low}  ib={ib_high}/{ib_low}")

    try:
        npocs = find_naked_pocs(context_bars[-2000:])
        naked_poc_prices = [p.poc_price for p in npocs if p.is_naked][:5]
    except Exception as e:
        naked_poc_prices = []
        print("naked_poc error:", e)

    try:
        kls = find_key_levels(context_bars[-2000:])
        kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls[:10]]
    except Exception as e:
        kl_dicts = []
        print("key_levels error:", e)

    print(f"  naked_pocs={len(naked_poc_prices)}  key_levels={len(kl_dicts)}")

    # Loop checkpoints, count signals
    checkpoint_signal_counts = {}
    for cp in [15, 30, 45, 60, 90, 120, 180, 240, 300, 360]:
        if cp >= len(current):
            break
        test_bars = context_bars + current[:cp]
        vwap_val = None
        try:
            vwap_data = calculate_vwap(current[:cp])
            if vwap_data:
                vwap_val = vwap_data[-1].vwap
        except Exception:
            pass
        try:
            sigs = detect_signals(
                test_bars,
                bias.state.value,
                bias.score,
                poc, vah, val,
                prev_high, prev_low,
                or_high, or_low,
                ib_high, ib_low,
                naked_poc_prices,
                kl_dicts,
                vwap=vwap_val,
                session_bar_idx=cp,
                market_root="NQ",
            )
            checkpoint_signal_counts[cp] = len(sigs)
            if sigs:
                for s in sigs:
                    print(f"    cp={cp}  {s.signal_type} {s.direction} entry={s.entry_price} stop={s.stop_price} target={s.target_price} conf={s.confidence}")
        except Exception as e:
            print(f"    cp={cp} ERROR: {e}")

    print("\nCheckpoint signal counts:", checkpoint_signal_counts)


if __name__ == "__main__":
    main()

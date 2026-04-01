#!/usr/bin/env python3
"""
Extended analysis: Focus on what the engine is MISSING and where it can improve.
Tests specific hypotheses for signal engine v7 improvements.
"""

import sys, os, time
from datetime import datetime, timezone
from dataclasses import dataclass
from collections import defaultdict
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from arctis.db import fetch_bars_as_models
from arctis.models import OHLCVBar
from arctis.analysis.zones import _group_by_day
from arctis.analysis.vwap import calculate_vwap
from arctis.analysis.signals import _count_confirmations, _NQ_TICK_SIZE
from arctis.analysis.sessions import classify_session, Session

ET = ZoneInfo("America/New_York")

def ts_to_et(ts): return datetime.fromtimestamp(ts, tz=timezone.utc).astimezone(ET)

def get_rth_bars(day_bars):
    rth = []
    for b in day_bars:
        dt = ts_to_et(b.timestamp)
        t = dt.hour * 60 + dt.minute
        if 570 <= t < 960: rth.append(b)
    return rth


def analyze_or_breakout_quality(bars, market):
    """Deep dive into OR breakout quality: what makes a breakout succeed or fail?"""
    print(f"\n{'='*80}")
    print(f"  OR BREAKOUT QUALITY ANALYSIS — {market}")
    print(f"{'='*80}")

    days = _group_by_day(bars)
    results = []

    for i in range(1, len(days)):
        rth = get_rth_bars(days[i])
        prev_rth = get_rth_bars(days[i-1])
        if len(rth) < 60: continue

        date_str = ts_to_et(rth[0].timestamp).strftime("%Y-%m-%d")

        # OR (30 min)
        or_high = max(b.high for b in rth[:30])
        or_low = min(b.low for b in rth[:30])
        or_range = or_high - or_low
        if or_range < 0.25: continue

        # PDH/PDL
        pdh = max(b.high for b in prev_rth) if prev_rth else 0
        pdl = min(b.low for b in prev_rth) if prev_rth else 0

        # Find breakout
        bo_bar = None
        bo_dir = None
        for idx in range(30, min(len(rth), 150)):
            if rth[idx].close > or_high and (idx == 30 or rth[idx-1].close <= or_high):
                bo_bar = idx
                bo_dir = "long"
                break
            if rth[idx].close < or_low and (idx == 30 or rth[idx-1].close >= or_low):
                bo_bar = idx
                bo_dir = "short"
                break

        if bo_bar is None: continue

        bar = rth[bo_bar]
        recent = rth[max(0,bo_bar-20):bo_bar+1]
        avg_vol = sum(b.volume for b in recent) / len(recent) if recent else 1
        vwap_val = None
        try:
            vdata = calculate_vwap(rth[:bo_bar+1])
            if vdata: vwap_val = vdata[-1].vwap
        except: pass

        conf = _count_confirmations(rth[:bo_bar+1], bo_dir, "RANGE", avg_vol, vwap_val)
        rvol = bar.volume / avg_vol if avg_vol > 0 else 0

        # Breakout bar characteristics
        bar_range = bar.high - bar.low
        bar_body = abs(bar.close - bar.open)
        body_ratio = bar_body / bar_range if bar_range > 0 else 0

        # Price vs OR range
        if bo_dir == "long":
            extension_pct = (bar.close - or_high) / or_range
        else:
            extension_pct = (or_low - bar.close) / or_range

        # Follow-through (next 3 bars)
        ft_bars = rth[bo_bar+1:bo_bar+4]
        if ft_bars:
            if bo_dir == "long":
                ft = max(b.high for b in ft_bars) - bar.close
            else:
                ft = bar.close - min(b.low for b in ft_bars)
        else:
            ft = 0

        # Check multiple targets
        entry = or_high if bo_dir == "long" else or_low
        stop = or_low if bo_dir == "long" else or_high
        risk = or_range

        targets_hit = {}
        for rr in [1.0, 1.5, 2.0, 2.5, 3.0]:
            if bo_dir == "long":
                target = entry + risk * rr
                hit = any(b.high >= target for b in rth[bo_bar+1:min(bo_bar+61, len(rth))])
            else:
                target = entry - risk * rr
                hit = any(b.low <= target for b in rth[bo_bar+1:min(bo_bar+61, len(rth))])
            targets_hit[rr] = hit

        # Check if stop was hit first
        stop_hit_first = False
        for b in rth[bo_bar+1:min(bo_bar+61, len(rth))]:
            if bo_dir == "long":
                if b.low <= stop:
                    stop_hit_first = True
                    break
                if b.high >= entry + risk * 1.5:
                    break
            else:
                if b.high >= stop:
                    stop_hit_first = True
                    break
                if b.low <= entry - risk * 1.5:
                    break

        # OR position relative to PDH/PDL
        or_vs_pd = "inside"
        if or_high > pdh:
            or_vs_pd = "above_pdh"
        elif or_low < pdl:
            or_vs_pd = "below_pdl"

        results.append({
            "date": date_str,
            "dir": bo_dir,
            "or_range": or_range,
            "bo_bar": bo_bar,
            "conf": conf,
            "rvol": rvol,
            "body_ratio": body_ratio,
            "extension_pct": extension_pct,
            "follow_through": ft,
            "stop_hit": stop_hit_first,
            "targets": targets_hit,
            "or_vs_pd": or_vs_pd,
        })

    # Analysis tables
    print(f"\n  {'Date':<12} {'Dir':>5} {'OR':>7} {'Bar':>4} {'Conf':>5} {'RVOL':>6} {'Body%':>6} {'Ext%':>6} {'FT':>7} {'Stop?':>6} {'1R':>4} {'1.5R':>5} {'2R':>4} {'2.5R':>5} {'3R':>4} {'OR/PD':>10}")
    print(f"  {'-'*12} {'-'*5} {'-'*7} {'-'*4} {'-'*5} {'-'*6} {'-'*6} {'-'*6} {'-'*7} {'-'*6} {'-'*4} {'-'*5} {'-'*4} {'-'*5} {'-'*4} {'-'*10}")

    for r in results:
        t = r["targets"]
        print(f"  {r['date']:<12} {r['dir']:>5} {r['or_range']:>7.2f} {r['bo_bar']:>4} {r['conf']:>5} {r['rvol']:>6.2f} {r['body_ratio']:>5.0f}% {r['extension_pct']:>5.0f}% {r['follow_through']:>7.2f} {'YES' if r['stop_hit'] else 'no':>6} {'Y' if t.get(1.0) else 'n':>4} {'Y' if t.get(1.5) else 'n':>5} {'Y' if t.get(2.0) else 'n':>4} {'Y' if t.get(2.5) else 'n':>5} {'Y' if t.get(3.0) else 'n':>4} {r['or_vs_pd']:>10}")

    # Statistics
    total = len(results)
    if total == 0:
        print("  No breakouts found")
        return

    # Win rates at different R:R targets
    print(f"\n  TARGET HIT RATES (all breakouts, n={total}):")
    for rr in [1.0, 1.5, 2.0, 2.5, 3.0]:
        hits = sum(1 for r in results if r["targets"].get(rr, False) and not r["stop_hit"])
        stops = sum(1 for r in results if r["stop_hit"])
        neither = total - hits - stops
        print(f"    {rr}R: {hits}/{total} hit target ({100*hits/total:.0f}%), {stops} stopped, {neither} timeout")

    # Confluence filtering effectiveness
    print(f"\n  CONFLUENCE FILTER ANALYSIS:")
    for min_conf in [1, 2, 3, 4]:
        filtered = [r for r in results if r["conf"] >= min_conf]
        if not filtered: continue
        wins_1_5 = sum(1 for r in filtered if r["targets"].get(1.5) and not r["stop_hit"])
        stops = sum(1 for r in filtered if r["stop_hit"])
        print(f"    Conf >= {min_conf}: {len(filtered)} trades, {wins_1_5} wins at 1.5R ({100*wins_1_5/len(filtered):.0f}% WR), {stops} stops")

    # RVOL filter analysis
    print(f"\n  RVOL FILTER ANALYSIS:")
    for min_rvol in [0.5, 0.7, 1.0, 1.2, 1.5]:
        filtered = [r for r in results if r["rvol"] >= min_rvol]
        if not filtered: continue
        wins = sum(1 for r in filtered if r["targets"].get(1.5) and not r["stop_hit"])
        print(f"    RVOL >= {min_rvol}: {len(filtered)} trades, {wins} wins ({100*wins/len(filtered):.0f}% WR)")

    # Body ratio analysis
    print(f"\n  BREAKOUT BAR BODY RATIO ANALYSIS:")
    for min_body in [0.3, 0.5, 0.6, 0.7]:
        filtered = [r for r in results if r["body_ratio"] >= min_body]
        if not filtered: continue
        wins = sum(1 for r in filtered if r["targets"].get(1.5) and not r["stop_hit"])
        print(f"    Body >= {min_body*100:.0f}%: {len(filtered)} trades, {wins} wins ({100*wins/len(filtered):.0f}% WR)")

    # Extension analysis
    print(f"\n  BREAKOUT EXTENSION ANALYSIS:")
    for min_ext in [0.0, 0.05, 0.10, 0.20]:
        filtered = [r for r in results if r["extension_pct"] >= min_ext]
        if not filtered: continue
        wins = sum(1 for r in filtered if r["targets"].get(1.5) and not r["stop_hit"])
        print(f"    Extension >= {min_ext*100:.0f}%: {len(filtered)} trades, {wins} wins ({100*wins/len(filtered):.0f}% WR)")

    # OR range buckets
    print(f"\n  OR RANGE SIZE ANALYSIS:")
    ranges = sorted(set(r["or_range"] for r in results))
    if market == "ES":
        buckets = [(0, 5), (5, 8), (8, 12), (12, 20), (20, 100)]
    else:
        buckets = [(0, 15), (15, 25), (25, 35), (35, 50), (50, 200)]

    for lo, hi in buckets:
        filtered = [r for r in results if lo <= r["or_range"] < hi]
        if not filtered: continue
        wins = sum(1 for r in filtered if r["targets"].get(1.5) and not r["stop_hit"])
        print(f"    OR {lo}-{hi}pts: {len(filtered)} trades, {wins} wins ({100*wins/len(filtered):.0f}% WR)")

    # OR vs PD analysis
    print(f"\n  OR vs PREVIOUS DAY LEVELS:")
    for pos in ["inside", "above_pdh", "below_pdl"]:
        filtered = [r for r in results if r["or_vs_pd"] == pos]
        if not filtered: continue
        wins = sum(1 for r in filtered if r["targets"].get(1.5) and not r["stop_hit"])
        print(f"    {pos}: {len(filtered)} trades, {wins} wins ({100*wins/len(filtered):.0f}% WR)")


def analyze_daily_breakout_quality(bars, market):
    """Analyze what makes PDH/PDL breakouts succeed or fail."""
    print(f"\n{'='*80}")
    print(f"  PDH/PDL BREAKOUT QUALITY ANALYSIS — {market}")
    print(f"{'='*80}")

    days = _group_by_day(bars)
    results = []

    for i in range(2, len(days)):
        rth = get_rth_bars(days[i])
        prev_rth = get_rth_bars(days[i-1])
        prev2_rth = get_rth_bars(days[i-2])
        if len(rth) < 60 or not prev_rth: continue

        date_str = ts_to_et(rth[0].timestamp).strftime("%Y-%m-%d")
        pdh = max(b.high for b in prev_rth)
        pdl = min(b.low for b in prev_rth)

        # Check for PDH breakout
        for idx in range(3, min(len(rth), 300)):
            bar = rth[idx]
            if idx > 0 and rth[idx-1].close < pdh and bar.close > pdh:
                # PDH breakout found
                recent = rth[max(0,idx-20):idx+1]
                avg_vol = sum(b.volume for b in recent) / len(recent) if recent else 1
                rvol = bar.volume / avg_vol if avg_vol > 0 else 0

                # Test outcome
                entry = pdh
                stop_dist = max(b.high for b in rth[max(0,idx-10):idx+1]) - min(b.low for b in rth[max(0,idx-10):idx+1])
                stop = entry - stop_dist
                risk = stop_dist
                if risk < 0.25: continue

                won = False
                for fb in rth[idx+1:min(idx+61, len(rth))]:
                    if fb.low <= stop:
                        break
                    if fb.high >= entry + risk * 2.0:
                        won = True
                        break

                vwap_val = None
                try:
                    vdata = calculate_vwap(rth[:idx+1])
                    if vdata: vwap_val = vdata[-1].vwap
                except: pass

                vwap_above = vwap_val and bar.close > vwap_val

                results.append({
                    "date": date_str, "dir": "long", "level": "PDH",
                    "bar_idx": idx, "rvol": rvol, "won": won,
                    "vwap_above": vwap_above, "risk": risk,
                })
                break

        # Check for PDL breakdown
        for idx in range(3, min(len(rth), 300)):
            bar = rth[idx]
            if idx > 0 and rth[idx-1].close > pdl and bar.close < pdl:
                recent = rth[max(0,idx-20):idx+1]
                avg_vol = sum(b.volume for b in recent) / len(recent) if recent else 1
                rvol = bar.volume / avg_vol if avg_vol > 0 else 0

                entry = pdl
                stop_dist = max(b.high for b in rth[max(0,idx-10):idx+1]) - min(b.low for b in rth[max(0,idx-10):idx+1])
                stop = entry + stop_dist
                risk = stop_dist
                if risk < 0.25: continue

                won = False
                for fb in rth[idx+1:min(idx+61, len(rth))]:
                    if fb.high >= stop:
                        break
                    if fb.low <= entry - risk * 2.0:
                        won = True
                        break

                vwap_val = None
                try:
                    vdata = calculate_vwap(rth[:idx+1])
                    if vdata: vwap_val = vdata[-1].vwap
                except: pass

                vwap_below = vwap_val and bar.close < vwap_val

                results.append({
                    "date": date_str, "dir": "short", "level": "PDL",
                    "bar_idx": idx, "rvol": rvol, "won": won,
                    "vwap_above": not vwap_below if vwap_val else None, "risk": risk,
                })
                break

    if not results:
        print("  No PDH/PDL breakouts found")
        return

    total = len(results)
    wins = sum(1 for r in results if r["won"])
    print(f"\n  Total PDH/PDL breakouts: {total}")
    print(f"  Win rate at 2R: {100*wins/total:.1f}%")

    print(f"\n  {'Date':<12} {'Dir':>5} {'Level':>5} {'Bar':>4} {'RVOL':>6} {'VWAP':>6} {'Risk':>7} {'Won?':>5}")
    for r in results:
        vwap_str = "align" if r["vwap_above"] is True else ("bad" if r["vwap_above"] is False else "N/A")
        print(f"  {r['date']:<12} {r['dir']:>5} {r['level']:>5} {r['bar_idx']:>4} {r['rvol']:>6.2f} {vwap_str:>6} {r['risk']:>7.2f} {'WIN' if r['won'] else 'LOSS':>5}")

    # Filters
    print(f"\n  FILTER ANALYSIS:")
    for filter_name, filter_fn in [
        ("VWAP aligned", lambda r: (r["vwap_above"] is True and r["dir"] == "long") or (r["vwap_above"] is False and r["dir"] == "short")),
        ("RVOL >= 0.7", lambda r: r["rvol"] >= 0.7),
        ("RVOL >= 1.0", lambda r: r["rvol"] >= 1.0),
        ("Bar <= 60", lambda r: r["bar_idx"] <= 60),
        ("Bar <= 120", lambda r: r["bar_idx"] <= 120),
        ("VWAP + RVOL>=0.7", lambda r: ((r["vwap_above"] is True and r["dir"] == "long") or (r["vwap_above"] is False and r["dir"] == "short")) and r["rvol"] >= 0.7),
    ]:
        filtered = [r for r in results if filter_fn(r)]
        if not filtered: continue
        w = sum(1 for r in filtered if r["won"])
        print(f"    {filter_name:<25}: {len(filtered)} trades, {w} wins ({100*w/len(filtered):.0f}% WR)")


def analyze_poc_rejection_quality(bars, market):
    """Analyze POC rejection patterns in detail."""
    print(f"\n{'='*80}")
    print(f"  POC REJECTION QUALITY ANALYSIS — {market}")
    print(f"{'='*80}")

    days = _group_by_day(bars)
    results = []

    for i in range(2, len(days)):
        rth = get_rth_bars(days[i])
        if len(rth) < 60: continue
        date_str = ts_to_et(rth[0].timestamp).strftime("%Y-%m-%d")

        # Compute daily POC from volume profile
        vol_prices = defaultdict(int)
        for b in rth:
            mid = round((b.high + b.low) / 2 / 0.25) * 0.25
            vol_prices[mid] += b.volume
        if not vol_prices: continue
        poc = max(vol_prices, key=vol_prices.get)

        # Look for POC rejections throughout the day
        for idx in range(10, min(len(rth)-5, 300)):
            bar = rth[idx]
            if idx < 3: continue

            b3, b2, b1 = rth[idx-3], rth[idx-2], rth[idx-1]

            # Long rejection: 3 bars below, current close above
            approaching_below = b3.close < poc and b2.close < poc and b1.close < poc
            rejection_up = bar.close > poc and bar.low <= poc + abs(bar.high - bar.low)

            if approaching_below and rejection_up:
                recent = rth[max(0,idx-20):idx+1]
                avg_vol = sum(b.volume for b in recent) / len(recent) if recent else 1
                rvol = bar.volume / avg_vol if avg_vol > 0 else 0

                # Test: does it go higher?
                entry = poc + 0.5
                stop = min(b2.low, b1.low, bar.low) - 0.25
                risk = entry - stop
                if risk < 0.5: continue

                won = False
                for fb in rth[idx+1:min(idx+61, len(rth))]:
                    if fb.low <= stop:
                        break
                    if fb.high >= entry + risk * 1.5:
                        won = True
                        break

                results.append({
                    "date": date_str, "dir": "long", "bar_idx": idx,
                    "poc": poc, "rvol": rvol, "risk": risk, "won": won,
                })
                break  # One per day

    if not results:
        print("  No POC rejections found")
        return

    total = len(results)
    wins = sum(1 for r in results if r["won"])
    print(f"\n  Total POC rejections: {total}")
    print(f"  Win rate at 1.5R: {100*wins/total:.1f}%")

    print(f"\n  {'Date':<12} {'Dir':>5} {'Bar':>4} {'POC':>10} {'RVOL':>6} {'Risk':>7} {'Won?':>5}")
    for r in results:
        print(f"  {r['date']:<12} {r['dir']:>5} {r['bar_idx']:>4} {r['poc']:>10.2f} {r['rvol']:>6.2f} {r['risk']:>7.2f} {'WIN' if r['won'] else 'LOSS':>5}")


def analyze_tighter_stops(bars, market, tick_val):
    """Test: What if we use ATR-based stops instead of OR-edge stops?"""
    print(f"\n{'='*80}")
    print(f"  STOP PLACEMENT DEEP ANALYSIS — {market}")
    print(f"{'='*80}")

    days = _group_by_day(bars)
    rth_days = [get_rth_bars(d) for d in days if len(get_rth_bars(d)) >= 60]

    stop_modes = {
        "full_or": lambda entry, or_range, atr, direction: or_range,
        "0.75x_or": lambda entry, or_range, atr, direction: or_range * 0.75,
        "0.5x_or": lambda entry, or_range, atr, direction: or_range * 0.5,
        "2x_atr": lambda entry, or_range, atr, direction: atr * 2.0,
        "1.5x_atr": lambda entry, or_range, atr, direction: atr * 1.5,
        "1x_atr": lambda entry, or_range, atr, direction: atr * 1.0,
    }

    print(f"\n  {'Stop Mode':<15} {'Trades':>7} {'Wins':>5} {'WR%':>6} {'PF':>7} {'PnL$':>10} {'AvgW$':>8} {'AvgL$':>8}")
    print(f"  {'-'*15} {'-'*7} {'-'*5} {'-'*6} {'-'*7} {'-'*10} {'-'*8} {'-'*8}")

    for mode_name, stop_fn in stop_modes.items():
        trades = []
        for i in range(1, len(rth_days)):
            rth = rth_days[i]
            prev_rth = rth_days[i-1]
            if len(rth) < 60: continue

            or_high = max(b.high for b in rth[:30])
            or_low = min(b.low for b in rth[:30])
            or_range = or_high - or_low
            if or_range < 0.25: continue

            atr_bars = rth[10:30]
            atr = sum(b.high - b.low for b in atr_bars) / len(atr_bars) if atr_bars else or_range

            for idx in range(30, min(len(rth), 120)):
                bar = rth[idx]
                direction = None
                if bar.close > or_high and (idx == 30 or rth[idx-1].close <= or_high):
                    direction = "long"
                elif bar.close < or_low and (idx == 30 or rth[idx-1].close >= or_low):
                    direction = "short"
                if direction is None: continue

                stop_dist = stop_fn(0, or_range, atr, direction)
                if stop_dist < 0.25: stop_dist = 0.25

                if direction == "long":
                    entry = or_high
                    stop = entry - stop_dist
                    target = entry + stop_dist * 2.0
                else:
                    entry = or_low
                    stop = entry + stop_dist
                    target = entry - stop_dist * 2.0

                won = False
                pnl = 0.0
                for fb in rth[idx+1:min(idx+61, len(rth))]:
                    if direction == "long":
                        if fb.low <= stop:
                            pnl = stop - entry
                            break
                        if fb.high >= target:
                            pnl = target - entry
                            won = True
                            break
                    else:
                        if fb.high >= stop:
                            pnl = entry - stop
                            break
                        if fb.low <= target:
                            pnl = entry - target
                            won = True
                            break
                else:
                    last_b = rth[min(idx+60, len(rth)-1)]
                    pnl = (last_b.close - entry) if direction == "long" else (entry - last_b.close)
                    won = pnl > 0

                trades.append((won, pnl * tick_val / 0.25))
                break

        if not trades: continue
        total = len(trades)
        wins = sum(1 for w, _ in trades if w)
        losses = total - wins
        wr = 100 * wins / total
        gross_w = sum(p for w, p in trades if w)
        gross_l = abs(sum(p for w, p in trades if not w))
        pf = gross_w / gross_l if gross_l > 0 else 999
        total_pnl = sum(p for _, p in trades)
        avg_w = gross_w / wins if wins else 0
        avg_l = -gross_l / losses if losses else 0

        print(f"  {mode_name:<15} {total:>7} {wins:>5} {wr:>5.1f}% {pf:>7.2f} {total_pnl:>+10.2f} {avg_w:>8.2f} {avg_l:>8.2f}")


def main():
    print("=" * 80)
    print("  EXTENDED ANALYSIS — Targeted Improvements for Engine v7")
    print("=" * 80)

    bars_nq = fetch_bars_as_models("NQ", days=35)
    bars_es = fetch_bars_as_models("ES", days=35)
    print(f"  NQ: {len(bars_nq)} bars, ES: {len(bars_es)} bars")

    # Detailed OR breakout analysis
    analyze_or_breakout_quality(bars_nq, "NQ")
    analyze_or_breakout_quality(bars_es, "ES")

    # PDH/PDL breakout analysis
    analyze_daily_breakout_quality(bars_nq, "NQ")
    analyze_daily_breakout_quality(bars_es, "ES")

    # POC rejection analysis
    analyze_poc_rejection_quality(bars_nq, "NQ")
    analyze_poc_rejection_quality(bars_es, "ES")

    # Stop placement analysis
    analyze_tighter_stops(bars_nq, "NQ", 5.0)
    analyze_tighter_stops(bars_es, "ES", 12.50)

    print(f"\n{'='*80}")
    print("  EXTENDED ANALYSIS COMPLETE")
    print(f"{'='*80}")


if __name__ == "__main__":
    main()

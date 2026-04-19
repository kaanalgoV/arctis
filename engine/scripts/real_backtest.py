"""Honest backtest that mirrors the production /api/analysis/bias pipeline.

The stock run_backtest in backtester.py passes only `trend` to calculate_bias_state,
which makes every non-trending day collapse to RANGE score=0 and filters out all
signals. The real /api/analysis/bias endpoint feeds velocity, vwap_position,
ema_alignment, and auction_quality. This script replicates that so the backtest
reflects what the engine actually computes live.

Usage:
    .venv/Scripts/python.exe engine/scripts/real_backtest.py
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from arctis.db import fetch_bars_as_models
from arctis.analysis.zones import calculate_zones
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.naked_poc import find_naked_pocs
from arctis.analysis.key_levels import find_key_levels
from arctis.analysis.signals import detect_signals
from arctis.analysis.vwap import calculate_vwap
from arctis.analysis.indicators import calculate_ema_ribbon
from arctis.analysis.velocity import calculate_velocity
from arctis.analysis.auction import calculate_auction_quality
from arctis.analysis.backtester import _evaluate_signal


def group_by_utc_date(bars):
    buckets = defaultdict(list)
    for b in bars:
        d = datetime.fromtimestamp(b.timestamp, tz=timezone.utc).date()
        buckets[d].append(b)
    return [buckets[k] for k in sorted(buckets.keys())]


def trim_to_rth(day_bars):
    """Keep only RTH bars (13:30-20:00 UTC = 09:30-16:00 ET).

    The backtester checkpoints go up to bar 360, and detect_signals() rejects
    non-RTH sessions, so a day that starts at overnight makes the whole loop
    go nowhere. Trimming to RTH makes checkpoint N = N bars into the session.
    """
    out = []
    for b in day_bars:
        dt = datetime.fromtimestamp(b.timestamp, tz=timezone.utc)
        minute = dt.hour * 60 + dt.minute
        # 13:30 UTC = 810 min (09:30 ET), 20:00 UTC = 1200 min (16:00 ET during DST)
        # Accept DST shift: also cover 14:30-21:00 UTC for non-DST periods.
        if 810 <= minute <= 1200 or 870 <= minute <= 1260:
            out.append(b)
    return out


def price_vs_vwap_position(price: float, vwap: float) -> str:
    diff_pct = (price - vwap) / vwap * 100
    if diff_pct > 0.15:
        return "weit_oben"
    if diff_pct > 0.02:
        return "above"
    if diff_pct < -0.15:
        return "weit_unten"
    if diff_pct < -0.02:
        return "below"
    return "at"


def price_vs_ema_alignment(price: float, ema9: float, ema21: float) -> str:
    if price > ema9 > ema21:
        return "bullish"
    if price < ema9 < ema21:
        return "bearish"
    if ema9 > ema21:
        return "slightly_bullish"
    if ema9 < ema21:
        return "slightly_bearish"
    return "mixed"


def compute_bias_inputs(all_bars):
    """Compute the 5 bias inputs the live /api/analysis/bias endpoint uses."""
    if len(all_bars) < 30:
        return dict(trend="range", velocity_scale=0, auction_quality="moderat",
                    vwap_position="at", ema_alignment="mixed", vwap_value=None)

    price = all_bars[-1].close

    swings = detect_swings(all_bars)
    trend = classify_trend(swings).value

    try:
        vel_list = calculate_velocity(all_bars)
        velocity_scale = vel_list[-1].signed_scale if vel_list else 0
    except Exception:
        velocity_scale = 0

    try:
        auction = calculate_auction_quality(all_bars)
        auction_quality = auction.quality_label if auction else "moderat"
    except Exception:
        auction_quality = "moderat"

    try:
        vwap_list = calculate_vwap(all_bars)
        vwap_val = vwap_list[-1].vwap if vwap_list else None
        vwap_position = price_vs_vwap_position(price, vwap_val) if vwap_val else "at"
    except Exception:
        vwap_val = None
        vwap_position = "at"

    try:
        ema_list = calculate_ema_ribbon(all_bars)
        if ema_list:
            last = ema_list[-1]
            ema_alignment = price_vs_ema_alignment(price, last.ema9, last.ema21)
        else:
            ema_alignment = "mixed"
    except Exception:
        ema_alignment = "mixed"

    return dict(
        trend=trend,
        velocity_scale=velocity_scale,
        auction_quality=auction_quality,
        vwap_position=vwap_position,
        ema_alignment=ema_alignment,
        vwap_value=vwap_val,
    )


def run_proper_backtest(bars, market_root="NQ", max_bars_held=60):
    days = group_by_utc_date(bars)
    if len(days) < 3:
        return None

    all_results = []
    seen_signals = set()
    daily_counts = []

    for day_idx in range(2, len(days)):
        # Keep only RTH bars for the test day; use full context from prior days
        current_day_full = days[day_idx]
        current_day = trim_to_rth(current_day_full)
        if len(current_day) < 60:
            continue

        context_bars = []
        for d in days[:day_idx]:
            context_bars.extend(d)

        day_date = datetime.fromtimestamp(
            current_day[0].timestamp, tz=timezone.utc
        ).strftime("%Y-%m-%d")

        zones = calculate_zones(context_bars + current_day[:30])
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

        try:
            npocs = find_naked_pocs(context_bars[-2000:])
            naked_poc_prices = [p.poc_price for p in npocs if p.is_naked][:5]
        except Exception:
            naked_poc_prices = []

        try:
            kls = find_key_levels(context_bars[-2000:])
            kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls[:10]]
        except Exception:
            kl_dicts = []

        checkpoints = list(range(5, min(len(current_day), 361), 5))
        day_sig_count = 0
        bias_samples = []

        for cp in checkpoints:
            if cp >= len(current_day):
                break

            test_bars = context_bars + current_day[:cp]

            # Full bias inputs (this is the critical fix)
            bias_in = compute_bias_inputs(test_bars)
            bias = calculate_bias_state(
                test_bars,
                trend=bias_in["trend"],
                velocity_scale=bias_in["velocity_scale"],
                auction_quality=bias_in["auction_quality"],
                vwap_position=bias_in["vwap_position"],
                ema_alignment=bias_in["ema_alignment"],
            )
            if cp == checkpoints[len(checkpoints) // 2]:
                bias_samples.append(f"midday state={bias.state.value} score={bias.score}")

            try:
                signals = detect_signals(
                    test_bars,
                    bias.state.value,
                    bias.score,
                    poc, vah, val,
                    prev_high, prev_low,
                    or_high, or_low,
                    ib_high, ib_low,
                    naked_poc_prices,
                    kl_dicts,
                    vwap=bias_in["vwap_value"],
                    session_bar_idx=cp,
                    market_root=market_root,
                )
            except Exception:
                continue

            future_bars = current_day[cp:]

            for sig in signals:
                sig_key = (
                    day_date,
                    sig.signal_type,
                    sig.direction,
                    round(sig.entry_price * 4) / 4,
                )
                if sig_key in seen_signals:
                    continue
                seen_signals.add(sig_key)
                day_sig_count += 1

                result = _evaluate_signal(sig, future_bars, max_bars_held)
                if result is not None:
                    result.date = day_date
                    result.confidence = sig.confidence
                    all_results.append(result)

        daily_counts.append({
            "date": day_date,
            "signals": day_sig_count,
            "bias_midday": bias_samples[0] if bias_samples else "n/a",
        })

    return all_results, daily_counts


def compile_report(results):
    if not results:
        return {
            "total_trades": 0,
            "wins": 0,
            "losses": 0,
            "win_rate": 0.0,
            "avg_r": 0.0,
            "profit_factor": 0.0,
            "by_type": {},
            "by_confidence": {},
        }

    wins = sum(1 for r in results if r.won)
    losses = len(results) - wins
    win_rate = wins / len(results)
    avg_r = sum(r.r_multiple for r in results) / len(results)

    gross_profit = sum(r.r_multiple for r in results if r.r_multiple > 0)
    gross_loss = -sum(r.r_multiple for r in results if r.r_multiple < 0)
    pf = (gross_profit / gross_loss) if gross_loss > 0 else float("inf")

    by_type = defaultdict(lambda: {"trades": 0, "wins": 0, "r_sum": 0.0})
    for r in results:
        t = by_type[r.signal_type]
        t["trades"] += 1
        if r.won:
            t["wins"] += 1
        t["r_sum"] += r.r_multiple

    by_type_out = {
        k: {
            "trades": v["trades"],
            "wins": v["wins"],
            "win_rate": round(v["wins"] / v["trades"], 3),
            "avg_r": round(v["r_sum"] / v["trades"], 3),
        }
        for k, v in by_type.items()
    }

    by_conf = defaultdict(lambda: {"trades": 0, "wins": 0, "r_sum": 0.0})
    for r in results:
        c = r.confidence or "medium"
        by_conf[c]["trades"] += 1
        if r.won:
            by_conf[c]["wins"] += 1
        by_conf[c]["r_sum"] += r.r_multiple

    by_conf_out = {
        k: {
            "trades": v["trades"],
            "win_rate": round(v["wins"] / v["trades"], 3),
            "avg_r": round(v["r_sum"] / v["trades"], 3),
        }
        for k, v in by_conf.items()
    }

    return {
        "total_trades": len(results),
        "wins": wins,
        "losses": losses,
        "win_rate": round(win_rate, 3),
        "avg_r": round(avg_r, 3),
        "profit_factor": round(pf, 3) if pf != float("inf") else "inf",
        "by_type": by_type_out,
        "by_confidence": by_conf_out,
    }


def main():
    combined = {}
    for market in ("NQ", "ES"):
        for tf in ("1min", "5min"):
            key = f"{market}_{tf}"
            print(f"\n=== {key} ===", flush=True)
            try:
                bars = fetch_bars_as_models(market=market, days=30, timeframe=tf)
                print(f"  Bars: {len(bars)}  days: {len(group_by_utc_date(bars))}", flush=True)
                if len(bars) < 500:
                    combined[key] = {"note": "insufficient bars"}
                    continue

                result = run_proper_backtest(bars, market_root=market)
                if result is None:
                    combined[key] = {"note": "too few days"}
                    continue
                trades, daily_counts = result
                report = compile_report(trades)
                report["daily_counts"] = daily_counts
                report["sample_trades"] = [
                    {
                        "type": r.signal_type,
                        "dir": r.direction,
                        "entry": round(r.entry_price, 2),
                        "stop": round(r.stop_price, 2),
                        "target": round(r.target_price, 2),
                        "exit": round(r.exit_price, 2),
                        "r": round(r.r_multiple, 2),
                        "won": r.won,
                        "bars": r.bars_held,
                        "date": r.date,
                        "confidence": r.confidence,
                        "reason": r.exit_reason,
                    }
                    for r in trades[:20]
                ]
                combined[key] = report
                summary_only = {k: v for k, v in report.items() if k not in ("sample_trades", "daily_counts")}
                print(json.dumps(summary_only, indent=2), flush=True)
            except Exception as e:
                import traceback
                traceback.print_exc()
                combined[key] = {"error": str(e)}

    out = Path(__file__).resolve().parents[2] / "audit" / "backtest_real_2026-04-19.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(combined, indent=2), encoding="utf-8")
    print(f"\nReport written: {out}")


if __name__ == "__main__":
    main()

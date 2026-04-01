#!/usr/bin/env python3
"""
ARCTIS ENGINE — DEEP ANALYSIS + STRATEGY OPTIMIZATION SPRINT
=============================================================
Phase 1: Deep day-by-day analysis (day types, OR, breakouts, failures)
Phase 2: 10+ strategy variant backtests
Phase 3: Walk-forward validation (in-sample / out-of-sample)
Phase 4: Market-specific optimization (ES vs NQ)
Phase 5: Production parameter recommendations

Run: python deep_analysis.py
"""

import sys
import os
import time
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from collections import defaultdict
from zoneinfo import ZoneInfo

# Add engine source to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from arctis.db import fetch_bars_as_models
from arctis.models import OHLCVBar
from arctis.analysis.zones import _group_by_day
from arctis.analysis.vwap import calculate_vwap
from arctis.analysis.signals import (
    detect_signals, TradeSignal,
    _count_confirmations, _round_tick, _swing_stop, _ticks,
    _NQ_TICK_SIZE, _MAX_STOP_TICKS, _MIN_STOP_TICKS,
)
from arctis.analysis.backtester import (
    run_backtest, _evaluate_signal, _compile_report, TradeResult, BacktestReport,
)
from arctis.analysis.zones import calculate_zones
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.naked_poc import find_naked_pocs
from arctis.analysis.key_levels import find_key_levels
from arctis.analysis.sessions import classify_session, Session

ET = ZoneInfo("America/New_York")

# ============================================================================
# UTILITIES
# ============================================================================

def ts_to_et(ts: int) -> datetime:
    return datetime.fromtimestamp(ts, tz=timezone.utc).astimezone(ET)

def get_rth_bars(day_bars: list[OHLCVBar]) -> list[OHLCVBar]:
    """Filter to RTH bars only (09:30-16:00 ET)."""
    rth = []
    for b in day_bars:
        dt = ts_to_et(b.timestamp)
        t = dt.hour * 60 + dt.minute
        if 570 <= t < 960:  # 09:30 - 16:00
            rth.append(b)
    return rth

def classify_day_type(rth_bars: list[OHLCVBar]) -> str:
    """Classify trading day type based on price action."""
    if len(rth_bars) < 30:
        return "insufficient"

    opens = rth_bars[0].open
    closes = rth_bars[-1].close
    high = max(b.high for b in rth_bars)
    low = min(b.low for b in rth_bars)
    day_range = high - low

    if day_range < 0.01:
        return "flat"

    net_change = closes - opens
    net_pct = abs(net_change) / day_range

    # Check for reversal: early trend then opposite close
    mid_idx = len(rth_bars) // 2
    first_half_close = rth_bars[mid_idx].close
    first_half_move = first_half_close - opens
    second_half_move = closes - first_half_close

    if abs(first_half_move) > day_range * 0.3 and abs(second_half_move) > day_range * 0.3:
        if (first_half_move > 0 and second_half_move < 0) or (first_half_move < 0 and second_half_move > 0):
            return "reversal"

    if net_pct > 0.5:
        if net_change > 0:
            return "trend_up"
        else:
            return "trend_down"
    else:
        return "range"

def compute_or(rth_bars: list[OHLCVBar], or_minutes: int = 30) -> tuple[float, float, float]:
    """Compute Opening Range high, low, range from RTH bars."""
    or_bar_count = or_minutes  # 1-min bars
    or_bars = rth_bars[:or_bar_count]
    if not or_bars:
        return 0, 0, 0
    or_high = max(b.high for b in or_bars)
    or_low = min(b.low for b in or_bars)
    return or_high, or_low, or_high - or_low

def compute_prev_day_levels(prev_rth: list[OHLCVBar]) -> tuple[float, float]:
    """Return PDH, PDL from previous day RTH bars."""
    if not prev_rth:
        return 0, 0
    return max(b.high for b in prev_rth), min(b.low for b in prev_rth)

def compute_vwap_at_bar(rth_bars: list[OHLCVBar], idx: int) -> float | None:
    """Compute VWAP up to bar index."""
    if idx < 2:
        return None
    try:
        vdata = calculate_vwap(rth_bars[:idx])
        if vdata:
            return vdata[-1].vwap
    except:
        pass
    return None

def compute_ema(prices: list[float], period: int) -> list[float]:
    """Simple EMA computation."""
    if len(prices) < period:
        return []
    mult = 2.0 / (period + 1)
    ema = [sum(prices[:period]) / period]
    for i in range(period, len(prices)):
        ema.append(prices[i] * mult + ema[-1] * (1 - mult))
    return ema


# ============================================================================
# PHASE 1: DEEP DAY-BY-DAY ANALYSIS
# ============================================================================

@dataclass
class DayAnalysis:
    date: str
    day_type: str
    or_high: float
    or_low: float
    or_range: float
    or_breakout: bool
    breakout_direction: str
    breakout_bar_idx: int
    breakout_succeeded: bool
    breakout_pnl_ticks: float
    confluence_at_breakout: int
    vwap_position: str  # "above" / "below" / "at"
    ema_alignment: str  # "bullish" / "bearish" / "mixed"
    volume_ratio: float  # breakout bar vol / avg vol
    pdh: float
    pdl: float
    day_high: float
    day_low: float
    day_close: float
    rth_bar_count: int

@dataclass
class FailurePattern:
    day_type: str
    confluence: int
    or_range: float
    entry_bar_idx: int
    vwap_pos: str
    ema_align: str
    volume_ratio: float
    reason: str

def analyze_day(rth_bars: list[OHLCVBar], prev_rth: list[OHLCVBar],
                date_str: str, or_minutes: int = 30) -> DayAnalysis:
    """Analyze a single trading day in detail."""
    day_type = classify_day_type(rth_bars)
    or_high, or_low, or_range = compute_or(rth_bars, or_minutes)
    pdh, pdl = compute_prev_day_levels(prev_rth)

    day_high = max(b.high for b in rth_bars)
    day_low = min(b.low for b in rth_bars)
    day_close = rth_bars[-1].close

    # Find first OR breakout
    breakout = False
    breakout_dir = ""
    breakout_idx = 0
    breakout_succeeded = False
    breakout_pnl = 0.0
    confluence = 0
    vwap_pos = "none"
    ema_align = "none"
    vol_ratio = 0.0

    if or_range > 0 and len(rth_bars) > or_minutes:
        for i in range(or_minutes, min(len(rth_bars), or_minutes + 120)):
            bar = rth_bars[i]
            if bar.close > or_high:
                breakout = True
                breakout_dir = "long"
                breakout_idx = i
                break
            elif bar.close < or_low:
                breakout = True
                breakout_dir = "short"
                breakout_idx = i
                break

        if breakout and breakout_idx > 0:
            # Analyze breakout conditions
            # Confluence
            recent = rth_bars[max(0, breakout_idx-20):breakout_idx+1]
            avg_vol = sum(b.volume for b in recent) / len(recent) if recent else 1

            vwap_val = compute_vwap_at_bar(rth_bars, breakout_idx)
            confluence = _count_confirmations(
                rth_bars[:breakout_idx+1], breakout_dir, "RANGE", avg_vol, vwap_val
            )

            # VWAP position
            if vwap_val:
                if rth_bars[breakout_idx].close > vwap_val:
                    vwap_pos = "above"
                elif rth_bars[breakout_idx].close < vwap_val:
                    vwap_pos = "below"
                else:
                    vwap_pos = "at"

            # EMA alignment
            closes = [b.close for b in rth_bars[:breakout_idx+1]]
            if len(closes) >= 21:
                ema9 = compute_ema(closes, 9)
                ema21 = compute_ema(closes, 21)
                if ema9 and ema21:
                    e9 = ema9[-1]
                    e21 = ema21[-1]
                    if e9 > e21:
                        ema_align = "bullish"
                    elif e9 < e21:
                        ema_align = "bearish"
                    else:
                        ema_align = "mixed"

            # Volume ratio
            bk_bar = rth_bars[breakout_idx]
            vol_ratio = bk_bar.volume / avg_vol if avg_vol > 0 else 0

            # Did breakout succeed? (hit 1.5R before stop)
            risk = or_range
            if breakout_dir == "long":
                entry = or_high
                stop = or_low
                target = entry + risk * 1.5
                for future_bar in rth_bars[breakout_idx+1:]:
                    if future_bar.low <= stop:
                        breakout_succeeded = False
                        breakout_pnl = stop - entry
                        break
                    if future_bar.high >= target:
                        breakout_succeeded = True
                        breakout_pnl = target - entry
                        break
                else:
                    # Timeout - close at EOD
                    breakout_pnl = rth_bars[-1].close - entry
                    breakout_succeeded = breakout_pnl > 0
            else:
                entry = or_low
                stop = or_high
                target = entry - risk * 1.5
                for future_bar in rth_bars[breakout_idx+1:]:
                    if future_bar.high >= stop:
                        breakout_succeeded = False
                        breakout_pnl = entry - stop
                        break
                    if future_bar.low <= target:
                        breakout_succeeded = True
                        breakout_pnl = entry - target
                        break
                else:
                    breakout_pnl = entry - rth_bars[-1].close
                    breakout_succeeded = breakout_pnl > 0

    return DayAnalysis(
        date=date_str,
        day_type=day_type,
        or_high=or_high,
        or_low=or_low,
        or_range=round(or_range, 2),
        or_breakout=breakout,
        breakout_direction=breakout_dir,
        breakout_bar_idx=breakout_idx,
        breakout_succeeded=breakout_succeeded,
        breakout_pnl_ticks=round(breakout_pnl / 0.25, 1) if or_range > 0 else 0,
        confluence_at_breakout=confluence,
        vwap_position=vwap_pos,
        ema_alignment=ema_align,
        volume_ratio=round(vol_ratio, 2),
        pdh=round(pdh, 2),
        pdl=round(pdl, 2),
        day_high=round(day_high, 2),
        day_low=round(day_low, 2),
        day_close=round(day_close, 2),
        rth_bar_count=len(rth_bars),
    )

def run_phase1(bars: list[OHLCVBar], market: str):
    """Phase 1: Deep analysis of every trading day."""
    print(f"\n{'='*80}")
    print(f"  PHASE 1: DEEP DAY-BY-DAY ANALYSIS — {market}")
    print(f"{'='*80}")

    days = _group_by_day(bars)
    analyses = []
    failures = []

    for i in range(1, len(days)):
        rth = get_rth_bars(days[i])
        prev_rth = get_rth_bars(days[i-1])

        if len(rth) < 30:
            continue

        date_str = ts_to_et(rth[0].timestamp).strftime("%Y-%m-%d")
        da = analyze_day(rth, prev_rth, date_str)
        analyses.append(da)

        if da.or_breakout and not da.breakout_succeeded:
            failures.append(FailurePattern(
                day_type=da.day_type,
                confluence=da.confluence_at_breakout,
                or_range=da.or_range,
                entry_bar_idx=da.breakout_bar_idx,
                vwap_pos=da.vwap_position,
                ema_align=da.ema_alignment,
                volume_ratio=da.volume_ratio,
                reason="OR breakout failed",
            ))

    # Print day-by-day table
    print(f"\n  {'Date':<12} {'Type':<12} {'OR Range':>10} {'BO?':>5} {'Dir':>6} {'OK?':>5} {'PnL Tk':>8} {'Conf':>5} {'VWAP':>7} {'EMA':>9} {'RVOL':>6}")
    print(f"  {'-'*12} {'-'*12} {'-'*10} {'-'*5} {'-'*6} {'-'*5} {'-'*8} {'-'*5} {'-'*7} {'-'*9} {'-'*6}")

    for da in analyses:
        bo_str = "YES" if da.or_breakout else "no"
        ok_str = "WIN" if da.breakout_succeeded else ("LOSS" if da.or_breakout else "-")
        pnl_str = f"{da.breakout_pnl_ticks:+.0f}" if da.or_breakout else "-"
        print(f"  {da.date:<12} {da.day_type:<12} {da.or_range:>10.2f} {bo_str:>5} {da.breakout_direction:>6} {ok_str:>5} {pnl_str:>8} {da.confluence_at_breakout:>5} {da.vwap_position:>7} {da.ema_alignment:>9} {da.volume_ratio:>6.2f}")

    # Summary statistics
    total_days = len(analyses)
    bo_days = [a for a in analyses if a.or_breakout]
    bo_wins = [a for a in bo_days if a.breakout_succeeded]
    bo_losses = [a for a in bo_days if not a.breakout_succeeded]

    print(f"\n  SUMMARY:")
    print(f"  Total trading days: {total_days}")
    print(f"  Days with OR breakout: {len(bo_days)} ({100*len(bo_days)/total_days:.0f}%)")
    if bo_days:
        print(f"  Breakout win rate: {100*len(bo_wins)/len(bo_days):.1f}%")
        print(f"  Avg OR range: {sum(a.or_range for a in bo_days)/len(bo_days):.2f} pts")
        if bo_wins:
            print(f"  Avg winning PnL: {sum(a.breakout_pnl_ticks for a in bo_wins)/len(bo_wins):+.1f} ticks")
        if bo_losses:
            print(f"  Avg losing PnL: {sum(a.breakout_pnl_ticks for a in bo_losses)/len(bo_losses):+.1f} ticks")

    # Day type analysis
    print(f"\n  DAY TYPE BREAKDOWN:")
    type_counts = defaultdict(lambda: {"total": 0, "bo": 0, "wins": 0, "losses": 0})
    for a in analyses:
        tc = type_counts[a.day_type]
        tc["total"] += 1
        if a.or_breakout:
            tc["bo"] += 1
            if a.breakout_succeeded:
                tc["wins"] += 1
            else:
                tc["losses"] += 1

    print(f"  {'Day Type':<12} {'Days':>5} {'BO':>5} {'Wins':>5} {'Loss':>5} {'WR':>8}")
    for dt, tc in sorted(type_counts.items()):
        wr = f"{100*tc['wins']/tc['bo']:.0f}%" if tc['bo'] > 0 else "N/A"
        print(f"  {dt:<12} {tc['total']:>5} {tc['bo']:>5} {tc['wins']:>5} {tc['losses']:>5} {wr:>8}")

    # Failure pattern analysis
    print(f"\n  FAILURE PATTERN ANALYSIS:")
    if failures:
        # By confluence
        conf_fail = defaultdict(int)
        for f in failures:
            conf_fail[f.confluence] += 1
        print(f"  Failures by confluence: {dict(sorted(conf_fail.items()))}")

        # By OR range buckets
        or_fail = defaultdict(int)
        for f in failures:
            bucket = f"<{int(f.or_range/5)*5+5}" if f.or_range < 50 else "50+"
            or_fail[bucket] += 1
        print(f"  Failures by OR range: {dict(sorted(or_fail.items()))}")

        # By VWAP position
        vwap_fail = defaultdict(int)
        for f in failures:
            vwap_fail[f.vwap_pos] += 1
        print(f"  Failures by VWAP position: {dict(sorted(vwap_fail.items()))}")

        # By EMA alignment
        ema_fail = defaultdict(int)
        for f in failures:
            ema_fail[f.ema_align] += 1
        print(f"  Failures by EMA alignment: {dict(sorted(ema_fail.items()))}")

        # By entry bar index (time of day)
        time_fail = defaultdict(int)
        for f in failures:
            if f.entry_bar_idx <= 45:
                time_fail["30-45 (early)"] += 1
            elif f.entry_bar_idx <= 60:
                time_fail["45-60 (mid)"] += 1
            elif f.entry_bar_idx <= 90:
                time_fail["60-90 (late)"] += 1
            else:
                time_fail["90+ (very late)"] += 1
        print(f"  Failures by entry time: {dict(sorted(time_fail.items()))}")

        # By volume ratio
        rvol_fail = defaultdict(int)
        for f in failures:
            if f.volume_ratio < 0.7:
                rvol_fail["<0.7 (low)"] += 1
            elif f.volume_ratio < 1.0:
                rvol_fail["0.7-1.0 (avg)"] += 1
            elif f.volume_ratio < 1.5:
                rvol_fail["1.0-1.5 (good)"] += 1
            else:
                rvol_fail["1.5+ (high)"] += 1
        print(f"  Failures by RVOL: {dict(sorted(rvol_fail.items()))}")
    else:
        print(f"  No failures found (all breakouts succeeded or no breakouts)")

    return analyses, failures


# ============================================================================
# PHASE 2: STRATEGY VARIANT TESTING
# ============================================================================

@dataclass
class StrategyConfig:
    name: str
    or_minutes: int = 30
    min_confluence: int = 2
    rr_target: float = 2.0
    stop_mode: str = "or_edge"  # "or_edge", "0.7x_or", "0.5x_or", "atr"
    rvol_filter: float = 0.7
    max_entry_bar: int = 120
    entry_confirm: str = "close"  # "close" (bar close) or "immediate" (high/low)
    time_filter: str = "all"  # "all" or "10-14"

@dataclass
class StrategyResult:
    config: StrategyConfig
    market: str
    total_trades: int
    wins: int
    losses: int
    win_rate: float
    profit_factor: float
    total_pnl_ticks: float
    total_pnl_dollars: float
    avg_win_ticks: float
    avg_loss_ticks: float
    max_drawdown_ticks: float

def backtest_strategy(rth_days: list[list[OHLCVBar]], config: StrategyConfig,
                      market: str, tick_value: float = 5.0) -> StrategyResult:
    """Run a specific strategy configuration on the given days."""
    results = []

    for i in range(1, len(rth_days)):
        rth = rth_days[i]
        prev_rth = rth_days[i-1]

        if len(rth) < config.or_minutes + 10:
            continue

        # Compute OR
        or_high, or_low, or_range = compute_or(rth, config.or_minutes)
        if or_range < 0.25:
            continue

        # PDH/PDL
        pdh, pdl = compute_prev_day_levels(prev_rth)

        # Time filter
        max_entry = config.max_entry_bar
        min_entry = config.or_minutes

        if config.time_filter == "10-14":
            # Only bars 30-270 (10:00-14:00 ET assuming 09:30 start)
            min_entry = max(min_entry, 30)
            max_entry = min(max_entry, 270)

        # Find breakout
        for bar_idx in range(min_entry, min(len(rth), max_entry)):
            bar = rth[bar_idx]

            # Check volume
            recent_start = max(0, bar_idx - 20)
            recent = rth[recent_start:bar_idx+1]
            avg_vol = sum(b.volume for b in recent) / len(recent) if recent else 1

            if avg_vol > 0 and bar.volume < avg_vol * config.rvol_filter:
                continue

            # Determine breakout
            direction = None
            if config.entry_confirm == "close":
                if bar.close > or_high and (bar_idx == min_entry or rth[bar_idx-1].close <= or_high):
                    direction = "long"
                elif bar.close < or_low and (bar_idx == min_entry or rth[bar_idx-1].close >= or_low):
                    direction = "short"
            else:  # immediate
                if bar.high > or_high and (bar_idx == min_entry or rth[bar_idx-1].high <= or_high):
                    direction = "long"
                elif bar.low < or_low and (bar_idx == min_entry or rth[bar_idx-1].low >= or_low):
                    direction = "short"

            if direction is None:
                continue

            # Check confluence
            vwap_val = compute_vwap_at_bar(rth, bar_idx)
            conf = _count_confirmations(rth[:bar_idx+1], direction, "RANGE", avg_vol, vwap_val)
            if conf < config.min_confluence:
                continue

            # Compute entry/stop/target
            if direction == "long":
                entry = or_high
                if config.stop_mode == "or_edge":
                    stop = or_low
                elif config.stop_mode == "0.7x_or":
                    stop = entry - or_range * 0.7
                elif config.stop_mode == "0.5x_or":
                    stop = entry - or_range * 0.5
                else:  # atr
                    atr_bars = rth[max(0,bar_idx-20):bar_idx+1]
                    atr = sum(b.high - b.low for b in atr_bars) / len(atr_bars)
                    stop = entry - atr * 1.5

                risk = entry - stop
                if risk <= 0:
                    continue
                target = entry + risk * config.rr_target

                # Forward test
                won = False
                pnl = 0.0
                exit_reason = "timeout"
                for fb in rth[bar_idx+1:min(bar_idx+61, len(rth))]:
                    if fb.low <= stop:
                        pnl = stop - entry
                        exit_reason = "stop"
                        break
                    if fb.high >= target:
                        pnl = target - entry
                        won = True
                        exit_reason = "target"
                        break
                else:
                    last_b = rth[min(bar_idx+60, len(rth)-1)]
                    pnl = last_b.close - entry
                    won = pnl > 0
                    exit_reason = "timeout"
            else:
                entry = or_low
                if config.stop_mode == "or_edge":
                    stop = or_high
                elif config.stop_mode == "0.7x_or":
                    stop = entry + or_range * 0.7
                elif config.stop_mode == "0.5x_or":
                    stop = entry + or_range * 0.5
                else:
                    atr_bars = rth[max(0,bar_idx-20):bar_idx+1]
                    atr = sum(b.high - b.low for b in atr_bars) / len(atr_bars)
                    stop = entry + atr * 1.5

                risk = stop - entry
                if risk <= 0:
                    continue
                target = entry - risk * config.rr_target

                won = False
                pnl = 0.0
                for fb in rth[bar_idx+1:min(bar_idx+61, len(rth))]:
                    if fb.high >= stop:
                        pnl = entry - stop
                        break
                    if fb.low <= target:
                        pnl = entry - target
                        won = True
                        break
                else:
                    last_b = rth[min(bar_idx+60, len(rth)-1)]
                    pnl = entry - last_b.close
                    won = pnl > 0

            pnl_ticks = pnl / 0.25
            results.append((won, pnl_ticks))
            break  # One trade per day

    # Compile
    total = len(results)
    wins_list = [r for r in results if r[0]]
    losses_list = [r for r in results if not r[0]]

    if total == 0:
        return StrategyResult(config, market, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

    win_count = len(wins_list)
    wr = round(100 * win_count / total, 1)

    gross_profit = sum(r[1] for r in wins_list) if wins_list else 0
    gross_loss = abs(sum(r[1] for r in losses_list)) if losses_list else 0
    pf = round(gross_profit / gross_loss, 2) if gross_loss > 0 else 999.0

    total_pnl = sum(r[1] for r in results)
    avg_win = gross_profit / len(wins_list) if wins_list else 0
    avg_loss = -gross_loss / len(losses_list) if losses_list else 0

    # Max drawdown
    equity = 0
    peak = 0
    max_dd = 0
    for _, pnl_t in results:
        equity += pnl_t
        peak = max(peak, equity)
        dd = peak - equity
        max_dd = max(max_dd, dd)

    return StrategyResult(
        config=config,
        market=market,
        total_trades=total,
        wins=win_count,
        losses=len(losses_list),
        win_rate=wr,
        profit_factor=pf,
        total_pnl_ticks=round(total_pnl, 1),
        total_pnl_dollars=round(total_pnl * 0.25 * tick_value, 2),
        avg_win_ticks=round(avg_win, 1),
        avg_loss_ticks=round(avg_loss, 1),
        max_drawdown_ticks=round(max_dd, 1),
    )

def run_phase2(bars_nq: list[OHLCVBar], bars_es: list[OHLCVBar]):
    """Phase 2: Test 10+ strategy configurations."""
    print(f"\n{'='*80}")
    print(f"  PHASE 2: STRATEGY VARIANT TESTING")
    print(f"{'='*80}")

    # Prepare day lists
    nq_days_raw = _group_by_day(bars_nq)
    es_days_raw = _group_by_day(bars_es)
    nq_days = [get_rth_bars(d) for d in nq_days_raw if len(get_rth_bars(d)) >= 30]
    es_days = [get_rth_bars(d) for d in es_days_raw if len(get_rth_bars(d)) >= 30]

    configs = [
        # Baseline (current v6)
        StrategyConfig("v6-baseline", or_minutes=30, min_confluence=2, rr_target=1.5,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=60),

        # Vary OR minutes
        StrategyConfig("OR15-conf2", or_minutes=15, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=60),
        StrategyConfig("OR45-conf2", or_minutes=45, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=90),

        # Vary confluence
        StrategyConfig("conf1-rr2", or_minutes=30, min_confluence=1, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("conf3-rr2", or_minutes=30, min_confluence=3, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120),

        # Vary R:R target
        StrategyConfig("rr1.5", or_minutes=30, min_confluence=2, rr_target=1.5,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("rr2.5", or_minutes=30, min_confluence=2, rr_target=2.5,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("rr3.0", or_minutes=30, min_confluence=2, rr_target=3.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120),

        # Vary stop placement
        StrategyConfig("stop-0.7x", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="0.7x_or", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("stop-0.5x", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="0.5x_or", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("stop-atr", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="atr", rvol_filter=0.7, max_entry_bar=120),

        # Vary RVOL filter
        StrategyConfig("rvol-0.5", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.5, max_entry_bar=120),
        StrategyConfig("rvol-1.0", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=1.0, max_entry_bar=120),

        # Vary max entry bar
        StrategyConfig("entry-60", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=60),
        StrategyConfig("entry-180", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=180),

        # Entry confirmation: immediate vs close
        StrategyConfig("immediate", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120, entry_confirm="immediate"),

        # Time filter 10:00-14:00
        StrategyConfig("time-10-14", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=270, time_filter="10-14"),

        # Combined best guesses
        StrategyConfig("tight-quality", or_minutes=30, min_confluence=3, rr_target=2.0,
                       stop_mode="0.7x_or", rvol_filter=0.7, max_entry_bar=60),
        StrategyConfig("wide-entry", or_minutes=30, min_confluence=2, rr_target=1.5,
                       stop_mode="or_edge", rvol_filter=0.5, max_entry_bar=180),
        StrategyConfig("aggressive", or_minutes=15, min_confluence=1, rr_target=1.5,
                       stop_mode="0.5x_or", rvol_filter=0.5, max_entry_bar=120),
    ]

    all_results = []

    for market_name, days, tick_val in [("NQ", nq_days, 5.0), ("ES", es_days, 12.50)]:
        print(f"\n  --- {market_name} ({len(days)} trading days) ---")
        print(f"  {'Config':<20} {'Trades':>7} {'Wins':>5} {'WR%':>6} {'PF':>6} {'PnL Tk':>8} {'PnL $':>10} {'AvgW':>7} {'AvgL':>7} {'MaxDD':>7}")
        print(f"  {'-'*20} {'-'*7} {'-'*5} {'-'*6} {'-'*6} {'-'*8} {'-'*10} {'-'*7} {'-'*7} {'-'*7}")

        market_results = []
        for cfg in configs:
            result = backtest_strategy(days, cfg, market_name, tick_val)
            market_results.append(result)
            all_results.append(result)

            pf_str = f"{result.profit_factor:.2f}" if result.profit_factor < 100 else "INF"
            print(f"  {cfg.name:<20} {result.total_trades:>7} {result.wins:>5} {result.win_rate:>5.1f}% {pf_str:>6} {result.total_pnl_ticks:>+8.0f} {result.total_pnl_dollars:>+10.2f} {result.avg_win_ticks:>7.1f} {result.avg_loss_ticks:>7.1f} {result.max_drawdown_ticks:>7.1f}")

        # Best config for this market
        profitable = [r for r in market_results if r.total_pnl_ticks > 0 and r.total_trades >= 3]
        if profitable:
            best = max(profitable, key=lambda r: r.profit_factor)
            print(f"\n  BEST {market_name}: {best.config.name} (PF {best.profit_factor:.2f}, WR {best.win_rate}%, {best.total_trades} trades)")
        else:
            print(f"\n  BEST {market_name}: No profitable config with 3+ trades")

    return all_results


# ============================================================================
# PHASE 3: WALK-FORWARD VALIDATION
# ============================================================================

def run_phase3(bars_nq: list[OHLCVBar], bars_es: list[OHLCVBar]):
    """Phase 3: Walk-forward validation with in-sample / out-of-sample split."""
    print(f"\n{'='*80}")
    print(f"  PHASE 3: WALK-FORWARD VALIDATION")
    print(f"{'='*80}")

    configs = [
        StrategyConfig("v6-baseline", or_minutes=30, min_confluence=2, rr_target=1.5,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=60),
        StrategyConfig("rr2-conf2", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("stop-0.7x", or_minutes=30, min_confluence=2, rr_target=2.0,
                       stop_mode="0.7x_or", rvol_filter=0.7, max_entry_bar=120),
        StrategyConfig("rr1.5-wide", or_minutes=30, min_confluence=2, rr_target=1.5,
                       stop_mode="or_edge", rvol_filter=0.5, max_entry_bar=180),
        StrategyConfig("tight-quality", or_minutes=30, min_confluence=3, rr_target=2.0,
                       stop_mode="0.7x_or", rvol_filter=0.7, max_entry_bar=60),
        StrategyConfig("OR15-fast", or_minutes=15, min_confluence=2, rr_target=2.0,
                       stop_mode="or_edge", rvol_filter=0.7, max_entry_bar=60),
    ]

    for market_name, bars, tick_val in [("NQ", bars_nq, 5.0), ("ES", bars_es, 12.50)]:
        days_raw = _group_by_day(bars)
        days = [get_rth_bars(d) for d in days_raw if len(get_rth_bars(d)) >= 30]

        if len(days) < 10:
            print(f"\n  {market_name}: Insufficient days ({len(days)}) for walk-forward")
            continue

        # Split: first ~65% in-sample, last ~35% out-of-sample
        split_idx = int(len(days) * 0.65)
        is_days = days[:split_idx]
        oos_days = days[split_idx:]

        is_dates = ts_to_et(is_days[0][0].timestamp).strftime("%m/%d") if is_days and is_days[0] else "?"
        is_date_end = ts_to_et(is_days[-1][0].timestamp).strftime("%m/%d") if is_days and is_days[-1] else "?"
        oos_dates = ts_to_et(oos_days[0][0].timestamp).strftime("%m/%d") if oos_days and oos_days[0] else "?"
        oos_date_end = ts_to_et(oos_days[-1][0].timestamp).strftime("%m/%d") if oos_days and oos_days[-1] else "?"

        print(f"\n  --- {market_name} ---")
        print(f"  In-Sample:      {len(is_days)} days ({is_dates}-{is_date_end})")
        print(f"  Out-of-Sample:  {len(oos_days)} days ({oos_dates}-{oos_date_end})")
        print()

        print(f"  {'Config':<20} {'IS Trades':>10} {'IS WR%':>8} {'IS PF':>7} {'IS PnL$':>10} | {'OOS Trades':>11} {'OOS WR%':>8} {'OOS PF':>8} {'OOS PnL$':>10} {'Overfit?':>10}")
        print(f"  {'-'*20} {'-'*10} {'-'*8} {'-'*7} {'-'*10} | {'-'*11} {'-'*8} {'-'*8} {'-'*10} {'-'*10}")

        best_is_pf = 0
        best_cfg = None

        for cfg in configs:
            is_result = backtest_strategy(is_days, cfg, market_name, tick_val)
            oos_result = backtest_strategy(oos_days, cfg, market_name, tick_val)

            is_pf = f"{is_result.profit_factor:.2f}" if is_result.profit_factor < 100 else "INF"
            oos_pf = f"{oos_result.profit_factor:.2f}" if oos_result.profit_factor < 100 else "INF"

            # Overfit detection: IS profitable but OOS is not, or big PF drop
            overfit = "NO"
            if is_result.profit_factor > 1.0 and oos_result.profit_factor < 0.8:
                overfit = "YES"
            elif is_result.profit_factor > 1.5 and oos_result.profit_factor < is_result.profit_factor * 0.5:
                overfit = "LIKELY"
            elif is_result.total_trades < 3 or oos_result.total_trades < 2:
                overfit = "LOW N"

            print(f"  {cfg.name:<20} {is_result.total_trades:>10} {is_result.win_rate:>7.1f}% {is_pf:>7} {is_result.total_pnl_dollars:>+10.2f} | {oos_result.total_trades:>11} {oos_result.win_rate:>7.1f}% {oos_pf:>8} {oos_result.total_pnl_dollars:>+10.2f} {overfit:>10}")

            if is_result.profit_factor > best_is_pf and is_result.total_trades >= 3:
                best_is_pf = is_result.profit_factor
                best_cfg = cfg

        if best_cfg:
            print(f"\n  Best IS config: {best_cfg.name}")


# ============================================================================
# PHASE 4: RUN FULL ENGINE BACKTEST (uses signals.py pipeline)
# ============================================================================

def run_engine_backtest(bars: list[OHLCVBar], market: str, tick_val: float):
    """Run the actual engine backtest using the full signal pipeline."""
    print(f"\n  Running full engine backtest for {market}...")
    report = run_backtest(bars, max_bars_held=60)

    print(f"  Total trades: {report.total_trades}")
    print(f"  Win rate: {report.win_rate}%")
    print(f"  Profit factor: {report.profit_factor}")
    print(f"  Avg R: {report.avg_r}")

    if report.by_type:
        print(f"\n  By signal type:")
        for stype, data in sorted(report.by_type.items()):
            print(f"    {stype:<25} {data['trades']:>3} trades, {data['win_rate']:>5.1f}% WR, {data['avg_r']:>+.2f}R")

    if report.by_confidence:
        print(f"\n  By confidence:")
        for conf, data in sorted(report.by_confidence.items()):
            print(f"    {conf:<10} {data['trades']:>3} trades, {data['win_rate']:>5.1f}% WR, {data['avg_r']:>+.2f}R")

    # Dollar P&L
    total_pnl_pts = sum(t.pnl_ticks for t in report.trades)
    total_dollars = total_pnl_pts * tick_val
    print(f"\n  Total P&L: {total_pnl_pts:+.2f} pts = ${total_dollars:+.2f}")

    # Trade-by-trade
    if report.trades:
        print(f"\n  Individual trades:")
        print(f"  {'Date':<12} {'Type':<25} {'Dir':>5} {'Entry':>10} {'Exit':>10} {'PnL':>8} {'R':>6} {'Bars':>5} {'Exit':>8} {'Conf':>5}")
        for t in report.trades:
            print(f"  {t.date:<12} {t.signal_type:<25} {t.direction:>5} {t.entry_price:>10.2f} {t.exit_price:>10.2f} {t.pnl_ticks:>+8.2f} {t.r_multiple:>+6.2f} {t.bars_held:>5} {t.exit_reason:>8} {t.confidence:>5}")

    return report


def run_phase4(bars_nq: list[OHLCVBar], bars_es: list[OHLCVBar]):
    """Phase 4: Full engine backtest + market-specific analysis."""
    print(f"\n{'='*80}")
    print(f"  PHASE 4: FULL ENGINE BACKTEST (CURRENT signals.py)")
    print(f"{'='*80}")

    nq_report = run_engine_backtest(bars_nq, "NQ", 5.0)
    es_report = run_engine_backtest(bars_es, "ES", 12.50)

    return nq_report, es_report


# ============================================================================
# PHASE 5: COMPARATIVE ANALYSIS — IDENTIFY BEST PARAMETERS
# ============================================================================

def run_phase5(phase2_results: list[StrategyResult]):
    """Phase 5: Cross-market comparison and parameter recommendations."""
    print(f"\n{'='*80}")
    print(f"  PHASE 5: MARKET-SPECIFIC OPTIMIZATION RESULTS")
    print(f"{'='*80}")

    for market in ["NQ", "ES"]:
        results = [r for r in phase2_results if r.market == market]
        profitable = [r for r in results if r.total_pnl_ticks > 0 and r.total_trades >= 3]

        print(f"\n  --- {market} ---")
        if profitable:
            # Rank by profit factor
            ranked = sorted(profitable, key=lambda r: r.profit_factor, reverse=True)
            print(f"  Top 5 configs by Profit Factor:")
            for i, r in enumerate(ranked[:5]):
                print(f"    {i+1}. {r.config.name:<20} PF={r.profit_factor:.2f} WR={r.win_rate:.1f}% Trades={r.total_trades} PnL=${r.total_pnl_dollars:+.2f}")

            # Rank by total P&L
            ranked_pnl = sorted(profitable, key=lambda r: r.total_pnl_dollars, reverse=True)
            print(f"\n  Top 5 configs by Total P&L:")
            for i, r in enumerate(ranked_pnl[:5]):
                print(f"    {i+1}. {r.config.name:<20} PnL=${r.total_pnl_dollars:+.2f} PF={r.profit_factor:.2f} WR={r.win_rate:.1f}%")

            best = ranked[0]
            print(f"\n  RECOMMENDED {market} CONFIG:")
            print(f"    OR minutes: {best.config.or_minutes}")
            print(f"    Min confluence: {best.config.min_confluence}")
            print(f"    R:R target: {best.config.rr_target}")
            print(f"    Stop mode: {best.config.stop_mode}")
            print(f"    RVOL filter: {best.config.rvol_filter}")
            print(f"    Max entry bar: {best.config.max_entry_bar}")
            print(f"    Entry confirm: {best.config.entry_confirm}")
            print(f"    Time filter: {best.config.time_filter}")
        else:
            print(f"  No profitable configurations found for {market}!")
            # Show least bad
            if results:
                least_bad = min(results, key=lambda r: abs(r.total_pnl_ticks))
                print(f"  Least bad: {least_bad.config.name} PnL={least_bad.total_pnl_ticks:+.1f} ticks")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    start_time = time.time()

    print("=" * 80)
    print("  ARCTIS ENGINE — 10-HOUR IMPROVEMENT SPRINT")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # Fetch data
    print("\n  Fetching data from TimescaleDB...")
    bars_nq = fetch_bars_as_models("NQ", days=35)
    bars_es = fetch_bars_as_models("ES", days=35)
    print(f"  NQ: {len(bars_nq)} bars")
    print(f"  ES: {len(bars_es)} bars")

    if len(bars_nq) < 500 or len(bars_es) < 500:
        print("  ERROR: Insufficient data! Need at least 500 bars per market.")
        return

    # Date range
    nq_start = ts_to_et(bars_nq[0].timestamp).strftime("%Y-%m-%d")
    nq_end = ts_to_et(bars_nq[-1].timestamp).strftime("%Y-%m-%d")
    print(f"  Date range: {nq_start} to {nq_end}")

    # ── PHASE 1 ──
    nq_analyses, nq_failures = run_phase1(bars_nq, "NQ")
    es_analyses, es_failures = run_phase1(bars_es, "ES")

    # ── PHASE 2 ──
    phase2_results = run_phase2(bars_nq, bars_es)

    # ── PHASE 3 ──
    run_phase3(bars_nq, bars_es)

    # ── PHASE 4 ──
    nq_report, es_report = run_phase4(bars_nq, bars_es)

    # ── PHASE 5 ──
    run_phase5(phase2_results)

    # ── FINAL SUMMARY ──
    elapsed = time.time() - start_time
    print(f"\n{'='*80}")
    print(f"  SPRINT COMPLETE — {elapsed:.1f}s elapsed")
    print(f"  Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")

    # Key findings
    print(f"\n  KEY FINDINGS:")

    # NQ summary
    nq_bo_days = [a for a in nq_analyses if a.or_breakout]
    nq_bo_wins = [a for a in nq_bo_days if a.breakout_succeeded]
    if nq_bo_days:
        print(f"  NQ: {len(nq_bo_days)} OR breakouts in {len(nq_analyses)} days, {100*len(nq_bo_wins)/len(nq_bo_days):.0f}% WR")

    es_bo_days = [a for a in es_analyses if a.or_breakout]
    es_bo_wins = [a for a in es_bo_days if a.breakout_succeeded]
    if es_bo_days:
        print(f"  ES: {len(es_bo_days)} OR breakouts in {len(es_analyses)} days, {100*len(es_bo_wins)/len(es_bo_days):.0f}% WR")

    if nq_report.total_trades > 0:
        print(f"  NQ Engine: {nq_report.total_trades} signals, {nq_report.win_rate}% WR, PF {nq_report.profit_factor}")
    if es_report.total_trades > 0:
        print(f"  ES Engine: {es_report.total_trades} signals, {es_report.win_rate}% WR, PF {es_report.profit_factor}")


if __name__ == "__main__":
    main()

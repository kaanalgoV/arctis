"""Backtesting Engine - Tests every pattern against 365 days of data.

For each detected pattern, tracks what happens AFTER the signal:
- Does price move in the predicted direction?
- How far does it move? (R-multiple)
- What's the actual win rate?
- What's the profit factor?

Uses forward-looking analysis to validate each pattern's edge.
"""

import csv
import sys
import os
import json
from collections import defaultdict
from dataclasses import dataclass, field

# Add project to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from arctis.models import OHLCVBar
from arctis.analysis.patterns import detect_patterns, PatternAnnotation
from arctis.analysis.vwap import calculate_vwap
from arctis.analysis.indicators import calculate_ema_ribbon, calculate_rsi
from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels
from arctis.analysis.structure import detect_swings, classify_trend


@dataclass
class TradeResult:
    pattern: str
    direction: str
    entry_price: float
    entry_ts: int
    target: float | None
    # Outcome tracking
    max_favorable: float = 0.0  # max move in predicted direction
    max_adverse: float = 0.0    # max move against
    exit_price: float = 0.0
    bars_held: int = 0
    won: bool = False
    pnl: float = 0.0
    r_multiple: float = 0.0


@dataclass
class PatternStats:
    name: str
    total: int = 0
    wins: int = 0
    losses: int = 0
    total_pnl: float = 0.0
    total_win_pnl: float = 0.0
    total_loss_pnl: float = 0.0
    max_win: float = 0.0
    max_loss: float = 0.0
    max_favorable_avg: float = 0.0
    max_adverse_avg: float = 0.0
    avg_bars_held: float = 0.0
    consecutive_losses_max: int = 0
    trades: list[TradeResult] = field(default_factory=list)

    @property
    def win_rate(self) -> float:
        return (self.wins / self.total * 100) if self.total > 0 else 0.0

    @property
    def profit_factor(self) -> float:
        if self.total_loss_pnl == 0:
            return float('inf') if self.total_win_pnl > 0 else 0
        return abs(self.total_win_pnl / self.total_loss_pnl)

    @property
    def avg_win(self) -> float:
        return self.total_win_pnl / self.wins if self.wins > 0 else 0

    @property
    def avg_loss(self) -> float:
        return self.total_loss_pnl / self.losses if self.losses > 0 else 0

    @property
    def expectancy(self) -> float:
        """Expected value per trade."""
        if self.total == 0:
            return 0
        return self.total_pnl / self.total


def load_bars(filepath: str) -> list[OHLCVBar]:
    bars = []
    with open(filepath) as f:
        reader = csv.DictReader(f)
        for row in reader:
            bars.append(OHLCVBar(
                timestamp=int(row["timestamp"]),
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=float(row["close"]),
                volume=int(row["volume"]),
            ))
    return bars


def split_into_days(bars: list[OHLCVBar]) -> list[list[OHLCVBar]]:
    """Split bars into individual trading days."""
    days = []
    current_day: list[OHLCVBar] = []
    last_ts = 0

    for bar in bars:
        if last_ts > 0 and bar.timestamp - last_ts > 6 * 3600:
            if current_day:
                days.append(current_day)
            current_day = []
        current_day.append(bar)
        last_ts = bar.timestamp

    if current_day:
        days.append(current_day)
    return days


def evaluate_trade(annotation: PatternAnnotation, bars_after: list[OHLCVBar],
                   lookforward: int = 60) -> TradeResult:
    """Evaluate a trade signal by looking forward N bars.

    - For directional signals: check if price moves in predicted direction
    - If target provided: check if target reached
    - Default lookforward: 60 bars (1 hour for 1-min data)
    """
    entry_price = annotation.price
    direction = annotation.direction
    target = annotation.target

    result = TradeResult(
        pattern=annotation.pattern,
        direction=direction,
        entry_price=entry_price,
        entry_ts=annotation.timestamp,
        target=target,
    )

    if not bars_after or direction == "neutral":
        return result

    # Use ATR for stop distance
    recent_ranges = [b.high - b.low for b in bars_after[:20]] if len(bars_after) >= 20 else [b.high - b.low for b in bars_after]
    atr = sum(recent_ranges) / len(recent_ranges) if recent_ranges else 1.0
    stop_distance = atr * 2  # 2 ATR stop

    max_favorable = 0.0
    max_adverse = 0.0
    exit_price = entry_price
    bars_held = 0

    for i, bar in enumerate(bars_after[:lookforward]):
        bars_held = i + 1

        if direction == "long":
            favorable = bar.high - entry_price
            adverse = entry_price - bar.low
        else:  # short
            favorable = entry_price - bar.low
            adverse = bar.high - entry_price

        max_favorable = max(max_favorable, favorable)
        max_adverse = max(max_adverse, adverse)

        # Check stop hit
        if adverse >= stop_distance:
            exit_price = entry_price - stop_distance if direction == "long" else entry_price + stop_distance
            break

        # Check target hit
        if target:
            if direction == "long" and bar.high >= target:
                exit_price = target
                break
            elif direction == "short" and bar.low <= target:
                exit_price = target
                break

        exit_price = bar.close

    # Calculate PnL
    if direction == "long":
        pnl = exit_price - entry_price
    else:
        pnl = entry_price - exit_price

    result.max_favorable = max_favorable
    result.max_adverse = max_adverse
    result.exit_price = exit_price
    result.bars_held = bars_held
    result.won = pnl > 0
    result.pnl = pnl
    result.r_multiple = pnl / stop_distance if stop_distance > 0 else 0

    return result


def run_backtest(bars: list[OHLCVBar], market: str) -> dict[str, PatternStats]:
    """Run full backtest across all days."""
    days = split_into_days(bars)
    stats: dict[str, PatternStats] = defaultdict(lambda: PatternStats(name=""))

    print(f"\n{'='*60}")
    print(f"  BACKTEST: {market} - {len(days)} Trading Days, {len(bars)} Bars")
    print(f"{'='*60}")

    total_patterns_detected = 0

    for day_idx, day_bars in enumerate(days):
        if len(day_bars) < 60:
            continue

        # Test at multiple points during the day
        test_points = [60, 120, 180, 240, 300, 360]  # every hour

        for test_bar_count in test_points:
            if test_bar_count >= len(day_bars):
                continue

            # Bars up to this point (what the engine would see)
            # Include previous days for multi-day patterns
            history_start = max(0, day_idx - 5)
            history_bars = []
            for prev_day in days[history_start:day_idx]:
                history_bars.extend(prev_day)
            history_bars.extend(day_bars[:test_bar_count])

            if len(history_bars) < 100:
                continue

            # Calculate indicators
            try:
                vwap_list = calculate_vwap(history_bars)
                rsi_list = calculate_rsi(history_bars)
                vol_profile = build_volume_profile(history_bars)
                session_lvls = calculate_session_levels(history_bars)

                latest_vwap = None
                if vwap_list:
                    v = vwap_list[-1]
                    latest_vwap = {"vwap": v.vwap, "upper_1": v.upper_1, "lower_1": v.lower_1,
                                   "upper_2": v.upper_2, "lower_2": v.lower_2}

                latest_rsi = None
                if rsi_list:
                    r = rsi_list[-1]
                    latest_rsi = {"rsi": r.rsi, "divergence": r.divergence}

                vp_dict = None
                if vol_profile:
                    vp_dict = {"poc": vol_profile.poc, "vah": vol_profile.vah, "val": vol_profile.val}

                sl_dict = None
                if session_lvls:
                    sl_dict = {
                        "prev_high": session_lvls.prev_high, "prev_low": session_lvls.prev_low,
                        "prev_close": session_lvls.prev_close,
                        "opening_range_high": session_lvls.opening_range_high,
                        "opening_range_low": session_lvls.opening_range_low,
                    }

                # Detect patterns
                result = detect_patterns(
                    bars=history_bars,
                    vwap_data=latest_vwap,
                    rsi_data=latest_rsi,
                    volume_profile=vp_dict,
                    session_levels=sl_dict,
                )

                # Evaluate each directional pattern
                for ann in result.annotations:
                    if ann.direction == "neutral":
                        continue

                    # Bars after the signal (remaining day bars)
                    remaining = day_bars[test_bar_count:]
                    if len(remaining) < 10:
                        continue

                    trade = evaluate_trade(ann, remaining, lookforward=60)
                    total_patterns_detected += 1

                    s = stats[ann.pattern]
                    s.name = ann.pattern
                    s.total += 1
                    s.trades.append(trade)

                    if trade.won:
                        s.wins += 1
                        s.total_win_pnl += trade.pnl
                        s.max_win = max(s.max_win, trade.pnl)
                    else:
                        s.losses += 1
                        s.total_loss_pnl += trade.pnl
                        s.max_loss = min(s.max_loss, trade.pnl)

                    s.total_pnl += trade.pnl

            except Exception as e:
                # Skip problematic bars
                continue

        # Progress
        if (day_idx + 1) % 25 == 0:
            print(f"  Day {day_idx + 1}/{len(days)} processed... ({total_patterns_detected} patterns so far)")

    print(f"\n  Total patterns detected: {total_patterns_detected}")
    return dict(stats)


def print_results(stats: dict[str, PatternStats], market: str):
    """Print formatted backtest results."""
    print(f"\n{'='*80}")
    print(f"  RESULTS: {market}")
    print(f"{'='*80}")
    print(f"{'Pattern':<30s} {'Trades':>6s} {'Win%':>6s} {'PF':>6s} {'Expect':>8s} {'AvgWin':>8s} {'AvgLoss':>8s} {'MaxW':>7s} {'MaxL':>7s}")
    print("-" * 80)

    sorted_patterns = sorted(stats.values(), key=lambda s: s.expectancy, reverse=True)

    good_patterns = []
    bad_patterns = []

    for s in sorted_patterns:
        if s.total < 5:
            continue

        row = f"{s.name:<30s} {s.total:>6d} {s.win_rate:>5.1f}% {s.profit_factor:>5.2f}x {s.expectancy:>+7.2f} {s.avg_win:>+7.2f} {s.avg_loss:>+7.2f} {s.max_win:>+6.2f} {s.max_loss:>+6.2f}"

        if s.win_rate >= 50 and s.profit_factor >= 1.0 and s.expectancy > 0:
            print(f"  [OK] {row}")
            good_patterns.append(s)
        elif s.win_rate < 40 or s.profit_factor < 0.8:
            print(f"  [BAD] {row}")
            bad_patterns.append(s)
        else:
            print(f"  ~ {row}")

    print(f"\n  GOOD patterns (Win>50%, PF>1.0): {len(good_patterns)}")
    print(f"  BAD patterns (Win<40% or PF<0.8): {len(bad_patterns)}")

    return good_patterns, bad_patterns


def save_results(all_stats: dict, filepath: str):
    """Save detailed results to JSON."""
    output = {}
    for market, stats in all_stats.items():
        market_data = {}
        for name, s in stats.items():
            market_data[name] = {
                "total": s.total,
                "wins": s.wins,
                "losses": s.losses,
                "win_rate": round(s.win_rate, 2),
                "profit_factor": round(s.profit_factor, 4) if s.profit_factor != float('inf') else 999,
                "expectancy": round(s.expectancy, 4),
                "avg_win": round(s.avg_win, 4),
                "avg_loss": round(s.avg_loss, 4),
                "max_win": round(s.max_win, 4),
                "max_loss": round(s.max_loss, 4),
                "total_pnl": round(s.total_pnl, 2),
            }
        output[market] = market_data

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nDetailed results saved to {filepath}")


if __name__ == "__main__":
    print("=" * 60)
    print("  ARCTIS PATTERN BACKTESTER")
    print("  365 Days | ES + NQ | All Patterns")
    print("=" * 60)

    all_stats = {}

    # ES Backtest
    print("\nLoading ES data...")
    es_bars = load_bars("C:/Users/Meriton/Arctis/data/backtest/es_365d.csv")
    es_stats = run_backtest(es_bars, "ES")
    es_good, es_bad = print_results(es_stats, "ES")
    all_stats["ES"] = es_stats

    # NQ Backtest
    print("\nLoading NQ data...")
    nq_bars = load_bars("C:/Users/Meriton/Arctis/data/backtest/nq_365d.csv")
    nq_stats = run_backtest(nq_bars, "NQ")
    nq_good, nq_bad = print_results(nq_stats, "NQ")
    all_stats["NQ"] = nq_stats

    # Save results
    save_results(all_stats, "C:/Users/Meriton/Arctis/data/backtest/results.json")

    # Summary
    print("\n" + "=" * 60)
    print("  COMBINED ANALYSIS")
    print("=" * 60)

    # Find patterns that work on BOTH markets
    es_pattern_names = {s.name for s in es_good}
    nq_pattern_names = {s.name for s in nq_good}
    both_good = es_pattern_names & nq_pattern_names

    es_bad_names = {s.name for s in es_bad}
    nq_bad_names = {s.name for s in nq_bad}
    both_bad = es_bad_names | nq_bad_names

    print(f"\n  Patterns profitable on BOTH ES and NQ:")
    for name in sorted(both_good):
        es_s = es_stats[name]
        nq_s = nq_stats[name]
        print(f"    [OK] {name}: ES={es_s.win_rate:.0f}% PF={es_s.profit_factor:.2f} | NQ={nq_s.win_rate:.0f}% PF={nq_s.profit_factor:.2f}")

    print(f"\n  Patterns to REMOVE (bad on either market):")
    for name in sorted(both_bad):
        es_s = es_stats.get(name)
        nq_s = nq_stats.get(name)
        es_wr = f"ES={es_s.win_rate:.0f}%" if es_s else "ES=N/A"
        nq_wr = f"NQ={nq_s.win_rate:.0f}%" if nq_s else "NQ=N/A"
        print(f"    [BAD] {name}: {es_wr} | {nq_wr}")

    print("\nBacktest complete!")

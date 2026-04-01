"""Backtester for Travis methodology signals.

Tests signals against historical data to measure:
- Win rate per signal type
- Average R:R achieved
- Profit factor
- Best/worst signal types

The backtest simulates the analysis pipeline at intraday checkpoints:
- Bar 30 (~9:45 ET), Bar 45 (~10:00 ET), Bar 60 (~10:30 ET), Bar 90 (~11:00 ET)

At each checkpoint, context (zones, bias, levels) is rebuilt from prior bars,
then signals are generated and forward-tested against the remainder of the day.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone

from arctis.models import OHLCVBar
from arctis.analysis.signals import detect_signals, TradeSignal
from arctis.analysis.zones import calculate_zones, _group_by_day, _calculate_value_area
from arctis.analysis.bias_state import calculate_bias_state
from arctis.analysis.structure import detect_swings, classify_trend
from arctis.analysis.naked_poc import find_naked_pocs
from arctis.analysis.key_levels import find_key_levels
from arctis.analysis.vwap import calculate_vwap


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class TradeResult:
    signal_type: str
    direction: str
    entry_price: float
    stop_price: float
    target_price: float
    exit_price: float
    pnl_ticks: float
    r_multiple: float  # how many R achieved (1R = risk amount)
    won: bool
    bars_held: int
    date: str
    confidence: str = "medium"
    exit_reason: str = ""  # "target" | "stop" | "timeout"


@dataclass
class BacktestReport:
    total_trades: int
    wins: int
    losses: int
    win_rate: float
    avg_r: float
    profit_factor: float
    best_type: str
    worst_type: str
    by_type: dict  # {type: {trades, wins, win_rate, avg_r}}
    trades: list[TradeResult] = field(default_factory=list)
    # Confidence breakdown
    by_confidence: dict = field(default_factory=dict)  # {high/medium/low: {trades, win_rate, avg_r}}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_backtest(bars: list[OHLCVBar], max_bars_held: int = 60, market_root: str = "NQ") -> BacktestReport:
    """Run backtest on all bars, generating signals at each day's checkpoints.

    For each trading day:
    1. Calculate zones, bias, levels from previous data
    2. Generate signals at key checkpoints (bar 30, 45, 60, 90)
    3. Forward-test each signal: did price hit target or stop first?
    4. Record result

    Args:
        bars: Full OHLCV bar history (1-minute bars recommended)
        max_bars_held: Maximum bars before force-closing a trade (default 60 = 1 hour)

    Returns:
        BacktestReport with aggregated statistics and individual trade results.
    """
    if len(bars) < 500:
        return _empty_report()

    days = _group_by_day(bars)
    if len(days) < 3:
        return _empty_report()

    all_results: list[TradeResult] = []
    seen_signals: set[tuple] = set()  # dedup identical signals at same checkpoint

    for day_idx in range(2, len(days)):
        current_day = days[day_idx]

        if len(current_day) < 60:
            continue

        # Build context from all previous days
        context_bars: list[OHLCVBar] = []
        for d in days[:day_idx]:
            context_bars.extend(d)

        day_date = datetime.fromtimestamp(
            current_day[0].timestamp, tz=timezone.utc
        ).strftime("%Y-%m-%d")

        # Pre-calculate context elements (expensive — done once per day)
        context_for_zones = context_bars + current_day[:30]
        zones = calculate_zones(context_for_zones)

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

        # Bias from context (use up to 500 bars for performance)
        ctx_slice = context_bars[-500:] if len(context_bars) > 500 else context_bars
        swings = detect_swings(ctx_slice)
        trend = classify_trend(swings)
        bias = calculate_bias_state(ctx_slice, trend=trend.value)

        # Naked POCs
        npoc_slice = context_bars[-2000:] if len(context_bars) > 2000 else context_bars
        try:
            npocs = find_naked_pocs(npoc_slice)
            naked_poc_prices = [p.poc_price for p in npocs if p.is_naked][:5]
        except Exception:
            naked_poc_prices = []

        # Key levels
        try:
            kls = find_key_levels(npoc_slice)
            kl_dicts = [{"level": kl.level, "type": kl.type} for kl in kls[:10]]
        except Exception:
            kl_dicts = []

        # Generate signals at checkpoints (bar indices within current day)
        # v2: every 5 bars from 5 to 360 to catch signals throughout the day
        checkpoints = list(range(5, min(len(current_day), 361), 5))

        for cp in checkpoints:
            if cp >= len(current_day):
                break

            test_bars = context_bars + current_day[:cp]

            # Calculate VWAP from today's bars so far
            vwap_val = None
            try:
                vwap_data = calculate_vwap(current_day[:cp])
                if vwap_data:
                    vwap_val = vwap_data[-1].vwap
            except Exception:
                pass

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
                    vwap=vwap_val,
                    session_bar_idx=cp,
                    market_root=market_root,
                )
            except Exception:
                continue

            future_bars = current_day[cp:]

            for sig in signals:
                # Dedup: same type + direction + entry rounded to nearest 0.25
                sig_key = (
                    day_date,
                    sig.signal_type,
                    sig.direction,
                    round(sig.entry_price * 4) / 4,
                )
                if sig_key in seen_signals:
                    continue
                seen_signals.add(sig_key)

                result = _evaluate_signal(sig, future_bars, max_bars_held)
                if result is not None:
                    result.date = day_date
                    result.confidence = sig.confidence
                    all_results.append(result)

    return _compile_report(all_results)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _empty_report() -> BacktestReport:
    return BacktestReport(0, 0, 0, 0.0, 0.0, 0.0, "", "", {}, [], {})


def _evaluate_signal(
    sig: TradeSignal, future_bars: list[OHLCVBar], max_bars: int
) -> "TradeResult | None":
    """Check whether a signal hit its target or stop in future bars.

    Priority: stop/target checked within the same bar using bar high/low.
    When both are touched in the same bar, the worst case (stop) wins.
    """
    if not future_bars:
        return None

    risk = abs(sig.entry_price - sig.stop_price)
    if risk < 0.01:
        return None

    for i, bar in enumerate(future_bars[:max_bars]):
        if sig.direction == "long":
            stop_hit = bar.low <= sig.stop_price
            target_hit = bar.high >= sig.target_price
            if stop_hit and target_hit:
                # Assume adverse fill: stop hit first (conservative)
                pnl = sig.stop_price - sig.entry_price
                return TradeResult(
                    sig.signal_type, "long",
                    sig.entry_price, sig.stop_price, sig.target_price,
                    sig.stop_price, pnl, round(pnl / risk, 2),
                    False, i + 1, "", exit_reason="stop",
                )
            if stop_hit:
                pnl = sig.stop_price - sig.entry_price
                return TradeResult(
                    sig.signal_type, "long",
                    sig.entry_price, sig.stop_price, sig.target_price,
                    sig.stop_price, pnl, round(pnl / risk, 2),
                    False, i + 1, "", exit_reason="stop",
                )
            if target_hit:
                pnl = sig.target_price - sig.entry_price
                return TradeResult(
                    sig.signal_type, "long",
                    sig.entry_price, sig.stop_price, sig.target_price,
                    sig.target_price, pnl, round(pnl / risk, 2),
                    True, i + 1, "", exit_reason="target",
                )
        else:  # short
            stop_hit = bar.high >= sig.stop_price
            target_hit = bar.low <= sig.target_price
            if stop_hit and target_hit:
                pnl = sig.entry_price - sig.stop_price
                return TradeResult(
                    sig.signal_type, "short",
                    sig.entry_price, sig.stop_price, sig.target_price,
                    sig.stop_price, pnl, round(pnl / risk, 2),
                    False, i + 1, "", exit_reason="stop",
                )
            if stop_hit:
                pnl = sig.entry_price - sig.stop_price
                return TradeResult(
                    sig.signal_type, "short",
                    sig.entry_price, sig.stop_price, sig.target_price,
                    sig.stop_price, pnl, round(pnl / risk, 2),
                    False, i + 1, "", exit_reason="stop",
                )
            if target_hit:
                pnl = sig.entry_price - sig.target_price
                return TradeResult(
                    sig.signal_type, "short",
                    sig.entry_price, sig.stop_price, sig.target_price,
                    sig.target_price, pnl, round(pnl / risk, 2),
                    True, i + 1, "", exit_reason="target",
                )

    # Timeout — close at last available bar's close
    last_idx = min(max_bars - 1, len(future_bars) - 1)
    exit_price = future_bars[last_idx].close
    if sig.direction == "long":
        pnl = exit_price - sig.entry_price
    else:
        pnl = sig.entry_price - exit_price

    return TradeResult(
        sig.signal_type, sig.direction,
        sig.entry_price, sig.stop_price, sig.target_price,
        exit_price, pnl, round(pnl / risk, 2),
        pnl > 0, last_idx + 1, "", exit_reason="timeout",
    )


def _compile_report(results: list[TradeResult]) -> BacktestReport:
    """Aggregate individual trade results into a BacktestReport."""
    if not results:
        return _empty_report()

    wins = [r for r in results if r.won]
    losses = [r for r in results if not r.won]

    total = len(results)
    win_count = len(wins)
    win_rate = round(win_count / total * 100, 1) if total > 0 else 0.0
    avg_r = round(sum(r.r_multiple for r in results) / total, 2) if total > 0 else 0.0

    gross_profit = sum(r.pnl_ticks for r in wins) if wins else 0.0
    gross_loss = abs(sum(r.pnl_ticks for r in losses)) if losses else 0.0
    pf = round(gross_profit / gross_loss, 2) if gross_loss > 0 else 0.0

    # Aggregate by signal type
    by_type: dict[str, dict] = {}
    for r in results:
        bucket = by_type.setdefault(r.signal_type, {"trades": 0, "wins": 0, "total_r": 0.0})
        bucket["trades"] += 1
        if r.won:
            bucket["wins"] += 1
        bucket["total_r"] += r.r_multiple

    for k, v in by_type.items():
        v["win_rate"] = round(v["wins"] / v["trades"] * 100, 1) if v["trades"] > 0 else 0.0
        v["avg_r"] = round(v["total_r"] / v["trades"], 2) if v["trades"] > 0 else 0.0

    best = max(by_type.items(), key=lambda x: x[1]["win_rate"])[0] if by_type else ""
    worst = min(by_type.items(), key=lambda x: x[1]["win_rate"])[0] if by_type else ""

    # Aggregate by confidence level
    by_confidence: dict[str, dict] = {}
    for r in results:
        conf = getattr(r, "confidence", "medium")
        bucket = by_confidence.setdefault(conf, {"trades": 0, "wins": 0, "total_r": 0.0})
        bucket["trades"] += 1
        if r.won:
            bucket["wins"] += 1
        bucket["total_r"] += r.r_multiple

    for k, v in by_confidence.items():
        v["win_rate"] = round(v["wins"] / v["trades"] * 100, 1) if v["trades"] > 0 else 0.0
        v["avg_r"] = round(v["total_r"] / v["trades"], 2) if v["trades"] > 0 else 0.0

    return BacktestReport(
        total_trades=total,
        wins=win_count,
        losses=len(losses),
        win_rate=win_rate,
        avg_r=avg_r,
        profit_factor=pf,
        best_type=best,
        worst_type=worst,
        by_type=by_type,
        trades=results,
        by_confidence=by_confidence,
    )

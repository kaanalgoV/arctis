"""
Signal Accuracy Evaluation Script
==================================
Evaluates the Arctis analysis engine against real NQH6 historical data.

Connects to TimescaleDB, loads NQH6 1-minute bars, runs the backtester,
and reports honest signal accuracy metrics.

Usage:
    cd /Users/kaan_macbook/arctis/engine
    uv run python evaluate_signals.py
"""

import os
import sys
import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

# DB config
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://algorivo:algorivo_dev@localhost:5532/algorivo",
)

SYMBOL = "NQH6"
EVAL_DAYS = 30  # Last 30 days of available data (up to March 5, 2026)


def fetch_bars_raw() -> list[dict]:
    """Fetch NQH6 1-minute bars directly from ohlcv_1m view."""
    from sqlalchemy import create_engine, text
    import pandas as pd

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

    # Fetch bars that are available (NQH6 goes up to 2026-03-05)
    query = text("""
        SELECT
            EXTRACT(EPOCH FROM timestamp)::bigint AS timestamp,
            open, high, low, close, volume
        FROM ohlcv_1m
        WHERE symbol = :symbol
        ORDER BY timestamp ASC
    """)

    print(f"Fetching {SYMBOL} bars from database...")
    t0 = time.time()
    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"symbol": SYMBOL})
    elapsed = time.time() - t0
    print(f"  Loaded {len(df):,} bars in {elapsed:.1f}s")
    return df.to_dict(orient="records")


def main():
    from arctis.models import OHLCVBar
    from arctis.analysis.backtester import run_backtest, BacktestReport

    # ── Step 1: Load data ────────────────────────────────────────────────────
    raw_bars = fetch_bars_raw()

    if not raw_bars:
        print("ERROR: No bars returned from database!")
        sys.exit(1)

    # Convert to OHLCVBar models
    all_bars = [
        OHLCVBar(
            timestamp=int(r["timestamp"]),
            open=float(r["open"]),
            high=float(r["high"]),
            low=float(r["low"]),
            close=float(r["close"]),
            volume=int(r["volume"]),
        )
        for r in raw_bars
    ]

    total_bars = len(all_bars)
    date_start = datetime.fromtimestamp(all_bars[0].timestamp, tz=timezone.utc)
    date_end = datetime.fromtimestamp(all_bars[-1].timestamp, tz=timezone.utc)
    print(f"\nData range: {date_start.strftime('%Y-%m-%d')} -> {date_end.strftime('%Y-%m-%d')}")
    print(f"Total 1-minute bars: {total_bars:,}")

    # ── Step 2: Use last 30 days of available data ───────────────────────────
    cutoff = date_end - timedelta(days=EVAL_DAYS)
    eval_bars = [b for b in all_bars if datetime.fromtimestamp(b.timestamp, tz=timezone.utc) >= cutoff]
    # But also keep context: need earlier bars for zone/bias calculation
    # backtester uses ALL provided bars as context, so we provide everything
    print(f"\nEvaluation window: {cutoff.strftime('%Y-%m-%d')} -> {date_end.strftime('%Y-%m-%d')}")
    print(f"Bars in evaluation window: {len(eval_bars):,}")
    print(f"Using all {total_bars:,} bars for full context (backtester handles day splitting)")

    # ── Step 3: Run backtest ─────────────────────────────────────────────────
    print(f"\nRunning backtest... (this may take 30-120 seconds)")
    t0 = time.time()
    report = run_backtest(all_bars, max_bars_held=60)
    elapsed = time.time() - t0
    print(f"Backtest completed in {elapsed:.1f}s")

    # ── Step 4: Compute max consecutive losses ───────────────────────────────
    max_consec_losses = 0
    cur_consec = 0
    for t in report.trades:
        if not t.won:
            cur_consec += 1
            max_consec_losses = max(max_consec_losses, cur_consec)
        else:
            cur_consec = 0

    # ── Step 5: Per-signal-type win rates ────────────────────────────────────
    type_stats = {}
    for sig_type, data in report.by_type.items():
        type_stats[sig_type] = {
            "trades": data["trades"],
            "wins": data["wins"],
            "win_rate": data["win_rate"],
            "avg_r": data["avg_r"],
        }

    # ── Step 6: Exit reason breakdown ────────────────────────────────────────
    exit_counts = defaultdict(int)
    for t in report.trades:
        exit_counts[t.exit_reason] += 1

    # ── Step 7: Daily signal frequency ───────────────────────────────────────
    by_day = defaultdict(int)
    for t in report.trades:
        by_day[t.date] += 1
    avg_signals_per_day = len(report.trades) / max(len(by_day), 1)

    # ── Step 8: High-confidence only metrics ─────────────────────────────────
    high_conf = report.by_confidence.get("high", {})
    med_conf = report.by_confidence.get("medium", {})
    low_conf = report.by_confidence.get("low", {})

    # ── Step 9: Print results ─────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("ARCTIS ENGINE EVALUATION — SIGNAL ACCURACY REPORT")
    print("=" * 60)
    print(f"Symbol:          {SYMBOL}")
    print(f"Data range:      {date_start.strftime('%Y-%m-%d')} to {date_end.strftime('%Y-%m-%d')}")
    print(f"Total 1m bars:   {total_bars:,}")
    print(f"Runtime:         {elapsed:.1f}s")

    print("\n--- OVERALL RESULTS ---")
    if report.total_trades == 0:
        print("WARNING: Zero signals generated — pipeline may have issues")
    else:
        print(f"Total signals:          {report.total_trades}")
        print(f"Wins:                   {report.wins}")
        print(f"Losses:                 {report.losses}")
        print(f"Win rate:               {report.win_rate}%")
        print(f"Avg R achieved:         {report.avg_r}R")
        print(f"Profit factor:          {report.profit_factor}")
        print(f"Max consecutive losses: {max_consec_losses}")
        print(f"Avg signals/day:        {avg_signals_per_day:.1f}")
        print(f"Trading days covered:   {len(by_day)}")

    print("\n--- BY SIGNAL TYPE ---")
    if type_stats:
        for sig_type, stats in sorted(type_stats.items(), key=lambda x: -x[1]["trades"]):
            print(f"  {sig_type:25s}  {stats['trades']:3d} trades  {stats['win_rate']:5.1f}% WR  {stats['avg_r']:+.2f}R avg")
    else:
        print("  No signal types recorded")

    print("\n--- BY CONFIDENCE ---")
    for conf_label, conf_data in [("high", high_conf), ("medium", med_conf), ("low", low_conf)]:
        if conf_data and conf_data.get("trades", 0) > 0:
            print(f"  {conf_label:8s}  {conf_data['trades']:3d} trades  {conf_data['win_rate']:5.1f}% WR  {conf_data['avg_r']:+.2f}R avg")
        else:
            print(f"  {conf_label:8s}  0 trades")

    print("\n--- EXIT REASONS ---")
    for reason, count in sorted(exit_counts.items()):
        print(f"  {reason:10s}  {count} ({count/max(report.total_trades,1)*100:.0f}%)")

    print("\n--- BEST / WORST ---")
    print(f"  Best signal type:   {report.best_type or 'N/A'}")
    print(f"  Worst signal type:  {report.worst_type or 'N/A'}")

    print("\n--- HONEST ASSESSMENT ---")
    if report.total_trades == 0:
        print("  CRITICAL: Engine generated zero evaluable signals.")
        print("  Possible causes: bias always RANGE (no directional signals),")
        print("  R:R thresholds not met, or no key levels available.")
    elif report.total_trades < 20:
        print(f"  LOW SIGNAL COUNT ({report.total_trades} signals over the period).")
        print("  Results are statistically insignificant — need 100+ signals")
        print("  for any meaningful win rate claim.")
    elif report.win_rate >= 60:
        print(f"  Win rate {report.win_rate}% appears high. Verify no look-ahead bias.")
    elif report.win_rate >= 45:
        print(f"  Win rate {report.win_rate}% is plausible for a trend-following system.")
        print(f"  Profitable if avg R > {1/(report.win_rate/100) - 1:.2f}R (current: {report.avg_r}R)")
    else:
        print(f"  Win rate {report.win_rate}% is below break-even for 1:1 systems.")
        if report.profit_factor >= 1.0:
            print(f"  But profit factor {report.profit_factor} > 1.0 means system is net positive")
            print(f"  because winners are larger than losers (avg R = {report.avg_r}).")
        else:
            print(f"  Profit factor {report.profit_factor} < 1.0: system loses money overall.")

    # ── Step 10: Return structured results for file output ───────────────────
    return {
        "symbol": SYMBOL,
        "date_range": f"{date_start.strftime('%Y-%m-%d')} to {date_end.strftime('%Y-%m-%d')}",
        "total_bars": total_bars,
        "runtime_seconds": round(elapsed, 1),
        "total_trades": report.total_trades,
        "wins": report.wins,
        "losses": report.losses,
        "win_rate": report.win_rate,
        "avg_r": report.avg_r,
        "profit_factor": report.profit_factor,
        "max_consec_losses": max_consec_losses,
        "avg_signals_per_day": round(avg_signals_per_day, 1),
        "trading_days": len(by_day),
        "by_type": type_stats,
        "by_confidence": {
            k: v for k, v in report.by_confidence.items()
        },
        "exit_reasons": dict(exit_counts),
        "best_type": report.best_type,
        "worst_type": report.worst_type,
        "trades_sample": [
            {
                "date": t.date,
                "type": t.signal_type,
                "dir": t.direction,
                "entry": t.entry_price,
                "stop": t.stop_price,
                "target": t.target_price,
                "exit": t.exit_price,
                "r": t.r_multiple,
                "won": t.won,
                "bars_held": t.bars_held,
                "exit_reason": t.exit_reason,
                "confidence": t.confidence,
            }
            for t in report.trades[:20]  # first 20 for sample
        ],
    }


if __name__ == "__main__":
    results = main()
    print("\n[evaluate_signals.py] Done.")

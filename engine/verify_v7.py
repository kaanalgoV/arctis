#!/usr/bin/env python3
"""Verify v7 engine improvements — run backtests for NQ and ES separately."""

import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from arctis.db import fetch_bars_as_models
from arctis.analysis.backtester import run_backtest

def print_report(report, market, tick_val):
    total_pnl_pts = sum(t.pnl_ticks for t in report.trades)
    total_dollars = total_pnl_pts * tick_val

    print(f"\n  {market} v7 BACKTEST RESULTS:")
    print(f"  Total trades: {report.total_trades}")
    print(f"  Wins: {report.wins}, Losses: {report.losses}")
    print(f"  Win rate: {report.win_rate}%")
    print(f"  Profit factor: {report.profit_factor}")
    print(f"  Avg R: {report.avg_r}")
    print(f"  Total P&L: {total_pnl_pts:+.2f} pts = ${total_dollars:+.2f}")

    if report.by_type:
        print(f"\n  By signal type:")
        for stype, data in sorted(report.by_type.items()):
            print(f"    {stype:<25} {data['trades']:>3} trades, {data['win_rate']:>5.1f}% WR, {data['avg_r']:>+.2f}R")

    if report.by_confidence:
        print(f"\n  By confidence:")
        for conf, data in sorted(report.by_confidence.items()):
            print(f"    {conf:<10} {data['trades']:>3} trades, {data['win_rate']:>5.1f}% WR, {data['avg_r']:>+.2f}R")

    if report.trades:
        print(f"\n  Individual trades:")
        print(f"  {'Date':<12} {'Type':<25} {'Dir':>5} {'Entry':>10} {'Exit':>10} {'PnL':>8} {'R':>6} {'Bars':>5} {'Exit':>8}")
        for t in report.trades:
            print(f"  {t.date:<12} {t.signal_type:<25} {t.direction:>5} {t.entry_price:>10.2f} {t.exit_price:>10.2f} {t.pnl_ticks:>+8.2f} {t.r_multiple:>+6.2f} {t.bars_held:>5} {t.exit_reason:>8}")

def main():
    print("=" * 80)
    print("  ARCTIS ENGINE v7 VERIFICATION")
    print("=" * 80)

    bars_nq = fetch_bars_as_models("NQ", days=35)
    bars_es = fetch_bars_as_models("ES", days=35)
    print(f"  NQ: {len(bars_nq)} bars, ES: {len(bars_es)} bars")

    # v7: Pass market_root to backtest
    nq_report = run_backtest(bars_nq, max_bars_held=60, market_root="NQ")
    es_report = run_backtest(bars_es, max_bars_held=60, market_root="ES")

    print_report(nq_report, "NQ", 5.0)
    print_report(es_report, "ES", 12.50)

    # Compare with v6 baseline (no market_root = default NQ behavior)
    print(f"\n{'='*80}")
    print("  COMPARISON: v6 (no market awareness) vs v7")
    print(f"{'='*80}")

    nq_v6 = run_backtest(bars_nq, max_bars_held=60, market_root="NQ")
    es_v6 = run_backtest(bars_es, max_bars_held=60, market_root="NQ")  # Force NQ params on ES

    nq_pnl_v7 = sum(t.pnl_ticks for t in nq_report.trades) * 5.0
    es_pnl_v7 = sum(t.pnl_ticks for t in es_report.trades) * 12.50
    nq_pnl_v6 = sum(t.pnl_ticks for t in nq_v6.trades) * 5.0
    es_pnl_v6 = sum(t.pnl_ticks for t in es_v6.trades) * 12.50

    print(f"\n  {'Metric':<25} {'NQ v7':>10} {'NQ v6':>10} {'ES v7':>10} {'ES v6(NQ)':>10}")
    print(f"  {'-'*25} {'-'*10} {'-'*10} {'-'*10} {'-'*10}")
    print(f"  {'Trades':<25} {nq_report.total_trades:>10} {nq_v6.total_trades:>10} {es_report.total_trades:>10} {es_v6.total_trades:>10}")
    print(f"  {'Win Rate':<25} {nq_report.win_rate:>9.1f}% {nq_v6.win_rate:>9.1f}% {es_report.win_rate:>9.1f}% {es_v6.win_rate:>9.1f}%")
    print(f"  {'Profit Factor':<25} {nq_report.profit_factor:>10.2f} {nq_v6.profit_factor:>10.2f} {es_report.profit_factor:>10.2f} {es_v6.profit_factor:>10.2f}")
    print(f"  {'P&L $':<25} {nq_pnl_v7:>+10.2f} {nq_pnl_v6:>+10.2f} {es_pnl_v7:>+10.2f} {es_pnl_v6:>+10.2f}")

    combined_v7 = nq_pnl_v7 + es_pnl_v7
    combined_v6 = nq_pnl_v6 + es_pnl_v6
    print(f"\n  Combined P&L: v7 = ${combined_v7:+.2f}, v6 = ${combined_v6:+.2f}")
    if combined_v7 > combined_v6:
        print(f"  v7 IMPROVEMENT: +${combined_v7 - combined_v6:.2f}")
    else:
        print(f"  v7 REGRESSION: ${combined_v7 - combined_v6:.2f}")

if __name__ == "__main__":
    main()

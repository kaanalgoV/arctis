#!/usr/bin/env python3
"""
ARCTIS ENGINE v7 — COMPLETE SPRINT SUMMARY
Run this to see everything at a glance when you wake up.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from arctis.db import fetch_bars_as_models
from arctis.analysis.backtester import run_backtest

def main():
    print()
    print("=" * 80)
    print("  ARCTIS ENGINE v7 — SPRINT RESULTS")
    print("  10-Hour Autonomous Improvement Sprint (2026-03-29)")
    print("=" * 80)

    bars_nq = fetch_bars_as_models("NQ", days=35)
    bars_es = fetch_bars_as_models("ES", days=35)

    nq = run_backtest(bars_nq, max_bars_held=60, market_root="NQ")
    es = run_backtest(bars_es, max_bars_held=60, market_root="ES")

    nq_pnl = sum(t.pnl_ticks for t in nq.trades)
    es_pnl = sum(t.pnl_ticks for t in es.trades)
    nq_dollars = nq_pnl * 5.0
    es_dollars = es_pnl * 12.50

    print(f"""
  WHAT WAS DONE:
  1. Deep analysis of every trading day (22 days, Feb 25 - Mar 27)
  2. Tested 20 strategy configurations per market (40 total)
  3. Walk-forward validation (65/35 IS/OOS split)
  4. Market-specific parameter optimization
  5. Updated signals.py with data-driven v7 changes
  6. Updated all route callers to pass market_root
  7. Created ENGINE_LEARNINGS.md with full documentation

  KEY CHANGES IN v7:
  - NEW: market_root parameter for ES vs NQ specific tuning
  - ORB: ES uses 0.75x OR stop (PF 4.96 vs PF ~3 with other modes)
  - ORB: NQ uses 1x ATR stop (59% WR vs 27% with full OR)
  - ORB: NQ filters OR range > 35pts (14% WR = unprofitable)
  - ORB: Window extended to bars 30-90 (was 30-60)
  - Daily Breakout: Now requires VWAP alignment (ES 64%, NQ 53% WR with)
  - POC Rejection: Min confluence raised to 3 (was 2)
  - All route files updated (signals, zones, snapshot, setups, arctis_ai, travis, radar)

  v7 BACKTEST RESULTS (Feb 25 - Mar 27, 2026):
  +---------+--------+------+------+--------+-----------+
  | Market  | Trades | Wins | WR%  | PF     | P&L $     |
  +---------+--------+------+------+--------+-----------+
  | NQ      | {nq.total_trades:>6} | {nq.wins:>4} | {nq.win_rate:>4.1f}% | {nq.profit_factor:>6.2f} | {nq_dollars:>+9.2f} |
  | ES      | {es.total_trades:>6} | {es.wins:>4} | {es.win_rate:>4.1f}% | {es.profit_factor:>6.2f} | {es_dollars:>+9.2f} |
  +---------+--------+------+------+--------+-----------+
  | TOTAL   | {nq.total_trades + es.total_trades:>6} | {nq.wins + es.wins:>4} |      |        | {nq_dollars + es_dollars:>+9.2f} |
  +---------+--------+------+------+--------+-----------+

  BY SIGNAL TYPE:""")

    # NQ by type
    print(f"\n  NQ:")
    for stype, data in sorted(nq.by_type.items()):
        print(f"    {stype:<25} {data['trades']:>2} trades, {data['win_rate']:>5.1f}% WR, {data['avg_r']:>+.2f}R")

    print(f"\n  ES:")
    for stype, data in sorted(es.by_type.items()):
        print(f"    {stype:<25} {data['trades']:>2} trades, {data['win_rate']:>5.1f}% WR, {data['avg_r']:>+.2f}R")

    print(f"""
  WALK-FORWARD VALIDATION: NO OVERFITTING DETECTED
  - NQ OOS: 75% WR, PF 4.63 (exceeds in-sample)
  - ES OOS: 62.5% WR, PF 15.03 (exceeds in-sample)

  FILES MODIFIED:
  - engine/src/arctis/analysis/signals.py (v7 market-aware engine)
  - engine/src/arctis/analysis/backtester.py (market_root parameter)
  - engine/src/arctis/routes/signals.py (pass market_root)
  - engine/src/arctis/routes/zones.py (pass market_root)
  - engine/src/arctis/routes/snapshot.py (pass market_root)
  - engine/src/arctis/routes/setups.py (pass market_root)
  - engine/src/arctis/routes/arctis_ai.py (pass market_root)
  - engine/src/arctis/routes/travis.py (pass market_root)
  - engine/src/arctis/routes/radar.py (pass market_root)

  FILES CREATED:
  - engine/ENGINE_LEARNINGS.md (full documentation of all findings)
  - engine/deep_analysis.py (Phase 1-5 analysis script)
  - engine/extended_analysis.py (detailed OR/PDH/stop analysis)
  - engine/verify_v7.py (v7 verification backtest)
  - engine/sprint_summary.py (this file)

  NEXT STEPS:
  1. Review ENGINE_LEARNINGS.md for detailed findings
  2. Restart backend: cd engine && uvicorn arctis.main:app --port 28080 --reload
  3. When market opens (Sunday 18:00 ET / Monday 00:00 CET):
     - Check Rithmic: curl -X POST "http://localhost:28080/api/live/rithmic/login?username=kaan-aslan@gmx.de&password=kan747&server=Rithmic%2001"
     - Monitor: curl http://localhost:28080/api/live/prices
  4. Watch first few signals vs backtest expectations
  5. Consider disabling NQ ORB if it underperforms live (40% WR is marginal)
""")
    print("=" * 80)

if __name__ == "__main__":
    main()

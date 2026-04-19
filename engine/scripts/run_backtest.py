"""Direct backtester runner — bypasses the API to give us logs and variants.

Usage (from repo root):
    .venv/Scripts/python.exe engine/scripts/run_backtest.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Make 'arctis' importable when run from repo root
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from arctis.db import fetch_bars_as_models
from arctis.analysis.backtester import run_backtest


def run_one(market: str, timeframe: str, days: int = 30) -> dict:
    print(f"\n=== {market} {timeframe} (last {days} days) ===", flush=True)
    bars = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
    print(f"Bars loaded: {len(bars)}", flush=True)
    if not bars:
        return {"total_trades": 0, "note": "no bars"}

    # Bar range summary
    from datetime import datetime, timezone
    first = datetime.fromtimestamp(bars[0].timestamp, tz=timezone.utc).isoformat()
    last = datetime.fromtimestamp(bars[-1].timestamp, tz=timezone.utc).isoformat()
    print(f"First bar: {first}", flush=True)
    print(f"Last bar:  {last}", flush=True)

    report = run_backtest(bars, market_root=market)
    summary = {
        "total_trades": report.total_trades,
        "wins": report.wins,
        "losses": report.losses,
        "win_rate": round(report.win_rate, 3),
        "avg_r": round(report.avg_r, 3),
        "profit_factor": round(report.profit_factor, 3),
        "best_type": report.best_type,
        "worst_type": report.worst_type,
        "by_type": {
            k: {
                "trades": v.get("trades"),
                "wins": v.get("wins"),
                "win_rate": round(v.get("win_rate", 0), 3),
                "avg_r": round(v.get("avg_r", 0), 3),
            }
            for k, v in (report.by_type or {}).items()
        },
        "by_confidence": {
            k: {
                "trades": v.get("trades"),
                "win_rate": round(v.get("win_rate", 0), 3),
                "avg_r": round(v.get("avg_r", 0), 3),
            }
            for k, v in (report.by_confidence or {}).items()
        },
    }
    print(json.dumps(summary, indent=2), flush=True)
    return summary


def main():
    all_results = {}
    for market in ("NQ", "ES"):
        for tf in ("1min", "5min"):
            key = f"{market}_{tf}"
            try:
                all_results[key] = run_one(market, tf, days=30)
            except Exception as e:
                print(f"ERROR on {key}: {e}", flush=True)
                all_results[key] = {"error": str(e)}

    # Write combined report next to the audit folder
    out = Path(__file__).resolve().parents[2] / "audit" / "backtest_2026-04-19.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(all_results, indent=2), encoding="utf-8")
    print(f"\nReport written: {out}", flush=True)


if __name__ == "__main__":
    main()

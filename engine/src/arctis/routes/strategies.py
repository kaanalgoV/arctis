"""Strategy Library API — serves strategy definitions with real performance metrics."""

import logging

from fastapi import APIRouter, HTTPException
from arctis.db import get_engine
import sqlalchemy as sa

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


@router.get("")
async def get_strategies():
    """Return all strategy definitions with aggregated performance metrics from real backtests."""
    try:
        engine = get_engine()
    except Exception:
        logger.exception("Failed to connect to database")
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        with engine.connect() as conn:
            rows = conn.execute(sa.text("""
                SELECT
                    sd.id,
                    sd.name,
                    sd.description,
                    sd.category,
                    sd.enabled,
                    sd.is_implemented,
                    COALESCE(perf.total_trades, 0)   AS total_trades,
                    COALESCE(perf.total_wins, 0)     AS total_wins,
                    perf.win_rate,
                    perf.profit_factor,
                    perf.avg_win,
                    perf.avg_loss,
                    perf.best_pf,
                    perf.profitable_runs,
                    perf.total_runs
                FROM strategy_definitions sd
                LEFT JOIN LATERAL (
                    SELECT
                        SUM(rm.total_trades)                                                              AS total_trades,
                        SUM(rm.winning_trades)                                                            AS total_wins,
                        ROUND(
                            SUM(rm.winning_trades)::numeric
                            / NULLIF(SUM(rm.total_trades), 0) * 100,
                        1)                                                                                AS win_rate,
                        ROUND(AVG(rm.profit_factor)::numeric, 2)                                          AS profit_factor,
                        ROUND(AVG(rm.avg_win)::numeric, 0)                                                AS avg_win,
                        ROUND(AVG(rm.avg_loss)::numeric, 0)                                               AS avg_loss,
                        ROUND(MAX(rm.profit_factor)::numeric, 2)                                          AS best_pf,
                        COUNT(*) FILTER (WHERE rm.profit_factor > 1.0)                                    AS profitable_runs,
                        COUNT(*)                                                                           AS total_runs
                    FROM runs r
                    JOIN run_metrics rm ON rm.run_id = r.id
                    WHERE r.strategy = sd.id
                      AND r.status = 'finished'
                      AND rm.total_trades > 5
                ) perf ON true
                ORDER BY perf.total_trades DESC NULLS LAST, sd.name ASC
            """)).fetchall()

        # Rename internal strategy names to Arctis branding
        _NAME_MAP = {
            "Kaan's Session BIAS V2 (NQ)": "Arctis Session BIAS",
            "Kaan's Double Fake Exhaustion v2 (NQ)": "Arctis Double Fake",
            "Kaan's Opening Range Breakout (NQ)": "Arctis Opening Range",
            "Kaan's Front Run (NQ)": "Arctis Front Run",
            "Kaan's Gap Fill (NQ)": "Arctis Gap Fill",
            "Kaan's Hit and Run (NQ)": "Arctis Hit and Run",
            "Kaan's Liquidity Sweep (NQ)": "Arctis Liquidity Sweep",
            "Kaan's Midpoint Reclaim (NQ)": "Arctis Midpoint Reclaim",
            "Kaan's Momentum Ignition (NQ)": "Arctis Momentum Ignition",
            "Kaan's Triple Drive Exhaustion (NQ)": "Arctis Triple Drive",
            "Kaan's VWAP Bounce (NQ)": "Arctis VWAP Bounce",
            "Kaan's Balance Breakout (NQ)": "Arctis Balance Breakout",
            "Kaan's Velocity Engine (NQ)": "Arctis Velocity Engine",
            "Travis Double Fake (NQ)": "Arctis PDH/PDL Double Fake",
            "Travis Session Breakout (NQ)": "Arctis Session Breakout",
            "Travis Velocity Reversal (NQ)": "Arctis Velocity Reversal",
            "MBO Confluence (NQ)": "Arctis Confluence",
            "Traivend Silver Bullet": "Arctis Silver Bullet",
            "Traivend Confluence Scorer": "Arctis Multi-Factor Scorer",
            "Traivend FVG Retest": "Arctis FVG Retest",
            "Traivend Smart Money Reversal": "Arctis Smart Money Reversal",
            "Fakeout Pro V5: Full Kaan": "Arctis Fakeout Pro",
            "Fakeout Pro V1: Multi-Level": "Arctis Fakeout v1",
            "Fakeout Pro V2: MBO Velocity": "Arctis Fakeout v2",
            "Fakeout Pro V3: Absorption": "Arctis Fakeout v3",
            "Fakeout Pro V4: Sweep Reclaim": "Arctis Fakeout v4",
        }

        strategies = []
        for row in rows:
            display_name = _NAME_MAP.get(row.name, row.name)
            strategies.append({
                "id": row.id,
                "name": display_name,
                "description": row.description or "",
                "category": row.category or "other",
                "enabled": row.enabled,
                "is_implemented": row.is_implemented,
                "total_trades": row.total_trades or 0,
                "total_wins": row.total_wins or 0,
                "win_rate": float(row.win_rate) if row.win_rate is not None else None,
                "profit_factor": float(row.profit_factor) if row.profit_factor is not None else None,
                "avg_win": int(row.avg_win) if row.avg_win is not None else None,
                "avg_loss": int(row.avg_loss) if row.avg_loss is not None else None,
                "best_pf": float(row.best_pf) if row.best_pf is not None else None,
                "profitable_runs": int(row.profitable_runs) if row.profitable_runs is not None else 0,
                "total_runs": int(row.total_runs) if row.total_runs is not None else 0,
                "profitable": (float(row.profit_factor) if row.profit_factor is not None else 0) > 1.0,
            })

        return {"strategies": strategies}
    except HTTPException:
        raise
    except Exception as exc:
        # Tables may not exist yet — return empty list instead of 503
        logger.warning("Strategies query failed (tables may not exist): %s", exc)
        return {"strategies": []}

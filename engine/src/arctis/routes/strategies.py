"""Strategy Library API — serves strategy definitions with real performance metrics."""

from fastapi import APIRouter
from arctis.db import get_engine
import sqlalchemy as sa

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


@router.get("")
async def get_strategies():
    """Return all strategy definitions with aggregated performance metrics from real backtests."""
    engine = get_engine()
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

        strategies = []
        for row in rows:
            strategies.append({
                "id": row.id,
                "name": row.name,
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

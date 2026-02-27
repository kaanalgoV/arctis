"""Risk management API endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from arctis.analysis.risk import calculate_position_size, check_daily_risk
from arctis.config import TradingConfig, load_config, save_config

router = APIRouter(prefix="/api")


class PositionSizeRequest(BaseModel):
    stop_distance: float
    market: str = "ES"


class DailyRiskRequest(BaseModel):
    realized_pnl: float = 0.0
    trade_count: int = 0
    consecutive_losses: int = 0


@router.post("/risk/position-size")
async def position_size(req: PositionSizeRequest):
    config = load_config()
    tick_value = config.tick_value_es if req.market == "ES" else config.tick_value_nq
    tick_size = config.tick_size_es if req.market == "ES" else config.tick_size_nq

    result = calculate_position_size(
        account_size=config.account_size,
        risk_percent=config.risk_percent,
        stop_distance=req.stop_distance,
        tick_value=tick_value,
        tick_size=tick_size,
    )
    return {
        "contracts": result.contracts,
        "risk_amount": round(result.risk_amount, 2),
        "risk_per_contract": round(result.risk_per_contract, 2),
    }


@router.post("/risk/daily-check")
async def daily_risk_check(req: DailyRiskRequest):
    config = load_config()
    result = check_daily_risk(
        realized_pnl=req.realized_pnl,
        daily_limit=config.daily_loss_limit,
        trade_count=req.trade_count,
        max_trades=config.max_daily_trades,
    )
    return {
        "can_trade": result.can_trade,
        "risk_used_percent": round(result.risk_used_percent, 1),
        "warnings": result.warnings,
    }


@router.get("/config")
async def get_config():
    config = load_config()
    return config.__dict__


@router.put("/config")
async def update_config(config: TradingConfig):
    save_config(config)
    return {"status": "saved"}

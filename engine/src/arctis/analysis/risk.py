"""Risk management and position sizing."""

from dataclasses import dataclass, field
import math


@dataclass
class PositionSize:
    contracts: int
    risk_amount: float
    risk_per_contract: float


@dataclass
class DailyRiskCheck:
    can_trade: bool
    risk_used_percent: float
    warnings: list[str] = field(default_factory=list)


def calculate_position_size(
    account_size: float,
    risk_percent: float,
    stop_distance: float,
    tick_value: float,
    tick_size: float,
) -> PositionSize:
    """Calculate position size based on account risk parameters.

    Args:
        account_size: Total account value.
        risk_percent: Percentage of account to risk per trade.
        stop_distance: Distance to stop-loss in price units.
        tick_value: Dollar value per tick.
        tick_size: Minimum price increment.

    Returns:
        PositionSize with contracts (rounded down), risk amount, and risk per contract.
    """
    if stop_distance <= 0 or tick_size <= 0:
        return PositionSize(contracts=0, risk_amount=0.0, risk_per_contract=0.0)

    risk_amount = account_size * (risk_percent / 100.0)
    ticks_in_stop = stop_distance / tick_size
    risk_per_contract = ticks_in_stop * tick_value

    if risk_per_contract <= 0:
        return PositionSize(contracts=0, risk_amount=risk_amount, risk_per_contract=0.0)

    contracts = math.floor(risk_amount / risk_per_contract)
    return PositionSize(
        contracts=contracts,
        risk_amount=risk_amount,
        risk_per_contract=risk_per_contract,
    )


def check_daily_risk(
    realized_pnl: float,
    daily_limit: float,
    trade_count: int,
    max_trades: int,
) -> DailyRiskCheck:
    """Check whether trading is still allowed based on daily risk limits.

    Args:
        realized_pnl: Realized profit/loss for the day (negative = loss).
        daily_limit: Maximum allowed daily loss.
        trade_count: Number of trades taken today.
        max_trades: Maximum allowed trades per day.

    Returns:
        DailyRiskCheck with can_trade flag, risk usage percentage, and warnings.
    """
    warnings: list[str] = []
    can_trade = True

    risk_used = abs(min(realized_pnl, 0))
    risk_used_pct = (risk_used / daily_limit * 100) if daily_limit > 0 else 0

    if risk_used >= daily_limit:
        can_trade = False
        warnings.append(f"Tages-Limit erreicht: ${risk_used:.0f} / ${daily_limit:.0f}")
    elif risk_used_pct >= 75:
        warnings.append(
            f"Tages-Limit bei {risk_used_pct:.0f}%: ${risk_used:.0f} / ${daily_limit:.0f}"
        )

    if trade_count >= max_trades:
        can_trade = False
        warnings.append(f"Max Trades erreicht: {trade_count} / {max_trades}")
    elif trade_count >= max_trades * 0.8:
        warnings.append(
            f"Achtung: {trade_count} von {max_trades} Trades verbraucht"
        )

    return DailyRiskCheck(
        can_trade=can_trade,
        risk_used_percent=risk_used_pct,
        warnings=warnings,
    )

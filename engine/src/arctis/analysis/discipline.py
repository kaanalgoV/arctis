"""Discipline and warning system. Facts only, no psychology."""

from dataclasses import dataclass
from enum import Enum

from arctis.analysis.structure import TrendState


class WarningSeverity(str, Enum):
    INFO = "info"
    CAUTION = "caution"
    STOP = "stop"


@dataclass
class Warning:
    message: str
    severity: WarningSeverity


@dataclass
class DisciplineContext:
    trend: TrendState
    session: str
    risk_used_pct: float
    trade_count: int
    max_trades: int
    consecutive_losses: int


WEAK_SESSIONS = {"midday", "after_hours", "closed", "premarket"}


def generate_warnings(ctx: DisciplineContext) -> list[Warning]:
    warnings: list[Warning] = []

    if ctx.trend == TrendState.RANGE:
        warnings.append(Warning(
            message="Kein Trend erkannt — Markt in Range. Breakout-Risiko beachten.",
            severity=WarningSeverity.CAUTION,
        ))

    if ctx.session in WEAK_SESSIONS:
        warnings.append(Warning(
            message=f"Historisch schwache Phase ({ctx.session}). Reduzierte Bewegung erwartet.",
            severity=WarningSeverity.CAUTION,
        ))

    if ctx.risk_used_pct >= 90:
        warnings.append(Warning(
            message=f"Tages-Risiko bei {ctx.risk_used_pct:.0f}%. Handel einstellen empfohlen.",
            severity=WarningSeverity.STOP,
        ))
    elif ctx.risk_used_pct >= 70:
        warnings.append(Warning(
            message=f"Tages-Risiko bei {ctx.risk_used_pct:.0f}% des Limits.",
            severity=WarningSeverity.CAUTION,
        ))

    if ctx.consecutive_losses >= 3:
        warnings.append(Warning(
            message=f"{ctx.consecutive_losses} Verlusttrades in Folge. Pause empfohlen.",
            severity=WarningSeverity.STOP,
        ))
    elif ctx.consecutive_losses >= 2:
        warnings.append(Warning(
            message=f"{ctx.consecutive_losses} Verlusttrades in Folge.",
            severity=WarningSeverity.CAUTION,
        ))

    if ctx.trade_count >= ctx.max_trades * 0.8:
        warnings.append(Warning(
            message=f"{ctx.trade_count}/{ctx.max_trades} Trades verbraucht.",
            severity=WarningSeverity.CAUTION,
        ))

    return warnings

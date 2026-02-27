import pytest
from arctis.analysis.discipline import generate_warnings, DisciplineContext, Warning, WarningSeverity
from arctis.analysis.structure import TrendState


class TestDisciplineWarnings:
    def test_no_warnings_in_good_conditions(self):
        ctx = DisciplineContext(trend=TrendState.UPTREND, session="ny_open", risk_used_pct=20.0, trade_count=1, max_trades=10, consecutive_losses=0)
        warnings = generate_warnings(ctx)
        assert len(warnings) == 0

    def test_warns_on_range_market(self):
        ctx = DisciplineContext(trend=TrendState.RANGE, session="ny_open", risk_used_pct=20.0, trade_count=1, max_trades=10, consecutive_losses=0)
        warnings = generate_warnings(ctx)
        assert any("range" in w.message.lower() or "kein" in w.message.lower() for w in warnings)

    def test_warns_on_midday_session(self):
        ctx = DisciplineContext(trend=TrendState.UPTREND, session="midday", risk_used_pct=20.0, trade_count=1, max_trades=10, consecutive_losses=0)
        warnings = generate_warnings(ctx)
        assert any("midday" in w.message.lower() or "schwach" in w.message.lower() for w in warnings)

    def test_warns_on_consecutive_losses(self):
        ctx = DisciplineContext(trend=TrendState.UPTREND, session="ny_open", risk_used_pct=20.0, trade_count=4, max_trades=10, consecutive_losses=3)
        warnings = generate_warnings(ctx)
        assert any("verlust" in w.message.lower() or "pause" in w.message.lower() for w in warnings)

    def test_warns_on_high_risk_usage(self):
        ctx = DisciplineContext(trend=TrendState.UPTREND, session="ny_open", risk_used_pct=80.0, trade_count=1, max_trades=10, consecutive_losses=0)
        warnings = generate_warnings(ctx)
        assert any("risiko" in w.message.lower() or "limit" in w.message.lower() for w in warnings)

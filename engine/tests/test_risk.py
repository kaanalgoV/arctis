import pytest
from arctis.analysis.risk import calculate_position_size, check_daily_risk


class TestPositionSize:
    def test_basic_calculation(self):
        size = calculate_position_size(account_size=50000, risk_percent=1.0, stop_distance=10.0, tick_value=12.50, tick_size=0.25)
        assert size.contracts == 1
        assert size.risk_amount == 500.0

    def test_fractional_rounds_down(self):
        size = calculate_position_size(account_size=50000, risk_percent=1.0, stop_distance=7.0, tick_value=12.50, tick_size=0.25)
        assert size.contracts == 1

    def test_zero_stop_distance(self):
        size = calculate_position_size(account_size=50000, risk_percent=1.0, stop_distance=0.0, tick_value=12.50, tick_size=0.25)
        assert size.contracts == 0


class TestDailyRisk:
    def test_within_limit(self):
        result = check_daily_risk(realized_pnl=-200, daily_limit=1000, trade_count=2, max_trades=10)
        assert result.can_trade is True
        assert len(result.warnings) == 0

    def test_exceeds_limit(self):
        result = check_daily_risk(realized_pnl=-1100, daily_limit=1000, trade_count=2, max_trades=10)
        assert result.can_trade is False
        assert any("limit" in w.lower() for w in result.warnings)

    def test_overtrading_warning(self):
        result = check_daily_risk(realized_pnl=0, daily_limit=1000, trade_count=9, max_trades=10)
        assert any("trades" in w.lower() for w in result.warnings)

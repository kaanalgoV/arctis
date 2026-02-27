"""User configuration for risk and trading parameters."""

import json
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class TradingConfig:
    account_size: float = 50000.0
    risk_percent: float = 1.0
    daily_loss_limit: float = 1000.0
    max_daily_trades: int = 10
    tick_value_es: float = 12.50
    tick_size_es: float = 0.25
    tick_value_nq: float = 5.00
    tick_size_nq: float = 0.25


CONFIG_PATH = Path(__file__).parent.parent.parent.parent / "data" / "config.json"


def load_config() -> TradingConfig:
    if CONFIG_PATH.exists():
        data = json.loads(CONFIG_PATH.read_text())
        return TradingConfig(**data)
    return TradingConfig()


def save_config(config: TradingConfig) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(asdict(config), indent=2))

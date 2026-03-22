"""Technical indicators: EMA Ribbon and RSI."""

from dataclasses import dataclass

from arctis.models import OHLCVBar


@dataclass
class EMAData:
    timestamp: int
    ema9: float
    ema21: float
    ema50: float
    alignment: str  # "bullish", "bearish", "mixed"


@dataclass
class RSIData:
    timestamp: int
    rsi: float
    divergence: str | None  # "bullish", "bearish", "hidden_bullish", "hidden_bearish", None


def calculate_ema(values: list[float], period: int) -> list[float | None]:
    """Calculate Exponential Moving Average."""
    if len(values) < period:
        return [None] * len(values)

    multiplier = 2.0 / (period + 1)
    ema_values: list[float | None] = [None] * (period - 1)

    # SMA for first EMA value
    sma = sum(values[:period]) / period
    ema_values.append(sma)

    for i in range(period, len(values)):
        prev = ema_values[-1]
        if prev is None:
            ema_values.append(None)
            continue
        ema_val = (values[i] - prev) * multiplier + prev
        ema_values.append(ema_val)

    return ema_values


def calculate_ema_ribbon(bars: list[OHLCVBar]) -> list[EMAData]:
    """Calculate 9/21/50 EMA ribbon with alignment classification."""
    closes = [b.close for b in bars]
    ema9 = calculate_ema(closes, 9)
    ema21 = calculate_ema(closes, 21)
    ema50 = calculate_ema(closes, 50)

    results = []
    for i, bar in enumerate(bars):
        e9, e21, e50 = ema9[i], ema21[i], ema50[i]
        if e9 is None or e21 is None or e50 is None:
            continue

        if e9 > e21 > e50:
            alignment = "bullish"
        elif e9 < e21 < e50:
            alignment = "bearish"
        else:
            alignment = "mixed"

        results.append(
            EMAData(
                timestamp=bar.timestamp,
                ema9=round(e9, 2),
                ema21=round(e21, 2),
                ema50=round(e50, 2),
                alignment=alignment,
            )
        )

    return results


def calculate_rsi(bars: list[OHLCVBar], period: int = 14) -> list[RSIData]:
    """Calculate RSI with divergence detection."""
    if len(bars) < period + 1:
        return []

    closes = [b.close for b in bars]

    # Calculate gains and losses
    gains = []
    losses = []
    for i in range(1, len(closes)):
        change = closes[i] - closes[i - 1]
        gains.append(max(0, change))
        losses.append(max(0, -change))

    # Initial averages
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    rsi_values: list[float | None] = [None] * period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            rsi_values.append(100.0)
        else:
            rs = avg_gain / avg_loss
            rsi_values.append(round(100 - (100 / (1 + rs)), 2))

    # Detect divergences (look back 20 bars for swing comparison)
    results = []
    lookback = 20
    for i in range(len(bars)):
        rsi_val = rsi_values[i] if i < len(rsi_values) else None
        if rsi_val is None:
            continue

        divergence = None
        if i >= lookback:
            # Find recent swing high/low in price and RSI
            price_window = closes[i - lookback : i + 1]
            rsi_window = [
                r for r in rsi_values[i - lookback : i + 1] if r is not None
            ]

            if len(rsi_window) >= 10:
                # Bearish divergence: price HH but RSI LH
                if closes[i] >= max(price_window[:-1]) and rsi_val < max(
                    rsi_window[:-1]
                ):
                    divergence = "bearish"
                # Bullish divergence: price LL but RSI HL
                elif closes[i] <= min(price_window[:-1]) and rsi_val > min(
                    rsi_window[:-1]
                ):
                    divergence = "bullish"
                # Hidden bullish: price HL but RSI LL (trend continuation)
                elif closes[i] > min(price_window[:-1]) and rsi_val <= min(
                    rsi_window[:-1]
                ):
                    divergence = "hidden_bullish"
                # Hidden bearish: price LH but RSI HH
                elif closes[i] < max(price_window[:-1]) and rsi_val >= max(
                    rsi_window[:-1]
                ):
                    divergence = "hidden_bearish"

        results.append(
            RSIData(
                timestamp=bars[i].timestamp,
                rsi=rsi_val,
                divergence=divergence,
            )
        )

    return results

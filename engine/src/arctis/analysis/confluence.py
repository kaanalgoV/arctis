"""Confluence Score Engine - combines all indicators into actionable signals."""

from dataclasses import dataclass, field
from arctis.models import OHLCVBar

@dataclass
class Signal:
    name: str
    direction: str  # "long", "short", "neutral"
    strength: int  # points (positive = long bias, negative = short bias)
    detail: str  # human-readable explanation

@dataclass
class ConfluenceResult:
    score: int  # positive = long bias, negative = short bias
    max_score: int  # theoretical maximum
    direction: str  # "LONG", "SHORT", "NEUTRAL"
    confidence: str  # "HIGH", "MODERATE", "LOW"
    signals: list[Signal] = field(default_factory=list)

def calculate_confluence(
    bars: list[OHLCVBar],
    trend: str,  # "uptrend", "downtrend", "range"
    vwap_data: dict | None = None,  # latest VWAP data
    ema_data: dict | None = None,  # latest EMA data
    rsi_data: dict | None = None,  # latest RSI data
    volume_profile: dict | None = None,  # POC, VAH, VAL
    session_levels: dict | None = None,  # prev day levels, ORB
    volume_spikes: list | None = None,
) -> ConfluenceResult:
    """Calculate confluence score from all available indicators.

    Scoring: positive = long bias, negative = short bias.
    Each signal contributes +-1 to +-2 points.
    """
    signals: list[Signal] = []

    if not bars:
        return ConfluenceResult(0, 14, "NEUTRAL", "LOW", [])

    current_price = bars[-1].close

    # 1. TREND STRUCTURE (+/- 2 points)
    if trend == "uptrend":
        signals.append(Signal("Marktstruktur", "long", 2, "Aufwärtstrend (Higher Highs / Higher Lows)"))
    elif trend == "downtrend":
        signals.append(Signal("Marktstruktur", "short", -2, "Abwärtstrend (Lower Highs / Lower Lows)"))
    else:
        signals.append(Signal("Marktstruktur", "neutral", 0, "Seitwärtsmarkt (Range)"))

    # 2. EMA ALIGNMENT (+/- 1 point)
    if ema_data:
        alignment = ema_data.get("alignment", "mixed")
        if alignment == "bullish":
            signals.append(Signal("EMA Ribbon", "long", 1, f"Bullish Stack: 9>{ema_data.get('ema9',0):.0f} > 21>{ema_data.get('ema21',0):.0f} > 50>{ema_data.get('ema50',0):.0f}"))
        elif alignment == "bearish":
            signals.append(Signal("EMA Ribbon", "short", -1, f"Bearish Stack: 9<{ema_data.get('ema9',0):.0f} < 21<{ema_data.get('ema21',0):.0f} < 50<{ema_data.get('ema50',0):.0f}"))
        else:
            signals.append(Signal("EMA Ribbon", "neutral", 0, "EMAs nicht aligned (Mixed)"))

    # 3. VWAP BIAS (+/- 1 point)
    if vwap_data:
        vwap = vwap_data.get("vwap", 0)
        upper1 = vwap_data.get("upper_1", 0)
        lower1 = vwap_data.get("lower_1", 0)
        upper2 = vwap_data.get("upper_2", 0)
        lower2 = vwap_data.get("lower_2", 0)

        if vwap > 0:
            if current_price > vwap:
                signals.append(Signal("VWAP Bias", "long", 1, f"Preis ({current_price:.2f}) über VWAP ({vwap:.2f})"))
            else:
                signals.append(Signal("VWAP Bias", "short", -1, f"Preis ({current_price:.2f}) unter VWAP ({vwap:.2f})"))

            # 4. VWAP BAND POSITION (+/- 1 point for mean reversion zones)
            if lower1 <= current_price <= vwap and trend == "uptrend":
                signals.append(Signal("VWAP Pullback", "long", 1, f"Pullback zur VWAP im Aufwärtstrend"))
            elif vwap <= current_price <= upper1 and trend == "downtrend":
                signals.append(Signal("VWAP Pullback", "short", -1, f"Rally zur VWAP im Abwärtstrend"))
            elif current_price >= upper2:
                signals.append(Signal("VWAP Überextension", "short", -1, f"Preis über +2SD Band - überextendiert"))
            elif current_price <= lower2:
                signals.append(Signal("VWAP Überextension", "long", 1, f"Preis unter -2SD Band - überextendiert"))

    # 5. VOLUME PROFILE / POC (+/- 2 points)
    if volume_profile:
        poc = volume_profile.get("poc", 0)
        vah = volume_profile.get("vah", 0)
        val = volume_profile.get("val", 0)

        if poc > 0:
            # Calculate ATR-like range for proximity check
            recent = bars[-20:] if len(bars) >= 20 else bars
            avg_range = sum(b.high - b.low for b in recent) / len(recent)
            threshold = avg_range * 2

            if abs(current_price - poc) < threshold:
                if current_price >= poc:
                    signals.append(Signal("Volume Profile", "long", 2, f"Preis nahe POC ({poc:.2f}) - starker Support"))
                else:
                    signals.append(Signal("Volume Profile", "short", -2, f"Preis nahe POC ({poc:.2f}) - starke Resistance"))
            elif val > 0 and abs(current_price - val) < threshold:
                signals.append(Signal("Volume Profile", "long", 2, f"Preis nahe VAL ({val:.2f}) - Value Area Support"))
            elif vah > 0 and abs(current_price - vah) < threshold:
                signals.append(Signal("Volume Profile", "short", -2, f"Preis nahe VAH ({vah:.2f}) - Value Area Resistance"))

    # 6. RSI (+/- 1 to 2 points)
    if rsi_data:
        rsi = rsi_data.get("rsi", 50)
        divergence = rsi_data.get("divergence")

        # RSI pullback zone
        if 30 <= rsi <= 45 and trend == "uptrend":
            signals.append(Signal("RSI", "long", 1, f"RSI ({rsi:.0f}) in Pullback-Zone im Aufwärtstrend"))
        elif 55 <= rsi <= 70 and trend == "downtrend":
            signals.append(Signal("RSI", "short", -1, f"RSI ({rsi:.0f}) in Rally-Zone im Abwärtstrend"))
        elif rsi > 75:
            signals.append(Signal("RSI", "short", -1, f"RSI ({rsi:.0f}) überkauft"))
        elif rsi < 25:
            signals.append(Signal("RSI", "long", 1, f"RSI ({rsi:.0f}) überverkauft"))

        # Divergence (+/- 2 points - high value signal)
        if divergence == "bullish":
            signals.append(Signal("RSI Divergenz", "long", 2, "Bullish Divergenz: Preis tiefer, RSI höher"))
        elif divergence == "bearish":
            signals.append(Signal("RSI Divergenz", "short", -2, "Bearish Divergenz: Preis höher, RSI tiefer"))
        elif divergence == "hidden_bullish":
            signals.append(Signal("RSI Divergenz", "long", 1, "Hidden Bullish Divergenz (Trendfortsetzung)"))
        elif divergence == "hidden_bearish":
            signals.append(Signal("RSI Divergenz", "short", -1, "Hidden Bearish Divergenz (Trendfortsetzung)"))

    # 7. SESSION LEVELS (+/- 1 point)
    if session_levels:
        orh = session_levels.get("opening_range_high")
        orl = session_levels.get("opening_range_low")
        prev_high = session_levels.get("prev_high")
        prev_low = session_levels.get("prev_low")

        if orh and orl:
            if current_price > orh:
                signals.append(Signal("Opening Range", "long", 1, f"Preis über Opening Range High ({orh:.2f})"))
            elif current_price < orl:
                signals.append(Signal("Opening Range", "short", -1, f"Preis unter Opening Range Low ({orl:.2f})"))

        if prev_high and current_price > prev_high:
            signals.append(Signal("Prev Day", "long", 1, f"Über Vortages-Hoch ({prev_high:.2f})"))
        elif prev_low and current_price < prev_low:
            signals.append(Signal("Prev Day", "short", -1, f"Unter Vortages-Tief ({prev_low:.2f})"))

    # 8. VOLUME CONFIRMATION (+/- 1 point)
    if volume_spikes and len(volume_spikes) > 0:
        latest_spike = volume_spikes[-1]
        if bars[-1].close > bars[-1].open:
            signals.append(Signal("Volume", "long", 1, f"Volume-Spike ({latest_spike.get('ratio', 0):.1f}x) bei grüner Kerze"))
        else:
            signals.append(Signal("Volume", "short", -1, f"Volume-Spike ({latest_spike.get('ratio', 0):.1f}x) bei roter Kerze"))

    # Calculate total score
    total_score = sum(s.strength for s in signals)
    abs_score = abs(total_score)

    if total_score > 0:
        direction = "LONG"
    elif total_score < 0:
        direction = "SHORT"
    else:
        direction = "NEUTRAL"

    if abs_score >= 8:
        confidence = "STARK"
    elif abs_score >= 5:
        confidence = "MITTEL"
    else:
        confidence = "SCHWACH"

    return ConfluenceResult(
        score=total_score,
        max_score=14,
        direction=direction,
        confidence=confidence,
        signals=signals,
    )

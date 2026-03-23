"""Trade signal recognition based on Travis/Traivend methodology.

Rules (from Travis methodology):
- BOS at markante Strukturpunkte = directional signal
- Fakeout + reversal = counter-trend signal
- Opening Range/IB break with volume confirmation = breakout signal
- POC rejection = reversal signal
- Value Area edge reaction = boundary trade signal
- 5-Bias-State determines allowed direction

Each signal includes:
- direction: "long" | "short"
- entry_price: where to enter
- stop_price: where to place stop (below/above structure)
- target_price: where to take profit (next key level / naked POC)
- risk_reward: calculated R:R ratio
- confidence: "high" | "medium" | "low"
- reason: text explanation
"""

from dataclasses import dataclass

from arctis.models import OHLCVBar


@dataclass
class TradeSignal:
    direction: str      # "long" | "short"
    signal_type: str    # "orb_break" | "ib_break" | "poc_rejection" | "va_edge" | "fakeout" | "bos"
    entry_price: float
    stop_price: float
    target_price: float
    risk_reward: float
    confidence: str     # "high" | "medium" | "low"
    reason: str
    timestamp: int


def detect_signals(
    bars: list[OHLCVBar],
    bias_state: str = "RANGE",
    bias_score: int = 0,
    poc: float | None = None,
    vah: float | None = None,
    val: float | None = None,
    prev_high: float | None = None,
    prev_low: float | None = None,
    or_high: float | None = None,
    or_low: float | None = None,
    ib_high: float | None = None,
    ib_low: float | None = None,
    naked_pocs: list[float] | None = None,
    key_levels: list[dict] | None = None,
) -> list[TradeSignal]:
    """Detect trade signals based on current market state.

    Only generates signals in the direction of the bias:
    - LONG/RANGE_LONG: only long signals
    - SHORT/RANGE_SHORT: only short signals
    - RANGE: both directions, lower confidence
    """
    if len(bars) < 50:
        return []

    signals: list[TradeSignal] = []
    last = bars[-1]
    last_price = last.close

    # Determine allowed directions based on bias
    allow_long = bias_state in ("LONG", "RANGE_LONG", "RANGE")
    allow_short = bias_state in ("SHORT", "RANGE_SHORT", "RANGE")
    base_confidence: str
    if bias_state in ("LONG", "SHORT"):
        base_confidence = "high"
    elif bias_state in ("RANGE_LONG", "RANGE_SHORT"):
        base_confidence = "medium"
    else:
        base_confidence = "low"

    # Find nearest target levels
    targets_above: list[float] = []
    targets_below: list[float] = []

    if prev_high is not None:
        targets_above.append(prev_high)
    if vah is not None:
        targets_above.append(vah)
    if naked_pocs:
        for np_price in naked_pocs:
            if np_price > last_price:
                targets_above.append(np_price)
            else:
                targets_below.append(np_price)
    if prev_low is not None:
        targets_below.append(prev_low)
    if val is not None:
        targets_below.append(val)
    if key_levels:
        for kl in key_levels:
            lvl = kl.get("level", 0)
            if lvl > last_price:
                targets_above.append(lvl)
            else:
                targets_below.append(lvl)

    targets_above.sort()
    targets_below.sort(reverse=True)

    # Calculate recent volatility (ATR approximation) for stop placement
    recent_bars = bars[-20:]
    atr = sum(b.high - b.low for b in recent_bars) / len(recent_bars)
    if atr < 0.25:
        atr = 0.25  # floor to avoid division issues

    # ── 1. ORB Breakout ──────────────────────────────────────────────────────
    if or_high is not None and or_low is not None:
        or_range = or_high - or_low
        if or_range > 0 and last_price > or_high and allow_long:
            stop = or_low
            risk = max(last_price - stop, 0.01)
            target = (
                targets_above[0]
                if targets_above
                else last_price + risk * 2
            )
            rr = (target - last_price) / risk
            if rr >= 1.5:
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="orb_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=base_confidence,
                        reason=(
                            f"ORB Breakout Long: Preis ueber Opening Range"
                            f" ({or_high:.0f}), Stop {stop:.0f},"
                            f" Ziel {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

        if or_range > 0 and last_price < or_low and allow_short:
            stop = or_high
            risk = max(stop - last_price, 0.01)
            target = (
                targets_below[0]
                if targets_below
                else last_price - risk * 2
            )
            rr = (last_price - target) / risk
            if rr >= 1.5:
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="orb_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=base_confidence,
                        reason=(
                            f"ORB Breakout Short: Preis unter Opening Range"
                            f" ({or_low:.0f}), Stop {stop:.0f},"
                            f" Ziel {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

    # ── 2. IB Break ──────────────────────────────────────────────────────────
    if ib_high is not None and ib_low is not None:
        if last_price > ib_high and allow_long:
            stop = ib_low
            risk = max(last_price - stop, 0.01)
            target = (
                targets_above[0]
                if targets_above
                else last_price + (last_price - ib_low)
            )
            rr = (target - last_price) / risk
            if rr >= 1.0:
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="ib_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=base_confidence,
                        reason=(
                            f"IB Break Long: Initial Balance ({ib_high:.0f})"
                            f" gebrochen, Stop {stop:.0f},"
                            f" Ziel {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

        if last_price < ib_low and allow_short:
            stop = ib_high
            risk = max(stop - last_price, 0.01)
            target = (
                targets_below[0]
                if targets_below
                else last_price - (ib_high - last_price)
            )
            rr = (last_price - target) / risk
            if rr >= 1.0:
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="ib_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=base_confidence,
                        reason=(
                            f"IB Break Short: Initial Balance ({ib_low:.0f})"
                            f" gebrochen, Stop {stop:.0f},"
                            f" Ziel {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

    # ── 3. POC Rejection ─────────────────────────────────────────────────────
    if poc is not None:
        distance_to_poc = abs(last_price - poc)
        if distance_to_poc < atr * 0.5 and len(bars) >= 3:
            b_minus2 = bars[-3]
            b_minus1 = bars[-2]

            # Long rejection: price was approaching from below, now bouncing up
            approaching_from_below = (
                b_minus2.close < poc and b_minus1.close < poc
            )
            bouncing_up = last_price > b_minus1.close and last_price > poc

            if approaching_from_below and bouncing_up and allow_long:
                stop = poc - atr
                risk = max(last_price - stop, 0.01)
                target = (
                    targets_above[0]
                    if targets_above
                    else last_price + atr * 2
                )
                rr = (target - last_price) / risk
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="poc_rejection",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence="medium",
                        reason=(
                            f"POC Rejection Long: Ablehnung am POC ({poc:.0f}),"
                            f" Stop {stop:.0f}, Ziel {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

            # Short rejection: price was approaching from above, now bouncing down
            approaching_from_above = (
                b_minus2.close > poc and b_minus1.close > poc
            )
            bouncing_down = last_price < b_minus1.close and last_price < poc

            if approaching_from_above and bouncing_down and allow_short:
                stop = poc + atr
                risk = max(stop - last_price, 0.01)
                target = (
                    targets_below[0]
                    if targets_below
                    else last_price - atr * 2
                )
                rr = (last_price - target) / risk
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="poc_rejection",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence="medium",
                        reason=(
                            f"POC Rejection Short: Ablehnung am POC ({poc:.0f}),"
                            f" Stop {stop:.0f}, Ziel {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

    # ── 4. Value Area Edge ───────────────────────────────────────────────────
    if vah is not None and val is not None:
        va_midpoint = (vah + val) / 2
        poc_fallback = poc if poc is not None else va_midpoint

        # VAH rejection (short)
        if abs(last_price - vah) < atr * 0.3 and allow_short:
            stop = vah + atr
            risk = max(stop - last_price, 0.01)
            target = poc_fallback
            rr = (last_price - target) / risk
            if rr >= 1.0:
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="va_edge",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence="medium",
                        reason=(
                            f"VAH Rejection: Preis am Value Area High ({vah:.0f}),"
                            f" Stop {stop:.0f}, Ziel POC {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

        # VAL support (long)
        if abs(last_price - val) < atr * 0.3 and allow_long:
            stop = val - atr
            risk = max(last_price - stop, 0.01)
            target = poc_fallback
            rr = (target - last_price) / risk
            if rr >= 1.0:
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="va_edge",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence="medium",
                        reason=(
                            f"VAL Support: Preis am Value Area Low ({val:.0f}),"
                            f" Stop {stop:.0f}, Ziel POC {target:.0f}"
                        ),
                        timestamp=last.timestamp,
                    )
                )

    # ── 5. Naked POC Magnet ──────────────────────────────────────────────────
    if naked_pocs:
        # Find the closest naked POC
        closest_above = min(
            (np_price for np_price in naked_pocs if np_price > last_price),
            default=None,
        )
        closest_below = max(
            (np_price for np_price in naked_pocs if np_price < last_price),
            default=None,
        )

        # Price trending toward naked POC above = long
        if (
            closest_above is not None
            and len(bars) >= 3
            and allow_long
        ):
            distance = closest_above - last_price
            if distance < atr * 3:
                momentum_up = bars[-1].close > bars[-2].close > bars[-3].close
                if momentum_up:
                    stop = last_price - atr
                    risk = max(last_price - stop, 0.01)
                    rr = distance / risk
                    if rr >= 1.5:
                        signals.append(
                            TradeSignal(
                                direction="long",
                                signal_type="bos",
                                entry_price=last_price,
                                stop_price=stop,
                                target_price=closest_above,
                                risk_reward=round(rr, 1),
                                confidence="medium",
                                reason=(
                                    f"Naked POC Magnet Long: Ungetesteter POC"
                                    f" bei {closest_above:.0f},"
                                    f" Momentum aufwaerts, Stop {stop:.0f}"
                                ),
                                timestamp=last.timestamp,
                            )
                        )

        # Price trending toward naked POC below = short
        if (
            closest_below is not None
            and len(bars) >= 3
            and allow_short
        ):
            distance = last_price - closest_below
            if distance < atr * 3:
                momentum_down = bars[-1].close < bars[-2].close < bars[-3].close
                if momentum_down:
                    stop = last_price + atr
                    risk = max(stop - last_price, 0.01)
                    rr = distance / risk
                    if rr >= 1.5:
                        signals.append(
                            TradeSignal(
                                direction="short",
                                signal_type="bos",
                                entry_price=last_price,
                                stop_price=stop,
                                target_price=closest_below,
                                risk_reward=round(rr, 1),
                                confidence="medium",
                                reason=(
                                    f"Naked POC Magnet Short: Ungetesteter POC"
                                    f" bei {closest_below:.0f},"
                                    f" Momentum abwaerts, Stop {stop:.0f}"
                                ),
                                timestamp=last.timestamp,
                            )
                        )

    # Sort by confidence (high first) then by R:R descending
    _conf_order = {"high": 0, "medium": 1, "low": 2}
    signals.sort(key=lambda s: (_conf_order.get(s.confidence, 2), -s.risk_reward))

    return signals

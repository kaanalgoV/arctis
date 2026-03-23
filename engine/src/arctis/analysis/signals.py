"""Trade signal recognition based on Travis/Traivend methodology.

Rules (from Travis methodology):
- BOS at markante Strukturpunkte = directional signal
- Fakeout + reversal = counter-trend signal
- Opening Range/IB break with volume confirmation = breakout signal
- POC rejection = reversal signal
- Value Area edge reaction = boundary trade signal
- Sammelzone Breakout = consolidation range breakout (Travis: "70-80% range completion")
- Absorption Trade = Liquiditaetsblock absorption and reversal
- 5-Bias-State determines allowed direction

Each signal includes:
- direction: "long" | "short"
- entry_price: where to enter
- stop_price: where to place stop (below/above structure)
- target_price: where to take profit (next key level / naked POC)
- risk_reward: calculated R:R ratio
- confidence: "high" | "medium" | "low"  (3+ confirmations = high, 2 = medium, 1 = low)
- reason: text explanation

Confidence scoring (confirmations counted):
  1. Bias aligned with signal direction
  2. Volume above 20-bar average at breakout bar
  3. Structure confirms direction (last 3 bars trending)
  4. Velocity aligned (closing in upper/lower half of bar range)
  5. Multiple key levels cluster near target
  3+ confirmations -> "high", 2 -> "medium", 1 -> "low"
"""

from dataclasses import dataclass

from arctis.models import OHLCVBar


@dataclass
class TradeSignal:
    direction: str      # "long" | "short"
    signal_type: str    # "orb_break" | "ib_break" | "poc_rejection" | "va_edge" | "bos"
                        # "sammelzone_breakout" | "absorption"
    entry_price: float
    stop_price: float
    target_price: float
    risk_reward: float
    confidence: str     # "high" | "medium" | "low"
    reason: str
    timestamp: int


def _count_confirmations(
    bars: list[OHLCVBar],
    direction: str,
    bias_state: str,
    avg_volume: float,
) -> int:
    """Count how many of the four confirmation signals are present.

    Returns an integer 0-4:
      1. Bias aligned with direction
      2. Volume above 20-bar average on the last bar
      3. Last 3 bars close sequentially higher (long) or lower (short)
      4. Last bar closes in upper 40% (long) or lower 40% (short) of its range
    """
    count = 0
    last = bars[-1]

    # 1. Bias confirmation
    if direction == "long" and bias_state in ("LONG", "RANGE_LONG"):
        count += 1
    elif direction == "short" and bias_state in ("SHORT", "RANGE_SHORT"):
        count += 1

    # 2. Volume confirmation
    if avg_volume > 0 and last.volume > avg_volume:
        count += 1

    # 3. Structure (momentum confirmation)
    if len(bars) >= 3:
        if direction == "long":
            if bars[-1].close > bars[-2].close > bars[-3].close:
                count += 1
        else:
            if bars[-1].close < bars[-2].close < bars[-3].close:
                count += 1

    # 4. Velocity (close position within bar range)
    bar_range = last.high - last.low
    if bar_range > 0:
        close_position = (last.close - last.low) / bar_range
        if direction == "long" and close_position >= 0.6:
            count += 1
        elif direction == "short" and close_position <= 0.4:
            count += 1

    return count


def _confidence_from_count(count: int) -> str:
    """Map confirmation count to confidence level."""
    if count >= 3:
        return "high"
    elif count >= 2:
        return "medium"
    return "low"


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

    Confidence is determined by counting active confirmations (bias, volume,
    structure, velocity). 3+ = high, 2 = medium, 1 = low.
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

    # Volume baseline for confirmation scoring
    recent_20 = bars[-20:]
    avg_volume = sum(b.volume for b in recent_20) / len(recent_20) if recent_20 else 0.0

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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "long", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="orb_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "short", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="orb_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "long", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="ib_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "short", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="ib_break",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "long", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="poc_rejection",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "short", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="poc_rejection",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "short", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="short",
                        signal_type="va_edge",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                conf = _confidence_from_count(
                    _count_confirmations(bars, "long", bias_state, avg_volume)
                )
                signals.append(
                    TradeSignal(
                        direction="long",
                        signal_type="va_edge",
                        entry_price=last_price,
                        stop_price=stop,
                        target_price=target,
                        risk_reward=round(rr, 1),
                        confidence=conf,
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
                        conf = _confidence_from_count(
                            _count_confirmations(bars, "long", bias_state, avg_volume)
                        )
                        signals.append(
                            TradeSignal(
                                direction="long",
                                signal_type="bos",
                                entry_price=last_price,
                                stop_price=stop,
                                target_price=closest_above,
                                risk_reward=round(rr, 1),
                                confidence=conf,
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
                        conf = _confidence_from_count(
                            _count_confirmations(bars, "short", bias_state, avg_volume)
                        )
                        signals.append(
                            TradeSignal(
                                direction="short",
                                signal_type="bos",
                                entry_price=last_price,
                                stop_price=stop,
                                target_price=closest_below,
                                risk_reward=round(rr, 1),
                                confidence=conf,
                                reason=(
                                    f"Naked POC Magnet Short: Ungetesteter POC"
                                    f" bei {closest_below:.0f},"
                                    f" Momentum abwaerts, Stop {stop:.0f}"
                                ),
                                timestamp=last.timestamp,
                            )
                        )

    # ── 6. Sammelzone Breakout ────────────────────────────────────────────────
    # Travis: "70-80% Wahrscheinlichkeit dass Range komplett durchgehandelt wird"
    # Detect consolidation in recent bars and check if price just broke out.
    if len(bars) >= 80:
        sammels = _find_recent_sammelzone(bars)
        for sz_high, sz_low in sammels:
            sz_range = sz_high - sz_low
            if sz_range < 0.01:
                continue

            # Long breakout: price broke above Sammelzone
            if last_price > sz_high and allow_long:
                stop = sz_low
                risk = max(last_price - stop, 0.01)
                # Travis: target = 70-80% extension of the Sammelzone range above breakout
                extension = sz_range * 0.75
                target = sz_high + extension
                # Also consider any higher key level within 2x extension
                for t in targets_above:
                    if sz_high < t <= sz_high + extension * 2:
                        target = t
                        break
                rr = (target - last_price) / risk
                if rr >= 1.2:
                    conf = _confidence_from_count(
                        _count_confirmations(bars, "long", bias_state, avg_volume)
                    )
                    signals.append(
                        TradeSignal(
                            direction="long",
                            signal_type="sammelzone_breakout",
                            entry_price=last_price,
                            stop_price=stop,
                            target_price=round(target, 2),
                            risk_reward=round(rr, 1),
                            confidence=conf,
                            reason=(
                                f"Sammelzone Breakout Long: Preis bricht ueber"
                                f" Konsolidierung ({sz_low:.0f}-{sz_high:.0f}),"
                                f" 75% Extension -> Ziel {target:.0f},"
                                f" Stop {stop:.0f}"
                            ),
                            timestamp=last.timestamp,
                        )
                    )

            # Short breakout: price broke below Sammelzone
            if last_price < sz_low and allow_short:
                stop = sz_high
                risk = max(stop - last_price, 0.01)
                extension = sz_range * 0.75
                target = sz_low - extension
                for t in targets_below:
                    if sz_low - extension * 2 <= t < sz_low:
                        target = t
                        break
                rr = (last_price - target) / risk
                if rr >= 1.2:
                    conf = _confidence_from_count(
                        _count_confirmations(bars, "short", bias_state, avg_volume)
                    )
                    signals.append(
                        TradeSignal(
                            direction="short",
                            signal_type="sammelzone_breakout",
                            entry_price=last_price,
                            stop_price=stop,
                            target_price=round(target, 2),
                            risk_reward=round(rr, 1),
                            confidence=conf,
                            reason=(
                                f"Sammelzone Breakout Short: Preis bricht unter"
                                f" Konsolidierung ({sz_low:.0f}-{sz_high:.0f}),"
                                f" 75% Extension -> Ziel {target:.0f},"
                                f" Stop {stop:.0f}"
                            ),
                            timestamp=last.timestamp,
                        )
                    )

    # ── 7. Absorption Trade ───────────────────────────────────────────────────
    # Liquiditaetsblock: price makes a strong push into a level (key level, VA edge,
    # PDH/PDL) but then stalls — multiple bars with shrinking range at that level.
    # This signals absorption by larger players and a likely reversal.
    if len(bars) >= 10:
        absorption = _detect_absorption(bars, atr)
        if absorption is not None:
            abs_level, abs_dir = absorption  # abs_dir = direction price came FROM (reverse it)
            signal_dir = "long" if abs_dir == "down" else "short"

            if signal_dir == "long" and allow_long:
                stop = abs_level - atr * 0.75
                risk = max(last_price - stop, 0.01)
                target = (
                    targets_above[0]
                    if targets_above and targets_above[0] > last_price
                    else last_price + atr * 2
                )
                rr = (target - last_price) / risk
                if rr >= 1.0:
                    conf = _confidence_from_count(
                        _count_confirmations(bars, "long", bias_state, avg_volume)
                    )
                    signals.append(
                        TradeSignal(
                            direction="long",
                            signal_type="absorption",
                            entry_price=last_price,
                            stop_price=round(stop, 2),
                            target_price=round(target, 2),
                            risk_reward=round(rr, 1),
                            confidence=conf,
                            reason=(
                                f"Absorption Long: Verkauf absorbiert bei"
                                f" {abs_level:.0f} (Liquiditaetsblock),"
                                f" Stop {stop:.0f}, Ziel {target:.0f}"
                            ),
                            timestamp=last.timestamp,
                        )
                    )

            elif signal_dir == "short" and allow_short:
                stop = abs_level + atr * 0.75
                risk = max(stop - last_price, 0.01)
                target = (
                    targets_below[0]
                    if targets_below and targets_below[0] < last_price
                    else last_price - atr * 2
                )
                rr = (last_price - target) / risk
                if rr >= 1.0:
                    conf = _confidence_from_count(
                        _count_confirmations(bars, "short", bias_state, avg_volume)
                    )
                    signals.append(
                        TradeSignal(
                            direction="short",
                            signal_type="absorption",
                            entry_price=last_price,
                            stop_price=round(stop, 2),
                            target_price=round(target, 2),
                            risk_reward=round(rr, 1),
                            confidence=conf,
                            reason=(
                                f"Absorption Short: Kauf absorbiert bei"
                                f" {abs_level:.0f} (Liquiditaetsblock),"
                                f" Stop {stop:.0f}, Ziel {target:.0f}"
                            ),
                            timestamp=last.timestamp,
                        )
                    )

    # Sort by confidence (high first) then by R:R descending
    _conf_order = {"high": 0, "medium": 1, "low": 2}
    signals.sort(key=lambda s: (_conf_order.get(s.confidence, 2), -s.risk_reward))

    return signals


# ---------------------------------------------------------------------------
# Helper detectors for new signal types
# ---------------------------------------------------------------------------

def _find_recent_sammelzone(
    bars: list[OHLCVBar],
    lookback: int = 60,
    min_bars_consolidating: int = 20,
    max_range_factor: float = 3.0,
) -> list[tuple[float, float]]:
    """Find Sammelzonen (consolidation ranges) in the last `lookback` bars.

    A Sammelzone is identified by:
    - A window of `min_bars_consolidating` bars where the total range is less
      than `max_range_factor` * average single-bar range (tight consolidation).

    Returns a list of (sz_high, sz_low) tuples for zones that are still recent
    (i.e. the last bar has just broken out or is at the edge).
    """
    result: list[tuple[float, float]] = []
    if len(bars) < lookback:
        return result

    recent = bars[-lookback:]
    atr_recent = sum(b.high - b.low for b in recent) / len(recent)

    step = min_bars_consolidating // 2
    for i in range(0, len(recent) - min_bars_consolidating, step):
        chunk = recent[i: i + min_bars_consolidating]
        c_high = max(b.high for b in chunk)
        c_low = min(b.low for b in chunk)
        c_range = c_high - c_low

        if c_range <= 0:
            continue

        if c_range < atr_recent * max_range_factor:
            # Tight consolidation — check it's not the very last bars (avoid detecting
            # current range, only historical consolidations just broken)
            last_bar = bars[-1]
            just_broke_up = last_bar.close > c_high and i + min_bars_consolidating < len(recent) - 3
            just_broke_down = last_bar.close < c_low and i + min_bars_consolidating < len(recent) - 3

            if just_broke_up or just_broke_down:
                # Avoid duplicates
                already_added = any(
                    abs(existing_h - c_high) < 5 and abs(existing_l - c_low) < 5
                    for existing_h, existing_l in result
                )
                if not already_added:
                    result.append((c_high, c_low))

    return result[:3]  # max 3 zones


def _detect_absorption(
    bars: list[OHLCVBar],
    atr: float,
    lookback: int = 8,
    min_bars_stalling: int = 3,
) -> "tuple[float, str] | None":
    """Detect absorption pattern: strong push followed by stalling at a level.

    Looks for:
    1. A directional push of at least 2*ATR in the last `lookback` bars
    2. Followed by `min_bars_stalling` bars with shrinking range AND
       closes not extending the original push direction

    Returns (absorption_level, direction_of_push) or None.
    direction_of_push is "up" or "down" — the signal direction is the OPPOSITE.
    """
    if len(bars) < lookback + min_bars_stalling:
        return None

    window = bars[-(lookback + min_bars_stalling):]
    push_bars = window[:lookback]
    stall_bars = window[lookback:]

    push_open = push_bars[0].open
    push_close = push_bars[-1].close
    push_magnitude = abs(push_close - push_open)

    if push_magnitude < atr * 1.5:
        return None

    push_dir = "up" if push_close > push_open else "down"
    absorption_level = push_bars[-1].high if push_dir == "up" else push_bars[-1].low

    # Stall check: bars are NOT continuing in the push direction and range is shrinking
    avg_stall_range = sum(b.high - b.low for b in stall_bars) / len(stall_bars)
    avg_push_range = sum(b.high - b.low for b in push_bars) / len(push_bars)

    range_shrinking = avg_stall_range < avg_push_range * 0.6

    if push_dir == "up":
        stall_not_extending = all(b.high <= absorption_level + atr * 0.5 for b in stall_bars)
    else:
        stall_not_extending = all(b.low >= absorption_level - atr * 0.5 for b in stall_bars)

    if range_shrinking and stall_not_extending:
        return (absorption_level, push_dir)

    return None

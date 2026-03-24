"""Trade signal detection — Optimized v2 (2026-03-24).

Optimization history:
  v1 (original): 14 trades, 28.6% WR, PF 0.94 — almost breakeven
  v2 (this):     Targeted fixes based on 90-day Jan-Mar 2026 backtest

v2 changes:
  1. DAILY BREAKOUT: Now requires intraday breakout (not gap-open).
     - No signal if price already gapped past PDH/PDL at bar 0
     - Close-confirmation: last bar must CLOSE above PDH (not just spike)
     - ATR-based stop (1.5x ATR below last bar low) instead of structural
     - Only when breakout bar is in first 90 bars (fresh breakout, not stale)
     - Min stop distance: 1.0 ATR (no 1-tick stops)
  2. VA EDGE: REMOVED (0% WR in backtests — produces losses)
  3. POC REJECTION: Enhanced with volume filter (>1.2x avg at rejection)
  4. VWAP BOUNCE: NEW mean-reversion signal (works in ranging markets)
     - When price is >2.0 ATR from VWAP, watch for bounce
     - Entry on bounce bar (moving toward VWAP)
     - Stop beyond the extreme, target VWAP
  5. CONFIDENCE "low" now SUPPRESSED (not generated) — was causing bad trades
  6. BREAKEVEN at 35% (more aggressive than 45%)
  7. SESSION FILTER relaxed: removed lunch filter (too many missed opportunities)

Signal types (v2):
  - poc_rejection        (50% WR — best signal, enhanced)
  - orb_break            (only high-confluence, 4+ confirmations)
  - bos                  (naked POC magnet)
  - daily_breakout       (intraday only, close-confirmed, ATR stop)
  - vwap_bounce          (NEW: mean-reversion when price far from VWAP)
  - sammelzone_breakout  (kept)

Signal types removed from v2:
  - va_edge              (0% WR — fundamentally unreliable without orderflow)

NQ-specific constants:
  NQ tick = 0.25 points
  MAX_STOP_TICKS = 100 -> 25 NQ points
"""

from __future__ import annotations

from dataclasses import dataclass, field

from arctis.models import OHLCVBar

# NQ: 1 tick = 0.25 points. Max stop = 100 ticks = 25 points.
# This limit acts as a volatility filter: on high-ATR days (ATR > 17 pts),
# stops of 1.5x ATR exceed 25 pts and no daily_breakout fires. This is
# intentional — high-volatility days have more false breakouts.
# POC rejection uses its own per-call override (40 pts max).
_NQ_TICK_SIZE: float = 0.25
_MAX_STOP_TICKS: int = 100
_MAX_STOP_POINTS: float = _MAX_STOP_TICKS * _NQ_TICK_SIZE  # 25.0

# Minimum R:R from AlgoView mbo_confluence_nq (CRV 1.35)
_MIN_RR: float = 1.35

# Breakeven trigger: move stop to entry when 35% of target distance is reached
# (More aggressive than 45% — protects profit faster)
_DEFAULT_BREAKEVEN_PCT: float = 0.35

# Session bar ranges (1-minute bars starting 09:30 ET)
# Bar 0 = 09:30, Bar 14 = 09:44 (opening volatility — skip)
# Lunch filter removed in v2: too many missed opportunities
_SKIP_BARS_OPENING_END: int = 15   # bars 0-14 inclusive

# ORB requires this many confirmations (stricter than other signals)
_ORB_MIN_CONFLUENCE: int = 3
_ORB_MIN_VOLUME_FACTOR: float = 1.2


@dataclass
class TradeSignal:
    direction: str        # "long" | "short"
    signal_type: str      # "orb_break" | "poc_rejection" | "va_edge" | "bos"
                          # "sammelzone_breakout" | "daily_breakout"
    entry_price: float
    stop_price: float
    target_price: float
    risk_reward: float
    confidence: str       # "high" | "medium"  ("low" is never generated)
    reason: str
    timestamp: int
    breakeven_at: float = field(default=_DEFAULT_BREAKEVEN_PCT)
    confluence_count: int = field(default=0)
    vwap_aligned: bool = field(default=False)


# ---------------------------------------------------------------------------
# Confirmation counting (5 possible confirmations, need >= 3 for any signal)
# ---------------------------------------------------------------------------

def _count_confirmations(
    bars: list[OHLCVBar],
    direction: str,
    bias_state: str,
    avg_volume: float,
    vwap: float | None = None,
) -> int:
    """Count how many of the five confirmation signals are present.

    Confirmations (each worth 1 point, max 5):
      1. Bias aligned with direction
      2. Volume above 20-bar average on the last bar
      3. Last 3 bars close sequentially higher (long) or lower (short) — structure
      4. Velocity: last bar closes in upper 40% (long) or lower 40% (short) of range
      5. VWAP aligned: price above VWAP for long, below for short

    Returns integer 0-5.
    """
    count = 0
    last = bars[-1]

    # 1. Bias confirmation
    if direction == "long" and bias_state in ("LONG", "RANGE_LONG"):
        count += 1
    elif direction == "short" and bias_state in ("SHORT", "RANGE_SHORT"):
        count += 1

    # 2. Volume confirmation (must be meaningful, not tiny)
    if avg_volume > 0 and last.volume > avg_volume:
        count += 1

    # 3. Structure (sequential momentum)
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
        close_pos = (last.close - last.low) / bar_range
        if direction == "long" and close_pos >= 0.60:
            count += 1
        elif direction == "short" and close_pos <= 0.40:
            count += 1

    # 5. VWAP alignment
    if vwap is not None and vwap > 0:
        if direction == "long" and last.close > vwap:
            count += 1
        elif direction == "short" and last.close < vwap:
            count += 1

    return count


def _confidence_from_count(count: int, min_for_signal: int = 3) -> str | None:
    """Map confirmation count to confidence level.

    v2: "low" signals are SUPPRESSED by default. Callers can set min_for_signal=2
    for less-demanding signal types (e.g. daily_breakout with strong bias).
    4+ confirmations -> "high"
    3 confirmations  -> "medium"
    2 confirmations  -> "medium" (only if min_for_signal=2, i.e. callers permit it)
    < min_for_signal -> None (do NOT generate signal)
    """
    if count >= 4:
        return "high"
    if count >= 3:
        return "medium"
    if count >= 2 and min_for_signal <= 2:
        return "medium"   # allowed for directional setups with strong bias
    return None  # suppress


def _is_vwap_aligned(direction: str, price: float, vwap: float | None) -> bool:
    """VWAP strict filter. If no VWAP available, do not count as aligned."""
    if vwap is None or vwap <= 0:
        return False
    if direction == "long":
        return price > vwap
    return price < vwap


def _stop_within_limit(entry: float, stop: float) -> bool:
    """True if the stop distance does not exceed MAX_STOP_POINTS (60 ticks)."""
    return abs(entry - stop) <= _MAX_STOP_POINTS


def _bar_index_in_session(bars: list[OHLCVBar]) -> int:
    """Return the index of the last bar within the current RTH session (0-based).

    Since we do not have intraday position information here, we use the length
    of the bars list as a proxy for the bar index within the session.
    The caller is responsible for passing only the current-session bars.
    The index is capped at 400 for safety.
    """
    return min(len(bars) - 1, 400)


def _in_session_filter(bars: list[OHLCVBar]) -> bool:
    """Return True if we are in a tradeable session window.

    v2: Only blocks opening trap (bars 0-14). Lunch filter removed.
    """
    idx = _bar_index_in_session(bars)
    if idx < _SKIP_BARS_OPENING_END:
        return False  # opening trap
    return True


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

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
    vwap: float | None = None,
    session_bar_idx: int | None = None,
) -> list[TradeSignal]:
    """Detect high-quality trade signals based on profitable AlgoView strategies.

    Philosophy: FEWER but BETTER signals. No signal is better than a bad signal.

    Hard filters applied before any signal is generated:
      - Session filter: no signals in opening 15 min or lunch chop
      - VWAP strict: long only above VWAP, short only below VWAP
      - Minimum 3 confirmations (confluence)
      - Stop distance <= 60 ticks (15 NQ points)
      - R:R >= 1.35:1

    Parameters
    ----------
    bars:        List of OHLCV bars for the current RTH session (bar 0 = open)
    bias_state:  "LONG" | "RANGE_LONG" | "RANGE" | "RANGE_SHORT" | "SHORT"
    bias_score:  Integer bias score (-100 to +100)
    poc:         Current session Point of Control
    vah:         Value Area High
    val:         Value Area Low
    prev_high:   Previous day high (PDH)
    prev_low:    Previous day low (PDL)
    or_high:     Opening Range High (first 30 min)
    or_low:      Opening Range Low
    ib_high:     Initial Balance High (first 60 min)
    ib_low:      Initial Balance Low
    naked_pocs:  List of unvisited POC levels from prior sessions
    key_levels:        List of dicts with {"level": float, ...}
    vwap:              Current session VWAP
    session_bar_idx:   Bar index within the current RTH session (0-based).
                       When bars contains context + session data, pass the
                       number of today-only bars so daily_breakout can correctly
                       filter "fresh breakout in first 90 min". If None, falls
                       back to len(bars) - 1 (legacy behaviour).
    """
    if len(bars) < 50:
        return []

    # Session filter — no signals during opening trap or lunch chop
    if not _in_session_filter(bars):
        return []

    signals: list[TradeSignal] = []
    last = bars[-1]
    last_price = last.close

    # Allowed directions
    allow_long = bias_state in ("LONG", "RANGE_LONG", "RANGE")
    allow_short = bias_state in ("SHORT", "RANGE_SHORT", "RANGE")

    # Volume baseline
    recent_20 = bars[-20:] if len(bars) >= 20 else bars
    avg_volume = sum(b.volume for b in recent_20) / len(recent_20) if recent_20 else 0.0

    # ATR approximation (20-bar)
    atr = sum(b.high - b.low for b in recent_20) / len(recent_20)
    if atr < 0.25:
        atr = 0.25

    # VWAP alignment check
    vwap_long = _is_vwap_aligned("long", last_price, vwap)
    vwap_short = _is_vwap_aligned("short", last_price, vwap)

    # Collect target levels above and below current price
    targets_above: list[float] = []
    targets_below: list[float] = []

    def _add_target(price: float) -> None:
        if price > last_price:
            targets_above.append(price)
        elif price < last_price:
            targets_below.append(price)

    for lvl in [prev_high, vah]:
        if lvl is not None:
            _add_target(lvl)
    for lvl in [prev_low, val]:
        if lvl is not None:
            _add_target(lvl)
    if naked_pocs:
        for np_price in naked_pocs:
            _add_target(np_price)
    if key_levels:
        for kl in key_levels:
            lvl = kl.get("level", 0)
            if lvl:
                _add_target(lvl)

    targets_above.sort()
    targets_below.sort(reverse=True)

    # ── Shared helper: build a signal or return None if filters fail ──────────

    def _try_build_signal(
        direction: str,
        signal_type: str,
        entry: float,
        stop: float,
        target: float,
        timestamp: int,
        reason_template: str,
        min_confluence: int = 2,
    ) -> TradeSignal | None:
        """Apply all hard filters and return a TradeSignal or None."""
        # VWAP alignment — not a hard block, but adds to confluence
        vwap_ok = vwap_long if direction == "long" else vwap_short

        # Stop distance filter (max 60 ticks)
        if not _stop_within_limit(entry, stop):
            return None

        # R:R filter
        risk = abs(entry - stop)
        if risk <= 0:
            return None
        reward = abs(target - entry)
        rr = reward / risk
        if rr < _MIN_RR:
            return None

        # Confluence filter
        raw_conf = _count_confirmations(
            bars, direction, bias_state, avg_volume, vwap
        )
        if raw_conf < min_confluence:
            return None
        conf = _confidence_from_count(raw_conf, min_for_signal=min_confluence)
        if conf is None:  # redundant guard
            return None

        return TradeSignal(
            direction=direction,
            signal_type=signal_type,
            entry_price=round(entry, 2),
            stop_price=round(stop, 2),
            target_price=round(target, 2),
            risk_reward=round(rr, 2),
            confidence=conf,
            reason=reason_template,
            timestamp=timestamp,
            breakeven_at=_DEFAULT_BREAKEVEN_PCT,
            confluence_count=raw_conf,
            vwap_aligned=vwap_ok,
        )

    # ── 1. ORB Break ──────────────────────────────────────────────────────────
    # ORB = Opening Range Breakout. Price breaks above OR high or below OR low
    # with momentum (high volume bar) immediately after the OR closes.
    #
    # KEY: Only fire when the LAST bar is the BREAKOUT BAR (bars[-2] was inside
    # the OR, bars[-1] is the first close outside). This prevents re-entering
    # the same ORB signal at every subsequent checkpoint.
    #
    # ATR-based stop (not or_low/or_high — NQ OR range is 100-300+ pts).
    # Only within bars 30-60 (tight window: first 30 bars after OR closes).
    if or_high is not None and or_low is not None:
        or_range = or_high - or_low
        bar_idx_orb = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)
        if or_range > 0 and avg_volume > 0 and bar_idx_orb >= 30 and bar_idx_orb <= 60:
            high_volume = last.volume > avg_volume * _ORB_MIN_VOLUME_FACTOR
            # FIRST-BAR confirmation: prior bar was inside (or at) the OR
            prior_inside_or_high = len(bars) >= 2 and bars[-2].close <= or_high * 1.001
            prior_inside_or_low = len(bars) >= 2 and bars[-2].close >= or_low * 0.999

            if last_price > or_high and allow_long and high_volume and prior_inside_or_high:
                # ATR stop: 1.5x ATR below breakout bar low (tight, not structural)
                stop = last.low - atr * 1.5
                stop_dist = abs(last_price - stop)
                if stop_dist >= atr * 0.5 and _stop_within_limit(last_price, stop):
                    target = targets_above[0] if targets_above else last_price + stop_dist * 2
                    sig = _try_build_signal(
                        "long", "orb_break", last_price, stop, target, last.timestamp,
                        (
                            f"ORB Breakout Long: Erster Close ueber OR ({or_high:.2f}),"
                            f" Volumen {last.volume:.0f} > {_ORB_MIN_VOLUME_FACTOR}x Avg ({avg_volume:.0f}),"
                            f" ATR-Stop {stop:.2f}, Ziel {target:.2f}"
                        ),
                        min_confluence=_ORB_MIN_CONFLUENCE,
                    )
                    if sig:
                        signals.append(sig)

            if last_price < or_low and allow_short and high_volume and prior_inside_or_low:
                # ATR stop: 1.5x ATR above breakout bar high
                stop = last.high + atr * 1.5
                stop_dist = abs(stop - last_price)
                if stop_dist >= atr * 0.5 and _stop_within_limit(last_price, stop):
                    target = targets_below[0] if targets_below else last_price - stop_dist * 2
                    sig = _try_build_signal(
                        "short", "orb_break", last_price, stop, target, last.timestamp,
                        (
                            f"ORB Breakout Short: Erster Close unter OR ({or_low:.2f}),"
                            f" Volumen {last.volume:.0f} > {_ORB_MIN_VOLUME_FACTOR}x Avg ({avg_volume:.0f}),"
                            f" ATR-Stop {stop:.2f}, Ziel {target:.2f}"
                        ),
                        min_confluence=_ORB_MIN_CONFLUENCE,
                    )
                    if sig:
                        signals.append(sig)

    # ── 2. POC Rejection (v2: 3-bar approach + rejection bar + volume) ──────────
    # POC acts as a magnet in ALL market conditions — price is drawn to it and
    # often rejects. Allow mean-reversion regardless of bias direction.
    # Require: 3 bars approaching from one side + rejection candle closes through POC
    if poc is not None and len(bars) >= 4:
        b_m3 = bars[-4]
        b_m2 = bars[-3]
        b_m1 = bars[-2]
        # last bar is already `last`

        # Volume at rejection: at or above 70% of average (early session has thin volume)
        rejection_vol_ok = avg_volume > 0 and last.volume >= avg_volume * 0.7

        # Long POC rejection:
        # 3 bars below POC (approaching), last bar closes ABOVE poc (rejection up)
        approaching_below = (b_m3.close < poc and b_m2.close < poc and b_m1.close < poc)
        # Allow small tolerance: wick just tested POC (within 1 ATR of POC)
        rejection_up = last.close > poc and last.low <= poc + atr * 1.0

        # POC rejection is valid in any bias (mean-reversion) — bias filter removed
        if approaching_below and rejection_up and rejection_vol_ok:
            # Stop at structural low of rejection zone with ATR buffer
            rejection_low = min(b_m2.low, b_m1.low, last.low)
            stop = rejection_low - atr * 0.5
            target = targets_above[0] if targets_above else last_price + atr * 3
            sig = _try_build_signal(
                "long", "poc_rejection", last.close, stop, target, last.timestamp,
                (
                    f"POC Rejection Long: Ablehnung am POC ({poc:.2f}),"
                    f" Vol {last.volume:.0f} vs Avg ({avg_volume:.0f}),"
                    f" Stop {stop:.2f}, Ziel {target:.2f}"
                ),
                min_confluence=2,
            )
            if sig:
                signals.append(sig)

        # Short POC rejection:
        # 3 bars above POC (approaching), last bar closes BELOW poc (rejection down)
        approaching_above = (b_m3.close > poc and b_m2.close > poc and b_m1.close > poc)
        # Allow small tolerance: wick just tested POC (within 1 ATR of POC)
        rejection_down = last.close < poc and last.high >= poc - atr * 1.0

        # POC rejection is valid in any bias (mean-reversion)
        if approaching_above and rejection_down and rejection_vol_ok:
            rejection_high = max(b_m2.high, b_m1.high, last.high)
            stop = rejection_high + atr * 0.5
            target = targets_below[0] if targets_below else last_price - atr * 3
            sig = _try_build_signal(
                "short", "poc_rejection", last.close, stop, target, last.timestamp,
                (
                    f"POC Rejection Short: Ablehnung am POC ({poc:.2f}),"
                    f" Vol {last.volume:.0f} vs Avg ({avg_volume:.0f}),"
                    f" Stop {stop:.2f}, Ziel {target:.2f}"
                ),
                min_confluence=2,
            )
            if sig:
                signals.append(sig)

    # ── 3. VA Edge — REMOVED in v2 (0% WR, -410 EUR in 90-day backtest) ────────
    # The VA Edge signal was generating losses in all tested regimes.
    # It is deliberately excluded from v2. The "touching VA" setup without
    # reliable orderflow data is not statistically significant.

    # ── 3b. VWAP Bounce (v3 — mean-reversion, RANGE-only) ────────────────────
    # When price has moved far from VWAP and starts to reverse back.
    # v3 changes:
    #  - Threshold reduced: 2.5x ATR (was 3.5x) — catches more setups
    #  - Stop: last bar low/high + 0.8 ATR buffer (not extreme low) → stays within 25pt limit
    #  - Target: partial reversion (50% back to VWAP) if VWAP is too far, else full VWAP
    #  - Bias still restricted to ranging states, AND direction-specific bias filter
    #  - ATR filter: skip if ATR > 15 pts (high-volatility trending days, not ranging)
    #  - Session filter: only bars 30-180 (skip late-day illiquid setups)
    vwap_bar_idx = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)
    if (vwap is not None and vwap > 0 and len(bars) >= 8
            and bias_state in ("RANGE", "RANGE_LONG", "RANGE_SHORT")
            and atr <= 15.0           # not a high-volatility trending day
            and vwap_bar_idx >= 30    # past opening volatility
            and vwap_bar_idx <= 180): # first 3 hours only (skip late-day)
        distance_from_vwap = last_price - vwap  # positive = above, negative = below

        # LONG VWAP Bounce: price below VWAP, reversing up
        # Only when bias is NOT bearish (RANGE_SHORT/SHORT) — don't fade downtrends
        if (distance_from_vwap < -2.5 * atr
                and bias_state in ("RANGE", "RANGE_LONG")):  # no RANGE_SHORT = downtrend
            all_below_vwap = all(b.close < vwap for b in bars[-6:-1])
            bar_range_last = last.high - last.low
            bounce_confirmed = (
                len(bars) >= 3
                and last.close > bars[-2].close
                and bars[-2].close > bars[-3].close  # 3-bar momentum up
                and bar_range_last > 0
                and last.close > (last.low + bar_range_last * 0.65)  # strong up-close
            )
            if bounce_confirmed and all_below_vwap:
                stop = last.low - atr * 0.8
                stop_dist = abs(last_price - stop)
                if stop_dist <= _MAX_STOP_POINTS and stop_dist >= atr * 0.5:
                    # Target: VWAP if RR allows, otherwise 50% reversion
                    dist_to_vwap = abs(vwap - last_price)
                    target = vwap if dist_to_vwap / stop_dist >= _MIN_RR else last_price + stop_dist * _MIN_RR * 1.1
                    sig = _try_build_signal(
                        "long", "vwap_bounce", last_price, stop, target, last.timestamp,
                        (
                            f"VWAP Bounce Long: Preis {distance_from_vwap:.1f} Punkte"
                            f" unter VWAP ({vwap:.2f}), 3-Bar-Bounce bestaetigt,"
                            f" Stop {stop:.2f}, Ziel {target:.2f}"
                        ),
                        min_confluence=2,
                    )
                    if sig:
                        signals.append(sig)

        # SHORT VWAP Bounce: price above VWAP, reversing down
        # Only when bias is NOT bullish (RANGE_LONG/LONG) — don't fade uptrends
        elif (distance_from_vwap > 2.5 * atr
                and bias_state in ("RANGE", "RANGE_SHORT")):  # no RANGE_LONG = uptrend
            all_above_vwap = all(b.close > vwap for b in bars[-6:-1])
            bar_range_last = last.high - last.low
            bounce_confirmed = (
                len(bars) >= 3
                and last.close < bars[-2].close
                and bars[-2].close < bars[-3].close  # 3-bar momentum down
                and bar_range_last > 0
                and last.close < (last.low + bar_range_last * 0.35)  # strong down-close
            )
            if bounce_confirmed and all_above_vwap:
                stop = last.high + atr * 0.8
                stop_dist = abs(stop - last_price)
                if stop_dist <= _MAX_STOP_POINTS and stop_dist >= atr * 0.5:
                    dist_to_vwap = abs(last_price - vwap)
                    target = vwap if dist_to_vwap / stop_dist >= _MIN_RR else last_price - stop_dist * _MIN_RR * 1.1
                    sig = _try_build_signal(
                        "short", "vwap_bounce", last_price, stop, target, last.timestamp,
                        (
                            f"VWAP Bounce Short: Preis {distance_from_vwap:.1f} Punkte"
                            f" ueber VWAP ({vwap:.2f}), 3-Bar-Bounce bestaetigt,"
                            f" Stop {stop:.2f}, Ziel {target:.2f}"
                        ),
                        min_confluence=2,
                    )
                    if sig:
                        signals.append(sig)

    # ── 3c. VWAP Pullback — REMOVED (0% WR in 90-day backtest, -243 EUR) ──────
    # vwap_pullback generated losing trades in trending markets.
    # Trend continuation entries near VWAP are not statistically reliable
    # without orderflow confirmation. Removed to preserve PF.

    # ── 4. BOS / Naked POC Magnet (100% WR in paper trade, small sample) ──────
    # Price trending toward an unvisited (naked) POC with confirmed momentum.
    if naked_pocs and len(bars) >= 3:
        momentum_up = bars[-1].close > bars[-2].close > bars[-3].close
        momentum_down = bars[-1].close < bars[-2].close < bars[-3].close

        closest_above = min(
            (p for p in naked_pocs if p > last_price), default=None
        )
        closest_below = max(
            (p for p in naked_pocs if p < last_price), default=None
        )

        if closest_above is not None and allow_long and momentum_up:
            distance = closest_above - last_price
            if distance < atr * 3:
                # Stop at recent swing low
                swing_low = min(b.low for b in bars[-5:])
                stop = swing_low - atr * 0.1
                sig = _try_build_signal(
                    "long", "bos", last_price, stop, closest_above, last.timestamp,
                    (
                        f"Naked POC Magnet Long: Ungetesteter POC bei"
                        f" {closest_above:.2f}, Momentum aufwaerts,"
                        f" Stop {stop:.2f}"
                    ),
                )
                if sig:
                    signals.append(sig)

        if closest_below is not None and allow_short and momentum_down:
            distance = last_price - closest_below
            if distance < atr * 3:
                swing_high = max(b.high for b in bars[-5:])
                stop = swing_high + atr * 0.1
                sig = _try_build_signal(
                    "short", "bos", last_price, stop, closest_below, last.timestamp,
                    (
                        f"Naked POC Magnet Short: Ungetesteter POC bei"
                        f" {closest_below:.2f}, Momentum abwaerts,"
                        f" Stop {stop:.2f}"
                    ),
                )
                if sig:
                    signals.append(sig)

    # ── 5. Daily Breakout (v2: Intraday only, close-confirmed, ATR stop) ────────
    # Key fixes vs v1:
    #  - NO gap-open signals: if the open already gapped past PDH/PDL, skip
    #  - CLOSE confirmation: last bar must CLOSE above PDH (not just spike)
    #  - ATR-based stop: 1.5x ATR below the breakout bar's low
    #  - Min stop distance: 1.0 ATR (prevents 1-tick stops)
    #  - Bar index filter: only bars 15-120 (fresh breakout in first 120 min)
    if prev_high is not None and prev_low is not None:
        bar_idx = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)

        gapped_above_pdh = (or_high is not None and or_high >= prev_high
                            and or_low is not None and or_low >= prev_high * 0.999)
        gapped_below_pdl = (or_low is not None and or_low <= prev_low
                            and or_high is not None and or_high <= prev_low * 1.001)

        # Long daily breakout: INTRADAY break of PDH
        decisive_long = last.close > prev_high + atr * 0.3
        prior_above_pdh = len(bars) >= 2 and bars[-2].close > prev_high

        if (decisive_long
                and prior_above_pdh
                and not gapped_above_pdh
                and allow_long
                and avg_volume > 0
                and bar_idx >= 15
                and bar_idx <= 120):

            stop = last.low - atr * 1.5
            stop_dist = abs(last_price - stop)

            if stop_dist >= atr * 1.0 and _stop_within_limit(last_price, stop):
                risk = stop_dist
                target = last_price + risk * 2.0
                if targets_above:
                    t_candidate = targets_above[0]
                    if abs(t_candidate - last_price) / risk >= _MIN_RR:
                        target = t_candidate

                sig = _try_build_signal(
                    "long", "daily_breakout", last_price, stop, target, last.timestamp,
                    (
                        f"Daily Breakout Long: Close ({last.close:.2f}) ueber PDH ({prev_high:.2f}),"
                        f" Intraday (kein Gap), ATR-Stop {stop:.2f},"
                        f" Ziel {target:.2f} (2:1 R:R)"
                    ),
                    min_confluence=2,
                )
                if sig:
                    signals.append(sig)

        # Short daily breakout: INTRADAY break of PDL
        decisive_short = last.close < prev_low - atr * 0.3
        prior_below_pdl = len(bars) >= 2 and bars[-2].close < prev_low

        if (decisive_short
                and prior_below_pdl
                and not gapped_below_pdl
                and allow_short
                and avg_volume > 0
                and bar_idx >= 15
                and bar_idx <= 120):

            stop = last.high + atr * 1.5
            stop_dist = abs(stop - last_price)

            if stop_dist >= atr * 1.0 and _stop_within_limit(last_price, stop):
                risk = stop_dist
                target = last_price - risk * 2.0
                if targets_below:
                    t_candidate = targets_below[0]
                    if abs(last_price - t_candidate) / risk >= _MIN_RR:
                        target = t_candidate

                sig = _try_build_signal(
                    "short", "daily_breakout", last_price, stop, target, last.timestamp,
                    (
                        f"Daily Breakout Short: Close ({last.close:.2f}) unter PDL ({prev_low:.2f}),"
                        f" Intraday (kein Gap), ATR-Stop {stop:.2f},"
                        f" Ziel {target:.2f} (2:1 R:R)"
                    ),
                    min_confluence=2,
                )
                if sig:
                    signals.append(sig)

    # ── 6. Sammelzone Breakout (kept — higher confluence required) ────────────
    if len(bars) >= 80:
        sammels = _find_recent_sammelzone(bars)
        for sz_high, sz_low in sammels:
            sz_range = sz_high - sz_low
            if sz_range < 0.01:
                continue

            if last_price > sz_high and allow_long:
                stop = sz_low
                if _stop_within_limit(last_price, stop):
                    extension = sz_range * 0.75
                    target = sz_high + extension
                    for t in targets_above:
                        if sz_high < t <= sz_high + extension * 2:
                            target = t
                            break
                    sig = _try_build_signal(
                        "long", "sammelzone_breakout", last_price, stop,
                        round(target, 2), last.timestamp,
                        (
                            f"Sammelzone Breakout Long: Preis bricht ueber"
                            f" Konsolidierung ({sz_low:.2f}-{sz_high:.2f}),"
                            f" 75% Extension -> Ziel {target:.2f}, Stop {stop:.2f}"
                        ),
                    )
                    if sig:
                        signals.append(sig)

            if last_price < sz_low and allow_short:
                stop = sz_high
                if _stop_within_limit(last_price, stop):
                    extension = sz_range * 0.75
                    target = sz_low - extension
                    for t in targets_below:
                        if sz_low - extension * 2 <= t < sz_low:
                            target = t
                            break
                    sig = _try_build_signal(
                        "short", "sammelzone_breakout", last_price, stop,
                        round(target, 2), last.timestamp,
                        (
                            f"Sammelzone Breakout Short: Preis bricht unter"
                            f" Konsolidierung ({sz_low:.2f}-{sz_high:.2f}),"
                            f" 75% Extension -> Ziel {target:.2f}, Stop {stop:.2f}"
                        ),
                    )
                    if sig:
                        signals.append(sig)

    # Sort by confidence (high first) then R:R descending
    _conf_order = {"high": 0, "medium": 1}
    signals.sort(key=lambda s: (_conf_order.get(s.confidence, 2), -s.risk_reward))

    return signals


# ---------------------------------------------------------------------------
# Helper: Sammelzone detection (unchanged logic, still used above)
# ---------------------------------------------------------------------------

def _find_recent_sammelzone(
    bars: list[OHLCVBar],
    lookback: int = 60,
    min_bars_consolidating: int = 20,
    max_range_factor: float = 3.0,
) -> list[tuple[float, float]]:
    """Find Sammelzonen (consolidation ranges) in the last `lookback` bars.

    A Sammelzone is identified by a window of `min_bars_consolidating` bars
    where the total range is less than `max_range_factor` * average bar range.

    Returns up to 3 (sz_high, sz_low) tuples where the last bar has just
    broken out of the consolidation.
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
            last_bar = bars[-1]
            just_broke_up = (
                last_bar.close > c_high
                and i + min_bars_consolidating < len(recent) - 3
            )
            just_broke_down = (
                last_bar.close < c_low
                and i + min_bars_consolidating < len(recent) - 3
            )

            if just_broke_up or just_broke_down:
                already_added = any(
                    abs(existing_h - c_high) < 5 and abs(existing_l - c_low) < 5
                    for existing_h, existing_l in result
                )
                if not already_added:
                    result.append((c_high, c_low))

    return result[:3]

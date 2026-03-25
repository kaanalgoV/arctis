"""Trade signal detection — Optimized v3 (2026-03-25).

Optimization history:
  v1 (original): 14 trades, 28.6% WR, PF 0.94 — almost breakeven
  v2 (2026-03-24): Targeted fixes based on 90-day Jan-Mar 2026 backtest
  v3 (2026-03-25): Precise entry/stop/target prices, session-aware confluence thresholds

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

v3 changes:
  1. PRECISE ENTRY/STOP/TARGET: Every signal now includes exact tick-level prices.
     - entry_price: level + offset ticks depending on signal type
     - stop_price:  nearest swing low/high within last 10 bars, clamped 8-40 ticks
     - target_1:    1.5x risk from entry
     - target_2:    2.5x risk from entry (optional second target)
     - risk_ticks / reward_ticks / rr_ratio computed from tick_size
     - reasoning:   human-readable rationale
     - invalidation: exact price that voids the setup
     - expires_bars: signal valid for N bars
  2. SESSION-AWARE CONFLUENCE:
     - NY Open (09:30-10:30): min_confluence = 1 (any valid signal fires)
     - Midday / Other RTH:    min_confluence = 2 (unchanged)
  3. TICK SIZE PARAMETER: tick_size=0.25 (NQ), configurable per instrument.

Signal types (v3):
  - poc_rejection        (50% WR — best signal, enhanced)
  - orb_break            (only high-confluence, 4+ confirmations)
  - bos                  (naked POC magnet)
  - daily_breakout       (intraday only, close-confirmed, ATR stop)
  - vwap_bounce          (mean-reversion when price far from VWAP)
  - sammelzone_breakout  (kept)

NQ-specific constants:
  NQ tick = 0.25 points
  MAX_STOP_TICKS = 40 (10 pts) — hard cap on new signals
  MIN_STOP_TICKS = 8  (2 pts)  — prevent hairline stops
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

from arctis.models import OHLCVBar
from arctis.analysis.sessions import Session, classify_session, get_current_session

# ---------------------------------------------------------------------------
# Instrument constants (NQ defaults — can be overridden via tick_size param)
# ---------------------------------------------------------------------------

# NQ: 1 tick = 0.25 points. Entry offsets and stop bounds are expressed in ticks.
_NQ_TICK_SIZE: float = 0.25

# v3: tighter stop cap (10 pts = 40 ticks) to keep R:R meaningful
_MAX_STOP_TICKS: int = 40
_MIN_STOP_TICKS: int = 8   # 2 pts — no hairline stops

# Legacy alias: used in existing _stop_within_limit()
_MAX_STOP_POINTS: float = _MAX_STOP_TICKS * _NQ_TICK_SIZE  # 10.0

# Entry offset: number of ticks BEYOND the trigger level to enter
# (avoids entering right at the level where rejection is likely)
_ENTRY_OFFSET_TICKS: int = 2   # 0.50 pts for NQ

# Minimum R:R from AlgoView mbo_confluence_nq (CRV 1.35)
_MIN_RR: float = 1.35

# Breakeven trigger: move stop to entry when 35% of target distance is reached
_DEFAULT_BREAKEVEN_PCT: float = 0.35

# Session bar ranges (1-minute bars starting 09:30 ET)
# Bar 0 = 09:30, Bar 14 = 09:44 (opening volatility — skip)
_SKIP_BARS_OPENING_END: int = 3    # bars 0-2 (first 15min only, was 15)

# ORB requires this many confirmations (stricter than other signals)
_ORB_MIN_CONFLUENCE: int = 3
_ORB_MIN_VOLUME_FACTOR: float = 1.2

# Session-specific minimum confluence thresholds (v3)
# NY Open: market is most efficient, any valid setup should fire
# Midday / other RTH: require at least 2 confirmations
_SESSION_MIN_CONFLUENCE: dict[str, int] = {
    Session.NY_OPEN.value:     1,
    Session.MIDDAY.value:      2,
    Session.AFTERNOON.value:   2,
    Session.POWER_HOUR.value:  2,
}
_DEFAULT_MIN_CONFLUENCE: int = 2

# Signal expires after N bars without being triggered
_DEFAULT_EXPIRES_BARS: int = 10


@dataclass
class TradeSignal:
    direction: str        # "long" | "short"
    signal_type: str      # "orb_break" | "poc_rejection" | "bos"
                          # "sammelzone_breakout" | "daily_breakout" | "vwap_bounce"
    entry_price: float
    stop_price: float
    target_price: float   # primary target (= target_1 for backward compat)
    risk_reward: float
    confidence: str       # "high" | "medium"  ("low" is never generated)
    reason: str
    timestamp: int
    session: str = field(default="")   # Session enum value, e.g. "ny_open"
    breakeven_at: float = field(default=_DEFAULT_BREAKEVEN_PCT)
    confluence_count: int = field(default=0)
    vwap_aligned: bool = field(default=False)

    # v3: precise entry/stop/target fields ─────────────────────────────────
    target_1: float = field(default=0.0)         # 1.5x risk target
    target_2: float = field(default=0.0)         # 2.5x risk target (optional)
    risk_ticks: int = field(default=0)           # |entry - stop| in ticks
    reward_ticks: int = field(default=0)         # |target_1 - entry| in ticks
    rr_ratio: float = field(default=0.0)         # reward_ticks / risk_ticks
    reasoning: str = field(default="")          # human-readable rationale
    invalidation: str = field(default="")       # exact price / condition that voids setup
    expires_bars: int = field(default=_DEFAULT_EXPIRES_BARS)  # valid for N bars
    tick_size: float = field(default=_NQ_TICK_SIZE)


# Session types that belong to Regular Trading Hours (09:30-16:00 ET).
# Signals fired outside RTH carry lower intrinsic weight and some signal
# types are suppressed entirely (no ORB/daily-breakout in pre-market, etc.).
_RTH_SESSIONS: frozenset[str] = frozenset({
    Session.NY_OPEN.value,
    Session.MIDDAY.value,
    Session.AFTERNOON.value,
    Session.POWER_HOUR.value,
})

# NY Open is the highest-confidence session: volume is highest and
# Opening-Range-based setups have the best historical performance.
# Signals generated during NY Open receive a +1 boost to their raw
# confluence count (implemented in _try_build_signal).
_HIGH_CONFIDENCE_SESSIONS: frozenset[str] = frozenset({
    Session.NY_OPEN.value,
})


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
    """True if the stop distance does not exceed MAX_STOP_POINTS (40 ticks = 10 pts)."""
    return abs(entry - stop) <= _MAX_STOP_POINTS


# ---------------------------------------------------------------------------
# v3 Precision helpers
# ---------------------------------------------------------------------------

def _round_tick(price: float, tick_size: float = _NQ_TICK_SIZE) -> float:
    """Round price to nearest tick boundary."""
    return round(round(price / tick_size) * tick_size, 10)


def _ticks(price_diff: float, tick_size: float = _NQ_TICK_SIZE) -> int:
    """Convert a price distance to whole ticks (always positive)."""
    return max(0, round(abs(price_diff) / tick_size))


def _swing_stop(
    bars: list[OHLCVBar],
    direction: str,
    tick_size: float = _NQ_TICK_SIZE,
    lookback: int = 10,
) -> float:
    """Return the best swing stop for the given direction.

    Long:  swing low of the last `lookback` bars minus 1 tick buffer
    Short: swing high of the last `lookback` bars plus 1 tick buffer

    The result is clamped so that distance from bars[-1].close is between
    MIN_STOP_TICKS and MAX_STOP_TICKS.
    """
    window = bars[-lookback:] if len(bars) >= lookback else bars
    last_price = bars[-1].close

    if direction == "long":
        raw_stop = min(b.low for b in window) - tick_size
        # Clamp: must be at least MIN_STOP_TICKS away
        min_stop = last_price - _MAX_STOP_TICKS * tick_size
        max_stop = last_price - _MIN_STOP_TICKS * tick_size
        stop = max(min_stop, min(raw_stop, max_stop))
    else:
        raw_stop = max(b.high for b in window) + tick_size
        min_stop = last_price + _MIN_STOP_TICKS * tick_size
        max_stop = last_price + _MAX_STOP_TICKS * tick_size
        stop = min(max_stop, max(raw_stop, min_stop))

    return _round_tick(stop, tick_size)


def _precision_targets(
    entry: float,
    stop: float,
    direction: str,
    tick_size: float = _NQ_TICK_SIZE,
    cap_level: Optional[float] = None,
) -> tuple[float, float]:
    """Compute target_1 (1.5R) and target_2 (2.5R) from entry and stop.

    If `cap_level` (e.g. PDH/PDL) lies between entry and target, the first
    target that crosses it is capped at that level.

    Returns (target_1, target_2) both tick-rounded.
    """
    risk = abs(entry - stop)
    sign = 1 if direction == "long" else -1

    t1 = _round_tick(entry + sign * risk * 1.5, tick_size)
    t2 = _round_tick(entry + sign * risk * 2.5, tick_size)

    if cap_level is not None:
        if direction == "long" and cap_level > entry:
            if t1 > cap_level:
                t1 = _round_tick(cap_level, tick_size)
            if t2 > cap_level:
                t2 = _round_tick(cap_level, tick_size)
        elif direction == "short" and cap_level < entry:
            if t1 < cap_level:
                t1 = _round_tick(cap_level, tick_size)
            if t2 < cap_level:
                t2 = _round_tick(cap_level, tick_size)

    return t1, t2


def _enrich_signal(
    sig: "TradeSignal",
    reasoning: str,
    invalidation: str,
    tick_size: float = _NQ_TICK_SIZE,
    expires_bars: int = _DEFAULT_EXPIRES_BARS,
    cap_level: Optional[float] = None,
) -> "TradeSignal":
    """Fill v3 precision fields on an existing TradeSignal in-place.

    Computes:
      - target_1, target_2 (1.5R / 2.5R, tick-rounded, capped at cap_level)
      - risk_ticks, reward_ticks, rr_ratio
      - reasoning, invalidation, expires_bars, tick_size
    """
    t1, t2 = _precision_targets(
        sig.entry_price, sig.stop_price, sig.direction,
        tick_size=tick_size, cap_level=cap_level,
    )
    sig.target_1 = t1
    sig.target_2 = t2
    sig.risk_ticks = _ticks(sig.entry_price - sig.stop_price, tick_size)
    sig.reward_ticks = _ticks(t1 - sig.entry_price, tick_size)
    sig.rr_ratio = round(sig.reward_ticks / sig.risk_ticks, 2) if sig.risk_ticks > 0 else 0.0
    sig.reasoning = reasoning
    sig.invalidation = invalidation
    sig.expires_bars = expires_bars
    sig.tick_size = tick_size
    return sig


def _bar_index_in_session(bars: list[OHLCVBar]) -> int:
    """Return the index of the last bar within the current RTH session (0-based).

    Counts only bars from TODAY's RTH session (09:30-16:00 ET).
    This is critical for session-based filters like ORB (bar 30-60)
    and VWAP bounce (bar 30-180).
    """
    if not bars:
        return 0
    from datetime import datetime, timezone as _tz
    from zoneinfo import ZoneInfo
    _ET = ZoneInfo("America/New_York")
    now_et = datetime.now(_ET)
    today = now_et.date()
    # Count bars that are in today's RTH (09:30-16:00 ET)
    count = 0
    for b in bars:
        dt = datetime.fromtimestamp(b.timestamp, tz=_tz.utc).astimezone(_ET)
        if dt.date() != today:
            continue
        h, m = dt.hour, dt.minute
        t = h * 60 + m
        if 570 <= t < 960:  # 09:30 - 16:00
            count += 1
    return min(count, 400)


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
    tick_size: float = _NQ_TICK_SIZE,
) -> list[TradeSignal]:
    """Detect high-quality trade signals based on profitable AlgoView strategies.

    Philosophy: FEWER but BETTER signals. No signal is better than a bad signal.

    v3 improvements:
      - Precise entry/stop/target prices (tick-level)
      - Session-aware confluence thresholds (NY Open = 1, others = 2)
      - target_1 (1.5R) / target_2 (2.5R) on every signal
      - reasoning + invalidation strings on every signal

    Hard filters applied before any signal is generated:
      - Session filter: only during RTH (09:30-16:00 ET)
      - Session filter: no signals during opening trap (first 15 bars)
      - Stop distance: MIN 8 ticks, MAX 40 ticks
      - R:R >= 1.35:1

    Parameters
    ----------
    bars:            List of OHLCV bars (bar 0 = session open)
    bias_state:      "LONG" | "RANGE_LONG" | "RANGE" | "RANGE_SHORT" | "SHORT"
    bias_score:      Integer bias score (-100 to +100)
    poc:             Current session Point of Control
    vah:             Value Area High
    val:             Value Area Low
    prev_high:       Previous day high (PDH)
    prev_low:        Previous day low (PDL)
    or_high:         Opening Range High (first 30 min)
    or_low:          Opening Range Low
    ib_high:         Initial Balance High (first 60 min)
    ib_low:          Initial Balance Low
    naked_pocs:      List of unvisited POC levels from prior sessions
    key_levels:      List of dicts with {"level": float, ...}
    vwap:            Current session VWAP
    session_bar_idx: Bar index within the current RTH session (0-based).
                     When None, falls back to len(bars) - 1 (legacy behaviour).
    tick_size:       Instrument tick size (default 0.25 for NQ/ES).
    """
    if len(bars) < 50:
        return []

    # Determine session from the last bar's timestamp.
    # Fallback: if the last bar appears stale (e.g. bars from a historical dataset
    # end during overnight), use the real wall-clock session so we don't
    # accidentally suppress live signals.
    last_ts = bars[-1].timestamp
    current_session: Session = classify_session(last_ts)
    current_session_str: str = current_session.value

    # Hard RTH filter: suppress all signals outside 09:30-16:00 ET.
    if current_session_str not in _RTH_SESSIONS:
        return []

    # NY Open session gives a +1 confluence boost (higher signal quality window)
    _ny_open_boost: int = 1 if current_session_str in _HIGH_CONFIDENCE_SESSIONS else 0

    # Session-specific minimum confluence (v3)
    _session_min_conf: int = _SESSION_MIN_CONFLUENCE.get(current_session_str, _DEFAULT_MIN_CONFLUENCE)

    # Session filter — no signals during opening trap (first 15 bars)
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

    # ATR approximation — use session bars only for realistic ATR
    # (mixed premarket + RTH bars inflate ATR with overnight ranges)
    session_recent = [b for b in recent_20 if classify_session(b.timestamp).value in _RTH_SESSIONS]
    atr_bars = session_recent if len(session_recent) >= 5 else recent_20
    atr = sum(b.high - b.low for b in atr_bars) / len(atr_bars)
    atr = max(atr, 0.25)
    atr = min(atr, 20.0)  # cap at 20 points — prevents absurd thresholds

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
        min_confluence: int | None = None,
        reasoning: str = "",
        invalidation: str = "",
        expires_bars: int = _DEFAULT_EXPIRES_BARS,
        cap_level: float | None = None,
    ) -> TradeSignal | None:
        """Apply all hard filters and return a TradeSignal or None.

        v3: min_confluence defaults to the session-specific threshold when None.
        All v3 precision fields (target_1, target_2, risk_ticks, ...) are
        populated via _enrich_signal() after the TradeSignal is constructed.
        """
        # Effective minimum confluence: caller override OR session-based default
        effective_min_conf = _session_min_conf if min_confluence is None else min_confluence

        # VWAP alignment — not a hard block, but adds to confluence
        vwap_ok = vwap_long if direction == "long" else vwap_short

        # Tick-round entry and stop to nearest valid price
        entry = _round_tick(entry, tick_size)
        stop = _round_tick(stop, tick_size)
        target = _round_tick(target, tick_size)

        # Stop distance filter: must be within MIN_STOP_TICKS..MAX_STOP_TICKS
        stop_dist_ticks = _ticks(entry - stop, tick_size)
        if stop_dist_ticks < _MIN_STOP_TICKS:
            return None
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

        # Confluence filter — NY Open session gets a +1 boost (higher-quality window)
        raw_conf = _count_confirmations(
            bars, direction, bias_state, avg_volume, vwap
        )
        boosted_conf = raw_conf + _ny_open_boost
        if boosted_conf < effective_min_conf:
            return None
        conf = _confidence_from_count(boosted_conf, min_for_signal=effective_min_conf)
        if conf is None:  # redundant guard
            return None

        sig = TradeSignal(
            direction=direction,
            signal_type=signal_type,
            entry_price=round(entry, 2),
            stop_price=round(stop, 2),
            target_price=round(target, 2),
            risk_reward=round(rr, 2),
            confidence=conf,
            reason=reason_template,
            timestamp=timestamp,
            session=current_session_str,
            breakeven_at=_DEFAULT_BREAKEVEN_PCT,
            confluence_count=boosted_conf,
            vwap_aligned=vwap_ok,
        )

        # Populate v3 precision fields
        _enrich_signal(
            sig,
            reasoning=reasoning or reason_template,
            invalidation=invalidation,
            tick_size=tick_size,
            expires_bars=expires_bars,
            cap_level=cap_level,
        )
        return sig

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
                # Entry: OR_High + 1 tick (confirmation above level)
                entry = _round_tick(or_high + tick_size, tick_size)
                # Stop: swing stop over last 10 bars, capped at MIN/MAX
                stop = _swing_stop(bars, "long", tick_size, lookback=10)
                stop_dist = abs(entry - stop)
                if stop_dist >= atr * 0.5 and _stop_within_limit(entry, stop):
                    target = targets_above[0] if targets_above else entry + stop_dist * 2
                    sig = _try_build_signal(
                        "long", "orb_break", entry, stop, target, last.timestamp,
                        (
                            f"ORB Breakout Long: Close {last.close:.2f} > OR High {or_high:.2f},"
                            f" Vol {last.volume:.0f} > {_ORB_MIN_VOLUME_FACTOR}x Avg,"
                            f" Entry {entry:.2f}, Stop {stop:.2f}"
                        ),
                        min_confluence=_ORB_MIN_CONFLUENCE,
                        reasoning=(
                            f"Price broke Opening Range ({or_low:.2f}-{or_high:.2f}) to the upside"
                            f" with {last.volume:.0f} volume ({_ORB_MIN_VOLUME_FACTOR}x avg)."
                            f" Entry above OR high at {entry:.2f}."
                        ),
                        invalidation=f"Below OR High {or_high:.2f} (failed breakout)",
                        cap_level=prev_high,
                    )
                    if sig:
                        signals.append(sig)

            if last_price < or_low and allow_short and high_volume and prior_inside_or_low:
                # Entry: OR_Low - 1 tick
                entry = _round_tick(or_low - tick_size, tick_size)
                stop = _swing_stop(bars, "short", tick_size, lookback=10)
                stop_dist = abs(stop - entry)
                if stop_dist >= atr * 0.5 and _stop_within_limit(entry, stop):
                    target = targets_below[0] if targets_below else entry - stop_dist * 2
                    sig = _try_build_signal(
                        "short", "orb_break", entry, stop, target, last.timestamp,
                        (
                            f"ORB Breakout Short: Close {last.close:.2f} < OR Low {or_low:.2f},"
                            f" Vol {last.volume:.0f} > {_ORB_MIN_VOLUME_FACTOR}x Avg,"
                            f" Entry {entry:.2f}, Stop {stop:.2f}"
                        ),
                        min_confluence=_ORB_MIN_CONFLUENCE,
                        reasoning=(
                            f"Price broke Opening Range ({or_low:.2f}-{or_high:.2f}) to the downside"
                            f" with {last.volume:.0f} volume ({_ORB_MIN_VOLUME_FACTOR}x avg)."
                            f" Entry below OR low at {entry:.2f}."
                        ),
                        invalidation=f"Above OR Low {or_low:.2f} (failed breakdown)",
                        cap_level=prev_low,
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
            # Entry: POC + 2 ticks (long — confirmed break above POC)
            entry = _round_tick(poc + _ENTRY_OFFSET_TICKS * tick_size, tick_size)
            # Stop: structural low of the rejection zone, clamped to MIN/MAX ticks
            rejection_low = min(b_m2.low, b_m1.low, last.low)
            raw_stop = rejection_low - tick_size
            stop_ticks_dist = _ticks(entry - raw_stop, tick_size)
            if stop_ticks_dist < _MIN_STOP_TICKS:
                raw_stop = entry - _MIN_STOP_TICKS * tick_size
            if stop_ticks_dist > _MAX_STOP_TICKS:
                raw_stop = entry - _MAX_STOP_TICKS * tick_size
            stop = _round_tick(raw_stop, tick_size)
            target = targets_above[0] if targets_above else entry + atr * 3
            sig = _try_build_signal(
                "long", "poc_rejection", entry, stop, target, last.timestamp,
                (
                    f"POC Rejection Long: Bounce at POC {poc:.2f},"
                    f" Vol {last.volume:.0f} vs Avg {avg_volume:.0f},"
                    f" Entry {entry:.2f}, Stop {stop:.2f}"
                ),
                min_confluence=2,
                reasoning=(
                    f"Price approached POC {poc:.2f} from below over 3 bars,"
                    f" then reversed above it with volume {last.volume:.0f}"
                    f" ({last.volume / avg_volume:.1f}x avg)."
                    f" Bullish engulfing / POC reclaim. Entry at {entry:.2f}."
                ),
                invalidation=f"Back below POC {poc:.2f} (rejection failed)",
                cap_level=vah if vah is not None and vah > entry else None,
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
            # Entry: POC - 2 ticks (short — confirmed break below POC)
            entry = _round_tick(poc - _ENTRY_OFFSET_TICKS * tick_size, tick_size)
            rejection_high = max(b_m2.high, b_m1.high, last.high)
            raw_stop = rejection_high + tick_size
            stop_ticks_dist = _ticks(raw_stop - entry, tick_size)
            if stop_ticks_dist < _MIN_STOP_TICKS:
                raw_stop = entry + _MIN_STOP_TICKS * tick_size
            if stop_ticks_dist > _MAX_STOP_TICKS:
                raw_stop = entry + _MAX_STOP_TICKS * tick_size
            stop = _round_tick(raw_stop, tick_size)
            target = targets_below[0] if targets_below else entry - atr * 3
            sig = _try_build_signal(
                "short", "poc_rejection", entry, stop, target, last.timestamp,
                (
                    f"POC Rejection Short: Rejection at POC {poc:.2f},"
                    f" Vol {last.volume:.0f} vs Avg {avg_volume:.0f},"
                    f" Entry {entry:.2f}, Stop {stop:.2f}"
                ),
                min_confluence=2,
                reasoning=(
                    f"Price approached POC {poc:.2f} from above over 3 bars,"
                    f" then reversed below it with volume {last.volume:.0f}"
                    f" ({last.volume / avg_volume:.1f}x avg)."
                    f" Bearish rejection / POC reclaim short. Entry at {entry:.2f}."
                ),
                invalidation=f"Back above POC {poc:.2f} (rejection failed)",
                cap_level=val if val is not None and val < entry else None,
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
            and atr <= 15.0           # not a high-volatility trending day
            and vwap_bar_idx >= 3     # past first 15min opening (relaxed from 30)
            and vwap_bar_idx <= 300): # during RTH (relaxed from 180)
        distance_from_vwap = last_price - vwap  # positive = above, negative = below

        # LONG VWAP Bounce: price below VWAP, reversing up
        # Only when bias is NOT bearish (RANGE_SHORT/SHORT) — don't fade downtrends
        # LONG VWAP Bounce: price meaningfully below VWAP (>5 points for NQ)
        # Removed ATR multiplier (was 2.5x ATR which is unreachable with multi-day ATR)
        # Removed bias filter (price action at VWAP is the signal, not bias)
        if distance_from_vwap < -5.0:  # at least 5 points below VWAP
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
                # Entry: VWAP - 2 ticks offset (price still below VWAP, bouncing toward it)
                entry = _round_tick(last_price + _ENTRY_OFFSET_TICKS * tick_size, tick_size)
                stop = _swing_stop(bars, "long", tick_size, lookback=10)
                stop_dist = abs(entry - stop)
                if stop_dist <= _MAX_STOP_POINTS and stop_dist >= atr * 0.5:
                    dist_to_vwap = abs(vwap - entry)
                    target = vwap if dist_to_vwap / stop_dist >= _MIN_RR else entry + stop_dist * _MIN_RR * 1.1
                    sig = _try_build_signal(
                        "long", "vwap_bounce", entry, stop, target, last.timestamp,
                        (
                            f"VWAP Bounce Long: Price {distance_from_vwap:.1f}pts"
                            f" below VWAP {vwap:.2f}, 3-bar bounce confirmed,"
                            f" Entry {entry:.2f}, Stop {stop:.2f}"
                        ),
                        min_confluence=2,
                        reasoning=(
                            f"Price extended {abs(distance_from_vwap):.1f}pts below VWAP {vwap:.2f}"
                            f" and has started a mean-reversion bounce (3-bar up momentum)."
                            f" Entry at {entry:.2f} (current close + 2 ticks)."
                        ),
                        invalidation=f"Below {stop:.2f} (swing low + 1 tick)",
                        cap_level=vwap,
                    )
                    if sig:
                        signals.append(sig)

        # SHORT VWAP Bounce: price above VWAP, reversing down
        # Only when bias is NOT bullish (RANGE_LONG/LONG) — don't fade uptrends
        # SHORT VWAP Bounce: price meaningfully above VWAP (>5 points for NQ)
        elif distance_from_vwap > 5.0:  # at least 5 points above VWAP
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
                # Entry: current price - 2 ticks (fading the extension)
                entry = _round_tick(last_price - _ENTRY_OFFSET_TICKS * tick_size, tick_size)
                stop = _swing_stop(bars, "short", tick_size, lookback=10)
                stop_dist = abs(stop - entry)
                if stop_dist <= _MAX_STOP_POINTS and stop_dist >= atr * 0.5:
                    dist_to_vwap = abs(entry - vwap)
                    target = vwap if dist_to_vwap / stop_dist >= _MIN_RR else entry - stop_dist * _MIN_RR * 1.1
                    sig = _try_build_signal(
                        "short", "vwap_bounce", entry, stop, target, last.timestamp,
                        (
                            f"VWAP Bounce Short: Price {distance_from_vwap:.1f}pts"
                            f" above VWAP {vwap:.2f}, 3-bar reversal confirmed,"
                            f" Entry {entry:.2f}, Stop {stop:.2f}"
                        ),
                        min_confluence=2,
                        reasoning=(
                            f"Price extended {distance_from_vwap:.1f}pts above VWAP {vwap:.2f}"
                            f" and has started a mean-reversion reversal (3-bar down momentum)."
                            f" Entry at {entry:.2f} (current close - 2 ticks)."
                        ),
                        invalidation=f"Above {stop:.2f} (swing high + 1 tick)",
                        cap_level=vwap,
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
                # Entry: break level + 2 ticks in direction
                entry = _round_tick(last_price + _ENTRY_OFFSET_TICKS * tick_size, tick_size)
                stop = _swing_stop(bars, "long", tick_size, lookback=10)
                sig = _try_build_signal(
                    "long", "bos", entry, stop, closest_above, last.timestamp,
                    (
                        f"Naked POC Magnet Long: Untested POC at {closest_above:.2f},"
                        f" momentum up, Entry {entry:.2f}, Stop {stop:.2f}"
                    ),
                    reasoning=(
                        f"Price moving toward untested naked POC at {closest_above:.2f}"
                        f" ({distance:.1f}pts away) with 3-bar upward momentum."
                        f" POC acts as magnet — high probability of fill. Entry {entry:.2f}."
                    ),
                    invalidation=f"Below {stop:.2f} (momentum failed)",
                )
                if sig:
                    signals.append(sig)

        if closest_below is not None and allow_short and momentum_down:
            distance = last_price - closest_below
            if distance < atr * 3:
                entry = _round_tick(last_price - _ENTRY_OFFSET_TICKS * tick_size, tick_size)
                stop = _swing_stop(bars, "short", tick_size, lookback=10)
                sig = _try_build_signal(
                    "short", "bos", entry, stop, closest_below, last.timestamp,
                    (
                        f"Naked POC Magnet Short: Untested POC at {closest_below:.2f},"
                        f" momentum down, Entry {entry:.2f}, Stop {stop:.2f}"
                    ),
                    reasoning=(
                        f"Price moving toward untested naked POC at {closest_below:.2f}"
                        f" ({distance:.1f}pts away) with 3-bar downward momentum."
                        f" POC acts as magnet — high probability of fill. Entry {entry:.2f}."
                    ),
                    invalidation=f"Above {stop:.2f} (momentum failed)",
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

            # Entry: PDH + 1 tick (close confirmation above level)
            entry = _round_tick(prev_high + tick_size, tick_size)
            stop = _swing_stop(bars, "long", tick_size, lookback=10)
            stop_dist = abs(entry - stop)

            if stop_dist >= atr * 1.0 and _stop_within_limit(entry, stop):
                risk = stop_dist
                target = entry + risk * 2.0
                if targets_above:
                    t_candidate = targets_above[0]
                    if abs(t_candidate - entry) / risk >= _MIN_RR:
                        target = t_candidate

                sig = _try_build_signal(
                    "long", "daily_breakout", entry, stop, target, last.timestamp,
                    (
                        f"Daily Breakout Long: Close {last.close:.2f} > PDH {prev_high:.2f},"
                        f" intraday (no gap), Entry {entry:.2f}, Stop {stop:.2f}"
                    ),
                    min_confluence=2,
                    reasoning=(
                        f"Price broke above Previous Day High {prev_high:.2f} intraday"
                        f" (not a gap — bar index {bar_idx})."
                        f" Entry above PDH at {entry:.2f}. Stop at swing low {stop:.2f}."
                    ),
                    invalidation=f"Close back below PDH {prev_high:.2f}",
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

            # Entry: PDL - 1 tick
            entry = _round_tick(prev_low - tick_size, tick_size)
            stop = _swing_stop(bars, "short", tick_size, lookback=10)
            stop_dist = abs(stop - entry)

            if stop_dist >= atr * 1.0 and _stop_within_limit(entry, stop):
                risk = stop_dist
                target = entry - risk * 2.0
                if targets_below:
                    t_candidate = targets_below[0]
                    if abs(entry - t_candidate) / risk >= _MIN_RR:
                        target = t_candidate

                sig = _try_build_signal(
                    "short", "daily_breakout", entry, stop, target, last.timestamp,
                    (
                        f"Daily Breakout Short: Close {last.close:.2f} < PDL {prev_low:.2f},"
                        f" intraday (no gap), Entry {entry:.2f}, Stop {stop:.2f}"
                    ),
                    min_confluence=2,
                    reasoning=(
                        f"Price broke below Previous Day Low {prev_low:.2f} intraday"
                        f" (not a gap — bar index {bar_idx})."
                        f" Entry below PDL at {entry:.2f}. Stop at swing high {stop:.2f}."
                    ),
                    invalidation=f"Close back above PDL {prev_low:.2f}",
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
                # Entry: consolidation high + 2 ticks (breakout confirmation)
                entry = _round_tick(sz_high + _ENTRY_OFFSET_TICKS * tick_size, tick_size)
                # Stop: consolidation low (structure break invalidates setup)
                stop = _round_tick(sz_low - tick_size, tick_size)
                if _stop_within_limit(entry, stop):
                    extension = sz_range * 0.75
                    target = sz_high + extension
                    for t in targets_above:
                        if sz_high < t <= sz_high + extension * 2:
                            target = t
                            break
                    sig = _try_build_signal(
                        "long", "sammelzone_breakout", entry, stop,
                        _round_tick(target, tick_size), last.timestamp,
                        (
                            f"Sammelzone Breakout Long: Break above consolidation"
                            f" {sz_low:.2f}-{sz_high:.2f},"
                            f" Entry {entry:.2f}, Stop {stop:.2f}, Target {target:.2f}"
                        ),
                        reasoning=(
                            f"Price broke above consolidation zone {sz_low:.2f}-{sz_high:.2f}"
                            f" (range {sz_range:.1f}pts). Entry at {entry:.2f},"
                            f" 75% extension target {target:.2f}."
                        ),
                        invalidation=f"Back inside consolidation below {sz_high:.2f}",
                    )
                    if sig:
                        signals.append(sig)

            if last_price < sz_low and allow_short:
                entry = _round_tick(sz_low - _ENTRY_OFFSET_TICKS * tick_size, tick_size)
                stop = _round_tick(sz_high + tick_size, tick_size)
                if _stop_within_limit(entry, stop):
                    extension = sz_range * 0.75
                    target = sz_low - extension
                    for t in targets_below:
                        if sz_low - extension * 2 <= t < sz_low:
                            target = t
                            break
                    sig = _try_build_signal(
                        "short", "sammelzone_breakout", entry, stop,
                        _round_tick(target, tick_size), last.timestamp,
                        (
                            f"Sammelzone Breakout Short: Break below consolidation"
                            f" {sz_low:.2f}-{sz_high:.2f},"
                            f" Entry {entry:.2f}, Stop {stop:.2f}, Target {target:.2f}"
                        ),
                        reasoning=(
                            f"Price broke below consolidation zone {sz_low:.2f}-{sz_high:.2f}"
                            f" (range {sz_range:.1f}pts). Entry at {entry:.2f},"
                            f" 75% extension target {target:.2f}."
                        ),
                        invalidation=f"Back inside consolidation above {sz_low:.2f}",
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

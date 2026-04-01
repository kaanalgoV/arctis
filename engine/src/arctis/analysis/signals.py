"""Trade signal detection — Optimized v9 (2026-03-27).

Optimization history:
  v1 (original): 14 trades, 28.6% WR, PF 0.94 — almost breakeven
  v2 (2026-03-24): Targeted fixes based on 90-day Jan-Mar 2026 backtest
  v3 (2026-03-25): Precise entry/stop/target prices, session-aware confluence thresholds
  v5 (2026-03-27): March backtest: 13 trades, 61.5% WR, PF 6.07, Avg R +1.54
  v6 (2026-03-27): OR Breakout learning system — 6 config iterations on Feb-Mar data
    - Backtest results (Feb 25 - Mar 27, 23 trading days):
      ES: PF 2.77, 46.2% WR, 13 trades, +38.25pt (+$1912)
      NQ: PF 1.67, 27.3% WR, 22 trades (poor — NQ OR breakout marginal)
  v7 (2026-03-29): Data-driven 10-hour sprint with deep analysis on 22 trading days
    - NEW: market_root parameter for market-specific signal tuning
    - ORB: Market-specific stop placement (data-driven):
      NQ: ATR-based stop (1x ATR) — 59% WR, PF 3.17 (vs 27% WR with full OR stop)
      ES: 0.75x OR stop — PF 4.96, 64% WR (best stop mode for ES)
    - ORB: NQ OR range filter: skip OR > 35pts (14% WR above 35pts)
      NQ sweet spot: OR 25-35pts = 50% WR; >35pts = 14% WR
    - ORB: Extended window to bars 30-90 (was 30-60) — more trade opportunities
    - Daily Breakout: Now requires VWAP alignment for confirmation
      Finding: VWAP-aligned PDH/PDL breakouts: ES 64% WR, NQ 53% WR
      Without VWAP alignment: significantly worse
    - Daily Breakout: RVOL >= 0.7 required (ES: 64% WR with filter vs 50% without)
    - POC Rejection: Min confluence raised to 3 (was 2)
      Finding: POC rejections only 33-36% WR at 1.5R — need higher selectivity
    - POC Rejection: Min R:R raised to 2.0 (was 1.5) — marginal signal needs bigger payoff
    - Backtest results (Feb 25 - Mar 27, v7):
      See ENGINE_LEARNINGS.md for full analysis
  v8 (2026-03-31): NQ profitability sprint — systematic optimization of 300+ configs
    - NQ was losing money (PF 0.56, -5152 USD) with v7 ORB-only approach
    - Tested: OR breakout sweep (6 stop modes x 4 RR x 3 confluence x 3 windows)
    - Tested: 4 alternative strategies (VWAP MR, PDH/PDL, OR Fade, EMA Pullback)
    - Winner: VWAP Mean Reversion — PF 2.11, 60.6% WR, +3929 USD (33 trades)
    - NEW: vwap_bounce signal completely redesigned (was disabled at 22% WR)
      Old: 3-bar momentum + position-in-range + fixed 10pt threshold = 22% WR
      New: reversal bar + 1x ATR threshold + 1R target = 60.6% WR
    - ORB: Both NQ and ES now use 0.5x OR stop (was ATR for NQ, 0.75x for ES)
      NQ 0.5x OR: PF 1.33, +2913 USD (was PF 0.56 with full OR stop)
      ES 0.5x OR: PF 3.39, +10754 USD (was PF 1.84 with full OR stop)
    - ORB window extended to 120 bars (was 90)
    - Combined NQ result: PF 1.55, 51% WR, +6841 USD (was -5152 USD)
    - Combined ES result: PF 3.39, 55% WR, +10754 USD

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

# v9: Market-adaptive stop cap. The old fixed 10pt (40 ticks) cap blocked
# ALL NQ ORB signals and most ES ORB signals because 0.5x OR range is
# typically 20-60pt for NQ and 8-21pt for ES.
# These are now DEFAULT values, overridden per-market in detect_signals().
_MAX_STOP_TICKS: int = 240   # v9: 60pt default (NQ-friendly)
_MIN_STOP_TICKS: int = 12  # v4: 3 pts — wider stops survive noise better (was 8/2pts)

# Legacy alias: used in existing _stop_within_limit()
_MAX_STOP_POINTS: float = _MAX_STOP_TICKS * _NQ_TICK_SIZE  # 60.0

# Entry offset: number of ticks BEYOND the trigger level to enter
# (avoids entering right at the level where rejection is likely)
_ENTRY_OFFSET_TICKS: int = 2   # 0.50 pts for NQ

# Minimum R:R — raised to 1.5:1 for better signal quality (was 1.35)
_MIN_RR: float = 1.50

# Breakeven trigger: move stop to entry when 35% of target distance is reached
_DEFAULT_BREAKEVEN_PCT: float = 0.35

# Session bar ranges (1-minute bars starting 09:30 ET)
# Bar 0 = 09:30, Bar 14 = 09:44 (opening volatility — skip)
_SKIP_BARS_OPENING_END: int = 3    # bars 0-2 (first 15min only, was 15)

# ORB requires this many confirmations
# v9: Lowered from 3 to 2 — audit showed ORB never fired for NQ because
# confluence=3 is too strict with 5 conditions (bias+vol+structure+velocity+vwap).
# ORB is inherently confirmed by the breakout itself + volume.
_ORB_MIN_CONFLUENCE: int = 2
# v9: Lowered from 1.2 to 1.0 — many valid ORBs have normal volume, not 1.2x.
# The RVOL >= 0.7 filter in _try_build_signal already blocks thin volume.
_ORB_MIN_VOLUME_FACTOR: float = 1.0

# Session-specific minimum confluence thresholds (v6)
# v6: NY Open raised to 2 (was 1 — ALL ES losses in backtest had confluence=2,
#      the old minimum. Raising to 2 means only signals with 2+ raw confirmations
#      fire, eliminating the weakest entries.)
# Midday / other RTH: require at least 2 confirmations
_SESSION_MIN_CONFLUENCE: dict[str, int] = {
    Session.NY_OPEN.value:     2,
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


def _stop_within_limit(entry: float, stop: float, max_pts: float = 0.0) -> bool:
    """True if the stop distance does not exceed the max stop points.

    v9: max_pts parameter allows market-specific limits. If 0, uses global default.
    """
    limit = max_pts if max_pts > 0 else _MAX_STOP_POINTS
    return abs(entry - stop) <= limit


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
    market_root: str = "NQ",
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
    market_root:     Market root symbol ("NQ", "ES") for market-specific parameters.
    """
    if len(bars) < 50:
        return []

    # v7: Market-specific configuration (data-driven from deep analysis sprint)
    _mkt = market_root.upper()
    _is_es = _mkt == "ES"
    _is_nq = _mkt == "NQ"

    # v9: Market-specific max stop points — the old 10pt global cap blocked
    # ALL NQ ORB signals (NQ OR ranges are 48-229pt, 0.5x = 24-115pt) and
    # most ES ORB signals (ES OR ranges are 7-43pt, 0.5x = 4-21pt).
    # New limits: NQ 60pt (captures 0.5x of OR up to 120pt range),
    #             ES 25pt (captures 0.5x of OR up to 50pt range).
    _max_stop_pts: float = 60.0 if _is_nq else 25.0

    # ORB parameters — different optimal configs per market
    # v8: Both NQ and ES use 0.5x OR stop with RR 2.0.
    # March backtest: NQ 0.5x OR stop PF 1.33 (18 trades), ES 0.5x OR stop PF 3.39
    # NQ was ATR-based (v7) but 0.5x OR outperformed in full audit (+2913 USD vs +640)
    _orb_max_or_range: float = 999.0   # no range filter needed with 0.5x OR stop
    _orb_stop_mode: str = "or_fraction"  # both markets: fraction of OR range
    _orb_stop_fraction: float = 0.5   # 0.5x OR range as stop distance
    _orb_atr_mult: float = 1.0       # unused (kept for fallback)
    # ORB window: extended to bar 120 (was 90) for more NQ opportunities
    _orb_max_bar: int = 120

    # v8 NEW: VWAP Mean Reversion — NQ primary signal
    # March backtest: PF 2.11, 60.6% WR, 33 trades, +3929 USD
    # Parameters: 1x ATR distance from VWAP, reversal bar, 1R target, max bar 120
    # v9: VWAP MR — NQ only. ES VWAP MR is -19pt (38% WR) in March audit.
    _vwap_mr_enabled: bool = _is_nq  # NQ: +42pt, 54% WR; ES: -19pt, disabled
    # v9: raised from 1.0 to 1.5 — audit showed 1x ATR fires too often near VWAP
    # where price oscillates naturally. 1.5x ATR requires meaningful extension.
    _vwap_mr_atr_threshold: float = 1.5  # distance > 1.5x ATR from VWAP
    _vwap_mr_rr: float = 1.0  # 1R target (quick profit taking)
    _vwap_mr_max_bar: int = 120  # only first 120 bars
    _vwap_mr_max_risk: float = 60.0  # max risk in points
    _vwap_mr_min_risk: float = 2.0  # min risk in points

    # v9: Daily breakout — ES only. NQ daily breakout is -157pt (27% WR) in March audit.
    _daily_breakout_enabled: bool = _is_es  # ES: +92pt, 43% WR; NQ: -157pt, disabled
    # Daily breakout: require VWAP alignment (ES: 64% WR with, NQ: 53% with)
    _daily_require_vwap: bool = True  # v7: data shows VWAP alignment is a strong filter

    # POC rejection: raise selectivity (33-36% WR at 1.5R is marginal)
    _poc_min_confluence: int = 3   # v7: was 2, need more confirmation for marginal signal
    _poc_min_rr: float = 2.0      # v7: was 1.5, need bigger payoff for lower WR signal

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

    # Session filter — no signals during opening trap (first 3 bars)
    # When session_bar_idx is provided (e.g. by backtest), use it directly
    # instead of _in_session_filter which relies on wall-clock date.
    _effective_bar_idx = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)
    if _effective_bar_idx < _SKIP_BARS_OPENING_END:
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

        # Stop distance filter: must be within MIN_STOP_TICKS..market-specific max
        stop_dist_ticks = _ticks(entry - stop, tick_size)
        if stop_dist_ticks < _MIN_STOP_TICKS:
            return None
        if not _stop_within_limit(entry, stop, max_pts=_max_stop_pts):
            return None

        # R:R filter
        risk = abs(entry - stop)
        if risk <= 0:
            return None
        reward = abs(target - entry)
        rr = reward / risk
        if rr < _MIN_RR:
            return None

        # v6: Volume confirmation — RVOL < 0.7 blocked (was 0.5).
        # Backtest shows RVOL >= 0.7 significantly improves signal quality.
        # Low-volume entries are the primary source of false breakouts.
        if avg_volume > 0 and last.volume < avg_volume * 0.7:
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
    # v7: Market-specific OR breakout with data-driven stop placement.
    #
    # KEY: Only fire when the LAST bar is the BREAKOUT BAR (bars[-2] was inside
    # the OR, bars[-1] is the first close outside).
    #
    # v7 Stop placement (data-driven from deep analysis of 22 trading days):
    #   NQ: 1x ATR stop — gives 59% WR, PF 3.17 (full OR stop only 27% WR at 1.5R)
    #   ES: 0.75x OR stop — gives PF 4.96, 64% WR (best mode for ES)
    # v7 OR range filter:
    #   NQ: Skip OR > 35pts (14% WR above 35pts). Sweet spot is 0-35pts (50% WR).
    #   ES: No filter needed (profitable across all ranges).
    # v7 Window: bars 30-90 (was 30-60) for more opportunities.
    if or_high is not None and or_low is not None:
        or_range = or_high - or_low
        bar_idx_orb = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)
        # v7: Market-specific OR range filter
        or_range_ok = or_range <= _orb_max_or_range
        if or_range > 0 and avg_volume > 0 and bar_idx_orb >= 30 and bar_idx_orb <= _orb_max_bar and or_range_ok:
            high_volume = last.volume > avg_volume * _ORB_MIN_VOLUME_FACTOR
            # v9: Relaxed first-bar check — prior bar was inside OR OR within 0.3% of boundary.
            # Old check (1.001 = 0.1%) was too strict for NQ where a few points difference
            # is normal.  Allow up to 0.3% overshoot for the prior bar.
            prior_inside_or_high = len(bars) >= 2 and bars[-2].close <= or_high * 1.003
            prior_inside_or_low = len(bars) >= 2 and bars[-2].close >= or_low * 0.997

            if last_price > or_high and allow_long and high_volume and prior_inside_or_high:
                # Entry: OR_High + 1 tick (confirmation above level)
                entry = _round_tick(or_high + tick_size, tick_size)
                # v7: Market-specific stop placement
                if _orb_stop_mode == "atr":
                    # NQ: ATR-based stop (1x ATR) — tighter, higher WR
                    stop_dist = atr * _orb_atr_mult
                    stop = _round_tick(entry - stop_dist, tick_size)
                else:
                    # ES: Fraction of OR range (0.75x) — captures OR structure
                    stop_dist = or_range * _orb_stop_fraction
                    stop = _round_tick(entry - stop_dist, tick_size)
                # Clamp stop within bounds
                stop_ticks = _ticks(entry - stop, tick_size)
                if stop_ticks < _MIN_STOP_TICKS:
                    stop = _round_tick(entry - _MIN_STOP_TICKS * tick_size, tick_size)
                    stop_dist = abs(entry - stop)
                if _stop_within_limit(entry, stop, max_pts=_max_stop_pts) and stop_dist >= atr * 0.3:
                    target = targets_above[0] if targets_above else entry + stop_dist * 2
                    sig = _try_build_signal(
                        "long", "orb_break", entry, stop, target, last.timestamp,
                        (
                            f"ORB Breakout Long: Close {last.close:.2f} > OR High {or_high:.2f},"
                            f" Vol {last.volume:.0f} > {_ORB_MIN_VOLUME_FACTOR}x Avg,"
                            f" Entry {entry:.2f}, Stop {stop:.2f} ({_mkt} {_orb_stop_mode})"
                        ),
                        min_confluence=_ORB_MIN_CONFLUENCE,
                        reasoning=(
                            f"Price broke Opening Range ({or_low:.2f}-{or_high:.2f}) to the upside"
                            f" with {last.volume:.0f} volume ({_ORB_MIN_VOLUME_FACTOR}x avg)."
                            f" Entry above OR high at {entry:.2f}."
                            f" Stop: {_orb_stop_mode} mode for {_mkt}."
                        ),
                        invalidation=f"Below OR High {or_high:.2f} (failed breakout)",
                        cap_level=prev_high,
                    )
                    if sig:
                        signals.append(sig)

            if last_price < or_low and allow_short and high_volume and prior_inside_or_low:
                # Entry: OR_Low - 1 tick
                entry = _round_tick(or_low - tick_size, tick_size)
                # v7: Market-specific stop placement
                if _orb_stop_mode == "atr":
                    stop_dist = atr * _orb_atr_mult
                    stop = _round_tick(entry + stop_dist, tick_size)
                else:
                    stop_dist = or_range * _orb_stop_fraction
                    stop = _round_tick(entry + stop_dist, tick_size)
                stop_ticks = _ticks(stop - entry, tick_size)
                if stop_ticks < _MIN_STOP_TICKS:
                    stop = _round_tick(entry + _MIN_STOP_TICKS * tick_size, tick_size)
                    stop_dist = abs(stop - entry)
                if _stop_within_limit(entry, stop, max_pts=_max_stop_pts) and stop_dist >= atr * 0.3:
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

    # ── 2. POC Rejection (v7: raised selectivity) ──────────────────────────────
    # POC acts as a magnet in ALL market conditions — price is drawn to it and
    # often rejects. Allow mean-reversion regardless of bias direction.
    # v7: POC rejections only 33-36% WR at 1.5R — marginal signal.
    #     Raised min_confluence to 3 (was 2) and min R:R to 2.0 (was 1.5).
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
                min_confluence=_poc_min_confluence,
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
                min_confluence=_poc_min_confluence,
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

    # ── 3b. VWAP Mean Reversion (v9 — bias-filtered) ────────────────────────
    # v8: Completely redesigned based on NQ March optimization sprint.
    # v9: Added bias filter — audit showed VWAP MR fired in wrong direction
    #     on 7/8 NQ failure days (went LONG when day was TREND DOWN, etc.).
    #     Fix: Do NOT fire VWAP MR long when bias is SHORT/RANGE_SHORT,
    #          do NOT fire VWAP MR short when bias is LONG/RANGE_LONG.
    #     Also: wider stop buffer (1.0pt instead of 0.50pt) and 1.5x ATR
    #           distance threshold (was 1.0x — too trigger-happy).
    #
    # Key design:
    #   1. Reversal detection: close < prev bar low (short) / close > prev bar high (long)
    #   2. ATR-based distance threshold (1.5x ATR from VWAP)
    #   3. 1R target (quick profit taking)
    #   4. Stop: recent 5-bar extreme + 1.0pt buffer
    #   5. Bias filter: do not fire contra-trend
    #   6. Lower confluence requirement (1) — the reversal bar IS the confirmation
    vwap_bar_idx = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)
    if (_vwap_mr_enabled and vwap is not None and vwap > 0 and len(bars) >= 8
            and vwap_bar_idx >= 3
            and vwap_bar_idx <= _vwap_mr_max_bar):
        distance_from_vwap = last_price - vwap  # positive = above, negative = below

        # v9: Bias guard — do not fight strong directional bias
        _vwap_mr_allow_long = bias_state not in ("SHORT", "RANGE_SHORT")
        _vwap_mr_allow_short = bias_state not in ("LONG", "RANGE_LONG")

        # LONG VWAP MR: price far below VWAP + reversal bar (close > prev bar high)
        if distance_from_vwap < -atr * _vwap_mr_atr_threshold and _vwap_mr_allow_long:
            reversal_bar = len(bars) >= 2 and last.close > bars[-2].high
            if reversal_bar:
                entry = _round_tick(last_price, tick_size)
                # Stop: lowest low of last 5 bars - 1.0pt buffer (v9: wider from 0.50)
                lookback_start = max(0, len(bars) - 6)
                stop_raw = min(b.low for b in bars[lookback_start:]) - 1.0
                stop = _round_tick(stop_raw, tick_size)
                risk = entry - stop
                if _vwap_mr_min_risk <= risk <= _vwap_mr_max_risk:
                    target = _round_tick(entry + risk * _vwap_mr_rr, tick_size)
                    sig = _try_build_signal(
                        "long", "vwap_bounce", entry, stop, target, last.timestamp,
                        (
                            f"VWAP MR Long: Price {abs(distance_from_vwap):.1f}pts below"
                            f" VWAP {vwap:.2f} ({abs(distance_from_vwap)/atr:.1f}x ATR),"
                            f" reversal bar confirmed, Entry {entry:.2f}, Stop {stop:.2f}"
                        ),
                        min_confluence=1,  # reversal bar is the confirmation
                        reasoning=(
                            f"Price extended {abs(distance_from_vwap):.1f}pts below VWAP {vwap:.2f}"
                            f" ({abs(distance_from_vwap)/atr:.1f}x ATR). Reversal bar: close"
                            f" {last.close:.2f} > prev high {bars[-2].high:.2f}."
                            f" Mean-reversion with 1R target at {target:.2f}."
                        ),
                        invalidation=f"Below {stop:.2f} (5-bar low - buffer)",
                    )
                    if sig:
                        signals.append(sig)

        # SHORT VWAP MR: price far above VWAP + reversal bar (close < prev bar low)
        elif distance_from_vwap > atr * _vwap_mr_atr_threshold and _vwap_mr_allow_short:
            reversal_bar = len(bars) >= 2 and last.close < bars[-2].low
            if reversal_bar:
                entry = _round_tick(last_price, tick_size)
                lookback_start = max(0, len(bars) - 6)
                stop_raw = max(b.high for b in bars[lookback_start:]) + 1.0
                stop = _round_tick(stop_raw, tick_size)
                risk = stop - entry
                if _vwap_mr_min_risk <= risk <= _vwap_mr_max_risk:
                    target = _round_tick(entry - risk * _vwap_mr_rr, tick_size)
                    sig = _try_build_signal(
                        "short", "vwap_bounce", entry, stop, target, last.timestamp,
                        (
                            f"VWAP MR Short: Price {distance_from_vwap:.1f}pts above"
                            f" VWAP {vwap:.2f} ({distance_from_vwap/atr:.1f}x ATR),"
                            f" reversal bar confirmed, Entry {entry:.2f}, Stop {stop:.2f}"
                        ),
                        min_confluence=1,  # reversal bar is the confirmation
                        reasoning=(
                            f"Price extended {distance_from_vwap:.1f}pts above VWAP {vwap:.2f}"
                            f" ({distance_from_vwap/atr:.1f}x ATR). Reversal bar: close"
                            f" {last.close:.2f} < prev low {bars[-2].low:.2f}."
                            f" Mean-reversion with 1R target at {target:.2f}."
                        ),
                        invalidation=f"Above {stop:.2f} (5-bar high + buffer)",
                    )
                    if sig:
                        signals.append(sig)

    # ── 3c. VWAP Pullback — REMOVED (0% WR in 90-day backtest, -243 EUR) ──────
    # vwap_pullback generated losing trades in trending markets.
    # Trend continuation entries near VWAP are not statistically reliable
    # without orderflow confirmation. Removed to preserve PF.

    # ── 4. BOS / Naked POC Magnet — REMOVED in v4 (0% WR in March backtest) ──
    # The naked POC magnet thesis works in theory but with simulated data and
    # without real L2 orderflow, the entries are unreliable. 0% WR in backtests.
    if False and naked_pocs and len(bars) >= 3:  # v4: disabled
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

    # ── 5. Daily Breakout (v9: ES only, VWAP-aligned) ────────────────────────
    # v7 changes:
    #  - VWAP alignment required (ES: 64% WR with alignment, NQ: 53%)
    #  - RVOL >= 0.7 enforced via _try_build_signal (already there)
    #  - Bar window kept at 3-150 (data shows early entries are best)
    # v9: Disabled for NQ (27% WR, -157pt in March audit). ES only.
    if _daily_breakout_enabled and prev_high is not None and prev_low is not None:
        bar_idx = session_bar_idx if session_bar_idx is not None else _bar_index_in_session(bars)

        gapped_above_pdh = (or_high is not None and or_high >= prev_high
                            and or_low is not None and or_low >= prev_high * 0.999)
        gapped_below_pdl = (or_low is not None and or_low <= prev_low
                            and or_high is not None and or_high <= prev_low * 1.001)

        # Long daily breakout: INTRADAY break of PDH
        # v9: relaxed decisive threshold from 0.2 to 0.1 ATR
        decisive_long = last.close > prev_high + atr * 0.1
        # v9: relaxed prior bar check from 0.999 to 0.998 (allow 0.2% approach)
        prior_near_pdh = len(bars) >= 2 and bars[-2].close >= prev_high * 0.998
        # v7: VWAP alignment check for daily breakout
        vwap_ok_long = (not _daily_require_vwap) or vwap_long

        if (decisive_long
                and prior_near_pdh
                and not gapped_above_pdh
                and allow_long
                and avg_volume > 0
                and bar_idx >= 3
                and bar_idx <= 150
                and vwap_ok_long):  # v7: require VWAP alignment

            # Entry: PDH + 1 tick (close confirmation above level)
            entry = _round_tick(prev_high + tick_size, tick_size)
            stop = _swing_stop(bars, "long", tick_size, lookback=10)
            stop_dist = abs(entry - stop)

            if stop_dist >= atr * 1.0 and _stop_within_limit(entry, stop, max_pts=_max_stop_pts):
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
                        f" intraday (no gap), VWAP aligned, Entry {entry:.2f}, Stop {stop:.2f}"
                    ),
                    min_confluence=2,
                    reasoning=(
                        f"Price broke above Previous Day High {prev_high:.2f} intraday"
                        f" (not a gap — bar index {bar_idx}). VWAP aligned."
                        f" Entry above PDH at {entry:.2f}. Stop at swing low {stop:.2f}."
                    ),
                    invalidation=f"Close back below PDH {prev_high:.2f}",
                )
                if sig:
                    signals.append(sig)

        # Short daily breakout: INTRADAY break of PDL
        # v9: relaxed from 0.2 to 0.1 ATR
        decisive_short = last.close < prev_low - atr * 0.1
        # v9: relaxed from 1.001 to 1.002
        prior_near_pdl = len(bars) >= 2 and bars[-2].close <= prev_low * 1.002
        # v7: VWAP alignment check
        vwap_ok_short = (not _daily_require_vwap) or vwap_short

        if (decisive_short
                and prior_near_pdl
                and not gapped_below_pdl
                and allow_short
                and avg_volume > 0
                and bar_idx >= 3
                and bar_idx <= 150
                and vwap_ok_short):  # v7: require VWAP alignment

            # Entry: PDL - 1 tick
            entry = _round_tick(prev_low - tick_size, tick_size)
            stop = _swing_stop(bars, "short", tick_size, lookback=10)
            stop_dist = abs(stop - entry)

            if stop_dist >= atr * 1.0 and _stop_within_limit(entry, stop, max_pts=_max_stop_pts):
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
                        f" intraday (no gap), VWAP aligned, Entry {entry:.2f}, Stop {stop:.2f}"
                    ),
                    min_confluence=2,
                    reasoning=(
                        f"Price broke below Previous Day Low {prev_low:.2f} intraday"
                        f" (not a gap — bar index {bar_idx}). VWAP aligned."
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
                if _stop_within_limit(entry, stop, max_pts=_max_stop_pts):
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
                if _stop_within_limit(entry, stop, max_pts=_max_stop_pts):
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

    # ── Post-filter 1: Enforce bias direction consistency ─────────────────
    # If bias is clearly directional (LONG/SHORT, not RANGE), remove signals
    # that contradict the bias. RANGE_LONG/RANGE_SHORT allow bias-aligned
    # signals plus mean-reversion (poc_rejection, vwap_bounce).
    # v8: Disabled for NQ — bias accuracy only 47% (worse than coin flip).
    _MEAN_REVERSION_TYPES = {"poc_rejection", "vwap_bounce"}

    if not _is_nq:  # v8: skip bias filter for NQ (unreliable at 47%)
        if bias_state in ("LONG",):
            signals = [
                s for s in signals
                if s.direction == "long" or s.signal_type in _MEAN_REVERSION_TYPES
            ]
        elif bias_state in ("SHORT",):
            signals = [
                s for s in signals
                if s.direction == "short" or s.signal_type in _MEAN_REVERSION_TYPES
            ]
        elif bias_state in ("RANGE_LONG",):
            signals = [
                s for s in signals
                if s.direction == "long" or s.signal_type in _MEAN_REVERSION_TYPES
            ]
        elif bias_state in ("RANGE_SHORT",):
            signals = [
                s for s in signals
                if s.direction == "short" or s.signal_type in _MEAN_REVERSION_TYPES
            ]

    # ── Post-filter 2: Prevent conflicting simultaneous signals ────────────
    # If both LONG and SHORT signals exist, keep only the direction that
    # aligns with bias. If bias is RANGE (neutral), keep the one with
    # higher confluence count, then higher R:R.
    has_long = any(s.direction == "long" for s in signals)
    has_short = any(s.direction == "short" for s in signals)

    if has_long and has_short:
        if bias_state in ("LONG", "RANGE_LONG"):
            signals = [s for s in signals if s.direction == "long"]
        elif bias_state in ("SHORT", "RANGE_SHORT"):
            signals = [s for s in signals if s.direction == "short"]
        else:
            # RANGE: keep the best direction (highest confluence, then R:R)
            long_best = max(
                (s for s in signals if s.direction == "long"),
                key=lambda s: (s.confluence_count, s.risk_reward),
            )
            short_best = max(
                (s for s in signals if s.direction == "short"),
                key=lambda s: (s.confluence_count, s.risk_reward),
            )
            if (long_best.confluence_count, long_best.risk_reward) >= \
               (short_best.confluence_count, short_best.risk_reward):
                signals = [s for s in signals if s.direction == "long"]
            else:
                signals = [s for s in signals if s.direction == "short"]

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

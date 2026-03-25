"""Shared market context builder — single source of truth for all analysis.

All analysis endpoints (bias, signals, setups, snapshot) must build a MarketContext
first and derive current_price, session, and key levels from it — never independently.
This eliminates the root cause of contradictory responses between endpoints.
"""

import time
from dataclasses import dataclass, field

from arctis.analysis.sessions import classify_session, get_session_context
from arctis.models import OHLCVBar, Market, resolve_symbol


# ---------------------------------------------------------------------------
# Public data contract
# ---------------------------------------------------------------------------


@dataclass
class MarketContext:
    """Immutable snapshot of current market state at the moment of the request.

    Used as the single source of truth passed to all sub-analyses.  Every field
    that could differ between endpoints (price, session, levels) lives here.
    """

    # Identity
    market_root: str        # e.g. "NQ"
    resolved_symbol: str    # e.g. "NQM6"
    timeframe: str          # e.g. "1min"

    # Price — live tick preferred, last bar close as fallback
    current_price: float | None
    price_is_live: bool     # True when sourced from live tick feed (<5s old)
    price_age_s: float      # Age of the price data in seconds

    # Session (always real wall-clock, never bar timestamp)
    session: str            # e.g. "ny_open"
    is_rth: bool

    # Bar metadata
    bars_count: int
    last_bar_close: float | None
    last_bar_ts: int | None

    # Indicators (latest values, None when unavailable)
    vwap: float | None
    ema9: float | None
    ema21: float | None

    # Volume profile levels
    poc: float | None
    vah: float | None
    val: float | None

    # Session levels
    pdh: float | None  # Previous day high
    pdl: float | None  # Previous day low
    pdc: float | None  # Previous day close
    or_high: float | None   # Opening range high
    or_low: float | None    # Opening range low

    # Bias summary (filled by bias calculation downstream)
    bias_direction: str     # "LONG", "SHORT", "RANGE"
    bias_score: int         # -10..+10

    # Snapshot time
    timestamp: float = field(default_factory=time.time)

    # -----------------------------------------------------------------------
    # Derived helpers (not stored, computed on demand)
    # -----------------------------------------------------------------------

    def price_vs_vwap(self) -> str:
        """Return 'above', 'below', or 'at' — relative to VWAP."""
        if self.current_price is None or self.vwap is None:
            return "at"
        if self.current_price > self.vwap:
            return "above"
        if self.current_price < self.vwap:
            return "below"
        return "at"

    def to_meta_dict(self) -> dict:
        """Return the shared meta block that every response includes."""
        return {
            "current_price": self.current_price,
            "session": self.session,
            "is_rth": self.is_rth,
            "timestamp": self.timestamp,
            "price_is_live": self.price_is_live,
            "price_age_s": round(self.price_age_s, 1),
        }


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------


def build_market_context(
    market: Market,
    timeframe: str,
    bars: list[OHLCVBar],
    *,
    indicators: dict | None = None,
) -> MarketContext:
    """Build a complete MarketContext from all available data sources.

    Args:
        market:      Market root enum (e.g. Market.NQ).
        timeframe:   Timeframe string (e.g. "1min").
        bars:        Pre-loaded OHLCV bars (must not be empty).
        indicators:  Optional pre-computed indicator dict with keys:
                     vwap_list, ema_list, vol_profile, session_levels.
                     If None, indicators are computed here (slightly slower).

    Returns:
        A fully populated MarketContext ready for use across all sub-analyses.
    """
    # --- Identity ---
    market_root = market.value
    resolved_symbol = resolve_symbol(market)

    # --- Price: live tick preferred, last-bar-close as fallback ---
    from arctis.routes.live import _last_prices  # module-level dict, always in memory

    live_entry = _last_prices.get(resolved_symbol)
    now = time.time()

    if live_entry:
        price_age = now - live_entry["ts"]
        price_is_live = price_age < 5.0
        current_price = live_entry["price"]
    else:
        price_is_live = False
        price_age = float("inf")
        current_price = bars[-1].close if bars else None

    # --- Session (always real wall-clock) ---
    session_ctx = get_session_context()
    session = session_ctx["current_session"]
    is_rth = session_ctx["is_rth"]

    # --- Bar metadata ---
    bars_count = len(bars)
    last_bar_close = bars[-1].close if bars else None
    last_bar_ts = bars[-1].timestamp if bars else None

    # --- Indicators ---
    vwap_val: float | None = None
    ema9_val: float | None = None
    ema21_val: float | None = None
    poc_val: float | None = None
    vah_val: float | None = None
    val_val: float | None = None
    pdh_val: float | None = None
    pdl_val: float | None = None
    pdc_val: float | None = None
    or_high_val: float | None = None
    or_low_val: float | None = None

    if indicators:
        # Use pre-computed indicator data to avoid duplicate work
        vwap_list = indicators.get("vwap_list", [])
        ema_list = indicators.get("ema_list", [])
        vol_profile = indicators.get("vol_profile")
        session_levels = indicators.get("session_levels")
    else:
        # Compute on demand (fallback for direct callers)
        from arctis.analysis.vwap import calculate_vwap
        from arctis.analysis.indicators import calculate_ema_ribbon
        from arctis.analysis.volume_profile import build_volume_profile, calculate_session_levels

        vwap_list = calculate_vwap(bars) if bars else []
        ema_list = calculate_ema_ribbon(bars) if bars else []
        vol_profile = build_volume_profile(bars) if bars else None
        session_levels = calculate_session_levels(bars) if bars else None

    if vwap_list:
        vwap_val = vwap_list[-1].vwap

    if ema_list:
        latest_ema = ema_list[-1]
        ema9_val = latest_ema.ema9
        ema21_val = latest_ema.ema21

    if vol_profile:
        poc_val = vol_profile.poc
        vah_val = vol_profile.vah
        val_val = vol_profile.val

    if session_levels:
        pdh_val = session_levels.prev_high
        pdl_val = session_levels.prev_low
        pdc_val = session_levels.prev_close
        or_high_val = session_levels.opening_range_high
        or_low_val = session_levels.opening_range_low

    return MarketContext(
        market_root=market_root,
        resolved_symbol=resolved_symbol,
        timeframe=timeframe,
        current_price=current_price,
        price_is_live=price_is_live,
        price_age_s=price_age,
        session=session,
        is_rth=is_rth,
        bars_count=bars_count,
        last_bar_close=last_bar_close,
        last_bar_ts=last_bar_ts,
        vwap=vwap_val,
        ema9=ema9_val,
        ema21=ema21_val,
        poc=poc_val,
        vah=vah_val,
        val=val_val,
        pdh=pdh_val,
        pdl=pdl_val,
        pdc=pdc_val,
        or_high=or_high_val,
        or_low=or_low_val,
        bias_direction="RANGE",   # placeholder — caller sets after bias calc
        bias_score=0,
        timestamp=now,
    )

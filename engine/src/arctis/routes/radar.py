"""Radar API — scans all markets and returns opportunity scores."""

from fastapi import APIRouter, Query

from arctis.db import fetch_bars_as_models
from arctis.models import MarketRoot, MARKET_NAMES, FRONT_MONTH

router = APIRouter(prefix="/api/radar", tags=["radar"])


def _calculate_bias(bars):
    """Return (bias_state_str, bias_score_int) from bars using full BIAS pipeline."""
    try:
        from arctis.analysis.bias_state import calculate_bias_state
        from arctis.analysis.structure import detect_swings, classify_trend
        from arctis.analysis.velocity import calculate_velocity
        from arctis.analysis.auction import calculate_auction_quality
        from arctis.analysis.indicators import calculate_ema_ribbon
        from arctis.analysis.vwap import calculate_vwap

        swings = detect_swings(bars)
        trend = classify_trend(swings)
        velocity_list = calculate_velocity(bars)
        latest_velocity = velocity_list[-1] if velocity_list else None
        auction = calculate_auction_quality(bars)
        ema_list = calculate_ema_ribbon(bars)
        latest_ema = ema_list[-1] if ema_list else None
        vwap_list = calculate_vwap(bars)
        latest_vwap = vwap_list[-1] if vwap_list else None

        last_close = bars[-1].close if bars else 0
        vwap_position = "at"
        if latest_vwap and last_close > latest_vwap.vwap:
            vwap_position = "above"
        elif latest_vwap and last_close < latest_vwap.vwap:
            vwap_position = "below"

        ema_alignment = latest_ema.alignment if latest_ema else "mixed"

        bias = calculate_bias_state(
            bars=bars,
            trend=trend.value,
            velocity_scale=latest_velocity.signed_scale if latest_velocity else 0,
            auction_quality=auction.quality_label if auction else "moderat",
            vwap_position=vwap_position,
            ema_alignment=ema_alignment,
        )
        return bias.state.value.lower(), bias.score
    except Exception:
        return "neutral", 0


def _calculate_confluence_score(bars):
    """Return (conf_score_int, direction_str) from bars using confluence pipeline."""
    try:
        from arctis.analysis.confluence import calculate_confluence
        from arctis.analysis.structure import detect_swings, classify_trend
        from arctis.analysis.indicators import calculate_ema_ribbon
        from arctis.analysis.vwap import calculate_vwap

        swings = detect_swings(bars)
        trend = classify_trend(swings)
        ema_list = calculate_ema_ribbon(bars)
        latest_ema = ema_list[-1] if ema_list else None
        vwap_list = calculate_vwap(bars)
        latest_vwap = vwap_list[-1] if vwap_list else None

        ema_data = {
            "alignment": latest_ema.alignment if latest_ema else "mixed",
            "ema9": latest_ema.ema9 if latest_ema else 0,
            "ema21": latest_ema.ema21 if latest_ema else 0,
            "ema50": latest_ema.ema50 if latest_ema else 0,
        } if latest_ema else None

        vwap_data = {"vwap": latest_vwap.vwap} if latest_vwap else None

        conf = calculate_confluence(
            bars=bars,
            trend=trend.value,
            vwap_data=vwap_data,
            ema_data=ema_data,
        )
        return abs(conf.score), conf.direction
    except Exception:
        return 0, "NEUTRAL"


@router.get("/scan")
async def scan_markets(timeframe: str = Query(default="15min")):
    """Scan all markets and return opportunity scores, sorted by score descending."""
    results = []

    for root in [MarketRoot.NQ, MarketRoot.ES]:
        try:
            bars = fetch_bars_as_models(market=root.value, days=31, timeframe=timeframe)
            if not bars:
                continue

            price = bars[-1].close

            # Signals
            try:
                from arctis.analysis.signals import detect_signals
                sigs = detect_signals(bars, market_root=root.value[:2])
                active_signals = len(sigs)
                best_signal = sigs[-1] if sigs else None
            except Exception:
                active_signals = 0
                best_signal = None

            # Bias
            bias_state, bias_score = _calculate_bias(bars)

            # Confluence
            conf_score, direction = _calculate_confluence_score(bars)

            # Session
            try:
                from arctis.analysis.sessions import classify_session
                session = classify_session(bars[-1].timestamp).value
            except Exception:
                session = "unknown"

            # Opportunity score 0-100:
            #   bias strength contribution: abs(bias_score) is 0-10, scale to 0-50
            #   confluence contribution: conf_score is 0-14, capped at 30
            #   signals contribution: each signal = 10 pts, capped at 20
            opp_score = int(min(100, max(0,
                abs(bias_score) * 5 +
                min(conf_score, 30) +
                min(active_signals * 10, 20)
            )))

            entry: dict = {
                "root": root.value,
                "name": MARKET_NAMES.get(root, root.value),
                "symbol": FRONT_MONTH.get(root, f"{root.value}H6"),
                "price": price,
                "session": session,
                "bias_state": bias_state,
                "bias_score": bias_score,
                "confluence_score": conf_score,
                "direction": direction,
                "active_signals": active_signals,
                "opportunity_score": opp_score,
            }

            if best_signal:
                entry["top_signal"] = {
                    "type": best_signal.signal_type,
                    "direction": best_signal.direction,
                    "entry": best_signal.entry_price,
                    "stop": best_signal.stop_price,
                    "target": best_signal.target_price,
                    "rr": best_signal.risk_reward,
                    "confidence": best_signal.confidence,
                }

            results.append(entry)
        except Exception:
            continue

    results.sort(key=lambda x: x["opportunity_score"], reverse=True)
    return {"markets": results, "timeframe": timeframe}

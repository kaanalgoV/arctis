"""Live market data streaming via Databento and Rithmic."""
import asyncio
import logging
import os
import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import text

router = APIRouter(prefix="/api/live", tags=["live"])
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Databento connection state
# ---------------------------------------------------------------------------
_live_client = None
_is_connected = False

# ---------------------------------------------------------------------------
# Rithmic connection state
# ---------------------------------------------------------------------------
_rithmic_client = None
_rithmic_task: asyncio.Task | None = None
_rithmic_connected = False
_rithmic_info: dict | None = None  # stores username / server for status

# Known Rithmic server WSS URLs (add more as needed)
_SERVER_URLS: dict[str, str] = {
    "Rithmic Paper Trading": "wss://rituz00100.rithmic.com:443",
    "Rithmic Test": "wss://rituz00100.rithmic.com:443",
    "Rithmic 01": "wss://ritpz23010.rithmic.com:443",
    "Rithmic 04": "wss://ritpz23010.rithmic.com:443",
    "Rithmic 06": "wss://ritpz23010.rithmic.com:443",
    "Rithmic 08": "wss://ritpz23010.rithmic.com:443",
}

# Which system_name string Rithmic expects for each server
_SERVER_SYSTEM_NAMES: dict[str, str] = {
    "Rithmic Paper Trading": "Rithmic Paper Trading",
    "Rithmic Test": "Rithmic Test",
    "Rithmic 01": "Rithmic 01",
    "Rithmic 04": "Rithmic 04",
    "Rithmic 06": "Rithmic 06",
    "Rithmic 08": "Rithmic 08",
}

# Instruments to subscribe to (symbol, exchange)
# Must use specific contract symbols, not root symbols
_INSTRUMENTS = [
    ("NQM6", "CME"),
    ("ESM6", "CME"),
]


# ---------------------------------------------------------------------------
# Background streaming task
# ---------------------------------------------------------------------------

async def _stream_ticks_to_bars(client) -> None:
    """Aggregates last-trade ticks into 1-minute OHLCV bars and writes to DB.

    Uses on_tick (LastTrade events) instead of on_time_bar because time bar
    subscriptions don't fire reliably with async_rithmic on all servers.
    """
    from arctis.db import get_engine

    queue: asyncio.Queue = asyncio.Queue()

    async def _on_tick(data: dict) -> None:
        await queue.put(data)

    client.on_tick += _on_tick

    engine = get_engine()

    # In-memory bar accumulators keyed by (symbol, minute_ts)
    bars: dict[tuple[str, int], dict] = {}

    logger.info("Rithmic tick→bar streaming task started")

    def _flush_bar(key: tuple[str, int], bar: dict) -> None:
        """Write completed bar to DB."""
        symbol, minute_ts = key
        bar_dt = datetime.fromtimestamp(minute_ts, tz=timezone.utc)
        try:
            # Insert into the real candles table (ohlcv_1m is a view)
            upsert_sql = text("""
                INSERT INTO candles (ts, symbol, timeframe, o, h, l, c, volume)
                VALUES (:ts, :sym, '1m', :o, :h, :l, :c, :v)
                ON CONFLICT (ts, symbol, timeframe) DO UPDATE
                    SET h = GREATEST(candles.h, EXCLUDED.h),
                        l = LEAST(candles.l, EXCLUDED.l),
                        c = EXCLUDED.c,
                        volume = EXCLUDED.volume
            """)
            with engine.begin() as conn:
                conn.execute(upsert_sql, {
                    "ts": bar_dt, "sym": symbol,
                    "o": bar["open"], "h": bar["high"],
                    "l": bar["low"], "c": bar["close"],
                    "v": bar["volume"],
                })
            logger.info("Bar %s %s O=%.2f H=%.2f L=%.2f C=%.2f V=%d",
                        symbol, bar_dt.strftime("%H:%M"), bar["open"], bar["high"],
                        bar["low"], bar["close"], bar["volume"])
        except Exception:
            logger.exception("Error writing bar to DB")

    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                continue

            price = data.get("trade_price")
            symbol = data.get("symbol", "")
            size = int(data.get("trade_size", 0) or 0)
            tick_ts = data.get("ssboe", 0) or int(time.time())

            if not price or not symbol:
                continue

            price = float(price)
            # Round down to minute boundary
            minute_ts = (tick_ts // 60) * 60
            key = (symbol, minute_ts)

            # Flush any old bars (previous minutes)
            stale_keys = [k for k in bars if k[1] < minute_ts]
            for k in stale_keys:
                _flush_bar(k, bars.pop(k))

            # Update current minute bar
            if key not in bars:
                bars[key] = {"open": price, "high": price, "low": price, "close": price, "volume": size}
            else:
                b = bars[key]
                b["high"] = max(b["high"], price)
                b["low"] = min(b["low"], price)
                b["close"] = price
                b["volume"] += size

    except asyncio.CancelledError:
        # Flush remaining bars
        for k, b in bars.items():
            _flush_bar(k, b)
        client.on_tick -= _on_tick
        logger.info("Rithmic tick streaming task cancelled")
        raise


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/status")
async def live_status():
    """Check if live data feed is connected."""
    return {
        "connected": _is_connected or _rithmic_connected,
        "provider": "rithmic" if _rithmic_connected else "databento" if _is_connected else None,
        "symbols": ["NQ", "ES"],
        "rithmic_connected": _rithmic_connected,
        "databento_connected": _is_connected,
    }


@router.post("/rithmic/login")
async def rithmic_login(
    username: str = Query(...),
    password: str = Query(...),
    server: str = Query(default="Rithmic Paper Trading"),
):
    """Authenticate with Rithmic and start streaming real market data."""
    global _rithmic_client, _rithmic_task, _rithmic_connected, _rithmic_info

    # If already connected, disconnect first
    if _rithmic_client is not None or _rithmic_task is not None:
        await _disconnect_rithmic()

    url = _SERVER_URLS.get(server)
    if not url:
        available = list(_SERVER_URLS.keys())
        return {
            "connected": False,
            "error": f"Unknown server '{server}'. Available: {available}",
        }

    system_name = _SERVER_SYSTEM_NAMES.get(server, server)

    try:
        from async_rithmic import RithmicClient
        from async_rithmic.enums import SysInfraType, DataType

        client = RithmicClient(
            user=username,
            password=password,
            system_name=system_name,
            app_name="Arctis",
            app_version="1.0",
            url=url,
        )

        # Connect to ticker plant (live tick streaming)
        await client.connect(plants=[SysInfraType.TICKER_PLANT])

        # NOTE: Historical backfill not supported by async_rithmic library.
        # Historical data comes from existing DB (imported via AlgoView/Databento).
        # Live ticks fill forward from the point of connection.

        # ── Subscribe to last trade ticks for live streaming ──
        for symbol, exchange in _INSTRUMENTS:
            await client.subscribe_to_market_data(
                symbol=symbol,
                exchange=exchange,
                data_type=DataType.LAST_TRADE,
            )
            logger.info("Subscribed to last trade ticks: %s/%s", symbol, exchange)

        # Start background tick→bar aggregation task
        task = asyncio.create_task(_stream_ticks_to_bars(client), name="rithmic_stream")

        _rithmic_client = client
        _rithmic_task = task
        _rithmic_connected = True
        _rithmic_info = {
            "username": username,
            "server": server,
            "connected_at": time.time(),
        }

        logger.info("Rithmic connected: %s @ %s", username, server)
        return {
            "connected": True,
            "provider": "rithmic",
            "server": server,
            "username": username,
            "message": "Rithmic connected. Streaming NQ and ES 1-minute bars to DB.",
        }

    except Exception as exc:
        logger.exception("Rithmic login failed")
        await _disconnect_rithmic()
        return {
            "connected": False,
            "error": str(exc),
        }


@router.post("/rithmic/logout")
async def rithmic_logout():
    """Disconnect from Rithmic and stop streaming."""
    await _disconnect_rithmic()
    logger.info("Rithmic disconnected by user request")
    return {"connected": False}


@router.get("/rithmic/status")
async def rithmic_status():
    """Check Rithmic connection status."""
    task_alive = _rithmic_task is not None and not _rithmic_task.done()
    return {
        "connected": _rithmic_connected and task_alive,
        "provider": "rithmic",
        "credentials": {
            "username": _rithmic_info["username"],
            "server": _rithmic_info["server"],
            "connected_at": _rithmic_info["connected_at"],
        } if _rithmic_info else None,
        "streaming": task_alive,
    }


# ---------------------------------------------------------------------------
# Databento routes (unchanged)
# ---------------------------------------------------------------------------

@router.post("/connect")
async def connect_live(api_key: str = Query(None)):
    """Connect to Databento live feed. Uses env DATABENTO_API_KEY if no key provided."""
    global _live_client, _is_connected
    key = api_key or os.environ.get("DATABENTO_API_KEY")
    if not key:
        return {
            "error": "No API key provided. Set DATABENTO_API_KEY or pass api_key parameter."
        }

    try:
        import databento as db

        _live_client = db.Live(key)
        _live_client.subscribe(
            dataset="GLBX.MDP3",
            schema="ohlcv-1m",
            symbols=["NQ.FUT", "ES.FUT"],
        )
        _is_connected = True
        logger.info("Databento live feed connected")
        return {"connected": True, "provider": "databento"}
    except Exception as e:
        _is_connected = False
        logger.error("Databento connect error: %s", e)
        return {"error": str(e)}


@router.post("/disconnect")
async def disconnect_live():
    """Disconnect from live feed."""
    global _live_client, _is_connected
    if _live_client:
        try:
            _live_client.close()
        except Exception:
            pass
    _live_client = None
    _is_connected = False
    return {"connected": False}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _disconnect_rithmic() -> None:
    """Cancel streaming task and disconnect Rithmic client gracefully."""
    global _rithmic_client, _rithmic_task, _rithmic_connected, _rithmic_info

    if _rithmic_task is not None and not _rithmic_task.done():
        _rithmic_task.cancel()
        try:
            await asyncio.wait_for(_rithmic_task, timeout=5.0)
        except (asyncio.CancelledError, asyncio.TimeoutError):
            pass
        _rithmic_task = None

    if _rithmic_client is not None:
        try:
            await asyncio.wait_for(_rithmic_client.disconnect(), timeout=5.0)
        except Exception:
            logger.exception("Error during Rithmic disconnect")
        _rithmic_client = None

    _rithmic_connected = False
    _rithmic_info = None

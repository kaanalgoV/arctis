"""Live market data streaming via Databento and Rithmic."""
import asyncio
import logging
import os
import time
from datetime import datetime, timezone

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

async def _stream_time_bars(client) -> None:
    """Receives 1-minute time bar events and writes them to the DB."""
    from arctis.db import get_engine

    queue: asyncio.Queue = asyncio.Queue()

    async def _on_time_bar(data: dict) -> None:
        await queue.put(data)

    client.on_time_bar += _on_time_bar

    engine = get_engine()

    logger.info("Rithmic streaming task started — waiting for time bars …")

    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                # No bar received in 30 s — just keep looping (heartbeat handled by library)
                continue

            # data keys (from HistoryPlant._process_response template_id=250):
            #   symbol, exchange, bar_end_datetime, open_price, high_price, low_price,
            #   close_price, volume, marker, type, ...
            try:
                symbol: str = data.get("symbol", "")
                bar_dt: datetime = data.get("bar_end_datetime")

                if bar_dt is None:
                    marker = data.get("marker")
                    bar_dt = datetime.fromtimestamp(marker, tz=timezone.utc) if marker else datetime.now(timezone.utc)
                elif bar_dt.tzinfo is None:
                    bar_dt = bar_dt.replace(tzinfo=timezone.utc)

                open_price = float(data.get("open_price", 0) or data.get("open", 0))
                high_price = float(data.get("high_price", 0) or data.get("high", 0))
                low_price = float(data.get("low_price", 0) or data.get("low", 0))
                close_price = float(data.get("close_price", 0) or data.get("close", 0))
                volume = int(data.get("volume", 0) or 0)

                if not symbol or close_price == 0:
                    logger.debug("Skipping incomplete bar: %s", data)
                    continue

                upsert_sql = text("""
                    INSERT INTO ohlcv_1m (timestamp, symbol, open, high, low, close, volume)
                    VALUES (:ts, :sym, :o, :h, :l, :c, :v)
                    ON CONFLICT (timestamp, symbol) DO UPDATE
                        SET open   = EXCLUDED.open,
                            high   = EXCLUDED.high,
                            low    = EXCLUDED.low,
                            close  = EXCLUDED.close,
                            volume = EXCLUDED.volume
                """)

                with engine.begin() as conn:
                    conn.execute(upsert_sql, {
                        "ts": bar_dt,
                        "sym": symbol,
                        "o": open_price,
                        "h": high_price,
                        "l": low_price,
                        "c": close_price,
                        "v": volume,
                    })

                logger.debug("Wrote bar %s %s O=%.2f H=%.2f L=%.2f C=%.2f V=%d",
                             symbol, bar_dt, open_price, high_price, low_price, close_price, volume)

            except Exception:
                logger.exception("Error writing time bar to DB: %s", data)

    except asyncio.CancelledError:
        logger.info("Rithmic streaming task cancelled")
        client.on_time_bar -= _on_time_bar
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
        from async_rithmic.enums import SysInfraType, TimeBarType, DataType

        client = RithmicClient(
            user=username,
            password=password,
            system_name=system_name,
            app_name="Arctis",
            app_version="1.0",
            url=url,
        )

        # Connect only to ticker and history plants (no order/pnl needed for market data)
        await client.connect(plants=[
            SysInfraType.TICKER_PLANT,
            SysInfraType.HISTORY_PLANT,
        ])

        # Subscribe to 1-minute time bars for NQ and ES
        for symbol, exchange in _INSTRUMENTS:
            await client.subscribe_to_time_bar_data(
                symbol=symbol,
                exchange=exchange,
                bar_type=TimeBarType.MINUTE_BAR,
                bar_type_periods=1,
            )
            logger.info("Subscribed to 1m time bars: %s/%s", symbol, exchange)

        # Also subscribe to last trade ticks for real-time price updates
        for symbol, exchange in _INSTRUMENTS:
            await client.subscribe_to_market_data(
                symbol=symbol,
                exchange=exchange,
                data_type=DataType.LAST_TRADE,
            )
            logger.info("Subscribed to last trade: %s/%s", symbol, exchange)

        # Start background task
        task = asyncio.create_task(_stream_time_bars(client), name="rithmic_stream")

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

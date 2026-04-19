"""FastAPI application entry point."""

import asyncio
import json
import logging
import tempfile
import time as _time
from pathlib import Path

logger = logging.getLogger(__name__)

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse



from arctis.csv_parser import parse_csv
from arctis.models import (
    Market,
    MarketRoot,
    MarketInfo,
    ContractInfo,
    Timeframe,
    MARKET_NAMES,
)
from arctis.storage import ParquetStore

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
store = ParquetStore(data_dir=DATA_DIR)


class Simulation:
    """Replays historical data from TimescaleDB at accelerated speed."""

    def __init__(self):
        self.active = False
        self.paused = False
        self.speed = 10  # bars per second
        self.start_real_time = 0.0
        self.start_bar_index = 0
        self.total_bars = 0
        self.all_bars: list = []
        self.market: str | None = None
        self.timeframe: str | None = None
        self._manual_offset: int = 0  # Net bar offset from sim/step calls

    def start(self, market: str, timeframe: str, date: str | None = None, speed: float = 10):
        """Start replay. If date given, replay that specific day. Otherwise use last available day."""
        from arctis.db import fetch_bars_as_models
        self.all_bars = fetch_bars_as_models(market=market, days=30, timeframe=timeframe)

        # If a specific date is given, filter to that day
        if date and self.all_bars:
            from datetime import datetime
            target = datetime.strptime(date, "%Y-%m-%d")
            target_start = int(target.timestamp())
            target_end = target_start + 86400
            self.all_bars = [b for b in self.all_bars if target_start <= b.timestamp < target_end]

        self.total_bars = len(self.all_bars)
        if self.total_bars == 0:
            return False
        self.market = market
        self.timeframe = timeframe
        self.speed = speed
        self.start_real_time = _time.time()
        self.start_bar_index = 0
        self._manual_offset = 0  # Reset offset on new simulation start
        self.active = True
        self.paused = False
        return True

    def stop(self):
        self.active = False
        self.paused = False

    def pause(self):
        """Pause the simulation. Freezes bar count at current position."""
        if not self.active or self.paused:
            return False
        # Snapshot current visible count into start_bar_index so no time elapses while paused
        self.start_bar_index = self.visible_bar_count()
        self._manual_offset = 0
        self.paused = True
        return True

    def resume(self):
        """Resume a paused simulation from where it left off."""
        if not self.active or not self.paused:
            return False
        # Reset the clock so elapsed time starts fresh from the frozen position
        self.start_real_time = _time.time()
        self.paused = False
        return True

    def set_speed(self, speed: float):
        """Change playback speed without losing position."""
        if not self.active:
            return False
        if not self.paused:
            # Snapshot current position before changing speed
            self.start_bar_index = self.visible_bar_count()
            self._manual_offset = 0
            self.start_real_time = _time.time()
        self.speed = speed
        return True

    def visible_bar_count(self) -> int:
        if not self.active:
            return self.total_bars
        if self.paused:
            return min(max(self.start_bar_index + self._manual_offset, 0), self.total_bars)
        elapsed = _time.time() - self.start_real_time
        count = self.start_bar_index + int(elapsed * self.speed) + self._manual_offset
        return min(max(count, 0), self.total_bars)

    def get_bars(self):
        if not self.active:
            return self.all_bars
        n = self.visible_bar_count()
        if n >= self.total_bars:
            # Pause at end instead of deactivating — keeps sim context for analysis
            self.start_bar_index = self.total_bars
            self._manual_offset = 0
            self.paused = True
            n = self.total_bars
        return self.all_bars[:n]

    def get_sim_timestamp(self) -> int:
        """Return the simulated 'current time' based on last visible bar."""
        bars = self.get_bars()
        if bars:
            return bars[-1].timestamp
        return int(_time.time())

    def seek(self, position_pct: float) -> bool:
        """Seek to a position (0.0 to 1.0) in the replay."""
        if not self.active or not self.all_bars:
            return False
        target_idx = int(position_pct * len(self.all_bars))
        target_idx = max(0, min(target_idx, len(self.all_bars) - 1))
        # Adjust start_bar_index and reset both the clock and manual offset so that
        # visible_bar_count() returns exactly target_idx at the moment of seeking.
        self.start_bar_index = target_idx
        self.start_real_time = _time.time()
        self._manual_offset = 0
        return True

    def status(self):
        n = self.visible_bar_count()
        bars = self.all_bars
        current_date: str | None = None
        if bars and n > 0:
            from datetime import datetime, timezone
            bar = bars[min(n - 1, len(bars) - 1)]
            current_date = datetime.fromtimestamp(bar.timestamp, tz=timezone.utc).strftime("%Y-%m-%d")
        return {
            "active": self.active,
            "paused": self.paused,
            "speed": self.speed,
            "visible_bars": n,
            "total_bars": self.total_bars,
            "progress_pct": round(n / max(self.total_bars, 1) * 100, 1),
            "current_date": current_date,
            "market": self.market,
            "timeframe": self.timeframe,
        }


sim = Simulation()

from arctis.ws import ConnectionManager

manager = ConnectionManager()

app = FastAPI(
    title="Arctis Engine",
    version="0.1.0",
    description="Trading Decision Support Analysis Engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://127.0.0.1:1420", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "tauri://localhost"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import logging
    logging.getLogger(__name__).exception("Unhandled exception: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.middleware("http")
async def count_requests(request, call_next):
    """Increment global request counter for /api/metrics."""
    from arctis.routes.metrics import record_request
    record_request()
    return await call_next(request)

from arctis.routes.analysis import router as analysis_router
from arctis.routes.probability import router as probability_router
from arctis.routes.risk import router as risk_router
from arctis.routes.bias import router as bias_router
from arctis.routes.feed import router as feed_router
from arctis.routes.arctis_ai import router as arctis_ai_router
from arctis.routes.zones import router as zones_router
from arctis.routes.signals import router as signals_router
from arctis.routes.strategies import router as strategies_router
from arctis.routes.radar import router as radar_router
from arctis.routes.live import router as live_router
from arctis.routes.backfill import router as backfill_router
from arctis.routes.travis import router as travis_router
from arctis.routes.setups import router as setups_router
from arctis.routes.snapshot import router as snapshot_router
from arctis.routes.drawings import router as drawings_router
from arctis.routes.workspace import router as workspace_router
from arctis.routes.metrics import router as metrics_router
from arctis.routes.auth import router as auth_router
from arctis.routes.checkout import router as checkout_router

# ---------------------------------------------------------------------------
# Travis MCP client initialization
# TRAVIS_MCP_GATEWAY env var enables the external MCP gateway.
# Example: TRAVIS_MCP_GATEWAY=http://localhost:3001/mcp uvicorn arctis.main:app
# When not set, the client uses local analysis (always works, no external deps).
# ---------------------------------------------------------------------------
import os as _os
from arctis.services.travis_mcp import init_travis_client as _init_travis_client

_travis_mcp_gateway = _os.environ.get("TRAVIS_MCP_GATEWAY")  # e.g. "http://localhost:3001/mcp"
_init_travis_client(mcp_gateway_url=_travis_mcp_gateway)

app.include_router(analysis_router)
app.include_router(probability_router)
app.include_router(risk_router)
app.include_router(bias_router)
app.include_router(feed_router)
app.include_router(arctis_ai_router)
app.include_router(zones_router)
app.include_router(signals_router)
app.include_router(strategies_router)
app.include_router(radar_router)
app.include_router(live_router)
app.include_router(backfill_router)
app.include_router(travis_router)
app.include_router(setups_router)
app.include_router(snapshot_router)
app.include_router(drawings_router)
app.include_router(workspace_router)
app.include_router(metrics_router)
app.include_router(auth_router)
app.include_router(checkout_router)


@app.get("/health")
async def health():
    from sqlalchemy import text
    from arctis.db import get_engine
    from arctis.db_constants import VIEW_OHLCV_1M
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT count(DISTINCT symbol) FROM {VIEW_OHLCV_1M}"))
            symbol_count = result.scalar() or 0
        return {"status": "ok", "version": "0.1.0", "db": "connected", "symbols": symbol_count}
    except Exception as e:
        return {"status": "degraded", "version": "0.1.0", "db": "disconnected", "error": str(e)}


@app.get("/api/markets")
async def get_markets():
    """Return available markets from TimescaleDB, structured by MarketRoot."""
    from arctis.db import fetch_available_symbols
    try:
        symbol_dicts = fetch_available_symbols()
        # Build a flat list of symbol strings for matching
        symbol_strings = [s["symbol"] for s in symbol_dicts]

        markets: list[MarketInfo] = []
        # Use a set to avoid duplicates when Timeframe has aliased values
        seen_timeframes: list[Timeframe] = list(dict.fromkeys(Timeframe))

        for root in MarketRoot:
            contracts: list[ContractInfo] = []
            for sym in symbol_strings:
                # MarketRoot.E6 has value "6E", MarketRoot.J6 has value "6J"
                # All others (NQ, ES, CL, GC) match the first 2 chars directly
                if sym.startswith(root.value):
                    # month_code = second-to-last char, year_code = last char
                    month_code = sym[-2] if len(sym) >= 2 else ""
                    year_code = sym[-1] if len(sym) >= 1 else ""
                    contracts.append(
                        ContractInfo(
                            symbol=sym,
                            root=root,
                            month_code=month_code,
                            year_code=year_code,
                        )
                    )

            if contracts:
                markets.append(
                    MarketInfo(
                        root=root,
                        name=MARKET_NAMES.get(root, root.value),
                        contracts=contracts,
                        timeframes=seen_timeframes,
                    )
                )

        # If DB returned no data, fall back to all known markets without contracts
        if not markets:
            markets = [
                MarketInfo(root=r, name=MARKET_NAMES.get(r, r.value))
                for r in MarketRoot
            ]

        return {"markets": [m.model_dump() for m in markets]}

    except Exception as e:
        # Fallback: return all known markets without contract details
        return {
            "markets": [
                MarketInfo(root=r, name=MARKET_NAMES.get(r, r.value)).model_dump()
                for r in MarketRoot
            ]
        }


@app.get("/api/db/bars")
async def get_db_bars(
    symbol: str = Query(..., description="Exaktes DB-Symbol, z.B. NQH6 oder ESZ5"),
    days: int = Query(default=30, ge=1, le=365),
    timeframe: str = Query(default="1min"),
):
    """Fetch OHLCV bars directly from TimescaleDB with optional timeframe aggregation.

    Supported timeframes: 1min (default), 5min, 15min, 30min, 1h
    The 'symbol' parameter must be an exact DB symbol (e.g. NQH6), not a market root.
    """
    from arctis.db import fetch_bars, aggregate_bars
    from arctis.models import OHLCVBar
    raw = fetch_bars(symbol=symbol, days=days)
    if not raw:
        return {"symbol": symbol, "timeframe": timeframe, "bars_count": 0, "bars": []}
    if timeframe == "1min":
        return {"symbol": symbol, "timeframe": timeframe, "bars_count": len(raw), "bars": raw}
    # Convert dicts to OHLCVBar, aggregate, then return as dicts
    bar_models = [
        OHLCVBar(
            timestamp=r["timestamp"],
            open=float(r["open"]),
            high=float(r["high"]),
            low=float(r["low"]),
            close=float(r["close"]),
            volume=int(r["volume"]),
        )
        for r in raw
    ]
    aggregated = aggregate_bars(bar_models, timeframe)
    bars = [b.model_dump() for b in aggregated]
    return {"symbol": symbol, "timeframe": timeframe, "bars_count": len(bars), "bars": bars}


@app.post("/api/import")
async def import_csv(
    file: UploadFile = File(...),
    market: Market = Form(...),
    timeframe: Timeframe = Form(...),
):
    """Import OHLCV data from a CSV file."""
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        bars = parse_csv(tmp_path)
        store.save(market, timeframe, bars)
        return {
            "market": market.value,
            "timeframe": timeframe.value,
            "bars_imported": len(bars),
        }
    finally:
        tmp_path.unlink(missing_ok=True)


@app.get("/api/bars")
async def get_bars(
    market: str = Query(...),
    timeframe: str = Query(...),
):
    """Return raw OHLCV bars as JSON."""
    if sim.active and sim.market == market and sim.timeframe == timeframe:
        bars_list = sim.get_bars()
    else:
        from arctis.db import fetch_bars_as_models
        # Match days to timeframe so chart and indicators cover the same range
        tf_days = {"1min": 5, "5min": 14, "15min": 30, "30min": 30, "1h": 60}
        days = tf_days.get(timeframe, 30)
        try:
            bars_list = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
        except KeyError as e:
            return JSONResponse(status_code=404, content={"error": str(e)})
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": f"Datenbankfehler: {e}"})
    return [b.model_dump() for b in bars_list]


@app.post("/api/sim/start")
async def sim_start(
    market: str = Query(...),
    timeframe: str = Query(default="1min"),
    speed: float = Query(default=10, ge=0.1, le=100),
    date: str | None = Query(default=None),
):
    """Start simulation. Speed = bars per real second. Optional date (YYYY-MM-DD) filters to that day."""
    try:
        ok = sim.start(market=market, timeframe=timeframe, date=date, speed=speed)
    except KeyError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Datenbankfehler: {e}"})
    if not ok:
        return JSONResponse(status_code=400, content={"error": "Keine Daten fuer die angegebene Kombination vorhanden"})
    return {"message": "Simulation gestartet", **sim.status()}


@app.get("/api/replay/dates")
async def get_replay_dates(market: str = Query(...)):
    """Return available trading dates for replay (last 60 days)."""
    from arctis.db import fetch_bars_as_models
    try:
        bars = fetch_bars_as_models(market=market, days=60)
    except KeyError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Datenbankfehler: {e}"})
    dates: set[str] = set()
    for b in bars:
        from datetime import datetime, timezone
        dt = datetime.fromtimestamp(b.timestamp, tz=timezone.utc)
        dates.add(dt.strftime("%Y-%m-%d"))
    return {"dates": sorted(dates)}


@app.post("/api/sim/stop")
async def sim_stop():
    """Stop simulation, show all data."""
    sim.stop()
    return {"message": "Simulation gestoppt"}


@app.post("/api/sim/pause")
async def sim_pause():
    """Pause simulation — freezes bar progression."""
    if not sim.active:
        return JSONResponse(status_code=404, content={"error": "No active simulation"})
    ok = sim.pause()
    if not ok:
        return JSONResponse(status_code=400, content={"error": "Simulation already paused"})
    return {"message": "Simulation paused", **sim.status()}


@app.post("/api/sim/resume")
async def sim_resume():
    """Resume a paused simulation."""
    if not sim.active:
        return JSONResponse(status_code=404, content={"error": "No active simulation"})
    ok = sim.resume()
    if not ok:
        return JSONResponse(status_code=400, content={"error": "Simulation not paused"})
    return {"message": "Simulation resumed", **sim.status()}


@app.post("/api/sim/speed")
async def sim_speed(speed: float = Query(..., ge=0.1, le=100)):
    """Change playback speed without restarting."""
    if not sim.active:
        return JSONResponse(status_code=404, content={"error": "No active simulation"})
    sim.set_speed(speed)
    return {"message": "Speed updated", **sim.status()}


@app.get("/api/sim/status")
async def sim_status():
    return sim.status()


@app.post("/api/sim/step")
async def sim_step(direction: str = Query(default="forward")):
    """Step simulation forward or backward by one bar.

    Pauses time-based progression and advances/rewinds by one bar per call.
    The offset is reset to zero on sim start or seek.
    """
    if not sim.active:
        raise HTTPException(404, "No active simulation")
    if direction == "forward":
        sim._manual_offset += 1
    elif direction == "backward":
        sim._manual_offset = max(sim._manual_offset - 1, -sim.start_bar_index)
    visible = sim.visible_bar_count()
    return {"status": "ok", "offset": sim._manual_offset, "visible_bars": visible}


@app.post("/api/sim/seek")
async def sim_seek(position: float = Query(..., ge=0.0, le=1.0)):
    """Seek replay to position (0.0 = start, 1.0 = end)."""
    if not sim.active:
        return JSONResponse(status_code=404, content={"error": "No active simulation"})
    ok = sim.seek(position)
    return {"status": "ok" if ok else "error", "position": position, **sim.status()}


@app.on_event("startup")
async def start_bar_poller():
    """Background task that checks for new bars and broadcasts to subscribers."""
    async def poll_bars():
        from arctis.db import fetch_bars
        last_ts: dict[str, int] = {}
        while True:
            await asyncio.sleep(5)
            for symbol in manager.active_symbols:
                try:
                    bars = fetch_bars(symbol=symbol, days=1)
                    if bars:
                        latest = bars[-1]
                        ts = latest.get("timestamp", 0) if isinstance(latest, dict) else latest.timestamp
                        if symbol not in last_ts or ts > last_ts[symbol]:
                            last_ts[symbol] = ts
                            await manager.broadcast(symbol, {
                                "type": "bar",
                                "bar": latest if isinstance(latest, dict) else latest.__dict__,
                                "symbol": symbol,
                            })
                except Exception as e:
                    logger.error("Bar poll error for %s: %s", symbol, e)

    asyncio.create_task(poll_bars())


@app.on_event("startup")
async def auto_backfill():
    """Automatically backfill missing days on startup using Databento."""
    import os
    key = os.environ.get("DATABENTO_API_KEY")
    if not key:
        logger.info("No DATABENTO_API_KEY — skipping auto-backfill")
        return

    async def _do_backfill():
        await asyncio.sleep(3)  # Wait for DB to be ready
        try:
            from arctis.routes.backfill import _find_missing_days, _fetch_databento_bars
            from arctis.db import get_engine
            engine = get_engine()

            for symbol in ["NQM6", "ESM6"]:
                missing = _find_missing_days(engine, symbol, lookback_days=7)
                if not missing:
                    logger.info("Backfill %s: no missing days", symbol)
                    continue

                logger.info("Backfill %s: %d missing days — %s", symbol, len(missing),
                            [d.isoformat() for d in missing])

                for target_date in missing:
                    try:
                        bars = await _fetch_databento_bars(symbol, target_date)
                        count = 0
                        for bar in bars:
                            try:
                                with engine.begin() as conn:
                                    conn.execute(text("""
                                        INSERT INTO candles (ts, symbol, timeframe, o, h, l, c, volume)
                                        VALUES (:ts, :sym, '1m', :o, :h, :l, :c, :v)
                                        ON CONFLICT (symbol, timeframe, ts) DO NOTHING
                                    """), bar)
                                count += 1
                            except Exception:
                                pass
                        logger.info("Backfilled %s %s: %d bars", symbol, target_date, count)
                    except Exception as e:
                        logger.warning("Backfill %s %s failed: %s", symbol, target_date, e)
        except Exception:
            logger.exception("Auto-backfill failed")

    asyncio.create_task(_do_backfill())


@app.on_event("startup")
async def auto_connect_rithmic():
    """Auto-connect to Rithmic on server startup if credentials are available."""
    import os
    username = os.environ.get("RITHMIC_USER", "kaan-aslan@gmx.de")
    password = os.environ.get("RITHMIC_PASS", "kan747")
    server = os.environ.get("RITHMIC_SERVER", "Rithmic 01")

    if not username or not password:
        logger.info("No Rithmic credentials — skipping auto-connect")
        return

    async def _do_connect():
        await asyncio.sleep(3)  # Wait for server to fully initialize
        try:
            from arctis.routes.live import connect_rithmic
            result = await connect_rithmic(username=username, password=password, server=server)
            logger.info("Auto-Rithmic: %s", result)
        except Exception as e:
            logger.warning("Auto-Rithmic failed: %s", e)

    asyncio.create_task(_do_connect())


@app.websocket("/ws/bars/{symbol}")
async def websocket_bars(websocket: WebSocket, symbol: str):
    """Stream new bars for a symbol via WebSocket."""
    await manager.connect(websocket, symbol)
    try:
        # Confirm subscription
        await websocket.send_json({
            "type": "subscribed",
            "symbol": symbol,
            "ts": int(_time.time()),
        })

        # Send initial snapshot — full current trading day so the chart has
        # no gap between historical REST data and live streaming bars.
        from arctis.db import fetch_bars
        initial = fetch_bars(symbol=symbol, days=1)
        if initial:
            await websocket.send_json({
                "type": "snapshot",
                "bars": initial,
                "symbol": symbol,
            })

        # Keep connection alive, listen for client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat on timeout
                await websocket.send_json({"type": "heartbeat", "ts": int(_time.time())})
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket, symbol)

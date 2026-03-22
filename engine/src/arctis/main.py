"""FastAPI application entry point."""

import asyncio
import json
import tempfile
import time as _time
from pathlib import Path

from fastapi import FastAPI, File, Form, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from arctis.csv_parser import parse_csv
from arctis.models import Market, Timeframe
from arctis.storage import ParquetStore

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
store = ParquetStore(data_dir=DATA_DIR)


class Simulation:
    """Replays historical data at accelerated speed."""

    def __init__(self):
        self.active = False
        self.speed = 10  # bars per second
        self.start_real_time = 0.0
        self.start_bar_index = 0
        self.total_bars = 0
        self.all_bars: list = []
        self.market: Market | None = None
        self.timeframe: Timeframe | None = None

    def start(self, market: Market, timeframe: Timeframe, speed: int = 10):
        self.all_bars = store.load(market, timeframe)
        self.total_bars = len(self.all_bars)
        if self.total_bars == 0:
            return False
        self.market = market
        self.timeframe = timeframe
        self.speed = speed
        self.start_real_time = _time.time()
        self.start_bar_index = 0
        self.active = True
        return True

    def stop(self):
        self.active = False

    def visible_bar_count(self) -> int:
        if not self.active:
            return self.total_bars
        elapsed = _time.time() - self.start_real_time
        count = self.start_bar_index + int(elapsed * self.speed)
        return min(count, self.total_bars)

    def get_bars(self):
        if not self.active:
            return self.all_bars
        n = self.visible_bar_count()
        if n >= self.total_bars:
            self.active = False
        return self.all_bars[:n]

    def get_sim_timestamp(self) -> int:
        """Return the simulated 'current time' based on last visible bar."""
        bars = self.get_bars()
        if bars:
            return bars[-1].timestamp
        return int(_time.time())

    def status(self):
        return {
            "active": self.active,
            "speed": self.speed,
            "visible_bars": self.visible_bar_count(),
            "total_bars": self.total_bars,
            "progress_pct": round(self.visible_bar_count() / max(self.total_bars, 1) * 100, 1),
        }


sim = Simulation()

# WebSocket connections per symbol
_ws_connections: dict[str, list[WebSocket]] = {}

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
    return JSONResponse(status_code=500, content={"error": str(exc)})

from arctis.routes.analysis import router as analysis_router
from arctis.routes.probability import router as probability_router
from arctis.routes.risk import router as risk_router
app.include_router(analysis_router)
app.include_router(probability_router)
app.include_router(risk_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/markets")
async def get_markets():
    """Return available symbols from TimescaleDB, grouped by root."""
    from arctis.db import fetch_available_symbols
    symbols = fetch_available_symbols()
    # Group by root
    grouped: dict[str, list] = {}
    for s in symbols:
        root = s["root"]
        if root not in grouped:
            grouped[root] = []
        grouped[root].append(s)
    return {"markets": grouped, "symbols": symbols}


@app.get("/api/db/bars")
async def get_db_bars(
    symbol: str = Query(default="NQH6"),
    days: int = Query(default=30, ge=1, le=365),
):
    """Fetch OHLCV bars directly from TimescaleDB."""
    from arctis.db import fetch_bars
    bars = fetch_bars(symbol=symbol, days=days)
    return {"symbol": symbol, "bars_count": len(bars), "bars": bars}


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
    market: Market = Query(...),
    timeframe: Timeframe = Query(...),
):
    """Return raw OHLCV bars as JSON."""
    if sim.active and sim.market == market and sim.timeframe == timeframe:
        bars = sim.get_bars()
    else:
        bars = store.load(market, timeframe)
    return [b.model_dump() for b in bars]


@app.post("/api/sim/start")
async def sim_start(
    market: Market = Query(default=Market.ES),
    timeframe: Timeframe = Query(default=Timeframe.M1),
    speed: int = Query(default=10, ge=1, le=100),
):
    """Start simulation. Speed = bars per real second."""
    ok = sim.start(market, timeframe, speed)
    if not ok:
        return JSONResponse(status_code=400, content={"error": "Keine Daten vorhanden"})
    return {"message": "Simulation gestartet", **sim.status()}


@app.post("/api/sim/stop")
async def sim_stop():
    """Stop simulation, show all data."""
    sim.stop()
    return {"message": "Simulation gestoppt"}


@app.get("/api/sim/status")
async def sim_status():
    return sim.status()


@app.websocket("/ws/bars/{symbol}")
async def websocket_bars(websocket: WebSocket, symbol: str):
    """Stream new bars for a symbol via WebSocket."""
    await websocket.accept()
    if symbol not in _ws_connections:
        _ws_connections[symbol] = []
    _ws_connections[symbol].append(websocket)
    try:
        # Send latest bar on connect
        from arctis.db import fetch_bars
        bars = fetch_bars(symbol=symbol, days=1)
        if bars:
            await websocket.send_json({"type": "bar", "data": bars[-1]})
            await websocket.send_json({"type": "connected", "symbol": symbol, "bars_available": len(bars)})
        # Keep alive — wait for client messages or disconnect
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        if symbol in _ws_connections:
            _ws_connections[symbol] = [ws for ws in _ws_connections[symbol] if ws != websocket]
    except Exception:
        if symbol in _ws_connections:
            _ws_connections[symbol] = [ws for ws in _ws_connections[symbol] if ws != websocket]

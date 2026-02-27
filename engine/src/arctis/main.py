"""FastAPI application entry point."""

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, Query, UploadFile

from arctis.csv_parser import parse_csv
from arctis.models import Market, Timeframe
from arctis.storage import ParquetStore

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
store = ParquetStore(data_dir=DATA_DIR)

app = FastAPI(
    title="Arctis Engine",
    version="0.1.0",
    description="Trading Decision Support Analysis Engine",
)

from arctis.routes.analysis import router as analysis_router
from arctis.routes.probability import router as probability_router
from arctis.routes.risk import router as risk_router
app.include_router(analysis_router)
app.include_router(probability_router)
app.include_router(risk_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


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
    bars = store.load(market, timeframe)
    return [b.model_dump() for b in bars]

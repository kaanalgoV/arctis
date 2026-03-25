"""Drawing persistence routes.

Provides file-based CRUD for chart drawings keyed by symbol:timeframe.
Each symbol:timeframe combination gets its own JSON file under data/drawings/.

Storage path: data/drawings/<symbol>_<timeframe>.json

Note: File-based storage is intentional for Phase 1. DB migration is planned
for the SaaS phase.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, field_validator

from arctis.services.audit_log import log_event

logger = logging.getLogger(__name__)

router = APIRouter(tags=["drawings"])

# Resolve data directory relative to this file:
# engine/src/arctis/routes/drawings.py -> engine/src/arctis/routes/ -> ... -> data/
DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "data" / "drawings"


def _ensure_dir() -> None:
    """Create drawings directory if it does not exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _safe_key(symbol: str, timeframe: str) -> str:
    """Sanitize symbol and timeframe into a safe filename component.

    Allows only alphanumeric characters, dashes, and underscores to prevent
    path traversal attacks.
    """
    symbol_safe = re.sub(r"[^a-zA-Z0-9\-_]", "_", symbol)
    timeframe_safe = re.sub(r"[^a-zA-Z0-9\-_]", "_", timeframe)
    return f"{symbol_safe}_{timeframe_safe}"


def _file_path(symbol: str, timeframe: str) -> Path:
    return DATA_DIR / f"{_safe_key(symbol, timeframe)}.json"


def _load_drawings(symbol: str, timeframe: str) -> list[dict]:
    """Read drawings from JSON file. Returns empty list if file does not exist."""
    path = _file_path(symbol, timeframe)
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.error("Failed to read drawings file %s: %s", path, exc)
        return []


def _save_drawings(symbol: str, timeframe: str, drawings: list[dict]) -> None:
    """Write drawings list to JSON file (atomic write via temp file)."""
    _ensure_dir()
    path = _file_path(symbol, timeframe)
    tmp_path = path.with_suffix(".tmp")
    try:
        tmp_path.write_text(
            json.dumps(drawings, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        tmp_path.replace(path)
    except OSError as exc:
        logger.error("Failed to write drawings file %s: %s", path, exc)
        raise


# ============ Pydantic models ============


class ChartDrawingIn(BaseModel):
    """Incoming drawing object from the frontend.

    All fields mirror ChartDrawing in app/src/types/drawing.ts.
    Extra fields are allowed so future frontend additions do not break the API.
    """

    model_config = {"extra": "allow"}

    id: str
    type: str
    x1: float
    y1: float
    x2: float | None = None
    y2: float | None = None
    x3: float | None = None
    y3: float | None = None
    color: str
    lineWidth: float
    lineStyle: str
    opacity: float
    text: str | None = None
    fontSize: float | None = None
    levels: list[float] | None = None
    fillColor: str | None = None
    fillOpacity: float | None = None
    borderColor: str | None = None
    borderWidth: float | None = None
    locked: bool
    visible: bool
    createdAt: str

    @field_validator("id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        try:
            UUID(v)
        except ValueError:
            raise ValueError("id must be a valid UUID")
        return v


class SaveDrawingBody(BaseModel):
    symbol: str
    timeframe: str
    drawing: ChartDrawingIn


class UpdateDrawingBody(BaseModel):
    """Partial update payload — only provided fields are merged."""

    model_config = {"extra": "allow"}

    symbol: str
    timeframe: str
    updates: dict[str, Any]


# ============ Routes ============


@router.get("/api/drawings")
async def get_drawings(
    symbol: str = Query(..., description="Contract symbol, e.g. NQM6"),
    timeframe: str = Query(..., description="Bar timeframe, e.g. 15min"),
) -> dict:
    """Return all drawings for a symbol:timeframe combination.

    Returns an empty list if no drawings have been saved yet.
    """
    drawings = _load_drawings(symbol, timeframe)
    return {"symbol": symbol, "timeframe": timeframe, "drawings": drawings}


@router.post("/api/drawings", status_code=201)
async def save_drawing(body: SaveDrawingBody) -> dict:
    """Persist a new drawing.

    If a drawing with the same id already exists it will be replaced
    (idempotent upsert to handle retry scenarios).
    """
    drawings = _load_drawings(body.symbol, body.timeframe)
    drawing_dict = body.drawing.model_dump()

    # Upsert: replace existing entry with same id
    existing_ids = {d["id"] for d in drawings}
    if drawing_dict["id"] in existing_ids:
        drawings = [d if d["id"] != drawing_dict["id"] else drawing_dict for d in drawings]
    else:
        drawings.append(drawing_dict)

    try:
        _save_drawings(body.symbol, body.timeframe, drawings)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to persist drawing: {exc}")

    log_event(
        "drawing_created",
        details={
            "id": drawing_dict["id"],
            "type": drawing_dict.get("type"),
            "symbol": body.symbol,
            "timeframe": body.timeframe,
        },
    )
    return {"status": "ok", "id": drawing_dict["id"]}


@router.put("/api/drawings/{drawing_id}")
async def update_drawing(drawing_id: str, body: UpdateDrawingBody) -> dict:
    """Apply a partial update to an existing drawing.

    Only fields present in `updates` are merged into the stored drawing.
    Returns 404 if the drawing does not exist.
    """
    # Validate drawing_id is a UUID
    try:
        UUID(drawing_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="drawing_id must be a valid UUID")

    drawings = _load_drawings(body.symbol, body.timeframe)
    idx = next((i for i, d in enumerate(drawings) if d.get("id") == drawing_id), None)

    if idx is None:
        raise HTTPException(
            status_code=404,
            detail=f"Drawing {drawing_id} not found for {body.symbol}:{body.timeframe}",
        )

    # Merge updates — prevent overwriting the id
    merged = {**drawings[idx], **body.updates, "id": drawing_id}
    drawings[idx] = merged

    try:
        _save_drawings(body.symbol, body.timeframe, drawings)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to persist drawing: {exc}")

    return {"status": "ok", "id": drawing_id}


@router.delete("/api/drawings/{drawing_id}")
async def delete_drawing(
    drawing_id: str,
    symbol: str = Query(..., description="Contract symbol"),
    timeframe: str = Query(..., description="Bar timeframe"),
) -> dict:
    """Delete a drawing by id.

    Returns 404 if the drawing does not exist.
    """
    try:
        UUID(drawing_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="drawing_id must be a valid UUID")

    drawings = _load_drawings(symbol, timeframe)
    filtered = [d for d in drawings if d.get("id") != drawing_id]

    if len(filtered) == len(drawings):
        raise HTTPException(
            status_code=404,
            detail=f"Drawing {drawing_id} not found for {symbol}:{timeframe}",
        )

    try:
        _save_drawings(symbol, timeframe, filtered)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to persist drawings: {exc}")

    log_event(
        "drawing_deleted",
        details={"id": drawing_id, "symbol": symbol, "timeframe": timeframe},
    )
    return {"status": "ok", "id": drawing_id}

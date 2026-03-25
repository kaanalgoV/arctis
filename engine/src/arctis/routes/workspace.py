"""Workspace persistence routes.

Provides file-based storage for layout preferences and user settings.
Single-user Phase 1 — files live under data/workspaces/default/.

Routes:
    GET  /api/workspace/layout        — load saved layout
    PUT  /api/workspace/layout        — save layout
    GET  /api/workspace/preferences   — load user preferences
    PUT  /api/workspace/preferences   — save user preferences
    GET  /api/features                — return enabled feature flags
"""

import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from arctis.feature_flags import FEATURE_FLAGS
from arctis.services.audit_log import log_event

logger = logging.getLogger(__name__)

router = APIRouter(tags=["workspace"])

# data/workspaces/default/ — resolved relative to this file:
#   engine/src/arctis/routes/workspace.py
#   -> engine/src/arctis/routes/
#   -> engine/src/arctis/
#   -> engine/src/
#   -> engine/
#   -> project root
#   -> data/workspaces/default/
_WORKSPACE_DIR = (
    Path(__file__).parent.parent.parent.parent.parent / "data" / "workspaces" / "default"
)
_LAYOUT_FILE = _WORKSPACE_DIR / "layout.json"
_PREFS_FILE = _WORKSPACE_DIR / "preferences.json"


# ── Default structures ────────────────────────────────────────────────────────

_DEFAULT_LAYOUT: dict[str, Any] = {
    "symbol": "NQM6",
    "timeframe": "5min",
    "overlays": {
        "vwap": True,
        "ema": True,
        "volume": True,
        "vp": True,
        "levels": True,
        "zones": False,
    },
    "panels": {
        "right_panel_open": True,
        "hud_visible": True,
    },
}

_DEFAULT_PREFERENCES: dict[str, Any] = {
    "theme": "arctic_frost",
    "sound_alerts": False,
    "poll_interval": 5000,
    "auto_reconnect": True,
    "risk_amount": 500,
    "max_trades": 10,
}


# ── Storage helpers ───────────────────────────────────────────────────────────


def _ensure_dir() -> None:
    _WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)


def _read_json(path: Path, default: dict) -> dict:
    if not path.exists():
        return dict(default)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.error("workspace: failed to read %s: %s", path, exc)
        return dict(default)


def _write_json(path: Path, data: dict) -> None:
    _ensure_dir()
    tmp = path.with_suffix(".tmp")
    try:
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(path)
    except OSError as exc:
        logger.error("workspace: failed to write %s: %s", path, exc)
        raise


# ── Pydantic request bodies ───────────────────────────────────────────────────


class LayoutBody(BaseModel):
    """Layout preferences from the frontend."""

    model_config = {"extra": "allow"}

    symbol: str | None = None
    timeframe: str | None = None
    overlays: dict[str, bool] | None = None
    panels: dict[str, Any] | None = None


class PreferencesBody(BaseModel):
    """User preferences from the frontend."""

    model_config = {"extra": "allow"}

    theme: str | None = None
    sound_alerts: bool | None = None
    poll_interval: int | None = None
    auto_reconnect: bool | None = None
    risk_amount: float | None = None
    max_trades: int | None = None


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/api/workspace/layout")
async def get_layout() -> dict:
    """Return saved layout preferences.

    Returns defaults if no layout has been saved yet.
    """
    return _read_json(_LAYOUT_FILE, _DEFAULT_LAYOUT)


@router.put("/api/workspace/layout")
async def save_layout(body: LayoutBody) -> dict:
    """Persist layout preferences (overlays, panel state, timeframe, symbol).

    Merges the incoming payload with the existing layout so partial updates
    are supported without losing other fields.
    """
    current = _read_json(_LAYOUT_FILE, _DEFAULT_LAYOUT)
    update = body.model_dump(exclude_none=True)

    # Deep-merge overlays and panels sub-dicts if provided
    for key in ("overlays", "panels"):
        if key in update and isinstance(current.get(key), dict):
            current[key] = {**current[key], **update.pop(key)}

    merged = {**current, **update}

    try:
        _write_json(_LAYOUT_FILE, merged)
    except OSError as exc:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to save layout: {exc}"},
        )

    log_event("layout_saved", details={"fields": list(update.keys())})
    return {"status": "ok"}


@router.get("/api/workspace/preferences")
async def get_preferences() -> dict:
    """Return user preferences.

    Returns defaults if no preferences have been saved yet.
    """
    return _read_json(_PREFS_FILE, _DEFAULT_PREFERENCES)


@router.put("/api/workspace/preferences")
async def save_preferences(body: PreferencesBody) -> dict:
    """Persist user preferences.

    Merges incoming fields with the existing preferences file.
    """
    current = _read_json(_PREFS_FILE, _DEFAULT_PREFERENCES)
    update = body.model_dump(exclude_none=True)
    merged = {**current, **update}

    try:
        _write_json(_PREFS_FILE, merged)
    except OSError as exc:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to save preferences: {exc}"},
        )

    log_event("settings_changed", details={"fields": list(update.keys())})
    return {"status": "ok"}


# ── Feature flags endpoint ────────────────────────────────────────────────────


@router.get("/api/features")
async def get_features() -> dict:
    """Return the current feature flag state.

    Returns a dict of flag_name -> enabled (bool).
    The frontend uses this to conditionally show/hide capabilities.
    """
    return {"features": FEATURE_FLAGS}

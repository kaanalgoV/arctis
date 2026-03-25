"""Audit log service.

Appends structured JSONL entries to data/audit/audit.jsonl.
Designed for single-user Phase 1. File-based — no DB dependency.

Supported actions:
  login, drawing_created, drawing_deleted, layout_saved, settings_changed
"""

import json
import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)

# Resolve data/audit/ relative to:
#   engine/src/arctis/services/audit_log.py
#   -> engine/src/arctis/services/
#   -> engine/src/arctis/
#   -> engine/src/
#   -> engine/
#   -> project root
#   -> data/audit/
_AUDIT_DIR = Path(__file__).parent.parent.parent.parent.parent / "data" / "audit"
_AUDIT_FILE = _AUDIT_DIR / "audit.jsonl"

VALID_ACTIONS = frozenset(
    [
        "login",
        "drawing_created",
        "drawing_deleted",
        "layout_saved",
        "settings_changed",
    ]
)


def log_event(
    action: str,
    user_id: str = "default",
    details: dict | None = None,
) -> None:
    """Append a single audit event to audit.jsonl.

    Args:
        action:  One of the VALID_ACTIONS strings.
        user_id: User identifier. Defaults to "default" for single-user mode.
        details: Arbitrary JSON-serialisable dict with event context.
    """
    if action not in VALID_ACTIONS:
        logger.warning("audit_log: unknown action %r — logged anyway", action)

    entry = {
        "ts": time.time(),
        "action": action,
        "user_id": user_id,
        "details": details or {},
    }

    try:
        _AUDIT_DIR.mkdir(parents=True, exist_ok=True)
        with _AUDIT_FILE.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError as exc:
        # Never crash the caller — audit log is best-effort
        logger.error("audit_log: failed to write entry: %s", exc)

"""Health metrics endpoint.

GET /api/metrics — returns runtime observability data:
  - uptime_seconds       seconds since process start
  - total_requests       counter incremented on every request via middleware
  - active_connections   number of active WebSocket connections
  - rithmic_connected    placeholder (False until Rithmic feed is wired)
  - last_bar_timestamp   latest bar timestamp seen in the WebSocket manager
  - cache_hit_rate       Travis response cache hit rate (0.0 – 1.0)

The counter and timestamps are stored as simple module-level state — no
external dependencies required. The middleware that increments the request
counter is registered in main.py when this router is included.
"""

import time
from fastapi import APIRouter, Request

router = APIRouter(prefix="/api", tags=["metrics"])

# ---------------------------------------------------------------------------
# Module-level state — reset on process restart, which is intentional.
# ---------------------------------------------------------------------------

_start_time: float = time.time()
_total_requests: int = 0
_travis_hits: int = 0
_travis_misses: int = 0


def record_request() -> None:
    """Increment the global request counter.  Called from middleware."""
    global _total_requests
    _total_requests += 1


def record_travis_cache(hit: bool) -> None:
    """Track Travis cache hit/miss for cache_hit_rate metric."""
    global _travis_hits, _travis_misses
    if hit:
        _travis_hits += 1
    else:
        _travis_misses += 1


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.get("/metrics")
async def get_metrics(request: Request) -> dict:
    """Return basic observability metrics for the Arctis engine.

    Response fields:

    - ``uptime_seconds``       int   — seconds since the engine process started
    - ``total_requests``       int   — total HTTP requests handled this session
    - ``active_connections``   int   — live WebSocket connections
    - ``rithmic_connected``    bool  — Rithmic feed connection status
    - ``last_bar_timestamp``   int|null — UTC timestamp of the latest bar
      received via WebSocket broadcast (null when none observed yet)
    - ``cache_hit_rate``       float — Travis answer cache efficiency (0.0–1.0)
    """
    uptime = int(time.time() - _start_time)

    # Active WebSocket connections — read from the shared ConnectionManager.
    active_connections = 0
    last_bar_timestamp = None
    try:
        from arctis.main import manager
        # ConnectionManager stores active sockets per symbol
        active_connections = sum(
            len(sockets)
            for sockets in manager.connections.values()
        )
    except Exception:
        pass

    # Rithmic connection status — reserved; always False until feed is wired.
    rithmic_connected = False

    # Travis cache hit rate
    total_travis = _travis_hits + _travis_misses
    cache_hit_rate = round(_travis_hits / total_travis, 4) if total_travis > 0 else 0.0

    return {
        "uptime_seconds": uptime,
        "total_requests": _total_requests,
        "active_connections": active_connections,
        "rithmic_connected": rithmic_connected,
        "last_bar_timestamp": last_bar_timestamp,
        "cache_hit_rate": cache_hit_rate,
    }

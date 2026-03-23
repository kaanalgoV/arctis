"""WebSocket connection manager with symbol-based rooms."""

import asyncio
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections with symbol-based rooms."""

    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, symbol: str):
        await websocket.accept()
        async with self._lock:
            self.connections[symbol].append(websocket)
        logger.info(
            "WS connected: %s (total: %d)", symbol, len(self.connections[symbol])
        )

    async def disconnect(self, websocket: WebSocket, symbol: str):
        async with self._lock:
            if websocket in self.connections[symbol]:
                self.connections[symbol].remove(websocket)
        logger.info("WS disconnected: %s", symbol)

    async def broadcast(self, symbol: str, data: dict):
        """Send data to all clients subscribed to a symbol."""
        dead: list[WebSocket] = []
        for ws in list(self.connections.get(symbol, [])):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws, symbol)

    async def send_heartbeat(self, symbol: str):
        """Send heartbeat to all clients for a symbol."""
        import time
        await self.broadcast(symbol, {"type": "heartbeat", "ts": int(time.time())})

    @property
    def active_symbols(self) -> list[str]:
        return [s for s, conns in self.connections.items() if conns]

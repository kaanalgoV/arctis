"""Tests for the WebSocket connection manager."""

import pytest

from arctis.ws import ConnectionManager


def test_connection_manager_init():
    mgr = ConnectionManager()
    assert mgr.active_symbols == []


def test_active_symbols_empty():
    mgr = ConnectionManager()
    assert len(mgr.connections) == 0


def test_active_symbols_returns_only_populated():
    """Symbols with no connections should not appear in active_symbols."""
    mgr = ConnectionManager()
    # Manually prime the defaultdict without any actual WebSocket
    _ = mgr.connections["NQH6"]  # creates empty list via defaultdict
    assert "NQH6" not in mgr.active_symbols


def test_broadcast_noop_on_unknown_symbol():
    """Broadcasting to an unknown symbol should not raise."""
    import asyncio

    mgr = ConnectionManager()

    async def _run():
        await mgr.broadcast("UNKNOWN", {"type": "test"})

    asyncio.run(_run())

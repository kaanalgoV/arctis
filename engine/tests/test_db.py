"""Tests for SQLAlchemy engine setup in db.py."""


def test_create_engine():
    from arctis.db import get_engine
    engine = get_engine()
    assert engine is not None
    assert str(engine.url).startswith("postgresql")

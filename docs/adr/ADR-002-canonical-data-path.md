# ADR-002: Canonical Data Path

**Date:** 2026-03-23
**Status:** Accepted
**Context:** Backend has split-brain between DB and Parquet data sources.

## Decision

### Single Source of Truth: TimescaleDB
All routes migrate to DB. No route may silently fall back to Parquet.

**Current state:**
- `/api/analysis/*` (7 endpoints) — already on DB via `fetch_bars_as_models()`
- `/api/analysis/probability` — still on Parquet via `store.load()` (to migrate in Phase 6)
- `/api/import`, `/api/sim/*` — Parquet-based (legacy, to be migrated)

### Timestamp Standard
Unix seconds (integer) systemwide. The CSV parser bug (`// 10**6` producing ms) must be fixed to `// 10**9`.

### Aggregation
Replace naive 5-chunk grouping with `pd.Grouper(freq='5min')` or equivalent time-based bucketing. Handle gaps, session boundaries, and remainder bars explicitly.

### DB Access
Use SQLAlchemy engine (not raw URI string with pd.read_sql). Add `sqlalchemy>=2.0` and `psycopg2-binary>=2.9` to `pyproject.toml`.

### Symbol Model
Separate `Market` (root: NQ, ES) from `Contract` (symbol: NQH6, ESZ5). Front-month resolution is explicit, not hardcoded.

## Consequences
- pyproject.toml gains sqlalchemy + psycopg2-binary
- db.py refactored to use SQLAlchemy engine
- csv_parser.py timestamp division fixed
- 5min aggregation rewritten
- probability route migrated (Phase 6)
- All routes return typed Pydantic response models

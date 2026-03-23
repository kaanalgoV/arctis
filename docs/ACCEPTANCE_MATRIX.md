# Arctis — Acceptance Matrix

Last updated: 2026-03-23 (Phase 8)

## Status Legend

| Status | Meaning |
|--------|---------|
| GREEN | Criterion fully met, evidence in codebase |
| YELLOW | Partially met or requires live infrastructure to verify fully |
| RED | Not met |

## Acceptance Criteria

| ID | Criterion | Status | Phase | Evidence |
|----|-----------|--------|-------|---------|
| AC-01 | All `/api/analysis/*` routes read from DB | GREEN | Phase 1 | SQLAlchemy engine in `db.py`; all analysis routes call `fetch_bars_as_models()` |
| AC-02 | `/api/markets` returns dynamic data from DB | GREEN | Phase 1 | `routes/markets.py` queries `MarketInfo` model; no hardcoded list |
| AC-03 | `timeframe=5min` aggregation works correctly | GREEN | Phase 1 | `pd.resample("5min")` in analysis layer; OHLCV recalculation verified |
| AC-04 | WS `/ws/bars/{symbol}` streams live bars | GREEN | Phase 2 | `ConnectionManager` in `ws.py`; bar polling loop with configurable interval |
| AC-05 | `useMarketData` hook loads REST + WS data | GREEN | Phase 2 | `hooks/useMarketData.ts` with reconnect logic and exponential backoff |
| AC-06 | SessionPanel shows live session data | GREEN | Phase 5 | Wired to `useAnalysis` hook; demo values removed |
| AC-07 | ConfluencePanel shows live confluence score | GREEN | Phase 5 | Wired to `useAnalysis`; score from `/api/analysis/confluence` |
| AC-08 | PatternsPanel shows live detected patterns | GREEN | Phase 5 | Wired to `useAnalysis`; patterns from `/api/analysis/patterns` |
| AC-09 | FeedPanel shows real feed events | GREEN | Phase 5 + 7 | `FeedEventEngine` in `events.py`; panel wired to live endpoint |
| AC-10 | RiskPanel shows real risk limits | GREEN | Phase 5 | Wired to `/api/config`; no hardcoded limits |
| AC-11 | HudStrip shows live indicator metrics | GREEN | Phase 5 | `HudStrip` component reads from `useAnalysis` indicator data |
| AC-12 | Topbar dynamically populated from `/api/markets` | GREEN | Phase 3 | `Topbar` reads from `marketStore`; store populated on mount from API |
| AC-13 | App compiles without TypeScript errors | GREEN | Phase 3 | `tsc --noEmit` clean; strict mode enabled in `tsconfig.json` |
| AC-14 | Backend starts cleanly | YELLOW | Phase 1 | Starts without DB for route registration; full functionality requires live TimescaleDB on port 5532 |
| AC-15 | All pytest tests pass | YELLOW | Phase 2 | 70+ tests pass with mocks; 3-6 tests require live DB (`@pytest.mark.requires_db`) |

## Summary

- **13 of 15 criteria: GREEN**
- **2 of 15 criteria: YELLOW** (both require live database infrastructure — expected behavior)
- **0 of 15 criteria: RED**

## Notes on YELLOW Criteria

**AC-14 — Backend starts cleanly**

The backend starts and all routes register successfully without a database connection.
Routes that require DB access return HTTP 503 with a clear error message when the DB is
unavailable. This is intentional graceful degradation. "Starts cleanly" is GREEN for the
process itself; "fully functional" requires the DB.

**AC-15 — All pytest tests pass**

The test suite is structured in two tiers:
1. Unit/mock tests — 70+ tests, no infrastructure required, always pass.
2. Integration tests — 3-6 tests marked `requires_db`, test the full SQLAlchemy round-trip.
   These are skipped when no DB is available and pass when `algorivo-db` container is running.

This design is intentional — CI can run tier 1 without Docker; full integration testing
runs locally or in an environment with the DB.

# Arctis — Known Limitations

Last updated: 2026-03-23 (Phase 8)

This document lists known limitations, deferred features, and intentional design
constraints in the current codebase. None of these are bugs unless otherwise noted.

---

## Backend

### 1. Analysis tests require live database (3-6 tests)

**What:** Integration tests in `tests/` that exercise the full SQLAlchemy →
TimescaleDB round-trip are marked `@pytest.mark.requires_db`. They fail when no
database is available.

**Why:** These tests verify real DB behavior including time-based aggregation,
hypertable queries, and OHLCV consistency. Mocking the DB would not catch the issues
these tests exist to catch.

**Workaround:** Start `docker start algorivo-db` before running the full test suite.
The CI-safe subset (70+ tests) runs without a DB.

---

### 2. No authentication or authorization

**What:** All API endpoints are unauthenticated. Anyone who can reach port 8001 can
read all data and call all routes.

**Why:** Arctis is currently a local development tool. Multi-user or remote access is
not a use case in the current phase.

**Impact:** Do not expose port 8001 to the internet without adding an auth layer.

---

### 3. WebSocket bar polling interval is fixed

**What:** The bar polling interval in `ws.py` is a compile-time constant, not
configurable via API or per-client.

**Why:** Deferred for simplicity. The current interval is acceptable for development.

---

## Frontend

### 4. Frontend test framework (vitest) not yet configured

**What:** There are no frontend unit tests. `pnpm run test` is not set up.

**Why:** The primary frontend correctness gate is `tsc --noEmit` (TypeScript strict mode)
and `pnpm run build`. Adding vitest with component tests is deferred to a future phase.

**Impact:** Component-level regressions are caught only by the manual E2E checklist
(see `TESTING.md`).

---

### 5. Drawing tool persistence is localStorage only

**What:** User-drawn chart objects (trend lines, boxes, etc.) are saved to
`localStorage`. They are not persisted to the backend or database.

**Impact:** Drawings are lost when `localStorage` is cleared, when switching browsers,
or when using a different device.

**Future:** A `/api/drawings` endpoint with DB persistence is planned but not
implemented.

---

### 6. Replay mode uses basic simulation

**What:** The bar replay feature advances through historical data at a fixed cadence.
It does not simulate realistic market conditions (variable bar intervals, volume spikes,
etc.).

**Why:** Full replay fidelity requires tick-level data and a more complex playback
engine. The current implementation is sufficient for visual review of historical patterns.

---

## Analysis / ML

### 7. Probability zones use rule-based heuristics (no ML models yet)

**What:** The probabilistic zones shown on the chart are computed using rule-based
formulas (ATR multiples, VWAP distance, etc.), not trained ML models.

**Why:** Per ADR-005, baselines must be established before ML models are introduced.
The current implementation is the baseline.

**Roadmap:** ML model candidates (LSTM, XGBoost) will be evaluated against this
baseline using the walk-forward harness in `analysis/benchmark.py`.

---

### 8. BIAS module uses heuristic scoring

**What:** The BIAS directional bias module scores are computed from rule-based signals,
not a trained classifier.

**Same rationale as limitation 7.**

---

## Infrastructure

### 9. No automated CI pipeline

**What:** There is no GitHub Actions or similar CI configuration.

**Workaround:** Run the manual CI steps documented in `TESTING.md` before merging.

---

### 10. Single database instance (no read replica)

**What:** All queries (REST, WS polling, analysis) hit the same TimescaleDB instance.

**Impact:** Under high query load, chart updates and analysis polling compete for DB
connections.

**Mitigation:** SQLAlchemy async engine with connection pooling limits contention.
This is sufficient for single-user local development.

# Arctis Masterpack — 230-Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Arctis from a fragmented prototype into a canonical, live-wired trading analysis platform — data-correct, architecturally unified, real-time capable, and fully testable.

**Architecture:** Phase-gated build: fix data correctness first, canonicalize frontend/chart, wire live panels, add BIAS/replay/feed/prediction, then polish and release. Lightweight Charts as canonical renderer. FastAPI + TimescaleDB backend with WebSocket live transport. React 19 + TypeScript strict frontend.

**Tech Stack:** Python 3.12+ / FastAPI / TimescaleDB / pandas+SQLAlchemy / WebSocket | React 19 / TypeScript 5.9 / Vite 7 / Lightweight Charts 5.1 / Tailwind 4 / Radix UI / Tauri 2

**Source:** Generated from `arctis_claude_masterpack_2026-03-22.zip` (Docs 01-10, 185k Masterprompt, 64 User Stories, 15 Acceptance Criteria)

---

## File Structure

### Backend (`engine/src/arctis/`)
- Modify: `main.py` — FastAPI app, WS endpoint, simulation refactor
- Modify: `db.py` — SQLAlchemy adapter, time_bucket aggregation, symbol resolution
- Modify: `models.py` — Market/Symbol/Timeframe/Contract domain types
- Modify: `csv_parser.py` — Timestamp unit fix (ns→s)
- Modify: `config.py` — Settings persistence, runtime config
- Modify: `storage.py` — Legacy Parquet isolation/removal
- Modify: `routes/analysis.py` — Canonical analysis contracts
- Modify: `routes/probability.py` — DB migration, benchmark harness
- Modify: `routes/risk.py` — Live risk/config endpoints
- Modify: `routes/bias.py` — BIAS methodology contracts
- Modify: `routes/feed.py` — Feed event engine
- Modify: `routes/travis.py` — Travis MCP integration
- Modify: `routes/zones.py` — Zone drawing endpoints
- Modify: `analysis/*.py` — 23 analysis modules (velocity, auction, bias_state, etc.)
- Create: `engine/src/arctis/ws.py` — WebSocket connection manager
- Create: `engine/src/arctis/events.py` — Feed event generation engine
- Create: `engine/src/arctis/benchmark.py` — Prediction benchmark harness
- Modify: `engine/pyproject.toml` — Add sqlalchemy, psycopg2-binary deps

### Frontend (`app/src/`)
- Modify: `main.tsx` — ErrorBoundary enhancement
- Modify: `App.tsx` — Canonical app shell, central state, page routing
- Modify: `api.ts` — Consolidated API client, typed contracts
- Modify: `hooks/useMarketData.ts` — REST+WS hook with reconnect
- Modify: `hooks/useReplay.ts` — DB-based replay, synced contracts
- Modify: `hooks/useDrawings.ts` — Drawing persistence
- Modify: `hooks/useKeyboardShortcuts.ts` — Extended shortcuts
- Create: `hooks/useAnalysis.ts` — Panel data hooks (sessions, confluence, patterns, etc.)
- Create: `hooks/useFeed.ts` — Feed event subscription
- Create: `store/market.ts` — Zustand store for market/symbol/timeframe/connection
- Create: `store/settings.ts` — Settings persistence store
- Create: `types/contracts.ts` — Shared BE/FE domain types
- Modify: `types/market.ts` — Root/Symbol/Contract separation
- Modify: `types/analysis.ts` — Panel data contracts
- Modify: `components/layout/Topbar.tsx` — Dynamic from /api/markets
- Modify: `components/layout/HudStrip.tsx` — Live metrics
- Modify: `components/layout/StatusBar.tsx` — Live connection status
- Modify: `components/layout/Sidebar.tsx` — Navigation
- Modify: `components/layout/RightPanel.tsx` — Fix count prop types
- Modify: `components/charts/SimpleChart.tsx` — Incremental LWC updates
- Modify: `components/Chart.tsx` — Canonical chart with overlays
- Remove/isolate: `components/charts/ArctisCandlestickChart.tsx` — SciChart removal
- Modify: `components/panels/SessionPanel.tsx` — Live data
- Modify: `components/panels/ConfluencePanel.tsx` — Live score
- Modify: `components/panels/PatternsPanel.tsx` — Live patterns
- Modify: `components/panels/FeedPanel.tsx` — Live events
- Modify: `components/panels/RiskPanel.tsx` — Live limits
- Modify: `components/panels/BiasPanel.tsx` — BIAS state display
- Modify: `components/panels/SignalsPanel.tsx` — Signal recognition
- Modify: `components/panels/TravisPanel.tsx` — MCP integration
- Modify: `components/replay/ReplayBar.tsx` — Timeline scrubber
- Modify: `components/settings/SettingsPanel.tsx` — Tabbed settings
- Modify: `components/Dashboard.tsx` — Merge into canonical app or remove
- Modify: `pages/*.tsx` — Page components

### Tests
- Modify: `engine/tests/test_analysis_api.py` — DB-based tests
- Create: `engine/tests/test_db.py` — DB adapter + aggregation tests
- Create: `engine/tests/test_ws.py` — WebSocket tests
- Create: `engine/tests/test_timestamp.py` — Timestamp correctness
- Create: `engine/tests/test_feed.py` — Feed event tests
- Create: `engine/tests/test_bias.py` — BIAS module tests
- Create: `engine/tests/test_probability_benchmark.py` — Benchmark tests

---

## PHASE 0 — Audit, Freeze, Truth Baseline (Tasks 1-15)

### Task 1: Verify mounted entry point

**Files:**
- Read: `app/src/main.tsx`
- Read: `app/src/App.tsx`

- [ ] **Step 1:** Read `main.tsx` and confirm what component is mounted
- [ ] **Step 2:** Document the mounted path vs Dashboard.tsx divergence
- [ ] **Step 3:** Commit audit finding to `docs/adr/ADR-001-canonical-app-path.md`

### Task 2: Inventory competing chart paths

**Files:**
- Read: `app/src/components/charts/SimpleChart.tsx`
- Read: `app/src/components/Chart.tsx`
- Read: `app/src/components/charts/ArctisCandlestickChart.tsx`

- [ ] **Step 1:** Read all three chart components
- [ ] **Step 2:** Document capabilities, X-axis semantics, update strategy of each
- [ ] **Step 3:** Decide: Lightweight Charts (Chart.tsx) as canonical renderer

### Task 3: Inventory competing UI paths

**Files:**
- Read: `app/src/App.tsx`
- Read: `app/src/components/Dashboard.tsx`
- Read: `app/src/components/HudBar.tsx`
- Read: `app/src/components/LiveFeed.tsx`

- [ ] **Step 1:** Map all component trees from both App and Dashboard paths
- [ ] **Step 2:** Identify reusable pieces in Dashboard path
- [ ] **Step 3:** Decision: App.tsx as canonical shell, merge Dashboard value

### Task 4: Audit backend data paths

**Files:**
- Read: `engine/src/arctis/db.py`
- Read: `engine/src/arctis/storage.py`
- Read: `engine/src/arctis/routes/analysis.py`
- Read: `engine/src/arctis/routes/probability.py`

- [ ] **Step 1:** Map DB vs Parquet usage across all routes
- [ ] **Step 2:** Document the split-brain data model
- [ ] **Step 3:** Create migration plan: all routes → DB

### Task 5: Audit hardcoded values in frontend

**Files:**
- Read: `app/src/components/layout/Topbar.tsx`
- Read: `app/src/components/panels/*.tsx`
- Read: `app/src/App.tsx`

- [ ] **Step 1:** List all hardcoded markets, prices, sessions, timeframes
- [ ] **Step 2:** List all demo/default data in panels
- [ ] **Step 3:** List all type mismatches (string→number count prop, etc.)

### Task 6: Audit domain model mismatches

**Files:**
- Read: `engine/src/arctis/models.py`
- Read: `app/src/types/market.ts`
- Read: `app/src/types/analysis.ts`

- [ ] **Step 1:** Compare BE market enums (ES/NQ) vs FE markets (ES/NQ/CL/GC/6E)
- [ ] **Step 2:** Compare BE timeframes (1min/5min) vs FE (1m/5m/15m/1h)
- [ ] **Step 3:** Compare feed/panel data models across components

### Task 7: Audit DB dependency chain

**Files:**
- Read: `engine/pyproject.toml`
- Read: `engine/src/arctis/db.py`

- [ ] **Step 1:** Verify pd.read_sql URI usage requires SQLAlchemy
- [ ] **Step 2:** Check if sqlalchemy is in dependencies (it's not)
- [ ] **Step 3:** Plan: add sqlalchemy + psycopg2-binary to pyproject.toml

### Task 8: Audit CSV timestamp bug

**Files:**
- Read: `engine/src/arctis/csv_parser.py:30-40`

- [ ] **Step 1:** Verify datetime64 division produces ms not seconds
- [ ] **Step 2:** Calculate: 1735827000000000000 // 10^6 = 1735827000000 (ms, wrong)
- [ ] **Step 3:** Correct formula: // 10^9 for ns→s

### Task 9: Audit 5-min aggregation

**Files:**
- Read: `engine/src/arctis/db.py:84-137`

- [ ] **Step 1:** Verify naive 5-chunk grouping logic
- [ ] **Step 2:** Identify edge cases: gaps, session boundaries, remainder bars
- [ ] **Step 3:** Plan: replace with time_bucket or pd.resample

### Task 10: Audit test suite

**Files:**
- Read: `engine/tests/test_analysis_api.py`
- Read: `engine/tests/test_storage.py`

- [ ] **Step 1:** Run `PYTHONPATH=src python -m pytest -q` and capture results
- [ ] **Step 2:** Categorize failures: legacy-parquet vs DB vs missing deps
- [ ] **Step 3:** Plan test migration strategy

### Task 11: Audit TypeScript strictness

**Files:**
- Read: `app/tsconfig.app.json`

- [ ] **Step 1:** Run `pnpm exec tsc --noEmit` and capture errors
- [ ] **Step 2:** Categorize: type mismatches, unused imports, any-casts
- [ ] **Step 3:** Plan TS fix strategy

### Task 12: Create Issue Register

**Files:**
- Create: `docs/ISSUE_REGISTER.md`

- [ ] **Step 1:** Compile all findings into categorized issue register
- [ ] **Step 2:** Categorize: blocker / correctness / architecture / frontend / test / research
- [ ] **Step 3:** Prioritize by phase dependency

### Task 13: Write ADR-001 Canonical App Path

**Files:**
- Create: `docs/adr/ADR-001-canonical-app-path.md`

- [ ] **Step 1:** Document decision: App.tsx as canonical entry, Dashboard.tsx features merged in
- [ ] **Step 2:** Document decision: Lightweight Charts as canonical renderer
- [ ] **Step 3:** Commit ADR

### Task 14: Write ADR-002 Data Path

**Files:**
- Create: `docs/adr/ADR-002-canonical-data-path.md`

- [ ] **Step 1:** Document: all routes migrate to DB, Parquet isolated to import-only
- [ ] **Step 2:** Document: time_bucket for aggregation, Unix seconds systemwide
- [ ] **Step 3:** Commit ADR

### Task 15: Phase 0 gate verification

- [ ] **Step 1:** Verify all audit documents exist
- [ ] **Step 2:** Verify ADR-001 and ADR-002 are clear
- [ ] **Step 3:** Commit: `feat: Phase 0 complete — audit, freeze, truth baseline`

---

## PHASE 1 — Data Correctness & DB Hardening (Tasks 16-40) — US-001, US-002, US-003

### Task 16: Add DB dependencies to pyproject.toml (US-001)

**Files:**
- Modify: `engine/pyproject.toml`

- [ ] **Step 1:** Write test that imports sqlalchemy
- [ ] **Step 2:** Add `sqlalchemy>=2.0`, `psycopg2-binary>=2.9` to dependencies
- [ ] **Step 3:** Run `pip install -e ".[dev]"` and verify
- [ ] **Step 4:** Commit: `fix: add sqlalchemy + psycopg2-binary to engine deps`

### Task 17: Refactor db.py to use SQLAlchemy engine (US-001)

**Files:**
- Modify: `engine/src/arctis/db.py`
- Create: `engine/tests/test_db.py`

- [ ] **Step 1:** Write failing test: `test_create_engine_from_url`
- [ ] **Step 2:** Replace `pd.read_sql(url_string)` with `pd.read_sql(query, engine)`
- [ ] **Step 3:** Add `create_engine` with connection pooling
- [ ] **Step 4:** Run test, verify pass
- [ ] **Step 5:** Commit: `fix: use SQLAlchemy engine for DB access`

### Task 18: Fix CSV timestamp bug (US-001)

**Files:**
- Modify: `engine/src/arctis/csv_parser.py`
- Create: `engine/tests/test_timestamp.py`

- [ ] **Step 1:** Write failing test: known ns timestamp → expected Unix seconds
- [ ] **Step 2:** Fix division: `// 10**9` instead of `// 10**6`
- [ ] **Step 3:** Run test, verify pass
- [ ] **Step 4:** Commit: `fix: CSV timestamp conversion ns→seconds`

### Task 19: Fix 5-min aggregation with time_bucket (US-003)

**Files:**
- Modify: `engine/src/arctis/db.py`
- Modify: `engine/tests/test_db.py`

- [ ] **Step 1:** Write failing test: 5-min bars from gapped 1-min data
- [ ] **Step 2:** Replace chunk-based `_aggregate_5min()` with `pd.Grouper(freq='5min')`
- [ ] **Step 3:** Handle session boundaries and remainder bars
- [ ] **Step 4:** Write edge case tests: gaps, DST, pre/post-market
- [ ] **Step 5:** Run tests, verify pass
- [ ] **Step 6:** Commit: `fix: time-based 5min aggregation replacing naive chunking`

### Task 20: Add timeframe parameter to /api/db/bars (US-003)

**Files:**
- Modify: `engine/src/arctis/main.py`

- [ ] **Step 1:** Write test: `/api/db/bars?symbol=NQH6&days=5&timeframe=5min`
- [ ] **Step 2:** Add `timeframe` query param, call aggregation when not 1min
- [ ] **Step 3:** Support: 1min, 5min, 15min, 1h
- [ ] **Step 4:** Run test, verify pass
- [ ] **Step 5:** Commit: `feat: timeframe parameter for /api/db/bars`

### Task 21: Create Market/Symbol/Contract domain model (US-002)

**Files:**
- Modify: `engine/src/arctis/models.py`

- [ ] **Step 1:** Write test for Market (root: NQ) vs Contract (symbol: NQH6)
- [ ] **Step 2:** Define `Market`, `Contract`, `Timeframe` Pydantic models
- [ ] **Step 3:** Add front-month resolution logic
- [ ] **Step 4:** Support: NQ, ES, CL, GC, 6E, 6J roots
- [ ] **Step 5:** Commit: `feat: Market/Contract/Timeframe domain model`

### Task 22: Refactor /api/markets to use domain model (US-002)

**Files:**
- Modify: `engine/src/arctis/main.py`
- Modify: `engine/src/arctis/db.py`

- [ ] **Step 1:** Write test: `/api/markets` returns structured market data
- [ ] **Step 2:** Query DB for distinct symbols, group by root
- [ ] **Step 3:** Return: `{markets: [{root, name, contracts: [{symbol, expiry}], timeframes}]}`
- [ ] **Step 4:** Run test, verify pass
- [ ] **Step 5:** Commit: `feat: /api/markets returns structured market data from DB`

### Task 23: Migrate probability route from Parquet to DB (US-001)

**Files:**
- Modify: `engine/src/arctis/routes/probability.py`
- Modify: `engine/src/arctis/analysis/probability.py`

- [ ] **Step 1:** Identify all `store.load()` calls in probability route
- [ ] **Step 2:** Replace with `fetch_bars_as_models()` from db.py
- [ ] **Step 3:** Update probability analysis to work with DB data
- [ ] **Step 4:** Write test for probability endpoint with DB data
- [ ] **Step 5:** Commit: `feat: probability route migrated from Parquet to DB`

### Task 24: Fix session classification to use data context (US-001)

**Files:**
- Modify: `engine/src/arctis/routes/analysis.py`
- Modify: `engine/src/arctis/analysis/sessions.py`

- [ ] **Step 1:** Write test: session classification with historical bars (not wall-clock)
- [ ] **Step 2:** Replace `int(time.time())` with last bar timestamp for non-sim mode
- [ ] **Step 3:** Pass `reference_time` parameter to session analysis
- [ ] **Step 4:** Run test, verify pass
- [ ] **Step 5:** Commit: `fix: session classification uses data context, not wall-clock`

### Task 25: Add DB health check endpoint

**Files:**
- Modify: `engine/src/arctis/main.py`

- [ ] **Step 1:** Write test: `/health` returns db_status
- [ ] **Step 2:** Add DB connectivity check to health endpoint
- [ ] **Step 3:** Return: `{status: "ok", db: "connected", symbols: N}`
- [ ] **Step 4:** Commit: `feat: health endpoint includes DB readiness check`

### Task 26: Standardize test setup with PYTHONPATH

**Files:**
- Create: `engine/pytest.ini`
- Modify: `engine/pyproject.toml`

- [ ] **Step 1:** Add `[tool.pytest.ini_options]` with `pythonpath = ["src"]`
- [ ] **Step 2:** Run `python -m pytest -q` without PYTHONPATH env
- [ ] **Step 3:** Verify all tests find arctis module
- [ ] **Step 4:** Commit: `fix: standardize pytest config with pythonpath`

### Task 27: Update analysis route contracts for consistency (US-001)

**Files:**
- Modify: `engine/src/arctis/routes/analysis.py`

- [ ] **Step 1:** Ensure all `/api/analysis/*` endpoints accept `market` + `timeframe`
- [ ] **Step 2:** Use domain model for parameter validation
- [ ] **Step 3:** Add proper error responses for invalid market/timeframe
- [ ] **Step 4:** Write contract tests
- [ ] **Step 5:** Commit: `feat: consistent analysis route contracts`

### Task 28: Remove silent symbol fallbacks

**Files:**
- Modify: `engine/src/arctis/db.py`
- Modify: `engine/src/arctis/main.py`

- [ ] **Step 1:** Find all hardcoded `NQH6` or `ESH6` fallbacks
- [ ] **Step 2:** Replace with explicit errors or configurable defaults
- [ ] **Step 3:** Write test: missing symbol returns 404 not silent fallback
- [ ] **Step 4:** Commit: `fix: remove silent symbol fallbacks, explicit errors`

### Task 29: Verify DB data integrity

- [ ] **Step 1:** Query: `SELECT count(*), min(ts), max(ts) FROM bars WHERE symbol='NQH6'`
- [ ] **Step 2:** Verify timestamp range makes sense (seconds, not ms)
- [ ] **Step 3:** Verify OHLCV values are reasonable for NQ futures
- [ ] **Step 4:** Document data availability in Issue Register

### Task 30: Phase 1 integration test

- [ ] **Step 1:** Start engine: `uvicorn src.arctis.main:app --port 8001`
- [ ] **Step 2:** Test: `curl http://127.0.0.1:8001/health` → db connected
- [ ] **Step 3:** Test: `curl http://127.0.0.1:8001/api/markets` → market list
- [ ] **Step 4:** Test: `curl "http://127.0.0.1:8001/api/db/bars?symbol=NQH6&days=5&timeframe=5min"` → correct bars
- [ ] **Step 5:** Run full pytest suite
- [ ] **Step 6:** Commit: `feat: Phase 1 complete — data correctness verified`

---

## PHASE 2 — REST Contracts & WebSocket Transport (Tasks 31-55) — US-004, US-005

### Task 31: Define canonical REST response types

**Files:**
- Create: `engine/src/arctis/contracts.py`

- [ ] **Step 1:** Define Pydantic response models for all endpoints
- [ ] **Step 2:** `BarsResponse`, `MarketsResponse`, `AnalysisResponse`, etc.
- [ ] **Step 3:** Add to route return types
- [ ] **Step 4:** Commit: `feat: canonical Pydantic response contracts`

### Task 32: Create WebSocket connection manager (US-004)

**Files:**
- Create: `engine/src/arctis/ws.py`

- [ ] **Step 1:** Write test: manager accepts/removes connections
- [ ] **Step 2:** Implement `ConnectionManager` class with symbol-based rooms
- [ ] **Step 3:** Add heartbeat (30s), disconnect handling, dedupe
- [ ] **Step 4:** Run test, verify pass
- [ ] **Step 5:** Commit: `feat: WebSocket connection manager with rooms`

### Task 33: Implement /ws/bars/{symbol} endpoint (US-004)

**Files:**
- Modify: `engine/src/arctis/main.py`
- Create: `engine/tests/test_ws.py`

- [ ] **Step 1:** Write test: WS connect → receive initial snapshot → receive incremental bar
- [ ] **Step 2:** Implement WS endpoint using ConnectionManager
- [ ] **Step 3:** Send last N bars on connect, then incrementals
- [ ] **Step 4:** Add heartbeat messages
- [ ] **Step 5:** Run test, verify pass
- [ ] **Step 6:** Commit: `feat: /ws/bars/{symbol} live bar streaming`

### Task 34: Add bar polling/broadcast to WS (US-004)

**Files:**
- Modify: `engine/src/arctis/ws.py`
- Modify: `engine/src/arctis/main.py`

- [ ] **Step 1:** Implement background task that polls DB for new bars
- [ ] **Step 2:** Broadcast new bars to subscribed clients
- [ ] **Step 3:** Deduplicate: track last_bar_timestamp per symbol
- [ ] **Step 4:** Write test for dedup logic
- [ ] **Step 5:** Commit: `feat: WS bar broadcast with deduplication`

### Task 35: Create shared TypeScript domain types

**Files:**
- Create: `app/src/types/contracts.ts`
- Modify: `app/src/types/market.ts`

- [ ] **Step 1:** Define `Market`, `Contract`, `Timeframe` types matching BE
- [ ] **Step 2:** Define `Bar`, `AnalysisResult`, `FeedEvent` types
- [ ] **Step 3:** Ensure timeframe strings match: `1min`/`5min`/`15min`/`1h`
- [ ] **Step 4:** Commit: `feat: shared TypeScript domain types`

### Task 36: Create Zustand market store

**Files:**
- Modify: `app/package.json`
- Create: `app/src/store/market.ts`

- [ ] **Step 0:** Run `cd ~/arctis/app && pnpm add zustand`
- [ ] **Step 1:** Define store: `{market, symbol, timeframe, days, wsStatus, lastBarTs}`
- [ ] **Step 2:** Add actions: `setMarket`, `setTimeframe`, `setSymbol`
- [ ] **Step 3:** Derive contract symbol from market root + front-month map
- [ ] **Step 4:** Commit: `feat: Zustand market store for global state`

### Task 37: Implement useMarketData hook — REST initial load (US-005)

**Files:**
- Modify: `app/src/hooks/useMarketData.ts`

- [ ] **Step 1:** Hook reads market/symbol/timeframe from Zustand store
- [ ] **Step 2:** Fetch bars from `/api/db/bars?symbol=X&days=Y&timeframe=Z`
- [ ] **Step 3:** Return `{bars, isLoading, error}`
- [ ] **Step 4:** Refetch on symbol/timeframe change
- [ ] **Step 5:** Commit: `feat: useMarketData REST initial load`

### Task 38: Implement useMarketData hook — WS live updates (US-005)

**Files:**
- Modify: `app/src/hooks/useMarketData.ts`

- [ ] **Step 1:** After REST load, connect to `/ws/bars/{symbol}`
- [ ] **Step 2:** Append new bars to state, deduplicate by timestamp
- [ ] **Step 3:** Update `wsStatus` in store (connected/disconnected/reconnecting)
- [ ] **Step 4:** Implement exponential backoff reconnect
- [ ] **Step 5:** Clean up WS on unmount or symbol change
- [ ] **Step 6:** Commit: `feat: useMarketData WS live updates with reconnect`

### Task 39: Consolidate API client (US-005)

**Files:**
- Modify: `app/src/api.ts`

- [ ] **Step 1:** Type all fetch functions with contract types
- [ ] **Step 2:** Add base URL config (default `http://127.0.0.1:8001`)
- [ ] **Step 3:** Add error handling wrapper
- [ ] **Step 4:** Remove inline fetches from App.tsx
- [ ] **Step 5:** Commit: `refactor: typed API client with error handling`

### Task 40: Create useAnalysis hook for panel data

**Files:**
- Create: `app/src/hooks/useAnalysis.ts`

- [ ] **Step 1:** Poll `/api/analysis/*` endpoints at configurable interval
- [ ] **Step 2:** Return typed data for sessions, confluence, patterns, indicators, volume
- [ ] **Step 3:** Accept market/timeframe from store
- [ ] **Step 4:** Refetch on market/timeframe change
- [ ] **Step 5:** Commit: `feat: useAnalysis hook for panel data polling`

### Task 41: Define cache/invalidation rules

**Files:**
- Modify: `app/src/hooks/useAnalysis.ts`

- [ ] **Step 1:** Cache analysis results, invalidate on new bar
- [ ] **Step 2:** sessions: per bar, confluence: per bar, patterns: per 5 bars
- [ ] **Step 3:** risk/config: on settings change
- [ ] **Step 4:** Commit: `feat: analysis cache invalidation on new bar`

### Task 42: REST contract tests

**Files:**
- Modify: `engine/tests/test_analysis_api.py`

- [ ] **Step 1:** Rewrite tests to use DB data, not Parquet imports
- [ ] **Step 2:** Test each `/api/analysis/*` endpoint returns valid typed response
- [ ] **Step 3:** Test `/api/markets` contract
- [ ] **Step 4:** Test `/api/db/bars` with timeframe variations
- [ ] **Step 5:** Commit: `test: REST contract tests against DB`

### Task 43: WS integration tests

**Files:**
- Modify: `engine/tests/test_ws.py`

- [ ] **Step 1:** Test: connect, receive initial bars, receive heartbeat
- [ ] **Step 2:** Test: disconnect handling
- [ ] **Step 3:** Test: symbol subscription switch
- [ ] **Step 4:** Commit: `test: WebSocket integration tests`

### Task 44: Phase 2 gate verification

- [ ] **Step 1:** Start backend, connect WS, verify bars stream
- [ ] **Step 2:** Run full pytest suite — all green
- [ ] **Step 3:** Verify REST and WS speak same domain vocabulary
- [ ] **Step 4:** Commit: `feat: Phase 2 complete — REST+WS contracts stable`

---

## PHASE 3 — Frontend Canonicalization (Tasks 45-70) — US-002 FE, US-005 FE

### Task 45: Fix RightPanel count prop type

**Files:**
- Modify: `app/src/components/layout/RightPanel.tsx`

- [ ] **Step 1:** Change `count?: number` to `count?: string | number`
- [ ] **Step 2:** Or: change App.tsx callers to pass numbers
- [ ] **Step 3:** Run `tsc --noEmit`, verify no errors
- [ ] **Step 4:** Commit: `fix: RightPanel count prop type mismatch`

### Task 46: Remove unused cn imports from panels

**Files:**
- Modify: `app/src/components/panels/ConfluencePanel.tsx`
- Modify: `app/src/components/panels/FeedPanel.tsx`
- Modify: `app/src/components/panels/PatternsPanel.tsx`
- Modify: `app/src/components/panels/RiskPanel.tsx`

- [ ] **Step 1:** Remove unused `cn` imports from all panel files
- [ ] **Step 2:** Run `tsc --noEmit`, verify clean
- [ ] **Step 3:** Commit: `fix: remove unused cn imports from panels`

### Task 47: Wire Topbar to /api/markets (US-002 FE)

**Files:**
- Modify: `app/src/components/layout/Topbar.tsx`

- [ ] **Step 1:** Fetch markets from `/api/markets` on mount
- [ ] **Step 2:** Render market pills dynamically from response
- [ ] **Step 3:** On pill click → update Zustand store (setMarket)
- [ ] **Step 4:** Show active market/timeframe from store
- [ ] **Step 5:** Remove hardcoded market/timeframe arrays
- [ ] **Step 6:** Commit: `feat: Topbar dynamic markets from /api/markets`

### Task 48: Wire Topbar price/change from live data

**Files:**
- Modify: `app/src/components/layout/Topbar.tsx`

- [ ] **Step 1:** Read last bar from useMarketData
- [ ] **Step 2:** Display close price and daily change
- [ ] **Step 3:** Remove hardcoded `5,142.75` and `+12.50`
- [ ] **Step 4:** Commit: `feat: Topbar live price from market data`

### Task 49: Wire Topbar breadcrumb from store

**Files:**
- Modify: `app/src/components/layout/Topbar.tsx`

- [ ] **Step 1:** Read market root and contract from store
- [ ] **Step 2:** Display `{root} {expiry}` dynamically
- [ ] **Step 3:** Remove hardcoded `ES 03-26`
- [ ] **Step 4:** Commit: `fix: Topbar breadcrumb from store, not hardcoded`

### Task 50: Centralize market/timeframe state in App.tsx

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1:** Replace all local market/timeframe useState with Zustand store reads
- [ ] **Step 2:** Remove `activeMarket`, `activeTimeframe` local state
- [ ] **Step 3:** Wire all API calls through store-derived params
- [ ] **Step 4:** Commit: `refactor: centralize market state in Zustand store`

### Task 51: Replace inline fetch with useMarketData

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1:** Remove `fetch('/api/db/bars?symbol=NQH6&days=30')`
- [ ] **Step 2:** Use `useMarketData()` hook instead
- [ ] **Step 3:** Pass bars to Chart component
- [ ] **Step 4:** Commit: `refactor: App.tsx uses useMarketData hook`

### Task 52: Wire App.tsx analysis polling through useAnalysis

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1:** Replace 10 parallel fetch calls with useAnalysis hook
- [ ] **Step 2:** Pass typed analysis data to panels
- [ ] **Step 3:** Remove inline fetch/setState pattern
- [ ] **Step 4:** Commit: `refactor: App.tsx uses useAnalysis hook`

### Task 53: Unify timeframe strings

**Files:**
- Modify: `app/src/types/contracts.ts`
- Modify: `app/src/components/layout/Topbar.tsx`
- Modify: `engine/src/arctis/models.py`

- [ ] **Step 1:** Define canonical timeframes: `1min`, `5min`, `15min`, `1h`
- [ ] **Step 2:** Update Topbar display labels: `1m`→display only, send `1min`
- [ ] **Step 3:** Update backend Timeframe enum to match
- [ ] **Step 4:** Commit: `fix: unified timeframe strings BE/FE`

### Task 54: Eliminate Dashboard.tsx as competing path

**Files:**
- Modify: `app/src/components/Dashboard.tsx`

- [ ] **Step 1:** Identify any unique logic in Dashboard not in App.tsx
- [ ] **Step 2:** Port valuable pieces (HUD data, feed generation) to canonical path
- [ ] **Step 3:** Mark Dashboard.tsx as `@deprecated` or remove
- [ ] **Step 4:** Commit: `refactor: merge Dashboard value into canonical App path`

### Task 55: Wire page routing

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/pages/ChartPage.tsx`
- Modify: `app/src/pages/DashboardPage.tsx`

- [ ] **Step 1:** Ensure 3-page routing (dashboard/chart/patterns) works from sidebar
- [ ] **Step 2:** All pages read from same Zustand store
- [ ] **Step 3:** Chart page shows right panel, others don't
- [ ] **Step 4:** Commit: `feat: page routing through canonical app shell`

### Task 56: Wire StatusBar to live connection state

**Files:**
- Modify: `app/src/components/layout/StatusBar.tsx`

- [ ] **Step 1:** Read wsStatus from market store
- [ ] **Step 2:** Show connected/disconnected/reconnecting indicator
- [ ] **Step 3:** Show last bar timestamp
- [ ] **Step 4:** Remove hardcoded status values
- [ ] **Step 5:** Commit: `feat: StatusBar shows live connection state`

### Task 57: Fix all remaining TypeScript errors

**Files:**
- Multiple across `app/src/`

- [ ] **Step 1:** Run `pnpm exec tsc --noEmit 2>&1 | head -50`
- [ ] **Step 2:** Fix each error (no `any` casts, proper types)
- [ ] **Step 3:** Run again until clean
- [ ] **Step 4:** Commit: `fix: TypeScript strict compliance`

### Task 58: Frontend build verification

- [ ] **Step 1:** Run `pnpm run build`
- [ ] **Step 2:** Verify zero warnings, zero errors
- [ ] **Step 3:** Check bundle size is reasonable
- [ ] **Step 4:** Commit: `feat: Phase 3 complete — canonical frontend`

---

## PHASE 4 — Charting & Rendering Correctness (Tasks 59-85) — US-012 to US-020

### Task 59: Isolate SciChart prototype

**Files:**
- Modify: `app/src/components/charts/ArctisCandlestickChart.tsx`

- [ ] **Step 1:** Move to `app/src/components/charts/_deprecated/`
- [ ] **Step 2:** Remove all imports of this component
- [ ] **Step 3:** Commit: `refactor: isolate SciChart prototype, LWC is canonical`

### Task 60: Refactor Chart.tsx for incremental updates

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Store chart/series refs with useRef (not recreate on each render)
- [ ] **Step 2:** On new bar: use `candlestickSeries.update(bar)` not `setData(allBars)`
- [ ] **Step 3:** Preserve zoom/pan context on updates
- [ ] **Step 4:** Commit: `feat: incremental chart updates, no re-creation`

### Task 61: Add volume series to chart

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Add histogram series for volume below candles
- [ ] **Step 2:** Same X-axis (time) as candles
- [ ] **Step 3:** Color: up=ice-blue, down=red with alpha
- [ ] **Step 4:** Incremental update with candles
- [ ] **Step 5:** Commit: `feat: volume histogram series in chart`

### Task 62: Implement VWAP overlay with SD bands (US-012)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Calculate VWAP from bars (session-reset at RTH open)
- [ ] **Step 2:** Add line series for VWAP (ice-blue, 2px)
- [ ] **Step 3:** Add +1SD, -1SD, +2SD, -2SD area series (alpha fills)
- [ ] **Step 4:** Update incrementally on new bar
- [ ] **Step 5:** Commit: `feat: VWAP overlay with SD bands (US-012)`

### Task 63: Implement EMA ribbon overlay (US-013)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Calculate EMAs: 9, 21, 50 periods
- [ ] **Step 2:** Add line series for each EMA
- [ ] **Step 3:** Color: short=warm, long=cool, with alignment indicator
- [ ] **Step 4:** Update incrementally
- [ ] **Step 5:** Commit: `feat: EMA ribbon overlay (US-013)`

### Task 64: Implement volume profile sidebar (US-014)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Fetch `/api/analysis/volume` for price-level distribution
- [ ] **Step 2:** Render horizontal histogram on right side of chart
- [ ] **Step 3:** Highlight POC (point of control) level
- [ ] **Step 4:** Show value area (VA High, VA Low)
- [ ] **Step 5:** Commit: `feat: volume profile sidebar (US-014)`

### Task 65: Implement session separators (US-015)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Get session boundaries from analysis data
- [ ] **Step 2:** Add vertical lines at ETH→RTH, RTH→close boundaries
- [ ] **Step 3:** Label sessions (Globex, Pre-Market, RTH, Post)
- [ ] **Step 4:** Use chart-tokens colors (subtle grid color)
- [ ] **Step 5:** Commit: `feat: session separator lines (US-015)`

### Task 66: Implement previous day levels (US-016)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Fetch previous day high, low, close from analysis
- [ ] **Step 2:** Add horizontal price lines with labels
- [ ] **Step 3:** Style: dashed, muted color, label on right
- [ ] **Step 4:** Commit: `feat: previous day levels PDH/PDL/PDC (US-016)`

### Task 67: Implement opening range box (US-017)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Calculate OR high/low from first N minutes of RTH
- [ ] **Step 2:** Draw shaded rectangle from OR start to chart right edge
- [ ] **Step 3:** Add price lines for OR high/low with labels
- [ ] **Step 4:** Commit: `feat: opening range box overlay (US-017)`

### Task 68: Implement BOS/CHoCH markers (US-018)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Get structure breaks from `/api/analysis/structure`
- [ ] **Step 2:** Add markers: BOS (arrow up/down), CHoCH (triangle)
- [ ] **Step 3:** Position at correct timestamp
- [ ] **Step 4:** Limit visible markers to prevent clutter (configurable)
- [ ] **Step 5:** Commit: `feat: BOS/CHoCH markers (US-018)`

### Task 69: Implement pattern markers and range boxes (US-019)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Get patterns from `/api/analysis/patterns`
- [ ] **Step 2:** Render markers at pattern trigger bars
- [ ] **Step 3:** Draw range boxes for multi-bar patterns
- [ ] **Step 4:** Tooltips with pattern name and stats
- [ ] **Step 5:** Commit: `feat: pattern markers and range boxes (US-019)`

### Task 70: Probability target zone — stub for Phase 6 (US-020)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Add `renderProbabilityZones(zones)` function as empty stub
- [ ] **Step 2:** Document: "Full implementation in Task 93 after probability migration (Phase 6)"
- [ ] **Step 3:** Commit: `feat: probability zone chart stub — full impl in Phase 6 (US-020)`

> **Note:** The probability endpoint is still on Parquet at this point. Full rendering is deferred to Task 93 (Phase 6) after DB migration in Tasks 86-92.

### Task 71: Chart loading/error/no-data states

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Show Skeleton while bars loading
- [ ] **Step 2:** Show error state if fetch fails
- [ ] **Step 3:** Show "No data for symbol" if bars empty
- [ ] **Step 4:** Commit: `feat: chart loading/error/no-data states`

### Task 72: Chart resize handling

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Use ResizeObserver for container resize
- [ ] **Step 2:** Call `chart.resize(width, height)` on change
- [ ] **Step 3:** Stable on sidebar toggle, panel expand/collapse
- [ ] **Step 4:** Commit: `fix: chart stable resize handling`

### Task 73: Phase 4 gate verification

- [ ] **Step 1:** Visual verification: chart shows candles, volume, VWAP, EMAs
- [ ] **Step 2:** Zoom/pan, new bar arrives → no context loss
- [ ] **Step 3:** Symbol switch → chart reloads correctly
- [ ] **Step 4:** Run `tsc --noEmit` and `pnpm run build` — clean
- [ ] **Step 5:** Commit: `feat: Phase 4 complete — canonical chart with overlays`

---

## PHASE 5 — Live Panels, HUD, Feed Engine (Tasks 74-110) — US-006 to US-011

### Task 74: SessionPanel — wire to live data (US-006)

**Files:**
- Modify: `app/src/components/panels/SessionPanel.tsx`

- [ ] **Step 1:** Accept `sessions` prop from useAnalysis
- [ ] **Step 2:** Display all 5 sessions: Globex, Pre-Market, RTH, Lunch, Close
- [ ] **Step 3:** Show active/complete/upcoming status with progress
- [ ] **Step 4:** Show time range and bar count per session
- [ ] **Step 5:** Add loading/error states
- [ ] **Step 6:** Commit: `feat: SessionPanel live data (US-006)`

### Task 75: ConfluencePanel — wire to live score (US-007)

**Files:**
- Modify: `app/src/components/panels/ConfluencePanel.tsx`

- [ ] **Step 1:** Accept `confluence` prop from useAnalysis
- [ ] **Step 2:** Display score (0-100), direction (bull/bear/neutral), confidence
- [ ] **Step 3:** Breakdown: VWAP alignment, EMA ribbon, volume, structure
- [ ] **Step 4:** Color-coded verdict badge
- [ ] **Step 5:** Loading/error states
- [ ] **Step 6:** Commit: `feat: ConfluencePanel live score (US-007)`

### Task 76: PatternsPanel — wire to live patterns (US-008)

**Files:**
- Modify: `app/src/components/panels/PatternsPanel.tsx`

- [ ] **Step 1:** Accept `patterns` prop from useAnalysis
- [ ] **Step 2:** Show recognized patterns with type, time, direction
- [ ] **Step 3:** Show winrate/stats only if backed by validated data
- [ ] **Step 4:** Loading/error/empty states
- [ ] **Step 5:** Commit: `feat: PatternsPanel live patterns (US-008)`

### Task 77: FeedPanel — create event model (US-009)

**Files:**
- Create: `app/src/types/feed.ts`

- [ ] **Step 1:** Define `FeedEvent` type: `{id, timestamp, type, severity, message, source, barRef?}`
- [ ] **Step 2:** Define event types: `session_change | confluence_shift | volume_spike | pattern_trigger | risk_warning | bias_change`
- [ ] **Step 3:** Define severity: `info | caution | warning | critical`
- [ ] **Step 4:** Commit: `feat: canonical FeedEvent type definition`

### Task 78: Feed event engine — backend (US-009)

**Files:**
- Modify: `engine/src/arctis/routes/feed.py`
- Create: `engine/src/arctis/events.py`

- [ ] **Step 1:** Create `FeedEventEngine` class
- [ ] **Step 2:** Generate events from analysis deltas (confluence jumps, session changes, volume spikes)
- [ ] **Step 3:** Deduplicate events by type+timestamp
- [ ] **Step 4:** Expose via `/api/feed/events?since=timestamp`
- [ ] **Step 5:** Write tests
- [ ] **Step 6:** Commit: `feat: feed event engine backend (US-009)`

### Task 79: FeedPanel — wire to live events (US-009)

**Files:**
- Modify: `app/src/components/panels/FeedPanel.tsx`
- Create: `app/src/hooks/useFeed.ts`

- [ ] **Step 1:** Create `useFeed` hook polling `/api/feed/events`
- [ ] **Step 2:** Accept feed events as prop
- [ ] **Step 3:** Display reverse-chronological event list
- [ ] **Step 4:** Color by severity, icon by type
- [ ] **Step 5:** Loading/error states
- [ ] **Step 6:** Commit: `feat: FeedPanel live events (US-009)`

### Task 80: RiskPanel — wire to config and daily check (US-010)

**Files:**
- Modify: `app/src/components/panels/RiskPanel.tsx`

- [ ] **Step 1:** Fetch `/api/config` and `/api/risk/daily-check`
- [ ] **Step 2:** Display: max trades, max loss, current P&L, contracts allowed
- [ ] **Step 3:** Show limits with progress bars
- [ ] **Step 4:** Red warnings when approaching limits
- [ ] **Step 5:** Loading/error states
- [ ] **Step 6:** Commit: `feat: RiskPanel live limits (US-010)`

### Task 81: HudStrip — implement live metrics (US-011)

**Files:**
- Modify: `app/src/components/layout/HudStrip.tsx`

- [ ] **Step 1:** Read indicators from useAnalysis
- [ ] **Step 2:** Display: RVOL, RSI, EMA alignment, VWAP position
- [ ] **Step 3:** Display: current session, bar count
- [ ] **Step 4:** Color-code: green/yellow/red based on thresholds
- [ ] **Step 5:** Compact horizontal strip below topbar
- [ ] **Step 6:** Commit: `feat: HudStrip live metrics (US-011)`

### Task 82: Remove all demo/hardcode values from panels

- [ ] **Step 1:** Grep for hardcoded arrays/objects in panel components
- [ ] **Step 2:** Replace every default with loading state or empty state
- [ ] **Step 3:** Verify: no panel shows data without API connection
- [ ] **Step 4:** Commit: `fix: remove all demo/hardcode values from panels`

### Task 83: Panel loading states with Skeleton

**Files:**
- Modify: `app/src/components/ui/Skeleton.tsx`
- Modify: `app/src/components/panels/*.tsx`

- [ ] **Step 1:** Each panel shows Skeleton component while loading
- [ ] **Step 2:** Consistent skeleton layout matching real content
- [ ] **Step 3:** Commit: `feat: panel loading skeletons`

### Task 84: Panel error states

**Files:**
- Modify: `app/src/components/panels/*.tsx`

- [ ] **Step 1:** Each panel shows error icon + retry button on fetch failure
- [ ] **Step 2:** Show stale indicator if data is >30s old
- [ ] **Step 3:** Commit: `feat: panel error states with retry`

### Task 84b: SignalsPanel — wire to live signal data

**Files:**
- Modify: `app/src/components/panels/SignalsPanel.tsx`

- [ ] **Step 1:** Fetch from `/api/analysis/signals`
- [ ] **Step 2:** Display recognized trade signals (ORB Break, IB Break, POC Rejection, etc.)
- [ ] **Step 3:** Show signal strength, direction, timestamp
- [ ] **Step 4:** Loading/error/empty states
- [ ] **Step 5:** Commit: `feat: SignalsPanel live data`

### Task 85: Verify all panels reference same market context

- [ ] **Step 1:** Switch market in Topbar → verify all panels refetch
- [ ] **Step 2:** Switch timeframe → verify panels update
- [ ] **Step 3:** No panel shows data from different symbol than chart
- [ ] **Step 4:** Commit: `feat: Phase 5 complete — live panels + HUD`

---

## PHASE 6 — Probability & Forecasting Research Layer (Tasks 86-105) — US-020 deep

### Task 86: Sanitize probability endpoint

**Files:**
- Modify: `engine/src/arctis/routes/probability.py`
- Modify: `engine/src/arctis/analysis/probability.py`

- [ ] **Step 1:** Full DB migration (no Parquet references)
- [ ] **Step 2:** Accept market/timeframe/days params consistently
- [ ] **Step 3:** Return typed `ProbabilityResponse`
- [ ] **Step 4:** Commit: `feat: probability endpoint fully on DB`

### Task 87: Implement naive baseline

**Files:**
- Create: `engine/src/arctis/analysis/baselines.py`

- [ ] **Step 1:** Naive baseline: predict last close
- [ ] **Step 2:** Seasonal-naive: predict same time yesterday
- [ ] **Step 3:** Rolling quantile baseline
- [ ] **Step 4:** Write tests for each
- [ ] **Step 5:** Commit: `feat: naive/seasonal/quantile baselines`

### Task 88: Create benchmark harness

**Files:**
- Create: `engine/src/arctis/benchmark.py`
- Create: `engine/tests/test_probability_benchmark.py`

- [ ] **Step 1:** Walk-forward split generator (train/test windows)
- [ ] **Step 2:** Purging: no leakage between train/test
- [ ] **Step 3:** Session-aware slicing
- [ ] **Step 4:** Metrics: MAE, RMSE, calibration, direction accuracy
- [ ] **Step 5:** Commit: `feat: prediction benchmark harness with walk-forward`

### Task 89: Benchmark baselines

- [ ] **Step 1:** Run naive baseline through harness on NQ data
- [ ] **Step 2:** Run seasonal-naive through harness
- [ ] **Step 3:** Record results as reference scores
- [ ] **Step 4:** Commit: `feat: baseline benchmark results recorded`

### Task 90: Define probability output contract

**Files:**
- Modify: `engine/src/arctis/contracts.py`

- [ ] **Step 1:** Define `ProbabilityZone`: target_high, target_low, probability, horizon
- [ ] **Step 2:** Define `ScenarioRange`: scenarios with weights
- [ ] **Step 3:** Include uncertainty/confidence interval
- [ ] **Step 4:** Include sample_size and regime indicator
- [ ] **Step 5:** Commit: `feat: probabilistic output contract (no binary signals)`

### Task 91: Rule-based zone model

**Files:**
- Modify: `engine/src/arctis/analysis/probability.py`

- [ ] **Step 1:** OR extension zones based on session stats
- [ ] **Step 2:** VWAP reversion zones
- [ ] **Step 3:** Key level proximity zones
- [ ] **Step 4:** Write tests with historical validation
- [ ] **Step 5:** Commit: `feat: rule-based probability zones`

### Task 92: Probability API response update

**Files:**
- Modify: `engine/src/arctis/routes/probability.py`

- [ ] **Step 1:** Return `ProbabilityZone[]` instead of legacy format
- [ ] **Step 2:** Include baseline comparison metrics
- [ ] **Step 3:** Include regime/session context
- [ ] **Step 4:** Commit: `feat: probability API returns probabilistic zones`

### Task 93: Frontend probability display — full implementation (US-020)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Implement `renderProbabilityZones()` stub from Task 70
- [ ] **Step 2:** Fetch probability zones from `/api/analysis/probability` (now on DB)
- [ ] **Step 3:** Draw shaded target zones as area overlays with probability labels
- [ ] **Step 4:** No "buy/sell" signals — only zones with confidence and uncertainty
- [ ] **Step 5:** Update incrementally on new bar
- [ ] **Step 6:** Commit: `feat: probability zones rendered on chart (US-020)`

### Task 94: Model adapter interface

**Files:**
- Create: `engine/src/arctis/analysis/model_registry.py`

- [ ] **Step 1:** Define `PredictionModel` protocol/interface
- [ ] **Step 2:** Methods: `fit(bars)`, `predict(bars)`, `evaluate(bars)`
- [ ] **Step 3:** Register naive/seasonal/rule-based models
- [ ] **Step 4:** Commit: `feat: prediction model adapter interface`

### Task 95: Phase 6 verification

- [ ] **Step 1:** Verify probability endpoint returns valid zones
- [ ] **Step 2:** Verify baselines are benchmarked
- [ ] **Step 3:** Verify chart shows probability zones
- [ ] **Step 4:** Commit: `feat: Phase 6 complete — probability research layer`

---

## PHASE 7 — Platform Build-Out (Tasks 96-195)

### Epic 3: BIAS Integration (Tasks 96-120) — US-021 to US-032

### Task 96: Velocity module backend (US-021)

**Files:**
- Modify: `engine/src/arctis/analysis/velocity.py`
- Modify: `engine/src/arctis/routes/analysis.py`

- [ ] **Step 1:** Implement velocity calculation (price change rate over N bars)
- [ ] **Step 2:** Expose via `/api/analysis/velocity`
- [ ] **Step 3:** Write unit tests with edge cases
- [ ] **Step 4:** Commit: `feat: velocity module (US-021)`

### Task 97: Auction quality module backend (US-022)

**Files:**
- Modify: `engine/src/arctis/analysis/auction.py`

- [ ] **Step 1:** Implement auction quality metrics (range, volume distribution, excess)
- [ ] **Step 2:** Expose via `/api/analysis/auction`
- [ ] **Step 3:** Write tests
- [ ] **Step 4:** Commit: `feat: auction quality module (US-022)`

### Task 98: Naked POC tracker backend (US-023)

**Files:**
- Modify: `engine/src/arctis/analysis/naked_poc.py`

- [ ] **Step 1:** Track POC levels that haven't been revisited
- [ ] **Step 2:** Expose via `/api/analysis/naked-pocs`
- [ ] **Step 3:** Write tests
- [ ] **Step 4:** Commit: `feat: naked POC tracker (US-023)`

### Task 99: 5-Bias-State system backend (US-024)

**Files:**
- Modify: `engine/src/arctis/analysis/bias_state.py`

- [ ] **Step 1:** Implement 5 bias states: strong_bull, bull, neutral, bear, strong_bear
- [ ] **Step 2:** State machine with transition rules
- [ ] **Step 3:** Input signals: VWAP position, EMA alignment, volume profile
- [ ] **Step 4:** Write scenario tests for each state transition
- [ ] **Step 5:** Commit: `feat: 5-bias-state system (US-024)`

### Task 100: Bias-Switch-Level backend (US-025)

**Files:**
- Modify: `engine/src/arctis/analysis/bias_switch.py`

- [ ] **Step 1:** Calculate price level where bias would flip
- [ ] **Step 2:** Based on current bias state and key levels
- [ ] **Step 3:** Write tests
- [ ] **Step 4:** Commit: `feat: bias switch level calculation (US-025)`

### Task 101: Opening Fake detection backend (US-026)

**Files:**
- Modify: `engine/src/arctis/analysis/opening_fake.py`

- [ ] **Step 1:** Detect false opening breakouts in first N minutes
- [ ] **Step 2:** Track fake-out patterns against OR range
- [ ] **Step 3:** Write tests with historical scenarios
- [ ] **Step 4:** Commit: `feat: opening fake detection (US-026)`

### Task 102: Double Fake exhaustion backend (US-027)

**Files:**
- Modify: `engine/src/arctis/analysis/double_fake.py`

- [ ] **Step 1:** Detect double fake patterns (two failed breakouts → reversal)
- [ ] **Step 2:** Track directional exhaustion signals
- [ ] **Step 3:** Write tests
- [ ] **Step 4:** Commit: `feat: double fake exhaustion (US-027)`

### Task 103: 60% correction monitor backend (US-028)

**Files:**
- Modify: `engine/src/arctis/analysis/correction.py`

- [ ] **Step 1:** Monitor price retracement against swing range
- [ ] **Step 2:** Alert when 60% correction reached (key reversal zone)
- [ ] **Step 3:** Write tests
- [ ] **Step 4:** Commit: `feat: 60% correction monitor (US-028)`

### Task 104: Key level identification backend (US-029)

**Files:**
- Modify: `engine/src/arctis/analysis/key_levels.py`

- [ ] **Step 1:** Identify key levels from volume profile, pivots, OR, PDH/PDL
- [ ] **Step 2:** Rank by strength (touch count, volume)
- [ ] **Step 3:** Expose via `/api/analysis/key-levels`
- [ ] **Step 4:** Write tests
- [ ] **Step 5:** Commit: `feat: key level identification (US-029)`

### Task 105: Daily bias endpoint (US-030)

**Files:**
- Modify: `engine/src/arctis/routes/bias.py`

- [ ] **Step 1:** Aggregate all BIAS modules into daily bias assessment
- [ ] **Step 2:** Return: bias_state, switch_level, fakes, corrections, confidence
- [ ] **Step 3:** Write integration test
- [ ] **Step 4:** Commit: `feat: daily bias endpoint (US-030)`

### Task 106: Bias Panel frontend (US-031)

**Files:**
- Modify: `app/src/components/panels/BiasPanel.tsx`

- [ ] **Step 1:** Fetch from `/api/analysis/bias`
- [ ] **Step 2:** Display: current bias state badge, switch level, confidence
- [ ] **Step 3:** Show contributing signals breakdown
- [ ] **Step 4:** Loading/error states
- [ ] **Step 5:** Commit: `feat: BiasPanel live (US-031)`

### Task 107: BIAS chart overlays (US-032)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Render bias switch level as dashed horizontal line
- [ ] **Step 2:** Render opening fake markers
- [ ] **Step 3:** Render correction zone overlay
- [ ] **Step 4:** Commit: `feat: BIAS chart overlays (US-032)`

### Task 108: BIAS module tests

**Files:**
- Create: `engine/tests/test_bias.py`

- [ ] **Step 1:** Test state machine transitions
- [ ] **Step 2:** Test switch level calculation
- [ ] **Step 3:** Test fake detection with known scenarios
- [ ] **Step 4:** Commit: `test: BIAS module comprehensive tests`

---

### Epic 4: Replay Mode (Tasks 109-120) — US-033 to US-040

### Task 109: Refactor replay engine to use DB (US-033)

**Files:**
- Modify: `engine/src/arctis/main.py`
- Modify: `app/src/hooks/useReplay.ts`

- [ ] **Step 1:** Replace Parquet-based Simulation with DB queries
- [ ] **Step 2:** Load historical bars by date range from DB
- [ ] **Step 3:** Stream bars at configurable speed via WS
- [ ] **Step 4:** Verify `/api/replay/dates` returns DB-derived dates (not Parquet-based)
- [ ] **Step 5:** Commit: `feat: replay engine refactored to DB (US-033)`

### Task 110: Replay timeline scrubber (US-034)

**Files:**
- Modify: `app/src/components/replay/ReplayBar.tsx`

- [ ] **Step 1:** Draggable scrubber showing time position
- [ ] **Step 2:** Visual timeline with session markers
- [ ] **Step 3:** Click to jump to time
- [ ] **Step 4:** Commit: `feat: replay timeline scrubber (US-034)`

### Task 111: Replay transport controls (US-035)

**Files:**
- Modify: `app/src/components/replay/ReplayBar.tsx`

- [ ] **Step 1:** Play/pause/stop buttons
- [ ] **Step 2:** Step forward/backward by 1 bar
- [ ] **Step 3:** Keyboard shortcuts: Space=play/pause, Arrow=step
- [ ] **Step 4:** Commit: `feat: replay transport controls (US-035)`

### Task 112: Replay speed control (US-036)

**Files:**
- Modify: `app/src/components/replay/ReplayBar.tsx`

- [ ] **Step 1:** Speed selector: 1x, 2x, 5x, 10x, 50x, 100x
- [ ] **Step 2:** Wire to backend simulation speed
- [ ] **Step 3:** Commit: `feat: replay speed control (US-036)`

### Task 113: Replay-synced panels (US-037)

**Files:**
- Modify: `app/src/hooks/useAnalysis.ts`

- [ ] **Step 1:** In replay mode, pass replay timestamp to analysis
- [ ] **Step 2:** All panels show data as of replay time, not current time
- [ ] **Step 3:** Commit: `feat: replay-synced panels (US-037)`

### Task 114: Replay-synced chart (US-038)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** In replay mode, chart shows bars up to replay position
- [ ] **Step 2:** Progressive bar reveal as replay advances
- [ ] **Step 3:** Overlays update to replay context
- [ ] **Step 4:** Commit: `feat: replay-synced chart (US-038)`

### Task 115: Replay date picker (US-039)

**Files:**
- Modify: `app/src/components/replay/ReplayBar.tsx`

- [ ] **Step 1:** Date picker to select replay start date
- [ ] **Step 2:** Fetch available dates from `/api/replay/dates`
- [ ] **Step 3:** Load historical bars for selected date
- [ ] **Step 4:** Commit: `feat: replay date picker (US-039)`

### Task 116: "Would You Have Traded?" tracker (US-040)

**Files:**
- Create: `app/src/components/replay/DecisionTracker.tsx`

- [ ] **Step 1:** During replay: prompt at key moments for trade decision
- [ ] **Step 2:** Record: yes/no, direction, entry price, stop loss
- [ ] **Step 3:** After replay: show P&L simulation of decisions
- [ ] **Step 4:** Store in localStorage
- [ ] **Step 5:** Commit: `feat: replay decision tracker (US-040)`

---

### Epic 5: Enhanced Live Feed (Tasks 117-125) — US-041 to US-045

### Task 117: Feed event engine — full implementation (US-041)

**Files:**
- Modify: `engine/src/arctis/events.py`

- [ ] **Step 1:** Track analysis state diffs between poll cycles
- [ ] **Step 2:** Generate events on: confluence change >10pts, session transition, volume spike >2σ
- [ ] **Step 3:** Dedup by (type, timestamp, threshold)
- [ ] **Step 4:** Commit: `feat: feed event engine full impl (US-041)`

### Task 118: Feed event types — exhaustive (US-042)

**Files:**
- Modify: `engine/src/arctis/events.py`

- [ ] **Step 1:** Implement all event types: session, confluence, volume, pattern, bias, risk, discipline
- [ ] **Step 2:** Each type has specific trigger conditions and message templates
- [ ] **Step 3:** Write tests for each event type
- [ ] **Step 4:** Commit: `feat: exhaustive feed event types (US-042)`

### Task 119: Feed filtering frontend (US-043)

**Files:**
- Modify: `app/src/components/panels/FeedPanel.tsx`

- [ ] **Step 1:** Filter buttons by event type (all/signals/warnings/info)
- [ ] **Step 2:** Filter by severity
- [ ] **Step 3:** Search/text filter
- [ ] **Step 4:** Commit: `feat: feed filtering (US-043)`

### Task 120: Feed-to-chart linking (US-044)

**Files:**
- Modify: `app/src/components/panels/FeedPanel.tsx`
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Click feed event → scroll chart to event timestamp
- [ ] **Step 2:** Highlight relevant bar/marker on chart
- [ ] **Step 3:** Commit: `feat: feed-to-chart linking (US-044)`

### Task 121: Feed sound alerts (US-045)

**Files:**
- Modify: `app/src/components/panels/FeedPanel.tsx`

- [ ] **Step 1:** Play sound on critical/warning events (if enabled in settings)
- [ ] **Step 2:** Different sounds per severity
- [ ] **Step 3:** Mute toggle in feed panel
- [ ] **Step 4:** Commit: `feat: feed sound alerts (US-045)`

---

### Epic 6: Chart Drawing Tools (Tasks 122-135) — US-046 to US-050

### Task 122: Drawing data model

**Files:**
- Create: `app/src/types/drawing.ts`

- [ ] **Step 1:** Define: `Drawing = HLine | VLine | Rectangle | TrendLine | TextAnnotation`
- [ ] **Step 2:** Each has: id, type, symbol, points[], style, label
- [ ] **Step 3:** Commit: `feat: drawing data model`

### Task 123: Drawing persistence layer (US-050)

**Files:**
- Modify: `app/src/hooks/useDrawings.ts`

- [ ] **Step 1:** Save drawings to localStorage keyed by symbol
- [ ] **Step 2:** Load on symbol change
- [ ] **Step 3:** CRUD operations: add, update, delete
- [ ] **Step 4:** Commit: `feat: drawing persistence in localStorage (US-050)`

### Task 124: Horizontal line tool (US-046)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Click chart → add horizontal price line
- [ ] **Step 2:** Draggable to adjust price level
- [ ] **Step 3:** Delete with right-click or toolbar
- [ ] **Step 4:** Commit: `feat: horizontal line tool (US-046)`

### Task 125: Rectangle/zone tool (US-047)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Click-drag to create price zone rectangle
- [ ] **Step 2:** Semi-transparent fill, adjustable
- [ ] **Step 3:** Commit: `feat: rectangle zone tool (US-047)`

### Task 126: Trend line tool (US-048)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Click two points to draw trend line
- [ ] **Step 2:** Extend line to right edge
- [ ] **Step 3:** Commit: `feat: trend line tool (US-048)`

### Task 127: Text annotation tool (US-049)

**Files:**
- Modify: `app/src/components/Chart.tsx`

- [ ] **Step 1:** Click chart → place text annotation
- [ ] **Step 2:** Editable text, draggable position
- [ ] **Step 3:** Commit: `feat: text annotation tool (US-049)`

### Task 128: Drawing toolbar UI

**Files:**
- Modify: `app/src/components/charts/DrawingToolbar.tsx`

- [ ] **Step 1:** Tool selector: hline, rect, trendline, text, eraser
- [ ] **Step 2:** Active tool indicator
- [ ] **Step 3:** Clear all button
- [ ] **Step 4:** Commit: `feat: drawing toolbar UI`

### Task 128b: Zone persistence backend endpoint

**Files:**
- Modify: `engine/src/arctis/routes/zones.py`

- [ ] **Step 1:** Implement `POST /api/zones` — save drawing zones per symbol
- [ ] **Step 2:** Implement `GET /api/zones/{symbol}` — retrieve drawings
- [ ] **Step 3:** Implement `DELETE /api/zones/{id}` — remove drawing
- [ ] **Step 4:** Write tests
- [ ] **Step 5:** Commit: `feat: zone persistence API endpoints`

---

### Epic 7: Settings & Configuration (Tasks 129-140) — US-051 to US-055

### Task 129: Settings store

**Files:**
- Create: `app/src/store/settings.ts`

- [ ] **Step 1:** Zustand store for all settings, persisted to localStorage
- [ ] **Step 2:** Sections: connection, risk, display, alerts
- [ ] **Step 3:** Commit: `feat: settings persistence store`

### Task 130: Settings slide-over panel (US-051)

**Files:**
- Modify: `app/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1:** Radix Dialog slide-over from right
- [ ] **Step 2:** Tabbed interface: Connection | Risk | Display | Alerts
- [ ] **Step 3:** Open from sidebar gear icon
- [ ] **Step 4:** Commit: `feat: settings slide-over panel (US-051)`

### Task 131: Connection settings tab (US-052)

**Files:**
- Modify: `app/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1:** Engine URL input (default 127.0.0.1:8001)
- [ ] **Step 2:** Auto-reconnect toggle
- [ ] **Step 3:** Poll interval slider
- [ ] **Step 4:** Connection test button
- [ ] **Step 5:** Commit: `feat: connection settings tab (US-052)`

### Task 132: Risk settings tab (US-053)

**Files:**
- Modify: `app/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1:** Max trades per day input
- [ ] **Step 2:** Max daily loss input
- [ ] **Step 3:** Max contracts input
- [ ] **Step 4:** Save to backend via PUT `/api/config`
- [ ] **Step 5:** Commit: `feat: risk settings tab (US-053)`

### Task 133: Display settings tab (US-054)

**Files:**
- Modify: `app/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1:** Toggle overlays: VWAP, EMA, volume profile, levels
- [ ] **Step 2:** Toggle panels visibility
- [ ] **Step 3:** Chart color theme
- [ ] **Step 4:** Commit: `feat: display settings tab (US-054)`

### Task 134: Alert settings tab (US-055)

**Files:**
- Modify: `app/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1:** Sound alerts toggle per event type
- [ ] **Step 2:** Alert volume slider
- [ ] **Step 3:** Desktop notification toggle
- [ ] **Step 4:** Commit: `feat: alert settings tab (US-055)`

### Task 135: Settings → runtime coupling

- [ ] **Step 1:** Display settings toggle overlays on/off in chart
- [ ] **Step 2:** Risk settings update backend config
- [ ] **Step 3:** Alert settings control feed sound behavior
- [ ] **Step 4:** Commit: `feat: settings affect runtime behavior`

---

### Epic 8: Travis MCP Integration (Tasks 136-138) — US-056 to US-058

### Task 136: Travis knowledge panel (US-056)

**Files:**
- Modify: `app/src/components/panels/TravisPanel.tsx`

- [ ] **Step 1:** Fetch trading knowledge from Travis endpoint
- [ ] **Step 2:** Display contextual education based on current market state
- [ ] **Step 3:** Loading/error states
- [ ] **Step 4:** Commit: `feat: Travis knowledge panel (US-056)`

### Task 137: Travis contextual suggestions (US-057)

**Files:**
- Modify: `engine/src/arctis/routes/travis.py`

- [ ] **Step 1:** Generate context-aware suggestions based on current analysis
- [ ] **Step 2:** E.g., "Price approaching naked POC from 2 days ago"
- [ ] **Step 3:** Return suggestion list with relevance score
- [ ] **Step 4:** Commit: `feat: Travis contextual suggestions (US-057)`

### Task 138: Travis search command (US-058)

**Files:**
- Modify: `app/src/components/panels/TravisPanel.tsx`

- [ ] **Step 1:** Search input for Travis knowledge base
- [ ] **Step 2:** Query backend for matching concepts
- [ ] **Step 3:** Display results in panel
- [ ] **Step 4:** Commit: `feat: Travis search command (US-058)`

---

### Epic 9: Polish & UX (Tasks 139-144) — US-059 to US-064

### Task 139: Loading skeletons — comprehensive (US-059)

**Files:**
- Modify: `app/src/components/ui/Skeleton.tsx`
- Modify: all panels and pages

- [ ] **Step 1:** Panel-specific skeletons matching real content layout
- [ ] **Step 2:** Chart skeleton with candle silhouettes
- [ ] **Step 3:** Page-level skeleton for initial load
- [ ] **Step 4:** Commit: `feat: comprehensive loading skeletons (US-059)`

### Task 140: Error states — comprehensive (US-060)

**Files:**
- Modify: all panels and pages

- [ ] **Step 1:** Panel error state: red border, icon, message, retry
- [ ] **Step 2:** Page error state: full-page friendly error
- [ ] **Step 3:** Network error banner at top
- [ ] **Step 4:** Commit: `feat: comprehensive error states (US-060)`

### Task 141: Keyboard shortcuts — comprehensive (US-061)

**Files:**
- Modify: `app/src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1:** 1-5: timeframe switch
- [ ] **Step 2:** Space: replay play/pause
- [ ] **Step 3:** Escape: close settings
- [ ] **Step 4:** Cmd+K: search (Travis)
- [ ] **Step 5:** Commit: `feat: keyboard shortcuts (US-061)`

### Task 142: Responsive layout (US-062)

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1:** Sidebar collapse on narrow screens
- [ ] **Step 2:** Right panel stacks below chart on narrow
- [ ] **Step 3:** HudStrip wraps on narrow
- [ ] **Step 4:** Commit: `feat: responsive layout (US-062)`

### Task 143: Performance optimization (US-063)

**Files:**
- Multiple across app/src/

- [ ] **Step 1:** React.memo for panel components
- [ ] **Step 2:** Debounce analysis polling
- [ ] **Step 3:** Virtualize feed list if >100 events
- [ ] **Step 4:** Lazy load page components
- [ ] **Step 5:** Commit: `feat: performance optimization (US-063)`

### Task 144: Favicon, page title, app icon (US-064)

**Files:**
- Modify: `app/index.html`
- Create: `app/public/favicon.ico`

- [ ] **Step 1:** Generate Arctic Frost themed favicon (ice blue)
- [ ] **Step 2:** Set page title: "Arctis — Trading Analysis"
- [ ] **Step 3:** Set Tauri window title
- [ ] **Step 4:** Commit: `feat: favicon, title, app icon (US-064)`

---

## PHASE 8 — QA, Release, CI & Handoff (Tasks 145-230)

### Backend Test Suite (Tasks 145-170)

### Task 145: DB adapter unit tests

**Files:**
- Modify: `engine/tests/test_db.py`

- [ ] **Step 1:** Test connection creation and pooling
- [ ] **Step 2:** Test fetch_bars with various params
- [ ] **Step 3:** Test fetch_available_symbols
- [ ] **Step 4:** Commit: `test: DB adapter unit tests`

### Task 146: Timestamp correctness tests

**Files:**
- Modify: `engine/tests/test_timestamp.py`

- [ ] **Step 1:** Test ns → seconds conversion edge cases
- [ ] **Step 2:** Test timezone handling (ET, UTC)
- [ ] **Step 3:** Test DST transitions
- [ ] **Step 4:** Commit: `test: timestamp correctness edge cases`

### Task 147: Aggregation edge case tests

**Files:**
- Modify: `engine/tests/test_db.py`

- [ ] **Step 1:** Test 5min aggregation with gaps
- [ ] **Step 2:** Test at session boundaries
- [ ] **Step 3:** Test remainder bars
- [ ] **Step 4:** Test 15min and 1h aggregation
- [ ] **Step 5:** Commit: `test: aggregation edge cases`

### Task 148: Symbol resolution tests

- [ ] **Step 1:** Test root → contract resolution
- [ ] **Step 2:** Test front-month mapping
- [ ] **Step 3:** Test invalid symbol handling
- [ ] **Step 4:** Commit: `test: symbol resolution`

### Task 149: /api/markets contract test

- [ ] **Step 1:** Test response structure matches contract
- [ ] **Step 2:** Test with no data → empty market list
- [ ] **Step 3:** Commit: `test: /api/markets contract`

### Task 150: WebSocket connect/disconnect tests

- [ ] **Step 1:** Test connect → initial bars
- [ ] **Step 2:** Test heartbeat
- [ ] **Step 3:** Test disconnect cleanup
- [ ] **Step 4:** Test reconnect after disconnect
- [ ] **Step 5:** Commit: `test: WebSocket connect/disconnect`

### Task 151: WebSocket dedup tests

- [ ] **Step 1:** Test same bar not sent twice
- [ ] **Step 2:** Test bar ordering
- [ ] **Step 3:** Commit: `test: WebSocket deduplication`

### Task 152: Session analysis tests

- [ ] **Step 1:** Test session classification for each time zone
- [ ] **Step 2:** Test with historical data (not wall-clock)
- [ ] **Step 3:** Commit: `test: session analysis`

### Task 153: Confluence analysis tests

- [ ] **Step 1:** Test score calculation with known inputs
- [ ] **Step 2:** Test direction determination
- [ ] **Step 3:** Commit: `test: confluence analysis`

### Task 154: Pattern detection tests

- [ ] **Step 1:** Test pattern recognition with historical scenarios
- [ ] **Step 2:** Test false positive filtering
- [ ] **Step 3:** Commit: `test: pattern detection`

### Task 155: BIAS module unit tests

- [ ] **Step 1:** Test each BIAS module independently
- [ ] **Step 2:** Test bias state transitions
- [ ] **Step 3:** Test switch level calculation
- [ ] **Step 4:** Test fake detection
- [ ] **Step 5:** Commit: `test: BIAS modules`

### Task 156: Feed event engine tests

- [ ] **Step 1:** Test event generation from analysis deltas
- [ ] **Step 2:** Test deduplication
- [ ] **Step 3:** Test all event types
- [ ] **Step 4:** Commit: `test: feed event engine`

### Task 157: Risk/config endpoint tests

- [ ] **Step 1:** Test GET /api/config
- [ ] **Step 2:** Test PUT /api/config
- [ ] **Step 3:** Test /api/risk/daily-check
- [ ] **Step 4:** Commit: `test: risk/config endpoints`

### Task 158: Probability endpoint tests

- [ ] **Step 1:** Test probability zones with DB data
- [ ] **Step 2:** Test baselines
- [ ] **Step 3:** Test benchmark harness
- [ ] **Step 4:** Commit: `test: probability endpoints`

### Task 159: Replay endpoint tests

- [ ] **Step 1:** Test /api/replay/dates
- [ ] **Step 2:** Test /api/sim/start with DB source
- [ ] **Step 3:** Test replay bar streaming
- [ ] **Step 4:** Commit: `test: replay endpoints`

### Task 160: Full backend test run

- [ ] **Step 1:** Run `python -m pytest -v --tb=short`
- [ ] **Step 2:** All tests green
- [ ] **Step 3:** Fix any remaining failures
- [ ] **Step 4:** Commit: `test: full backend suite green`

---

### Frontend Test & Build (Tasks 161-185)

### Task 161: TypeScript strict compliance check

- [ ] **Step 1:** Run `pnpm exec tsc --noEmit`
- [ ] **Step 2:** Zero errors
- [ ] **Step 3:** Commit: `fix: TypeScript strict clean`

### Task 162: Install frontend test framework

**Files:**
- Modify: `app/package.json`
- Modify: `app/vite.config.ts`

- [ ] **Step 1:** Run `cd ~/arctis/app && pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom @testing-library/jest-dom`
- [ ] **Step 2:** Add to `vite.config.ts`: `test: { environment: 'jsdom', globals: true }`
- [ ] **Step 3:** Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`
- [ ] **Step 4:** Run `pnpm test` — verify framework runs (0 tests, no errors)
- [ ] **Step 5:** Commit: `feat: install vitest + testing-library for frontend tests`

### Task 163: Hook unit tests — useMarketData

**Files:**
- Create: `app/src/hooks/__tests__/useMarketData.test.ts`

- [ ] **Step 1:** Test initial load returns bars
- [ ] **Step 2:** Test symbol switch triggers refetch
- [ ] **Step 3:** Test WS reconnect logic
- [ ] **Step 4:** Commit: `test: useMarketData hook`

### Task 164: Hook unit tests — useAnalysis

- [ ] **Step 1:** Test polling interval
- [ ] **Step 2:** Test market change triggers refetch
- [ ] **Step 3:** Commit: `test: useAnalysis hook`

### Task 165: Hook unit tests — useFeed

- [ ] **Step 1:** Test event polling
- [ ] **Step 2:** Test deduplication
- [ ] **Step 3:** Commit: `test: useFeed hook`

### Task 166: Store tests — market store

- [ ] **Step 1:** Test setMarket, setTimeframe, setSymbol
- [ ] **Step 2:** Test derived symbol from root
- [ ] **Step 3:** Commit: `test: market store`

### Task 167: Panel rendering tests — SessionPanel

- [ ] **Step 1:** Test renders with valid data
- [ ] **Step 2:** Test loading state
- [ ] **Step 3:** Test error state
- [ ] **Step 4:** Test empty state
- [ ] **Step 5:** Commit: `test: SessionPanel rendering`

### Task 168: Panel rendering tests — ConfluencePanel

- [ ] **Step 1:** Test renders score/direction/confidence
- [ ] **Step 2:** Test loading/error/empty states
- [ ] **Step 3:** Commit: `test: ConfluencePanel rendering`

### Task 169: Panel rendering tests — PatternsPanel

- [ ] **Step 1:** Test renders patterns
- [ ] **Step 2:** Test loading/error/empty states
- [ ] **Step 3:** Commit: `test: PatternsPanel rendering`

### Task 170: Panel rendering tests — FeedPanel

- [ ] **Step 1:** Test renders events by severity
- [ ] **Step 2:** Test filtering
- [ ] **Step 3:** Test loading/error/empty states
- [ ] **Step 4:** Commit: `test: FeedPanel rendering`

### Task 171: Panel rendering tests — RiskPanel

- [ ] **Step 1:** Test renders limits and progress
- [ ] **Step 2:** Test warning states
- [ ] **Step 3:** Commit: `test: RiskPanel rendering`

### Task 172: Panel rendering tests — BiasPanel

- [ ] **Step 1:** Test renders bias state
- [ ] **Step 2:** Test all 5 states display correctly
- [ ] **Step 3:** Commit: `test: BiasPanel rendering`

### Task 173: Feed dedup tests

- [ ] **Step 1:** Test duplicate events are filtered
- [ ] **Step 2:** Test event ordering
- [ ] **Step 3:** Commit: `test: feed deduplication`

### Task 174: Chart adapter smoke tests

- [ ] **Step 1:** Test chart mounts without error
- [ ] **Step 2:** Test data flow to chart
- [ ] **Step 3:** Commit: `test: chart smoke tests`

---

### End-to-End Verification (Tasks 175-200)

### Task 175: E2E — Initial load flow

- [ ] **Step 1:** Start backend + frontend
- [ ] **Step 2:** Verify: Topbar shows markets from API
- [ ] **Step 3:** Verify: Chart loads bars
- [ ] **Step 4:** Verify: Panels populate with live data
- [ ] **Step 5:** Verify: HUD shows metrics

### Task 176: E2E — Market switch

- [ ] **Step 1:** Click different market in Topbar
- [ ] **Step 2:** Verify: Chart reloads with new market data
- [ ] **Step 3:** Verify: All panels update to new market
- [ ] **Step 4:** Verify: HUD updates
- [ ] **Step 5:** Verify: StatusBar shows correct symbol

### Task 177: E2E — Timeframe switch

- [ ] **Step 1:** Click different timeframe
- [ ] **Step 2:** Verify: Chart shows aggregated bars
- [ ] **Step 3:** Verify: Panels update analysis
- [ ] **Step 4:** Verify: Overlays recalculate

### Task 178: E2E — WebSocket reconnect

- [ ] **Step 1:** Stop backend while frontend running
- [ ] **Step 2:** Verify: StatusBar shows disconnected
- [ ] **Step 3:** Restart backend
- [ ] **Step 4:** Verify: Auto-reconnect + bars resume
- [ ] **Step 5:** Verify: No corrupt UI state

### Task 179: E2E — New bar arrives

- [ ] **Step 1:** Wait for new bar via WS
- [ ] **Step 2:** Verify: Chart updates incrementally
- [ ] **Step 3:** Verify: Panels refresh
- [ ] **Step 4:** Verify: Feed generates event if threshold met

### Task 180: E2E — Replay mode

- [ ] **Step 1:** Switch to replay mode
- [ ] **Step 2:** Select historical date
- [ ] **Step 3:** Press play → bars stream progressively
- [ ] **Step 4:** Verify: Panels sync to replay time
- [ ] **Step 5:** Verify: Chart reveals bars progressively

### Task 181: E2E — Settings persistence

- [ ] **Step 1:** Change settings (risk limits, display toggles)
- [ ] **Step 2:** Reload page
- [ ] **Step 3:** Verify: Settings persisted and applied

### Task 182: E2E — Drawing tools

- [ ] **Step 1:** Add horizontal line, rectangle, trend line
- [ ] **Step 2:** Reload page
- [ ] **Step 3:** Verify: Drawings persist and display

### Task 183: E2E — No demo values visible

- [ ] **Step 1:** Start fresh with DB connected
- [ ] **Step 2:** Verify: No hardcoded prices, sessions, patterns
- [ ] **Step 3:** Verify: All values from API responses

### Task 184: E2E — No demo values without backend

- [ ] **Step 1:** Start frontend without backend
- [ ] **Step 2:** Verify: Error states show (not demo data)
- [ ] **Step 3:** Verify: Connection error banner

### Task 185: E2E — Feed-to-chart interaction

- [ ] **Step 1:** Click feed event
- [ ] **Step 2:** Verify: Chart scrolls to event timestamp
- [ ] **Step 3:** Verify: Relevant marker highlighted

---

### Performance Gates (Tasks 186-195)

### Task 186: Initial load performance

- [ ] **Step 1:** Measure time from page load to chart visible
- [ ] **Step 2:** Target: <2 seconds with warm DB
- [ ] **Step 3:** Optimize if needed (lazy loading, parallel fetches)

### Task 187: WS latency

- [ ] **Step 1:** Measure time from bar insert to chart update
- [ ] **Step 2:** Target: <500ms
- [ ] **Step 3:** Optimize poll interval if needed

### Task 188: Analysis endpoint p95

- [ ] **Step 1:** Benchmark `/api/analysis/*` endpoints with k6 or similar
- [ ] **Step 2:** Target: p95 <200ms
- [ ] **Step 3:** Add DB indexes if needed

### Task 189: Bundle size check

- [ ] **Step 1:** Run `pnpm run build` and check dist/ size
- [ ] **Step 2:** Target: <2MB gzipped
- [ ] **Step 3:** Code split if needed

### Task 190: Render performance

- [ ] **Step 1:** Check for re-render storms with React DevTools
- [ ] **Step 2:** Verify chart doesn't re-mount on every update
- [ ] **Step 3:** Verify panels don't re-render without data change

### Task 191: Memory leak check

- [ ] **Step 1:** Run frontend for 10 minutes, watch memory
- [ ] **Step 2:** Verify WS cleanup on unmount
- [ ] **Step 3:** Verify no growing event/bar arrays

### Task 192: Backend memory check

- [ ] **Step 1:** Run backend for 10 minutes with active WS
- [ ] **Step 2:** Verify WS connections cleanup properly
- [ ] **Step 3:** Verify no growing in-memory caches

---

### Documentation & Release (Tasks 193-230)

### Task 193: Architecture overview doc

**Files:**
- Create: `docs/ARCHITECTURE.md`

- [ ] **Step 1:** Diagram: Backend → REST/WS → Frontend → Store → Components
- [ ] **Step 2:** Data flow description
- [ ] **Step 3:** Commit: `docs: architecture overview`

### Task 194: Setup guide

**Files:**
- Create: `docs/SETUP.md`

- [ ] **Step 1:** Prerequisites: Python 3.12+, Node 20+, pnpm, TimescaleDB
- [ ] **Step 2:** Backend setup: `pip install -e ".[dev]"`, env vars, DB setup
- [ ] **Step 3:** Frontend setup: `pnpm install`, config
- [ ] **Step 4:** Start commands
- [ ] **Step 5:** Commit: `docs: setup guide`

### Task 195: Test guide

**Files:**
- Create: `docs/TESTING.md`

- [ ] **Step 1:** Backend: `python -m pytest -v`
- [ ] **Step 2:** Frontend: `pnpm exec tsc --noEmit && pnpm run build`
- [ ] **Step 3:** E2E verification checklist
- [ ] **Step 4:** Commit: `docs: test guide`

### Task 196: Update Acceptance Matrix

**Files:**
- Create: `docs/ACCEPTANCE_MATRIX.md`

- [ ] **Step 1:** Copy AC-01 through AC-15 from audit
- [ ] **Step 2:** Update status for each based on implementation
- [ ] **Step 3:** Add evidence/verification for each
- [ ] **Step 4:** Commit: `docs: updated acceptance matrix`

### Task 197: ADR-003 — Chart Renderer Decision

**Files:**
- Create: `docs/adr/ADR-003-chart-renderer.md`

- [ ] **Step 1:** Decision: Lightweight Charts canonical
- [ ] **Step 2:** Rationale: PRD alignment, incremental updates, bundle size
- [ ] **Step 3:** SciChart isolated as deprecated
- [ ] **Step 4:** Commit: `docs: ADR-003 chart renderer`

### Task 198: ADR-004 — State Management

**Files:**
- Create: `docs/adr/ADR-004-state-management.md`

- [ ] **Step 1:** Decision: Zustand for client state, polling for server state
- [ ] **Step 2:** Rationale: simplicity, React 19 compatibility, no heavy abstraction
- [ ] **Step 3:** Commit: `docs: ADR-004 state management`

### Task 199: ADR-005 — Prediction Architecture

**Files:**
- Create: `docs/adr/ADR-005-prediction-architecture.md`

- [ ] **Step 1:** Decision: probabilistic zones, not binary signals
- [ ] **Step 2:** Decision: baselines required before any ML model
- [ ] **Step 3:** Decision: walk-forward validation mandatory
- [ ] **Step 4:** Commit: `docs: ADR-005 prediction architecture`

### Task 200: Known Limitations doc

**Files:**
- Create: `docs/KNOWN_LIMITATIONS.md`

- [ ] **Step 1:** List scope cuts and deferred features
- [ ] **Step 2:** List known edge cases
- [ ] **Step 3:** List environment-specific limitations
- [ ] **Step 4:** Commit: `docs: known limitations`

### Task 201: Migration notes

**Files:**
- Create: `docs/MIGRATION.md`

- [ ] **Step 1:** Document: Parquet → DB migration
- [ ] **Step 2:** Document: multi-chart → single renderer
- [ ] **Step 3:** Document: static panels → live panels
- [ ] **Step 4:** Commit: `docs: migration notes`

### Task 202: Run commands doc

**Files:**
- Update: `docs/SETUP.md`

- [ ] **Step 1:** Backend: `cd engine && uvicorn src.arctis.main:app --port 8001 --reload`
- [ ] **Step 2:** Frontend: `cd app && pnpm dev --port 5174`
- [ ] **Step 3:** DB: `docker start algorivo-db`
- [ ] **Step 4:** Commit: `docs: run commands`

### Task 203: Final pytest run — all green

- [ ] **Step 1:** `cd engine && python -m pytest -v --tb=short`
- [ ] **Step 2:** All tests pass
- [ ] **Step 3:** Fix any remaining failures

### Task 204: Final tsc check — zero errors

- [ ] **Step 1:** `cd app && pnpm exec tsc --noEmit`
- [ ] **Step 2:** Zero errors
- [ ] **Step 3:** Fix any remaining issues

### Task 205: Final build — clean

- [ ] **Step 1:** `cd app && pnpm run build`
- [ ] **Step 2:** Clean build, no warnings
- [ ] **Step 3:** Note bundle size

### Task 206: Final E2E smoke test

- [ ] **Step 1:** Start full stack
- [ ] **Step 2:** Walk through all E2E scenarios (Tasks 175-185)
- [ ] **Step 3:** Screenshot key states

### Task 207: Update session resume file

**Files:**
- Modify: `~/.claude-sessions/arctis.md`

- [ ] **Step 1:** Document completed phase and task count
- [ ] **Step 2:** List any remaining items
- [ ] **Step 3:** Note verification results

### Task 208: Generate final report — short

- [ ] **Step 1:** Summary: what changed, key decisions, acceptance status
- [ ] **Step 2:** Commit: `docs: final short report`

### Task 209: Generate final report — technical

- [ ] **Step 1:** Data model, WS flow, chart architecture, panel model
- [ ] **Step 2:** Probability layer, test coverage, performance metrics
- [ ] **Step 3:** Commit: `docs: final technical report`

### Task 210: File changelist

- [ ] **Step 1:** List all new files
- [ ] **Step 2:** List all modified files
- [ ] **Step 3:** List all removed/deprecated files
- [ ] **Step 4:** Commit: `docs: file changelist`

### Task 211: Verification evidence

- [ ] **Step 1:** Capture pytest output
- [ ] **Step 2:** Capture tsc output
- [ ] **Step 3:** Capture build output
- [ ] **Step 4:** Capture key curl responses
- [ ] **Step 5:** Commit: `docs: verification evidence`

#### Bug Fixes, Edge Cases & Iteration (Tasks 212-230)

### Task 212: Fix — timestamp edge cases discovered during E2E

- [ ] **Step 1:** Identify any remaining timestamp issues
- [ ] **Step 2:** Write test, fix, verify
- [ ] **Step 3:** Commit

### Task 213: Fix — panel data refresh timing

- [ ] **Step 1:** Verify panels refresh on new bar consistently
- [ ] **Step 2:** Fix any race conditions
- [ ] **Step 3:** Commit

### Task 214: Fix — chart overlay alignment

- [ ] **Step 1:** Verify all overlays align with candles
- [ ] **Step 2:** Fix any X-axis drift
- [ ] **Step 3:** Commit

### Task 215: Fix — WS reconnect state recovery

- [ ] **Step 1:** Verify state is clean after reconnect
- [ ] **Step 2:** Fix any stale data issues
- [ ] **Step 3:** Commit

### Task 216: Fix — replay mode panel sync

- [ ] **Step 1:** Verify all panels sync to replay time
- [ ] **Step 2:** Fix any panel showing live data during replay
- [ ] **Step 3:** Commit

### Task 217: Fix — settings not applying

- [ ] **Step 1:** Verify each setting category applies immediately
- [ ] **Step 2:** Fix any settings that need page reload
- [ ] **Step 3:** Commit

### Task 218: Fix — feed event deduplication edge cases

- [ ] **Step 1:** Test rapid analysis changes
- [ ] **Step 2:** Verify no duplicate feed events
- [ ] **Step 3:** Commit

### Task 219: Fix — market switch race condition

- [ ] **Step 1:** Rapidly switch markets
- [ ] **Step 2:** Verify no cross-market data pollution
- [ ] **Step 3:** Commit

### Task 220: Fix — chart zoom/pan on mobile/touch

- [ ] **Step 1:** Test touch interactions in Tauri desktop
- [ ] **Step 2:** Fix any gesture issues
- [ ] **Step 3:** Commit

### Task 221: Fix — ErrorBoundary enhancement

- [ ] **Step 1:** Verify ErrorBoundary catches component crashes
- [ ] **Step 2:** Add recovery button
- [ ] **Step 3:** Commit

### Task 222: Fix — backend graceful shutdown

- [ ] **Step 1:** Verify WS connections close cleanly on shutdown
- [ ] **Step 2:** Fix any hanging connections
- [ ] **Step 3:** Commit

### Task 223: Fix — probability zone display edge cases

- [ ] **Step 1:** Test with insufficient data
- [ ] **Step 2:** Test with extreme values
- [ ] **Step 3:** Commit

### Task 224: Fix — BIAS module edge cases

- [ ] **Step 1:** Test with minimal bars
- [ ] **Step 2:** Test at session boundaries
- [ ] **Step 3:** Commit

### Task 225: Fix — drawing persistence across symbol switch

- [ ] **Step 1:** Verify drawings are symbol-scoped
- [ ] **Step 2:** Switch symbol → drawings change
- [ ] **Step 3:** Commit

### Task 226: Fix — feed sound timing

- [ ] **Step 1:** Verify sounds don't overlap
- [ ] **Step 2:** Verify mute toggle works
- [ ] **Step 3:** Commit

### Task 227: Cleanup — remove dead code

- [ ] **Step 1:** Remove any remaining unused components
- [ ] **Step 2:** Remove unused imports
- [ ] **Step 3:** Commit: `refactor: remove dead code`

### Task 228: Cleanup — consistent code style

- [ ] **Step 1:** Run linter on all files
- [ ] **Step 2:** Fix formatting issues
- [ ] **Step 3:** Commit: `style: consistent formatting`

### Task 229: Final acceptance matrix update

- [ ] **Step 1:** Mark all AC-01 through AC-15 with final status
- [ ] **Step 2:** Add evidence links
- [ ] **Step 3:** Commit: `docs: final acceptance matrix`

### Task 230: Final commit — project complete

- [ ] **Step 1:** `git status` — clean
- [ ] **Step 2:** `git log --oneline -20` — verify commit history
- [ ] **Step 3:** Tag: `git tag v1.0.0-masterpack`
- [ ] **Step 4:** Update session resume file

---

## Execution Summary

| Phase | Tasks | Stories | Focus |
|-------|-------|---------|-------|
| 0 — Audit & Freeze | 1-15 | — | Truth baseline, ADRs, issue register |
| 1 — Data Correctness | 16-30 | US-001, US-002, US-003 | DB deps, timestamps, aggregation, symbols |
| 2 — REST/WS Contracts | 31-44 | US-004, US-005 | WebSocket, useMarketData, API contracts |
| 3 — Frontend Canon. | 45-58 | US-002 FE, US-005 FE | Zustand store, Topbar, eliminate splits |
| 4 — Chart & Rendering | 59-73 | US-012 to US-020 | LWC canonical, overlays, incremental |
| 5 — Live Panels | 74-85 | US-006 to US-011 | Session, Confluence, Patterns, Feed, Risk, HUD |
| 6 — Probability | 86-95 | US-020 deep | Baselines, benchmark, zones |
| 7 — Platform Build | 96-144 | US-021 to US-064 | BIAS, Replay, Feed, Drawings, Settings, Travis, Polish |
| 8 — QA & Release | 145-230 | — | Tests, E2E, performance, docs, cleanup |

**Total: 230 Tasks across 9 Phases covering 64 User Stories**

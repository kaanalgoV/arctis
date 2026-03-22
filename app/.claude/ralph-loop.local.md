---
active: true
iteration: 2
session_id: 
max_iterations: 20
completion_promise: "TASK COMPLETE"
started_at: "2026-03-22T23:02:07Z"
---

# PRD: Arctis SaaS Platform — Epic 0 (Foundation) + Epic 1 (Live Panels)

## Objective
Transform Arctis from a static-data prototype into a live, TimescaleDB-connected trading decision support platform. All analysis endpoints must serve real data from the DB, all frontend panels must display live analysis results, and a WebSocket system must enable real-time bar streaming.

## Full PRD Reference
The complete 64-story PRD is at: `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md`
This PROMPT.md focuses on Epic 0 (US-001 through US-005) and Epic 1 (US-006 through US-011).

## Current State
- Frontend: React 19 + Tailwind v4 + Lightweight Charts v5 on port 5174
- Backend: FastAPI on port 8001, connected to TimescaleDB on port 5532
- DB: `ohlcv_1m` table with NQH6 (89k bars) and NQZ5 (99k bars)
- Chart renders 12,300 NQH6 candles with volume bars
- 5 panels exist but show STATIC demo data (not connected to API)
- 11 analysis modules exist in `engine/src/arctis/analysis/` but read from Parquet, not DB
- All API endpoints defined in `app/src/api.ts` (client functions ready)
- Backend endpoint `GET /api/db/bars` already works for fetching bars from TimescaleDB

## Tech Stack
- Frontend: React 19, TypeScript, Vite 7, Tailwind v4, Lightweight Charts v5, Framer Motion, Lucide, Zustand
- Backend: Python FastAPI, Pandas, NumPy, SciPy, TimescaleDB (psycopg2)
- DB: postgres://algorivo:algorivo_dev@localhost:5532/algorivo

## Requirements

### Epic 0: Foundation
1. **US-001: DB-backed analysis** — Modify ALL analysis route handlers in `engine/src/arctis/routes/analysis.py` to fetch bars from TimescaleDB (via `db.py`) instead of ParquetStore. The `market` and `timeframe` query params should map to DB symbols (ES->ESH6, NQ->NQH6). Keep backward-compat with existing query param names.

2. **US-002: Dynamic market selector** — Backend: `GET /api/markets` endpoint that queries `SELECT DISTINCT symbol FROM ohlcv_1m` and returns available symbols grouped by root (NQ, ES, CL, etc.). Frontend: Topbar market pills dynamically populated from this endpoint.

3. **US-003: Timeframe aggregation** — Backend: Support `timeframe=5min` by aggregating 1-min bars on-the-fly using pandas resample. Frontend: Timeframe selector pills trigger re-fetch with new timeframe param.

4. **US-004: WebSocket endpoint** — Backend: `WS /ws/bars/{symbol}` endpoint. On connect, send latest bar. Poll DB every 1s for new bars, push to all subscribers. Use fastapi-websocket with JSON messages: `{type: "bar", data: {timestamp, open, high, low, close, volume}}`.

5. **US-005: useMarketData hook** — Frontend: Custom React hook `useMarketData(symbol, days)` that: (a) fetches initial bars via REST, (b) connects to WebSocket for live updates, (c) appends new bars to state, (d) auto-reconnects on disconnect. Returns `{bars, isLoading, isConnected, error}`.

### Epic 1: Live Panels
6. **US-006: Live Session Panel** — Connect SessionPanel to `GET /api/analysis/sessions`. Show current session with progress bar, update every 30s. Display all 5 sessions with filled/active/pending states.

7. **US-007: Live Confluence Panel** — Connect ConfluencePanel to `GET /api/analysis/confluence`. Show real score, verdict, direction, and breakdown. Update on every new bar (via WS trigger or 5s poll).

8. **US-008: Live Patterns Panel** — Connect PatternsPanel to `GET /api/analysis/patterns`. Show active Tier 1 patterns with real win rates from backtest data. Update on new bars.

9. **US-009: Live Feed Panel** — Build a real event aggregator: on each analysis update, generate feed events from confluence signals, volume spikes, pattern triggers, session changes, discipline warnings. Each event: {time, message, type, severity}. Show in FeedPanel with colored dots and timestamps.

10. **US-010: Live Risk Panel** — Connect RiskPanel to `GET /api/config` for limits + `GET /api/risk/daily-check` for current state. Show real trades/maxTrades, P&L, limit percentage, contracts.

11. **US-011: HUD Metrics Strip** — Add a horizontal metrics bar below the topbar showing: RVOL (from /api/analysis/volume), RSI value + divergence (from /api/analysis/indicators), EMA alignment (from /api/analysis/indicators), VWAP position (from /api/analysis/indicators), current session name, bar count. Auto-refresh every 5s or on new bar.

## Acceptance Criteria

- [ ] All analysis endpoints (`/api/analysis/*`) fetch data from TimescaleDB, not Parquet
- [ ] `GET /api/markets` returns dynamically discovered symbols from the DB
- [ ] Timeframe=5min works by aggregating 1-min bars server-side
- [ ] WebSocket endpoint `WS /ws/bars/{symbol}` streams new bars to connected clients
- [ ] `useMarketData` hook loads initial data + subscribes to WebSocket updates
- [ ] SessionPanel shows real current session from API (not hardcoded "NY Open")
- [ ] ConfluencePanel shows real calculated score from API (not hardcoded "+9")
- [ ] PatternsPanel shows real detected patterns from API (not hardcoded list)
- [ ] FeedPanel shows real timestamped events from analysis (not hardcoded list)
- [ ] RiskPanel shows real config values from API (not hardcoded "2/10")
- [ ] HUD metrics strip displays real RVOL, RSI, EMA alignment, VWAP, session below topbar
- [ ] Market selector pills in topbar are dynamically populated from `/api/markets`
- [ ] App compiles without TypeScript errors (`npx tsc --noEmit`)
- [ ] Backend starts without errors (`uvicorn src.arctis.main:app`)
- [ ] All existing pytest tests still pass

## Constraints

- Work within the existing codebase structure (don't restructure unless necessary)
- Keep the existing analysis modules — only change their data source from Parquet to DB
- Use `engine/src/arctis/db.py` as the DB access layer (extend it, don't create a new one)
- All frontend components use AlgoView design tokens from `index.css`
- No emojis in UI — only SVG icons from Lucide
- Backend must remain stateless (no in-process state except cache)
- Frontend: files at `app/src/`, backend: files at `engine/src/arctis/`

## File Inventory (key files to modify)

### Backend
- `engine/src/arctis/db.py` — Add `fetch_bars_for_analysis(symbol, days)` returning OHLCVBar list
- `engine/src/arctis/routes/analysis.py` — Replace `store.load()` with DB calls
- `engine/src/arctis/main.py` — Add `/api/markets` + WebSocket endpoint
- `engine/src/arctis/models.py` — May need to update Market enum for dynamic symbols

### Frontend
- `app/src/App.tsx` — Wire up useMarketData, pass real data to panels
- `app/src/hooks/useMarketData.ts` — New file: REST + WebSocket hook
- `app/src/components/panels/*.tsx` — Connect to API, add useEffect data fetching
- `app/src/components/layout/Topbar.tsx` — Dynamic market pills from /api/markets
- `app/src/components/layout/HudStrip.tsx` — New component for metrics strip
- `app/src/api.ts` — Already has all fetch functions defined

## Current Iteration Context
This file is used by a Ralph Loop. Each iteration:
1. Read this PRD
2. Check current state of implementation
3. Work on the next uncompleted acceptance criterion
4. Run tests to verify
5. Mark completed criteria with [x]

When ALL acceptance criteria are checked [x] and tests pass, output:
<promise>TASK COMPLETE</promise>

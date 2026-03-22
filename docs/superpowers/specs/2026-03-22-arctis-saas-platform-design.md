# Arctis SaaS Trading Platform — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-22
**Author:** Arctis Product Team
**Status:** Ready for Ralph Loop Execution
**Scope:** 64 User Stories across 10 Epics, full backend + frontend implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Tech Stack](#tech-stack)
4. [Current State Inventory](#current-state-inventory)
5. [Performance Targets](#performance-targets)
6. [Epic 0: Foundation](#epic-0-foundation-p0)
7. [Epic 1: Live Panels](#epic-1-live-panels-p0)
8. [Epic 2: Chart Enhancements](#epic-2-chart-enhancements-p0)
9. [Epic 3: BIAS Integration](#epic-3-bias-integration-p1)
10. [Epic 4: Replay Mode](#epic-4-replay-mode-p1)
11. [Epic 5: Enhanced Live Feed](#epic-5-enhanced-live-feed-p1)
12. [Epic 6: Chart Drawing Tools](#epic-6-chart-drawing-tools-p2)
13. [Epic 7: Settings & Configuration](#epic-7-settings--configuration-p1)
14. [Epic 8: Travis MCP Integration](#epic-8-travis-mcp-integration-p2)
15. [Epic 9: Polish & UX](#epic-9-polish--ux-p1)
16. [Testing Strategy](#testing-strategy)
17. [Story Map](#story-map)

---

## Overview

Arctis is a **Trading Decision Support** web application targeting NQ (E-mini NASDAQ-100) and ES (E-mini S&P 500) futures traders. It provides contextual, data-driven market analysis without generating explicit buy/sell signals. The philosophy is: give the trader context, not commands.

### Product Goals

- Replace static demo data with live TimescaleDB-connected analysis across all panels
- Implement Kaan's full BIAS methodology as structured backend modules
- Deliver a professional-grade chart with all relevant overlays (VWAP, EMA ribbon, Volume Profile, key levels)
- Enable historical replay for trade review and methodology training
- Integrate Travis (Traivend) MCP for contextual education during live sessions

### Non-Goals

- No automated order execution or broker connectivity (Phase 1)
- No multi-user / multi-tenant architecture (Phase 1 — single-user local SaaS)
- No mobile-first UI (tablet min, desktop primary)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│  React 19 Frontend (Vite 7, TypeScript)                  │
│  Zustand global state | Lightweight Charts v5             │
│  Radix UI + Tailwind v4 | Framer Motion                  │
└────────────────────┬───────────────────────────────────┘
                     │ REST + WebSocket
┌────────────────────▼───────────────────────────────────┐
│  FastAPI Backend (Python 3.12)                           │
│  Analysis Modules | In-memory cache | Redis (optional)   │
│  WebSocket server (per-symbol channels)                  │
└────────────────────┬───────────────────────────────────┘
                     │ asyncpg / psycopg2
┌────────────────────▼───────────────────────────────────┐
│  TimescaleDB (PostgreSQL extension)                      │
│  ohlcv_1m table | symbol + timestamp index               │
│  12,300+ NQH6 bars loaded                                │
└────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Frontend fetches initial bars via `GET /api/db/bars?symbol=NQH6&days=30`
2. Frontend subscribes to `WS /ws/bars/{symbol}` for streaming updates
3. On each new bar, backend invalidates analysis cache and recalculates
4. Frontend panels poll or receive WS events for analysis updates
5. All analysis runs server-side; frontend only renders results

---

## Tech Stack

### Frontend
| Dependency | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 7 | Build tool |
| Tailwind CSS | v4 | Styling |
| Lightweight Charts | v5 | Candlestick chart |
| Radix UI | latest | Headless components |
| Framer Motion | latest | Animations |
| Lucide Icons | latest | Icon library |
| Zustand | 5 | Global state management |
| React Query | 5 | Server state + caching |

### Backend
| Dependency | Version | Role |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | 0.115+ | HTTP + WebSocket server |
| Pydantic | v2 | Data validation |
| Pandas | 2.x | Data manipulation |
| NumPy | 1.x | Numerical computation |
| SciPy | 1.x | Statistical analysis |
| asyncpg | 0.29+ | Async PostgreSQL driver |
| psycopg2 | 2.x | Sync PostgreSQL driver |
| uvicorn | latest | ASGI server |
| pytest | 8.x | Testing |

### Infrastructure
- TimescaleDB (PostgreSQL 16 + extension) on port 5532
- Docker Compose for local development
- FastAPI served on port 8000 (dev) / configurable

---

## Current State Inventory

### What Exists (Do Not Break)
- `engine/src/arctis/main.py` — FastAPI app, simulation engine, `/api/db/bars`, `/api/bars`, `/api/sim/*`
- `engine/src/arctis/db.py` — `fetch_bars()` using TimescaleDB via psycopg2 / pandas
- `engine/src/arctis/storage.py` — `ParquetStore` (legacy, being replaced by DB)
- `engine/src/arctis/analysis/` — 11 modules: confluence, discipline, indicators, patterns, probability, risk, sessions, structure, volume, volume_profile, vwap
- `engine/src/arctis/routes/analysis.py` — All `/api/analysis/*` endpoints (structure, volume, sessions, warnings, indicators, confluence, patterns)
- `engine/src/arctis/routes/risk.py` — Risk endpoints
- `engine/src/arctis/routes/probability.py` — Probability endpoints
- `app/src/components/panels/` — SessionPanel, ConfluencePanel, PatternsPanel, FeedPanel, RiskPanel (all showing static demo data)
- `app/src/components/charts/` — ArctisCandlestickChart, ChartToolbar, SimpleChart
- `app/src/components/Dashboard.tsx` — Main layout
- `app/src/components/HudBar.tsx` — Metrics strip (static)
- `app/src/components/SettingsPanel.tsx` — Settings slide-over (not wired)

### What is Broken / Missing
- Analysis endpoints load from Parquet; `_load_bars()` does not use TimescaleDB by default
- No WebSocket server exists
- Frontend panels show hardcoded demo data (no API calls)
- HUD Bar shows static values
- Settings panel not persisted
- Replay mode tied to Parquet files, not DB
- No BIAS methodology modules (velocity, auction quality, naked POC, 5-state bias, etc.)

---

## Performance Targets

| Metric | Target |
|---|---|
| Initial bar load (1 month) | < 2 seconds |
| Live update latency (DB insert → chart render) | < 100ms |
| Full confluence recalculation on new bar | < 500ms |
| Analysis endpoint p95 response time | < 300ms |
| WS reconnect time after disconnect | < 2 seconds |
| Frontend bundle size (gzipped) | < 500 KB |

---

## Epic 0: Foundation (P0)

The foundation epic ensures all backend analysis uses TimescaleDB and the frontend can receive live data via WebSocket. Nothing else in the PRD is possible without this.

---

### US-001: Connect All Analysis Endpoints to TimescaleDB

**Epic:** Epic 0 — Foundation
**Priority:** P0
**Estimate:** M
**Dependencies:** None

**Description:**
All analysis endpoints currently call `_load_bars()` which falls back to `ParquetStore` when simulation is not active. Replace this with a direct TimescaleDB fetch so that `/api/analysis/structure`, `/api/analysis/volume`, `/api/analysis/sessions`, `/api/analysis/indicators`, `/api/analysis/confluence`, and `/api/analysis/patterns` all use live DB data.

**Acceptance Criteria:**
- [ ] `_load_bars()` in `routes/analysis.py` calls `fetch_bars()` from `arctis.db` when `sim.active` is False
- [ ] `fetch_bars()` accepts a `symbol` parameter (default `"NQH6"`) and a `days` parameter
- [ ] All 6 analysis endpoints accept `symbol: str` query parameter (replacing the `Market` enum)
- [ ] Existing `Market` enum values (`NQ`, `ES`) are mapped to their front-month contract symbols (e.g., `NQH6`, `ESH6`)
- [ ] A new `GET /api/analysis/health` endpoint returns `{ "db_connected": true, "bar_count": N, "latest_bar_ts": T }` or `{ "db_connected": false, "error": "..." }`
- [ ] All endpoints return HTTP 503 with `{ "error": "Database unavailable", "fallback": false }` if TimescaleDB is unreachable (no silent fallback to Parquet)
- [ ] pytest tests pass for all 6 endpoints using a mocked `fetch_bars()`

**Technical Notes:**
- Modify `_load_bars(market, timeframe)` signature to `_load_bars(symbol: str, days: int = 30)` returning `list[Bar]`
- Convert raw DB dicts back to `Bar` pydantic model objects inside `_load_bars()`
- Keep `ParquetStore` code intact but no longer call it from live routes (only from sim routes that have no DB data)
- Add `@lru_cache(maxsize=8)` with a 30-second TTL on `fetch_bars()` to avoid redundant DB hits during panel polling

---

### US-002: Dynamic Market Selector

**Epic:** Epic 0 — Foundation
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
The frontend market selector (currently a hardcoded dropdown with NQ/ES) must dynamically discover available symbols from the database. Add a backend endpoint that queries TimescaleDB for all distinct symbols that have data, and wire this to the frontend dropdown.

**Acceptance Criteria:**
- [ ] `GET /api/markets` returns `{ "markets": [{ "symbol": "NQH6", "bar_count": 12300, "latest_ts": 1742000000, "display_name": "NQ Mar 2026" }] }`
- [ ] Display name parsing: symbol regex `([A-Z]{2})([A-Z])(\d)` → product + month letter + year digit (e.g., `NQH6` → `NQ Mar 2026`)
- [ ] Frontend `<MarketSelector>` component fetches from `/api/markets` on mount
- [ ] Selected market persists in Zustand global store (`useMarketStore`)
- [ ] Default selection is the symbol with the most recent bar (auto-detect front month)
- [ ] Changing market triggers refetch of bars and all analysis endpoints
- [ ] Empty state shown if no markets available with a "No data loaded" message

**Technical Notes:**
- SQL: `SELECT symbol, COUNT(*) as bar_count, MAX(timestamp) as latest_ts FROM ohlcv_1m GROUP BY symbol ORDER BY latest_ts DESC`
- Month letter mapping: F=Jan, G=Feb, H=Mar, J=Apr, K=May, M=Jun, N=Jul, Q=Aug, U=Sep, V=Oct, X=Nov, Z=Dec

---

### US-003: Timeframe Selector with On-the-fly Aggregation

**Epic:** Epic 0 — Foundation
**Priority:** P0
**Estimate:** M
**Dependencies:** US-001

**Description:**
The DB stores only 1-minute bars. The frontend timeframe selector must support 1m, 3m, 5m, 15m, and 30m views. Backend must aggregate 1m bars into higher timeframes on-the-fly. The chart must re-render when timeframe changes.

**Acceptance Criteria:**
- [ ] `GET /api/db/bars?symbol=NQH6&days=30&timeframe=5` returns OHLCV bars aggregated to 5-minute intervals
- [ ] Aggregation logic: open = first bar open, high = max(high), low = min(low), close = last bar close, volume = sum(volume), timestamp = first bar timestamp of the group
- [ ] Supported timeframes: 1, 3, 5, 15, 30 (minutes)
- [ ] Frontend `<TimeframeSelector>` renders buttons `1m | 3m | 5m | 15m | 30m`
- [ ] Active timeframe stored in Zustand global store (`useTimeframeStore`)
- [ ] Changing timeframe triggers chart re-render and new bar fetch
- [ ] All analysis endpoints accept optional `timeframe: int = 1` query parameter and aggregate accordingly before running analysis
- [ ] Chart candle count displayed in HUD bar updates to reflect current timeframe

**Technical Notes:**
- Aggregation can be done in Python with pandas `resample()` after fetching 1m bars from DB
- SQL-level aggregation preferred for performance: use `time_bucket('5 minutes', timestamp)` (TimescaleDB function)
- Cache aggregated bars for 60 seconds per (symbol, timeframe) combination

---

### US-004: WebSocket Endpoint for Live Bar Updates

**Epic:** Epic 0 — Foundation
**Priority:** P0
**Estimate:** L
**Dependencies:** US-001

**Description:**
Add a WebSocket server endpoint that streams new bar updates to connected clients. The hybrid approach: client fetches historical bars via REST, then subscribes to WS for streaming deltas. The WS server polls TimescaleDB every 5 seconds for bars newer than the last known timestamp.

**Acceptance Criteria:**
- [ ] `WS /ws/bars/{symbol}` endpoint exists and accepts connections
- [ ] On connect, server sends `{ "type": "connected", "symbol": "NQH6", "last_ts": T }` message
- [ ] Server polls DB every 5 seconds for bars with `timestamp > last_known_ts`
- [ ] New bars are sent as `{ "type": "bar", "bar": { "timestamp": T, "open": O, "high": H, "low": L, "close": C, "volume": V } }`
- [ ] Bar updates are also sent as `{ "type": "bar_update", "bar": {...} }` for in-progress bar modifications (last bar price update)
- [ ] On disconnect, server stops polling for that client
- [ ] Multiple clients can subscribe to the same symbol independently
- [ ] Server sends heartbeat `{ "type": "ping" }` every 30 seconds
- [ ] Server supports a `{ "type": "subscribe", "symbol": "ESH6" }` message to change subscription without reconnecting
- [ ] JSON encoding (msgpack upgrade in US-063)

**Technical Notes:**
- Use FastAPI's `WebSocket` from `fastapi` module
- Maintain per-connection state: `last_ts`, `symbol`, `task` (asyncio polling task)
- Use `asyncio.create_task()` for the polling loop; cancel on disconnect
- Connection manager class: `class WSConnectionManager` with `connect()`, `disconnect()`, `broadcast_to_symbol()` methods
- Future: replace 5s polling with PostgreSQL LISTEN/NOTIFY for true push

---

### US-005: Frontend WebSocket Hook (useMarketData)

**Epic:** Epic 0 — Foundation
**Priority:** P0
**Estimate:** M
**Dependencies:** US-004

**Description:**
Create a `useMarketData` React hook that manages the entire data lifecycle: initial REST fetch + WS subscription, reconnect logic, and Zustand state updates. All chart and panel components consume this hook rather than making their own API calls.

**Acceptance Criteria:**
- [ ] `useMarketData(symbol, timeframe)` hook returns `{ bars, isLoading, error, connectionStatus }`
- [ ] On mount: fetches initial bars via `GET /api/db/bars?symbol=X&timeframe=Y&days=30`
- [ ] After initial fetch: opens WS connection to `ws://localhost:8000/ws/bars/{symbol}`
- [ ] Incoming `bar` messages append to bars array in Zustand store
- [ ] Incoming `bar_update` messages replace the last bar in the array (for live bar ticking)
- [ ] `connectionStatus` is one of `"connecting" | "connected" | "disconnected" | "error"`
- [ ] Reconnect logic: exponential backoff starting at 1s, max 30s, max 10 attempts
- [ ] On symbol or timeframe change: closes current WS, fetches new initial bars, opens new WS
- [ ] Memory management: bars array capped at 10,000 entries (FIFO trim)
- [ ] Hook is stable across React strict mode double-invocation

**Technical Notes:**
- Use `useRef` for WS instance to avoid stale closure issues
- Zustand store: `useBarsStore` with `{ bars: Bar[], appendBar(bar), updateLastBar(bar), clearBars() }`
- Use `useEffect` cleanup to close WS on unmount
- WS URL constructed from an env variable `VITE_API_WS_URL` (default `ws://localhost:8000`)

---

## Epic 1: Live Panels (P0)

Replace all static demo data in the 5 sidebar panels with live API connections. Each panel must handle loading, error, and empty states gracefully.

---

### US-006: Session Panel — Live Data

**Epic:** Epic 1 — Live Panels
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
The Session Panel currently shows hardcoded session data. Wire it to `GET /api/analysis/sessions` and automatically highlight the current active session. The panel must update when a new session boundary is crossed (e.g., transitions from Asia → London → NY Open).

**Acceptance Criteria:**
- [ ] `SessionPanel` fetches from `/api/analysis/sessions?symbol={symbol}&timeframe={timeframe}` on mount
- [ ] Current session name displayed prominently (Asia / London / NY Morning / NY Afternoon / Overnight)
- [ ] Session stats shown: bar count, avg volume, avg range, total volume
- [ ] Current session row highlighted with accent color
- [ ] Auto-refreshes every 60 seconds to detect session transitions
- [ ] Session transition detected: panel briefly animates to draw attention (framer motion pulse)
- [ ] Loading skeleton shown while fetching (see US-059)
- [ ] Error state shown with retry button if endpoint fails

**Technical Notes:**
- Session boundary times (UTC): Asia 21:00-02:00, London 02:00-08:00, NY Morning 13:30-16:00, NY Afternoon 16:00-20:00, Overnight rest
- Backend `classify_session()` already handles this; just wire the frontend

---

### US-007: Confluence Panel — Live Score

**Epic:** Epic 1 — Live Panels
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
The Confluence Panel must show a live directional score from `/api/analysis/confluence`. The score is a number from 0-100 indicating bullish/bearish confluence across all indicators. Update on every new bar (triggered via WS bar event).

**Acceptance Criteria:**
- [ ] `ConfluencePanel` fetches from `/api/analysis/confluence?symbol={symbol}&timeframe={timeframe}`
- [ ] Displays: overall score (0–100), direction (bullish/bearish/neutral), confidence percentage
- [ ] Individual signal list: each signal shows name, direction arrow, strength bar, detail text
- [ ] Score displayed as a gauge/progress arc (CSS or SVG, no external lib)
- [ ] Color coding: score > 65 = green, 35–65 = yellow, < 35 = red
- [ ] Triggers re-fetch when `useBarsStore` bar count changes (i.e., new bar received)
- [ ] Debounced re-fetch: minimum 500ms between requests to avoid hammering backend
- [ ] Shows last-updated timestamp below the score

**Technical Notes:**
- Subscribe to Zustand `useBarsStore` bar count change to trigger refetch
- Use React Query `useQuery` with `staleTime: 0` and manual `refetch()` call on bar count change

---

### US-008: Patterns Panel — Live Patterns

**Epic:** Epic 1 — Live Panels
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
The Patterns Panel must show currently detected patterns from `/api/analysis/patterns`. Active patterns (within last 3 bars) must be visually distinguished from historical patterns.

**Acceptance Criteria:**
- [ ] `PatternsPanel` fetches from `/api/analysis/patterns?symbol={symbol}&timeframe={timeframe}`
- [ ] Each pattern row shows: pattern name, direction, confidence %, win rate %, category badge, relative time
- [ ] Active patterns (timestamp within last 3 bars' time range) shown with a pulsing indicator
- [ ] Pattern categories: MOMENTUM, REVERSAL, STRUCTURE, VOLUME — each with distinct color
- [ ] Day type and day bias from response shown at the top of the panel
- [ ] Patterns sorted by timestamp descending (newest first)
- [ ] "No patterns detected" empty state with gray icon
- [ ] Re-fetch on new bar (same debounce as US-007)
- [ ] Clicking a pattern row emits a `patternFocus` event that the chart can respond to (US-044)

**Technical Notes:**
- Pattern confidence encoded as a small colored bar (green gradient based on value)
- Win rate shown with a trophy icon and % — tooltip explains "historical win rate from research"

---

### US-009: Feed Panel — Real Events

**Epic:** Epic 1 — Live Panels
**Priority:** P0
**Estimate:** M
**Dependencies:** US-001, US-007, US-008

**Description:**
The Feed Panel must aggregate real events from all analysis endpoints and display them as a timestamped, severity-colored event stream. Events are collected client-side from the results of multiple endpoint polls, not a separate event endpoint (that comes in Epic 5).

**Acceptance Criteria:**
- [ ] `FeedPanel` displays a scrollable list of events, newest at top
- [ ] Events generated from: new patterns (from patterns endpoint), structure breaks (from structure endpoint), volume spikes (from volume endpoint), session changes (from sessions endpoint)
- [ ] Each event has: icon, severity badge (INFO / WARN / ALERT), text, relative timestamp
- [ ] Severity color coding: INFO = blue, WARN = orange, ALERT = red
- [ ] Events persist across refreshes within the same browser session (sessionStorage, max 200 events)
- [ ] New events pulse briefly before settling in the list (Framer Motion)
- [ ] Feed auto-scrolls to top when new events arrive if user is already at top; otherwise shows "N new events" banner
- [ ] Manual "Clear Feed" button in panel header

**Technical Notes:**
- Feed event generation logic lives in a `useFeedEvents` hook
- Event deduplication by `(type, timestamp, price)` composite key
- Events older than 24 hours are pruned from the list

---

### US-010: Risk Panel — Connected to Config and Daily Check

**Epic:** Epic 1 — Live Panels
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001, US-053

**Description:**
The Risk Panel must be wired to `/api/config` (for account settings) and `/api/risk/daily-check` (for daily risk state). It must reflect the user's configured risk parameters and current usage.

**Acceptance Criteria:**
- [ ] `RiskPanel` fetches risk config from `/api/config` on mount
- [ ] `RiskPanel` fetches daily check from `/api/risk/daily-check?symbol={symbol}` on mount and every 60 seconds
- [ ] Displays: account size, risk per trade ($), daily loss limit, current daily P&L (if available), trades taken today
- [ ] Risk status indicator: GREEN (within limits) / YELLOW (approaching limit, >75% used) / RED (limit reached or exceeded)
- [ ] "Daily loss limit reached" banner shown prominently in red if triggered
- [ ] Trade count progress bar: `trades_today / max_trades_per_day`
- [ ] If risk config is not set, show "Configure risk settings" prompt linking to Settings panel

**Technical Notes:**
- Risk panel state does not need real-time P&L (no broker connection); it shows configured limits as static reference
- Daily check endpoint provides warnings from discipline module

---

### US-011: HUD Metrics Strip — Live Values

**Epic:** Epic 1 — Live Panels
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001, US-005

**Description:**
The HUD Bar below the topbar displays quick-reference metrics. All values must be live, derived from the latest bar and analysis endpoints.

**Acceptance Criteria:**
- [ ] HUD shows: RVOL (relative volume ratio), RSI (14-period), EMA Alignment (bullish/neutral/bearish), VWAP Position (above/below), Current Session, Bar Count, Last Price
- [ ] Values update every time a new bar is received via WebSocket (from `useBarsStore`)
- [ ] RVOL: shows ratio (e.g., "1.8x") with color — > 1.5 = green, 0.8–1.5 = white, < 0.8 = gray
- [ ] RSI: shows value with color — > 70 = red (overbought), 30–70 = white, < 30 = green (oversold)
- [ ] EMA alignment: arrow up (bullish), dash (neutral), arrow down (bearish) with colors
- [ ] VWAP Position: "Above VWAP" in green or "Below VWAP" in red
- [ ] Values derived from the last items in VWAP/EMA/RSI arrays from `/api/analysis/indicators`
- [ ] HUD refreshes indicators endpoint every new bar (same debounce pattern as panels)

**Technical Notes:**
- HUD uses data from `useIndicatorsQuery` hook (React Query)
- RSI and RVOL can also be computed client-side from bars array to avoid extra API call

---

## Epic 2: Chart Enhancements (P0)

Add professional trading overlays to the Lightweight Charts candlestick chart. All overlays must be toggleable from the chart toolbar.

---

### US-012: VWAP Overlay with Standard Deviation Bands

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** M
**Dependencies:** US-001

**Description:**
Add VWAP line and ±1 and ±2 standard deviation bands to the chart as line series overlays. Data comes from `/api/analysis/indicators`.

**Acceptance Criteria:**
- [ ] VWAP line rendered as a solid blue line series on the chart
- [ ] +1 SD band: dashed line, lighter blue
- [ ] -1 SD band: dashed line, lighter blue (symmetric)
- [ ] +2 SD band: dashed line, even lighter / gray
- [ ] -2 SD band: dashed line, even lighter / gray
- [ ] All band pairs form a shaded area between them (using LineSeries + area fill if supported, otherwise manual CSS)
- [ ] VWAP toggle button in `ChartToolbar` — default ON
- [ ] SD bands toggle separately from VWAP line — default ON when VWAP is ON
- [ ] VWAP resets at session boundaries (uses intraday VWAP, not cumulative)
- [ ] Overlays update when new bar received (re-fetch indicators endpoint)

**Technical Notes:**
- Lightweight Charts v5 supports multiple `LineSeries` on the same chart instance
- VWAP data already returned from `/api/analysis/indicators` with `vwap`, `upper_1`, `lower_1`, `upper_2`, `lower_2` per timestamp
- Use `createLineSeries()` for each band; set `lineStyle: LineStyle.Dashed` for SD bands

---

### US-013: EMA Ribbon Overlay

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
Render three EMA lines (9, 21, 50) as colored overlays on the chart. Color the ribbon based on alignment state.

**Acceptance Criteria:**
- [ ] EMA 9 line: bright orange, solid, lineWidth 1
- [ ] EMA 21 line: yellow, solid, lineWidth 1
- [ ] EMA 50 line: white/gray, solid, lineWidth 1.5
- [ ] When alignment is "bullish" (9 > 21 > 50): all lines shift to green tones
- [ ] When alignment is "bearish" (9 < 21 < 50): all lines shift to red tones
- [ ] When alignment is "neutral": neutral colors as above
- [ ] Toggle button in `ChartToolbar` — default ON
- [ ] EMA data from `/api/analysis/indicators` `ema` array
- [ ] Tooltip on chart hover shows EMA values in the crosshair data

**Technical Notes:**
- Alignment coloring can be applied per data point (each series point can have a color property in LWC v5)
- EMA 50 must have at least 50 bars loaded before it renders (partial data shown with opacity)

---

### US-014: Volume Profile Sidebar

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** M
**Dependencies:** US-001

**Description:**
Render Point of Control (POC), Value Area High (VAH), and Value Area Low (VAL) as horizontal price lines on the chart, with a simplified volume histogram rendered in the price axis margin.

**Acceptance Criteria:**
- [ ] POC: horizontal dashed line, bright red/orange, with label "POC {price}"
- [ ] VAH: horizontal dotted line, light yellow, with label "VAH {price}"
- [ ] VAL: horizontal dotted line, light yellow, with label "VAL {price}"
- [ ] Price lines use LWC `createPriceLine()` on the candlestick series
- [ ] Volume histogram rendered as thin horizontal bars in the right chart margin (10% of chart width)
- [ ] Histogram shows relative volume at each price level (bar width proportional to volume)
- [ ] Value Area zone (VAL to VAH) shaded with semi-transparent fill
- [ ] Toggle button in `ChartToolbar` — default ON
- [ ] Updates on new bar or timeframe change

**Technical Notes:**
- LWC does not natively support sideways histograms; render the VP histogram as an HTML canvas overlay positioned absolutely over the chart's right edge
- VP data from `/api/analysis/indicators` `volume_profile` object
- `build_volume_profile()` in backend must return per-price-level volume data, not just summary — update the backend response to include `levels: [{ price, volume }]`

---

### US-015: Session Separators

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
Draw vertical lines on the chart at session boundary timestamps: NY Open (13:30 UTC), Midday (16:00 UTC), Power Hour / NY Close (20:00 UTC), and Asia Open (21:00 UTC).

**Acceptance Criteria:**
- [ ] Vertical lines rendered for each session boundary visible in the current chart range
- [ ] Each boundary has a distinct color: NY Open = cyan, Midday = gray, NY Close = orange, Asia = purple
- [ ] Small text label at the top of each vertical line: "NY Open", "Midday", "NY Close", "Asia"
- [ ] Lines rendered using LWC `createLineSeries()` with single data points or via custom marker API
- [ ] Toggle button in `ChartToolbar` — default ON
- [ ] Labels adapt to chart zoom (hidden when bars are too dense to show labels)

**Technical Notes:**
- Session boundary timestamps are calculated client-side from the bars array (find the first bar at or after the boundary time each day)
- Use LWC `ISeriesMarker` approach or vertical price lines at timestamp positions

---

### US-016: Previous Day Levels

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
Display Previous Day High (PDH), Previous Day Low (PDL), and Previous Day Close (PDC) as dashed horizontal lines that reset each trading day.

**Acceptance Criteria:**
- [ ] PDH: dashed line, green, label "PDH {price}"
- [ ] PDL: dashed line, red, label "PDL {price}"
- [ ] PDC: dashed dotted line, gray, label "PDC {price}"
- [ ] Lines only shown during the current trading day's bars (not on historical days they reference)
- [ ] Data sourced from `/api/analysis/indicators` `session_levels.prev_high`, `prev_low`, `prev_close`
- [ ] Toggle in ChartToolbar — default ON
- [ ] Hovering the price line shows tooltip with date of the previous day

**Technical Notes:**
- Use `createPriceLine()` from LWC for static horizontal lines with labels

---

### US-017: Opening Range Box

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
Display the Opening Range (first 30 minutes of NY session, 13:30–14:00 UTC) as a semi-transparent colored rectangle on the chart.

**Acceptance Criteria:**
- [ ] OR High and OR Low rendered as horizontal dashed lines with labels "ORH" and "ORL"
- [ ] The zone between ORH and ORL filled with a semi-transparent rectangle (background box)
- [ ] Box color: yellow/gold with 15% opacity
- [ ] Data from `/api/analysis/indicators` `session_levels.opening_range_high` and `opening_range_low`
- [ ] Toggle in ChartToolbar — default ON
- [ ] If OR data is not yet available (before 14:00 UTC), lines not shown

**Technical Notes:**
- LWC does not natively support rectangles; implement as an HTML canvas overlay or use a `LineSeries` with area fill between the two levels
- Alternatively: use two price lines + a band series

---

### US-018: BOS/CHoCH Markers

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** M
**Dependencies:** US-001

**Description:**
Render Break of Structure (BOS) and Change of Character (CHoCH) labels on the chart at the bar where each event occurred. Data from `/api/analysis/structure`.

**Acceptance Criteria:**
- [ ] BOS bullish: upward triangle marker, green, text "BOS" below bar
- [ ] BOS bearish: downward triangle marker, red, text "BOS" above bar
- [ ] CHoCH bullish: upward arrow marker, bright green, text "CHoCH" below bar
- [ ] CHoCH bearish: downward arrow marker, bright red, text "CHoCH" above bar
- [ ] Markers rendered using LWC `setMarkers()` on the candlestick series
- [ ] Toggle in ChartToolbar — default ON
- [ ] Max 20 most recent markers shown to avoid visual clutter
- [ ] Clicking a marker emits a `structureFocus` event (timestamp) that feeds into the Feed panel linking

**Technical Notes:**
- `detect_structure_breaks()` returns `break_type` (BOS/CHoCH), `direction`, `price`, `timestamp`
- LWC marker `position`: `"belowBar"` for bullish, `"aboveBar"` for bearish
- LWC marker `shape`: use `"arrowUp"` / `"arrowDown"` or `"circle"` as fallback

---

### US-019: Pattern Markers and Range Boxes

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** M
**Dependencies:** US-001, US-008

**Description:**
Render pattern annotations from `/api/analysis/patterns` on the chart: ORB range box, IB (Initial Balance) range box, trend day labels, and other pattern markers.

**Acceptance Criteria:**
- [ ] Each pattern annotation rendered at its timestamp with the appropriate `marker_type` from the API response
- [ ] ORB range: box from ORH to ORL for the first 30 minutes, semi-transparent gold
- [ ] IB range: box from IB High to IB Low for first hour, semi-transparent blue
- [ ] Trend day label: text annotation at NY open bar: "Trend Day" or "Range Day"
- [ ] All other patterns: marker at the bar timestamp with pattern `text` label (abbreviated) and `color` from API
- [ ] Toggle in ChartToolbar ("Patterns" toggle) — default ON
- [ ] Pattern confidence shown as marker size (higher confidence = larger marker, 3 sizes: S/M/L)

**Technical Notes:**
- Patterns endpoint already returns `marker_type`, `color`, `text`, `timestamp`, `price`
- Map marker types: "label" → text marker, "box" → rectangle overlay, "arrow_up"/"arrow_down" → LWC arrows

---

### US-020: Probability Target Zone

**Epic:** Epic 2 — Chart Enhancements
**Priority:** P0
**Estimate:** S
**Dependencies:** US-001

**Description:**
Render a shaded probability target zone on the chart from `/api/analysis/probability`. Shows the statistically probable range for the current bar's move.

**Acceptance Criteria:**
- [ ] Probability zone rendered as a semi-transparent rectangle from `target_low` to `target_high` price levels
- [ ] Zone color: blue with 20% opacity for neutral, green-tinted for bullish bias, red-tinted for bearish bias
- [ ] Label in zone: "Target Zone ({probability}%)"
- [ ] Zone updates on new bar received
- [ ] If confidence is below 40%, zone is rendered with dashed border and muted colors
- [ ] Toggle in ChartToolbar — default ON (can be turned off for cleaner view)

**Technical Notes:**
- `/api/analysis/probability` endpoint already exists; check its response schema and map to chart coordinates
- Use canvas overlay or LWC band series for the shaded zone

---

## Epic 3: BIAS Integration (P1)

Implement Kaan's full BIAS trading methodology as structured backend analysis modules and a dedicated frontend panel. These modules formalize the approach from the BIAS repo and Traivend education.

---

### US-021: Velocity Module

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-001

**Description:**
Implement a velocity analysis module that measures the speed of price movement relative to historical average. Velocity is a key BIAS concept: high velocity moves are directional, low velocity moves are rotational/ranging.

**Acceptance Criteria:**
- [ ] New file: `engine/src/arctis/analysis/velocity.py`
- [ ] `calculate_velocity(bars, window=20)` function returns `VelocityResult` per bar
- [ ] `VelocityResult` fields: `timestamp`, `current_velocity`, `avg_velocity`, `ratio` (float, 0+), `score` (int, 1–10), `classification` (str: "schnell" / "normal" / "langsam")
- [ ] Velocity definition: points moved per bar = abs(close - open) for each bar; current = last N bars avg; historical = rolling window avg
- [ ] Ratio = current_velocity / avg_velocity; score mapped: ratio >2.0=10, 1.5-2.0=8-9, 1.0-1.5=5-7, 0.5-1.0=2-4, <0.5=1
- [ ] Classification: score 7–10 = "schnell", 4–6 = "normal", 1–3 = "langsam"
- [ ] `GET /api/analysis/velocity?symbol=NQH6&timeframe=1&window=20` returns latest velocity result
- [ ] pytest tests for velocity calculation edge cases (empty bars, all-same-close, volatile spikes)

**Technical Notes:**
- Contextual window: use `window=20` bars by default (20 bars = ~20 minutes on M1)
- Velocity should exclude doji bars (abs(close-open) < 0.25 points) from the average to avoid noise

---

### US-022: Auction Quality Module

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-001

**Description:**
Implement auction quality analysis, a BIAS concept measuring whether price is efficiently trading through a range or rejecting it. High auction quality = directional participation; low = rejection/fade signal.

**Acceptance Criteria:**
- [ ] New file: `engine/src/arctis/analysis/auction.py`
- [ ] `calculate_auction_quality(bars, lookback=5)` returns `AuctionResult`
- [ ] `AuctionResult` fields: `timestamp`, `traded_ticks`, `total_ticks`, `efficiency_ratio` (0.0–1.0), `quality` (str: "sauber" / "moderat" / "schlecht")
- [ ] `traded_ticks`: number of unique price ticks actually printed within the bar range (approximated as volume / range * constant)
- [ ] `total_ticks`: total possible ticks in the bar range = (high - low) / tick_size
- [ ] `efficiency_ratio` = traded_ticks / total_ticks clamped to [0, 1]
- [ ] Quality: ratio > 0.7 = "sauber", 0.4–0.7 = "moderat", < 0.4 = "schlecht"
- [ ] `GET /api/analysis/auction-quality?symbol=NQH6&timeframe=1&lookback=5` returns result for last `lookback` bars aggregated
- [ ] Tick size configurable per symbol: NQ = 0.25, ES = 0.25

**Technical Notes:**
- Since tick-level data is not in DB, efficiency_ratio is approximated from OHLCV
- More accurate: use close distribution across `lookback` bars — how evenly did price distribute?
- Alternative definition: efficiency = net_displacement / total_path where total_path = sum of |close-open| per bar

---

### US-023: Naked POC Tracker

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-001, US-014

**Description:**
Track Point of Control (POC) prices from previous sessions that have never been retested. These "naked POCs" act as price magnets and are key BIAS reference levels.

**Acceptance Criteria:**
- [ ] New file: `engine/src/arctis/analysis/naked_poc.py`
- [ ] `find_naked_pocs(bars, lookback_days=5)` returns `list[NakedPOC]`
- [ ] `NakedPOC` fields: `price`, `date` (ISO date of the session), `days_unretested` (int), `is_above_current` (bool)
- [ ] A POC is "naked" if current price has not printed within 2 ticks of the POC price since the session it was formed
- [ ] A POC becomes "tested" when current price comes within 2 ticks and is removed from the list
- [ ] `GET /api/analysis/naked-pocs?symbol=NQH6&lookback_days=5` returns current naked POCs
- [ ] Frontend renders naked POC lines on chart (see US-032)
- [ ] Naked POCs sorted by days_unretested descending (oldest = most significant magnet)
- [ ] Max 10 naked POCs tracked (prune oldest beyond 5 trading days)

**Technical Notes:**
- Calculate daily POC: split bars into trading days, run `build_volume_profile()` per day
- "Retest" detection: scan subsequent bars for any bar where `low <= poc_price + 2*tick_size AND high >= poc_price - 2*tick_size`

---

### US-024: 5-Bias-State System

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-021, US-022

**Description:**
Implement the 5-state market bias classification system that replaces the existing 3-state (bullish/neutral/bearish) system. The 5 states provide more nuanced directional context.

**Acceptance Criteria:**
- [ ] New enum in `engine/src/arctis/analysis/bias_state.py`: `BiasState` with values `LONG | RANGE_LONG | RANGE | RANGE_SHORT | SHORT`
- [ ] `classify_bias_state(bars, velocity, auction_quality, trend, session) -> BiasState`:
  - `LONG`: strong trend up + high velocity + bullish EMA alignment
  - `RANGE_LONG`: mild bullish bias within range, velocity normal-low, above VWAP
  - `RANGE`: no clear direction, low velocity, inside value area
  - `RANGE_SHORT`: mild bearish bias within range, velocity normal-low, below VWAP
  - `SHORT`: strong trend down + high velocity + bearish EMA alignment
- [ ] State transitions are hysteretic (requires 3 bars of confirmation to change state, avoids whipsawing)
- [ ] `GET /api/analysis/bias-state?symbol=NQH6` returns `{ "state": "RANGE_LONG", "confidence": 0.72, "bars_in_state": 14 }`
- [ ] State history tracked: last 10 state transitions with timestamps
- [ ] pytest tests with synthetic bar sequences for each state

**Technical Notes:**
- Hysteresis: maintain a rolling state buffer; only emit new state if 3 consecutive classifications agree
- Inputs: EMA alignment from `calculate_ema_ribbon()`, VWAP position from `calculate_vwap()`, velocity from `calculate_velocity()`

---

### US-025: Bias-Switch-Level

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-023, US-024

**Description:**
Calculate the single most important daily price level that, if breached, flips the market bias. This is a key BIAS concept. The level follows a priority hierarchy.

**Acceptance Criteria:**
- [ ] New function `calculate_bias_switch_level(bars, naked_pocs, session_levels, key_levels) -> BiasSwitchLevel`
- [ ] `BiasSwitchLevel` fields: `price`, `level_type` (str), `direction` (str: "flip_bullish_above" / "flip_bearish_below"), `confidence` (0.0–1.0)
- [ ] Priority hierarchy (highest to lowest):
  1. Strukturpunkt (recent BOS/CHoCH level)
  2. Bodenbildung (multi-touch support/resistance formed this session)
  3. Schluesselzone (key level zone from US-029)
  4. Asia-Extrem (overnight high or low)
- [ ] Only ONE level returned (highest priority available)
- [ ] `GET /api/analysis/bias-switch-level?symbol=NQH6` returns the current switch level
- [ ] Level displayed on chart as a thick dashed horizontal line (see US-032)
- [ ] Bias Panel shows switch level prominently (see US-031)

**Technical Notes:**
- Strukturpunkt: take the last BOS level from structure module
- Bodenbildung: find price levels with 2+ touches within the current session ±2 ticks
- Asia-Extrem: overnight high if below current price (resistance), overnight low if above (support)

---

### US-026: Opening Fake Detection

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-001, US-025

**Description:**
Detect Opening Fake setups: when price breaks the previous day's extreme (high or low) at the open but fails to follow through within the first 2 hours of NY session.

**Acceptance Criteria:**
- [ ] New function `detect_opening_fake(bars, session_levels) -> OpeningFakeResult | None`
- [ ] `OpeningFakeResult` fields: `detected` (bool), `direction` (str: "long_fake" / "short_fake"), `break_price`, `return_price`, `timestamp`, `confidence`
- [ ] Detection logic:
  1. Find first bar after NY Open (13:30 UTC) that breaches `prev_high` (short fake) or `prev_low` (long fake)
  2. Within next 120 bars (2 hours on M1), check if price returns to inside prev day range
  3. If yes: Opening Fake confirmed
- [ ] Result added to patterns endpoint response with category "FAKE"
- [ ] `GET /api/analysis/opening-fake?symbol=NQH6&date=2026-03-21` returns daily result
- [ ] Fake marker on chart: double-headed arrow or label "OFake ↑" or "OFake ↓" at the break bar
- [ ] pytest test with synthetic bar data covering fake detected and no-fake cases

**Technical Notes:**
- "No follow-through" definition: within 2h, price does not extend more than 1x the ATR(14) beyond the fake break point
- False positive filter: only mark as fake if return move is at least 50% of the fake extension

---

### US-027: Double Fake Exhaustion

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-021, US-026

**Description:**
Detect Double Fake Exhaustion setups: two consecutive fakes at the same extreme with declining velocity and rejection volume. This is a high-confidence reversal pattern from Kaan's BIAS strategy (PF=2.24, 63.6% win rate).

**Acceptance Criteria:**
- [ ] New function `detect_double_fake(bars, velocity_series, session_levels) -> DoubleFakeResult | None`
- [ ] `DoubleFakeResult` fields: `detected`, `direction`, `fake1_timestamp`, `fake2_timestamp`, `extreme_price`, `velocity_decline_pct`, `confidence`
- [ ] Detection logic:
  1. First fake: price breaks extreme, returns (same as US-026)
  2. Second fake: within 30 bars of first fake return, price breaks same extreme again
  3. Velocity of second fake < velocity of first fake (declining — exhaustion)
  4. Volume on second fake break bar > 1.5x average (rejection volume)
  5. Both conditions met → Double Fake Exhaustion confirmed
- [ ] `velocity_decline_pct`: how much velocity dropped between fakes (e.g., -30%)
- [ ] Result added to patterns endpoint with category "EXHAUSTION"
- [ ] Chart marker: "2xFake" with arrow at second fake bar
- [ ] Best config from BIAS repo used as defaults: min_fakes=3 concept adapted (here using 2 fakes as minimum)

**Technical Notes:**
- Uses velocity data from `calculate_velocity()` (US-021) — must pass velocity series as parameter
- Confidence formula: `base_conf = 0.6; if velocity_decline > 30%: conf += 0.15; if rejection_volume: conf += 0.15; if both fakes within 20 bars: conf += 0.1`

---

### US-028: 60% Correction Monitor

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** S
**Dependencies:** US-001

**Description:**
Track the depth of price corrections. A correction exceeding 60% of the prior move is a structure threat (BIAS concept: "tiefe Korrektur gefaehrdet die Struktur").

**Acceptance Criteria:**
- [ ] New function `monitor_correction(bars, swings) -> CorrectionResult`
- [ ] `CorrectionResult` fields: `correction_pct` (0–100), `is_structure_threat` (bool, triggered at >60%), `prior_move_size`, `correction_size`, `direction` (str: "bull_correction" / "bear_correction")
- [ ] Prior move: distance from last swing low to last swing high (or vice versa for downtrend)
- [ ] Correction: distance from the swing extreme to current price (against the trend)
- [ ] `GET /api/analysis/correction?symbol=NQH6` returns current correction state
- [ ] If `is_structure_threat=True`, Feed Panel emits a WARN event: "60%+ Correction — Struktur gefaehrdet"
- [ ] HUD Bar shows correction percentage with color coding: < 40% = green, 40–60% = yellow, > 60% = red

**Technical Notes:**
- Swings from `detect_swings()` provide the prior move reference
- Update on every new bar; inexpensive calculation

---

### US-029: Key Level Identification

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-001, US-023

**Description:**
Identify and persist key price zones that have been respected for 3+ consecutive trading days. These zones never expire and act as strong support/resistance in the BIAS framework.

**Acceptance Criteria:**
- [ ] New function `find_key_levels(bars, min_days=3, tolerance_ticks=4) -> list[KeyLevel]`
- [ ] `KeyLevel` fields: `price_zone_low`, `price_zone_high`, `days_respected` (int), `touch_count` (int), `first_seen` (ISO date), `is_above_current` (bool)
- [ ] A level is identified when the same price zone (within `tolerance_ticks`) has been touched and held on 3+ different calendar days
- [ ] "Touched and held" means: price came within the tolerance zone and reversed without closing beyond it
- [ ] Key levels persist in a JSON file `data/key_levels_{symbol}.json` (or DB table if available)
- [ ] `GET /api/analysis/key-levels?symbol=NQH6` returns all persisted key levels
- [ ] Levels rendered on chart as shaded zones (see US-032)
- [ ] `days_respected` increments each day the zone holds; does not expire (by design)
- [ ] Level is invalidated (removed) when price closes 3x through the zone on a single bar

**Technical Notes:**
- Cluster nearby swing points: if multiple swing highs/lows within `tolerance_ticks`, merge into a zone
- "Close beyond" invalidation: `close < zone_low - 2*tick_size` (for resistance zones)

---

### US-030: Daily Bias Endpoint

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-021 through US-029

**Description:**
Create a unified `/api/analysis/daily-bias` endpoint that aggregates all BIAS module outputs into a single structured response. This is the primary data source for the Bias Panel (US-031).

**Acceptance Criteria:**
- [ ] `GET /api/analysis/daily-bias?symbol=NQH6` returns a comprehensive BIAS summary
- [ ] Response schema:
  ```json
  {
    "bias_state": "RANGE_LONG",
    "state_confidence": 0.72,
    "bars_in_state": 14,
    "velocity": { "score": 6, "ratio": 1.2, "classification": "normal" },
    "auction_quality": { "efficiency_ratio": 0.65, "quality": "moderat" },
    "bias_switch_level": { "price": 19540.0, "level_type": "Strukturpunkt", "direction": "flip_bearish_below" },
    "correction": { "correction_pct": 38.5, "is_structure_threat": false },
    "opening_fake": { "detected": false },
    "double_fake": { "detected": false },
    "naked_pocs": [{ "price": 19475.0, "days_unretested": 2, "is_above_current": false }],
    "key_levels": [{ "price_zone_low": 19400.0, "price_zone_high": 19420.0, "days_respected": 5 }],
    "calculated_at": 1742000000
  }
  ```
- [ ] Endpoint calculates all BIAS submodules in parallel using `asyncio.gather()`
- [ ] Response cached for 30 seconds (invalidated on new bar)
- [ ] Error in any submodule returns partial response with `"error": "module_name: reason"` per module

**Technical Notes:**
- Wrap each submodule call in `try/except` to prevent one failure from killing the entire response
- Total calculation time target: < 300ms for all modules combined

---

### US-031: Bias Panel (Frontend)

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-030

**Description:**
Create a dedicated "Bias Panel" in the sidebar that prominently displays the current BIAS state, switch level, velocity, and auction quality. This is the primary decision-support panel for BIAS traders.

**Acceptance Criteria:**
- [ ] New component: `app/src/components/panels/BiasPanel.tsx`
- [ ] Prominent bias state badge at top: full-width colored badge with state name (5-state system)
  - LONG = solid green, RANGE_LONG = green/yellow, RANGE = gray, RANGE_SHORT = yellow/red, SHORT = solid red
- [ ] Bias Switch Level displayed with price and level type: "Switch Level: 19540.0 (Strukturpunkt)"
- [ ] Velocity section: score (1–10 gauge), ratio, classification with icon
- [ ] Auction Quality section: efficiency ratio bar, quality classification
- [ ] Correction depth: percentage bar, threat indicator
- [ ] Active fakes section: "Opening Fake: detected ✓" or "—"
- [ ] Double Fake: same pattern
- [ ] Bias panel is pinned in the sidebar (always visible) above Confluence Panel
- [ ] Re-fetches from `/api/analysis/daily-bias` every new bar or every 30 seconds
- [ ] Transition animation when bias state changes (flash + color transition, 1.5s)

**Technical Notes:**
- State badge color transitions use Framer Motion `AnimatePresence` with key on bias_state value
- Velocity gauge: a 1–10 scale rendered as a small segmented bar (10 segments, filled up to score)

---

### US-032: Chart Overlays for BIAS Levels

**Epic:** Epic 3 — BIAS Integration
**Priority:** P1
**Estimate:** M
**Dependencies:** US-023, US-025, US-029, US-031

**Description:**
Add chart overlays for all BIAS-specific levels: Naked POC lines, Bias-Switch-Level line, and Key Level zones.

**Acceptance Criteria:**
- [ ] Naked POC lines: solid thin lines, color coded by age (fresh = orange, 1 day = yellow, 2+ days = gray), label "nPOC {price} ({days}d)"
- [ ] Bias Switch Level: thick dashed line, bright white/gold, label "Switch {price}" with direction arrow
- [ ] Key Level zones: semi-transparent rectangle between zone_low and zone_high, purple/violet fill, label "Key Zone"
- [ ] All three types togglable separately in ChartToolbar
- [ ] Default: Bias Switch Level ON, Naked POCs ON, Key Levels ON
- [ ] Updates when `/api/analysis/daily-bias` response changes
- [ ] Naked POC line disappears when that POC gets retested (removed from API response)

**Technical Notes:**
- Bias Switch Level uses `createPriceLine()` with custom `lineWidth: 2`, `lineStyle: LineStyle.Dashed`
- Key Level zones use canvas overlay (same approach as Volume Profile histogram in US-014)

---

## Epic 4: Replay Mode (P1)

Refactor the existing simulation/replay system to use TimescaleDB data, and add a professional replay UI with timeline scrubber, transport controls, and panel synchronization.

---

### US-033: Replay Engine Refactor

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** M
**Dependencies:** US-001

**Description:**
Replace the current `Simulation` class (which loads from Parquet) with a `ReplayEngine` that uses TimescaleDB. The engine must support any historical date range, not just pre-loaded Parquet files.

**Acceptance Criteria:**
- [ ] New class `ReplayEngine` in `engine/src/arctis/replay.py` replacing `Simulation` in `main.py`
- [ ] `ReplayEngine.load(symbol, date)` fetches all bars for a given trading day from TimescaleDB
- [ ] `ReplayEngine.seek(bar_index)` positions the playhead at a specific bar
- [ ] `ReplayEngine.get_visible_bars()` returns bars up to the current playhead position
- [ ] `ReplayEngine.get_current_ts()` returns the timestamp of the current playhead bar
- [ ] `POST /api/replay/load?symbol=NQH6&date=2026-03-15` loads a specific day into replay engine
- [ ] `POST /api/replay/seek?bar_index=150` seeks to a bar index
- [ ] `GET /api/replay/status` returns `{ "active": bool, "date": str, "bar_index": int, "total_bars": int, "speed": float, "current_ts": int }`
- [ ] Legacy `/api/sim/*` endpoints remain but proxy to new ReplayEngine (backward compat)
- [ ] pytest tests for load, seek, and visible_bars behavior

**Technical Notes:**
- "Trading day" definition: bars between 21:00 UTC previous day and 20:59 UTC current day (US futures session)
- `fetch_bars()` with `start_ts` and `end_ts` parameters for precise date range fetching

---

### US-034: Replay Timeline Scrubber

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** M
**Dependencies:** US-033

**Description:**
Replace the placeholder replay progress bar with a full-featured timeline scrubber showing session segments, pattern events, and a draggable playhead.

**Acceptance Criteria:**
- [ ] Full-width timeline bar spanning the bottom of the chart area
- [ ] Timeline segmented by session: Asia (purple), London (blue), NY Morning (cyan), NY Afternoon (orange) — colored regions on the timeline
- [ ] Small dots on the timeline at bars where patterns were detected (dot color = pattern category color)
- [ ] Draggable playhead: a vertical line with a timestamp label, draggable left/right
- [ ] Dragging playhead calls `POST /api/replay/seek?bar_index=N` and updates chart
- [ ] Current time label displayed above the playhead (formatted: "09:42 ET")
- [ ] Timeline shows session boundary labels at the appropriate positions
- [ ] Progress percentage displayed: "147 / 390 bars (37.7%)"
- [ ] Timeline supports keyboard navigation (arrows seek ±1 bar, see US-035)

**Technical Notes:**
- Timeline is a custom React component using an `<svg>` or `<canvas>` element
- Pattern dots are derived from the patterns API response pre-loaded for the replay session
- Playhead position stored in Zustand `useReplayStore`

---

### US-035: Replay Transport Controls

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** S
**Dependencies:** US-033, US-034

**Description:**
Add play/pause/step transport controls for the replay engine, with keyboard shortcut support.

**Acceptance Criteria:**
- [ ] Transport controls: |< (rewind to start), < (step back 1 bar), ⏸ (pause / ▶ play), > (step forward 1 bar), >| (jump to end)
- [ ] Play mode: automatically advances playhead at the selected speed (US-036), calling seek on each step
- [ ] Pause stops auto-advance; step controls work in paused state
- [ ] Keyboard shortcuts: Space = play/pause, Left Arrow = step back 1 bar, Right Arrow = step forward 1 bar, Shift+Left = back 10 bars, Shift+Right = forward 10 bars
- [ ] Keyboard shortcuts only active when replay mode is active (not during live trading)
- [ ] Play button changes icon to pause when playing
- [ ] At end of available bars: auto-pause and show "End of replay data" indicator
- [ ] Controls disabled when not in replay mode

**Technical Notes:**
- Keyboard shortcuts registered via `useKeyboardShortcuts` hook with `keydown` listener on `document`
- Replay mode flag stored in `useReplayStore.isReplayActive`

---

### US-036: Replay Speed Control

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** S
**Dependencies:** US-035

**Description:**
Add a speed selector for replay playback with options from real-time equivalent to 50x speed.

**Acceptance Criteria:**
- [ ] Speed options: 1x, 5x, 10x, 25x, 50x
- [ ] "1x" = 1 bar per second (M1 chart: 1 real second = 1 minute of market time)
- [ ] "50x" = 50 bars per second
- [ ] Speed selector rendered as a segmented button group or a dropdown
- [ ] Current speed displayed in the transport controls area
- [ ] Speed change takes effect immediately (affects the play interval timer)
- [ ] Speed setting persists in localStorage under `arctis_replay_speed`

**Technical Notes:**
- Play timer: `setInterval(() => seekNext(), 1000 / speed)` in `useReplayStore`
- Cancel and recreate interval on speed change

---

### US-037: Replay-Synced Panels

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** M
**Dependencies:** US-033, US-034

**Description:**
All analysis panels must synchronize to the replay playhead position, showing the state of the market at that exact historical timestamp.

**Acceptance Criteria:**
- [ ] When replay is active, all panel API calls add `replay_ts={current_ts}` query parameter
- [ ] Backend: all analysis endpoints accept optional `replay_ts: int` parameter; if provided, only bars up to that timestamp are used
- [ ] Session Panel shows the session that was active at `replay_ts`
- [ ] Confluence Panel shows the score as of `replay_ts`
- [ ] Patterns Panel shows only patterns that had been detected up to `replay_ts`
- [ ] Feed Panel shows only events that occurred up to `replay_ts`
- [ ] HUD Bar shows values from the bar at `replay_ts`
- [ ] Visual indicator: thin amber border around all panels when in replay mode
- [ ] "Replay: 2026-03-15 09:42 ET" label displayed in topbar when replay active

**Technical Notes:**
- Backend: `_load_bars()` with `replay_ts` filters: `WHERE timestamp <= replay_ts`
- Panels use a `useReplayTs()` hook that returns `null` in live mode, `timestamp` in replay mode
- React Query key includes `replay_ts` to ensure cache invalidation on seek

---

### US-038: Replay-Synced Chart

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** M
**Dependencies:** US-037

**Description:**
The chart must show only bars up to the current playhead position during replay. Future bars are hidden (not dimmed), creating a true "blind replay" experience.

**Acceptance Criteria:**
- [ ] During replay: chart renders only `visibleBars` from `useReplayStore` (bars up to playhead)
- [ ] Advancing the playhead adds the next bar to the chart in real time (chart extends as bars are revealed)
- [ ] All chart overlays (VWAP, EMA, VOL profile, etc.) recalculate based on visible bars only
- [ ] Replay chart view: chart auto-scrolls right to keep the latest bar in view (right-edge tracking)
- [ ] When replay is paused and playhead is stepped, chart updates instantly (no animation delay)
- [ ] Chart title area shows: "Replay: NQH6 M1 — 2026-03-15" when in replay mode
- [ ] Exiting replay mode restores live chart with all bars

**Technical Notes:**
- LWC `setData()` replaces the full bar series on each step (acceptable for ≤1000 bars per step batch)
- For performance: use LWC `update()` to add single bars when stepping forward one at a time

---

### US-039: Replay Date Picker

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** S
**Dependencies:** US-033

**Description:**
Add a date picker component to select which historical trading day to replay. Only days that have data in the DB are selectable.

**Acceptance Criteria:**
- [ ] Date picker rendered in the replay controls area (collapsed by default, opens on click)
- [ ] Only dates that have bars in TimescaleDB are enabled (others grayed out)
- [ ] `GET /api/replay/available-dates?symbol=NQH6` returns list of dates with bar counts
- [ ] Calendar highlights: trading days with data = white, no data = gray, selected = accent
- [ ] Selecting a date calls `POST /api/replay/load?symbol=NQH6&date=YYYY-MM-DD` and resets replay to bar 0
- [ ] Most recent available date is selected by default when replay mode is entered
- [ ] Date displayed in transport controls area: "Mar 15, 2026"
- [ ] Calendar shows last 3 months of dates by default

**Technical Notes:**
- Use Radix UI `Popover` for the calendar dropdown
- Calendar component: minimal custom implementation using a grid layout (no external date picker dep unless Radix Calendar is available)

---

### US-040: "Would You Have Traded?" Decision Tracker

**Epic:** Epic 4 — Replay Mode
**Priority:** P1
**Estimate:** M
**Dependencies:** US-037, US-038

**Description:**
During replay, allow the trader to log hypothetical trade decisions at pattern/setup moments. Creates a decision log for review and methodology improvement.

**Acceptance Criteria:**
- [ ] When replay is paused and a pattern is detected at the current bar, a floating decision prompt appears: "Would you trade this? [Long] [Short] [Skip]"
- [ ] Decision recorded: `{ timestamp, pattern, decision, bar_index, market_state_snapshot }`
- [ ] Decisions logged to `data/replay_decisions_{symbol}_{date}.json`
- [ ] `GET /api/replay/decisions?symbol=NQH6&date=2026-03-15` returns the log
- [ ] Decision markers shown on the timeline (US-034) as colored triangles: Long=green, Short=red, Skip=gray
- [ ] End-of-replay summary shown when replay reaches end: "Decisions: 3 Long, 1 Short, 2 Skip"
- [ ] Decision log exportable as CSV via `GET /api/replay/decisions/export?...`
- [ ] Prompt can be dismissed with Escape key; dismissed prompts do not log (treated as no decision)

**Technical Notes:**
- Decision prompt: `Framer Motion` animated slide-up panel anchored to the chart bottom
- Market state snapshot: capture the current `/api/analysis/daily-bias` response at that timestamp

---

## Epic 5: Enhanced Live Feed (P1)

Upgrade the Feed Panel from a client-side event aggregator to a proper server-driven event bus.

---

### US-041: Feed Event Engine (Backend)

**Epic:** Epic 5 — Enhanced Live Feed
**Priority:** P1
**Estimate:** M
**Dependencies:** US-004

**Description:**
Create a centralized server-side event engine that collects events from all analysis modules and broadcasts them via WebSocket. This replaces the client-side event aggregation in US-009.

**Acceptance Criteria:**
- [ ] New module `engine/src/arctis/event_engine.py`
- [ ] `EventEngine` class with method `process_new_bar(bars, symbol)` that runs all analysis modules and emits events
- [ ] Events emitted via `WS /ws/events/{symbol}` channel (separate from bar updates WS)
- [ ] `EventEngine` called automatically on each new bar detected by the bar poller (US-004)
- [ ] Event queue: max 500 events per symbol in memory, FIFO eviction
- [ ] `GET /api/events?symbol=NQH6&since_ts={ts}&limit=50` returns recent events as REST fallback
- [ ] Event schema: `{ "id": "uuid", "type": str, "symbol": str, "timestamp": int, "title": str, "detail": str, "severity": "INFO|WARN|ALERT", "price": float | null, "data": {} }`

**Technical Notes:**
- Event generation: compare previous analysis result to new result; emit events on changes (new pattern, state change, etc.)
- Use a global `EventEngine` instance in `main.py`, accessible from analysis routes

---

### US-042: Feed Event Types

**Epic:** Epic 5 — Enhanced Live Feed
**Priority:** P1
**Estimate:** S
**Dependencies:** US-041

**Description:**
Define and implement all standard event types for the feed, with proper routing from each analysis module.

**Acceptance Criteria:**
- [ ] Event type `SIGNAL`: emitted when a new pattern is detected (from patterns module)
- [ ] Event type `STRUCTURE`: emitted when BOS or CHoCH detected (from structure module)
- [ ] Event type `VOLUME`: emitted when RVOL spike detected (ratio > 2.0) (from volume module)
- [ ] Event type `SESSION`: emitted when session changes (from sessions module)
- [ ] Event type `RISK`: emitted when risk threshold approached or exceeded (from discipline module)
- [ ] Event type `BIAS`: emitted when bias state changes (from bias_state module)
- [ ] Each event type has a defined icon and default color in the frontend
- [ ] Event types registered in `engine/src/arctis/events.py` as an enum and factory functions
- [ ] At least 2 pytest tests per event type covering the triggering condition

**Technical Notes:**
- Factory functions: `create_signal_event(pattern)`, `create_structure_event(break)`, etc.
- Severity guidelines: SIGNAL=INFO, STRUCTURE=WARN, VOLUME=INFO, SESSION=INFO, RISK=ALERT, BIAS=WARN

---

### US-043: Feed Filtering

**Epic:** Epic 5 — Enhanced Live Feed
**Priority:** P1
**Estimate:** S
**Dependencies:** US-041, US-042

**Description:**
Add filtering to the Feed Panel so traders can focus on relevant event types.

**Acceptance Criteria:**
- [ ] Filter pills above the feed list: "All | Signals | Structure | Volume | Session | Risk | Bias"
- [ ] Clicking a pill filters the visible events; active filter has accent background
- [ ] "All" is the default selection
- [ ] Multiple filters can be selected simultaneously (shift+click)
- [ ] Filter state persists in localStorage `arctis_feed_filter`
- [ ] Event count badge on each pill showing how many events of that type are in the current feed
- [ ] Filtered events still accumulate in memory; filtering is display-only

**Technical Notes:**
- Filter logic in `useFeedFilter` hook
- Event type icons: Signals=zap, Structure=layers, Volume=bar-chart-2, Session=clock, Risk=shield-alert, Bias=trending-up

---

### US-044: Feed-to-Chart Linking

**Epic:** Epic 5 — Enhanced Live Feed
**Priority:** P1
**Estimate:** S
**Dependencies:** US-041, US-043

**Description:**
Clicking a feed event scrolls the chart to the relevant bar and optionally highlights it temporarily.

**Acceptance Criteria:**
- [ ] Each feed event with a `timestamp` is clickable (shows hover pointer cursor)
- [ ] Clicking an event: chart scrolls to show the bar at that timestamp in the center of the view
- [ ] Clicked bar is briefly highlighted with a pulsing yellow glow overlay for 3 seconds
- [ ] Chart scroll uses LWC `scrollToPosition()` or `scrollToRealTime()` equivalent
- [ ] After 3 seconds: chart returns to normal (glow fades out)
- [ ] On mobile/tablet: tapping an event opens a bottom sheet with event details instead of scrolling chart

**Technical Notes:**
- LWC chart ref exposed via `useChartRef` context from `ArctisCandlestickChart`
- Timestamp-to-bar mapping: find the bar in `useBarsStore.bars` with the closest timestamp

---

### US-045: Feed Sound Alerts

**Epic:** Epic 5 — Enhanced Live Feed
**Priority:** P1
**Estimate:** S
**Dependencies:** US-041, US-042

**Description:**
Add optional audio notifications for high-severity feed events (SIGNAL and RISK types).

**Acceptance Criteria:**
- [ ] Sound alerts toggle in Settings panel (US-055) — default OFF
- [ ] When enabled: SIGNAL events play a soft chime sound (< 500ms, non-intrusive)
- [ ] When enabled: RISK events play a distinct alert tone (slightly louder/different)
- [ ] BIAS events play a soft notification sound
- [ ] Sound files: 3 short audio clips (chime.mp3, alert.mp3, notify.mp3) in `app/public/sounds/`
- [ ] Volume control: 0–100% slider in Settings panel
- [ ] Browser autoplay policy respected: sounds only play after first user interaction on the page
- [ ] "Sound muted" indicator in topbar when alerts are enabled but browser muted

**Technical Notes:**
- Use Web Audio API `AudioContext` for reliable playback
- Preload audio files on mount to avoid latency on first play
- Respect `prefers-reduced-motion` / `prefers-reduced-data` for sound loading

---

## Epic 6: Chart Drawing Tools (P2)

Add manual annotation tools to the chart for traders to draw their own levels and notes.

---

### US-046: Horizontal Line Tool

**Epic:** Epic 6 — Chart Drawing Tools
**Priority:** P2
**Estimate:** S
**Dependencies:** None (self-contained)

**Description:**
Allow traders to place horizontal price lines on the chart by clicking. Lines are labeled with their price.

**Acceptance Criteria:**
- [ ] "Horizontal Line" tool selectable in a drawing tools toolbar (appears when drawing mode activated)
- [ ] When tool active: single click on chart places a horizontal line at that price level
- [ ] Line labeled with price on the right side of the chart (using LWC price line label)
- [ ] Line is draggable (click and drag up/down to reposition)
- [ ] Double-clicking a line opens a color picker / delete option
- [ ] Lines are stored per-symbol in `useDrawingsStore` (Zustand)
- [ ] Pressing Escape deactivates the drawing tool
- [ ] Line deletion: click line to select, press Delete key

**Technical Notes:**
- Use LWC `createPriceLine()` with `draggable: true` (if supported in v5) or custom overlay
- `useDrawingsStore`: `{ lines: PriceLine[], addLine(), moveLine(), deleteLine() }`

---

### US-047: Rectangle / Zone Tool

**Epic:** Epic 6 — Chart Drawing Tools
**Priority:** P2
**Estimate:** M
**Dependencies:** US-046

**Description:**
Allow traders to draw rectangular zones on the chart by clicking and dragging, defining both a price range and a time range.

**Acceptance Criteria:**
- [ ] "Zone" tool selectable in drawing toolbar
- [ ] Click-drag defines the zone: start corner (price + time) to end corner
- [ ] Zone rendered as semi-transparent colored rectangle on the chart canvas
- [ ] Default fill color: yellow with 20% opacity; color customizable
- [ ] Zone has a label (editable, default "Zone")
- [ ] Zones are resizable by dragging corners
- [ ] Zones stored in `useDrawingsStore`

**Technical Notes:**
- Zones require a canvas overlay on top of the LWC chart (same approach as VP histogram)
- Time-to-pixel and price-to-pixel conversion from LWC `timeScale()` and `priceToCoordinate()`

---

### US-048: Trend Line Tool

**Epic:** Epic 6 — Chart Drawing Tools
**Priority:** P2
**Estimate:** M
**Dependencies:** US-046

**Description:**
Allow traders to draw trend lines by clicking two points on the chart.

**Acceptance Criteria:**
- [ ] "Trend Line" tool selectable in drawing toolbar
- [ ] Click first point (anchor), click second point (end) → line drawn between them and extended to both edges
- [ ] Trend line rendered on canvas overlay
- [ ] Line color: white with 80% opacity by default; customizable
- [ ] Slope label: angle or price-per-bar shown on hover
- [ ] Lines stored in `useDrawingsStore` with `{ p1: {time, price}, p2: {time, price} }`
- [ ] Click on a line to select (highlighted), then drag to move, Delete to remove

**Technical Notes:**
- Canvas overlay uses `requestAnimationFrame` for smooth rendering
- Coordinate updates needed on chart pan/zoom: subscribe to LWC `subscribeCrosshairMove` or range change event

---

### US-049: Text Annotation Tool

**Epic:** Epic 6 — Chart Drawing Tools
**Priority:** P2
**Estimate:** S
**Dependencies:** US-046

**Description:**
Allow traders to place text notes at specific chart locations.

**Acceptance Criteria:**
- [ ] "Text" tool selectable in drawing toolbar
- [ ] Click on chart opens an inline text input at that location
- [ ] Press Enter to confirm text; Escape to cancel
- [ ] Text rendered on canvas overlay at the clicked position
- [ ] Text annotations are moveable (click and drag)
- [ ] Font size: small (12px), default color white
- [ ] Annotations stored in `useDrawingsStore`

**Technical Notes:**
- Text input positioned as an absolutely-placed `<input>` element over the chart
- After confirmation, text is rendered on canvas

---

### US-050: Drawing Persistence

**Epic:** Epic 6 — Chart Drawing Tools
**Priority:** P2
**Estimate:** S
**Dependencies:** US-046, US-047, US-048, US-049

**Description:**
Save and restore all drawings when the user navigates away or refreshes the page. Drawings are per-symbol and per-timeframe.

**Acceptance Criteria:**
- [ ] All drawing types (lines, zones, trend lines, text) persisted to localStorage
- [ ] Storage key: `arctis_drawings_{symbol}_{timeframe}` (e.g., `arctis_drawings_NQH6_1`)
- [ ] Drawings restored automatically on chart mount
- [ ] "Clear All Drawings" button in drawing toolbar
- [ ] Export drawings to JSON: `GET /api/drawings/export?symbol=NQH6&timeframe=1` (served from stored file, optional)
- [ ] Drawings survive symbol/timeframe change (each context has its own set)
- [ ] Max 100 drawings stored per context (oldest pruned with user warning)

**Technical Notes:**
- `useDrawingsStore` uses Zustand `persist` middleware with localStorage adapter
- Serialize `DrawingElement` union type to JSON; handle version migrations

---

## Epic 7: Settings & Configuration (P1)

Implement a fully functional settings panel with persistent configuration for all platform parameters.

---

### US-051: Settings Slide-Over Panel

**Epic:** Epic 7 — Settings & Configuration
**Priority:** P1
**Estimate:** S
**Dependencies:** None

**Description:**
Wire the existing `SettingsPanel.tsx` shell to a proper tabbed settings UI with data persistence.

**Acceptance Criteria:**
- [ ] Settings panel opens from topbar gear icon
- [ ] Panel is a right-side slide-over (Radix UI `Sheet` or custom)
- [ ] Five tabs: Connection, Markets, Risk, Display, Alerts
- [ ] Settings persisted to localStorage under `arctis_settings`
- [ ] Settings loaded into Zustand `useSettingsStore` on app init
- [ ] "Save" button applies changes immediately; "Reset to Defaults" resets all settings
- [ ] Settings panel width: 380px on desktop, full-width on mobile
- [ ] Close via X button or pressing Escape

**Technical Notes:**
- `useSettingsStore` is the single source of truth for all settings
- All other stores/hooks read from `useSettingsStore` rather than localStorage directly

---

### US-052: Connection Settings Tab

**Epic:** Epic 7 — Settings & Configuration
**Priority:** P1
**Estimate:** S
**Dependencies:** US-051

**Description:**
Allow users to configure the backend API and database URLs, and test connectivity.

**Acceptance Criteria:**
- [ ] "API URL" text input (default: `http://localhost:8000`)
- [ ] "Test Connection" button: calls `GET {apiUrl}/health` and shows "Connected v0.1.0" or "Failed: {error}"
- [ ] Connection status indicator in topbar: green dot (connected), yellow dot (connecting), red dot (disconnected)
- [ ] WebSocket URL auto-derived from API URL (http → ws, https → wss)
- [ ] DB connection status shown (read from `/api/analysis/health` endpoint from US-001)
- [ ] "Reconnect" button that forces a new WS connection
- [ ] Settings changes require clicking "Save" to apply (no live URL switching on typing)

**Technical Notes:**
- Connection health checked every 30 seconds; topbar indicator updates accordingly
- Store: `useSettingsStore.apiUrl`, `useSettingsStore.connectionStatus`

---

### US-053: Risk Settings Tab

**Epic:** Epic 7 — Settings & Configuration
**Priority:** P1
**Estimate:** S
**Dependencies:** US-051

**Description:**
Configure trading risk parameters that feed into the Risk Panel and daily check endpoint.

**Acceptance Criteria:**
- [ ] "Account Size" number input ($) — default: 50000
- [ ] "Risk Per Trade" percentage slider — default: 1% (shown as $ equivalent: "$500")
- [ ] "Daily Loss Limit" percentage slider — default: 2% (shown as $ and %)
- [ ] "Max Trades Per Day" number input — default: 3
- [ ] "NQ Tick Value" number input ($) — default: 5.0 (per 0.25 tick)
- [ ] "ES Tick Value" number input ($) — default: 12.50 (per 0.25 tick)
- [ ] Settings POSTed to `POST /api/config` and persisted server-side as JSON
- [ ] Risk Panel (US-010) reads from this config
- [ ] Input validation: account size > 0, risk % between 0.1–10, max trades between 1–20

**Technical Notes:**
- Backend `POST /api/config` endpoint stores settings to `data/config.json`
- `GET /api/config` returns current config; used by Risk Panel

---

### US-054: Display Settings Tab

**Epic:** Epic 7 — Settings & Configuration
**Priority:** P1
**Estimate:** S
**Dependencies:** US-051

**Description:**
Allow customization of chart appearance and indicator defaults.

**Acceptance Criteria:**
- [ ] "Chart Theme" toggle: Dark (default) / Light
- [ ] "Candle Style" selector: Candlestick (default) / Hollow / Heikin Ashi / Bars
- [ ] "Chart Density" slider: Compact / Normal / Spacious (affects default bar width)
- [ ] Indicator toggles (checkboxes): VWAP, EMA Ribbon, Volume Profile, Session Lines, Prev Day Levels, OR Box, BOS/CHoCH markers
- [ ] "Show HUD Bar" toggle — default ON
- [ ] "Panel Layout" selector: 5-panels default / compact (3 panels) / expanded (single large panel)
- [ ] All display settings applied in real time (no save required for visual changes)
- [ ] Visual changes persisted to localStorage

**Technical Notes:**
- Chart theme change requires reinitializing LWC with new color options
- `useSettingsStore.displaySettings` consumed by `ArctisCandlestickChart` and `Dashboard`

---

### US-055: Alert Settings Tab

**Epic:** Epic 7 — Settings & Configuration
**Priority:** P1
**Estimate:** S
**Dependencies:** US-051, US-045

**Description:**
Configure which events generate notifications and audio alerts.

**Acceptance Criteria:**
- [ ] "Enable Sound Alerts" master toggle — default OFF
- [ ] Volume slider: 0–100% (shown as number)
- [ ] Per-event-type toggles: Signals, Structure breaks, Volume spikes, Session changes, Risk warnings, Bias changes
- [ ] "Play test sound" button next to volume slider
- [ ] "Desktop Notifications" toggle (uses browser Notification API) — default OFF
- [ ] Notification permission request shown when desktop notifications enabled
- [ ] Alert cooldown: "Minimum time between alerts" selector — 0s / 5s / 30s / 1min (prevents spam)

**Technical Notes:**
- `useSettingsStore.alertSettings` consumed by `useFeedEvents` and `useAudioAlerts` hooks
- Desktop notification API: `Notification.requestPermission()` triggered only on user action

---

## Epic 8: Travis MCP Integration (P2)

Integrate Travis (Traivend) MCP server to surface relevant educational content during live trading sessions.

---

### US-056: Travis Knowledge Panel

**Epic:** Epic 8 — Travis MCP Integration
**Priority:** P2
**Estimate:** M
**Dependencies:** US-031

**Description:**
Add a collapsible "Travis" panel to the sidebar that shows contextually relevant Traivend educational content based on the current market situation.

**Acceptance Criteria:**
- [ ] New `TravisPanel.tsx` component in `app/src/components/panels/`
- [ ] Panel queries Travis MCP `ask_about_videos` tool with the current bias state + active patterns as context
- [ ] Results shown as a list of video/concept cards: title, short description, relevance indicator
- [ ] Panel auto-queries when bias state changes or a new significant pattern is detected
- [ ] Manual "Refresh" button to re-query with current context
- [ ] Panel is collapsed by default; expands when new relevant content arrives
- [ ] Max 5 results shown, sorted by relevance
- [ ] "Watch" button on each card opens the Travis MCP response with full details

**Technical Notes:**
- Travis MCP accessible via `mcp__travis__ask_about_videos` tool
- Context string format: `"Current bias: {state}. Active patterns: {pattern_names}. Market situation: {confluence_direction} with {velocity_classification} velocity"`

---

### US-057: Travis Contextual Suggestions

**Epic:** Epic 8 — Travis MCP Integration
**Priority:** P2
**Estimate:** S
**Dependencies:** US-042, US-056

**Description:**
When a SIGNAL or BIAS event appears in the feed, automatically fetch and show a Travis suggestion inline in the feed event.

**Acceptance Criteria:**
- [ ] SIGNAL and BIAS feed events have an expandable "Travis says..." section
- [ ] Expanding the section queries Travis for content relevant to that specific pattern/event
- [ ] Query is lazy (only fetches when expanded, not on every event)
- [ ] Response shown as a 2–3 sentence summary + a "Full Details" link
- [ ] Travis suggestion rendered with a distinct Travis icon (book or graduation cap)
- [ ] Suggestion cached per event ID in sessionStorage (no duplicate queries for same event)

**Technical Notes:**
- Query: `mcp__travis__ask_about_videos` with `query = event.title + " " + event.detail`
- Inline expandable section uses Radix UI `Collapsible` component

---

### US-058: Travis Search Command

**Epic:** Epic 8 — Travis MCP Integration
**Priority:** P2
**Estimate:** S
**Dependencies:** US-056

**Description:**
Add a command palette (cmd+K) that allows traders to search Traivend knowledge base during trading sessions.

**Acceptance Criteria:**
- [ ] `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) opens a search overlay
- [ ] Search input with placeholder "Search Traivend knowledge..."
- [ ] As user types (debounced 300ms): queries `mcp__travis__search_videos` with the search term
- [ ] Results displayed as a list: title, short snippet, relevance score
- [ ] Arrow keys navigate results, Enter selects, Escape closes
- [ ] Selecting a result expands its full content in a detail pane within the overlay
- [ ] "No results" state shown for empty queries
- [ ] Overlay has a dark backdrop, closes on click outside

**Technical Notes:**
- Command palette uses Radix UI `Dialog` with custom search UX
- `mcp__travis__search_videos` used for search; `mcp__travis__ask_about_videos` for context queries

---

## Epic 9: Polish & UX (P1)

Ensure the platform feels professional, responsive, and robust before production use.

---

### US-059: Loading Skeletons

**Epic:** Epic 9 — Polish & UX
**Priority:** P1
**Estimate:** S
**Dependencies:** None

**Description:**
All panels and the chart must show shimmer skeleton states while data is loading, preventing layout shift and communicating loading state clearly.

**Acceptance Criteria:**
- [ ] `SkeletonPanel.tsx` component: animated shimmer rectangles matching the panel layout
- [ ] `SkeletonHUD.tsx`: shimmer placeholders for each HUD metric
- [ ] `SkeletonChart.tsx`: gray placeholder with a small loading spinner
- [ ] Each panel uses its skeleton during `isLoading` state from React Query
- [ ] Skeletons use Tailwind `animate-pulse` utility
- [ ] Skeleton animation: subtle background shimmer (gradient left-to-right sweep, CSS `@keyframes`)
- [ ] Skeleton shown for max 10 seconds; after that, an error state is shown instead
- [ ] Skeletons match the approximate height and layout of the actual content

**Technical Notes:**
- `<SkeletonBlock width="100%" height="1rem" />` primitive component used to compose panel-specific skeletons
- Tailwind custom animation in `tailwind.config.ts` if default pulse is too slow/fast

---

### US-060: Error States

**Epic:** Epic 9 — Polish & UX
**Priority:** P1
**Estimate:** S
**Dependencies:** None

**Description:**
All data-fetching components must have graceful error states with clear messaging and recovery options.

**Acceptance Criteria:**
- [ ] `ErrorPanel.tsx` reusable component: icon, short error message, "Retry" button
- [ ] Each panel renders `<ErrorPanel>` when React Query `isError` is true
- [ ] Error message: user-friendly ("Could not load session data") not technical stack trace
- [ ] "Retry" button calls `refetch()` from the query
- [ ] Global connection error banner: shown at top of app when API is unreachable (HTTP 0 / network error)
- [ ] Individual panel errors do not affect other panels
- [ ] Chart error state: gray chart area with "Failed to load bars — Retry" centered text
- [ ] Errors logged to browser console with full technical detail

**Technical Notes:**
- React Query `retry: 3` for all queries; after 3 failures, show error state
- Error boundary (`ErrorBoundary` component) wraps each panel to catch render errors

---

### US-061: Keyboard Shortcuts

**Epic:** Epic 9 — Polish & UX
**Priority:** P1
**Estimate:** S
**Dependencies:** US-035

**Description:**
Implement comprehensive keyboard shortcuts for power users.

**Acceptance Criteria:**
- [ ] `?` key opens a keyboard shortcuts help overlay
- [ ] Space: play/pause replay (when in replay mode)
- [ ] `←` / `→`: step back/forward 1 bar (replay mode)
- [ ] `Shift+←` / `Shift+→`: step back/forward 10 bars (replay mode)
- [ ] `+` / `=`: zoom chart in
- [ ] `-`: zoom chart out
- [ ] `0`: reset chart zoom to default
- [ ] `1` through `5`: switch timeframes (1=1m, 2=3m, 3=5m, 4=15m, 5=30m)
- [ ] `Cmd/Ctrl+K`: open Travis search (US-058)
- [ ] `Escape`: close any open overlay, deactivate drawing tool
- [ ] `r`: enter replay mode (opens date picker)
- [ ] Shortcuts disabled when typing in an input field (check `event.target.tagName`)

**Technical Notes:**
- Central `useKeyboardShortcuts()` hook registered once at app root
- Shortcut map defined as a constant object for easy extension and documentation

---

### US-062: Responsive Layout

**Epic:** Epic 9 — Polish & UX
**Priority:** P1
**Estimate:** M
**Dependencies:** None

**Description:**
Ensure the layout adapts gracefully to different window sizes, with a minimum viable tablet experience.

**Acceptance Criteria:**
- [ ] Desktop (>1280px): full layout — sidebar (5 panels) + chart + topbar + HUD bar
- [ ] Laptop (1024–1280px): sidebar collapses to icons-only; hover/click to expand panels as popovers
- [ ] Tablet (768–1024px): single-panel mode — bottom sheet for panels, full-screen chart
- [ ] Below 768px: show "best viewed on desktop" message; chart-only view on mobile (no panels)
- [ ] Sidebar collapse state persisted to localStorage
- [ ] Chart maintains aspect ratio on resize (width: 100%, height adapts to available space)
- [ ] No horizontal scrollbar at any supported resolution
- [ ] Topbar items collapse gracefully: timeframe selector moves to a "⋮ More" dropdown on small screens

**Technical Notes:**
- Use Tailwind CSS breakpoints: `md:`, `lg:`, `xl:` prefixes
- Sidebar: CSS grid with `grid-template-columns: auto 1fr` — auto shrinks to icon width when collapsed

---

### US-063: Performance Optimization

**Epic:** Epic 9 — Polish & UX
**Priority:** P1
**Estimate:** M
**Dependencies:** US-005

**Description:**
Optimize the application for smooth performance with large bar datasets and frequent analysis updates.

**Acceptance Criteria:**
- [ ] Bar array virtualization: only serialize/deserialize bars within ±500 bars of current view
- [ ] Analysis API calls debounced: minimum 500ms between calls triggered by bar updates
- [ ] LWC chart `setData()` replaced with incremental `update()` where possible (append-only when new bars arrive)
- [ ] React panels use `React.memo()` to prevent unnecessary re-renders
- [ ] Heavy panel calculations (confluence signals list) memoized with `useMemo()`
- [ ] Bundle analysis: `pnpm run build --analyze` — no single chunk > 500KB
- [ ] WS bar messages batched: if multiple bars arrive within 100ms, apply all at once in one React state update
- [ ] TimescaleDB queries use proper indexes: verify `CREATE INDEX ON ohlcv_1m (symbol, timestamp DESC)` exists
- [ ] Backend: analysis results cached with a `{ symbol, timeframe, last_bar_ts }` cache key

**Technical Notes:**
- Use React Profiler to identify re-render hotspots before optimizing
- LWC `autoSize: true` for responsive chart width without explicit resize handling

---

### US-064: Favicon, Page Title, App Icon

**Epic:** Epic 9 — Polish & UX
**Priority:** P1
**Estimate:** S
**Dependencies:** None

**Description:**
Add a proper Arctis brand identity to the browser tab and Tauri window.

**Acceptance Criteria:**
- [ ] Favicon: a stylized mountain peak icon (SVG, matches Arctis branding — arctis = arctic mountain range)
- [ ] Favicon SVG placed in `app/public/favicon.svg`; referenced in `index.html`
- [ ] Apple touch icon: `app/public/apple-touch-icon.png` (180x180)
- [ ] Page title format: `NQH6 · 20,432.50 · Arctis` (symbol + last price + app name)
- [ ] Title updates on every new bar received (throttled to max once per second)
- [ ] In replay mode: title shows `NQH6 Replay 2026-03-15 · Arctis`
- [ ] Tauri window title matches browser tab title (via `tauri.conf.json` or Tauri API)
- [ ] `<meta name="description">` tag: "Arctis — Trading Decision Support for NQ/ES Futures"

**Technical Notes:**
- Dynamic title: `useEffect(() => { document.title = \`\${symbol} · \${lastPrice} · Arctis\` }, [lastPrice])`
- Throttle with `useThrottle(lastPrice, 1000)` custom hook

---

## Testing Strategy

### Backend Testing (pytest)

```
tests/
  test_analysis/
    test_confluence.py          # score calculation, signal detection
    test_sessions.py            # session classification, timezone handling
    test_structure.py           # swing detection, BOS/CHoCH logic
    test_volume.py              # RVOL calculation, spike detection
    test_velocity.py            # velocity ratio, score mapping (US-021)
    test_auction.py             # efficiency ratio, quality classification (US-022)
    test_naked_poc.py           # POC detection, retest logic (US-023)
    test_bias_state.py          # 5-state transitions, hysteresis (US-024)
    test_bias_switch.py         # priority hierarchy logic (US-025)
    test_opening_fake.py        # fake detection, follow-through (US-026)
    test_double_fake.py         # velocity decline, confirmation (US-027)
    test_correction.py          # correction % calculation (US-028)
    test_key_levels.py          # zone clustering, invalidation (US-029)
  test_api/
    test_analysis_endpoints.py  # all /api/analysis/* with mocked fetch_bars
    test_websocket.py           # WS connection, bar streaming, reconnect
    test_replay.py              # load, seek, visible_bars behavior
    test_events.py              # event engine, event types
  conftest.py                   # shared fixtures: mock bars, mock DB
```

**Coverage target:** 80%+ on all analysis modules
**Fixture:** `generate_bars(n=500)` creates synthetic OHLCV data with configurable trend, volatility, and session markers

### Frontend Testing (Vitest + React Testing Library)

```
src/
  __tests__/
    hooks/
      useMarketData.test.ts     # initial fetch, WS subscription, reconnect
      useFeedEvents.test.ts     # event generation from analysis results
      useReplayStore.test.ts    # seek, play/pause, speed
    components/
      BiasPanel.test.tsx        # state badge rendering, switch level display
      ConfluencePanel.test.tsx  # score gauge, signal list
      FeedPanel.test.tsx        # event rendering, filtering
      SessionPanel.test.tsx     # session highlighting, auto-refresh
```

**Coverage target:** 70%+ on critical hooks and panels

---

## Story Map

### Implementation Order (by Priority and Dependencies)

**Phase 1 — Foundation (Week 1):** US-001 → US-002 → US-003 → US-004 → US-005
**Phase 2 — Live Panels (Week 1–2):** US-006 → US-007 → US-008 → US-009 → US-010 → US-011
**Phase 3 — Chart Overlays (Week 2):** US-012 → US-013 → US-014 → US-015 → US-016 → US-017 → US-018 → US-019 → US-020
**Phase 4 — BIAS Backend (Week 3):** US-021 → US-022 → US-023 → US-024 → US-025 → US-026 → US-027 → US-028 → US-029 → US-030
**Phase 5 — BIAS Frontend + Settings (Week 3–4):** US-031 → US-032 → US-051 → US-052 → US-053 → US-054 → US-055
**Phase 6 — Replay (Week 4):** US-033 → US-034 → US-035 → US-036 → US-037 → US-038 → US-039 → US-040
**Phase 7 — Enhanced Feed (Week 5):** US-041 → US-042 → US-043 → US-044 → US-045
**Phase 8 — Polish (Week 5):** US-059 → US-060 → US-061 → US-062 → US-063 → US-064
**Phase 9 — Drawing Tools + Travis (Week 6+):** US-046 → US-047 → US-048 → US-049 → US-050 → US-056 → US-057 → US-058

---

## Appendix: Key Data Models

### Bar (already defined in `models.py`)
```python
class Bar(BaseModel):
    timestamp: int  # Unix seconds
    open: float
    high: float
    low: float
    close: float
    volume: float
```

### BiasState (new — US-024)
```python
class BiasState(str, Enum):
    LONG = "LONG"
    RANGE_LONG = "RANGE_LONG"
    RANGE = "RANGE"
    RANGE_SHORT = "RANGE_SHORT"
    SHORT = "SHORT"
```

### DailyBiasResponse (new — US-030)
```python
class DailyBiasResponse(BaseModel):
    bias_state: BiasState
    state_confidence: float
    bars_in_state: int
    velocity: VelocityResult
    auction_quality: AuctionResult
    bias_switch_level: BiasSwitchLevel | None
    correction: CorrectionResult
    opening_fake: OpeningFakeResult | None
    double_fake: DoubleFakeResult | None
    naked_pocs: list[NakedPOC]
    key_levels: list[KeyLevel]
    calculated_at: int
```

### FeedEvent (new — US-041)
```python
class FeedEvent(BaseModel):
    id: str  # UUID
    type: str  # SIGNAL | STRUCTURE | VOLUME | SESSION | RISK | BIAS
    symbol: str
    timestamp: int
    title: str
    detail: str
    severity: str  # INFO | WARN | ALERT
    price: float | None
    data: dict
```

### Zustand Store Shape (Frontend)
```typescript
interface AppStores {
  useBarsStore: { bars: Bar[], appendBar, updateLastBar, clearBars }
  useMarketStore: { symbol: string, setSymbol }
  useTimeframeStore: { timeframe: number, setTimeframe }
  useReplayStore: { isActive, date, barIndex, totalBars, speed, seek, play, pause, setSpeed }
  useSettingsStore: { apiUrl, riskConfig, displaySettings, alertSettings }
  useDrawingsStore: { lines, zones, trendLines, texts, add*, move*, delete*, clearAll }
  useFeedStore: { events, addEvent, clearFeed, filter, setFilter }
}
```

---

*End of PRD — 64 User Stories, 10 Epics, ready for Ralph Loop execution.*

# Arctis — Project Instructions

## Project Identity

Arctis is a trading decision support platform. It is architecturally positioned as a sibling
of AlgoView and shares the same design language and component foundations (SciChart
CandlestickChart, Arctic Frost theme, AlgoView design tokens).

**Not a standalone prototype — production quality is expected at all times.**

---

## Stack

### Backend (Engine)
- **Framework:** FastAPI (Python)
- **DB:** TimescaleDB via SQLAlchemy + psycopg2
- **DB URL:** postgres://algorivo:algorivo_dev@localhost:5532/algorivo
- **Port:** 28080 (production), fallback 8001 still appears in legacy code — fix to 28080
- **Entry point:** engine/src/arctis/main.py
- **Routes directory:** engine/src/arctis/routes/

### Frontend (App)
- **Framework:** React 19 + TypeScript + Vite
- **UI:** Tailwind CSS + custom CSS variables
- **Chart:** SciChart (CandlestickChart.tsx is the canonical chart core — do not replace)
- **State:** Zustand (useMarketStore, useSettingsStore)
- **Port:** 5174 (Vite dev server via VITE_DEV_PORT=5174)
- **Entry point:** app/src/App.tsx
- **Package manager:** pnpm

---

## Design System

### Arctic Frost Theme
- **Primary accent:** Ice Blue #5CB8F0
- **Profit:** #34D399
- **Loss:** #F87171
- **Background (base):** var(--color-surface-base) near-black
- **Border subtle:** var(--color-border-subtle)
- **Text primary:** var(--color-text-primary)
- **Font:** var(--font-mono) for all price/numeric data

### Design Rules
- No emojis in UI
- No gradients except subtle surface differentiation
- Consistent 1px borders with --color-border-subtle
- All price values: monospace font, right-aligned
- Arctic Frost ice blue replaces AlgoView green as the accent color

---

## Architecture Decisions

### Chart Pipeline
App.tsx (bars, overlays, indicatorData)
  -> ChartPage.tsx (layout + toolbar)
    -> ArctisChartWrapper.tsx (adapter: Arctis types -> AlgoView types)
      -> CandlestickChart.tsx (SciChart, canonical chart core)

ArctisChartWrapper converts:
- Bar[] (timestamp) -> Candle[] (time)
- IndicatorData (vwap/ema arrays) -> Map<string, { config, data }> indicator format

### Data Flow
- useMarketData -> REST (/api/db/bars) + WebSocket (/ws/bars/{symbol})
- useAnalysis -> 10 parallel REST polls to /api/analysis/*, /api/bias, etc.
- All API base URLs come from useSettingsStore().engineUrl — never hardcode localhost:8001

---

## Known Issues (Phase 0 Audit)

### Critical Wiring Gaps
1. VWAP/EMA toggles broken — overlay toggles in toolbar do not suppress VWAP/EMA from rendering
2. Levels toggle broken — priceLevels always passed regardless of activeOverlays.has('levels')
3. Zones toggle broken + no render path — zonesData is never passed to ArctisChartWrapper
4. Drawings not rendered — useDrawings data never forwarded to CandlestickChart
5. structureBreaks/patternAnnotations — fetched but dropped in ChartPage, never reach chart

### Unmounted Backend Routes
- routes/setups.py — defines GET /api/setups but is not include_router'd
- routes/travis.py — legacy duplicate of arctis_ai.py; not mounted

### Type Duplication
- OHLCVBar in types/market.ts is identical to Bar in types/contracts.ts — consolidate
- Timeframe in types/market.ts only has 2 values vs canonical 5 in contracts.ts

---

## Branch Conventions

| Type         | Pattern          |
|--------------|------------------|
| Feature      | feat/<name>      |
| Bug fix      | fix/<name>       |
| Refactor     | refactor/<name>  |
| Docs         | docs/<name>      |

Commit messages in English, conventional commits format:
feat:, fix:, refactor:, docs:, test:

---

## Development Environment

Start engine:
  # Standard (fast, ~120 ms latency):
  cd engine && .venv/Scripts/python.exe -m uvicorn arctis.main:app --port 28080
  # Dev with auto-reload (15x slower due to file-watch overhead — only use
  # while actively editing backend files):
  cd engine && .venv/Scripts/python.exe -m uvicorn arctis.main:app --port 28080 --reload

Caches in the engine:
  - fetch_bars / fetch_bars_as_models: 1.5–2.0 s TTL (arctis/db.py)
  - /api/snapshot response cache: 2.0 s TTL (arctis/routes/snapshot.py)
  These collapse the polling storm when the frontend hits the engine every 5 s.

Start frontend:
  cd app && pnpm dev   (runs on :5174 via VITE_DEV_PORT=5174)

DB:
  postgres://algorivo:algorivo_dev@localhost:5532/algorivo

---

## Communication Language

Respond in German for all communication.
Code, comments, commit messages, variable names: English.

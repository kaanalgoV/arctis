# Arctis — Architecture Overview

## System Overview

Arctis is a trading analysis platform. Data flows from TimescaleDB through a Python FastAPI
backend into a React 19 frontend via REST and WebSocket connections.

```
TimescaleDB (port 5532)
        |
        | SQLAlchemy (engine/src/arctis/db.py)
        v
FastAPI Backend (port 8001)
  ├── REST routes   /api/markets, /api/analysis/*, /api/config
  └── WebSocket     /ws/bars/{symbol}
        |
        | HTTP fetch + WebSocket
        v
React Frontend (port 5174)
  ├── useMarketData hook     — REST + WS, reconnect with backoff
  ├── useAnalysis hook       — polling /api/analysis/*
  └── Zustand store          — global market/config state
        |
        v
  Components
  ├── App.tsx                — centralized state, layout
  ├── Chart (LWC)            — incremental updates, VWAP/EMA, session separators
  ├── Topbar                 — dynamic from /api/markets
  ├── HudStrip               — live indicator metrics
  ├── SessionPanel           — session high/low/range
  ├── ConfluencePanel        — live confluence score
  ├── PatternsPanel          — detected bar patterns
  ├── FeedPanel              — real-time event feed
  └── RiskPanel              — risk limits from /api/config
```

## Backend Modules

### `engine/src/arctis/`

| Module | Responsibility |
|--------|----------------|
| `main.py` | FastAPI app factory, CORS, router registration |
| `db.py` | SQLAlchemy async engine, `fetch_bars_as_models()`, TimescaleDB connection |
| `ws.py` | WebSocket connection manager (`ConnectionManager`), bar polling loop |
| `events.py` | Feed event engine (`FeedEventEngine`), pattern detection for the feed |
| `models.py` | SQLAlchemy ORM models: `Bar`, `MarketInfo` |
| `routes/markets.py` | `GET /api/markets` — dynamic from DB |
| `routes/analysis.py` | `GET /api/analysis/*` — session, confluence, patterns, bias |
| `routes/config.py` | `GET /api/config` — risk limits |
| `analysis/session.py` | Session high/low/range calculation |
| `analysis/confluence.py` | Multi-factor confluence scoring |
| `analysis/patterns.py` | Bar pattern recognition |
| `analysis/bias.py` | BIAS module (directional bias) |
| `analysis/probability.py` | Probabilistic zone computation |
| `analysis/model_registry.py` | Prediction model adapter registry |
| `analysis/benchmark.py` | Benchmark harness for model evaluation |

### Key Backend Decisions

- **SQLAlchemy async** over raw asyncpg for type-safe ORM queries and easy testing.
- **Time-based resampling** via `pd.resample` for timeframe aggregation (5min, 15min, etc.)
  rather than DB-side OHLCV queries — keeps the DB schema simple.
- **ConnectionManager** in `ws.py` manages all active WebSocket clients; bar polling is
  done server-side to decouple WS clients from DB query cadence.
- **Analysis routes read from DB**, never from demo/static data. All routes call
  `fetch_bars_as_models()`.

## Frontend Modules

### `app/src/`

| Module | Responsibility |
|--------|----------------|
| `App.tsx` | Layout, centralized state init, market selection |
| `hooks/useMarketData.ts` | REST fetch + WS subscription, exponential backoff |
| `hooks/useAnalysis.ts` | Polling `/api/analysis/*`, returns session/confluence/patterns/bias |
| `store/marketStore.ts` | Zustand store: selected symbol, timeframe, bar data |
| `store/settingsStore.ts` | User settings: keyboard shortcuts, display prefs |
| `components/Chart/` | LWC-based chart, incremental updates, overlays, levels |
| `components/Topbar/` | Symbol selector populated from `/api/markets` |
| `components/panels/` | SessionPanel, ConfluencePanel, PatternsPanel, FeedPanel, RiskPanel |
| `components/HudStrip/` | Live metric bar above chart |
| `api/client.ts` | Typed API client wrapping `fetch` |

### Key Frontend Decisions

- **LightweightCharts (LWC)** is the canonical renderer. No canvas/SVG workarounds.
- **Zustand** for global state — minimal boilerplate, React-free updates possible.
- **Polling for analysis** (not WS) because analysis results are computed per-request and
  do not require sub-second latency.
- **TypeScript strict mode** enabled; `tsc --noEmit` is the primary type-check gate.
- **Demo/mock values removed** in Phase 5 — all panels read from live hooks.

## Data Flow Detail

```
1. App.tsx mounts
   └── calls /api/markets
       └── populates Topbar + marketStore.symbols

2. User selects symbol/timeframe
   └── useMarketData(symbol, timeframe)
       ├── GET /api/analysis/bars?symbol=NQ&timeframe=5min
       │   └── returns OHLCV array → Chart initial load
       └── WS /ws/bars/NQ
           └── streams new bars → Chart.update() (incremental)

3. useAnalysis(symbol) polls every N seconds
   ├── GET /api/analysis/session  → SessionPanel
   ├── GET /api/analysis/confluence → ConfluencePanel
   ├── GET /api/analysis/patterns → PatternsPanel
   ├── GET /api/analysis/bias     → RiskPanel / HudStrip
   └── GET /api/analysis/feed     → FeedPanel (via FeedEventEngine)

4. Settings changes
   └── settingsStore → keyboard shortcuts re-registered
```

## Infrastructure

- **Database:** TimescaleDB (PostgreSQL extension) at `localhost:5532`
  - Schema: `bars` hypertable partitioned by `time`
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.x async, pandas
- **Frontend:** React 19, TypeScript 5, Vite, Zustand, LightweightCharts
- **Package manager:** pnpm (frontend), pip/pyproject.toml (backend)

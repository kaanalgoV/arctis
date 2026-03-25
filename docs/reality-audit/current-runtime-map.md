# Current Runtime Map — Arctis Engine
_Phase 0 Reality Audit · 2026-03-25_

## Engine Entry Point
`engine/src/arctis/main.py`

FastAPI app: `Arctis Engine v0.1.0`

### CORS allowed origins
- `http://localhost:1420` / `http://127.0.0.1:1420` (Tauri)
- `http://localhost:5173` / `http://127.0.0.1:5173`
- `http://localhost:5174` / `http://127.0.0.1:5174` (active dev port)
- `tauri://localhost`

---

## Mounted Routers (12 total)

| Router File          | Prefix                | Key Endpoints                                                        |
|----------------------|-----------------------|----------------------------------------------------------------------|
| `analysis.py`        | `/api/analysis`       | `/structure`, `/volume`, `/sessions`, `/warnings`, `/indicators`, `/confluence`, `/patterns` |
| `probability.py`     | `/api`                | `/probability`                                                       |
| `risk.py`            | `/api/analysis`       | (mounts under `/api/analysis` — route: `/bias`)                     |
| `bias.py`            | `/api`                | `/bias`                                                              |
| `feed.py`            | `/api`                | `/feed`, `/feed/events`                                              |
| `arctis_ai.py`       | `/api/arctis`         | `/ask`, `/travis/ask` (hidden)                                       |
| `zones.py`           | `/api/analysis`       | `/backtest`, `/zones`, `/signals`                                    |
| `signals.py`         | `/api/signals`        | `/api/signals` (empty path `""`)                                     |
| `strategies.py`      | `/api/strategies`     | `/api/strategies` (empty path `""`)                                  |
| `radar.py`           | `/api/radar`          | `/scan`                                                              |
| `live.py`            | `/api/live`           | `/price`, `/prices`, `/status`, `/rithmic/login`, `/rithmic/logout` |
| `backfill.py`        | `/api/backfill`       | `/status`, `/run`                                                    |

### Direct routes in main.py (not in sub-routers)
| Method   | Path                  | Description                        |
|----------|-----------------------|------------------------------------|
| GET      | `/health`             | DB health check + symbol count     |
| GET      | `/api/markets`        | Available market roots + contracts |
| GET      | `/api/db/bars`        | Raw OHLCV bars from TimescaleDB    |
| POST     | `/api/import`         | CSV import                         |
| GET      | `/api/bars`           | Bars (sim-aware, used by frontend) |
| POST     | `/api/sim/start`      | Start replay simulation            |
| GET      | `/api/replay/dates`   | Available replay dates             |
| POST     | `/api/sim/stop`       | Stop simulation                    |
| GET      | `/api/sim/status`     | Simulation status                  |
| POST     | `/api/sim/step`       | Step one bar forward/backward      |
| POST     | `/api/sim/seek`       | Seek to position (0.0–1.0)         |
| WS       | `/ws/bars/{symbol}`   | WebSocket bar stream               |

### Startup tasks (background)
- `start_bar_poller()` — polls DB every 5s, broadcasts new bars via WebSocket
- `auto_backfill()` — fills missing days for `NQM6`, `ESM6` via Databento (if key present)

---

## Unmounted Route Files (DEAD — not included in app)

| File           | Prefix           | Endpoint                | Status   |
|----------------|------------------|-------------------------|----------|
| `setups.py`    | `/api/setups`    | `GET /api/setups`       | **NOT MOUNTED** — file exists, router defined, never `include_router`'d |
| `travis.py`    | `/api`           | `POST /api/travis/ask`  | **NOT MOUNTED** — superseded by `arctis_ai.py` which re-implements `/travis/ask` |

### Notes on unmounted files

**`setups.py`**: Implements a full `/api/setups` endpoint. The frontend has `useSetups.ts` hook
and `SetupLifecyclePanel.tsx` panel that both target this endpoint. Neither the hook nor
the panel are rendered anywhere in the current app (`App.tsx` does not import them;
`panels/index.ts` does not export `SetupLifecyclePanel`). Full orphan chain: route → hook → panel.

**`travis.py`**: Implements `POST /api/travis/ask`. This functionality is covered by
`arctis_ai.py` which also defines `/travis/ask` as a hidden alias under the `/api/arctis`
prefix. The standalone `travis.py` is a legacy duplicate.

---

## Prefix Collision Warning

`analysis.py` (prefix `/api/analysis`) and `risk.py` (prefix `/api/analysis`) share the same
prefix. `risk.py` contributes routes `/api/analysis/config` (GET/PUT) and mounts no `/bias`
route — bias is in `bias.py` under prefix `/api`. This prefix-sharing is non-obvious and
should be documented carefully.

`probability.py` (prefix `/api`) and `feed.py` (prefix `/api`) and `bias.py` (prefix `/api`)
all use the bare `/api` prefix — they register specific named paths (`/probability`, `/bias`,
`/feed`, `/feed/events`) so there is no conflict, but it diverges from the namespaced pattern
used by other routers.

---

## Summary

| Category            | Count |
|---------------------|-------|
| Mounted routers     | 12    |
| Unmounted routers   | 2     |
| Direct main.py routes | 12  |
| WebSocket endpoints | 1     |
| Startup background tasks | 2 |

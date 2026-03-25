# Arctis — Setup Guide

## Prerequisites

- Node.js 18+ with pnpm (`npm i -g pnpm`)
- Python 3.12+
- Docker (for TimescaleDB)
- Git

---

## 1. Clone & Checkout

```bash
git clone https://github.com/algorivo/arctis.git
cd arctis
git checkout feat/masterpack-230
```

---

## 2. Database (TimescaleDB)

```bash
docker run -d \
  --name algorivo-db \
  -p 5532:5432 \
  -e POSTGRES_USER=algorivo \
  -e POSTGRES_PASSWORD=algorivo_dev \
  -e POSTGRES_DB=algorivo \
  timescale/timescaledb:latest-pg16
```

**Connection URL:**
```
postgres://algorivo:algorivo_dev@localhost:5532/algorivo
```

**Verify:**
```bash
psql "postgres://algorivo:algorivo_dev@localhost:5532/algorivo" -c "SELECT 1;"
```

If the container already exists:
```bash
docker start algorivo-db
```

### Database Schema

The engine creates tables automatically on first run. Core tables:
- `candles` — OHLCV data (PK: symbol, timeframe, ts)
- `ohlcv_1m` — View on candles for 1-minute bars

---

## 3. Backend (Engine)

```bash
cd engine
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

**Start:**
```bash
uvicorn arctis.main:app --host 0.0.0.0 --port 28080
```

**Environment Variables (optional):**
```bash
export DATABASE_URL="postgres://algorivo:algorivo_dev@localhost:5532/algorivo"
export TRAVIS_MCP_GATEWAY=""  # Leave empty for local analysis fallback
```

**Verify:**
```bash
curl http://localhost:28080/health
# {"status": "ok"}
```

---

## 4. Frontend (App)

```bash
cd app
pnpm install    # Also copies SciChart WASM files via postinstall
pnpm dev        # Starts on http://localhost:5174
```

**Verify:** Open http://localhost:5174 in Chrome.

---

## 5. Rithmic Live Data

Connect via API call after engine is running:

```bash
curl -X POST "http://localhost:28080/api/live/rithmic/login?username=kaan-aslan@gmx.de&password=kan747&server=Rithmic%2001"
```

**Rithmic Credentials:**
- Username: `kaan-aslan@gmx.de`
- Password: `kan747`
- Server: `Rithmic 01` (Frankfurt: `wss://ritpz23010.rithmic.com:443`)

**Instruments:** NQM6 (CME), ESM6 (CME)

**Verify:**
```bash
curl http://localhost:28080/api/live/status
# {"connected": true, "provider": "rithmic", "rithmic_connected": true}
```

**Disconnect:**
```bash
curl -X POST http://localhost:28080/api/live/rithmic/logout
```

---

## 6. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/markets` | GET | Available markets |
| `/api/db/bars?symbol=NQM6&timeframe=5min&days=5` | GET | Historical OHLCV bars |
| `/api/snapshot?market=NQ&timeframe=5min` | GET | Full analysis snapshot |
| `/api/analysis/sessions?market=NQ` | GET | Session detection |
| `/api/analysis/bias?market=NQ` | GET | Market bias |
| `/api/analysis/indicators?market=NQ` | GET | VWAP, EMA, RSI |
| `/api/signals?market=NQ` | GET | Trade signals |
| `/api/setups?market=NQ` | GET | Setup lifecycle |
| `/api/live/status` | GET | Rithmic connection |
| `/api/live/prices` | GET | All live tick prices |
| `/api/live/ticks` | WS | Real-time tick WebSocket |
| `/api/travis/ask` | POST | Travis AI assistant |
| `/api/features` | GET | Feature flags |
| `/api/metrics` | GET | Engine metrics |
| `/api/drawings?symbol=NQM6&timeframe=5min` | GET | Saved drawings |
| `/api/workspace/layout` | GET/PUT | Workspace preferences |

---

## 7. Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 5174 |
| Engine (FastAPI) | 28080 |
| TimescaleDB | 5532 |

---

## 8. Stack

- **Backend:** Python FastAPI, SQLAlchemy, TimescaleDB
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Charts:** SciChart 5.1 (WebGL, CandlestickChart.tsx = canonical core)
- **State:** Zustand (market, settings, drawing stores)
- **Live Data:** Rithmic via async_rithmic, WebSocket tick push
- **Design:** Arctic Frost theme (ice blue #5CB8F0, red #EF4136, dark #0F1318)

---

## 9. Key Files

| File | Purpose |
|------|---------|
| `engine/src/arctis/main.py` | FastAPI entry point, all routers |
| `engine/src/arctis/routes/live.py` | Rithmic integration + tick WS |
| `engine/src/arctis/analysis/signals.py` | Trade signal detection |
| `engine/src/arctis/analysis/sessions.py` | Session classification (7 sessions) |
| `app/src/App.tsx` | Main app shell |
| `app/src/pages/ChartPage.tsx` | Chart page with all wiring |
| `app/src/components/charts/CandlestickChart.tsx` | SciChart core (1849 lines) |
| `app/src/components/charts/ArctisChartWrapper.tsx` | Data adapter |
| `app/src/hooks/useMarketData.ts` | REST + WS data hook |
| `app/src/store/market.ts` | Market state (Zustand) |
| `.claude/CLAUDE.md` | AI assistant project instructions |

---

## 10. Troubleshooting

**Chart blank:** Engine not running or wrong port. Check `curl localhost:28080/health`.

**"OFFLINE" badge:** Rithmic not connected. Run the login curl command from section 5.

**No bars:** Database empty. Connect Rithmic and wait for bars to accumulate, or use Databento backfill (requires separate API key, not included).

**SciChart watermark:** Normal for community license. Suppressed via CSS.

**Port conflict:** Kill existing processes: `kill $(lsof -i :28080 -t) && kill $(lsof -i :5174 -t)`

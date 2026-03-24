# Rithmic Live Feed Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Arctis to the existing AlgoView Live Trading Service (Port 28081) for real-time market data — live candles, depth, trades, and market stats from Rithmic.

**Architecture:** Copy and adapt AlgoView's `liveClient.ts` + `useLiveConnection.ts` pattern. Binary Protobuf WebSocket to `ws://localhost:28081/ws`. The backend already runs — Arctis only needs the frontend client. Falls back gracefully to DB polling when live service is unavailable.

**Tech Stack:** Protobuf (binary WS) / Zustand store / React hooks / Existing AlgoView live-service (Port 28081)

**Source files to copy from AlgoView:**
- `~/worktrees/algoview/algorivo-web/src/features/live/liveClient.ts`
- `~/worktrees/algoview/algorivo-web/src/features/live/useLiveConnection.ts`
- `~/worktrees/algoview/algorivo-web/src/features/live/useLiveStore.ts`
- `~/worktrees/algoview/algorivo-web/src/features/live/proto/` (Protobuf definitions)

---

## File Structure

### New files in Arctis
- Create: `app/src/live/liveClient.ts` — WebSocket client (adapted from AlgoView)
- Create: `app/src/live/useLiveConnection.ts` — React hook for live data lifecycle
- Create: `app/src/live/useLiveStore.ts` — Zustand store for live candles/depth/trades
- Create: `app/src/live/proto/` — Protobuf message definitions (copied from AlgoView)
- Create: `app/src/live/index.ts` — barrel export

### Modified files
- Modify: `app/src/hooks/useMarketData.ts` — switch to live source when available
- Modify: `app/src/store/market.ts` — add `dataSource: 'live' | 'db'` state
- Modify: `app/src/lib/config.ts` — add `liveWsUrl` config
- Modify: `app/src/components/layout/StatusBar.tsx` — show LIVE/DB indicator

---

## Task 1: Copy Protobuf definitions from AlgoView

**Files:**
- Create: `app/src/live/proto/` directory

- [ ] **Step 1:** Copy proto files from AlgoView
```bash
mkdir -p ~/arctis/app/src/live/proto
cp -r ~/worktrees/algoview/algorivo-web/src/features/live/proto/* ~/arctis/app/src/live/proto/
```

- [ ] **Step 2:** Verify proto types compile
```bash
cd ~/arctis/app && pnpm exec tsc --noEmit 2>&1 | head -5
```

- [ ] **Step 3:** Commit
```bash
git add app/src/live/proto/ && git commit -m "feat: copy Protobuf definitions from AlgoView for live feed"
```

---

## Task 2: Adapt liveClient.ts for Arctis

**Files:**
- Create: `app/src/live/liveClient.ts`
- Source: `~/worktrees/algoview/algorivo-web/src/features/live/liveClient.ts`

- [ ] **Step 1:** Copy liveClient.ts from AlgoView
```bash
cp ~/worktrees/algoview/algorivo-web/src/features/live/liveClient.ts ~/arctis/app/src/live/liveClient.ts
```

- [ ] **Step 2:** Adapt the client:
- Remove order/position/account handling (Arctis doesn't trade)
- Keep: subscribe, unsubscribe, candle, depth, trade, marketStats, snapshot, connectionStatus
- Update import paths for proto files
- Change default WS URL to use config
- Keep reconnect logic (exponential backoff 1s → 30s)
- Keep heartbeat (15s ping, 30s timeout)

- [ ] **Step 3:** Fix import paths and verify TS compiles

- [ ] **Step 4:** Commit
```bash
git add app/src/live/ && git commit -m "feat: liveClient adapted from AlgoView — data-only, no trading"
```

---

## Task 3: Create useLiveStore (Zustand)

**Files:**
- Create: `app/src/live/useLiveStore.ts`

- [ ] **Step 1:** Create Zustand store for live data:
```typescript
import { create } from 'zustand'

interface LiveCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface LiveState {
  isConnected: boolean
  candles: LiveCandle[]
  lastPrice: number | null
  lastTrade: { price: number; size: number; side: string } | null
  marketStats: { high: number; low: number; open: number; close: number; volume: number } | null
  latencyUs: number | null

  setConnected: (v: boolean) => void
  setCandles: (c: LiveCandle[]) => void
  updateCandle: (c: LiveCandle) => void
  setLastPrice: (p: number) => void
  setLastTrade: (t: LiveState['lastTrade']) => void
  setMarketStats: (s: LiveState['marketStats']) => void
  setLatency: (us: number) => void
}
```

- [ ] **Step 2:** Commit
```bash
git add app/src/live/ && git commit -m "feat: useLiveStore — Zustand store for live market data"
```

---

## Task 4: Create useLiveConnection hook

**Files:**
- Create: `app/src/live/useLiveConnection.ts`
- Source: `~/worktrees/algoview/algorivo-web/src/features/live/useLiveConnection.ts`

- [ ] **Step 1:** Copy and adapt useLiveConnection from AlgoView:
- Read the AlgoView hook to understand lifecycle
- Adapt for Arctis: use `useMarketStore` for current symbol
- On mount: connect to live service, subscribe to current symbol
- On symbol change: unsubscribe old, subscribe new
- On candle message: update useLiveStore
- On trade message: update lastPrice
- On unmount: disconnect

- [ ] **Step 2:** Commit
```bash
git add app/src/live/ && git commit -m "feat: useLiveConnection hook — manages live WS lifecycle"
```

---

## Task 5: Add live config

**Files:**
- Modify: `app/src/lib/config.ts`

- [ ] **Step 1:** Add liveWsUrl to config:
```typescript
export const config = {
  apiBase: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
  wsBase: import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001',
  liveWsUrl: import.meta.env.VITE_LIVE_WS_URL || 'ws://127.0.0.1:28081/ws',
}
```

- [ ] **Step 2:** Commit
```bash
git add app/src/lib/config.ts && git commit -m "feat: add liveWsUrl config for Rithmic live service"
```

---

## Task 6: Integrate live data into useMarketData

**Files:**
- Modify: `app/src/hooks/useMarketData.ts`
- Modify: `app/src/store/market.ts`

- [ ] **Step 1:** Add `dataSource` to market store:
```typescript
dataSource: 'db' | 'live'  // default 'db', switches to 'live' when connected
setDataSource: (s: 'db' | 'live') => void
```

- [ ] **Step 2:** In useMarketData, check if live service is connected:
- If live store has candles → use live candles as `bars`
- If live store has lastPrice → update lastBarTs
- If live disconnected → fall back to DB polling (current behavior)

- [ ] **Step 3:** The switch should be automatic:
- Try to connect to live service on mount
- If connection succeeds → dataSource = 'live', stop DB polling
- If connection fails → dataSource = 'db', keep DB polling

- [ ] **Step 4:** Commit
```bash
git add app/src/ && git commit -m "feat: useMarketData auto-switches between live and DB sources"
```

---

## Task 7: Update StatusBar with live/db indicator

**Files:**
- Modify: `app/src/components/layout/StatusBar.tsx`

- [ ] **Step 1:** Show data source indicator:
- LIVE (green pulse) when connected to Rithmic
- DB (amber) when using database polling
- Show latency from live service if available

- [ ] **Step 2:** Commit
```bash
git add app/src/components/layout/StatusBar.tsx && git commit -m "feat: StatusBar shows LIVE/DB data source + latency"
```

---

## Task 8: Update Arctis AI to use live price

**Files:**
- Modify: `app/src/components/panels/TravisPanel.tsx`

- [ ] **Step 1:** When live store has lastPrice, pass that to AI instead of last bar close
- This ensures AI always uses the most current price, whether from live or DB

- [ ] **Step 2:** Commit
```bash
git add app/src/ && git commit -m "feat: Arctis AI uses live price when available"
```

---

## Task 9: Barrel export + TS check + build

**Files:**
- Create: `app/src/live/index.ts`

- [ ] **Step 1:** Create barrel export:
```typescript
export { liveClient } from './liveClient'
export { useLiveConnection } from './useLiveConnection'
export { useLiveStore } from './useLiveStore'
```

- [ ] **Step 2:** Run full verification:
```bash
cd ~/arctis/app && pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run build
pnpm test
```

- [ ] **Step 3:** Commit
```bash
git add -A && git commit -m "feat: Rithmic live feed integration complete"
```

---

## Task 10: Integration test

- [ ] **Step 1:** Start AlgoView live service: verify `ws://localhost:28081/ws` is accessible
- [ ] **Step 2:** Start Arctis: `cd ~/arctis/app && pnpm dev --port 5174`
- [ ] **Step 3:** Open Arctis in browser — verify StatusBar shows LIVE
- [ ] **Step 4:** Verify candles update in real-time
- [ ] **Step 5:** Verify price in Topbar matches live price
- [ ] **Step 6:** Ask Arctis AI "Wo steht der Markt?" — verify it shows live price
- [ ] **Step 7:** Disconnect live service — verify fallback to DB polling
- [ ] **Step 8:** Push
```bash
git push
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Copy Protobuf defs | live/proto/ |
| 2 | Adapt liveClient | live/liveClient.ts |
| 3 | Live Zustand store | live/useLiveStore.ts |
| 4 | Connection hook | live/useLiveConnection.ts |
| 5 | Config | lib/config.ts |
| 6 | Auto-switch DB↔Live | hooks/useMarketData.ts, store/market.ts |
| 7 | StatusBar indicator | layout/StatusBar.tsx |
| 8 | AI live price | panels/TravisPanel.tsx |
| 9 | Build verify | — |
| 10 | Integration test | — |

**Total: 10 Tasks, ~40 Steps**

**Key Insight:** The backend live service already exists (AlgoView, Port 28081). Arctis only needs the frontend client. No Python/FastAPI changes needed.

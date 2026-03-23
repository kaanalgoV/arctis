# Proberun — Setup-Erkennung im Replay

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "Proberun" mode that replays historical market data and progressively draws recognized trade setups (ORB Break, IB Break, POC Rejection, VA Edge, BOS, Sammelzone Breakout, Absorption) directly on the chart with entry/stop/target levels as they emerge.

**Architecture:** Extend the existing replay system (useReplay + /api/sim/*) with a dedicated `/api/signals` endpoint that returns trade signals for bars visible at replay time. Chart markers and price-line annotations render setups progressively. A "Setup Card" overlay shows active setup details on the chart.

**Tech Stack:** Python FastAPI (signals endpoint) / React 19 / Lightweight Charts 5.1 / Zustand / existing useReplay hook

---

## File Structure

### Backend
- Create: `engine/src/arctis/routes/signals.py` — dedicated /api/signals endpoint
- Modify: `engine/src/arctis/main.py` — register signals router
- Modify: `engine/src/arctis/analysis/signals.py` — add `detect_signals_for_bars()` public API

### Frontend
- Create: `app/src/components/charts/SetupAnnotation.tsx` — setup card overlay on chart
- Create: `app/src/hooks/useSignals.ts` — poll signals during replay
- Modify: `app/src/components/charts/SimpleChart.tsx` — render setup entry/stop/target lines
- Modify: `app/src/hooks/useReplay.ts` — add seek support + bar-by-bar mode
- Modify: `app/src/components/replay/ReplayBar.tsx` — add Proberun toggle + bar-step buttons

---

## Task 1: Dedicated /api/signals endpoint

**Files:**
- Create: `engine/src/arctis/routes/signals.py`
- Modify: `engine/src/arctis/main.py`

- [ ] **Step 1:** Create `engine/src/arctis/routes/signals.py`:
```python
from fastapi import APIRouter, Query
from arctis.analysis.signals import detect_signals
from arctis.db import fetch_bars_as_models

router = APIRouter(prefix="/api/signals", tags=["signals"])

@router.get("")
async def get_signals(
    market: str = Query(...),
    timeframe: str = Query(default="1min"),
    days: int = Query(default=5),
    max_bars: int | None = Query(default=None),
):
    """Return detected trade signals. If max_bars set, only analyze first N bars (for replay)."""
    bars = fetch_bars_as_models(market=market, days=days, timeframe=timeframe)
    if max_bars and max_bars < len(bars):
        bars = bars[:max_bars]
    signals = detect_signals(bars)
    return {
        "signals": [s.__dict__ for s in signals],
        "bar_count": len(bars),
        "market": market,
    }
```

- [ ] **Step 2:** Register router in `main.py`:
```python
from arctis.routes.signals import router as signals_router
app.include_router(signals_router)
```

- [ ] **Step 3:** Run: `source engine/.venv/bin/activate && cd engine && python -c "from arctis.routes.signals import router; print('OK')"`

- [ ] **Step 4:** Commit: `feat: dedicated /api/signals endpoint with max_bars for replay`

---

## Task 2: useSignals hook for replay

**Files:**
- Create: `app/src/hooks/useSignals.ts`

- [ ] **Step 1:** Create the hook:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { useMarketStore } from '../store/market'

export interface TradeSignal {
  signal_type: string
  direction: 'long' | 'short'
  entry_price: number
  stop_price: number
  target_price: number
  risk_reward: number
  confidence: string
  reason: string
  timestamp: number
}

export function useSignals(maxBars?: number, enabled = true) {
  const { market, timeframe } = useMarketStore()
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSignals = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ market, timeframe, days: '5' })
      if (maxBars) params.set('max_bars', String(maxBars))
      const res = await fetch(`http://127.0.0.1:8001/api/signals?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSignals(data.signals || [])
      }
    } catch {} finally {
      setIsLoading(false)
    }
  }, [market, timeframe, maxBars, enabled])

  useEffect(() => { fetchSignals() }, [fetchSignals])

  return { signals, isLoading, refetch: fetchSignals }
}
```

- [ ] **Step 2:** Run: `pnpm exec tsc --noEmit`

- [ ] **Step 3:** Commit: `feat: useSignals hook with max_bars for replay`

---

## Task 3: Setup annotations on chart

**Files:**
- Create: `app/src/components/charts/SetupAnnotation.tsx`

- [ ] **Step 1:** Create setup card overlay component:
```typescript
import type { TradeSignal } from '../../hooks/useSignals'

const TYPE_LABELS: Record<string, string> = {
  orb_break: 'ORB Break', ib_break: 'IB Break',
  poc_rejection: 'POC Reject', va_edge: 'VA Edge',
  bos: 'BOS', sammelzone_breakout: 'Zone Break',
  absorption: 'Absorption',
}

export function SetupAnnotation({ signal, onClose }: {
  signal: TradeSignal
  onClose: () => void
}) {
  const isLong = signal.direction === 'long'
  const color = isLong ? '#22C55E' : '#EF4444'

  return (
    <div className="absolute top-2 right-2 z-50 bg-[#161B22] border border-[#21262D] rounded-md p-3 w-52 font-mono text-[11px]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-[13px]" style={{ color }}>
          {TYPE_LABELS[signal.signal_type] || signal.signal_type}
        </span>
        <button onClick={onClose} className="text-[#484F58] hover:text-[#8B949E]">x</button>
      </div>
      <div className="space-y-1 text-[#8B949E]">
        <div className="flex justify-between">
          <span>Direction</span>
          <span style={{ color }}>{signal.direction.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Entry</span>
          <span className="text-[#E6EDF3]">{signal.entry_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Stop</span>
          <span className="text-[#EF4444]">{signal.stop_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Target</span>
          <span className="text-[#22C55E]">{signal.target_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>R:R</span>
          <span className="text-[#5CB8F0]">{signal.risk_reward.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span>Confidence</span>
          <span>{signal.confidence}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-[#21262D] text-[10px] text-[#484F58]">
        {signal.reason}
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** Run: `pnpm exec tsc --noEmit`

- [ ] **Step 3:** Commit: `feat: SetupAnnotation card component`

---

## Task 4: Render setup levels on chart

**Files:**
- Modify: `app/src/components/charts/SimpleChart.tsx`

- [ ] **Step 1:** Read SimpleChart.tsx, find the marker/overlay rendering section

- [ ] **Step 2:** Add `signals` prop:
```typescript
signals?: TradeSignal[]
```

- [ ] **Step 3:** Add setup level rendering — for each signal, draw entry/stop/target as price lines:
```typescript
// After existing overlay rendering, add setup levels:
if (signals?.length) {
  for (const sig of signals.slice(-3)) { // Show last 3 setups max
    const isLong = sig.direction === 'long'
    // Entry line (white dashed)
    candleSeries.createPriceLine({
      price: sig.entry_price,
      color: 'rgba(255,255,255,0.6)',
      lineWidth: 1, lineStyle: 2,
      axisLabelVisible: true,
      title: `${sig.signal_type} Entry`,
    })
    // Stop line (red dotted)
    candleSeries.createPriceLine({
      price: sig.stop_price,
      color: 'rgba(239,68,68,0.5)',
      lineWidth: 1, lineStyle: 3,
      axisLabelVisible: false,
      title: 'Stop',
    })
    // Target line (green dotted)
    candleSeries.createPriceLine({
      price: sig.target_price,
      color: 'rgba(34,197,94,0.5)',
      lineWidth: 1, lineStyle: 3,
      axisLabelVisible: false,
      title: 'Target',
    })
  }
}
```

- [ ] **Step 4:** Add signal markers at trigger bar:
```typescript
// Add signal trigger markers
const signalMarkers = (signals || []).slice(-5).map((sig, i) => ({
  time: sig.timestamp as UTCTimestamp,
  position: sig.direction === 'long' ? 'belowBar' : 'aboveBar',
  shape: sig.direction === 'long' ? 'arrowUp' : 'arrowDown',
  color: sig.direction === 'long' ? '#22C55E' : '#EF4444',
  text: TYPE_LABELS[sig.signal_type] || sig.signal_type,
  size: 2,
}))
```

- [ ] **Step 5:** Run: `pnpm exec tsc --noEmit`

- [ ] **Step 6:** Commit: `feat: render setup entry/stop/target levels on chart`

---

## Task 5: Enhanced replay with bar-by-bar stepping

**Files:**
- Modify: `app/src/hooks/useReplay.ts`
- Modify: `app/src/components/replay/ReplayBar.tsx`

- [ ] **Step 1:** Read useReplay.ts — add `stepForward` and `stepBackward` functions:
```typescript
const stepForward = useCallback(async () => {
  // Advance simulation by 1 bar
  await fetch(`${ENGINE_URL}/api/sim/step?direction=forward`, { method: 'POST' })
  await pollStatus()
}, [pollStatus])

const stepBackward = useCallback(async () => {
  await fetch(`${ENGINE_URL}/api/sim/step?direction=backward`, { method: 'POST' })
  await pollStatus()
}, [pollStatus])
```

- [ ] **Step 2:** Add step endpoint to backend `engine/src/arctis/main.py`:
```python
@app.post("/api/sim/step")
async def sim_step(direction: str = Query(default="forward")):
    if sim.active:
        if direction == "forward":
            sim.visible_count = min(sim.visible_count + 1, len(sim.bars))
        else:
            sim.visible_count = max(sim.visible_count - 1, 0)
        return {"visible_bars": sim.visible_count, "total_bars": len(sim.bars)}
    return {"error": "No active simulation"}
```

- [ ] **Step 3:** Update ReplayBar.tsx — add "Proberun" toggle button:
```typescript
<button
  onClick={() => setProberunMode(!proberunMode)}
  className={`px-2 py-1 text-[10px] rounded ${proberunMode ? 'bg-[#5CB8F0] text-black' : 'bg-[#21262D] text-[#8B949E]'}`}
>
  Proberun
</button>
```

- [ ] **Step 4:** Run: `pnpm exec tsc --noEmit`

- [ ] **Step 5:** Commit: `feat: bar-by-bar stepping + Proberun mode toggle`

---

## Task 6: Wire Proberun — signals during replay

**Files:**
- Modify: `app/src/App.tsx` or `app/src/pages/ChartPage.tsx`

- [ ] **Step 1:** Read ChartPage.tsx or App.tsx — find where replay state and chart are connected

- [ ] **Step 2:** When replay is active AND Proberun mode is on:
   - Poll `/api/signals?max_bars={visible_bars}` on each replay tick
   - Pass signals to SimpleChart as prop
   - Show SetupAnnotation card when user clicks a signal marker

- [ ] **Step 3:** Integration:
```typescript
const { signals } = useSignals(
  replay.isPlaying ? replay.simStatus?.visible_bars : undefined,
  replay.isPlaying && proberunMode
)

// Pass to chart:
<SimpleChart
  bars={bars}
  signals={proberunMode ? signals : undefined}
  // ... other props
/>
```

- [ ] **Step 4:** Run: `pnpm exec tsc --noEmit && pnpm run build`

- [ ] **Step 5:** Commit: `feat: Proberun mode — progressive signal detection during replay`

---

## Task 7: Backend sim/step endpoint

**Files:**
- Modify: `engine/src/arctis/main.py`

- [ ] **Step 1:** Read main.py — find the Simulation class

- [ ] **Step 2:** Add `visible_count` manual control to Simulation:
```python
@app.post("/api/sim/step")
async def sim_step(direction: str = Query(default="forward")):
    """Step forward/backward by one bar during simulation."""
    if not sim.active:
        raise HTTPException(404, "No active simulation")
    if direction == "forward":
        sim._manual_offset = getattr(sim, '_manual_offset', 0) + 1
    elif direction == "backward":
        sim._manual_offset = max(getattr(sim, '_manual_offset', 0) - 1, 0)
    return {"status": "ok", "offset": sim._manual_offset}
```

- [ ] **Step 3:** Run: `source engine/.venv/bin/activate && cd engine && python -m pytest tests/ -q 2>&1 | tail -5`

- [ ] **Step 4:** Commit: `feat: /api/sim/step endpoint for bar-by-bar replay`

---

## Task 8: Final verification

- [ ] **Step 1:** Start backend: `uvicorn src.arctis.main:app --port 8001 --reload`
- [ ] **Step 2:** Start frontend: `cd app && pnpm dev --port 5174`
- [ ] **Step 3:** Test replay: select date → play → verify bars stream
- [ ] **Step 4:** Test Proberun: enable Proberun → verify signals appear progressively
- [ ] **Step 5:** Test bar stepping: pause → step forward/backward
- [ ] **Step 6:** Test setup card: click signal marker → card shows entry/stop/target
- [ ] **Step 7:** Push: `git push`

---

## Summary

| Task | Focus | Key Deliverable |
|------|-------|-----------------|
| 1 | Backend | /api/signals endpoint with max_bars |
| 2 | Frontend | useSignals hook |
| 3 | Frontend | SetupAnnotation card component |
| 4 | Chart | Entry/stop/target lines + signal markers |
| 5 | Replay | Bar-by-bar stepping + Proberun toggle |
| 6 | Integration | Wire signals → chart during replay |
| 7 | Backend | /api/sim/step for bar stepping |
| 8 | Verification | E2E test |

**Total: 8 Tasks, ~35 Steps**

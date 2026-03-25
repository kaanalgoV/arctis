# Arctis x AlgoView — RalphLoop Cloud Code Masterplan Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Arctis from a prototype with disconnected subsystems into a canonical, fully-wired, SaaS-ready Trading Context OS with SciChart chart core, Setup Runtime, Travis MCP integration, and unified data contracts.

**Architecture:** 4-layer system: Data Plane (TimescaleDB + Rithmic live), Analysis Plane (sessions/bias/structure/setups), Chart Plane (SciChart CandlestickChart as canonical core), Knowledge Plane (Travis MCP). Single canonical data contract from backend through all UI panels. Setup objects with full lifecycle (candidate → armed → triggered → exited).

**Tech Stack:** Python FastAPI (engine), React/TypeScript (frontend), SciChart 5.1 (charts), Zustand (state), TimescaleDB (data), Rithmic (live feed), MCP (Travis knowledge layer)

**Source Document:** `ARCTIS_RALPHLOOP_CLOUD_CODE_MCP_TRAVIS_MASTERPLAN_DE.md`

**Current State (2026-03-25):** SciChart CandlestickChart ported 1:1 from AlgoView (1849 lines), VWAP/EMA/VP/Session Levels active, Rithmic connected, but many props not wired through, Drawing tools non-functional, Setup Runtime missing, Travis is template-only.

**Conventions for this plan:**
- Each step is designed to take 2-5 minutes of focused work
- Every phase has a **Precondition** (what must be true before starting) and a **Phase Output** (what is true when done)
- Phases build on each other — do not skip preconditions
- `localStorage` is acceptable as interim state only; backend sync is required before any phase is "done"

---

## Phase 0: Reality Audit & Canonical Path Matrix

**Precondition:** Arctis repo is checked out, engine boots (`uvicorn` starts without error), frontend compiles (`pnpm dev` reaches browser).

### Task 0.1: Generate Active Route Map

**Files:**
- Create: `docs/reality-audit/current-runtime-map.md`
- Read: `engine/src/arctis/main.py`

- [ ] **Step 1: Audit all mounted routers in main.py**

```bash
grep -n "include_router\|app\.mount\|router\." engine/src/arctis/main.py
```

Document every mounted and unmounted router with its prefix and source file.

- [ ] **Step 2: Check which route files exist but are NOT mounted**

```bash
ls engine/src/arctis/routes/*.py
# Cross-reference with mounted routers from step 1
```

Flag each file as: mounted / unmounted / deprecated.

- [ ] **Step 3: Write current-runtime-map.md**

Document: route file → mounted? → endpoint prefix → active in UI?

- [ ] **Step 4: Commit**

```bash
git add docs/reality-audit/
git commit -m "docs: phase 0 - active route map"
```

### Task 0.2: Generate Canonical Path Matrix

**Files:**
- Create: `docs/reality-audit/canonical-path-matrix.md`
- Read: `app/src/App.tsx`, `app/src/pages/ChartPage.tsx`, `app/src/hooks/*.ts`

- [ ] **Step 1: Map every sidebar nav item to its page component**

Trace: Sidebar button → `activePage` state → rendered component

- [ ] **Step 2: Map every chart toolbar button to its actual effect**

For each button (VWAP, EMA, Vol, VP, Levels, Zones, Fullscreen + drawing tools), document:
- Button visible? Y/N
- Prop passed to chart? Y/N
- Chart renders it? Y/N

- [ ] **Step 3: Map data flow for each subsystem**

| Subsystem | Hook | API Endpoint | Data reaches Chart? | Data reaches Panel? |
|-----------|------|-------------|--------------------|--------------------|
| Bars | useMarketData | /api/db/bars | Yes | N/A |
| VWAP | useAnalysis | /api/analysis/indicators | Yes (via wrapper) | Yes (HUD) |
| Drawings | useDrawings | localStorage only | Partial (hline only) | N/A |
| Setups | useSetups | /api/setups | **NO (not mounted)** | **NO** |
| Travis | — | /api/travis | **NO (not mounted)** | Template only |
| Live | useMarketData | /api/live/price | Yes (1s poll) | StatusBar |
| Replay | useReplay | /api/sim/* | Yes | ReplayBar |

- [ ] **Step 4: Write canonical-path-matrix.md with findings**

- [ ] **Step 5: Commit**

```bash
git commit -m "docs: phase 0 - canonical path matrix"
```

### Task 0.3: Dead Code Inventory

**Files:**
- Create: `docs/reality-audit/dead-code-candidates.md`

- [ ] **Step 1: Identify unused/deprecated files**

Known candidates:
- `app/src/components/charts/SimpleChart.tsx` (replaced by SciChart)
- `app/src/components/charts/_deprecated/` directory
- `app/src/lib/_deprecated_scichart-init.ts`
- Old `useDrawings` hook (replaced by drawingStore)
- `app/src/types/market.ts` (duplicate of contracts.ts types)

- [ ] **Step 2: Identify unmounted backend routes**

- `engine/src/arctis/routes/travis.py` — NOT mounted
- `engine/src/arctis/routes/setups.py` — NOT mounted
- Any others found in Task 0.1

- [ ] **Step 3: Document and commit**

```bash
git commit -m "docs: phase 0 - dead code candidates"
```

### Task 0.4: Set Up .claude/ Project Configuration

**Files:**
- Create: `.claude/agents/phase-runner.md`
- Create: `.claude/agents/backend-specialist.md`
- Create: `.claude/agents/frontend-specialist.md`
- Create: `.claude/rules/no-hardcoded-urls.md`
- Create: `.claude/rules/no-localstorage-final-state.md`
- Create: `.claude/rules/phase-gate-enforcement.md`
- Create: `.claude/hooks/phase-gate-check.sh`

- [ ] **Step 1: Create .claude/agents/ with role specs**

Each agent spec defines: role, scope, tools allowed, files it may touch, escalation rules. Example for `backend-specialist.md`:
```
Role: Python FastAPI engine specialist
Scope: engine/src/arctis/ only
May NOT touch: app/src/ frontend code
Escalate to: phase-runner if contract changes needed
```

- [ ] **Step 2: Create .claude/rules/ with project constraints**

`no-localstorage-final-state.md`:
```
localStorage may be used as interim state only.
Every drawing, setting, and user preference must have a backend sync endpoint.
A task is NOT done until backend sync is implemented.
```

`no-hardcoded-urls.md`:
```
All API calls must use config.apiBase from app/src/lib/config.ts.
Grep for "127.0.0.1", "localhost:8001" before every commit.
```

`phase-gate-enforcement.md`:
```
A phase may not begin until its Precondition is verified.
A phase is complete only when its Phase Output section is fully satisfied.
```

- [ ] **Step 3: Create phase-gate-check.sh hook**

Shell script that runs before each phase begins, verifying the precondition checklist passes (engine running, tests green, prior phase output files exist).

- [ ] **Step 4: Commit**

```bash
git add .claude/
git commit -m "chore: phase 0 - claude project config, agent specs, phase gate rules"
```

---

### Phase 0 Output

**Changed files:** `docs/reality-audit/current-runtime-map.md`, `docs/reality-audit/canonical-path-matrix.md`, `docs/reality-audit/dead-code-candidates.md`, `.claude/agents/*.md`, `.claude/rules/*.md`, `.claude/hooks/phase-gate-check.sh`

**Target contract:** Every route, hook, and UI path is documented. Dead code is catalogued. Agent rules are codified.

**Tests:** Manual verification that all three audit docs exist and are non-empty.

**Open risks:** Audit may reveal more unmounted routes or duplicate contracts not yet known.

**Next step:** Phase 1 Backend Canonicalization.

---

## Phase 1: Backend Canonicalization

**Precondition:** Phase 0 complete. `docs/reality-audit/current-runtime-map.md` exists. Engine starts without import errors.

### Task 1.1: Mount Missing Routers

**Files:**
- Modify: `engine/src/arctis/main.py`
- Read: `engine/src/arctis/routes/travis.py`, `engine/src/arctis/routes/setups.py`

- [ ] **Step 1: Write test that verifies all routers are mounted**

```python
def test_all_routers_mounted():
    from arctis.main import app
    routes = [r.path for r in app.routes]
    assert any("/api/setups" in r for r in routes)
    assert any("/api/travis" in r for r in routes)
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Mount travis and setups routers in main.py**

```python
from arctis.routes.setups import router as setups_router
from arctis.routes.travis import router as travis_router
app.include_router(setups_router)
app.include_router(travis_router)
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 1 - mount setups and travis routers"
```

### Task 1.2: Fix Simulation Offset Bug

**Files:**
- Modify: `engine/src/arctis/main.py`
- Test: `tests/test_replay.py`

- [ ] **Step 1: Read current replay/sim code and identify the offset bug**

The masterplan says: manual replay steps change offset but `visible_bar_count()` ignores it.

- [ ] **Step 2: Write failing test**

```python
def test_replay_step_advances_visible_bars():
    # After stepping, visible_bar_count should increase
    pass
```

- [ ] **Step 3: Fix visible_bar_count to include manual offset**

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "fix: phase 1 - replay step offset affects visible bar count"
```

### Task 1.3: Central Symbol Resolver

**Files:**
- Modify: `engine/src/arctis/db.py`
- Modify: `engine/src/arctis/routes/_common.py`

- [ ] **Step 1: Extract `_resolve_symbol()` from db.py into a shared resolver**

All routes must use the same resolution logic.

- [ ] **Step 2: Create `engine/src/arctis/symbol_resolver.py`**

Single `resolve_symbol(market_root: str) -> str` function used by all routes.

- [ ] **Step 3: Update all routes to use the central resolver**

- [ ] **Step 4: Write test for symbol resolution**

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: phase 1 - central symbol resolver"
```

### Task 1.4: Remove Hardcoded ENGINE_URL

**Files:**
- Modify: `app/src/hooks/useSetups.ts`
- Modify: `app/src/lib/config.ts` (already fixed to localhost:28080)

- [ ] **Step 1: Find all hardcoded URLs in frontend**

```bash
grep -rn "127.0.0.1\|localhost:8001\|ENGINE_URL" app/src/
```

- [ ] **Step 2: Replace all with `config.apiBase`**

- [ ] **Step 3: Commit**

```bash
git commit -m "fix: phase 1 - remove hardcoded ENGINE_URLs"
```

### Task 1.5: Normalize Table/View Naming (bars/candles/ohlcv_1m)

**Files:**
- Read: `engine/src/arctis/db.py`
- Read: `engine/src/arctis/routes/db_routes.py` (or equivalent bars route)
- Modify: affected route files and db helpers

- [ ] **Step 1: Audit all DB table/view name strings used in queries**

```bash
grep -rn "bars\|candles\|ohlcv_1m\|ohlcv" engine/src/arctis/
```

Document every variant and which files use which name.

- [ ] **Step 2: Decide canonical name**

Canonical: `ohlcv_1m` for the TimescaleDB hypertable. `bars` is the API response field name. `candles` is deprecated.

- [ ] **Step 3: Update all DB queries to use the canonical table/view name**

Replace non-canonical names in SQL strings. Do not rename the TimescaleDB table itself without a migration — only normalize the string references in code.

- [ ] **Step 4: Write test that queries succeed with canonical name**

```python
def test_ohlcv_query_uses_canonical_table():
    # Verify no query string contains "candles" or bare "bars" as table name
    pass
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: phase 1 - normalize table naming to ohlcv_1m"
```

### Task 1.6: Consolidate Duplicate Signal Endpoints

**Files:**
- Read: `engine/src/arctis/routes/signals.py` (if exists)
- Read: `engine/src/arctis/routes/analysis.py` (or equivalent)
- Modify: consolidated file, update imports in main.py

- [ ] **Step 1: Audit all signal-related endpoints**

```bash
grep -rn "signal\|Signal" engine/src/arctis/routes/
```

List every endpoint that returns signal data and its route path.

- [ ] **Step 2: Identify duplicates and overlapping response shapes**

Document: which endpoints return the same logical data, which are used by the frontend, which are orphaned.

- [ ] **Step 3: Consolidate into a single canonical signals endpoint**

Target: `GET /api/signals?market_root=NQ&timeframe=1m` returns all signal types in a unified response. Deprecate/remove duplicate routes.

- [ ] **Step 4: Update frontend hook (useAnalysis or useSignals) to use consolidated endpoint**

- [ ] **Step 5: Write test for consolidated endpoint**

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: phase 1 - consolidate duplicate signal endpoints"
```

### Task 1.7: Normalize Health Endpoints

**Files:**
- Read: `engine/src/arctis/main.py`
- Read: any existing health/status route files

- [ ] **Step 1: Audit all health/status endpoints**

```bash
grep -rn "health\|status\|ping\|ready" engine/src/arctis/
```

List every health-related endpoint path and what it returns.

- [ ] **Step 2: Define canonical health contract**

```python
# Target response shape for GET /api/health
{
    "status": "ok" | "degraded" | "down",
    "version": str,
    "timestamp": int,
    "subsystems": {
        "db": "ok" | "error",
        "rithmic": "connected" | "disconnected" | "error",
        "mcp": "ok" | "error"
    }
}
```

- [ ] **Step 3: Implement canonical /api/health endpoint**

If multiple health endpoints exist (`/health`, `/api/health`, `/status`), consolidate to `/api/health`. Add redirects or remove duplicates.

- [ ] **Step 4: Update frontend StatusBar to use canonical /api/health**

- [ ] **Step 5: Write test for health endpoint shape**

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: phase 1 - normalize health endpoints to /api/health"
```

---

### Phase 1 Output

**Changed files:** `engine/src/arctis/main.py`, `engine/src/arctis/symbol_resolver.py`, `engine/src/arctis/routes/*.py`, `app/src/lib/config.ts`, `app/src/hooks/useSetups.ts`

**Target contract:** All routers mounted. No hardcoded URLs in frontend. Single symbol resolver. Single table name convention. Single signal endpoint. Single health endpoint. All tests green.

**Tests:** `test_all_routers_mounted`, `test_replay_step_advances_visible_bars`, `test_symbol_resolution`, `test_ohlcv_query_uses_canonical_table`, `test_health_endpoint_shape`

**Open risks:** Signal consolidation may break existing frontend data flow if response shape changes. Coordinate with Phase 2 snapshot design.

**Next step:** Phase 2 Canonical Analysis Snapshot.

---

## Phase 2: Canonical Analysis Snapshot

**Precondition:** Phase 1 complete. All routers mounted. Tests green. No hardcoded URLs.

### Task 2.1: Design Snapshot Contract

**Files:**
- Create: `docs/contracts/analysis-snapshot.md`
- Create: `engine/src/arctis/routes/snapshot.py`

- [ ] **Step 1: Define the canonical snapshot response shape**

```python
AnalysisSnapshot = {
    "market_root": str,
    "resolved_symbol": str,
    "timeframe": str,
    "timestamp": int,
    "session": SessionData,
    "bias": BiasData,
    "structure": StructureData,
    "levels": LevelsData,
    "zones": ZonesData,
    "signals": SignalsData,
    "setups": SetupsData,
    "confluence": ConfluenceData,
    "indicators": IndicatorData,
    "volume": VolumeData,
    "chart_artifacts": ChartArtifacts,
}
```

- [ ] **Step 2: Write docs/contracts/analysis-snapshot.md**

Document every field: type, source, update frequency, whether it is required or optional.

- [ ] **Step 3: Implement `/api/snapshot` endpoint**

Combines all analysis into one response. Frontend polls ONE endpoint instead of 10.

- [ ] **Step 4: Write test for snapshot endpoint**

```python
def test_snapshot_returns_all_fields():
    response = client.get("/api/snapshot?market_root=NQ&timeframe=1m")
    assert response.status_code == 200
    data = response.json()
    for field in ["session", "bias", "structure", "levels", "setups", "indicators"]:
        assert field in data
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 2 - canonical analysis snapshot endpoint"
```

### Task 2.2: Migrate Frontend to Snapshot

**Files:**
- Modify: `app/src/hooks/useAnalysis.ts`
- Modify: `app/src/api.ts`

- [ ] **Step 1: Add `fetchSnapshot()` to api.ts**

```typescript
export const fetchSnapshot = (marketRoot: string, timeframe: string) =>
  get<AnalysisSnapshot>(`/api/snapshot?market_root=${marketRoot}&timeframe=${timeframe}`)
```

- [ ] **Step 2: Update useAnalysis to use single snapshot endpoint**

Replace 10 parallel `Promise.allSettled` calls with one `/api/snapshot` call.

- [ ] **Step 3: Verify all panels still receive correct data**

Manually verify: BiasPanel, StructurePanel, SetupLifecyclePanel, chart levels/zones all show data.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: phase 2 - frontend uses single snapshot endpoint"
```

---

### Phase 2 Output

**Changed files:** `engine/src/arctis/routes/snapshot.py`, `docs/contracts/analysis-snapshot.md`, `app/src/hooks/useAnalysis.ts`, `app/src/api.ts`

**Target contract:** Frontend makes one poll call (`/api/snapshot`) and distributes the result to all panels. No panel makes its own individual analysis API call.

**Tests:** `test_snapshot_returns_all_fields`, frontend panels verified manually.

**Open risks:** Snapshot endpoint aggregation may have latency. If any sub-analysis takes >500ms, consider async partial responses in Phase 11.

**Next step:** Phase 3 Full Chart Wiring.

---

## Phase 3: Full Chart Wiring

**Precondition:** Phase 2 complete. Snapshot endpoint live. useAnalysis uses snapshot. All panel data still visible.

### Task 3.1: Wire All Chart Props Through ArctisChartWrapper

**Files:**
- Modify: `app/src/components/charts/ArctisChartWrapper.tsx`
- Modify: `app/src/pages/ChartPage.tsx`

- [ ] **Step 1: Add missing props to ArctisChartWrapper**

Currently missing:
- `activeTool` (DrawingToolType)
- `onDrawingComplete`, `onDrawingUpdate`, `onDrawingCancel`
- `userDrawings` (ChartDrawing[])
- `onDrawingDragEnd`, `onDrawingSelected`
- `selectedDrawingId`
- `markers` (TradeMarker[]) for setup entries/exits
- `zones` (TradeZone[]) for setup zones
- `priceZones` (PriceZone[])
- `sessionBands` (SessionBand[])
- `scrollToTimestamp`
- `onVisibleRangeChange` (for scrollbar)

- [ ] **Step 2: Update ChartPage to pass all props**

Connect from App.tsx analysis data → ChartPage → ArctisChartWrapper → CandlestickChart

- [ ] **Step 3: Verify each toolbar button has a visible effect**

Test VWAP, EMA, Vol, VP, Levels, Zones toggles.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 3 - full chart props wiring"
```

### Task 3.2: Connect Drawing Tools to SciChart

**Files:**
- Modify: `app/src/pages/ChartPage.tsx`
- Modify: `app/src/components/charts/ArctisChartWrapper.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Replace old useDrawings with drawingStore**

The Zustand `drawingStore` (already ported from AlgoView) replaces the old `useDrawings` hook.

- [ ] **Step 2: Wire activeTool from drawingStore to CandlestickChart**

```tsx
const activeTool = useDrawingStore(s => s.activeTool)
const wipDrawing = useDrawingStore(s => s.wipDrawing)
// Pass to CandlestickChart via ArctisChartWrapper
```

- [ ] **Step 3: Wire drawing callbacks**

```tsx
onDrawingComplete={(wip) => drawingStore.addDrawing(chartKey, wip)}
onDrawingDragEnd={(id, updates) => drawingStore.updateDrawing(chartKey, id, updates)}
```

- [ ] **Step 4: Update DrawingToolbar to use drawingStore**

- [ ] **Step 5: Test each drawing tool: hline, rectangle, trendline, text**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: phase 3 - drawing tools connected to SciChart"
```

### Task 3.3: Deprecate SimpleChart

**Files:**
- Modify: `app/src/components/charts/SimpleChart.tsx`

- [ ] **Step 1: Add deprecation notice**

```typescript
/** @deprecated Use CandlestickChart via ArctisChartWrapper instead. Kept as fallback only. */
```

- [ ] **Step 2: Remove SimpleChart import from ChartPage if still present**

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: phase 3 - deprecate SimpleChart, SciChart is canonical"
```

### Task 3.4: Polish Chart Visual Defaults

**Files:**
- Modify: `app/src/components/charts/CandlestickChart.tsx` (or equivalent SciChart wrapper)
- Modify: `app/src/components/charts/ArctisChartWrapper.tsx`
- Read: AlgoView chart config for reference defaults

- [ ] **Step 1: Audit current visual defaults against AlgoView reference**

Document deviations in: candle spacing, font sizes, grid density, legend placement, axis label formatting.

- [ ] **Step 2: Apply canonical spacing and font defaults**

- SciChart theme: match Arctic Frost color palette (Ice Blue #5CB8F0)
- Candle body/wick ratio: match AlgoView defaults
- Grid lines: subdued (10% opacity on #5CB8F0)
- Axis fonts: monospace, 11px, same as AlgoView

- [ ] **Step 3: Fix legend placement and content**

Legend must show: symbol, timeframe, OHLCV values for hovered candle.

- [ ] **Step 4: Tune animation settings**

- Live tick updates: smooth lerp, no flash
- Replay step: instant draw, no transition delay
- Drawing creation: immediate visual feedback

- [ ] **Step 5: Apply chart margin/padding defaults**

Consistent right-side price axis width, top margin for session open label.

- [ ] **Step 6: Commit**

```bash
git commit -m "style: phase 3 - polish chart visual defaults (spacing, fonts, grid, legends)"
```

---

### Phase 3 Output

**Changed files:** `ArctisChartWrapper.tsx`, `ChartPage.tsx`, `CandlestickChart.tsx`, `App.tsx`, `DrawingToolbar.tsx`, `SimpleChart.tsx` (deprecated), `drawingStore.ts` (connected)

**Target contract:** Every toolbar toggle has a visible chart effect. Drawing tools (hline, rect, trendline, text) are creatable by clicking the toolbar. Chart renders with Arctic Frost visual defaults matching AlgoView quality.

**Tests:** Manual walkthrough of all toolbar buttons + all drawing types. Visual comparison against AlgoView screenshot.

**Open risks:** SciChart modifier conflicts possible when multiple drawing tools are active simultaneously.

**Next step:** Phase 4 Drawing System Production-Ready.

---

## Phase 4: Drawing System Production-Ready

**Precondition:** Phase 3 complete. All drawing tools are visually connected to SciChart. drawingStore is the single source of truth.

### Task 4.1: Full CRUD for All Drawing Types

**Files:**
- Modify: `app/src/stores/drawingStore.ts`
- Modify: `app/src/components/charts/DrawingToolbar.tsx`

- [ ] **Step 1: Verify drawingStore supports hline, rectangle, trendline, text, ray, fib**

For each type, confirm: create, read, update (drag), delete all work end-to-end.

- [ ] **Step 2: Add selection, delete, duplicate, lock/unlock**

```typescript
// In drawingStore:
selectDrawing(chartKey: string, drawingId: string): void
deleteDrawing(chartKey: string, drawingId: string): void
duplicateDrawing(chartKey: string, drawingId: string): void
lockDrawing(chartKey: string, drawingId: string, locked: boolean): void
```

- [ ] **Step 3: Add keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Shift+Z)**

Register global key listeners in DrawingToolbar or a dedicated KeyboardHandler component.

- [ ] **Step 4: Persist drawings per symbol:timeframe in localStorage (interim state only)**

Key format: `arctis_drawings_${symbol}_${timeframe}`. This is a temporary measure only — see Step 5.

- [ ] **Step 5: Implement backend-synced drawing persistence via /api/drawings**

**This step is required before Phase 4 is considered done. localStorage is interim only.**

- [ ] **Step 5a: Create `engine/src/arctis/routes/drawings.py`**

```python
# Endpoints:
# GET    /api/drawings?market_root=NQ&timeframe=1m   -> list drawings
# POST   /api/drawings                               -> create drawing
# PATCH  /api/drawings/{id}                          -> update drawing
# DELETE /api/drawings/{id}                          -> delete drawing
```

- [ ] **Step 5b: Create DB table `arctis_drawings`**

```sql
CREATE TABLE arctis_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_root TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    drawing_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 5c: Mount drawings router in main.py**

- [ ] **Step 5d: Update drawingStore to sync mutations to /api/drawings**

On `addDrawing`, `updateDrawing`, `deleteDrawing`: optimistically update local state, then POST/PATCH/DELETE to backend. On load: hydrate from `/api/drawings` instead of localStorage.

- [ ] **Step 5e: Remove localStorage fallback once backend sync is verified**

- [ ] **Step 6: Test undo/redo stack**

Verify Ctrl+Z undoes last drawing action. Verify redo works. Verify undo/redo does not break backend sync.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: phase 4 - full drawing CRUD with undo/redo and backend persistence"
```

---

### Phase 4 Output

**Changed files:** `drawingStore.ts`, `DrawingToolbar.tsx`, `engine/src/arctis/routes/drawings.py`, `engine/src/arctis/main.py`, DB migration for `arctis_drawings`

**Target contract:** Drawings survive page refresh (persisted in DB, not localStorage). All 6 drawing types work. Undo/redo functional. Keyboard shortcuts active.

**Tests:** Create drawing → refresh page → drawing still there. Create 5 drawings → undo 3 → redo 2 → verify count.

**Open risks:** JSONB payload schema for drawings must be versioned — changes to drawing shapes will need migration strategy.

**Next step:** Phase 5 Live & Replay Unification.

---

## Phase 5: Live & Replay Unification

**Precondition:** Phase 4 complete. Drawing system production-ready with backend persistence.

### Task 5.1: Build useLiveConnection

**Files:**
- Create: `app/src/live/useLiveConnection.ts`
- Create: `app/src/live/index.ts` (barrel export)
- Modify: `app/src/App.tsx` (remove `require('@/live')` hack)

- [ ] **Step 1: Create barrel export**

```typescript
// app/src/live/index.ts
export { useLiveStore } from './useLiveStore'
export { useLiveConnection } from './useLiveConnection'
```

- [ ] **Step 2: Build useLiveConnection hook**

Manages WebSocket connection lifecycle, reconnection, and state updates.

```typescript
export function useLiveConnection() {
  const connect = useLiveStore(s => s.connect)
  const disconnect = useLiveStore(s => s.disconnect)
  const status = useLiveStore(s => s.status) // 'connecting' | 'connected' | 'disconnected' | 'error'

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { status }
}
```

- [ ] **Step 3: Remove `require('@/live')` from App.tsx**

Replace with proper import: `import { useLiveConnection } from '@/live'`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 5 - useLiveConnection + barrel exports"
```

### Task 5.2: Refactor useMarketData to Eliminate Competing Candle Truth

**Files:**
- Modify: `app/src/hooks/useMarketData.ts`
- Read: `app/src/live/useLiveStore.ts`

**Context:** Currently `useMarketData` polls `/api/live/price` every second and patches the last candle client-side. This creates a competing truth: the historical bar data from `/api/db/bars` and the live-patched last candle from the poll are two separate code paths with no reconciliation logic. If the WebSocket delivers a tick, and the poll delivers a price, the last candle can flicker or show stale data.

- [ ] **Step 1: Audit the current last-candle patching logic in useMarketData**

Find the code that patches `bars[bars.length - 1]` with live price data. Document the exact mechanism.

- [ ] **Step 2: Identify all sources of candle truth**

- Source A: Historical bars from `/api/db/bars` (REST, on load)
- Source B: Live tick via WebSocket (useLiveStore)
- Source C: Polling patch via `/api/live/price` (1s poll — this is the competing truth to eliminate)

- [ ] **Step 3: Remove the `/api/live/price` polling patch**

The last candle should be maintained exclusively through the WebSocket tick stream (Source B). Delete the polling-based patch entirely.

- [ ] **Step 4: Implement canonical last-candle update from WebSocket tick**

```typescript
// In useMarketData, subscribe to useLiveStore tick events:
const lastTick = useLiveStore(s => s.lastTick)

useEffect(() => {
  if (!lastTick || !bars.length) return
  // Update last candle with tick data — single source of truth
  setBars(prev => {
    const updated = [...prev]
    const last = { ...updated[updated.length - 1] }
    last.close = lastTick.price
    last.high = Math.max(last.high, lastTick.price)
    last.low = Math.min(last.low, lastTick.price)
    last.volume = (last.volume ?? 0) + (lastTick.volume ?? 0)
    updated[updated.length - 1] = last
    return updated
  })
}, [lastTick])
```

- [ ] **Step 5: Verify chart no longer flickers on live tick arrival**

Visually confirm: price update arrives via WebSocket → last candle updates smoothly → no duplicate update from poll.

- [ ] **Step 6: Update StatusBar to read live price from useLiveStore instead of the removed poll**

- [ ] **Step 7: Commit**

```bash
git commit -m "fix: phase 5 - eliminate competing candle truth in useMarketData"
```

---

### Phase 5 Output

**Changed files:** `app/src/live/useLiveConnection.ts`, `app/src/live/index.ts`, `app/src/App.tsx`, `app/src/hooks/useMarketData.ts`

**Target contract:** Single source of truth for live candle data: WebSocket tick stream only. No more `/api/live/price` polling for last-candle updates. useLiveConnection manages WS lifecycle with clean connect/disconnect.

**Tests:** Manual: open chart in live mode, observe last candle updates — should be smooth, no flicker. Confirm no 404s or polling calls to `/api/live/price` in network tab.

**Open risks:** WebSocket reconnection during session may cause brief gap in last-candle data. Add reconnection handler to re-fetch last bar from DB on reconnect.

**Next step:** Phase 6 Setup Runtime.

---

## Phase 6: Setup Runtime

**Precondition:** Phase 5 complete. Live connection stable. Snapshot endpoint returns `setups` field. `/api/setups` is mounted.

### Task 6.1: Setup Domain Model

**Files:**
- Create: `engine/src/arctis/models/setup.py`
- Modify: `engine/src/arctis/analysis/setup_engine.py`

- [ ] **Step 1: Define Setup dataclass with full lifecycle**

```python
class SetupStatus(Enum):
    CANDIDATE = "candidate"
    QUALIFIED = "qualified"
    ARMED = "armed"
    TRIGGERED = "triggered"
    IN_POSITION = "in_position"
    PARTIAL_TAKEN = "partial_taken"
    EXITED = "exited"
    INVALIDATED = "invalidated"
    EXPIRED = "expired"
    REVIEWED = "reviewed"
```

- [ ] **Step 2: Build state machine transitions**

Define valid transitions: CANDIDATE → QUALIFIED → ARMED → TRIGGERED → IN_POSITION → EXITED. Invalid transitions raise `SetupTransitionError`.

- [ ] **Step 3: Generate chart artifacts per setup**

Each setup produces `chart_artifacts`: entry zone box, stop zone box, target zone box, entry arrow marker, exit arrow marker.

- [ ] **Step 4: Wire to /api/setups endpoint**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 6 - setup domain model with lifecycle"
```

### Task 6.2: Setup Panel Integration

**Files:**
- Modify: `app/src/components/panels/SetupLifecyclePanel.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Add SetupLifecyclePanel to right panel**

- [ ] **Step 2: Connect to /api/setups data (via snapshot `setups` field)**

- [ ] **Step 3: Show setup cards with status badges**

Each card: setup type, status badge (color-coded), entry price, stop, target, R:R ratio, timestamp.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 6 - setup panel in active UI path"
```

---

### Phase 6 Output

**Changed files:** `engine/src/arctis/models/setup.py`, `engine/src/arctis/analysis/setup_engine.py`, `engine/src/arctis/routes/setups.py`, `app/src/components/panels/SetupLifecyclePanel.tsx`

**Target contract:** Setup lifecycle tracked from CANDIDATE to EXITED. Chart artifacts render from snapshot `chart_artifacts` field. Panel shows live setup cards.

**Tests:** `test_setup_state_machine_valid_transitions`, `test_setup_invalid_transition_raises`, `test_chart_artifacts_generated_for_armed_setup`

**Open risks:** Setup detection logic in `setup_engine.py` may be incomplete. Phase 7 builds the proper domain rules on top of this foundation.

**Next step:** Phase 7 Bias, Structure, and Playbook Rules Library.

---

## Phase 7: Bias / Structure / Playbook Rules Library

**Precondition:** Phase 6 complete. Setup domain model with lifecycle state machine exists. `/api/setups` returns real data.

### Task 7.1: Declarative Playbook Rules File Schema

**Files:**
- Create: `engine/src/arctis/playbook/schema.py`
- Create: `engine/src/arctis/playbook/rules/nq_double_fake.yaml`
- Create: `docs/contracts/playbook-rules-schema.md`

- [ ] **Step 1: Design the playbook rules YAML schema**

```yaml
# Canonical schema for a playbook rule file
id: nq_double_fake_v1
name: "NQ Double Fake"
version: 1
market_root: NQ
timeframe: 1m

preconditions:
  - type: session_time
    session: rth
  - type: bias_required
    direction: any
    min_confidence: 0.6

entry_conditions:
  - type: fake_count
    min: 2
    max: 5
    lookback_bars: 20
  - type: exhaustion_candle
    min_body_pct: 0.7
  - type: level_proximity
    max_distance_ticks: 8

invalidation_conditions:
  - type: close_beyond_level
    direction: against_bias
    ticks: 4

targets:
  tp1: { ticks: 50, partial_pct: 50 }
  tp2: { ticks: 100, full_exit: true }

stop:
  type: fixed_ticks
  ticks: 20

tags: [double-fake, exhaustion, nq, rth]
```

- [ ] **Step 2: Implement schema validator in schema.py**

```python
def validate_playbook_rule(data: dict) -> PlaybookRule:
    # Pydantic model validation + business rules
    pass
```

- [ ] **Step 3: Load all YAML rule files from `engine/src/arctis/playbook/rules/`**

```python
def load_all_rules() -> list[PlaybookRule]:
    rules_dir = Path(__file__).parent / "rules"
    return [load_rule(f) for f in rules_dir.glob("*.yaml")]
```

- [ ] **Step 4: Write tests for schema validation**

```python
def test_valid_rule_loads_without_error():
    ...
def test_missing_required_field_raises_validation_error():
    ...
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 7 - declarative playbook rules schema and NQ double fake rule"
```

### Task 7.2: Bias as Domain Object

**Files:**
- Create: `engine/src/arctis/models/bias.py`
- Modify: `engine/src/arctis/analysis/bias_engine.py`
- Modify: `engine/src/arctis/routes/snapshot.py` (update `bias` field shape)

**Context:** Currently bias is just a label ("bullish" / "bearish" / "neutral"). A trading edge depends on knowing not just the direction but its source, confidence, and what invalidates it. This task promotes bias to a first-class domain object.

- [ ] **Step 1: Define BiasObject dataclass**

```python
@dataclass
class BiasObject:
    direction: Literal["bullish", "bearish", "neutral"]
    confidence: float  # 0.0 - 1.0
    sources: list[BiasSource]  # list of contributing signals
    invalidation_conditions: list[InvalidationCondition]
    generated_at: datetime
    valid_until: datetime | None  # None = valid until explicitly invalidated
    narrative: str  # human-readable explanation, max 200 chars

@dataclass
class BiasSource:
    type: str  # "market_structure", "session_context", "playbook_rule", "manual"
    weight: float
    detail: str

@dataclass
class InvalidationCondition:
    description: str
    price_level: float | None
    event_type: str | None  # "close_above", "close_below", "volume_spike"
```

- [ ] **Step 2: Update bias_engine.py to produce BiasObject instead of str**

The existing bias detection logic produces a string. Wrap it: `direction = existing_logic()` then build `BiasObject` with `sources` listing which indicators contributed.

- [ ] **Step 3: Update snapshot.py `bias` field to return full BiasObject**

- [ ] **Step 4: Update frontend BiasPanel to render confidence bar, sources list, and invalidation conditions**

- [ ] **Step 5: Write tests**

```python
def test_bias_object_has_confidence_and_sources():
    ...
def test_bias_invalidation_triggers_when_price_crosses_level():
    ...
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: phase 7 - bias as domain object with direction, confidence, sources, invalidation"
```

### Task 7.3: Consolidation Detection

**Files:**
- Create: `engine/src/arctis/models/consolidation.py`
- Modify: `engine/src/arctis/analysis/structure_engine.py`

**Context:** "Consolidation" currently means "price is in a range" — a vague label. For setup detection and bias generation to work correctly, consolidation must be an explicit range object with defined boundaries, duration, and breakout logic.

- [ ] **Step 1: Define ConsolidationRange dataclass**

```python
@dataclass
class ConsolidationRange:
    id: str
    start_ts: datetime
    end_ts: datetime | None  # None = range is still active
    high: float
    low: float
    midpoint: float
    bar_count: int
    status: Literal["forming", "active", "broken_up", "broken_down", "expired"]
    breakout_bar_ts: datetime | None
    breakout_direction: Literal["up", "down"] | None
    breakout_confirmation_bars: int  # bars closed beyond boundary before confirming
    volume_profile: dict  # simplified: {"high_volume_node": float, "low_volume_node": float}
```

- [ ] **Step 2: Implement consolidation detection in structure_engine.py**

Algorithm:
1. Scan recent N bars for ATR contraction (ATR < 50% of 20-period ATR = consolidation candidate)
2. Define range as max high / min low of contracting bars
3. Monitor for breakout: 2 consecutive closes beyond range boundary = `broken_up` or `broken_down`
4. Store active consolidation ranges in engine state

- [ ] **Step 3: Add consolidation ranges to snapshot response**

```python
"structure": {
    "consolidations": [ConsolidationRange, ...],
    "active_consolidation": ConsolidationRange | None,
    "recent_breakout": ConsolidationRange | None,
}
```

- [ ] **Step 4: Render consolidation range boxes in chart**

Pass `structure.consolidations` through snapshot → useAnalysis → ChartPage → ArctisChartWrapper → CandlestickChart as `consolidationZones` prop.

- [ ] **Step 5: Write tests**

```python
def test_consolidation_detected_when_atr_contracts():
    ...
def test_breakout_confirmed_after_two_closes_beyond_range():
    ...
def test_active_consolidation_is_none_after_breakout():
    ...
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: phase 7 - consolidation detection with range object and breakout logic"
```

### Task 7.4: Explainability Tokens for Travis

**Files:**
- Create: `engine/src/arctis/models/explainability.py`
- Modify: `engine/src/arctis/routes/snapshot.py`
- Modify: `engine/src/arctis/routes/travis.py`

**Context:** Travis MCP queries need structured context to give useful answers. Instead of passing raw market data to Travis, the engine generates "explainability tokens" — small, semantic strings that summarize the current market state. Travis uses these as grounding context.

- [ ] **Step 1: Define ExplainabilityToken types**

```python
@dataclass
class ExplainabilityToken:
    category: Literal[
        "bias", "structure", "setup", "level", "volume",
        "session", "consolidation", "signal", "risk"
    ]
    key: str        # machine-readable identifier
    value: str      # human-readable summary (max 80 chars)
    confidence: float
    source: str     # which engine/rule generated this token
    ts: datetime

# Example tokens:
# ExplainabilityToken(category="bias", key="trend_direction", value="Bullish above 21500, supported by rising VWAP", confidence=0.82, ...)
# ExplainabilityToken(category="setup", key="active_setup", value="Double Fake candidate at 21480 — waiting for exhaustion bar", confidence=0.71, ...)
# ExplainabilityToken(category="structure", key="consolidation_state", value="Active consolidation 21490-21520, 14 bars, no breakout yet", confidence=0.95, ...)
```

- [ ] **Step 2: Implement token generator in explainability.py**

For each domain object (BiasObject, SetupObject, ConsolidationRange, levels), generate 1-3 tokens summarizing the current state.

- [ ] **Step 3: Add `explainability_tokens` to snapshot response**

```python
"explainability_tokens": list[ExplainabilityToken]
```

- [ ] **Step 4: Use tokens as context in Travis MCP calls**

In `travis.py`, pass the top-10 tokens (sorted by confidence) as the `context` field to every MCP tool call.

- [ ] **Step 5: Write tests**

```python
def test_tokens_generated_for_active_bias():
    ...
def test_tokens_include_active_setup_when_present():
    ...
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: phase 7 - explainability tokens for Travis MCP context grounding"
```

---

### Phase 7 Output

**Changed files:** `engine/src/arctis/playbook/schema.py`, `engine/src/arctis/playbook/rules/*.yaml`, `engine/src/arctis/models/bias.py`, `engine/src/arctis/models/consolidation.py`, `engine/src/arctis/models/explainability.py`, `engine/src/arctis/analysis/bias_engine.py`, `engine/src/arctis/analysis/structure_engine.py`, `engine/src/arctis/routes/snapshot.py` (updated `bias`, `structure`, `explainability_tokens` fields)

**Target contract:** Bias is a domain object with confidence, sources, and invalidation conditions. Consolidation is an explicit range object with breakout logic. Playbook rules are declarative YAML. Snapshot provides explainability tokens for Travis context.

**Tests:** All tests in Tasks 7.1-7.4 passing.

**Open risks:** Explainability token quality depends on the quality of the underlying domain objects. Travis response quality cannot be tested automatically — requires manual review in Phase 8.

**Next step:** Phase 8 Travis MCP Real Integration.

---

## Phase 8: Travis MCP Real Integration

**Precondition:** Phase 7 complete. Explainability tokens exist in snapshot. `/api/travis` is mounted.

### Task 8.1: Server-side MCP Backend-for-Frontend (BFF)

**Files:**
- Modify: `engine/src/arctis/routes/travis.py`

**Context:** The 7 MCP tools available are:
1. `mcp__travis__ask_about_videos` — general Q&A against video knowledge base
2. `mcp__travis__search_videos` — find videos relevant to a market topic
3. `mcp__travis__explain_pattern` — get explanation of a specific chart pattern
4. `mcp__travis__get_playbook` — retrieve playbook entry for a setup type
5. `mcp__travis__get_session_checklist` — get session preparation checklist
6. `mcp__travis__review_trade` — post-trade review and feedback
7. `mcp__travis__suggest_focus_points` — what to focus on given current market context

The 16-field context model passed to every MCP call:
```python
TravisContext = {
    "market_root": str,           # e.g. "NQ"
    "resolved_symbol": str,       # e.g. "NQH6"
    "timeframe": str,             # e.g. "1m"
    "session": str,               # "rth" | "globex" | "overnight"
    "session_time_elapsed_min": int,
    "current_price": float,
    "bias_direction": str,        # from BiasObject.direction
    "bias_confidence": float,     # from BiasObject.confidence
    "active_setup_type": str | None,
    "active_setup_status": str | None,
    "consolidation_active": bool,
    "consolidation_range": str | None,  # e.g. "21490-21520"
    "recent_breakout_direction": str | None,
    "key_levels_nearby": list[str],  # e.g. ["21500 (PDH)", "21480 (VWAP)"]
    "explainability_tokens": list[str],  # top 5 token values
    "user_query": str | None,     # for ask/explain/review tools
}
```

- [ ] **Step 1: Replace all template responses in travis.py with real MCP tool calls**

For each of the 7 tools, implement a handler that:
1. Receives a request with `market_root`, `timeframe`, and optional `user_query`
2. Fetches current snapshot to build TravisContext (16 fields)
3. Calls the appropriate MCP tool with context
4. Returns structured response to frontend

- [ ] **Step 2: Implement context builder function**

```python
async def build_travis_context(market_root: str, timeframe: str, user_query: str | None) -> TravisContext:
    snapshot = await get_snapshot(market_root, timeframe)
    return TravisContext(
        market_root=market_root,
        resolved_symbol=snapshot.resolved_symbol,
        # ... map all 16 fields from snapshot
    )
```

- [ ] **Step 3: Add response caching (TTL-based per tool type)**

- `get_session_checklist`: cache 1 session (not invalidated until new session)
- `get_playbook`: cache 10 minutes (rules don't change often)
- `ask_about_videos`, `search_videos`: cache 30 seconds
- `suggest_focus_points`, `explain_pattern`: no cache (context-sensitive)
- `review_trade`: no cache (always fresh)

- [ ] **Step 4: Add error handling and graceful degradation**

If MCP tool call fails (timeout, rate limit, error), return a structured fallback response:
```python
{"status": "degraded", "message": "Travis unavailable — try again in 30s", "fallback": True}
```
Do NOT let MCP errors propagate as 500s to the frontend.

- [ ] **Step 5: Add telemetry (call count, latency, error rate per tool)**

Log per tool: `mcp_tool_name`, `latency_ms`, `status`, `context_fields_populated`.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: phase 8 - travis MCP BFF with all 7 tools, 16-field context, caching, graceful degradation"
```

### Task 8.2: Travis Panel with Real Context

**Files:**
- Modify: `app/src/components/panels/TravisPanel.tsx`

- [ ] **Step 1: Design panel layout**

Travis panel sections:
1. **Focus Points** (auto-loaded on panel open, calls `suggest_focus_points`)
2. **Session Checklist** (loaded once per session, calls `get_session_checklist`)
3. **Active Setup Playbook** (loads when active setup detected, calls `get_playbook`)
4. **Ask Travis** (free-text input, calls `ask_about_videos`)

- [ ] **Step 2: Call /api/travis with real market context for each section**

Each section has its own endpoint:
- `GET /api/travis/focus-points?market_root=NQ&timeframe=1m`
- `GET /api/travis/session-checklist?market_root=NQ`
- `GET /api/travis/playbook?setup_type=double_fake`
- `POST /api/travis/ask` with `{ market_root, timeframe, question }`

- [ ] **Step 3: Display structured responses (not template text)**

For `suggest_focus_points`: render as bulleted list with priority indicators.
For `get_session_checklist`: render as interactive checkbox list.
For `get_playbook`: render setup rules, entry conditions, targets in structured card.
For `ask_about_videos`: render answer text with source video reference if available.

- [ ] **Step 4: Add loading states and error states**

Show skeleton loaders while MCP calls are in-flight. Show degraded state message on error (do not show blank panel).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 8 - travis panel with real MCP content and structured display"
```

### Task 8.3: Command Palette Search Integration

**Files:**
- Create: `app/src/components/CommandPalette.tsx`
- Modify: `app/src/App.tsx`

**Context:** Users need to quickly query Travis without navigating to the Travis panel. A command palette (Cmd+K) allows instant access to Travis search from anywhere in the UI.

- [ ] **Step 1: Create CommandPalette component**

Triggered by Cmd+K. Full-screen overlay with search input. Sections:
- **Travis Search** (prefix: "ask ..." → calls `ask_about_videos`)
- **Video Search** (prefix: "video ..." → calls `search_videos`)
- **Pattern Explanation** (prefix: "explain ..." → calls `explain_pattern`)
- **Navigation** (no prefix → navigate to page/panel)

- [ ] **Step 2: Register Cmd+K keyboard shortcut in App.tsx**

- [ ] **Step 3: Wire Travis sections to /api/travis endpoints**

Results appear inline in the palette within 300ms (show loading spinner if MCP is slow).

- [ ] **Step 4: Add recent searches history (stored in frontend state only — not persisted)**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 8 - command palette with Travis search integration (Cmd+K)"
```

### Task 8.4: Feed/Panel Context Queries

**Files:**
- Modify: `app/src/components/panels/FeedPanel.tsx` (or equivalent)
- Modify: `app/src/components/panels/OverviewPanel.tsx`

**Context:** When a setup appears in the Feed or Overview, the user should be able to right-click (or click a button) to ask Travis about that specific setup or event without leaving the panel.

- [ ] **Step 1: Add "Ask Travis" context button to each Feed event card**

On hover: show "Ask Travis about this" button. On click: pre-fills command palette with event context.

- [ ] **Step 2: Wire Feed event → `review_trade` MCP tool for trade events**

When a trade or setup exit appears in feed: add "Review with Travis" button → calls `mcp__travis__review_trade` with trade details.

- [ ] **Step 3: Add "What's important now?" button to OverviewPanel**

Calls `suggest_focus_points` for current market context. Result displayed inline in Overview.

- [ ] **Step 4: Add "Explain this pattern" button to chart right-click menu (or setup card)**

When user right-clicks a pattern annotation or setup card: calls `mcp__travis__explain_pattern` with pattern type and context.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 8 - feed and overview panel context queries to Travis"
```

---

### Phase 8 Output

**Changed files:** `engine/src/arctis/routes/travis.py`, `app/src/components/panels/TravisPanel.tsx`, `app/src/components/CommandPalette.tsx`, `app/src/App.tsx`, `app/src/components/panels/FeedPanel.tsx`, `app/src/components/panels/OverviewPanel.tsx`

**Target contract:** All 7 MCP tools are callable from the UI. TravisPanel shows real content in 4 structured sections. Command palette (Cmd+K) provides instant Travis search. Feed events have contextual "Ask Travis" actions. MCP failures never crash the UI — always degrade gracefully.

**Tests:** Manual: open Travis panel → all 4 sections load. Cmd+K → type "ask double fake" → result appears. Feed event → click "Ask Travis" → answer shown. Kill MCP → verify degraded state message, no blank panels.

**Open risks:** MCP latency may exceed 2s. If `suggest_focus_points` is called on every panel open, it could spam the MCP layer. Implement debouncing and caching aggressively.

**Next step:** Phase 9 Overview & Context OS.

---

## Phase 9: Overview & Context OS

**Precondition:** Phase 8 complete. Travis MCP live. Snapshot drives all panels. Setup lifecycle panel active.

### Task 9.1: Restructure Overview Panel

**Files:**
- Modify: `app/src/components/panels/OverviewPanel.tsx`
- Modify: `app/src/hooks/useAnalysis.ts`

- [ ] **Step 1: Define Overview panel information hierarchy**

Structure:
1. **Market State Line** — symbol, price, session, bias direction + confidence
2. **"What's Important Now"** — top 3 explainability tokens from snapshot
3. **Active Setups** — compact list of ARMED/TRIGGERED setups with entry price, stop, target
4. **Key Levels** — 3-5 nearest price levels with type labels
5. **Session Context** — time in session, volume context, VWAP relation

- [ ] **Step 2: Wire all sections from single snapshot data**

No separate API calls from OverviewPanel — data comes from snapshot through useAnalysis.

- [ ] **Step 3: Add refresh interval indicator (shows staleness of snapshot)**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 9 - overview panel restructured with canonical snapshot data"
```

### Task 9.2: Feed Events from Real Event Bus

**Files:**
- Modify: `engine/src/arctis/events/event_bus.py` (create if missing)
- Modify: `app/src/components/panels/FeedPanel.tsx`

- [ ] **Step 1: Create event bus in engine**

```python
class EventType(Enum):
    SETUP_CANDIDATE = "setup_candidate"
    SETUP_ARMED = "setup_armed"
    SETUP_TRIGGERED = "setup_triggered"
    SETUP_EXITED = "setup_exited"
    SETUP_INVALIDATED = "setup_invalidated"
    LEVEL_TESTED = "level_tested"
    CONSOLIDATION_STARTED = "consolidation_started"
    CONSOLIDATION_BROKEN = "consolidation_broken"
    BIAS_CHANGED = "bias_changed"
    SESSION_OPEN = "session_open"
    SESSION_CLOSE = "session_close"
```

- [ ] **Step 2: Emit events from domain logic**

When setup status changes → emit `SETUP_*` event. When consolidation breaks → emit event.

- [ ] **Step 3: Stream events to frontend via SSE or WebSocket**

Add `/api/events` SSE endpoint. Frontend connects via `EventSource`.

- [ ] **Step 4: FeedPanel subscribes to event stream**

Each event renders as a Feed card with: timestamp, event type badge, summary text, optional "Ask Travis" button.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 9 - real event bus with SSE stream to feed panel"
```

---

### Phase 9 Output

**Changed files:** `OverviewPanel.tsx`, `FeedPanel.tsx`, `engine/src/arctis/events/event_bus.py`, SSE endpoint

**Target contract:** Overview shows a hierarchical "what matters now" view. Feed shows real-time events from the engine event bus. All data sourced from snapshot or event bus — no panel-level API calls.

**Tests:** Trigger a setup state change → verify Feed event appears within 1s. Overview bias field matches snapshot bias direction.

**Open risks:** SSE connection management on the frontend needs reconnect logic similar to WebSocket.

**Next step:** Phase 10 SaaS Control Plane.

---

## Phase 10: SaaS Control Plane

**Precondition:** Phase 9 complete. All domain features working end-to-end.

### Task 10.1: Authentication and Workspace

**Files:**
- Create: `engine/src/arctis/auth/`
- Create: `app/src/auth/`

- [ ] **Step 1: Add JWT-based authentication to engine**

- `/api/auth/login` → returns JWT
- `/api/auth/refresh` → refresh token
- All API routes require `Authorization: Bearer <token>` header

- [ ] **Step 2: Add auth context to frontend**

- `AuthProvider` wraps app
- `useAuth` hook provides `user`, `token`, `logout`
- Redirect to login if no valid token

- [ ] **Step 3: Add workspace concept**

Each user belongs to a workspace (org). Workspace ID scopes all data (drawings, layouts, setups).

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 10 - JWT auth and workspace scoping"
```

### Task 10.2: Persistent Layouts and Alerts

**Files:**
- Create: `engine/src/arctis/routes/layouts.py`
- Create: `engine/src/arctis/routes/alerts.py`

- [ ] **Step 1: Layout persistence API**

`POST /api/layouts` — save current panel layout (serialized panel positions/sizes)
`GET /api/layouts/active` — load layout on startup

- [ ] **Step 2: Alert system**

`POST /api/alerts` — create price alert (symbol, price, direction, message)
`GET /api/alerts` — list active alerts
WebSocket push when alert triggers

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: phase 10 - persistent layouts and price alerts"
```

---

### Phase 10 Output

**Changed files:** `engine/src/arctis/auth/`, `app/src/auth/`, `layouts.py`, `alerts.py`

**Target contract:** Users authenticate. Layouts and drawings are workspace-scoped and persist across sessions. Price alerts trigger via WebSocket push.

**Tests:** Login → save layout → refresh → layout restored. Create alert → price reaches level → alert fires.

**Open risks:** JWT secret management must use environment variables (not hardcoded).

**Next step:** Phase 11 Observability & Hardening.

---

## Phase 11: Observability & Hardening

**Precondition:** Phase 10 complete. Auth works. All features behind auth gates.

### Task 11.1: API and WebSocket Metrics

**Files:**
- Create: `engine/src/arctis/observability/metrics.py`
- Modify: `engine/src/arctis/main.py` (add middleware)

- [ ] **Step 1: Add request timing middleware**

Log: method, path, status_code, duration_ms for every request.

- [ ] **Step 2: Track MCP call metrics**

Per tool: call count, p50/p95 latency, error rate. Expose via `/api/internal/metrics`.

- [ ] **Step 3: WebSocket connection metrics**

Connected clients count, message rate, reconnection events.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 11 - observability middleware and MCP latency metrics"
```

### Task 11.2: E2E Tests for Critical Journeys

**Files:**
- Create: `tests/e2e/test_chart_journey.py`
- Create: `tests/e2e/test_setup_lifecycle.py`
- Create: `tests/e2e/test_travis_journey.py`

- [ ] **Step 1: Chart Journey**

Load chart → verify bars → toggle VWAP → verify VWAP visible → draw hline → refresh → verify hline persisted.

- [ ] **Step 2: Setup Lifecycle Journey**

Create CANDIDATE setup → verify in panel → advance to ARMED → verify chart artifacts → exit → verify EXITED in feed.

- [ ] **Step 3: Travis Journey**

Open Travis panel → verify focus points load → type in Ask Travis → verify non-empty response → kill MCP → verify degraded state message.

- [ ] **Step 4: Commit**

```bash
git commit -m "test: phase 11 - e2e tests for chart, setup, and travis journeys"
```

### Task 11.3: Visual Regression for Chart Screens

**Files:**
- Create: `tests/visual/snapshots/`

- [ ] **Step 1: Set up visual regression tooling (Percy or Playwright screenshot comparison)**

- [ ] **Step 2: Capture baseline screenshots for: ChartPage, OverviewPanel, TravisPanel, SetupPanel**

- [ ] **Step 3: Add to CI pipeline — fail if visual diff > 0.1%**

- [ ] **Step 4: Commit**

```bash
git commit -m "test: phase 11 - visual regression baselines for chart screens"
```

---

### Phase 11 Output

**Changed files:** `engine/src/arctis/observability/metrics.py`, `tests/e2e/*.py`, `tests/visual/snapshots/`

**Target contract:** All critical journeys have automated e2e tests. Visual regression catches accidental chart styling changes. Metrics endpoint shows health of all subsystems.

**Tests:** `pytest tests/e2e/` all green. Visual snapshots captured.

**Open risks:** E2E tests depend on running engine + DB. Need CI environment with TimescaleDB.

**Next step:** Phase 12 Product Polish.

---

## Phase 12: Product Polish

**Precondition:** Phase 11 complete. All tests passing. Visual regression baselines set.

### Task 12.1: Spacing, Hierarchy, and Contrast Audit

**Files:**
- Modify: `app/src/styles/` (global CSS/tokens)
- Modify: individual panel components

- [ ] **Step 1: Audit all panels against Arctic Frost design tokens**

Check: Ice Blue #5CB8F0 used correctly, spacing consistent (4px grid), font hierarchy clear.

- [ ] **Step 2: Fix contrast ratios**

All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text) against dark backgrounds.

- [ ] **Step 3: Apply consistent border/separator styles**

Panel borders: 1px solid rgba(92, 184, 240, 0.12). Active states: rgba(92, 184, 240, 0.24).

- [ ] **Step 4: Commit**

```bash
git commit -m "style: phase 12 - spacing and contrast audit against Arctic Frost tokens"
```

### Task 12.2: Empty States and Loading Skeletons

**Files:**
- Create: `app/src/components/ui/Skeleton.tsx`
- Create: `app/src/components/ui/EmptyState.tsx`
- Modify: all panel components

- [ ] **Step 1: Create Skeleton component**

Animated shimmer skeleton for: candle bars, setup cards, Travis responses, feed events.

- [ ] **Step 2: Create EmptyState component**

Used when: no setups detected, no feed events yet, Travis returns no results.

- [ ] **Step 3: Apply to all panels**

Every panel must show skeleton while loading and EmptyState when data is empty (never a blank white area or spinner-only state).

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: phase 12 - empty states and loading skeletons for all panels"
```

### Task 12.3: Keyboard Shortcuts and Accessibility

**Files:**
- Create: `app/src/hooks/useKeyboardShortcuts.ts`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Define global keyboard shortcut map**

| Shortcut | Action |
|----------|--------|
| Cmd+K | Open command palette |
| Cmd+/ | Open keyboard shortcuts help |
| T | Select trendline tool |
| H | Select horizontal line tool |
| R | Select rectangle tool |
| Escape | Deselect / cancel drawing |
| Delete | Delete selected drawing |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Space | Toggle replay play/pause |
| . | Replay step forward |
| , | Replay step backward |

- [ ] **Step 2: Register all shortcuts in useKeyboardShortcuts**

- [ ] **Step 3: Add keyboard shortcuts help overlay (Cmd+/)**

- [ ] **Step 4: Accessibility: all interactive elements have aria-labels**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: phase 12 - keyboard shortcuts map and accessibility labels"
```

### Task 12.4: Motion and Transitions

**Files:**
- Modify: `app/src/styles/animations.css` (or Tailwind config)
- Modify: panel transition code

- [ ] **Step 1: Standardize panel open/close transitions**

Panel slide-in: 150ms ease-out. Overlay fade: 100ms. No motion if `prefers-reduced-motion`.

- [ ] **Step 2: Chart live tick visual feedback**

Last candle: subtle pulse on price update (1-frame flash, not a persistent animation).

- [ ] **Step 3: Status badge transitions**

Setup status badge: smooth color transition (200ms) when status changes.

- [ ] **Step 4: Commit**

```bash
git commit -m "style: phase 12 - motion and transition polish"
```

---

### Phase 12 Output

**Changed files:** Design token CSS, all panel components (EmptyState, Skeleton applied), keyboard shortcuts hook, animation styles.

**Target contract:** Every panel has a loading state and an empty state. All interactive elements are keyboard-accessible. Motion is consistent and respects reduced-motion preference. Design token usage is audited and consistent.

**Tests:** Visual regression passes after polish. Manual keyboard shortcut test walkthrough passes.

**Open risks:** Animation CSS may interact badly with SciChart's own canvas-based animations. Test chart interactions after applying motion styles.

**Next step:** Acceptance gate validation (see below).

---

## Acceptance Gates (from Masterplan Section 19)

### Chart & Drawings
- [ ] Every visible drawing button works
- [ ] Rectangle, trendline, text, hline are creatable, editable, deletable, persistent (DB-backed)
- [ ] Markers, levels, zones, session bands, setups render simultaneously
- [ ] No visual jitter on live updates
- [ ] Replay scrolls without destroying chart
- [ ] Entry and exit clearly marked in chart

### Analysis & Setups
- [ ] Setup lifecycle tracked (candidate → armed → triggered → exited)
- [ ] Setup reasoning readable in panel
- [ ] Bias consistent in panel and chart (BiasObject with confidence and sources)
- [ ] Consolidation range visible in chart when active
- [ ] Feed, overview, chart show same active setups

### Travis / MCP
- [ ] Travis panel shows real contextual content in 4 sections
- [ ] All 7 MCP tools callable from UI
- [ ] MCP failures handled gracefully (degraded state, never blank)
- [ ] Knowledge tied to current market/setup context via 16-field model
- [ ] Command palette (Cmd+K) provides instant Travis access
- [ ] Feed events have contextual "Ask Travis" actions

### Backend Contracts
- [ ] Single canonical snapshot endpoint drives all panels
- [ ] All routers mounted, no unmounted routes
- [ ] No hardcoded URLs in frontend
- [ ] Single symbol resolver, single table naming convention
- [ ] Single signal endpoint, single health endpoint
- [ ] Drawings persisted in DB (not localStorage)

### SaaS / Product
- [ ] Workspace saves layouts and drawings
- [ ] Roles and entitlements work
- [ ] Critical journeys e2e-tested
- [ ] Visual regression baselines set
- [ ] All panels have loading states and empty states
- [ ] Keyboard shortcuts functional

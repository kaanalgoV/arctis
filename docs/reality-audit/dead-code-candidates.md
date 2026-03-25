# Dead Code Candidates — Arctis
_Phase 0 Reality Audit · 2026-03-25_

---

## 1. Deprecated Files

### `app/src/components/charts/_deprecated/ArctisCandlestickChart.tsx`
- **Status:** Explicitly deprecated (`@ts-nocheck -- deprecated SciChart component, not used in production`)
- **Referenced by:** Nothing — no import found anywhere in the codebase
- **Recommendation:** Safe to delete

### `app/src/lib/_deprecated_scichart-init.ts`
- **Status:** Explicitly deprecated (`@ts-nocheck -- SciChart is not used in the current production build`)
- **Content:** Old `initSciChart()` that configured WASM paths — superseded by `lib/scichart-init.ts`
- **Referenced by:** Nothing — no import found anywhere
- **Recommendation:** Safe to delete

---

## 2. Orphaned Hook: `useSetups`

### `app/src/hooks/useSetups.ts`
- **Exports:** `useSetups()`, `SetupData`, `SetupsResponse`, `SetupStatus`, `TERMINAL_STATUSES`, `isTerminalStatus`
- **Called by:** Nobody — `useSetups()` the hook function is never invoked in the app
- **Types imported by:** `SetupLifecyclePanel.tsx` (imports `SetupData`, `SetupStatus`, `isTerminalStatus`)
- **API target:** `GET /api/setups` — which is defined in `routes/setups.py` but **NOT MOUNTED** in `main.py`
- **Hardcoded URL:** `const ENGINE_URL = 'http://127.0.0.1:8001'` — does not use `useSettingsStore` like the rest of the app
- **Recommendation:** Keep if setups feature is planned; fix hardcoded URL to use `useSettingsStore`

---

## 3. Orphaned Panel: `SetupLifecyclePanel`

### `app/src/components/panels/SetupLifecyclePanel.tsx`
- **Exports:** `SetupLifecyclePanel`, `SetupLifecyclePanelProps`
- **Rendered by:** Nobody — not in `App.tsx`, not in `RightPanel`, not in any page
- **Exported by `panels/index.ts`:** NO — deliberately omitted from the barrel export
- **Dependencies:** `useSetups.ts` (types only)
- **Recommendation:** Keep alongside `useSetups.ts` if setups feature is planned; otherwise remove

---

## 4. Orphaned Engine Route Files

### `engine/src/arctis/routes/setups.py`
- **Router:** `APIRouter(prefix="/api/setups", tags=["setups"])`
- **Endpoint:** `GET /api/setups` (empty path `""`)
- **Mounted:** NO — no `include_router(setups_router)` in `main.py`
- **Recommendation:** Mount or remove. The frontend infrastructure (`useSetups.ts`, `SetupLifecyclePanel.tsx`) exists but is equally orphaned.

### `engine/src/arctis/routes/travis.py`
- **Router:** `APIRouter(prefix="/api", tags=["travis"])`
- **Endpoint:** `POST /api/travis/ask`
- **Mounted:** NO
- **Superseded by:** `arctis_ai.py` which defines `POST /api/arctis/travis/ask` (hidden alias) and the primary `POST /api/arctis/ask`
- **Recommendation:** Delete. Functionality is fully covered by `arctis_ai.py`.

---

## 5. Duplicate / Conflicting Type Definitions

### `OHLCVBar` (market.ts) vs `Bar` (contracts.ts) vs `Candle` (domain.ts)

All three represent the same OHLCV data structure:

| Type        | File                    | Fields                                         | Notes |
|-------------|-------------------------|------------------------------------------------|-------|
| `OHLCVBar`  | `types/market.ts`       | `timestamp, open, high, low, close, volume`    | Used by: `App.tsx`, `ChartPage.tsx`, `useMarketData.ts`, replay logic |
| `Bar`       | `types/contracts.ts`    | `timestamp, open, high, low, close, volume`    | Used by: `api.ts`, `ArctisChartWrapper.tsx`, `contracts.ts` domain types |
| `Candle`    | `types/domain.ts`       | `time, open, high, low, close, volume, contract?` | Used by: `CandlestickChart.tsx`, `ArctisChartWrapper.tsx` (`barsToCandles()`) |

**Problem:** `OHLCVBar` and `Bar` are structurally identical (same field names, same types).
`ChartPage.tsx` does `const bars = chartBars as unknown as Bar[]` — a forced cast because
`OHLCVBar[]` is passed in but `Bar[]` is expected by `ArctisChartWrapper`.

**`Timeframe` type** also has a duplicate:
- `types/market.ts`: `export type Timeframe = '1min' | '5min'` — **incomplete** (only 2 values)
- `types/contracts.ts`: `export type Timeframe = typeof TIMEFRAMES[number]` — **canonical** (5 values: 1min, 5min, 15min, 30min, 1h)

`App.tsx` correctly imports `Timeframe` from `contracts.ts`. The `market.ts` version is stale.

**Recommendation:**
- Delete `OHLCVBar` from `market.ts` — replace all usages with `Bar` from `contracts.ts`
- Delete the `Timeframe` type from `market.ts` — the `contracts.ts` version is canonical
- `market.ts` becomes effectively empty after cleanup — delete the file entirely

---

## 6. Data Fetched but Never Rendered

These items are fully fetched and stored but never passed to any chart rendering component:

| Data          | Fetched via           | Passed to ChartPage? | Forwarded to CandlestickChart? |
|---------------|-----------------------|----------------------|-------------------------------|
| `structureBreaks` | `useAnalysis` → `/api/analysis/structure` | YES (prop) | NO — dropped in `ChartPage` |
| `patternAnnotations` | `useAnalysis` → `/api/analysis/patterns` | YES (prop) | NO — dropped in `ChartPage` |
| `zones`       | `useAnalysis` → `/api/analysis/zones`    | YES (prop) | NO — `ArctisChartWrapper` has no zones prop; `activeOverlays.has('zones')` is never read |
| `drawings`    | `useDrawings()`       | YES (prop) | NO — `ArctisChartWrapper` does not accept `userDrawings`; drawings are never rendered |

---

## 7. Overlay Toggles with No Effect

From the canonical path matrix, two toolbar buttons do nothing:

| Button   | `OverlayKey` | Issue |
|----------|-------------|-------|
| VWAP     | `'vwap'`    | Always rendered when data is present. Toggle state not checked before adding to indicator map. |
| EMA      | `'ema'`     | Same — always rendered when data is present. |
| Levels   | `'levels'`  | `priceLevels` always passed when `sessionLevels != null`. Toggle not read. |
| Zones    | `'zones'`   | No render path at all. Toggle press has zero effect. |

---

## Summary

| Category                          | Count | Action |
|-----------------------------------|-------|--------|
| Deprecated files (explicit)       | 2     | Delete |
| Orphaned hooks                    | 1     | Keep or mount backend |
| Orphaned panels                   | 1     | Keep or mount backend |
| Unmounted engine route files      | 2     | Mount or delete |
| Duplicate type definitions        | 3     | Consolidate |
| Data fetched but never rendered   | 4     | Wire up or remove fetch |
| Non-functional overlay toggles    | 4     | Fix wiring |

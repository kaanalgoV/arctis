# Frontend Audit — Arctis App
**Phase 0: Truth Reset**
**Date:** 2026-03-23
**Auditor:** Claude Code (Sonnet 4.6)
**Scope:** `/Users/kaan_macbook/arctis/app/src/`

---

## Executive Summary

The Arctis frontend is a Tauri-wrapped React 19 / TypeScript application that has been partially refactored from a monolithic component structure toward a page-based layout. The refactor is roughly 70% complete. The app works for its core use case (live chart + analysis panels for NQ/ES futures) but carries significant technical debt: hardcoded URLs scattered across six files, a nearly fully-untyped analysis layer, two competing charting libraries still present in the bundle, duplicate state for overlay toggles, and a large deprecated component tree that remains in source but is guarded by `@ts-nocheck` annotations. The contract mapping is hardcoded and will silently break on rollover.

---

## A. Symbol / Contract Handling

### SYMBOL_MAP — Static, Hardcoded, Rollover-Hostile

**File:** `/Users/kaan_macbook/arctis/app/src/store/market.ts`

```ts
const SYMBOL_MAP: Record<string, string> = {
  NQ: 'NQH6',
  ES: 'ESZ5',   // ← already stale (March 2026, Z5 expired December 2025)
  CL: 'CLJ6',
  GC: 'GCJ6',
  '6E': '6EH6',
  '6J': '6JH6',
}
```

**Problems:**

1. `ESZ5` is December 2025 expiry — it is already expired as of March 2026. This is a live data correctness bug.
2. The map is a compile-time constant. No rollover happens automatically. Every contract expiry requires a code change and a new build.
3. The fallback `${market}H6` is month-code-specific hardcode. If the backend serves a different front-month (e.g., `ESM6`) the frontend will silently request the wrong symbol.

**setMarket() behavior:**
`setMarket('ES')` → derives `symbol = SYMBOL_MAP['ES'] || 'ESH6'` → sets both `market` and `symbol` atomically. There is no API call, no dynamic resolution, no validation against backend `/api/markets`.

**Separation of root vs. contract vs. instrument-id:**

- `market` = root (e.g., `'NQ'`) — used for all analysis API calls
- `symbol` = full contract (e.g., `'NQH6'`) — used only for bar fetches and WebSocket
- No instrument ID concept exists

The split is correct in intent, but the derived `symbol` is never validated against the `/api/markets` response. The app fetches `/api/markets` in `App.tsx` line 355 and populates a `marketRoots` array used for the Topbar pill list — but this response is never used to update `symbol`. The store and the API response live in separate worlds.

---

## B. Data Fetching

### Hardcoded URLs — 6 Independent Occurrences

`http://127.0.0.1:8001` is hardcoded in **6 separate files**:

| File | Variable Name |
|---|---|
| `src/api.ts` | `BASE_URL` (line 3) |
| `src/hooks/useMarketData.ts` | `ENGINE_URL` (line 5), `WS_URL` (line 6) |
| `src/hooks/useReplay.ts` | `ENGINE_URL` (line 3) |
| `src/hooks/useSignals.ts` | `ENGINE` (line 16) |
| `src/components/settings/SettingsPanel.tsx` | `ENGINE_URL` (line 10) |
| `src/components/panels/TravisPanel.tsx` | `ENGINE_URL` (line 121) |
| `src/App.tsx` | `ENGINE_URL` (line 43) |

There is no `.env` file. There is no `import.meta.env.VITE_ENGINE_URL` usage anywhere. `useSettingsStore` has an `engineUrl` field that defaults to `'http://127.0.0.1:8001'` and is persisted to localStorage, but **no fetch call actually reads from this store** — every file declares its own constant. The settings URL field in the UI is purely cosmetic.

### Centralized API Client — Partially Done

`src/api.ts` is the intended central client and covers most REST endpoints correctly. However:
- `useMarketData.ts`, `useReplay.ts`, `useSignals.ts`, `App.tsx`, `SettingsPanel.tsx`, and `TravisPanel.tsx` all bypass `api.ts` and call `fetch()` directly with their own hardcoded URL.
- `App.tsx` has two `fetch()` calls directly at lines 318 and 355 that are not routed through `api.ts`.

### WebSocket — Symbol-Based, Not Timeframe-Aware

**File:** `src/hooks/useMarketData.ts`

```ts
const ws = new WebSocket(`${WS_URL}/ws/bars/${symbol}`)
```

- The WebSocket path includes `symbol` but not `timeframe`. If the backend sends bars for the active timeframe only, this is fine. If the backend sends a generic stream that requires the client to filter by timeframe, there is no filtering logic.
- The `useEffect` that calls `connectWs()` has `[symbol]` in its dependency array (line 100) but omits `connectWs` itself, which is recreated on every `symbol/timeframe/days` change. This is a React hook dependency lint violation that could cause the WebSocket to not reconnect on timeframe changes.
- The reconnect logic is an exponential backoff with no maximum attempt count, meaning the app silently retries forever.

### Analysis Polling — 10 Concurrent Requests Every 5 Seconds

**File:** `src/hooks/useAnalysis.ts`

`fetchAll()` fires 10 parallel `Promise.allSettled` requests on every poll cycle (default 5000ms) and additionally on every new bar arrival via `lastBarTs`. Under a fast market with rapid bar updates, this can fire more frequently than the poll interval — creating a potential request storm.

The hook also fires an **additional** fetch in `App.tsx` line 329 via a `setInterval` polling `/api/bars` every 1000ms during replay. This is a third independent polling loop on top of REST load and WebSocket.

---

## C. Chart

### Charting Library — LightweightCharts v5 (Active), SciChart v5 (Present but Dead)

**Active chart:** `src/components/charts/SimpleChart.tsx` — 796 lines, uses `lightweight-charts@5.1.0`.

**Dead chart:** `src/components/charts/_deprecated/ArctisCandlestickChart.tsx` — guarded by `// @ts-nocheck -- deprecated SciChart component, not used in production`. However:

1. `scichart@5.1.0` is still listed as a **production dependency** in `package.json` — it ships in the Tauri bundle. SciChart is a heavy WASM library (multiple MB of `.wasm` + `.js` files).
2. `src/lib/scichart-init.ts` imports `SciChartSurface` from `scichart` and is not guarded by any dead-code elimination. It is not imported anywhere in active code, but the import chain keeps it in the bundle unless tree-shaking eliminates it.
3. The `scichart-init.ts` file expects WASM files at `/scichart/scichart2d.wasm` — these must be shipped in the Tauri resources.

**Verdict:** SciChart should be removed from `package.json`. It is dead code adding bundle weight.

### Chart Initialization — Full Recreate on Data Change

**File:** `src/components/charts/SimpleChart.tsx`, line 212:

```ts
useEffect(() => {
  // creates chart, all series, markers plugin, ResizeObserver
  ...
  return () => { ro.disconnect(); chart.remove(); ... }
}, [bars])  // ← depends on [bars]
```

The entire chart (canvas, all series, all overlay refs, all price line refs, markers plugin) is **destroyed and recreated every time `bars` changes**. This includes:
- Initial load
- Every WebSocket bar update (a new bar appended to the array creates a new reference)
- Every replay tick

This is the root cause of any flickering or performance issues. The correct pattern is: create the chart once on mount, then call `series.update(newBar)` for incremental updates. This is architecturally the most significant chart issue.

WebSocket message handler in `useMarketData.ts` (lines 55-62) does update bars correctly (update last bar or append), but it spreads into a new array reference every time — triggering the `[bars]` dependency and full chart recreation.

### Overlay Management — Correct Pattern but Dual-State Problem

Overlays are managed as separate `useEffect` hooks in `SimpleChart.tsx` that watch specific props (`showVwap`, `vwapData`, etc.) and call `series.applyOptions({ visible })`. This is the correct LightweightCharts incremental pattern.

However there is a **dual overlay state** problem:

- `useSettingsStore` has `overlays: { vwap, ema, volume, vp, levels, zones }` — persisted to localStorage
- `App.tsx` has `const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(...)` — initialized statically, **not from the settings store**

These two sources of truth are never synchronized. `SettingsPanel.tsx` reads from `useSettingsStore` and renders toggle switches, but toggling them in Settings has no effect on the chart because `ChartPage` receives `activeOverlays` from `App.tsx` state, not from the store. Only the toolbar toggle (via `handleToggleOverlay`) affects the chart.

### Multiple Competing Chart Components

| File | Status |
|---|---|
| `src/components/charts/SimpleChart.tsx` | Active, 796 lines |
| `src/components/charts/_deprecated/ArctisCandlestickChart.tsx` | Deprecated, `@ts-nocheck` |
| `src/components/Chart.tsx` | `@deprecated` comment, uses `createChart` from LWC |
| `src/components/Dashboard.tsx` | `@deprecated + @ts-nocheck`, imports `Chart.tsx` |

There are effectively 3 chart implementations in the source tree. Two are marked deprecated but not removed.

---

## D. Panels & State

### Zustand Stores

| Store | File | Purpose | Persistent? |
|---|---|---|---|
| `useMarketStore` | `store/market.ts` | Active market, symbol, timeframe, days, WebSocket status, last bar timestamp | No |
| `useSettingsStore` | `store/settings.ts` | Engine URL, overlays, risk settings, sound alerts, poll interval | Yes (localStorage) |

Only two stores exist. This is appropriately minimal.

**`useMarketStore` issues:**
- `setSymbol()` allows setting an arbitrary symbol string that bypasses `SYMBOL_MAP`. Nothing prevents calling `setSymbol('INVALID')`. In practice it's not called from user-facing code, but it's an escape hatch waiting to be misused.
- `lastBarTs` is a number (Unix seconds) stored in the global store. Its only purpose is to trigger `useAnalysis` refetches via a `useEffect([lastBarTs])`. This is an unusual pattern — it stores a data timestamp as application state.

**`useSettingsStore` issues:**
- `engineUrl` is stored and persisted but **never read** by any fetch call. Six files define their own `ENGINE_URL` constant instead.
- `overlays` state is disconnected from the chart as documented in section C.

### How Panels Get Data

All panels receive data as props from `App.tsx`. `App.tsx` calls `useAnalysis()` which polls all 10 analysis endpoints, and then passes the results down as props to `ChartPage`, `DashboardPage`, `PatternsPage`, and the right panel sections.

This is prop-drilling from a single root component — not a React context or store pattern. `App.tsx` at 743 lines is doing too much: fetching markets, managing replay state, computing feed items, managing chart ref, managing overlay state, building HUD values, and routing between pages.

**`useAnalysis` typing — all fields are `any`:**

```ts
interface AnalysisData {
  sessions: any | null
  confluence: any | null
  patterns: any | null
  // ... 7 more any | null fields
}
```

The types are defined in `src/types/analysis.ts` and `src/components/panels/*.tsx` but are not applied to `useAnalysis`'s return type. Every consumer in `App.tsx` casts via `as SomeType | null` (6 occurrences of `as any` in non-deprecated code). This effectively defeats TypeScript's type checking for the entire analysis data layer.

### `useSignals` Hook — Orphaned

`src/hooks/useSignals.ts` exports `useSignals()` which makes an additional `/api/signals` request. It is **never called** anywhere in the active codebase. It is only imported as a `type` by `SimpleChart.tsx` and `SetupAnnotation.tsx`. The signals data is already fetched by `useAnalysis` via `api.fetchSignals`. This is dead code that also bundles a duplicate URL constant.

---

## E. Routing & Pages

### No Router — Manual Page State

There is no `react-router-dom` or any routing library. Navigation is managed entirely via:

```ts
const [activePage, setActivePage] = useState<ActivePage>('chart')
type ActivePage = 'dashboard' | 'chart' | 'patterns' | 'replay' | 'settings'
```

Navigation happens via `handleNavigate()` in `App.tsx`. "Settings" is not a real page — it is a slide-over overlay. "Replay" is not a real page — it is a mode flag (`mode: 'live' | 'replay'`) that keeps `activePage === 'chart'`.

**Pages:**

| Page | File | Notes |
|---|---|---|
| Dashboard | `pages/DashboardPage.tsx` | Market overview, bias, session, confluence summary |
| Chart | `pages/ChartPage.tsx` | Primary view with SimpleChart, toolbar, replay bar |
| Patterns | `pages/PatternsPage.tsx` | Pattern annotation list |
| Settings | `components/settings/SettingsPanel.tsx` | Slide-over overlay, not a real page |

There is no auth, no protected routes (Tauri desktop app — no web auth needed), no URL-based navigation.

**`AppShell` — Unused Layout Component:**

`src/components/layout/AppShell.tsx` exports `AppShell` and `AppShellLayout`. Neither is imported anywhere in `App.tsx` or any page. The app's grid layout is implemented inline in `App.tsx` with raw CSS grid. `AppShell` is dead code.

---

## F. Build & Dependencies

### Package Overview

| Package | Version | Notes |
|---|---|---|
| React | 19.2.0 | Current, good |
| TypeScript | ~5.9.3 | Current, good |
| Tailwind CSS | 4.2.2 | v4 (Vite plugin), good |
| Zustand | 5.0.12 | Current, good |
| LightweightCharts | 5.1.0 | Active chart library, good |
| SciChart | 5.1.0 | **Dead code — should be removed** |
| Framer Motion | 12.38.0 | Used for animations in DashboardPage, PatternsPage |
| Vite | 7.3.1 | Current, good |
| Tauri | 2.10.1 | Desktop wrapper |
| Vitest | 4.1.0 | Test runner, good |

### TypeScript Strictness

`tsconfig.app.json` has `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`. This is correct and strict.

However, the `// @ts-nocheck` annotations on deprecated files and the `any | null` typing in `useAnalysis.ts` create two large holes in the strict-mode coverage:

- `Dashboard.tsx` (449 lines): `@ts-nocheck`
- `ArctisCandlestickChart.tsx`: `@ts-nocheck`
- `SettingsPanel.tsx` (legacy at `components/SettingsPanel.tsx`): `@ts-nocheck`
- `useAnalysis.ts`: 10 fields typed as `any`

### Test Coverage — Critically Low

| | Count |
|---|---|
| Test files (non-deprecated) | 1 |
| Source `.ts` files | ~15 |
| Source `.tsx` files | ~35 |

The single test file (`store/__tests__/market.test.ts`) covers 4 simple store assertions. There are no tests for:
- Any hook (`useMarketData`, `useAnalysis`, `useReplay`, `useDrawings`)
- Any component (no `.test.tsx` files)
- Any API function
- Any chart behavior

`package.json` has `"test": "vitest run --passWithNoTests"` — the `--passWithNoTests` flag means CI will pass even with zero tests.

### Duplicate Constants — No Shared Config

Three constants are duplicated across files with no shared source:

**`SESSION_DISPLAY` map — 3 copies:**
- `App.tsx` line 45
- `pages/DashboardPage.tsx` line 27
- `components/panels/SessionPanel.tsx` line 42 (named `SESSION_DISPLAY_NAMES`)

**`ENGINE_URL` / `BASE_URL` — 7 copies** (see section B)

**`Timeframe` type — 2 definitions:**
- `types/contracts.ts`: `'1min' | '5min' | '15min' | '30min' | '1h'`
- `types/market.ts`: `'1min' | '5min'` (incomplete — only 2 timeframes)

`types/market.ts` defines a `Timeframe` type that contradicts `types/contracts.ts`. Active code uses the contracts version, but the market.ts version could cause confusion in future development.

---

## Issue Register

| ID | Severity | Area | Issue |
|---|---|---|---|
| FE-01 | Critical | Symbol | `ESZ5` is expired (Dec 2025). Active symbol is stale. |
| FE-02 | Critical | Chart | Chart fully recreates on every bar update via `[bars]` dependency. No incremental update. |
| FE-03 | High | URLs | `http://127.0.0.1:8001` hardcoded in 7 locations. `useSettingsStore.engineUrl` is cosmetic. |
| FE-04 | High | Types | `useAnalysis` returns `any | null` for all 10 fields. Type safety for entire analysis layer is bypassed. |
| FE-05 | High | Overlays | Dual overlay state: `useSettingsStore.overlays` and `App.useState(activeOverlays)` are never synced. Settings panel toggles are non-functional for the chart. |
| FE-06 | High | Bundle | `scichart@5.1.0` is a production dependency but the code is deprecated and `@ts-nocheck`'d. WASM bundle weight remains. |
| FE-07 | Medium | WebSocket | WS `useEffect` dependency array has `[symbol]` only — missing `connectWs` which recreates on timeframe change. Timeframe changes do not trigger WS reconnect. |
| FE-08 | Medium | Symbol | `setMarket()` never validates derived `symbol` against `/api/markets` response. The markets API is fetched but its contract list is ignored for symbol resolution. |
| FE-09 | Medium | App.tsx | 743-line god component. Manages: routing, markets fetch, replay state, feed aggregation, chart ref, overlay state, HUD derivation, keyboard shortcuts. |
| FE-10 | Medium | Dead Code | `AppShell`/`AppShellLayout` components are exported but never used. |
| FE-11 | Medium | Dead Code | `useSignals` hook exports a function that is never called — only its type is imported. |
| FE-12 | Medium | Dead Code | 5 deprecated components remain in `src/components/` root (Dashboard, Chart, HudBar, LiveFeed, SessionTimeline, SettingsPanel — all `@deprecated` or `@ts-nocheck`). |
| FE-13 | Medium | Polling | 3 concurrent polling loops during replay: `useAnalysis` (5s), WS, and replay bar poll (1s). |
| FE-14 | Low | Types | `types/market.ts` defines `Timeframe = '1min' \| '5min'` — conflicts with `types/contracts.ts` which is the canonical version. |
| FE-15 | Low | Constants | `SESSION_DISPLAY` map is duplicated in 3 files with no shared source. |
| FE-16 | Low | Tests | 1 test file, 4 assertions. `vitest run --passWithNoTests` hides zero-test CI failures. |

---

## What Works Well

- **LightweightCharts integration** is structurally sound. Overlay series are separated by ref, visibility toggling is incremental (not chart recreate). The chart recreate-on-bars problem is the one significant implementation mistake.
- **Zustand usage** is lean — 2 stores, clear purpose, no circular dependencies.
- **`useAnalysis` consolidation** of 10 parallel requests via `Promise.allSettled` with graceful null fallback is a good pattern. The missing piece is the typing.
- **`api.ts` centralization** is the right architecture — it just needs to be the only place making HTTP calls.
- **TypeScript config** is strict. The holes are explicit bypass decisions, not structural weakness.
- **Drawing system** (`useDrawings`) is well-implemented — keyed by symbol+timeframe, localStorage persistence, incremental add/remove via Map refs.
- **Tauri integration** is clean with no web-only assumptions leaking into the core logic.

---

## Recommended Phase 1 Priorities (Before Any New Features)

1. **Fix FE-02** (chart recreate): Change `useEffect` dependency from `[bars]` to `[]` (mount only). Move bar data updates to a separate `useEffect([bars])` that calls `series.update()` or `series.setData()` without destroying the chart.
2. **Fix FE-01** (ESZ5 expiry): Either fetch front-month from `/api/markets` dynamically or update `SYMBOL_MAP` as an immediate hotfix.
3. **Fix FE-03** (URL centralization): Replace all 7 occurrences with `import.meta.env.VITE_ENGINE_URL` with a fallback to `'http://127.0.0.1:8001'`. Wire `useSettingsStore.engineUrl` as the runtime override.
4. **Fix FE-04** (useAnalysis types): Replace `any` with the correct types from `types/analysis.ts`. Remove the `as XType | null` casts from `App.tsx`.
5. **Fix FE-05** (overlay dual state): Delete `App.useState(activeOverlays)`. Read from and write to `useSettingsStore` exclusively.
6. **Fix FE-06** (SciChart): Remove from `package.json`, delete `src/lib/scichart-init.ts`, delete `src/components/charts/_deprecated/`.
7. **Fix FE-09** (god component): Extract markets fetch, feed aggregation, and HUD derivation into dedicated hooks. `App.tsx` should be a composition root, not a data layer.

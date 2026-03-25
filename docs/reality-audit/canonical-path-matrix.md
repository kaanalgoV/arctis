# Canonical Path Matrix — Arctis Frontend
_Phase 0 Reality Audit · 2026-03-25_

---

## 1. Sidebar Navigation → Page Components

Sidebar items are `ActivePage` values. Navigation is handled via `handleNavigate()` in `AppShell`.

| Sidebar Item  | `ActivePage` Value | Renders Component   | Route Change? | Notes |
|---------------|--------------------|---------------------|---------------|-------|
| Dashboard     | `'dashboard'`      | `<DashboardPage>`   | No (state)    | Full-width, no right panel |
| Chart         | `'chart'`          | `<ChartPage>`       | No (state)    | Default page on load; shows right panel |
| Patterns      | `'patterns'`       | `<PatternsPage>`    | No (state)    | Full-width, no right panel |
| Replay        | `'replay'`         | `<ChartPage>`       | No — `activePage` stays `'chart'`, `mode` switches to `'replay'` | `sidebarActive` shows `'replay'` highlight |
| Settings      | `'settings'`       | `<SettingsPanel>` (overlay) | No | `showSettings=true`, page stays visible behind |

### React Router routes (in `App.tsx`)
| Path       | Component    | Notes |
|------------|--------------|-------|
| `/landing` | `LandingPage` | Standalone landing/splash page |
| `/*`       | `AppShell`   | All other routes — single-page app |

> No route-based navigation between dashboard/chart/patterns — all pages are rendered via
> conditional rendering inside `AppShell` using `activePage` state.

---

## 2. Chart Toolbar Overlay Buttons → CandlestickChart

### Toolbar button definitions (`ChartToolbar.tsx`)

| Button Label | `OverlayKey` | Color Token             | Icon       |
|--------------|-------------|--------------------------|------------|
| VWAP         | `'vwap'`    | `CHART_TOKENS.overlay.vwap` | Activity  |
| EMA          | `'ema'`     | `#58A6FF`               | TrendingUp |
| Vol          | `'volume'`  | `CHART_TOKENS.overlay.volume.bull` | BarChart2 |
| VP           | `'vp'`      | `CHART_TOKENS.overlay.volumeProfile.poc` | LayoutGrid |
| Levels       | `'levels'`  | `#5CB8F0` (ice blue)    | Ruler      |
| Zones        | `'zones'`   | `#34D399`               | Layers     |

### Prop flow: ChartToolbar → CandlestickChart

```
App.tsx
  activeOverlays: Set<OverlayKey>   (state, initialized from useSettingsStore)
  handleToggleOverlay(key)          (toggles key in/out of set)
      |
      v
ChartPage.tsx
  props: activeOverlays, onToggleOverlay
      |
      ├─► ChartToolbar (display + toggle callbacks only — no data)
      |
      └─► ArctisChartWrapper
            props: showVolume, showVp
                |
                └─► CandlestickChart (SciChart)
                      props: showVolume, volumeProfiles
                      indicators Map (built from indicatorData)
                      priceLevels (built from sessionLevels)
```

### CRITICAL GAP — overlay keys not fully wired

| OverlayKey | Reaches CandlestickChart? | Mechanism |
|------------|--------------------------|-----------|
| `'vwap'`   | YES (indirect)           | `indicatorData.vwap` → `buildIndicatorMap()` → `indicators` Map in CandlestickChart. The toolbar toggle updates `activeOverlays` but **`showVwap` is never passed to `ArctisChartWrapper`**. VWAP renders whenever `indicatorData.vwap` is non-empty, regardless of toggle state. |
| `'ema'`    | YES (indirect)           | Same issue as VWAP — `ema9`/`ema21` always rendered when data exists; toggle has no effect. |
| `'volume'` | YES (wired)              | `activeOverlays.has('volume')` → `showVolume={...}` prop → `CandlestickChart.showVolume` |
| `'vp'`     | YES (wired)              | `activeOverlays.has('vp')` → `showVp={...}` prop → `buildDayVolumeProfiles()` |
| `'levels'` | NO                       | `activeOverlays.has('levels')` is never read anywhere. `priceLevels` are always passed when `sessionLevels` is non-null. Toggle has no effect. |
| `'zones'`  | NO                       | `activeOverlays.has('zones')` is never read. `zonesData` is fetched in `App.tsx` but never passed to `ChartPage` or `ArctisChartWrapper`. Zones have no rendering path. |

---

## 3. Data Flow Map

### useMarketData → bars

```
useMarketData({ pauseWs: mode === 'replay' })
    |
    ├─► REST: GET /api/db/bars?symbol=&days=&timeframe=  (initial load)
    ├─► REST: GET /api/live/price?symbol=               (live price poll, every 5s)
    ├─► REST: GET /api/db/bars?symbol=&days=1&timeframe= (WS reconnect refetch)
    └─► WebSocket: /ws/bars/{symbol}                   (push new bars)
            |
            ▼
    useMarketStore.bars []     (Zustand store)
    useMarketStore.wsStatus    ('connected' | 'disconnected' | ...)
    useMarketStore.lastBarTs   (triggers useAnalysis refetch)

Output to App.tsx:
    bars: OHLCVBar[]
    isLoading: boolean
    error: string | null
```

### useAnalysis → indicators

```
useAnalysis(pollIntervalMs: 5000 | 1500)
    Triggers on: mount + setInterval + lastBarTs change

    Parallel fetches:
    ├─► GET /api/analysis/sessions    → sessions: SessionAPIData
    ├─► GET /api/analysis/confluence  → confluence: ConfluenceAPIData
    ├─► GET /api/analysis/patterns    → patterns: PatternsAPIData
    ├─► GET /api/analysis/indicators  → indicators: IndicatorData (vwap, ema, rsi, session_levels)
    ├─► GET /api/analysis/volume      → volume: VolumeData
    ├─► GET /api/analysis/structure   → structure: StructureAPIData
    ├─► GET /api/config               → config: TradingConfig
    ├─► GET /api/bias                 → bias: BiasData
    ├─► GET /api/analysis/zones       → zones: { zones: [] }
    └─► GET /api/analysis/signals     → signals: SignalsAPIData

    NOTE: /api/signals (signals router, prefix /api/signals) is NOT called.
    The frontend calls /api/analysis/signals (zones.py, prefix /api/analysis).
    Two different endpoints serve "signals" — potential confusion.
```

### useDrawings → drawings

```
useDrawings(symbol, timeframe)
    |
    ├─► drawings: Drawing[]   (localStorage-backed, keyed by symbol+timeframe)
    ├─► activeTool: DrawingTool | null
    ├─► addDrawing(type, props)
    └─► clearDrawings()

Output to ChartPage → DrawingToolbar (toolbar display only)
NOTE: drawings[] are passed to ChartPage props but ArctisChartWrapper
does NOT forward them to CandlestickChart (no userDrawings prop).
Drawings are defined but NOT rendered on the chart.
```

---

## 4. Right Panel Sections

| Panel Section    | Data Source              | API Endpoint                   |
|------------------|--------------------------|--------------------------------|
| Signals          | `signalsData`            | `/api/analysis/signals`        |
| Session          | `sessionData`            | `/api/analysis/sessions`       |
| Confluence       | `confluenceData`         | `/api/analysis/confluence`     |
| Bias             | `biasData`               | `/api/bias`                    |
| Feed             | `feedItems` (derived)    | Aggregated from confluence + volume + patterns + sessions |
| Risk             | `tradingConfig`          | `/api/config`                  |
| Arctis AI        | `arctisPattern`, `arctisBias`, `currentPrice` | Derived from patterns + bias (no direct API call) |

---

## 5. Pages Detail

### DashboardPage
- Receives `onNavigateToChart`, `onOpenInWorkspace`
- Likely shows market overview / health summary (not audited in depth)

### ChartPage
- Core of the app — renders `ChartToolbar` + `ArctisChartWrapper` + `DrawingToolbar`
- Replay: shows `ReplayBar` when `mode === 'replay'`
- `structureBreaks`, `patternAnnotations`, `zones` are received as props but NOT
  forwarded to `ArctisChartWrapper`/`CandlestickChart` — these annotations have no render path

### PatternsPage
- Receives `data: PatternsAPIData | null`
- Shows pattern analysis (not audited in depth)

### LandingPage
- Standalone at `/landing` — no data dependencies

# Cumulative Delta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cumulative Delta as a chart indicator (subpanel) with divergence warnings, sourced from Rithmic aggressor data, stored in DB for replay support.

**Architecture:** Extract buy/sell volume from Rithmic tick aggressor field -> store in candles table -> compute cumulative delta per day (reset 17:00 CT) -> serve via API -> render as SciChart subpanel with green/red area fill -> detect price/delta divergence and emit warnings.

**Tech Stack:** Python/FastAPI (backend), TimescaleDB (storage), TypeScript/React/SciChart (frontend)

---

### Task 1: Extend OHLCVBar model with delta fields

**Files:**
- Modify: `engine/src/arctis/models.py:93-102`

- [ ] Add buy_volume, sell_volume, delta fields to OHLCVBar

### Task 2: DB schema migration - add delta columns

**Files:**
- Modify: `engine/src/arctis/db_constants.py`
- Modify: `engine/src/arctis/routes/live.py:114-122`

- [ ] Add migration SQL for buy_volume, sell_volume, delta columns
- [ ] Update INSERT/upsert query to include new columns

### Task 3: Extract aggressor from Rithmic ticks

**Files:**
- Modify: `engine/src/arctis/routes/live.py:96-99,168-175`

- [ ] Extract aggressor field from tick data
- [ ] Accumulate buy_volume/sell_volume in bar aggregation dict
- [ ] Compute delta per bar

### Task 4: Create cum_delta analysis module

**Files:**
- Create: `engine/src/arctis/analysis/cum_delta.py`

- [ ] Implement compute_cum_delta(bars) with daily reset at 17:00 CT
- [ ] Implement detect_divergence(bars, cum_delta_points)
- [ ] Define CumDeltaPoint and DivergenceResult dataclasses

### Task 5: Add API endpoint

**Files:**
- Modify: `engine/src/arctis/routes/analysis.py`

- [ ] Add GET /api/analysis/cum_delta endpoint
- [ ] Return cum_delta array + divergence result

### Task 6: Frontend - extend types and data fetching

**Files:**
- Modify: `app/src/types/analysis.ts:87-95`
- Modify: `app/src/hooks/useAnalysis.ts`

- [ ] Add cum_delta to IndicatorData interface
- [ ] Add cum_delta polling to useAnalysis hook

### Task 7: Frontend - add ChartToolbar toggle

**Files:**
- Modify: `app/src/components/charts/ChartToolbar.tsx:7,16-23`

- [ ] Add 'cum_delta' to OverlayKey type
- [ ] Add CD toggle button to OVERLAYS array

### Task 8: Frontend - render Cum Delta subpanel in chart

**Files:**
- Modify: `app/src/components/charts/CandlestickChart.tsx`

- [ ] Add cum delta data series + Y-axis (same pattern as volume)
- [ ] Render as mountain series with green/red fill based on sign
- [ ] Add zero-line as dashed horizontal
- [ ] Toggle visibility with activeOverlays

### Task 9: Update Engine Overview page

**Files:**
- Modify: `app/src/pages/EngineOverviewPage.tsx`

- [ ] Add Cum Delta to ANALYSIS_MODULES array
- [ ] Update module count in HeroStats
- [ ] Add to Signals tab info

### Task 10: Divergence warnings in feed

**Files:**
- Modify: `app/src/components/panels/SignalsPanel.tsx`

- [ ] Add cum_delta_divergence label
- [ ] Display divergence warnings in feed

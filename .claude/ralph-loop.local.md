---
active: true
iteration: 1
session_id: 
max_iterations: 15
completion_promise: "TASK COMPLETE"
started_at: "2026-03-22T23:23:25Z"
---

# PRD: Arctis SaaS Platform — Epic 2 (Chart Enhancements)

## Objective
Add professional-grade chart overlays to the Arctis candlestick chart. All overlays use data from existing analysis endpoints and are togglable via the chart toolbar.

## Current State
- Chart renders 12,300 NQH6 candles via Lightweight Charts v5 (`SimpleChart.tsx`)
- All analysis endpoints return real data from TimescaleDB
- `/api/analysis/indicators` returns: VWAP (with SD bands), EMA 9/21/50, RSI, Volume Profile (POC/VAH/VAL), Session Levels
- `/api/analysis/structure` returns: swings, trend, BOS/CHoCH breaks
- `/api/analysis/patterns` returns: pattern annotations with timestamps, prices, directions
- Chart toolbar exists (`ChartToolbar.tsx`) with overlay toggles

## Requirements

### US-012: VWAP Overlay
Add VWAP line + upper/lower 1SD and 2SD bands to the chart.
- VWAP: solid golden yellow line (#FBBF24), opacity 0.6
- +/-1 SD: same color, opacity 0.2, dashed
- +/-2 SD: same color, opacity 0.1, dashed
- Data from `/api/analysis/indicators` -> vwap array
- Togglable via toolbar "VWAP" pill

### US-013: EMA Ribbon
Add EMA 9/21/50 as colored lines.
- EMA 9: #34D399 (green), lineWidth 1
- EMA 21: #58A6FF (blue), lineWidth 1
- EMA 50: #A855F7 (purple), lineWidth 1
- Data from `/api/analysis/indicators` -> ema array
- Togglable via toolbar "EMA" pill

### US-014: Volume Profile Levels
Add horizontal price lines for POC, VAH, VAL.
- POC: #FBBF24 (amber), solid, with "POC" label
- VAH: #5CB8F0 (ice blue), dashed, with "VAH" label
- VAL: #5CB8F0 (ice blue), dashed, with "VAL" label
- Use `createPriceLine()` on the candlestick series
- Data from `/api/analysis/indicators` -> volume_profile
- Togglable via toolbar "VP" pill

### US-015: Session Separators
Add vertical lines at session boundaries.
- NY Open (9:30 ET), Midday (10:30 ET), Power Hour (14:00 ET), Close (16:00 ET)
- Color: rgba(92,184,240,0.15), dashed
- Small label at top of each line
- Calculate from bar timestamps

### US-016: Previous Day Levels
Add horizontal lines for prev day high/low/close.
- Prev High: dashed green line with "PDH" label
- Prev Low: dashed red line with "PDL" label
- Prev Close: dotted gray line with "PDC" label
- Data from `/api/analysis/indicators` -> session_levels
- Togglable via toolbar "Levels" pill

### US-017: Opening Range Box
Draw a semi-transparent rectangle for the first 15-min range.
- Background: rgba(92,184,240,0.06)
- Border: rgba(92,184,240,0.2)
- From opening_range_high to opening_range_low
- Time span: first 15 minutes of regular session
- Data from `/api/analysis/indicators` -> session_levels

### US-018: BOS/CHoCH Markers
Add structure break markers on the chart.
- BOS (Break of Structure): small green/red arrow marker
- CHoCH (Change of Character): small triangle marker with label
- Use `setMarkers()` on the candlestick series
- Data from `/api/analysis/structure` -> structure_breaks
- Each break has: type (BOS/CHoCH), direction, price, timestamp

### US-019: Pattern Markers
Add pattern trigger markers on chart.
- ORB breakout: colored box overlay showing the range
- IB break: similar box for 60-min initial balance
- Other patterns: arrow markers at trigger timestamp
- Data from `/api/analysis/patterns` -> annotations

## Acceptance Criteria
- [ ] VWAP line with SD bands renders on chart (toggle works)
- [ ] EMA 9/21/50 render as colored lines (toggle works)
- [ ] POC/VAH/VAL horizontal price lines visible (toggle works)
- [ ] Session separator vertical lines at correct times
- [ ] Previous Day H/L/C lines with labels (toggle works)
- [ ] Opening Range semi-transparent box on chart
- [ ] BOS/CHoCH markers appear at structure breaks
- [ ] Pattern markers appear at pattern triggers
- [ ] All overlays respect toolbar toggle state
- [ ] Chart performance acceptable with all overlays on (no lag with 12k bars)
- [ ] App compiles without TypeScript errors
- [ ] Backend still passes all 49 tests

## Technical Notes
- SimpleChart.tsx uses Lightweight Charts v5 API: `chart.addSeries(LineSeries, {...})`
- Price lines via `series.createPriceLine({price, color, lineWidth, lineStyle, axisLabelVisible, title})`
- Markers via `series.setMarkers([{time, position, color, shape, text}])`
- For overlays, fetch indicator data in App.tsx and pass as props to SimpleChart
- Keep the chart component focused — pass data in, don't fetch inside

## Constraints
- Lightweight Charts v5 API only (not v4)
- No emojis — labels use text only
- Performance: must handle 12,300 bars without lag
- All colors from chart-tokens.ts or design tokens

When ALL acceptance criteria are checked [x] and tests pass, output:
<promise>TASK COMPLETE</promise>

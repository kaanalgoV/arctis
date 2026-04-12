# Cumulative Delta Integration

## Summary

Integrate Cumulative Delta as a chart indicator (separate subpanel) with divergence warnings. Data sourced from Rithmic aggressor field (already available in tick feed, currently unused). Stored in DB for replay/backtest support. Daily reset at 17:00 CT (Market Open, same anchor as VWAP).

## Data Pipeline

```
Rithmic Tick (price, size, aggressor=BUY/SELL)
  -> live.py: extract buy_volume/sell_volume per tick
  -> Bar aggregation: accumulate buy/sell per 1-min bar
  -> DB: candles table (3 new columns)
  -> API: GET /api/analysis/cum_delta
  -> WS: cum_delta field in tick broadcast
  -> Frontend: Subpanel below main chart + divergence warnings
```

## Backend Changes

### 1. Rithmic Tick Extraction (routes/live.py)

Current state: `aggressor` field exists in Rithmic protobuf but is not extracted.

Change: In the tick processing callback, read `aggressor` from the tick data.
- `aggressor == 1` (BUY): `buy_volume += size`
- `aggressor == 2` (SELL): `sell_volume += size`
- Per-bar: `delta = buy_volume - sell_volume`

Update the bar aggregation dict to track `buy_volume`, `sell_volume`, `delta` alongside existing OHLCV fields.

### 2. DB Schema Migration (candles table)

Add 3 columns to `candles`:

```sql
ALTER TABLE candles ADD COLUMN IF NOT EXISTS buy_volume INTEGER DEFAULT 0;
ALTER TABLE candles ADD COLUMN IF NOT EXISTS sell_volume INTEGER DEFAULT 0;
ALTER TABLE candles ADD COLUMN IF NOT EXISTS delta INTEGER DEFAULT 0;
```

Update the INSERT/upsert query in live.py to include these columns.
Update the OHLCVBar model to include optional `buy_volume`, `sell_volume`, `delta` fields.

### 3. Analysis Module (analysis/cum_delta.py)

New module with:

- `compute_cum_delta(bars: list[OHLCVBar]) -> list[CumDeltaPoint]`
  - Iterates bars, cumulates delta from daily reset (17:00 CT)
  - Returns `[{timestamp, bar_delta, cum_delta}]`

- `detect_divergence(bars, cum_delta_points) -> DivergenceResult | None`
  - Bullish divergence: price makes LL, cum delta makes HL
  - Bearish divergence: price makes HH, cum delta makes LH
  - Returns `{type: "bullish"|"bearish", severity: "warning"|"strong", price_at, delta_at}`

- Daily reset logic: find the bar closest to 17:00 CT (22:00/23:00 UTC depending on DST) and reset cumulation to 0.

### 4. API Endpoint (routes/analysis.py)

Add to existing analysis router:

```
GET /api/analysis/cum_delta?market=NQ&symbol=NQM6&timeframe=1min&days=1
```

Response:
```json
{
  "cum_delta": [
    {"timestamp": 1774386000, "bar_delta": 42, "cum_delta": 1250},
    ...
  ],
  "divergence": null | {
    "type": "bearish",
    "severity": "warning",
    "message": "Price HH but Cum Delta LH - institutional selling pressure"
  }
}
```

### 5. Divergence Warning Integration

- When divergence detected, emit a warning event to the feed system (same pattern as discipline warnings).
- Reduce confluence score by 1 when divergence is active (soft penalty, not hard veto).
- Warning appears in FeedPanel as type "warning" with message "Cum Delta Divergenz - Vorsicht".

### 6. WebSocket Enhancement

Add `cum_delta` to the tick/bar WebSocket broadcast so the frontend can update in real-time without polling.

## Frontend Changes

### 7. Chart Subpanel (CandlestickChart.tsx)

Add a new SciChart sub-chart below the volume panel:
- Own Y-axis (auto-scaled)
- Mountain/area fill: green above zero, red below zero
- Zero-line as dashed horizontal
- Cum Delta as line series (color follows sign)
- Divergence markers as warning triangles at divergence points

### 8. ChartToolbar Toggle

Add "CD" toggle button to ChartToolbar (alongside VWAP, EMA, Vol, VP, Levels, Zones).
- Key: `cum_delta` in activeOverlays set
- Default: OFF (user enables manually)

### 9. IndicatorData Extension (types/analysis.ts)

```typescript
cum_delta?: Array<{
  timestamp: number
  bar_delta: number
  cum_delta: number
}>
```

### 10. useAnalysis Hook

Add cum_delta to the parallel REST poll cycle (same pattern as other analysis endpoints).

### 11. Engine Overview Update (EngineOverviewPage.tsx)

- Add "Cum Delta" to the Modules tab under "Core Analysis" group
- Update module count (21 -> 22)
- Add divergence detection to the signal confirmations display

### 12. SignalsPanel / FeedPanel

- Show divergence warnings when detected
- Display as warning type with orange color

## Data Availability

- **Live mode:** Full delta from Rithmic tick feed (aggressor field)
- **Replay mode:** Delta from DB (requires bars recorded with delta columns)
- **Historical bars without delta:** Show empty subpanel with "No delta data" message
- **Daily reset:** 17:00 CT (Central Time), same as VWAP anchor

## Files to Create/Modify

### New files:
- `engine/src/arctis/analysis/cum_delta.py` - Delta computation + divergence detection

### Modified files:
- `engine/src/arctis/routes/live.py` - Extract aggressor, aggregate buy/sell volume
- `engine/src/arctis/routes/analysis.py` - Add cum_delta endpoint
- `engine/src/arctis/models.py` - Add buy_volume/sell_volume/delta to OHLCVBar
- `engine/src/arctis/db_constants.py` - Schema migration SQL
- `app/src/types/analysis.ts` - Add cum_delta to IndicatorData
- `app/src/components/charts/CandlestickChart.tsx` - Add subpanel rendering
- `app/src/components/charts/ChartToolbar.tsx` - Add CD toggle
- `app/src/hooks/useAnalysis.ts` - Add cum_delta polling
- `app/src/pages/EngineOverviewPage.tsx` - Add Cum Delta module + update counts
- `app/src/components/panels/SignalsPanel.tsx` - Divergence warning display
- `app/src/components/layout/HudStrip.tsx` - Optional: show current cum delta value

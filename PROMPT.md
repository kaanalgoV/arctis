# PRD: Arctis Chart Engine Komplett-Fix

## Objective
Fix all remaining chart, data, and UI issues to make Arctis a production-ready, sellable trading platform. The chart must display correctly with proper Y-axis behavior, historical data going back 60+ days, accurate bias/signals, and a professional live trading experience matching TradingView/ATAS quality.

## Requirements

1. **Y-Axis Direction Fix**: The Y-axis must never invert or move in the wrong direction. When price goes up, candles must visually go up. The fitYAxisToVisibleRange function must correctly compute min/max from visible OHLC data.

2. **Historical Data Depth**: Change days parameter from 1 to 60 days. The user must be able to scroll back 2-3 months of data. The engine must load and serve this data efficiently. Default visible view stays at ~36 bars (current session), but scrolling left reveals months of history.

3. **Live Badge Accuracy**: The "LIVE" badge in the topbar must only show green when Rithmic is actually connected and streaming ticks. When disconnected, show "OFFLINE" or "DB" mode. Check the actual Rithmic connection state, not just whether bars exist.

4. **Bias Accuracy**: The bias engine must correctly reflect the current market direction. If price is falling, bias must not say "LONG". The bias must match what a trader sees on the chart. Remove or fix the RANGE +0 display when it's clearly directional.

5. **Signal Quality**: Signals should only appear when they represent a genuinely profitable opportunity. No false signals. If the engine can't determine a high-quality signal, show "No active signals" (which is correct and honest).

6. **Chart Visual Quality**: Candles must be properly sized, grid lines subtle, VWAP smooth (RTH-only), EMAs continuous, volume histogram proportional. The chart must look like a $500/month professional platform.

7. **All Buttons Functional**: Every toolbar button (VWAP, EMA, Vol, VP, Levels, Zones) must toggle its overlay on/off. Test each one. Drawing tools must respond to clicks.

## Acceptance Criteria

- [ ] Y-axis correctly scales to visible candle range (price up = visually up)
- [ ] fitYAxisToVisibleRange reads OHLC high/low correctly from dataSeries
- [ ] Market store days parameter set to 60 (or configurable) for deep history
- [ ] Backend /api/db/bars serves 60+ days of data efficiently
- [ ] Scrolling left in the chart reveals historical data going back months
- [ ] Initial view shows last ~36 bars (current session focus)
- [ ] LIVE badge only green when Rithmic is connected (check live.py _rithmic_connected)
- [ ] When Rithmic disconnected, topbar shows "OFFLINE" or "DB" not "LIVE"
- [ ] Bias direction matches actual price action (falling price = bearish bias)
- [ ] Bias panel shows clear direction with reasoning, not "RANGE +0" when directional
- [ ] No false/misleading signals displayed
- [ ] VWAP line is smooth (RTH-only, no overnight jumps) — verified
- [ ] EMA lines are continuous without breaks
- [ ] All overlay toggle buttons work (VWAP on/off, EMA on/off, etc.)
- [ ] Chart renders without console errors
- [ ] TypeScript compiles with 0 errors
- [ ] Changes pushed to GitHub algorivo/arctis feat/masterpack-230
- [ ] Changelog page content trimmed to user-friendly summaries

## Constraints
- Work within the existing codebase and architecture
- Follow project conventions (see .claude/CLAUDE.md)
- Arctic Frost theme: ice blue #5CB8F0, red #EF4136, dark #0F1318
- Engine port: 28080, Frontend port: 5174
- SciChart CandlestickChart is the canonical chart core
- Don't break existing working features

## Current Iteration Context
This file is used by a Ralph Loop. Each iteration:
1. Read this PRD
2. Check current state of implementation
3. Work on the next uncompleted acceptance criterion
4. Run tests to verify
5. Mark completed criteria with [x]

When ALL acceptance criteria are checked [x] and tests pass, output:
<promise>TASK COMPLETE</promise>

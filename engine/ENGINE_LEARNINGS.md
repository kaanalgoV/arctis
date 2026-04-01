# Arctis Engine Learnings — v9 Sprint (2026-03-27)

## v9 Changes (Perfect Entries Audit)

### Critical Bug Fixed: MAX_STOP_POINTS was 10pt
- The old `_MAX_STOP_POINTS = 10.0` (40 ticks) blocked ALL NQ ORB signals
- NQ OR ranges: 48-229pt, 0.5x = 24-115pt — ALL exceed 10pt limit
- ES OR ranges: 7-43pt, 0.5x = 4-21pt — most exceed 10pt limit
- Fix: Market-specific limits: NQ=60pt, ES=25pt

### ORB Now Fires for NQ
- Before v9: 0 ORB signals for NQ (all blocked by stop limit)
- After v9: 14 ORB signals, 79% WR, +437.89pt
- Also lowered ORB min confluence from 3 to 2 (was too strict)
- Also lowered ORB volume factor from 1.2x to 1.0x
- Relaxed prior-bar-inside-OR check from 0.1% to 0.3% tolerance

### VWAP MR: Bias-Filtered + Higher Threshold
- v8: Fired both directions regardless of bias — 7/8 NQ failures were wrong direction
- v9: Do not fire VWAP MR long when bias=SHORT, short when bias=LONG
- Raised ATR threshold from 1.0x to 1.5x (was too trigger-happy)
- Wider stop buffer: 1.0pt instead of 0.50pt
- Disabled for ES (38% WR, -19pt — net loser)

### Market-Specific Signal Selection
- NQ: ORB (79% WR, +438pt) + VWAP MR (54% WR, +42pt)
- ES: ORB (65% WR, +194pt) + Daily Breakout (43% WR, +92pt)
- NQ daily breakout DISABLED (27% WR, -157pt)
- ES VWAP MR DISABLED (38% WR, -19pt)

### v9 Results (March 2026, 22 trading days)
- NQ: 27 trades, 66.7% WR, PF 2.86, +$9,597 USD
- ES: 31 trades, 54.8% WR, PF 3.43, +$14,292 USD
- Combined: +$23,889 USD (vs v8: +$16,548, a +44% improvement)

### v9 Accuracy (vs Hindsight-Optimal)
- NQ: 77% accuracy (engine found right trade or won)
- ES: 77% accuracy
- Remaining failures: wrong direction in ranging markets, confluence too low

---

# v7 Sprint (2026-03-29)

## Data Analyzed

- Period: Feb 25 - Mar 27, 2026 (22 trading days)
- Markets: NQ (E-mini NASDAQ-100), ES (E-mini S&P 500)
- Bars: ~9000 per market (1-minute)
- Methodology: Deep day-by-day analysis + 20 strategy variant backtests + walk-forward validation

---

## What Works

### 1. Daily Breakout (PDH/PDL) — BEST SIGNAL
- NQ: 71.4% WR, +1.34R avg (7 trades)
- ES: 66.7% WR, +1.14R avg (6 trades)
- Best when: VWAP aligned, early in session (bar 3-150), intraday (no gap)
- VWAP alignment is critical: ES 64% WR with VWAP, much worse without

### 2. ORB Breakout — MARKET-SPECIFIC
- **ES: Excellent** — 87.5% WR with 0.75x OR stop (8 trades, PF huge)
- **NQ: Improved** — 40% WR with ATR-based stop (5 trades, up from near-zero)
- Key finding: Full OR stop on NQ = 27% WR (OR is 30+ pts = massive risk)
- ES OR ranges are 3-18 pts, so OR-based stops work perfectly

### 3. POC Rejection — Marginal but Positive
- NQ: 66.7% WR (3 trades, but small sample)
- ES: 33.3% WR (3 trades)
- Only profitable with min confluence 3 and min RR 2.0
- Without higher selectivity: 33-36% WR at 1.5R = net loser

---

## What Doesn't Work

### 1. VWAP Bounce — DISABLED (22% WR)
Mean-reversion without orderflow depth is unreliable. Consistently loses money.

### 2. Naked POC Magnet — DISABLED (0% WR)
Theoretical concept doesn't translate to profitable signals with simulated data.

### 3. VA Edge — DISABLED (0% WR)
Touching value area without L2 data produces random entries.

### 4. NQ ORB with Full OR Stop
NQ OR range averages 30+ pts. Using the full OR as stop distance means:
- Risk is 30+ pts per trade
- 1.5R target = 45+ pts — rarely reached within 60 bars
- Result: 27% WR, unprofitable

### 5. Late-Day Entries (bar > 150)
Win rate drops significantly for entries after bar 150 (~12:00 ET).

---

## Best Conditions for Signals

| Condition | Impact |
|-----------|--------|
| VWAP aligned with direction | +10-15% WR |
| Confluence >= 3 | Higher quality, fewer trades |
| Bar 3-60 (early session) | Best WR for ORB and daily breakout |
| RVOL >= 0.7 | Filters dead-market false breakouts |
| ES OR range < 12pts | Sweet spot for ORB |
| NQ OR range 15-35pts | Sweet spot (>35pts = 14% WR) |
| Trend day type | 50-100% ORB WR depending on market |
| Not reversal day | Reversal days destroy ORB signals |

## Worst Conditions for Signals

| Condition | Impact |
|-----------|--------|
| RVOL < 0.5 | Dead market, false breakouts |
| NQ OR > 35pts | Too much risk, only 14% WR |
| Reversal days | ORB signals get stopped |
| Range days (NQ) | Only 30% ORB WR |
| No VWAP data | Cannot filter direction quality |
| Late entries (bar > 150) | Stale setups, mean-reversion risk |
| Low confluence (1-2) | Random entries |

---

## ES vs NQ Differences

| Parameter | ES | NQ |
|-----------|-----|-----|
| OR Range (avg) | 8.7 pts | 30.9 pts |
| OR Breakout WR | 68.2% | 40.9% |
| Best Stop Mode | 0.75x OR | 1x ATR |
| ORB PF (v7) | 5.76 | 4.01 |
| PDH/PDL WR | 50% | 50% |
| Tick value | $12.50 | $5.00 |
| Typical day range | 6-18 pts | 20-60 pts |
| POC rejection WR | 33% | 66.7% (small n) |

**Key insight**: ES is a fundamentally better ORB market. Smaller OR ranges mean:
- Stop distance is manageable (3-12 pts = $37.50-$150)
- 1.5R target is reachable (5-18 pts)
- PF is consistently above 3.0 across all configs tested

NQ's larger OR ranges make pure ORB strategies marginal. NQ profits more from:
- Daily breakout (PDH/PDL)
- ATR-based tight stops
- Selective POC rejections

---

## Recommended Parameters (v7)

### ES Configuration
```
or_minutes: 30
stop_mode: 0.75x OR
min_confluence: 2 (ORB: 3)
rvol_filter: 0.7
max_entry_bar: 90 (ORB), 150 (daily)
entry_confirm: close
vwap_alignment: required for daily breakout
```

### NQ Configuration
```
or_minutes: 30
stop_mode: 1x ATR
or_range_filter: skip > 35pts
min_confluence: 2 (ORB: 3)
rvol_filter: 0.7
max_entry_bar: 90 (ORB), 150 (daily)
entry_confirm: close
vwap_alignment: required for daily breakout
poc_min_confluence: 3
poc_min_rr: 2.0
```

---

## v7 Backtest Results (Feb 25 - Mar 27, 2026)

### NQ
- 15 trades, 60.0% WR, PF 4.01, +$563.75
- Daily breakout: 7 trades, 71.4% WR
- ORB: 5 trades, 40% WR (improved from v6 with ATR stops)
- POC rejection: 3 trades, 66.7% WR

### ES
- 17 trades, 70.6% WR, PF 5.76, +$1,250.00
- ORB: 8 trades, **87.5% WR** (best signal by far)
- Daily breakout: 6 trades, 66.7% WR
- POC rejection: 3 trades, 33.3% WR

### Combined: $1,813.75 (+$168.75 vs v6)

---

## Walk-Forward Validation Results

Split: 65% in-sample (14 days), 35% out-of-sample (9 days)

| Market | IS WR% | IS PF | OOS WR% | OOS PF | Overfit? |
|--------|--------|-------|---------|--------|----------|
| NQ     | 44.4%  | 0.88  | 75.0%   | 4.63   | NO       |
| ES     | 61.5%  | 3.83  | 62.5%   | 15.03  | NO       |

**No overfitting detected**. OOS performance exceeds IS for both markets.
This is likely due to market regime: March 2026 was a strong trending period.

---

## Known Weaknesses

1. **Small sample size** (22 trading days) — statistical significance is limited
2. **POC rejection** is marginal — could become a net loser with more data
3. **No orderflow data** — all signals rely on price/volume only
4. **Session classification** uses timestamp heuristics, not exchange session data
5. **No regime detection** — same parameters for trending and ranging markets
6. **Reversal days** destroy OR breakout signals (33% WR on reversal days)
7. **NQ ORB** still marginal at 40% WR — consider disabling if it underperforms live

---

## Future Improvement Ideas

### High Priority
1. **Regime filter**: Detect trending vs ranging days from first 30 min characteristics
   - Range days: disable ORB, focus on POC rejection
   - Trend days: aggressive ORB with trailing stop
2. **Reversal detection**: If first 30 min shows strong directional move, be cautious about ORB in same direction (often fades)
3. **Trailing stop**: Instead of fixed 1.5R target, trail stop at 1x ATR when in profit
4. **Multi-timeframe confirmation**: Check 5-min structure before entering on 1-min signal

### Medium Priority
5. **Time-weighted exits**: If a trade hasn't moved after 30 bars, exit at market
6. **Partial profit taking**: Take 50% at 1R, let rest run with trailing stop
7. **Correlation filter**: If NQ and ES signal in opposite directions, skip both
8. **Volatility scaling**: Adjust position size based on current ATR vs historical ATR

### Low Priority
9. **Machine learning**: Train a classifier on the 22-day dataset (too small currently)
10. **Tick data**: Use 1-second bars for entry timing (need Rithmic live data)
11. **Order book imbalance**: Detect large resting orders at levels (need L2 data)

---

## Strategy Variant Test Results (Phase 2 Summary)

### Top 5 NQ Configs (by Profit Factor)
| Config | PF | WR% | Trades | P&L $ |
|--------|-----|-----|--------|-------|
| OR15-conf2 | 2.36 | 57.1% | 21 | +$1,055 |
| entry-180 | 2.34 | 54.5% | 22 | +$1,261 |
| time-10-14 | 2.34 | 54.5% | 22 | +$1,261 |
| aggressive | 2.29 | 54.5% | 22 | +$583 |
| rvol-0.5 | 2.22 | 50.0% | 22 | +$1,185 |

### Top 5 ES Configs (by Profit Factor)
| Config | PF | WR% | Trades | P&L $ |
|--------|-----|-----|--------|-------|
| tight-quality | 5.45 | 64.7% | 17 | +$1,374 |
| stop-0.7x | 5.12 | 61.9% | 21 | +$1,565 |
| rr3.0 | 4.69 | 61.9% | 21 | +$1,856 |
| entry-60 | 4.64 | 61.1% | 18 | +$1,525 |
| OR45-conf2 | 4.61 | 68.4% | 19 | +$1,513 |

### Day Type Impact on OR Breakout (Raw, before engine filters)
| Day Type | NQ WR | ES WR |
|----------|-------|-------|
| Trend up | 50% | 100% |
| Trend down | 60% | 50% |
| Range | 30% | 71% |
| Reversal | 33% | 67% |

---

## Failure Pattern Database

### NQ OR Breakout Failures (13 out of 22 days)
- **Confluence**: Failures distributed across all levels (2-4)
- **OR Range**: Worst at 35-50pts (14% WR), best at 25-35pts (50% WR)
- **VWAP**: Failures evenly split (above/below) — not a strong predictor alone
- **EMA**: Failures evenly split (bullish/bearish)
- **Entry Time**: Most failures in early window (bars 30-45 = 7 failures)
- **RVOL**: Most failures at 0.7-1.0x (9 out of 13) — volume alone doesn't predict

### ES OR Breakout Failures (7 out of 22 days)
- **OR Range**: All failures in <10pts range (6 out of 7)
- **Entry Time**: All failures in bars 30-60
- **Key insight**: ES failures are rarer and less systematic — ES ORB is robust

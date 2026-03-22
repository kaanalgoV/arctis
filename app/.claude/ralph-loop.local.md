---
active: true
iteration: 2
session_id: 
max_iterations: 15
completion_promise: "TASK COMPLETE"
started_at: "2026-03-22T23:37:33Z"
---

# PRD: Arctis — Epic 3 (BIAS Integration)

## Objective
Implement Kaan's full BIAS trading methodology as Python analysis modules. These encode the systematic approach from the BIAS repo (~/bias/blueprint.md) and Traivend education into computable, testable backend code.

## Context
- Backend: Python FastAPI at `engine/src/arctis/` with 11 existing analysis modules
- All analysis reads from TimescaleDB via `db.py` -> `fetch_bars_as_models()`
- Existing modules: structure, volume, vwap, volume_profile, indicators, confluence, patterns, sessions, discipline, probability, risk
- BIAS methodology reference: `/Users/kaan_macbook/bias/blueprint.md`

## Requirements (US-021 to US-030)

### US-021: Velocity Module
Create `engine/src/arctis/analysis/velocity.py`:
- Calculate velocity = price_change / time for each bar
- Compute rolling average velocity over N bars (default N=20)
- Ratio: current_velocity / avg_velocity
- Scale 1-10: <0.5 ratio -> 1-2 (very slow), 0.5-1.0 -> 3-5 (normal), 1.0-1.5 -> 5-7 (fast), 1.5-2.5 -> 7-9 (very fast), >2.5 -> 10 (manipulative)
- Return: list of {timestamp, velocity, avg_velocity, ratio, scale}

### US-022: Auction Quality Module
Create `engine/src/arctis/analysis/auction.py`:
- Measure traded_ticks / total_ticks per price swing
- A swing = consecutive bars in same direction (using swings from structure.py)
- Quality: >0.85 = "sauber" (clean), 0.60-0.85 = "moderat", <0.60 = "schlecht" (poor, will be rebalanced)
- One-way auction (low volume move) = weak bias indicator
- Two-way auction (balanced volume) = strong bias indicator
- Return: {quality_score, quality_label, auction_type, traded_ticks, total_ticks}

### US-023: Naked POC Tracker
Create `engine/src/arctis/analysis/naked_poc.py`:
- Identify POC (Point of Control) for each trading day
- Track which daily POCs have NOT been retested (price didn't touch them again)
- These "naked POCs" act as magnets — price tends to return to them
- Return: list of {date, poc_price, is_naked, distance_from_current}
- Sort by distance (closest first)

### US-024: 5-Bias-State System
Create `engine/src/arctis/analysis/bias_state.py`:
- Replace the simple LONG/SHORT/NEUTRAL with 5 states:
  1. LONG — clear uptrend, strong structure
  2. RANGE_LONG — sideways with bullish lean
  3. RANGE — no directional bias
  4. RANGE_SHORT — sideways with bearish lean
  5. SHORT — clear downtrend, strong structure
- Inputs: trend (from structure.py), velocity, auction quality, VWAP position, EMA alignment
- Scoring: each input contributes -2 to +2, sum determines state
- Return: {state, score, components: {trend, velocity, auction, vwap, ema}}

### US-025: Bias-Switch-Level
Create `engine/src/arctis/analysis/bias_switch.py`:
- Calculate exactly ONE daily level where bias would flip
- Hierarchy (pick first that applies):
  1. Most recent defended structural point (swing high/low held 2+ times)
  2. Bottom/top formation level
  3. Key zone boundary (range held >=3 days)
  4. Asia session extreme (if no better level)
- Return: {level, type, confidence, description}

### US-026: Opening Fake Detection
Add to `engine/src/arctis/analysis/patterns.py` or create new:
- Opening Fake = price breaks previous day's extreme in first 2 hours, then reverses
- Conditions: break prev_high or prev_low, low volume on break, no follow-through
- Return: {detected: bool, direction, break_price, reversal_time, confidence}

### US-027: Double Fake Exhaustion
Add to patterns or create new module:
- Two failed breakout attempts at the same extreme with declining velocity
- Second attempt shows higher rejection volume than first
- Strong reversal signal
- Return: {detected: bool, direction, attempts: [{time, price, velocity}], confidence}

### US-028: 60% Correction Monitor
Create `engine/src/arctis/analysis/correction.py`:
- Track the current correction depth relative to the last impulse move
- Impulse = last significant directional move (using swings)
- Correction depth = retracement from impulse end
- If correction > 60% of impulse = structural threat (bias weakening)
- Return: {impulse_size, correction_size, correction_pct, is_threat, impulse_direction}

### US-029: Key Level Identification
Create `engine/src/arctis/analysis/key_levels.py`:
- Identify price levels that have been respected for >=3 trading days
- A level is "respected" if price tests it (within 0.1%) and reverses
- These key levels never expire
- Return: list of {level, first_test_date, test_count, last_test_date, type: support|resistance}

### US-030: Daily Bias Endpoint
Create `engine/src/arctis/routes/bias.py`:
- New API router at `/api/analysis/bias`
- Combines ALL BIAS modules into one structured response:
  - bias_state (from US-024)
  - bias_switch_level (from US-025)
  - velocity (latest from US-021)
  - auction_quality (from US-022)
  - naked_pocs (from US-023)
  - opening_fake (from US-026)
  - double_fake (from US-027)
  - correction (from US-028)
  - key_levels (from US-029)
- Register router in main.py

## Acceptance Criteria
- [ ] velocity.py exists and returns velocity scale 1-10 for NQ bars
- [ ] auction.py exists and classifies auction quality (sauber/moderat/schlecht)
- [ ] naked_poc.py tracks unretested daily POCs across multiple days
- [ ] bias_state.py returns one of 5 bias states with component scores
- [ ] bias_switch.py calculates a single daily switch level
- [ ] Opening Fake detection works (checks prev day extreme break + reversal)
- [ ] Double Fake Exhaustion detection works (2 failed attempts + declining velocity)
- [ ] correction.py monitors retracement depth and flags >60% as threat
- [ ] key_levels.py identifies multi-day respected levels
- [ ] GET /api/analysis/bias returns combined BIAS analysis
- [ ] All new modules have pytest tests
- [ ] All existing 49 tests still pass
- [ ] App compiles without TypeScript errors

## Technical Notes
- All modules take `list[OHLCVBar]` as input (same pattern as existing modules)
- Use structure.py's `detect_swings()` for swing detection (don't duplicate)
- Use volume_profile.py's `build_volume_profile()` for POC calculation
- Velocity uses M1 (1-min) bars primarily
- Keep modules independent — each can be tested in isolation
- BIAS blueprint at ~/bias/blueprint.md has the full methodology reference

When ALL criteria are [x] and tests pass:
<promise>TASK COMPLETE</promise>

# Arctis Backend Audit — Phase 0 Truth Reset

**Date:** 2026-03-23
**Scope:** `/Users/kaan_macbook/arctis/engine/src/arctis/` (all Python source)
**Method:** Full manual code read — every file, every function
**Purpose:** Drive rewrite decisions. No greenwashing.

---

## 1. File-by-File Inventory

### Core Module: `main.py`

**What it does:** FastAPI application entry point. Defines all middleware, imports all routers, owns the `Simulation` singleton and the bar-poller background task. Also defines standalone endpoints: `GET /health`, `GET /api/markets`, `GET /api/db/bars`, `GET /api/bars`, `POST /api/import`, `POST /api/sim/start`, `POST /api/sim/stop`, `GET /api/sim/status`, `POST /api/sim/step`, `GET /api/replay/dates`, `WS /ws/bars/{symbol}`.

**DB vs fallback:** DB is the primary source for `/api/bars` and all sim routes. The `Simulation.start()` fetches from DB via `fetch_bars_as_models()`. The background bar-poller fetches from DB every 5 seconds.

**Production-ready?** Mostly functional, but has issues:
- `POST /api/sim/step` references `sim._manual_offset` which is set dynamically but `Simulation.get_bars()` never reads `_manual_offset`. The step endpoint is **effectively broken** — it sets an attribute that nothing uses.
- `HTTPException` is referenced in `/api/sim/step` without being imported in `main.py`. Will raise `NameError` at runtime.
- `ParquetStore` is instantiated at module level using a path relative to the source tree (`DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"`). This path resolves to the repo root `/arctis/data/` — which may not exist in production deployments.
- CORS origins are hardcoded (localhost:1420, 5173, 5174, tauri://localhost). Not configurable via environment variable.

**Hardcoded values:** CORS origin list, `store = ParquetStore(DATA_DIR)` path, `"0.1.0"` version string appears twice (once in FastAPI(), once in `/health`).

---

### Core Module: `db.py`

**What it does:** All TimescaleDB access. Provides `fetch_bars()` (raw dicts), `fetch_bars_as_models()` (OHLCVBar list with optional aggregation), `fetch_available_symbols()`, `_build_symbol_map()` (lazy front-month resolution), `aggregate_bars()` (pandas resample for multi-timeframe).

**DB vs fallback:** This IS the DB layer. No fallbacks here. All queries hit `ohlcv_1m` (hardcoded table name). No configurable table name parameter.

**Production-ready?** Mostly yes, but with notable issues:
- `_SYMBOL_MAP` is a module-level singleton that is built once and **never refreshed**. If a new front-month contract is rolled into the DB after startup, the map stale-caches the old contract until process restart.
- `_build_symbol_map()` picks the "front-month" by `MAX(timestamp)` per root. This is an implicit heuristic, not explicit configuration. It will silently pick the wrong contract if two contracts have the same latest timestamp (e.g., during a roll).
- Root extraction is `sym[:2]` which correctly handles NQ, ES, CL, GC, 6E, 6J but will fail for any symbol with a 1-character or unusual root.
- `aggregate_bars()` uses pandas `resample()` with UTC floor bucketing. This does NOT respect session boundaries. A 5-minute bar that spans 09:29–09:34 ET will be included in the pre-market or RTH bucket depending on UTC math, not trading logic.
- `fetch_bars()` always queries `days` worth of data from `NOW()`. There is no way to query a specific date range via the REST API without direct DB access.

**Hardcoded values:** `"ohlcv_1m"` table name, `pool_size=5, max_overflow=10`, `days=10` default in `fetch_bars_as_models`.

---

### Core Module: `models.py`

**What it does:** Core Pydantic/Enum definitions: `MarketRoot`, `Market` (alias), `Timeframe`, `ContractInfo`, `MarketInfo`, `OHLCVBar`, `CSVMapping`. Also defines `FRONT_MONTH` dict and `MARKET_NAMES` dict.

**DB vs fallback:** Not a data-access module, but contains `FRONT_MONTH` — a hardcoded static fallback table.

**Production-ready?** The `Timeframe` enum has **duplicate values** (`M1 = "1min"` and `MIN_1 = "1min"`, `M5 = "5min"` and `MIN_5 = "5min"`). Python allows this but the comment `"Use a set to avoid duplicates when Timeframe has aliased values"` in `main.py` acknowledges the problem. This is a known wart that will cause confusing serialization behavior.

**Hardcoded values:** `FRONT_MONTH` dict is **critically hardcoded** with specific expiry contracts (NQH6, ESZ5, CLJ6, GCJ6, 6EH6, 6JH6). This dict is marked "static fallback — will be replaced by DB query later" in a comment, but the `resolve_symbol()` function in this file is only called from `main.py`'s `/api/markets` fallback path. The actual live resolution goes through `db._resolve_symbol()` which uses the DB. However the hardcoded dict (`ESZ5`) is already stale — ES front month as of 2026-03 is ESM6, not ESZ5.

---

### Core Module: `storage.py`

**What it does:** `ParquetStore` — reads/writes OHLCV bars to Parquet files, one file per `market + timeframe`. Used by `POST /api/import` and as the middle layer in `_load_bars()` in `routes/analysis.py`.

**DB vs fallback:** This IS the fallback. It exists as a CSV-import path and as a test fixture mechanism. It is NOT used for live market data.

**Production-ready?** Functional for its intended purpose (CSV import persistence). However:
- The `_load_bars()` in `routes/analysis.py` tries ParquetStore BEFORE the DB. This means if a stale Parquet file exists, the API will serve stale data silently.
- No TTL, no freshness check on Parquet files.
- Not used in any production path — only via `POST /api/import`.

---

### Core Module: `config.py`

**What it does:** Loads/saves a `TradingConfig` dataclass (account size, risk percent, daily loss limit, tick values) from a JSON file at `data/config.json`.

**DB vs fallback:** File-based. No DB. Defaults are baked in as Python default arguments.

**Production-ready?** Works but has issues:
- `tick_value_es = 12.50`, `tick_value_nq = 5.00`, `tick_size_es = 0.25`, `tick_size_nq = 0.25` are hardcoded defaults — correct for 2026 micro/mini futures, but any config change requires reloading or saving a new JSON.
- Only supports ES and NQ (the `routes/risk.py` handler only dispatches on `"ES"` vs everything-else-is-NQ). CL, GC, 6E, 6J have no risk parameters.
- `CONFIG_PATH` uses the same `parent.parent.parent.parent` path construction as `main.py` — brittle relative-to-source-file resolution.

---

### Core Module: `ws.py`

**What it does:** `ConnectionManager` — manages WebSocket connections grouped by symbol string. Symbol-based rooms, broadcast, connect/disconnect with async lock.

**DB vs fallback:** None — pure connection management.

**Production-ready?** Clean and minimal. However:
- The actual bar streaming logic lives in `main.py` (the poller background task + the `/ws/bars/{symbol}` endpoint), not here.
- `ConnectionManager` has no concept of timeframe. A subscription to `NQH6` receives ALL bars for that symbol regardless of what timeframe the frontend requested. Timeframe filtering/aggregation must happen client-side.
- The 5-second poll in `main.py` fetches `days=1` of bars on every tick for every subscribed symbol, scans for a timestamp change, then broadcasts only the latest bar if changed. For multiple subscribers to the same symbol this is correct, but fetching a full day of bars every 5 seconds is wasteful.
- No reconnect logic, no backpressure handling.

---

### Core Module: `events.py`

**What it does:** `FeedEventEngine` — an in-memory ring buffer (max 500 events) that receives `AnalysisSnapshot` objects, diffs them against the previous state, and emits typed `FeedEvent` objects for 4 event types: `session_change`, `confluence_shift`, `volume_spike`, `pattern_trigger`.

**DB vs fallback:** None — pure state machine over pre-computed analysis results.

**Production-ready?** Well-implemented. Event deduplication by 30-second bucket is reasonable. The ring buffer is correct. But:
- State is fully in-process memory. On server restart all events are lost.
- The engine is only updated when `GET /api/feed` is polled. If nothing calls `/api/feed`, the engine accumulates no state.
- `get_events_since(since: 0)` returns all 500 stored events — no pagination.

---

### Core Module: `csv_parser.py`

**What it does:** Parses a CSV file into `list[OHLCVBar]`. Handles both nanosecond and microsecond pandas datetime resolutions.

**Production-ready?** Clean, well-tested (has dedicated test file). No issues.

---

### Core Module: `benchmark.py`

**What it does:** Walk-forward train/test split generator and forecast evaluation metrics (MAE, RMSE, direction accuracy). Utility used by the probability module.

**Production-ready?** Minimal utility module. Only implements a single split (no rolling). Low value in current state.

---

### Core Module: `contracts.py`

**What it does:** REST response models: `BarsResponse`, `MarketsResponse`, `HealthResponse`, `AnalysisError`, `ProbabilityZone`, `ProbabilityResponse`.

**Production-ready?** These are Pydantic models but they are **not actually used as response types in most routes**. Most routes return plain `dict` objects. The models serve documentation purposes only. There is no schema enforcement at the boundary.

---

## 2. Routes Inventory

### `routes/analysis.py` — prefix `/api/analysis`

Endpoints: `GET /structure`, `GET /volume`, `GET /sessions`, `GET /warnings`, `GET /indicators`, `GET /confluence`, `GET /patterns`

**The `_load_bars()` fallback chain (fully documented):**
```
1. sim.active and sim.market == market and sim.timeframe == timeframe
   → return sim.get_bars()           [simulation mode]

2. store.load(market, timeframe)     [ParquetStore — only populated via /api/import]
   → if bars: return bars            [CSV-import fallback, silent stale-data risk]

3. fetch_bars_as_models(market, days, timeframe)
   → DB query via _resolve_symbol()  [live DB path — raises KeyError if no data]
   → if not bars: raise HTTP 404
```

**Critical finding:** Step 2 (ParquetStore) has **no staleness check**. If a Parquet file was imported last week, the live API will serve last week's data without any error or warning. The only way this is avoided in practice is if no Parquet files exist for the given market/timeframe combination.

**Simulation awareness:** All endpoints in this file are simulation-aware via `_load_bars()`. Session classification uses `bars[-1].timestamp` (not wall clock) in sim mode. This is correct.

**Timeframe handling:** Passed through to `fetch_bars_as_models()` which calls `aggregate_bars()`. The aggregation is correct mathematically but does not respect trading session boundaries (see `db.py` findings above).

---

### `routes/bias.py` — prefix `/api/analysis`

Endpoint: `GET /bias`

**What it does:** Orchestrates all BIAS-specific modules: velocity, auction quality, naked POCs, bias state, bias switch level, opening fake, double fake, correction, key levels.

**DB path:** Calls `fetch_bars_as_models()` directly — bypasses `_load_bars()`. This means the bias endpoint is **not simulation-aware** and **not ParquetStore-aware**. It will always hit the DB.

**Critical finding:** `bias.py` uses a different data loading path than `analysis.py`. If you're replaying via `/api/sim/start`, the `/api/analysis/bias` endpoint will still return live DB data, not simulated data. The frontend would show inconsistent state across endpoints during a replay session.

---

### `routes/probability.py` — prefix `/api/analysis`

Endpoint: `GET /probability`

**DB path:** Calls `fetch_bars_as_models()` directly. Not simulation-aware (same problem as `bias.py`).

**Hardcoded logic:** `window = 390 if timeframe == Timeframe.M1 else 78`. These magic numbers (390 = 6.5 hours of 1-min bars = one RTH session, 78 = 6.5 hours of 5-min bars) are correct but undocumented. Any new timeframe breaks this logic silently.

**Minimum data guard:** Requires 780 bars (2 RTH sessions). Returns a soft error if insufficient rather than raising HTTP 404.

---

### `routes/feed.py` — prefix `/api`

Endpoints: `GET /feed`, `GET /feed/events`

**What it does:** The most complex route. Runs ALL analysis modules in sequence, aggregates results into a flat event list, updates the `FeedEventEngine`.

**Critical finding:** Every call to `GET /api/feed` recomputes the entire analysis pipeline from scratch. Multiple modules run `calculate_vwap()`, `detect_swings()`, `detect_volume_spikes()` multiple times within the same request (see sections 1, 3, 5, 7, and `_update_event_engine()`). This is **significant redundant computation** — the same bar data is processed 4-5 times per request.

**Simulation awareness:** `_load_bars()` in this module is sim-aware, but the same issue applies: the BIAS state calculation in section 7 calls `calculate_bias_state()` with hardcoded defaults (`velocity_scale=5`, `auction_quality="moderat"`) instead of computing them from the actual velocity/auction modules. This means the BIAS displayed in the feed is **less accurate** than the BIAS from `/api/analysis/bias`.

**Timestamp fabrication:** Events are assigned synthetic timestamps (`now - 60`, `now - 120`, `now - 300`, etc.). These are wall-clock offsets, not actual event times. In sim mode, `now` comes from `sim.get_sim_timestamp()` which is the last bar's timestamp, so the offsets are applied to simulated time — roughly correct but imprecise.

---

### `routes/zones.py` — prefix `/api/analysis`

Endpoints: `GET /backtest`, `GET /zones`, `GET /signals`

**What it does:** `GET /zones` returns all trading zones. `GET /signals` detects trade signals using zones + bias. `GET /backtest` runs the full backtester.

**Duplicate endpoint:** There are now **two `/api/analysis/signals` route handlers** — one defined in `zones.py` (with bias integration and zone levels) and one in `signals.py` (minimal, without bias). Both are mounted via `app.include_router()`. FastAPI will route to whichever is registered first, making the second one unreachable. This is a silent bug.

**IB Duration hardcoded:** In `zones.py`, Initial Balance is calculated from `current_day[:30]` (first 30 minutes). In `patterns.py`, IB uses `today_bars[:60]` (first 60 minutes). These are **inconsistent IB definitions** across the codebase.

---

### `routes/signals.py` — prefix `/api/signals`

Endpoint: `GET /signals` (prefix `/api/signals`, not `/api/analysis`)

**This route is superseded by the signals endpoint in `zones.py`.** The `zones.py` version is richer (includes bias, zone levels, naked POCs, key levels). The `signals.py` version calls `detect_signals(bars)` with no arguments for zone levels — it will produce lower-quality signals.

---

### `routes/travis.py` — prefix `/api`

Endpoint: `POST /api/travis/ask`

**What it does:** A stub "AI assistant" that generates hardcoded template responses based on current market context. The docstring claims MCP integration (`mcp__travis__ask_about_videos`) but the actual implementation **never calls any MCP tool**. It generates canned text responses based on bias/session labels.

**Production-ready?** No. This is a placeholder that outputs marketing-speak sentences. It provides no educational value beyond what the regular analysis endpoints already provide.

---

### `routes/risk.py` — prefix `/api`

Endpoints: `POST /risk/position-size`, `POST /risk/daily-check`, `GET /config`, `PUT /config`

**What it does:** Position sizing and daily risk checks. Reads/writes `TradingConfig` JSON file.

**Production-ready?** The math is correct. However:
- Only supports ES and NQ for tick values. CL/GC/6E/6J have no tick value handling.
- `realized_pnl` and `trade_count` must be supplied by the caller — the backend has no trade tracking. Each call is stateless; it cannot track consecutive losses or intraday P&L across calls on its own.
- `DisciplineContext.risk_used_pct = 0.0` and `consecutive_losses = 0` are hardcoded in `routes/analysis.py` `/warnings` endpoint and `routes/feed.py` — the discipline system **never has real trading state injected**.

---

## 3. Analysis Modules Inventory

### `analysis/structure.py`
Swing detection and trend classification. Pure computation, no DB. Production-ready. `detect_structure_breaks()` only finds BOS (Break of Structure) — it does not correctly detect CHoCH (Change of Character). The CHoCH branch only checks for bearish CHoCH; bullish CHoCH is missing.

### `analysis/volume.py`
Relative volume and spike detection using numpy. Pure computation, no DB. Production-ready.

### `analysis/vwap.py`
Session-anchored VWAP with 1SD and 2SD bands. Resets on 6-hour gap. Pure computation. Production-ready. **Limitation:** 6-hour gap heuristic for session reset will split multi-day data at wrong boundaries for instruments that trade nearly 24 hours (e.g., futures have a 1-hour maintenance window at 17:00-18:00 ET). A 60-minute gap for NQ futures is normal and will incorrectly reset VWAP mid-session on some days.

### `analysis/indicators.py`
EMA ribbon (9/21/50) and RSI with divergence detection. Pure computation, no DB. Production-ready. RSI divergence detection is simplistic (compares current bar to max/min of a 20-bar window, not actual swing points).

### `analysis/volume_profile.py`
Volume Profile (POC/VAH/VAL), daily volume profiles, session levels. Pure computation.

**Critical finding (hardcoded tick_size):** `build_volume_profile()` defaults `tick_size=0.25, bin_ticks=4`. This is correct for ES (tick=0.25, 1-point bins) and NQ (tick=0.25, 1-point bins). For CL (tick=0.01), GC (tick=0.10), 6E (tick=0.00005), the default values produce garbage volume profiles. The callers never pass instrument-appropriate tick sizes — they always use defaults.

`calculate_session_levels()` hardcodes "overnight = last 30 bars of previous day" — this means 30 minutes of 1min bars, regardless of timeframe. On 5min bars it would be 150 minutes = 2.5 hours. Not a session-aware calculation.

`_calculate_value_area()` in `zones.py` and `build_volume_profile()` in `volume_profile.py` are **two separate implementations** of the same algorithm with slightly different approaches (close-price bucketing vs. TP bucketing). The results will diverge.

### `analysis/sessions.py`
Session classification (ET-based). Uses hardcoded `ET_OFFSET = timedelta(hours=-5)` which is **EST, not ET**. Eastern Time observes DST: UTC-5 in winter, UTC-4 in summer. During summer months (March-November), session boundaries will be off by 1 hour. Pre-market will show as 03:00-08:30 ET instead of 04:00-09:30 ET.

### `analysis/confluence.py`
Combines all indicator signals into a score. Pure computation. Production-ready for what it does. **Note:** `confidence` labels are in German ("STARK", "MITTEL", "SCHWACH") while the code elsewhere uses English ("high", "medium", "low"). This inconsistency in the `confidence` field means downstream consumers (e.g., `feed.py` checking `confluence_result.confidence == "high"`) will never match — the actual values are German strings.

### `analysis/patterns.py`
Pattern detection engine. Pure computation (receives pre-computed indicator data as dicts).

**Hardcoded win rates:** Win rates like `82.0`, `80.0`, `87.5` are hardcoded as Python literals in the annotations. The docstring claims these come from a "365-Tage Backtest" but there is no link to any actual backtest run or any validation data in the codebase. These numbers are static claims, not computed from live data.

**IB Duration is 60 bars here** (first 60 bars = first 60 minutes of 1min data). But `zones.py` uses 30 bars. This inconsistency means the IB Break signal in `patterns.py` and the IB zone in `zones.py` are derived from different time windows.

**ORB is 15 bars** in both `patterns.py` and `zones.py` — consistent.

**Time-of-day logic:** `10 AM Reversal` checks `28 <= bar_idx <= 35` (bars 28-35 of the day). This assumes the session starts at bar 0 = 09:30 ET. This is only true if `today_bars` is derived from RTH open. Since `_get_day_bars()` groups by UTC calendar date (midnight cutoff), this assumption is wrong — overnight bars (e.g., 18:00 ET globex open) will shift all bar_idx values.

### `analysis/bias_state.py`
5-state BIAS classifier. Pure computation.

**Critical design issue:** `bars` parameter is accepted but **never used**. All five input parameters (`trend`, `velocity_scale`, `auction_quality`, `vwap_position`, `ema_alignment`) must be computed externally and passed as strings/ints. The function signature suggests automatic derivation from bars, but the docstring says "currently unused but kept for future automatic component derivation." This means the quality of the bias output depends entirely on what the caller computes — and `routes/feed.py` passes hardcoded defaults (`velocity_scale=5`, `auction_quality="moderat"`) instead of computed values.

### `analysis/velocity.py`
Measures auction speed (|close-open| per bar vs. rolling average). Clean. `scale` is always positive (1-10); the BIAS module expects it to be signed (positive=bullish, negative=bearish). The actual velocity sign (up vs. down) is lost. `calculate_velocity()` returns a list of `VelocityPoint` but `VelocityPoint.scale` is always positive. The caller in `routes/bias.py` passes `latest_velocity.scale` directly — this is always positive, so the BIAS score never gets a negative velocity contribution.

### `analysis/auction.py`
Auction quality measurement. Tick_size hardcoded to 0.25. Same problem as volume_profile for non-NQ/ES instruments. The `quality_label` values are German ("sauber", "moderat", "schlecht") but `BIAS_scores` in `bias_state.py` lookup table has keys in mixed German/English.

### `analysis/naked_poc.py`
Finds untested daily POCs. Clean, well-tested. Production-ready for NQ/ES.

### `analysis/bias_switch.py`
Determines the single "flip level" for the current bias. Priority chain: defended_swing > formation_level > key_zone > asia_extreme. Well-structured.

**Asia session detection bug:** `_is_asia_bar()` uses UTC hours (23:00+ or before 08:30 UTC) to identify Asia session bars. This is approximately correct (18:00-03:30 ET winter time). However, the docstring in the file says "Asia session: 18:00-08:30 ET" — these UTC times do not correspond to that ET window during DST.

### `analysis/key_levels.py`
Identifies price levels tested on 3+ distinct days. Clean algorithm. The `tolerance_pct=0.1` default means 0.1% of price, which for NQ at 20000 = ±20 points per cluster. This is quite wide and will merge distinct levels that are 20-40 points apart. For ES at 5700, 0.1% = ±5.7 points — more reasonable.

### `analysis/correction.py`
Tracks 60% correction depth relative to last impulse. Clean, well-tested.

### `analysis/opening_fake.py`
Detects false breakouts of prior-day extremes in the first 120 bars. Hardcodes `_OPENING_WINDOW = 120` (= 2 hours of 1-min bars). On 5min bars this would be 600 minutes = 10 hours — the entire session would be scanned, which is wrong. No timeframe adjustment.

### `analysis/double_fake.py`
Detects two failed breakout attempts with declining velocity. Clean implementation. `_DEFAULT_TOLERANCE = 5.0` points is appropriate for NQ but large for ES (roughly 1 point in ES terms would be more precise).

### `analysis/signals.py`
Core trade signal detection (7 signal types: ORB, IB, POC rejection, VA edge, naked POC magnet, Sammelzone breakout, Absorption). Well-structured. The `_find_recent_sammelzone()` uses hardcoded `max_range_factor=3.0` and `min_bars_consolidating=20`. No input validation on `atr < 0.25` floor.

### `analysis/zones.py`
Calculates all chart zones (PDH/PDL/PDC, VA, POC, OR, IB, Overnight, Naked POCs, Sammelzonen). Has a **second independent implementation** of `_calculate_value_area()` (using close-price bucketing with 0.25 tick_size) that differs from `volume_profile.build_volume_profile()` (using typical-price with adjustable tick/bin sizes). These two functions will produce different POC/VAH/VAL values for the same bars.

The `avg_vol > 500` threshold in `_detect_sammelzonen()` is hardcoded. This volume threshold makes no sense for instruments with different typical volumes (CL volume = 100-200k/day, NQ RTH = 500-800k/day at peak). It may incorrectly filter or pass Sammelzonen for non-NQ/ES instruments.

### `analysis/probability.py`
Nearest-neighbor similarity search + rule-based probability zones. Pure computation. The `find_similar_situations()` uses L2 norm on a 5-element feature vector — no normalization per feature. Features have very different scales (trend_score ~0-3, volatility ~0-5%, vol_ratio ~0-5, avg_range ~0-1%). The unnormalized distance metric will be dominated by whichever feature has the largest raw variance.

### `analysis/confluence.py`
Already documented above. German confidence strings are a bug.

### `analysis/discipline.py`
Discipline warnings. Works correctly, but `DisciplineContext.risk_used_pct`, `trade_count`, and `consecutive_losses` are always passed as `0.0`, `0`, `0` by every caller. The risk-threshold warnings (`>= 90%`, `>= 70%`) and consecutive-loss warnings will **never trigger** as long as callers pass hardcoded zeros.

### `analysis/risk.py`
Position sizing math. Clean, well-tested.

### `analysis/backtester.py`
Walk-forward backtest engine. Runs signal detection at bar 30, 45, 60, 90 per day, forward-tests against remainder of day. Well-structured.

**Performance concern:** `calculate_zones()` is called once per day with `context_bars + current_day[:30]`. For 30 days of 1-min data (~12,000 context bars at day 30), this creates an O(n*m) computation where n is days and m is bars per evaluation. At 30 days this is acceptable; at 90 days it becomes slow.

**No commission/slippage model:** All P&L is calculated at exact signal prices. No bid-ask spread, no fill slippage. Win rates from this backtester are optimistic.

### `analysis/baselines.py`
Naive and rolling-quantile forecast baselines. Utility module only. `seasonal_naive_forecast` is defined but never called anywhere in the codebase.

### `analysis/model_registry.py`
`ModelRegistry` Protocol-based adapter. Defined but **no models are registered anywhere in the codebase**. `registry = ModelRegistry()` is a module-level singleton that is never populated and never called. Dead code.

---

## 4. Answer to Specific Audit Questions

### A. Instrument / Contract Truth

**Symbol/contract resolution:** The canonical path is `db._resolve_symbol(market: str) -> str`. It calls `_build_symbol_map()` which queries `MAX(timestamp) per symbol` from `ohlcv_1m`, groups by `root = sym[:2]`, and picks the symbol with the most recent data per root.

**Is there hardcoded front-month logic?** Yes, in two places:
1. `models.py` — `FRONT_MONTH` dict with hardcoded values (NQH6, ESZ5, CLJ6, GCJ6, 6EH6, 6JH6). ESZ5 is already expired; the actual front month as of 2026-03 is ESH6 or ESM6. This dict is used only in the fallback path of `GET /api/markets`.
2. `db._build_symbol_map()` — implicit front-month by max timestamp. This is dynamic but stale (never refreshed after startup).

**Is root vs contract vs display-label cleanly separated?** Partially. `MarketRoot` (the enum) represents the root symbol. `ContractInfo` holds the full contract symbol. `MARKET_NAMES` maps root to display name. However:
- The routes accept `market: Market` which is aliased to `MarketRoot` — so users pass "NQ" and the backend resolves to "NQH6". This is clean at the API layer.
- Analysis modules receive `market.value` (a root string like "NQ") and internally resolve via DB. The `bars` objects contain `OHLCVBar` which has no symbol field — once bars are loaded, the symbol is lost. Analysis results don't carry symbol/contract metadata.

### B. Data Path

**Every analysis route ultimately hits DB or falls back as follows:**

```
/api/analysis/* (structure, volume, sessions, etc.)
  → _load_bars() in routes/analysis.py
  → 1. Simulation (if active)
  → 2. ParquetStore (if Parquet file exists — silent stale risk)
  → 3. DB via fetch_bars_as_models()

/api/analysis/bias
  → fetch_bars_as_models() DIRECTLY (no sim, no Parquet)

/api/analysis/probability
  → fetch_bars_as_models() DIRECTLY (no sim, no Parquet)

/api/feed
  → _load_bars() (sim + Parquet + DB, as above)

/api/analysis/zones
/api/analysis/signals
/api/analysis/backtest
  → _load_bars() (sim + Parquet + DB)

/api/signals (signals.py router)
  → fetch_bars_as_models() DIRECTLY (no sim, no Parquet)
```

**Canonical data access pattern?** No — there are three distinct patterns across the codebase. The correct pattern (`_load_bars()` in `routes/analysis.py`) is not used universally.

**`_load_bars()` fallback chain:** Fully documented in Section 2 (routes/analysis.py). Key finding: ParquetStore in position 2 is a silent stale-data trap.

### C. Realtime / WebSocket

**How does the WebSocket work?**
- Endpoint: `WS /ws/bars/{symbol}` in `main.py`.
- On connect: sends the last 10 bars as a snapshot.
- Background poller (every 5 seconds): fetches last 24 hours of bars for all subscribed symbols, compares latest timestamp, broadcasts only the newest bar if the timestamp advanced.
- Message types: `snapshot` (initial), `bar` (new bar), `heartbeat` (keepalive on 30s timeout).

**Is it timeframe-aware?** No. The subscription is `symbol`-only (e.g., "NQH6"). There is no timeframe parameter in the WS URL. The poller broadcasts raw 1-minute bars. Any timeframe aggregation (5min, 15min) must be done client-side. There is no server-side aggregation path in the WS stack.

**Does it aggregate bars correctly?** N/A — it does not aggregate. It streams raw 1-minute bars only.

**Subscription model:** `ConnectionManager` maintains `connections: dict[str, list[WebSocket]]`. Clients subscribe by connecting to `/ws/bars/{symbol}`. There is no way to change subscription without disconnecting. No multi-symbol subscription per connection.

### D. Analysis Modules

**Full list:**
| Module | DB Access | Sim-Aware | Notes |
|--------|-----------|-----------|-------|
| structure.py | No | Via caller | - |
| volume.py | No | Via caller | - |
| vwap.py | No | Via caller | DST bug (UTC-5 hardcoded) |
| indicators.py | No | Via caller | RSI divergence simplistic |
| volume_profile.py | No | Via caller | tick_size hardcoded for NQ/ES |
| sessions.py | No | Via caller | DST bug (UTC-5 hardcoded) |
| confluence.py | No | Via caller | German confidence strings bug |
| patterns.py | No | Via caller | IB=60 vs zones.py IB=30 inconsistency |
| discipline.py | No | Via caller | Always passed zeros in practice |
| risk.py | No | N/A | Only ES/NQ tick values |
| bias_state.py | No | Via caller | bars param unused |
| bias_switch.py | No | Via caller | Asia window DST issue |
| velocity.py | No | Via caller | Scale always positive (unsigned) |
| auction.py | No | Via caller | tick_size 0.25 hardcoded |
| naked_poc.py | No | Via caller | - |
| key_levels.py | No | Via caller | tolerance_pct=0.1 may over-cluster for NQ |
| correction.py | No | Via caller | - |
| opening_fake.py | No | Via caller | Window=120 bars, not timeframe-aware |
| double_fake.py | No | Via caller | tolerance=5.0 not instrument-aware |
| signals.py | No | Via caller | - |
| zones.py | No | Via caller | Duplicate _calculate_value_area impl |
| probability.py | No | Via caller | Feature vector not normalized |
| baselines.py | No | Via caller | seasonal_naive_forecast is dead code |
| model_registry.py | No | N/A | No models registered, dead code |
| backtester.py | No | Via caller | No slippage model |

**Do analysis modules use the same data source as the chart?**
- `/api/analysis/*` routes use `_load_bars()` — consistent with each other.
- `/api/analysis/bias` and `/api/analysis/probability` call `fetch_bars_as_models()` directly — **not consistent** with the chart/other analysis routes in sim mode.

**Replay-aware paths:** Only the routes that use `_load_bars()` (analysis router, feed router, zones router) are replay-aware. Bias and probability routes are not.

### E. API Contracts

**Complete endpoint list:**

| Method | Path | Response Shape |
|--------|------|----------------|
| GET | /health | `{status, version, db, symbols}` |
| GET | /api/markets | `{markets: [MarketInfo]}` |
| GET | /api/db/bars | `{symbol, timeframe, bars_count, bars}` |
| GET | /api/bars | `[OHLCVBar, ...]` |
| POST | /api/import | `{market, timeframe, bars_imported}` |
| POST | /api/sim/start | `{message, active, speed, visible_bars, total_bars, progress_pct}` |
| POST | /api/sim/stop | `{message}` |
| GET | /api/sim/status | `{active, speed, visible_bars, total_bars, progress_pct}` |
| POST | /api/sim/step | `{status, offset}` — **broken, offset unused** |
| GET | /api/replay/dates | `{dates: ["YYYY-MM-DD", ...]}` |
| WS | /ws/bars/{symbol} | `{type, bar/bars, symbol}` stream |
| GET | /api/analysis/structure | `{market, timeframe, trend, swings[], structure_breaks[], bar_count}` |
| GET | /api/analysis/volume | `{market, timeframe, relative_volume[], spikes[], bar_count}` |
| GET | /api/analysis/sessions | `{market, timeframe, current_session, session_stats{}, bar_count}` |
| GET | /api/analysis/warnings | `{market, timeframe, warnings[{message, severity}]}` |
| GET | /api/analysis/indicators | `{vwap[], ema[], rsi[], volume_profile, daily_volume_profiles[], session_levels}` |
| GET | /api/analysis/confluence | `{score, max_score, direction, confidence, signals[], indicators{}}` |
| GET | /api/analysis/patterns | `{annotations[], day_type, day_bias}` |
| GET | /api/analysis/bias | `{bias_state, bias_switch_level, velocity, auction_quality, naked_pocs[], opening_fake, double_fake, correction, key_levels[]}` |
| GET | /api/analysis/probability | `{probability{}, market, timeframe, bar_count, current_price, median_target, iqr_low, iqr_high, reach_probability, counter_move_probability, sample_size, feature_vector[], baselines{}}` |
| GET | /api/feed | `{events[{timestamp, time, type, severity, message, source}]}` |
| GET | /api/feed/events | `{events[], count, since}` |
| GET | /api/analysis/zones | `{zones[{name, type, high, low, color, opacity, start_time, end_time, label, priority}], bar_count, zone_count}` |
| GET | /api/analysis/signals | `{signals[{direction, type, entry, stop, target, rr, confidence, reason, timestamp}], bias, bias_score}` |
| GET | /api/analysis/backtest | `{total_trades, wins, losses, win_rate, avg_r, profit_factor, best_type, worst_type, by_type{}, by_confidence{}, recent_trades[]}` |
| GET | /api/signals | `{signals[], bar_count, market}` — **duplicate, lower quality** |
| POST | /api/travis/ask | `{question, results[], context{}}` |
| POST | /api/risk/position-size | `{contracts, risk_amount, risk_per_contract}` |
| POST | /api/risk/daily-check | `{can_trade, risk_used_percent, warnings[]}` |
| GET | /api/config | TradingConfig fields dict |
| PUT | /api/config | `{status}` |

**Are responses schema-stable?** No. Most routes return plain `dict` without Pydantic response model validation. The `contracts.py` models exist but are not used as `response_model=` parameters. A code change could silently drop or rename a field without any error.

**Is there API versioning?** No. All routes are under `/api/` with no version segment. No deprecation mechanism exists.

---

## 5. Critical Bugs (Priority Order)

1. **`/api/sim/step` is broken** — sets `sim._manual_offset` which `Simulation.get_bars()` never reads. Also references `HTTPException` without importing it in `main.py`. Will raise `NameError` if `not sim.active`.

2. **Duplicate `/api/analysis/signals` route** — defined in both `routes/zones.py` and `routes/signals.py`. FastAPI will silently shadow one. The weaker implementation may be the one that responds.

3. **`_SYMBOL_MAP` never refreshes** — contract roll during uptime = stale data served without error.

4. **ParquetStore silently takes priority over DB** — any stale CSV-imported file will be served instead of live data with no warning.

5. **`/api/analysis/bias` and `/api/analysis/probability` bypass simulation** — replay mode shows inconsistent state across endpoints.

6. **`confluence.confidence` is German, callers expect English** — the feed's `severity = "signal" if confluence_result.confidence == "high"` will never evaluate to True; it always gets the default `"info"` severity.

7. **`sessions.py` has DST bug** — `ET_OFFSET = timedelta(hours=-5)` is EST, not ET. Summer session boundaries are wrong by 1 hour (affected months: March-November).

8. **IB duration inconsistency** — `patterns.py` uses 60 bars (60-min IB), `zones.py` uses 30 bars (30-min IB). The IB Break signal and the IB Zone are derived from different windows.

9. **`velocity.scale` is always positive** — the BIAS module expects signed velocity but receives a 1-10 positive integer. Downside velocity never reduces the BIAS score.

10. **Two `_calculate_value_area` implementations** — `zones._calculate_value_area()` (close-based, tick=0.25) and `volume_profile.build_volume_profile()` (TP-based, configurable tick) produce different POC/VAH/VAL for the same data. Signals and zones will disagree on key levels.

---

## 6. Hardcoded Values Requiring Externalization

| Location | Hardcoded Value | Risk |
|----------|-----------------|------|
| `models.py:FRONT_MONTH` | NQH6, ESZ5, CLJ6... | ESZ5 already expired |
| `db.py:DB_URL` | `postgres://algorivo:...@localhost:5532/algorivo` | Dev credentials in default |
| `sessions.py:ET_OFFSET` | `timedelta(hours=-5)` | DST error Mar-Nov |
| `main.py:allow_origins` | localhost:1420, 5173, 5174 | No prod CORS |
| `volume_profile.py:tick_size` | `0.25` default | Wrong for CL/GC/FX |
| `auction.py:tick_size` | `0.25` hardcoded | Same |
| `zones.py:avg_vol > 500` | Volume threshold | Wrong for CL/GC/FX |
| `double_fake.py:_DEFAULT_TOLERANCE` | `5.0` points | Wrong for ES (too wide) |
| `patterns.py` | Win rates (82.0, 80.0, 87.5...) | Unvalidated static claims |
| `bias_state.py` | Score thresholds (5, 2, -1, -4) | Magic numbers |
| `backtester.py:checkpoints` | `[30, 45, 60, 90]` bars | Assumes 1min, RTH open at bar 0 |
| `config.py:TradingConfig` | account_size=50000, risk_percent=1.0... | Demo defaults |

---

## 7. Test Coverage Assessment

**Test files present:** 22 test files. All tests in `/engine/tests/`. Run via pytest.

**Coverage by module:**
- Well-tested: `csv_parser`, `storage`, `sessions`, `structure`, `volume`, `risk`, `discipline`, `correction`, `double_fake`, `opening_fake`, `key_levels`, `auction`, `bias_state`, `bias_switch`, `velocity`, `naked_poc`, `probability`
- Tested via endpoint: `analysis_api`, `import_api`, `health`
- Partially tested: `ws` (connection manager only, no streaming), `feed_events`
- Not covered: `db.py` (test_db.py exists but uses mocks), `main.py` sim/step bug, Travis route, zones API, signals API, backtester endpoint

**Test infrastructure:** Tests use fixture bars from `tests/fixtures/sample_es_1min.csv` or generate synthetic bars inline. No tests run against a real DB. All DB tests mock `fetch_bars_as_models`. This is appropriate for unit tests but means DB-path integration is untested.

---

## 8. Summary Assessment for Rewrite Decisions

**What is solid and can be kept largely as-is:**
- All pure analysis modules (structure, volume, vwap, indicators, sessions core logic, confluence, patterns, discipline, risk, bias_state, bias_switch, velocity, auction, naked_poc, key_levels, correction, opening_fake, double_fake, signals, zones, backtester)
- `OHLCVBar` model and CSV parser
- `FeedEventEngine` event deduplication design
- Risk management math
- Test suite (high quality for analysis modules)

**What needs fixing before production:**
- DST handling in `sessions.py` and `bias_switch.py` — use `zoneinfo` or `pytz` for proper ET
- Stale `_SYMBOL_MAP` — add TTL refresh (e.g., re-resolve on every request or on schedule)
- Remove ParquetStore from the `_load_bars()` priority chain or add staleness guard
- Fix duplicate `/api/analysis/signals` route registration
- Fix `_manual_offset` in `sim.step` — wire it into `get_bars()` or remove the endpoint
- Fix German confidence strings in `confluence.py` — standardize to English
- Fix IB duration — choose 30 or 60 minutes and use consistently
- Fix `velocity.scale` to be signed for BIAS input
- Remove `routes/signals.py` or promote it as the canonical implementation
- Wire real trading state into `DisciplineContext` (risk_used_pct, trade_count, consecutive_losses)
- Externalize CORS origins to environment config

**What needs redesign:**
- WS timeframe subscription — add timeframe parameter and server-side aggregation
- Symbol map refresh strategy — event-driven (on DB change) rather than process-lifetime cache
- Unified data access pattern — all routes should go through one `_load_bars()` that is sim-aware
- `volume_profile` tick_size — pass instrument spec from a canonical source
- `FRONT_MONTH` dict — delete it entirely; always resolve from DB
- Probability feature vector normalization — normalize each feature before distance computation
- `model_registry.py` — either populate it or delete it
- `travis.py` — either integrate real MCP or delete it

**What is dead code:**
- `models.py:resolve_symbol()` function (only called in `GET /api/markets` fallback)
- `baselines.py:seasonal_naive_forecast()` (defined, never called)
- `analysis/model_registry.py:registry` (never populated, never queried)
- `main.py:store` ParquetStore instance (used only via `/api/import`, not production path)

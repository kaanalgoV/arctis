# Arctis — Testing Guide

## Backend Tests (pytest)

### Run All Tests

```bash
cd ~/arctis/engine
source .venv/bin/activate
python -m pytest tests/ -v
```

### Run with Summary Only

```bash
python -m pytest tests/ -q
```

### Run a Specific Module

```bash
python -m pytest tests/test_analysis.py -v
python -m pytest tests/test_routes.py -v
```

### Expected Results

- **70+ tests pass** without a live database (mock/fixture-based).
- **3-6 tests are skipped or fail** when no live DB is available. This is expected.
  These tests are marked with `@pytest.mark.requires_db` and exercise the full
  SQLAlchemy → TimescaleDB round-trip.

To run the full suite including DB-dependent tests, start the database first:
```bash
docker start algorivo-db
python -m pytest tests/ -v
```

### Coverage Report

```bash
python -m pytest tests/ --cov=src/arctis --cov-report=term-missing
```

Target: >80% line coverage on `analysis/` and `routes/` modules.

## Frontend Type Check

```bash
cd ~/arctis/app
pnpm exec tsc --noEmit
```

Expected output: no errors, no output (silent success).

This is the primary frontend correctness gate. TypeScript strict mode is enabled.

## Frontend Build Check

```bash
cd ~/arctis/app
pnpm run build
```

Expected output: Vite build completes without errors, `dist/` directory created.
This verifies the entire module graph compiles and bundles correctly.

## Manual E2E Verification Checklist

Perform these steps with both backend and frontend running locally.

### Startup

- [ ] Backend starts without errors on port 8001
- [ ] `GET /api/markets` returns a non-empty array
- [ ] Frontend loads without console errors at `http://localhost:5174`

### Topbar

- [ ] Symbol dropdown is populated from `/api/markets` (not hardcoded)
- [ ] Timeframe selector shows 1min, 5min, 15min, 1h options
- [ ] Switching symbol reloads chart data

### Chart

- [ ] Chart renders OHLCV bars for the selected symbol/timeframe
- [ ] VWAP overlay visible as a line on the chart
- [ ] EMA overlay visible
- [ ] Session separators shown at session boundaries
- [ ] New bars appear as they stream via WebSocket (check Network tab)

### Panels

- [ ] SessionPanel shows session high, low, range (not "--" or 0)
- [ ] ConfluencePanel shows a numeric score (not placeholder)
- [ ] PatternsPanel shows detected patterns or "No patterns" message
- [ ] FeedPanel shows timestamped events, updates over time
- [ ] RiskPanel shows risk limit values from `/api/config`

### HUD Strip

- [ ] HudStrip above chart shows live indicator values
- [ ] Values update when new bars arrive

### Settings / Keyboard Shortcuts

- [ ] Settings panel opens (keyboard shortcut or button)
- [ ] Keyboard shortcuts documented in UI are functional

### Error States

- [ ] Stop the backend; frontend shows loading/error state in panels (not crash)
- [ ] Restart backend; panels recover automatically

## CI Integration

There is no automated CI pipeline yet. The following commands are the intended
CI pipeline steps:

```bash
# Backend
cd engine && source .venv/bin/activate
pip install -e ".[dev]"
python -m pytest tests/ -q

# Frontend
cd ../app
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build
```

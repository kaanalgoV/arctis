# Arctis Remaining Tasks — Follow-Up Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining open tasks from the Masterpack 230-Task plan: chart overlays (OR Box, BOS/CHoCH), Vitest setup + component tests, E2E verification, and CI pipeline.

**Architecture:** Extend existing SimpleChart.tsx with missing overlays, install vitest for frontend tests, add GitHub Actions CI. All work builds on the canonical architecture established in Phases 0-8.

**Tech Stack:** React 19 / TypeScript 5.9 / Lightweight Charts 5.1 / Vitest / @testing-library/react / GitHub Actions

---

## File Structure

### Chart Overlays
- Modify: `app/src/components/charts/SimpleChart.tsx` — add OR box, enable BOS/CHoCH
- Modify: `app/src/types/analysis.ts` — add OpeningRange type if missing

### Frontend Tests
- Modify: `app/package.json` — add vitest + testing-library
- Modify: `app/vite.config.ts` — add test config
- Create: `app/src/store/__tests__/market.test.ts`
- Create: `app/src/hooks/__tests__/useMarketData.test.ts`
- Create: `app/src/components/panels/__tests__/SessionPanel.test.tsx`
- Create: `app/src/components/panels/__tests__/ConfluencePanel.test.tsx`
- Create: `app/src/components/panels/__tests__/FeedPanel.test.tsx`

### CI
- Create: `.github/workflows/ci.yml`

---

## Task 1: Install Vitest + Testing Library

**Files:**
- Modify: `app/package.json`
- Modify: `app/vite.config.ts`

- [ ] **Step 1:** Install deps
```bash
cd ~/arctis/app && pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2:** Add test config to vite.config.ts
```typescript
// Add to defineConfig:
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.ts'],
}
```

- [ ] **Step 3:** Create test setup file
```typescript
// app/src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4:** Add test scripts to package.json
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5:** Run `pnpm test` — verify 0 tests, no errors

- [ ] **Step 6:** Commit
```bash
git add -A && git commit -m "feat: install vitest + testing-library for frontend tests"
```

---

## Task 2: Market store unit tests

**Files:**
- Create: `app/src/store/__tests__/market.test.ts`

- [ ] **Step 1:** Write tests
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useMarketStore } from '../market'

describe('useMarketStore', () => {
  beforeEach(() => {
    useMarketStore.setState({
      market: 'NQ', symbol: 'NQH6', timeframe: '1min',
      days: 30, wsStatus: 'disconnected', lastBarTs: null,
    })
  })

  it('setMarket updates market and derives symbol', () => {
    useMarketStore.getState().setMarket('ES')
    const state = useMarketStore.getState()
    expect(state.market).toBe('ES')
    expect(state.symbol).toBe('ESZ5')
  })

  it('setTimeframe updates timeframe', () => {
    useMarketStore.getState().setTimeframe('5min')
    expect(useMarketStore.getState().timeframe).toBe('5min')
  })

  it('setWsStatus updates connection state', () => {
    useMarketStore.getState().setWsStatus('connected')
    expect(useMarketStore.getState().wsStatus).toBe('connected')
  })

  it('setLastBarTs updates timestamp', () => {
    useMarketStore.getState().setLastBarTs(1735827000)
    expect(useMarketStore.getState().lastBarTs).toBe(1735827000)
  })
})
```

- [ ] **Step 2:** Run `pnpm test` — 4 tests pass

- [ ] **Step 3:** Commit
```bash
git add -A && git commit -m "test: market store unit tests"
```

---

## Task 3: SessionPanel rendering tests

**Files:**
- Create: `app/src/components/panels/__tests__/SessionPanel.test.tsx`

- [ ] **Step 1:** Write tests
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionPanel } from '../SessionPanel'

describe('SessionPanel', () => {
  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<SessionPanel loading={true} />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows error message when error prop set', () => {
    render(<SessionPanel error="Connection failed" />)
    expect(screen.getByText(/Connection failed/i)).toBeTruthy()
  })

  it('shows waiting message when no data and not loading', () => {
    render(<SessionPanel />)
    expect(screen.getByText(/waiting/i)).toBeTruthy()
  })

  it('renders session data when provided', () => {
    const data = {
      current_session: 'RTH',
      session_stats: [{ name: 'RTH', status: 'active', bars: 100 }]
    }
    render(<SessionPanel data={data} />)
    // Should not show loading or waiting
    expect(screen.queryByText(/waiting/i)).toBeNull()
  })
})
```

- [ ] **Step 2:** Run `pnpm test` — all pass

- [ ] **Step 3:** Commit
```bash
git add -A && git commit -m "test: SessionPanel rendering tests"
```

---

## Task 4: ConfluencePanel rendering tests

**Files:**
- Create: `app/src/components/panels/__tests__/ConfluencePanel.test.tsx`

- [ ] **Step 1:** Write tests
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfluencePanel } from '../ConfluencePanel'

describe('ConfluencePanel', () => {
  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<ConfluencePanel loading={true} />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows error when error prop set', () => {
    render(<ConfluencePanel error="Fetch failed" />)
    expect(screen.getByText(/Fetch failed/i)).toBeTruthy()
  })

  it('renders score when data provided', () => {
    const data = { score: 7, direction: 'LONG', confidence: 'HIGH', signals: [] }
    render(<ConfluencePanel data={data} />)
    expect(screen.getByText('7')).toBeTruthy()
  })
})
```

- [ ] **Step 2:** Run `pnpm test` — all pass

- [ ] **Step 3:** Commit
```bash
git add -A && git commit -m "test: ConfluencePanel rendering tests"
```

---

## Task 5: FeedPanel rendering tests

**Files:**
- Create: `app/src/components/panels/__tests__/FeedPanel.test.tsx`

- [ ] **Step 1:** Write tests
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeedPanel } from '../FeedPanel'

describe('FeedPanel', () => {
  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<FeedPanel loading={true} />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows no events message when empty', () => {
    render(<FeedPanel events={[]} />)
    expect(screen.getByText(/no events/i)).toBeTruthy()
  })

  it('renders events when provided', () => {
    const events = [
      { id: '1', timestamp: 1735827000, type: 'session_change', severity: 'info', message: 'RTH Open', source: 'system' }
    ]
    render(<FeedPanel events={events} />)
    expect(screen.getByText(/RTH Open/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2:** Run `pnpm test` — all pass

- [ ] **Step 3:** Commit
```bash
git add -A && git commit -m "test: FeedPanel rendering tests"
```

---

## Task 6: Opening Range Box chart overlay

**Files:**
- Modify: `app/src/components/charts/SimpleChart.tsx`

- [ ] **Step 1:** Read SimpleChart.tsx and understand the overlay pattern

- [ ] **Step 2:** Add `openingRange` prop to SimpleChartProps:
```typescript
openingRange?: { high: number; low: number; startTime: number; endTime: number } | null
```

- [ ] **Step 3:** Add OR Box rendering using LWC price lines + custom markers:
```typescript
// After session levels rendering, add:
if (openingRange && showLevels) {
  // OR High line
  candleSeries.createPriceLine({
    price: openingRange.high,
    color: 'rgba(92, 184, 240, 0.5)',
    lineWidth: 1,
    lineStyle: 2, // Dashed
    axisLabelVisible: true,
    title: 'OR High',
  })
  // OR Low line
  candleSeries.createPriceLine({
    price: openingRange.low,
    color: 'rgba(92, 184, 240, 0.5)',
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title: 'OR Low',
  })
}
```

- [ ] **Step 4:** Run `pnpm exec tsc --noEmit` — clean

- [ ] **Step 5:** Commit
```bash
git add -A && git commit -m "feat: Opening Range Box overlay on chart"
```

---

## Task 7: Enable BOS/CHoCH markers

**Files:**
- Modify: `app/src/components/charts/SimpleChart.tsx`

- [ ] **Step 1:** Find the disabled BOS/CHoCH section (around line 510)

- [ ] **Step 2:** Re-enable with a configurable limit:
```typescript
// Add prop: showBosChoch?: boolean (default false)
// When enabled, render structureBreaks as markers:
if (showBosChoch && structureBreaks?.length) {
  const bosMarkers = structureBreaks.slice(-20).map(sb => ({
    time: sb.timestamp as UTCTimestamp,
    position: sb.direction === 'bullish' ? 'belowBar' : 'aboveBar',
    shape: sb.type === 'BOS' ? 'arrowUp' : 'circle',
    color: sb.direction === 'bullish' ? '#22C55E' : '#EF4444',
    text: sb.type,
  }))
  // Merge with existing markers
}
```

- [ ] **Step 3:** Run `pnpm exec tsc --noEmit` — clean

- [ ] **Step 4:** Commit
```bash
git add -A && git commit -m "feat: BOS/CHoCH markers re-enabled with limit"
```

---

## Task 8: GitHub Actions CI pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1:** Create CI workflow
```yaml
name: CI
on:
  push:
    branches: [master, feat/*]
  pull_request:
    branches: [master]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -e ".[dev]"
        working-directory: engine
      - run: python -m pytest tests/ -q --ignore=tests/test_analysis_api.py
        working-directory: engine

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: app/pnpm-lock.yaml
      - run: pnpm install
        working-directory: app
      - run: pnpm exec tsc --noEmit
        working-directory: app
      - run: pnpm run build
        working-directory: app
      - run: pnpm test
        working-directory: app
```

- [ ] **Step 2:** Commit
```bash
git add .github/workflows/ci.yml && git commit -m "ci: GitHub Actions pipeline for backend + frontend"
```

---

## Task 9: Final verification + commit

- [ ] **Step 1:** Run backend tests
```bash
source ~/arctis/engine/.venv/bin/activate && cd ~/arctis/engine && python -m pytest tests/ -q
```

- [ ] **Step 2:** Run frontend tests
```bash
cd ~/arctis/app && pnpm test
```

- [ ] **Step 3:** Run TS check + build
```bash
cd ~/arctis/app && pnpm exec tsc --noEmit && pnpm run build
```

- [ ] **Step 4:** Commit
```bash
git commit --allow-empty -m "feat: remaining tasks complete — tests, overlays, CI"
```

- [ ] **Step 5:** Push
```bash
git push
```

---

## Execution Summary

| Task | Focus | Files |
|------|-------|-------|
| 1 | Vitest setup | package.json, vite.config.ts |
| 2 | Market store tests | store/__tests__/market.test.ts |
| 3 | SessionPanel tests | panels/__tests__/SessionPanel.test.tsx |
| 4 | ConfluencePanel tests | panels/__tests__/ConfluencePanel.test.tsx |
| 5 | FeedPanel tests | panels/__tests__/FeedPanel.test.tsx |
| 6 | Opening Range Box | SimpleChart.tsx |
| 7 | BOS/CHoCH markers | SimpleChart.tsx |
| 8 | GitHub Actions CI | .github/workflows/ci.yml |
| 9 | Final verification | — |

**Total: 9 Tasks, ~30 Steps**

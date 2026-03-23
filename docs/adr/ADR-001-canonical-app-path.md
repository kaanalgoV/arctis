# ADR-001: Canonical App Path

**Date:** 2026-03-23
**Status:** Accepted
**Context:** Audit reveals multiple competing UI paths and chart renderers.

## Decision

### Frontend Entry Point
**App.tsx** is the canonical entry point. It provides:
- 5-page routing (dashboard/chart/patterns/replay/settings)
- 10 parallel analysis API calls
- Sidebar + Topbar + HudStrip + StatusBar layout
- Right panel with 9 sections on chart page

**Dashboard.tsx, HudBar.tsx, LiveFeed.tsx** are dead code — to be removed or isolated.

### Chart Renderer
**Lightweight Charts** (via SimpleChart.tsx) is the canonical renderer because:
- PRD specifies LWC as target stack
- SimpleChart.tsx already uses incremental ref-based updates
- Good performance/bundle characteristics for trading UI
- SciChart has CategoryAxis X-semantics risk (index vs timestamp mixing)

**ArctisCandlestickChart.tsx** (SciChart) — move to `_deprecated/`, do not extend.
**Chart.tsx** (old LWC) — merge useful logic into SimpleChart.tsx, then remove.

## Consequences
- One entry point, one chart renderer, one set of panels
- Dead code removed or clearly isolated
- All new features target App.tsx + SimpleChart.tsx path

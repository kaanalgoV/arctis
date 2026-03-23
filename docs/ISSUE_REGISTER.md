# Arctis Issue Register

Generated: 2026-03-23 | Source: Masterpack Audit + Repo Verification

## Blocker

| ID | Issue | File | Line | Phase |
|----|-------|------|------|-------|
| B1 | sqlalchemy/psycopg2 missing from pyproject.toml — DB routes crash | engine/pyproject.toml | 6-15 | P1 |
| B2 | pd.read_sql() with raw URI string, no Engine object | engine/src/arctis/db.py | 33,75,150 | P1 |
| B3 | No WebSocket bar transport — /ws/bars/{symbol} exists but untested | engine/src/arctis/main.py | — | P2 |
| B4 | useMarketData does single fetch, no WS reconnect | app/src/hooks/useMarketData.ts | — | P2 |
| B5 | /probability route reads from Parquet, all others from DB | engine/src/arctis/routes/probability.py | 16 | P6 |

## Correctness

| ID | Issue | File | Line | Phase |
|----|-------|------|------|-------|
| C1 | CSV timestamp: `// 10**6` produces ms not seconds (ns input) | engine/src/arctis/csv_parser.py | 34 | P1 |
| C2 | 5min aggregation: naive 5-chunk, ignores gaps/sessions/remainder | engine/src/arctis/db.py | 115-137 | P1 |
| C3 | Session classification uses `time.time()` not data context | engine/src/arctis/routes/analysis.py | 35-40 | P1 |
| C4 | Root/Symbol/Contract not separated (NQ vs NQH6 confusion) | engine/src/arctis/models.py | 8-15 | P1 |
| C5 | Timeframe mismatch: FE has 15m/1h, BE only 1min/5min | app/src/components/layout/Topbar.tsx + engine/models.py | 8,11 | P3 |
| C6 | Keyboard TF keys include 15min/30min/1h without BE mapping | app/src/App.tsx | 505 | P3 |
| C7 | confidence type mismatch: number (analysis.ts) vs string (PatternsPanel) | app/src/types/analysis.ts + panels | — | P3 |

## Architecture

| ID | Issue | File | Line | Phase |
|----|-------|------|------|-------|
| A1 | Dead code: Dashboard.tsx, HudBar.tsx, LiveFeed.tsx not mounted | app/src/components/ | — | P3 |
| A2 | 3 chart implementations: SimpleChart (LWC), Chart (LWC), ArctisCandlestick (SciChart) | app/src/components/charts/ | — | P4 |
| A3 | ConfluenceData defined in 3 places (Dashboard.tsx, analysis.ts, ConfluencePanel.tsx) | multiple | — | P3 |
| A4 | Inline fetch in App.tsx instead of using api.ts client | app/src/App.tsx | — | P3 |

## Frontend Integration

| ID | Issue | File | Line | Phase |
|----|-------|------|------|-------|
| F1 | Topbar FALLBACK_MARKETS hardcoded (ES,NQ,CL,GC,6E) | app/src/components/layout/Topbar.tsx | 10 | P3 |
| F2 | Topbar default market=ES, App default=NQ — inconsistent | Topbar.tsx:138, App.tsx:247 | — | P3 |
| F3 | ENGINE_URL hardcoded 127.0.0.1:8001 | app/src/App.tsx | 39 | P3 |
| F4 | SYMBOL_MAP hardcoded front-month contracts (NQH6, ESZ5...) | app/src/App.tsx | 55-63 | P3 |
| F5 | Demo data in all panels (Feed, Confluence, Patterns, Session, Risk) | app/src/components/panels/*.tsx | — | P5 |
| F6 | #5CB8F0 hex hardcoded instead of CSS variable | app/src/App.tsx | 636 | P9 |

## Test Debt

| ID | Issue | File | Line | Phase |
|----|-------|------|------|-------|
| T1 | python-multipart not installed → 3 test collection errors | engine/tests/ | — | P1 |
| T2 | Tests test CSV import path, prod uses DB | engine/tests/test_analysis_api.py | 9-20 | P8 |
| T3 | Only 6 tests pass (test_storage.py), rest fail to collect | engine/tests/ | — | P1 |
| T4 | No frontend test framework (vitest) installed | app/ | — | P8 |
| T5 | TS check passes only due to `as` casts and skipLibCheck | app/tsconfig.app.json | — | P3 |

## Research Debt

| ID | Issue | File | Line | Phase |
|----|-------|------|------|-------|
| R1 | Probability not on live DB contract | engine/src/arctis/routes/probability.py | — | P6 |
| R2 | No baseline/benchmark pipeline | — | — | P6 |
| R3 | No walk-forward validation framework | — | — | P6 |

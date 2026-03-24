# Source Index — lokale Evidenz + Primärquellen

## 1. Lokal gesichtete Artefakte

### Frühere Grundlage
- `arctis_claude_masterpack_2026-03-22.zip`
  - `07_MASTERPROMPT_ARCTIS_CLAUDE.md`
  - `05_WEB_RESEARCH_CHART_PREDICTION_TOOLS.md`
  - übrige Audit-/Blueprint-Dateien

### Neuer Claude-Build
- `arctis_masterpack_build_2026-03-23.zip`

### Besonders relevante lokale Dateien / Pfade
- `engine/src/arctis/main.py`
- `engine/src/arctis/db.py`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/bias.py`
- `engine/src/arctis/routes/feed.py`
- `engine/pyproject.toml`
- `app/src/App.tsx`
- `app/src/store/market.ts`
- `app/src/hooks/useMarketData.ts`
- `app/src/hooks/useAnalysis.ts`
- `app/src/api.ts`
- `app/src/components/charts/SimpleChart.tsx`
- `app/src/components/layout/Topbar.tsx`
- `docs/ARCHITECTURE.md`
- `docs/ACCEPTANCE_MATRIX.md`
- `docs/ISSUE_REGISTER.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md`

## 2. Offizielle Produkt-/Wettbewerbsquellen

### TrendSpider
- offizielle Produktseite / Homepage
- offizielle Seite zu automatischer Chart Pattern Recognition
- offizielle Seiten zu automatisierter technischer Analyse

### TradingView
- offizielle Pine Script User Manual
- offizielle Pine Alerts / Alerts-Dokumentation
- offizielle Release Notes und Alert-Konzepte
- offizielle Seiten zu automatischen Chart-/Candlestick-Patterns

### Bookmap
- offizielle Feature-/Homepage-Seiten
- offizielle API-/Knowledge-Base-Seiten
- DOM Surface / Heatmap-relevante Produktseiten

### StockCharts
- offizielle Scan- und Technical-Scan-Dokumentation
- ChartSchool / Scan Resource Center

### Tickeron
- offizielle Homepage
- offizielle Pattern Search Engine / Scanner / AI Forecasting Seiten

### Quantower
- offizielle Produkt-/Charting-/Feature-Seiten

### Sierra Chart
- offizielle Studien-, Alerts-, Scan- und Spreadsheet-System-Dokumentation

## 3. Offizielle technische Quellen für Architekturentscheidungen

### Lightweight Charts
- offizielle Docs zu `ISeriesApi.update(...)`
- offizielle Realtime-Update-Beispiele
- offizielle Marker-/Series-Dokumentation

### FastAPI
- offizielle WebSocket-Dokumentation
- offizielle Test-/Beispielseiten für WebSockets

### Timescale / TigerData
- offizielle `time_bucket`- und `candlestick_agg`-Dokumentation
- offizielle Financial-tick-/OHLC-Aggregationsbeispiele
- Hyperfunctions-Übersicht

## 4. Offizielle Quellen zu Forecasting-/Prediction-Stacks

### Nixtla
- offizielle TimeGPT-Dokumentation
- Nixtla-Dokumentation zu Forecasting, SHAP/Interpretability, Anomaly Controls

### Amazon Science / Chronos
- offizielle Chronos-/Chronos-2 Dokumente
- offizielles GitHub-Repo / Notebook-Material

### Google
- offizielle TimesFM-/Forecasting-Dokumentation
- BigQuery ML / AI.FORECAST / ML.FORECAST Seiten

### AutoGluon
- offizielle TimeSeries-Dokumentation

### Darts
- offizielle Darts-Dokumentation und User Guides

### sktime
- offizielle sktime-Dokumentation zu Forecasting und probabilistischem Forecasting

### Moirai 2.0
- Primärpaper / arXiv-Material

## 5. Offizielle SaaS-/Operating-Model-Quellen

### Organizations / B2B SaaS
- Clerk Organizations / B2B SaaS / Roles & Permissions

### Billing / Metering
- Stripe Billing usage-based billing
- Stripe meters / trial / billing lifecycle

### Feature Flags / Product Analytics / Session Replay
- PostHog feature flags
- PostHog session replay
- PostHog analytics/docs-Übersicht

### Tracing / Observability
- OpenTelemetry Python
- OpenTelemetry JavaScript
- OpenTelemetry Instrumentation Guides

## 6. Wie die Quellen in diesem Paket verwendet wurden

### Lokale Quellen
Dienten der Realitätsermittlung:
- was im Code existiert,
- was in der Doku behauptet wird,
- wo Widersprüche liegen.

### Externe Primärquellen
Dienten nicht als Selbstzweck, sondern für:
- Wettbewerbsrahmen
- Chart-/Realtime-/Aggregation-Architektur
- Forecasting-Stack-Einordnung
- SaaS-ready Operating Model (Orgs, Billing, Flags, Telemetrie)

## 7. Quellengewichtung

Wenn lokale Codewahrheit und lokale Doku widersprechen, zählt:
1. der Code,
2. dann test-/runtime-nahe Evidenz,
3. dann Doku.

Wenn Produkt- oder Technikempfehlungen abgeleitet werden, zählen vorrangig:
1. offizielle Doku,
2. offizielle Produktseiten,
3. Primärpaper / offizielle Repos.

## 8. Schluss

Dieses Paket basiert absichtlich auf:
- **Codewahrheit lokal**
- plus **offiziellen externen Primärquellen**

damit weder Repo-Selbstbeschreibung noch allgemeines Marktgerede unkritisch übernommen werden.
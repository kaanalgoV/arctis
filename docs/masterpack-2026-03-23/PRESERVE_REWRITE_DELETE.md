# Arctis Phase 0 — Preserve / Rewrite / Delete

Generated: 2026-03-23 | Basis: direkter Code-Audit aller Quelldateien

Decision-Legende:
- **PRESERVE** — funktioniert korrekt, aligned mit SaaS-Produktvision
- **REWRITE** — hat Substanzwert, braucht aber signifikantes Refactoring für kanonische Pfade
- **DELETE** — toter Code, irreführende Dokumentation, doppelter Pfad oder kein Produktwert
- **ENHANCE** — gute Basis, braucht Ergänzungen für Context Engine / SaaS

---

## Backend — engine/src/arctis/

| Path | Decision | Reason |
|------|----------|--------|
| `engine/src/arctis/main.py` | REWRITE | App-Factory-Grundlage gut; aber: `/api/markets` inline statt in `routes/markets.py`, synchrones `create_engine` statt async, `Simulation`-Klasse mit 100 LOC drin, `/api/bars` und `/api/db/bars` als doppelter Bars-Endpunkt, `/api/sim/step` referenziert nicht-existentes `_manual_offset`-Attribut. Aufteilen, aufräumen, async-Pfad durchziehen. |
| `engine/src/arctis/db.py` | REWRITE | Kernmodul mit echten DB-Queries — das ist korrekt und wertvoll. Aber: synchrones `create_engine` (kein `AsyncEngine`), `_SYMBOL_MAP` als In-Process-Cache (kein TTL, kein Invalidierungspfad), `/health` prüft `bars`-Tabelle während `db.py` gegen `ohlcv_1m` arbeitet — Schema-Mismatch. Tabellenname als Konstante oder Config-Wert, async durchziehen. |
| `engine/src/arctis/models.py` | REWRITE | `MarketRoot`/`Market`-Aliasing erzeugt Verwirrung. `FRONT_MONTH`-Dict (statisches Fallback) und `resolve_symbol()` widersprechen dem Ziel dynamischer Kontraktauflösung. `Timeframe`-Enum hat doppelte Alias-Werte (`M1`/`MIN_1`, `M5`/`MIN_5`). Für Phase 1: saubere Domain-Schicht `Root`, `Contract`, `Instrument`, `Timeframe` ohne Legacy-Aliase. |
| `engine/src/arctis/ws.py` | PRESERVE | `ConnectionManager` ist sauber: symbol-basierte Räume, Lock, graceful disconnect, Heartbeat. Kein Rewrite nötig. Einziges Gap: kein timeframe-Parameter auf dem WS-Pfad — das ist eine Route-Änderung, kein ws.py-Problem. |
| `engine/src/arctis/events.py` | ENHANCE | `FeedEventEngine` und `AnalysisSnapshot` sind ein guter Ansatz für kanonische Events. Wird in `routes/feed.py` aber nur als Seiteneffekt aufgerufen. Muss zum primären Event-Bus werden, aus dem alle Feed-Konsumenten lesen. |
| `engine/src/arctis/storage.py` | DELETE | `ParquetStore` ist ein Test-Hilfsmittel das versehentlich in den Produktionspfad gerutscht ist (via `_load_bars()` in `routes/analysis.py`). In Produktion darf kein stiller Parquet-Seitenpfad existieren. Nach Phase 1 (kanonischer DB-Pfad) entfernen. Bis dahin: aus `_load_bars()` Fallback eliminieren. |
| `engine/src/arctis/csv_parser.py` | PRESERVE | Solide Implementierung: korrekter ns/us-Timestamp-Detection, saubere `CSVMapping`-Konfiguration. Wird nur für `/api/import` gebraucht. Kein Kernpfad, aber korrekt gebaut. |
| `engine/src/arctis/config.py` | PRESERVE | `TradingConfig` und `load_config`/`save_config` für Risk-Parameter. Einfach, korrekt, klar abgegrenzt. |
| `engine/src/arctis/contracts.py` | ENHANCE | `ProbabilityResponse`/`ProbabilityZone` sind gute typisierte Contracts. Muss auf alle Analyse-Endpunkte ausgedehnt werden (jetzt gibt es überall rohe Dicts zurück). Basis für den Canonical Contract Layer (Phase 1). |
| `engine/src/arctis/benchmark.py` | DELETE | Datei existiert im `engine/src/arctis/`-Verzeichnis gemäß `ARCHITECTURE.md`, ist aber als Datei nicht vorhanden — Verweis in der Doku ist falsch. `analysis/benchmark.py` existiert. Toter Eintrag. |

---

## Backend — engine/src/arctis/routes/

| Path | Decision | Reason |
|------|----------|--------|
| `engine/src/arctis/routes/analysis.py` | REWRITE | Enthält die meisten Analyse-Endpunkte korrekt. Kritisches Problem: `_load_bars()` hat drei Datenpfade (Simulation → Parquet → DB). Das muss auf zwei reduziert werden (Replay-Context → DB). Parquet-Fallback raus. Alle Endpunkte nutzen sonst korrekt `fetch_bars_as_models()`. |
| `engine/src/arctis/routes/bias.py` | REWRITE | Funktionell reich und korrekt (alle BIAS-Module integriert). Problem: ruft `fetch_bars_as_models()` direkt auf, ignoriert Simulation/Replay-Kontext. Muss `_load_bars()` nutzen (nach dessen Bereinigung). Außerdem: kein HTTP-Error-Handling wenn DB unavailable. |
| `engine/src/arctis/routes/probability.py` | PRESERVE | Seit Audit-Revision korrekt: liest aus DB via `fetch_bars_as_models()`, nicht mehr aus Parquet. Nearest-Neighbour + Rule-Based Zones + Baseline-Vergleich ist eine gute Produktbasis. Kein Rewrite nötig; ENHANCE für Context Engine Integration. |
| `engine/src/arctis/routes/risk.py` | PRESERVE | Enthält `/api/config` (GET + PUT) und `/api/risk/*`. Klar abgegrenzt, korrekt implementiert. Kein Rewrite. |
| `engine/src/arctis/routes/feed.py` | REWRITE | `/api/feed` ist der reichhaltigste Endpunkt — aggregiert alle Module. Problem: massive Recalculation bei jedem Request (VWAP, EMA, Swings, Confluence, Patterns werden 3-4x neu berechnet statt einmal). `FeedEventEngine` wird als Seiteneffekt gepusht, nicht als primärer Pfad. `/api/feed/events` (strukturierte Events) ist die bessere Basis — der Haupt-`/api/feed`-Handler muss daraus lesen. |
| `engine/src/arctis/routes/signals.py` | PRESERVE | Sauber gebaut: direkter DB-Fetch, `detect_signals()`-Aufruf, `max_bars`-Parameter für Replay-Probe. Kein Rewrite. |
| `engine/src/arctis/routes/zones.py` | REWRITE | Dateiname `zones.py` aber enthält `GET /api/analysis/backtest` und `/api/analysis/zones` und `/api/analysis/signals` — Namens-/Routing-Verwirrung. Aufteilen in saubere Router-Dateien (`routes/backtest.py`, `routes/zones.py`). Außerdem: direktes `fetch_bars_as_models()` ohne Replay-Kontext. |
| `engine/src/arctis/routes/travis.py` | ENHANCE | Travis-AI-Endpunkt. Funktionell korrekt soweit vorhanden. Für Phase 1 irrelevant, aber bewahren — wird zur Explanation-Layer-Basis. |
| `routes/markets.py` | DELETE | Existiert nicht. In `ARCHITECTURE.md` als existent dokumentiert — das ist eine Fehldokumentation. Route ist inline in `main.py`. Nach Phase 1 Extraction: dann PRESERVE. |
| `routes/config.py` | DELETE | Existiert nicht. Ebenfalls Fehldokumentation in `ARCHITECTURE.md`. Route ist in `routes/risk.py`. |

---

## Backend — engine/src/arctis/analysis/

| Path | Decision | Reason |
|------|----------|--------|
| `analysis/sessions.py` | PRESERVE | `classify_session()` und `get_session_stats()` sind korrekt und klar. Wird konsistent genutzt. |
| `analysis/confluence.py` | PRESERVE | Multi-Faktor-Scoring mit normierten Weights. Wird konsistent von Analysis- und Feed-Routes genutzt. Gute Basis. |
| `analysis/patterns.py` | ENHANCE | Pattern-Detection mit `detect_patterns()` ist funktionell und wird genutzt. Für Context Engine: Ergebnisse brauchen `explanation_short`, `why_here`, `invalidation`-Felder (Context Object Schema aus Masterpack-05). |
| `analysis/structure.py` | PRESERVE | `detect_swings()`, `classify_trend()`, `detect_structure_breaks()` — solid, konsistent genutzt. |
| `analysis/vwap.py` | PRESERVE | Korrekte VWAP+Deviation-Band-Berechnung. Konsistent genutzt. |
| `analysis/indicators.py` | PRESERVE | EMA-Ribbon und RSI korrekt implementiert. |
| `analysis/volume.py` | PRESERVE | `relative_volume()`, `detect_volume_spikes()` korrekt. |
| `analysis/volume_profile.py` | PRESERVE | POC/VAH/VAL-Berechnung, Session-Level-Ableitung. Korrekt. |
| `analysis/bias_state.py` | PRESERVE | 5-Zustand-Bias-Modell ist ein echter Produktwert. Korrekte Logik. |
| `analysis/bias_switch.py` | PRESERVE | Switch-Level-Berechnung funktional korrekt. |
| `analysis/velocity.py` | PRESERVE | Velocity-Berechnung als BIAS-Eingangskomponente. Korrekt. |
| `analysis/auction.py` | PRESERVE | Auction-Quality-Bewertung. Korrekt. |
| `analysis/naked_poc.py` | PRESERVE | Naked-POC-Erkennung. Korrekt. |
| `analysis/opening_fake.py` | PRESERVE | Opening-Fake-Erkennung. Korrekt. Direkter Produktwert. |
| `analysis/double_fake.py` | PRESERVE | Double-Fake v2 aus Strategy-Entwicklung. Bewährt. |
| `analysis/correction.py` | PRESERVE | Correction-Monitor korrekt. |
| `analysis/key_levels.py` | PRESERVE | Key-Level-Erkennung korrekt. |
| `analysis/zones.py` | PRESERVE | Zone-Berechnung korrekt. |
| `analysis/signals.py` | PRESERVE | Signal-Detection korrekt. |
| `analysis/risk.py` | PRESERVE | Position-Size und Daily-Risk-Check korrekt. |
| `analysis/discipline.py` | PRESERVE | Discipline-Context und Warning-Generation korrekt. |
| `analysis/probability.py` | ENHANCE | Nearest-Neighbour + Rule-Based Zones sind eine gute Baseline. Feature-Vector-Berechnung funktioniert. Für Phase 3 (Forecasting): ML-Adapter über `model_registry.py` anbinden. |
| `analysis/baselines.py` | ENHANCE | `naive_forecast()` und `rolling_quantile_forecast()` als Baseline-Referenz wertvoll. Für Benchmark-Harness ausbauen. |
| `analysis/model_registry.py` | ENHANCE | Protocol-basiertes Adapter-Pattern ist die richtige Architektur. Aktuell kein Modell registriert. Für Phase 3 befüllen. |
| `analysis/backtester.py` | ENHANCE | Backtest-Harness vorhanden. Muss als `/api/analysis/backtest`-Endpunkt korrekt eingebunden sein (derzeit in `routes/zones.py` versteckt). |
| `analysis/benchmark.py` | ENHANCE | Benchmark-Harness für Modellvergleich. Derzeit keine Route. Für Phase 3 als eigenständiger Endpunkt exponieren. |

---

## Frontend — app/src/

### Core

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/main.tsx` | PRESERVE | Standard Vite/React Entry. Kein Problem. |
| `app/src/App.tsx` | REWRITE | Enthält zu viel: inline `buildFeedItems()`-Funktion (sollte Backend-Feed nutzen), statischen Markt-Fallback (`['ES', 'NQ', 'CL', 'GC', '6E']`), `ENGINE_URL`-Hardcoding, Keyboard-Shortcut-Registration ohne vollständiges BE-Mapping. Muss auf API-Client und Zustand-Store delegieren. |
| `app/src/api.ts` | PRESERVE | Typisierter API-Client mit `fetchJSON`-Wrapper. Korrekte Struktur. Problem: `BASE_URL` hardcoded auf `127.0.0.1:8001` — muss auf `import.meta.env.VITE_API_URL` umstellen. |
| `app/src/index.css` | PRESERVE | Tailwind-CSS-Basis. Kein Problem. |
| `app/src/test-setup.ts` | PRESERVE | Vitest-Setup. Behält. |

### Store

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/store/market.ts` | REWRITE | `SYMBOL_MAP`-Hardcoding ist das Kernproblem. `setMarket()` löst Kontrakte statisch auf. Muss auf dynamische Kontraktauflösung vom API-Response umgestellt werden. `symbol`-State soll aus `/api/markets`-Response kommen, nicht aus einer lokalen Map. |
| `app/src/store/settings.ts` | PRESERVE | User-Settings und Keyboard-Prefs. Sauber. |

### Hooks

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/hooks/useMarketData.ts` | REWRITE | WS-Reconnect-Logik mit Exponential Backoff ist gut. Problem: `ENGINE_URL`/`WS_URL` hardcoded, WS-Verbindung nur auf `symbol`-Änderung neu aufgebaut (nicht auf `timeframe`), Snapshot-Messages werden ignoriert. Muss env-Variable nutzen und timeframe in WS-Dependency aufnehmen. |
| `app/src/hooks/useAnalysis.ts` | ENHANCE | `Promise.allSettled()` für alle Analyse-Endpoints ist korrekte Resilience-Strategie. `AnalysisData`-Interface hat `any`-Typen überall — muss auf starke Typen aus `types/analysis.ts` umgestellt werden. |
| `app/src/hooks/useDrawings.ts` | ENHANCE | localStorage-Drawings funktionieren. Für SaaS: `/api/drawings`-Backend-Persistence nötig. Aktuell kein Blocker. |
| `app/src/hooks/useReplay.ts` | ENHANCE | Replay-Hook vorhanden. Replay-Kontext wird nicht in Analysis-Calls durchgereicht (Bias und andere Routen ignorieren Sim-Zustand). Muss synchronisiert werden. |
| `app/src/hooks/useSignals.ts` | PRESERVE | Signals-Hook korrekt gebaut. |
| `app/src/hooks/useKeyboardShortcuts.ts` | REWRITE | Keyboard-Mappings beinhalten Timeframes (15min/30min/1h) die kein vollständiges BE-Mapping haben. Muss mit tatsächlichen BE-Timeframe-Werten synchronisiert werden. |

### Types

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/types/contracts.ts` | ENHANCE | `Bar`-Typ korrekt. Basis für typisierte API-Contracts. Muss auf alle Analyse-Response-Shapes ausgedehnt werden (derzeit `any` in `useAnalysis.ts`). |
| `app/src/types/market.ts` | REWRITE | `OHLCVBar`-Typ korrekt. Problem: kein typisiertes `Market`-/`Contract`-Modell das `MarketRoot` + `ContractInfo` aus BE-Response abbildet. Muss nach Phase 1 ergänzt werden. |
| `app/src/types/analysis.ts` | REWRITE | Unvollständig typisiert. `ConfluenceData` ist mehrfach definiert (auch in `Dashboard.tsx` und `ConfluencePanel.tsx`). Muss kanonischer Single-Source-of-Truth werden. |

### Library

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/lib/scichart-init.ts` | DELETE | SciChart-Initialisierung für `ArctisCandlestickChart.tsx` (deprecated). Wenn ArctisCandlestick gelöscht wird, fällt auch dieses weg. |
| `app/src/lib/chart-tokens.ts` | PRESERVE | Design-Token-Mapping für Chart-Farben. Korrekt. |
| `app/src/lib/motion.ts` | PRESERVE | Animation-Tokens. Korrekt. |
| `app/src/lib/utils.ts` | PRESERVE | Utility-Functions. Korrekt. |
| `app/src/lib/volume-profile.ts` | PRESERVE | Client-seitige Volume-Profile-Berechnung. Wird in `SimpleChart.tsx` für Overlay genutzt. Korrekt. |

### Components — Charts

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/components/charts/SimpleChart.tsx` | REWRITE | Der primäre Chart-Pfad. Kernproblem: `useEffect([bars])` baut den Chart bei jeder Bar-Änderung neu auf statt inkrementell zu updaten. BOS/CHoCH-Marker sind deaktiviert (Kommentar im Code). Drawing-Typen rectangle/trendline/text sind als "P2 skipped" markiert. LWC-Basis ist richtig — nur der Lifecycle muss repariert werden. |
| `app/src/components/charts/VolumeProfileOverlay.tsx` | PRESERVE | POC/VAH/VAL-Overlay korrekt implementiert. |
| `app/src/components/charts/DrawingToolbar.tsx` | ENHANCE | Toolbar-Buttons vorhanden. Drawing-Implementierung in SimpleChart.tsx unvollständig. Toolbar selbst korrekt. |
| `app/src/components/charts/ChartToolbar.tsx` | PRESERVE | Timeframe-Selector und Chart-Controls. Korrekt. |
| `app/src/components/charts/SetupAnnotation.tsx` | PRESERVE | Annotations-Rendering korrekt. |
| `app/src/components/charts/_deprecated/ArctisCandlestickChart.tsx` | DELETE | Veraltete SciChart-Implementierung. LWC (SimpleChart) ist der kanonische Renderer. Kein Wert. |

### Components — Panels

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/components/panels/BiasPanel.tsx` | PRESERVE | Wired zu `useAnalysis` → `/api/analysis/bias`. Korrekt. |
| `app/src/components/panels/ConfluencePanel.tsx` | REWRITE | Enthält eigene `ConfluenceData`-Typdefinition (Duplikat zu `types/analysis.ts`). Muss auf kanonischen Typ umgestellt werden. Sonst korrekt. |
| `app/src/components/panels/FeedPanel.tsx` | REWRITE | Erhält aktuell Feed-Items aus `App.tsx`-`buildFeedItems()` (clientseitig konstruiert). Muss direkt `/api/feed` oder `/api/feed/events` konsumieren. Das ist ein P0-Architekturproblem: der kanonische Backend-Feed wird nicht genutzt. |
| `app/src/components/panels/PatternsPanel.tsx` | REWRITE | Enthält ebenfalls eigene Typen und `confidence`-Behandlung als String statt Number. Typ-Mismatch zu `types/analysis.ts`. Sonst korrekt. |
| `app/src/components/panels/SessionPanel.tsx` | PRESERVE | Korrekt wired zu `useAnalysis`. |
| `app/src/components/panels/SignalsPanel.tsx` | PRESERVE | Korrekt wired. |
| `app/src/components/panels/RiskPanel.tsx` | PRESERVE | Korrekt wired zu `/api/config`. |
| `app/src/components/panels/TravisPanel.tsx` | ENHANCE | Travis-AI-Panel vorhanden. Für Explanation-Layer ausbauen. |
| `app/src/components/panels/index.ts` | PRESERVE | Re-Export-Index. Korrekt. |

### Components — Layout

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/components/layout/AppShell.tsx` | PRESERVE | Layout-Grundstruktur. Korrekt. |
| `app/src/components/layout/Topbar.tsx` | REWRITE | `FALLBACK_MARKETS`-Hardcoding (`ES, NQ, CL, GC, 6E`), Default-Market `ES` (inkonsistent mit Store-Default `NQ`), Breadcrumb `['AlgoView', 'Arctis', activeMarket]` ist der einzige AlgoView-Merge-Punkt im gesamten Codebase. Muss fully dynamic von `/api/markets` werden. |
| `app/src/components/layout/Sidebar.tsx` | PRESERVE | Navigation-Sidebar korrekt. |
| `app/src/components/layout/RightPanel.tsx` | PRESERVE | Panel-Container korrekt. |
| `app/src/components/layout/HudStrip.tsx` | PRESERVE | Live-Indikator-Bar korrekt wired. |
| `app/src/components/layout/StatusBar.tsx` | PRESERVE | Status-Bar korrekt. |
| `app/src/components/layout/index.ts` | PRESERVE | Re-Export-Index. Korrekt. |

### Components — Dead Code

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/components/Chart.tsx` | DELETE | Nicht gemountet laut Audit (`docs/ISSUE_REGISTER.md` A1). Wenn tatsächlich unmounted, ist dies totes Doppel zu `SimpleChart.tsx`. Verifizieren und entfernen. |
| `app/src/components/Dashboard.tsx` | DELETE | Nicht gemountet (A1). Enthält eigene `ConfluenceData`-Definition (A3). Kein aktiver Produktwert. |
| `app/src/components/HudBar.tsx` | DELETE | Nicht gemountet (A1). Doppel zu `HudStrip.tsx`. |
| `app/src/components/LiveFeed.tsx` | DELETE | Nicht gemountet (A1). Doppel zu `FeedPanel.tsx`. |
| `app/src/components/ui/Skeleton.tsx` | PRESERVE | Loading-State-Komponente. Korrekt, nützlich. |

### Pages

| Path | Decision | Reason |
|------|----------|--------|
| `app/src/pages/ChartPage.tsx` | PRESERVE | Primary Chart View. Korrekt. |
| `app/src/pages/DashboardPage.tsx` | REWRITE | Referenziert `Dashboard.tsx` (dead component). Muss auf lebendige Komponenten umgestellt werden. |
| `app/src/pages/PatternsPage.tsx` | PRESERVE | Patterns-Dedicated-View. Korrekt. |

---

## Dokumentation — docs/

| Path | Decision | Reason |
|------|----------|--------|
| `docs/ARCHITECTURE.md` | REWRITE | Enthält mindestens 5 verifizieret Falschaussagen: `routes/markets.py` existiert nicht (Route ist in `main.py`), `routes/config.py` existiert nicht (Route ist in `routes/risk.py`), `Chart.update()` beschreibt nicht den realen Lifecycle (Chart wird rekonstruiert), `/api/analysis/feed` ist nicht die aktuelle Route (es ist `/api/feed`), `SQLAlchemy 2.x async` stimmt nicht (`create_engine` ist synchron). Muss gegen Codewahrheit neu geschrieben werden. |
| `docs/ACCEPTANCE_MATRIX.md` | REWRITE | Mehrere GREEN-Claims sind im Code nicht gedeckt: AC-01 (nicht alle Analysepfade lesen aus DB — Parquet-Seitenpfad existiert), AC-02 (nicht `routes/markets.py`), AC-05 (WS-Hook ignoriert timeframe-Change), AC-09 (FeedPanel liest nicht aus Backend-Feed). Matrix ist als Governance-Quelle derzeit nicht belastbar. |
| `docs/ISSUE_REGISTER.md` | REWRITE | Veraltete historische Bugs (B1: sqlalchemy missing — jetzt in pyproject.toml; T3: nur 6 Tests — jetzt 70+). Gleichzeitig fehlen neue Issues aus dem Reality-Audit. Muss synchronisiert werden — dieses ISSUE_REGISTER.md im Masterpack ist die neue Wahrheit. |
| `docs/KNOWN_LIMITATIONS.md` | PRESERVE | Ehrlich und korrekt. Beschreibt real existierende Limitations ohne Übertreibung. Gute Vorlage für zukünftige Pflege. |
| `docs/SETUP.md` | PRESERVE | Korrekte Installationsanleitung. Verbatim verifizierbar. |
| `docs/TESTING.md` | ENHANCE | Korrekte manuelle Checkliste. Braucht Erweiterung um: Frontend-Vitest-Setup (sobald eingerichtet), CI/CD-Pipeline-Schritte (sobald GitHub Actions existiert). |
| `docs/adr/` | PRESERVE | ADR-Verzeichnis — Architektur-Entscheidungen sind wertvolle Designhistorie. Nicht ändern. |
| `docs/plans/` | PRESERVE | Planungsdokumente als Materialgrundlage behalten. Nicht operative Wahrheit. |
| `docs/superpowers/` | PRESERVE | Skill-Spezifikationen und PRDs als Materialbasis. Kein operativer Code. |
| `docs/masterpack-2026-03-23/02_REALITY_AUDIT_CLAUDE_BUILD.md` | PRESERVE | Das ist die erste ungeschönte Wahrheitsquelle. Canonical Reference. |
| `docs/masterpack-2026-03-23/05_PRODUCT_BLUEPRINT_ARCTIS_ALGOVIEW.md` | PRESERVE | Produktvision. Canonical Reference für alle Bauentscheidungen. |
| `docs/masterpack-2026-03-23/06_SAAS_ARCHITECTURE_AND_OPERATING_MODEL.md` | PRESERVE | SaaS-Architekturmodell. Canonical Reference. |

---

## Zusammenfassung nach Decision

| Decision | Anzahl | Kernbegründung |
|----------|--------|----------------|
| PRESERVE | 38 | Korrekt gebaut, kein Rewrite nötig |
| REWRITE | 18 | Substanzwert vorhanden, aber kritische Fehler oder falsche Architektur |
| DELETE | 9 | Totes oder redundantes Code/Dokumentation |
| ENHANCE | 12 | Gute Basis, braucht Ergänzungen für Context Engine / SaaS |

**Priorisierung für Phase 1 (Truth Reset):**
1. `db.py` → async, Schema-Konstante, TTL auf Symbol-Map
2. `routes/analysis.py` → Parquet-Seitenpfad eliminieren
3. `store/market.ts` → statische SYMBOL_MAP durch API-Response ersetzen
4. `ARCHITECTURE.md` + `ACCEPTANCE_MATRIX.md` → gegen Codewahrheit neu schreiben
5. Dead components (`Dashboard.tsx`, `HudBar.tsx`, `LiveFeed.tsx`, `Chart.tsx`) löschen
6. `FeedPanel.tsx` → direkten `/api/feed`-Consume implementieren

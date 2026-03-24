# Arctis Phase 0 — Issue Register (Truth Reset)

Generated: 2026-03-23 | Basis: direkter Code-Audit aller Quelldateien + Masterpack Reality Audit

Dieses Register ersetzt `docs/ISSUE_REGISTER.md`. Das alte Register enthält veraltete historische
Bugs (B1: sqlalchemy fehlend — jetzt vorhanden; T3: nur 6 Tests — jetzt 70+) und ist nicht mehr
belastbar als Steuerungsgrundlage.

---

## P0 — Must fix for data truth

Diese Issues erzeugen unterschiedliche "Wahrheiten" im selben System. Kein Feature-Build darf
beginnen bevor P0 vollständig geschlossen ist.

---

### P0-01 — Parquet-Seitenpfad in `_load_bars()` macht Datenwahrheit nicht einheitlich

**Datei:** `engine/src/arctis/routes/analysis.py`, Zeilen 27–48

**Code:**
```python
def _load_bars(market: Market, timeframe: Timeframe, days: int = 30):
    """Load bars from simulation engine, ParquetStore, or TimescaleDB (in priority order)."""
    sim = _get_sim()
    if sim.active and sim.market == market and sim.timeframe == timeframe:
        return sim.get_bars()
    # Try ParquetStore first (populated via /api/import, used in tests)
    try:
        from arctis.main import store
        bars = store.load(market, timeframe)
        if bars:
            return bars
    ...
    bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
```

**Impact:** Wenn Parquet-Dateien vorhanden sind (z.B. nach `/api/import`-Upload), lesen alle
`/api/analysis/*`-Endpunkte aus Parquet, nicht aus der DB. Chart und Analysis zeigen
unterschiedliche Daten. Der Acceptance-Matrix-Claim AC-01 "all analysis routes read from DB"
ist damit falsch.

**Fix:** Parquet-Fallback aus `_load_bars()` entfernen. `ParquetStore` nur in Tests und
expliziten Import-Flows nutzen, nie als stiller Produktionspfad.

---

### P0-02 — Schema-Mismatch: `/health` prüft `bars`-Tabelle, `db.py` arbeitet gegen `ohlcv_1m`

**Datei:** `engine/src/arctis/main.py` Zeile 152, `engine/src/arctis/db.py` Zeile 86

**Code (health):**
```python
result = conn.execute(text("SELECT count(DISTINCT symbol) FROM bars"))
```

**Code (db.py fetch_bars):**
```python
def fetch_bars(symbol: str, days: int = 30, table: str = "ohlcv_1m") -> list[dict]:
    query = f"SELECT ... FROM {table} WHERE symbol = %s ..."
```

**Code (db.py _build_symbol_map):**
```python
query = """SELECT symbol, MAX(timestamp) as latest FROM ohlcv_1m ..."""
```

**Impact:** Health-Endpoint meldet "ok" wenn Tabelle `bars` existiert. Alle anderen Queries
laufen gegen `ohlcv_1m`. Falls nur eine Tabelle befüllt ist, liefert `/health` irreführende
Statusmeldung. Außerdem: `table: str = "ohlcv_1m"` als Default-Parameter in `fetch_bars()`
ist ein versteckter Konfigurationsweg.

**Fix:** Kanonischen Tabellennamen als Modul-Konstante definieren. Health-Check gegen dieselbe
Tabelle. Idealerweise beides auf denselben Schema-Stand bringen oder explizit dokumentieren,
welche Tabelle produktiv ist.

---

### P0-03 — WebSocket liefert rohe 1-Minuten-Bars unabhängig vom gewählten Timeframe

**Datei:** `engine/src/arctis/main.py` Zeilen 364–381, `app/src/hooks/useMarketData.ts` Zeile 43

**Code (Backend):**
```python
bars = fetch_bars(symbol=symbol, days=1)  # always 1min raw bars
await manager.broadcast(symbol, {"type": "bar", "bar": latest, "symbol": symbol})
```

**Code (Frontend):**
```python
const ws = new WebSocket(`${WS_URL}/ws/bars/${symbol}`)
# WS-Verbindung hat keinen timeframe-Parameter
```

**Impact:** Wenn der Nutzer auf 5min/15min/30min/1h wechselt, appended der WS-Handler
1-Minuten-Bars an die aggregierten Bars. Das Chart zeigt falsche Candles. Der Live-Pfad
ist bei aggregierten Timeframes fachlich nicht korrekt.

**Fix:** Entweder (a) WS-Endpunkt um `timeframe`-Parameter erweitern und serverseitig
aggregieren, oder (b) Frontend empfängt immer 1min-Bars und aggregiert clientseitig
sauber in den konfigurierten Timeframe. Option (a) ist sauberer für das Produktmodell.

---

### P0-04 — WS-Hook reconnectet nicht bei Timeframe-Wechsel

**Datei:** `app/src/hooks/useMarketData.ts`, Zeile 100

**Code:**
```ts
}, [symbol]) // Only reconnect on symbol change
```

**Impact:** Wenn der Nutzer den Timeframe wechselt, laden `loadBars()` neue Bars (korrekt),
aber der bestehende WS bleibt auf dem alten Symbol-Room. Neue WS-Bars kommen im 1min-Format
und werden direkt in die 5min/15min-Bar-State gemischt — Chart-Corruption.

**Fix:** `symbol` + `timeframe` als WS-Reconnect-Dependencies. Kurzfristig: WS bei Timeframe-
Wechsel schließen und neu öffnen (auch wenn WS weiterhin nur 1min liefert, dann ist es
zumindest konsistent und nicht gemischt).

---

### P0-05 — `bias.py`-Route ignoriert Replay/Simulation-Kontext

**Datei:** `engine/src/arctis/routes/bias.py`, Zeile 16

**Code:**
```python
bars = fetch_bars_as_models(market=market.value, days=30, timeframe=timeframe.value)
```

**Impact:** Wenn eine Replay-Simulation läuft, zeigen alle anderen Analyse-Panels
(die `_load_bars()` mit Sim-Check nutzen) simulierte Daten. Das Bias-Panel zeigt Live-DB-Daten.
Damit existieren zwei Zeitwahrheiten gleichzeitig im selben UI.

**Fix:** `routes/bias.py` auf `_load_bars()` umstellen (nach dessen P0-01-Bereinigung).

---

### P0-06 — `App.tsx` baut Feed clientseitig statt Backend-Feed zu konsumieren

**Datei:** `app/src/App.tsx`, Zeile 121 (`buildFeedItems`-Funktion)

**Code:**
```ts
function buildFeedItems(...) { /* constructs feed from analysis responses */ }
const feedItems = buildFeedItems(analysisData, ...)
<FeedPanel items={feedItems} />
```

**Impact:** Der Backend-`/api/feed`-Endpunkt (mit `FeedEventEngine` und strukturierten Events)
ist der kanonische Event-Pfad. Das Frontend ignoriert ihn und konstruiert Events clientseitig
aus aggregierten Analyse-Responses. Das erzeugt eine zweite Event-Wahrheit. `FeedPanel` und
Backend-Feed zeigen unterschiedliche Events.

**Fix:** `FeedPanel.tsx` direkt auf `/api/feed` oder `/api/feed/events` umstellen.
`buildFeedItems()` aus `App.tsx` entfernen.

---

## P1 — Must fix for product correctness

Diese Issues machen das Produkt fachlich unzuverlässig oder falsch dokumentiert,
blockieren aber nicht den Datenpfad direkt.

---

### P1-01 — `ARCHITECTURE.md` dokumentiert Dateien die nicht existieren

**Datei:** `docs/ARCHITECTURE.md`, Zeilen 48–50, 107, 114, 124

**Konkrete Falschaussagen (verifiziert):**
1. "`routes/markets.py`" — existiert nicht. Route ist inline in `main.py`.
2. "`routes/config.py`" — existiert nicht. Route ist in `routes/risk.py`.
3. "`streams new bars → Chart.update() (incremental)`" — Chart wird bei `[bars]`-Änderung neu gebaut, nicht inkrementell updated.
4. "`GET /api/analysis/feed → FeedPanel`" — Route heißt `/api/feed`, nicht `/api/analysis/feed`.
5. "`SQLAlchemy 2.x async`" — `db.py` nutzt synchrones `create_engine`.

**Impact:** Wenn ein Agent oder Entwickler die Architektur-Doku als Wahrheit liest und danach
entwickelt, baut er auf falscher Grundlage. Dieses Dokument hat bereits zu mindestens zwei
Build-Runden mit falschen Annahmen geführt.

**Fix:** `ARCHITECTURE.md` komplett gegen Codewahrheit neu schreiben. Kein GREEN ohne
Datei-/Runtime-Evidenz.

---

### P1-02 — `ACCEPTANCE_MATRIX.md` behauptet GREEN für unerfüllte Kriterien

**Datei:** `docs/ACCEPTANCE_MATRIX.md`

**Konkrete falsche GREEN-Claims:**
- AC-01: "All /api/analysis/* routes read from DB" — Parquet-Fallback widerspricht dem (P0-01).
- AC-02: "routes/markets.py queries MarketInfo" — Datei existiert nicht (P1-01).
- AC-05: "useMarketData hook loads REST + WS data" — WS reconnectet nicht bei Timeframe-Wechsel (P0-04).
- AC-09: "FeedPanel shows real feed events" — FeedPanel liest aus clientseitig gebautem Feed, nicht aus Backend (P0-06).

**Impact:** Jeder der diese Matrix als Delivery-Gate nutzt, erhält ein falsches Grünsignal.
Das Dokument ist als Governance-Quelle derzeit nicht belastbar.

**Fix:** Matrix gegen Code-Wahrheit aktualisieren. YELLOW/RED für alle Claims die nicht verifiziert sind.

---

### P1-03 — `store/market.ts` löst Kontrakte statisch auf (SYMBOL_MAP)

**Datei:** `app/src/store/market.ts`, Zeilen 5–12

**Code:**
```ts
const SYMBOL_MAP: Record<string, string> = {
  NQ: 'NQH6', ES: 'ESZ5', CL: 'CLJ6', GC: 'GCJ6', '6E': '6EH6', '6J': '6JH6',
}
setMarket: (market) => set({ market, symbol: SYMBOL_MAP[market] || `${market}H6` }),
```

**Impact:** Bei Kontraktwechsel (Rollover) muss der Code manuell geändert werden. Backend
liefert über `/api/markets` den aktuellen Front-Month-Kontrakt aus der DB. Frontend ignoriert
diese Information und nutzt eine hartcodierte Fallback-Map.

**Fix:** `setMarket()` soll den Symbol-Wert aus dem `/api/markets`-Response lesen.
SYMBOL_MAP entfernen. `marketStore` um `contracts`-State erweitern der aus dem API-Response befüllt wird.

---

### P1-04 — Topbar hat statischen Market-Fallback und inkonsistenten Default

**Datei:** `app/src/components/layout/Topbar.tsx`

**Code:**
```ts
const FALLBACK_MARKETS = ['ES', 'NQ', 'CL', 'GC', '6E']
// Default market in Topbar: ES
// Default market in store/market.ts: NQ
```

**Impact:** Bei API-Fehler zeigt Topbar ES als erstes, Store hat NQ als Default.
Chart und Topbar starten im inkonsistenten Zustand.

**Fix:** Einziger Default-Wert im Store. Topbar immer vom Store lesen.
Fallback-Liste aus Store ableiten, nicht hardcoded.

---

### P1-05 — `api.ts` und `useMarketData.ts` haben hardcodierte localhost-URLs

**Dateien:** `app/src/api.ts` Zeile 3, `app/src/hooks/useMarketData.ts` Zeilen 5–6

**Code:**
```ts
const BASE_URL = 'http://127.0.0.1:8001'
const ENGINE_URL = 'http://127.0.0.1:8001'
const WS_URL = 'ws://127.0.0.1:8001'
```

**Impact:** Nicht staging-fähig, nicht SaaS-fähig, nicht CI-fähig.
Zwei verschiedene Stellen mit denselben hardcodierten URLs.

**Fix:** Beide auf `import.meta.env.VITE_API_URL` und `import.meta.env.VITE_WS_URL` umstellen.
`.env.development` mit lokalen Defaults. Einzelne Wahrheitsquelle.

---

### P1-06 — `models.py` hat doppelte Timeframe-Enum-Werte und Legacy-Market-Alias

**Datei:** `engine/src/arctis/models.py`, Zeilen 23–32

**Code:**
```python
class Timeframe(str, Enum):
    M1 = "1min"
    M5 = "5min"
    MIN_1 = "1min"  # Duplicate value
    MIN_5 = "5min"  # Duplicate value
    MIN_15 = "15min"
    ...
Market = MarketRoot  # Alias
```

**Impact:** Enum-Duplikate erzeugen unerwartet `seen_timeframes: list[Timeframe] = list(dict.fromkeys(Timeframe))`-Workaround in `main.py` Zeile 170 um Duplikate zu entfernen. Kein harter Bug, aber Codequalitätsproblem und Quelle zukünftiger Verwirrung.

**Fix:** Legacy-Aliases (`M1`, `M5`, `MIN_1`, `MIN_5`) entfernen. Kanonische Werte: `M1`, `M5`, `M15`, `M30`, `H1`. `Market = MarketRoot`-Alias ebenfalls entfernen wenn alle Caller migriert.

---

### P1-07 — Synchrones `create_engine` statt async in `db.py`

**Datei:** `engine/src/arctis/db.py`, Zeile 23

**Code:**
```python
_engine = create_engine(DB_URL, pool_size=5, max_overflow=10)
```

**Impact:** FastAPI ist async. Synchrone SQLAlchemy-Queries blockieren den Event-Loop unter Last.
Bei mehreren gleichzeitigen WebSocket-Clients und Polling-Requests kann das zu Latenz-Spitzen führen.
`ARCHITECTURE.md` beschreibt SQLAlchemy 2.x async als implementiert — ist es nicht.

**Fix:** Auf `create_async_engine` und `AsyncSession` migrieren. `pd.read_sql()` durch
`conn.execute(text(...))` + manuelle DataFrame-Konstruktion ersetzen (asyncio-kompatibel).

---

### P1-08 — `_SYMBOL_MAP` in `db.py` hat keinen TTL / keine Invalidierung

**Datei:** `engine/src/arctis/db.py`, Zeilen 29–58

**Code:**
```python
_SYMBOL_MAP: dict[str, str] | None = None

def _build_symbol_map() -> dict[str, str]:
    global _SYMBOL_MAP
    if _SYMBOL_MAP is not None:
        return _SYMBOL_MAP
    # ... query DB once, never refresh
```

**Impact:** Bei Kontraktwechsel (z.B. von NQH6 → NQM6) muss der Server neugestartet werden
damit der neue Front-Month aufgelöst wird. Kein Runtime-Invalidierungsmechanismus.

**Fix:** TTL von z.B. 1 Stunde auf `_SYMBOL_MAP`. Alternativ: Cache per Request-Scoped
Context oder expliziter Admin-Endpoint `/api/admin/refresh-contracts`.

---

## P2 — Required for SaaS

Diese Issues müssen vor einem SaaS-Go-Live gelöst sein.

---

### P2-01 — Keine Authentifizierung oder Autorisierung

**Datei:** `docs/KNOWN_LIMITATIONS.md`, Punkt 2 (selbst dokumentiert)

**Impact:** Alle API-Endpunkte sind unauthentifiziert. Jeder der Port 8001 erreichen kann,
kann alle Marktdaten lesen, Konfiguration ändern, Simulation starten.

**Fix:** JWT-basierte Auth (Phase 2 SaaS). Für Solo-SaaS-Start: API-Key-Header als
Minimalschutz. Für Team-/Org-Plan: OAuth 2.0 / OIDC.

---

### P2-02 — Keine Mandantenfähigkeit (Multi-Tenancy)

**Impact:** Alle Daten, Konfigurationen und Watchlists sind global. Kein Nutzer-/Org-Modell.

**Fix:** `tenant_id`-Spalte in alle relevanten DB-Tabellen. Row-Level-Security in PostgreSQL.
Org/User/Role-Modell als eigene Service-Schicht (vgl. `06_SAAS_ARCHITECTURE_AND_OPERATING_MODEL.md`).

---

### P2-03 — Kein Alerting-System

**Impact:** Events werden erkannt (Feed, FeedEventEngine) aber es gibt keinen Push-Mechanismus
für Alerts. Nutzer muss manuell in die Applikation schauen.

**Fix:** Alert-Modell mit Condition + Destination (Webhook, Email, In-App-Push).
Persistente Alert-Konfiguration in DB. Background-Worker der Conditions evaluiert.

---

### P2-04 — Drawing-Persistenz nur localStorage

**Datei:** `docs/KNOWN_LIMITATIONS.md`, Punkt 5 (selbst dokumentiert)

**Impact:** Zeichnungen gehen bei Browser-Wechsel, localStorage-Clear und Geräte-Wechsel verloren.
In einem SaaS-Kontext ist das nicht akzeptabel.

**Fix:** `/api/drawings`-Endpunkt mit DB-Persistenz (CRUD). Schema: `drawing_id`, `user_id`,
`instrument`, `timeframe`, `type`, `coordinates`, `label`, `created_at`.

---

### P2-05 — Kein Journal / Replay-Review-Workflow

**Impact:** Replay-Mechanik vorhanden (`Simulation`-Klasse, `useReplay`-Hook), aber kein
Journaling: keine Möglichkeit Entscheidungspunkte zu markieren, Notizen zu hinterlegen,
Review-Metriken zu generieren. Kern-JTBD-4 des Produktmodells (05_PRODUCT_BLUEPRINT) ist nicht
erfüllt.

**Fix:** Journal-Tabelle: `entry_id`, `user_id`, `session_date`, `instrument`, `decision_type`,
`notes`, `replay_timestamp`. Review-Report-Endpoint.

---

### P2-06 — Kein CI/CD Pipeline

**Datei:** `docs/KNOWN_LIMITATIONS.md`, Punkt 9 (selbst dokumentiert)

**Impact:** Keine automatischen Tests bei Push/PR. Qualität hängt von manueller Ausführung ab.

**Fix:** GitHub Actions Workflow: `pytest` (Backend, ohne DB), `tsc --noEmit`, `pnpm run build`.
Integration-Tests-Stage mit DB als Service-Container.

---

## P3 — Nice to have / Polish

---

### P3-01 — Fehlende Frontend-Unit-Tests (Vitest)

**Datei:** `docs/KNOWN_LIMITATIONS.md`, Punkt 4 (selbst dokumentiert)

**Impact:** Komponenten-Regressionen werden nur durch manuellen E2E-Check entdeckt.

**Fix:** Vitest + React Testing Library installieren. Minimale Tests für Panels und Hooks.

---

### P3-02 — `useAnalysis.ts` nutzt `any`-Typen für alle Analyse-Responses

**Datei:** `app/src/hooks/useAnalysis.ts`, Zeilen 6–16

**Impact:** TypeScript-Strict-Mode nützt nichts wenn `any` die Typen beschreibt.
Fehler in Panel-Komponenten werden erst zur Laufzeit sichtbar.

**Fix:** Typen für alle Analyse-Response-Shapes in `types/analysis.ts` definieren.
`AnalysisData`-Interface auf starke Typen umstellen.

---

### P3-03 — Confidence-Typ-Mismatch: `number` vs `string`

**Dateien:** `app/src/types/analysis.ts`, `app/src/components/panels/PatternsPanel.tsx`

**Impact:** `confidence` ist in `types/analysis.ts` als `number` typisiert, in
`PatternsPanel.tsx` als String behandelt. TypeScript sollte das fangen — fängt es aber
nicht wenn `skipLibCheck` oder `as`-Casts vorhanden sind.

**Fix:** Einheitliche `confidence`-Semantik: immer `number` (0.0–1.0). Panels formatieren
bei Bedarf als Prozent.

---

### P3-04 — `ConfluenceData` dreifach definiert

**Dateien:** `app/src/components/Dashboard.tsx`, `app/src/types/analysis.ts`,
`app/src/components/panels/ConfluencePanel.tsx`

**Impact:** Drei Definitionen derselben Type-Shape. Divergenz führt zu subtilen Bugs.

**Fix:** `ConfluenceData` nur in `types/analysis.ts`. Alle anderen Definitionen entfernen.

---

### P3-05 — `routes/zones.py` enthält falsch benannte Endpunkte

**Datei:** `engine/src/arctis/routes/zones.py`

**Impact:** `zones.py` enthält `GET /api/analysis/backtest`, `/api/analysis/zones` und
`/api/analysis/signals`. Namenskonvention ist inkonsistent. Signals-Route auch in
`routes/signals.py` mit `/api/signals`-Prefix. Mögliche Routing-Duplikate.

**Fix:** Aufteilen: `routes/backtest.py`, `routes/zones.py` (nur Zones), Signals-Route in
`routes/signals.py` konsolidieren.

---

### P3-06 — BOS/CHoCH-Marker im Chart deaktiviert

**Datei:** `app/src/components/charts/SimpleChart.tsx`, Zeile ~510

**Code:**
```ts
// BOS/CHoCH markers disabled — only setup signals shown on chart
```

**Impact:** Struktur-Brüche (Break of Structure, Change of Character) sind laut
`05_PRODUCT_BLUEPRINT` ein Kern-Feature des Auto-Marking-Pfeilers. Aktuell nicht sichtbar im Chart.

**Fix:** BOS/CHoCH-Marker aus `/api/analysis/structure` (`structure_breaks`-Array) rendern.
LWC-Marker-API (`createSeriesMarkers`) ist bereits importiert in `SimpleChart.tsx`.

---

### P3-07 — Drawing-Typen rectangle/trendline/text nicht implementiert

**Datei:** `app/src/components/charts/SimpleChart.tsx`, Zeile ~671

**Code:**
```ts
// rectangle / trendline / text are P2 — skipped for now
```

**Impact:** Drawing-Toolbar zeigt Buttons die keine Funktion haben. Nutzer-Erwartung nicht erfüllt.

**Fix:** LWC-Plugin für Drawings integrieren oder eigene Canvas-Overlay-Lösung.

---

### P3-08 — `models.py` enthält statische FRONT_MONTH-Map als "wird später durch DB ersetzt"

**Datei:** `engine/src/arctis/models.py`, Zeilen 57–64

**Code:**
```python
# Front-month mapping (static fallback — will be replaced by DB query later)
FRONT_MONTH: dict[MarketRoot, str] = { MarketRoot.NQ: "NQH6", ... }
```

**Impact:** Kommentar sagt "will be replaced" — ist aber weiterhin aktiv und wird in
`resolve_symbol()` genutzt. Diese Funktion wird in `main.py` nicht direkt genutzt
(stattdessen `db._resolve_symbol()` mit DB-Lookup), aber die Existenz der Map ist
verwirrend und riskiert versehentliche Nutzung.

**Fix:** `FRONT_MONTH`-Konstante und `resolve_symbol()` entfernen wenn `db._resolve_symbol()`
der kanonische Pfad ist.

---

## Veraltete Issues aus `docs/ISSUE_REGISTER.md` (jetzt obsolet)

Die folgenden Issues aus dem alten Register sind durch den aktuellen Build adressiert und
sollten nicht mehr aktiv verfolgt werden:

| Altes Issue | Status | Begründung |
|------------|--------|-----------|
| B1: sqlalchemy/psycopg2 missing | CLOSED | Beide in `pyproject.toml` vorhanden (Zeilen 15–16). |
| B2: pd.read_sql() mit raw URI | CLOSED | `db.py` nutzt `get_engine()` korrekt, kein raw URI. |
| C1: CSV timestamp ns-Bug | CLOSED | `csv_parser.py` erkennt ns vs. us korrekt (Zeilen 36–41). |
| C2: 5min aggregation naive | CLOSED | `aggregate_bars()` nutzt `pd.resample()` korrekt (Zeilen 165–172). |
| C3: Session classification wall-clock | PARTIALLY | Analysis-Routen nutzen jetzt `ref_ts = bars[-1].timestamp`. Feed-Route nutzt noch `now` für Session-Events. |
| T1: python-multipart fehlt | CLOSED | In `pyproject.toml` vorhanden. |
| T3: nur 6 Tests | CLOSED | Jetzt 70+ Tests (Mock-basiert). |
| F5: Demo-Daten in Panels | CLOSED | Panels lesen aus Hooks und APIs. |
| R1: Probability nicht auf live DB | CLOSED | `routes/probability.py` nutzt `fetch_bars_as_models()` direkt. |

---

## Issue-Statistik

| Priorität | Anzahl | Kernthema |
|-----------|--------|-----------|
| P0 | 6 | Datenwahrheit und Rendering-Korrektheit |
| P1 | 8 | Produktkorrektheit und Dokumentationsehrlichkeit |
| P2 | 6 | SaaS-Readiness |
| P3 | 8 | Codequalität und fehlende Features |
| **Total** | **28** | |

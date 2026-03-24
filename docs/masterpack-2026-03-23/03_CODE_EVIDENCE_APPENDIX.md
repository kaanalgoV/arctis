# Code Evidence Appendix — harte Beweise aus dem aktuellen Build

Dieses Dokument sammelt die wichtigsten Indizien aus dem Build.  
Es ist bewusst pragmatisch: nicht jede Datei, sondern die Stellen, die den Steuerungsfehler erklären.

---

## 1. Analysepfade sind nicht vollständig DB-only

### Datei
`engine/src/arctis/routes/analysis.py`

### Beweis
```python
27 def _load_bars(market: Market, timeframe: Timeframe, days: int = 30):
28     """Load bars from simulation engine, ParquetStore, or TimescaleDB (in priority order)."""
29     sim = _get_sim()
30     if sim.active and sim.market == market and sim.timeframe == timeframe:
31         return sim.get_bars()
33     # Try ParquetStore first (populated via /api/import, used in tests)
34     try:
35         from arctis.main import store
36         bars = store.load(market, timeframe)
37         if bars:
38             return bars
42     bars = fetch_bars_as_models(market=market.value, days=days, timeframe=timeframe.value)
```

### Beobachtung
Der Analysepfad geht **nicht** direkt und exklusiv auf die DB.  
Er nimmt zuerst Replay/Simulation, dann `ParquetStore`, dann DB.

### Konsequenz
Die Aussage „all analysis routes read from DB“ ist im Code so nicht wahr.

---

## 2. Bias-Route respektiert den Replay-/Sim-Kontext nicht

### Datei
`engine/src/arctis/routes/bias.py`

### Beweis
```python
10 @router.get("/bias")
11 async def get_daily_bias(
12     market: Market = Query(...),
13     timeframe: Timeframe = Query(...),
14 ):
15     """Return combined BIAS analysis."""
16     bars = fetch_bars_as_models(market=market.value, days=30, timeframe=timeframe.value)
```

### Beobachtung
Hier wird direkt `fetch_bars_as_models()` aufgerufen.

### Konsequenz
Wenn Replay oder Simulation läuft, kann die Bias-Wirklichkeit von anderen Analysepfaden abweichen.

---

## 3. Märkte werden im Backend geliefert, aber nicht über eine eigene `routes/markets.py`

### Datei
`engine/src/arctis/main.py`

### Beweis
```python
157 @app.get("/api/markets")
158 async def get_markets():
159     """Return available markets from TimescaleDB, structured by MarketRoot."""
160     from arctis.db import fetch_available_symbols
...
205         return {"markets": [m.model_dump() for m in markets]}
```

### Beobachtung
Die Markt-Route existiert, aber **inline in `main.py`**.

### Konsequenz
Die Dokuangabe `routes/markets.py` ist falsch.

---

## 4. Health-Check benutzt anderes Tabellenschema als der restliche DB-Pfad

### Datei
`engine/src/arctis/main.py`

### Beweis
```python
143 @app.get("/health")
144 async def health():
145     from sqlalchemy import text
146     from arctis.db import get_engine
...
150             result = conn.execute(text("SELECT count(DISTINCT symbol) FROM bars"))
```

### Beobachtung
`/health` prüft gegen Tabelle `bars`.

### Kontrast
`db.py` arbeitet an mehreren Stellen gegen `ohlcv_1m`.

### Konsequenz
Schema-/Wahrheitsmismatch möglich.

---

## 5. WebSocket streamt rohe Symbolbars, nicht timeframe-korrigierte Livebars

### Datei
`engine/src/arctis/main.py`

### Beweis
```python
347 @app.on_event("startup")
348 async def start_bar_poller():
349     """Background task that checks for new bars and broadcasts to subscribers."""
350     async def poll_bars():
351         from arctis.db import fetch_bars
...
355             for symbol in manager.active_symbols:
...
357                     bars = fetch_bars(symbol=symbol, days=1)
...
363                             await manager.broadcast(symbol, {
364                                 "type": "bar",
365                                 "bar": latest if isinstance(latest, dict) else latest.__dict__,
366                                 "symbol": symbol,
367                             })
```

und

```python
374 @app.websocket("/ws/bars/{symbol}")
375 async def websocket_bars(websocket: WebSocket, symbol: str):
...
381         initial = fetch_bars(symbol=symbol, days=1)
...
384                 "type": "snapshot",
385                 "bars": initial[-10:],
386                 "symbol": symbol,
```

### Beobachtung
Der Kanal ist symbolbasiert und liefert rohe Bars.

### Konsequenz
Aggregierte Timeframes brauchen entweder serverseitige Aggregation oder clientseitig saubere Re-Bucket-Logik. Im aktuellen Pfad ist das nicht konsistent gelöst.

---

## 6. Frontend nutzt weiterhin eine harte Symbolzuordnung

### Datei
`app/src/store/market.ts`

### Beweis
```ts
5 const SYMBOL_MAP: Record<string, string> = {
6   NQ: 'NQH6',
7   ES: 'ESZ5',
8   CL: 'CLJ6',
9   GC: 'GCJ6',
10   '6E': '6EH6',
11   '6J': '6JH6',
12 }
...
38   setMarket: (market) => set({
39     market,
40     symbol: SYMBOL_MAP[market] || market,
41   }),
```

### Beobachtung
Das Frontend entscheidet weiterhin statisch, welcher Kontrakt zu einem Markt gehört.

### Konsequenz
Die dynamische Kontraktlogik ist nur halb umgesetzt.

---

## 7. useMarketData ist an harte localhost-URLs gebunden

### Datei
`app/src/hooks/useMarketData.ts`

### Beweis
```ts
5 const ENGINE_URL = 'http://127.0.0.1:8001'
6 const WS_URL = 'ws://127.0.0.1:8001'
```

### Beobachtung
Keine saubere Umgebungs-/Deploy-Konfiguration.

### Konsequenz
Nicht SaaS-ready, nicht staging-/prod-fähig.

---

## 8. useMarketData verbindet WebSocket nur symbolbasiert

### Datei
`app/src/hooks/useMarketData.ts`

### Beweis
```ts
22 const url = `${ENGINE_URL}/api/db/bars?symbol=${symbol}&days=${days}&timeframe=${timeframe}`
...
43 const ws = new WebSocket(`${WS_URL}/ws/bars/${symbol}`)
...
100 }, [symbol]) // Only reconnect on symbol change
```

### Beobachtung
REST initialisiert mit `symbol + timeframe`, WS hängt aber nur an `symbol`.
Der Effekt reconnectet nur auf Symbolwechsel.

### Konsequenz
Timeframe-Wechsel und Live-Pfad passen nicht sauber zusammen.

---

## 9. App baut den Feed clientseitig selbst zusammen

### Datei
`app/src/App.tsx`

### Beweis
```ts
43 const ENGINE_URL = 'http://127.0.0.1:8001'
121 function buildFeedItems(
...
355     fetch(`${ENGINE_URL}/api/markets`)
...
421   const feedItems = buildFeedItems(
...
688               <FeedPanel
```

### Beobachtung
Es existiert eine `buildFeedItems(...)`-Funktion in der App.
Der Feed wird im UI aus vorhandenen Analyseantworten zusammengesetzt.

### Konsequenz
Der Backend-Feed ist nicht der kanonische Produktpfad.

---

## 10. Marktliste im UI hat weiterhin statischen Fallback

### Datei
`app/src/App.tsx`

### Beweis
```ts
463  // ── Market pill list (from API or static fallback) ────────────────────────
466      ? (markets.map((m) => m.root).filter(Boolean))
467      : ['ES', 'NQ', 'CL', 'GC', '6E']
```

### Beobachtung
Auch wenn API-Daten geladen werden, bleibt ein statischer Fallback eingebaut.

### Konsequenz
Kein sauberer, vollständig API-getriebener Marktpfad.

---

## 11. AlgoView-Merge ist aktuell fast nur Branding

### Datei
`app/src/components/layout/Topbar.tsx`

### Beweis
```ts
199         <Breadcrumb segments={['AlgoView', 'Arctis', activeMarket]} />
```

### Zusatzbefund
Repository-Suche zeigt `AlgoView` praktisch nur in CSS-Kommentar und Breadcrumb.

### Konsequenz
Die Merge ist produktarchitektonisch noch nicht realisiert.

---

## 12. Der primäre Chartpfad wird bei Bar-Änderungen neu aufgebaut

### Datei
`app/src/components/charts/SimpleChart.tsx`

### Beweis
```ts
170   // Build chart on first mount (bars change re-creates chart)
171 }, [bars])
```

### Beobachtung
Der Aufbau-Effekt hängt an `bars`.

### Konsequenz
Kein sauber inkrementeller Produktionspfad; unnötige Re-Creation.

---

## 13. BOS/CHoCH-Marker sind deaktiviert

### Datei
`app/src/components/charts/SimpleChart.tsx`

### Beweis
```ts
503  // ── Markers: BOS/CHoCH + Pattern annotations ───────────────────────────────
510    // BOS/CHoCH markers disabled — only setup signals shown on chart
```

### Konsequenz
Eine als wichtig spezifizierte Chartfunktion ist bewusst nicht aktiv.

---

## 14. Zeichenwerkzeuge sind nur teilweise umgesetzt

### Datei
`app/src/components/charts/SimpleChart.tsx`

### Beweis
```ts
671      // rectangle / trendline / text are P2 — skipped for now
```

### Konsequenz
Drawing-Funktionalität ist noch nicht vollständig eingelöst.

---

## 15. Architektur-Doku behauptet Dateien, die so nicht existieren

### Datei
`docs/ARCHITECTURE.md`

### Beweis
```md
48 | `routes/markets.py` | `GET /api/markets` — dynamic from DB |
50 | `routes/config.py` | `GET /api/config` — risk limits |
107            └── streams new bars → Chart.update() (incremental)
114    └── GET /api/analysis/feed     → FeedPanel (via FeedEventEngine)
124 - **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.x async, pandas
```

### Beobachtung
Mindestens fünf Aussagen sind problematisch:
- `routes/markets.py` existiert nicht
- `routes/config.py` existiert nicht
- `Chart.update()` beschreibt nicht den realen Chart-Lifecycle
- `/api/analysis/feed` ist nicht die aktuelle Route
- `SQLAlchemy 2.x async` stimmt nicht mit `create_engine(...)` in `db.py`

### Konsequenz
Die Architektur-Doku ist als aktuelle Wahrheit unzuverlässig.

---

## 16. Acceptance-Matrix überzeichnet den Ist-Stand

### Datei
`docs/ACCEPTANCE_MATRIX.md`

### Beweis
```md
17 | AC-01 | All `/api/analysis/*` routes read from DB | GREEN |
18 | AC-02 | `/api/markets` returns dynamic data from DB | GREEN | ... `routes/markets.py`
21 | AC-05 | `useMarketData` hook loads REST + WS data | GREEN |
25 | AC-09 | FeedPanel shows real feed events | GREEN |
```

### Beobachtung
Mehrere GREEN-Claims sind im Code nur teilweise oder gar nicht gedeckt.

### Konsequenz
Das Dokument ist als Governance-Quelle derzeit nicht belastbar.

---

## 17. Das Issue Register enthält veraltete historische Bugs

### Datei
`docs/ISSUE_REGISTER.md`

### Beweis
```md
9  | B1 | sqlalchemy/psycopg2 missing from pyproject.toml — DB routes crash |
13 | B5 | /probability route reads from Parquet, all others from DB |
```

### Gegenbeweis
`engine/pyproject.toml` enthält nun:
```toml
14    "python-multipart>=0.0.18",
15    "sqlalchemy>=2.0",
16    "psycopg2-binary>=2.9",
```

### Beobachtung
Issue Register und Codebasis sind nicht synchron.

### Konsequenz
Das Repo enthält gleichzeitig alte Auditspuren und neue Realität.

---

## 18. Tests konnten in dieser Umgebung nicht als „grün“ bestätigt werden

### Umgebungsergebnis
`python -m pytest -q` im Backend führt in dieser Containerumgebung zu Importfehlern wegen fehlendem installierten `sqlalchemy`.

### Befund
```text
E   ModuleNotFoundError: No module named 'sqlalchemy'
...
5 errors during collection
```

### Wichtige Einordnung
Das beweist **nicht**, dass das Repo die Dependency nicht mehr deklariert — das tut es.
Es beweist aber sehr wohl:

- die grüne Behauptung „alles praktisch verifiziert“ lässt sich hier nicht blind bestätigen,
- Runtime-Verifikation muss sauber zwischen Repo-Deklaration und tatsächlicher Umgebung unterscheiden.

---

## 19. Das Repo selbst dokumentiert fehlende Authentifizierung

### Datei
`docs/KNOWN_LIMITATIONS.md`

### Beweis
```md
27 ### 2. No authentication or authorization
29 **What:** All API endpoints are unauthenticated.
35 **Impact:** Do not expose port 8001 to the internet without adding an auth layer.
```

### Konsequenz
SaaS-Reife ist aus Repo-Sicht selbst noch nicht gegeben.

---

## 20. Das große PRD benennt Multi-Tenancy selbst noch als Non-Goal

### Datei
`docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md`

### Beweis
```md
45 ### Non-Goals
47 - No automated order execution or broker connectivity (Phase 1)
48 - No multi-user / multi-tenant architecture (Phase 1 — single-user local SaaS)
```

### Konsequenz
Der aktuelle Produktraum ist noch auf lokalen/single-user Ausbau ausgelegt.
Die neue Zielsetzung Arctis × AlgoView als SaaS-ready Plattform ist also **eine echte strategische Erweiterung**, nicht nur ein kleiner Zusatzwunsch.

---

## Zusammenfassung der Beweislage

Die Codebeweise zeigen konsistent:

1. Claude hat real entwickelt.
2. Der Build ist aber noch nicht kanonisch.
3. Die Doku ist stellenweise zu optimistisch.
4. AlgoView- und SaaS-Zielbild sind noch offen.
5. Der nächste autonome Durchlauf muss auf **Codewahrheit + Produktneurahmung** aufsetzen.
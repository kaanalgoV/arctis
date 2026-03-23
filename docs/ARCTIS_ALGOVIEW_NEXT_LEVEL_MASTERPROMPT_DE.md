
# MASTERPROMPT — ARCTIS × ALGOVIEW NEXT LEVEL BUILD ORCHESTRATOR

## Sofortregel

Diese Anweisung **übersteuert frühere Build-Prompts**, sobald sie gemeinsam mit dem Repository und den bisherigen Masterpacks verwendet wird.

Du arbeitest **nicht** als „Ideengeber“, sondern als kombinierter:

- Program Director
- Repo Auditor
- Staff Full-Stack Engineer
- Quant UX / Product Architect
- Realtime & Data Engineer
- SaaS Platform Engineer
- QA / Release Engineer

Du sollst **nicht diskutieren**, sondern **prüfen, entscheiden, umbauen, verifizieren und dokumentieren**.

Du darfst **keine Scheinfertigkeit** produzieren:
- kein grüner Status ohne echten Codepfad,
- kein „funktioniert“ ohne Test/Smoke-Proof,
- kein hübsches UI ohne korrekte Daten,
- kein „AI“ ohne nachvollziehbaren Nutzen,
- kein Profitversprechen.

Das Ziel ist **nicht** ein Broker oder Autotrader.  
Das Ziel ist ein **AI Trader Context OS**, das Tradern hilft, **bessere Einstiege, Bestätigungen, Invalidationen, Exits und Review-Loops sichtbar und verständlich** zu machen.

**Wichtige Ehrlichkeitsregel:**  
Wenn die Engine Ein- und Ausstiege markiert, dann sind das **engine-detectete Setups / Trigger / theoretische Auflösungen auf Marktdatenbasis**, **keine echten Broker-Fills**. Das muss in Produkt, Texten und UI jederzeit sauber markiert sein.

---

## Produkt-Nordstern

Baue Arctis × AlgoView zu einer Plattform aus, in der:

- **AlgoView** die Radar-/Scanner-/Priorisierungs-/Watchlist-Schicht ist,
- **Arctis** die tiefe Workspace-/Chart-/Replay-/Erklärungs-Schicht ist,
- und beides dieselbe **Context Engine** nutzt.

Die Software soll den Markt **vollautomatisch markieren, erklären, kontextualisieren, priorisieren und reviewbar machen**.

Der Nutzer muss nach dem Umbau in einem durchgehenden Flow arbeiten können:

**Radar → Queue → Workspace → Chart → Why now / Why here / What invalidates → Entry/Exit-Lifecycle → Replay → Journal → Team / SaaS**

---

## Harte Ausgangswahrheit, die du zuerst selbst verifizierst

Nutze diese Punkte als **Startverdacht**, nicht als blindes Dogma. Du musst sie im Repo verifizieren, aber sie gelten als hochwahrscheinliche Ist-Probleme:

1. **Markt-/Kontraktwahrheit ist nicht kanonisch**
   - `app/src/store/market.ts` benutzt harte `SYMBOL_MAP`.
   - `app/src/App.tsx` und andere Stellen enthalten weitere harte URLs/Fallbacks.
   - Root, Contract-Symbol, Instrument und Anzeige-Label sind nicht sauber getrennt.

2. **Der Frontend-Datenpfad ist gespalten**
   - Direktes `fetch()` an mehreren Stellen statt ein kanonischer API-/WS-Client.
   - Mehrere harte `ENGINE_URL`-Strings.
   - Panels, Replay, Market-Load und Settings sprechen nicht denselben Runtime-Vertrag.

3. **Realtime ist fachlich nicht sauber genug**
   - WebSocket ist symbolbasiert, aber nicht als vollständiger Live-Vertrag für Instrument+Timeframe+Mode modelliert.
   - Frontend ignoriert Snapshot/Heartbeat weitgehend.
   - Timeframe-Parität zwischen REST/WS/Replay ist nicht robust.

4. **Replay ist unvollständig**
   - `seek()` ist nicht wirklich umgesetzt.
   - Replay benutzt Polling-/Spezialpfade statt denselben Event-/Datenvertrag wie Live.
   - Es existiert Zustandsdrift zwischen Live, Replay, Panels und Chart.

5. **Charting ist noch nicht produktionsreif**
   - Der kanonische Chartpfad muss verifiziert werden, aktuell spricht vieles für `SimpleChart.tsx`.
   - Das Chart wird an zentraler Stelle noch über `useEffect(...,[bars])` neu aufgebaut, statt stabil inkrementell zu laufen.
   - BOS/CHoCH sind deaktiviert.
   - Rectangle/Trendline/Text-Drawing sind nicht fertig.
   - Fullscreen ist optional, aber nicht als harter Produktpfad verifiziert.
   - Zoom/Pan/Scroll-Kontext darf nicht bei Updates verloren gehen.

6. **Feed ist nicht kanonisch**
   - Im UI wird Feed teilweise synthetisch aus anderen Responses gebaut, statt engine-native erklärt und versioniert zu kommen.
   - Feed, Chart und Panels meinen nicht immer exakt denselben Zustand.

7. **Analysepfade sind nicht hart genug auf DB-Wahrheit eingeschworen**
   - Analyse lädt nicht strikt DB-first-and-only.
   - Simulation/Parquet/DB-Pfade sind nicht scharf genug getrennt.
   - Aggregation und Timeframe-Logik müssen auf Produktionsniveau gehärtet werden.

8. **Buttons/Interaktionen sind nicht vollständig produktisch**
   - Nicht jeder klickbare Button oder Toggle hat echte fachliche Wirkung.
   - Ein Button ohne Wirkung oder nur mit lokaler Kosmetik ist ein Bug.
   - Ein Feature, das im UI sichtbar ist, aber nur halb implementiert ist, muss entweder vollendet oder entfernt werden.

9. **AlgoView ist noch kein echter Produktteil**
   - Branding ist da, aber Scanner-/Radar-/Ranking-/Queue-/Watchlist-/Workspace-Flow ist noch nicht sauber durchgezogen.

10. **SaaS-Readiness ist noch offen**
    - Auth, Organizations, Rollen, Entitlements, Billing, Metering, Audit, Feature Flags, Observability und Release-Gates sind noch nicht als echte Control Plane vorhanden.

---

## Benchmark-Standard, an dem du dich orientierst

Die Plattform muss mindestens die Basiserwartung erfüllen, die der Markt heute an gute Trader-Tools hat:

- automatisierte technische Markierung,
- Scanning/Ranking/Watchlists,
- flüssiges Charting,
- Orderflow-/Kontextnähe,
- Alerts, Replay und Review,
- und eine team-/SaaS-fähige Betriebsoberfläche.

**Aber**: Arctis × AlgoView darf nicht nur kopieren.  
Die Differenzierung muss sein:

1. **bessere Erklärung statt nur Markierung**,  
2. **klarer Setup-Lifecycle statt nur Signale**,  
3. **Radar → Workspace → Review als geschlossener Produktfluss**,  
4. **saubere SaaS-Betriebsfähigkeit**,  
5. **ehrliche Unsicherheit statt AI-Showmanship**.

---



## Referenzstandard für Produkt und Technik

Nutze diese Referenzlinien als Qualitätsmaßstab, ohne blind zu kopieren:

### Produktreferenzen
- **Automatisierte technische Analyse** muss mindestens auf dem Niveau moderner Auto-Marking-Produkte verständlich wirken.
- **Scanner / Ranking / Watchlists** müssen sich wie ein ernstzunehmendes Market-Radar anfühlen.
- **Orderflow-/Kontextnähe** darf perspektivisch ausbaufähig sein, aber die Produktsemantik muss bereits jetzt „real market context“ statt „nur bunter Chart“ transportieren.

### Technische Referenzentscheidungen
1. **Chart**  
   Halte einen einzigen kanonischen Renderer im produktiven Pfad und optimiere ihn inkrementell.  
   Kein häufiges Vollersetzen der Serien bei Live-Updates.

2. **Realtime**  
   Nutze einen sauberen Snapshot+Delta-WebSocket-Vertrag mit Tests, statt losem Symbol-Polling.

3. **Zeitreihen-Aggregation**  
   Aggregiere serverseitig und timeframe-korrekt. Nutze robuste Zeit-Bucket-/OHLCV-Semantik statt clientseitigem Guessing.

4. **SaaS-Control-Plane**  
   Denke in Organizations, Rollen, Entitlements, Usage/Metering, Feature Flags und Auditierbarkeit.

5. **Observability**  
   Instrumentiere Requests, Realtime-Pfade und kritische UI-Flows so, dass Probleme nachvollziehbar sind.


## Was du zuerst lesen und verifizieren musst

Bevor du Code änderst, liest du in dieser Reihenfolge:

### Kontext- und Audit-Dateien
1. `arctis_algoview_saas_masterpack_2026-03-23/00_START_HERE_README.md`
2. `01_EXEC_SUMMARY_DE.md`
3. `02_REALITY_AUDIT_CLAUDE_BUILD.md`
4. `03_CODE_EVIDENCE_APPENDIX.md`
5. `04_COMPETITOR_RESEARCH_AUTOMATION_CONTEXT.md`
6. `05_PRODUCT_BLUEPRINT_ARCTIS_ALGOVIEW.md`
7. `06_SAAS_ARCHITECTURE_AND_OPERATING_MODEL.md`
8. `07_DELIVERY_ROADMAP_AND_ACCEPTANCE.md`

### Repo-Dateien, die du gezielt verifizieren musst
- `app/src/main.tsx`
- `app/src/App.tsx`
- `app/src/store/market.ts`
- `app/src/store/settings.ts`
- `app/src/hooks/useMarketData.ts`
- `app/src/hooks/useAnalysis.ts`
- `app/src/hooks/useReplay.ts`
- `app/src/hooks/useDrawings.ts`
- `app/src/components/layout/Sidebar.tsx`
- `app/src/components/layout/Topbar.tsx`
- `app/src/pages/DashboardPage.tsx`
- `app/src/pages/ChartPage.tsx`
- `app/src/pages/PatternsPage.tsx`
- `app/src/components/charts/SimpleChart.tsx`
- `app/src/components/charts/ChartToolbar.tsx`
- `app/src/components/charts/DrawingToolbar.tsx`
- `app/src/components/replay/ReplayBar.tsx`
- `app/src/components/settings/SettingsPanel.tsx`
- alle tatsächlich gemounteten Panels
- `app/src/api.ts`
- `engine/src/arctis/main.py`
- `engine/src/arctis/db.py`
- `engine/src/arctis/models.py`
- `engine/src/arctis/contracts.py`
- `engine/src/arctis/ws.py`
- `engine/src/arctis/events.py`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/feed.py`
- `engine/src/arctis/routes/probability.py`
- `engine/src/arctis/routes/bias.py`
- `engine/src/arctis/routes/zones.py`
- relevante Tests in `engine/tests/`
- Docs mit Reifebehauptungen

Du musst zuerst den **real gemounteten Laufzeitpfad** bestimmen.  
Unbenutzte Altpfade dürfen nicht als Produktwahrheit behandelt werden.

---

## Nicht verhandelbare Regeln

### 1. Eine Wahrheit pro Fachzustand
Ein Instrument, ein Timeframe, ein Zeitpunkt, ein Modus und ein Setup-Zustand dürfen nie aus widersprüchlichen Quellen kommen.

### 2. Root ≠ Contract ≠ Instrument ≠ Anzeige-Label
Diese Ebenen werden strikt getrennt:
- `root` z. B. `NQ`
- `contract_symbol` z. B. `NQH6`
- `instrument_id` als kanonischer interner Bezeichner
- `display_label` z. B. `NASDAQ Futures`

### 3. Live und Replay sind gleichwertige Bürger
Jede Analyse, jede Markierung, jeder Feed-Eintrag und jede Erklärung muss sowohl für Live als auch Replay funktionieren.

### 4. Ein primärer Chartpfad
Keine drei konkurrierenden Chartsysteme als Produktwahrheit.  
Du wählst **einen** kanonischen Renderer für den produktiven Pfad und stilllegst/versteckst die anderen.

### 5. Inkrementell oder gar nicht
Neue Bars, Marker, Zonen, Setups und Statusänderungen dürfen **nicht** jedes Mal den ganzen Chart neu bauen.

### 6. Kein Button ohne Wirkung
Jeder Button, Toggle, Shortcut, Dropdown, Tab, Feed-Klick, Replay-Transport, Toolbar-Icon und Setting-Schalter muss:
- entweder fachlich wirken,
- oder entfernt werden.

### 7. Keine Demo-Wahrheit im Produktpfad
Kein statischer Mock, kein synthetischer Feed, kein kosmetisches Placeholder-Feature darf im produktiven Pfad als echte Funktion erscheinen.

### 8. Kein Profitversprechen
Die Plattform soll Tradern helfen, bessere Entscheidungen zu treffen.  
Sie darf **nie** implizieren, dass Gewinne garantiert oder „automatisch erzeugt“ werden.

### 9. Jedes wichtige Signal braucht Evidenz
Eine Markierung ohne Erklärung ist Deko.  
Eine Erklärung ohne Evidenz ist Bullshit.  
Du brauchst beides.

### 10. Dokumentation darf nicht halluzinieren
Alle Docs müssen den realen Buildzustand spiegeln.

---

## Zielarchitektur des Produkts

### A. AlgoView Radar Layer
Das ist die Oberfläche, auf der Nutzer **Märkte finden und priorisieren**.

Muss enthalten:
- Marktuniversum
- Such-/Filter-/Segmentierungslogik
- Ranking nach Opportunity Score
- Watchlists
- Queue / Next Best Opportunities
- Kontext-Badges: Bias, Session, Volatilität, RVOL, Strukturstatus, Setup-Status
- Deep Link in den Arctis Workspace

### B. Arctis Workspace Layer
Das ist die Oberfläche, auf der Nutzer **den Markt tief verstehen**.

Muss enthalten:
- kanonischer Chart
- Erklärungs-/Context-Panels
- Feed
- Setup-Lifecycle
- Entry-/Exit-Markierung
- Replay
- Journal / Review
- Risiko-/Invalidationssicht

### C. Context Engine
Das ist der eigentliche Produktkern.

Sie verbindet:
- Struktur
- Bias
- Confluence
- Volumen
- Session-Kontext
- Pattern/Signal
- Zonen/Levels
- Setup-Lifecycle
- Alerts
- Replay-Interpretation
- Journal-Einträge

---

## Was konkret gebaut werden muss

# 1. Kanonischer Daten- und Instrumentvertrag

Baue einen **einheitlichen Contract**, der durch Backend, Frontend, Replay, Feed, Chart, Alerts und Journal läuft.

## Muss-Felder
- `org_id` (später SaaS)
- `workspace_id` (später SaaS)
- `instrument_id`
- `root`
- `contract_symbol`
- `display_label`
- `timeframe`
- `mode` (`live` | `replay`)
- `context_ts`
- `source` (`db` | `sim`)
- `sequence_id` für Streams
- `version`

## Anforderungen
- Frontend darf keinen Front-Month-Contract mehr aus `root` raten.
- `/api/markets` wird echte Produktquelle.
- Fallbacks sind nur erlaubt, wenn sie klar als degradierter Zustand markiert sind.
- Market-/Timeframe-Wechsel müssen im gesamten UI denselben Zustand ändern.
- Keine harte `SYMBOL_MAP` im produktiven Pfad.
- Keine harte `ENGINE_URL` an mehreren Stellen.

## Verboten
- parallele Contract-Logik in Store + App + Hook + Backend
- Timeframe-Mismatch zwischen UI und Backend
- implizite Root-zu-Contract-Magie

---

# 2. Ein einziger API- und WS-Client

Baue einen **kanonischen Frontend-Client**.

## Muss leisten
- Environment-basierte Base-URL
- REST-Client
- WebSocket-Client
- Typed contracts
- Reconnect-Strategie
- Snapshot + Delta Handling
- Fehlerzustände
- Request-Abbruch / Race-Protection
- deduplizierte Eventverarbeitung

## Konsequenzen
- Direkte `fetch()`-Inseln in `App.tsx`, Hooks und Settings werden entfernt oder strikt zentralisiert.
- Alle Datenpfade sprechen dieselben Typen.
- Wenn möglich: API-Types aus OpenAPI oder einem gemeinsamen Contract-Modul ableiten, damit Backend und Frontend nicht auseinanderlaufen.

---

# 3. Realtime-Vertrag auf Produktionsniveau

Der aktuelle symbolbasierte Rohkanal reicht nicht.

Du baust einen fachlich sauberen Realtime-Vertrag.

## WS-Nachrichtentypen
Mindestens:
- `subscribed`
- `snapshot`
- `bar_delta`
- `setup_delta`
- `feed_delta`
- `heartbeat`
- `error`
- `replay_state`

## Subscribe-Payload
Beispiel:
```json
{
  "type": "subscribe",
  "instrument_id": "nq-front",
  "contract_symbol": "NQH6",
  "timeframe": "5min",
  "mode": "live"
}
```

## Regeln
- Snapshot und Deltas sprechen denselben Vertrag.
- Deltas sind idempotent verarbeitbar.
- Reconnect darf keine Doppelbars oder Geisterzustände erzeugen.
- Timeframe-Korrektheit hat Vorrang vor „sieht ungefähr richtig aus“.
- Heartbeats müssen verarbeitet werden.
- Sequence IDs oder monotone Zeit-/Versionslogik verhindern doppelte Verarbeitung.

---

# 4. Timeframe-Korrekte Datenpipeline

## Nicht erlaubt
- rohe 1m-Bars blind an 5m/15m/30m/1h-Ansichten dranhängen
- clientseitige Pseudo-Aggregation als kanonische Wahrheit
- naive Chunk-Aggregation, die Gaps/Sessions zerstört

## Pflicht
- Serverseitig korrekte Aggregation
- konsistente OHLCV-Semantik
- Gaps/Sessions/Restbars sauber behandelt
- Timeframe-Unterstützung mindestens:
  - `1min`
  - `5min`
  - `15min`
  - `30min`
  - `1h`

## Produktregel
Wenn ein Timeframe im UI auswählbar ist, dann muss er:
- im Backend unterstützt sein,
- im Chart korrekt sein,
- in Analysis/Feed/Replay korrekt sein.

---

# 5. DB-First, keine gespaltene Wahrheit

## Produktionsregel
Für den produktiven Pfad gilt:
- Analyse liest aus der kanonischen DB-/Realtime-Wahrheit.
- Simulation/Replay ist ein expliziter Modus, nicht ein versteckter Alternativpfad.
- Parquet/Test-Store darf nicht stillschweigend zur zweiten Wahrheit im Produktpfad werden.

## Konkrete Arbeit
- `_load_bars()` und angrenzende Pfade so umbauen, dass Modus und Datenquelle explizit sind.
- `probability` und alle Analyse-Routen an denselben Markt-/Timeframe-/Context-Vertrag hängen.
- Docs so aktualisieren, dass sie den realen Datenpfad korrekt benennen.

---

# 6. Kanonischer Chartpfad

Du musst einen Chartpfad als Produktionswahrheit festlegen.

**Empfehlte Richtung:**  
Nutze den aktuell gemounteten Lightweight-Charts-Pfad als kanonischen Chartpfad und härte ihn konsequent, statt noch einen weiteren Renderer zu etablieren.

## Chart-Zielbild
Der Chart muss:
- flüssig sein,
- stabil inkrementell updaten,
- bei Live-Updates nicht flackern,
- Zoom/Pan beibehalten,
- saubere Marker/Level/Zonen/Drawings anzeigen,
- Feed-Klicks zuverlässig fokussieren,
- Replay sauber unterstützen,
- und Entry-/Exit-Lifecycles visuell verständlich machen.

## Konkrete Pflichtarbeiten
- Chart nur einmal initialisieren.
- Serien mit `update()` / gezielten Inkrementalupdates pflegen.
- `setData()` nur dort einsetzen, wo Vollinitialisierung oder bewusste Rehydrate nötig ist.
- Chart-Neuaufbau auf jedes `bars`-Update eliminieren.
- Marker-/Overlay-/Line-Refs sauber verwalten.
- Overlay-Sichtbarkeit ohne Datenverlust umschalten.
- Session-/Level-/Zone-/Setup-Linien stabil verwalten.
- Fullscreen wirklich anbinden oder entfernen.
- Scroll-to-feed robust halten.
- Resize sauber.

---

# 7. Alle Buttons und Interaktionen müssen funktionieren

Das ist eine harte Produktforderung.

## Du musst systematisch alle Interaktionen inventarisieren
Scanne den produktiven UI-Pfad nach:
- `onClick`
- `onChange`
- `onSelect`
- Keyboard Shortcuts
- Toggle Switches
- Replay Controls
- Settings Tabs
- Toolbar Buttons
- Sidebar Navigation
- Feed Item Actions
- Panel Links
- Chart Interactions
- Fullscreen
- Scroll / Jump / Focus
- Mode Switches

## Für jede Interaktion gilt
Sie ist nur dann zulässig, wenn mindestens eine der folgenden Aussagen wahr ist:

1. Sie verändert echten Produktzustand.  
2. Sie löst eine nachvollziehbare Backend-/Frontend-Aktion aus.  
3. Sie ist getestet oder smoke-geprüft.  
4. Ihre Wirkung ist im UI sichtbar.  
5. Ihre Persistenz ist geklärt.

## Konkret im aktuellen Produkt wahrscheinlich betroffen
- Sidebar Navigation
- Market Pills
- Timeframe Pills
- Overlay Toggles
- Settings Save
- Replay Start / Stop / Seek / Speed / Date
- Feed Click → Chart Focus
- Drawing Toolbar
- Fullscreen
- Alerts Toggles
- ggf. Travis / Ask-Flows
- ggf. Pattern-/Dashboard-Weiterleitungen

## Harte Regel
Ein Button, der nichts tut, ist schlechter als kein Button.  
Du sollst solche Dinge **entweder implementieren oder entfernen**.

---

# 8. Vollständige Drawing-Tools

Aktuell reicht `hline` nicht.

Baue im kanonischen Chartpfad diese Werkzeuge produktisch:

- Horizontal Line
- Rectangle / Zone Box
- Trendline
- Text Note

## Anforderungen
- sauberer Interaktionsflow
- sichtbarer aktiver Tool-Status
- sauberes Cancel/Reset
- Persistenz
- Bearbeiten/Löschen
- chartstabile Speicherung mit referenzierbaren IDs
- mittelfristig Backend-Persistenz; kurzfristig wenigstens konsistenter Store, nicht kaputte Local-Only-Semantik

## Wichtig
Zeichnungen sind keine Dekoration.  
Sie sind Teil des Workspaces und müssen im Datenmodell ernst genommen werden.

---

# 9. Engine-detectete Einstiege, Invalidationen und Exits

Das ist der zentrale Next-Level-Punkt.

Baue eine **Context- und Setup-Engine**, die aus den vorhandenen Analysemodulen eine echte Setup-Lifecycle-Sicht erzeugt.

## Wichtiger Ehrlichkeitssatz
Diese Engine markiert:
- Setup-Kandidaten,
- Trigger,
- Invalidation,
- Targets,
- Auflösung gegen die Bar-Sequenz.

Sie markiert **nicht** automatisch echte Broker-Ausführungen.

## Setup-Objekt
Führe ein kanonisches Setup-/Trade-Idea-Modell ein, z. B.:

- `setup_id`
- `instrument_id`
- `timeframe`
- `direction`
- `status`
- `setup_type`
- `thesis`
- `why_now`
- `why_here`
- `confirmation_needed`
- `invalidation_reason`
- `entry_zone_low`
- `entry_zone_high`
- `entry_trigger_price`
- `stop_price`
- `tp1_price`
- `tp2_price`
- `tp3_price`
- `risk_reward_estimate`
- `confidence`
- `uncertainty`
- `evidence[]`
- `created_ts`
- `armed_ts`
- `entry_ts`
- `exit_ts`
- `exit_reason`
- `resolved_r_multiple` (wenn simulierbar)
- `source_modules[]`

## Setup-Status
Mindestens:
- `candidate`
- `armed`
- `triggered`
- `partial_tp1`
- `partial_tp2`
- `stopped`
- `invalidated`
- `expired`
- `completed`

## Quellen für Setup-Erkennung
Nutze die vorhandenen Module, aber zwinge sie in eine gemeinsame Sprache:
- structure
- bias
- confluence
- signals
- patterns
- zones
- volume / RVOL
- sessions
- vwap / ema / levels

## Chartsicht
Jedes Setup muss klar sichtbar sein:
- Entry-Zone
- Entry-Trigger
- Stop
- Targets
- Invalidation
- Status
- aktive vs abgeschlossene Setups
- Long/Short sauber farbcodiert
- alte/abgeschlossene Setups ggf. abdunkeln, aber reviewbar halten

## Feed / Panel / Journal
Jede Statusänderung wird als Event sichtbar:
- „Setup candidate created“
- „Setup armed“
- „Entry triggered“
- „TP1 hit“
- „Stop hit“
- „Invalidated“
- „Expired“

## Kontextkarte / Why-Panel
Für das fokussierte Setup zeigst du:
- Warum jetzt?
- Warum hier?
- Was bestätigt?
- Was invalidiert?
- Was ist das nächste logische Szenario?
- Wie hoch ist die Unsicherheit?
- Welche Module stützen die Idee?
- Welche Session / welches Regime beeinflusst die Aussage?

---

# 10. Feed darf nicht länger synthetische Deko sein

Der Feed muss engine-native werden.

## Verboten
- Feed aus mehreren Frontend-Responses im Browser „zusammenzudichten“, wenn es dafür einen kanonischen Backend-/Eventpfad geben muss.

## Pflicht
- ein kanonischer Eventvertrag
- Event IDs
- Event Types
- Severity
- instrument/timeframe/context
- Referenz auf Setup/Marker/Zone/etc.
- klickbare Verlinkung zurück in den Chartkontext
- deduplizierte Aktualisierung
- saubere zeitliche Sortierung

---

# 11. AlgoView als echter Radar-/Scanner-Layer

Dashboard darf nicht bloß hübscher Header sein.

Baue AlgoView als echte erste Produktfläche.

## Muss enthalten
- Marktübersicht / Universe
- Opportunity Score
- Filter (Session, Bias, RVOL, Setup-Typ, Confidence, Timeframe)
- Sortierung
- Watchlists
- „Top setups now“
- „Needs confirmation“
- „Recently invalidated“
- Quick open in workspace

## Opportunity Score
Der Score muss nachvollziehbar sein, nicht willkürlich.
Er kann aus bestehenden Signalen gebaut werden, z. B.:
- Bias alignment
- Structure quality
- Zone relevance
- Volume confirmation
- Session context
- Risk/Reward
- Freshness
- Invalidationsnähe

## Prinzip
AlgoView findet.  
Arctis erklärt.

---

# 12. Visuales Upgrade auf Premium-Niveau

Die Plattform soll visuell deutlich stärker wirken, aber nie zu Lasten der Lesbarkeit.

## Designprinzipien
- flüssig
- ruhig
- präzise
- high-density, aber nicht chaotisch
- professionelle Fintech-/Trading-Anmutung
- konsistente Semantik statt Effekt-Feuerwerk

## Anforderungen
- CSS-Variablen statt verstreuter Hex-Hardcodes
- ein konsistenter Token-Satz für Farben, Radius, Borders, Shadows, Motion
- visuelle Priorität für Preis, Status, Setup, Risiko, Session, Bestätigung
- subtile Animationen, keine billige Gamer-Optik
- kein Layout Shift bei Datenupdates
- saubere Skeletons / Empty / Error States
- klar unterscheidbare Zustände: live, replay, connected, reconnecting, degraded
- Premium-Dark-Theme mit starker Typografie und sauberer Hierarchie
- mobile/responsive ist sekundär, aber das Desktopprodukt muss exzellent wirken

## Performance-Ziel
Visuelle Qualität darf die Laufzeit nicht ruinieren.  
Schön + schnell, nicht schön statt schnell.

---

# 13. Replay als Lern- und Review-System

Replay ist kein Bonusfeature.  
Replay ist Produktkern.

## Muss leisten
- Datumsauswahl
- Start/Stop
- Seek
- Speed
- sichtbare Fortschrittslogik
- synchroner Feed/Chart/Panel-Zustand
- Setup-Lifecycles auch im Replay sichtbar
- Review von Kandidat → Trigger → Auflösung
- spätere Journal-Verknüpfung vorbereiten

## Regel
Replay muss dieselben Event-/Analyse-/Chartkontrakte verwenden wie Live, nur mit anderem `context_ts`/`mode`.

---

# 14. Journal / Review vorbereiten

Auch wenn du nicht alles finalisierst, musst du den Pfad vorbereiten.

## Ziel
Ein Nutzer kann später zu einem Setup oder Event sagen:
- was die Engine gesehen hat,
- wann sie es gesehen hat,
- warum,
- wie es sich aufgelöst hat,
- und was gelernt wurde.

## Minimum jetzt
- referenzierbare Setup-IDs
- referenzierbare Event-IDs
- historisierbare Statuswechsel
- Export-/Persistenzpfad vorbereitet
- UI-Platz für Review / Notes / Outcome

---

# 15. SaaS-Ready Control Plane

Die Plattform soll SaaS-ready sein, nicht nur lokales Tooling.

## Muss vorbereitet oder umgesetzt werden
- Authentication
- Organizations / Tenants
- Rollen / Permissions
- Workspaces
- Entitlements / Plan Features
- Billing / Metering
- Audit Logs
- Feature Flags
- Observability
- Admin-Oberfläche
- sichere Konfigurationspfade
- Environment-Sauberkeit

## Rollenbeispiele
- Owner
- Admin
- Trader
- Analyst
- Coach / Reviewer
- Read Only
- Billing Admin

## Objektmodell
Jede relevante Ressource muss tenant-aware sein:
- watchlists
- workspaces
- drawings
- alerts
- journals
- setups
- saved scanners
- exports
- usage metrics

## Harte Produktregel
Login allein ist **nicht** SaaS-ready.

---

# 16. Forecasting / Prediction nur als kontrollierter Layer

Prediction ist **nicht** der Kern des Produkts.  
Der Kern ist Markierung + Kontext + Setup-Lifecycle.

## Erlaubt
- Probability-/Forecasting-Layer als separat gekennzeichneter Research-/Assist-Layer
- Benchmarks gegen Baselines
- Unsicherheitsdarstellung
- Eval-Harness
- Walk-forward
- Leakage-Checks

## Verboten
- unvalidierte Blackbox als primäres Entry-Signal
- magische „Top Trade“-Behauptungen
- Forecasting, das die Erklärungsschicht verdrängt

## Produktregel
Zuerst erklärbare, regelbasierte und saubere Setup-Intelligenz.  
Dann kontrollierte Modelle.

---

# 17. QA, Smoke, Tests und Release Gates

Du darfst keinen Fortschritt melden ohne Nachweis.

## Pflicht
- Backend-Tests reparieren oder ehrlich markieren
- Frontend-Test-Setup hinzufügen
- Smoke-Tests für:
  - Market Switch
  - Timeframe Switch
  - Live Data
  - Replay Start/Stop/Seek
  - Feed Click → Chart Focus
  - Overlay Toggles
  - Settings Save
  - Drawings
  - Setup-Lifecycle-Rendering
  - AlgoView → Workspace Deep Link

## Zusätzliche Verifikation
- TS-Check
- Frontend Build
- Pytest
- wenn möglich E2E-Smokes
- Performance-Smoke für Chartupdates
- Dokumentationswahrheit prüfen

---

## Phasen, in denen du arbeiten sollst

# Phase 0 — Truth Reset & Laufzeitbeweis

## Ziel
Beweise:
- welcher Frontendpfad gemountet ist,
- welcher Chartpfad real produktiv ist,
- welche Panels echte Daten sehen,
- welche Altpfade tot sind,
- welche Buttons funktionslos sind.

## Ergebnisse
- kurzes Audit-Dokument
- Liste toter Pfade
- Liste kaputter/halbfertiger Interaktionen
- Priorisierung nach Business Impact

## Kein Weiterbau ohne diesen Schritt

---

# Phase 1 — Kanonische Verträge & Datenwahrheit

## Ziel
- Instrument-/Contract-/Timeframe-Wahrheit stabilisieren
- einen API-/WS-Client etablieren
- DB-/Realtime-/Replay-Kontrakte vereinheitlichen
- Timeframe-Pipeline härten

## Akzeptanz
- keine harte `SYMBOL_MAP` im produktiven Pfad
- keine Frontend-Raterei von Front-Month-Kontrakten
- keine mehrfachen `ENGINE_URL`-Konstanten im produktiven Pfad
- echte 1m/5m/15m/30m/1h-Parität

---

# Phase 2 — Chart, Interaktionen und Visual Polish

## Ziel
- kanonischen Chart härten
- Re-Creation eliminieren
- Drawings vervollständigen
- alle Buttons/Toggles produktisch machen
- Visual System professionalisieren

## Akzeptanz
- Chart bleibt stabil bei Live-Updates
- Zoom/Pan bleiben erhalten
- Drawings funktionieren
- Fullscreen funktioniert oder existiert nicht
- keine toten Buttons mehr im gemounteten Produktpfad

---

# Phase 3 — Feed, Setup Engine, Entry/Exit-Lifecycle

## Ziel
- engine-native Feed
- Setup-Modell
- Why-now/Why-here/Invalidation
- Entry-/Exit-/Resolution-Markierungen im Chart

## Akzeptanz
- sichtbare Setup-Lifecycles
- Feed- und Chart-Konsistenz
- jede Markierung ist referenzierbar
- Exits/Invalidationen sind im Chart und Feed sichtbar

---

# Phase 4 — AlgoView Radar

## Ziel
- Dashboard zu echter Opportunity-Oberfläche machen
- Ranking, Filter, Watchlists, Queue
- Deep Links in Workspaces

## Akzeptanz
- Nutzer kann relevante Märkte finden, priorisieren und direkt untersuchen
- Radar und Workspace teilen denselben Setup-/Context-Kern

---

# Phase 5 — Replay, Journal, Review

## Ziel
- Replay fertigstellen
- Setup-Verläufe reviewbar machen
- Journal-Grundlage schaffen

## Akzeptanz
- Seek funktioniert
- Replay ist synchron
- Setup-Historie ist reviewbar

---

# Phase 6 — SaaS Control Plane, Ops, Security, Evaluation

## Ziel
- Auth, Org, Roles, Entitlements, Billing, Audit, Flags, Observability
- Eval-Harness für Probability/Forecasting
- ehrliche Release-Gates

## Akzeptanz
- tenant-aware Modell steht
- Feature-Gating ist möglich
- Audit-/Usage-Basis existiert
- Plattform ist beta-tauglich statt nur lokal hübsch

---

## Konkrete Datei- und Pfadentscheidungen

### Frontend
1. `App.tsx` darf nicht länger Orchester + API-Friedhof + Feed-Synthesizer + Runtime-Hardcode zugleich sein.
2. `useMarketData.ts` muss auf kanonischen Client, echten WS-Vertrag und Timeframe-Parität umgebaut werden.
3. `useAnalysis.ts` darf nicht stillschweigend Nullwerte schlucken, die Produktwahrheit verdecken.
4. `useReplay.ts` braucht echte Seek-/Mode-Parität.
5. `store/market.ts` muss von statischer Contract-Auflösung befreit werden.
6. `SimpleChart.tsx` muss inkrementell, stabil und feature-vollständig werden.
7. `DrawingToolbar.tsx` ist erst fertig, wenn alle angebotenen Tools funktionieren.
8. `ChartToolbar.tsx` ist erst fertig, wenn alle sichtbaren Aktionen echte Wirkung haben.
9. `SettingsPanel.tsx` darf nicht nur Local-UI sein; Settings müssen echte Runtime-Wirkung haben.
10. ungemountete Legacy-Komponenten müssen gelöscht, eingefroren oder deutlich aus dem Produktpfad entfernt werden.

### Backend
1. `main.py` muss saubere REST-/WS-/Replay-Registrierung und ehrliche Health-/Degrade-Semantik liefern.
2. `db.py` muss korrekte Aggregation und Symbol-/Instrument-Logik tragen.
3. `routes/analysis.py` muss explizite Mode-/Source-Semantik haben.
4. `routes/feed.py` muss zur kanonischen Feedquelle werden oder in eine sauberere Event-Schicht überführt werden.
5. `events.py` muss referenzierbare Eventobjekte liefern.
6. `probability.py` darf kein Parallelsystem bleiben.
7. Tests müssen auf die neue Wahrheit gehoben werden.

---

## UX- und Produktdetails, die du explizit umsetzen sollst

### Im Chart-Workspace
- klare Instrument-/Timeframe-Anzeige
- Live-/Replay-Status
- fokussierter Setup-Context
- Entry-/Stop-/Target-Ladder
- Invalidationshinweis
- Marker für:
  - setup candidate
  - armed
  - triggered
  - tp1/tp2
  - stop
  - invalidated
- kontextbezogene rechte Seitenleiste
- Feed-Klick springt präzise
- Replay-Leiste wirkt professionell und echt

### Im AlgoView-Radar
- Opportunity Cards/Table
- Scoring
- Filters
- Watchlist
- Open in Workspace
- Status-Badges
- „why it matters now“

### In Panels
Jedes Panel muss eine echte Daseinsberechtigung haben:
- Signals
- Session
- Confluence
- Bias
- Patterns
- Feed
- Risk
- Travis / AI Coach nur dann, wenn es echte Kontextdaten nutzt und nicht bloß statische Antworten liefert

Wenn ein Panel nichts Eindeutiges beiträgt, reduziere oder ersetze es.

---

## Messbare Definition of Done

Ein Zustand gilt nur dann als „done“, wenn mindestens diese Aussagen wahr sind:

1. Keine harte `SYMBOL_MAP` im produktiven Pfad.
2. Keine verstreuten harten `ENGINE_URL`-Strings im produktiven Pfad.
3. Market- und Timeframe-Wechsel funktionieren end-to-end.
4. Alle sichtbaren Buttons/Toggles/Shortcuts im gemounteten Pfad haben echte Wirkung.
5. Chart wird nicht bei jedem neuen Bar komplett neu erzeugt.
6. Feed ist nicht länger Frontend-Synthese ohne kanonische Quelle.
7. Replay Start/Stop/Seek sind funktional und synchron.
8. Entry-/Exit-/Invalidations-Markierungen sind im Chart sichtbar.
9. Setup-Lifecycle ist im Feed und in mindestens einem Context-Panel sichtbar.
10. AlgoView-Radar hat echte Priorisierung und Deep Links.
11. Demo-/Mock-/Placeholder-Wahrheiten sind aus dem Produktpfad entfernt oder klar degradiert markiert.
12. Mindestens grundlegende Tests/Smokes decken Kernpfade ab.
13. Dokumentation beschreibt den realen Zustand statt Wunschdenken.
14. SaaS-Grundlagen sind implementiert oder als ehrliche, klar abgegrenzte nächste Phase vorbereitet.
15. Die Plattform wirkt sichtbar hochwertiger, flüssiger und kohärenter als vorher.

---

## Performance- und Qualitätsziele

Nutze diese Ziele als harte Orientierung:

- keine Chart-Flicker bei Live-Updates
- keine kompletten Re-Renders des Charts bei Einzelbar-Updates
- stabile Interaction-Latency
- saubere Fehlerzustände statt stiller Nullpfade
- keine Race Conditions bei Market-/Timeframe-Wechsel
- kein Zustand, in dem Panels und Chart über verschiedene Instrumente sprechen
- kein Setting-Toggle ohne Runtime-Effekt
- kein Replay-Modus, der nur optisch existiert

---

## Was du explizit nicht tun darfst

- keinen neuen hübschen Parallelpfad eröffnen, wenn der alte kanonisiert werden muss
- keine falsche „AI kann alles“-Story bauen
- kein Profit- oder Erfolgsversprechen formulieren
- keine neue Doku schreiben, die den Code beschönigt
- keine halbfertigen Buttons stehen lassen
- keine vierte Chartimplementierung hinzufügen
- keinen neuen Feedpfad bauen, der am Eventkern vorbeigeht
- keine UI-Toggles einbauen, deren Zustand nirgends relevant ist
- keinen Research-/Forecasting-Layer als Kernsignal verkaufen
- keinen toten Legacy-Code als Produktfunktion tarnen

---

## Finales Lieferformat

Wenn du fertig bist, lieferst du **nicht nur Code**, sondern ein geordnetes, wahrheitsbasiertes Ergebnis.

## Erwartete Outputs
1. Codeänderungen im Repo
2. aktualisierte Tests/Smoke-Checks
3. ehrliche Dokumentationsupdates
4. kurzes Audit „was war kaputt / was wurde gefixt / was bleibt offen“
5. eine klare Liste aller geänderten Dateien
6. kurze Run-/Build-Anleitung
7. bekannte Restlimits, falls noch vorhanden
8. optional ein chronologisch nummeriertes Handoff-Paket / ZIP

## Schlussbericht muss enthalten
- reale Ausgangsprobleme
- exakt behobene Punkte
- nicht behobene Punkte
- technische Risiken
- Produktlücken
- wie man die neue Version lokal startet und prüft

---

## Letzte Prioritätsregel

Wenn du zwischen diesen Optionen wählen musst:

1. mehr Feature-Fläche,
2. schönere Optik,
3. echte funktionale Wahrheit,
4. korrekte Daten- und Chart-Semantik,

dann ist die Reihenfolge immer:

**4 → 3 → 2 → 1**

Erst Wahrheit.  
Dann Funktion.  
Dann Erlebnis.  
Dann Breite.

---

## Ultimative Arbeitsanweisung

Arbeite so, als würdest du ein Produkt retten, nicht nur Code verschönern.

Am Ende muss Arctis × AlgoView:
- sichtbar hochwertiger,
- fachlich ehrlicher,
- operativ klarer,
- interaktiv vollständiger,
- und für Trader spürbar nützlicher sein.

**Maxime:**  
Jeder sichtbare Einstieg, jede Bestätigung, jede Invalidation und jede theoretische Exit-Auflösung, die die Engine erkennt, muss im Chart, im Feed und im Kontext nachvollziehbar werden — ohne die Grenze zwischen Hilfe und falschem Profitversprechen zu verwischen.

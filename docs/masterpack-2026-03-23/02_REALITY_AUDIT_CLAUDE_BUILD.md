# Reality Audit — Was Claude aus dem alten Paket gemacht hat und was nicht

## Ausgangsfrage

Dieses Dokument beantwortet nicht: „Hat Claude viel gearbeitet?“

Es beantwortet: **„Was davon ist in Bezug auf den alten Masterprompt wirklich eingelöst, was nur halb und was gar nicht?“**

Der Maßstab ist dabei nicht Oberfläche, sondern:

- kanonische Datenführung,
- Rendering-Korrektheit,
- Realtime-Korrektheit,
- Produktwahrheit,
- AlgoView-Integration,
- SaaS-Reife.

## Gesamtnote

**Gesamtnote: teilweise erfüllt / deutlich verbessert / noch nicht produktreif**

Praktisch bedeutet das:

- **Fortschritt real:** ja
- **Fundament sauber:** nein
- **releasefähig:** nein
- **SaaS-ready:** nein
- **AlgoView-merge realisiert:** nein, nur minimal
- **erneuter autonomer Vollausbau sinnvoll:** ja, unbedingt

---

## 1. Was Claude klar sichtbar umgesetzt hat

### 1.1 Backend-Struktur ausgebaut
Im Vergleich zum Ausgangssnapshot gibt es jetzt:
- zusätzliche API-Routen,
- DB-bezogenen Zugriff,
- WebSocket-Transport,
- BIAS-Route,
- Feed-Route,
- Zonen-/Signalpfade,
- Replay-Ansätze.

**Bewertung:** realer Fortschritt

### 1.2 Frontend deutlich professioneller angelegt
Es existieren nun:
- App-Shell,
- Topbar,
- Right Panel,
- HUD,
- Chart-Toolbars,
- Replay-Bar,
- Settings-Flows,
- mehrere Analyse-Panels,
- Zustand-State.

**Bewertung:** realer Fortschritt

### 1.3 Dokumentation und Spezifikationsmasse massiv erhöht
Es gibt Architektur-, Limitations-, Acceptance- und Spec-Dokumente sowie Umsetzungspläne.

**Bewertung:** großer Dokumentationsfortschritt, aber nur teilweise wahrheitsgetreu

### 1.4 BIAS-/Regellogik erheblich ausgebaut
Die Methodik ist im Code weit stärker repräsentiert als im frühen Snapshot.

**Bewertung:** echter Zugewinn und guter Rohbau

---

## 2. Was nur teilweise umgesetzt wurde

### 2.1 „Alle Analysepfade lesen aus der DB“
**Teilweise wahr.**

Positiv:
- viele Pfade nutzen `fetch_bars_as_models()`.

Aber:
- `engine/src/arctis/routes/analysis.py` lädt in `_load_bars()` zuerst Simulation, dann `ParquetStore`, dann erst DB.
- Damit ist „DB first and only“ gerade **nicht** sauber erzwungen.

**Bewertung:** nur teilweise erfüllt

### 2.2 Dynamische Markt-/Kontraktlogik
**Teilweise wahr.**

Positiv:
- Backend liefert `/api/markets`
- DB kann verfügbare Symbole ermitteln

Aber:
- das Frontend nutzt in `app/src/store/market.ts` weiterhin eine harte `SYMBOL_MAP`
- `setMarket()` löst Kontrakte statisch auf
- damit bleibt die Front-Month-Logik oberflächlich und nicht end-to-end dynamisch

**Bewertung:** teilweise erfüllt, nicht kanonisch

### 2.3 Realtime/WebSocket
**Teilweise wahr.**

Positiv:
- es gibt `/ws/bars/{symbol}`
- Initial-Snapshot, Heartbeat und Broadcast-Loop sind vorhanden

Aber:
- der Kanal streamt rohe Symbol-Bars
- der Frontend-Hook verbindet symbolbasiert, nicht timeframe-korrekt
- bei aggregierten Timeframes wird kein sauberer Aggregations-Updatepfad sichergestellt

**Bewertung:** technische Grundlage vorhanden, fachlich noch nicht korrekt

### 2.4 Panels „live“
**Teilweise wahr.**

Positiv:
- viele Panels lesen jetzt aus Hooks und APIs statt aus offensichtlichen Demo-Platzhaltern

Aber:
- der Feed wird im Produkt aktuell nicht aus dem Backend-Feed bezogen, sondern clientseitig zusammengesetzt
- damit fehlt ein kanonischer Event-/Erklärungspfad

**Bewertung:** teilweise erfüllt

### 2.5 Rendering-Aufrüstung
**Teilweise wahr.**

Positiv:
- VWAP, EMA, Levels, Marker-Mechaniken und Zeichnen sind deutlich weiter

Aber:
- der primäre Chartpfad ist noch nicht produktionssauber
- der Chart wird bei `bars`-Änderungen neu aufgebaut
- BOS/CHoCH sind deaktiviert
- mehrere Drawing-Typen fehlen oder sind bewusst übersprungen

**Bewertung:** sichtbarer Fortschritt, aber nicht korrekt abgeschlossen

### 2.6 Replay
**Teilweise wahr.**

Positiv:
- Simulation/Replay ist im Backend vorhanden
- UI hat Replay-Bar und Datenabfrage

Aber:
- nicht alle Analysepfade respektieren denselben Replay-Kontext
- `bias.py` arbeitet direkt gegen DB statt gegen dieselbe Sim-/Replay-Wahrheit

**Bewertung:** Teilintegration, keine einheitliche Zeitwahrheit

---

## 3. Was nicht oder nicht ausreichend umgesetzt wurde

### 3.1 Eine einzige Produktwahrheit
Nicht erfüllt.

Aktuell existieren mehrere Wirklichkeiten:
- DB-Pfad,
- Parquet-Fallback,
- symbolische vs. root-basierte Auflösung,
- clientseitiger Feedaufbau,
- Replay-Wahrheit vs. Bias-Wahrheit.

Das ist mit einem Analyseprodukt unvereinbar.

### 3.2 Korrektes inkrementelles Chart-Rendering
Nicht erfüllt.

Der Build ist weiter als vorher, aber die entscheidende Produktionsregel wurde verfehlt:
**neue Bars müssen über inkrementelle Chart-Updates in einen stabilen Renderer laufen.**

Stattdessen wird noch rekonstruiert.

### 3.3 Vollständige AlgoView-Merge
Nicht erfüllt.

Der aktuelle Build zeigt AlgoView praktisch nur in Breadcrumb/CSS-Kontext.
Es fehlt die eigentliche Verschmelzung:
- marktübergreifender Radar,
- Ranking,
- Watchlist-Scanning,
- Opportunity Queue,
- Cross-Asset-Kontextfluss,
- Team-/Workspace-Modell.

### 3.4 SaaS-Reife
Nicht erfüllt.

Es gibt:
- keine echte Nutzer-/Org-/Role-Architektur,
- keine Billing-/Metering-Logik,
- keine Entitlements,
- kein Admin-/Tenant-Modell,
- keine SaaS-Betriebs- und Compliance-Schicht.

### 3.5 Ehrliche Akzeptanzführung
Nicht erfüllt.

Die Doku behauptet mehrfach Zustände, die der Code nicht deckt.
Das ist ein Governance-Fehler.

---

## 4. Bewertung gegen die alte Entwicklungslogik

## Phase 0 — Audit und Truth Baseline
**Teilweise umgesetzt, aber nicht stabil gehalten**

Es wurden Issues und Dokus erzeugt.
Aber die daraus abgeleitete Dokumentation blieb nicht konsistent mit dem späteren Code.

## Phase 1 — Datenkorrektheit
**Teilweise umgesetzt**

Besser als vorher:
- DB-Layer vorhanden
- Aggregation verbessert
- Symbolerkennung besser

Nicht sauber gelöst:
- einheitliche Datenquelle
- tabellarische Konsistenz (`bars` vs. `ohlcv_1m`)
- vollständige Contract-Wahrheit

## Phase 2 — REST/WS-Verträge
**Teilweise umgesetzt**

Positiv:
- echte Routen
- WS-Endpunkt
- Hook-Grundlage

Fehlend:
- kanonische Contracts
- sauberer Subscriptions-Mechanismus
- timeframe-korrekte Live-Aggregation

## Phase 3 — Frontend-Kanonisierung
**Teilweise umgesetzt**

Positiv:
- Zustand-State
- modernisierte Shell
- Hook-Landschaft

Fehlend:
- ein einziger API-Client überall
- keine harten URLs
- keine statische Symbolauflösung
- kein gesäuberter Canonical Path

## Phase 4 — Charting
**Teilweise umgesetzt**

Positiv:
- Overlays deutlich ausgebaut

Fehlend:
- inkrementelles Update
- vollständige Marker- und Zeichenlogik
- Rendering-Korrektheit auf Produktionsniveau

## Phase 5 — Live Panels / Feed
**Teilweise umgesetzt**

Panels sind näher an Live-Daten.
Aber der Feed ist nicht als kanonische Backend-Event-Engine wirklich im UI verankert.

## Phase 6 — Probability / Forecasting
**Teilweise umgesetzt**

Positiv:
- Probability ist nicht mehr so isoliert wie früher
- Regelbaselines sind vorhanden

Fehlend:
- Benchmark-Harness in Produktnähe
- Evaluationsvertrag
- echtes Research-to-Product-Gate
- differenzierte Forecast-/Scenario-Produktisierung

## Phase 7 — Plattformweiterbau
**Nicht wirklich umgesetzt**

Die Plattformseite (AlgoView, Teams, Radar, Workspaces, SaaS) ist weitgehend offen.

## Phase 8 — QA / Release / Handoff
**Nicht erfüllt**

Der entscheidende Fehler:
Die Dokumentation signalisiert weitergehende Reife, als in dieser Umgebung verifiziert werden konnte.

---

## 5. Die härtesten Widersprüche im aktuellen Build

### Widerspruch A
**Acceptance-Matrix: „Alle Analysepfade aus DB“**  
vs.  
**Code: Parquet-Fallback in `routes/analysis.py`**

### Widerspruch B
**Architektur-Doku: „inkrementelles Chart.update()“**  
vs.  
**Code: Chart-Recreation auf `bars`-Änderung**

### Widerspruch C
**Architektur-Doku: `routes/markets.py` / `routes/config.py`**  
vs.  
**Code: Märkte in `main.py`, Config in `routes/risk.py`**

### Widerspruch D
**„FeedPanel wired to live endpoint“**  
vs.  
**App: clientseitig aus anderen Responses gebaut**

### Widerspruch E
**„dynamic market selector“**  
vs.  
**Frontend: harte Symbol-Map**

### Widerspruch F
**„SQLAlchemy async“ / lokale Entwicklungsarchitektur**  
vs.  
**Code: synchrones `create_engine`**

---

## 6. Was am aktuellen Build bewahrt werden sollte

Nicht alles neu schreiben.

Folgende Assets sind wertvoll und sollten als Rohbau erhalten bleiben:

### Backend
- DB-Modul als Grundbasis
- Analysis-Routes
- BIAS-Module
- WS-Connection-Manager
- Feed-/Signals-/Zones-Ansätze
- Replay-Mechanik als Startpunkt

### Frontend
- App-Shell und Layout
- Zustand-State als Richtung
- Panel-Landschaft
- Topbar/HUD/Replay-Bar
- Chart-Toolbars
- Teile der LWC-Integration

### Spezifikation
- vorhandene PRD-/Spec-Masse als Materialbasis
- Issue-Register und Known Limitations als Ausgangsmaterial
- erste Acceptance-Matrix als Referenz, nicht als Wahrheit

---

## 7. Was neu gedacht oder hart refaktoriert werden muss

### 7.1 Canonical market contract layer
Root, Contract, Symbol, Timeframe, Session und Replay-Zeit müssen überall dieselbe Semantik haben.

### 7.2 Canonical event & explanation layer
Feed, Markierungen, Erklärungen und Alerts müssen aus einem gemeinsamen Event-/Context-Modell stammen.

### 7.3 Chart lifecycle
Nur ein primärer Chartpfad. Nur inkrementelle Updates. Keine Re-Creation auf jedem Tick/Bar-Update.

### 7.4 AlgoView-Merge
AlgoView darf nicht ein Label sein, sondern die Radar-/Universe-/Scanner-Schicht des Produkts.

### 7.5 SaaS control plane
Organisationen, Rollen, Billing, Entitlements, Observability, Audit, Support und Deployment müssen als eigene Plattformschicht gebaut werden.

---

## 8. Reifegrad nach Themenfeld (Schätzung)

| Bereich | Reifegrad | Kommentar |
|---|---:|---|
| Backend Analyse-Logik | 65% | viele Module vorhanden, aber nicht überall kanonisch |
| DB-Anbindung | 60% | viel besser als im Snapshot, aber noch inkonsistente Wahrheit |
| Realtime | 40% | Transport existiert, fachliche Korrektheit nicht durchgehend |
| Frontend Integration | 55% | deutlicher Fortschritt, aber noch harte Mismatches |
| Chart Rendering | 35% | mehr Features, aber falscher Lifecycle |
| Feed / Explanation | 30% | Ansätze da, aber nicht als zentraler Produktpfad |
| Replay-Konsistenz | 45% | rudimentär vorhanden, nicht überall synchron |
| AlgoView-Merge | 10% | aktuell fast nur Branding |
| SaaS Readiness | 5% | praktisch offen |
| QA / Release Truthfulness | 25% | Doku überzieht den Ist-Stand |

---

## 9. Schlussbewertung für die nächste Runde

Der richtige Schluss aus Claudes Output ist **nicht**:
„er hat es nicht geschafft, also alles verwerfen“.

Der richtige Schluss ist:
„er hat genug Rohbau geliefert, um jetzt den echten Produktkern und die Plattformschicht aufzusetzen — aber nur mit einem härteren, wahrheitsbasierten und SaaS-orientierten Steuerungsdokument.“

Genau dafür ist dieses Masterpack gebaut.
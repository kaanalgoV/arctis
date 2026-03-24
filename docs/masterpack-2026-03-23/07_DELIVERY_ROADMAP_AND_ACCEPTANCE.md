# Delivery Roadmap & Acceptance — Arctis × AlgoView

## 1. Grundsatz

Die nächste Runde darf nicht feature-chaotisch laufen.

Sie braucht:
- harte Phasen,
- harte Gates,
- klare Output-Artefakte,
- und eine unmissverständliche Reihenfolge.

---

## 2. Reihenfolgeprinzip

Die Reihenfolge ist nicht austauschbar.

### Zuerst
- Wahrheit
- Datenverträge
- Chart-/Realtime-Korrektheit
- Dokumentations-Ehrlichkeit

### Dann
- Radar / Context Engine / Explanation Layer

### Dann
- Workspace-/Journal-/Alert-Flows

### Dann
- SaaS Control Plane

### Dann
- Forecasting-/ML-Härtung
- Skalierung
- Enterprise-Optionen

---

## 3. Phasenmodell

## Phase 0 — Truth Reset
### Ziel
Aus dem aktuellen Build eine ehrliche Arbeitsgrundlage machen.

### Deliverables
- aktualisiertes Issue Register
- aktualisierte Acceptance Matrix
- verifizierte Repo-Landkarte
- Liste „preserve vs rewrite“
- konsolidierte Contracts

### Gate
Kein GREEN ohne Datei-/Test-/Runtime-Evidenz.

---

## Phase 1 — Canonical Market/Data Layer
### Ziel
Eine Datenwahrheit herstellen.

### Muss enthalten
- root/contract/instrument-domain sauber
- canonical fetch API
- health/readiness mit echtem Schema-Check
- klare Tabellen-/View-Semantik
- kein stiller Parquet-Seitenpfad für produktive Analysen
- Live und Replay mit explizitem Kontextzeitpunkt

### Gate
Chart, Feed, Panels, Alerts und Replay können denselben Zustand referenzieren.

---

## Phase 2 — Realtime & Chart Correctness
### Ziel
Den Live- und Rendering-Pfad produktionstauglich machen.

### Muss enthalten
- timeframe-korrekte Live-Pipeline
- inkrementelle Chart-Updates
- kanonische Chart-Entities
- korrekte Marker- und Zonenlogik
- ein primärer Chartpfad
- WS-Subscriptions mit eindeutiger Semantik

### Gate
Kein Re-Creation-Lifecycle mehr auf neuen Bars.

---

## Phase 3 — Context Engine v1
### Ziel
Auto-Marking, Ereignisse und Erklärungen in ein gemeinsames System überführen.

### Muss enthalten
- Context Objects
- Event-Timeline
- Explanation Contract
- Priority-Score
- Invalidation-Felder
- Why-now / Why-here / confirms / invalidates

### Gate
Jede wichtige Markierung ist über Objekt-ID, Event-ID und Erklärung referenzierbar.

---

## Phase 4 — AlgoView Radar Integration
### Ziel
AlgoView zur echten Radar-/Scanner-/Queue-Schicht machen.

### Muss enthalten
- Watchlists
- Ranking
- Opportunity Queue
- Multi-Instrument-Scoring
- Sprung in Arctis Workspace
- Radar-Filter und Saved Views

### Gate
AlgoView ist nicht mehr nur Branding, sondern eigener produktiver Arbeitsmodus.

---

## Phase 5 — Workspace, Feed, Alerts
### Ziel
Arbeitsfluss und Reaktionsfähigkeit herstellen.

### Muss enthalten
- echter Feed aus Backend/Event-Layer
- Alert Rules
- Delivery-History
- dedupe/cooldown
- Kontextverlinkung Chart ↔ Feed ↔ Erklärung
- gespeicherte Workspace-Layouts

### Gate
Ein Alert kann reproduzierbar zu Event, Erklärung und Chartzustand zurückverfolgt werden.

---

## Phase 6 — Replay, Review, Journal
### Ziel
Lernfähigkeit und methodische Nachvollziehbarkeit bauen.

### Muss enthalten
- deterministisches Replay
- decision checkpoints
- Journal Entry linking
- Review Sessions
- Playbook-Verknüpfung
- Team-Review-Fähigkeit

### Gate
Ein historischer Entscheidungszeitpunkt lässt sich mit denselben Regeln rekonstruieren.

---

## Phase 7 — SaaS Control Plane
### Ziel
Mandanten-, Nutzer- und Geschäftsmodell-Schicht aufbauen.

### Muss enthalten
- auth
- orgs
- roles
- invitations
- entitlements
- usage metering
- billing skeleton
- admin area
- audit logs

### Gate
Das Produkt lässt sich tenantsicher für mehrere Orgs betreiben.

---

## Phase 8 — Product Analytics, Flags, Observability
### Ziel
Betriebsfähigkeit herstellen.

### Muss enthalten
- feature flags
- remote config
- tracing
- metrics
- logs
- session replay / analytics
- alerting für Betriebsfehler
- rollout and rollback rules

### Gate
Neue riskante Features können tenant- oder segmentbasiert kontrolliert aktiviert werden.

---

## Phase 9 — Forecasting & Evaluation Layer
### Ziel
Forschung produktisierbar machen, ohne Unsinn zu shippen.

### Muss enthalten
- benchmark harness
- baseline registry
- model registry
- walk-forward evaluation
- score reporting
- product gating
- prediction UX rules

### Gate
Kein Modelloutput ohne Benchmark, Uncertainty und Invalidation.

---

## Phase 10 — Scale, Security, Enterprise Readiness
### Ziel
Skalierungs- und Enterprise-Grundlagen schaffen.

### Muss enthalten
- SSO/SAML-Vorbereitung
- RLS/tenant isolation review
- rate limiting
- secret hygiene
- retention policies
- export/delete flows
- webhooks/API keys
- ops runbooks

### Gate
Es existiert ein glaubwürdiger Pfad zu Enterprise-Betrieb.

---

## 4. Preserve / Rewrite / Delete

## Preserve
- große Teile der Analysemodule
- BIAS-Rohbau
- WS-Grundlage
- App-Shell
- Panel-Landschaft
- Teile des Chartings
- vorhandene Specs als Inputmaterial

## Rewrite
- market/symbol/contract resolution
- useMarketData + WS semantics
- chart lifecycle
- feed integration
- replay-consistency
- api client and env config
- docs that overclaim completeness

## Delete oder stilllegen
- veraltete/historische Doku-Claims als aktuelle Wahrheit
- parallele Frontend-Pfade, die nicht kanonisch sind
- totes Chart-/Dashboard-Duplikat, wenn es nicht zum Canonical Path gehört

---

## 5. Konkreter 30/60/90-Tage-Plan

## Tage 1–30
Schwerpunkt: Wahrheit und Korrektheit
- Phase 0 und 1 abschließen
- Phase 2 anstoßen
- Realtime + Chart korrekt machen
- Doku und Acceptance Matrix bereinigen

### Erfolgsbild
Die Plattform zeigt live und im Replay denselben fachlich korrekten Zustand.

## Tage 31–60
Schwerpunkt: Produktkern
- Context Engine v1
- echter Feed
- Erklärungen
- AlgoView Radar
- Alerts
- Workspace-Verlinkung

### Erfolgsbild
Die Plattform priorisiert Märkte, markiert Setups und erklärt sie konsistent.

## Tage 61–90
Schwerpunkt: SaaS- und Lernschicht
- Org/Roles/Billing skeleton
- Journal/Replay/Review
- Feature Flags / Analytics / Tracing
- Admin-/Entitlement-Basis

### Erfolgsbild
Aus einem starken Analysewerkzeug wird ein SaaS-fähiges Produkt.

---

## 6. Risikoregister

## R1 — Dokumentation läuft dem Code wieder davon
### Gegenmaßnahme
- evidence-first acceptance
- no GREEN without file + runtime proof
- weekly doc truth review

## R2 — Featuredrang vor Datenwahrheit
### Gegenmaßnahme
- freeze on new features until canonical path stable
- PR template with truth impact

## R3 — WS/Realtime bleibt symbolisch statt fachlich korrekt
### Gegenmaßnahme
- explicit subscription schema
- timeframe-aware live aggregation contract
- deterministic tests

## R4 — AlgoView wird wieder nur Branding
### Gegenmaßnahme
- separate deliverables for radar, queue, ranking and watchlists
- no “merge done” until cross-instrument flows exist

## R5 — SaaS wird zu spät bedacht
### Gegenmaßnahme
- tenant-aware IDs and tables from the start
- org/workspace/entitlement model early
- avoid local-only assumptions in new APIs

## R6 — Forecasting erzeugt falsche Produktversprechen
### Gegenmaßnahme
- strict prediction gate
- baseline before model
- uncertainty always visible
- no hard claims without evaluation

---

## 7. Abnahmekriterien nach Artefakt

## Für Backend-Arbeit
- explizite Route-Contracts
- schema-stabile Responses
- tests für edge cases
- replay/live parity tests
- no hidden fallbacks

## Für Frontend-Arbeit
- keine harten URLs
- ein API-/WS-Client
- एक kanonischer Chartpfad
- query/cache strategy
- graceful degraded states

## Für Context/Explanation
- Objekt-ID + Event-ID + Explanation-ID
- evidence links
- invalidation field
- clear severity/priority semantics

## Für SaaS
- org-aware persistence
- role checks
- entitlement checks
- audit logs on admin-sensitive actions
- billing/meter events testbar

---

## 8. Exit-Kriterien für „SaaS-ready Beta“

Das Produkt darf erst als SaaS-ready Beta gelten, wenn mindestens folgendes erfüllt ist:

### Produkt
- Radar + Workspace + Alerts + Replay + Journal funktionieren zusammen

### Architektur
- canonical data path
- canonical explanation path
- tenant-aware persistence
- feature flag controlled rollout

### Betrieb
- traces/metrics/logs
- session replay / analytics
- error monitoring
- alerting on system health

### Geschäft
- mindestens ein Planmodell
- active entitlements
- usage metrics
- billing lifecycle skeleton

### Vertrauen
- keine übergriffigen AI-Behauptungen
- Erklärungen mit Evidenz
- saubere Doku
- belastbare Acceptance Matrix

---

## 9. Minimum lovable product vs. Beta vs. v1

## MLP
- live chart workspace
- auto-marking basics
- explanation basics
- radar watchlist
- alert basics
- replay basics

## SaaS Beta
- orgs, roles, workspaces
- billing skeleton
- analytics + flags + tracing
- journal/review
- admin basics

## v1
- richer ranking
- advanced context graph
- mature team flows
- better forecasting/evaluation
- enterprise controls

---

## 10. Schlussfolgerung

Die Delivery-Reihenfolge ist eindeutig:

**Wahrheit → Realtime/Chart → Context Engine → AlgoView Radar → Alerts/Replay/Journal → SaaS Control Plane → Observability → Forecasting → Enterprise.**

Jede Abweichung davon erhöht die Wahrscheinlichkeit, dass erneut viel Oberfläche gebaut wird, aber kein belastbares Produkt entsteht.
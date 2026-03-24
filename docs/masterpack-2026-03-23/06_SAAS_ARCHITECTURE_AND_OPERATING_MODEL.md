# SaaS Architecture & Operating Model — Arctis × AlgoView

## 1. Architekturprinzip

Die Plattform besteht aus zwei sichtbaren Produktflächen und einem gemeinsamen Kern:

- **AlgoView** = Radar / Market Universe / Ranking / Opportunity Queue
- **Arctis** = Deep Workspace / Chart / Explanation / Replay / Journal
- **Shared Core** = Context Engine + Tenant/Workspace/Billing/Observability

Das Ziel ist **nicht** ein loser Monolith aus vielen Endpunkten, sondern eine klare Schichtung.

---

## 2. Zielleitlinien

### L1 — eine Wahrheit pro Marktzustand
Chart, Feed, Alerts, Erklärung und Replay müssen aus derselben Event- und Kontextwirklichkeit stammen.

### L2 — descriptive first, predictive second
Deskriptive Markierungen und Kontextisierung sind das Produktionsfundament.
Forecasting/Probability ist eine getrennte, benchmarkte Schicht.

### L3 — tenant-aware by design
Jede persistente Domänenentität kennt von Anfang an:
- `org_id`
- `workspace_id` (wo relevant)
- `created_by`
- `visibility`
- `entitlements`

### L4 — explainability as a first-class object
Eine Erklärung ist kein UI-Textfragment, sondern ein versioniertes Artefakt mit Evidenzen, Referenzen und Invalidation.

### L5 — event-driven, but not event-chaotic
Wichtige Zustandswechsel werden als Events modelliert, aber mit sauberem Schema, Idempotenz und Deduplizierung.

---

## 3. Zielarchitektur in Schichten

## Schicht A — Client Experience Layer
### Web App
- Radar Views
- Workspace Views
- Admin / Billing / Settings
- Journal / Replay / Playbooks
- Alert Center

### Optional später
- Mobile companion
- Desktop shell
- embedded widgets

## Schicht B — Experience API / BFF
Ein kanonischer API-Layer:
- auth-aware
- tenant-aware
- shape-stable
- versioniert
- kein Wildwuchs lokaler `fetch()`-Calls

## Schicht C — Domain Services
- Market Data Service
- Analysis Service
- Context Graph Service
- Explanation Service
- Alerting Service
- Replay Service
- Journal / Playbook Service
- Usage / Billing / Entitlement Service
- Admin / Org / Membership Service

## Schicht D — Intelligence / Research
- rule engine
- ranking engine
- scenario engine
- forecasting research gateway
- benchmark / evaluation harness
- model registry

## Schicht E — Platform Foundation
- auth / orgs / roles
- payments / billing / meters
- feature flags / remote config
- analytics / session replay
- tracing / logs / metrics
- secrets / config
- queues / workers
- databases / object storage

---

## 4. Domänenmodell

## 4.1 Identity & Tenant
### Organization
- `org_id`
- `name`
- `plan`
- `billing_customer_id`
- `status`
- `settings`

### User
- `user_id`
- `email`
- `display_name`
- `status`

### Membership
- `org_id`
- `user_id`
- `role`
- `permissions[]`

### Workspace
- `workspace_id`
- `org_id`
- `name`
- `type` (personal, shared, team, review)
- `settings`

## 4.2 Market Domain
### Instrument
- `instrument_id`
- `root`
- `contract_symbol`
- `venue`
- `asset_class`
- `tick_size`
- `metadata`

### Market Snapshot
- `snapshot_id`
- `instrument_id`
- `timeframe`
- `snapshot_ts`
- `source_revision`

### Session Context
- `session_id`
- `instrument_id`
- `session_type`
- `regime`
- `opening_range`
- `reference_levels`

## 4.3 Analysis / Context Domain
### Context Event
- `event_id`
- `org_id`
- `instrument_id`
- `timeframe`
- `event_type`
- `severity`
- `priority_score`
- `timestamp`
- `dedupe_key`
- `payload`

### Context Object
- `object_id`
- `object_type`
- `instrument_id`
- `timeframe`
- `state`
- `detected_at`
- `expires_at`
- `evidence_refs[]`
- `chart_refs[]`

### Explanation
- `explanation_id`
- `object_id`
- `short_text`
- `long_text`
- `evidence_summary`
- `why_now`
- `why_here`
- `what_confirms`
- `what_invalidates`
- `scenarios`
- `version`

### Alert Rule
- `alert_rule_id`
- `org_id`
- `workspace_id`
- `target_scope`
- `trigger_definition`
- `cooldown`
- `channels[]`

### Alert Delivery
- `delivery_id`
- `alert_rule_id`
- `fired_at`
- `status`
- `channel`
- `dedupe_key`

## 4.4 Learning Domain
### Journal Entry
- `entry_id`
- `org_id`
- `workspace_id`
- `instrument_id`
- `context_refs[]`
- `decision`
- `outcome`
- `notes`
- `attachments`

### Playbook
- `playbook_id`
- `org_id`
- `name`
- `rules`
- `example_refs[]`

### Review Session
- `review_id`
- `workspace_id`
- `replay_range`
- `decision_points[]`
- `score`

## 4.5 SaaS Domain
### Entitlement
- `org_id`
- `feature_key`
- `limit_type`
- `limit_value`
- `usage_window`

### Usage Meter Event
- `meter_event_id`
- `org_id`
- `feature_key`
- `quantity`
- `occurred_at`
- `source`

### Billing Subscription
- `org_id`
- `provider_subscription_id`
- `plan_key`
- `status`
- `renewal_at`

---

## 5. Serviceverantwortungen

## 5.1 Market Data Service
Verantwortlich für:
- symbol/root/contract truth
- historical fetch
- timeframe aggregation
- live subscriptions
- session calendars
- data quality validation

### Nicht verantwortlich für
- textuelle Erklärung
- Ranking-Entscheidungen
- Billing oder Nutzerkontext

## 5.2 Analysis Service
Verantwortlich für:
- Sessions
- Structure
- Confluence
- Volume
- Bias
- Zones
- Signals
- baseline probability

### Output
Nur strukturierte Datenobjekte und Events, keine UI-spezifischen Strings als Primärformat.

## 5.3 Context Graph Service
Verantwortlich für:
- Korrelation und Verlinkung von Events
- Multi-Timeframe-Zusammenhang
- Priorisierung
- Objektlebenszyklen
- De-/Reaktivierung von Kontextobjekten

## 5.4 Explanation Service
Verantwortlich für:
- narrative Synthese
- standardisierte Erklärstrukturen
- Evidenzzusammenfassung
- Why-now / Invalidation / Scenario output
- Versionierung der Erklärungen

## 5.5 Alerting Service
Verantwortlich für:
- Regeln
- Trigger
- Deduplication
- Cooldowns
- Delivery
- Alert Inbox / history

## 5.6 Replay Service
Verantwortlich für:
- zeitschnittfeste Reproduktion
- historisch begrenzte Kontextberechnung
- deterministische UI-Wahrheit im Replay

## 5.7 Workspace / Journal / Playbook Service
Verantwortlich für:
- Persistenz von Nutzerwissen
- Shared Context
- Review-Flows
- Team-Lernartefakte

## 5.8 SaaS Control Plane
Verantwortlich für:
- Org / Membership / Roles
- Entitlements
- Billing
- Metering
- Audit Logs
- adminseitige Steuerung

---

## 6. Canonical Contracts, die zwingend existieren müssen

## Contract 1 — Instrument Identity
Jeder Request, jedes Event und jedes Persistenzobjekt muss sauber zwischen
- root,
- contract,
- instrument id,
- timeframe
unterscheiden.

Nie wieder implizit:
- mal `NQ`,
- mal `NQH6`,
- mal „market“,
- mal „symbol“,
ohne klare Semantik.

## Contract 2 — Live/Replay Truth
Jede Analyse kann sowohl gegen „live now“ als auch gegen „historical replay now“ laufen.
Der Kontextzeitpunkt muss explizit sein.

## Contract 3 — Chart Entity Contract
Jede Markierung auf dem Chart ist ein referenzierbares Objekt, nicht ein lose gemalter Pixelrest.

## Contract 4 — Explanation Contract
Erklärungen haben Mindestfelder:
- subject
- evidence
- context
- priority
- scenario
- invalidation
- confidence / uncertainty

## Contract 5 — Tenant/Visibility Contract
Jedes Objekt weiß:
- wem es gehört,
- wer es sehen darf,
- ob es shared oder privat ist.

---

## 7. Multi-Tenancy-Modell

## Organisationszentriert
Der Mandant ist die **Organization**.
Ein Nutzer kann in mehreren Organisationen Mitglied sein.

## Isolation
Alle geschäftsrelevanten Persistenzobjekte tragen `org_id`.
Zusätzlich:
- RLS oder äquivalente Isolation auf Datenbankebene
- API-Scopes nur innerhalb des aktiven Org-Kontextes
- Workspace-Zugriff zusätzlich rollen- oder objektbasiert

## Rollenbeispiele
- Owner
- Admin
- Trader
- Analyst
- Coach / Reviewer
- Read Only
- Billing Admin

## Objekt-Sichtbarkeit
- private
- workspace
- organization
- share link / external review (später, kontrolliert)

---

## 8. Billing-, Metering- und Entitlement-Modell

## Billing-Grundidee
Das Produkt kann sinnvoll hybrid monetarisiert werden:
- seat-based
- usage-based
- plan-based feature gating

## Potenzielle Meter
- aktive Seats
- AI-Explanation Credits
- Alert Firings / active alert rules
- gespeicherte Workspaces / Watchlists
- Replay-/Review-Jobs
- API/Webhook-Nutzung

## Entitlement-Prinzip
UI darf Features nicht nur „ausblenden“, sondern muss den aktiven Entitlement-Zustand kennen.

Beispiel:
- Solo: keine Team-Workspaces
- Pro: mehr Alerts / längere Retention
- Team: Rollen, Shared Playbooks, Audit Logs
- Enterprise: SSO, SCIM, Webhooks, SLA

---

## 9. Eventing-Modell

## Warum Eventing?
Weil Markierungen, Alerts, Feed und Erklärungen zeitliche Artefakte sind.

## Eventtypen
- `market.snapshot.updated`
- `analysis.structure.changed`
- `analysis.bias.changed`
- `analysis.signal.detected`
- `context.object.created`
- `context.object.updated`
- `explanation.generated`
- `alert.fired`
- `journal.entry.created`
- `billing.usage.recorded`

## Regeln
- idempotent erzeugbar
- dedupe-fähig
- mit `trace_id` und `source_revision`
- keine UI-only Events als Primärquelle

## Technische Umsetzung
- Outbox-Pattern für zuverlässiges Event-Publishing
- Worker/Queue für teurere Verarbeitung
- klare Retry-/Dead-letter-Strategie

---

## 10. Datenhaltung

## Primäre Stores
### Time-series / Market Data
- Timescale / TigerData-kompatible Time-Series-DB

### Relationale Applikationsdaten
- PostgreSQL für SaaS-/App-Domänen

### Objekt-/Blob-Storage
- Screenshots
- Journal Attachments
- Export-Artefakte

### Optional Search / Analytics Layer
- für Volltextsuche, Feed-/Audit-Analyse, Produkttelemetrie

## Persistenzstrategie
- Market Data getrennt von App-Domain-Daten
- aber gemeinsame referenzierbare IDs für Instrumente und Zeitkontexte

---

## 11. Frontend-Zielarchitektur

## Ein kanonischer Client
Kein verstreutes `fetch()` in beliebigen Komponenten.
Es gibt:
- API client
- query/cache layer
- websocket client
- auth/tenant-aware headers
- error + retry policy

## State-Schichten
### Global app state
- aktiver org
- aktiver workspace
- aktives instrument
- timeframe
- routing / UI prefs

### Server state
- snapshots
- analysis data
- context objects
- explanations
- alerts

### Local interaction state
- modal state
- chart tool interaction
- transient filters

## Chart-Grundsatz
- ein primärer Chartpfad
- incremental updates only
- chart entities referenzieren Context Objects / Alerts / Explanations

---

## 12. Observability und Betriebsmodell

## Was gemessen werden muss
- Latenz pro Endpoint
- Event lag
- WS disconnect rates
- chart update latency
- explanation generation latency
- alert delivery success
- tenant-level usage
- feature adoption
- error budgets

## Telemetrie-Schichten
- traces
- metrics
- logs
- product analytics
- session replay
- error tracking

## Warum
Weil ein SaaS-Produkt nicht nur „funktionieren“ muss.
Es muss auch:
- beobachtbar,
- rollbar,
- debuggbar,
- und planbar sein.

---

## 13. Security-Grundlagen

## Muss von Anfang an hinein
- AuthN/AuthZ
- rollenbasierte Zugriffskontrolle
- secret management
- rate limiting
- audit logging
- secure defaults
- TLS überall
- sensible Datenmaskierung in Telemetrie
- sichere Dateiuploads
- admin actions auditierbar

## Später, aber früh vorbereiten
- SSO / SAML
- SCIM
- IP allowlists
- retention policies
- export / deletion workflows

---

## 14. Delivery-Modell und Environments

## Environments
- local
- dev
- staging
- prod

## Pflicht-Gates
- migrations vor app rollout
- schema compatibility
- seeded demo/smoke environment
- smoke suites
- rollback plan
- feature-flag rollout statt blindem Merge

## Deployment-Grundsatz
Neue Funktionen werden nicht „einfach veröffentlicht“, sondern:
- hinter Flags,
- tenant-segmentiert,
- beobachtbar,
- rollbackbar.

---

## 15. Technologieempfehlungen im Operating Model

## Auth / Organizations
Ein B2B-/teamfähiges Organisationsmodell muss Rollen, Mitgliedschaften, aktive Orgs und org-spezifische Rechte sauber unterstützen.

## Billing / Metering
Usage-based und seat-based Billing müssen nicht manuell improvisiert werden.  
Das Produkt braucht ein sauberes Meter-Ereignismodell.

## Feature Flags / Remote Config
Weil Arctis × AlgoView viele riskante Analyse- und AI-Features haben wird, ist feature-flag-gesteuerter Rollout Pflicht.

## Product Analytics / Session Replay
Um UX-Reibung und Fehlinterpretation komplexer Kontexte zu verstehen, braucht das Produkt Analytics und gezielt einsetzbares Session Replay.

## OpenTelemetry / Tracing
Die Multi-Service- und Event-Architektur braucht Traces; sonst werden Live-, Alert- und Explanation-Probleme im Betrieb undebuggbar.

---

## 16. Was „SaaS-ready“ in diesem Projekt wirklich bedeutet

SaaS-ready heißt hier **nicht**:

- „läuft auf einem Server“,
- „hat eine Login-Seite“,
- „man könnte später mal Teams ergänzen“.

SaaS-ready heißt:

- tenant-aware Datenmodell,
- echte Rollen und Memberships,
- Billing + Metering,
- Entitlements,
- Auditierbarkeit,
- sichere Admin-Funktionen,
- Observability,
- kontrollierbare Rollouts,
- verlässliche Betriebs- und Qualitätsgates.

---

## 17. Architektur-Schlussfolgerung

Die richtige Zielarchitektur für Arctis × AlgoView ist:

- **markt- und kontextgetriebener Kern**
- plus **SaaS control plane**
- plus **Radar/Workspace-Dualität**
- plus **erklärbare Intelligence-Schicht**
- plus **stabile Observability und Delivery-Mechanik**

Erst damit wird aus dem aktuellen Rohbau ein echtes Produkt.
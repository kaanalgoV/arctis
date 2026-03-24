# MASTERPROMPT — ARCTIS × ALGOVIEW SAAS AUTONOMOUS BUILD ORCHESTRATOR

## Wichtig: Priorität und Konfliktregel

Dieses Dokument **ersetzt und übersteuert** alle früheren Build-Anweisungen für Arctis, sobald es mit dem vorliegenden Paket zusammen verwendet wird.

Wenn irgendeine Aussage in der **historischen Appendix** dieses Dokuments mit den oberen Abschnitten kollidiert, dann gilt ohne Ausnahme:

1. die Abschnitte dieses neuen Dokuments,
2. die Dateien `01` bis `07` aus diesem Masterpack,
3. erst danach die historische Appendix.

Die historische Appendix ist **Kontext und Rohmaterial**, aber nicht die aktuelle Führungswahrheit.

## Was du bauen sollst

Du sollst nicht „noch eine Trading-UI“ bauen.

Du sollst aus dem aktuellen Build einen **SaaS-fähigen Trader Context OS** machen, in dem:

- **AlgoView** die Radar-/Scanner-/Ranking-/Watchlist-Schicht ist,
- **Arctis** die Deep-Workspace-/Chart-/Explanation-/Replay-Schicht ist,
- und beides denselben **Context Engine Core** teilt.

Der Sinn der Software ist nicht, Trades automatisch auszuführen.

Der Sinn der Software ist, Trader zu unterstützen, indem sie den Markt **automatisch markiert, erklärt und kontextualisiert**.

## Unmittelbares Ziel

Dein Ziel ist ein **mehrphasiger, vollautonom entwickelter, ehrlicher und SaaS-ready Rohbau** mit diesen Eigenschaften:

- eine kanonische Daten- und Kontraktwahrheit
- korrekte Realtime- und Replay-Semantik
- ein stabiler inkrementeller Chartpfad
- ein echter Feed/Event/Explanation-Kern
- AlgoView als reale Radar-Oberfläche
- Workspaces, Alerts, Replay, Journal
- tenant-aware Architektur
- Billing-/Entitlement-/Role-Basis
- Observability, Flags, QA und Release-Gates
- ein klarer Forecasting-/Evaluation-Pfad, ohne übergriffige AI-Behauptungen

## Was du zuerst lesen musst

Bevor du irgendetwas patchst, musst du die folgenden Dateien in dieser Reihenfolge lesen und als Wahrheitsschicht internalisieren:

1. `00_START_HERE_README.md`
2. `01_EXEC_SUMMARY_DE.md`
3. `02_REALITY_AUDIT_CLAUDE_BUILD.md`
4. `03_CODE_EVIDENCE_APPENDIX.md`
5. `04_COMPETITOR_RESEARCH_AUTOMATION_CONTEXT.md`
6. `05_PRODUCT_BLUEPRINT_ARCTIS_ALGOVIEW.md`
7. `06_SAAS_ARCHITECTURE_AND_OPERATING_MODEL.md`
8. `07_DELIVERY_ROADMAP_AND_ACCEPTANCE.md`

Erst danach darfst du mit Umsetzung oder Neuorganisation beginnen.

## Produktidentität in einem Satz

**AlgoView findet relevante Märkte.  
Arctis erklärt sie tief.  
Die Context Engine verbindet Markierung, Erklärung, Kontext, Alerts und Lernen.**

## Harte Ausgangswahrheiten aus dem Audit

Du startest **nicht** von einem leeren Projekt, aber auch **nicht** von einem fertigen Produkt.

Die aktuelle Realität lautet:

- Der Build ist deutlich weiter als der erste Snapshot.
- Es gibt echte Fortschritte in Backend, UI-Shell, DB-Pfaden und Analysemodulen.
- Dennoch ist die Plattform nicht kanonisch, nicht releasefähig und nicht SaaS-ready.
- Mehrere Dokumente behaupten einen Reifegrad, den der Code nicht deckt.
- AlgoView ist aktuell fast nur Branding statt echter Produktoberfläche.
- Der Live-/Chart-/Timeframe-Pfad ist fachlich noch nicht sauber.
- Mehrere Analyse- und Produktpfade erzeugen noch potenziell mehrere Wahrheiten.

## Nicht verhandelbare Grundregeln

### A. Keine Scheinfertigkeit
Du darfst keinen Status grün melden, wenn:
- der Codepfad nicht wirklich umgestellt ist,
- nur eine Demo funktioniert,
- nur die Doku angepasst wurde,
- oder die Änderung nur optisch statt fachlich ist.

### B. Eine Wahrheit pro Fachzustand
Ein Instrument, ein Zeitrahmen, ein Zeitpunkt und ein Kontextzustand dürfen nicht gleichzeitig aus widersprüchlichen Quellen stammen.

Chart, Feed, Alert, Explanation und Replay müssen denselben Zustand meinen.

### C. Root ≠ Contract ≠ Instrument ≠ Anzeige-Label
Du musst diese Begriffe strikt trennen.
Niemals wieder implizit mischen.

### D. Realtime und Replay sind gleichwertige Bürger
Jede Analyse muss sowohl live als auch gegen einen expliziten Replay-Zeitpunkt laufen können.
Replay ist kein nachträglich hereingebastelter Spezialmodus.

### E. Ein primärer Chartpfad
Kein Wildwuchs mehr mit mehreren konkurrierenden Chartpfaden als Produktionswahrheit.
Wähle einen, härte ihn, dokumentiere ihn.

### F. Inkrementell oder gar nicht
Neue Bars, Marker, Zonen und Overlays müssen über stabile inkrementelle Updates in den Chart gelangen.
Re-Creation auf jeder Änderung ist kein zulässiger Endzustand.

### G. Jedes wichtige Objekt braucht Erklärung
Eine Markierung ohne Kontext ist nur Deko.
Eine Erklärung ohne Evidenz ist nur Text.
Beides zusammen muss referenzierbar sein.

### H. AlgoView ist eine Produktfläche, kein Breadcrumb
Solange es keinen Radar-/Scanner-/Queue-/Watchlist-Workflow gibt, ist die Merge nicht fertig.

### I. SaaS-ready bedeutet tenant-aware control plane
Login allein reicht nicht.
Du brauchst Organisationsmodell, Rollen, Entitlements, Billing, Metering, Auditierbarkeit und Betriebsfähigkeit.

### J. Forecasting ist ein streng kontrollierter Layer
Deskriptive Markierung und Kontextisierung sind Produktionskern.
Forecasting darf nur als benchmarkte, unsicherheitsbewusste und erklärbare Schicht auftreten.

### K. Dokumentation darf nicht halluzinieren
Architektur-, Acceptance- und Limitation-Dokumente müssen aus überprüfbaren Fakten entstehen.
Dokumente, die dem Code vorauslaufen, sind zu korrigieren.

## Operativer Modus: Du arbeitest wie ein Agentenverbund

Du arbeitest nicht monolithisch, sondern wie ein kleiner autonomer Verbund mit diesen Rollen. Die Rollen sind Denkmodi; du darfst sie im Verlauf wechseln, aber keine Rolle überspringen.

### 1. Program Director
- hält Zielbild, Reihenfolge, Gates und Definition-of-done stabil
- verhindert Feature-Sprung ohne Fundament

### 2. Repo Auditor
- prüft den realen Zustand des Codes
- aktualisiert laufend die Wahrheit
- entlarvt tote Pfade und Doppelsysteme

### 3. Product Strategist
- schützt das Arctis×AlgoView-Zielbild
- denkt in Nutzerflow, Differenzierung und SaaS-Tauglichkeit

### 4. Data & Domain Engineer
- kanonisiert Instrument-, Contract-, Timeframe- und Session-Semantik
- verantwortet Datenwahrheit und Replay/Live-Parität

### 5. Realtime & API Engineer
- baut Verträge für REST, WS, Eventing, Alerts und Feed
- verhindert Zustandsdrift

### 6. Chart / Rendering Engineer
- härtet den Primärchart
- macht Updates inkrementell
- verbindet Chartobjekte mit Domainobjekten

### 7. Context & Explanation Engineer
- formt Markierungen, Ereignisse, Erklärungen und Invalidationen zu einem kohärenten Kern

### 8. SaaS Platform Engineer
- baut Org, Roles, Entitlements, Billing, Audit, Admin, Flags und Betriebsfähigkeit

### 9. Research & Evaluation Engineer
- kapselt Probability/Forecasting
- benchmarkt statt zu behaupten

### 10. QA / Release Engineer
- erzwingt Beweise
- baut Smoke-, Integration-, Replay- und Tenant-Tests
- verhindert Scheingrün

## Preserve vs Rewrite

### Preserve
Bewahre und nutze:
- große Teile der vorhandenen Analysemodule
- den erweiterten DB- und WS-Rohbau
- BIAS-/Signals-/Zones-Grundlagen
- App-Shell, Panel-Struktur, Replay-Bar, HUD, Topbar
- die bestehende Spezifikationsmasse als Inputmaterial

### Rewrite
Refaktoriere hart:
- Instrument-/Contract-Auflösung
- useMarketData und WS-Semantik
- Feed-Integration
- Chart lifecycle
- Replay-Konsistenz
- API-/WS-Client und Env-Config
- überoptimistische Doku

### Delete oder stilllegen
- tote Parallelpfade
- generische Starter-/Boilerplate-Reste, die keine Produktfunktion tragen
- irreführende Acceptance-Claims ohne reale Deckung

## Strenger Arbeitsmodus

Während der Umsetzung gilt:

1. erst auditieren,
2. dann kanonisieren,
3. dann bauen,
4. dann verifizieren,
5. dann dokumentieren.

Nicht andersherum.

Du darfst keinen Schritt als abgeschlossen behandeln, bevor:
- Codepfad angepasst,
- relevanter Test oder Smoke-Check ergänzt,
- und Dokumentationswahrheit aktualisiert ist.

## Was Erfolg jetzt bedeutet

Erfolg ist **nicht**, viele Features oder Seiten zu haben.

Erfolg ist, wenn:

- Radar → Workspace → Feed → Chart → Erklärung → Alert → Replay → Journal
  als ein konsistenter Produktfluss funktionieren,
- die Plattform tenant-aware ist,
- und ihre Aussagen nachvollziehbar und evidenzbasiert bleiben.

## Phasen, in denen du arbeiten sollst

### Phase A — Truth Reset, Canonical Data, Realtime Correctness
Stabilisiere Instrumentwahrheit, Live-/Replay-Wahrheit, Chart-Lifecycle und Dokumentation.

### Phase B — AlgoView Radar, Context Graph, Explanation
Baue den eigentlichen Produktkern: Priorisierung, Markierungen, Erklärungen, Szenarien, Invalidation.

### Phase C — Alerts, Replay, Journal, Playbooks
Schließe den Entscheidungs- und Lernkreislauf.

### Phase D — SaaS Control Plane, Admin, Observability
Mache das Produkt mehrnutzer- und betriebsfähig.

### Phase E — Operations, Security, Evaluation, Release
Härten, benchmarken, sichern und für Beta/V1 vorbereiten.

## Was du explizit nicht tun darfst

- keinen neuen schicken UI-Pfad eröffnen, wenn der alte noch kanonisiert werden muss
- keine AI-/Forecast-Features shippen, die nicht evaluiert wurden
- keine Greenwashing-Dokumentation schreiben
- keine Billing-/Role-/Entitlement-Logik nur im Frontend simulieren
- keine Alerts ohne Dedupe, Ownership und History erzeugen
- keine Merge mit AlgoView behaupten, solange Radar und Queue nicht real existieren
- keine Produktreife behaupten, solange Auth, Tenancy, Observability und Release-Gates fehlen

## Story Ledger — neue verpflichtende Stories ab US-065

Die historischen Stories US-001 bis US-064 leben in der Appendix als Fundament weiter.  
Die folgenden Stories sind **zusätzliche Pflichtstories** für Arctis × AlgoView als SaaS-ready Produkt.


### US-065: Canonical Instrument Identity Layer

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Fixe die Root-/Contract-/Instrument-Semantik end-to-end über Backend, Frontend, Feed, Replay und Persistenz.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Es gibt einen eindeutigen Unterschied zwischen Root, Contract Symbol, Instrument-ID und Anzeige-Label.
- Frontend und Backend benutzen denselben Vertrag für Markt-/Kontraktauswahl.
- Kein hart codiertes Front-Month-Mapping bleibt im produktiven Pfad bestehen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-066: Dynamic Contract Selection End-to-End

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Ersetze jede harte Frontend-Symbolzuordnung durch echte, DB-/metadata-getriebene Contract-Auswahl inklusive Roll-Handling.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Es gibt einen eindeutigen Unterschied zwischen Root, Contract Symbol, Instrument-ID und Anzeige-Label.
- Frontend und Backend benutzen denselben Vertrag für Markt-/Kontraktauswahl.
- Kein hart codiertes Front-Month-Mapping bleibt im produktiven Pfad bestehen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-067: Canonical API/WS Client and Environment Config

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Eliminiere harte localhost-URLs und baue einen env-/tenant-aware API- und WebSocket-Client.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Die Vertragssemantik ist dokumentiert, typisiert und in Smoke-Tests verifiziert.
- Es existieren deterministische Fehler- und Reconnect-Pfade.
- Kein stiller Fallback erzeugt eine zweite Wahrheit.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-068: Timeframe-Correct Live Data Pipeline

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Sorge dafür, dass Live-Daten auf jedem Timeframe fachlich korrekt ankommen und nicht rohe 1m-Bars an aggregierte Serien angehängt werden.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Voll-Re-Creation des Charts auf jeden neuen Bar-Impuls

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-069: WebSocket Subscription Protocol v2

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Definiere ein sauberes Subscription-Schema für Instrument, Contract, Timeframe, Replay-Kontext und Filterscope.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Die Vertragssemantik ist dokumentiert, typisiert und in Smoke-Tests verifiziert.
- Es existieren deterministische Fehler- und Reconnect-Pfade.
- Kein stiller Fallback erzeugt eine zweite Wahrheit.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-070: Incremental Chart Engine

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Baue den kanonischen Chartpfad auf stabilen inkrementellen Updates statt Re-Creation auf.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Voll-Re-Creation des Charts auf jeden neuen Bar-Impuls

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-071: Canonical Feed/Event Integration

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Mache den Backend-Event-Feed zur einzigen Produktquelle für Timeline, Alert-Referenzen und Context-Verlinkung.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Jedes ausgelieferte Event besitzt ID, Zeit, Severity, Priority, Source und Dedupe-Semantik.
- Timeline, Alerts und Chart-Referenzen lassen sich auf dieselben Objekte zurückführen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-072: Replay-Consistent Analysis Contract

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Erzwinge, dass alle Analysepfade denselben Live-/Replay-Zeitpunkt respektieren.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Es gibt einen eindeutigen Unterschied zwischen Root, Contract Symbol, Instrument-ID und Anzeige-Label.
- Frontend und Backend benutzen denselben Vertrag für Markt-/Kontraktauswahl.
- Kein hart codiertes Front-Month-Mapping bleibt im produktiven Pfad bestehen.
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-073: Health, Readiness and Schema Verification

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Implementiere ehrliche Health/Readiness-Prüfungen auf Basis des echten Schemas und der echten Upstream-Verfügbarkeit.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**


**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-074: Documentation Truth Automation

**Zugehörige Phase:** Phase A — Truth Reset, Canonical Data, Realtime Correctness

**Kernauftrag:**  
Sorge dafür, dass Architektur-, Limitation- und Acceptance-Dokumente aus prüfbaren Fakten gepflegt werden.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**


**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-075: AlgoView Radar Surface

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Baue AlgoView als echte Radar-/Universe-/Ranking-Oberfläche und nicht nur als Label.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Nutzer können Zustände speichern, wieder laden und organisationsabhängig teilen.
- Der Workflow von Radar zu Deep Workspace ist direkt und nachvollziehbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-076: Watchlists and Saved Market Views

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Persistiere Watchlists, Saved Views und Filtermodelle je Nutzer, Workspace und Organisation.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Nutzer können Zustände speichern, wieder laden und organisationsabhängig teilen.
- Der Workflow von Radar zu Deep Workspace ist direkt und nachvollziehbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-077: Cross-Instrument Ranking Engine

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Erstelle ein Ranking-System, das Märkte nach Relevanz, Regimewechseln, Setups und Kontext priorisiert.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Es gibt einen eindeutigen Unterschied zwischen Root, Contract Symbol, Instrument-ID und Anzeige-Label.
- Frontend und Backend benutzen denselben Vertrag für Markt-/Kontraktauswahl.
- Kein hart codiertes Front-Month-Mapping bleibt im produktiven Pfad bestehen.
- Nutzer können Zustände speichern, wieder laden und organisationsabhängig teilen.
- Der Workflow von Radar zu Deep Workspace ist direkt und nachvollziehbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-078: Context Graph Core

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Baue einen Graphen oder graphartige Referenzstruktur, die Signale, Levels, Strukturen, Sessions, Bias und Alerts verknüpft.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-079: Explanation Ledger

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Mache Erklärungen zu versionierten Artefakten mit Evidenzquellen, Invalidation und Referenzen.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Blackbox-Aussagen ohne Unsicherheit, Invalidation und Evidenz

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-080: Narrative Synthesis Service

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Erzeuge strukturierte Kurz- und Lang-Erklärungen für Markierungen, Zustandswechsel und Setups.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-081: Auto-Marking Rule Engine

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Vereinheitliche alle Markerzeuger in einer klaren Rule-/Signal-Engine mit Priorität, Dedupe und Objektlebenszyklus.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-082: Context Cards and Why-Now Layer

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Baue UI-Elemente, die jede wichtige Situation in Why-now / why-here / what-changed / what-invalidates zerlegen.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-083: Scenario Stack and Invalidation Model

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Führe für relevante Kontexte Basis-, Bull-, Bear- und Invalidationsszenarien als Produktobjekte ein.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-084: Setup Quality Scoring

**Zugehörige Phase:** Phase B — AlgoView Radar, Context Graph, Explanation

**Kernauftrag:**  
Bewerte erkannte Setups mit nachvollziehbaren Scoring-Faktoren statt bloßem Signal-Label.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**


**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-085: Alert Rules Model

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Implementiere eine persistente Alert-Regel-Engine mit Scope, Thresholds, Triggern, Cooldowns und Ownership.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Jedes ausgelieferte Event besitzt ID, Zeit, Severity, Priority, Source und Dedupe-Semantik.
- Timeline, Alerts und Chart-Referenzen lassen sich auf dieselben Objekte zurückführen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- kein Alert-Spam ohne Dedupe und Cooldown

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-086: Multi-Channel Alert Delivery

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Unterstütze in-app, E-Mail, Push/Webhook oder andere Kanäle über denselben Delivery-Vertrag.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.
- Jedes ausgelieferte Event besitzt ID, Zeit, Severity, Priority, Source und Dedupe-Semantik.
- Timeline, Alerts und Chart-Referenzen lassen sich auf dieselben Objekte zurückführen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Voll-Re-Creation des Charts auf jeden neuen Bar-Impuls
- kein Alert-Spam ohne Dedupe und Cooldown

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-087: Alert Dedupe and Cooldown Engine

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Verhindere Alert-Spam durch Dedupe, Hysterese, Cooldowns und kanalabhängige Policies.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Jedes ausgelieferte Event besitzt ID, Zeit, Severity, Priority, Source und Dedupe-Semantik.
- Timeline, Alerts und Chart-Referenzen lassen sich auf dieselben Objekte zurückführen.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- kein Alert-Spam ohne Dedupe und Cooldown

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-088: Daily Briefing Generator

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Erzeuge Tages-/Session-Briefings aus Radar-, Context- und Alert-Daten.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**


**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Blackbox-Aussagen ohne Unsicherheit, Invalidation und Evidenz

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-089: Replay Coach

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Baue einen Coach-Modus, der im Replay relevante Entscheidungspunkte und methodische Warnungen hervorhebt.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.
- Entscheidungen und Reviews sind mit historischen Kontextobjekten verknüpft.
- Lernartefakte referenzieren echte Chart-/Event-/Alert-Objekte statt nur Screenshots.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-090: Journal Persistence

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Mache Beobachtungen, Entscheidungen, Kontextobjekte und Screenshots zu verlinkbaren Journal-Artefakten.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Entscheidungen und Reviews sind mit historischen Kontextobjekten verknüpft.
- Lernartefakte referenzieren echte Chart-/Event-/Alert-Objekte statt nur Screenshots.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-091: Playbook Library

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Erlaube Nutzer- und Team-Playbooks mit Setup-Definitionen, Kriterien und Beispiel-Kontexten.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Entscheidungen und Reviews sind mit historischen Kontextobjekten verknüpft.
- Lernartefakte referenzieren echte Chart-/Event-/Alert-Objekte statt nur Screenshots.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-092: Trade Review Scoring

**Zugehörige Phase:** Phase C — Alerts, Replay, Journal, Playbooks

**Kernauftrag:**  
Implementiere eine Review-Schicht für Post-Session-Auswertung gegen definierte Playbooks und Kontextregeln.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Entscheidungen und Reviews sind mit historischen Kontextobjekten verknüpft.
- Lernartefakte referenzieren echte Chart-/Event-/Alert-Objekte statt nur Screenshots.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-093: Workspace Model

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Führe echte persönliche und geteilte Workspaces mit Layout, Instrumentsets, Filtern und History ein.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Nutzer können Zustände speichern, wieder laden und organisationsabhängig teilen.
- Der Workflow von Radar zu Deep Workspace ist direkt und nachvollziehbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-094: Organizations and Roles

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Baue Org-/Membership-/Role-Grundlagen für Team- und Multi-Tenant-Betrieb.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine rein clientseitige Rechteprüfung

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-095: Invitations and Membership Flows

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Ergänze Einladungen, Rollenwechsel, Member-Lifecycle und Active-Org-Kontext.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-096: Entitlements Layer

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Lege Features, Limits und Planrechte als eigenes Entitlement-Modell an.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine rein clientseitige Rechteprüfung

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-097: Usage Metering

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Erfasse nutzungsrelevante Ereignisse für Billing, Limits, Analytics und Produktsteuerung.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**


**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-098: Billing Plans and Checkout Skeleton

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Implementiere Planmodelle, Checkout/Subscription-Logik und Lifecycle-Grundlagen.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine rein clientseitige Rechteprüfung

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-099: Trial Lifecycle

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Definiere Trial-Start, Trial-Ende, Conversion und Feature-Grenzen sauber.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-100: Admin Console

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Baue eine Admin-/Owner-Konsole für Nutzer, Workspaces, Entitlements, Billing und Audit.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-101: Audit Logs

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Protokolliere sicherheits- und organisationsrelevante Änderungen nachvollziehbar.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Org-/Role-/Plan-Zustände werden serverseitig erzwungen, nicht nur im UI versteckt.
- Sensitive Aktionen werden protokolliert.
- Es existiert ein klarer Tenant-/Workspace-Kontext auf API- und Persistenzebene.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-102: API Keys and Webhooks

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Führe kontrollierte Integrationspunkte für externe Systeme ein.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Die Vertragssemantik ist dokumentiert, typisiert und in Smoke-Tests verifiziert.
- Es existieren deterministische Fehler- und Reconnect-Pfade.
- Kein stiller Fallback erzeugt eine zweite Wahrheit.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-103: Feature Flags and Remote Config

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Steuere riskante Funktionen über Flags, Segmente, Prozent-Rollouts und Remote Config.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Neue Funktionen können schrittweise und rückrollbar ausgerollt werden.
- Wichtige Nutzer- und Systempfade sind beobachtbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-104: Observability Tracing

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Instrumentiere Backend, Worker und Frontend mit verteiltem Tracing.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Neue Funktionen können schrittweise und rückrollbar ausgerollt werden.
- Wichtige Nutzer- und Systempfade sind beobachtbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-105: Product Analytics and Session Replay

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Messe Produktnutzung, Nutzerfriktion und Fehlbedienung mit Analytics und Replay.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.
- Neue Funktionen können schrittweise und rückrollbar ausgerollt werden.
- Wichtige Nutzer- und Systempfade sind beobachtbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-106: SLOs and Error Budgets

**Zugehörige Phase:** Phase D — SaaS Control Plane, Admin, Observability

**Kernauftrag:**  
Definiere Betriebsziele für Latenz, Fehlerrate, Alert-Delivery und WS-Stabilität.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Neue Funktionen können schrittweise und rückrollbar ausgerollt werden.
- Wichtige Nutzer- und Systempfade sind beobachtbar.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-107: Background Jobs and Workers

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Entkopple teure Prozesse wie Erklärungen, Alerts, Briefings, Exporte und Benchmarks in Worker.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-108: Event Bus and Outbox

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Führe ein robustes Eventing-Modell mit Outbox, Retries, Idempotenz und Dead-Letter-Handling ein.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Jedes ausgelieferte Event besitzt ID, Zeit, Severity, Priority, Source und Dedupe-Semantik.
- Timeline, Alerts und Chart-Referenzen lassen sich auf dieselben Objekte zurückführen.
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-109: Data Retention Policies

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Steuere Aufbewahrung für Markt-, Journal-, Audit-, Replay- und Analytics-Daten je Plan und Compliance-Rahmen.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-110: Security Hardening

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Härte Auth, Secrets, Uploads, Admin-Actions, Token-Flows und sensible Datenpfade.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-111: Rate Limiting and Abuse Controls

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Schütze APIs, WS, Alerts und AI-/Explanation-Volumes gegen Missbrauch.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-112: Secrets and Environment Management

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Systematisiere Konfiguration, Geheimnisse und Environment-Parität über local/dev/staging/prod.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-113: Deployment Topology

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Definiere sauberes Staging/Prod-Routing, Datenmigrationen, Rollbacks und Flag-gesteuerte Releases.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-114: CI/CD and Migration Gates

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Mache Typecheck, Tests, Smoke, Migrationen und Release-Checks verbindlich.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-115: Test Matrix

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Baue eine echte Testmatrix für data correctness, replay/live parity, UI contracts und tenant isolation.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-116: Synthetic Replay Fixtures

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Erzeuge deterministische Datensätze für Replay-, Alert- und Erklärungs-Regressionen.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-117: Forecasting Benchmark Harness

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Baue ein reproduzierbares Harness für Baselines, klassische Modelle und Foundation-Time-Series-Modelle.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Blackbox-Aussagen ohne Unsicherheit, Invalidation und Evidenz

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-118: Model Registry and Evaluation Reports

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Versioniere Modelle, Datenschnitte, Benchmarks, Metriken und Freigabezustände.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-119: AI Guardrails and Explanation Policy

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Erzwinge Unsicherheitsdarstellung, Evidenzpflicht und Verbot unkontrollierter Blackbox-Behauptungen.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Objekte enthalten Evidenzen, Kontext, Invalidation und Priorisierung.
- Erklärungen sind maschinenlesbar strukturiert und nicht nur Freitext.
- Die UI kann von einer Markierung zu ihrer Erklärung und zurück springen.
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Blackbox-Aussagen ohne Unsicherheit, Invalidation und Evidenz

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?


### US-120: Release Candidate Go-Live Checklist

**Zugehörige Phase:** Phase E — Operations, Security, Evaluation, Release

**Kernauftrag:**  
Erstelle einen verbindlichen Go-Live- und Release-Candidate-Prozess für Beta und v1.

**Warum diese Story jetzt wichtig ist:**  
Diese Story ist Teil des Übergangs vom aktuellen Rohbau zu einer ehrlichen, konsistenten und SaaS-tauglichen Produktbasis. Du sollst sie nicht isoliert optimieren, sondern so umsetzen, dass sie in den kanonischen Produktfluss von Radar → Workspace → Feed → Explanation → Alert → Replay → Journal passt.

**Pflichtarbeit:**
1. Analysiere zuerst den realen Ist-Zustand im bestehenden Repo und dokumentiere, welche Pfade bereits teilweise vorhanden sind.
2. Lege den kanonischen Zielvertrag für diese Story fest, bevor du patchst.
3. Implementiere die Änderung im primären Pfad, nicht in einem Seitensystem.
4. Ergänze mindestens einen prüfbaren Test-, Smoke- oder Verifikationsmechanismus.
5. Aktualisiere die betroffene Dokumentation so, dass sie exakt zum neuen Verhalten passt.

**Akzeptanzsignale:**
- Live- und Replay-Sicht liefern für denselben Kontext denselben fachlichen Zustand.
- Aggregierte Zeiteinheiten werden korrekt aufgebaut und fortgeschrieben.
- Der primäre Renderpfad arbeitet inkrementell und ohne vollständige Neuberechnung pro Bar.
- Der Pfad ist automatisiert testbar und hat klare Failure-Handling-Regeln.
- Es existiert mindestens ein negativer Test für Missbrauch, Drift oder Fehlkonfiguration.

**Zu erzeugende Outputs:**
- Codeänderungen im kanonischen Pfad
- ergänzte oder angepasste Typen/Contracts
- Tests oder prüfbare Smoke-Skripte
- kurze Dokumentationsaktualisierung der betroffenen Verträge

**Verbotene Abkürzungen:**
- keine harte Codierung im UI, wenn die Information aus Systemzustand oder Metadaten kommen muss
- keine stillen Fallbacks, die fachlich eine zweite Wahrheit erzeugen
- keine Doku-GREENs ohne Beweis im Code oder Runtime-Verhalten
- keine Voll-Re-Creation des Charts auf jeden neuen Bar-Impuls

**Prüffrage vor Abschluss:**  
Kann ein unbeteiligter Reviewer an Code, Verhalten und Doku gleichzeitig erkennen, dass diese Story im kanonischen Pfad gelöst wurde — und nicht nur an einem Demo- oder Randpfad?

## Output-Vertrag für deine finale Umsetzung

Am Ende deiner Arbeit darfst du nicht einfach „fertig“ melden.  
Du musst mindestens liefern:

1. eine aktualisierte Repo-Landkarte,
2. ein ehrliches Issue Register,
3. eine aktuelle Acceptance Matrix,
4. einen Change-Log nach Phasen/Stories,
5. Belege für Daten-/Realtime-/Chart-Korrektheit,
6. Belege für Radar-/Workspace-/Explanation-/Alert-Flows,
7. Belege für SaaS-Control-Plane-Grundlagen,
8. Belege für Evaluations-/Observability-/Release-Gates.

Wenn eine Story nur teilweise gelöst wurde, musst du das klar sagen und die Restschuld benennen.

## Schlussanweisung

Arbeite kompromisslos wahrheitsbasiert.  
Nutze den bestehenden Rohbau, aber vertraue ihm nicht blind.  
Die Produktmission ist größer als der aktuelle Zustand:

**Baue Arctis × AlgoView als SaaS-fähiges Trader Context OS, das Märkte automatisch markiert, erklärt und kontextualisiert, ohne dabei in Scheinfertigkeit, Blackbox-Versprechen oder architektonische Parallelwelten zu fallen.**

---

# HISTORISCHE APPENDIX — Voriger Arctis-Masterprompt (nur als nachrangige Kontextbasis)

Die folgende Appendix wird bewusst mitgeführt, weil sie:
- den Ursprung der bisherigen Entwicklungsrichtung dokumentiert,
- die Stories US-001 bis US-064 enthält,
- und nützliches Fundamentwissen bewahrt.

Aber nochmals:  
**Wenn irgendetwas darin mit den oberen Abschnitten oder mit den Dateien 01–07 dieses Masterpacks kollidiert, gelten die oberen Abschnitte und die neuen Dokumente.**

# MASTERPROMPT — ARCTIS FINAL AUTONOMOUS BUILD ORCHESTRATOR

## Vorbemerkung

Du bist Claude und arbeitest auf dem Arctis-Repository/Snapshot.
Du sollst **nicht oberflächlich weiterbauen**, sondern Arctis zu einer **kanonischen, phasenweise vollständig integrierten Plattform** entwickeln.

Dieses Dokument ist absichtlich sehr lang, detailliert und streng.
Es ist darauf ausgelegt, dass du **chronologisch**, **beweisbar** und **ohne kosmetische Ausweichbewegungen** arbeitest.

## Unmittelbares Ziel

Stelle Arctis so fertig, dass:

1. die Datenverarbeitung korrekt ist,
2. das Rendering stabil und livefähig ist,
3. Epic 0 und Epic 1 aus `PROMPT.md` wirklich abgenommen werden können,
4. die Architektur danach sauber genug ist, um die restlichen Epics des vollständigen PRD seriell umzusetzen,
5. und Forecasting/Prediction als **Research- und Probability-Layer** aufgebaut wird, nicht als scheinorakelhaftes Signalspielzeug.

## Was du zuerst verstehen musst

Der Snapshot ist **kein leerer Rohbau**.
Er enthält bereits:

- einen partiell DB-umgestellten Backend-Kern,
- einen statischen gemounteten Frontend-Pfad,
- mehrere ungenutzte oder konkurrierende Prototypen,
- bestehende Analysemodule,
- Legacy-Parquet-Pfade,
- Risikokonfiguration und Simulationsfragmente,
- sowie eine umfangreiche PRD mit 64 Storys.

Dein Job ist **nicht**, noch einen vierten Prototypen daneben zu stellen.
Dein Job ist, aus den konkurrierenden Fragmenten **eine einzige, belastbare Produktlinie** zu machen.

## Verpflichtende Lesereihenfolge, bevor du irgendetwas patchst

Du musst vor dem ersten Codechange diese Dateien in der folgenden Reihenfolge lesen und als Kontext akzeptieren:

1. `01_EXEC_SUMMARY_DE.md`
2. `02_PRD_COMPLIANCE_AUDIT.md`
3. `03_DATA_AND_RENDERING_FAILURE_ANALYSIS.md`
4. `04_TEST_AND_RUNTIME_VERIFICATION.md`
5. `05_WEB_RESEARCH_CHART_PREDICTION_TOOLS.md`
6. `06_AGENT_EXECUTION_BLUEPRINT.md`
7. `PROMPT.md`
8. `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md`

Danach musst du das Repo selbst prüfen und die in den Audit-Dokumenten genannten Befunde **kurz verifizieren**, bevor du sie als Patch-Basis benutzt.

## Wahrheits-Hierarchie

Wenn sich Quellen widersprechen, gilt folgende Priorität:

1. Sicherheits- und Systemrestriktionen
2. Tatsächlich gemounteter Laufzeitpfad im Repository
3. `PROMPT.md` für Epic 0/1-Abnahme
4. Vollständiges PRD für die Gesamtreihenfolge der Plattform
5. Die Audit- und Root-Cause-Dokumente dieses Pakets
6. Offizielle Web-Research-Erkenntnisse
7. Legacy-Prototypen / tote Pfade / Wunschannahmen

## Kernauftrag in einem Satz

**Eliminiere Split-Brain, stelle Datenkorrektheit her, kanonisiere Frontend und Charting, implementiere echte Live-Datenketten, schließe Epic 0/1 sauber ab und führe danach die restliche Plattform phasenweise weiter.**

## Nicht verhandelbare Grundregeln

### A. Keine Scheinfertigkeit

1. Keine Demo-Daten im sichtbaren Nutzerpfad.
2. Keine hart codierten Preise, Sessions, Signalscores, Musterlisten oder Risk-Werte im finalen UI.
3. Keine “temporären” Fallbacks, die faktisch dauerhaft bleiben.
4. Keine Behauptung, ein Kriterium sei erledigt, ohne Build-/Test-/Laufzeitbeleg.
5. Kein Greenwashing durch schöne Screens, wenn die Datenkette nicht stimmt.

### B. Keine zweite Wahrheit

6. Es darf genau **einen kanonischen Live-Datenpfad** geben.
7. Replay/Simulation darf kein separater Realitätsraum sein.
8. Probability/Forecasting darf nicht weiter an Legacy hängen, wenn der Rest live/DB-basiert ist.
9. Symbol-, Root-, Contract- und Timeframe-Modelle müssen über Frontend und Backend konsistent sein.
10. Ein Nutzer darf nie `ES` sehen, während `NQH6` geladen wird.

### C. Keine Parallelwelten im Frontend

11. Lege einen einzigen kanonischen App-Entrypoint fest.
12. Lege einen einzigen kanonischen Chart-Renderer fest.
13. Entferne oder entkopple konkurrierende, tote oder redundant gewordene Pfade.
14. Es darf keine drei verschiedenen Feed-Datenmodelle geben.
15. Es darf keine inkompatiblen Timeframe-Strings zwischen UI und Backend geben.

### D. Datenkorrektheit vor Komfort

16. Behebe Timestamp-, Aggregations- und Sessionfehler vor UX-Politur.
17. Jede Aggregation muss zeitbasiert und deterministisch sein.
18. Zeitstempel dürfen systemweit dieselbe Einheit und Zeitzonenlogik haben.
19. Session-Klassifikation muss auf Datenkontext oder explizit modellierter Echtzeit basieren.
20. Jede Pipeline für Live- und historische Daten muss reproduzierbar sein.

### E. Build-/Test-Hygiene

21. TypeScript strict muss ernst genommen werden.
22. Keine stillen `any`-/Typumgehungen, nur um grün zu werden.
23. Python-Dependencies müssen den real benutzten Codepfad vollständig abdecken.
24. Tests dürfen nicht mehr primär die alte Architektur absichern, wenn das Produktziel die neue ist.
25. Build- und Test-Kommandos müssen dokumentiert, reproduzierbar und CI-fähig sein.

### F. Charting-Regeln

26. Keine komplette Chart-Neuerstellung bei jedem Live-Update.
27. Zoom-/Pan-Kontext darf nicht bei neuen Bars verloren gehen.
28. Alle Overlay-Serien müssen dieselbe X-Semantik verwenden.
29. Verwende keine visuelle „Korrektur“, um fachlich falsche Daten zu kaschieren.
30. Session-Linien, Marker und Level nur auf konsistentem Zeitmodell.

### G. Echtzeit-Regeln

31. Initialload und Incremental-Stream müssen denselben Vertrag sprechen.
32. WebSocket-Nachrichten müssen dedupliziert werden.
33. Reconnect muss vorgesehen und getestet werden.
34. Disconnects dürfen keinen korrupten UI-Zustand hinterlassen.
35. Bar-Updates dürfen keine stillen Race Conditions zwischen Chart, Panels und Feed erzeugen.

### H. Forecasting-/Prediction-Regeln

36. Prediction ist Research-/Probability-Layer, kein magischer Entry-Generator.
37. Kein Modell ohne Walk-Forward-Validierung.
38. Kein Modell ohne Leakage-Prüfung.
39. Kein Foundation Model ungeprüft in den Live-Pfad.
40. Output immer probabilistisch, erklärbar und mit Unsicherheit.

### I. Produkt-Regeln

41. Arctis bleibt ein Trading-Decision-Support-System.
42. Keine Broker-/Autotrading-Abkürzungen.
43. Kein UI-Element darf einen höheren Reifegrad suggerieren als tatsächlich vorhanden.
44. Alle sichtbaren Werte müssen aus nachvollziehbaren Quellen stammen.
45. Jede Epik folgt der PRD-Reihenfolge, sofern technische Blocker nichts anderes erzwingen.

### J. Dokumentationsregeln

46. Halte wichtige Architekturentscheidungen in ADR-/Decision-Notizen fest.
47. Aktualisiere die Acceptance-Matrix nach jeder relevanten Phase.
48. Benenne bewusste Scope-Cuts explizit.
49. Trenne belegte Befunde, Annahmen und offene Fragen sauber.
50. Hinterlasse am Ende ein Repo, das ein anderer Engineer ohne Telepathie übernehmen kann.

## Operativer Modus: Du arbeitest wie ein kleiner Agentenverbund

Du führst intern mehrere Rollen aus. Trenne sie mental und explizit in deinem Vorgehen.

### 1. Program Director
- Hält die Phasenreihenfolge ein.
- Verhindert Scope-Wildwuchs.
- Erzwingt Kanonisierung statt Prototyp-Sprawl.

### 2. Repo Auditor
- Prüft gemountete Pfade, Dead Code, Hardcodes, Typen, Laufzeitkontrakte.
- Glaubt keinem Audit blind, sondern verifiziert schnell.

### 3. Data & DB Engineer
- Repariert Zeiteinheiten, Symbol-Resolution, Aggregation und DB-Zugriff.
- Denkt in Contracts, nicht in ad-hoc Patches.

### 4. Backend / Realtime Engineer
- Baut REST, WS, Health, Cache, Invalidierung und Event-Transport.
- Sichert Abwärtskompatibilität nur dort, wo sie das Zielbild nicht sabotiert.

### 5. Frontend State Architect
- Vereinheitlicht Markt-/Timeframe-/Connection-/Replay-Zustand.
- Baut Hooks/Stores so, dass Panels und Chart dieselbe Wahrheit sehen.

### 6. Chart / Visualisation Engineer
- Wählt den kanonischen Renderer.
- Beseitigt Re-Creation, X-Achsen-Inkonsistenz, Overlay-Mismatch und Render-Jitter.

### 7. Quant / Research Engineer
- Baut Probability/Forecasting mit Benchmark-Disziplin.
- Trennt heuristische Pattern, klassische Modelle und Foundation Models sauber.

### 8. QA / Release Engineer
- Definiert, was “fertig” praktisch bedeutet.
- Erzwingt Test-, Build-, Perf- und Doku-Belege.

## Arbeitsdisziplin

Nach jeder größeren Phase musst du in deinem eigenen Fortschrittslog festhalten:

- was du geprüft hast,
- was du geändert hast,
- welche Risiken geblieben sind,
- welche Akzeptanzkriterien jetzt grün/gelb/rot sind,
- welche nächsten Schritte logisch zwingend folgen.

Du darfst dich **nicht** durch visuell attraktive Zwischenstände täuschen lassen.
Wenn fundamentale Daten- oder Modellfehler offen sind, ist die Phase nicht abgeschlossen.

## Snapshot-Wahrheiten, die du zu Beginn als Arbeits-Hypothesen behandeln sollst

Verifiziere diese Punkte kurz am Code, bevor du patchst:

1. `app/src/main.tsx` mountet `App`, nicht `components/Dashboard.tsx`.
2. `app/src/App.tsx` lädt einmalig `/api/db/bars?symbol=NQH6&days=30`.
3. Die rechte Panelspalte im gemounteten Pfad verwendet statische Panels ohne Live-Props.
4. `Topbar.tsx` ist lokal-statisch, kennt mehr Märkte/Zeiträume als das Backend-Typmodell.
5. `SessionPanel`, `ConfluencePanel`, `PatternsPanel`, `FeedPanel`, `RiskPanel` besitzen Demo-Defaults.
6. `StatusBar` zeigt im gemounteten Pfad faktisch statische Kennzahlen.
7. `app/src/api.ts` enthält bereits mehrere API-Funktionen, die im gemounteten Pfad kaum benutzt werden.
8. `engine/src/arctis/routes/analysis.py` liest die Hauptanalysen über `fetch_bars_as_models()` aus `db.py`.
9. `engine/src/arctis/routes/probability.py` hängt weiter an `ParquetStore`.
10. `engine/src/arctis/db.py` verwendet `pd.read_sql(..., DB_URL)` und braucht dafür einen sauberen DB-Dependency-Pfad.
11. `_aggregate_5min()` aggregiert aktuell nur in stumpfen Fünfer-Blöcken.
12. `csv_parser.py` teilt Datetime-Integer derzeit falsch und produziert Millisekunden statt Sekunden.
13. Es existieren mehrere konkurrierende Chart-Pfade: `SimpleChart.tsx`, `components/Chart.tsx`, `ArctisCandlestickChart.tsx`.
14. Der SciChart-Pfad nutzt `CategoryAxis`, mischt aber mutmaßlich inkonsistente X-Werte.
15. Die vorhandene Test-Suite sichert die Zielarchitektur nur teilweise und teils noch die Legacy-Parquet-Welt ab.

Wenn eine dieser Hypothesen im Repo doch anders aussieht, dokumentiere die Abweichung und passe deinen Plan an.

## Start-Issue-Register, das du am Anfang führen und aktualisieren musst

### Blocker
- DB-Routen hängen an einem im Projekt unvollständig deklarierten Dependency-Pfad.
- Kein echter WebSocket-Bar-Transport.
- Kein `useMarketData`.
- Gemounteter UI-Pfad ist statisch.
- Probability lebt weiter im Legacy-Pfad.

### Correctness
- CSV-Timestamps aktuell falsch skaliert.
- 5‑Minuten-Aggregation aktuell fachlich unzureichend.
- Session-Klassifikation außerhalb des Sim-Pfads potenziell von Wall-Clock statt Datenkontext abhängig.
- Root/Symbol/Contract-Domäne nicht sauber getrennt.
- UI-/Backend-Timeframe-Mismatch.

### Architecture
- App vs. Dashboard Doppelwelt.
- drei Chart-Pfade statt eines kanonischen Renderers.
- mehrere Feed-/Panel-Datenmodelle.
- Inline-fetch im produktiven Pfad trotz vorhandenem API-Layer.
- unklare Zukunft von Legacy-Parquet und Simulation.

### Frontend integration
- Topbar lokal-statisch.
- Panels statisch.
- HUD nur im ungenutzten Pfad.
- StatusBar suggeriert mehr Live-Kontext als sie tatsächlich hat.
- sichtbare TypeScript-Risiken im gemounteten Pfad.

### Test debt
- pytest braucht in meiner Verifikation zusätzlichen `PYTHONPATH=src`.
- Suites sichern Legacy-Parquet-Verhalten stärker ab als das Zielbild.
- Frontend-Typecheck/Build-Nachweise fehlen im Snapshot.
- WS-/Realtime-/cross-layer-Tests fehlen.

### Research debt
- Probability nicht im Live-Contract.
- Keine saubere Baseline-/Benchmark-Pipeline.
- Keine explizite Trennung von Heuristiken, klassischen Modellen und Foundation Models.

## Harte Erfolgsdefinition

Arctis gilt erst dann als wirklich vorangekommen, wenn die folgenden Aussagen zugleich wahr sind:

1. Der gemountete App-Pfad ist derselbe Pfad, in dem die echte Funktionalität lebt.
2. Chart, Topbar, Panels und HUD teilen dieselbe Marktwahrheit.
3. Initialload und Live-Updates sind aus einem konsistenten REST-/WS-Vertrag gespeist.
4. Es gibt keine sichtbaren Demo-/Hardcode-Werte mehr im Kernproduktpfad.
5. Die 1‑Minuten- und 5‑Minuten-Daten sind fachlich korrekt.
6. Die Datenachse ist systemweit konsistent.
7. Probability/Prediction ist nicht mehr nur Legacy, sondern methodisch eingeordnet.
8. Typecheck, Build und Tests liefern glaubwürdige Belege.
9. Die Dokumentation ermöglicht einem Dritten, das Ergebnis zu betreiben und weiterzuentwickeln.

Wenn nur 1–4 oder nur 5–9 wahr sind, bist du noch nicht fertig.
Es müssen Funktionalität, Korrektheit und Nachweisbarkeit zusammenkommen.

## Eingebaute Research-Guidance für Architektur und Prediction

### Echtzeit und Charting
- Für Live-Charting orientiere dich an offiziellen Lightweight-Charts-Mustern für inkrementelle Serienupdates.
- Für DB-seitige Aggregation orientiere dich an echten Zeit-Buckets statt Chunk-Logik.
- Für SciChart gilt: Wenn `CategoryAxis` verwendet wird, darfst du niemals index- und timestampbasierte X-Werte mischen.

### Forecasting / Prediction
- Nutze Foundation Models nicht als Ersatz für Produktarchitektur.
- Bewerte TimeGPT, Chronos-2, TimesFM, AutoGluon, Darts, sktime und ggf. Moirai als **Werkzeuge in einem Benchmark-System**, nicht als Glaubensfragen.
- Für intraday futures sind Regimewechsel, Rollover, Session-Struktur und Leakage-Kontrolle mindestens so wichtig wie die Wahl des Modells.
- Das richtige Produktpattern für Arctis ist: **Kontext + Wahrscheinlichkeitsräume + erklärbare Unsicherheit**, nicht „Jetzt long“.

### Pattern-/Signal-Logik
- Nutze kommerzielle Referenzen wie TrendSpider, Pine Script und StockCharts vor allem als Benchmark für Transparenz, Parametrisierung und Testbarkeit.
- Die interne Regelbasis von Arctis muss explizit definierbar und reproduzierbar sein.


## Phase 0 — Audit, Freeze, Truth Baseline

### Warum diese Phase zwingend ist

Der aktuelle Snapshot leidet nicht primär daran, dass einzelne Features fehlen.
Er leidet daran, dass **mehrere konkurrierende Teil-Architekturen gleichzeitig existieren**.
Wenn du jetzt ohne Freeze sofort Code änderst, riskierst du nur, eine vierte konkurrierende Variante zu erzeugen.

### Dein Auftrag in Phase 0

1. **Bestimme den echten Laufzeitpfad**
   - Verifiziere den gemounteten Frontend-Entrypoint.
   - Verifiziere, welche Chart-Komponente im laufenden Produktpfad tatsächlich benutzt wird.
   - Verifiziere, welche Panels im laufenden Produktpfad tatsächlich Live-Daten erhalten (vermutlich keine).

2. **Inventarisiere konkurrierende Pfade**
   - `App.tsx`
   - `components/Dashboard.tsx`
   - `components/Chart.tsx`
   - `components/charts/SimpleChart.tsx`
   - `components/charts/ArctisCandlestickChart.tsx`
   - `components/HudBar.tsx`
   - `components/LiveFeed.tsx`
   - `components/SessionTimeline.tsx`
   - dazu Backend-Livepfad vs. Parquet-/Simulationspfad

3. **Baue ein Issue Register**
   Unterteile mindestens in:
   - correctness
   - architecture
   - runtime/blocker
   - frontend integration
   - chart/rendering
   - test debt
   - prediction/research debt

4. **Treffe zwei harte Architekturentscheidungen**
   - Welcher Frontend-Pfad wird kanonisch?
   - Welcher Chart-Renderer wird kanonisch?

### Was du in Phase 0 noch nicht tun sollst

- keine halbherzigen UI-Politur-Patches,
- keine neuen Features,
- keine zusätzliche Parallelkomponente,
- keine neue State-Schicht, bevor klar ist, wer sie nutzen wird.

### Ergebnis dieser Phase

Du musst am Ende dieser Phase explizit festhalten:

- welche Dateien produktiv weitergeführt werden,
- welche Dateien migriert, eingefroren oder entfernt werden,
- welche Verträge zwischen Backend, Hook/Store, Chart und Panels maßgeblich sind,
- und welche Acceptance-Kriterien dadurch unmittelbar adressiert werden.

### Phase-0-Gate

Du gehst erst weiter, wenn du auf diese Fragen klare Antworten hast:

- Welche App ist die echte App?
- Welche Chart-Komponente ist die echte Chart-Komponente?
- Welche Datenquelle ist die echte Live-Datenquelle?
- Welche Legacy-Pfade werden wie behandelt?



## Phase 1 — Datenkorrektheit und DB-Härtung

### Ziel

Hier legst du das Fundament.
Alles, was später falsch wirkt, wird fast sicher auf Fehler dieser Phase zurückzuführen sein, wenn du sie schlampig machst.

### Pflichtaufgaben

#### 1. DB-Dependency-Pfad reparieren
- Entscheide dich für einen sauberen, im Projekt deklarierten DB-Zugriff.
- Wenn du `pandas.read_sql` mit URI-Strings nutzt, deklariere die dafür nötigen Dependencies sauber.
- Alternativ darfst du den DB-Pfad explizit auf eine robustere, direkte Adapterform umstellen.
- Wichtig: Nicht „auf meiner Maschine ging es zufällig“ als Lösung akzeptieren.

#### 2. Symbol- und Contract-Modell bereinigen
- Trenne `market/root` von `contract/symbol`.
- Ein Root wie `NQ` ist nicht dasselbe wie ein konkreter Contract wie `NQH6`.
- Die UI darf Root, Front-Month und konkretes Symbol nicht durcheinanderwerfen.
- Entferne stumme Default-Fallbacks auf potenziell veraltete Kontrakte oder mache sie explizit sichtbar.

#### 3. CSV-Timestamp-Bug korrigieren
- Verifiziere die Zeiteinheit im Parser.
- Schreibe Tests, die Sekunden vs. Millisekunden sicher unterscheiden.
- Dokumentiere Zeitzonenannahmen klar.
- Stelle sicher, dass importierte Bars im selben Zeitmodell landen wie DB- und Live-Bars.

#### 4. 5‑Minuten-Aggregation fachlich richtig implementieren
- Keine naive Chunk-Aggregation.
- Nutze echte Zeit-Buckets oder sauber ausgerichtetes Resampling.
- Definiere, was bei Lücken, Session-Grenzen, Rumpfintervallen und letzten unvollständigen Buckets gilt.
- Teste genau diese Fälle.

#### 5. Health-/Readiness-Basis schaffen
- Ergänze, falls nötig, einen separaten DB-/Analysis-Healthcheck.
- Der Healthcheck darf nicht nur „App importiert“ bedeuten, sondern muss die eigentliche Betriebsbereitschaft des Live-Pfads abbilden.

### Besondere Risiken in dieser Phase

- stillschweigende Symbol-Fallbacks,
- inkonsistente Sekunden-/Millisekunden-Logik,
- Aggregationen, die nur für lückenlose Demo-Daten stimmen,
- Tests, die den falschen Pfad absichern.

### Ergebnis dieser Phase

- stabiler DB-Zugriff,
- verlässliche Zeiteinheit,
- verlässliche Aggregation,
- konsistentes Symbolmodell,
- verlässliche Health-Signale.



## Phase 2 — REST-Verträge, Analysekontrakte und WebSocket-Transport

### Ziel

Ein Live-System braucht zwei Dinge:

1. einen klaren Initialload,
2. einen klaren Incremental-Transport.

Beides muss denselben Domänenvertrag sprechen.

### Pflichtaufgaben

#### 1. REST-Verträge kanonisieren
- `GET /api/markets`
- `GET /api/db/bars`
- `GET /api/analysis/*`
- ggf. Health/Readiness
- Risk-/Config-Verträge

Die Rückgaben müssen:
- konsistent typisiert,
- dokumentiert,
- und frontendfreundlich sein.

#### 2. WebSocket-Livebar-Kanal bauen
- Implementiere `/ws/bars/{symbol}` oder ein gleichwertig sauber typisiertes Symbol-WS.
- Sende beim Connect mindestens den letzten bekannten Zustand oder die letzte Bar.
- Sende danach deduplizierte neue Bars.
- Fange Disconnects sauber ab.
- Definiere Heartbeat/Keepalive, Reconnect-Verhalten und symbolbezogene Subscriptions.

#### 3. Cache- und Invalidierungslogik definieren
- Wann müssen Analysen neu gerechnet werden?
- Welche Endpunkte sind cachebar?
- Welche Events invalidieren welche Panels?
- Was ist pro Bar, was ist pro Session, was ist seltener?

#### 4. Probability/Legacy sauber einordnen
- Der Probability-Pfad darf nicht außerhalb dieser Vertragslogik weiter im Legacy leben.
- Falls du ihn nicht sofort vollständig umstellst, dokumentiere sauber einen temporären, expliziten Übergangspfad — keine versteckte zweite Wahrheit.

### Was gute Arbeit in dieser Phase ausmacht

- REST und WS sprechen denselben Domänenwortschatz.
- Symbol-/Timeframe-Änderungen sind überall konsistent.
- Ein neues Bar-Event kann deterministisch Chart, Panels, Feed und ggf. Probability invalidieren.
- Nichts davon hängt an Demo-Daten oder mehrfachen Zustandsquellen.

### Ergebnis dieser Phase

- stabile Initialload-RESTs,
- funktionierender Livebar-WS,
- dokumentierte Invalidierungslogik,
- stabile Grundlage für `useMarketData`.



## Phase 3 — Frontend-Kanonisierung, State und Datenorchestrierung

### Ziel

Du baust jetzt **eine einzige echte App**.

### Pflichtaufgaben

#### 1. Entscheide den kanonischen UI-Pfad
Du musst klar entscheiden:
- `App.tsx` modernisieren und die reiche Funktionalität hineinziehen?
- oder `Dashboard.tsx` kanonisieren und die Shell darum herum sauber modernisieren?

Die Entscheidung muss begründet sein.
Die schlechtere Option ist: beide Pfade halblebig stehen zu lassen.

#### 2. Zentralisiere Markt-/Zeitrahmen-/Verbindungszustand
- Markt/Root
- konkretes Symbol
- Timeframe
- Days / lookback
- WS-Connection-Status
- Last bar timestamp
- ggf. Replay-Status

Diese Zustände dürfen nicht gleichzeitig an fünf Stellen lokal leben.

#### 3. Baue einen sauberen Datenzugriffslayer
- `useMarketData` für Bars + WS
- ggf. ergänzende Hooks für Analysis-Panels
- server-state/cache (z. B. React Query) dort, wo sinnvoll
- client-state/store (z. B. Zustand) für globale Selektion und UI-Zustand

#### 4. Vereinheitliche Typen
- `1m` vs. `1min`
- `5m` vs. `5min`
- `ES` vs. `ESH6` vs. `ES 03-26`
- Feed-Typen vs. Severity
- Panel-Contracts vs. API-Contracts

#### 5. Eliminiere harte Mismatches
- Topbar darf nicht ES zeigen, wenn NQ geladen ist.
- Hardcoded Breadcrumb, Preis und Change müssen aus echten Daten oder bewusstem Placeholder-State kommen.
- `count?: number` darf nicht mit Strings gefüttert werden.

### Schlechte Lösungen in dieser Phase

- einfach weitere Props reinreichen, ohne die State-Architektur zu entwirren,
- Topbar „optisch dynamisch“ machen, aber Chart/Panels nicht mitsynchronisieren,
- lokale Component-State-Hotfixes statt Store-/Contract-Korrektur.

### Ergebnis dieser Phase

- ein einziger kanonischer App-Pfad,
- klarer Store-/Hook-Layer,
- keine widersprüchlichen Marktzustände,
- keine offensichtlichen TS-Domainbrüche.



## Phase 4 — Kanonisches Charting und Rendering-Korrektheit

### Ziel

Ab hier wird entschieden, ob Arctis wie ein Trading-Tool wirkt oder wie eine hübsche Demo.
Das Chart ist nicht bloß Dekoration; es ist der Hauptbeweis, dass Daten, Zeitachse und Overlays korrekt zusammenlaufen.

### Strategische Empfehlung

Nimm **Lightweight Charts** als kanonischen Produktpfad, sofern du keine sehr starke Gegenbegründung hast.
Dafür sprechen:
- PRD-Zielstack,
- vorhandene Prototypen im Repo,
- leichte inkrementelle Echtzeit-Updates,
- gute Performance-/Bundle-Eigenschaften.

Wenn du SciChart behältst, musst du die Entscheidung sehr hart begründen und die X-Achsen-Problematik vollständig bereinigen.

### Pflichtaufgaben

#### 1. Wähle genau einen primären Chartpfad
- `SimpleChart.tsx` modernisieren?
- `components/Chart.tsx` härten und kanonisieren?
- SciChart-Prototyp entfernen/isolieren?

Entscheide und zieh die Entscheidung durch.

#### 2. Inkrementelles Update statt Re-Creation
- Der Chart darf bei neuen Bars nicht komplett neu gebaut werden.
- Serien-Refs müssen persistent sein.
- Der letzte Punkt / neue Punkt muss mit `update()` oder gleichwertiger inkrementeller API laufen.
- Zoom/Pan-Kontext bleibt erhalten.

#### 3. Zeitachse und Overlays vereinheitlichen
- Candles
- Volume
- VWAP
- EMA
- Price Lines
- Pattern Marker
- Session-Linien
- OR-Boxen
- Tageslevels

Alle müssen dieselbe Zeit-/X-Semantik teilen.

#### 4. UX-Korrektheit
- Loading skeletons nur bis echte Daten da sind.
- Error states nicht im Nirvana verschwinden lassen.
- No-data-Fälle sauber behandeln.
- Resize/viewport-Wechsel stabil halten.

#### 5. Performance
- keine unnötigen `setData`-Totalresets bei jedem Tick/Bar,
- keine Marker-Neuberechnung ohne Not,
- keine doppelten Datenkopien, wenn es inkrementell ginge.

### Ergebnis dieser Phase

- ein kanonisches, livefähiges Chart,
- stabile Overlays,
- keine Zeitachsen-Missverständnisse,
- kein Zoom-/Pan-Verlust,
- kein redundanter Parallelrenderer im Produktpfad.



## Phase 5 — Live Panels, HUD und Feed-Engine

### Ziel

Die rechte Seite und die HUD-Zone müssen endlich echte Produktbestandteile werden, nicht Demo-Ornamente.

### Pflichtaufgaben

#### 1. SessionPanel live machen
- echte Sessiondaten aus dem Backend,
- saubere Abbildung aller Ziel-Sessions,
- Fortschrittslogik,
- klare active/complete/upcoming-Stati,
- kein Hardcode „NY Open“.

#### 2. ConfluencePanel live machen
- echter Score,
- echte Richtung,
- echte Confidence/Verdict,
- echte Breakdown-Signale,
- Update-Regel sauber an neue Bars gekoppelt.

#### 3. PatternsPanel live machen
- echte erkannte Muster,
- echte Statistik-/Winrate-Darstellung nur, wenn valide Quelle vorhanden,
- kein statischer Patterntext.

#### 4. Feed-Engine bauen
- Ereignisse aus Analyseänderungen ableiten:
  - Confluence-Sprünge
  - Volume-Spikes
  - Session-Wechsel
  - Pattern-Trigger
  - Discipline-/Risk-Warnings
- Event-Typen typisieren
- Dedupe und Reihenfolge sauber regeln
- ein einziges Eventmodell festlegen

#### 5. RiskPanel live machen
- `/api/config`
- `/api/risk/daily-check`
- echte Trade-/Limit-/P&L-/Contract-Daten
- klare Interpretation

#### 6. HUD Strip bauen
- RVOL
- RSI + Divergence
- EMA alignment
- VWAP position / relevanter VWAP-Kontext
- Session
- Bars
- ggf. weitere Kernmetriken nur, wenn fachlich sinnvoll

### Wichtige UX-Regeln

- Kein Panel darf still auf Demo-Defaults zurückfallen.
- Jedes Panel braucht Loading-, Error- und leeren Zustand.
- Ein Panel mit veralteten Daten muss erkennbar veraltet sein.
- Alle Panels müssen denselben Markt/Symbol/Timeframe referenzieren wie das Chart.

### Ergebnis dieser Phase

- rechte Panelspalte und HUD sind echte Produktteile,
- kein Demo-Müll mehr sichtbar,
- einheitliches Eventmodell,
- konsistenter Datenkontext über Chart und Panels.



## Phase 6 — Probability- und Forecasting-Research-Layer

### Ziel

Du transformierst Prediction von einem halbisolierten Legacy-Endpoint zu einem methodisch sauberen Research-Baustein.

### Erstes Prinzip

Arctis ist kein „next candle guesser“.
Arctis braucht einen **seriösen Probability-Layer**, der:

- erklärbar,
- benchmarkbar,
- out-of-sample-validiert,
- und produktstrategisch bescheiden genug ist.

### Pflichtaufgaben

#### 1. Existing Probability Endpoint sanieren
- vom Parquet-Legacy lösen,
- an den kanonischen Datenvertrag anschließen,
- sauber typisieren,
- Fehler- und Datenmengenbedingungen korrekt behandeln.

#### 2. Baselines zuerst
Bevor du Foundation Models anschließt, baue und miss mindestens:
- naive,
- seasonal-naive,
- einfache Rolling-/Quantile-Baselines,
- ggf. lineare/baum-basierte tabellarische Baselines.

Wenn diese schon nicht sauber evaluiert sind, ist jedes High-End-Modell Theater.

#### 3. Benchmark-Harness definieren
- walk-forward splits,
- no leakage,
- train/test windows,
- session-/regime-aware slicing,
- contract-rollover-aware evaluation,
- metrics für point und probabilistic forecasts,
- calibration checks.

#### 4. Modell-Kategorien trennen
- Heuristiken / rule-based zones
- klassische statistische Modelle
- tabellarische ML-Modelle
- Framework-basierte Modelle (AutoGluon, Darts, sktime)
- Foundation Models (TimeGPT, Chronos-2, TimesFM, Moirai)

#### 5. Produkt-Output definieren
- kein binäres „Long/Short jetzt“
- stattdessen:
  - target zones,
  - probability bands,
  - scenario ranges,
  - uncertainty labels,
  - reference to sample size / regime confidence

### Harte Verbote

- kein Live-Rollout eines fancy Modells ohne Baseline-Vergleich,
- keine versteckte Data Leakage,
- keine rückwärts schön gerechneten Winrates,
- keine UI, die aus unsicherer Prediction scheinbare Gewissheit macht.

### Ergebnis dieser Phase

- Probability nicht mehr als Legacy-Insel,
- sauberer Research-Layer,
- klare Modellgrenzen,
- belastbarer Output für spätere Produktintegration.



## Phase 7 — Weiterbau der Gesamtplattform nach Stabilisierung des Fundaments

### Ziel

Nach Epic 0/1 und der grundlegenden Chart-/Probability-Stabilisierung kannst du die restlichen Epics geordnet fortführen, ohne das Fundament zu beschädigen.

### Reihenfolgeprinzip

1. Chart Enhancements
2. Bias / methodology modules
3. Replay
4. Enhanced Feed
5. Drawing tools
6. Settings / config
7. Travis MCP
8. Polish / UX

### Warum diese Reihenfolge sinnvoll ist

- Chart Enhancements bauen auf korrektem Chart und korrekten Daten.
- Bias braucht stabile Analysekontrakte.
- Replay braucht dieselben Kontrakte und darf kein Sonderuniversum sein.
- Feed profitiert von stabiler Analyse und Replay-Synchronität.
- Drawings brauchen stabilen Chart und Persistenzmodell.
- Settings brauchen eine echte Runtime, die auf Werte reagiert.
- Travis/MCP sollte nicht vor einem stabilen Kernprodukt stattfinden.
- Polish kommt zuletzt, weil sonst kosmetische Arbeit fundamentale Mängel verdeckt.

### Ergebnis dieser Phase

Eine ausbaubare Plattform, nicht bloß ein reparierter P0-Prototyp.



## Phase 8 — QA, Release, CI und Handoff

### Ziel

Kein „trust me“, sondern beweisbare Abnahme.

### Pflichtaufgaben

#### 1. Backend-Teststrategie
- DB unit/integration tests
- aggregation tests
- WS tests
- risk/config tests
- probability tests
- session/timezone edge-case tests

#### 2. Frontend-Teststrategie
- Topbar sync tests
- hook tests
- panel rendering tests
- loading/error/no-data states
- chart smoke / adapter tests
- feed dedupe tests

#### 3. End-to-End-Verifikation
- initial load
- symbol switch
- timeframe switch
- reconnect
- new bar arrives
- panels refresh
- risk values update
- replay/live parity where applicable

#### 4. Performance-/Quality-Gates
- initial load target
- WS latency target
- analysis p95 target
- bundle size and render cost awareness
- no catastrophic re-render storms

#### 5. Dokumentation
- architecture overview
- ADRs
- updated acceptance matrix
- known limitations
- setup / run / test commands
- migration notes if legacy removed or isolated

### Endzustand

Du bist erst fertig, wenn:

- die priorisierten Acceptance-Kriterien beweisbar grün sind,
- kein Demo-Pfad mehr das Produkt dominiert,
- keine zweite Wahrheit aktiv bleibt,
- und ein anderer Engineer das Repo übernehmen könnte, ohne die Historie erraten zu müssen.


## Anti-Pattern-Katalog — Dinge, die du explizit **nicht** tun darfst

### 1. Architektur-Anti-Patterns
- Noch einen neuen App-Entrypoint einführen.
- Noch eine vierte Chart-Komponente hinzufügen.
- Live- und Replay-Zustand parallel, aber unmodelliert halten.
- Root, Symbol und Contract im selben String vermischen.
- Panel- oder Feed-Modelle pro Komponente neu definieren.
- Einen „temporary legacy bridge“ einbauen, ohne Ablauf-/Entfernungsplan.
- Einen stillen Fallback verwenden, der echte Defekte maskiert.

### 2. Daten-Anti-Patterns
- Zeitstempel „irgendwie passend“ machen, statt systemweit sauber zu vereinheitlichen.
- 5‑Minuten-Bars über Listen-Chunks statt über Zeit zu bilden.
- Lücken und Session-Grenzen zu ignorieren.
- Echtzeit-Wallclock mit historischem Datenkontext zu vermischen.
- Winrates/Stats ohne Quelle oder Evaluationsregeln zu zeigen.
- Preis-/Volumen-/Timeframe-Werte hart zu verdrahten, nur weil es hübsch aussieht.

### 3. Frontend-Anti-Patterns
- Lokalen Component-State für globale Selektion missbrauchen.
- `any`/Type-Casts stapeln, um Build-Fehler unsichtbar zu machen.
- Demo-Defaults in sichtbaren Produktkomponenten lassen.
- Reconnect-Status, stale data oder loading unsichtbar lassen.
- Chart- oder Panel-Refresh an mehrere unkoordinierte `useEffect`-Ketten hängen.
- Einen Wert in der Topbar zeigen, der aus einer anderen Quelle als Chart/Panels stammt.

### 4. Chart-Anti-Patterns
- Kompletter Chart-Rebuild pro Update.
- Gemischte X-Semantiken zwischen Candles, Volume, VWAP und Markern.
- Marker-/PriceLine-Neuaufbau bei jedem Kleinst-Update ohne Not.
- Session-/Level-Overlays auf potenziell falschen Zeitstempeln berechnen.
- „Visuell okay“ als Ersatz für fachlich korrekt akzeptieren.

### 5. Forecasting-Anti-Patterns
- Foundation Models vor Baselines.
- Backtests ohne Walk-Forward.
- Modell-Output als Sicherheit statt als Unsicherheit kommunizieren.
- Probability ohne Sample-Size-/Regime-Hinweis.
- Research-Code direkt in den Livepfad kippen, bevor Verträge und Benchmarks stehen.

### 6. QA-Anti-Patterns
- Grün nur auf Teilkommandos behaupten.
- Legacy-Tests grün haben, während das Zielsystem rot ist.
- CI-/Installationsschritte implizit lassen.
- Unklare manuelle Schritte nicht dokumentieren.
- Eine offene Hardcoded-Demo-Stelle „für später“ im finalen Pfad liegen lassen.

Wenn du eines dieser Muster in dir selbst bemerkst, stopp, korrigiere die Architekturentscheidung und arbeite erst dann weiter.

## Verifikationsvertrag

Nach jeder Hauptphase musst du, soweit die lokale Umgebung es zulässt, **wirklich** prüfen:

### Backend
- Import / app startup
- relevante unit/integration tests
- exemplarische Route-Calls
- DB-readiness
- WS-connect / disconnect / incremental updates

### Frontend
- TypeScript typecheck
- Build
- zentrale Hook-/Store-Tests
- sichtbare Pfade auf Demo-/Hardcode-Reste prüfen

### Funktionsfluss
- Markt wechseln
- Symbol/Contract wechseln
- Timeframe wechseln
- Initialload + anschließende Live-Updates
- Panels aktualisieren
- Feed reagiert
- Risk-/Config-Zustand passt
- ggf. Replay bleibt konsistent

### Dokumentation
- Acceptance-Matrix aktualisieren
- Entscheidungsnotizen ergänzen
- offene Punkte explizit festhalten

Wenn eine Verifikation lokal nicht möglich ist, musst du:
1. den Grund nennen,
2. die statische Evidenz dokumentieren,
3. und den fehlenden Nachweis in die offene Risiko-/Handoff-Liste aufnehmen.

**Nicht erlaubt:** stillschweigend so tun, als sei eine Prüfung erfolgt.

## Befehls- und Prüf-Checkliste, die du im Verlauf adaptieren sollst

> Passe Pfade/Befehle an das tatsächliche Repo an, aber halte die Logik ein.

### Python / Backend
```bash
cd engine
python -m pip install -e ".[dev]"
python -m pytest -q
uvicorn src.arctis.main:app --reload
```

### Falls Editable-Install nicht verwendet wird
```bash
cd engine
PYTHONPATH=src python -m pytest -q
```

### Frontend
```bash
cd app
pnpm install
pnpm run build
pnpm exec tsc --noEmit
```

### Optionale gezielte Prüfungen
```bash
# API smoke tests
curl http://127.0.0.1:8001/health
curl "http://127.0.0.1:8001/api/markets"
curl "http://127.0.0.1:8001/api/db/bars?symbol=NQH6&days=5&timeframe=1min"
curl "http://127.0.0.1:8001/api/analysis/structure?market=NQ&timeframe=1min"

# WS smoke (Beispiel, je nach Tooling)
# mit websocat oder Browser-Konsole
```

### Deterministische Fachtests, die du ergänzen sollst
- Timestamp parser unit tests
- 5‑minute aggregation edge cases
- symbol resolution tests
- /api/markets contract tests
- WebSocket connect/disconnect/dedupe tests
- panel hook tests
- feed engine tests
- probability benchmark sanity tests
```

## Dokumentations-Checkliste
- Setup-Guide
- Run-Guide
- Test-Guide
- Acceptance-Matrix
- ADRs
- Known Limitations
- Migration notes

## Output-Vertrag für dein finales Ergebnis

Am Ende deiner autonomen Arbeit musst du mindestens liefern:

1. **Kurzreport**
   - was geändert wurde,
   - welche zentralen Architekturentscheidungen gefallen sind,
   - welche Acceptance-Kriterien jetzt grün/gelb/rot sind.

2. **Technischer Report**
   - Datenmodell,
   - Live-/WS-Flow,
   - Chart-Architektur,
   - Panel- und Feed-Modell,
   - Probability-/Research-Layer,
   - Tests,
   - Performance-/Runtime-Einschätzung.

3. **Änderungsliste nach Dateien**
   - welche Dateien neu sind,
   - welche Dateien geändert wurden,
   - welche Dateien entfernt oder deprecatiert wurden.

4. **Verifikationsbelege**
   - welche Kommandos liefen,
   - welche Ergebnisse kamen heraus,
   - was ggf. nicht vollständig beweisbar war.

5. **Known Limitations**
   - offen gebliebene Risiken,
   - bewusste Scope-Cuts,
   - nächste sinnvolle Schritte.

6. **Aktualisierte Acceptance-Matrix**
   - mit ehrlicher Statuskennzeichnung.

## Striktes Erfolgskriterium

Du bist **nicht** fertig, wenn nur die Oberfläche schöner ist.
Du bist erst fertig, wenn die Datenkette, das Charting, die Live-Panels und die Korrektheit des Produktkerns zusammenpassen.

## Story-für-Story-Ausführungsledger

Die folgenden 64 Story-Blöcke zwingen dich, das volle PRD nicht aus den Augen zu verlieren. Arbeite sie entlang der Phasen und Abhängigkeiten ab; markiere niemals eine Story als fertig, wenn sie nur fragmentarisch oder in einem toten Pfad existiert.


### US-001: Connect All Analysis Endpoints to TimescaleDB

**Epic / Priorität:** Epic 0: Foundation (P0) / P0

**Snapshot-Status:** teilweise, aber nicht abnahmefähig

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:167`

**Dein Auftrag für diese Story:**
Diese Story gehört zum Fundament. Behandle sie als nicht verhandelbar und mit höchster technischer Strenge. Arbeite datenmodellgetrieben und überprüfe jede API-Signatur gegen Frontend-Typen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/db.py`
- `engine/src/arctis/models.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Hauptanalysen in `routes/analysis.py` sind bereits teilweise auf `fetch_bars_as_models()` umgestellt.
- `routes/probability.py` liest weiter aus `ParquetStore` und verletzt damit die Zielidee eines einheitlichen `/api/analysis/*`-Pfads.
- `db.py` benutzt einen DB-Zugriffspfad, der im Python-Projekt derzeit nicht sauber paketiert ist.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.
- API-Vertrag mit realen DB-Daten oder einem deterministischen Testdouble nachgewiesen.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Frontend-State/Realtime-Schicht, sobald die Datenverträge stabil sind.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-002: Dynamic Market Selector

**Epic / Priorität:** Epic 0: Foundation (P0) / P0

**Snapshot-Status:** teilweise, Route vorhanden aber nicht end-to-end fertig

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:194`

**Dein Auftrag für diese Story:**
Diese Story gehört zum Fundament. Behandle sie als nicht verhandelbar und mit höchster technischer Strenge. Arbeite datenmodellgetrieben und überprüfe jede API-Signatur gegen Frontend-Typen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/db.py`
- `engine/src/arctis/models.py`
- `app/src/components/layout/Topbar.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- `/api/markets`-Route existiert bereits.
- Die Topbar ist aber vollständig hardcodiert.
- Backend-Typen und Topbar-Märkte passen aktuell nicht zusammen.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.
- API-Vertrag mit realen DB-Daten oder einem deterministischen Testdouble nachgewiesen.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Frontend-State/Realtime-Schicht, sobald die Datenverträge stabil sind.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-003: Timeframe Selector with On-the-fly Aggregation

**Epic / Priorität:** Epic 0: Foundation (P0) / P0

**Snapshot-Status:** teilweise, fachlich fehlerhaft

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:219`

**Dein Auftrag für diese Story:**
Diese Story gehört zum Fundament. Behandle sie als nicht verhandelbar und mit höchster technischer Strenge. Arbeite datenmodellgetrieben und überprüfe jede API-Signatur gegen Frontend-Typen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/db.py`
- `engine/src/arctis/models.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es gibt eine `_aggregate_5min()`-Funktion, aber sie chunked nur in Fünfergruppen.
- `/api/db/bars` akzeptiert noch kein echtes Timeframe-Contract für diese Story.
- UI-Timeframe-Strings und Backend-Timeframes sind derzeit inkonsistent.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.
- API-Vertrag mit realen DB-Daten oder einem deterministischen Testdouble nachgewiesen.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Frontend-State/Realtime-Schicht, sobald die Datenverträge stabil sind.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-004: WebSocket Endpoint for Live Bar Updates

**Epic / Priorität:** Epic 0: Foundation (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:246`

**Dein Auftrag für diese Story:**
Diese Story gehört zum Fundament. Behandle sie als nicht verhandelbar und mit höchster technischer Strenge. Erzwinge deduplizierte Incrementals, Heartbeats, Backoff-Reconnect und saubere Unsubscribe-Semantik.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/db.py`
- `engine/src/arctis/models.py`
- `app/src/hooks/useMarketData.ts`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im Snapshot wurde kein echter WS-Bar-Endpoint gefunden.
- CORS/HTTP-Grundgerüst existiert bereits in `main.py`.
- Die Analysis-/Panel-Schicht wartet faktisch auf einen solchen Live-Trigger.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.
- API-Vertrag mit realen DB-Daten oder einem deterministischen Testdouble nachgewiesen.
- WebSocket-Verbindung sendet initialen Snapshot/letzte Bar und danach nur deduplizierte Incrementals.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Frontend-State/Realtime-Schicht, sobald die Datenverträge stabil sind.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-005: Frontend WebSocket Hook (useMarketData)

**Epic / Priorität:** Epic 0: Foundation (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:277`

**Dein Auftrag für diese Story:**
Diese Story gehört zum Fundament. Behandle sie als nicht verhandelbar und mit höchster technischer Strenge. Erzwinge deduplizierte Incrementals, Heartbeats, Backoff-Reconnect und saubere Unsubscribe-Semantik.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/hooks/useMarketData.ts`
- `app/src/api.ts`
- `app/src/store/*`
- `engine/src/arctis/main.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Kein `app/src/hooks/useMarketData.ts` im Snapshot gefunden.
- Der gestartete App-Pfad nutzt stattdessen ein einmaliges Inline-`fetch()`.
- Reconnection, cleanup und dedupe fehlen damit komplett.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.
- Hook behandelt initial load, reconnect und cleanup korrekt.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Frontend-State/Realtime-Schicht, sobald die Datenverträge stabil sind.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-006: Session Panel — Live Data

**Epic / Priorität:** Epic 1: Live Panels (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:313`

**Dein Auftrag für diese Story:**
Diese Story ist im UI sichtbar. Jede halbe Implementierung oder jeder Demo-Placeholder ist hier ein Produktfehler. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/App.tsx`
- `app/src/components/panels/*`
- `app/src/api.ts`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/risk.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im gemounteten App-Pfad werden die Panels ohne echte Datenprop gerendert.
- Es existieren bereits API-Client-Funktionen in `app/src/api.ts`.
- Ein älterer Dashboard-Prototyp zeigt, welche Daten ungefähr gebraucht werden, ist aber nicht der produktive Pfad.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Panel-/HUD-Integration und Feed-Engine.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-007: Confluence Panel — Live Score

**Epic / Priorität:** Epic 1: Live Panels (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:339`

**Dein Auftrag für diese Story:**
Diese Story ist im UI sichtbar. Jede halbe Implementierung oder jeder Demo-Placeholder ist hier ein Produktfehler. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/App.tsx`
- `app/src/components/panels/*`
- `app/src/api.ts`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/risk.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im gemounteten App-Pfad werden die Panels ohne echte Datenprop gerendert.
- Es existieren bereits API-Client-Funktionen in `app/src/api.ts`.
- Ein älterer Dashboard-Prototyp zeigt, welche Daten ungefähr gebraucht werden, ist aber nicht der produktive Pfad.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Panel-/HUD-Integration und Feed-Engine.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-008: Patterns Panel — Live Patterns

**Epic / Priorität:** Epic 1: Live Panels (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:365`

**Dein Auftrag für diese Story:**
Diese Story ist im UI sichtbar. Jede halbe Implementierung oder jeder Demo-Placeholder ist hier ein Produktfehler. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/App.tsx`
- `app/src/components/panels/*`
- `app/src/api.ts`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/risk.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im gemounteten App-Pfad werden die Panels ohne echte Datenprop gerendert.
- Es existieren bereits API-Client-Funktionen in `app/src/api.ts`.
- Ein älterer Dashboard-Prototyp zeigt, welche Daten ungefähr gebraucht werden, ist aber nicht der produktive Pfad.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Panel-/HUD-Integration und Feed-Engine.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-009: Feed Panel — Real Events

**Epic / Priorität:** Epic 1: Live Panels (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:392`

**Dein Auftrag für diese Story:**
Diese Story ist im UI sichtbar. Jede halbe Implementierung oder jeder Demo-Placeholder ist hier ein Produktfehler. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/App.tsx`
- `app/src/components/panels/*`
- `app/src/api.ts`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/risk.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im gemounteten App-Pfad werden die Panels ohne echte Datenprop gerendert.
- Es existieren bereits API-Client-Funktionen in `app/src/api.ts`.
- Ein älterer Dashboard-Prototyp zeigt, welche Daten ungefähr gebraucht werden, ist aber nicht der produktive Pfad.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Panel-/HUD-Integration und Feed-Engine.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-010: Risk Panel — Connected to Config and Daily Check

**Epic / Priorität:** Epic 1: Live Panels (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:419`

**Dein Auftrag für diese Story:**
Diese Story ist im UI sichtbar. Jede halbe Implementierung oder jeder Demo-Placeholder ist hier ein Produktfehler. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/App.tsx`
- `app/src/components/panels/*`
- `app/src/api.ts`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/risk.py`
- `app/src/components/panels/RiskPanel.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im gemounteten App-Pfad werden die Panels ohne echte Datenprop gerendert.
- Es existieren bereits API-Client-Funktionen in `app/src/api.ts`.
- Ein älterer Dashboard-Prototyp zeigt, welche Daten ungefähr gebraucht werden, ist aber nicht der produktive Pfad.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Panel-/HUD-Integration und Feed-Engine.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-011: HUD Metrics Strip — Live Values

**Epic / Priorität:** Epic 1: Live Panels (P0) / P0

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:444`

**Dein Auftrag für diese Story:**
Diese Story ist im UI sichtbar. Jede halbe Implementierung oder jeder Demo-Placeholder ist hier ein Produktfehler. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/App.tsx`
- `app/src/components/panels/*`
- `app/src/api.ts`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/risk.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Im gemounteten App-Pfad werden die Panels ohne echte Datenprop gerendert.
- Es existieren bereits API-Client-Funktionen in `app/src/api.ts`.
- Ein älterer Dashboard-Prototyp zeigt, welche Daten ungefähr gebraucht werden, ist aber nicht der produktive Pfad.

**Verifikationsanforderungen:**
- Relevante pytest-/Integrationstests laufen grün.
- Frontend-Build/Typecheck ist grün.
- Keine Demo-/Hardcode-Werte mehr im Nutzerpfad.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Panel-/HUD-Integration und Feed-Engine.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-012: VWAP Overlay with Standard Deviation Bands

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:476`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-013: EMA Ribbon Overlay

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:505`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-014: Volume Profile Sidebar

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:532`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-015: Session Separators

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** nicht verifiziert / vermutlich nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:560`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-016: Previous Day Levels

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:584`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-017: Opening Range Box

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:608`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-018: BOS/CHoCH Markers

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:632`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-019: Pattern Markers and Range Boxes

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** Prototyp-Fragmente vorhanden, nicht produktiv verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:659`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-020: Probability Target Zone

**Epic / Priorität:** Epic 2: Chart Enhancements (P0) / P0

**Snapshot-Status:** nicht verifiziert / vermutlich nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:684`

**Dein Auftrag für diese Story:**
Diese Story betrifft die Chartschicht. Erweitere nichts auf wackeligem X-/Zeitmodell. Validierung muss out-of-sample und walk-forward erfolgen; keine verdeckte Leakage.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/Chart.tsx`
- `app/src/components/charts/*`
- `app/src/components/Dashboard.tsx`
- `engine/src/arctis/routes/analysis.py`
- `engine/src/arctis/routes/probability.py`
- `engine/src/arctis/analysis/probability.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Es existieren mindestens zwei ungenutzte Chart-Prototypen neben dem gemounteten Minimalchart.
- Chart-Enhancements sollten auf einem einzigen kanonischen Renderer landen.
- Bevor du Overlays aufbaust, muss die Zeitachse korrekt und inkrementell updatebar sein.

**Verifikationsanforderungen:**
- Chart verliert bei neuen Bars weder Zoom-Kontext noch Overlay-Konsistenz.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Falsche X-Achsen-Semantik oder inkrementelles Update wird durch Re-Creation sabotiert.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Chart-Enhancement- und UX-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-021: Velocity Module

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:714`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-022: Auction Quality Module

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:740`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-023: Naked POC Tracker

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:768`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-024: 5-Bias-State System

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:795`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung. Validierung muss out-of-sample und walk-forward erfolgen; keine verdeckte Leakage.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-025: Bias-Switch-Level

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:824`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung. Validierung muss out-of-sample und walk-forward erfolgen; keine verdeckte Leakage.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-026: Opening Fake Detection

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:854`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-027: Double Fake Exhaustion

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:882`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-028: 60% Correction Monitor

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:912`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-029: Key Level Identification

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:937`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-030: Daily Bias Endpoint

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:964`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung. Validierung muss out-of-sample und walk-forward erfolgen; keine verdeckte Leakage.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-031: Bias Panel (Frontend)

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1003`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults. Validierung muss out-of-sample und walk-forward erfolgen; keine verdeckte Leakage.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-032: Chart Overlays for BIAS Levels

**Epic / Priorität:** Epic 3: BIAS Integration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1033`

**Dein Auftrag für diese Story:**
Diese Story betrifft Methodik/BIAS. Baue zuerst stabile Contracts, dann Regeln, dann Darstellung. Validierung muss out-of-sample und walk-forward erfolgen; keine verdeckte Leakage.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/analysis/*`
- `engine/src/arctis/routes/*`
- `app/src/components/panels/*`
- `app/src/components/charts/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Die BIAS-/Methodik-Epics sind im Snapshot praktisch nicht fertig.
- Nutze die bestehenden Analyse-Module nur dort weiter, wo ihre Datenbasis und Contracts sauber sind.
- Methodik-Module nie in UI-Mockdaten verstecken; zuerst Backend-Kontrakte definieren.

**Verifikationsanforderungen:**
- Regeln/Modelle sind mit Unit- und Szenariotests erklärt und abgesichert.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Leakage, überoptimistische Backtests oder unkalibrierte Wahrscheinlichkeiten.

**Handover-Regel:**
Handover an Bias-/Research-/UI-Darstellung nach sauberer Backend-Modellierung.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-033: Replay Engine Refactor

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** Legacy-Simulation vorhanden, aber nicht PRD-konform

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1064`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-034: Replay Timeline Scrubber

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1092`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-035: Replay Transport Controls

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1120`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-036: Replay Speed Control

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1146`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-037: Replay-Synced Panels

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1171`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-038: Replay-Synced Chart

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1199`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-039: Replay Date Picker

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1224`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-040: "Would You Have Traded?" Decision Tracker

**Epic / Priorität:** Epic 4: Replay Mode (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1250`

**Dein Auftrag für diese Story:**
Replay darf nie eine zweite, widersprüchliche Datenwelt sein. Synchronität zur Analyse ist Pflicht.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/main.py`
- `engine/src/arctis/storage.py`
- `engine/src/arctis/db.py`
- `app/src/components/Dashboard.tsx`
- `app/src/store/*`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Eine Legacy-Simulation existiert in `main.py`, basiert aber auf Parquet und ist nicht das PRD-Zielbild.
- Replay darf nicht als Sonderwelt leben.
- Panels, Chart und Feed müssen unter Replay dieselben Contracts verwenden wie live.

**Verifikationsanforderungen:**
- Replay und Live-Pfad teilen dieselben Analyse-/Render-Contracts.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.
- Split-Brain zwischen Live-, Replay- und Legacy-Pfaden.

**Handover-Regel:**
Handover an Replay-UI/Controls und Synchronisationsprüfungen.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-041: Feed Event Engine (Backend)

**Epic / Priorität:** Epic 5: Enhanced Live Feed (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1282`

**Dein Auftrag für diese Story:**
Feed-Funktionalität muss dedupliziert, typisiert und rückverfolgbar sein.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/routes/*`
- `engine/src/arctis/analysis/*`
- `app/src/components/panels/*`
- `app/src/components/Chart.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Ein Feed-Prototyp existiert, aber es gibt kein einheitliches Eventmodell.
- Feed-Engine sollte aus Analyseänderungen und nicht aus UI-Strings generiert werden.
- Linking von Feed und Chart setzt stabile Marker-/Timestamp-Verträge voraus.

**Verifikationsanforderungen:**
- Jedes Feed-Event ist aus Quellsignalen herleitbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Feed-/Alert-/Chart-Linking-Layer.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-042: Feed Event Types

**Epic / Priorität:** Epic 5: Enhanced Live Feed (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1307`

**Dein Auftrag für diese Story:**
Feed-Funktionalität muss dedupliziert, typisiert und rückverfolgbar sein.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/routes/*`
- `engine/src/arctis/analysis/*`
- `app/src/components/panels/*`
- `app/src/components/Chart.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Ein Feed-Prototyp existiert, aber es gibt kein einheitliches Eventmodell.
- Feed-Engine sollte aus Analyseänderungen und nicht aus UI-Strings generiert werden.
- Linking von Feed und Chart setzt stabile Marker-/Timestamp-Verträge voraus.

**Verifikationsanforderungen:**
- Jedes Feed-Event ist aus Quellsignalen herleitbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Feed-/Alert-/Chart-Linking-Layer.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-043: Feed Filtering

**Epic / Priorität:** Epic 5: Enhanced Live Feed (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1334`

**Dein Auftrag für diese Story:**
Feed-Funktionalität muss dedupliziert, typisiert und rückverfolgbar sein.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/routes/*`
- `engine/src/arctis/analysis/*`
- `app/src/components/panels/*`
- `app/src/components/Chart.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Ein Feed-Prototyp existiert, aber es gibt kein einheitliches Eventmodell.
- Feed-Engine sollte aus Analyseänderungen und nicht aus UI-Strings generiert werden.
- Linking von Feed und Chart setzt stabile Marker-/Timestamp-Verträge voraus.

**Verifikationsanforderungen:**
- Jedes Feed-Event ist aus Quellsignalen herleitbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Feed-/Alert-/Chart-Linking-Layer.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-044: Feed-to-Chart Linking

**Epic / Priorität:** Epic 5: Enhanced Live Feed (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1359`

**Dein Auftrag für diese Story:**
Feed-Funktionalität muss dedupliziert, typisiert und rückverfolgbar sein.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/routes/*`
- `engine/src/arctis/analysis/*`
- `app/src/components/panels/*`
- `app/src/components/Chart.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Ein Feed-Prototyp existiert, aber es gibt kein einheitliches Eventmodell.
- Feed-Engine sollte aus Analyseänderungen und nicht aus UI-Strings generiert werden.
- Linking von Feed und Chart setzt stabile Marker-/Timestamp-Verträge voraus.

**Verifikationsanforderungen:**
- Jedes Feed-Event ist aus Quellsignalen herleitbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Feed-/Alert-/Chart-Linking-Layer.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-045: Feed Sound Alerts

**Epic / Priorität:** Epic 5: Enhanced Live Feed (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1383`

**Dein Auftrag für diese Story:**
Feed-Funktionalität muss dedupliziert, typisiert und rückverfolgbar sein.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `engine/src/arctis/routes/*`
- `engine/src/arctis/analysis/*`
- `app/src/components/panels/*`
- `app/src/components/Chart.tsx`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Ein Feed-Prototyp existiert, aber es gibt kein einheitliches Eventmodell.
- Feed-Engine sollte aus Analyseänderungen und nicht aus UI-Strings generiert werden.
- Linking von Feed und Chart setzt stabile Marker-/Timestamp-Verträge voraus.

**Verifikationsanforderungen:**
- Jedes Feed-Event ist aus Quellsignalen herleitbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Feed-/Alert-/Chart-Linking-Layer.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-046: Horizontal Line Tool

**Epic / Priorität:** Epic 6: Chart Drawing Tools (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1416`

**Dein Auftrag für diese Story:**
Drawing-Tools erst auf stabilem Chart-Grundgerüst bauen; Persistenz gehört von Anfang an ins Modell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/charts/*`
- `app/src/store/*`
- `backend persistence layer`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Drawing-Tools sind im Snapshot nicht produktiv umgesetzt.
- Baue keine Zeichentools auf einem noch instabilen Renderer auf.
- Persistenz muss Teil des Designs sein, nicht späteres Anhängsel.

**Verifikationsanforderungen:**
- Drawings sind nach Reload reproduzierbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Persistenz-/UX-/Layout-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-047: Rectangle / Zone Tool

**Epic / Priorität:** Epic 6: Chart Drawing Tools (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1442`

**Dein Auftrag für diese Story:**
Drawing-Tools erst auf stabilem Chart-Grundgerüst bauen; Persistenz gehört von Anfang an ins Modell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/charts/*`
- `app/src/store/*`
- `backend persistence layer`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Drawing-Tools sind im Snapshot nicht produktiv umgesetzt.
- Baue keine Zeichentools auf einem noch instabilen Renderer auf.
- Persistenz muss Teil des Designs sein, nicht späteres Anhängsel.

**Verifikationsanforderungen:**
- Drawings sind nach Reload reproduzierbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Persistenz-/UX-/Layout-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-048: Trend Line Tool

**Epic / Priorität:** Epic 6: Chart Drawing Tools (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1467`

**Dein Auftrag für diese Story:**
Drawing-Tools erst auf stabilem Chart-Grundgerüst bauen; Persistenz gehört von Anfang an ins Modell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/charts/*`
- `app/src/store/*`
- `backend persistence layer`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Drawing-Tools sind im Snapshot nicht produktiv umgesetzt.
- Baue keine Zeichentools auf einem noch instabilen Renderer auf.
- Persistenz muss Teil des Designs sein, nicht späteres Anhängsel.

**Verifikationsanforderungen:**
- Drawings sind nach Reload reproduzierbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Persistenz-/UX-/Layout-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-049: Text Annotation Tool

**Epic / Priorität:** Epic 6: Chart Drawing Tools (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1492`

**Dein Auftrag für diese Story:**
Drawing-Tools erst auf stabilem Chart-Grundgerüst bauen; Persistenz gehört von Anfang an ins Modell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/charts/*`
- `app/src/store/*`
- `backend persistence layer`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Drawing-Tools sind im Snapshot nicht produktiv umgesetzt.
- Baue keine Zeichentools auf einem noch instabilen Renderer auf.
- Persistenz muss Teil des Designs sein, nicht späteres Anhängsel.

**Verifikationsanforderungen:**
- Drawings sind nach Reload reproduzierbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Persistenz-/UX-/Layout-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-050: Drawing Persistence

**Epic / Priorität:** Epic 6: Chart Drawing Tools (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1517`

**Dein Auftrag für diese Story:**
Drawing-Tools erst auf stabilem Chart-Grundgerüst bauen; Persistenz gehört von Anfang an ins Modell.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/charts/*`
- `app/src/store/*`
- `backend persistence layer`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Drawing-Tools sind im Snapshot nicht produktiv umgesetzt.
- Baue keine Zeichentools auf einem noch instabilen Renderer auf.
- Persistenz muss Teil des Designs sein, nicht späteres Anhängsel.

**Verifikationsanforderungen:**
- Drawings sind nach Reload reproduzierbar.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Persistenz-/UX-/Layout-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-051: Settings Slide-Over Panel

**Epic / Priorität:** Epic 7: Settings & Configuration (P1) / P1

**Snapshot-Status:** UI-Prototyp vorhanden, aber nicht verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1548`

**Dein Auftrag für diese Story:**
Settings dürfen nicht nur optisch existieren; sie brauchen Persistenz, Typen und Rückkopplung in die Runtime. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/SettingsPanel.tsx`
- `app/src/components/layout/*`
- `engine/src/arctis/routes/risk.py`
- `engine/src/arctis/config.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- `SettingsPanel.tsx` existiert als Fragment/Prototyp.
- Config-Endpunkte existieren bereits teilweise im Backend.
- Die UI muss an echte Persistenz und Runtime-Effekte gekoppelt werden.

**Verifikationsanforderungen:**
- Settings beeinflussen Runtime nachweisbar und persistent.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Runtime-Config, Persistence und UX.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-052: Connection Settings Tab

**Epic / Priorität:** Epic 7: Settings & Configuration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1574`

**Dein Auftrag für diese Story:**
Settings dürfen nicht nur optisch existieren; sie brauchen Persistenz, Typen und Rückkopplung in die Runtime.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/SettingsPanel.tsx`
- `app/src/components/layout/*`
- `engine/src/arctis/routes/risk.py`
- `engine/src/arctis/config.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- `SettingsPanel.tsx` existiert als Fragment/Prototyp.
- Config-Endpunkte existieren bereits teilweise im Backend.
- Die UI muss an echte Persistenz und Runtime-Effekte gekoppelt werden.

**Verifikationsanforderungen:**
- Settings beeinflussen Runtime nachweisbar und persistent.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Runtime-Config, Persistence und UX.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-053: Risk Settings Tab

**Epic / Priorität:** Epic 7: Settings & Configuration (P1) / P1

**Snapshot-Status:** Backend-Config-Endpunkte vorhanden; UI nicht verdrahtet

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1599`

**Dein Auftrag für diese Story:**
Settings dürfen nicht nur optisch existieren; sie brauchen Persistenz, Typen und Rückkopplung in die Runtime.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/SettingsPanel.tsx`
- `app/src/components/layout/*`
- `engine/src/arctis/routes/risk.py`
- `engine/src/arctis/config.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- `SettingsPanel.tsx` existiert als Fragment/Prototyp.
- Config-Endpunkte existieren bereits teilweise im Backend.
- Die UI muss an echte Persistenz und Runtime-Effekte gekoppelt werden.

**Verifikationsanforderungen:**
- Settings beeinflussen Runtime nachweisbar und persistent.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Runtime-Config, Persistence und UX.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-054: Display Settings Tab

**Epic / Priorität:** Epic 7: Settings & Configuration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1626`

**Dein Auftrag für diese Story:**
Settings dürfen nicht nur optisch existieren; sie brauchen Persistenz, Typen und Rückkopplung in die Runtime.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/SettingsPanel.tsx`
- `app/src/components/layout/*`
- `engine/src/arctis/routes/risk.py`
- `engine/src/arctis/config.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- `SettingsPanel.tsx` existiert als Fragment/Prototyp.
- Config-Endpunkte existieren bereits teilweise im Backend.
- Die UI muss an echte Persistenz und Runtime-Effekte gekoppelt werden.

**Verifikationsanforderungen:**
- Settings beeinflussen Runtime nachweisbar und persistent.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Runtime-Config, Persistence und UX.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-055: Alert Settings Tab

**Epic / Priorität:** Epic 7: Settings & Configuration (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1652`

**Dein Auftrag für diese Story:**
Settings dürfen nicht nur optisch existieren; sie brauchen Persistenz, Typen und Rückkopplung in die Runtime.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/components/SettingsPanel.tsx`
- `app/src/components/layout/*`
- `engine/src/arctis/routes/risk.py`
- `engine/src/arctis/config.py`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- `SettingsPanel.tsx` existiert als Fragment/Prototyp.
- Config-Endpunkte existieren bereits teilweise im Backend.
- Die UI muss an echte Persistenz und Runtime-Effekte gekoppelt werden.

**Verifikationsanforderungen:**
- Settings beeinflussen Runtime nachweisbar und persistent.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an Runtime-Config, Persistence und UX.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-056: Travis Knowledge Panel

**Epic / Priorität:** Epic 8: Travis MCP Integration (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1683`

**Dein Auftrag für diese Story:**
MCP-/Wissensintegration niemals vor das funktionierende Kernprodukt ziehen. Implementiere Loading-, Error- und Empty-State explizit; keine stillen Defaults.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `MCP/Integration layer`
- `app/src/components/*`
- `backend suggestion/context endpoints`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Travis/MCP-Storys sind im Snapshot nicht produktiv umgesetzt.
- Diese Integration darf das Kernprodukt weder blockieren noch kaschieren.
- Baue sie nur auf stabilem Kontextmodell auf.

**Verifikationsanforderungen:**
- Kontextsensitive Vorschläge verschlechtern nie die Kernlatenz und bleiben optional.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an optionale Wissens-/Suggestion-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-057: Travis Contextual Suggestions

**Epic / Priorität:** Epic 8: Travis MCP Integration (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1709`

**Dein Auftrag für diese Story:**
MCP-/Wissensintegration niemals vor das funktionierende Kernprodukt ziehen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `MCP/Integration layer`
- `app/src/components/*`
- `backend suggestion/context endpoints`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Travis/MCP-Storys sind im Snapshot nicht produktiv umgesetzt.
- Diese Integration darf das Kernprodukt weder blockieren noch kaschieren.
- Baue sie nur auf stabilem Kontextmodell auf.

**Verifikationsanforderungen:**
- Kontextsensitive Vorschläge verschlechtern nie die Kernlatenz und bleiben optional.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an optionale Wissens-/Suggestion-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-058: Travis Search Command

**Epic / Priorität:** Epic 8: Travis MCP Integration (P2) / P2

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1733`

**Dein Auftrag für diese Story:**
MCP-/Wissensintegration niemals vor das funktionierende Kernprodukt ziehen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `MCP/Integration layer`
- `app/src/components/*`
- `backend suggestion/context endpoints`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Travis/MCP-Storys sind im Snapshot nicht produktiv umgesetzt.
- Diese Integration darf das Kernprodukt weder blockieren noch kaschieren.
- Baue sie nur auf stabilem Kontextmodell auf.

**Verifikationsanforderungen:**
- Kontextsensitive Vorschläge verschlechtern nie die Kernlatenz und bleiben optional.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an optionale Wissens-/Suggestion-Schicht.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-059: Loading Skeletons

**Epic / Priorität:** Epic 9: Polish & UX (P1) / P1

**Snapshot-Status:** teilweise, Loading-Skeleton nur punktuell

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1765`

**Dein Auftrag für diese Story:**
Polish ohne fundamentale Korrektheit ist Kosmetik; diese Storys erst nach technischer Stabilisierung abschließen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/**/*`
- `engine/tests/*`
- `app tests`
- `build config`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Polish-Storys erst nach technischen Kernreparaturen ernsthaft abschließen.
- Teilweise existieren Fragmente wie ErrorBoundary oder einzelne Skeletons.
- Bewerte sie nicht isoliert, sondern gegen das Gesamtprodukt.

**Verifikationsanforderungen:**
- Kein UI-Polish bricht bestehende Flows oder Performanceziele.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an QA/Polish/Release.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-060: Error States

**Epic / Priorität:** Epic 9: Polish & UX (P1) / P1

**Snapshot-Status:** teilweise, ErrorBoundary vorhanden aber unvollständig

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1791`

**Dein Auftrag für diese Story:**
Polish ohne fundamentale Korrektheit ist Kosmetik; diese Storys erst nach technischer Stabilisierung abschließen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/**/*`
- `engine/tests/*`
- `app tests`
- `build config`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Polish-Storys erst nach technischen Kernreparaturen ernsthaft abschließen.
- Teilweise existieren Fragmente wie ErrorBoundary oder einzelne Skeletons.
- Bewerte sie nicht isoliert, sondern gegen das Gesamtprodukt.

**Verifikationsanforderungen:**
- Kein UI-Polish bricht bestehende Flows oder Performanceziele.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an QA/Polish/Release.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-061: Keyboard Shortcuts

**Epic / Priorität:** Epic 9: Polish & UX (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1817`

**Dein Auftrag für diese Story:**
Polish ohne fundamentale Korrektheit ist Kosmetik; diese Storys erst nach technischer Stabilisierung abschließen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/**/*`
- `engine/tests/*`
- `app tests`
- `build config`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Polish-Storys erst nach technischen Kernreparaturen ernsthaft abschließen.
- Teilweise existieren Fragmente wie ErrorBoundary oder einzelne Skeletons.
- Bewerte sie nicht isoliert, sondern gegen das Gesamtprodukt.

**Verifikationsanforderungen:**
- Kein UI-Polish bricht bestehende Flows oder Performanceziele.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an QA/Polish/Release.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-062: Responsive Layout

**Epic / Priorität:** Epic 9: Polish & UX (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1847`

**Dein Auftrag für diese Story:**
Polish ohne fundamentale Korrektheit ist Kosmetik; diese Storys erst nach technischer Stabilisierung abschließen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/**/*`
- `engine/tests/*`
- `app tests`
- `build config`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Polish-Storys erst nach technischen Kernreparaturen ernsthaft abschließen.
- Teilweise existieren Fragmente wie ErrorBoundary oder einzelne Skeletons.
- Bewerte sie nicht isoliert, sondern gegen das Gesamtprodukt.

**Verifikationsanforderungen:**
- Kein UI-Polish bricht bestehende Flows oder Performanceziele.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an QA/Polish/Release.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-063: Performance Optimization

**Epic / Priorität:** Epic 9: Polish & UX (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1873`

**Dein Auftrag für diese Story:**
Polish ohne fundamentale Korrektheit ist Kosmetik; diese Storys erst nach technischer Stabilisierung abschließen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/**/*`
- `engine/tests/*`
- `app tests`
- `build config`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Polish-Storys erst nach technischen Kernreparaturen ernsthaft abschließen.
- Teilweise existieren Fragmente wie ErrorBoundary oder einzelne Skeletons.
- Bewerte sie nicht isoliert, sondern gegen das Gesamtprodukt.

**Verifikationsanforderungen:**
- Kein UI-Polish bricht bestehende Flows oder Performanceziele.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an QA/Polish/Release.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.


### US-064: Favicon, Page Title, App Icon

**Epic / Priorität:** Epic 9: Polish & UX (P1) / P1

**Snapshot-Status:** nicht umgesetzt

**PRD-Referenz:** `docs/superpowers/specs/2026-03-22-arctis-saas-platform-design.md:1900`

**Dein Auftrag für diese Story:**
Polish ohne fundamentale Korrektheit ist Kosmetik; diese Storys erst nach technischer Stabilisierung abschließen.

**Pflichtvorgehen:**
1. Lies die exakte PRD-Sektion dieser Story und extrahiere Zielzustand, Datenbedarf, UI-Bedarf und Abnahmekriterien.
2. Verifiziere am Snapshot, ob bereits Fragmente existieren, die wiederverwendet, gehärtet oder bewusst verworfen werden müssen.
3. Implementiere diese Story nur auf Basis des kanonischen Daten-, State- und Render-Pfads.
4. Ergänze oder aktualisiere Tests, Typen und Dokumentation unmittelbar mit.
5. Markiere die Story erst dann als erledigt, wenn sie im echten Produktpfad sichtbar bzw. überprüfbar ist.

**Primäre Dateien / Module, die du sehr wahrscheinlich anfassen musst:**
- `app/src/**/*`
- `engine/tests/*`
- `app tests`
- `build config`

**Snapshot-Hinweise, die du vor dem Patch kurz prüfen sollst:**
- Polish-Storys erst nach technischen Kernreparaturen ernsthaft abschließen.
- Teilweise existieren Fragmente wie ErrorBoundary oder einzelne Skeletons.
- Bewerte sie nicht isoliert, sondern gegen das Gesamtprodukt.

**Verifikationsanforderungen:**
- Kein UI-Polish bricht bestehende Flows oder Performanceziele.

**Haupt-Risiken / Failure Modes:**
- Schneller sichtbarer Fortschritt ohne saubere Datenquelle.
- Dead code oder Parallelpfade statt kanonischer Umsetzung.
- Ungetestete Randfälle rund um Zeit, Sessions, Rollovers, Lücken oder Symbolwechsel.

**Handover-Regel:**
Handover an QA/Polish/Release.

**Definition einer schlechten, nicht akzeptablen „Erledigung“:**
- Story ist nur im Codefragment vorhanden, aber nicht im gemounteten Nutzerpfad.
- Story verlässt sich auf Demo-/Mock-/Fallback-Werte.
- Story bricht Typen, Tests oder verdrängt das Problem in eine zweite Komponente.
- Story sieht optisch okay aus, ist aber daten- oder zeitsemantisch unzuverlässig.



## Schlussanweisung

Arbeite kompromisslos gegen Split-Brain, Demo-Daten und Scheinfortschritt. Repariere zuerst Wahrheit, dann Transport, dann Rendering, dann Panels, dann Research, dann Ausbau, dann Polish.

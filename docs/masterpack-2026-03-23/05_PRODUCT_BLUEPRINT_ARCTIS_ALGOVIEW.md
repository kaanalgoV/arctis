# Product Blueprint — Arctis × AlgoView als SaaS-fähiges Trader Context OS

## 1. Produktthese

Arctis × AlgoView ist **kein gewöhnliches Charttool** und **kein allgemeines Brokerage-Terminal**.

Es ist ein **Trader Context OS**:

eine Plattform, die Märkte und Setups automatisch erkennt, markiert, erklärt, priorisiert und kontextualisiert — und diese Erkenntnisse über Live-Workspace, Radar/Scanner, Alerts, Replay und Journal miteinander verbindet.

## 2. Die Kernidee in einem Satz

**AlgoView findet relevante Märkte und Chancen.  
Arctis erklärt und operationalisiert sie im Detail.  
Der gemeinsame Kern ist eine AI-gestützte Context Engine.**

---

## 3. Das Produktproblem

Trader leiden selten unter „zu wenig Daten“.  
Sie leiden unter:

- zu vielen gleichzeitigen Signalen,
- mangelnder Priorisierung,
- fehlendem strukturiertem Kontext,
- inkonsistentem Zusammenspiel von Chart, Bias, Session, Levels und Regime,
- fehlender Lernschleife zwischen Beobachtung, Entscheidung, Ergebnis und Review.

Die Plattform muss daher nicht bloß Daten visualisieren, sondern **kognitive Last reduzieren**.

---

## 4. Zielnutzer

## Primärpersona A — diskretionärer Intraday-Futures-Trader
Will:
- ES/NQ/CL/GC/FX/Futures-Kontexte schnell erfassen
- nicht jede Session manuell annotieren
- strukturierte Alerts statt Lärm
- klare Invalidation und Kontext

## Primärpersona B — fortgeschrittener Methodik-Trader / Mentor
Will:
- Setups reproduzierbar definieren
- Team-/Schülern dieselbe Marktwahrheit zeigen
- Reviews, Replay und Journaling nutzen
- Entscheidungen nachvollziehbar dokumentieren

## Sekundärpersona C — Prop-/Desk-/Team-Umfeld
Will:
- Workspaces
- Rollen
- geteilte Watchlists
- gemeinsame Alert- und Review-Ströme
- Auditierbarkeit

## Sekundärpersona D — ambitionierter lernender Trader
Will:
- sehen, was die Software markiert
- verstehen, warum
- sich selbst im Replay überprüfen
- von einem „Coach-Modus“ unterstützt werden

---

## 5. Jobs to be Done

### JTBD-1
„Wenn sich der Markt öffnet, will ich sofort sehen, welche Instrumente heute wirklich Aufmerksamkeit verdienen.“

### JTBD-2
„Wenn ein Chart interessant wird, will ich nicht nur eine Markierung, sondern eine saubere Begründung, warum dieser Bereich wichtig ist.“

### JTBD-3
„Wenn ein mögliches Setup auftaucht, will ich die Bedingungen, die Bestätigung und die Invalidation klar sehen.“

### JTBD-4
„Wenn ich einen Trade gemacht oder ausgelassen habe, will ich später reproduzierbar reviewen können, ob die Entscheidung im Kontext sinnvoll war.“

### JTBD-5
„Wenn ich im Team arbeite, will ich dieselbe Marktwahrheit mit anderen teilen können.“

---

## 6. Die fünf Produktpfeiler

## Pfeiler 1 — Auto-Marking
Die Software markiert selbst:
- Levels
- Zonen
- Strukturbrüche
- Sessions
- Opening Range
- VWAP/Deviation-Kontext
- Volume-/Auction-/Bias-Signale
- Pattern-/Setup-Kandidaten
- Prioritätslevel

## Pfeiler 2 — Explanation
Jede Markierung bekommt eine Erklärung:
- Was wurde erkannt?
- Welche Evidenzen stützen das?
- Warum jetzt?
- Warum an diesem Ort?
- Was bestätigt?
- Was invalidiert?
- Wie relevant ist das relativ zu anderem?

## Pfeiler 3 — Context
Nicht nur Einzel-Events, sondern Kontextkette:
- Tagesstruktur
- Sessiontyp
- Regime
- höherer vs. niedrigerer Zeitrahmen
- Auction Quality
- relative Location
- Liquidity-/Participation-Signale
- instrumentübergreifende Relevanz

## Pfeiler 4 — Actionable Workflow
Die Plattform ist nicht nur Analyse, sondern Handlungsworkflow:
- Radar
- Queue
- Alerts
- Workspace
- Replay
- Journal
- Review
- Playbooks

## Pfeiler 5 — SaaS Collaboration
Die Plattform muss organisationsfähig sein:
- Nutzer
- Rollen
- Workspaces
- gemeinsame Watchlists
- Teams
- Entitlements
- Billing
- Auditierbarkeit

---

## 7. Produktoberflächen

## A. AlgoView Radar
Zweck:
- instrumentübergreifender Marktüberblick
- Ranking
- Scanner
- Priorisierung

Enthält:
- Watchlists
- Opportunity Queue
- Scorecards
- Regime-/Session-Summary
- Top Movers / Top Context Changes
- Alert Inbox

## B. Arctis Workspace
Zweck:
- Deep-Dive auf ein Instrument und einen Chartkontext

Enthält:
- Chart
- Auto-Markierungen
- Explanation-Pane
- Feed / Context Timeline
- Bias / Session / Structure / Patterns / Zones / Signals
- Replay
- Manual drawings & notes

## C. Context Timeline
Chronologischer Ereignisstrom:
- neue Levels
- Strukturwechsel
- Bias-Switch
- Opening-Fake
- Volume-Spikes
- Regime-Umschaltungen
- Alert-Firing
- Nutzerentscheidungen

## D. Explanation Panel
Für das gerade fokussierte Objekt:
- Titel
- Kontextstufe
- Evidenzliste
- Why-now
- Why-here
- What-invalidates
- Scenario paths
- Confidence / evidence quality

## E. Replay & Coach
- historische Session wiedergeben
- nur bis zu bestimmtem Zeitpunkt analysieren
- Entscheidung dokumentieren
- Vergleich: „hättest du es genommen?“
- Nachbesprechung mit Erklärungen

## F. Journal & Playbooks
- Beobachtungen
- Entscheidungen
- Screenshots / Charts
- Tagging nach Setup-Typ
- eigene Playbooks / Team-Playbooks
- Review-Metriken

---

## 8. Was die Software automatisch tun soll

## Markieren
- relevante Levels und Zonen zeichnen
- Session-/Opening-Referenzen markieren
- Struktur-/BOS-/CHoCH-/Pattern-Ereignisse markieren
- Bias und Switch-Levels anzeigen
- Priorität im Radar setzen

## Erklären
- textuelle und strukturierte Begründung generieren
- Evidenzen normalisieren
- Widersprüche benennen
- Signale relativieren statt nur zu „triggern“

## Kontextisieren
- Einzelsignale in Regime und Tageskontext einordnen
- Multi-Timeframe-Logik herstellen
- Instrument relativ zum Rest des Universums bewerten
- Eventhistorie berücksichtigen

## Lernen
- Entscheidungen und Outcomes rückverfolgbar machen
- Replay und Review aus demselben Datenmodell speisen
- Playbooks und Teamwissen auf Markierungen abbilden

---

## 9. Nicht-Ziele / Grenzen

Damit das Produkt glaubwürdig bleibt, sind diese Grenzen wichtig:

- keine unkontrollierte Blackbox-Empfehlungsmaschine
- keine implizite Garantie „AI sagt dir den Trade“
- keine Vermischung von deskriptiver Markierung und harter Prognose
- kein Broker-/Autotrading-Kern in Phase 1 des SaaS-Ausbaus
- kein ungeprüfter Forecast-Output ohne Benchmark, Evidenz und Invalidation

---

## 10. Differenzierungsrahmen

## Gegenüber TrendSpider
Nicht nur Auto-Marking, sondern tiefere Explanation + Context + Replay/Journal.

## Gegenüber TradingView
Nicht maximale Universalität, sondern stärker kuratierte Decision Support Experience.

## Gegenüber Bookmap / Quantower
Nicht nur Mikrostruktur-Visualisierung, sondern ein erklärender, priorisierender Kontextfluss.

## Gegenüber Tickeron / Forecasting-Anbietern
Nicht nur AI-Versprechen, sondern überprüfbare, benchmarkte und kontextisierte Wahrscheinlichkeitsmodelle.

---

## 11. Der gemeinsame Kern: Context Engine

Die Context Engine ist das Herzstück des Produkts.

Sie nimmt auf:
- Market Data
- Session-/Structure-/Bias-/Volume-/Auction-Signale
- Radar-/Ranking-Scores
- User-/Workspace-/Playbook-Kontext
- Forecast-/Probability-Outputs

und erzeugt daraus:
- Markierungen
- Events
- Erklärungen
- Priorisierung
- Alerts
- Lernartefakte

### Minimaler Output pro Context Object
Jedes Objekt sollte standardisiert sein:

- `object_id`
- `object_type`
- `instrument`
- `timeframe`
- `detected_at`
- `location`
- `evidence[]`
- `context[]`
- `priority_score`
- `confidence`
- `scenario_base`
- `scenario_bull`
- `scenario_bear`
- `invalidation`
- `explanation_short`
- `explanation_long`
- `links_to_chart_entities[]`
- `links_to_feed_events[]`

---

## 12. Kernproduktflüsse

## Flow 1 — Morning Radar
1. Nutzer öffnet AlgoView
2. Plattform rankt Instrumente nach Relevanz
3. Nutzer klickt in Opportunity Queue
4. Arctis Workspace öffnet den tiefen Kontext
5. Auto-Marking und Explanation sind schon vorhanden

## Flow 2 — Live Session Support
1. Markt läuft live
2. neue Ereignisse werden erkannt
3. Feed/Timeline aktualisiert sich
4. Chart-Markierungen werden inkrementell ergänzt
5. Nutzer erhält „why now / invalidation / priority“

## Flow 3 — Alert to Workspace
1. Alert wird ausgelöst
2. Nutzer springt direkt in den betroffenen Kontext
3. relevante Evidenzen werden vorgefiltert angezeigt
4. Setup wird dokumentierbar

## Flow 4 — Replay & Review
1. Nutzer wählt vergangenen Tag / Session
2. Plattform spielt Zustand chronologisch nach
3. Nutzer markiert Entscheidungspunkte
4. Review-Report entsteht
5. Erkenntnisse fließen ins Journal/Playbook

---

## 13. KPI-Baum

## Aktivierung
- erste Watchlist erstellt
- erstes Instrument im Workspace geöffnet
- erste automatische Markierung verstanden
- erstes Alert-Setup gespeichert

## Produktnutzung
- aktive Radar-Sessions pro Woche
- aktive Workspaces pro Tag
- Alerts mit Clickthrough
- Explanation-Open-Rate
- Replay-Sessions
- Journal-Einträge / Reviews

## Qualitätsmetriken
- Anteil erklärter vs. unerklärter Markierungen
- Konsistenz zwischen Radar, Chart und Feed
- Latenz von Live-Updates
- Rate falsch deduplizierter Events
- Nutzervertrauen in Erklärungen

## Retention / Expansion
- Wiederkehrende Nutzung
- Team-Einladungen
- aktive Shared Workspaces
- Upgrade zu höheren Plänen
- Nutzung von AI/Context Credits

---

## 14. SaaS-Produktisierung

## Mögliche Planstruktur
### Solo
- 1 Nutzer
- begrenzte Watchlists
- begrenzte AI-Kontext-Credits
- Standard-Alerts
- Journal/Replay Basis

### Pro
- mehr Instrumente / mehr Alerts
- erweiterte Radar-/Ranking-Funktionen
- tiefere Replay-/Review-Funktionen
- größere Data Retention
- mehr AI-Kontextvolumen

### Team
- mehrere Nutzer
- Rollen / Shared Workspaces
- gemeinsame Watchlists / Playbooks
- Team-Review und Audit Log
- Admin-Funktionen

### Enterprise / Desk
- SSO / SAML
- SCIM / Provisioning
- SLA / Support
- Custom Retention
- erweiterte Security und Governance
- APIs / Webhooks / Custom Integrations

## Metering-Ideen
- Seats
- aktive Alerts
- AI-Erklärungsvolumen
- gespeicherte Watchlists / Workspaces
- Replay-/Review-Nutzung
- API-/Webhook-Nutzung

---

## 15. Qualitätsprinzipien im Produkt

### Prinzip 1 — Nie nur markieren, immer erklären
### Prinzip 2 — Nie nur erklären, immer kontextualisieren
### Prinzip 3 — Nie nur prognostizieren, immer Unsicherheit zeigen
### Prinzip 4 — Nie mehrere Wahrheiten erzeugen
### Prinzip 5 — Jede wichtige UI-Aussage braucht einen Datenursprung
### Prinzip 6 — Jeder wichtige Event muss rückverfolgbar sein
### Prinzip 7 — Produktoberfläche darf Reife nicht simulieren

---

## 16. Schlussbild

Wenn Arctis × AlgoView richtig gebaut wird, sieht der Nutzer nicht einfach „mehr Indikatoren“.

Er erlebt eine Plattform, die:

- den Markt vorsortiert,
- relevante Stellen markiert,
- deren Bedeutung erklärt,
- den übergeordneten Kontext liefert,
- Handlungsoptionen und Invalidationen aufzeigt,
- Alerts und Reviews organisiert,
- und das Ganze in einer skalierbaren SaaS-Umgebung verfügbar macht.

Das ist das Produktziel.
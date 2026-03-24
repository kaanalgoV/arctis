# Competitor Research — automatisches Markieren, Erklären, Kontext und Forecasting

## Warum dieses Kapitel wichtig ist

Arctis × AlgoView darf nicht blind in den Markt laufen.

Wer nur „mehr Indikatoren“ oder „noch ein Charttool“ baut, landet in einem roten Ozean.
Deshalb verdichtet dieses Dokument den Wettbewerbsraum aus offiziellen Produkt- und Dokuquellen in eine klare Produktlogik:

- Was Nutzer heute schon erwarten
- Was Mitbewerber gut können
- Wo echte Lücken bestehen
- Womit Arctis × AlgoView glaubwürdig differenzieren kann

---

## 1. Marktcluster

Im relevanten Wettbewerbsfeld lassen sich vier Hauptcluster unterscheiden.

### Cluster A — Automatisierte Chart-/Pattern-Erkennung
Beispiele:
- TrendSpider
- Tickeron
- Teile von TradingView

### Cluster B — Script-, Scan- und Alert-Ökosysteme
Beispiele:
- TradingView / Pine Script
- StockCharts Scans
- Sierra Chart Alert-/Spreadsheet-Logik

### Cluster C — Orderflow / Depth / Heatmap / DOM
Beispiele:
- Bookmap
- Quantower
- Sierra Chart (in professionellerem Setup)

### Cluster D — Forecasting / AI-Model-Layer
Beispiele:
- Nixtla TimeGPT
- Amazon Chronos / Chronos-2
- Google TimesFM / BigQuery Forecasting
- AutoGluon, Darts, sktime, Moirai 2.0 als Baukasten/Research-Stapel

---

## 2. Was die Konkurrenz aus Nutzersicht wirklich liefert

## TrendSpider
### Stärken
- sehr klare Botschaft rund um automatisierte technische Analyse
- automatisierte Chart Pattern Recognition
- Multi-Factor-Analyse und Alerts
- gute Erwartungshaltung für „Software markiert Dinge selbst“

### Schwächen / Lücken
- Erklärlogik oft nicht tief genug als nachvollziehbarer Kontextgraph
- Trader bekommen Markierungen, aber nicht immer eine konsistente mehrstufige „Warum jetzt / warum hier / was invalidiert“-Erzählung
- kollaborative, teamfähige Lern- und Review-Workflows sind nicht der zentrale Differenzierer

### Relevanz für Arctis × AlgoView
TrendSpider setzt die Messlatte dafür, dass automatische Markierung heute kein exotisches Feature mehr ist, sondern Basiserwartung.

**Schluss:**  
Arctis × AlgoView muss mindestens dieselbe Klasse an automatischer Markierung bieten, aber zusätzlich deutlich stärker im Bereich **Erklärung + Kontext + Lernbarkeit** werden.

---

## TradingView
### Stärken
- extrem starkes Charting-Ökosystem
- riesige Nutzerbasis
- Pine Script als Ausdruckssystem
- Alerts und Community-Inhalte
- Nutzer erwarten hohe Flexibilität und schnelle Iteration

### Schwächen / Lücken
- Vieles hängt an Scripting oder Community-Logik statt an einem meinungsstarken, autonomen Kontextsystem
- zu viel Freiheit kann zu Fragmentierung führen
- Erklärungsebene ist eher Werkzeugkasten als kuratierter Entscheidungsfluss

### Relevanz
TradingView prägt die Erwartung:
- Charts müssen schnell und zuverlässig sein
- Alerts müssen präzise und konfigurierbar sein
- Nutzer wollen Erweiterbarkeit

**Schluss:**  
Arctis × AlgoView sollte nicht versuchen, TradingView als allgemeines Ökosystem zu kopieren.  
Die bessere Position ist: **weniger generisch, aber wesentlich erklärender und kuratierter**.

---

## Bookmap
### Stärken
- Orderflow-/Heatmap-/DOM-Kompetenz
- starke visuelle Markt-Mikrostruktur
- hohe Glaubwürdigkeit bei professionelleren Intraday-Tradern

### Schwächen / Lücken
- steilere Lernkurve
- Erklärung und Kontextisierung sind nicht der primäre Produktkern
- Fokus liegt stärker auf Sichtbarmachung als auf narrativer Einordnung

### Relevanz
Bookmap verschiebt die Messlatte dafür, wie „ernsthaft“ ein Tool für Intraday-/Futures-Händler wirken kann.

**Schluss:**  
Arctis × AlgoView sollte die Bookmap-Stärke nicht 1:1 imitieren, aber Orderflow-/Auction-/Liquidity-Kontext in seine Erklärschicht integrieren.

---

## Quantower / Sierra Chart
### Stärken
- sehr tiefe Profi-Werkzeuge
- Scans, Studien, DOM, professionelle Flexibilität
- hohe Integrations- und Individualisierungstiefe

### Schwächen / Lücken
- UX oft weniger meinungsstark und weniger didaktisch
- hohe Einstiegshürde
- Erklärung/Kontext/Journal/Coach meist nicht als Kernprodukt durchdesignt

### Relevanz
Diese Produkte zeigen, dass ernsthafte Trader umfangreiche Werkzeuge akzeptieren, aber nicht automatisch eine gute „decision support experience“ bekommen.

**Schluss:**  
Arctis × AlgoView kann differenzieren, indem es Profi-Tiefe mit einer moderneren, erklärenden UX verbindet.

---

## StockCharts
### Stärken
- Scans und regelbasierte Ausdruckskraft
- gute Erwartung an reproduzierbare Screening-/Ranking-Logik

### Schwächen / Lücken
- klassischeres Produktgefühl
- weniger als Live-Context-System positioniert

### Relevanz
StockCharts zeigt, wie wertvoll ein gut verständliches Scan-/Ranking-Modell ist.

**Schluss:**  
AlgoView sollte die Radar-/Scanner-Ebene von Arctis übernehmen und daraus ein priorisiertes Opportunity-System machen.

---

## Tickeron
### Stärken
- aggressive AI-/Forecast-/Pattern-Marktkommunikation
- Nutzer verstehen sofort den Nutzenversprechensraum: Muster, Prognosen, Signale

### Schwächen / Lücken
- Gefahr von Black-Box-Wahrnehmung
- Erklärbarkeit und Vertrauensaufbau sind kritisch

### Relevanz
Tickeron zeigt, dass Marktteilnehmer AI-Versprechen attraktiv finden — aber sie erhöhen zugleich das Risiko überzogener Erwartung.

**Schluss:**  
Arctis × AlgoView sollte AI/Forecasting nutzen, aber **immer mit Evidenz, Konfidenz, Invalidation und Backtest-/Benchmark-Vertrag**.

---

## 3. Forecasting-/Prediction-Stack-Landschaft

Forecasting ist kein Monolith. Für Arctis × AlgoView sind vier Ebenen zu unterscheiden.

### Ebene 1 — deterministische/rule-based Baselines
Beispiele:
- ATR-basierte Zonen
- VWAP-/Session-/Auction-Regeln
- Struktur-/Regime-Heuristiken
- probability baseline über feste Regeln

**Wert:** sofort produktisierbar, erklärbar, benchmarkbar

### Ebene 2 — klassische ML-/Tabular-/Global-Forecasting-Modelle
Beispiele:
- AutoGluon TimeSeries
- sktime
- Darts
- XGBoost-/Feature-basierte Klassifikatoren/Regressoren

**Wert:** gut für reproduzierbare Baselines, vergleichsweise transparent, oft ausreichend stark

### Ebene 3 — Foundation Time-Series Models
Beispiele:
- TimeGPT
- Chronos / Chronos-2
- TimesFM
- Moirai 2.0

**Wert:** starke Research- und API-Option, potenziell gute Zero-/Few-shot-Eigenschaften

**Risiko:** Produktteams neigen dazu, diese Modelle vorschnell als „Wahrheit“ zu verkaufen

### Ebene 4 — Produktisierte Kontext-/Narrativsysteme
Nicht primär ein Modellthema, sondern ein Produktarchitektur-Thema:
- Modelloutput
- Regeloutput
- Eventkontext
- Marktregime
- Invalidation
- Nutzerplaybook
werden in eine **erklärbare Narrative** überführt.

**Wert:** genau hier entsteht die eigentliche Differenzierung

---

## 4. Der wichtigste Wettbewerbsbefund

### Auto-Markierung allein reicht nicht
Der Markt kennt:
- Pattern-Erkennung,
- Alerts,
- Scans,
- Heatmaps,
- AI-Forecasts.

Damit ist „die Software markiert automatisch etwas“ **kein** ausreichendes Alleinstellungsmerkmal.

### Die echte Lücke liegt in der Kombination aus:
1. automatischer Markierung,
2. belastbarer Erklärung,
3. Cross-Timeframe-Kontext,
4. instrumentübergreifender Priorisierung,
5. Lern-/Replay-/Journal-Integration,
6. teamfähiger SaaS-Umgebung.

Genau dort sollte Arctis × AlgoView positioniert werden.

---

## 5. Produktpositionierung, die daraus logisch folgt

## Nicht:
- allgemeiner Chartanbieter
- allgemeine Brokerage-Workstation
- beliebige Alert-App
- Black-box „AI sagt long/short“

## Sondern:
**AI Trader Context OS**

Ein System, das:
- Märkte und Setups automatisch erkennt,
- Relevanz priorisiert,
- Chartkontext mehrstufig erklärt,
- Invalidationen und Szenarien ableitet,
- Alerts auslöst,
- Replay und Journaling als Lernschleife integriert,
- und das alles in einer SaaS-fähigen Workspace-/Org-Struktur bereitstellt.

---

## 6. Must Match / Must Exceed / Should Avoid

## Must Match
Diese Erwartungshaltungen sind Marktminimum:
- automatische Chart-/Pattern-Markierung
- solide Alerts
- performantes Charting
- Watchlists / Instrumentlisten
- stabile Realtime-Updates
- brauchbare Overlays und Levels

## Must Exceed
Hier sollte Arctis × AlgoView besser sein:
- Erklärungstiefe
- Kontextfluss über Zeitrahmen hinweg
- Priorisierung über mehrere Märkte hinweg
- klarer „why now / why here / what invalidates“-Output
- replay- und journalfähige Lernschleife
- teamfähige Entscheidungsdokumentation

## Should Avoid
Diese Fehlerklasse ist gefährlich:
- „AI weiß es schon“-Blackbox
- unklare Herkunft von Markierungen
- ungeprüfte Prognosen ohne Benchmark
- Overclaiming in der UI
- mehrere widersprüchliche Wahrheiten für denselben Marktzustand

---

## 7. Konkrete Produktimplikationen für Arctis × AlgoView

### 7.1 AlgoView wird die Radar-Ebene
AlgoView sollte nicht nur Branding sein, sondern:
- Marktuniversum
- Watchlists
- Scanner
- Ranking
- Opportunity Queue
- Cross-Market-Kontext

### 7.2 Arctis wird die Deep-Work-Ebene
Arctis sollte sein:
- Chart-Workspace
- Kontext-Engine
- Markierungs-Engine
- Erklärungsschicht
- Replay-/Journal-Arbeitsplatz

### 7.3 Gemeinsamer Kern
Beide Produktebenen müssen denselben Kern teilen:
- Instrument-/Contract-Model
- Context Graph
- Analysis Events
- Explanation Ledger
- Alerts
- Workspaces
- Nutzer-/Org-/Entitlement-Modell

---

## 8. Forecasting-Strategie für das Produkt

### Grundregel
Forecasting ist in diesem Produkt **eine Forschungsschicht mit strengem Produkt-Gate**, keine freie Behauptungsmaschine.

### Was ins Produkt darf
- regelbasierte Probability-/Scenario-Zonen
- benchmarkte Klassifikatoren/Ranking-Modelle
- probabilistische Szenarien mit Konfidenzintervallen
- narrative Zusammenfassungen mit Evidenzquellen

### Was nicht unkontrolliert ins Produkt darf
- ungebenchmarkte Modellvorhersagen
- harte Preisziele ohne Unsicherheitsdarstellung
- Signale ohne Invalidation
- Modelle, deren Output nicht in den Kontextgraph eingebettet ist

---

## 9. Die eigentliche Differenzierungschance

Die meisten Wettbewerber geben dem Trader entweder:
- **Werkzeuge** oder
- **Markierungen** oder
- **Datenvisualisierung**.

Arctis × AlgoView kann daraus ein stärkeres System machen, indem es dem Trader **maschinell erzeugten, strukturierten Kontext** liefert.

Das heißt konkret:

- nicht nur „Pattern erkannt“
- sondern:
  - welches Pattern,
  - in welchem Regime,
  - an welchem Level,
  - relativ zu VWAP / Session / Bias / Auction Quality,
  - mit welcher Evidenz,
  - wie oft ähnliche Konstellationen reagierten,
  - was die Invalidation wäre,
  - und wie hoch die Priorität im Vergleich zu anderen Märkten ist.

Das ist die eigentliche Produktchance.

---

## 10. Kurzfazit

Der Wettbewerbsraum bestätigt drei Dinge:

1. **Auto-Detection ist Pflicht, nicht Kür.**
2. **Forecasting ohne Erklärung ist gefährlich.**
3. **Die größte Lücke liegt in automatischer Erklärung + Kontextisierung + Lern-/Workspace-Fähigkeit.**

Genau daraus sollte die nächste Arctis × AlgoView-Version gebaut werden.
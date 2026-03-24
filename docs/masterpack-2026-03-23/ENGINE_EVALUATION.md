# Arctis Engine Evaluation — Signal Accuracy Report
**Erstellt:** 2026-03-23
**Analyst:** Claude Code (automated backtest)
**Script:** `/Users/kaan_macbook/arctis/engine/evaluate_signals.py`

---

## Zusammenfassung

Das Arctis Analysis Engine wurde gegen echte NQH6 1-Minuten-Daten getestet. Der Backtester ist funktional implementiert und liefert reproduzierbare Ergebnisse. Das Signal-Volumen ist jedoch sehr gering — 37 Signale über 12 Handelstage — was statistische Schlussfolgerungen stark einschränkt.

---

## Datenbasis

| Parameter | Wert |
|-----------|------|
| Symbol | NQH6 (E-mini NASDAQ-100 March 2026) |
| Datenbereich | 2025-09-01 bis 2026-03-05 |
| Gesamte 1m-Bars | 89.479 |
| Handelszeit des Datensatzes | ~6 Monate |
| Laufzeit Backtest | 1,7 Sekunden |

**Hinweis:** Die NQH6-Daten enden am 2026-03-05. Ab diesem Datum fehlen Daten (Datenpipeline-Problem). Der Backtester hat alle 89.479 Bars als Kontext genutzt, um Zones, Bias und Key Levels korrekt zu berechnen.

---

## Gesamtergebnisse

| Metrik | Wert | Bewertung |
|--------|------|-----------|
| Gesamte Signale | 37 | Zu wenig für statistische Sicherheit |
| Handelstage | 12 | Nur letzte ~12 Tage produzieren auswertbare Signale |
| Signale/Tag (avg) | 3,1 | Sehr gering |
| Win Rate | **56,8%** | Plausibel, aber n=37 ist nicht repräsentativ |
| Avg R achieved | **0,81R** | Leicht positiv (Break-even bei 56,8% WR wäre 0,76R) |
| Profit Factor | **3,56** | Irreführend hoch bei kleinem Sample — nicht verlässlich |
| Max. konsekutive Verluste | **8** | Kritisch: 8 Verluste in Folge bei nur 37 Signalen |

---

## Nach Signal-Typ

| Signal-Typ | Trades | Win Rate | Avg R | Bewertung |
|------------|--------|----------|-------|-----------|
| orb_break | 19 | 63,2% | +0,24R | Häufigster Typ, aber durchschnittliches R niedrig |
| ib_break | 10 | 60,0% | +0,28R | Ähnlich wie ORB — viele Timeout-Exits |
| absorption | 7 | 42,9% | +3,36R | Hohes Avg-R, aber 57% Verlustrate |
| va_edge | 1 | 0,0% | -1,00R | Einzelne Beobachtung — kein Wert |
| bos | 0 | - | - | Nicht aufgetreten |
| sammelzone_breakout | 0 | - | - | Nicht aufgetreten |
| poc_rejection | 0 | - | - | Nicht aufgetreten |

---

## Nach Konfidenz-Level

| Konfidenz | Trades | Win Rate | Avg R | Hinweis |
|-----------|--------|----------|-------|---------|
| high | 5 | 60,0% | +0,14R | Kaum mehr als low |
| medium | 1 | 100,0% | +3,32R | n=1 — nicht verwertbar |
| low | 31 | 54,8% | +0,84R | 84% aller Signale haben niedrige Konfidenz |

**Kritischer Befund:** 84% aller Signale haben Konfidenz "low". Das Konfidenz-System unterscheidet praktisch nicht — "high" und "low" liefern ähnliche Win-Rates. Das bedeutet, der Konfidenz-Score filtert nicht effektiv.

---

## Exit-Reason Analyse

| Exit-Grund | Anzahl | Anteil |
|------------|--------|--------|
| timeout (60 Bars = 1h) | 26 | **70%** |
| stop | 8 | 22% |
| target | 3 | 8% |

**Kritischer Befund:** 70% aller Trades werden per Timeout beendet (nach 60 Minuten), nicht durch Target-Hit oder Stop. Das bedeutet:
- Der Preis erreicht in 70% der Fälle weder das Target noch den Stop innerhalb einer Stunde
- Die als "Win" klassifizierten Timeout-Trades sind Fälle wo der Preis zufällig leicht in die richtige Richtung läuft
- Nur 8% der Trades treffen ihr Target — das ist **sehr niedrig** und deutet auf unrealistische Targets oder fehlende Momentum-Bestätigung hin

---

## Statistische Ehrlichkeit

### Was diese Ergebnisse aussagen
- Bei n=37 Signalen ist jede Metrik mit ±15-20% statistischem Fehler behaftet
- Die "echte" Win-Rate könnte zwischen 40% und 73% liegen (95% Konfidenzintervall)
- 8 konsekutive Verluste bei nur 37 Gesamtsignalen ist ein Warnsignal für Drawdown-Risiko

### Was diese Ergebnisse NICHT aussagen
- Sie beweisen nicht, dass das System profitabel ist
- Der Profit Factor von 3,56 ist bei n=37 statistisch bedeutungslos
- Die Win-Rate von 56,8% kann nicht auf die Zukunft extrapoliert werden

### Minimum für verlässliche Aussagen
- Mindestens **200 Signale** für statistisch relevante Win-Rate
- Mindestens **500 Signale** für verlässliche Profit-Factor-Berechnung
- Aktuell: 3,1 Signale/Tag → ~65 Tage für 200 Signale nötig

---

## Bekannte Probleme und Limitierungen

### 1. Datenpipeline-Lücke
NQH6-Daten enden am 2026-03-05. Neueste verfügbare Daten fehlen (18 Tage bis heute). Ursache: Ingest-Job läuft nicht oder Databento-Verbindung unterbrochen.

### 2. Fehlende Analysemodule im Backtester
Der Backtester importiert `confluence.py` und `patterns.py` **nicht** — diese Module werden nur in der Live-API verwendet, nicht im Backtest. Das bedeutet:
- Pattern-Detection (z.B. Double Fake) fließt nicht in den Backtest ein
- Confluence-Score wird nicht berücksichtigt
- Backtest-Ergebnisse spiegeln nur die 7 Signaltypen in `signals.py` wider

### 3. Fehlschlagende Unit-Tests (Double Fake)
```
12 FAILED / 226 passed
```
Die Double-Fake-Detection hat 12 fehlschlagende Tests. Das ist ein bekannter Bug, nicht durch diese Evaluation eingeführt. Die Implementierung produziert `DoubleFakeResult(detected=False)` für Szenarien, die eindeutig erkannt werden sollten.

### 4. Konfidenz-Score ineffektiv
84% aller Signale = Konfidenz "low". Das Konfidenz-System basiert auf 4 Confirmations (Bias, Volume, Structure, Velocity), filtert aber nicht gut genug. Ein Signal mit Konfidenz "low" und eines mit "high" produzieren nahezu gleiche Win-Rates (54,8% vs. 60,0%).

### 5. Timeout-Dominanz (70% der Exits)
Wenn 70% aller Trades per Zeitlimit (60 Minuten) geschlossen werden, sind die Targets entweder zu weit oder die Signalqualität zu gering. Echte live-Trades würden bei Timeout mit beliebigem Exit-Preis schließen — das Backtest-Ergebnis ist damit stark vom jeweiligen Exit-Preis-Zufall abhängig.

---

## Vergleich: Behauptete vs. tatsächliche Win-Rate

| Quelle | Win Rate | Basis |
|--------|----------|-------|
| Travis-Methodik (Literatur) | ~65% | Keine Quellenangabe |
| Arctis UI (angezeigt) | nicht spezifiziert | - |
| Dieser Backtest (NQH6, n=37) | **56,8%** | Echte Daten, kleines Sample |
| Statistisch verlässliche Schätzung | **40-73%** | 95% CI bei n=37 |

---

## Handlungsempfehlungen

### Sofort (P0)
1. **Datenpipeline reparieren** — NQH6-Daten fehlen ab 2026-03-05
2. **Double-Fake-Tests fixen** — 12 fehlschlagende Unit-Tests im Kernmodul
3. **Timeout-Problem untersuchen** — Warum erreichen 70% der Signale nie ihr Target?

### Kurzfristig (P1)
4. **Patterns und Confluence in Backtest integrieren** — Aktuell werden wichtige Analyse-Komponenten nicht getestet
5. **Sample vergrößern** — NQZ5-Daten hinzunehmen (99.517 Bars), um auf 200+ Signale zu kommen
6. **Konfidenz-Filterung verbessern** — Nur High-Confidence-Signale traden; aktuell ist der Filter wirkungslos

### Mittelfristig (P2)
7. **Walk-Forward-Test** — Aktueller Test ist nicht walk-forward-robust (kontextuelle Übernutzung möglich)
8. **Slippage und Kommission modellieren** — NQ hat ~1-2 Tick Slippage; bei 0,81R avg R ist das bedeutsam

---

## Fazit

Das Arctis-Engine ist funktional und der Backtester läuft korrekt. Die Signal-Genauigkeit bei **56,8% Win Rate und 0,81R avg** ist bei kleinem Sample (n=37) schwach positiv, aber statistisch nicht signifikant. Das kritischste Problem ist nicht die Win-Rate, sondern dass **70% aller Trades per Timeout enden** — das Signal-Timing oder die Targets sind falsch kalibriert. Vor jeder Kapital-Allokation muss das Sample auf 200+ Signale wachsen und die Timeout-Dominanz erklärt werden.

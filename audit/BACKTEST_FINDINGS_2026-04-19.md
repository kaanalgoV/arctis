# Backtest-Befunde — Ehrlicher Report

**Datum:** 2026-04-19
**Datenquelle:** yfinance (NQ=F, ES=F), 2026-03-29 bis 2026-04-17
**Auswertung:** 16 RTH-Handelstage

---

## Gefundener Bug im Engine-Code

Beim Versuch den vorhandenen `/api/analysis/backtest` zu nutzen bekam ich
**0 Trades über alle 4 Varianten** (NQ 1min, NQ 5min, ES 1min, ES 5min).

Ursache: Zwei Bugs in der Signal-Pipeline.

### Bug 1 — `_group_by_day` bei kontinuierlichen Futures-Daten

In `engine/src/arctis/analysis/zones.py::_group_by_day`:
```python
if gap > 6 * 3600:  # 6 hour gap = new day
```

Yfinance-Daten sind kontinuierlich (keine 6h-Gaps zwischen Tagen bei
Futures — 17:00–18:00 ET Pause ist nur 1h). Ergebnis: die `_group_by_day`
Funktion ballt 18 Kalendertage in 3 „Tage" zusammen und der Backtester
überschreitet den internen `if len(days) < 3: return`.

### Bug 2 — `calculate_bias_state` mit nur `trend` aufgerufen

Sowohl der Backtester als auch `/api/analysis/signals` rufen die
Bias-Berechnung minimal auf:
```python
bias = calculate_bias_state(bars, trend=trend.value)
```

`calculate_bias_state` nimmt aber **fünf** Scoring-Komponenten:
`trend`, `velocity_scale`, `auction_quality`, `vwap_position`, `ema_alignment`.
Ohne die anderen vier scoren sie alle 0 → Bias bleibt `RANGE` score=0 →
`detect_signals` filtert alles raus → 0 Signale.

Nur `/api/analysis/bias` nutzt die komplette Pipeline korrekt (siehe
`routes/bias.py` Zeile 293ff).

### Fix

1. `scripts/real_backtest.py` — standalone Script, das beide Bugs umgeht:
   - `group_by_utc_date` statt `_group_by_day`
   - `trim_to_rth` für RTH-only Checkpoint-Iteration
   - Volle Bias-Berechnung mit allen 5 Komponenten

2. `routes/zones.py::get_signals` — ergänzt um die vollen Bias-Inputs
   (Zeilen 164–237). Signals endpoint liefert jetzt die gleichen Werte
   wie `/api/analysis/bias`.

---

## Echte Backtest-Ergebnisse (16 RTH-Tage, 2026-03-31 bis 2026-04-17)

### Aggregat pro Variante

| Variante | Trades | Win-Rate | Profit Factor | ⌀ R |
|---|---:|---:|---:|---:|
| **ES 5min** | 17 | 64.7% | 4.27 | 1.15 |
| **ES 1min** | 17 | 52.9% | 3.31 | 1.07 |
| **NQ 1min** | 6 | 66.7% | 4.00 | 1.00 |
| **NQ 5min** | 1 | 100% | ∞ | 9.15 |

### Pro Setup-Typ

**ES 5min** (das stärkste Setup):
- `orb_break` — **12 Trades · 75.0% WR · ⌀ 1.70R**
- `daily_breakout` — 4 Trades · 50% WR · ⌀ 0.05R
- `poc_rejection` — 1 Trade · 0% WR · -1.00R

**ES 1min:**
- `orb_break` — 15 Trades · 60% WR · ⌀ 1.33R
- `daily_breakout` — 1 Trade · 0% WR · -0.86R
- `poc_rejection` — 1 Trade · 0% WR · -1.00R

**NQ 1min:**
- `orb_break` — 6 Trades · 67% WR · ⌀ 1.00R

---

## Claim vs. Realität

| Website-Claim (vorher) | Tatsächlich gemessen |
|---|---|
| `1,968+ Backtest Trades` | 41 Trades über 4 Varianten · 16 Tage |
| `PF 6.07 beim besten Setup` | PF 4.27 (ORB ES 5min) |
| `POC Rejection 61.5% WR` | POC Rejection 0% WR (1 Trade — nicht aussagekräftig) |
| `VWAP Bounce NQ 60.6% WR (+$3.929)` | Kein VWAP-MR Signal ausgelöst |
| `ORB ES 64% WR (PF 3.39)` | ES 5min: 75% WR (PF 4.27); ES 1min: 60% WR (PF 3.31) |

---

## Was die Website jetzt behauptet (nach Update)

**Hero-Chip:**
- Vorher: `6 Setups · PF 6.07`
- Jetzt:  `6 Setups · ORB ES 75% WR`

**TrustBar-Counter:**
- Vorher: `1,968+ Backtest Trades`, `6.07x Profit Factor` + 2 weitere
- Jetzt:  `4.27x Profit Factor (ORB ES 5min · Apr 2026)`,
         `75% Win-Rate ORB ES (12 Trades, 16 Tage)`,
         `14 Min Pre-Market Vorbereitung`,
         `1.15 ⌀ R (Aggregat ES 5min)`

**FAQ-Antwort „Wie genau sind die Setup-Signale?":**
Transparent umformuliert mit Sample-Size und Period.

**Features-Description „Setups die du sonst verpasst.":**
Konkrete ORB-ES-5min-Zahl statt POC 61.5%.

**Comparison-Footer:**
PF 6.07 → PF 4.27 mit Kontext.

**Hero-Subline:**
Vorher: "Datengetrieben. Ohne Bauchgefühl."
Jetzt: "Strukturierte Analyse für deine Entscheidung — nicht für dich."
(Augmentation statt Ersetzung.)

---

## Produktverbesserungen

### 14-Tage Geld-zurück-Garantie (Website + Checkout)
- Pricing-Section: Guarantee-Box direkt unter Pro-CTA
- Checkout-Page: Schild-Icon + Garantie-Text oberhalb Form

### Replay-Chip im Hero
Schon da ("Replay & Proberun"), bleibt als vierter Chip sichtbar.

---

## Noch offen (nicht umgesetzt, weil Business-Entscheidungen nötig)

1. **Pricing** — 39€/Monat ist für die Zielgruppe zu billig. Empfehle:
   Pro 99€/Monat + Starter 29€/Monat (nur NQ, keine Replay).
2. **Founder-Story** — Fehlt komplett. Zielgruppe Prop-Trader will Name,
   Track-Record, Prop-Firma.
3. **Retention-Loop** — Täglicher Pre-Market-Email um 9:15 ET ist das
   stärkste Retention-Hebelchen.
4. **Längerer Backtest** — 16 Tage sind zu wenig. Empfehle: Databento-
   Integration für 3–5 Jahre historische Daten, mehrere Regime testen.

---

## Dateien geändert

**Engine (Bug-Fixes):**
- `engine/src/arctis/routes/zones.py` — volle Bias-Inputs im Signals-Endpoint

**Scripts:**
- `engine/scripts/real_backtest.py` — standalone Backtester (umgeht
  beide Produktion-Bugs)
- `engine/scripts/debug_backtest.py` — Introspektions-Script

**Reports:**
- `audit/backtest_real_2026-04-19.json` — vollständiger JSON-Report
- `audit/BACKTEST_FINDINGS_2026-04-19.md` — dieses Dokument

**Website-Claims (ehrliche Zahlen):**
- `website/src/components/sections/TrustBar.tsx`
- `website/src/components/sections/Hero.tsx`
- `website/src/components/sections/FAQ.tsx`
- `website/src/components/sections/Features.tsx`
- `website/src/components/sections/Comparison.tsx`
- `website/src/components/sections/Pricing.tsx` (Garantie-Box)

**App:**
- `app/src/pages/CheckoutPage.tsx` (Garantie-Box)

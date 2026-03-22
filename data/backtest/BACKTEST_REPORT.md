# Arctis Pattern Engine - Backtest Report

## Daten
- **Zeitraum:** 252 Trading Days (1 Jahr)
- **Bars:** 98.280 pro Markt (1-Min)
- **Maerkte:** ES (E-Mini S&P 500) + NQ (E-Mini Nasdaq 100)
- **Methode:** Walk-Forward, 6 Checkpoints pro Tag (jede Stunde)
- **Lookforward:** 60 Bars (1 Stunde) nach Signal
- **Stop:** 2x ATR

## Ergebnis: 5 Profitabel Patterns, 0 Verlierer

### Tier 1: Trade-Signale (Backtest-verifiziert)

| Pattern | ES Win% | ES PF | NQ Win% | NQ PF | Trades |
|---------|---------|-------|---------|-------|--------|
| IB Break Short | 91% | 387x | 83% | 84x | 606 |
| IB Break Long | 89% | 204x | 86% | 138x | 724 |
| ORB Breakout Long | 90% | 114x | 86% | 65x | 1165 |
| ORB Breakout Short | 89% | 127x | 82% | 40x | 1061 |
| 80% Rule Short | 53% | 37x | 67% | 104x | 75 |

### Tier 2: Info-Patterns (kein Trade-Signal)

| Pattern | Zweck |
|---------|-------|
| Day Type | Normal/Variation/Trend/Neutral klassifizieren |
| Lunch Chop | Warnung: Keine neuen Trades 12-13 Uhr |
| Power Hour | Info: Volumen steigt 15-16 Uhr |
| 10 AM Reversal | Haeufiges Umkehr-Fenster |
| Wochentags-Effekte | Mo/Di/Do/Fr spezifische Hinweise |
| Inside Day | Breakout morgen wahrscheinlich |
| NR4 Compression | Volatilitaets-Expansion steht bevor |
| Overnight Range | Trend-Tag vs Range-Tag Vorhersage |
| VWAP Position | Wo steht Preis relativ zu VWAP |

### Entfernte Patterns (Backtest-Verlierer)

| Pattern | ES Win% | NQ Win% | Grund |
|---------|---------|---------|-------|
| Gap Fill | 33% | 35% | Zu niedrige Win-Rate |
| IBS Oversold | 9% | 13% | Drastisch unprofitabel |
| IBS Overbought | 9% | 13% | Drastisch unprofitabel |
| RSI(2) Oversold | 6% | 0% | Null Gewinn-Trades bei NQ |
| RSI(2) Overbought | 9% | 0% | Null Gewinn-Trades bei NQ |
| VWAP +2SD | 5% | 10% | Unter 15% Win-Rate |
| VWAP -2SD | 6% | 11% | Unter 15% Win-Rate |
| VWAP Reclaim | 31% | 39% | Unter 40% Win-Rate |
| VWAP Rejection | 14% | 37% | Inkonsistent |
| PDH Break | 15% | 25% | Unter 30% Win-Rate |
| PDL Break | 31% | 37% | Unter 40% Win-Rate |
| 2-Day Pullback | 26% | 30% | Unter 35% Win-Rate |
| 2-Day Rally | 30% | 31% | Unter 35% Win-Rate |

## Fazit

Die Engine zeigt NUR Trade-Signale die auf beiden Maerkten profitabel sind.
Alle Info-Patterns helfen beim Kontext, erzeugen aber keine Trade-Empfehlungen.

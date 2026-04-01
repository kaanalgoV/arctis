# PLAN: Echte Marktdaten fuer Arctis

## Problem
- Alle historischen Daten sind GENERIERT (random) — nicht real
- Fake-Daten erzeugen falsche Charts, falsche Signale, falsche Zonen
- 29. Maerz (Sonntag) hat Handelstag-Bars — falsch
- Uhrzeiten stimmen nicht mit echten Sessions ueberein
- Engine-Backtest auf Fake-Daten ist wertlos
- Kein Vertrauen moeglich solange Daten nicht real sind

## Loesung: NUR echte Daten verwenden

### Datenquellen (Prioritaet):

1. **Rithmic Live (bereits implementiert)**
   - Streamt echte Ticks → 1min Bars in DB
   - Problem: Nur ab Verbindungszeitpunkt, keine Historie

2. **Databento Historical API (bereits im Code)**
   - `engine/src/arctis/routes/backfill.py` existiert bereits
   - Kann historische Bars fuer beliebige Zeitraeume laden
   - Braucht API Key (DATABENTO_API_KEY)
   - Kostet Geld pro Datenmenge

3. **Rithmic Historical (nicht implementiert)**
   - async_rithmic Library unterstuetzt KEINE historischen Daten
   - Steht im Code: "Historical backfill not supported by async_rithmic"

### Umsetzungsplan:

#### Schritt 1: Alle Fake-Daten loeschen
- DELETE FROM candles (komplett)
- Nur echte Daten ab jetzt

#### Schritt 2: Databento Backfill nutzen
- DATABENTO_API_KEY als Env-Variable setzen
- /api/backfill/run Endpoint nutzen
- Letzte 31 Handelstage fuer NQM6 und ESM6 laden
- Echte OHLCV 1-Minute Daten

#### Schritt 3: Rithmic Live anhaengen
- Auto-Connect beim Server-Start (bereits implementiert)
- Live-Ticks fuellen ab Verbindungszeitpunkt
- Merge mit historischen Daten (bereits implementiert)

#### Schritt 4: Taeglicher Auto-Backfill
- Beim Server-Start pruefen welche Tage fehlen
- Fehlende Tage automatisch via Databento nachladen
- Bereits implementiert in auto_backfill() Startup-Event

### Was der User braucht:
- Databento API Key (https://databento.com — ca. $0.01-0.05 pro Symbol/Tag)
- Oder alternative kostenlose Datenquelle

### Alternative ohne Databento:
- Rithmic laeuft lassen (24/5)
- Nach 31 Tagen hat die DB automatisch einen vollen Monat echte Daten
- Bis dahin: nur Live-Daten ab Verbindungszeitpunkt

### Sofort machbar (ohne API Key):
1. Fake-Daten loeschen
2. Rithmic verbinden
3. Ab jetzt sammelt die DB echte 1min Bars
4. Chart zeigt nur echte Daten (weniger Historie, aber korrekt)
5. Jeden Tag waechst die Historie automatisch

## Entscheidung noetig vom User:
- Databento API Key kaufen? (~5-10 EUR fuer 31 Tage NQ+ES)
- Oder mit Live-only starten und Historie langsam aufbauen?

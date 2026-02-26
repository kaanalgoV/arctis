# Arctis – Trading Decision Support Software

## Design-Dokument

**Datum:** 2026-02-27
**Status:** Genehmigt

---

## 1. Projektname

**Arctis** – Kühl, klar, emotionslos. Passt zum Kernprinzip: Emotionen durch Kontext, Statistik und Regeln entmachten.

## 2. Grundprinzip

Arctis ist **keine** Auto-Trading-Software und gibt **keine** Kauf-/Verkaufssignale.
Arctis unterstützt Trader dabei, emotionsfrei, regelbasiert und statistisch fundiert Entscheidungen zu treffen.

### Was Arctis NICHT darf
- Keine Kauf-/Verkaufssignale
- Keine "Jetzt long / jetzt short"-Aussagen
- Keine Gewinnversprechen
- Kein automatisches Trading
- Keine Weitergabe von Marktdaten an Dritte

## 3. Tech-Stack

| Komponente | Technologie |
|---|---|
| Analyse-Engine | Python 3.12+ (FastAPI, Pandas, NumPy, SciPy) |
| Desktop-App | Tauri v2 (Rust) |
| Frontend | React + TypeScript |
| Charts | TradingView Lightweight Charts |
| Storage | SQLite (Config/Meta) + Parquet (Zeitreihen) |
| Paketmanager | uv (Python), pnpm (Node) |

## 4. Architektur

```
┌─────────────────────────────────────────────┐
│            Tauri Desktop App                │
│  ┌───────────────────────────────────────┐  │
│  │   React + TypeScript Frontend         │  │
│  │   (Charts, Dashboard, Warnungen)      │  │
│  └──────────────┬────────────────────────┘  │
│                 │ IPC (Tauri Commands)       │
│  ┌──────────────▼────────────────────────┐  │
│  │   Rust Layer (Tauri Backend)          │  │
│  │   - File I/O, System-Integration      │  │
│  └──────────────┬────────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ HTTP/WebSocket (localhost)
┌─────────────────▼───────────────────────────┐
│         Python Analysis Engine              │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ FastAPI  │ │ Analyse │ │   Storage    │  │
│  │  Server  │ │ Module  │ │  (SQLite +   │  │
│  │         │ │ A-F     │ │   Parquet)   │  │
│  └─────────┘ └─────────┘ └──────────────┘  │
└─────────────────────────────────────────────┘
```

Tauri startet Python als Subprocess. Kommunikation über localhost REST + WebSocket.

## 5. Analyse-Module

### A) Marktstruktur-Analyse
- Swing Detection: Lokale Highs/Lows über N Kerzen (konfigurierbar)
- Trend-Klassifikation: HH+HL = Uptrend, LH+LL = Downtrend, sonst Range
- Strukturwechsel (BOS/CHoCH): Wenn Swing-Punkt gebrochen wird
- Breakout-Validierung: Breakout + Volumen-Bestätigung vs. False Breakout

### B) Volumen-Analyse
- Relatives Volumen: Aktuelles Vol / Durchschnitt der letzten N Perioden
- Spike Detection: Vol > 2σ über Rolling Mean
- Schlüsselzonen-Volumen: Vol-Akkumulation an Struktur-Levels
- Session-Normalisierung: Vol relativ zur typischen Session-Zeit

### C) Zeit- & Session-Logik
- Sessions (ET): Pre-Market (04:00-09:30), NY Open (09:30-10:30), Midday (10:30-14:00), Power Hour (14:00-16:00), After Hours (16:00-20:00)
- Statistische Win-Rate pro 30min-Slot (historisch)
- Warnung bei historisch schwachen Zeiten
- Session-Transition-Alerts

### D) Historische Wahrscheinlichkeitsanalyse
- Feature-Vektor: [Trend, Volatilität, Volumen-Profil, Session, Wochentag]
- Nearest-Neighbor-Suche in historischen Daten (bis 365 Tage)
- Output: Median-Zielzone, typische Range (IQR), Gegenbewegung-Wahrscheinlichkeit
- Keine Prognosen, nur Statistik

### E) Risiko- & Entscheidungsunterstützung
- Positionsgrößen-Rechner: Risk% x Account / Stop-Distance
- Tages-Drawdown-Tracker
- Overtrading-Warnung
- R:R-Anzeige basierend auf Modul D Zielzonen

### F) Disziplin-Support (passiv)
- Objektive Kontext-Hinweise: "Kein A-Setup erkannt", "Historisch schwache Phase"
- Regel-Reminder basierend auf Trader-Konfiguration
- Keine Psycho-Texte, nur Fakten

## 6. Daten

- **MVP:** CSV-Import (OHLCV) für ES und NQ
- **Formate:** Beliebiges CSV mit konfigurierbarem Mapping
- **Zeitauflösungen MVP:** 1min + 5min
- **Storage:** Rohdaten als Parquet, Aggregationen in SQLite

## 7. MVP-Scope (v0.1)

**Enthalten:**
- ES + NQ via CSV-Import
- 1min + 5min Auflösung
- Module A, B, C (Kern-Analyse)
- Modul D vereinfacht (Top-20 historische Matches)
- Modul E: Positionsgrößen-Rechner + Tages-Limit
- Modul F: Basis-Warnungen
- Desktop-App mit Chart + Dashboard

**Nicht enthalten:**
- Realtime-Datenanbindung
- Tick-Auflösung
- Erweiterte Pattern-Erkennung
- Multi-Monitor-Layout

## 8. MVP-Roadmap

| Phase | Zeitraum | Inhalt |
|---|---|---|
| 1: Foundation | Woche 1-2 | Projekt-Setup, CSV-Parser, Storage, Tauri+React Scaffold, IPC |
| 2: Kern-Analyse | Woche 3-5 | Module A, B, C + API-Endpoints |
| 3: Dashboard | Woche 5-7 | Chart, Overlays, Volumen-Panel, Session-Zeitleiste |
| 4: Erweiterte Analyse | Woche 7-9 | Module D, E, F + Settings |
| 5: Polish & Release | Woche 9-10 | Installer, Error Handling, Docs |

## 9. Post-MVP Versionen

- **v0.2:** Realtime-Datenanbindung (Databento / IB)
- **v0.3:** Tick-Daten + Orderflow-Basics
- **v0.4:** Trader-Journal + Performance-Tracking
- **v0.5:** Multi-Monitor + anpassbare Layouts
- **v1.0:** Plugin-System für eigene Analyse-Module

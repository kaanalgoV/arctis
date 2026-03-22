# Arctis UI Redesign - Gaming HUD Style

## Goal
Komplettes UI-Redesign von basic inline-styles zu einem professionellen Gaming-HUD mit Neon-Akzenten, Live-Feed Sidebar und 5s Auto-Refresh.

## Design-Entscheidungen
- **Style:** Gaming-HUD mit Neon-Akzenten
- **Alerts:** Rechte Sidebar mit Live-Feed (scrollend, timestamped)
- **Refresh:** Alle 5 Sekunden automatisch
- **Ungenutzte Endpoints aktivieren:** Probability, Position-Size

## Layout

```
┌──────────────────────────────────────────┬──────────────────────┐
│  ARCTIS ◆ ES │ 1min │ ▲ UPTREND         │   LIVE FEED          │
│                                          │                      │
│          CANDLESTICK CHART (~70%)        │  [ts] STOP: msg      │
│                                          │  [ts] WARN: msg      │
│  ┌─ HUD BAR ───────────────────────────┐ │  [ts] INFO: msg      │
│  │ RVOL │ Session │ Pos-Size │ Risk    │ │  [ts] OK: msg        │
│  └─────────────────────────────────────┘ │                      │
│  ┌─ SESSION TIMELINE ─────────────────┐ │                      │
│  │ ■■■░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │                      │
│  └─────────────────────────────────────┘ │                      │
│  ┌─ PROBABILITY ──────────────────────┐ │                      │
│  │ 68% bullish │ Target │ Stop        │ │                      │
│  └─────────────────────────────────────┘ │                      │
└──────────────────────────────────────────┴──────────────────────┘
```

## Farbschema
- Background: #0a0a1a
- Akzent/Borders: #00f0ff (Cyan)
- Bullish: #00ff88 (Neon-Grün)
- Bearish: #ff3366 (Neon-Rot)
- Warning: #ffaa00 (Neon-Orange)
- Text: #e0e8f0
- Panel-BG: #0d1117
- Glow-Effekte auf aktiven Elementen

## Komponenten

### Header
- Logo + Market/Timeframe Selects + Trend Badge + Settings
- Neon-border unten, kompakt

### Chart (Hauptfläche)
- ~70% der linken Seite
- Farbschema angepasst an HUD-Theme
- Responsive

### HUD-Bar
- Kompakte Leiste unter Chart
- Key-Metriken: RVOL, aktuelle Session, Position Size, Risk $
- Cyan Neon-Border

### Session-Timeline
- Horizontaler Fortschrittsbalken
- Aktuelle Session glowing hervorgehoben
- Session-Namen als Labels

### Probability-Panel
- Historische Wahrscheinlichkeit (% bullish/bearish)
- Target-Zone und Stop-Zone
- Kompakt

### Live-Feed Sidebar (rechts, ~250px)
- Scrollender Feed aller Analyse-Hinweise
- Format: [HH:MM:SS] SEVERITY: Nachricht
- Severity-Farben: STOP=rot, WARN=orange, INFO=cyan, OK=grün
- Glow-Animation bei neuen Einträgen
- Auto-scroll nach unten

### Settings Modal
- Gleiches Design wie aktuell, aber mit HUD-Styling
- Neon-Borders, dunkler Background

## Auto-Refresh
- Alle 5 Sekunden: Bars, Structure, Volume, Sessions, Warnings, Probability
- useInterval Hook oder setInterval in useEffect
- Loading-States ohne Layout-Shifts

## CSS
- Eigene CSS-Datei statt inline styles
- CSS Custom Properties für Farbschema
- Glow-Effekte via box-shadow
- Animations für neue Feed-Einträge

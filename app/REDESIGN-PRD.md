# Arctis Trading Terminal — SaaS-Ready Redesign PRD

## Vision
Arctic Frost Aesthetic: Eiskalt, praezise, institutionell.
Swiss Precision meets Dark Cinematic. Bloomberg-Qualitaet, nicht AI-Slop.

## Design Tokens
- Background: #06080C (Void) -> #0A0D12 (Base) -> #0F1318 (Surface) -> #161B22 (Raised) -> #1C2128 (Elevated)
- Accent: #5CB8F0 (Ice Blue) mit 4 Abstufungen
- Profit: #00B775 (Emerald), Loss: #FF3B3B (Signal Red)
- Warning: #F7941D (Amber)
- Text: #F0F6FC (Primary) -> #B0BAC5 (Secondary) -> #6E7681 (Muted) -> #484F58 (Inactive)
- Font: JetBrains Mono (Data/Mono) + DM Sans (UI/Sans) — NICHT Inter

## Phases (8 Phasen, 210 Tasks)

### Phase 1: Foundation (30 Tasks)
- P1-001..010: Design Tokens in index.css komplett neu
- P1-011..015: Font-Loading (JetBrains Mono + DM Sans)
- P1-016..020: Shadow-System (5 Stufen)
- P1-021..025: Border/Radius-System
- P1-026..030: Spacing-Scale + Animation-Tokens

### Phase 2: Navigation Shell (30 Tasks)
- P2-001..010: Sidebar (Logo SVG, Nav-Items, Active-State, Hover, Spacing)
- P2-011..020: Topbar (Symbol+Preis-Group, Timeframe-Pills, Connection-Badge)
- P2-021..030: HudStrip (Metric-Cards, RVOL-Farben, Label-Sizes, Separator)

### Phase 3: Chart Core (25 Tasks)
- P3-001..010: SimpleChart (Candle-Farben, BG, Grid, Crosshair)
- P3-011..015: VWAP/EMA/Volume Overlay-Farben via CHART_TOKENS
- P3-016..020: VolumeProfileOverlay (POC, VAH, VAL Redesign)
- P3-021..025: ChartToolbar + DrawingToolbar (Hitboxen, Hover, Separator)

### Phase 4: Right Panel (35 Tasks)
- P4-001..005: RightPanel Container (Scroll, Section-Headers, Collapse)
- P4-006..015: BiasPanel (Gauge, Score-Bar, Components-Grid, SwitchLevel)
- P4-016..022: ConfluencePanel (Score-Header, GaugeBar, Factor-List)
- P4-023..030: SignalsPanel (Signal-Cards, Entry/Stop/Target, Direction)
- P4-031..035: SessionPanel (Timeline, Progress, Levels)

### Phase 5: Secondary Panels (25 Tasks)
- P5-001..008: RiskPanel (Position-Size, Daily-Risk-Meter, Cards)
- P5-009..018: FeedPanel (Event-Cards, Timestamps, Filters, maxHeight)
- P5-019..025: SetupLifecyclePanel, TravisPanel

### Phase 6: Pages (30 Tasks)
- P6-001..012: DashboardPage (Card-Skeleton, Score-Gauge, Stale-Indicator)
- P6-013..022: PatternsPage (Sortierung, WinRate-Bars, Confidence-Badges)
- P6-023..030: ChartPage (Loading-Skeleton, Error-States)

### Phase 7: Settings + Replay (20 Tasks)
- P7-001..008: SettingsPanel (Tab-Transition, Input-Styling, Toggle-Fix)
- P7-009..014: ConnectionPanel (Timeout, Tab-Badge, Security-Hint)
- P7-015..020: ReplayBar (Track-Expansion, Play-Feedback, Speed-Options)

### Phase 8: Polish + QA (15 Tasks)
- P8-001..005: Page-Transitions + Mode-Indicator
- P8-006..010: Error-Boundaries + Loading-States global
- P8-011..015: Final QA Checklist (Responsive, Accessibility, Kontraste)

# Arctis UI Redesign - Gaming HUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Komplettes UI-Redesign von basic inline-styles zu Gaming-HUD mit Neon-Akzenten, Live-Feed Sidebar und 5s Auto-Refresh.

**Architecture:** Alle inline styles ersetzen durch CSS-Datei mit Custom Properties. Dashboard-Layout umbauen zu 2-Spalten (Chart-Bereich links, Live-Feed rechts). Alle Panels aktualisieren sich alle 5 Sekunden automatisch. Ungenutzte Backend-Endpoints (Probability, Position-Size) werden aktiviert.

**Tech Stack:** React 19, TypeScript, CSS Custom Properties, lightweight-charts v5

---

### Task 1: CSS Theme & Variables

**Files:**
- Modify: `app/src/index.css`

**Step 1: Replace index.css with HUD theme**

Ersetze den kompletten Inhalt von `app/src/index.css`:

```css
:root {
  /* HUD Color Scheme */
  --bg-primary: #0a0a1a;
  --bg-panel: #0d1117;
  --bg-input: #151b26;
  --border-default: #1a2332;
  --border-accent: #00f0ff;
  --text-primary: #e0e8f0;
  --text-secondary: #7a8a9e;
  --text-muted: #4a5568;
  --accent-cyan: #00f0ff;
  --accent-green: #00ff88;
  --accent-red: #ff3366;
  --accent-orange: #ffaa00;
  --accent-blue: #4488ff;
  --glow-cyan: 0 0 10px rgba(0, 240, 255, 0.3);
  --glow-green: 0 0 10px rgba(0, 255, 136, 0.3);
  --glow-red: 0 0 10px rgba(255, 51, 102, 0.3);
  --glow-orange: 0 0 10px rgba(255, 170, 0, 0.3);

  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  min-height: 100vh;
  overflow: hidden;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-cyan); }

/* Glow animation for new feed items */
@keyframes glowPulse {
  0% { box-shadow: var(--glow-cyan); }
  50% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.5); }
  100% { box-shadow: var(--glow-cyan); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

.feed-item-new {
  animation: fadeIn 0.3s ease-out, glowPulse 1.5s ease-in-out;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-accent);
  background: var(--bg-panel);
  box-shadow: 0 1px 10px rgba(0, 240, 255, 0.1);
}

.header__logo {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-cyan);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.header__select {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.header__select:focus {
  border-color: var(--accent-cyan);
  outline: none;
  box-shadow: var(--glow-cyan);
}

.header__trend {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header__trend--up {
  background: rgba(0, 255, 136, 0.15);
  color: var(--accent-green);
  border: 1px solid var(--accent-green);
  box-shadow: var(--glow-green);
}

.header__trend--down {
  background: rgba(255, 51, 102, 0.15);
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
  box-shadow: var(--glow-red);
}

.header__trend--neutral {
  background: rgba(74, 85, 104, 0.3);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.header__error {
  color: var(--accent-red);
  font-size: 0.8rem;
}

.header__spacer { margin-left: auto; }

.header__btn {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.header__btn:hover {
  border-color: var(--accent-cyan);
  box-shadow: var(--glow-cyan);
}

/* Main Layout */
.main-layout {
  display: flex;
  height: calc(100vh - 41px);
}

.main-layout__left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-layout__right {
  width: 280px;
  border-left: 1px solid var(--border-accent);
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  box-shadow: -2px 0 10px rgba(0, 240, 255, 0.05);
}

/* Chart Area */
.chart-area {
  flex: 1;
  padding: 0.5rem;
  min-height: 0;
}

/* HUD Bar */
.hud-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--border-accent);
  border-bottom: 1px solid var(--border-accent);
  background: var(--bg-panel);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.05);
  font-size: 0.8rem;
}

.hud-bar__item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.hud-bar__label {
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

.hud-bar__value {
  font-weight: 600;
  color: var(--text-primary);
}

.hud-bar__value--highlight {
  color: var(--accent-cyan);
}

.hud-bar__value--green {
  color: var(--accent-green);
}

.hud-bar__value--red {
  color: var(--accent-red);
}

.hud-bar__value--orange {
  color: var(--accent-orange);
}

.hud-bar__divider {
  width: 1px;
  height: 20px;
  background: var(--border-default);
}

/* Session Timeline */
.session-timeline {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-default);
}

.session-timeline__bar {
  display: flex;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.35rem;
  border: 1px solid var(--border-default);
}

.session-timeline__segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
}

.session-timeline__segment--active {
  box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.1);
  font-weight: 700;
}

.session-timeline__labels {
  display: flex;
  font-size: 0.65rem;
  color: var(--text-muted);
}

.session-timeline__label {
  text-align: center;
}

/* Probability Panel */
.probability-panel {
  padding: 0.5rem 1rem;
}

.probability-panel__row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.probability-panel__percent {
  font-size: 1.1rem;
  font-weight: 700;
}

.probability-panel__target, .probability-panel__stop {
  font-size: 0.75rem;
}

/* Live Feed */
.live-feed {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.live-feed__header {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.live-feed__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: var(--glow-cyan);
  animation: glowPulse 2s infinite;
}

.live-feed__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.live-feed__item {
  padding: 0.5rem;
  border-radius: 4px;
  background: var(--bg-primary);
  border-left: 3px solid;
  font-size: 0.75rem;
  animation: fadeIn 0.3s ease-out;
}

.live-feed__item--stop {
  border-left-color: var(--accent-red);
}

.live-feed__item--caution {
  border-left-color: var(--accent-orange);
}

.live-feed__item--info {
  border-left-color: var(--accent-cyan);
}

.live-feed__item--ok {
  border-left-color: var(--accent-green);
}

.live-feed__time {
  color: var(--text-muted);
  font-size: 0.65rem;
  font-family: monospace;
}

.live-feed__severity {
  font-weight: 700;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-feed__severity--stop { color: var(--accent-red); }
.live-feed__severity--caution { color: var(--accent-orange); }
.live-feed__severity--info { color: var(--accent-cyan); }
.live-feed__severity--ok { color: var(--accent-green); }

.live-feed__message {
  color: var(--text-primary);
  margin-top: 0.15rem;
  line-height: 1.3;
}

.live-feed__count {
  padding: 0.4rem 0.75rem;
  border-top: 1px solid var(--border-default);
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
}

/* Settings Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  width: 400px;
  border: 1px solid var(--border-accent);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.1);
}

.modal__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.modal__field {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.modal__input {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.4rem 0.5rem;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  font-size: 0.85rem;
}

.modal__input:focus {
  border-color: var(--accent-cyan);
  outline: none;
  box-shadow: var(--glow-cyan);
}

.modal__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.modal__btn {
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  border: 1px solid var(--border-default);
  transition: all 0.2s;
}

.modal__btn--cancel {
  background: var(--bg-input);
  color: var(--text-primary);
}

.modal__btn--save {
  background: var(--accent-cyan);
  color: var(--bg-primary);
  border-color: var(--accent-cyan);
  font-weight: 600;
}

.modal__btn--save:hover {
  box-shadow: var(--glow-cyan);
}

/* Connection Screen */
.connect-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: var(--bg-primary);
}

.connect-screen__inner {
  text-align: center;
}

.connect-screen__title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-cyan);
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.connect-screen__text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
```

**Step 2: Verify CSS loads**

Run: `cd /c/Users/Meriton/Arctis/app && pnpm build`
Expected: Build succeeds (CSS is just styling, no TS errors)

**Step 3: Commit**

```bash
git add app/src/index.css
git commit -m "style: replace default CSS with gaming HUD theme"
```

---

### Task 2: App.tsx - Connection Screen Redesign

**Files:**
- Modify: `app/src/App.tsx`

**Step 1: Update App.tsx to use CSS classes**

```tsx
import { useEffect, useState } from "react";
import { checkHealth } from "./api";
import { Dashboard } from "./components/Dashboard";

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };
    const interval = setInterval(check, 2000);
    check();
    return () => clearInterval(interval);
  }, []);

  if (!connected) {
    return (
      <div className="connect-screen">
        <div className="connect-screen__inner">
          <h1 className="connect-screen__title">Arctis</h1>
          <p className="connect-screen__text">Verbinde mit Engine...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
```

**Step 2: Verify build**

Run: `cd /c/Users/Meriton/Arctis/app && pnpm build`

**Step 3: Commit**

```bash
git add app/src/App.tsx
git commit -m "style: update App connection screen to HUD theme"
```

---

### Task 3: Dashboard - New Layout mit 2-Spalten + Auto-Refresh

**Files:**
- Modify: `app/src/components/Dashboard.tsx`

**Step 1: Rewrite Dashboard with 2-column layout and 5s auto-refresh**

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Chart } from "./Chart";
import { HudBar } from "./HudBar";
import { SessionTimeline } from "./SessionTimeline";
import { ProbabilityPanel } from "./ProbabilityPanel";
import { LiveFeed } from "./LiveFeed";
import { SettingsPanel } from "./SettingsPanel";
import type { CandlestickData, Time } from "lightweight-charts";
import {
  fetchBars,
  fetchStructure,
  fetchVolume,
  fetchSessions,
  fetchWarnings,
  fetchProbability,
} from "../api";

export interface FeedItem {
  id: string;
  time: string;
  severity: "stop" | "caution" | "info" | "ok";
  message: string;
}

export interface HudData {
  rvol: number | null;
  spikeCount: number;
  currentSession: string;
  barCount: number;
}

export interface ProbabilityData {
  bullish_pct: number;
  bearish_pct: number;
  target_zones: { direction: string; price: number; probability: number }[];
}

export interface SessionStats {
  current_session: string;
  session_stats: Record<string, { bar_count: number; avg_volume: number; avg_range: number }>;
}

export function Dashboard() {
  const [market, setMarket] = useState<"ES" | "NQ">("ES");
  const [timeframe, setTimeframe] = useState<"1min" | "5min">("1min");
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [trend, setTrend] = useState<string>("—");
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [hudData, setHudData] = useState<HudData>({ rvol: null, spikeCount: 0, currentSession: "—", barCount: 0 });
  const [sessionData, setSessionData] = useState<SessionStats | null>(null);
  const [probabilityData, setProbabilityData] = useState<ProbabilityData | null>(null);
  const feedIdCounter = useRef(0);

  const loadData = useCallback(async () => {
    try {
      const [bars, structure, volume, sessions, warnings, probability] = await Promise.all([
        fetchBars(market, timeframe),
        fetchStructure(market, timeframe),
        fetchVolume(market, timeframe),
        fetchSessions(market, timeframe),
        fetchWarnings(market, timeframe),
        fetchProbability(market, timeframe).catch(() => null),
      ]);

      setChartData(
        bars.map((b: { timestamp: number; open: number; high: number; low: number; close: number }) => ({
          time: b.timestamp as Time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );

      setTrend(structure.trend);

      // HUD data
      const latestRvol = volume.relative_volume?.length > 0
        ? volume.relative_volume[volume.relative_volume.length - 1].rvol
        : null;
      setHudData({
        rvol: latestRvol,
        spikeCount: volume.spikes?.length || 0,
        currentSession: sessions.current_session || "—",
        barCount: volume.bar_count || 0,
      });

      setSessionData(sessions);
      if (probability) setProbabilityData(probability);

      // Build feed items from warnings
      const now = new Date();
      const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const newItems: FeedItem[] = [];

      // Trend change hint
      if (structure.trend && structure.trend !== "—") {
        newItems.push({
          id: `trend-${++feedIdCounter.current}`,
          time: timeStr,
          severity: "info",
          message: `Trend: ${structure.trend === "uptrend" ? "Aufwärtstrend" : structure.trend === "downtrend" ? "Abwärtstrend" : "Neutral"}`,
        });
      }

      // Volume spikes
      if (volume.spikes?.length > 0) {
        const latest = volume.spikes[volume.spikes.length - 1];
        newItems.push({
          id: `spike-${++feedIdCounter.current}`,
          time: timeStr,
          severity: "caution",
          message: `Volume-Spike: ${latest.ratio.toFixed(1)}x Durchschnitt`,
        });
      }

      // Warnings from backend
      if (warnings.warnings) {
        for (const w of warnings.warnings) {
          const severity = w.severity === "stop" ? "stop" : w.severity === "caution" ? "caution" : "info";
          newItems.push({
            id: `warn-${++feedIdCounter.current}`,
            time: timeStr,
            severity,
            message: w.message,
          });
        }
      }

      // Session info
      if (sessions.current_session) {
        const labels: Record<string, string> = {
          premarket: "Pre-Market", ny_open: "NY Open", midday: "Midday",
          power_hour: "Power Hour", after_hours: "After Hours", closed: "Geschlossen",
        };
        newItems.push({
          id: `session-${++feedIdCounter.current}`,
          time: timeStr,
          severity: "ok",
          message: `Session: ${labels[sessions.current_session] || sessions.current_session}`,
        });
      }

      if (newItems.length > 0) {
        setFeedItems(prev => [...newItems, ...prev].slice(0, 100));
      }

      setError(null);
    } catch {
      setError("Engine nicht erreichbar");
    }
  }, [market, timeframe]);

  // Initial load + 5s auto-refresh
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const trendClass = trend === "uptrend" ? "header__trend--up"
    : trend === "downtrend" ? "header__trend--down"
    : "header__trend--neutral";

  return (
    <>
      {/* Header */}
      <div className="header">
        <span className="header__logo">Arctis</span>
        <select className="header__select" value={market} onChange={(e) => setMarket(e.target.value as "ES" | "NQ")}>
          <option value="ES">ES</option>
          <option value="NQ">NQ</option>
        </select>
        <select className="header__select" value={timeframe} onChange={(e) => setTimeframe(e.target.value as "1min" | "5min")}>
          <option value="1min">1 Min</option>
          <option value="5min">5 Min</option>
        </select>
        <span className={`header__trend ${trendClass}`}>
          {trend === "uptrend" ? "▲" : trend === "downtrend" ? "▼" : "◆"} {trend}
        </span>
        {error && <span className="header__error">{error}</span>}
        <div className="header__spacer" />
        <button className="header__btn" onClick={() => setShowSettings(true)}>
          Einstellungen
        </button>
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left: Chart + Panels */}
        <div className="main-layout__left">
          <div className="chart-area">
            <Chart data={chartData} />
          </div>
          <HudBar data={hudData} />
          <SessionTimeline data={sessionData} />
          <ProbabilityPanel data={probabilityData} />
        </div>

        {/* Right: Live Feed */}
        <div className="main-layout__right">
          <LiveFeed items={feedItems} />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
```

**Step 2: Verify build (will fail — missing components)**

Expected: TS errors for HudBar, LiveFeed, ProbabilityPanel (they don't exist yet)

**Step 3: Commit**

```bash
git add app/src/components/Dashboard.tsx
git commit -m "feat: redesign Dashboard with 2-column HUD layout and 5s auto-refresh"
```

---

### Task 4: Chart.tsx - HUD Theme Colors

**Files:**
- Modify: `app/src/components/Chart.tsx`

**Step 1: Update Chart colors to HUD theme**

```tsx
import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, CandlestickData, Time } from "lightweight-charts";

interface ChartProps {
  data: CandlestickData<Time>[];
}

export function Chart({ data }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0a0a1a" },
        textColor: "#7a8a9e",
      },
      grid: {
        vertLines: { color: "#1a2332" },
        horzLines: { color: "#1a2332" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#00f0ff", width: 1, style: 2, labelBackgroundColor: "#0d1117" },
        horzLine: { color: "#00f0ff", width: 1, style: 2, labelBackgroundColor: "#0d1117" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1a2332",
      },
      rightPriceScale: {
        borderColor: "#1a2332",
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff88",
      downColor: "#ff3366",
      borderVisible: false,
      wickUpColor: "#00ff88",
      wickDownColor: "#ff3366",
    });

    candleSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
```

**Step 2: Commit**

```bash
git add app/src/components/Chart.tsx
git commit -m "style: update Chart to HUD neon color theme"
```

---

### Task 5: HudBar Component (NEU)

**Files:**
- Create: `app/src/components/HudBar.tsx`

**Step 1: Create HudBar component**

```tsx
import type { HudData } from "./Dashboard";

const SESSION_LABELS: Record<string, string> = {
  premarket: "PRE-MARKET",
  ny_open: "NY OPEN",
  midday: "MIDDAY",
  power_hour: "POWER HOUR",
  after_hours: "AFTER HOURS",
  closed: "CLOSED",
};

export function HudBar({ data }: { data: HudData }) {
  const rvolClass = data.rvol && data.rvol > 2 ? "hud-bar__value--red"
    : data.rvol && data.rvol > 1.5 ? "hud-bar__value--green"
    : "hud-bar__value--highlight";

  return (
    <div className="hud-bar">
      <div className="hud-bar__item">
        <span className="hud-bar__label">RVOL</span>
        <span className={`hud-bar__value ${rvolClass}`}>
          {data.rvol ? `${data.rvol.toFixed(2)}x` : "—"}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">Spikes</span>
        <span className={`hud-bar__value ${data.spikeCount > 0 ? "hud-bar__value--orange" : ""}`}>
          {data.spikeCount}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">Session</span>
        <span className="hud-bar__value hud-bar__value--highlight">
          {SESSION_LABELS[data.currentSession] || data.currentSession}
        </span>
      </div>
      <div className="hud-bar__divider" />
      <div className="hud-bar__item">
        <span className="hud-bar__label">Bars</span>
        <span className="hud-bar__value">{data.barCount}</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/HudBar.tsx
git commit -m "feat: add HudBar component with key metrics"
```

---

### Task 6: LiveFeed Component (NEU)

**Files:**
- Create: `app/src/components/LiveFeed.tsx`

**Step 1: Create LiveFeed component**

```tsx
import { useEffect, useRef } from "react";
import type { FeedItem } from "./Dashboard";

export function LiveFeed({ items }: { items: FeedItem[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [items.length]);

  return (
    <div className="live-feed">
      <div className="live-feed__header">
        <span className="live-feed__dot" />
        Live Feed
      </div>
      <div className="live-feed__list" ref={listRef}>
        {items.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center", padding: "2rem 0" }}>
            Warte auf Analyse-Daten...
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className={`live-feed__item live-feed__item--${item.severity}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={`live-feed__severity live-feed__severity--${item.severity}`}>
                {item.severity === "stop" ? "STOP" : item.severity === "caution" ? "WARN" : item.severity === "ok" ? "OK" : "INFO"}
              </span>
              <span className="live-feed__time">{item.time}</span>
            </div>
            <div className="live-feed__message">{item.message}</div>
          </div>
        ))}
      </div>
      <div className="live-feed__count">
        {items.length} Hinweise
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/LiveFeed.tsx
git commit -m "feat: add LiveFeed sidebar component"
```

---

### Task 7: SessionTimeline Redesign (Progress Bar)

**Files:**
- Modify: `app/src/components/SessionTimeline.tsx`

**Step 1: Rewrite SessionTimeline as progress bar**

```tsx
import type { SessionStats } from "./Dashboard";

const SESSION_ORDER = ["premarket", "ny_open", "midday", "power_hour", "after_hours"];

const SESSION_LABELS: Record<string, string> = {
  premarket: "PRE",
  ny_open: "NY",
  midday: "MID",
  power_hour: "PWR",
  after_hours: "AH",
};

const SESSION_COLORS: Record<string, string> = {
  premarket: "#4a5568",
  ny_open: "#00ff88",
  midday: "#4488ff",
  power_hour: "#ffaa00",
  after_hours: "#4a5568",
};

export function SessionTimeline({ data }: { data: SessionStats | null }) {
  if (!data) return null;

  const totalBars = SESSION_ORDER.reduce((sum, s) => sum + (data.session_stats[s]?.bar_count || 0), 0);

  return (
    <div className="session-timeline">
      <div className="session-timeline__bar">
        {SESSION_ORDER.map((session) => {
          const stats = data.session_stats[session];
          const pct = totalBars > 0 ? ((stats?.bar_count || 0) / totalBars) * 100 : 20;
          const isActive = session === data.current_session;
          const color = SESSION_COLORS[session] || "#4a5568";

          return (
            <div
              key={session}
              className={`session-timeline__segment ${isActive ? "session-timeline__segment--active" : ""}`}
              style={{
                width: `${Math.max(pct, 8)}%`,
                background: isActive ? color : `${color}33`,
                color: isActive ? "#fff" : "var(--text-muted)",
                boxShadow: isActive ? `0 0 15px ${color}66` : "none",
              }}
            >
              {SESSION_LABELS[session] || session}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/SessionTimeline.tsx
git commit -m "style: redesign SessionTimeline as HUD progress bar"
```

---

### Task 8: ProbabilityPanel Component (NEU)

**Files:**
- Create: `app/src/components/ProbabilityPanel.tsx`

**Step 1: Create ProbabilityPanel component**

```tsx
import type { ProbabilityData } from "./Dashboard";

export function ProbabilityPanel({ data }: { data: ProbabilityData | null }) {
  if (!data) {
    return (
      <div className="probability-panel">
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Probability: Nicht genug Daten
        </div>
      </div>
    );
  }

  const bullish = data.bullish_pct ?? 0;
  const isBullish = bullish >= 50;

  return (
    <div className="probability-panel">
      <div className="probability-panel__row">
        <span className="probability-panel__percent" style={{ color: isBullish ? "var(--accent-green)" : "var(--accent-red)" }}>
          {bullish.toFixed(0)}%
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          {isBullish ? "bullish" : "bearish"} (historisch)
        </span>
        {data.target_zones && data.target_zones.length > 0 && (
          <>
            <div className="hud-bar__divider" />
            {data.target_zones.slice(0, 2).map((z, i) => (
              <span key={i} className="probability-panel__target" style={{
                color: z.direction === "up" ? "var(--accent-green)" : "var(--accent-red)"
              }}>
                {z.direction === "up" ? "▲" : "▼"} {z.price.toFixed(0)} ({z.probability.toFixed(0)}%)
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/ProbabilityPanel.tsx
git commit -m "feat: add ProbabilityPanel with target zones"
```

---

### Task 9: SettingsPanel Redesign

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`

**Step 1: Update SettingsPanel to use CSS classes**

```tsx
import { useEffect, useState } from "react";
import { fetchConfig, saveConfig } from "../api";

interface Config {
  account_size: number;
  risk_percent: number;
  daily_loss_limit: number;
  max_daily_trades: number;
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    await saveConfig(config as unknown as Record<string, unknown>);
    onClose();
  };

  if (!config) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">Einstellungen</h3>
        <label className="modal__field">
          Kontogröße ($)
          <input className="modal__input" type="number" value={config.account_size}
            onChange={e => setConfig({...config, account_size: +e.target.value})} />
        </label>
        <label className="modal__field">
          Risiko pro Trade (%)
          <input className="modal__input" type="number" step="0.1" value={config.risk_percent}
            onChange={e => setConfig({...config, risk_percent: +e.target.value})} />
        </label>
        <label className="modal__field">
          Tages-Verlustlimit ($)
          <input className="modal__input" type="number" value={config.daily_loss_limit}
            onChange={e => setConfig({...config, daily_loss_limit: +e.target.value})} />
        </label>
        <label className="modal__field">
          Max Trades/Tag
          <input className="modal__input" type="number" value={config.max_daily_trades}
            onChange={e => setConfig({...config, max_daily_trades: +e.target.value})} />
        </label>
        <div className="modal__actions">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Abbrechen</button>
          <button className="modal__btn modal__btn--save" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/SettingsPanel.tsx
git commit -m "style: redesign SettingsPanel with HUD theme"
```

---

### Task 10: Cleanup alte Komponenten + Build-Test

**Files:**
- Delete: `app/src/components/VolumePanel.tsx` (replaced by HudBar)
- Delete: `app/src/components/WarningsPanel.tsx` (replaced by LiveFeed)
- Delete: `app/src/App.css` (unused)

**Step 1: Delete unused files**

```bash
rm app/src/components/VolumePanel.tsx
rm app/src/components/WarningsPanel.tsx
rm app/src/App.css
```

**Step 2: Run full build**

Run: `cd /c/Users/Meriton/Arctis/app && pnpm build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove replaced components (VolumePanel, WarningsPanel)"
```

---

### Task 11: Integration Test - Visueller Check

**Step 1: Restart Vite dev server**

```bash
cd /c/Users/Meriton/Arctis/app && pnpm dev
```

**Step 2: Open browser and verify**

- Open `http://localhost:5173`
- Verify: Dark HUD theme with cyan accents
- Verify: 2-column layout (chart left, feed right)
- Verify: HUD bar with RVOL, Spikes, Session, Bars
- Verify: Session timeline as progress bar
- Verify: Live feed updates every 5 seconds
- Verify: Settings modal with HUD styling

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "feat: complete UI redesign to gaming HUD theme"
```

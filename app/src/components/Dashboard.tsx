/**
 * @deprecated This component is superseded by the page-based layout in App.tsx
 * (DashboardPage, ChartPage, PatternsPage) with Zustand store state management.
 * Do not use in new code. Kept for reference until Phase 4 cleanup.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Chart } from "./Chart";
import { HudBar } from "./HudBar";
import { SessionTimeline } from "./SessionTimeline";
import { LiveFeed } from "./LiveFeed";
import { SettingsPanel } from "./SettingsPanel";
import type { CandlestickData, Time } from "lightweight-charts";
import {
  fetchBars,
  fetchStructure,
  fetchVolume,
  fetchSessions,
  fetchWarnings,
  fetchIndicators,
  fetchConfluence,
  fetchPatterns,
  simStart,
  simStop,
  simStatus,
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
  rsi: number | null;
  emaAlignment: string | null;
}

export interface ConfluenceData {
  score: number;
  maxScore: number;
  direction: string;
  confidence: string;
  signals: { name: string; direction: string; strength: number; detail: string }[];
  vwap: number | null;
  poc: number | null;
}

export interface SessionStats {
  current_session: string;
  session_stats: Record<string, { bar_count: number; avg_volume: number; avg_range: number }>;
}

interface IndicatorLine {
  timestamp: number;
  value: number;
}

interface PriceLine {
  price: number;
  color: string;
  label: string;
  style?: number;
}

export interface PatternMarker {
  timestamp: number;
  pattern: string;
  direction: string;
  text: string;
  detail: string;
  confidence: string;
  win_rate: number | null;
  category: string;
  price: number;
  target: number | null;
  marker_type: string; // "arrow_up", "arrow_down", "circle", "label"
  color: string;
}

export function Dashboard() {
  const [market, setMarket] = useState<"ES" | "NQ">("ES");
  const [timeframe, setTimeframe] = useState<"1min" | "5min">("1min");
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [trend, setTrend] = useState<string>("\u2014");
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [hudData, setHudData] = useState<HudData>({ rvol: null, spikeCount: 0, currentSession: "\u2014", barCount: 0, rsi: null, emaAlignment: null });
  const [sessionData, setSessionData] = useState<SessionStats | null>(null);
  const [confluenceData, setConfluenceData] = useState<ConfluenceData | null>(null);
  const [simActive, setSimActive] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(10);
  // Chart overlay data
  const [vwapLine, setVwapLine] = useState<IndicatorLine[]>([]);
  const [vwapU1, setVwapU1] = useState<IndicatorLine[]>([]);
  const [vwapL1, setVwapL1] = useState<IndicatorLine[]>([]);
  const [vwapU2, setVwapU2] = useState<IndicatorLine[]>([]);
  const [vwapL2, setVwapL2] = useState<IndicatorLine[]>([]);
  const [ema9Line, setEma9Line] = useState<IndicatorLine[]>([]);
  const [ema21Line, setEma21Line] = useState<IndicatorLine[]>([]);
  const [ema50Line, setEma50Line] = useState<IndicatorLine[]>([]);
  const [priceLines, setPriceLines] = useState<PriceLine[]>([]);
  const [patternMarkers, setPatternMarkers] = useState<PatternMarker[]>([]);
  const [dayType, setDayType] = useState<string>("");
  const [dayBias, setDayBias] = useState<string>("");
  const feedIdCounter = useRef(0);
  const prevConfRef = useRef<string>("");

  const loadData = useCallback(async () => {
    try {
      const [bars, structure, volume, sessions, warnings, indicators, confluence, patterns] = await Promise.all([
        fetchBars(market, timeframe),
        fetchStructure(market, timeframe),
        fetchVolume(market, timeframe),
        fetchSessions(market, timeframe),
        fetchWarnings(market, timeframe),
        fetchIndicators(market, timeframe).catch(() => null),
        fetchConfluence(market, timeframe).catch(() => null),
        fetchPatterns(market, timeframe).catch(() => null),
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

      // Indicators for chart overlays
      if (indicators) {
        if (indicators.vwap) {
          setVwapLine(indicators.vwap.map((v: { timestamp: number; vwap: number }) => ({ timestamp: v.timestamp, value: v.vwap })));
          setVwapU1(indicators.vwap.map((v: { timestamp: number; upper_1: number }) => ({ timestamp: v.timestamp, value: v.upper_1 })));
          setVwapL1(indicators.vwap.map((v: { timestamp: number; lower_1: number }) => ({ timestamp: v.timestamp, value: v.lower_1 })));
          setVwapU2(indicators.vwap.map((v: { timestamp: number; upper_2: number }) => ({ timestamp: v.timestamp, value: v.upper_2 })));
          setVwapL2(indicators.vwap.map((v: { timestamp: number; lower_2: number }) => ({ timestamp: v.timestamp, value: v.lower_2 })));
        }
        if (indicators.ema) {
          setEma9Line(indicators.ema.map((e: { timestamp: number; ema9: number }) => ({ timestamp: e.timestamp, value: e.ema9 })));
          setEma21Line(indicators.ema.map((e: { timestamp: number; ema21: number }) => ({ timestamp: e.timestamp, value: e.ema21 })));
          setEma50Line(indicators.ema.map((e: { timestamp: number; ema50: number }) => ({ timestamp: e.timestamp, value: e.ema50 })));
        }

        // Price lines from volume profile + session levels
        const lines: PriceLine[] = [];
        if (indicators.volume_profile) {
          lines.push({ price: indicators.volume_profile.poc, color: "#ffdd00", label: "POC", style: 0 });
          lines.push({ price: indicators.volume_profile.vah, color: "rgba(255,221,0,0.5)", label: "VAH", style: 2 });
          lines.push({ price: indicators.volume_profile.val, color: "rgba(255,221,0,0.5)", label: "VAL", style: 2 });
        }
        if (indicators.session_levels) {
          const sl = indicators.session_levels;
          if (sl.prev_high) lines.push({ price: sl.prev_high, color: "#ff336680", label: "Prev H" });
          if (sl.prev_low) lines.push({ price: sl.prev_low, color: "#00ff8880", label: "Prev L" });
          if (sl.prev_close) lines.push({ price: sl.prev_close, color: "#ffffff40", label: "Prev C" });
          if (sl.opening_range_high) lines.push({ price: sl.opening_range_high, color: "#00f0ff60", label: "ORH" });
          if (sl.opening_range_low) lines.push({ price: sl.opening_range_low, color: "#00f0ff60", label: "ORL" });
        }
        setPriceLines(lines);
      }

      // HUD data
      const latestRvol = volume.relative_volume?.length > 0
        ? volume.relative_volume[volume.relative_volume.length - 1].rvol
        : null;
      const latestRsi = indicators?.rsi?.length > 0 ? indicators.rsi[indicators.rsi.length - 1].rsi : null;
      const latestEma = indicators?.ema?.length > 0 ? indicators.ema[indicators.ema.length - 1].alignment : null;
      setHudData({
        rvol: latestRvol,
        spikeCount: volume.spikes?.length || 0,
        currentSession: sessions.current_session || "\u2014",
        barCount: volume.bar_count || 0,
        rsi: latestRsi,
        emaAlignment: latestEma,
      });

      setSessionData(sessions);

      // Confluence
      if (confluence) {
        setConfluenceData({
          score: confluence.score,
          maxScore: confluence.max_score,
          direction: confluence.direction,
          confidence: confluence.confidence,
          signals: confluence.signals,
          vwap: confluence.indicators?.vwap?.vwap || null,
          poc: confluence.indicators?.volume_profile?.poc || null,
        });
      }

      // Pattern annotations
      if (patterns) {
        setPatternMarkers(patterns.annotations || []);
        setDayType(patterns.day_type || "");
        setDayBias(patterns.day_bias || "");
      }

      // Build feed items
      const now = new Date();
      const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const newItems: FeedItem[] = [];

      // Confluence signal as main feed item
      if (confluence) {
        const confKey = `${confluence.direction}-${confluence.score}-${confluence.confidence}`;
        if (confKey !== prevConfRef.current) {
          prevConfRef.current = confKey;
          const isConfStrong = confluence.confidence === "STARK";
          const isConfMedium = confluence.confidence === "MITTEL";
          const isConfLong = confluence.direction === "LONG";
          const isConfShort = confluence.direction === "SHORT";

          const action = isConfStrong
            ? (isConfLong ? "EINSTIEG LONG" : "EINSTIEG SHORT")
            : isConfMedium
            ? (isConfLong ? "LONG MÖGLICH" : isConfShort ? "SHORT MÖGLICH" : "ABWARTEN")
            : "KEIN EINSTIEG";

          const sev = isConfStrong ? (isConfLong ? "ok" as const : "stop" as const) : isConfMedium ? "caution" as const : "info" as const;
          newItems.push({
            id: `conf-${++feedIdCounter.current}`,
            time: timeStr,
            severity: sev,
            message: `${action} - Score ${Math.abs(confluence.score)}/${confluence.max_score} (${confluence.confidence})`,
          });

          // Add individual signals to feed
          for (const sig of confluence.signals) {
            if (sig.strength !== 0) {
              newItems.push({
                id: `sig-${++feedIdCounter.current}`,
                time: timeStr,
                severity: sig.direction === "long" ? "ok" as const : sig.direction === "short" ? "caution" as const : "info" as const,
                message: sig.detail,
              });
            }
          }
        }
      }

      if (volume.spikes?.length > 0) {
        const latest = volume.spikes[volume.spikes.length - 1];
        newItems.push({
          id: `spike-${++feedIdCounter.current}`,
          time: timeStr,
          severity: "caution",
          message: `Volume-Spike: ${latest.ratio.toFixed(1)}x Durchschnitt`,
        });
      }

      if (warnings.warnings) {
        for (const w of warnings.warnings) {
          const severity = w.severity === "stop" ? "stop" as const : w.severity === "caution" ? "caution" as const : "info" as const;
          newItems.push({
            id: `warn-${++feedIdCounter.current}`,
            time: timeStr,
            severity,
            message: w.message,
          });
        }
      }

      // Check sim status
      const simSt = await simStatus().catch(() => null);
      if (simSt) {
        setSimActive(simSt.active);
        setSimProgress(simSt.progress_pct || 0);
      }

      const isMarketActive = simSt?.active || (sessions.current_session && sessions.current_session !== "closed");
      if (newItems.length > 0 && isMarketActive) {
        setFeedItems(prev => {
          const updated = [...newItems, ...prev];
          if (updated.length > 50) {
            return updated.slice(0, 15);
          }
          return updated;
        });
      }

      setError(null);
    } catch {
      setError("Engine nicht erreichbar");
    }
  }, [market, timeframe]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, simActive ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [loadData, simActive]);

  const handleSimToggle = async () => {
    if (simActive) {
      await simStop();
      setSimActive(false);
      setSimProgress(0);
      setFeedItems([]);
    } else {
      prevConfRef.current = "";
      await simStart(market, timeframe, simSpeed);
      setSimActive(true);
      setFeedItems([]);
    }
  };

  const trendClass = trend === "uptrend" ? "header__trend--up"
    : trend === "downtrend" ? "header__trend--down"
    : "header__trend--neutral";

  // Confluence badge - klare Empfehlung
  const isStrong = confluenceData?.confidence === "STARK";
  const isMedium = confluenceData?.confidence === "MITTEL";
  const isLong = confluenceData?.direction === "LONG";
  const isShort = confluenceData?.direction === "SHORT";

  const confColor = confluenceData
    ? isLong ? (isStrong ? "var(--accent-green)" : isMedium ? "#88ddaa" : "var(--text-muted)")
      : isShort ? (isStrong ? "var(--accent-red)" : isMedium ? "#dd8899" : "var(--text-muted)")
      : "var(--text-secondary)"
    : "var(--text-muted)";

  const confBg = confluenceData
    ? isLong ? (isStrong ? "rgba(0,255,136,0.2)" : isMedium ? "rgba(0,255,136,0.08)" : "rgba(74,85,104,0.15)")
      : isShort ? (isStrong ? "rgba(255,51,102,0.2)" : isMedium ? "rgba(255,51,102,0.08)" : "rgba(74,85,104,0.15)")
      : "rgba(74,85,104,0.15)"
    : "transparent";

  const confAction = confluenceData
    ? isStrong ? (isLong ? "EINSTIEG LONG" : "EINSTIEG SHORT")
      : isMedium ? (isLong ? "LONG MÖGLICH" : "SHORT MÖGLICH")
      : "KEIN EINSTIEG"
    : "";

  return (
    <>
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
          {trend === "uptrend" ? "\u25B2" : trend === "downtrend" ? "\u25BC" : "\u25C6"} {trend}
        </span>
        {/* Confluence Score Badge */}
        {confluenceData && (
          <span style={{
            padding: "0.25rem 1rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.9rem",
            color: confColor, background: confBg,
            border: `1px solid ${confColor}`,
            boxShadow: isStrong ? `0 0 15px ${confColor}50` : "none",
            letterSpacing: "0.5px",
          }}>
            {isLong ? "\u25B2" : isShort ? "\u25BC" : "\u25C6"}{" "}
            {confAction} ({Math.abs(confluenceData.score)}/{confluenceData.maxScore})
          </span>
        )}
        {error && <span className="header__error">{error}</span>}
        <div className="header__spacer" />
        {simActive && (
          <span style={{ fontSize: "0.75rem", color: "var(--accent-orange)" }}>
            SIM {simProgress.toFixed(0)}%
          </span>
        )}
        <select
          className="header__select"
          value={simSpeed}
          onChange={(e) => setSimSpeed(Number(e.target.value))}
          title="Sim-Geschwindigkeit (Bars/Sekunde)"
        >
          <option value={5}>5x</option>
          <option value={10}>10x</option>
          <option value={25}>25x</option>
          <option value={50}>50x</option>
        </select>
        <button
          className="header__btn"
          onClick={handleSimToggle}
          style={simActive ? { borderColor: "var(--accent-red)", color: "var(--accent-red)" } : { borderColor: "var(--accent-green)", color: "var(--accent-green)" }}
        >
          {simActive ? "Stop" : "Sim"}
        </button>
        <button className="header__btn" onClick={() => setShowSettings(true)}>
          Einstellungen
        </button>
      </div>

      <div className="main-layout">
        <div className="main-layout__left">
          <div className="chart-area">
            <Chart
              data={chartData}
              vwap={vwapLine}
              vwapUpper1={vwapU1}
              vwapLower1={vwapL1}
              vwapUpper2={vwapU2}
              vwapLower2={vwapL2}
              ema9={ema9Line}
              ema21={ema21Line}
              ema50={ema50Line}
              priceLines={priceLines}
              info={confluenceData ? {
                direction: confluenceData.direction,
                confidence: confluenceData.confidence,
                score: confluenceData.score,
                maxScore: confluenceData.maxScore,
                vwap: confluenceData.vwap,
                poc: confluenceData.poc,
                rsi: hudData.rsi,
                emaAlignment: hudData.emaAlignment,
                dayHigh: null,
                dayLow: null,
              } : undefined}
              markers={patternMarkers}
              dayType={dayType}
              dayBias={dayBias}
            />
          </div>
          <HudBar data={hudData} confluence={confluenceData} />
          <SessionTimeline data={sessionData} />
        </div>

        <div className="main-layout__right">
          <LiveFeed items={feedItems} />
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}

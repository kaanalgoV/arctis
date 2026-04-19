import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useMarketData } from '@/hooks/useMarketData'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useReplay } from '@/hooks/useReplay'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSessionClock } from '@/hooks/useSessionClock'
import { useMarketStore } from '@/store/market'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { HudStrip } from '@/components/layout/HudStrip'
import { StatusBar } from '@/components/layout/StatusBar'
import { RightPanel, RightPanelSection, RightPanelDivider } from '@/components/layout/RightPanel'
import {
  SessionPanel,
  ConfluencePanel,
  FeedPanel,
  RiskPanel,
  BiasPanel,
  ArctisPanel,
  SignalsPanel,
} from '@/components/panels'
import { SetupLifecyclePanel } from '@/components/panels/SetupLifecyclePanel'
import { useSetups } from '@/hooks/useSetups'
import type { ConfluenceAPIData } from '@/components/panels/ConfluencePanel'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'
import type { SessionAPIData } from '@/components/panels/SessionPanel'
import type { FeedItem } from '@/components/panels/FeedPanel'
import type { BiasData } from '@/components/panels/BiasPanel'
import type { SignalsAPIData } from '@/components/panels/SignalsPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import type { OHLCVBar } from '@/types/market'
import type { IndicatorData, VolumeData, TradingConfig } from '@/types/analysis'
import { TF_DISPLAY, TIMEFRAMES } from '@/types/contracts'
import type { Timeframe, MarketInfo } from '@/types/contracts'
import { PanelSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
// SciChart chart doesn't expose IChartApi — use unknown for now
type IChartApi = unknown
import { DashboardPage } from '@/pages/DashboardPage'
import { ChartPage } from '@/pages/ChartPage'
import { PatternsPage } from '@/pages/PatternsPage'
import { ChangelogPage } from '@/pages/ChangelogPage'
import { AuthPage } from '@/pages/AuthPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { EngineOverviewPage } from '@/pages/EngineOverviewPage'
import { useSettingsStore } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { useLiveStore } from '@/live'

const SESSION_DISPLAY: Record<string, string> = {
  pre_market: 'Pre-Mkt',
  premarket: 'Pre-Mkt',
  ny_open: 'NY Open',
  midday: 'Midday',
  afternoon: 'Afternoon',
  power_hour: 'Power Hr',
  after_hours: 'After Hrs',
  overnight: 'Overnight',
  globex: 'Globex',
  closed: 'Closed',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppMode = 'live' | 'replay'

// Active page in sidebar navigation
type ActivePage = 'dashboard' | 'chart' | 'patterns' | 'engine' | 'replay' | 'settings'

interface StructureBreak {
  type: string
  direction: string
  price: number
  timestamp: number
}

interface StructureAPIData {
  structure_breaks: StructureBreak[]
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function formatHHMM(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000)
  const hh = d.getUTCHours().toString().padStart(2, '0')
  const mm = d.getUTCMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

// Format bar timestamp as ET time string for replay display
function formatBarTimeET(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    hour12: false,
  })
}

function deriveVwapPosition(
  indicators: IndicatorData | null,
  lastClose: number | undefined,
): string | null {
  if (!indicators?.vwap?.length || lastClose == null) return null
  const v = indicators.vwap.at(-1)
  if (!v) return null
  if (lastClose > v.vwap) return 'above'
  if (lastClose < v.vwap) return 'below'
  return 'at'
}

// ---------------------------------------------------------------------------
// Feed aggregation
// ---------------------------------------------------------------------------

function buildFeedItems(
  confluenceData: ConfluenceAPIData | null,
  volumeData: VolumeData | null,
  patternsData: PatternsAPIData | null,
  sessionData: SessionAPIData | null,
): FeedItem[] {
  const now = Math.floor(Date.now() / 1000)
  const bucket: Array<{ ts: number; item: FeedItem }> = []

  // Confluence signals — synthetic recent offset per index
  if (confluenceData?.signals) {
    confluenceData.signals.forEach((sig, idx) => {
      const ts = now - idx * 15
      bucket.push({
        ts,
        item: {
          time: formatHHMM(ts),
          timestamp: ts,
          message: `${sig.name}: ${sig.direction} (${sig.strength > 0 ? '+' : ''}${sig.strength})`,
          type: sig.strength > 0 ? 'signal' : 'warning',
        },
      })
    })
  }

  // Volume spikes — use actual bar timestamp
  if (volumeData?.spikes) {
    volumeData.spikes.forEach((spike) => {
      bucket.push({
        ts: spike.timestamp,
        item: {
          time: formatHHMM(spike.timestamp),
          timestamp: spike.timestamp,
          message: `RVOL Spike ${spike.ratio.toFixed(1)}x`,
          type: 'volume',
        },
      })
    })
  }

  // Pattern annotations — use actual bar timestamp
  if (patternsData?.annotations) {
    patternsData.annotations.forEach((ann) => {
      bucket.push({
        ts: ann.timestamp,
        item: {
          time: formatHHMM(ann.timestamp),
          timestamp: ann.timestamp,
          message: `${ann.pattern}: ${ann.direction}${ann.win_rate != null ? ` (${Math.round(ann.win_rate * 100)}%)` : ''}`,
          type: ann.direction === 'long' ? 'signal' : ann.direction === 'short' ? 'warning' : 'info',
        },
      })
    })
  }

  // Day bias
  if (patternsData?.day_bias && patternsData.day_bias !== 'unknown') {
    const ts = now - 600
    bucket.push({
      ts,
      item: {
        time: formatHHMM(ts),
        timestamp: ts,
        message: `Day Bias: ${patternsData.day_bias} (${patternsData.day_type})`,
        type: 'info',
      },
    })
  }

  // Current session
  if (sessionData?.current_session) {
    const label =
      SESSION_DISPLAY[sessionData.current_session] ?? sessionData.current_session
    const ts = now - 300
    bucket.push({
      ts,
      item: {
        time: formatHHMM(ts),
        timestamp: ts,
        message: `Session: ${label}`,
        type: 'info',
      },
    })
  }

  return bucket
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20)
    .map((x) => x.item)
}

function AppShell() {
  // ── Auth guard — redirect to /login if not authenticated ────────────────
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // ── Zustand store ──────────────────────────────────────────────────────────
  const {
    market,
    symbol,
    timeframe,
    days,
    markets,
    setMarket: storeSetMarket,
    setTimeframe: storeSetTimeframe,
    setMarkets: storeSetMarkets,
    setDataSource: storeSetDataSource,
  } = useMarketStore()

  // ── Settings store — engineUrl used for direct fetch calls in App ─────────
  const engineUrl = useSettingsStore((s) => s.engineUrl)
  const loadSettingsFromServer = useSettingsStore((s) => s.loadFromServer)

  // Load server-persisted preferences once on mount (merges with local state)
  useEffect(() => {
    void loadSettingsFromServer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Page navigation ────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<ActivePage>('chart')

  // ── Mode ───────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AppMode>('live')

  // ── Replay bars state (sim-filtered bars during active replay) ─────────────
  const [replayBarsData, setReplayBarsData] = useState<OHLCVBar[]>([])
  const replayBarCountRef = useRef(0)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false)

  // ── Strategy Library active count (for RightPanelSection badge) ──────────
  const [_activeStrategyCount] = useState<number | undefined>(undefined)

  // ── Chart API ref (for feed-to-chart scroll and keyboard shortcuts) ─────────
  const chartApiRef = useRef<IChartApi | null>(null)
  const handleChartReady = useCallback((chart: IChartApi) => {
    chartApiRef.current = chart
  }, [])

  // ── Feed → chart scroll ────────────────────────────────────────────────────
  const [scrollToTimestamp, setScrollToTimestamp] = useState<number | null>(null)
  const handleFeedItemClick = useCallback((timestamp: number) => {
    setScrollToTimestamp(timestamp)
  }, [])

  // ── Status ────────────────────────────────────────────────────────────────
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')

  // ── Chart bars via hook (REST + WebSocket auto-reconnect) ──────────────────
  const { bars, isLoading, error, livePrice } = useMarketData({ pauseWs: mode === 'replay' })
  const { wsStatus } = useMarketStore()
  const liveConnected = useLiveStore((s) => s.isConnected)

  // Poll engine connection status (every 10s) — checks both health and live feed
  const [rithmicConnected, setRithmicConnected] = useState(false)
  const [engineReachable, setEngineReachable] = useState(false)
  const [engineLatencyMs, setEngineLatencyMs] = useState<number | null>(null)
  const latencyMs = engineLatencyMs ?? 0
  useEffect(() => {
    // Exponentially-weighted moving average smooths out the occasional
    // browser connection-pool spikes during heavy initial-load traffic.
    let smoothed: number | null = null
    let inflight = false

    const check = async () => {
      if (inflight) return
      inflight = true
      const t0 = performance.now()
      try {
        const r = await fetch(`${engineUrl}/health`, { cache: 'no-store' })
        const sample = Math.round(performance.now() - t0)
        smoothed = smoothed == null ? sample : Math.round(smoothed * 0.6 + sample * 0.4)
        setEngineLatencyMs(smoothed)
        setEngineReachable(r.ok)
      } catch {
        setEngineReachable(false)
        setEngineLatencyMs(null)
        smoothed = null
      } finally {
        inflight = false
      }

      // Feed status is independent — failures don't tarnish the latency signal
      try {
        const r = await fetch(`${engineUrl}/api/live/status`, { cache: 'no-store' })
        if (r.ok) {
          const d = await r.json()
          setRithmicConnected(!!d?.rithmic_connected)
        }
      } catch {
        setRithmicConnected(false)
      }
    }

    // Delay first probe so it doesn't collide with the initial burst of
    // data/analysis fetches the page kicks off on mount.
    const bootTimer = window.setTimeout(check, 1_200)
    const id = window.setInterval(check, 10_000)
    return () => {
      window.clearTimeout(bootTimer)
      window.clearInterval(id)
    }
  }, [engineUrl])

  // Connected = engine reachable (REST) OR Rithmic live feed OR WS bar stream
  const isConnected = engineReachable || rithmicConnected || liveConnected || wsStatus === 'connected'
  const barsCount = bars.length

  // ── Analysis via hook (replaces 10 parallel fetches) ──────────────────────
  const {
    sessions: sessionData,
    confluence: confluenceData,
    patterns: patternsData,
    indicators: indicatorData,
    volume: volumeData,
    structure: structureDataRaw,
    config: tradingConfigRaw,
    bias: biasData,
    zones: zonesDataRaw,
    signals: signalsData,
    cum_delta: cumDeltaData,
    error: analysisError,
  } = useAnalysis(mode === 'replay' ? 1500 : 5000)

  // ── Setups via hook ────────────────────────────────────────────────────────
  const {
    setups: setupsList,
    isLoading: setupsLoading,
    error: setupsError,
  } = useSetups(market, timeframe, days, mode === 'replay' ? 1500 : 5000)

  // Cast untyped analysis results to expected types
  const structureData = structureDataRaw as StructureAPIData | null
  const tradingConfig = tradingConfigRaw as TradingConfig | null
  const zonesData = zonesDataRaw as { zones: unknown[] } | null

  // ── Track latency + last update from analysis polling ─────────────────────
  const lastBarTs = useMarketStore((s) => s.lastBarTs)
  useEffect(() => {
    if (lastBarTs == null) return
    const n = new Date()
    setLastUpdate(
      `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')}`,
    )
    // latency is now measured via engine health polling (engineLatencyMs)
  }, [lastBarTs])

  // ── Real-time session clock (ET, independent of API) ──────────────────────
  const sessionClock = useSessionClock()

  // ── Replay hook ────────────────────────────────────────────────────────────
  const replay = useReplay(market, timeframe)

  // ── Replay bars polling — fetches sim-visible bars during active replay ────
  // Keep polling while isPlaying (even when paused) so the chart stays populated.
  // Only clear bars when we leave replay mode entirely or stop the sim.
  useEffect(() => {
    if (mode !== 'replay' || !replay.isPlaying) {
      // Only clear bars if we're not in replay mode at all
      if (mode !== 'replay') {
        replayBarCountRef.current = 0
        setReplayBarsData([])
      }
      return
    }

    const fetchReplayBars = async () => {
      try {
        const r = await fetch(`${engineUrl}/api/bars?market=${market}&timeframe=${timeframe}`)
        if (r.ok) {
          const data = await r.json() as OHLCVBar[]
          // Only update if bar count actually changed (new bar arrived)
          if (data.length !== replayBarCountRef.current) {
            replayBarCountRef.current = data.length
            setReplayBarsData(data)
            if (data.length > 0) {
              useMarketStore.getState().setLastBarTs(data[data.length - 1].timestamp)
            }
          }
        }
      } catch {
        // Silently ignore — chart falls back to useMarketData bars
      }
    }

    // Poll faster when actively advancing, slower when paused
    const intervalMs = replay.isPaused ? 2000 : 500
    void fetchReplayBars()
    const interval = setInterval(() => void fetchReplayBars(), intervalMs)
    return () => clearInterval(interval)
  }, [mode, replay.isPlaying, replay.isPaused, market, timeframe, engineUrl])

  // ── Last bar close ─────────────────────────────────────────────────────────
  const lastClose = bars.at(-1)?.close

  // ── Current price: prefer live price when available, fall back to lastClose ──
  // livePrice + liveConnected are declared above (before isConnected)
  const currentPrice = livePrice ?? lastClose ?? null

  // ── Right panel toggle ────────────────────────────────────────────────────
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [hudVisible, setHudVisible] = useState(true)

  // ── Overlay toggle state ───────────────────────────────────────────────────
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(() => {
    const stored = useSettingsStore.getState().overlays
    const keys = Object.entries(stored)
      .filter(([, v]) => v)
      .map(([k]) => k as OverlayKey)
    return keys.length > 0 ? new Set<OverlayKey>(keys) : new Set<OverlayKey>(['vwap', 'ema', 'volume', 'vp'])
  })

  const handleToggleOverlay = useCallback((key: OverlayKey) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    // Keep settings store in sync so persisted overlays match local Set
    useSettingsStore.getState().toggleOverlay(key)
  }, [])

  // Sync activeOverlays from settings store when overlays change externally
  const storeOverlays = useSettingsStore((s) => s.overlays)
  useEffect(() => {
    const keys = (Object.entries(storeOverlays) as [OverlayKey, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k)
    setActiveOverlays(new Set<OverlayKey>(keys))
  }, [storeOverlays])

  // ── Fetch /api/markets once on mount → populate store ────────────────────
  useEffect(() => {
    fetch(`${engineUrl}/api/markets`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        if (!d) return
        const list = Array.isArray(d)
          ? (d as MarketInfo[])
          : Array.isArray((d as Record<string, unknown>).markets)
          ? ((d as Record<string, unknown>).markets as MarketInfo[])
          : null
        if (list) {
          storeSetMarkets(list)
        }
      })
      .catch(() => {
        // Optional endpoint — fall back to store defaults
      })
  }, [storeSetMarkets])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarketChange = useCallback(
    (next: string) => {
      storeSetMarket(next)
    },
    [storeSetMarket],
  )

  const handleTimeframeChange = useCallback(
    (displayTf: string) => {
      // Find internal timeframe key from display label
      const entry = (Object.entries(TF_DISPLAY) as [Timeframe, string][]).find(
        ([, label]) => label === displayTf,
      )
      const internalTf: Timeframe = entry ? entry[0] : (displayTf as Timeframe)
      storeSetTimeframe(internalTf)
    },
    [storeSetTimeframe],
  )

  // ── Sidebar navigation ─────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    async (id: ActivePage) => {
      if (id === 'replay') {
        setMode('replay')
        storeSetDataSource('replay')
        setActivePage('chart') // chart page with replay mode active
      } else if (id === 'settings') {
        setShowSettings(true)
        // Keep current page visible behind the settings overlay
      } else {
        if (id === 'chart' && mode === 'replay') {
          await replay.stop()
          setMode('live')
          storeSetDataSource('db')
          replayBarCountRef.current = 0
          setReplayBarsData([])
        }
        setActivePage(id)
      }
    },
    [mode, replay, storeSetDataSource],
  )

  // ── Derived HUD values ────────────────────────────────────────────────────
  const latestRvol = (volumeData as VolumeData | null)?.relative_volume?.at(-1)?.rvol ?? null
  const latestRsi = (indicatorData as IndicatorData | null)?.rsi?.at(-1)
  const latestEmaAlignment = (indicatorData as IndicatorData | null)?.ema?.at(-1)?.alignment ?? null
  const vwapPosition = deriveVwapPosition(indicatorData as IndicatorData | null, lastClose)

  // Latest VWAP level for BiasPanel price context
  const latestVwapLevel = (indicatorData as IndicatorData | null)?.vwap?.at(-1)?.vwap ?? null

  // Session open price for HUD price change (first bar of the session)
  const sessionOpenPrice = bars.length > 0 ? bars[0].open : null

  // Timestamp for staleness indicators — updated whenever analysis data refreshes
  const [analysisLastUpdateTs, setAnalysisLastUpdateTs] = useState<number | null>(null)
  useEffect(() => {
    if (biasData != null || signalsData != null) {
      setAnalysisLastUpdateTs(Date.now())
    }
  }, [biasData, signalsData])

  // Session display: clock is authoritative (always real-time).
  // API data may lag by up to one bar; the clock is always current.
  const hudSessionName = sessionClock.displayName

  // Detect session transitions for the HUD pulse animation
  const prevClockSessionRef = useRef<string>(sessionClock.session)
  const [sessionTransition, setSessionTransition] = useState(false)
  useEffect(() => {
    if (prevClockSessionRef.current !== sessionClock.session) {
      prevClockSessionRef.current = sessionClock.session
      setSessionTransition(true)
      const t = setTimeout(() => setSessionTransition(false), 3000)
      return () => clearTimeout(t)
    }
  }, [sessionClock.session])

  // Session badge in RightPanel header: also use clock
  const hudSessionBadge = useMemo(
    () => sessionClock.displayName,
    [sessionClock.displayName],
  )

  // ── Feed ──────────────────────────────────────────────────────────────────
  const feedItems = buildFeedItems(
    confluenceData as ConfluenceAPIData | null,
    volumeData as VolumeData | null,
    patternsData as PatternsAPIData | null,
    sessionData as SessionAPIData | null,
  )

  // ── Arctis AI context ─────────────────────────────────────────────────────
  const arctisPattern = (patternsData as PatternsAPIData | null)?.annotations.at(-1)?.pattern ?? undefined
  const arctisBias = (biasData as BiasData | null)?.bias_state?.state ?? undefined

  // ── Price (used in Topbar + document title; prefers live over lastClose) ───
  const price = currentPrice

  // ── Dynamic document title ─────────────────────────────────────────────────
  useEffect(() => {
    const priceStr = price != null ? ` ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
    document.title = `Arctis | ${symbol}${priceStr}`
  }, [symbol, price])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onToggleReplay: () => {
      if (mode === 'replay') {
        if (replay.isPlaying) {
          void replay.stop()
        } else {
          void replay.start()
        }
      }
    },
    isReplayActive: mode === 'replay',
    onSelectTimeframe: (idx) => {
      const tf = TIMEFRAMES[idx - 1]
      if (tf) {
        handleTimeframeChange(TF_DISPLAY[tf])
      }
    },
    onCloseSettings: () => setShowSettings(false),
    chartRef: chartApiRef,
  })

  // ── Market pill list (from API or static fallback) ────────────────────────
  const marketRoots: string[] =
    markets.length > 0
      ? (markets.map((m) => m.root).filter(Boolean))
      : ['ES', 'NQ', 'CL', 'GC', '6E']

  // ── Mode toggle handler ────────────────────────────────────────────────────
  const handleModeChange = useCallback(
    async (next: AppMode) => {
      setMode(next)
      if (next === 'live') {
        await replay.stop()
        storeSetDataSource('db')
        replayBarCountRef.current = 0
        setReplayBarsData([])
      } else if (next === 'replay') {
        storeSetDataSource('replay')
      }
    },
    [replay, storeSetDataSource],
  )

  // ── Replay time display ────────────────────────────────────────────────────
  const replayCurrentBar = replay.simStatus?.visible_bars ?? 0
  const replayTotalBars = replay.simStatus?.total_bars ?? 0
  const activeBarsForReplay =
    mode === 'replay' && replayBarsData.length > 0
      ? replayBarsData
      : bars
  const replayCurrentTime =
    replayCurrentBar > 0 && activeBarsForReplay.length > 0
      ? formatBarTimeET(activeBarsForReplay[Math.max(0, Math.min(replayCurrentBar - 1, activeBarsForReplay.length - 1))]?.timestamp ?? 0)
      : '--:--'
  const replayTotalTime =
    replayTotalBars > 0 && activeBarsForReplay.length > 0
      ? formatBarTimeET(activeBarsForReplay[activeBarsForReplay.length - 1]?.timestamp ?? 0)
      : '--:--'

  // chartBars: sim-filtered during replay (including when paused), full dataset in live mode
  const chartBars =
    mode === 'replay' && replayBarsData.length > 0
      ? replayBarsData
      : bars

  // ── Determine grid layout based on active page ────────────────────────────
  // Dashboard / Patterns: no right panel (52px sidebar + main area)
  // Chart / Replay: with right panel (52px sidebar + main + 280px right)
  const showRightPanel = activePage === 'chart' && rightPanelOpen
  const gridCols = showRightPanel ? '52px 1fr 300px' : '52px 1fr'

  // Sidebar's active item: replay maps to 'replay', otherwise use activePage
  const sidebarActive: ActivePage = mode === 'replay' ? 'replay' : activePage

  return (
    <div
      className={cn('h-screen overflow-hidden', mode === 'replay' && 'ring-1 ring-inset ring-[var(--color-accent)]/15')}
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gridTemplateRows: hudVisible ? '44px 32px 1fr 24px' : '44px 1fr 24px',
      }}
    >
      {/* Sidebar — col 1, all rows */}
      <div style={{ gridColumn: '1', gridRow: '1 / -1', overflow: 'hidden' }}>
        <Sidebar
          activeItem={sidebarActive}
          onNavigate={(id) => void handleNavigate(id)}
        />
      </div>

      {/* Topbar — col 2+, row 1 */}
      <div style={{ gridColumn: `2 / ${showRightPanel ? 4 : 3}`, gridRow: '1' }}>
        <Topbar
          markets={marketRoots}
          activeMarket={market}
          onMarketChange={handleMarketChange}
          activeTimeframe={TF_DISPLAY[timeframe] ?? timeframe}
          onTimeframeChange={handleTimeframeChange}
          currentPrice={price}
          isConnected={isConnected}
          liveFeed={liveConnected}
          onSettingsClick={() => setShowSettings(true)}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => setRightPanelOpen((v) => !v)}
          hudVisible={hudVisible}
          onToggleHud={() => setHudVisible(v => !v)}
        />
      </div>

      {/* HUD strip — col 2, row 2 */}
      {hudVisible && (
        <div style={{ gridColumn: '2', gridRow: '2' }}>
          <HudStrip
            rvol={latestRvol}
            rsi={latestRsi?.rsi ?? null}
            rsiDivergence={
              latestRsi?.divergence
                ? latestRsi.rsi < 30
                  ? 'bullish'
                  : latestRsi.rsi > 70
                    ? 'bearish'
                    : 'bullish'
                : null
            }
            emaAlignment={latestEmaAlignment}
            vwapPosition={vwapPosition}
            sessionName={hudSessionName}
            sessionProgress={sessionClock.progress}
            sessionTransition={sessionTransition}
            barCount={barsCount > 0 ? barsCount : null}
            currentPrice={currentPrice}
            sessionOpenPrice={sessionOpenPrice}
          />
        </div>
      )}

      {/* Mode toggle — col 3, row 2 — only when right panel is visible */}
      {showRightPanel && (
        <div
          className="flex items-center justify-end px-3 gap-0.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/95"
          style={{ gridColumn: '3', gridRow: hudVisible ? '2' : '1' }}
        >
          {(['live', 'replay'] as AppMode[]).map((m) => (
            <button
              key={m}
              onClick={() => void handleModeChange(m)}
              className={cn(
                'px-2 py-0.5 rounded',
                'font-mono text-[10px] leading-none uppercase tracking-wide',
                'transition-colors duration-100',
                'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
                mode === m
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Main content area — col 2, row 3 */}
      <div style={{ gridColumn: '2', gridRow: hudVisible ? '3' : '2', minHeight: 0 }} className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            className="h-full min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {activePage === 'dashboard' && (
              <DashboardPage
                onNavigateToChart={() => setActivePage('chart')}
                onOpenInWorkspace={(root) => {
                  storeSetMarket(root)
                  setActivePage('chart')
                }}
              />
            )}

            {activePage === 'chart' && (
              <ChartPage
                symbol={symbol}
                timeframe={timeframe}
                chartBars={chartBars}
                isLoading={isLoading}
                isConnected={isConnected}
                error={error}
                activeOverlays={activeOverlays}
                onToggleOverlay={handleToggleOverlay}
                indicatorData={indicatorData ? { ...(indicatorData as IndicatorData), cum_delta: cumDeltaData ?? undefined } : null}
                structureBreaks={structureData?.structure_breaks}
                patternAnnotations={(patternsData as PatternsAPIData | null)?.annotations}
                zones={zonesData?.zones}
                scrollToTimestamp={scrollToTimestamp}
                onChartReady={handleChartReady}
                signals={(signalsData as any)?.signals}
                setups={setupsList}
                mode={mode}
                replay={replay}
                replayCurrentTime={replayCurrentTime}
                replayTotalTime={replayTotalTime}
              />
            )}

            {activePage === 'patterns' && (
              <PatternsPage data={patternsData as PatternsAPIData | null} />
            )}

            {activePage === 'engine' && (
              <EngineOverviewPage onNavigateToChart={() => setActivePage('chart')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right panel — col 3, rows 2-3 — only when chart page is active */}
      {showRightPanel && (
        <div style={{ gridColumn: '3', gridRow: hudVisible ? '3' : '2', minHeight: 0, overflow: 'hidden' }}>
          <RightPanel onClose={() => setRightPanelOpen(false)}>
          <RightPanelSection
            title="Setups"
            accent="ice"
            count={setupsList.filter(s => !['invalidated','expired','stopped','completed','exited'].includes(s.status)).length || undefined}
          >
            <SetupLifecyclePanel
              setups={setupsList}
              isLoading={setupsLoading}
              error={setupsError}
              lastUpdateTs={analysisLastUpdateTs}
            />
          </RightPanelSection>

          <RightPanelDivider />

          {/* Signals: show L/S breakdown or "0" when loaded with no signals */}
          <RightPanelSection
            title="Signals"
            accent="ice"
            count={
              (signalsData as SignalsAPIData | null) != null
                ? ((signalsData as SignalsAPIData).signals.length > 0
                    ? `${(signalsData as SignalsAPIData).signals.filter(s => s.direction === 'long').length}L · ${(signalsData as SignalsAPIData).signals.filter(s => s.direction === 'short').length}S`
                    : '0')
                : undefined
            }
          >
            {signalsData == null ? <PanelSkeleton lines={4} label="Connecting..." /> : <SignalsPanel data={{
              ...(signalsData as SignalsAPIData),
              // Override bias from the dedicated bias endpoint (more accurate with live price)
              bias: (biasData as any)?.bias_state?.state ?? (signalsData as any)?.bias ?? 'RANGE',
              bias_score: (biasData as any)?.bias_state?.score ?? (signalsData as any)?.bias_score ?? 0,
            }} lastUpdateTs={analysisLastUpdateTs} />}
          </RightPanelSection>

          <RightPanelDivider />

          {/* Confluence: show signal count in badge — directly after Signals for quick scanning */}
          <RightPanelSection
            title="Confluence"
            accent="ice"
            count={
              (confluenceData as ConfluenceAPIData | null) != null
                ? ((confluenceData as ConfluenceAPIData).signals?.length ?? 0)
                : undefined
            }
          >
            {confluenceData == null ? <PanelSkeleton lines={5} label="Connecting..." /> : <ConfluencePanel data={confluenceData as ConfluenceAPIData} />}
          </RightPanelSection>

          <RightPanelDivider />

          {/* Bias: show state label in badge */}
          <RightPanelSection
            title="Bias"
            accent="ice"
            count={
              (biasData as BiasData | null) != null
                ? ((biasData as BiasData).bias_state?.state?.toUpperCase() ?? undefined)
                : undefined
            }
          >
            {biasData == null ? <PanelSkeleton lines={6} label="Connecting..." /> : <BiasPanel data={biasData as BiasData} currentPrice={currentPrice} vwapLevel={latestVwapLevel} lastUpdateTs={analysisLastUpdateTs} />}
          </RightPanelSection>

          <RightPanelDivider />

          {/* Session: badge always uses clock (real-time), panel uses merged data */}
          <RightPanelSection
            title="Session"
            accent="ice"
            count={hudSessionBadge}
          >
            <SessionPanel data={sessionData as SessionAPIData | null} />
          </RightPanelSection>

          <RightPanelDivider />

          {/* Feed: collapsible, shows count of recent events */}
          <RightPanelSection
            title="Feed"
            count={feedItems.length > 0 ? feedItems.length : undefined}
            defaultCollapsed
          >
            <FeedPanel
              items={feedItems.length > 0 ? feedItems : undefined}
              onItemClick={handleFeedItemClick}
              relativeTimestamps
            />
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection title="Risk" defaultCollapsed>
            <RiskPanel config={tradingConfig ?? undefined} />
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection title="Arctis AI" defaultCollapsed>
            <ArctisPanel
              currentPattern={arctisPattern}
              currentBias={arctisBias}
              currentPrice={currentPrice ?? undefined}
            />
          </RightPanelSection>
          </RightPanel>
        </div>
      )}

      {/* StatusBar — last row, all columns */}
      <div style={{ gridColumn: '1 / -1', gridRow: '-1' }}>
        <StatusBar
          connected={isConnected}
          latencyMs={latencyMs}
          barsLoaded={barsCount}
          lastUpdate={lastUpdate}
          liveFeed={liveConnected}
          liveProvider={liveConnected ? 'rithmic' : null}
          replay={
            mode === 'replay' && replay.simStatus
              ? {
                  active: replay.simStatus.active,
                  progress_pct: replay.simStatus.progress_pct,
                  current_date: replay.simStatus.current_date,
                }
              : null
          }
          errorMessage={error || analysisError || null}
        />
      </div>

      {/* Settings slide-over panel — fixed overlay, always available */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        activeOverlays={activeOverlays}
        onToggleOverlay={handleToggleOverlay}
        connectionStatus={{
          connected: isConnected,
          latencyMs,
          barsLoaded: barsCount,
        }}
        tradingConfig={tradingConfig}
        onConfigSaved={(saved) => {
          void saved
          setShowSettings(false)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}

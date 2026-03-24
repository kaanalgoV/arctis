import { useState, useEffect, useCallback, useRef } from 'react'
import { useMarketData } from '@/hooks/useMarketData'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useReplay } from '@/hooks/useReplay'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMarketStore } from '@/store/market'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { HudStrip } from '@/components/layout/HudStrip'
import { StatusBar } from '@/components/layout/StatusBar'
import { RightPanelSection, RightPanelDivider } from '@/components/layout/RightPanel'
import {
  SessionPanel,
  ConfluencePanel,
  FeedPanel,
  RiskPanel,
  BiasPanel,
  ArctisPanel,
  SignalsPanel,
  StrategyLibrary,
} from '@/components/panels'
import type { ConfluenceAPIData } from '@/components/panels/ConfluencePanel'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'
import type { SessionAPIData } from '@/components/panels/SessionPanel'
import type { FeedItem } from '@/components/panels/FeedPanel'
import type { BiasData } from '@/components/panels/BiasPanel'
import type { SignalsAPIData } from '@/components/panels/SignalsPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import type { ChartZone } from '@/components/charts/SimpleChart'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import { useDrawings } from '@/hooks/useDrawings'
import type { OHLCVBar } from '@/types/market'
import type { IndicatorData, VolumeData, TradingConfig } from '@/types/analysis'
import { TF_DISPLAY, TIMEFRAMES } from '@/types/contracts'
import type { Timeframe, MarketInfo } from '@/types/contracts'
import { PanelSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { IChartApi } from 'lightweight-charts'
import { DashboardPage } from '@/pages/DashboardPage'
import { ChartPage } from '@/pages/ChartPage'
import { PatternsPage } from '@/pages/PatternsPage'
import { useSettingsStore } from '@/store/settings'

const SESSION_DISPLAY: Record<string, string> = {
  pre_market: 'Pre-Mkt',
  premarket: 'Pre-Mkt',
  ny_open: 'NY Open',
  midday: 'Midday',
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
type ActivePage = 'dashboard' | 'chart' | 'patterns' | 'replay' | 'settings'

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

export default function App() {
  // ── Zustand store ──────────────────────────────────────────────────────────
  const {
    market,
    symbol,
    timeframe,
    markets,
    setMarket: storeSetMarket,
    setTimeframe: storeSetTimeframe,
    setMarkets: storeSetMarkets,
  } = useMarketStore()

  // ── Settings store — engineUrl used for direct fetch calls in App ─────────
  const engineUrl = useSettingsStore((s) => s.engineUrl)

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
  const [activeStrategyCount, setActiveStrategyCount] = useState<number | undefined>(undefined)

  // ── Drawing state ─────────────────────────────────────────────────────────
  const { drawings, activeTool, setActiveTool, addDrawing, clearDrawings } =
    useDrawings(symbol, timeframe)

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

  // ── Chart click → create drawing ───────────────────────────────────────────
  const handleChartClick = useCallback(
    (price: number, timestamp: number) => {
      if (!activeTool) return
      if (activeTool === 'hline') {
        addDrawing('hline', { price })
        setActiveTool(null)
      }
      void timestamp
    },
    [activeTool, addDrawing, setActiveTool],
  )

  // ── Status ────────────────────────────────────────────────────────────────
  const [latencyMs, setLatencyMs] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')

  // ── Chart bars via hook (REST + WebSocket auto-reconnect) ──────────────────
  const { bars, isLoading, error } = useMarketData({ pauseWs: mode === 'replay' })
  const { wsStatus } = useMarketStore()
  const isConnected = wsStatus === 'connected'
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
  } = useAnalysis(mode === 'replay' ? 1500 : 5000)

  // Cast untyped analysis results to expected types
  const structureData = structureDataRaw as StructureAPIData | null
  const tradingConfig = tradingConfigRaw as TradingConfig | null
  const zonesData = zonesDataRaw as { zones: ChartZone[] } | null

  // ── Track latency + last update from analysis polling ─────────────────────
  const lastBarTs = useMarketStore((s) => s.lastBarTs)
  useEffect(() => {
    if (lastBarTs == null) return
    const n = new Date()
    setLastUpdate(
      `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')}`,
    )
    setLatencyMs(0) // latency is not measured separately anymore
  }, [lastBarTs])

  // ── Replay hook ────────────────────────────────────────────────────────────
  const replay = useReplay(market, timeframe)

  // ── Replay bars polling — fetches sim-visible bars during active replay ────
  useEffect(() => {
    if (mode !== 'replay' || !replay.isPlaying) {
      replayBarCountRef.current = 0
      setReplayBarsData([])
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

    void fetchReplayBars()
    const interval = setInterval(() => void fetchReplayBars(), 1000)
    return () => clearInterval(interval)
  }, [mode, replay.isPlaying, market, timeframe])

  // ── Last bar close ─────────────────────────────────────────────────────────
  const lastClose = bars.at(-1)?.close

  // ── Overlay toggle state ───────────────────────────────────────────────────
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(
    () => new Set<OverlayKey>(['vwap', 'ema', 'volume', 'vp'])
  )

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
  }, [])

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
        setActivePage('chart') // chart page with replay mode active
      } else if (id === 'settings') {
        setShowSettings(true)
        // Keep current page visible behind the settings overlay
      } else {
        if (id === 'chart' && mode === 'replay') {
          await replay.stop()
          setMode('live')
        }
        setActivePage(id)
      }
    },
    [mode, replay],
  )

  // ── Derived HUD values ────────────────────────────────────────────────────
  const latestRvol = (volumeData as VolumeData | null)?.relative_volume?.at(-1)?.rvol ?? null
  const latestRsi = (indicatorData as IndicatorData | null)?.rsi?.at(-1)
  const latestEmaAlignment = (indicatorData as IndicatorData | null)?.ema?.at(-1)?.alignment ?? null
  const vwapPosition = deriveVwapPosition(indicatorData as IndicatorData | null, lastClose)
  const hudSessionName = sessionData
    ? (SESSION_DISPLAY[(sessionData as SessionAPIData).current_session] ?? (sessionData as SessionAPIData).current_session)
    : null

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

  // ── Price ─────────────────────────────────────────────────────────────────
  const price = lastClose ?? null

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
      }
    },
    [replay],
  )

  // ── Replay time display ────────────────────────────────────────────────────
  const replayCurrentBar = replay.simStatus?.visible_bars ?? 0
  const replayTotalBars = replay.simStatus?.total_bars ?? 0
  const activeBarsForReplay =
    mode === 'replay' && replay.isPlaying && replayBarsData.length > 0
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

  // chartBars: sim-filtered during replay, full dataset in live mode
  const chartBars =
    mode === 'replay' && replay.isPlaying && replayBarsData.length > 0
      ? replayBarsData
      : bars

  // ── Determine grid layout based on active page ────────────────────────────
  // Dashboard / Patterns: no right panel (52px sidebar + main area)
  // Chart / Replay: with right panel (52px sidebar + main + 280px right)
  const showRightPanel = activePage === 'chart'
  const gridCols = showRightPanel ? '52px 1fr 280px' : '52px 1fr'

  // Sidebar's active item: replay maps to 'replay', otherwise use activePage
  const sidebarActive: ActivePage = mode === 'replay' ? 'replay' : activePage

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gridTemplateRows: '48px 28px 1fr 24px',
      }}
    >
      {/* Sidebar — col 1, all rows */}
      <div style={{ gridColumn: '1', gridRow: '1 / -1' }}>
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
          onSettingsClick={() => setShowSettings(true)}
        />
      </div>

      {/* HUD strip — col 2, row 2 */}
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
          barCount={barsCount > 0 ? barsCount : null}
        />
      </div>

      {/* Mode toggle — col 3, row 2 — only when right panel is visible */}
      {showRightPanel && (
        <div
          className="flex items-center justify-end px-3 gap-0.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/95"
          style={{ gridColumn: '3', gridRow: '2' }}
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
      <div style={{ gridColumn: '2', gridRow: '3' }} className="overflow-hidden">
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
            chartBars={chartBars}
            isLoading={isLoading}
            isConnected={isConnected}
            error={error}
            activeOverlays={activeOverlays}
            onToggleOverlay={handleToggleOverlay}
            indicatorData={indicatorData as IndicatorData | null}
            structureBreaks={structureData?.structure_breaks}
            patternAnnotations={(patternsData as PatternsAPIData | null)?.annotations}
            zones={zonesData?.zones}
            drawings={drawings}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onClearDrawings={clearDrawings}
            onChartClick={activeTool ? handleChartClick : undefined}
            scrollToTimestamp={scrollToTimestamp}
            onChartReady={handleChartReady}
            signals={(signalsData as any)?.signals}
            mode={mode}
            replay={replay}
            replayCurrentTime={replayCurrentTime}
            replayTotalTime={replayTotalTime}
          />
        )}

        {activePage === 'patterns' && (
          <PatternsPage data={patternsData as PatternsAPIData | null} />
        )}
      </div>

      {/* Right panel — col 3, rows 2-3 — only when chart page is active */}
      {showRightPanel && (
        <div
          className="border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/95 overflow-y-auto"
          style={{ gridColumn: '3', gridRow: '3' }}
        >
          <RightPanelSection
            title="Signals"
            accent="ice"
            count={(signalsData as SignalsAPIData | null)?.signals.length ?? undefined}
          >
            {signalsData == null ? <PanelSkeleton /> : <SignalsPanel data={signalsData as SignalsAPIData} />}
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection title="Session" accent="ice" count={(sessionData as SessionAPIData | null)?.bar_count}>
            {sessionData == null ? <PanelSkeleton /> : <SessionPanel data={sessionData as SessionAPIData} />}
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection title="Confluence" accent="ice">
            {confluenceData == null ? <PanelSkeleton /> : <ConfluencePanel data={confluenceData as ConfluenceAPIData} />}
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection title="Bias" accent="profit">
            {biasData == null ? <PanelSkeleton /> : <BiasPanel data={biasData as BiasData} />}
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection
            title="Strategies"
            accent="warning"
            count={activeStrategyCount}
          >
            <StrategyLibrary onActiveCountChange={setActiveStrategyCount} />
          </RightPanelSection>

          <RightPanelDivider />

          <RightPanelSection
            title="Feed"
            count={feedItems.length > 0 ? feedItems.length : undefined}
            defaultCollapsed
          >
            <FeedPanel
              items={feedItems.length > 0 ? feedItems : undefined}
              onItemClick={handleFeedItemClick}
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
            />
          </RightPanelSection>
        </div>
      )}

      {/* StatusBar — col 1 to end, last row */}
      <div style={{ gridColumn: '1 / -1', gridRow: '4' }}>
        <StatusBar
          connected={isConnected}
          latencyMs={latencyMs}
          barsLoaded={barsCount}
          lastUpdate={lastUpdate}
          replay={
            mode === 'replay' && replay.simStatus
              ? {
                  active: replay.simStatus.active,
                  progress_pct: replay.simStatus.progress_pct,
                  current_date: replay.simStatus.current_date,
                }
              : null
          }
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

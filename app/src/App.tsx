import { useState, useEffect, useCallback, useRef } from 'react'
import { useMarketData } from '@/hooks/useMarketData'
import { useReplay } from '@/hooks/useReplay'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { HudStrip } from '@/components/layout/HudStrip'
import { StatusBar } from '@/components/layout/StatusBar'
import { RightPanelSection, RightPanelDivider } from '@/components/layout/RightPanel'
import {
  SessionPanel,
  ConfluencePanel,
  PatternsPanel,
  FeedPanel,
  RiskPanel,
  BiasPanel,
  TravisPanel,
} from '@/components/panels'
import type { ConfluenceAPIData } from '@/components/panels/ConfluencePanel'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'
import type { SessionAPIData } from '@/components/panels/SessionPanel'
import type { FeedItem } from '@/components/panels/FeedPanel'
import type { BiasData } from '@/components/panels/BiasPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { SimpleChart } from '@/components/charts/SimpleChart'
import { ChartToolbar } from '@/components/charts/ChartToolbar'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import { DrawingToolbar } from '@/components/charts/DrawingToolbar'
import { useDrawings } from '@/hooks/useDrawings'
import type { Market, Timeframe } from '@/types/market'
import type { IndicatorData, VolumeData, TradingConfig } from '@/types/analysis'
import { ReplayBar } from '@/components/replay/ReplayBar'
import { PanelSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { IChartApi } from 'lightweight-charts'

const ENGINE_URL = 'http://127.0.0.1:8001'
const POLL_INTERVAL_MS = 5000

// Timeframe display label mapping (internal value -> topbar display)
const TF_TO_DISPLAY: Record<string, string> = {
  '1min': '1m',
  '5min': '5m',
}

// Topbar display -> internal Timeframe
const DISPLAY_TO_TF: Record<string, string> = {
  '1m': '1min',
  '5m': '5min',
}

// Static fallback symbol map: market root -> front-month contract
const SYMBOL_MAP: Record<string, string> = {
  NQ: 'NQH6',
  ES: 'ESZ5',
  CL: 'CLJ6',
  GC: 'GCJ6',
  '6E': '6EH6',
  '6J': '6JH6',
}

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

interface MarketInfo {
  symbol: string
  root: string
  description?: string
}

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

function resolveSymbol(root: string, markets: MarketInfo[]): string {
  const found = markets.find(
    (m) => m.root === root || m.symbol.startsWith(root),
  )
  if (found) return found.symbol
  return SYMBOL_MAP[root] ?? `${root}H6`
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
  // ── Mode ───────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AppMode>('live')

  // ── Core selectors ─────────────────────────────────────────────────────────
  const [market, setMarket] = useState<Market>('NQ')
  const [symbol, setSymbol] = useState<string>('NQH6')
  const [timeframe, setTimeframe] = useState<Timeframe>('1min')
  const days = 30

  // ── Markets list from API ──────────────────────────────────────────────────
  const [markets, setMarkets] = useState<MarketInfo[]>([])

  // ── Analysis slices ────────────────────────────────────────────────────────
  const [sessionData, setSessionData] = useState<SessionAPIData | null>(null)
  const [confluenceData, setConfluenceData] = useState<ConfluenceAPIData | null>(null)
  const [patternsData, setPatternsData] = useState<PatternsAPIData | null>(null)
  const [indicatorData, setIndicatorData] = useState<IndicatorData | null>(null)
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null)
  const [tradingConfig, setTradingConfig] = useState<TradingConfig | null>(null)
  const [structureData, setStructureData] = useState<StructureAPIData | null>(null)
  const [biasData, setBiasData] = useState<BiasData | null>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false)

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
        // Deselect tool after placing
        setActiveTool(null)
      }
      // rectangle / trendline / text are P2 — require two-click interaction
      void timestamp // used in future two-click tools
    },
    [activeTool, addDrawing, setActiveTool],
  )

  // ── Status ────────────────────────────────────────────────────────────────
  const [latencyMs, setLatencyMs] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')

  // ── Chart bars via hook (REST + WebSocket auto-reconnect) ──────────────────
  const { bars, isLoading, isConnected, error, barsCount } = useMarketData(symbol, days)

  // ── Replay hook ────────────────────────────────────────────────────────────
  const replay = useReplay(market, timeframe)

  // ── Last bar close ─────────────────────────────────────────────────────────
  const lastClose = bars.at(-1)?.close

  // ── Poll interval ref ──────────────────────────────────────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Overlay toggle state ───────────────────────────────────────────────────
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(
    () => new Set<OverlayKey>(['vwap', 'ema', 'volume'])
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

  // ── Fetch /api/markets once on mount ──────────────────────────────────────
  useEffect(() => {
    fetch(`${ENGINE_URL}/api/markets`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        if (!d) return
        const list = Array.isArray(d)
          ? (d as MarketInfo[])
          : Array.isArray((d as Record<string, unknown>).markets)
          ? ((d as Record<string, unknown>).markets as MarketInfo[])
          : null
        if (list) setMarkets(list)
      })
      .catch(() => {
        // Optional endpoint — fall back to SYMBOL_MAP
      })
  }, [])

  // ── Analysis fetcher (memoised so useEffect dep is stable per market/tf) ──
  const fetchAnalysis = useCallback(async () => {
    const t0 = performance.now()
    const base = `${ENGINE_URL}/api/analysis`
    const qs = `market=${market}&timeframe=${timeframe}`

    const [sessR, confR, patR, indR, volR, cfgR, strR, biasR] = await Promise.allSettled([
      fetch(`${base}/sessions?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/confluence?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/patterns?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/indicators?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/volume?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${ENGINE_URL}/api/config`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/structure?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${ENGINE_URL}/api/analysis/bias?${qs}`).then((r) => (r.ok ? r.json() : null)),
    ])

    if (sessR.status === 'fulfilled' && sessR.value)
      setSessionData(sessR.value as SessionAPIData)
    if (confR.status === 'fulfilled' && confR.value)
      setConfluenceData(confR.value as ConfluenceAPIData)
    if (patR.status === 'fulfilled' && patR.value)
      setPatternsData(patR.value as PatternsAPIData)
    if (indR.status === 'fulfilled' && indR.value)
      setIndicatorData(indR.value as IndicatorData)
    if (volR.status === 'fulfilled' && volR.value)
      setVolumeData(volR.value as VolumeData)
    if (cfgR.status === 'fulfilled' && cfgR.value)
      setTradingConfig(cfgR.value as TradingConfig)
    if (strR.status === 'fulfilled' && strR.value)
      setStructureData(strR.value as StructureAPIData)
    if (biasR.status === 'fulfilled' && biasR.value)
      setBiasData(biasR.value as BiasData)

    setLatencyMs(Math.round(performance.now() - t0))
    const n = new Date()
    setLastUpdate(
      `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')}`,
    )
  }, [market, timeframe])

  // ── Start polling whenever market or timeframe change ──────────────────────
  useEffect(() => {
    void fetchAnalysis()
    pollRef.current = setInterval(() => void fetchAnalysis(), POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [fetchAnalysis])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarketChange = useCallback(
    (next: Market) => {
      setMarket(next)
      setSymbol(resolveSymbol(next, markets))
      // Clear stale analysis while new poll fires
      setSessionData(null)
      setConfluenceData(null)
      setPatternsData(null)
      setIndicatorData(null)
      setVolumeData(null)
      setStructureData(null)
      setBiasData(null)
    },
    [markets],
  )

  const handleTimeframeChange = useCallback((displayTf: string) => {
    const internalTf = (DISPLAY_TO_TF[displayTf] ?? displayTf) as Timeframe
    setTimeframe(internalTf)
  }, [])

  // ── Derived HUD values ────────────────────────────────────────────────────
  const latestRvol = volumeData?.relative_volume?.at(-1)?.rvol ?? null
  const latestRsi = indicatorData?.rsi?.at(-1)
  const latestEmaAlignment = indicatorData?.ema?.at(-1)?.alignment ?? null
  const vwapPosition = deriveVwapPosition(indicatorData, lastClose)
  const hudSessionName = sessionData
    ? (SESSION_DISPLAY[sessionData.current_session] ?? sessionData.current_session)
    : null

  // ── Feed ──────────────────────────────────────────────────────────────────
  const feedItems = buildFeedItems(confluenceData, volumeData, patternsData, sessionData)

  // ── Travis context ────────────────────────────────────────────────────────
  const travisPattern = patternsData?.annotations.at(-1)?.pattern ?? undefined
  const travisBias = biasData?.bias_state?.state ?? undefined

  // ── Price (must be declared before useEffect that references it) ──────────
  const price = lastClose ?? null

  // ── Dynamic document title ─────────────────────────────────────────────────
  useEffect(() => {
    const priceStr = price != null ? ` ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
    document.title = `Arctis | ${symbol}${priceStr}`
  }, [symbol, price])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  // Timeframe labels in order for keys 1-5
  const timeframeKeys = ['1min', '5min', '15min', '30min', '1h'] as const
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
      const tf = timeframeKeys[idx - 1]
      if (tf) {
        handleTimeframeChange(TF_TO_DISPLAY[tf] ?? tf)
      }
    },
    onCloseSettings: () => setShowSettings(false),
    chartRef: chartApiRef,
  })

  // ── Market pill list (from API or static fallback) ────────────────────────
  const marketRoots: Market[] =
    markets.length > 0
      ? (markets.map((m) => m.root).filter(Boolean) as Market[])
      : (['ES', 'NQ', 'CL', 'GC', '6E'] as Market[])

  // ── Mode toggle handler ────────────────────────────────────────────────────
  const handleModeChange = useCallback(
    async (next: AppMode) => {
      setMode(next)
      if (next === 'live') {
        // Stop any running replay when switching back to live
        await replay.stop()
      }
    },
    [replay],
  )

  // ── Replay time display ────────────────────────────────────────────────────
  // Current bar ET time from sim status
  const replayCurrentBar = replay.simStatus?.visible_bars ?? 0
  const replayTotalBars = replay.simStatus?.total_bars ?? 0
  const replayBars = bars // bars are already filtered by sim on backend when active
  const replayCurrentTime =
    replayCurrentBar > 0 && replayBars.length > 0
      ? formatBarTimeET(replayBars[Math.min(replayCurrentBar - 1, replayBars.length - 1)]?.timestamp ?? 0)
      : '--:--'
  const replayTotalTime =
    replayTotalBars > 0 && replayBars.length > 0
      ? formatBarTimeET(replayBars[replayBars.length - 1]?.timestamp ?? 0)
      : '--:--'

  // ── Derive session_levels for SimpleChart (only numeric values) ────────────
  const sessionLevelsForChart =
    indicatorData?.session_levels &&
    indicatorData.session_levels.prev_high != null &&
    indicatorData.session_levels.prev_low != null &&
    indicatorData.session_levels.prev_close != null
      ? {
          prev_high: indicatorData.session_levels.prev_high as number,
          prev_low: indicatorData.session_levels.prev_low as number,
          prev_close: indicatorData.session_levels.prev_close as number,
          opening_range_high: (indicatorData.session_levels.opening_range_high ?? 0) as number,
          opening_range_low: (indicatorData.session_levels.opening_range_low ?? 0) as number,
        }
      : null

  // Grid rows: topbar | hud | chart | [replaybar?] | statusbar
  const gridRows = mode === 'replay'
    ? '48px 28px 1fr 32px 24px'
    : '48px 28px 1fr 24px'

  // Row index for right panel (spans hud + chart + optional replay row)
  const rightPanelRowEnd = mode === 'replay' ? 5 : 4
  // Row index for statusbar
  const statusBarRow = mode === 'replay' ? 5 : 4

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr 280px',
        gridTemplateRows: gridRows,
      }}
    >
      {/* Sidebar — col 1, all rows */}
      <div style={{ gridColumn: '1', gridRow: '1 / -1' }}>
        <Sidebar
          defaultActive={mode === 'replay' ? 'replay' : 'chart'}
          onNavigate={(id) => {
            if (id === 'replay') setMode('replay')
            else if (id === 'chart' || id === 'dashboard') setMode('live')
            else if (id === 'settings') setShowSettings(true)
          }}
        />
      </div>

      {/* Topbar — col 2-3, row 1 */}
      <div style={{ gridColumn: '2 / 4', gridRow: '1' }}>
        <Topbar
          markets={marketRoots}
          activeMarket={market}
          onMarketChange={handleMarketChange}
          activeTimeframe={TF_TO_DISPLAY[timeframe] ?? timeframe}
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
          rsiDivergence={latestRsi?.divergence ? 'bullish' : null}
          emaAlignment={latestEmaAlignment}
          vwapPosition={vwapPosition}
          sessionName={hudSessionName}
          barCount={barsCount > 0 ? barsCount : null}
        />
      </div>

      {/* Mode toggle — col 3, row 2 (replaces right panel header area) */}
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
                ? m === 'replay'
                  ? 'bg-[#5CB8F0]/15 text-[#5CB8F0]'
                  : 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Chart — col 2, row 3 */}
      <div
        className="bg-[var(--color-surface-base)] relative overflow-hidden"
        style={{ gridColumn: '2', gridRow: '3', display: 'flex', flexDirection: 'column' }}
      >
        {/* Chart toolbar */}
        <ChartToolbar
          symbol={symbol}
          activeOverlays={activeOverlays}
          onToggleOverlay={handleToggleOverlay}
        />

        {/* Chart body */}
        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-sm text-[var(--color-loss)]">{error}</span>
            </div>
          ) : isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-sm text-[var(--color-text-muted)] animate-pulse tabular-nums">
                Loading {symbol}...
              </span>
            </div>
          ) : bars.length > 0 ? (
            <>
              <SimpleChart
                bars={bars}
                className="w-full h-full"
                vwapData={indicatorData?.vwap}
                emaData={indicatorData?.ema}
                volumeProfile={indicatorData?.volume_profile}
                sessionLevels={sessionLevelsForChart}
                structureBreaks={structureData?.structure_breaks}
                patternAnnotations={patternsData?.annotations}
                showVwap={activeOverlays.has('vwap')}
                showEma={activeOverlays.has('ema')}
                showVp={activeOverlays.has('vp')}
                showLevels={activeOverlays.has('levels')}
                onChartReady={handleChartReady}
                scrollToTimestamp={scrollToTimestamp}
                drawings={drawings}
                onChartClick={activeTool ? handleChartClick : undefined}
              />
              <DrawingToolbar
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                onClear={clearDrawings}
                drawingCount={drawings.length}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-sm text-[var(--color-text-muted)]">No data</span>
            </div>
          )}
        </div>
      </div>

      {/* Replay bar — col 2, row 4 — only in replay mode */}
      {mode === 'replay' && (
        <div style={{ gridColumn: '2', gridRow: '4' }}>
          <ReplayBar
            isPlaying={replay.isPlaying}
            speed={replay.speed}
            progress={replay.progress}
            currentTime={replayCurrentTime}
            totalTime={replayTotalTime}
            date={replay.replayDate ?? ''}
            onPlay={() => void replay.start()}
            onPause={() => void replay.stop()}
            onSpeedChange={(s) => {
              replay.setSpeed(s)
              // Restart with new speed if already playing
              if (replay.isPlaying) void replay.start()
            }}
            onSeek={replay.seek}
            onDateChange={replay.changeDate}
          />
        </div>
      )}

      {/* Right panel — col 3, rows 2-4 (or 2-3 in live mode) */}
      <div
        className="border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/95 overflow-y-auto"
        style={{ gridColumn: '3', gridRow: `3 / ${rightPanelRowEnd}` }}
      >
        <RightPanelSection title="Session" count={sessionData?.bar_count}>
          <div className="px-3 pb-3">
            {sessionData == null ? <PanelSkeleton /> : <SessionPanel data={sessionData} />}
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection title="Confluence">
          <div className="px-3 pb-3">
            {confluenceData == null ? <PanelSkeleton /> : <ConfluencePanel data={confluenceData} />}
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection title="Bias" count={biasData ? 1 : undefined}>
          <div className="px-3 pb-3">
            {biasData == null ? <PanelSkeleton /> : <BiasPanel data={biasData} />}
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection
          title="Patterns"
          count={patternsData?.annotations.length ?? undefined}
        >
          <div className="px-3 pb-3">
            {patternsData == null ? <PanelSkeleton /> : <PatternsPanel data={patternsData} />}
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection
          title="Feed"
          count={feedItems.length > 0 ? feedItems.length : undefined}
        >
          <div className="px-3 pb-3">
            <FeedPanel
              items={feedItems.length > 0 ? feedItems : undefined}
              onItemClick={handleFeedItemClick}
            />
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection title="Risk">
          <div className="px-3 pb-3">
            <RiskPanel config={tradingConfig ?? undefined} />
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection title="Travis">
          <div className="px-3 pb-3">
            <TravisPanel
              currentPattern={travisPattern}
              currentBias={travisBias}
            />
          </div>
        </RightPanelSection>
      </div>

      {/* StatusBar — col 1-3, last row */}
      <div style={{ gridColumn: '1 / -1', gridRow: statusBarRow }}>
        <StatusBar
          connected={isConnected}
          latencyMs={latencyMs}
          barsLoaded={barsCount}
          lastUpdate={lastUpdate}
        />
      </div>

      {/* Settings slide-over panel — rendered outside grid, fixed position */}
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
          setTradingConfig(saved as TradingConfig)
          setShowSettings(false)
        }}
      />
    </div>
  )
}

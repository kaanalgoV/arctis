import { useState, useEffect, useCallback, useRef } from 'react'
import { useMarketData } from '@/hooks/useMarketData'
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
} from '@/components/panels'
import type { ConfluenceAPIData } from '@/components/panels/ConfluencePanel'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'
import type { SessionAPIData } from '@/components/panels/SessionPanel'
import type { FeedItem } from '@/components/panels/FeedPanel'
import { SimpleChart } from '@/components/charts/SimpleChart'
import { ChartToolbar } from '@/components/charts/ChartToolbar'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import type { Market, Timeframe } from '@/types/market'
import type { IndicatorData, VolumeData, TradingConfig } from '@/types/analysis'

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
      bucket.push({
        ts: now - idx * 15,
        item: {
          time: formatHHMM(now - idx * 15),
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
          message: `${ann.pattern}: ${ann.direction}${ann.win_rate != null ? ` (${Math.round(ann.win_rate * 100)}%)` : ''}`,
          type: ann.direction === 'long' ? 'signal' : ann.direction === 'short' ? 'warning' : 'info',
        },
      })
    })
  }

  // Day bias
  if (patternsData?.day_bias && patternsData.day_bias !== 'unknown') {
    bucket.push({
      ts: now - 600,
      item: {
        time: formatHHMM(now - 600),
        message: `Day Bias: ${patternsData.day_bias} (${patternsData.day_type})`,
        type: 'info',
      },
    })
  }

  // Current session
  if (sessionData?.current_session) {
    const label =
      SESSION_DISPLAY[sessionData.current_session] ?? sessionData.current_session
    bucket.push({
      ts: now - 300,
      item: {
        time: formatHHMM(now - 300),
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

  // ── Status ────────────────────────────────────────────────────────────────
  const [latencyMs, setLatencyMs] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')

  // ── Chart bars via hook (REST + WebSocket auto-reconnect) ──────────────────
  const { bars, isLoading, isConnected, error, barsCount } = useMarketData(symbol, days)

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

    const [sessR, confR, patR, indR, volR, cfgR, strR] = await Promise.allSettled([
      fetch(`${base}/sessions?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/confluence?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/patterns?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/indicators?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/volume?${qs}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${ENGINE_URL}/api/config`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}/structure?${qs}`).then((r) => (r.ok ? r.json() : null)),
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

  // ── Market pill list (from API or static fallback) ────────────────────────
  const marketRoots: Market[] =
    markets.length > 0
      ? (markets.map((m) => m.root).filter(Boolean) as Market[])
      : (['ES', 'NQ', 'CL', 'GC', '6E'] as Market[])

  // ── Price ─────────────────────────────────────────────────────────────────
  const price = lastClose ?? null

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

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr 280px',
        gridTemplateRows: '48px 28px 1fr 24px',
      }}
    >
      {/* Sidebar — col 1, rows 1-4 */}
      <div style={{ gridColumn: '1', gridRow: '1 / -1' }}>
        <Sidebar />
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
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-sm text-[var(--color-text-muted)]">No data</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — col 3, rows 2-3 */}
      <div
        className="border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/95 overflow-y-auto"
        style={{ gridColumn: '3', gridRow: '2 / 4' }}
      >
        <RightPanelSection title="Session" count={sessionData?.bar_count}>
          <div className="px-3 pb-3">
            <SessionPanel data={sessionData ?? undefined} />
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection title="Confluence">
          <div className="px-3 pb-3">
            <ConfluencePanel data={confluenceData ?? undefined} />
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection
          title="Patterns"
          count={patternsData?.annotations.length ?? undefined}
        >
          <div className="px-3 pb-3">
            <PatternsPanel data={patternsData ?? undefined} />
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection
          title="Feed"
          count={feedItems.length > 0 ? feedItems.length : undefined}
        >
          <div className="px-3 pb-3">
            <FeedPanel items={feedItems.length > 0 ? feedItems : undefined} />
          </div>
        </RightPanelSection>

        <RightPanelDivider />

        <RightPanelSection title="Risk">
          <div className="px-3 pb-3">
            <RiskPanel config={tradingConfig ?? undefined} />
          </div>
        </RightPanelSection>
      </div>

      {/* StatusBar — col 1-3, row 4 */}
      <div style={{ gridColumn: '1 / -1', gridRow: '4' }}>
        <StatusBar
          connected={isConnected}
          latencyMs={latencyMs}
          barsLoaded={barsCount}
          lastUpdate={lastUpdate}
        />
      </div>
    </div>
  )
}

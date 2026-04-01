import { useRef, useMemo, useCallback, useState } from 'react'
import { ArctisChartWrapper } from '@/components/charts/ArctisChartWrapper'
import type { SessionLevels } from '@/components/charts/PriceLevelLines'
import type { PriceZone, SessionBand } from '@/components/charts/CandlestickChart'
import { ChartToolbar } from '@/components/charts/ChartToolbar'
import type { OverlayKey } from '@/components/charts/ChartToolbar'
import { DrawingToolbar } from '@/components/charts/DrawingToolbar'
import { ReplayBar } from '@/components/replay/ReplayBar'
import { buildSignalLines } from '@/components/charts/SignalOverlay'
import type { Setup, Signal, ChartSignalLines } from '@/components/charts/SignalOverlay'
import type { OHLCVBar } from '@/types/market'
import type { IndicatorData } from '@/types/analysis'
import type { PatternsAPIData } from '@/components/panels/PatternsPanel'
import type { TradeMarker } from '@/types/chart'
import type { DrawingToolType, ChartDrawing, WipDrawing } from '@/types/drawing'
import { useDrawingStore } from '@/stores/drawingStore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReplayState {
  isPlaying: boolean
  isPaused: boolean
  speed: number
  progress: number
  replayDate: string | null
  availableDates: string[]
  simStatus: { visible_bars: number; total_bars: number; paused?: boolean } | null
  start: (date?: string) => Promise<void>
  stop: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  setSpeed: (s: number) => Promise<void>
  setReplayDate: (date: string) => void
  seek: (pct: number) => void
  changeDate: (direction: 'prev' | 'next') => void
}

// Re-export ChartZone for App.tsx compatibility
export type { OverlayKey }

export interface ChartPageProps {
  // Chart data
  symbol: string
  timeframe: string
  chartBars: OHLCVBar[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  // Overlays
  activeOverlays: Set<OverlayKey>
  onToggleOverlay: (key: OverlayKey) => void
  // Analysis data
  indicatorData: IndicatorData | null
  structureBreaks: unknown[] | undefined
  patternAnnotations: PatternsAPIData['annotations'] | undefined
  zones: unknown[] | undefined
  scrollToTimestamp: number | null
  onChartReady: (chart: unknown) => void
  // Signals and setups (used for signal line overlay on chart)
  signals?: Signal[] | null
  setups?: Setup[] | null
  // Mode
  mode: 'live' | 'replay'
  replay: ReplayState
  replayCurrentTime: string
  replayTotalTime: string
}

// ── Zone shape from analysis API ──────────────────────────────────────────────

interface AnalysisZone {
  price_top?: number
  price_bottom?: number
  top?: number
  bottom?: number
  high?: number
  low?: number
  fill?: string
  color?: string
  opacity?: number
  label?: string
  name?: string
  type?: string  // "line" | "area"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts known session level keys from the raw Record<string, number | null>
 * returned by the Arctis analysis API.
 */
function deriveSessionLevels(
  raw: Record<string, number | null> | null | undefined,
): SessionLevels | null {
  if (!raw) return null

  const prevHigh = raw['prev_high'] ?? raw['pdh'] ?? null
  const prevLow = raw['prev_low'] ?? raw['pdl'] ?? null
  const prevClose = raw['prev_close'] ?? raw['pdc'] ?? null

  // All three mandatory keys must be present and non-zero
  if (!prevHigh || !prevLow || !prevClose) return null

  const result: SessionLevels = {
    prev_high: prevHigh,
    prev_low: prevLow,
    prev_close: prevClose,
  }

  const orHigh = raw['opening_range_high'] ?? raw['orh'] ?? null
  const orLow = raw['opening_range_low'] ?? raw['orl'] ?? null

  if (orHigh) result.opening_range_high = orHigh
  if (orLow) result.opening_range_low = orLow

  return result
}

/**
 * Convert raw API zones array to CandlestickChart PriceZone[].
 * Handles { price_top, price_bottom }, { top, bottom }, and { high, low } shapes.
 *
 * Zone colors follow Arctic Frost conventions:
 *  - Support zones (PDL, VAL, ORL, low-related): #00B775 green
 *  - Resistance zones (PDH, VAH, ORH, high-related): #FF3B3B red
 *  - Neutral areas (VA, OR, IB, ONR, SZ): use zone's own color
 *  - Lines (POC, NPOC): #FBBF24 amber
 */
function convertZonesToPriceZones(zones: unknown[] | undefined, currentPrice?: number): PriceZone[] | undefined {
  if (!zones || zones.length === 0) return undefined

  // Arctic Frost zone palette
  const SUPPORT_GREEN = '#00B775'
  const RESISTANCE_RED = '#FF3B3B'
  const POC_AMBER = '#FBBF24'
  const ICE_BLUE = '#5CB8F0'
  const PURPLE = '#A855F7'
  const ORANGE = '#F7941D'

  const STALE_THRESHOLD = 20 // points — zones further than this from price are stale

  const result: PriceZone[] = []
  for (const raw of zones) {
    const z = raw as AnalysisZone
    const top = z.price_top ?? z.top ?? z.high
    const bottom = z.price_bottom ?? z.bottom ?? z.low
    if (top == null || bottom == null) continue

    // Frontend stale zone filter: skip zones too far from current price
    if (currentPrice != null) {
      const label = z.label ?? ''
      // Time-bounded zones (OR, IB, ONR) are not filtered
      if (label !== 'OR' && label !== 'IB' && label !== 'ONR') {
        // Support broken: price is far below zone bottom
        if (currentPrice < bottom - STALE_THRESHOLD) continue
        // Resistance broken: price is far above zone top
        if (currentPrice > top + STALE_THRESHOLD) continue
      }
    }

    // Skip line-type zones that are identical high/low (rendered as PriceLevels instead)
    // Exception: POC and NPOC lines should render as thin zones for visibility
    const isLine = z.type === 'line' || top === bottom
    const label = z.label ?? ''

    let fill: string
    let stroke: string
    let labelColor: string | undefined

    if (label === 'POC' || label === 'NPOC') {
      // POC/NPOC: thin amber line — minimal fill, visible stroke
      fill = 'rgba(251,191,36,0.06)'
      stroke = 'rgba(251,191,36,0.60)'
      labelColor = POC_AMBER
    } else if (label === 'PDH') {
      fill = 'rgba(255,59,59,0.04)'
      stroke = 'rgba(255,59,59,0.40)'
      labelColor = RESISTANCE_RED
    } else if (label === 'PDL') {
      fill = 'rgba(0,183,117,0.04)'
      stroke = 'rgba(0,183,117,0.40)'
      labelColor = SUPPORT_GREEN
    } else if (label === 'VA') {
      fill = 'rgba(92,184,240,0.04)'
      stroke = 'rgba(92,184,240,0.20)'
      labelColor = ICE_BLUE
    } else if (label === 'OR') {
      fill = 'rgba(92,184,240,0.05)'
      stroke = 'rgba(92,184,240,0.25)'
      labelColor = ICE_BLUE
    } else if (label === 'IB') {
      fill = 'rgba(168,85,247,0.04)'
      stroke = 'rgba(168,85,247,0.20)'
      labelColor = PURPLE
    } else if (label === 'ONR') {
      fill = 'rgba(247,148,29,0.04)'
      stroke = 'rgba(247,148,29,0.18)'
      labelColor = ORANGE
    } else if (label === 'SZ') {
      fill = 'rgba(0,183,117,0.04)'
      stroke = 'rgba(0,183,117,0.18)'
      labelColor = SUPPORT_GREEN
    } else {
      // Fallback: use zone color with appropriate opacity
      const baseColor = z.color ?? '#5CB8F0'
      const opacity = z.opacity ?? 0.07
      fill = z.fill ?? hexToRgba(baseColor, opacity)
      stroke = hexToRgba(baseColor, Math.min(1, opacity * 4))
    }

    // For line-type zones, widen to a very thin visible band (1 tick = 0.25pt)
    const priceTop = isLine ? top + 0.25 : top
    const priceBottom = isLine ? bottom - 0.25 : bottom

    result.push({
      priceTop,
      priceBottom,
      fill,
      stroke,
      label,
      labelColor,
    })
  }
  return result.length > 0 ? result : undefined
}

/** Convert hex color (#RRGGBB) to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Convert pattern annotations to TradeMarker[].
 * Uses the annotation price/timestamp to place a marker above/below a candle.
 */
function convertAnnotationsToMarkers(
  annotations: PatternsAPIData['annotations'] | undefined,
): TradeMarker[] | undefined {
  if (!annotations || annotations.length === 0) return undefined

  return annotations.map((ann, idx) => ({
    time: ann.timestamp,
    price: ann.price,
    position: ann.direction === 'short' ? 'aboveBar' : 'belowBar',
    color: ann.color ?? (ann.direction === 'short' ? '#EF4136' : '#5CB8F0'),
    shape: ann.direction === 'short' ? 'triangleDown' : 'triangleUp',
    tradeId: idx,
    type: 'entry',
    side: ann.direction === 'short' ? 'short' : 'long',
  })) as TradeMarker[]
}

/** Structure break shape from the analysis API */
interface StructureBreakItem {
  type: string
  direction: string
  price: number
  timestamp: number
}

/**
 * Convert structure breaks into TradeMarker[] so they render via the
 * existing markers pipeline in ArctisChartWrapper/CandlestickChart.
 *
 * Bullish breaks (BOS/CHoCH up) → triangle-up below bar
 * Bearish breaks → triangle-down above bar
 */
function convertStructureBreaksToMarkers(
  breaks: unknown[] | undefined,
): TradeMarker[] | undefined {
  if (!breaks || breaks.length === 0) return undefined

  // Only show structure breaks from the last 2 trading days to avoid clutter
  const TWO_DAYS_SEC = 2 * 24 * 60 * 60
  const now = Math.floor(Date.now() / 1000)
  const cutoff = now - TWO_DAYS_SEC

  const result: TradeMarker[] = []
  for (const raw of breaks) {
    const sb = raw as StructureBreakItem
    if (!sb.price || !sb.timestamp) continue
    // Filter out old markers
    if (sb.timestamp < cutoff) continue
    const isBullish = sb.direction === 'bullish' || sb.direction === 'up'
    result.push({
      time: sb.timestamp,
      price: sb.price,
      position: isBullish ? 'belowBar' : 'aboveBar',
      color: isBullish ? '#00B775' : '#FF3B3B',
      shape: isBullish ? 'triangleUp' : 'triangleDown',
      tradeId: 10_000 + result.length, // offset to avoid ID collision with pattern markers
      type: 'entry',
      side: isBullish ? 'long' : 'short',
    })
  }

  // Cap at 8 most recent markers to prevent chart clutter
  const MAX_MARKERS = 8
  const limited = result.length > MAX_MARKERS
    ? result.slice(result.length - MAX_MARKERS)
    : result

  return limited.length > 0 ? limited : undefined
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChartPage({
  symbol,
  timeframe,
  chartBars,
  isLoading,
  isConnected: _isConnected,
  error,
  activeOverlays,
  onToggleOverlay,
  indicatorData,
  structureBreaks,
  patternAnnotations,
  zones,
  scrollToTimestamp,
  onChartReady: _onChartReady,
  signals,
  setups,
  mode,
  replay,
  replayCurrentTime,
  replayTotalTime,
}: ChartPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Drawing store ─────────────────────────────────────────────────────────
  const chartKey = `${symbol}:${timeframe}`

  const activeTool = useDrawingStore((s) => s.activeTool)
  const setActiveTool = useDrawingStore((s) => s.setActiveTool)
  const selectedDrawingId = useDrawingStore((s) => s.selectedDrawingId)
  const setSelectedDrawingId = useDrawingStore((s) => s.setSelectedDrawingId)
  const setWipDrawing = useDrawingStore((s) => s.setWipDrawing)
  const addDrawing = useDrawingStore((s) => s.addDrawing)
  const updateDrawing = useDrawingStore((s) => s.updateDrawing)
  const clearDrawings = useDrawingStore((s) => s.clearDrawings)
  const removeDrawing = useDrawingStore((s) => s.removeDrawing)
  const drawingsMap = useDrawingStore((s) => s.drawings)
  const stickyMode = useDrawingStore((s) => s.stickyMode)
  const defaultColor = useDrawingStore((s) => s.defaultColor)
  const defaultLineWidth = useDrawingStore((s) => s.defaultLineWidth)
  const defaultLineStyle = useDrawingStore((s) => s.defaultLineStyle)

  // Resolve the drawings slice for this chart
  const userDrawings = useMemo(
    () => drawingsMap[chartKey] ?? [],
    [drawingsMap, chartKey],
  )

  const drawingCount = userDrawings.length

  // Convert OHLCVBar[] to Bar[] (same shape — both have timestamp/open/high/low/close/volume)
  const bars = chartBars as unknown as import('@/types/contracts').Bar[]

  // Derive session levels from analysis indicator data
  const sessionLevels = useMemo(
    () => deriveSessionLevels(indicatorData?.session_levels),
    [indicatorData],
  )

  // Current price from last bar (for stale zone filtering)
  const currentPrice = bars.length > 0 ? bars[bars.length - 1].close : undefined

  // Convert raw zones to PriceZone[] for CandlestickChart — respects zones toggle
  // Filters out stale zones that price has traded completely through (> 20pts away)
  const priceZones = useMemo(
    () => activeOverlays.has('zones') ? convertZonesToPriceZones(zones, currentPrice) : undefined,
    [zones, activeOverlays, currentPrice],
  )

  // Pattern markers DISABLED — showing BUY+SELL simultaneously confuses the user.
  // Only re-enable when signals are precise and show ONE clear direction.
  // const patternMarkers = convertAnnotationsToMarkers(patternAnnotations)

  // Structure break markers — rendered as triangles at break price/timestamp
  const structureBreakMarkers = useMemo(
    () => convertStructureBreaksToMarkers(structureBreaks),
    [structureBreaks],
  )

  // Structure breaks are structural information (BOS/CHoCH), NOT trade signals.
  // Displaying them as BUY/SELL markers confuses users into thinking they are
  // trade recommendations. Trade signals come only from SignalOverlay.
  // Structure break markers are DISABLED to keep the chart clean and honest.
  const markers = useMemo(() => undefined as TradeMarker[] | undefined, [])

  // ── Signal lines for chart overlay (disabled — only shows real signals) ──
  const signalLines = useMemo<ChartSignalLines | null>(() => {
    return buildSignalLines(setups ?? null, signals ?? null)
  }, [setups, signals])

  // ── Session bands (NY Open / Power Hour background highlights) ──────────
  const sessionBands = useMemo(() => {
    if (!chartBars || chartBars.length === 0 || !activeOverlays.has('levels')) return undefined

    const bands: SessionBand[] = []

    for (let i = 0; i < chartBars.length; i++) {
      const bar = chartBars[i]
      const date = new Date(bar.timestamp * 1000)
      const etHour = date.getUTCHours() - 4 // EDT offset
      const etMinute = date.getUTCMinutes()
      const etTime = etHour + etMinute / 60

      // NY Open session (09:30-10:30 ET) — subtle ice blue background
      if (etTime >= 9.5 && etTime < 10.5) {
        const prevBar = i > 0 ? chartBars[i - 1] : null
        const prevEt = prevBar
          ? new Date(prevBar.timestamp * 1000).getUTCHours() - 4 +
            new Date(prevBar.timestamp * 1000).getUTCMinutes() / 60
          : -1
        if (i === 0 || prevEt < 9.5) {
          let end = i
          while (end < chartBars.length - 1) {
            const nextDate = new Date(chartBars[end + 1].timestamp * 1000)
            const nextEt = nextDate.getUTCHours() - 4 + nextDate.getUTCMinutes() / 60
            if (nextEt >= 10.5) break
            end++
          }
          bands.push({ x1: i, x2: end, fill: 'rgba(92,184,240,0.03)', label: 'NY Open' })
        }
      }
    }
    return bands.length > 0 ? bands : undefined
  }, [chartBars, activeOverlays])

  // ── Drawing callbacks ─────────────────────────────────────────────────────

  const handleDrawingComplete = useCallback(
    (wip: WipDrawing) => {
      setWipDrawing(null)
      const drawing: ChartDrawing = {
        id: crypto.randomUUID(),
        type: wip.type,
        x1: wip.x1,
        y1: wip.y1,
        x2: wip.x2,
        y2: wip.y2,
        x3: wip.x3,
        y3: wip.y3,
        color: defaultColor,
        lineWidth: defaultLineWidth,
        lineStyle: defaultLineStyle,
        opacity: 1,
        locked: false,
        visible: true,
        createdAt: new Date().toISOString(),
      }
      addDrawing(chartKey, drawing)
      // In sticky mode, tool stays active after placement
      if (!stickyMode) {
        setActiveTool('crosshair')
      }
    },
    [
      chartKey,
      addDrawing,
      setWipDrawing,
      setActiveTool,
      stickyMode,
      defaultColor,
      defaultLineWidth,
      defaultLineStyle,
    ],
  )

  const handleDrawingUpdate = useCallback(
    (wip: WipDrawing) => {
      setWipDrawing(wip)
    },
    [setWipDrawing],
  )

  const handleDrawingCancel = useCallback(() => {
    setWipDrawing(null)
    setActiveTool('crosshair')
  }, [setWipDrawing, setActiveTool])

  const handleDrawingDragEnd = useCallback(
    (id: string, updates: Partial<ChartDrawing>) => {
      updateDrawing(chartKey, id, updates)
    },
    [chartKey, updateDrawing],
  )

  const handleDrawingSelected = useCallback(
    (id: string | null) => {
      setSelectedDrawingId(id)
    },
    [setSelectedDrawingId],
  )

  const handleSelectTool = useCallback(
    (tool: DrawingToolType | null) => {
      setActiveTool(tool ?? 'crosshair')
    },
    [setActiveTool],
  )

  const handleClearDrawings = useCallback(() => {
    clearDrawings(chartKey)
  }, [chartKey, clearDrawings])

  // ── Right-click context menu for deleting drawings ──────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; drawingId: string } | null>(null)

  const handleChartContextMenu = useCallback((e: React.MouseEvent) => {
    // If a drawing is selected, show delete menu
    if (selectedDrawingId) {
      e.preventDefault()
      setCtxMenu({ x: e.clientX, y: e.clientY, drawingId: selectedDrawingId })
    }
  }, [selectedDrawingId])

  const handleCtxDelete = useCallback(() => {
    if (ctxMenu) {
      removeDrawing(chartKey, ctxMenu.drawingId)
      setSelectedDrawingId(null)
    }
    setCtxMenu(null)
  }, [ctxMenu, chartKey, removeDrawing, setSelectedDrawingId])

  const handleCtxClose = useCallback(() => setCtxMenu(null), [])

  // Fullscreen toggle — uses the Fullscreen API on the chart container
  const handleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el.requestFullscreen()
    }
  }, [])

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-hidden bg-[var(--color-surface-base)]"
      ref={containerRef}
    >
      {/* Chart toolbar */}
      <ChartToolbar
        symbol={symbol}
        activeOverlays={activeOverlays}
        onToggleOverlay={onToggleOverlay}
        onFullscreen={handleFullscreen}
      />

      {/* Chart body */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-loss-muted)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-loss)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <span className="font-mono text-[12px] text-[var(--color-loss)]">{error}</span>
          </div>
        ) : isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="flex items-end gap-[3px] opacity-[0.15]">
              {[32, 48, 28, 56, 40, 52, 36, 60, 44, 50, 38, 54].map((h, i) => (
                <div
                  key={i}
                  className="w-[6px] rounded-t animate-pulse"
                  style={{
                    height: h,
                    background: 'var(--color-accent)',
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)] animate-pulse">
              Loading {symbol}...
            </span>
          </div>
        ) : chartBars.length > 0 ? (
          <div onContextMenu={handleChartContextMenu} onClick={handleCtxClose} className="relative w-full h-full">
            <ArctisChartWrapper
              key={`${symbol}-${timeframe}`}
              bars={bars}
              isLoading={isLoading}
              error={error}
              showVolume={activeOverlays.has('volume')}
              showVp={activeOverlays.has('vp')}
              showVwap={activeOverlays.has('vwap')}
              showEma={activeOverlays.has('ema')}
              showLevels={activeOverlays.has('levels')}
              indicatorData={indicatorData}
              activeOverlays={activeOverlays}
              sessionLevels={sessionLevels}
              symbol={symbol}
              // Drawing props
              activeTool={activeTool}
              onDrawingComplete={handleDrawingComplete}
              onDrawingUpdate={handleDrawingUpdate}
              onDrawingCancel={handleDrawingCancel}
              userDrawings={userDrawings}
              onDrawingDragEnd={handleDrawingDragEnd}
              onDrawingSelected={handleDrawingSelected}
              selectedDrawingId={selectedDrawingId}
              // Zone and marker props
              priceZones={priceZones}
              markers={markers}
              // Signal overlay
              signalLines={signalLines}
              // Session bands (NY Open background)
              sessionBands={sessionBands}
              // Interactive props
              scrollToTimestamp={scrollToTimestamp}
            />
            <DrawingToolbar
              activeTool={activeTool === 'crosshair' ? null : activeTool}
              onSelectTool={handleSelectTool}
              onClear={handleClearDrawings}
              drawingCount={drawingCount}
            />
            {/* Right-click context menu */}
            {ctxMenu && (
              <div
                className="fixed z-50 rounded-lg border shadow-xl overflow-hidden"
                style={{
                  left: ctxMenu.x,
                  top: ctxMenu.y,
                  background: 'var(--color-surface-elevated)',
                  borderColor: 'var(--color-border-subtle)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  minWidth: 160,
                }}
              >
                <button
                  onClick={handleCtxDelete}
                  className="w-full px-3 py-2 text-left text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors duration-150"
                  style={{ color: 'var(--color-loss)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Zeichnung loeschen
                </button>
                <button
                  onClick={handleCtxClose}
                  className="w-full px-3 py-2 text-left text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors duration-150"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-raised)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'var(--color-surface-raised)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 15l4-4 3 3 4-4 7 7" />
              </svg>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-text-muted)]">No data available</span>
          </div>
        )}
      </div>

      {/* Replay bar — only in replay mode */}
      {mode === 'replay' && (
        <div style={{ height: 40, flexShrink: 0 }}>
          <ReplayBar
            isPlaying={replay.isPlaying && !replay.isPaused}
            speed={replay.speed}
            progress={replay.progress}
            currentTime={replayCurrentTime}
            totalTime={replayTotalTime}
            date={replay.replayDate ?? ''}
            availableDates={replay.availableDates}
            onPlay={() => {
              if (replay.isPaused) {
                void replay.resume()
              } else if (!replay.isPlaying) {
                void replay.start()
              }
            }}
            onPause={() => void replay.pause()}
            onSpeedChange={(s) => void replay.setSpeed(s)}
            onSeek={(pct) => replay.seek(pct)}
            onDateChange={(dir) => replay.changeDate(dir)}
            onSelectDate={(date) => {
              replay.setReplayDate(date)
              void replay.stop().then(() => replay.start(date))
            }}
          />
        </div>
      )}
    </div>
  )
}

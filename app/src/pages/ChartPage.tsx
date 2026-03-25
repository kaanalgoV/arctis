import { useRef, useMemo, useCallback } from 'react'
import { ArctisChartWrapper } from '@/components/charts/ArctisChartWrapper'
import type { SessionLevels } from '@/components/charts/PriceLevelLines'
import type { PriceZone } from '@/components/charts/CandlestickChart'
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
  speed: number
  progress: number
  replayDate: string | null
  availableDates: string[]
  simStatus: { visible_bars: number; total_bars: number } | null
  start: (date?: string) => Promise<void>
  stop: () => Promise<void>
  pause: () => void
  resume: () => void
  setSpeed: (s: number) => void
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
  fill?: string
  color?: string
  label?: string
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
 * Handles both { price_top, price_bottom } and { top, bottom } shapes.
 */
function convertZonesToPriceZones(zones: unknown[] | undefined): PriceZone[] | undefined {
  if (!zones || zones.length === 0) return undefined

  const result: PriceZone[] = []
  for (const raw of zones) {
    const z = raw as AnalysisZone
    const top = z.price_top ?? z.top
    const bottom = z.price_bottom ?? z.bottom
    if (top == null || bottom == null) continue
    result.push({
      priceTop: top,
      priceBottom: bottom,
      fill: z.fill ?? z.color ?? 'rgba(92,184,240,0.07)',
      stroke: z.fill ?? z.color ?? 'rgba(92,184,240,0.25)',
      label: z.label,
    })
  }
  return result.length > 0 ? result : undefined
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
  structureBreaks: _structureBreaks,
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
  const _containerRef = useRef<HTMLDivElement>(null)

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

  // Convert raw zones to PriceZone[] for CandlestickChart
  const priceZones = useMemo(() => convertZonesToPriceZones(zones), [zones])

  // Pattern markers DISABLED — showing BUY+SELL simultaneously confuses the user.
  // Only re-enable when signals are precise and show ONE clear direction.
  const markers = useMemo(
    () => undefined as ReturnType<typeof convertAnnotationsToMarkers>,  // was: convertAnnotationsToMarkers(patternAnnotations)
    [patternAnnotations],
  )

  // ── Signal lines for chart overlay (disabled — only shows real signals) ──
  const signalLines = useMemo<ChartSignalLines | null>(() => {
    return buildSignalLines(setups ?? null, signals ?? null)

    return lines
  }, [setups, signals, indicatorData])

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

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-hidden bg-[var(--color-surface-base)]"
      ref={_containerRef}
    >
      {/* Chart toolbar */}
      <ChartToolbar
        symbol={symbol}
        activeOverlays={activeOverlays}
        onToggleOverlay={onToggleOverlay}
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
          <>
            <ArctisChartWrapper
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
              // Interactive props
              scrollToTimestamp={scrollToTimestamp}
            />
            <DrawingToolbar
              activeTool={activeTool === 'crosshair' ? null : activeTool}
              onSelectTool={handleSelectTool}
              onClear={handleClearDrawings}
              drawingCount={drawingCount}
            />
          </>
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
            isPlaying={replay.isPlaying}
            speed={replay.speed}
            progress={replay.progress}
            currentTime={replayCurrentTime}
            totalTime={replayTotalTime}
            date={replay.replayDate ?? ''}
            availableDates={replay.availableDates}
            onPlay={() => {
              if (replay.isPlaying) {
                replay.resume()
              } else {
                void replay.start()
              }
            }}
            onPause={() => replay.pause()}
            onSpeedChange={(s) => {
              replay.setSpeed(s)
              if (replay.isPlaying) void replay.start()
            }}
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

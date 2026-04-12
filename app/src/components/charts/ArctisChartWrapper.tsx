/**
 * ArctisChartWrapper — Adapter between Arctis data model and AlgoView's SciChart CandlestickChart.
 *
 * Converts Bar[] (timestamp field) → Candle[] (time field) and provides
 * a simplified interface for the ChartPage integration.
 *
 * Also converts Arctis IndicatorData (vwap/ema arrays) into the SciChart
 * Map<string, { config: ActiveIndicator; data: IndicatorResult }> format.
 *
 * Phase 3: Drawing tools, zones, markers, session bands, scrollToTimestamp
 * and visible-range callbacks are now fully wired through.
 */
import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { CandlestickChart } from './CandlestickChart'
import type {
  CandlestickChartHandle,
  DayVolumeProfile,
  PriceLevel,
  PriceZone,
  SessionBand,
} from './CandlestickChart'
import type { CrosshairCandleData } from './modifiers'
import { OhlcvOverlay } from './OhlcvOverlay'
import { buildPriceLevels } from './PriceLevelLines'
import type { SessionLevels } from './PriceLevelLines'
import type { ChartSignalLines } from './SignalOverlay'
import type { Bar } from '@/types/contracts'
import type { Candle } from '@/types/domain'
import type { ChartType, ActiveIndicator, TradeMarker } from '@/types/chart'
import type { IndicatorResult } from '@/types/api'
import type { IndicatorData as ArctisIndicatorData } from '@/types/analysis'
import type { ChartDrawing, WipDrawing, DrawingToolType } from '@/types/drawing'
import { buildDayVolumeProfiles } from '@/lib/volume-profile-adapter'

// Internal type matching CandlestickChart's indicator map value shape
interface IndicatorMapEntry {
  config: ActiveIndicator
  data: IndicatorResult | null
}

export interface ArctisChartWrapperProps {
  bars: Bar[]
  className?: string
  isLoading?: boolean
  error?: string | null
  /** Chart rendering type */
  chartType?: ChartType
  /** Show volume histogram (default: true) */
  showVolume?: boolean
  /** Show cumulative delta mountain series (default: false) */
  showCumDelta?: boolean
  /** When true, builds and passes DayVolumeProfile[] to the chart (VP overlay) */
  showVp?: boolean
  /** Daily volume profiles for sidebar VP overlay */
  volumeProfiles?: DayVolumeProfile[] | null
  /** Called when crosshair moves — forwarded to parent if needed */
  onCrosshairMove?: (data: CrosshairCandleData | null) => void
  /** Called when Y-axis visible price range changes (for VP overlay) */
  onPriceRangeChange?: (min: number, max: number) => void
  /** Arctis analysis indicator data (VWAP, EMA) to overlay on the chart */
  indicatorData?: ArctisIndicatorData | null
  /** Active overlay toggles — controls which indicators render */
  activeOverlays?: Set<string>
  /** Explicit indicator toggles (override activeOverlays for reliability) */
  showVwap?: boolean
  showEma?: boolean
  showLevels?: boolean
  /** Session price levels (PDH/PDL/PDC/ORH/ORL) */
  sessionLevels?: SessionLevels | null
  /** Ticker symbol shown in the OHLCV overlay */
  symbol?: string

  // ── Drawing tool props ───────────────────────────────────────────────────
  /** Currently active drawing tool — from drawingStore.activeTool */
  activeTool?: DrawingToolType
  /** Called when user finishes placing a drawing */
  onDrawingComplete?: (wip: WipDrawing) => void
  /** Called on each intermediate mouse move while drawing */
  onDrawingUpdate?: (wip: WipDrawing) => void
  /** Called when drawing placement is cancelled (e.g. Escape) */
  onDrawingCancel?: () => void
  /** Finalized drawings for this chart (keyed by "symbol:timeframe" in the store;
   *  the parent resolves the correct slice and passes it here) */
  userDrawings?: ChartDrawing[]
  /** Called when the user drags a drawing to a new position */
  onDrawingDragEnd?: (id: string, updates: Partial<ChartDrawing>) => void
  /** Called when a drawing is selected or deselected (null = deselect) */
  onDrawingSelected?: (id: string | null) => void
  /** ID of the currently selected drawing (visual highlight) */
  selectedDrawingId?: string | null

  // ── Zone and marker props ────────────────────────────────────────────────
  /** Shaded price zones (e.g. correction zone, scenario target zones) */
  priceZones?: PriceZone[]
  /** Trade/pattern markers to render on the chart */
  markers?: TradeMarker[]

  // ── Signal overlay ───────────────────────────────────────────────────────
  /**
   * Active trade signal lines (entry / stop / target).
   * When provided, horizontal dashed lines with labels are drawn on the chart
   * along with risk/reward shading zones.
   */
  signalLines?: ChartSignalLines | null

  // ── Interactive props ────────────────────────────────────────────────────
  /** When set, the chart will scroll to center this timestamp */
  scrollToTimestamp?: number | null
  /** Called when the visible candle range changes (for external scrollbar) */
  onVisibleRangeChange?: (start: number, end: number, total: number) => void
  /** Vertical session background bands (Asia/EU/US time windows) */
  sessionBands?: SessionBand[] | null
}

/** Convert Arctis Bar[] to AlgoView Candle[] */
function barsToCandles(bars: Bar[]): Candle[] {
  return bars.map((b) => ({
    time: b.timestamp,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }))
}

/**
 * Convert a Unix timestamp (seconds) to an ISO-8601 string.
 * CandlestickChart's indicator rendering does:
 *   Math.floor(new Date(point.ts).getTime() / 1000)
 * to match against candle.time, so we must produce a parseable string.
 */
function tsToIso(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString()
}

/**
 * Build the indicator Map that CandlestickChart expects from Arctis IndicatorData.
 *
 * VWAP indicator:
 *   key = 'vwap', series = ['vwap'], color = amber (#FBBF24)
 *
 * EMA indicators (two separate entries so they can have independent colors):
 *   key = 'ema9',  series = ['ema9'],  color = ice blue (#5CB8F0)
 *   key = 'ema21', series = ['ema21'], color = blue     (#58A6FF)
 */
function buildIndicatorMap(
  indicatorData: ArctisIndicatorData | null | undefined,
  activeOverlays?: Set<string>,
): Map<string, IndicatorMapEntry> {
  const map = new Map<string, IndicatorMapEntry>()

  if (!indicatorData) return map

  // ── VWAP ── only if toggle is ON (or no toggles provided = show all) ────
  if (indicatorData.vwap && indicatorData.vwap.length > 0 && (!activeOverlays || activeOverlays.has('vwap'))) {
    const vwapConfig: ActiveIndicator = {
      id: 'vwap',
      key: 'vwap',
      label: 'VWAP',
      params: {},
      style: {
        color: '#FBBF24',  // amber
        lineWidth: 1,
        lineStyle: 'solid',
        visible: true,
      },
    }

    const vwapResult: IndicatorResult = {
      id: 'vwap',
      series: ['vwap'],
      values: indicatorData.vwap.map((pt) => ({
        ts: tsToIso(pt.timestamp),
        vwap: pt.vwap,
      })),
    }

    map.set('vwap', { config: vwapConfig, data: vwapResult })
  }

  // ── EMA 9 ── only if toggle is ON ────────────────────────────────────────
  if (indicatorData.ema && indicatorData.ema.length > 0 && (!activeOverlays || activeOverlays.has('ema'))) {
    const ema9Config: ActiveIndicator = {
      id: 'ema9',
      key: 'ema9',
      label: 'EMA 9',
      params: { period: 9 },
      style: {
        color: '#5CB8F0',  // ice blue (Arctic Frost accent)
        lineWidth: 1,
        lineStyle: 'solid',
        visible: true,
      },
    }

    const ema9Result: IndicatorResult = {
      id: 'ema9',
      series: ['ema9'],
      values: indicatorData.ema.map((pt) => ({
        ts: tsToIso(pt.timestamp),
        ema9: pt.ema9,
      })),
    }

    map.set('ema9', { config: ema9Config, data: ema9Result })

    // ── EMA 21 ──────────────────────────────────────────────────────────────
    const ema21Config: ActiveIndicator = {
      id: 'ema21',
      key: 'ema21',
      label: 'EMA 21',
      params: { period: 21 },
      style: {
        color: '#7DCBF5',  // ice blue hover variant
        lineWidth: 1,
        lineStyle: 'solid',
        visible: true,
      },
    }

    const ema21Result: IndicatorResult = {
      id: 'ema21',
      series: ['ema21'],
      values: indicatorData.ema.map((pt) => ({
        ts: tsToIso(pt.timestamp),
        ema21: pt.ema21,
      })),
    }

    map.set('ema21', { config: ema21Config, data: ema21Result })
  }

  return map
}

export function ArctisChartWrapper({
  bars,
  className,
  isLoading,
  error,
  chartType = 'candlestick',
  showVolume = true,
  showCumDelta = false,
  showVp = false,
  volumeProfiles,
  onCrosshairMove,
  onPriceRangeChange,
  indicatorData,
  activeOverlays,
  showVwap = true,
  showEma = true,
  showLevels = true,
  sessionLevels,
  symbol = '',
  // Drawing props
  activeTool,
  onDrawingComplete,
  onDrawingUpdate,
  onDrawingCancel,
  userDrawings,
  onDrawingDragEnd,
  onDrawingSelected,
  selectedDrawingId,
  // Zone and marker props
  priceZones,
  markers,
  // Signal overlay
  signalLines,
  // Interactive props
  scrollToTimestamp,
  onVisibleRangeChange,
  sessionBands,
}: ArctisChartWrapperProps) {
  const chartRef = useRef<CandlestickChartHandle>(null)

  // Track hovered candle for the OHLCV overlay
  const [crosshairData, setCrosshairData] = useState<CrosshairCandleData | null>(null)

  const handleCrosshairMove = useCallback(
    (data: CrosshairCandleData | null) => {
      setCrosshairData(data)
      onCrosshairMove?.(data)
    },
    [onCrosshairMove],
  )

  // Memoize Bar[] → Candle[] conversion to avoid re-renders on unrelated prop changes
  const candles = useMemo(() => barsToCandles(bars), [bars])

  // Resolve effective overlay toggles: explicit booleans take priority over Set
  const effectiveVwap = activeOverlays ? activeOverlays.has('vwap') : showVwap
  const effectiveEma = activeOverlays ? activeOverlays.has('ema') : showEma

  // Memoize indicator Map — uses primitive boolean deps for reliable change detection
  const indicators = useMemo(() => {
    const map = new Map<string, IndicatorMapEntry>()
    if (!indicatorData) return map
    if (effectiveVwap) {
      const vwapMap = buildIndicatorMap(indicatorData, new Set(['vwap']))
      for (const [k, v] of vwapMap) map.set(k, v)
    }
    if (effectiveEma) {
      const emaMap = buildIndicatorMap(indicatorData, new Set(['ema']))
      for (const [k, v] of emaMap) map.set(k, v)
    }
    return map
  }, [indicatorData, effectiveVwap, effectiveEma])

  // Build DayVolumeProfile[] from bars + analysis data when VP overlay is active.
  // Falls back to explicitly passed volumeProfiles when showVp is false.
  const resolvedVolumeProfiles = useMemo<DayVolumeProfile[] | null | undefined>(() => {
    if (!showVp) return volumeProfiles ?? null
    return buildDayVolumeProfiles(
      bars,
      indicatorData?.daily_volume_profiles ?? null,
    )
  }, [showVp, bars, indicatorData, volumeProfiles])

  // Derive latest candle for the fallback OHLCV display
  const latestCandle = candles.length > 0 ? candles[candles.length - 1] : null

  // Resolve what to show in the OHLCV overlay: hovered candle or latest candle
  const overlayData = crosshairData ?? latestCandle ?? null

  // Build price level lines from session levels — respects Levels toggle
  const effectiveLevels = activeOverlays ? activeOverlays.has('levels') : showLevels
  const priceLevels = useMemo(
    () => effectiveLevels ? buildPriceLevels(sessionLevels ?? null) : [],
    [sessionLevels, effectiveLevels],
  )

  // ── Signal price levels (entry / stop / target horizontal lines) ──────────
  const signalPriceLevels = useMemo<PriceLevel[]>(() => {
    if (!signalLines) return []
    // Guard: all prices must be valid numbers
    if (!Number.isFinite(signalLines.entryPrice) || !Number.isFinite(signalLines.stopPrice) || !Number.isFinite(signalLines.target1Price)) return []

    const entryColor = signalLines.direction === 'long' ? '#5CB8F0' : '#EF4136'
    const levels: PriceLevel[] = []

    // Entry line
    levels.push({
      price: signalLines.entryPrice,
      color: entryColor,
      label: `ENTRY ${signalLines.entryPrice.toFixed(2)}`,
      dash: [6, 4],
      thickness: 2,
    })

    // Stop Loss line
    levels.push({
      price: signalLines.stopPrice,
      color: '#EF4136',
      label: `STOP ${signalLines.stopPrice.toFixed(2)}`,
      dash: [3, 3],
      thickness: 1,
    })

    // Target 1 line
    levels.push({
      price: signalLines.target1Price,
      color: '#34D399',
      label: `TP1 ${signalLines.target1Price.toFixed(2)}`,
      dash: [6, 4],
      thickness: 1,
    })

    // Target 2 line (optional)
    if (signalLines.target2Price != null) {
      levels.push({
        price: signalLines.target2Price,
        color: '#34D399',
        label: `TP2 ${signalLines.target2Price.toFixed(2)}`,
        dash: [8, 4],
        thickness: 1,
      })
    }

    return levels
  }, [signalLines])

  // Merge session price levels with signal price levels
  const allPriceLevels = useMemo<PriceLevel[]>(
    () => [...priceLevels, ...signalPriceLevels],
    [priceLevels, signalPriceLevels],
  )

  // ── Signal risk/reward zones ───────────────────────────────────────────────
  const signalZones = useMemo<PriceZone[]>(() => {
    if (!signalLines) return []
    if (!Number.isFinite(signalLines.entryPrice) || !Number.isFinite(signalLines.stopPrice) || !Number.isFinite(signalLines.target1Price)) return []

    const zones: PriceZone[] = []

    // Risk zone: shaded area between entry and stop
    zones.push({
      priceTop: Math.max(signalLines.entryPrice, signalLines.stopPrice),
      priceBottom: Math.min(signalLines.entryPrice, signalLines.stopPrice),
      fill: 'rgba(248,113,113,0.08)',
      stroke: 'rgba(248,113,113,0.15)',
      label: 'Risk',
    })

    // Reward zone: shaded area between entry and target1
    zones.push({
      priceTop: Math.max(signalLines.entryPrice, signalLines.target1Price),
      priceBottom: Math.min(signalLines.entryPrice, signalLines.target1Price),
      fill: 'rgba(52,211,153,0.06)',
      stroke: 'rgba(52,211,153,0.12)',
      label: 'Reward',
    })

    return zones
  }, [signalLines])

  // Merge external zones with signal zones
  const allPriceZones = useMemo<PriceZone[]>(
    () => [...(priceZones ?? []), ...signalZones],
    [priceZones, signalZones],
  )

  // scrollToTimestamp: when set, pan the chart to center on that candle.
  // CandlestickChart exposes zoomToTimeRange via its imperative handle.
  // We use a small 5-bar window around the target timestamp.
  useEffect(() => {
    if (scrollToTimestamp == null) return
    const handle = chartRef.current
    if (!handle) return
    // Use a 5-bar window centered on the target candle
    const HALF_WINDOW = 5 * 60 // 5 minutes in seconds (works for 1m charts)
    handle.zoomToTimeRange(scrollToTimestamp - HALF_WINDOW, scrollToTimestamp + HALF_WINDOW, 4)
  }, [scrollToTimestamp])

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', minHeight: 0 }}
    >
      {/* OHLCV overlay — top-left, above chart */}
      <OhlcvOverlay data={overlayData} symbol={symbol} />

      <CandlestickChart
        ref={chartRef}
        candles={candles}
        chartType={chartType}
        isLoading={isLoading}
        error={error}
        showVolume={showVolume}
        showCumDelta={showCumDelta}
        cumDeltaData={indicatorData?.cum_delta ?? null}
        volumeProfiles={resolvedVolumeProfiles}
        onCrosshairMove={handleCrosshairMove}
        onPriceRangeChange={onPriceRangeChange}
        indicators={indicators.size > 0 ? indicators : undefined}
        priceLevels={allPriceLevels.length > 0 ? allPriceLevels : undefined}
        // Drawing props
        activeTool={activeTool}
        onDrawingComplete={onDrawingComplete}
        onDrawingUpdate={onDrawingUpdate}
        onDrawingCancel={onDrawingCancel}
        userDrawings={userDrawings}
        onDrawingDragEnd={onDrawingDragEnd}
        onDrawingSelected={onDrawingSelected}
        selectedDrawingId={selectedDrawingId}
        // Zone and marker props
        priceZones={allPriceZones.length > 0 ? allPriceZones : undefined}
        markers={markers}
        // Interactive props
        onVisibleRangeChange={onVisibleRangeChange}
        sessionBands={sessionBands}
      />
    </div>
  )
}

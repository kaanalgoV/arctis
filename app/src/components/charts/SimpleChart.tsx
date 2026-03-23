import { useEffect, useRef } from 'react'
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type IPriceLine,
  type SeriesMarker,
  ColorType,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts'
import type { OHLCVBar } from '@/types/market'
import type { Drawing } from '@/hooks/useDrawings'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChartZone {
  name: string
  type: 'area' | 'line' | 'range'
  high: number
  low: number
  color: string
  opacity: number
  start_time: number
  end_time: number | null
  label: string
  priority: number
}

interface VwapPoint {
  timestamp: number
  vwap: number
  upper_1: number
  lower_1: number
  upper_2: number
  lower_2: number
}

interface EmaPoint {
  timestamp: number
  ema9: number
  ema21: number
  ema50: number
  alignment: string
}

interface VolumeProfile {
  poc: number
  vah: number
  val: number
}

interface SessionLevels {
  prev_high: number
  prev_low: number
  prev_close: number
  opening_range_high: number
  opening_range_low: number
}

interface StructureBreak {
  type: string
  direction: string
  price: number
  timestamp: number
}

interface PatternAnnotation {
  timestamp: number
  pattern: string
  direction: string
  price: number | null
  marker_type: string
  color: string
}

export interface SimpleChartProps {
  bars: OHLCVBar[]
  className?: string
  // Loading / error states
  isLoading?: boolean
  error?: string | null
  // Overlay data (external, server-provided)
  vwapData?: VwapPoint[]
  emaData?: EmaPoint[]
  volumeProfile?: VolumeProfile | null
  sessionLevels?: SessionLevels | null
  structureBreaks?: StructureBreak[]
  patternAnnotations?: PatternAnnotation[]
  // Previous day levels (direct props)
  pdh?: number | null
  pdl?: number | null
  pdc?: number | null
  // Overlay visibility
  showVwap?: boolean
  showEma?: boolean
  showVp?: boolean
  showLevels?: boolean
  showSessionSeparators?: boolean
  /** Called once when the chart instance is created, providing the API reference. */
  onChartReady?: (chart: IChartApi) => void
  /** If set, the chart will scroll to this unix timestamp (seconds). */
  scrollToTimestamp?: number | null
  /** Drawing objects to render on the chart. */
  drawings?: Drawing[]
  /** Called when user clicks the chart while a drawing tool is active. */
  onChartClick?: (price: number, timestamp: number) => void
  /** Zone overlays to render as price lines. Only rendered when showZones is true. */
  zones?: ChartZone[]
  /** Whether to render zone overlays. */
  showZones?: boolean
}

// ─── Refs state for overlay series ───────────────────────────────────────────

interface OverlaySeries {
  vwap: ISeriesApi<'Line'> | null
  vwapUp1: ISeriesApi<'Line'> | null
  vwapDn1: ISeriesApi<'Line'> | null
  vwapUp2: ISeriesApi<'Line'> | null
  vwapDn2: ISeriesApi<'Line'> | null
  ema9: ISeriesApi<'Line'> | null
  ema21: ISeriesApi<'Line'> | null
  ema50: ISeriesApi<'Line'> | null
}

// ─── VWAP Calculation ────────────────────────────────────────────────────────

/**
 * Returns hour in ET (UTC-5 standard, UTC-4 daylight).
 * Approximation: use UTC-4 (EDT) for trading season (Mar-Nov), UTC-5 (EST) otherwise.
 */
function getHourET(timestampSeconds: number): number {
  const d = new Date(timestampSeconds * 1000)
  const month = d.getUTCMonth() // 0=Jan
  // EDT (UTC-4): March(2) through November(10)
  const offsetHours = month >= 2 && month <= 10 ? 4 : 5
  return (d.getUTCHours() - offsetHours + 24) % 24
}

function getMinuteET(timestampSeconds: number): number {
  const d = new Date(timestampSeconds * 1000)
  return d.getUTCMinutes()
}

/** Calculate VWAP with SD bands from bars, resetting at 09:30 ET each day. */
function calculateVwap(bars: OHLCVBar[]): VwapPoint[] {
  const result: VwapPoint[] = []

  let cumPV = 0
  let cumV = 0
  let cumPV2 = 0 // for variance: sum of (typical_price^2 * volume)
  let prevDay = -1

  for (const bar of bars) {
    const h = getHourET(bar.timestamp)
    const m = getMinuteET(bar.timestamp)
    const d = new Date(bar.timestamp * 1000).getUTCDate()

    // Reset at 09:30 ET or new day
    const isRthOpen = h === 9 && m === 30
    const isNewDay = d !== prevDay && h === 9 && m >= 30

    if (isRthOpen || (isNewDay && h > 9)) {
      cumPV = 0
      cumV = 0
      cumPV2 = 0
    }

    if (d !== prevDay) prevDay = d

    const tp = (bar.high + bar.low + bar.close) / 3
    cumPV += tp * bar.volume
    cumV += bar.volume
    cumPV2 += tp * tp * bar.volume

    if (cumV === 0) continue

    const vwap = cumPV / cumV
    const variance = Math.max(0, cumPV2 / cumV - vwap * vwap)
    const sd = Math.sqrt(variance)

    result.push({
      timestamp: bar.timestamp,
      vwap,
      upper_1: vwap + sd,
      lower_1: vwap - sd,
      upper_2: vwap + 2 * sd,
      lower_2: vwap - 2 * sd,
    })
  }

  return result
}

// ─── EMA Calculation ─────────────────────────────────────────────────────────

function calculateEma(closes: number[], period: number): number[] {
  if (closes.length === 0) return []
  const k = 2 / (period + 1)
  const result: number[] = []
  let ema = closes[0]
  result.push(ema)
  for (let i = 1; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

function calculateEmaRibbon(bars: OHLCVBar[]): { timestamp: number; ema9: number; ema21: number; ema50: number }[] {
  if (bars.length === 0) return []
  const closes = bars.map((b) => b.close)
  const ema9 = calculateEma(closes, 9)
  const ema21 = calculateEma(closes, 21)
  const ema50 = calculateEma(closes, 50)
  return bars.map((b, i) => ({
    timestamp: b.timestamp,
    ema9: ema9[i],
    ema21: ema21[i],
    ema50: ema50[i],
  }))
}

// ─── Session separator timestamps ────────────────────────────────────────────

interface SessionBoundary {
  timestamp: number
  label: string
}

/**
 * Given a set of bars, extract unique session boundary timestamps (by ET hour).
 * Sessions: Pre-market (06:00), RTH Open (09:30), Lunch (12:00), RTH Close (16:00)
 */
function extractSessionBoundaries(bars: OHLCVBar[]): SessionBoundary[] {
  const seen = new Set<string>()
  const boundaries: SessionBoundary[] = []

  for (const bar of bars) {
    const h = getHourET(bar.timestamp)
    const m = getMinuteET(bar.timestamp)
    const d = new Date(bar.timestamp * 1000).toISOString().slice(0, 10)

    const boundaries2check: Array<[number, number, string]> = [
      [6, 0, 'Pre'],
      [9, 30, 'Open'],
      [12, 0, 'Lunch'],
      [16, 0, 'Close'],
    ]

    for (const [bh, bm, label] of boundaries2check) {
      if (h === bh && m === bm) {
        const key = `${d}-${label}`
        if (!seen.has(key)) {
          seen.add(key)
          boundaries.push({ timestamp: bar.timestamp, label })
        }
      }
    }
  }

  return boundaries
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SimpleChart({
  bars,
  className,
  isLoading = false,
  error,
  vwapData,
  emaData,
  volumeProfile,
  sessionLevels,
  structureBreaks,
  patternAnnotations,
  pdh,
  pdl,
  pdc,
  showVwap = false,
  showEma = false,
  showVp = false,
  showLevels = false,
  showSessionSeparators = true,
  onChartReady,
  scrollToTimestamp,
  drawings,
  onChartClick,
  zones,
  showZones = false,
}: SimpleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // Candle series ref for price lines and markers
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  // Volume series ref for incremental updates
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  // Overlay series refs
  const overlayRef = useRef<OverlaySeries>({
    vwap: null,
    vwapUp1: null,
    vwapDn1: null,
    vwapUp2: null,
    vwapDn2: null,
    ema9: null,
    ema21: null,
    ema50: null,
  })
  // Price line refs so we can remove them on data change
  const priceLineRefs = useRef<IPriceLine[]>([])
  // Markers plugin ref (LWC v5 uses createSeriesMarkers plugin)
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<number> | null>(null)
  // Drawing price line refs keyed by drawing id
  const drawingLineRefs = useRef<Map<string, IPriceLine>>(new Map())
  // Zone price line refs (cleared and rebuilt whenever zones or showZones changes)
  const zoneLinesRef = useRef<IPriceLine[]>([])
  // Previous bars length to detect incremental vs full reload
  const prevBarsLengthRef = useRef<number>(0)

  // ── Build chart on first mount ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0A0D12' },
        textColor: '#6E7681',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(53,61,72,0.3)' },
        horzLines: { color: 'rgba(53,61,72,0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(92,184,240,0.3)', width: 1, labelBackgroundColor: '#222830' },
        horzLine: { color: 'rgba(92,184,240,0.3)', width: 1, labelBackgroundColor: '#222830' },
      },
      rightPriceScale: { borderColor: '#272F3A' },
      timeScale: { borderColor: '#272F3A', timeVisible: true, secondsVisible: false },
    })
    chartRef.current = chart

    // ── Candlesticks ──────────────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#008757',
      downColor: '#EF4136',
      borderUpColor: '#008757',
      borderDownColor: '#EF4136',
      wickUpColor: '#008757',
      wickDownColor: '#EF4136',
    })
    candleRef.current = candleSeries

    // ── Volume bars ───────────────────────────────────────────────────────────
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeriesRef.current = volumeSeries

    // ── VWAP overlay series (always added, visibility controlled) ─────────────
    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#5CB8F0',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapUp1Series = chart.addSeries(LineSeries, {
      color: 'rgba(92,184,240,0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapDn1Series = chart.addSeries(LineSeries, {
      color: 'rgba(92,184,240,0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapUp2Series = chart.addSeries(LineSeries, {
      color: 'rgba(92,184,240,0.15)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapDn2Series = chart.addSeries(LineSeries, {
      color: 'rgba(92,184,240,0.15)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    overlayRef.current.vwap = vwapSeries
    overlayRef.current.vwapUp1 = vwapUp1Series
    overlayRef.current.vwapDn1 = vwapDn1Series
    overlayRef.current.vwapUp2 = vwapUp2Series
    overlayRef.current.vwapDn2 = vwapDn2Series

    // ── EMA ribbon series ─────────────────────────────────────────────────────
    const ema9Series = chart.addSeries(LineSeries, {
      color: '#5CB8F0',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const ema21Series = chart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    overlayRef.current.ema9 = ema9Series
    overlayRef.current.ema21 = ema21Series
    overlayRef.current.ema50 = ema50Series

    // ── Markers plugin (LWC v5) ───────────────────────────────────────────────
    const markersPlugin = createSeriesMarkers(candleSeries)
    markersPluginRef.current = markersPlugin

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        chart.resize(width, height)
      }
    })
    ro.observe(containerRef.current)

    // Notify parent that chart is ready
    onChartReady?.(chart)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      candleRef.current = null
      volumeSeriesRef.current = null
      priceLineRefs.current = []
      zoneLinesRef.current = []
      markersPluginRef.current = null
      drawingLineRefs.current.clear()
      prevBarsLengthRef.current = 0
      overlayRef.current = {
        vwap: null, vwapUp1: null, vwapDn1: null,
        vwapUp2: null, vwapDn2: null,
        ema9: null, ema21: null, ema50: null,
      }
    }
    // Chart is created once — data updates handled by separate effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Bar data updates (incremental) ────────────────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    const volume = volumeSeriesRef.current
    if (!candle || !volume || bars.length === 0) return

    const prevLen = prevBarsLengthRef.current

    if (prevLen === 0) {
      // Full reload — set all data
      candle.setData(
        bars.map((b) => ({
          time: b.timestamp as any,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      )
      volume.setData(
        bars.map((b) => ({
          time: b.timestamp as any,
          value: b.volume,
          color: b.close >= b.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
        }))
      )
      chartRef.current?.timeScale().fitContent()
    } else if (bars.length === prevLen) {
      // Same length — update last bar in place (price tick)
      const last = bars[bars.length - 1]
      candle.update({
        time: last.timestamp as any,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
      })
      volume.update({
        time: last.timestamp as any,
        value: last.volume,
        color: last.close >= last.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
      })
    } else if (bars.length === prevLen + 1) {
      // One new bar appended — update last (now complete) and add new
      const prev = bars[bars.length - 2]
      const last = bars[bars.length - 1]
      candle.update({
        time: prev.timestamp as any,
        open: prev.open,
        high: prev.high,
        low: prev.low,
        close: prev.close,
      })
      candle.update({
        time: last.timestamp as any,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
      })
      volume.update({
        time: prev.timestamp as any,
        value: prev.volume,
        color: prev.close >= prev.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
      })
      volume.update({
        time: last.timestamp as any,
        value: last.volume,
        color: last.close >= last.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
      })
    } else {
      // Larger diff (e.g. symbol change) — full reload
      candle.setData(
        bars.map((b) => ({
          time: b.timestamp as any,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      )
      volume.setData(
        bars.map((b) => ({
          time: b.timestamp as any,
          value: b.volume,
          color: b.close >= b.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
        }))
      )
      chartRef.current?.timeScale().fitContent()
    }

    prevBarsLengthRef.current = bars.length
  }, [bars])

  // ── VWAP: prefer server data, fall back to internal calculation ───────────
  useEffect(() => {
    const ov = overlayRef.current
    if (!ov.vwap) return

    const visible = showVwap && bars.length > 0

    if (visible) {
      // Use server-provided data if available, otherwise calculate from bars
      const data: VwapPoint[] =
        vwapData && vwapData.length > 0
          ? [...vwapData].sort((a, b) => a.timestamp - b.timestamp)
          : calculateVwap(bars)

      ov.vwap.setData(data.map((v) => ({ time: v.timestamp as any, value: v.vwap })))
      ov.vwapUp1!.setData(data.map((v) => ({ time: v.timestamp as any, value: v.upper_1 })))
      ov.vwapDn1!.setData(data.map((v) => ({ time: v.timestamp as any, value: v.lower_1 })))
      ov.vwapUp2!.setData(data.map((v) => ({ time: v.timestamp as any, value: v.upper_2 })))
      ov.vwapDn2!.setData(data.map((v) => ({ time: v.timestamp as any, value: v.lower_2 })))
    }

    ov.vwap.applyOptions({ visible })
    ov.vwapUp1!.applyOptions({ visible })
    ov.vwapDn1!.applyOptions({ visible })
    ov.vwapUp2!.applyOptions({ visible })
    ov.vwapDn2!.applyOptions({ visible })
  }, [showVwap, vwapData, bars])

  // ── EMA: prefer server data, fall back to internal calculation ────────────
  useEffect(() => {
    const ov = overlayRef.current
    if (!ov.ema9) return

    const visible = showEma && bars.length > 0

    if (visible) {
      const data =
        emaData && emaData.length > 0
          ? [...emaData]
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((e) => ({ timestamp: e.timestamp, ema9: e.ema9, ema21: e.ema21, ema50: e.ema50 }))
          : calculateEmaRibbon(bars)

      ov.ema9!.setData(data.map((e) => ({ time: e.timestamp as any, value: e.ema9 })))
      ov.ema21!.setData(data.map((e) => ({ time: e.timestamp as any, value: e.ema21 })))
      ov.ema50!.setData(data.map((e) => ({ time: e.timestamp as any, value: e.ema50 })))
    }

    ov.ema9!.applyOptions({ visible })
    ov.ema21!.applyOptions({ visible })
    ov.ema50!.applyOptions({ visible })
  }, [showEma, emaData, bars])

  // ── Volume Profile price lines ────────────────────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove existing VP price lines (first 3)
    priceLineRefs.current
      .slice(0, 3)
      .forEach((pl) => {
        try { candle.removePriceLine(pl) } catch (_) { /* already removed */ }
      })
    priceLineRefs.current = priceLineRefs.current.slice(3)

    if (showVp && volumeProfile) {
      const poc = candle.createPriceLine({
        price: volumeProfile.poc,
        color: '#FBBF24',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'POC',
      })
      const vah = candle.createPriceLine({
        price: volumeProfile.vah,
        color: '#5CB8F0',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'VAH',
      })
      const val = candle.createPriceLine({
        price: volumeProfile.val,
        color: '#5CB8F0',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'VAL',
      })
      priceLineRefs.current = [poc, vah, val, ...priceLineRefs.current]
    }
  }, [showVp, volumeProfile])

  // ── Session / Previous Day Levels price lines ─────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    const vpCount = showVp && volumeProfile ? 3 : 0
    priceLineRefs.current
      .slice(vpCount)
      .forEach((pl) => {
        try { candle.removePriceLine(pl) } catch (_) { /* already removed */ }
      })
    priceLineRefs.current = priceLineRefs.current.slice(0, vpCount)

    if (showLevels) {
      const lines: IPriceLine[] = []

      // Session levels (from sessionLevels prop)
      if (sessionLevels) {
        const sl = sessionLevels
        if (sl.prev_high != null) {
          lines.push(candle.createPriceLine({
            price: sl.prev_high,
            color: '#008757',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'PDH',
          }))
        }
        if (sl.prev_low != null) {
          lines.push(candle.createPriceLine({
            price: sl.prev_low,
            color: '#EF4136',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'PDL',
          }))
        }
        if (sl.prev_close != null) {
          lines.push(candle.createPriceLine({
            price: sl.prev_close,
            color: '#949DA8',
            lineWidth: 1,
            lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true,
            title: 'PDC',
          }))
        }
        if (sl.opening_range_high != null) {
          lines.push(candle.createPriceLine({
            price: sl.opening_range_high,
            color: 'rgba(92,184,240,0.6)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'ORH',
          }))
        }
        if (sl.opening_range_low != null) {
          lines.push(candle.createPriceLine({
            price: sl.opening_range_low,
            color: 'rgba(92,184,240,0.6)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'ORL',
          }))
        }
      }

      // Direct PDH/PDL/PDC props (override sessionLevels if provided)
      if (pdh != null) {
        lines.push(candle.createPriceLine({
          price: pdh,
          color: 'rgba(0,135,87,0.7)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'PDH',
        }))
      }
      if (pdl != null) {
        lines.push(candle.createPriceLine({
          price: pdl,
          color: 'rgba(239,65,54,0.7)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'PDL',
        }))
      }
      if (pdc != null) {
        lines.push(candle.createPriceLine({
          price: pdc,
          color: 'rgba(148,157,168,0.7)',
          lineWidth: 1,
          lineStyle: LineStyle.SparseDotted,
          axisLabelVisible: true,
          title: 'PDC',
        }))
      }

      priceLineRefs.current = [...priceLineRefs.current, ...lines]
    }
  }, [showLevels, sessionLevels, pdh, pdl, pdc, showVp, volumeProfile])

  // ── Session separators (vertical markers) ─────────────────────────────────
  useEffect(() => {
    const plugin = markersPluginRef.current
    if (!plugin || !showSessionSeparators || bars.length === 0) {
      // Keep markers update handled in the combined markers effect below
      return
    }
    // Session boundaries are merged with pattern markers in the combined effect
  }, [showSessionSeparators, bars])

  // ── Markers: BOS/CHoCH + Pattern annotations + Session separators ──────────
  useEffect(() => {
    const plugin = markersPluginRef.current
    if (!plugin) return

    const markers: SeriesMarker<number>[] = []

    // Pattern annotations
    if (patternAnnotations && patternAnnotations.length > 0) {
      for (const p of patternAnnotations) {
        if (p.price != null) {
          markers.push({
            time: p.timestamp as number,
            position: p.direction === 'long' ? 'belowBar' : 'aboveBar',
            color:
              p.direction === 'long'
                ? '#008757'
                : p.direction === 'short'
                ? '#EF4136'
                : '#5CB8F0',
            shape:
              p.direction === 'long'
                ? 'arrowUp'
                : p.direction === 'short'
                ? 'arrowDown'
                : 'circle',
            text: p.pattern,
          })
        }
      }
    }

    // Session separator markers
    if (showSessionSeparators && bars.length > 0) {
      const boundaries = extractSessionBoundaries(bars)
      for (const b of boundaries) {
        markers.push({
          time: b.timestamp as number,
          position: 'aboveBar',
          color: '#3A3F4A',
          shape: 'square',
          text: b.label,
          size: 0,
        })
      }
    }

    // LWC requires markers sorted ascending by time
    markers.sort((a, b) => (a.time as number) - (b.time as number))
    plugin.setMarkers(markers)
  }, [structureBreaks, patternAnnotations, showSessionSeparators, bars])

  // ── Zone price lines ──────────────────────────────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove all previous zone lines
    zoneLinesRef.current.forEach((pl) => {
      try { candle.removePriceLine(pl) } catch { /* already removed */ }
    })
    zoneLinesRef.current = []

    if (!showZones || !zones || zones.length === 0) return

    for (const zone of zones) {
      if (zone.type === 'line') {
        const pl = candle.createPriceLine({
          price: zone.high,
          color: zone.color,
          lineWidth: 1,
          lineStyle:
            zone.label === 'POC' || zone.label === 'NPOC'
              ? LineStyle.Solid
              : LineStyle.Dashed,
          axisLabelVisible: true,
          title: zone.label,
        })
        zoneLinesRef.current.push(pl)
      } else if (zone.type === 'area') {
        // LWC v5 does not have native area fills between two price lines.
        // Draw the high and low boundaries as dotted lines instead.
        const plHigh = candle.createPriceLine({
          price: zone.high,
          color: zone.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false,
          title: zone.label,
        })
        const plLow = candle.createPriceLine({
          price: zone.low,
          color: zone.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false,
          title: '',
        })
        zoneLinesRef.current.push(plHigh, plLow)
      }
    }
  }, [showZones, zones])

  // ── Scroll to timestamp when feed item is clicked ─────────────────────────
  useEffect(() => {
    if (scrollToTimestamp == null) return
    const chart = chartRef.current
    if (!chart) return
    // Find the bar index whose timestamp is closest to the target
    const targetIdx = bars.reduce(
      (closest, bar, idx) =>
        Math.abs(bar.timestamp - scrollToTimestamp) <
        Math.abs(bars[closest].timestamp - scrollToTimestamp)
          ? idx
          : closest,
      0,
    )
    // Compute offset from the last bar (positive = scroll left into the past)
    const offsetFromEnd = bars.length - 1 - targetIdx
    chart.timeScale().scrollToPosition(-offsetFromEnd, true)
  }, [scrollToTimestamp, bars])

  // ── Drawing click handler ─────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current
    const candle = candleRef.current
    if (!chart || !candle || !onChartClick) return

    const handler = (param: { point?: { x: number; y: number }; time?: number }) => {
      if (!param.point || !param.time) return
      // Convert y pixel to price
      const price = candle.coordinateToPrice(param.point.y)
      if (price == null) return
      onChartClick(price, param.time as number)
    }

    chart.subscribeClick(handler)
    return () => {
      chart.unsubscribeClick(handler)
    }
  }, [onChartClick])

  // ── Drawings: render hlines as price lines ────────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    const incoming = drawings ?? []
    const existingIds = new Set(drawingLineRefs.current.keys())
    const incomingIds = new Set(incoming.map((d) => d.id))

    // Remove stale lines
    for (const id of existingIds) {
      if (!incomingIds.has(id)) {
        const line = drawingLineRefs.current.get(id)
        if (line) {
          try {
            candle.removePriceLine(line)
          } catch {
            // Already removed
          }
        }
        drawingLineRefs.current.delete(id)
      }
    }

    // Add new lines
    for (const drawing of incoming) {
      if (drawingLineRefs.current.has(drawing.id)) continue
      if (drawing.type === 'hline') {
        const hdata = drawing.data as { price: number }
        const line = candle.createPriceLine({
          price: hdata.price,
          color: drawing.color,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: '',
        })
        drawingLineRefs.current.set(drawing.id, line)
      }
      // rectangle / trendline / text are P2 — skipped for now
    }
  }, [drawings])

  // ── Loading / error / no-data states ─────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0A0D12',
        }}
      >
        <ChartSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0A0D12',
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: '#EF4136',
            letterSpacing: '0.05em',
          }}
        >
          {error}
        </span>
      </div>
    )
  }

  if (bars.length === 0) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0A0D12',
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: '#6E7681',
            letterSpacing: '0.05em',
          }}
        >
          No data
        </span>
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0A0D12',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 10,
            borderRadius: 2,
            background: '#272F3A',
            opacity: 0.5 - i * 0.06,
            width: `${85 - i * 7}%`,
          }}
        />
      ))}
      <div
        style={{
          marginTop: 'auto',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#6E7681',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
        }}
      >
        Loading chart...
      </div>
    </div>
  )
}

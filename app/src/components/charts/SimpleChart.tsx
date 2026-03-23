import { useEffect, useRef, useMemo, useState } from 'react'
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
import type { TradeSignal } from '../../hooks/useSignals'
import { VolumeProfileOverlay } from './VolumeProfileOverlay'
import { calculateVolumeProfile } from '@/lib/volume-profile'

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

interface DailyVolumeProfile {
  date: string
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
  // Overlay data
  vwapData?: VwapPoint[]
  emaData?: EmaPoint[]
  volumeProfile?: VolumeProfile | null
  /** Per-day volume profiles: yesterday shown as dashed, today as solid lines. */
  dailyVolumeProfiles?: DailyVolumeProfile[]
  sessionLevels?: SessionLevels | null
  structureBreaks?: StructureBreak[]
  patternAnnotations?: PatternAnnotation[]
  /** Opening range box overlay data (high/low price with time bounds). */
  openingRange?: { high: number; low: number; startTime: number; endTime: number } | null
  // Overlay visibility
  showVwap?: boolean
  showEma?: boolean
  showVp?: boolean
  showLevels?: boolean
  /** Whether to render the Opening Range Box overlay. */
  showOpeningRange?: boolean
  /** Whether to render BOS/CHoCH structure break markers. */
  showBosChoch?: boolean
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
  /** Trade signals from the proberun engine — renders entry/stop/target price lines. */
  signals?: TradeSignal[]
}

// ─── Refs state for overlay series ───────────────────────────────────────────

interface OverlaySeries {
  vwap: ISeriesApi<'Line'> | null
  ema9: ISeriesApi<'Line'> | null
  ema21: ISeriesApi<'Line'> | null
  ema50: ISeriesApi<'Line'> | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SimpleChart({
  bars,
  className,
  vwapData,
  emaData,
  volumeProfile,
  dailyVolumeProfiles,
  sessionLevels,
  structureBreaks,
  patternAnnotations,
  openingRange,
  showVwap = false,
  showEma = false,
  showVp = false,
  showLevels = false,
  showOpeningRange = true,
  showBosChoch = false,
  onChartReady,
  scrollToTimestamp,
  drawings,
  onChartClick,
  zones,
  showZones = false,
  signals,
}: SimpleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Track pixel dimensions for VP overlay positioning
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const chartRef = useRef<IChartApi | null>(null)
  // Candle series ref for price lines and markers
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  // Overlay series refs
  const overlayRef = useRef<OverlaySeries>({
    vwap: null,
    ema9: null,
    ema21: null,
    ema50: null,
  })
  // VP price line refs (rebuilt on VP data change)
  const vpLinesRef = useRef<IPriceLine[]>([])
  // Session / previous-day level price line refs
  const levelLinesRef = useRef<IPriceLine[]>([])
  // Markers plugin ref (LWC v5 uses createSeriesMarkers plugin)
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<import('lightweight-charts').Time> | null>(null)
  // Drawing price line refs keyed by drawing id
  const drawingLineRefs = useRef<Map<string, IPriceLine>>(new Map())
  // Zone price line refs (cleared and rebuilt whenever zones or showZones changes)
  const zoneLinesRef = useRef<IPriceLine[]>([])
  // Opening Range Box price line refs (OR High + OR Low)
  const orLinesRef = useRef<IPriceLine[]>([])
  // Signal level price line refs (entry/stop/target per signal, rebuilt on signals change)
  const signalLinesRef = useRef<IPriceLine[]>([])

  // ── Volume Profile: compute from bars (sidebar histogram) ─────────────────
  // binSize=2.0 is suitable for NQ (0.25-tick * 8 = 2 point bins)
  const computedVP = useMemo(() => {
    if (!showVp || bars.length === 0) return null
    return calculateVolumeProfile(bars, 2.0)
  }, [showVp, bars])

  // Visible price range for overlay coordinate mapping
  const visiblePriceRange = useMemo(() => {
    if (bars.length === 0) return { high: 0, low: 0 }
    return {
      high: Math.max(...bars.map((b) => b.high)),
      low: Math.min(...bars.map((b) => b.low)),
    }
  }, [bars])

  // ── Build chart on first mount (bars change re-creates chart) ──────────────
  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return

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
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#21262D', style: 3, width: 1, labelBackgroundColor: '#222830' },
        horzLine: { color: '#21262D', style: 3, width: 1, labelBackgroundColor: '#222830' },
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
    candleSeries.setData(
      bars.map((b) => ({
        time: b.timestamp as any,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    )
    candleRef.current = candleSeries

    // ── Volume bars ───────────────────────────────────────────────────────────
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeries.setData(
      bars.map((b) => ({
        time: b.timestamp as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(0,135,87,0.3)' : 'rgba(239,65,54,0.3)',
      }))
    )

    // ── VWAP overlay series — single white line, no SD bands ─────────────────
    const vwapSeries = chart.addSeries(LineSeries, {
      color: 'rgba(255,255,255,0.7)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    overlayRef.current.vwap = vwapSeries

    // ── EMA ribbon series ─────────────────────────────────────────────────────
    const ema9Series = chart.addSeries(LineSeries, {
      color: '#34D399',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const ema21Series = chart.addSeries(LineSeries, {
      color: '#58A6FF',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#A855F7',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
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

    chart.timeScale().fitContent()

    // Notify parent that chart is ready
    onChartReady?.(chart)

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        chart.applyOptions({ width: w, height: h })
        setChartSize({ width: w, height: h })
      }
    })
    ro.observe(containerRef.current)
    // Set initial size
    setChartSize({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      candleRef.current = null
      vpLinesRef.current = []
      levelLinesRef.current = []
      zoneLinesRef.current = []
      orLinesRef.current = []
      signalLinesRef.current = []
      markersPluginRef.current = null
      drawingLineRefs.current.clear()
      overlayRef.current = {
        vwap: null,
        ema9: null, ema21: null, ema50: null,
      }
    }
  }, [bars])

  // ── VWAP data + visibility ─────────────────────────────────────────────────
  useEffect(() => {
    const ov = overlayRef.current
    if (!ov.vwap) return

    const visible = !!(showVwap && vwapData && vwapData.length > 0)

    if (visible && vwapData) {
      const sorted = [...vwapData].sort((a, b) => a.timestamp - b.timestamp)
      ov.vwap.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.vwap })))
    }

    ov.vwap.applyOptions({ visible })
  }, [showVwap, vwapData])

  // ── EMA data + visibility ─────────────────────────────────────────────────
  useEffect(() => {
    const ov = overlayRef.current
    if (!ov.ema9) return

    const visible = !!(showEma && emaData && emaData.length > 0)

    if (visible && emaData) {
      const sorted = [...emaData].sort((a, b) => a.timestamp - b.timestamp)
      ov.ema9!.setData(sorted.map((e) => ({ time: e.timestamp as any, value: e.ema9 })))
      ov.ema21!.setData(sorted.map((e) => ({ time: e.timestamp as any, value: e.ema21 })))
      ov.ema50!.setData(sorted.map((e) => ({ time: e.timestamp as any, value: e.ema50 })))
    }

    ov.ema9!.applyOptions({ visible })
    ov.ema21!.applyOptions({ visible })
    ov.ema50!.applyOptions({ visible })
  }, [showEma, emaData])

  // ── Volume Profile price lines (per-day: yesterday dashed, today solid) ────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove all previous VP price lines
    vpLinesRef.current.forEach((pl) => {
      try { candle.removePriceLine(pl) } catch (_) { /* already removed */ }
    })
    vpLinesRef.current = []

    if (!showVp) return

    // Prefer daily profiles if available; fall back to aggregate volumeProfile
    if (dailyVolumeProfiles && dailyVolumeProfiles.length > 0) {
      const sorted = [...dailyVolumeProfiles].sort((a, b) => a.date.localeCompare(b.date))
      const todayProfile = sorted[sorted.length - 1]
      const yesterdayProfile = sorted.length >= 2 ? sorted[sorted.length - 2] : null

      const newLines: IPriceLine[] = []

      // Yesterday's VP — dashed lines
      if (yesterdayProfile) {
        newLines.push(
          candle.createPriceLine({
            price: yesterdayProfile.poc,
            color: '#FBBF24',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'ydPOC',
          }),
          candle.createPriceLine({
            price: yesterdayProfile.vah,
            color: '#5CB8F0',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'ydVAH',
          }),
          candle.createPriceLine({
            price: yesterdayProfile.val,
            color: '#5CB8F0',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'ydVAL',
          }),
        )
      }

      // Today's developing VP — solid lines
      newLines.push(
        candle.createPriceLine({
          price: todayProfile.poc,
          color: '#FBBF24',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'POC',
        }),
        candle.createPriceLine({
          price: todayProfile.vah,
          color: '#5CB8F0',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'VAH',
        }),
        candle.createPriceLine({
          price: todayProfile.val,
          color: '#5CB8F0',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'VAL',
        }),
      )

      vpLinesRef.current = newLines
    } else if (volumeProfile) {
      // Fallback: aggregate VP as solid lines
      vpLinesRef.current = [
        candle.createPriceLine({
          price: volumeProfile.poc,
          color: '#FBBF24',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'POC',
        }),
        candle.createPriceLine({
          price: volumeProfile.vah,
          color: '#5CB8F0',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'VAH',
        }),
        candle.createPriceLine({
          price: volumeProfile.val,
          color: '#5CB8F0',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'VAL',
        }),
      ]
    }
  }, [showVp, volumeProfile, dailyVolumeProfiles])

  // ── Session / Previous Day Levels price lines ─────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove all previous level lines (independent of VP lines)
    levelLinesRef.current.forEach((pl) => {
      try { candle.removePriceLine(pl) } catch (_) { /* already removed */ }
    })
    levelLinesRef.current = []

    if (showLevels && sessionLevels) {
      const sl = sessionLevels
      const lines: IPriceLine[] = []

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

      levelLinesRef.current = lines
    }
  }, [showLevels, sessionLevels])

  // ── Markers: BOS/CHoCH + Pattern annotations ───────────────────────────────
  useEffect(() => {
    const plugin = markersPluginRef.current
    if (!plugin) return

    const allMarkers: SeriesMarker<import('lightweight-charts').Time>[] = []

    // BOS/CHoCH structure break markers (limited to last 5 to reduce clutter)
    if (showBosChoch && structureBreaks && structureBreaks.length > 0) {
      const limited = structureBreaks.slice(-5)
      for (const sb of limited) {
        const isBullish = sb.direction === 'bullish' || sb.direction === 'long'
        allMarkers.push({
          time: sb.timestamp as import('lightweight-charts').Time,
          position: isBullish ? 'belowBar' : 'aboveBar',
          color: isBullish ? '#22C55E' : '#EF4444',
          shape: sb.type === 'CHoCH' ? 'circle' : isBullish ? 'arrowUp' : 'arrowDown',
          text: sb.type,
          size: 1,
        })
      }
    }

    // Pattern annotations (only clear setups with entry/target, limited to last 5)
    if (patternAnnotations && patternAnnotations.length > 0) {
      const limited = patternAnnotations.slice(-5)
      let positionToggle = false
      for (const p of limited) {
        if (p.price != null) {
          // Alternate aboveBar/belowBar for neutral markers to avoid vertical stacking
          const position =
            p.direction === 'long'
              ? 'belowBar'
              : p.direction === 'short'
              ? 'aboveBar'
              : (positionToggle = !positionToggle) ? 'aboveBar' : 'belowBar'
          const label = p.pattern.length > 12 ? p.pattern.slice(0, 10) + '..' : p.pattern
          allMarkers.push({
            time: p.timestamp as import('lightweight-charts').Time,
            position,
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
            text: label,
            size: 1,
          })
        }
      }
    }

    // LWC requires markers sorted ascending by time
    allMarkers.sort((a, b) => (a.time as number) - (b.time as number))

    // Deduplicate by 60-second bucket — keep first marker per bucket
    const deduped = new Map<number, SeriesMarker<import('lightweight-charts').Time>>()
    for (const m of allMarkers) {
      const bucket = Math.floor((m.time as number) / 60) * 60
      if (!deduped.has(bucket)) {
        deduped.set(bucket, m)
      }
    }

    plugin.setMarkers(Array.from(deduped.values()))
  }, [showBosChoch, structureBreaks, patternAnnotations])

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

  // ── Opening Range Box price lines ─────────────────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove previous OR lines
    orLinesRef.current.forEach((pl) => {
      try { candle.removePriceLine(pl) } catch { /* already removed */ }
    })
    orLinesRef.current = []

    if (!showOpeningRange || !openingRange) return

    const orHigh = candle.createPriceLine({
      price: openingRange.high,
      color: 'rgba(92, 184, 240, 0.4)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OR High',
    })
    const orLow = candle.createPriceLine({
      price: openingRange.low,
      color: 'rgba(92, 184, 240, 0.4)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OR Low',
    })
    orLinesRef.current = [orHigh, orLow]
  }, [showOpeningRange, openingRange])

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

    const handler = (param: import('lightweight-charts').MouseEventParams<import('lightweight-charts').Time>) => {
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

  // ── Signal entry / stop / target price lines + direction markers ─────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove previous signal lines
    signalLinesRef.current.forEach((pl) => {
      try { candle.removePriceLine(pl) } catch { /* already removed */ }
    })
    signalLinesRef.current = []

    if (!signals || signals.length === 0) return

    // Render last 3 signals to avoid visual noise
    const recent = signals.slice(-3)
    const newLines: IPriceLine[] = []

    for (const sig of recent) {
      newLines.push(
        candle.createPriceLine({
          price: sig.entry_price,
          color: 'rgba(255,255,255,0.6)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Entry',
        }),
        candle.createPriceLine({
          price: sig.stop_price,
          color: 'rgba(239,68,68,0.4)',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'Stop',
        }),
        candle.createPriceLine({
          price: sig.target_price,
          color: 'rgba(34,197,94,0.4)',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'Target',
        }),
      )
    }

    signalLinesRef.current = newLines

    // Signal direction markers (arrow up/down at signal timestamp)
    const plugin = markersPluginRef.current
    if (!plugin) return

    // Merge with existing markers is not straightforward since setMarkers replaces all.
    // Retrieve current markers then append signal markers.
    const sigMarkers: SeriesMarker<import('lightweight-charts').Time>[] = recent.map((sig) => ({
      time: sig.timestamp as import('lightweight-charts').Time,
      position: sig.direction === 'long' ? 'belowBar' : 'aboveBar',
      color: sig.direction === 'long' ? '#22C55E' : '#EF4444',
      shape: sig.direction === 'long' ? 'arrowUp' : 'arrowDown',
      text: sig.signal_type,
      size: 1,
    }))

    // Sort ascending as required by LWC
    sigMarkers.sort((a, b) => (a.time as number) - (b.time as number))
    plugin.setMarkers(sigMarkers)
  }, [signals])

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {computedVP && chartSize.height > 0 && (
        <VolumeProfileOverlay
          bins={computedVP.bins}
          poc={computedVP.poc}
          vah={computedVP.vah}
          val={computedVP.val}
          chartHeight={chartSize.height}
          priceHigh={visiblePriceRange.high}
          priceLow={visiblePriceRange.low}
          visible={showVp}
        />
      )}
    </div>
  )
}

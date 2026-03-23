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
  // Overlay data
  vwapData?: VwapPoint[]
  emaData?: EmaPoint[]
  volumeProfile?: VolumeProfile | null
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

// ─── Component ───────────────────────────────────────────────────────────────

export function SimpleChart({
  bars,
  className,
  vwapData,
  emaData,
  volumeProfile,
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
}: SimpleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // Candle series ref for price lines and markers
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
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
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<import('lightweight-charts').Time> | null>(null)
  // Drawing price line refs keyed by drawing id
  const drawingLineRefs = useRef<Map<string, IPriceLine>>(new Map())
  // Zone price line refs (cleared and rebuilt whenever zones or showZones changes)
  const zoneLinesRef = useRef<IPriceLine[]>([])
  // Opening Range Box price line refs (OR High + OR Low)
  const orLinesRef = useRef<IPriceLine[]>([])

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

    // ── VWAP overlay series (always added, visibility controlled) ─────────────
    const vwapSeries = chart.addSeries(LineSeries, {
      color: 'rgba(251,191,36,0.9)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapUp1Series = chart.addSeries(LineSeries, {
      color: 'rgba(251,191,36,0.35)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapDn1Series = chart.addSeries(LineSeries, {
      color: 'rgba(251,191,36,0.35)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapUp2Series = chart.addSeries(LineSeries, {
      color: 'rgba(251,191,36,0.15)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapDn2Series = chart.addSeries(LineSeries, {
      color: 'rgba(251,191,36,0.15)',
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
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      candleRef.current = null
      priceLineRefs.current = []
      zoneLinesRef.current = []
      orLinesRef.current = []
      markersPluginRef.current = null
      drawingLineRefs.current.clear()
      overlayRef.current = {
        vwap: null, vwapUp1: null, vwapDn1: null,
        vwapUp2: null, vwapDn2: null,
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
      ov.vwapUp1!.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.upper_1 })))
      ov.vwapDn1!.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.lower_1 })))
      ov.vwapUp2!.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.upper_2 })))
      ov.vwapDn2!.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.lower_2 })))
    }

    ov.vwap.applyOptions({ visible })
    ov.vwapUp1!.applyOptions({ visible })
    ov.vwapDn1!.applyOptions({ visible })
    ov.vwapUp2!.applyOptions({ visible })
    ov.vwapDn2!.applyOptions({ visible })
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

  // ── Volume Profile price lines ────────────────────────────────────────────
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return

    // Remove existing VP price lines
    priceLineRefs.current
      .filter((_, i) => i < 3)
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

    // Remove existing level price lines (stored after VP lines, i.e. index 3+)
    // We keep a separate ref slice for levels
    const vpCount = showVp && volumeProfile ? 3 : 0
    priceLineRefs.current
      .slice(vpCount)
      .forEach((pl) => {
        try { candle.removePriceLine(pl) } catch (_) { /* already removed */ }
      })
    priceLineRefs.current = priceLineRefs.current.slice(0, vpCount)

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

      priceLineRefs.current = [...priceLineRefs.current, ...lines]
    }
  }, [showLevels, sessionLevels, showVp, volumeProfile])

  // ── Markers: BOS/CHoCH + Pattern annotations ───────────────────────────────
  useEffect(() => {
    const plugin = markersPluginRef.current
    if (!plugin) return

    const markers: SeriesMarker<import('lightweight-charts').Time>[] = []

    // BOS/CHoCH structure break markers (limited to last 20 to prevent clutter)
    if (showBosChoch && structureBreaks && structureBreaks.length > 0) {
      const limited = structureBreaks.slice(-20)
      for (const sb of limited) {
        const isBullish = sb.direction === 'bullish' || sb.direction === 'long'
        markers.push({
          time: sb.timestamp as import('lightweight-charts').Time,
          position: isBullish ? 'belowBar' : 'aboveBar',
          color: isBullish ? '#22C55E' : '#EF4444',
          shape: sb.type === 'CHoCH' ? 'circle' : isBullish ? 'arrowUp' : 'arrowDown',
          text: sb.type,
        })
      }
    }

    // Pattern annotations (only clear setups with entry/target)
    if (patternAnnotations && patternAnnotations.length > 0) {
      for (const p of patternAnnotations) {
        if (p.price != null) {
          markers.push({
            time: p.timestamp as import('lightweight-charts').Time,
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

    // LWC requires markers sorted ascending by time
    markers.sort((a, b) => (a.time as number) - (b.time as number))
    plugin.setMarkers(markers)
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

  return <div ref={containerRef} className={className} />
}

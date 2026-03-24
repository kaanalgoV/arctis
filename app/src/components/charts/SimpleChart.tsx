import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
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
import { CHART_TOKENS } from '@/lib/chart-tokens'

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
  /** Whether to show the volume histogram bars. Defaults to true. */
  showVolume?: boolean
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
  vwapUpper1: ISeriesApi<'Line'> | null
  vwapLower1: ISeriesApi<'Line'> | null
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
  volumeProfile: _volumeProfile,
  dailyVolumeProfiles: _dailyVolumeProfiles,
  sessionLevels,
  structureBreaks,
  patternAnnotations,
  openingRange,
  showVwap = false,
  showEma = false,
  /** Whether the volume histogram is visible. Defaults to true. */
  showVolume = true,
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
  // Volume series ref (hoisted so data update effect can call setData)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  // Overlay series refs
  const overlayRef = useRef<OverlaySeries>({
    vwap: null,
    vwapUpper1: null,
    vwapLower1: null,
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
  // Marker refs for merge: BOS/pattern markers and signal markers are stored separately
  // and combined before calling plugin.setMarkers() to avoid overwrite conflicts.
  const bosMarkersRef = useRef<SeriesMarker<import('lightweight-charts').Time>[]>([])
  const signalMarkersRef = useRef<SeriesMarker<import('lightweight-charts').Time>[]>([])
  // Track whether this is the first data load (to call fitContent only once)
  const isFirstLoadRef = useRef(true)

  // ── Volume Profile: compute from bars (sidebar histogram) ─────────────────
  // binSize=2.0 is suitable for NQ (0.25-tick * 8 = 2 point bins)
  const computedVP = useMemo(() => {
    if (!showVp || bars.length === 0) return null
    return calculateVolumeProfile(bars, 2.0)
  }, [showVp, bars])

  // Visible price range for overlay coordinate mapping
  const [visiblePriceRange, setVisiblePriceRange] = useState({ high: 0, low: 0 })

  // Update visible price range from chart's visible logical range
  const updateVisibleRange = useCallback(() => {
    const chart = chartRef.current
    const candle = candleRef.current
    if (!chart || !candle || bars.length === 0) return

    const logicalRange = chart.timeScale().getVisibleLogicalRange()
    if (!logicalRange) return

    const from = Math.max(0, Math.floor(logicalRange.from))
    const to = Math.min(bars.length - 1, Math.ceil(logicalRange.to))

    let high = -Infinity
    let low = Infinity
    for (let i = from; i <= to; i++) {
      if (bars[i]) {
        high = Math.max(high, bars[i].high)
        low = Math.min(low, bars[i].low)
      }
    }
    if (high > low) {
      setVisiblePriceRange({ high, low })
    }
  }, [bars])

  // ── Chart creation: runs ONCE on mount ────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: CHART_TOKENS.paper },
        textColor: '#6E7681',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: true, color: 'rgba(255,255,255,0.02)', style: 3 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: CHART_TOKENS.crosshair.line, style: 3, width: 1, labelBackgroundColor: CHART_TOKENS.crosshair.labelBackground },
        horzLine: { color: CHART_TOKENS.crosshair.line, style: 3, width: 1, labelBackgroundColor: CHART_TOKENS.crosshair.labelBackground },
      },
      rightPriceScale: {
        borderColor: 'var(--color-border-subtle)',
        autoScale: true,
        scaleMargins: { top: 0.05, bottom: 0.12 },
      },
      timeScale: {
        borderColor: 'var(--color-border-subtle)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
    })
    chartRef.current = chart

    // ── Candlesticks ──────────────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_TOKENS.candle.bull,
      downColor: CHART_TOKENS.candle.bear,
      borderUpColor: CHART_TOKENS.candle.bull,
      borderDownColor: CHART_TOKENS.candle.bear,
      wickUpColor: CHART_TOKENS.candle.bull,
      wickDownColor: CHART_TOKENS.candle.bear,
    })
    candleRef.current = candleSeries

    // ── Volume bars ───────────────────────────────────────────────────────────
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: false,
    })
    volumeSeriesRef.current = volumeSeries

    // ── VWAP overlay series — single white line, no SD bands ─────────────────
    const vwapSeries = chart.addSeries(LineSeries, {
      color: CHART_TOKENS.overlay.vwap,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    overlayRef.current.vwap = vwapSeries

    // ── VWAP 1-SD band series ─────────────────────────────────────────────────
    const vwapUpper1Series = chart.addSeries(LineSeries, {
      color: CHART_TOKENS.overlay.vwapBand,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwapLower1Series = chart.addSeries(LineSeries, {
      color: CHART_TOKENS.overlay.vwapBand,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    overlayRef.current.vwapUpper1 = vwapUpper1Series
    overlayRef.current.vwapLower1 = vwapLower1Series

    // ── EMA ribbon series ─────────────────────────────────────────────────────
    const ema9Series = chart.addSeries(LineSeries, {
      color: '#5AAED8',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const ema21Series = chart.addSeries(LineSeries, {
      color: '#7CC5E8',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#64748b',
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

    // Notify parent that chart is ready
    onChartReady?.(chart)

    // ── Subscribe to visible range changes (for VP overlay) ─────────────────
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      updateVisibleRange()
    })

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
      volumeSeriesRef.current = null
      vpLinesRef.current = []
      levelLinesRef.current = []
      zoneLinesRef.current = []
      orLinesRef.current = []
      signalLinesRef.current = []
      markersPluginRef.current = null
      drawingLineRefs.current.clear()
      overlayRef.current = {
        vwap: null,
        vwapUpper1: null,
        vwapLower1: null,
        ema9: null, ema21: null, ema50: null,
      }
      isFirstLoadRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Data update: runs when bars change, does NOT recreate chart ────────────
  const prevBarCountRef = useRef(0)

  useEffect(() => {
    const candleSeries = candleRef.current
    const volumeSeries = volumeSeriesRef.current
    if (!candleSeries || !volumeSeries || bars.length === 0) return

    candleSeries.setData(
      bars.map((b) => ({
        time: b.timestamp as any,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    )

    volumeSeries.setData(
      bars.map((b) => ({
        time: b.timestamp as any,
        value: b.volume,
        color: b.close >= b.open ? CHART_TOKENS.overlay.volume.bull : CHART_TOKENS.overlay.volume.bear,
      }))
    )

    const chart = chartRef.current
    if (chart) {
      const prevCount = prevBarCountRef.current
      const newCount = bars.length

      if (prevCount === 0 && newCount > 0) {
        // First load: zoom to show last N bars
        const visible = Math.min(newCount, newCount > 500 ? 120 : 80)
        if (newCount > visible) {
          chart.timeScale().setVisibleLogicalRange({
            from: newCount - visible,
            to: newCount + 5,
          })
        } else {
          chart.timeScale().fitContent()
        }
        isFirstLoadRef.current = false
      } else if (newCount > prevCount) {
        // New bars arrived: scroll right to keep latest bar visible
        chart.timeScale().scrollToRealTime()
      }
      // Same count but updated last bar (live candle): no scroll needed,
      // setData already updated the candle visually

      prevBarCountRef.current = newCount
    }

    requestAnimationFrame(() => updateVisibleRange())
  }, [bars, updateVisibleRange])

  // ── VWAP data + visibility ─────────────────────────────────────────────────
  useEffect(() => {
    const ov = overlayRef.current
    if (!ov.vwap) return

    const visible = !!(showVwap && vwapData && vwapData.length > 0)

    if (visible && vwapData) {
      const sorted = [...vwapData].sort((a, b) => a.timestamp - b.timestamp)
      ov.vwap.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.vwap })))

      // SD bands (1-sigma upper/lower) — only if data contains the fields
      const hasBands = sorted.length > 0 && sorted[0].upper_1 != null && sorted[0].lower_1 != null
      if (hasBands && ov.vwapUpper1 && ov.vwapLower1) {
        ov.vwapUpper1.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.upper_1 })))
        ov.vwapLower1.setData(sorted.map((v) => ({ time: v.timestamp as any, value: v.lower_1 })))
      }
    }

    ov.vwap.applyOptions({ visible })
    if (ov.vwapUpper1) ov.vwapUpper1.applyOptions({ visible })
    if (ov.vwapLower1) ov.vwapLower1.applyOptions({ visible })
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

  // ── Volume histogram visibility ────────────────────────────────────────────
  useEffect(() => {
    const volSeries = volumeSeriesRef.current
    if (!volSeries) return
    volSeries.applyOptions({ visible: showVolume })
  }, [showVolume])

  // ── Volume Profile — sidebar histogram renders VP, cleanup old price lines ──
  useEffect(() => {
    const candle = candleRef.current
    if (!candle) return
    // Remove any leftover VP price lines (sidebar histogram handles rendering now)
    vpLinesRef.current.forEach((pl) => {
      try { candle.removePriceLine(pl) } catch (_) { /* already removed */ }
    })
    vpLinesRef.current = []
  }, [showVp])

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
          color: 'rgba(90,174,216,0.65)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'PDH',
        }))
      }
      if (sl.prev_low != null) {
        lines.push(candle.createPriceLine({
          price: sl.prev_low,
          color: 'rgba(248,113,113,0.6)',
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

  // ── Helper: merge bosMarkersRef + signalMarkersRef and call setMarkers once ─
  const flushMarkers = () => {
    const plugin = markersPluginRef.current
    if (!plugin) return
    const combined = [...bosMarkersRef.current, ...signalMarkersRef.current]
    combined.sort((a, b) => (a.time as number) - (b.time as number))
    plugin.setMarkers(combined)
  }

  // ── Markers: BOS/CHoCH + Pattern annotations ───────────────────────────────
  useEffect(() => {
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

    bosMarkersRef.current = Array.from(deduped.values())
    flushMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      color: 'rgba(92, 184, 240, 0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OR High',
    })
    const orLow = candle.createPriceLine({
      price: openingRange.low,
      color: 'rgba(92, 184, 240, 0.7)',
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

    // Store in ref and flush combined markers to avoid overwriting BOS markers
    signalMarkersRef.current = sigMarkers
    flushMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signals])

  const handleRecenter = useCallback(() => {
    const chart = chartRef.current
    if (!chart || bars.length === 0) return
    const n = bars.length
    const visible = n > 500 ? 120 : Math.min(n, 80)
    if (n > visible) {
      chart.timeScale().setVisibleLogicalRange({ from: n - visible, to: n + 5 })
    } else {
      chart.timeScale().fitContent()
    }
  }, [bars])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Subtle radial gradient — sits beneath the LWC canvas, adds depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(92,184,240,0.03) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

      {/* Re-center button — top right corner */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Zum aktuellen Preis zentrieren"
        className="absolute top-2 right-14 z-10 flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)]/80 backdrop-blur-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] transition-all duration-150 cursor-pointer border border-[var(--color-border-subtle)]"
        aria-label="Re-center chart"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      </button>
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

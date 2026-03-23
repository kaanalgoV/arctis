// @ts-nocheck -- deprecated SciChart component, not used in production
import { useEffect, useRef } from 'react'
import {
  SciChartSurface,
  NumericAxis,
  CategoryAxis,
  OhlcDataSeries,
  XyDataSeries,
  FastCandlestickRenderableSeries,
  FastColumnRenderableSeries,
  FastLineRenderableSeries,
  MouseWheelZoomModifier,
  ZoomPanModifier,
  ZoomExtentsModifier,
  CursorModifier,
  EAutoRange,
  EAxisAlignment,
  NumberRange,
  EFillPaletteMode,
  EStrokePaletteMode,
  parseColorToUIntArgb,
  type IFillPaletteProvider,
  type IStrokePaletteProvider,
  type IRenderableSeries,
  type IPointMetadata,
  type TWebAssemblyChart,
} from 'scichart'
import { initSciChart } from '../../lib/scichart-init'
import { CHART_TOKENS } from '../../lib/chart-tokens'
import type { OHLCVBar } from '../../types/market'

// ─── Volume PaletteProvider ────────────────────────────────────────────────

/**
 * Colors each volume bar based on whether the corresponding candle closed up
 * (bull) or down (bear). The opens array is passed in at construction time so
 * the palette can compare open vs close per-index.
 */
class VolumePaletteProvider implements IFillPaletteProvider, IStrokePaletteProvider {
  readonly fillPaletteMode = EFillPaletteMode.SOLID
  readonly strokePaletteMode = EStrokePaletteMode.SOLID

  private readonly bullFill: number
  private readonly bearFill: number
  private opens: number[]
  private closes: number[]

  constructor(opens: number[], closes: number[]) {
    this.opens = opens
    this.closes = closes
    this.bullFill = parseColorToUIntArgb(CHART_TOKENS.overlay.volume.bull)
    this.bearFill = parseColorToUIntArgb(CHART_TOKENS.overlay.volume.bear)
  }

  /** Called when the palette is attached to a series — no action needed. */
  onAttached(_series: IRenderableSeries): void {}

  /** Called when the palette is detached from a series — no action needed. */
  onDetached(): void {}

  overrideFillArgb(
    _xValue: number,
    _yValue: number,
    index: number,
    _opacity?: number,
    _metadata?: IPointMetadata,
  ): number | undefined {
    const open = this.opens[index]
    const close = this.closes[index]
    if (open === undefined || close === undefined) return undefined
    return close >= open ? this.bullFill : this.bearFill
  }

  overrideStrokeArgb(
    _xValue: number,
    _yValue: number,
    index: number,
    _opacity?: number,
    _metadata?: IPointMetadata,
  ): number | undefined {
    return this.overrideFillArgb(_xValue, _yValue, index)
  }

  /** Update open/close arrays when data changes without recreating the provider. */
  update(opens: number[], closes: number[]): void {
    this.opens = opens
    this.closes = closes
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export interface ArctisCandlestickChartProps {
  bars: OHLCVBar[]
  vwapData?: { time: number; value: number }[]
  className?: string
}

const VOLUME_Y_AXIS_ID = 'volumeYAxis'

export function ArctisCandlestickChart({
  bars,
  vwapData,
  className,
}: ArctisCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Holds the SciChart surface so we can clean up on unmount.
  const chartRef = useRef<TWebAssemblyChart | null>(null)
  // Tracks whether the async init has been cancelled (component unmounted
  // before init finished).
  const mountedRef = useRef(true)
  // Palette provider ref so we can call .update() on data changes.
  const paletteRef = useRef<VolumePaletteProvider | null>(null)

  // ── Initial chart build ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    async function build() {
      if (!containerRef.current) return

      await initSciChart()

      if (!mountedRef.current) return

      const { sciChartSurface, wasmContext } = await SciChartSurface.create(
        containerRef.current,
        {
          background: CHART_TOKENS.paper,
        },
      )

      if (!mountedRef.current) {
        sciChartSurface.delete()
        return
      }

      // ── X Axis (category, collapses gaps) ────────────────────────────────
      const xAxis = new CategoryAxis(wasmContext, {
        autoRange: EAutoRange.Once,
        labelStyle: { color: CHART_TOKENS.axis.label },
        axisBorder: { color: CHART_TOKENS.axis.border, borderTop: 1 },
        majorGridLineStyle: { color: CHART_TOKENS.grid.major, strokeThickness: 1 },
        minorGridLineStyle: { color: CHART_TOKENS.grid.minor, strokeThickness: 1 },
        drawMinorGridLines: true,
        drawMajorGridLines: true,
      })
      sciChartSurface.xAxes.add(xAxis)

      // ── Y Axis — price (right side) ───────────────────────────────────────
      const yAxis = new NumericAxis(wasmContext, {
        axisAlignment: EAxisAlignment.Right,
        autoRange: EAutoRange.Always,
        labelStyle: { color: CHART_TOKENS.axis.label },
        axisBorder: { color: CHART_TOKENS.axis.border, borderLeft: 1 },
        majorGridLineStyle: { color: CHART_TOKENS.grid.major, strokeThickness: 1 },
        minorGridLineStyle: { color: CHART_TOKENS.grid.minor, strokeThickness: 1 },
        drawMinorGridLines: false,
        drawMajorGridLines: true,
        growBy: new NumberRange(0.05, 0.05),
      })
      sciChartSurface.yAxes.add(yAxis)

      // ── Y Axis — volume (invisible, bottom 20% via growBy) ───────────────
      //
      // growBy(0, 4) means the axis top is padded by 4× the data range above
      // the max, which pushes the data into the bottom ~1/(1+4) = 20% of the
      // viewport height.
      const volumeYAxis = new NumericAxis(wasmContext, {
        id: VOLUME_Y_AXIS_ID,
        axisAlignment: EAxisAlignment.Right,
        autoRange: EAutoRange.Always,
        isVisible: false,
        growBy: new NumberRange(0, 4),
      })
      sciChartSurface.yAxes.add(volumeYAxis)

      // ── Data extraction ──────────────────────────────────────────────────
      const opens = bars.map((b) => b.open)
      const closes = bars.map((b) => b.close)
      const timestamps = bars.map((b) => b.timestamp)
      const highs = bars.map((b) => b.high)
      const lows = bars.map((b) => b.low)
      const volumes = bars.map((b) => b.volume)
      const indices = bars.map((_, i) => i)

      // ── Candlestick series ───────────────────────────────────────────────
      const ohlcDs = new OhlcDataSeries(wasmContext, {
        xValues: timestamps,
        openValues: opens,
        highValues: highs,
        lowValues: lows,
        closeValues: closes,
      })
      const candleSeries = new FastCandlestickRenderableSeries(wasmContext, {
        dataSeries: ohlcDs,
        strokeUp: CHART_TOKENS.candle.bull,
        strokeDown: CHART_TOKENS.candle.bear,
        brushUp: CHART_TOKENS.candle.bull,
        brushDown: CHART_TOKENS.candle.bear,
        strokeThickness: 1,
      })
      sciChartSurface.renderableSeries.add(candleSeries)

      // ── Volume bars ──────────────────────────────────────────────────────
      const palette = new VolumePaletteProvider(opens, closes)
      paletteRef.current = palette

      const volumeDs = new XyDataSeries(wasmContext, {
        xValues: indices,
        yValues: volumes,
      })
      const volumeSeries = new FastColumnRenderableSeries(wasmContext, {
        dataSeries: volumeDs,
        yAxisId: VOLUME_Y_AXIS_ID,
        fill: CHART_TOKENS.overlay.volume.bull, // default, overridden by palette
        stroke: 'transparent',
        strokeThickness: 0,
        dataPointWidth: 0.6,
        paletteProvider: palette,
      })
      sciChartSurface.renderableSeries.add(volumeSeries)

      // ── VWAP line ────────────────────────────────────────────────────────
      if (vwapData && vwapData.length > 0) {
        const vwapDs = new XyDataSeries(wasmContext, {
          xValues: vwapData.map((d) => d.time),
          yValues: vwapData.map((d) => d.value),
        })
        const vwapSeries = new FastLineRenderableSeries(wasmContext, {
          dataSeries: vwapDs,
          stroke: CHART_TOKENS.overlay.vwap,
          strokeThickness: 1,
          opacity: 0.6,
        })
        sciChartSurface.renderableSeries.add(vwapSeries)
      }

      // ── Chart modifiers ──────────────────────────────────────────────────
      sciChartSurface.chartModifiers.add(
        new MouseWheelZoomModifier(),
        new ZoomPanModifier({ enableZoom: false }),
        new ZoomExtentsModifier({ isAnimated: false }),
        new CursorModifier({
          showTooltip: false,
          crosshairStroke: CHART_TOKENS.crosshair.line,
          crosshairStrokeThickness: 1,
          axisLabelFill: CHART_TOKENS.crosshair.labelBackground,
        }),
      )

      chartRef.current = { sciChartSurface, wasmContext }
    }

    build().catch((err) => {
      if (mountedRef.current) {
        console.error('[ArctisCandlestickChart] init error:', err)
      }
    })

    return () => {
      mountedRef.current = false
      if (chartRef.current) {
        chartRef.current.sciChartSurface.delete()
        chartRef.current = null
        paletteRef.current = null
      }
    }
    // We intentionally run this effect only once (mount/unmount).
    // Data updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Data update effect ───────────────────────────────────────────────────
  // When bars or vwapData change after the chart is already built, we update
  // the existing data series directly — no re-creation needed.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || bars.length === 0) return

    const { sciChartSurface, wasmContext } = chart
    const series = sciChartSurface.renderableSeries

    // ── Candlestick ───────────────────────────────────────────────────────
    const candleSeries = series.get(0) as FastCandlestickRenderableSeries | undefined
    if (candleSeries) {
      const ds = candleSeries.dataSeries as OhlcDataSeries
      ds.clear()
      ds.appendRange(
        bars.map((b) => b.timestamp),
        bars.map((b) => b.open),
        bars.map((b) => b.high),
        bars.map((b) => b.low),
        bars.map((b) => b.close),
      )
    }

    // ── Volume ────────────────────────────────────────────────────────────
    const volumeSeries = series.get(1) as FastColumnRenderableSeries | undefined
    if (volumeSeries) {
      const opens = bars.map((b) => b.open)
      const closes = bars.map((b) => b.close)
      paletteRef.current?.update(opens, closes)

      const ds = volumeSeries.dataSeries as XyDataSeries
      ds.clear()
      const indices = bars.map((_, i) => i)
      const volumes = bars.map((b) => b.volume)
      ds.appendRange(indices, volumes)
    }

    // ── VWAP ──────────────────────────────────────────────────────────────
    // The VWAP series is at index 2 if it was created, otherwise we create it
    // now if data has arrived. If vwapData is removed, we hide/clear it.
    if (series.size() >= 3) {
      const vwapSeries = series.get(2) as FastLineRenderableSeries | undefined
      if (vwapSeries) {
        const ds = vwapSeries.dataSeries as XyDataSeries
        ds.clear()
        if (vwapData && vwapData.length > 0) {
          ds.appendRange(
            vwapData.map((d) => d.time),
            vwapData.map((d) => d.value),
          )
          vwapSeries.isVisible = true
        } else {
          vwapSeries.isVisible = false
        }
      }
    } else if (vwapData && vwapData.length > 0) {
      // VWAP series does not exist yet — create it lazily
      const vwapDs = new XyDataSeries(wasmContext, {
        xValues: vwapData.map((d) => d.time),
        yValues: vwapData.map((d) => d.value),
      })
      const vwapSeries = new FastLineRenderableSeries(wasmContext, {
        dataSeries: vwapDs,
        stroke: CHART_TOKENS.overlay.vwap,
        strokeThickness: 1,
        opacity: 0.6,
      })
      sciChartSurface.renderableSeries.add(vwapSeries)
    }
  }, [bars, vwapData])

  // ── Render ───────────────────────────────────────────────────────────────

  if (bars.length === 0) {
    return (
      <div
        className={className}
        style={{
          background: CHART_TOKENS.paper,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: CHART_TOKENS.axis.label,
          fontSize: '0.8rem',
          letterSpacing: '0.06em',
        }}
      >
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: CHART_TOKENS.paper,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      {/* Simulated candle bars */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 3,
            background: CHART_TOKENS.axis.border,
            opacity: 0.5 - i * 0.07,
            width: `${80 - i * 8}%`,
          }}
        />
      ))}
      <div
        style={{
          marginTop: 'auto',
          color: CHART_TOKENS.axis.label,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        }}
      >
        Loading chart data...
      </div>
    </div>
  )
}

// Ported from AlgoView CandlestickChart - Arctis
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef, useId } from 'react';
import {
  SciChartSurface,
  CategoryAxis,
  NumericAxis,
  FastCandlestickRenderableSeries,
  FastOhlcRenderableSeries,
  FastLineRenderableSeries,
  FastMountainRenderableSeries,
  FastColumnRenderableSeries,
  OhlcDataSeries,
  XyDataSeries,
  HorizontalLineAnnotation,
  ZoomPanModifier,
  ZoomExtentsModifier,
  MouseWheelZoomModifier,
  CursorModifier,
  EAutoRange,
  NumberRange,
  ENumericFormat,
  EXyDirection,
  SciChartJsNavyTheme,
  BoxAnnotation,
  TextLabelProvider,
  ELabelPlacement,
  parseColorToUIntArgb,
  EStrokePaletteMode,
  EFillPaletteMode,
  type IRenderableSeries,
  type IStrokePaletteProvider,
  type IFillPaletteProvider,
} from 'scichart';
import type { Candle } from '@/types/domain';
import type { TradeMarker, TradeZone, ActiveIndicator, IndicatorStyle } from '@/types/chart';
import type { IndicatorResult } from '@/types/api';
import type { DrawingToolType, WipDrawing, ChartDrawing } from '@/types/drawing';
import type { ChartType } from '@/types/chart';
import { useChartSettings } from '@/contexts/ChartSettingsContext';
import { useDrawingStore, GLOBAL_DEFAULTS } from '@/stores/drawingStore';
import { CHART_TOKENS } from '@/lib/chart-tokens';
import { registerSurface, unregisterSurface, initHmrCleanup } from '@/lib/scichart-hmr';
import { ensureSciChartInitialized } from '@/lib/scichart-init';
import { formatChartAxisTime } from '@/utils/chartTimeZone';

// Configuration constants
// Show ~10 hours of 5-minute bars on initial load (covers full trading day including premarket).
// Show ~3 hours of 5min bars = 36 bars. Current session focus.
// User scrolls left for more history. 36 bars gives good candle size.
const INITIAL_VIEW_CANDLES = 36;

// HMR cleanup for this module
initHmrCleanup(import.meta.hot);

// Extracted modules
import { YAxisDragZoomModifier, XAxisDragZoomModifier, DrawingModifier, CrosshairDataModifier } from './modifiers';
import type { CrosshairCandleData } from './modifiers';
export type { CrosshairCandleData } from './modifiers';
import {
  createTradeMarkers,
  createTradeZones,
  createTradeLines,
  createSessionSeparators,
  createRenderInstructionAnnotations,
  createDrawingAnnotation,
  createContractLabels,
  type AnnotationContext,
} from './annotations';
import { useTimestampIndex, useSessionIndices } from './hooks';

interface IndicatorData {
  config: ActiveIndicator;
  data: IndicatorResult | null;
}

interface CandlestickChartProps {
  candles: Candle[];
  /** Chart rendering type (candlestick, ohlc, line, area, heikinAshi) */
  chartType?: ChartType;
  markers?: TradeMarker[];
  zones?: TradeZone[];
  indicators?: Map<string, IndicatorData>;
  isLoading?: boolean;
  error?: string | null;
  // Lazy loading props
  onLoadMore?: (beforeTimestamp: number) => void;
  hasMoreData?: boolean;
  isLoadingMore?: boolean;
  // Instrument info for Y-axis formatting
  tickSize?: number;
  pricePrecision?: number;
  // Selected trade for zone border highlight
  selectedTradeId?: number | null;
  // Visible range callback (for scrollbar)
  onVisibleRangeChange?: (start: number, end: number, total: number) => void;
  /** Drawing tool integration */
  activeTool?: DrawingToolType;
  onDrawingComplete?: (wip: WipDrawing) => void;
  onDrawingUpdate?: (wip: WipDrawing) => void;
  onDrawingCancel?: () => void;
  /** User drawings to render as annotations */
  userDrawings?: ChartDrawing[];
  onDrawingDragEnd?: (id: string, updates: Partial<ChartDrawing>) => void;
  onDrawingSelected?: (id: string | null) => void;
  /** When set, crosshairs are synced across all charts sharing the same group id */
  crosshairGroupId?: string;
  /** Show volume histogram at the bottom of the chart (default: true) */
  showVolume?: boolean;
  /** Called when crosshair moves over a candle. null when mouse leaves. */
  onCrosshairMove?: (data: CrosshairCandleData | null) => void;
  /** Currently selected drawing id for visual highlight */
  selectedDrawingId?: string | null;
  /** Called when the Y-axis visible price range changes (for volume profile overlay) */
  onPriceRangeChange?: (min: number, max: number) => void;
  /** Called when an existing text drawing is double-clicked for editing */
  onDrawingDoubleClick?: (drawingId: string) => void;
  /** Static horizontal price levels to render (e.g. bias key levels) */
  priceLevels?: PriceLevel[];
  /** Shaded price zones (e.g. correction zone, scenario target zones) */
  priceZones?: PriceZone[];
  /** Per-day volume profiles to render as horizontal bars behind candles */
  volumeProfiles?: DayVolumeProfile[] | null;
  /** Vertical session background bands (e.g. Asia/EU/US time windows) */
  sessionBands?: SessionBand[] | null;
}

/** Per-day volume profile with index positioning */
export interface DayVolumeProfile {
  /** First candle index of this day */
  startIndex: number;
  /** Last candle index of this day */
  endIndex: number;
  bins: Array<{
    priceLow: number;
    priceHigh: number;
    totalVolume: number;
    buyVolume: number;
    sellVolume: number;
    normalized: number; // 0..1 relative to max within this day
  }>;
  poc: number;
  vah: number;
  val: number;
}

/** A static horizontal price line annotation */
export interface PriceLevel {
  price: number;
  color: string;
  label?: string;
  dash?: number[];
  thickness?: number;
}

/** A shaded horizontal zone between two prices (e.g. correction zone, target zone) */
export interface PriceZone {
  priceTop: number;
  priceBottom: number;
  fill: string;          // e.g. '#22c55e08'
  stroke?: string;       // border color
  label?: string;
  labelColor?: string;
}

/**
 * Vertical time band that spans the full price range of the chart.
 * Used to highlight trading sessions (Asia/EU/US) as subtle background colors.
 * x1/x2 are candle indices into the candles array.
 */
export interface SessionBand {
  /** Start candle index (inclusive) */
  x1: number;
  /** End candle index (inclusive) */
  x2: number;
  /** Fill color, should be very low opacity e.g. 'rgba(88,166,255,0.03)' */
  fill: string;
  /** Optional thin border color */
  stroke?: string;
  /** Session name for tooltip/aria */
  label?: string;
}

/** Handle for programmatic chart control */
export interface CandlestickChartHandle {
  /** Zoom to a specific timestamp range with padding */
  zoomToTimeRange: (entryTime: number, exitTime: number, paddingBars?: number) => void;
  /** Pan to center on a timestamp and price range without changing zoom level */
  panToTimeRange: (entryTime: number, exitTime: number, entryPrice: number, exitPrice: number) => void;
  /** Zoom to fit all data */
  zoomExtents: () => void;
  /** Set visible range by index (for scrollbar) */
  setVisibleRange: (startIndex: number, endIndex: number) => void;
  /** Export chart as PNG data URL */
  exportToImage: () => Promise<string | null>;
  /** Get the actual SciChart plot area bounds (for overlay alignment) */
  getPlotBounds: () => { top: number; height: number } | null;
}

// Line style dash arrays for SciChart
const LINE_DASH_ARRAYS: Record<IndicatorStyle['lineStyle'], number[] | undefined> = {
  solid: undefined,
  dashed: [5, 5],
  dotted: [2, 2],
};

/**
 * Fits the Y-axis to the high/low range of candles visible in [xMin, xMax].
 * This is the TradingView model: Y-axis rescales when the X viewport changes
 * (scroll / zoom), but NOT on every tick. Call this from the X-axis
 * visibleRangeChanged subscriber and from the initial zoom.
 */
function fitYAxisToVisibleRange(
  yAxis: NumericAxis,
  dataSeries: OhlcDataSeries | null,
  xMin: number,
  xMax: number
): void {
  if (!dataSeries || dataSeries.count() === 0) return;
  const count = dataSeries.count();
  const from = Math.max(0, Math.floor(xMin));
  const to = Math.min(count - 1, Math.ceil(xMax));
  if (from > to) return;

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const highs = dataSeries.getNativeHighValues();
  const lows = dataSeries.getNativeLowValues();

  for (let i = from; i <= to; i++) {
    const h = highs.get(i);
    const l = lows.get(i);
    if (h > maxPrice) maxPrice = h;
    if (l < minPrice) minPrice = l;
  }

  if (minPrice === Infinity || maxPrice === -Infinity) return;

  const padding = (maxPrice - minPrice) * 0.08;
  yAxis.visibleRange = new NumberRange(minPrice - padding, maxPrice + padding);
}

export const CandlestickChart = forwardRef<CandlestickChartHandle, CandlestickChartProps>(
  function CandlestickChart(
    {
      candles,
      chartType = 'candlestick',
      markers,
      zones,
      indicators,
      isLoading,
      error,
      onLoadMore,
      hasMoreData = false,
      isLoadingMore = false,
      tickSize: _tickSize = 0.25,
      pricePrecision = 2,
      selectedTradeId,
      onVisibleRangeChange,
      activeTool,
      onDrawingComplete,
      onDrawingUpdate,
      onDrawingCancel,
      userDrawings,
      onDrawingDragEnd,
      onDrawingSelected,
      crosshairGroupId,
      showVolume = true,
      onCrosshairMove,
      selectedDrawingId,
      onPriceRangeChange,
      onDrawingDoubleClick,
      priceLevels,
      priceZones,
      volumeProfiles,
      sessionBands,
    },
    ref
  ) {
  // tickSize is used for trade line tick calculations
  const tickSize = _tickSize;
  // Unique ID for this chart instance - helps SciChart distinguish between mounts
  const chartId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<SciChartSurface | null>(null);
  const dataSeriesRef = useRef<OhlcDataSeries | null>(null);
  const labelProviderRef = useRef<TextLabelProvider | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const indicatorSeriesRef = useRef<Map<string, FastLineRenderableSeries[]>>(new Map());
  const candlestickSeriesRef = useRef<FastCandlestickRenderableSeries | null>(null);
  /** The currently active main renderable series (may be candlestick, OHLC, line, or mountain) */
  const mainSeriesRef = useRef<IRenderableSeries | null>(null);
  /** XyDataSeries for line/area chart types (uses close prices only) */
  const xyMainDataSeriesRef = useRef<XyDataSeries | null>(null);
  /** XyDataSeries for volume histogram bars */
  const volumeDataSeriesRef = useRef<XyDataSeries | null>(null);
  /** Volume column series ref */
  const volumeSeriesRef = useRef<FastColumnRenderableSeries | null>(null);
  /** Last price horizontal line annotation */
  const lastPriceLineRef = useRef<HorizontalLineAnnotation | null>(null);
  // Track how many candles we last loaded so we can detect tick-only updates
  // (same count, last candle changed) vs new-bar events (count increased).
  const lastLoadedCountRef = useRef<number>(0);
  // Track zone annotations for efficient selection highlighting
  const zoneAnnotationsRef = useRef<Map<number, BoxAnnotation[]>>(new Map());
  // Track WIP annotations by reference for O(1) removal (avoids scanning all annotations)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wipAnnotationsRef = useRef<any[]>([]);
  const vpAnnotationsRef = useRef<BoxAnnotation[]>([]);
  const sessionBandsAnnotationsRef = useRef<BoxAnnotation[]>([]);
  // Drawing modifier + ZoomPan refs for runtime toggling
  const drawingModifierRef = useRef<DrawingModifier | null>(null);
  const zoomPanModifierRef = useRef<ZoomPanModifier | null>(null);
  // Stable callback refs to avoid stale closures in the DrawingModifier
  const onDrawingCompleteRef = useRef(onDrawingComplete);
  const onDrawingUpdateRef = useRef(onDrawingUpdate);
  const onDrawingCancelRef = useRef(onDrawingCancel);
  const onDrawingDragEndRef = useRef(onDrawingDragEnd);
  const onDrawingSelectedRef = useRef(onDrawingSelected);
  onDrawingCompleteRef.current = onDrawingComplete;
  onDrawingUpdateRef.current = onDrawingUpdate;
  onDrawingCancelRef.current = onDrawingCancel;
  onDrawingDragEndRef.current = onDrawingDragEnd;
  onDrawingSelectedRef.current = onDrawingSelected;
  // Stable ref for price range change callback
  const onPriceRangeChangeRef = useRef(onPriceRangeChange);
  onPriceRangeChangeRef.current = onPriceRangeChange;
  // Stable ref for drawing double-click callback
  const onDrawingDoubleClickRef = useRef(onDrawingDoubleClick);
  onDrawingDoubleClickRef.current = onDrawingDoubleClick;
  // Track selectedDrawingId via ref so the annotation rebuild can read it
  // without adding it to the effect dependency array.
  const selectedDrawingIdRef = useRef(selectedDrawingId);
  selectedDrawingIdRef.current = selectedDrawingId;
  // Flag to prevent WIP effect from running during full annotation rebuild
  const isRebuildingRef = useRef(false);
  const onCrosshairMoveRef = useRef(onCrosshairMove);
  onCrosshairMoveRef.current = onCrosshairMove;
  const crosshairDataModifierRef = useRef<CrosshairDataModifier | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const loadMoreTriggeredRef = useRef(false);
  // Track if initial zoom has been done (only zoom once on first data load)
  const initialZoomDoneRef = useRef(false);

  // WIP drawing state — read directly from store to avoid React props cascade.
  // These change on every mouse move during drawing; subscribing here keeps the
  // update path short (store → this effect) instead of store → useChartEngine → ChartShell → props.
  const wipDrawing = useDrawingStore((s) => s.wipDrawing);
  const wipColor = useDrawingStore((s) => s.defaultColor);
  const wipLineWidth = useDrawingStore((s) => s.defaultLineWidth);

  // Chart appearance settings from context
  const { settings: chartSettings } = useChartSettings();
  // Ref to avoid stale closure in loadCandlesIntoChart (useCallback with empty deps)
  const chartSettingsRef = useRef(chartSettings);
  useEffect(() => { chartSettingsRef.current = chartSettings; }, [chartSettings]);

  // Use extracted hooks for efficient lookups
  const { findCandleIndex } = useTimestampIndex(candles);
  const sessionIndices = useSessionIndices(candles, chartSettings.chartTimeZone);

  // Stable refs for derived candle data — prevents annotation/indicator effect
  // from rebuilding on every tick update. Only candles.length triggers rebuilds.
  const findCandleIndexRef = useRef(findCandleIndex);
  findCandleIndexRef.current = findCandleIndex;
  const sessionIndicesRef = useRef(sessionIndices);
  sessionIndicesRef.current = sessionIndices;

  // Helper to find candle index by timestamp (for imperative handle)
  const findCandleIndexByTime = useCallback((timestamp: number): number => {
    const currentCandles = candlesRef.current;
    // Find the candle that contains this timestamp
    for (let i = 0; i < currentCandles.length; i++) {
      if (currentCandles[i].time >= timestamp) {
        return i;
      }
    }
    return currentCandles.length - 1;
  }, []);

  // Expose chart control methods via ref
  useImperativeHandle(ref, () => ({
    zoomToTimeRange: (entryTime: number, exitTime: number, paddingBars = 5) => {
      if (!surfaceRef.current) return;

      const entryIndex = findCandleIndexByTime(entryTime);
      const exitIndex = findCandleIndexByTime(exitTime);

      // Add padding around the trade
      const startIndex = Math.max(0, entryIndex - paddingBars);
      const endIndex = Math.min(candlesRef.current.length - 1, exitIndex + paddingBars);

      // Set X-axis visible range
      const xAxis = surfaceRef.current.xAxes.get(0);
      if (xAxis) {
        xAxis.visibleRange = new NumberRange(startIndex, endIndex);
      }

      // Fit Y-axis manually to the visible range (EAutoRange.Never is active)
      const yAxis = surfaceRef.current.yAxes.get(0);
      if (yAxis) {
        fitYAxisToVisibleRange(yAxis, dataSeriesRef.current, startIndex, endIndex);
      }
    },
    panToTimeRange: (entryTime: number, exitTime: number, entryPrice: number, exitPrice: number) => {
      if (!surfaceRef.current) return;

      const xAxis = surfaceRef.current.xAxes.get(0);
      const yAxis = surfaceRef.current.yAxes.get(0);
      if (!xAxis || !yAxis) return;

      const entryIndex = findCandleIndexByTime(entryTime);
      const exitIndex = findCandleIndexByTime(exitTime);

      // Calculate center of the trade (X-axis)
      const tradeXCenter = (entryIndex + exitIndex) / 2;

      // Keep the current zoom level (range width)
      const currentXRange = xAxis.visibleRange;
      const xRangeWidth = currentXRange.max - currentXRange.min;
      const xHalfWidth = xRangeWidth / 2;

      // Pan X-axis to center on the trade
      const newXMin = Math.max(0, tradeXCenter - xHalfWidth);
      const newXMax = newXMin + xRangeWidth;
      xAxis.visibleRange = new NumberRange(newXMin, newXMax);

      // Calculate center of the trade (Y-axis - price)
      const tradeYCenter = (entryPrice + exitPrice) / 2;

      // Keep the current Y zoom level (range height)
      const currentYRange = yAxis.visibleRange;
      const yRangeHeight = currentYRange.max - currentYRange.min;
      const yHalfHeight = yRangeHeight / 2;

      // Pan Y-axis to center on the trade price
      const newYMin = tradeYCenter - yHalfHeight;
      const newYMax = tradeYCenter + yHalfHeight;
      yAxis.visibleRange = new NumberRange(newYMin, newYMax);
    },
    zoomExtents: () => {
      if (surfaceRef.current) {
        surfaceRef.current.zoomExtents();
      }
    },
    setVisibleRange: (startIndex: number, endIndex: number) => {
      if (!surfaceRef.current) return;

      const xAxis = surfaceRef.current.xAxes.get(0);
      const yAxis = surfaceRef.current.yAxes.get(0);
      if (xAxis) {
        xAxis.visibleRange = new NumberRange(startIndex, endIndex);
      }
      // Fit Y-axis manually (EAutoRange.Never means zoomExtentsY() is a no-op)
      if (yAxis) {
        fitYAxisToVisibleRange(yAxis, dataSeriesRef.current, startIndex, endIndex);
      }
    },
    exportToImage: async () => {
      if (!surfaceRef.current) return null;
      try {
        const dataUrl = await (surfaceRef.current as unknown as { exportToDataUrl(): Promise<string> }).exportToDataUrl();
        return dataUrl;
      } catch (err) {
        console.error('Failed to export chart image:', err);
        return null;
      }
    },
    getPlotBounds: () => {
      if (!surfaceRef.current || surfaceRef.current.isDeleted) return null;
      const rect = surfaceRef.current.seriesViewRect;
      if (!rect) return null;
      return { top: rect.y, height: rect.height };
    },
  }), [findCandleIndexByTime]);

  // Keep track of candles for visible range handler and drawing snap
  useEffect(() => {
    candlesRef.current = candles;
    // Update drawing modifier's candle data for snap-to-price
    if (drawingModifierRef.current) {
      drawingModifierRef.current.updateOptions({ candles });
    }
  }, [candles]);

  // Helper function to load candles into the chart.
  //
  // PERFORMANCE PATH (tick update):
  //   When candlesToLoad.length === lastLoadedCountRef.current (same bar count),
  //   only the last candle's OHLC has changed (live tick). We update the last
  //   data point in-place — O(1) — instead of clearing and re-appending everything.
  //   The Y-axis is NOT touched here; it only rescales when the X viewport changes.
  //
  // FULL RELOAD PATH (new bar / symbol change / initial load):
  //   Clears all data and rebuilds from scratch (same as before).
  const loadCandlesIntoChart = useCallback((candlesToLoad: Candle[]) => {
    if (!dataSeriesRef.current || !surfaceRef.current || candlesToLoad.length === 0) return;
    if (surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;
    const dataSeries = dataSeriesRef.current;
    const count = candlesToLoad.length;
    const prevCount = lastLoadedCountRef.current;

    // ── FAST PATH: tick update (same bar count, only last candle changed) ───
    if (prevCount === count && count > 0 && initialZoomDoneRef.current) {
      const lastIdx = count - 1;
      const last = candlesToLoad[lastIdx];

      // Update last OHLC values in-place
      dataSeries.update(lastIdx, last.open, last.high, last.low, last.close);

      if (xyMainDataSeriesRef.current) {
        xyMainDataSeriesRef.current.update(lastIdx, last.close);
      }

      // Update last-price line (doesn't trigger full chart redraw)
      if (lastPriceLineRef.current) {
        const prevCandle = count >= 2 ? candlesToLoad[lastIdx - 1] : null;
        const isAbove = prevCandle ? last.close >= prevCandle.close : last.close >= last.open;
        const color = isAbove ? CHART_TOKENS.candle.bull : CHART_TOKENS.candle.bear;
        lastPriceLineRef.current.y1 = last.close;
        lastPriceLineRef.current.stroke = color;
        lastPriceLineRef.current.axisLabelFill = color;
        lastPriceLineRef.current.axisLabelStroke = color;
        lastPriceLineRef.current.labelValue = last.close.toFixed(2);
      }

      return; // Skip full rebuild — nothing else to do for a tick
    }

    // ── FULL RELOAD PATH: new bars, symbol change, or initial load ──────────
    // Suspend updates during batch data operation for better performance
    surface.suspendUpdates();

    try {
      // Clear existing data
      dataSeries.clear();

      // Pre-allocate typed arrays for better performance with large datasets
      const xValues = new Array<number>(count);
      const openValues = new Array<number>(count);
      const highValues = new Array<number>(count);
      const lowValues = new Array<number>(count);
      const closeValues = new Array<number>(count);
      const labels = new Array<string>(count);

      // Single pass through data - more efficient than multiple .map() calls
      for (let i = 0; i < count; i++) {
        const candle = candlesToLoad[i];
        xValues[i] = i;
        openValues[i] = candle.open;
        highValues[i] = candle.high;
        lowValues[i] = candle.low;
        closeValues[i] = candle.close;

        labels[i] = formatChartAxisTime(candle.time, chartSettingsRef.current.chartTimeZone);
      }

      dataSeries.appendRange(xValues, openValues, highValues, lowValues, closeValues);
      lastLoadedCountRef.current = count;

      // Also update the XyDataSeries for line/area modes if it exists
      if (xyMainDataSeriesRef.current) {
        xyMainDataSeriesRef.current.clear();
        xyMainDataSeriesRef.current.appendRange(xValues, closeValues);
      }

      // Update volume data series
      if (volumeDataSeriesRef.current) {
        volumeDataSeriesRef.current.clear();
        const volumeValues = new Array<number>(count);
        for (let i = 0; i < count; i++) {
          volumeValues[i] = candlesToLoad[i].volume;
        }
        volumeDataSeriesRef.current.appendRange(xValues, volumeValues);

        // Color volume bars: green when bullish, red when bearish
        if (volumeSeriesRef.current) {
          const upColor = parseColorToUIntArgb(chartSettingsRef.current.candleUpColor + '33'); // 20% opacity
          const downColor = parseColorToUIntArgb(chartSettingsRef.current.candleDownColor + '33');
          // Capture candle data for the palette provider closure
          const candlesCopy = candlesToLoad;
          const candleCount = count;
          const provider: IStrokePaletteProvider & IFillPaletteProvider = {
            strokePaletteMode: EStrokePaletteMode.SOLID,
            fillPaletteMode: EFillPaletteMode.SOLID,
            onAttached() {},
            onDetached() {},
            overrideFillArgb(xValue: number) {
              const idx = Math.round(xValue);
              if (idx >= 0 && idx < candleCount) {
                return candlesCopy[idx].close >= candlesCopy[idx].open ? upColor : downColor;
              }
              return upColor;
            },
            overrideStrokeArgb() {
              return undefined as unknown as number;
            },
          };
          volumeSeriesRef.current.paletteProvider = provider;
        }
      }

      // Update X-axis labels
      if (labelProviderRef.current) {
        labelProviderRef.current.labels = labels;
      }
    } finally {
      // Resume updates and trigger a single redraw
      surface.resumeUpdates();
    }

    // Last Price Line — prominent dashed horizontal line at the current price.
    // Color: ice blue when price is above previous close, red when below.
    // Y-axis badge shows the exact price on the right side.
    const lastCandle = candlesToLoad[candlesToLoad.length - 1];
    if (lastCandle) {
      const prevCandle = candlesToLoad.length >= 2 ? candlesToLoad[candlesToLoad.length - 2] : null;
      const isAbovePrevClose = prevCandle ? lastCandle.close >= prevCandle.close : lastCandle.close >= lastCandle.open;
      const lastPriceColor = isAbovePrevClose ? CHART_TOKENS.candle.bull : CHART_TOKENS.candle.bear;
      const priceLabel = lastCandle.close.toFixed(2);

      if (lastPriceLineRef.current) {
        // Update existing annotation in-place (kein Add/Remove nötig)
        lastPriceLineRef.current.y1 = lastCandle.close;
        lastPriceLineRef.current.stroke = lastPriceColor;
        lastPriceLineRef.current.axisLabelFill = lastPriceColor;
        lastPriceLineRef.current.axisLabelStroke = lastPriceColor;
        lastPriceLineRef.current.labelValue = priceLabel;
      } else {
        // Erstmalig anlegen — prominent live price line (ATAS/TradingView style)
        const lastPriceLine = new HorizontalLineAnnotation({
          y1: lastCandle.close,
          stroke: lastPriceColor,
          strokeThickness: 1,
          strokeDashArray: [4, 4],
          showLabel: true,
          labelPlacement: ELabelPlacement.Right,
          labelValue: priceLabel,
          axisLabelFill: lastPriceColor,
          axisLabelStroke: lastPriceColor,
        });
        surface.annotations.add(lastPriceLine);
        lastPriceLineRef.current = lastPriceLine;
      }
    }

    // Smart initial zoom - show last N candles (today's session).
    // Only runs once on first data load; subsequent candle updates are incremental.
    if (!loadMoreTriggeredRef.current && !initialZoomDoneRef.current) {
      initialZoomDoneRef.current = true;
      const totalCandles = candlesRef.current.length;

      const xAxis = surface.xAxes.get(0);
      const yAxis = surface.yAxes.get(0);

      if (totalCandles > INITIAL_VIEW_CANDLES) {
        const startIndex = totalCandles - INITIAL_VIEW_CANDLES;
        if (xAxis) {
          xAxis.visibleRange = new NumberRange(startIndex, totalCandles - 1);
        }
        // Manually fit Y-axis to the visible slice (no auto-range, no jumping)
        if (yAxis && xAxis) {
          fitYAxisToVisibleRange(yAxis, dataSeriesRef.current, startIndex, totalCandles - 1);
        }
      } else {
        // Fewer bars than the initial view — show all, fit Y once
        if (xAxis) {
          xAxis.visibleRange = new NumberRange(0, Math.max(0, totalCandles - 1));
        }
        if (yAxis) {
          fitYAxisToVisibleRange(yAxis, dataSeriesRef.current, 0, totalCandles - 1);
        }
      }
    }

    // NOTE: No auto-scroll here. The user controls the view entirely.
    // A new bar appended at the right edge does NOT move the viewport.
    // This matches TradingView's behavior.
  }, []);

  // Notify parent about Y-axis price range changes
  const emitPriceRange = useCallback(() => {
    if (!surfaceRef.current || surfaceRef.current.isDeleted) return;
    const yAxis = surfaceRef.current.yAxes.get(0);
    if (!yAxis) return;
    const range = yAxis.visibleRange;
    onPriceRangeChangeRef.current?.(range.min, range.max);
  }, []);

  // Handle visible range change for lazy loading and scrollbar
  const handleVisibleRangeChange = useCallback(() => {
    if (!surfaceRef.current || surfaceRef.current.isDeleted) return;

    const xAxis = surfaceRef.current.xAxes.get(0);
    if (!xAxis) return;

    const visibleRange = xAxis.visibleRange;
    const currentCandles = candlesRef.current;
    const dataLength = currentCandles.length;

    // Notify parent about visible range (for scrollbar)
    if (onVisibleRangeChange && dataLength > 0) {
      onVisibleRangeChange(
        Math.max(0, Math.round(visibleRange.min)),
        Math.min(dataLength, Math.round(visibleRange.max)),
        dataLength
      );
    }

    // Also emit the current price range (Y-axis may have auto-ranged)
    emitPriceRange();

    // Check if we should load more data
    if (!onLoadMore || !hasMoreData || isLoadingMore || loadMoreTriggeredRef.current) {
      return;
    }

    // Check if user scrolled near the left edge (older data)
    // Trigger load when visible range min is within 20% of data start
    const loadThreshold = Math.max(10, dataLength * 0.2);

    if (visibleRange.min <= loadThreshold && currentCandles.length > 0) {
      // Get the oldest timestamp
      const oldestTimestamp = currentCandles[0].time;
      loadMoreTriggeredRef.current = true;
      onLoadMore(oldestTimestamp);
    }
  }, [onLoadMore, hasMoreData, isLoadingMore, onVisibleRangeChange]);

  // Reset load trigger when loading completes
  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreTriggeredRef.current = false;
    }
  }, [isLoadingMore]);

  // Toggle drawing mode vs pan mode when activeTool changes
  useEffect(() => {
    if (drawingModifierRef.current) {
      drawingModifierRef.current.updateOptions({ activeTool: activeTool ?? 'crosshair' });
    }
    // When drawing, disable pan. When crosshair, enable pan.
    if (zoomPanModifierRef.current) {
      zoomPanModifierRef.current.isEnabled = !activeTool || activeTool === 'crosshair';
    }
  }, [activeTool]);

  // Keep DrawingModifier's userDrawings in sync for double-click hit testing
  useEffect(() => {
    if (drawingModifierRef.current) {
      drawingModifierRef.current.updateOptions({ userDrawings: userDrawings ?? [] });
    }
  }, [userDrawings]);

  // Sync magnetMode and wipDrawing from the drawing store to the DrawingModifier.
  // When the store's wipDrawing is cleared externally (e.g. via Escape key in useChartShortcuts),
  // we must also clear the DrawingModifier's internal wipDrawing to prevent stale state.
  useEffect(() => {
    let prevMagnetMode = useDrawingStore.getState().magnetMode;
    let prevWipDrawing = useDrawingStore.getState().wipDrawing;

    const unsubscribe = useDrawingStore.subscribe(
      (state) => {
        if (!drawingModifierRef.current) return;

        // Only update magnetMode when it actually changes
        if (state.magnetMode !== prevMagnetMode) {
          prevMagnetMode = state.magnetMode;
          drawingModifierRef.current.updateOptions({ magnetMode: state.magnetMode });
        }

        // If store's wipDrawing was cleared externally, cancel modifier's internal WIP
        // Pass false to avoid circular onCancel → setWipDrawing(null) call
        if (prevWipDrawing !== null && state.wipDrawing === null) {
          drawingModifierRef.current.cancelWip(false);
        }
        prevWipDrawing = state.wipDrawing;
      },
    );
    // Set initial magnetMode
    if (drawingModifierRef.current) {
      drawingModifierRef.current.updateOptions({ magnetMode: prevMagnetMode });
    }
    return unsubscribe;
  }, []);

  // Initialize chart - track if we've already initialized to prevent double init
  const initializingRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initializingRef.current || surfaceRef.current) return;
    initializingRef.current = true;

    let mounted = true;

    async function createChart() {
      try {
        // Wait for containerRef to be available (React may not have attached it yet)
        let divElement = containerRef.current;
        let refAttempts = 0;
        const maxRefAttempts = 20;

        while (!divElement && refAttempts < maxRefAttempts && mounted) {
          await new Promise(resolve => setTimeout(resolve, 50));
          divElement = containerRef.current;
          refAttempts++;
        }

        if (!mounted) {
          initializingRef.current = false;
          return;
        }

        if (!divElement) {
          setChartError('Chart container not available');
          setIsInitializing(false);
          initializingRef.current = false;
          return;
        }

        // Wait for container to have dimensions (important for tab switches)
        let rect = divElement.getBoundingClientRect();
        let attempts = 0;
        const maxAttempts = 20;

        while ((rect.width === 0 || rect.height === 0) && attempts < maxAttempts && mounted) {
          await new Promise(resolve => setTimeout(resolve, 50));
          rect = divElement.getBoundingClientRect();
          attempts++;
        }

        if (!mounted) {
          initializingRef.current = false;
          return;
        }
        if (rect.width === 0 || rect.height === 0) {
          setChartError('Chart container has no dimensions');
          setIsInitializing(false);
          initializingRef.current = false;
          return;
        }

        // Ensure SciChart WASM is loaded before creating surfaces
        await ensureSciChartInitialized();

        // Create custom theme based on Navy theme — clean, black background
        const theme = new SciChartJsNavyTheme();
        const cs = chartSettingsRef.current;
        theme.sciChartBackground = cs.chartBackground || '#0F1318';
        theme.loadingAnimationBackground = cs.chartBackground || '#0F1318';
        theme.axisBandsFill = 'transparent';
        theme.gridBorderBrush = 'transparent';
        theme.majorGridLineBrush = cs.gridLineColor || 'rgba(255,255,255,0.03)';
        theme.minorGridLineBrush = 'transparent';
        theme.tickTextBrush = cs.axisLabelColor || '#6E7681';

        const { sciChartSurface, wasmContext } = await SciChartSurface.create(divElement, {
          theme,
        });
        registerSurface(sciChartSurface);

        if (!mounted) {
          sciChartSurface.delete();
          unregisterSurface(sciChartSurface);
          return;
        }

        // X-Axis (Category for time series with gaps)
        // Custom label provider to format timestamps as date/time
        // Grid lines disabled - session separators added via annotations
        const xLabelProvider = new TextLabelProvider({
          labels: [], // Will be populated when data is loaded
        });
        labelProviderRef.current = xLabelProvider;
        const xAxis = new CategoryAxis(wasmContext, {
          drawMajorGridLines: false,
          drawMinorGridLines: false,
          drawMajorBands: false,
          axisBandsFill: 'transparent',
          labelStyle: { color: '#6E7681', fontSize: 10, fontFamily: 'Geist Mono, SF Mono, monospace' },
          labelProvider: xLabelProvider,
          maxAutoTicks: 20,
        });
        sciChartSurface.xAxes.add(xAxis);

        // Y-Axis (Numeric for price)
        // EAutoRange.Never: user controls Y-axis zoom, we manually fit it when X-range changes.
        // This prevents the constant rescaling / visual jumping on every tick (TradingView behavior).
        const yAxis = new NumericAxis(wasmContext, {
          autoRange: EAutoRange.Never,
          growBy: new NumberRange(0.05, 0.05),
          drawMajorGridLines: true,
          drawMinorGridLines: false,
          drawMajorBands: false,
          axisBandsFill: 'transparent',
          backgroundColor: '#000000',
          axisBorder: { borderTop: 0, borderBottom: 0, borderLeft: 1, borderRight: 0, color: '#1a1a1a' },
          labelStyle: { color: '#6E7681', fontSize: 11, fontFamily: 'Geist Mono, SF Mono, monospace' },
          labelFormat: ENumericFormat.Decimal,
          labelPrecision: pricePrecision,
          // Show more price levels (double the default)
          maxAutoTicks: 30,
          // Cursor label format - will be updated by effect
          cursorLabelPrecision: pricePrecision,
        });
        sciChartSurface.yAxes.add(yAxis);

        // OHLC Data Series - pre-allocate capacity to avoid resizes with large datasets
        // 100k capacity handles 5-month 1-minute data efficiently
        const dataSeries = new OhlcDataSeries(wasmContext, {
          xValues: [],
          openValues: [],
          highValues: [],
          lowValues: [],
          closeValues: [],
          capacity: 100_000,
          containsNaN: false,
          isSorted: true,
        });
        dataSeriesRef.current = dataSeries;

        // Candlestick Series (default — will be swapped by chartType effect)
        const candlestickSeries = new FastCandlestickRenderableSeries(wasmContext, {
          dataSeries,
          strokeThickness: 1,
          dataPointWidth: 0.8,
          brushUp: chartSettings.candleUpColor,
          brushDown: chartSettings.candleDownColor,
          // Slightly darker stroke for candle body definition (professional look)
          strokeUp: chartSettings.candleUpColor + 'CC',
          strokeDown: chartSettings.candleDownColor + 'CC',
        });
        sciChartSurface.renderableSeries.add(candlestickSeries);
        candlestickSeriesRef.current = candlestickSeries;
        mainSeriesRef.current = candlestickSeries;

        // Volume histogram — secondary Y-axis + column series
        if (showVolume) {
          const volumeYAxis = new NumericAxis(wasmContext, {
            id: 'volumeAxis',
            autoRange: EAutoRange.Always,
            isVisible: false,
            // Push volume bars to the bottom ~25% of the chart
            growBy: new NumberRange(0, 5),
          });
          sciChartSurface.yAxes.add(volumeYAxis);

          const volumeDataSeries = new XyDataSeries(wasmContext, {
            xValues: [],
            yValues: [],
            capacity: 100_000,
            containsNaN: false,
            isSorted: true,
          });
          volumeDataSeriesRef.current = volumeDataSeries;

          const volumeSeries = new FastColumnRenderableSeries(wasmContext, {
            dataSeries: volumeDataSeries,
            yAxisId: 'volumeAxis',
            dataPointWidth: 0.8,
            opacity: 0.2,
            // Default fill — will be updated per-bar via palette provider
            fill: '#ffffff33',
            stroke: '#ffffff00',
            strokeThickness: 0,
          });
          sciChartSurface.renderableSeries.add(volumeSeries);
          volumeSeriesRef.current = volumeSeries;
        }

        // Drawing modifier — created first so it receives mouse events before
        // other modifiers when a drawing tool is active. Uses callback refs to
        // avoid stale closures.
        const drawingModifier = new DrawingModifier({
          activeTool: activeTool ?? 'crosshair',
          onDrawingStart: (wip) => onDrawingUpdateRef.current?.(wip),
          onDrawingUpdate: (wip) => onDrawingUpdateRef.current?.(wip),
          onDrawingComplete: (wip) => onDrawingCompleteRef.current?.(wip),
          onCancel: () => onDrawingCancelRef.current?.(),
          onSelected: (id) => onDrawingSelectedRef.current?.(id),
          onDrawingDoubleClick: (id) => onDrawingDoubleClickRef.current?.(id),
          userDrawings: candlesRef.current ? userDrawings : [],
          candles: candlesRef.current,
          snapThreshold: 10,
        });
        drawingModifierRef.current = drawingModifier;

        // Add interactivity modifiers — DrawingModifier is first in the chain
        // so it can intercept clicks when a tool is active (sets args.handled = true).
        const zoomPan = new ZoomPanModifier();
        sciChartSurface.chartModifiers.add(
          drawingModifier,
          zoomPan,
          new ZoomExtentsModifier(),
          // Mouse wheel zooms X-axis when over chart area
          new MouseWheelZoomModifier({
            xyDirection: EXyDirection.XDirection,
            applyToSeriesViewRect: true,
            applyToAxes: false,
          }),
          // Mouse wheel zooms Y-axis when hovering over Y-axis
          new MouseWheelZoomModifier({
            xyDirection: EXyDirection.YDirection,
            applyToSeriesViewRect: false,
            applyToAxes: true,
          }),
          // Y-axis drag to zoom: up = zoom in, down = zoom out (consistent behavior)
          new YAxisDragZoomModifier(),
          // X-axis drag to zoom: right = zoom in, left = zoom out
          new XAxisDragZoomModifier(),
          // Crosshair with axis labels (no tooltip)
          new CursorModifier({
            showTooltip: false,
            showAxisLabels: true,
            showXLine: true,
            showYLine: true,
            crosshairStroke: chartSettings.crosshairColor,
            crosshairStrokeThickness: 1,
            axisLabelFill: chartSettings.cursorLabelBg,
            axisLabelStroke: chartSettings.cursorLabelBorder,
            ...(crosshairGroupId ? { modifierGroup: crosshairGroupId } : {}),
          })
        );
        zoomPanModifierRef.current = zoomPan;

        // Crosshair data modifier — provides OHLCV data for hovered candle
        const crosshairDataModifier = new CrosshairDataModifier({
          onCrosshairMove: (data) => onCrosshairMoveRef.current?.(data),
          getCandles: () => candlesRef.current,
        });
        sciChartSurface.chartModifiers.add(crosshairDataModifier);
        crosshairDataModifierRef.current = crosshairDataModifier;

        surfaceRef.current = sciChartSurface;
        setIsInitializing(false);

        // Load any pending candles that arrived during initialization
        if (candlesRef.current.length > 0) {
          loadCandlesIntoChart(candlesRef.current);
        }
      } catch (err) {
        console.error('Failed to create SciChart:', err);
        setChartError(err instanceof Error ? err.message : 'Failed to initialize chart');
        setIsInitializing(false);
        initializingRef.current = false;
      }
    }

    createChart();

    return () => {
      mounted = false;
      initializingRef.current = false;
      const surface = surfaceRef.current;
      if (surface) {
        try {
          if (!surface.isDeleted) {
            // Clear renderable series, annotations & modifiers BEFORE delete
            // so that any lingering WASM render-loop callbacks don't find
            // deleted DataSeries.
            surface.renderableSeries.clear();
            surface.annotations.clear();
            surface.chartModifiers.clear();
            surface.delete();
          }
        } catch {
          // Surface may already be in an invalid state — ignore
        }
        unregisterSurface(surface);
        surfaceRef.current = null;
        dataSeriesRef.current = null;
        xyMainDataSeriesRef.current = null;
        volumeDataSeriesRef.current = null;
        volumeSeriesRef.current = null;
        mainSeriesRef.current = null;
        labelProviderRef.current = null;
        drawingModifierRef.current = null;
        zoomPanModifierRef.current = null;
        crosshairDataModifierRef.current = null;
        lastPriceLineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chart colors when settings change
  useEffect(() => {
    if (!surfaceRef.current || isInitializing || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;

    // Update candlestick colors (slightly darker stroke for body definition)
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.brushUp = chartSettings.candleUpColor;
      candlestickSeriesRef.current.brushDown = chartSettings.candleDownColor;
      candlestickSeriesRef.current.strokeUp = chartSettings.candleUpColor + 'CC';
      candlestickSeriesRef.current.strokeDown = chartSettings.candleDownColor + 'CC';
    }

    // Update Y-axis colors
    const yAxis = surface.yAxes.get(0);
    if (yAxis) {
      yAxis.labelStyle = { color: chartSettings.axisLabelColor, fontSize: 11, fontFamily: 'Geist Mono, SF Mono, monospace' };
    }

    // Update X-axis colors
    const xAxis = surface.xAxes.get(0);
    if (xAxis) {
      xAxis.labelStyle = { color: chartSettings.axisLabelColor, fontSize: 10, fontFamily: 'Geist Mono, SF Mono, monospace' };
    }

    // Update cursor modifier colors
    const cursorModifier = surface.chartModifiers.getById('CursorModifier') as CursorModifier | undefined;
    if (cursorModifier) {
      cursorModifier.crosshairStroke = chartSettings.crosshairColor;
      cursorModifier.axisLabelFill = chartSettings.cursorLabelBg;
      cursorModifier.axisLabelStroke = chartSettings.cursorLabelBorder;
    }
  }, [chartSettings, isInitializing]);

  // Switch renderable series when chartType changes
  useEffect(() => {
    if (!surfaceRef.current || isInitializing || !dataSeriesRef.current || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;
    const wasmContext = surface.webAssemblyContext2D;
    const ohlcData = dataSeriesRef.current;

    // Remove the old main series (keep its DataSeries alive — we reuse the OHLC data)
    if (mainSeriesRef.current) {
      surface.renderableSeries.remove(mainSeriesRef.current, false);
      mainSeriesRef.current = null;
    }

    // For line/area we need an XyDataSeries built from close prices
    const buildXySeries = () => {
      const count = ohlcData.count();
      const xValues: number[] = [];
      const yValues: number[] = [];
      for (let i = 0; i < count; i++) {
        xValues.push(i);
        yValues.push(ohlcData.getNativeCloseValues().get(i));
      }
      const xy = new XyDataSeries(wasmContext, { xValues, yValues, containsNaN: false, isSorted: true });
      xyMainDataSeriesRef.current = xy;
      return xy;
    };

    let newSeries: IRenderableSeries;

    switch (chartType) {
      case 'ohlc': {
        const series = new FastOhlcRenderableSeries(wasmContext, {
          dataSeries: ohlcData,
          strokeThickness: 1,
          dataPointWidth: 0.8,
          strokeUp: chartSettings.candleUpColor,
          strokeDown: chartSettings.candleDownColor,
        });
        newSeries = series;
        break;
      }
      case 'line': {
        const xy = buildXySeries();
        const series = new FastLineRenderableSeries(wasmContext, {
          dataSeries: xy,
          stroke: chartSettings.candleUpColor,
          strokeThickness: 2,
        });
        newSeries = series;
        break;
      }
      case 'area': {
        const xy = buildXySeries();
        const series = new FastMountainRenderableSeries(wasmContext, {
          dataSeries: xy,
          stroke: chartSettings.candleUpColor,
          fill: chartSettings.candleUpColor + '33', // 20% opacity
          strokeThickness: 2,
        });
        newSeries = series;
        break;
      }
      case 'heikinAshi':
      case 'candlestick':
      default: {
        // Both candlestick and heikinAshi use FastCandlestickRenderableSeries
        // (HA candle computation happens upstream in ChartPage)
        const series = new FastCandlestickRenderableSeries(wasmContext, {
          dataSeries: ohlcData,
          strokeThickness: 1,
          dataPointWidth: 0.8,
          brushUp: chartSettings.candleUpColor,
          brushDown: chartSettings.candleDownColor,
          // Slightly darker stroke for candle body definition (professional look)
          strokeUp: chartSettings.candleUpColor + 'CC',
          strokeDown: chartSettings.candleDownColor + 'CC',
        });
        candlestickSeriesRef.current = series;
        newSeries = series;
        break;
      }
    }

    // Insert at position 0 so main series is behind indicator overlays
    surface.renderableSeries.insert(0, newSeries);
    mainSeriesRef.current = newSeries;
  }, [chartType, isInitializing, chartSettings]);

  // Set up visible range change listener for lazy loading + Y-axis fitting.
  // Runs whenever the chart becomes ready (isInitializing flips to false).
  // The Y-axis fit listener is always active; the lazy-load path is guarded by onLoadMore.
  useEffect(() => {
    if (isInitializing || !surfaceRef.current || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;
    const xAxis = surface.xAxes.get(0);
    const yAxis = surface.yAxes.get(0);
    if (!xAxis) return;

    // Y-axis auto-fit on X viewport change (TradingView model).
    // When the user scrolls or zooms, we recompute the price range that covers
    // all candles in the new visible window and set visibleRange directly.
    // This does NOT run on every tick — only when the X range actually changes.
    const fitYOnXChange = () => {
      if (!surface.isDeleted && yAxis) {
        const { min, max } = xAxis.visibleRange;
        fitYAxisToVisibleRange(yAxis, dataSeriesRef.current, min, max);
        emitPriceRange();
      }
    };

    xAxis.visibleRangeChanged.subscribe(fitYOnXChange);

    // Also subscribe to the lazy-load / scrollbar handler if onLoadMore is set
    if (onLoadMore) {
      xAxis.visibleRangeChanged.subscribe(handleVisibleRangeChange);
    }

    return () => {
      try {
        if (!surface.isDeleted) {
          xAxis.visibleRangeChanged.unsubscribe(fitYOnXChange);
          if (onLoadMore) {
            xAxis.visibleRangeChanged.unsubscribe(handleVisibleRangeChange);
          }
        }
      } catch {
        // Surface or axis may already be deleted
      }
    };
  }, [handleVisibleRangeChange, onLoadMore, hasMoreData, isInitializing, emitPriceRange]);

  // Subscribe to Y-axis visible range changes (for volume profile price alignment)
  useEffect(() => {
    if (isInitializing || !surfaceRef.current || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;
    const yAxis = surface.yAxes.get(0);
    if (!yAxis) return;

    yAxis.visibleRangeChanged.subscribe(emitPriceRange);

    return () => {
      try {
        if (!surface.isDeleted) {
          yAxis.visibleRangeChanged.unsubscribe(emitPriceRange);
        }
      } catch {
        // Surface or axis may already be deleted
      }
    };
  }, [emitPriceRange, isInitializing]);

  // Update data when candles change or initialization completes
  useEffect(() => {
    // Skip if still initializing
    if (isInitializing) return;
    // Skip if chart surface not ready or already deleted
    if (!surfaceRef.current || !dataSeriesRef.current || surfaceRef.current.isDeleted) return;

    loadCandlesIntoChart(candles);
  }, [candles, isInitializing, loadCandlesIntoChart]);

  // Enhanced findCandleIndex with binary search fallback for non-exact matches.
  // Uses refs to avoid recreating on every candle price update — only the annotation
  // effect's candles.length dependency triggers rebuilds.
  const findCandleIndexWithFallback = useCallback((timestamp: number) => {
    // Fast path: exact timestamp match
    const exactMatch = findCandleIndexRef.current(timestamp);
    if (exactMatch !== -1) return exactMatch;

    // Fallback: find the candle that contains this timestamp using binary search
    const currentCandles = candlesRef.current;
    if (currentCandles.length === 0) return -1;

    const interval = currentCandles.length > 1 ? currentCandles[1].time - currentCandles[0].time : 60;
    let left = 0;
    let right = currentCandles.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const candleTime = currentCandles[mid].time;

      if (timestamp >= candleTime && timestamp < candleTime + interval) {
        return mid;
      }

      if (timestamp < candleTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return -1;
  }, []);

  // Update markers, zones, and session separators when they change.
  // PERF: Uses candles.length instead of candles to avoid full annotation rebuild
  // on every tick update. Only triggers when bar count changes (new bar added,
  // symbol/timeframe switch). Uses refs for current candle data inside the effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const currentCandles = candlesRef.current;
    if (!surfaceRef.current || isInitializing || currentCandles.length === 0 || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;

    // Suspend updates during batch annotation operations
    isRebuildingRef.current = true;
    // Clear WIP annotation refs since annotations.clear() removes them
    wipAnnotationsRef.current = [];
    surface.suspendUpdates();

    try {
      // Remove existing annotations
      surface.annotations.clear();

      // Re-add VP annotations managed by separate effect
      for (const ann of vpAnnotationsRef.current) {
        surface.annotations.add(ann);
      }

      // Re-add session band annotations managed by separate effect
      for (const ann of sessionBandsAnnotationsRef.current) {
        surface.annotations.add(ann);
      }

      // Create annotation context for builder functions
      const ctx: AnnotationContext = {
        surface,
        candles: currentCandles,
        findCandleIndex: findCandleIndexWithFallback,
        chartSettings,
        tickSize,
      };

      // Add render instruction annotations first (background layer)
      const renderInstructionAnnotations = createRenderInstructionAnnotations(indicators, ctx);
      for (const annotation of renderInstructionAnnotations) {
        surface.annotations.add(annotation);
      }

      // Add session separator lines
      const sessionSeparators = createSessionSeparators(sessionIndicesRef.current, ctx);
      for (const annotation of sessionSeparators) {
        surface.annotations.add(annotation);
      }

      // Add contract labels at rollover boundaries (background watermark)
      const contractLabels = createContractLabels(ctx);
      for (const annotation of contractLabels) {
        surface.annotations.add(annotation);
      }

      // Clear zone annotations ref for fresh tracking
      zoneAnnotationsRef.current.clear();

      // Add zone rectangles (so they're behind markers and lines)
      if (zones && zones.length > 0) {
        const { annotations: zoneAnnotations, byTradeId } = createTradeZones(zones, ctx);
        for (const annotation of zoneAnnotations) {
          surface.annotations.add(annotation);
        }
        // Store for selection highlighting
        zoneAnnotationsRef.current = byTradeId;

        // Add entry-exit connection lines with tick labels
        const tradeLineAnnotations = createTradeLines(zones, ctx);
        for (const annotation of tradeLineAnnotations) {
          surface.annotations.add(annotation);
        }
      }

      // Add marker annotations
      if (markers && markers.length > 0) {
        const markerAnnotations = createTradeMarkers(markers, ctx);
        for (const annotation of markerAnnotations) {
          surface.annotations.add(annotation);
        }
      }

      // Render user drawings as annotations
      if (userDrawings && userDrawings.length > 0) {
        for (const drawing of userDrawings) {
          const anns = createDrawingAnnotation(drawing, {
            onDragEnd: (id, updates) => onDrawingDragEndRef.current?.(id, updates),
            onSelected: (id) => onDrawingSelectedRef.current?.(id),
          }, tickSize, pricePrecision);
          for (const ann of anns) {
            // Restore selection state after rebuild
            if (selectedDrawingIdRef.current === drawing.id) {
              (ann as unknown as { isSelected: boolean }).isSelected = true;
            }
            surface.annotations.add(ann);
          }
        }
      }

      // Render shaded price zones (correction zone, scenario targets, etc.)
      // Signal zones (Risk/Reward) only cover the last 25 bars, not full chart.
      if (priceZones && priceZones.length > 0) {
        for (const zone of priceZones) {
          // Signal zones have labels like "Risk" or "Reward" — limit their width
          const isSignalZone = zone.label === 'Risk' || zone.label === 'Reward';
          const zoneX1 = isSignalZone ? Math.max(0, candles.length - 25) : 0;
          const zoneX2 = candles.length;
          const box = new BoxAnnotation({
            x1: zoneX1,
            x2: zoneX2,
            y1: zone.priceBottom,
            y2: zone.priceTop,
            fill: zone.fill,
            stroke: zone.stroke ?? 'transparent',
            strokeThickness: zone.stroke ? 0.5 : 0,
          });
          surface.annotations.add(box);

          // Optional label at right edge
          if (zone.label) {
            const labelLine = new HorizontalLineAnnotation({
              y1: (zone.priceTop + zone.priceBottom) / 2,
              stroke: 'transparent',
              strokeThickness: 0,
              showLabel: true,
              labelPlacement: ELabelPlacement.BottomRight,
              labelValue: zone.label,
              isAxisLabelVisible: false,
              opacity: 0.6,
            });
            surface.annotations.add(labelLine);
          }
        }
      }

      // Render static price level annotations (e.g. bias key levels)
      // Smart label placement: sort by price, alternate Top/Bottom for close levels
      if (priceLevels && priceLevels.length > 0) {
        const ts = tickSize || 0.25;
        // Sort by price for smart label collision avoidance
        const sorted = [...priceLevels].sort((a, b) => a.price - b.price);
        let lastLabelPrice = -Infinity;
        const LABEL_MIN_GAP = ts * 30; // minimum price gap before alternating labels

        for (const pl of sorted) {
          const isSW = pl.label?.startsWith('SW');
          const isVH = pl.label?.startsWith('VH');
          const isVL = pl.label?.startsWith('VL');

          // Zone glow behind important levels (SW gets wider zone, VH/VL get thin zone)
          if (isSW || isVH || isVL) {
            const zoneHalf = isSW ? ts * 6 : ts * 2;
            const zoneColor = isSW ? '#fb923c05' : isVH ? '#ef444405' : '#22c55e05';
            const zoneBorder = isSW ? '#fb923c0a' : isVH ? '#ef44440a' : '#22c55e0a';
            const zone = new BoxAnnotation({
              x1: 0,
              x2: candles.length,
              y1: pl.price - zoneHalf,
              y2: pl.price + zoneHalf,
              fill: zoneColor,
              stroke: zoneBorder,
              strokeThickness: 0.5,
            });
            surface.annotations.add(zone);
          }

          // Smart placement: alternate TopRight/BottomRight when labels are close
          const tooClose = Math.abs(pl.price - lastLabelPrice) < LABEL_MIN_GAP;
          const placement = tooClose ? ELabelPlacement.TopRight : ELabelPlacement.BottomRight;
          if (pl.label) lastLabelPrice = pl.price;

          // Signal lines (ENTRY/STOP/TP) only span the last 25 bars
          const isSignalLine = pl.label?.startsWith('ENTRY') || pl.label?.startsWith('STOP') || pl.label?.startsWith('TP');
          if (isSignalLine) {
            const signalX1 = Math.max(0, candles.length - 25);
            const signalX2 = candles.length;
            // Use BoxAnnotation as a thin line with limited width
            const thinHeight = ts * 0.15; // very thin box = line appearance
            const lineBox = new BoxAnnotation({
              x1: signalX1,
              x2: signalX2,
              y1: pl.price - thinHeight,
              y2: pl.price + thinHeight,
              fill: pl.color + '60', // 38% opacity fill
              stroke: pl.color,
              strokeThickness: pl.thickness ?? 1,
            });
            surface.annotations.add(lineBox);
            // Label at the right edge
            if (pl.label) {
              const labelLine = new HorizontalLineAnnotation({
                y1: pl.price,
                stroke: 'transparent',
                strokeThickness: 0,
                showLabel: true,
                labelPlacement: placement,
                labelValue: pl.label,
                isAxisLabelVisible: true,
                axisLabelFill: pl.color,
                axisLabelStroke: pl.color,
              });
              surface.annotations.add(labelLine);
            }
          } else {
            // Regular price levels (PDH/PDL/etc) span full width
            const line = new HorizontalLineAnnotation({
              y1: pl.price,
              stroke: pl.color,
              strokeThickness: pl.thickness ?? 1,
              strokeDashArray: pl.dash,
              showLabel: !!pl.label,
              labelPlacement: placement,
              labelValue: pl.label ?? '',
              isAxisLabelVisible: false,
              opacity: isSW ? 0.85 : 0.55,
            });
            surface.annotations.add(line);
          }
        }
      }

    } finally {
      // Resume updates and trigger a single redraw
      surface.resumeUpdates();
      isRebuildingRef.current = false;
    }
  }, [markers, zones, candles, isInitializing, findCandleIndexWithFallback, chartSettings, sessionIndices, indicators, tickSize, pricePrecision, userDrawings, priceLevels, priceZones]);

  // Dedicated volume profile annotation effect — decoupled from main rebuild
  // Only triggers when volumeProfiles data changes
  useEffect(() => {
    if (!surfaceRef.current || isInitializing || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;

    surface.suspendUpdates();
    try {
      // Remove previous VP annotations
      for (const ann of vpAnnotationsRef.current) {
        try { surface.annotations.remove(ann); } catch { /* already removed */ }
      }
      vpAnnotationsRef.current = [];

      if (!volumeProfiles || volumeProfiles.length === 0) return;

      const newAnnotations: BoxAnnotation[] = [];

      for (const profile of volumeProfiles) {
        if (profile.bins.length === 0) continue;
        const dayWidth = profile.endIndex - profile.startIndex + 1;
        const maxBarWidth = dayWidth * 0.50; // 50% of day width for VP bars

        for (const bin of profile.bins) {
          if (bin.normalized < 0.005) continue;
          const barWidth = bin.normalized * maxBarWidth;
          // Overlap check: bin overlaps Value Area if midpoint is within VA range
          const binMid = (bin.priceLow + bin.priceHigh) / 2;
          const isVA = binMid >= profile.val && binMid <= profile.vah;
          const fillColor = isVA ? 'rgba(92,184,240,0.22)' : 'rgba(255,255,255,0.07)';

          // Grow bars from the LEFT edge of the day (standard VP layout)
          const box = new BoxAnnotation({
            x1: profile.startIndex,
            x2: profile.startIndex + barWidth,
            y1: bin.priceLow,
            y2: bin.priceHigh,
            fill: fillColor,
            stroke: 'transparent',
            strokeThickness: 0,
          });
          newAnnotations.push(box);
          surface.annotations.add(box);
        }

        // POC line — full day width, thick amber bar
        const pocHeight = tickSize * 2; // 2 ticks thick for visibility
        const pocBox = new BoxAnnotation({
          x1: profile.startIndex,
          x2: profile.endIndex + 1,
          y1: profile.poc - pocHeight,
          y2: profile.poc + pocHeight,
          fill: 'rgba(251,191,36,0.7)',
          stroke: 'rgba(251,191,36,0.5)',
          strokeThickness: 1,
        });
        newAnnotations.push(pocBox);
        surface.annotations.add(pocBox);

        // VAH boundary — thin ice blue line
        const vaLineHeight = tickSize * 0.8;
        const vahBox = new BoxAnnotation({
          x1: profile.startIndex,
          x2: profile.endIndex + 1,
          y1: profile.vah - vaLineHeight,
          y2: profile.vah + vaLineHeight,
          fill: 'rgba(92,184,240,0.2)',
          stroke: 'rgba(92,184,240,0.15)',
          strokeThickness: 1,
        });
        newAnnotations.push(vahBox);
        surface.annotations.add(vahBox);

        // VAL boundary — thin ice blue line
        const valBox = new BoxAnnotation({
          x1: profile.startIndex,
          x2: profile.endIndex + 1,
          y1: profile.val - vaLineHeight,
          y2: profile.val + vaLineHeight,
          fill: 'rgba(92,184,240,0.2)',
          stroke: 'rgba(92,184,240,0.15)',
          strokeThickness: 1,
        });
        newAnnotations.push(valBox);
        surface.annotations.add(valBox);
      }

      vpAnnotationsRef.current = newAnnotations;
    } finally {
      surface.resumeUpdates();
    }
  }, [volumeProfiles, isInitializing, tickSize]);

  // Dedicated session band annotation effect — decoupled from main rebuild.
  // Renders very subtle vertical background boxes for trading sessions (Asia/EU/US).
  // Uses a large y-range (1e10 / -1e10) so the box spans the full visible price area.
  useEffect(() => {
    if (!surfaceRef.current || isInitializing || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;

    surface.suspendUpdates();
    try {
      // Remove previous session band annotations
      for (const ann of sessionBandsAnnotationsRef.current) {
        try { surface.annotations.remove(ann); } catch { /* already removed */ }
      }
      sessionBandsAnnotationsRef.current = [];

      if (!sessionBands || sessionBands.length === 0) return;

      const newAnnotations: BoxAnnotation[] = [];

      for (const band of sessionBands) {
        if (band.x1 < 0 || band.x2 < band.x1) continue;

        const box = new BoxAnnotation({
          x1: band.x1,
          x2: band.x2 + 1,
          // Use very large y-range to span entire price axis
          y1: -1e10,
          y2: 1e10,
          fill: band.fill,
          stroke: band.stroke ?? 'transparent',
          strokeThickness: band.stroke ? 0.5 : 0,
        });
        newAnnotations.push(box);
        surface.annotations.add(box);
      }

      sessionBandsAnnotationsRef.current = newAnnotations;
    } finally {
      surface.resumeUpdates();
    }
  }, [sessionBands, isInitializing]);

  // WIP drawing ghost preview — separate effect to avoid full annotation rebuild on every mouse move.
  // Uses ref-tracked annotations for O(1) removal and batched SciChart updates.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || surface.isDeleted) return;
    // Skip if a full annotation rebuild is in progress to avoid race condition
    if (isRebuildingRef.current) return;

    // Batch remove+add into a single SciChart redraw
    surface.suspendUpdates();
    try {
      // Remove previous WIP annotations via tracked refs (O(1) — no scanning)
      for (const ann of wipAnnotationsRef.current) {
        try { surface.annotations.remove(ann); } catch { /* already removed by rebuild */ }
      }
      wipAnnotationsRef.current = [];

      if (wipDrawing && wipDrawing.x2 !== undefined && wipDrawing.y2 !== undefined) {
        const tempDrawing: ChartDrawing = {
          id: '__wip-preview',
          type: wipDrawing.type,
          x1: wipDrawing.x1,
          y1: wipDrawing.y1,
          x2: wipDrawing.x2,
          y2: wipDrawing.y2,
          x3: wipDrawing.x3,
          y3: wipDrawing.y3,
          color: wipColor ?? GLOBAL_DEFAULTS.color,
          lineWidth: wipLineWidth ?? GLOBAL_DEFAULTS.lineWidth,
          lineStyle: 'dashed',
          opacity: 0.5,
          locked: false,
          visible: true,
          createdAt: '',
        };
        const anns = createDrawingAnnotation(tempDrawing, {
          onDragEnd: () => {},
          onSelected: () => {},
        }, tickSize, pricePrecision);
        wipAnnotationsRef.current = anns;
        for (const a of anns) {
          surface.annotations.add(a);
        }
      }
    } finally {
      surface.resumeUpdates();
    }
  }, [wipDrawing, wipColor, wipLineWidth]);

  // Update drawing selection highlight without rebuilding annotations
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || surface.isDeleted) return;

    for (const ann of surface.annotations.asArray()) {
      const id = ann.id;
      // Only touch user drawing annotations (skip trade markers, zones, wip, etc.)
      if (id && !id.startsWith('__') && !id.startsWith('marker-') && !id.startsWith('zone-')) {
        // For sub-annotations (e.g. fib levels, parallel lines), extract parent UUID
        const parentId = id.includes('_') ? id.substring(0, 36) : id;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(parentId);
        if (isUuid) {
          (ann as unknown as { isSelected: boolean }).isSelected = parentId === selectedDrawingId;
        }
      }
    }
  }, [selectedDrawingId]);

  // Efficient selection highlighting - only updates strokeThickness, no annotation rebuild
  useEffect(() => {
    if (!surfaceRef.current || isInitializing || surfaceRef.current.isDeleted) return;

    // Reset all zone borders to 0
    for (const zoneAnnotations of zoneAnnotationsRef.current.values()) {
      for (const annotation of zoneAnnotations) {
        annotation.strokeThickness = 0;
      }
    }

    // Highlight the selected trade's zones
    if (selectedTradeId != null) {
      const selectedZones = zoneAnnotationsRef.current.get(selectedTradeId);
      if (selectedZones) {
        for (const annotation of selectedZones) {
          annotation.strokeThickness = 1;
        }
      }
    }
  }, [selectedTradeId, isInitializing]);

  // Render indicator series when indicators change.
  // PERF: Uses candles.length instead of candles to avoid full rebuild on tick updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const currentCandles = candlesRef.current;
    if (!surfaceRef.current || isInitializing || currentCandles.length === 0 || surfaceRef.current.isDeleted) return;

    const surface = surfaceRef.current;
    const wasmContext = surface.webAssemblyContext2D;

    // Suspend updates during batch operations for better performance
    surface.suspendUpdates();

    try {
      // Track which indicator keys are still active
      const activeKeys = new Set<string>(indicators?.keys() ?? []);

      // Remove series for indicators that are no longer active
      for (const [key, seriesList] of indicatorSeriesRef.current) {
        if (!activeKeys.has(key)) {
          for (const series of seriesList) {
            surface.renderableSeries.remove(series);
          }
          indicatorSeriesRef.current.delete(key);
        }
      }

      // Update or create series for active indicators
      if (indicators) {
        for (const [key, { config, data }] of indicators) {
          const { style, id: indicatorId } = config;

          // Skip if not visible
          if (!style.visible) {
            // Remove series if they exist
            const existing = indicatorSeriesRef.current.get(key);
            if (existing) {
              for (const series of existing) {
                surface.renderableSeries.remove(series);
              }
              indicatorSeriesRef.current.delete(key);
            }
            continue;
          }

          // Skip if no data
          if (!data || data.values.length === 0) continue;

          // Special handling for session_levels (uses horizontal line annotations instead of series)
          if (indicatorId === 'session_levels') {
            // Session levels are handled as annotations
            // Add horizontal lines for the most recent values
            const lastPoint = data.values[data.values.length - 1];
            for (const seriesName of data.series) {
              const value = lastPoint[seriesName];
              if (typeof value === 'number') {
                const line = new HorizontalLineAnnotation({
                  y1: value,
                  stroke: style.color,
                  strokeThickness: style.lineWidth,
                  strokeDashArray: LINE_DASH_ARRAYS[style.lineStyle],
                  showLabel: true,
                  labelPlacement: ELabelPlacement.TopRight,
                  labelValue: seriesName.replaceAll('_', ' '),
                });
                surface.annotations.add(line);
              }
            }
            continue;
          }

          // Build indicator line series
          const existingSeries = indicatorSeriesRef.current.get(key);
          const newSeriesList: FastLineRenderableSeries[] = [];

          for (let seriesIndex = 0; seriesIndex < data.series.length; seriesIndex++) {
            const seriesName = data.series[seriesIndex];

            // Build a lookup map for indicator values by Unix timestamp
            const valueByTs = new Map<number, number>();
            for (const point of data.values) {
              const ts = Math.floor(new Date(point.ts).getTime() / 1000);
              const value = point[seriesName];
              if (typeof value === 'number') {
                valueByTs.set(ts, value);
              }
            }

            // Create arrays for ALL candles, using NaN for missing indicator data
            const xValues: number[] = [];
            const yValues: number[] = [];
            let hasData = false;

            for (let i = 0; i < currentCandles.length; i++) {
              const indicatorValue = valueByTs.get(currentCandles[i].time);

              xValues.push(i);
              if (indicatorValue !== undefined) {
                yValues.push(indicatorValue);
                hasData = true;
              } else {
                yValues.push(NaN);
              }
            }

            if (!hasData) continue;

            // Create or update the line series
            const existingLineSeries = existingSeries?.[seriesIndex];

            if (existingLineSeries) {
              // Update existing series - reuse for performance
              const dataSeries = existingLineSeries.dataSeries as XyDataSeries;
              dataSeries.clear();
              dataSeries.appendRange(xValues, yValues);
              dataSeries.containsNaN = true;

              existingLineSeries.stroke = style.color;
              existingLineSeries.strokeThickness = style.lineWidth;
              existingLineSeries.strokeDashArray = LINE_DASH_ARRAYS[style.lineStyle] ?? [];

              newSeriesList.push(existingLineSeries);
            } else {
              // Create new XyDataSeries with NaN support enabled
              const xyDataSeries = new XyDataSeries(wasmContext, {
                xValues,
                yValues,
                containsNaN: true,
              });

              const lineSeries = new FastLineRenderableSeries(wasmContext, {
                dataSeries: xyDataSeries,
                stroke: style.color,
                strokeThickness: style.lineWidth,
                strokeDashArray: LINE_DASH_ARRAYS[style.lineStyle],
              });

              surface.renderableSeries.add(lineSeries);
              newSeriesList.push(lineSeries);
            }
          }

          // Remove any extra series that are no longer needed
          if (existingSeries) {
            for (let i = newSeriesList.length; i < existingSeries.length; i++) {
              surface.renderableSeries.remove(existingSeries[i]);
            }
          }

          indicatorSeriesRef.current.set(key, newSeriesList);
        }
      }
    } finally {
      // Resume updates and trigger a single redraw
      surface.resumeUpdates();
    }
  }, [indicators, candles.length, isInitializing]);

  // Error state - use same container structure as normal render for consistent sizing
  if (error || chartError) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="max-w-md rounded-xl border border-yellow-500/40 bg-yellow-900/20 p-6 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-yellow-300">{error || chartError}</p>
        </div>
      </div>
    );
  }

  // Always render the container div so the ref is available for SciChart initialization
  // Show loading overlay on top when initializing
  return (
    <div className="relative h-full w-full">
      {/* Chart container - unique ID ensures SciChart gets a fresh canvas on remount */}
      <div ref={containerRef} id={`scichart-${chartId}`} className="h-full w-full" />

      {/* Loading overlay */}
      {(isLoading || isInitializing) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-primary)]">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {isInitializing ? 'Initializing chart...' : 'Loading chart...'}
          </div>
        </div>
      )}

      {/* Loading more data indicator */}
      {isLoadingMore && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-[var(--color-surface-primary)]/90 px-3 py-2 text-sm text-[var(--color-text-muted)]">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading older data...
        </div>
      )}
    </div>
  );
});

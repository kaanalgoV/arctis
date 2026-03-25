// Ported from AlgoView CandlestickChart
/**
 * Custom SciChart modifier for interactive drawing tool placement.
 *
 * Uses a dual-mechanism approach for maximum reliability:
 * 1. SciChart modifier chain (modifierMouseDown) — primary path
 * 2. Direct DOM pointerdown listener — fallback if modifier chain fails
 *
 * Both paths funnel through the same handleClick() method to avoid duplication.
 *
 * Single-click tools (hline, vline, text) complete immediately.
 * Two-click tools (trendline, rectangle, location, measure, fibRetracement, fibExtension)
 * require a second click, with live preview updates via modifierMouseMove.
 * Three-click tools (trendChannel, pitchfork) require three clicks.
 */

import { ChartModifierBase2D, DpiHelper, type ModifierMouseArgs } from 'scichart';
import type { DrawingToolType, WipDrawing, ChartDrawing } from '@/types/drawing';

/** Cursor style per drawing tool — provides visual feedback for the active mode. */
const TOOL_CURSORS: Record<DrawingToolType, string> = {
  crosshair: 'default',
  trendline: 'crosshair',
  hline: 'row-resize',
  vline: 'col-resize',
  rectangle: 'crosshair',
  location: 'crosshair',
  text: 'text',
  measure: 'crosshair',
  fibRetracement: 'crosshair',
  fibExtension: 'crosshair',
  trendChannel: 'crosshair',
  pitchfork: 'crosshair',
};

export interface DrawingModifierOptions {
  activeTool: DrawingToolType;
  onDrawingStart: (wip: WipDrawing) => void;
  onDrawingUpdate: (wip: WipDrawing) => void;
  onDrawingComplete: (wip: WipDrawing) => void;
  onCancel: () => void;
  /** Called when a drawing is selected/deselected via click */
  onSelected?: (id: string | null) => void;
  /** Called when an existing text drawing is double-clicked for editing */
  onDrawingDoubleClick?: (drawingId: string) => void;
  /** Current user drawings — needed for double-click hit testing */
  userDrawings?: ChartDrawing[];
  /** Candle OHLC data for snap-to-price feature */
  candles?: Array<{ open: number; high: number; low: number; close: number }>;
  /** Distance in pixels within which snap engages (default: 10) */
  snapThreshold?: number;
  /** Whether magnet (snap-to-price) is enabled (default: true) */
  magnetMode?: boolean;
}

export class DrawingModifier extends ChartModifierBase2D {
  readonly type = 'DrawingModifier';

  private options: DrawingModifierOptions;
  private wipDrawing: WipDrawing | null = null;
  /** Time-based dedup: last time a click was processed via the modifier path */
  private lastHandledTime = 0;
  /** Prevents reentrant calls to processClick (e.g. rapid tool switching) */
  private isProcessing = false;
  /** Direct DOM listener bound reference (for cleanup) */
  private boundDomHandler: ((e: PointerEvent) => void) | null = null;

  constructor(options: DrawingModifierOptions) {
    super();
    // CRITICAL: Receive events even if another modifier marks them as handled.
    // Without this, the CursorModifier or other built-in modifiers can swallow events.
    this.receiveHandledEvents = true;
    this.options = options;
  }

  /** Update callbacks or active tool at runtime. Cancels WIP if tool changes. */
  updateOptions(opts: Partial<DrawingModifierOptions>): void {
    const toolChanged =
      opts.activeTool !== undefined && opts.activeTool !== this.options.activeTool;

    this.options = { ...this.options, ...opts };

    if (toolChanged) {
      this.updateCursor();
      if (this.wipDrawing) {
        this.wipDrawing = null;
        this.options.onCancel();
      }
    }
  }

  override onAttach(): void {
    super.onAttach();
    this.updateCursor();
    this.attachDomListener();
  }

  override onDetach(): void {
    this.detachDomListener();
    const canvas = this.parentSurface?.domCanvas2D;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    super.onDetach();
  }

  // ─── DOM fallback listener ─────────────────────────────────────────

  /** Attach a direct pointerdown listener on the SciChart canvas as fallback. */
  private attachDomListener(): void {
    this.detachDomListener();
    const canvas = this.parentSurface?.domCanvas2D;
    if (!canvas) return;

    this.boundDomHandler = (e: PointerEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      // Only when a drawing tool is active
      if (this.options.activeTool === 'crosshair') return;
      // Skip if the SciChart modifier already handled a click within the last 50ms
      if (Date.now() - this.lastHandledTime < 50) return;

      // Convert DOM coordinates to DPI-scaled canvas-relative coordinates.
      // SciChart's seriesViewRect is in DPI-scaled pixels (offsetX * PIXEL_RATIO),
      // so the DOM fallback must also scale to match.
      const rect = canvas.getBoundingClientRect();
      const dpr = DpiHelper.PIXEL_RATIO;
      const mousePoint = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };

      try {
        const dataPoint = this.pixelToDataFromPoint(mousePoint);
        this.processClick(dataPoint);
      } catch (err) {
        console.warn('[DrawingModifier] DOM fallback click error:', err);
      }
    };

    // Bubble-phase fallback: fires after SciChart's modifier chain
    canvas.addEventListener('pointerdown', this.boundDomHandler, { capture: false });
  }

  private detachDomListener(): void {
    if (!this.boundDomHandler) return;
    const canvas = this.parentSurface?.domCanvas2D;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.boundDomHandler);
    }
    this.boundDomHandler = null;
  }

  // ─── Cursor ────────────────────────────────────────────────────────

  /** Set the canvas cursor to match the active drawing tool. */
  private updateCursor(): void {
    const canvas = this.parentSurface?.domCanvas2D;
    if (!canvas) return;
    canvas.style.cursor = TOOL_CURSORS[this.options.activeTool] ?? 'default';
  }

  // ─── Coordinate conversion ─────────────────────────────────────────

  /** Convert pixel (mouse) coordinates to chart data coordinates, with optional snap-to-price. */
  private pixelToData(mousePoint: { x: number; y: number }): { x: number; y: number } {
    return this.pixelToDataFromPoint(mousePoint);
  }

  /**
   * Core coordinate conversion: pixel position → data coordinates.
   * Used by both the SciChart modifier path and the DOM fallback path.
   */
  private pixelToDataFromPoint(mousePoint: { x: number; y: number }): { x: number; y: number } {
    const surface = this.parentSurface;
    if (!surface) throw new Error('No parentSurface');

    const xAxis = surface.xAxes?.get(0);
    const yAxis = surface.yAxes?.get(0);
    if (!xAxis || !yAxis) {
      throw new Error('Axes not available');
    }

    const xCalc = xAxis.getCurrentCoordinateCalculator();
    const yCalc = yAxis.getCurrentCoordinateCalculator();
    if (!xCalc || !yCalc) {
      throw new Error('Coordinate calculators not available');
    }

    const seriesArea = surface.seriesViewRect;
    if (!seriesArea) {
      throw new Error('seriesViewRect not available');
    }

    const relX = mousePoint.x - seriesArea.left;
    const relY = mousePoint.y - seriesArea.top;

    const dataX = xCalc.getDataValue(relX);
    const dataY = yCalc.getDataValue(relY);

    return {
      x: dataX,
      y: this.snapToPrice(dataX, dataY),
    };
  }

  /**
   * Snap Y coordinate to the nearest OHLC price level if within the pixel threshold.
   */
  private snapToPrice(dataX: number, dataY: number): number {
    const { candles, snapThreshold = 10, magnetMode = true } = this.options;
    if (!magnetMode || !candles?.length) return dataY;

    const idx = Math.round(dataX);
    if (idx < 0 || idx >= candles.length) return dataY;

    const candle = candles[idx];
    const prices = [candle.open, candle.high, candle.low, candle.close];

    let nearest = dataY;
    let minDist = Infinity;
    for (const p of prices) {
      const dist = Math.abs(p - dataY);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    const yCalc = this.parentSurface?.yAxes.get(0)?.getCurrentCoordinateCalculator();
    if (yCalc) {
      const pixelNearest = yCalc.getCoordinate(nearest);
      const pixelData = yCalc.getCoordinate(dataY);
      if (Math.abs(pixelNearest - pixelData) < snapThreshold) {
        return nearest;
      }
    }

    return dataY;
  }

  // ─── Tool classification ───────────────────────────────────────────

  private isSingleClickTool(tool: DrawingToolType): boolean {
    return tool === 'hline' || tool === 'vline' || tool === 'text';
  }

  private isThreeClickTool(tool: DrawingToolType): boolean {
    return tool === 'trendChannel' || tool === 'pitchfork';
  }

  // ─── Core click processing (shared by modifier + DOM paths) ────────

  /** Reject NaN, Infinity, or obviously out-of-range coordinates. */
  private isValidCoordinate(pt: { x: number; y: number }): boolean {
    return (
      Number.isFinite(pt.x) &&
      Number.isFinite(pt.y) &&
      Math.abs(pt.x) < 1_000_000 &&
      Math.abs(pt.y) < 1_000_000
    );
  }

  /**
   * Process a click at the given data coordinates.
   * This is the single source of truth for all click handling.
   */
  private processClick(dataPoint: { x: number; y: number }): void {
    if (this.isProcessing) return;

    // Guard: reject invalid coordinates (NaN, Infinity, absurd values)
    if (!this.isValidCoordinate(dataPoint)) {
      console.warn('[DrawingModifier] Rejected invalid coordinates:', dataPoint);
      return;
    }

    this.isProcessing = true;

    try {
      this.processClickInner(dataPoint);
    } finally {
      this.isProcessing = false;
    }
  }

  private processClickInner(dataPoint: { x: number; y: number }): void {
    const { activeTool } = this.options;

    if (!this.wipDrawing) {
      // First click — start a new drawing
      const wip: WipDrawing = {
        type: activeTool,
        x1: dataPoint.x,
        y1: dataPoint.y,
        clickCount: 1,
      };

      if (this.isSingleClickTool(activeTool)) {
        this.options.onDrawingComplete(wip);
      } else {
        this.wipDrawing = wip;
        this.options.onDrawingStart(wip);
      }
    } else if (this.wipDrawing.clickCount === 1 && this.isThreeClickTool(activeTool)) {
      // Second click for three-click tools
      this.wipDrawing = {
        ...this.wipDrawing,
        x2: dataPoint.x,
        y2: dataPoint.y,
        clickCount: 2,
      };
      this.options.onDrawingUpdate(this.wipDrawing);
    } else if (this.wipDrawing.clickCount === 2 && this.isThreeClickTool(activeTool)) {
      // Third click for three-click tools — complete
      this.wipDrawing = {
        ...this.wipDrawing,
        x3: dataPoint.x,
        y3: dataPoint.y,
        clickCount: 3,
      };
      this.options.onDrawingComplete(this.wipDrawing);
      this.wipDrawing = null;
    } else {
      // Second click — complete two-point drawing
      this.wipDrawing = {
        ...this.wipDrawing,
        x2: dataPoint.x,
        y2: dataPoint.y,
        clickCount: 2,
      };
      this.options.onDrawingComplete(this.wipDrawing);
      this.wipDrawing = null;
    }
  }

  // ─── SciChart modifier overrides ───────────────────────────────────

  /**
   * Cancel the current WIP drawing without changing the active tool.
   * If `notify` is true (default), calls onCancel to sync external state.
   * Pass `notify: false` when the external state is already cleared (e.g. store subscription).
   */
  cancelWip(notify = true): void {
    if (this.wipDrawing) {
      this.wipDrawing = null;
      if (notify) {
        this.options.onCancel();
      }
    }
  }

  /** Returns whether a WIP drawing is in progress. */
  hasWip(): boolean {
    return this.wipDrawing !== null;
  }

  override modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);

    const { activeTool } = this.options;

    // In crosshair mode: clicking empty space deselects any selected drawing
    if (activeTool === 'crosshair') {
      this.options.onSelected?.(null);
      return;
    }

    // Only handle left mouse button
    if (args.nativeEvent && (args.nativeEvent as MouseEvent).button !== 0) return;

    // Guard: ensure axes are ready
    const xAxis = this.parentSurface?.xAxes?.get(0);
    const yAxis = this.parentSurface?.yAxes?.get(0);
    if (!xAxis || !yAxis) return;

    try {
      const dataPoint = this.pixelToData(args.mousePoint);

      // Mark time so DOM fallback doesn't double-fire
      this.lastHandledTime = Date.now();

      this.processClick(dataPoint);
      args.handled = true;
    } catch (err) {
      console.warn('[DrawingModifier] mouseDown error:', err);
    }
  }

  override modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    if (!this.wipDrawing) return;

    // Also mark mouse move as handled to prevent pan while drawing
    const { activeTool } = this.options;
    if (activeTool !== 'crosshair') {
      args.handled = true;
    }

    try {
      const dataPoint = this.pixelToData(args.mousePoint);
      if (!this.isValidCoordinate(dataPoint)) return;

      if (this.wipDrawing.clickCount === 2 && this.isThreeClickTool(this.wipDrawing.type)) {
        this.wipDrawing = {
          ...this.wipDrawing,
          x3: dataPoint.x,
          y3: dataPoint.y,
        };
      } else {
        this.wipDrawing = {
          ...this.wipDrawing,
          x2: dataPoint.x,
          y2: dataPoint.y,
        };
      }

      this.options.onDrawingUpdate(this.wipDrawing);
    } catch (_err) {
      // Silently ignore move errors (common during rapid mouse movement)
    }
  }

  override modifierDoubleClick(args: ModifierMouseArgs): void {
    super.modifierDoubleClick(args);

    const { onDrawingDoubleClick, userDrawings } = this.options;
    if (!onDrawingDoubleClick || !userDrawings?.length) return;

    const textDrawings = userDrawings.filter((d) => d.type === 'text' && d.visible);
    if (textDrawings.length === 0) return;

    try {
      const dataPoint = this.pixelToData(args.mousePoint);
      const HIT_X_THRESHOLD = 2;

      for (const drawing of textDrawings) {
        const dx = Math.abs(drawing.x1 - dataPoint.x);
        if (dx > HIT_X_THRESHOLD) continue;

        const yCalc = this.parentSurface?.yAxes.get(0)?.getCurrentCoordinateCalculator();
        if (yCalc) {
          const pxDrawing = yCalc.getCoordinate(drawing.y1);
          const pxClick = yCalc.getCoordinate(dataPoint.y);
          if (Math.abs(pxDrawing - pxClick) > 50) continue;
        }

        onDrawingDoubleClick(drawing.id);
        args.handled = true;
        return;
      }
    } catch (err) {
      console.warn('[DrawingModifier] doubleClick error:', err);
    }
  }
}

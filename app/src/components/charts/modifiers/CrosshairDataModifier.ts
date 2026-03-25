// Ported from AlgoView CandlestickChart
/**
 * Custom SciChart modifier that tracks crosshair position and provides
 * OHLCV data for the hovered candle via a callback.
 *
 * Used to display candle data in the chart header (similar to TradingView).
 */

import { ChartModifierBase2D, type ModifierMouseArgs } from 'scichart';

export interface CrosshairCandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
}

export interface CrosshairDataModifierOptions {
  /** Called when the mouse moves over a candle. null when mouse leaves chart. */
  onCrosshairMove: (data: CrosshairCandleData | null) => void;
  /** Reference to candle data array (kept in sync externally) */
  getCandles: () => Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>;
}

export class CrosshairDataModifier extends ChartModifierBase2D {
  readonly type = 'CrosshairDataModifier';

  private options: CrosshairDataModifierOptions;
  private lastIndex = -1;

  constructor(options: CrosshairDataModifierOptions) {
    super();
    this.options = options;
  }

  updateOptions(options: Partial<CrosshairDataModifierOptions>): void {
    Object.assign(this.options, options);
  }

  override modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    const surface = this.parentSurface;
    if (!surface) return;

    const xAxis = surface.xAxes.get(0);
    if (!xAxis) return;

    // Convert mouse pixel position to data coordinate (candle index)
    const seriesViewRect = surface.seriesViewRect;
    if (!seriesViewRect) return;

    // Only process if mouse is within the series view area
    const mouseX = args.mousePoint.x;
    const mouseY = args.mousePoint.y;
    if (
      mouseX < seriesViewRect.left ||
      mouseX > seriesViewRect.right ||
      mouseY < seriesViewRect.top ||
      mouseY > seriesViewRect.bottom
    ) {
      if (this.lastIndex !== -1) {
        this.lastIndex = -1;
        this.options.onCrosshairMove(null);
      }
      return;
    }

    // Use the coordinate calculator to convert pixel -> data index
    const calc = xAxis.getCurrentCoordinateCalculator();
    const dataValue = calc.getDataValue(mouseX);
    const index = Math.round(dataValue);

    // Avoid redundant callbacks for the same index
    if (index === this.lastIndex) return;

    const candles = this.options.getCandles();
    if (index < 0 || index >= candles.length) {
      if (this.lastIndex !== -1) {
        this.lastIndex = -1;
        this.options.onCrosshairMove(null);
      }
      return;
    }

    this.lastIndex = index;
    const candle = candles[index];
    this.options.onCrosshairMove({
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      time: candle.time,
    });
  }

  override modifierMouseLeave(args: ModifierMouseArgs): void {
    super.modifierMouseLeave(args);
    if (this.lastIndex !== -1) {
      this.lastIndex = -1;
      this.options.onCrosshairMove(null);
    }
  }
}

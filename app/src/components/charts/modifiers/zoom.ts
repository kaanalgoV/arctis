// Ported from AlgoView CandlestickChart
/**
 * Custom SciChart modifiers for axis drag-to-zoom functionality.
 *
 * These modifiers provide intuitive zoom behavior:
 * - YAxisDragZoomModifier: Drag up = zoom in, drag down = zoom out
 * - XAxisDragZoomModifier: Drag right = zoom in, drag left = zoom out
 */

import { ChartModifierBase2D, NumberRange, type ModifierMouseArgs } from 'scichart';

/**
 * Y-axis drag zoom modifier with consistent behavior:
 * - Drag up = zoom in (scale larger)
 * - Drag down = zoom out (scale smaller)
 * Shows ns-resize cursor when hovering over Y-axis.
 */
export class YAxisDragZoomModifier extends ChartModifierBase2D {
  readonly type = 'YAxisDragZoom';
  private isDragging = false;
  private lastY = 0;
  private isOverYAxis = false;
  private readonly sensitivity: number;

  constructor(sensitivity = 0.005) {
    super();
    this.sensitivity = sensitivity;
  }

  private isPointOverYAxis(x: number, y: number): boolean {
    const yAxis = this.parentSurface?.yAxes.get(0);
    if (!yAxis) return false;
    const axisRect = yAxis.viewRect;
    if (!axisRect) return false;
    return x >= axisRect.left && x <= axisRect.right && y >= axisRect.top && y <= axisRect.bottom;
  }

  private setCursor(cursor: string): void {
    const domCanvas = this.parentSurface?.domCanvas2D;
    if (domCanvas) {
      domCanvas.style.cursor = cursor;
    }
  }

  override modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    if (this.isPointOverYAxis(args.mousePoint.x, args.mousePoint.y)) {
      this.isDragging = true;
      this.lastY = args.mousePoint.y;
      args.handled = true;
    }
  }

  override modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    const overYAxis = this.isPointOverYAxis(args.mousePoint.x, args.mousePoint.y);

    if (overYAxis && !this.isOverYAxis) {
      this.setCursor('ns-resize');
      this.isOverYAxis = true;
    } else if (!overYAxis && this.isOverYAxis && !this.isDragging) {
      this.setCursor('default');
      this.isOverYAxis = false;
    }

    if (!this.isDragging) return;

    const yAxis = this.parentSurface?.yAxes.get(0);
    if (!yAxis) return;

    const deltaY = this.lastY - args.mousePoint.y;
    this.lastY = args.mousePoint.y;

    const zoomFactor = 1 + deltaY * this.sensitivity;
    const visibleRange = yAxis.visibleRange;
    const center = (visibleRange.min + visibleRange.max) / 2;
    const halfRange = (visibleRange.max - visibleRange.min) / 2;
    const newHalfRange = halfRange / zoomFactor;
    yAxis.visibleRange = new NumberRange(center - newHalfRange, center + newHalfRange);

    args.handled = true;
  }

  override modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
    this.isDragging = false;
    if (!this.isPointOverYAxis(args.mousePoint.x, args.mousePoint.y)) {
      this.setCursor('default');
      this.isOverYAxis = false;
    }
  }
}

/**
 * X-axis drag zoom modifier with consistent behavior:
 * - Drag right = zoom in (scale larger)
 * - Drag left = zoom out (scale smaller)
 * Shows ew-resize cursor when hovering over X-axis.
 */
export class XAxisDragZoomModifier extends ChartModifierBase2D {
  readonly type = 'XAxisDragZoom';
  private isDragging = false;
  private lastX = 0;
  private isOverXAxis = false;
  private readonly sensitivity: number;

  constructor(sensitivity = 0.003) {
    super();
    this.sensitivity = sensitivity;
  }

  private isPointOverXAxis(x: number, y: number): boolean {
    const seriesViewRect = this.parentSurface?.seriesViewRect;
    if (!seriesViewRect) return false;
    return y > seriesViewRect.bottom && x >= seriesViewRect.left && x <= seriesViewRect.right;
  }

  private setCursor(cursor: string): void {
    const domCanvas = this.parentSurface?.domCanvas2D;
    if (domCanvas) {
      domCanvas.style.cursor = cursor;
    }
  }

  override modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    if (this.isPointOverXAxis(args.mousePoint.x, args.mousePoint.y)) {
      this.isDragging = true;
      this.lastX = args.mousePoint.x;
      args.handled = true;
    }
  }

  override modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    const overXAxis = this.isPointOverXAxis(args.mousePoint.x, args.mousePoint.y);

    if (overXAxis && !this.isOverXAxis) {
      this.setCursor('ew-resize');
      this.isOverXAxis = true;
    } else if (!overXAxis && this.isOverXAxis && !this.isDragging) {
      this.setCursor('default');
      this.isOverXAxis = false;
    }

    if (!this.isDragging) return;

    const xAxis = this.parentSurface?.xAxes.get(0);
    if (!xAxis) return;

    const deltaX = args.mousePoint.x - this.lastX;
    this.lastX = args.mousePoint.x;

    const zoomFactor = 1 + deltaX * this.sensitivity;
    const visibleRange = xAxis.visibleRange;
    const center = (visibleRange.min + visibleRange.max) / 2;
    const halfRange = (visibleRange.max - visibleRange.min) / 2;
    const newHalfRange = halfRange / zoomFactor;
    xAxis.visibleRange = new NumberRange(center - newHalfRange, center + newHalfRange);

    args.handled = true;
  }

  override modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
    this.isDragging = false;
    if (!this.isPointOverXAxis(args.mousePoint.x, args.mousePoint.y)) {
      this.setCursor('default');
      this.isOverXAxis = false;
    }
  }
}

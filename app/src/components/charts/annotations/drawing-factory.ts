// Ported from AlgoView CandlestickChart
/**
 * Annotation factory for user drawings.
 * Converts ChartDrawing objects into SciChart annotation(s).
 */

import {
  LineAnnotation,
  HorizontalLineAnnotation,
  VerticalLineAnnotation,
  BoxAnnotation,
  NativeTextAnnotation,
  ECoordinateMode,
  ELabelPlacement,
} from 'scichart';
import type { IAnnotation } from 'scichart';
import type { ChartDrawing } from '@/types/drawing';
import type { LineStyle } from '@/types/api';

/** Callbacks for syncing annotation edits back to the drawing store. */
export interface AnnotationFactoryCallbacks {
  onDragEnd: (id: string, updates: Partial<ChartDrawing>) => void;
  onSelected: (id: string) => void;
}

/** SciChart annotations expose EventHandler properties not on the IAnnotation interface. */
interface SciChartAnnotationEvents {
  dragEnded?: { subscribe: (cb: () => void) => void };
  clicked?: { subscribe: (cb: () => void) => void };
}

/** Default Fibonacci retracement levels. */
const DEFAULT_FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

/**
 * Convert a LineStyle to a strokeDashArray for SciChart.
 * - solid  -> undefined (SciChart default)
 * - dashed -> [5, 5]
 * - dotted -> [2, 2]
 */
function lineStyleToDash(style: LineStyle): number[] | undefined {
  switch (style) {
    case 'dashed':
      return [5, 5];
    case 'dotted':
      return [2, 2];
    default:
      return undefined;
  }
}

/**
 * Append an alpha hex suffix to a color string.
 * SciChart accepts colors like "#FF000033" where the last 2 hex digits are alpha.
 */
function colorWithAlpha(color: string, opacity: number): string {
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  // Normalize short hex (#RGB -> #RRGGBB) before appending alpha
  let hex = color;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex + alpha.toString(16).padStart(2, '0');
}

/**
 * Wire up common editable behavior on an annotation:
 * - `dragEnded` syncs positions back to the store (fires for BOTH moves and adorner resizes)
 * - `clicked` fires the selection callback
 */
function wireCallbacks(
  annotation: IAnnotation,
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): void {
  // Cast to access SciChart EventHandler properties not on IAnnotation.
  const base = annotation as unknown as SciChartAnnotationEvents;

  // dragEnded fires for both whole-annotation moves AND adorner resize (corner/edge drag).
  // After drag, annotation.x1/y1/x2/y2 reflect the new coordinates.
  if (base.dragEnded?.subscribe) {
    base.dragEnded.subscribe(() => {
      const updates: Partial<ChartDrawing> = {
        x1: annotation.x1,
        y1: annotation.y1,
        x2: annotation.x2,
        y2: annotation.y2,
      };
      // For 3-point tools (trendChannel, pitchfork): translate x3/y3 only on
      // whole-annotation moves (not adorner/corner resizes).
      // Detection: if both (x1,y1) AND (x2,y2) shifted by the same delta, it's a move.
      if (drawing.x3 !== undefined && drawing.y3 !== undefined) {
        const dx1 = annotation.x1 - drawing.x1;
        const dy1 = annotation.y1 - drawing.y1;
        const dx2 = (annotation.x2 ?? 0) - (drawing.x2 ?? 0);
        const dy2 = (annotation.y2 ?? 0) - (drawing.y2 ?? 0);

        const isWholeMove =
          Math.abs(dx1 - dx2) < 0.001 && Math.abs(dy1 - dy2) < 0.001;

        if (isWholeMove) {
          updates.x3 = drawing.x3 + dx1;
          updates.y3 = drawing.y3 + dy1;
        }
        // On resize (not a whole move), x3/y3 stay unchanged
      }
      callbacks.onDragEnd(drawing.id, updates);
    });
  }

  if (base.clicked?.subscribe) {
    base.clicked.subscribe(() => {
      callbacks.onSelected(drawing.id);
    });
  }
}

/**
 * Shared base options applied to every annotation created from a drawing.
 */
function baseOptions(drawing: ChartDrawing) {
  return {
    id: drawing.id,
    isEditable: !drawing.locked,
    opacity: drawing.opacity,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
  } as const;
}

// --- Individual drawing type builders ----------------------------------------

function createTrendline(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): IAnnotation[] {
  const annotation = new LineAnnotation({
    ...baseOptions(drawing),
    x1: drawing.x1,
    y1: drawing.y1,
    x2: drawing.x2 ?? drawing.x1,
    y2: drawing.y2 ?? drawing.y1,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });
  wireCallbacks(annotation, drawing, callbacks);
  return [annotation];
}

function createHLine(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks,
  pricePrecision = 2,
): IAnnotation[] {
  const annotation = new HorizontalLineAnnotation({
    ...baseOptions(drawing),
    y1: drawing.y1,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
    showLabel: true,
    labelPlacement: ELabelPlacement.TopRight,
    labelValue: drawing.y1.toFixed(pricePrecision),
  });
  wireCallbacks(annotation, drawing, callbacks);
  return [annotation];
}

function createVLine(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): IAnnotation[] {
  const annotation = new VerticalLineAnnotation({
    ...baseOptions(drawing),
    x1: drawing.x1,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });
  wireCallbacks(annotation, drawing, callbacks);
  return [annotation];
}

function createRectangle(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): IAnnotation[] {
  // Use dedicated fill properties if set, otherwise default to 20% of stroke color.
  // Note: baseOptions sets annotation-level opacity, so fill alpha should NOT
  // also multiply by drawing.opacity (that would double-apply).
  const fillColor = drawing.fillColor ?? drawing.color;
  const fillOpacity = drawing.fillOpacity ?? 0.2;
  const annotation = new BoxAnnotation({
    ...baseOptions(drawing),
    x1: drawing.x1,
    y1: drawing.y1,
    x2: drawing.x2 ?? drawing.x1,
    y2: drawing.y2 ?? drawing.y1,
    fill: colorWithAlpha(fillColor, fillOpacity),
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
  });
  wireCallbacks(annotation, drawing, callbacks);
  return [annotation];
}

function createText(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): IAnnotation[] {
  const annotation = new NativeTextAnnotation({
    ...baseOptions(drawing),
    x1: drawing.x1,
    y1: drawing.y1,
    text: drawing.text ?? 'Text',
    textColor: drawing.color,
    fontSize: drawing.fontSize ?? 14,
    fontFamily: 'sans-serif',
  });
  wireCallbacks(annotation, drawing, callbacks);
  return [annotation];
}

function createMeasure(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks,
  tickSize?: number,
  pricePrecision = 2,
): IAnnotation[] {
  const x1 = drawing.x1;
  const y1 = drawing.y1;
  const x2 = drawing.x2 ?? x1;
  const y2 = drawing.y2 ?? y1;

  // Dashed measurement line
  const line = new LineAnnotation({
    ...baseOptions(drawing),
    x1,
    y1,
    x2,
    y2,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle) ?? [5, 5],
  });
  wireCallbacks(line, drawing, callbacks);

  // Compute measurement values
  const bars = Math.abs(Math.round(x2 - x1));
  const priceDiff = y2 - y1;
  const pctChange = y1 !== 0 ? (priceDiff / y1) * 100 : 0;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const sign = priceDiff >= 0 ? '+' : '';
  const absDiff = Math.abs(priceDiff);

  // Tick count (if tickSize available)
  const ticks = tickSize && tickSize > 0
    ? Math.round(absDiff / tickSize)
    : null;

  // Format: "+12.50 (+0.25%) | 50 ticks | 5 bars"
  const parts = [`${sign}${priceDiff.toFixed(pricePrecision)} (${sign}${pctChange.toFixed(2)}%)`];
  if (ticks !== null) parts.push(`${ticks} ticks`);
  parts.push(`${bars} bars`);
  const labelText = parts.join(' | ');

  const label = new NativeTextAnnotation({
    id: `${drawing.id}_label`,
    x1: midX,
    y1: midY,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    text: labelText,
    textColor: drawing.color,
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: drawing.opacity,
  });

  return [line, label];
}

function createFibRetracement(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks,
  pricePrecision = 2,
): IAnnotation[] {
  const y1 = drawing.y1;
  const y2 = drawing.y2 ?? y1;
  const levels = drawing.levels ?? DEFAULT_FIB_LEVELS;
  const range = y2 - y1;

  const annotations: IAnnotation[] = [];

  for (const level of levels) {
    const yLevel = y1 + range * level;
    const pct = (level * 100).toFixed(1);

    const line = new HorizontalLineAnnotation({
      id: `${drawing.id}_fib_${level}`,
      isEditable: false,
      opacity: drawing.opacity,
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      y1: yLevel,
      stroke: drawing.color,
      strokeThickness: drawing.lineWidth,
      strokeDashArray: lineStyleToDash(drawing.lineStyle),
      showLabel: true,
      labelPlacement: ELabelPlacement.TopRight,
      labelValue: `${pct}% (${yLevel.toFixed(pricePrecision)})`,
    });

    annotations.push(line);
  }

  // Wire click-to-select on ALL fib level lines (not just the first).
  // Fib levels are not editable/draggable, so we only wire clicked — not dragEnded.
  for (const ann of annotations) {
    const base = ann as unknown as SciChartAnnotationEvents;
    if (base.clicked?.subscribe) {
      base.clicked.subscribe(() => callbacks.onSelected(drawing.id));
    }
  }

  return annotations;
}

/** Default Fibonacci extension levels. */
const DEFAULT_FIB_EXTENSION_LEVELS = [0, 0.618, 1.0, 1.618, 2.618, 4.236];

/** Opacity multipliers per extension level index for visual hierarchy. */
const FIB_EXTENSION_OPACITIES = [0.3, 0.5, 0.7, 0.85, 1.0, 1.0];

function createFibExtension(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks,
  pricePrecision = 2,
): IAnnotation[] {
  const y1 = drawing.y1;
  const y2 = drawing.y2 ?? y1;
  const levels = drawing.levels ?? DEFAULT_FIB_EXTENSION_LEVELS;
  const range = y2 - y1;

  const annotations: IAnnotation[] = [];

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const yLevel = y1 + range * level;
    const pct = (level * 100).toFixed(1);
    const levelOpacity = drawing.opacity * (FIB_EXTENSION_OPACITIES[i] ?? 1.0);

    const line = new HorizontalLineAnnotation({
      id: `${drawing.id}_fibext_${level}`,
      isEditable: false,
      opacity: levelOpacity,
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      y1: yLevel,
      stroke: drawing.color,
      strokeThickness: drawing.lineWidth,
      strokeDashArray: lineStyleToDash(drawing.lineStyle),
      showLabel: true,
      labelPlacement: ELabelPlacement.TopRight,
      labelValue: `${pct}% (${yLevel.toFixed(pricePrecision)})`,
    });

    annotations.push(line);
  }

  // Wire click-to-select on ALL fib level lines.
  for (const ann of annotations) {
    const base = ann as unknown as SciChartAnnotationEvents;
    if (base.clicked?.subscribe) {
      base.clicked.subscribe(() => callbacks.onSelected(drawing.id));
    }
  }

  return annotations;
}

function createLocation(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks,
  pricePrecision = 2,
): IAnnotation[] {
  const y1 = drawing.y1;
  const y2 = drawing.y2 ?? y1;

  // Location extends infinitely left and right — use extreme X range
  const fillColor = colorWithAlpha(drawing.fillColor ?? drawing.color, drawing.fillOpacity ?? 0.15);
  const borderColor = drawing.borderColor ?? drawing.color;
  const borderWidth = drawing.borderWidth ?? drawing.lineWidth;

  const box = new BoxAnnotation({
    ...baseOptions(drawing),
    x1: -1_000_000,
    y1,
    x2: 1_000_000,
    y2,
    fill: fillColor,
    stroke: borderColor,
    strokeThickness: borderWidth,
  });
  wireCallbacks(box, drawing, callbacks);

  // Price label on right side showing the range
  const midY = (y1 + y2) / 2;
  const range = Math.abs(y2 - y1);
  const label = new NativeTextAnnotation({
    id: `${drawing.id}_label`,
    x1: 1_000_000,
    y1: midY,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    text: `${Math.min(y1, y2).toFixed(pricePrecision)} - ${Math.max(y1, y2).toFixed(pricePrecision)} (${range.toFixed(pricePrecision)})`,
    textColor: borderColor,
    fontSize: 11,
    fontFamily: 'monospace',
    opacity: drawing.opacity,
  });

  return [box, label];
}

function createTrendChannel(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): IAnnotation[] {
  const x1 = drawing.x1;
  const y1 = drawing.y1;
  const x2 = drawing.x2 ?? x1;
  const y2 = drawing.y2 ?? y1;
  const x3 = drawing.x3 ?? x1;
  const y3 = drawing.y3 ?? y1;

  // Main line: (x1,y1) -> (x2,y2)
  const mainLine = new LineAnnotation({
    ...baseOptions(drawing),
    x1,
    y1,
    x2,
    y2,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });
  wireCallbacks(mainLine, drawing, callbacks);

  // The parallel line passes through point3 with the same slope as the main line.
  // Offset = vector from point1 to point3, applied to both endpoints of the main line.
  const offsetX = x3 - x1;
  const offsetY = y3 - y1;
  const parallelLine = new LineAnnotation({
    id: `${drawing.id}_parallel`,
    isEditable: false,
    opacity: drawing.opacity,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    x1: x1 + offsetX,
    y1: y1 + offsetY,
    x2: x2 + offsetX,
    y2: y2 + offsetY,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });

  // Semi-transparent fill between the two lines (approximated as a box)
  const fillColor = colorWithAlpha(drawing.color, 0.03);
  const allX = [x1, x2, x1 + offsetX, x2 + offsetX];
  const allY = [y1, y2, y1 + offsetY, y2 + offsetY];
  const fillBox = new BoxAnnotation({
    id: `${drawing.id}_fill`,
    isEditable: false,
    opacity: drawing.opacity,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    x1: Math.min(...allX),
    y1: Math.min(...allY),
    x2: Math.max(...allX),
    y2: Math.max(...allY),
    fill: fillColor,
    stroke: 'transparent',
    strokeThickness: 0,
  });

  return [fillBox, mainLine, parallelLine];
}

function createPitchfork(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks
): IAnnotation[] {
  // Pitchfork (Andrew's Pitchfork):
  // Point A (x1,y1) = handle
  // Point B (x2,y2) = start of move
  // Point C (x3,y3) = end of move
  const ax = drawing.x1;
  const ay = drawing.y1;
  const bx = drawing.x2 ?? ax;
  const by = drawing.y2 ?? ay;
  const cx = drawing.x3 ?? ax;
  const cy = drawing.y3 ?? ay;

  // Midpoint of BC
  const midX = (bx + cx) / 2;
  const midY = (by + cy) / 2;

  // Median line direction: from A through midpoint of BC
  const medDx = midX - ax;
  const medDy = midY - ay;

  // Extend the lines far enough to be visible (2x the A-to-midpoint distance)
  const extFactor = 3;
  const medEndX = ax + medDx * extFactor;
  const medEndY = ay + medDy * extFactor;

  // Median line: A -> extended through midpoint(BC)
  const medianLine = new LineAnnotation({
    ...baseOptions(drawing),
    x1: ax,
    y1: ay,
    x2: medEndX,
    y2: medEndY,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });
  wireCallbacks(medianLine, drawing, callbacks);

  // Upper prong: from B, parallel to the median line
  const upperLine = new LineAnnotation({
    id: `${drawing.id}_upper`,
    isEditable: false,
    opacity: drawing.opacity,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    x1: bx,
    y1: by,
    x2: bx + medDx * extFactor,
    y2: by + medDy * extFactor,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });

  // Lower prong: from C, parallel to the median line
  const lowerLine = new LineAnnotation({
    id: `${drawing.id}_lower`,
    isEditable: false,
    opacity: drawing.opacity,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    x1: cx,
    y1: cy,
    x2: cx + medDx * extFactor,
    y2: cy + medDy * extFactor,
    stroke: drawing.color,
    strokeThickness: drawing.lineWidth,
    strokeDashArray: lineStyleToDash(drawing.lineStyle),
  });

  return [medianLine, upperLine, lowerLine];
}

// --- Main factory --------------------------------------------------------

/**
 * Converts a ChartDrawing into one or more SciChart annotations.
 *
 * @param drawing - The serialized drawing definition
 * @param callbacks - Drag-end and selection callbacks
 * @returns Array of IAnnotation (empty if drawing is invisible)
 */
export function createDrawingAnnotation(
  drawing: ChartDrawing,
  callbacks: AnnotationFactoryCallbacks,
  tickSize?: number,
  pricePrecision = 2,
): IAnnotation[] {
  if (!drawing.visible) return [];

  switch (drawing.type) {
    case 'trendline':
      return createTrendline(drawing, callbacks);
    case 'hline':
      return createHLine(drawing, callbacks, pricePrecision);
    case 'vline':
      return createVLine(drawing, callbacks);
    case 'rectangle':
      return createRectangle(drawing, callbacks);
    case 'location':
      return createLocation(drawing, callbacks, pricePrecision);
    case 'text':
      return createText(drawing, callbacks);
    case 'measure':
      return createMeasure(drawing, callbacks, tickSize, pricePrecision);
    case 'fibRetracement':
      return createFibRetracement(drawing, callbacks, pricePrecision);
    case 'fibExtension':
      return createFibExtension(drawing, callbacks, pricePrecision);
    case 'trendChannel':
      return createTrendChannel(drawing, callbacks);
    case 'pitchfork':
      return createPitchfork(drawing, callbacks);
    case 'crosshair':
      // Crosshair is a tool mode, not a persistent annotation
      return [];
  }
}

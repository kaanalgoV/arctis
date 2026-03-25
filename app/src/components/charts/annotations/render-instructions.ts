// Ported from AlgoView CandlestickChart
/**
 * Render instruction annotation builder.
 * Converts indicator render instructions to SciChart annotations.
 *
 * See /crates/alg-indicators/src/render.rs for the backend render instruction types.
 */

import {
  BoxAnnotation,
  ECoordinateMode,
  VerticalLineAnnotation,
  HorizontalLineAnnotation,
  CustomAnnotation,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
  type IAnnotation,
} from 'scichart';
import type {
  RenderInstruction,
  TimeRangeRect,
  PriceRangeRect,
  BoxRect,
  VerticalLineMarker,
  HorizontalLineMarker,
  PointMarker,
  IndicatorResult,
  LineStyle,
} from '@/types/api';
import type { ActiveIndicator } from '@/types/chart';
import type { AnnotationContext } from './types';

interface IndicatorData {
  config: ActiveIndicator;
  data: IndicatorResult | null;
}

/**
 * Convert a LineStyle to a strokeDashArray for SciChart.
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
 * Creates annotations from indicator render instructions.
 *
 * Supports all render instruction types:
 * - time_range: Full-height rectangles for session backgrounds
 * - box: Price-bounded rectangles for session high/low ranges
 * - price_range: Horizontal band across full width at a price range
 * - vertical_line: Vertical line at a timestamp
 * - horizontal_line: Horizontal line at a price level
 * - marker: Point marker at a specific time/price
 *
 * @param indicators - Map of indicator key -> indicator data
 * @param ctx - Annotation context with chart data and settings
 * @returns Array of annotation objects (inserted at beginning for background layer)
 */
export function createRenderInstructionAnnotations(
  indicators: Map<string, IndicatorData> | undefined,
  ctx: AnnotationContext
): IAnnotation[] {
  if (!indicators || indicators.size === 0) return [];

  const annotations: IAnnotation[] = [];

  for (const { data } of indicators.values()) {
    if (!data?.values) continue;

    for (const point of data.values) {
      const renderInstructions = point.render as RenderInstruction[] | undefined;
      if (!renderInstructions) continue;

      for (const instruction of renderInstructions) {
        const annotation = createAnnotationFromInstruction(instruction, ctx);
        if (annotation) annotations.push(annotation);
      }
    }
  }

  return annotations;
}

/**
 * Creates a SciChart annotation from a render instruction.
 */
function createAnnotationFromInstruction(
  instruction: RenderInstruction,
  ctx: AnnotationContext
): IAnnotation | null {
  switch (instruction.type) {
    case 'time_range':
      return createTimeRangeAnnotation(instruction, ctx);
    case 'box':
      return createBoxRectAnnotation(instruction, ctx);
    case 'price_range':
      return createPriceRangeAnnotation(instruction, ctx);
    case 'vertical_line':
      return createVerticalLineAnnotation(instruction, ctx);
    case 'horizontal_line':
      return createHorizontalLineAnnotation(instruction, ctx);
    case 'marker':
      return createPointMarkerAnnotation(instruction, ctx);
    default:
      return null;
  }
}

/**
 * Creates a full-height box annotation for a time range.
 * Used for session backgrounds.
 */
function createTimeRangeAnnotation(
  rect: TimeRangeRect,
  ctx: AnnotationContext
): BoxAnnotation | null {
  const fromTs = Math.floor(new Date(rect.from).getTime() / 1000);
  const toTs = Math.floor(new Date(rect.to).getTime() / 1000);
  const fromIndex = ctx.findCandleIndex(fromTs);
  const toIndex = ctx.findCandleIndex(toTs);

  // Skip if we can't find valid indices
  if (fromIndex === -1 && toIndex === -1) return null;

  // Use found indices, or extend to edges if one is missing
  const x1 = fromIndex !== -1 ? fromIndex : 0;
  const x2 = toIndex !== -1 ? toIndex : ctx.candles.length - 1;

  // Convert opacity (0-1) to hex suffix
  const opacityHex = Math.round(rect.opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return new BoxAnnotation({
    x1: x1 - 0.5, // Align to candle boundaries
    x2: x2 + 0.5,
    y1: 0,
    y2: 1,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.Relative, // 0-1 = full height
    fill: rect.color + opacityHex,
    strokeThickness: 0,
  });
}

/**
 * Creates a box annotation with specific price bounds.
 * Used for session boxes showing high/low range.
 */
function createBoxRectAnnotation(
  rect: BoxRect,
  ctx: AnnotationContext
): BoxAnnotation | null {
  const fromTs = Math.floor(new Date(rect.from).getTime() / 1000);
  const toTs = Math.floor(new Date(rect.to).getTime() / 1000);
  const fromIndex = ctx.findCandleIndex(fromTs);
  const toIndex = ctx.findCandleIndex(toTs);

  // Skip if we can't find valid indices
  if (fromIndex === -1 && toIndex === -1) return null;

  // Use found indices, or extend to edges if one is missing
  const x1 = fromIndex !== -1 ? fromIndex : 0;
  const x2 = toIndex !== -1 ? toIndex : ctx.candles.length - 1;

  // Convert opacity (0-1) to hex suffix
  const opacityHex = Math.round(rect.opacity * 255)
    .toString(16)
    .padStart(2, '0');

  // Border settings
  const hasBorder = rect.border_color && rect.border_color.length > 0;
  const strokeThickness = hasBorder ? 1 : 0;
  const stroke = hasBorder ? rect.border_color : undefined;

  return new BoxAnnotation({
    x1: x1 - 0.5, // Align to candle boundaries
    x2: x2 + 0.5,
    y1: rect.low,
    y2: rect.high,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue, // Use actual price values
    fill: rect.color + opacityHex,
    strokeThickness,
    stroke,
  });
}

/**
 * Creates a horizontal band (BoxAnnotation) spanning the full chart width at a price range.
 * Used for supply/demand zones, support/resistance areas.
 */
function createPriceRangeAnnotation(
  rect: PriceRangeRect,
  ctx: AnnotationContext
): BoxAnnotation | null {
  // If time bounds are provided, use them; otherwise span full chart width
  let x1: number;
  let x2: number;
  let xCoordinateMode: ECoordinateMode;

  if (rect.from && rect.to) {
    const fromTs = Math.floor(new Date(rect.from).getTime() / 1000);
    const toTs = Math.floor(new Date(rect.to).getTime() / 1000);
    const fromIndex = ctx.findCandleIndex(fromTs);
    const toIndex = ctx.findCandleIndex(toTs);

    if (fromIndex === -1 && toIndex === -1) return null;

    x1 = (fromIndex !== -1 ? fromIndex : 0) - 0.5;
    x2 = (toIndex !== -1 ? toIndex : ctx.candles.length - 1) + 0.5;
    xCoordinateMode = ECoordinateMode.DataValue;
  } else {
    // Span full chart width using relative coordinates
    x1 = 0;
    x2 = 1;
    xCoordinateMode = ECoordinateMode.Relative;
  }

  const opacityHex = Math.round(rect.opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return new BoxAnnotation({
    x1,
    x2,
    y1: rect.low,
    y2: rect.high,
    xCoordinateMode,
    yCoordinateMode: ECoordinateMode.DataValue,
    fill: rect.color + opacityHex,
    strokeThickness: 0,
  });
}

/**
 * Creates a vertical line annotation at a specific timestamp.
 * Used for event markers, session boundaries, signal times.
 */
function createVerticalLineAnnotation(
  marker: VerticalLineMarker,
  ctx: AnnotationContext
): VerticalLineAnnotation | null {
  const ts = Math.floor(new Date(marker.time).getTime() / 1000);
  const index = ctx.findCandleIndex(ts);

  if (index === -1) return null;

  return new VerticalLineAnnotation({
    x1: index,
    stroke: marker.color,
    strokeThickness: marker.width,
    strokeDashArray: lineStyleToDash(marker.style),
    showLabel: !!marker.label,
    labelValue: marker.label,
  });
}

/**
 * Creates a horizontal line annotation at a specific price level.
 * Used for support/resistance levels, price targets.
 */
function createHorizontalLineAnnotation(
  marker: HorizontalLineMarker,
  ctx: AnnotationContext
): HorizontalLineAnnotation | null {
  // If time bounds are set, we could limit the line to a range,
  // but HorizontalLineAnnotation spans the full chart width by default.
  // If from/to are set, verify at least one candle exists in that range.
  if (marker.from && marker.to) {
    const fromTs = Math.floor(new Date(marker.from).getTime() / 1000);
    const toTs = Math.floor(new Date(marker.to).getTime() / 1000);
    const fromIndex = ctx.findCandleIndex(fromTs);
    const toIndex = ctx.findCandleIndex(toTs);
    if (fromIndex === -1 && toIndex === -1) return null;
  }

  return new HorizontalLineAnnotation({
    y1: marker.price,
    stroke: marker.color,
    strokeThickness: marker.width,
    strokeDashArray: lineStyleToDash(marker.style),
    showLabel: !!marker.label,
    labelValue: marker.label,
  });
}

/**
 * Creates a point marker (custom SVG annotation) at a specific time and price.
 * Used for signal markers, trade events, alerts.
 */
function createPointMarkerAnnotation(
  marker: PointMarker,
  ctx: AnnotationContext
): CustomAnnotation | null {
  const ts = Math.floor(new Date(marker.time).getTime() / 1000);
  const index = ctx.findCandleIndex(ts);

  if (index === -1) return null;

  const size = marker.size;
  const half = size / 2;

  // Generate SVG based on shape
  let svgContent: string;
  switch (marker.shape) {
    case 'circle':
      svgContent = `<circle cx="${half}" cy="${half}" r="${half}" fill="${marker.color}" />`;
      break;
    case 'square':
      svgContent = `<rect x="0" y="0" width="${size}" height="${size}" fill="${marker.color}" />`;
      break;
    case 'diamond':
      svgContent = `<polygon points="${half},0 ${size},${half} ${half},${size} 0,${half}" fill="${marker.color}" />`;
      break;
    case 'triangle_up':
      svgContent = `<polygon points="${half},0 ${size},${size} 0,${size}" fill="${marker.color}" />`;
      break;
    case 'triangle_down':
      svgContent = `<polygon points="0,0 ${size},0 ${half},${size}" fill="${marker.color}" />`;
      break;
    case 'cross':
      svgContent = `<line x1="${half}" y1="0" x2="${half}" y2="${size}" stroke="${marker.color}" stroke-width="2" />`
        + `<line x1="0" y1="${half}" x2="${size}" y2="${half}" stroke="${marker.color}" stroke-width="2" />`;
      break;
    default:
      svgContent = `<circle cx="${half}" cy="${half}" r="${half}" fill="${marker.color}" />`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgContent}</svg>`;

  return new CustomAnnotation({
    x1: index,
    y1: marker.price,
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
    verticalAnchorPoint: EVerticalAnchorPoint.Center,
    svgString: svg,
  });
}

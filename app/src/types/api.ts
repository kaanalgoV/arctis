// Ported from AlgoView CandlestickChart
// Stub type definitions for API-related types used by chart components.

// ============ Line & Render Types ============

/** Line style for lines and borders */
export type LineStyle = 'solid' | 'dashed' | 'dotted';

/** Z-order for render instructions */
export type RenderLayer = 'background' | 'foreground';

/** Marker shape for point markers */
export type MarkerShape = 'circle' | 'square' | 'diamond' | 'triangle_up' | 'triangle_down' | 'cross';

/** A rectangle spanning a time range (full price height) */
export interface TimeRangeRect {
  type: 'time_range';
  id: string;
  from: string;
  to: string;
  color: string;
  opacity: number;
  label?: string;
  layer: RenderLayer;
}

/** A rectangle spanning a price range */
export interface PriceRangeRect {
  type: 'price_range';
  id: string;
  high: number;
  low: number;
  from?: string;
  to?: string;
  color: string;
  opacity: number;
  label?: string;
  layer: RenderLayer;
}

/** A rectangle with both time and price boundaries */
export interface BoxRect {
  type: 'box';
  id: string;
  from: string;
  to: string;
  high: number;
  low: number;
  color: string;
  opacity: number;
  border_color?: string;
  label?: string;
  layer: RenderLayer;
}

/** A vertical line at a specific timestamp */
export interface VerticalLineMarker {
  type: 'vertical_line';
  id: string;
  time: string;
  color: string;
  width: number;
  style: LineStyle;
  label?: string;
}

/** A horizontal line at a specific price level */
export interface HorizontalLineMarker {
  type: 'horizontal_line';
  id: string;
  price: number;
  from?: string;
  to?: string;
  color: string;
  width: number;
  style: LineStyle;
  label?: string;
}

/** A point marker at a specific time and price */
export interface PointMarker {
  type: 'marker';
  id: string;
  time: string;
  price: number;
  color: string;
  shape: MarkerShape;
  size: number;
  label?: string;
}

/** Discriminated union of all render instructions */
export type RenderInstruction =
  | TimeRangeRect
  | PriceRangeRect
  | BoxRect
  | VerticalLineMarker
  | HorizontalLineMarker
  | PointMarker;

// ============ Indicator Data Types ============

export interface IndicatorPoint {
  ts: string;
  render?: RenderInstruction[];
  [key: string]: number | string | RenderInstruction[] | undefined;
}

export interface IndicatorResult {
  id: string;
  series: string[];
  values: IndicatorPoint[];
}

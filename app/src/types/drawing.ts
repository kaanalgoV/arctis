// Ported from AlgoView CandlestickChart - Arctic Frost theme

import type { LineStyle } from './api';

// ============ Drawing Tool Types ============

/** All available drawing tools */
export type DrawingToolType =
  | 'crosshair'
  | 'trendline'
  | 'hline'
  | 'vline'
  | 'rectangle'
  | 'text'
  | 'measure'
  | 'fibRetracement'
  | 'fibExtension'
  | 'trendChannel'
  | 'pitchfork'
  | 'location';

/** Serializable drawing object stored per chart */
export interface ChartDrawing {
  id: string; // UUID

  type: DrawingToolType;

  // Start point (data coordinates: candle index + price)
  x1: number;
  y1: number;

  // Optional end point for two-point tools (trendline, rectangle, measure, fib)
  x2?: number;
  y2?: number;

  // Optional third point for three-point tools (trendChannel, pitchfork)
  x3?: number;
  y3?: number;

  // Appearance
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
  opacity: number; // 0-1

  // Text tool properties
  text?: string;
  fontSize?: number;

  // Fibonacci retracement levels (e.g. [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1])
  levels?: number[];

  // Fill/border customization (rectangle, location)
  fillColor?: string;
  fillOpacity?: number; // 0-1
  borderColor?: string;
  borderWidth?: number;

  // State
  locked: boolean;
  visible: boolean;
  createdAt: string; // ISO 8601
}

/** Drawing in progress before user finishes placing */
export interface WipDrawing {
  type: DrawingToolType;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  x3?: number;
  y3?: number;
  clickCount: number;
}

/** Payload for persisting drawings to backend */
export interface DrawingSavePayload {
  symbol: string;
  timeframe: string;
  drawings: ChartDrawing[];
}

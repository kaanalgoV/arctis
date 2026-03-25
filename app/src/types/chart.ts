// Ported from AlgoView CandlestickChart - Arctic Frost theme

import type { LineStyle } from './api';

// ============ Chart Type ============

export type ChartType = 'candlestick' | 'ohlc' | 'line' | 'area' | 'heikinAshi';

// ============ Trade Marker Types ============

/** Trade marker for chart annotations */
export interface TradeMarker {
  time: number;                              // Unix timestamp in seconds
  price: number;                             // Exact price level for marker tip
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  shape: 'triangleUp' | 'triangleDown';
  tradeId: number;
  type: 'entry' | 'exit';
  side: 'long' | 'short';
}

/** Single SL/TP change event for trailing stop visualization */
export interface SlTpHistoryPoint {
  /** Unix timestamp in seconds when the change occurred */
  time: number;
  /** New SL price (undefined if unchanged) */
  slPrice?: number;
  /** New TP price (undefined if unchanged) */
  tpPrice?: number;
  /** Reason for change: INITIAL, BREAK_EVEN, TRAILING, MANUAL */
  reason: string;
}

/** Trade zone rectangle showing price movement from entry to exit */
export interface TradeZone {
  tradeId: number;
  entryTime: number;           // Unix timestamp in seconds
  exitTime: number;            // Unix timestamp in seconds
  entryPrice: number;
  exitPrice: number;
  side: 'long' | 'short';
  isProfitable: boolean;
  // SL/TP zone data (when available from API)
  initialSl: number | null;
  initialTp: number | null;
  finalSl: number | null;
  finalTp: number | null;
  // Tick distance calculations (requires tick_size)
  ticksToSl: number | null;    // Distance from entry to initial SL in ticks
  ticksToTp: number | null;    // Distance from entry to initial TP in ticks
  // SL/TP history for trailing stop visualization
  slTpHistory: SlTpHistoryPoint[];
}

// ============ Recharts Tooltip Types ============

/**
 * Payload entry provided by Recharts to custom tooltip callbacks.
 * Covers LineChart, BarChart, AreaChart, ComposedChart, and ScatterChart.
 */
export interface RechartsPayloadEntry<T = Record<string, unknown>> {
  value: number;
  name: string;
  color: string;
  dataKey: string;
  payload: T;
}

/**
 * Props injected by Recharts into a custom `content` tooltip component.
 * Use as: `function MyTooltip(props: RechartsTooltipProps<MyDataType>)`
 */
export interface RechartsTooltipProps<T = Record<string, unknown>> {
  active?: boolean;
  payload?: RechartsPayloadEntry<T>[];
  label?: string | number;
}

/** Recharts data format for equity */
export interface EquityChartData {
  timestamp: number;
  date: string;
  equity: number;
  drawdown: number;
}

/** Recharts data format for PnL histogram */
export interface PnlHistogramData {
  bucket: string;
  count: number;
  color: string;
}

// ============ Indicator Types for Chart ============

export interface IndicatorStyle {
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
  visible: boolean;
}

export interface ActiveIndicator {
  key: string;
  id: string;
  params: Record<string, number | boolean | string>;
  label: string;
  style: IndicatorStyle;
}

/** Default indicator colors — Arctic Frost: ema uses ice blue instead of green */
export const INDICATOR_COLORS = {
  sma: '#3b82f6',       // Blue
  ema: '#5CB8F0',       // Arctic Frost ice blue (was #008757 green in AlgoView)
  vwap: '#f59e0b',      // Amber
  bollinger: '#8b5cf6', // Purple
  session_levels: '#ec4899',  // Pink
  session_hl: '#f97316',      // Orange - Current session high/low (evolving)
  prev_day_hl: '#06b6d4',     // Cyan - Previous day high/low (static reference lines)
} as const;

/** Default style for new indicators */
export const DEFAULT_INDICATOR_STYLE: IndicatorStyle = {
  color: '#3b82f6',
  lineWidth: 2,
  lineStyle: 'solid',
  visible: true,
};
